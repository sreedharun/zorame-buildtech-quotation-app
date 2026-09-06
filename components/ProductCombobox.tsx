'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Product, ProductCategory } from '@/lib/types';
import { Search, ChevronDown, Check, X, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ProductComboboxProps {
  products: Product[];
  selectedProductId: string | null;
  selectedProductName: string;
  onSelectProduct: (product: Product | null, customName?: string) => void;
  placeholder?: string;
}

const CATEGORIES: (ProductCategory | 'All')[] = [
  'All',
  'Roofing Sheet',
  'Screw',
  'Pipe',
  'Accessory',
  'Labor',
];

export function ProductCombobox({
  products,
  selectedProductId,
  selectedProductName,
  onSelectProduct,
  placeholder = 'Search or select roofing material...',
}: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
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
    // If space below is less than 320px and space above is greater than space below, place ABOVE!
    const placeAbove = spaceBelow < 320 && spaceAbove > spaceBelow;
    setIsAbove(placeAbove);

    const dropdownWidth = Math.max(rect.width, 380);
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
        maxHeight: `${Math.min(spaceAbove - 16, 380)}px`,
        zIndex: 99999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        maxHeight: `${Math.min(spaceBelow - 16, 380)}px`,
        zIndex: 99999,
      });
    }
  }, []);

  // Recalculate position on open, scroll, resize
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

  // Close when clicked outside
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

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedCategory('All');
    }
  }, [isOpen]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesName = p.name.toLowerCase().includes(q);
    const matchesCategoryName = p.category.toLowerCase().includes(q);
    const matchesDesc = p.description?.toLowerCase().includes(q) || false;
    const matchesUnit = p.unit.toLowerCase().includes(q);

    return matchesCategory && (matchesName || matchesCategoryName || matchesDesc || matchesUnit);
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-2 bg-white transition-all ${
          isOpen
            ? 'ring-2 ring-sky-500 border-sky-500 shadow-sm'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedProduct ? (
            <>
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                {selectedProduct.category}
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {selectedProduct.name}
              </span>
              <span className="text-slate-400 shrink-0 font-mono">
                ({formatCurrency(selectedProduct.unit_price)}/{selectedProduct.unit})
              </span>
            </>
          ) : selectedProductName ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                Custom
              </span>
              <span className="font-medium text-slate-800 truncate">
                {selectedProductName}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(selectedProductId || selectedProductName) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(null, '');
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

      {/* Floating Dropdown Modal rendered via Portal to escape table overflow clipping */}
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
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type to search roofing sheet, screws, pipe..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Quick Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Items List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-sky-50 text-sky-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                        <span className="font-semibold text-xs truncate">
                          {p.name}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {formatCurrency(p.unit_price)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        per {p.unit} ({p.tax_rate}% GST)
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="py-6 text-center text-slate-400 space-y-2 p-3">
                  <Package className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="text-xs">No materials matching &quot;{query}&quot;</p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(null, query.trim());
                        setIsOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200"
                    >
                      <span>Use &quot;{query.trim()}&quot; as custom item</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
