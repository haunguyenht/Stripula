import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalErrorHandler } from './GlobalErrorHandler.js';

describe('GlobalErrorHandler', () => {
    let handler;
    let mockErrorReporter;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Mock ErrorReporter
        mockErrorReporter = {
            reportError: vi.fn().mockResolvedValue({ errorId: 'ERR-TEST1234', reported: true })
        };

        // Create handler instance
        handler = new GlobalErrorHandler({
            errorReporter: mockErrorReporter
        });

        // Mock request
        mockReq = {
            method: 'GET',
            originalUrl: '/api/test',
            headers: {
                'user-agent': 'test-agent'
            },
            user: null
        };

        // Mock response
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            headersSent: false
        };

        // Mock next
        mockNext = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('handle()', () => {
        it('should return a middleware function', () => {
            const middleware = handler.handle();
            expect(typeof middleware).toBe('function');
        });

        it('should call next if headers already sent', async () => {
            mockRes.headersSent = true;
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should report error to ErrorReporter', async () => {
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            expect(mockErrorReporter.reportError).toHaveBeenCalledWith(error, {
                req: mockReq,
                user: null
            });
        });

        it('should return 500 status for generic errors', async () => {
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it('should include errorId in response for 500 errors', async () => {
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        errorId: 'ERR-TEST1234'
                    })
                })
            );
        });

        it('should handle errors when ErrorReporter fails', async () => {
            mockErrorReporter.reportError.mockRejectedValue(new Error('Reporter failed'));
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            // Should still return a response with a fallback error ID
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        errorId: expect.stringMatching(/^ERR-/)
                    })
                })
            );
        });

        it('should work without ErrorReporter', async () => {
            handler = new GlobalErrorHandler(); // No error reporter
            const middleware = handler.handle();
            const error = new Error('Test error');

            await middleware(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        errorId: expect.stringMatching(/^ERR-/)
                    })
                })
            );
        });
    });

    describe('_formatResponse()', () => {
        it('should return consistent JSON error format', () => {
            const error = new Error('Test error');
            const { status, body } = handler._formatResponse(error, mockReq, 'ERR-12345678');

            expect(body).toHaveProperty('status', 'ERROR');
            expect(body).toHaveProperty('error');
            expect(body.error).toHaveProperty('code');
            expect(body.error).toHaveProperty('type');
            expect(body.error).toHaveProperty('message');
        });

        it('should include errorId for 500 errors', () => {
            const error = new Error('Server error');
            const { body } = handler._formatResponse(error, mockReq, 'ERR-12345678');

            expect(body.error.errorId).toBe('ERR-12345678');
        });

        it('should NOT include errorId for 4xx errors', () => {
            const error = { name: 'NotFoundError', message: 'Not found', status: 404 };
            const { body } = handler._formatResponse(error, mockReq, 'ERR-12345678');

            expect(body.error.errorId).toBeUndefined();
        });

        it('should return generic message for 500 errors in production', () => {
            // Simulate production mode
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            handler = new GlobalErrorHandler({ errorReporter: mockErrorReporter });

            const error = new Error('Sensitive database error details');
            const { body } = handler._formatResponse(error, mockReq, 'ERR-12345678');

            expect(body.error.message).toBe('Something went wrong. Please try again later.');
            expect(body.error.stack).toBeUndefined();
            expect(body.error.details).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('_getStatusCode()', () => {
        it('should use explicit status code from error', () => {
            const error = { status: 403, message: 'Forbidden' };
            expect(handler._getStatusCode(error)).toBe(403);
        });

        it('should use statusCode property', () => {
            const error = { statusCode: 404, message: 'Not found' };
            expect(handler._getStatusCode(error)).toBe(404);
        });

        it('should detect ValidationError', () => {
            const error = { name: 'ValidationError', message: 'Invalid input' };
            expect(handler._getStatusCode(error)).toBe(400);
        });

        it('should detect UnauthorizedError', () => {
            const error = { name: 'UnauthorizedError', message: 'Not authenticated' };
            expect(handler._getStatusCode(error)).toBe(401);
        });

        it('should detect ForbiddenError', () => {
            const error = { name: 'ForbiddenError', message: 'Access denied' };
            expect(handler._getStatusCode(error)).toBe(403);
        });

        it('should detect NotFoundError', () => {
            const error = { name: 'NotFoundError', message: 'Resource not found' };
            expect(handler._getStatusCode(error)).toBe(404);
        });

        it('should default to 500 for unknown errors', () => {
            const error = new Error('Unknown error');
            expect(handler._getStatusCode(error)).toBe(500);
        });
    });

    describe('_getErrorType()', () => {
        it('should use error name if meaningful', () => {
            const error = { name: 'ValidationError', message: 'Invalid' };
            expect(handler._getErrorType(error, 400)).toBe('ValidationError');
        });

        it('should map status codes to types', () => {
            expect(handler._getErrorType({ name: 'Error' }, 400)).toBe('BadRequest');
            expect(handler._getErrorType({ name: 'Error' }, 401)).toBe('Unauthorized');
            expect(handler._getErrorType({ name: 'Error' }, 403)).toBe('Forbidden');
            expect(handler._getErrorType({ name: 'Error' }, 404)).toBe('NotFound');
            expect(handler._getErrorType({ name: 'Error' }, 429)).toBe('TooManyRequests');
            expect(handler._getErrorType({ name: 'Error' }, 500)).toBe('InternalServerError');
        });
    });

    describe('_getUserFriendlyMessage()', () => {
        it('should return generic message for 500 in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            handler = new GlobalErrorHandler();

            const error = new Error('Database connection failed');
            const message = handler._getUserFriendlyMessage(error, 500);

            expect(message).toBe('Something went wrong. Please try again later.');

            process.env.NODE_ENV = originalEnv;
        });

        it('should return specific messages for client errors', () => {
            expect(handler._getUserFriendlyMessage({}, 400)).toContain('Invalid request');
            expect(handler._getUserFriendlyMessage({}, 401)).toContain('Authentication required');
            expect(handler._getUserFriendlyMessage({}, 403)).toContain('Access denied');
            expect(handler._getUserFriendlyMessage({}, 404)).toContain('not found');
            expect(handler._getUserFriendlyMessage({}, 429)).toContain('Too many requests');
        });
    });

    describe('notFoundHandler()', () => {
        it('should return a middleware function', () => {
            const middleware = handler.notFoundHandler();
            expect(typeof middleware).toBe('function');
        });

        it('should return 404 status', () => {
            const middleware = handler.notFoundHandler();
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return JSON response', () => {
            const middleware = handler.notFoundHandler();
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'ERROR',
                    error: expect.objectContaining({
                        code: 404,
                        type: 'NotFoundError'
                    })
                })
            );
        });
    });

    describe('forbiddenResponse()', () => {
        it('should return 403 status and body', () => {
            const response = handler.forbiddenResponse();

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe(403);
            expect(response.body.error.type).toBe('Forbidden');
        });

        it('should use custom message if provided', () => {
            const response = handler.forbiddenResponse('Custom forbidden message');

            expect(response.body.error.message).toBe('Custom forbidden message');
        });

        it('should use default message if not provided', () => {
            const response = handler.forbiddenResponse();

            expect(response.body.error.message).toContain('Access denied');
        });
    });

    describe('API Error Response Consistency (Requirement 7.1, 7.2)', () => {
        it('should always include status, error.code, error.type, error.message', async () => {
            const middleware = handler.handle();
            const errors = [
                new Error('Generic error'),
                { name: 'ValidationError', message: 'Invalid input' },
                { name: 'NotFoundError', message: 'Not found', status: 404 },
                { name: 'ForbiddenError', message: 'Forbidden', status: 403 }
            ];

            for (const error of errors) {
                mockRes.json.mockClear();
                mockRes.status.mockClear();

                await middleware(error, mockReq, mockRes, mockNext);

                const jsonCall = mockRes.json.mock.calls[0][0];
                expect(jsonCall).toHaveProperty('status');
                expect(jsonCall).toHaveProperty('error.code');
                expect(jsonCall).toHaveProperty('error.type');
                expect(jsonCall).toHaveProperty('error.message');
            }
        });
    });
});
