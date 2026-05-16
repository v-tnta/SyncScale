import { defineManifest } from '@crxjs/vite-plugin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineManifest({
  manifest_version: 3,
  name: "SyncScale - manaba課題取得",
  version: "0.1.1",
  key: process.env.VITE_EXTENSION_KEY,
  description: "manabaから課題と〆切を自動取得し、SyncScaleに登録します",
  permissions: [
    "activeTab",
    "storage",
    "identity"
  ],
  oauth2: {
    client_id: process.env.VITE_OAUTH_CLIENT_ID,
    scopes: ["profile", "email", "openid"]
  },
  host_permissions: [
    "https://*.manaba.jp/*",
    "https://manaba.ibaraki.ac.jp/*",
    "https://*.firebaseapp.com/*",
    "https://*.firebaseio.com/*",
    "https://www.googleapis.com/*"
  ],
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
    }
  ],
  action: {
    default_popup: "src/popup/popup.html",
    default_icon: {
      "16": "icons/logo.svg",
      "48": "icons/logo.svg",
      "128": "icons/logo.svg"
    }
  },
  icons: {
    "16": "icons/logo.svg",
    "48": "icons/logo.svg",
    "128": "icons/logo.svg"
  }
});
