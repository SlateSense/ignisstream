"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Link2, 
  CreditCard,
  HelpCircle,
  LogOut,
  Camera,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, profile: userProfile, refreshProfile } = useAuth();
  const supabase = createClient();
  
  const [profile, setProfile] = useState({
    username: userProfile?.username || "",
    displayName: userProfile?.display_name || "",
    bio: userProfile?.bio || "",
    email: user?.email || "",
    avatarUrl: userProfile?.avatar_url || ""
  });

  const [loading, setLoading] = useState(false);

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile && user) {
      setProfile({
        username: userProfile.username || "",
        displayName: userProfile.display_name || "",
        bio: userProfile.bio || "",
        email: user.email || "",
        avatarUrl: userProfile.avatar_url || ""
      });
    }
  }, [userProfile, user]);

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showOnlineStatus: true,
    allowMessages: "everyone",
    showActivity: true,
    showStats: true
  });

  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailEnabled: false,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    gameUpdates: true,
    weeklyDigest: false
  });

  const [connections, setConnections] = useState({
    steam: { connected: false, username: "" },
    discord: { connected: true, username: "EpicGamer#1234" },
    twitch: { connected: false, username: "" },
    youtube: { connected: false, username: "" }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.displayName,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // For now, we'll store privacy settings in a separate table
      // This would need to be added to your database schema
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_settings: privacy,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleConnect = (platform: string) => {
    toast({
      title: `Connecting to ${platform}`,
      description: "Redirecting to authentication...",
    });
  };

  const handleDisconnect = (platform: string) => {
    setConnections(prev => ({
      ...prev,
      [platform.toLowerCase()]: { connected: false, username: "" }
    }));
    toast({
      title: `Disconnected from ${platform}`,
      description: `Your ${platform} account has been unlinked.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-gaming font-bold mb-2">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="connections">
              <Link2 className="mr-2 h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and public information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback>
                      {profile.username?.[0]?.toUpperCase() || profile.displayName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button>
                      <Camera className="mr-2 h-4 w-4" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="epicgamer123"
                    />
                    <p className="text-sm text-muted-foreground">
                      Your unique username. This cannot be changed often.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder="Epic Gamer"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="gamer@example.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      {profile.bio?.length || 0}/500 characters
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={loading} className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control who can see your content and interact with you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profileVisibility">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Control who can view your profile
                      </p>
                    </div>
                    <Select value={privacy.profileVisibility} onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="followers">Followers</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="onlineStatus">Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see when you're online
                      </p>
                    </div>
                    <Switch
                      id="onlineStatus"
                      checked={privacy.showOnlineStatus}
                      onCheckedChange={(checked: boolean) => setPrivacy({ ...privacy, showOnlineStatus: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="messages">Who can message you</Label>
                      <p className="text-sm text-muted-foreground">
                        Control who can send you direct messages
                      </p>
                    </div>
                    <Select value={privacy.allowMessages} onValueChange={(value) => setPrivacy({ ...privacy, allowMessages: value })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="followers">Followers</SelectItem>
                        <SelectItem value="none">No one</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activity">Show Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your recent activity on your profile
                      </p>
                    </div>
                    <Switch
                      id="activity"
                      checked={privacy.showActivity}
                      onCheckedChange={(checked: boolean) => setPrivacy({ ...privacy, showActivity: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stats">Show Stats</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your follower count and other stats
                      </p>
                    </div>
                    <Switch
                      id="stats"
                      checked={privacy.showStats}
                      onCheckedChange={(checked: boolean) => setPrivacy({ ...privacy, showStats: checked })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePrivacy} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notifications.pushEnabled}
                      onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, pushEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailEnabled}
                      onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, emailEnabled: checked })}
                    />
                  </div>

                  <Separator />

                  <h3 className="font-semibold">Activity Notifications</h3>

                  <div className="space-y-3">
                    {Object.entries({
                      likes: "Someone likes your post",
                      comments: "Someone comments on your post",
                      follows: "Someone follows you",
                      mentions: "Someone mentions you",
                      gameUpdates: "Updates from games you follow",
                      weeklyDigest: "Weekly activity digest"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key} className="font-normal">{label}</Label>
                        <Switch
                          id={key}
                          checked={notifications[key as keyof typeof notifications] as boolean}
                          onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, [key]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Connections */}
          <TabsContent value="connections" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Link your gaming accounts and social profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(connections).map(([platform, data]) => (
                  <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        platform === 'steam' ? 'bg-gray-800' :
                        platform === 'discord' ? 'bg-indigo-600' :
                        platform === 'twitch' ? 'bg-purple-600' :
                        'bg-red-600'
                      }`}>
                        <span className="text-white font-bold text-sm">
                          {platform[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{platform}</p>
                        {data.connected ? (
                          <p className="text-sm text-muted-foreground">{data.username}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {data.connected ? (
                      <Button
                        variant="outline"
                        onClick={() => handleDisconnect(platform)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(platform)}
                        className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how ForgePlay looks for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose your preferred color scheme
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <div className="h-8 w-8 rounded-full bg-white border" />
                        <span>Light</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2 border-primary">
                        <div className="h-8 w-8 rounded-full bg-black" />
                        <span>Dark</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-white to-black" />
                        <span>Auto</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Accent Color</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose your accent color
                    </p>
                    <div className="flex gap-2">
                      <button className="h-10 w-10 rounded-full bg-gradient-to-r from-gaming-purple to-gaming-pink ring-2 ring-primary ring-offset-2" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-gradient-to-r from-gaming-purple/10 to-gaming-pink/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">ForgePlay Pro</h3>
                      <p className="text-sm text-muted-foreground">
                        Unlock premium features and support the platform
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink">
                      PRO
                    </Badge>
                  </div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      Unlimited video uploads
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      Advanced video editor
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      Priority support
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      Exclusive badges and rewards
                    </li>
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                    Upgrade to Pro - $9.99/month
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Payment Methods</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                    <Button variant="outline" className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="mt-8 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
