import 'dart:async';

import 'package:flutter/material.dart';

import '../models/task.dart';
import '../models/time_log.dart';
import '../state/syncscale_state.dart';

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
  bool _isPaused = false;

  bool get _isRunning => _timer != null;

  @override
  void dispose() {
    _timer?.cancel();
    _subTaskController.dispose();
    super.dispose();
  }

  String _formatHHMMSS(int seconds) {
    final h = seconds ~/ 3600;
    final m = (seconds % 3600) ~/ 60;
    final s = seconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
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
              ],
            ),
            const SizedBox(height: 12),
            // 00:00:00 スタイルの目立つタイマー表示
            Container(
              height: 72,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _formatHHMMSS(_elapsedSeconds),
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'monospace',
                  color: Colors.black87,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _subTaskController,
              enabled: !_isRunning && !_isPaused,
              decoration: const InputDecoration(
                labelText: '作業名（例: 資料収集）',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            // ボタンレイアウト
            if (!_isRunning && !_isPaused)
              FilledButton.icon(
                onPressed: _start,
                icon: const Icon(Icons.play_arrow),
                label: const Text('開始'),
              )
            else if (_isRunning && !_isPaused)
              FilledButton.icon(
                onPressed: _pause,
                icon: const Icon(Icons.stop),
                label: const Text('停止'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.red.shade600,
                  foregroundColor: Colors.white,
                ),
              )
            else if (_isPaused)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _resume,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('再開'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _saveLog,
                      icon: const Icon(Icons.save),
                      label: const Text('このまま記録'),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _start() async {
    final appState = SyncScaleScope.of(context);
    final now = DateTime.now();

    await appState.updateTask(widget.task.id, {
      'status': TaskStatus.doing.value,
      if (widget.task.startedAt == null) 'startedAt': now,
    });

    setState(() {
      _startedAt = now;
      _elapsedSeconds = 0;
      _isPaused = false;
    });

    _startTimer();
  }

  void _startTimer() {
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

  void _pause() {
    _timer?.cancel();
    setState(() {
      _timer = null;
      _isPaused = true;
    });
  }

  void _resume() {
    setState(() {
      _startedAt = DateTime.now().subtract(Duration(seconds: _elapsedSeconds));
      _isPaused = false;
    });
    _startTimer();
  }

  Future<void> _saveLog() async {
    final startedAt = _startedAt;
    if (startedAt == null) {
      return;
    }

    final endTime = DateTime.now();
    final seconds = _elapsedSeconds.clamp(1, 1 << 31);
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
        _timer = null;
        _startedAt = null;
        _elapsedSeconds = 0;
        _isPaused = false;
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
