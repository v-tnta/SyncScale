import 'package:flutter/material.dart';

import '../models/task.dart';
import '../state/syncscale_state.dart';
import 'formatters.dart';

Future<void> showTaskFormSheet(BuildContext context, {Task? task}) {
  final appState = SyncScaleScope.of(context);
  final isTutorialForm = appState.isTutorialActive &&
      appState.tutorialStep != null &&
      appState.tutorialStep! >= 1 &&
      appState.tutorialStep! <= 5;

  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    enableDrag: !isTutorialForm,
    isDismissible: !isTutorialForm,
    showDragHandle: true,
    builder: (context) => TaskFormSheet(task: task),
  );
}

class TaskFormSheet extends StatefulWidget {
  const TaskFormSheet({super.key, this.task});

  final Task? task;

  @override
  State<TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<TaskFormSheet> {
  late final TextEditingController _titleController;
  late DateTime _deadline;
  String? _sizeLabel;

  bool get _isEditing => widget.task != null;

  @override
  void initState() {
    super.initState();
    final task = widget.task;
    _titleController = TextEditingController(text: task?.title ?? '');
    _titleController.addListener(_onTitleChanged);
    if (task != null) {
      _deadline = task.deadline ?? DateTime.now();
    } else {
      final now = DateTime.now();
      _deadline = DateTime(now.year, now.month, now.day, 23, 59);
    }
    _sizeLabel = task?.sizeLabel;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        final appState = SyncScaleScope.of(context);
        if (appState.tutorialStep == 1) {
          appState.setTutorialStep(2);
        }
      } catch (_) {}
    });
  }

  void _onTitleChanged() {
    if (!mounted) return;
    try {
      final appState = SyncScaleScope.of(context);
      appState.currentFormTitle = _titleController.text;
    } catch (_) {}
  }

  @override
  void dispose() {
    _titleController.removeListener(_onTitleChanged);
    _titleController.dispose();
    try {
      final appState = SyncScaleScope.of(context);
      appState.currentFormTitle = '';
    } catch (_) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    final isTutorialForm = appState.isTutorialActive &&
        appState.tutorialStep != null &&
        appState.tutorialStep! >= 2 &&
        appState.tutorialStep! <= 5;

    return PopScope(
      canPop: !isTutorialForm,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
      },
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 8, 20, bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isEditing ? 'タスクを編集' : 'タスクを登録',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            TextField(
              key: appState.isTutorialActive ? appState.tutorialKeys[2] : null,
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'タスク名',
                border: OutlineInputBorder(),
              ),
              textInputAction: TextInputAction.next,
              onSubmitted: (_) => _onTitleChanged(),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              key: appState.isTutorialActive ? appState.tutorialKeys[3] : null,
              onPressed: appState.isTutorialActive ? () {} : _pickDeadline,
              icon: const Icon(Icons.event),
              label: Text('締切: ${formatDateTime(_deadline)}'),
            ),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              key: appState.isTutorialActive ? appState.tutorialKeys[4] : null,
              emptySelectionAllowed: true,
              selected: _sizeLabel == null ? <String>{} : {_sizeLabel!},
              onSelectionChanged: (selection) {
                setState(
                  () => _sizeLabel = selection.isEmpty ? null : selection.first,
                );
              },
              segments: const [
                ButtonSegment(value: 'S', label: Text('S')),
                ButtonSegment(value: 'M', label: Text('M')),
                ButtonSegment(value: 'L', label: Text('L')),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              key: appState.isTutorialActive ? appState.tutorialKeys[5] : null,
              onPressed: (appState.isTutorialActive &&
                      appState.tutorialStep != null &&
                      appState.tutorialStep! >= 2 &&
                      appState.tutorialStep! <= 4)
                  ? () {} // 無効化 (色はそのままでタップは無反応)
                  : _save,
              icon: Icon(_isEditing ? Icons.save : Icons.add),
              label: Text(_isEditing ? '保存' : 'タスクを登録'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDeadline() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_deadline),
    );
    if (time == null) {
      return;
    }

    setState(() {
      _deadline = DateTime(
        _deadline.year,
        _deadline.month,
        _deadline.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _save() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('タスク名を入力してください。')));
      return;
    }

    final appState = SyncScaleScope.of(context);

    try {
      if (_isEditing) {
        await appState.updateTask(widget.task!.id, {
          'title': title,
          'estimatedMinutes': 0,
          'deadline': _deadline,
          'sizeLabel': _sizeLabel,
          'isNew': false,
        });
      } else {
        final isTutorial = appState.isTutorialActive;
        await appState.addTask(
          Task(
            id: '',
            title: title,
            status: TaskStatus.todo,
            estimatedMinutes: 0,
            deadline: _deadline,
            isVisible: true,
            sizeLabel: _sizeLabel,
            isNew: false,
            source: 'manual',
            isTutorialTask: isTutorial,
          ),
        );
        if (appState.tutorialStep == 5) {
          appState.setTutorialStep(6);
        }
      }

      if (!mounted) {
        return;
      }
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('保存に失敗しました: $error')));
    }
  }
}
