import 'package:flutter/material.dart';

import '../models/condition_log.dart';
import '../models/task.dart';
import '../state/syncscale_state.dart';
import 'condition_dialog.dart';
import 'formatters.dart';
import 'gantt_chart.dart';
import 'manual_log_dialog.dart';
import 'task_form_sheet.dart';
import 'timer_panel.dart';

Future<void> showTaskDetailSheet(BuildContext context, Task task) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) => TaskDetailSheet(taskId: task.id),
  );
}

class TaskDetailSheet extends StatelessWidget {
  const TaskDetailSheet({super.key, required this.taskId});

  final String taskId;

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final task = appState.tasks.where((task) => task.id == taskId).firstOrNull;
    if (task == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Text('タスクが見つかりませんでした。'),
      );
    }

    final logs = appState.logsForTask(task.id);
    final totalSeconds = logs.fold<int>(
      0,
      (sum, log) => sum + log.durationSeconds,
    );

    return SafeArea(
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.9,
        maxChildSize: 0.96,
        minChildSize: 0.55,
        builder: (context, controller) {
          return ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
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
                  IconButton(
                    tooltip: '編集',
                    onPressed: () => showTaskFormSheet(context, task: task),
                    icon: const Icon(Icons.edit_outlined),
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
                  Chip(label: Text('見積 ${task.estimatedMinutes}分')),
                  Chip(
                    label: Text('実績 ${formatDurationSeconds(totalSeconds)}'),
                  ),
                  if (task.sizeLabel != null && task.sizeLabel!.isNotEmpty)
                    Chip(label: Text('Size ${task.sizeLabel}')),
                ],
              ),
              const SizedBox(height: 16),
              _StatusAndSize(task: task),
              const SizedBox(height: 16),
              if (!task.isCompleted) TimerPanel(task: task),
              if (!task.isCompleted) const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => showManualLogDialog(context, task),
                icon: const Icon(Icons.add_alarm_outlined),
                label: const Text('作業ログを手入力'),
              ),
              const SizedBox(height: 16),
              if (!task.isCompleted)
                FilledButton.icon(
                  onPressed: () => _complete(context, task),
                  icon: const Icon(Icons.check),
                  label: const Text('提出完了にする'),
                ),
              const SizedBox(height: 16),
              _Panel(
                title: '実績ガントチャート',
                icon: Icons.view_timeline_outlined,
                child: GanttChart(logs: logs),
              ),
              const SizedBox(height: 12),
              if (task.isCompleted) _ConditionPanel(taskId: task.id),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _softDelete(context, task),
                      icon: const Icon(Icons.visibility_off_outlined),
                      label: const Text('目録から外す'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _physicalDelete(context, task),
                      icon: const Icon(Icons.delete_outline),
                      label: const Text('完全削除'),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _complete(BuildContext context, Task task) async {
    final appState = SyncScaleScope.of(context);
    final result = await showConditionDialog(context);
    if (result == null) {
      return;
    }

    await appState.completeTask(
      task: task,
      condition: result.condition,
      memo: result.memo,
    );
    if (!context.mounted) return;
    Navigator.of(context).pop();
  }

  Future<void> _softDelete(BuildContext context, Task task) async {
    final appState = SyncScaleScope.of(context);
    await appState.softDeleteTask(task.id);
    if (!context.mounted) return;
    Navigator.of(context).pop();
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
              '状態とS/M/L',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<TaskStatus>(
              value: task.status,
              decoration: const InputDecoration(
                labelText: 'ステータス',
                border: OutlineInputBorder(),
              ),
              items: [
                for (final status in TaskStatus.values)
                  DropdownMenuItem(value: status, child: Text(status.label)),
              ],
              onChanged: (status) {
                if (status == null) return;
                appState.updateTask(task.id, {'status': status.value});
              },
            ),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              emptySelectionAllowed: true,
              selected:
                  task.sizeLabel == null || task.sizeLabel!.isEmpty
                      ? <String>{}
                      : {task.sizeLabel!},
              onSelectionChanged: (selection) {
                appState.updateTask(task.id, {
                  'sizeLabel': selection.isEmpty ? null : selection.first,
                  'isNew': false,
                });
              },
              segments: const [
                ButtonSegment(value: 'S', label: Text('S')),
                ButtonSegment(value: 'M', label: Text('M')),
                ButtonSegment(value: 'L', label: Text('L')),
              ],
            ),
          ],
        ),
      ),
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
        final logs = snapshot.data ?? const <ConditionLog>[];
        return _Panel(
          title: '提出時のコンディション',
          icon: Icons.favorite_border,
          child:
              snapshot.connectionState == ConnectionState.waiting
                  ? const LinearProgressIndicator()
                  : logs.isEmpty
                  ? const Text('コンディション記録はありません。')
                  : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final log in logs)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            '${_conditionLabel(log.condition)}: ${log.memo.isEmpty ? 'メモなし' : log.memo}',
                          ),
                        ),
                    ],
                  ),
        );
      },
    );
  }

  String _conditionLabel(String value) {
    switch (value) {
      case 'good':
        return 'よい';
      case 'poor':
        return '悪い';
      default:
        return '普通';
    }
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.title, required this.icon, required this.child});

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
