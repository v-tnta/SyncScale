import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { CONDITION_INPUT_MODAL } from '../content';

const ConditionInputModal = ({ isOpen, onClose, task, onSubmit, isTutorialActive }) => {
    const [condition, setCondition] = useState('');
    const [memo, setMemo] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCondition('');
            setMemo('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit({ condition, memo });
    };

    return (
        <Modal
            isOpen={isOpen && !!task}
            onClose={onClose}
            title={task ? `${task.title} ${CONDITION_INPUT_MODAL.title}` : CONDITION_INPUT_MODAL.title}
            closeOnOutsideClick={false}
            zIndex={90}
            blockOutsideInteraction={!isTutorialActive}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl p-6 sm:p-8"
        >
            {task && (
            <div id="tutorial-condition-modal">
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-xs">
                        <Check className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{CONDITION_INPUT_MODAL.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                        {task.title}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* コンディション選択 */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
                            {CONDITION_INPUT_MODAL.conditionQuestion}
                        </label>
                        <div className="flex justify-center gap-6">
                            {CONDITION_INPUT_MODAL.conditionOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setCondition(opt.value)}
                                    className={`flex flex-col items-center gap-1.5 transition-all hover:scale-110 cursor-pointer ${
                                        condition === opt.value ? 'opacity-100 transform scale-110' : 'opacity-40 hover:opacity-80'
                                    }`}
                                >
                                    <span className="text-4xl sm:text-5xl drop-shadow-sm">{opt.emoji}</span>
                                    <span className={`text-xs font-bold ${condition === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ひとことメモ */}
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            {CONDITION_INPUT_MODAL.memoLabel}
                        </label>
                        <textarea
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
                            rows="3"
                            placeholder={CONDITION_INPUT_MODAL.memoPlaceholder}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                        ></textarea>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-2.5 pt-1">
                        {!isTutorialActive && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl transition text-sm"
                            >
                                {CONDITION_INPUT_MODAL.cancelButtonText}
                            </button>
                        )}
                        <button
                            id="tutorial-condition-submit"
                            type="button"
                            onClick={handleSubmit}
                            disabled={!condition}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            style={isTutorialActive ? { width: '100%', flex: 'none' } : undefined}
                        >
                            {CONDITION_INPUT_MODAL.submitButtonText}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </Modal>
    );
};

export default ConditionInputModal;
