import 'package:cloud_firestore/cloud_firestore.dart';

class ConditionLog {
  const ConditionLog({
    required this.id,
    required this.taskId,
    required this.condition,
    required this.memo,
    this.createdAt,
  });

  final String id;
  final String taskId;
  final String condition;
  final String memo;
  final DateTime? createdAt;

  factory ConditionLog.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return ConditionLog(
      id: snapshot.id,
      taskId: data['taskId']?.toString() ?? '',
      condition: data['condition']?.toString() ?? 'fair',
      memo: data['memo']?.toString() ?? '',
      createdAt: _toDate(data['createdAt']),
    );
  }

  static DateTime? _toDate(dynamic value) {
    if (value == null) {
      return null;
    }
    if (value is Timestamp) {
      return value.toDate();
    }
    if (value is DateTime) {
      return value;
    }
    if (value is String) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}
