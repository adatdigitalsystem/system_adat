import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Adapter Vercel menyisakan import "rolldown" di fungsi server; binary native Linux harus ikut terbawa.
const rolldownLinuxBinding = [
  './node_modules/@rolldown/binding-linux-x64-gnu/package.json',
  './node_modules/@rolldown/binding-linux-x64-gnu/rolldown-binding.linux-x64-gnu.node',
].filter((file) => existsSync(file));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({ includeFiles: rolldownLinuxBinding }),
  vite: {
    plugins: [tailwindcss()],
  },
});
