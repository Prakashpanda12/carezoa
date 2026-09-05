// ============================================================================
// ScorecardMetricCard — Individual quality metric display
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

interface ScorecardMetricCardProps {
  label: string;
  value: number; // 0..1 ratio or 1..5 for ratings
  type: 'percentage' | 'rating' | 'count';
  icon: string;
  target?: number;
}

export function ScorecardMetricCard({
  label,
  value,
  type,
  icon,
  target,
}: ScorecardMetricCardProps) {
  const displayValue =
    type === 'percentage'
      ? `${Math.round(value * 100)}%`
      : type === 'rating'
      ? value.toFixed(1)
      : value.toString();

  const getProgress = () => {
    if (type === 'percentage') return value;
    if (type === 'rating') return value / 5;
    return 0;
  };

  const getBarColor = () => {
    const progress = getProgress();
    if (progress >= 0.8) return colors.success;
    if (progress >= 0.5) return colors.warning;
    return colors.error;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      {type !== 'count' && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getProgress() * 100}%`, backgroundColor: getBarColor() },
            ]}
          />
        </View>
      )}
      {target !== undefined && (
        <Text style={styles.target}>
          Target: {type === 'percentage' ? `${Math.round(target * 100)}%` : target}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  target: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
