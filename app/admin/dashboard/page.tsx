'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Component, Lending, Student } from '@/types/database';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/badge';
import {
  Users,
  Cpu,
  Layers,
  SendHorizontal,
  Clock,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalComponentsCount: 0,
    totalQuantity: 0,
    availableQuantity: 0,
    issuedQuantity: 0,
    pendingRequests: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0,
    damagedCount: 0,
    totalFines: 0,
  });

  const [components, setComponents] = useState<Component[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Lending[]>([]);
  const [overdueList, setOverdueList] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const s = await api.getAdminStats();
      setStats(s);

      const comps = await api.getComponents({ onlyActive: false });
      setComponents(comps);

      const allLending = await api.getLending();
      setPendingRequests(allLending.filter(l => l.status === 'Pending').slice(0, 5));

      const now = new Date();
      const overdue = allLending.filter(l => 
        ['Issued', 'Partially Returned'].includes(l.status) && new Date(l.due_date) < now
      );
      setOverdueList(overdue.slice(0, 5));

      setLoading(false);
    }
    loadData();
  }, []);

  // Prepare chart data: Category breakdown
  const categoryMap: Record<string, { total: number; available: number }> = {};
  components.forEach(c => {
    if (!categoryMap[c.category]) {
      categoryMap[c.category] = { total: 0, available: 0 };
    }
    categoryMap[c.category].total += c.total_quantity;
    categoryMap[c.category].available += c.available_quantity;
  });

  const categoryChartData = Object.entries(categoryMap).map(([cat, val]) => ({
    name: cat.length > 12 ? cat.slice(0, 11) + '..' : cat,
    total: val.total,
    available: val.available,
  }));

  // Status donut data
  const statusChartData = [
    { name: 'Available In Stock', value: stats.availableQuantity, color: '#10b981' },
    { name: 'Issued to Students', value: stats.issuedQuantity, color: '#3b82f6' },
    { name: 'Pending Approvals', value: stats.pendingRequests, color: '#f59e0b' },
    { name: 'Damaged / Lost', value: stats.damagedCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Low stock list
  const lowStock = components.filter(c => c.is_active && c.available_quantity <= 5);

  return (
    <div className="space-y-8">
      {/* Admin Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Laboratory Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Embedded Systems & IoT Lab • Real-time component tracking & fine desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/issue"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center"
          >
            <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
            Issue Desk
          </Link>
          <Link
            href="/admin/returns"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Return & Fine Desk
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={stats.totalStudents}
          subtitle="Profiles in database"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Inventory (Units)"
          value={`${stats.availableQuantity} / ${stats.totalQuantity}`}
          subtitle={`${stats.totalComponentsCount} component catalogue items`}
          icon={Cpu}
          color="emerald"
        />
        <StatCard
          title="Pending Lending Requests"
          value={stats.pendingRequests}
          subtitle="Awaiting lab review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Components"
          value={stats.overdueBorrowings}
          subtitle={`₹${stats.totalFines.toFixed(2)} fines collected`}
          icon={AlertTriangle}
          color={stats.overdueBorrowings > 0 ? "rose" : "purple"}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inventory by Category</h3>
              <p className="text-xs text-slate-500">Total units vs currently available units</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">PostgreSQL Group By</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="total" name="Total Units" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available In Stock" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Circulation Breakdown</h3>
            <p className="text-xs text-slate-500">Live hardware distribution ratio</p>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {statusChartData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Pending Requests and Overdue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending Requests Queue</h3>
              <p className="text-xs text-slate-500">New requests needing review</p>
            </div>
            <Link href="/admin/requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              <span>Review all</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Student</th>
                  <th className="py-2.5 px-3 font-semibold">Component</th>
                  <th className="py-2.5 px-3 font-semibold">Qty</th>
                  <th className="py-2.5 px-3 font-semibold">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No pending requests. Queue is clean!
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((r) => (
                    <tr key={r.lending_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {r.students?.student_name}
                        <span className="block text-[10px] text-slate-400 font-mono">{r.students?.usn}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold">
                        {r.components?.component_name}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{r.quantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(r.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href="/admin/requests"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Low Stock Warnings</h3>
              <p className="text-xs text-slate-500">Components with available stock ≤ 5 units</p>
            </div>
            <Link href="/admin/components" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              <span>Inventory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Component</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Available</th>
                  <th className="py-2.5 px-3 font-semibold">Total</th>
                  <th className="py-2.5 px-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      All components have healthy stock levels.
                    </td>
                  </tr>
                ) : (
                  lowStock.map((c) => (
                    <tr key={c.component_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {c.component_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{c.category}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          {c.available_quantity} Left
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{c.total_quantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.storage_location}</td>
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

