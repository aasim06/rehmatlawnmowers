import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/customers/payments - Get customer payment ledgers
router.get('/payments', async (req, res) => {
  try {
    const payments = await sql`SELECT * FROM customer_payments ORDER BY created_at DESC;`;
    res.json(payments);
  } catch (err) {
    console.error('Fetch customer payments error:', err);
    res.status(500).json({ error: 'Failed to fetch customer payments' });
  }
});

// POST /api/customers/payments - Record customer payment
router.post('/payments', async (req, res) => {
  try {
    const {
      id = `cp-${Date.now()}`,
      customer_name,
      payment_date = new Date().toLocaleDateString('en-GB'),
      amount_paid = 0,
      payment_method = 'Cash',
      reference_no = 'N/A',
      notes = ''
    } = req.body;

    const saved = await sql`
      INSERT INTO customer_payments (
        id, customer_name, payment_date, amount_paid,
        payment_method, reference_no, notes, created_at
      ) VALUES (
        ${id}, ${customer_name}, ${payment_date}, ${amount_paid},
        ${payment_method}, ${reference_no}, ${notes}, NOW()
      ) RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save customer payment error:', err);
    res.status(500).json({ error: 'Failed to record customer payment' });
  }
});

export default router;
