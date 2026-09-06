'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Customer } from '@/lib/types';
import { Search, ChevronDown, Check, X, User, Phone, MapPin, UserPlus } from 'lucide-react';

interface CustomerComboboxProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenAddNewModal: () => void;
}

export function CustomerCombobox({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenAddNewModal,
}: CustomerComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isAbove, setIsAbove] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    setIsAbove(placeAbove);

    const dropdownWidth = Math.max(rect.width, 340);
    let left = rect.left;
    if (left + dropdownWidth > windowWidth - 16) {
      left = Math.max(16, windowWidth - dropdownWidth - 16);
    }
    if (left < 16) left = 16;

    if (placeAbove) {
      setDropdownStyle({
        position: 'fixed',
        bottom: `${windowHeight - rect.top + 6}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        maxHeight: `${Math.min(spaceAbove - 16, 340)}px`,
        zIndex: 99999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        maxHeight: `${Math.min(spaceBelow - 16, 340)}px`,
        zIndex: 99999,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.site_location && c.site_location.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm cursor-pointer flex items-center justify-between gap-2 bg-white transition-all ${
          isOpen
            ? 'ring-2 ring-sky-500 border-sky-500 shadow-sm'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 truncate">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                {selectedCustomer.name.substring(0, 1).toUpperCase()}
              </span>
              <span className="font-bold text-slate-900 truncate">
                {selectedCustomer.name}
              </span>
              <span className="text-slate-400 text-xs font-mono shrink-0">
                ({selectedCustomer.phone})
              </span>
            </div>
          ) : (
            <span className="text-slate-400">-- Search & Select Customer or Type Below --</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCustomer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCustomer(null);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'transform rotate-180 text-sky-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Modal rendered via Portal */}
      {isOpen && mounted && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className={`bg-white rounded-xl shadow-2xl border border-slate-200 ring-1 ring-black/5 overflow-hidden flex flex-col animate-in duration-100 ${
              isAbove ? 'fade-in-50 slide-in-from-bottom-2' : 'fade-in-50 slide-in-from-top-2'
            }`}
          >
            {/* Search Header */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer by name, phone, site..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddNewModal();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1">
              {filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </span>
                        {c.site_location && (
                          <span className="flex items-center gap-1 text-indigo-600 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            {c.site_location}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="py-6 text-center text-slate-400 space-y-2 p-3">
                  <p className="text-xs">No customers matching &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
