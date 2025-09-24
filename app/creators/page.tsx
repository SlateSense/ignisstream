"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trophy, Sparkles, TrendingUp, Video, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUsers } from "@/lib/mock-data";

export default function CreatorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});

  // Extended creator data
  const creators = mockUsers.map(user => ({
    ...user,
    followers: Math.floor(Math.random() * 100000) + 1000,
    posts: Math.floor(Math.random() * 1000) + 50,
    likes: Math.floor(Math.random() * 500000) + 10000,
    verified: Math.random() > 0.5,
    streaming: Math.random() > 0.7,
    category: ["Gaming", "Speedrun", "Tutorial", "Entertainment"][Math.floor(Math.random() * 4)]
  }));

  const filteredCreators = creators.filter(creator =>
    creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollow = (creatorId: string) => {
    setFollowingStatus(prev => ({
      ...prev,
      [creatorId]: !prev[creatorId]
    }));
  };

  const CreatorCard = ({ creator, index }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-xl transition-all">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Link href={`/profile/${creator.username}`} className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={creator.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white">
                  {creator.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{creator.display_name}</h3>
                  {creator.verified && (
                    <Badge className="bg-blue-500">✓</Badge>
                  )}
                  {creator.streaming && (
                    <Badge className="bg-red-500">LIVE</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{creator.username}</p>
                <Badge variant="secondary" className="mt-1">{creator.category}</Badge>
              </div>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4 line-clamp-2">{creator.bio}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-bold text-lg">{(creator.followers / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="font-bold text-lg">{creator.posts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div>
              <div className="font-bold text-lg">{(creator.likes / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => handleFollow(creator.id)}
            variant={followingStatus[creator.id] ? "outline" : "default"}
            className={!followingStatus[creator.id] ? "w-full bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90" : "w-full"}
          >
            {followingStatus[creator.id] ? "Following" : "Follow"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Discover Creators
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Follow your favorite gaming content creators
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="featured" className="flex-1">
              <Sparkles className="mr-2 h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex-1">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              <Users className="mr-2 h-4 w-4" />
              New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators
                .sort((a, b) => b.followers - a.followers)
                .map((creator, index) => (
                  <CreatorCard key={creator.id} creator={creator} index={index} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="trending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators
                .sort((a, b) => b.likes - a.likes)
                .map((creator, index) => (
                  <CreatorCard key={creator.id} creator={creator} index={index} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((creator, index) => (
                  <CreatorCard key={creator.id} creator={creator} index={index} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
