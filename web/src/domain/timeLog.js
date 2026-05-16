/**
 * TimeLog Entity
 * 実績時間ログを定義します。
 */
export class TimeLog {
    constructor({
        id,
        taskId,
        subTaskName = '',
        startTime = null,
        endTime = null,
        durationSeconds = 0,
        createdAt = new Date(),
    }) {
        this.id = id;
        this.taskId = taskId;
        this.subTaskName = subTaskName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationSeconds = durationSeconds;
        this.createdAt = createdAt;
    }

    /**
     * Firestoreからエンティティを生成
     */
    static fromFirestore(id, data) {
        return new TimeLog({
            id,
            ...data,
            startTime: data.startTime?.toDate ? data.startTime.toDate() : (data.startTime ? new Date(data.startTime) : null),
            endTime: data.endTime?.toDate ? data.endTime.toDate() : (data.endTime ? new Date(data.endTime) : null),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        });
    }

    /**
     * Firestore保存用
     */
    toFirestore() {
        return {
            taskId: this.taskId,
            subTaskName: this.subTaskName,
            startTime: this.startTime,
            endTime: this.endTime,
            durationSeconds: this.durationSeconds,
            // createdAt is usually serverTimestamp on create
        };
    }
}
