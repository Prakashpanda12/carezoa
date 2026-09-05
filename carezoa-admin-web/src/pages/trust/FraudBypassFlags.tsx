// ============================================================================
// Fraud & Bypass Flags — Anti-bypass review queue
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
import { formatDate } from '@/lib/utils';
import type { FlaggedEvent } from '@/types';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export function FraudBypassFlags() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<FlaggedEvent | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [reason, setReason] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['flagged-events'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/flagged-events');
      return response.data.items || response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ eventId, outcome }: { eventId: number; outcome: string }) => {
      const response = await apiClient.post(`/admin/flagged-events/${eventId}/review`, {
        outcome,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-events'] });
      setReviewOpen(false);
      setOutcome('');
      setReason('');
      setShowBody(false);
    },
  });

  const handleReview = (event: FlaggedEvent) => {
    setSelectedEvent(event);
    setReviewOpen(true);
  };

  const submitReview = (reviewOutcome: string) => {
    if (!selectedEvent) return;
    setOutcome(reviewOutcome);
    reviewMutation.mutate({
      eventId: selectedEvent.id,
      outcome: reviewOutcome,
    });
  };

  if (isLoading) return <PageLoader />;

  const severityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const columns: ColumnDef<FlaggedEvent>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => (
        <Badge className={severityColors[row.original.severity] || ''}>
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: 'patterns',
      header: 'Detected Patterns',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.patterns || []).slice(0, 3).map((pattern: string, i: number) => (
            <Badge key={i} variant="outline" className="text-xs">
              {pattern}
            </Badge>
          ))}
          {(row.original.patterns || []).length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.patterns.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'thread_id',
      header: 'Thread',
      cell: ({ row }) => `#${row.original.thread_id}`,
    },
    {
      accessorKey: 'created_at',
      header: 'Flagged',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleReview(row.original)}
        >
          <Shield className="h-4 w-4 mr-1" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fraud & Bypass Flags</h1>
        <p className="text-muted-foreground mt-1">
          Review communication events flagged by the anti-bypass scanner
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Privacy Notice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Message content is hidden by default. Only expand when necessary for
              review. All reviews are recorded in the audit log.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={events || []}
        searchKey="patterns"
        searchPlaceholder="Search by pattern..."
      />

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Flagged Event #{selectedEvent?.id}</DialogTitle>
            <DialogDescription>
              Review the flagged communication and take appropriate action.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Severity</p>
                  <Badge className={severityColors[selectedEvent.severity] || ''}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thread</p>
                  <p>#{selectedEvent.thread_id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Detected Patterns
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedEvent.patterns || []).map((pattern: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Message Content</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBody(!showBody)}
                  >
                    {showBody ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" /> Show
                      </>
                    )}
                  </Button>
                </div>
                {showBody ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    {selectedEvent.body}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-muted-foreground italic">
                    Content hidden — click Show to reveal
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Review Notes</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add context for your decision..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => submitReview('dismissed')}
            >
              Dismiss
            </Button>
            <Button
              variant="outline"
              onClick={() => submitReview('warned')}
            >
              Warn Provider
            </Button>
            <Button
              variant="destructive"
              onClick={() => submitReview('suspended')}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
