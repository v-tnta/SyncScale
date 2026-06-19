import React from 'react';
import appConfig from '@shared/app_config.json';
import { MOBILE_APP_PROMO_MODAL } from '../content';

/**
 * モバイルアプリインストール促進モーダル
 * 研究での必須利用のため、インストールを強く促します。
 */
const MobileAppPromoModal = ({ isOpen, onClose, iosUrl, androidUrl }) => {
    if (!isOpen) return null;

    const finalIosUrl = iosUrl || appConfig.iosStoreUrl;
    const finalAndroidUrl = androidUrl || appConfig.androidStoreUrl;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* バックドロップ */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* モーダルコンテンツ */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col space-y-6 animate-fade-in">
                {/* ヘッダー */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50/80 rounded-2xl border border-blue-500/20 mb-2">
                        <span className="text-3xl">📱</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-950">
                        {MOBILE_APP_PROMO_MODAL.title}
                    </h2>
                </div>

                {/* 説明テキスト */}
                <div className="space-y-3 leading-relaxed text-sm text-slate-600 font-medium">
                    <p>
                        {MOBILE_APP_PROMO_MODAL.paragraphs[0]}
                    </p>
                    <p className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-xs font-semibold">
                        {MOBILE_APP_PROMO_MODAL.paragraphs[1]}
                    </p>
                    <p>
                        {MOBILE_APP_PROMO_MODAL.paragraphs[2]}
                    </p>
                </div>

                {/* ストアリンク */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                    <a
                        href={finalIosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3.5 px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl text-center transition duration-300 text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-neutral-800/15"
                    >
                        <span></span> {MOBILE_APP_PROMO_MODAL.iosButtonText}
                    </a>
                    <a
                        href={finalAndroidUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3.5 px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl text-center transition duration-300 text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-neutral-800/15"
                    >
                        {MOBILE_APP_PROMO_MODAL.androidButtonText}
                    </a>
                </div>

                {/* あとで通知ボタン */}
                <div className="pt-2 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl transition"
                    >
                        {MOBILE_APP_PROMO_MODAL.laterButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileAppPromoModal;
