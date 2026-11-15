'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Lending } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  SendHorizontal, 
  AlertCircle, 
  Calendar,
  Clock,
  User,
  Cpu
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState<Lending | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const data = await api.getLending();
    setRequests(data);
    setLoading(false);
  }

  const handleOpenAction = (req: Lending, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    setRemarks(type === 'approve' ? 'Approved for capstone project execution.' : 'Insufficient availability or missing prerequisites.');
    setError(null);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmitting(true);
    setError(null);

    let res;
    if (actionType === 'approve') {
      res = await api.approveLending(selectedReq.lending_id, remarks);
    } else {
      res = await api.rejectLending(selectedReq.lending_id, remarks);
    }

    setSubmitting(false);

    if (res.success) {
      setSelectedReq(null);
      loadRequests();
    } else {
      setError(res.error || 'Failed to process request');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'All') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Component Lending Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review academic project applications, verify stock feasibility, and authorize student collection passes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs overflow-x-auto">
          {['Pending', 'Approved', 'Rejected', 'Issued', 'All'].map((st) => (
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

      {/* Info Notice about Business Logic */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">DBMS Inventory Invariant: </span>
          <span>
            Approving a request authorizes the student to visit the lab and collect the item. 
            Physical stock is deducted <strong>only when the component is formally dispatched at the Issue Desk</strong>.
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No requests in this view</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'Pending' ? 'All pending requests have been processed.' : `No requests with status: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Student & Dept</th>
                  <th className="py-3.5 px-4 font-semibold">Project</th>
                  <th className="py-3.5 px-4 font-semibold">Requested Component</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Qty / Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Requested On</th>
                  <th className="py-3.5 px-4 font-semibold">Target Return</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const available = r.components?.available_quantity || 0;
                  const hasStock = available >= r.quantity;

                  return (
                    <tr key={r.lending_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {r.students?.student_name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.students?.usn} • {r.students?.departments?.department_code || 'Dept'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-[150px] truncate">
                        {r.projects?.project_name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {r.components?.component_name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {r.components?.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">{r.quantity}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Stock: <span className={hasStock ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{available}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.request_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'Pending' ? (
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => handleOpenAction(r, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(r, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : r.status === 'Approved' ? (
                          <Link
                            href="/admin/issue"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors inline-flex items-center"
                          >
                            <SendHorizontal className="w-3 h-3 mr-1" />
                            Issue Part
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Action Modal */}
      <Modal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={actionType === 'approve' ? 'Approve Component Request' : 'Reject Component Request'}
        description={`Record administrative remarks for ${selectedReq?.students?.student_name}`}
      >
        {selectedReq && (
          <form onSubmit={handleExecuteAction} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="font-semibold text-slate-700">Component:</span> {selectedReq.components?.component_name}</p>
              <p><span className="font-semibold text-slate-700">Requested Quantity:</span> {selectedReq.quantity} units</p>
              <p><span className="font-semibold text-slate-700">Current Available Stock:</span> {selectedReq.components?.available_quantity} units</p>
              <p><span className="font-semibold text-slate-700">Student:</span> {selectedReq.students?.student_name} ({selectedReq.students?.usn})</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator Remarks / Advisory
              </label>
              <textarea
                rows={3}
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

