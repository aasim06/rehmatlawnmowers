-- ====================================================================
-- REHMAT LAWN MOWERS - COMPLETE SUPABASE DATABASE SCHEMA
-- Copy and run this entire script in Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ====================================================================

-- 1. Store Inventory Items Table
CREATE TABLE IF NOT EXISTS public.store_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku_code TEXT,
  category TEXT DEFAULT 'General',
  unit TEXT DEFAULT 'PCS',
  current_stock NUMERIC DEFAULT 0,
  remaining_stock NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  min_threshold NUMERIC DEFAULT 10,
  location TEXT DEFAULT 'Main Store',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alias view for backwards compatibility if needed
CREATE OR REPLACE VIEW public.items AS SELECT * FROM public.store_items;

-- 2. Master Item Names Catalog Table
CREATE TABLE IF NOT EXISTS public.master_item_names (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Usage & Inventory Logs Table (Stock In & Stock Out)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'Stock In' or 'Stock Out'
  item_id TEXT,
  item_name TEXT NOT NULL,
  item_code TEXT,
  qty_used NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'PCS',
  unit_price NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  used_by TEXT, -- Vendor or Customer name
  department TEXT,
  time TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vendors & Suppliers Table
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

-- 5. Customer Machine Sales Table
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

-- 6. Machine Repairs & Job Cards Table
CREATE TABLE IF NOT EXISTS public.machine_repairs (
  id TEXT PRIMARY KEY,
  repair_no TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  city_address TEXT,
  machine_name TEXT,
  serial_no TEXT,
  fault_description TEXT,
  parts_cost NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_amount NUMERIC DEFAULT 0,
  repair_status TEXT DEFAULT 'Received',
  received_date TEXT,
  promised_date TEXT,
  repair_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Machine Models Catalog Table
CREATE TABLE IF NOT EXISTS public.machine_models (
  id TEXT PRIMARY KEY,
  model_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Customer Ledger Payments Table
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

-- 9. Vendor Ledger Payments Table
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

-- 10. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_item_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public read/write access for seamless sync
DROP POLICY IF EXISTS "Public Read/Write Store Items" ON public.store_items;
CREATE POLICY "Public Read/Write Store Items" ON public.store_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Master Item Names" ON public.master_item_names;
CREATE POLICY "Public Read/Write Master Item Names" ON public.master_item_names FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Usage Logs" ON public.usage_logs;
CREATE POLICY "Public Read/Write Usage Logs" ON public.usage_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Vendors" ON public.vendors;
CREATE POLICY "Public Read/Write Vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Machine Sales" ON public.machine_sales;
CREATE POLICY "Public Read/Write Machine Sales" ON public.machine_sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Machine Repairs" ON public.machine_repairs;
CREATE POLICY "Public Read/Write Machine Repairs" ON public.machine_repairs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Machine Models" ON public.machine_models;
CREATE POLICY "Public Read/Write Machine Models" ON public.machine_models FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Customer Payments" ON public.customer_payments;
CREATE POLICY "Public Read/Write Customer Payments" ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Vendor Payments" ON public.vendor_payments;
CREATE POLICY "Public Read/Write Vendor Payments" ON public.vendor_payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read/Write Categories" ON public.categories;
CREATE POLICY "Public Read/Write Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- REALTIME REPLICATION (For instant sync across devices)
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.master_item_names;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_repairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_models;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
