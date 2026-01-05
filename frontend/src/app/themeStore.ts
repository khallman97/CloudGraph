import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'cloudgraph-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize theme on store creation
  const initialTheme = getStoredTheme();
  const initialResolved = resolveTheme(initialTheme);

  // Apply theme immediately
  if (typeof window !== 'undefined') {
    applyTheme(initialResolved);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const { theme } = get();
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        applyTheme(newResolved);
        set({ resolvedTheme: newResolved });
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme: Theme) => {
      const resolved = resolveTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(resolved);
      set({ theme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const { resolvedTheme } = get();
      const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
      set({ theme: newTheme, resolvedTheme: newTheme });
    },
  };
});
