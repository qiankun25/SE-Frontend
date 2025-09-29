import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',  // 绑定到所有网卡
    port: 5173,
    strictPort: true,
    open: false,
    allowedHosts: [
      '114ga3075zc97.vicp.fun',//花生壳域名
      'localhost',
      '100.80.33.143'
    ],
    
    proxy: {
      '/api': {
        target: 'http://100.80.33.143:8000',  // 后端服务地址
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('代理请求:', path);
          return path;
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
