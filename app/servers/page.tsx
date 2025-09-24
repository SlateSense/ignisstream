"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Crown,
  Shield,
  Star,
  MessageSquare,
  Gamepad2,
  Globe,
  Lock,
  Hash,
  Settings,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Server {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  member_count: number;
  online_count: number;
  is_public: boolean;
  owner_id: string;
  game: {
    id: number;
    name: string;
    cover_url: string;
  } | null;
  owner: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  is_member?: boolean;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
}

export default function ServersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("discover");
  const [createServerOpen, setCreateServerOpen] = useState(false);
  
  // Create server form
  const [newServerName, setNewServerName] = useState("");
  const [newServerDescription, setNewServerDescription] = useState("");
  const [newServerGame, setNewServerGame] = useState("");
  const [newServerPublic, setNewServerPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadServers();
  }, [user]);

  const loadServers = async () => {
    try {
      const supabase = createClient();
      const { data: serversData, error } = await supabase
        .from('servers')
        .select(`
          *,
          owner:profiles!owner_id(username, display_name, avatar_url),
          game:games(id, name, cover_url),
          member_count,
          is_member:server_members!left(user_id)
        `);

      if (error) throw error;

      // Process server data and check membership
      const processedServers = serversData?.map(server => ({
        ...server,
        online_count: Math.floor(server.member_count * 0.3), // Approximate online count
        is_member: server.is_member?.some((member: any) => member.user_id === user?.id) || false,
        role: server.owner_id === user?.id ? 'owner' as const : 
              server.is_member?.find((member: any) => member.user_id === user?.id)?.role || undefined
      })) || [];

      setServers(processedServers);
      setFilteredServers(processedServers);
    } catch (error) {
      console.error('Error loading servers:', error);
      toast({
        title: "Error loading servers",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = servers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(server => 
        server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        server.game?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Game filter
    if (gameFilter !== "all") {
      filtered = filtered.filter(server => server.game?.id.toString() === gameFilter);
    }

    // Type filter
    if (typeFilter === "public") {
      filtered = filtered.filter(server => server.is_public);
    } else if (typeFilter === "private") {
      filtered = filtered.filter(server => !server.is_public);
    } else if (typeFilter === "joined") {
      filtered = filtered.filter(server => server.is_member);
    }

    setFilteredServers(filtered);
  }, [servers, searchQuery, gameFilter, typeFilter]);

  const handleJoinServer = async (serverId: number) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // Add user to server_members
      const { error } = await supabase
        .from('server_members')
        .insert({
          server_id: serverId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update local state
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { ...server, is_member: true, role: 'member' as const, member_count: server.member_count + 1 }
          : server
      ));
      
      toast({
        title: "Joined server!",
        description: "Welcome to the community. Start connecting with fellow gamers!",
      });
    } catch (error) {
      console.error('Error joining server:', error);
      toast({
        title: "Failed to join server",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveServer = async (serverId: number) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // Remove user from server_members
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', serverId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setServers(prev => prev.map(server => 
        server.id === serverId 
          ? { ...server, is_member: false, role: undefined, member_count: server.member_count - 1 }
          : server
      ));
      
      toast({
        title: "Left server",
        description: "You've left the community.",
      });
    } catch (error) {
      console.error('Error leaving server:', error);
      toast({
        title: "Failed to leave server",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleCreateServer = async () => {
    if (!newServerName.trim()) {
      toast({
        title: "Server name required",
        description: "Please enter a name for your server.",
        variant: "destructive"
      });
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      const supabase = createClient();

      // Create server in database
      const { data: newServer, error } = await supabase
        .from('servers')
        .insert({
          name: newServerName,
          description: newServerDescription,
          icon_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${newServerName}`,
          owner_id: user.id,
          game_id: newServerGame ? parseInt(newServerGame) : null,
          member_count: 1,
          is_public: newServerPublic
        })
        .select(`
          *,
          owner:profiles!owner_id(username, display_name, avatar_url),
          game:games(id, name, cover_url)
        `)
        .single();

      if (error) throw error;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: newServer.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding server owner:', memberError);
      }

      // Add to local state
      const serverWithMembership = {
        ...newServer,
        online_count: 1,
        is_member: true,
        role: 'owner' as const
      };

      setServers(prev => [serverWithMembership, ...prev]);
      setCreateServerOpen(false);
      
      // Reset form
      setNewServerName("");
      setNewServerDescription("");
      setNewServerGame("");
      setNewServerPublic(true);
      
      toast({
        title: "Server created!",
        description: "Your gaming community is ready to grow.",
      });
    } catch (error) {
      console.error('Error creating server:', error);
      toast({
        title: "Failed to create server",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const myServers = servers.filter(server => server.is_member);

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-gaming font-bold mb-2">
                <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                  Gaming Servers
                </span>
              </h1>
              <p className="text-muted-foreground">
                Join communities, find teammates, and connect with gamers
              </p>
            </div>
            <Dialog open={createServerOpen} onOpenChange={setCreateServerOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Server
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Gaming Server</DialogTitle>
                  <DialogDescription>
                    Start your own gaming community and connect with like-minded players
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="server-name">Server Name *</Label>
                    <Input
                      id="server-name"
                      placeholder="Enter server name"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="server-description">Description</Label>
                    <Textarea
                      id="server-description"
                      placeholder="Describe your server..."
                      value={newServerDescription}
                      onChange={(e) => setNewServerDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="server-game">Game (Optional)</Label>
                    <Select value={newServerGame} onValueChange={setNewServerGame}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Grand Theft Auto V</SelectItem>
                        <SelectItem value="2">Valorant</SelectItem>
                        <SelectItem value="3">Minecraft</SelectItem>
                        <SelectItem value="4">Fortnite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="server-public"
                      checked={newServerPublic}
                      onCheckedChange={setNewServerPublic}
                    />
                    <Label htmlFor="server-public">Public Server</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateServerOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateServer}
                    disabled={creating}
                    className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                  >
                    {creating ? "Creating..." : "Create Server"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="1">GTA V</SelectItem>
                  <SelectItem value="2">Valorant</SelectItem>
                  <SelectItem value="3">Minecraft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="joined">Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="discover">
              <Globe className="mr-2 h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="joined">
              <Users className="mr-2 h-4 w-4" />
              My Servers ({myServers.length})
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(activeTab === "joined" ? myServers : filteredServers).map((server, index) => (
                <motion.div
                  key={server.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={server.icon_url} />
                            <AvatarFallback>
                              <Users className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">{server.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              {!server.is_public && <Lock className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-sm text-muted-foreground">
                                {server.member_count.toLocaleString()} members
                              </span>
                              <span className="text-sm text-green-500">
                                • {server.online_count} online
                              </span>
                            </div>
                          </div>
                        </div>
                        {server.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                        {server.role === 'admin' && <Shield className="h-4 w-4 text-blue-500" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {server.description}
                      </p>
                      
                      {server.game && (
                        <div className="flex items-center space-x-2">
                          <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{server.game.name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={server.owner.avatar_url} />
                            <AvatarFallback>{server.owner.username[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            by {server.owner.display_name}
                          </span>
                        </div>
                        
                        {server.is_member ? (
                          <div className="flex gap-2">
                            <Link href={`/servers/${server.id}`}>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="mr-2 h-3 w-3" />
                                Chat
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLeaveServer(server.id)}
                            >
                              Leave
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoinServer(server.id)}
                            className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                          >
                            <UserPlus className="mr-2 h-3 w-3" />
                            Join
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredServers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No servers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or create your own server
                </p>
                <Button 
                  onClick={() => setCreateServerOpen(true)}
                  className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Server
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
