import 'package:flutter/material.dart';

import '../models/task.dart';
import '../state/syncscale_state.dart';
import '../widgets/task_detail_sheet.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedMonth = DateTime.now();

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

    final year = _focusedMonth.year;
    final month = _focusedMonth.month;

    // その月の最初の日と最後の日
    final firstDay = DateTime(year, month, 1);
    final lastDay = DateTime(year, month + 1, 0);

    final daysInMonth = lastDay.day;
    // 日曜日が週の最初 (firstDay.weekday % 7: 日曜は7%7=0, 月曜は1%7=1, ..., 土曜は6%7=6)
    final offset = firstDay.weekday % 7;
    final totalCells = daysInMonth + offset;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
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
                  color: Colors.grey.shade50,
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

            return Container(
              decoration: BoxDecoration(
                color: isToday ? Colors.blue.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: isToday ? Colors.blue.shade300 : Colors.grey.shade200,
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
                            ? Colors.blue.shade800
                            : (cellDate.weekday == DateTime.sunday
                                ? Colors.red
                                : (cellDate.weekday == DateTime.saturday
                                    ? Colors.blue
                                    : Colors.black87)),
                      ),
                    ),
                  ),
                  // タスクリスト
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      physics: const NeverScrollableScrollPhysics(),
                      children: cellTasks.map((task) {
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
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
