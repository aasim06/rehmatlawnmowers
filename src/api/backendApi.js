import { sql } from './neon';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * High-performance hybrid client:
 * 1. Tries Express REST API first.
 * 2. If REST API is offline, gracefully falls back directly to Neon Serverless SQL driver.
 */
export const backendApi = {
  // Items & Catalog
  async getItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/items`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return await sql`SELECT * FROM store_items ORDER BY name ASC;`;
    }
  },

  async saveItem(item) {
    try {
      const res = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const res = await sql`
        INSERT INTO store_items (
          id, name, sku_code, category, unit,
          current_stock, remaining_stock, unit_price, min_threshold, location, updated_at
        ) VALUES (
          ${item.id}, ${item.name}, ${item.sku_code || item.itemCode || 'N/A'}, ${item.category || 'General'}, ${item.unit || 'PCS'},
          ${item.current_stock || item.totalStock || 0}, ${item.remaining_stock || item.remainingStock || 0}, ${item.unit_price || item.unitPrice || 0},
          ${item.min_threshold || item.minLevel || 10}, ${item.location || item.rackLocation || 'Main Store'}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          sku_code = EXCLUDED.sku_code,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          current_stock = EXCLUDED.current_stock,
          remaining_stock = EXCLUDED.remaining_stock,
          unit_price = EXCLUDED.unit_price,
          min_threshold = EXCLUDED.min_threshold,
          location = EXCLUDED.location,
          updated_at = NOW()
        RETURNING *;
      `;
      return res[0];
    }
  },

  async deleteItem(id) {
    try {
      await fetch(`${API_BASE_URL}/items/${id}`, { method: 'DELETE' });
    } catch {
      await sql`DELETE FROM store_items WHERE id = ${id};`;
    }
  },

  // Stock In / Stock Out Logs
  async getStockLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/stock/logs`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return await sql`SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 500;`;
    }
  },

  async recordStockIn(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/stock/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const logId = `log-in-${Date.now()}`;
      const qtyVal = parseFloat(payload.qty) || 1;
      const priceVal = parseFloat(payload.unit_price) || 0;
      const discVal = parseFloat(payload.discount_amount) || 0;
      const total = Math.max(0, qtyVal * priceVal - discVal);

      const log = await sql`
        INSERT INTO usage_logs (
          id, type, item_id, item_name, item_code,
          qty_used, unit_price, discount_amount, line_total,
          used_by, department, time
        ) VALUES (
          ${logId}, 'Stock In', ${payload.item_id}, ${payload.item_name}, ${payload.item_code || 'N/A'},
          ${qtyVal}, ${priceVal}, ${discVal}, ${total},
          ${payload.vendor || 'Vendor'}, 'Main Store', NOW()::TEXT
        ) RETURNING *;
      `;

      if (payload.item_id) {
        await sql`
          UPDATE store_items
          SET remaining_stock = remaining_stock + ${qtyVal},
              current_stock = current_stock + ${qtyVal},
              updated_at = NOW()
          WHERE id = ${payload.item_id};
        `;
      }
      return { success: true, log: log[0] };
    }
  },

  // Machine Repairs
  async getRepairs() {
    try {
      const res = await fetch(`${API_BASE_URL}/repairs`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return await sql`SELECT * FROM machine_repairs ORDER BY created_at DESC;`;
    }
  },

  async saveRepair(repair) {
    try {
      const res = await fetch(`${API_BASE_URL}/repairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repair)
      });
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const repNo = repair.repair_no || repair.repairNo || `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const saved = await sql`
        INSERT INTO machine_repairs (
          id, repair_no, customer_name, customer_phone, city_address,
          machine_name, serial_no, fault_description, parts_cost,
          labor_cost, discount_amount, total_cost, paid_amount,
          balance_amount, repair_status, received_date, promised_date,
          repair_items, created_at
        ) VALUES (
          ${repair.id}, ${repNo}, ${repair.customer_name || repair.customerName},
          ${repair.customer_phone || repair.customerPhone || 'N/A'}, ${repair.city_address || repair.cityAddress || 'Lahore'},
          ${repair.machine_name || repair.machineName || 'Lawn Mower'}, ${repair.serial_no || repair.serialNo || 'N/A'},
          ${repair.fault_description || repair.faultDescription || 'General Overhaul'},
          ${repair.parts_cost || repair.partsCost || 0}, ${repair.labor_cost || repair.laborCost || 0},
          ${repair.discount_amount || repair.discountAmount || 0}, ${repair.total_cost || repair.totalCost || 0},
          ${repair.paid_amount || repair.paidAmount || 0}, ${repair.balance_amount || repair.balanceAmount || 0},
          ${repair.repair_status || repair.repairStatus || 'Received'},
          ${repair.received_date || repair.receivedDate || new Date().toLocaleDateString('en-GB')},
          ${repair.promised_date || repair.promisedDate || '1-2 Days'},
          ${JSON.stringify(repair.repair_items || repair.repairItems || [])}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          city_address = EXCLUDED.city_address,
          repair_status = EXCLUDED.repair_status,
          paid_amount = EXCLUDED.paid_amount,
          balance_amount = EXCLUDED.balance_amount
        RETURNING *;
      `;
      return saved[0];
    }
  },

  async deleteRepair(id) {
    try {
      await fetch(`${API_BASE_URL}/repairs/${id}`, { method: 'DELETE' });
    } catch {
      await sql`DELETE FROM machine_repairs WHERE id = ${id};`;
    }
  },

  // Machine Sales
  async getSales() {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return await sql`SELECT * FROM machine_sales ORDER BY created_at DESC;`;
    }
  },

  async saveSale(sale) {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const sNo = sale.sale_no || sale.saleNo || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const saved = await sql`
        INSERT INTO machine_sales (
          id, sale_no, customer_name, customer_phone, city_address,
          machine_name, serial_no, qty, unit_price, discount_amount,
          line_total, paid_amount, balance_amount, payment_status,
          time, items, created_at
        ) VALUES (
          ${sale.id}, ${sNo}, ${sale.customer_name || sale.customerName},
          ${sale.customer_phone || sale.customerPhone || 'N/A'}, ${sale.city_address || sale.cityAddress || 'Lahore'},
          ${sale.machine_name || sale.machineName || 'Lawn Mower'}, ${sale.serial_no || sale.serialNo || 'N/A'},
          ${sale.qty || 1}, ${sale.unit_price || sale.unitPrice || 0}, ${sale.discount_amount || sale.discountAmount || 0},
          ${sale.line_total || sale.lineTotal || 0}, ${sale.paid_amount || sale.paidAmount || 0},
          ${sale.balance_amount || sale.balanceAmount || 0}, ${sale.payment_status || sale.paymentStatus || 'Paid'},
          NOW()::TEXT, ${JSON.stringify(sale.items || [])}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          paid_amount = EXCLUDED.paid_amount,
          balance_amount = EXCLUDED.balance_amount
        RETURNING *;
      `;
      return saved[0];
    }
  },

  // Vendors
  async getVendors() {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return await sql`SELECT * FROM vendors ORDER BY name ASC;`;
    }
  },

  // Analytics
  async getAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/analytics`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      return null;
    }
  }
};

export default backendApi;
