import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.svg';

/**
 * チュートリアルコンポーネント
 * 未ログインユーザーに対して、アプリの機能をモックデータで体験的に紹介し、
 * 最後にGoogleログインを促すオンボーディング画面です。
 */

// モックデータ
const MOCK_TASKS = [
    { id: 1, title: '英語リスニング練習', deadline: '2026/5/4 18:00', sizeLabel: 'S', status: 'TODO' },
    { id: 2, title: 'レポート課題 第3回', deadline: '2026/5/17 23:59', sizeLabel: 'M', status: 'DOING' },
    { id: 3, title: 'グループ発表 資料作成', deadline: '2026/5/25 10:00', sizeLabel: 'L', status: 'TODO' },
];

const getBadgeColor = (label) => {
    switch (label) {
        case 'S': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
        case 'M': return 'bg-orange-50 text-orange-700 border border-orange-200';
        case 'L': return 'bg-red-50 text-red-700 border border-red-200';
        default: return 'bg-gray-100 text-gray-500';
    }
};

const getSizeColor = (label) => {
    switch (label) {
        case 'S': return 'border-l-cyan-400';
        case 'M': return 'border-l-orange-400';
        case 'L': return 'border-l-red-500';
        default: return 'border-l-gray-300';
    }
};

const Tutorial = () => {
    const { login } = useAuth();
    const [step, setStep] = useState(0);

    // チュートリアルのステップ定義
    const steps = [
        // Step 0: ウェルカム画面
        {
            title: 'SyncScaleへようこそ！',
            subtitle: 'タスク管理 × 時間計測で、学習を最適化するアプリです。',
            content: (
                <div className="flex flex-col items-center gap-8">
                    <div className="w-24 h-24 animate-bounce-slow">
                        <img src={logo} alt="SyncScale" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center max-w-md space-y-4">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            SyncScaleは、大学の課題やタスクを<br />
                            <span className="font-bold text-blue-600">「見える化」</span>して管理するアプリです。
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">📋</div>
                                <p className="text-xs font-bold text-blue-700">タスク管理</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">⏱️</div>
                                <p className="text-xs font-bold text-green-700">時間計測</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <p className="text-xs font-bold text-purple-700">分析・可視化</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        // Step 1: タスク一覧の紹介
        {
            title: 'タスクを一覧で管理',
            subtitle: '課題の締切やサイズを一目で把握できます。',
            content: (
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="space-y-3">
                            {MOCK_TASKS.map((task) => (
                                <div
                                    key={task.id}
                                    className={`p-4 border border-l-8 rounded-lg flex justify-between items-center bg-white transition-all hover:shadow-md ${getSizeColor(task.sizeLabel)}`}
                                >
                                    <div>
                                        <h4 className="font-medium text-gray-800">{task.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">📅 締切: {task.deadline}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${getBadgeColor(task.sizeLabel)}`}>
                                            {task.sizeLabel}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            task.status === 'DOING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100 ">
                        <p className="text-sm text-blue-800 flex items-center gap-2 justify-center">
                            <span className="text-lg">💡</span>
                            <span>
                                タスクの<strong>見積もり所要時間</strong>を <strong>S・M・L</strong> でラベリングでき、<br />
                                優先度を直感的に把握できます。
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 2: タイマー機能
        {
            title: '作業時間をタイマーで計測',
            subtitle: '「何に・どれくらい時間をかけたか」を自動で記録します。',
            content: (
                <div className="w-full max-w-2xl mx-auto">
                    <div className="flex items-center justify-center bg-gray-100 rounded-2xl p-8 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* タブ */}
                            <div className="flex flex-col gap-2">
                                <button className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-sm">
                                    ⏱ タイマー
                                </button>
                                <button className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-gray-500">
                                    ✏️ 手入力
                                </button>
                            </div>
                            {/* タイマー表示 */}
                            <div className="bg-white rounded-lg p-6 shadow-sm flex-1 w-full">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-700">やること</span>
                                        <div className="bg-gray-100 rounded-md px-3 py-1.5 text-sm text-gray-500 border">
                                            例: 資料作成
                                        </div>
                                    </div>
                                    <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider">
                                        00:25:30
                                    </div>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button className="bg-blue-600 text-white font-bold py-1.5 px-6 rounded-full shadow-sm">
                                        きろく
                                    </button>
                                    <button className="bg-yellow-500 text-white font-bold py-1.5 px-8 rounded-full shadow-sm">
                                        ストップ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-100">
                        <p className="text-sm text-green-800 flex items-start gap-2 justify-center">
                            <span className="text-lg">⏱️</span>
                            <span>
                                タイマーで計測した作業時間は自動でログに残り、<br />
                                <strong>チャート</strong>として可視化されます。
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 3: 締切アラート
        {
            title: '締切が近づくとアラート表示',
            subtitle: '24時間以内の締切は赤く点滅し、期限切れはグレーアウトします。',
            content: (
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
                        {/* 通常 */}
                        <div className="p-4 border border-l-8 border-l-orange-400 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-800">グループ発表 資料作成</h4>
                                <p className="text-sm text-gray-500 mt-1 font-medium">📅 締切: 2026/5/25 10:00</p>
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">通常</span>
                        </div>
                        {/* 24時間以内 */}
                        <div className="p-4 border border-l-8 border-l-cyan-400 rounded-lg flex justify-between items-center bg-red-50/30">
                            <div>
                                <h4 className="font-medium text-gray-800">英語リスニング練習</h4>
                                <p className="text-sm text-red-600 mt-1 font-medium animate-pulse">
                                    ⚠️ 締切: 2026/5/17 18:00
                                </p>
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">24h以内</span>
                        </div>
                        {/* 期限切れ */}
                        <div className="p-4 border border-l-8 border-l-gray-300 rounded-lg flex justify-between items-center opacity-60">
                            <div>
                                <h4 className="font-medium text-gray-400">過去の課題</h4>
                                <p className="text-sm text-gray-400 mt-1 font-medium line-through">
                                    📅 締切: 2026/5/10 23:59
                                </p>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">期限切れ</span>
                        </div>
                    </div>
                    <div className="mt-4 bg-red-50 rounded-lg p-4 border border-red-100">
                        <p className="text-sm text-red-800 flex items-start gap-2 justify-center">
                            <span className="text-lg">🔔</span>
                            <span>
                                締切が近い課題を見逃しません。<br />
                                <strong>色と点滅</strong>で視覚的に危険度を伝えます。
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 4: ログイン促進
        {
            title: 'さあ、始めましょう！',
            subtitle: 'Googleアカウントでログインすると、すべての機能が使えます。',
            content: (
                <div className="flex flex-col items-center gap-8 max-w-md mx-auto">
                    <div className="w-20 h-20">
                        <img src={logo} alt="SyncScale" className="w-full h-full object-contain" />
                    </div>

                    <div className="text-center space-y-3">
                        <p className="text-gray-600 leading-relaxed">
                            Googleアカウントでログインするだけで、<br />
                            あなた専用のタスク管理環境が整います。
                        </p>
                        <ul className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 rounded-xl p-5 mt-4">
                            <li className="flex items-center gap-2">
                                <span className="text-green-500 font-bold">✓</span>
                                複数デバイスでデータが自動同期
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500 font-bold">✓</span>
                                Chrome拡張機能で大学の課題を自動取得
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500 font-bold">✓</span>
                                作業ログの蓄積と分析
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-500 font-bold">✓</span>
                                無料で利用可能
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={login}
                        className="flex items-center gap-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg text-gray-700 font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-md group"
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-lg">Googleでログイン</span>
                    </button>
                </div>
            ),
        },
    ];

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;
    const isFirstStep = step === 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] p-4 md:p-8 w-full">
            {/* プログレスバー */}
            <div className="w-full max-w-5xl mb-6">
                
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* メインコンテンツカード */}
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 md:p-12 min-h-[690px] flex flex-col">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                        {currentStep.title}
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base">
                        {currentStep.subtitle}
                    </p>
                </div>

                {/* ステップコンテンツ */}
                <div className="flex-1 flex items-center justify-center">
                    {currentStep.content}
                </div>

                {/* ナビゲーションボタン */}
                {!isLastStep && (
                    <div className="grid grid-cols-3 items-center mt-8">
                        {/* 左側: 戻るボタン */}
                        <div className="justify-self-start">
                            <button
                                onClick={() => setStep(Math.max(0, step - 1))}
                                className={`text-sm font-medium px-5 py-2.5 rounded-lg transition ${
                                    isFirstStep
                                        ? 'text-gray-300 cursor-default pointer-events-none'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                                disabled={isFirstStep}
                            >
                                ← 戻る
                            </button>
                        </div>

                        {/* 中央: ページ番号 */}
                        <div className="justify-self-center">
                            <span className="text-gray-400 font-bold tracking-widest text-sm">
                                {step + 1} / {steps.length}
                            </span>
                        </div>

                        {/* 右側: 次へボタン */}
                        <div className="justify-self-end">
                            <button
                                onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                次のステップへ
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* 最後のステップ: スキップリンクは不要（ログイン前提） */}
                {isLastStep && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setStep(Math.max(0, step - 1))}
                            className="text-sm text-gray-400 hover:text-gray-600 transition pt-6"
                        >
                            ← チュートリアルに戻る
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tutorial;
