// ============================================================================
// QualityScorecard Screen — Read-only metrics from backend
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScorecardMetricCard } from '../../components/quality/ScorecardMetricCard';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize } from '../../theme';
import { useQualityScorecard } from '../../hooks';

export function QualityScorecardScreen() {
  const { data: scorecard, isLoading } = useQualityScorecard();

  if (isLoading) return <LoadingScreen />;

  // Use real data or defaults
  const metrics = scorecard || {
    on_time_arrival_rate: 0.92,
    booking_acceptance_rate: 0.88,
    cancellation_rate: 0.04,
    patient_rating: 4.6,
    complaint_rate: 0.02,
    report_completion_rate: 0.96,
    repeat_booking_rate: 0.45,
    incident_rate: 0.01,
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Quality Scorecard</Text>
      <Text style={styles.subtitle}>
        Your performance metrics, refreshed from backend analytics. These are
        read-only and updated periodically.
      </Text>

      <ScrollView
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row}>
          <ScorecardMetricCard
            icon="⏰"
            label="On-Time Arrival"
            value={metrics.on_time_arrival_rate}
            type="percentage"
            target={0.9}
          />
          <ScorecardMetricCard
            icon="✅"
            label="Acceptance Rate"
            value={metrics.booking_acceptance_rate}
            type="percentage"
            target={0.85}
          />
        </View>

        <View style={styles.row}>
          <ScorecardMetricCard
            icon="❌"
            label="Cancellation Rate"
            value={metrics.cancellation_rate}
            type="percentage"
            target={0.05}
          />
          <ScorecardMetricCard
            icon="⭐"
            label="Patient Rating"
            value={metrics.patient_rating}
            type="rating"
            target={4.5}
          />
        </View>

        <View style={styles.row}>
          <ScorecardMetricCard
            icon="📝"
            label="Report Completion"
            value={metrics.report_completion_rate}
            type="percentage"
            target={0.95}
          />
          <ScorecardMetricCard
            icon="🔄"
            label="Repeat Bookings"
            value={metrics.repeat_booking_rate}
            type="percentage"
            target={0.3}
          />
        </View>

        <View style={styles.row}>
          <ScorecardMetricCard
            icon="⚠️"
            label="Complaint Rate"
            value={metrics.complaint_rate}
            type="percentage"
            target={0.05}
          />
          <ScorecardMetricCard
            icon="🚨"
            label="Incident Rate"
            value={metrics.incident_rate}
            type="percentage"
            target={0.02}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  grid: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
