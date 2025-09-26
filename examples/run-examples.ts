#!/usr/bin/env ts-node

/**
 * Trinity AI Examples Runner
 * 
 * Simple script to run individual agent examples or the full Trinity AI demo
 */

import { runTrinityAIDemo } from './trinity-ai-demo';
import { runOracleExamples } from './oracle-examples';
import { runSentinelExamples } from './sentinel-examples';
import { runSageExamples } from './sage-examples';

const examples = {
  'trinity': {
    name: 'Trinity AI Demo',
    description: 'Complete demo showing all three agents working together',
    run: runTrinityAIDemo
  },
  'oracle': {
    name: 'Oracle Agent Examples',
    description: 'Prediction and forecasting capabilities',
    run: runOracleExamples
  },
  'sentinel': {
    name: 'Sentinel Agent Examples',
    description: 'Monitoring and alerting capabilities',
    run: runSentinelExamples
  },
  'sage': {
    name: 'Sage Agent Examples',
    description: 'Advisory and decision support capabilities',
    run: runSageExamples
  }
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const exampleName = args[0].toLowerCase();
  
  if (exampleName === 'all') {
    console.log('🚀 Running all Trinity AI examples...\n');
    
    for (const [key, example] of Object.entries(examples)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Running: ${example.name}`);
      console.log(`${'='.repeat(50)}\n`);
      
      try {
        await example.run();
      } catch (error) {
        console.error(`❌ ${example.name} failed:`, error);
      }
      
      console.log(`\n✅ ${example.name} completed\n`);
      
      // Pause between examples
      if (key !== 'sage') {
        console.log('Pausing before next example...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 All examples completed successfully!');
    return;
  }

  const example = examples[exampleName as keyof typeof examples];
  
  if (!example) {
    console.error(`❌ Unknown example: ${exampleName}`);
    console.error('Available examples:', Object.keys(examples).join(', '));
    process.exit(1);
  }

  console.log(`🚀 Running: ${example.name}`);
  console.log(`Description: ${example.description}\n`);
  
  try {
    await example.run();
    console.log(`\n✅ ${example.name} completed successfully!`);
  } catch (error) {
    console.error(`❌ ${example.name} failed:`, error);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Trinity AI Examples Runner');
  console.log('==========================\n');
  
  console.log('Usage: npm run examples [example_name]\n');
  
  console.log('Available examples:');
  Object.entries(examples).forEach(([key, example]) => {
    console.log(`  ${key.padEnd(10)} - ${example.description}`);
  });
  
  console.log('  all        - Run all examples sequentially\n');
  
  console.log('Examples:');
  console.log('  npm run examples trinity   # Run the complete Trinity AI demo');
  console.log('  npm run examples oracle    # Run Oracle agent examples only');
  console.log('  npm run examples sentinel  # Run Sentinel agent examples only');
  console.log('  npm run examples sage      # Run Sage agent examples only');
  console.log('  npm run examples all       # Run all examples\n');
  
  console.log('Quick Start:');
  console.log('  npm run examples trinity   # Recommended first run');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Runner failed:', error);
    process.exit(1);
  });
}