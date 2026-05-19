import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class SyncScaleFirebaseOptions {
  static FirebaseOptions get current {
    return FirebaseOptions(
      apiKey: _required('VITE_FIREBASE_API_KEY'),
      authDomain: dotenv.env['VITE_FIREBASE_AUTH_DOMAIN'],
      projectId: _required('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: dotenv.env['VITE_FIREBASE_STORAGE_BUCKET'],
      messagingSenderId: _required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: _required('VITE_FIREBASE_APP_ID'),
      measurementId: dotenv.env['VITE_FIREBASE_MEASUREMENT_ID'],
    );
  }

  static String _required(String key) {
    final value = dotenv.env[key];
    if (value == null || value.trim().isEmpty) {
      throw StateError('$key is missing in mobile-app/.env');
    }
    return value;
  }
}
