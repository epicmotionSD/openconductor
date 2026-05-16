'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Layout, FileText, Image, BookOpen, GitCompare,
  ShoppingBag, MapPin, Mail, Star, Link2,
  Rocket, ChevronDown, Check
} from 'lucide-react'

type TemplateId = 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08' | 'T09' | 'T10'

interface Template {
  id: TemplateId
  name: string
  purpose: string
  intent: 'transactional' | 'informational' | 'commercial' | 'navigational'
  icon: typeof Layout
  deployCount: number
  avgConversionRate: number
}

const templates: Template[] = [
  {
    id: 'T01',
    name: 'The Converter',
    purpose: 'High-intent PPC landing',
    intent: 'transactional',
    icon: Layout,
    deployCount: 24,
    avgConversionRate: 8.5
  },
  {
    id: 'T02',
    name: 'The Booking Portal',
    purpose: 'Appointment scheduling',
    intent: 'transactional',
    icon: FileText,
    deployCount: 18,
    avgConversionRate: 12.3
  },
  {
    id: 'T03',
    name: 'The Visual Gallery',
    purpose: 'Portfolio showcase',
    intent: 'commercial',
    icon: Image,
    deployCount: 15,
    avgConversionRate: 4.2
  },
  {
    id: 'T04',
    name: 'The Educational Hub',
    purpose: 'SEO blog posts',
    intent: 'informational',
    icon: BookOpen,
    deployCount: 32,
    avgConversionRate: 2.1
  },
  {
    id: 'T05',
    name: 'The Comparison Guide',
    purpose: 'Decision support',
    intent: 'commercial',
    icon: GitCompare,
    deployCount: 8,
    avgConversionRate: 6.8
  },
  {
    id: 'T06',
    name: 'The Product Drop',
    purpose: 'E-commerce product',
    intent: 'transactional',
    icon: ShoppingBag,
    deployCount: 12,
    avgConversionRate: 5.4
  },
  {
    id: 'T07',
    name: 'The Local Geo-Page',
    purpose: 'Local SEO',
    intent: 'transactional',
    icon: MapPin,
    deployCount: 45,
    avgConversionRate: 9.2
  },
  {
    id: 'T08',
    name: 'The Lead Magnet',
    purpose: 'Email capture',
    intent: 'informational',
    icon: Mail,
    deployCount: 10,
    avgConversionRate: 15.6
  },
  {
    id: 'T09',
    name: 'The Review Wall',
    purpose: 'Social proof',
    intent: 'commercial',
    icon: Star,
    deployCount: 6,
    avgConversionRate: 3.8
  },
  {
    id: 'T10',
    name: 'The Link-in-Bio',
    purpose: 'Social traffic',
    intent: 'navigational',
    icon: Link2,
    deployCount: 4,
    avgConversionRate: 22.1
  }
]

const intentColors = {
  transactional: 'bg-green-500/10 text-green-500 border-green-500/20',
  informational: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  commercial: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  navigational: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
}

export function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleTemplates = isExpanded ? templates : templates.slice(0, 4)
  const selected = templates.find(t => t.id === selectedTemplate)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Quick Deploy
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a template to deploy a new landing page
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleTemplates.map((template) => {
            const TemplateIcon = template.icon
            const isSelected = selectedTemplate === template.id

            return (
              <div
                key={template.id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                  }
                `}
                onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded flex items-center justify-center
                      ${isSelected ? 'bg-primary/10' : 'bg-muted'}
                    `}>
                      <TemplateIcon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{template.name}</span>
                        <Badge variant="outline" className={`text-xs ${intentColors[template.intent]}`}>
                          {template.intent}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {template.avgConversionRate}% conv
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isExpanded && (
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setIsExpanded(true)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Show all templates
          </Button>
        )}

        {selectedTemplate && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Target Keyword</label>
                <input
                  type="text"
                  placeholder="e.g., sisterlocks houston"
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Target Location</label>
                <input
                  type="text"
                  placeholder="e.g., Houston, TX"
                  className="mt-1 w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
              </div>
              <Button className="w-full bg-primary">
                <Rocket className="h-4 w-4 mr-2" />
                Deploy {selected?.name}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
