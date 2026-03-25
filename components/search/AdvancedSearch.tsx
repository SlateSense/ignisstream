"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Globe, 
  Trophy, 
  Gamepad2, 
  Users, 
  Star,
  X,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingAnimation } from '@/components/ui/loading-animations';

interface SearchFilters {
  query: string;
  category: 'all' | 'posts' | 'users' | 'games' | 'tournaments' | 'streams';
  game?: string;
  skillLevel: [number, number];
  region?: string;
  language?: string;
  platform?: string[];
  rank?: string;
  isOnline?: boolean;
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy: 'relevant' | 'recent' | 'popular' | 'rating';
}

interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'game' | 'tournament' | 'stream';
  title: string;
  description: string;
  image?: string;
  metadata: Record<string, any>;
  relevanceScore: number;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters, results: SearchResult[]) => void;
  initialQuery?: string;
  placeholder?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  initialQuery = '',
  placeholder = 'Search games, players, posts, and more...',
}) => {
  const { colors, effects } = useTheme();
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    category: 'all',
    skillLevel: [0, 100],
    sortBy: 'relevant',
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Mock data - replace with real API calls
  const games = [
    'Counter-Strike 2', 'Valorant', 'League of Legends', 'Dota 2', 'Overwatch 2',
    'Apex Legends', 'Call of Duty', 'Fortnite', 'Rocket League', 'FIFA 24'
  ];

  const regions = [
    'North America', 'Europe', 'Asia', 'South America', 'Oceania', 'Africa'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Russian',
    'Japanese', 'Korean', 'Chinese', 'Arabic'
  ];

  const platforms = [
    'PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'
  ];

  const ranks = [
    'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ignisstream-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('ignisstream-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Mock search function - replace with real API
  const performSearch = useCallback(async (searchFilters: SearchFilters) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock results based on filters
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'user',
        title: 'ProGamer2024',
        description: 'Diamond rank Valorant player from NA',
        image: '/api/placeholder/64/64',
        metadata: {
          rank: 'Diamond',
          region: 'North America',
          games: ['Valorant', 'Counter-Strike 2']
        },
        relevanceScore: 95
      },
      {
        id: '2',
        type: 'post',
        title: 'Insane Ace Clutch in Valorant Ranked',
        description: 'Just pulled off this crazy 1v5 clutch to win the game!',
        image: '/api/placeholder/300/200',
        metadata: {
          game: 'Valorant',
          likes: 1240,
          comments: 89
        },
        relevanceScore: 88
      },
      // Add more mock results...
    ];

    setResults(mockResults);
    setIsLoading(false);
    onSearch(searchFilters, mockResults);
  }, [onSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.query.trim()) {
        performSearch(filters);
        saveToRecentSearches(filters.query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, performSearch, saveToRecentSearches]);

  // Generate search suggestions
  useEffect(() => {
    if (filters.query.length > 1) {
      const filtered = games.filter(game => 
        game.toLowerCase().includes(filters.query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [filters.query]);

  const updateFilters = (update: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...update }));
  };

  const clearFilters = () => {
    setFilters({
      query: filters.query,
      category: 'all',
      skillLevel: [0, 100],
      sortBy: 'relevant',
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'category' || key === 'sortBy') return false;
    if (key === 'skillLevel') return value[0] !== 0 || value[1] !== 100;
    return value !== undefined && value !== '';
  }).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
            style={{ color: colors.textSecondary }}
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="pl-10 pr-20 h-12 text-lg"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }}
            data-search-input
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2"
              style={{
                backgroundColor: activeFilterCount > 0 ? colors.primary : 'transparent',
                color: activeFilterCount > 0 ? '#ffffff' : colors.textSecondary,
              }}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg shadow-lg border overflow-hidden"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="w-full px-4 py-3 text-left hover:bg-opacity-80 transition-colors flex items-center gap-3"
                  style={{ 
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => {
                    updateFilters({ query: suggestion });
                    setSuggestions([]);
                  }}
                >
                  <Gamepad2 className="w-4 h-4" style={{ color: colors.primary }} />
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'posts', 'users', 'games', 'tournaments', 'streams'] as const).map((category) => (
          <Button
            key={category}
            variant={filters.category === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters({ category })}
            className="capitalize"
          >
            {category === 'all' ? 'All Results' : category}
          </Button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            className="rounded-lg border p-6 space-y-6"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Advanced Filters
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsFilterOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Game Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" 
                       style={{ color: colors.text }}>
                  <Gamepad2 className="w-4 h-4" />
                  Game
                </label>
                <select
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  value={filters.game || ''}
                  onChange={(e) => updateFilters({ game: e.target.value || undefined })}
                >
                  <option value="">All Games</option>
                  {games.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" 
                       style={{ color: colors.text }}>
                  <MapPin className="w-4 h-4" />
                  Region
                </label>
                <select
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  value={filters.region || ''}
                  onChange={(e) => updateFilters({ region: e.target.value || undefined })}
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" 
                       style={{ color: colors.text }}>
                  <Globe className="w-4 h-4" />
                  Language
                </label>
                <select
                  className="w-full p-2 rounded border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  value={filters.language || ''}
                  onChange={(e) => updateFilters({ language: e.target.value || undefined })}
                >
                  <option value="">All Languages</option>
                  {languages.map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              {/* Skill Level Range */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2" 
                       style={{ color: colors.text }}>
                  <Trophy className="w-4 h-4" />
                  Skill Level Range: {filters.skillLevel[0]}% - {filters.skillLevel[1]}%
                </label>
                <Slider
                  value={filters.skillLevel}
                  onValueChange={(value) => updateFilters({ skillLevel: value as [number, number] })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" 
                       style={{ color: colors.text }}>
                  <Users className="w-4 h-4" />
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map(platform => (
                    <Button
                      key={platform}
                      variant={filters.platform?.includes(platform) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = filters.platform || [];
                        const updated = current.includes(platform)
                          ? current.filter(p => p !== platform)
                          : [...current, platform];
                        updateFilters({ platform: updated.length > 0 ? updated : undefined });
                      }}
                      className="text-xs"
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2" 
                     style={{ color: colors.text }}>
                <Star className="w-4 h-4" />
                Sort By
              </label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'relevant', label: 'Most Relevant' },
                  { value: 'recent', label: 'Most Recent' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'rating', label: 'Highest Rated' },
                ] as const).map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filters.sortBy === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilters({ sortBy: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !filters.query && (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            Recent Searches
          </p>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.slice(0, 5).map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ query: search })}
                className="flex items-center gap-2"
              >
                <Zap className="w-3 h-3" />
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingAnimation variant="gaming" text="Searching..." />
        </div>
      )}

      {/* Search Results Preview */}
      {results.length > 0 && !isLoading && (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Found {results.length} results for "{filters.query}"
          </p>
          <div className="grid gap-4">
            {results.slice(0, 3).map((result) => (
              <motion.div
                key={result.id}
                className="p-4 rounded-lg border hover:shadow-lg transition-all cursor-pointer"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-4">
                  {result.image && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold" style={{ color: colors.text }}>
                      {result.title}
                    </h4>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {result.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {result.type}
                      </Badge>
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        {Math.round(result.relevanceScore)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
