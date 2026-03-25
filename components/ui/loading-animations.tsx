"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2, Zap, Target, Swords, Shield, Gamepad2 } from 'lucide-react';

interface LoadingAnimationProps {
  variant?: 'pulse' | 'spin' | 'bars' | 'dots' | 'gaming' | 'matrix' | 'glitch';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  variant = 'gaming',
  size = 'md',
  text,
  fullScreen = false,
}) => {
  const { colors, effects } = useTheme();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-6 h-6';
      case 'md': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
      default: return 'w-8 h-8';
    }
  };

  const containerStyle = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `${colors.background}cc`,
        backdropFilter: effects.blur,
        zIndex: 9999,
      }
    : {};

  const LoadingContent = () => {
    switch (variant) {
      case 'gaming':
        return <GamingLoader size={getSizeClasses()} colors={colors} />;
      case 'matrix':
        return <MatrixLoader size={getSizeClasses()} colors={colors} />;
      case 'glitch':
        return <GlitchLoader size={getSizeClasses()} colors={colors} />;
      case 'bars':
        return <BarsLoader size={getSizeClasses()} colors={colors} />;
      case 'dots':
        return <DotsLoader size={getSizeClasses()} colors={colors} />;
      case 'pulse':
        return <PulseLoader size={getSizeClasses()} colors={colors} />;
      default:
        return <SpinLoader size={getSizeClasses()} colors={colors} />;
    }
  };

  return (
    <div 
      style={containerStyle}
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? '' : 'p-4'}`}
    >
      <LoadingContent />
      {text && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Gaming-themed loader with controller elements
const GamingLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <div className={`${size} relative`}>
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{ 
        borderColor: colors.primary,
        borderTopColor: 'transparent',
        filter: `drop-shadow(${colors.shadow})`
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
    <motion.div
      className="absolute inset-2 flex items-center justify-center"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Gamepad2 
        className="w-full h-full" 
        style={{ color: colors.primary }}
      />
    </motion.div>
  </div>
);

// Matrix-style digital rain effect
const MatrixLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <div className={`${size} relative overflow-hidden rounded`}>
    <div className="absolute inset-0 grid grid-cols-4 gap-px">
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-current rounded-sm"
          style={{ color: colors.primary }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  </div>
);

// Glitch effect loader
const GlitchLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <div className={`${size} relative`}>
    <motion.div
      className="absolute inset-0 rounded font-bold flex items-center justify-center text-2xl"
      style={{ 
        color: colors.primary,
        textShadow: `2px 0 ${colors.secondary}, -2px 0 ${colors.accent}`
      }}
      animate={{
        x: [-2, 2, -1, 1, 0],
        filter: [
          'hue-rotate(0deg)',
          'hue-rotate(90deg)', 
          'hue-rotate(180deg)',
          'hue-rotate(270deg)',
          'hue-rotate(360deg)'
        ]
      }}
      transition={{ 
        duration: 0.3,
        repeat: Infinity,
        repeatType: 'reverse'
      }}
    >
      ⚡
    </motion.div>
  </div>
);

// Bars loader with gaming elements
const BarsLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <div className={`${size} flex items-end justify-center gap-1`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-2 rounded-t"
        style={{ backgroundColor: colors.primary }}
        animate={{ 
          height: ['20%', '100%', '20%'],
          backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.primary]
        }}
        transition={{ 
          duration: 1.2,
          repeat: Infinity,
          delay: i * 0.1,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
);

// Dots loader with orbit effect
const DotsLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <div className={`${size} relative`}>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: colors.primary,
          left: '50%',
          top: '50%',
          originX: '50%',
          originY: '150%'
        }}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
          delay: i * 0.2
        }}
        initial={{ rotate: i * 45 }}
      />
    ))}
  </div>
);

// Pulse loader with glow effect
const PulseLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <motion.div
    className={`${size} rounded-full`}
    style={{ 
      backgroundColor: colors.primary,
      boxShadow: `0 0 20px ${colors.primary}50`
    }}
    animate={{ 
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7]
    }}
    transition={{ 
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  />
);

// Default spin loader
const SpinLoader: React.FC<{ size: string; colors: any }> = ({ size, colors }) => (
  <motion.div
    className={`${size} rounded-full border-2`}
    style={{ 
      borderColor: `${colors.primary}30`,
      borderTopColor: colors.primary
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  />
);

// Page transition component
interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'slide' | 'fade' | 'scale' | 'gaming';
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  variant = 'gaming' 
}) => {
  const { colors } = useTheme();

  const getVariants = () => {
    switch (variant) {
      case 'slide':
        return {
          initial: { x: 300, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -300, opacity: 0 }
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 }
        };
      case 'gaming':
        return {
          initial: { 
            x: 50, 
            opacity: 0,
            filter: 'blur(10px) hue-rotate(180deg)'
          },
          animate: { 
            x: 0, 
            opacity: 1,
            filter: 'blur(0px) hue-rotate(0deg)'
          },
          exit: { 
            x: -50, 
            opacity: 0,
            filter: 'blur(10px) hue-rotate(-180deg)'
          }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <motion.div
      variants={getVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }}
    >
      {children}
    </motion.div>
  );
};

// Skeleton loader for content
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'gaming-card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const { colors } = useTheme();

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full aspect-square';
      case 'gaming-card':
        return 'h-48 rounded-xl';
      default:
        return 'rounded';
    }
  };

  return (
    <motion.div
      className={`${getVariantClasses()} ${className}`}
      style={{ backgroundColor: colors.surface }}
      animate={{ 
        opacity: [0.6, 1, 0.6],
      }}
      transition={{ 
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// Success/Error animation
interface StatusAnimationProps {
  status: 'success' | 'error' | 'warning';
  message?: string;
  onComplete?: () => void;
}

export const StatusAnimation: React.FC<StatusAnimationProps> = ({ 
  status, 
  message,
  onComplete 
}) => {
  const { colors } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✓',
          color: colors.success,
          bgColor: `${colors.success}20`
        };
      case 'error':
        return {
          icon: '✗',
          color: colors.error,
          bgColor: `${colors.error}20`
        };
      case 'warning':
        return {
          icon: '⚠',
          color: colors.warning,
          bgColor: `${colors.warning}20`
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-6 rounded-xl"
      style={{ backgroundColor: config.bgColor }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="text-4xl font-bold mb-2"
        style={{ color: config.color }}
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: status === 'success' ? [0, 360, 0] : 0
        }}
        transition={{ duration: 0.6 }}
      >
        {config.icon}
      </motion.div>
      {message && (
        <motion.p
          className="text-center font-medium"
          style={{ color: colors.text }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};
