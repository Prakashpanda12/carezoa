// ============================================================================
// Route Configuration with RBAC Guards
// ============================================================================

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { AnalyticsDashboard } from '@/pages/overview/AnalyticsDashboard';
import { ProviderApplications } from '@/pages/providers/ProviderApplications';
import { CredentialVerification } from '@/pages/providers/CredentialVerification';
import { ProviderQuality } from '@/pages/providers/ProviderQuality';
import { BookingsPage } from '@/pages/marketplace/BookingsPage';
import { LiveServiceStatus } from '@/pages/marketplace/LiveServiceStatus';
import { ServiceCatalogue } from '@/pages/marketplace/ServiceCatalogue';
import { GeographicCoverage } from '@/pages/marketplace/GeographicCoverage';
import { PaymentsRefundsPayouts } from '@/pages/finance/PaymentsRefundsPayouts';
import { ComplaintsIncidents } from '@/pages/trust/ComplaintsIncidents';
import { FraudBypassFlags } from '@/pages/trust/FraudBypassFlags';
import { CustomerSupport } from '@/pages/trust/CustomerSupport';
import { RolesPermissions } from '@/pages/admin/RolesPermissions';
import { AuditLogViewer } from '@/pages/admin/AuditLogViewer';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/ui/spinner';
import type { UserRole } from '@/types';

// ============================================================================
// RBAC Guard Component
// ============================================================================

interface RbacGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RbacGuard({ children, allowedRoles }: RbacGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// Auth Guard
// ============================================================================

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// ============================================================================
// Router Configuration
// ============================================================================

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AnalyticsDashboard />,
      },
      // Provider Ops
      {
        path: 'providers/applications',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <ProviderApplications />
          </RbacGuard>
        ),
      },
      {
        path: 'providers/verification',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <CredentialVerification />
          </RbacGuard>
        ),
      },
      {
        path: 'providers/quality',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <ProviderQuality />
          </RbacGuard>
        ),
      },
      // Marketplace Ops
      {
        path: 'marketplace/bookings',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <BookingsPage />
          </RbacGuard>
        ),
      },
      {
        path: 'marketplace/live',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <LiveServiceStatus />
          </RbacGuard>
        ),
      },
      {
        path: 'marketplace/catalogue',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <ServiceCatalogue />
          </RbacGuard>
        ),
      },
      {
        path: 'marketplace/coverage',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <GeographicCoverage />
          </RbacGuard>
        ),
      },
      // Finance
      {
        path: 'finance',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <PaymentsRefundsPayouts />
          </RbacGuard>
        ),
      },
      // Trust & Safety
      {
        path: 'trust/incidents',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <ComplaintsIncidents />
          </RbacGuard>
        ),
      },
      {
        path: 'trust/fraud',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <FraudBypassFlags />
          </RbacGuard>
        ),
      },
      {
        path: 'trust/support',
        element: (
          <RbacGuard allowedRoles={['admin', 'support_agent']}>
            <CustomerSupport />
          </RbacGuard>
        ),
      },
      // Admin
      {
        path: 'admin/roles',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <RolesPermissions />
          </RbacGuard>
        ),
      },
      {
        path: 'admin/audit',
        element: (
          <RbacGuard allowedRoles={['admin']}>
            <AuditLogViewer />
          </RbacGuard>
        ),
      },
    ],
  },
]);
