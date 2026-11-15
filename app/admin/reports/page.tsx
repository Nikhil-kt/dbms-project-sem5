'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Component, Lending, ReturnRecord, Student } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  Search, 
  FileSpreadsheet, 
  Cpu, 
  Users, 
  AlertTriangle, 
  RotateCcw, 
  Flame,
  CheckCircle2
} from 'lucide-react';

type ReportType = 
  | 'inventory'
  | 'borrowings'
  | 'pending'
  | 'overdue'
  | 'returns'
  | 'damaged'
  | 'popular';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Raw data
  const [components, setComponents] = useState<Component[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    const [c, l, r, s] = await Promise.all([
      api.getComponents({ onlyActive: false }),
      api.getLending(),
      api.getReturns(),
      api.getStudents(),
    ]);
    setComponents(c);
    setLendings(l);
    setReturns(r);
    setStudents(s);
    setLoading(false);
  }

  // Helper to export CSV
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (reportType === 'inventory') {
      const headers = ['Component Name', 'Category', 'Condition', 'Available Qty', 'Total Qty', 'Location', 'Is Active'];
      const rows = components.map(c => [
        c.component_name,
        c.category,
        c.component_condition,
        c.available_quantity,
        c.total_quantity,
        c.storage_location || 'N/A',
        c.is_active ? 'Active' : 'Inactive',
      ]);
      exportCSV('Inventory_Report', headers, rows);
    } else if (reportType === 'borrowings') {
      const headers = ['Lending ID', 'Student Name', 'USN', 'Component', 'Quantity', 'Issue Date', 'Due Date', 'Status'];
      const rows = lendings.map(l => [
        l.lending_id,
        l.students?.student_name || 'N/A',
        l.students?.usn || 'N/A',
        l.components?.component_name || 'N/A',
        l.quantity,
        l.issue_date || 'N/A',
        l.due_date,
        l.status,
      ]);
      exportCSV('Student_Borrowings_Report', headers, rows);
    } else if (reportType === 'overdue') {
      const now = new Date();
      const overdueList = lendings.filter(l => 
        ['Issued', 'Partially Returned'].includes(l.status) && new Date(l.due_date) < now
      );
      const headers = ['Student Name', 'USN', 'Phone', 'Component', 'Quantity', 'Due Date', 'Overdue Days', 'Estimated Fine'];
      const rows = overdueList.map(l => {
        const d = new Date(l.due_date);
        const days = Math.ceil((now.getTime() - d.getTime()) / 86400000);
        return [
          l.students?.student_name || 'N/A',
          l.students?.usn || 'N/A',
          l.students?.phone || 'N/A',
          l.components?.component_name || 'N/A',
          l.quantity,
          l.due_date,
          days,
          `INR ${(days * l.quantity * 5).toFixed(2)}`,
        ];
      });
      exportCSV('Overdue_Components_Report', headers, rows);
    } else if (reportType === 'returns') {
      const headers = ['Return ID', 'Component', 'Returned Qty', 'Condition', 'Fine Amount', 'Return Date', 'Remarks'];
      const rows = returns.map(r => [
        r.return_id,
        r.lending?.components?.component_name || 'N/A',
        r.quantity_returned,
        r.condition_on_return,
        r.fine_amount,
        r.return_date,
        r.remarks || 'None',
      ]);
      exportCSV('Return_Transactions_Report', headers, rows);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Reports & Audit Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate standardized DBMS evaluation statements, audit trails, and export datasets as CSV.
          </p>
        </div>

        <button
          onClick={handleExportCurrent}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export Report to CSV
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs">
        {[
          { id: 'inventory', label: '1. Inventory Report', icon: Cpu },
          { id: 'borrowings', label: '2. Student Borrowings', icon: Users },
          { id: 'pending', label: '3. Pending Requests', icon: BarChart3 },
          { id: 'overdue', label: '4. Overdue Components', icon: AlertTriangle },
          { id: 'returns', label: '5. Return History', icon: RotateCcw },
          { id: 'damaged', label: '6. Damaged & Lost', icon: AlertTriangle },
          { id: 'popular', label: '7. Most Borrowed', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content View */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* REPORT 1: INVENTORY REPORT */}
        {reportType === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Component Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Condition</th>
                  <th className="py-3 px-4 font-semibold text-center">Available Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Stock</th>
                  <th className="py-3 px-4 font-semibold">Storage Location</th>
                  <th className="py-3 px-4 font-semibold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((c) => (
                  <tr key={c.component_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.component_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.category}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{c.component_condition}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{c.available_quantity}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{c.total_quantity}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{c.storage_location}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 2: STUDENT BORROWINGS */}
        {reportType === 'borrowings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">USN</th>
                  <th className="py-3 px-4 font-semibold">Project</th>
                  <th className="py-3 px-4 font-semibold">Component</th>
                  <th className="py-3 px-4 font-semibold text-center">Units</th>
                  <th className="py-3 px-4 font-semibold">Issue Date</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lendings.map((l) => (
                  <tr key={l.lending_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.students?.student_name}</td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium">{l.students?.usn}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">{l.projects?.project_name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.components?.component_name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{l.quantity}</td>
                    <td className="py-3 px-4 text-slate-500">{l.issue_date ? new Date(l.issue_date).toLocaleDateString() : 'Pending'}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{new Date(l.due_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 3: PENDING REQUESTS */}
        {reportType === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">USN</th>
                  <th className="py-3 px-4 font-semibold">Component</th>
                  <th className="py-3 px-4 font-semibold text-center">Qty</th>
                  <th className="py-3 px-4 font-semibold">Request Date</th>
                  <th className="py-3 px-4 font-semibold">Requested Return Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lendings.filter(l => l.status === 'Pending').map((l) => (
                  <tr key={l.lending_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.students?.student_name}</td>
                    <td className="py-3 px-4 font-mono text-blue-600">{l.students?.usn}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.components?.component_name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{l.quantity}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(l.request_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(l.due_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 4: OVERDUE COMPONENTS */}
        {reportType === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">USN & Phone</th>
                  <th className="py-3 px-4 font-semibold">Component</th>
                  <th className="py-3 px-4 font-semibold text-center">Unreturned Qty</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Overdue Days</th>
                  <th className="py-3 px-4 font-semibold text-right">Computed Fine (₹5/day)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const overdue = lendings.filter(l => ['Issued', 'Partially Returned'].includes(l.status) && new Date(l.due_date) < now);
                  if (overdue.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Zero overdue items across the institution!
                        </td>
                      </tr>
                    );
                  }
                  return overdue.map((l) => {
                    const days = Math.ceil((now.getTime() - new Date(l.due_date).getTime()) / 86400000);
                    const returnedSum = (l.returns || []).reduce((acc, r) => acc + r.quantity_returned, 0);
                    const outstanding = l.quantity - returnedSum;
                    const fine = days * outstanding * 5;

                    return (
                      <tr key={l.lending_id} className="bg-rose-50/40 hover:bg-rose-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{l.students?.student_name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {l.students?.usn} • {l.students?.phone || 'No phone'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{l.components?.component_name}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{outstanding}</td>
                        <td className="py-3 px-4 text-rose-700 font-semibold">{new Date(l.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-800">{days} days</td>
                        <td className="py-3 px-4 text-right font-extrabold text-rose-700">₹{fine.toFixed(2)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: RETURN HISTORY */}
        {reportType === 'returns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Return ID</th>
                  <th className="py-3 px-4 font-semibold">Component</th>
                  <th className="py-3 px-4 font-semibold text-center">Qty Returned</th>
                  <th className="py-3 px-4 font-semibold">Return Date</th>
                  <th className="py-3 px-4 font-semibold">Condition</th>
                  <th className="py-3 px-4 font-semibold text-right">Fine Collected</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((r) => (
                  <tr key={r.return_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{r.return_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.lending?.components?.component_name}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{r.quantity_returned}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(r.return_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><StatusBadge status={r.condition_on_return} /></td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(r.fine_amount || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-500">{r.remarks || 'Standard'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 6: DAMAGED & LOST */}
        {reportType === 'damaged' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Component</th>
                  <th className="py-3 px-4 font-semibold text-center">Damaged Units</th>
                  <th className="py-3 px-4 font-semibold text-center">Lost Units</th>
                  <th className="py-3 px-4 font-semibold text-center">Current Total Usable Stock</th>
                  <th className="py-3 px-4 font-semibold">Action Recommended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((c) => {
                  const compReturns = returns.filter(r => r.lending?.component_id === c.component_id);
                  const damaged = compReturns.filter(r => r.condition_on_return === 'Damaged').reduce((s, r) => s + r.quantity_returned, 0);
                  const lost = compReturns.filter(r => r.condition_on_return === 'Lost').reduce((s, r) => s + r.quantity_returned, 0);

                  return (
                    <tr key={c.component_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.component_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">{damaged}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{lost}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800">{c.total_quantity}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {damaged > 0 || lost > 0 ? (
                          <span className="text-rose-600 font-semibold">Replenishment / Reorder Required</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Stock Healthy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 7: MOST POPULAR */}
        {reportType === 'popular' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Component Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Requests</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Units Circulated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((c) => {
                  const compLendings = lendings.filter(l => l.component_id === c.component_id);
                  const totalUnitsBorrowed = compLendings.reduce((sum, l) => sum + l.quantity, 0);

                  return {
                    ...c,
                    requestCount: compLendings.length,
                    totalUnitsBorrowed,
                  };
                })
                .sort((a, b) => b.totalUnitsBorrowed - a.totalUnitsBorrowed)
                .map((item) => (
                  <tr key={item.component_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.component_name}</td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{item.requestCount}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-900">{item.totalUnitsBorrowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

