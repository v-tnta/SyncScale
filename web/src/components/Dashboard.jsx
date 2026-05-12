import React from 'react';

/**
 * Dashboard コンポーネント (ダミーUI)
 * 時間負債やタスク規模別のリードタイムを可視化する
 */
const Dashboard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🧭</span> わたしのタスクのクセ
      </h2>

      <div className="space-y-8">
        {/* タスク規模別 着手リードタイム */}
        <section>
          <h3 className="text-md font-semibold text-gray-700 mb-3">🏃 着手リードタイム (規模別)</h3>
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-4">タスク登録から着手までに何日かかっているか</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">S (すぐ)</span>
                  <span className="text-gray-600">平均 0.5 日</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">M (半日〜1日)</span>
                  <span className="text-gray-600">平均 2.1 日</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">L (数日)</span>
                  <span className="text-gray-600">平均 5.4 日</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">💡 Lサイズのタスクを先延ばしにする傾向があります</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
