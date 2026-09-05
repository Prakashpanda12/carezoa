// ============================================================================
// CheckInStepper — Step-by-step check-in flow
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import type { BookingStatus } from '../../types';

interface CheckInStepperProps {
  currentStatus: BookingStatus;
  onDepart: () => void;
  onVerifyOtp: (code: string) => void;
  onStartService: () => void;
  prescriptionVerified?: boolean;
  isHighRisk?: boolean;
  loading?: boolean;
}

export function CheckInStepper({
  currentStatus,
  onDepart,
  onVerifyOtp,
  onStartService,
  prescriptionVerified,
  isHighRisk,
  loading,
}: CheckInStepperProps) {
  const [otpCode, setOtpCode] = useState('');

  const steps = [
    { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
    { key: 'en_route', label: 'En Route', emoji: '🚗' },
    { key: 'checked_in', label: 'Arrived', emoji: '📍' },
    { key: 'in_service', label: 'In Service', emoji: '🏥' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);

  // Clinical-scope guardrail: high-risk services require verified prescription
  const isOtpBlocked = isHighRisk && !prescriptionVerified;

  return (
    <View style={styles.container}>
      {/* Step indicators */}
      <View style={styles.stepsRow}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepWrapper}>
            <View
              style={[
                styles.stepCircle,
                index <= currentStepIndex && styles.stepActive,
              ]}
            >
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                index <= currentStepIndex && styles.stepLabelActive,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  index < currentStepIndex && styles.connectorActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Action area */}
      <View style={styles.actionArea}>
        {currentStatus === 'confirmed' && (
          <>
            <Text style={styles.actionText}>
              Tap below when you are leaving for the visit.
            </Text>
            <Button
              title="I'm En Route"
              onPress={onDepart}
              variant="primary"
              loading={loading}
            />
          </>
        )}

        {currentStatus === 'en_route' && (
          <>
            {isOtpBlocked ? (
              <View style={styles.blockedBox}>
                <Text style={styles.blockedText}>
                  ⚠️ This is a high-risk service. The linked prescription must be verified
                  before check-in can proceed.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.actionText}>
                  Ask the patient or family member for the 4-digit check-in code.
                </Text>
                <Input
                  label="Check-in OTP"
                  placeholder="Enter 4-digit code"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Button
                  title="Verify OTP"
                  onPress={() => onVerifyOtp(otpCode)}
                  variant="primary"
                  disabled={otpCode.length !== 4}
                  loading={loading}
                />
              </>
            )}
          </>
        )}

        {currentStatus === 'checked_in' && (
          <>
            <Text style={styles.actionText}>
              You have arrived. Start the service when ready.
            </Text>
            <Button
              title="Start Service"
              onPress={onStartService}
              variant="primary"
              loading={loading}
            />
          </>
        )}

        {currentStatus === 'in_service' && (
          <Text style={styles.actionText}>
            Service is in progress. Complete the service report when finished.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepEmoji: {
    fontSize: 18,
  },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  connector: {
    position: 'absolute',
    top: 20,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  actionArea: {
    padding: spacing.md,
  },
  actionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  blockedBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  blockedText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
