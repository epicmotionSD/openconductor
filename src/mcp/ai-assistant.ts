/**
 * OpenConductor MCP AI Assistant
 * 
 * Gemini-style chat interface for MCP server discovery and workflow assistance.
 * Provides intelligent recommendations and guidance for the MCP ecosystem.
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { MCPServerRegistry, MCPServer } from './server-registry';
import { MCPSemanticSearchEngine } from './semantic-search-engine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    context?: any;
    suggestions?: ChatSuggestion[];
    references?: ChatReference[];
  };
}

export interface ChatSuggestion {
  id: string;
  text: string;
  action: 'search' | 'install' | 'create_workflow' | 'explore' | 'learn';
  metadata?: any;
}

export interface ChatReference {
  type: 'server' | 'workflow' | 'tool' | 'documentation';
  id: string;
  name: string;
  description?: string;
  url?: string;
}

export interface ChatContext {
  user_id?: string;
  session_id: string;
  current_focus: 'discovery' | 'workflow' | 'execution' | 'analytics';
  selected_server?: MCPServer;
  recent_interactions: string[];
  user_preferences?: {
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    favorite_categories: string[];
    preferred_complexity: 'simple' | 'moderate' | 'complex';
  };
}

export interface AIAssistantResponse {
  message: ChatMessage;
  suggested_actions: ChatSuggestion[];
  server_recommendations?: MCPServer[];
  workflow_suggestions?: any[];
}

/**
 * MCP AI Assistant Class
 */
export class MCPAIAssistant {
  private logger: Logger;
  private errorManager: ErrorManager;
  private serverRegistry: MCPServerRegistry;
  private semanticSearch: MCPSemanticSearchEngine | null;
  private openaiApiKey?: string;

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    serverRegistry: MCPServerRegistry,
    semanticSearch: MCPSemanticSearchEngine | null,
    openaiApiKey?: string
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.serverRegistry = serverRegistry;
    this.semanticSearch = semanticSearch;
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    message: string,
    context: ChatContext
  ): Promise<AIAssistantResponse> {
    this.logger.debug('Processing AI chat message', {
      message: message.substring(0, 100),
      context: context.current_focus,
      userId: context.user_id
    });

    try {
      // Analyze user intent
      const intent = await this.analyzeIntent(message, context);
      
      // Generate response based on intent
      const response = await this.generateResponse(message, intent, context);
      
      // Get contextual recommendations
      const recommendations = await this.getContextualRecommendations(intent, context);
      
      // Generate suggested actions
      const suggestedActions = this.generateSuggestedActions(intent, context);

      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          context: intent,
          suggestions: suggestedActions,
          references: response.references
        }
      };

      this.logger.info('AI message processed successfully', {
        intent: intent.primary_intent,
        hasRecommendations: recommendations.length > 0,
        userId: context.user_id
      });

      return {
        message: assistantMessage,
        suggested_actions: suggestedActions,
        server_recommendations: recommendations,
        workflow_suggestions: []
      };
    } catch (error) {
      this.logger.error('Failed to process AI message:', error);
      
      // Return fallback response
      return this.getFallbackResponse(message, context);
    }
  }

  /**
   * Analyze user intent from message
   */
  private async analyzeIntent(message: string, context: ChatContext): Promise<any> {
    const lowerMessage = message.toLowerCase();
    
    // Rule-based intent detection (can be enhanced with ML)
    let primaryIntent = 'general';
    let entities = [];
    let confidence = 0.5;

    // Server discovery intents
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for')) {
      primaryIntent = 'server_discovery';
      confidence = 0.8;
      
      // Extract server types/categories
      const serverTypes = ['file', 'database', 'web', 'api', 'postgres', 'mysql', 'http'];
      entities = serverTypes.filter(type => lowerMessage.includes(type));
    }
    
    // Workflow creation intents
    else if (lowerMessage.includes('create') || lowerMessage.includes('build') || lowerMessage.includes('workflow')) {
      primaryIntent = 'workflow_creation';
      confidence = 0.8;
    }
    
    // Installation help
    else if (lowerMessage.includes('install') || lowerMessage.includes('setup') || lowerMessage.includes('configure')) {
      primaryIntent = 'installation_help';
      confidence = 0.9;
    }
    
    // Learning/documentation
    else if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('explain')) {
      primaryIntent = 'learning';
      confidence = 0.7;
    }
    
    // Troubleshooting
    else if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('not working')) {
      primaryIntent = 'troubleshooting';
      confidence = 0.9;
    }

    return {
      primary_intent: primaryIntent,
      entities,
      confidence,
      context_focus: context.current_focus,
      user_skill: context.user_preferences?.skill_level || 'intermediate'
    };
  }

  /**
   * Generate AI response based on intent
   */
  private async generateResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<{ content: string; references: ChatReference[] }> {
    const references: ChatReference[] = [];
    let content = '';

    switch (intent.primary_intent) {
      case 'server_discovery':
        content = await this.generateServerDiscoveryResponse(message, intent, context);
        
        // Add server references if entities found
        if (intent.entities.length > 0) {
          const servers = await this.findServersByKeywords(intent.entities);
          references.push(...servers.map(server => ({
            type: 'server' as const,
            id: server.id,
            name: server.display_name,
            description: server.description
          })));
        }
        break;

      case 'workflow_creation':
        content = await this.generateWorkflowCreationResponse(message, intent, context);
        break;

      case 'installation_help':
        content = await this.generateInstallationResponse(message, intent, context);
        break;

      case 'learning':
        content = await this.generateLearningResponse(message, intent, context);
        break;

      case 'troubleshooting':
        content = await this.generateTroubleshootingResponse(message, intent, context);
        break;

      default:
        content = this.generateGeneralResponse(message, context);
    }

    return { content, references };
  }

  /**
   * Generate server discovery response
   */
  private async generateServerDiscoveryResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<string> {
    const skillLevel = intent.user_skill;
    const entities = intent.entities;

    if (entities.length === 0) {
      return `I can help you discover MCP servers! What type of functionality are you looking for? 

Common categories include:
• **File Operations** - Read, write, and manage files
• **Database Access** - Connect to PostgreSQL, MySQL, etc.
• **Web Services** - HTTP requests, web scraping, APIs
• **Data Processing** - Transform and analyze data
• **Utilities** - System tools and integrations

What would you like to build?`;
    }

    const categoryMap: { [key: string]: string } = {
      file: 'filesystem and file operations',
      database: 'database connectivity and queries',
      postgres: 'PostgreSQL database operations',
      mysql: 'MySQL database operations',
      web: 'web services and HTTP operations',
      api: 'API integrations and web services',
      http: 'HTTP requests and web connectivity'
    };

    const suggestions = entities.map(entity => categoryMap[entity] || entity);

    return `Great! I found several MCP servers for **${suggestions.join(', ')}**.

Based on your ${skillLevel} level, I recommend starting with:

${entities.includes('file') ? '• **File System Server** - Perfect for file operations with comprehensive read/write capabilities' : ''}
${entities.includes('database') || entities.includes('postgres') ? '• **PostgreSQL Server** - Robust database operations with query builder support' : ''}
${entities.includes('web') || entities.includes('api') ? '• **Web Search Server** - Easy web requests and API integrations' : ''}

Would you like me to show you installation instructions, or would you prefer to see example workflows using these servers?`;
  }

  /**
   * Generate workflow creation response
   */
  private async generateWorkflowCreationResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<string> {
    const skillLevel = intent.user_skill;

    const templates = {
      beginner: [
        'Simple file processing pipeline',
        'Basic data transformation workflow',
        'Web content extraction'
      ],
      intermediate: [
        'Multi-step data processing pipeline',
        'API integration with error handling',
        'Scheduled data synchronization'
      ],
      advanced: [
        'Complex ETL pipeline with multiple data sources',
        'Real-time data processing with conditional logic',
        'Enterprise integration workflow'
      ],
      expert: [
        'Custom server orchestration',
        'Advanced error handling and compensation',
        'High-performance batch processing'
      ]
    };

    const userTemplates = templates[skillLevel] || templates.intermediate;

    return `I'll help you create a workflow! Based on your ${skillLevel} level, here are some popular workflow patterns:

${userTemplates.map((template, index) => `${index + 1}. **${template}**`).join('\n')}

To get started:
1. **Choose your data source** - What type of input will you process?
2. **Select processing steps** - What transformations do you need?
3. **Define your output** - Where should the results go?

What type of workflow would you like to build? I can provide a template and guide you through the setup.`;
  }

  /**
   * Generate installation response
   */
  private async generateInstallationResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<string> {
    if (context.selected_server) {
      const server = context.selected_server;
      return `Here's how to install **${server.display_name}**:

**Installation Command:**
\`\`\`bash
${server.installation_command || `npm install ${server.npm_package || server.name}`}
\`\`\`

**Configuration:**
${server.configuration_schema ? 
  '• Requires configuration - I can help you set this up' :
  '• No additional configuration needed!'
}

**Next Steps:**
1. Run the installation command
2. ${server.configuration_schema ? 'Configure the server settings' : 'Start using in your workflows'}
3. Test the connection

Would you like me to explain any of the configuration options or show you how to use this server in a workflow?`;
    }

    return `I can help you install MCP servers! The process is usually simple:

**For npm packages:**
\`\`\`bash
npm install -g @modelcontextprotocol/server-name
\`\`\`

**For Docker containers:**
\`\`\`bash
docker run -d server-image
\`\`\`

Which specific server would you like to install? I can provide detailed instructions for any server in our registry.`;
  }

  /**
   * Generate learning response
   */
  private async generateLearningResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('mcp') || lowerMessage.includes('model context protocol')) {
      return `**Model Context Protocol (MCP)** is a standardized way for AI applications to connect with external data sources and tools.

**Key Concepts:**
• **Servers** - Provide tools and resources (like database access, file operations)
• **Clients** - Applications that use MCP servers (like AI assistants)
• **Tools** - Specific functions that servers expose (read_file, run_query, etc.)
• **Resources** - Data sources that servers can access

**How OpenConductor Uses MCP:**
1. **Discovery** - Find servers for your needs
2. **Installation** - Easy one-click server setup
3. **Workflows** - Chain multiple servers together
4. **Monitoring** - Track performance and usage

Would you like me to explain any specific aspect in more detail?`;
    }

    if (lowerMessage.includes('workflow')) {
      return `**MCP Workflows** let you chain multiple servers together to create powerful automation:

**Workflow Components:**
• **Nodes** - Individual steps (MCP servers, conditions, transformations)
• **Edges** - Connections between steps defining data flow
• **Triggers** - What starts the workflow (manual, scheduled, webhook)

**Example Workflow:**
1. **File Server** → Read data file
2. **Transform** → Clean and process data  
3. **Database Server** → Store results
4. **Notification** → Send completion alert

**Best Practices:**
• Start simple with 2-3 steps
• Add error handling for production use
• Test each step individually first

Want me to help you design a specific workflow?`;
    }

    return `I'm here to help you learn about MCP servers and workflows! 

**Popular Topics:**
• What is Model Context Protocol?
• How to create your first workflow
• Best practices for server selection
• Troubleshooting common issues
• Advanced workflow patterns

What specific topic would you like to explore?`;
  }

  /**
   * Generate troubleshooting response
   */
  private async generateTroubleshootingResponse(
    message: string,
    intent: any,
    context: ChatContext
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('connection') || lowerMessage.includes('connect')) {
      return `**Connection Issues** are usually caused by:

**Common Fixes:**
1. **Check server status** - Is the MCP server running?
2. **Verify installation** - Run the installation command again
3. **Check configuration** - Ensure environment variables are set
4. **Network access** - Confirm firewall/proxy settings
5. **Version compatibility** - Update to latest server version

**Debugging Steps:**
1. Test server independently: \`mcp-server-test\`
2. Check server logs for error messages
3. Verify transport type (stdio/http_sse/websocket)
4. Test with minimal configuration first

What specific error message are you seeing? I can provide targeted help.`;
    }

    if (lowerMessage.includes('workflow') && (lowerMessage.includes('fail') || lowerMessage.includes('error'))) {
      return `**Workflow Execution Issues** can be diagnosed systematically:

**Check These First:**
1. **Step Dependencies** - Are prerequisites met?
2. **Input Data** - Is the data format correct?
3. **Server Health** - Are all servers responsive?
4. **Timeout Settings** - Increase if processing takes time
5. **Error Handling** - Check step-level error policies

**Debugging Tools:**
• View execution logs in real-time
• Check individual step outputs
• Test servers independently
• Validate workflow definition

Can you share the specific error message or step where it's failing?`;
    }

    return `I can help troubleshoot your MCP issues! 

**Common Problems:**
• Server connection failures
• Workflow execution errors  
• Installation issues
• Configuration problems
• Performance issues

Please describe the specific problem you're experiencing, including any error messages, and I'll provide targeted solutions.`;
  }

  /**
   * Generate general response
   */
  private generateGeneralResponse(message: string, context: ChatContext): string {
    const responses = [
      `I'm your MCP assistant! I can help you discover servers, create workflows, and solve technical challenges. What would you like to work on?`,
      
      `Welcome to the MCP ecosystem! Whether you're looking to find the perfect server, build a complex workflow, or troubleshoot an issue, I'm here to help. What's your goal today?`,
      
      `Hi! I specialize in MCP servers and workflow automation. I can assist with server discovery, installation guidance, workflow design, and troubleshooting. How can I help?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get contextual server recommendations
   */
  private async getContextualRecommendations(
    intent: any,
    context: ChatContext
  ): Promise<MCPServer[]> {
    try {
      if (intent.primary_intent === 'server_discovery' && intent.entities.length > 0) {
        const searchResult = await this.serverRegistry.searchServers({
          query: intent.entities.join(' '),
          limit: 5,
          is_featured: true,
          sort_by: 'popularity'
        });
        
        return searchResult.servers;
      }

      // Skill-based recommendations
      if (context.user_preferences?.skill_level) {
        const skillServerMap = {
          beginner: ['filesystem-server', 'web-search-server'],
          intermediate: ['postgres-server', 'http-server'],
          advanced: ['kubernetes-server', 'ml-server'],
          expert: ['custom-server', 'enterprise-server']
        };

        const skillServers = skillServerMap[context.user_preferences.skill_level] || [];
        if (skillServers.length > 0) {
          const searchResult = await this.serverRegistry.searchServers({
            query: skillServers.join(' OR '),
            limit: 3,
            sort_by: 'rating'
          });
          
          return searchResult.servers;
        }
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to get contextual recommendations:', error);
      return [];
    }
  }

  /**
   * Generate suggested actions based on intent
   */
  private generateSuggestedActions(intent: any, context: ChatContext): ChatSuggestion[] {
    const suggestions: ChatSuggestion[] = [];

    switch (intent.primary_intent) {
      case 'server_discovery':
        suggestions.push(
          {
            id: 'search_servers',
            text: 'Search all servers',
            action: 'search',
            metadata: { query: intent.entities.join(' ') }
          },
          {
            id: 'browse_categories',
            text: 'Browse by category',
            action: 'explore',
            metadata: { view: 'categories' }
          },
          {
            id: 'view_featured',
            text: 'View featured servers',
            action: 'explore',
            metadata: { filter: 'featured' }
          }
        );
        break;

      case 'workflow_creation':
        suggestions.push(
          {
            id: 'create_workflow',
            text: 'Start new workflow',
            action: 'create_workflow',
            metadata: { template: 'blank' }
          },
          {
            id: 'use_template',
            text: 'Use a template',
            action: 'explore',
            metadata: { view: 'templates' }
          },
          {
            id: 'learn_workflows',
            text: 'Learn about workflows',
            action: 'learn',
            metadata: { topic: 'workflows' }
          }
        );
        break;

      case 'installation_help':
        if (context.selected_server) {
          suggestions.push(
            {
              id: 'install_server',
              text: `Install ${context.selected_server.display_name}`,
              action: 'install',
              metadata: { server_id: context.selected_server.id }
            }
          );
        }
        suggestions.push(
          {
            id: 'installation_guide',
            text: 'View installation guide',
            action: 'learn',
            metadata: { topic: 'installation' }
          }
        );
        break;

      case 'learning':
        suggestions.push(
          {
            id: 'getting_started',
            text: 'Getting started guide',
            action: 'learn',
            metadata: { topic: 'getting_started' }
          },
          {
            id: 'best_practices',
            text: 'Best practices',
            action: 'learn',
            metadata: { topic: 'best_practices' }
          },
          {
            id: 'examples',
            text: 'View examples',
            action: 'explore',
            metadata: { view: 'examples' }
          }
        );
        break;
    }

    // Always add general help action
    suggestions.push({
      id: 'general_help',
      text: 'Get help',
      action: 'learn',
      metadata: { topic: 'help' }
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Find servers by keywords
   */
  private async findServersByKeywords(keywords: string[]): Promise<MCPServer[]> {
    try {
      const searchResult = await this.serverRegistry.searchServers({
        query: keywords.join(' '),
        limit: 3,
        is_verified: true,
        sort_by: 'popularity'
      });
      
      return searchResult.servers;
    } catch (error) {
      this.logger.error('Failed to find servers by keywords:', error);
      return [];
    }
  }

  /**
   * Get fallback response for errors
   */
  private getFallbackResponse(message: string, context: ChatContext): AIAssistantResponse {
    const fallbackMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: `I apologize, but I'm having trouble processing your request right now. However, I can still help you with:

• **Discovering MCP servers** - Browse our registry of ${context.current_focus === 'discovery' ? 'available' : 'popular'} servers
• **Creating workflows** - Build automation using multiple servers
• **Installation help** - Get step-by-step setup instructions
• **General guidance** - Learn about MCP and best practices

What would you like to explore?`,
      timestamp: new Date()
    };

    const fallbackActions: ChatSuggestion[] = [
      {
        id: 'browse_servers',
        text: 'Browse servers',
        action: 'explore',
        metadata: { view: 'servers' }
      },
      {
        id: 'view_templates',
        text: 'View templates',
        action: 'explore',
        metadata: { view: 'templates' }
      },
      {
        id: 'getting_started',
        text: 'Getting started',
        action: 'learn',
        metadata: { topic: 'getting_started' }
      }
    ];

    return {
      message: fallbackMessage,
      suggested_actions: fallbackActions,
      server_recommendations: [],
      workflow_suggestions: []
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get chat analytics
   */
  async getChatAnalytics(): Promise<{
    total_conversations: number;
    avg_messages_per_conversation: number;
    popular_intents: { intent: string; count: number }[];
    user_satisfaction: number;
  }> {
    // This would integrate with actual analytics
    return {
      total_conversations: 1250,
      avg_messages_per_conversation: 4.2,
      popular_intents: [
        { intent: 'server_discovery', count: 45 },
        { intent: 'workflow_creation', count: 32 },
        { intent: 'installation_help', count: 28 },
        { intent: 'learning', count: 18 }
      ],
      user_satisfaction: 4.6
    };
  }
}

/**
 * Factory function to create MCP AI assistant
 */
export function createMCPAIAssistant(
  logger: Logger,
  errorManager: ErrorManager,
  serverRegistry: MCPServerRegistry,
  semanticSearch: MCPSemanticSearchEngine | null,
  openaiApiKey?: string
): MCPAIAssistant {
  return new MCPAIAssistant(
    logger,
    errorManager,
    serverRegistry,
    semanticSearch,
    openaiApiKey
  );
}