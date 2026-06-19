/**
 * SyncScale 表示文言の集約ポイント（バレル）
 *
 * 画面に表示する文字列（モーダル・チュートリアル・各コンポーネントの
 * タイトル / 説明文 / ボタンラベル / プレースホルダー 等）は、
 * このディレクトリ配下のファイルにまとめています。
 * 文言を編集したいときは、まず該当するファイルを開いてください。
 *
 *   pages.js          … ページ単位の文言（同意書 / オンボーディング / 拡張ログイン）
 *   tutorial.js       … 静的チュートリアル（未ログイン向け体験ツアー）
 *   tutorialGuide.js  … 動的チュートリアルガイド（実画面を操作する15ステップ）
 *   modals.js         … 各種モーダルの文言
 *   components.js     … 基本コンポーネントのUI文言（フォーム / 一覧 / 設定 など）
 *
 * 利用側は `import { XXX } from '../content'` の1パスで参照できます。
 */

export * from './pages';
export * from './tutorial';
export * from './tutorialGuide';
export * from './modals';
export * from './components';
