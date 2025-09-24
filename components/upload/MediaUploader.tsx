"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  X, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Crop,
  Palette,
  Scissors,
  Download,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  duration?: number;
  thumbnail?: string;
}

interface MediaUploaderProps {
  onFilesUploaded: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

export default function MediaUploader({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 100
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Video player states
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  
  // Editor states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
    }));

    // Generate thumbnails for videos
    newFiles.forEach(async (mediaFile) => {
      if (mediaFile.type === 'video') {
        const thumbnail = await generateVideoThumbnail(mediaFile.file);
        mediaFile.thumbnail = thumbnail;
      }
    });

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(1, video.duration * 0.1);
      });
      
      video.addEventListener('seeked', () => {
        ctx?.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      });
      
      video.src = URL.createObjectURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: maxFiles - files.length,
    maxSize: maxSize * 1024 * 1024,
    disabled: files.length >= maxFiles
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      // Clean up URL
      const removedFile = prev.find(f => f.id === id);
      if (removedFile) {
        URL.revokeObjectURL(removedFile.url);
      }
      return updated;
    });
    
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  };

  const handleVideoControls = (action: 'play' | 'pause' | 'seek', value?: number) => {
    const video = videoRef.current;
    if (!video) return;

    switch (action) {
      case 'play':
        setPlaying(true);
        video.play();
        break;
      case 'pause':
        setPlaying(false);
        video.pause();
        break;
      case 'seek':
        if (value !== undefined) {
          video.currentTime = value;
          setCurrentTime(value);
        }
        break;
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      // Apply filters and transformations here
      const processedFiles = await Promise.all(files.map(async (mediaFile) => {
        if (mediaFile.type === 'image') {
          // Apply image filters
          const processedUrl = await applyImageFilters(mediaFile.url, {
            brightness,
            contrast,
            saturation,
            rotation
          });
          return { ...mediaFile, url: processedUrl };
        }
        return mediaFile;
      }));

      onFilesUploaded(processedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const applyImageFilters = async (imageUrl: string, filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
  }): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
          ctx.save();
          
          if (filters.rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((filters.rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
          }
          
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      
      img.src = imageUrl;
    });
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">
                {isDragActive ? "Drop your files here" : "Upload your gaming moments"}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select videos and images
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxFiles} files, up to {maxSize}MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div 
                    className="relative aspect-square"
                    onClick={() => setSelectedFile(file)}
                  >
                    {file.type === 'video' ? (
                      <div className="relative w-full h-full bg-black">
                        <img
                          src={file.thumbnail || file.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="absolute top-2 left-2 bg-black/80 text-white">
                          <Video className="mr-1 h-3 w-3" />
                          Video
                        </Badge>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={file.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-2 left-2 bg-black/80 text-white">
                          <ImageIcon className="mr-1 h-3 w-3" />
                          Image
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Panel */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview & Edit</h3>
                {selectedFile.type === 'video' ? (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={selectedFile.url}
                      className="w-full aspect-video"
                      onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                      onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
                      onEnded={() => setPlaying(false)}
                      muted={muted}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => handleVideoControls(playing ? 'pause' : 'play')}
                        >
                          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1">
                          <Slider
                            value={[currentTime]}
                            onValueChange={([value]) => handleVideoControls('seek', value)}
                            max={duration}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => setMuted(!muted)}
                        >
                          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={selectedFile.url}
                      alt=""
                      className="w-full max-h-96 object-contain"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                        transform: `rotate(${rotation}deg)`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-6">
                <Tabs defaultValue="filters">
                  <TabsList className="w-full">
                    <TabsTrigger value="filters" className="flex-1">
                      <Palette className="mr-2 h-4 w-4" />
                      Filters
                    </TabsTrigger>
                    <TabsTrigger value="crop" className="flex-1">
                      <Crop className="mr-2 h-4 w-4" />
                      Crop
                    </TabsTrigger>
                    <TabsTrigger value="trim" className="flex-1">
                      <Scissors className="mr-2 h-4 w-4" />
                      Trim
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="filters" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Brightness: {brightness}%</Label>
                        <Slider
                          value={[brightness]}
                          onValueChange={([value]) => setBrightness(value)}
                          max={200}
                          min={0}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label>Contrast: {contrast}%</Label>
                        <Slider
                          value={[contrast]}
                          onValueChange={([value]) => setContrast(value)}
                          max={200}
                          min={0}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label>Saturation: {saturation}%</Label>
                        <Slider
                          value={[saturation]}
                          onValueChange={([value]) => setSaturation(value)}
                          max={200}
                          min={0}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label>Rotation: {rotation}°</Label>
                        <Slider
                          value={[rotation]}
                          onValueChange={([value]) => setRotation(value)}
                          max={360}
                          min={0}
                          step={90}
                        />
                      </div>
                      <Button onClick={resetFilters} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Filters
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="crop" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">Crop functionality coming soon!</p>
                  </TabsContent>

                  <TabsContent value="trim" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">Trim functionality coming soon!</p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setFiles([])}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={uploading}
            className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
