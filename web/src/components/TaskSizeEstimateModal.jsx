import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Modal } from './Modal';
import { TASK_SIZE_ESTIMATE_MODAL } from '../content';

const TaskSizeEstimateModal = ({ isOpen, task, currentIndex, totalCount, onSubmit, onDecline }) => {
    const [sizeLabel, setSizeLabel] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSizeLabel('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(task, sizeLabel);
    };

    const isMultiple = totalCount > 1;

    return (
        <Modal
            isOpen={isOpen && !!task}
            title={task ? `${task.title} ${TASK_SIZE_ESTIMATE_MODAL.titleSingle}` : TASK_SIZE_ESTIMATE_MODAL.titleSingle}
            closeOnOutsideClick={false}
            zIndex={80}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl p-6 sm:p-8"
        >
            {task && (
            <div>
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 relative shadow-xs">
                        <Zap className="w-7 h-7" strokeWidth={2.2} />
                        {isMultiple && (
                            <div className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                {currentIndex}/{totalCount}
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">
                        {isMultiple ? TASK_SIZE_ESTIMATE_MODAL.titleMultiple : TASK_SIZE_ESTIMATE_MODAL.titleSingle}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 border-b border-slate-100 dark:border-slate-800 pb-3 px-2">
                        {task.title}
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
                            {TASK_SIZE_ESTIMATE_MODAL.question}
                        </label>
                        <div className="flex justify-center gap-3.5">
                            {TASK_SIZE_ESTIMATE_MODAL.sizeOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSizeLabel(opt.value)}
                                    className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                                        sizeLabel === opt.value 
                                            ? `${opt.color} transform scale-105 shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900` 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                                    }`}
                                >
                                    <span className="text-3xl font-black mb-1">{opt.value}</span>
                                    <span className="text-[10px] font-bold">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex pt-1">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!sizeLabel}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {TASK_SIZE_ESTIMATE_MODAL.submitButtonText}
                        </button>
                    </div>

                    {/* 課題として追加しない（取り込み対象から外す） */}
                    <button
                        type="button"
                        onClick={() => onDecline(task)}
                        className="w-full mt-2 text-xs font-semibold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition text-center cursor-pointer"
                    >
                        {TASK_SIZE_ESTIMATE_MODAL.declineButtonText}
                    </button>
                </div>
            </div>
            )}
        </Modal>
    );
};

export default TaskSizeEstimateModal;
