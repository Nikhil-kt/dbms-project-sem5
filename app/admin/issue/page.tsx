'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Lending } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { 
  SendHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  User, 
  Calendar, 
  ShieldCheck, 
  PackageCheck,
  AlertTriangle 
} from 'lucide-react';

export default function AdminIssuePage() {
  const { user } = useAuth();
  const [approvedLendings, setApprovedLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue Confirmation Modal
  const [targetItem, setTargetItem] = useState<Lending | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadApproved();
  }, []);

  async function loadApproved() {
    setLoading(true);
    const data = await api.getLending({ status: 'Approved' });
    setApprovedLendings(data);
    setLoading(false);
  }

  const handleOpenIssue = (item: Lending) => {
    setTargetItem(item);
    setFeedback(null);
  };

  const handleConfirmIssue = async () => {
    if (!targetItem) return;
    const adminId = user?.adminProfile?.admin_id || 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';

    setIssuing(true);
    setFeedback(null);

    const res = await api.issueComponent(targetItem.lending_id, adminId);
    setIssuing(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully dispatched ${targetItem.quantity} unit(s) of ${targetItem.components?.component_name}. Inventory stock decremented atomically!`,
      });
      setTimeout(() => {
        setTargetItem(null);
        loadApproved();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to issue component.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Physical Component Issue Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify student identity, confirm hardware package condition, and execute atomic inventory reduction on handoff.
        </p>
      </div>

      {/* Process Invariant Alert */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start space-x-3">
        <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Database Transaction Guarantee: </span>
          <span>
            Executing "Issue Hardware" executes PostgreSQL row locking and atomic stock decrements. 
            If requested quantity exceeds instantaneous stock, the transaction is safely rolled back.
          </span>
        </div>
      </div>

      {/* Approved List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : approvedLendings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-800">No approved components awaiting issue</h3>
          <p className="text-xs text-slate-500 mt-1">
            When students' pending requests are approved, they will appear on this dispatch desk.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {approvedLendings.map((item) => {
            const comp = item.components;
            const available = comp?.available_quantity || 0;
            const canFulfill = available >= item.quantity;

            return (
              <div
                key={item.lending_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{comp?.component_name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Project: {item.projects?.project_name}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Requested Units</span>
                      <span className="text-base font-bold text-slate-800">{item.quantity} Units</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      canFulfill ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-900'
                    }`}>
                      <span className="text-[10px] opacity-75 uppercase font-semibold block">Available In Lab</span>
                      <span className="text-base font-bold">{available} Units</span>
                    </div>
                  </div>

                  {/* Student & Due Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Student:</span>
                      <span className="font-semibold text-slate-900">{item.students?.student_name} ({item.students?.usn})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Storage Location:</span>
                      <span className="font-mono text-slate-700">{comp?.storage_location || 'Main Rack'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Return Due:</span>
                      <span className="font-semibold text-slate-800">{new Date(item.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    disabled={!canFulfill}
                    onClick={() => handleOpenIssue(item)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      canFulfill
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <SendHorizontal className="w-4 h-4" />
                    <span>{canFulfill ? 'Dispatch & Decrement Inventory' : 'Insufficient Stock for Dispatch'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!targetItem}
        onClose={() => setTargetItem(null)}
        title="Confirm Hardware Handoff"
        description="Executing this operation will physically issue components and decrement stock"
      >
        {targetItem && (
          <div className="space-y-4">
            {feedback && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Component:</span>
                <span className="font-bold text-slate-900">{targetItem.components?.component_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Issue Quantity:</span>
                <span className="font-bold text-blue-600">{targetItem.quantity} unit(s)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Current Stock &rarr; After Issue:</span>
                <span className="font-bold text-slate-800">
                  {targetItem.components?.available_quantity} &rarr; {(targetItem.components?.available_quantity || 0) - targetItem.quantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Student:</span>
                <span className="font-medium text-slate-800">{targetItem.students?.student_name}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                disabled={issuing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {issuing ? 'Executing Transaction...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

