'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Terminal, BarChart3, Database, Megaphone, Calendar, Key, LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    // Check for admin key on client side only
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('admin-api-key')
      if (key && key.startsWith('oc_admin_')) {
        setIsAuthenticated(true)
        setAdminKey(key.substring(0, 20) + '...')
      }
    }
  }, [])

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Servers', href: '/admin/servers', icon: Database },
    { name: 'Marketing', href: '/admin/marketing', icon: Megaphone },
    { name: 'Roadmap', href: '/admin/roadmap', icon: Calendar },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'API Keys', href: '/admin/api-keys', icon: Key }
  ]

  const handleSetApiKey = () => {
    const key = prompt('Enter your admin API key:')
    if (key && key.startsWith('oc_admin_')) {
      localStorage.setItem('admin-api-key', key)
      setIsAuthenticated(true)
      setAdminKey(key.substring(0, 20) + '...')
      window.location.reload()
    } else {
      alert('Invalid admin API key format')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-api-key')
    setIsAuthenticated(false)
    setAdminKey('')
    window.location.href = '/'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Terminal className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">OpenConductor Admin</h1>
            <p className="text-gray-600 mb-6">
              Enter your admin API key to access the management interface
            </p>
            
            <div className="space-y-4">
              <Button onClick={handleSetApiKey} className="w-full bg-blue-600 hover:bg-blue-700">
                <Key className="mr-2 h-4 w-4" />
                Enter Admin Key
              </Button>
              
              <div className="text-sm text-gray-500">
                <p>Need your API key?</p>
                <code className="bg-gray-100 px-2 py-1 rounded mt-1 block text-xs">
                  oc_admin_78736a4a7469d09858a283a024a4de4a9f07025cb350a2282127a1412876acf2
                </code>
              </div>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Back to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Terminal className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg">OpenConductor</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Admin
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              API: :3002 • Frontend: :3001
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">View Site</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-3 w-3" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Admin Navigation</h2>
            <p className="text-sm text-gray-500">Manage platform and content</p>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div>Admin Key: {adminKey}</div>
              <div>OpenConductor v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}