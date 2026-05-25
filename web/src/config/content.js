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
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd1UyaDejwWmKtTM8xskrbXVByUMPFdJ20mkGv2plyCzYczKQ/viewform?usp=pp_url&entry.400912505=TEMP_UID",
    buttonText: "アンケートに回答する (Google Forms)",
    completeButtonText: "回答しました",
    pcOnlyMessage: "PCのブラウザで開き直してください。",
  },
  step2: {
    title: "LINEオープンチャットに参加する",
    description: "今後の連絡事項やサポート、研究に関する重要なお知らせは、以下のLINE OpenChatで配信します。必ずご参加の上、「参加しました」を押してください。",
    lineOpenChatUrl: "https://line.me/ti/g2/J6yE-ShE4BGOFoSnm66pMyBFuB9a1PSCfeFgag",
    buttonText: "LINE OpenChat に参加する",
    completeButtonText: "参加しました",
  },
  step3: {
    title: "Chrome拡張機能をインストールする",
    description: "manaba等のLMSから課題を自動取得する「SyncScale Chrome extension」をインストールします。Chromeウェブストアから追加してください。",
    chromeWebStoreUrl: "https://chromewebstore.google.com/detail/syncscale-manaba%E8%AA%B2%E9%A1%8C%E5%8F%96%E5%BE%97/jooecdfhfdaagjhephnhomjeefiplpig?hl=ja&utm_source=ext_sidebar",
    buttonText: "Chrome ウェブストアを開く",
    completeButtonText: "インストールしました",
    pcOnlyMessage: "拡張機能はPCブラウザでのみインストール・使用可能です。",
  },
  step4: {
    title: "動的チュートリアルを開始する",
    description: "SyncScaleの基本的な使い方を、実際の画面を操作しながら学びましょう。下のボタンを押すと、ホーム画面に移動してチュートリアルが開始されます。",
    completeButtonText: "チュートリアルを開始する",
  }
};

// ========================================
// 拡張機能ログインページ（/svc/ext-sync）
// ========================================
export const EXT_SYNC_CONTENT = {
  title: "Chrome拡張機能からの課題インポート",
  loginMessage: "Chrome拡張機能から課題をSyncScaleに取り込むには、Googleログインが必要です。",
  buttonText: "Googleでログイン",
};
