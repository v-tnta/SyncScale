import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'theme_storage.dart';

/// 外観テーマ（ライト／ダーク／自動）の状態。
///
/// 値は React 版と同じ 'light' / 'dark' / 'system' の文字列で保存する。
/// ネイティブ版は App Store 審査中の見た目を変えないためライト固定。
class ThemeController extends ValueNotifier<ThemeMode> {
  ThemeController() : super(_initialMode());

  static ThemeMode _initialMode() {
    if (!kIsWeb) return ThemeMode.light;
    switch (readThemePreference()) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  /// ライト → ダーク → 自動 の順に切り替える（React 版の ThemeToggle と同じ順序）
  void cycle() {
    final next = switch (value) {
      ThemeMode.light => ThemeMode.dark,
      ThemeMode.dark => ThemeMode.system,
      ThemeMode.system => ThemeMode.light,
    };
    value = next;
    writeThemePreference(switch (next) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    });
  }

  String get label => switch (value) {
        ThemeMode.light => 'ライト',
        ThemeMode.dark => 'ダーク',
        ThemeMode.system => '自動',
      };
}

/// アプリ全体で 1 つのテーマ状態を共有する
final themeController = ThemeController();
