import React, { useState } from 'react';

/**
 * Chrome拡張機能の使い方解説モーダル
 * チュートリアル完了後、モバイルプロモの前に表示される。
 * 他のモーダルと一貫した白背景ヘッダー、グレー・青基調のテーマカラー。
 */
const ExtensionGuideModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    if (!isOpen) return null;

    const slides = [
        {
            title: "manabaの課題を自動で取り込もう",
            description: "SyncScaleのChrome拡張機能を使うと、manabaに掲載されている課題を一括で取り込めます。手入力の手間がなくなります！",
            imagePlaceholder: "manaba連携イメージ",
            icon: "🔗"
        },
        {
            title: "Step 1: 拡張機能アイコンをクリック",
            description: "ブラウザ右上のSyncScale拡張機能アイコンをクリックすると、ポップアップが表示されます。",
            imagePlaceholder: "拡張機能アイコンクリック画面",
            icon: "🧩"
        },
        {
            title: "Step 2: 課題を取り込む",
            description: "「課題を取り込む」ボタンをクリックすると、manabaから課題が自動的にSyncScaleに追加されます。",
            imagePlaceholder: "課題取り込みボタン画面",
            icon: "📥"
        },
        {
            title: "準備完了！",
            description: "これでmanabaの課題がSyncScaleに反映されます。新しい課題が出たら、同じ手順で取り込めます。",
            imagePlaceholder: "取り込み完了画面",
            icon: "✅"
        }
    ];

    const currentData = slides[currentSlide];
    const isLastSlide = currentSlide === slides.length - 1;
    const isFirstSlide = currentSlide === 0;

    const handleNext = () => {
        if (isLastSlide) {
            onClose();
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstSlide) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 backdrop-blur-md transition-opacity">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden relative animate-fade-in-up mx-4 flex flex-col">
                {/* ヘッダー */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🧩</span> Chrome拡張機能の使い方
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="p-6">
                    {/* アイコンとタイトル */}
                    <div className="text-center mb-5">
                        <span className="text-5xl mb-3 block">{currentData.icon}</span>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {currentData.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                            {currentData.description}
                        </p>
                    </div>

                    {/* 画像プレースホルダー */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl h-44 flex items-center justify-center mb-6">
                        <div className="text-center">
                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                            </svg>
                            <p className="text-xs text-gray-400 font-medium">{currentData.imagePlaceholder}</p>
                        </div>
                    </div>

                    {/* スライドインジケーター */}
                    <div className="flex justify-center gap-2 mb-5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2 h-2 rounded-full transition-all duration-350 ${
                                    i === currentSlide
                                        ? 'bg-blue-600 w-5'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    {/* ナビゲーションボタン */}
                    <div className="flex gap-3">
                        {!isFirstSlide && (
                            <button
                                onClick={handlePrev}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm"
                            >
                                ← 戻る
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition text-sm"
                        >
                            {isLastSlide ? '使い始める！ 🚀' : '次へ →'}
                        </button>
                    </div>

                    {/* スキップリンク */}
                    {!isLastSlide && (
                        <button
                            onClick={onClose}
                            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition text-center"
                        >
                            スキップして閉じる
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExtensionGuideModal;
