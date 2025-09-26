#!/usr/bin/env ts-node

/**
 * Sage Agent Examples
 * 
 * Demonstrates advisory, decision support, and recommendation capabilities:
 * - Strategic business recommendations
 * - Multi-criteria decision analysis
 * - Risk assessment and mitigation
 * - Performance optimization advice
 * - Natural language advisory queries
 */

import { Logger } from '../src/utils/logger';
import { SageAgent } from '../src/agents/sage-agent';
import { AgentConfig } from '../src/types/agent';

const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: ['console']
});

async function runSageExamples() {
  console.log('🧠 Sage Agent Examples');
  console.log('=======================\n');

  const sage = await initializeSage();

  // Example 1: Strategic Business Advisory
  await strategicAdvisoryExample(sage);

  // Example 2: Performance Optimization Recommendations
  await performanceOptimizationExample(sage);

  // Example 3: Risk Assessment and Mitigation
  await riskAssessmentExample(sage);

  // Example 4: Natural Language Query Processing
  await naturalLanguageExample(sage);

  // Example 5: Multi-Criteria Decision Analysis
  await decisionAnalysisExample(sage);

  console.log('✅ All Sage examples completed successfully');
}

async function initializeSage(): Promise<SageAgent> {
  const config: AgentConfig = {
    id: 'sage-examples',
    name: 'Sage Examples Agent',
    version: '1.0.0',
    type: 'advisory',
    description: 'Sage agent for demonstration examples',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sage = new SageAgent(config, logger);
  await sage.initialize();
  
  // Add specialized knowledge domains
  await sage.addKnowledge('retail', {
    optimization: ['Inventory management', 'Price optimization', 'Customer segmentation'],
    growth: ['Market expansion', 'Product diversification', 'Customer acquisition'],
    operations: ['Supply chain optimization', 'Staff scheduling', 'Quality control']
  });

  await sage.addKnowledge('technology', {
    scalability: ['Microservices architecture', 'Load balancing', 'Database sharding'],
    performance: ['Caching strategies', 'Code optimization', 'Infrastructure scaling'],
    security: ['Zero trust architecture', 'Encryption protocols', 'Access management']
  });

  console.log('🧠 Sage Agent initialized with enhanced knowledge base\n');
  return sage;
}

async function strategicAdvisoryExample(sage: SageAgent) {
  console.log('🎯 Example 1: Strategic Business Advisory');
  console.log('----------------------------------------');

  const businessContext = {
    domain: 'technology',
    objective: 'Scale our SaaS platform to handle 10x current user base',
    riskTolerance: 'medium' as const,
    timeline: 'medium-term',
    budget: 500000,
    currentState: {
      users: 50000,
      revenue: 2000000,
      team_size: 25,
      infrastructure_cost: 80000,
      churn_rate: 0.05
    },
    constraints: {
      team_growth_limit: 15,
      regulatory_compliance: 'GDPR, SOX',
      uptime_requirement: 99.9
    }
  };

  console.log('Business Context:');
  console.log(`   Objective: ${businessContext.objective}`);
  console.log(`   Current Users: ${businessContext.currentState.users.toLocaleString()}`);
  console.log(`   Annual Revenue: $${businessContext.currentState.revenue.toLocaleString()}`);
  console.log(`   Team Size: ${businessContext.currentState.team_size}`);
  console.log(`   Budget: $${businessContext.budget.toLocaleString()}`);

  const recommendations = await sage.execute(businessContext);

  console.log('\n📋 Strategic Recommendations:');
  console.log(`   Overall Confidence: ${Math.round((recommendations.metadata?.confidence || 0) * 100)}%`);
  console.log(`   Risk Level: ${recommendations.metadata?.riskLevel || 'unknown'}`);

  recommendations.recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.action}`);
    console.log(`      Description: ${rec.description}`);
    console.log(`      Impact: ${rec.impact} | Confidence: ${Math.round(rec.confidence * 100)}%`);
    
    if (rec.metadata?.benefits) {
      console.log(`      Benefits: ${rec.metadata.benefits.join(', ')}`);
    }
  });

  if (recommendations.reasoning) {
    console.log(`\n   💡 Strategic Reasoning: ${recommendations.reasoning}`);
  }

  console.log('');
}

async function performanceOptimizationExample(sage: SageAgent) {
  console.log('⚡ Example 2: Performance Optimization Advisory');
  console.log('----------------------------------------------');

  const performanceContext = {
    domain: 'technology',
    objective: 'Optimize system performance to reduce response times by 50%',
    riskTolerance: 'low' as const,
    currentState: {
      avg_response_time: 850,
      cpu_utilization: 78,
      memory_usage: 85,
      database_query_time: 450,
      cache_hit_ratio: 0.65,
      concurrent_users: 5000,
      error_rate: 0.02
    },
    constraints: {
      budget: 100000,
      downtime_tolerance: 'minimal',
      compliance_requirements: ['PCI DSS', 'HIPAA']
    }
  };

  console.log('Performance Analysis Context:');
  console.log(`   Current Response Time: ${performanceContext.currentState.avg_response_time}ms`);
  console.log(`   Target: Reduce by 50% (${performanceContext.currentState.avg_response_time * 0.5}ms)`);
  console.log(`   CPU Utilization: ${performanceContext.currentState.cpu_utilization}%`);
  console.log(`   Cache Hit Ratio: ${Math.round(performanceContext.currentState.cache_hit_ratio * 100)}%`);

  const recommendations = await sage.execute(performanceContext);

  console.log('\n🔧 Performance Optimization Plan:');
  recommendations.recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.action}`);
    console.log(`      Priority: ${rec.impact} impact, ${Math.round(rec.confidence * 100)}% confidence`);
    console.log(`      Description: ${rec.description}`);
  });

  // Simulate implementation timeline
  console.log('\n📅 Recommended Implementation Timeline:');
  const timeline = [
    { phase: 'Week 1-2', actions: ['Database query optimization', 'Index creation'] },
    { phase: 'Week 3-4', actions: ['Caching layer implementation', 'CDN setup'] },
    { phase: 'Week 5-6', actions: ['Code optimization', 'Resource scaling'] },
    { phase: 'Week 7-8', actions: ['Performance testing', 'Monitoring setup'] }
  ];

  timeline.forEach(item => {
    console.log(`   ${item.phase}: ${item.actions.join(', ')}`);
  });

  console.log('');
}

async function riskAssessmentExample(sage: SageAgent) {
  console.log('🛡️  Example 3: Risk Assessment & Mitigation');
  console.log('-------------------------------------------');

  const riskContext = {
    domain: 'business',
    objective: 'Expand into European market while managing regulatory and operational risks',
    riskTolerance: 'low' as const,
    currentState: {
      market_presence: 'North America only',
      revenue: 5000000,
      compliance_status: 'US regulations only',
      team_international_experience: 'limited',
      capital_reserves: 1500000
    },
    constraints: {
      launch_timeline: '6 months',
      regulatory_requirements: ['GDPR', 'local tax laws'],
      cultural_adaptation_needed: true
    },
    stakeholders: ['board', 'investors', 'legal team', 'product team']
  };

  console.log('Risk Assessment Context:');
  console.log(`   Expansion Goal: ${riskContext.objective}`);
  console.log(`   Risk Tolerance: ${riskContext.riskTolerance}`);
  console.log(`   Timeline: ${riskContext.constraints.launch_timeline}`);
  console.log(`   Available Capital: $${riskContext.currentState.capital_reserves.toLocaleString()}`);

  const recommendations = await sage.execute(riskContext);

  console.log('\n⚖️  Risk Analysis Results:');
  console.log(`   Overall Risk Level: ${recommendations.metadata?.riskLevel || 'unknown'}`);

  if (recommendations.metadata?.riskAssessment) {
    const riskAssessment = recommendations.metadata.riskAssessment;
    console.log('\n   🚨 Identified Risk Factors:');
    riskAssessment.factors.forEach((factor: string) => {
      console.log(`      • ${factor}`);
    });

    console.log('\n   🛡️  Recommended Mitigations:');
    riskAssessment.mitigations.forEach((mitigation: string) => {
      console.log(`      • ${mitigation}`);
    });
  }

  console.log('\n📋 Risk Mitigation Recommendations:');
  recommendations.recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.action}`);
    console.log(`      Risk Reduction: ${rec.impact}`);
    console.log(`      Implementation: ${rec.description}`);
    
    if (rec.metadata?.timeline) {
      console.log(`      Timeline: ${JSON.stringify(rec.metadata.timeline)}`);
    }
  });

  console.log('');
}

async function naturalLanguageExample(sage: SageAgent) {
  console.log('💬 Example 4: Natural Language Query Processing');
  console.log('-----------------------------------------------');

  const queries = [
    "How can I improve my e-commerce conversion rates?",
    "What's the best strategy for scaling our tech startup aggressively?",
    "Help me reduce operational costs while maintaining service quality",
    "Should we prioritize mobile app development or web platform enhancement?",
    "What are the key factors for successful international expansion?"
  ];

  console.log('Processing natural language advisory queries:\n');

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`   Query ${i + 1}: "${query}"`);

    try {
      const recommendations = await sage.execute(query, {
        maxRecommendations: 3,
        confidenceThreshold: 0.6
      });

      console.log(`   🎯 Analysis Domain: ${recommendations.metadata?.domain || 'general'}`);
      console.log(`   📊 Confidence: ${Math.round((recommendations.metadata?.confidence || 0) * 100)}%`);

      if (recommendations.recommendations.length > 0) {
        console.log('   📋 Top Recommendations:');
        recommendations.recommendations.forEach((rec, idx) => {
          console.log(`      ${idx + 1}. ${rec.action} (${rec.impact} impact)`);
        });
      }

      if (recommendations.reasoning) {
        const shortReasoning = recommendations.reasoning.substring(0, 120) + '...';
        console.log(`   💡 Reasoning: ${shortReasoning}`);
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ Query processing failed: ${error}`);
      console.log('');
    }
  }
}

async function decisionAnalysisExample(sage: SageAgent) {
  console.log('🤔 Example 5: Multi-Criteria Decision Analysis');
  console.log('----------------------------------------------');

  const decisionContext = {
    domain: 'technology',
    objective: 'Choose the best cloud infrastructure provider for our application',
    riskTolerance: 'medium' as const,
    alternatives: [
      {
        name: 'AWS',
        cost: 12000,
        performance: 9,
        reliability: 9,
        vendor_lock_risk: 7,
        learning_curve: 6
      },
      {
        name: 'Google Cloud',
        cost: 10000,
        performance: 8,
        reliability: 8,
        vendor_lock_risk: 6,
        learning_curve: 7
      },
      {
        name: 'Azure',
        cost: 11500,
        performance: 8,
        reliability: 9,
        vendor_lock_risk: 8,
        learning_curve: 5
      },
      {
        name: 'Multi-Cloud',
        cost: 18000,
        performance: 7,
        reliability: 10,
        vendor_lock_risk: 2,
        learning_curve: 9
      }
    ],
    priorityWeights: {
      cost: 0.3,
      performance: 0.25,
      reliability: 0.25,
      risk: 0.15,
      ease_of_use: 0.05
    }
  };

  console.log('Decision Analysis Setup:');
  console.log(`   Decision: ${decisionContext.objective}`);
  console.log(`   Alternatives: ${decisionContext.alternatives.map(a => a.name).join(', ')}`);
  console.log('   Evaluation Criteria: Cost (30%), Performance (25%), Reliability (25%), Risk (15%), Ease of Use (5%)');

  const recommendations = await sage.execute(decisionContext);

  console.log('\n📊 Decision Analysis Results:');
  
  // Display decision matrix if available
  if (recommendations.metadata?.decisionMatrix) {
    const matrix = recommendations.metadata.decisionMatrix;
    console.log('\n   🏆 Alternative Rankings:');
    matrix.rankings.forEach((ranking: any, index: number) => {
      const alternative = matrix.alternatives.find((alt: any) => alt.id === ranking.alternativeId);
      console.log(`      ${index + 1}. ${alternative?.name || ranking.alternativeId} (Score: ${Math.round(ranking.score * 100)})`);
    });
  }

  console.log('\n📋 Final Recommendations:');
  recommendations.recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.action}`);
    console.log(`      Confidence: ${Math.round(rec.confidence * 100)}%`);
    console.log(`      Rationale: ${rec.description}`);
  });

  console.log('\n🎯 Decision Summary:');
  if (recommendations.reasoning) {
    console.log(`   ${recommendations.reasoning}`);
  }

  // Show decision factors analysis
  console.log('\n📈 Key Decision Factors:');
  const factors = [
    'Cost-effectiveness and budget alignment',
    'Performance requirements and benchmarks',
    'Reliability and uptime guarantees',
    'Vendor lock-in and migration risks',
    'Team expertise and learning curve'
  ];

  factors.forEach((factor, index) => {
    const importance = ['High', 'High', 'Medium', 'Medium', 'Low'][index];
    console.log(`   • ${factor} (${importance} importance)`);
  });

  console.log('');
}

// Run examples
if (require.main === module) {
  runSageExamples()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Sage examples failed:', error);
      process.exit(1);
    });
}

export { runSageExamples };