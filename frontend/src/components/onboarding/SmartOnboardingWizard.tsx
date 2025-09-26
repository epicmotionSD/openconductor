/**
 * Smart Onboarding Wizard - Seamless UI/UX for Guided Installation
 * 
 * Provides a beautiful, intuitive interface for the 15-minute onboarding flow.
 * Integrates with Bloomberg Terminal design system for professional appearance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/trinity-card';

interface OnboardingWizardProps {
  onComplete: (results: OnboardingResults) => void;
  onError: (error: Error) => void;
}

interface OnboardingResults {
  sessionId: string;
  workflowsCreated: number;
  serversInstalled: string[];
  timeToComplete: number;
  userSatisfaction: number;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  environment?: any;
  selectedGoal?: any;
  installationProgress?: any;
  workflowProgress?: any;
  testResults?: any;
  trinityGuidance?: any;
  isLoading: boolean;
  error?: string;
}

const SmartOnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onError }) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    totalSteps: 4,
    isLoading: false
  });

  const [sessionId, setSessionId] = useState<string>();
  const [startTime] = useState<number>(Date.now());

  // Progress tracking
  const updateProgress = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Step 1: Environment Detection and Goal Selection
  const EnvironmentDetectionStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          🔍 Analyzing Your Environment
        </h2>
        <p className="text-gray-300">
          We're detecting your development tools and project setup to provide personalized recommendations.
        </p>
      </div>

      {state.environment ? (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Environment Detected</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Operating System</div>
              <div className="text-white font-medium">{state.environment.os}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400">Project Type</div>
              <div className="text-white font-medium">{state.environment.project_type}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400">Package Manager</div>
              <div className="text-white font-medium">{state.environment.package_manager}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400">Development Tools</div>
              <div className="text-white font-medium">
                {Object.keys(state.environment.tools || {}).join(', ')}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-semibold text-cyan-400 mb-3">Choose Your Quick Start Goal</h4>
            <div className="grid gap-3">
              <GoalOptionCard
                title="File Processing Automation"
                description="Automatically process and organize files (5 min setup)"
                complexity="Beginner"
                value="Save 2+ hours/week on manual file handling"
                selected={state.selectedGoal?.id === 'file_automation'}
                onClick={() => handleGoalSelection('file_automation')}
              />
              
              <GoalOptionCard
                title="Data Processing Pipeline"
                description="Extract, transform, and load data automatically (8 min setup)"
                complexity="Intermediate"
                value="Replace 4+ hours of manual data work"
                selected={state.selectedGoal?.id === 'data_pipeline'}
                onClick={() => handleGoalSelection('data_pipeline')}
              />
              
              <GoalOptionCard
                title="Smart Monitoring Setup"
                description="Intelligent monitoring with predictive alerts (7 min setup)"
                complexity="Beginner"
                value="Catch issues before they impact users"
                selected={state.selectedGoal?.id === 'monitoring_setup'}
                onClick={() => handleGoalSelection('monitoring_setup')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-300">Analyzing your development environment...</p>
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Smart Server Installation
  const ServerInstallationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          🚀 Installing Your Personalized Servers
        </h2>
        <p className="text-gray-300">
          We're automatically installing the perfect MCP servers for your {state.selectedGoal?.name}.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyan-400">Installation Progress</h3>
          <div className="text-sm text-gray-400">
            {state.installationProgress?.completed_servers || 0} / {state.installationProgress?.total_servers || 0} servers
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${state.installationProgress?.overall_progress || 0}%` }}
          ></div>
        </div>

        <div className="text-center text-gray-300 mb-6">
          {state.installationProgress?.current_step || 'Preparing installation...'}
        </div>

        {state.installationProgress?.detailed_progress && (
          <div className="space-y-3">
            {state.installationProgress.detailed_progress.map((server: any, index: number) => (
              <ServerInstallationProgress key={index} server={server} />
            ))}
          </div>
        )}

        {state.trinityGuidance && (
          <TrinityGuidancePanel guidance={state.trinityGuidance} />
        )}
      </div>
    </div>
  );

  // Step 3: Workflow Creation
  const WorkflowCreationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          🛠️ Creating Your First Workflow
        </h2>
        <p className="text-gray-300">
          Building a ready-to-use {state.selectedGoal?.name} workflow with your installed servers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Workflow Configuration</h3>
          
          {state.workflowProgress ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Workflow Name</span>
                <span className="text-white font-medium">{state.workflowProgress.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Steps</span>
                <span className="text-white font-medium">{state.workflowProgress.steps?.length || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Servers Used</span>
                <span className="text-white font-medium">{state.workflowProgress.servers?.length || 0}</span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.workflowProgress.creation_progress || 0}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-pulse text-cyan-400">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Generating workflow...
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">What You're Building</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Automated Processing</div>
                <div className="text-gray-400 text-sm">Files will be processed automatically</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Real-time Monitoring</div>
                <div className="text-gray-400 text-sm">Health checks and error detection</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Intelligent Alerts</div>
                <div className="text-gray-400 text-sm">Get notified when action is needed</div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <div className="text-cyan-400 font-medium text-sm">💡 Pro Tip</div>
            <div className="text-gray-300 text-sm mt-1">
              This workflow can be customized later. We're starting with a proven template for quick success!
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Testing and Success Validation
  const TestingValidationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">
          🧪 Testing Your Workflow
        </h2>
        <p className="text-gray-300">
          Running your workflow with sample data to ensure everything works perfectly.
        </p>
      </div>

      {state.testResults ? (
        <div className="space-y-6">
          <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-400">Success! Your Workflow is Working</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Files Processed"
                value={state.testResults.files_processed}
                icon="📁"
              />
              <MetricCard
                label="Records Handled"
                value={state.testResults.records_transformed}
                icon="📊"
              />
              <MetricCard
                label="Processing Time"
                value={`${state.testResults.duration}s`}
                icon="⚡"
              />
              <MetricCard
                label="Success Rate"
                value="100%"
                icon="✅"
              />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">What You Just Accomplished</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg">
                <span className="text-gray-300">Time Saved Per Run</span>
                <span className="text-cyan-400 font-medium">30 minutes → 30 seconds</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <span className="text-gray-300">Accuracy Improvement</span>
                <span className="text-green-400 font-medium">Manual (95%) → Automated (100%)</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-gray-300">Scalability</span>
                <span className="text-blue-400 font-medium">Can handle 1000x more volume</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="text-yellow-400 font-medium text-sm mb-2">🎯 Your Next Opportunities</div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Customize the workflow for your specific needs</li>
                <li>• Add more servers from the marketplace</li>
                <li>• Set up monitoring and alerts</li>
                <li>• Create workflows for other use cases</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-lg p-8 border border-cyan-500/20">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-cyan-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Running Your First Workflow</h3>
            <p className="text-gray-300">
              Executing with sample data to demonstrate the automation...
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-cyan-400">Step {state.currentStep} of {state.totalSteps}</span>
        <span className="text-sm text-gray-400">
          {Math.round(((state.currentStep - 1) / state.totalSteps) * 100)}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${((state.currentStep - 1) / state.totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span className={state.currentStep >= 1 ? 'text-cyan-400' : ''}>Environment</span>
        <span className={state.currentStep >= 2 ? 'text-cyan-400' : ''}>Servers</span>
        <span className={state.currentStep >= 3 ? 'text-cyan-400' : ''}>Workflow</span>
        <span className={state.currentStep >= 4 ? 'text-cyan-400' : ''}>Success</span>
      </div>
    </div>
  );

  // Trinity AI Guidance Panel
  const TrinityGuidancePanel = ({ guidance }: { guidance: any }) => (
    <div className="mt-6 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <span className="text-purple-400 font-medium">Trinity AI Guidance</span>
      </div>
      
      <div className="text-gray-300 text-sm mb-3">{guidance.current_advice}</div>
      
      <div className="text-purple-400 text-xs font-medium mb-2">💡 Success Tips:</div>
      <ul className="text-gray-400 text-xs space-y-1">
        {guidance.success_tips?.map((tip: string, index: number) => (
          <li key={index}>• {tip}</li>
        ))}
      </ul>
    </div>
  );

  // Goal selection handler
  const handleGoalSelection = (goalId: string) => {
    const goals = {
      'file_automation': {
        id: 'file_automation',
        name: 'File Processing Automation',
        estimated_time: 5
      },
      'data_pipeline': {
        id: 'data_pipeline',
        name: 'Data Processing Pipeline',
        estimated_time: 8
      },
      'monitoring_setup': {
        id: 'monitoring_setup',
        name: 'Smart Monitoring Setup',
        estimated_time: 7
      }
    };

    updateProgress({ selectedGoal: goals[goalId as keyof typeof goals] });
  };

  // Step navigation
  const handleNextStep = () => {
    if (state.currentStep < state.totalSteps) {
      updateProgress({ currentStep: state.currentStep + 1 });
    }
  };

  const handlePreviousStep = () => {
    if (state.currentStep > 1) {
      updateProgress({ currentStep: state.currentStep - 1 });
    }
  };

  // Complete onboarding
  const handleComplete = () => {
    const timeToComplete = (Date.now() - startTime) / 1000 / 60; // minutes
    
    onComplete({
      sessionId: sessionId || 'demo-session',
      workflowsCreated: 1,
      serversInstalled: state.installationProgress?.detailed_progress?.map((p: any) => p.server_name) || [],
      timeToComplete: Math.round(timeToComplete),
      userSatisfaction: 5 // Would collect actual feedback
    });
  };

  // Simulate onboarding flow (replace with actual API calls)
  useEffect(() => {
    const simulateFlow = async () => {
      // Step 1: Environment detection
      setTimeout(() => {
        updateProgress({
          environment: {
            os: 'Linux',
            project_type: 'nodejs',
            package_manager: 'npm',
            tools: { git: true, docker: true, postgresql: true }
          }
        });
      }, 2000);

      // Step 2: Installation progress simulation
      if (state.currentStep === 2 && state.selectedGoal) {
        setTimeout(() => {
          updateProgress({
            installationProgress: {
              total_servers: 3,
              completed_servers: 0,
              overall_progress: 0,
              current_step: 'Installing file-manager server...',
              detailed_progress: [
                { server_name: 'file-manager', status: 'installing', progress: 45 },
                { server_name: 'data-transformer', status: 'pending', progress: 0 },
                { server_name: 'notification-sender', status: 'pending', progress: 0 }
              ]
            },
            trinityGuidance: {
              current_advice: 'Installing your personalized servers based on your Node.js environment',
              success_tips: [
                'We detected your Node.js project and selected compatible servers',
                'Installation typically takes 3-5 minutes',
                'All servers will be health-checked automatically'
              ]
            }
          });
        }, 1000);

        // Progress updates
        setTimeout(() => {
          updateProgress({
            installationProgress: {
              ...state.installationProgress,
              completed_servers: 2,
              overall_progress: 67,
              current_step: 'Installing data-transformer server...',
              detailed_progress: [
                { server_name: 'file-manager', status: 'completed', progress: 100 },
                { server_name: 'data-transformer', status: 'installing', progress: 80 },
                { server_name: 'notification-sender', status: 'pending', progress: 0 }
              ]
            }
          });
        }, 4000);

        setTimeout(() => {
          updateProgress({
            installationProgress: {
              ...state.installationProgress,
              completed_servers: 3,
              overall_progress: 100,
              current_step: 'All servers installed successfully!',
              detailed_progress: [
                { server_name: 'file-manager', status: 'completed', progress: 100 },
                { server_name: 'data-transformer', status: 'completed', progress: 100 },
                { server_name: 'notification-sender', status: 'completed', progress: 100 }
              ]
            }
          });
        }, 7000);
      }

      // Step 3: Workflow creation
      if (state.currentStep === 3) {
        setTimeout(() => {
          updateProgress({
            workflowProgress: {
              name: state.selectedGoal?.name || 'Smart Workflow',
              steps: 4,
              servers: 3,
              creation_progress: 100
            }
          });
        }, 3000);
      }

      // Step 4: Testing
      if (state.currentStep === 4) {
        setTimeout(() => {
          updateProgress({
            testResults: {
              files_processed: 5,
              records_transformed: 250,
              duration: 2.3,
              success_rate: 1.0
            }
          });
        }, 4000);
      }
    };

    simulateFlow();
  }, [state.currentStep, state.selectedGoal]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            OpenConductor Quick Start
          </h1>
          <p className="text-gray-400">
            Get to your first working automation in under 15 minutes
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ProgressIndicator />

          <Card className="mb-8">
            {state.currentStep === 1 && <EnvironmentDetectionStep />}
            {state.currentStep === 2 && <ServerInstallationStep />}
            {state.currentStep === 3 && <WorkflowCreationStep />}
            {state.currentStep === 4 && <TestingValidationStep />}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousStep}
              disabled={state.currentStep === 1}
              className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>

            <div className="text-center">
              <div className="text-sm text-gray-400">
                Estimated time remaining: {Math.max(0, 15 - Math.round((Date.now() - startTime) / 1000 / 60))} minutes
              </div>
            </div>

            {state.currentStep === state.totalSteps && state.testResults ? (
              <button
                onClick={handleComplete}
                className="px-8 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Complete Setup 🎉
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={
                  (state.currentStep === 1 && !state.selectedGoal) ||
                  (state.currentStep === 2 && state.installationProgress?.overall_progress < 100) ||
                  (state.currentStep === 3 && !state.workflowProgress) ||
                  state.isLoading
                }
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                {state.isLoading ? 'Processing...' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Supporting components
const GoalOptionCard: React.FC<{
  title: string;
  description: string;
  complexity: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}> = ({ title, description, complexity, value, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`
      p-4 rounded-lg border cursor-pointer transition-all
      ${selected 
        ? 'border-cyan-500 bg-cyan-500/10' 
        : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
      }
    `}
  >
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-semibold text-white">{title}</h4>
      <span className={`
        px-2 py-1 text-xs rounded
        ${complexity === 'Beginner' 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-yellow-500/20 text-yellow-400'
        }
      `}>
        {complexity}
      </span>
    </div>
    <p className="text-gray-300 text-sm mb-3">{description}</p>
    <div className="text-cyan-400 text-sm font-medium">💎 {value}</div>
  </div>
);

const ServerInstallationProgress: React.FC<{ server: any }> = ({ server }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
    <div className={`
      w-3 h-3 rounded-full
      ${server.status === 'completed' 
        ? 'bg-green-500' 
        : server.status === 'installing' 
        ? 'bg-cyan-500 animate-pulse' 
        : 'bg-gray-500'
      }
    `}></div>
    
    <div className="flex-1">
      <div className="text-white text-sm font-medium">{server.server_name}</div>
      <div className="text-gray-400 text-xs">
        {server.status === 'completed' && '✅ Installed and healthy'}
        {server.status === 'installing' && '⚙️ Installing...'}
        {server.status === 'pending' && '⏳ Waiting...'}
      </div>
    </div>
    
    <div className="text-xs text-gray-400">
      {server.progress}%
    </div>
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
}> = ({ label, value, icon }) => (
  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-xl font-bold text-white">{value}</div>
    <div className="text-xs text-gray-400">{label}</div>
  </div>
);

export default SmartOnboardingWizard;