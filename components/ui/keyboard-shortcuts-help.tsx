"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Keyboard, Gamepad2, Monitor, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { formatShortcut, type ShortcutAction } from '@/lib/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: ShortcutAction[];
  isVisible: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  isVisible,
  onClose,
}) => {
  const { colors, effects } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group shortcuts by category
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutAction[]>);

  // Filter shortcuts based on search and category
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = searchQuery === '' || 
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatShortcut(shortcut).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation': return <Monitor className="w-4 h-4" />;
      case 'Content': return <Zap className="w-4 h-4" />;
      case 'Gaming': return <Gamepad2 className="w-4 h-4" />;
      case 'Search': return <Search className="w-4 h-4" />;
      default: return <Keyboard className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: `${colors.background}cc` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-4xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              backdropFilter: effects.blur
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Keyboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Power-user shortcuts for IgnisStream
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="px-6 py-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                       style={{ color: colors.textSecondary }} />
                <Input
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center gap-2"
                >
                  All ({shortcuts.length})
                </Button>
                {Object.keys(categories).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    {getCategoryIcon(category)}
                    {category} ({categories[category].length})
                  </Button>
                ))}
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="px-6 pb-6 max-h-96 overflow-y-auto">
              {filteredShortcuts.length === 0 ? (
                <div 
                  className="text-center py-8"
                  style={{ color: colors.textSecondary }}
                >
                  <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No shortcuts found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    filteredShortcuts.reduce((acc, shortcut) => {
                      if (!acc[shortcut.category]) {
                        acc[shortcut.category] = [];
                      }
                      acc[shortcut.category].push(shortcut);
                      return acc;
                    }, {} as Record<string, ShortcutAction[]>)
                  ).map(([category, categoryShortcuts]) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <h3 
                        className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide"
                        style={{ color: colors.primary }}
                      >
                        {getCategoryIcon(category)}
                        {category}
                      </h3>
                      <div className="grid gap-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <motion.div
                            key={`${shortcut.category}-${index}`}
                            className="flex items-center justify-between p-3 rounded-lg transition-colors"
                            style={{ backgroundColor: colors.backgroundSecondary }}
                            whileHover={{ 
                              backgroundColor: colors.surfaceHover,
                              scale: 1.02 
                            }}
                          >
                            <div className="flex-1">
                              <p 
                                className="font-medium"
                                style={{ color: colors.text }}
                              >
                                {shortcut.description}
                              </p>
                              {shortcut.disabled && (
                                <p 
                                  className="text-xs mt-1"
                                  style={{ color: colors.textMuted }}
                                >
                                  Currently disabled
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && (
                                    <span 
                                      className="text-xs mx-1"
                                      style={{ color: colors.textSecondary }}
                                    >
                                      +
                                    </span>
                                  )}
                                  <kbd
                                    className="px-2 py-1 text-xs font-medium rounded border shadow-sm"
                                    style={{ 
                                      backgroundColor: colors.surface,
                                      borderColor: colors.border,
                                      color: colors.text
                                    }}
                                  >
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="px-6 py-4 border-t flex items-center justify-between text-sm"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textSecondary
              }}
            >
              <p>
                Tip: Press <kbd className="px-1 py-0.5 rounded text-xs" 
                                style={{ 
                                  backgroundColor: colors.surface,
                                  color: colors.text 
                                }}>
                  ?
                </kbd> anytime to show this help
              </p>
              <p>
                {filteredShortcuts.length} of {shortcuts.length} shortcuts
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating shortcut hint component
interface ShortcutHintProps {
  shortcut: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
}

export const ShortcutHint: React.FC<ShortcutHintProps> = ({
  shortcut,
  description,
  position = 'top',
  visible = true,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <motion.div
      className={`absolute z-50 ${positionClasses[position]}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div
        className="px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-2">
          <span>{description}</span>
          <kbd
            className="px-1.5 py-0.5 text-xs rounded border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textSecondary,
            }}
          >
            {shortcut}
          </kbd>
        </div>
      </div>
    </motion.div>
  );
};
