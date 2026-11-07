import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-expect-error — optional dev-only source-tagging plugin
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
    console.info('[vite] vite-source-tags plugin loaded.');
  } catch (err) {
    // Plugin is optional; safe to continue without it
    console.warn('[vite] vite-source-tags plugin not found, skipping:', (err as Error).message);
  }
  return { plugins };
})
