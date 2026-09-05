// ============================================================================
// Badge Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, fontSize, spacing } from '../../theme';

interface BadgeProps {
  label: string;
  color: string;
  style?: ViewStyle;
}

export function Badge({ label, color, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
