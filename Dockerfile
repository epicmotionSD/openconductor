# OpenConductor Platform Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code first
COPY src/ ./src/

# Install all dependencies (skip prepare script to avoid build errors)
RUN npm ci --ignore-scripts && npm cache clean --force

# Install ts-node and typescript globally for runtime compilation
RUN npm install -g ts-node typescript && echo "TypeScript runtime compilation enabled"

# Production stage
FROM node:18-alpine AS production

# Install dumb-init and ts-node for proper signal handling and TypeScript runtime
RUN apk add --no-cache dumb-init curl && \
    npm install -g ts-node typescript

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S openconductor -u 1001

WORKDIR /app

# Copy package files and install dependencies
COPY --from=builder --chown=openconductor:nodejs /app/package*.json ./
COPY --from=builder --chown=openconductor:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=openconductor:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=openconductor:nodejs /app/src ./src

# Create necessary directories
RUN mkdir -p logs data && \
    chown -R openconductor:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER openconductor

# Expose ports
EXPOSE 3000 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application using ts-node for runtime TypeScript compilation
CMD ["npx", "ts-node", "--transpile-only", "src/server.ts"]