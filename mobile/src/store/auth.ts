import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { setAuthToken, setOnUnauthorized } from "../api/client";
import type { FamilyMember, PatientProfile } from "../types/api";

const TOKEN_KEY = "carezoa.token";

export interface ViewerMode {
  id: number;
  name: string;
  accessScope: FamilyMember["accessScope"];
}

interface AuthState {
  hydrated: boolean;
  token: string | null;
  patient: PatientProfile | null;
  viewer: ViewerMode | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, patient: PatientProfile | null) => Promise<void>;
  setPatient: (p: PatientProfile) => void;
  setViewer: (v: ViewerMode | null) => void;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  token: null,
  patient: null,
  viewer: null,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        set({ token });
      }
    } catch {
      /* keychain unavailable (web) — proceed unauthenticated */
    } finally {
      set({ hydrated: true });
    }
  },

  setSession: async (token, patient) => {
    setAuthToken(token);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      /* noop on web */
    }
    set({ token, patient, viewer: null });
  },

  setPatient: (patient) => set({ patient }),
  setViewer: (viewer) => set({ viewer }),

  signOut: async () => {
    setAuthToken(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* noop */
    }
    set({ token: null, patient: null, viewer: null });
  },
}));

// BUG-C03 fix: wire up 401 handler so expired tokens trigger sign-out
setOnUnauthorized(() => {
  useAuth.getState().signOut();
});

/** Whether a viewer-mode member is allowed a capability (API-granted scope). */
export function can(viewer: ViewerMode | null, cap: keyof ViewerMode["accessScope"]) {
  return viewer ? viewer.accessScope[cap] : true;
}

export const getAuthSnapshot = () => useAuth.getState();
