import { sql } from '../server/db.js';

async function createAndSeedExpenses() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        amount NUMERIC DEFAULT 0,
        payment_method TEXT DEFAULT 'Cash',
        paid_to TEXT DEFAULT 'N/A',
        expense_date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const sampleExpenses = [
      { id: 'exp-1', title: 'Daily Workshop Staff Lunch & Tea', category: 'Tea & Refreshment', amount: 1850, payment_method: 'Cash', paid_to: 'Hotel / Mess', expense_date: new Date().toISOString().split('T')[0], notes: '5 workers daily tea & lunch' },
      { id: 'exp-2', title: 'Generator Petrol 5 Litres', category: 'Fuel & Transport', amount: 1450, payment_method: 'Cash', paid_to: 'PSO Petrol Pump', expense_date: new Date().toISOString().split('T')[0], notes: 'Factory generator fuel' },
      { id: 'exp-3', title: 'Lathe Tool Bit & Grinding Discs', category: 'Shop Maintenance', amount: 1200, payment_method: 'Cash', paid_to: 'Hardware Tools Shop', expense_date: new Date().toISOString().split('T')[0], notes: 'For blade sharpness repair tools' },
      { id: 'exp-4', title: 'Electricity Commercial Bill', category: 'Utilities & Bills', amount: 14500, payment_method: 'Bank Transfer', paid_to: 'LESCO', expense_date: new Date().toISOString().split('T')[0], notes: 'Monthly workshop electricity' }
    ];

    for (const exp of sampleExpenses) {
      await sql`
        INSERT INTO expenses (id, title, category, amount, payment_method, paid_to, expense_date, notes)
        VALUES (${exp.id}, ${exp.title}, ${exp.category}, ${exp.amount}, ${exp.payment_method}, ${exp.paid_to}, ${exp.expense_date}, ${exp.notes})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log('✅ Expenses table created & seeded in Neon PostgreSQL!');
  } catch (err) {
    console.error('❌ Error creating/seeding expenses:', err);
  }
}

createAndSeedExpenses();
