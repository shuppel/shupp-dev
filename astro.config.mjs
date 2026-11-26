// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import remarkDropEditorNotes from './src/lib/markdown/remark-drop-editor-notes.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://shupp.dev',
  integrations: [react(), sitemap()],
  markdown: { remarkPlugins: [remarkDropEditorNotes] },
});