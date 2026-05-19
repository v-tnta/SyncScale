import 'package:flutter/material.dart';

import '../models/task.dart';
import '../models/time_log.dart';
import 'formatters.dart';

class TaskCard extends StatelessWidget {
  const TaskCard({
    super.key,
    required this.task,
    required this.logs,
    required this.onTap,
  });

  final Task task;
  final List<TimeLog> logs;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final actualSeconds = logs.fold<int>(
      0,
      (sum, log) => sum + log.durationSeconds,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 4,
                height: 72,
                decoration: BoxDecoration(
                  color: _sizeColor(task.sizeLabel),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        _ChipText(
                          icon: Icons.event_outlined,
                          label: formatDateTime(task.deadline),
                          danger: task.isOverdue,
                        ),
                        _ChipText(
                          icon: Icons.timer_outlined,
                          label: formatDurationSeconds(actualSeconds),
                        ),
                        _ChipText(label: task.status.label),
                        if (task.sizeLabel != null &&
                            task.sizeLabel!.isNotEmpty)
                          _ChipText(label: task.sizeLabel!),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }

  Color _sizeColor(String? sizeLabel) {
    switch (sizeLabel) {
      case 'S':
        return const Color(0xFF06B6D4);
      case 'M':
        return const Color(0xFFF97316);
      case 'L':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFFCBD5E1);
    }
  }
}

class _ChipText extends StatelessWidget {
  const _ChipText({required this.label, this.icon, this.danger = false});

  final String label;
  final IconData? icon;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? const Color(0xFFB91C1C) : const Color(0xFF334155);
    final background =
        danger ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
