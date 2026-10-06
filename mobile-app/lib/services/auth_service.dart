import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

/// 削除前の再認証がユーザー操作で中断されたことを表す。
///
/// この例外が飛んだ時点では Firestore のデータもアカウントも削除していない。
class ReauthenticationCancelled implements Exception {
  const ReauthenticationCancelled();

  @override
  String toString() => '本人確認がキャンセルされたため、削除を中止しました';
}

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

  /// Sign in with Apple（iOS ネイティブのみ）。
  ///
  /// App Store のガイドライン 4.8 は、第三者ログイン（Googleサインイン）を
  /// 提供するアプリに同等のプライバシー保護ログインを求めるため、iOS では
  /// Googleサインインと並べて必ず提示すること。
  ///
  /// リプレイ攻撃対策として nonce を使う。Apple には SHA-256 ハッシュを渡し、
  /// Firebase には元の文字列（rawNonce）を渡す点に注意。
  Future<void> loginWithApple() async {
    final String rawNonce = _generateNonce();

    final AuthorizationCredentialAppleID appleCredential;
    try {
      appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: const [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: _sha256OfString(rawNonce),
      );
    } on SignInWithAppleAuthorizationException catch (error) {
      if (error.code == AuthorizationErrorCode.canceled) {
        // ユーザーがシートを閉じただけなのでエラー扱いにしない
        return;
      }
      rethrow;
    }

    final String? identityToken = appleCredential.identityToken;
    if (identityToken == null) {
      throw StateError('Appleから identityToken を取得できませんでした');
    }

    // Apple 専用 API を使う。汎用 OAuth の iOS 経路では SDK の組み合わせにより
    // null の accessToken が空文字に変換され、Invalid OAuth response になる。
    final OAuthCredential credential = AppleAuthProvider.credentialWithIDToken(
      identityToken,
      rawNonce,
      AppleFullPersonName(
        familyName: appleCredential.familyName,
        givenName: appleCredential.givenName,
      ),
    );

    final UserCredential userCredential = await _auth.signInWithCredential(
      credential,
    );

    // Apple は氏名を初回サインイン時のみ返し、Firebase の displayName には
    // 自動反映されないため、ここで設定する（設定ダイアログの表示名で使用）。
    final User? user = userCredential.user;
    if (user != null && (user.displayName == null || user.displayName!.isEmpty)) {
      final String fullName = [
        appleCredential.familyName,
        appleCredential.givenName,
      ].whereType<String>().where((part) => part.isNotEmpty).join(' ');
      if (fullName.isNotEmpty) {
        await user.updateDisplayName(fullName);
      }
    }
  }

  /// アカウント削除の前に本人確認を済ませる。
  ///
  /// Firestore のデータを消す前に呼ぶことで、再認証をキャンセルしたときに
  /// 「Firestoreのデータだけ消えてアカウントが残る」中途半端な状態を避ける。
  ///
  /// Apple でサインインしたユーザーは、トークン失効に使う authorizationCode を
  /// 得るため経過時間に関わらず毎回 Apple のシートを出す。
  /// Google は直近のサインインから時間が経っている場合のみ再認証する。
  ///
  /// 戻り値は [deleteAccount] に渡す Apple の authorizationCode（Google は null）。
  Future<String?> prepareAccountDeletion() async {
    final User? user = _auth.currentUser;
    if (user == null) {
      return null;
    }
    if (_usesApple(user)) {
      return _reauthenticate(user);
    }
    final DateTime? lastSignIn = user.metadata.lastSignInTime;
    if (lastSignIn != null &&
        DateTime.now().difference(lastSignIn) < const Duration(minutes: 4)) {
      return null;
    }
    return _reauthenticate(user);
  }

  /// Firebase Auth のアカウント自体を削除する（App Store ガイドライン 5.1.1(v)）。
  ///
  /// Firestore 側のデータ削除は [SyncScaleRepository.withdrawConsent] が担当し、
  /// 研究記録である consents/{userId} は削除せず残す。
  ///
  /// Sign in with Apple のユーザーは、削除前に Apple のトークンも失効させる
  /// （Sign in with Apple を使うアプリのアカウント削除に対する App Store の要件）。
  Future<void> deleteAccount({String? appleAuthorizationCode}) async {
    final User? user = _auth.currentUser;
    if (user == null) {
      return;
    }
    // 失効 API はサインイン中のユーザーの ID トークンを使うため、delete より先に呼ぶ
    await _revokeAppleToken(appleAuthorizationCode);
    try {
      await user.delete();
    } on FirebaseAuthException catch (error) {
      if (error.code != 'requires-recent-login') {
        rethrow;
      }
      // prepareAccountDeletion の時間判定をすり抜けた場合の保険
      final String? authorizationCode = await _reauthenticate(user);
      if (appleAuthorizationCode == null) {
        await _revokeAppleToken(authorizationCode);
      }
      await user.delete();
    }
    // 次回ログイン時にアカウント選択が出るよう、Google 側のセッションも切る
    if (!kIsWeb) {
      try {
        await _googleSignIn.signOut();
      } catch (_) {
        // google_sign_in が初期化されていない場合のエラーを無視
      }
    }
  }

  bool _usesApple(User user) =>
      user.providerData.any((info) => info.providerId == 'apple.com');

  /// Sign in with Apple のトークンを失効させる。
  ///
  /// Firebase Console の Apple プロバイダに Services ID と OAuth コードフロー設定
  /// （Team ID / Key ID / 秘密鍵）が無いと失敗する。失効に失敗しても
  /// ユーザーの削除依頼は止めず、アカウント削除は続行する。
  Future<void> _revokeAppleToken(String? authorizationCode) async {
    if (authorizationCode == null) {
      return;
    }
    try {
      await _auth.revokeTokenWithAuthorizationCode(authorizationCode);
    } catch (error) {
      debugPrint('Apple トークンの失効に失敗しました: $error');
    }
  }

  /// 同じプロバイダで再認証する。Apple の場合は authorizationCode を返す。
  Future<String?> _reauthenticate(User user) async {
    if (_usesApple(user)) {
      final String rawNonce = _generateNonce();
      final AuthorizationCredentialAppleID appleCredential;
      try {
        appleCredential = await SignInWithApple.getAppleIDCredential(
          scopes: const [AppleIDAuthorizationScopes.email],
          nonce: _sha256OfString(rawNonce),
        );
      } on SignInWithAppleAuthorizationException catch (error) {
        if (error.code == AuthorizationErrorCode.canceled) {
          throw const ReauthenticationCancelled();
        }
        rethrow;
      }
      final String? identityToken = appleCredential.identityToken;
      if (identityToken == null) {
        throw StateError('Appleから identityToken を取得できませんでした');
      }
      await user.reauthenticateWithCredential(
        AppleAuthProvider.credentialWithIDToken(
          identityToken,
          rawNonce,
          AppleFullPersonName(
            familyName: appleCredential.familyName,
            givenName: appleCredential.givenName,
          ),
        ),
      );
      return appleCredential.authorizationCode;
    }

    if (kIsWeb) {
      await user.reauthenticateWithPopup(GoogleAuthProvider());
      return null;
    }

    await _googleSignIn.initialize();
    final GoogleSignInAccount googleUser;
    try {
      googleUser = await _googleSignIn.authenticate();
    } on GoogleSignInException catch (error) {
      if (error.code == GoogleSignInExceptionCode.canceled) {
        throw const ReauthenticationCancelled();
      }
      rethrow;
    }
    final GoogleSignInAuthentication googleAuth = googleUser.authentication;
    await user.reauthenticateWithCredential(
      GoogleAuthProvider.credential(idToken: googleAuth.idToken),
    );
    return null;
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
    // Sign in with Apple 側にサインアウトAPIはなく、Firebase の signOut で完結する
    await _auth.signOut();
  }

  static String _generateNonce([int length = 32]) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(
      length,
      (_) => charset[random.nextInt(charset.length)],
    ).join();
  }

  static String _sha256OfString(String input) {
    return sha256.convert(utf8.encode(input)).toString();
  }
}
