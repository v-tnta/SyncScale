import 'package:flutter/material.dart';

import '../models/task.dart';
import 'formatters.dart';

class TaskCard extends StatelessWidget {
  const TaskCard({
    super.key,
    required this.task,
    required this.onTap,
  });

  final Task task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
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
                        if (task.sizeLabel != null &&
                            task.sizeLabel!.isNotEmpty)
                          _ChipText(label: task.sizeLabel!),
                        _statusChip(task.status),
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

  Widget _statusChip(TaskStatus status) {
    Color? textColor;
    Color? backgroundColor;

    if (status == TaskStatus.doing) {
      textColor = const Color(0xFFEA580C);
      backgroundColor = const Color(0xFFFFEDD5);
    } else if (status == TaskStatus.done) {
      textColor = const Color(0xFF16A34A);
      backgroundColor = const Color(0xFFDCFCE7);
    }

    return _ChipText(
      label: status.label,
      textColor: textColor,
      backgroundColor: backgroundColor,
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
  const _ChipText({
    required this.label,
    this.icon,
    this.danger = false,
    this.textColor,
    this.backgroundColor,
  });

  final String label;
  final IconData? icon;
  final bool danger;
  final Color? textColor;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final color = textColor ?? (danger ? const Color(0xFFB91C1C) : const Color(0xFF334155));
    final background = backgroundColor ?? (danger ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9));

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
