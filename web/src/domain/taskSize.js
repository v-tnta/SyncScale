/**
 * タスクの規模感（S/M/L）に紐づく表示色の一元管理。
 * TaskList / TaskOverlay / CompletedTasksModal / Tutorial / Calendar /
 * SizeLabelSelector で個別に定義されていた同じ switch 文をここに集約する。
 */

// Tailwindクラスが使えないコンテキスト用の生の色値（react-big-calendarのstyle属性など）
const SIZE_HEX_COLORS = {
    S: '#06b6d4', // Cyan-500
    M: '#f97316', // Orange-500
    L: '#ef4444', // Red-500
};
const DEFAULT_HEX_COLOR = '#3174ad';

export const getSizeHexColor = (label) => SIZE_HEX_COLORS[label?.toUpperCase()] || DEFAULT_HEX_COLOR;

// カレンダーの日付ヘッダー円背景用（白文字の可読性を確保するコントラスト重視のHEX値）
const SIZE_CONTRAST_HEX_COLORS = {
    S: '#0891b2', // cyan-600
    M: '#ea580c', // orange-600
    L: '#dc2626', // red-600
};
export const getSizeContrastHexColor = (label) => SIZE_CONTRAST_HEX_COLORS[label?.toUpperCase()] || '#2563eb';

// タスクカード左端のアクセントボーダー
export const getSizeBorderClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'border-l-cyan-400 dark:border-l-cyan-500';
        case 'M': return 'border-l-orange-400 dark:border-l-orange-500';
        case 'L': return 'border-l-red-500 dark:border-l-red-500';
        default: return 'border-l-gray-300 dark:border-l-slate-600';
    }
};

// サイズバッジ（S/M/Lの丸背景ラベル）
export const getSizeBadgeClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
        case 'M': return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
        case 'L': return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
        default: return 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 border border-transparent';
    }
};

// SizeLabelSelector（S/M/L選択ボタン）用。バッジより濃いホバー/リング付き
export const getSizeSelectorClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-200 dark:hover:bg-cyan-800/80 border-cyan-300 dark:border-cyan-700 ring-cyan-400';
        case 'M': return 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800/80 border-orange-300 dark:border-orange-700 ring-orange-400';
        case 'L': return 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/80 border-red-300 dark:border-red-700 ring-red-400';
        default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 border-gray-300 dark:border-slate-600';
    }
};
