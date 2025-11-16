'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function RoadmapPage() {
  const [activePhase, setActivePhase] = useState('november')

  const roadmapPhases = {
    november: {
      title: "November 2024 - Ecosystem Launch",
      status: "active",
      goals: [
        { task: "Launch with ecosystem positioning", status: "completed", date: "Nov 16" },
        { task: "Product Hunt #1 Product of Day", status: "pending", date: "Nov 16" },
        { task: "Partnership outreach (Vercel, Supabase)", status: "pending", date: "Nov 18-20" },
        { task: "Track ecosystem referral metrics", status: "in-progress", date: "Ongoing" },
        { task: "Integration guide completion", status: "in-progress", date: "Nov 20" }
      ],
      kpis: [
        { metric: "CLI Installs", target: "1,000", current: "247" },
        { metric: "Ecosystem Referrals", target: "20%", current: "8%" },
        { metric: "Partnership Responses", target: "1", current: "0" },
        { metric: "Developer Testimonials", target: "10", current: "3" }
      ]
    },
    december: {
      title: "December 2024 - Platform Integration", 
      status: "planned",
      goals: [
        { task: "First partnership integration live", status: "planned", date: "Dec 15" },
        { task: "Stack Starter template (Vercel + OpenConductor)", status: "planned", date: "Dec 10" },
        { task: "CLI integration profiles (--stack vercel)", status: "planned", date: "Dec 20" },
        { task: "Enterprise case study #1", status: "planned", date: "Dec 30" }
      ],
      kpis: [
        { metric: "Partnership Integrations", target: "1", current: "0" },
        { metric: "Stack Template Usage", target: "100", current: "0" },
        { metric: "Enterprise Inquiries", target: "5", current: "0" }
      ]
    },
    january: {
      title: "January 2025 - Enterprise & Funding",
      status: "planned", 
      goals: [
        { task: "Enterprise case study with metrics", status: "planned", date: "Jan 15" },
        { task: "Second partnership live (v0 or BaseHub)", status: "planned", date: "Jan 20" },
        { task: "Funding conversations with ecosystem data", status: "planned", date: "Jan 30" },
        { task: "Advanced orchestration features launch", status: "planned", date: "Jan 31" }
      ],
      kpis: [
        { metric: "Enterprise Revenue", target: "$5,000 MRR", current: "$0" },
        { metric: "Partnership Integrations", target: "2", current: "0" },
        { metric: "Developer Ecosystem Adoption", target: "40%", current: "8%" }
      ]
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ecosystem Roadmap Dashboard</h1>
        <p className="text-gray-600">
          Track the 3-month progression from launch to ecosystem platform
        </p>
      </div>

      {/* Phase Navigation */}
      <div className="flex gap-4 mb-8">
        {Object.entries(roadmapPhases).map(([phase, data]) => (
          <Button
            key={phase}
            variant={activePhase === phase ? "default" : "outline"}
            onClick={() => setActivePhase(phase)}
            className="capitalize"
          >
            {phase} 2024-25
            <Badge 
              variant="secondary" 
              className={`ml-2 ${
                data.status === 'active' ? 'bg-green-100 text-green-800' :
                data.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-600'
              }`}
            >
              {data.status}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Active Phase Details */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Goals & Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>
              {roadmapPhases[activePhase as keyof typeof roadmapPhases].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roadmapPhases[activePhase as keyof typeof roadmapPhases].goals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{goal.task}</div>
                    <div className="text-sm text-gray-500">{goal.date}</div>
                  </div>
                  <Badge
                    variant={
                      goal.status === 'completed' ? 'default' :
                      goal.status === 'in-progress' ? 'secondary' :
                      'outline'
                    }
                  >
                    {goal.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roadmapPhases[activePhase as keyof typeof roadmapPhases].kpis.map((kpi, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{kpi.metric}</span>
                    <span className="text-sm text-gray-500">
                      {kpi.current} / {kpi.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{
                        width: `${Math.min(
                          (parseInt(kpi.current.replace(/[^0-9]/g, '')) / 
                           parseInt(kpi.target.replace(/[^0-9]/g, ''))) * 100, 
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ecosystem Metrics Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Ecosystem Integration Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">15%</div>
              <div className="text-sm text-gray-600">Vercel Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">23%</div>
              <div className="text-sm text-gray-600">Supabase Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">8%</div>
              <div className="text-sm text-gray-600">v0 Builders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">4%</div>
              <div className="text-sm text-gray-600">BaseHub Teams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Notes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Strategic Positioning Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Current Position</h4>
              <p className="text-sm text-gray-600">
                "The npm for MCP servers" - Functional, clear, tactical discovery
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-purple-700">Ecosystem Evolution</h4>
              <p className="text-sm text-gray-600">
                "Deploy agents alongside components" - Platform integration with modern stacks
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-700">Enterprise Target</h4>
              <p className="text-sm text-gray-600">
                "The orchestration infrastructure layer for AI teams" - Enterprise platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}