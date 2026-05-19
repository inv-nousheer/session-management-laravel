import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
        vue(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,

        origin: 'http://10.5.14.84:5173',

        cors: {
            origin: ['http://10.5.14.84:8000'],
            credentials: true,
        },

        hmr: {
            host: '10.5.14.84',
            protocol: 'ws',
        },

        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});



