// ============================================================================
// ScreenContainer Component
// ============================================================================

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  padded?: boolean;
}

export function ScreenContainer({
  children,
  style,
  scroll = true,
  padded = true,
}: ScreenContainerProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={[styles.container, style]}
          contentContainerStyle={[padded && styles.padded]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    padding: spacing.md,
  },
});
