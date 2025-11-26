<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://openconductor.ai/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://openconductor.ai/banner.svg">
    <img src="https://openconductor.ai/banner.svg" alt="OpenConductor - The npm for AI Agent Tools" width="600" />
  </picture>
</p>

<p align="center">
  Install MCP servers without the JSON hell.<br/>
  One command. 220+ tools. Works with Claude, Cursor, Cline, and more.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/v/@openconductor/cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/dw/@openconductor/cli.svg" alt="npm downloads"></a>
  <a href="https://github.com/epicmotionSD/openconductor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://openconductor.ai">Website</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="https://openconductor.ai/servers">Browse 220+ Servers</a> •
  <a href="#stacks">Stacks</a> •
  <a href="https://discord.gg/openconductor">Discord</a>
</p>

---

## See the Difference

**Before** — Edit `claude_desktop_config.json` manually:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "..." }
    }
  }
}
```

Complex. Error-prone. Manual editing.

**After** — One command:

```bash
openconductor install github
```

Done in 10 seconds.

---

## Quick Start

```bash
# Install the CLI
npm install -g @openconductor/cli

# Install your first MCP server
openconductor install github

# Or install a complete stack
openconductor stack install coder
```

---

## Stacks

Pre-configured workflows in one command. Each stack includes servers + a system prompt that turns Claude into a specialized assistant.

### Coder Stack

Build, debug, and deploy like a senior engineer.

```bash
openconductor stack install coder
```

### Writer Stack

Research, write, and publish with confidence.

```bash
openconductor stack install writer
```

### Essential Stack

Everything you need to get started.

```bash
openconductor stack install essential
```

[Browse all stacks →](https://openconductor.ai/stacks)

---

## Commands

```bash
# Discovery
openconductor search <query>        # Search 220+ servers
openconductor list                  # Browse all servers

# Installation
openconductor install <server>      # Install a single server
openconductor install github slack  # Install multiple servers
openconductor stack install <name>  # Install a complete stack

# Management
openconductor status                # Show installed servers
openconductor remove <server>       # Remove a server
openconductor update                # Update all servers
openconductor doctor                # Fix configuration issues
```

---

## Works With

| Client         | Status          |
| -------------- | --------------- |
| Claude Desktop | ✅ Full support |
| Cursor         | ✅ Full support |
| Cline          | ✅ Full support |
| Windsurf       | ✅ Full support |
| Continue       | 🔜 Coming soon  |

---

## Why OpenConductor?

|                      |   Manual Config   |   OpenConductor    |
| -------------------- | :---------------: | :----------------: |
| Edit JSON files      |    ❌ Required    |      ✅ Never      |
| Remember syntax      |   ❌ Every time   |     ✅ Handled     |
| Multi-client support | ❌ Configure each |    ✅ Automatic    |
| Discover servers     | ❌ Google around  | ✅ Built-in search |
| Pre-built workflows  |      ❌ DIY       |     ✅ Stacks      |
| Time to install      |      ~5 min       |      ~10 sec       |

---

## 220+ Servers

The largest registry of MCP servers, all verified and tested.

| Category             | Examples                                       |
| -------------------- | ---------------------------------------------- |
| **Developer Tools**  | github, gitlab, postgres, redis, docker        |
| **Productivity**     | notion, slack, linear, todoist, google-drive   |
| **Memory & RAG**     | mem0, openmemory, knowledge-graph, qdrant      |
| **Web & Browser**    | puppeteer, playwright, firecrawl, brave-search |
| **AI & LLMs**        | openai, replicate, huggingface                 |
| **Data & Analytics** | bigquery, snowflake, dbt                       |

[Browse all servers →](https://openconductor.ai/servers)

---

## Add Your Server

```bash
openconductor publish
```

Or submit a PR to add your server to the registry.

---

## Roadmap

- [x] CLI for MCP server installation
- [x] 220+ server registry
- [x] Multi-client support (Claude, Cursor, Cline)
- [x] Pre-configured Stacks with system prompts
- [ ] Server health monitoring
- [ ] Team sharing & sync
- [ ] Web dashboard
- [ ] VS Code extension

---

## Contributing

```bash
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor
npm install
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Community

- 🌐 [Website](https://openconductor.ai)
- 💬 [Discord](https://discord.gg/openconductor)
- 🐦 [Twitter/X](https://twitter.com/openconductor)
- 🐛 [Issues](https://github.com/epicmotionSD/openconductor/issues)

---

## License

MIT © [OpenConductor](https://openconductor.ai)

---

<p align="center">
  <sub>Built for developers who'd rather ship than edit JSON files.</sub>
</p>
