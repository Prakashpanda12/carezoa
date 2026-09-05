// ============================================================================
// Customer Support — Ticket queue
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
import type { Ticket } from '@/types';
import { Eye } from 'lucide-react';

export function CustomerSupport() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await apiClient.get('/tickets');
      return response.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.subject}</span>
      ),
    },
    {
      accessorKey: 'body',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {truncate(row.original.body, 80)}
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
      header: 'Created',
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
        <h1 className="text-3xl font-bold">Customer Support</h1>
        <p className="text-muted-foreground mt-1">
          Support ticket queue
        </p>
      </div>

      <DataTable
        columns={columns}
        data={tickets || []}
        searchKey="subject"
        searchPlaceholder="Search tickets..."
      />
    </div>
  );
}
