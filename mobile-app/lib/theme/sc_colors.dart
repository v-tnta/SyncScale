import 'package:flutter/material.dart';

/// 画面共通の意味ベースの色（React 版の slate 系トークンに対応）。
///
/// ウィジェットでは `context.sc.border` のように参照し、
/// ライト／ダークで値を切り替える。
@immutable
class ScColors extends ThemeExtension<ScColors> {
  const ScColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.surfaceSubtle,
    required this.border,
    required this.borderStrong,
    required this.heading,
    required this.text,
    required this.textMuted,
    required this.textSubtle,
    required this.primary,
    required this.primarySoft,
    required this.primarySoftBorder,
    required this.primaryText,
    required this.shadow,
    required this.ink87,
    required this.ink54,
    required this.ink45,
    required this.ink38,
  });

  /// 画面の背景
  final Color background;

  /// カード・ダイアログなどの面
  final Color surface;

  /// 面の上に置く一段濃い面（チップ・入力欄の背景など）
  final Color surfaceAlt;

  /// 面の上に置くごく薄い面
  final Color surfaceSubtle;
  final Color border;
  final Color borderStrong;
  final Color heading;
  final Color text;
  final Color textMuted;
  final Color textSubtle;
  final Color primary;
  final Color primarySoft;
  final Color primarySoftBorder;

  /// 淡い背景上の青文字・アイコン
  final Color primaryText;
  final Color shadow;

  /// 既存の Colors.black87 / 54 / 45 / 38 の置き換え用。
  /// ライトでは元の値のまま、ダークでは slate 系の文字色になる。
  final Color ink87;
  final Color ink54;
  final Color ink45;
  final Color ink38;

  static const light = ScColors(
    background: Color(0xFFF7F8FB),
    surface: Colors.white,
    surfaceAlt: Color(0xFFF1F5F9), // slate-100
    surfaceSubtle: Color(0xFFF8FAFC), // slate-50
    border: Color(0xFFE2E8F0), // slate-200
    borderStrong: Color(0xFFCBD5E1), // slate-300
    heading: Color(0xFF0F172A), // slate-900
    text: Color(0xFF334155), // slate-700
    textMuted: Color(0xFF64748B), // slate-500
    textSubtle: Color(0xFF94A3B8), // slate-400
    primary: Color(0xFF2563EB),
    primarySoft: Color(0xFFEFF6FF), // blue-50
    primarySoftBorder: Color(0xFFBFDBFE), // blue-200
    primaryText: Color(0xFF2563EB),
    shadow: Color(0x14000000),
    ink87: Colors.black87,
    ink54: Colors.black54,
    ink45: Colors.black45,
    ink38: Colors.black38,
  );

  static const dark = ScColors(
    background: Color(0xFF020617), // slate-950
    surface: Color(0xFF0F172A), // slate-900
    surfaceAlt: Color(0xFF1E293B), // slate-800
    surfaceSubtle: Color(0xFF111A2E), // slate-850
    border: Color(0xFF1E293B), // slate-800
    borderStrong: Color(0xFF334155), // slate-700
    heading: Color(0xFFF8FAFC), // slate-50
    text: Color(0xFFE2E8F0), // slate-200
    textMuted: Color(0xFF94A3B8), // slate-400
    textSubtle: Color(0xFF64748B), // slate-500
    primary: Color(0xFF3B82F6), // blue-500
    primarySoft: Color(0x99172554), // blue-950/60
    primarySoftBorder: Color(0xFF1E3A8A), // blue-900
    primaryText: Color(0xFF60A5FA), // blue-400
    shadow: Color(0x66000000),
    ink87: Color(0xFFE2E8F0), // slate-200
    ink54: Color(0xFF94A3B8), // slate-400
    ink45: Color(0xFF94A3B8), // slate-400
    ink38: Color(0xFF64748B), // slate-500
  );

  @override
  ScColors copyWith() => this;

  @override
  ScColors lerp(ThemeExtension<ScColors>? other, double t) {
    if (other is! ScColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return ScColors(
      background: l(background, other.background),
      surface: l(surface, other.surface),
      surfaceAlt: l(surfaceAlt, other.surfaceAlt),
      surfaceSubtle: l(surfaceSubtle, other.surfaceSubtle),
      border: l(border, other.border),
      borderStrong: l(borderStrong, other.borderStrong),
      heading: l(heading, other.heading),
      text: l(text, other.text),
      textMuted: l(textMuted, other.textMuted),
      textSubtle: l(textSubtle, other.textSubtle),
      primary: l(primary, other.primary),
      primarySoft: l(primarySoft, other.primarySoft),
      primarySoftBorder: l(primarySoftBorder, other.primarySoftBorder),
      primaryText: l(primaryText, other.primaryText),
      shadow: l(shadow, other.shadow),
      ink87: l(ink87, other.ink87),
      ink54: l(ink54, other.ink54),
      ink45: l(ink45, other.ink45),
      ink38: l(ink38, other.ink38),
    );
  }
}

extension ScColorsContext on BuildContext {
  ScColors get sc => Theme.of(this).extension<ScColors>() ?? ScColors.light;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  /// ライト用の色はそのまま、ダーク時だけ別の色を使う
  Color pick(Color light, Color dark) => isDark ? dark : light;
}
