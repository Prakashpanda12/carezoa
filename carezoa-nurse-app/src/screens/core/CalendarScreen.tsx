// ============================================================================
// Calendar Screen — Availability management with recurring slots
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SlotGrid } from '../../components/calendar/SlotGrid';
import { colors, spacing, fontSize } from '../../theme';
import { useMyAvailability, useSetAvailability } from '../../hooks';
import type { AvailabilityWindow } from '../../types';

export function CalendarScreen() {
  const { data: windows = [], isLoading } = useMyAvailability();
  const setAvailability = useSetAvailability();
  const [localWindows, setLocalWindows] = useState<AvailabilityWindow[]>(windows);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    setLocalWindows(windows);
  }, [windows]);

  const handleToggleSlot = (weekday: number, startMin: number, endMin: number) => {
    setHasChanges(true);
    setLocalWindows((prev) => {
      const existing = prev.find(
        (w) => w.weekday === weekday && w.start_min === startMin && w.end_min === endMin
      );
      if (existing) {
        return prev.filter((w) => w !== existing);
      }
      return [...prev, { weekday, start_min: startMin, end_min: endMin }];
    });
  };

  const handleSave = async () => {
    try {
      await setAvailability.mutateAsync(localWindows);
      setHasChanges(false);
      Alert.alert('Saved', 'Your availability has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Availability</Text>
      <Text style={styles.subtitle}>
        Set your recurring weekly availability. Tap slots to toggle them.
      </Text>

      <Card style={styles.gridCard}>
        <SlotGrid windows={localWindows} onToggleSlot={handleToggleSlot} />
      </Card>

      <Card style={styles.legendCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.background }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>
        <Text style={styles.legendHint}>
          {localWindows.length} slot(s) selected
        </Text>
      </Card>

      {hasChanges && (
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={setAvailability.isPending}
        />
      )}
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
  gridCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  legendCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  legendHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
