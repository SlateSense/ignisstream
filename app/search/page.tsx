"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, Users, Gamepad2, Hash, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PostCard from "@/components/feed/PostCard";
import { mockPosts, mockUsers, mockGames } from "@/lib/mock-data";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  // Filter results based on search query
  const filteredPosts = mockPosts.filter(post =>
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.game?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGames = mockGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allResultsCount = filteredPosts.length + filteredUsers.length + filteredGames.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-gaming-purple/20 via-gaming-pink/20 to-gaming-blue/20 pb-8">
        <div className="container mx-auto px-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-gaming font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Search ForgePlay
              </span>
            </h1>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for posts, users, games..."
                  className="pl-12 pr-24 h-14 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <Button 
                  type="submit"
                  className="absolute right-2 top-2 bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                >
                  Search
                </Button>
              </div>
            </form>

            {searchQuery && (
              <p className="text-center mt-4 text-muted-foreground">
                {allResultsCount} results for "<span className="font-semibold">{searchQuery}</span>"
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        {searchQuery ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full max-w-lg mx-auto">
              <TabsTrigger value="all" className="flex-1">
                All
                <Badge variant="secondary" className="ml-2">
                  {allResultsCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Posts
                <Badge variant="secondary" className="ml-2">
                  {filteredPosts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1">
                <Users className="mr-2 h-4 w-4" />
                Users
                <Badge variant="secondary" className="ml-2">
                  {filteredUsers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex-1">
                <Gamepad2 className="mr-2 h-4 w-4" />
                Games
                <Badge variant="secondary" className="ml-2">
                  {filteredGames.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all" className="mt-8 space-y-8">
              {/* Users Section */}
              {filteredUsers.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.slice(0, 3).map((user) => (
                      <Link key={user.id} href={`/profile/${user.username}`}>
                        <Card className="hover:shadow-lg transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {user.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold">{user.display_name}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                              <Button size="sm">Follow</Button>
                            </div>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Games Section */}
              {filteredGames.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5" />
                    Games
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredGames.slice(0, 4).map((game) => (
                      <Link key={game.id} href={`/games/${game.slug}`}>
                        <Card className="hover:shadow-lg transition-all overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <p className="font-semibold">{game.name}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Section */}
              {filteredPosts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Posts
                  </h2>
                  <div className="max-w-2xl space-y-4">
                    {filteredPosts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} currentUser={mockUsers[0]} />
                    ))}
                  </div>
                </div>
              )}

              {allResultsCount === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">No results found</p>
                    <p className="text-muted-foreground">
                      Try searching with different keywords
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-8">
              <div className="max-w-2xl mx-auto space-y-4">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PostCard post={post} currentUser={mockUsers[0]} />
                    </motion.div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No posts found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Link href={`/profile/${user.username}`}>
                        <Card className="hover:shadow-lg transition-all">
                          <CardContent className="p-6">
                            <div className="text-center">
                              <Avatar className="h-20 w-20 mx-auto mb-4">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {user.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-semibold">{user.display_name}</h3>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                              {user.bio && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                              <Button className="mt-4 w-full">Follow</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No users found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Games Tab */}
            <TabsContent value="games" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Link href={`/games/${game.slug}`}>
                        <Card className="hover:shadow-lg transition-all overflow-hidden">
                          <div className="aspect-video relative">
                            <img
                              src={game.cover_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold">{game.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">Action</Badge>
                              <span className="text-sm text-muted-foreground">
                                10k+ posts
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No games found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Trending Searches */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Searches
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["GTA V", "Valorant", "Epic moments", "Speedrun", "Minecraft builds", "Fortnite wins"].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      onClick={() => {
                        setQuery(term);
                        setSearchQuery(term);
                      }}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Popular Games</h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {mockGames.slice(0, 4).map((game) => (
                    <Link key={game.id} href={`/games/${game.slug}`}>
                      <div className="text-center hover:opacity-80 transition">
                        <img
                          src={game.cover_url}
                          alt={game.name}
                          className="w-full aspect-square object-cover rounded-lg mb-2"
                        />
                        <p className="text-sm font-medium">{game.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
