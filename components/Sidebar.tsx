'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Package,
  Users,
  Settings,
  Sun,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Quotations', href: '/quotations', icon: FileText },
    { label: 'New Quote', href: '/quotations/new', icon: PlusCircle, isHighlight: true },
    { label: 'Product Catalog', href: '/products', icon: Package },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Company Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
          <Sun className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm tracking-tight text-white leading-tight truncate">
            Zorame Buildtech
          </h1>
          <p className="text-[11px] text-amber-400 font-medium truncate">Roofing & Engineering</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || (item.href !== '/quotations/new' && pathname.startsWith(item.href) && !pathname.includes('new'));

          if (item.isHighlight) {
            return (
              <div key={item.href} className="py-2">
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/25 transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  <Icon className="w-5 h-5 text-slate-950" />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Trichy Office Desk</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-400">Live Supabase Database</p>
      </div>
    </aside>
  );
}
