// ============================================================================
// Analytics Dashboard — Overview metrics
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { MetricCard, SimpleBarChart, SimplePieChart } from '@/components/charts';
import { PageLoader } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import {
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/overview');
      return response.data;
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const bookingsByStatus = analytics?.bookings_by_status || {};
  const totalBookings = Object.values(bookingsByStatus).reduce(
    (sum: number, count: any) => sum + count,
    0
  );
  const completedBookings = bookingsByStatus.completed || 0;
  const cancelledBookings = (bookingsByStatus.cancelled || 0) + (bookingsByStatus.no_show || 0);

  const statusData = Object.entries(bookingsByStatus).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value: value as number,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Bookings"
          value={totalBookings}
          icon={<Calendar className="h-8 w-8" />}
        />
        <MetricCard
          title="GMV"
          value={formatCurrency(analytics?.gmv_inr || 0)}
          icon={<CreditCard className="h-8 w-8" />}
        />
        <MetricCard
          title="Active Providers"
          value={providers?.length || 0}
          icon={<Users className="h-8 w-8" />}
        />
        <MetricCard
          title="Completion Rate"
          value={totalBookings > 0 ? `${((completedBookings / totalBookings) * 100).toFixed(1)}%` : '0%'}
          icon={<CheckCircle className="h-8 w-8" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Completed"
          value={completedBookings}
          change={`${totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}% of total`}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
        />
        <MetricCard
          title="Cancelled / No-Show"
          value={cancelledBookings}
          change={`${totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0}% cancellation rate`}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
        />
        <MetricCard
          title="In Progress"
          value={(bookingsByStatus.en_route || 0) + (bookingsByStatus.checked_in || 0) + (bookingsByStatus.in_service || 0)}
          change="Currently active visits"
          icon={<Calendar className="h-6 w-6 text-blue-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart data={statusData} title="Bookings by Status" />
        <SimplePieChart data={statusData} title="Booking Distribution" />
      </div>

      {/* Audit Events */}
      {analytics?.audit_events_by_entity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SimpleBarChart
            data={Object.entries(analytics.audit_events_by_entity).map(([name, value]) => ({
              name,
              value: value as number,
            }))}
            title="Audit Events by Entity"
          />
        </div>
      )}
    </div>
  );
}
