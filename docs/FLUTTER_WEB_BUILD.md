# Flutter WebのビルドとWebアプリへの統合手順

本プロジェクトでは、モバイルアプリ（Flutter）をWeb向けにビルドし、PC向けWebアプリ（React）のホスティング配下（`web/public/svc/mobile/`）にコピーすることで、Webアプリ経由でモバイル版の画面にアクセスできるようにしています。

---

## 🛠️ 前提条件
- **Flutter SDK** がインストールされており、ターミナルで `flutter` コマンドが使用できること。
  - ※自動スクリプトは、PATH上に `flutter` がない場合、`C:\Users\Kota\development\flutter` などの一般的なパスを自動探索してビルドを実行します。

---

## 🚀 実行方法（自動スクリプト）

OSに依存せず、コマンド一発で「依存関係の解決」「Flutterのビルド」「Reactのpublic/svcディレクトリへのコピー」を自動で行うスクリプトを用意しています。

ルートディレクトリで以下のコマンドを実行してください：

```bash
npm run build:mobile-web
```

---

## ✍️ 手動で実行する場合の手順

もし自動スクリプトを使用せず、手動でコマンドを実行してビルド・コピーを行う場合は、以下の手順に従ってください。

### 1. Flutterのセットアップとビルド
`mobile-app` ディレクトリへ移動し、依存関係の取得とビルドを行います。

```bash
cd mobile-app
flutter pub get

# .env ファイルに記載されたAPIキーとAppIDをビルド時に埋め込みます
flutter build web --release --base-href "/svc/mobile/" --dart-define=FIREBASE_API_KEY_WEB="あなたのAPIキー" --dart-define=FIREBASE_APP_ID_WEB="あなたのAppID"
```
※ ビルドされた成果物は `mobile-app/build/web/` に出力されます。

### 2. Webアプリへのコピー
ビルド成果物を React の `web/public/svc/mobile/` ディレクトリにコピーします。

#### 💻 Windows (PowerShell) の場合:
```powershell
# 古いキャッシュを削除
Remove-Item -Recurse -Force ../web/public/svc/mobile/*

# ビルド成果物をコピー
Copy-Item -Recurse -Force build/web/* ../web/public/svc/mobile/
```

#### 🍎 Mac / Linux の場合:
```bash
# 古いキャッシュを削除し、コピー
rm -rf ../web/public/svc/mobile/*
cp -r build/web/* ../web/public/svc/mobile/
```

---

## 🔗 動作確認
コピーが完了した後、ReactのWebアプリを起動します。

```bash
cd web
npm run dev
```

ブラウザで `http://localhost:5173/svc/mobile/` にアクセスし、Flutter版の画面が表示されることを確認してください。
