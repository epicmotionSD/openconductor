'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/navigation/site-header'
import { Check, Github, Mail, User, Tag, MessageSquare, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SubmitServerPage() {
  const [formData, setFormData] = useState({
    repositoryUrl: '',
    submitterName: '',
    submitterEmail: '',
    submitterGithub: '',
    description: '',
    suggestedCategory: '',
    suggestedTags: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const categories = ['memory', 'filesystem', 'database', 'api', 'custom']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: formData.repositoryUrl,
          submitterName: formData.submitterName || undefined,
          submitterEmail: formData.submitterEmail || undefined,
          submitterGithub: formData.submitterGithub || undefined,
          description: formData.description || undefined,
          suggestedCategory: formData.suggestedCategory || undefined,
          suggestedTags: formData.suggestedTags
            ? formData.suggestedTags.split(',').map(t => t.trim()).filter(Boolean)
            : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
        setSubmissionId(result.data.submissionId)
      } else {
        setError(result.error?.message || 'Failed to submit server')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader variant="minimal" />

        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">Submission Received!</CardTitle>
              <CardDescription className="text-green-700">
                Thank you for contributing to the MCP ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Your repository has been queued for validation:</p>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{formData.repositoryUrl}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900">What happens next?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automated validation checks will run (package.json, npm install, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>If validation passes, your server will be automatically added as "unverified"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Our team will review and verify it within 1-2 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You'll receive an email when it's verified (if you provided one)</span>
                  </li>
                </ul>
              </div>

              {submissionId && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-900 mb-1">Submission ID:</p>
                  <p className="font-mono text-xs text-blue-700">{submissionId}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button asChild className="flex-1">
                  <a href="/discover">Browse Servers</a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({
                      repositoryUrl: '',
                      submitterName: '',
                      submitterEmail: '',
                      submitterGithub: '',
                      description: '',
                      suggestedCategory: '',
                      suggestedTags: ''
                    })
                  }}
                >
                  Submit Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="minimal" />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Submit an MCP Server</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Help grow the Model Context Protocol ecosystem
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Auto-validated and added within minutes
          </Badge>
        </div>

        <Card className="mb-8 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>GitHub repository (public)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>package.json with @modelcontextprotocol/sdk</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>npm install works successfully</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>README with installation instructions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
              <CardDescription>
                Tell us about your MCP server (only repository URL is required)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Repository URL *
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={formData.repositoryUrl}
                  onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Must be a public GitHub repository
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Description (Optional)
                </label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Briefly describe what your MCP server does..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Optional - We'll extract this from your README if not provided
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category (Optional)</label>
                <select
                  value={formData.suggestedCategory}
                  onChange={(e) => handleInputChange('suggestedCategory', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Auto-detect from repository</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="ai, api, automation (comma-separated)"
                  value={formData.suggestedTags}
                  onChange={(e) => handleInputChange('suggestedTags', e.target.value)}
                />
              </div>

              <hr className="my-6" />

              <div>
                <h3 className="text-sm font-medium mb-4">Your Information (Optional)</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.submitterName}
                      onChange={(e) => handleInputChange('submitterName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.submitterEmail}
                      onChange={(e) => handleInputChange('submitterEmail', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll notify you when your submission is reviewed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub Username
                    </label>
                    <Input
                      type="text"
                      placeholder="yourusername"
                      value={formData.submitterGithub}
                      onChange={(e) => handleInputChange('submitterGithub', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Submission Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || !formData.repositoryUrl}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Github className="mr-2 h-4 w-4" />
                      Submit Server
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By submitting, you confirm that you have the right to share this repository
                and that it complies with our terms of service.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
