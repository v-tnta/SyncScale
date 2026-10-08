// テーマ設定の保存先。Web では React 版と同じ localStorage キーを共有し、
// ネイティブ（iOS/Android）では shared_preferences に保存する。
export 'theme_storage_native.dart'
    if (dart.library.js_interop) 'theme_storage_web.dart';
