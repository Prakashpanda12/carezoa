// ============================================================================
// NavigateToPatient Screen — Map view + deep-link to maps app
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { openNavigation } from '../../utils/navigation';
import { useBooking } from '../../hooks';

interface NavigateToPatientScreenProps {
  bookingId: number;
  onNavigate: (screen: string, params?: any) => void;
}

export function NavigateToPatientScreen({
  bookingId,
  onNavigate,
}: NavigateToPatientScreenProps) {
  const { data: booking, isLoading } = useBooking(bookingId);

  if (isLoading || !booking) return <LoadingScreen />;

  // Use provider's lat/lng as initial region (or a default)
  const patientLat = 20.2961; // Would come from booking geocoding
  const patientLng = 85.8245;

  const handleNavigate = () => {
    openNavigation(patientLat, patientLng, booking.address);
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Navigate to Patient</Text>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: patientLat,
              longitude: patientLng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{ latitude: patientLat, longitude: patientLng }}
              title={booking.patient.name}
              description={booking.address}
            />
          </MapView>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.patientName}>{booking.patient.name}</Text>
          <Text style={styles.address}>{booking.address}</Text>
          <Text style={styles.city}>{booking.city}</Text>

          {booking.instructions && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>Instructions:</Text>
              <Text style={styles.instructionsText}>{booking.instructions}</Text>
            </View>
          )}
        </Card>

        <Button
          title="🗺 Open in Maps App"
          onPress={handleNavigate}
          variant="primary"
          size="lg"
        />

        <Button
          title="← Back to Visit"
          onPress={() => onNavigate('VisitDetail', { bookingId })}
          variant="ghost"
        />
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
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 250,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  city: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  instructionsBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  instructionsLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginTop: 2,
  },
});
