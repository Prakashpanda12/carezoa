// ============================================================================
// BookingRequestCard — Shows new booking request with accept/decline
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { formatBookingDate, formatCurrency, formatDuration, getStatusInfo } from '../../utils/format';
import type { Booking } from '../../types';

interface BookingRequestCardProps {
  booking: Booking;
  onAccept: (bookingId: number) => void;
  onDecline: (bookingId: number) => void;
  onPress: (bookingId: number) => void;
  loading?: boolean;
}

export function BookingRequestCard({
  booking,
  onAccept,
  onDecline,
  onPress,
  loading,
}: BookingRequestCardProps) {
  const statusInfo = getStatusInfo(booking.status);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Badge label={statusInfo.label} color={statusInfo.color} />
        <Text style={styles.amount}>{formatCurrency(booking.amount_inr)}</Text>
      </View>

      <View style={styles.patientRow}>
        <View style={[styles.avatar, { backgroundColor: '#E2E8F0' }]}>
          <Text style={styles.avatarText}>{booking.patient.name.charAt(0)}</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{booking.patient.name}</Text>
          <Text style={styles.patientDetails}>
            {booking.patient.age}y · {booking.patient.gender === 'F' ? 'Female' : booking.patient.gender === 'M' ? 'Male' : 'Other'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <DetailRow icon="📅" text={formatBookingDate(booking.starts_at)} />
        <DetailRow icon="⏱" text={formatDuration(booking.duration_min)} />
        {booking.service && <DetailRow icon="🏥" text={booking.service.name} />}
        <DetailRow icon="📍" text={booking.address} />
      </View>

      {booking.instructions ? (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsLabel}>Instructions:</Text>
          <Text style={styles.instructionsText}>{booking.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Decline"
          onPress={() => onDecline(booking.id)}
          variant="outline"
          style={styles.actionButton}
          disabled={loading}
        />
        <Button
          title="Accept"
          onPress={() => onAccept(booking.id)}
          variant="primary"
          style={styles.actionButton}
          loading={loading}
        />
      </View>
    </Card>
  );
}

function DetailRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.lg,
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
  details: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
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
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
