# 🔥 STRIPE SETUP GUIDE - GET THESE NOW!

Since you're logged into Stripe, please grab these items immediately:

## 📋 **Required Stripe Configuration Items**

### 1. **API Keys** (Developers → API keys)
```bash
# Get these from: https://dashboard.stripe.com/apikeys
✅ Publishable key (starts with pk_live_ or pk_test_)
✅ Secret key (starts with sk_live_ or sk_test_)
```

### 2. **Webhook Endpoint** (Developers → Webhooks)
```bash
# Add this endpoint URL:
https://api.openconductor.ai/api/v1/mcp/billing/webhooks

# Select these events:
✅ customer.subscription.created
✅ customer.subscription.updated  
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ customer.created
✅ customer.updated
```

### 3. **Webhook Secret** (After creating webhook)
```bash
# Copy the webhook signing secret (starts with whsec_)
✅ Webhook signing secret
```

### 4. **Product & Price Setup**
```bash
# Create these products in: https://dashboard.stripe.com/products

Product 1: "OpenConductor Professional"
- Monthly: $29/month (copy price ID)
- Yearly: $290/year (copy price ID)

Product 2: "OpenConductor Team"  
- Monthly: $99/month (copy price ID)
- Yearly: $990/year (copy price ID)
```

## 🚀 **Quick Setup Steps**

### Step 1: Get API Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** and **Secret key**
3. Note if you're using test or live keys

### Step 2: Create Products
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Create these products:

```
Professional Plan:
- Name: OpenConductor Professional
- Pricing: $29/month recurring
- Copy the Price ID

Team Plan:  
- Name: OpenConductor Team
- Pricing: $99/month recurring
- Copy the Price ID
```

### Step 3: Set Up Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://api.openconductor.ai/api/v1/mcp/billing/webhooks`
4. Select events listed above
5. Copy the webhook secret

## 📝 **Configuration Template**

Once you have the values, update your environment:

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs for subscription tiers
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...
```

## 🧪 **Test the Integration**

After setup, test with:
```bash
# Test billing plans endpoint
curl http://localhost:3000/api/v1/mcp/billing/plans

# Test webhook (once deployed)
curl -X POST https://api.openconductor.ai/api/v1/mcp/billing/webhooks \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**⚡ URGENT: Get these values NOW while you're in Stripe!**