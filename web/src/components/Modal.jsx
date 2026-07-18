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
 * className は見た目（背景色・角丸・影・パディング等）を丸ごと
 * 置き換える。位置・サイズ・スクロール・アニメーションなど構造面は
 * 固定クラスとして常に適用され、同じCSSプロパティ同士がTailwind上で
 * 衝突しないようにしている。
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
    closeOnOutsideClick = true,
    className = 'bg-white rounded-2xl shadow-2xl',
}) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose?.(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
                <Dialog.Content
                    aria-describedby={undefined}
                    onPointerDownOutside={(e) => { if (!closeOnOutsideClick) e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (!closeOnOutsideClick) e.preventDefault(); }}
                    className={`fixed z-[90] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${maxWidth} max-h-[90vh] overflow-y-auto outline-none data-[state=open]:animate-fade-in-up ${className}`}
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
