import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // Menonaktifkan session KV otomatis jika tidak menggunakan fitur KV Cloudflare
    imageService: 'compile'
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
