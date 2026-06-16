import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';

/// チュートリアル完了直後に表示する「通知を許可しますか？」モーダル。
///
/// 「許可する」を押すと締切前通知を有効化し、OS の通知権限を要求する。
/// すでに許可済みの場合は呼び出し側（HomeScreen）で表示自体をスキップする。
class NotificationPermissionDialog extends StatelessWidget {
  const NotificationPermissionDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => const NotificationPermissionDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 16,
      backgroundColor: Colors.white,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // アイコン
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF), // blue-50
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFDBEAFE)), // blue-100
                  ),
                  child: const Text('🔔', style: TextStyle(fontSize: 32)),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                '通知を許可しますか？',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'タスクの締切が近づいたら通知でお知らせします。\n提出忘れを防ぐために、通知をオンにすることをおすすめします。\n（あとから設定でいつでも変更できます）',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF475569),
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Colors.blue.shade600,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () async {
                  final granted =
                      await appState.setNotificationSettings(enabled: true);
                  if (!context.mounted) return;
                  Navigator.of(context).pop();
                  if (!granted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          '通知が許可されませんでした。端末の設定からいつでも有効にできます。',
                        ),
                      ),
                    );
                  }
                },
                child: const Text(
                  '通知を許可する',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text(
                  'あとで',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
