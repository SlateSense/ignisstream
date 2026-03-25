"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { motion } from "framer-motion";
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2,
  Trophy,
  Settings,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// Mock data removed - implementing empty state
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, loadNotifications } = useNotifications();
  const [filter, setFilter] = useState("all");
  
  // Load notifications when page mounts
  useEffect(() => {
    loadNotifications();
  }, []);
  
  // Notification settings
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    reposts: true,
    achievements: true,
    updates: true,
    email: false
  });

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    return notif.type === filter;
  });

  // Functions are provided by NotificationProvider

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "repost":
        return <Share2 className="h-5 w-5 text-purple-500" />;
      case "achievement":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationText = (notif: any) => {
    switch (notif.type) {
      case "like":
        return (
          <>
            <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:underline">
              {notif.actor.display_name}
            </Link>
            {" liked your "}
            <Link href={`/post/${notif.post?.id}`} className="text-primary hover:underline">
              post
            </Link>
          </>
        );
      case "comment":
        return (
          <>
            <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:underline">
              {notif.actor.display_name}
            </Link>
            {" commented on your "}
            <Link href={`/post/${notif.post?.id}`} className="text-primary hover:underline">
              post
            </Link>
            {notif.comment && (
              <div className="mt-1 text-sm text-muted-foreground">
                "{notif.comment.body}"
              </div>
            )}
          </>
        );
      case "follow":
        return (
          <>
            <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:underline">
              {notif.actor.display_name}
            </Link>
            {" started following you"}
          </>
        );
      case "repost":
        return (
          <>
            <Link href={`/profile/${notif.actor.username}`} className="font-semibold hover:underline">
              {notif.actor.display_name}
            </Link>
            {" reposted your "}
            <Link href={`/post/${notif.post?.id}`} className="text-primary hover:underline">
              post
            </Link>
          </>
        );
      default:
        return "New notification";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-gaming font-bold mb-2">
                <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                  Notifications
                </span>
              </h1>
              <p className="text-muted-foreground">
                Stay updated with your gaming community
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.read)}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
              <Link href="/settings/notifications">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-gaming-purple to-gaming-pink">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="like" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  Likes
                </TabsTrigger>
                <TabsTrigger value="comment" className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="mt-6 space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "hover:shadow-lg transition-all",
                        !notif.read && "border-primary/50 bg-primary/5"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notif.actor.avatar_url} />
                              <AvatarFallback>
                                {notif.actor.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getNotificationIcon(notif.type)}
                                    <span className="text-sm text-muted-foreground">
                                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </span>
                                    {!notif.read && (
                                      <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-xs">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm">
                                    {getNotificationText(notif)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!notif.read && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => markAsRead(notif.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => deleteNotification(notif.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {(notif.post as any)?.thumbnail && (notif.post as any)?.id && (
                                <Link href={`/post/${(notif.post as any).id}`}>
                                  <img
                                    src={(notif.post as any).thumbnail}
                                    alt=""
                                    className="mt-2 rounded-lg w-full max-w-sm h-32 object-cover hover:opacity-90 transition"
                                  />
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No notifications yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Settings Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="likes" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Likes
                  </Label>
                  <Switch
                    id="likes"
                    checked={settings.likes}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, likes: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="comments" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments
                  </Label>
                  <Switch
                    id="comments"
                    checked={settings.comments}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, comments: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="follows" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    New Followers
                  </Label>
                  <Switch
                    id="follows"
                    checked={settings.follows}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, follows: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="achievements" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Achievements
                  </Label>
                  <Switch
                    id="achievements"
                    checked={settings.achievements}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, achievements: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <Switch
                    id="email"
                    checked={settings.email}
                    onCheckedChange={(checked: boolean) => setSettings({ ...settings, email: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Activity Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-semibold">{notifications.filter(n => {
                    const today = new Date();
                    const notifDate = new Date(n.created_at);
                    return notifDate.toDateString() === today.toDateString();
                  }).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-semibold">{notifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Unread</span>
                  <span className="font-semibold text-primary">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
