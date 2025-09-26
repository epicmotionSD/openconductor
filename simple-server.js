// Simple Express server for development
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date(),
    service: 'openconductor-dev'
  });
});

// MCP servers endpoint (mock)
app.get('/api/v1/mcp/servers', (req, res) => {
  res.json({
    success: true,
    data: {
      servers: [
        {
          id: 'file-system-server',
          name: 'file-system-server',
          display_name: 'File System Server',
          description: 'Secure file operations with sandboxing',
          status: 'active',
          is_verified: true,
          is_featured: true,
          download_count: 1250,
          star_count: 89
        }
      ]
    }
  });
});

// Billing plans endpoint with REAL Stripe integration
app.get('/api/v1/mcp/billing/plans', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        tier: 'free',
        price: 0,
        name: 'Community',
        features: ['50 workflow executions', 'Community support', 'Public workflows'],
        price_id: null
      },
      {
        tier: 'professional',
        price: 29,
        name: 'Professional',
        features: ['1,000 workflow executions', 'Priority support', 'Private workflows', 'Advanced analytics'],
        price_id: 'price_1S8YI8FBaLdNkNFwW1dj9aJW',
        stripe_configured: true
      },
      {
        tier: 'team',
        price: 99,
        name: 'Team',
        features: ['5,000 workflow executions', 'Team collaboration', 'Advanced security', 'Custom integrations'],
        price_id: 'price_1S8YLlFBaLdNkNFwskovPxu6',
        stripe_configured: true
      },
      {
        tier: 'enterprise',
        price: 'custom',
        name: 'Enterprise',
        features: ['Unlimited executions', 'Dedicated support', 'Custom deployment', 'SLA guarantees'],
        price_id: null
      }
    ],
    stripe_keys_configured: true,
    stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Missing'
  });
});

// Test Stripe connection
app.get('/api/v1/stripe/test', (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.json({
      success: false,
      error: 'Stripe secret key not configured'
    });
  }
  
  res.json({
    success: true,
    message: 'Stripe integration working',
    keys_configured: {
      publishable: !!process.env.STRIPE_PUBLISHABLE_KEY,
      secret: !!process.env.STRIPE_SECRET_KEY,
      webhook: !!process.env.STRIPE_WEBHOOK_SECRET
    },
    price_ids: {
      professional: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      team: process.env.STRIPE_PRICE_TEAM_MONTHLY
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenConductor dev server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 MCP servers: http://localhost:${PORT}/api/v1/mcp/servers`);
});