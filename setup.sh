#!/bin/bash

echo "🚀 Setting up OpenConductor..."

# Check if pnpm is available
if command -v pnpm &> /dev/null; then
    echo "📦 Using pnpm for workspace management..."
    
    # Create pnpm workspace file if it doesn't exist
    if [ ! -f "pnpm-workspace.yaml" ]; then
        echo "🔧 Creating pnpm workspace configuration..."
        echo "packages:" > pnpm-workspace.yaml
        echo "  - 'packages/*'" >> pnpm-workspace.yaml
    fi
    
    # Install all dependencies with pnpm workspace
    echo "📦 Installing dependencies with pnpm..."
    pnpm install
    
    # Build shared package
    echo "🔨 Building shared types..."
    pnpm --filter @openconductor/shared run build
    
    # Initialize database
    echo "🗄️ Setting up database..."
    pnpm --filter @openconductor/api run db:migrate
    pnpm --filter @openconductor/api run db:seed
    
else
    echo "📦 Using npm for package management..."
    
    # Install root dependencies
    echo "📦 Installing root dependencies..."
    npm install
    
    # Install package dependencies
    echo "📦 Installing shared package dependencies..."
    cd packages/shared && npm install && cd ../..
    
    echo "📦 Installing API dependencies..."
    cd packages/api && npm install && cd ../..
    
    echo "📦 Installing frontend dependencies..."
    cd packages/frontend && npm install && cd ../..
    
    echo "📦 Installing CLI dependencies..."
    cd packages/cli && npm install && cd ../..
    
    # Build shared package first
    echo "🔨 Building shared types..."
    cd packages/shared && npm run build && cd ../..
    
    # Initialize database
    echo "🗄️ Setting up database..."
    cd packages/api
    npm run db:migrate
    npm run db:seed
    cd ../..
fi

echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start:"
if command -v pnpm &> /dev/null; then
    echo "pnpm dev                               # Start development servers"
    echo "pnpm --filter @openconductor/cli run dev discover  # Test CLI"
else
    echo "npm run dev                            # Start development servers"
    echo "cd packages/cli && npm run dev discover  # Test CLI"
fi
echo ""
echo "📖 Documentation:"
echo "README.md         # Project overview"
echo "DEPLOYMENT.md     # Deployment guide"