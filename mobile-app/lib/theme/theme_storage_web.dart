import 'package:web/web.dart' as web;

/// React 版（web/src/hooks/useTheme.jsx）と同じキー
const _key = 'syncscale_theme';

String? readThemePreference() {
  try {
    return web.window.localStorage.getItem(_key);
  } catch (_) {
    return null;
  }
}

void writeThemePreference(String value) {
  try {
    web.window.localStorage.setItem(_key, value);
  } catch (_) {
    // プライベートブラウズ等で保存できない場合は今回のセッションのみ反映
  }
}
