#!/bin/bash

# OpenConductor Vercel Frontend Deployment Script
# Automated deployment to Vercel with domain configuration

set -e

echo "🚀 Starting OpenConductor Vercel Frontend Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
    echo "✅ Vercel CLI installed"
fi

# Login check
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Navigate to frontend directory
cd frontend

echo "📦 Setting up Vercel project..."

# Initialize Vercel project
if [ ! -f ".vercel/project.json" ]; then
    echo "Creating new Vercel project..."
    vercel --confirm
else
    echo "Using existing Vercel project..."
fi

echo "🔧 Setting environment variables..."

# Production environment variables
echo "Setting production environment variables..."

# API Configuration
vercel env add VITE_API_BASE_URL production --force
echo "Please enter your backend API URL (e.g., https://api.openconductor.ai):"
read -r API_URL
echo "$API_URL" | vercel env add VITE_API_BASE_URL production

# WebSocket URL
WEBSOCKET_URL="${API_URL/https/wss}/ws"
echo "$WEBSOCKET_URL" | vercel env add VITE_WEBSOCKET_URL production

# Supabase Configuration
echo "Please enter your Supabase URL:"
read -r SUPABASE_URL
echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production

echo "Please enter your Supabase Anon Key:"
read -r SUPABASE_ANON_KEY
echo "$SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production

# Stripe Configuration
echo "Please enter your Stripe Publishable Key:"
read -r STRIPE_PUBLISHABLE_KEY
echo "$STRIPE_PUBLISHABLE_KEY" | vercel env add VITE_STRIPE_PUBLISHABLE_KEY production

# Monitoring Configuration
echo "Please enter your Sentry DSN (optional):"
read -r SENTRY_DSN
if [ -n "$SENTRY_DSN" ]; then
    echo "$SENTRY_DSN" | vercel env add VITE_SENTRY_DSN production
fi

echo "Please enter your Google Analytics ID (optional):"
read -r GA_ID
if [ -n "$GA_ID" ]; then
    echo "$GA_ID" | vercel env add VITE_GOOGLE_ANALYTICS_ID production
fi

# Static environment variables
echo "production" | vercel env add VITE_ENVIRONMENT production
echo "OpenConductor AI Terminal" | vercel env add VITE_APP_NAME production
echo "1.0.0" | vercel env add VITE_APP_VERSION production
echo "false" | vercel env add VITE_DEBUG_MODE production
echo "true" | vercel env add VITE_TRINITY_ENABLED production

echo "🚀 Deploying to Vercel..."

# Deploy to production
vercel --prod --confirm

# Get deployment URL
DEPLOYMENT_URL=$(vercel inspect --timeout=60 | grep -o 'https://[^"]*' | head -1)

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Frontend URL: $DEPLOYMENT_URL"
    
    # Optional: Set up custom domain
    echo ""
    echo "🔗 Custom Domain Setup"
    echo "Do you want to configure a custom domain? (y/n)"
    read -r SETUP_DOMAIN
    
    if [ "$SETUP_DOMAIN" = "y" ]; then
        echo "Please enter your custom domain (e.g., app.openconductor.ai):"
        read -r CUSTOM_DOMAIN
        
        echo "Adding custom domain..."
        vercel domains add "$CUSTOM_DOMAIN" --confirm
        
        echo "✅ Custom domain added: $CUSTOM_DOMAIN"
        echo "🔧 Please configure your DNS records:"
        echo "   - Add a CNAME record pointing $CUSTOM_DOMAIN to cname.vercel-dns.com"
        echo "   - Or add an A record pointing to Vercel's IP addresses"
        echo ""
        echo "📖 DNS Configuration Guide: https://vercel.com/docs/concepts/projects/custom-domains"
    fi
else
    echo "⏳ Deployment in progress. Check Vercel dashboard for status."
fi

# Return to root directory
cd ..

echo "🎉 Vercel deployment script completed!"
echo ""
echo "Next steps:"
echo "1. Configure your custom domain DNS records"
echo "2. Test the deployed frontend"
echo "3. Set up monitoring and alerts"
echo "4. Configure automated deployments via Git"
echo ""
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
echo "🔧 Environment Variables: vercel env ls"
echo "📝 Deployment Logs: vercel logs"