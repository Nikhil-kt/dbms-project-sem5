'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Lending } from '@/types/database';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/badge';
import { 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  FolderGit2, 
  ArrowRight,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeBorrowings: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    overdueCount: 0,
  });
  const [recentLending, setRecentLending] = useState<Lending[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.studentProfile?.student_id) return;
      const studentId = user.studentProfile.student_id;
      
      const s = await api.getStudentStats(studentId);
      setStats(s);

      const all = await api.getLending({ studentId });
      setRecentLending(all.slice(0, 5));

      const now = new Date();
      const active = all.filter(l => ['Issued', 'Partially Returned'].includes(l.status));
      // Sort by due date ascending
      active.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      setUpcomingDeadlines(active.slice(0, 4));

      setLoading(false);
    }
    loadData();
  }, [user]);

  const studentName = user?.name || 'Student';
  const usn = user?.studentProfile?.usn || '1RV21CS042';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-3 backdrop-blur-xs">
            Student Portal • {usn}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {studentName}!
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Track your laboratory hardware components, request microcontroller kits for academic projects,
            and monitor scheduled return due dates to prevent overdue fines.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/student/components"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-blue-800 text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs"
            >
              <Cpu className="w-4 h-4 mr-1.5" />
              Browse & Request Components
            </Link>
            <Link
              href="/student/projects"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600/70 border border-white/20 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
            >
              <FolderGit2 className="w-4 h-4 mr-1.5" />
              Manage Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Borrowings"
          value={stats.activeBorrowings}
          subtitle="Components in your custody"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          subtitle="Awaiting admin approval"
          icon={FileText}
          color="amber"
        />
        <StatCard
          title="Approved Requests"
          value={stats.approvedRequests}
          subtitle="Ready for lab collection"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Overdue Items"
          value={stats.overdueCount}
          subtitle="Subject to ₹5/day fine"
          icon={AlertTriangle}
          color={stats.overdueCount > 0 ? "rose" : "purple"}
        />
      </div>

      {/* Deadlines & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Return Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
            </div>
            <Link href="/student/borrowings" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active items borrowed currently.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((item) => {
                const dueDate = new Date(item.due_date);
                const isOverdue = dueDate < new Date();
                return (
                  <div
                    key={item.lending_id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isOverdue 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold">{item.components?.component_name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Qty: <span className="font-semibold text-slate-700">{item.quantity}</span> • Project: {item.projects?.project_name}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isOverdue ? 'bg-rose-200 text-rose-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isOverdue ? 'Overdue!' : 'Due in ' + Math.ceil((dueDate.getTime() - Date.now()) / 86400000) + 'd'}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] flex items-center text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Due date: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Lending Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Lending Activity</h2>
              <p className="text-xs text-slate-500">Your latest submitted component requests and statuses</p>
            </div>
            <Link href="/student/requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              <span>All requests</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Component</th>
                  <th className="py-2.5 px-3 font-semibold">Project</th>
                  <th className="py-2.5 px-3 font-semibold">Qty</th>
                  <th className="py-2.5 px-3 font-semibold">Requested Date</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No request history yet. Request components to get started!
                    </td>
                  </tr>
                ) : (
                  recentLending.map((l) => (
                    <tr key={l.lending_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {l.components?.component_name || 'Component'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate">
                        {l.projects?.project_name || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{l.quantity}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(l.request_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

