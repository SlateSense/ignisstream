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
  User,
  Settings,
  LogOut,
  Home,
  Compass,
  Trophy,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? "/feed" : "/"} className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="font-gaming font-bold text-xl bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              IgnisStream
            </span>
          </Link>

          {user ? (
            <>
              {/* Authenticated Navigation */}
              <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search games, users, moments..."
                    className="pl-10 bg-secondary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <Link href="/feed" className="text-foreground/80 hover:text-foreground transition">
                  <Home className="h-5 w-5" />
                </Link>
                <Link href="/explore" className="text-foreground/80 hover:text-foreground transition">
                  <Compass className="h-5 w-5" />
                </Link>
                <Link href="/servers" className="text-foreground/80 hover:text-foreground transition">
                  <Users className="h-5 w-5" />
                </Link>
                
                <Button size="sm" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Share
                </Button>

                <div className="flex items-center space-x-2">
                  <Link href="/messages">
                    <Button size="icon" variant="ghost" className="relative">
                      <MessageCircle className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-gradient-to-r from-gaming-purple to-gaming-pink text-xs">
                        3
                      </Badge>
                    </Button>
                  </Link>

                  <Link href="/notifications">
                    <Button size="icon" variant="ghost" className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-gradient-to-r from-gaming-purple to-gaming-pink text-xs">
                        5
                      </Badge>
                    </Button>
                  </Link>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {profile?.display_name?.[0] || user.email?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.display_name || "Anonymous"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs font-medium text-yellow-600">
                              {profile?.forge_points || 0} FP
                            </span>
                            {profile?.premium_status && (
                              <Badge variant="secondary" className="text-xs">PRO</Badge>
                            )}
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${profile?.username || user.id}`}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/achievements">
                          <Trophy className="mr-2 h-4 w-4" />
                          <span>Achievements</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Unauthenticated Navigation */}
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
            </>
          )}

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
            {user ? (
              <>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <Link href="/feed" className="block text-foreground/80 hover:text-foreground transition">
                  Feed
                </Link>
                <Link href="/explore" className="block text-foreground/80 hover:text-foreground transition">
                  Explore
                </Link>
                <Link href="/servers" className="block text-foreground/80 hover:text-foreground transition">
                  Servers
                </Link>
                <Link href="/messages" className="block text-foreground/80 hover:text-foreground transition">
                  Messages
                </Link>
                <Link href="/notifications" className="block text-foreground/80 hover:text-foreground transition">
                  Notifications
                </Link>
                <Link href={`/profile/${profile?.username || user.id}`} className="block text-foreground/80 hover:text-foreground transition">
                  Profile
                </Link>
                <div className="pt-4">
                  <Button onClick={handleSignOut} variant="outline" className="w-full">
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
