## 📅 2026/01/10 システム設計の確定と開発環境の準備

### **【実装内容🔧】**
- `SystemDesign.md` の完成
  - ディレクトリ構成（`src/components/`, `src/hooks/`, `src/lib/`）の策定
  - Firestoreデータ構造（`tasks`, `timeLogs`）の設計
  - コンポーネント設計（`TaskForm`, `TaskList`, `Timer`, `Dashboard`, `GanttChart`）の明確化
- 段階的実装方針（UI→ロジック→DB）の合意

### **【技術的な判断🤔】**
- **ロジック分離の徹底**: コンポーネント内で直接Firestore操作（`onSnapshot`等）を行わず、カスタムフック（`useTasks`, `useTimeLogs`）にカプセル化することを決定。
  - **理由**: UIとロジックの責務を明確に分けることで、コードの可読性・保守性を向上。初心者が「どこに何があるか」を理解しやすくする。
- **Firestoreスキーマ設計**: `tasks`に`deadline`を追加し、`timeLogs`は別コレクションで管理。
  - **理由**: NoSQLの柔軟性を活かしつつ、リレーションをIDで管理する標準的な設計。
  - tasksの`documentId`が`timeLogs`の`taskId`として参照される。

### **【遭遇した問題と解決💡】**
- **問題**: `npm`コマンドが認識されない（`CommandNotFoundException`）。
  - **原因**: Node.jsがインストールされていない、またはPATHに含まれていない。
  - **対応**: ユーザーに環境構築を依頼（この時点では未解決で一旦中断）。


### **【重要なコードやロジック💾】**

カスタムフックによるロジック隠蔽の概念：
```javascript
// ❌ Bad: コンポーネント内でFirestore直接操作
function TaskList() {
  useEffect(() => { onSnapshot(collection(db, "tasks"), ...) }, []);
  // ... 見た目のコードと通信コードが混在
}

// ✅ Good: カスタムフックで分離
function TaskList() {
  const tasks = useTasks(); // 1行でデータ取得完了
  return <div>{tasks.map(...)}</div>;
}
```

### **【次のステップ👯】**
- Node.js/npm環境の構築・PATH設定の確認
- Viteプロジェクト初期化 (`npx create-vite`)
- Tailwind CSS導入
- Phase 1: UI実装（ダミーデータで画面表示）


## 📅 2026/01/11 Kadahira-Ganttアプリの開発：プロジェクト構築から実績ガントチャートまでの実装

### **【実装内容🔧】**

#### **1. プロジェクト初期構築・環境セットアップ**
- **実装計画の作成**
  - `implementation_plan.md`と`task.md`の作成
  - システム設計書に基づく段階的実装方針の文書化
- **Viteプロジェクトのセットアップ**
  - `npm create vite` による React プロジェクトの初期化
  - `temp-app`経由での安全なプロジェクト生成（既存ドキュメント保持）
  - 既存ドキュメント（`SystemDesign.md`, `requirements.md`）を`docs/`ディレクトリに退避
- **依存関係のインストール**
  - Tailwind CSS v4 & PostCSS & Autoprefixer
  - Firebase SDK (`@tailwindcss/postcss`対応)
- **設定ファイルの作成**
  - `tailwind.config.js`: Tailwind設定（content pathの指定）
  - `postcss.config.js`: PostCSS設定
  - `src/index.css`: Tailwindディレクティブの追加
- **ディレクトリ構造の構築**
  - `src/components/`, `src/hooks/`, `src/lib/`フォルダの作成

#### **2. 基本コンポーネントの作成**
- **Layout & Form Components**
  - `Layout.jsx`: ヘッダー・フッター含む共通レイアウト
  - `TaskForm.jsx`: タスク登録フォーム（タイトル、見積もり時間、締切入力）
  - `TaskList.jsx`: タスク一覧表示（ステータスバッジ付き）
- **データ管理層**
  - `lib/firebase.js`: Firebase初期化設定
  - `hooks/useTasks.js`: タスクCRUD操作のカスタムフック（useState版 → Firestore版）
- **UI改善**
  - タスクリスト内スクロール実装（`max-h-[500px] overflow-y-auto`）
  - カスタムスクロールバースタイル追加

#### **3. Firestore接続とリアルタイム同期**
- リアルタイム同期（`onSnapshot`）実装
- ローディング・エラー状態管理
- セットアップガイド作成（`docs/FIREBASE_SETUP.md`）

#### **4. 実績ガントチャートと高機能タイマーの実装**
- **コンポーネント構成の変更（UI/UX）**
  - 「常時表示ダッシュボード」案を廃止し、**タスククリック時に詳細モーダル（`TaskOverlay.jsx`）が開く**形式に変更
  - モーダル内でタスクごとの作業実績を集中して振り返れるUIを実現
- **実績ガントチャートの実装（`GanttChart.jsx`）**
  - **積み上げ式表示**: 一般的な「時刻ベース（カレンダー通り）」ではなく、**「経過時間ベース（積み上げ）」**に変更
  - 休憩時間などの空白を詰め、純粋な作業の積み重ねを可視化
  - X軸は経過時間（0分、30分、60分...）で表示
- **レスポンシブ・スケーリング機能**
  - チャートが長くなった場合でもスクロールさせず、**コンテナ幅に合わせて自動縮小**するロジックを実装
  - 全体像を一目で把握できるようにした
- **タイマー機能の実装（`Timer.jsx`）**
  - 作業時間を正確に計測し、Firestoreに保存する機能
  - タイムログの開始・停止・記録の管理

#### **5. バグ修正**
- `GanttChart.jsx`のソート順バグを修正（降順→昇順）

### **【技術的な判断🤔】**

#### **プロジェクト構築段階**
- **temp-app戦略の採用**
  - **問題**: `npm create vite` は空のディレクトリを要求するが、既にMarkdownファイルが存在
  - **判断**: 一時ディレクトリ `temp-app` でプロジェクトを生成し、その後ルートディレクトリに移動する手法を採用
  - **理由**: 既存ドキュメントを保持したまま、Viteのスキャフォールディング機能を最大限活用するため

- **手動での設定ファイル作成**
  - `npx tailwindcss init -p` がPowerShell環境で失敗したため、設定ファイルを手動作成
  - **理由**: 環境依存のエラーを回避し、作業を進めるため。自動生成と同等の設定内容を手動で記述することで問題なく動作

#### **アーキテクチャ設計**
- **Props Drilling（バケツリレー）の採用**
  - `App.jsx`を司令塔とし、`useTasks`から得たデータと関数を子コンポーネントに配る構成
  - **理由**: データフローが追いやすく、初心者にも「どこから何が来ているか」が明確。Contextは過剰と判断

- **Tailwind CSS v4への対応**
  - `postcss.config.js`で`@tailwindcss/postcss`を使用、`index.css`では`@import "tailwindcss"`構文に統一
  - **理由**: v4の新しいプラグインシステムに準拠。公式が推奨する方法に従うことで将来的な互換性を確保

- **スクロール制御の設計**
  - 画面全体ではなく、タスクリスト部分のみスクロール可能に
  - **理由**: フォームやヘッダーが常に見えることで、操作性が向上。一般的なSaaSアプリの標準UI

#### **UI/UX設計**
- **モーダルUI採用の理由**
  - 当初検討していた「ダッシュボード常時表示」は、画面が煩雑になりユーザーの集中を妨げる可能性があった
  - タスクごとの詳細情報を必要な時だけ表示することで、**コンテキストに応じた情報提示**を実現
  - 一般的なタスク管理ツール（Notion、Asana等）と同様のUXパターンで、学習コストを削減

- **積み上げ式ガントチャートの採用**
  - **従来の選択肢**: カレンダー通りの時刻ベース表示（9:00、10:00...）
  - **採用した方式**: 経過時間ベースの積み上げ表示（0分、30分、60分...）
  - **理由**: 
    - 「時間負債の可視化」というアプリコンセプトに合致
    - 実際の作業時間の「積み重ね」を直感的に把握できる
    - 休憩や中断の影響を排除し、純粋な作業量を可視化

- **自動スケーリングの実装判断**
  - **問題**: 作業時間が長いと、チャートが横に伸びすぎて全体が見えなくなる
  - **検討した選択肢**:
    1. 横スクロールで対応
    2. 固定幅に収まるよう自動縮小
  - **採用**: オプション2（自動縮小）
  - **理由**: 
    - 全体の作業パターンを一目で把握することが最優先
    - スクロール操作は認知負荷が高く、「振り返り」の目的に反する

### **【遭遇した問題と解決💡】**

#### **環境構築段階**
1. **問題**: PowerShellで `&&` によるコマンドチェーンが動作しない
   ```
   npm install && npm install -D tailwindcss postcss autoprefixer && ...
   ```
   - **原因**: PowerShellは `&&` をサポートしていない（Bash構文）
   - **解決**: コマンドを個別に実行するように分割

2. **問題**: `npx tailwindcss init -p` が失敗
   ```
   npm error could not determine executable to run
   ```
   - **原因**: npm cache問題 or インストール不完全
   - **解決**: `tailwind.config.js` と `postcss.config.js` を手動で作成し、標準的な設定を記述

3. **問題**: `temp-app` のファイル移動で一部失敗
   - **原因**: PowerShellの `Move-Item` がディレクトリマージに対応していない（同名フォルダが既に存在する場合）
   - **解決**: エラーが出たものの、重要なファイル（`package.json`, `vite.config.js`等）は正常に移動完了。残った空フォルダは削除

#### **Tailwind CSS v4統合**
4. **問題**: Tailwind CSS v4で`postcss`プラグインエラー
   ```
   [postcss] It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
   ```
   - **原因**: Tailwind v4ではプラグインが分離され、`@tailwindcss/postcss`が必要に
   - **解決**: `npm install -D @tailwindcss/postcss`を実行し、`postcss.config.js`を以下に修正：
     ```javascript
     export default {
       plugins: {
         '@tailwindcss/postcss': {},
         autoprefixer: {},
       },
     }
     ```

#### **コンポーネント実装段階**
5. **問題**: `App.jsx`でSyntax Errorが発生（`export default`が無効）
   - **原因**: コード編集時に誤ってMarkdownのコードブロック記号（` ``` `）がファイルに混入
   - **解決**: 不要な文字列を削除

6. **問題**: `TaskList.jsx`で閉じカッコ不足
   - **原因**: 自動編集時にネストが深く、括弧の対応を誤った
   - **解決**: ユーザーが手動で`))}`を`)))}`に修正（感謝！）

#### **ガントチャート実装段階**
7. **問題**: `GanttChart.jsx` でバーの表示順が逆（新しい作業が左に来る）
   - **原因**: ソート処理が `b.startTime - a.startTime`（降順）になっていた
   ```javascript
   const sorted = [...logs].sort((a, b) => b.startTime - a.startTime); // ❌ 降順
   ```
   - **解決**: `a.startTime - b.startTime` に修正（昇順 = 古い作業が左）
   ```javascript
   const sorted = [...logs].sort((a, b) => a.startTime - b.startTime); // ✅ 昇順
   ```

8. **問題**: 初期実装でガントチャートが想定より長くなり、UIが崩れる
   - **原因**: 作業時間が長い場合、固定のピクセル/分レートで描画すると数千pxになってしまう
   - **解決**: 動的スケーリングロジックを実装（詳細は下記コード参照）

9. **問題**: コンテナ幅の取得タイミングが不明確
   - **原因**: React のレンダリングタイミングとDOM要素のサイズ確定タイミングのズレ
   - **解決**: `useRef` と `useEffect` で初期マウント時にコンテナ幅を取得し、`useMemo` で再計算を最適化

### **【重要なコードやロジック💾】**

#### **設定ファイル**
**tailwind.config.js: content設定**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
- `content`配列で、Tailwindがスキャンする対象ファイルを指定
- `src/**/*.{js,ts,jsx,tsx}` により、全てのコンポーネントファイルでTailwindクラスが有効に

**index.css: Tailwindディレクティブ**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
- Tailwindの各レイヤーをインポート。これにより全てのユーティリティクラスが使用可能に

#### **データフロー**
**Props によるデータフロー（バケツリレー）**
```javascript
// App.jsx: 司令塔
function App() {
  const { tasks, addTask, loading, error } = useTasks();
  return (
    <Layout>
      <TaskForm addTask={addTask} />  {/* 機能を渡す */}
      <TaskList tasks={tasks} loading={loading} error={error} />  {/* データを渡す */}
    </Layout>
  );
}
```

**useTasks.js: Firestoreリアルタイム監視**
```javascript
useEffect(() => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  
  // データが変わったら自動で再レンダリング
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTasks(newTasks);
    setLoading(false);
  }, (err) => {
    setError(err);
    setLoading(false);
  });

  return () => unsubscribe(); // クリーンアップ（監視解除）
}, []);
```

#### **UI実装**
**スクロール制御**
```javascript
// TaskList.jsx
<div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
  {tasks.map(task => <TaskCard key={task.id} {...task} />)}
</div>
```

**モーダル表示の制御（`TaskOverlay.jsx`）**
```javascript
// タスクカードクリック時にモーダルを開く
const handleTaskClick = (task) => {
  setSelectedTask(task);
  setIsModalOpen(true);
};

// モーダル内で該当タスクの timeLogs のみ表示
const taskLogs = timeLogs.filter(log => log.taskId === selectedTask.id);
```

#### **ガントチャートロジック**
**自動スケーリングロジック（`GanttChart.jsx`）**
```javascript
// 実際のスケール計算: コンテナ幅に収まる最小スケール vs 標準スケール で小さい方を採用
const pixelsPerMin = useMemo(() => {
    if (!containerWidth || !ticks.length) return STANDARD_PIXELS_PER_MIN;
    
    // 全体を表示するのに必要な分の最大値（分）
    const maxMin = ticks[ticks.length - 1]; 
    
    // コンテナに収める場合のスケール (少し余白を見るため width - 20 くらいで計算)
    const fitScale = (containerWidth - 20) / maxMin;
    
    // 標準(3px)より小さくなる（＝縮小が必要）なら fitScale を使う
    return Math.min(STANDARD_PIXELS_PER_MIN, fitScale);
}, [containerWidth, ticks]);
```
**解説**:
- `STANDARD_PIXELS_PER_MIN`: 通常時の1分あたりのピクセル数（デフォルト3px）
- `maxMin`: 全作業時間の合計（分）
- `fitScale`: コンテナ幅に収めるために必要なスケール
- `Math.min()` により、「縮小が必要な場合のみ縮小する」ロジックを実現

**積み上げ式の位置計算**
```javascript
// 各作業ログのバーを「積み上げ」で配置
let cumulativeMin = 0; // 累積経過時間
sortedLogs.forEach(log => {
  const durationMin = (log.endTime - log.startTime) / 60000; // ミリ秒→分
  const left = cumulativeMin * pixelsPerMin; // 開始位置
  const width = durationMin * pixelsPerMin; // バーの幅
  
  // 次のバーはこの位置から開始
  cumulativeMin += durationMin;
});
```

### **【次のステップ👯】**
- **タイマー機能の改善**
  - 一時停止・再開機能の追加
  - バックグラウンドでの計測継続
- **ガントチャートの機能拡張**
  - ツールチップ表示（バーにホバーすると詳細情報を表示）
  - カラーコーディング（タスクのステータスや種類で色分け）
- **パフォーマンス最適化**
  - 大量の `timeLogs` がある場合の描画パフォーマンス改善
  - 仮想スクロールの検討
- **ユーザビリティ向上**
  - モーダルのアニメーション追加
  - キーボードショートカット対応（ESCキーで閉じる等）
- **タスクのステータス変更機能**: TODO → DOING → DONE への遷移ボタン追加
- **認証機能**: Firebase Authenticationでユーザーごとのデータ分離

## 📅 2026/01/11 (続き) タイマー精度向上、UIレイアウト刷新、リブランディング

### **【実装内容🔧】**

#### **1. タイマー機能の不具合修正と精度向上**
- **不具合**: ブラウザがバックグラウンドにある間、`setInterval`のスロットリング（実行制限）により、計測時間が実時間より短くなる問題が発生。
- **修正 (ロジック)**:
  - カウントアップ方式（`prev + 1`）を廃止。
  - **タイムスタンプ差分方式**に変更：保存時に `endTime - startTime` を計算して `durationSeconds` を確定。
- **修正 (UI表示)**:
  - 画面上の表示も `Date.now() - startTime` で毎秒再計算するように変更。
  - これにより、バックグラウンド復帰時に表示が一瞬で正しい経過時間に同期されるようになった。

#### **2. アプリ名称変更とリブランディング**
- **変更前**: Kadahira - Gantt
- **変更後**: **Refrecto (β)**
  - "Reflect"（振り返る）の造語的な意味合い（仮）。

#### **3. PC向け2カラムレイアウトの実装**
- **要件**: PCでの一覧性を高め、かつ画面全体のスクロールを排除する。
- **変更内容**:
  - **Desktop (>= 768px)**:
    - 画面全体を `h-screen fixed` に設定。
    - **左カラム**: Timer, TaskForm (内部スクロール)
    - **右カラム**: TaskList (内部スクロール)
    - 各カラムに `overflow-y-auto` を設定し、独立してスクロール可能に。
  - **Mobile (< 768px)**:
    - 従来の縦積みレイアウトを維持（画面全体スクロール）。
- **スタイリング**:
  - `custom-scrollbar` クラスを追加し、スクロールバーの視認性を向上（Webkit対応）。

### **【技術的な判断🤔】**

#### **タイマーの実装方針変更**
- **Before**: `setInterval` で状態をインクリメント
- **After**: `Date` オブジェクトの差分計算
- **理由**: ブラウザの省電力機能によるタイマー遅延は避けられないため、「回数」ではなく「時刻」を正とすることで、環境に依存せず正確な時間を計測するため。

#### **レイアウトのレスポンシブ戦略**
- `App.jsx` と `Layout.jsx` の連携:
  - `Layout.jsx` で外枠の高さ制御（`md:h-screen md:overflow-hidden`）を担当。
  - `App.jsx` で Grid システムによるカラム分割を担当。
  - 役割を分担させることで、将来的にページが増えてもレイアウトの責務がブレないようにした。

### **【重要なコード💾】**

**タイマーの補正ロジック (Timer.jsx)**
```javascript
// 表示用: 1秒ごとに現在時刻との差分を再計算
useEffect(() => {
    if (isActive && startTime) {
        intervalRef.current = setInterval(() => {
            const now = new Date();
            // 表示用も実時刻との差分で計算（スロットリング対策）
            const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsedSeconds(diff);
        }, 1000);
    }
    // ...
}, [isActive, startTime]);

// 保存用: 終了時刻 - 開始時刻
const handleStop = async () => {
    const endTime = new Date();
    // 経過時間を実時刻の差分から計算
    const diffSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    // ... DB保存処理
};
```

#### **4. タスク編集・論理削除機能の実装**
- **要件**:
  - タスク詳細画面から、タスク名・締切・見積時間を編集できること。
  - 削除ボタンを押すと、データを物理削除するのではなく「非表示（論理削除）」にすること。
- **実装内容**:
  - **論理削除 (Soft Delete)**:
    - `tasks` コレクションに `isDeleted` フラグを導入。
    - 削除操作時は `updateDoc` で `isDeleted: true` に更新。
    - データ取得時 (`useTasks.js`) に `.filter(task => !task.isDeleted)` で除外。
  - **日付処理の堅牢化**:
    - Firestoreの `Timestamp` 型と、フォーム由来の `String` 型、JSの `Date` 型が混在する問題に対処。
    - `TaskOverlay` および `TaskList` で、あらゆる型に対応できるフォーマット関数を実装し、エラー（`Objects are not valid as a React child` 等）を解消。

### **【重要なコード💾】**

**論理削除のフィルタリング (useTasks.js)**
```javascript
const unsubscribe = onSnapshot(q, (snapshot) => {
    const newTasks = snapshot.docs
        .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // ...
        }))
        // 論理削除（isDeleted: true）されていないものだけを表示
        .filter(task => !task.isDeleted);
    // ...
});
```

**日付フォーマットの正規化 (TaskList.jsx / TaskOverlay.jsx)**
```javascript
const formatDate = (val) => {
    if (!val) return '未設定';
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toLocaleDateString();
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString(); // Timestamp対応
    return val;
};
```

#### **5. タスク完了・非表示・物理削除の実装**
- **要件変更**:
  - 従来の「削除ボタン」を廃止し、「完了 (Done)」アクションを導入。
  - 完了したタスクは「非表示 (Hide)」にできる（論理削除）。
  - どうしても消したい場合のために「物理削除 (Physical Delete)」を別途用意。
- **実装内容**:
  - **完了ボタン**: ステータスを 'DONE' に更新。
  - **非表示ボタン**: `isVisible` フラグを `false` に更新（後述）。
  - **物理削除ボタン**: 対象タスクと、紐づく全ての `timeLogs` をトランザクション（Batch処理）で一括削除。
  - **UI配置**: `TaskOverlay` 内だけでなく、主画面である `TaskList` の各行にもこれらのアクションボタンを配置し、操作性を向上。

#### **6. DBスキーマのリファクタリング (`isDeleted` → `isVisible`)**
- **変更内容**:
  - 論理削除フラグ `isDeleted` (trueで削除) を、`isVisible` (trueで表示) に変更。
- **理由**:
  - 「削除フラグ」というネガティブな命名よりも、「表示フラグ」というポジティブな命名の方が、状態定義として自然であり、将来的な「アーカイブ機能」などへの拡張性も高いため。
- **互換性維持**:
  - `useTasks.js` 内のフィルタリングにおいて `filter(task => task.isVisible !== false)` とすることで、新スキーマ適用前のデータ（`isVisible` が `undefined`）もデフォルトで表示されるように配慮。

### **【重要なコード💾】**

**Complete/Hide/Physical Deleteのロジック (useTasks.js)**
```javascript
// 物理削除 (Cascade Delete)
const completelyDeleteTask = async (taskId) => {
    // 1. 関連するTimeLogsを一括削除
    const logsQuery = query(collection(db, 'timeLogs'), where('taskId', '==', taskId));
    const logsSnapshot = await getDocs(logsQuery);
    const batch = writeBatch(db);
    logsSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // 2. タスク本体を削除
    await deleteDoc(doc(db, 'tasks', taskId));
};
```

## 📅 2026/01/14 非表示タスクの管理機能とUX改善

### **【実装内容🔧】**

#### **1. 非表示（アーカイブ）タスクの管理機能**
- **課題**: 「完了して非表示にしたタスク」を見返す手段がなく、誤って消した場合や振り返り時に不便だった。
- **実装**:
  - **表示トグル**: `TaskList` ヘッダーに「非表示も表示」チェックボックスを実装。
  - **再表示機能**: 非表示タスクの詳細モーダル内に「再表示(Restore)」ボタンを配置し、リストへの復帰を可能にした。
  - **視覚的区別**: 非表示タスクはグレー背景＋「(非表示)」ラベルで明確に区別。

#### **2. UX/UIの改善**
- **モーダル自動クローズ**: タスクを「非表示」にした際、ユーザーが手動で閉じる手間を省くため、自動的にモーダルを閉じる挙動に変更。
- **ワーディング変更**: タイトルの「事後報告」を、より日常的な「きろく」という言葉に変更し、心理的ハードルを下げた。

#### **3. バグ修正: レガシーデータ互換性**
- **不具合**: 過去に作成したタスク（`isVisible` プロパティを持たないデータ）が、システム上で「非表示（false）」扱いとなり、グレーアウトしてしまう問題が発生。
- **修正**: `useTasks` フック内のデータ整形ロジックで、`isVisible` が `undefined` の場合は `true` (表示) として扱うフォールバック処理を追加。
  ```javascript
  // 旧データ対応: isVisibleが未定義の場合は true (表示) とする
  isVisible: doc.data().isVisible !== false,
  ```

### **【技術的な判断🤔】**
- **フィルタリングロジックの移動**:
  - **Before**: `useTasks` フック内で `filter(t => t.isVisible)` を行い、そもそも非表示タスクはコンポーネントに渡さない設計だった。
  - **After**: UI側で表示/非表示を切り替えたい要望が出たため、`useTasks` は**全件返し**、`App.jsx` や `TaskList.jsx` 側でフィルタリングを行う責務に変更した。これに伴い、`useTasks` の責務が純粋な「データ取得」に近づいた。

### **【重要なコード💾】**
**可視性トグルロジック (App.jsx)**
```javascript
// 表示用タスクと、タイマー用（アクティブのみ）タスクの切り分け
const visibleTasks = React.useMemo(() => tasks.filter(t => t.isVisible !== false), [tasks]);
// リスト表示用はトグル状態に依存
const tasksForList = showHidden ? tasks : visibleTasks;
```
これにより、タイマー選択肢には常に「有効なタスク」だけが表示され、リストでは「過去のタスク」も見れるという、コンテキストに応じた出し分けを実現した。

## 📅 2026/01/23 タイマーの一時停止機能とUX改善

### **【実装内容🔧】**

#### **1. タイマーの挙動変更 (Pause & Resume)**
- **変更前**: Stopボタンを押すと即座にDBへ保存され、カウンターがリセットされていた。
- **変更後**:
  - **Stop (Pause)**: タイマーを一時停止。経過時間は保持される。
  - **Resume**: 停止状態から計測を再開。
  - **きろく (Record)**: 一時停止中のみ出現するボタン。これを押すことで初めてDBへ保存＆リセットされる。

#### **2. UXの改善**
- **ボタン配置**: Start/Resume, Stop, Record の状態に応じた出し分け。
- **誤操作防止**: 一時停止中はタスクの変更をロック（計測途中で別のタスクに切り替わるのを防ぐため）。

### **【技術的な判断🤔】**
- **累積時間の管理 (`accumulatedSeconds`)**:
  - `startTime` (現在のセッション開始時刻) とは別に、過去のセッションの合計時間を `accumulatedSeconds` ステートで保持。
  - 表示時間 = `accumulatedSeconds` + ( `now` - `startTime` )
  - これにより、何度Pause/Resumeを繰り返しても、正確な総経過時間を算出・表示可能にした。

### **【重要なコード💾】**
**一時停止ロジック (Timer.jsx)**
```javascript
const handlePause = () => {
    setIsActive(false);
    const now = new Date();
    // 現在のセッション時間を累積に加算
    const currentSessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const newAccumulated = accumulatedSeconds + currentSessionSeconds;
    
    setAccumulatedSeconds(newAccumulated); // ステート更新
    setStartTime(null); // セッション終了
};
```

## 📅 2026/02/04 レイヤードアーキテクチャへの移行とセキュリティ強化

**Version**: v0.0.1

### **【実装内容🔧】**

#### **1. アーキテクチャの再構築**
- **課題**: コンポーネントやHooks内にFirestoreの操作ロジックが混在し、保守性が低下していた。
- **解決**: **レイヤードアーキテクチャ**を導入し、責務を明確に分離。
  - **Domain層 (`src/domain/`)**: 純粋なビジネスロジック（エンティティ定義、バリデーション）。
    - `Task`, `TimeLog` クラスを作成。
  - **Infrastructure層 (`src/services/`)**: 外部サービス（Firebase）との通信ロジック。
    - `taskService.js`, `timeLogService.js` を作成し、Firestore SDKへの依存をここに集約。
  - **Application層 (`src/hooks/`)**: ユースケースの管理。
    - `useTasks`, `useTimeLogs` をリファクタリングし、Service層経由でデータ操作を行うよう変更。
  - **Presentation層 (`src/components/`)**: UI表示に専念。変更は最小限に留めた。

#### **2. セキュリティと設定管理**
- **課題**: `firebase.js` にAPIキーがハードコーディングされていた。
- **解決**:
  - `.env` ファイルを作成し、環境変数 (`VITE_FIREBASE_*`) で管理。
  - `.gitignore` に `.env` を追加し、リポジトリへの流出を防止。

### **【技術的な判断🤔】**

#### **Domain Entityの導入 (2026/02/05 追記)**
- **ロジックの所在ルール**:
  - **計算ロジック（純粋関数）** はDomain層に記述する。
    - 例: `calculateTotalDuration` を `src/domain/timeLog.js` に配置。
  - **状態管理（変数）** はApplication層が受け持つ。
    - 例: `useTasks` や `Timer` コンポーネントが計算結果を受け取って表示を担当。

- **Firestoreのソート仕様によるバグ修正 (2026/02/06)**
  - **問題**: タスクの締切日 (`deadline`) を編集しても、一覧の表示順序が変わらない現象が発生。
  - **原因**: 以前のバージョンで保存されたデータが `String`型 ("2025-01-01"等) だったのに対し、Firestoreは型ごとに厳密なソートを行う仕様があるため。
    - Firestoreのソート順序: `Timestamp` < `String`
    - 新しく保存された `Timestamp` 型のタスクが、日付に関わらず常にリストの先頭に来てしまっていた。
  - **解決**: `TaskOverlay.jsx` で保存時に必ず `new Date()` を通すことで、全データを `Timestamp` 型に統一するように修正。
    - ユーザーが一度編集して保存すれば、そのタスクは正しい型に更新され、正常にソートされる。

### **【重要なコード💾】**

**計算ロジックの分離 (`src/domain/timeLog.js`)**
```javascript
/**
 * ログの合計時間を計算
 */
export function calculateTotalDuration(logs) {
    return logs.reduce((total, log) => total + (log.durationSeconds || 0), 0);
}
```

**Task Entity (`src/domain/task.js`)**
```javascript
export class Task {
    constructor({ id, title, status, ... }) {
        this.id = id;
        this.title = title;
        // ...
    }

    // ドメインロジック: 遅延判定
    isOverdue() {
        if (!this.deadline || this.isCompleted()) return false;
        return new Date() > this.deadline;
    }

    // Factory Method
    static fromFirestore(id, data) {
        return new Task({
            id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            // ...
        });
    }
}
```

**Task Service (`src/services/taskService.js`)**
```javascript
export const subscribeToTasks = (onUpdate, onError) => {
    // 締切日順（昇順）でソート
    const q = query(collection(db, 'tasks'), orderBy('deadline', 'asc'));
    return onSnapshot(q, (snapshot) => {
        // 取得データをEntityに変換して返す
        const tasks = snapshot.docs.map(doc => Task.fromFirestore(doc.id, doc.data()));
        onUpdate(tasks);
    }, onError);
};
```

## 📅 2026/02/16 カレンダーUIのレイアウト改善とレスポンシブ対応

### **【実装内容🔧】**

#### **1. カレンダー機能の統合とレイアウト刷新**
- **概要**: `Calendar.jsx` コンポーネント（`react-big-calendar`）を本格導入し、タスクの締切日をカレンダー上で可視化。
- **レイアウト変更 (`Layout.jsx`)**:
  - **Mobile (< 768px)**:
    - **上部配置**: カレンダーを画面最上部に配置し、その下にタスクリスト/フォームを配置（`flex-col-reverse`を利用）。
    - **意図**: スマートフォンでは「予定の確認」が最優先アクションであるため、カレンダーへのアクセス性を向上。
  - **Desktop (>= 768px)**:
    - **2カラム構成**: 左側にタスク操作エリア、右側にカレンダーエリアを配置。
    - **幅の調整**: カレンダーエリアを大きく取り (`md:w-4/5`)、視認性を高めた。

#### **2. カレンダーコンポーネントの調整**
- **表示設定**:
  - `month` (月表示) と `week` (週表示) をサポート。
  - 日本語ロケール (`moment/locale/ja`) の適用。
- **スタイリング**:
  - タスクのステータス（TODO, DOING, DONE）に応じたイベントの背景色分け（青, 黄, 緑）。

### **【技術的な判断🤔】**

#### **CSS Flexboxによるレスポンシブ順序制御**
- **手法**: `flex-col-reverse` (Mobile) ↔ `flex-row` (Desktop) の切り替え。
- **理由**: HTML構造を変えることなく、CSSのみで視覚的な順序をデバイスに最適化するため。
  - Mobile: 下から上へ (Calendarが最後にあるので一番上に来る)
  - Desktop: 左から右へ

### **【重要なコード💾】**

**レイアウト制御 (Layout.jsx)**
```javascript
{/* Mobile: col-reverse (カレンダーが上), Desktop: row (左:リスト, 右:カレンダー) */}
<div className="flex flex-col-reverse md:flex-row gap-6 h-full">
    {/* 左側: メインコンテンツ (TaskForm & TaskList) */}
    <div className="w-full md:w-9/20 flex flex-col gap-6">
        {children}
    </div>

    {/* 右側: カレンダーエリア */}
    {tasks && (
        <div className="w-full md:w-4/5">
            <div className="sticky top-4">
                <Calendar tasks={tasks} onEventClick={onTaskClick} />
            </div>
        </div>
    )}
</div>
```

## 📅 2026/02/23 FirebaseAuthによるGoogleログイン機能実装とリブランディング (v0.1.0)

### **【実装内容🔧】**

#### **1. アプリ名称変更とリブランディング (v0.1.0)**
- **変更前**: Refrecto (β)
- **変更後**: **SyncScale (β)**
  - パッケージ名、HTMLタイトル、UIヘッダー、ドキュメントの名称をすべて「SyncScale」に統一。

#### **2. Firebase AuthenticationによるGoogleログインの実装**
- **要件**: ユーザーごとにデータを分離し、個人の作業履歴やタスク管理を行えるようにする。
- **実装内容**:
  - `firebase/auth` を利用して `GoogleAuthProvider` を設定。
  - `AuthContext` と `useAuth` カスタムフックを作成し、アプリ全体でログイン状態 (`currentUser`) を管理。
  - `Layout.jsx` のヘッダーにログイン／ログアウトボタン、およびユーザーアイコンを配置。
  - `App.jsx` を修正し、未ログイン時はメイン画面（タスク管理やカレンダー）を隠し、ログインを促すウェルカム画面を表示するように制御。

#### **3. タスク・実績データのユーザー分離**
- **課題**: 以前は全てのデータが共通コレクションに保存されていたため、誰のデータかわからなかった。
- **実装内容**:
  - `taskService.js` および `timeLogService.js` のデータ保存時に、現在ログイン中のユーザーの `userId` (UID) を付与するように修正。
  - データ取得（`subscribeToTasks`, `subscribeToTimeLogs`）時に、`where("userId", "==", currentUserId)` のクエリ条件を追加。

#### **4. セキュリティルールの強化**
- **変更内容**: `firestore.rules` を更新し、認証済みユーザーのみが自身のデータ(`userId` が自分の `uid` と一致するドキュメント) にのみ `read, create, update, delete` を行えるように制限。これにより、他人のデータを読み書きできない安全な構成を実現。

### **【技術的な判断🤔】**

#### **Context API を用いた認証状態管理**
- **理由**: ログイン状態 (`currentUser`) は `Layout` や `App`、さらには各フック (`useTasks`, `useTimeLogs`) など広範囲で必要になるため、あえてPropsドリルではなく React Context API (`AuthContext`) を用いることで、どのコンポーネント・フックからでもシームレスにアクセスできるように設計。

### **【遭遇した問題と解決💡】**
- **Firestoreの複合インデックスの必要性**: `userId` でのフィルタリング (`where`) と、締切日や作成日時でのソート (`orderBy`) を同時に行うため、Firestoreでの複合インデックス構築が必要となる。ローカル開発時にコンソールから示されるリンクを踏んでインデックスを生成する想定。

#### **匿名アカウント連携（データマージ）時のバグ対応**
- **問題①**: Firebaseで「このアカウントはすでに使われています (`auth/credential-already-in-use`)」エラーキャッチ後に出していた `window.confirm` ダイアログが表示されない。
  - **原因**: ログインポップアップ（別ウィンドウ）から戻ってきた直後のため、Chrome等のブラウザセキュリティ（Cross-Origin-Opener-Policy）により「不審なダイアログ」として強制ブロックされていた。
  - **対応**: 標準の `window.confirm` を廃止し、ReactのStateを利用した専用のカスタムモーダルを描画する方式に変更。
  - さらに、そのカスタムモーダルを汎用的な `ConfirmModal.jsx` へとリファクタリング。背景を `bg-black/40 backdrop-blur-md` に変更し、背後の要素がわずかに透けて見えるモダンなすりガラス風デザインを導入した。「ログアウト時の確認」など他の用途でも全く同じデザイン・仕組みでモーダルを呼び出せるようにし、コードの重複を排除した。旧版である `AccountMergeModal.jsx` は `useAuth.jsx` 内での直接呼び出しに切り替えたため削除した。
- **問題②**: 結合（マージ）を選択した際、Firestoreの `updateDoc` 操作がエラー（`Missing or insufficient permissions`）で弾かれる。
  - **原因**: データ書き換えの直前にGoogleアカウントにログインし直してしまうため、Firestoreのルールから見て「今ログインしている人（Googleアカウント）が、別の人（直前までの匿名ユーザー）のデータを勝手に書き換えようとしている」と判定され、正しくブロックされていた。
  - **対応**: ルールを緩めるのではなく、プログラムの順序を変更。
    1. 匿名状態のまま、データを全てメモリ（配列）に読み込んで待避する。
    2. Googleアカウントでログインし直す（権限切り替え）。
    3. 待避しておいたデータを、自分の新しいデータとして **「新規作成 (`addDoc`)」** して作り直す。旧IDとの紐付け（TimeLog → Taskのひも付け）もメモリ上で置換してから保存。
    これにより、セキュリティルールを担保したまま安全にマージを完了できるようになった。

### **【重要なコード💾】**

**セキュアなデータ引き継ぎ処理 (useAuth.jsx)**
```javascript
// 1. 匿名状態でのバックアップ
const anonymousUid = currentUser.uid;
const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('userId', '==', anonymousUid)));
const tempTasks = tasksSnap.docs.map(doc => ({ oldId: doc.id, data: doc.data() }));

// 2. Googleアカウントへログイン（権限の切り替わり）
const result = await signInWithCredential(auth, credential);
const newUid = result.user.uid;

// 3. 新規作成としてデータを再登録（旧IDの置換も含む）
const taskIdMap = {}; 
for (const item of tempTasks) {
    const taskData = { ...item.data, userId: newUid };
    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    taskIdMap[item.oldId] = docRef.id;
}
```

#### **ガントチャートの入れ替わりバグ修正**
- **問題**: タスク詳細画面の「実績チャート（GanttChart）」において、ログの順番が入れ替わってしまう（右側に順番に積み上がらない）現象が発生した。
  - **原因**: チャート上の並び順を `startTime` （作業の開始日時）ベースで計算していたため。「事後報告」などを使って過去の時間を入力した場合、`startTime`が過去に操作されるため、実際の作業登録順序（時系列順）を無視してグラフの途中に強制的に割り込んでしまっていた。
  - **対応**: `GanttChart.jsx` のソートロジックを修正。`startTime` ではなく、データベースに打刻された実際の登録日時である `createdAt` （`createdAt.getTime()`）を使用してソートするように変更。これにより、事後登録であろうとリアルタイム打刻であろうと「システムに記録された順」で左から右へ正しく積み重なるようになった。

#### **ヘッダーUIの調整とデプロイ (v0.1.0)**
- **変更内容**: `Layout.jsx` におけるヘッダー部分のUIデザインと言葉遣いを改善した。
  - ログイン済みユーザーの表示順序を変更（「ログアウト」ボタンを左、「ユーザーアイコン」を右に配置換え）。
  - 未ログイン時のGoogleログインボタンのテキストを「データを保存 (Google連携)」から直感的な「Google ログイン」に変更。
  - ビルド (`npm run build`) および Firebase Hostingへ最新版のデプロイ (`firebase deploy`) を完了。

#### **タスク完全削除時のFirestore権限エラー修正**
- **問題**: タスク詳細モーダルから「完全に削除」を実行しても削除が完了せずエラーが発生する。
  - **原因**: 削除対象のタスクに紐づく作業ログ (TimeLogs) を取得するためのクエリ `getDocs` において、`userId` による絞り込み条件が含まれていなかったため。`firestore.rules` で「自分の `userId` のみアクセス可（`where`での絞り込み必須）」としているため、セキュリティルール違反として弾かれていた。
  - **対応**: `useTasks.js` および `taskService.js` の `completelyDeleteTask` 処理を修正し、`userId` を引数として伝達。作業ログ取得時のクエリに `where('userId', '==', userId)` を追加することで、Firestoreのセキュリティルールを正常に通過し、関連レコードも含めた安全なカスケード削除ができるようになった。

## 📅 2026/03/16 TaskList構文エラー修正、Timer UI改修、Gemini APIによるサブタスク動的生成

### **【実装内容🔧】**

#### **1. TaskList.jsx の構文エラー修正**
- **修正内容**:
  - JSX内の不要な波括弧 `{ }` の削除。
  - `onUpdate` から `onUpdateTask` への修正（Props名との不整合解消）。
  - モーダル用の `onClose` 呼び出しを削除（TaskList内では不要）。
  - `isVisible` の判定を `!== false` に変更し、デフォルト(`undefined`)時に正しく表示されるよう改善。

#### **2. Timer.jsx のUI改修**
- **変更内容**:
  - 作業内容の入力を「作業」「調査」「MTG」のプリセットボタンと「その他(自由記述)」に切り替える方式に変更。
  - 要素の並び順を「＋手動できろく」→「作業内容」→「START/STOPボタン」→「タイマー」の順に整理。
  - ボタン名を「＋きろく」から「＋手動できろく」に変更。
  - START/STOPボタン群を右端に配置し、タイマー表示をその前に移動。
  - 「手動できろく」ボタンのマージンを調整し、1段階左へ配置。

#### **3. Timerのボタン群をGemini APIで動的生成化**
- **概要**: 作業内容のプリセットボタンを、AIが過去の作業履歴から予測して自動生成する仕組みを構築。
- **新規ファイル**:
  - `src/domain/system.GEMINI`: AIへのシステムプロンプト定義ファイル。
  - `src/services/aiService.js`: 過去の作業履歴(`logs`)と現在の`taskTitle`を元に Gemini 2.5 Flash API を叩き、サブタスクの候補を3つ取得するサービス。
  - `src/hooks/useAiPredictions.js`: API通信の状態管理とローディング制御を担当するカスタムフック。
- **データフロー**:
  - `TaskOverlay.jsx` → `Timer.jsx` へ `logs` を渡し、Timerコンポーネント内でAI生成のサジェスト結果をボタンに反映。

### **【遭遇した問題と解決💡】**

#### **Gemma 3 モデル変更時の400エラー**
- **問題**: Gemma 3へのモデル変更後、`systemInstruction` 非対応による400エラーが発生。
  - **原因**: Gemma 3は `systemInstruction` パラメータをサポートしていない。
  - **対応**: システムプロンプトをユーザーメッセージに統合する形式へ修正。

#### **APIレート制限 (30 RPM) への対策**
- **問題**: タスク詳細を開く度にAPIリクエストが発生し、レート制限に抵触するリスク。
  - **対応**: `useAiPredictions.js` に `taskId` と `logs.length` をキーとしたキャッシュ機構を導入。同一タスクかつログ数不変の場合はリクエストをスキップするように。

#### **完了タスクでの不要なAPI呼び出し**
- **問題**: ステータスが `DONE` のタスクでもAPIリクエストが走ってしまう。
  - **対応**: `Timer.jsx` に `status === 'DONE'` の場合の早期リターン（非表示設定）を追加。

## 📅 2026/05/06 新コンセプトに基づくSystemDesign-v2の策定

### **【実装内容🔧】**

#### **1. 新コンセプト文書の整理**
- `concept.md` に新たな研究コンセプト「相対見積もりを用いた、学生向けタスク管理能力認知支援ツール」を骨子として策定。
- 従来の「時間負債の可視化」に加え、**相対見積もり（S/M/L）** と **着手リードタイム（先延ばし度）** を新たな分析軸として定義。

#### **2. SystemDesign-v2.md の新規作成**
- 3つの制作物（PCのWebアプリ、Chrome拡張機能、スマートフォンアプリ）の全体像とデータフローを設計。
- Firebaseを Single Source of Truth とし、全プロダクトが同一コレクション・同一認証を共有する設計方針を策定。
- Firestoreスキーマの拡張設計:
  - `tasks` に `sizeLabel`, `source`, `startedAt`, `completedAt` フィールドを追加。
  - 新コレクション `conditionLogs` を追加（スマホアプリ連携用）。
- 新規コンポーネント設計:
  - `Dashboard.jsx`: 時間負債サマリー、着手リードタイム、相対見積もり精度の可視化。
  - `SizeLabelSelector.jsx`: S/M/L ラベル選択の共通UI。
- 新規ドメインロジック:
  - `domain/analytics.js`: 時間負債計算、リードタイム計算、サイズラベル別グループ化の純粋関数。
  - `hooks/useAnalytics.js`: 分析データ算出のカスタムフック。
- Phase分割した実装計画（Phase 1〜4）を策定。

### **【技術的な判断🤔】**

#### **Firebase を Single Source of Truth とする設計**
- **理由**: 3つのプロダクト（Webアプリ、Chrome拡張、スマホアプリ）が同一のFirestoreコレクションを共有することで、データ整合性・リアルタイム同期・認証統一を最小コストで実現できるため。
- **利点**: プロダクト間の連携にREST APIサーバーを別途立てる必要がなく、Firestoreの `onSnapshot` だけで即座にデータが反映される。

#### **`startedAt` / `completedAt` フィールドの追加**
- **理由**: 着手リードタイム（先延ばし度）を算出するには、「いつ登録されたか（createdAt）」と「いつ着手したか（startedAt）」の差分が必要。従来のスキーマには着手時刻の概念がなかったため追加。
- **設計判断**: Timer記録時に自動でセットする方式を採用。ユーザーに追加の操作負担をかけないため。

#### **相対見積もり（S/M/L）の導入**
- **理由**: 分単位の見積もりは「見積もり能力が低い学生」にとって難易度が高い。S/M/Lという3段階にすることで、心理的ハードルを下げつつ、見積もり精度のフィードバックを提供できる。

### **【次のステップ👯】**
- Phase 1 の実装開始: 既存機能のリファクタリングと新フィールド対応
  - `SizeLabelSelector.jsx` の実装
  - TaskForm / TaskOverlay への組み込み
  - `startedAt` / `completedAt` の自動セットロジック実装

## 📅 2026/05/07 Chrome拡張機能の初期セットアップとビルド環境構築

### **【実装内容🔧】**

#### **1. プロジェクト構造と環境構築**
- Chrome拡張機能用ディレクトリ `chrome-extension/` の初期化とファイル構造の作成。
- Vite と `@crxjs/vite-plugin` を導入し、Manifest V3 向けのビルド環境（`vite.config.js`）を構築。
- Firebase連携を想定し `firebase` パッケージをインストール。

#### **2. 拡張機能のベーススクリプト作成**
- **Manifest**: `manifest.js` を作成し、権限設定と各スクリプトのエントリポイントを定義。
- **Popup**: `popup.html`, `popup.css`, `popup.js` を作成し、基本的な操作パネル（ログイン、課題取得ボタン等）のUIを構築。
- **Background / Content**: `background.js` (Service Worker) と `content.js` の雛形を作成。ダミーデータをPopupに返す通信テスト用のロジックを実装。
- **Icon**: `icons/` ディレクトリにダミーのPNG画像を配置。

### **【次のステップ👯】**
- 各スクリプトの中身（PopupのUI拡充、Contentのmanabaスクレイピング処理、BackgroundのFirebase連携）の段階的な実装。
#### **3. manabaスクレイピング処理の実装 (content.js)**
- Qiitaの記事を参考に、manabaの「未提出課題一覧」ページ (`/ct/home_library_query`) のHTML構造に対応した抽出ロジックを実装。
- 1列目の課題タイプ（レポート等）を判定基準とし、タイトルと〆切日時を取得する設計。
- Chrome拡張機能はブラウザ上で動作するため、manabaへのログイン認証処理をスキップし、ユーザーがログイン済みのセッションをそのまま利用可能。

#### **4. Firebase連携の実装 (background.js & Offscreen)**
- Manifest V3の制約を回避しFirebase Auth (Google Login) を実現するため、`chrome.offscreen` APIを活用。
- `offscreen.html` を立ち上げ、そこで `signInWithPopup` を実行することでService Workerと認証情報を共有。
- 取得した課題データをFirestoreの `tasks` コレクションへ書き込む処理を実装。
  - 同一ユーザー・同一タイトルの課題は重複登録しない（スキップ）処理を追加。
  - 〆切日時は `Timestamp` 型に変換して保存。
- 機密情報を管理するため `.env` ファイルを導入。
#### **5. 新Firebaseプロジェクト (SyncScale) への移行**
- Firebaseコンソールで新しく作成された `sync-scale` プロジェクトの設定値を `.env` ファイルに反映。
- WebアプリおよびChrome拡張機能の両方の環境変数を更新。
- Firebase CLI設定 (`.firebaserc`) を新プロジェクトID (`sync-scale`) に更新。
