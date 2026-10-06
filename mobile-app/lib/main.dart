import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'package:flutter/foundation.dart' show kIsWeb;

import 'firebase_options.dart';
import 'screens/auth_gate.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';
import 'services/syncscale_repository.dart';
import 'state/syncscale_state.dart';
import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';
import 'widgets/tutorial_guide_overlay.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    try {
      await dotenv.load(fileName: '.env');
    } catch (_) {
      // .envが無い場合のフォールバック（String.fromEnvironmentで定義されている場合など）
    }
  }
  await Firebase.initializeApp(options: SyncScaleFirebaseOptions.current);

  final notificationService = NotificationService();
  if (!kIsWeb) {
    try {
      await notificationService.init();
    } catch (e) {
      // 通知の初期化失敗はアプリ起動を妨げない
      debugPrint('通知サービスの初期化に失敗しました: $e');
    }
  }

  final appState = SyncScaleState(
    authService: AuthService(),
    repository: SyncScaleRepository(),
    notificationService: notificationService,
  )..start();

  runApp(SyncScaleScope(state: appState, child: const SyncScaleApp()));
}

class SyncScaleApp extends StatelessWidget {
  const SyncScaleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeController,
      builder: (context, themeMode, _) => MaterialApp(
      title: 'SyncScale',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(Brightness.light),
      darkTheme: buildAppTheme(Brightness.dark),
      themeMode: themeMode,
      home: const AuthGate(),
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            const TutorialGuideOverlayWrapper(),
          ],
        );
      },
      ),
    );
  }
}
