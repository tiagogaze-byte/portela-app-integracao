import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: '/integracao/',
        server: {
            port: 3001,
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: 'https://hub-api.portela.app',
                    changeOrigin: true,
                    secure: true,
                },
                '/core': {
                    target: 'https://core-api.portela.app',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/core/, '/api')
                }
            }
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        optimizeDeps: {
            include: ['react-leaflet-cluster']
        }
    };
});
