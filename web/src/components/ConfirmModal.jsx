import React from 'react';

export function ConfirmModal({
    isOpen,
    title,
    children,
    confirmText = "OK",
    cancelText = "キャンセル",
    onConfirm,
    onCancel,
    confirmButtonClass = "text-white bg-blue-600 hover:bg-blue-700 shadow-sm",
    cancelButtonClass = "text-red-600 bg-red-50 hover:bg-red-100"
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

                <div className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {children}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${cancelButtonClass}`}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
