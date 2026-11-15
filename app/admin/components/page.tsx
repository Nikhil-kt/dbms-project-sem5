'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { Component, ComponentCondition } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Power, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Sliders 
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

const CONDITIONS: ComponentCondition[] = ['New', 'Good', 'Fair', 'Damaged', 'Under Maintenance'];

export default function AdminComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Modal State: Add or Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Component | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Microcontroller');
  const [desc, setDesc] = useState('');
  const [totalQty, setTotalQty] = useState<number>(20);
  const [availQty, setAvailQty] = useState<number>(20);
  const [condition, setCondition] = useState<ComponentCondition>('Good');
  const [location, setLocation] = useState('Cabinet A - Shelf 1');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadComponents();
  }, [category, search]);

  async function loadComponents() {
    setLoading(true);
    const data = await api.getComponents({
      category: category === 'All' ? undefined : category,
      search: search || undefined,
      onlyActive: false, // show deactivated items to admin
    });
    setComponents(data);
    setLoading(false);
  }

  const handleOpenAdd = () => {
    setEditingComp(null);
    setName('');
    setCat('Microcontroller');
    setDesc('');
    setTotalQty(20);
    setAvailQty(20);
    setCondition('Good');
    setLocation('Cabinet A - Shelf 1');
    setImageUrl('https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80');
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Component) => {
    setEditingComp(comp);
    setName(comp.component_name);
    setCat(comp.category);
    setDesc(comp.description || '');
    setTotalQty(comp.total_quantity);
    setAvailQty(comp.available_quantity);
    setCondition(comp.component_condition);
    setLocation(comp.storage_location || '');
    setImageUrl(comp.image_url || '');
    setError(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }
    if (totalQty < 0) {
      setError('Total quantity cannot be negative');
      return;
    }
    if (availQty < 0 || availQty > totalQty) {
      setError('Available quantity must be between 0 and total quantity');
      return;
    }

    setSubmitting(true);
    setError(null);

    if (editingComp) {
      const res = await api.updateComponent(editingComp.component_id, {
        component_name: name.trim(),
        category: cat,
        description: desc.trim(),
        total_quantity: totalQty,
        available_quantity: availQty,
        component_condition: condition,
        storage_location: location.trim(),
        image_url: imageUrl.trim() || undefined,
      });
      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadComponents();
      } else {
        setError(res.error || 'Failed to update component');
      }
    } else {
      const res = await api.addComponent({
        component_name: name.trim(),
        category: cat,
        description: desc.trim(),
        total_quantity: totalQty,
        available_quantity: availQty,
        component_condition: condition,
        storage_location: location.trim(),
        image_url: imageUrl.trim() || undefined,
      });
      setSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadComponents();
      } else {
        setError(res.error || 'Failed to add component');
      }
    }
  };

  const handleToggleActive = async (comp: Component) => {
    const updatedStatus = !comp.is_active;
    await api.toggleComponentActive(comp.component_id, updatedStatus);
    loadComponents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Component Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain electronic hardware stock, physical bin locations, and procurement quantities.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Component
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter inventory by component name or specifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === c
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
      ) : components.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800">No components match query</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search filters or add a new component.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Component</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Available / Total</th>
                  <th className="py-3.5 px-4 font-semibold">Condition</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((comp) => {
                  const isLow = comp.available_quantity <= 5 && comp.available_quantity > 0;
                  const isZero = comp.available_quantity === 0;

                  return (
                    <tr key={comp.component_id} className={`hover:bg-slate-50/70 transition-colors ${!comp.is_active ? 'opacity-50 bg-slate-50/40' : ''}`}>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-3">
                          <img
                            src={comp.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80'}
                            alt={comp.component_name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{comp.component_name}</span>
                            <span className="text-[10px] text-slate-400 max-w-[220px] truncate block">
                              {comp.description || 'Standard electronic component'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{comp.category}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isZero ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {comp.available_quantity} / {comp.total_quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{comp.component_condition}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {comp.storage_location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          comp.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {comp.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            title="Edit Component"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(comp)}
                            title={comp.is_active ? 'Deactivate component' : 'Activate component'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              comp.is_active
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingComp ? 'Edit Component Information' : 'Add New Hardware Component'}
        description="Configure inventory parameters, initial quantities, and physical storage"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Component Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arduino Uno R3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ComponentCondition)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {CONDITIONS.map((cd) => (
                  <option key={cd} value={cd}>{cd}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={totalQty}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setTotalQty(val);
                  if (val < availQty) setAvailQty(val);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={totalQty}
                required
                value={availQty}
                onChange={(e) => setAvailQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Storage Bin / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Cabinet A - Shelf 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="Microcontroller, pinout details, operating voltage..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingComp ? 'Update Component' : 'Create Component'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

