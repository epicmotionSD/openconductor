<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/banner-light.svg">
    <img src="assets/brand/banner-light.svg" alt="OpenConductor - The npm for AI Agent Tools" width="600" />
  </picture>
</p>

<p align="center">
  Install MCP servers without the JSON hell.<br/>
  One command. 180+ tools. Works with Claude, Cursor, Cline, and more.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/v/@openconductor/cli.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@openconductor/cli"><img src="https://img.shields.io/npm/dw/@openconductor/cli.svg" alt="npm downloads"></a>
  <a href="https://github.com/epicmotionSD/openconductor/stargazers"><img src="https://img.shields.io/github/stars/epicmotionSD/openconductor.svg" alt="GitHub stars"></a>
  <a href="https://github.com/epicmotionSD/openconductor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://openconductor.ai">Website</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="https://openconductor.ai/discover">Browse 180+ Servers</a> •
  <a href="https://openconductor.ai/stacks">Stacks</a> •
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
openconductor install github-mcp
```

Done in 10 seconds.

---

## Quick Start

```bash
# Install the CLI
npm install -g @openconductor/cli

# Install your first MCP server
openconductor install github-mcp

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
openconductor discover [query]      # Search 180+ servers

# Installation
openconductor install <server>      # Install a single server
openconductor stack install <name>  # Install a complete stack

# Management
openconductor list                  # Show installed servers
openconductor remove <server>       # Remove a server
openconductor update                # Update all servers
openconductor init                  # Initialize config
openconductor badge <server>        # Generate install badge
openconductor achievements          # View achievements
openconductor analytics             # Analytics preferences
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

## 180+ Servers

The largest registry of MCP servers, all verified and tested.

| Category             | Examples                                       |
| -------------------- | ---------------------------------------------- |
| **Developer Tools**  | github, gitlab, postgres, redis, docker        |
| **Productivity**     | notion, slack, linear, todoist, google-drive   |
| **Memory & RAG**     | mcp-memory, mem0, knowledge-graph, qdrant      |
| **Web & Browser**    | puppeteer, playwright, firecrawl, brave-search |
| **AI & LLMs**        | openai, replicate, huggingface                 |
| **Data & Analytics** | bigquery, snowflake, dbt                       |

[Browse all servers →](https://openconductor.ai/discover)

---

## Add Your Server

Submit a PR to add your server to the registry.

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

## Resources

- ⭐ [Awesome MCP](https://github.com/epicmotionSD/awesome-mcp) - Curated list of 220+ MCP servers, tools, and resources
- 📖 [MCP Specification](https://spec.modelcontextprotocol.io/) - Official Model Context Protocol docs
- 📚 [OpenConductor Guides](https://openconductor.ai/docs) - Tutorials and integration guides
- 🎓 [MCP Quickstart](https://modelcontextprotocol.io/quickstart) - Get started in 5 minutes

---

## License

MIT © [OpenConductor](https://openconductor.ai)

---

<p align="center">
  <sub>Built for developers who'd rather ship than edit JSON files.</sub>
</p>
