/**
 * Task Entity
 * ビジネスロジックとしての「タスク」を定義します。
 * Firestoreなどのデータ構造に直接依存せず、アプリ内で扱う統一的な形を提供します。
 */

// ステータスと日本語表示のマッピング定義
export const TASK_STATUS_LABELS = {
    'TODO': 'これからやる',
    'DOING': 'とりかかり中',
    'DONE': '提出完了'
};

export class Task {
    constructor({
        id,
        title,
        status = 'TODO',
        estimatedMinutes = 0,
        deadline = null, // Date object or null
        isVisible = true,
        sizeLabel = null,
        isNew = false,
        source = 'manual',
        startedAt = null,
        completedAt = null,
        createdAt = new Date(),
        updatedAt = new Date(),
        manabaAssignmentId = null,
        manabaCourseId = null,
        courseName = null,
        type = null,
    }) {
        this.id = id;
        this.title = title;
        this.status = status;
        // 数値であることを保証
        this.estimatedMinutes = Number(estimatedMinutes) || 0;
        this.deadline = deadline;
        this.isVisible = isVisible;
        this.sizeLabel = sizeLabel;
        this.isNew = isNew;
        this.source = source;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.manabaAssignmentId = manabaAssignmentId;
        this.manabaCourseId = manabaCourseId;
        this.courseName = courseName;
        this.type = type;
    }

    /**
     * タスクが完了しているかどうか
     */
    isCompleted() {
        return this.status === 'DONE';
    }

    /**
     * ステータスの日本語表示ラベルを取得
     */
    getStatusLabel() {
        return TASK_STATUS_LABELS[this.status] || 'これからやる';
    }

    /**
     * タスクに遅れがあるか（現在時刻がdeadlineを過ぎているか）
     * @returns {boolean}
     */
    isOverdue() {
        if (!this.deadline || this.isCompleted()) return false;
        return new Date() > this.deadline;
    }

    /**
     * Firestoreなどの外部データからエンティティを生成するファクトリ
     * @param {string} id 
     * @param {Object} data //ドキュメント内のid以外のフィールド要素
     */
    static fromFirestore(id, data) {
        return new Task({
            id,
            ...data, //「...」→ id以外を展開

            // FirestoreのTimestamp型をDate型に変換
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
            deadline: data.deadline?.toDate ? data.deadline.toDate() : (data.deadline ? new Date(data.deadline) : null),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || null),

            // レガシーデータ対応 (明示的にfalseが設定されていればfalse、それ以外(undefined|true)はtrue)
            isVisible: data.isVisible !== false,
        });
    }

    /**
     * Firestore保存用にオブジェクトへ変換
     */
    toFirestore() {
        return {
            title: this.title,
            status: this.status,
            estimatedMinutes: this.estimatedMinutes,
            deadline: this.deadline,
            isVisible: this.isVisible,
            sizeLabel: this.sizeLabel,
            isNew: this.isNew,
            source: this.source,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            manabaAssignmentId: this.manabaAssignmentId,
            manabaCourseId: this.manabaCourseId,
            courseName: this.courseName,
            type: this.type,
        };
    }
}
