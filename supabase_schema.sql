-- ====================================================================
-- REHMAT LAWN MOWERS - SUPABASE CLOUD DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor to enable Multi-Device Sync!
-- ====================================================================

-- 1. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku_code TEXT,
  category TEXT DEFAULT 'General',
  unit TEXT DEFAULT 'PCS',
  current_stock NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  min_threshold NUMERIC DEFAULT 10,
  location TEXT DEFAULT 'Main Store',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usage & Inventory Logs Table (Stock In & Stock Out)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'Stock In' or 'Stock Out'
  item_id TEXT,
  item_name TEXT NOT NULL,
  item_code TEXT,
  qty_used NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'PCS',
  unit_price NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  used_by TEXT, -- Vendor or Customer name
  department TEXT,
  time TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vendors & Suppliers Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  city_address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  balance_type TEXT DEFAULT 'Payable',
  current_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Machine Sales Table
CREATE TABLE IF NOT EXISTS public.machine_sales (
  id TEXT PRIMARY KEY,
  sale_no TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  city_address TEXT,
  machine_name TEXT,
  serial_no TEXT,
  qty NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  time TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customer Ledger Payments Table
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  payment_date TEXT,
  amount_paid NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vendor Ledger Payments Table
CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  payment_date TEXT,
  amount_paid NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public read/write access for seamless sync
CREATE POLICY "Public Read/Write Items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Usage Logs" ON public.usage_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Machine Sales" ON public.machine_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Customer Payments" ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Vendor Payments" ON public.vendor_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime subscriptions for multi-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
