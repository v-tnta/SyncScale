import React from 'react';
import { PRIVACY_POLICY } from '../content';

/**
 * SyncScale Chrome 拡張機能向けプライバシーポリシーページ
 * Chrome ウェブストア審査で必要なプライバシーポリシーの URL として使用する
 *
 * 表示文言は src/content/pages.js（PRIVACY_POLICY）に集約しています。
 */
export default function PrivacyPolicy() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>{PRIVACY_POLICY.title}</h1>
        <p style={styles.subtitle}>{PRIVACY_POLICY.subtitle}</p>
        <p style={styles.date}>{PRIVACY_POLICY.lastUpdated}</p>

        {PRIVACY_POLICY.sections.map((section, i) => (
          <section key={i} style={styles.section}>
            <h2 style={styles.heading}>{section.heading}</h2>
            {section.text && <p style={styles.text}>{section.text}</p>}
            {section.items && (
              <ul style={styles.list}>
                {section.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {section.groups && section.groups.map((group, g) => (
              <React.Fragment key={g}>
                <h3 style={styles.subheading}>{group.subheading}</h3>
                <ul style={styles.list}>
                  {group.items.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              </React.Fragment>
            ))}
          </section>
        ))}

        <footer style={styles.footer}>
          <a href="/" style={styles.link}>{PRIVACY_POLICY.backLink}</a>
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
