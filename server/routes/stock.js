import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/stock/logs - Get all transaction logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await sql`SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 500;`;
    res.json(logs);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction logs' });
  }
});

// POST /api/stock/in - Record Stock In (Vendor Receiving)
router.post('/in', async (req, res) => {
  try {
    const {
      item_id,
      item_name,
      item_code = 'N/A',
      qty = 1,
      unit_price = 0,
      discount_amount = 0,
      vendor = 'Vendor',
      department = 'Main Store'
    } = req.body;

    const qtyVal = parseFloat(qty) || 1;
    const priceVal = parseFloat(unit_price) || 0;
    const discountVal = parseFloat(discount_amount) || 0;
    const lineTotal = Math.max(0, qtyVal * priceVal - discountVal);
    const logId = `log-in-${Date.now()}`;

    // 1. Insert Usage Log
    const log = await sql`
      INSERT INTO usage_logs (
        id, type, item_id, item_name, item_code,
        qty_used, unit_price, discount_amount, line_total,
        used_by, department, time
      ) VALUES (
        ${logId}, 'Stock In', ${item_id}, ${item_name}, ${item_code},
        ${qtyVal}, ${priceVal}, ${discountVal}, ${lineTotal},
        ${vendor}, ${department}, NOW()::TEXT
      ) RETURNING *;
    `;

    // 2. Increment Stock Level in store_items
    if (item_id) {
      await sql`
        UPDATE store_items
        SET
          remaining_stock = remaining_stock + ${qtyVal},
          current_stock = current_stock + ${qtyVal},
          unit_price = ${priceVal > 0 ? priceVal : sql`unit_price`},
          updated_at = NOW()
        WHERE id = ${item_id};
      `;
    }

    res.json({ success: true, log: log[0] });
  } catch (err) {
    console.error('Stock In error:', err);
    res.status(500).json({ error: 'Failed to record stock in' });
  }
});

// POST /api/stock/out - Record Stock Out (Issue Stock)
router.post('/out', async (req, res) => {
  try {
    const {
      item_id,
      item_name,
      item_code = 'N/A',
      qty = 1,
      recipient = 'Customer',
      department = 'Assembly Line'
    } = req.body;

    const qtyVal = parseFloat(qty) || 1;
    const logId = `log-out-${Date.now()}`;

    // 1. Insert Usage Log
    const log = await sql`
      INSERT INTO usage_logs (
        id, type, item_id, item_name, item_code,
        qty_used, unit_price, discount_amount, line_total,
        used_by, department, time
      ) VALUES (
        ${logId}, 'Stock Out', ${item_id}, ${item_name}, ${item_code},
        ${qtyVal}, 0, 0, 0,
        ${recipient}, ${department}, NOW()::TEXT
      ) RETURNING *;
    `;

    // 2. Decrement Stock Level in store_items
    if (item_id) {
      await sql`
        UPDATE store_items
        SET
          remaining_stock = GREATEST(0, remaining_stock - ${qtyVal}),
          updated_at = NOW()
        WHERE id = ${item_id};
      `;
    }

    res.json({ success: true, log: log[0] });
  } catch (err) {
    console.error('Stock Out error:', err);
    res.status(500).json({ error: 'Failed to record stock out' });
  }
});

// DELETE /api/stock/logs/:id
router.delete('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM usage_logs WHERE id = ${id};`;
    res.json({ success: true, message: `Log ${id} deleted` });
  } catch (err) {
    console.error('Delete log error:', err);
    res.status(500).json({ error: 'Failed to delete transaction log' });
  }
});

export default router;
