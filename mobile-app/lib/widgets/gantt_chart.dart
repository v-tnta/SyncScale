import 'package:flutter/material.dart';

import '../models/time_log.dart';
import 'formatters.dart';

class GanttChart extends StatelessWidget {
  const GanttChart({super.key, required this.logs});

  final List<TimeLog> logs;

  @override
  Widget build(BuildContext context) {
    final visibleLogs =
        logs
            .where((log) => log.startTime != null && log.endTime != null)
            .toList()
          ..sort((a, b) => a.startTime!.compareTo(b.startTime!));

    if (visibleLogs.isEmpty) {
      return const Text(
        '作業ログが入ると、ここに実績ガントチャートが表示されます。',
        style: TextStyle(color: Colors.black54),
      );
    }

    final minStart = visibleLogs.first.startTime!;
    final maxEnd = visibleLogs
        .map((log) => log.endTime!)
        .reduce((a, b) => a.isAfter(b) ? a : b);
    final totalSeconds = maxEnd
        .difference(minStart)
        .inSeconds
        .clamp(1, 1 << 31);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final log in visibleLogs)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.subTaskName.isEmpty ? '作業' : log.subTaskName,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                LayoutBuilder(
                  builder: (context, constraints) {
                    // start/end の差分を親幅に変換するだけの純粋な計算です。
                    // ガント生成ロジックをUIと分けて考えやすくするため、
                    // 「全体期間に対する割合」を先に作ってから描画しています。
                    final leftRatio =
                        log.startTime!.difference(minStart).inSeconds /
                        totalSeconds;
                    final widthRatio =
                        log.endTime!.difference(log.startTime!).inSeconds /
                        totalSeconds;
                    final left = constraints.maxWidth * leftRatio;
                    final width = (constraints.maxWidth * widthRatio).clamp(
                      4.0,
                      constraints.maxWidth,
                    );

                    return SizedBox(
                      height: 18,
                      child: Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFE5E7EB),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          Positioned(
                            left: left,
                            width: width,
                            top: 0,
                            bottom: 0,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 4),
                Text(
                  '${formatDateTime(log.startTime)} - ${formatDateTime(log.endTime)}',
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
