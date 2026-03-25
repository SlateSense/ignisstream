"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Lock, Zap, TrendingUp, Users, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { useAchievements } from "@/components/achievements/AchievementProvider";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rarity");
  
  const { 
    achievements, 
    userAchievements, 
    unlockedCount, 
    totalPoints, 
    loading,
    getAchievementProgress,
    initializeAchievements 
  } = useAchievements();

  // Load achievements when page mounts
  useEffect(() => {
    initializeAchievements();
  }, []);

  const filteredAchievements = achievements.filter(achievement => {
    const { unlocked, progress, max } = getAchievementProgress(achievement.id);
    
    if (filter === "unlocked") return unlocked;
    if (filter === "locked") return !unlocked;
    if (filter === "in-progress") return !unlocked && progress > 0;
    return true;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === "rarity") {
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    }
    if (sortBy === "points") {
      return b.points - a.points;
    }
    if (sortBy === "progress") {
      const aProgress = getAchievementProgress(a.id);
      const bProgress = getAchievementProgress(b.id);
      const aPercent = aProgress.max > 0 ? aProgress.progress / aProgress.max : 0;
      const bPercent = bProgress.max > 0 ? bProgress.progress / bProgress.max : 0;
      return bPercent - aPercent;
    }
    return 0;
  });

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "border-gray-500",
      rare: "border-blue-500", 
      epic: "border-purple-500",
      legendary: "border-yellow-500"
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityTextColor = (rarity: string) => {
    const colors = {
      common: "text-gray-500",
      rare: "text-blue-500",
      epic: "text-purple-500", 
      legendary: "text-yellow-500"
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavbar />
        <div className="container mx-auto px-4 pt-32">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Achievements
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Showcase your gaming accomplishments and unlock rewards
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <h3 className="text-2xl font-bold">{unlockedCount}</h3>
                  <p className="text-muted-foreground">Achievements Unlocked</p>
                  <p className="text-sm text-muted-foreground">out of {achievements.length}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-3 text-gaming-purple" />
                  <h3 className="text-2xl font-bold">{totalPoints}</h3>
                  <p className="text-muted-foreground">Achievement Points</p>
                  <p className="text-sm text-muted-foreground">Total earned</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 text-gaming-pink" />
                  <h3 className="text-2xl font-bold">
                    {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
                  </h3>
                  <p className="text-muted-foreground">Completion Rate</p>
                  <p className="text-sm text-muted-foreground">Overall progress</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <TabsList className="grid w-full md:w-auto grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button
                variant={sortBy === "rarity" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("rarity")}
              >
                Sort by Rarity
              </Button>
              <Button
                variant={sortBy === "points" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("points")}
              >
                Sort by Points
              </Button>
              <Button
                variant={sortBy === "progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("progress")}
              >
                Sort by Progress
              </Button>
            </div>
          </div>

          <TabsContent value={filter}>
            {achievements.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">Start posting and engaging to unlock achievements!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAchievements.map((achievement, index) => {
                  const { progress, max, unlocked } = getAchievementProgress(achievement.id);
                  const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "h-full transition-all hover:shadow-xl",
                        unlocked 
                          ? "border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent" 
                          : "opacity-75"
                      )}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={cn(
                              "text-4xl w-16 h-16 rounded-full flex items-center justify-center",
                              unlocked ? "bg-primary/10" : "bg-muted"
                            )}>
                              {unlocked ? achievement.icon : "🔒"}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={cn(
                                  "font-semibold",
                                  unlocked ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {achievement.name}
                                </h3>
                                {unlocked && <Trophy className="h-4 w-4 text-yellow-500" />}
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  variant="secondary"
                                  className={cn("text-xs", getRarityTextColor(achievement.rarity))}
                                >
                                  {achievement.rarity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {achievement.points} pts
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {achievement.description}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {!unlocked && max > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {progress}/{max}
                                </span>
                              </div>
                              <Progress 
                                value={(progress / max) * 100} 
                                className="h-2"
                              />
                            </div>
                          )}

                          {/* Unlocked Date */}
                          {unlocked && userAchievement?.unlocked_at && (
                            <p className="text-xs text-muted-foreground">
                              Unlocked on {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
