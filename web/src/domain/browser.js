/**
 * ブラウザ判定ユーティリティ。
 * オンボーディングで「Google Chrome 本体が入っていないユーザー」に
 * Chrome のインストールを案内するために使う。
 */

/**
 * 使用中のブラウザが Google Chrome かどうかを判定する。
 *
 * Chromium 系（Edge/Opera/Brave/Vivaldi 等）は UserAgent に "Chrome/" を
 * 含むため、単純な UA 一致では誤判定する。優先順位:
 *   1. userAgentData.brands に "Google Chrome" があれば確実に Chrome
 *   2. Brave は UA を Chrome に偽装するので navigator.brave で除外
 *   3. フォールバック: "Chrome/" を含み、他ブラウザの識別子を含まない
 *
 * iOS/Android の Chrome（CriOS 等）は拡張機能が使えないが、モバイルは
 * 呼び出し側（オンボーディング）が別途 pcOnlyMessage で案内するため
 * ここでは区別しない。
 */
export const isChromeBrowser = () => {
    if (typeof navigator === 'undefined') return false;

    const brands = navigator.userAgentData?.brands;
    if (Array.isArray(brands) && brands.length > 0) {
        return brands.some((b) => b.brand === 'Google Chrome');
    }

    if (navigator.brave) return false;

    const ua = navigator.userAgent || '';
    const isChromiumUa = /Chrome\/|CriOS\//.test(ua);
    const isOtherBrowser = /Edg\/|EdgiOS\/|OPR\/|Opera|SamsungBrowser|Vivaldi|Whale|YaBrowser|FxiOS/.test(ua);
    return isChromiumUa && !isOtherBrowser;
};
