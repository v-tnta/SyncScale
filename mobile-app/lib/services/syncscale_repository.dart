import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/condition_log.dart';
import '../models/task.dart';
import '../models/time_log.dart';

class SyncScaleRepository {
  SyncScaleRepository({FirebaseFirestore? firestore})
    : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  Stream<List<Task>> watchTasks(String userId) {
    final query = _firestore
        .collection('tasks')
        .where('userId', isEqualTo: userId)
        .orderBy('deadline');

    return query.snapshots().map((snapshot) {
      return snapshot.docs
          .map(Task.fromFirestore)
          .where((task) => task.isVisible)
          .toList();
    });
  }

  Stream<List<TimeLog>> watchTimeLogs(String userId) {
    final query = _firestore
        .collection('timeLogs')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true);

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map(TimeLog.fromFirestore).toList();
    });
  }

  Future<void> addTask(String userId, Task task) async {
    await _firestore.collection('tasks').add(task.toCreateMap(userId));
  }

  Future<void> updateTask(String taskId, Map<String, dynamic> updates) async {
    await _firestore.collection('tasks').doc(taskId).update(updates);
  }

  Future<void> softDeleteTask(String taskId) async {
    await updateTask(taskId, {'isVisible': false});
  }

  Future<void> deleteTaskCompletely(String userId, String taskId) async {
    final timeLogs =
        await _firestore
            .collection('timeLogs')
            .where('userId', isEqualTo: userId)
            .where('taskId', isEqualTo: taskId)
            .get();
    final conditionLogs =
        await _firestore
            .collection('conditionLogs')
            .where('userId', isEqualTo: userId)
            .where('taskId', isEqualTo: taskId)
            .get();

    final batch = _firestore.batch();
    for (final log in timeLogs.docs) {
      batch.delete(log.reference);
    }
    for (final log in conditionLogs.docs) {
      batch.delete(log.reference);
    }
    batch.delete(_firestore.collection('tasks').doc(taskId));
    await batch.commit();
  }

  Future<void> addTimeLog(String userId, TimeLog log) async {
    await _firestore.collection('timeLogs').add(log.toCreateMap(userId));
  }

  Future<void> addConditionLog({
    required String userId,
    required String taskId,
    required String condition,
    required String memo,
  }) async {
    await _firestore.collection('conditionLogs').add({
      'userId': userId,
      'taskId': taskId,
      'condition': condition,
      'memo': memo,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<List<ConditionLog>> getConditionLogs(String userId, String taskId) async {
    final snapshot =
        await _firestore
            .collection('conditionLogs')
            .where('userId', isEqualTo: userId)
            .where('taskId', isEqualTo: taskId)
            .get();
    final logs = snapshot.docs.map(ConditionLog.fromFirestore).toList();
    logs.sort((a, b) {
      final aTime = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bTime = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bTime.compareTo(aTime);
    });
    return logs;
  }
}
