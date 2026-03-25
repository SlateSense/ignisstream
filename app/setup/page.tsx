"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<{
    connection: 'idle' | 'testing' | 'success' | 'error'
    schema: 'idle' | 'creating' | 'success' | 'error'
    message?: string
  }>({
    connection: 'idle',
    schema: 'idle'
  })

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, connection: 'testing' }))
    
    try {
      const response = await fetch('/api/test-supabase')
      const data = await response.json()
      
      if (response.ok) {
        setStatus(prev => ({ 
          ...prev, 
          connection: 'success',
          message: 'Supabase connection successful!' 
        }))
      } else {
        setStatus(prev => ({ 
          ...prev, 
          connection: 'error',
          message: data.details || data.error || 'Connection failed' 
        }))
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        connection: 'error',
        message: 'Network error - make sure the server is running' 
      }))
    }
  }

  const StatusIcon = ({ state }: { state: string }) => {
    switch (state) {
      case 'testing':
      case 'creating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
            IgnisStream Setup
          </h1>
          <p className="text-muted-foreground mt-2">
            Let&apos;s get your gaming platform ready for action!
          </p>
        </div>

        <div className="space-y-6">
          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon state={status.connection} />
                Database Connection
              </CardTitle>
              <CardDescription>
                Test the connection to your Supabase database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={testConnection}
                  disabled={status.connection === 'testing'}
                >
                  {status.connection === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {status.message && (
                  <Alert>
                    <AlertDescription>
                      {status.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>
                Current environment settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div>Supabase URL: ✅ {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
                <div>Supabase Key: ✅ Configured</div>
                <div>Environment: {process.env.NODE_ENV}</div>
              </div>
            </CardContent>
          </Card>

          {/* Database Schema */}
          <Card>
            <CardHeader>
              <CardTitle>🗄️ Database Schema Setup</CardTitle>
              <CardDescription>
                Copy and paste this complete schema into your Supabase SQL Editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm mb-4">
                  <strong>File Location:</strong> <code>COMPLETE_DATABASE_SETUP.sql</code> (in your project root)
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <a href="https://supabase.com/dashboard/project/odireqkjlgwdvmtscfqn/sql/new" target="_blank" rel="noopener noreferrer">
                      Open Supabase SQL Editor
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/api/health" target="_blank">
                      Test API Health
                    </a>
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">
                    📝 The complete schema includes:<br/>
                    ✅ User profiles & authentication<br/>
                    ✅ Social media (posts, likes, follows)<br/>
                    ✅ Gaming integration (8 platforms)<br/>
                    ✅ Live streaming system<br/>
                    ✅ Security policies & indexes<br/>
                    ✅ Seed data for testing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to complete your IgnisStream setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Supabase Database Setup</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to your Supabase project dashboard and run the SQL schema from 
                    <code className="mx-1 px-1 bg-muted rounded">lib/supabase/schema.sql</code>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">2. Enable Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    In Supabase, go to Authentication → Settings and enable:
                  </p>
                  <ul className="text-sm text-muted-foreground ml-4 list-disc">
                    <li>Email confirmations (optional for dev)</li>
                    <li>Email authentication</li>
                    <li>Add your domain to allowed origins</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Configure Row Level Security</h4>
                  <p className="text-sm text-muted-foreground">
                    The schema includes RLS policies. Make sure they&apos;re enabled on all tables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button asChild>
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Open Supabase Dashboard
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/health" target="_blank" rel="noopener noreferrer">
                    Check API Health
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
