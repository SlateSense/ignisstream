"use client";

import { Flame, Play, Trophy, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-8 md:pb-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-purple/25 via-background to-gaming-blue/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gaming-purple/35 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gaming-blue/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 text-center py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-gaming-cyan/30 mb-4">
            <Flame className="w-4 h-4 text-gaming-cyan" />
            <span className="text-sm font-medium">Built for real gaming communities</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-gaming font-bold mb-4">
            <span className="bg-gradient-to-r from-gaming-purple via-gaming-blue to-gaming-green bg-clip-text text-transparent">
              Build Your Squad
            </span>
            <br />
            <span className="text-foreground">Own The Arena</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Bring clips, tournaments, lobbies, clans, leaderboards, and community forums
            into one fast social hub made for gamers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90 group">
                <Upload className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Join Now
              </Button>
            </Link>
            <Link href="/forums">
              <Button size="lg" variant="outline" className="group border-gaming-cyan/40">
                <Trophy className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform text-gaming-cyan" />
                Explore Communities
              </Button>
            </Link>
            <Link href="/streaming">
              <Button size="lg" variant="outline" className="group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Live Streams
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div>
              <div className="text-sm font-semibold text-gaming-cyan">Live chat</div>
              <div className="text-sm text-muted-foreground">Squad DMs and lobbies</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gaming-green">Matchmaking</div>
              <div className="text-sm text-muted-foreground">Find teammates quickly</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gaming-purple">Tournaments</div>
              <div className="text-sm text-muted-foreground">Compete and organize</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gaming-blue">Forums</div>
              <div className="text-sm text-muted-foreground">Per-game communities</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
