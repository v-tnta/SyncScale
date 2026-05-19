import 'package:firebase_auth/firebase_auth.dart';
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
    // 1. プラグインの初期化 (7.0.0以降で必須)
    await _googleSignIn.initialize();

    // 2. アカウント選択ダイアログを表示 (Authentication)
    final GoogleSignInAccount? googleUser = await _googleSignIn.authenticate();
    if (googleUser == null) {
      return;
    }

    // 3. スコープを承認してアクセストークンを取得 (Authorization)
    final authorization = await googleUser.authorizationClient.authorizeScopes([
      'email',
      'profile',
    ]);

    // 4. Firebase 用の認証情報（Credential）を作成
    final OAuthCredential credential = GoogleAuthProvider.credential(
      accessToken: authorization.accessToken,
      idToken: googleUser.authentication.idToken, // 7.0.0以降は同期プロパティ
    );

    // 5. Googleログインを実行
    await _auth.signInWithCredential(credential);
  }

  Future<void> logout() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
