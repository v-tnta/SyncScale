import { defineManifest } from '@crxjs/vite-plugin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineManifest({
  "manifest_version": 3,
  "name": "SyncScale - manaba課題取得",
  "version": "1.2.0",
  "description": "manabaから課題と〆切を自動取得し、SyncScaleに登録します",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "notifications"
  ],
  "host_permissions": [
    "https://*.manaba.jp/*",
    "https://*.ac.jp/*",
    "https://sync-scale.web.app/*",
    "http://localhost:5173/*"
  ],
  "options_page": "src/options/options.html",
  background: {
    service_worker: "src/background/background.js",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "https://*.manaba.jp/*",
        "https://manaba.ibaraki.ac.jp/*"
      ],
      js: ["src/content/content.js"],
      run_at: "document_idle"
    },
    {
      matches: [
        "https://sync-scale.web.app/*"
      ],
      js: ["src/content/web-content.js"],
      run_at: "document_idle"
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "icons/logo.png",
      "48": "icons/logo.png",
      "128": "icons/logo.png"
    }
  },
  "icons": {
    "16": "icons/logo.png",
    "48": "icons/logo.png",
    "128": "icons/logo.png"
  }
})