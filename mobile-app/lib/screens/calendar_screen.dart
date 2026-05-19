import 'package:flutter/material.dart';

import '../models/task.dart';
import '../state/syncscale_state.dart';
import '../widgets/formatters.dart';
import '../widgets/task_detail_sheet.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final groups = <DateTime, List<Task>>{};

    for (final task in appState.tasks.where((task) => task.deadline != null)) {
      final date = DateUtils.dateOnly(task.deadline!);
      groups.putIfAbsent(date, () => []).add(task);
    }

    final dates = groups.keys.toList()..sort();

    if (dates.isEmpty) {
      return const Center(child: Text('締切が設定されたタスクはありません。'));
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        for (final date in dates)
          Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatDate(date),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final task in groups[date]!)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(task.title),
                      subtitle: Text(
                        '${formatDateTime(task.deadline)} / ${task.status.label}',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => showTaskDetailSheet(context, task),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
