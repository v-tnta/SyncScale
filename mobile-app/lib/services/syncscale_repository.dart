import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;

import '../constants/app_info.dart';
import '../models/condition_log.dart';
import '../models/onboarding.dart';
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

  Future<void> markMobileAsInstalled(String userId) async {
    await _firestore.collection('onboarding').doc(userId).set({
      'mobileInstalled': true,
    }, SetOptions(merge: true));
  }

  Stream<Onboarding?> watchOnboarding(String userId) {
    return _firestore
        .collection('onboarding')
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        return null;
      }
      return Onboarding.fromMap(snapshot.data()!);
    });
  }

  Future<void> completeTutorial(String userId) async {
    await _firestore.collection('onboarding').doc(userId).set({
      'step4': true,
      'completed': true,
      'completedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> resetTutorial(String userId) async {
    await _firestore.collection('onboarding').doc(userId).set({
      'step4': false,
      'completed': false,
      'mobileInstalled': false,
      'mobilePromoDismissedAt': FieldValue.delete(),
    }, SetOptions(merge: true));
  }

  Future<void> dismissMobilePromo(String userId) async {
    await _firestore.collection('onboarding').doc(userId).set({
      'mobilePromoDismissedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  /// 行動ログ（機能の使用状況）を1イベント=1ドキュメントとして追記する。
  /// 記録の失敗がアプリの動作を妨げないよう、例外は握りつぶしてログ出力のみ行う。
  Future<void> logActivity(
    String userId,
    String eventName, [
    Map<String, dynamic> params = const {},
  ]) async {
    try {
      await _firestore.collection('activityLogs').add({
        'userId': userId,
        'eventName': eventName,
        'params': params,
        'platform': kIsWeb ? 'mobile_web' : 'mobile',
        'appVersion': kAppVersion,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('ActivityLog Error ($eventName): $e');
    }
  }

  // Firestoreのバッチは1コミット500操作まで。上限を超えても削除が失敗しないよう、
  // 余裕を持たせたサイズに分割（チャンク）して順次コミットする
  static const int _batchChunkSize = 450;

  Future<void> _deleteRefsInChunks(List<DocumentReference> refs) async {
    for (var i = 0; i < refs.length; i += _batchChunkSize) {
      final batch = _firestore.batch();
      final end =
          (i + _batchChunkSize < refs.length) ? i + _batchChunkSize : refs.length;
      for (final ref in refs.sublist(i, end)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
  }

  Future<void> withdrawConsent(String userId) async {
    // 1. 削除対象の参照をすべて収集
    final refsToDelete = <DocumentReference>[];
    const collections = ['tasks', 'timeLogs', 'conditionLogs', 'activityLogs'];
    for (final name in collections) {
      final snap = await _firestore
          .collection(name)
          .where('userId', isEqualTo: userId)
          .get();
      for (final doc in snap.docs) {
        refsToDelete.add(doc.reference);
      }
    }

    final onboardingRef = _firestore.collection('onboarding').doc(userId);
    final onboardingSnap = await onboardingRef.get();
    if (onboardingSnap.exists) {
      refsToDelete.add(onboardingRef);
    }

    // 2. チャンク分割しながら全データを削除
    await _deleteRefsInChunks(refsToDelete);

    // 3. 最後に consents/{userId} に withdrawnAt を記録（研究記録として残す）
    final consentRef = _firestore.collection('consents').doc(userId);
    await consentRef.update({
      'withdrawnAt': FieldValue.serverTimestamp(),
    });
  }
}
