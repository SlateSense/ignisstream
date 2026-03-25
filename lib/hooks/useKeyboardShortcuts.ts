"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category: string;
  disabled?: boolean;
}

interface KeyboardShortcutsConfig {
  shortcuts: ShortcutAction[];
  showTooltips?: boolean;
  enableGlobalShortcuts?: boolean;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const { shortcuts, showTooltips = true, enableGlobalShortcuts = true } = config;
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const router = useRouter();

  const getKeyString = useCallback((event: KeyboardEvent): string => {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    // Normalize key names
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';
    if (key.startsWith('arrow')) key = key.replace('arrow', '');
    
    parts.push(key);
    return parts.join('+');
  }, []);

  const executeShortcut = useCallback((shortcut: ShortcutAction) => {
    if (shortcut.disabled) return;
    
    try {
      shortcut.action();
      if (showTooltips) {
        toast.success(`Shortcut executed: ${shortcut.description}`);
      }
    } catch (error) {
      console.error('Shortcut execution failed:', error);
      toast.error('Shortcut execution failed');
    }
  }, [showTooltips]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const keyString = getKeyString(event);
    setPressedKeys(prev => new Set(prev).add(keyString));

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const shortcutKey = [
        shortcut.ctrlKey && 'ctrl',
        shortcut.altKey && 'alt', 
        shortcut.shiftKey && 'shift',
        shortcut.key.toLowerCase()
      ].filter(Boolean).join('+');

      return shortcutKey === keyString;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      executeShortcut(matchingShortcut);
    }
  }, [shortcuts, getKeyString, executeShortcut]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const keyString = getKeyString(event);
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(keyString);
      return newSet;
    });
  }, [getKeyString]);

  useEffect(() => {
    if (!enableGlobalShortcuts) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, enableGlobalShortcuts]);

  const showHelp = useCallback(() => {
    setIsHelpVisible(true);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
  }, []);

  return {
    isHelpVisible,
    showHelp,
    hideHelp,
    pressedKeys,
    executeShortcut,
  };
};

// Default shortcuts for IgnisStream
export const getDefaultShortcuts = (router: any): ShortcutAction[] => [
  // Navigation
  {
    key: 'h',
    description: 'Go to Home',
    category: 'Navigation',
    action: () => router.push('/'),
  },
  {
    key: 'f',
    description: 'Go to Feed',
    category: 'Navigation', 
    action: () => router.push('/feed'),
  },
  {
    key: 'p',
    description: 'Go to Profile',
    category: 'Navigation',
    action: () => router.push('/profile'),
  },
  {
    key: 's',
    description: 'Go to Settings',
    category: 'Navigation',
    action: () => router.push('/settings'),
  },
  {
    key: 'g',
    description: 'Go to Games',
    category: 'Navigation',
    action: () => router.push('/games'),
  },

  // Content Creation
  {
    key: 'n',
    ctrlKey: true,
    description: 'Create New Post',
    category: 'Content',
    action: () => router.push('/post/create'),
  },
  {
    key: 'c',
    ctrlKey: true,
    shiftKey: true,
    description: 'Capture Gaming Moment',
    category: 'Content',
    action: () => router.push('/capture'),
  },
  {
    key: 'l',
    ctrlKey: true,
    description: 'Go Live',
    category: 'Content',
    action: () => router.push('/streaming/dashboard'),
  },

  // Search & Discovery
  {
    key: '/',
    description: 'Search',
    category: 'Search',
    action: () => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      } else {
        router.push('/search');
      }
    },
  },
  {
    key: 'k',
    ctrlKey: true,
    description: 'Command Palette',
    category: 'Search',
    action: () => {
      // Open command palette
      window.dispatchEvent(new CustomEvent('open-command-palette'));
    },
  },

  // Social
  {
    key: 'm',
    description: 'Messages',
    category: 'Social',
    action: () => router.push('/messages'),
  },
  {
    key: 't',
    description: 'Tournaments',
    category: 'Social',
    action: () => router.push('/tournaments'),
  },
  {
    key: 'a',
    description: 'Achievements',
    category: 'Social', 
    action: () => router.push('/achievements'),
  },

  // UI Controls
  {
    key: 'd',
    ctrlKey: true,
    description: 'Toggle Dark Mode',
    category: 'UI',
    action: () => {
      window.dispatchEvent(new CustomEvent('toggle-theme'));
    },
  },
  {
    key: '?',
    shiftKey: true,
    description: 'Show Keyboard Shortcuts',
    category: 'Help',
    action: () => {
      window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
    },
  },
  {
    key: 'esc',
    description: 'Close Modal/Overlay',
    category: 'UI',
    action: () => {
      // Close any open modals
      const closeButtons = document.querySelectorAll('[data-close-modal]');
      const latestModal = closeButtons[closeButtons.length - 1] as HTMLElement;
      if (latestModal) {
        latestModal.click();
      }
    },
  },

  // Gaming Specific  
  {
    key: 'r',
    ctrlKey: true,
    description: 'Refresh Game Stats',
    category: 'Gaming',
    action: () => {
      window.dispatchEvent(new CustomEvent('refresh-game-stats'));
      toast.success('Refreshing game statistics...');
    },
  },
  {
    key: 'i',
    ctrlKey: true,
    description: 'Import Game Data',
    category: 'Gaming',
    action: () => router.push('/settings/integrations'),
  },

  // Streaming
  {
    key: 'space',
    description: 'Play/Pause Stream',
    category: 'Streaming',
    action: () => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        if (videoElement.paused) {
          videoElement.play();
        } else {
          videoElement.pause();
        }
      }
    },
  },
  {
    key: 'arrowleft',
    description: 'Skip Backward 10s',
    category: 'Streaming',
    action: () => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
      }
    },
  },
  {
    key: 'arrowright', 
    description: 'Skip Forward 10s',
    category: 'Streaming',
    action: () => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
      }
    },
  },

  // Quick Actions
  {
    key: 'q',
    ctrlKey: true,
    description: 'Quick Actions Menu',
    category: 'Quick Actions',
    action: () => {
      window.dispatchEvent(new CustomEvent('open-quick-actions'));
    },
  },
  {
    key: 'b',
    description: 'Toggle Sidebar',
    category: 'UI',
    action: () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    },
  },
];

// Shortcut formatter for display
export const formatShortcut = (shortcut: ShortcutAction): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  
  let key = shortcut.key;
  // Format special keys
  if (key === ' ') key = 'Space';
  if (key === 'esc') key = 'Escape';
  if (key.startsWith('arrow')) key = key.replace('arrow', '');
  
  parts.push(key.toUpperCase());
  
  return parts.join(' + ');
};

// Context-aware shortcuts hook
export const useContextualShortcuts = (context: string) => {
  const router = useRouter();
  const [contextShortcuts, setContextShortcuts] = useState<ShortcutAction[]>([]);

  useEffect(() => {
    let shortcuts: ShortcutAction[] = [];

    switch (context) {
      case 'feed':
        shortcuts = [
          {
            key: 'j',
            description: 'Next Post',
            category: 'Feed Navigation',
            action: () => {
              const currentPost = document.querySelector('[data-current-post]');
              const nextPost = currentPost?.nextElementSibling as HTMLElement;
              if (nextPost) {
                nextPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
                nextPost.dataset.currentPost = 'true';
                currentPost?.removeAttribute('data-current-post');
              }
            },
          },
          {
            key: 'k', 
            description: 'Previous Post',
            category: 'Feed Navigation',
            action: () => {
              const currentPost = document.querySelector('[data-current-post]');
              const prevPost = currentPost?.previousElementSibling as HTMLElement;
              if (prevPost) {
                prevPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
                prevPost.dataset.currentPost = 'true';
                currentPost?.removeAttribute('data-current-post');
              }
            },
          },
          {
            key: 'l',
            description: 'Like Current Post',
            category: 'Feed Actions',
            action: () => {
              const likeButton = document.querySelector('[data-current-post] [data-like-button]') as HTMLElement;
              if (likeButton) {
                likeButton.click();
              }
            },
          },
        ];
        break;
        
      case 'profile':
        shortcuts = [
          {
            key: 'e',
            description: 'Edit Profile',
            category: 'Profile',
            action: () => router.push('/profile/edit'),
          },
        ];
        break;
        
      case 'messages':
        shortcuts = [
          {
            key: 'enter',
            ctrlKey: true,
            description: 'Send Message',
            category: 'Messages',
            action: () => {
              const sendButton = document.querySelector('[data-send-message]') as HTMLElement;
              if (sendButton) {
                sendButton.click();
              }
            },
          },
        ];
        break;
    }

    setContextShortcuts([...getDefaultShortcuts(router), ...shortcuts]);
  }, [context, router]);

  return useKeyboardShortcuts({
    shortcuts: contextShortcuts,
    showTooltips: true,
    enableGlobalShortcuts: true,
  });
};
