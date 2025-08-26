'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Mocking authentication for development
const useMockAuth = () => {
  return { 
    user: { id: 'cll3z8y9t0000u0xt5z7z7z7z', email: 'dev@test.com' }, 
    isLoading: false 
  };
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useMockAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
