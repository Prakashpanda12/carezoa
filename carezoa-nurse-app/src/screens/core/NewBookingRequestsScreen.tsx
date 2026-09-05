// ============================================================================
// NewBookingRequests Screen — Accept/decline within SLA
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { BookingRequestCard } from '../../components/booking/BookingRequestCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { spacing, fontSize, colors } from '../../theme';
import { useNewRequests, useAcceptBooking, useDeclineBooking } from '../../hooks';

interface NewBookingRequestsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export function NewBookingRequestsScreen({ onNavigate }: NewBookingRequestsScreenProps) {
  const { data: requests, isLoading, refetch } = useNewRequests();
  const acceptBooking = useAcceptBooking();
  const declineBooking = useDeclineBooking();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAccept = async (bookingId: number) => {
    try {
      await acceptBooking.mutateAsync(bookingId);
      Alert.alert('Accepted', 'Booking accepted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept booking. Please try again.');
    }
  };

  const handleDecline = async (bookingId: number) => {
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineBooking.mutateAsync({ bookingId });
            } catch (error) {
              Alert.alert('Error', 'Failed to decline booking.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen message="Loading requests..." />;

  return (
    <ScreenContainer scroll={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>New Booking Requests</Text>
        <Text style={styles.subtitle}>
          Accept or decline within the SLA window. Quick responses improve your
          reliability score.
        </Text>

        {!requests || requests.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No New Requests"
            message="New booking requests will appear here when patients book your services."
          />
        ) : (
          requests.map((booking) => (
            <BookingRequestCard
              key={booking.id}
              booking={booking}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onPress={(id) => onNavigate('VisitDetail', { bookingId: id })}
              loading={acceptBooking.isPending || declineBooking.isPending}
            />
          ))
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
