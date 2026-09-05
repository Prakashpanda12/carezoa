// ============================================================================
// VisitComplete Screen — Post-visit confirmation
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { colors, spacing, fontSize } from '../../theme';
import { formatCurrency, formatDuration } from '../../utils/format';
import { useBooking } from '../../hooks';

interface VisitCompleteScreenProps {
  bookingId: number;
  onNavigate: (screen: string, params?: any) => void;
}

export function VisitCompleteScreen({ bookingId, onNavigate }: VisitCompleteScreenProps) {
  const { data: booking } = useBooking(bookingId);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Visit Complete!</Text>
        <Text style={styles.subtitle}>
          Your service report has been submitted and payout is being processed.
        </Text>

        {booking && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Visit Summary</Text>
            <SummaryRow label="Patient" value={booking.patient.name} />
            <SummaryRow label="Service" value={booking.service?.name || 'N/A'} />
            <SummaryRow
              label="Duration"
              value={formatDuration(booking.duration_min)}
            />
            <SummaryRow
              label="Amount"
              value={formatCurrency(booking.amount_inr)}
            />
            <View style={styles.payoutBadge}>
              <Badge label="Payout Ready" color={colors.success} />
            </View>
          </Card>
        )}

        <Button
          title="Back to Dashboard"
          onPress={() => onNavigate('Dashboard')}
          variant="primary"
        />
        <Button
          title="⚠️ Report an Incident"
          onPress={() => onNavigate('ReportIncident', { bookingId })}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  payoutBadge: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
});
