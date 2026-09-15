import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/backup/export - Export entire database state as JSON
router.get('/export', async (req, res) => {
  try {
    const [items, masterCatalog, logs, vendors, sales, repairs, models, custPayments, vndPayments, categories, users] =
      await Promise.all([
        sql`SELECT * FROM store_items;`,
        sql`SELECT * FROM master_item_names;`,
        sql`SELECT * FROM usage_logs;`,
        sql`SELECT * FROM vendors;`,
        sql`SELECT * FROM machine_sales;`,
        sql`SELECT * FROM machine_repairs;`,
        sql`SELECT * FROM machine_models;`,
        sql`SELECT * FROM customer_payments;`,
        sql`SELECT * FROM vendor_payments;`,
        sql`SELECT * FROM categories;`,
        sql`SELECT id, name, email, role, created_at FROM users;`
      ]);

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      store_items: items,
      master_item_names: masterCatalog,
      usage_logs: logs,
      vendors,
      machine_sales: sales,
      machine_repairs: repairs,
      machine_models: models,
      customer_payments: custPayments,
      vendor_payments: vndPayments,
      categories,
      users
    };

    res.json(backupData);
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ error: 'Failed to export backup data' });
  }
});

export default router;
