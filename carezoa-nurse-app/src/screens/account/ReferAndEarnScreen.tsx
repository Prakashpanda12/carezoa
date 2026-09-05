// ============================================================================
// ReferAndEarn Screen — Referral code/link + status of referred nurses
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Share, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMyProvider } from '../../hooks';

export function ReferAndEarnScreen() {
  const { data: provider } = useMyProvider();

  // Mock referral data (would come from backend §24.1)
  const referralCode = provider ? `CZ-${provider.id.toString().padStart(4, '0')}` : '';
  const referralLink = `https://carezoa.com/refer/${referralCode}`;
  const referredNurses = [
    { name: 'Priya S.', status: 'active', joined: '2024-08-15' },
    { name: 'Anita M.', status: 'pending', joined: '2024-09-01' },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Carezoa as a healthcare provider! Use my referral code: ${referralCode}\n${referralLink}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral link.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Refer & Earn</Text>
      <Text style={styles.subtitle}>
        Invite fellow healthcare professionals to join Carezoa and earn rewards!
      </Text>

      {/* Referral code card */}
      <Card style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeValue}>{referralCode}</Text>
        <Button title="Share Referral Link" onPress={handleShare} variant="primary" />
      </Card>

      {/* How it works */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <StepRow step="1" text="Share your referral code with fellow nurses, doctors, or physiotherapists" />
        <StepRow step="2" text="They sign up using your code and complete verification" />
        <StepRow step="3" text="Both of you earn rewards after their first completed booking" />
      </Card>

      {/* Referred nurses */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Referred Nurses ({referredNurses.length})
      </Text>
      {referredNurses.map((nurse, index) => (
        <Card key={index} style={styles.nurseCard}>
          <View style={styles.nurseRow}>
            <View>
              <Text style={styles.nurseName}>{nurse.name}</Text>
              <Text style={styles.nurseDate}>Joined {nurse.joined}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    nurse.status === 'active' ? '#DCFCE7' : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      nurse.status === 'active' ? colors.success : colors.warning,
                  },
                ]}
              >
                {nurse.status === 'active' ? 'Active' : 'Pending'}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

function StepRow({ step, text }: { step: string; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNumber}>{step}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
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
  codeCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  codeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  codeValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumber: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textInverse,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  nurseCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nurseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nurseName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  nurseDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
