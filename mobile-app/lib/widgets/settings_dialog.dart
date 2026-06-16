import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../state/syncscale_state.dart';
import 'formatters.dart';

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
          SnackBar(content: Text('エラーが発生しました: $e')),
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
        border: Border.all(color: const Color(0xFFE2E8F0)),
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
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '何分前に通知するか',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF475569),
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
                    // ヘッダー
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Text('⚙️', style: TextStyle(fontSize: 20)),
                            SizedBox(width: 8),
                            Text(
                              '設定',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
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
                    const Divider(height: 24, color: Color(0xFFE2E8F0)),

                    if (appState.currentUser != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
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
                                          color: const Color(0xFFF1F5F9),
                                          child: const Icon(Icons.person, size: 24, color: Colors.grey),
                                        );
                                      },
                                    )
                                  : Container(
                                      width: 48,
                                      height: 48,
                                      color: const Color(0xFFF1F5F9),
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
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF0F172A),
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    appState.currentUser!.email ?? 'メールアドレス未設定',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
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

                    // 締切前通知（ネイティブのみ。Web はローカル通知非対応のため非表示）
                    if (!kIsWeb) ...[
                      _buildNotificationSection(appState),
                      const SizedBox(height: 12),
                    ],

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
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
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
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
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
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 16),

                    // ログアウトボタン
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E293B), // slate-800
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

                    // 同意の撤回ボタン
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
                            title: const Text('⚠️ 同意撤回の確認'),
                            content: const Text(
                              '研究内容への同意を撤回し、本当にデータをすべて削除しますか？\n\n※この操作を実行すると、あなたのタスク、時間ログ、コンディションログ、利用状況ログが完全に削除され、復元することはできなくなります。',
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
                              title: const Text('⚠️ 同意撤回の最終確認'),
                              content: const Text(
                                '本当に本当によろしいですか？削除されたデータは二度と戻りません。',
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
                            Navigator.of(context).pop(); // 設定ダイアログを閉じる
                            await _runAction('同意を撤回し、データを削除中...', () async {
                              await appState.withdrawConsent();
                              await appState.logout();
                            });
                          }
                        }
                      },
                      child: const Text(
                        '研究同意の撤回',
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
              color: Colors.white.withAlpha(204),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      _loadingText,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF475569),
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
