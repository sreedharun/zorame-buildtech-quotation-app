'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, FileText, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/80">
            <Sparkles className="w-3 h-3 mr-1 text-sky-500" />
            Roofing & Steel Solutions
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/quotations"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Quotations</span>
        </Link>

        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </Link>
      </div>
    </header>
  );
}
