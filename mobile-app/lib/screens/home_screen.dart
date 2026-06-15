import 'package:flutter/material.dart';

import '../constants/app_info.dart';
import '../state/syncscale_state.dart';
import '../widgets/task_form_sheet.dart';
import '../widgets/mobile_app_promo_dialog.dart';
import '../widgets/task_size_estimate_dialog.dart';
import '../widgets/tutorial_guide_overlay.dart';
import 'analytics_screen.dart';
import 'calendar_screen.dart';
import 'tasks_screen.dart';
import '../widgets/settings_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;
  String? _openEstimateTaskId;
  SyncScaleState? _appState;
  bool _isPromoDialogOpen = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final state = SyncScaleScope.of(context);
    if (_appState != state) {
      _appState?.removeListener(_handleTutorialStateChanged);
      _appState = state;
      _appState?.addListener(_handleTutorialStateChanged);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleTutorialStateChanged();
    });
  }

  @override
  void dispose() {
    _appState?.removeListener(_handleTutorialStateChanged);
    super.dispose();
  }

  void _handleTutorialStateChanged() {
    if (!mounted) return;
    final state = _appState;
    if (state != null && state.isTutorialActive) {
      // チュートリアル中のカレンダー遷移前（Step 19未満）であれば_indexを0に強制する
      if ((state.tutorialStep ?? 0) < 19 && _index != 0) {
        setState(() {
          _index = 0;
        });
      }
    }
    _checkAndShowMobilePromo();
  }

  void _checkAndShowMobilePromo() {
    if (!mounted) return;
    final state = _appState;
    if (state == null) return;

    if (state.isMobilePromoOpen && !_isPromoDialogOpen) {
      _isPromoDialogOpen = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;
        await MobileAppPromoDialog.show(context);
        _isPromoDialogOpen = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);
    final isTutorial = appState.isTutorialActive;
    _scheduleEstimateDialog(appState);

    final pages = [
      const TasksScreen(),
      const CalendarScreen(),
      const AnalyticsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 56, // 以前の 48 からさらに一回り大きく変更
              height: 56, // 以前の 48 からさらに一回り大きく変更
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 8),
            const Text(
              'SyncScale',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(width: 6),
            const Text(
              'v$kAppVersion',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: '設定',
            onPressed: () {
              SettingsDialog.show(context);
            },
            icon: const Icon(Icons.settings),
          ),
        ],
      ),
      body: SafeArea(
        // チュートリアル中のStep 19（カレンダー選択案内）まではTasksScreenを表示
        child: pages[(isTutorial && (appState.tutorialStep ?? 0) < 19) ? 0 : _index],
      ),
      floatingActionButton: (_index == 0 && (!isTutorial || appState.tutorialStep == 1))
          ? FloatingActionButton.extended(
              key: isTutorial ? appState.tutorialKeys[1] : null,
              onPressed: () => showTaskFormSheet(context),
              icon: const Icon(Icons.add),
              label: const Text('タスクを登録'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        key: isTutorial ? appState.tutorialKeys[19] : null,
        // チュートリアル中のStep 19まではタスクタブ（0）を選択状態に固定
        selectedIndex: (isTutorial && (appState.tutorialStep ?? 0) < 19) ? 0 : _index,
        onDestinationSelected: (value) {
          if (isTutorial) {
            // チュートリアル中かつStep 19（カレンダー選択案内）のときのみカレンダーへの遷移を許可
            if (appState.tutorialStep == 19 && value == 1) {
               setState(() => _index = value);
               appState.setTutorialStep(20);
            }
            return;
          }
          if (_index != value) {
            const screenNames = ['tasks', 'calendar', 'analytics'];
            appState.logActivity('screen_view', {'screen': screenNames[value]});
          }
          setState(() => _index = value);
        },
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
