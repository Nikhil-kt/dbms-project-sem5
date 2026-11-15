'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Project, Lending, Student } from '@/types/database';
import { StatusBadge } from '@/components/ui/badge';
import { FolderGit2, Search, Cpu, Calendar, User, Layers } from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [p, l] = await Promise.all([
      api.getProjects(),
      api.getLending(),
    ]);
    setProjects(p);
    setLendings(l);
    setLoading(false);
  }

  const filteredProjects = projects.filter(p => {
    const q = search.toLowerCase();
    const titleMatch = p.project_name.toLowerCase().includes(q) || (p.project_description && p.project_description.toLowerCase().includes(q));
    const statusMatch = statusFilter === 'All' || p.project_status === statusFilter;
    return titleMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Capstone Projects Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Student research and lab capstone initiatives registered for hardware component lending.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-xs overflow-x-auto">
          {['All', 'Ongoing', 'Planning', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === st ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title, scope, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((p) => {
            const projectLendings = lendings.filter(l => l.project_id === p.project_id);
            const totalUnits = projectLendings.reduce((sum, l) => sum + l.quantity, 0);

            return (
              <div
                key={p.project_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{p.project_name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Registered: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                      </p>
                    </div>
                    <StatusBadge status={p.project_status} />
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {p.project_description || 'No detailed scope provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700 flex items-center">
                      <Cpu className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Hardware Components ({projectLendings.length})
                    </span>
                    <span className="text-[11px] font-bold text-blue-600">{totalUnits} Total Units</span>
                  </div>

                  {projectLendings.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No parts requested for this project yet.</span>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {projectLendings.map((l) => (
                        <div key={l.lending_id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                          <span className="truncate font-medium text-slate-800 mr-2">{l.components?.component_name}</span>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="font-bold text-slate-600">{l.quantity}x</span>
                            <StatusBadge status={l.status} />
                          </div>
                        </div>
                      ))}
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

