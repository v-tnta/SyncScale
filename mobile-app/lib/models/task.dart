import 'package:cloud_firestore/cloud_firestore.dart';

enum TaskStatus {
  todo('TODO', 'これからやる'),
  doing('DOING', 'とりかかり中'),
  done('DONE', '提出完了');

  const TaskStatus(this.value, this.label);

  final String value;
  final String label;

  static TaskStatus fromValue(String? value) {
    return TaskStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => TaskStatus.todo,
    );
  }
}

class Task {
  const Task({
    required this.id,
    required this.title,
    required this.status,
    required this.estimatedMinutes,
    required this.deadline,
    required this.isVisible,
    this.sizeLabel,
    required this.isNew,
    required this.source,
    this.startedAt,
    this.completedAt,
    this.createdAt,
    this.updatedAt,
    this.manabaAssignmentId,
    this.manabaCourseId,
    this.courseName,
    this.type,
  });

  final String id;
  final String title;
  final TaskStatus status;
  final int estimatedMinutes;
  final DateTime? deadline;
  final bool isVisible;
  final String? sizeLabel;
  final bool isNew;
  final String source;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? manabaAssignmentId;
  final String? manabaCourseId;
  final String? courseName;
  final String? type;

  bool get isCompleted => status == TaskStatus.done;

  bool get isOverdue {
    if (deadline == null || isCompleted) {
      return false;
    }
    return DateTime.now().isAfter(deadline!);
  }

  factory Task.fromFirestore(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return Task(
      id: snapshot.id,
      title: (data['title'] ?? '無題のタスク').toString(),
      status: TaskStatus.fromValue(data['status']?.toString()),
      estimatedMinutes: (data['estimatedMinutes'] as num?)?.toInt() ?? 0,
      deadline: _toDate(data['deadline']),
      isVisible: data['isVisible'] != false,
      sizeLabel: data['sizeLabel']?.toString(),
      isNew: data['isNew'] == true,
      source: data['source']?.toString() ?? 'manual',
      startedAt: _toDate(data['startedAt']),
      completedAt: _toDate(data['completedAt']),
      createdAt: _toDate(data['createdAt']),
      updatedAt: _toDate(data['updatedAt']),
      manabaAssignmentId: data['manabaAssignmentId']?.toString(),
      manabaCourseId: data['manabaCourseId']?.toString(),
      courseName: data['courseName']?.toString(),
      type: data['type']?.toString(),
    );
  }

  Map<String, dynamic> toCreateMap(String userId) {
    return {
      'userId': userId,
      'title': title,
      'status': status.value,
      'estimatedMinutes': estimatedMinutes,
      'deadline': deadline,
      'isVisible': true,
      'sizeLabel': sizeLabel,
      'isNew': isNew,
      'source': source,
      'startedAt': startedAt,
      'completedAt': completedAt,
      'manabaAssignmentId': manabaAssignmentId,
      'manabaCourseId': manabaCourseId,
      'courseName': courseName,
      'type': type,
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
