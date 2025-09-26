# Trinity AI Terminal - Production Deployment Guide

## Overview

Trinity AI Terminal integrates FlexaSports' Bloomberg Terminal-style design system with OpenConductor's AI agent orchestration platform, creating a professional institutional-grade interface for enterprise AI management.

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** with custom Bloomberg Terminal design tokens
- **Glassmorphism Design System** ported from FlexaSports
- **Trinity AI Components** (Oracle, Sentinel, Sage agents)

### Design Integration
- **Source**: FlexaSports Bloomberg Terminal UI/UX
- **Target**: OpenConductor Trinity AI Platform
- **Style**: Institutional-grade glassmorphism with 20px backdrop blur
- **Color Themes**: Oracle (Blue), Sentinel (Green), Sage (Purple)
- **Layout**: Three-panel Bloomberg Terminal architecture

## Quick Deploy

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- Git

### Production Deployment
```bash
# Clone and deploy
git clone <repository>
cd openconductor
./deploy.sh
```

### Development Setup
```bash
cd openconductor/frontend
npm install
npm run dev
```

## Environment Configuration

### Production (.env.production)
```bash
NODE_ENV=production
VITE_API_BASE_URL=https://api.openconductor.ai
VITE_WS_BASE_URL=wss://api.openconductor.ai
```

### Development (.env.development)
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080
```

## Docker Configuration

### Services
- **trinity-frontend**: React app with Bloomberg Terminal UI
- **trinity-backend**: AI agent orchestration API
- **postgres**: Trinity AI data persistence
- **redis**: Session management and caching
- **nginx-lb**: Load balancer and SSL termination

### Build Commands
```bash
# Build frontend image
docker build -t trinity-ai-frontend ./frontend

# Deploy full stack
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Features

### Bloomberg Terminal Integration
- **Glassmorphism Effects**: 20px backdrop blur, multi-layer transparency
- **Professional Color Schemes**: Institutional-grade blue/green/purple themes
- **Advanced Typography**: Terminal-style monospace with sophisticated hierarchy
- **Ambient Lighting**: Dynamic shadow system with glow effects
- **Interactive Elements**: Professional hover states and transitions

### Trinity AI Agents
- **Oracle**: Predictive Intelligence (Blue theme)
- **Sentinel**: Monitoring Intelligence (Green theme)  
- **Sage**: Advisory Intelligence (Purple theme)

### Real-time Features
- **WebSocket Integration**: Live agent coordination
- **Agent Switching**: Ctrl+1/2/3 keyboard shortcuts
- **Status Indicators**: Connection health and agent states
- **Performance Metrics**: System monitoring and analytics

## Monitoring

### Health Checks
- Frontend: `http://localhost/health`
- Backend: `http://localhost:8080/health`

### Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f trinity-frontend
```

## Security

### Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security enabled
- Content Security Policy configured

### SSL/TLS
Configure SSL certificates in `./ssl/` directory:
- `cert.pem`
- `key.pem`

## Performance

### Optimizations
- **Gzip Compression**: Enabled for all text assets
- **Static Caching**: 1-year cache for immutable assets
- **Code Splitting**: Vite-based dynamic imports
- **Bundle Analysis**: Production build optimization

### Metrics
- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices)
- Core Web Vitals: Optimized for Bloomberg Terminal aesthetics
- Bundle Size: <500KB gzipped

## Troubleshooting

### Common Issues

#### WebSocket Connection Failures
- Ensure backend is running on port 8080
- Check firewall settings for WebSocket traffic
- Verify proxy configuration in nginx.conf

#### Build Failures
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript compilation: `npm run type-check`
- Verify Tailwind CSS compilation: `npm run build`

#### Docker Issues
- Clean Docker cache: `docker system prune -a`
- Rebuild images: `docker-compose -f docker-compose.prod.yml build --no-cache`
- Check logs: `docker-compose logs`

## Maintenance

### Updates
```bash
# Update dependencies
npm update

# Rebuild and redeploy
./deploy.sh
```

### Backup
```bash
# Backup data volumes
docker-compose -f docker-compose.prod.yml exec postgres pg_dump trinity_ai > backup.sql
```

## Support

For issues related to:
- **Bloomberg Terminal Design**: FlexaSports integration patterns
- **Trinity AI Features**: OpenConductor agent orchestration
- **Deployment**: Docker and production configuration

---

**Built with FlexaSports Bloomberg Terminal Design System**  
**Powered by OpenConductor Trinity AI Platform**