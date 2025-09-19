'use client';

import NewAdminDashboard from '@/components/NewAdminDashboard';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AdminPage() {
  return (
    <ThemeProvider>
      <NewAdminDashboard />
    </ThemeProvider>
  );
}
