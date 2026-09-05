// ============================================================================
// Navigation — Main navigator for the Provider App
// Uses React Navigation with type-safe params
// ============================================================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

// Auth screens
import { PhoneOTPLoginScreen } from '../screens/auth/PhoneOTPLoginScreen';
import { ProviderOnboardingWizardScreen } from '../screens/auth/ProviderOnboardingWizardScreen';

// Core screens
import { DashboardScreen } from '../screens/core/DashboardScreen';
import { NewBookingRequestsScreen } from '../screens/core/NewBookingRequestsScreen';
import { CalendarScreen } from '../screens/core/CalendarScreen';
import { EarningsScreen } from '../screens/core/EarningsScreen';
import { ServiceCatalogueScreen } from '../screens/core/ServiceCatalogueScreen';
import { ServiceAreaScreen } from '../screens/core/ServiceAreaScreen';

// Visit screens
import { VisitDetailScreen } from '../screens/visit/VisitDetailScreen';
import { NavigateToPatientScreen } from '../screens/visit/NavigateToPatientScreen';
import { ServiceReportFormScreen } from '../screens/visit/ServiceReportFormScreen';
import { VisitCompleteScreen } from '../screens/visit/VisitCompleteScreen';
import { ReportIncidentScreen } from '../screens/visit/ReportIncidentScreen';

// Booking screens
import { MyBookingsScreen } from '../screens/booking/MyBookingsScreen';
import { CancelRescheduleBookingScreen } from '../screens/booking/CancelRescheduleBookingScreen';

// Account screens
import { ProfileCredentialsScreen } from '../screens/account/ProfileCredentialsScreen';
import { MyProfileScreen } from '../screens/account/MyProfileScreen';
import { QualityScorecardScreen } from '../screens/account/QualityScorecardScreen';
import { MessagesScreen } from '../screens/account/MessagesScreen';
import { RatingsScreen } from '../screens/account/RatingsScreen';
import { ReferAndEarnScreen } from '../screens/account/ReferAndEarnScreen';
import { BenefitsScreen } from '../screens/account/BenefitsScreen';
import { SupportScreen } from '../screens/account/SupportScreen';

import { colors } from '../theme';
import { useAuthStore } from '../store/authStore';

// ============================================================================
// Navigation Param Types
// ============================================================================

export type RootStackParamList = {
  // Auth
  PhoneOTPLogin: undefined;
  ProviderOnboardingWizard: undefined;

  // Main tabs
  MainTabs: undefined;

  // Core
  Dashboard: undefined;
  NewBookingRequests: undefined;
  Calendar: undefined;
  Earnings: undefined;
  ServiceCatalogue: undefined;
  ServiceArea: undefined;

  // Visit
  VisitDetail: { bookingId: number };
  NavigateToPatient: { bookingId: number };
  ServiceReportForm: { bookingId: number };
  VisitComplete: { bookingId: number };
  ReportIncident: { bookingId: number };

  // Booking
  MyBookings: undefined;
  CancelRescheduleBooking: { bookingId: number; mode: 'cancel' | 'reschedule' };

  // Account
  ProfileCredentials: undefined;
  MyProfile: undefined;
  QualityScorecard: undefined;
  Messages: { bookingId: number };
  Ratings: undefined;
  ReferAndEarn: undefined;
  Benefits: undefined;
  Support: undefined;
};

// ============================================================================
// Tab Navigator
// ============================================================================

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

/**
 * Generic navigation helper passed to screens.
 * In a real app, you'd use navigation.navigate() directly.
 */
function createNavHelper(navigation: any) {
  return (screen: string, params?: any) => {
    navigation.navigate(screen as never, params as never);
  };
}

function DashboardTab({ navigation }: any) {
  return <DashboardScreen onNavigate={createNavHelper(navigation)} />;
}

function BookingsTab({ navigation }: any) {
  return <MyBookingsScreen onNavigate={createNavHelper(navigation)} />;
}

function RequestsTab({ navigation }: any) {
  return <NewBookingRequestsScreen onNavigate={createNavHelper(navigation)} />;
}

function EarningsTab() {
  return <EarningsScreen />;
}

function ProfileTab({ navigation }: any) {
  return <AccountMenu onNavigate={createNavHelper(navigation)} />;
}

function AccountMenu({ onNavigate }: { onNavigate: (screen: string, params?: any) => void }) {
  const { user, logout } = useAuthStore();
  const menuItems = [
    { label: '👤 My Profile', screen: 'MyProfile' },
    { label: '📋 Credentials & Verification', screen: 'ProfileCredentials' },
    { label: '📊 Quality Scorecard', screen: 'QualityScorecard' },
    { label: '⭐ Ratings', screen: 'Ratings' },
    { label: '📅 Calendar & Availability', screen: 'Calendar' },
    { label: '🏥 Service Catalogue', screen: 'ServiceCatalogue' },
    { label: '📍 Service Area', screen: 'ServiceArea' },
    { label: '🎁 Refer & Earn', screen: 'ReferAndEarn' },
    { label: '🛡 Benefits', screen: 'Benefits' },
    { label: '💬 Support', screen: 'Support' },
  ];

  return (
    <DashboardScreen
      onNavigate={onNavigate}
    />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} /> }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ============================================================================
// Root Stack
// ============================================================================

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="PhoneOTPLogin" component={PhoneOTPLoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProviderOnboardingWizard" component={ProviderOnboardingWizardScreen} />

            {/* Core */}
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="NewBookingRequests" component={NewBookingRequestsScreen} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="ServiceCatalogue" component={ServiceCatalogueScreen} />
            <Stack.Screen name="ServiceArea" component={ServiceAreaScreen} />

            {/* Visit */}
            <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
            <Stack.Screen name="NavigateToPatient" component={NavigateToPatientScreen} />
            <Stack.Screen name="ServiceReportForm" component={ServiceReportFormScreen} />
            <Stack.Screen name="VisitComplete" component={VisitCompleteScreen} />
            <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />

            {/* Booking */}
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="CancelRescheduleBooking" component={CancelRescheduleBookingScreen} />

            {/* Account */}
            <Stack.Screen name="ProfileCredentials" component={ProfileCredentialsScreen} />
            <Stack.Screen name="MyProfile" component={MyProfileScreen} />
            <Stack.Screen name="QualityScorecard" component={QualityScorecardScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Ratings" component={RatingsScreen} />
            <Stack.Screen name="ReferAndEarn" component={ReferAndEarnScreen} />
            <Stack.Screen name="Benefits" component={BenefitsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
