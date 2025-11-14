'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, Key, Plus, Copy, Eye, EyeOff, 
  Calendar, Shield, Trash2, CheckCircle, AlertTriangle 
} from 'lucide-react'

interface APIKey {
  id: string;
  name: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
    submit: boolean;
    manage: boolean;
  };
  rateLimitPerHour: number;
  active: boolean;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingKey, setCreatingKey] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState({
    read: true,
    write: false,
    admin: false,
    submit: true,
    manage: false
  })
  const [newKeyData, setNewKeyData] = useState<{apiKey: string; keyInfo: APIKey} | null>(null)

  useEffect(() => {
    fetchAPIKeys()
  }, [])

  const fetchAPIKeys = async () => {
    try {
      // Mock data for demo - in production would fetch from API
      const mockKeys: APIKey[] = [
        {
          id: '1',
          name: 'Production CLI',
          permissions: { read: true, write: true, admin: false, submit: true, manage: false },
          rateLimitPerHour: 5000,
          active: true,
          lastUsed: '2 hours ago',
          createdAt: '2024-11-01T10:00:00Z',
          expiresAt: '2025-05-01T10:00:00Z'
        },
        {
          id: '2', 
          name: 'Analytics Dashboard',
          permissions: { read: true, write: false, admin: false, submit: false, manage: false },
          rateLimitPerHour: 1000,
          active: true,
          lastUsed: '5 minutes ago',
          createdAt: '2024-10-15T14:30:00Z'
        },
        {
          id: '3',
          name: 'GitHub Automation',
          permissions: { read: true, write: true, admin: true, submit: true, manage: true },
          rateLimitPerHour: 10000,
          active: true,
          lastUsed: 'Just now',
          createdAt: '2024-11-10T09:00:00Z'
        }
      ]
      
      setApiKeys(mockKeys)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
      setLoading(false)
    }
  }

  const createAPIKey = async () => {
    if (!newKeyName.trim()) return

    setCreatingKey(true)
    try {
      // Mock API key creation
      const mockResponse = {
        apiKey: 'oc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        keyInfo: {
          id: Date.now().toString(),
          name: newKeyName,
          permissions: newKeyPermissions,
          rateLimitPerHour: 1000,
          active: true,
          createdAt: new Date().toISOString()
        }
      }

      setNewKeyData(mockResponse)
      setNewKeyName('')
      setShowCreateForm(false)
      fetchAPIKeys() // Refresh list

    } catch (error) {
      console.error('Failed to create API key:', error)
    } finally {
      setCreatingKey(false)
    }
  }

  const revokeAPIKey = async (keyId: string) => {
    try {
      // Mock revocation
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, active: false } : key
      ))
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-600">
            Manage API access for enterprise integrations and automation
          </p>
        </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* New API Key Display */}
        {newKeyData && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                API Key Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Your new API key:</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(newKeyData.apiKey)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <code className="block font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {newKeyData.apiKey}
                </code>
              </div>
              <div className="text-sm text-green-700">
                <strong>Important:</strong> Store this key securely. You won't be able to see it again.
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setNewKeyData(null)}
              >
                I've stored the key safely
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create New Key Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Key Name</label>
                <Input
                  placeholder="e.g., Production Dashboard, CI/CD Pipeline"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Permissions</label>
                <div className="space-y-2">
                  {Object.entries({
                    read: 'Read access to servers and analytics',
                    write: 'Modify server information', 
                    submit: 'Submit new servers to registry',
                    manage: 'Manage existing servers',
                    admin: 'Full administrative access'
                  }).map(([key, description]) => (
                    <label key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions[key as keyof typeof newKeyPermissions]}
                        onChange={(e) => setNewKeyPermissions(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                      />
                      <div>
                        <div className="font-medium capitalize">{key}</div>
                        <div className="text-sm text-gray-600">{description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={createAPIKey}
                  disabled={creatingKey || !newKeyName.trim()}
                >
                  {creatingKey ? 'Creating...' : 'Create API Key'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading API keys...</p>
              </CardContent>
            </Card>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                <p className="text-gray-600 mb-4">
                  Create your first API key to start using the OpenConductor API
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map(key => (
              <Card key={key.id} className={!key.active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{key.name}</h3>
                        <Badge variant={key.active ? "secondary" : "outline"}>
                          {key.active ? "Active" : "Revoked"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Rate Limit:</span>
                          <div className="font-medium">{key.rateLimitPerHour.toLocaleString()}/hour</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Used:</span>
                          <div className="font-medium">{key.lastUsed || 'Never'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <div className="font-medium">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <div className="font-medium">
                            {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">Permissions:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(key.permissions).filter(([, enabled]) => enabled).map(([perm]) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {key.active && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => revokeAPIKey(key.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* API Usage Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              API Usage Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Best Practices</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Use least privilege permissions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Set appropriate rate limits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Monitor key usage regularly
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Rotate keys every 90 days
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-700 mb-2">Security Warnings</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Never share keys in public repositories
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Use environment variables for keys
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Revoke unused or compromised keys
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    Admin permissions should be rare
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm">
                  <div className="text-gray-400">// Include your API key in the Authorization header</div>
                  <div className="mt-2">
                    <span className="text-blue-400">Authorization:</span> Bearer YOUR_API_KEY
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Usage</h4>
                <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm">
                  <div className="text-gray-400">// Fetch all servers</div>
                  <div>
                    <span className="text-yellow-400">curl</span> -H <span className="text-green-400">"Authorization: Bearer YOUR_KEY"</span> \
                  </div>
                  <div className="ml-4">
                    https://api.openconductor.ai/v1/servers
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link href="/docs/api">
                    View Full API Docs
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}