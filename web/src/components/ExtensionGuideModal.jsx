import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal';
import { EXTENSION_GUIDE_MODAL } from '../content';

/**
 * Chrome拡張機能の使い方解説モーダル
 * チュートリアル完了後、モバイルプロモの前に表示される。
 * 他のモーダルと一貫した白背景ヘッダー、グレー・青基調のテーマカラー。
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
        <Modal isOpen={isOpen} onClose={onClose} title={EXTENSION_GUIDE_MODAL.headerTitle} maxWidth="max-w-lg" zIndex={95}>
            <div className="flex flex-col">
                {/* ヘッダー */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🧩</span> {EXTENSION_GUIDE_MODAL.headerTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
                    >
                        <X className="w-5 h-5" strokeWidth={2.2} />
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
                                {EXTENSION_GUIDE_MODAL.prevButtonText}
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition text-sm"
                        >
                            {isLastSlide ? EXTENSION_GUIDE_MODAL.finishButtonText : EXTENSION_GUIDE_MODAL.nextButtonText}
                        </button>
                    </div>

                    {/* スキップリンク */}
                    {!isLastSlide && (
                        <button
                            onClick={onClose}
                            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 transition text-center"
                        >
                            {EXTENSION_GUIDE_MODAL.skipButtonText}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ExtensionGuideModal;
