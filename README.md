# SyncScale — 相対見積もりを用いた、学生向けタスク管理能力認知支援ツール

学生が「時間見積もりの甘さ」や「先延ばしの癖」を客観的に自覚し、メタ認知能力とタスク管理能力を向上させるためのシステムです。

## 📦 プロジェクト構成

本リポジトリは、3つの制作物と共通ドキュメントで構成されたモノレポです。

```
SyncScalePJ/
├── web/                  # PCのWebアプリ (React + Vite + Firebase)
├── chrome-extension/     # Chrome拡張機能 (Manifest V3)
├── mobile-app/           # スマートフォンアプリ (Flutter)
└── docs/                 # 共通ドキュメント (concept.md)
```

### 🌐 web/ — PCのWebアプリ
- **技術**: React, Vite, Tailwind CSS, Firebase (Firestore + Auth)
- **役割**: タスク管理、時間負債ダッシュボード、着手リードタイム分析、積み上げ式ガントチャート
- **設計書**: [web/docs/SystemDesign-v2.md](web/docs/SystemDesign-v2.md)

### 🔌 chrome-extension/ — Chrome拡張機能
- **技術**: Chrome Extension Manifest V3, Firebase
- **役割**: LMS（manaba等）から課題・〆切を自動取得し、Firestoreへ登録
- **設計書**: [chrome-extension/docs/SystemDesign.md](chrome-extension/docs/SystemDesign.md)

### 📱 mobile-app/ — スマートフォンアプリ
- **技術**: Flutter (Dart), Firebase
- **役割**: 相対見積もり（S/M/L）、タイマー計測、コンディション入力
- **設計書**: [mobile-app/docs/SystemDesign.md](mobile-app/docs/SystemDesign.md)

## 🔗 システム連携

3つの制作物は **Firebase（Firestore + Auth）** を Single Source of Truth として共有し、同一ユーザー・同一データで連携します。

| Step | 手法 | 担当 |
|------|------|------|
| 1. 自動収集 | LMSから課題・〆切を自動取得 | Chrome拡張機能 |
| 2. 相対見積もり | S/M/L ラベリング | スマートフォンアプリ |
| 3. 計測と振り返り | タイマー計測・コンディション入力 | スマートフォンアプリ |
| 4. データの可視化 | ダッシュボードで分析 | PCのWebアプリ |

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

- [コンセプト](docs/concept.md) — プロジェクト全体の動機・目的・手法
# SyncScale
