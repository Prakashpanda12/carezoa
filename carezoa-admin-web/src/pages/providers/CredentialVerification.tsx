// ============================================================================
// Credential Verification — Document viewer + approve/reject
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
import { getStatusColor, formatDate } from '@/lib/utils';
import type { ProviderCredential } from '@/types';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

export function CredentialVerification() {
  const queryClient = useQueryClient();
  const [selectedCredential, setSelectedCredential] = useState<ProviderCredential | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');

  // Fetch all providers and their credentials
  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.get('/providers');
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ credentialId, approve, reason }: { credentialId: number; approve: boolean; reason: string }) => {
      const response = await apiClient.post(`/admin/credentials/${credentialId}/review`, {
        approve,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setDialogOpen(false);
      setReason('');
    },
  });

  const handleReview = (credential: ProviderCredential, reviewAction: 'approve' | 'reject') => {
    setSelectedCredential(credential);
    setAction(reviewAction);
    setDialogOpen(true);
  };

  const submitReview = () => {
    if (!selectedCredential) return;
    reviewMutation.mutate({
      credentialId: selectedCredential.id,
      approve: action === 'approve',
      reason,
    });
  };

  if (isLoading) return <PageLoader />;

  // Flatten credentials from providers (mock data since we don't have a direct credentials endpoint)
  const credentials: ProviderCredential[] = (providers || []).flatMap((provider: any) =>
    [1, 2, 3].map((i) => ({
      id: provider.id * 10 + i,
      provider_id: provider.id,
      doc_type: i === 1 ? 'license' : i === 2 ? 'id_proof' : 'certificate',
      s3_key: `mock-key-${provider.id}-${i}`,
      status: provider.verification_status === 'verified' ? 'verified' : 'pending_review',
      provider_name: provider.display_name,
      created_at: new Date().toISOString(),
    }))
  );

  const columns: ColumnDef<ProviderCredential>[] = [
    {
      accessorKey: 'provider_name',
      header: 'Provider',
      cell: ({ row }) => (row.original as any).provider_name || `Provider #${row.original.provider_id}`,
    },
    {
      accessorKey: 'doc_type',
      header: 'Document Type',
      cell: ({ row }) => (
        <span className="capitalize">{row.original.doc_type.replace('_', ' ')}</span>
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
      header: 'Submitted',
      cell: ({ row }) => formatDate(row.original.created_at || new Date().toISOString()),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'pending_review' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReview(row.original, 'approve')}
                className="text-green-600"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReview(row.original, 'reject')}
                className="text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Credential Verification</h1>
        <p className="text-muted-foreground mt-1">
          Review and verify provider credentials
        </p>
      </div>

      <DataTable
        columns={columns}
        data={credentials}
        searchKey="provider_name"
        searchPlaceholder="Search by provider..."
      />

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Credential' : 'Reject Credential'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'This will mark the credential as verified.'
                : 'This will reject the credential. The provider will be notified.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Document Type</Label>
              <p className="text-sm capitalize">
                {selectedCredential?.doc_type.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">
                {action === 'approve' ? 'Notes (optional)' : 'Reason for rejection *'}
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={action === 'reject' ? 'Explain why this credential is rejected...' : 'Add notes...'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={action === 'reject' && !reason.trim()}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
