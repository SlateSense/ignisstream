"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  Headphones, 
  Settings, 
  Volume2, 
  Keyboard,
  Zap,
  TestTube,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Waves,
  Filter,
  Gauge,
  MapPin,
  Save,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { voiceManager, VoiceSettings as IVoiceSettings, AudioStats } from '@/lib/voice/voice-manager';

interface VoiceSettingsProps {
  onClose?: () => void;
}

export default function VoiceSettings({ onClose }: VoiceSettingsProps) {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<IVoiceSettings>(voiceManager.getSettings());
  const [audioDevices, setAudioDevices] = useState<{ input: MediaDeviceInfo[]; output: MediaDeviceInfo[] }>({ input: [], output: [] });
  const [audioStats, setAudioStats] = useState<AudioStats>({ inputLevel: 0, outputLevel: 0, packetLoss: 0, latency: 0, jitter: 0, bitrate: 0 });
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const hotkeyInputRef = useRef<HTMLDivElement>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadAudioDevices();
    checkMicrophonePermission();
    
    // Start audio stats monitoring
    statsIntervalRef.current = setInterval(() => {
      setAudioStats(voiceManager.getAudioStats());
    }, 100);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  const loadAudioDevices = async () => {
    try {
      const devices = await voiceManager.getAudioDevices();
      setAudioDevices(devices);
    } catch (error) {
      console.error('Failed to load audio devices:', error);
      toast({
        title: "Audio devices unavailable",
        description: "Cannot access audio devices. Check browser permissions.",
        variant: "destructive"
      });
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermission(permission.state as any);
      
      permission.onchange = () => {
        setMicPermission(permission.state as any);
      };
    } catch (error) {
      console.error('Failed to check microphone permission:', error);
    }
  };

  const updateSetting = <K extends keyof IVoiceSettings>(key: K, value: IVoiceSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const startHotkeyRecording = () => {
    setIsRecordingHotkey(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      updateSetting('pushToTalkKey', e.code);
      setIsRecordingHotkey(false);
      
      document.removeEventListener('keydown', handleKeyDown, true);
      
      toast({
        title: "Hotkey updated",
        description: `Push-to-talk key set to ${getKeyDisplayName(e.code)}`,
      });
    };

    document.addEventListener('keydown', handleKeyDown, true);
    
    // Auto-cancel after 10 seconds
    setTimeout(() => {
      if (isRecordingHotkey) {
        setIsRecordingHotkey(false);
        document.removeEventListener('keydown', handleKeyDown, true);
      }
    }, 10000);
  };

  const getKeyDisplayName = (keyCode: string): string => {
    const keyMap: Record<string, string> = {
      'KeyV': 'V',
      'Space': 'Space',
      'ShiftLeft': 'Left Shift',
      'ShiftRight': 'Right Shift',
      'ControlLeft': 'Left Ctrl',
      'ControlRight': 'Right Ctrl',
      'AltLeft': 'Left Alt',
      'AltRight': 'Right Alt',
      'CapsLock': 'Caps Lock',
      'Tab': 'Tab',
      'Enter': 'Enter',
      'Backspace': 'Backspace',
    };
    
    return keyMap[keyCode] || keyCode.replace(/^Key|^Digit/, '');
  };

  const testMicrophone = async () => {
    setIsTesting(true);
    
    try {
      // Request microphone access for testing
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          deviceId: settings.inputDeviceId !== 'default' ? { exact: settings.inputDeviceId } : undefined
        } 
      });
      
      // Test for 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setIsTesting(false);
        
        toast({
          title: "Microphone test completed",
          description: "Your microphone is working properly.",
        });
      }, 3000);
    } catch (error) {
      setIsTesting(false);
      toast({
        title: "Microphone test failed",
        description: "Cannot access microphone. Check device and permissions.",
        variant: "destructive"
      });
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      await loadAudioDevices();
    } catch (error) {
      setMicPermission('denied');
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access in your browser settings.",
        variant: "destructive"
      });
    }
  };

  const saveSettings = () => {
    voiceManager.updateSettings(settings);
    setHasChanges(false);
    
    toast({
      title: "Settings saved",
      description: "Voice settings have been updated.",
    });
  };

  const resetSettings = () => {
    const defaultSettings = voiceManager.getSettings();
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const getInputLevelColor = (level: number) => {
    if (level > 80) return 'bg-red-500';
    if (level > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getConnectionQuality = () => {
    if (audioStats.packetLoss > 5 || audioStats.latency > 200) return 'poor';
    if (audioStats.packetLoss > 1 || audioStats.latency > 100) return 'good';
    return 'excellent';
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Voice & Audio Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your voice chat experience and audio devices
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary">Unsaved changes</Badge>
              )}
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Microphone Permission Alert */}
      {micPermission !== 'granted' && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Microphone access is required for voice chat. 
                {micPermission === 'denied' && ' Please enable it in your browser settings.'}
              </span>
              {micPermission === 'prompt' && (
                <Button size="sm" onClick={requestMicrophonePermission}>
                  Grant Access
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Audio Devices</TabsTrigger>
          <TabsTrigger value="controls">Voice Controls</TabsTrigger>
          <TabsTrigger value="spatial">Spatial Audio</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Audio Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Input Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Microphone</Label>
                <Select
                  value={settings.inputDeviceId}
                  onValueChange={(value) => updateSetting('inputDeviceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Microphone</SelectItem>
                    {audioDevices.input.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Input Volume</Label>
                  <span className="text-sm text-muted-foreground">{settings.inputVolume}%</span>
                </div>
                <Slider
                  value={[settings.inputVolume]}
                  onValueChange={(value) => updateSetting('inputVolume', value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Input Level</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{Math.round(audioStats.inputLevel)}%</span>
                    <Button size="sm" variant="outline" onClick={testMicrophone} disabled={isTesting}>
                      {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={audioStats.inputLevel} className="h-3" />
                  <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-150 ${getInputLevelColor(audioStats.inputLevel)}`} 
                       style={{ width: `${Math.min(audioStats.inputLevel, 100)}%` }} />
                </div>
                {audioStats.inputLevel > 90 && (
                  <p className="text-xs text-red-500">Input level too high - may cause distortion</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Output Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Headphones/Speakers</Label>
                <Select
                  value={settings.outputDeviceId}
                  onValueChange={(value) => updateSetting('outputDeviceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select output device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Output</SelectItem>
                    {audioDevices.output.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Output ${device.deviceId.slice(0, 8)}...`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Output Volume</Label>
                  <span className="text-sm text-muted-foreground">{settings.outputVolume}%</span>
                </div>
                <Slider
                  value={[settings.outputVolume]}
                  onValueChange={(value) => updateSetting('outputVolume', value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Controls Tab */}
        <TabsContent value="controls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activation Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push-to-Talk</Label>
                    <p className="text-sm text-muted-foreground">
                      Hold a key to transmit voice
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushToTalkEnabled}
                    onCheckedChange={(checked) => updateSetting('pushToTalkEnabled', checked)}
                  />
                </div>

                {settings.pushToTalkEnabled && (
                  <div className="space-y-2">
                    <Label>Push-to-Talk Key</Label>
                    <div className="flex items-center gap-2">
                      <div
                        ref={hotkeyInputRef}
                        className={`flex-1 p-3 border rounded-md text-center cursor-pointer transition-colors ${
                          isRecordingHotkey 
                            ? 'border-primary bg-primary/10' 
                            : 'border-input hover:border-primary'
                        }`}
                        onClick={startHotkeyRecording}
                      >
                        {isRecordingHotkey ? (
                          <div className="flex items-center justify-center gap-2">
                            <Keyboard className="h-4 w-4 animate-pulse" />
                            <span>Press any key...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Keyboard className="h-4 w-4" />
                            <span>{getKeyDisplayName(settings.pushToTalkKey)}</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={startHotkeyRecording}>
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Voice Activity Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect when you're speaking
                    </p>
                  </div>
                  <Switch
                    checked={settings.voiceActivationEnabled}
                    onCheckedChange={(checked) => updateSetting('voiceActivationEnabled', checked)}
                  />
                </div>

                {settings.voiceActivationEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Activation Threshold</Label>
                      <span className="text-sm text-muted-foreground">{settings.voiceActivationThreshold} dB</span>
                    </div>
                    <Slider
                      value={[settings.voiceActivationThreshold]}
                      onValueChange={(value) => updateSetting('voiceActivationThreshold', value[0])}
                      min={-60}
                      max={-10}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values = more sensitive (may pick up background noise)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audio Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Noise Suppression</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce background noise
                  </p>
                </div>
                <Switch
                  checked={settings.noiseSuppression}
                  onCheckedChange={(checked) => updateSetting('noiseSuppression', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Echo Cancellation</Label>
                  <p className="text-sm text-muted-foreground">
                    Prevent audio feedback
                  </p>
                </div>
                <Switch
                  checked={settings.echoCancellation}
                  onCheckedChange={(checked) => updateSetting('echoCancellation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatic Gain Control</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically adjust input volume
                  </p>
                </div>
                <Switch
                  checked={settings.autoGainControl}
                  onCheckedChange={(checked) => updateSetting('autoGainControl', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spatial Audio Tab */}
        <TabsContent value="spatial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Spatial Audio Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Spatial Audio</Label>
                  <p className="text-sm text-muted-foreground">
                    3D positional audio for tactical games
                  </p>
                </div>
                <Switch
                  checked={settings.spatialAudioEnabled}
                  onCheckedChange={(checked) => updateSetting('spatialAudioEnabled', checked)}
                />
              </div>

              {settings.spatialAudioEnabled && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Maximum Distance</Label>
                      <span className="text-sm text-muted-foreground">{settings.maxDistance}m</span>
                    </div>
                    <Slider
                      value={[settings.maxDistance]}
                      onValueChange={(value) => updateSetting('maxDistance', value[0])}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum distance at which players can be heard
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Rolloff Factor</Label>
                      <span className="text-sm text-muted-foreground">{settings.rolloffFactor}</span>
                    </div>
                    <Slider
                      value={[settings.rolloffFactor]}
                      onValueChange={(value) => updateSetting('rolloffFactor', value[0])}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      How quickly audio volume decreases with distance
                    </p>
                  </div>

                  <Alert>
                    <Waves className="h-4 w-4" />
                    <AlertDescription>
                      Spatial audio works best with headphones and in supported games.
                      Your position will be automatically synchronized during matches.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Connection Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latency</Label>
                  <div className={`text-2xl font-bold ${getConnectionQualityColor(getConnectionQuality())}`}>
                    {audioStats.latency}ms
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Packet Loss</Label>
                  <div className={`text-2xl font-bold ${getConnectionQualityColor(getConnectionQuality())}`}>
                    {audioStats.packetLoss.toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Jitter</Label>
                  <div className="text-2xl font-bold">
                    {audioStats.jitter}ms
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Bitrate</Label>
                  <div className="text-2xl font-bold">
                    {(audioStats.bitrate / 1000).toFixed(1)} kbps
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  getConnectionQuality() === 'excellent' ? 'bg-green-500' :
                  getConnectionQuality() === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium capitalize">
                  Connection Quality: {getConnectionQuality()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={loadAudioDevices} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Audio Devices
              </Button>
              
              <Button variant="outline" onClick={testMicrophone} disabled={isTesting} className="w-full">
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Microphone
              </Button>
              
              <Button variant="outline" onClick={resetSettings} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetSettings}>
                Reset
              </Button>
              <Button onClick={saveSettings} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
