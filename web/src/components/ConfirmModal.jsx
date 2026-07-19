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
    cancelButtonClass = "text-red-600 bg-red-50 hover:bg-red-100"
}) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} zIndex={100} className="bg-white rounded-2xl shadow-2xl p-6">
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
        </Modal>
    );
}
