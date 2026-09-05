// ============================================================================
// Provider Quality — Scorecard view for all providers
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatPercentage } from '@/lib/utils';
import type { Provider } from '@/types';

function QualityBar({ value, good }: { value: number; good: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${good ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
      <span className="text-sm">{formatPercentage(value)}</span>
    </div>
  );
}

export function ProviderQuality() {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const columns: ColumnDef<Provider>[] = [
    {
      accessorKey: 'display_name',
      header: 'Provider',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.display_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.title}</div>
        </div>
      ),
    },
    {
      accessorKey: 'rating_avg',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{row.original.rating_avg.toFixed(1)}</span>
          <span className="text-yellow-500">⭐</span>
          <span className="text-sm text-muted-foreground">({row.original.rating_count})</span>
        </div>
      ),
    },
    {
      accessorKey: 'acceptance_rate',
      header: 'Acceptance Rate',
      cell: ({ row }) => (
        <QualityBar value={row.original.acceptance_rate} good={row.original.acceptance_rate >= 0.8} />
      ),
    },
    {
      accessorKey: 'cancellation_rate',
      header: 'Cancellation Rate',
      cell: ({ row }) => (
        <QualityBar value={row.original.cancellation_rate} good={row.original.cancellation_rate <= 0.1} />
      ),
    },
    {
      accessorKey: 'verification_status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          className={
            row.original.verification_status === 'verified'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }
        >
          {row.original.verification_status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Quality</h1>
        <p className="text-muted-foreground mt-1">
          Quality scorecards for all providers
        </p>
      </div>

      <DataTable
        columns={columns}
        data={providers || []}
        searchKey="display_name"
        searchPlaceholder="Search providers..."
      />
    </div>
  );
}
