/**
 * 基本コンポーネントのUI文言
 *
 * コンポーネント単位の名前空間オブジェクトで整理しています。
 * 文言を編集したいときは、該当する名前空間を書き換えてください。
 * 数値の整形（時間・分など）はロジック側に残しているため、
 * ここには「ラベル・見出し・ボタン・メッセージ」を中心に集約しています。
 */

// ========================================
// 規模感セレクター（SizeLabelSelector.jsx）
// ========================================
export const SIZE_LABEL_SELECTOR = {
  options: [
    { value: "S", label: "S (すぐ)" },
    { value: "M", label: "M (半日〜1日)" },
    { value: "L", label: "L (数日)" },
  ],
};

// ========================================
// タスク登録フォーム（TaskForm.jsx）
// ========================================
export const TASK_FORM = {
  titleLabel: "タスク名",
  titlePlaceholder: "例: 数学の課題、レポート作成",
  deadlineLabel: "締切日時",
  sizeLabel: "規模感 (相対見積もり)",
  submitButton: "タスクを登録",
};

// ========================================
// タスク一覧（TaskList.jsx）
// ========================================
export const TASK_LIST = {
  loading: "読み込み中...",
  error: "エラーが発生しました。設定を確認してください。",
  heading: "タスク一覧",
  completedListButton: "完了したタスクの一覧",
  empty: "タスクはまだありません。",
  deadlinePrefix: "📅 締切: ",
  unsetDate: "未設定",
  completeTitle: "完了にする",
  completeTitleTutorial: "チュートリアル中は詳細画面から完了してください",
};

// ========================================
// タスク詳細オーバーレイ（TaskOverlay.jsx）
// ========================================
export const TASK_OVERLAY = {
  titlePlaceholder: "タスク名",
  statusFallback: "これからやる",
  deadlineLabel: "〆切:",
  unsetDate: "未設定",
  sectionTimer: "タイマー",
  sectionCondition: "コンディション",
  conditionLoading: "コンディションを読み込み中...",
  moodLabels: { good: "良い", fair: "普通", poor: "悪い" },
  reflectionLabel: "提出時のふりかえり",
  noMemo: "（メモはありません）",
  noConditionRecord: "コンディションの記録はありません。",
  chartSection: "実績チャート",
  // ボタン（title属性 / ラベル兼用）
  buttons: {
    cancel: "キャンセル",
    save: "保存",
    revert: "未提出に戻す",
    delete: "削除",
    edit: "編集",
    complete: "提出完了",
  },
  // 確認・警告メッセージ
  titleRequiredAlert: "タイトルは必須です",
  revertConfirm: (title) => `タスク「${title}」を未提出（これからやる）に戻しますか？`,
  revertFailedAlert: "未提出に戻す処理に失敗しました。",
  physicalDeleteConfirm: (title) =>
    `タスク「${title}」を完全に削除しますか？\n\n※この操作は取り消せません。\n※関連する作業ログも全て削除されます。`,
};

// ========================================
// タイマー / 手入力（Timer.jsx）
// ========================================
export const TIMER = {
  tabRecord: "きろく",
  tabManual: "手動できろく",
  todoLabel: "やること",
  todoPlaceholder: "例: 資料作成",
  recordButton: "きろく",
  startButton: "スタート",
  restartButton: "リスタート",
  stopButton: "ストップ",
  manualDoneLabel: "やったこと",
  manualDonePlaceholder: "例: 調べ物 / 発表練習 など",
  workTimeLabel: "作業時間",
  durationPlaceholder: "60",
  minuteUnit: "分",
  manualRecordButton: "きろく",
  // サブタスク名が未入力のときに表示する確認モーダル
  subTaskModalTitle: "作業名を入力してください",
  subTaskModalCancel: "キャンセル",
  subTaskModalSave: "保存",
  // 手動記録時のデフォルト作業名（保存値）
  manualDefaultSubTaskName: "事後報告",
  // 入力チェックのアラート
  subTaskRequiredAlert: "作業内容を入力してください",
  durationRequiredAlert: "時間を入力してください",
};

// ========================================
// 設定パネル（SettingsPanel.jsx）
// ========================================
export const SETTINGS_PANEL = {
  header: "設定",
  userFallback: "ユーザー",
  emailFallback: "メールアドレス未設定",
  // 締切前通知
  notifTitle: "締切前に通知",
  notifDescEnabled: (label) => `締切の${label}前にお知らせします`,
  notifDescDisabled: "タスクの締切前にお知らせします",
  notifMinutesLabel: "何分前に通知するか",
  notifPresetSuffix: "前",
  notifNote: "📱 通知はスマートフォンアプリ（インストール版）でのみ届きます。Web版では設定の保存のみ行えます。",
  // 設定メニュー
  restartTutorialTitle: "チュートリアルの再実行",
  restartTutorialSub: "使い方をもう一度確認する",
  onboardingTitle: "研究参加オンボーディング",
  onboardingSub: "各種アンケートやリンクを再確認する",
  // 下部アクション
  logoutButton: "ログアウト",
  withdrawButton: "研究同意の撤回",
  // ローディング表示
  loadingDefault: "処理中...",
  loadingTutorialPreparing: "チュートリアルを準備中...",
  loadingWithdrawing: "同意を撤回し、データを削除中...",
  // 最終確認モーダル（2段階目）
  finalConfirmTitle: "⚠️ 同意撤回の最終確認",
  finalConfirmConfirmText: "はい、本当に削除する",
  finalConfirmCancelText: "いいえ、キャンセル",
  finalConfirmLead: "研究内容への同意を撤回し、本当にデータをすべて削除しますか？",
  finalConfirmNote: "※ この操作を実行すると、あなたのタスク、時間ログ、コンディションログ、利用状況ログ、および設定が完全に削除され、復元することはできなくなります。",
  // アラート・確認
  notifSaveFailedAlert: "通知設定の保存に失敗しました。",
  restartTutorialConfirm: "チュートリアルを再実行しますか？\n（一時的にオンボーディング画面に戻りますが、登録したデータは消えません）",
  restartTutorialFailedAlert: "チュートリアルのリセットに失敗しました。",
  withdrawErrorAlert: "処理中にエラーが発生しました。",
};

// ========================================
// 分析ダッシュボード（AnalyticsPanel.jsx）
// ========================================
export const ANALYTICS_PANEL = {
  header: "分析ダッシュボード",
  closeButton: "閉じる",
  noData: "データなし",
  // 期間切り替え（今月／全期間）
  period: {
    month: "今月",
    all: "全期間",
  },
  sizeDescription: {
    S: "小規模 (すぐやる)",
    M: "中規模 (半日〜1日)",
    L: "大規模 (数日)",
  },
  // 着手リードタイム
  leadTime: {
    icon: "⏱",
    title: "平均着手タイミング",
    description: "課題ごとに、最初の作業ログを記録した時点が、締切の何日前であったかの平均値です。",
    beforeDeadlinePrefix: "締切の ",
    beforeDeadlineUnit: "日前",
    afterDeadlinePrefix: "締切の ",
    afterDeadlineUnit: "日後 (超過)",
    countLabel: (count) => `（計測数: ${count}件）`,
  },
  // サイズ別の平均作業時間
  estimation: {
    icon: "🎯",
    title: "サイズ別の平均作業時間",
    description: "S/M/L ごとに、実際にかかった作業時間の平均です。S→M→L で増えていれば、サイズ感が実態と合っています。",
    avgLabel: (count) => `平均 / ${count}件`,
    consistentMessage: "✅ サイズが大きいほど作業時間も長く、サイズ感が実態と合っています。",
    inconsistentMessage: "⚠️ サイズの大小と実際の作業時間が逆転しています。ラベルの付け方を見直すヒントになります。",
  },
  // 一夜漬け度
  cramming: {
    icon: "🌙",
    title: "一夜漬け度",
    description: "各タスクの全作業時間のうち、締切24時間前以降（超過分含む）に行った割合の平均です。高いほど直前に作業が集中しています。",
    empty: "締切と作業ログが揃ったタスクがまだありません。",
    overallLabel: "全体の一夜漬け度",
    summaryLabel: (taskCount, crammedCount) =>
      `対象 ${taskCount}件中 ${crammedCount}件が「直前集中型」（50%以上）`,
    topTasksLabel: "直前集中だったタスク",
  },
  // よく作業する時間帯
  timeOfDay: {
    icon: "🕐",
    title: "よく作業する時間帯",
    description: "どの時間帯にどれくらい作業しているかを、作業時間で集計しています。",
    empty: "作業ログがたまると、よく作業する時間帯が見えてきます。",
  },
  // 放置タスク
  stalled: {
    icon: "🚨",
    title: "放置タスク",
    description: "「とりかかり中」のまま3日以上作業していないタスクです。手をつけたまま止まっている課題を見逃さないために。",
    empty: "✅ 放置されているタスクはありません。順調です！",
    overdueLabel: "締切超過",
    stalledSuffix: "放置",
  },
};

// ========================================
// カレンダー（Calendar.jsx）
// ========================================
export const CALENDAR = {
  messages: {
    next: "次へ",
    previous: "前へ",
    today: "今日",
    month: "月",
    week: "週",
    date: "日付",
    time: "時間",
    event: "イベント",
    noEventsInRange: "この期間にタスクはありません",
  },
  // 週表示で「作業した時間」を緑色の帯（実働時間分の長方形）として表示する際のラベル
  workLog: {
    defaultName: "作業",
    title: (name, minutes) => `${name}（${minutes}分）`,
  },
};

// ========================================
// ガントチャート（GanttChart.jsx）
// ========================================
export const GANTT_CHART = {
  noLogs: "作業ログがありません。",
  zeroDuration: "作業時間が0分です。",
  heading: "実績ガントチャート",
  defaultSubTaskName: "作業",
};

// ========================================
// 日時ピッカー（DateTimePicker.jsx）
// ========================================
export const DATETIME_PICKER = {
  doneButton: "完了",
  placeholder: "日時を選択",
};

// ========================================
// 全体レイアウト（Layout.jsx）
// ========================================
export const LAYOUT = {
  analyticsButton: "📈 分析",
  analyticsButtonTitle: "分析画面を開く",
  settingsButtonTitle: "アカウント設定を開く",
  userFallback: "ユーザー",
  footer: "© 2026 v-tnta",
};
