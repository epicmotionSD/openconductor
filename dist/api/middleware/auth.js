"use strict";
/**
 * OpenConductor Authentication Middleware
 *
 * Comprehensive authentication system supporting multiple strategies:
 * - API Keys
 * - JWT Tokens
 * - OAuth2
 * - Basic Authentication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
exports.generateJWT = generateJWT;
exports.verifyJWT = verifyJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Create authentication middleware
 */
function createAuthMiddleware(authConfig, logger, errorManager) {
    return async (req, res, next) => {
        // Skip auth for health checks and docs
        if (req.path === '/health' || req.path.startsWith('/docs')) {
            return next();
        }
        try {
            const authResult = await authenticate(req, authConfig, logger);
            if (!authResult.success) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_FAILED',
                        message: authResult.message || 'Authentication required'
                    }
                });
            }
            // Attach auth context to request
            req.user = authResult.user;
            req.permissions = authResult.permissions || [];
            // RBAC authorization check
            if (authConfig.rbac.enabled) {
                const hasPermission = checkPermissions(req.method, req.path, req.permissions, authConfig.rbac.roles);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_PERMISSIONS',
                            message: 'Insufficient permissions for this operation'
                        }
                    });
                }
            }
            logger.debug('Authentication successful', {
                userId: req.user?.id,
                method: req.method,
                path: req.path,
                permissions: req.permissions
            });
            next();
        }
        catch (error) {
            logger.error('Authentication error:', error);
            const authError = errorManager.createError('AUTHENTICATION_ERROR', 'Internal authentication error', 'security', 'high', { method: req.method, path: req.path }, error);
            errorManager.handleError(authError);
            res.status(500).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_ERROR',
                    message: 'Internal authentication error'
                }
            });
        }
    };
}
/**
 * Authenticate request based on configured strategy
 */
async function authenticate(req, config, logger) {
    switch (config.strategy) {
        case 'none':
            return {
                success: true,
                user: { id: 'anonymous' },
                permissions: ['*']
            };
        case 'api-key':
            return await authenticateAPIKey(req, config, logger);
        case 'jwt':
            return await authenticateJWT(req, config, logger);
        case 'oauth2':
            return await authenticateOAuth2(req, config, logger);
        case 'basic':
            return await authenticateBasic(req, config, logger);
        default:
            logger.warn('Unknown authentication strategy:', config.strategy);
            return {
                success: false,
                message: 'Unknown authentication strategy'
            };
    }
}
/**
 * API Key authentication
 */
async function authenticateAPIKey(req, config, logger) {
    const apiKeyConfig = config.apiKey;
    if (!apiKeyConfig) {
        return { success: false, message: 'API key configuration missing' };
    }
    // Extract API key from header or query parameter
    let apiKey = req.headers[apiKeyConfig.headerName.toLowerCase()];
    if (!apiKey && apiKeyConfig.queryParamName) {
        apiKey = req.query[apiKeyConfig.queryParamName];
    }
    if (!apiKey) {
        return {
            success: false,
            message: `API key required in ${apiKeyConfig.headerName} header` +
                (apiKeyConfig.queryParamName ? ` or ${apiKeyConfig.queryParamName} query parameter` : '')
        };
    }
    // Check for required prefix
    if (apiKeyConfig.prefixRequired && apiKeyConfig.prefix) {
        if (!apiKey.startsWith(apiKeyConfig.prefix)) {
            return { success: false, message: 'Invalid API key format' };
        }
        apiKey = apiKey.substring(apiKeyConfig.prefix.length);
    }
    // TODO: Validate API key against database/store
    // For now, using a simple validation
    const isValid = await validateAPIKey(apiKey);
    if (!isValid) {
        return { success: false, message: 'Invalid API key' };
    }
    // Get user/permissions for API key
    const keyInfo = await getAPIKeyInfo(apiKey);
    return {
        success: true,
        user: keyInfo.user,
        permissions: keyInfo.permissions
    };
}
/**
 * JWT authentication
 */
async function authenticateJWT(req, config, logger) {
    const jwtConfig = config.jwt;
    if (!jwtConfig) {
        return { success: false, message: 'JWT configuration missing' };
    }
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, message: 'Bearer token required' };
    }
    const token = authHeader.substring(7);
    try {
        // Verify JWT token
        const decoded = jsonwebtoken_1.default.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            algorithms: [jwtConfig.algorithm]
        });
        // Get user info from token
        const user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            roles: decoded.roles || []
        };
        // Map roles to permissions
        const permissions = mapRolesToPermissions(user.roles, config.rbac.roles);
        return {
            success: true,
            user,
            permissions
        };
    }
    catch (error) {
        logger.debug('JWT verification failed:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return { success: false, message: 'Token expired' };
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return { success: false, message: 'Invalid token' };
        }
        return { success: false, message: 'Token verification failed' };
    }
}
/**
 * OAuth2 authentication
 */
async function authenticateOAuth2(req, config, logger) {
    // TODO: Implement OAuth2 authentication
    logger.warn('OAuth2 authentication not yet implemented');
    return { success: false, message: 'OAuth2 authentication not implemented' };
}
/**
 * Basic authentication
 */
async function authenticateBasic(req, config, logger) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return { success: false, message: 'Basic authentication required' };
    }
    try {
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');
        if (!username || !password) {
            return { success: false, message: 'Invalid credentials format' };
        }
        // TODO: Validate credentials against database/store
        const user = await validateBasicCredentials(username, password);
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }
        // Map user roles to permissions
        const permissions = mapRolesToPermissions(user.roles || [], config.rbac.roles);
        return {
            success: true,
            user,
            permissions
        };
    }
    catch (error) {
        logger.error('Basic authentication error:', error);
        return { success: false, message: 'Authentication failed' };
    }
}
/**
 * Check if user has required permissions for the operation
 */
function checkPermissions(method, path, userPermissions, rolePermissions) {
    // If user has wildcard permission, allow everything
    if (userPermissions.includes('*')) {
        return true;
    }
    // Generate required permission based on method and path
    const requiredPermission = generatePermissionFromRoute(method, path);
    // Check if user has the specific permission
    return userPermissions.includes(requiredPermission);
}
/**
 * Generate permission string from HTTP method and path
 */
function generatePermissionFromRoute(method, path) {
    // Extract resource from path (e.g., /api/v1/agents -> agents)
    const pathParts = path.split('/').filter(part => part && part !== 'api' && !part.startsWith('v'));
    const resource = pathParts[0] || 'system';
    // Map HTTP methods to permission actions
    const actionMap = {
        GET: 'read',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete'
    };
    const action = actionMap[method.toUpperCase()] || 'read';
    return `${resource}:${action}`;
}
/**
 * Map user roles to permissions
 */
function mapRolesToPermissions(userRoles, rolePermissions) {
    const permissions = new Set();
    for (const role of userRoles) {
        const rolePerms = rolePermissions[role] || [];
        rolePerms.forEach(perm => permissions.add(perm));
    }
    return Array.from(permissions);
}
/**
 * Validate API key (stub implementation)
 */
async function validateAPIKey(apiKey) {
    // TODO: Implement database lookup
    // For now, accept any non-empty key
    return apiKey.length > 0;
}
/**
 * Get API key information (stub implementation)
 */
async function getAPIKeyInfo(apiKey) {
    // TODO: Implement database lookup
    return {
        user: {
            id: `api-key-${apiKey.substring(0, 8)}`,
            type: 'api-key',
            createdAt: new Date()
        },
        permissions: ['*'] // Default to all permissions for now
    };
}
/**
 * Validate basic auth credentials (stub implementation)
 */
async function validateBasicCredentials(username, password) {
    // TODO: Implement database lookup with password hashing
    // For now, accept admin/admin
    if (username === 'admin' && password === 'admin') {
        return {
            id: 'admin',
            username: 'admin',
            email: 'admin@openconductor.ai',
            roles: ['admin']
        };
    }
    return null;
}
/**
 * Generate JWT token (utility function)
 */
function generateJWT(user, config, expiresIn) {
    if (!config) {
        throw new Error('JWT configuration missing');
    }
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
        iat: Math.floor(Date.now() / 1000)
    };
    return jsonwebtoken_1.default.sign(payload, config.secret, {
        issuer: config.issuer,
        audience: config.audience,
        expiresIn: expiresIn || config.expiresIn,
        algorithm: config.algorithm
    });
}
/**
 * Verify JWT token (utility function)
 */
function verifyJWT(token, config) {
    if (!config) {
        throw new Error('JWT configuration missing');
    }
    return jsonwebtoken_1.default.verify(token, config.secret, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: [config.algorithm]
    });
}
//# sourceMappingURL=auth.js.map