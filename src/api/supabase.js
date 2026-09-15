import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wccshfafnuzitcuppgsj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rExPvTrljQ8Pr3xLMWyAWA_hou9bgu7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
