// ============================================================================
// Complaints & Incidents — Queue with severity/escalation
// ============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { getStatusColor, formatDate, truncate } from '@/lib/utils';
import type { Incident } from '@/types';
import { AlertTriangle, Eye } from 'lucide-react';

export function ComplaintsIncidents() {
  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const response = await apiClient.get('/incidents');
      return response.data.items || response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const columns: ColumnDef<Incident>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'booking_id',
      header: 'Booking',
      cell: ({ row }) => `#${row.original.booking_id}`,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm" title={row.original.description}>
          {truncate(row.original.description, 60)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Reported',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Complaints & Incidents</h1>
        <p className="text-muted-foreground mt-1">
          Review and resolve safety incidents and complaints
        </p>
      </div>

      <DataTable
        columns={columns}
        data={incidents || []}
        searchKey="description"
        searchPlaceholder="Search incidents..."
      />
    </div>
  );
}
