'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Product, ProductCategory } from '@/lib/types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { ProductModal } from '@/components/ProductModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RefreshButton } from '@/components/RefreshButton';
import { useAutoSync } from '@/lib/useAutoSync';
import { INITIAL_PRODUCTS } from '@/lib/seed-data';

const CATEGORY_TABS: (ProductCategory | 'All')[] = [
  'All',
  'Roofing Sheet',
  'Screw',
  'Pipe',
  'Accessory',
  'Labor',
  'Other',
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Confirmation Modal States
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadProducts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Error fetching products:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(false);
  }, []);

  const { isRefreshing, triggerRefresh } = useAutoSync(
    (silent) => loadProducts(silent),
    { intervalMs: 30000, enableFocus: true, enableInterval: true }
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData && productData.id) {
      await updateProduct(productData.id, productData);
    } else {
      await createProduct(productData);
    }
    await loadProducts();
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      setIsActionLoading(true);
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await loadProducts();
    } catch (e) {
      console.error('Failed to delete product:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmResetCatalog = async () => {
    try {
      setIsActionLoading(true);
      for (const item of INITIAL_PRODUCTS) {
        await createProduct(item);
      }
      setResetModalOpen(false);
      await loadProducts();
    } catch (e) {
      console.error('Failed to reset catalog:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage roofing sheets, fixing screws, structural pipes, accessories, and labor rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => triggerRefresh(false)} isRefreshing={isRefreshing} />

          {products.length === 0 && (
            <button
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Sample Materials</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedCategory(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab}
            {tab !== 'All' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({products.filter((p) => p.category === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name or spec..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5" />
          <span>
            Showing <b>{filteredProducts.length}</b> of {products.length} products
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Name & Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                <th className="py-3 px-4 text-right">Tax Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                    {prod.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {prod.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                    {prod.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(prod.unit_price)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                    {prod.tax_rate}% GST
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {prod.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: prod.id, name: prod.name })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300" />
                    <p>No products found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Product"
        description={
          <span>
            Are you sure you want to permanently delete <strong className="font-semibold text-slate-900">&quot;{deleteTarget?.name}&quot;</strong> from the product catalog?
          </span>
        }
        confirmText="Delete Product"
        isLoading={isActionLoading}
        onConfirm={confirmDeleteProduct}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Reset Catalog Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset Catalog to Default Materials"
        description="Are you sure you want to load sample roofing materials, sheets, screws, pipes, and accessories into the catalog?"
        confirmText="Load Sample Materials"
        variant="warning"
        isLoading={isActionLoading}
        onConfirm={confirmResetCatalog}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  );
}
