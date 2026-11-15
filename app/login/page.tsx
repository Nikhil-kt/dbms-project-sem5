'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Cpu, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function StudentLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('aarav.cs21@college.edu');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to authenticate');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900">LabTrack DBMS</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Portal Sign In</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter institutional credentials to manage component loans
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="student@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Demo credential helper pill */}
          <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Pre-filled Student Demo:</span>
            <p>Email: <span className="font-mono text-blue-600 font-medium">aarav.cs21@college.edu</span></p>
            <p>Password: <span className="font-mono text-slate-600">student123</span></p>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have a student account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register now
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link href="/admin/login" className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Lab Administrator Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

