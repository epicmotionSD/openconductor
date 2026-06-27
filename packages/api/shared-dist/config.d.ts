/**
 * Single source of truth for OpenConductor project configuration
 * Use these constants throughout the application to ensure consistency
 */
export declare const PROJECT_CONFIG: {
    readonly name: "OpenConductor";
    readonly description: "The npm registry for Model Context Protocol servers";
    readonly url: "https://www.openconductor.ai";
    readonly github: {
        readonly owner: "epicmotionSD";
        readonly repo: "openconductor";
        readonly url: "https://github.com/epicmotionSD/openconductor";
    };
    readonly twitter: "@openconductor";
    readonly npm: {
        readonly scope: "@openconductor";
        readonly registry: "https://www.npmjs.com/org/openconductor";
    };
    readonly license: "MIT";
    readonly author: "OpenConductor Team";
    readonly copyright: `\u00A9 ${number} OpenConductor. MIT Licensed.`;
};
export declare const SITE_METADATA: {
    readonly title: "OpenConductor - MCP Server Registry";
    readonly description: "Discover, install, and manage Model Context Protocol (MCP) servers. The npm for AI agents, evolved for the ecosystem era.";
    readonly keywords: readonly ["MCP", "Model Context Protocol", "AI agents", "server registry", "developer tools", "Vercel", "Supabase", "v0", "BaseHub"];
};
