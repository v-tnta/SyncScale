import 'package:flutter/material.dart';

import 'theme_storage.dart';

/// 外観テーマ（ライト／ダーク／自動）の状態。
///
/// 値は React 版と同じ 'light' / 'dark' / 'system' の文字列で保存する。
/// 未設定時は「自動」（端末の設定に従う）。
class ThemeController extends ValueNotifier<ThemeMode> {
  ThemeController() : super(ThemeMode.system);

  /// 保存済みの設定を読み込む。runApp 前に await して、起動直後のちらつきを防ぐ。
  Future<void> load() async {
    value = switch (await readThemePreference()) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
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
