'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuotationForm } from '@/components/QuotationForm';
import { Sparkles } from 'lucide-react';

function NewQuotationContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');

  return <QuotationForm preselectedCustomerId={customerId} />;
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
          <p>Loading quotation builder...</p>
        </div>
      }
    >
      <NewQuotationContent />
    </Suspense>
  );
}
