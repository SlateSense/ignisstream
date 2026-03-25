import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

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
  
  clientInstance = createBrowserClient<Database>(url, key);
  return clientInstance;
}
