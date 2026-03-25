import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      // Create profile if it doesn't exist
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!existingProfile) {
        // Extract username from email or use metadata
        const email = session.user.email || '';
        const username = session.user.user_metadata?.username || 
                        session.user.user_metadata?.user_name || 
                        email.split('@')[0];
        
        const displayName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           username;

        await supabase.from('profiles').insert({
          id: session.user.id,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          display_name: displayName,
          avatar_url: session.user.user_metadata?.avatar_url || 
                     session.user.user_metadata?.picture || '',
          email: session.user.email,
        });
      }
    }
  }

  // Redirect to feed page
  return NextResponse.redirect(new URL('/feed', requestUrl.origin));
}
