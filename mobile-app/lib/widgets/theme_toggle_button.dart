import 'package:flutter/material.dart';

import '../theme/sc_colors.dart';
import '../theme/theme_controller.dart';

/// ヘッダー用のテーマ切り替えボタン（ライト → ダーク → 自動）。
/// React 版の ThemeToggle と同じ見た目・順序に揃えている。
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final sc = context.sc;
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeController,
      builder: (context, mode, _) {
        return Tooltip(
          message: 'テーマ切り替え: 現在は「${themeController.label}」（タップで切替）',
          child: OutlinedButton.icon(
            onPressed: themeController.cycle,
            style: OutlinedButton.styleFrom(
              foregroundColor: sc.text,
              backgroundColor: sc.surface,
              side: BorderSide(color: context.isDark ? sc.borderStrong : sc.border),
              padding: const EdgeInsets.symmetric(horizontal: 9),
              minimumSize: const Size(0, 36),
              visualDensity: VisualDensity.compact,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: _ThemeIcon(mode: mode),
            label: Text(
              themeController.label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        );
      },
    );
  }
}

class _ThemeIcon extends StatelessWidget {
  const _ThemeIcon({required this.mode});

  final ThemeMode mode;

  static const _sun = Color(0xFFF59E0B); // amber-500

  @override
  Widget build(BuildContext context) {
    final moon = context.isDark
        ? const Color(0xFFA5B4FC) // indigo-300
        : const Color(0xFF6366F1); // indigo-500
    switch (mode) {
      case ThemeMode.light:
        return const Icon(Icons.wb_sunny_outlined, size: 17, color: _sun);
      case ThemeMode.dark:
        return Icon(Icons.dark_mode_outlined, size: 17, color: moon);
      case ThemeMode.system:
        // 太陽と月を重ねて「端末の設定に従う」ことを表す
        return SizedBox(
          width: 22,
          height: 18,
          child: Stack(
            children: [
              const Positioned(
                left: 0,
                top: 0,
                child: Icon(Icons.wb_sunny_outlined, size: 14, color: _sun),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Icon(Icons.dark_mode, size: 12, color: moon),
              ),
            ],
          ),
        );
    }
  }
}
