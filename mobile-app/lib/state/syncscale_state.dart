import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../models/condition_log.dart';
import '../models/onboarding.dart';
import '../models/task.dart';
import '../models/time_log.dart';
import '../models/user_settings.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/syncscale_repository.dart';

class SyncScaleState extends ChangeNotifier {
  SyncScaleState({
    required this.authService,
    required this.repository,
    required this.notificationService,
  });

  final AuthService authService;
  final SyncScaleRepository repository;
  final NotificationService notificationService;

  User? currentUser;
  bool authLoading = true;
  bool dataLoading = false;
  String? errorMessage;
  List<Task> tasks = const [];
  List<TimeLog> timeLogs = const [];
  List<ConditionLog> conditionLogs = const [];
  Onboarding? onboarding;
  UserSettings? userSettings;

  StreamSubscription<User?>? _authSubscription;
  StreamSubscription<List<Task>>? _taskSubscription;
  StreamSubscription<List<TimeLog>>? _timeLogSubscription;
  StreamSubscription<List<ConditionLog>>? _conditionLogSubscription;
  StreamSubscription<Onboarding?>? _onboardingSubscription;
  StreamSubscription<UserSettings?>? _userSettingsSubscription;

  // アプリ起動ごとに1回だけ session_start を記録するためのフラグ
  bool _sessionStartLogged = false;

  /// 行動ログを fire-and-forget で記録する（失敗してもアプリの動作を妨げない）
  void logActivity(String eventName, [Map<String, dynamic> params = const {}]) {
    final user = currentUser;
    if (user == null) {
      return;
    }
    repository.logActivity(user.uid, eventName, params);
  }

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
    _conditionLogSubscription?.cancel();
    _conditionLogSubscription = null;
    _onboardingSubscription?.cancel();
    _onboardingSubscription = null;
    _userSettingsSubscription?.cancel();
    _userSettingsSubscription = null;
    tasks = const [];
    timeLogs = const [];
    conditionLogs = const [];
    onboarding = null;
    userSettings = null;
    errorMessage = null;
  }

  void _bindUserData(String userId) {
    _taskSubscription?.cancel();
    _timeLogSubscription?.cancel();
    _conditionLogSubscription?.cancel();
    _onboardingSubscription?.cancel();
    _userSettingsSubscription?.cancel();

    dataLoading = true;
    errorMessage = null;

    if (!kIsWeb) {
      repository.markMobileAsInstalled(userId).catchError((e) {
        debugPrint('Failed to mark mobile as installed: $e');
      });
    }

    // セッション開始（アプリを開いた）を記録。
    // Firebase Auth はセッションを永続化するため「ログインイベント」はほぼ発生しない。
    // そのため利用状況の把握には、起動ごとの session_start を記録する。
    // ※未同意ユーザーの書き込みは Firestore セキュリティルール側で拒否される
    if (!_sessionStartLogged) {
      _sessionStartLogged = true;
      repository.logActivity(userId, 'session_start');
    }

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

    _userSettingsSubscription = repository
        .watchUserSettings(userId)
        .listen(
          (newSettings) {
            debugPrint(
                'userSettings fetched: enabled=${newSettings?.notificationEnabled}');
            userSettings = newSettings;
            _syncReminders(); // 通知設定が変わった可能性があるため再スケジュール
            notifyListeners();
          },
          onError: (Object error) {
            debugPrint('ERROR: ユーザー設定取得失敗: $error');
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
            _syncReminders(); // タスクの追加/編集/削除を通知予約へ反映
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

    _conditionLogSubscription = repository
        .watchConditionLogs(userId)
        .listen(
          (newLogs) {
            debugPrint('conditionLogs fetched: ${newLogs.length}');
            conditionLogs = newLogs;
            notifyListeners();
          },
          onError: (Object error, StackTrace stackTrace) {
            debugPrint('ERROR: コンディションログ取得失敗: $error');
            debugPrint('STACKTRACE: $stackTrace');
            errorMessage = 'コンディションログの取得に失敗しました: $error';
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
      conditionLogs = const [];
    });
  }

  Future<void> addTask(Task task) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('add task tapped: ${task.title}');
    await _run(() => repository.addTask(user.uid, task));
    logActivity('task_create', {
      'source': 'manual',
      'isTutorialTask': task.isTutorialTask,
    });
  }

  Future<void> updateTask(String taskId, Map<String, dynamic> updates) async {
    final payload = <String, dynamic>{
      ...updates,
      'updatedAt': FieldValue.serverTimestamp(),
    };
    debugPrint('update task tapped: $taskId');

    // 行動ログ用に更新前の状態を取得（SML評価・ステータス変更の検出）
    Task? prevTask;
    for (final t in tasks) {
      if (t.id == taskId) {
        prevTask = t;
        break;
      }
    }

    await _run(() => repository.updateTask(taskId, payload));

    final newSizeLabel = updates['sizeLabel'];
    if (newSizeLabel is String && newSizeLabel != prevTask?.sizeLabel) {
      logActivity('sml_estimate', {
        'taskId': taskId,
        'sizeLabel': newSizeLabel,
        'isFirstEstimate': prevTask?.sizeLabel == null || prevTask!.sizeLabel!.isEmpty,
      });
    }
    final newStatus = updates['status'];
    if (newStatus is String && newStatus != prevTask?.status.value) {
      logActivity('task_status_change', {
        'taskId': taskId,
        'from': prevTask?.status.value,
        'to': newStatus,
      });
    }
  }

  Future<void> softDeleteTask(String taskId) async {
    debugPrint('soft delete task tapped: $taskId');
    await _run(() => repository.softDeleteTask(taskId));
    logActivity('task_delete', {'taskId': taskId});
  }

  Future<void> deleteTaskCompletely(String taskId) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('physical delete task tapped: $taskId');
    await _run(() => repository.deleteTaskCompletely(user.uid, taskId));
  }

  /// [method] は行動ログ用の記録方法: 'timer'（タイマー計測）/ 'manual'（手入力）
  Future<void> addTimeLog(TimeLog log, {String method = 'timer'}) async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    debugPrint('add timeLog tapped: ${log.taskId}');
    await _run(() async {
      await repository.addTimeLog(user.uid, log);

      // タスクの状態を自動更新 (TODO -> DOING, startedAtのセット)
      final taskIndex = tasks.indexWhere((t) => t.id == log.taskId);
      if (taskIndex != -1) {
        final task = tasks[taskIndex];
        final Map<String, dynamic> updates = {};

        if (task.status == TaskStatus.todo) {
          updates['status'] = TaskStatus.doing.value;
        }

        if (task.startedAt == null) {
          updates['startedAt'] = log.startTime;
        }

        if (updates.isNotEmpty) {
          await repository.updateTask(task.id, {
            ...updates,
            'updatedAt': FieldValue.serverTimestamp(),
          });
        }
      }
    });
    logActivity('time_log_add', {
      'taskId': log.taskId,
      'durationSeconds': log.durationSeconds,
      'method': method,
    });
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
    logActivity('condition_submit', {
      'taskId': task.id,
      'condition': condition,
    });
    logActivity('task_status_change', {
      'taskId': task.id,
      'from': task.status.value,
      'to': TaskStatus.done.value,
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
    7: GlobalKey(debugLabel: 'tutorial_step_7'), // 詳細画面全体
    8: GlobalKey(debugLabel: 'tutorial_step_8'), // 詳細の「編集」ボタン
    9: GlobalKey(debugLabel: 'tutorial_step_9'), // 詳細の「完全削除」ボタン
    10: GlobalKey(debugLabel: 'tutorial_step_10'), // 詳細の「タイマーパネル」
    11: GlobalKey(debugLabel: 'tutorial_step_11'), // 詳細の「作業ログを手入力」ボタン
    12: GlobalKey(debugLabel: 'tutorial_step_12'), // 作業ログダイアログ全体
    13: GlobalKey(debugLabel: 'tutorial_step_13'), // 詳細の「作業実績」パネル
    14: GlobalKey(debugLabel: 'tutorial_step_14'), // 詳細の「提出完了にする」ボタン
    15: GlobalKey(debugLabel: 'tutorial_step_15'), // コンディションダイアログ全体
    16: GlobalKey(debugLabel: 'tutorial_step_16'), // 完了タスクカード
    17: GlobalKey(debugLabel: 'tutorial_step_17'), // 詳細の振り返り全体
    18: GlobalKey(debugLabel: 'tutorial_step_18'), // 詳細を閉じる
    19: GlobalKey(debugLabel: 'tutorial_step_19'), // NavigationBar 全体（カレンダータブ案内用）
    20: GlobalKey(debugLabel: 'tutorial_step_20'), // カレンダー全体
  };

  GlobalKey? get tutorialTargetKey {
    final step = tutorialStep;
    if (step == null) return null;
    return tutorialKeys[step];
  }

  int? tutorialStep;
  String _currentFormTitle = '';
  String get currentFormTitle => _currentFormTitle;
  set currentFormTitle(String value) {
    if (_currentFormTitle != value) {
      _currentFormTitle = value;
      notifyListeners();
    }
  }

  bool get isTutorialActive {
    if (tutorialStep != null && tutorialStep! >= 1 && tutorialStep! <= 21) {
      return true;
    }
    return onboarding != null && onboarding!.step3 == true && onboarding!.step4 == false;
  }

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
    if (tutorialStep != null && tutorialStep! < 21) {
      tutorialStep = tutorialStep! + 1;
      notifyListeners();
    }
  }

  Future<void> completeTutorial() async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    tutorialStep = null;
    notifyListeners();
    await _cleanupTutorialTasks();
    await _run(() => repository.completeTutorial(user.uid));
  }

  Future<void> resetTutorial() async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    await _run(() => repository.resetTutorial(user.uid));
  }

  Future<void> withdrawConsent() async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    await _run(() => repository.withdrawConsent(user.uid));
  }

  Future<void> dismissMobilePromo() async {
    final user = currentUser;
    if (user == null) {
      return;
    }
    await _run(() => repository.dismissMobilePromo(user.uid));
  }

  bool get isMobilePromoOpen {
    if (!kIsWeb) return false;
    if (isTutorialActive) return false;
    final o = onboarding;
    if (o == null || !o.completed) return false;
    if (o.mobileInstalled == true) return false;

    final dismissedAt = userSettings?.mobilePromoDismissedAt;
    if (dismissedAt != null) {
      final now = DateTime.now();
      final diff = now.difference(dismissedAt);
      if (diff.inHours < 24) {
        return false;
      }
    }
    return true;
  }

  // ===== 締切前通知 =====

  /// 締切前通知が有効か（未設定時は false）
  bool get notificationEnabled => userSettings?.notificationEnabled ?? false;

  /// 締切の何分前に通知するか（未設定時は 30 分）
  int get notificationMinutesBefore =>
      userSettings?.notificationMinutesBefore ?? 30;

  /// 締切前通知の設定を更新する。
  ///
  /// 有効化（enabled=true）への切り替え時は OS の通知権限を要求する。
  /// 主要な権限が拒否された場合は false を返す（設定値自体は保存する）。
  Future<bool> setNotificationSettings({bool? enabled, int? minutesBefore}) async {
    final user = currentUser;
    if (user == null) {
      return false;
    }

    var permissionGranted = true;
    if (enabled == true) {
      permissionGranted = await notificationService.requestPermissions();
    }

    await _run(() => repository.updateNotificationSettings(
          user.uid,
          enabled: enabled,
          minutesBefore: minutesBefore,
        ));

    // Firestore の onboarding ストリーム経由でも再同期されるが、即時反映のため
    // 楽観的に新しい値でスケジュールし直す。
    if (!kIsWeb) {
      notificationService.syncTaskReminders(
        enabled: enabled ?? notificationEnabled,
        minutesBefore: minutesBefore ?? notificationMinutesBefore,
        tasks: tasks,
      );
    }

    logActivity('notification_settings_update', {
      if (enabled != null) 'enabled': enabled,
      if (minutesBefore != null) 'minutesBefore': minutesBefore,
    });

    return permissionGranted;
  }

  /// 現在の設定とタスク一覧から通知予約を同期する（fire-and-forget）。
  void _syncReminders() {
    if (kIsWeb) {
      return;
    }
    notificationService.syncTaskReminders(
      enabled: notificationEnabled,
      minutesBefore: notificationMinutesBefore,
      tasks: tasks,
    );
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
    _conditionLogSubscription?.cancel();
    _onboardingSubscription?.cancel();
    _userSettingsSubscription?.cancel();
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
