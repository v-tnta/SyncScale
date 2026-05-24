/**
 * SyncScale コンテンツ設定
 * 
 * 【使い方】
 * このファイルの各変数を編集するだけで、
 * 対応するページの内容が更新されます。
 */

// ========================================
// 同意書ページ（/agreement）
// ========================================
export const AGREEMENT_CONTENT = {
  title: "研究参加への同意書",
  body: `研究課題名：SyncScale を用いた学習管理と生産性向上に関する研究

本研究は、大学生活におけるタスク管理、見積もり時間、実際の作業時間を記録・分析し、学習プロセスの改善と生産性向上を支援する「SyncScale」システムの有用性を検証することを目的としています。

1. 研究への参加と同意の自由について
本研究への参加は自由です。説明を受けた後、参加に同意される場合のみ、本システムをご利用ください。同意されない場合でも、いかなる不利益も生じません。

2. 収集するデータについて
ご提供いただくデータは以下の通りです：
- Googleアカウントの識別子（ログインおよび本人確認のため）
- 登録されたタスク情報（タスク名、期限、カテゴリ、ステータス）
- 見積もり時間および実際の作業時間ログ
- オンボーディングおよびアンケートの回答進捗情報

3. データの取り扱いとプライバシー保護について
収集したデータは、研究目的（分析、学術論文、学会発表など）のみに使用し、個人が特定されない形で匿名化または統計処理を行います。データは暗号化された安全なサーバーに保管されます。

4. 同意の撤回について
本研究への参加はいつでも撤回することができます。設定画面より「同意の撤回」を行うと、収集されたすべてのデータ（タスク、ログ、個人情報）は完全に削除され、研究参加は終了します。

5. お問い合わせ
本研究に関するお問い合わせやご質問は、研究担当者（LINE OpenChatまたは開発者連絡先）までご連絡ください。`,
  version: "1.0",
  buttonText: "上記の内容に同意し、Googleでログインする",
  buttonTextLoggedIn: "上記の内容に同意して参加する",
};

// ========================================
// オンボーディング（/info）各ステップ
// ========================================
export const ONBOARDING_STEPS = {
  step1: {
    title: "初回アンケートに回答する",
    description: "研究の事前調査として、短いアンケートにご協力ください。アンケート回答完了後、この画面に戻り「回答しました」を押してください。",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLScP_7PXZ9m4bL3pX6XlXXXXXXXXX/viewform", // 仮のURL。後で差し替え可能。
    buttonText: "アンケートに回答する (Google Forms)",
    completeButtonText: "回答しました",
    pcOnlyMessage: "PCのブラウザで開き直してください。",
  },
  step2: {
    title: "Chrome拡張機能をインストールする",
    description: "manaba等のLMSから課題を自動取得する「SyncScale Chrome extension」をインストールします。Chromeウェブストアから追加してください。",
    chromeWebStoreUrl: "https://chromewebstore.google.com/detail/xxxxxxxxxxxxxxxx", // 仮のURL。
    buttonText: "Chrome ウェブストアを開く",
    completeButtonText: "インストールしました",
    chromeDownloadUrl: "https://www.google.com/intl/ja_jp/chrome/",
  },
  step3: {
    title: "Webアプリのチュートリアル",
    description: "SyncScaleの基本的な使い方（タスク作成、見積もり設定、タイマーでの時間計測など）を確認しましょう。",
    completeButtonText: "チュートリアルを完了する",
  },
  step4: {
    title: "スマホアプリをインストールする",
    description: "外出先でも見積もりやタイマー計測を行えるスマホアプリ（Flutter版）をインストールしてください。以下からダウンロードできます。",
    iosUrl: "https://apps.apple.com/app/syncscale",
    androidUrl: "https://play.google.com/store/apps/details?id=app.syncscale",
    completeButtonText: "インストールしました",
  },
  step5: {
    title: "すべての準備が完了しました！ 🎉",
    description: "お疲れ様でした。これでSyncScaleを利用するすべての準備が整いました。今後の案内やサポート、連絡事項は以下のLINE OpenChatで配信しますので、必ずご参加ください。",
    lineOpenChatUrl: "https://line.me/ti/g2/XXXXXXXXXX",
    lineOpenChatText: "📢 研究参加者用のLINE OpenChatに参加する（連絡用）",
    goToAppButtonText: "SyncScaleを使い始める",
  },
};

// ========================================
// 拡張機能ログインページ（/svc/ext-sync）
// ========================================
export const EXT_SYNC_CONTENT = {
  title: "Chrome拡張機能からの課題インポート",
  loginMessage: "Chrome拡張機能から課題をSyncScaleに取り込むには、Googleログインが必要です。",
  buttonText: "Googleでログイン",
};
