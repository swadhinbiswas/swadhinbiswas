// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://swadhin.cv/',
  output: 'server', // Enable SSR for admin routes and API endpoints
  adapter: vercel({
    imageService: true,
  }),
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react(),
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        return !url.pathname.startsWith('/cat') && !url.pathname.startsWith('/api');
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __dirname: '""',
    },
    css: {
      devSourcemap: false,
    },
    build: {
      sourcemap: false,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-mocha',
    },
  },
});
