import 'package:cloud_firestore/cloud_firestore.dart';

/// ユーザー単位の設定。`userSettings/{userId}` ドキュメントに対応する。
///
/// 以前は onboarding ドキュメントに同居していたが、オンボーディング進捗とは
/// 性質が異なる「設定値」のため別ドキュメントへ分離した。
class UserSettings {
  UserSettings({
    this.mobilePromoDismissedAt,
    this.notificationEnabled = false,
    this.notificationMinutesBefore = 30,
  });

  /// モバイルアプリ案内（プロモ）を「あとで」した日時
  final DateTime? mobilePromoDismissedAt;

  /// 締切前通知の有効/無効（端末ローカル通知の設定。既定 false）
  final bool notificationEnabled;

  /// 締切の何分前に通知するか（既定 30 分）
  final int notificationMinutesBefore;

  factory UserSettings.fromMap(Map<String, dynamic> map) {
    DateTime? dismissedAt;
    final rawDismissed = map['mobilePromoDismissedAt'];
    if (rawDismissed is Timestamp) {
      dismissedAt = rawDismissed.toDate();
    } else if (rawDismissed is String) {
      dismissedAt = DateTime.tryParse(rawDismissed);
    }

    final rawMinutes = map['notificationMinutesBefore'];
    final minutesBefore = rawMinutes is int
        ? rawMinutes
        : (rawMinutes is num ? rawMinutes.toInt() : 30);

    return UserSettings(
      mobilePromoDismissedAt: dismissedAt,
      notificationEnabled: map['notificationEnabled'] == true,
      notificationMinutesBefore: minutesBefore,
    );
  }
}
