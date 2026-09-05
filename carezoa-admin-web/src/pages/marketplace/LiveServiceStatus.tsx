// ============================================================================
// Live Service Status — Currently active bookings (EN_ROUTE, CHECKED_IN, IN_SERVICE)
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { getStatusColor, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { MapPin, Clock, User } from 'lucide-react';

export function LiveServiceStatus() {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) return <PageLoader />;

  // Mock active bookings
  const activeStatuses = ['en_route', 'checked_in', 'in_service'] as const;
  const activeBookings = (providers || []).slice(0, 6).map((provider: any, index: number) => ({
    id: index + 1,
    status: activeStatuses[index % 3],
    provider: provider.display_name,
    patient: `Patient ${index + 1}`,
    address: `${index + 1} Main Street, Bhubaneswar`,
    amount_inr: 500 + index * 100,
    started_at: new Date(Date.now() - index * 1800000).toISOString(),
  }));

  const statusCounts = {
    en_route: activeBookings.filter((b) => b.status === 'en_route').length,
    checked_in: activeBookings.filter((b) => b.status === 'checked_in').length,
    in_service: activeBookings.filter((b) => b.status === 'in_service').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Service Status</h1>
        <p className="text-muted-foreground mt-1">
          Currently active visits (auto-refreshes every 10s)
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Route</p>
                <p className="text-3xl font-bold text-purple-600">{statusCounts.en_route}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                🚗
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                <p className="text-3xl font-bold text-teal-600">{statusCounts.checked_in}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                📍
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Service</p>
                <p className="text-3xl font-bold text-yellow-600">{statusCounts.in_service}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                🏥
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeBookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">#{booking.id}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.patient}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{booking.provider}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{booking.address}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">{formatCurrency(booking.amount_inr)}</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(booking.started_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
