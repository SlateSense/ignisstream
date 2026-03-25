"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Flame,
  Gamepad2,
  ListChecks,
  MessagesSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  Sword,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const featureTracks = [
  {
    title: "Social + Identity",
    description: "Profiles with stats, gamer tags, badges, and social progression.",
    icon: BadgeCheck,
    href: "/profile/edit",
    accent: "from-gaming-purple to-gaming-pink",
  },
  {
    title: "Friends + Presence",
    description: "Friend systems with online status, squads, and quick join actions.",
    icon: Users,
    href: "/messages",
    accent: "from-gaming-blue to-gaming-cyan",
  },
  {
    title: "Real-Time Lobbies",
    description: "Lobby chat rooms for team coordination, prep, and match calls.",
    icon: MessagesSquare,
    href: "/messages",
    accent: "from-gaming-cyan to-gaming-green",
  },
  {
    title: "Clips + Content",
    description: "Upload gameplay clips and share highlights across the gaming feed.",
    icon: Upload,
    href: "/feed",
    accent: "from-gaming-green to-gaming-purple",
  },
  {
    title: "Forums by Game",
    description: "Organized game-title forums for strategy, patches, and community talk.",
    icon: ListChecks,
    href: "/forums",
    accent: "from-gaming-purple to-gaming-blue",
  },
  {
    title: "Tournaments + Matchmaking",
    description: "Discover events and queue into balanced matches with skill filters.",
    icon: Sword,
    href: "/matchmaking",
    accent: "from-gaming-pink to-gaming-blue",
  },
  {
    title: "Streaming + Broadcast",
    description: "Connect stream channels and surface live content from your network.",
    icon: Radio,
    href: "/streaming",
    accent: "from-gaming-blue to-gaming-purple",
  },
  {
    title: "Clans + Guilds",
    description: "Build dedicated squads with shared goals, roles, and team identity.",
    icon: ShieldCheck,
    href: "/teams",
    accent: "from-gaming-cyan to-gaming-blue",
  },
  {
    title: "Leaderboards",
    description: "Track ladder standings, hot streaks, and competitive rankings.",
    icon: Trophy,
    href: "/leaderboards",
    accent: "from-gaming-green to-gaming-cyan",
  },
];

const quickLinks = [
  { title: "Game Forums", href: "/forums", tag: "Community" },
  { title: "Tournament Arena", href: "/tournaments", tag: "Competitive" },
  { title: "Matchmaking Queue", href: "/matchmaking", tag: "Queue Up" },
  { title: "Streaming Lounge", href: "/streaming", tag: "Live" },
];

export default function HubPage() {
  return (
    <div className="min-h-screen gaming-shell particle-field">
      <AuthNavbar />
      <main className="container mx-auto px-4 pt-24 pb-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gaming-purple/30 bg-card/65 p-6 md:p-8 backdrop-blur-md"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-gaming-green/20 text-gaming-green border border-gaming-green/40">
                Premium Gaming Community Hub
              </Badge>
              <h1 className="text-4xl md:text-5xl font-gaming font-bold leading-tight">
                <span className="gradient-text">Cool. Fire. Built for Gamers.</span>
              </h1>
              <p className="mt-4 text-muted-foreground text-lg">
                Everything from clips to clans now lives in one intuitive flow so players can queue,
                create, and connect without friction.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[250px]">
              {quickLinks.map((link) => (
                <Link key={link.title} href={link.href}>
                  <Card className="h-full neon-card transition hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-wide text-gaming-cyan">{link.tag}</p>
                      <p className="font-semibold mt-1">{link.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featureTracks.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="h-full border-gaming-purple/20 hover:border-gaming-cyan/45 transition">
                <CardHeader>
                  <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-r ${feature.accent} p-3`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full border-gaming-cyan/45 hover:bg-gaming-cyan/10">
                      Open Module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-gaming-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gaming-cyan" />
                Gamer Experience Principles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {[
                "Dark-first visuals with neon accent hierarchy",
                "Responsive navigation for desktop, tablet, and mobile",
                "Accessible keyboard focus and strong contrast",
                "Game-centric information architecture and flows",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-gaming-blue/20 bg-background/60 px-3 py-2">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gaming-green/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-gaming-green" />
                Fire Mode
              </CardTitle>
              <CardDescription>
                Browse the most social gaming actions in one tap.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/feed"><Button className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink">Share Clip</Button></Link>
              <Link href="/messages"><Button className="w-full" variant="outline">Join Lobby Chat</Button></Link>
              <Link href="/teams"><Button className="w-full" variant="outline">Create Clan</Button></Link>
              <Link href="/leaderboards"><Button className="w-full" variant="outline">View Leaderboards</Button></Link>
              <div className="pt-1 text-xs text-muted-foreground flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-gaming-cyan" />
                Your community loop is now centralized.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
