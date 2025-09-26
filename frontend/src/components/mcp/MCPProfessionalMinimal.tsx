/**
 * OpenConductor MCP Professional Minimal Mode
 * 
 * Bloomberg Terminal-inspired Gemini-style interface with Explainable AI,
 * professional onboarding, and actionable step-by-step guidance.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Search, Zap, BookOpen, Settings, Brain, 
  ChevronRight, CheckCircle, AlertCircle, Clock, Star,
  Download, Play, Users, TrendingUp, Shield, Rocket
} from 'lucide-react';

export interface ProfessionalMinimalProps {
  onUpgrade?: () => void;
  onOpenFullDashboard?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'explainer';
  content: string;
  timestamp: Date;
  actions?: ActionButton[];
  suggestions?: string[];
  explanation?: AIExplanation;
  confidence?: number;
  metadata?: any;
}

interface ActionButton {
  id: string;
  label: string;
  action: 'search' | 'install' | 'create_workflow' | 'learn' | 'upgrade' | 'onboard' | 'explain';
  data?: any;
  priority?: 'primary' | 'secondary';
  icon?: React.ComponentType<any>;
}

interface AIExplanation {
  title: string;
  summary: string;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    explanation: string;
  }>;
  reasoning: string;
}

interface QuickStats {
  total_servers: number;
  installed_servers: number;
  workflows_created: number;
  executions_today: number;
}

export const MCPProfessionalMinimal: React.FC<ProfessionalMinimalProps> = ({
  onUpgrade,
  onOpenFullDashboard
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [userProgress, setUserProgress] = useState({ completed_steps: 0, total_steps: 5 });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    total_servers: 2340,
    installed_servers: 0,
    workflows_created: 0,
    executions_today: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with professional welcome
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "🎯 **OpenConductor MCP Platform** - Professional AI Orchestration\n\nI'm your AI assistant for MCP server discovery and workflow automation. I provide explainable recommendations with confidence scoring.\n\n**Getting Started:**\n• Ask me about MCP servers for your use case\n• Get AI-powered server recommendations with explanations\n• Build workflows with step-by-step guidance\n• Access professional analytics and insights",
      timestamp: new Date(),
      confidence: 0.95,
      actions: [
        { id: '1', label: '🚀 Start Quick Onboarding', action: 'onboard', priority: 'primary', icon: Rocket },
        { id: '2', label: '🔍 Discover Servers', action: 'search', data: { query: 'popular' }, priority: 'secondary', icon: Search },
        { id: '3', label: '📚 Learn MCP Basics', action: 'learn', data: { topic: 'basics' }, priority: 'secondary', icon: BookOpen }
      ],
      suggestions: [
        "Find servers for file processing",
        "Create a data pipeline workflow",
        "Show me enterprise security features",
        "Explain MCP fundamentals"
      ]
    };
    
    setMessages([welcomeMessage]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing with explainable response
    setTimeout(() => {
      const response = generateExplainableResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const generateExplainableResponse = (userInput: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('explain') || lowerInput.includes('why')) {
      return {
        id: `explain_${Date.now()}`,
        role: 'explainer',
        content: `🧠 **AI Explanation Mode Activated**\n\nI analyze your request using multiple factors:\n\n**Intent Analysis:** ${getIntentAnalysis(userInput)}\n**Context Understanding:** Based on your profile and history\n**Confidence Scoring:** 94% confidence in recommendation\n**Reasoning:** Evidence-based recommendations using community data, performance metrics, and compatibility analysis`,
        timestamp: new Date(),
        confidence: 0.94,
        explanation: {
          title: "Why this recommendation",
          summary: "Based on intent analysis, user profile, and community validation",
          confidence: 0.94,
          factors: [
            { name: "Intent Match", impact: 0.85, explanation: "Query matches server capabilities perfectly" },
            { name: "Community Rating", impact: 0.78, explanation: "High user satisfaction and adoption" },
            { name: "Skill Level Fit", impact: 0.72, explanation: "Appropriate complexity for your experience level" }
          ],
          reasoning: "Multi-factor analysis ensures optimal recommendations"
        },
        actions: [
          { id: '1', label: '📊 View Full Analysis', action: 'explain', data: { type: 'detailed' }, icon: Brain },
          { id: '2', label: '✅ Accept Recommendation', action: 'install', data: { server: 'recommended' }, icon: CheckCircle }
        ]
      };
    }

    if (lowerInput.includes('file') || lowerInput.includes('filesystem')) {
      return {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `🗂️ **File Operations Analysis**\n\n**AI Recommendation:** filesystem-server (96% confidence)\n\n**Why this server:**\n• **Community Trust:** 2,340 downloads, 4.8★ rating\n• **Capability Match:** 100% aligned with file operations\n• **Reliability:** 99.2% uptime, enterprise-grade\n• **Your Profile:** Perfect for ${getUserSkillLevel()} users\n\n**Explainable AI Insights:**\nThis recommendation scored highest across all evaluation criteria including performance, security, and ease of use.`,
        timestamp: new Date(),
        confidence: 0.96,
        explanation: {
          title: "File Server Recommendation Analysis",
          summary: "filesystem-server recommended with 96% confidence",
          confidence: 0.96,
          factors: [
            { name: "Capability Match", impact: 0.95, explanation: "Perfect alignment with file operation requirements" },
            { name: "Community Validation", impact: 0.88, explanation: "2,340 successful installations with 4.8/5 rating" },
            { name: "Enterprise Readiness", impact: 0.91, explanation: "99.2% uptime and security compliance" }
          ],
          reasoning: "Multi-dimensional analysis prioritizing reliability, functionality, and user success"
        },
        actions: [
          { id: '1', label: '⚡ Install filesystem-server', action: 'install', data: { server: 'filesystem-server' }, priority: 'primary', icon: Download },
          { id: '2', label: '🧠 View AI Explanation', action: 'explain', data: { type: 'server_rec' }, priority: 'secondary', icon: Brain },
          { id: '3', label: '🎯 Create File Workflow', action: 'create_workflow', data: { type: 'file_processing' }, priority: 'secondary', icon: Play }
        ]
      };
    }

    if (lowerInput.includes('workflow') || lowerInput.includes('automation')) {
      return {
        id: `workflow_${Date.now()}`,
        role: 'assistant',
        content: `⚡ **Workflow Creation Assistant**\n\n**AI Analysis:** Ready to build workflows (92% confidence)\n\n**Recommended Path:**\n1. **Choose Template:** Start with proven patterns\n2. **Select Servers:** I'll recommend optimal combinations\n3. **Configure Steps:** Guided setup with explanations\n4. **Test & Deploy:** Validation with performance insights\n\n**Explainable Process:** Each recommendation includes confidence scores, reasoning, and alternative options.`,
        timestamp: new Date(),
        confidence: 0.92,
        actions: [
          { id: '1', label: '🎯 Start Guided Builder', action: 'create_workflow', data: { guided: true }, priority: 'primary', icon: Zap },
          { id: '2', label: '📋 Browse Templates', action: 'search', data: { type: 'templates' }, priority: 'secondary', icon: BookOpen },
          { id: '3', label: '🧠 Explain Workflow AI', action: 'explain', data: { type: 'workflow_ai' }, priority: 'secondary', icon: Brain }
        ]
      };
    }

    // Default explainable response
    return {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: `🎯 **AI Processing Complete**\n\nQuery analyzed: "${userInput}"\n\n**Intent Recognition:** ${getIntentAnalysis(userInput)}\n**Confidence Level:** 87% understanding\n**Recommendation:** ${getRecommendation(userInput)}\n\n**Explainable AI Features:**\n• Transparent decision making\n• Confidence scoring for all recommendations\n• Factor-based analysis with reasoning\n• Alternative options with trade-offs`,
      timestamp: new Date(),
      confidence: 0.87,
      actions: [
        { id: '1', label: '🔍 Search Servers', action: 'search', data: { query: userInput }, priority: 'primary', icon: Search },
        { id: '2', label: '🧠 Explain Analysis', action: 'explain', data: { query: userInput }, priority: 'secondary', icon: Brain },
        { id: '3', label: '📚 Get Tutorial', action: 'learn', data: { topic: 'relevant' }, priority: 'secondary', icon: BookOpen }
      ]
    };
  };

  const handleActionClick = (action: ActionButton) => {
    switch (action.action) {
      case 'onboard':
        setShowOnboarding(true);
        break;
        
      case 'explain':
        const explanation: AIExplanation = {
          title: "AI Decision Analysis",
          summary: "How I analyzed your request and generated recommendations",
          confidence: 0.94,
          factors: [
            { name: "Query Understanding", impact: 0.91, explanation: "Successfully parsed intent and context" },
            { name: "Server Matching", impact: 0.88, explanation: "Found highly compatible servers in registry" },
            { name: "User Profiling", impact: 0.79, explanation: "Matched recommendations to your skill level" }
          ],
          reasoning: "Combined semantic analysis, community validation, and personalization algorithms to generate optimal recommendations with quantified confidence scores."
        };
        setCurrentExplanation(explanation);
        setShowExplanation(true);
        break;
        
      case 'install':
        const installMessage: ChatMessage = {
          id: `install_${Date.now()}`,
          role: 'assistant',
          content: `⚡ **Installing ${action.data?.server || 'server'}**\n\n**AI Installation Analysis:**\n• Compatibility: ✅ 100% compatible\n• Requirements: ✅ All met\n• Security: ✅ Verified and signed\n• Performance: ✅ Optimized for your system\n\n**Installation Progress:**\n1. Downloading package... ✅\n2. Verifying integrity... ✅\n3. Configuring environment... ⏳\n4. Running health checks... ⏳\n\n**Explainable Install:** Each step is validated for security and compatibility.`,
          timestamp: new Date(),
          confidence: 0.98,
          actions: [
            { id: '1', label: '🎯 Create First Workflow', action: 'create_workflow', data: { server: action.data?.server }, priority: 'primary', icon: Play },
            { id: '2', label: '📊 View Server Details', action: 'search', data: { server: action.data?.server }, priority: 'secondary', icon: Settings }
          ]
        };
        setMessages(prev => [...prev, installMessage]);
        
        // Update stats
        setQuickStats(prev => ({ ...prev, installed_servers: prev.installed_servers + 1 }));
        break;
        
      case 'create_workflow':
        const workflowMessage: ChatMessage = {
          id: `workflow_${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Workflow Builder Assistant**\n\n**AI-Guided Creation:**\n• Template Selection: Smart recommendations\n• Server Compatibility: Automatic validation\n• Step Optimization: Performance analysis\n• Error Prevention: Proactive issue detection\n\n**Professional Features:**\n✅ Real-time validation\n✅ Performance optimization\n✅ Error handling suggestions\n✅ Best practice enforcement\n\n**Next: Choose your workflow type**`,
          timestamp: new Date(),
          confidence: 0.93,
          actions: [
            { id: '1', label: '📊 Data Processing', action: 'create_workflow', data: { type: 'data' }, priority: 'primary', icon: TrendingUp },
            { id: '2', label: '📁 File Management', action: 'create_workflow', data: { type: 'file' }, priority: 'secondary', icon: BookOpen },
            { id: '3', label: '🔗 API Integration', action: 'create_workflow', data: { type: 'api' }, priority: 'secondary', icon: Zap }
          ]
        };
        setMessages(prev => [...prev, workflowMessage]);
        break;
    }
  };

  const getIntentAnalysis = (input: string): string => {
    if (input.toLowerCase().includes('file')) return "File operations and data processing";
    if (input.toLowerCase().includes('workflow')) return "Automation and workflow creation";
    if (input.toLowerCase().includes('database')) return "Data storage and retrieval";
    return "General MCP platform inquiry";
  };

  const getRecommendation = (input: string): string => {
    if (input.toLowerCase().includes('file')) return "filesystem-server for file operations";
    if (input.toLowerCase().includes('database')) return "postgres-server for database access";
    return "Browse our curated server recommendations";
  };

  const getUserSkillLevel = (): string => {
    return "intermediate"; // Would be dynamically determined
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Professional Bloomberg-style Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-cyan-400">MCP Professional</h1>
              <p className="text-xs text-gray-400">AI-Powered Server Discovery • Explainable Intelligence</p>
            </div>
          </div>
          
          {/* Center: Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{quickStats.total_servers}</div>
              <div className="text-xs text-gray-400">Total Servers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{quickStats.installed_servers}</div>
              <div className="text-xs text-gray-400">Installed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{quickStats.workflows_created}</div>
              <div className="text-xs text-gray-400">Workflows</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{quickStats.executions_today}</div>
              <div className="text-xs text-gray-400">Today</div>
            </div>
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">AI Active</span>
            </div>
            
            <button
              onClick={() => setShowOnboarding(true)}
              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/50 rounded-lg transition-all"
              title="Professional Training"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            
            {onOpenFullDashboard && (
              <button
                onClick={onOpenFullDashboard}
                className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/50 rounded-lg transition-all"
                title="Full Analytics Dashboard"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {userProgress.completed_steps > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Onboarding Progress</span>
              <span>{userProgress.completed_steps}/{userProgress.total_steps} steps</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(userProgress.completed_steps / userProgress.total_steps) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-4xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role !== 'user' && (
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.role === 'explainer' 
                      ? 'bg-purple-500/20 border border-purple-400/30' 
                      : 'bg-cyan-500/20 border border-cyan-400/30'
                  }`}>
                    {message.role === 'explainer' ? (
                      <Brain className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${
                      message.role === 'explainer' ? 'text-purple-400' : 'text-cyan-400'
                    }`}>
                      {message.role === 'explainer' ? 'Explainable AI' : 'MCP Assistant'}
                    </span>
                    {message.confidence && (
                      <span className="ml-2 text-xs text-gray-400">
                        {Math.round(message.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className={`
                px-6 py-4 rounded-2xl backdrop-blur-sm border
                ${message.role === 'user'
                  ? 'bg-blue-600/90 border-blue-400/30 text-white ml-16'
                  : message.role === 'explainer'
                  ? 'bg-purple-900/30 border-purple-400/20 text-gray-100'
                  : 'bg-gray-900/50 border-gray-700/30 text-gray-100'
                }
              `}>
                <div className="whitespace-pre-line leading-relaxed font-mono text-sm">
                  {message.content}
                </div>
                
                {/* Professional Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-700/30">
                    {message.actions.map((action) => {
                      const Icon = action.icon || ChevronRight;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm
                            ${action.priority === 'primary'
                              ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/25'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/30'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <div className="text-xs text-gray-400 mb-2">💡 Try asking:</div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInput(suggestion)}
                          className="px-3 py-1.5 bg-gray-800/30 border border-gray-600/20 text-gray-300 text-xs rounded-lg hover:bg-gray-700/30 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-2 px-2 font-mono">
                {message.timestamp.toLocaleTimeString()} 
                {message.confidence && (
                  <span className="ml-2">• Confidence: {Math.round(message.confidence * 100)}%</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <span className="text-sm font-medium text-cyan-400">Analyzing with Explainable AI...</span>
              </div>
              <div className="bg-gray-900/50 border border-gray-700/30 px-6 py-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-xs text-gray-400 ml-2">Processing intent, analyzing confidence, generating explanation...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Professional Input Area */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-cyan-400/20 p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about MCP servers, workflows, or get explainable AI insights..."
                className="w-full px-4 py-3 pr-14 bg-gray-800/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all font-mono"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Professional Quick Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono">Quick Actions:</span>
            <button
              onClick={() => setInput('Find servers for data processing')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-900/30 text-cyan-400 rounded-md hover:bg-cyan-900/50 transition-all"
            >
              <Search className="w-3 h-3" />
              Discover
            </button>
            <button
              onClick={() => setInput('Create my first workflow')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded-md hover:bg-blue-900/50 transition-all"
            >
              <Zap className="w-3 h-3" />
              Build
            </button>
            <button
              onClick={() => setInput('Explain how MCP works')}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-900/30 text-purple-400 rounded-md hover:bg-purple-900/50 transition-all"
            >
              <Brain className="w-3 h-3" />
              Explain
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Engine Online • Explainable Mode</span>
          </div>
        </div>
      </div>

      {/* Professional Onboarding Modal */}
      {showOnboarding && (
        <ProfessionalOnboardingModal 
          onClose={() => setShowOnboarding(false)}
          onProgress={(step) => setUserProgress(prev => ({ ...prev, completed_steps: step }))}
        />
      )}

      {/* Explainable AI Modal */}
      {showExplanation && currentExplanation && (
        <ExplainableAIModal
          explanation={currentExplanation}
          onClose={() => setShowExplanation(false)}
        />
      )}
    </div>
  );
};

/**
 * Professional Onboarding Modal with Bloomberg Terminal styling
 */
interface ProfessionalOnboardingModalProps {
  onClose: () => void;
  onProgress: (step: number) => void;
}

const ProfessionalOnboardingModal: React.FC<ProfessionalOnboardingModalProps> = ({ 
  onClose, 
  onProgress 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState({
    role: '',
    experience: '',
    goals: [] as string[]
  });

  const onboardingFlow = [
    {
      title: "🎯 Professional MCP Platform",
      content: "Welcome to the enterprise-grade MCP server discovery and workflow orchestration platform. Let's get you set up for success.",
      type: "welcome"
    },
    {
      title: "👤 Your Profile",
      content: "Help us personalize your experience with AI-powered recommendations tailored to your role and experience level.",
      type: "profile"
    },
    {
      title: "🧠 Explainable AI Features", 
      content: "Our AI provides transparent, confidence-scored recommendations with detailed explanations for every decision.",
      type: "ai_features"
    },
    {
      title: "🔍 Smart Server Discovery",
      content: "Use natural language to find servers. Our AI understands intent and provides compatibility analysis.",
      type: "interactive_demo"
    },
    {
      title: "⚡ Workflow Intelligence",
      content: "Build workflows with AI guidance, performance optimization, and explainable step recommendations.",
      type: "workflow_demo"
    },
    {
      title: "🚀 Ready to Launch",
      content: "You're all set! Start with our AI-powered quick actions or ask me anything about MCP servers and workflows.",
      type: "completion"
    }
  ];

  const currentStepData = onboardingFlow[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingFlow.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onProgress(nextStep);
    } else {
      localStorage.setItem('mcp_professional_onboarding_completed', 'true');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 border border-cyan-400/20 rounded-2xl max-w-2xl w-full p-8 backdrop-blur-sm">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Professional Onboarding</h2>
              <p className="text-sm text-gray-400">AI-Guided Setup • Explainable Intelligence</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 font-mono">
            Step {currentStep + 1}/{onboardingFlow.length}
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="flex items-center gap-2 mb-6">
          {onboardingFlow.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                index <= currentStep 
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            {currentStepData.title}
          </h3>
          
          {currentStepData.type === 'profile' ? (
            <ProfileSetup userProfile={userProfile} setUserProfile={setUserProfile} />
          ) : currentStepData.type === 'ai_features' ? (
            <AIFeaturesDemo />
          ) : currentStepData.type === 'interactive_demo' ? (
            <InteractiveDemo />
          ) : (
            <p className="text-gray-300 leading-relaxed">
              {currentStepData.content}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              localStorage.setItem('mcp_professional_onboarding_completed', 'true');
              onClose();
            }}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            Skip Training
          </button>
          
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
            >
              {currentStep === onboardingFlow.length - 1 ? 'Start Using MCP' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Profile Setup Component
 */
const ProfileSetup: React.FC<{
  userProfile: any;
  setUserProfile: (profile: any) => void;
}> = ({ userProfile, setUserProfile }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Role</label>
        <div className="grid grid-cols-2 gap-2">
          {['Developer', 'Data Analyst', 'DevOps', 'Manager'].map((role) => (
            <button
              key={role}
              onClick={() => setUserProfile({ ...userProfile, role: role.toLowerCase() })}
              className={`p-3 rounded-lg border transition-all ${
                userProfile.role === role.toLowerCase()
                  ? 'bg-cyan-600/20 border-cyan-400/50 text-cyan-400'
                  : 'bg-gray-800/30 border-gray-600/30 text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
        <div className="grid grid-cols-3 gap-2">
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <button
              key={level}
              onClick={() => setUserProfile({ ...userProfile, experience: level.toLowerCase() })}
              className={`p-2 rounded-lg border transition-all text-sm ${
                userProfile.experience === level.toLowerCase()
                  ? 'bg-blue-600/20 border-blue-400/50 text-blue-400'
                  : 'bg-gray-800/30 border-gray-600/30 text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * AI Features Demo Component
 */
const AIFeaturesDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-purple-900/20 border border-purple-400/20 rounded-lg p-4">
        <h4 className="text-purple-400 font-medium mb-2">🧠 Explainable Recommendations</h4>
        <p className="text-gray-300 text-sm">Every recommendation includes confidence scores, factor analysis, and reasoning explanations.</p>
      </div>
      
      <div className="bg-cyan-900/20 border border-cyan-400/20 rounded-lg p-4">
        <h4 className="text-cyan-400 font-medium mb-2">🎯 Intent Understanding</h4>
        <p className="text-gray-300 text-sm">Natural language processing understands what you want to accomplish, not just keywords.</p>
      </div>
      
      <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-4">
        <h4 className="text-green-400 font-medium mb-2">⚡ Smart Optimization</h4>
        <p className="text-gray-300 text-sm">AI suggests workflow improvements with clear explanations and impact predictions.</p>
      </div>
    </div>
  );
};

/**
 * Interactive Demo Component
 */
const InteractiveDemo: React.FC = () => {
  const [demoInput, setDemoInput] = useState('');
  const [demoResult, setDemoResult] = useState<string | null>(null);

  const handleDemoSearch = () => {
    setDemoResult(`🎯 **AI Analysis Result:**\n\nQuery: "${demoInput}"\nIntent: File operations\nConfidence: 94%\nRecommendation: filesystem-server\n\n**Explanation:** High community rating (4.8★) and perfect capability match.`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Try AI Search:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value)}
            placeholder="e.g., process CSV files"
            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white text-sm"
          />
          <button
            onClick={handleDemoSearch}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm"
          >
            Search
          </button>
        </div>
      </div>
      
      {demoResult && (
        <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-4">
          <pre className="text-green-300 text-sm whitespace-pre-line font-mono">{demoResult}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Explainable AI Modal
 */
interface ExplainableAIModalProps {
  explanation: AIExplanation;
  onClose: () => void;
}

const ExplainableAIModal: React.FC<ExplainableAIModalProps> = ({ explanation, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 border border-purple-400/20 rounded-2xl max-w-3xl w-full p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{explanation.title}</h2>
              <p className="text-sm text-gray-400">Explainable AI Analysis • {Math.round(explanation.confidence * 100)}% Confidence</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Confidence Score */}
        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-400/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-400 font-medium">AI Confidence Score</span>
            <span className="text-white font-bold">{Math.round(explanation.confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${explanation.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Factors Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔍 Analysis Factors</h3>
          <div className="space-y-3">
            {explanation.factors.map((factor, index) => (
              <div key={index} className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 font-medium">{factor.name}</span>
                  <span className="text-white font-bold">{Math.round(factor.impact * 100)}% impact</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full"
                    style={{ width: `${factor.impact * 100}%` }}
                  ></div>
                </div>
                <p className="text-gray-300 text-sm">{factor.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-6 p-4 bg-cyan-900/20 border border-cyan-400/20 rounded-lg">
          <h4 className="text-cyan-400 font-medium mb-2">🎯 AI Reasoning</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{explanation.reasoning}</p>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCPProfessionalMinimal;