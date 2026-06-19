import React, { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { CONSENT_WITHDRAW_MODAL } from "../content";

export function ConsentWithdrawModal({ isOpen, onClose, onConfirm }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("同意の撤回エラー:", error);
            alert(CONSENT_WITHDRAW_MODAL.errorAlert);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <ConfirmModal
            isOpen={isOpen}
            title={CONSENT_WITHDRAW_MODAL.title}
            confirmText={loading ? CONSENT_WITHDRAW_MODAL.confirmingText : CONSENT_WITHDRAW_MODAL.confirmText}
            cancelText={CONSENT_WITHDRAW_MODAL.cancelText}
            onConfirm={handleConfirm}
            onCancel={onClose}
            confirmButtonClass="text-white bg-red-600 hover:bg-red-700 shadow-sm"
            cancelButtonClass="text-slate-600 bg-slate-100 hover:bg-slate-200"
        >
            <div className="space-y-4 text-slate-700 text-sm">
                <p>
                    {CONSENT_WITHDRAW_MODAL.lead}
                </p>
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-2">
                    <p className="font-bold">{CONSENT_WITHDRAW_MODAL.noticeHeading}</p>
                    <ul className="list-disc list-inside space-y-1">
                        {CONSENT_WITHDRAW_MODAL.notices.map((notice, i) => (
                            <li key={i}>{notice}</li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-slate-500">
                    {CONSENT_WITHDRAW_MODAL.footnote}
                </p>
            </div>
        </ConfirmModal>
    );
}
