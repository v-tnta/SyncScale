# SyncScale v2 (Web: ver0.1.4, Ext: v1.1.0) — System Design Document

> **相対見積もりを用いた、学生向けタスク管理能力認知支援ツール**

## 1. コンセプト

### 1.1 解決する課題

学生が抱える「〆切に追われる」心理的負担の根本原因は、**自身の時間見積もり能力の甘さ**と**非効率な段取り**の蓄積にある。
従来のタスク管理ツールは「〆切の管理」を支援するが、**「見積もりと実績の乖離」を可視化する機能は存在しなかった**。

### 1.2 目的

学生が以下の **「自身の癖」** を客観的に自覚し、メタ認知能力とタスク管理能力を向上させる：
- **先延ばし傾向**: タスク規模（S/M/L）ごとの着手リードタイム

### 1.3 アプローチ（4ステップ）

| Step | 手法 | 担当プロダクト |
|------|------|----------------|
| 1. 自動収集 | LMS（manaba等）から課題・〆切を自動取得 | **Chrome拡張機能** |
| 2. 相対見積もり | 課題に対して S/M/L ラベリング | **PCのWebアプリ** |
| 3. 計測と振り返り | タイマーで実働時間を計測、完了時にコンディション入力 | **PCのWebアプリ** |
| 4. データの可視化 | 着手リードタイムをダッシュボードで視覚化 | **PCのWebアプリ** ★今回 |

---

## 2. システム全体像

### 2.1 3つの制作物とデータフロー

```mermaid
graph LR
    subgraph Chrome拡張機能 (v1.1.0)
        CE1[Popup]
        CE2[Background]
        CE3[manaba Content Script]
        CE4[Web Content Script]
        
        CE1 -->|FETCH_TASKS| CE2
        CE2 -->|URL Open| CE3
        CE3 -.->|Save to Local Storage| Storage[(chrome.storage)]
        CE3 -->|SCRAPE_FINISHED| CE2
        CE2 -->|URL Open| CE4
    end

    subgraph PCのWebアプリ (ver0.1.4)
        WA1[インポート/SML評価]
        WA2[タスク一覧/編集]
        WA3[タイマー計測/コンディション]
        WA4[ダッシュボード/分析]
        
        CE4 <-->|window.postMessage| WA1
    end

    subgraph Firebase
        FS[(Firestore)]
        FA[Authentication]
    end

    Storage -.->|Read pendingTasks| CE4
    WA1 -->|重複排除 & 一括登録| FS
    WA2 <-->|CRUD| FS
    WA3 -->|TimeLogs/ConditionLogs| FS
    FS -->|集計データ| WA4
    FA -.->|認証| WA1
    FA -.->|認証| WA2
```

### 2.2 各プロダクトの役割

#### 🌐 PCのWebアプリ (ver0.1.4)
- タスクの一覧管理・編集・削除
- タスク規模別の **着手リードタイム分析** (Dashboard)
- 作業ログの **積み上げ式ガントチャート**
- カレンダーによる〆切の俯瞰
- タイマー計測・手動記録・事後報告
- **[NEW] チュートリアルとオンボーディング**:
  - 未ログインユーザー向けにサービス価値を伝えるインタラクティブなチュートリアル画面。
- **[NEW] 拡張機能とのセキュアなハンドシェイク連携**:
  - 拡張機能（Web Content Script）と `window.postMessage` を用いて通信。
  - Webアプリ側から `SYNC_SCALE_APP_READY` を投げて初めてデータを受け取る堅牢な設計。
  - 受信後、Firestore の `writeBatch` を用いて一括登録（`manabaAssignmentId` による重複排除）。
  - **[NEW] 堅牢な重複排除タイミング制御**: ログイン時や初期ロード時、Firestoreからのタスク取得（`loading: false`）が完了するのを待ってからインポートを実行することで、ロード遅延時の重複登録を完全に防止。
- **[NEW] SML連続評価フロー**:
  - 新規に取り込まれたタスクに対し、連続してSML（規模）の見積もりを要求するUI。

#### 🔌 Chrome拡張機能 (v1.1.0)
- LMS（manaba等）のページからタスク名と〆切を自動取得（スクレイピング）。
- **[NEW] Storage-based イベント駆動型通信**:
  - ページロードの遅延やリダイレクトに左右されない、極めて堅牢な連携アーキテクチャ。
  - `chrome.tabs.sendMessage` による直接通信を廃止。
  - 各ページ（manaba側, SyncScale側）が開かれた際、自分自身で `chrome.storage.local` を参照し、次のアクションを自律的に行うバケツリレー方式を採用。
  - **[NEW] ストレージ変更監視によるリアルタイム送信**: すでにSyncScaleタブが開かれた状態で再度スクレイピングが行われた場合でも、`chrome.storage.onChanged` をトリガーにして即時Webアプリへ再送。
- **[NEW] ユーザー確認とUI**:
  - スクレイピング完了後、ブラウザネイティブの `window.alert` で取得件数を明示し、ユーザーが「OK」を押したタイミングでSyncScaleへ遷移する。

### 2.3 他プロダクトとの連携設計ポリシー

Firebaseを **Single Source of Truth（唯一の情報源）** とします。
**Chrome拡張機能については、セキュリティの最大化とManifest V3の厳格なポリシーに準拠するため、Firebase直接接続を完全に廃止し、Webアプリの動作中タブを介したメッセージ連携方式を採用しています。**

これにより：
- **セキュリティの最大化**: 拡張機能内に Firebase APIキーや認証トークンを保持・露出させるリスクを完全に排除。
- **堅牢性の担保**: 拡張機能とWebアプリは、互いにローカルストレージと `postMessage` (ハンドシェイク) を介してデータをやり取りするため、タイミング問題によるデータのロストが起こりません。
- **ユーザー体験の向上**: Webアプリが未ログインの場合でも、拡張機能からデータを送信するとWebアプリ側で一時バッファに保留され、専用の「ログイン促進モーダル」が表示されます。ログイン完了と同時にシームレスにデータがインポートされます。

また、**モバイルアプリ（Flutter）** においては、以下のようなセキュアな設計方針を採用します：
- **クレデンシャルの動的ロード**: Firebase 接続用 APIキーや App ID などのクレデンシャル情報をコード内に直接ハードコード（定数化）することを廃止し、ローカルの `.env` ファイルから `flutter_dotenv` パッケージを用いて実行時に動的読み込みを行う構造を確立。これにより、パブリックリポジトリ等への APIキー漏洩リスクを未然に防止します。
- **設定ファイルの除外**: `GoogleService-Info.plist` や `.env` ファイル等の機密情報が含まれる設定ファイルは、`.gitignore` に明示的に指定して Git の追跡・管理から完全に除外します。

---

## 3. データ構造（Firestore Schema）

### Collection: `tasks`

タスクの基本情報。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID (Firebase Auth) | — |
| `title` | string | タスク名 | — |
| `deadline` | timestamp | 締切日時 | ソートキー |
| `status` | string | 'TODO' / 'DOING' / 'DONE' | — |
| `isVisible` | boolean | 表示フラグ (default: true) | 論理削除用 |
| `createdAt` | timestamp | 作成日時 | — |
| `sizeLabel` | string | 相対見積もり: 'S' / 'M' / 'L' | — |
| `isNew` | boolean | 初回見積もり未完了フラグ | 拡張機能から追加時に `true` |
| `source` | string | 登録元: 'manual' / 'chrome_ext' | — |
| `startedAt` | timestamp \| null | 最初に DOING になった日時 | リードタイム算出用 |
| `completedAt` | timestamp \| null | DONE になった日時 | — |
| `manabaAssignmentId` | string \| null | manabaの課題一意ID | 重複排除用 |

### Collection: `timeLogs`

タイマーによる実行ログ。ガントチャートの元データ。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID | — |
| `taskId` | string | `tasks` ドキュメントへの参照ID | — |
| `subTaskName` | string | 具体的な作業名 | — |
| `startTime` | timestamp | 計測開始時刻 | — |
| `endTime` | timestamp | 計測終了時刻 | — |
| `durationSeconds` | number | 実働時間 (秒) | — |

### Collection: `conditionLogs`

提出完了時のコンディション記録。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID | — |
| `taskId` | string | `tasks` ドキュメントへの参照ID | — |
| `condition` | string | 'good' / 'fair' / 'poor' | 心身のコンディション |
| `memo` | string | 振り返りメモ（任意） | — |

### Collection: `activityLogs` (v0.3.3〜)

ユーザーの利用状況（ログイン状況・機能の使用状況）の行動ログ。**1イベント = 1ドキュメントの追記専用**（カウンタ加算ではなく生イベントを記録し、集計は分析時に行う）。
Web (React)・モバイル (Flutter)・モバイルWeb (Flutter Web同梱版) の3経路から同一スキーマで書き込まれる。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID | — |
| `eventName` | string | イベント名（下表参照） | — |
| `params` | map | イベント固有の付加情報 | — |
| `platform` | string | 'web' / 'mobile' / 'mobile_web' | 記録元の識別 |
| `appVersion` | string | 記録時のアプリバージョン | — |
| `createdAt` | timestamp | 記録日時 (serverTimestamp) | — |

#### イベント一覧

| eventName | 発生タイミング | 主な params |
|---|---|---|
| `session_start` | アプリを開いた（ページロード / 起動ごとに1回） | — |
| `task_create` | タスクの手動登録 | `source`, `isTutorialTask` |
| `task_import` | Chrome拡張からの一括インポート | `count`, `source` |
| `sml_estimate` | SML（規模）見積もりの設定・変更 | `taskId`, `sizeLabel`, `isFirstEstimate` |
| `task_status_change` | ステータス変更 (TODO/DOING/DONE) | `taskId`, `from`, `to` |
| `task_delete` | タスクの論理削除 | `taskId` |
| `timer_start` | タイマー計測の開始 | `taskId` |
| `time_log_add` | 作業ログの保存 | `taskId`, `durationSeconds`, `method` ('timer'/'manual') |
| `condition_submit` | 提出時コンディションの入力 | `taskId`, `condition` |
| `task_detail_view` | タスク詳細の閲覧 | `taskId` |
| `completed_list_view` | 完了タスク一覧の閲覧 (Webのみ) | — |
| `screen_view` | 画面タブの切り替え (モバイルのみ) | `screen` ('tasks'/'calendar'/'analytics') |

- 未ログイン・未同意（同意書バージョン不一致を含む）の間は記録されない（クライアント側ガード + Firestoreルールの二重ガード）。
- 記録は fire-and-forget（失敗してもアプリの動作を妨げない）。
- 滞在時間はハートビート等で直接計測せず、イベントのタイムスタンプ列から分析時に推定する方針。

### Collection: `consents`

研究参加への同意記録。documentId = userId。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `agreedAt` | timestamp | 同意日時 | 再同意時は上書き |
| `version` | string | 同意した同意書のバージョン | 現行バージョンと不一致の場合は再同意が必要 |
| `withdrawnAt` | timestamp | 撤回日時 | 撤回時のみ。研究記録として残る |
| `previousConsents` | array | 旧バージョンへの同意履歴 `{version, agreedAt}` | 同意書改訂時の再同意で追記 |

#### 同意撤回時のデータ削除（チャンク分割）

Firestoreの `writeBatch` は1コミット500操作までの制限があるため、撤回時の全データ削除（tasks / timeLogs / conditionLogs / activityLogs / onboarding）は**450件ずつのチャンクに分割して順次コミット**する。最後に `withdrawnAt` を記録する。

---

## 4. PCのWebアプリ — 詳細設計

### 4.1 UIレイアウト構成

- **Desktop (≥ 768px)**: 画面全体は `h-screen` Fixed。内部スクロールで対応。
  - **左カラム**: TaskForm, TaskList（操作系）
  - **右カラム**: ダッシュボード / カレンダー（参照系）
- **Mobile (< 768px)**: 縦一列。カレンダーが上、TaskForm・TaskListが下。

### 4.2 ファイル構造

```
src/
├── components/              # Presentation Layer: UI表示
│   ├── Layout.jsx             # 共通レイアウト
│   ├── Tutorial.jsx           # 未ログイン向けオンボーディング
│   ├── TaskForm.jsx           # タスク登録フォーム
│   ├── TaskList.jsx           # タスク一覧
│   ├── Timer.jsx              # タイマー
│   ├── TaskOverlay.jsx        # タスク詳細モーダル
│   ├── GanttChart.jsx         # 積み上げ式ガントチャート
│   ├── Calendar.jsx           # 〆切カレンダー
│   ├── Dashboard.jsx          # 全体ダッシュボード
│   └── TaskSizeEstimateModal.jsx # 新規タスクのSML初回入力モーダル
├── hooks/                   # Application Layer: ユースケース
│   ├── useTasks.js            # タスクCRUD
│   ├── useTimeLogs.js         # 作業ログCRUD
│   ├── useConditionLogs.js    # コンディション記録
│   ├── useAuth.jsx            # 認証管理
│   └── useAnalytics.js        # 分析データの算出
├── services/                # Infrastructure Layer: 外部API通信
├── domain/                  # Domain Layer: ビジネスロジック
│   └── analytics.js           # 分析用純粋関数
└── App.jsx
```

### 4.3 新規・主要コンポーネント詳細設計

#### 4.3.1 Tutorial (チュートリアル画面)
- 未ログインユーザーに対して表示。アプリの価値（SML見積もり、タイマー、分析）を疑似データとアニメーションで紹介するインタラクティブなLP。最後にGoogleログインを促す。

#### 4.3.2 拡張機能連携と一括インポートモーダル
- `App.jsx` がマウントされた直後に `window.postMessage({ type: 'SYNC_SCALE_APP_READY' }, '*')` を発行。
- 拡張機能（`web-content.js`）はこれを受け取り、ローカルストレージのデータをReactへ送信。
- React側でデータを受け取ると、ACKを返したのちに、`manabaAssignmentId` を用いて一括重複排除・一括登録 (`addTasksBatch`) を行う。
- **未ログイン時の挙動**: データを一時バッファに保持し、最前面に「ログインして取り込む」という誘導モーダルを表示。ログイン完了後に自動で登録処理が再開される。

#### 4.3.3 TaskSizeEstimateModal（SML連続評価モーダル）
- 新規追加され、まだSML見積もりが済んでいないタスク（`isNew: true`）に対して表示されるモーダル。
- 一括で複数件の課題が登録された場合、「現在 1/3 件目」のようなバッジを表示し、1つ評価するごとに次のタスクが連続して表示されるUI設計。ユーザーに見積もりを習慣化させるフックとして機能する。

#### 4.3.4 TaskOverlay（タスク詳細モーダル）
- SMLの変更、タイマー計測、ガントチャートの確認、提出コンディションの確認を1画面に集約。
- ステータスが `DONE`（提出完了）のタスクを開いた場合はタイマーが消え、代わりに提出時のコンディションとメモが表示される。

#### 4.3.5 Dashboard（全体ダッシュボード）
- 収集したデータを可視化し、ユーザーの「癖」への気づきを促す。
- S/M/L 各ラベルごとに「登録日（createdAt）から着手日（startedAt）までの日数（リードタイム）」を集計・表示。

---

## 5. 今回のスコープ（Phase分割の現状）

### ✅ Phase 1: 基礎改修とChrome拡張機能連携（完了）
- 拡張機能のManifest V3対応、Storage-based逐次処理による堅牢化。
- Webアプリ側の重複排除インポート、ログイン連携（保留インポート機能）。
- SML見積もりモーダルの連続評価UIの実装。
- Tutorial 画面によるオンボーディング実装。

### 🔄 Phase 2: Dashboard の実装（Next Step）
- `useAnalytics` フックの実装（時間負債計算・リードタイム算出）。
- `domain/analytics.js` に分析用純粋関数を実装。
- Dashboard コンポーネントの実装（時間負債サマリー、着手リードタイム）。
- グラフ描画ライブラリの選定・導入（Recharts 等を想定）。

### 🗓 Phase 3: スマートフォンアプリ連携（将来構想 → 開発進行中）
- 外出先からのSML評価、タイマー計測、コンディション入力。
- Firestoreを介したリアルタイム同期。
- **セキュリティ強化（環境変数化）**: `.env` を用いて、Firebase APIキーを実行時に動的読み込みするセキュアな構成を適用。
