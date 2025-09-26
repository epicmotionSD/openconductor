# Contributing to OpenConductor

Welcome to the OpenConductor community! We're building the open-source intelligent Internal Developer Platform that bridges the Platform Engineering Chasm.

## 🎯 Our Mission

OpenConductor aims to solve the painful choice between Backstage's complexity and commercial tools' vendor lock-in by delivering **80% of the value in 20% of the time** through intelligent automation and AIOps integration.

## 🚀 Quick Start for Contributors

### 1. Set Up Development Environment
```bash
git clone https://github.com/openconductor/core.git
cd core
npm install
npm run dev:full
```

### 2. Test the Day 0/Day 1 Experience
```bash
npm run demo:day0
# Open http://localhost:3333
```

### 3. Run the Test Suite
```bash
npm test
npm run test:day0
```

## 📋 How to Contribute

### 🐛 Reporting Bugs
- Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce
- Provide environment details
- Test with the demo first: `npm run demo:day0`

### 💡 Suggesting Features
- Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the strategic value and use case
- Consider how it fits our Platform Engineering focus
- Reference competitor analysis if relevant

### 🔧 Code Contributions

#### Pull Request Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes (`npm test && npm run test:day0`)
4. **Commit** with conventional commits (`feat: add amazing feature`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

#### Code Standards
- **TypeScript**: Strict type checking required
- **Testing**: All new features must include tests
- **Documentation**: Update docs for user-facing changes
- **Performance**: Maintain <200ms API response times
- **Strategic Alignment**: Features should advance our positioning vs Backstage/commercial IDPs

### 🧪 Testing Guidelines

#### Required Tests
- **Unit Tests**: All new functions and classes
- **Integration Tests**: API endpoints and workflows
- **Day 0/Day 1 Tests**: Any changes affecting onboarding experience
- **Strategic Tests**: Validate competitive advantages

#### Test Commands
```bash
npm test                    # Unit and integration tests
npm run test:day0          # Day 0/Day 1 experience validation
npm run test:coverage      # Coverage reporting
npm run demo:day0          # Interactive testing
```

## 🏗️ Development Guidelines

### 🎯 Strategic Focus Areas

#### Priority 1: Day 0/Day 1 Experience
Any contribution that improves the 15-minute onboarding experience is high priority:
- Environment detection accuracy
- Server recommendation intelligence
- Installation reliability
- Error recovery effectiveness
- User experience polish

#### Priority 2: AIOps Differentiation
Features that strengthen our unique AIOps + IDP positioning:
- Trinity AI agent improvements
- Predictive analytics enhancements
- Intelligent monitoring capabilities
- Advisory system intelligence

#### Priority 3: Platform Engineering Features
Core IDP capabilities that compete with Backstage and commercial tools:
- Workflow engine enhancements
- Integration ecosystem expansion
- Developer productivity features
- Self-service capabilities

### 🔧 Technical Architecture

#### Key Components
- **Trinity AI System**: Oracle, Sentinel, Sage agents
- **MCP Platform**: Server registry and workflow engine
- **Installation System**: Zero-config setup and management
- **Web Interface**: Bloomberg Terminal-inspired UI

#### Code Organization
```
src/
├── core/           # Core orchestration engine
├── mcp/            # MCP platform and Day 0/Day 1 features
├── agents/         # Trinity AI agents
├── api/            # REST and WebSocket APIs
├── frontend/       # React-based web interface
└── utils/          # Shared utilities and helpers
```

### 📝 Commit Guidelines

#### Conventional Commits
Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add intelligent server recommendations
fix: resolve installation timeout issues
docs: update Trinity AI documentation
perf: optimize Day 0/Day 1 onboarding flow
```

#### Commit Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `perf`: Performance improvements
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `ci`: CI/CD configuration changes

### 🏷️ Versioning & Releases

We follow [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

#### Strategic Milestone Releases
- **v0.1.0**: Day 0/Day 1 Experience (Current)
- **v0.2.0**: Enhanced Trinity AI Integration
- **v0.3.0**: Enterprise Security & Compliance
- **v1.0.0**: Production-Ready Platform Engineering Solution

## 🏢 Commercial Open-Source Model

### Community vs Enterprise
- **Community Edition**: Full-featured, free forever
- **Enterprise Edition**: Advanced security, compliance, support

### Contributing to Enterprise Features
Enterprise features should:
- Build upon the open-source core
- Add value for large-scale deployments
- Not remove functionality from Community Edition
- Maintain open-source strategic advantages

## 🎖️ Recognition

### Contributor Levels
- **Community Member**: First contribution
- **Active Contributor**: 5+ merged PRs
- **Core Contributor**: 20+ merged PRs + ongoing involvement
- **Maintainer**: Trusted with repository access

### Recognition Programs
- Monthly contributor spotlights
- Annual community awards
- Conference speaking opportunities
- OpenConductor swag and recognition

## 🛡️ Security

### Reporting Security Issues
- **Email**: security@openconductor.ai
- **Response Time**: 24 hours for critical issues
- **Disclosure**: Coordinated disclosure process

### Security Guidelines
- No secrets in code
- Input validation required
- Security testing for all PRs
- Follow OWASP guidelines

## 📞 Getting Help

### For Contributors
- 💬 [Discord #contributors](https://discord.gg/openconductor)
- 📧 **Email**: contributors@openconductor.ai
- 📋 [GitHub Discussions](https://github.com/openconductor/core/discussions)

### For Users
- 📖 [Documentation](https://docs.openconductor.ai)
- 💬 [Discord #help](https://discord.gg/openconductor)
- 🐙 [GitHub Issues](https://github.com/openconductor/core/issues)

## 🙏 Acknowledgments

OpenConductor is built by an amazing community of contributors who believe in open-source platform engineering and the power of AIOps-driven developer experiences.

### Special Thanks
- Contributors who shaped the Day 0/Day 1 experience
- Trinity AI system designers and implementers
- MCP platform ecosystem builders
- Community members who provide feedback and testing

---

## 🌟 Join the Revolution

**Help us bridge the Platform Engineering Chasm and revolutionize developer productivity!**

Whether you're fixing bugs, adding features, improving documentation, or spreading the word, every contribution helps build the future of intelligent platform engineering.

**Together, we're conducting the future! 🎼**

---

*By contributing to OpenConductor, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) and license your contributions under the [MIT License](LICENSE).*