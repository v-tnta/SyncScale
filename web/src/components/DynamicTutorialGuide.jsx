import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TUTORIAL_GUIDE_STEPS, TUTORIAL_GUIDE_UI } from '../content';

/**
 * 動的チュートリアルガイド
 * ユーザーが実際の画面を操作するのに追従し、ガイドを表示します。
 * 
 * - clip-path方式のマスクで対象要素だけをくり抜いて表示
 * - ツールチップを対象要素の近くに動的配置
 * - 各ステップの完了をバリデーションしてから次へ進む
 */
const DynamicTutorialGuide = ({
    tasks,
    timeLogs,
    selectedTask,
    isCompletedModalOpen,
    taskToComplete,
    onComplete,
    step,
    setStep
}) => {
    // 1から15までの細分化されたステップ (15ステップの表示 + 16: 完了画面)
    const [tutorialTaskId, setTutorialTaskId] = useState(null);
    const prevTasks = useRef(tasks);
    const prevTimeLogs = useRef(timeLogs);

    // ターゲット要素の矩形座標 (clip-path / ツールチップ配置に使用)
    const [targetRect, setTargetRect] = useState(null);
    const rafRef = useRef(null);

    // 各ステップの定義（文言・対象IDは src/content/tutorialGuide.js に集約）
    const getStepDetails = useCallback(() => {
        return TUTORIAL_GUIDE_STEPS[step] || { title: "", desc: "", targetId: null, showNext: false };
    }, [step]);

    const guide = getStepDetails();

    // ターゲット要素の矩形を毎フレーム追跡 (requestAnimationFrame)
    useEffect(() => {
        const updateRect = () => {
            const targetId = guide.targetId;
            if (targetId) {
                const el = document.getElementById(targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setTargetRect({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        bottom: rect.bottom,
                        right: rect.right
                    });
                } else {
                    setTargetRect(null);
                }
            } else {
                setTargetRect(null);
            }
            rafRef.current = requestAnimationFrame(updateRect);
        };

        rafRef.current = requestAnimationFrame(updateRect);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [guide.targetId]);

    // DOM要素のポーリング監視 (入力値や手動タブの切り替えを検知)
    useEffect(() => {
        const interval = setInterval(() => {
            if (step === 1) {
                const titleInput = document.querySelector('#tutorial-title-input input');
                if (titleInput && titleInput.value.trim().includes('線形代数のレポート')) {
                    setStep(2);
                }
            } else if (step === 9) {
                // 手動できろくタブが開かれたことを、時間入力フィールドがDOMに出現したことで検知
                const manualDuration = document.getElementById('tutorial-manual-duration');
                if (manualDuration) {
                    setStep(10);
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, [step, setStep]);

    // Step 10: 実際に作業ログが保存されたことを検知して次へ進む。
    // ボタンのクリックだけでは、入力エラーや保存失敗でも進んでしまうため、
    // Firestore 反映後の timeLogs を完了条件にする。
    useEffect(() => {
        if (step === 10 && timeLogs.length > prevTimeLogs.current.length) {
            const addedLogs = timeLogs.filter(
                log => !prevTimeLogs.current.some(previous => previous.id === log.id)
            );
            const savedForTutorialTask = addedLogs.some(
                log => !selectedTask || log.taskId === selectedTask.id
            );
            if (savedForTutorialTask) {
                setStep(11);
            }
        }
        prevTimeLogs.current = timeLogs;
    }, [timeLogs, selectedTask, step, setStep]);

    // Step 4: タスクが追加されたかを検知
    useEffect(() => {
        if (step === 4 && tasks.length > prevTasks.current.length) {
            // 新しく追加されたタスクを見つける（以前のtasksに含まれていないIDのもの）
            const addedTask = tasks.find(t => !prevTasks.current.some(pt => pt.id === t.id));
            if (addedTask && addedTask.isTutorialTask === true) {
                setTutorialTaskId(addedTask.id);
                setStep(5);
            }
        }
        prevTasks.current = tasks;
    }, [tasks, step, setStep]);

    // Step 5: 対象のタスク詳細が開かれたかを検知
    // タイトル文字列の完全一致だけに依存すると、日本語IMEの確定タイミング等で
    // title が一致せず先に進めないことがある。チュートリアル用タスク
    // (isTutorialTask) か、ステップ4で記録した tutorialTaskId でも判定する。
    useEffect(() => {
        if (step !== 5 || !selectedTask) return;
        const isTutorialTaskDetail =
            selectedTask.isTutorialTask === true ||
            (tutorialTaskId && selectedTask.id === tutorialTaskId) ||
            (typeof selectedTask.title === 'string' && selectedTask.title.includes('線形代数のレポート'));
        if (isTutorialTaskDetail) {
            setStep(6);
        }
    }, [selectedTask, step, tutorialTaskId, setStep]);

    // Step 11: 提出完了モーダルが開いたかを検知
    // Step 5 と同様、タイトル一致だけに頼らず isTutorialTask / tutorialTaskId でも判定する。
    useEffect(() => {
        if (step !== 11 || !taskToComplete) return;
        const isTutorialTaskCompleting =
            taskToComplete.isTutorialTask === true ||
            (tutorialTaskId && taskToComplete.id === tutorialTaskId) ||
            (typeof taskToComplete.title === 'string' && taskToComplete.title.includes('線形代数のレポート'));
        if (isTutorialTaskCompleting) {
            setStep(12);
        }
    }, [taskToComplete, step, tutorialTaskId, setStep]);

    // Step 12: 「記録して提出完了」ボタンのクリックを直接検知して次へ進む
    useEffect(() => {
        if (step !== 12) return;

        const handleConditionSubmit = () => {
            setTimeout(() => {
                setStep(13);
            }, 500);
        };

        const attachListener = () => {
            const submitBtn = document.getElementById('tutorial-condition-submit');
            if (submitBtn) {
                submitBtn.addEventListener('click', handleConditionSubmit);
                return true;
            }
            return false;
        };

        if (!attachListener()) {
            const poll = setInterval(() => {
                if (attachListener()) clearInterval(poll);
            }, 200);
            return () => {
                clearInterval(poll);
                const btn = document.getElementById('tutorial-condition-submit');
                if (btn) btn.removeEventListener('click', handleConditionSubmit);
            };
        }

        return () => {
            const btn = document.getElementById('tutorial-condition-submit');
            if (btn) btn.removeEventListener('click', handleConditionSubmit);
        };
    }, [step, setStep]);

    // Step 13: 完了モーダルが開かれたかを検知
    useEffect(() => {
        if (step === 13 && isCompletedModalOpen) {
            setStep(14);
        }
    }, [isCompletedModalOpen, step, setStep]);

    // Step 14: 完了モーダルが閉じられたかを検知
    useEffect(() => {
        if (step === 14 && !isCompletedModalOpen) {
            setStep(15);
        }
    }, [isCompletedModalOpen, step, setStep]);

    // 「次へ進む」の妥当性チェック
    const isNextEnabled = useCallback(() => {
        if (step === 2) {
            // 締切日時が設定されているか（DateTimePickerが表示されていればOK）
            const deadlineEl = document.getElementById('tutorial-deadline-input');
            return !!deadlineEl;
        }
        if (step === 3) {
            // 規模感が明示的に選択されているか
            const sizeEl = document.getElementById('tutorial-size-selector');
            return !!sizeEl?.querySelector('button[aria-pressed="true"]');
        }
        return true;
    }, [step]);

    const handleNextStep = () => {
        if (step < 16 && isNextEnabled()) {
            setStep(step + 1);
        }
    };

    // clip-path でマスクを生成 (ターゲットだけくり抜き)
    const getClipPath = () => {
        if (!targetRect) return 'none';
        const padding = 8; // くり抜き領域の余白
        const extra = guide.extraPadding || {};
        const t = Math.max(0, targetRect.top - padding - (extra.top || 0));
        const l = Math.max(0, targetRect.left - padding - (extra.left || 0));
        const b = targetRect.bottom + padding + (extra.bottom || 0);
        const r = targetRect.right + padding + (extra.right || 0);

        // polygon で「全画面 - ターゲット矩形」の形状を生成
        // 外周を時計回り、くり抜きを反時計回りで描く
        return `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
            ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px
        )`;
    };

    // ツールチップの配置位置を計算 (対象要素の近くに配置)
    const getTooltipStyle = () => {
        // step 12 (コンディション入力) と step 14 (振り返り詳細) は
        // 画面中央に大きなダイアログが表示されるため、被り防止で画面最上部に固定する
        if (step === 12 || step === 14) {
            return {
                position: 'fixed',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '360px',
                zIndex: 100
            };
        }

        if (!targetRect) {
            // ターゲットなし (最終ステップ等) → 画面中央
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100
            };
        }

        const tooltipWidth = 360;
        const tooltipHeightEstimate = 200;
        const gap = 16; // ターゲットとの間隔
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // extraPadding を考慮した実効的なターゲット領域
        const extra = guide.extraPadding || {};
        const effectiveTop = targetRect.top - (extra.top || 0);
        const effectiveBottom = targetRect.bottom + (extra.bottom || 0);
        const effectiveRight = targetRect.right + (extra.right || 0);
        const effectiveLeft = targetRect.left - (extra.left || 0);

        let top, left;

        // 実効領域の下に十分なスペースがあるか
        const spaceBelow = viewportH - effectiveBottom;
        // 実効領域の上に十分なスペースがあるか
        const spaceAbove = effectiveTop;
        // 実効領域の右に十分なスペースがあるか
        const spaceRight = viewportW - effectiveRight;
        // 実効領域の左に十分なスペースがあるか
        const spaceLeft = effectiveLeft;

        if (spaceBelow >= tooltipHeightEstimate + gap) {
            // 下に配置 (実効領域の下端から)
            top = effectiveBottom + gap;
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        } else if (spaceAbove >= tooltipHeightEstimate + gap) {
            // 上に配置 (実効領域の上端から)
            top = effectiveTop - tooltipHeightEstimate - gap;
            left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        } else if (spaceRight >= tooltipWidth + gap) {
            // 右に配置
            top = targetRect.top;
            left = effectiveRight + gap;
        } else if (spaceLeft >= tooltipWidth + gap) {
            // 左に配置
            top = targetRect.top;
            left = effectiveLeft - tooltipWidth - gap;
        } else {
            // フォールバック: 画面中央下部
            top = viewportH - tooltipHeightEstimate - 24;
            left = viewportW / 2 - tooltipWidth / 2;
        }

        // 画面内に収まるようにクランプ
        left = Math.max(12, Math.min(left, viewportW - tooltipWidth - 12));
        top = Math.max(12, Math.min(top, viewportH - tooltipHeightEstimate - 12));

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${tooltipWidth}px`,
            zIndex: 100
        };
    };

    // ターゲット要素の上に配置する「光る枠」のスタイル
    const getHighlightStyle = () => {
        if (!targetRect) return null;
        const padding = 6;
        const extra = guide.extraPadding || {};
        return {
            position: 'fixed',
            top: `${targetRect.top - padding - (extra.top || 0)}px`,
            left: `${targetRect.left - padding - (extra.left || 0)}px`,
            width: `${targetRect.width + padding * 2 + (extra.left || 0) + (extra.right || 0)}px`,
            height: `${targetRect.height + padding * 2 + (extra.top || 0) + (extra.bottom || 0)}px`,
            zIndex: 76,
            pointerEvents: 'none',
            borderRadius: '12px',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 20px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease'
        };
    };

    return (
        <>
            {/* clip-pathで対象要素をくり抜いたオーバーレイ */}
            {step < 16 && (
                <div
                    data-tutorial-guide
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 75,
                        backgroundColor: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(0.5px)',
                        transition: 'clip-path 0.3s ease',
                        clipPath: getClipPath(),
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            )}

            {/* ターゲット要素のハイライト枠 */}
            {step < 16 && targetRect && (
                <div style={getHighlightStyle()} />
            )}

            {/* ガイドメッセージボックス - 対象要素の近くに動的配置 */}
            <div
                data-tutorial-guide
                style={getTooltipStyle()}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-100 dark:border-slate-800 rounded-2xl shadow-2xl p-5 md:p-6 transition-all duration-300"
            >
                <div className="flex flex-col space-y-3">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/50 uppercase tracking-wider">
                            {TUTORIAL_GUIDE_UI.badge}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            {step <= 15 ? `${step} / 15` : TUTORIAL_GUIDE_UI.doneLabel}
                        </span>
                    </div>

                    {/* タイトルと説明 */}
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
                            {guide.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                            {guide.desc}
                        </p>
                    </div>

                    {/* アクションボタン（手動「次へ」） */}
                    {guide.showNext && (
                        <div className="pt-2">
                            <button
                                onClick={handleNextStep}
                                disabled={!isNextEnabled()}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md transition duration-250 text-center text-sm"
                            >
                                {TUTORIAL_GUIDE_UI.nextButtonText}
                            </button>
                        </div>
                    )}

                    {/* アクションボタン（最終ステップのみ） */}
                    {step === 16 && (
                        <div className="pt-2">
                            <button
                                onClick={() => onComplete(tutorialTaskId)}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/20 transition duration-300 transform active:scale-95 text-center text-sm"
                            >
                                {TUTORIAL_GUIDE_UI.finishButtonText}
                            </button>
                        </div>
                    )}

                    {/* 進捗プログレスバー */}
                    {step <= 15 && (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1">
                            <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                                style={{ width: `${(step / 15) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DynamicTutorialGuide;
