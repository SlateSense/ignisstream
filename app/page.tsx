"use client";

import { useEffect } from "react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

export default function HomePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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
