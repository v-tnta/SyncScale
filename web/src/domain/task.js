/**
 * Task Entity
 * ビジネスロジックとしての「タスク」を定義します。
 * Firestoreなどのデータ構造に直接依存せず、アプリ内で扱う統一的な形を提供します。
 */
export class Task {
    constructor({
        id,
        title,
        status = 'TODO',
        estimatedMinutes = 0,
        deadline = null, // Date object or null
        isVisible = true,
        createdAt = new Date(),
        updatedAt = new Date(),
    }) {
        this.id = id;
        this.title = title;
        this.status = status;
        // 数値であることを保証
        this.estimatedMinutes = Number(estimatedMinutes) || 0;
        this.deadline = deadline;
        this.isVisible = isVisible;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * タスクが完了しているかどうか
     */
    isCompleted() {
        return this.status === 'DONE';
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
            // createdAtは作成時のみサーバータイムスタンプを使うため、更新時は含めないのが一般的だが、
            // ここではEntityとしての全ての値を返す
        };
    }
}
