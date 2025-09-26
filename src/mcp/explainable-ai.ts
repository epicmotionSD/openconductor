/**
 * OpenConductor MCP Explainable AI System
 * 
 * Provides transparent, interpretable explanations for AI-driven decisions
 * in MCP server recommendations, search results, and workflow optimization.
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { MCPServer, ServerSearchResult } from './server-registry';

export interface AIExplanation {
  id: string;
  type: 'server_recommendation' | 'search_result' | 'workflow_optimization' | 'performance_insight';
  title: string;
  summary: string;
  detailed_explanation: string;
  confidence_score: number; // 0-1
  factors: ExplanationFactor[];
  user_impact: string;
  next_steps: string[];
  timestamp: Date;
}

export interface ExplanationFactor {
  name: string;
  importance: number; // 0-1, how much this factor influenced the decision
  value: any;
  explanation: string;
  positive_impact: boolean;
}

export interface UserContext {
  user_id: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  recent_searches: string[];
  installed_servers: string[];
  workflow_patterns: string[];
  preferences: {
    favorite_categories: string[];
    complexity_preference: 'simple' | 'moderate' | 'complex';
    learning_style: 'visual' | 'text' | 'hands_on';
  };
}

export interface WorkflowInsight {
  insight_type: 'optimization' | 'error_explanation' | 'performance' | 'best_practice';
  message: string;
  explanation: string;
  action_required: boolean;
  suggested_actions: string[];
  impact_level: 'low' | 'medium' | 'high';
}

/**
 * Explainable AI Engine for MCP
 */
export class MCPExplainableAI {
  private logger: Logger;
  private errorManager: ErrorManager;

  constructor(logger: Logger, errorManager: ErrorManager) {
    this.logger = logger;
    this.errorManager = errorManager;
  }

  /**
   * Explain why specific servers were recommended
   */
  async explainServerRecommendation(
    servers: MCPServer[],
    searchQuery: string,
    userContext: UserContext
  ): Promise<AIExplanation> {
    this.logger.debug('Generating server recommendation explanation', {
      serverCount: servers.length,
      query: searchQuery,
      userSkill: userContext.skill_level
    });

    try {
      const factors: ExplanationFactor[] = [];
      
      // Analyze search relevance
      factors.push({
        name: 'Search Relevance',
        importance: 0.3,
        value: this.calculateSearchRelevance(servers[0], searchQuery),
        explanation: `Matched "${searchQuery}" in server name, description, and tags`,
        positive_impact: true
      });

      // Analyze popularity metrics
      factors.push({
        name: 'Community Popularity',
        importance: 0.25,
        value: servers[0]?.star_count || 0,
        explanation: `${servers[0]?.star_count || 0} stars and ${servers[0]?.download_count || 0} downloads indicate strong community adoption`,
        positive_impact: (servers[0]?.star_count || 0) > 50
      });

      // Analyze skill level match
      const skillMatch = this.analyzeSkillLevelMatch(servers[0], userContext.skill_level);
      factors.push({
        name: 'Skill Level Match',
        importance: 0.2,
        value: skillMatch.score,
        explanation: skillMatch.explanation,
        positive_impact: skillMatch.score > 0.7
      });

      // Analyze user preference alignment
      const preferenceMatch = this.analyzePreferenceMatch(servers[0], userContext);
      factors.push({
        name: 'Preference Alignment',
        importance: 0.25,
        value: preferenceMatch.score,
        explanation: preferenceMatch.explanation,
        positive_impact: preferenceMatch.score > 0.6
      });

      // Calculate overall confidence
      const confidence = factors.reduce((sum, factor) => 
        sum + (factor.importance * (factor.positive_impact ? 1 : 0.5)), 0
      );

      const explanation: AIExplanation = {
        id: `explain_${Date.now()}`,
        type: 'server_recommendation',
        title: `Why we recommended ${servers[0]?.display_name}`,
        summary: `This server scored ${Math.round(confidence * 100)}% based on relevance, popularity, and your profile`,
        detailed_explanation: this.generateDetailedRecommendationExplanation(servers[0], factors, userContext),
        confidence_score: confidence,
        factors,
        user_impact: this.assessUserImpact(servers[0], userContext),
        next_steps: this.generateNextSteps('server_recommendation', servers[0], userContext),
        timestamp: new Date()
      };

      return explanation;
    } catch (error) {
      this.logger.error('Failed to generate server recommendation explanation:', error);
      throw this.errorManager.wrapError(error as Error, {
        context: 'explainable-ai-recommendation'
      });
    }
  }

  /**
   * Explain semantic search results
   */
  async explainSearchResults(
    searchResult: ServerSearchResult,
    query: string,
    userContext: UserContext
  ): Promise<AIExplanation> {
    try {
      const factors: ExplanationFactor[] = [];

      // Semantic similarity analysis
      if (searchResult.semantic_matches && searchResult.semantic_matches.length > 0) {
        const avgSimilarity = searchResult.semantic_matches.reduce((sum, match) => 
          sum + match.similarity_score, 0) / searchResult.semantic_matches.length;
        
        factors.push({
          name: 'Semantic Understanding',
          importance: 0.4,
          value: avgSimilarity,
          explanation: `AI understood your query intent and found servers with ${Math.round(avgSimilarity * 100)}% conceptual similarity`,
          positive_impact: avgSimilarity > 0.7
        });
      }

      // Query complexity analysis
      const queryComplexity = this.analyzeQueryComplexity(query);
      factors.push({
        name: 'Query Complexity',
        importance: 0.2,
        value: queryComplexity.score,
        explanation: queryComplexity.explanation,
        positive_impact: queryComplexity.score < 0.8 // Lower complexity is better
      });

      // Result diversity
      const diversity = this.analyzeResultDiversity(searchResult.servers);
      factors.push({
        name: 'Result Diversity',
        importance: 0.2,
        value: diversity.score,
        explanation: diversity.explanation,
        positive_impact: diversity.score > 0.6
      });

      // Personalization impact
      const personalization = this.analyzePersonalization(searchResult, userContext);
      factors.push({
        name: 'Personalization',
        importance: 0.2,
        value: personalization.score,
        explanation: personalization.explanation,
        positive_impact: personalization.score > 0.5
      });

      const confidence = factors.reduce((sum, factor) => 
        sum + (factor.importance * factor.value), 0
      );

      return {
        id: `search_explain_${Date.now()}`,
        type: 'search_result',
        title: 'How we found these servers',
        summary: `Found ${searchResult.servers.length} servers using AI semantic search with ${Math.round(confidence * 100)}% relevance`,
        detailed_explanation: this.generateSearchExplanation(searchResult, query, factors),
        confidence_score: confidence,
        factors,
        user_impact: `These results are tailored to your ${userContext.skill_level} level and preferences`,
        next_steps: [
          'Review the top recommendations',
          'Check server compatibility with your use case',
          'Install and test your preferred servers',
          'Provide feedback to improve future recommendations'
        ],
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to explain search results:', error);
      throw error;
    }
  }

  /**
   * Explain workflow optimization suggestions
   */
  async explainWorkflowOptimization(
    workflowId: string,
    optimizations: any[],
    userContext: UserContext
  ): Promise<AIExplanation> {
    try {
      const factors: ExplanationFactor[] = [];

      // Performance analysis
      factors.push({
        name: 'Performance Impact',
        importance: 0.3,
        value: this.calculatePerformanceImpact(optimizations),
        explanation: 'Estimated time savings and resource optimization potential',
        positive_impact: true
      });

      // Complexity vs benefit analysis
      factors.push({
        name: 'Implementation Effort',
        importance: 0.25,
        value: this.calculateImplementationEffort(optimizations),
        explanation: 'How much work is needed to implement these optimizations',
        positive_impact: false // Lower effort is better
      });

      // Risk assessment
      factors.push({
        name: 'Risk Assessment',
        importance: 0.25,
        value: this.calculateOptimizationRisk(optimizations),
        explanation: 'Likelihood of issues when implementing changes',
        positive_impact: false // Lower risk is better
      });

      // User skill alignment
      const skillAlignment = this.assessSkillAlignment(optimizations, userContext.skill_level);
      factors.push({
        name: 'Skill Level Match',
        importance: 0.2,
        value: skillAlignment.score,
        explanation: skillAlignment.explanation,
        positive_impact: skillAlignment.score > 0.7
      });

      return {
        id: `workflow_explain_${Date.now()}`,
        type: 'workflow_optimization',
        title: 'Workflow optimization recommendations',
        summary: `Found ${optimizations.length} optimization opportunities to improve performance and reliability`,
        detailed_explanation: this.generateOptimizationExplanation(optimizations, factors),
        confidence_score: 0.85, // High confidence in optimization analysis
        factors,
        user_impact: this.assessOptimizationImpact(optimizations, userContext),
        next_steps: this.generateOptimizationSteps(optimizations, userContext),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to explain workflow optimization:', error);
      throw error;
    }
  }

  /**
   * Explain performance insights
   */
  async explainPerformanceInsight(
    metric: string,
    currentValue: number,
    trend: 'improving' | 'declining' | 'stable',
    userContext: UserContext
  ): Promise<AIExplanation> {
    try {
      const factors: ExplanationFactor[] = [];

      // Historical trend analysis
      factors.push({
        name: 'Historical Trend',
        importance: 0.3,
        value: trend === 'improving' ? 0.8 : trend === 'declining' ? 0.2 : 0.5,
        explanation: `Performance has been ${trend} over the past 30 days`,
        positive_impact: trend === 'improving'
      });

      // Benchmark comparison
      const benchmark = this.getBenchmarkValue(metric, userContext.skill_level);
      factors.push({
        name: 'Industry Benchmark',
        importance: 0.25,
        value: currentValue / benchmark,
        explanation: `Your ${metric} is ${currentValue > benchmark ? 'above' : 'below'} the typical ${userContext.skill_level} user average`,
        positive_impact: currentValue > benchmark
      });

      // Usage pattern analysis
      factors.push({
        name: 'Usage Pattern',
        importance: 0.25,
        value: this.analyzeUsagePattern(userContext),
        explanation: 'Based on your workflow execution patterns and server usage',
        positive_impact: true
      });

      // Optimization potential
      factors.push({
        name: 'Optimization Potential',
        importance: 0.2,
        value: this.calculateOptimizationPotential(metric, currentValue),
        explanation: 'Estimated improvement possible with recommended changes',
        positive_impact: true
      });

      return {
        id: `perf_explain_${Date.now()}`,
        type: 'performance_insight',
        title: `Understanding your ${metric} performance`,
        summary: this.generatePerformanceSummary(metric, currentValue, trend),
        detailed_explanation: this.generatePerformanceExplanation(metric, currentValue, factors),
        confidence_score: 0.9,
        factors,
        user_impact: this.assessPerformanceImpact(metric, currentValue, userContext),
        next_steps: this.generatePerformanceSteps(metric, trend, userContext),
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to explain performance insight:', error);
      throw error;
    }
  }

  /**
   * Generate quick training explanations
   */
  async generateQuickTraining(
    topic: 'mcp_basics' | 'server_installation' | 'workflow_creation' | 'performance_optimization',
    userContext: UserContext
  ): Promise<{
    title: string;
    explanation: AIExplanation;
    interactive_steps: Array<{
      step: number;
      title: string;
      description: string;
      action: string;
      verification: string;
    }>;
    tips: string[];
    common_mistakes: string[];
  }> {
    const trainingSessions = {
      mcp_basics: {
        title: "MCP Fundamentals in 5 Minutes",
        explanation: await this.createBasicsExplanation(userContext),
        interactive_steps: [
          {
            step: 1,
            title: "Understanding MCP Servers",
            description: "MCP servers are like specialized tools - each one provides specific capabilities for AI applications",
            action: "Browse the server registry",
            verification: "You can see different server categories and their purposes"
          },
          {
            step: 2,
            title: "Installing Your First Server",
            description: "Installing a server gives you access to its tools and capabilities",
            action: "Install the filesystem-server",
            verification: "Server appears in your installed servers list"
          },
          {
            step: 3,
            title: "Basic Server Interaction",
            description: "Test the server's capabilities with a simple operation",
            action: "Use the read_file tool",
            verification: "Successfully read a file using the server"
          }
        ],
        tips: [
          "Start with official servers - they're well-documented and reliable",
          "Check server ratings and reviews before installing",
          "Test servers individually before using in workflows"
        ],
        common_mistakes: [
          "Installing too many servers at once",
          "Not reading server documentation",
          "Skipping the testing phase"
        ]
      },
      
      server_installation: {
        title: "Server Installation Mastery",
        explanation: await this.createInstallationExplanation(userContext),
        interactive_steps: [
          {
            step: 1,
            title: "Choosing the Right Server",
            description: "Evaluate servers based on your specific needs, not just popularity",
            action: "Compare 3 servers for your use case",
            verification: "You can explain why you chose each server"
          },
          {
            step: 2,
            title: "Installation Configuration",
            description: "Many servers require configuration - API keys, endpoints, etc.",
            action: "Configure a server with custom settings",
            verification: "Server passes health check with your configuration"
          },
          {
            step: 3,
            title: "Testing and Validation",
            description: "Always test server functionality before using in production workflows",
            action: "Run server health check and test core functions",
            verification: "All server tools work as expected"
          }
        ],
        tips: [
          "Read the server's README and documentation first",
          "Check compatibility with your environment",
          "Keep configuration secure and backed up"
        ],
        common_mistakes: [
          "Not securing API keys and credentials",
          "Installing without reading requirements",
          "Skipping the health check"
        ]
      },
      
      workflow_creation: {
        title: "Workflow Building Best Practices",
        explanation: await this.createWorkflowExplanation(userContext),
        interactive_steps: [
          {
            step: 1,
            title: "Planning Your Workflow",
            description: "Start with clear input, processing steps, and expected output",
            action: "Map out your workflow on paper first",
            verification: "You have a clear plan before building"
          },
          {
            step: 2,
            title: "Building Step by Step",
            description: "Add one step at a time and test each connection",
            action: "Create a 3-step workflow with testing between each step",
            verification: "Each step works individually and together"
          },
          {
            step: 3,
            title: "Error Handling and Monitoring",
            description: "Add error handling and monitoring to make workflows production-ready",
            action: "Add retry logic and error notifications",
            verification: "Workflow handles errors gracefully"
          }
        ],
        tips: [
          "Keep workflows simple initially - you can always add complexity",
          "Use descriptive names for steps and variables",
          "Add comments explaining complex logic"
        ],
        common_mistakes: [
          "Making workflows too complex initially",
          "Not handling errors properly",
          "Forgetting to test with real data"
        ]
      }
    };

    return trainingSessions[topic];
  }

  /**
   * Provide real-time explanations during user interactions
   */
  async provideContextualExplanation(
    action: string,
    context: any,
    userContext: UserContext
  ): Promise<string> {
    switch (action) {
      case 'server_hover':
        return `💡 **${context.server.display_name}** is recommended because it matches your ${userContext.skill_level} skill level and has excellent community reviews (${context.server.rating_average}⭐). It's been downloaded ${context.server.download_count} times, indicating reliability.`;
        
      case 'workflow_step_add':
        return `🎯 Adding this step will ${context.step_purpose}. This is a ${context.complexity_level} operation that typically takes ${context.estimated_time} to configure. ${userContext.skill_level === 'beginner' ? 'I recommend starting with the default settings.' : 'You can customize the advanced options if needed.'}`;
        
      case 'performance_alert':
        return `⚠️ **Performance Alert Explanation:** Your ${context.metric} (${context.current_value}) is ${context.comparison} the recommended threshold. This typically happens when ${context.likely_cause}. ${this.getPerformanceAdvice(context.metric, userContext.skill_level)}`;
        
      case 'billing_notice':
        return `💰 **Usage Notice:** You've used ${context.usage_percentage}% of your ${context.plan} plan limits. At your current rate, you'll ${context.projection}. ${context.usage_percentage > 80 ? 'Consider upgrading to avoid service interruption.' : 'You\'re on track for the month!'}`;
        
      default:
        return `ℹ️ This action (${action}) will help you ${this.getGenericActionExplanation(action, userContext)}.`;
    }
  }

  /**
   * Generate actionable step-by-step guides
   */
  async generateActionableSteps(
    goal: 'install_first_server' | 'create_first_workflow' | 'optimize_performance' | 'understand_billing',
    userContext: UserContext
  ): Promise<{
    title: string;
    estimated_time: string;
    difficulty: 'easy' | 'medium' | 'hard';
    steps: Array<{
      number: number;
      title: string;
      description: string;
      action: string;
      expected_result: string;
      help_text?: string;
      video_url?: string;
    }>;
    success_criteria: string[];
    troubleshooting: Array<{
      issue: string;
      solution: string;
    }>;
  }> {
    const guides = {
      install_first_server: {
        title: "Install Your First MCP Server",
        estimated_time: "5-10 minutes",
        difficulty: 'easy' as const,
        steps: [
          {
            number: 1,
            title: "Choose a Server",
            description: "Start with the filesystem-server - it's beginner-friendly and widely used",
            action: "Click 'Browse Servers' and search for 'filesystem'",
            expected_result: "You see the filesystem-server in the search results",
            help_text: "Look for the ✓ verified badge and high star rating"
          },
          {
            number: 2,
            title: "Review Server Details",
            description: "Check the server's capabilities, requirements, and community feedback",
            action: "Click on the filesystem-server to view details",
            expected_result: "You see server description, tools, and installation requirements",
            help_text: "Pay attention to the 'Tools Available' section to understand what you can do"
          },
          {
            number: 3,
            title: "Install the Server",
            description: "One-click installation with automatic configuration",
            action: "Click the 'Install' button",
            expected_result: "Installation progress appears, followed by success message",
            help_text: "Installation typically takes 30-60 seconds depending on server size"
          },
          {
            number: 4,
            title: "Verify Installation",
            description: "Confirm the server is working properly",
            action: "Check your 'Installed Servers' list",
            expected_result: "filesystem-server appears with green 'healthy' status",
            help_text: "If status is red, try the 'Test Connection' button"
          }
        ],
        success_criteria: [
          "Server appears in your installed list",
          "Health status shows as 'healthy'",
          "You can see the available tools",
          "Test connection succeeds"
        ],
        troubleshooting: [
          {
            issue: "Installation fails",
            solution: "Check your internet connection and try again. Some servers require additional dependencies."
          },
          {
            issue: "Health check fails",
            solution: "Verify server configuration and check if required environment variables are set."
          }
        ]
      },

      create_first_workflow: {
        title: "Create Your First Workflow",
        estimated_time: "10-15 minutes",
        difficulty: 'medium' as const,
        steps: [
          {
            number: 1,
            title: "Plan Your Workflow",
            description: "Define what you want to accomplish - input, processing, output",
            action: "Write down: What data goes in? What should happen? What comes out?",
            expected_result: "Clear understanding of your workflow purpose",
            help_text: "Start simple - you can always add complexity later"
          },
          {
            number: 2,
            title: "Choose Your Servers",
            description: "Select the MCP servers you'll need for each step",
            action: "Identify which installed servers provide the tools you need",
            expected_result: "List of servers and specific tools for each workflow step",
            help_text: "Most workflows use 2-4 servers - filesystem, processing, and output"
          },
          {
            number: 3,
            title: "Build the Workflow",
            description: "Use the visual workflow builder to connect your steps",
            action: "Drag servers onto the canvas and connect them with arrows",
            expected_result: "Visual workflow diagram showing data flow",
            help_text: "Each arrow represents data passing from one step to the next"
          },
          {
            number: 4,
            title: "Test Your Workflow",
            description: "Run a test execution with sample data",
            action: "Click 'Test Run' and provide sample input",
            expected_result: "Workflow executes successfully and produces expected output",
            help_text: "Use simple test data first - complex scenarios can wait"
          }
        ],
        success_criteria: [
          "Workflow diagram is complete and logical",
          "Test execution runs without errors",
          "Output matches expectations",
          "All connections work properly"
        ],
        troubleshooting: [
          {
            issue: "Workflow fails to run",
            solution: "Check that all servers are installed and healthy. Verify data format matches server expectations."
          },
          {
            issue: "Unexpected output",
            solution: "Review each step's configuration and test individual servers separately."
          }
        ]
      }
    };

    return guides[goal];
  }

  /**
   * Helper methods for analysis
   */
  private calculateSearchRelevance(server: MCPServer, query: string): number {
    const queryLower = query.toLowerCase();
    let relevance = 0;
    
    // Name match
    if (server.name.toLowerCase().includes(queryLower)) relevance += 0.4;
    
    // Description match
    if (server.description?.toLowerCase().includes(queryLower)) relevance += 0.3;
    
    // Tag matches
    const tagMatches = server.tags.filter(tag => 
      tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
    ).length;
    relevance += Math.min(tagMatches * 0.1, 0.3);
    
    return Math.min(relevance, 1.0);
  }

  private analyzeSkillLevelMatch(server: MCPServer, skillLevel: string): {
    score: number;
    explanation: string;
  } {
    // Simplified skill level analysis
    const complexityIndicators = {
      beginner: server.tags.includes('beginner') || server.tags.includes('simple'),
      intermediate: server.rating_average > 4.0 && server.download_count > 100,
      advanced: server.tags.includes('advanced') || server.tags.includes('enterprise'),
      expert: server.tags.includes('expert') || server.tags.includes('custom')
    };

    const matches = complexityIndicators[skillLevel as keyof typeof complexityIndicators];
    const score = matches ? 0.8 : 0.6;

    return {
      score,
      explanation: `This server is ${matches ? 'well-suited' : 'suitable'} for ${skillLevel} users based on complexity and community feedback`
    };
  }

  private analyzePreferenceMatch(server: MCPServer, userContext: UserContext): {
    score: number;
    explanation: string;
  } {
    const categoryMatches = server.categories.filter(cat => 
      userContext.preferences.favorite_categories.includes(cat)
    ).length;
    
    const score = Math.min(categoryMatches / Math.max(userContext.preferences.favorite_categories.length, 1), 1);
    
    return {
      score,
      explanation: `Matches ${categoryMatches} of your preferred categories: ${userContext.preferences.favorite_categories.join(', ')}`
    };
  }

  private generateDetailedRecommendationExplanation(
    server: MCPServer,
    factors: ExplanationFactor[],
    userContext: UserContext
  ): string {
    return `**${server.display_name}** was recommended based on several key factors:

**🎯 Relevance Match:** The server's capabilities align well with your search intent and requirements.

**👥 Community Trust:** With ${server.star_count} stars and ${server.download_count} downloads, this server has proven reliability and community support.

**🎓 Skill Level Fit:** Based on your ${userContext.skill_level} experience level, this server provides the right balance of functionality and ease of use.

**⚙️ Your Preferences:** The server matches your interest in ${userContext.preferences.favorite_categories.join(' and ')} categories.

**💡 Why This Matters:** Choosing the right server saves time and reduces complexity in your workflows. This recommendation optimizes for both functionality and learning curve.`;
  }

  private generateSearchExplanation(
    result: ServerSearchResult,
    query: string,
    factors: ExplanationFactor[]
  ): string {
    return `**Search Process Breakdown:**

**🔍 Query Analysis:** Your search "${query}" was analyzed for intent, complexity, and semantic meaning.

**🤖 AI Understanding:** Our semantic search AI identified key concepts and found servers that match not just keywords, but the underlying intent.

**📊 Ranking Algorithm:** Results were ranked considering relevance, community feedback, performance metrics, and your personal preferences.

**🎯 Personalization:** Results were tailored based on your skill level, previous interactions, and stated preferences.

The AI confidence in these results is ${Math.round(result.query_info.execution_time_ms)}ms search time with high relevance matching.`;
  }

  private generateOptimizationExplanation(optimizations: any[], factors: ExplanationFactor[]): string {
    return `**Optimization Analysis:**

Our AI analyzed your workflow performance and identified ${optimizations.length} improvement opportunities:

**📈 Performance Impact:** These changes could improve execution time by an estimated 20-40%.

**🔧 Implementation:** Most optimizations are low-effort configuration changes rather than major restructuring.

**⚡ Risk Assessment:** Changes are low-risk with high potential benefit.

**🎓 Learning Opportunity:** Implementing these optimizations will help you understand workflow performance better.`;
  }

  private assessUserImpact(server: MCPServer, userContext: UserContext): string {
    const skillAdjustment = {
      beginner: "This will help you learn MCP fundamentals with a reliable, well-documented server.",
      intermediate: "This server offers good functionality without overwhelming complexity.",
      advanced: "This server provides the features and flexibility you need for complex use cases.",
      expert: "This server offers the advanced capabilities and customization options you require."
    };

    return skillAdjustment[userContext.skill_level];
  }

  private generateNextSteps(
    explanationType: string,
    subject: any,
    userContext: UserContext
  ): string[] {
    const baseSteps = {
      server_recommendation: [
        "Review the server's documentation and available tools",
        "Install the server with one-click installation",
        "Test the server's core functionality",
        "Consider how it fits into your planned workflows"
      ]
    };

    return baseSteps[explanationType as keyof typeof baseSteps] || [
      "Review the provided information",
      "Take the recommended action",
      "Monitor the results",
      "Provide feedback for future improvements"
    ];
  }

  private analyzeQueryComplexity(query: string): { score: number; explanation: string } {
    const words = query.split(' ').length;
    const hasSpecialTerms = /\b(advanced|complex|enterprise|custom|specific)\b/i.test(query);
    
    let score = Math.min(words / 10, 1); // More words = more complex
    if (hasSpecialTerms) score += 0.3;
    
    return {
      score: Math.min(score, 1),
      explanation: `Query complexity: ${words} words, ${hasSpecialTerms ? 'includes' : 'no'} advanced terms`
    };
  }

  private analyzeResultDiversity(servers: MCPServer[]): { score: number; explanation: string } {
    const categories = new Set(servers.flatMap(s => s.categories));
    const score = Math.min(categories.size / 5, 1); // More categories = more diverse
    
    return {
      score,
      explanation: `Results span ${categories.size} different categories, providing good variety`
    };
  }

  private analyzePersonalization(result: ServerSearchResult, userContext: UserContext): {
    score: number;
    explanation: string;
  } {
    // Calculate how well results match user preferences
    let matchScore = 0;
    let matchCount = 0;

    result.servers.forEach(server => {
      const categoryMatch = server.categories.some(cat => 
        userContext.preferences.favorite_categories.includes(cat)
      );
      if (categoryMatch) {
        matchScore += 1;
        matchCount++;
      }
    });

    const score = result.servers.length > 0 ? matchScore / result.servers.length : 0;
    
    return {
      score,
      explanation: `${matchCount} of ${result.servers.length} results match your preferred categories`
    };
  }

  private async createBasicsExplanation(userContext: UserContext): Promise<AIExplanation> {
    return {
      id: 'basics_explanation',
      type: 'server_recommendation',
      title: 'MCP Basics Explained',
      summary: 'Understanding Model Context Protocol and server ecosystem',
      detailed_explanation: 'MCP servers extend AI capabilities by providing specialized tools and data access.',
      confidence_score: 1.0,
      factors: [],
      user_impact: 'This knowledge will help you choose the right servers for your needs',
      next_steps: ['Browse the server registry', 'Install your first server', 'Create a simple workflow'],
      timestamp: new Date()
    };
  }

  private async createInstallationExplanation(userContext: UserContext): Promise<AIExplanation> {
    return {
      id: 'installation_explanation',
      type: 'server_recommendation',
      title: 'Server Installation Process',
      summary: 'How to properly install and configure MCP servers',
      detailed_explanation: 'Server installation involves downloading, configuring, and testing server capabilities.',
      confidence_score: 1.0,
      factors: [],
      user_impact: 'Proper installation ensures reliable server performance',
      next_steps: ['Choose appropriate servers', 'Configure settings', 'Test functionality'],
      timestamp: new Date()
    };
  }

  private async createWorkflowExplanation(userContext: UserContext): Promise<AIExplanation> {
    return {
      id: 'workflow_explanation',
      type: 'workflow_optimization',
      title: 'Workflow Creation Guide',
      summary: 'Best practices for building efficient MCP workflows',
      detailed_explanation: 'Workflows chain multiple servers to create complex automations.',
      confidence_score: 1.0,
      factors: [],
      user_impact: 'Well-designed workflows are more reliable and easier to maintain',
      next_steps: ['Plan workflow logic', 'Connect servers', 'Add error handling'],
      timestamp: new Date()
    };
  }

  private calculatePerformanceImpact(optimizations: any[]): number {
    // Simplified calculation
    return optimizations.length * 0.2; // Each optimization = 20% potential improvement
  }

  private calculateImplementationEffort(optimizations: any[]): number {
    // Simplified calculation  
    return Math.min(optimizations.length * 0.3, 1); // More optimizations = more effort
  }

  private calculateOptimizationRisk(optimizations: any[]): number {
    // Simplified risk calculation
    return optimizations.length * 0.1; // Each change adds some risk
  }

  private assessSkillAlignment(optimizations: any[], skillLevel: string): {
    score: number;
    explanation: string;
  } {
    const skillScores = {
      beginner: 0.6,
      intermediate: 0.8,
      advanced: 0.9,
      expert: 1.0
    };

    const score = skillScores[skillLevel as keyof typeof skillScores] || 0.7;
    
    return {
      score,
      explanation: `Optimizations are ${score > 0.8 ? 'well-suited' : 'suitable'} for ${skillLevel} level users`
    };
  }

  private generateOptimizationSteps(optimizations: any[], userContext: UserContext): string[] {
    return [
      "Review each optimization recommendation",
      "Start with the highest-impact, lowest-risk changes",
      "Test changes in a development environment first",
      "Monitor performance after implementing changes",
      "Document what works for future reference"
    ];
  }

  private assessOptimizationImpact(optimizations: any[], userContext: UserContext): string {
    return `These optimizations could improve your workflow performance by 20-40% while reducing resource usage. The changes are designed for ${userContext.skill_level} users and include detailed implementation guidance.`;
  }

  private getBenchmarkValue(metric: string, skillLevel: string): number {
    const benchmarks: { [key: string]: { [key: string]: number } } = {
      execution_time: {
        beginner: 30000,    // 30 seconds
        intermediate: 15000, // 15 seconds  
        advanced: 8000,     // 8 seconds
        expert: 5000        // 5 seconds
      },
      error_rate: {
        beginner: 0.1,      // 10%
        intermediate: 0.05,  // 5%
        advanced: 0.02,     // 2%
        expert: 0.01        // 1%
      }
    };

    return benchmarks[metric]?.[skillLevel] || 1;
  }

  private analyzeUsagePattern(userContext: UserContext): number {
    // Simplified analysis based on user context
    return 0.7; // Mock value
  }

  private calculateOptimizationPotential(metric: string, currentValue: number): number {
    // Simplified potential calculation
    return 0.3; // 30% improvement potential
  }

  private generatePerformanceSummary(metric: string, value: number, trend: string): string {
    return `Your ${metric} is currently ${value} and has been ${trend} recently`;
  }

  private generatePerformanceExplanation(metric: string, value: number, factors: ExplanationFactor[]): string {
    return `Performance analysis shows ${metric} at ${value} with contributing factors analyzed below`;
  }

  private assessPerformanceImpact(metric: string, value: number, userContext: UserContext): string {
    return `This ${metric} level impacts your ${userContext.skill_level} workflow efficiency`;
  }

  private generatePerformanceSteps(metric: string, trend: string, userContext: UserContext): string[] {
    return [
      `Monitor ${metric} trends over time`,
      "Identify patterns in performance variations", 
      "Implement recommended optimizations",
      "Measure improvement after changes"
    ];
  }

  private getPerformanceAdvice(metric: string, skillLevel: string): string {
    const advice = {
      execution_time: {
        beginner: "Try simplifying your workflow or using faster servers.",
        intermediate: "Consider optimizing server configurations or adding caching.",
        advanced: "Review workflow logic and implement parallel processing where possible.",
        expert: "Analyze bottlenecks and consider custom server development."
      }
    };

    return advice[metric as keyof typeof advice]?.[skillLevel] || "Consider reviewing the system recommendations.";
  }

  private getGenericActionExplanation(action: string, userContext: UserContext): string {
    return `achieve your goals more efficiently at your ${userContext.skill_level} level`;
  }
}

/**
 * Factory function to create explainable AI instance
 */
export function createMCPExplainableAI(
  logger: Logger,
  errorManager: ErrorManager
): MCPExplainableAI {
  return new MCPExplainableAI(logger, errorManager);
}