import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../models/condition_log.dart';
import '../models/onboarding.dart';
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
  Onboarding? onboarding;

  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<List<Task>>? _taskSubscription;
  StreamSubscription<List<TimeLog>>? _timeLogSubscription;
  StreamSubscription<Onboarding?>? _onboardingSubscription;

  bool get isAuthenticated {
    return currentUser != null && currentUser!.isAnonymous == false;
  }

  List<Task> get incompleteTasks {
    if (isTutorialActive) {
      return tasks
          .where((task) => task.status != TaskStatus.done && task.isTutorialTask)
          .toList();
    } else {
      return tasks
          .where((task) => task.status != TaskStatus.done && !task.isTutorialTask)
          .toList();
    }
  }

  List<Task> get completedTasks {
    if (isTutorialActive) {
      return tasks
          .where((task) => task.status == TaskStatus.done && task.isTutorialTask)
          .toList();
    } else {
      return tasks
          .where((task) => task.status == TaskStatus.done && !task.isTutorialTask)
          .toList();
    }
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
    _onboardingSubscription?.cancel();
    _onboardingSubscription = null;
    tasks = const [];
    timeLogs = const [];
    onboarding = null;
    errorMessage = null;
  }

  void _bindUserData(String userId) {
    _taskSubscription?.cancel();
    _timeLogSubscription?.cancel();
    _onboardingSubscription?.cancel();

    dataLoading = true;
    errorMessage = null;

    repository.markMobileAsInstalled(userId).catchError((e) {
      debugPrint('Failed to mark mobile as installed: $e');
    });

    _onboardingSubscription = repository
        .watchOnboarding(userId)
        .listen(
          (newOnboarding) {
            debugPrint('onboarding fetched: ${newOnboarding?.step4}');
            onboarding = newOnboarding;
            initTutorialIfNeeded();
            notifyListeners();
          },
          onError: (Object error) {
            debugPrint('ERROR: オンボーディング取得失敗: $error');
          },
        );

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

  // 各チュートリアルステップで使用するGlobalKey
  final Map<int, GlobalKey> tutorialKeys = {
    1: GlobalKey(debugLabel: 'tutorial_step_1'), // ホーム画面の「タスクを登録」FAB
    2: GlobalKey(debugLabel: 'tutorial_step_2'), // タスクフォームの「タスク名」入力欄
    3: GlobalKey(debugLabel: 'tutorial_step_3'), // タスクフォームの「締切」ボタン
    4: GlobalKey(debugLabel: 'tutorial_step_4'), // タスクフォームの「規模感」SegmentedButton
    5: GlobalKey(debugLabel: 'tutorial_step_5'), // タスクフォームの「タスクを登録」FilledButton
    6: GlobalKey(debugLabel: 'tutorial_step_6'), // 未完了タスクカード
    7: GlobalKey(debugLabel: 'tutorial_step_7'), // 詳細の「編集」ボタン
    8: GlobalKey(debugLabel: 'tutorial_step_8'), // 詳細の「完全削除」ボタン
    9: GlobalKey(debugLabel: 'tutorial_step_9'), // 詳細の「タイマーパネル」
    10: GlobalKey(debugLabel: 'tutorial_step_10'), // 詳細の「作業ログを手入力」ボタン
    11: GlobalKey(debugLabel: 'tutorial_step_11'), // 作業ログダイアログ全体
    12: GlobalKey(debugLabel: 'tutorial_step_12'), // 詳細の「提出完了にする」ボタン
    13: GlobalKey(debugLabel: 'tutorial_step_13'), // コンディションダイアログの「完了にする」ボタン
    14: GlobalKey(debugLabel: 'tutorial_step_14'), // 完了タスクカード
    15: GlobalKey(debugLabel: 'tutorial_step_15'), // 詳細のコンディション振り返りパネル
    16: GlobalKey(debugLabel: 'tutorial_step_16'), // NavigationBar 全体（カレンダータブ案内用）
  };

  GlobalKey? get tutorialTargetKey {
    final step = tutorialStep;
    if (step == null) return null;
    return tutorialKeys[step];
  }

  int? tutorialStep;

  bool get isTutorialActive =>
      onboarding != null && onboarding!.step3 == true && onboarding!.step4 == false;

  void initTutorialIfNeeded() {
    if (isTutorialActive) {
      if (tutorialStep == null) {
        tutorialStep = 1;
        _cleanupTutorialTasks();
      }
    } else {
      tutorialStep = null;
    }
  }

  Future<void> _cleanupTutorialTasks() async {
    final user = currentUser;
    if (user == null) return;
    final tutorialTasks = tasks.where((t) => t.isTutorialTask).toList();
    if (tutorialTasks.isNotEmpty) {
      debugPrint('過去のチュートリアル用タスクを自動一掃します: ${tutorialTasks.length}件');
      for (final t in tutorialTasks) {
        try {
          await repository.deleteTaskCompletely(user.uid, t.id);
        } catch (e) {
          debugPrint('チュートリアルタスクのクリーンアップに失敗しました: $e');
        }
      }
    }
  }

  void setTutorialStep(int step) {
    if (tutorialStep != step) {
      tutorialStep = step;
      notifyListeners();
    }
  }

  void nextTutorialStep() {
    if (tutorialStep != null && tutorialStep! < 17) {
      tutorialStep = tutorialStep! + 1;
      notifyListeners();
    }
  }

  Future<void> completeTutorial() async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    await _cleanupTutorialTasks();
    await _run(() => repository.completeTutorial(user.uid));
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
    _onboardingSubscription?.cancel();
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
