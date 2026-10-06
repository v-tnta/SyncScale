import React from 'react';
import { X, Smartphone } from 'lucide-react';
import { Modal } from './Modal';
import { MOBILE_APP_PROMO_MODAL } from '../content';
import appConfig from '../../../shared/app_config.json';
import appStoreBadgeJa from '../assets/store-badges/app-store-badge-ja.svg';

/**
 * Webモバイル版とApp Storeへの導線を案内するモーダル。
 */
const MobileAppPromoModal = ({ isOpen, onClose }) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={MOBILE_APP_PROMO_MODAL.title} 
            maxWidth="max-w-md" 
            zIndex={50} 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100"
        >
            <div className="flex flex-col space-y-6">
                {/* ヘッダー */}
                <div className="flex justify-between items-start">
                    <div className="w-6" /> {/* バランス用ダミー */}
                    <div className="text-center space-y-2 flex flex-col items-center flex-1">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 mb-1 shadow-xs">
                            <Smartphone className="w-7 h-7" strokeWidth={2.2} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-50">
                            {MOBILE_APP_PROMO_MODAL.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 説明テキスト */}
                <div className="space-y-3 leading-relaxed text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <p>
                        {MOBILE_APP_PROMO_MODAL.paragraphs[0]}
                    </p>
                    <p className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                        {MOBILE_APP_PROMO_MODAL.paragraphs[1]}
                    </p>
                    <p>
                        {MOBILE_APP_PROMO_MODAL.paragraphs[2]}
                    </p>
                </div>

                {/* 利用可能なWebモバイル版とストアバッジ */}
                <div className="grid grid-cols-1 gap-3 pt-1">
                    <a
                        href={appConfig.iosStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={MOBILE_APP_PROMO_MODAL.iosButtonText}
                        className="mx-auto inline-flex p-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-transform hover:scale-105"
                    >
                        <img
                            src={appStoreBadgeJa}
                            alt={MOBILE_APP_PROMO_MODAL.iosButtonText}
                            className="block h-10 w-auto"
                        />
                    </a>
                    <button
                        type="button"
                        disabled
                        className="py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-2xl text-center text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                        <span>▶</span> {MOBILE_APP_PROMO_MODAL.androidButtonText}
                    </button>
                </div>

                <div className="text-center pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MobileAppPromoModal;
