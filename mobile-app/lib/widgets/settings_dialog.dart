import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/auth_service.dart';
import '../state/syncscale_state.dart';
import 'formatters.dart';
import '../theme/sc_colors.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (context) => const SettingsDialog(),
    );
  }

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  bool _isTransitioning = false;
  String _loadingText = '';

  Future<void> _runAction(String message, Future<void> Function() action) async {
    setState(() {
      _loadingText = message;
      _isTransitioning = true;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e is ReauthenticationCancelled ? e.toString() : 'エラーが発生しました: $e',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isTransitioning = false;
        });
      }
    }
  }

  /// 「締切の何分前」のプリセット（分）
  static const List<int> _minutePresets = [10, 30, 60, 180, 1440];

  Widget _buildNotificationSection(SyncScaleState appState) {
    final enabled = appState.notificationEnabled;
    final minutesBefore = appState.notificationMinutesBefore;
    final isCustom = enabled && !_minutePresets.contains(minutesBefore);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.sc.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SwitchListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            secondary: const Text('🔔', style: TextStyle(fontSize: 22)),
            title: const Text(
              '締切前に通知',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            subtitle: Text(
              enabled
                  ? '締切の${formatMinutesBefore(minutesBefore)}前にお知らせします'
                  : 'タスクの締切前にお知らせします',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            value: enabled,
            onChanged: (value) => _toggleNotification(appState, value),
          ),
          if (enabled) ...[
            Divider(height: 1, color: context.sc.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '何分前に通知するか',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.pick(const Color(0xFF475569), context.sc.textMuted),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final preset in _minutePresets)
                        ChoiceChip(
                          label: Text(formatMinutesBefore(preset)),
                          selected: !isCustom && minutesBefore == preset,
                          onSelected: (_) => _selectMinutes(appState, preset),
                        ),
                      ChoiceChip(
                        label: Text(
                          isCustom
                              ? 'カスタム (${formatMinutesBefore(minutesBefore)})'
                              : 'カスタム',
                        ),
                        selected: isCustom,
                        onSelected: (_) => _pickCustomMinutes(appState),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          // Web版では実際の通知が届かないため、その旨を明記する
          if (kIsWeb) ...[
            Divider(height: 1, color: context.sc.border),
            Container(
              width: double.infinity,
              color: context.pick(const Color(0xFFFFFBEB), const Color(0x66451A03)),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              child: Text(
                '📱 通知はスマートフォンアプリ（インストール版）でのみ届きます。こちらでは設定の保存のみ行えます。',
                style: TextStyle(
                  fontSize: 11,
                  color: context.pick(const Color(0xFFB45309), const Color(0xFFFCD34D)),
                  height: 1.4,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _toggleNotification(SyncScaleState appState, bool value) async {
    final granted = await appState.setNotificationSettings(enabled: value);
    if (!mounted) return;
    if (value && !granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('通知の許可が必要です。端末の設定から通知を許可してください。'),
        ),
      );
    }
  }

  Future<void> _selectMinutes(SyncScaleState appState, int minutes) async {
    await appState.setNotificationSettings(minutesBefore: minutes);
  }

  Future<void> _pickCustomMinutes(SyncScaleState appState) async {
    final controller = TextEditingController(
      text: appState.notificationMinutesBefore.toString(),
    );
    final result = await showDialog<int>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('何分前に通知するか'),
          content: TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              suffixText: '分前',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('キャンセル'),
            ),
            FilledButton(
              onPressed: () {
                final value = int.tryParse(controller.text.trim());
                if (value == null || value <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('1以上の数値を入力してください。')),
                  );
                  return;
                }
                Navigator.of(context).pop(value);
              },
              child: const Text('決定'),
            ),
          ],
        );
      },
    );
    if (result != null) {
      await appState.setNotificationSettings(minutesBefore: result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return Stack(
      children: [
        Dialog(
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
                    // ヘッダー
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text('⚙️', style: TextStyle(fontSize: 20)),
                            SizedBox(width: 8),
                            Text(
                              '設定',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: context.sc.heading,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close, color: Colors.grey),
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    Divider(height: 24, color: context.sc.border),

                    if (appState.currentUser != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: context.sc.surfaceSubtle,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: context.sc.border),
                        ),
                        child: Row(
                          children: [
                            ClipOval(
                              child: appState.currentUser?.photoURL != null && appState.currentUser!.photoURL!.isNotEmpty
                                  ? Image.network(
                                      appState.currentUser!.photoURL!,
                                      width: 48,
                                      height: 48,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          width: 48,
                                          height: 48,
                                          color: context.sc.surfaceAlt,
                                          child: const Icon(Icons.person, size: 24, color: Colors.grey),
                                        );
                                      },
                                    )
                                  : Container(
                                      width: 48,
                                      height: 48,
                                      color: context.sc.surfaceAlt,
                                      child: const Icon(Icons.person, size: 24, color: Colors.grey),
                                    ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    appState.currentUser!.displayName ?? 'ユーザー',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: context.sc.heading,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    appState.currentUser!.email ?? 'メールアドレス未設定',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: context.sc.textMuted,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // 締切前通知（設定は web/ネイティブ共通で保存。
                    // 実際の通知はスマホアプリでのみ配信されるため、Web では注記を表示）
                    _buildNotificationSection(appState),
                    const SizedBox(height: 12),

                    // 設定メニュー
                    ListTile(
                      leading: const Text('🔄', style: TextStyle(fontSize: 22)),
                      title: const Text(
                        'チュートリアルの再実行',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      subtitle: const Text(
                        '使い方をもう一度確認する',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: context.sc.border),
                      ),
                      onTap: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('チュートリアルの再実行'),
                            content: const Text(
                              'チュートリアルを再実行しますか？\n（一時的にオンボーディング画面に戻りますが、登録したデータは消えません）',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(false),
                                child: const Text('キャンセル'),
                              ),
                              FilledButton(
                                onPressed: () => Navigator.of(context).pop(true),
                                child: const Text('再実行'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          if (!context.mounted) return;
                          Navigator.of(context).pop(); // 設定ダイアログを閉じる
                          await _runAction('チュートリアルを準備中...', () async {
                            await appState.resetTutorial();
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // 研究参加オンボーディング (/info への遷移)
                    ListTile(
                      leading: const Text('📋', style: TextStyle(fontSize: 22)),
                      title: const Text(
                        '研究参加オンボーディング',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      subtitle: const Text(
                        'アンケートやリンクを再確認する',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: context.sc.border),
                      ),
                      onTap: () async {
                        final uri = Uri.parse('/info');
                        try {
                          await launchUrl(uri, webOnlyWindowName: '_self');
                        } catch (e) {
                          debugPrint('Failed to launch /info: $e');
                        }
                      },
                    ),
                    const SizedBox(height: 24),
                    Divider(height: 1, color: context.sc.border),
                    const SizedBox(height: 16),

                    // ログアウトボタン
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.pick(const Color(0xFF1E293B), const Color(0xFF334155)), // slate-800
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () async {
                        Navigator.of(context).pop();
                        await appState.logout();
                      },
                      child: const Text(
                        'ログアウト',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // 同意の撤回・アカウント削除ボタン（App Store ガイドライン 5.1.1(v)）
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444), // red-600
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () async {
                        final confirm1 = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('⚠️ 同意の撤回とアカウント削除'),
                            content: const Text(
                              '研究内容への同意を撤回し、アカウントを削除しますか？\n\n※この操作を実行すると、あなたのタスク、時間ログ、コンディションログ、利用状況ログと、ログイン用のアカウントが完全に削除され、復元することはできなくなります。\n\n※研究倫理上の記録として、同意・撤回の記録（日時と同意書のバージョン）のみ保存されます。\n\n※削除の前に、本人確認のため再度サインインを求められることがあります。',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(false),
                                child: const Text('いいえ、キャンセル'),
                              ),
                              FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),
                                onPressed: () => Navigator.of(context).pop(true),
                                child: const Text('はい、削除する'),
                              ),
                            ],
                          ),
                        );

                        if (confirm1 == true) {
                          if (!context.mounted) return;
                          final confirm2 = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('⚠️ アカウント削除の最終確認'),
                              content: const Text(
                                '本当に本当によろしいですか？削除されたデータとアカウントは二度と戻りません。',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(context).pop(false),
                                  child: const Text('キャンセル'),
                                ),
                                FilledButton(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: Colors.red,
                                  ),
                                  onPressed: () => Navigator.of(context).pop(true),
                                  child: const Text('本当に削除する'),
                                ),
                              ],
                            ),
                          );

                          if (confirm2 == true) {
                            if (!context.mounted) return;
                            // 本人確認のキャンセルや失敗をこのダイアログ上で伝えるため、
                            // 設定ダイアログは削除が成功してから閉じる
                            await _runAction('データとアカウントを削除中...', () async {
                              await appState.withdrawConsent();
                              await appState.logout();
                              if (context.mounted) {
                                Navigator.of(context).pop();
                              }
                            });
                          }
                        }
                      },
                      child: const Text(
                        '同意の撤回・アカウント削除',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (_isTransitioning)
          Positioned.fill(
            child: Container(
              color: context.pick(Colors.white.withAlpha(204), context.sc.surface.withAlpha(204)),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      _loadingText,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: context.pick(const Color(0xFF475569), context.sc.textMuted),
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
