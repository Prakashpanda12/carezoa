// ============================================================================
// Geographic Coverage — Map of active service areas vs demand
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { MapPin } from 'lucide-react';

export function GeographicCoverage() {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  // Group providers by city
  const cityMap = (providers || []).reduce((acc: any, provider: any) => {
    const city = provider.city || 'Unknown';
    if (!acc[city]) {
      acc[city] = { providers: 0, total_coverage: 0 };
    }
    acc[city].providers += 1;
    acc[city].total_coverage += provider.coverage_km || 0;
    return acc;
  }, {});

  const cities = Object.entries(cityMap).map(([city, data]: [string, any]) => ({
    city,
    providers: data.providers,
    avg_coverage: data.total_coverage / data.providers,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Geographic Coverage</h1>
        <p className="text-muted-foreground mt-1">
          Active service areas and provider distribution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((cityData) => (
          <Card key={cityData.city}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                {cityData.city}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Providers</span>
                <Badge>{cityData.providers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Coverage</span>
                <span className="font-medium">{cityData.avg_coverage.toFixed(1)} km</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(cityData.providers * 10, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
