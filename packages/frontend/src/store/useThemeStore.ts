import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  isAuto: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const isNightTime = () => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18; // Dark mode from 6 PM to 6 AM
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: isNightTime(),
      isAuto: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark, isAuto: false })),
      setTheme: (isDark) => set({ isDark, isAuto: false }),
    }),
    {
      name: 'baaqoon-theme-storage',
    }
  )
);

