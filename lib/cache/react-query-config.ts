import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Optimized cache configuration for better performance
const queryConfig: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes by default
    staleTime: 1000 * 60 * 5,
    // Keep unused data in cache for 10 minutes
    gcTime: 1000 * 60 * 10,
    // Retry failed requests 1 time only
    retry: 1,
    // Don't refetch on window focus in development
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    // Don't refetch on mount if data exists
    refetchOnMount: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
  },
};

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
};

// Export singleton for client-side use
let browserQueryClient: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  } else {
    // Browser: create client once
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
};
