// ============================================================================
// CancelRescheduleBooking Screen — Policy disclosure before cancel
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import {
  formatBookingDate,
  formatCurrency,
  getStatusInfo,
} from '../../utils/format';
import { useBooking, useCancelBooking, useRescheduleBooking, useMyProvider } from '../../hooks';

interface CancelRescheduleBookingScreenProps {
  bookingId: number;
  mode: 'cancel' | 'reschedule';
  onNavigate: (screen: string, params?: any) => void;
}

export function CancelRescheduleBookingScreen({
  bookingId,
  mode,
  onNavigate,
}: CancelRescheduleBookingScreenProps) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const { data: provider } = useMyProvider();
  const cancelBooking = useCancelBooking();
  const rescheduleBooking = useRescheduleBooking();

  const [reason, setReason] = useState('');

  if (isLoading || !booking) return <LoadingScreen />;

  const statusInfo = getStatusInfo(booking.status);

  // Cancellation policy disclosure — never a silent cancel
  const hoursUntilStart = Math.max(
    0,
    Math.round(
      (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60)
    )
  );
  const isWithin2Hours = hoursUntilStart < 2;

  const handleCancel = async () => {
    if (isWithin2Hours) {
      Alert.alert(
        'Cannot Cancel Online',
        'Cancellations within 2 hours of the visit must go through support. Please contact support to cancel.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      `This will cancel the booking and may affect your reliability score.\n\nCurrent reliability: ${Math.round((provider?.acceptance_rate || 0.9) * 100)}%`,
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync({ bookingId, reason });
              Alert.alert('Cancelled', 'Booking has been cancelled.', [
                { text: 'OK', onPress: () => onNavigate('MyBookings') },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>
        {mode === 'cancel' ? 'Cancel Booking' : 'Reschedule Booking'}
      </Text>

      {/* Booking summary */}
      <Card style={styles.summaryCard}>
        <Badge label={statusInfo.label} color={statusInfo.color} />
        <Text style={styles.patientName}>{booking.patient.name}</Text>
        <Text style={styles.serviceName}>
          {booking.service?.name || 'Service'}
        </Text>
        <Text style={styles.dateTime}>
          {formatBookingDate(booking.starts_at)} · {formatCurrency(booking.amount_inr)}
        </Text>
      </Card>

      {/* Policy disclosure — critical guardrail */}
      <View style={[styles.policyBox, isWithin2Hours && styles.policyBoxWarning]}>
        <Text style={styles.policyTitle}>⚠️ Cancellation Policy</Text>
        <Text style={styles.policyText}>
          • Cancellations more than 2 hours before the visit have minimal impact
          on your reliability score.
        </Text>
        <Text style={styles.policyText}>
          • Cancellations within 2 hours must go through support and may result
          in a reliability score penalty.
        </Text>
        <Text style={styles.policyText}>
          • The CANCELLED_BY_PROVIDER state transition is recorded and affects
          your quality scorecard.
        </Text>
        {isWithin2Hours && (
          <Text style={styles.policyUrgent}>
            ⏰ This booking is within 2 hours — please contact support to cancel.
          </Text>
        )}
      </View>

      {/* Reliability impact */}
      <Card style={styles.impactCard}>
        <Text style={styles.impactTitle}>Impact on Your Score</Text>
        <View style={styles.impactRow}>
          <Text style={styles.impactLabel}>Current Reliability</Text>
          <Text style={styles.impactValue}>
            {Math.round((provider?.acceptance_rate || 0.9) * 100)}%
          </Text>
        </View>
        <View style={styles.impactRow}>
          <Text style={styles.impactLabel}>Cancellation Rate</Text>
          <Text style={styles.impactValue}>
            {Math.round((provider?.cancellation_rate || 0.05) * 100)}%
          </Text>
        </View>
      </Card>

      <Input
        label="Reason (required for audit)"
        placeholder="Why are you cancelling?"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
      />

      <Button
        title={mode === 'cancel' ? 'Confirm Cancellation' : 'Reschedule'}
        onPress={handleCancel}
        variant="danger"
        loading={cancelBooking.isPending}
        disabled={!reason.trim()}
      />

      <Button
        title="Go Back"
        onPress={() => onNavigate('VisitDetail', { bookingId })}
        variant="ghost"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  serviceName: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  dateTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  policyBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  policyBoxWarning: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: colors.error,
  },
  policyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  policyText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  policyUrgent: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  impactCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  impactTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  impactLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  impactValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
});
