import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 显式指定目录加载 .env
  const env = loadEnv(mode, process.cwd(), '');
  
  // 💡 调试用：在终端 build 时会打印出 URL，如果这里显示 undefined，说明 .env 没读到
  console.log('--- Vite Build Env Check ---');
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL);
  
  return {
    plugins: [react()],
    define: {
      // 使用 process.env 对象作为 fallback，确保从 shell 环境也能读到
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_R2_ENDPOINT': JSON.stringify(env.VITE_R2_ENDPOINT || process.env.VITE_R2_ENDPOINT),
      'import.meta.env.VITE_R2_ACCESS_KEY_ID': JSON.stringify(env.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID),
      'import.meta.env.VITE_R2_SECRET_ACCESS_KEY': JSON.stringify(env.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY),
    }
  }
})
