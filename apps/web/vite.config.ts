import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/leaflet') || id.includes('react-leaflet')) return 'leaflet';
            if (id.includes('node_modules/pdfjs-dist')) return 'pdf';
            if (id.includes('node_modules/xlsx')) return 'xlsx';
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts';
            if (id.includes('node_modules/tesseract')) return 'ocr';
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://openrouter.ai',
          changeOrigin: true,
          rewrite: () => '/api/v1/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.OPENROUTER_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                proxyReq.setHeader('HTTP-Referer', 'http://localhost:5173');
                proxyReq.setHeader('X-Title', 'ServiceCore Help Assistant');
              }
            });
          },
        },
      },
    },
  };
})
