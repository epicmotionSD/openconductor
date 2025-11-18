# Contributing to OpenConductor

Thank you for your interest in contributing to OpenConductor! We welcome contributions from the community.

## 🚀 Quick Start

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/openconductor.git
cd openconductor

# Install dependencies
pnpm install

# Start development
pnpm run dev
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL (or Supabase account)

### Local Development
1. **Environment Setup**
   ```bash
   cp packages/api/.env.example packages/api/.env
   # Add your database credentials
   ```

2. **Database Setup**
   ```bash
   cd packages/api
   pnpm run db:migrate  # Deploy schema
   ```

3. **Start Development Servers**
   ```bash
   pnpm run dev  # Starts API + Frontend
   ```

## 🎯 Contributing Guidelines

### Reporting Issues
- Use GitHub Issues for bugs and feature requests
- Search existing issues before creating new ones
- Provide clear reproduction steps for bugs
- Include environment details (OS, Node.js version, etc.)

### Pull Requests
1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed
4. **Test your changes**
   ```bash
   pnpm test          # Run test suite
   cd packages/cli && ./test-cli.sh  # Test CLI
   ```
5. **Submit pull request**
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for commit messages

### Adding MCP Servers
We automatically discover servers from GitHub, but you can help by:

1. **Tagging your repository**
   - Add `mcp-server` topic to your GitHub repo
   - Include clear installation instructions in README
   - Add proper package.json with keywords

2. **Manual submission (coming soon)**
   - Submit via our web interface
   - Include server details and documentation
   - Wait for community review

## 🏗️ Project Structure

```
openconductor/
├── packages/
│   ├── api/          # Backend API server
│   ├── cli/          # Command-line interface  
│   ├── frontend/     # Web interface
│   └── shared/       # Shared types and utilities
├── docs/            # Documentation
└── .github/         # GitHub workflows and templates
```

## 🧪 Testing

- **API Tests**: `cd packages/api && pnpm test`
- **CLI Tests**: `cd packages/cli && ./test-cli.sh`
- **Integration Tests**: `pnpm test:integration`

## 📝 Documentation

- Keep README.md updated
- Add JSDoc comments for public APIs
- Update CLI help text for new commands
- Include examples in documentation

## 🚀 Release Process

1. **Version bump**: Update package.json versions
2. **Changelog**: Update CHANGELOG.md
3. **Tag release**: Create GitHub release
4. **Publish**: CLI publishes automatically via GitHub Actions

## 🤝 Community

- **Discord**: [Join our community](https://discord.gg/Ya5TPWeS)
- **Discussions**: Use GitHub Discussions for questions
- **Issues**: GitHub Issues for bugs and feature requests

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

All contributors will be recognized in our README and release notes.

---

**Happy contributing!** 🎉