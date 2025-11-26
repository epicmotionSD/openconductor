# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within OpenConductor, please follow these steps:

### 1. Do NOT Open a Public Issue

Security vulnerabilities should **never** be reported via public GitHub issues. This puts all users at risk.

### 2. Report Privately

Please send your findings to:

**security@openconductor.ai**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. What to Expect

- **Response time**: We aim to acknowledge receipt within 48 hours
- **Updates**: We'll keep you informed about the progress of the fix
- **Credit**: We'll credit you in the security advisory (unless you prefer anonymity)

## What We Consider Security Issues

Examples of security vulnerabilities we want to know about:

### Critical
- Remote code execution
- SQL injection
- Command injection
- Authentication bypass
- Privilege escalation
- Path traversal allowing file system access

### High Priority
- Malicious server submissions to registry
- API key or credential exposure
- Dependency vulnerabilities (high/critical severity)
- XSS vulnerabilities in web interface

### Medium Priority
- Information disclosure
- Denial of service vulnerabilities
- Session management issues

## What's NOT a Security Issue

The following are not considered security vulnerabilities:

- Missing best practices (unless they create actual vulnerability)
- Issues requiring physical access to a user's device
- Self-XSS (requiring user to paste malicious code)
- Reports from automated scanners without proof of exploitability
- Issues in dependencies we don't control (report to the dependency maintainers)

## Security Best Practices for Users

When using OpenConductor:

1. **API Keys**: Never commit API keys to public repositories
2. **Environment Variables**: Use `.env` files and keep them out of version control
3. **Server Sources**: Only install MCP servers from trusted sources
4. **Updates**: Keep OpenConductor CLI updated to the latest version
5. **Review Configs**: Inspect `claude_desktop_config.json` before use

## Security Measures We Take

- **Input validation**: All user inputs are validated and sanitized
- **Dependency scanning**: Automated checks for vulnerable dependencies
- **Code review**: All code changes reviewed before merge
- **HTTPS only**: All API communication over HTTPS
- **No credential storage**: API keys stored locally, never sent to our servers

## Disclosure Policy

When we receive a security report:

1. **Confirm** the issue and determine affected versions
2. **Prepare** a fix for all supported versions
3. **Release** patched versions
4. **Publish** a security advisory on GitHub
5. **Credit** the reporter (if they wish)

## Security Updates

Security updates are released as:
- **Patch versions** (e.g., 1.2.3 → 1.2.4) for minor vulnerabilities
- **Minor versions** (e.g., 1.2.x → 1.3.0) for moderate vulnerabilities
- **Immediate hotfix** for critical vulnerabilities

We recommend:
- Enable GitHub notifications for releases
- Subscribe to our security advisories
- Update regularly with `npm install -g @openconductor/cli@latest`

## Contact

- **Security Email**: security@openconductor.ai
- **GPG Key**: Available on request
- **Response Time**: Within 48 hours

## Recognition

We appreciate the security research community and will publicly acknowledge researchers who report valid vulnerabilities (unless they prefer to remain anonymous).

Hall of Fame:
- (None yet - be the first!)

---

Thank you for helping keep OpenConductor and our users safe!
