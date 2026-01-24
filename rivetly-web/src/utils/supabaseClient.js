import { createClient } from '@supabase/supabase-js';

// 🚀 直接引用变量，不要做复杂的逻辑判断，方便 Vite 静态替换
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error("Supabase URL is missing! Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
