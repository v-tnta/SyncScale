import 'package:flutter/material.dart';

import '../models/task.dart';
import '../state/syncscale_state.dart';
import 'formatters.dart';

Future<void> showTaskFormSheet(BuildContext context, {Task? task}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
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
  late final TextEditingController _estimateController;
  late DateTime _deadline;
  String? _sizeLabel;

  bool get _isEditing => widget.task != null;

  @override
  void initState() {
    super.initState();
    final task = widget.task;
    _titleController = TextEditingController(text: task?.title ?? '');
    _estimateController = TextEditingController(
      text:
          task == null || task.estimatedMinutes == 0
              ? ''
              : task.estimatedMinutes.toString(),
    );
    _deadline = task?.deadline ?? DateTime.now().add(const Duration(days: 7));
    _sizeLabel = task?.sizeLabel;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _estimateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _isEditing ? 'タスクを編集' : 'タスクを追加',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'タスク名',
              border: OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _estimateController,
            decoration: const InputDecoration(
              labelText: '見積時間（分）',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickDeadline,
            icon: const Icon(Icons.event),
            label: Text('締切: ${formatDateTime(_deadline)}'),
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
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
            onPressed: _save,
            icon: Icon(_isEditing ? Icons.save : Icons.add),
            label: Text(_isEditing ? '保存' : '追加'),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDeadline() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _deadline,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (date == null || !mounted) {
      return;
    }

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_deadline),
    );
    if (time == null) {
      return;
    }

    setState(() {
      _deadline = DateTime(
        date.year,
        date.month,
        date.day,
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
    final estimatedMinutes = int.tryParse(_estimateController.text.trim()) ?? 0;

    try {
      if (_isEditing) {
        await appState.updateTask(widget.task!.id, {
          'title': title,
          'estimatedMinutes': estimatedMinutes,
          'deadline': _deadline,
          'sizeLabel': _sizeLabel,
          'isNew': false,
        });
      } else {
        await appState.addTask(
          Task(
            id: '',
            title: title,
            status: TaskStatus.todo,
            estimatedMinutes: estimatedMinutes,
            deadline: _deadline,
            isVisible: true,
            sizeLabel: _sizeLabel,
            isNew: false,
            source: 'manual',
          ),
        );
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
