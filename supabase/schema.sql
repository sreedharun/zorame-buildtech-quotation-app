-- ==============================================================================
-- ROOFING SHEET QUOTATION MANAGEMENT SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 3. TABLE: company_settings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Zorame Buildtech',
    tagline TEXT DEFAULT 'Building a Stronger Tomorrow | Roofing • Fabrication • PEB Buildings • Engineering Works',
    phone TEXT DEFAULT '+91 94431 52678 / +91 98424 52678',
    email TEXT DEFAULT 'zoramebuildtech@gmail.com',
    address TEXT DEFAULT 'No. 12, Sangliandapuram Main Road, Near Palakarai, Tiruchirappalli (Trichy), Tamil Nadu 620001',
    gst_tax_id TEXT DEFAULT '33AAGFS1234F1Z9',
    logo_url TEXT DEFAULT '',
    quote_prefix TEXT NOT NULL DEFAULT 'ZB-',
    default_validity_days INTEGER NOT NULL DEFAULT 15,
    default_steel_price_per_kg NUMERIC(10,2) DEFAULT 78.00,
    default_terms TEXT DEFAULT '1. Prices are inclusive of applicable GST unless stated otherwise.
2. Delivery within city limits and nearby districts within 2-4 working days upon order confirmation.
3. Loading and transport freight charges extra at actuals unless explicitly quoted.
4. Material cutting and custom profile orders cannot be cancelled once processing has commenced.
    bank_details TEXT DEFAULT 'Bank Name: State Bank of India
Account Name: Zorame Buildtech
Account No: 38901234567
IFSC Code: SBIN0001234
Branch: Trichy Main',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. TABLE: products
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Roofing Sheet', 'Screw', 'Pipe', 'Accessory', 'Labor', 'Other')),
    unit TEXT NOT NULL DEFAULT 'pcs',
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. TABLE: customers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    site_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. TABLE: quotations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    customer_site_location TEXT,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Approved', 'Rejected')),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_type TEXT DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percent')),
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    terms_and_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);

CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. TABLE: quotation_items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    line_subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Migration check for existing databases:
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES (Public/Anon access for Office Staff)
-- ==============================================================================
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for office staff internal tool
CREATE POLICY "Allow public all access on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on quotation_items" ON quotation_items FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. INITIAL SEED DATA
-- ==============================================================================
INSERT INTO company_settings (id, company_name, tagline, phone, email, address, gst_tax_id, quote_prefix, default_validity_days)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Zorame Buildtech',
    'Building a Stronger Tomorrow | Roofing • Fabrication • PEB Buildings • Engineering Works',
    '+91 94431 52678 / +91 98424 52678',
    'zoramebuildtech@gmail.com',
    'No. 12, Sangliandapuram Main Road, Near Palakarai, Tiruchirappalli (Trichy), Tamil Nadu 620001',
    '33AAGFS1234F1Z9',
    'ZB-',
    15
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Products for Roofing Business
INSERT INTO products (name, category, unit, unit_price, tax_rate, description) VALUES
('Color Coated Galvalume Trapezoidal Sheet 0.47mm (Castle Red)', 'Roofing Sheet', 'sqft', 58.50, 18.00, 'AZ150 high tensile 550 MPA Galvalume profiled sheet'),
('Color Coated Galvalume Trapezoidal Sheet 0.50mm (Off White)', 'Roofing Sheet', 'sqft', 64.00, 18.00, 'AZ150 high tensile color coated roofing profile'),
('Polycarbonate Transparent Embossed Sheet 2mm', 'Roofing Sheet', 'sqft', 95.00, 18.00, 'UV coated daylight skylight roofing sheet'),
('Self Drilling Screws with EPDM Washer 12 x 55mm', 'Screw', 'box', 450.00, 18.00, 'Hex head with zinc coating & bonded EPDM washer (Pack of 100)'),
('Self Drilling Screws 12 x 25mm (Stitching)', 'Screw', 'box', 380.00, 18.00, 'Side lap stitching screws with neoprene washer (Pack of 100)'),
('MS Rectangular Hollow Section Pipe 50x25x2mm (18ft)', 'Pipe', 'pcs', 1250.00, 18.00, 'Structural purlin support mild steel pipe'),
('GI Round Pipe 2 Inch Class B (20ft)', 'Pipe', 'pcs', 1850.00, 18.00, 'Heavy grade galvanized iron drainage and structure pipe'),
('Ridge Cap 0.47mm (Matching Sheet Color, 8ft Length)', 'Accessory', 'pcs', 480.00, 18.00, 'Apex ridge flashing cap for crown sealing'),
('Rain Water Gutter 0.50mm (8ft Length)', 'Accessory', 'pcs', 620.00, 18.00, 'High flow eaves water drainage gutter'),
('Corner Flashing / Gable Flashing 0.47mm (8ft)', 'Accessory', 'pcs', 350.00, 18.00, 'Side barge and wind-proof flashing trims'),
('Silicon Sealant Weatherproof Cartridge 300ml', 'Accessory', 'pcs', 240.00, 18.00, 'Neutral cure silicone for leak-proof joints and overlap sealing'),
('Roofing Sheet Installation & Fixing Labor', 'Labor', 'sqft', 14.00, 18.00, 'Professional on-site hoisting, alignment, drilling, and fixing'),
('Structural Truss Fabrication & Welding Charges', 'Labor', 'kg', 22.00, 18.00, 'Cutting, assembly, and welding of steel trusses and purlins');

-- Seed Sample Customers
INSERT INTO customers (name, phone, email, address, site_location, notes) VALUES
('Ramesh Infrastructure & Builders', '+91 98450 11223', 'ramesh.builders@gmail.com', 'No. 15, Ring Road, Rajajinagar, Bengaluru', 'Warehouse Site at Nelamangala Industrial Park', 'VIP client - standard 5% volume discount applies'),
('Suresh Kumar (Greenfield Farms)', '+91 97412 88990', 'suresh.farms@yahoo.com', 'Farmhouse #12, Doddaballapur Road', 'Polyhouse & Shed Construction, Devanahalli', 'Needs quotation with transparent daylight sheets included'),
('Shree Balaji Commercial Complex', '+91 94480 33445', 'balaji.projects@outlook.com', '7th Cross, Gandhinagar, Bengaluru', 'Commercial Terrace Roof Extension, Yeshwanthpur', 'Requires quick delivery within 3 days');
