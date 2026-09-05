// ============================================================================
// BenefitsScreen — Insurance/benefits info (placeholder-safe)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { colors, spacing, fontSize } from '../../theme';

export function BenefitsScreen() {
  // Placeholder — shown only if backend flags them as active
  const benefitsActive = false; // Would come from backend

  return (
    <ScreenContainer>
      <Text style={styles.title}>Benefits</Text>

      {benefitsActive ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.benefitIcon}>🏥</Text>
            <Text style={styles.benefitTitle}>Health Insurance</Text>
            <Text style={styles.benefitDesc}>
              Comprehensive health coverage for you and your family.
            </Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.benefitIcon}>🛡</Text>
            <Text style={styles.benefitTitle}>Accident Insurance</Text>
            <Text style={styles.benefitDesc}>
              Coverage for accidents during active visits.
            </Text>
          </Card>
          <Card style={styles.card}>
            <Text style={styles.benefitIcon}>📚</Text>
            <Text style={styles.benefitTitle}>Training & Upskilling</Text>
            <Text style={styles.benefitDesc}>
              Free access to certified training programs.
            </Text>
          </Card>
        </>
      ) : (
        <Card style={styles.placeholderCard}>
          <Text style={styles.placeholderIcon}>🎁</Text>
          <Text style={styles.placeholderTitle}>Benefits Coming Soon</Text>
          <Text style={styles.placeholderText}>
            We're working on bringing you great benefits including health insurance,
            accident coverage, and training programs. Stay tuned!
          </Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefitDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  placeholderCard: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
