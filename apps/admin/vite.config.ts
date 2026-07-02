import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    // importStyle: false → resolver 不再给每个组件单独注入 css chunk
    // 改在 main.ts 里一次性 import 'element-plus/dist/index.css' 引整包
    // 否则 dev 模式每个 <el-xxx> 都会发起独立 css 请求,Commands 这种页要拉 60+ 文件
    AutoImport({ resolvers: [ElementPlusResolver({ importStyle: false })] }),
    Components({ resolvers: [ElementPlusResolver({ importStyle: false })] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // ⚡ 关键优化:让 Vite 把 element-plus 整包预打成 1 个 chunk
  // 否则 dev 模式下按需加载会拆成 70+ 个 JS/CSS,浏览器主线程被海量请求卡死。
  // 改完这条后第一次重启会重新跑 optimize(约 5-10s),后续启动秒开。
  optimizeDeps: {
    // zh-cn locale 是独立子路径导入,不列进来会触发 dev 中途 re-optimization(运行时 chunk 混载报错)
    include: ['element-plus', 'element-plus/es/locale/lang/zh-cn', '@element-plus/icons-vue', 'axios', 'echarts', 'vue-echarts'],
  },
  server: {
    port: 5183,
    host: '0.0.0.0',
    proxy: {
      // 后台调 API 的开发代理,生产环境前端站和 API 同域
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // 后端 P8-3 文件上传后返回的 /uploads/... URL,代理到后端静态资源
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
