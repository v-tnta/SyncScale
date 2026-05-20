# SyncScale (β) System Design Document

## 1. 概要
本アプリケーションは、学生の時間管理能力とメタ認知を向上させるためのツールです。
「見積もり」と「実績」の差分（時間負債）を可視化し、タイマーログから「実績ガントチャート」を自動生成します。

## 1.1 UIレイアウト構成
- **Mobile (< 768px)**: 縦一列の配置。
  - **上部**: Calendar (予定確認を優先)
  - **下部**: TaskForm, TaskList
  - 画面全体（Body）がスクロールする。
- **Desktop (>= 768px)**: 画面全体はスクロール不可（`h-screen` Fixed）。内部スクロールで対応。
  - **左カラム**: TaskForm, TaskList (操作系)
  - **右カラム**: Calendar (参照系 - 広めに配置)


## 2. ファイル構造 (ディレクトリ構成)

v0.0.1 (Layered Architecture)

```
src/
├── components/          # Presentation Layer: UI表示
│   ├── Layout.jsx         
│   ├── TaskForm.jsx       
│   ├── TaskList.jsx       
│   ├── Timer.jsx          
│   ├── TaskOverlay.jsx    
│   ├── TaskAnalytics.jsx  
│   ├── GanttChart.jsx     
│   └── AccountMergeModal.jsx # アカウント統合確認モーダル
├── hooks/               # Application Layer: ユースケース (Serviceを利用)
│   ├── useTasks.js        
│   └── useTimeLogs.js     
├── services/            # Infrastructure Layer: Firebase・外部API通信
│   ├── taskService.js     
│   ├── timeLogService.js  
│   └── aiService.js       # Gemini APIとの通信を担当
├── domain/              # Domain Layer: ビジネスロジック・エンティティ
│   ├── task.js            
│   ├── timeLog.js         
│   └── system.GEMINI      # AIへのシステムプロンプト定義ファイル
├── lib/
│   └── firebase.js        # Firebase初期化設定
├── App.jsx                
└── main.jsx               
```

## 3. データ構造 (Firestore Schema)

### Collection: `tasks`
タスクの基本情報を管理します。

| Field | Type | Description |
|---|---|---|
| `documentId` | string | 自動生成ID |
| `userId` | string | 所有ユーザーのUID (Firebase Auth) |
| `title` | string | タスク名 |
| `estimatedMinutes` | number | 見積もり時間 (分) |
| `deadline` | timestamp | 締切日 (ソートキーとして使用) |
| `status` | string | 'TODO', 'DOING', 'DONE' (UI上はそれぞれ「これからやる」「とりかかり中」「提出完了」にマッピングして表示) |
| `isVisible` | boolean | 表示フラグ (default: true) |
| `createdAt` | timestamp | 作成日時 |

### Collection: `timeLogs`
タイマーによる実行ログを管理します。ガントチャートの元データとなります。

| Field | Type | Description |
|---|---|---|
| `documentId` | string | 自動生成ID |
| `userId` | string | 所有ユーザーのUID (Firebase Auth) |
| `taskId` | string | `tasks` ドキュメントへの参照ID |
| `subTaskName` | string | (Option) その時行っていた具体的な作業名 |
| `startTime` | timestamp | 計測開始時刻 |
| `endTime` | timestamp | 計測終了時刻 |
| `durationSeconds` | number | 実働時間 (秒) - 集計算出用 |
| `createdAt` | timestamp | ログ作成日時 |

## 4. コンポーネント詳細設計

### 4.1 TaskForm
- **機能**: ユーザーがタスクを登録する。
- **UI要素**:
  - タイトル入力 (Text)
  - 見積もり時間入力 (Number)
  - 締切日選択 (Date Input)
  - 「登録」ボタン

### 4.2 Timer
- **機能**: 作業時間をリアルタイムで計測する。
- **UI要素**:
  - 取り組むタスクの選択 (Dropdown: DOING/TODOのタスク)
  - サブタスク名入力 (Text: 「資料探し」など)
  - Start / Stop ボタン , きろくボタン
  - Startボタンを押すと、Stopボタンにかわり、タイマーが開始、または再開される。
  - Stopボタンを押すと、Startボタンに変わり、右にきろくボタンが表示される。タイマーは一時停止する。
  - きろくボタンを押すと、その時点での秒数で`durationSeconds`を計算してDBへ保存する。**この時、タスクのステータスが 'TODO' であれば自動的に 'DOING' に更新する。** また、タイマーをリセットする。
  - 経過時間のリアルタイム表示（ブラウザのスリープ等によるズレを防ぐため、1秒ごとに「現在時刻 - 開始時刻」を再計算して表示する）


  ### 4.2.1 Timer (事後報告) 
  - **補足**: 4.2 Timerの表示領域の右上に配置したボタンを押すと、作業の事後報告用モーダルを表示する。
  - **機能**: 作業時間を事後報告する。
  - **UI要素**:
    - 取り組んだタスクの選択 (Dropdown: DOING/TODOのタスク)
    - サブタスク名入力 (Text: 「資料探し」など)
    - 経過時間入力 (Number)
    - 「報告」ボタン
  - **挙動**: 「報告」ボタンを押すと、DBへ保存する。

### 4.3 タスク一覧 (TaskList)
タスク一覧を表示し、各タスクに対して直接操作を行えるコンポーネント。

- **機能**: 
  - タスク一覧の表示（**非表示タスクの表示切り替え機能付き**）
  - 個別タスクへのクイックアクション（完了・非表示）
  - 時間負債の視覚化

- **UI要素**:
  - **ヘッダーエリア**:
    - タイトル「タスク一覧」
    - **非表示タスク表示トグル**: 「非表示も表示」チェックボックス。ONにすると、論理削除されたタスクもグレーアウト状態で表示される。
  - **タスクカード**:
    - **時間負債表示**: ステータスが 'DOING' のタスクについて、時間負債（実績合計 - 見積もり）を分単位で表示する。
    - **完了ボタン**: ステータスが 'DONE' でないタスクに表示。
    - **非表示ボタン**: ステータスが 'DONE' かつ表示中 (`isVisible: true`) のタスクに表示。
    - **再表示ボタン**: ステータスが 'DONE' かつ非表示中 (`isVisible: false`) のタスクに表示（非表示も表示ONの時のみ）。
    - **(非表示)ラベル**: 論理削除されたタスクのタイトル横に赤字で表示。
    - ステータスバッジ (UI表示は「これからやる」「とりかかり中」)

### 4.3.1 Task Overlay (Modal)
タスク詳細を表示し、編集・ステータス管理・削除を行うモーダル。

- **機能**: タスクの詳細表示と各種操作。
- **構成**:
  1. (省略: TaskAnalytics, GanttChart, 編集機能)
  2. **タイマー / コンディション領域**:
     - 未完了タスク (`TODO` / `DOING`) の場合は、作業時間を計測するための **Timerコンポーネント** を表示。
     - 提出完了タスク (`DONE`) の場合は、裏側で `conditionLogs` から該当タスクのコンディションを自律ロードし、**提出時のコンディション (気分絵文字とふりかえりメモ)** を表示。
  3. **アクションボタン**:
     - **未提出に戻すボタン**: ステータスが `DONE` の場合に、物理削除の左隣に表示。クリック時に確認を経て、タスクのステータスを `TODO` (これからやる)、`completedAt` を `null` に差し戻し、再度タイマーで作業できるようにします。
     - **提出完了ボタン**: ステータスが 'DONE' でない場合に表示（UI表示は「提出完了」）。
     - **非表示ボタン**: ステータスが 'DONE' かつ `isVisible: true` の場合に表示。非表示を実行すると**自動的にモーダルを閉じる**。
     - **再表示ボタン**: 非表示タスクを表示中に選択した場合に表示。リストに復帰(Restore)させる。
     - **物理削除ボタン**: 完全削除（Cascade Delete）。

### 4.3.2 GanttChart (Component)
- **機能**: 渡された `timeLogs` を「積み上げ式」のバーチャートとして描画する。
- **仕様**:
  - **表示形式**: 横スクロール可能な水平スタックバーチャート。
  - **横軸**: 経過時間 (開始0分から、30分ごとの目盛りを表示)。
  - **コンテンツ**: 各ログ（サブタスク）を、所要時間(duration)に応じた幅で、左から詰めて配置する（隙間時間を作らない）。
  - **見た目**: 
    - 「タスク名」のレーンに対し、作業ログが隙間なく連結された一本のバーのように見える。
    - バー内には「サブタスク名」を表示する。
  - **レスポンシブ挙動**:
    - 表示領域(コンテナ幅)よりもチャートが長くなる場合、自動的に縮小して領域内に収まるようにスケーリングする(最小スケール適用)。
    - 領域に余裕がある場合は、標準スケール(3px/分)で描画する。

## 5. 技術スタック & 開発ルール

- **Core**: React, Vite
- **Styling**: Tailwind CSS (ユーティリティクラスを活用し、CSSファイル作成を減らす)
- **Backend**: Firebase Firestore, Gemini API (Generative AI)
- **Coding Style**:
  - **Layered Architecture**:
    - **Presentation ( src/components )**: UIのみに関心を持つ。ロジックはHooksに委譲。`Timer.jsx` は `DONE` タスクでは表示を抑制。
    - **Application ( src/hooks )**: ユースケースを定義。`useAiPredictions.js` ではリクエスト削減のため、同一タスク・ログ数不変時のキャッシュ機構を導入。
    - **Infrastructure ( src/services )**: Firestoreや Gemma 3 API など外部APIとの通信を隠蔽する。
    - **Domain ( src/domain )**: データ構造とビジネスロジック、およびAIプロンプト（`system.GEMINI`）を持つ。
      - **計算ロジック**（例: 時間集計）はここに純粋関数として記述し、コンポーネント変数への代入はApplication層で行う。
  - **段階的実装**: UI実装(固定値) → State実装(機能動作) → DB接続 の順で進める。

## 6. 認証とセキュリティ
- **Authentication**: Firebase Authenticationを用いた「匿名認証」と「Googleアカウントへのアップグレード連携（Account Linking）」を採用。
  - **匿名ログイン**: アプリを開いた瞬間に自動で匿名アカウントが発行され、ログイン不要ですぐに利用開始できる。
  - **アカウント連携（データ引き継ぎ）**: 匿名状態で作成したデータを失うことなく、後からGoogleアカウントに紐付けることができる。
  - **データマージ処理**: 連携時に「すでに使用されているGoogleアカウント (`auth/credential-already-in-use`)」である場合、ブラウザのポップアップブロックを回避する専用のカスタムモーダル（`AccountMergeModal`）を表示。ユーザーの同意を得た上で、匿名データを新しいアカウント権限で再作成（`addDoc`）することでFirestoreのセキュリティルールを遵守しつつデータを統合する。
- **データアクセス権限**:
  - 各ドキュメント (`tasks`, `timeLogs`) は `userId` フィールドによって所有者を管理。
  - Firestoreセキュリティルールにより、`request.auth != null && request.auth.uid == resource.data.userId` の条件を満たした場合のみ読み書きを許可。自分以外のデータへのアクセスは強固にブロックされる。
- **モバイルアプリにおける API キーの環境変数化**:
  - モバイルアプリ（Flutter）において、従来ハードコードされていた Firebase の APIキーや App ID などのクレデンシャル情報をコードから完全に排除。
  - 各環境変数はローカルの `.env` ファイルに定義し、`flutter_dotenv` パッケージを使用して実行時に動的に読み込むセキュアな構造を採用。これにより、Gitリポジトリ等への認証情報漏洩を防ぎます。
  - 機密情報を含む `.env` および `GoogleService-Info.plist` などの設定ファイルは `.gitignore` に追加し、バージョン管理から除外。
