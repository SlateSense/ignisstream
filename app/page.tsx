"use client";

import { useEffect } from "react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import { useAuth } from "@/contexts/AuthContext";
import { getRememberedAuthenticatedRoute } from "@/lib/auth/session";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (!loading && user) {
      router.push(getRememberedAuthenticatedRoute());
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen gaming-shell">
      <AuthNavbar />
      
      <main>
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
}
