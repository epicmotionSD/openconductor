"use strict";
/**
 * OpenConductor Request Logging Middleware
 *
 * Comprehensive request/response logging with performance metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoggingMiddleware = createLoggingMiddleware;
exports.createAccessLogMiddleware = createAccessLogMiddleware;
exports.createSecurityLogMiddleware = createSecurityLogMiddleware;
exports.createAuditLogMiddleware = createAuditLogMiddleware;
/**
 * Create request logging middleware
 */
function createLoggingMiddleware(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        const requestId = generateRequestId();
        // Attach request ID to request for tracking
        req.requestId = requestId;
        // Create initial request log
        const requestLog = {
            requestId,
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: getClientIP(req),
            userId: req.user?.id,
            startTime: new Date(startTime)
        };
        // Log request start
        logger.info('Request started', {
            requestId,
            method: req.method,
            url: req.url,
            ip: requestLog.ip,
            userAgent: requestLog.userAgent,
            userId: requestLog.userId,
            contentLength: req.get('Content-Length'),
            contentType: req.get('Content-Type')
        });
        // Capture original send function
        const originalSend = res.send;
        const originalJson = res.json;
        // Override res.send to capture response
        res.send = function (body) {
            captureResponse(body);
            return originalSend.call(this, body);
        };
        // Override res.json to capture response
        res.json = function (body) {
            captureResponse(body);
            return originalJson.call(this, body);
        };
        function captureResponse(body) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            requestLog.endTime = new Date(endTime);
            requestLog.duration = duration;
            requestLog.statusCode = res.statusCode;
            requestLog.responseSize = Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body));
            // Log request completion
            const logLevel = determineLogLevel(res.statusCode, duration);
            const logData = {
                requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                responseSize: `${requestLog.responseSize} bytes`,
                userId: requestLog.userId,
                ip: requestLog.ip
            };
            if (logLevel === 'error') {
                logger.error('Request completed with error', logData);
            }
            else if (logLevel === 'warn') {
                logger.warn('Request completed with warning', logData);
            }
            else {
                logger.info('Request completed', logData);
            }
            // Log detailed timing for slow requests
            if (duration > 1000) {
                logger.warn('Slow request detected', {
                    ...logData,
                    warning: 'Request took longer than 1 second'
                });
            }
            // Log large responses
            if (requestLog.responseSize && requestLog.responseSize > 1024 * 1024) {
                logger.warn('Large response detected', {
                    ...logData,
                    warning: 'Response size exceeds 1MB'
                });
            }
        }
        // Handle response finish event
        res.on('finish', () => {
            if (!requestLog.endTime) {
                captureResponse('');
            }
        });
        // Handle response close event (for aborted requests)
        res.on('close', () => {
            if (!requestLog.endTime) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                logger.warn('Request aborted', {
                    requestId,
                    method: req.method,
                    url: req.url,
                    duration: `${duration}ms`,
                    statusCode: res.statusCode || 0,
                    userId: requestLog.userId,
                    ip: requestLog.ip,
                    reason: 'Connection closed by client'
                });
            }
        });
        next();
    };
}
/**
 * Generate unique request ID
 */
function generateRequestId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `req_${timestamp}_${random}`;
}
/**
 * Get client IP address
 */
function getClientIP(req) {
    return (req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        'unknown');
}
/**
 * Determine log level based on status code and duration
 */
function determineLogLevel(statusCode, duration) {
    if (statusCode >= 500) {
        return 'error';
    }
    if (statusCode >= 400 || duration > 5000) {
        return 'warn';
    }
    return 'info';
}
/**
 * Create access log middleware for file logging
 */
function createAccessLogMiddleware(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: getClientIP(req),
                userAgent: req.get('User-Agent') || '-',
                referer: req.get('Referer') || '-',
                contentLength: res.get('Content-Length') || '-',
                userId: req.user?.id || '-'
            };
            // Format as Common Log Format (CLF) style
            const accessLog = `${logEntry.ip} - ${logEntry.userId} [${logEntry.timestamp}] "${req.method} ${req.url} HTTP/1.1" ${res.statusCode} ${logEntry.contentLength} "${logEntry.referer}" "${logEntry.userAgent}" ${duration}ms`;
            logger.info(accessLog, { type: 'access_log' });
        });
        next();
    };
}
/**
 * Create security log middleware for security events
 */
function createSecurityLogMiddleware(logger) {
    return (req, res, next) => {
        const securityEvents = [];
        // Check for potential security issues
        // Suspicious user agents
        const userAgent = req.get('User-Agent') || '';
        if (isSuspiciousUserAgent(userAgent)) {
            securityEvents.push('suspicious_user_agent');
        }
        // Multiple failed authentication attempts
        if (res.statusCode === 401) {
            securityEvents.push('authentication_failed');
        }
        // Access to sensitive endpoints without proper auth
        if (req.path.includes('/admin') && res.statusCode === 403) {
            securityEvents.push('unauthorized_admin_access');
        }
        // Large request bodies (potential DoS)
        const contentLength = parseInt(req.get('Content-Length') || '0');
        if (contentLength > 10 * 1024 * 1024) { // 10MB
            securityEvents.push('large_request_body');
        }
        // SQL injection patterns in query parameters
        const queryString = JSON.stringify(req.query);
        if (containsSQLInjectionPatterns(queryString)) {
            securityEvents.push('potential_sql_injection');
        }
        // Log security events
        if (securityEvents.length > 0) {
            logger.warn('Security event detected', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                ip: getClientIP(req),
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
                events: securityEvents,
                statusCode: res.statusCode
            });
        }
        next();
    };
}
/**
 * Check for suspicious user agents
 */
function isSuspiciousUserAgent(userAgent) {
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scanner/i,
        /wget/i,
        /curl/i,
        /python/i,
        /java/i,
        /go-http-client/i,
        /http_request/i,
        /sqlmap/i,
        /nmap/i,
        /masscan/i,
        /zap/i,
        /burp/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}
/**
 * Check for SQL injection patterns
 */
function containsSQLInjectionPatterns(input) {
    const sqlPatterns = [
        /union\s+select/i,
        /select\s+.*\s+from/i,
        /insert\s+into/i,
        /update\s+.*\s+set/i,
        /delete\s+from/i,
        /drop\s+table/i,
        /alter\s+table/i,
        /create\s+table/i,
        /exec\s*\(/i,
        /execute\s*\(/i,
        /sp_executesql/i,
        /xp_cmdshell/i,
        /script\s*>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
}
/**
 * Create audit log middleware for sensitive operations
 */
function createAuditLogMiddleware(logger) {
    return (req, res, next) => {
        // Track sensitive operations
        const sensitiveOperations = [
            { method: 'POST', path: '/agents', action: 'create_agent' },
            { method: 'DELETE', path: '/agents/', action: 'delete_agent' },
            { method: 'POST', path: '/workflows', action: 'create_workflow' },
            { method: 'DELETE', path: '/workflows/', action: 'delete_workflow' },
            { method: 'POST', path: '/tools', action: 'register_tool' },
            { method: 'DELETE', path: '/tools/', action: 'unregister_tool' },
            { method: 'POST', path: '/plugins', action: 'install_plugin' },
            { method: 'DELETE', path: '/plugins/', action: 'remove_plugin' }
        ];
        const operation = sensitiveOperations.find(op => req.method === op.method && req.path.includes(op.path));
        if (operation) {
            // Log before operation
            logger.info('Sensitive operation started', {
                requestId: req.requestId,
                action: operation.action,
                method: req.method,
                path: req.path,
                userId: req.user?.id,
                ip: getClientIP(req),
                timestamp: new Date().toISOString()
            });
            // Log after operation
            res.on('finish', () => {
                logger.info('Sensitive operation completed', {
                    requestId: req.requestId,
                    action: operation.action,
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    success: res.statusCode < 400,
                    userId: req.user?.id,
                    ip: getClientIP(req),
                    timestamp: new Date().toISOString()
                });
            });
        }
        next();
    };
}
//# sourceMappingURL=logging.js.map