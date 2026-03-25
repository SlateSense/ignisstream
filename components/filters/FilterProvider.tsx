"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FilterState {
  game: string | null;
  skillLevel: string | null;
  region: string | null;
  contentType: string | null;
  playstyle: string[] | null;
  availability: string | null;
  language: string | null;
}

export interface FilterOptions {
  games: Array<{ id: string; name: string; cover_url?: string }>;
  skillLevels: Array<{ value: string; label: string; range: [number, number] }>;
  regions: Array<{ value: string; label: string; timezone?: string }>;
  contentTypes: Array<{ value: string; label: string; icon?: string }>;
  playstyles: Array<{ value: string; label: string; description?: string }>;
  languages: Array<{ value: string; label: string; code: string }>;
}

interface FilterContextType {
  filters: FilterState;
  filterOptions: FilterOptions;
  updateFilter: (key: keyof FilterState, value: any) => void;
  resetFilters: () => void;
  applyFilters: (data: any[]) => any[];
  loading: boolean;
  getFilterSummary: () => string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
}

const defaultFilters: FilterState = {
  game: null,
  skillLevel: null,
  region: null,
  contentType: null,
  playstyle: null,
  availability: null,
  language: null,
};

const skillLevels = [
  { value: 'bronze', label: 'Bronze', range: [0, 999] as [number, number] },
  { value: 'silver', label: 'Silver', range: [1000, 1499] as [number, number] },
  { value: 'gold', label: 'Gold', range: [1500, 1999] as [number, number] },
  { value: 'platinum', label: 'Platinum', range: [2000, 2499] as [number, number] },
  { value: 'diamond', label: 'Diamond', range: [2500, 2999] as [number, number] },
  { value: 'master', label: 'Master', range: [3000, 3499] as [number, number] },
  { value: 'legendary', label: 'Legendary', range: [3500, 5000] as [number, number] },
];

const regions = [
  { value: 'na-west', label: 'North America West', timezone: 'PST' },
  { value: 'na-east', label: 'North America East', timezone: 'EST' },
  { value: 'eu-west', label: 'Europe West', timezone: 'CET' },
  { value: 'eu-east', label: 'Europe East', timezone: 'EET' },
  { value: 'asia-pacific', label: 'Asia Pacific', timezone: 'JST' },
  { value: 'south-america', label: 'South America', timezone: 'BRT' },
  { value: 'oceania', label: 'Oceania', timezone: 'AEST' },
  { value: 'middle-east', label: 'Middle East', timezone: 'GST' },
];

const contentTypes = [
  { value: 'all', label: 'All Content', icon: '📱' },
  { value: 'video', label: 'Videos', icon: '🎥' },
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'stream', label: 'Live Streams', icon: '📹' },
  { value: 'clip', label: 'Clips', icon: '✂️' },
  { value: 'achievement', label: 'Achievements', icon: '🏆' },
  { value: 'review', label: 'Reviews', icon: '⭐' },
];

const playstyles = [
  { value: 'casual', label: 'Casual', description: 'Relaxed gaming experience' },
  { value: 'competitive', label: 'Competitive', description: 'Focused on winning and improvement' },
  { value: 'social', label: 'Social', description: 'Enjoys team communication' },
  { value: 'strategic', label: 'Strategic', description: 'Tactical and analytical approach' },
  { value: 'aggressive', label: 'Aggressive', description: 'Fast-paced and action-oriented' },
  { value: 'supportive', label: 'Supportive', description: 'Helps teammates succeed' },
];

const languages = [
  { value: 'en', label: 'English', code: 'en' },
  { value: 'es', label: 'Spanish', code: 'es' },
  { value: 'fr', label: 'French', code: 'fr' },
  { value: 'de', label: 'German', code: 'de' },
  { value: 'pt', label: 'Portuguese', code: 'pt' },
  { value: 'ru', label: 'Russian', code: 'ru' },
  { value: 'ja', label: 'Japanese', code: 'ja' },
  { value: 'ko', label: 'Korean', code: 'ko' },
  { value: 'zh', label: 'Chinese', code: 'zh' },
];

export default function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    games: [],
    skillLevels: skillLevels,
    regions: regions,
    contentTypes: contentTypes,
    playstyles: playstyles,
    languages: languages,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Load available games
      const { data: games, error } = await supabase
        .from('games')
        .select('id, name, cover_url')
        .order('name')
        .limit(50);

      if (error) throw error;

      setFilterOptions(prev => ({
        ...prev,
        games: games || []
      }));
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const applyFilters = (data: any[]): any[] => {
    return data.filter(item => {
      // Game filter
      if (filters.game && item.game_id !== filters.game && item.game?.id !== filters.game) {
        return false;
      }

      // Skill level filter
      if (filters.skillLevel && item.skill_rating) {
        const skillLevelConfig = skillLevels.find(sl => sl.value === filters.skillLevel);
        if (skillLevelConfig) {
          const [min, max] = skillLevelConfig.range;
          if (item.skill_rating < min || item.skill_rating > max) {
            return false;
          }
        }
      }

      // Region filter
      if (filters.region && item.region !== filters.region && item.location !== filters.region) {
        return false;
      }

      // Content type filter
      if (filters.contentType && filters.contentType !== 'all') {
        if (filters.contentType === 'video' && !item.assets?.some((a: any) => a.asset?.type === 'video')) {
          return false;
        }
        if (filters.contentType === 'image' && !item.assets?.some((a: any) => a.asset?.type === 'image')) {
          return false;
        }
        if (filters.contentType === 'stream' && item.type !== 'stream') {
          return false;
        }
      }

      // Playstyle filter
      if (filters.playstyle && filters.playstyle.length > 0) {
        if (!item.playstyle || !filters.playstyle.some(ps => item.playstyle?.includes(ps))) {
          return false;
        }
      }

      // Availability filter
      if (filters.availability && item.availability !== filters.availability) {
        return false;
      }

      // Language filter
      if (filters.language && item.languages && !item.languages.includes(filters.language)) {
        return false;
      }

      return true;
    });
  };

  const getFilterSummary = (): string => {
    const activeFilters = [];
    
    if (filters.game) {
      const game = filterOptions.games.find(g => g.id === filters.game);
      activeFilters.push(`Game: ${game?.name || 'Unknown'}`);
    }
    
    if (filters.skillLevel) {
      const skill = skillLevels.find(s => s.value === filters.skillLevel);
      activeFilters.push(`Skill: ${skill?.label || 'Unknown'}`);
    }
    
    if (filters.region) {
      const region = regions.find(r => r.value === filters.region);
      activeFilters.push(`Region: ${region?.label || 'Unknown'}`);
    }
    
    if (filters.contentType && filters.contentType !== 'all') {
      const contentType = contentTypes.find(ct => ct.value === filters.contentType);
      activeFilters.push(`Type: ${contentType?.label || 'Unknown'}`);
    }
    
    if (filters.playstyle && filters.playstyle.length > 0) {
      activeFilters.push(`Playstyle: ${filters.playstyle.join(', ')}`);
    }

    return activeFilters.length > 0 
      ? `${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''} active`
      : 'No filters applied';
  };

  const value = {
    filters,
    filterOptions,
    updateFilter,
    resetFilters,
    applyFilters,
    loading,
    getFilterSummary,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}
