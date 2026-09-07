export type ProductCategory = 
  | 'Roofing Sheet' 
  | 'Screw' 
  | 'Pipe' 
  | 'Accessory' 
  | 'Labor' 
  | 'Other';

export type ProductUnit = 
  | 'meter' 
  | 'sqft' 
  | 'pcs' 
  | 'feet' 
  | 'box' 
  | 'bundle' 
  | 'kg' 
  | 'ton' 
  | 'hours' 
  | 'set';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit | string;
  unit_price: number;
  tax_rate: number; // in % e.g., 18 for 18%
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  site_location?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';
export type DiscountType = 'flat' | 'percent';

export interface QuotationItem {
  id?: string;
  quotation_id?: string;
  product_id?: string | null;
  product_name: string;
  description?: string;
  category?: ProductCategory | string;
  unit: string;
  unit_price: number;
  tax_rate: number;
  quantity: number;
  line_subtotal: number;
  line_tax: number;
  line_total: number;

  // Inline Structural Steel fields
  item_type?: 'product' | 'steel';
  steel_profile_type?: string;
  steel_size?: string;
  steel_thickness?: string;
  length_meters?: number;
  weight_per_meter?: number;
  weight_kg?: number;
  unit_weight_kg?: number;
  sort_order?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  customer_site_location?: string;
  quotation_date: string;
  valid_until: string;
  status: QuotationStatus;
  subtotal: number;
  tax_rate?: number; // Overall quotation GST rate % (e.g. 18 for 18%)
  tax_amount: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  grand_total: number;

  // Steel weight & cost calculation fields
  total_steel_length_meters?: number;
  total_steel_weight_kg?: number;
  steel_price_per_kg?: number;
  steel_price_per_meter?: number;
  total_steel_cost?: number;
  total_weight_kg?: number;

  terms_and_conditions?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: QuotationItem[];
}

export interface CompanySettings {
  id: string;
  company_name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  gst_tax_id?: string;
  logo_url?: string;
  quote_prefix: string;
  default_validity_days: number;
  default_terms: string;
  default_steel_price_per_kg?: number;
  bank_details?: string;
  created_at?: string;
  updated_at?: string;
}
