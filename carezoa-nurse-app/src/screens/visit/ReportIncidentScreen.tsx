// ============================================================================
// ReportIncident Screen — Safety/incident report (always accessible)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { IncidentReportForm } from '../../components/visit/IncidentReportForm';
import { colors, spacing, fontSize } from '../../theme';
import { incidentsApi } from '../../api/incidents';
import type { IncidentType } from '../../types';

interface ReportIncidentScreenProps {
  bookingId: number;
  onNavigate: (screen: string, params?: any) => void;
}

export function ReportIncidentScreen({
  bookingId,
  onNavigate,
}: ReportIncidentScreenProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (data: {
    type: IncidentType;
    description: string;
    photos?: string[];
  }) => {
    setLoading(true);
    try {
      await incidentsApi.reportIncident(bookingId, {
        type: data.type,
        description: data.description,
      });
      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted. Our support team will review it shortly.',
        [{ text: 'OK', onPress: () => onNavigate('VisitDetail', { bookingId }) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Report Incident</Text>
      <Text style={styles.subtitle}>
        Use this to report any safety concern, no-show, misconduct, or other
        issue related to this booking. You can report an incident at any time
        during or after a visit.
      </Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ℹ️ Incident reports are reviewed by the support team and may lead to
          booking status changes. False reports may affect your account standing.
        </Text>
      </View>

      <IncidentReportForm onSubmit={handleSubmit} loading={loading} />
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
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
