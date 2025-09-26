#!/bin/sh

# SportIntel Frontend Environment Configuration Script
# Injects runtime environment variables into React build

# Create the runtime configuration
cat > /usr/share/nginx/html/env-config.js << EOF
// SportIntel Runtime Configuration
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-http://localhost:3000}",
  REACT_APP_WS_URL: "${REACT_APP_WS_URL:-ws://localhost:3001}",
  REACT_APP_VERSION: "${REACT_APP_VERSION:-1.0.0}",
  REACT_APP_BUILD_DATE: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  REACT_APP_ENVIRONMENT: "${NODE_ENV:-production}"
};
EOF

echo "Environment configuration injected:"
cat /usr/share/nginx/html/env-config.js

# Replace environment variables in nginx config
envsubst '${REACT_APP_API_URL} ${REACT_APP_WS_URL}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf

# Start nginx
echo "Starting Nginx..."
exec nginx -g 'daemon off;'