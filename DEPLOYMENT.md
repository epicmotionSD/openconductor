# Deployment Guide

This guide covers deploying OpenConductor to production environments.

## Quick Deploy

### Frontend (Vercel)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git remote add origin https://github.com/yourusername/openconductor.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Select `packages/frontend` as root directory
   - Deploy automatically

### API (Railway/Render/Vercel)

1. **Railway Deploy**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   cd packages/api
   railway login
   railway init
   railway up
   ```

2. **Environment Variables**
   Set these in your deployment platform:
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://openconductor.ai
   DB_PATH=/data/openconductor.db
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/openconductor.git
   cd openconductor
   npm install
   ```

2. **Build Packages**
   ```bash
   # Build shared types
   npm run build -w @openconductor/shared
   
   # Build API
   npm run build -w @openconductor/api
   
   # Build CLI
   npm run build -w @openconductor/cli
   ```

3. **Initialize Database**
   ```bash
   cd packages/api
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   
   # Or start individually
   npm run dev -w @openconductor/frontend  # http://localhost:3000
   npm run dev -w @openconductor/api       # http://localhost:3001
   ```

5. **Test CLI Locally**
   ```bash
   cd packages/cli
   npm run dev discover
   npm run dev install openmemory --dry-run
   ```

## Production Configuration

### Environment Variables

#### Frontend
- `NEXT_PUBLIC_API_URL`: API base URL
- `VERCEL_URL`: Automatically set by Vercel

#### API
- `NODE_ENV`: Set to "production"
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL for CORS
- `DB_PATH`: SQLite database file path

### Database

For production, consider:
- **SQLite**: Simple, file-based (default)
- **PostgreSQL**: For high-traffic scenarios
- **Backup Strategy**: Regular database backups

### Monitoring

Set up monitoring for:
- API health (`GET /health`)
- Database connectivity
- Error tracking (Sentry recommended)
- Performance metrics

## Scaling Considerations

### Horizontal Scaling
- API can be scaled horizontally
- Use PostgreSQL for shared state
- Redis for session storage

### CDN
- Use Vercel Edge Network
- Or configure CloudFlare for custom domains

### Rate Limiting
- Implement rate limiting in production
- Use Redis for distributed rate limiting

## Security

### API Security
- Validate all inputs
- Rate limit endpoints
- Use HTTPS in production
- Sanitize user-generated content

### CLI Security
- Validate MCP server configurations
- Sandbox file operations
- Secure credential storage

## Backup Strategy

### Database Backup
```bash
# SQLite backup
cp data/openconductor.db data/backup/openconductor-$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump openconductor > backup.sql
```

### Configuration Backup
- Version control all configuration
- Backup environment variables
- Document deployment processes

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clean and rebuild
   rm -rf node_modules dist .next
   npm install
   npm run build
   ```

2. **Database Issues**
   ```bash
   # Reset database
   cd packages/api
   rm data/openconductor.db
   npm run db:migrate
   npm run db:seed
   ```

3. **CORS Errors**
   - Check CORS_ORIGIN environment variable
   - Verify frontend URL matches

### Logs

- Frontend: Vercel dashboard
- API: Platform-specific logs
- CLI: Local terminal output

## Performance Optimization

### Frontend
- Enable Next.js optimizations
- Use Image optimization
- Implement caching strategies

### API
- Database indexing
- Query optimization
- Response caching

### CLI
- Minimize API calls
- Cache server data locally
- Optimize file operations