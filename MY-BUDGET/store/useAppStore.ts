import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { currentYearMonth, shiftMonth, type YearMonth } from '@/utils/dates';

interface AppStore {
  session: Session | null;
  /** false tant que la session initiale n'a pas été lue (évite un flash de l'écran de connexion). */
  initialized: boolean;
  selectedMonth: YearMonth;
  setSession: (session: Session | null) => void;
  setInitialized: (value: boolean) => void;
  setSelectedMonth: (period: YearMonth) => void;
  shiftSelectedMonth: (delta: number) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  session: null,
  initialized: false,
  selectedMonth: currentYearMonth(),
  setSession: (session) => set({ session }),
  setInitialized: (value) => set({ initialized: value }),
  setSelectedMonth: (period) => set({ selectedMonth: period }),
  shiftSelectedMonth: (delta) => set({ selectedMonth: shiftMonth(get().selectedMonth, delta) }),
}));
