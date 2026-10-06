import 'package:flutter/material.dart';

import '../state/syncscale_state.dart';
import 'home_screen.dart';
import 'consent_screen.dart';
import 'tutorial_screen.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = SyncScaleScope.of(context);

    if (appState.authLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (appState.isAuthenticated) {
      if (appState.consentLoading) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      if (!appState.hasConsented) {
        return const ConsentScreen();
      }
      return const HomeScreen();
    }

    return const TutorialScreen();
  }
}
