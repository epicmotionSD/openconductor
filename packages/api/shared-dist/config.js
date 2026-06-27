"use strict";
/**
 * Single source of truth for OpenConductor project configuration
 * Use these constants throughout the application to ensure consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SITE_METADATA = exports.PROJECT_CONFIG = void 0;
exports.PROJECT_CONFIG = {
    name: 'OpenConductor',
    description: 'The npm registry for Model Context Protocol servers',
    url: 'https://www.openconductor.ai',
    // Repository
    github: {
        owner: 'epicmotionSD',
        repo: 'openconductor',
        url: 'https://github.com/epicmotionSD/openconductor',
    },
    // Social
    twitter: '@openconductor',
    // NPM
    npm: {
        scope: '@openconductor',
        registry: 'https://www.npmjs.com/org/openconductor',
    },
    // Legal
    license: 'MIT',
    author: 'OpenConductor Team',
    copyright: `© ${new Date().getFullYear()} OpenConductor. MIT Licensed.`,
};
exports.SITE_METADATA = {
    title: 'OpenConductor - MCP Server Registry',
    description: 'Discover, install, and manage Model Context Protocol (MCP) servers. The npm for AI agents, evolved for the ecosystem era.',
    keywords: [
        'MCP',
        'Model Context Protocol',
        'AI agents',
        'server registry',
        'developer tools',
        'Vercel',
        'Supabase',
        'v0',
        'BaseHub',
    ],
};
