// ============================================================================
// SlotGrid — Weekly availability slot editor
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { formatMinutesToTime, getWeekdayName } from '../../utils/format';
import type { AvailabilityWindow } from '../../types';

interface SlotGridProps {
  windows: AvailabilityWindow[];
  onToggleSlot: (weekday: number, startMin: number, endMin: number) => void;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 8 AM to 8 PM

export function SlotGrid({ windows, onToggleSlot }: SlotGridProps) {
  const isSlotActive = (weekday: number, hour: number) => {
    const startMin = hour * 60;
    const endMin = (hour + 1) * 60;
    return windows.some(
      (w) => w.weekday === weekday && w.start_min <= startMin && w.end_min >= endMin
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.dayCol} />
        {HOURS.map((h) => (
          <View key={h} style={styles.hourCol}>
            <Text style={styles.hourLabel}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</Text>
          </View>
        ))}
      </View>

      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <View key={day} style={styles.row}>
          <View style={styles.dayCol}>
            <Text style={styles.dayLabel}>{getWeekdayName(day)}</Text>
          </View>
          {HOURS.map((hour) => (
            <TouchableOpacity
              key={`${day}-${hour}`}
              style={[
                styles.slot,
                isSlotActive(day, hour) && styles.slotActive,
              ]}
              onPress={() => onToggleSlot(day, hour * 60, (hour + 1) * 60)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCol: {
    width: 40,
    justifyContent: 'center',
  },
  hourCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hourLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  slot: {
    flex: 1,
    height: 28,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
