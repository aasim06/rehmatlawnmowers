import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/vendors - Get all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await sql`SELECT * FROM vendors ORDER BY name ASC;`;
    res.json(vendors);
  } catch (err) {
    console.error('Fetch vendors error:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/vendors - Create/update vendor
router.post('/', async (req, res) => {
  try {
    const {
      id = `vnd-${Date.now()}`,
      name,
      company_name,
      phone = 'N/A',
      email = 'N/A',
      city_address = 'Lahore',
      opening_balance = 0,
      balance_type = 'Payable',
      current_balance = 0
    } = req.body;

    const saved = await sql`
      INSERT INTO vendors (
        id, name, company_name, phone, email,
        city_address, opening_balance, balance_type,
        current_balance, created_at
      ) VALUES (
        ${id}, ${name}, ${company_name || name}, ${phone}, ${email},
        ${city_address}, ${opening_balance}, ${balance_type},
        ${current_balance || opening_balance}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        city_address = EXCLUDED.city_address,
        current_balance = EXCLUDED.current_balance
      RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save vendor error:', err);
    res.status(500).json({ error: 'Failed to save vendor' });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM vendors WHERE id = ${id};`;
    res.json({ success: true, message: `Vendor ${id} deleted` });
  } catch (err) {
    console.error('Delete vendor error:', err);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// POST /api/vendors/payments - Record vendor payment
router.post('/payments', async (req, res) => {
  try {
    const {
      id = `vp-${Date.now()}`,
      vendor_name,
      payment_date = new Date().toLocaleDateString('en-GB'),
      amount_paid = 0,
      payment_method = 'Cash',
      reference_no = 'N/A',
      notes = ''
    } = req.body;

    const saved = await sql`
      INSERT INTO vendor_payments (
        id, vendor_name, payment_date, amount_paid,
        payment_method, reference_no, notes, created_at
      ) VALUES (
        ${id}, ${vendor_name}, ${payment_date}, ${amount_paid},
        ${payment_method}, ${reference_no}, ${notes}, NOW()
      ) RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save vendor payment error:', err);
    res.status(500).json({ error: 'Failed to record vendor payment' });
  }
});

export default router;
