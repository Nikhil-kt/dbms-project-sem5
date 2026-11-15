import Link from 'next/link';
import { Cpu, ShieldCheck, Database, Layers, CheckCircle2, ArrowRight, Clock, Award } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Academic DBMS Capstone Project</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            College Project Component <br />
            <span className="text-blue-600">Lending & Tracking System</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            A comprehensive PostgreSQL relational database management system designed to eliminate manual registers,
            automate component inventory tracking, manage borrowing lifecycles, and enforce overdue fines.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/student/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all group"
            >
              <span>Launch Student Portal</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-slate-500" />
              <span>Lab Administrator Portal</span>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Atomic Inventory Control</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stock availability is validated atomically on physical dispatch, guaranteeing available inventory never goes negative.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Partial Returns & Fine Logic</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Supports partial returning of batches and calculates overdue fines strictly on unreturned units at ₹5/day.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Exactly 7 Relational Tables</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Strictly normalized to 3NF/BCNF: departments, students, lab_admins, components, projects, lending, and returns.
            </p>
          </div>
        </div>

        {/* Relational Tables Inspection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Relational Database Architecture</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
            {[
              { name: 'departments', pk: 'department_id', desc: 'College depts' },
              { name: 'students', pk: 'student_id', desc: 'Student profiles' },
              { name: 'lab_admins', pk: 'admin_id', desc: 'Lab officers' },
              { name: 'components', pk: 'component_id', desc: 'Stock inventory' },
              { name: 'projects', pk: 'project_id', desc: 'Academic projects' },
              { name: 'lending', pk: 'lending_id', desc: 'Requests & loans' },
              { name: 'returns', pk: 'return_id', desc: 'Returns & fines' },
            ].map((t) => (
              <div key={t.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <span className="text-xs font-mono font-bold text-blue-600 block">{t.name}</span>
                <span className="text-[10px] text-slate-500 block mt-1">PK: {t.pk}</span>
                <span className="text-[10px] text-slate-400 block">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

