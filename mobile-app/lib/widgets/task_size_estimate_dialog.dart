import 'package:flutter/material.dart';

import '../models/task.dart';

Future<String?> showTaskSizeEstimateDialog({
  required BuildContext context,
  required Task task,
  required int currentIndex,
  required int totalCount,
}) {
  return showDialog<String>(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return AlertDialog(
        title: Text('S/M/L 見積もり $currentIndex/$totalCount'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              task.title,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            const Text('この課題の重さを直感で選んでください。'),
          ],
        ),
        actions: [
          for (final size in ['S', 'M', 'L'])
            FilledButton.tonal(
              onPressed: () => Navigator.of(context).pop(size),
              child: Text(size),
            ),
        ],
      );
    },
  );
}
