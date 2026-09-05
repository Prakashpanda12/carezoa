// ============================================================================
// RatingsScreen — Own rating history
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize } from '../../theme';
import { useRatingHistory } from '../../hooks';

export function RatingsScreen() {
  const { data, isLoading } = useRatingHistory();

  if (isLoading) return <LoadingScreen />;

  const reviews = data?.reviews || [];

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Ratings</Text>

      {/* Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.avgRating}>{data?.rating_avg?.toFixed(1) || '0.0'}</Text>
        <Text style={styles.stars}>
          {'⭐'.repeat(Math.round(data?.rating_avg || 0))}
        </Text>
        <Text style={styles.totalReviews}>
          {data?.rating_count || 0} reviews
        </Text>
      </Card>

      {/* Review list */}
      {reviews.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No Reviews Yet"
          message="Complete visits to receive patient reviews."
        />
      ) : (
        <ScrollView>
          {reviews.map((review) => (
            <Card key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              {review.text && <Text style={styles.reviewText}>{review.text}</Text>}
              <Text style={styles.reviewAuthor}>— {review.author_label}</Text>
            </Card>
          ))}
        </ScrollView>
      )}
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
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avgRating: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  stars: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  totalReviews: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reviewCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  reviewText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reviewAuthor: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
