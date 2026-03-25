"use client";

import { motion } from "framer-motion";
import { 
  BadgeCheck,
  Clapperboard,
  MessageSquare,
  Radio,
  Shield,
  Swords,
  Trophy,
  Users,
  Video
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Game Clip Uploads",
    description: "Upload clips, highlights, and tactical breakdowns with premium social sharing built for gaming content.",
    gradient: "from-gaming-purple to-gaming-blue"
  },
  {
    icon: MessageSquare,
    title: "Real-Time Lobbies",
    description: "Jump into lobby channels, direct chats, and squad rooms with status-aware communication tools.",
    gradient: "from-gaming-blue to-gaming-cyan"
  },
  {
    icon: Swords,
    title: "Matchmaking + Tournaments",
    description: "Queue with skill filters, build squads, and join events with streamlined competitive workflows.",
    gradient: "from-gaming-cyan to-gaming-green"
  },
  {
    icon: Users,
    title: "Clans & Guilds",
    description: "Create gamer groups with custom tags, shared goals, and role-based community collaboration.",
    gradient: "from-gaming-green to-gaming-purple"
  },
  {
    icon: Trophy,
    title: "Leaderboards & Badges",
    description: "Track ranked progress, unlock achievement badges, and flex milestone stats across your profile.",
    gradient: "from-gaming-purple to-gaming-pink"
  },
  {
    icon: Radio,
    title: "Streaming Integration",
    description: "Connect live channels, sync stream presence, and surface broadcasts directly in your social hub.",
    gradient: "from-gaming-pink to-gaming-blue"
  },
  {
    icon: BadgeCheck,
    title: "Gamer Identity",
    description: "Use customizable gamer tags, profile stats, and themed reactions that feel native to gaming culture.",
    gradient: "from-gaming-blue to-gaming-purple"
  },
  {
    icon: Clapperboard,
    title: "Forums by Game",
    description: "Browse organized discussions per title for strategies, patch notes, and community highlights.",
    gradient: "from-gaming-cyan to-gaming-blue"
  },
  {
    icon: Shield,
    title: "Accessible by Design",
    description: "Responsive layouts, strong contrast, and keyboard focus support keep every gamer included.",
    gradient: "from-gaming-green to-gaming-cyan"
  }
];

export default function Features() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              {" "}Level Up
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From capturing moments to building communities, we&apos;ve got all the tools you need.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow group">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
