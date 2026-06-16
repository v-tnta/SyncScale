import 'package:flutter/foundation.dart'
    show kIsWeb, debugPrint, defaultTargetPlatform, TargetPlatform;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../models/task.dart';
import '../widgets/formatters.dart';

/// 締切前のローカル通知を扱うサービス。
///
/// ネイティブ（iOS/Android）専用。Web では `flutter_local_notifications` が
/// 動作しないため、すべてのメソッドは早期 return する。
class NotificationService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  static const String _channelId = 'task_deadline_reminders';
  static const String _channelName = '締切リマインダー';
  static const String _channelDescription = 'タスクの締切前にお知らせする通知';

  /// プラグインとタイムゾーンを初期化する。`main()` で1回呼ぶ。
  Future<void> init() async {
    if (_initialized || kIsWeb) {
      return;
    }

    // タイムゾーンDBを読み込み、端末のローカルタイムゾーンを設定する。
    // zonedSchedule は tz.local を基準に発火時刻を解釈するため必須。
    tz_data.initializeTimeZones();
    try {
      final localName = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(localName));
    } catch (e) {
      debugPrint('ローカルタイムゾーンの取得に失敗しました（UTCで継続）: $e');
    }

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    // 権限は通知ONへの切り替え時に明示要求するため、init では要求しない。
    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
      macOS: darwinSettings,
    );
    await _plugin.initialize(settings);

    // Android 8.0+ では通知チャンネルが必須。
    final androidImpl = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.createNotificationChannel(
      const AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDescription,
        importance: Importance.high,
      ),
    );

    _initialized = true;
  }

  /// 通知に必要な権限を要求する。主要な権限（通知表示）が得られれば true を返す。
  ///
  /// Android 12+ の「正確なアラーム」権限は拒否されても通知自体は出る（時刻が多少ずれる）
  /// ため、戻り値の判定には含めない。
  Future<bool> requestPermissions() async {
    if (kIsWeb) {
      return false;
    }
    if (!_initialized) {
      await init();
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      final android = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final notif = await android?.requestNotificationsPermission();
      await android?.requestExactAlarmsPermission();
      return notif ?? true;
    }

    if (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.macOS) {
      final ios = _plugin.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();
      final res = await ios?.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
      return res ?? false;
    }

    return true;
  }

  /// タスク一覧と設定からリマインダーを同期する。
  ///
  /// 予約済み通知を全消去してから、対象タスク（締切あり・未完了・非チュートリアル・
  /// 発火時刻が未来）について再登録する。タスク数は小規模なため、全消し→再登録が
  /// 差分計算より単純で堅牢。
  Future<void> syncTaskReminders({
    required bool enabled,
    required int minutesBefore,
    required List<Task> tasks,
  }) async {
    if (kIsWeb) {
      return;
    }
    if (!_initialized) {
      await init();
    }

    await _plugin.cancelAll();
    if (!enabled || minutesBefore < 0) {
      return;
    }

    final now = DateTime.now();
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDescription,
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );

    var scheduledCount = 0;
    for (final task in tasks) {
      final deadline = task.deadline;
      if (deadline == null || task.isCompleted || task.isTutorialTask) {
        continue;
      }

      final fireTime = deadline.subtract(Duration(minutes: minutesBefore));
      if (!fireTime.isAfter(now)) {
        continue; // 発火時刻が過去のタスクはスキップ（即時通知しない）
      }

      final id = task.id.hashCode & 0x7fffffff;
      final scheduled = tz.TZDateTime.from(fireTime, tz.local);
      try {
        await _plugin.zonedSchedule(
          id,
          'まもなく締切',
          '「${task.title}」の締切まで${formatMinutesBefore(minutesBefore)}',
          scheduled,
          details,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
          payload: task.id,
        );
        scheduledCount++;
      } catch (e) {
        debugPrint('通知のスケジュールに失敗しました (${task.id}): $e');
      }
    }
    debugPrint('締切リマインダーを $scheduledCount 件スケジュールしました（$minutesBefore分前）');
  }
}
