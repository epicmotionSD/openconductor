#!/usr/bin/env node

/**
 * OpenConductor Slide Generator
 * Creates HTML slides for title screens and transitions
 */

const fs = require('fs');
const path = require('path');

// Slide templates
const SLIDES = {
  intro: {
    title: "OpenConductor v1.2.0",
    subtitle: "Set Up Claude in 10 Seconds",
    background: "#1a1a2e",
    foreground: "#ffffff",
    accent: "#00d9ff"
  },
  problem: {
    title: "The Old Way",
    subtitle: "30 Minutes of Configuration Hell",
    bullets: [
      "Manual JSON editing",
      "Syntax errors",
      "Multiple restarts",
      "Trial and error"
    ],
    background: "#2d1b1b",
    foreground: "#ffffff",
    accent: "#ff6b6b"
  },
  solution: {
    title: "The New Way",
    subtitle: "Stacks: Instant Productivity",
    bullets: [
      "🧑‍💻 Coder Stack - 5 servers",
      "✍️ Writer Stack - 4 servers",
      "⚡ Essential Stack - 3 servers"
    ],
    background: "#1a2e1a",
    foreground: "#ffffff",
    accent: "#00ff88"
  },
  coderStack: {
    title: "Coder Stack",
    subtitle: "Your AI Senior Engineer",
    bullets: [
      "GitHub integration",
      "Filesystem access",
      "PostgreSQL queries",
      "Long-term memory",
      "Web search"
    ],
    background: "#1a1a2e",
    foreground: "#ffffff",
    accent: "#00d9ff"
  },
  writerStack: {
    title: "Writer Stack",
    subtitle: "Research & Publishing Assistant",
    bullets: [
      "Web research",
      "Source gathering",
      "Content creation",
      "File management"
    ],
    background: "#2e1a2e",
    foreground: "#ffffff",
    accent: "#ff00ff"
  },
  essentialStack: {
    title: "Essential Stack",
    subtitle: "Perfect First Install",
    bullets: [
      "Core functionality",
      "Minimal setup",
      "Best for beginners",
      "Expandable"
    ],
    background: "#2e2e1a",
    foreground: "#ffffff",
    accent: "#ffff00"
  },
  cta: {
    title: "Get Started Today",
    subtitle: "npm install -g @openconductor/cli",
    bullets: [
      "openconductor.ai/stacks",
      "github.com/openconductor/openconductor",
      "Stop configuring. Start creating."
    ],
    background: "#1a1a2e",
    foreground: "#ffffff",
    accent: "#00ff88"
  }
};

/**
 * Generate HTML slide
 */
function generateSlideHTML(slide, slideName) {
  const hasBullets = slide.bullets && slide.bullets.length > 0;

  const bulletsHTML = hasBullets
    ? `
      <ul class="bullets">
        ${slide.bullets.map(bullet => `<li>${bullet}</li>`).join('\n        ')}
      </ul>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${slide.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: ${slide.background};
      color: ${slide.foreground};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px;
    }

    .slide {
      max-width: 1200px;
      width: 100%;
      text-align: center;
    }

    .title {
      font-size: 5rem;
      font-weight: bold;
      margin-bottom: 20px;
      color: ${slide.accent};
      text-shadow: 0 0 20px ${slide.accent}40;
      animation: fadeInDown 0.8s ease-out;
    }

    .subtitle {
      font-size: 2.5rem;
      margin-bottom: 40px;
      opacity: 0.9;
      animation: fadeIn 1s ease-out 0.3s both;
    }

    .bullets {
      list-style: none;
      font-size: 2rem;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      text-align: left;
    }

    .bullets li {
      margin-bottom: 20px;
      padding-left: 50px;
      position: relative;
      animation: fadeInLeft 0.6s ease-out both;
    }

    .bullets li:nth-child(1) { animation-delay: 0.5s; }
    .bullets li:nth-child(2) { animation-delay: 0.7s; }
    .bullets li:nth-child(3) { animation-delay: 0.9s; }
    .bullets li:nth-child(4) { animation-delay: 1.1s; }
    .bullets li:nth-child(5) { animation-delay: 1.3s; }

    .bullets li:before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${slide.accent};
      font-size: 2.5rem;
      line-height: 1;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Print styles for PDF export */
    @media print {
      body {
        width: 1920px;
        height: 1080px;
      }
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1 class="title">${slide.title}</h1>
    <p class="subtitle">${slide.subtitle}</p>
    ${bulletsHTML}
  </div>
</body>
</html>`;
}

/**
 * Generate all slides
 */
function generateAllSlides(outputDir) {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 OpenConductor Slide Generator\n');

  const slideNames = Object.keys(SLIDES);
  slideNames.forEach(slideName => {
    const slide = SLIDES[slideName];
    const html = generateSlideHTML(slide, slideName);
    const filename = `${slideName}-slide.html`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, html);
    console.log(`✓ Generated: ${filename}`);
  });

  // Generate README with instructions
  const readme = `# OpenConductor Demo Slides

## Generated Slides

${slideNames.map(name => `- ${name}-slide.html`).join('\n')}

## Usage

### View in Browser
Open any HTML file in a web browser to preview the slide.

### Record for Video
1. Open slide in browser
2. Press F11 for fullscreen
3. Use screen recording software to capture
4. Hold slide for 3-5 seconds

### Convert to Image (Optional)
If you have a screenshot tool installed:

\`\`\`bash
# Using Firefox headless (if installed)
firefox --headless --screenshot intro-slide.png intro-slide.html

# Using Chrome/Chromium headless (if installed)
chromium-browser --headless --screenshot --window-size=1920,1080 intro-slide.html
\`\`\`

### Export to PDF (Optional)
Open slide in browser and use "Print to PDF" with these settings:
- Layout: Landscape
- Paper: Custom (19.20 x 10.80 inches)
- Margins: None
- Background graphics: Enabled

## Customization

Edit \`generate-slides.js\` to:
- Change colors
- Modify content
- Add new slides
- Adjust animations
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  console.log('✓ Generated: README.md\n');

  console.log('✅ All slides generated in:', outputDir);
  console.log('\nNext steps:');
  console.log('  1. Open slides in browser to preview');
  console.log('  2. Press F11 for fullscreen');
  console.log('  3. Record or screenshot for video');
}

// Main execution
if (require.main === module) {
  const outputDir = path.join(__dirname, '../v1.2.0-automated/slides');
  generateAllSlides(outputDir);
}

module.exports = { generateAllSlides, generateSlideHTML, SLIDES };
