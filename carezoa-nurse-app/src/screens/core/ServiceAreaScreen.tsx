// ============================================================================
// ServiceArea Screen — Pincode/radius picker on a map
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, spacing, fontSize } from '../../theme';
import { useMyProvider, useUpdateProvider } from '../../hooks';

export function ServiceAreaScreen() {
  const { data: provider } = useMyProvider();
  const updateProvider = useUpdateProvider();

  const [region, setRegion] = useState({
    latitude: provider?.lat || 20.2961, // Default: Bhubaneswar
    longitude: provider?.lng || 85.8245,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const [city, setCity] = useState(provider?.city || '');
  const [coverageKm, setCoverageKm] = useState(provider?.coverage_km?.toString() || '10');
  const [pinLocation, setPinLocation] = useState(
    provider?.lat
      ? { latitude: provider.lat, longitude: provider.lng }
      : null
  );

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPinLocation({ latitude, longitude });
    setRegion((prev) => ({ ...prev, latitude, longitude }));
  };

  const handleSave = async () => {
    if (!pinLocation) {
      Alert.alert('Required', 'Please tap on the map to set your location.');
      return;
    }
    if (!city) {
      Alert.alert('Required', 'Please enter your city.');
      return;
    }

    try {
      await updateProvider.mutateAsync({
        lat: pinLocation.latitude,
        lng: pinLocation.longitude,
        coverage_km: parseFloat(coverageKm) || 10,
        city,
      });
      Alert.alert('Saved', 'Your service area has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save service area.');
    }
  };

  const coverageMeters = (parseFloat(coverageKm) || 10) * 1000;

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Service Area</Text>
        <Text style={styles.subtitle}>
          Tap the map to set your base location and adjust your coverage radius.
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {pinLocation && (
              <>
                <Marker coordinate={pinLocation} title="Your Location" />
                <Circle
                  center={pinLocation}
                  radius={coverageMeters}
                  strokeColor={colors.primary + '80'}
                  fillColor={colors.primary + '20'}
                  strokeWidth={2}
                />
              </>
            )}
          </MapView>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g., Bhubaneswar"
          />
          <Input
            label="Coverage Radius (km)"
            value={coverageKm}
            onChangeText={setCoverageKm}
            keyboardType="numeric"
            placeholder="10"
          />
          {pinLocation && (
            <Text style={styles.coordText}>
              📍 {pinLocation.latitude.toFixed(4)}, {pinLocation.longitude.toFixed(4)}
            </Text>
          )}
          <Button
            title="Save Service Area"
            onPress={handleSave}
            loading={updateProvider.isPending}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  formCard: {
    padding: spacing.md,
  },
  coordText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
