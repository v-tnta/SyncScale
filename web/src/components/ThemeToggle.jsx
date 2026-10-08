import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// 「自動」テーマ用アイコン。太陽と月を重ねて「OS設定に従う（どちらにもなる）」ことを表す
export function SunMoonIcon() {
    return (
        <span className="relative inline-block w-[22px] h-[18px] shrink-0" aria-hidden="true">
            <Sun className="absolute left-0 top-0 w-[15px] h-[15px] text-amber-500" strokeWidth={2.4} />
            <Moon className="absolute right-0 bottom-0 w-[13px] h-[13px] text-indigo-500 dark:text-indigo-300 fill-indigo-500/20" strokeWidth={2.4} />
        </span>
    );
}

export function ThemeToggle({ className = '' }) {
    const { theme, resolvedTheme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };

    const getIcon = () => {
        if (theme === 'system') {
            return <SunMoonIcon />;
        }
        if (resolvedTheme === 'dark') {
            return <Moon className="w-4 h-4 text-indigo-400" strokeWidth={2.2} />;
        }
        return <Sun className="w-4 h-4 text-amber-500" strokeWidth={2.2} />;
    };

    const getLabel = () => {
        if (theme === 'system') return '自動';
        if (theme === 'dark') return 'ダーク';
        return 'ライト';
    };

    return (
        <button
            type="button"
            onClick={cycleTheme}
            className={`flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-650 transition-all py-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold text-[13px] ${className}`}
            title={`テーマ切り替え: 現在は「${getLabel()}」（クリックで切替）`}
            aria-label={`テーマ切り替え: 現在は${getLabel()}`}
        >
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
        </button>
    );
}
