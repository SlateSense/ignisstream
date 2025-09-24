"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Users, 
  Video, 
  MessageSquare, 
  Trophy, 
  Sparkles,
  Play,
  Upload,
  Search,
  TrendingUp,
  Zap,
  Globe,
  Shield,
  Heart
} from "lucide-react";
import Link from "next/link";
import AuthNavbar from "@/components/layout/AuthNavbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Stats from "@/components/home/Stats";
import CTA from "@/components/home/CTA";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      <AuthNavbar />
      
      <main>
        <Hero />
        <Features />
        <Stats />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
