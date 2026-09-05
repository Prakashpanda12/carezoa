// ============================================================================
// MyProfile Screen — Editable profile + read-only scope & limitations
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useMyProvider, useUpdateProvider, useMyOfferings } from '../../hooks';

export function MyProfileScreen() {
  const { data: provider, isLoading } = useMyProvider();
  const { data: offerings = [] } = useMyOfferings();
  const updateProvider = useUpdateProvider();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    if (provider) {
      setDisplayName(provider.display_name);
      setBio(provider.bio);
      setLanguages(provider.languages.join(', '));
    }
  }, [provider]);

  if (isLoading) return <LoadingScreen />;

  const handleSave = async () => {
    try {
      await updateProvider.mutateAsync({
        display_name: displayName,
        bio,
        languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
      });
      setIsEditing(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>My Profile</Text>

      {/* Editable section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <Button
            title={isEditing ? 'Cancel' : 'Edit'}
            onPress={() => setIsEditing(!isEditing)}
            variant="ghost"
            size="sm"
          />
        </View>

        {isEditing ? (
          <>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder="Tell patients about yourself..."
            />
            <Input
              label="Languages (comma separated)"
              value={languages}
              onChangeText={setLanguages}
            />
            <Button title="Save Changes" onPress={handleSave} loading={updateProvider.isPending} />
          </>
        ) : (
          <>
            <InfoRow label="Name" value={provider?.display_name || ''} />
            <InfoRow label="Title" value={provider?.title || ''} />
            <InfoRow label="Experience" value={`${provider?.years_exp || 0} years`} />
            <InfoRow label="Languages" value={provider?.languages.join(', ') || ''} />
            <InfoRow label="City" value={provider?.city || ''} />
            <InfoRow
              label="Rating"
              value={`${provider?.rating_avg?.toFixed(1) || '0'} ⭐ (${provider?.rating_count || 0} reviews)`}
            />
            <InfoRow label="Bio" value={provider?.bio || 'No bio added yet'} multiline />
          </>
        )}
      </Card>

      {/* Read-only Scope & Limitations section */}
      <Card style={[styles.card, styles.scopeCard]}>
        <Text style={styles.sectionTitle}>Scope & Limitations</Text>
        <Text style={styles.scopeHint}>
          This section shows your permitted services and clinical scope as determined
          by verification. Only the verification team can modify this.
        </Text>

        <View style={styles.scopeSection}>
          <Text style={styles.scopeLabel}>Permitted Services</Text>
          {offerings.length === 0 ? (
            <Text style={styles.scopeEmpty}>No services configured</Text>
          ) : (
            <View style={styles.badgeRow}>
              {offerings.map((offering) => (
                <Badge
                  key={offering.id}
                  label={offering.service?.name || `Service #${offering.service_id}`}
                  color={colors.primary}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.scopeSection}>
          <Text style={styles.scopeLabel}>Qualifications</Text>
          <View style={styles.badgeRow}>
            {(provider?.qualifications || []).map((q, index) => (
              <Badge key={index} label={q} color={colors.secondary} />
            ))}
          </View>
        </View>

        <View style={styles.scopeSection}>
          <Text style={styles.scopeLabel}>Verification Status</Text>
          <Badge
            label={provider?.verification_status || 'unverified'}
            color={
              provider?.verification_status === 'verified'
                ? colors.success
                : colors.warning
            }
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>
        {value}
      </Text>
    </View>
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  infoValueMultiline: {
    lineHeight: 20,
  },
  scopeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  scopeHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  scopeSection: {
    marginBottom: spacing.md,
  },
  scopeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scopeEmpty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
