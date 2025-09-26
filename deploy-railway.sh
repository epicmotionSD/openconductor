#!/bin/bash

# OpenConductor Railway Deployment Script
# Automated deployment to Railway with environment setup

set -e

echo "🚀 Starting OpenConductor Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
    echo "✅ Railway CLI installed"
fi

# Login check
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

# Create or connect to Railway project
echo "📦 Setting up Railway project..."
if [ ! -f ".railway" ]; then
    echo "Creating new Railway project..."
    railway init openconductor-api
else
    echo "Using existing Railway project..."
fi

# Set environment variables
echo "🔧 Setting environment variables..."

# Core application settings
railway env set NODE_ENV=production
railway env set APP_NAME=OpenConductor
railway env set APP_VERSION=2.1.0
railway env set PORT=3000
railway env set HOST=0.0.0.0

# Database (Supabase)
echo "📄 Setting database environment variables..."
echo "Please set your Supabase credentials manually:"
echo "railway env set DATABASE_URL=<your-supabase-db-url>"
echo "railway env set SUPABASE_URL=<your-supabase-url>"
echo "railway env set SUPABASE_ANON_KEY=<your-supabase-anon-key>"
echo "railway env set SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>"

# Authentication
echo "🔐 Setting authentication environment variables..."
echo "Please set your auth secrets manually:"
echo "railway env set NEXTAUTH_SECRET=<generate-32-char-secret>"
echo "railway env set JWT_SECRET=<generate-32-char-jwt-secret>"
echo "railway env set GOOGLE_CLIENT_ID=<your-google-oauth-client-id>"
echo "railway env set GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>"

# Stripe
echo "💳 Setting Stripe environment variables..."
echo "Please set your Stripe keys manually:"
echo "railway env set STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>"
echo "railway env set STRIPE_SECRET_KEY=<your-stripe-secret-key>"
echo "railway env set STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>"

# OpenAI
echo "🤖 Setting OpenAI environment variables..."
echo "Please set your OpenAI API key manually:"
echo "railway env set OPENAI_API_KEY=<your-openai-api-key>"

# Redis
echo "📡 Setting Redis environment variables..."
echo "Please set your Redis credentials manually:"
echo "railway env set REDIS_URL=<your-redis-url>"

# Monitoring
echo "📊 Setting monitoring environment variables..."
echo "Please set your Sentry DSN manually:"
echo "railway env set SENTRY_DSN=<your-sentry-dsn>"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway deploy

# Generate Railway deployment URL
echo "🌍 Getting deployment URL..."
RAILWAY_URL=$(railway status --json | jq -r '.deploymentDomain // "pending"')

if [ "$RAILWAY_URL" != "pending" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Backend URL: https://$RAILWAY_URL"
    echo "🏥 Health Check: https://$RAILWAY_URL/health"
    echo "📚 API Docs: https://$RAILWAY_URL/docs"
else
    echo "⏳ Deployment in progress. Check Railway dashboard for status."
fi

echo "🎉 Railway deployment script completed!"
echo ""
echo "Next steps:"
echo "1. Set the missing environment variables in Railway dashboard"
echo "2. Update your frontend to use the new backend URL"
echo "3. Configure your custom domain (if needed)"
echo "4. Test the deployment endpoints"