import 'package:flutter/material.dart';

import '../models/analytics.dart';
import '../state/syncscale_state.dart';
import '../widgets/formatters.dart';
import '../widgets/gantt_chart.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final debt = calculateTimeDebt(appState.tasks, appState.timeLogs);
    final leadTimes = calculateLeadTimes(appState.tasks);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        _MetricCard(
          title: '時間負債',
          value: formatSignedHours(debt.debtSeconds),
          subtitle:
              '見積 ${formatDurationSeconds(debt.estimatedSeconds)} / 実績 ${formatDurationSeconds(debt.actualSeconds)}',
          icon: debt.debtSeconds >= 0 ? Icons.trending_up : Icons.trending_down,
          danger: debt.debtSeconds > 0,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.schedule_outlined),
                    SizedBox(width: 8),
                    Text(
                      'S/M/L別 着手リードタイム',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                for (final item in leadTimes)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 28,
                          child: Text(
                            item.sizeLabel,
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        Expanded(
                          child: LinearProgressIndicator(
                            value: (item.averageDays / 14).clamp(0, 1),
                            minHeight: 10,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 10),
                        SizedBox(
                          width: 72,
                          child: Text(
                            '${item.averageDays.toStringAsFixed(1)}日',
                            textAlign: TextAlign.end,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.view_timeline_outlined),
                    SizedBox(width: 8),
                    Text(
                      '全体の実績ガント',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                GanttChart(logs: appState.timeLogs),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.danger,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? const Color(0xFFB91C1C) : const Color(0xFF1D4ED8);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.black54)),
                  Text(
                    value,
                    style: TextStyle(
                      color: color,
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(subtitle, style: const TextStyle(color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
