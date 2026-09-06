'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QuotationForm } from '@/components/QuotationForm';
import { getQuotationById } from '@/lib/storage';
import { Quotation } from '@/lib/types';
import { Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (id) {
          const q = await getQuotationById(id);
          setQuotation(q);
        }
      } catch (e) {
        console.error('Error fetching quote for edit:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
        <p>Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested quotation could not be loaded or was deleted.
        </p>
        <Link
          href="/quotations"
          className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Back to Quotations List
        </Link>
      </div>
    );
  }

  return <QuotationForm initialQuotation={quotation} isEditing={true} />;
}
