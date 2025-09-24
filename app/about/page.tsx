"use client";

import { motion } from "framer-motion";
import { 
  Gamepad2, 
  Users, 
  Heart, 
  Zap, 
  Shield, 
  Globe,
  Github,
  Twitter,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const team = [
  {
    name: "Alex Chen",
    role: "CEO & Founder",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Passionate gamer and tech entrepreneur"
  },
  {
    name: "Sarah Johnson",
    role: "CTO",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Full-stack developer and gaming enthusiast"
  },
  {
    name: "Mike Williams",
    role: "Head of Design",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "UI/UX designer with 10+ years experience"
  },
  {
    name: "Emily Davis",
    role: "Community Manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    bio: "Building amazing gaming communities"
  }
];

const values = [
  {
    icon: Users,
    title: "Community First",
    description: "We believe in the power of gaming communities to bring people together"
  },
  {
    icon: Heart,
    title: "Passion for Gaming",
    description: "Built by gamers, for gamers. We understand what makes gaming special"
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Constantly pushing boundaries to create the best gaming social experience"
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Creating a safe, inclusive environment for all gamers"
  }
];

const stats = [
  { label: "Active Users", value: "100K+" },
  { label: "Posts Shared", value: "1M+" },
  { label: "Games Supported", value: "500+" },
  { label: "Countries", value: "50+" }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-16">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center mb-6">
              <Gamepad2 className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-gaming font-bold mb-6">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                About ForgePlay
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              We're on a mission to revolutionize how gamers connect, share, and celebrate their gaming moments.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  Join Our Community
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-gaming font-bold mb-8 text-center">Our Story</h2>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p className="text-muted-foreground">
                ForgePlay was born from a simple observation: gamers create incredible moments every day, 
                but there wasn't a dedicated platform to share and celebrate these experiences. We saw 
                fragmented communities across different platforms and games, with no central hub for the 
                gaming culture we all love.
              </p>
              <p className="text-muted-foreground mt-4">
                Founded in 2024, we set out to build more than just another social network. We wanted to 
                create a home for gamers – a place where epic wins, hilarious fails, and everything in 
                between could be shared, discovered, and celebrated. A platform that understands gaming 
                culture and provides the tools creators need to showcase their best moments.
              </p>
              <p className="text-muted-foreground mt-4">
                Today, ForgePlay is growing rapidly, with thousands of gamers sharing their moments, 
                connecting with friends, and discovering new games and communities every day. But we're 
                just getting started. Our vision is to become the definitive platform for gaming culture, 
                where every gamer has a voice and every moment matters.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-gaming font-bold mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-gaming-purple to-gaming-pink flex items-center justify-center mb-4">
                        <value.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-gaming font-bold mb-12 text-center">By the Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-gaming font-bold mb-12 text-center">Meet the Team</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-24 w-24 rounded-full mx-auto mb-4"
                      />
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-sm text-primary mb-2">{member.role}</p>
                      <p className="text-sm text-muted-foreground">{member.bio}</p>
                      <div className="flex justify-center gap-2 mt-4">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Twitter className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-gaming font-bold mb-6">
              Ready to Join the Revolution?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Be part of the fastest growing gaming community platform
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/games">
                <Button size="lg" variant="outline">
                  Explore Games
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
