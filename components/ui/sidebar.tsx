'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  FolderGit2, 
  FileText, 
  Clock, 
  RotateCcw, 
  Users, 
  CheckCircle2, 
  SendHorizontal, 
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  role: 'student' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/components', label: 'Browse Components', icon: Cpu },
    { href: '/student/projects', label: 'My Projects', icon: FolderGit2 },
    { href: '/student/requests', label: 'My Requests', icon: FileText },
    { href: '/student/borrowings', label: 'My Borrowings', icon: Clock },
    { href: '/student/returns', label: 'Return History', icon: RotateCcw },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/components', label: 'Inventory Management', icon: Cpu },
    { href: '/admin/requests', label: 'Lending Requests', icon: FileText },
    { href: '/admin/issue', label: 'Issue Components', icon: SendHorizontal },
    { href: '/admin/returns', label: 'Return & Fine Desk', icon: RotateCcw },
    { href: '/admin/students', label: 'Students Directory', icon: Users },
    { href: '/admin/projects', label: 'Academic Projects', icon: FolderGit2 },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {role === 'admin' ? 'Laboratory Administration' : 'Student Portal'}
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Database Status Info Box */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DBMS PostgreSQL</span>
        </div>
        <p className="text-[11px] text-slate-500">
          7 Application Tables • RLS Enabled • Atomic Transactions
        </p>
      </div>
    </aside>
  );
}

