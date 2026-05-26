import 'package:flutter/material.dart';

import '../models/task.dart';
import '../models/time_log.dart';
import '../state/syncscale_state.dart';

Future<void> showManualLogDialog(BuildContext context, Task task) {
  return showDialog<void>(
    context: context,
    builder: (context) => ManualLogDialog(task: task),
  );
}

class ManualLogDialog extends StatefulWidget {
  const ManualLogDialog({super.key, required this.task});

  final Task task;

  @override
  State<ManualLogDialog> createState() => _ManualLogDialogState();
}

class _ManualLogDialogState extends State<ManualLogDialog> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _minutesController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _minutesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return AlertDialog(
      key: appState.isTutorialActive ? appState.tutorialKeys[11] : null,
      title: const Text('作業ログを手入力'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: '作業名'),
          ),
          TextField(
            controller: _minutesController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: '作業時間（分）'),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('キャンセル'),
        ),
        FilledButton(onPressed: _save, child: const Text('保存')),
      ],
    );
  }

  Future<void> _save() async {
    final minutes = int.tryParse(_minutesController.text.trim()) ?? 0;
    if (minutes <= 0) {
      return;
    }

    final appState = SyncScaleScope.of(context);
    final end = DateTime.now();
    final start = end.subtract(Duration(minutes: minutes));

    final isTutorial = appState.tutorialStep == 11 && widget.task.isTutorialTask;

    await appState.addTimeLog(
      TimeLog(
        id: '',
        taskId: widget.task.id,
        subTaskName: _nameController.text.trim(),
        startTime: start,
        endTime: end,
        durationSeconds: minutes * 60,
      ),
    );

    if (isTutorial) {
      appState.setTutorialStep(12);
    }

    if (!mounted) {
      return;
    }
    Navigator.of(context).pop();
  }
}
