import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 修改 export default 變成一個函數，這樣才能讀取 mode (環境變數)
export default defineConfig(({ mode }) => {
  // 1. 載入環境變數
  // process.cwd() 是專案根目錄
  const env = loadEnv(mode, process.cwd(), '')

  // 2. 決定目標網址 (優先讀取 .env，如果沒有就用本地 8080)
  const targetUrl = env.VITE_API_TARGET || 'http://127.0.0.1:8080'

  console.log(`🚀 目前前端代理目標: ${targetUrl}`) // 啟動時會印在終端機給你看

  return {
    plugins: [vue()],
    server: {
      proxy: {
        // API 請求代理
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          secure: false, // 設為 false 以兼容 http 和 https
        },
        // 認證請求代理
        '/auth': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
        },
        // 如果你有 acc-backup 靜態檔
        '/acc-backup': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})