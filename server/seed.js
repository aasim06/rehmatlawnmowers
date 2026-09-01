import { sql } from './db.js';

async function seedDatabase() {
  console.log('🌱 Seeding initial factory data into Neon database...');

  try {
    // 1. Users Table & Admin User
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Super Admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES (
        'admin-1', 'Super Admin', 'admin@rehmat.com', 'admin123', 'Super Admin'
      )
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('✅ Admin user ready (admin@rehmat.com / admin123)');

    // 2. Default Categories
    const categories = [
      { id: 'cat-1', name: 'Spare Parts', description: 'Blades, bearings, pulleys, belts' },
      { id: 'cat-2', name: 'Engine Components', description: 'Carburetors, spark plugs, recoil starters' },
      { id: 'cat-3', name: 'Lubricants & Oils', description: 'Engine oil 4T, 2T, gear lubricants' },
      { id: 'cat-4', name: 'Hardware & Fasteners', description: 'Bolts, nuts, pins, springs' },
      { id: 'cat-5', name: 'Accessories', description: 'Grass bags, throttle cables, wheels' }
    ];

    for (const cat of categories) {
      await sql`
        INSERT INTO categories (id, name, description)
        VALUES (${cat.id}, ${cat.name}, ${cat.description})
        ON CONFLICT (name) DO NOTHING;
      `;
    }
    console.log('✅ Categories seeded');

    // 3. Default Machine Models
    const models = [
      'Rehmat 20" Lawn Mower (Petrol Engine)',
      'Rehmat Electric Lawn Cutter 18"',
      'Rehmat Heavy Duty Lawn Mower 24"',
      'Rehmat Grass Trimmer & Cutter 2-Stroke',
      'Rehmat Hand Push Lawn Roller Mower'
    ];

    for (const mod of models) {
      const id = `mod-${Math.random().toString(36).substr(2, 6)}`;
      await sql`
        INSERT INTO machine_models (id, model_name)
        VALUES (${id}, ${mod})
        ON CONFLICT (model_name) DO NOTHING;
      `;
    }
    console.log('✅ Machine models seeded');

    // 4. Default Master Items & Catalog
    const initialItems = [
      { name: 'Gear set complete', category: 'Spare Parts', unitPrice: 13500, stock: 15, sku: 'SKU-GEAR-01' },
      { name: 'Chain set complete', category: 'Spare Parts', unitPrice: 3500, stock: 25, sku: 'SKU-CHN-01' },
      { name: 'Bearing Complete', category: 'Spare Parts', unitPrice: 3500, stock: 40, sku: 'SKU-BRG-01' },
      { name: 'SKF Ball Bearing 6205', category: 'Spare Parts', unitPrice: 450, stock: 50, sku: 'SKU-SKF-6205' },
      { name: 'Cutter Blade 20"', category: 'Spare Parts', unitPrice: 850, stock: 30, sku: 'SKU-BLD-20' },
      { name: 'Cutter Blade 24"', category: 'Spare Parts', unitPrice: 1100, stock: 20, sku: 'SKU-BLD-24' },
      { name: 'Sharpness overhauling', category: 'Spare Parts', unitPrice: 4000, stock: 99, sku: 'SRV-SHRP-01' },
      { name: 'Back roller shaft', category: 'Spare Parts', unitPrice: 4500, stock: 12, sku: 'SKU-SFT-01' },
      { name: 'Paint new', category: 'Accessories', unitPrice: 2000, stock: 50, sku: 'SRV-PNT-01' },
      { name: 'Grass box', category: 'Accessories', unitPrice: 3500, stock: 18, sku: 'SKU-BOX-01' },
      { name: 'Brush cutter repair', category: 'Spare Parts', unitPrice: 16000, stock: 99, sku: 'SRV-BRSH-01' },
      { name: 'Labor charges', category: 'Spare Parts', unitPrice: 8000, stock: 999, sku: 'SRV-LBR-01' },
      { name: 'Spark Plug NGK', category: 'Engine Components', unitPrice: 350, stock: 60, sku: 'SKU-SPK-01' },
      { name: 'Engine Oil 4T 20W-50', category: 'Lubricants & Oils', unitPrice: 750, stock: 45, sku: 'SKU-OIL-4T' },
      { name: 'Carburetor Assembly', category: 'Engine Components', unitPrice: 2400, stock: 15, sku: 'SKU-CRB-01' },
      { name: 'Starter Pulley & Recoil Rope', category: 'Engine Components', unitPrice: 650, stock: 35, sku: 'SKU-REC-01' },
      { name: 'Air Filter Element', category: 'Engine Components', unitPrice: 280, stock: 40, sku: 'SKU-FLT-01' },
      { name: 'V-Belt A-38', category: 'Spare Parts', unitPrice: 420, stock: 30, sku: 'SKU-BLT-A38' },
      { name: 'Throttle Cable', category: 'Accessories', unitPrice: 320, stock: 25, sku: 'SKU-CBL-01' }
    ];

    for (const item of initialItems) {
      const id = `item-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const mstId = `mst-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      // Insert master item name
      await sql`
        INSERT INTO master_item_names (id, name, category)
        VALUES (${mstId}, ${item.name}, ${item.category})
        ON CONFLICT (name) DO NOTHING;
      `;

      // Insert store item
      await sql`
        INSERT INTO store_items (
          id, name, sku_code, category, unit,
          current_stock, remaining_stock, unit_price, min_threshold, location
        ) VALUES (
          ${id}, ${item.name}, ${item.sku}, ${item.category}, 'PCS',
          ${item.stock}, ${item.stock}, ${item.unitPrice}, 10, 'Main Store'
        )
        ON CONFLICT (id) DO UPDATE SET
          unit_price = EXCLUDED.unit_price,
          category = EXCLUDED.category;
      `;
    }
    console.log('✅ Store items & Master catalog seeded');

    // 5. Default Vendors
    const vendors = [
      { id: 'vnd-1', name: 'Naveed Bearings & Spares', phone: '0300-8451234', address: 'Badami Bagh Lahore' },
      { id: 'vnd-2', name: 'Pak Engine Parts Ltd', phone: '0321-9988776', address: 'Brandreth Road Lahore' },
      { id: 'vnd-3', name: 'Lahore Hardware Store', phone: '0333-5544332', address: 'Daroghawala Lahore' }
    ];

    for (const v of vendors) {
      await sql`
        INSERT INTO vendors (id, name, company_name, phone, city_address)
        VALUES (${v.id}, ${v.name}, ${v.name}, ${v.phone}, ${v.address})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log('✅ Vendors seeded');

    console.log('\n🎉 ALL FACTORY SEED DATA INSERTED SUCCESSFULLY INTO NEON!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seedDatabase();
