// ============================================================================
// App Entry Point
// ============================================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setupQueueProcessor } from './src/utils/offlineQueue';
import { setupNotifications } from './src/utils/notifications';
import './src/i18n';

// TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

export default function App() {
  useEffect(() => {
    // Set up offline queue processor
    const cleanupQueue = setupQueueProcessor();

    // Set up push notifications
    const cleanupNotifications = setupNotifications();

    return () => {
      cleanupQueue();
      cleanupNotifications?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
