/**
 * ページ単位の文言
 *
 * 同意書ページ / オンボーディング / 拡張機能ログインページ で表示する
 * まとまった文章を集約しています。
 */

// ========================================
// 同意書ページ（/agreement）
// ========================================
export const AGREEMENT_CONTENT = {
  title: "研究参加への同意書",
  body: `本研究は、大学生活におけるタスク管理、見積もり時間、実際の作業時間を記録・分析し、学習プロセスの改善と生産性向上を支援する「SyncScale」ツールの有用性を検証することを目的としています。

1. 研究期間について
本研究の期間は、2026年⭕️月⭕️日から2026年⭕️月⭕️日までです。研究終了時点で同意して参加くださった方々に関するデータを集計します。

2. 研究への参加と同意の自由について
本研究への参加は自由です。説明を受けた後、参加に同意される場合のみ、本システムをご利用ください。同意されない場合でも、いかなる不利益も生じません。

3. 収集するデータについて
ご提供いただくデータは以下の通りです：
- Googleアカウントの識別子（ログインおよび本人確認のため）
- 登録されたタスクの情報（タスク名、期限、カテゴリ、ステータス、タスク完了時のコンディション）
- 課題の見積もりおよび実際の作業時間ログ
- システムの利用状況 (ログイン状況、滞在時間、各機能の使用状況)
- オンボーディングおよび事前アンケート・事後アンケートの回答進捗情報
- 事前アンケート・事後アンケートへの回答内容

4. データの取り扱いとプライバシー保護について
使用中に収集されたデータは暗号化された安全なサーバーに保管されます。収集したデータは、研究目的（分析、学術論文、学会発表など）のみに使用し、個人が特定されないように匿名化した上で統計処理を行います。

5. 同意の撤回について
本研究への参加は研究期間内であればいつでも撤回することができます。設定画面より「同意の撤回」を行うと、収集されたすべてのデータ（タスク、ログ、個人情報）は完全に削除され、研究参加は終了します。

6. お問い合わせ
本研究に関するお問い合わせやご質問は、研究責任者（茨城大学 鎌田賢 メール masaru.kamada.snoopy@vc.ibaraki.ac.jp）または研究担当者（LINE OpenChatまたは開発者連絡先）までご連絡ください。`,
  version: "1.1",
  buttonText: "上記の研究内容の説明を理解し、同意して研究に参加する",
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

// ========================================
// プライバシーポリシーページ（/privacy）
//   Chrome拡張機能向けの法務文書。各 section は
//   { heading, text?, items? } の組み合わせで構成。
//   さらに subheading 付きのグループ（groups）を持つこともあります。
// ========================================
export const PRIVACY_POLICY = {
  title: "プライバシーポリシー",
  subtitle: "SyncScale - manaba課題取得 Chrome拡張機能",
  lastUpdated: "最終更新日: 2026年5月17日",
  backLink: "← SyncScale に戻る",
  sections: [
    {
      heading: "1. はじめに",
      text: "SyncScale（以下「本サービス」）は、大学の学習管理システム「manaba」から課題情報を取得し、タスク管理を支援するChrome拡張機能です。本プライバシーポリシーでは、本サービスが収集する情報、その利用目的、および情報の取り扱いについて説明します。",
    },
    {
      heading: "2. 収集する情報",
      text: "本サービスは、以下の情報を収集します。",
      groups: [
        {
          subheading: "2.1 認証情報",
          items: ["Googleアカウントのメールアドレス（ログイン・ユーザー識別のため）"],
        },
        {
          subheading: "2.2 学習管理システムの課題情報",
          items: ["課題名", "科目名", "課題の種類", "〆切日時", "課題および科目のURL識別子"],
        },
        {
          subheading: "2.3 設定情報",
          items: ["manabaのドメイン設定（例: manaba.ibaraki.ac.jp）"],
        },
      ],
    },
    {
      heading: "3. 情報の利用目的",
      text: "収集した情報は、以下の目的にのみ使用します。",
      items: [
        "ユーザーの認証およびアカウントの識別",
        "manabaからの課題情報の取得および表示",
        "取得した課題のSyncScaleへの登録・管理",
        "manabaドメイン設定の保存",
      ],
    },
    {
      heading: "4. 情報の保存",
      text: "認証情報および課題データは、Google Firebase（Cloud Firestore）に安全に保存されます。ドメイン設定は、Chrome のローカルストレージ（chrome.storage.sync）に保存されます。",
    },
    {
      heading: "5. 第三者への提供",
      text: "本サービスは、収集した情報を第三者に販売、貸与、または共有することはありません。データはサービスの提供に必要なGoogle Firebase のインフラストラクチャ上でのみ処理されます。",
    },
    {
      heading: "6. データのセキュリティ",
      text: "本サービスは、Firebase Security Rules によるアクセス制御を実施し、ユーザー本人のデータにのみアクセスできるよう保護しています。また、すべての通信はHTTPSにより暗号化されています。",
    },
    {
      heading: "7. ユーザーの権利",
      text: "ユーザーは、以下の権利を有します。",
      items: [
        "拡張機能のアンインストールにより、ローカルに保存された設定データを削除すること",
        "SyncScale上で自身の課題データを削除すること",
        "Googleアカウントの設定から、本サービスへのアクセス権を取り消すこと",
      ],
    },
    {
      heading: "8. Webサイトの閲覧履歴について",
      text: "本サービスは、ユーザーのWeb閲覧履歴を収集、保存、または利用しません。manabaのページにアクセスするのは、ユーザーが「課題を取得する」ボタンを明示的にクリックした場合のみであり、取得するのは課題に関する情報のみです。",
    },
    {
      heading: "9. ポリシーの変更",
      text: "本プライバシーポリシーは、必要に応じて更新されることがあります。重要な変更がある場合は、拡張機能のアップデートを通じてお知らせします。",
    },
    {
      heading: "10. お問い合わせ",
      text: "本プライバシーポリシーに関するご質問は、SyncScaleの開発者までお問い合わせください。",
    },
  ],
};
