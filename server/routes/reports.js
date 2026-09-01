import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/reports/analytics - Live Financial & Inventory Analytics
router.get('/analytics', async (req, res) => {
  try {
    const [items, sales, repairs, logs] = await Promise.all([
      sql`SELECT * FROM store_items;`,
      sql`SELECT * FROM machine_sales;`,
      sql`SELECT * FROM machine_repairs;`,
      sql`SELECT * FROM usage_logs;`
    ]);

    const totalInventoryValue = items.reduce(
      (sum, i) => sum + (parseFloat(i.remaining_stock) || 0) * (parseFloat(i.unit_price) || 0),
      0
    );

    const totalSalesRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.paid_amount) || 0), 0);
    const totalRepairRevenue = repairs.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0);
    const totalRevenue = totalSalesRevenue + totalRepairRevenue;

    const lowStockItems = items.filter(
      (i) => (parseFloat(i.remaining_stock) || 0) <= (parseFloat(i.min_threshold) || 10)
    );

    res.json({
      totalInventoryValue,
      totalRevenue,
      totalSalesRevenue,
      totalRepairRevenue,
      totalItemsCount: items.length,
      totalSalesCount: sales.length,
      totalRepairsCount: repairs.length,
      lowStockCount: lowStockItems.length,
      lowStockItems
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
