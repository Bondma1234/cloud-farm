import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  // 把仓库根下的 public/ 作为静态资源目录（会平铺复制到 dist/）
  // _headers、_redirects 等部署配置都放这里
  publicDir: path.resolve(__dirname, 'public'),
  // 相对路径资源引用，保证部署到 Cloudflare Pages / Vercel / 阿里云 OSS 任何静态主机都能跑
  base: './',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 注意：image 从这里移出，改成全局 Vue 组件（main.web.js），
          // 这样浏览器里 <image> 会真正渲染成 <img>，兼容 Taro 语法。
          isCustomElement: tag => ['view','text','scroll-view','video','button'].includes(tag)
        }
      }
    })
  ],
  server: {
    port: 5180,
    host: '0.0.0.0',
    open: false,
    // P4: H5 调用 /api/* 时走 vite proxy 转发到后端
    // 微信小程序模式下不走这条,小程序内置 wx.request 直连(P5+ 适配)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // P8-3 上传后返回的 /uploads/... URL,代理到后端静态资源
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@tarojs/taro': path.resolve(__dirname, 'src/shims/taro.js')
    }
  },
  build: {
    // 输出到 apps/miniapp/dist/，方便部署工具抓取
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    // 小程序/H5 只在现代浏览器跑，不打 legacy
    target: 'es2018',
    rollupOptions: {
      output: {
        // 把 vue/pinia/router 拆出来便于长期缓存
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
});
