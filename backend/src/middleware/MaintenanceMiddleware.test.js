import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaintenanceMiddleware } from './MaintenanceMiddleware.js';

describe('MaintenanceMiddleware', () => {
    let middleware;
    let mockMaintenanceService;
    let mockTelegramAuthService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockMaintenanceService = {
            isEnabled: vi.fn(),
            getStatus: vi.fn()
        };

        mockTelegramAuthService = {
            validateSession: vi.fn()
        };

        middleware = new MaintenanceMiddleware({
            maintenanceService: mockMaintenanceService,
            telegramAuthService: mockTelegramAuthService
        });

        mockReq = {
            user: null,
            cookies: {}
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        mockNext = vi.fn();
    });

    describe('check() - HTML middleware', () => {
        it('should call next when no maintenance service is configured', async () => {
            const noServiceMiddleware = new MaintenanceMiddleware({});
            const checkMiddleware = noServiceMiddleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should call next when maintenance mode is disabled', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(false);
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 503 with HTML when maintenance is enabled for non-admin users', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Scheduled maintenance',
                estimatedEndTime: null
            });
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', '300');
            expect(mockRes.send).toHaveBeenCalled();
            
            // Verify HTML contains maintenance message
            const htmlContent = mockRes.send.mock.calls[0][0];
            expect(htmlContent).toContain('Under Maintenance');
            expect(htmlContent).toContain('Scheduled maintenance');
        });

        it('should allow admin users to bypass maintenance mode', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Scheduled maintenance',
                estimatedEndTime: null
            });
            mockReq.cookies = { auth_token: 'valid-admin-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue({
                user: { id: '123', is_admin: true }
            });
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            // Admin should bypass maintenance
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.user).toEqual({ id: '123', is_admin: true });
        });

        it('should block non-admin authenticated users during maintenance', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Scheduled maintenance',
                estimatedEndTime: null
            });
            mockReq.cookies = { auth_token: 'valid-user-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue({
                user: { id: '456', is_admin: false }
            });
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            // Non-admin should be blocked
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(503);
        });

        it('should include estimated end time in HTML when provided', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Database upgrade',
                estimatedEndTime: '2026-01-05T15:00:00.000Z'
            });
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            const htmlContent = mockRes.send.mock.calls[0][0];
            expect(htmlContent).toContain('Estimated Return');
            expect(htmlContent).toContain('Database upgrade');
        });

        it('should escape HTML in reason to prevent XSS', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: '<script>alert("xss")</script>',
                estimatedEndTime: null
            });
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            const checkMiddleware = middleware.check();

            await checkMiddleware(mockReq, mockRes, mockNext);

            const htmlContent = mockRes.send.mock.calls[0][0];
            expect(htmlContent).not.toContain('<script>');
            expect(htmlContent).toContain('&lt;script&gt;');
        });
    });

    describe('checkAPI() - JSON middleware', () => {
        it('should call next when no maintenance service is configured', async () => {
            const noServiceMiddleware = new MaintenanceMiddleware({});
            const checkAPIMiddleware = noServiceMiddleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should call next when maintenance mode is disabled', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(false);
            const checkAPIMiddleware = middleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should return 503 with JSON when maintenance is enabled for non-admin users', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Scheduled maintenance',
                estimatedEndTime: '2026-01-05T15:00:00.000Z'
            });
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            const checkAPIMiddleware = middleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', '300');
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'ERROR',
                code: 'SERVICE_UNAVAILABLE',
                message: 'System is currently under maintenance',
                maintenance: {
                    enabled: true,
                    reason: 'Scheduled maintenance',
                    estimatedEndTime: '2026-01-05T15:00:00.000Z'
                }
            });
        });

        it('should allow admin users to bypass maintenance mode', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Maintenance',
                estimatedEndTime: null
            });
            mockReq.cookies = { auth_token: 'valid-admin-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue({
                user: { id: '123', is_admin: true }
            });
            const checkAPIMiddleware = middleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            // Admin should bypass maintenance
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockReq.user).toEqual({ id: '123', is_admin: true });
        });

        it('should block non-admin authenticated users during maintenance', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: 'Maintenance',
                estimatedEndTime: null
            });
            mockReq.cookies = { auth_token: 'valid-user-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue({
                user: { id: '456', is_admin: false }
            });
            const checkAPIMiddleware = middleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            // Non-admin should be blocked
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(503);
        });

        it('should use default reason when none provided', async () => {
            mockMaintenanceService.isEnabled.mockReturnValue(true);
            mockMaintenanceService.getStatus.mockReturnValue({
                enabled: true,
                reason: null,
                estimatedEndTime: null
            });
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            const checkAPIMiddleware = middleware.checkAPI();

            await checkAPIMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'ERROR',
                code: 'SERVICE_UNAVAILABLE',
                message: 'System is currently under maintenance',
                maintenance: {
                    enabled: true,
                    reason: 'Scheduled maintenance',
                    estimatedEndTime: null
                }
            });
        });
    });

    describe('_extractUserFromToken()', () => {
        it('should return null when no telegramAuthService is configured', async () => {
            const noAuthMiddleware = new MaintenanceMiddleware({
                maintenanceService: mockMaintenanceService
            });
            
            const result = await noAuthMiddleware._extractUserFromToken(mockReq);
            
            expect(result).toBeNull();
        });

        it('should return null when no auth_token cookie exists', async () => {
            mockReq.cookies = {};
            
            const result = await middleware._extractUserFromToken(mockReq);
            
            expect(result).toBeNull();
            expect(mockTelegramAuthService.validateSession).not.toHaveBeenCalled();
        });

        it('should return user when token is valid', async () => {
            mockReq.cookies = { auth_token: 'valid-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue({
                user: { id: '123', is_admin: true }
            });
            
            const result = await middleware._extractUserFromToken(mockReq);
            
            expect(result).toEqual({ id: '123', is_admin: true });
            expect(mockTelegramAuthService.validateSession).toHaveBeenCalledWith('valid-token');
        });

        it('should return null when token validation fails', async () => {
            mockReq.cookies = { auth_token: 'invalid-token' };
            mockTelegramAuthService.validateSession.mockRejectedValue(new Error('Invalid token'));
            
            const result = await middleware._extractUserFromToken(mockReq);
            
            expect(result).toBeNull();
        });

        it('should return null when validateSession returns null', async () => {
            mockReq.cookies = { auth_token: 'expired-token' };
            mockTelegramAuthService.validateSession.mockResolvedValue(null);
            
            const result = await middleware._extractUserFromToken(mockReq);
            
            expect(result).toBeNull();
        });
    });

    describe('_escapeHtml()', () => {
        it('should escape HTML special characters', () => {
            const result = middleware._escapeHtml('<script>alert("test")</script>');
            expect(result).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
        });

        it('should handle ampersands', () => {
            const result = middleware._escapeHtml('Tom & Jerry');
            expect(result).toBe('Tom &amp; Jerry');
        });

        it('should handle single quotes', () => {
            const result = middleware._escapeHtml("It's working");
            expect(result).toBe('It&#39;s working');
        });

        it('should return empty string for null/undefined', () => {
            expect(middleware._escapeHtml(null)).toBe('');
            expect(middleware._escapeHtml(undefined)).toBe('');
        });

        it('should convert non-strings to strings', () => {
            expect(middleware._escapeHtml(123)).toBe('123');
        });
    });
});
