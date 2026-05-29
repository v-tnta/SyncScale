const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ディレクトリパスの定義
const mobileAppDir = path.join(__dirname, '../mobile-app');
const buildWebDir = path.join(mobileAppDir, 'build/web');
const destDir = path.join(__dirname, '../web/public/svc/mobile');

// flutterコマンドのパス決定
let flutterCmd = 'flutter';

// PATH上で 'flutter' が見つかるかチェック
try {
  const whichCmd = os.platform() === 'win32' ? 'where flutter' : 'which flutter';
  execSync(whichCmd, { stdio: 'ignore' });
} catch (e) {
  // 見つからない場合、よくあるインストール場所を探索
  console.log('⚠️ "flutter" command not found in PATH. Searching default locations...');
  
  const homeDir = os.homedir();
  const potentialPaths = [
    path.join(homeDir, 'development/flutter/bin', os.platform() === 'win32' ? 'flutter.bat' : 'flutter'),
    path.join(homeDir, 'src/flutter/bin', os.platform() === 'win32' ? 'flutter.bat' : 'flutter'),
    path.join('C:/src/flutter/bin', 'flutter.bat'),
    path.join('C:/development/flutter/bin', 'flutter.bat'),
  ];

  let found = false;
  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      flutterCmd = p;
      console.log(`💡 Found flutter at: ${flutterCmd}`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.error('❌ Flutter SDK could not be found. Please install Flutter or add it to your PATH.');
    process.exit(1);
  }
}
// shared/app_config.json からストアURLを取得
let iosStoreUrl = '';
let androidStoreUrl = '';
const sharedConfigPath = path.join(__dirname, '../shared/app_config.json');
if (fs.existsSync(sharedConfigPath)) {
  console.log('📖 Loading shared/app_config.json...');
  try {
    const config = JSON.parse(fs.readFileSync(sharedConfigPath, 'utf-8'));
    iosStoreUrl = config.iosStoreUrl || '';
    androidStoreUrl = config.androidStoreUrl || '';
  } catch (err) {
    console.error('❌ Failed to parse shared/app_config.json:', err.message);
  }
}

// mobile-app/.env から Firebase 関連の値をパースしてビルド時に埋め込む
let apiKeyWeb = '';
let appIdWeb = '';

const mobileEnvPath = path.join(mobileAppDir, '.env');
if (fs.existsSync(mobileEnvPath)) {
  console.log('📖 Parsing mobile-app/.env for Firebase keys...');
  const envContent = fs.readFileSync(mobileEnvPath, 'utf-8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimLine = line.trim();
    if (trimLine.startsWith('FIREBASE_API_KEY_WEB=')) {
      apiKeyWeb = trimLine.split('=')[1].replace(/['"]/g, ''); // クォーテーション除去
    }
    if (trimLine.startsWith('FIREBASE_APP_ID_WEB=')) {
      appIdWeb = trimLine.split('=')[1].replace(/['"]/g, ''); // クォーテーション除去
    }
  }
} else {
  console.warn('⚠️ mobile-app/.env file not found. Building without Firebase environment definitions.');
}

try {
  // 1. Flutter 依存関係の取得
  console.log('📦 Fetching Flutter dependencies...');
  execSync(`"${flutterCmd}" pub get`, { cwd: mobileAppDir, stdio: 'inherit' });

  // 2. Flutter Web ビルドの実行 (環境変数を --dart-define で埋め込む)
  console.log('🚀 Building Flutter Web with Firebase configurations...');
  const buildCmd = `"${flutterCmd}" build web --release --base-href "/svc/mobile/" --dart-define=FIREBASE_API_KEY_WEB="${apiKeyWeb}" --dart-define=FIREBASE_APP_ID_WEB="${appIdWeb}" --dart-define=IOS_STORE_URL="${iosStoreUrl}" --dart-define=ANDROID_STORE_URL="${androidStoreUrl}"`;
  console.log(`Command: ${buildCmd.replace(apiKeyWeb, '***')}`); // ログ上のAPIキーをマスク
  execSync(buildCmd, { cwd: mobileAppDir, stdio: 'inherit' });

  // 3. コピー先のクリーンアップとコピー
  console.log(`📂 Copying build files to React app: ${destDir}`);
  
  if (fs.existsSync(destDir)) {
    console.log('🧹 Cleaning existing mobile directory...');
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  
  // ディレクトリを作成してコピー
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(buildWebDir, destDir, { recursive: true });

  console.log('✨ Flutter Web build and copy completed successfully!');
} catch (error) {
  console.error('❌ Build or copy failed:', error.message);
  process.exit(1);
}
