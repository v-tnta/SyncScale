/**
 * 動的チュートリアルガイド（実画面を操作する15ステップ）の文言
 * 対応コンポーネント: src/components/DynamicTutorialGuide.jsx
 *
 * 各ステップは以下の項目を持ちます:
 *   title    … ガイド吹き出しの見出し
 *   desc     … 説明文（\n で改行。画面では whitespace-pre-line で表示）
 *   targetId … ハイライト対象のDOM要素ID（表示位置の制御に使用。文言ではない）
 *   showNext … 手動「次へ進む」ボタンを出すか（true/false。文言ではない）
 *
 * ※ targetId / showNext はチュートリアルの進行ロジックに関わるため、
 *   文言（title / desc）だけを編集したい場合はそれらに触れないでください。
 */

// ステップ番号(1〜16) → ステップ定義
export const TUTORIAL_GUIDE_STEPS = {
  1: {
    title: "1/15. 課題名を入力しましょう ✏️",
    desc: "タスクフォームの「タスク名」入力欄に、\n『線形代数のレポート』と入力してみましょう。",
    targetId: "tutorial-title-input",
    showNext: false,
  },
  2: {
    title: "2/15. 締切日時の確認 📅",
    desc: "ここで締め切り時間を変更できます。\nチュートリアルでは当日の23:59に固定されています。\n確認したら「次へ進む」を押してください。",
    targetId: "tutorial-deadline-input",
    showNext: true,
  },
  3: {
    title: "3/15. 規模感を選択しましょう 📊",
    desc: "課題の規模感（S/M/L）を選択してみましょう。\nご自身の思う基準で結構です！",
    targetId: "tutorial-size-selector",
    showNext: true,
  },
  4: {
    title: "4/15. 課題を登録しましょう 🚀",
    desc: "入力ができたら、「タスクを登録」ボタンを\n押して課題を追加しましょう！",
    targetId: "tutorial-submit-button",
    showNext: false,
  },
  5: {
    title: "5/15. 課題の詳細を開きましょう 🔍",
    desc: "課題がリストに追加されました！\n追加された『線形代数のレポート』をクリックして、\n詳細画面を開いてみましょう。",
    targetId: "tutorial-target-task",
    showNext: false,
  },
  6: {
    title: "6/15. タスク詳細画面です 🔍",
    desc: "ここがタスク詳細画面です。\n課題の情報の編集や、作業時間の記録、提出完了の操作などをここから行えます。\n確認したら「次へ進む」を押してください。",
    targetId: "tutorial-task-detail-container",
    showNext: true,
  },
  7: {
    title: "7/15. 課題の編集機能 ✏️",
    desc: "詳細画面が開きました！\nこちらのボタンから、課題のタイトルや締切、\n規模感（S/M/L）をいつでも編集できます。\n確認したら「次へ進む」を押してください。",
    targetId: "tutorial-edit-button",
    showNext: true,
  },
  8: {
    title: "8/15. 課題の削除機能 🗑️",
    desc: "こちらのボタンから、課題を削除できます。\n予定が変わった時や、誤って登録した時に使用します。\n確認したら「次へ進む」を押してください。",
    targetId: "tutorial-delete-button",
    showNext: true,
  },
  9: {
    title: "9/15. 手動できろくタブに切り替えましょう ⏱️",
    desc: "作業時間はタイマーでも計れますが、\n今回は「手動できろく」タブを\nクリックして切り替えましょう。",
    targetId: "tutorial-manual-tab",
    showNext: false,
  },
  10: {
    title: "10/15. 作業時間を記録しましょう 📝",
    desc: "作業時間（例: 30分）を入力し、右側の\n「きろく」をクリックして時間を記録してみましょう。\nチャートが貯まるのを確認してください。",
    targetId: "tutorial-manual-duration",
    showNext: false,
  },
  11: {
    title: "11/15. 課題を提出完了にしましょう 🏆",
    desc: "時間の記録が終わりました！詳細画面の右上にある\n「提出完了」ボタンをクリックして、\n課題を提出してください。",
    targetId: "tutorial-complete-button",
    showNext: false,
  },
  12: {
    title: "12/15. 今のコンディションを記録しましょう 😊",
    desc: "今の気分（良・中・悪）を選択し、\nひとことメモ（任意）を入力して\n「記録して提出完了」をクリックしてください。",
    targetId: "tutorial-condition-modal",
    showNext: false,
  },
  13: {
    title: "13/15. 完了したタスクを確認しましょう 🏆",
    desc: "課題が完了しました！タスク一覧の右上にある\n「完了したタスクの一覧」をクリックしてください。",
    targetId: "tutorial-completed-list-button",
    showNext: false,
  },
  14: {
    title: "14/15. 振り返りを確認しましょう 📊",
    desc: "完了した課題のコンディションや時間ログが表示されます。\n確認したら、右上の「×」ボタンかモーダルの外側を\nクリックして閉じてください。",
    targetId: "tutorial-completed-modal",
    showNext: false,
  },
  15: {
    title: "15/15. 分析機能をのぞいてみましょう 📈",
    desc: "画面右上の「📈 分析」ボタンから、着手リードタイムや\n見積もり精度、一夜漬け度などをまとめて振り返れる\n分析画面を開けます。\n確認したら「次へ進む」を押してください。",
    targetId: "tutorial-analytics-button",
    showNext: true,
  },
  16: {
    title: "チュートリアル完了！ 🎉",
    desc: "お疲れ様でした！これで基本的な操作はマスターです。\nSyncScaleには、manabaから課題を自動インポートできる\n便利なChrome拡張機能も備わっています。\nそれでは実際に使い始めてみましょう！",
    targetId: null,
    showNext: false,
  },
};

// ガイド吹き出し内の固定ラベル・ボタン文言
export const TUTORIAL_GUIDE_UI = {
  badge: "チュートリアルガイド",
  doneLabel: "完了",
  nextButtonText: "次へ進む →",
  finishButtonText: "サービスに戻る",
};
