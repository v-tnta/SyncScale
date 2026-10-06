import React from 'react';
import { Modal } from './Modal';
import { CONFIRM_MODAL } from '../content';

export function ConfirmModal({
    isOpen,
    title,
    children,
    confirmText = CONFIRM_MODAL.defaultConfirmText,
    cancelText = CONFIRM_MODAL.defaultCancelText,
    onConfirm,
    onCancel,
    confirmButtonClass = "text-white bg-blue-600 hover:bg-blue-700 shadow-sm",
    cancelButtonClass = "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
}) {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onCancel} 
            title={title} 
            zIndex={100} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl p-6"
        >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-3">{title}</h3>

            <div className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {children}
            </div>

            <div className="flex justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${cancelButtonClass}`}
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${confirmButtonClass}`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
