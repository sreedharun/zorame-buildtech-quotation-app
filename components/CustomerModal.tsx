'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/lib/types';
import { X, UserCheck, Save, MapPin } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id'> | Customer) => Promise<Customer | void>;
}

export function CustomerModal({ isOpen, customer, onClose, onSave }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    site_location: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        site_location: customer.site_location || '',
        notes: customer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        site_location: '',
        notes: '',
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer name or business name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Contact phone number is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (customer) {
        await onSave({ ...customer, ...formData });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800 font-semibold text-lg">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <span>{customer ? 'Edit Customer' : 'Add New Customer'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Customer / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Infrastructure & Builders"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98450 11223"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. contact@client.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Office / Billing Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. No. 15, Ring Road, Rajajinagar, Bengaluru"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Site Location */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Roofing Site / Delivery Location
              </label>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Warehouse Site at Nelamangala Industrial Park (crucial for transport & labor estimate)"
              value={formData.site_location}
              onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Special Notes / Preferences
            </label>
            <input
              type="text"
              placeholder="e.g. VIP client, preferred color Castle Red"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
