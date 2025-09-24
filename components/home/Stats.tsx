"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Video, Gamepad2 } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Players",
    description: "Growing community of passionate gamers"
  },
  {
    icon: Video,
    value: "50,000+",
    label: "Moments Shared",
    description: "Epic highlights uploaded daily"
  },
  {
    icon: Gamepad2,
    value: "100+",
    label: "Games Supported",
    description: "From AAA titles to indie gems"
  },
  {
    icon: TrendingUp,
    value: "500%",
    label: "Monthly Growth",
    description: "Fastest growing gaming platform"
  }
];

export default function Stats() {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
            Join the
            <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
              {" "}Revolution
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Be part of the fastest growing gaming community platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
