
"use client";

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { StudentProvider } from '@/contexts/StudentContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CampusProvider } from '@/contexts/CampusContext'; // New import

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CampusProvider> {/* Wrap StudentProvider with CampusProvider */}
          <StudentProvider>
            {children}
          </StudentProvider>
        </CampusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
