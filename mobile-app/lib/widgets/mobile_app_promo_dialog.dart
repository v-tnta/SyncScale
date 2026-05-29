import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../state/syncscale_state.dart';

class MobileAppPromoDialog extends StatelessWidget {
  const MobileAppPromoDialog({super.key});

  static const String _iosStoreUrl = String.fromEnvironment(
    'IOS_STORE_URL',
    defaultValue: 'https://apps.apple.com/app/syncscale',
  );

  static const String _androidStoreUrl = String.fromEnvironment(
    'ANDROID_STORE_URL',
    defaultValue: 'https://play.google.com/store/apps/details?id=app.syncscale',
  );

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (context) => const MobileAppPromoDialog(),
    );
  }

  Future<void> _launchUrl(String urlString) async {
    final url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
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
        child: SingleChildScrollView(
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
                    child: const Text(
                      '📱',
                      style: TextStyle(fontSize: 32),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // タイトル
                const Text(
                  'モバイルアプリインストールのお願い',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A), // slate-900
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),

                // 説明文
                const Text(
                  'SyncScaleは、タスク管理と実働時間の記録を組み合わせることで効果を発揮するシステムです。',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF475569), // slate-600
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 12),

                // 強調背景の説明カード
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF), // blue-50
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBFDBFE)), // blue-200
                  ),
                  child: const Text(
                    '外出先やスマートフォンからも手軽に時間計測やコンディションの入力を行っていただけるよう、便利なスマホアプリをご用意しています。ぜひインストールしてご活用ください。',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1E40AF), // blue-800
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                const Text(
                  '以下のストアボタンより、アプリをインストールしてGoogleアカウントでログインしてください。',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF475569), // slate-600
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),

                // iOSボタン
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF27272A), // neutral-800
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 2,
                  ),
                  onPressed: () => _launchUrl(_iosStoreUrl),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'App Store からダウンロード (iOS)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Androidボタン
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF27272A), // neutral-800
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 2,
                  ),
                  onPressed: () => _launchUrl(_androidStoreUrl),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.play_arrow, size: 18, color: Colors.white),
                      SizedBox(width: 8),
                      Text(
                        'Google Play からダウンロード (Android)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // あとで通知する
                Center(
                  child: TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF94A3B8), // slate-400
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () async {
                      await appState.dismissMobilePromo();
                      if (context.mounted) {
                        Navigator.of(context).pop();
                      }
                    },
                    child: const Text(
                      'あとで通知する',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
