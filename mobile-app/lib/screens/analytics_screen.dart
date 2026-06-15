import 'package:flutter/material.dart';

import '../models/analytics.dart';
import '../state/syncscale_state.dart';

// コンディションの色
const _goodColor = Color(0xFF34D399);
const _fairColor = Color(0xFFFBBF24);
const _poorColor = Color(0xFFFB7185);

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final tasks = appState.tasks;
    final timeLogs = appState.timeLogs;
    final conditionLogs = appState.conditionLogs;

    final leadTimes = calculateLeadTimes(tasks);
    final estimation = calculateEstimationAccuracy(tasks, timeLogs);
    final cramming = calculateCrammingScores(tasks, timeLogs);
    final conditionByTime = calculateConditionByTimeOfDay(
      tasks,
      timeLogs,
      conditionLogs,
    );
    final stalledTasks = detectStalledTasks(tasks, timeLogs);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        _leadTimeCard(leadTimes),
        const SizedBox(height: 12),
        _estimationCard(estimation),
        const SizedBox(height: 12),
        _crammingCard(cramming),
        const SizedBox(height: 12),
        _conditionByTimeCard(conditionByTime),
        const SizedBox(height: 12),
        _stalledCard(stalledTasks),
      ],
    );
  }

  // ── 共通: カードの枠 ──────────────────────────────
  Widget _card({
    required IconData icon,
    required String title,
    String? description,
    required Widget child,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            if (description != null) ...[
              const SizedBox(height: 6),
              Text(
                description,
                style: const TextStyle(fontSize: 11, color: Colors.black45),
              ),
            ],
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }

  // ── 着手リードタイム ──────────────────────────────
  Widget _leadTimeCard(List<LeadTimeSummary> leadTimes) {
    return _card(
      icon: Icons.schedule_outlined,
      title: 'S/M/L別 着手リードタイム',
      description: '最初に着手した時点が、締切の何日前だったかの平均です。',
      child: Row(
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
    );
  }

  // ── 1. 見積もり精度：SML × 実働時間 ────────────────
  Widget _estimationCard(List<EstimationSummary> estimation) {
    final consistent = isEstimationConsistent(estimation);
    final allEmpty = estimation.every((e) => e.count == 0);

    String message;
    Color messageColor;
    if (allEmpty) {
      message = '💡 作業ログを記録すると、サイズ感と実時間のズレが見えてきます。';
      messageColor = Colors.blueGrey;
    } else if (consistent) {
      message = '✅ サイズが大きいほど作業時間も長く、見積もりの感覚が一貫しています。';
      messageColor = const Color(0xFF059669);
    } else {
      message = '⚠️ サイズの大小と実際の作業時間が逆転しています。ラベルの付け方を見直すヒントになります。';
      messageColor = const Color(0xFFB45309);
    }

    return _card(
      icon: Icons.track_changes_outlined,
      title: '見積もり精度（SML × 実働時間）',
      description: 'S/M/L ごとの平均作業時間。S→M→L で増えていれば見積もりの感覚が一貫しています。',
      child: Column(
        children: [
          Row(
            children: [
              for (final item in estimation)
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        item.sizeLabel,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _sizeColor(item.sizeLabel),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.count > 0 ? _formatMinutes(item.avgMinutes) : '—',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.count > 0 ? '平均 / ${item.count}件' : 'データなし',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.black38,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          _noteBox(message, messageColor),
        ],
      ),
    );
  }

  // ── 2. 一夜漬け度 ──────────────────────────────────
  Widget _crammingCard(CrammingScores cramming) {
    Widget body;
    if (cramming.taskCount == 0 || cramming.overallRatio == null) {
      body = _emptyBox('締切と作業ログが揃ったタスクがまだありません。');
    } else {
      final overallPct = (cramming.overallRatio! * 100).round();
      final topTasks = cramming.topTasks.where((t) => t.ratio > 0).toList();
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 全体ゲージ
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '全体の一夜漬け度',
                style: TextStyle(fontSize: 12, color: Colors.black54),
              ),
              Text(
                '$overallPct%',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: cramming.overallRatio!.clamp(0.0, 1.0),
              minHeight: 10,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation(_poorColor),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '対象 ${cramming.taskCount}件中 ${cramming.crammedTaskCount}件が「直前集中型」（50%以上）',
            style: const TextStyle(fontSize: 10, color: Colors.black38),
          ),
          const SizedBox(height: 16),
          // サイズ別
          Row(
            children: [
              for (final item in cramming.bySize)
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        item.sizeLabel,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: _sizeColor(item.sizeLabel),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.ratio == null
                            ? '—'
                            : '${(item.ratio! * 100).round()}%',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        '${item.count}件',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.black38,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          if (topTasks.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              '直前集中だったタスク',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.black45,
              ),
            ),
            const SizedBox(height: 6),
            for (final t in topTasks)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        t.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    Text(
                      '${(t.ratio * 100).round()}%',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: _poorColor,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      );
    }

    return _card(
      icon: Icons.nightlight_outlined,
      title: '一夜漬け度',
      description: '全作業時間のうち、締切24時間前以降（超過分含む）に行った割合の平均です。',
      child: body,
    );
  }

  // ── 3. 時間帯 × コンディション ─────────────────────
  Widget _conditionByTimeCard(List<TimeBandCondition> bands) {
    final maxTotal = bands.fold<double>(
      1,
      (m, b) => b.total > m ? b.total : m,
    );
    final allEmpty = bands.every((b) => b.total == 0);

    Widget body;
    if (allEmpty) {
      body = _emptyBox('作業ログとコンディションが揃うと、時間帯ごとの傾向が見えてきます。');
    } else {
      body = Column(
        children: [
          for (final band in bands) ...[
            _bandRow(band, maxTotal),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 4),
          // 凡例
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              _LegendDot(color: _goodColor, label: '良い'),
              SizedBox(width: 12),
              _LegendDot(color: _fairColor, label: '普通'),
              SizedBox(width: 12),
              _LegendDot(color: _poorColor, label: 'しんどい'),
            ],
          ),
        ],
      );
    }

    return _card(
      icon: Icons.access_time,
      title: '時間帯 × コンディション',
      description: 'どの時間帯に作業したタスクが、提出時にどんな手応えだったかを作業時間で集計しています。',
      child: body,
    );
  }

  Widget _bandRow(TimeBandCondition band, double maxTotal) {
    final hasData = band.total > 0;
    final widthFactor =
        hasData ? (band.total / maxTotal).clamp(0.08, 1.0) : 0.08;

    final segments = <Widget>[];
    if (hasData) {
      void addSeg(double value, Color color) {
        if (value <= 0) return;
        // 微小セグメントでも flex が 0 にならないよう最低 1 を確保（Expanded は flex>0 必須）
        final flex = (value * 100).round().clamp(1, 1 << 30);
        segments.add(Expanded(flex: flex, child: Container(color: color)));
      }

      addSeg(band.good, _goodColor);
      addSeg(band.fair, _fairColor);
      addSeg(band.poor, _poorColor);
    }

    return Row(
      children: [
        SizedBox(
          width: 52,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                band.label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                band.range,
                style: const TextStyle(fontSize: 9, color: Colors.black38),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Align(
            alignment: Alignment.centerLeft,
            child: FractionallySizedBox(
              widthFactor: widthFactor.toDouble(),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(5),
                child: SizedBox(
                  height: 22,
                  child: hasData
                      ? Row(children: segments)
                      : Container(color: const Color(0xFFF1F5F9)),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 56,
          child: Text(
            hasData ? _formatMinutes(band.total) : '—',
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.black45,
            ),
          ),
        ),
      ],
    );
  }

  // ── 4. 放置タスク検出 ──────────────────────────────
  Widget _stalledCard(List<StalledTask> stalled) {
    Widget body;
    if (stalled.isEmpty) {
      body = Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFECFDF5),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFA7F3D0)),
        ),
        child: const Text(
          '✅ 放置されているタスクはありません。順調です！',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF047857),
          ),
        ),
      );
    } else {
      body = Column(
        children: [
          for (final t in stalled)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  if (t.sizeLabel != null) ...[
                    CircleAvatar(
                      radius: 13,
                      backgroundColor:
                          _sizeColor(t.sizeLabel!).withValues(alpha: 0.15),
                      child: Text(
                        t.sizeLabel!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: _sizeColor(t.sizeLabel!),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                        if (t.isOverdue)
                          const Text(
                            '締切超過',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Text(
                    '${t.stalledDays.floor()}日放置',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFD97706),
                    ),
                  ),
                ],
              ),
            ),
        ],
      );
    }

    return _card(
      icon: Icons.warning_amber_rounded,
      title: '放置タスク',
      description: '「とりかかり中」のまま3日以上作業していないタスクです。',
      child: body,
    );
  }

  // ── 共通ウィジェット ──────────────────────────────
  Widget _noteBox(String message, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        message,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _emptyBox(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.black45,
        ),
      ),
    );
  }

  String _formatMinutes(double minutes) {
    final m = minutes.round();
    if (m < 60) return '$m分';
    final h = m ~/ 60;
    final rem = m % 60;
    return rem == 0 ? '$h時間' : '$h時間$rem分';
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

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
      ],
    );
  }
}
