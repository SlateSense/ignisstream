"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { gameThemes, type GameTheme, getThemeByGame } from "@/lib/themes/game-themes";

type Theme = "light" | "dark" | "system";
type GameThemeId = keyof typeof gameThemes;

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  gameTheme: GameTheme;
  gameThemeId: GameThemeId;
  setTheme: (theme: Theme) => void;
  setGameTheme: (themeId: GameThemeId) => void;
  setThemeByGame: (gameTitle: string) => void;
  toggleTheme: () => void;
  colors: GameTheme['colors'];
  gradients: GameTheme['gradients'];
  effects: GameTheme['effects'];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("dark");
  const [gameThemeId, setGameThemeId] = useState<GameThemeId>("cyberpunk");
  const [gameTheme, setGameTheme] = useState<GameTheme>(gameThemes.cyberpunk);

  // Get theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("ignisstream-theme") as Theme;
    const storedGameTheme = localStorage.getItem("ignisstream-game-theme") as GameThemeId;
    
    if (storedTheme) {
      setTheme(storedTheme);
    }
    if (storedGameTheme && gameThemes[storedGameTheme]) {
      setGameThemeId(storedGameTheme);
      setGameTheme(gameThemes[storedGameTheme]);
    }
  }, []);

  // Update actual theme based on system preference or user selection
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes if theme is "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateActualTheme);
      return () => mediaQuery.removeEventListener("change", updateActualTheme);
    }
  }, [theme]);

  // Apply theme to document and CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Add current theme class
    root.classList.add(actualTheme);
    
    // Apply game theme CSS variables
    const colors = gameTheme.colors;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-hover', colors.surfaceHover);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-hover', colors.borderHover);
    root.style.setProperty('--color-shadow', colors.shadow);
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${gameTheme.gradients.primary.join(', ')})`);
    root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${gameTheme.gradients.secondary.join(', ')})`);
    root.style.setProperty('--gradient-hero', `linear-gradient(135deg, ${gameTheme.gradients.hero.join(', ')})`);
    root.style.setProperty('--effect-glow', gameTheme.effects.glow);
    root.style.setProperty('--effect-blur', gameTheme.effects.blur);
    
    // Store in localStorage
    localStorage.setItem("ignisstream-theme", theme);
    localStorage.setItem("ignisstream-game-theme", gameThemeId);
  }, [actualTheme, theme, gameTheme, gameThemeId]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleSetGameTheme = (themeId: GameThemeId) => {
    setGameThemeId(themeId);
    setGameTheme(gameThemes[themeId]);
  };

  const handleSetThemeByGame = (gameTitle: string) => {
    const detectedTheme = getThemeByGame(gameTitle);
    const themeId = detectedTheme.id as GameThemeId;
    handleSetGameTheme(themeId);
  };

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const value = {
    theme,
    actualTheme,
    gameTheme,
    gameThemeId,
    setTheme: handleSetTheme,
    setGameTheme: handleSetGameTheme,
    setThemeByGame: handleSetThemeByGame,
    toggleTheme,
    colors: gameTheme.colors,
    gradients: gameTheme.gradients,
    effects: gameTheme.effects,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
