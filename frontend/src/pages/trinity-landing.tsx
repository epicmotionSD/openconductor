/**
 * Trinity Agent Platform Landing Page
 * Professional enterprise landing page focusing on Trinity Agents as core product
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, Shield, Eye, Zap, TrendingUp, Clock, DollarSign,
  CheckCircle, ArrowRight, Play, Users, Award, Star
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

const TrinityLandingPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState('oracle');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleStartTrial = async () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      signIn('google', { callbackUrl: '/onboarding' });
    }
  };

  const agentDetails = {
    oracle: {
      name: 'Oracle Analytics',
      tagline: 'The wisdom to see what\'s coming',
      description: 'Advanced business intelligence with predictive analytics. Revenue forecasting, customer insights, and explainable AI decisions with confidence scores.',
      features: [
        'Predictive analytics with 94.2% accuracy',
        'Revenue forecasting and trend analysis',
        'Real-time confidence scoring',
        'Explainable AI decisions'
      ],
      metrics: {
        accuracy: '94.2%',
        responseTime: '145ms',
        predictions: '1,247+',
        roi: '$150k saved monthly'
      },
      color: 'blue'
    },
    sentinel: {
      name: 'Sentinel Monitoring',
      tagline: 'The vigilance to know what\'s happening',
      description: '24/7 autonomous system monitoring with performance optimization, anomaly detection, and intelligent alerting.',
      features: [
        '99.0% system health tracking',
        'Intelligent alert correlation',
        'Automated response triggers',
        'Real-time incident management'
      ],
      metrics: {
        uptime: '99.9%',
        alertReduction: '85%',
        incidents: '3,421+ resolved',
        responseTime: '67ms'
      },
      color: 'green'
    },
    sage: {
      name: 'Sage Optimization',
      tagline: 'The intelligence to know what to do',
      description: 'Intelligent content generation, process automation, workflow enhancement, and strategic decision support.',
      features: [
        '91.8% advisory confidence scoring',
        'Strategic automation workflows',
        'Process optimization recommendations',
        'Brand consistency optimization'
      ],
      metrics: {
        confidence: '91.8%',
        recommendations: '892+',
        timeReduction: '234ms avg',
        efficiency: '+40% improvement'
      },
      color: 'purple'
    }
  };

  const currentAgent = agentDetails[selectedAgent as keyof typeof agentDetails];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-16">
            {/* Logo & Brand */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold">
                  <span className="text-white">Trinity</span>{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Agent
                  </span>
                </h1>
                <p className="text-gray-400 text-lg">Enterprise AI Intelligence Platform</p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
              Transform Your Business with{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI-Powered Intelligence
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Oracle Analytics predicts your future. Sentinel monitors your present. 
              Sage optimizes your decisions. Three specialized AI agents working together 
              to deliver measurable ROI and strategic insights.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleStartTrial}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 text-lg"
              >
                Start 14-Day Free Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border border-gray-600 text-white font-semibold rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-colors text-lg">
                Watch Demo <Play className="w-5 h-5 ml-2" />
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>1000+ Enterprise Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>4.9/5 Customer Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Agent Cards */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4">
          {Object.entries(agentDetails).map(([key, agent]) => (
            <div key={key} className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/30 rounded-lg p-3 text-center min-w-[120px]">
              <div className={`text-${agent.color}-400 text-2xl mb-1`}>
                {key === 'oracle' && '🔮'}
                {key === 'sentinel' && '🛡️'}
                {key === 'sage' && '🧠'}
              </div>
              <div className="text-white text-sm font-medium">{agent.name}</div>
              <div className="text-gray-400 text-xs">{Object.values(agent.metrics)[0]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trinity Agent Deep Dive */}
      <section className="py-20 bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Meet Your <span className="text-cyan-400">Trinity Agents</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three specialized AI agents, each designed for specific business intelligence needs,
              working together to provide comprehensive enterprise automation.
            </p>
          </div>

          {/* Agent Selector */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-gray-800/50 rounded-lg p-2 gap-2">
              {Object.entries(agentDetails).map(([key, agent]) => (
                <button
                  key={key}
                  onClick={() => setSelectedAgent(key)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedAgent === key 
                      ? `bg-${agent.color}-600/20 border border-${agent.color}-400/30 text-${agent.color}-400` 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {key === 'oracle' && <Brain className="w-4 h-4" />}
                  {key === 'sentinel' && <Shield className="w-4 h-4" />}
                  {key === 'sage' && <Eye className="w-4 h-4" />}
                  {agent.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Agent Details */}
          <div className={`bg-${currentAgent.color}-900/20 border border-${currentAgent.color}-400/20 rounded-2xl p-8 lg:p-12`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 bg-${currentAgent.color}-500/20 border border-${currentAgent.color}-400/30 rounded-xl flex items-center justify-center`}>
                    {selectedAgent === 'oracle' && <Brain className={`w-8 h-8 text-${currentAgent.color}-400`} />}
                    {selectedAgent === 'sentinel' && <Shield className={`w-8 h-8 text-${currentAgent.color}-400`} />}
                    {selectedAgent === 'sage' && <Eye className={`w-8 h-8 text-${currentAgent.color}-400`} />}
                  </div>
                  <div>
                    <h3 className={`text-3xl font-bold text-${currentAgent.color}-400`}>
                      {selectedAgent === 'oracle' && '🔮'} {currentAgent.name}
                    </h3>
                    <p className={`text-${currentAgent.color}-300 text-lg italic`}>
                      "{currentAgent.tagline}"
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  {currentAgent.description}
                </p>

                <div className="space-y-4">
                  {currentAgent.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 text-${currentAgent.color}-400`} />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-white mb-6">Live Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(currentAgent.metrics).map(([key, value]) => (
                    <div key={key} className={`bg-${currentAgent.color}-900/10 border border-${currentAgent.color}-400/20 rounded-lg p-4`}>
                      <div className={`text-2xl font-bold text-${currentAgent.color}-400 mb-1`}>{value}</div>
                      <div className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>

                <div className={`bg-${currentAgent.color}-900/10 border border-${currentAgent.color}-400/20 rounded-lg p-6 mt-6`}>
                  <h5 className="text-white font-semibold mb-3">Trial Includes:</h5>
                  <div className="text-gray-300 text-sm space-y-2">
                    <div>✓ {selectedAgent === 'oracle' ? '100' : selectedAgent === 'sentinel' ? '50' : '200'} interactions</div>
                    <div>✓ Full feature access</div>
                    <div>✓ ROI tracking & analytics</div>
                    <div>✓ 14 days free trial</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Benefits */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Proven <span className="text-green-400">ROI</span> & Business Impact
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Trinity Agents deliver measurable business value from day one, with built-in 
              ROI tracking and performance analytics.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-green-900/20 border border-green-400/20 rounded-xl p-8 text-center">
              <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-400 mb-2">$2.1M+</div>
              <div className="text-gray-300">Average Annual Savings</div>
              <div className="text-sm text-gray-400 mt-2">Based on 1000+ enterprise customers</div>
            </div>

            <div className="bg-blue-900/20 border border-blue-400/20 rounded-xl p-8 text-center">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-400 mb-2">85%</div>
              <div className="text-gray-300">Time Reduction</div>
              <div className="text-sm text-gray-400 mt-2">In decision-making processes</div>
            </div>

            <div className="bg-purple-900/20 border border-purple-400/20 rounded-xl p-8 text-center">
              <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-purple-400 mb-2">40%</div>
              <div className="text-gray-300">Efficiency Improvement</div>
              <div className="text-sm text-gray-400 mt-2">In operational workflows</div>
            </div>
          </div>

          {/* Customer Testimonials */}
          <div className="bg-gray-900/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8">What Our Customers Say</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <blockquote className="text-center">
                <p className="text-gray-300 mb-4 italic">
                  "Oracle's predictions helped us increase revenue by 40% in the first quarter alone."
                </p>
                <div className="text-cyan-400 font-semibold">- Sarah Chen, CFO</div>
                <div className="text-gray-500 text-sm">Fortune 500 Manufacturing</div>
              </blockquote>

              <blockquote className="text-center">
                <p className="text-gray-300 mb-4 italic">
                  "Sentinel reduced our incident response time by 85%. Game-changing monitoring."
                </p>
                <div className="text-green-400 font-semibold">- Marcus Rodriguez, CTO</div>
                <div className="text-gray-500 text-sm">Tech Startup, 500+ employees</div>
              </blockquote>

              <blockquote className="text-center">
                <p className="text-gray-300 mb-4 italic">
                  "Sage's strategic recommendations saved us $500k in operational costs this year."
                </p>
                <div className="text-purple-400 font-semibold">- Jennifer Park, COO</div>
                <div className="text-gray-500 text-sm">Financial Services</div>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 bg-gray-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              <span className="text-cyan-400">Enterprise-Grade</span> Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for scale, security, and compliance. Trusted by Fortune 500 companies worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <Shield className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">SOC 2 Compliant</h3>
              <p className="text-gray-400">Enterprise-grade security with full audit trails and compliance reporting.</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <Zap className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">99.9% Uptime SLA</h3>
              <p className="text-gray-400">Mission-critical reliability with redundant infrastructure and failover.</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <Users className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">SSO Integration</h3>
              <p className="text-gray-400">Seamless integration with your existing identity management systems.</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-400">Live dashboards with comprehensive ROI tracking and performance metrics.</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <Award className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-400">Dedicated customer success team with priority enterprise support.</p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">API-First Design</h3>
              <p className="text-gray-400">Comprehensive APIs for seamless integration with your existing tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Business with{' '}
            <span className="text-cyan-400">Trinity Agents</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 1000+ enterprise customers who trust Trinity Agents for their AI-powered 
            business intelligence. Start your free 14-day trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleStartTrial}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 text-lg"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border border-gray-600 text-white font-semibold rounded-lg hover:border-cyan-400 hover:text-cyan-400 transition-colors text-lg">
              Schedule Demo
            </button>
          </div>

          <p className="text-sm text-gray-400">
            ✓ No credit card required  ✓ Full feature access  ✓ 14-day free trial
          </p>
        </div>
      </section>
    </div>
  );
};

export default TrinityLandingPage;