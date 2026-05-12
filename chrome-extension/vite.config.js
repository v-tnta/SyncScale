import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.js';

export default defineConfig({
  plugins: [crx({ manifest })],
  // rollupOptionsはcrxjsが自動でマニフェストから読み取るため、通常は不要です
});
