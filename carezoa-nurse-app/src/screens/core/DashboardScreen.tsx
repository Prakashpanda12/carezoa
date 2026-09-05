// ============================================================================
// Dashboard Screen — Today's schedule + earnings snapshot + verification banner
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import {
  formatBookingDate,
  formatCurrency,
  formatDuration,
  getStatusInfo,
  getVerificationInfo,
} from '../../utils/format';
import { useMyBookings, useNewRequests, useEarningsSummary, useMyProvider } from '../../hooks';

interface DashboardScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { data: provider } = useMyProvider();
  const { data: todayBookings, refetch: refetchBookings } = useMyBookings('upcoming');
  const { data: requests } = useNewRequests();
  const { data: earnings } = useEarningsSummary();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings()]);
    setRefreshing(false);
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const todaysVisits = (todayBookings || []).filter(
    (b) => b.starts_at.startsWith(todayDate)
  );

  const verificationInfo = provider
    ? getVerificationInfo(provider.verification_status)
    : null;

  return (
    <ScreenContainer scroll={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {provider?.display_name || 'Provider'} 👋
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Verification status banner */}
        {verificationInfo && provider?.verification_status !== 'verified' && (
          <TouchableOpacity
            onPress={() => onNavigate('ProfileCredentials')}
            style={[styles.verificationBanner, { borderLeftColor: verificationInfo.color }]}
          >
            <Text style={styles.verificationText}>
              ⚠️ Verification: {verificationInfo.label}
            </Text>
            <Text style={styles.verificationSubtext}>Tap to view status</Text>
          </TouchableOpacity>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('NewBookingRequests')}
          >
            <Text style={styles.statValue}>{requests?.length || 0}</Text>
            <Text style={styles.statLabel}>New Requests</Text>
            {requests && requests.length > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('Earnings')}
          >
            <Text style={styles.statValue}>
              {earnings ? formatCurrency(earnings.this_week_inr) : '₹0'}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => onNavigate('MyBookings')}
          >
            <Text style={styles.statValue}>{todayBookings?.length || 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>
        </View>

        {/* Today's schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => onNavigate('MyBookings')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {todaysVisits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No bookings today</Text>
            </Card>
          ) : (
            todaysVisits.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              return (
                <TouchableOpacity
                  key={booking.id}
                  onPress={() => onNavigate('VisitDetail', { bookingId: booking.id })}
                >
                  <Card style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <Badge label={statusInfo.label} color={statusInfo.color} />
                      <Text style={styles.bookingAmount}>
                        {formatCurrency(booking.amount_inr)}
                      </Text>
                    </View>
                    <Text style={styles.bookingPatient}>
                      {booking.patient.name} · {booking.patient.age}y
                    </Text>
                    <View style={styles.bookingMeta}>
                      <Text style={styles.bookingTime}>
                        📅 {formatBookingDate(booking.starts_at)}
                      </Text>
                      <Text style={styles.bookingDuration}>
                        ⏱ {formatDuration(booking.duration_min)}
                      </Text>
                    </View>
                    {booking.service && (
                      <Text style={styles.bookingService}>
                        🏥 {booking.service.name}
                      </Text>
                    )}
                    <Text style={styles.bookingAddress} numberOfLines={1}>
                      📍 {booking.address}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verificationBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  verificationText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  verificationSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  bookingCard: {
    marginBottom: spacing.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  bookingPatient: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  bookingTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bookingDuration: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bookingService: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  bookingAddress: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
