// ============================================================================
// MyBookings Screen — Accepted bookings list
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize } from '../../theme';
import {
  formatBookingDate,
  formatCurrency,
  formatDuration,
  getStatusInfo,
} from '../../utils/format';
import { useMyBookings } from '../../hooks';

interface MyBookingsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
] as const;

export function MyBookingsScreen({ onNavigate }: MyBookingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const { data: bookings, isLoading, refetch } = useMyBookings(activeTab);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <LoadingScreen />;

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>My Bookings</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {!bookings || bookings.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No Bookings"
              message={`No ${activeTab} bookings found.`}
            />
          ) : (
            bookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              return (
                <TouchableOpacity
                  key={booking.id}
                  onPress={() => onNavigate('VisitDetail', { bookingId: booking.id })}
                >
                  <Card style={styles.bookingCard}>
                    <View style={styles.header}>
                      <Badge label={statusInfo.label} color={statusInfo.color} />
                      <Text style={styles.amount}>
                        {formatCurrency(booking.amount_inr)}
                      </Text>
                    </View>
                    <Text style={styles.patient}>
                      {booking.patient.name} · {booking.patient.age}y
                    </Text>
                    {booking.service && (
                      <Text style={styles.service}>{booking.service.name}</Text>
                    )}
                    <View style={styles.meta}>
                      <Text style={styles.metaText}>
                        📅 {formatBookingDate(booking.starts_at)}
                      </Text>
                      <Text style={styles.metaText}>
                        ⏱ {formatDuration(booking.duration_min)}
                      </Text>
                    </View>
                    <Text style={styles.address} numberOfLines={1}>
                      📍 {booking.address}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  list: {
    flex: 1,
  },
  bookingCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  patient: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  service: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  address: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
