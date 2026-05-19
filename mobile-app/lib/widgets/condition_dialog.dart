import 'package:flutter/material.dart';

class ConditionResult {
  const ConditionResult({required this.condition, required this.memo});

  final String condition;
  final String memo;
}

Future<ConditionResult?> showConditionDialog(BuildContext context) {
  return showDialog<ConditionResult>(
    context: context,
    builder: (context) => const ConditionDialog(),
  );
}

class ConditionDialog extends StatefulWidget {
  const ConditionDialog({super.key});

  @override
  State<ConditionDialog> createState() => _ConditionDialogState();
}

class _ConditionDialogState extends State<ConditionDialog> {
  final TextEditingController _memoController = TextEditingController();
  String _condition = 'fair';

  @override
  void dispose() {
    _memoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('提出時のコンディション'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SegmentedButton<String>(
            selected: {_condition},
            onSelectionChanged: (selection) {
              setState(() => _condition = selection.first);
            },
            segments: const [
              ButtonSegment(value: 'good', label: Text('よい')),
              ButtonSegment(value: 'fair', label: Text('普通')),
              ButtonSegment(value: 'poor', label: Text('悪い')),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _memoController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'メモ（任意）',
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('キャンセル'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop(
              ConditionResult(
                condition: _condition,
                memo: _memoController.text.trim(),
              ),
            );
          },
          child: const Text('完了にする'),
        ),
      ],
    );
  }
}
