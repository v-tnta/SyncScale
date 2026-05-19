import 'dart:async';

import 'package:flutter/material.dart';

import '../models/task.dart';
import '../models/time_log.dart';
import '../state/syncscale_state.dart';
import 'formatters.dart';

class TimerPanel extends StatefulWidget {
  const TimerPanel({super.key, required this.task});

  final Task task;

  @override
  State<TimerPanel> createState() => _TimerPanelState();
}

class _TimerPanelState extends State<TimerPanel> {
  final TextEditingController _subTaskController = TextEditingController();
  Timer? _timer;
  DateTime? _startedAt;
  int _elapsedSeconds = 0;

  bool get _isRunning => _startedAt != null;

  @override
  void dispose() {
    _timer?.cancel();
    _subTaskController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.timer_outlined),
                const SizedBox(width: 8),
                Text(
                  'タイマー',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Spacer(),
                Text(
                  formatDurationSeconds(_elapsedSeconds),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _subTaskController,
              enabled: !_isRunning,
              decoration: const InputDecoration(
                labelText: '作業名（例: 資料収集）',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _isRunning ? _stop : _start,
              icon: Icon(_isRunning ? Icons.stop : Icons.play_arrow),
              label: Text(_isRunning ? '停止して保存' : '開始'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _start() async {
    final appState = SyncScaleScope.of(context);
    final now = DateTime.now();

    // タイマー開始時に DOING と startedAt を保存しておくと、
    // ダッシュボードの「着手リードタイム」を後から計算できます。
    await appState.updateTask(widget.task.id, {
      'status': TaskStatus.doing.value,
      if (widget.task.startedAt == null) 'startedAt': now,
    });

    setState(() {
      _startedAt = now;
      _elapsedSeconds = 0;
    });

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      final startedAt = _startedAt;
      if (startedAt == null || !mounted) {
        return;
      }
      setState(() {
        _elapsedSeconds = DateTime.now().difference(startedAt).inSeconds;
      });
    });
  }

  Future<void> _stop() async {
    final startedAt = _startedAt;
    if (startedAt == null) {
      return;
    }

    _timer?.cancel();
    final endTime = DateTime.now();
    final seconds = endTime.difference(startedAt).inSeconds.clamp(1, 1 << 31);
    final appState = SyncScaleScope.of(context);

    try {
      await appState.addTimeLog(
        TimeLog(
          id: '',
          taskId: widget.task.id,
          subTaskName: _subTaskController.text.trim(),
          startTime: startedAt,
          endTime: endTime,
          durationSeconds: seconds,
        ),
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _startedAt = null;
        _elapsedSeconds = 0;
        _subTaskController.clear();
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('作業ログを保存しました。')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('ログ保存に失敗しました: $error')));
    }
  }
}
