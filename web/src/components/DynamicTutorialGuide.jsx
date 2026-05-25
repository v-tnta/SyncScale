import React, { useState, useEffect, useRef, useCallback } from 'react';

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
    // 1から14までの細分化されたステップ (13ステップの表示 + 14: 完了画面)
    const [tutorialTaskId, setTutorialTaskId] = useState(null);
    const prevTasks = useRef(tasks);
    const hasAddedLog = useRef(false);

    // ターゲット要素の矩形座標 (clip-path / ツールチップ配置に使用)
    const [targetRect, setTargetRect] = useState(null);
    const rafRef = useRef(null);

    // 各ステップの定義
    const getStepDetails = useCallback(() => {
        switch (step) {
            case 1:
                return {
                    title: "1/13. 課題名を入力しましょう ✏️",
                    desc: "タスクフォームの「タスク名」入力欄に、\n『線形代数のレポート』と入力してみましょう。",
                    targetId: "tutorial-title-input",
                    showNext: false
                };
            case 2:
                return {
                    title: "2/13. 締切日時の確認 📅",
                    desc: "ここで締め切り時間を変更できます。\nチュートリアルでは当日の23:59に固定されています。\n確認したら「次へ進む」を押してください。",
                    targetId: "tutorial-deadline-input",
                    showNext: true
                };
            case 3:
                return {
                    title: "3/13. 規模感を選択しましょう 📊",
                    desc: "課題の規模感（S/M/L）を選択してみましょう。\nご自身の思う基準で結構です！",
                    targetId: "tutorial-size-selector",
                    showNext: true
                };
            case 4:
                return {
                    title: "4/13. 課題を登録しましょう 🚀",
                    desc: "入力ができたら、「タスクを登録」ボタンを\n押して課題を追加しましょう！",
                    targetId: "tutorial-submit-button",
                    showNext: false
                };
            case 5:
                return {
                    title: "5/13. 課題の詳細を開きましょう 🔍",
                    desc: "課題がリストに追加されました！\n追加された『線形代数のレポート』をクリックして、\n詳細画面を開いてみましょう。",
                    targetId: "tutorial-target-task",
                    showNext: false
                };
            case 6:
                return {
                    title: "6/13. 課題の編集機能 ✏️",
                    desc: "詳細画面が開きました！\nこちらのボタンから、課題のタイトルや締切、\n規模感（S/M/L）をいつでも編集できます。\n確認したら「次へ進む」を押してください。",
                    targetId: "tutorial-edit-button",
                    showNext: true
                };
            case 7:
                return {
                    title: "7/13. 課題の削除機能 🗑️",
                    desc: "こちらのボタンから、課題を削除できます。\n予定が変わった時や、誤って登録した時に使用します。\n確認したら「次へ進む」を押してください。",
                    targetId: "tutorial-delete-button",
                    showNext: true
                };
            case 8:
                return {
                    title: "8/13. 手動できろくタブに切り替えましょう ⏱️",
                    desc: "作業時間はタイマーでも計れますが、\n今回は「手動できろく」タブを\nクリックして切り替えましょう。",
                    targetId: "tutorial-manual-tab",
                    showNext: false
                };
            case 9:
                return {
                    title: "9/13. 作業時間を記録しましょう 📝",
                    desc: "作業時間（例: 30分）を入力し、右側の\n「きろく」をクリックして時間を記録してみましょう。\nチャートが貯まるのを確認してください。",
                    targetId: "tutorial-manual-duration",
                    showNext: false
                };
            case 10:
                return {
                    title: "10/13. 課題を提出完了にしましょう 🏆",
                    desc: "時間の記録が終わりました！詳細画面の右上にある\n「提出完了」ボタンをクリックして、\n課題を提出してください。",
                    targetId: "tutorial-complete-button",
                    showNext: false
                };
            case 11:
                return {
                    title: "11/13. 今のコンディションを記録しましょう 😊",
                    desc: "今の気分（良・中・悪）を選択し、\nひとことメモ（任意）を入力して\n「記録して提出完了」をクリックしてください。",
                    targetId: "tutorial-condition-modal",
                    showNext: false
                };
            case 12:
                return {
                    title: "12/13. 完了したタスクを確認しましょう 🏆",
                    desc: "課題が完了しました！タスク一覧の右上にある\n「完了したタスクの一覧」をクリックしてください。",
                    targetId: "tutorial-completed-list-button",
                    showNext: false
                };
            case 13:
                return {
                    title: "13/13. 振り返りを確認しましょう 📊",
                    desc: "完了した課題のコンディションや時間ログが表示されます。\n確認したら、右上の「×」ボタンかモーダルの外側を\nクリックして閉じてください。",
                    targetId: "tutorial-completed-modal",
                    showNext: false
                };
            case 14:
                return {
                    title: "チュートリアル完了！ 🎉",
                    desc: "お疲れ様でした！これで基本的な操作はマスターです。\nSyncScaleには、manabaから課題を自動インポートできる\n便利なChrome拡張機能も備わっています。\nそれでは実際に使い始めてみましょう！",
                    targetId: null,
                    showNext: false
                };
            default:
                return { title: "", desc: "", targetId: null, showNext: false };
        }
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
            } else if (step === 8) {
                // 手動できろくタブが開かれたことを、時間入力フィールドがDOMに出現したことで検知
                const manualDuration = document.getElementById('tutorial-manual-duration');
                if (manualDuration) {
                    setStep(9);
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, [step]);

    // Step 9: 「きろく」ボタンのクリックを直接検知して次へ進む
    useEffect(() => {
        if (step !== 9) return;

        const handleSaveClick = () => {
            const durationInput = document.querySelector('#tutorial-manual-duration input');
            const durationValue = durationInput ? durationInput.value.trim() : "";
            
            if (!durationValue || isNaN(Number(durationValue)) || Number(durationValue) <= 0) {
                // 時間が未入力、または0以下の場合は進行しない
                return;
            }

            // 少し待ってから進む（保存処理が完了するのを待つ）
            setTimeout(() => {
                hasAddedLog.current = true;
                setStep(10);
            }, 500);
        };

        // ボタンが動的に出現するため、MutationObserverで監視
        const attachListener = () => {
            const saveBtn = document.getElementById('tutorial-manual-save-button');
            if (saveBtn) {
                saveBtn.addEventListener('click', handleSaveClick);
                return true;
            }
            return false;
        };

        // 即時試行
        if (!attachListener()) {
            // ボタンがまだない場合はポーリングで待つ
            const poll = setInterval(() => {
                if (attachListener()) clearInterval(poll);
            }, 200);
            return () => {
                clearInterval(poll);
                const btn = document.getElementById('tutorial-manual-save-button');
                if (btn) btn.removeEventListener('click', handleSaveClick);
            };
        }

        return () => {
            const btn = document.getElementById('tutorial-manual-save-button');
            if (btn) btn.removeEventListener('click', handleSaveClick);
        };
    }, [step]);

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
    }, [tasks, step]);

    // Step 5: 対象のタスク詳細が開かれたかを検知
    useEffect(() => {
        if (step === 5 && selectedTask && selectedTask.title.includes('線形代数のレポート')) {
            setStep(6);
        }
    }, [selectedTask, step]);

    // Step 10: 提出完了モーダルが開いたかを検知
    useEffect(() => {
        if (step === 10 && taskToComplete && taskToComplete.title.includes('線形代数のレポート')) {
            setStep(11);
        }
    }, [taskToComplete, step]);

    // Step 11: 「記録して提出完了」ボタンのクリックを直接検知して次へ進む
    useEffect(() => {
        if (step !== 11) return;

        const handleConditionSubmit = () => {
            setTimeout(() => {
                setStep(12);
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
    }, [step]);

    // Step 12: 完了モーダルが開かれたかを検知
    useEffect(() => {
        if (step === 12 && isCompletedModalOpen) {
            setStep(13);
        }
    }, [isCompletedModalOpen, step]);

    // Step 13: 完了モーダルが閉じられたかを検知
    useEffect(() => {
        if (step === 13 && !isCompletedModalOpen) {
            setStep(14);
        }
    }, [isCompletedModalOpen, step]);

    // 「次へ進む」の妥当性チェック
    const isNextEnabled = useCallback(() => {
        if (step === 2) {
            // 締切日時が設定されているか（DateTimePickerが表示されていればOK）
            const deadlineEl = document.getElementById('tutorial-deadline-input');
            return !!deadlineEl;
        }
        if (step === 3) {
            // 規模感が選択されているか（SizeLabelSelectorが表示されていればOK）
            const sizeEl = document.getElementById('tutorial-size-selector');
            return !!sizeEl;
        }
        return true;
    }, [step]);

    const handleNextStep = () => {
        if (step < 14 && isNextEnabled()) {
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
            {step < 14 && (
                <div
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
            {step < 14 && targetRect && (
                <div style={getHighlightStyle()} />
            )}

            {/* ガイドメッセージボックス - 対象要素の近くに動的配置 */}
            <div
                style={getTooltipStyle()}
                className="bg-white/95 backdrop-blur-md border border-blue-100 rounded-2xl shadow-2xl p-5 md:p-6 transition-all duration-300"
            >
                <div className="flex flex-col space-y-3">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                            チュートリアルガイド
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                            {step <= 13 ? `${step} / 13` : "完了"}
                        </span>
                    </div>

                    {/* タイトルと説明 */}
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                            {guide.title}
                        </h3>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                            {guide.desc}
                        </p>
                    </div>

                    {/* アクションボタン（手動「次へ」） */}
                    {guide.showNext && (
                        <div className="pt-2">
                            <button
                                onClick={handleNextStep}
                                disabled={!isNextEnabled()}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md transition duration-250 text-center text-sm"
                            >
                                次へ進む →
                            </button>
                        </div>
                    )}

                    {/* アクションボタン（最終ステップのみ） */}
                    {step === 14 && (
                        <div className="pt-2">
                            <button
                                onClick={() => onComplete(tutorialTaskId)}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/20 transition duration-300 transform active:scale-95 text-center text-sm"
                            >
                                サービスに戻る
                            </button>
                        </div>
                    )}

                    {/* 進捗プログレスバー */}
                    {step <= 13 && (
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                            <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                                style={{ width: `${(step / 13) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DynamicTutorialGuide;
