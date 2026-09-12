'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Quotation, QuotationStatus } from '@/lib/types';
import {
  getQuotations,
  deleteQuotation,
  duplicateQuotation,
  updateQuotation,
} from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RefreshButton } from '@/components/RefreshButton';
import { useAutoSync } from '@/lib/useAutoSync';

const STATUS_FILTERS: (QuotationStatus | 'All')[] = [
  'All',
  'Draft',
  'Sent',
  'Approved',
  'Rejected',
];

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QuotationStatus | 'All'>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ id: string; quoteNo: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQuotations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getQuotations();
      setQuotations(data);
    } catch (e) {
      console.error('Error fetching quotations:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations(false);
  }, []);

  const { isRefreshing, triggerRefresh } = useAutoSync(
    (silent) => loadQuotations(silent),
    { intervalMs: 30000, enableFocus: true, enableInterval: true }
  );

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus =
        selectedStatus === 'All' || q.status === selectedStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        q.quotation_number.toLowerCase().includes(query) ||
        q.customer_name.toLowerCase().includes(query) ||
        (q.customer_phone && q.customer_phone.includes(query)) ||
        (q.customer_site_location && q.customer_site_location.toLowerCase().includes(query));
      const matchesDate = !dateFilter || q.quotation_date === dateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [quotations, selectedStatus, searchQuery, dateFilter]);

  const confirmDeleteQuotation = async () => {
    if (!deleteModal) return;
    try {
      setIsDeleting(true);
      // Optimistically remove from state immediately
      setQuotations((prev) => prev.filter((q) => q.id !== deleteModal.id && q.quotation_number !== deleteModal.quoteNo));
      await deleteQuotation(deleteModal.id);
      setDeleteModal(null);
      await loadQuotations();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete quotation');
      await loadQuotations();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const cloned = await duplicateQuotation(id);
      alert(`Quotation duplicated successfully as ${cloned.quotation_number}`);
      await loadQuotations();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to duplicate quotation');
    }
  };

  const handleStatusChange = async (id: string, newStatus: QuotationStatus) => {
    try {
      await updateQuotation(id, { status: newStatus });
      await loadQuotations();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const totalFilteredSum = filteredQuotations.reduce(
    (sum, q) => sum + (q.grand_total || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            <span>Quotation History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            View, search, filter, duplicate, print, and track client quotations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={() => triggerRefresh(false)} isRefreshing={isRefreshing} />
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-md shadow-sky-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_FILTERS.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {st}
            {st !== 'All' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({quotations.filter((q) => q.status === st).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Date Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by quote #, customer, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-44 pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-600"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
          <div className="font-semibold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl">
            Total Quoted: <span className="font-mono text-sky-700">{formatCurrency(totalFilteredSum)}</span>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer & Site Location</th>
                <th className="py-3 px-4">Quote Date</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Quote Number */}
                  <td className="py-4 px-4 font-mono font-bold text-slate-900 text-sm">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="hover:text-sky-600 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{q.quotation_number}</span>
                    </Link>
                  </td>

                  {/* Customer Info */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 text-sm">{q.customer_name}</div>
                    {q.customer_phone && (
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {q.customer_phone}
                      </span>
                    )}
                    {q.customer_site_location && (
                      <span className="text-[11px] text-indigo-600 block mt-0.5 line-clamp-1">
                        📍 {q.customer_site_location}
                      </span>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {formatDate(q.quotation_date)}
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {formatDate(q.valid_until)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-4 px-4">
                    <div className="relative inline-block group">
                      <select
                        value={q.status}
                        onChange={(e) =>
                          handleStatusChange(q.id, e.target.value as QuotationStatus)
                        }
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <div className="cursor-pointer flex items-center gap-1">
                        <StatusBadge status={q.status} size="sm" />
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                      </div>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(q.grand_total)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="View / Print PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/quotations/${q.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Quotation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDuplicate(q.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Duplicate / Clone Quote"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteModal({ id: q.id, quoteNo: q.quotation_number })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Quotation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuotations.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p>No quotations found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Delete Quotation"
        description={
          <span>
            Are you sure you want to permanently delete quotation{' '}
            <strong className="font-semibold text-slate-900">{deleteModal?.quoteNo}</strong>? This action cannot be undone.
          </span>
        }
        confirmText="Delete Quotation"
        isLoading={isDeleting}
        onConfirm={confirmDeleteQuotation}
        onClose={() => setDeleteModal(null)}
      />
    </div>
  );
}
