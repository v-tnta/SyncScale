import React, { useState, useEffect } from 'react';

const TaskSizeEstimateModal = ({ isOpen, task, currentIndex, totalCount, onSubmit }) => {
    const [sizeLabel, setSizeLabel] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSizeLabel('');
        }
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleSubmit = () => {
        onSubmit(task, sizeLabel);
    };

    const isMultiple = totalCount > 1;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4 relative">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isMultiple && (
                            <div className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-md">
                                {currentIndex}/{totalCount}
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {isMultiple ? '複数の新しい課題があります！' : '新しい課題が見つかりました！'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 border-b border-gray-100 pb-2 px-2">
                        {task.title}
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                            この課題の規模（S/M/L）はどれくらいですか？
                        </label>
                        <div className="flex justify-center gap-4">
                            {[
                                { value: 'S', color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300', desc: 'すぐ終わる' },
                                { value: 'M', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300', desc: '半日〜1日' },
                                { value: 'L', color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300', desc: '数日かかる' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSizeLabel(opt.value)}
                                    className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all ${
                                        sizeLabel === opt.value 
                                            ? `${opt.color} transform scale-110 shadow-md ring-2 ring-offset-2 ring-${opt.color.split('-')[1]}-400` 
                                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-3xl font-black mb-1">{opt.value}</span>
                                    <span className="text-[10px] font-bold">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!sizeLabel}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            決定して次へ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskSizeEstimateModal;
