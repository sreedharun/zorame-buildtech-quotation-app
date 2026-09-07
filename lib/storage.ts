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

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ============================================================================
// COMPANY SETTINGS API
// ============================================================================
export async function getCompanySettings(): Promise<CompanySettings> {
  ensureInitializedStorage();
  const localDefault = getLocalItem<CompanySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const merged: CompanySettings = {
          ...DEFAULT_COMPANY_SETTINGS,
          ...localDefault,
          ...data,
          id: data.id || localDefault.id || DEFAULT_COMPANY_SETTINGS.id,
        };

        if (
          merged.company_name === 'Sun Fiber Sheet Agencies' ||
          merged.company_name === 'Apex Roofing & Steel Solutions'
        ) {
          merged.company_name = 'Zorame Buildtech';
          merged.tagline = DEFAULT_COMPANY_SETTINGS.tagline;
          merged.email = merged.email === 'sunfibersheets.trichy@gmail.com' ? 'zoramebuildtech@gmail.com' : merged.email;
          merged.quote_prefix = merged.quote_prefix === 'SFSA-' ? 'ZB-' : merged.quote_prefix;
          merged.bank_details = DEFAULT_COMPANY_SETTINGS.bank_details;
        }

        setLocalItem(STORAGE_KEYS.SETTINGS, merged);
        return merged;
      }

      // If no row exists in Supabase table (empty table), seed initial row
      if (!data && !error) {
        const initialRow: Record<string, any> = {
          company_name: localDefault.company_name || DEFAULT_COMPANY_SETTINGS.company_name,
          tagline: localDefault.tagline || DEFAULT_COMPANY_SETTINGS.tagline,
          phone: localDefault.phone || DEFAULT_COMPANY_SETTINGS.phone,
          email: localDefault.email || DEFAULT_COMPANY_SETTINGS.email,
          address: localDefault.address || DEFAULT_COMPANY_SETTINGS.address,
          gst_tax_id: localDefault.gst_tax_id || DEFAULT_COMPANY_SETTINGS.gst_tax_id,
          logo_url: localDefault.logo_url || DEFAULT_COMPANY_SETTINGS.logo_url,
          quote_prefix: localDefault.quote_prefix || DEFAULT_COMPANY_SETTINGS.quote_prefix,
          default_validity_days: localDefault.default_validity_days || DEFAULT_COMPANY_SETTINGS.default_validity_days,
          default_terms: localDefault.default_terms || DEFAULT_COMPANY_SETTINGS.default_terms,
          bank_details: localDefault.bank_details || DEFAULT_COMPANY_SETTINGS.bank_details,
          updated_at: new Date().toISOString(),
        };

        const { data: insertedData } = await supabase
          .from('company_settings')
          .insert(initialRow)
          .select()
          .maybeSingle();

        if (insertedData) {
          const merged: CompanySettings = {
            ...DEFAULT_COMPANY_SETTINGS,
            ...localDefault,
            ...insertedData,
          };
          setLocalItem(STORAGE_KEYS.SETTINGS, merged);
          return merged;
        }
      }
    } catch (e) {
      console.warn('Supabase settings fetch failed, using local fallback:', e);
    }
  }

  return localDefault;
}

export async function updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const current = await getCompanySettings();
  const updated: CompanySettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  // 1. Immediately cache locally
  ensureInitializedStorage();
  setLocalItem(STORAGE_KEYS.SETTINGS, updated);

  // 2. Persist to Supabase with upsert & schema compatibility
  if (isSupabaseConfigured && supabase) {
    let existingId = updated.id;
    if (!isValidUUID(existingId)) {
      try {
        const { data: firstRow } = await supabase
          .from('company_settings')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (firstRow?.id) {
          existingId = firstRow.id;
          updated.id = firstRow.id;
        }
      } catch (e) {
        console.warn('Could not query existing company_settings row id:', e);
      }
    }

    const payload: Record<string, any> = {
      ...(isValidUUID(existingId) ? { id: existingId } : {}),
      company_name: updated.company_name,
      tagline: updated.tagline ?? null,
      phone: updated.phone ?? null,
      email: updated.email ?? null,
      address: updated.address ?? null,
      gst_tax_id: updated.gst_tax_id ?? null,
      logo_url: updated.logo_url ?? null,
      quote_prefix: updated.quote_prefix || 'ZB-',
      default_validity_days: updated.default_validity_days || 15,
      default_terms: updated.default_terms ?? null,
      bank_details: updated.bank_details ?? null,
      default_steel_price_per_kg: updated.default_steel_price_per_kg ?? 78,
      updated_at: new Date().toISOString(),
    };

    try {
      let { data, error } = await supabase
        .from('company_settings')
        .upsert(payload)
        .select()
        .maybeSingle();

      // If column default_steel_price_per_kg doesn't exist in Supabase table schema (PGRST204), retry without it
      if (error && error.code === 'PGRST204') {
        const { default_steel_price_per_kg: _, ...payloadWithoutSteelPrice } = payload;
        const retry = await supabase
          .from('company_settings')
          .upsert(payloadWithoutSteelPrice)
          .select()
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Supabase company_settings upsert error:', error);
        throw new Error(error.message || 'Failed to save settings to cloud database');
      }

      if (data) {
        const finalMerged: CompanySettings = {
          ...updated,
          ...data,
          default_steel_price_per_kg: updated.default_steel_price_per_kg,
        };
        setLocalItem(STORAGE_KEYS.SETTINGS, finalMerged);
        return finalMerged;
      }
    } catch (e) {
      console.error('Supabase settings update error:', e);
      throw e;
    }
  }

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
          
          // Merge db items with local match items to ensure description & steel specs are never lost
          const finalItems = dbItems.length > 0
            ? dbItems.map((dbItem, idx) => {
                const localItem = localMatch?.items?.[idx] || localMatch?.items?.find((li) => li.product_name === dbItem.product_name);
                return {
                  ...localItem,
                  ...dbItem,
                  description: dbItem.description || localItem?.description || '',
                  item_type: localItem?.item_type || dbItem.item_type || 'product',
                  length_meters: dbItem.length_meters || localItem?.length_meters,
                  steel_profile_type: dbItem.steel_profile_type || localItem?.steel_profile_type,
                  steel_size: dbItem.steel_size || localItem?.steel_size,
                  steel_thickness: dbItem.steel_thickness || localItem?.steel_thickness,
                  weight_per_meter: dbItem.weight_per_meter || localItem?.weight_per_meter,
                  weight_kg: dbItem.weight_kg || localItem?.weight_kg,
                  unit_weight_kg: dbItem.unit_weight_kg || localItem?.unit_weight_kg,
                };
              })
            : (localMatch?.items || []);

          return {
            ...localMatch,
            ...q,
            customer_site_location: q.customer_site_location !== undefined && q.customer_site_location !== null ? q.customer_site_location : (localMatch?.customer_site_location || ''),
            tax_rate: typeof q.tax_rate === 'number'
              ? q.tax_rate
              : (q.subtotal > 0 && typeof q.tax_amount === 'number'
                  ? Math.round((q.tax_amount / q.subtotal) * 100)
                  : (localMatch?.tax_rate ?? 18)),
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

        // Keep local cache synced with DB data
        setLocalItem(STORAGE_KEYS.QUOTATIONS, combined);
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

        const finalItems = (items && items.length > 0)
          ? items.map((dbItem, idx) => {
              const localItem = localMatch?.items?.[idx] || localMatch?.items?.find((li) => li.product_name === dbItem.product_name);
              return {
                ...localItem,
                ...dbItem,
                description: dbItem.description || localItem?.description || '',
                item_type: localItem?.item_type || dbItem.item_type || 'product',
                length_meters: dbItem.length_meters || localItem?.length_meters,
                steel_profile_type: dbItem.steel_profile_type || localItem?.steel_profile_type,
                steel_size: dbItem.steel_size || localItem?.steel_size,
                steel_thickness: dbItem.steel_thickness || localItem?.steel_thickness,
                weight_per_meter: dbItem.weight_per_meter || localItem?.weight_per_meter,
                weight_kg: dbItem.weight_kg || localItem?.weight_kg,
                unit_weight_kg: dbItem.unit_weight_kg || localItem?.unit_weight_kg,
              };
            })
          : (localMatch?.items || []);

        const finalQuote: Quotation = {
          ...localMatch,
          ...quote,
          customer_site_location: quote.customer_site_location !== undefined && quote.customer_site_location !== null ? quote.customer_site_location : (localMatch?.customer_site_location || ''),
          tax_rate: typeof quote.tax_rate === 'number'
            ? quote.tax_rate
            : (quote.subtotal > 0 && typeof quote.tax_amount === 'number'
                ? Math.round((quote.tax_amount / quote.subtotal) * 100)
                : (localMatch?.tax_rate ?? 18)),
          items: finalItems,
        };

        // Synchronize local cache with latest data
        const updatedLocal = localList.filter((lq) => lq.id !== quote.id && lq.quotation_number !== quote.quotation_number);
        setLocalItem(STORAGE_KEYS.QUOTATIONS, [finalQuote, ...updatedLocal]);

        return finalQuote;
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
        tax_rate: _tr,
        ...headerOnly
      } = newQuotation;

      const headerForSupabase: Record<string, any> = {
        ...headerOnly,
        id: isValidUUID(headerOnly.id) ? headerOnly.id : undefined,
        customer_id: isValidUUID(headerOnly.customer_id) ? headerOnly.customer_id : null,
        customer_site_location: headerOnly.customer_site_location ?? '',
      };

      let { data: insertedHeader, error: headErr } = await supabase
        .from('quotations')
        .insert(headerForSupabase)
        .select()
        .maybeSingle();

      if (headErr && headErr.code === 'PGRST204') {
        const { tax_rate: _, ...retryHeader } = headerForSupabase;
        const retry = await supabase
          .from('quotations')
          .insert(retryHeader)
          .select()
          .maybeSingle();
        insertedHeader = retry.data;
        headErr = retry.error;
      }

      if (!headErr && insertedHeader) {
        // Use the returned Supabase ID if generated
        const realId = insertedHeader.id || newId;
        newQuotation.id = realId;

        // 2. Insert items (sanitize columns for Supabase schema compatibility)
        const itemsForSupabase = formattedItems.map((item, idx) => ({
          quotation_id: realId,
          product_id: isValidUUID(item.product_id) ? item.product_id : null,
          product_name: item.product_name,
          description: item.description || null,
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
        if (itemsErr) {
          console.warn('Supabase items insert with description warning, retrying without description column:', itemsErr);
          const fallbackItems = itemsForSupabase.map(({ description: _, ...rest }) => rest);
          await supabase.from('quotation_items').insert(fallbackItems);
        }
        
        // Update local cache with confirmed items
        const updatedLocal = getLocalItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
        setLocalItem(STORAGE_KEYS.QUOTATIONS, [newQuotation, ...updatedLocal.filter((q) => q.id !== newId && q.id !== realId)]);
        return newQuotation;
      } else if (headErr) {
        console.error('Supabase quotation header insert error:', headErr);
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
        tax_rate: _tr,
        ...headerOnly
      } = updated;

      const headerForSupabase: Record<string, any> = {
        ...headerOnly,
        customer_id: isValidUUID(headerOnly.customer_id) ? headerOnly.customer_id : null,
        customer_site_location: headerOnly.customer_site_location ?? '',
      };

      let { data: updatedHeader, error: updateErr } = await supabase
        .from('quotations')
        .update(headerForSupabase)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (updateErr && updateErr.code === 'PGRST204') {
        const { tax_rate: _, ...retryHeader } = headerForSupabase;
        const retry = await supabase
          .from('quotations')
          .update(retryHeader)
          .eq('id', id)
          .select()
          .maybeSingle();
        updatedHeader = retry.data;
        updateErr = retry.error;
      }

      if (updateErr) {
        console.error('Supabase quote update error:', updateErr);
      }

      if (items) {
        await supabase.from('quotation_items').delete().eq('quotation_id', id);
        const itemsForSupabase = formattedItems.map((item, idx) => ({
          quotation_id: id,
          product_id: isValidUUID(item.product_id) ? item.product_id : null,
          product_name: item.product_name,
          description: item.description || null,
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
        const { error: insErr } = await supabase.from('quotation_items').insert(itemsForSupabase);
        if (insErr) {
          const fallbackItems = itemsForSupabase.map(({ description: _, ...rest }) => rest);
          await supabase.from('quotation_items').insert(fallbackItems);
        }
      }
      return updated;
    } catch (e) {
      console.error('Supabase quote update exception:', e);
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
