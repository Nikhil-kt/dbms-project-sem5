'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Lending, ReturnCondition, ReturnRecord } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { 
  RotateCcw, 
  IndianRupee, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Calendar, 
  ShieldCheck,
  User,
  Cpu
} from 'lucide-react';

export default function AdminReturnsPage() {
  const { user } = useAuth();
  const [activeLendings, setActiveLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Return Processing Modal State
  const [selectedLending, setSelectedLending] = useState<Lending | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [condition, setCondition] = useState<ReturnCondition>('Good');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; fine?: number } | null>(null);

  useEffect(() => {
    loadLendings();
  }, []);

  async function loadLendings() {
    setLoading(true);
    const data = await api.getLending();
    // Filter active items
    const active = data.filter(l => ['Issued', 'Partially Returned'].includes(l.status));
    setActiveLendings(active);
    setLoading(false);
  }

  const handleOpenReturnModal = (item: Lending) => {
    const existingReturns = item.returns || [];
    const returnedSoFar = existingReturns.reduce((sum, r) => sum + r.quantity_returned, 0);
    const outstanding = item.quantity - returnedSoFar;

    setSelectedLending(item);
    setReturnQty(outstanding);
    setCondition('Good');
    setRemarks('Physical check passed.');
    setResult(null);
  };

  const calculatePreviewFine = () => {
    if (!selectedLending) return 0;
    const now = new Date();
    const dueDate = new Date(selectedLending.due_date);
    if (now <= dueDate) return 0;
    const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return overdueDays * returnQty * 5;
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLending) return;

    const adminId = user?.adminProfile?.admin_id || 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';

    setSubmitting(true);
    setResult(null);

    const res = await api.returnComponent({
      lendingId: selectedLending.lending_id,
      adminId,
      quantityReturned: returnQty,
      condition,
      remarks: remarks.trim() || undefined,
      dailyRate: 5,
    });

    setSubmitting(false);

    if (res.success) {
      setResult({
        type: 'success',
        message: `Successfully checked in ${returnQty} unit(s). Stock updated according to condition (${condition}).`,
        fine: res.fineAmount || 0,
      });
      setTimeout(() => {
        setSelectedLending(null);
        loadLendings();
      }, 1800);
    } else {
      setResult({ type: 'error', message: res.error || 'Failed to process return transaction.' });
    }
  };

  const filteredLendings = activeLendings.filter(l => {
    const q = search.toLowerCase();
    const compMatch = l.components?.component_name.toLowerCase().includes(q);
    const studentMatch = l.students?.student_name.toLowerCase().includes(q) || l.students?.usn.toLowerCase().includes(q);
    return compMatch || studentMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return & Overdue Fine Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept returned hardware, verify physical condition, record partial returns, and levy automated fines.
          </p>
        </div>
      </div>

      {/* Overdue Formula Card */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Automated Fine Algorithm</h4>
            <p className="text-xs text-slate-200 mt-0.5">
              Fine = Overdue Days × Returned Quantity × ₹5.00 / day
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 sm:text-right">
          <span className="text-emerald-400 font-semibold">Zero fine</span> on-time • Stock restored on <span className="text-emerald-400 font-semibold">Good</span> condition only
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search active borrowings by student name, USN, or component title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active Borrowings Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : filteredLendings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No active borrowings found</h3>
          <p className="text-xs text-slate-500 mt-1">All issued components have been returned to stock.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Student & USN</th>
                  <th className="py-3.5 px-4 font-semibold">Component</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Issued / Outstanding</th>
                  <th className="py-3.5 px-4 font-semibold">Issue Date</th>
                  <th className="py-3.5 px-4 font-semibold">Due Date</th>
                  <th className="py-3.5 px-4 font-semibold">Overdue Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLendings.map((l) => {
                  const existingReturns = l.returns || [];
                  const returnedSoFar = existingReturns.reduce((sum, r) => sum + r.quantity_returned, 0);
                  const outstanding = l.quantity - returnedSoFar;

                  const now = new Date();
                  const dueDate = new Date(l.due_date);
                  const isOverdue = dueDate < now;
                  const overdueDays = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const estimatedFine = isOverdue ? overdueDays * outstanding * 5 : 0;

                  return (
                    <tr key={l.lending_id} className={`hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {l.students?.student_name}
                        <span className="block text-[10px] text-slate-400 font-mono">{l.students?.usn}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {l.components?.component_name}
                        <span className="block text-[10px] text-slate-400 font-normal">{l.projects?.project_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-800">{l.quantity}</span>
                        <span className="text-[10px] text-blue-600 block font-semibold">
                          ({outstanding} unreturned)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {l.issue_date ? new Date(l.issue_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {dueDate.toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            {overdueDays}d Late (Est. ₹{estimatedFine})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            On Time
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenReturnModal(l)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Process Return
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Modal */}
      <Modal
        isOpen={!!selectedLending}
        onClose={() => setSelectedLending(null)}
        title="Check-In Component & Assess Fine"
        description="Verify returned quantity and assess physical condition"
      >
        {selectedLending && (
          <form onSubmit={handleProcessReturn} className="space-y-4">
            {result && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                result.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <span className="block font-bold">{result.message}</span>
                  {result.fine !== undefined && (
                    <span className="text-[11px] block mt-0.5">
                      Assessed Fine Amount: <strong>₹{result.fine.toFixed(2)}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Context Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Component:</span>
                <span className="font-bold text-slate-800">{selectedLending.components?.component_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Borrower:</span>
                <span className="font-semibold text-slate-800">{selectedLending.students?.student_name} ({selectedLending.students?.usn})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-slate-800">{new Date(selectedLending.due_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Return Quantity (supports partial return) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Being Returned Today <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={
                  selectedLending.quantity - 
                  (selectedLending.returns || []).reduce((sum, r) => sum + r.quantity_returned, 0)
                }
                value={returnQty}
                onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Supports partial returns. If fewer than total outstanding are returned, status updates to Partially Returned.
              </p>
            </div>

            {/* Component Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hardware Condition on Return <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ReturnCondition)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Good">Good (Working - Restores Available Stock)</option>
                <option value="Damaged">Damaged (Broken - Excludes from Usable Stock)</option>
                <option value="Lost">Lost (Missing - Excludes from Usable Stock)</option>
              </select>
            </div>

            {/* Live Fine Preview Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-900 block">Calculated Overdue Fine</span>
                <span className="text-[11px] text-blue-700">Formula: Days × {returnQty} unit(s) × ₹5/day</span>
              </div>
              <span className="text-base font-extrabold text-blue-900">
                ₹{calculatePreviewFine().toFixed(2)}
              </span>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Pins intact, tested with multimeter, etc."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedLending(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Recording Check-In...' : 'Record Return & Settle'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

