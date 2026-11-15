'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Lending } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function StudentBorrowingsPage() {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBorrowings();
  }, [user]);

  async function loadBorrowings() {
    if (!user?.studentProfile?.student_id) return;
    setLoading(true);
    const data = await api.getLending({ studentId: user.studentProfile.student_id });
    // Filter active borrowings
    const active = data.filter(l => ['Issued', 'Partially Returned'].includes(l.status));
    setBorrowings(active);
    setLoading(false);
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Component Borrowings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Electronic hardware currently in your possession. Return components before their due date to avoid fines.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : borrowings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No active borrowings</h3>
          <p className="text-xs text-slate-500 mt-1">You currently have zero outstanding components in custody.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {borrowings.map((b) => {
            const dueDate = new Date(b.due_date);
            const isOverdue = dueDate < now;
            const overdueDays = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            const returnedSum = (b.returns || []).reduce((acc, r) => acc + r.quantity_returned, 0);
            const outstandingQty = b.quantity - returnedSum;
            const estimatedFine = isOverdue ? overdueDays * outstandingQty * 5 : 0;

            return (
              <div
                key={b.lending_id}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                  isOverdue ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{b.components?.component_name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Project: {b.projects?.project_name}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Issued</span>
                      <span className="text-sm font-bold text-slate-800">{b.quantity} Units</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-700 uppercase font-semibold block">Outstanding</span>
                      <span className="text-sm font-bold text-blue-900">{outstandingQty} Units</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-medium text-slate-700">
                        {b.issue_date ? new Date(b.issue_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due Date:</span>
                      <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                        {dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overdue Alert banner or on-track status */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {isOverdue ? (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Overdue by {overdueDays} day(s)</span>
                          <span className="text-[10px] text-rose-600">Accumulating fine: ₹{estimatedFine.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-1 bg-rose-200 text-rose-900 rounded-md">
                        Fine active
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs flex items-center justify-between">
                      <span className="text-[11px] flex items-center font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Within loan window ({Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)} days remaining)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">No Fines</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

