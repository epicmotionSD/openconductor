/**
 * OpenConductor MCP Minimal Mode
 * 
 * Gemini-style minimal interface focused on AI-powered chat interaction
 * for MCP server discovery and workflow creation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Search, Zap, BookOpen, Settings } from 'lucide-react';

export interface MinimalModeProps {
  onUpgrade?: () => void;
  onOpenFullDashboard?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ActionButton[];
  suggestions?: string[];
}

interface ActionButton {
  id: string;
  label: string;
  action: 'search' | 'install' | 'create_workflow' | 'learn' | 'upgrade';
  data?: any;
}

export const MCPMinimalMode: React.FC<MinimalModeProps> = ({
  onUpgrade,
  onOpenFullDashboard
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Welcome to OpenConductor! I'm your MCP assistant. I can help you discover servers, create workflows, and get started with the MCP ecosystem. What would you like to build today?",
      timestamp: new Date(),
      suggestions: [
        "Find servers for file operations",
        "Create a data processing workflow", 
        "Show me popular servers",
        "Help me get started"
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Show onboarding for new users
    const hasSeenOnboarding = localStorage.getItem('mcp_onboarding_completed');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

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

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleActionClick = (action: ActionButton) => {
    switch (action.action) {
      case 'search':
        // Trigger search with data
        const searchMessage: ChatMessage = {
          id: `search_${Date.now()}`,
          role: 'assistant',
          content: `🔍 Here are the top MCP servers for "${action.data.query}":`,
          timestamp: new Date(),
          actions: [
            { id: '1', label: 'Install filesystem-server', action: 'install', data: { server: 'filesystem-server' } },
            { id: '2', label: 'Install postgres-server', action: 'install', data: { server: 'postgres-server' } },
            { id: '3', label: 'View all servers', action: 'search', data: { query: 'all' } }
          ]
        };
        setMessages(prev => [...prev, searchMessage]);
        break;
        
      case 'install':
        const installMessage: ChatMessage = {
          id: `install_${Date.now()}`,
          role: 'assistant',
          content: `✅ Installing ${action.data.server}... This will take a moment.\n\n📦 **Installation Steps:**\n1. Downloading server package\n2. Setting up configuration\n3. Testing connection\n\nOnce installed, you'll be able to use this server in your workflows!`,
          timestamp: new Date(),
          actions: [
            { id: '1', label: 'Create Workflow', action: 'create_workflow', data: { server: action.data.server } },
            { id: '2', label: 'View Server Details', action: 'search', data: { server: action.data.server } }
          ]
        };
        setMessages(prev => [...prev, installMessage]);
        break;
        
      case 'create_workflow':
        const workflowMessage: ChatMessage = {
          id: `workflow_${Date.now()}`,
          role: 'assistant',
          content: `🎯 Let's create a workflow! I can help you build:\n\n**Simple Workflows:**\n• File processing pipeline\n• Data transformation\n• API integration\n\n**Advanced Workflows:**\n• Multi-step automation\n• Conditional logic\n• Error handling\n\nWhat type of workflow would you like to create?`,
          timestamp: new Date(),
          actions: [
            { id: '1', label: 'File Processing', action: 'create_workflow', data: { type: 'file_processing' } },
            { id: '2', label: 'Data Pipeline', action: 'create_workflow', data: { type: 'data_pipeline' } },
            { id: '3', label: 'Custom Workflow', action: 'create_workflow', data: { type: 'custom' } }
          ]
        };
        setMessages(prev => [...prev, workflowMessage]);
        break;
        
      case 'learn':
        const learnMessage: ChatMessage = {
          id: `learn_${Date.now()}`,
          role: 'assistant',
          content: `📚 **MCP Learning Resources:**\n\n**Quick Start:**\n• What is MCP? (5 min read)\n• Your first server installation\n• Building your first workflow\n\n**Advanced Topics:**\n• Server development\n• Complex workflows\n• Enterprise features\n\nWhich topic interests you most?`,
          timestamp: new Date(),
          actions: [
            { id: '1', label: 'What is MCP?', action: 'learn', data: { topic: 'intro' } },
            { id: '2', label: 'First Installation', action: 'learn', data: { topic: 'install' } },
            { id: '3', label: 'First Workflow', action: 'learn', data: { topic: 'workflow' } }
          ]
        };
        setMessages(prev => [...prev, learnMessage]);
        break;
        
      case 'upgrade':
        if (onUpgrade) {
          onUpgrade();
        }
        break;
    }
  };

  const generateAIResponse = (userInput: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('file') || lowerInput.includes('filesystem')) {
      return {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `🗂️ Perfect! For file operations, I recommend the **filesystem-server**. It's our most popular server with 2,340+ downloads.\n\n**What it does:**\n• Read and write files\n• Directory management\n• File watching\n• Batch operations\n\nWould you like me to install it for you?`,
        timestamp: new Date(),
        actions: [
          { id: '1', label: '⚡ Install Now', action: 'install', data: { server: 'filesystem-server' } },
          { id: '2', label: '📖 Learn More', action: 'search', data: { query: 'filesystem' } },
          { id: '3', label: '🔍 See Alternatives', action: 'search', data: { query: 'file operations' } }
        ]
      };
    }
    
    if (lowerInput.includes('database') || lowerInput.includes('sql')) {
      return {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `🗄️ Great choice! For database operations, I have several options:\n\n**🔥 Most Popular:**\n• **postgres-server** - Full PostgreSQL support\n• **mysql-server** - MySQL operations\n• **sqlite-server** - Lightweight database\n\n**💡 Pro Tip:** postgres-server is highly rated (4.8⭐) and works great with complex queries!`,
        timestamp: new Date(),
        actions: [
          { id: '1', label: 'Install PostgreSQL Server', action: 'install', data: { server: 'postgres-server' } },
          { id: '2', label: 'Compare Database Servers', action: 'search', data: { query: 'database' } },
          { id: '3', label: 'Create Database Workflow', action: 'create_workflow', data: { type: 'database' } }
        ]
      };
    }
    
    if (lowerInput.includes('workflow') || lowerInput.includes('create') || lowerInput.includes('build')) {
      return {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `⚡ Let's build something amazing! I'll guide you through creating your first workflow.\n\n**🎯 Popular Workflow Types:**\n• **Data Processing** - Transform and analyze data\n• **File Management** - Organize and process files\n• **API Integration** - Connect different services\n• **Automation** - Scheduled tasks and monitoring\n\nWhich type matches your needs?`,
        timestamp: new Date(),
        actions: [
          { id: '1', label: '📊 Data Processing', action: 'create_workflow', data: { type: 'data_processing' } },
          { id: '2', label: '📁 File Management', action: 'create_workflow', data: { type: 'file_management' } },
          { id: '3', label: '🔗 API Integration', action: 'create_workflow', data: { type: 'api_integration' } }
        ]
      };
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('start') || lowerInput.includes('begin')) {
      return {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `🚀 **Welcome to the MCP ecosystem!** Here's how to get started:\n\n**Step 1:** Choose your first server\n**Step 2:** Install it with one click\n**Step 3:** Create a simple workflow\n**Step 4:** Run and monitor your automation\n\n**🎁 New User Bonus:** Your first 50 workflow executions are free!`,
        timestamp: new Date(),
        actions: [
          { id: '1', label: '🔍 Browse Servers', action: 'search', data: { query: 'popular' } },
          { id: '2', label: '📚 Quick Tutorial', action: 'learn', data: { topic: 'getting_started' } },
          { id: '3', label: '🎯 Start Onboarding', action: 'learn', data: { topic: 'onboarding' } }
        ]
      };
    }
    
    // Default response
    return {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: `I understand you're interested in "${userInput}". Let me help you find the right MCP servers and workflows for your needs.\n\n**🔍 I can help you:**\n• Discover relevant servers\n• Install and configure them\n• Create custom workflows\n• Learn best practices\n\nWhat specific functionality are you looking for?`,
      timestamp: new Date(),
      actions: [
        { id: '1', label: 'Search Servers', action: 'search', data: { query: userInput } },
        { id: '2', label: 'Get Recommendations', action: 'search', data: { query: 'recommended' } },
        { id: '3', label: 'Learn More', action: 'learn', data: { topic: 'overview' } }
      ]
    };
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MCP Assistant</h1>
            <p className="text-xs text-gray-500">The npm for MCP Servers</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Help & Onboarding"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          
          {onOpenFullDashboard && (
            <button
              onClick={onOpenFullDashboard}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Full Dashboard"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">MCP Assistant</span>
                </div>
              )}
              
              <div
                className={`
                  px-4 py-3 rounded-2xl
                  ${message.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-gray-50 text-gray-900'
                  }
                `}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
                
                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                    {message.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-1 px-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">MCP Assistant</span>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about MCP servers, workflows, or anything else..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-500">Quick actions:</span>
          <button
            onClick={() => handleSuggestionClick('Find popular servers')}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Search className="w-3 h-3 inline mr-1" />
            Popular
          </button>
          <button
            onClick={() => handleSuggestionClick('Create my first workflow')}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Zap className="w-3 h-3 inline mr-1" />
            Create
          </button>
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <BookOpen className="w-3 h-3 inline mr-1" />
            Learn
          </button>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

/**
 * Onboarding Modal Component
 */
interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const onboardingSteps = [
    {
      title: "Welcome to OpenConductor MCP! 🎉",
      content: "You've just joined the largest ecosystem for MCP server discovery and workflow automation. Let me show you around!",
      action: "Let's start!"
    },
    {
      title: "What are MCP Servers? 🔧",
      content: "MCP servers are tools that extend AI capabilities. Think of them as plugins - each server provides specific functions like file operations, database access, or web services.",
      action: "Got it!"
    },
    {
      title: "Discover & Install Servers 📦",
      content: "Browse our registry of 2,000+ servers. Use AI-powered search to find exactly what you need, then install with one click. Start with popular servers like filesystem or postgres.",
      action: "Show me servers"
    },
    {
      title: "Create Workflows ⚡",
      content: "Chain multiple servers together to create powerful automations. Our visual builder makes it easy - just drag, drop, and connect your workflow steps.",
      action: "Create workflow"
    },
    {
      title: "Monitor & Scale 📊",
      content: "Watch your workflows run in real-time, get performance insights, and scale automatically. Track usage and optimize for better results.",
      action: "See monitoring"
    },
    {
      title: "Ready to Build! 🚀",
      content: "You're all set! Start by asking me what you want to build. I'll help you find the right servers and create your first workflow. Remember: first 50 executions are free!",
      action: "Start building"
    }
  ];
  
  const currentStepData = onboardingSteps[currentStep];
  
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('mcp_onboarding_completed', 'true');
      onClose();
    }
  };
  
  const handleSkip = () => {
    localStorage.setItem('mcp_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStepData.action}
          </button>
        </div>
        
        {/* Step indicator */}
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {onboardingSteps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MCPMinimalMode;