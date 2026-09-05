// ============================================================================
// Service Catalogue — CRUD for catalog items
// ============================================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import type { Service } from '@/types';
import { Edit, Plus } from 'lucide-react';

export function ServiceCatalogue() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await apiClient.get('/services');
      return response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const services: Service[] = (servicesData?.items || []).map((s: any) => ({
    ...s,
    active: true,
  }));

  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: 'icon',
      header: '',
      cell: ({ row }) => <span className="text-2xl">{row.original.icon || '🏥'}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Service Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.description}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
    },
    {
      accessorKey: 'duration_min',
      header: 'Duration',
      cell: ({ row }) => `${row.original.duration_min} min`,
    },
    {
      accessorKey: 'base_price_inr',
      header: 'Base Price',
      cell: ({ row }) => formatCurrency(row.original.base_price_inr),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Catalogue</h1>
          <p className="text-muted-foreground mt-1">
            Manage available services and eligibility rules
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={services}
        searchKey="name"
        searchPlaceholder="Search services..."
      />
    </div>
  );
}
