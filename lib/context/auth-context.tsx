'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSessionUser } from '@/types/database';
import { api } from '@/lib/services/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthSessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: 'student' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const current = await api.getCurrentUser();
      setUser(current);
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await api.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  const switchDemoRole = async (targetRole: 'student' | 'admin') => {
    setLoading(true);
    if (targetRole === 'admin') {
      await login('admin@college.edu', 'admin123');
    } else {
      await login('aarav.cs21@college.edu', 'student123');
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

