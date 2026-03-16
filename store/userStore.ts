import { create } from 'zustand';
import { MacroTarget } from '@/types';

interface UserState {
  userId: string | null;
  userEmail: string | null;
  macroTargets: MacroTarget | null;
  isLoading: boolean;

  setUser: (id: string, email: string) => void;
  clearUser: () => void;
  setMacroTargets: (targets: MacroTarget) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  userEmail: null,
  macroTargets: null,
  isLoading: false,

  setUser: (id, email) => set({ userId: id, userEmail: email }),
  clearUser: () => set({ userId: null, userEmail: null, macroTargets: null }),
  setMacroTargets: (targets) => set({ macroTargets: targets }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
