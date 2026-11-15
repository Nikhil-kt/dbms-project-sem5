'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/services/api';
import { Component, Project } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { 
  Search, 
  Cpu, 
  MapPin, 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Microcontroller',
  'Development Board',
  'Sensor',
  'Circuit Component',
  'Passive Component',
  'Display',
  'Actuator',
];

export default function StudentComponentsPage() {
  const { user } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Request Modal State
  const [selectedComp, setSelectedComp] = useState<Component | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [requestQty, setRequestQty] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail Modal State
  const [detailComp, setDetailComp] = useState<Component | null>(null);

  useEffect(() => {
    loadData();
  }, [category, search]);

  async function loadData() {
    setLoading(true);
    const comps = await api.getComponents({
      category: category === 'All' ? undefined : category,
      search: search || undefined,
      onlyActive: true,
    });
    setComponents(comps);

    if (user?.studentProfile?.student_id) {
      const projs = await api.getProjects({ studentId: user.studentProfile.student_id });
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].project_id);
      }
    }

    // Default due date: 14 days from now
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split('T')[0]);

    setLoading(false);
  }

  const handleOpenRequest = (comp: Component) => {
    setSelectedComp(comp);
    setRequestQty(1);
    setFeedback(null);
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp || !user?.studentProfile?.student_id) return;

    if (!selectedProjectId) {
      setFeedback({ type: 'error', message: 'Please select or create an academic project first.' });
      return;
    }

    if (requestQty <= 0) {
      setFeedback({ type: 'error', message: 'Requested quantity must be at least 1 unit.' });
      return;
    }

    if (requestQty > selectedComp.available_quantity) {
      setFeedback({ 
        type: 'error', 
        message: `Requested quantity (${requestQty}) exceeds current available stock (${selectedComp.available_quantity}).` 
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const res = await api.submitLendingRequest({
      studentId: user.studentProfile.student_id,
      projectId: selectedProjectId,
      dueDate: new Date(dueDate).toISOString(),
      items: [
        {
          componentId: selectedComp.component_id,
          quantity: requestQty,
        },
      ],
    });

    setSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Request for ${requestQty} unit(s) of ${selectedComp.component_name} submitted successfully! Your lab admin will review it.`,
      });
      setTimeout(() => {
        setIsRequestModalOpen(false);
      }, 1800);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to submit lending request.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Electronic Components Catalogue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse lab inventory, inspect technical parameters, and request parts for registered academic projects.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search components by name or specifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : components.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No components match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different category or clearing the search bar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {components.map((comp) => {
            const isOutOfStock = comp.available_quantity === 0;
            const isLowStock = comp.available_quantity > 0 && comp.available_quantity <= 5;

            return (
              <div
                key={comp.component_id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image / Header */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden group">
                    <img
                      src={comp.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'}
                      alt={comp.component_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-xs">
                        {comp.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm ${
                        isOutOfStock
                          ? 'bg-rose-600 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : `${comp.available_quantity} Available`}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                      {comp.component_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {comp.description || 'Standard laboratory hardware module.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {comp.storage_location || 'Main Storage'}
                      </span>
                      <span className="font-medium text-slate-600">
                        Condition: <span className="font-semibold text-emerald-700">{comp.component_condition}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDetailComp(comp)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    disabled={isOutOfStock}
                    onClick={() => handleOpenRequest(comp)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                    }`}
                  >
                    Request Part
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Component Details Modal */}
      <Modal
        isOpen={!!detailComp}
        onClose={() => setDetailComp(null)}
        title={detailComp?.component_name || 'Component Details'}
        description="Comprehensive technical and inventory metrics"
      >
        {detailComp && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl overflow-hidden h-48 bg-slate-100 border border-slate-200">
              <img
                src={detailComp.image_url || ''}
                alt={detailComp.component_name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Category</span>
                <span className="text-sm font-bold text-slate-800">{detailComp.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Condition</span>
                <span className="text-sm font-bold text-emerald-700">{detailComp.component_condition}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Available Stock</span>
                <span className="text-sm font-bold text-blue-700">{detailComp.available_quantity} / {detailComp.total_quantity}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Location</span>
                <span className="text-sm font-bold text-slate-800">{detailComp.storage_location}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Specifications</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {detailComp.description || 'No extended datasheet notes entered.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  const c = detailComp;
                  setDetailComp(null);
                  handleOpenRequest(c);
                }}
                disabled={detailComp.available_quantity === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Proceed to Request Form
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Request Component Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Component Lending Request"
        description="Select academic project and define intended borrowing timeframe"
      >
        {selectedComp && (
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {feedback && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Selected Component Summary */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-950">{selectedComp.component_name}</p>
                <p className="text-[11px] text-blue-700">Category: {selectedComp.category}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white text-blue-700 border border-blue-200">
                {selectedComp.available_quantity} Available
              </span>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Project <span className="text-rose-500">*</span>
              </label>
              {projects.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <p className="font-semibold">No registered projects found.</p>
                  <p className="text-[11px] mt-0.5">You must register an academic project before requesting hardware.</p>
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.project_id} value={p.project_id}>
                      {p.project_name} ({p.project_status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={selectedComp.available_quantity}
                value={requestQty}
                onChange={(e) => setRequestQty(parseInt(e.target.value) || 1)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Maximum allowed per request: {selectedComp.available_quantity}</p>
            </div>

            {/* Expected Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intended Return Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Standard loan tenure: 14 days. Daily overdue rate: ₹5.00/unit.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || projects.length === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Lending Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

