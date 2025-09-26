# SportIntel ML Pipeline Dockerfile
# Python + Node.js environment for SHAP/LIME and ML models

# Base image with both Python and Node.js
FROM nikolaik/python-nodejs:python3.11-nodejs18-alpine AS base

WORKDIR /app

# Install system dependencies for ML libraries
RUN apk add --no-cache \
    build-base \
    gfortran \
    openblas-dev \
    lapack-dev \
    freetype-dev \
    libpng-dev \
    curl \
    dumb-init

# Install Python ML dependencies
COPY requirements.ml.txt ./
RUN pip install --no-cache-dir -r requirements.ml.txt

# Install Node.js dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Install TypeScript globally
RUN npm install -g ts-node typescript

# Copy source code
COPY src/ ./src/
COPY ml-models/ ./ml-models/

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mlpipeline -u 1001

# Create necessary directories
RUN mkdir -p logs cache models && \
    chown -R mlpipeline:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user
USER mlpipeline

# Expose port
EXPOSE 8000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the ML pipeline server
CMD ["npx", "ts-node", "--transpile-only", "src/mcp/sportintel/ml-pipeline-server.ts"]