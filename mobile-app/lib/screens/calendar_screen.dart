import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/task.dart';
import '../models/time_log.dart';
import '../state/syncscale_state.dart';
import '../widgets/task_detail_sheet.dart';
import '../theme/sc_colors.dart';

// カレンダー日基準で days 日後の日付を返す。DateTime.add(Duration(days:...)) は
// 絶対時間の加算のため夏時間の切り替え日をまたぐとズレる（23時間/25時間になる）が、
// こちらは年月日の構成要素から作り直すため影響を受けない。
DateTime _addCalendarDays(DateTime date, int days) {
  return DateTime(date.year, date.month, date.day + days);
}

// 2つの日付（日付部分のみ）の間の日数を、夏時間の影響を受けずに計算する。
// difference().inDays は絶対時間の差から求めるため、夏時間切り替えをまたぐと
// 実際の暦日数より1日ズレることがある。UTCとして構成し直すことでズレを避ける。
int _calendarDaysBetween(DateTime from, DateTime to) {
  final a = DateTime.utc(from.year, from.month, from.day);
  final b = DateTime.utc(to.year, to.month, to.day);
  return b.difference(a).inDays;
}

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  // 表示モード: 'month'（月表示）/ 'week'（週表示）
  String _viewMode = 'month';

  DateTime _focusedMonth = DateTime.now();
  // 週表示でいま表示している週（その週内の任意の日付）
  DateTime _weekAnchor = DateTime.now();

  // 週表示の時間グリッド: 1時間あたりの高さ（px）
  static const double _hourHeight = 40.0;

  Color _taskSizeColor(String? sizeLabel) {
    switch (sizeLabel) {
      case 'S':
        return const Color(0xFF06B6D4); // Cyan
      case 'M':
        return const Color(0xFFF97316); // Orange
      case 'L':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF3174AD); // Default Blue (Web版準拠)
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    return ListView(
      key: (appState.isTutorialActive && appState.tutorialStep == 20)
          ? appState.tutorialKeys[20]
          : null,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        // 月／週の切り替えトグル
        _viewToggle(),
        const SizedBox(height: 12),
        if (_viewMode == 'month')
          ..._buildMonthView(context, appState)
        else
          ..._buildWeekView(context, appState),
      ],
    );
  }

  // ── 月／週の切り替えトグル（分析タブと同じスタイル） ──────────
  Widget _viewToggle() {
    return Align(
      alignment: Alignment.center,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: context.sc.surfaceAlt,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _toggleButton('month', '月'),
            _toggleButton('week', '週'),
          ],
        ),
      ),
    );
  }

  Widget _toggleButton(String key, String label) {
    final selected = _viewMode == key;
    return GestureDetector(
      onTap: () => setState(() => _viewMode = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        decoration: BoxDecoration(
          color: selected
              ? context.pick(Colors.white, context.sc.borderStrong)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? context.sc.ink87 : context.sc.ink45,
          ),
        ),
      ),
    );
  }

  // ════════════════════════════════════════════════════════════
  //  月表示
  // ════════════════════════════════════════════════════════════
  List<Widget> _buildMonthView(BuildContext context, dynamic appState) {
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;

    // その月の最初の日と最後の日
    final firstDay = DateTime(year, month, 1);
    final lastDay = DateTime(year, month + 1, 0);

    final daysInMonth = lastDay.day;
    // 日曜日が週の最初 (firstDay.weekday % 7: 日曜は7%7=0, 月曜は1%7=1, ..., 土曜は6%7=6)
    final offset = firstDay.weekday % 7;
    final totalCells = daysInMonth + offset;

    return [
      // 月切り替えヘッダー
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () {
              setState(() {
                _focusedMonth = DateTime(year, month - 1);
              });
            },
          ),
          Text(
            '$year年$month月',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () {
              setState(() {
                _focusedMonth = DateTime(year, month + 1);
              });
            },
          ),
        ],
      ),
      const SizedBox(height: 12),
      // 曜日ヘッダー
      const Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Expanded(
            child: Center(
              child: Text(
                '日',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Text('月', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Center(
              child: Text('火', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Center(
              child: Text('水', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Center(
              child: Text('木', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Center(
              child: Text('金', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          Expanded(
            child: Center(
              child: Text(
                '土',
                style: TextStyle(
                  color: Colors.blue,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      const SizedBox(height: 8),
      // 日付グリッド
      GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        shrinkWrap: true,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 7,
          childAspectRatio: 0.65, // 縦幅を広めにしてタスクが複数並べるようにする
          crossAxisSpacing: 4,
          mainAxisSpacing: 4,
        ),
        itemCount: totalCells,
        itemBuilder: (context, index) {
          if (index < offset) {
            // 前月の余りセル
            return Container(
              decoration: BoxDecoration(
                color: context.pick(Colors.grey.shade50, context.sc.surfaceSubtle),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }

          final day = index - offset + 1;
          final cellDate = DateTime(year, month, day);

          // 未完了かつ締め切りがこの日付のタスク
          final cellTasks = appState.tasks.where((task) {
            if (task.status == TaskStatus.done || task.deadline == null) {
              return false;
            }
            final tDate = DateUtils.dateOnly(task.deadline!);
            return DateUtils.isSameDay(tDate, cellDate);
          }).toList();

          final isToday = DateUtils.isSameDay(cellDate, DateTime.now());

          // その日に行った作業ログ（タイマー/手入力）の件数。
          // GitHub の草風に、最大3つまで緑のマスを表示する（4件以上は増やさない）。
          final activityCount = appState.timeLogs.where((log) {
            final when = log.startTime ?? log.endTime ?? log.createdAt;
            if (when == null) return false;
            return DateUtils.isSameDay(DateUtils.dateOnly(when), cellDate);
          }).length;
          final activityDots = activityCount > 3 ? 3 : activityCount;

          return Container(
            decoration: BoxDecoration(
              color: isToday ? context.pick(Colors.blue.shade50, context.sc.primarySoft) : context.pick(Colors.white, context.sc.surface),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isToday ? context.pick(Colors.blue.shade300, const Color(0xFF3B82F6)) : context.pick(Colors.grey.shade200, context.sc.border),
                width: isToday ? 1.5 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 日付
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 4, 4, 2),
                  child: Text(
                    '$day',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isToday
                          ? context.pick(Colors.blue.shade800, const Color(0xFF93C5FD))
                          : (cellDate.weekday == DateTime.sunday
                              ? context.pick(Colors.red, const Color(0xFFF87171))
                              : (cellDate.weekday == DateTime.saturday
                                  ? context.pick(Colors.blue, const Color(0xFF60A5FA))
                                  : context.sc.ink87)),
                    ),
                  ),
                ),
                // タスクリスト
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    physics: const NeverScrollableScrollPhysics(),
                    children: cellTasks.map<Widget>((task) {
                      return GestureDetector(
                        onTap: () => showTaskDetailSheet(context, task),
                        child: Container(
                          margin: const EdgeInsets.symmetric(
                            vertical: 1,
                            horizontal: 2,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _taskSizeColor(task.sizeLabel),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            task.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                // 作業を行った日のインジケータ（GitHubの草風・最大3つ）
                if (activityDots > 0)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 2, 4, 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        activityDots,
                        (_) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 1.5),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: const Color(0xFF22C55E),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    ];
  }

  // ════════════════════════════════════════════════════════════
  //  週表示
  // ════════════════════════════════════════════════════════════
  List<Widget> _buildWeekView(BuildContext context, dynamic appState) {
    // 週の始まり（日曜）を求める。weekday: 月=1..日=7 → 日曜は 7%7=0 で 0 日戻す。
    final anchorDate = DateUtils.dateOnly(_weekAnchor);
    final weekStart = _addCalendarDays(anchorDate, -(anchorDate.weekday % 7));
    final weekEndExclusive = _addCalendarDays(weekStart, 7);
    final days = List.generate(7, (i) => _addCalendarDays(weekStart, i));
    final today = DateUtils.dateOnly(DateTime.now());

    // この週に表示する作業ログの帯（日跨ぎは深夜0:00で分割）
    final segments = _weekSegments(appState, weekStart, weekEndExclusive);

    final rangeLabel =
        '${weekStart.month}/${weekStart.day} 〜 ${days[6].month}/${days[6].day}';

    return [
      // 週切り替えヘッダー
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () {
              setState(() {
                _weekAnchor = _addCalendarDays(anchorDate, -7);
              });
            },
          ),
          Text(
            '${weekStart.year}年 $rangeLabel',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () {
              setState(() {
                _weekAnchor = _addCalendarDays(anchorDate, 7);
              });
            },
          ),
        ],
      ),
      const SizedBox(height: 8),
      // 曜日・日付＋締切ヘッダー
      Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 時間軸ガター分のスペース
          const SizedBox(width: 38),
          for (int i = 0; i < 7; i++)
            Expanded(child: _weekDayHeader(context, days[i], today, appState)),
        ],
      ),
      const SizedBox(height: 2),
      // 時間グリッド本体（0:00〜24:00）
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _hourGutter(),
          for (int i = 0; i < 7; i++)
            Expanded(
              child: _weekDayColumn(
                context,
                appState,
                dayIndex: i,
                isToday: DateUtils.isSameDay(days[i], today),
                segments: segments.where((s) => s.dayIndex == i).toList(),
              ),
            ),
        ],
      ),
    ];
  }

  // 曜日・日付・締切タスクのヘッダーセル
  Widget _weekDayHeader(
    BuildContext context,
    DateTime day,
    DateTime today,
    dynamic appState,
  ) {
    final isToday = DateUtils.isSameDay(day, today);
    final isSunday = day.weekday == DateTime.sunday;
    final isSaturday = day.weekday == DateTime.saturday;
    final dowColor = isSunday
        ? context.pick(Colors.red, const Color(0xFFF87171))
        : (isSaturday
            ? context.pick(Colors.blue, const Color(0xFF60A5FA))
            : context.sc.ink54);
    const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    final label = weekdayLabels[day.weekday % 7];

    // この日が締切の未完了タスク
    final deadlineTasks = appState.tasks.where((task) {
      if (task.status == TaskStatus.done || task.deadline == null) {
        return false;
      }
      return DateUtils.isSameDay(DateUtils.dateOnly(task.deadline!), day);
    }).toList();

    final shownTasks = deadlineTasks.take(2).toList();
    final extra = deadlineTasks.length - shownTasks.length;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 1),
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
      decoration: BoxDecoration(
        color: isToday ? context.pick(Colors.blue.shade50, context.sc.primarySoft) : Colors.transparent,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: isToday ? context.pick(Colors.blue.shade700, const Color(0xFF60A5FA)) : dowColor,
            ),
          ),
          Text(
            '${day.day}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isToday ? context.pick(Colors.blue.shade800, const Color(0xFF93C5FD)) : context.sc.ink87,
            ),
          ),
          // 締切タスク（最大2件＋件数）
          for (final task in shownTasks)
            GestureDetector(
              onTap: () => showTaskDetailSheet(context, task),
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 2),
                padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                decoration: BoxDecoration(
                  color: _taskSizeColor(task.sizeLabel),
                  borderRadius: BorderRadius.circular(2),
                ),
                child: Text(
                  task.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          if (extra > 0)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                '+$extra',
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: context.sc.ink45,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // 左端の時間軸（0:00〜23:00）
  Widget _hourGutter() {
    return SizedBox(
      width: 38,
      child: Column(
        children: List.generate(24, (h) {
          return SizedBox(
            height: _hourHeight,
            child: Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Text(
                '$h:00',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontSize: 9,
                  color: Colors.grey.shade500,
                  height: 1,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // 1日分の時間グリッド列（グリッド線＋作業ログの帯）
  Widget _weekDayColumn(
    BuildContext context,
    dynamic appState, {
    required int dayIndex,
    required bool isToday,
    required List<_WeekSegment> segments,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isToday ? context.pick(context.pick(Colors.blue.shade50, context.sc.primarySoft).withValues(alpha: 0.4), context.sc.primarySoft) : null,
        border: Border(left: BorderSide(color: context.pick(Colors.grey.shade200, context.sc.border))),
      ),
      child: SizedBox(
        height: _hourHeight * 24,
        child: Stack(
          children: [
            // グリッド線（1時間ごと）
            Column(
              children: List.generate(
                24,
                (_) => Container(
                  height: _hourHeight,
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: context.pick(Colors.grey.shade200, context.sc.border))),
                  ),
                ),
              ),
            ),
            // 作業ログの帯（緑）
            for (final seg in segments)
              Positioned(
                top: seg.topMinutes / 60.0 * _hourHeight,
                left: 1,
                right: 1,
                height: math.max(6.0, seg.durationMinutes / 60.0 * _hourHeight),
                child: Tooltip(
                  message: '${seg.name}（${seg.minutes}分）',
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // 週内の作業ログを「日付境界（深夜0:00）」で分割して帯のリストにする。
  // 例: 1/1 23:00〜1/2 2:00 → 1/1 23:00〜24:00 と 1/2 0:00〜2:00 の2つに分割。
  List<_WeekSegment> _weekSegments(
    dynamic appState,
    DateTime weekStart,
    DateTime weekEndExclusive,
  ) {
    final segs = <_WeekSegment>[];
    for (final TimeLog log in appState.timeLogs) {
      final start = log.startTime;
      if (start == null) continue;

      DateTime end = log.endTime ?? start.add(Duration(seconds: log.durationSeconds));
      if (!end.isAfter(start)) {
        end = start.add(Duration(seconds: log.durationSeconds));
      }
      // 実働0秒（タイマー開始直後の記録など）でも帯を表示する。月表示の作業実績
      // インジケータはこうしたログも件数に数えるため、週表示でも一致させる
      // （表示上の最低限の高さは _weekDayColumn 側の最低高さで確保される）。
      if (!end.isAfter(start)) {
        end = start.add(const Duration(minutes: 1));
      }

      final name = log.subTaskName.isEmpty ? '作業' : log.subTaskName;

      var segStart = start;
      while (segStart.isBefore(end)) {
        final dayStart = DateTime(segStart.year, segStart.month, segStart.day);
        final dayEnd = _addCalendarDays(dayStart, 1);
        final segEnd = end.isBefore(dayEnd) ? end : dayEnd;

        // 週の範囲内の日だけ採用
        if (!dayStart.isBefore(weekStart) && dayStart.isBefore(weekEndExclusive)) {
          final dayIndex = _calendarDaysBetween(weekStart, dayStart);
          final topMinutes = segStart.difference(dayStart).inMinutes.toDouble();
          final durationMinutes = segEnd.difference(segStart).inMinutes;
          segs.add(_WeekSegment(
            dayIndex: dayIndex,
            topMinutes: topMinutes,
            durationMinutes: durationMinutes.toDouble(),
            minutes: math.max(1, durationMinutes),
            name: name,
          ));
        }

        segStart = dayEnd; // 次の日の0:00から続ける
      }
    }
    return segs;
  }
}

// 週表示の作業ログ1区間（日付境界で分割済み）
class _WeekSegment {
  const _WeekSegment({
    required this.dayIndex,
    required this.topMinutes,
    required this.durationMinutes,
    required this.minutes,
    required this.name,
  });

  final int dayIndex; // 週内の何日目か（0=日曜）
  final double topMinutes; // その日の0:00からの分
  final double durationMinutes; // 表示上の長さ（分）
  final int minutes; // ツールチップ表示用の実働分
  final String name;
}
