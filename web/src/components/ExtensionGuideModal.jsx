import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { EXTENSION_GUIDE_MODAL } from '../content';

/**
 * Chrome拡張機能の使い方解説モーダル
 * チュートリアル完了後、モバイルプロモの前に表示される。
 */
const ExtensionGuideModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = EXTENSION_GUIDE_MODAL.slides;

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
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={EXTENSION_GUIDE_MODAL.headerTitle} 
            maxWidth="max-w-lg" 
            zIndex={95}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl overflow-hidden"
        >
            <div className="flex flex-col">
                {/* ヘッダー */}
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>🧩</span> {EXTENSION_GUIDE_MODAL.headerTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-2 transition"
                    >
                        <X className="w-5 h-5" strokeWidth={2.2} />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="p-5 sm:p-6">
                    {/* アイコンとタイトル */}
                    <div className="text-center mb-5">
                        <span className="text-4xl sm:text-5xl mb-2.5 block">{currentData.icon}</span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                            {currentData.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                            {currentData.description}
                        </p>
                    </div>

                    {/* スクリーンショット画像エリア */}
                    {currentData.image && (
                        <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 shadow-inner">
                            <img
                                src={currentData.image}
                                alt={currentData.title}
                                className="w-full h-auto max-h-56 object-contain mx-auto"
                            />
                        </div>
                    )}

                    {/* スライドインジケーター (ドット) */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all ${
                                    currentSlide === index
                                        ? 'w-6 bg-blue-600'
                                        : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                                }`}
                                aria-label={`スライド ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* ナビゲーションボタン */}
                    <div className="flex justify-between items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={isFirstSlide}
                            className={`flex items-center gap-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                                isFirstSlide
                                    ? 'text-slate-300 dark:text-slate-650 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>前へ</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-1 px-6 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs transition"
                        >
                            <span>{isLastSlide ? 'はじめる' : '次へ'}</span>
                            {!isLastSlide && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ExtensionGuideModal;
