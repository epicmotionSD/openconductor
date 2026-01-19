'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Sparkles, Zap, Check, Loader2 } from 'lucide-react'

interface UpgradeCardProps {
  serverId: string
  serverSlug: string
  currentTier?: string
}

const TIERS = {
  PRO_SERVER: {
    name: 'Pro',
    price: 29,
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    popular: false,
    features: [
      'Verified badge on listing',
      'Priority in category results',
      'Basic install analytics',
    ],
  },
  FEATURED_SERVER: {
    name: 'Featured',
    price: 99,
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    popular: true,
    features: [
      'Everything in Pro',
      'Top placement in search',
      'Homepage spotlight',
      'Full analytics dashboard',
      'Priority support',
    ],
  },
}

export function UpgradeCard({ serverId, serverSlug, currentTier = 'free' }: UpgradeCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (tier: string) => {
    setLoading(tier)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
      const response = await fetch(`${apiUrl}/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          serverId,
          serverSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  // Don't show if already on highest tier
  if (currentTier === 'FEATURED_SERVER') {
    return (
      <GlassCard>
        <div className="text-center py-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured Server
          </Badge>
          <p className="text-sm text-foreground-secondary mt-2">
            Maximum visibility active
          </p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-400" />
        Boost Visibility
      </h3>
      
      <p className="text-sm text-foreground-secondary mb-4">
        Get more installs with premium placement
      </p>

      {error && (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(TIERS).map(([key, tier]) => {
          const Icon = tier.icon
          const isCurrentTier = currentTier === key
          const isDisabled = isCurrentTier || (currentTier === 'PRO_SERVER' && key === 'PRO_SERVER')
          
          return (
            <div
              key={key}
              className={`relative p-4 rounded-lg border ${tier.borderColor} ${tier.bgColor} transition-all hover:scale-[1.02]`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs">
                  Popular
                </Badge>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${tier.color}`} />
                  <span className="font-semibold text-foreground">{tier.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">${tier.price}</span>
                  <span className="text-sm text-foreground-secondary">/mo</span>
                </div>
              </div>

              <ul className="space-y-1 mb-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Check className={`h-3 w-3 ${tier.color}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${key === 'FEATURED_SERVER' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}`}
                variant={key === 'FEATURED_SERVER' ? 'default' : 'outline'}
                disabled={isDisabled || loading !== null}
                onClick={() => handleUpgrade(key)}
              >
                {loading === key ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentTier ? (
                  'Current Plan'
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </Button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-foreground-secondary text-center mt-4">
        Cancel anytime. Secure payment via Stripe.
      </p>
    </GlassCard>
  )
}
