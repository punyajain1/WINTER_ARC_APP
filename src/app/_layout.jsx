
import { useAuth } from '@/utils/auth/useAuth';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { distractionChecker } from '@/utils/distractionChecker';
import { initializeNotifications, addNotificationResponseListener } from '@/utils/notifications';
import { router } from 'expo-router';
import { screenTimeMonitor } from '@/utils/screenTime';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();

  useEffect(() => {
    initiate();
    distractionChecker.initialize();
    
    // Initialize notifications
    initializeNotifications();
    
    // Initialize screen time monitoring
    screenTimeMonitor.initialize();
    
    // Handle notification taps
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      
      if (data.type === 'daily-checkin') {
        router.push('/checkin');
      } else if (data.type === 'goal-deadline' && data.goalId) {
        router.push('/(tabs)/goals');
      } else if (data.type === 'screen-time-warning') {
        router.push('/(tabs)/settings');
      }
    });
    
    return () => {
      subscription.remove();
      screenTimeMonitor.cleanup();
    };
  }, [initiate]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
