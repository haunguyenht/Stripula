import { createContext, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

export const ThemeContext = createContext(null);

/**
 * ThemeProvider Component
 * Manages theme state globally and persists to localStorage
 * Applies/removes 'dark' class on document.documentElement
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ThemeProvider({ children }) {
  // Initialize theme from localStorage, default to dark
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === LIGHT_THEME || stored === DARK_THEME) {
        return stored;
      }
      return DARK_THEME;
    } catch {
      return DARK_THEME;
    }
  });

  // Apply dark class to document element when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === DARK_THEME) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
    }
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === LIGHT_THEME ? DARK_THEME : LIGHT_THEME);
  }, []);

  // Set theme directly
  const setTheme = useCallback((newTheme) => {
    if (newTheme === LIGHT_THEME || newTheme === DARK_THEME) {
      setThemeState(newTheme);
    }
  }, []);

  const value = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
