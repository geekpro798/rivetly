import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `https://vite.dev/config/`
export default defineConfig(({ mode }) => {
  // 根据当前工作目录加载环境变量
  // 第三个参数 '' 表示加载所有以 VITE_ 开头的变量，无论是否在 .env 中
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 🚀 核心：这行代码会在打包时，将代码中所有的 import.meta.env.VITE_XXX
      // 替换为真实的字符串。这样在 Trae 离线环境下也能正常运行。
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_R2_ENDPOINT': JSON.stringify(env.VITE_R2_ENDPOINT),
      'import.meta.env.VITE_R2_ACCESS_KEY_ID': JSON.stringify(env.VITE_R2_ACCESS_KEY_ID),
      'import.meta.env.VITE_R2_SECRET_ACCESS_KEY': JSON.stringify(env.VITE_R2_SECRET_ACCESS_KEY),
    }
  }
})
