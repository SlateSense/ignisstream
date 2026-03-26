"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Camera,
  Save,
  Upload,
  X,
  User,
  Gamepad2,
  Globe,
  MapPin,
  Calendar,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGameSearch } from "@/lib/hooks/useGameSearch";
import { createClient } from "@/lib/supabase/client";

interface GamingPreferences {
  favoriteGames: string[];
  favoriteGenres: string[];
  playStyle: string;
  preferredPlatforms: string[];
  competitiveLevel: string;
  availableHours: string;
}

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
  website?: string;
}

export default function EditProfilePage() {
  const { toast } = useToast();
  const { user, profile: userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Basic profile info
  const [profile, setProfile] = useState({
    username: userProfile?.username || "",
    displayName: userProfile?.display_name || "",
    bio: userProfile?.bio || "",
    location: "",
    website: "",
    avatarUrl: userProfile?.avatar_url || ""
  });

  // Gaming preferences
  const [gamingPrefs, setGamingPrefs] = useState<GamingPreferences>({
    favoriteGames: [],
    favoriteGenres: [],
    playStyle: "casual",
    preferredPlatforms: [],
    competitiveLevel: "casual",
    availableHours: "1-3"
  });

  // Social links
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showLocation: true,
    showSocialLinks: true,
    showGamingStats: true
  });
  const [favoriteGameFilters, setFavoriteGameFilters] = useState({
    genre: "all",
    platform: "all",
    releaseWindow: "all"
  });
  const {
    query: favoriteGameQuery,
    setQuery: setFavoriteGameQuery,
    games: favoriteGameResults,
    loading: loadingFavoriteGames
  } = useGameSearch({
    limit: 20,
    filters: favoriteGameFilters,
  });

  const genres = [
    "FPS", "MOBA", "Battle Royale", "RPG", "MMO", "Strategy", "Racing",
    "Sports", "Simulation", "Puzzle", "Horror", "Adventure", "Fighting",
    "Platformer", "Indie"
  ];

  const platforms = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];
  
  const competitiveLevels = ["Casual", "Competitive", "Semi-Pro", "Professional"];
  
  const playStyles = ["Solo", "Team Player", "Leader", "Support", "Flexible"];

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfile({
        username: userProfile.username || "",
        displayName: userProfile.display_name || "",
        bio: userProfile.bio || "",
        location: "",
        website: "",
        avatarUrl: userProfile.avatar_url || ""
      });
    }
  }, [userProfile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile({ ...profile, avatarUrl: data.publicUrl });
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save gaming preferences and other extended data
      const { error: extendedError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          gaming_preferences: gamingPrefs,
          social_links: socialLinks,
          privacy_settings: privacy,
          profile_extended: {
            location: profile.location,
            website: profile.website
          },
          updated_at: new Date().toISOString()
        });

      if (extendedError) throw extendedError;

      await refreshProfile();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      router.push(`/profile/${profile.username || user.id}`);
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

  const addFavoriteGame = (game: string) => {
    if (!gamingPrefs.favoriteGames.includes(game) && gamingPrefs.favoriteGames.length < 10) {
      setGamingPrefs({
        ...gamingPrefs,
        favoriteGames: [...gamingPrefs.favoriteGames, game]
      });
    }
  };

  const removeFavoriteGame = (game: string) => {
    setGamingPrefs({
      ...gamingPrefs,
      favoriteGames: gamingPrefs.favoriteGames.filter(g => g !== game)
    });
  };

  const toggleGenre = (genre: string) => {
    const isSelected = gamingPrefs.favoriteGenres.includes(genre);
    if (isSelected) {
      setGamingPrefs({
        ...gamingPrefs,
        favoriteGenres: gamingPrefs.favoriteGenres.filter(g => g !== genre)
      });
    } else if (gamingPrefs.favoriteGenres.length < 8) {
      setGamingPrefs({
        ...gamingPrefs,
        favoriteGenres: [...gamingPrefs.favoriteGenres, genre]
      });
    }
  };

  const togglePlatform = (platform: string) => {
    const isSelected = gamingPrefs.preferredPlatforms.includes(platform);
    if (isSelected) {
      setGamingPrefs({
        ...gamingPrefs,
        preferredPlatforms: gamingPrefs.preferredPlatforms.filter(p => p !== platform)
      });
    } else {
      setGamingPrefs({
        ...gamingPrefs,
        preferredPlatforms: [...gamingPrefs.preferredPlatforms, platform]
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-muted-foreground">You need to be signed in to edit your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
              className="bg-background/50 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-gaming font-bold mb-2">
                <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                  Edit Profile
                </span>
              </h1>
              <p className="text-muted-foreground">
                Customize your gaming profile and preferences
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {profile.displayName?.[0] || profile.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-2 -right-2 cursor-pointer">
                    <div className="bg-primary hover:bg-primary/90 rounded-full p-2 shadow-lg transition-colors">
                      <Camera className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Profile Picture</p>
                  <p className="text-sm text-muted-foreground">
                    Click the camera icon to upload a new avatar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                  {uploading && (
                    <p className="text-xs text-primary">Uploading...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    placeholder="epicgamer123"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your unique identifier on the platform
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="Epic Gamer"
                  />
                  <p className="text-xs text-muted-foreground">
                    How your name appears to others
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell the gaming community about yourself..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {profile.bio?.length || 0}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaming Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Gaming Preferences
              </CardTitle>
              <CardDescription>
                Help others understand your gaming style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Favorite Games */}
              <div className="space-y-3">
                <Label>Favorite Games (up to 10)</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {gamingPrefs.favoriteGames.map((game) => (
                    <Badge 
                      key={game} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFavoriteGame(game)}
                    >
                      {game} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Search games to add..."
                  value={favoriteGameQuery}
                  onChange={(event) => setFavoriteGameQuery(event.target.value)}
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Select value={favoriteGameFilters.genre} onValueChange={(value) => setFavoriteGameFilters((prev) => ({ ...prev, genre: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      <SelectItem value="shooter">Shooter</SelectItem>
                      <SelectItem value="mmo">MMO</SelectItem>
                      <SelectItem value="strategy">Strategy</SelectItem>
                      <SelectItem value="battle royale">Battle Royale</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={favoriteGameFilters.platform} onValueChange={(value) => setFavoriteGameFilters((prev) => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="pc">PC</SelectItem>
                      <SelectItem value="playstation">PlayStation</SelectItem>
                      <SelectItem value="xbox">Xbox</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={favoriteGameFilters.releaseWindow} onValueChange={(value) => setFavoriteGameFilters((prev) => ({ ...prev, releaseWindow: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Release" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Release</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 rounded-lg border border-dashed p-3">
                  {loadingFavoriteGames ? (
                    <p className="text-sm text-muted-foreground">Searching games...</p>
                  ) : favoriteGameResults.length > 0 ? (
                    favoriteGameResults
                      .filter((game) => !gamingPrefs.favoriteGames.includes(game.name))
                      .slice(0, 8)
                      .map((game) => (
                        <button
                          key={`${game.source}-${game.id}`}
                          type="button"
                          onClick={() => addFavoriteGame(game.name)}
                          className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{game.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[game.genre, game.platforms?.join(", "), game.release_date?.slice(0, 4)].filter(Boolean).join(" • ") || "No metadata available"}
                            </p>
                          </div>
                          <span className="text-xs text-primary">Add</span>
                        </button>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No matching games available right now.</p>
                  )}
                </div>
              </div>

              {/* Favorite Genres */}
              <div className="space-y-3">
                <Label>Favorite Genres (up to 8)</Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => {
                    const isSelected = gamingPrefs.favoriteGenres.includes(genre);
                    return (
                      <Button
                        key={genre}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleGenre(genre)}
                        disabled={!isSelected && gamingPrefs.favoriteGenres.length >= 8}
                        className={isSelected ? "bg-gradient-to-r from-gaming-purple to-gaming-pink" : ""}
                      >
                        {genre}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Platforms */}
              <div className="space-y-3">
                <Label>Preferred Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => {
                    const isSelected = gamingPrefs.preferredPlatforms.includes(platform);
                    return (
                      <Button
                        key={platform}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => togglePlatform(platform)}
                        className={isSelected ? "bg-gradient-to-r from-gaming-purple to-gaming-pink" : ""}
                      >
                        {platform}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Gaming Style & Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Play Style</Label>
                  <Select value={gamingPrefs.playStyle} onValueChange={(value) => setGamingPrefs({ ...gamingPrefs, playStyle: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {playStyles.map((style) => (
                        <SelectItem key={style} value={style.toLowerCase()}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Competitive Level</Label>
                  <Select value={gamingPrefs.competitiveLevel} onValueChange={(value) => setGamingPrefs({ ...gamingPrefs, competitiveLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {competitiveLevels.map((level) => (
                        <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Available Hours/Day</Label>
                  <Select value={gamingPrefs.availableHours} onValueChange={(value) => setGamingPrefs({ ...gamingPrefs, availableHours: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 hours</SelectItem>
                      <SelectItem value="3-6">3-6 hours</SelectItem>
                      <SelectItem value="6+">6+ hours</SelectItem>
                      <SelectItem value="weekend">Weekends only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Links
              </CardTitle>
              <CardDescription>
                Connect your social profiles and gaming accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  twitter: "Twitter/X",
                  instagram: "Instagram", 
                  youtube: "YouTube",
                  twitch: "Twitch",
                  discord: "Discord",
                  website: "Personal Website"
                }).map(([platform, label]) => (
                  <div key={platform} className="space-y-2">
                    <Label htmlFor={platform}>{label}</Label>
                    <Input
                      id={platform}
                      value={socialLinks[platform as keyof SocialLinks] || ""}
                      onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                      placeholder={
                        platform === 'discord' ? 'username#1234' :
                        platform === 'website' ? 'https://yoursite.com' :
                        `@${platform === 'twitter' ? 'username' : 'username'}`
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control what information is visible on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                showEmail: "Show email address",
                showLocation: "Show location",
                showSocialLinks: "Show social links",
                showGamingStats: "Show gaming statistics"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="font-normal">{label}</Label>
                  <Switch
                    id={key}
                    checked={privacy[key as keyof typeof privacy]}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, [key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || uploading}
              className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
