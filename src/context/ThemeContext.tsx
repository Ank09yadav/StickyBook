import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateActiveColors } from '../constants/theme';

export const LightColors = {
  primary: '#208AEF',
  primaryLight: '#E6F4FE',
  primaryDark: '#1A6EC0',
  background: '#F6F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F5',
  card: '#FFFFFF',
  text: '#1F2328',
  textSecondary: '#57606A',
  textMuted: '#8C95A0',
  border: '#D0D7DE',
  error: '#CF222E',
  success: '#1A7F37',
  warning: '#9A6700',
  white: '#FFFFFF',
  black: '#000000',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E1E5E9',
};

export const DarkColors = {
  primary: '#208AEF',
  primaryLight: '#E6F4FE',
  primaryDark: '#1A6EC0',
  background: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#21262D',
  card: '#1C2128',
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
  border: '#30363D',
  error: '#F85149',
  success: '#3FB950',
  warning: '#D29922',
  white: '#FFFFFF',
  black: '#000000',
  tabBar: '#161B22',
  tabBarBorder: '#21262D',
};

type ThemeContextType = {
  theme: 'dark' | 'light';
  colors: typeof DarkColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load persistent theme preference on startup
  useEffect(() => {
    AsyncStorage.getItem('theme_preference').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        updateActiveColors(saved === 'light' ? LightColors : DarkColors);
      } else {
        updateActiveColors(DarkColors);
      }
    });
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    updateActiveColors(nextTheme === 'light' ? LightColors : DarkColors);
    AsyncStorage.setItem('theme_preference', nextTheme);
  };

  const colors = theme === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
