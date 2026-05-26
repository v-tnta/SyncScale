import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  AuthService({FirebaseAuth? auth, GoogleSignIn? googleSignIn})
    : _auth = auth ?? FirebaseAuth.instance,
      _googleSignIn = googleSignIn ?? GoogleSignIn.instance;

  final FirebaseAuth _auth;
  final GoogleSignIn _googleSignIn;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<void> loginWithGoogle() async {
    if (kIsWeb) {
      // Web プラットフォームでは signInWithPopup を直接使用。
      // google_sign_in パッケージを経由せず、Firebase Auth が
      // Google OAuth フローを一括処理するため、null check エラーを回避できる。
      final googleProvider = GoogleAuthProvider();
      await _auth.signInWithPopup(googleProvider);
    } else {
      // モバイル (Android/iOS) では google_sign_in パッケージを使用
      await _googleSignIn.initialize();
      final GoogleSignInAccount? googleUser =
          await _googleSignIn.authenticate();
      if (googleUser == null) {
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final OAuthCredential credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
      );

      await _auth.signInWithCredential(credential);
    }
  }

  Future<void> logout() async {
    // Web でも signOut は共通で動作する
    if (!kIsWeb) {
      try {
        await _googleSignIn.signOut();
      } catch (_) {
        // google_sign_in が初期化されていない場合のエラーを無視
      }
    }
    await _auth.signOut();
  }
}
