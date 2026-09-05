// ============================================================================
// PayoutRow & EarningsSummaryCard
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { formatCurrency, formatRelativeTime, getStatusInfo } from '../../utils/format';
import type { Payout } from '../../types';

interface PayoutRowProps {
  payout: Payout;
}

export function PayoutRow({ payout }: PayoutRowProps) {
  const statusInfo = getStatusInfo(payout.status);

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowBooking}>Booking #{payout.booking_id}</Text>
        {payout.ready_at && (
          <Text style={styles.rowDate}>{formatRelativeTime(payout.ready_at)}</Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatCurrency(payout.amount_inr)}</Text>
        <Badge label={payout.status} color={statusInfo.color} />
      </View>
    </View>
  );
}

interface EarningsSummaryCardProps {
  thisWeek: number;
  thisMonth: number;
  total: number;
  pending: number;
  paid: number;
}

export function EarningsSummaryCard({
  thisWeek,
  thisMonth,
  pending,
  paid,
}: EarningsSummaryCardProps) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <SummaryItem label="This Week" value={formatCurrency(thisWeek)} />
        <SummaryItem label="This Month" value={formatCurrency(thisMonth)} />
      </View>
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <SummaryItem label="Pending" value={formatCurrency(pending)} color={colors.warning} />
        <SummaryItem label="Paid" value={formatCurrency(paid)} color={colors.success} />
      </View>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {},
  rowRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  rowBooking: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  rowDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
