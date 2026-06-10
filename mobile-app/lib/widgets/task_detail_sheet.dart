import 'package:flutter/material.dart';

import '../models/condition_log.dart';
import '../models/task.dart';
import '../models/time_log.dart';
import '../state/syncscale_state.dart';
import 'condition_dialog.dart';
import 'formatters.dart';
import 'manual_log_dialog.dart';
import 'task_form_sheet.dart';
import 'timer_panel.dart';

Future<void> showTaskDetailSheet(BuildContext context, Task task) {
  final appState = SyncScaleScope.of(context);

  appState.logActivity('task_detail_view', {'taskId': task.id});

  // 完了したタスクの詳細を開いた時に Step 16 から Step 17 へ進める
  if (appState.tutorialStep == 16 && task.isCompleted && task.isTutorialTask) {
    appState.setTutorialStep(17);
  }

  final isTutorialDetail = appState.isTutorialActive &&
      task.isTutorialTask &&
      appState.tutorialStep != null &&
      ((appState.tutorialStep! >= 6 && appState.tutorialStep! <= 14) ||
          appState.tutorialStep! == 17 ||
          appState.tutorialStep! == 16);

  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    enableDrag: !isTutorialDetail, // チュートリアル中（Step 18以外）はドラッグ不可にする
    isDismissible: !isTutorialDetail,
    showDragHandle: true,
    builder: (context) => TaskDetailSheet(taskId: task.id),
  ).then((_) {
    if (appState.tutorialStep == 18 && task.isTutorialTask) {
      appState.setTutorialStep(19);
    }
  });
}

class TaskDetailSheet extends StatefulWidget {
  const TaskDetailSheet({super.key, required this.taskId});

  final String taskId;

  @override
  State<TaskDetailSheet> createState() => _TaskDetailSheetState();
}

class _TaskDetailSheetState extends State<TaskDetailSheet> {
  int? _lastScrolledStep;
  late final ScrollController _localController;

  @override
  void initState() {
    super.initState();
    _localController = ScrollController();
  }

  @override
  void dispose() {
    _localController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final task = appState.tasks.where((task) => task.id == widget.taskId).firstOrNull;
    if (task == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Text('タスクが見つかりませんでした。'),
      );
    }

    // --- チュートリアルのステップ遷移判定 ---
    if (appState.tutorialStep == 6 && task.isTutorialTask) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        appState.setTutorialStep(7);
      });
    }

    // ハイライト要素への自動スクロール（ステップ変更時の最初の一回のみ実行）
    if (appState.isTutorialActive && task.isTutorialTask) {
      final currentStep = appState.tutorialStep;
      if (currentStep != null && currentStep != _lastScrolledStep) {
        _lastScrolledStep = currentStep;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final targetKey = appState.tutorialKeys[currentStep];
          if (targetKey != null && targetKey.currentContext != null) {
            Scrollable.ensureVisible(
              targetKey.currentContext!,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              alignment: 0.5,
            );
          }
        });
      }
    }
    // -------------------------------------

    final logs = appState.logsForTask(task.id);
    final isTutorialDetail = appState.isTutorialActive &&
        task.isTutorialTask &&
        appState.tutorialStep != null &&
        ((appState.tutorialStep! >= 6 && appState.tutorialStep! <= 14) ||
            appState.tutorialStep! == 17 ||
            appState.tutorialStep! == 16);

    return PopScope(
      canPop: !isTutorialDetail,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
      },
      child: SafeArea(
        child: DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.9,
          maxChildSize: isTutorialDetail ? 0.9 : 0.96,
          minChildSize: isTutorialDetail ? 0.9 : 0.55,
          builder: (context, controller) {
            return ListView(
              key: (appState.isTutorialActive &&
                      task.isTutorialTask &&
                      (appState.tutorialStep == 7 || appState.tutorialStep == 17))
                  ? appState.tutorialKeys[appState.tutorialStep]
                  : null,
              controller: isTutorialDetail ? _localController : controller,
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        task.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ),
                    if (task.isCompleted)
                      AbsorbPointer(
                        absorbing: appState.isTutorialActive && task.isTutorialTask,
                        child: IconButton(
                          tooltip: '未提出に戻す',
                          onPressed: () => _revertToIncomplete(context, task),
                          icon: const Icon(Icons.undo, color: Colors.orange),
                        ),
                      ),
                    AbsorbPointer(
                      absorbing: appState.isTutorialActive && task.isTutorialTask,
                      child: IconButton(
                        key: (appState.isTutorialActive && task.isTutorialTask)
                            ? appState.tutorialKeys[9]
                            : null,
                        tooltip: '完全削除',
                        onPressed: () => _physicalDelete(context, task),
                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                      ),
                    ),
                    AbsorbPointer(
                      absorbing: appState.isTutorialActive && task.isTutorialTask,
                      child: IconButton(
                        key: (appState.isTutorialActive && task.isTutorialTask)
                            ? appState.tutorialKeys[8]
                            : null,
                        tooltip: '編集',
                        onPressed: () => showTaskFormSheet(context, task: task),
                        icon: const Icon(Icons.edit_outlined),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Chip(label: Text(task.status.label)),
                    Chip(label: Text('締切 ${formatDateTime(task.deadline)}')),
                  ],
                ),
                const SizedBox(height: 16),
                // 完了タスクの場合のみ、コンディションを課題名や締め切りの下に表示
                if (task.isCompleted) ...[
                  _ConditionPanel(
                    taskId: task.id,
                  ),
                  const SizedBox(height: 12),
                ],
                _StatusAndSize(task: task),
                const SizedBox(height: 16),
                if (!task.isCompleted)
                  AbsorbPointer(
                    absorbing: appState.isTutorialActive && task.isTutorialTask,
                    child: TimerPanel(
                      key: (appState.isTutorialActive && task.isTutorialTask)
                          ? appState.tutorialKeys[10]
                          : null,
                      task: task,
                    ),
                  ),
                if (!task.isCompleted) const SizedBox(height: 12),
                AbsorbPointer(
                  absorbing: appState.isTutorialActive && task.isTutorialTask && appState.tutorialStep != 11,
                  child: OutlinedButton.icon(
                    key: (appState.isTutorialActive && task.isTutorialTask)
                        ? appState.tutorialKeys[11]
                        : null,
                    onPressed: () {
                      if (appState.tutorialStep == 11 && task.isTutorialTask) {
                        appState.setTutorialStep(12);
                      }
                      showManualLogDialog(context, task);
                    },
                    icon: const Icon(Icons.add_alarm_outlined),
                    label: const Text('作業ログを手入力'),
                  ),
                ),
                const SizedBox(height: 16),
                if (!task.isCompleted) ...[
                  AbsorbPointer(
                    absorbing: appState.isTutorialActive && task.isTutorialTask && appState.tutorialStep != 14,
                    child: FilledButton.icon(
                      key: (appState.isTutorialActive && task.isTutorialTask)
                          ? appState.tutorialKeys[14]
                          : null,
                      onPressed: () => _complete(context, task),
                      icon: const Icon(Icons.check),
                      label: const Text('提出完了にする'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                // 実績ガントの代わりに作業実績を表示
                _Panel(
                  key: (appState.isTutorialActive && task.isTutorialTask && appState.tutorialStep == 13)
                      ? appState.tutorialKeys[13]
                      : null,
                  title: '作業実績',
                  icon: Icons.history_toggle_off_outlined,
                  child: logs.isEmpty
                      ? const Text('作業実績はまだありません。')
                      : Column(
                          children: logs.map((log) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              elevation: 0,
                              color: Colors.grey.shade50,
                              shape: RoundedRectangleBorder(
                                side: BorderSide(color: Colors.grey.shade200),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            log.subTaskName.isEmpty
                                                ? '作業名未入力'
                                                : log.subTaskName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            formatDateTime(log.startTime),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      formatDurationSeconds(log.durationSeconds),
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blueAccent,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _complete(BuildContext context, Task task) async {
    final appState = SyncScaleScope.of(context);
    
    final isStep14 = appState.tutorialStep == 14 && task.isTutorialTask;
    if (isStep14) {
      appState.setTutorialStep(15);
    }

    final result = await showConditionDialog(context);
    if (result == null) {
      if (isStep14) {
        appState.setTutorialStep(14);
      }
      return;
    }

    final isStep15 = appState.tutorialStep == 15 && task.isTutorialTask;
    await appState.completeTask(
      task: task,
      condition: result.condition,
      memo: result.memo,
    );
    if (isStep15) {
      appState.setTutorialStep(16);
    }
    if (!context.mounted) return;
    Navigator.of(context).pop();
  }

  Future<void> _revertToIncomplete(BuildContext context, Task task) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('未提出に戻しますか？'),
            content: Text('タスク「${task.title}」を未提出（これからやる）に戻しますか？'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('キャンセル'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('戻す'),
              ),
            ],
          ),
    );
    if (confirmed != true || !context.mounted) {
      return;
    }

    final appState = SyncScaleScope.of(context);
    try {
      await appState.updateTask(task.id, {
        'status': TaskStatus.todo.value,
        'completedAt': null,
      });
      if (!context.mounted) return;
      Navigator.of(context).pop();
    } catch (err) {
      debugPrint("Failed to revert task: $err");
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('未提出に戻す処理に失敗しました。')),
      );
    }
  }

  Future<void> _physicalDelete(BuildContext context, Task task) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('完全削除しますか？'),
            content: const Text('タスクと関連する作業ログ・コンディションログを削除します。'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('キャンセル'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('削除'),
              ),
            ],
          ),
    );
    if (confirmed != true || !context.mounted) {
      return;
    }

    final appState = SyncScaleScope.of(context);
    await appState.deleteTaskCompletely(task.id);
    if (!context.mounted) return;
    Navigator.of(context).pop();
  }
}

class _StatusAndSize extends StatelessWidget {
  const _StatusAndSize({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '課題の規模感',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            _SizeSelector(
              selectedSize: task.sizeLabel,
              onSelect: (size) {
                appState.updateTask(task.id, {
                  'sizeLabel': size,
                  'isNew': false,
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SizeSelector extends StatelessWidget {
  const _SizeSelector({required this.selectedSize, required this.onSelect});
  final String? selectedSize;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    final options = [
      {'value': 'S', 'label': 'S (すぐ)', 'color': const Color(0xFF06B6D4)},
      {
        'value': 'M',
        'label': 'M (半日〜1日)',
        'color': const Color(0xFFF97316),
      },
      {'value': 'L', 'label': 'L (数日)', 'color': const Color(0xFFEF4444)},
    ];

    return Row(
      children:
          options.map((opt) {
            final val = opt['value'] as String;
            final label = opt['label'] as String;
            final color = opt['color'] as Color;
            final isSelected = selectedSize == val;

            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: InkWell(
                  onTap: () => onSelect(isSelected ? null : val),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 4,
                    ),
                    decoration: BoxDecoration(
                      color:
                          isSelected ? color.withAlpha(31) : Colors.white,
                      border: Border.all(
                        color: isSelected ? color : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        label,
                        style: TextStyle(
                          color: isSelected ? color : Colors.grey.shade600,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
    );
  }
}

class _ConditionPanel extends StatelessWidget {
  const _ConditionPanel({required this.taskId});

  final String taskId;

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return FutureBuilder<List<ConditionLog>>(
      future: appState.getConditionLogs(taskId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }
        final logs = snapshot.data ?? const <ConditionLog>[];
        if (logs.isEmpty) {
          return const SizedBox.shrink();
        }

        final log = logs.first;
        final emoji = _conditionEmoji(log.condition);

        return Card(
          color: const Color(0xFFFDF8E2),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(emoji, style: const TextStyle(fontSize: 40)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '提出時のコンディション',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'メモ：${log.memo.isEmpty ? 'なし' : log.memo}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _conditionEmoji(String value) {
    switch (value) {
      case 'good':
        return '😊';
      case 'poor':
        return '😥';
      default:
        return '🙂';
    }
  }
}

class _Panel extends StatelessWidget {
  const _Panel({super.key, required this.title, required this.icon, required this.child});

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}
