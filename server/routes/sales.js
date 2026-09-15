import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/sales - Get all machine sales records
router.get('/', async (req, res) => {
  try {
    const sales = await sql`SELECT * FROM machine_sales ORDER BY created_at DESC;`;
    res.json(sales);
  } catch (err) {
    console.error('Fetch sales error:', err);
    res.status(500).json({ error: 'Failed to fetch sales records' });
  }
});

// POST /api/sales - Create or update machine sale invoice
router.post('/', async (req, res) => {
  try {
    const {
      id = `sale-${Date.now()}`,
      sale_no,
      customer_name,
      customer_phone = 'N/A',
      city_address = 'Lahore',
      machine_name = 'Lawn Mower',
      serial_no = 'N/A',
      qty = 1,
      unit_price = 0,
      discount_amount = 0,
      line_total = 0,
      paid_amount = 0,
      balance_amount = 0,
      payment_status = 'Paid',
      items = []
    } = req.body;

    const sNo = sale_no || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const saved = await sql`
      INSERT INTO machine_sales (
        id, sale_no, customer_name, customer_phone, city_address,
        machine_name, serial_no, qty, unit_price, discount_amount,
        line_total, paid_amount, balance_amount, payment_status,
        time, items, created_at
      ) VALUES (
        ${id}, ${sNo}, ${customer_name}, ${customer_phone}, ${city_address},
        ${machine_name}, ${serial_no}, ${qty}, ${unit_price}, ${discount_amount},
        ${line_total}, ${paid_amount}, ${balance_amount}, ${payment_status},
        NOW()::TEXT, ${JSON.stringify(items)}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        sale_no = EXCLUDED.sale_no,
        customer_name = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone,
        city_address = EXCLUDED.city_address,
        machine_name = EXCLUDED.machine_name,
        serial_no = EXCLUDED.serial_no,
        qty = EXCLUDED.qty,
        unit_price = EXCLUDED.unit_price,
        discount_amount = EXCLUDED.discount_amount,
        line_total = EXCLUDED.line_total,
        paid_amount = EXCLUDED.paid_amount,
        balance_amount = EXCLUDED.balance_amount,
        payment_status = EXCLUDED.payment_status,
        items = EXCLUDED.items
      RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save sale error:', err);
    res.status(500).json({ error: 'Failed to save sales invoice' });
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM machine_sales WHERE id = ${id};`;
    res.json({ success: true, message: `Sale record ${id} deleted` });
  } catch (err) {
    console.error('Delete sale error:', err);
    res.status(500).json({ error: 'Failed to delete sale record' });
  }
});

export default router;
