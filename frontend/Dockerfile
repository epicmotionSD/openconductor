# OpenConductor AI Terminal - Production Dockerfile
# Multi-stage build for optimized production deployment

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S openconductor && \
    adduser -S openconductor -u 1001

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set ownership
RUN chown -R openconductor:openconductor /usr/share/nginx/html && \
    chown -R openconductor:openconductor /var/cache/nginx && \
    chown -R openconductor:openconductor /var/log/nginx && \
    chown -R openconductor:openconductor /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R openconductor:openconductor /var/run/nginx.pid

# Switch to non-root user
USER openconductor

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Metadata
LABEL maintainer="OpenConductor Team"
LABEL version="2.1.0"
LABEL description="OpenConductor AI Terminal - Enterprise AIOps Platform"