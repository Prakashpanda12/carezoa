// ============================================================================
// Provider Applications — Queue + Detail View
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { getStatusColor, formatDate } from '@/lib/utils';
import type { Provider } from '@/types';
import { Eye } from 'lucide-react';

export function ProviderApplications() {
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
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.display_name}</div>
          <div className="text-sm text-muted-foreground">{row.original.title}</div>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
    {
      accessorKey: 'years_exp',
      header: 'Experience',
      cell: ({ row }) => `${row.original.years_exp} years`,
    },
    {
      accessorKey: 'rating_avg',
      header: 'Rating',
      cell: ({ row }) => (
        <span>
          {row.original.rating_avg.toFixed(1)} ⭐ ({row.original.rating_count})
        </span>
      ),
    },
    {
      accessorKey: 'verification_status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.verification_status)}>
          {row.original.verification_status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'acceptance_rate',
      header: 'Acceptance',
      cell: ({ row }) => `${(row.original.acceptance_rate * 100).toFixed(0)}%`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage provider applications
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
