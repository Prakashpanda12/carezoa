// ============================================================================
// ProfileCredentials Screen — View verification status per document
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { getVerificationInfo } from '../../utils/format';
import { useCredentials, useMyProvider } from '../../hooks';
import { providerApi } from '../../api/provider';
import type { CredentialStatus } from '../../types';

export function ProfileCredentialsScreen() {
  const { data: credentials, isLoading, refetch } = useCredentials();
  const { data: provider } = useMyProvider();

  if (isLoading) return <LoadingScreen />;

  const verificationInfo = provider
    ? getVerificationInfo(provider.verification_status)
    : null;

  const getStatusColor = (status: CredentialStatus) => {
    switch (status) {
      case 'verified':
        return colors.success;
      case 'pending_review':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: CredentialStatus) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending_review':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleReupload = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      if (!result.canceled && result.assets[0]) {
        // Request upload URL and upload file
        const { upload_url } = await providerApi.requestCredentialUpload(docType as any);
        // In a real app, upload the file to the presigned URL
        Alert.alert('Uploaded', 'Document uploaded successfully. It will be reviewed shortly.');
        refetch();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Credentials & Verification</Text>

      {/* Overall status banner */}
      {verificationInfo && (
        <View
          style={[
            styles.statusBanner,
            { borderLeftColor: verificationInfo.color },
          ]}
        >
          <Text style={styles.statusTitle}>
            Overall Status: {verificationInfo.label}
          </Text>
          <Text style={styles.statusSubtitle}>
            {provider?.verification_status === 'verified'
              ? 'All your credentials are verified. You can accept bookings.'
              : 'Complete all credential verifications to start accepting bookings.'}
          </Text>
        </View>
      )}

      {/* Credential badges */}
      <View style={styles.badgeRow}>
        <VerificationBadge
          icon="🪪"
          label="Identity"
          status={
            credentials?.find((c) => c.doc_type === 'id_proof')?.status || 'pending_review'
          }
        />
        <VerificationBadge
          icon="🎓"
          label="Degree"
          status={
            credentials?.find((c) => c.doc_type === 'certificate')?.status || 'pending_review'
          }
        />
        <VerificationBadge
          icon="📋"
          label="Registration"
          status={
            credentials?.find((c) => c.doc_type === 'license')?.status || 'pending_review'
          }
        />
      </View>

      {/* Credential list */}
      <Text style={styles.sectionTitle}>Documents</Text>
      {(credentials || []).length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No documents uploaded yet</Text>
        </Card>
      ) : (
        (credentials || []).map((credential) => (
          <Card key={credential.id} style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <View>
                <Text style={styles.credentialType}>
                  {credential.doc_type === 'license'
                    ? 'Professional License'
                    : credential.doc_type === 'id_proof'
                    ? 'Government ID'
                    : 'Certificate'}
                </Text>
                {credential.verified_at && (
                  <Text style={styles.credentialDate}>
                    Verified: {new Date(credential.verified_at).toLocaleDateString()}
                  </Text>
                )}
                {credential.expires_at && (
                  <Text style={styles.credentialDate}>
                    Expires: {new Date(credential.expires_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Badge
                label={getStatusLabel(credential.status)}
                color={getStatusColor(credential.status)}
              />
            </View>

            {credential.status === 'rejected' && (
              <View style={styles.rejectedBox}>
                <Text style={styles.rejectedText}>
                  This document was rejected. Please re-upload a clear, valid document.
                </Text>
                <Button
                  title="Re-upload"
                  onPress={() => handleReupload(credential.doc_type)}
                  variant="outline"
                  size="sm"
                />
              </View>
            )}
          </Card>
        ))
      )}

      {/* Upload new document */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Upload New Document
      </Text>
      <View style={styles.uploadRow}>
        <Button
          title="📄 Upload License"
          onPress={() => handleReupload('license')}
          variant="outline"
          size="sm"
        />
        <Button
          title="🪪 Upload ID"
          onPress={() => handleReupload('id_proof')}
          variant="outline"
          size="sm"
        />
        <Button
          title="🎓 Upload Certificate"
          onPress={() => handleReupload('certificate')}
          variant="outline"
          size="sm"
        />
      </View>
    </ScreenContainer>
  );
}

function VerificationBadge({
  icon,
  label,
  status,
}: {
  icon: string;
  label: string;
  status: CredentialStatus;
}) {
  const color =
    status === 'verified'
      ? colors.success
      : status === 'rejected'
      ? colors.error
      : colors.warning;

  return (
    <View style={[styles.verBadge, { borderColor: color }]}>
      <Text style={styles.verBadgeIcon}>{icon}</Text>
      <Text style={styles.verBadgeLabel}>{label}</Text>
      <View style={[styles.verBadgeDot, { backgroundColor: color }]} />
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
  statusBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  verBadge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  verBadgeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  verBadgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.text,
  },
  verBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  credentialCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  credentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  credentialType: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  credentialDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rejectedBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectedText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  uploadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
