import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';
import '../widgets/task_form_sheet.dart';
import '../widgets/task_size_estimate_dialog.dart';
import 'analytics_screen.dart';
import 'calendar_screen.dart';
import 'tasks_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;
  String? _openEstimateTaskId;

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    _scheduleEstimateDialog(appState);

    final pages = [
      const TasksScreen(),
      const CalendarScreen(),
      const AnalyticsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('SyncScale'),
        actions: [
          IconButton(
            tooltip: 'ログアウト',
            onPressed: () async {
              await appState.logout();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(child: pages[_index]),
      floatingActionButton:
          _index == 0
              ? FloatingActionButton.extended(
                onPressed: () => showTaskFormSheet(context),
                icon: const Icon(Icons.add),
                label: const Text('タスク追加'),
              )
              : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.checklist_outlined),
            selectedIcon: Icon(Icons.checklist),
            label: 'タスク',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'カレンダー',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: '分析',
          ),
        ],
      ),
    );
  }

  void _scheduleEstimateDialog(SyncScaleState appState) {
    final tasksToEstimate =
        appState.tasks.where((task) {
          return task.isNew &&
              (task.sizeLabel == null || task.sizeLabel!.isEmpty);
        }).toList();

    if (tasksToEstimate.isEmpty) {
      _openEstimateTaskId = null;
      return;
    }

    final task = tasksToEstimate.first;
    if (_openEstimateTaskId == task.id) {
      return;
    }

    _openEstimateTaskId = task.id;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) {
        return;
      }
      final total = tasksToEstimate.length;
      final selected = await showTaskSizeEstimateDialog(
        context: context,
        task: task,
        currentIndex: 1,
        totalCount: total,
      );
      if (selected == null) {
        _openEstimateTaskId = null;
        return;
      }
      await appState.updateTask(task.id, {
        'sizeLabel': selected,
        'isNew': false,
      });
      _openEstimateTaskId = null;
    });
  }
}
