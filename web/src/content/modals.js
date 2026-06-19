/**
 * 各種モーダルの文言
 *
 * モーダルごとに名前空間オブジェクトで整理しています。
 * 文言を編集したいときは、該当するモーダルのオブジェクトを書き換えてください。
 */

// ========================================
// 確認モーダル（ConfirmModal.jsx）の既定ラベル
// ========================================
export const CONFIRM_MODAL = {
  defaultConfirmText: "OK",
  defaultCancelText: "キャンセル",
};

// ========================================
// 研究参加への同意撤回（ConsentWithdrawModal.jsx）
// ========================================
export const CONSENT_WITHDRAW_MODAL = {
  title: "⚠️ 研究参加への同意撤回",
  confirmText: "同意を撤回しデータを削除する",
  confirmingText: "処理中...",
  cancelText: "キャンセル",
  lead: "研究参加への同意を撤回しようとしています。",
  noticeHeading: "🚨 重要な注意点：",
  notices: [
    "あなたの全データ（タスク、作業記録、コンディションログ、利用状況ログ等）は、復元不可能な形で完全に削除されます。",
    "アンケートの進捗情報や、オンボーディング進捗も同時にクリアされます。",
    "同意撤回の記録（倫理的エビデンスとしてのログ）のみが残り、研究から即座に離脱します。",
  ],
  footnote: "よろしければ、下の「同意を撤回しデータを削除する」ボタンを押してください。",
  errorAlert: "同意の撤回に失敗しました。",
};

// ========================================
// モバイルアプリインストール促進（MobileAppPromoModal.jsx）
// ========================================
export const MOBILE_APP_PROMO_MODAL = {
  title: "モバイルアプリインストールのお願い",
  paragraphs: [
    "SyncScaleは、タスク管理と実働時間の記録を組み合わせることで効果を発揮するシステムです。",
    "外出先やスマートフォンからも手軽に時間計測やコンディションの入力を行っていただけるよう、便利なスマホアプリをご用意しています。ぜひインストールしてご活用ください。",
    "以下のストアボタンより、アプリをインストールしてGoogleアカウントでログインしてください。",
  ],
  iosButtonText: "App Store からダウンロード (iOS)",
  androidButtonText: "Google Play からダウンロード (Android)",
  laterButtonText: "あとで通知する",
};

// ========================================
// Chrome拡張機能の使い方（ExtensionGuideModal.jsx）
// ========================================
export const EXTENSION_GUIDE_MODAL = {
  headerTitle: "Chrome拡張機能の使い方",
  slides: [
    {
      title: "manabaの課題を自動で取り込もう",
      description: "SyncScaleのChrome拡張機能を使うと、manabaに掲載されている課題を一括で取り込めます。手入力の手間がなくなります！",
      imagePlaceholder: "manaba連携イメージ",
      icon: "🔗",
    },
    {
      title: "Step 1: 拡張機能アイコンをクリック",
      description: "ブラウザ右上のSyncScale拡張機能アイコンをクリックすると、ポップアップが表示されます。",
      imagePlaceholder: "拡張機能アイコンクリック画面",
      icon: "🧩",
    },
    {
      title: "Step 2: 課題を取り込む",
      description: "「課題を取り込む」ボタンをクリックすると、manabaから課題が自動的にSyncScaleに追加されます。",
      imagePlaceholder: "課題取り込みボタン画面",
      icon: "📥",
    },
    {
      title: "準備完了！",
      description: "これでmanabaの課題がSyncScaleに反映されます。新しい課題が出たら、同じ手順で取り込めます。",
      imagePlaceholder: "取り込み完了画面",
      icon: "✅",
    },
  ],
  prevButtonText: "← 戻る",
  nextButtonText: "次へ →",
  finishButtonText: "使い始める！ 🚀",
  skipButtonText: "スキップして閉じる",
};

// ========================================
// 規模見積もり入力（TaskSizeEstimateModal.jsx）
// ========================================
export const TASK_SIZE_ESTIMATE_MODAL = {
  titleMultiple: "複数の新しい課題があります！",
  titleSingle: "新しい課題が見つかりました！",
  question: "この課題の規模（S/M/L）はどれくらいですか？",
  sizeOptions: [
    { value: "S", color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300", desc: "すぐ終わる" },
    { value: "M", color: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300", desc: "半日〜1日" },
    { value: "L", color: "bg-red-100 text-red-700 hover:bg-red-200 border-red-300", desc: "数日かかる" },
  ],
  submitButtonText: "決定して次へ",
};

// ========================================
// コンディション入力（ConditionInputModal.jsx）
// ========================================
export const CONDITION_INPUT_MODAL = {
  title: "お疲れ様でした！",
  conditionQuestion: "今の気分（コンディション）はどうですか？",
  conditionOptions: [
    { value: "good", emoji: "😊", label: "良い" },
    { value: "fair", emoji: "🙂", label: "普通" },
    { value: "poor", emoji: "😥", label: "悪い" },
  ],
  memoLabel: "ひとことメモ (任意)",
  memoPlaceholder: "次に活かせることや、今の気持ちを残そう...",
  cancelButtonText: "キャンセル",
  submitButtonText: "記録して提出完了",
};

// ========================================
// 提出完了したタスクの一覧（CompletedTasksModal.jsx）
// ========================================
export const COMPLETED_TASKS_MODAL = {
  title: "提出完了したタスクの一覧",
  emptyMessage: "完了したタスクはまだありません。",
  completedBadge: "提出完了",
  /** 件数表記（例: 3 件） */
  countLabel: (count) => `${count} 件`,
};
