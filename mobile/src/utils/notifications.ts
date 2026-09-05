/**
 * Safe notifications wrapper that handles Expo Go limitations.
 * In Expo Go (SDK 53+), push notifications are not supported on Android.
 * This wrapper gracefully handles the error and allows the app to continue.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Safe wrapper for notifications
let Notifications: any = null;

try {
  // Try to import notifications - will fail in Expo Go on Android
  Notifications = require('expo-notifications');
  
  // Set up notification handler if available
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  console.warn('expo-notifications not available (Expo Go limitation on Android SDK 53+)');
  Notifications = null;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications || isExpoGo) {
    console.log('Notifications disabled in Expo Go');
    return false;
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications || isExpoGo) {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get push token:', error);
    return null;
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  if (!Notifications || isExpoGo) {
    console.log('Notification skipped (Expo Go):', title);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications || isExpoGo) {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
  }
}

export { Notifications };
