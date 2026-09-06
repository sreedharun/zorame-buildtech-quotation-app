import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  CompanySettings,
  Customer,
  Product,
  Quotation,
  QuotationItem,
} from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_QUOTATIONS,
} from './seed-data';

const STORAGE_KEYS = {
  SETTINGS: 'roofing_settings',
  PRODUCTS: 'roofing_products',
  CUSTOMERS: 'roofing_customers',
  QUOTATIONS: 'roofing_quotations',
};

// Client LocalStorage Helpers
function getLocalItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

// Ensure initial local state is seeded
export function ensureInitializedStorage(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setLocalItem(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);
  } else {
    // Auto-migrate old company name to Zorame Buildtech
    try {
      const existing = getLocalItem<CompanySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);
      if (
        existing.company_name === 'Sun Fiber Sheet Agencies' ||
        existing.company_name === 'Apex Roofing & Steel Solutions' ||
        !existing.company_name
      ) {
        const migrated: CompanySettings = {
          ...existing,
          company_name: 'Zorame Buildtech',
          tagline: DEFAULT_COMPANY_SETTINGS.tagline,
          email: existing.email === 'sunfibersheets.trichy@gmail.com' ? 'zoramebuildtech@gmail.com' : existing.email,
          quote_prefix: existing.quote_prefix === 'SFSA-' ? 'ZB-' : existing.quote_prefix,
          bank_details: DEFAULT_COMPANY_SETTINGS.bank_details,
        };
        setLocalItem(STORAGE_KEYS.SETTINGS, migrated);
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setLocalItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  } else {
    // Auto-migrate any existing sheet products from sqft to meter
    try {
      const existing = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      let changed = false;
      const updated = existing.map((p) => {
        if ((p.category === 'Roofing Sheet' || p.name.toLowerCase().includes('sheet')) && p.unit === 'sqft') {
          changed = true;
          return { ...p, unit: 'meter' };
        }
        return p;
      });
      if (changed) {
        setLocalItem(STORAGE_KEYS.PRODUCTS, updated);
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setLocalItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
    setLocalItem(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  }
}

// ============================================================================
// COMPANY SETTINGS API
// ============================================================================
export async function getCompanySettings(): Promise<CompanySettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      if (!error && data) {
        if (
          data.company_name === 'Sun Fiber Sheet Agencies' ||
          data.company_name === 'Apex Roofing & Steel Solutions'
        ) {
          const updated = {
            ...data,
            company_name: 'Zorame Buildtech',
            tagline: DEFAULT_COMPANY_SETTINGS.tagline,
            email: data.email === 'sunfibersheets.trichy@gmail.com' ? 'zoramebuildtech@gmail.com' : data.email,
            quote_prefix: data.quote_prefix === 'SFSA-' ? 'ZB-' : data.quote_prefix,
            bank_details: DEFAULT_COMPANY_SETTINGS.bank_details,
          };
          await supabase.from('company_settings').upsert(updated);
          return updated as CompanySettings;
        }
        return data as CompanySettings;
      }
    } catch (e) {
      console.warn('Supabase settings fetch failed, using fallback:', e);
    }
  }
  ensureInitializedStorage();
  return getLocalItem<CompanySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);
}

export async function updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const current = await getCompanySettings();
  const updated: CompanySettings = { ...current, ...settings, updated_at: new Date().toISOString() };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .upsert(updated)
        .select()
        .single();
      if (!error && data) return data as CompanySettings;
    } catch (e) {
      console.warn('Supabase settings update failed, saving locally:', e);
    }
  }

  setLocalItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// ============================================================================
// PRODUCTS API
// ============================================================================
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (!error && data) {
        return data.map((p) => {
          if ((p.category === 'Roofing Sheet' || p.name?.toLowerCase().includes('sheet')) && p.unit === 'sqft') {
            return { ...p, unit: 'meter' };
          }
          return p as Product;
        });
      }
    } catch (e) {
      console.warn('Supabase products fetch failed, using fallback:', e);
    }
  }
  ensureInitializedStorage();
  const local = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  return local.map((p) => {
    if ((p.category === 'Roofing Sheet' || p.name?.toLowerCase().includes('sheet')) && p.unit === 'sqft') {
      return { ...p, unit: 'meter' };
    }
    return p;
  });
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'prod-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();
      if (!error && data) return data as Product;
    } catch (e) {
      console.warn('Supabase product insert failed, saving locally:', e);
    }
  }

  const products = await getProducts();
  const updatedList = [newProduct, ...products];
  setLocalItem(STORAGE_KEYS.PRODUCTS, updatedList);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Product;
    } catch (e) {
      console.warn('Supabase product update failed, saving locally:', e);
    }
  }

  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Product not found');

  const updated: Product = { ...products[index], ...updates, updated_at: new Date().toISOString() };
  products[index] = updated;
  setLocalItem(STORAGE_KEYS.PRODUCTS, products);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  // 1. Remove from local storage cache
  ensureInitializedStorage();
  const localProducts = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  setLocalItem(
    STORAGE_KEYS.PRODUCTS,
    localProducts.filter((p) => p.id !== id)
  );

  // 2. Delete from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase product delete error:', e);
    }
  }

  return true;
}

// ============================================================================
// CUSTOMERS API
// ============================================================================
export async function getCustomers(): Promise<Customer[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) return data as Customer[];
    } catch (e) {
      console.warn('Supabase customers fetch failed, using fallback:', e);
    }
  }
  ensureInitializedStorage();
  return getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  const newCustomer: Customer = {
    ...customer,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cust-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();
      if (!error && data) return data as Customer;
    } catch (e) {
      console.warn('Supabase customer insert failed, saving locally:', e);
    }
  }

  const customers = await getCustomers();
  const updatedList = [newCustomer, ...customers];
  setLocalItem(STORAGE_KEYS.CUSTOMERS, updatedList);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Customer;
    } catch (e) {
      console.warn('Supabase customer update failed, saving locally:', e);
    }
  }

  const customers = await getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Customer not found');

  const updated: Customer = { ...customers[index], ...updates, updated_at: new Date().toISOString() };
  customers[index] = updated;
  setLocalItem(STORAGE_KEYS.CUSTOMERS, customers);
  return updated;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  // 1. Remove from local storage cache
  ensureInitializedStorage();
  const localCustomers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  setLocalItem(
    STORAGE_KEYS.CUSTOMERS,
    localCustomers.filter((c) => c.id !== id)
  );

  // 2. Delete from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase customer delete error:', e);
    }
  }

  return true;
}

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ============================================================================
// QUOTATIONS API
// ============================================================================
export async function getQuotations(): Promise<Quotation[]> {
  ensureInitializedStorage();
  const localList = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: quotes, error: qError } = await supabase
        .from('quotations')
        .select('*')
        .order('quotation_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!qError && quotes) {
        const { data: items } = await supabase
          .from('quotation_items')
          .select('*')
          .order('sort_order', { ascending: true });

        const supabaseQuotes = quotes.map((q) => {
          const dbItems = items ? items.filter((item) => item.quotation_id === q.id) : [];
          const localMatch = localList.find((lq) => lq.id === q.id || lq.quotation_number === q.quotation_number);
          // If DB returned items, use them; if empty, preserve local items cache!
          const finalItems = dbItems.length > 0 ? dbItems : (localMatch?.items || []);
          return {
            ...localMatch,
            ...q,
            items: finalItems,
          };
        }) as Quotation[];

        // Combine Supabase quotes and local-only quotes (by id)
        const combined = [...supabaseQuotes];
        localList.forEach((lq) => {
          if (!combined.some((sq) => sq.id === lq.id || sq.quotation_number === lq.quotation_number)) {
            combined.push(lq);
          }
        });

        return combined;
      }
    } catch (e) {
      console.warn('Supabase quotations fetch failed, using fallback:', e);
    }
  }

  return localList;
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  ensureInitializedStorage();
  const localList = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  const localMatch = localList.find((q) => q.id === id);

  // 1. Direct Supabase query by ID
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: quote, error: qErr } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();
      if (!qErr && quote) {
        const { data: items } = await supabase
          .from('quotation_items')
          .select('*')
          .eq('quotation_id', id)
          .order('sort_order', { ascending: true });

        const finalItems = (items && items.length > 0) ? items : (localMatch?.items || []);
        return {
          ...localMatch,
          ...quote,
          items: finalItems,
        } as Quotation;
      }
    } catch (e) {
      console.warn('Direct Supabase quote fetch error:', e);
    }
  }

  // 2. Check local storage fallback
  if (localMatch) return localMatch;

  // 3. Fallback to list search
  const quotations = await getQuotations();
  return quotations.find((q) => q.id === id) || null;
}

export async function generateNextQuotationNumber(): Promise<string> {
  const settings = await getCompanySettings();
  const prefix = settings.quote_prefix || 'SFSA-';
  const year = new Date().getFullYear();
  const quotations = await getQuotations();

  const currentYearPattern = new RegExp(`^${prefix}${year}-(\\d+)`);
  let maxSeq = 0;

  quotations.forEach((q) => {
    const match = q.quotation_number.match(currentYearPattern);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${year}-${nextSeq}`;
}

export async function createQuotation(
  quotationData: Omit<Quotation, 'id'>,
  items: QuotationItem[]
): Promise<Quotation> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'quote-' + Date.now();
  const timestamp = new Date().toISOString();

  const formattedItems: QuotationItem[] = items.map((item, idx) => ({
    ...item,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `qi-${Date.now()}-${idx}`,
    quotation_id: newId,
    sort_order: idx + 1,
  }));

  const newQuotation: Quotation = {
    ...quotationData,
    id: newId,
    created_at: timestamp,
    updated_at: timestamp,
    items: formattedItems,
  };

  // Always save locally so newly created quote is immediately accessible
  ensureInitializedStorage();
  const localQuotes = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  setLocalItem(STORAGE_KEYS.QUOTATIONS, [newQuotation, ...localQuotes.filter((q) => q.id !== newId)]);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert header (strip client-only calculated properties and sanitize UUIDs for DB safety)
      const {
        items: _,
        total_weight_kg: __,
        total_steel_length_meters: _sl,
        total_steel_weight_kg: _sw,
        steel_price_per_meter: _spm,
        steel_price_per_kg: _sp,
        total_steel_cost: _sc,
        ...headerOnly
      } = newQuotation;

      const headerForSupabase = {
        ...headerOnly,
        id: isValidUUID(headerOnly.id) ? headerOnly.id : undefined,
        customer_id: isValidUUID(headerOnly.customer_id) ? headerOnly.customer_id : null,
      };

      const { data: insertedHeader, error: headErr } = await supabase
        .from('quotations')
        .insert(headerForSupabase)
        .select()
        .single();

      if (!headErr && insertedHeader) {
        // Use the returned Supabase ID if generated
        const realId = insertedHeader.id || newId;
        newQuotation.id = realId;

        // 2. Insert items (sanitize columns for Supabase schema compatibility)
        const itemsForSupabase = formattedItems.map((item, idx) => ({
          quotation_id: realId,
          product_id: isValidUUID(item.product_id) ? item.product_id : null,
          product_name: item.product_name,
          category: item.category || 'Roofing Sheet',
          unit: item.unit || 'pcs',
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          quantity: Number(item.quantity) || 1,
          line_subtotal: Number(item.line_subtotal) || 0,
          line_tax: Number(item.line_tax) || 0,
          line_total: Number(item.line_total) || 0,
          sort_order: idx + 1,
        }));

        const { error: itemsErr } = await supabase.from('quotation_items').insert(itemsForSupabase);
        if (!itemsErr) {
          // Update local cache with the confirmed Supabase ID and formatted items
          const updatedLocal = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
          setLocalItem(STORAGE_KEYS.QUOTATIONS, [newQuotation, ...updatedLocal.filter((q) => q.id !== newId && q.id !== realId)]);
          return newQuotation;
        } else {
          console.warn('Supabase items insert warning:', itemsErr);
        }
      } else {
        console.warn('Supabase quotation header insert warning:', headErr);
      }
    } catch (e) {
      console.warn('Supabase quote insert failed, saved locally:', e);
    }
  }

  return newQuotation;
}

export async function updateQuotation(
  id: string,
  quotationData: Partial<Quotation>,
  items?: QuotationItem[]
): Promise<Quotation> {
  const quotations = await getQuotations();
  const index = quotations.findIndex((q) => q.id === id);
  const existing = index !== -1 ? quotations[index] : (await getQuotationById(id));
  if (!existing) throw new Error('Quotation not found');

  const timestamp = new Date().toISOString();

  let formattedItems = existing.items || [];
  if (items) {
    formattedItems = items.map((item, idx) => ({
      ...item,
      id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `qi-${Date.now()}-${idx}`),
      quotation_id: id,
      sort_order: idx + 1,
    }));
  }

  const updated: Quotation = {
    ...existing,
    ...quotationData,
    updated_at: timestamp,
    items: formattedItems,
  };

  // Update local storage
  ensureInitializedStorage();
  const localQuotes = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  const locIdx = localQuotes.findIndex((q) => q.id === id);
  if (locIdx !== -1) {
    localQuotes[locIdx] = updated;
    setLocalItem(STORAGE_KEYS.QUOTATIONS, localQuotes);
  } else {
    setLocalItem(STORAGE_KEYS.QUOTATIONS, [updated, ...localQuotes]);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const {
        items: _,
        total_weight_kg: __,
        total_steel_length_meters: _sl,
        total_steel_weight_kg: _sw,
        steel_price_per_meter: _spm,
        steel_price_per_kg: _sp,
        total_steel_cost: _sc,
        ...headerOnly
      } = updated;

      const headerForSupabase = {
        ...headerOnly,
        customer_id: isValidUUID(headerOnly.customer_id) ? headerOnly.customer_id : null,
      };

      await supabase.from('quotations').update(headerForSupabase).eq('id', id);

      if (items) {
        await supabase.from('quotation_items').delete().eq('quotation_id', id);
        const itemsForSupabase = formattedItems.map((item, idx) => ({
          quotation_id: id,
          product_id: isValidUUID(item.product_id) ? item.product_id : null,
          product_name: item.product_name,
          category: item.category || 'Roofing Sheet',
          unit: item.unit || 'pcs',
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          quantity: Number(item.quantity) || 1,
          line_subtotal: Number(item.line_subtotal) || 0,
          line_tax: Number(item.line_tax) || 0,
          line_total: Number(item.line_total) || 0,
          sort_order: idx + 1,
        }));
        await supabase.from('quotation_items').insert(itemsForSupabase);
      }
      return updated;
    } catch (e) {
      console.warn('Supabase quote update failed, saved locally:', e);
    }
  }

  return updated;
}

export async function deleteQuotation(id: string): Promise<boolean> {
  // 1. Find quote details to ensure full cleanup
  ensureInitializedStorage();
  const localQuotes = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  const quoteToDelete = localQuotes.find((q) => q.id === id);

  // 2. Remove from local storage cache immediately
  const updatedLocal = localQuotes.filter(
    (q) => q.id !== id && (!quoteToDelete || q.quotation_number !== quoteToDelete.quotation_number)
  );
  setLocalItem(STORAGE_KEYS.QUOTATIONS, updatedLocal);

  // 3. Delete from Supabase (delete children items first, then header)
  if (isSupabaseConfigured && supabase) {
    try {
      // Delete child line items first to prevent FK constraint issues
      await supabase.from('quotation_items').delete().eq('quotation_id', id);
      await supabase.from('quotations').delete().eq('id', id);

      // Also clean up by quote number if id was client-generated
      if (quoteToDelete?.quotation_number) {
        await supabase
          .from('quotations')
          .delete()
          .eq('quotation_number', quoteToDelete.quotation_number);
      }
    } catch (e) {
      console.warn('Supabase quote delete error:', e);
    }
  }

  return true;
}

export async function duplicateQuotation(id: string): Promise<Quotation> {
  const original = await getQuotationById(id);
  if (!original) throw new Error('Quotation to duplicate not found');

  const newQuoteNumber = await generateNextQuotationNumber();
  const today = new Date().toISOString().split('T')[0];
  const settings = await getCompanySettings();
  
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + (settings.default_validity_days || 15));
  const validUntil = validUntilDate.toISOString().split('T')[0];

  const { id: _, created_at: __, updated_at: ___, items, quotation_number: ____, ...rest } = original;

  const duplicatedData: Omit<Quotation, 'id'> = {
    ...rest,
    quotation_number: newQuoteNumber,
    quotation_date: today,
    valid_until: validUntil,
    status: 'Draft',
    notes: `Duplicated from ${original.quotation_number}. ${original.notes || ''}`.trim(),
  };

  const clonedItems: QuotationItem[] = (items || []).map((it) => {
    const { id: _iId, quotation_id: _qId, ...itemProps } = it;
    return itemProps as QuotationItem;
  });

  return createQuotation(duplicatedData, clonedItems);
}
