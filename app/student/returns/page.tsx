'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { ReturnRecord } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function StudentReturnsPage() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, [user]);

  async function loadReturns() {
    if (!user?.studentProfile?.student_id) return;
    setLoading(true);
    const allReturns = await api.getReturns();
    // Filter returns where lending student matches current user
    const studentReturns = allReturns.filter(r => r.lending?.student_id === user.studentProfile?.student_id);
    setReturns(studentReturns);
    setLoading(false);
  }

  const totalReturnedUnits = returns.reduce((sum, r) => sum + r.quantity_returned, 0);
  const totalFinesPaid = returns.reduce((sum, r) => sum + Number(r.fine_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return & Inspection History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified hardware check-ins, physical condition notes, and settled overdue assessments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
            <span className="text-slate-400 block text-[10px]">Returned Parts</span>
            <span className="font-bold text-slate-800">{totalReturnedUnits} Units</span>
          </div>
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
            <span className="text-slate-400 block text-[10px]">Total Fines Paid</span>
            <span className="font-bold text-emerald-700">₹{totalFinesPaid.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No return transactions recorded</h3>
          <p className="text-xs text-slate-500 mt-1">
            When you return components to the lab technician, inspection logs will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Return ID</th>
                  <th className="py-3.5 px-4 font-semibold">Component</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Qty Returned</th>
                  <th className="py-3.5 px-4 font-semibold">Return Date</th>
                  <th className="py-3.5 px-4 font-semibold">Condition</th>
                  <th className="py-3.5 px-4 font-semibold">Fine Assessed</th>
                  <th className="py-3.5 px-4 font-semibold">Verified By</th>
                  <th className="py-3.5 px-4 font-semibold">Lab Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((r) => (
                  <tr key={r.return_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {r.return_id.slice(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.lending?.components?.component_name || 'Component'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-center">
                      {r.quantity_returned}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(r.return_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.condition_on_return} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {Number(r.fine_amount) > 0 ? (
                        <span className="text-rose-600">₹{Number(r.fine_amount).toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-600">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.lab_admins?.admin_name || 'Lab Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px]">
                      {r.remarks || <span className="italic text-slate-400">Standard check-in</span>}
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

