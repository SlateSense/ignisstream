"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  forge_points: number;
  premium_status: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const getProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const ensureProfile = async (currentUser: User) => {
    const existingProfile = await getProfile(currentUser.id);

    if (existingProfile) {
      return existingProfile;
    }

    const usernameFromMetadata =
      currentUser.user_metadata?.preferred_username ||
      currentUser.user_metadata?.user_name ||
      currentUser.user_metadata?.name?.toLowerCase()?.replace(/\s+/g, "") ||
      `player_${currentUser.id.slice(0, 8)}`;

    const displayNameFromMetadata =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      usernameFromMetadata;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: currentUser.id,
          username: usernameFromMetadata,
          display_name: displayNameFromMetadata,
          avatar_url:
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            null,
          bio: null,
          forge_points: 0,
          premium_status: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      )
      .select("*")
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }

    return data;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await ensureProfile(user);
    setProfile(profileData);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await ensureProfile(session.user);
          if (mounted) setProfile(profileData);
        } else if (mounted) {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await ensureProfile(session.user);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
