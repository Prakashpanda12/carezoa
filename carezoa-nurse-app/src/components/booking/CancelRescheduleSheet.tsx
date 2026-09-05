// ============================================================================
// CancelRescheduleSheet — Bottom sheet with policy disclosure
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

interface CancelRescheduleSheetProps {
  visible: boolean;
  onClose: () => void;
  onCancel: (reason?: string) => void;
  onReschedule?: (newDate: string) => void;
  mode: 'cancel' | 'reschedule';
  reliabilityScore?: number;
  cancellationPenalty?: string;
  loading?: boolean;
}

export function CancelRescheduleSheet({
  visible,
  onClose,
  onCancel,
  mode,
  reliabilityScore,
  cancellationPenalty,
  loading,
}: CancelRescheduleSheetProps) {
  const [reason, setReason] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {mode === 'cancel' ? 'Cancel Booking' : 'Reschedule Booking'}
          </Text>

          {/* Policy disclosure — never a silent cancel */}
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>⚠️ Cancellation Policy</Text>
            {cancellationPenalty && (
              <Text style={styles.policyText}>{cancellationPenalty}</Text>
            )}
            {reliabilityScore !== undefined && (
              <Text style={styles.policyText}>
                Your current reliability score: {Math.round(reliabilityScore * 100)}%
              </Text>
            )}
            <Text style={styles.policyWarning}>
              Cancelling will affect your reliability score and may impact future booking
              assignments.
            </Text>
          </View>

          <Input
            label="Reason (optional)"
            placeholder="Why are you cancelling?"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actions}>
            <Button title="Go Back" onPress={onClose} variant="outline" style={styles.button} />
            <Button
              title="Confirm Cancel"
              onPress={() => onCancel(reason || undefined)}
              variant="danger"
              style={styles.button}
              loading={loading}
            />
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeLink}>
            <Text style={styles.closeText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  policyBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  policyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  policyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  policyWarning: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    flex: 1,
  },
  closeLink: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
