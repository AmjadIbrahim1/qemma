// frontend/src/contexts/ThemeContext.jsx
import { createContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProviderCustom = ({ children }) => {
  const getInitial = () => {
    const saved = localStorage.getItem('qemma-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;

    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  };

  const [darkMode, setDarkMode] = useState(getInitial);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');

    localStorage.setItem('qemma-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const value = useMemo(
    () => ({ darkMode, setDarkMode, toggleTheme }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;