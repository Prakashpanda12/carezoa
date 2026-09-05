// ============================================================================
// Offline Queue Store — Retry-safe check-in/OTP/report submission
// Persists failed operations and retries when connectivity returns
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export type QueuedAction =
  | {
      type: 'provider_departed';
      bookingId: number;
      timestamp: string;
    }
  | {
      type: 'verify_otp';
      bookingId: number;
      code: string;
      timestamp: string;
    }
  | {
      type: 'start_service';
      bookingId: number;
      timestamp: string;
    }
  | {
      type: 'submit_report';
      bookingId: number;
      data: { summary: string; vitals: Record<string, string>; notes?: string };
      timestamp: string;
    }
  | {
      type: 'complete_service';
      bookingId: number;
      timestamp: string;
    };

interface OfflineQueueState {
  queue: QueuedAction[];
  isProcessing: boolean;

  enqueue: (action: QueuedAction) => void;
  dequeue: () => QueuedAction | undefined;
  clearQueue: () => void;
  setProcessing: (processing: boolean) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      enqueue: (action) =>
        set((state) => ({
          queue: [...state.queue, action],
        })),

      dequeue: () => {
        const [first, ...rest] = get().queue;
        if (first) {
          set({ queue: rest });
        }
        return first;
      },

      clearQueue: () => set({ queue: [] }),

      setProcessing: (processing) => set({ isProcessing: processing }),
    }),
    {
      name: 'carezoa-offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
