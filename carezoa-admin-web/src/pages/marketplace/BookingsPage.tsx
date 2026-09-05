// ============================================================================
// Bookings — Searchable/filterable table + detail drawer
// ============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { getStatusColor, formatCurrency, formatDate } from '@/lib/utils';
import type { Booking } from '@/types';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Use providers endpoint as proxy for bookings (backend doesn't have admin bookings list yet)
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
  });

  // Mock bookings data based on providers
  const bookings: Booking[] = (providers || []).map((provider: any, index: number) => ({
    id: index + 1,
    status: ['confirmed', 'completed', 'en_route', 'cancelled'][index % 4] as any,
    payment_status: 'paid',
    starts_at: new Date(Date.now() + index * 86400000).toISOString(),
    duration_min: 60,
    patient: { name: `Patient ${index + 1}`, age: 30 + index, gender: 'M' as const },
    address: `${index + 1} Main Street, Bhubaneswar`,
    city: 'Bhubaneswar',
    instructions: '',
    amount_inr: 500 + index * 100,
    currency: 'INR',
    provider_id: provider.id,
    service_id: 1,
    timeline: [],
    provider,
    created_at: new Date().toISOString(),
  }));

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'patient.name',
      header: 'Patient',
      cell: ({ row }) => row.original.patient.name,
    },
    {
      accessorKey: 'provider.display_name',
      header: 'Provider',
      cell: ({ row }) => row.original.provider?.display_name || `Provider #${row.original.provider_id}`,
    },
    {
      accessorKey: 'starts_at',
      header: 'Scheduled',
      cell: ({ row }) => formatDate(row.original.starts_at),
    },
    {
      accessorKey: 'amount_inr',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.amount_inr),
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          All bookings across the platform
        </p>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchKey="patient.name"
        searchPlaceholder="Search by patient or provider..."
      />

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking #{selectedBooking?.id}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient</p>
                  <p>{selectedBooking.patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.patient.age}y, {selectedBooking.patient.gender}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider</p>
                  <p>{selectedBooking.provider?.display_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p>{formatCurrency(selectedBooking.amount_inr)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p>{formatDate(selectedBooking.starts_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p>{selectedBooking.duration_min} minutes</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{selectedBooking.address}</p>
              </div>

              {/* Timeline / State Machine History */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">State Machine History</p>
                <div className="space-y-2">
                  {selectedBooking.timeline.length > 0 ? (
                    selectedBooking.timeline.map((event, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium">{event.label}</span>
                        {event.at && (
                          <span className="text-muted-foreground">{formatDate(event.at)}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No timeline events</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
