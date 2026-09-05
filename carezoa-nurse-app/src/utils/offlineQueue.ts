// ============================================================================
// Offline Queue Processor — retries failed clinical-adjacent operations
// ============================================================================

import NetInfo from '@react-native-community/netinfo';
import { bookingsApi } from '../api/bookings';
import { useOfflineQueueStore, QueuedAction } from '../store/offlineQueueStore';

let isProcessing = false;

/**
 * Process the offline queue — called when connectivity returns
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) return;

  const { queue, setProcessing, dequeue } = useOfflineQueueStore.getState();
  if (queue.length === 0) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  isProcessing = true;
  setProcessing(true);

  while (queue.length > 0) {
    const action = dequeue();
    if (!action) break;

    try {
      await executeAction(action);
    } catch (error) {
      console.error('Failed to process queued action:', action, error);
      // Re-enqueue on failure — will retry next connectivity event
      useOfflineQueueStore.getState().enqueue(action);
      break; // Stop processing to avoid cascading failures
    }
  }

  setProcessing(false);
  isProcessing = false;
}

/**
 * Execute a queued action
 */
async function executeAction(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case 'provider_departed':
      await bookingsApi.providerDeparted(action.bookingId);
      break;
    case 'verify_otp':
      await bookingsApi.verifyOtp(action.bookingId, action.code);
      break;
    case 'start_service':
      await bookingsApi.startService(action.bookingId);
      break;
    case 'submit_report':
      await bookingsApi.submitServiceReport(action.bookingId, action.data);
      break;
    case 'complete_service':
      await bookingsApi.completeService(action.bookingId);
      break;
  }
}

/**
 * Set up connectivity listener to process queue when online
 */
export function setupQueueProcessor(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processQueue();
    }
  });

  return () => unsubscribe();
}
