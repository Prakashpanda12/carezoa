// ============================================================================
// Push Notifications Setup
// ============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from '../api/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and send token to backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0F766E',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Send token to backend
    try {
      await apiClient.post('/providers/me/push-token', { token });
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }

    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

/**
 * Set up notification listeners
 */
export function setupNotifications(): () => void {
  // Register for push notifications
  registerForPushNotifications();

  // Handle notification taps
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      // Navigation is handled by the app's navigation state
      // In a real app, you'd use a navigation ref to navigate
      console.log('Notification tapped:', data);
    }
  );

  // Handle foreground notifications
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Foreground notification:', notification);
    }
  );

  return () => {
    subscription.remove();
    foregroundSubscription.remove();
  };
}
