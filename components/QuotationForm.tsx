'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Customer,
  Product,
  Quotation,
  QuotationItem,
  QuotationStatus,
  DiscountType,
  CompanySettings,
} from '@/lib/types';
import {
  getProducts,
  getCustomers,
  getCompanySettings,
  generateNextQuotationNumber,
  createQuotation,
  updateQuotation,
  createCustomer,
} from '@/lib/storage';
import {
  calculateLineItem,
  calculateQuotationTotals,
  calculateSteelTotals,
  calculateQuotationTotalWeight,
  formatCurrency,
  numberToWords,
  addDays,
} from '@/lib/utils';
import {
  STEEL_SECTIONS_DATABASE,
  SteelProfileType,
  getWeightPerMeter,
  calculateSteelSectionWeight,
} from '@/lib/steel-sections';
import { CustomerModal } from './CustomerModal';
import { ProductCombobox } from './ProductCombobox';
import { CustomerCombobox } from './CustomerCombobox';
import {
  Plus,
  Trash2,
  Save,
  FileCheck,
  UserPlus,
  Calendar,
  Sparkles,
  Scale,
  Layers,
  Ruler,
} from 'lucide-react';

interface QuotationFormProps {
  initialQuotation?: Quotation | null;
  isEditing?: boolean;
  preselectedCustomerId?: string | null;
}

export function QuotationForm({
  initialQuotation,
  isEditing = false,
  preselectedCustomerId,
}: QuotationFormProps) {
  const router = useRouter();

  // Reference Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Form State
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(addDays(new Date().toISOString().split('T')[0], 15));
  const [status, setStatus] = useState<QuotationStatus>('Draft');

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSiteLocation, setCustomerSiteLocation] = useState('');

  // Items State
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Steel Group Pricing (Single Price per Kg for entire steel schedule)
  const [steelPricePerKg, setSteelPricePerKg] = useState<number>(78);

  // Global Quotation GST Rate %
  const [gstRate, setGstRate] = useState<number>(18);

  // Discount & Totals
  const [discountType, setDiscountType] = useState<DiscountType>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Terms & Notes
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [pData, cData, sData] = await Promise.all([
          getProducts(),
          getCustomers(),
          getCompanySettings(),
        ]);
        setProducts(pData);
        setCustomers(cData);
        setSettings(sData);

        const defaultRate = sData.default_steel_price_per_kg || 78;
        setSteelPricePerKg(defaultRate);

        if (initialQuotation) {
          setQuotationNumber(initialQuotation.quotation_number);
          setQuotationDate(initialQuotation.quotation_date);
          setValidUntil(initialQuotation.valid_until);
          setStatus(initialQuotation.status);
          setSelectedCustomerId(initialQuotation.customer_id || '');
          setCustomerName(initialQuotation.customer_name);
          setCustomerPhone(initialQuotation.customer_phone || '');
          setCustomerAddress(initialQuotation.customer_address || '');
          setCustomerSiteLocation(initialQuotation.customer_site_location || '');
          setDiscountType(initialQuotation.discount_type || 'flat');
          setDiscountValue(initialQuotation.discount_value || 0);
          setGstRate(typeof initialQuotation.tax_rate === 'number' ? initialQuotation.tax_rate : 18);
          setTerms(initialQuotation.terms_and_conditions || sData.default_terms);
          setNotes(initialQuotation.notes || '');
          if (typeof initialQuotation.steel_price_per_kg === 'number') {
            setSteelPricePerKg(initialQuotation.steel_price_per_kg);
          } else if (typeof initialQuotation.steel_price_per_meter === 'number') {
            setSteelPricePerKg(initialQuotation.steel_price_per_meter);
          }
          setItems(initialQuotation.items || []);
        } else {
          // Generate new quote number
          const nextNo = await generateNextQuotationNumber();
          setQuotationNumber(nextNo);
          const validityDays = sData.default_validity_days || 15;
          const todayStr = new Date().toISOString().split('T')[0];
          setQuotationDate(todayStr);
          setValidUntil(addDays(todayStr, validityDays));
          setTerms(sData.default_terms);

          // Handle preselected customer from query param
          if (preselectedCustomerId) {
            const match = cData.find((c) => c.id === preselectedCustomerId);
            if (match) {
              setSelectedCustomerId(match.id);
              setCustomerName(match.name);
              setCustomerPhone(match.phone);
              setCustomerAddress(match.address || '');
              setCustomerSiteLocation(match.site_location || '');
            }
          }

          // Initialize with 1 empty regular product line item
          if (pData.length > 0) {
            const firstProd = pData[0];
            const line = calculateLineItem(firstProd.unit_price, 1, firstProd.tax_rate);
            setItems([
              {
                item_type: 'product',
                product_id: firstProd.id,
                product_name: firstProd.name,
                category: firstProd.category,
                unit: firstProd.unit,
                unit_price: firstProd.unit_price,
                tax_rate: firstProd.tax_rate,
                quantity: 1,
                ...line,
              },
            ]);
          }
        }
      } catch (e) {
        console.error('Error initializing quotation form:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialQuotation, preselectedCustomerId]);

  // Keep customer and product lookups synchronized when switching tabs
  useEffect(() => {
    let lastFocus = Date.now();
    const refreshLookups = async () => {
      try {
        const [pData, cData] = await Promise.all([getProducts(), getCustomers()]);
        setProducts(pData);
        setCustomers(cData);
      } catch (err) {
        // silent background sync
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocus > 2000) {
        lastFocus = now;
        refreshLookups();
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastFocus > 2000) {
          lastFocus = now;
          refreshLookups();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle Customer Selection Change from Combobox
  const handleSelectCustomer = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerAddress(customer.address || '');
      setCustomerSiteLocation(customer.site_location || '');
    } else {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerSiteLocation('');
    }
  };

  // Add Regular Product Line Item
  const handleAddProductItem = (prod?: Product) => {
    if (prod) {
      const line = calculateLineItem(prod.unit_price, 1, prod.tax_rate);
      setItems((prev) => [
        ...prev,
        {
          item_type: 'product',
          product_id: prod.id,
          product_name: prod.name,
          category: prod.category,
          unit: prod.unit,
          unit_price: prod.unit_price,
          tax_rate: prod.tax_rate,
          quantity: 1,
          ...line,
        },
      ]);
    } else {
      // Blank custom product line item
      setItems((prev) => [
        ...prev,
        {
          item_type: 'product',
          product_id: null,
          product_name: '',
          description: '',
          category: 'Roofing Sheet',
          unit: 'meter',
          unit_price: 0,
          tax_rate: 18,
          quantity: 1,
          line_subtotal: 0,
          line_tax: 0,
          line_total: 0,
        },
      ]);
    }
  };

  // Add Inline Steel / Pipe Row
  const handleAddSteelItem = () => {
    const defaultProfile: SteelProfileType = 'SHS';
    const profileDef = STEEL_SECTIONS_DATABASE.find((p) => p.type === defaultProfile)!;
    const defaultSize = profileDef.sizes[0].size;
    const defaultThickness = profileDef.sizes[0].thicknesses[0]?.thickness || '1.2mm';
    const weightPerM = getWeightPerMeter(defaultProfile, defaultSize, defaultThickness);
    const defaultLength = 6; // 6 meters
    const defaultQty = 1;
    const calcWeight = calculateSteelSectionWeight({
      weightPerMeter: weightPerM,
      lengthMeters: defaultLength,
      quantity: defaultQty,
    });

    const newSteelItem: QuotationItem = {
      item_type: 'steel',
      steel_profile_type: defaultProfile,
      steel_size: defaultSize,
      steel_thickness: defaultThickness,
      length_meters: defaultLength,
      weight_per_meter: weightPerM,
      weight_kg: calcWeight.totalWeightKg,
      unit_weight_kg: calcWeight.weightPerPieceKg,
      product_name: `${profileDef.label} ${defaultSize} x ${defaultThickness}`,
      category: 'Pipe',
      unit: 'pcs',
      unit_price: 0,
      tax_rate: 18,
      quantity: defaultQty,
      line_subtotal: 0,
      line_tax: 0,
      line_total: 0,
    };

    setItems((prev) => [...prev, newSteelItem]);
  };

  // Select Product from Combobox (Regular Item)
  const handleSelectProductInItem = (
    index: number,
    product: Product | null,
    customName?: string
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };
      current.item_type = 'product';
      if (product) {
        current.product_id = product.id;
        current.product_name = product.name;
        current.category = product.category;
        current.unit = product.unit;
        current.unit_price = product.unit_price;
        current.tax_rate = product.tax_rate;
        current.weight_kg = undefined;
        current.unit_weight_kg = undefined;
      } else {
        current.product_id = null;
        if (customName !== undefined) {
          current.product_name = customName;
        }
      }
      const line = calculateLineItem(current.unit_price, current.quantity, current.tax_rate);
      current.line_subtotal = line.line_subtotal;
      current.line_tax = line.line_tax;
      current.line_total = line.line_total;
      updated[index] = current;
      return updated;
    });
  };

  // Update Line Item directly (Regular or General property)
  const handleUpdateItem = (
    index: number,
    field: keyof QuotationItem,
    value: string | number | null
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const prevItem = updated[index];
      const item = { ...prevItem, [field]: value };

      if (item.item_type !== 'steel') {
        // Recalculate regular line totals
        const line = calculateLineItem(item.unit_price, item.quantity, item.tax_rate);
        item.line_subtotal = line.line_subtotal;
        item.line_tax = line.line_tax;
        item.line_total = line.line_total;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Update Steel Row Specific Fields Inline
  const handleUpdateSteelField = (
    index: number,
    updates: Partial<QuotationItem>
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], ...updates };

      const profileType = (current.steel_profile_type || 'SHS') as SteelProfileType;
      const profileDef =
        STEEL_SECTIONS_DATABASE.find((p) => p.type === profileType) ||
        STEEL_SECTIONS_DATABASE[0];

      // If profile changed, ensure valid size
      let size = current.steel_size || profileDef.sizes[0].size;
      const sizeDef = profileDef.sizes.find((s) => s.size === size) || profileDef.sizes[0];
      size = sizeDef.size;

      // Ensure valid thickness
      let thickness = current.steel_thickness || sizeDef.thicknesses[0]?.thickness || 'Standard';
      if (profileDef.hasThicknessDropdown === false) {
        thickness = 'Standard';
      } else {
        const hasMatch = sizeDef.thicknesses.some((t) => t.thickness === thickness);
        if (!hasMatch && sizeDef.thicknesses.length > 0) {
          thickness = sizeDef.thicknesses[0].thickness;
        }
      }

      const weightPerMeter = getWeightPerMeter(profileType, size, thickness);
      const lengthMeters = typeof current.length_meters === 'number' ? current.length_meters : 6;
      const quantity = typeof current.quantity === 'number' ? current.quantity : 1;

      const calc = calculateSteelSectionWeight({
        weightPerMeter,
        lengthMeters,
        quantity,
      });

      const autoName =
        profileDef.hasThicknessDropdown === false || thickness === 'Standard'
          ? `${profileDef.label} ${size}`
          : `${profileDef.label} ${size} x ${thickness}`;

      current.steel_profile_type = profileType;
      current.steel_size = size;
      current.steel_thickness = thickness;
      current.length_meters = lengthMeters;
      current.quantity = quantity;
      current.weight_per_meter = weightPerMeter;
      current.weight_kg = calc.totalWeightKg;
      current.unit_weight_kg = calc.weightPerPieceKg;
      current.product_name = autoName;
      current.unit = 'pcs';
      current.unit_price = 0;
      current.line_subtotal = 0;
      current.line_tax = 0;
      current.line_total = 0;

      updated[index] = current;
      return updated;
    });
  };

  // Remove Line Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Compute Live Totals
  const totals = calculateQuotationTotals(
    items,
    discountType,
    discountValue,
    steelPricePerKg,
    gstRate
  );
  const totalWeightKg = calculateQuotationTotalWeight(items);
  const hasSteelRows = items.some((i) => i.item_type === 'steel');

  // Handle Save
  const handleSave = async (redirectAfter = true) => {
    if (!customerName.trim()) {
      alert('Please select or enter a Customer Name');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to the quotation');
      return;
    }

    try {
      setSaving(true);
      const quotationData: Omit<Quotation, 'id'> = {
        quotation_number: quotationNumber,
        customer_id: selectedCustomerId || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_site_location: customerSiteLocation,
        quotation_date: quotationDate,
        valid_until: validUntil,
        status: status,
        subtotal: totals.subtotal,
        tax_rate: gstRate,
        tax_amount: totals.taxAmount,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: totals.discountAmount,
        grand_total: totals.grandTotal,
        total_weight_kg: totals.totalSteelWeightKg || totalWeightKg,
        total_steel_length_meters: totals.totalSteelLengthMeters,
        total_steel_weight_kg: totals.totalSteelWeightKg,
        steel_price_per_kg: steelPricePerKg,
        total_steel_cost: totals.totalSteelCost,
        terms_and_conditions: terms,
        notes: notes,
      };

      let savedQuote: Quotation;
      if (isEditing && initialQuotation) {
        savedQuote = await updateQuotation(initialQuotation.id, quotationData, items);
      } else {
        savedQuote = await createQuotation(quotationData, items);
      }

      // Celebrate quote creation
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (redirectAfter) {
        router.push(`/quotations/${savedQuote.id}`);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  // Handle Inline Customer Creation
  const handleInlineCustomerCreated = async (
    newCustData: Omit<Customer, 'id'> | Customer
  ) => {
    const created = await createCustomer(newCustData);
    const refreshedCustomers = await getCustomers();
    setCustomers(refreshedCustomers);
    if (created && created.id) {
      handleSelectCustomer(created);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
        <p>Loading quotation builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
              {isEditing ? 'Editing Quotation' : 'New Price Quotation'}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{quotationNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {customerName ? `Quotation for ${customerName}` : 'Create Roofing Quotation'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & View / Print'}</span>
          </button>
        </div>
      </div>

      {/* Primary Quotation Settings & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Customer & Delivery Details</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Search / Select Customer
              </label>
              <CustomerCombobox
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={handleSelectCustomer}
                onOpenAddNewModal={() => setIsCustomerModalOpen(true)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Infrastructure & Builders"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing / Office Address
              </label>
              <input
                type="text"
                placeholder="e.g. No. 15, Ring Road, Bengaluru"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Roofing Site / Delivery Location</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Warehouse Site at Nelamangala Industrial Park (crucial for freight & labor calculations)"
              value={customerSiteLocation}
              onChange={(e) => setCustomerSiteLocation(e.target.value)}
              className="w-full px-3.5 py-2 border border-indigo-200 bg-indigo-50/30 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Quotation Metadata Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Quotation Header Details</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quotation Number
            </label>
            <input
              type="text"
              required
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quote Date
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valid Until
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quotation Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuotationStatus)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none font-semibold"
            >
              <option value="Draft">Draft (Internal)</option>
              <option value="Sent">Sent to Customer</option>
              <option value="Approved">Approved / Order Confirmed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Itemized Materials Table (Regular Products + Inline Steel/Pipe Rows) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>Itemized Materials, Roofing & Structural Steel</span>
            </h3>
            <p className="text-xs text-slate-500">
              Add roofing sheets, screws, puff panels, or add steel/pipe sections directly inline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Inline Steel Row Button */}
            <button
              type="button"
              onClick={handleAddSteelItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-slate-950" />
              <span>+ Add Steel / Pipe Row</span>
            </button>

            {/* Regular Product Row Button */}
            <button
              type="button"
              onClick={() => handleAddProductItem()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Material Row</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[340px]">Product / Steel Section Specification</th>
                <th className="py-3 px-3 w-20 text-center">Unit</th>
                <th className="py-3 px-3 w-28 text-right">Length / Unit</th>
                <th className="py-3 px-3 w-24 text-right">Qty</th>
                <th className="py-3 px-3 w-36 text-right">Price / Weight</th>
                <th className="py-3 px-3 w-32 text-right">Line Total (₹)</th>
                <th className="py-3 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const isSteel = item.item_type === 'steel';

                if (isSteel) {
                  const currentProfileDef =
                    STEEL_SECTIONS_DATABASE.find((p) => p.type === item.steel_profile_type) ||
                    STEEL_SECTIONS_DATABASE[0];
                  const currentSizeDef =
                    currentProfileDef.sizes.find((s) => s.size === item.steel_size) ||
                    currentProfileDef.sizes[0];
                  const hasThickness = currentProfileDef.hasThicknessDropdown !== false;

                  return (
                    <tr key={idx} className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                      {/* Row Index with Steel indicator */}
                      <td className="py-3 px-3 text-center align-top pt-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-slate-500 font-bold">{idx + 1}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 rounded">
                            STEEL
                          </span>
                        </div>
                      </td>

                      {/* Steel Inline Dropdowns (Profile Type, Size, Thickness) */}
                      <td className="py-3 px-3 space-y-2 min-w-[340px]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Profile Type */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                              Profile Type
                            </label>
                            <select
                              value={item.steel_profile_type || 'SHS'}
                              onChange={(e) =>
                                handleUpdateSteelField(idx, {
                                  steel_profile_type: e.target.value as SteelProfileType,
                                })
                              }
                              className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                              {STEEL_SECTIONS_DATABASE.map((p) => (
                                <option key={p.type} value={p.type}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Size */}
                          <div className={hasThickness ? '' : 'sm:col-span-2'}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                              Size
                            </label>
                            <select
                              value={item.steel_size || currentProfileDef.sizes[0].size}
                              onChange={(e) =>
                                handleUpdateSteelField(idx, {
                                  steel_size: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                            >
                              {currentProfileDef.sizes.map((s) => (
                                <option key={s.size} value={s.size}>
                                  {s.size}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Thickness (hidden for H Beam) */}
                          {hasThickness && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                Thickness
                              </label>
                              <select
                                value={item.steel_thickness || currentSizeDef.thicknesses[0]?.thickness}
                                onChange={(e) =>
                                  handleUpdateSteelField(idx, {
                                    steel_thickness: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                              >
                                {currentSizeDef?.thicknesses.map((t) => (
                                  <option key={t.thickness} value={t.thickness}>
                                    {t.thickness}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Specification Label */}
                        <div className="flex items-center gap-2 text-[11px] text-amber-900 font-medium">
                          <span className="font-semibold text-slate-800">{item.product_name}</span>
                          <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.2 rounded border border-amber-200">
                            {item.weight_per_meter || 0} kg/m
                          </span>
                        </div>

                        {/* Optional Custom Description for Steel Item */}
                        <input
                          type="text"
                          placeholder="Description / Custom steel notes (e.g. Main columns, Rafters, Primer coated)..."
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1 border border-amber-300/80 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 outline-none font-medium bg-white"
                        />
                      </td>

                      {/* Unit (pcs) */}
                      <td className="py-3 px-3 text-center align-top pt-4">
                        <span className="inline-block px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-600 font-medium">
                          pcs
                        </span>
                      </td>

                      {/* Length in meters input */}
                      <td className="py-3 px-3 align-top pt-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={item.length_meters || 6}
                            onChange={(e) =>
                              handleUpdateSteelField(idx, {
                                length_meters: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="6"
                            className="w-full px-2.5 py-1.5 text-right font-mono font-bold border border-amber-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold pointer-events-none">
                            m
                          </span>
                        </div>
                        <span className="block text-[10px] text-right text-slate-400 mt-0.5 font-mono">
                          Total: {(((item.length_meters || 0) * (item.quantity || 0))).toFixed(1)}m
                        </span>
                      </td>

                      {/* Quantity in pieces input */}
                      <td className="py-3 px-3 align-top pt-3">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateSteelField(idx, {
                              quantity: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-right font-mono font-bold border border-amber-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <span className="block text-[10px] text-right text-slate-400 mt-0.5">
                          pieces
                        </span>
                      </td>

                      {/* Calculated Weight for this row (NO INDIVIDUAL PRICE) */}
                      <td className="py-3 px-3 text-right align-top pt-3">
                        <div className="bg-amber-100/60 p-1.5 rounded-lg border border-amber-200/80">
                          <span className="block text-[10px] uppercase font-bold text-amber-800">
                            Weight
                          </span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {item.weight_kg || 0} kg
                          </span>
                          <span className="block text-[9px] text-amber-700">
                            ({item.unit_weight_kg || 0} kg/pc)
                          </span>
                        </div>
                      </td>

                      {/* Line Total (Steel rows are priced via Steel Price/kg in Summary) */}
                      <td className="py-3 px-3 text-right align-top pt-4">
                        <span className="text-[11px] font-semibold text-amber-800 italic">
                          Priced in Summary
                        </span>
                      </td>

                      {/* Remove Row */}
                      <td className="py-3 px-3 text-center align-top pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                }

                // Regular Material / Product Row
                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>

                    {/* Searchable Combobox & Custom Item Field */}
                    <td className="py-3 px-3 space-y-1.5 min-w-[340px]">
                      <ProductCombobox
                        products={products}
                        selectedProductId={item.product_id || null}
                        selectedProductName={item.product_name}
                        onSelectProduct={(p, custom) =>
                          handleSelectProductInItem(idx, p, custom)
                        }
                        placeholder="Type or click to search roofing / accessory material..."
                      />

                      <input
                        type="text"
                        placeholder="Description / Custom notes (e.g. puff sheet 50 mm, Off-White, 4.5m cut lengths)..."
                        value={item.description || ''}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 outline-none font-medium bg-slate-50/60"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 text-center border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 outline-none font-medium"
                        placeholder="meter, pcs"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3" colSpan={2}>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[11px] text-slate-400 font-semibold">Qty:</span>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2.5 py-1.5 text-right font-mono font-semibold border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-right font-mono border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(item.line_total)}
                      </div>
                    </td>

                    {/* Remove Row */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Add Helper Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Quick Add Material:</span>
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAddProductItem(p)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-[11px] font-medium transition-colors truncate max-w-[220px]"
              >
                + {p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSteelItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-2xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>+ Steel Row</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddProductItem()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Product Row</span>
            </button>
          </div>
        </div>
      </div>

      {/* Structural Steel Summary & Weight Pricing Banner (Shows when steel items are present) */}
      {hasSteelRows && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md shadow-amber-500/20">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 text-base flex items-center gap-2">
                  <span>Structural Steel & Pipe Pricing Summary</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 border border-amber-300">
                    Weight-Based Pricing
                  </span>
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-0.5 font-medium">
                  <span>
                    Total Steel Weight:{' '}
                    <strong className="text-amber-950 font-mono text-sm">
                      {totals.totalSteelWeightKg} kg
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Steel Length:{' '}
                    <strong className="text-slate-900 font-mono text-sm">
                      {totals.totalSteelLengthMeters} m
                    </strong>{' '}
                    <span className="text-slate-400 text-[10px]">(for reference only)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Steel Price per Kg (₹/kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={steelPricePerKg}
                    onChange={(e) => setSteelPricePerKg(parseFloat(e.target.value) || 0)}
                    placeholder="78.00"
                    className="w-36 pl-7 pr-3 py-1.5 border border-amber-300 rounded-xl text-sm font-mono font-black text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="border-l border-amber-200 pl-4 py-1">
                <span className="block text-[10px] uppercase font-bold text-slate-500">
                  Total Steel Cost (inc. in Subtotal)
                </span>
                <span className="text-lg font-black text-amber-950 font-mono">
                  {formatCurrency(totals.totalSteelCost)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  = {totals.totalSteelWeightKg} kg × ₹{steelPricePerKg}/kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Calculation Card & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terms & Notes (Left Side) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Terms & Conditions
            </label>
            <textarea
              rows={5}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Enter quotation validity, delivery timelines, payment terms..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-sans focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Internal Notes / Special Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance received, customer agreed on Off-White color profile"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Calculation Totals (Right Side) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3 text-xs sm:text-sm">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
              Quotation Summary
            </h3>

            {/* Steel Breakdown Row */}
            {(totals.totalSteelWeightKg > 0 || totals.totalSteelLengthMeters > 0) && (
              <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-200 space-y-1 text-amber-950">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Steel Weight:</span>
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {totals.totalSteelWeightKg} kg
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-amber-800 pt-0.5 border-t border-amber-200/60">
                  <span>Total Steel Length (reference):</span>
                  <span className="font-mono font-semibold">{totals.totalSteelLengthMeters} meters</span>
                </div>
                <div className="flex justify-between items-center text-xs text-amber-900 font-bold pt-1">
                  <span>Steel Cost ({totals.totalSteelWeightKg} kg @ ₹{steelPricePerKg}/kg):</span>
                  <span className="font-mono">{formatCurrency(totals.totalSteelCost)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>

            {/* Single GST % Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 text-xs">GST / Tax Rate:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        gstRate === rate
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST Amount ({gstRate}% on Subtotal):</span>
                <span className="font-mono font-semibold text-slate-900">
                  + {formatCurrency(totals.taxAmount)}
                </span>
              </div>
            </div>

            {/* Discount Control */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 text-xs">Apply Discount:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      discountType === 'flat'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Flat ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percent' ? 'e.g. 5%' : 'e.g. 1000'}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <div className="font-mono text-xs font-semibold text-emerald-700 whitespace-nowrap">
                  - {formatCurrency(totals.discountAmount)}
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-baseline">
              <span className="font-black text-slate-900 text-base">Grand Total:</span>
              <span className="font-mono font-black text-2xl text-sky-700">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>

            {/* Amount In Words */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs italic font-medium">
              <span className="font-bold text-[10px] uppercase text-slate-400 block not-italic mb-0.5">
                Total in Words:
              </span>
              {numberToWords(totals.grandTotal)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
            >
              <FileCheck className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save & Generate Quotation'}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setStatus('Draft');
                handleSave(false);
              }}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleInlineCustomerCreated}
      />
    </div>
  );
}
