/**
 * SecurityMiddleware Unit Tests
 * Tests pattern detection functions for security threats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityMiddleware, ATTACK_TYPES } from './SecurityMiddleware.js';

describe('SecurityMiddleware', () => {
    let middleware;

    beforeEach(() => {
        middleware = new SecurityMiddleware({
            enableLogging: false // Disable logging for tests
        });
    });

    describe('_hasPathTraversal', () => {
        it('should detect basic path traversal patterns', () => {
            expect(middleware._hasPathTraversal('../etc/passwd')).toBe(true);
            expect(middleware._hasPathTraversal('..\\windows\\system32')).toBe(true);
            expect(middleware._hasPathTraversal('/api/../../../etc/passwd')).toBe(true);
        });

        it('should detect URL encoded path traversal', () => {
            expect(middleware._hasPathTraversal('%2e%2e%2f')).toBe(true);
            expect(middleware._hasPathTraversal('%2e%2e/')).toBe(true);
            expect(middleware._hasPathTraversal('..%2f')).toBe(true);
        });

        it('should allow normal paths', () => {
            expect(middleware._hasPathTraversal('/api/users')).toBe(false);
            expect(middleware._hasPathTraversal('/dashboard')).toBe(false);
            expect(middleware._hasPathTraversal('/api/v1/cards')).toBe(false);
        });

        it('should handle null/undefined paths', () => {
            expect(middleware._hasPathTraversal(null)).toBe(false);
            expect(middleware._hasPathTraversal(undefined)).toBe(false);
            expect(middleware._hasPathTraversal('')).toBe(false);
        });
    });

    describe('_hasSensitiveExtension', () => {
        it('should detect sensitive file extensions', () => {
            expect(middleware._hasSensitiveExtension('/.env')).toBe(true);
            expect(middleware._hasSensitiveExtension('/config/.env')).toBe(true);
            expect(middleware._hasSensitiveExtension('/.git/config')).toBe(true);
            expect(middleware._hasSensitiveExtension('/backup.sql')).toBe(true);
            expect(middleware._hasSensitiveExtension('/app.log')).toBe(true);
            expect(middleware._hasSensitiveExtension('/database.bak')).toBe(true);
        });

        it('should detect git directory access', () => {
            expect(middleware._hasSensitiveExtension('/.git/')).toBe(true);
            expect(middleware._hasSensitiveExtension('/.git/HEAD')).toBe(true);
            expect(middleware._hasSensitiveExtension('/.git/objects/')).toBe(true);
        });

        it('should allow normal file paths', () => {
            expect(middleware._hasSensitiveExtension('/api/users')).toBe(false);
            expect(middleware._hasSensitiveExtension('/images/logo.png')).toBe(false);
            expect(middleware._hasSensitiveExtension('/styles/main.css')).toBe(false);
            expect(middleware._hasSensitiveExtension('/scripts/app.js')).toBe(false);
        });

        it('should handle null/undefined paths', () => {
            expect(middleware._hasSensitiveExtension(null)).toBe(false);
            expect(middleware._hasSensitiveExtension(undefined)).toBe(false);
            expect(middleware._hasSensitiveExtension('')).toBe(false);
        });
    });

    describe('_hasSQLInjection', () => {
        it('should detect SQL injection patterns', () => {
            expect(middleware._hasSQLInjection({ q: "' OR 1=1 --" })).toBe(true);
            expect(middleware._hasSQLInjection({ q: "'; DROP TABLE users; --" })).toBe(true);
            expect(middleware._hasSQLInjection({ q: "SELECT * FROM users" })).toBe(true);
            expect(middleware._hasSQLInjection({ q: "UNION SELECT password FROM users" })).toBe(true);
        });

        it('should detect OR/AND injection', () => {
            expect(middleware._hasSQLInjection({ id: "1 OR 1=1" })).toBe(true);
            expect(middleware._hasSQLInjection({ id: "1 AND 1=1" })).toBe(true);
        });

        it('should allow normal query params', () => {
            expect(middleware._hasSQLInjection({ search: 'hello world' })).toBe(false);
            expect(middleware._hasSQLInjection({ page: '1' })).toBe(false);
            expect(middleware._hasSQLInjection({ filter: 'active' })).toBe(false);
        });

        it('should handle nested objects', () => {
            expect(middleware._hasSQLInjection({ 
                user: { name: "'; DROP TABLE users; --" } 
            })).toBe(true);
        });

        it('should handle null/undefined params', () => {
            expect(middleware._hasSQLInjection(null)).toBe(false);
            expect(middleware._hasSQLInjection(undefined)).toBe(false);
            expect(middleware._hasSQLInjection({})).toBe(false);
        });
    });

    describe('_hasXSSPattern', () => {
        it('should detect script tags', () => {
            expect(middleware._hasXSSPattern({ q: '<script>alert(1)</script>' })).toBe(true);
            expect(middleware._hasXSSPattern({ q: '<SCRIPT>alert(1)</SCRIPT>' })).toBe(true);
        });

        it('should detect javascript protocol', () => {
            expect(middleware._hasXSSPattern({ url: 'javascript:alert(1)' })).toBe(true);
        });

        it('should detect event handlers', () => {
            expect(middleware._hasXSSPattern({ q: '<img onerror=alert(1)>' })).toBe(true);
            expect(middleware._hasXSSPattern({ q: '<div onclick=alert(1)>' })).toBe(true);
            expect(middleware._hasXSSPattern({ q: '<body onload=alert(1)>' })).toBe(true);
        });

        it('should detect iframe injection', () => {
            expect(middleware._hasXSSPattern({ q: '<iframe src="evil.com">' })).toBe(true);
        });

        it('should allow normal text', () => {
            expect(middleware._hasXSSPattern({ q: 'Hello World' })).toBe(false);
            expect(middleware._hasXSSPattern({ q: 'This is a test' })).toBe(false);
            expect(middleware._hasXSSPattern({ q: 'user@example.com' })).toBe(false);
        });

        it('should handle null/undefined params', () => {
            expect(middleware._hasXSSPattern(null)).toBe(false);
            expect(middleware._hasXSSPattern(undefined)).toBe(false);
            expect(middleware._hasXSSPattern({})).toBe(false);
        });
    });

    describe('protect() middleware', () => {
        let mockReq;
        let mockRes;
        let mockNext;

        beforeEach(() => {
            mockReq = {
                path: '/api/users',
                url: '/api/users',
                query: {},
                body: {},
                headers: {},
                connection: { remoteAddress: '127.0.0.1' }
            };
            mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis()
            };
            mockNext = vi.fn();
        });

        it('should call next() for safe requests', async () => {
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should block path traversal and return 403', async () => {
            mockReq.path = '/../../../etc/passwd';
            
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'ERROR',
                code: 'FORBIDDEN',
                message: 'Access denied'
            });
        });

        it('should block sensitive file access and return 403', async () => {
            mockReq.path = '/.env';
            
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should block SQL injection and return 403', async () => {
            mockReq.query = { id: "1 OR 1=1" };
            
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should block XSS and return 403', async () => {
            mockReq.query = { q: '<script>alert(1)</script>' };
            
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should not reveal specific security rule in error response', async () => {
            mockReq.path = '/../../../etc/passwd';
            
            const protectMiddleware = middleware.protect();
            await protectMiddleware(mockReq, mockRes, mockNext);
            
            const response = mockRes.json.mock.calls[0][0];
            expect(response.message).toBe('Access denied');
            expect(response.message).not.toContain('traversal');
            expect(response.message).not.toContain('injection');
            expect(response.message).not.toContain('XSS');
        });
    });

    describe('_logSecurityEvent', () => {
        it('should log security events to database when supabase is configured', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    insert: mockInsert
                })
            };

            const middlewareWithDb = new SecurityMiddleware({
                supabase: mockSupabase,
                enableLogging: true
            });

            const mockReq = {
                originalUrl: '/test/path',
                headers: {
                    'user-agent': 'Test Agent',
                    'x-forwarded-for': '192.168.1.1'
                }
            };

            await middlewareWithDb._logSecurityEvent(mockReq, ATTACK_TYPES.PATH_TRAVERSAL);

            expect(mockSupabase.from).toHaveBeenCalledWith('security_logs');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                ip_address: '192.168.1.1',
                path: '/test/path',
                attack_type: 'path_traversal',
                user_agent: 'Test Agent'
            }));
        });

        it('should not log when logging is disabled', async () => {
            const mockSupabase = {
                from: vi.fn()
            };

            const middlewareNoLog = new SecurityMiddleware({
                supabase: mockSupabase,
                enableLogging: false
            });

            await middlewareNoLog._logSecurityEvent({}, ATTACK_TYPES.XSS);

            expect(mockSupabase.from).not.toHaveBeenCalled();
        });
    });
});
