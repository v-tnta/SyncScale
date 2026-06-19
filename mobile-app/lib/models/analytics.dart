import 'condition_log.dart';
import 'task.dart';
import 'time_log.dart';

// 分析ロジック（純粋関数）。
// 定義は Web 版（web/src/domain/analytics.js）と一致させること。

// ---- 着手リードタイム -------------------------------------------------------

class LeadTimeSummary {
  const LeadTimeSummary({required this.sizeLabel, required this.averageDays});

  final String sizeLabel;
  final double averageDays;
}

List<LeadTimeSummary> calculateLeadTimes(List<Task> tasks) {
  final summaries = <LeadTimeSummary>[];

  for (final size in ['S', 'M', 'L']) {
    final days =
        tasks
            .where((task) {
              return task.sizeLabel == size &&
                  task.deadline != null &&
                  task.startedAt != null;
            })
            .map((task) {
              // 締切から何日前に着手されたか (deadline - startedAt)
              final diff = task.deadline!.difference(task.startedAt!);
              return diff.inHours / 24.0;
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

// ---- 共通ヘルパー -----------------------------------------------------------

bool _isAnalyzable(Task task) => !task.isTutorialTask;

int _sumDurationSeconds(String taskId, List<TimeLog> timeLogs) {
  return timeLogs
      .where((log) => log.taskId == taskId)
      .fold<int>(0, (sum, log) => sum + log.durationSeconds);
}

// ---- 1. 見積もり精度：SML × 実働時間 ----------------------------------------

class EstimationSummary {
  const EstimationSummary({
    required this.sizeLabel,
    required this.count,
    required this.avgMinutes,
    required this.totalMinutes,
  });

  final String sizeLabel;
  final int count;
  final double avgMinutes;
  final double totalMinutes;
}

/// S/M/L ごとに、実際に費やした作業時間（timeLogs 合計）の平均を算出する。
List<EstimationSummary> calculateEstimationAccuracy(
  List<Task> tasks,
  List<TimeLog> timeLogs,
) {
  final summaries = <EstimationSummary>[];

  for (final size in ['S', 'M', 'L']) {
    final minutesList =
        tasks
            .where((task) => _isAnalyzable(task) && task.sizeLabel == size)
            .map((task) => _sumDurationSeconds(task.id, timeLogs) / 60.0)
            .where((minutes) => minutes > 0) // 実働ログがあるタスクのみ
            .toList();

    if (minutesList.isEmpty) {
      summaries.add(
        EstimationSummary(
          sizeLabel: size,
          count: 0,
          avgMinutes: 0,
          totalMinutes: 0,
        ),
      );
      continue;
    }

    final totalMinutes = minutesList.fold<double>(0, (s, m) => s + m);
    summaries.add(
      EstimationSummary(
        sizeLabel: size,
        count: minutesList.length,
        avgMinutes: totalMinutes / minutesList.length,
        totalMinutes: totalMinutes,
      ),
    );
  }

  return summaries;
}

/// S→M→L の平均作業時間が単調増加になっているか（見積もりの一貫性）を判定する。
bool isEstimationConsistent(List<EstimationSummary> accuracy) {
  final valid = accuracy.where((a) => a.count > 0).toList();
  for (var i = 1; i < valid.length; i++) {
    if (valid[i].avgMinutes < valid[i - 1].avgMinutes) return false;
  }
  return valid.length >= 2;
}

// ---- 2. 一夜漬け度 ----------------------------------------------------------

const int _crammingWindowHours = 24; // 締切この時間前以降を「一夜漬け」とみなす
const double _crammingThreshold = 0.5; // この比率以上で「一夜漬けタスク」と判定

class CrammingBySize {
  const CrammingBySize({
    required this.sizeLabel,
    required this.ratio,
    required this.count,
  });

  final String sizeLabel;
  final double? ratio;
  final int count;
}

class CrammingTask {
  const CrammingTask({
    required this.taskId,
    required this.title,
    required this.sizeLabel,
    required this.ratio,
  });

  final String taskId;
  final String title;
  final String? sizeLabel;
  final double ratio;
}

class CrammingScores {
  const CrammingScores({
    required this.overallRatio,
    required this.taskCount,
    required this.crammedTaskCount,
    required this.bySize,
    required this.topTasks,
  });

  final double? overallRatio;
  final int taskCount;
  final int crammedTaskCount;
  final List<CrammingBySize> bySize;
  final List<CrammingTask> topTasks;
}

/// タスクごとに、全作業時間のうち「締切24時間前以降（超過分含む）」に行った割合を算出する。
CrammingScores calculateCrammingScores(
  List<Task> tasks,
  List<TimeLog> timeLogs,
) {
  final perTask = <CrammingTask>[];

  for (final task in tasks) {
    if (!_isAnalyzable(task)) continue;
    final deadline = task.deadline;
    if (deadline == null) continue;

    final logs = timeLogs.where((log) => log.taskId == task.id).toList();
    final totalSec = logs.fold<int>(0, (sum, log) => sum + log.durationSeconds);
    if (totalSec <= 0) continue;

    final crammedThreshold = deadline.subtract(
      const Duration(hours: _crammingWindowHours),
    );
    final crammedSec = logs.fold<int>(0, (sum, log) {
      final start = log.startTime ?? log.endTime;
      if (start != null && !start.isBefore(crammedThreshold)) {
        return sum + log.durationSeconds;
      }
      return sum;
    });

    perTask.add(
      CrammingTask(
        taskId: task.id,
        title: task.title,
        sizeLabel: task.sizeLabel,
        ratio: crammedSec / totalSec,
      ),
    );
  }

  double? averageRatio(List<CrammingTask> list) {
    if (list.isEmpty) return null;
    return list.fold<double>(0, (s, x) => s + x.ratio) / list.length;
  }

  final bySize = ['S', 'M', 'L'].map((size) {
    final list = perTask.where((t) => t.sizeLabel == size).toList();
    return CrammingBySize(
      sizeLabel: size,
      ratio: averageRatio(list),
      count: list.length,
    );
  }).toList();

  final sorted = [...perTask]..sort((a, b) => b.ratio.compareTo(a.ratio));

  return CrammingScores(
    overallRatio: averageRatio(perTask),
    taskCount: perTask.length,
    crammedTaskCount:
        perTask.where((t) => t.ratio >= _crammingThreshold).length,
    bySize: bySize,
    topTasks: sorted.take(3).toList(),
  );
}

// ---- 3. 時間帯 × コンディション ---------------------------------------------

class TimeBand {
  const TimeBand({
    required this.key,
    required this.label,
    required this.range,
    required this.startHour,
    required this.endHour,
  });

  final String key;
  final String label;
  final String range;
  final int startHour;
  final int endHour;
}

const List<TimeBand> timeBands = [
  TimeBand(key: 'midnight', label: '深夜', range: '0-6時', startHour: 0, endHour: 6),
  TimeBand(key: 'morning', label: '午前', range: '6-12時', startHour: 6, endHour: 12),
  TimeBand(
    key: 'afternoon',
    label: '午後',
    range: '12-18時',
    startHour: 12,
    endHour: 18,
  ),
  TimeBand(key: 'night', label: '夜', range: '18-24時', startHour: 18, endHour: 24),
];

String _bandKeyOf(int hour) {
  for (final b in timeBands) {
    if (hour >= b.startHour && hour < b.endHour) return b.key;
  }
  return 'night';
}

class TimeBandCondition {
  TimeBandCondition({
    required this.key,
    required this.label,
    required this.range,
    this.good = 0,
    this.fair = 0,
    this.poor = 0,
    this.total = 0,
  });

  final String key;
  final String label;
  final String range;
  double good;
  double fair;
  double poor;
  double total;
}

/// 「どの時間帯に作業したタスクが、どんなコンディションで終わったか」を作業時間（分）で集計する。
List<TimeBandCondition> calculateConditionByTimeOfDay(
  List<Task> tasks,
  List<TimeLog> timeLogs,
  List<ConditionLog> conditionLogs,
) {
  final excludedTaskIds =
      tasks.where((t) => !_isAnalyzable(t)).map((t) => t.id).toSet();

  // taskId -> 最新のコンディション
  final conditionByTask = <String, ConditionLog>{};
  for (final log in conditionLogs) {
    final prev = conditionByTask[log.taskId];
    if (prev == null) {
      conditionByTask[log.taskId] = log;
    } else {
      final prevTime =
          prev.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final curTime = log.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      if (curTime.isAfter(prevTime)) {
        conditionByTask[log.taskId] = log;
      }
    }
  }

  final result = timeBands
      .map(
        (b) => TimeBandCondition(key: b.key, label: b.label, range: b.range),
      )
      .toList();
  final indexByKey = {
    for (var i = 0; i < result.length; i++) result[i].key: i,
  };

  for (final log in timeLogs) {
    if (excludedTaskIds.contains(log.taskId)) continue;
    final cond = conditionByTask[log.taskId];
    final start = log.startTime;
    if (cond == null || start == null) continue;

    final minutes = log.durationSeconds / 60.0;
    if (minutes <= 0) continue;

    final bucket = result[indexByKey[_bandKeyOf(start.hour)]!];
    if (cond.condition == 'good') {
      bucket.good += minutes;
    } else if (cond.condition == 'poor') {
      bucket.poor += minutes;
    } else {
      bucket.fair += minutes;
    }
    bucket.total += minutes;
  }

  return result;
}

// ---- 3'. よく作業する時間帯（コンディション比較なし） -----------------------

class TimeBandWork {
  TimeBandWork({
    required this.key,
    required this.label,
    required this.range,
    this.total = 0,
  });

  final String key;
  final String label;
  final String range;
  double total;
}

/// 「どの時間帯にどれくらい作業したか」を作業時間（分）で時間帯別に集計する。
/// コンディションとの比較を行わない、作業量だけのシンプルな集計。
List<TimeBandWork> calculateWorkTimeByTimeOfDay(
  List<Task> tasks,
  List<TimeLog> timeLogs,
) {
  final excludedTaskIds =
      tasks.where((t) => !_isAnalyzable(t)).map((t) => t.id).toSet();

  final result = timeBands
      .map((b) => TimeBandWork(key: b.key, label: b.label, range: b.range))
      .toList();
  final indexByKey = {
    for (var i = 0; i < result.length; i++) result[i].key: i,
  };

  for (final log in timeLogs) {
    if (excludedTaskIds.contains(log.taskId)) continue;
    final start = log.startTime;
    if (start == null) continue;
    final minutes = log.durationSeconds / 60.0;
    if (minutes <= 0) continue;
    result[indexByKey[_bandKeyOf(start.hour)]!].total += minutes;
  }

  return result;
}

// ---- 4. 放置タスク検出 ------------------------------------------------------

const int _stalledThresholdDays = 3; // 最終作業からこの日数以上で「放置」と判定

class StalledTask {
  const StalledTask({
    required this.taskId,
    required this.title,
    required this.sizeLabel,
    required this.lastActivityAt,
    required this.stalledDays,
    required this.isOverdue,
    required this.deadline,
  });

  final String taskId;
  final String title;
  final String? sizeLabel;
  final DateTime? lastActivityAt;
  final double stalledDays;
  final bool isOverdue;
  final DateTime? deadline;
}

/// 「とりかかり中（DOING）のまま一定日数作業していない」タスクを検出する。
List<StalledTask> detectStalledTasks(
  List<Task> tasks,
  List<TimeLog> timeLogs, {
  DateTime? now,
  int thresholdDays = _stalledThresholdDays,
}) {
  final current = now ?? DateTime.now();
  final stalled = <StalledTask>[];

  for (final task in tasks) {
    if (!_isAnalyzable(task)) continue;
    if (task.status != TaskStatus.doing) continue;

    // 最終作業日時を求める
    final logTimes =
        timeLogs
            .where((log) => log.taskId == task.id)
            .map((log) => log.endTime ?? log.startTime)
            .whereType<DateTime>()
            .toList();

    DateTime? lastActivityAt;
    if (logTimes.isNotEmpty) {
      lastActivityAt = logTimes.reduce((a, b) => a.isAfter(b) ? a : b);
    } else {
      lastActivityAt = task.startedAt ?? task.updatedAt;
    }
    if (lastActivityAt == null) continue;

    final stalledDays =
        current.difference(lastActivityAt).inHours / 24.0;
    if (stalledDays < thresholdDays) continue;

    final deadline = task.deadline;
    stalled.add(
      StalledTask(
        taskId: task.id,
        title: task.title,
        sizeLabel: task.sizeLabel,
        lastActivityAt: lastActivityAt,
        stalledDays: stalledDays,
        deadline: deadline,
        isOverdue: deadline != null && current.isAfter(deadline),
      ),
    );
  }

  stalled.sort((a, b) => b.stalledDays.compareTo(a.stalledDays));
  return stalled;
}
