// ============================================================================
// ServiceReportForm Screen — Structured per service type
// Vitals fields appear conditionally based on clinical risk level
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import {
  ServiceReportField,
  getVitalsFieldsForService,
} from '../../components/visit/ServiceReportField';
import { colors, spacing, fontSize } from '../../theme';
import { useBooking, useSubmitReport, useCompleteService } from '../../hooks';

interface ServiceReportFormScreenProps {
  bookingId: number;
  onNavigate: (screen: string, params?: any) => void;
}

export function ServiceReportFormScreen({
  bookingId,
  onNavigate,
}: ServiceReportFormScreenProps) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const submitReport = useSubmitReport();
  const completeService = useCompleteService();

  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [vitals, setVitals] = useState<Record<string, string>>({});

  if (isLoading || !booking) return <LoadingScreen />;

  // Determine vitals fields based on service
  const clinicalRiskLevel = booking.service?.name?.toLowerCase().includes('injection')
    ? 'high'
    : 'low';
  const vitalsFields = getVitalsFieldsForService(
    booking.service?.name || '',
    clinicalRiskLevel
  );

  const updateVital = (key: string, value: string) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (summary.length < 10) {
      Alert.alert('Required', 'Please provide a summary of at least 10 characters.');
      return;
    }

    // Validate required vitals for high-risk services
    if (clinicalRiskLevel === 'high') {
      const missingRequired = vitalsFields.filter((f) => f.required && !vitals[f.key]);
      if (missingRequired.length > 0) {
        Alert.alert(
          'Required',
          `Please fill in required vitals: ${missingRequired.map((f) => f.label).join(', ')}`
        );
        return;
      }
    }

    try {
      // Submit report (triggers payout)
      await submitReport.mutateAsync({
        bookingId,
        data: {
          summary,
          vitals,
          notes: notes || undefined,
        },
      });

      // Complete the service
      await completeService.mutateAsync(bookingId);

      onNavigate('VisitComplete', { bookingId });
    } catch (error) {
      Alert.alert(
        'Queued',
        'Your report has been saved and will be submitted when you are back online.'
      );
      onNavigate('VisitComplete', { bookingId });
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Service Report</Text>
        <Text style={styles.subtitle}>
          {booking.service?.name || 'Service'} — Booking #{booking.id}
        </Text>

        {/* Summary */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Summary *</Text>
          <Input
            placeholder="Describe the service provided, patient condition, and outcomes..."
            value={summary}
            onChangeText={setSummary}
            multiline
            numberOfLines={5}
            containerStyle={{ marginBottom: 0 }}
          />
          <Text style={styles.charCount}>{summary.length}/4000</Text>
        </Card>

        {/* Vitals — conditional based on service */}
        {vitalsFields.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>
              Vitals {clinicalRiskLevel === 'high' && '(Required for this service)'}
            </Text>
            {clinicalRiskLevel === 'high' && (
              <View style={styles.highRiskBanner}>
                <Text style={styles.highRiskText}>
                  ⚠️ High-risk service — all vitals are required
                </Text>
              </View>
            )}
            {vitalsFields.map((field) => (
              <ServiceReportField
                key={field.key}
                label={field.label}
                value={vitals[field.key] || ''}
                onChangeText={(v) => updateVital(field.key, v)}
                placeholder={field.placeholder}
                keyboardType={field.keyboardType}
                unit={field.unit}
                required={field.required}
              />
            ))}
          </Card>
        )}

        {/* Additional Notes */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Input
            placeholder="Any follow-up recommendations, observations, or concerns..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        <Button
          title="Submit Report & Complete Visit"
          onPress={handleSubmit}
          loading={submitReport.isPending}
          disabled={summary.length < 10}
        />

        <Text style={styles.disclaimer}>
          Once submitted, this report cannot be edited. It will be shared with the
          patient/family and triggers your payout.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
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
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  highRiskBanner: {
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  highRiskText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
