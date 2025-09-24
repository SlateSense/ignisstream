"use client";

import { motion } from "framer-motion";
import { 
  Video, 
  Users, 
  MessageSquare, 
  Trophy, 
  Sparkles, 
  Zap,
  Upload,
  Share2,
  Edit3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Built-in Video Editor",
    description: "Edit your clips with our powerful in-browser editor. Trim, crop, add text, and create stunning highlights without any software.",
    gradient: "from-gaming-purple to-gaming-pink"
  },
  {
    icon: Sparkles,
    title: "AI Auto-Clips",
    description: "Our AI automatically detects and clips your best gaming moments. Never miss an epic play again.",
    gradient: "from-gaming-pink to-gaming-blue"
  },
  {
    icon: Users,
    title: "Find Teammates",
    description: "Connect with players who match your skill level and playstyle. Build your dream squad instantly.",
    gradient: "from-gaming-blue to-gaming-cyan"
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Chat with friends, coordinate games, and share strategies. Voice notes, DMs, and group chats included.",
    gradient: "from-gaming-cyan to-gaming-green"
  },
  {
    icon: Trophy,
    title: "Earn Ignis Points",
    description: "Get rewarded for sharing, commenting, and engaging. Unlock badges, avatars, and exclusive perks.",
    gradient: "from-gaming-green to-gaming-purple"
  },
  {
    icon: Share2,
    title: "Cross-Platform Sharing",
    description: "Share your moments across all social platforms with one click. Auto-generated thumbnails and hashtags included.",
    gradient: "from-gaming-purple to-gaming-blue"
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
            From capturing moments to building communities, we've got all the tools you need.
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
