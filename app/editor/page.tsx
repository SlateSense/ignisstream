"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Scissors,
  Layers,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Download,
  Wand2,
  Sparkles,
  Split,
  Merge,
  RotateCcw,
  RotateCw,
  Crop,
  Filter,
  Type,
  Music,
  Mic,
  Image,
  Video,
  Zap,
  Save,
  Upload,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Clock,
  Target,
  Award,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { VideoEngine, Timeline, VideoLayer, VideoFilter, RenderSettings } from "@/lib/video/video-engine";
import { VideoAnalyzer, AnalysisResult } from "@/lib/ai/video-analyzer";

interface EditorState {
  timeline: Timeline;
  selectedLayer: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  zoomLevel: number;
  tool: 'select' | 'cut' | 'text' | 'effects';
  aiAnalysis: AnalysisResult | null;
  exportSettings: RenderSettings;
}

export default function ClipEditor() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const videoEngineRef = useRef<VideoEngine | null>(null);
  const videoAnalyzerRef = useRef<VideoAnalyzer | null>(null);
  
  const [editorState, setEditorState] = useState<EditorState>({
    timeline: {
      id: 'main-timeline',
      duration: 0,
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      tracks: [],
      currentTime: 0,
      zoomLevel: 1,
      snapToGrid: true,
      magneticTimeline: true
    },
    selectedLayer: null,
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    zoomLevel: 1,
    tool: 'select',
    aiAnalysis: null,
    exportSettings: {
      format: 'mp4',
      quality: 'high',
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      bitrate: 8000,
      codec: 'h264',
      audioCodec: 'aac',
      audioBitrate: 192
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (canvasRef.current) {
      videoEngineRef.current = new VideoEngine(canvasRef.current);
      videoAnalyzerRef.current = new VideoAnalyzer();
    }

    return () => {
      videoEngineRef.current?.dispose();
    };
  }, []);

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...editorState });
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => prev + 1);
  }, [editorState, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setEditorState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setEditorState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const handleFileUpload = async (files: FileList) => {
    const videoFiles = Array.from(files).filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    setUploadedFiles(prev => [...prev, ...videoFiles]);
    
    if (videoFiles.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${videoFiles.length} file(s) added to media library`,
      });
    }
  };

  const analyzeWithAI = async (file: File) => {
    if (!videoAnalyzerRef.current) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await videoAnalyzerRef.current.analyzeVideo(file, {
        enableHighlightDetection: true,
        enableGameDetection: true,
        enableEmotionAnalysis: true,
        enablePerformanceTracking: true
      });
      
      setEditorState(prev => ({ ...prev, aiAnalysis: analysis }));
      
      toast({
        title: "AI Analysis Complete",
        description: `Found ${analysis.analysis.highlights.length} highlights and ${analysis.analysis.scenes.length} scenes`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze video with AI",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAIEdits = async () => {
    if (!editorState.aiAnalysis || !videoAnalyzerRef.current) return;
    
    const autoEdits = await videoAnalyzerRef.current.autoEditVideo(editorState.aiAnalysis);
    
    // Apply the AI-generated edits to the timeline
    autoEdits.forEach(edit => {
      if (edit.type === 'cut' && edit.parameters.remove) {
        // Remove the specified time range
        // Implementation would modify the timeline
      }
    });
    
    toast({
      title: "AI Edits Applied",
      description: `Applied ${autoEdits.length} AI-generated edits`,
    });
  };

  const addLayerToTimeline = (file: File, trackId: string) => {
    const layer: VideoLayer = {
      id: `layer-${Date.now()}`,
      name: file.name,
      startTime: editorState.currentTime,
      endTime: editorState.currentTime + 10, // Default 10 seconds
      duration: 10,
      source: file,
      type: file.type.startsWith('video/') ? 'clip' : 'image',
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      opacity: 1,
      filters: [],
      keyframes: [],
      enabled: true
    };

    videoEngineRef.current?.addLayer(trackId, layer);
    saveToHistory();
    
    toast({
      title: "Layer Added",
      description: `${file.name} added to timeline`,
    });
  };

  const exportVideo = async () => {
    if (!videoEngineRef.current) return;
    
    try {
      const blob = await videoEngineRef.current.exportVideo(editorState.exportSettings);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ignisstream-edit-${Date.now()}.${editorState.exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your video has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export video",
        variant: "destructive"
      });
    }
  };

  const playPause = () => {
    if (editorState.isPlaying) {
      videoEngineRef.current?.pause();
    } else {
      videoEngineRef.current?.play();
    }
    
    setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-600 mx-2" />
          
          <div className="flex items-center gap-1">
            {(['select', 'cut', 'text', 'effects'] as const).map((tool) => (
              <Button
                key={tool}
                variant={editorState.tool === tool ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorState(prev => ({ ...prev, tool }))}
              >
                {tool === 'select' && <Move className="h-4 w-4" />}
                {tool === 'cut' && <Scissors className="h-4 w-4" />}
                {tool === 'text' && <Type className="h-4 w-4" />}
                {tool === 'effects' && <Zap className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-900 text-purple-100">
            AI-Powered Editor
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            onClick={exportVideo}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Media Library & Tools */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs defaultValue="media" className="flex-1">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="ai">AI Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="media" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      Drop files here or click to upload
                    </p>
                  </label>
                </div>
                
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-600"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                        }}
                      >
                        <div className="aspect-video bg-gray-600 rounded mb-2 flex items-center justify-center">
                          {file.type.startsWith('video/') ? (
                            <Video className="h-6 w-6 text-gray-400" />
                          ) : (
                            <Image className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="flex-1 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {[
                    { name: 'Blur', icon: Filter },
                    { name: 'Color Correction', icon: Zap },
                    { name: 'Chromakey', icon: Eye },
                    { name: 'Transition', icon: Split },
                    { name: 'Glow', icon: Sparkles },
                    { name: 'Motion Blur', icon: Move },
                    { name: 'Shake', icon: Target },
                    { name: 'Zoom', icon: ZoomIn }
                  ].map((effect) => (
                    <Button
                      key={effect.name}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <effect.icon className="h-4 w-4 mr-2" />
                      {effect.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="audio" className="flex-1 p-4">
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Music className="h-4 w-4 mr-2" />
                  Music Library
                </Button>
                <Button className="w-full" variant="outline">
                  <Mic className="h-4 w-4 mr-2" />
                  Record Voiceover
                </Button>
                
                <div className="space-y-2">
                  <Label>Master Volume</Label>
                  <Slider
                    value={[editorState.volume * 100]}
                    onValueChange={([value]) => 
                      setEditorState(prev => ({ ...prev, volume: value / 100 }))
                    }
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="flex-1 p-4">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={() => uploadedFiles[0] && analyzeWithAI(uploadedFiles[0])}
                      disabled={isAnalyzing || uploadedFiles.length === 0}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
                    </Button>
                    
                    {editorState.aiAnalysis && (
                      <>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={applyAIEdits}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Auto Edit
                        </Button>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Highlights:</span>
                            <span>{editorState.aiAnalysis.analysis.highlights.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Scenes:</span>
                            <span>{editorState.aiAnalysis.analysis.scenes.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span>{Math.round(editorState.aiAnalysis.confidence * 100)}%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Detect Highlights
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Performance Analysis
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Auto Sync Audio
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              width={1920}
              height={1080}
            />
            
            {/* Play Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorState(prev => ({ ...prev, currentTime: 0 }))}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={playPause}
              >
                {editorState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => videoEngineRef.current?.stop()}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorState(prev => ({ ...prev, currentTime: prev.timeline.duration }))}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-600 mx-2" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditorState(prev => ({ ...prev, volume: prev.volume > 0 ? 0 : 1 }))}
              >
                {editorState.volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              <span className="text-sm text-white">
                {Math.floor(editorState.currentTime / 60)}:
                {Math.floor(editorState.currentTime % 60).toString().padStart(2, '0')} /
                {Math.floor(editorState.timeline.duration / 60)}:
                {Math.floor(editorState.timeline.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-80 bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[editorState.zoomLevel]}
                  onValueChange={([value]) => 
                    setEditorState(prev => ({ ...prev, zoomLevel: value }))
                  }
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-32"
                />
                <Button variant="ghost" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Layers className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={timelineRef}
              className="bg-gray-900 rounded-lg p-4 h-48 overflow-auto"
              onDrop={(e) => {
                e.preventDefault();
                const fileIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const file = uploadedFiles[fileIndex];
                if (file) {
                  // Add to first available track or create new one
                  addLayerToTimeline(file, 'video-track-1');
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Timeline tracks would be rendered here */}
              <div className="text-center text-gray-500 mt-16">
                <Layers className="h-8 w-8 mx-auto mb-2" />
                <p>Drop media files here to add to timeline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Layer Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editorState.selectedLayer ? (
                    <>
                      <div className="space-y-2">
                        <Label>Opacity</Label>
                        <Slider defaultValue={[100]} max={100} step={1} />
                      </div>
                      <div className="space-y-2">
                        <Label>Scale</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Width" />
                          <Input placeholder="Height" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="X" />
                          <Input placeholder="Y" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Rotation</Label>
                        <Slider defaultValue={[0]} min={-180} max={180} step={1} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Select a layer to edit properties
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Export Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <select className="w-full bg-gray-600 border-gray-500 rounded px-3 py-2">
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="webm">WebM</option>
                      <option value="gif">GIF</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <select className="w-full bg-gray-600 border-gray-500 rounded px-3 py-2">
                      <option value="ultra">Ultra (4K)</option>
                      <option value="high">High (1080p)</option>
                      <option value="medium">Medium (720p)</option>
                      <option value="low">Low (480p)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frame Rate</Label>
                    <select className="w-full bg-gray-600 border-gray-500 rounded px-3 py-2">
                      <option value="60">60 FPS</option>
                      <option value="30">30 FPS</option>
                      <option value="24">24 FPS</option>
                    </select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export Video
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
