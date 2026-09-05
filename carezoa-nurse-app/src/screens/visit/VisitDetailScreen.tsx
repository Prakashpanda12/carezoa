// ============================================================================
// VisitDetail Screen — Full visit details with action buttons
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CheckInStepper } from '../../components/visit/CheckInStepper';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import {
  formatBookingDate,
  formatCurrency,
  formatDuration,
  getStatusInfo,
} from '../../utils/format';
import { openNavigation, openPhoneCall } from '../../utils/navigation';
import {
  useBooking,
  useProviderDeparted,
  useVerifyBookingOtp,
  useStartService,
} from '../../hooks';
import { communicationApi } from '../../api/communication';

interface VisitDetailScreenProps {
  bookingId: number;
  onNavigate: (screen: string, params?: any) => void;
}

export function VisitDetailScreen({ bookingId, onNavigate }: VisitDetailScreenProps) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const depart = useProviderDeparted();
  const verifyOtp = useVerifyBookingOtp();
  const startService = useStartService();
  const [calling, setCalling] = useState(false);

  if (isLoading || !booking) return <LoadingScreen />;

  const statusInfo = getStatusInfo(booking.status);
  const isHighRisk = booking.service?.name?.toLowerCase().includes('injection') || false;

  const handleDepart = async () => {
    try {
      await depart.mutateAsync(bookingId);
    } catch (error) {
      Alert.alert(
        'Offline',
        'Action queued. It will be submitted when you are back online.'
      );
    }
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      await verifyOtp.mutateAsync({ bookingId, code });
    } catch (error) {
      Alert.alert(
        'Offline',
        'OTP verification queued. It will be submitted when you are back online.'
      );
    }
  };

  const handleStartService = async () => {
    try {
      await startService.mutateAsync(bookingId);
    } catch (error) {
      Alert.alert('Error', 'Failed to start service.');
    }
  };

  const handleMaskedCall = async () => {
    setCalling(true);
    try {
      // In a real app, this would call the masked-call API and dial the relay number
      Alert.alert('Masked Call', 'Connecting via masked number...');
    } finally {
      setCalling(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status header */}
        <View style={styles.statusHeader}>
          <Badge label={statusInfo.label} color={statusInfo.color} />
          <Text style={styles.bookingId}>Booking #{booking.id}</Text>
        </View>

        {/* Patient info */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Patient</Text>
          <View style={styles.patientRow}>
            <View style={[styles.avatar, { backgroundColor: '#E2E8F0' }]}>
              <Text style={styles.avatarText}>{booking.patient.name.charAt(0)}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{booking.patient.name}</Text>
              <Text style={styles.patientDetails}>
                {booking.patient.age} years ·{' '}
                {booking.patient.gender === 'F'
                  ? 'Female'
                  : booking.patient.gender === 'M'
                  ? 'Male'
                  : 'Other'}
              </Text>
            </View>
          </View>
          <View style={styles.callButtonRow}>
            <Button
              title="📞 Call (Masked)"
              onPress={handleMaskedCall}
              variant="outline"
              size="sm"
              loading={calling}
            />
            <Button
              title="💬 Message"
              onPress={() => onNavigate('Messages', { bookingId })}
              variant="outline"
              size="sm"
            />
          </View>
        </Card>

        {/* Service details */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Service</Text>
          {booking.service && (
            <>
              <Text style={styles.serviceName}>{booking.service.name}</Text>
              <Text style={styles.serviceDesc}>{booking.service.description}</Text>
            </>
          )}
          <View style={styles.metaRow}>
            <MetaItem icon="📅" label={formatBookingDate(booking.starts_at)} />
            <MetaItem icon="⏱" label={formatDuration(booking.duration_min)} />
            <MetaItem icon="💰" label={formatCurrency(booking.amount_inr)} />
          </View>
        </Card>

        {/* Location */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          <Text style={styles.addressText}>{booking.address}</Text>
          <Text style={styles.cityText}>{booking.city}</Text>
          {booking.instructions && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>Instructions:</Text>
              <Text style={styles.instructionsText}>{booking.instructions}</Text>
            </View>
          )}
          <Button
            title="🗺 Navigate to Patient"
            onPress={() => onNavigate('NavigateToPatient', { bookingId })}
            variant="primary"
          />
        </Card>

        {/* Check-in flow */}
        {['confirmed', 'en_route', 'checked_in', 'in_service'].includes(booking.status) && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Visit Progress</Text>
            <CheckInStepper
              currentStatus={booking.status}
              onDepart={handleDepart}
              onVerifyOtp={handleVerifyOtp}
              onStartService={handleStartService}
              isHighRisk={isHighRisk}
              loading={depart.isPending || verifyOtp.isPending || startService.isPending}
            />
          </Card>
        )}

        {/* Action buttons */}
        {booking.status === 'in_service' && (
          <Button
            title="📝 Submit Service Report"
            onPress={() => onNavigate('ServiceReportForm', { bookingId })}
            variant="primary"
          />
        )}

        {/* Report Incident — always available regardless of visit status */}
        <Button
          title="⚠️ Report Incident"
          onPress={() => onNavigate('ReportIncident', { bookingId })}
          variant="ghost"
          style={styles.incidentButton}
        />

        {/* Cancel/Reschedule */}
        {['confirmed'].includes(booking.status) && (
          <View style={styles.cancelRow}>
            <Button
              title="Cancel"
              onPress={() => onNavigate('CancelRescheduleBooking', { bookingId, mode: 'cancel' })}
              variant="outline"
              style={styles.halfButton}
            />
            <Button
              title="Reschedule"
              onPress={() => onNavigate('CancelRescheduleBooking', { bookingId, mode: 'reschedule' })}
              variant="outline"
              style={styles.halfButton}
            />
          </View>
        )}

        {/* Timeline */}
        {booking.timeline && booking.timeline.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {booking.timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={[styles.timelineDot, event.at && styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>{event.label}</Text>
                  {event.at && (
                    <Text style={styles.timelineTime}>
                      {new Date(event.at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function MetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingId: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  patientDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceName: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  serviceDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addressText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cityText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  instructionsBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
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
  incidentButton: {
    marginTop: spacing.md,
  },
  cancelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  timelineTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
