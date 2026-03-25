"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/cache/react-query-config';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client once per component mount
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
