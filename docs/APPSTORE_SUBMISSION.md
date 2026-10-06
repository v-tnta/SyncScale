# App Store Connect 提出情報（iOS / SyncScale）

対象バージョン: **1.0.0 (build 6)** / Bundle ID: **com.v-tnta.syncscale** / Team ID: **QFTQ5ALH6N** / 対応デバイス: **iPhone のみ**
最終更新: 2026-10-07

---

## 0. 提出前に片付けるべき項目（審査リスク順）

| # | 項目 | 状態 | 対応 |
|---|------|------|------|
| 1 | **Sign in with Apple**（ガイドライン 4.8） | ✅ 実装済み | `sign_in_with_apple 8.2.0` + Firebase Auth。ログイン画面で Googleサインインの上に同じ高さで表示（iOS のみ）。**残り作業は §2.5 の Firebase Console / Xcode 設定**。 |
| 2 | **アカウント削除**（ガイドライン 5.1.1(v)） | ✅ 実装済み | 設定 →「同意の撤回・アカウント削除」で、本人確認 → Firestore データ削除 → Apple トークン失効 → `currentUser.delete()` までアプリ内で完結。**`consents/{uid}` は研究記録として残す**（`withdrawnAt` を追記。ルールも `delete: false`）。**残り作業は §2.5-1 の Apple 失効用の Firebase Console 設定と実機確認**。 |
| 3 | **審査用デモアカウント** | ⚠️ 要判断 | Sign in with Apple があるため、審査員は自分の Apple ID でサインインできる。資格情報欄を空欄にし、審査メモに明記する方針でも通ることが多いが、弾かれた場合に備えて Email/Password の審査用アカウントを用意しておくと安全。 |
| 4 | **iPad 対応** | ✅ 対応済み | `TARGETED_DEVICE_FAMILY = 1`（iPhone のみ）に変更。ビルド済み `Runner.app` の `UIDeviceFamily` が `[1]` であることを確認済み。iPad 用スクリーンショットは不要。 |
| 5 | `ITSAppUsesNonExemptEncryption` | ✅ 追加済み | Info.plist に `<false/>` を入れると毎回の輸出コンプライアンス質問が消える（HTTPS のみなので免除対象）。 |
| 6 | `PrivacyInfo.xcprivacy`（アプリ本体）未作成 | ⚠️ 推奨 | Pods 側は 19 個あるがアプリターゲットには無い。Required Reason API 未申告で ITMS-91053 警告メールが来る場合がある。 |
| 7 | メタデータに「manaba」を書くか | ⚠️ 注意 | manaba は第三者（朝日ネット）の登録商標。アプリ名・サブタイトル・キーワードには入れず、説明文では「大学の学習管理システム（LMS）」と一般名で記述するのが安全。 |
| 8 | Xcode バージョン | 要確認 | 現在の App Store 提出は Xcode 16 以降（iOS 18 SDK）でのビルドが必須。 |

確認済みでOKなもの:
- アプリアイコン 1024×1024 / アルファチャンネルなし ✅（ITMS-90717 は出ない）
- iOS Deployment Target 15.0 ✅
- 広告SDK・アナリティクスSDKなし（トラッキングなし）✅
- リモートプッシュ未使用（`flutter_local_notifications` によるローカル通知のみ）→ Push Notifications capability は不要 ✅
- `flutter analyze` / `flutter test` / `flutter build ios --no-codesign` / `flutter build web` すべて成功 ✅（2026-09-13）

---

## 1. App 情報（App Information）

| 項目 | 入力値 |
|------|--------|
| プラットフォーム | iOS |
| 名前（30字以内） | `SyncScale｜課題の見積もりと実績` （20字） |
| サブタイトル（30字以内） | `課題をS/M/Lで見積もり、実績と比べる` （20字） |
| SKU | `SYNCSCALE-IOS-0001` |
| Bundle ID | `com.v-tnta.syncscale` |
| プライマリ言語 | 日本語 |
| プライマリカテゴリ | 仕事効率化（Productivity） |
| セカンダリカテゴリ | 教育（Education） |
| 著作権 | `2026 v-tnta` |
| 年齢制限レーティング | 全項目「なし」→ **4+**（暴力・性的表現・ギャンブル・無制限Webアクセスいずれも該当なし） |
| Made for Kids | いいえ |
| コンテンツ権利（第三者コンテンツ） | いいえ |

> 名前を短くしたい場合は `SyncScale` 単体でも可（他アプリと重複していないか App Store Connect の登録時に判定される）。

---

## 2. バージョン情報（1.0.0）

### プロモーションテキスト（170字以内 / 審査なしで後から変更可）

```
締切前の追い込みから抜け出したい人へ。課題をS/M/Lでざっくり見積もり、タイマーで実績を記録。見積もりと実績のズレ、着手の遅れ方をグラフで振り返れます。PC版・Chrome拡張機能とデータ連携。
```

### 説明（Description / 4000字以内）

```
SyncScaleは、大学の課題を「見積もり」と「実績」の両面から記録し、自分の段取りの癖を振り返るためのタスク管理アプリです。

■ こんな悩みに
・いつも締切の直前に慌ててしまう
・「たぶん1時間で終わる」の予想が毎回外れる
・やる気の問題ではなく、段取りの癖を直したい

■ 主な機能

1. S/M/Lの相対見積もり
細かい時間計算をする前に、課題の規模感をS／M／Lの3段階でざっくり決めます。見積もりのハードルを下げることで、着手前に計画する習慣が続きます。

2. タイマーで作業実績を記録
作業を始めるときにタイマーを回すだけ。あとから手入力で作業ログを追加することもできます。記録したログから実績ガントチャートを自動生成します。

3. 時間負債と着手リードタイムの可視化
見積もりと実績のズレ（時間負債）、締切に対してどれくらい早く／遅く着手したか（着手リードタイム）をグラフで確認できます。

4. 締切前のリマインダー通知
課題の締切前に端末内のローカル通知でお知らせします。通知の有無とタイミングは設定から変更できます。

5. カレンダーで締切を俯瞰
週・月単位で締切の偏りを確認し、課題が詰まっている週を前もって把握できます。

6. 完了時のコンディション記録
課題を終えたときの状態を記録しておくと、「どんなときに見積もりが外れるか」が見えてきます。

■ PC版・Chrome拡張機能と連携
同じアカウントでPCのWeb版とデータを共有します。Chrome拡張機能を使うと、大学の学習管理システム（LMS）に並んだ課題名と締切をまとめて取り込めます（拡張機能はPCのChrome用です）。アプリ単体でも課題を手動で登録できます。

■ ご利用にあたって
・ログインにはGoogleアカウントを使用します。
・データはGoogle Firebase上に保存され、ご本人以外はアクセスできません。
・広告および第三者トラッキングは一切ありません。
・本アプリは学生のタスク管理能力・メタ認知に関する研究の一環として提供しており、利用開始時に研究利用への同意を確認します。同意はアプリ内からいつでも撤回でき、撤回時にデータは削除されます。

プライバシーポリシー: https://sync-scale.web.app/privacy/mobile
```

### キーワード（100字以内・カンマ区切り・スペースなし）

```
課題管理,タスク管理,見積もり,時間管理,大学生,レポート,締切,タイマー,ガントチャート,先延ばし,学習記録,メタ認知,自己管理,進捗管理
```
（74字 / 商標「manaba」は意図的に除外）

### URL

| 項目 | 値 | 必須 |
|------|-----|------|
| サポートURL | `https://sync-scale.web.app/guide/` | 必須（本番デプロイ済み・2026-09-13 確認） |
| マーケティングURL | `https://sync-scale.web.app/` | 任意 |
| プライバシーポリシーURL | `https://sync-scale.web.app/privacy/mobile` | 必須（本番デプロイ済み・2026-09-13 確認） |

### このバージョンの新機能（What's New）

初回リリースでは入力不要（初回審査時は非表示）。2回目以降の例:

```
・S/M/Lの相対見積もり、タイマー計測、実績ガントチャートに対応しました
・締切前のリマインダー通知を追加しました
・PC版・Chrome拡張機能とのデータ連携に対応しました
```

1.0.0 で既に公開済みのバージョンがある場合の例:

```
・ダークモードに対応しました。画面右上のボタンで「ライト／ダーク／自動（端末の設定に合わせる）」を切り替えられます
・画面全体のデザインを調整しました
```

---

## 2.5 Sign in with Apple の残り作業

実装済みの内容（2026-09-13）:

| 変更 | ファイル |
|------|----------|
| `sign_in_with_apple 8.2.0` / `crypto 3.0.7` を追加 | `mobile-app/pubspec.yaml` |
| nonce（SHA-256をApple、rawNonceをFirebase）付きの `loginWithApple()`。キャンセルはエラー扱いしない。初回サインイン時に氏名を `displayName` へ反映 | `lib/services/auth_service.dart` |
| `loginWithApple()` と、同一メールが別プロバイダで登録済みの場合（`account-exists-with-different-credential`）の日本語エラー | `lib/state/syncscale_state.dart` |
| ログイン画面に `SignInWithAppleButton`（iOS のみ・Googleボタンと同じ高さ48で上に配置） | `lib/screens/tutorial_screen.dart` |
| `com.apple.developer.applesignin = Default` | `ios/Runner/Runner.entitlements`（新規） |
| `CODE_SIGN_ENTITLEMENTS` を Debug / Release / Profile に設定 | `ios/Runner.xcodeproj/project.pbxproj` |
| 認証情報に Apple ID（メール・氏名・転送用アドレス）を追記 | `web/src/content/pages.js`（`MOBILE_PRIVACY_POLICY`） |

手作業で必要な設定:

1. **Firebase Console** → Authentication → Sign-in method → **Apple を有効化**
   - サインインだけなら Services ID / Team ID / Key は不要だが、**アカウント削除時の Apple トークン失効
     （`revokeTokenWithAuthorizationCode`）には「Services ID」と「OAuth コードフローの構成」
     （Apple Team ID / Key ID / 秘密鍵）の入力が必要**。
   - Apple Developer → Keys で「Sign in with Apple」を有効にしたキーを作成し、`.p8` の内容を貼り付ける。
   - 未設定でもアカウント削除自体は完了する（失効失敗はログのみ）が、Apple の要件を満たすため設定しておくこと。
2. **Xcode** で `Runner.xcworkspace` を開き、Runner ターゲット → Signing & Capabilities に
   **Sign In with Apple** が入っていることを確認（自動署名で App ID 側にも Capability が登録される）
3. **実機で動作確認**（Sign in with Apple はシミュレータでも動くが、実機確認が確実）
4. **プライバシーポリシーを再デプロイ** — `web/src/content/pages.js` を変更したため、
   `https://sync-scale.web.app/privacy/mobile` に Apple の記述を反映させるには web のビルド＆デプロイが必要
5. Google と Apple で同じメールアドレスを使うと `account-exists-with-different-credential` になる。
   Firebase Console の「メールアドレスごとに1つのアカウント」設定を変えない方針なら、
   現在の日本語エラーメッセージのままで可

## 3. スクリーンショット

| デバイス | 解像度（縦） | 必須 | 撮る画面（推奨） |
|----------|--------------|------|------------------|
| iPhone 6.5インチ | 1284×2778 または 1242×2688 | **必須**（6.9インチを出さない場合の必須枠） | ①ホーム（タスク一覧）②S/M/L見積もりダイアログ ③タイマー計測中 ④分析（時間負債・着手リードタイム）⑤カレンダー |

- Apple の仕様上、iPhone のスクリーンショットは **6.9インチ（1320×2868 / 1290×2796）が第一の枠**だが、6.9インチを登録しない場合は **6.5インチが必須枠**になり、6.9インチ表示には 6.5インチ画像が自動でスケールされる。6.5インチのみで提出可。
- 6.5インチのシミュレータ: **iPhone 14 Plus / iPhone 13 Pro Max**（1284×2778）、**iPhone 11 Pro Max / XS Max**（1242×2688）。
  `xcrun simctl io booted screenshot ~/Desktop/01.png` で等倍のまま撮れる。
- 各サイズ最大10枚、最低1枚。iPad は非対応にしたため iPad 用スクリーンショットは不要。
- App Preview（動画）は任意。

## 4. App Privacy（プライバシー質問への回答）

**トラッキング**: 行っていない（第三者広告・アナリティクスSDKなし）→ `App Tracking Transparency` 不要。

収集するデータ（すべて「トラッキングには使用しない」「ユーザーIDに紐付く=Linked to You」）:

| データ種別 | App Store Connect の分類 | 用途 | 実体 |
|-----------|--------------------------|------|------|
| メールアドレス | Contact Info → Email Address | アプリの機能（App Functionality） | Googleサインイン / Sign in with Apple のアカウント識別（Appleでメール非公開を選んだ場合は転送用アドレス） |
| 氏名 | Contact Info → Name | アプリの機能 | Sign in with Apple の氏名（設定画面の表示名に使用） |
| ユーザーID | Identifiers → User ID | アプリの機能 | Firebase Auth UID |
| ユーザーコンテンツ | User Content → Other User Content | アプリの機能 | 課題名・科目名・締切・作業ログ・コンディション記録（`tasks` / `timeLogs` / `conditionLogs`） |
| 使用状況データ | Usage Data → Product Interaction | アプリの機能 / 分析（Analytics） | `activityLogs`（研究用の利用状況ログ） |

- いずれも「第三者広告」「マーケティング」目的には使用しない。
- 「データを削除する手段の提供」→ あり（設定 →「同意の撤回・アカウント削除」。Auth アカウントまで削除。研究倫理上の記録として `consents/{uid}` の同意・撤回日時と同意書バージョンのみ保持）。

---

## 5. 輸出コンプライアンス（Export Compliance）

- 暗号化の使用: **標準的な暗号化（HTTPS/TLS）のみ** → 免除対象。
- 毎回の質問を省略するには `mobile-app/ios/Runner/Info.plist` に追記:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

---

## 6. App Review Information（審査メモ）

| 項目 | 入力値 |
|------|--------|
| サインイン要否 | 必須（Sign-in required） |
| デモアカウント | 原則不要（Sign in with Apple で審査員自身の Apple ID が使える）。Googleサインイン確認用に用意する場合は §0-3 |
| 連絡先 | 氏名 / 電話番号 / `yosga.org@gmail.com` |

### 審査メモ本文（コピペ用）

```
SyncScaleは、大学生が課題の所要時間の見積もりと実績のズレを振り返るための学習支援アプリです。学生のタスク管理能力・メタ認知に関する研究の一環として開発しています（医療・健康に関する研究ではありません）。

■ ログインについて
ログイン手段は「Sign in with Apple」と「Googleサインイン」の2種類です。
審査ではログイン画面上部の「Appleでサインイン」から、審査員ご自身のApple IDでサインインいただけます。
（Googleサインインでの確認をご希望の場合は、以下の審査用アカウントをご利用ください）
  メールアドレス: （必要な場合のみ記入）
  パスワード: （必要な場合のみ記入）

■ 起動後の流れ
1. Googleサインイン
2. 研究利用への同意画面（同意すると利用開始）
3. チュートリアルを閉じるとホーム画面が表示されます
4. 右下のボタンから課題を登録し、S/M/Lの規模見積もり → タイマー計測 → 完了時のコンディション入力、という順に試せます
5. 分析タブで「時間負債」「着手リードタイム」、カレンダータブで締切の分布を確認できます

■ 通知について
締切前のリマインダーは端末内のローカル通知のみで、リモートプッシュ通知は使用していません。

■ Chrome拡張機能との連携について
PCのChrome拡張機能で大学の学習管理システムから課題と締切を取り込めますが、本アプリ単体でも課題の手動登録ですべての機能を利用できます。審査にあたって拡張機能のインストールは不要です。

■ アカウントの削除
画面右上の設定 →「同意の撤回・アカウント削除」から、アプリ内でアカウントと全データを削除できます（2段階の確認と本人確認の後、ログイン用アカウントも削除されます）。研究倫理上の記録として、同意・撤回の日時のみ保持します。
```

---

## 7. ビルドとアップロード手順

```bash
cd mobile-app

# .env（Firebase設定）が存在することを確認。アセットとして同梱される
ls -la .env

flutter clean
flutter pub get
cd ios && pod install && cd ..

# バージョンは pubspec.yaml の version: 0.4.1+2 を使用
flutter build ipa --release

# → build/ios/ipa/*.ipa
# Transporter.app にドラッグ、または Xcode Organizer から Distribute App → App Store Connect
```

- `xcrun altool` の代わりに `xcrun notarytool` ではなく **Transporter** か Xcode Organizer を使うのが確実。
- ビルド番号（`+2`）は同一バージョン内で再アップロードするたびに増やす（0.4.1+3, +4 …）。
- アップロード後、App Store Connect でビルドが「処理中」→「使用可能」になるまで5〜30分程度。
- 事前に App Store Connect でアプリレコード（§1 の内容）を作成しておくこと。Bundle ID は Xcode の自動署名で Developer Portal に登録済みのはず。

---

## 8. リリース前チェックリスト

- [x] Sign in with Apple を実装（§2.5）
- [ ] Firebase Console で Apple プロバイダを有効化（§2.5-1）
- [ ] Xcode で Sign In with Apple の Capability を確認（§2.5-2）
- [ ] 実機で Sign in with Apple を動作確認（§2.5-3）
- [ ] プライバシーポリシー（Apple 追記分）を web ビルド＆デプロイ（§2.5-4）
- [x] アカウント削除（Firebase Auth ユーザー削除 + Apple トークン失効）を実装（§0-2）
- [ ] Firebase Console の Apple プロバイダに Services ID / Team ID / Key ID / 秘密鍵を設定（§2.5-1・トークン失効用）
- [ ] 実機で Apple / Google それぞれアカウント削除を確認（Firebase Console の Authentication からユーザーが消え、`consents/{uid}` に `withdrawnAt` が残ること）
- [x] iPad 非対応に変更（`TARGETED_DEVICE_FAMILY = 1`）
- [x] `ITSAppUsesNonExemptEncryption` を Info.plist に追加（§0-5）
- [ ] `PrivacyInfo.xcprivacy` を追加（§0-6）
- [ ] iPhone 6.5インチのスクリーンショットを5枚撮影（1284×2778）
- [x] プライバシーポリシー `https://sync-scale.web.app/privacy/mobile` 本番デプロイ済み（2026-09-13 確認 / Apple 追記分は再デプロイ待ち）
- [x] サポートURL `https://sync-scale.web.app/guide/` 本番デプロイ済み（2026-09-13 確認）
- [ ] App Store Connect でアプリレコードを作成し、§1・§2 の値を入力
- [ ] App Privacy の質問に回答（§4）
- [ ] `flutter build ipa` → Transporter でアップロード
- [ ] 審査に提出
