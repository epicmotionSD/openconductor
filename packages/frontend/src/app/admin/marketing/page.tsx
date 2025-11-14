'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Megaphone, Plus, Edit, Calendar, Target, 
  Twitter, Linkedin, MessageSquare, ExternalLink,
  Copy, Send, TrendingUp
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'product-hunt' | 'twitter' | 'linkedin' | 'partnership' | 'announcement'
  status: 'draft' | 'scheduled' | 'published' | 'completed'
  title: string
  content: string
  scheduledDate?: string
  metrics?: {
    views: number
    clicks: number
    conversions: number
  }
  createdAt: string
}

interface CampaignTemplate {
  id: string
  name: string
  type: string
  template: string
  variables: string[]
}

export default function MarketingManagementPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Saturday Launch - Product Hunt',
      type: 'product-hunt',
      status: 'draft',
      title: 'OpenConductor – The npm for MCP servers',
      content: 'The npm for MCP servers. Discover and install 60+ AI agent tools in seconds...',
      scheduledDate: '2024-11-16T14:00:00Z',
      createdAt: '2024-11-13T00:00:00Z'
    },
    {
      id: '2', 
      name: 'Launch Day Twitter Thread',
      type: 'twitter',
      status: 'scheduled',
      title: '🚀 OpenConductor is LIVE!',
      content: '🧵 1/8 Today we\'re launching OpenConductor - the npm for MCP servers...',
      scheduledDate: '2024-11-16T14:00:00Z',
      metrics: { views: 0, clicks: 0, conversions: 0 },
      createdAt: '2024-11-13T00:00:00Z'
    }
  ])
  
  const [templates] = useState<CampaignTemplate[]>([
    {
      id: '1',
      name: 'Product Hunt Launch',
      type: 'product-hunt',
      template: `**Title:** {{product_name}} – {{tagline}}

**Description:**
{{description}}

**What makes us different:**
• {{feature_1}}
• {{feature_2}} 
• {{feature_3}}

**Quick Start:**
\`\`\`bash
{{install_command}}
\`\`\`

{{cta}}`,
      variables: ['product_name', 'tagline', 'description', 'feature_1', 'feature_2', 'feature_3', 'install_command', 'cta']
    },
    {
      id: '2',
      name: 'Twitter Launch Thread',
      type: 'twitter',
      template: `🚀 {{product_name}} is LIVE!

{{description}}

Key features:
→ {{feature_1}}
→ {{feature_2}}
→ {{feature_3}}

{{cta}}

#ProductHunt #LaunchWeek #{{hashtags}}`,
      variables: ['product_name', 'description', 'feature_1', 'feature_2', 'feature_3', 'cta', 'hashtags']
    },
    {
      id: '3',
      name: 'Partnership Outreach',
      type: 'partnership',
      template: `Subject: {{subject_line}}

Hi {{partner_name}},

{{introduction}}

**The Opportunity:**
{{opportunity_description}}

**What {{partner_company}} Users Get:**
→ {{benefit_1}}
→ {{benefit_2}}
→ {{benefit_3}}

**Integration Ideas:**
{{integration_ideas}}

{{closing}}

Best,
{{your_name}}`,
      variables: ['subject_line', 'partner_name', 'introduction', 'opportunity_description', 'partner_company', 'benefit_1', 'benefit_2', 'benefit_3', 'integration_ideas', 'closing', 'your_name']
    }
  ])
  
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'announcement' as Campaign['type'],
    title: '',
    content: '',
    scheduledDate: ''
  })

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'product-hunt': return <Target className="h-4 w-4" />
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      case 'partnership': return <MessageSquare className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add a toast notification here
  }

  const useTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template)
    setNewCampaign(prev => ({
      ...prev,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      type: template.type as Campaign['type'],
      content: template.template
    }))
    setShowCampaignForm(true)
  }

  const handleSaveCampaign = () => {
    const campaign: Campaign = {
      id: Date.now().toString(),
      ...newCampaign,
      status: 'draft',
      createdAt: new Date().toISOString()
    }
    
    setCampaigns(prev => [campaign, ...prev])
    setShowCampaignForm(false)
    setSelectedTemplate(null)
    setNewCampaign({
      name: '',
      type: 'announcement',
      title: '',
      content: '',
      scheduledDate: ''
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Campaign Management</h1>
          <p className="text-gray-600">Manage launch announcements, partnerships, and ecosystem messaging</p>
        </div>
        
        <Button onClick={() => setShowCampaignForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'published').length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {campaigns.filter(c => c.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {campaigns.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Templates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Campaign Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Template for {template.type} campaigns
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => useTemplate(template)}
                    className="flex-1"
                  >
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(template.template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Form */}
      {showCampaignForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {selectedTemplate ? `New Campaign from Template: ${selectedTemplate.name}` : 'Create New Campaign'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Saturday Launch - Product Hunt"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value as Campaign['type'] }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="announcement">Announcement</option>
                  <option value="product-hunt">Product Hunt</option>
                  <option value="twitter">Twitter</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="partnership">Partnership</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={newCampaign.title}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                placeholder="OpenConductor – The npm for MCP servers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                rows={12}
                value={newCampaign.content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Campaign content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Scheduled Date (optional)</label>
              <Input
                type="datetime-local"
                value={newCampaign.scheduledDate}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledDate: e.target.value }))}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSaveCampaign} className="bg-blue-600 hover:bg-blue-700">
                Save Campaign
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCampaignForm(false)
                  setSelectedTemplate(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(campaign.type)}
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      {campaign.type && (
                        <Badge variant="outline">{campaign.type}</Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{campaign.title}</p>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      <div>Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
                      {campaign.scheduledDate && (
                        <div>Scheduled: {new Date(campaign.scheduledDate).toLocaleString()}</div>
                      )}
                    </div>

                    {campaign.metrics && (
                      <div className="flex gap-6 text-sm">
                        <span>👁 {campaign.metrics.views} views</span>
                        <span>🔗 {campaign.metrics.clicks} clicks</span>
                        <span>✅ {campaign.metrics.conversions} conversions</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(campaign.content)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Send className="h-3 w-3 mr-1" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <div className="text-gray-600 mb-1">Content Preview:</div>
                  <div className="font-mono text-xs text-gray-700 truncate">
                    {campaign.content.substring(0, 200)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Launch Week Schedule */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Launch Week Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-7 gap-4">
              {[
                { day: 'Sat', date: '11/16', campaigns: ['Product Hunt Launch', 'Twitter Announce'] },
                { day: 'Sun', date: '11/17', campaigns: ['LinkedIn Post', 'Community Update'] },
                { day: 'Mon', date: '11/18', campaigns: ['Partnership Outreach', 'Integration Demo'] },
                { day: 'Tue', date: '11/19', campaigns: ['Tech Deep Dive', 'User Testimonials'] },
                { day: 'Wed', date: '11/20', campaigns: ['Metrics Share', 'Ecosystem Showcase'] },
                { day: 'Thu', date: '11/21', campaigns: ['Partnership Updates', 'Community Highlight'] },
                { day: 'Fri', date: '11/22', campaigns: ['Week Wrap-up', 'Future Roadmap'] }
              ].map((day) => (
                <div key={day.day} className="border rounded-lg p-3">
                  <div className="font-semibold text-center mb-2">{day.day} {day.date}</div>
                  <div className="space-y-1">
                    {day.campaigns.map((campaign, idx) => (
                      <div key={idx} className="text-xs bg-blue-50 p-1 rounded text-center">
                        {campaign}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}