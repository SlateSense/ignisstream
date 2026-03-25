"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Video,
  Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function EditPostPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    caption: "",
    game_id: "",
    visibility: "public",
    tags: [] as string[]
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    loadPost();
    loadGames();
  }, [user, postId]);

  const loadPost = async () => {
    try {
      const supabase = createClient();
      
      const { data: postData, error } = await supabase
        .from('posts')
        .select(`
          *,
          game:games(id, name),
          assets(*)
        `)
        .eq('id', postId)
        .eq('author_id', user!.id) // Ensure user owns the post
        .single();

      if (error) {
        console.error('Error loading post:', error);
        toast({
          title: "Error",
          description: "Failed to load post or you don't have permission to edit it.",
          variant: "destructive"
        });
        router.back();
        return;
      }

      setPost(postData);
      setFormData({
        caption: postData.caption || "",
        game_id: postData.game?.id || "",
        visibility: postData.visibility || "public",
        tags: postData.tags || []
      });
      
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: "Error",
        description: "Failed to load post.",
        variant: "destructive"
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('games')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('posts')
        .update({
          caption: formData.caption,
          game_id: formData.game_id || null,
          visibility: formData.visibility,
          tags: formData.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('author_id', user!.id);

      if (error) throw error;

      toast({
        title: "Post updated",
        description: "Your post has been successfully updated.",
      });

      router.back();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-gaming text-center">
          <div className="h-8 w-8 bg-primary rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Post not found</h2>
            <p className="text-muted-foreground">The post you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get primary asset for preview
  const primaryAsset = post.assets?.[0];

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
                  Edit Post
                </span>
              </h1>
              <p className="text-muted-foreground">
                Update your gaming moment
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Post Details</CardTitle>
              <CardDescription>
                Update your post information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Tell us about this gaming moment..."
                  className="min-h-[120px]"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.caption.length}/2000 characters
                </p>
              </div>

              {/* Game Selection */}
              <div className="space-y-2">
                <Label>Game</Label>
                <Select value={formData.game_id} onValueChange={(value) => setFormData({ ...formData, game_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No game selected</SelectItem>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Everyone can see</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  placeholder="gaming, clutch, highlight (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Add tags to help others discover your post
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How your post will look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Media Preview */}
              {primaryAsset && (
                <div className="relative aspect-video bg-secondary overflow-hidden rounded-lg">
                  {primaryAsset.type === "image" ? (
                    <>
                      <ImageIcon className="absolute top-2 left-2 h-5 w-5 text-white/80 z-10" />
                      <Image
                        src={primaryAsset.storage_path || primaryAsset.thumbnail_url || "/placeholder-image.jpg"}
                        alt="Gaming moment"
                        fill
                        className="object-cover"
                      />
                    </>
                  ) : primaryAsset.type === "video" ? (
                    <>
                      <Video className="absolute top-2 left-2 h-5 w-5 text-white/80 z-10" />
                      {primaryAsset.thumbnail_url ? (
                        <Image
                          src={primaryAsset.thumbnail_url}
                          alt="Video preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No preview available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Caption Preview */}
              {formData.caption && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Caption:</h4>
                  <p className="text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-lg">
                    {formData.caption}
                  </p>
                </div>
              )}

              {/* Game Preview */}
              {formData.game_id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gamepad2 className="h-4 w-4" />
                  <span>
                    {games.find(g => g.id === formData.game_id)?.name || "Unknown Game"}
                  </span>
                </div>
              )}

              {/* Tags Preview */}
              {formData.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
