import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/sc_colors.dart';

class MobileAppPromoDialog extends StatelessWidget {
  const MobileAppPromoDialog({super.key});

  // build:mobile-web が shared/app_config.json から渡す配信URL。
  static const _iosStoreUrl = String.fromEnvironment('IOS_STORE_URL');

  Future<void> _openAppStore(BuildContext context) async {
    try {
      final opened = await launchUrl(
        Uri.parse(_iosStoreUrl),
        webOnlyWindowName: '_blank',
      );
      if (opened) return;
    } catch (_) {
      // 起動できない場合はダイアログ内から再試行できるようにする。
    }
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('App Storeを開けませんでした。もう一度お試しください。')),
    );
  }

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (context) => const MobileAppPromoDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 16,
      backgroundColor: context.sc.surface,
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
                      color: context.sc.primarySoft, // blue-50
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.pick(const Color(0xFFDBEAFE), context.sc.primarySoftBorder)), // blue-100
                    ),
                    child: const Text(
                      '📱',
                      style: TextStyle(fontSize: 32),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // タイトル
                Text(
                  'モバイル版のご案内',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: context.sc.heading, // slate-900
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 16),

                // 説明文
                Text(
                  'SyncScaleは、タスク管理と実働時間の記録を組み合わせることで効果を発揮するシステムです。',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.pick(const Color(0xFF475569), context.sc.textMuted), // slate-600
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 12),

                // 強調背景の説明カード
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: context.sc.primarySoft, // blue-50
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.sc.primarySoftBorder), // blue-200
                  ),
                  child: Text(
                    '外出先やスマートフォンからも、Webモバイル版で時間計測やコンディションの入力を行えます。',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: context.pick(const Color(0xFF1E40AF), const Color(0xFF93C5FD)), // blue-800
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                Text(
                  'iOSアプリをApp Storeで公開しました。Androidアプリは現在準備中です。',
                  style: TextStyle(
                    fontSize: 13,
                    color: context.pick(const Color(0xFF475569), context.sc.textMuted), // slate-600
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),

                // 現在表示しているWebモバイル版
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: const Color(0xFF2563EB),
                    disabledForegroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 2,
                  ),
                  onPressed: null,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.smartphone, size: 18, color: Colors.white),
                      SizedBox(width: 8),
                      Text(
                        'Webモバイル版を利用中',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // 公開済みのiOSアプリ
                Center(
                  child: Semantics(
                    button: true,
                    label: 'App Storeからダウンロード',
                    child: InkWell(
                      onTap: _iosStoreUrl.isEmpty
                          ? null
                          : () => _openAppStore(context),
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        // Apple指定の最小クリアスペース（バッジ高の1/4）。
                        padding: const EdgeInsets.all(10),
                        child: SvgPicture.asset(
                          'assets/store_badges/app_store_badge_ja.svg',
                          height: 40,
                          semanticsLabel: 'App Storeからダウンロード',
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Androidアプリ（準備中）
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: context.sc.surfaceAlt,
                    foregroundColor: context.sc.textSubtle,
                    disabledBackgroundColor: context.sc.surfaceAlt,
                    disabledForegroundColor: context.sc.textSubtle,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  onPressed: null,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.play_arrow, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Androidアプリ（準備中）',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 閉じる
                Center(
                  child: TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: context.sc.textSubtle, // slate-400
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      '閉じる',
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
