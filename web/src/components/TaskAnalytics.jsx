import React from 'react'

/**
 * 任意の桁で四捨五入する関数
 * @param {number} value 四捨五入する数値
 * @param {number} base どの桁で四捨五入するか（1→小数第１位、2→小数第２位）
 * @return {number} 四捨五入した値
 */
function orgRound(value, base) {
    return value.toFixed((base));
}


/**
 * TaskAnalytics コンポーネント
 * タスクの「見積もり」と「実績」を比較し、時間負債を表示します。
 */
const TaskAnalytics = ({ task, logs = [] }) => {
    // 実績時間の合計 (分) を計算
    const totalActualMinutes = logs.reduce((acc, log) => {
        return acc + (log.durationSeconds || 0);
    }, 0) / 60;

    // 見積もり時間 (分)
    const estimatedMinutes = task.estimatedMinutes || 0;

    // 時間負債 (実績 - 見積もり)
    const debtMinutes = totalActualMinutes - estimatedMinutes;

    // 表示用のスタイルとテキスト
    const isOver = debtMinutes > 0;
    const debtColor = isOver ? 'text-red-500' : 'text-blue-500';
    const debtLabel = isOver ? '見積もりとの差' : '見積もりとの差';

    return (
        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            {/* 見積もり */}
            <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">見積もり</p>
                {estimatedMinutes > 60 ? (
                    <p className="text-xl font-bold text-gray-700">{orgRound(estimatedMinutes / 60, 1)}時間</p>
                ) : (
                    <p className="text-xl font-bold text-gray-700">{orgRound(estimatedMinutes, 2)}分</p>
                )}
            </div>

            {/* 実績 */}
            <div className="text-center border-l border-r border-gray-200">
                <p className="text-xs text-gray-500 mb-1">合計</p>
                {totalActualMinutes > 60 ? (
                    <p className="text-xl font-bold text-gray-700">{orgRound(totalActualMinutes / 60, 1)}時間</p>
                ) : (
                    <p className="text-xl font-bold text-gray-700">{orgRound(totalActualMinutes, 2)}分</p>
                )}
            </div>

            {/* 負債/貯金 */}
            <div className="text-center">
                <p className={`text-xs ${debtColor} mb-1 font-bold`}>{debtLabel}</p>
                <p className={`text-xl font-bold ${debtColor}`}>
                    {isOver ? '+' : ''}
                    {debtMinutes > 60 | debtMinutes < -60 ? (
                        orgRound(debtMinutes / 60, 1) + '時間'
                    ) : (
                        orgRound(debtMinutes, 2) + '分'
                    )}
                </p>
            </div>
        </div>
    )
}

export default TaskAnalytics
