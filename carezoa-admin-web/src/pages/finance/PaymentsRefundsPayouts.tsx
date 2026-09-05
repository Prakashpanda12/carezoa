// ============================================================================
// Payments, Refunds & Payouts — Transaction table + actions
// ============================================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import apiClient from '@/lib/api';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusColor, formatCurrency, formatDate } from '@/lib/utils';
import type { Payout } from '@/types';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export function PaymentsRefundsPayouts() {
  const queryClient = useQueryClient();
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [transferRef, setTransferRef] = useState('');

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => {
      const response = await apiClient.get('/payouts/me');
      return response.data.items || response.data;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ payoutId, transferRef }: { payoutId: number; transferRef: string }) => {
      const response = await apiClient.post(`/admin/payouts/${payoutId}/mark-paid`, {
        transfer_ref: transferRef,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      setMarkPaidOpen(false);
      setTransferRef('');
      setSelectedPayout(null);
    },
  });

  const handleMarkPaid = (payout: Payout) => {
    setSelectedPayout(payout);
    setMarkPaidOpen(true);
  };

  const submitMarkPaid = () => {
    if (!selectedPayout || !transferRef.trim()) return;
    markPaidMutation.mutate({
      payoutId: selectedPayout.id,
      transferRef,
    });
  };

  if (isLoading) return <PageLoader />;

  const payoutList: Payout[] = payouts || [];

  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: 'id',
      header: 'Payout ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'booking_id',
      header: 'Booking',
      cell: ({ row }) => `#${row.original.booking_id}`,
    },
    {
      accessorKey: 'amount_inr',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.amount_inr),
    },
    {
      accessorKey: 'platform_fee_inr',
      header: 'Platform Fee',
      cell: ({ row }) => formatCurrency(row.original.platform_fee_inr),
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
      accessorKey: 'ready_at',
      header: 'Ready At',
      cell: ({ row }) =>
        row.original.ready_at ? formatDate(row.original.ready_at) : '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) =>
        row.original.status === 'payout_ready' || row.original.status === 'processing' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkPaid(row.original)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Paid
          </Button>
        ) : null,
    },
  ];

  // Calculate summary
  const totalAmount = payoutList.reduce((sum, p) => sum + p.amount_inr, 0);
  const paidAmount = payoutList
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_inr, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments, Refunds & Payouts</h1>
        <p className="text-muted-foreground mt-1">
          Transaction history and payout management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Payouts</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">Payouts ({payoutList.length})</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>
        <TabsContent value="payouts">
          <DataTable
            columns={columns}
            data={payoutList}
            searchKey="booking_id"
            searchPlaceholder="Search by booking ID..."
          />
        </TabsContent>
        <TabsContent value="refunds">
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No refund requests at this time.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Dialog */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              This action will be recorded in the audit log. Please provide the
              transfer reference from your payment gateway.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayout && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(selectedPayout.amount_inr)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Booking</span>
                  <span>#{selectedPayout.booking_id}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="transfer_ref">Transfer Reference *</Label>
              <Input
                id="transfer_ref"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="e.g., TXN_123456789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitMarkPaid}
              disabled={!transferRef.trim()}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
