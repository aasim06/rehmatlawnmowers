import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/expenses - Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await sql`SELECT * FROM expenses ORDER BY created_at DESC;`;
    res.json(expenses);
  } catch (err) {
    console.error('Fetch expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Add or update expense
router.post('/', async (req, res) => {
  try {
    const {
      id = `exp-${Date.now()}`,
      title,
      category = 'General',
      amount = 0,
      payment_method = 'Cash',
      paid_to = 'N/A',
      expense_date = new Date().toISOString().split('T')[0],
      notes = ''
    } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Title and amount are required' });
    }

    const saved = await sql`
      INSERT INTO expenses (
        id, title, category, amount, payment_method,
        paid_to, expense_date, notes, created_at
      ) VALUES (
        ${id}, ${title}, ${category}, ${parseFloat(amount) || 0}, ${payment_method},
        ${paid_to}, ${expense_date}, ${notes}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        amount = EXCLUDED.amount,
        payment_method = EXCLUDED.payment_method,
        paid_to = EXCLUDED.paid_to,
        expense_date = EXCLUDED.expense_date,
        notes = EXCLUDED.notes
      RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save expense error:', err);
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM expenses WHERE id = ${id};`;
    res.json({ success: true, message: `Expense ${id} deleted` });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
