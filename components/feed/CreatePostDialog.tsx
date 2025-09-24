"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Video, Gamepad2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: (post: any) => void;
}

// Games will be loaded from database

export default function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [games, setGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Load games from database
  useEffect(() => {
    const loadGames = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('games')
          .select('id, name, slug')
          .order('name')
          .limit(50);
        
        if (error) throw error;
        setGames(data || []);
      } catch (error) {
        console.error('Error loading games:', error);
        // Fallback games if database fails
        setGames([
          { id: 1, name: "Grand Theft Auto V", slug: "gta-v" },
          { id: 2, name: "Valorant", slug: "valorant" },
          { id: 3, name: "Fortnite", slug: "fortnite" },
          { id: 4, name: "Minecraft", slug: "minecraft" },
          { id: 5, name: "Apex Legends", slug: "apex-legends" },
        ]);
      } finally {
        setLoadingGames(false);
      }
    };

    loadGames();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxFiles: 4,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
      
      // Create previews
      const newPreviews = acceptedFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return ''; // For videos, we'll show a placeholder
      });
      setPreviews(newPreviews);
    }
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && files.length === 0) {
      toast({
        title: "Post is empty",
        description: "Please add a caption or media to your post",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Create the post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          caption: caption.trim(),
          game_id: selectedGame ? parseInt(selectedGame) : null,
          visibility: "public"
        })
        .select(`
          *,
          author:profiles!author_id(*),
          game:games(*)
        `)
        .single();

      if (postError) throw postError;

      // Upload files if any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${post.id}/${Date.now()}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}: ${uploadError.message}`,
              variant: "destructive"
            });
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

          // Create asset record
          const { data: asset, error: assetError } = await supabase
            .from("assets")
            .insert({
              type: file.type.startsWith('image/') ? 'image' : 'video',
              storage_path: publicUrl,
              status: 'ready'
            })
            .select()
            .single();

          if (assetError) {
            console.error("Asset error:", assetError);
            continue;
          }

          // Link asset to post
          await supabase
            .from("post_assets")
            .insert({
              post_id: post.id,
              asset_id: asset.id,
              sort_order: i
            });
        }
      }

      // Reset form
      setCaption("");
      setSelectedGame("");
      setFiles([]);
      setPreviews([]);
      
      onPostCreated(post);
      
      toast({
        title: "Post created!",
        description: "Your gaming moment has been shared.",
      });
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Your Gaming Moment</DialogTitle>
          <DialogDescription>
            Upload your epic clips, screenshots, or share your thoughts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Caption */}
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="What's on your mind, gamer?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px] mt-2"
            />
          </div>

          {/* Game Selection */}
          <div>
            <Label htmlFor="game">Game (Optional)</Label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a game">
                  {selectedGame && (
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {games.find(g => g.id.toString() === selectedGame)?.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingGames ? (
                  <SelectItem value="" disabled>Loading games...</SelectItem>
                ) : games.length > 0 ? (
                  games.map((game) => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" />
                        {game.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No games available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div>
            <Label>Media (Optional)</Label>
            <div
              {...getRootProps()}
              className={cn(
                "mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                files.length > 0 && "border-solid"
              )}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? "Drop files here..." : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images or videos up to 100MB
                  </p>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={previews[index]}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-32 bg-secondary rounded flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs p-1 rounded truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading || (!caption.trim() && files.length === 0)}
            className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
          >
            {uploading ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
