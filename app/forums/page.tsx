"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, MessageCircle, MessageSquareText, Search, Swords, TrendingUp, Users } from "lucide-react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Thread = {
  id: string;
  title: string;
  game: string;
  category: "strategy" | "patch-notes" | "clips" | "lfg";
  author: string;
  replies: number;
  reactions: string[];
  lastActive: string;
};

const threads: Thread[] = [
  { id: "t1", title: "Best Inferno executes this patch", game: "Counter-Strike 2", category: "strategy", author: "NovaRush", replies: 148, reactions: ["🔥", "🎯", "GG"], lastActive: "5m ago" },
  { id: "t2", title: "Valorant 9.3 meta shift breakdown", game: "VALORANT", category: "patch-notes", author: "AimPilot", replies: 92, reactions: ["⚡", "🧠", "💜"], lastActive: "13m ago" },
  { id: "t3", title: "Share your cleanest clutch clips", game: "Apex Legends", category: "clips", author: "BlinkByte", replies: 211, reactions: ["🔥", "POG", "💥"], lastActive: "2m ago" },
  { id: "t4", title: "Looking for ranked support duo", game: "League of Legends", category: "lfg", author: "RuneForge", replies: 65, reactions: ["🟢", "🎧", "🏆"], lastActive: "24m ago" },
  { id: "t5", title: "Warzone movement drills for consistency", game: "Call of Duty", category: "strategy", author: "SlideKing", replies: 80, reactions: ["🔥", "💪", "GG"], lastActive: "9m ago" },
  { id: "t6", title: "Fortnite ranked update discussion", game: "Fortnite", category: "patch-notes", author: "BuildMode", replies: 57, reactions: ["⚡", "🧱", "🎯"], lastActive: "37m ago" },
];

const games = ["All", ...Array.from(new Set(threads.map((thread) => thread.game)))];

const categoryLabel: Record<Thread["category"], string> = {
  strategy: "Strategy",
  "patch-notes": "Patch Notes",
  clips: "Clips",
  lfg: "LFG",
};

export default function ForumsPage() {
  const [query, setQuery] = useState("");
  const [activeGame, setActiveGame] = useState("All");
  const [activeTab, setActiveTab] = useState<Thread["category"] | "all">("all");

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const byGame = activeGame === "All" || thread.game === activeGame;
      const byCategory = activeTab === "all" || thread.category === activeTab;
      const byQuery =
        thread.title.toLowerCase().includes(query.toLowerCase()) ||
        thread.author.toLowerCase().includes(query.toLowerCase()) ||
        thread.game.toLowerCase().includes(query.toLowerCase());
      return byGame && byCategory && byQuery;
    });
  }, [query, activeGame, activeTab]);

  return (
    <div className="min-h-screen gaming-shell particle-field">
      <AuthNavbar />
      <main className="container mx-auto px-4 pt-24 pb-10">
        <div className="rounded-2xl border border-gaming-purple/35 bg-card/65 p-6 md:p-8 backdrop-blur-md">
          <Badge className="mb-4 bg-gaming-cyan/20 text-gaming-cyan border border-gaming-cyan/40">
            Community Forums by Game Title
          </Badge>
          <h1 className="text-4xl md:text-5xl font-gaming font-bold gradient-text">Gaming Forums</h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-3xl">
            Strategy rooms, patch note debates, LFG threads, and clip showcases grouped by the games you actually play.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Card className="border-gaming-purple/25">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active Threads</p>
                <p className="text-2xl font-bold text-gaming-cyan">—</p>
              </CardContent>
            </Card>
            <Card className="border-gaming-blue/25">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Gamers Online</p>
                <p className="text-2xl font-bold text-gaming-green">—</p>
              </CardContent>
            </Card>
            <Card className="border-gaming-green/25">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Daily Reactions</p>
                <p className="text-2xl font-bold text-gaming-purple">—</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mt-7 grid gap-5 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            <Card className="border-gaming-purple/25">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search threads, players, or game titles"
                    aria-label="Search forum discussions"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {games.map((game) => (
                    <Button
                      key={game}
                      variant={game === activeGame ? "default" : "outline"}
                      onClick={() => setActiveGame(game)}
                      className={game === activeGame ? "bg-gradient-to-r from-gaming-purple to-gaming-pink" : ""}
                    >
                      {game}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Thread["category"] | "all")}>
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="patch-notes">Patch Notes</TabsTrigger>
                <TabsTrigger value="clips">Clips</TabsTrigger>
                <TabsTrigger value="lfg">LFG</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-5 space-y-4">
                {filteredThreads.map((thread, index) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="border-gaming-blue/20 hover:border-gaming-cyan/45 transition">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl">{thread.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {thread.game} · {categoryLabel[thread.category]} · by @{thread.author}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="border-gaming-cyan/50 text-gaming-cyan">
                            {thread.lastActive}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" />{thread.replies} replies</span>
                          <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4 text-gaming-cyan" />Hot thread</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {thread.reactions.map((reaction) => (
                            <Badge key={`${thread.id}-${reaction}`} variant="secondary">{reaction}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filteredThreads.length === 0 && (
                  <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No threads match your filters right now.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-5">
            <Card className="neon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gaming-cyan" />Trending Boards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Counter-Strike 2", "VALORANT", "League of Legends", "Apex Legends"].map((board) => (
                  <div key={board} className="rounded-lg border border-gaming-purple/20 px-3 py-2 flex items-center justify-between">
                    <span>{board}</span>
                    <Badge variant="outline">Live</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-gaming-green" />Forum Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/messages"><Button variant="outline" className="w-full">Start LFG Chat</Button></Link>
                <Link href="/tournaments"><Button variant="outline" className="w-full">Browse Events</Button></Link>
                <Link href="/teams"><Button variant="outline" className="w-full">Join Guilds</Button></Link>
                <Link href="/feed"><Button className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink">Share New Clip</Button></Link>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Swords className="h-3.5 w-3.5 text-gaming-cyan" />
                  Use reactions like 🔥, GG, and POG to keep threads fun.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
