import { db } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

/**
 * High-performance hybrid client using Firebase Firestore fallback
 */
export const backendApi = {
  // Items & Catalog
  async getItems() {
    try {
      const res = await fetch(`${API_BASE_URL}/items`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const snap = await getDocs(collection(db, 'store_items'));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return items;
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
      const payload = {
        id: item.id,
        name: item.name,
        sku_code: item.sku_code || item.itemCode || 'N/A',
        category: item.category || 'General',
        unit: item.unit || 'PCS',
        current_stock: item.current_stock || item.totalStock || 0,
        remaining_stock: item.remaining_stock || item.remainingStock || 0,
        unit_price: item.unit_price || item.unitPrice || 0,
        min_threshold: item.min_threshold || item.minLevel || 10,
        location: item.location || item.rackLocation || 'Main Store',
        updated_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'store_items', String(item.id)), payload, { merge: true });
      return payload;
    }
  },

  async deleteItem(id) {
    try {
      await fetch(`${API_BASE_URL}/items/${id}`, { method: 'DELETE' });
    } catch {
      await deleteDoc(doc(db, 'store_items', String(id)));
    }
  },

  // Stock In / Stock Out Logs
  async getStockLogs() {
    try {
      const res = await fetch(`${API_BASE_URL}/stock/logs`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const snap = await getDocs(collection(db, 'usage_logs'));
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.created_at || b.date_iso || 0) - new Date(a.created_at || a.date_iso || 0));
      return logs.slice(0, 500);
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

      const log = {
        id: logId,
        type: 'Stock In',
        item_id: payload.item_id,
        item_name: payload.item_name,
        item_code: payload.item_code || 'N/A',
        qty_used: qtyVal,
        unit_price: priceVal,
        discount_amount: discVal,
        line_total: total,
        used_by: payload.vendor || 'Vendor',
        department: 'Main Store',
        time: new Date().toLocaleString(),
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'usage_logs', logId), log, { merge: true });
      return { success: true, log };
    }
  },

  // Machine Repairs
  async getRepairs() {
    try {
      const res = await fetch(`${API_BASE_URL}/repairs`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const snap = await getDocs(collection(db, 'machine_repairs'));
      const repairs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      repairs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return repairs;
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
      const saved = {
        id: repair.id,
        repair_no: repNo,
        customer_name: repair.customer_name || repair.customerName,
        customer_phone: repair.customer_phone || repair.customerPhone || 'N/A',
        city_address: repair.city_address || repair.cityAddress || 'Lahore',
        machine_name: repair.machine_name || repair.machineName || 'Lawn Mower',
        serial_no: repair.serial_no || repair.serialNo || 'N/A',
        fault_description: repair.fault_description || repair.faultDescription || 'General Overhaul',
        parts_cost: repair.parts_cost || repair.partsCost || 0,
        labor_cost: repair.laborCost || repair.labor_cost || 0,
        discount_amount: repair.discount_amount || repair.discountAmount || 0,
        total_cost: repair.total_cost || repair.totalCost || 0,
        paid_amount: repair.paid_amount || repair.paidAmount || 0,
        balance_amount: repair.balance_amount || repair.balanceAmount || 0,
        repair_status: repair.repair_status || repair.repairStatus || 'Received',
        received_date: repair.received_date || repair.receivedDate || new Date().toLocaleDateString('en-GB'),
        promised_date: repair.promised_date || repair.promisedDate || '1-2 Days',
        repair_items: repair.repair_items || repair.repairItems || [],
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'machine_repairs', String(repair.id)), saved, { merge: true });
      return saved;
    }
  },

  async deleteRepair(id) {
    try {
      await fetch(`${API_BASE_URL}/repairs/${id}`, { method: 'DELETE' });
    } catch {
      await deleteDoc(doc(db, 'machine_repairs', String(id)));
    }
  },

  // Machine Sales
  async getSales() {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const snap = await getDocs(collection(db, 'machine_sales'));
      const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      sales.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return sales;
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
      const saved = {
        id: sale.id,
        sale_no: sNo,
        customer_name: sale.customer_name || sale.customerName,
        customer_phone: sale.customer_phone || sale.customerPhone || 'N/A',
        city_address: sale.city_address || sale.cityAddress || 'Lahore',
        machine_name: sale.machine_name || sale.machineName || 'Lawn Mower',
        serial_no: sale.serial_no || sale.serialNo || 'N/A',
        qty: sale.qty || 1,
        unit_price: sale.unit_price || sale.unitPrice || 0,
        discount_amount: sale.discount_amount || sale.discountAmount || 0,
        line_total: sale.line_total || sale.lineTotal || 0,
        paid_amount: sale.paid_amount || sale.paidAmount || 0,
        balance_amount: sale.balance_amount || sale.balanceAmount || 0,
        payment_status: sale.payment_status || sale.paymentStatus || 'Paid',
        time: new Date().toLocaleString(),
        items: sale.items || [],
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'machine_sales', String(sale.id)), saved, { merge: true });
      return saved;
    }
  },

  // Vendors
  async getVendors() {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors`);
      if (res.ok) return await res.json();
      throw new Error('API offline');
    } catch {
      const snap = await getDocs(collection(db, 'vendors'));
      const vendors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      vendors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return vendors;
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
