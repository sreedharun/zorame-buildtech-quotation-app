'use client';

import React from 'react';
import { CompanySettings, Quotation } from '@/lib/types';
import { formatCurrency, formatDate, numberToWords, calculateQuotationTotalWeight } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { Building2, MapPin, Phone, Mail, FileCheck2, Scale } from 'lucide-react';

interface QuotationPrintViewProps {
  quotation: Quotation;
  settings: CompanySettings;
}

export const QuotationPrintView = React.forwardRef<HTMLDivElement, QuotationPrintViewProps>(
  ({ quotation, settings }, ref) => {
    const totalWeightKg =
      quotation.total_weight_kg || calculateQuotationTotalWeight(quotation.items || []);

    return (
      <div
        ref={ref}
        className="quotation-print-container bg-white text-slate-800 p-8 sm:p-12 max-w-4xl mx-auto rounded-2xl shadow-sm border border-slate-200"
      >
        {/* Header with Company Details & Logo */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
          <div className="space-y-2 max-w-lg">
            {/* Company Logo */}
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo_url || '/logo.png'}
                alt={settings.company_name}
                className="h-20 sm:h-24 w-auto max-w-[360px] object-contain"
              />
            </div>
            {settings.tagline && (
              <p className="text-xs font-semibold text-slate-700 tracking-wide">
                {settings.tagline}
              </p>
            )}
            <p className="text-xs text-slate-600 leading-relaxed">{settings.address}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
              {settings.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {settings.phone}
                </span>
              )}
              {settings.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {settings.email}
                </span>
              )}
            </div>
            {settings.gst_tax_id && (
              <p className="text-xs font-semibold text-slate-800 pt-0.5">
                GSTIN / Tax ID: <span className="font-mono">{settings.gst_tax_id}</span>
              </p>
            )}
          </div>

          {/* Quotation Title & Meta */}
          <div className="text-left sm:text-right space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 min-w-[220px]">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Price Quotation
            </span>
            <div className="text-lg font-black text-slate-900 font-mono">
              {quotation.quotation_number}
            </div>
            <div className="no-print pt-1">
              <StatusBadge status={quotation.status} size="sm" />
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400">Date: </span>
                <span className="font-semibold text-slate-700">
                  {formatDate(quotation.quotation_date)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Valid Until: </span>
                <span className="font-semibold text-slate-700">
                  {formatDate(quotation.valid_until)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Site Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
              Quotation For (Customer)
            </span>
            <h3 className="font-bold text-base text-slate-900">{quotation.customer_name}</h3>
            {quotation.customer_address && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {quotation.customer_address}
              </p>
            )}
            {quotation.customer_phone && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3 text-slate-400" />
                {quotation.customer_phone}
              </p>
            )}
          </div>

          {quotation.customer_site_location && (
            <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-3 md:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-indigo-600 uppercase mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Roofing Site / Delivery Location</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {quotation.customer_site_location}
              </p>
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2.5 px-3 font-semibold rounded-l-md w-10 text-center">#</th>
                <th className="py-2.5 px-3 font-semibold">Item & Specification</th>
                <th className="py-2.5 px-3 font-semibold text-center">Unit</th>
                <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                <th className="py-2.5 px-3 font-semibold text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Tax</th>
                <th className="py-2.5 px-3 font-semibold text-right rounded-r-md">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(quotation.items || []).map((item, idx) => {
                const isSteel = item.item_type === 'steel';

                if (isSteel) {
                  return (
                    <tr key={item.id || idx} className="bg-amber-50/30 hover:bg-amber-50/50">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.product_name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-700 mt-1 whitespace-pre-wrap font-medium bg-amber-100/60 p-1.5 rounded border border-amber-200/70">
                            {item.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] uppercase font-black tracking-wider bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                            Structural Steel
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Length: {item.length_meters || 6}m / piece • Weight: {item.weight_kg || 0} kg
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-600">pcs</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 italic text-[11px]">
                        Priced / kg
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">18%</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-900 text-[11px] font-semibold">
                        See Summary
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-700 mt-1 whitespace-pre-wrap font-medium bg-slate-100/80 p-1.5 rounded border border-slate-200">
                          {item.description}
                        </div>
                      )}
                      {item.category && (
                        <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-600">{item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(item.unit_price).replace('₹', '')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {item.tax_rate}%
                      <span className="block text-[10px] text-slate-400">
                        ₹{item.line_tax?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.line_total).replace('₹', '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 my-6 pt-4 border-t border-slate-200">
          <div className="w-full sm:w-1/2 space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Amount in Words
              </span>
              <p className="text-xs font-semibold text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                {numberToWords(quotation.grand_total)}
              </p>
            </div>

            {/* Notes / Special Instructions */}
            {quotation.notes && (
              <div className="text-xs text-slate-600 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/70">
                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider mb-0.5">
                  Quotation Notes / Description:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                  {quotation.notes}
                </p>
              </div>
            )}

            {settings.bank_details && (
              <div className="text-xs text-slate-600 p-2.5 rounded-lg bg-sky-50/50 border border-sky-100">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                  Payment Bank Information:
                </span>
                <p className="font-mono text-[11px] leading-relaxed text-slate-700">
                  {settings.bank_details}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-5/12 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            {/* Structural Steel Weight & Cost Breakdown */}
            {((quotation.total_steel_weight_kg && quotation.total_steel_weight_kg > 0) || (quotation.total_weight_kg && quotation.total_weight_kg > 0) || (quotation.total_steel_cost && quotation.total_steel_cost > 0)) && (
              <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 space-y-1 text-amber-950 mb-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1 text-amber-900">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Steel Weight:</span>
                  </span>
                  <span className="font-mono">{quotation.total_steel_weight_kg || quotation.total_weight_kg} kg</span>
                </div>
                {quotation.total_steel_length_meters && quotation.total_steel_length_meters > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-amber-800 border-t border-amber-200/60 pt-0.5">
                    <span>Total Steel Length (reference):</span>
                    <span className="font-mono">{quotation.total_steel_length_meters} meters</span>
                  </div>
                )}
                {(typeof quotation.steel_price_per_kg === 'number' && quotation.steel_price_per_kg > 0) ? (
                  <div className="flex justify-between items-center text-xs font-black text-amber-950 pt-0.5">
                    <span>Steel Cost (@ ₹{quotation.steel_price_per_kg}/kg):</span>
                    <span className="font-mono">{formatCurrency(quotation.total_steel_cost || 0)}</span>
                  </div>
                ) : (typeof quotation.steel_price_per_meter === 'number' && quotation.steel_price_per_meter > 0) ? (
                  <div className="flex justify-between items-center text-xs font-black text-amber-950 pt-0.5">
                    <span>Steel Cost (@ ₹{quotation.steel_price_per_meter}/kg):</span>
                    <span className="font-mono">{formatCurrency(quotation.total_steel_cost || 0)}</span>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatCurrency(quotation.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>GST / Tax Total:</span>
              <span className="font-mono font-semibold text-slate-800">
                + {formatCurrency(quotation.tax_amount)}
              </span>
            </div>

            {quotation.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>
                  Discount{' '}
                  {quotation.discount_type === 'percent' ? `(${quotation.discount_value}%)` : ''}:
                </span>
                <span className="font-mono font-semibold">
                  - {formatCurrency(quotation.discount_amount)}
                </span>
              </div>
            )}

            <div className="border-t-2 border-slate-900 pt-2.5 flex justify-between items-baseline font-bold text-base text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-xl text-sky-700">
                {formatCurrency(quotation.grand_total)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions & Signatures */}
        <div className="border-t border-slate-200 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
              Terms & Conditions
            </h4>
            <div className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px] bg-slate-50/50 p-3 rounded-lg border border-slate-200/60">
              {quotation.terms_and_conditions || settings.default_terms}
            </div>
          </div>

          <div className="flex flex-col justify-end items-end text-right pt-6 sm:pt-0">
            <div className="w-48 text-center border-t border-slate-400 pt-2 space-y-1">
              <p className="font-bold text-slate-800 text-xs">{settings.company_name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

QuotationPrintView.displayName = 'QuotationPrintView';
