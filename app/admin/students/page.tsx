'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Student, Department, Lending } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Users, Search, BookOpen, Clock, Phone, Mail, Award, Eye } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Student Profile Drawer / Modal
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [s, d, l] = await Promise.all([
      api.getStudents(),
      api.getDepartments(),
      api.getLending(),
    ]);
    setStudents(s);
    setDepartments(d);
    setLendings(l);
    setLoading(false);
  }

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = s.student_name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const deptMatch = selectedDept === 'All' || s.department_id === selectedDept;
    return nameMatch && deptMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered engineering scholars, departmental affiliations, and hardware borrowing accounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, USN, or college email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="All">All Departments</option>
          {departments.map((d) => (
            <option key={d.department_id} value={d.department_id}>
              {d.department_code} - {d.department_name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No students match your criteria</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">USN</th>
                  <th className="py-3.5 px-4 font-semibold">Department</th>
                  <th className="py-3.5 px-4 font-semibold">Semester</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Active Loans</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Borrowing History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const studentLendings = lendings.filter(l => l.student_id === s.student_id);
                  const activeLoans = studentLendings.filter(l => ['Issued', 'Partially Returned'].includes(l.status)).length;
                  const dept = departments.find(d => d.department_id === s.department_id);

                  return (
                    <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {s.usn}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {dept?.department_code || 'General'}
                        <span className="block text-[10px] text-slate-400">{dept?.department_name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        Sem {s.semester || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{s.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeLoans > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {activeLoans}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectStudent(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          View Dossier
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

      {/* Student Dossier Modal */}
      <Modal
        isOpen={!!inspectStudent}
        onClose={() => setInspectStudent(null)}
        title={inspectStudent?.student_name || 'Student Profile'}
        description={`USN: ${inspectStudent?.usn} • Complete lending lifecycle records`}
        maxWidth="lg"
      >
        {inspectStudent && (
          <div className="space-y-4 text-xs">
            {/* Student info strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
                <span className="font-semibold">{inspectStudent.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Phone</span>
                <span className="font-semibold">{inspectStudent.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Semester</span>
                <span className="font-semibold">Semester {inspectStudent.semester}</span>
              </div>
            </div>

            <h4 className="font-bold text-slate-900 text-sm pt-2">Lending History</h4>
            {(() => {
              const records = lendings.filter(l => l.student_id === inspectStudent.student_id);
              if (records.length === 0) {
                return <p className="text-slate-400 italic">No borrowing requests found for this student.</p>;
              }
              return (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {records.map((r) => (
                    <div key={r.lending_id} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{r.components?.component_name}</span>
                        <span className="text-[10px] text-slate-500">
                          Qty: {r.quantity} • Due: {new Date(r.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}

