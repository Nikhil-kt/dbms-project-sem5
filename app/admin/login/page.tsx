'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Cpu } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to authenticate administrator account');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white">LabTrack Admin</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Laboratory Administrator Portal</h2>
        <p className="mt-1 text-xs text-slate-400">
          Authorized personnel only. Access inventory dispatch, approvals, and fine desks.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-slate-700 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Authenticate as Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Pre-fill pill */}
          <div className="mt-5 pt-4 border-t border-slate-700 bg-slate-900/50 p-3 rounded-xl text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Pre-filled Demo Admin:</span>
            <p>Email: <span className="font-mono text-blue-400 font-medium">admin@college.edu</span></p>
            <p>Password: <span className="font-mono text-slate-300">admin123</span></p>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Student user?{' '}
            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Go to Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

