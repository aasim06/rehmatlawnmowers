-- =========================================================
-- REHMAT LAWN MOWERS INVENTORY - SUPABASE PERFORMANCE INDEXES
-- =========================================================
-- Run these index creation commands in Supabase SQL Editor for fast filtering

-- 1. Indexes on store_items table
CREATE INDEX IF NOT EXISTS idx_store_items_item_code ON public.store_items(item_code);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON public.store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_remaining_stock ON public.store_items(remaining_stock);
CREATE INDEX IF NOT EXISTS idx_store_items_created_at ON public.store_items(created_at DESC);

-- 2. Indexes on usage_logs table
CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON public.usage_logs(type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_item_code ON public.usage_logs(item_code);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- 3. Indexes on vendors table
CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(name);

-- 4. Indexes on machine_sales table
CREATE INDEX IF NOT EXISTS idx_machine_sales_sale_no ON public.machine_sales(sale_no);
CREATE INDEX IF NOT EXISTS idx_machine_sales_created_at ON public.machine_sales(created_at DESC);

-- 5. Indexes on customer_payments & vendor_payments
CREATE INDEX IF NOT EXISTS idx_cust_pay_customer ON public.customer_payments(customer_name);
CREATE INDEX IF NOT EXISTS idx_vnd_pay_vendor ON public.vendor_payments(vendor_name);
