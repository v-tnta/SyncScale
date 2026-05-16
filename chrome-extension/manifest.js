import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: "SyncScale - manaba課題取得",
  version: "0.1.0",
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnRubZ256ryszRScIfGEOeKmFyRI9SO69b8MTA+IBML8DtQBuwELXLa1nmnFIcnkCpyNxncsWxgpUXhIYd1lJMn6xtU4NIT9eBczkjrYx7dLPV05ucLPGurttiUiAn4wJlL6Iji9VgNioxGxBGYJmWx8BX4Gw3g7Q/+lHv5CJ+s4EbsJSQyCnCB1sWR34+BGpaDnf01AWRofvG/uNbRHsNxDSA7FkWRLa34HshsBckokQw1o4mANXILnjTwJW2TDZIGhBPG1iOHbfGlEaa2j77U0+q/xcocgcVsDUS05ObCXbx+gVRlx0RN+udolFaEeu0A0Q/ecmzBncMHOw4cVlWwIDAQAB",
  description: "manabaから課題と〆切を自動取得し、SyncScaleに登録します",
  permissions: [
    "activeTab",
    "storage",
    "identity"
  ],
  oauth2: {
    client_id: "119338239476-bh5f72ove4hbgk3316fraa7f47i3qqt3.apps.googleusercontent.com",
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
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
});
