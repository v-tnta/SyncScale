# SyncScale v2 — System Design Document

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
| 2. 相対見積もり | 課題に対して S/M/L ラベリング | **スマートフォンアプリ** |
| 3. 計測と振り返り | タイマーで実働時間を計測、完了時にコンディション入力 | **スマートフォンアプリ** |
| 4. データの可視化 | 着手リードタイムをダッシュボードで視覚化 | **PCのWebアプリ** ★今回 |

---

## 2. システム全体像

### 2.1 3つの制作物とデータフロー

```mermaid
graph LR
    subgraph Chrome拡張機能
        CE[LMSスクレイピング]
    end

    subgraph スマートフォンアプリ
        SP1[相対見積もり S/M/L]
        SP2[タイマー計測]
        SP3[コンディション入力]
    end

    subgraph PCのWebアプリ ★今回
        WA1[タスク管理]
        WA2[ダッシュボード]
        WA3[分析・可視化]
    end

    subgraph Firebase
        FS[(Firestore)]
        FA[Authentication]
    end

    CE -->|課題データ登録| FS
    SP1 -->|見積もりラベル| FS
    SP2 -->|作業ログ| FS
    SP3 -->|コンディション| FS
    FS -->|リアルタイム同期| WA1
    FS -->|集計データ| WA2
    FS -->|分析データ| WA3
    FA -.->|認証| CE
    FA -.->|認証| SP1
    FA -.->|認証| WA1
```

### 2.2 各プロダクトの役割

#### 🌐 PCのWebアプリ（★今回のスコープ）
- タスクの一覧管理・編集・削除
- タスク規模別の **着手リードタイム分析**
- 作業ログの **積み上げ式ガントチャート**
- カレンダーによる〆切の俯瞰
- **（従来機能の継承）タイマー計測・手動記録・事後報告**

#### 🔌 Chrome拡張機能（将来実装）
- LMS（manaba等）のページからタスク名と〆切を自動取得
- 取得データをFirestoreの `tasks` コレクションへ登録
- 認証はWebアプリと共有（Firebase Auth）

#### 📱 スマートフォンアプリ（将来実装）
- タスクへの相対見積もり（S/M/L）ラベリング
- タイマーによる実働時間計測
- 提出完了時の心身コンディション（良/中/悪）入力
- 認証はWebアプリと共有（Firebase Auth）

### 2.3 他プロダクトとの連携設計ポリシー

Firebaseを **Single Source of Truth（唯一の情報源）** とし、3つのプロダクトが同一のFirestoreコレクション・同一のAuthユーザーを共有する。
これにより：
- **データ整合性**: どのプロダクトから書いても同じデータとして一元管理される
- **リアルタイム同期**: WebアプリのonSnapshotで、スマホアプリやChrome拡張からの変更が即座に反映される
- **認証の統一**: Firebase Authにより、全プロダクトで同一ユーザーとしてログイン可能

---

## 3. データ構造（Firestore Schema）

> v1からの変更点を 🆕 マークで示す。

### Collection: `tasks`

タスクの基本情報。Chrome拡張機能・スマホアプリ・Webアプリの三者から読み書きされる。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID (Firebase Auth) | — |
| `title` | string | タスク名 | — |
| `deadline` | timestamp | 締切日時 | ソートキー |
| `status` | string | 'TODO' / 'DOING' / 'DONE' (UI表示: 「これからやる」「とりかかり中」「提出完了」) | — |
| `isVisible` | boolean | 表示フラグ (default: true) | 論理削除用 |
| `createdAt` | timestamp | 作成日時 | — |
| 🆕 `sizeLabel` | string | 相対見積もりラベル: 'S' / 'M' / 'L' | スマホアプリからも更新される |
| 🆕 `isNew` | boolean | 初回見積もり未完了フラグ | 拡張機能からの追加時に `true` になり、WebでSMLを入力すると `false` になる |
| 🆕 `source` | string | 登録元: 'manual' / 'chrome_ext' / 'mobile_app' | データの出所を追跡 |
| 🆕 `startedAt` | timestamp \| null | 最初に DOING になった日時 | 着手リードタイム算出用 |
| 🆕 `completedAt` | timestamp \| null | DONE になった日時 | 完了後の分析用 |

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
| `createdAt` | timestamp | ログ作成日時 | — |

### 🆕 Collection: `conditionLogs`

提出完了時のコンディション記録。スマホアプリから主に入力される。

| Field | Type | Description | 備考 |
|---|---|---|---|
| `documentId` | string | 自動生成ID | — |
| `userId` | string | 所有ユーザーのUID | — |
| `taskId` | string | `tasks` ドキュメントへの参照ID | — |
| `condition` | string | 'good' / 'fair' / 'poor' | 心身のコンディション |
| `memo` | string | 振り返りメモ（任意） | — |
| `createdAt` | timestamp | 記録日時 | — |

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
│   ├── Layout.jsx             # ヘッダー・フッター含む共通レイアウト
│   ├── TaskForm.jsx           # タスク登録フォーム
│   ├── TaskList.jsx           # タスク一覧（クイックアクション付き）
│   ├── Timer.jsx              # タイマー（計測/一時停止/記録）
│   ├── TaskOverlay.jsx        # タスク詳細モーダル
│   ├── TaskAnalytics.jsx      # タスク個別の分析表示
│   ├── GanttChart.jsx         # 積み上げ式ガントチャート
│   ├── Calendar.jsx           # 〆切カレンダー
│   ├── ConfirmModal.jsx       # 汎用確認モーダル
│   ├── 🆕 Dashboard.jsx       # 全体ダッシュボード（時間負債・リードタイム）
│   ├── 🆕 SizeLabelSelector.jsx  # S/M/L ラベル選択UI
│   └── 🆕 TaskSizeEstimateModal.jsx # 新規タスクのSML初回入力モーダル
├── hooks/                   # Application Layer: ユースケース
│   ├── useTasks.js            # タスクCRUDと状態管理
│   ├── useTimeLogs.js         # 作業ログの取得
│   ├── useAuth.jsx            # Firebase Authentication管理
│   └── 🆕 useAnalytics.js     # 分析データの算出（リードタイム等）
├── services/                # Infrastructure Layer: 外部API通信
│   ├── taskService.js         # Firestore tasks コレクション操作
│   ├── timeLogService.js      # Firestore timeLogs コレクション操作
│   ├── aiService.js           # Gemini API との通信
│   └── 🆕 conditionLogService.js  # Firestore conditionLogs 操作
├── domain/                  # Domain Layer: ビジネスロジック
│   ├── task.js                # Task エンティティ
│   ├── timeLog.js             # TimeLog エンティティ・集計ロジック
│   └── 🆕 analytics.js        # 分析用純粋関数（リードタイム計算等）
├── lib/
│   └── firebase.js            # Firebase初期化設定
├── App.jsx
└── main.jsx
```

### 4.3 コンポーネント詳細設計

---

#### 4.3.1 TaskForm（タスク登録）

- **UI要素**:
  - タイトル入力 (Text)
  - 締切日時選択 (ドラムロール式のDateTimePickerを使用し、年・月・日・時・分を選択可能。初期値は当日の23:59)
  - 🆕 相対見積もり選択 (S / M / L ボタン)
  - 「登録」ボタン
- **挙動**: 登録時に `source: 'manual'` を自動付与。

---

#### 4.3.2 TaskList（タスク一覧）

- **機能**: タスク一覧の表示と、各タスクへのクイックアクション。
- **UI要素**:
  - **ヘッダーエリア**:
    - タイトル「タスク一覧」
    - 完了したタスクの一覧を開くボタン
  - **タスクカード**:
    - **色目印**: 左端にサイズに応じたカラーバーを表示 (S: 水色, M: オレンジ, L: 赤)
    - タスク名、ステータスバッジ
    - 🆕 相対見積もりラベル（S/M/L バッジ）
    - 締切日時 (YYYY/MM/DD HH:mm 形式)
    - 完了ボタン (未完了タスクのみ)

---

#### 4.3.3 CompletedTasksModal（提出完了したタスクの一覧）

- **機能**: 完了済みタスク（`status === 'DONE'`）を月別にグループ化して表示する。
- **UI要素**:
  - 月ごとのアコーディオン見出し（例: ーーー2026年5月ーーー▽）
  - 🆕 タスクカード（打ち消し線付き、サイズバッジ(SML)にカラーマッピング色を適用、ステータス表示は緑色の「提出完了」バッジ）
- **挙動**: メインリストの「提出完了したタスクの一覧」ボタンから開く。

---

#### 4.3.4 ConditionInputModal（振り返りモーダル）

- **機能**: タスクを完了する直前に、コンディションとメモを入力させる。
- **UI要素**:
  - コンディション選択ボタン (😊/🙂/😥)
  - ひとことメモ (任意)
  - キャンセル / 記録して提出完了 ボタン
- **挙動**: このモーダルで「記録して提出完了」を押して初めてタスクが `DONE` になる。

---

#### 4.3.3 Timer（タイマー）

v1の機能を継承。

- **機能**: 作業時間をリアルタイムで計測する。
- **UI要素**:
  - タスク選択 (Dropdown: DOING/TODOのタスク)
  - サブタスク名（自由記述）
  - Start / Stop / きろく ボタン
  - 経過時間リアルタイム表示
- **挙動**:
  - Start → タイマー開始。Stop → 一時停止（経過時間保持）。きろく → DB保存＆リセット。
  - 🆕 初めての記録時に `startedAt`（着手日時）がnullなら自動で現在時刻をセットする。
  - ステータスが 'TODO' であれば自動的に 'DOING' に更新。
  - 表示は `Date.now() - startTime` で毎秒再計算（スリープ対策）。

---

#### 4.3.4 Timer（事後報告モード）

v1の機能を継承。

- **機能**: 作業時間を事後報告する。
- **UI要素**:
  - タスク選択 / サブタスク名 / 経過時間入力 / 「報告」ボタン

---

#### 4.3.5 TaskOverlay（タスク詳細モーダル）

- **機能**: タスクの詳細表示・編集・ステータス管理・削除。
- **構成**:
  - タスク基本情報の表示・編集 (締切日時はドラムロール式のDateTimePickerで編集可能)
  - 🆕 相対見積もり（S/M/L）の変更
  - GanttChart（作業ログの積み上げチャート）
  - **タイマー / コンディション領域**:
    - 未完了タスク (`TODO` / `DOING`) の場合は、作業時間を計測するための **Timerコンポーネント** を表示。
    - 提出完了タスク (`DONE`) の場合は、裏側で `conditionLogs` から該当タスクのコンディションを自律ロードし、**提出時のコンディション (気分絵文字とふりかえりメモ)** を表示。
  - **アクションボタン**:
    - **未提出に戻すボタン**: ステータスが `DONE` の場合に、物理削除の左隣に表示。クリック時に確認を経て、タスクのステータスを `TODO` (これからやる)、`completedAt` を `null` に差し戻し、再度タイマーで作業できるようにします。
    - **完了ボタン**: ステータスが 'DONE' でない場合に表示（UI表示は「提出完了」）。
    - **非表示ボタン**: ステータスが 'DONE' かつ `isVisible: true` の場合に表示。非表示を実行すると**自動的にモーダルを閉じる**。
    - **再表示ボタン**: 非表示タスクを表示中に選択した場合に表示。リストに復帰(Restore)させる。
    - **物理削除ボタン**: 完全削除（Cascade Delete）。

---

#### 🆕 4.3.6 Dashboard（全体ダッシュボード）

**このアプリの核心機能。** 収集したデータを可視化し、ユーザーの「癖」への気づきを促す。

- **機能**: 全タスクの横断分析をグラフ・指標で表示する。
- **表示内容**:

  **① タスク規模別 着手リードタイム**
  - S/M/L 各ラベルごとに「登録日（createdAt）から着手日（startedAt）までの日数」を集計
  - 棒グラフまたはボックスプロットで、規模ごとの先延ばし傾向を可視化
  - 例: 「Lタスクは平均5日先延ばし、Sタスクは1日以内に着手」

  **② コンディション相関（将来: スマホアプリ連携時）**
  - コンディション（良/中/悪）と作業効率の相関を表示
  - データがない場合は「スマホアプリからコンディションを記録しましょう」と案内

---

#### 🆕 4.3.7 SizeLabelSelector（相対見積もりラベル選択）

- **機能**: S / M / L のラベルを選択するコンパクトなUI。
- **UI**: 3つのボタン（S / M / L）。選択中のラベルがハイライト。
- **利用箇所**: TaskForm, TaskOverlay 内に埋め込んで使う。
- **各ラベルの定義（目安）**:

| ラベル | 意味 | 基準 |
|--------|------|------|
| **S** | すぐ終わる | すぐ取り掛かれば終わる＋何から始めればよいかわかっている |
| **M** | 半日〜1日 | 1日以内で終わる |
| **L** | 数日かかる | 数日かかる、または何から始めればよいかわかっていない |

---

#### 4.3.8 GanttChart（積み上げ式ガントチャート）

v1の機能を継承。

- **機能**: `timeLogs` を積み上げ式のバーチャートとして描画。
- **仕様**:
  - 横軸: 経過時間（0分〜、30分ごと目盛り）
  - コンテンツ: 各ログを左詰め連結
  - 自動スケーリング: コンテナ幅に収まるように縮小

---

#### 4.3.9 Calendar（〆切カレンダー）

v1の機能を継承。

- **機能**: タスクの締切日をカレンダー上で可視化。
- **仕様**: `react-big-calendar` を使用。月/週表示、日本語ロケール。

---

### 4.4 新規ドメインロジック

#### `domain/analytics.js`

分析用の**純粋関数**を集約する。コンポーネントから直接呼ばず、`useAnalytics` フック経由で利用する。

```javascript
/**
 * 着手リードタイム（先延ばし日数）を計算する
 * @param {Date} createdAt - タスク登録日
 * @param {Date|null} startedAt - 最初に着手した日
 * @returns {number|null} リードタイム (日数)。未着手ならnull。
 */
export function calculateLeadTimeDays(createdAt, startedAt) {
  if (!startedAt) return null;
  const diffMs = startedAt.getTime() - createdAt.getTime();
  return diffMs / (1000 * 60 * 60 * 24); // ミリ秒 → 日
}

/**
 * タスクをサイズラベルごとにグループ化する
 * @param {Array} tasks - タスク配列
 * @returns {Object} { S: [...], M: [...], L: [...], unlabeled: [...] }
 */
export function groupBySizeLabel(tasks) {
  return tasks.reduce((groups, task) => {
    const label = task.sizeLabel || 'unlabeled';
    if (!groups[label]) groups[label] = [];
    groups[label].push(task);
    return groups;
  }, { S: [], M: [], L: [], unlabeled: [] });
}
```

---

## 5. 技術スタック & 開発ルール

### 5.1 技術スタック

| 区分 | 技術 | 備考 |
|------|------|------|
| Core | React, Vite | — |
| Styling | Tailwind CSS v4 | `@tailwindcss/postcss` 利用 |
| Backend | Firebase Firestore | リアルタイム同期 (`onSnapshot`) |
| Auth | Firebase Authentication | 匿名認証 + Googleアカウント連携 |
| AI | Gemini API | サブタスク予測 |
| 🆕 グラフ描画 | （候補: Recharts / Chart.js） | Dashboard用。実装時に選定 |

### 5.2 レイヤードアーキテクチャ

v1から継承。

| Layer | Directory | 責務 |
|-------|-----------|------|
| **Presentation** | `src/components/` | UIのみ。ロジックはHooksに委譲 |
| **Application** | `src/hooks/` | ユースケース定義。Service層を利用 |
| **Infrastructure** | `src/services/` | Firestore・外部API通信を隠蔽 |
| **Domain** | `src/domain/` | エンティティ・ビジネスロジック（純粋関数） |

### 5.3 開発ルール

- **段階的実装**: UI実装(固定値) → State実装(機能動作) → DB接続 の順で進める
- **可読性優先**: 1関数30行以内目安、過度な三項演算子のネスト禁止
- **日本語コメント**: 特に `useEffect` 依存配列、`async/await`、分析ロジックには理由を含めたコメントを記述
- **ローディング & エラー**: Firestore通信中は必ずローディング表示＋エラーメッセージ表示
- **console.log 配置**: 主要処理（データ取得、ボタンクリック等）にログ出力

---

## 6. 認証とセキュリティ

v1から継承。

- **Authentication**: Firebase Authenticationによる匿名認証 + Google アカウント連携（Account Linking）
  - 匿名ログイン: 即座にアカウント発行、ログイン不要で利用開始
  - アカウント連携: 匿名データを失わずにGoogleアカウントへ紐付け
  - データマージ: カスタムモーダル（`ConfirmModal`）で同意後、`addDoc` による安全な再作成
- **データアクセス権限**:
  - 全コレクション（`tasks`, `timeLogs`, `conditionLogs`）は `userId` で所有者を管理
  - Firestoreセキュリティルール: `request.auth.uid == resource.data.userId` で読み書き制限

---

## 7. 今回のスコープ（Phase分割）

### Phase 1: 既存機能のリファクタリングと新フィールド対応
- `tasks` コレクションに `sizeLabel`, `source`, `startedAt`, `completedAt` フィールドを追加
- TaskForm に相対見積もり（S/M/L）選択UIを追加
- TaskOverlay に相対見積もり変更UIを追加
- タイマー記録時に `startedAt` を自動セット、完了時に `completedAt` を自動セット

### Phase 2: Dashboard の実装
- `useAnalytics` フックの実装（時間負債計算・リードタイム算出）
- `domain/analytics.js` に分析用純粋関数を実装
- Dashboard コンポーネントの実装（時間負債サマリー、着手リードタイム）
- グラフ描画ライブラリの選定・導入

### Phase 3: 分析機能の強化
- 相対見積もり精度の散布図
- conditionLogs コレクションの対応（Webアプリ側での表示・入力UI）
- AIによる分析コメント生成（Gemini API活用）

### Phase 4: 他プロダクトとの連携準備
- Chrome拡張機能からのデータ受信テスト
- `source` フィールドによるデータ出所のフィルタリング・表示
- スマートフォンアプリとのリアルタイム同期検証
