import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * In 'system' mode, dark mode runs from 6:00 PM (18:00) to 5:59 AM (05:59)
 * and light mode runs from 6:00 AM (06:00) to 5:59 PM (17:59).
 */
export const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
};

export const computeIsDark = (mode: ThemeMode): boolean => {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return isNightTime();
};

interface ThemeState {
  themeMode: ThemeMode;
  isDark: boolean;
  isAuto: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  refreshSystemTheme: () => void;
  // Backwards compatibility
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      isDark: isNightTime(),
      isAuto: true,

      setThemeMode: (mode: ThemeMode) =>
        set(() => {
          const nextDark = computeIsDark(mode);
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', nextDark);
          }
          return {
            themeMode: mode,
            isDark: nextDark,
            isAuto: mode === 'system',
          };
        }),

      refreshSystemTheme: () =>
        set((state) => {
          if (state.themeMode !== 'system') return state;
          const nextDark = isNightTime();
          if (nextDark !== state.isDark) {
            if (typeof document !== 'undefined') {
              document.documentElement.classList.toggle('dark', nextDark);
            }
            return { isDark: nextDark };
          }
          return state;
        }),

      toggleTheme: () =>
        set((state) => {
          const nextMode: Record<ThemeMode, ThemeMode> = {
            light: 'dark',
            dark: 'system',
            system: 'light',
          };
          const target = nextMode[state.themeMode] || 'system';
          const nextDark = computeIsDark(target);
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', nextDark);
          }
          return {
            themeMode: target,
            isDark: nextDark,
            isAuto: target === 'system',
          };
        }),

      setTheme: (isDark: boolean) =>
        set(() => {
          const target: ThemeMode = isDark ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
          }
          return {
            themeMode: target,
            isDark,
            isAuto: false,
          };
        }),
    }),
    {
      name: 'baaqoon-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          // Normalize state for users migrating from older versions
          const mode: ThemeMode =
            state.themeMode || (state.isAuto ? 'system' : state.isDark ? 'dark' : 'light');
          const dark = computeIsDark(mode);
          state.themeMode = mode;
          state.isDark = dark;
          document.documentElement.classList.toggle('dark', dark);
        }
      },
    }
  )
);
