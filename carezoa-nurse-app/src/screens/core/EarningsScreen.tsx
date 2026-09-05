// ============================================================================
// Earnings Screen — Payout history, pending vs paid
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import {
  EarningsSummaryCard,
  PayoutRow,
} from '../../components/earnings/EarningsComponents';
import { colors, spacing, fontSize } from '../../theme';
import { usePayouts, useEarningsSummary } from '../../hooks';

export function EarningsScreen() {
  const { data: payouts, isLoading: loadingPayouts, refetch } = usePayouts();
  const { data: summary, isLoading: loadingSummary } = useEarningsSummary();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  };

  if (loadingPayouts || loadingSummary) return <LoadingScreen />;

  const pendingPayouts = (payouts || []).filter(
    (p) => p.status === 'payout_ready' || p.status === 'processing'
  );
  const paidPayouts = (payouts || []).filter((p) => p.status === 'paid');

  return (
    <ScreenContainer scroll={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Earnings</Text>

        <EarningsSummaryCard
          thisWeek={summary?.this_week_inr || 0}
          thisMonth={summary?.this_month_inr || 0}
          total={summary?.total_inr || 0}
          pending={summary?.pending_inr || 0}
          paid={summary?.paid_inr || 0}
        />

        {/* Pending payouts */}
        <Text style={styles.sectionTitle}>
          Pending ({pendingPayouts.length})
        </Text>
        {pendingPayouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending payouts</Text>
          </Card>
        ) : (
          <Card>
            {pendingPayouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </Card>
        )}

        {/* Paid payouts */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
          Paid ({paidPayouts.length})
        </Text>
        {paidPayouts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No paid payouts yet</Text>
          </Card>
        ) : (
          <Card>
            {paidPayouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
