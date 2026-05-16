'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Terminal, BarChart3, Database, Megaphone, Calendar, Key, LogOut, Brain
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
    { name: 'Command Center', href: '/admin/command-center', icon: Brain, badge: 'NEW' },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Terminal className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-foreground">OpenConductor Admin</h1>
            <p className="text-muted-foreground mb-6">
              Enter your admin API key to access the management interface
            </p>

            <div className="space-y-4">
              <Button onClick={handleSetApiKey} className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Enter Admin Key
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>Need your API key?</p>
                <code className="bg-muted px-2 py-1 rounded mt-1 block text-xs">
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
    <div className="h-screen bg-background">
      {/* Top Navbar */}
      <header className="bg-card border-b h-16 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground">OpenConductor</span>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Admin
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
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
        <div className="w-64 bg-card border-r flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground">Admin Navigation</h2>
            <p className="text-sm text-muted-foreground">Manage platform and content</p>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
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