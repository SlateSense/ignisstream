import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getRememberMePreference } from '@/lib/auth/session'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

const getPrimaryStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return getRememberMePreference() ? window.localStorage : window.sessionStorage
}

const authStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') {
      return null
    }

    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') {
      return
    }

    const primaryStorage = getPrimaryStorage()
    const secondaryStorage = primaryStorage === window.localStorage ? window.sessionStorage : window.localStorage

    primaryStorage?.setItem(key, value)
    secondaryStorage.removeItem(key)
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
 }

export function createClient() {
  // Return cached instance if available
  if (clientInstance) {
    return clientInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    console.error('Supabase not configured. Please set up your Supabase project and update .env.local');
    // Return a mock client to prevent crashes
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }
  
  clientInstance = createBrowserClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: authStorage,
    },
  });
  return clientInstance;
}
