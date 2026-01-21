#!/usr/bin/env node

/**
 * OpenConductor Video Script Generator
 * Converts demo strategy markdown into production-ready narration scripts
 */

const fs = require('fs');
const path = require('path');

// Hero Video Script based on V1.2.0_DEMO_VIDEO_STRATEGY.md
const HERO_VIDEO_SCRIPT = {
  title: "OpenConductor v1.2.0: Set Up Claude in 10 Seconds",
  duration: "2:30",
  scenes: [
    {
      id: "scene-01-hook",
      timestamp: "0:00-0:10",
      duration: 10,
      visual: "Split screen: JSON hell vs. clean terminal",
      narration: "What if you could transform Claude into a specialized AI assistant in 10 seconds instead of 30 minutes? OpenConductor v1.2.0 makes it possible.",
      onScreenText: [
        "30 minutes → 10 seconds",
        "Configuration hell → One command"
      ],
      music: "Upbeat, energetic intro"
    },
    {
      id: "scene-02-problem",
      timestamp: "0:10-0:30",
      duration: 20,
      visual: "Screen recording: manual JSON editing, errors, frustration",
      narration: "Setting up MCP servers used to mean hunting through GitHub, manually editing JSON configs, wrestling with syntax errors, and losing 30 minutes of your day. And that's if everything works.",
      onScreenText: [
        "Manual JSON editing",
        "Syntax errors",
        "Multiple restarts",
        "30+ minutes wasted"
      ],
      music: "Tense, frustrating"
    },
    {
      id: "scene-03-solution",
      timestamp: "0:30-0:50",
      duration: 20,
      visual: "Terminal with openconductor stack list - clean table",
      narration: "Version 1.2.0 introduces Stacks - pre-configured AI workflows that bundle the right servers with specialized system prompts. No configuration, no guesswork, just instant value.",
      onScreenText: [
        "🧑‍💻 Coder Stack - 5 servers",
        "✍️ Writer Stack - 4 servers",
        "⚡ Essential Stack - 3 servers"
      ],
      music: "Hopeful, building"
    },
    {
      id: "scene-04-demo-install",
      timestamp: "0:50-1:10",
      duration: 20,
      visual: "Real-time: openconductor stack install coder",
      narration: "Watch this. One command installs five development servers: GitHub, filesystem, PostgreSQL, memory, and Brave Search. Plus, a specialized system prompt is automatically copied to your clipboard.",
      onScreenText: [
        "$ openconductor stack install coder",
        "✓ Installing 5 servers...",
        "✓ System prompt copied!"
      ],
      music: "Smooth, confident"
    },
    {
      id: "scene-05-demo-usage",
      timestamp: "1:10-1:50",
      duration: 40,
      visual: "Claude Desktop: paste prompt, immediate intelligent responses",
      narration: "Paste the prompt into Claude, and you instantly have a senior software engineer. It can read files, analyze codebases, query databases, search the web, and remember context across sessions. All without touching a single config file.",
      onScreenText: [
        "✓ Reading project files",
        "✓ Analyzing architecture",
        "✓ Querying database",
        "✓ Remembering context"
      ],
      music: "Triumphant"
    },
    {
      id: "scene-06-more-stacks",
      timestamp: "1:50-2:10",
      duration: 20,
      visual: "Quick cuts of Writer and Essential stacks",
      narration: "The Writer Stack transforms Claude into a research and publishing assistant. The Essential Stack gives you the perfect first install. Each stack is crafted for a specific workflow, tested in production, and ready to use.",
      onScreenText: [
        "Writer Stack: Research + Publishing",
        "Essential Stack: Perfect First Install",
        "More stacks coming soon"
      ],
      music: "Building excitement"
    },
    {
      id: "scene-07-cta",
      timestamp: "2:10-2:30",
      duration: 20,
      visual: "OpenConductor logo, website URL, CLI command",
      narration: "Ready to transform your Claude setup? Visit openconductor.ai to explore stacks, or install the CLI now with npm install -g @openconductor/cli. Stop configuring. Start creating.",
      onScreenText: [
        "openconductor.ai/stacks",
        "npm install -g @openconductor/cli",
        "Stop configuring. Start creating."
      ],
      music: "Strong, memorable outro"
    }
  ]
};

// Coder Stack Demo Script
const CODER_STACK_SCRIPT = {
  title: "Coder Stack: Your AI Senior Engineer",
  duration: "1:45",
  scenes: [
    {
      id: "intro",
      timestamp: "0:00-0:15",
      duration: 15,
      narration: "The Coder Stack transforms Claude into a senior software engineer with access to your entire development environment. Let me show you how powerful this is.",
      onScreenText: ["Coder Stack", "GitHub + Files + Database + Memory + Search"]
    },
    {
      id: "install",
      timestamp: "0:15-0:30",
      duration: 15,
      narration: "Installation takes one command: openconductor stack install coder. Five servers configure automatically, and a specialized system prompt is copied to your clipboard.",
      onScreenText: ["$ openconductor stack install coder", "⚡ 10 seconds to productivity"]
    },
    {
      id: "demo-files",
      timestamp: "0:30-0:50",
      duration: 20,
      narration: "Watch Claude read your project files, understand your architecture, and suggest improvements. It sees your entire codebase.",
      onScreenText: ["Reading files...", "Analyzing architecture...", "Suggesting improvements..."]
    },
    {
      id: "demo-database",
      timestamp: "0:50-1:10",
      duration: 20,
      narration: "It can query your database, write migrations, and explain your schema. Real database access, real-time insights.",
      onScreenText: ["Querying PostgreSQL...", "Analyzing schema...", "Writing migration..."]
    },
    {
      id: "demo-github",
      timestamp: "1:10-1:30",
      duration: 20,
      narration: "Create pull requests, review code, manage issues. Claude becomes your development partner.",
      onScreenText: ["Creating PR...", "Reviewing changes...", "Managing issues..."]
    },
    {
      id: "cta",
      timestamp: "1:30-1:45",
      duration: 15,
      narration: "Get the Coder Stack now at openconductor.ai. Your AI senior engineer is one command away.",
      onScreenText: ["openconductor.ai/stacks/coder", "$ openconductor stack install coder"]
    }
  ]
};

// Writer Stack Demo Script
const WRITER_STACK_SCRIPT = {
  title: "Writer Stack: Research & Publishing Assistant",
  duration: "1:45",
  scenes: [
    {
      id: "intro",
      timestamp: "0:00-0:15",
      duration: 15,
      narration: "The Writer Stack transforms Claude into a research and publishing assistant. Perfect for content creators, researchers, and writers.",
      onScreenText: ["Writer Stack", "Brave Search + Memory + GitHub + Filesystem"]
    },
    {
      id: "install",
      timestamp: "0:15-0:30",
      duration: 15,
      narration: "One command installs everything: openconductor stack install writer. Four specialized servers and a research-focused system prompt.",
      onScreenText: ["$ openconductor stack install writer", "Research + Write + Publish"]
    },
    {
      id: "demo-research",
      timestamp: "0:30-0:55",
      duration: 25,
      narration: "Claude searches the web, gathers sources, and synthesizes information. It remembers everything you discuss and builds on previous research.",
      onScreenText: ["Searching web...", "Gathering sources...", "Synthesizing information..."]
    },
    {
      id: "demo-writing",
      timestamp: "0:55-1:20",
      duration: 25,
      narration: "It drafts articles, saves to files, and manages your publishing workflow. From research to publication, all in one conversation.",
      onScreenText: ["Drafting article...", "Saving to file...", "Ready to publish"]
    },
    {
      id: "cta",
      timestamp: "1:20-1:45",
      duration: 25,
      narration: "Transform your research and writing workflow. Get the Writer Stack at openconductor.ai.",
      onScreenText: ["openconductor.ai/stacks/writer", "$ openconductor stack install writer"]
    }
  ]
};

/**
 * Generate formatted script files
 */
function generateScripts(outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate Hero Video Script
  const heroScript = generateScriptFile(HERO_VIDEO_SCRIPT);
  fs.writeFileSync(
    path.join(outputDir, 'hero-video-narration.txt'),
    heroScript.narration
  );
  fs.writeFileSync(
    path.join(outputDir, 'hero-video-timing.json'),
    JSON.stringify(heroScript.timing, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, 'hero-video-onscreen-text.txt'),
    heroScript.onScreenText
  );

  // Generate Coder Stack Script
  const coderScript = generateScriptFile(CODER_STACK_SCRIPT);
  fs.writeFileSync(
    path.join(outputDir, 'coder-stack-narration.txt'),
    coderScript.narration
  );
  fs.writeFileSync(
    path.join(outputDir, 'coder-stack-timing.json'),
    JSON.stringify(coderScript.timing, null, 2)
  );

  // Generate Writer Stack Script
  const writerScript = generateScriptFile(WRITER_STACK_SCRIPT);
  fs.writeFileSync(
    path.join(outputDir, 'writer-stack-narration.txt'),
    writerScript.narration
  );
  fs.writeFileSync(
    path.join(outputDir, 'writer-stack-timing.json'),
    JSON.stringify(writerScript.timing, null, 2)
  );

  console.log('✅ Generated all video scripts in:', outputDir);
  console.log('   - hero-video-narration.txt');
  console.log('   - coder-stack-narration.txt');
  console.log('   - writer-stack-narration.txt');
  console.log('   - *-timing.json (for editing reference)');
}

/**
 * Generate formatted script file from video data
 */
function generateScriptFile(videoData) {
  let narration = `# ${videoData.title}\n`;
  narration += `Duration: ${videoData.duration}\n\n`;
  narration += `=".repeat(60) + '\n\n`;

  let onScreenText = `# ${videoData.title} - On-Screen Text\n\n`;
  let timing = { title: videoData.title, duration: videoData.duration, scenes: [] };

  videoData.scenes.forEach((scene, index) => {
    // Narration script
    narration += `## Scene ${index + 1}: ${scene.id}\n`;
    narration += `Timestamp: ${scene.timestamp} (${scene.duration}s)\n\n`;
    narration += `${scene.narration}\n\n`;
    narration += `Visual: ${scene.visual}\n`;
    if (scene.music) {
      narration += `Music: ${scene.music}\n`;
    }
    narration += `\n${'='.repeat(60)}\n\n`;

    // On-screen text
    if (scene.onScreenText && scene.onScreenText.length > 0) {
      onScreenText += `## Scene ${index + 1} (${scene.timestamp})\n`;
      scene.onScreenText.forEach(text => {
        onScreenText += `  • ${text}\n`;
      });
      onScreenText += '\n';
    }

    // Timing data
    timing.scenes.push({
      id: scene.id,
      timestamp: scene.timestamp,
      duration: scene.duration,
      narrationLength: scene.narration.length,
      visualCue: scene.visual
    });
  });

  return { narration, onScreenText, timing };
}

// Main execution
if (require.main === module) {
  const outputDir = path.join(__dirname, '../v1.2.0-automated/scripts');
  console.log('🎬 OpenConductor Video Script Generator\n');
  generateScripts(outputDir);
  console.log('\n✨ Ready for voiceover generation!');
  console.log('   Upload narration files to ElevenLabs or your TTS service.');
}

module.exports = { generateScripts, HERO_VIDEO_SCRIPT, CODER_STACK_SCRIPT, WRITER_STACK_SCRIPT };
