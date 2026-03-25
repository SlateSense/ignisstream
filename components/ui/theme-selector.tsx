"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Monitor, Sun, Moon, Gamepad2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { gameThemes, getThemeCategories } from '@/lib/themes/game-themes';

export function ThemeSelector() {
  const { 
    theme, 
    gameThemeId, 
    gameTheme, 
    setTheme, 
    setGameTheme,
    colors 
  } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const themeCategories = getThemeCategories();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 relative"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            borderRadius: '8px',
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Palette className="h-4 w-4 text-white" />
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-4"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Settings
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
        
        {/* Light/Dark Mode Toggle */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            Base Theme
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(t)}
                className="flex items-center gap-2 capitalize"
                style={{
                  backgroundColor: theme === t ? colors.primary : 'transparent',
                  borderColor: colors.border,
                  color: theme === t ? '#ffffff' : colors.text,
                }}
              >
                {t === 'light' && <Sun className="h-3 w-3" />}
                {t === 'dark' && <Moon className="h-3 w-3" />}
                {t === 'system' && <Monitor className="h-3 w-3" />}
                {t}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />

        {/* Game Themes */}
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
            <Gamepad2 className="h-4 w-4" />
            Game Themes
          </p>
          
          {themeCategories.map((category) => (
            <div key={category.category} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" 
                 style={{ color: colors.textMuted }}>
                {category.category}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {category.themes.map((t) => (
                  <motion.button
                    key={t.id}
                    onClick={() => setGameTheme(t.id as any)}
                    className="p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: gameThemeId === t.id ? t.colors.surface : 'transparent',
                      borderColor: gameThemeId === t.id ? t.colors.primary : colors.border,
                      borderWidth: gameThemeId === t.id ? '2px' : '1px',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` 
                        }}
                      />
                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                        {t.name}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {t.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />

        {/* Current Theme Preview */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.backgroundSecondary }}>
          <p className="text-sm font-medium mb-2" style={{ color: colors.text }}>
            Current: {gameTheme.name}
          </p>
          <div className="flex gap-2">
            {[gameTheme.colors.primary, gameTheme.colors.secondary, gameTheme.colors.accent].map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border"
                style={{ 
                  backgroundColor: color,
                  borderColor: colors.border 
                }}
              />
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Floating Theme Palette for quick theme switching
export function FloatingThemePalette() {
  const { setGameTheme, colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const popularThemes = [
    gameThemes.cyberpunk,
    gameThemes.fantasy,
    gameThemes.military,
    gameThemes.retro,
  ];

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-50"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: isVisible ? 1 : 0.7, scale: isVisible ? 1 : 0.8 }}
      onHoverStart={() => setIsVisible(true)}
      onHoverEnd={() => setIsVisible(false)}
    >
      <div 
        className="bg-surface border rounded-full p-2 shadow-lg"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        }}
      >
        <AnimatePresence>
          {isVisible && (
            <motion.div
              className="flex gap-2 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {popularThemes.map((theme) => (
                <motion.button
                  key={theme.id}
                  onClick={() => setGameTheme(theme.id as any)}
                  className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/60 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={theme.name}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Palette className="h-5 w-5 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
}
