import { sql } from '../src/api/neon.js';

async function testFetch() {
  try {
    const items = await sql`SELECT * FROM store_items LIMIT 5;`;
    console.log('Items fetched from Neon:', items);

    const repairs = await sql`SELECT * FROM machine_repairs LIMIT 5;`;
    console.log('Repairs fetched from Neon:', repairs);

    console.log('✅ Neon Connection & Queries working 100% perfectly!');
  } catch (err) {
    console.error('❌ Neon fetch test error:', err);
  }
}

testFetch();
