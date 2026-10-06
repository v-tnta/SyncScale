import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

/**
 * 全モーダルで共有するダイアログの外枠（Radix UI Dialogベース）。
 * フォーカストラップ・Escキー・スクロールロック・背景クリックでの
 * クローズをRadixに任せることで、各モーダルは中身（見出し・本文・
 * ボタン）の実装だけに専念できるようにする。
 *
 * title は画面上の見出しとは別に、スクリーンリーダー向けの
 * アクセシブルネームとして常に渡す（Radixが必須としているため）。
 * 各モーダル自身がすでに視覚的な見出しを持つことが多いので、
 * ここでは視覚的に非表示（VisuallyHidden）にする。
 *
 * zIndex は呼び出し側が自分の重なり順を明示する。値が動的なため
 * Tailwind の z-[n] ではクラスを生成できず、インラインstyleで渡している。
 * アプリ全体の重なり順:
 *   50 モバイル案内 → 60 完了タスク一覧 → 70 タイマーのサブタスク確認
 *   → 75/76 チュートリアルの暗転・ハイライト枠 → 80 タスク詳細・規模見積もり
 *   → 90 コンディション入力・設定/分析パネルの背景 → 95 拡張機能ガイド・パネル本体
 *   → 100 確認モーダル・チュートリアルの吹き出し → 200 全画面ローディング
 * チュートリアルの暗転（75）より下に置いたモーダルは、スポットライトで
 * くり抜かれた部分だけが操作できるようになる（完了一覧のステップがこれ）。
 *
 * blockOutsideInteraction=false は Radix の modal を切り、モーダルの外側を
 * 操作可能なまま残す。チュートリアル中はモーダルを開いたままガイドの
 * 「次へ進む」を押す必要があるため、チュートリアルに登場するモーダルは
 * 必ず false にすること（modal=true だと Radix が body に
 * pointer-events:none を付けて外側のクリックを一切殺してしまう）。
 *
 * className は見た目（背景色・角丸・影・パディング等）を丸ごと
 * 置き換える。位置・サイズ・スクロール・アニメーションなど構造面は
 * 固定クラスとして常に適用され、同じCSSプロパティ同士がTailwind上で
 * 衝突しないようにしている。
 */

const OVERLAY_CLASS = 'fixed inset-0 bg-black/40 backdrop-blur-sm';

// Radix は左クリックの外側クリック判定を pointerdown ではなく、続く click まで
// 遅延させる（Dialog が deferPointerDownOutside を有効にしているため）。
// そのため、クリックのハンドラ自身が対象要素をアンマウントすると、判定が走る
// 時点では originalEvent.target がすでにDOMから切り離されていて、closest() が
// 祖先を辿れない。チュートリアルの「次へ進む」ボタンは押した瞬間に次のステップへ
// 進み、次のステップに手動ボタンが無ければ消えるため（step 8 → 9）、まさにこれに
// 該当してガイドへのクリックが「外側クリック」と誤認され、開いたままにしたい
// タスク詳細モーダルが閉じてしまう。
// 対策として pointerdown の時点（要素がまだDOMにある間）に判定を控えておく。
let lastPointerDownWasOnTutorialGuide = false;
let isPointerDownTrackerInstalled = false;

const isInsideTutorialGuide = (target) =>
    target instanceof Element && !!target.closest('[data-tutorial-guide]');

const installTutorialGuidePointerTracker = () => {
    if (isPointerDownTrackerInstalled || typeof document === 'undefined') return;
    isPointerDownTrackerInstalled = true;
    // capture フェーズなので、Radix が document に付ける pointerdown ハンドラより先に走る。
    document.addEventListener(
        'pointerdown',
        (event) => { lastPointerDownWasOnTutorialGuide = isInsideTutorialGuide(event.target); },
        true
    );
};

// チュートリアルのガイドはモーダルの外側にあるため、そこへの操作を
// 「外側クリック」と見なしてモーダルを閉じてしまわないようにする。
const isTutorialGuideEvent = (event) => {
    const originalEvent = event.detail?.originalEvent;
    if (isInsideTutorialGuide(originalEvent?.target)) return true;
    // 判定時にはすでに対象が消えている場合のフォールバック
    return originalEvent?.type === 'pointerdown' && lastPointerDownWasOnTutorialGuide;
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
    closeOnOutsideClick = true,
    zIndex = 90,
    blockOutsideInteraction = true,
    className = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl',
}) {
    useEffect(() => { installTutorialGuidePointerTracker(); }, []);

    return (
        <Dialog.Root
            open={isOpen}
            modal={blockOutsideInteraction}
            onOpenChange={(open) => { if (!open) onClose?.(); }}
        >
            <Dialog.Portal>
                {blockOutsideInteraction ? (
                    <Dialog.Overlay
                        style={{ zIndex }}
                        className={`${OVERLAY_CLASS} data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out`}
                    />
                ) : (
                    /* Radix は modal=false のとき Overlay を描画しないため、
                       見た目を揃えるために自前で出す。閉じる判定は Content 側の
                       onInteractOutside に任せるので onClick は持たせない。 */
                    <div style={{ zIndex }} className={`${OVERLAY_CLASS} animate-fade-in`} />
                )}
                <Dialog.Content
                    aria-describedby={undefined}
                    style={{ zIndex }}
                    onInteractOutside={(e) => {
                        if (!closeOnOutsideClick || isTutorialGuideEvent(e)) e.preventDefault();
                    }}
                    onEscapeKeyDown={(e) => { if (!closeOnOutsideClick) e.preventDefault(); }}
                    className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} max-h-[90vh] overflow-y-auto outline-none data-[state=open]:animate-fade-in-up ${className}`}
                >
                    <VisuallyHidden asChild>
                        <Dialog.Title>{title}</Dialog.Title>
                    </VisuallyHidden>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
