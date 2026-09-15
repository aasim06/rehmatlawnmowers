import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// GET /api/items - Get all store inventory items
router.get('/', async (req, res) => {
  try {
    const items = await sql`SELECT * FROM store_items ORDER BY name ASC;`;
    res.json(items);
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// POST /api/items - Create or upsert inventory item
router.post('/', async (req, res) => {
  try {
    const {
      id = `item-${Date.now()}`,
      name,
      sku_code = 'N/A',
      category = 'General',
      unit = 'PCS',
      current_stock = 0,
      remaining_stock = 0,
      unit_price = 0,
      min_threshold = 10,
      location = 'Main Store'
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const inserted = await sql`
      INSERT INTO store_items (
        id, name, sku_code, category, unit,
        current_stock, remaining_stock, unit_price,
        min_threshold, location, updated_at
      ) VALUES (
        ${id}, ${name}, ${sku_code}, ${category}, ${unit},
        ${current_stock}, ${remaining_stock || current_stock}, ${unit_price},
        ${min_threshold}, ${location}, NOW()
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

    res.json(inserted[0]);
  } catch (err) {
    console.error('Save item error:', err);
    res.status(500).json({ error: 'Failed to save inventory item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM store_items WHERE id = ${id};`;
    res.json({ success: true, message: `Item ${id} deleted` });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET /api/items/master-catalog
router.get('/master-catalog', async (req, res) => {
  try {
    const catalog = await sql`SELECT * FROM master_item_names ORDER BY name ASC;`;
    res.json(catalog);
  } catch (err) {
    console.error('Fetch master catalog error:', err);
    res.status(500).json({ error: 'Failed to fetch master items' });
  }
});

// POST /api/items/master-catalog
router.post('/master-catalog', async (req, res) => {
  try {
    const { name, category = 'General' } = req.body;
    const id = `mst-${Date.now()}`;
    const inserted = await sql`
      INSERT INTO master_item_names (id, name, category)
      VALUES (${id}, ${name}, ${category})
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `;
    res.json(inserted[0] || { id, name, category });
  } catch (err) {
    console.error('Save master item error:', err);
    res.status(500).json({ error: 'Failed to save master item' });
  }
});

export default router;
