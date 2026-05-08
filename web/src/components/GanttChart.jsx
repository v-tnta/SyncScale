import React, { useMemo } from 'react'

/**
 * GanttChart コンポーネント (Stacked Style)
 * 作業ログを「積み上げ式」で表示します。
 * 現実の時間軸ではなく、作業時間の合計経過時間を横軸にとります。
 */
const GanttChart = ({ logs = [] }) => {
    if (logs.length === 0) {
        return <p className="text-gray-400 text-sm p-4 text-center">作業ログがありません。</p>;
    }

    // 計算ロジック
    const { totalDurationMin, sortedLogs, ticks } = useMemo(() => {
        // 登録順（作成日時順）にソート。無い場合はstartTimeを使う。
        const sorted = [...logs].sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.getTime() : (a.startTime ? a.startTime.getTime() : 0);
            const timeB = b.createdAt ? b.createdAt.getTime() : (b.startTime ? b.startTime.getTime() : 0);
            return timeA - timeB;
        });

        // 合計時間（分）を計算（最低でも1分とする）
        const totalSec = sorted.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
        const totalMin = Math.ceil(totalSec / 60);

        // 目盛り生成 (0, 30, 60, ... 合計時間を超える直前の30分刻みまで + 余白分)
        // 最低でも少し余白を持たせるために +30分 くらいまで描画
        const maxTick = Math.ceil(totalMin / 30) * 30 + 30;
        const tickList = [];
        for (let t = 0; t <= maxTick; t += 30) {
            tickList.push(t);
        }

        return {
            totalDurationMin: totalMin,
            sortedLogs: sorted,
            ticks: tickList,
            scaleMaxMin: maxTick // チャートの最大描画幅（分）
        };
    }, [logs]);

    if (totalDurationMin === 0) return <p className="text-gray-400 text-sm p-4 text-center">作業時間が0分です。</p>;

    // スケール定数: 標準は1分あたり3px
    const STANDARD_PIXELS_PER_MIN = 3;

    // コンテナの幅を取得して、収まるようにスケールを調整する
    const containerRef = React.useRef(null);
    const [containerWidth, setContainerWidth] = React.useState(0);

    React.useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        // 初回とウィンドウリサイズ時に実行
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // 実際のスケール計算: コンテナ幅に収まる最小スケール vs 標準スケール で小さい方を採用
    // 0除算や初期値などへの対策も含む
    const pixelsPerMin = useMemo(() => {
        if (!containerWidth || !ticks.length) return STANDARD_PIXELS_PER_MIN;

        // 全体を表示するのに必要な分の最大値（分）
        const maxMin = ticks[ticks.length - 1];

        // コンテナに収める場合のスケール (少し余白を見るため width - 20 くらいで計算)
        const fitScale = (containerWidth - 20) / maxMin;

        // 標準より小さくなる（＝縮小が必要）なら fitScale を使う
        return Math.min(STANDARD_PIXELS_PER_MIN, fitScale);
    }, [containerWidth, ticks]);

    // バーの色パレット
    const colors = [
        'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];

    return (
        <div ref={containerRef} className="mt-6 w-full pb-4">
            <h3 className="text-sm font-bold text-gray-600 mb-2 sticky left-0">実績ガントチャート</h3>

            {/* チャートコンテナ */}
            <div
                className="relative min-h-[100px]"
                style={{ width: '100%' }} // 幅はコンテナいっぱい
            >
                {/* 1. 目盛り (X軸) */}
                <div className="absolute top-0 w-full h-6 border-b border-gray-300">
                    {ticks.map((tick) => (
                        <div
                            key={tick}
                            className="absolute bottom-0 text-xs text-gray-400 transform -translate-x-1/2 transition-all duration-300"
                            style={{ left: `${tick * pixelsPerMin}px` }}
                        >
                            <div className="h-2 w-px bg-gray-300 mx-auto mb-1"></div>
                            {tick % 60 === 0 && tick !== 0 ? tick / 60 + 'h' : tick !== 0 ? tick + 'm' : '0'}
                        </div>
                    ))}
                </div>

                {/* 2. スタックバーエリア */}
                <div className="absolute top-8 left-0 h-12 bg-gray-100 rounded-lg border border-gray-200 flex overflow-hidden transition-all duration-300"
                    style={{ width: `${ticks[ticks.length - 1] * pixelsPerMin}px` }} // バー全体の幅も動的に
                >
                    {sortedLogs.map((log, index) => {
                        // 1分未満の作業でも視認できるように最低1分とする
                        const durationMin = Math.max(1, Math.round((log.durationSeconds || 0) / 60));

                        const widthPx = durationMin * pixelsPerMin;
                        const colorClass = colors[index % colors.length];

                        return (
                            <div
                                key={log.id}
                                className={`${colorClass} text-white text-xs flex items-center justify-center overflow-hidden whitespace-nowrap border-r border-white/20 hover:opacity-90 transition-all`}
                                style={{
                                    width: `${widthPx}px`,
                                    height: '100%',
                                    flexShrink: 0
                                }}
                                title={`${log.subTaskName}: ${durationMin}分`}
                            >
                                <span className="font-bold px-1 drop-shadow-md">
                                    {log.subTaskName || '作業'}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* 背景グリッド線 (装飾) */}
                <div className="absolute top-8 bottom-0 w-full pointer-events-none z-0">
                    {ticks.map((tick) => (
                        <div
                            key={tick}
                            className="absolute top-0 h-14 w-px bg-gray-200 border-l border-dashed border-gray-300 transition-all duration-300"
                            style={{ left: `${tick * pixelsPerMin}px` }}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default GanttChart
