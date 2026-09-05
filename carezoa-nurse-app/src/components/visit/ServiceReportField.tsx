// ============================================================================
// ServiceReportField — Dynamic form field for service report
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../ui/Input';
import { fontSize, spacing } from '../../theme';

interface ServiceReportFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  unit?: string;
  required?: boolean;
  multiline?: boolean;
}

export function ServiceReportField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  unit,
  required,
  multiline,
}: ServiceReportFieldProps) {
  return (
    <View style={styles.container}>
      <Input
        label={`${label}${required ? ' *' : ''}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
      />
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
}

/**
 * Get vitals fields based on service clinical risk level
 */
export function getVitalsFieldsForService(
  serviceName: string,
  clinicalRiskLevel?: string
): Array<{
  key: string;
  label: string;
  placeholder: string;
  keyboardType: 'default' | 'number-pad';
  unit?: string;
  required: boolean;
}> {
  const baseFields = [
    { key: 'temperature', label: 'Temperature', placeholder: '98.6', keyboardType: 'number-pad' as const, unit: '°F', required: false },
    { key: 'pulse', label: 'Pulse Rate', placeholder: '72', keyboardType: 'number-pad' as const, unit: 'bpm', required: false },
    { key: 'bp_systolic', label: 'BP Systolic', placeholder: '120', keyboardType: 'number-pad' as const, unit: 'mmHg', required: false },
    { key: 'bp_diastolic', label: 'BP Diastolic', placeholder: '80', keyboardType: 'number-pad' as const, unit: 'mmHg', required: false },
    { key: 'spo2', label: 'SpO2', placeholder: '98', keyboardType: 'number-pad' as const, unit: '%', required: false },
  ];

  // High-risk services (e.g., injection administration) require vitals
  if (clinicalRiskLevel === 'high') {
    return baseFields.map((f) => ({ ...f, required: true }));
  }

  return baseFields;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  unit: {
    position: 'absolute',
    right: 16,
    top: 38,
    fontSize: fontSize.sm,
    color: '#64748B',
  },
});
