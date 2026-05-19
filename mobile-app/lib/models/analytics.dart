import 'task.dart';
import 'time_log.dart';

class TimeDebtSummary {
  const TimeDebtSummary({
    required this.estimatedSeconds,
    required this.actualSeconds,
  });

  final int estimatedSeconds;
  final int actualSeconds;

  int get debtSeconds => actualSeconds - estimatedSeconds;
}

class LeadTimeSummary {
  const LeadTimeSummary({required this.sizeLabel, required this.averageDays});

  final String sizeLabel;
  final double averageDays;
}

TimeDebtSummary calculateTimeDebt(List<Task> tasks, List<TimeLog> logs) {
  final taskIdsWithLogs = logs.map((log) => log.taskId).toSet();
  final measuredTasks = tasks.where(
    (task) => taskIdsWithLogs.contains(task.id),
  );
  final estimatedSeconds = measuredTasks.fold<int>(
    0,
    (sum, task) => sum + task.estimatedMinutes * 60,
  );
  final actualSeconds = logs.fold<int>(
    0,
    (sum, log) => sum + log.durationSeconds,
  );

  return TimeDebtSummary(
    estimatedSeconds: estimatedSeconds,
    actualSeconds: actualSeconds,
  );
}

List<LeadTimeSummary> calculateLeadTimes(List<Task> tasks) {
  final summaries = <LeadTimeSummary>[];

  for (final size in ['S', 'M', 'L']) {
    final days =
        tasks
            .where((task) {
              return task.sizeLabel == size &&
                  task.createdAt != null &&
                  task.startedAt != null;
            })
            .map((task) {
              final diff = task.startedAt!.difference(task.createdAt!);
              return diff.inHours / 24;
            })
            .toList();

    if (days.isEmpty) {
      summaries.add(LeadTimeSummary(sizeLabel: size, averageDays: 0));
      continue;
    }

    final total = days.fold<double>(0, (sum, value) => sum + value);
    summaries.add(
      LeadTimeSummary(sizeLabel: size, averageDays: total / days.length),
    );
  }

  return summaries;
}
