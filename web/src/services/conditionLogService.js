import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_NAME = 'conditionLogs';

/**
 * コンディションログを追加する
 * @param {string} userId - ログイン中のユーザーID
 * @param {string} taskId - 紐づくタスクID
 * @param {Object} logData - { condition: string, memo: string }
 */
export const addConditionLog = async (userId, taskId, logData) => {
    const logsCollection = collection(db, COLLECTION_NAME);
    const newLog = {
        ...logData,
        userId,
        taskId,
        createdAt: serverTimestamp()
    };
    await addDoc(logsCollection, newLog);
};

/**
 * 特定のタスクのコンディションログを取得する
 * @param {string} userId 
 * @param {string} taskId 
 */
export const getConditionLogsByTask = async (userId, taskId) => {
    const logsCollection = collection(db, COLLECTION_NAME);
    const q = query(
        logsCollection,
        where('userId', '==', userId),
        where('taskId', '==', taskId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
