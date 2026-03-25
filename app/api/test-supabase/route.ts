import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        url: supabaseUrl ? 'Present' : 'Missing',
        key: supabaseKey ? 'Present' : 'Missing'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Just test if we can connect to Supabase at all
    const connectionTest = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (!connectionTest.ok) {
      return NextResponse.json({ 
        error: 'Supabase connection failed',
        status: connectionTest.status,
        statusText: connectionTest.statusText
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Supabase connection working',
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message
    }, { status: 500 })
  }
}
