// ============================================================================
// ProviderOnboardingWizard — Resumable multi-step wizard
// Steps: Basic Info -> Services & Area -> Document Upload -> Agreement -> Pending
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useServices } from '../../hooks/useProvider';

const STEPS = [
  { key: 'basic', title: 'About You' },
  { key: 'services', title: 'Services & Area' },
  { key: 'documents', title: 'Documents' },
  { key: 'agreement', title: 'Agreement' },
  { key: 'pending', title: 'Under Review' },
];

export function ProviderOnboardingWizardScreen() {
  const { currentStep, data, setStep, updateData, isComplete } = useOnboardingStore();
  const { data: servicesData } = useServices();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        {/* Progress indicator */}
        <View style={styles.progressBar}>
          {STEPS.map((step, index) => (
            <View key={step.key} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              >
                <Text style={styles.progressDotText}>{index + 1}</Text>
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    index < currentStep && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 0 && (
            <BasicInfoStep data={data} updateData={updateData} onNext={handleNext} />
          )}
          {currentStep === 1 && (
            <ServicesAreaStep
              data={data}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
              services={servicesData?.items || []}
            />
          )}
          {currentStep === 2 && (
            <DocumentsStep data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <AgreementStep data={data} updateData={updateData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 4 && <PendingApprovalStep />}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ============================================================================
// Step 1: Basic Info
// ============================================================================

function BasicInfoStep({
  data,
  updateData,
  onNext,
}: {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
}) {
  const [name, setName] = useState(data.display_name || '');
  const [title, setTitle] = useState(data.title || '');
  const [experience, setExperience] = useState(data.years_exp?.toString() || '');
  const [languages, setLanguages] = useState(data.languages?.join(', ') || '');

  const handleNext = () => {
    if (!name || !title) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    updateData({
      display_name: name,
      title,
      years_exp: parseInt(experience) || 0,
      languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
    });
    onNext();
  };

  return (
    <View>
      <Input label="Full Name *" placeholder="Your full name" value={name} onChangeText={setName} />
      <Input label="Title *" placeholder="e.g., Registered Nurse, Physiotherapist" value={title} onChangeText={setTitle} />
      <Input label="Years of Experience" placeholder="e.g., 5" value={experience} onChangeText={setExperience} keyboardType="number-pad" />
      <Input label="Languages (comma separated)" placeholder="English, Hindi, Odia" value={languages} onChangeText={setLanguages} />
      <Button title="Next" onPress={handleNext} />
    </View>
  );
}

// ============================================================================
// Step 2: Services & Area
// ============================================================================

function ServicesAreaStep({
  data,
  updateData,
  onNext,
  onBack,
  services,
}: {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
  services: any[];
}) {
  const [selectedServices, setSelectedServices] = useState<number[]>(data.services || []);
  const [city, setCity] = useState(data.city || '');
  const [coverage, setCoverage] = useState(data.coverage_km?.toString() || '10');

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedServices.length === 0 || !city) {
      Alert.alert('Required', 'Please select at least one service and enter your city.');
      return;
    }
    updateData({
      services: selectedServices,
      city,
      coverage_km: parseInt(coverage) || 10,
    });
    onNext();
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Select Services You Offer</Text>
      <View style={styles.serviceGrid}>
        {services.map((service) => (
          <Card
            key={service.id}
            style={[
              styles.serviceCard,
              selectedServices.includes(service.id) && styles.serviceCardSelected,
            ]}
            padded={false}
          >
            <Button
              title={service.name}
              onPress={() => toggleService(service.id)}
              variant={selectedServices.includes(service.id) ? 'primary' : 'ghost'}
              size="sm"
            />
          </Card>
        ))}
      </View>

      <Input label="City *" placeholder="e.g., Bhubaneswar" value={city} onChangeText={setCity} />
      <Input
        label="Coverage Radius (km)"
        placeholder="10"
        value={coverage}
        onChangeText={setCoverage}
        keyboardType="number-pad"
      />

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={styles.halfButton} />
        <Button title="Next" onPress={handleNext} style={styles.halfButton} />
      </View>
    </View>
  );
}

// ============================================================================
// Step 3: Document Upload
// ============================================================================

function DocumentsStep({
  data,
  updateData,
  onNext,
  onBack,
}: {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [license, setLicense] = useState<string | null>(data.credentials?.license || null);
  const [idProof, setIdProof] = useState<string | null>(data.credentials?.id_proof || null);

  const pickDocument = async (
    setter: (val: string | null) => void
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      if (!result.canceled && result.assets[0]) {
        setter(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleNext = () => {
    if (!license || !idProof) {
      Alert.alert('Required', 'Please upload both license and ID proof.');
      return;
    }
    updateData({
      credentials: { license, id_proof: idProof },
    });
    onNext();
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Upload Credentials</Text>

      <Card style={styles.uploadCard}>
        <Text style={styles.uploadLabel}>Professional License / Registration *</Text>
        <Text style={styles.uploadHint}>
          Upload your nursing council registration or professional license
        </Text>
        <Button
          title={license ? '✅ Document Selected' : 'Choose Document'}
          onPress={() => pickDocument(setLicense)}
          variant={license ? 'secondary' : 'outline'}
        />
      </Card>

      <Card style={styles.uploadCard}>
        <Text style={styles.uploadLabel}>Government ID Proof *</Text>
        <Text style={styles.uploadHint}>Aadhaar, PAN, or Passport</Text>
        <Button
          title={idProof ? '✅ Document Selected' : 'Choose Document'}
          onPress={() => pickDocument(setIdProof)}
          variant={idProof ? 'secondary' : 'outline'}
        />
      </Card>

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={styles.halfButton} />
        <Button title="Next" onPress={handleNext} style={styles.halfButton} />
      </View>
    </View>
  );
}

// ============================================================================
// Step 4: Agreement
// ============================================================================

function AgreementStep({
  data,
  updateData,
  onNext,
  onBack,
}: {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [accepted, setAccepted] = useState(data.agreement_accepted || false);

  const handleNext = () => {
    if (!accepted) {
      Alert.alert('Required', 'Please accept the agreement to continue.');
      return;
    }
    updateData({ agreement_accepted: true });
    // TODO: Submit onboarding data to backend
    onNext();
  };

  return (
    <View>
      <Card style={styles.agreementCard}>
        <Text style={styles.agreementTitle}>Provider Agreement</Text>
        <ScrollView style={styles.agreementText} nestedScrollEnabled>
          <Text>
            By accepting this agreement, you confirm that:{'\n\n'}
            1. All information provided is accurate and verifiable.{'\n'}
            2. You hold valid professional credentials for the services you offer.{'\n'}
            3. You will comply with Carezoa's quality standards and code of conduct.{'\n'}
            4. You understand the cancellation policy and its impact on your reliability score.{'\n'}
            5. You will maintain patient confidentiality at all times.{'\n'}
            6. You agree to the platform fee structure and payout terms.{'\n'}
          </Text>
        </ScrollView>
      </Card>

      <Button
        title={accepted ? '✅ Accepted' : 'Accept Agreement'}
        onPress={() => setAccepted(!accepted)}
        variant={accepted ? 'secondary' : 'outline'}
      />

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={onBack} variant="outline" style={styles.halfButton} />
        <Button title="Submit Application" onPress={handleNext} style={styles.halfButton} loading={false} />
      </View>
    </View>
  );
}

// ============================================================================
// Step 5: Pending Approval
// ============================================================================

function PendingApprovalStep() {
  return (
    <View style={styles.pendingContainer}>
      <Text style={styles.pendingIcon}>⏳</Text>
      <Text style={styles.pendingTitle}>Application Under Review</Text>
      <Text style={styles.pendingText}>
        Your application and documents are being verified. This usually takes 24-48 hours.
        We'll notify you once approved.
      </Text>
      <Card style={styles.pendingCard}>
        <Text style={styles.pendingCardTitle}>What's Next?</Text>
        <Text style={styles.pendingCardText}>• Document verification</Text>
        <Text style={styles.pendingCardText}>• Background check</Text>
        <Text style={styles.pendingCardText}>• Profile activation</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textInverse,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  stepTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  serviceCard: {
    minWidth: '45%',
  },
  serviceCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  halfButton: {
    flex: 1,
  },
  uploadCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  uploadLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  agreementCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  agreementTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  agreementText: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pendingIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  pendingTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  pendingCard: {
    padding: spacing.md,
    width: '100%',
  },
  pendingCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pendingCardText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
