"use client";

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Don't render anything or redirect while loading
  if (loading) {
    return null; // Or return a loading spinner consistent with AuthProvider
  }

  // If not loading and no user, redirect to login
  if (!user) {
    // Use router.replace to avoid adding the protected route to history
    router.replace('/login');
    return null; // Render nothing while redirecting
  }

  // If user is authenticated, render the children
  return <>{children}</>;
};

export default AuthGuard;
