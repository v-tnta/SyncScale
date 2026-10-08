import 'package:shared_preferences/shared_preferences.dart';

/// Web 版（localStorage）と同じキー名に揃えている
const _key = 'syncscale_theme';

Future<String?> readThemePreference() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_key);
  } catch (_) {
    return null;
  }
}

Future<void> writeThemePreference(String value) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, value);
  } catch (_) {
    // 保存に失敗しても今回の起動中は選択したテーマで表示する
  }
}
