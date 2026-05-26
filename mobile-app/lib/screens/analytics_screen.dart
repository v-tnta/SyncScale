import 'package:flutter/material.dart';

import '../models/analytics.dart';
import '../state/syncscale_state.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final leadTimes = calculateLeadTimes(appState.tasks);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
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
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    for (final item in leadTimes)
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              item.sizeLabel,
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: _sizeColor(item.sizeLabel),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${item.averageDays.toStringAsFixed(1)}日',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Color _sizeColor(String sizeLabel) {
    switch (sizeLabel) {
      case 'S':
        return const Color(0xFF06B6D4);
      case 'M':
        return const Color(0xFFF97316);
      case 'L':
        return const Color(0xFFEF4444);
      default:
        return Colors.blue;
    }
  }
}
