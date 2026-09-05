// ============================================================================
// PhoneOTPLogin Screen
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, spacing, fontSize } from '../../theme';
import { useRequestOtp, useVerifyOtp } from '../../hooks/useAuth';

export function PhoneOTPLoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [devCode, setDevCode] = useState<string>();

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) return;
    try {
      const result = await requestOtp.mutateAsync(phone);
      setDevCode(result.dev_code);
      setStep('otp');
    } catch (error) {
      console.error('OTP request failed:', error);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      await verifyOtp.mutateAsync({ phone, code: otp });
      // Navigation handled by auth state change
    } catch (error) {
      console.error('OTP verification failed:', error);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Text style={styles.logo}>🏥</Text>
            <Text style={styles.title}>Carezoa Provider</Text>
            <Text style={styles.subtitle}>
              Healthcare at your doorstep — for nurses, doctors, physiotherapists & more
            </Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />
              <Button
                title="Send OTP"
                onPress={handleRequestOtp}
                loading={requestOtp.isPending}
                disabled={!phone || phone.length < 10}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.otpSent}>OTP sent to {phone}</Text>
              {devCode && <Text style={styles.devCode}>Dev code: {devCode}</Text>}
              <Input
                label="Enter 6-digit OTP"
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Button
                title="Verify & Continue"
                onPress={handleVerifyOtp}
                loading={verifyOtp.isPending}
                disabled={otp.length !== 6}
              />
              <Button
                title="Resend OTP"
                onPress={handleRequestOtp}
                variant="ghost"
                loading={requestOtp.isPending}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  otpSent: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  devCode: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    backgroundColor: '#E0F2FE',
    padding: spacing.sm,
    borderRadius: 4,
  },
});
