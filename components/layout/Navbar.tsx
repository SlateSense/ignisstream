"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Menu, 
  X, 
  Search,
  Bell,
  MessageCircle,
  Plus,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="font-gaming font-bold text-xl bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              ForgePlay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/explore" className="text-foreground/80 hover:text-foreground transition">
              Explore
            </Link>
            <Link href="/games" className="text-foreground/80 hover:text-foreground transition">
              Games
            </Link>
            <Link href="/creators" className="text-foreground/80 hover:text-foreground transition">
              Creators
            </Link>
            <Link href="/about" className="text-foreground/80 hover:text-foreground transition">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 space-y-4"
          >
            <Link href="/explore" className="block text-foreground/80 hover:text-foreground transition">
              Explore
            </Link>
            <Link href="/games" className="block text-foreground/80 hover:text-foreground transition">
              Games
            </Link>
            <Link href="/creators" className="block text-foreground/80 hover:text-foreground transition">
              Creators
            </Link>
            <Link href="/about" className="block text-foreground/80 hover:text-foreground transition">
              About
            </Link>
            <div className="flex flex-col space-y-2 pt-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
