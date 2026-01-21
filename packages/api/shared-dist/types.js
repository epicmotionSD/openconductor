"use strict";
// OpenConductor Registry API - Comprehensive Type Definitions
// Following the complete technical specification
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.ErrorCodes = void 0;
// Error codes
exports.ErrorCodes = {
    NOT_FOUND: 'SERVER_NOT_FOUND',
    INVALID_INPUT: 'INVALID_INPUT',
    RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
    DUPLICATE_SERVER: 'DUPLICATE_SERVER',
    INVALID_REPOSITORY: 'INVALID_REPOSITORY',
    GITHUB_API_ERROR: 'GITHUB_API_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    CACHE_ERROR: 'CACHE_ERROR'
};
// Cache TTL constants
exports.CACHE_TTL = {
    SERVER_DETAIL: 300, // 5 minutes
    SERVER_LIST: 60, // 1 minute
    SEARCH_RESULTS: 120, // 2 minutes
    TRENDING: 600, // 10 minutes
    STATS: 1800, // 30 minutes
    CATEGORIES: 3600, // 1 hour
};
