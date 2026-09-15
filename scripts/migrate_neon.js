import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_Ng0x7fKcXkqR@ep-hidden-breeze-ayipbcgl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(databaseUrl);

async function runMigration() {
  console.log('Connecting to Neon PostgreSQL and executing schema migrations...');

  try {
    // 1. Store Inventory Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS store_items (
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
    `;
    console.log('✅ store_items table ready');

    // 2. Master Item Names Catalog Table
    await sql`
      CREATE TABLE IF NOT EXISTS master_item_names (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        category TEXT DEFAULT 'General',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ master_item_names table ready');

    // 3. Usage & Inventory Logs Table (Stock In & Stock Out)
    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        item_id TEXT,
        item_name TEXT NOT NULL,
        item_code TEXT,
        qty_used NUMERIC DEFAULT 1,
        unit TEXT DEFAULT 'PCS',
        unit_price NUMERIC DEFAULT 0,
        discount_amount NUMERIC DEFAULT 0,
        line_total NUMERIC DEFAULT 0,
        used_by TEXT,
        department TEXT,
        time TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ usage_logs table ready');

    // 4. Vendors & Suppliers Table
    await sql`
      CREATE TABLE IF NOT EXISTS vendors (
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
    `;
    console.log('✅ vendors table ready');

    // 5. Customer Machine Sales Table
    await sql`
      CREATE TABLE IF NOT EXISTS machine_sales (
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
    `;
    console.log('✅ machine_sales table ready');

    // 6. Machine Repairs & Job Cards Table
    await sql`
      CREATE TABLE IF NOT EXISTS machine_repairs (
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
    `;
    console.log('✅ machine_repairs table ready');

    // 7. Machine Models Catalog Table
    await sql`
      CREATE TABLE IF NOT EXISTS machine_models (
        id TEXT PRIMARY KEY,
        model_name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ machine_models table ready');

    // 8. Customer Ledger Payments Table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        payment_date TEXT,
        amount_paid NUMERIC DEFAULT 0,
        payment_method TEXT DEFAULT 'Cash',
        reference_no TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ customer_payments table ready');

    // 9. Vendor Ledger Payments Table
    await sql`
      CREATE TABLE IF NOT EXISTS vendor_payments (
        id TEXT PRIMARY KEY,
        vendor_name TEXT NOT NULL,
        payment_date TEXT,
        amount_paid NUMERIC DEFAULT 0,
        payment_method TEXT DEFAULT 'Cash',
        reference_no TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ vendor_payments table ready');

    // 10. Categories Table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ categories table ready');

    console.log('\n🎉 ALL NEON TABLES CREATED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Migration Error:', error);
  }
}

runMigration();
