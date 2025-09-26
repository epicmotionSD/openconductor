/**
 * Trinity Agent Onboarding Flow
 * 
 * Multi-step onboarding focused on Trinity Agent value proposition
 * Based on proven x3o.ai conversion-optimized flow
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  Brain, Shield, Eye, CheckCircle, ArrowRight, Play, 
  DollarSign, TrendingUp, Clock, Award, Zap
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

interface AgentSelection {
  oracle: boolean;
  sentinel: boolean;
  sage: boolean;
}

interface UserProfile {
  role: string;
  company: string;
  teamSize: string;
  primaryGoals: string[];
  industry: string;
}

const TrinityOnboarding: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<AgentSelection>({
    oracle: true,
    sentinel: true,
    sage: true
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    role: '',
    company: '',
    teamSize: '',
    primaryGoals: [],
    industry: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Trinity Agent Intelligence',
      description: 'Your AI-powered business transformation starts here',
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Tell us about your business',
      description: 'Help us customize your Trinity Agent experience',
      component: ProfileStep
    },
    {
      id: 'agents',
      title: 'Choose your Trinity Agents',
      description: 'Select the AI agents that will transform your business',
      component: AgentSelectionStep
    },
    {
      id: 'trial-setup',
      title: 'Your 14-day trial is ready',
      description: 'Experience the power of Trinity Agents risk-free',
      component: TrialSetupStep
    },
    {
      id: 'first-interaction',
      title: 'See Trinity Agents in action',
      description: 'Watch your first AI-powered business insights unfold',
      component: FirstInteractionStep
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save onboarding data and redirect to dashboard
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAgents,
          userProfile
        })
      });

      router.push('/dashboard?welcome=true');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress Bar */}
      <div className="bg-gray-900/50 border-b border-gray-700/30">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-cyan-400 font-semibold">Trinity Agent Platform</div>
                <div className="text-xs text-gray-400">Setup Wizard</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                  index === currentStep ? 'bg-cyan-600/20 border border-cyan-400/30 text-cyan-400' :
                  index < currentStep ? 'bg-green-600/20 border border-green-400/30 text-green-400' :
                  'bg-gray-800/30 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                  )}
                  <span className="text-sm">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <CurrentStepComponent
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
          onNext={nextStep}
          onPrev={prevStep}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

/**
 * Welcome Step Component
 */
const WelcomeStep: React.FC<{
  onNext: () => void;
  isFirst: boolean;
}> = ({ onNext, isFirst }) => {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Trinity Agent
          </span>{' '}
          Intelligence
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Transform your business with AI agents that predict, monitor, and optimize.
          Join 1000+ enterprises already saving millions with Trinity Agents.
        </p>
      </div>

      {/* Trinity Agent Preview */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-900/20 border border-blue-400/20 rounded-xl p-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            🔮
          </div>
          <h3 className="text-xl font-bold text-blue-400 mb-2">Oracle Analytics</h3>
          <p className="text-gray-300 mb-4">"The wisdom to see what's coming"</p>
          <div className="text-sm text-gray-400">
            Predictive insights • Revenue forecasting • 94.2% accuracy
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-400/20 rounded-xl p-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            🛡️
          </div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Sentinel Monitoring</h3>
          <p className="text-gray-300 mb-4">"The vigilance to know what's happening"</p>
          <div className="text-sm text-gray-400">
            24/7 monitoring • 99.9% uptime • 85% alert reduction
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-400/20 rounded-xl p-6">
          <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            🧠
          </div>
          <h3 className="text-xl font-bold text-purple-400 mb-2">Sage Optimization</h3>
          <p className="text-gray-300 mb-4">"The intelligence to know what to do"</p>
          <div className="text-sm text-gray-400">
            Strategic insights • Process optimization • 91.8% confidence
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-400/20 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Why Trinity Agents?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-400">$2.1M+</div>
            <div className="text-gray-300">Average Annual Savings</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-400">85%</div>
            <div className="text-gray-300">Time Reduction</div>
          </div>
          <div className="text-center">
            <Award className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-purple-400">99.9%</div>
            <div className="text-gray-300">Uptime SLA</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 text-lg"
        >
          Start Your Journey <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Profile Step Component
 */
const ProfileStep: React.FC<{
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ userProfile, setUserProfile, onNext, onPrev }) => {
  const updateProfile = (field: keyof UserProfile, value: string | string[]) => {
    setUserProfile({ ...userProfile, [field]: value });
  };

  const toggleGoal = (goal: string) => {
    const goals = userProfile.primaryGoals.includes(goal)
      ? userProfile.primaryGoals.filter(g => g !== goal)
      : [...userProfile.primaryGoals, goal];
    updateProfile('primaryGoals', goals);
  };

  const canProceed = userProfile.role && userProfile.company && userProfile.teamSize;

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Tell us about your business</h2>
        <p className="text-gray-300 text-lg">
          Help us customize your Trinity Agent experience for maximum impact
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What's your role?
          </label>
          <select
            value={userProfile.role}
            onChange={(e) => updateProfile('role', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="">Select your role</option>
            <option value="ceo">CEO/Founder</option>
            <option value="cto">CTO/VP Engineering</option>
            <option value="cfo">CFO/Finance</option>
            <option value="coo">COO/Operations</option>
            <option value="director">Director/Manager</option>
            <option value="analyst">Analyst/Individual Contributor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={userProfile.company}
            onChange={(e) => updateProfile('company', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            placeholder="Enter your company name"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team Size
            </label>
            <select
              value={userProfile.teamSize}
              onChange={(e) => updateProfile('teamSize', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Select team size</option>
              <option value="1-10">1-10 people</option>
              <option value="11-50">11-50 people</option>
              <option value="51-200">51-200 people</option>
              <option value="201-1000">201-1000 people</option>
              <option value="1000+">1000+ people</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Industry
            </label>
            <select
              value={userProfile.industry}
              onChange={(e) => updateProfile('industry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Select industry</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Goals (select all that apply)
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Increase revenue',
              'Reduce costs',
              'Improve efficiency',
              'Better decision making',
              'Risk management',
              'Process automation',
              'Customer insights',
              'Competitive advantage'
            ].map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-4 py-3 rounded-lg border transition-colors text-left ${
                  userProfile.primaryGoals.includes(goal)
                    ? 'bg-cyan-600/20 border-cyan-400/30 text-cyan-400'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Agent Selection Step Component
 */
const AgentSelectionStep: React.FC<{
  selectedAgents: AgentSelection;
  setSelectedAgents: (agents: AgentSelection) => void;
  userProfile: UserProfile;
  onNext: () => void;
  onPrev: () => void;
}> = ({ selectedAgents, setSelectedAgents, userProfile, onNext, onPrev }) => {
  const toggleAgent = (agent: keyof AgentSelection) => {
    setSelectedAgents({
      ...selectedAgents,
      [agent]: !selectedAgents[agent]
    });
  };

  const selectedCount = Object.values(selectedAgents).filter(Boolean).length;

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose your Trinity Agents</h2>
        <p className="text-gray-300 text-lg">
          Select the AI agents that align with your business goals. All agents include 14-day free trial.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Oracle Agent */}
        <AgentCard
          agent="oracle"
          selected={selectedAgents.oracle}
          onToggle={() => toggleAgent('oracle')}
          title="Oracle Analytics"
          emoji="🔮"
          tagline="The wisdom to see what's coming"
          description="Advanced predictive analytics and business intelligence"
          features={[
            '100 predictions/trial',
            'Revenue forecasting',
            'Customer insights',
            'Risk assessment',
            'Trend analysis'
          ]}
          trialValue="$15,000 value"
          recommended={userProfile.primaryGoals.includes('Better decision making')}
        />

        {/* Sentinel Agent */}
        <AgentCard
          agent="sentinel"
          selected={selectedAgents.sentinel}
          onToggle={() => toggleAgent('sentinel')}
          title="Sentinel Monitoring"
          emoji="🛡️"
          tagline="The vigilance to know what's happening"
          description="24/7 autonomous system monitoring and alerting"
          features={[
            '50 health checks/trial',
            'Real-time monitoring',
            'Alert correlation',
            'Performance tracking',
            'Incident response'
          ]}
          trialValue="$7,500 value"
          recommended={userProfile.primaryGoals.includes('Risk management')}
        />

        {/* Sage Agent */}
        <AgentCard
          agent="sage"
          selected={selectedAgents.sage}
          onToggle={() => toggleAgent('sage')}
          title="Sage Optimization"
          emoji="🧠"
          tagline="The intelligence to know what to do"
          description="Intelligent content generation and process optimization"
          features={[
            '200 optimizations/trial',
            'Strategic recommendations',
            'Process automation',
            'Content generation',
            'Workflow enhancement'
          ]}
          trialValue="$25,000 value"
          recommended={userProfile.primaryGoals.includes('Improve efficiency')}
        />
      </div>

      {selectedCount > 0 && (
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-400/20 rounded-xl p-6 text-center mb-8">
          <h3 className="text-xl font-bold mb-2">Your Trinity Agent Trial</h3>
          <p className="text-gray-300 mb-4">
            {selectedCount} agent{selectedCount !== 1 ? 's' : ''} selected • 14 days free • ${((selectedCount * 15000) / 1000).toFixed(0)}k+ trial value
          </p>
          <div className="text-sm text-cyan-400">
            ✓ No credit card required  ✓ Full feature access  ✓ Cancel anytime
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Free Trial <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Agent Card Component
 */
const AgentCard: React.FC<{
  agent: string;
  selected: boolean;
  onToggle: () => void;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  features: string[];
  trialValue: string;
  recommended?: boolean;
}> = ({
  agent,
  selected,
  onToggle,
  title,
  emoji,
  tagline,
  description,
  features,
  trialValue,
  recommended
}) => {
  const getColorClasses = () => {
    if (agent === 'oracle') return selected ? 'bg-blue-900/20 border-blue-400/30' : 'bg-gray-800/30 border-gray-600/30';
    if (agent === 'sentinel') return selected ? 'bg-green-900/20 border-green-400/30' : 'bg-gray-800/30 border-gray-600/30';
    return selected ? 'bg-purple-900/20 border-purple-400/30' : 'bg-gray-800/30 border-gray-600/30';
  };

  return (
    <div
      className={`relative border rounded-xl p-6 cursor-pointer transition-all hover:border-opacity-60 ${getColorClasses()}`}
      onClick={onToggle}
    >
      {recommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-full">
          RECOMMENDED
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm italic mb-3">"{tagline}"</p>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>

      <div className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      <div className="text-center mb-4">
        <div className="text-cyan-400 font-semibold">{trialValue}</div>
        <div className="text-xs text-gray-400">14-day trial value</div>
      </div>

      <div className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center ${
        selected ? 'bg-cyan-400 border-cyan-400' : 'border-gray-400'
      }`}>
        {selected && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
    </div>
  );
};

/**
 * Trial Setup Step Component
 */
const TrialSetupStep: React.FC<{
  selectedAgents: AgentSelection;
  userProfile: UserProfile;
  onNext: () => void;
  onPrev: () => void;
}> = ({ selectedAgents, userProfile, onNext, onPrev }) => {
  const selectedAgentsList = Object.entries(selectedAgents)
    .filter(([_, selected]) => selected)
    .map(([agent, _]) => agent);

  const agentNames = {
    oracle: 'Oracle Analytics',
    sentinel: 'Sentinel Monitoring',
    sage: 'Sage Optimization'
  };

  return (
    <div className="py-8 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your trial is ready! 🎉</h2>
        <p className="text-gray-300 text-lg">
          Welcome to Trinity Agent Intelligence, {userProfile.company}
        </p>
      </div>

      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-400/20 rounded-xl p-8 mb-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold mb-4">Your 14-Day Free Trial Includes:</h3>
        
        <div className="space-y-4 mb-6">
          {selectedAgentsList.map((agent) => (
            <div key={agent} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {agent === 'oracle' && '🔮'}
                  {agent === 'sentinel' && '🛡️'}
                  {agent === 'sage' && '🧠'}
                </div>
                <span className="text-white font-medium">{agentNames[agent as keyof typeof agentNames]}</span>
              </div>
              <div className="text-sm">
                {agent === 'oracle' && '100 predictions'}
                {agent === 'sentinel' && '50 health checks'}
                {agent === 'sage' && '200 optimizations'}
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-300 space-y-2">
          <div>✓ Full access to all features</div>
          <div>✓ Real-time ROI tracking</div>
          <div>✓ Professional support</div>
          <div>✓ No credit card required</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="text-2xl font-bold text-green-400 mb-2">
          ${((selectedAgentsList.length * 15000) / 1000).toFixed(0)}k+ Trial Value
        </div>
        <div className="text-gray-400">Experience enterprise-grade AI intelligence</div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 text-lg"
        >
          Launch Dashboard <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * First Interaction Step Component
 */
const FirstInteractionStep: React.FC<{
  selectedAgents: AgentSelection;
  isLoading: boolean;
  onNext: () => void;
  onPrev: () => void;
}> = ({ selectedAgents, isLoading, onNext, onPrev }) => {
  const [demoStep, setDemoStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const firstSelectedAgent = Object.entries(selectedAgents)
    .find(([_, selected]) => selected)?.[0] as keyof AgentSelection;

  const demoData = {
    oracle: {
      input: 'Analyze Q4 revenue trends',
      result: 'Predicted 23% increase in Q4 revenue based on current trends',
      confidence: 94.2,
      roi: '$150,000 monthly savings'
    },
    sentinel: {
      input: 'Check system health',
      result: 'All systems operational, performance optimized',
      confidence: 98.7,
      roi: '$75,000 downtime prevention'
    },
    sage: {
      input: 'Optimize marketing workflow',
      result: 'Identified 3 process improvements for 40% efficiency gain',
      confidence: 91.8,
      roi: '$200,000 annual savings'
    }
  };

  const currentDemo = demoData[firstSelectedAgent || 'oracle'];

  useEffect(() => {
    if (demoStep === 0) {
      const timer = setTimeout(() => setDemoStep(1), 1000);
      return () => clearTimeout(timer);
    } else if (demoStep === 1) {
      const timer = setTimeout(() => {
        setDemoStep(2);
        setShowResults(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [demoStep]);

  return (
    <div className="py-8 text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">See Trinity Agents in action</h2>
        <p className="text-gray-300 text-lg">
          Watch your first AI-powered business insight unfold
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-8 mb-8">
          <h3 className="text-lg font-semibold mb-6">
            {firstSelectedAgent === 'oracle' && '🔮 Oracle Analytics Demo'}
            {firstSelectedAgent === 'sentinel' && '🛡️ Sentinel Monitoring Demo'}
            {firstSelectedAgent === 'sage' && '🧠 Sage Optimization Demo'}
          </h3>

          <div className="text-left space-y-4">
            <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
              <div className="text-blue-400 text-sm font-medium mb-2">Input:</div>
              <div className="text-white">{currentDemo.input}</div>
            </div>

            {demoStep >= 1 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                <span>Trinity Agent processing...</span>
              </div>
            )}

            {showResults && (
              <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-4">
                <div className="text-green-400 text-sm font-medium mb-2">Result:</div>
                <div className="text-white mb-3">{currentDemo.result}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-green-400 ml-2">{currentDemo.confidence}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ROI Impact:</span>
                    <span className="text-green-400 ml-2">{currentDemo.roi}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showResults && (
          <div className="mb-8">
            <div className="text-2xl font-bold text-green-400 mb-2">This is just the beginning!</div>
            <div className="text-gray-300">
              Your Trinity Agents are ready to transform your business with thousands more insights like this.
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onPrev}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!showResults || isLoading}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
              Setting up...
            </>
          ) : (
            <>
              Enter Dashboard <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TrinityOnboarding;