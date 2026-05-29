import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';

class ConditionResult {
  const ConditionResult({required this.condition, required this.memo});

  final String condition;
  final String memo;
}

Future<ConditionResult?> showConditionDialog(BuildContext context) {
  final appState = SyncScaleScope.of(context);
  final isTutorial = appState.isTutorialActive && appState.tutorialStep == 15;

  return showDialog<ConditionResult>(
    context: context,
    barrierDismissible: !isTutorial,
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
    final appState = SyncScaleScope.of(context);

    return AlertDialog(
      key: appState.isTutorialActive ? appState.tutorialKeys[15] : null,
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
              ButtonSegment(
                value: 'good',
                label: Text('😊', style: TextStyle(fontSize: 26)),
              ),
              ButtonSegment(
                value: 'fair',
                label: Text('🙂', style: TextStyle(fontSize: 26)),
              ),
              ButtonSegment(
                value: 'poor',
                label: Text('😥', style: TextStyle(fontSize: 26)),
              ),
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
          onPressed: (appState.isTutorialActive && appState.tutorialStep == 15)
              ? null
              : () => Navigator.of(context).pop(),
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
