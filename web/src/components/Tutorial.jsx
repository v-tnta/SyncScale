import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';
import { TASK_STATUS_LABELS } from '../domain/task';
import { TUTORIAL, TUTORIAL_MOCK_TASKS } from '../content';

/**
 * チュートリアルコンポーネント
 * 未ログインユーザーに対して、アプリの機能をモックデータで体験的に紹介し、
 * 最後にGoogleログインを促すオンボーディング画面です。
 *
 * 表示文言は src/content/tutorial.js（TUTORIAL）に集約しています。
 */

// モックデータ
const MOCK_TASKS = TUTORIAL_MOCK_TASKS;

// セグメント配列（{ text, bold, br }）をJSXに描画するヘルパー
const RichText = ({ segments }) => (
    <>
        {segments.map((seg, i) => (
            <React.Fragment key={i}>
                {seg.bold ? <strong>{seg.text}</strong> : seg.text}
                {seg.br && <br />}
            </React.Fragment>
        ))}
    </>
);

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

const Tutorial = ({ onComplete }) => {
    const { login } = useAuth();
    const [step, setStep] = useState(0);

    // チュートリアルのステップ定義
    const steps = [
        // Step 0: ウェルカム画面
        {
            title: TUTORIAL.steps[0].title,
            subtitle: TUTORIAL.steps[0].subtitle,
            content: (
                <div className="flex flex-col items-center gap-8">
                    <div className="w-24 h-24 animate-bounce-slow">
                        <img src={logo} alt="SyncScale" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center max-w-md space-y-4">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {TUTORIAL.welcome.leadBefore}<br />
                            <span className="font-bold text-blue-600">{TUTORIAL.welcome.leadHighlight}</span>{TUTORIAL.welcome.leadAfter}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">{TUTORIAL.welcome.features[0].emoji}</div>
                                <p className="text-xs font-bold text-blue-700">{TUTORIAL.welcome.features[0].label}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">{TUTORIAL.welcome.features[1].emoji}</div>
                                <p className="text-xs font-bold text-green-700">{TUTORIAL.welcome.features[1].label}</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">{TUTORIAL.welcome.features[2].emoji}</div>
                                <p className="text-xs font-bold text-purple-700">{TUTORIAL.welcome.features[2].label}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        // Step 1: タスク一覧の紹介
        {
            title: TUTORIAL.steps[1].title,
            subtitle: TUTORIAL.steps[1].subtitle,
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
                                            {TASK_STATUS_LABELS[task.status] || task.status}
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
                                <RichText segments={TUTORIAL.taskListHint} />
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 2: タイマー機能
        {
            title: TUTORIAL.steps[2].title,
            subtitle: TUTORIAL.steps[2].subtitle,
            content: (
                <div className="w-full max-w-2xl mx-auto">
                    <div className="flex items-center justify-center bg-gray-100 rounded-2xl p-8 w-full">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* タブ */}
                            <div className="flex flex-col gap-2">
                                <button className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-sm">
                                    {TUTORIAL.timer.timerTab}
                                </button>
                                <button className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-gray-500">
                                    {TUTORIAL.timer.manualTab}
                                </button>
                            </div>
                            {/* タイマー表示 */}
                            <div className="bg-white rounded-lg p-6 shadow-sm flex-1 w-full">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-700">{TUTORIAL.timer.todoLabel}</span>
                                        <div className="bg-gray-100 rounded-md px-3 py-1.5 text-sm text-gray-500 border">
                                            {TUTORIAL.timer.todoPlaceholder}
                                        </div>
                                    </div>
                                    <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider">
                                        {TUTORIAL.timer.sampleTime}
                                    </div>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button className="bg-blue-600 text-white font-bold py-1.5 px-6 rounded-full shadow-sm">
                                        {TUTORIAL.timer.recordButton}
                                    </button>
                                    <button className="bg-yellow-500 text-white font-bold py-1.5 px-8 rounded-full shadow-sm">
                                        {TUTORIAL.timer.stopButton}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-100">
                        <p className="text-sm text-green-800 flex items-start gap-2 justify-center">
                            <span className="text-lg">⏱️</span>
                            <span>
                                <RichText segments={TUTORIAL.timer.hint} />
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 3: 締切アラート
        {
            title: TUTORIAL.steps[3].title,
            subtitle: TUTORIAL.steps[3].subtitle,
            content: (
                <div className="w-full max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-5 space-y-4">
                        {/* 通常 */}
                        <div className="p-4 border border-l-8 border-l-orange-400 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-800">{TUTORIAL.alert.rows[0].title}</h4>
                                <p className="text-sm text-gray-500 mt-1 font-medium">{TUTORIAL.alert.rows[0].deadline}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{TUTORIAL.alert.rows[0].badge}</span>
                        </div>
                        {/* 24時間以内 */}
                        <div className="p-4 border border-l-8 border-l-cyan-400 rounded-lg flex justify-between items-center bg-red-50/30">
                            <div>
                                <h4 className="font-medium text-gray-800">{TUTORIAL.alert.rows[1].title}</h4>
                                <p className="text-sm text-red-600 mt-1 font-medium animate-pulse">
                                    {TUTORIAL.alert.rows[1].deadline}
                                </p>
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">{TUTORIAL.alert.rows[1].badge}</span>
                        </div>
                        {/* 期限切れ */}
                        <div className="p-4 border border-l-8 border-l-gray-300 rounded-lg flex justify-between items-center opacity-60">
                            <div>
                                <h4 className="font-medium text-gray-400">{TUTORIAL.alert.rows[2].title}</h4>
                                <p className="text-sm text-gray-400 mt-1 font-medium line-through">
                                    {TUTORIAL.alert.rows[2].deadline}
                                </p>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{TUTORIAL.alert.rows[2].badge}</span>
                        </div>
                    </div>
                    <div className="mt-4 bg-red-50 rounded-lg p-4 border border-red-100">
                        <p className="text-sm text-red-800 flex items-start gap-2 justify-center">
                            <span className="text-lg">🔔</span>
                            <span>
                                <RichText segments={TUTORIAL.alert.hint} />
                            </span>
                        </p>
                    </div>
                </div>
            ),
        },
        // Step 4: ログイン促進
        {
            title: TUTORIAL.steps[4].title,
            subtitle: TUTORIAL.steps[4].subtitle,
            content: (
                <div className="flex flex-col items-center gap-8 max-w-md mx-auto">
                    <div className="w-20 h-20">
                        <img src={logo} alt="SyncScale" className="w-full h-full object-contain" />
                    </div>

                    <div className="text-center space-y-3">
                        <p className="text-gray-600 leading-relaxed">
                            {TUTORIAL.login.lead[0]}<br />
                            {TUTORIAL.login.lead[1]}
                        </p>
                        <ul className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 rounded-xl p-5 mt-4">
                            {TUTORIAL.login.benefits.map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="text-green-500 font-bold">✓</span>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {onComplete ? (
                        <button
                            onClick={onComplete}
                            className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                        >
                            <span>✨</span>
                            <span>{TUTORIAL.login.completeButtonText}</span>
                        </button>
                    ) : (
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
                            <span className="text-lg">{TUTORIAL.login.googleButtonText}</span>
                        </button>
                    )}
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
                                {TUTORIAL.nav.backText}
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
                                {TUTORIAL.nav.nextText}
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
                            {TUTORIAL.nav.backToTutorialText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tutorial;
