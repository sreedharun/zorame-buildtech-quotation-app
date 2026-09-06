'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  Download,
  Edit2,
  Copy,
  ArrowLeft,
  Share2,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Quotation, CompanySettings, QuotationStatus } from '@/lib/types';
import {
  getQuotationById,
  getCompanySettings,
  updateQuotation,
  duplicateQuotation,
} from '@/lib/storage';
import { QuotationPrintView } from '@/components/QuotationPrintView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (id) {
        const [qData, sData] = await Promise.all([
          getQuotationById(id),
          getCompanySettings(),
        ]);
        setQuotation(qData);
        setSettings(sData);
      }
    } catch (e) {
      console.error('Error loading quotation detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !quotation) return;

    try {
      setDownloadingPdf(true);
      const element = printRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${quotation.quotation_number}_${quotation.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Could not generate PDF directly. Please use the Print button and choose "Save as PDF".');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return;
    try {
      const updated = await updateQuotation(quotation.id, { status: newStatus });
      setQuotation(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    try {
      const cloned = await duplicateQuotation(quotation.id);
      router.push(`/quotations/${cloned.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to duplicate quotation');
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
        <p>Loading quotation view...</p>
      </div>
    );
  }

  if (!quotation || !settings) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12">
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

  return (
    <div className="space-y-6 pb-16">
      {/* Control Action Toolbar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Quotations List"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                {quotation.quotation_number}
              </span>
            </div>
            <p className="text-xs text-slate-500">Customer: {quotation.customer_name}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 border border-slate-200">
            <span>Status:</span>
            <select
              value={quotation.status}
              onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            disabled={downloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
            title="Duplicate Quote"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
            title="Copy Link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Quotation View Template */}
      <QuotationPrintView
        ref={printRef}
        quotation={quotation}
        settings={settings}
      />
    </div>
  );
}
