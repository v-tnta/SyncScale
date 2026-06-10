import {
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { APP_INFO } from '../constants/appInfo';

const COLLECTION_NAME = 'activityLogs';

/**
 * 行動ログ（機能の使用状況）を1イベント=1ドキュメントとして追記する
 *
 * カウンタの加算ではなくイベントを生のまま記録する。
 * 集計は分析時に後から行えるが、「いつ」の情報は後から復元できないため。
 *
 * @param {string} userId - ログイン中のユーザーID
 * @param {string} eventName - イベント名 (例: 'session_start', 'timer_start')
 * @param {Object} params - イベント固有の付加情報 (例: { taskId, sizeLabel })
 */
export const addActivityLog = async (userId, eventName, params = {}) => {
    await addDoc(collection(db, COLLECTION_NAME), {
        userId,
        eventName,
        params,
        platform: 'web',
        appVersion: APP_INFO.VERSION,
        createdAt: serverTimestamp()
    });
};
