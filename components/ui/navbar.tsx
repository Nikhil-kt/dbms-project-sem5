'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { Cpu, LogOut, User, ShieldCheck, ArrowRightLeft } from 'lucide-react';

export function Navbar() {
  const { user, logout, switchDemoRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                  LabTrack <span className="text-blue-600">DBMS</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Component Lending & Tracking</span>
              </div>
            </Link>
          </div>

          {/* Quick Demo Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Demo Role Switcher Badge */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => switchDemoRole('student')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  user?.role === 'student'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Demo
              </button>
              <button
                onClick={() => switchDemoRole('admin')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  user?.role === 'admin'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin Demo
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-medium text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3 py-2 text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  href="/admin/login"
                  className="text-xs font-semibold px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Admin Portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

