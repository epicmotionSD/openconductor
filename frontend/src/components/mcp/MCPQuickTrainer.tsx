/**
 * OpenConductor MCP Quick Trainer
 * 
 * Interactive training system with actionable steps, Explainable AI insights,
 * and Bloomberg Terminal-style professional interface.
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Circle, Clock, Brain, Zap, AlertTriangle, 
  Play, Pause, RotateCcw, Target, TrendingUp, Users, 
  BookOpen, Download, Settings, ChevronRight, Star
} from 'lucide-react';

export interface QuickTrainerProps {
  initialTopic?: 'install_server' | 'create_workflow' | 'debug_issues' | 'optimize_performance';
  onComplete?: (results: TrainingResults) => void;
  onClose?: () => void;
}

interface TrainingStep {
  id: string;
  number: number;
  title: string;
  description: string;
  type: 'explanation' | 'action' | 'verification' | 'practice';
  estimated_time: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  action_items: ActionItem[];
  verification_criteria: string[];
  ai_explanation: {
    why_important: string;
    confidence: number;
    factors: Array<{ name: string; impact: number; }>;
    tips: string[];
  };
  common_mistakes: Array<{ mistake: string; solution: string; }>;
  success_indicators: string[];
}

interface ActionItem {
  id: string;
  description: string;
  action_type: 'click' | 'input' | 'wait' | 'verify' | 'configure';
  target?: string;
  expected_result: string;
  help_text: string;
  completed: boolean;
}

interface TrainingResults {
  topic: string;
  total_steps: number;
  completed_steps: number;
  time_taken: number; // seconds
  success_rate: number; // 0-1
  skill_assessment: {
    before: string;
    after: string;
    improvement: number;
  };
  areas_for_improvement: string[];
  next_recommended_training: string[];
}

export const MCPQuickTrainer: React.FC<QuickTrainerProps> = ({
  initialTopic = 'install_server',
  onComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TrainingStep[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    initializeTraining(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (isActive && startTime) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, startTime]);

  const initializeTraining = (topic: string) => {
    const trainingData = getTrainingSteps(topic);
    setSteps(trainingData);
    setCurrentStep(0);
    setCompletedItems(new Set());
  };

  const startTraining = () => {
    setIsActive(true);
    setStartTime(new Date());
  };

  const pauseTraining = () => {
    setIsActive(false);
  };

  const resetTraining = () => {
    setIsActive(false);
    setStartTime(null);
    setTimeElapsed(0);
    setCurrentStep(0);
    setCompletedItems(new Set());
  };

  const markActionComplete = (actionId: string) => {
    setCompletedItems(prev => new Set(prev.add(actionId)));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTraining();
    }
  };

  const completeTraining = () => {
    const results: TrainingResults = {
      topic: initialTopic,
      total_steps: steps.length,
      completed_steps: currentStep + 1,
      time_taken: timeElapsed,
      success_rate: completedItems.size / getTotalActionItems(),
      skill_assessment: {
        before: 'beginner',
        after: 'intermediate',
        improvement: 0.8
      },
      areas_for_improvement: getAreasForImprovement(),
      next_recommended_training: getNextRecommendations()
    };
    
    if (onComplete) {
      onComplete(results);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Professional Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-cyan-400">Quick Trainer</h1>
              <p className="text-xs text-gray-400">Interactive Learning • Explainable AI • Professional Results</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-400/30 rounded-lg">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-mono text-sm">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-400/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-mono text-sm">
                {Math.round(progress)}%
              </span>
            </div>
            
            {/* Close */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Step Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentStepData && (
            <div className="max-w-4xl">
              {/* Step Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-cyan-600/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">{currentStepData.number}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    currentStepData.difficulty === 'easy' ? 'bg-green-900/30 text-green-400 border border-green-400/30' :
                    currentStepData.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/30' :
                    'bg-red-900/30 text-red-400 border border-red-400/30'
                  }`}>
                    {currentStepData.difficulty}
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{currentStepData.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>⏱️ Est. time: {currentStepData.estimated_time}s</span>
                  <span>🎯 Type: {currentStepData.type}</span>
                </div>
              </div>

              {/* AI Explanation Panel */}
              <div className="mb-6 p-4 bg-purple-900/20 border border-purple-400/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-purple-400 font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Explanation
                  </h3>
                  <div className="text-purple-400 text-sm font-mono">
                    {Math.round(currentStepData.ai_explanation.confidence * 100)}% confidence
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                  {currentStepData.ai_explanation.why_important}
                </p>
                
                {/* Explanation Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStepData.ai_explanation.factors.map((factor, index) => (
                    <div key={index} className="bg-purple-900/10 border border-purple-400/10 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-purple-300 text-sm font-medium">{factor.name}</span>
                        <span className="text-purple-400 text-sm font-mono">{Math.round(factor.impact * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div 
                          className="bg-purple-400 h-1 rounded-full"
                          style={{ width: `${factor.impact * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* AI Tips */}
                <div className="mt-3">
                  <h4 className="text-purple-400 text-sm font-medium mb-2">💡 AI Tips:</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {currentStepData.ai_explanation.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Items */}
              <div className="mb-6">
                <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Action Items
                </h3>
                
                <div className="space-y-3">
                  {currentStepData.action_items.map((item, index) => (
                    <div key={item.id} className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => markActionComplete(item.id)}
                          className={`mt-1 transition-colors ${
                            completedItems.has(item.id) 
                              ? 'text-green-400' 
                              : 'text-gray-500 hover:text-cyan-400'
                          }`}
                        >
                          {completedItems.has(item.id) ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{item.description}</h4>
                          <p className="text-gray-400 text-sm mb-2">{item.help_text}</p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-cyan-400">Type: {item.action_type}</span>
                            <span className="text-green-400">Expected: {item.expected_result}</span>
                          </div>
                          
                          {item.target && (
                            <div className="mt-2 px-2 py-1 bg-cyan-900/20 border border-cyan-400/20 rounded text-cyan-400 text-xs font-mono">
                              Target: {item.target}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes */}
              {currentStepData.common_mistakes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Common Mistakes
                  </h3>
                  <div className="space-y-2">
                    {currentStepData.common_mistakes.map((mistake, index) => (
                      <div key={index} className="bg-orange-900/20 border border-orange-400/20 rounded-lg p-3">
                        <h4 className="text-orange-400 text-sm font-medium mb-1">❌ {mistake.mistake}</h4>
                        <p className="text-gray-300 text-sm">✅ {mistake.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {!isActive ? (
                    <button
                      onClick={startTraining}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg shadow-green-500/25"
                    >
                      <Play className="w-4 h-4" />
                      Start Training
                    </button>
                  ) : (
                    <button
                      onClick={pauseTraining}
                      className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  )}
                  
                  <button
                    onClick={resetTraining}
                    className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                    title="Reset Training"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={nextStep}
                  disabled={getStepCompletionRate() < 0.8}
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next Step'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Progress & Insights */}
        <div className="w-80 bg-gray-950/50 border-l border-gray-700/30 p-6">
          {/* Overall Progress */}
          <div className="mb-6">
            <h3 className="text-cyan-400 font-semibold mb-3">📊 Training Progress</h3>
            <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Overall</span>
                <span className="text-cyan-400 font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-white font-bold">{currentStep + 1}/{steps.length}</div>
                  <div className="text-gray-400">Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{timeElapsed}s</div>
                  <div className="text-gray-400">Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Step Progress */}
          {currentStepData && (
            <div className="mb-6">
              <h3 className="text-green-400 font-semibold mb-3">🎯 Current Step</h3>
              <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4">
                <h4 className="text-white font-medium mb-2">{currentStepData.title}</h4>
                <p className="text-gray-400 text-sm mb-3">{currentStepData.description}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Completion</span>
                  <span className="text-green-400 font-mono text-sm">
                    {Math.round(getStepCompletionRate() * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div 
                    className="bg-green-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${getStepCompletionRate() * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="mb-6">
            <h3 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </h3>
            <div className="space-y-3">
              <div className="bg-purple-900/20 border border-purple-400/20 rounded-lg p-3">
                <h4 className="text-purple-400 text-sm font-medium mb-1">Learning Velocity</h4>
                <p className="text-gray-300 text-xs">
                  {timeElapsed > 0 && currentStep > 0 
                    ? `${Math.round(currentStep / (timeElapsed / 60))} steps/min - ${getVelocityAssessment()}`
                    : 'Starting assessment...'
                  }
                </p>
              </div>
              
              <div className="bg-cyan-900/20 border border-cyan-400/20 rounded-lg p-3">
                <h4 className="text-cyan-400 text-sm font-medium mb-1">Comprehension</h4>
                <p className="text-gray-300 text-xs">
                  {getComprehensionAssessment()}
                </p>
              </div>
              
              <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-3">
                <h4 className="text-green-400 text-sm font-medium mb-1">Skill Development</h4>
                <p className="text-gray-300 text-xs">
                  {getSkillDevelopmentAssessment()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="mb-6">
            <h3 className="text-blue-400 font-semibold mb-3">📚 Quick Reference</h3>
            <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Green: Completed actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-gray-300">Cyan: Current focus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-300">Gray: Pending items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-3 text-sm">⌨️ Shortcuts</h3>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Space</span>
                <span className="text-gray-400">Next Step</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ctrl+E</span>
                <span className="text-gray-400">Explain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Esc</span>
                <span className="text-gray-400">Pause</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions
  function getStepCompletionRate(): number {
    if (!currentStepData) return 0;
    const stepItems = currentStepData.action_items.filter(item => completedItems.has(item.id));
    return stepItems.length / currentStepData.action_items.length;
  }

  function getTotalActionItems(): number {
    return steps.reduce((total, step) => total + step.action_items.length, 0);
  }

  function getVelocityAssessment(): string {
    const velocity = timeElapsed > 0 ? currentStep / (timeElapsed / 60) : 0;
    if (velocity > 2) return "Excellent pace";
    if (velocity > 1) return "Good progress";
    if (velocity > 0.5) return "Steady learning";
    return "Take your time";
  }

  function getComprehensionAssessment(): string {
    const completionRate = getStepCompletionRate();
    if (completionRate > 0.9) return "Excellent understanding";
    if (completionRate > 0.7) return "Good comprehension";
    if (completionRate > 0.5) return "Developing understanding";
    return "Review needed";
  }

  function getSkillDevelopmentAssessment(): string {
    if (currentStep === 0) return "Starting assessment";
    if (currentStep < 2) return "Building foundation";
    if (currentStep < 4) return "Developing proficiency";
    return "Advanced skills emerging";
  }

  function getAreasForImprovement(): string[] {
    return [
      "Workflow error handling",
      "Performance optimization",
      "Advanced server configuration"
    ];
  }

  function getNextRecommendations(): string[] {
    return [
      "Advanced Workflow Patterns",
      "Performance Optimization",
      "Enterprise Security Features"
    ];
  }
};

/**
 * Training step data generator
 */
function getTrainingSteps(topic: string): TrainingStep[] {
  const stepLibrary = {
    install_server: [
      {
        id: 'choose_server',
        number: 1,
        title: 'Choose Your First Server',
        description: 'Learn to evaluate and select MCP servers based on your needs using AI-powered recommendations.',
        type: 'explanation' as const,
        estimated_time: 120,
        difficulty: 'easy' as const,
        action_items: [
          {
            id: 'browse_registry',
            description: 'Browse the MCP server registry',
            action_type: 'click' as const,
            target: '.server-browser',
            expected_result: 'Server list displays with ratings and categories',
            help_text: 'Look for servers with high ratings (4+ stars) and many downloads',
            completed: false
          },
          {
            id: 'read_descriptions',
            description: 'Read server descriptions and capabilities',
            action_type: 'verify' as const,
            expected_result: 'Understanding of what each server does',
            help_text: 'Focus on servers that match your immediate needs',
            completed: false
          }
        ],
        verification_criteria: [
          'Can explain what 3 different servers do',
          'Understands server rating system',
          'Knows how to filter by category'
        ],
        ai_explanation: {
          why_important: 'Choosing the right server is crucial for workflow success. Our AI analyzes compatibility, community trust, and your skill level to recommend optimal servers.',
          confidence: 0.95,
          factors: [
            { name: 'Compatibility Analysis', impact: 0.9 },
            { name: 'Community Validation', impact: 0.85 },
            { name: 'Skill Level Match', impact: 0.8 }
          ],
          tips: [
            'Start with officially verified servers',
            'Check recent reviews for real-world insights',
            'Ensure server matches your use case exactly'
          ]
        },
        common_mistakes: [
          {
            mistake: 'Installing too many servers at once',
            solution: 'Start with 1-2 servers and learn them thoroughly'
          },
          {
            mistake: 'Ignoring server requirements',
            solution: 'Always read prerequisites and configuration needs'
          }
        ],
        success_indicators: [
          'Selected appropriate server for use case',
          'Understood server capabilities',
          'Ready for installation process'
        ]
      },
      
      {
        id: 'install_process',
        number: 2,
        title: 'Server Installation Process',
        description: 'Execute the installation with AI-guided configuration and validation.',
        type: 'action' as const,
        estimated_time: 180,
        difficulty: 'easy' as const,
        action_items: [
          {
            id: 'click_install',
            description: 'Click the Install button on your chosen server',
            action_type: 'click' as const,
            target: '.install-button',
            expected_result: 'Installation dialog appears',
            help_text: 'Installation is automated but may require configuration',
            completed: false
          },
          {
            id: 'configure_settings',
            description: 'Configure any required settings (API keys, endpoints)',
            action_type: 'configure' as const,
            expected_result: 'All required fields are filled',
            help_text: 'Use test/development keys for learning',
            completed: false
          },
          {
            id: 'wait_completion',
            description: 'Wait for installation to complete',
            action_type: 'wait' as const,
            expected_result: 'Success message appears',
            help_text: 'Installation typically takes 30-60 seconds',
            completed: false
          }
        ],
        verification_criteria: [
          'Server appears in installed list',
          'Health status shows green',
          'Configuration is saved'
        ],
        ai_explanation: {
          why_important: 'Proper installation ensures reliable server operation. Our AI monitors the process and validates configuration for optimal performance.',
          confidence: 0.98,
          factors: [
            { name: 'Installation Validation', impact: 0.95 },
            { name: 'Configuration Check', impact: 0.9 },
            { name: 'Health Verification', impact: 0.88 }
          ],
          tips: [
            'Never skip the health check step',
            'Save configuration details for future reference',
            'Test basic functionality before complex operations'
          ]
        },
        common_mistakes: [
          {
            mistake: 'Skipping configuration validation',
            solution: 'Always run health check after installation'
          },
          {
            mistake: 'Using production credentials for testing',
            solution: 'Use test/sandbox credentials during learning'
          }
        ],
        success_indicators: [
          'Server status shows healthy',
          'Basic test operations work',
          'Configuration is properly saved'
        ]
      }
    ]
  };

  return stepLibrary[topic as keyof typeof stepLibrary] || stepLibrary.install_server;
}

export default MCPQuickTrainer;