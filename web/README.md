# SyncScale Web — PCのWebアプリ

SyncScaleシステムの「データの可視化」を担うPCのWebアプリケーションです。

## 主な機能

- ⏱ 高機能タイマー（リアルタイム計測・一時停止・事後報告）
- 📝 タスク管理（ステータス管理・論理削除・時間負債表示）
- 📊 積み上げ式ガントチャート（自動スケーリング）
- 📅 〆切カレンダー
- 📱 レスポンシブデザイン（PC/Mobile対応）

## 技術スタック

- **React** + **Vite** + **Tailwind CSS v4**
- **Firebase** (Firestore + Authentication)
- **レイヤードアーキテクチャ** (Presentation / Application / Infrastructure / Domain)

## 環境構築

```bash
npm install
npm run dev
```

## ディレクトリ構成

```
src/
├── components/    # UIコンポーネント
├── domain/        # エンティティ・ビジネスロジック
├── hooks/         # カスタムフック
├── lib/           # Firebase設定
├── services/      # 外部サービス通信
├── App.jsx
└── main.jsx
```

詳細は [docs/SystemDesign-v2.md](docs/SystemDesign-v2.md) を参照。
