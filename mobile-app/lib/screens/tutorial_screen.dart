import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../state/syncscale_state.dart';
import '../theme/sc_colors.dart';

class TutorialScreen extends StatelessWidget {
  const TutorialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'SyncScale',
          style: GoogleFonts.notoSansJp(fontWeight: FontWeight.w900),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 24),
            Text(
              '課題の「見積もり」と「実績」を並べて見る',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            Text(
              'S/M/Lの相対見積もり、タイマー計測、完了時のコンディション記録を使って、自分の段取りの癖を振り返れます。',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: context.sc.ink54,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 28),
            const _FeatureTile(
              icon: Icons.sell_outlined,
              title: 'S/M/Lで課題規模を見積もる',
              body: '細かい計画を作る前に、まず規模感を軽く決めます。',
            ),
            const _FeatureTile(
              icon: Icons.timer_outlined,
              title: 'タイマーで作業実績を記録',
              body: '作業ログから実績ガントチャートを自動で作ります。',
            ),
            const _FeatureTile(
              icon: Icons.insights_outlined,
              title: '時間負債と着手リードタイムを見る',
              body: '見積もりと実績のズレ、着手の遅れ方を可視化します。',
            ),
            const SizedBox(height: 20),
            // Sign in with Apple は iOS のみ（App Store ガイドライン 4.8）。
            // dart:io の Platform は Web ビルドで使えないため defaultTargetPlatform で判定する。
            if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) ...[
              SignInWithAppleButton(
                text: 'Appleでサインイン',
                height: 48,
                onPressed: () => _signIn(context, appState.loginWithApple),
              ),
              const SizedBox(height: 12),
            ],
            SizedBox(
              height: 48,
              child: FilledButton.icon(
                onPressed: () => _signIn(context, appState.login),
                icon: const Icon(Icons.login),
                label: const Text('Googleでログイン'),
              ),
            ),
            if (appState.errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                appState.errorMessage!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

Future<void> _signIn(
  BuildContext context,
  Future<void> Function() signIn,
) async {
  final appState = SyncScaleScope.of(context);
  try {
    await signIn();
  } catch (_) {
    // エラー文言は SyncScaleState 側で日本語化済み
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(appState.errorMessage ?? 'ログインに失敗しました'),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(body, style: TextStyle(color: context.sc.ink54)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
