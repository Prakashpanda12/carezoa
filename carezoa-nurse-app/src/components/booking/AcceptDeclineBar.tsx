// ============================================================================
// AcceptDeclineBar — Fixed bottom bar for accept/decline
// ============================================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import { colors, spacing } from '../../theme';

interface AcceptDeclineBarProps {
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
}

export function AcceptDeclineBar({ onAccept, onDecline, loading }: AcceptDeclineBarProps) {
  return (
    <View style={styles.container}>
      <Button
        title="Decline"
        onPress={onDecline}
        variant="outline"
        style={styles.button}
        disabled={loading}
      />
      <Button
        title="Accept"
        onPress={onAccept}
        variant="primary"
        style={styles.button}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
  },
});
