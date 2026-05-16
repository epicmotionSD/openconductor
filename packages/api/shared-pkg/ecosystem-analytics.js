"use strict";
// OpenConductor Ecosystem Analytics Types
// Cross-product tracking for OpenConductor, FlexaBrain, FlexaSports, and X3O
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ANALYTICS_CONFIG = exports.ECOSYSTEM_SUGGESTIONS = void 0;
exports.matchQueryToSuggestions = matchQueryToSuggestions;
exports.ECOSYSTEM_SUGGESTIONS = {
    'flexabrain': {
        product: 'FlexaBrain',
        reason: 'Advanced multi-agent memory orchestration with enterprise features',
        url: 'https://flexabrain.ai',
        cta: 'Learn more about FlexaBrain →',
        keywords: ['memory', 'agent', 'orchestration', 'multi-agent', 'rag', 'semantic']
    },
    'flexasports': {
        product: 'FlexaSports',
        reason: 'AI-powered DFS analytics with explainable predictions',
        url: 'https://flexasports.ai',
        cta: 'Discover FlexaSports →',
        keywords: ['sports', 'dfs', 'analytics', 'betting', 'nfl', 'nba', 'mlb', 'nhl', 'predictions']
    },
    'x3o': {
        product: 'X3O Trinity Dashboard',
        reason: 'Bloomberg Terminal for AI agent orchestration',
        url: 'https://x3o.ai',
        cta: 'See X3O Trinity Dashboard →',
        keywords: ['dashboard', 'monitoring', 'orchestration', 'enterprise', 'bloomberg', 'terminal']
    }
};
// Helper function to match search query to ecosystem products
function matchQueryToSuggestions(query) {
    if (!query)
        return [];
    const lowerQuery = query.toLowerCase();
    const matches = [];
    for (const suggestion of Object.values(exports.ECOSYSTEM_SUGGESTIONS)) {
        for (const keyword of suggestion.keywords) {
            if (lowerQuery.includes(keyword)) {
                matches.push(suggestion);
                break;
            }
        }
    }
    return matches;
}
exports.DEFAULT_ANALYTICS_CONFIG = {
    apiUrl: process.env.OPENCONDUCTOR_API_URL || 'https://api.openconductor.ai',
    timeout: 2000, // 2 seconds - don't slow down CLI
    maxRetries: 3,
    enabled: true
};
