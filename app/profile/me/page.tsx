"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MyProfileRedirectPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/auth/signin");
      return;
    }

    const identifier = profile?.username || user.id;
    router.replace(`/profile/${identifier}`);
  }, [loading, profile?.username, router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Opening your profile...</span>
      </div>
    </div>
  );
}
