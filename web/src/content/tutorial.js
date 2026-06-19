/**
 * 静的チュートリアル（未ログイン向け体験ツアー）の文言
 * 対応コンポーネント: src/components/Tutorial.jsx
 *
 * 説明文の一部は太字や改行を含むため、セグメント配列で表現しています。
 *   { text: "文字列" }            … 通常テキスト
 *   { text: "文字列", bold: true } … 太字（<strong>）
 *   { text: "文字列", br: true }   … このテキストの後ろで改行（<br />）
 * Tutorial.jsx 側の RichText ヘルパーがこの配列を描画します。
 */

export const TUTORIAL = {
  // 各ステップのヘッダー（見出し・サブ見出し）
  steps: [
    { title: "SyncScaleへようこそ！", subtitle: "タスク管理 × 時間計測で、学習を最適化するアプリです。" },
    { title: "タスクを一覧で管理", subtitle: "課題の締切やサイズを一目で把握できます。" },
    { title: "作業時間をタイマーで計測", subtitle: "「何に・どれくらい時間をかけたか」を自動で記録します。" },
    { title: "締切が近づくとアラート表示", subtitle: "24時間以内の締切は赤く点滅し、期限切れはグレーアウトします。" },
    { title: "さあ、始めましょう！", subtitle: "Googleアカウントでログインすると、すべての機能が使えます。" },
  ],

  // Step 0: ウェルカム
  welcome: {
    leadBefore: "SyncScaleは、大学の課題やタスクを",
    leadHighlight: "「見える化」",
    leadAfter: "して管理するアプリです。",
    features: [
      { emoji: "📋", label: "タスク管理" },
      { emoji: "⏱️", label: "時間計測" },
      { emoji: "📊", label: "分析・可視化" },
    ],
  },

  // Step 1: タスク一覧のヒント
  taskListHint: [
    { text: "タスクの" },
    { text: "見積もり所要時間", bold: true },
    { text: "を " },
    { text: "S・M・L", bold: true },
    { text: " でラベリングでき、", br: true },
    { text: "優先度を直感的に把握できます。" },
  ],

  // Step 2: タイマー
  timer: {
    timerTab: "⏱ タイマー",
    manualTab: "✏️ 手入力",
    todoLabel: "やること",
    todoPlaceholder: "例: 資料作成",
    sampleTime: "00:25:30",
    recordButton: "きろく",
    stopButton: "ストップ",
    hint: [
      { text: "タイマーで計測した作業時間は自動でログに残り、", br: true },
      { text: "チャート", bold: true },
      { text: "として可視化されます。" },
    ],
  },

  // Step 3: 締切アラート（サンプル行 + ヒント）
  alert: {
    rows: [
      { title: "グループ発表 資料作成", deadline: "📅 締切: 2026/5/25 10:00", badge: "通常" },
      { title: "英語リスニング練習", deadline: "⚠️ 締切: 2026/5/17 18:00", badge: "24h以内" },
      { title: "過去の課題", deadline: "📅 締切: 2026/5/10 23:59", badge: "期限切れ" },
    ],
    hint: [
      { text: "締切が近い課題を見逃しません。", br: true },
      { text: "色と点滅", bold: true },
      { text: "で視覚的に危険度を伝えます。" },
    ],
  },

  // Step 4: ログイン促進
  login: {
    lead: [
      "Googleアカウントでログインするだけで、",
      "あなた専用のタスク管理環境が整います。",
    ],
    benefits: [
      "複数デバイスでデータが自動同期",
      "Chrome拡張機能で大学の課題を自動取得",
      "作業ログの蓄積と分析",
      "無料で利用可能",
    ],
    completeButtonText: "チュートリアルを完了する",
    googleButtonText: "Googleでログイン",
  },

  // ナビゲーション
  nav: {
    backText: "← 戻る",
    nextText: "次のステップへ",
    backToTutorialText: "← チュートリアルに戻る",
  },
};

// チュートリアルの一覧表示で使うモックタスク
export const TUTORIAL_MOCK_TASKS = [
  { id: 1, title: "英語リスニング練習", deadline: "2026/5/4 18:00", sizeLabel: "S", status: "TODO" },
  { id: 2, title: "レポート課題 第3回", deadline: "2026/5/17 23:59", sizeLabel: "M", status: "DOING" },
  { id: 3, title: "グループ発表 資料作成", deadline: "2026/5/25 10:00", sizeLabel: "L", status: "TODO" },
];
