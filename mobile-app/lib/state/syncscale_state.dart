import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../models/condition_log.dart';
import '../models/task.dart';
import '../models/time_log.dart';
import '../services/auth_service.dart';
import '../services/syncscale_repository.dart';

class SyncScaleState extends ChangeNotifier {
  SyncScaleState({required this.authService, required this.repository});

  final AuthService authService;
  final SyncScaleRepository repository;

  User? currentUser;
  bool authLoading = true;
  bool dataLoading = false;
  String? errorMessage;
  List<Task> tasks = const [];
  List<TimeLog> timeLogs = const [];

  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<List<Task>>? _taskSubscription;
  StreamSubscription<List<TimeLog>>? _timeLogSubscription;

  bool get isAuthenticated {
    return currentUser != null && currentUser!.isAnonymous == false;
  }

  List<Task> get incompleteTasks {
    return tasks.where((task) => task.status != TaskStatus.done).toList();
  }

  List<Task> get completedTasks {
    return tasks.where((task) => task.status == TaskStatus.done).toList();
  }

  void start() {
    _authSubscription = authService.authStateChanges.listen((user) async {
      if (user == null) {
        _unbindUserData();
        authLoading = false;
        currentUser = null;
        notifyListeners();
        return;
      }

      currentUser = user;
      authLoading = false;
      _bindUserData(user.uid);
      notifyListeners();
    });
  }

  void _unbindUserData() {
    _taskSubscription?.cancel();
    _taskSubscription = null;
    _timeLogSubscription?.cancel();
    _timeLogSubscription = null;
    tasks = const [];
    timeLogs = const [];
    errorMessage = null;
  }

  void _bindUserData(String userId) {
    _taskSubscription?.cancel();
    _timeLogSubscription?.cancel();

    dataLoading = true;
    errorMessage = null;

    // Firestore は更新のたびに Stream が流れるため、UI側で再取得ボタンを
    // 押さなくても webApp と同じリアルタイム同期になります。
    _taskSubscription = repository
        .watchTasks(userId)
        .listen(
          (newTasks) {
            debugPrint('tasks fetched: ${newTasks.length}');
            tasks = newTasks;
            dataLoading = false;
            errorMessage = null;
            notifyListeners();
          },
          onError: (Object error, StackTrace stackTrace) {
            debugPrint('ERROR: タスク取得失敗: $error');
            debugPrint('STACKTRACE: $stackTrace');
            errorMessage = 'タスクの取得に失敗しました: $error';
            dataLoading = false;
            notifyListeners();
          },
        );

    _timeLogSubscription = repository
        .watchTimeLogs(userId)
        .listen(
          (newLogs) {
            debugPrint('timeLogs fetched: ${newLogs.length}');
            timeLogs = newLogs;
            notifyListeners();
          },
          onError: (Object error, StackTrace stackTrace) {
            debugPrint('ERROR: 作業ログ取得失敗: $error');
            debugPrint('STACKTRACE: $stackTrace');
            errorMessage = '作業ログの取得に失敗しました: $error';
            notifyListeners();
          },
        );
  }

  Future<void> login() async {
    debugPrint('Google login tapped');
    authLoading = true;
    notifyListeners();
    try {
      await authService.loginWithGoogle();
      // ログインが成功しても、authStateChanges が通知されるまで少し時間がかかる場合があるため
      // ここで loading を false にせず、authStateChanges のリスナーに任せるか、
      // あるいは明示的にチェックします。
    } catch (error) {
      errorMessage = 'ログインに失敗しました: $error';
      authLoading = false;
      notifyListeners();
      rethrow;
    } finally {
      // ユーザーがキャンセルした場合などはここを通る
      if (authService.currentUser == null) {
        authLoading = false;
        notifyListeners();
      }
    }
  }

  Future<void> logout() async {
    await _run(() async {
      await authService.logout();
      tasks = const [];
      timeLogs = const [];
    });
  }

  Future<void> addTask(Task task) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('add task tapped: ${task.title}');
    await _run(() => repository.addTask(user.uid, task));
  }

  Future<void> updateTask(String taskId, Map<String, dynamic> updates) async {
    final payload = <String, dynamic>{
      ...updates,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    debugPrint('update task tapped: $taskId');
    await _run(() => repository.updateTask(taskId, payload));
  }

  Future<void> softDeleteTask(String taskId) async {
    debugPrint('soft delete task tapped: $taskId');
    await _run(() => repository.softDeleteTask(taskId));
  }

  Future<void> deleteTaskCompletely(String taskId) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('physical delete task tapped: $taskId');
    await _run(() => repository.deleteTaskCompletely(user.uid, taskId));
  }

  Future<void> addTimeLog(TimeLog log) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('add timeLog tapped: ${log.taskId}');
    await _run(() => repository.addTimeLog(user.uid, log));
  }

  Future<void> completeTask({
    required Task task,
    required String condition,
    required String memo,
  }) async {
    final user = currentUser;
    if (user == null) {
      return;
    }

    await _run(() async {
      await repository.addConditionLog(
        userId: user.uid,
        taskId: task.id,
        condition: condition,
        memo: memo,
      );
      await repository.updateTask(task.id, {
        'status': TaskStatus.done.value,
        'completedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    });
  }

  Future<List<ConditionLog>> getConditionLogs(String taskId) {
    final user = currentUser;
    if (user == null) {
      return Future.value([]);
    }
    return repository.getConditionLogs(user.uid, taskId);
  }

  List<TimeLog> logsForTask(String taskId) {
    return timeLogs.where((log) => log.taskId == taskId).toList();
  }

  Future<void> _run(Future<void> Function() action) async {
    try {
      errorMessage = null;
      notifyListeners();
      await action();
    } catch (error) {
      errorMessage = error.toString();
      notifyListeners();
      rethrow;
    }
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _taskSubscription?.cancel();
    _timeLogSubscription?.cancel();
    super.dispose();
  }
}

class SyncScaleScope extends InheritedNotifier<SyncScaleState> {
  const SyncScaleScope({
    super.key,
    required SyncScaleState state,
    required super.child,
  }) : super(notifier: state);

  static SyncScaleState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<SyncScaleScope>();
    assert(scope != null, 'SyncScaleScope was not found in context.');
    return scope!.notifier!;
  }
}
