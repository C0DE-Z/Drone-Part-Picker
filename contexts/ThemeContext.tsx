'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Light-only: legacy theme context removed. Export no-op hooks to avoid crashes if imported.
  export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return children as any
  }

  export function useTheme() {
    return { theme: 'light' as const, toggleTheme: () => {} }
  }
