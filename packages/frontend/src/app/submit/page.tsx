'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, Github, CheckCircle, ArrowLeft } from 'lucide-react'

export default function SubmitServerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">OpenConductor</span>
            <Badge variant="secondary" className="ml-2">Enterprise Beta</Badge>
          </Link>
          <nav className="flex space-x-6">
            <Link href="/discover" className="text-sm hover:text-blue-600">Discover</Link>
            <Link href="/submit" className="text-sm text-blue-600 font-medium">Submit</Link>
            <Link href="/admin" className="text-sm hover:text-blue-600">Admin</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/discover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discovery
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold">Submit Your MCP Server</h1>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none text-sm px-3 py-1">
              Beta Feature
            </Badge>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Add your Model Context Protocol server to our exclusive beta registry.
          </p>
        </div>

        {/* Beta Notice */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-3">🎯 Enterprise Beta Submission</h3>
            <p className="text-purple-800 mb-4">
              Server submissions are currently available to our first 1000 beta users with enterprise-grade automation.
            </p>
            <ul className="space-y-2 text-purple-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Automated GitHub sync and metadata extraction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Professional review and verification process</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Real-time updates and analytics tracking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Submission Instructions */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How to Submit (Beta)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>During beta:</strong> Submit servers via our GitHub repository or Discord community. 
                  The full web submission form launches with the public platform.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Submission Methods:</h3>
                
                <div className="flex gap-4">
                  <Button asChild className="flex-1">
                    <a href="https://github.com/openconductor/openconductor/discussions" target="_blank">
                      <Github className="h-4 w-4 mr-2" />
                      Submit via GitHub
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild className="flex-1">
                    <a href="https://discord.gg/openconductor" target="_blank">
                      Submit via Discord
                    </a>
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Requirements:</h4>
                <ul className="space-y-1">
                  <li>• Valid MCP server implementation</li>
                  <li>• Clear installation instructions in README</li>
                  <li>• Open source license (preferred)</li>
                  <li>• Active maintenance and support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}