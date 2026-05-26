import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';
import '../widgets/task_card.dart';
import '../widgets/task_detail_sheet.dart';

class TasksScreen extends StatelessWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    if (appState.dataLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (appState.errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            appState.errorMessage!,
            textAlign: TextAlign.center,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ),
      );
    }

    final todo = appState.incompleteTasks;
    final completed = appState.completedTasks;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        _SectionHeader(
          title: '未完了タスク',
          count: todo.length,
          icon: Icons.assignment_outlined,
        ),
        if (todo.isEmpty)
          const _EmptyMessage(text: 'タスクはまだありません。右下から追加できます。')
        else
          for (final task in todo)
            TaskCard(
              key: (appState.isTutorialActive && task.isTutorialTask)
                  ? appState.tutorialKeys[6]
                  : null,
              task: task,
              onTap: () => showTaskDetailSheet(context, task),
            ),
        const SizedBox(height: 20),
        _SectionHeader(
          title: '完了したタスク',
          count: completed.length,
          icon: Icons.verified_outlined,
        ),
        if (completed.isEmpty)
          const _EmptyMessage(text: '完了したタスクはまだありません。')
        else
          for (final task in completed)
            TaskCard(
              key: (appState.isTutorialActive && task.isTutorialTask)
                  ? appState.tutorialKeys[14]
                  : null,
              task: task,
              onTap: () => showTaskDetailSheet(context, task),
            ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.count,
    required this.icon,
  });

  final String title;
  final int count;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(width: 8),
          Text(
            '$countつ',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _EmptyMessage extends StatelessWidget {
  const _EmptyMessage({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Text(text, style: const TextStyle(color: Colors.black54)),
        ),
      ),
    );
  }
}
