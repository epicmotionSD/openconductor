'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/navigation/site-header'
import { GradientText } from '@/components/ui/gradient-text'
import { GradientButton } from '@/components/ui/gradient-button'
import { GlassCard } from '@/components/ui/glass-card'
import { 
  ArrowRight, Shield, CheckCircle, Fingerprint, 
  Scale, Building2, AlertTriangle, Terminal, Eye,
  Wallet, Loader2, ExternalLink, Check, Copy
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { ERC8004_ADDRESS, ERC8004_ABI } from '@/lib/web3'

const tiers = [
  { name: 'Basic', badge: 'OPEN', features: ['Agent ID issued', 'Public listing'], requirements: ['GitHub or npm link'], trustScore: '1-3' },
  { name: 'Verified', badge: 'VERIFIED', features: ['Verified badge', 'API access'], requirements: ['Code review', 'Security scan'], trustScore: '4-7' },
  { name: 'Certified', badge: 'CERTIFIED', features: ['Insurance eligible', 'SLA tracking'], requirements: ['ISO 42001', 'Audit trail'], trustScore: '8-10' }
]

function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const isWrongNetwork = isConnected && chainId !== baseSepolia.id

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {isWrongNetwork ? (
          <Button variant="destructive" size="sm" onClick={() => switchChain({ chainId: baseSepolia.id })}>
            <AlertTriangle className="h-4 w-4 mr-2" />Switch to Base Sepolia
          </Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 bg-success/10 border-success/30">
            <div className="h-2 w-2 rounded-full bg-success mr-2" />{address?.slice(0, 6)}...{address?.slice(-4)}
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>Disconnect</Button>
      </div>
    )
  }
  return (
    <GradientButton onClick={() => connect({ connector: connectors[0] })} disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
      Connect Wallet
    </GradientButton>
  )
}

function RegistrationForm() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({ agentName: '', sourceUrl: '', description: '', maintainerEmail: '', category: '' })
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const isWrongNetwork = chainId !== baseSepolia.id

  const createMetadataURI = () => {
    const metadata = { name: formData.agentName, description: formData.description, source: formData.sourceUrl, maintainer: formData.maintainerEmail, category: formData.category, registeredAt: new Date().toISOString() }
    return 'data:application/json;base64,' + btoa(JSON.stringify(metadata))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agentName || !formData.sourceUrl || !formData.description) { alert('Please fill in all required fields'); return }
    writeContract({ address: ERC8004_ADDRESS[baseSepolia.id], abi: ERC8004_ABI, functionName: 'registerAgent', args: [createMetadataURI()] })
  }

  if (!isConnected) return (
    <div className="text-center py-12">
      <Wallet className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
      <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-foreground-secondary mb-6">Connect a wallet to register your agent on-chain</p>
      <WalletButton />
    </div>
  )

  if (isWrongNetwork) return (
    <div className="text-center py-12">
      <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-warning" />
      <h3 className="text-xl font-semibold mb-2">Wrong Network</h3>
      <p className="text-foreground-secondary mb-6">Please switch to Base Sepolia</p>
      <WalletButton />
    </div>
  )

  if (isSuccess) return (
    <div className="text-center py-12">
      <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-success" /></div>
      <h3 className="text-xl font-semibold mb-2">Agent Registered!</h3>
      <p className="text-foreground-secondary mb-6">Your agent is now on the ERC-8004 Registry</p>
      <div className="flex items-center justify-center gap-2 mb-6">
        <code className="px-3 py-1.5 bg-muted rounded text-sm font-mono">{hash?.slice(0, 10)}...{hash?.slice(-8)}</code>
        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(hash || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a href={'https://sepolia.basescan.org/tx/' + hash} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></a>
      </div>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => window.location.reload()}>Register Another</Button>
        <Button asChild><a href={'https://sepolia.basescan.org/tx/' + hash} target="_blank" rel="noopener noreferrer">View on Explorer <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" />Register Agent On-Chain</h3>
        <WalletButton />
      </div>
      <div><label className="block text-sm font-medium mb-2">Agent / Server Name *</label><Input placeholder="e.g., filesystem-mcp" value={formData.agentName} onChange={(e) => setFormData({ ...formData, agentName: e.target.value })} required /></div>
      <div><label className="block text-sm font-medium mb-2">Source URL *</label><Input placeholder="https://github.com/org/repo" value={formData.sourceUrl} onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })} required /><p className="text-xs text-foreground-secondary mt-1">GitHub repo or npm package</p></div>
      <div><label className="block text-sm font-medium mb-2">Description *</label><Textarea placeholder="What does this agent do?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required /></div>
      <div><label className="block text-sm font-medium mb-2">Maintainer Email</label><Input type="email" placeholder="maintainer@example.com" value={formData.maintainerEmail} onChange={(e) => setFormData({ ...formData, maintainerEmail: e.target.value })} /></div>
      <div><label className="block text-sm font-medium mb-2">Category</label><Input placeholder="e.g., filesystem, database, api" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg"><p className="text-sm text-destructive">{error.message}</p></div>}
      <div className="pt-4 border-t border-border">
        <GradientButton type="submit" className="w-full" glow disabled={isPending || isConfirming}>
          {isPending || isConfirming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isPending ? 'Confirm in Wallet...' : 'Confirming...'}</> : <><Fingerprint className="mr-2 h-4 w-4" />Register Agent (Base Sepolia)</>}
        </GradientButton>
        <p className="text-xs text-center text-foreground-secondary mt-3">Registration is free (gas only). Your agent gets an ERC-8004 token ID.</p>
      </div>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative container mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-3xl" />
          <div className="relative text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-4">
              <a href="https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-success/50 bg-success/10 hover:bg-success/20 transition-colors">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>
                <span className="text-success font-medium">Live on Base Sepolia</span><span className="font-mono text-foreground-secondary">0xf8d7...898a</span><ExternalLink className="h-3 w-3 text-foreground-secondary" />
              </a>
            </div>
            <Badge className="mb-6 px-4 py-2 text-sm bg-primary/10 border-primary/30"><Fingerprint className="h-3 w-3 mr-2 inline" />ERC-8004 Identity Standard</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-[1.1] tracking-tight">Register Your <GradientText>AI Agent</GradientText></h1>
            <p className="text-lg md:text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto leading-relaxed">Get a verifiable on-chain identity for your agent. Required for governance, compliance, and insurance eligibility.</p>
          </div>
        </section>
        <section className="container mx-auto px-4 pb-16 md:pb-24"><div className="max-w-2xl mx-auto"><GlassCard elevated className="p-8"><RegistrationForm /></GlassCard></div></section>
        <section className="container mx-auto px-4 pb-16">
          <div className="text-center mb-10"><h2 className="text-2xl md:text-3xl font-bold mb-4">Verification <GradientText>Tiers</GradientText></h2><p className="text-foreground-secondary max-w-xl mx-auto">Higher verification = higher trust scores = lower insurance premiums</p></div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <GlassCard key={tier.name} className="relative hover:border-primary/50 transition-colors">
                <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-primary/30 text-xs">{tier.badge}</Badge>
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-4"><div className="text-xs text-foreground-secondary mb-2">Trust Score</div><div className="text-2xl font-bold"><GradientText>{tier.trustScore}</GradientText></div></div>
                <div className="mb-4"><div className="text-xs text-foreground-secondary mb-2">Includes</div><ul className="space-y-1">{tier.features.map((f) => <li key={f} className="text-sm flex items-center gap-2"><CheckCircle className="h-3 w-3 text-success" />{f}</li>)}</ul></div>
                <div><div className="text-xs text-foreground-secondary mb-2">Requirements</div><ul className="space-y-1">{tier.requirements.map((r) => <li key={r} className="text-sm text-foreground-secondary flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-foreground-secondary" />{r}</li>)}</ul></div>
              </GlassCard>
            ))}
          </div>
        </section>
        <section className="container mx-auto px-4 pb-16 md:pb-24 bg-muted/20 py-16 rounded-3xl">
          <div className="text-center mb-12"><h2 className="text-2xl md:text-3xl font-bold mb-4">Why <GradientText>Register</GradientText>?</h2></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <GlassCard className="text-center"><div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4"><Eye className="h-6 w-6 text-primary" /></div><h3 className="font-semibold mb-2">Discoverability</h3><p className="text-sm text-foreground-secondary">Get listed in the registry.</p></GlassCard>
            <GlassCard className="text-center"><div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4"><Shield className="h-6 w-6 text-primary" /></div><h3 className="font-semibold mb-2">Trust Score</h3><p className="text-sm text-foreground-secondary">Build reputation over time.</p></GlassCard>
            <GlassCard className="text-center"><div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center mx-auto mb-4"><Scale className="h-6 w-6 text-success" /></div><h3 className="font-semibold mb-2">Governance Ready</h3><p className="text-sm text-foreground-secondary">Prepare for AP2 policies.</p></GlassCard>
            <GlassCard className="text-center"><div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center mx-auto mb-4"><Building2 className="h-6 w-6 text-warning" /></div><h3 className="font-semibold mb-2">Insurance Path</h3><p className="text-sm text-foreground-secondary">Become insurable.</p></GlassCard>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16"><div className="text-center max-w-2xl mx-auto"><p className="text-foreground-secondary mb-6">Already have agents in production?</p><Button variant="outline" asChild><Link href="/early-access">Apply for Early Access <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>
      </main>
      <footer className="border-t py-8 bg-muted/30"><div className="container mx-auto px-4 text-center text-sm text-muted-foreground"><p>&copy; 2024-2026 OpenConductor. Building the trust computer for AI agents.</p></div></footer>
    </div>
  )
}
