import express from 'express';
import { sql } from '../db.js';

const router = express.Router();

// Ensure users table exists
async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Operator',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
ensureUsersTable().catch(console.error);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await sql`SELECT * FROM users WHERE LOWER(email) = ${cleanEmail};`;

    if (users.length === 0) {
      // Default admin fallback if not yet in db
      if (cleanEmail === 'admin@rehmat.com' && password === 'admin123') {
        return res.json({
          user: {
            id: 'admin-1',
            name: 'Super Admin',
            email: 'admin@rehmat.com',
            role: 'Super Admin'
          },
          token: 'jwt-rehmat-admin-token'
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: `jwt-token-${user.id}`
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC;`;
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/auth/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const id = `user-${Date.now()}`;
    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES (${id}, ${name}, ${email.toLowerCase()}, ${password || '123456'}, ${role || 'Operator'})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role;
    `;
    res.json({ id, name, email, role });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
