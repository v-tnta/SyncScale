# SyncScale Mobile

Flutter版のSyncScale mobileAppです。webAppと同じFirebase/Firestore schemaを使い、タスク、S/M/L見積もり、タイマー、作業ログ、完了時コンディション、カレンダー、分析をモバイルから扱えます。

## セットアップ

`mobile-app/.env` にFirebase設定を置きます。値はルートの `.env` と同じ `VITE_FIREBASE_*` キーをそのまま利用します。

```bash
cp ../.env .env
flutter pub get
flutter run
```

`.env` はgitignore済みです。Flutterアプリに含まれるFirebaseクライアント設定はサーバー秘密鍵ではありませんが、リポジトリには直書きしない方針にしています。

## 確認済み

```bash
flutter analyze
flutter test
flutter build web
flutter build apk --debug
```
