import React, { useState, useEffect } from 'react';

const ConditionInputModal = ({ isOpen, onClose, task, onSubmit }) => {
    const [condition, setCondition] = useState('');
    const [memo, setMemo] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCondition('');
            setMemo('');
        }
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleSubmit = () => {
        // UI層のみの実装のため、今回はそのままonSubmitを呼ぶ
        onSubmit({ condition, memo });
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">お疲れ様でした！</h2>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-1 border-b border-gray-100 pb-2">
                        {task.title}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* コンディション選択 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                            今の気分（コンディション）はどうですか？
                        </label>
                        <div className="flex justify-center gap-6">
                            {[
                                { value: 'good', emoji: '😊', label: '良い' },
                                { value: 'fair', emoji: '🙂', label: '普通' },
                                { value: 'poor', emoji: '😥', label: '悪い' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setCondition(opt.value)}
                                    className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${
                                        condition === opt.value ? 'opacity-100 transform scale-110' : 'opacity-40 hover:opacity-80'
                                    }`}
                                >
                                    <span className="text-5xl drop-shadow-sm">{opt.emoji}</span>
                                    <span className={`text-xs font-semibold ${condition === opt.value ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ひとことメモ */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            ひとことメモ (任意)
                        </label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            rows="3"
                            placeholder="次に活かせることや、今の気持ちを残そう..."
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                        ></textarea>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!condition}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            記録して完了
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConditionInputModal;
