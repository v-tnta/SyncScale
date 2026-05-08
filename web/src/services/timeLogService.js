import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TimeLog } from '../domain/timeLog';

const COLLECTION_NAME = 'timeLogs';

/**
 * タイムログ一覧をリアルタイム監視する
 * @param {string} userId - ログイン中のユーザーID
 */
export const subscribeToTimeLogs = (userId, onUpdate, onError) => {
    const logsCollection = collection(db, COLLECTION_NAME);
    const q = query(
        logsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((doc) => {
            return TimeLog.fromFirestore(doc.id, doc.data());
        });
        onUpdate(logs);
    }, onError);
};

/**
 * タイムログを追加する
 * @param {string} userId - ログイン中のユーザーID
 */
export const addTimeLog = async (userId, logData) => {
    const logsCollection = collection(db, COLLECTION_NAME);
    await addDoc(logsCollection, {
        ...logData, // Entityから変換、またはそのままオブジェクト
        userId, // ユーザーIDを保存
        createdAt: serverTimestamp()
    });
};
