/**
 * OpenConductor MCP Unified Interface
 * 
 * Complete integration of Minimal Mode, Explainable AI, Onboarding, and Quick Trainer
 * with Bloomberg Terminal-style professional design.
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, Target, BookOpen, Settings, Zap, 
  TrendingUp, Users, Shield, MessageSquare, Layout
} from 'lucide-react';

import MCPMinimalMode from './MCPMinimalMode';
import MCPProfessionalMinimal from './MCPProfessionalMinimal';
import MCPQuickTrainer from './MCPQuickTrainer';
import { MCPDashboard } from './MCPDashboard';

export type InterfaceMode = 'minimal' | 'professional' | 'trainer' | 'dashboard';
export type UserExperience = 'first_time' | 'returning' | 'power_user' | 'enterprise';

export interface UnifiedInterfaceProps {
  initialMode?: InterfaceMode;
  userProfile?: {
    experience_level: UserExperience;
    completed_onboarding: boolean;
    preferred_interface: InterfaceMode;
    role: 'developer' | 'analyst' | 'manager' | 'student';
  };
}

export const MCPUnifiedInterface: React.FC<UnifiedInterfaceProps> = ({
  initialMode,
  userProfile
}) => {
  const [currentMode, setCurrentMode] = useState<InterfaceMode>('professional');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [userStats, setUserStats] = useState({
    servers_installed: 0,
    workflows_created: 0,
    executions_today: 0,
    ai_interactions: 0
  });

  useEffect(() => {
    // Determine optimal starting mode based on user profile
    const optimalMode = determineOptimalMode(userProfile);
    setCurrentMode(initialMode || optimalMode);
  }, [initialMode, userProfile]);

  const determineOptimalMode = (profile?: any): InterfaceMode => {
    if (!profile?.completed_onboarding) return 'professional'; // Start with onboarding-ready interface
    if (profile?.experience_level === 'first_time') return 'minimal';
    if (profile?.experience_level === 'enterprise') return 'dashboard';
    return profile?.preferred_interface || 'professional';
  };

  const handleModeSwitch = (mode: InterfaceMode) => {
    setCurrentMode(mode);
    setShowModeSelector(false);
    
    // Track mode preferences
    localStorage.setItem('mcp_preferred_mode', mode);
  };

  const handleUpgrade = () => {
    // Redirect to billing/upgrade flow
    console.log('Upgrade requested');
  };

  // Mode-specific interfaces
  const renderInterface = () => {
    switch (currentMode) {
      case 'minimal':
        return (
          <MCPMinimalMode 
            onUpgrade={handleUpgrade}
            onOpenFullDashboard={() => setCurrentMode('dashboard')}
          />
        );
        
      case 'professional':
        return (
          <MCPProfessionalMinimal
            onUpgrade={handleUpgrade}
            onOpenFullDashboard={() => setCurrentMode('dashboard')}
          />
        );
        
      case 'trainer':
        return (
          <MCPQuickTrainer
            initialTopic="install_server"
            onComplete={(results) => {
              console.log('Training completed:', results);
              setCurrentMode('professional');
            }}
            onClose={() => setCurrentMode('professional')}
          />
        );
        
      case 'dashboard':
        return <MCPDashboard />;
        
      default:
        return (
          <MCPProfessionalMinimal
            onUpgrade={handleUpgrade}
            onOpenFullDashboard={() => setCurrentMode('dashboard')}
          />
        );
    }
  };

  return (
    <div className="relative h-screen bg-black">
      {/* Mode Selector Button (Bloomberg Terminal style) */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 border border-cyan-400/30 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/90 transition-all backdrop-blur-sm"
          >
            <Layout className="w-4 h-4" />
            <span className="text-xs font-mono">
              {currentMode.toUpperCase()}
            </span>
          </button>
          
          {/* Mode Selector Dropdown */}
          {showModeSelector && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900/95 border border-gray-700/30 rounded-xl p-4 backdrop-blur-sm shadow-2xl">
              <h3 className="text-cyan-400 font-semibold mb-3 text-sm">Interface Modes</h3>
              
              <div className="space-y-2">
                <ModeOption
                  mode="minimal"
                  title="Minimal Chat"
                  description="Simple Gemini-style interface"
                  icon={MessageSquare}
                  recommended={userProfile?.experience_level === 'first_time'}
                  onSelect={() => handleModeSwitch('minimal')}
                  isActive={currentMode === 'minimal'}
                />
                
                <ModeOption
                  mode="professional"
                  title="Professional AI"
                  description="Bloomberg Terminal-style with Explainable AI"
                  icon={Brain}
                  recommended={!userProfile?.completed_onboarding}
                  onSelect={() => handleModeSwitch('professional')}
                  isActive={currentMode === 'professional'}
                />
                
                <ModeOption
                  mode="trainer"
                  title="Quick Trainer"
                  description="Interactive learning with actionable steps"
                  icon={Target}
                  recommended={false}
                  onSelect={() => handleModeSwitch('trainer')}
                  isActive={currentMode === 'trainer'}
                />
                
                <ModeOption
                  mode="dashboard"
                  title="Full Dashboard"
                  description="Complete analytics and management interface"
                  icon={Layout}
                  recommended={userProfile?.experience_level === 'enterprise'}
                  onSelect={() => handleModeSwitch('dashboard')}
                  isActive={currentMode === 'dashboard'}
                />
              </div>
              
              {/* User Stats */}
              <div className="mt-4 pt-3 border-t border-gray-700/30">
                <h4 className="text-gray-400 text-xs font-medium mb-2">Your Progress</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800/30 rounded p-2 text-center">
                    <div className="text-cyan-400 font-bold">{userStats.servers_installed}</div>
                    <div className="text-gray-400">Servers</div>
                  </div>
                  <div className="bg-gray-800/30 rounded p-2 text-center">
                    <div className="text-green-400 font-bold">{userStats.workflows_created}</div>
                    <div className="text-gray-400">Workflows</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Interface */}
      {renderInterface()}

      {/* Feature Announcements (Contextual) */}
      {shouldShowAnnouncement() && (
        <FeatureAnnouncement onDismiss={() => setShowAnnouncement(false)} />
      )}
    </div>
  );

  function shouldShowAnnouncement(): boolean {
    // Show announcements for new features
    return !localStorage.getItem('mcp_explainable_ai_announced') && 
           userProfile?.completed_onboarding;
  }

  function setShowAnnouncement(show: boolean) {
    if (!show) {
      localStorage.setItem('mcp_explainable_ai_announced', 'true');
    }
  }
};

/**
 * Mode Selection Option Component
 */
interface ModeOptionProps {
  mode: InterfaceMode;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  recommended: boolean;
  onSelect: () => void;
  isActive: boolean;
}

const ModeOption: React.FC<ModeOptionProps> = ({
  mode,
  title,
  description,
  icon: Icon,
  recommended,
  onSelect,
  isActive
}) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive
          ? 'bg-cyan-600/20 border-cyan-400/50 text-cyan-400'
          : 'bg-gray-800/30 border-gray-600/30 text-gray-300 hover:bg-gray-700/30 hover:border-gray-500/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isActive ? 'bg-cyan-500/20' : 'bg-gray-700/50'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{title}</span>
            {recommended && (
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-400/30">
                Recommended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
};

/**
 * Feature Announcement Component
 */
interface FeatureAnnouncementProps {
  onDismiss: () => void;
}

const FeatureAnnouncement: React.FC<FeatureAnnouncementProps> = ({ onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gradient-to-r from-purple-900/90 to-cyan-900/90 border border-purple-400/30 rounded-xl p-4 backdrop-blur-sm shadow-2xl z-40">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">🧠 Explainable AI Now Available!</h4>
          <p className="text-gray-300 text-sm mb-3 leading-relaxed">
            Every recommendation now includes AI explanations, confidence scores, and reasoning. 
            Get transparent insights into how decisions are made.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try It Now
            </button>
            <button
              onClick={onDismiss}
              className="text-gray-400 text-xs hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Interface mode descriptions for user guidance
 */
export const MODE_DESCRIPTIONS = {
  minimal: {
    best_for: "New users who want simple, conversational interaction",
    features: ["Natural language queries", "Basic server discovery", "Simple workflow creation"],
    use_when: "Getting started or need quick answers"
  },
  
  professional: {
    best_for: "Professional users who need explainable AI and detailed insights",
    features: ["Explainable AI recommendations", "Confidence scoring", "Professional onboarding", "Advanced analytics"],
    use_when: "Building production workflows or need transparent AI decisions"
  },
  
  trainer: {
    best_for: "Users learning specific skills with hands-on practice",
    features: ["Interactive tutorials", "Step-by-step guidance", "Progress tracking", "Skill assessment"],
    use_when: "Learning new concepts or mastering specific features"
  },
  
  dashboard: {
    best_for: "Power users managing multiple servers and workflows",
    features: ["Full analytics", "Batch operations", "Team collaboration", "Enterprise features"],
    use_when: "Managing complex deployments or team coordination"
  }
} as const;

/**
 * User guidance system for mode selection
 */
export const getUserGuidance = (
  experience: UserExperience,
  currentStats: any
): {
  recommended_mode: InterfaceMode;
  explanation: string;
  alternative_modes: InterfaceMode[];
} => {
  if (experience === 'first_time') {
    return {
      recommended_mode: 'professional',
      explanation: "Professional mode provides explainable AI guidance perfect for learning",
      alternative_modes: ['minimal', 'trainer']
    };
  }
  
  if (experience === 'enterprise') {
    return {
      recommended_mode: 'dashboard',
      explanation: "Full dashboard provides complete analytics and team management features",
      alternative_modes: ['professional', 'trainer']
    };
  }
  
  if (currentStats.workflows_created > 5) {
    return {
      recommended_mode: 'dashboard',
      explanation: "You're ready for advanced features and workflow management",
      alternative_modes: ['professional', 'minimal']
    };
  }
  
  return {
    recommended_mode: 'professional',
    explanation: "Professional mode balances simplicity with powerful AI explanations",
    alternative_modes: ['minimal', 'trainer', 'dashboard']
  };
};

/**
 * Context-aware help system
 */
export const getContextualHelp = (
  mode: InterfaceMode,
  userAction: string
): {
  help_text: string;
  ai_explanation: string;
  quick_tips: string[];
  related_actions: string[];
} => {
  const helpDatabase = {
    professional: {
      searching: {
        help_text: "Use natural language to describe your automation goals. AI will find compatible servers with explanations.",
        ai_explanation: "🧠 Semantic search analyzes intent, not just keywords. Confidence scores show recommendation quality.",
        quick_tips: [
          "Be specific: 'process CSV files' vs 'data processing'",
          "Ask for explanations to understand AI reasoning",
          "Check confidence scores for recommendation quality"
        ],
        related_actions: ["View AI explanation", "Browse by category", "Check server ratings"]
      },
      
      installing: {
        help_text: "One-click installation with automatic configuration and health validation.",
        ai_explanation: "🔧 AI monitors installation process, validates configuration, and ensures compatibility.",
        quick_tips: [
          "Review configuration requirements first",
          "Use test credentials during learning",
          "Always run health check after installation"
        ],
        related_actions: ["View installation logs", "Test server functions", "Configure settings"]
      },
      
      workflow_building: {
        help_text: "Connect servers visually with AI-powered step recommendations and optimization.",
        ai_explanation: "⚡ Workflow AI suggests optimal step ordering, identifies compatibility issues, and recommends improvements.",
        quick_tips: [
          "Start with simple linear workflows",
          "Test each step before connecting to next",
          "Use AI explanations to understand recommendations"
        ],
        related_actions: ["Add error handling", "Optimize performance", "Share with community"]
      }
    }
  };

  const modeHelp = helpDatabase[mode as keyof typeof helpDatabase];
  const actionHelp = modeHelp?.[userAction as keyof typeof modeHelp];

  return actionHelp || {
    help_text: "AI assistant is available to help with any questions or tasks.",
    ai_explanation: "💡 Ask me anything about MCP servers, workflows, or platform features.",
    quick_tips: ["Use specific questions for better help", "Try the quick actions", "Check documentation"],
    related_actions: ["Get tutorial", "View examples", "Contact support"]
  };
};

/**
 * Feature capability matrix for user guidance
 */
export const FEATURE_MATRIX = {
  'AI Explanations': {
    minimal: 'Basic',
    professional: 'Advanced', 
    trainer: 'Integrated',
    dashboard: 'Complete'
  },
  
  'Onboarding': {
    minimal: 'Simple',
    professional: 'Professional',
    trainer: 'Interactive',
    dashboard: 'Self-service'
  },
  
  'Server Discovery': {
    minimal: 'Chat-based',
    professional: 'AI-powered',
    trainer: 'Guided',
    dashboard: 'Advanced search'
  },
  
  'Workflow Building': {
    minimal: 'Assisted',
    professional: 'AI-guided',
    trainer: 'Step-by-step',
    dashboard: 'Visual builder'
  },
  
  'Analytics': {
    minimal: 'None',
    professional: 'Basic',
    trainer: 'Progress tracking',
    dashboard: 'Comprehensive'
  },
  
  'Team Features': {
    minimal: 'None',
    professional: 'Limited',
    trainer: 'None',
    dashboard: 'Full collaboration'
  }
} as const;

/**
 * Smart recommendation system
 */
export const getSmartRecommendations = (
  userStats: any,
  currentMode: InterfaceMode
): Array<{
  type: 'mode_switch' | 'feature_try' | 'skill_development' | 'optimization';
  title: string;
  description: string;
  action: string;
  confidence: number;
}> => {
  const recommendations = [];
  
  // Mode recommendations based on usage patterns
  if (userStats.ai_interactions > 10 && currentMode === 'minimal') {
    recommendations.push({
      type: 'mode_switch' as const,
      title: "Upgrade to Professional Mode",
      description: "You're actively using AI features - Professional mode offers explainable AI and confidence scoring",
      action: "Switch to Professional mode",
      confidence: 0.85
    });
  }
  
  if (userStats.workflows_created > 3 && currentMode !== 'dashboard') {
    recommendations.push({
      type: 'mode_switch' as const,
      title: "Try Full Dashboard",
      description: "With multiple workflows, you'd benefit from advanced analytics and management features",
      action: "Explore Full Dashboard",
      confidence: 0.78
    });
  }
  
  // Feature recommendations
  if (userStats.servers_installed === 0) {
    recommendations.push({
      type: 'feature_try' as const,
      title: "Install Your First Server",
      description: "Start with filesystem-server - it's beginner-friendly and highly rated",
      action: "Start Quick Trainer",
      confidence: 0.95
    });
  }
  
  // Skill development recommendations
  if (userStats.workflows_created > 0 && userStats.executions_today === 0) {
    recommendations.push({
      type: 'skill_development' as const,
      title: "Test Your Workflows",
      description: "You have workflows but haven't run them today. Testing helps ensure reliability",
      action: "Run workflow tests",
      confidence: 0.72
    });
  }
  
  return recommendations;
};

export default MCPUnifiedInterface;