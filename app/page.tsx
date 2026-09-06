'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  getQuotations,
  getProducts,
  getCustomers,
  getCompanySettings,
} from '@/lib/storage';
import { Quotation, Product, Customer, CompanySettings } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [qList, pList, cList, sData] = await Promise.all([
          getQuotations(),
          getProducts(),
          getCustomers(),
          getCompanySettings(),
        ]);
        setQuotations(qList);
        setProducts(pList);
        setCustomers(cList);
        setSettings(sData);
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalValue = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);
  const approvedValue = quotations
    .filter((q) => q.status === 'Approved')
    .reduce((sum, q) => sum + (q.grand_total || 0), 0);
  const pendingQuotes = quotations.filter((q) => q.status === 'Draft' || q.status === 'Sent');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-medium border border-sky-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              Roofing Quotation & Billing Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back to {settings?.company_name || 'Apex Roofing'}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Quickly create, print, and manage itemized quotations for roofing sheets, screws,
              pipes, flashing accessories, and installation labor charges.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg shadow-sky-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" />
              <span>New Quotation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Quotes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Quotations</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : quotations.length}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{pendingQuotes.length} pending / drafts</span>
          </p>
        </div>

        {/* Total Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Value Quoted</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : formatCurrency(totalValue)}
          </div>
          <p className="text-xs text-emerald-600 font-medium">
            {formatCurrency(approvedValue)} approved
          </p>
        </div>

        {/* Products in Catalog */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Product Catalog</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : products.length}
          </div>
          <Link
            href="/products"
            className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
          >
            <span>Manage materials</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Customers</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : customers.length}
          </div>
          <Link
            href="/customers"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
          >
            <span>View directory</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Quotations & Quick Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Quotations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Recent Quotations</h2>
              <p className="text-xs text-slate-500">Latest price estimates prepared for clients</p>
            </div>
            <Link
              href="/quotations"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {quotations.slice(0, 5).map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="hover:text-sky-600 transition-colors"
                      >
                        {q.quotation_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{q.customer_name}</div>
                      {q.customer_site_location && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {q.customer_site_location}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(q.quotation_date)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(q.grand_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No quotations created yet. Click &quot;New Quotation&quot; to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roofing Materials Quick Catalog */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">Material Price List</h2>
              <p className="text-xs text-slate-500">Quick rate reference</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              All Items
            </Link>
          </div>

          <div className="space-y-3">
            {products.slice(0, 6).map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-800 truncate mt-1">
                    {prod.name}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    ₹{prod.unit_price}
                  </div>
                  <span className="text-[10px] text-slate-400">per {prod.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/quotations/new"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quote with These Rates</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
