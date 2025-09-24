"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Crown,
  Zap,
  Target,
  Users,
  Gamepad2,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Award,
  Medal,
  Gift,
  Lock,
  Check,
  TrendingUp as ProgressIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'social' | 'gaming' | 'content' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points_reward: number;
  progress?: number;
  max_progress?: number;
  unlocked: boolean;
  unlocked_at?: string;
  requirements?: string[];
}

interface ForgePointsHistory {
  id: number;
  points: number;
  reason: string;
  timestamp: string;
  type: 'earned' | 'spent' | 'bonus';
}

const mockAchievements: Achievement[] = [
  {
    id: 1,
    name: "First Steps",
    description: "Complete your profile and share your first gaming moment",
    icon: <Star className="h-6 w-6" />,
    category: 'milestone',
    rarity: 'common',
    points_reward: 100,
    unlocked: true,
    unlocked_at: "2024-01-15T10:30:00Z",
    progress: 1,
    max_progress: 1
  },
  {
    id: 2,
    name: "Social Butterfly",
    description: "Get 100 likes on your posts",
    icon: <Heart className="h-6 w-6" />,
    category: 'social',
    rarity: 'rare',
    points_reward: 250,
    unlocked: true,
    unlocked_at: "2024-01-20T15:45:00Z",
    progress: 100,
    max_progress: 100
  },
  {
    id: 3,
    name: "Team Player",
    description: "Play 50 matchmaking games with teammates",
    icon: <Users className="h-6 w-6" />,
    category: 'gaming',
    rarity: 'rare',
    points_reward: 300,
    unlocked: false,
    progress: 32,
    max_progress: 50,
    requirements: ["Use matchmaking system", "Complete team games"]
  },
  {
    id: 4,
    name: "Content Creator",
    description: "Upload 25 gaming clips with the video editor",
    icon: <Gamepad2 className="h-6 w-6" />,
    category: 'content',
    rarity: 'epic',
    points_reward: 500,
    unlocked: false,
    progress: 8,
    max_progress: 25,
    requirements: ["Use video editor", "Share original clips"]
  },
  {
    id: 5,
    name: "Community Leader",
    description: "Create a server with 100+ members",
    icon: <Crown className="h-6 w-6" />,
    category: 'social',
    rarity: 'legendary',
    points_reward: 1000,
    unlocked: false,
    progress: 0,
    max_progress: 1,
    requirements: ["Create server", "Reach 100 members", "Maintain active community"]
  },
  {
    id: 6,
    name: "Conversation Starter",
    description: "Send 1000 messages in server chats",
    icon: <MessageSquare className="h-6 w-6" />,
    category: 'social',
    rarity: 'common',
    points_reward: 150,
    unlocked: false,
    progress: 487,
    max_progress: 1000,
    requirements: ["Participate in server chats"]
  },
  {
    id: 7,
    name: "Viral Moment",
    description: "Get a post shared 500+ times",
    icon: <Share2 className="h-6 w-6" />,
    category: 'content',
    rarity: 'legendary',
    points_reward: 1500,
    unlocked: false,
    progress: 0,
    max_progress: 1,
    requirements: ["Create viral content", "Reach 500 shares"]
  },
  {
    id: 8,
    name: "Dedicated Gamer",
    description: "Log in for 30 consecutive days",
    icon: <Calendar className="h-6 w-6" />,
    category: 'milestone',
    rarity: 'rare',
    points_reward: 400,
    unlocked: false,
    progress: 12,
    max_progress: 30,
    requirements: ["Daily login streak"]
  }
];

const mockPointsHistory: ForgePointsHistory[] = [
  {
    id: 1,
    points: 100,
    reason: "Achievement: First Steps",
    timestamp: "2024-01-15T10:30:00Z",
    type: "earned"
  },
  {
    id: 2,
    points: 50,
    reason: "Daily login bonus",
    timestamp: "2024-01-16T09:15:00Z",
    type: "bonus"
  },
  {
    id: 3,
    points: 250,
    reason: "Achievement: Social Butterfly",
    timestamp: "2024-01-20T15:45:00Z",
    type: "earned"
  },
  {
    id: 4,
    points: -200,
    reason: "Premium badge purchase",
    timestamp: "2024-01-21T12:00:00Z",
    type: "spent"
  },
  {
    id: 5,
    points: 75,
    reason: "Weekly challenge completed",
    timestamp: "2024-01-22T18:30:00Z",
    type: "earned"
  }
];

const rarityColors = {
  common: "text-gray-500 border-gray-500/20",
  rare: "text-blue-500 border-blue-500/20",
  epic: "text-purple-500 border-purple-500/20",
  legendary: "text-yellow-500 border-yellow-500/20"
};

const rarityBg = {
  common: "bg-gray-500/10",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-yellow-500/10"
};

export default function AchievementsPage() {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointsHistory, setPointsHistory] = useState<ForgePointsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalPoints = profile?.forge_points || 2847;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Medal className="h-4 w-4" />;
      case 'rare': return <Award className="h-4 w-4" />;
      case 'epic': return <Trophy className="h-4 w-4" />;
      case 'legendary': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const categoryIcons = {
    social: <Users className="h-4 w-4" />,
    gaming: <Gamepad2 className="h-4 w-4" />,
    content: <Star className="h-4 w-4" />,
    milestone: <Target className="h-4 w-4" />,
    special: <Gift className="h-4 w-4" />
  };

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
            <h1 className="text-4xl font-gaming font-bold mb-2">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Achievements & Forge Points
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your progress and earn rewards for your gaming journey
            </p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Forge Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 mx-auto bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-full flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold">{unlockedCount}/{totalAchievements}</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-3">
                  <ProgressIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold">{Math.round((unlockedCount / totalAchievements) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 mx-auto bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold">
                  {achievements.filter(a => a.rarity === 'legendary' && a.unlocked).length}
                </p>
                <p className="text-sm text-muted-foreground">Legendary</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Achievements */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="achievements">
              <TabsList className="mb-6">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="history">Points History</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Categories
                  </Button>
                  {Object.entries(categoryIcons).map(([category, icon]) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {icon}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Achievement Grid */}
                <div className="grid gap-4">
                  {filteredAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "relative overflow-hidden transition-all hover:shadow-lg",
                        achievement.unlocked ? "border-primary/50" : "opacity-75",
                        rarityBg[achievement.rarity]
                      )}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={cn(
                              "flex-shrink-0 p-3 rounded-full",
                              achievement.unlocked ? "bg-primary/20" : "bg-muted"
                            )}>
                              {achievement.unlocked ? (
                                <div className="text-primary">{achievement.icon}</div>
                              ) : (
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{achievement.name}</h3>
                                  <p className="text-muted-foreground">{achievement.description}</p>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge className={cn("border", rarityColors[achievement.rarity])}>
                                    {getRarityIcon(achievement.rarity)}
                                    <span className="ml-1">{achievement.rarity}</span>
                                  </Badge>
                                  <div className="flex items-center text-sm">
                                    <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="font-medium">{achievement.points_reward} FP</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              {achievement.max_progress && achievement.max_progress > 1 && (
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{achievement.progress}/{achievement.max_progress}</span>
                                  </div>
                                  <Progress 
                                    value={(achievement.progress! / achievement.max_progress) * 100} 
                                    className="h-2"
                                  />
                                </div>
                              )}

                              {/* Requirements */}
                              {!achievement.unlocked && achievement.requirements && (
                                <div className="text-sm text-muted-foreground">
                                  <p className="font-medium mb-1">Requirements:</p>
                                  <ul className="space-y-1">
                                    {achievement.requirements.map((req, i) => (
                                      <li key={i} className="flex items-center">
                                        <div className="h-1 w-1 bg-muted-foreground rounded-full mr-2" />
                                        {req}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Unlocked Status */}
                              {achievement.unlocked && (
                                <div className="flex items-center text-sm text-green-600">
                                  <Check className="h-4 w-4 mr-2" />
                                  Unlocked on {new Date(achievement.unlocked_at!).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-4">
                  {pointsHistory.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "p-2 rounded-full",
                                entry.type === "earned" ? "bg-green-500/20" :
                                entry.type === "bonus" ? "bg-blue-500/20" : "bg-red-500/20"
                              )}>
                                {entry.type === "earned" ? (
                                  <Trophy className="h-4 w-4 text-green-500" />
                                ) : entry.type === "bonus" ? (
                                  <Gift className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Zap className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{entry.reason}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(entry.timestamp).toLocaleDateString()} at{" "}
                                  {new Date(entry.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "font-bold text-lg",
                              entry.points > 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {entry.points > 0 ? "+" : ""}{entry.points} FP
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Achievement */}
            <Card>
              <CardHeader>
                <CardTitle>Next Achievement</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const nextAchievement = achievements
                    .filter(a => !a.unlocked)
                    .sort((a, b) => {
                      if (a.max_progress && b.max_progress) {
                        return (b.progress! / b.max_progress) - (a.progress! / a.max_progress);
                      }
                      return 0;
                    })[0];

                  if (!nextAchievement) return <p>All achievements unlocked! 🎉</p>;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-muted">
                          {nextAchievement.icon}
                        </div>
                        <div>
                          <p className="font-medium">{nextAchievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {nextAchievement.points_reward} FP
                          </p>
                        </div>
                      </div>
                      {nextAchievement.max_progress && nextAchievement.max_progress > 1 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{nextAchievement.progress}/{nextAchievement.max_progress}</span>
                          </div>
                          <Progress 
                            value={(nextAchievement.progress! / nextAchievement.max_progress) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Points Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { rank: 1, name: "ProGamer123", points: 4567, avatar: "progamer" },
                    { rank: 2, name: "SpeedRunner", points: 4123, avatar: "speedrunner" },
                    { rank: 3, name: "You", points: totalPoints, avatar: "you", isYou: true },
                    { rank: 4, name: "GameMaster", points: 2456, avatar: "gamemaster" },
                  ].map((player) => (
                    <div
                      key={player.rank}
                      className={cn(
                        "flex items-center justify-between p-2 rounded",
                        player.isYou ? "bg-primary/10 border border-primary/20" : ""
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant={
                          player.rank === 1 ? "default" : 
                          player.rank === 2 ? "secondary" : 
                          player.rank === 3 ? "outline" : "outline"
                        }>
                          #{player.rank}
                        </Badge>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Zap className="h-3 w-3 text-yellow-500 mr-1" />
                        {player.points.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Forge Points Shop Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Forge Points Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Premium Badge</span>
                    </div>
                    <div className="text-sm font-medium">200 FP</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Profile Frame</span>
                    </div>
                    <div className="text-sm font-medium">500 FP</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Boost Pack</span>
                    </div>
                    <div className="text-sm font-medium">1000 FP</div>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Visit Shop
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
