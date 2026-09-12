'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Save,
  Database,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { CompanySettings } from '@/lib/types';
import { getCompanySettings, updateCompanySettings } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getCompanySettings();
        setSettings(data);
      } catch (e) {
        console.error('Error fetching company settings:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setSaveStatus('idle');
      const updated = await updateCompanySettings(settings);
      setSettings(updated);
      setSaveStatus('success');
      setStatusMessage('Company settings saved successfully and synchronized with the database!');
      setTimeout(() => {
        setSaveStatus((prev) => (prev === 'success' ? 'idle' : prev));
      }, 5000);
    } catch (e: unknown) {
      console.error('Failed to save settings:', e);
      setSaveStatus('error');
      setStatusMessage(e instanceof Error ? e.message : 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopySql = () => {
    const sqlContent = `-- Run this in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Zorame Buildtech',
    tagline TEXT DEFAULT 'Building a Stronger Tomorrow | Roofing • Fabrication • PEB Buildings • Engineering Works',
    phone TEXT DEFAULT '+91 94431 52678 / +91 98424 52678',
    email TEXT DEFAULT 'zoramebuildtech@gmail.com',
    address TEXT DEFAULT 'No. 12, Sangliandapuram Main Road, Near Palakarai, Tiruchirappalli (Trichy), Tamil Nadu 620001',
    gst_tax_id TEXT DEFAULT '33AAGFS1234F1Z9',
    logo_url TEXT DEFAULT '',
    quote_prefix TEXT NOT NULL DEFAULT 'ZB-',
    default_validity_days INTEGER NOT NULL DEFAULT 15,
    default_steel_price_per_kg NUMERIC(10,2) DEFAULT 78.00,
    default_terms TEXT,
    bank_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'pcs',
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    site_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    customer_site_location TEXT,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'flat',
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    advance_paid NUMERIC(12,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'Unpaid',
    terms_and_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrations for existing databases:
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 18.00;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid';

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    line_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on quotation_items" ON quotation_items FOR ALL USING (true) WITH CHECK (true);
`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
        <p>Loading company settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700" />
            <span>Company & Quotation Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure branding, address, tax registration, default terms, and database connection.
          </p>
        </div>

        {saveStatus === 'success' && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold shadow-xs animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Save failed</span>
          </div>
        )}
      </div>

      {/* Global Status Banner Alert */}
      {saveStatus === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Settings Saved & Synchronized</h4>
              <p className="text-xs text-emerald-700 mt-0.5">{statusMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus('idle')}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Error Saving Settings</h4>
              <p className="text-xs text-rose-700 mt-0.5">{statusMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus('idle')}
            className="text-rose-600 hover:text-rose-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Company Branding & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tagline / Business Line
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="e.g. Premium Color Coated Sheets & Accessories"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={settings.gst_tax_id || ''}
                onChange={(e) => setSettings({ ...settings, gst_tax_id: e.target.value })}
                placeholder="e.g. 29AAAAA0000A1Z5"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Office / Factory Address (Printed on Quotation Header)
            </label>
            <textarea
              rows={2}
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Logo Image URL (or /logo.png)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="text"
                value={settings.logo_url || '/logo.png'}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="/logo.png"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <div className="shrink-0 p-2 bg-slate-100 rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.logo_url || '/logo.png'}
                  alt="Logo Preview"
                  className="h-12 w-auto max-w-[180px] object-contain rounded-lg"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active corporate logo displayed on generated price quotations and printed PDFs.
            </p>
          </div>
        </div>

        {/* Quotation Defaults Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Quotation Configuration & Terms</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quotation Number Prefix
              </label>
              <input
                type="text"
                required
                value={settings.quote_prefix}
                onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                placeholder="e.g. ZB-"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                e.g. {settings.quote_prefix}2026-0001
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                required
                value={settings.default_validity_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_validity_days: parseInt(e.target.value, 10) || 15,
                  })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Steel Price (₹/kg)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.default_steel_price_per_kg ?? 78}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    default_steel_price_per_kg: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 78.00"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Default price per kg for structural steel & pipe schedule
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default Terms & Conditions (Pre-populated on every new quote)
            </label>
            <textarea
              rows={4}
              value={settings.default_terms}
              onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Bank Details / NEFT / RTGS (Printed on Quotation)
            </label>
            <textarea
              rows={4}
              value={settings.bank_details || ''}
              onChange={(e) => setSettings({ ...settings, bank_details: e.target.value })}
              placeholder={`Bank Name: HDFC Bank Ltd\nAccount Name: Zorame Buildtech\nAccount No: 50200012345678\nIFSC Code: HDFC0001234\nBranch: Trichy Main`}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div>
            {saveStatus === 'success' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All changes saved successfully!</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Failed to save. Check your connection.</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Supabase & Cloud Database Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Supabase Database Connection</h2>
          </div>

          <div>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
                <span>Connected to Live Supabase</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span>Running in Local Storage Fallback</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The app is currently configured to run seamlessly. To synchronize data with a cloud Supabase
          PostgreSQL database (or deploy to Vercel), create a free project on{' '}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 font-semibold underline inline-flex items-center gap-0.5"
          >
            Supabase.com <ExternalLink className="w-3 h-3" />
          </a>
          , execute the SQL schema below in the SQL Editor, and add your API keys to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.env.local</code> / Vercel Environment Variables.
        </p>

        <div className="bg-slate-900 rounded-xl p-4 text-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Database SQL Schema
            </span>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Click &quot;Copy SQL Schema&quot; above, paste into the Supabase SQL Editor, and run to create tables and RLS security policies.
          </p>
        </div>
      </div>
    </div>
  );
}
