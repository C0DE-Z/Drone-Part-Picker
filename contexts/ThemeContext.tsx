'use client';

import React from 'react';




// Light-only: legacy theme context removed. Export no-op hooks to avoid crashes if imported.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return { theme: 'light' as const, toggleTheme: () => {} };
}
