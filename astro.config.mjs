// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://swadhin.cv/',
  output: 'server', // Enable SSR for admin routes and API endpoints
  adapter: cloudflare({
    imageService: 'cloudflare',
  }),
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __dirname: '""',
    },
    ssr: {
      external: ['chartjs-node-canvas', 'canvas', 'node:fs', 'node:path', 'node:crypto', 'crypto', 'fs', 'path'],
    },
    optimizeDeps: {
      exclude: ['chartjs-node-canvas', 'canvas']
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
    },
  },
});
