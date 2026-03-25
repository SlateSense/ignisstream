"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Search,
  Gamepad2,
  MapPin,
  Trophy,
  Users,
  MessageSquare,
  Globe,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useFilters } from './FilterProvider';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showQuickFilters?: boolean;
}

export default function AdvancedFilterPanel({ 
  isOpen, 
  onClose, 
  showQuickFilters = true 
}: AdvancedFilterPanelProps) {
  const { 
    filters, 
    filterOptions, 
    updateFilter, 
    resetFilters, 
    getFilterSummary,
    loading 
  } = useFilters();
  
  const [searchGame, setSearchGame] = useState('');
  const [skillRange, setSkillRange] = useState([500, 3000]);

  const filteredGames = filterOptions.games.filter(game =>
    game.name.toLowerCase().includes(searchGame.toLowerCase())
  );

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== null && (Array.isArray(value) ? value.length > 0 : true)
  );

  const handlePlaystyleToggle = (playstyle: string) => {
    const current = filters.playstyle || [];
    const updated = current.includes(playstyle)
      ? current.filter(p => p !== playstyle)
      : [...current, playstyle];
    updateFilter('playstyle', updated.length > 0 ? updated : null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Advanced Filters</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{getFilterSummary()}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Filters */}
              {showQuickFilters && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={filters.contentType === 'video' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('contentType', filters.contentType === 'video' ? null : 'video')}
                      >
                        🎥 Videos
                      </Button>
                      <Button
                        variant={filters.contentType === 'stream' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('contentType', filters.contentType === 'stream' ? null : 'stream')}
                      >
                        📹 Streams
                      </Button>
                      <Button
                        variant={filters.availability === 'online' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('availability', filters.availability === 'online' ? null : 'online')}
                      >
                        🟢 Online
                      </Button>
                      <Button
                        variant={filters.skillLevel === 'diamond' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('skillLevel', filters.skillLevel === 'diamond' ? null : 'diamond')}
                      >
                        💎 Diamond+
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Game Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Game
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search games..."
                      className="pl-10"
                      value={searchGame}
                      onChange={(e) => setSearchGame(e.target.value)}
                    />
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    <div 
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary cursor-pointer"
                      onClick={() => updateFilter('game', null)}
                    >
                      <Checkbox 
                        checked={filters.game === null}
                        onChange={() => {}}
                      />
                      <Label className="cursor-pointer">All Games</Label>
                    </div>
                    
                    {filteredGames.slice(0, 10).map((game) => (
                      <div 
                        key={game.id}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary cursor-pointer"
                        onClick={() => updateFilter('game', filters.game === game.id ? null : game.id)}
                      >
                        <Checkbox 
                          checked={filters.game === game.id}
                          onChange={() => {}}
                        />
                        <div className="flex items-center space-x-2">
                          {game.cover_url && (
                            <img 
                              src={game.cover_url} 
                              alt={game.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <Label className="cursor-pointer">{game.name}</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skill Level Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Skill Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select 
                    value={filters.skillLevel || 'all'} 
                    onValueChange={(value) => updateFilter('skillLevel', value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Skill Levels</SelectItem>
                      {filterOptions.skillLevels.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value}>
                          {skill.label} ({skill.range[0]} - {skill.range[1]} SR)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Custom Range: {skillRange[0]} - {skillRange[1]} SR
                    </Label>
                    <Slider
                      value={skillRange}
                      onValueChange={setSkillRange}
                      min={0}
                      max={5000}
                      step={50}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Region Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Region
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={filters.region || 'all'} 
                    onValueChange={(value) => updateFilter('region', value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {filterOptions.regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label} ({region.timezone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Content Type Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Content Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.contentTypes.map((type) => (
                      <Button
                        key={type.value}
                        variant={filters.contentType === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('contentType', filters.contentType === type.value ? null : type.value)}
                        className="justify-start"
                      >
                        <span className="mr-2">{type.icon}</span>
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Playstyle Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Playstyle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filterOptions.playstyles.map((style) => (
                    <div key={style.value} className="flex items-start space-x-2">
                      <Checkbox
                        checked={filters.playstyle?.includes(style.value) || false}
                        onCheckedChange={() => handlePlaystyleToggle(style.value)}
                      />
                      <div className="flex-1">
                        <Label className="cursor-pointer font-medium">{style.label}</Label>
                        {style.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {style.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Language Filter */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={filters.language || 'all'} 
                    onValueChange={(value) => updateFilter('language', value === 'all' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      {filterOptions.languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Apply Button */}
              <div className="sticky bottom-0 pt-4 bg-background">
                <Button 
                  onClick={onClose} 
                  className="w-full bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
