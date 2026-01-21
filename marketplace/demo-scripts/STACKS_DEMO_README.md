# Stacks Demo GIF

This directory contains the configuration to generate a demo GIF showing the OpenConductor Stacks feature.

## What the Demo Shows

1. **List available stacks** - Shows all curated stacks (coder, writer, essential)
2. **Install coder stack** - Demonstrates the complete installation in ~8 seconds
3. **Success message** - Shows the completion with timing

## Rendering the Demo

### Option 1: Using Terminalizer (Recommended for local testing)

```bash
# Install terminalizer if not already installed
npm install -g terminalizer

# Render the GIF (requires GUI environment)
cd demo-scripts
terminalizer render stacks-demo.yml -o stacks-demo.gif
```

**Note:** Terminalizer requires a GUI environment and may not work in headless environments or WSL without X server.

### Option 2: Using asciinema + agg

```bash
# Install asciinema
sudo apt install asciinema  # or: brew install asciinema

# Install agg (asciinema GIF generator)
cargo install agg  # Requires Rust

# Convert to GIF
agg stacks-demo.cast stacks-demo.gif
```

### Option 3: Use GitHub Actions

Create a GitHub Action that uses Docker with a GUI environment to render the GIF:

```yaml
name: Render Demo GIF
on:
  workflow_dispatch:

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install terminalizer
        run: npm install -g terminalizer
      - name: Render GIF
        run: |
          cd demo-scripts
          xvfb-run terminalizer render stacks-demo.yml -o stacks-demo.gif
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: stacks-demo-gif
          path: demo-scripts/stacks-demo.gif
```

## Using the Demo

Once rendered, the `stacks-demo.gif` can be:

1. **Added to README.md**
   ```markdown
   ![Stacks Demo](./demo-scripts/stacks-demo.gif)
   ```

2. **Used on the website** - Upload to `packages/frontend/public/`

3. **Shared on social media** - Twitter, LinkedIn, Product Hunt

## Demo Configuration

The demo is configured in `stacks-demo.yml`:
- **Theme**: OpenConductor brand colors (#0f172a background, #3b82f6 accent)
- **Duration**: ~15 seconds total
- **Size**: 100 cols x 28 rows
- **Font**: Cascadia Code, Monaco, Consolas

## Customizing the Demo

Edit `stacks-demo.yml` to change:
- Colors (under `theme` section)
- Timing (adjust `delay` values in `records`)
- Content (modify the command output in `records`)
- Window size (`cols` and `rows`)
