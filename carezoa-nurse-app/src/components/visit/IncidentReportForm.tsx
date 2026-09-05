// ============================================================================
// IncidentReportForm — Safety/incident report
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import type { IncidentType } from '../../types';

interface IncidentReportFormProps {
  onSubmit: (data: {
    type: IncidentType;
    description: string;
    photos?: string[];
  }) => void;
  loading?: boolean;
}

const INCIDENT_TYPES: { key: IncidentType; label: string; emoji: string }[] = [
  { key: 'safety', label: 'Safety Concern', emoji: '⚠️' },
  { key: 'no_show', label: 'Patient No Show', emoji: '🚫' },
  { key: 'misconduct', label: 'Misconduct', emoji: '🚨' },
  { key: 'other', label: 'Other', emoji: '📋' },
];

export function IncidentReportForm({ onSubmit, loading }: IncidentReportFormProps) {
  const [type, setType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    if (!type) {
      Alert.alert('Required', 'Please select an incident type.');
      return;
    }
    if (description.length < 10) {
      Alert.alert('Required', 'Please provide a description of at least 10 characters.');
      return;
    }
    onSubmit({ type, description, photos: photos.length > 0 ? photos : undefined });
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Incident Type</Text>
      <View style={styles.typeGrid}>
        {INCIDENT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeCard, type === t.key && styles.typeCardSelected]}
            onPress={() => setType(t.key)}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={styles.typeLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Description *"
        placeholder="Describe the incident in detail..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.sectionTitle}>Photos (optional)</Text>
      <View style={styles.photoActions}>
        <Button title="Take Photo" onPress={handleTakePhoto} variant="outline" size="sm" />
        <Button title="Choose from Library" onPress={handlePickPhoto} variant="outline" size="sm" />
      </View>

      {photos.length > 0 && (
        <Text style={styles.photoCount}>{photos.length} photo(s) attached</Text>
      )}

      <Button
        title="Submit Incident Report"
        onPress={handleSubmit}
        variant="danger"
        loading={loading}
        disabled={!type || description.length < 10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photoCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
