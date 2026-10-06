// テーマ設定の保存先。Web では React 版と同じ localStorage キーを共有し、
// ネイティブでは保存しない（ネイティブ版は現状ライト固定）。
export 'theme_storage_stub.dart'
    if (dart.library.js_interop) 'theme_storage_web.dart';
