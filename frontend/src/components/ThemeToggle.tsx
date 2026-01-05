import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/app/themeStore';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();

  // Cycle through: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 relative"
      title={`Theme: ${theme} (${resolvedTheme})`}
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Simple dark/light toggle (no system option)
export function ThemeToggleSimple() {
  const { toggleTheme, resolvedTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
