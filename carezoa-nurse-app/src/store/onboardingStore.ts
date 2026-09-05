// ============================================================================
// Onboarding Store — Resumable wizard state with persistence
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData } from '../types';

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
  isComplete: boolean;

  setStep: (step: number) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  complete: () => void;
  reset: () => void;
}

const initialState: OnboardingData = {};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      data: initialState,
      isComplete: false,

      setStep: (step) => set({ currentStep: step }),

      updateData: (data) =>
        set((state) => ({
          data: { ...state.data, ...data },
        })),

      complete: () => set({ isComplete: true }),

      reset: () =>
        set({
          currentStep: 0,
          data: initialState,
          isComplete: false,
        }),
    }),
    {
      name: 'carezoa-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
