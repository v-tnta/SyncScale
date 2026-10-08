import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'sc_colors.dart';

/// ライト／ダーク共通の ThemeData を組み立てる
ThemeData buildAppTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final sc = isDark ? ScColors.dark : ScColors.light;
  final seeded = ColorScheme.fromSeed(
    seedColor: const Color(0xFF2563EB),
    brightness: brightness,
  );
  // ライトは従来どおりシード色の配色のまま。ダークのみ slate 系に寄せる
  final colorScheme = isDark
      ? seeded.copyWith(
          primary: sc.primary,
          onPrimary: Colors.white,
          surface: sc.surface,
          onSurface: sc.text,
          surfaceContainerHighest: sc.surfaceAlt,
          outline: sc.borderStrong,
          outlineVariant: sc.border,
        )
      : seeded;
  final baseTheme = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: colorScheme,
  );

  return baseTheme.copyWith(
    textTheme: GoogleFonts.bizUDPGothicTextTheme(baseTheme.textTheme),
    primaryTextTheme: GoogleFonts.bizUDPGothicTextTheme(
      baseTheme.primaryTextTheme,
    ),
    scaffoldBackgroundColor: sc.background,
    dividerColor: isDark ? sc.border : null,
    appBarTheme: AppBarTheme(
      centerTitle: false,
      backgroundColor: sc.background,
      foregroundColor: isDark ? sc.heading : null,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: sc.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: isDark ? sc.border : const Color(0xFFE5E7EB)),
      ),
    ),
    dialogTheme: isDark ? DialogThemeData(backgroundColor: sc.surface) : null,
    bottomSheetTheme: isDark
        ? BottomSheetThemeData(
            backgroundColor: sc.surface,
            modalBackgroundColor: sc.surface,
          )
        : null,
    navigationBarTheme: isDark
        ? NavigationBarThemeData(
            backgroundColor: sc.surface,
            indicatorColor: sc.primarySoft,
          )
        : null,
    extensions: [sc],
  );
}
