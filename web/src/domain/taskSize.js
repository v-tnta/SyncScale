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

// タスクカード左端のアクセントボーダー
export const getSizeBorderClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'border-l-cyan-400';
        case 'M': return 'border-l-orange-400';
        case 'L': return 'border-l-red-500';
        default: return 'border-l-gray-300';
    }
};

// サイズバッジ（S/M/Lの丸背景ラベル）
export const getSizeBadgeClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
        case 'M': return 'bg-orange-50 text-orange-700 border border-orange-100';
        case 'L': return 'bg-red-50 text-red-700 border border-red-100';
        default: return 'bg-gray-100 text-gray-500';
    }
};

// SizeLabelSelector（S/M/L選択ボタン）用。バッジより濃いホバー/リング付き
export const getSizeSelectorClass = (label) => {
    switch (label?.toUpperCase()) {
        case 'S': return 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300 ring-cyan-400';
        case 'M': return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300 ring-orange-400';
        case 'L': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300 ring-red-400';
        default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
    }
};
