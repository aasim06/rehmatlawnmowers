import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/repairs - Get all machine repair records
router.get('/', async (req, res) => {
  try {
    const repairs = await sql`SELECT * FROM machine_repairs ORDER BY created_at DESC;`;
    res.json(repairs);
  } catch (err) {
    console.error('Fetch repairs error:', err);
    res.status(500).json({ error: 'Failed to fetch repair job cards' });
  }
});

// POST /api/repairs - Create or update repair job card
router.post('/', async (req, res) => {
  try {
    const {
      id = `rep-${Date.now()}`,
      repair_no,
      customer_name,
      customer_phone = 'N/A',
      city_address = 'Lahore',
      machine_name = 'Lawn Mower',
      serial_no = 'N/A',
      fault_description = 'General Overhaul',
      parts_cost = 0,
      labor_cost = 0,
      discount_amount = 0,
      total_cost = 0,
      paid_amount = 0,
      balance_amount = 0,
      repair_status = 'Received',
      received_date = new Date().toLocaleDateString('en-GB'),
      promised_date = '1-2 Days',
      repair_items = []
    } = req.body;

    const repNo = repair_no || `REP-${Math.floor(1000 + Math.random() * 9000)}`;

    const saved = await sql`
      INSERT INTO machine_repairs (
        id, repair_no, customer_name, customer_phone, city_address,
        machine_name, serial_no, fault_description, parts_cost,
        labor_cost, discount_amount, total_cost, paid_amount,
        balance_amount, repair_status, received_date, promised_date,
        repair_items, created_at
      ) VALUES (
        ${id}, ${repNo}, ${customer_name}, ${customer_phone}, ${city_address},
        ${machine_name}, ${serial_no}, ${fault_description}, ${parts_cost},
        ${labor_cost}, ${discount_amount}, ${total_cost}, ${paid_amount},
        ${balance_amount}, ${repair_status}, ${received_date}, ${promised_date},
        ${JSON.stringify(repair_items)}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        repair_no = EXCLUDED.repair_no,
        customer_name = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone,
        city_address = EXCLUDED.city_address,
        machine_name = EXCLUDED.machine_name,
        serial_no = EXCLUDED.serial_no,
        fault_description = EXCLUDED.fault_description,
        parts_cost = EXCLUDED.parts_cost,
        labor_cost = EXCLUDED.labor_cost,
        discount_amount = EXCLUDED.discount_amount,
        total_cost = EXCLUDED.total_cost,
        paid_amount = EXCLUDED.paid_amount,
        balance_amount = EXCLUDED.balance_amount,
        repair_status = EXCLUDED.repair_status,
        received_date = EXCLUDED.received_date,
        promised_date = EXCLUDED.promised_date,
        repair_items = EXCLUDED.repair_items
      RETURNING *;
    `;

    res.json(saved[0]);
  } catch (err) {
    console.error('Save repair error:', err);
    res.status(500).json({ error: 'Failed to save repair job card' });
  }
});

// DELETE /api/repairs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM machine_repairs WHERE id = ${id};`;
    res.json({ success: true, message: `Repair record ${id} deleted` });
  } catch (err) {
    console.error('Delete repair error:', err);
    res.status(500).json({ error: 'Failed to delete repair record' });
  }
});

// GET /api/repairs/models - Machine models catalog
router.get('/models', async (req, res) => {
  try {
    const models = await sql`SELECT * FROM machine_models ORDER BY model_name ASC;`;
    res.json(models);
  } catch (err) {
    console.error('Fetch models error:', err);
    res.status(500).json({ error: 'Failed to fetch machine models' });
  }
});

// POST /api/repairs/models - Add machine model
router.post('/models', async (req, res) => {
  try {
    const { model_name } = req.body;
    const id = `mod-${Date.now()}`;
    const saved = await sql`
      INSERT INTO machine_models (id, model_name)
      VALUES (${id}, ${model_name})
      ON CONFLICT (model_name) DO NOTHING
      RETURNING *;
    `;
    res.json(saved[0] || { id, model_name });
  } catch (err) {
    console.error('Save model error:', err);
    res.status(500).json({ error: 'Failed to save machine model' });
  }
});

export default router;
