/**
 * OpenConductor MCP Dashboard
 * 
 * Focus mode dashboard for MCP server discovery and workflow management.
 * Implements the dual-pane architecture with semantic search and AI assistance.
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, Play, Settings, Users, TrendingUp } from 'lucide-react';

export interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  author_name?: string;
  categories: string[];
  tags: string[];
  star_count: number;
  download_count: number;
  rating_average: number;
  is_featured: boolean;
  is_verified: boolean;
  performance_tier: string;
  tool_count: number;
  created_at: string;
}

export interface MCPWorkflow {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  star_count: number;
  execution_count: number;
  is_public: boolean;
  is_template: boolean;
  author_name?: string;
  created_at: string;
}

export type FocusMode = 'discovery' | 'workflow' | 'execution' | 'analytics';

/**
 * Main MCP Dashboard Component
 */
export const MCPDashboard: React.FC = () => {
  const [focusMode, setFocusMode] = useState<FocusMode>('discovery');
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<MCPWorkflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearch, setSemanticSearch] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Navigation Panel */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">MCP Registry</h1>
          <p className="text-sm text-gray-600 mt-1">The npm for MCP Servers</p>
        </div>

        {/* Focus Mode Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <FocusModeButton
              mode="discovery"
              currentMode={focusMode}
              onClick={setFocusMode}
              icon={Search}
              label="Discovery"
            />
            <FocusModeButton
              mode="workflow"
              currentMode={focusMode}
              onClick={setFocusMode}
              icon={Play}
              label="Workflows"
            />
            <FocusModeButton
              mode="execution"
              currentMode={focusMode}
              onClick={setFocusMode}
              icon={TrendingUp}
              label="Executions"
            />
            <FocusModeButton
              mode="analytics"
              currentMode={focusMode}
              onClick={setFocusMode}
              icon={Settings}
              label="Analytics"
            />
          </div>
        </div>

        {/* Dynamic Left Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {focusMode === 'discovery' && (
            <ServerBrowser 
              onServerSelect={setSelectedServer}
              selectedServer={selectedServer}
            />
          )}
          {focusMode === 'workflow' && (
            <WorkflowBrowser
              onWorkflowSelect={setActiveWorkflow}
              selectedWorkflow={activeWorkflow}
            />
          )}
          {focusMode === 'execution' && (
            <ExecutionMonitor />
          )}
          {focusMode === 'analytics' && (
            <AnalyticsBrowser />
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            {focusMode === 'discovery' && 'Submit New Server'}
            {focusMode === 'workflow' && 'Create Workflow'}
            {focusMode === 'execution' && 'View All Executions'}
            {focusMode === 'analytics' && 'Export Report'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={
                  focusMode === 'discovery' ? 'Search MCP servers...' :
                  focusMode === 'workflow' ? 'Search workflows...' :
                  'Search...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {focusMode === 'discovery' && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={semanticSearch}
                    onChange={(e) => setSemanticSearch(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Semantic Search
                </label>
              </div>
            )}
            
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </header>

        {/* Focus Mode Content */}
        <div className="flex-1 overflow-hidden">
          <FocusModeRenderer 
            mode={focusMode}
            selectedServer={selectedServer}
            activeWorkflow={activeWorkflow}
            searchQuery={searchQuery}
            semanticSearch={semanticSearch}
            onServerSelect={setSelectedServer}
            onWorkflowSelect={setActiveWorkflow}
          />
        </div>
      </main>

      {/* Right Context Panel */}
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* AI Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-600">Ask about MCP servers and workflows</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <ChatInterface
              focusMode={focusMode}
              selectedServer={selectedServer}
              activeWorkflow={activeWorkflow}
            />
          </div>
        </div>

        {/* Context Panel */}
        <div className="border-t border-gray-200">
          <ContextPanel 
            server={selectedServer}
            workflow={activeWorkflow}
            mode={focusMode}
          />
        </div>
      </aside>
    </div>
  );
};

/**
 * Focus Mode Button Component
 */
interface FocusModeButtonProps {
  mode: FocusMode;
  currentMode: FocusMode;
  onClick: (mode: FocusMode) => void;
  icon: React.ComponentType<any>;
  label: string;
}

const FocusModeButton: React.FC<FocusModeButtonProps> = ({
  mode, currentMode, onClick, icon: Icon, label
}) => {
  const isActive = currentMode === mode;
  
  return (
    <button
      onClick={() => onClick(mode)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-100'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};

/**
 * Server Browser Component
 */
interface ServerBrowserProps {
  onServerSelect: (server: MCPServer | null) => void;
  selectedServer: MCPServer | null;
}

const ServerBrowser: React.FC<ServerBrowserProps> = ({ onServerSelect, selectedServer }) => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    try {
      // Mock data for now - would call actual API
      const mockServers: MCPServer[] = [
        {
          id: '1',
          name: 'filesystem-server',
          display_name: 'File System Server',
          description: 'Provides access to local file system operations',
          author_name: 'ModelContext Protocol',
          categories: ['filesystem', 'utilities'],
          tags: ['files', 'directory', 'io'],
          star_count: 156,
          download_count: 2340,
          rating_average: 4.8,
          is_featured: true,
          is_verified: true,
          performance_tier: 'standard',
          tool_count: 8,
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'postgres-server',
          display_name: 'PostgreSQL Server',
          description: 'Database operations for PostgreSQL',
          author_name: 'ModelContext Protocol',
          categories: ['database', 'sql'],
          tags: ['postgres', 'sql', 'database'],
          star_count: 89,
          download_count: 1567,
          rating_average: 4.6,
          is_featured: false,
          is_verified: true,
          performance_tier: 'premium',
          tool_count: 12,
          created_at: '2024-01-20T00:00:00Z'
        }
      ];
      
      setServers(mockServers);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {servers.map((server) => (
        <ServerCard
          key={server.id}
          server={server}
          isSelected={selectedServer?.id === server.id}
          onClick={() => onServerSelect(server)}
        />
      ))}
    </div>
  );
};

/**
 * Server Card Component
 */
interface ServerCardProps {
  server: MCPServer;
  isSelected: boolean;
  onClick: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm">{server.display_name}</h4>
            {server.is_verified && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓
              </span>
            )}
            {server.is_featured && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                ★
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{server.description}</p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {server.star_count}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {server.download_count}
            </span>
            <span className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              {server.tool_count}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {server.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
          >
            {tag}
          </span>
        ))}
        {server.tags.length > 3 && (
          <span className="text-xs text-gray-500">+{server.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Workflow Browser Component
 */
interface WorkflowBrowserProps {
  onWorkflowSelect: (workflow: MCPWorkflow | null) => void;
  selectedWorkflow: MCPWorkflow | null;
}

const WorkflowBrowser: React.FC<WorkflowBrowserProps> = ({ onWorkflowSelect, selectedWorkflow }) => {
  const [workflows, setWorkflows] = useState<MCPWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // Mock data - would call actual API
      const mockWorkflows: MCPWorkflow[] = [
        {
          id: '1',
          name: 'Data Processing Pipeline',
          description: 'Extract, transform, and load data using multiple MCP servers',
          tags: ['data', 'etl', 'pipeline'],
          star_count: 23,
          execution_count: 145,
          is_public: true,
          is_template: true,
          author_name: 'DataTeam',
          created_at: '2024-02-01T00:00:00Z'
        },
        {
          id: '2', 
          name: 'Web Research Assistant',
          description: 'Automated research workflow using web search and file operations',
          tags: ['research', 'web', 'automation'],
          star_count: 67,
          execution_count: 89,
          is_public: true,
          is_template: false,
          author_name: 'ResearchBot',
          created_at: '2024-02-05T00:00:00Z'
        }
      ];
      
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          isSelected={selectedWorkflow?.id === workflow.id}
          onClick={() => onWorkflowSelect(workflow)}
        />
      ))}
    </div>
  );
};

/**
 * Workflow Card Component
 */
interface WorkflowCardProps {
  workflow: MCPWorkflow;
  isSelected: boolean;
  onClick: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{workflow.name}</h4>
        {workflow.is_template && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            Template
          </span>
        )}
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{workflow.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {workflow.star_count}
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {workflow.execution_count}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          by {workflow.author_name}
        </span>
      </div>
    </div>
  );
};

/**
 * Focus Mode Renderer Component
 */
interface FocusModeRendererProps {
  mode: FocusMode;
  selectedServer: MCPServer | null;
  activeWorkflow: MCPWorkflow | null;
  searchQuery: string;
  semanticSearch: boolean;
  onServerSelect: (server: MCPServer | null) => void;
  onWorkflowSelect: (workflow: MCPWorkflow | null) => void;
}

const FocusModeRenderer: React.FC<FocusModeRendererProps> = ({
  mode,
  selectedServer,
  activeWorkflow,
  searchQuery,
  semanticSearch
}) => {
  return (
    <div className="h-full overflow-y-auto">
      {mode === 'discovery' && (
        <ServerDiscoveryInterface 
          selectedServer={selectedServer}
          searchQuery={searchQuery}
          semanticSearch={semanticSearch}
        />
      )}
      {mode === 'workflow' && (
        <WorkflowBuilder activeWorkflow={activeWorkflow} />
      )}
      {mode === 'execution' && (
        <ExecutionDashboard />
      )}
      {mode === 'analytics' && (
        <AnalyticsDashboard />
      )}
    </div>
  );
};

/**
 * Server Discovery Interface
 */
interface ServerDiscoveryInterfaceProps {
  selectedServer: MCPServer | null;
  searchQuery: string;
  semanticSearch: boolean;
}

const ServerDiscoveryInterface: React.FC<ServerDiscoveryInterfaceProps> = ({
  selectedServer,
  searchQuery,
  semanticSearch
}) => {
  if (selectedServer) {
    return <ServerDetailView server={selectedServer} />;
  }

  return (
    <div className="p-6">
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Discover MCP Servers</h3>
        <p className="text-gray-600 mb-6">
          Find the perfect MCP servers for your workflows using{' '}
          {semanticSearch ? 'AI-powered semantic search' : 'traditional search'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">2,340</h4>
            <p className="text-sm text-gray-600">Active Servers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">15,670</h4>
            <p className="text-sm text-gray-600">Tools Available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Server Detail View
 */
interface ServerDetailViewProps {
  server: MCPServer;
}

const ServerDetailView: React.FC<ServerDetailViewProps> = ({ server }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{server.display_name}</h2>
            <p className="text-gray-600">{server.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Install
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Star className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{server.star_count}</div>
            <div className="text-xs text-gray-600">Stars</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{server.download_count}</div>
            <div className="text-xs text-gray-600">Downloads</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{server.rating_average}</div>
            <div className="text-xs text-gray-600">Rating</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{server.tool_count}</div>
            <div className="text-xs text-gray-600">Tools</div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {server.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {server.categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Placeholder components for other focus modes
 */
const WorkflowBuilder: React.FC<{ activeWorkflow: MCPWorkflow | null }> = ({ activeWorkflow }) => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Builder</h3>
        <p className="text-gray-600">Create and edit MCP workflows</p>
      </div>
    </div>
  );
};

const ExecutionDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Execution Monitor</h3>
        <p className="text-gray-600">Monitor workflow executions in real-time</p>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
        <p className="text-gray-600">View usage analytics and insights</p>
      </div>
    </div>
  );
};

const ExecutionMonitor: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 mb-3">Recent Executions</h3>
      <div className="space-y-2">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data Pipeline</span>
            <span className="text-xs text-green-600">Completed</span>
          </div>
        </div>
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">File Processor</span>
            <span className="text-xs text-yellow-600">Running</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsBrowser: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 mb-3">Analytics Overview</h3>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">156</div>
          <div className="text-xs text-gray-600">Servers Installed</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">1,234</div>
          <div className="text-xs text-gray-600">Workflows Created</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">5,678</div>
          <div className="text-xs text-gray-600">Executions</div>
        </div>
      </div>
    </div>
  );
};

/**
 * AI Chat Interface Component
 */
interface ChatInterfaceProps {
  focusMode: FocusMode;
  selectedServer: MCPServer | null;
  activeWorkflow: MCPWorkflow | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ focusMode, selectedServer, activeWorkflow }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I'm your MCP assistant. I can help you discover servers, create workflows, and optimize your MCP setup. What would you like to do today?`
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I understand you're looking for help with "${input}". Based on your current focus on ${focusMode}, here are some suggestions...`
      }]);
    }, 1000);
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm
                ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
                }
              `}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about MCP servers..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Context Panel Component
 */
interface ContextPanelProps {
  server: MCPServer | null;
  workflow: MCPWorkflow | null;
  mode: FocusMode;
}

const ContextPanel: React.FC<ContextPanelProps> = ({ server, workflow, mode }) => {
  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 mb-3">Context</h3>
      
      {server && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 text-sm mb-1">{server.display_name}</h4>
          <p className="text-xs text-blue-700">{server.tool_count} tools available</p>
        </div>
      )}
      
      {workflow && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 text-sm mb-1">{workflow.name}</h4>
          <p className="text-xs text-green-700">{workflow.execution_count} executions</p>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        Current focus: <span className="font-medium">{mode}</span>
      </div>
    </div>
  );
};

export default MCPDashboard;