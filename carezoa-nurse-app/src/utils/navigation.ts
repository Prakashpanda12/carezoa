// ============================================================================
// Navigation helpers — deep-link to maps, phone, etc.
// ============================================================================

import { Linking, Platform } from 'react-native';

/**
 * Open turn-by-turn navigation to coordinates
 */
export async function openNavigation(
  lat: number,
  lng: number,
  label?: string
): Promise<void> {
  const encodedLabel = label ? encodeURIComponent(label) : '';

  if (Platform.OS === 'ios') {
    // Try Apple Maps first, fallback to Google Maps
    const appleMapsUrl = `maps://?daddr=${lat},${lng}&dirflg=d`;
    const googleMapsUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;

    const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
    const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);

    if (canOpenApple) {
      await Linking.openURL(appleMapsUrl);
    } else if (canOpenGoogle) {
      await Linking.openURL(googleMapsUrl);
    } else {
      // Fallback to web
      await Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
    }
  } else {
    // Android — try Google Maps app, fallback to web
    const googleMapsUrl = `google.navigation:q=${lat},${lng}`;
    const canOpen = await Linking.canOpenURL(googleMapsUrl);

    if (canOpen) {
      await Linking.openURL(googleMapsUrl);
    } else {
      await Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
    }
  }
}

/**
 * Initiate phone call
 */
export async function openPhoneCall(phoneNumber: string): Promise<void> {
  const url = `tel:${phoneNumber}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

/**
 * Open SMS composer
 */
export async function openSms(phoneNumber: string, body?: string): Promise<void> {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phoneNumber}${body ? `${separator}body=${encodeURIComponent(body)}` : ''}`;
  await Linking.openURL(url);
}
