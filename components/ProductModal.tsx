'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductCategory } from '@/lib/types';
import { X, Package, Save } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> | Product) => Promise<void>;
}

const CATEGORIES: ProductCategory[] = [
  'Roofing Sheet',
  'Screw',
  'Pipe',
  'Accessory',
  'Labor',
  'Other',
];

const COMMON_UNITS = ['meter', 'pcs', 'sqft', 'feet', 'box', 'bundle', 'kg', 'ton', 'hours', 'set'];

export function ProductModal({ isOpen, product, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Roofing Sheet' as ProductCategory,
    unit: 'meter',
    unit_price: 0,
    tax_rate: 18,
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        unit: product.unit,
        unit_price: product.unit_price,
        tax_rate: product.tax_rate,
        description: product.description || '',
        is_active: product.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        category: 'Roofing Sheet',
        unit: 'meter',
        unit_price: 0,
        tax_rate: 18,
        description: '',
        is_active: true,
      });
    }
    setError('');
  }, [product, isOpen]);

  // Suggest default unit based on selected category
  const handleCategoryChange = (cat: ProductCategory) => {
    let unit = formData.unit;
    if (cat === 'Roofing Sheet') unit = 'meter';
    else if (cat === 'Screw') unit = 'box';
    else if (cat === 'Pipe') unit = 'pcs';
    else if (cat === 'Accessory') unit = 'pcs';
    else if (cat === 'Labor') unit = 'sqft';

    setFormData((prev) => ({ ...prev, category: cat, unit }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.unit_price < 0) {
      setError('Price cannot be negative');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (product) {
        await onSave({ ...product, ...formData });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
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
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Package className="w-5 h-5" />
            </div>
            <span>{product ? 'Edit Product' : 'Add New Product'}</span>
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

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Color Coated Galvalume Sheet 0.47mm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit of Measure *
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="unit-suggestions"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. sqft, pcs, meter"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Price & Tax % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tax Rate (%) *
              </label>
              <select
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="0">0% (Nil / Exempted)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Specification / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. AZ150 high tensile color coated sheet or material grade"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Active in Product Catalog
            </label>
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
