import React from 'react';

/**
 * SyncScale Chrome 拡張機能向けプライバシーポリシーページ
 * Chrome ウェブストア審査で必要なプライバシーポリシーの URL として使用する
 */
export default function PrivacyPolicy() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>プライバシーポリシー</h1>
        <p style={styles.subtitle}>SyncScale - manaba課題取得 Chrome拡張機能</p>
        <p style={styles.date}>最終更新日: 2026年5月17日</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. はじめに</h2>
          <p style={styles.text}>
            SyncScale（以下「本サービス」）は、大学の学習管理システム「manaba」から課題情報を取得し、
            タスク管理を支援するChrome拡張機能です。本プライバシーポリシーでは、本サービスが収集する情報、
            その利用目的、および情報の取り扱いについて説明します。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. 収集する情報</h2>
          <p style={styles.text}>本サービスは、以下の情報を収集します。</p>
          <h3 style={styles.subheading}>2.1 認証情報</h3>
          <ul style={styles.list}>
            <li>Googleアカウントのメールアドレス（ログイン・ユーザー識別のため）</li>
          </ul>
          <h3 style={styles.subheading}>2.2 学習管理システムの課題情報</h3>
          <ul style={styles.list}>
            <li>課題名</li>
            <li>科目名</li>
            <li>課題の種類</li>
            <li>〆切日時</li>
            <li>課題および科目のURL識別子</li>
          </ul>
          <h3 style={styles.subheading}>2.3 設定情報</h3>
          <ul style={styles.list}>
            <li>manabaのドメイン設定（例: manaba.ibaraki.ac.jp）</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. 情報の利用目的</h2>
          <p style={styles.text}>収集した情報は、以下の目的にのみ使用します。</p>
          <ul style={styles.list}>
            <li>ユーザーの認証およびアカウントの識別</li>
            <li>manabaからの課題情報の取得および表示</li>
            <li>取得した課題のSyncScaleへの登録・管理</li>
            <li>manabaドメイン設定の保存</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. 情報の保存</h2>
          <p style={styles.text}>
            認証情報および課題データは、Google Firebase（Cloud Firestore）に安全に保存されます。
            ドメイン設定は、Chrome のローカルストレージ（chrome.storage.sync）に保存されます。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. 第三者への提供</h2>
          <p style={styles.text}>
            本サービスは、収集した情報を第三者に販売、貸与、または共有することはありません。
            データはサービスの提供に必要なGoogle Firebase のインフラストラクチャ上でのみ処理されます。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. データのセキュリティ</h2>
          <p style={styles.text}>
            本サービスは、Firebase Security Rules によるアクセス制御を実施し、
            ユーザー本人のデータにのみアクセスできるよう保護しています。
            また、すべての通信はHTTPSにより暗号化されています。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. ユーザーの権利</h2>
          <p style={styles.text}>ユーザーは、以下の権利を有します。</p>
          <ul style={styles.list}>
            <li>拡張機能のアンインストールにより、ローカルに保存された設定データを削除すること</li>
            <li>SyncScale上で自身の課題データを削除すること</li>
            <li>Googleアカウントの設定から、本サービスへのアクセス権を取り消すこと</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Webサイトの閲覧履歴について</h2>
          <p style={styles.text}>
            本サービスは、ユーザーのWeb閲覧履歴を収集、保存、または利用しません。
            manabaのページにアクセスするのは、ユーザーが「課題を取得する」ボタンを明示的にクリックした場合のみであり、
            取得するのは課題に関する情報のみです。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. ポリシーの変更</h2>
          <p style={styles.text}>
            本プライバシーポリシーは、必要に応じて更新されることがあります。
            重要な変更がある場合は、拡張機能のアップデートを通じてお知らせします。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>10. お問い合わせ</h2>
          <p style={styles.text}>
            本プライバシーポリシーに関するご質問は、SyncScaleの開発者までお問い合わせください。
          </p>
        </section>

        <footer style={styles.footer}>
          <a href="/" style={styles.link}>← SyncScale に戻る</a>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    padding: '2rem 1rem',
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginBottom: '0.25rem',
  },
  date: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '2.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #1e293b',
  },
  subheading: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#cbd5e1',
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
  text: {
    fontSize: '0.9375rem',
    lineHeight: '1.75',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  },
  list: {
    paddingLeft: '1.5rem',
    fontSize: '0.9375rem',
    lineHeight: '2',
    color: '#cbd5e1',
  },
  footer: {
    marginTop: '3rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #1e293b',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.9375rem',
  },
};
