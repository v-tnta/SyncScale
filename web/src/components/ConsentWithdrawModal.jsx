import React, { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

export function ConsentWithdrawModal({ isOpen, onClose, onConfirm }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("同意の撤回エラー:", error);
            alert("同意の撤回に失敗しました。");
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <ConfirmModal
            isOpen={isOpen}
            title="⚠️ 研究参加への同意撤回"
            confirmText={loading ? "処理中..." : "同意を撤回しデータを削除する"}
            cancelText="キャンセル"
            onConfirm={handleConfirm}
            onCancel={onClose}
            confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-sm"
            cancelButtonClass="text-slate-600 bg-slate-100 hover:bg-slate-200"
        >
            <div className="space-y-4 text-slate-700 text-sm">
                <p>
                    研究参加への同意を撤回しようとしています。
                </p>
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-2">
                    <p className="font-bold">🚨 重要な注意点：</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>あなたの全データ（タスク、作業記録、コンディションログ等）は、復元不可能な形で完全に削除されます。</li>
                        <li>アンケートの進捗情報や、オンボーディング進捗も同時にクリアされます。</li>
                        <li>同意撤回の記録（倫理的エビデンスとしてのログ）のみが残り、研究から即座に離脱します。</li>
                    </ul>
                </div>
                <p className="text-xs text-slate-500">
                    よろしければ、下の「同意を撤回しデータを削除する」ボタンを押してください。
                </p>
            </div>
        </ConfirmModal>
    );
}
