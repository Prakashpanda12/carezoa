// ============================================================================
// Audit Log Viewer — Read-only, filterable
// ============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types';

export function AuditLogViewer() {
  const [entityType, setEntityType] = useState('booking');
  const [entityId, setEntityId] = useState('1');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      const response = await apiClient.get('/admin/audit', {
        params: { entity_type: entityType, entity_id: parseInt(entityId) },
      });
      return response.data.items || response.data;
    },
    enabled: !!entityType && !!entityId,
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'actor_role',
      header: 'Actor',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.actor_role || 'system'}
        </Badge>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.action}</span>
      ),
    },
    {
      accessorKey: 'from_state',
      header: 'From',
      cell: ({ row }) =>
        row.original.from_state ? (
          <Badge variant="outline">{row.original.from_state}</Badge>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'to_state',
      header: 'To',
      cell: ({ row }) =>
        row.original.to_state ? (
          <Badge variant="outline">{row.original.to_state}</Badge>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          Read-only audit trail for all state transitions
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Entity Type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="payout">Payout</SelectItem>
              <SelectItem value="incident">Incident</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Entity ID</Label>
          <Input
            type="number"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="w-32"
            placeholder="ID"
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <DataTable columns={columns} data={logs || []} />
      )}
    </div>
  );
}
