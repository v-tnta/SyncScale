# SyncScale — 相対見積もりを用いた、学生向けタスク管理能力認知支援ツール

学生が「時間見積もりの甘さ」や「先延ばしの癖」を客観的に自覚し、メタ認知能力とタスク管理能力を向上させるためのシステムです。

## 📦 プロジェクト構成

本リポジトリは、3つの制作物と共通ドキュメントで構成されたモノレポです。

```
SyncScalePJ/
├── web/                  # PCのWebアプリ (React + Vite + Firebase)
├── chrome-extension/     # Chrome拡張機能 (Manifest V3)
├── mobile-app/           # スマートフォンアプリ (Flutter)
└── docs/                 # 共通ドキュメント (systemdesign-v3.md)
```

> **設計書**: 全プロダクトの設計は [docs/systemdesign-v3.md](docs/systemdesign-v3.md) に統合されています（唯一の正典）。

### 🌐 web/ — PCのWebアプリ
- **技術**: React, Vite, Tailwind CSS, Firebase (Firestore + Auth)
- **役割**: タスク管理、相対見積もり（S/M/L）、着手リードタイム分析、積み上げ式ガントチャート

### 🔌 chrome-extension/ — Chrome拡張機能
- **技術**: Chrome Extension Manifest V3
- **役割**: LMS（manaba等）から課題・〆切を自動取得し、Webアプリ経由でFirestoreへ登録

### 📱 mobile-app/ — スマートフォンアプリ
- **技術**: Flutter (Dart), Firebase
- **役割**: 相対見積もり（S/M/L）、タイマー計測、コンディション入力、着手リードタイム分析

## 🔗 システム連携

3つの制作物は **Firebase（Firestore + Auth）** を Single Source of Truth として共有し、同一ユーザー・同一データで連携します。

| Step | 手法 | 担当 |
|------|------|------|
| 1. 自動収集 | LMSから課題・〆切を自動取得 | Chrome拡張機能 |
| 2. 相対見積もり | S/M/L ラベリング | Webアプリ / スマートフォンアプリ |
| 3. 計測と振り返り | タイマー計測・コンディション入力 | Webアプリ / スマートフォンアプリ |
| 4. データの可視化 | 着手リードタイム・実績ガントで分析 | Webアプリ / スマートフォンアプリ |

## ⚙️ Webアプリの環境構築

```bash
cd web
npm install

# .env ファイルを作成（Firebase設定）
cp .env.example .env  # → 値を編集

npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

## 📄 共通ドキュメント

- [システム設計書 v3](docs/systemdesign-v3.md) — コンセプト・全体設計・データ構造・セキュリティの正典
- [Flutter Web ビルド・統合手順](docs/FLUTTER_WEB_BUILD.md) — モバイル版をWeb版に組み込むための手順
# SyncScale
