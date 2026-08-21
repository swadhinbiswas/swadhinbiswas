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
// Public pages declare `export const prerender = true` so they're statically
// generated and served from the edge — instant TTFB. The /cat admin and
// /api routes stay on-demand (SSR) so the contact form and CMS work.
export default defineConfig({
  site: 'https://swadhin.cv',
  output: 'server',
  adapter: vercel({
    imageService: true,
    edgeMiddleware: false,
    webAnalytics: { enabled: false },
  }),
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    react({
      include: ['**/components/**'],
    }),
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        return !url.pathname.startsWith('/cat') && !url.pathname.startsWith('/api');
      },
      serialize(item) {
        const url = item.url.replace(/\/$/, '');
        if (url === 'https://swadhin.cv') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (url.includes('/projects') || url.includes('/research') || url.includes('/about') || url.includes('/skills')) {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        }
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),

  ],
  build: {
    inlineStylesheets: 'auto',
    assets: '_a',
  },
  image: {
    // Admin-entered content can reference any https image host; authorize all
    // so Vercel's /_vercel/image optimizer never 400s on a new host.
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss()],
    css: { devSourcemap: false },
    build: { sourcemap: false, cssMinify: 'lightningcss' },
server:{
allowedHosts:true,},
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
