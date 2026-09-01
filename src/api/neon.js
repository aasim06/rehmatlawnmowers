import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_Ng0x7fKcXkqR@ep-hidden-breeze-ayipbcgl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const databaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NEON_DATABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_NEON_DATABASE_URL) ||
  DEFAULT_NEON_URL;

export const sql = neon(databaseUrl);
export default sql;
