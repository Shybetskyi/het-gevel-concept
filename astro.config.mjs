// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { FontaineTransform } from 'fontaine';

// https://astro.build/config
export default defineConfig({
  site: 'https://hetgevelconcept.nl',

  output: 'server',
  adapter: vercel(),

  vite: {
    plugins: [
      tailwindcss(),
      FontaineTransform.vite({
        fallbacks: ['Arial', 'Helvetica Neue', 'sans-serif'],
      }),
    ]
  },

  integrations: [sitemap()]
});