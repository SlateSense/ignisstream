export interface GameTheme {
  id: string;
  name: string;
  description: string;
  category: 'fantasy' | 'cyberpunk' | 'military' | 'retro' | 'space' | 'horror';
  colors: {
    // Base colors
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    
    // Backgrounds
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceHover: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Interactive elements
    border: string;
    borderHover: string;
    shadow: string;
    
    // Game-specific accent colors
    gameAccent1: string;
    gameAccent2: string;
    gameAccent3: string;
  };
  gradients: {
    primary: string[];
    secondary: string[];
    hero: string[];
    card: string[];
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: string;
  };
  effects: {
    blur: string;
    glow: string;
    neon?: string;
  };
}

export const gameThemes: Record<string, GameTheme> = {
  // Cyberpunk Theme
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'Neon-lit dystopian future aesthetic',
    category: 'cyberpunk',
    colors: {
      primary: '#00ffff',
      primaryHover: '#00d4ff',
      secondary: '#ff0080',
      accent: '#ffff00',
      
      background: '#0a0a0f',
      backgroundSecondary: '#111118',
      surface: '#1a1a24',
      surfaceHover: '#2a2a34',
      
      text: '#ffffff',
      textSecondary: '#b3b3cc',
      textMuted: '#666680',
      
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0055',
      info: '#0088ff',
      
      border: '#333344',
      borderHover: '#555566',
      shadow: 'rgba(0, 255, 255, 0.3)',
      
      gameAccent1: '#ff00ff',
      gameAccent2: '#00ffaa',
      gameAccent3: '#ffaa00',
    },
    gradients: {
      primary: ['#00ffff', '#ff0080'],
      secondary: ['#ff0080', '#ffff00'],
      hero: ['#0a0a0f', '#1a1a24', '#2a2a34'],
      card: ['rgba(26, 26, 36, 0.8)', 'rgba(42, 42, 52, 0.8)'],
    },
    animations: {
      duration: { fast: 150, normal: 300, slow: 500 },
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    effects: {
      blur: 'blur(10px)',
      glow: '0 0 20px rgba(0, 255, 255, 0.5)',
      neon: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
    },
  },

  // Fantasy Theme
  fantasy: {
    id: 'fantasy',
    name: 'Mystical Realm',
    description: 'Magical fantasy world with ethereal colors',
    category: 'fantasy',
    colors: {
      primary: '#9d4edd',
      primaryHover: '#8b39d1',
      secondary: '#f72585',
      accent: '#4cc9f0',
      
      background: '#0f0b1a',
      backgroundSecondary: '#1a1528',
      surface: '#2d2438',
      surfaceHover: '#3d3448',
      
      text: '#f8f0ff',
      textSecondary: '#d4c2ff',
      textMuted: '#9680b8',
      
      success: '#52b788',
      warning: '#f77f00',
      error: '#d62828',
      info: '#4895ef',
      
      border: '#4a3d5c',
      borderHover: '#5a4d6c',
      shadow: 'rgba(157, 78, 221, 0.3)',
      
      gameAccent1: '#b07eff',
      gameAccent2: '#ff6ba8',
      gameAccent3: '#70d0fd',
    },
    gradients: {
      primary: ['#9d4edd', '#f72585'],
      secondary: ['#f72585', '#4cc9f0'],
      hero: ['#0f0b1a', '#1a1528', '#2d2438'],
      card: ['rgba(45, 36, 56, 0.8)', 'rgba(61, 52, 72, 0.8)'],
    },
    animations: {
      duration: { fast: 200, normal: 400, slow: 600 },
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    effects: {
      blur: 'blur(8px)',
      glow: '0 0 25px rgba(157, 78, 221, 0.4)',
    },
  },

  // Military/Tactical Theme
  military: {
    id: 'military',
    name: 'Tactical Ops',
    description: 'Military tactical interface design',
    category: 'military',
    colors: {
      primary: '#4ade80',
      primaryHover: '#22c55e',
      secondary: '#f97316',
      accent: '#eab308',
      
      background: '#0a0a0a',
      backgroundSecondary: '#1c1c1c',
      surface: '#262626',
      surfaceHover: '#363636',
      
      text: '#f5f5f5',
      textSecondary: '#d4d4d4',
      textMuted: '#737373',
      
      success: '#4ade80',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      
      border: '#404040',
      borderHover: '#525252',
      shadow: 'rgba(74, 222, 128, 0.2)',
      
      gameAccent1: '#84cc16',
      gameAccent2: '#fb7185',
      gameAccent3: '#fbbf24',
    },
    gradients: {
      primary: ['#4ade80', '#22c55e'],
      secondary: ['#f97316', '#eab308'],
      hero: ['#0a0a0a', '#1c1c1c', '#262626'],
      card: ['rgba(38, 38, 38, 0.9)', 'rgba(54, 54, 54, 0.9)'],
    },
    animations: {
      duration: { fast: 100, normal: 200, slow: 300 },
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
    },
    effects: {
      blur: 'blur(6px)',
      glow: '0 0 15px rgba(74, 222, 128, 0.3)',
    },
  },

  // Retro/Synthwave Theme
  retro: {
    id: 'retro',
    name: 'Synthwave',
    description: '80s retro synthwave aesthetic',
    category: 'retro',
    colors: {
      primary: '#ff006e',
      primaryHover: '#d90068',
      secondary: '#8338ec',
      accent: '#fb5607',
      
      background: '#0d1b2a',
      backgroundSecondary: '#1b263b',
      surface: '#415a77',
      surfaceHover: '#778da9',
      
      text: '#e0e1dd',
      textSecondary: '#b8b9b5',
      textMuted: '#8d8e8a',
      
      success: '#4ecdc4',
      warning: '#ffe66d',
      error: '#ff006e',
      info: '#4cc9f0',
      
      border: '#565a5c',
      borderHover: '#6a6e70',
      shadow: 'rgba(255, 0, 110, 0.3)',
      
      gameAccent1: '#ff9500',
      gameAccent2: '#c77dff',
      gameAccent3: '#7209b7',
    },
    gradients: {
      primary: ['#ff006e', '#8338ec'],
      secondary: ['#8338ec', '#fb5607'],
      hero: ['#0d1b2a', '#1b263b', '#415a77'],
      card: ['rgba(65, 90, 119, 0.7)', 'rgba(119, 141, 169, 0.7)'],
    },
    animations: {
      duration: { fast: 250, normal: 500, slow: 750 },
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    effects: {
      blur: 'blur(12px)',
      glow: '0 0 30px rgba(255, 0, 110, 0.5)',
    },
  },

  // Space Theme
  space: {
    id: 'space',
    name: 'Cosmic Voyage',
    description: 'Deep space exploration theme',
    category: 'space',
    colors: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      
      background: '#030712',
      backgroundSecondary: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      border: '#475569',
      borderHover: '#64748b',
      shadow: 'rgba(79, 70, 229, 0.3)',
      
      gameAccent1: '#14b8a6',
      gameAccent2: '#a855f7',
      gameAccent3: '#f59e0b',
    },
    gradients: {
      primary: ['#4f46e5', '#06b6d4'],
      secondary: ['#06b6d4', '#8b5cf6'],
      hero: ['#030712', '#0f172a', '#1e293b'],
      card: ['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.8)'],
    },
    animations: {
      duration: { fast: 200, normal: 400, slow: 800 },
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    effects: {
      blur: 'blur(14px)',
      glow: '0 0 40px rgba(79, 70, 229, 0.4)',
    },
  },

  // Horror Theme
  horror: {
    id: 'horror',
    name: 'Dark Nightmare',
    description: 'Sinister horror game aesthetic',
    category: 'horror',
    colors: {
      primary: '#dc2626',
      primaryHover: '#b91c1c',
      secondary: '#7c2d12',
      accent: '#ea580c',
      
      background: '#0c0c0c',
      backgroundSecondary: '#1a1a1a',
      surface: '#2d1b1b',
      surfaceHover: '#3d2b2b',
      
      text: '#fecaca',
      textSecondary: '#dc9696',
      textMuted: '#8b5959',
      
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
      info: '#2563eb',
      
      border: '#451a1a',
      borderHover: '#7f1d1d',
      shadow: 'rgba(220, 38, 38, 0.5)',
      
      gameAccent1: '#b45309',
      gameAccent2: '#991b1b',
      gameAccent3: '#7c2d12',
    },
    gradients: {
      primary: ['#dc2626', '#7c2d12'],
      secondary: ['#7c2d12', '#ea580c'],
      hero: ['#0c0c0c', '#1a1a1a', '#2d1b1b'],
      card: ['rgba(45, 27, 27, 0.9)', 'rgba(61, 43, 43, 0.9)'],
    },
    animations: {
      duration: { fast: 100, normal: 300, slow: 600 },
      easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
    },
    effects: {
      blur: 'blur(8px)',
      glow: '0 0 20px rgba(220, 38, 38, 0.6)',
    },
  },
};

// Theme utilities
export const getThemeByGame = (gameTitle: string): GameTheme => {
  const gameTitleLower = gameTitle.toLowerCase();
  
  // Game-to-theme mapping
  const gameThemeMap: Record<string, string> = {
    'cyberpunk': 'cyberpunk',
    'deus ex': 'cyberpunk',
    'shadowrun': 'cyberpunk',
    'blade runner': 'cyberpunk',
    
    'witcher': 'fantasy',
    'skyrim': 'fantasy',
    'dragon age': 'fantasy',
    'final fantasy': 'fantasy',
    'world of warcraft': 'fantasy',
    
    'call of duty': 'military',
    'battlefield': 'military',
    'counter-strike': 'military',
    'rainbow six': 'military',
    'arma': 'military',
    
    'outrun': 'retro',
    'hotline miami': 'retro',
    'far cry 3': 'retro',
    'gta vice city': 'retro',
    
    'mass effect': 'space',
    'no man\'s sky': 'space',
    'elite dangerous': 'space',
    'star citizen': 'space',
    'destiny': 'space',
    
    'resident evil': 'horror',
    'dead space': 'horror',
    'silent hill': 'horror',
    'outlast': 'horror',
    'amnesia': 'horror',
  };
  
  // Find matching theme
  for (const [gameKey, themeId] of Object.entries(gameThemeMap)) {
    if (gameTitleLower.includes(gameKey)) {
      return gameThemes[themeId];
    }
  }
  
  // Default to cyberpunk theme
  return gameThemes.cyberpunk;
};

export const getThemeCategories = (): Array<{
  category: string;
  themes: GameTheme[];
}> => {
  const categories: Record<string, GameTheme[]> = {};
  
  Object.values(gameThemes).forEach(theme => {
    if (!categories[theme.category]) {
      categories[theme.category] = [];
    }
    categories[theme.category].push(theme);
  });
  
  return Object.entries(categories).map(([category, themes]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    themes,
  }));
};

export const createCustomTheme = (
  baseTheme: GameTheme,
  overrides: Partial<GameTheme>
): GameTheme => {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
    },
    gradients: {
      ...baseTheme.gradients,
      ...overrides.gradients,
    },
    animations: {
      ...baseTheme.animations,
      ...overrides.animations,
    },
    effects: {
      ...baseTheme.effects,
      ...overrides.effects,
    },
  };
};
