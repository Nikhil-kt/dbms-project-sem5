'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Project, Lending, ProjectStatus } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { 
  FolderGit2, 
  Plus, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  Calendar,
  AlertCircle 
} from 'lucide-react';

export default function StudentProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [lendingRecords, setLendingRecords] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Ongoing');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.studentProfile?.student_id) return;
    setLoading(true);
    const p = await api.getProjects({ studentId: user.studentProfile.student_id });
    setProjects(p);

    const l = await api.getLending({ studentId: user.studentProfile.student_id });
    setLendingRecords(l);
    setLoading(false);
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.studentProfile?.student_id) return;
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await api.createProject({
      project_name: projectName.trim(),
      project_description: projectDesc.trim(),
      student_id: user.studentProfile.student_id,
      project_status: status,
    });

    setSubmitting(false);

    if (res.success) {
      setIsCreateOpen(false);
      setProjectName('');
      setProjectDesc('');
      loadData();
    } else {
      setError(res.error || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Capstone Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register academic engineering projects to allocate electronic lab components and track hardware requirements.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Register New Project
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-52" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No registered academic projects</h3>
          <p className="text-xs text-slate-500 mt-1">Register your first project to start requesting components.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((proj) => {
            const projectLendings = lendingRecords.filter(l => l.project_id === proj.project_id);
            const totalItemsRequested = projectLendings.reduce((sum, l) => sum + l.quantity, 0);

            return (
              <div
                key={proj.project_id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{proj.project_name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Created: {proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'Active'}
                      </p>
                    </div>
                    <StatusBadge status={proj.project_status} />
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {proj.project_description || 'No description provided.'}
                  </p>
                </div>

                {/* Associated Components Breakdown */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-semibold text-slate-700 flex items-center">
                      <Cpu className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Allocated Components ({projectLendings.length})
                    </span>
                    <span className="text-[11px] font-bold text-blue-600">
                      {totalItemsRequested} Total Units
                    </span>
                  </div>

                  {projectLendings.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No component requests linked yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {projectLendings.map((l) => (
                        <div
                          key={l.lending_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            {l.components?.component_name}
                          </span>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[11px] font-bold text-slate-600">{l.quantity}x</span>
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

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Academic Project"
        description="Enter capstone title, department requirements, and research goals"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Smart Energy Monitoring System"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Description & Scope
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe the hardware requirements and objectives of your project..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Project Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Planning">Planning</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

