import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.RIVETLY_CONFIG?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window.RIVETLY_CONFIG?.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Supabase URL missing! Please check environment variables or RIVETLY_CONFIG injection.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
