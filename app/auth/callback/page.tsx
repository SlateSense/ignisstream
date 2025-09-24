"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Gamepad2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/signin?error=callback_failed');
          return;
        }

        if (data.session) {
          // Check if user profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                username: data.session.user.user_metadata?.preferred_username || 
                         data.session.user.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') ||
                         `user_${data.session.user.id.slice(0, 8)}`,
                display_name: data.session.user.user_metadata?.full_name || 
                             data.session.user.user_metadata?.name || 
                             'Anonymous Gamer',
                avatar_url: data.session.user.user_metadata?.avatar_url || 
                           data.session.user.user_metadata?.picture,
                forge_points: 100, // Welcome bonus
                premium_status: false
              });

            if (insertError) {
              console.error('Profile creation error:', insertError);
            }
          }

          // Redirect to feed
          router.push('/feed');
        } else {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        router.push('/auth/signin?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Gamepad2 className="h-10 w-10 text-primary animate-pulse" />
          <span className="font-gaming font-bold text-2xl bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
            ForgePlay
          </span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Completing sign in...</span>
        </div>
      </div>
    </div>
  );
}
