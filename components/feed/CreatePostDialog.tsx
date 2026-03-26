"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Video, Gamepad2, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useGameSearch } from "@/lib/hooks/useGameSearch";
import { useToast } from "@/components/ui/use-toast";
import { useAchievements } from "@/components/achievements/AchievementProvider";
import { useHashtags } from "@/components/hashtags/HashtagProvider";
import { cn } from "@/lib/utils";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: (post: any) => void;
}

// Games will be loaded from database

export default function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { toast } = useToast();
  const { checkAchievements } = useAchievements();
  const { extractHashtags, addHashtagsToPost } = useHashtags();
  const [caption, setCaption] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gameFilters, setGameFilters] = useState({
    genre: "all",
    platform: "all",
    releaseWindow: "all"
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const { query: gameQuery, setQuery: setGameQuery, games, loading: loadingGames } = useGameSearch({
    limit: 20,
    filters: gameFilters,
  });

  const selectedGameResult = games.find((game) => String(game.id) === selectedGame);

  const getVideoDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to inspect video duration"));
      };
      video.src = objectUrl;
    });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxFiles: 4,
    maxSize: Number.MAX_SAFE_INTEGER,
    onDrop: async (acceptedFiles) => {
      const validFiles: File[] = [];

      for (const file of acceptedFiles) {
        if (!file.type.startsWith("video/")) {
          validFiles.push(file);
          continue;
        }

        try {
          const duration = await getVideoDuration(file);
          if (duration > 24 * 60 * 60) {
            toast({
              title: "Video too long",
              description: `${file.name} exceeds the 24-hour maximum duration.`,
              variant: "destructive"
            });
            continue;
          }

          validFiles.push(file);
        } catch (error: any) {
          toast({
            title: "Video validation failed",
            description: error.message || `We couldn't verify ${file.name}.`,
            variant: "destructive"
          });
        }
      }

      setFiles(validFiles);

      const newPreviews = validFiles.map(file => {
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
    setUploadProgress(10);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      setUploadProgress(45);

      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          caption: caption.trim(),
          content: caption.trim(),
          game_id: /^\d+$/.test(selectedGame) ? Number(selectedGame) : null,
          visibility: "public"
        })
        .select(`
          *,
          author:profiles!author_id(id, username, display_name, avatar_url)
        `)
        .single();

      if (postError) throw postError;
      setUploadProgress(80);

      // Reset form
      setCaption("");
      setSelectedGame("");
      setFiles([]);
      setPreviews([]);
      setUploadProgress(100);
      
      // Extract and add hashtags
      const hashtags = extractHashtags(caption);
      if (hashtags.length > 0) {
        await addHashtagsToPost(post.id.toString(), hashtags);
      }
      
      onPostCreated(post);
      
      // Check for achievements after post creation
      setTimeout(() => {
        checkAchievements();
      }, 1000);
      
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
      setTimeout(() => setUploadProgress(0), 400);
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
            <div className="flex items-center gap-2 mt-2">
              <Input
                placeholder="Search global game listings..."
                value={gameQuery}
                onChange={(e) => setGameQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Select value={gameFilters.genre} onValueChange={(value) => setGameFilters((prev) => ({ ...prev, genre: value }))}>
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
              <Select value={gameFilters.platform} onValueChange={(value) => setGameFilters((prev) => ({ ...prev, platform: value }))}>
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
              <Select value={gameFilters.releaseWindow} onValueChange={(value) => setGameFilters((prev) => ({ ...prev, releaseWindow: value }))}>
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
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="mt-3">
                <SelectValue placeholder="Select a game">
                  {selectedGame && (
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {selectedGameResult?.name || selectedGame}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingGames ? (
                  <SelectItem value="loading" disabled>Searching games...</SelectItem>
                ) : games.length > 0 ? (
                  games.map((game) => (
                    <SelectItem key={game.id} value={String(game.id)}>
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{game.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {[game.genre, game.platforms?.[0], game.release_date?.slice(0, 4)].filter(Boolean).join(" • ") || "No metadata available"}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No games found</SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Suggestions update as you type and pull from connected catalog sources.
              </p>
              <div className="grid gap-2">
                {games.slice(0, 4).map((game) => (
                  <button
                    key={`${game.source}-${game.id}`}
                    type="button"
                    onClick={() => setSelectedGame(String(game.id))}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                      selectedGame === String(game.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded bg-secondary flex items-center justify-center">
                      {game.cover_url ? (
                        <img src={game.cover_url} alt={game.name} className="h-full w-full object-cover" />
                      ) : (
                        <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{game.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[game.genre, game.platforms?.join(", "), game.release_date?.slice(0, 4)].filter(Boolean).join(" • ") || "No metadata available"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
                    Large uploads supported. Videos must stay under 24 hours.
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
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting {uploadProgress > 0 ? `${uploadProgress}%` : "..."}
              </>
            ) : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
