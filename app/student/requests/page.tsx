'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Lending } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { FileText, Cpu, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    loadRequests();
  }, [user]);

  async function loadRequests() {
    if (!user?.studentProfile?.student_id) return;
    setLoading(true);
    const data = await api.getLending({ studentId: user.studentProfile.student_id });
    setRequests(data);
    setLoading(false);
  }

  const filteredRequests = requests.filter(r => {
    if (filter === 'All') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Lending Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review status updates, approval comments, and collection advisories from lab administrators.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs overflow-x-auto">
          {['All', 'Pending', 'Approved', 'Rejected', 'Issued'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === st ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'All' ? 'You have not submitted any component requests yet.' : `No requests with status: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Request Group ID</th>
                  <th className="py-3.5 px-4 font-semibold">Component</th>
                  <th className="py-3.5 px-4 font-semibold">Project</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Quantity</th>
                  <th className="py-3.5 px-4 font-semibold">Requested Date</th>
                  <th className="py-3.5 px-4 font-semibold">Target Due Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Admin Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => (
                  <tr key={r.lending_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {r.request_group_id.slice(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.components?.component_name}
                      <span className="block text-[10px] font-normal text-slate-400">{r.components?.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[160px] truncate">
                      {r.projects?.project_name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-center">{r.quantity}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(r.request_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(r.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px]">
                      {r.admin_remarks ? (
                        <span className="text-slate-700 font-medium">{r.admin_remarks}</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

