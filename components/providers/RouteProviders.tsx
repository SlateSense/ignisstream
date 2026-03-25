"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Lazy load providers only when needed
const NotificationProvider = dynamic(() => import("@/components/notifications/NotificationProvider"), {
  ssr: false,
});
const TrendingProvider = dynamic(() => import("@/components/trending/TrendingProvider"), {
  ssr: false,
});
const HashtagProvider = dynamic(() => import("@/components/hashtags/HashtagProvider"), {
  ssr: false,
});

interface RouteProvidersProps {
  children: ReactNode;
  providers?: ('notifications' | 'trending' | 'hashtags')[];
}

export function RouteProviders({ children, providers = [] }: RouteProvidersProps) {
  let content = children;

  // Wrap only with requested providers
  if (providers.includes('hashtags')) {
    content = <HashtagProvider>{content}</HashtagProvider>;
  }
  if (providers.includes('trending')) {
    content = <TrendingProvider>{content}</TrendingProvider>;
  }
  if (providers.includes('notifications')) {
    content = <NotificationProvider>{content}</NotificationProvider>;
  }

  return <>{content}</>;
}
