import 'package:cloud_firestore/cloud_firestore.dart';

class TimeLog {
  const TimeLog({
    required this.id,
    required this.taskId,
    required this.subTaskName,
    required this.startTime,
    required this.endTime,
    required this.durationSeconds,
    this.createdAt,
  });

  final String id;
  final String taskId;
  final String subTaskName;
  final DateTime? startTime;
  final DateTime? endTime;
  final int durationSeconds;
  final DateTime? createdAt;

  factory TimeLog.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return TimeLog(
      id: snapshot.id,
      taskId: data['taskId']?.toString() ?? '',
      subTaskName: data['subTaskName']?.toString() ?? '',
      startTime: _toDate(data['startTime']),
      endTime: _toDate(data['endTime']),
      durationSeconds: (data['durationSeconds'] as num?)?.toInt() ?? 0,
      createdAt: _toDate(data['createdAt']),
    );
  }

  Map<String, dynamic> toCreateMap(String userId) {
    return {
      'userId': userId,
      'taskId': taskId,
      'subTaskName': subTaskName,
      'startTime': startTime,
      'endTime': endTime,
      'durationSeconds': durationSeconds,
      'createdAt': FieldValue.serverTimestamp(),
    };
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
