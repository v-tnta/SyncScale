import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/services/auth_service.dart';

class _AppleUserInfo extends Fake implements UserInfo {
  @override
  String get providerId => 'apple.com';
}

class _User extends Fake implements User {
  AuthCredential? credential;

  @override
  String get displayName => 'Existing name';

  @override
  List<UserInfo> get providerData => [
    _AppleUserInfo(),
  ];

  @override
  Future<UserCredential> reauthenticateWithCredential(
    AuthCredential value,
  ) async {
    credential = value;
    return _Result(this);
  }
}

class _Result extends Fake implements UserCredential {
  _Result(this.user);

  @override
  final User user;
}

class _Auth extends Fake implements FirebaseAuth {
  AuthCredential? credential;

  @override
  final _User currentUser = _User();

  @override
  Future<UserCredential> signInWithCredential(AuthCredential value) async {
    credential = value;
    return _Result(currentUser);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel(
    'com.aboutyou.dart_packages.sign_in_with_apple',
  );
  late String appleNonce;

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          expect(call.method, 'performAuthorizationRequest');
          appleNonce = (call.arguments as List).single['nonce'] as String;
          return {
            'type': 'appleid',
            'identityToken': 'test-identity-token',
            'authorizationCode': 'test-authorization-code',
            'givenName': 'Test',
            'familyName': 'User',
          };
        });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  void verifyAppleCredential(AuthCredential credential) {
    // This selector selects the dedicated native Apple path, avoiding the
    // generic OAuth bridge that converts a missing access token to "".
    expect(credential.signInMethod, 'apple.com');
    final oauth = credential as OAuthCredential;
    expect(oauth.idToken, 'test-identity-token');
    expect(oauth.accessToken, isNull);
    expect(sha256.convert(utf8.encode(oauth.rawNonce!)).toString(), appleNonce);
  }

  test(
    'Apple sign-in uses native Apple credential with matching nonce',
    () async {
      final auth = _Auth();
      await AuthService(auth: auth).loginWithApple();
      verifyAppleCredential(auth.credential!);
    },
  );

  test(
    'Apple reauthentication uses native Apple credential and retains code',
    () async {
      final auth = _Auth();
      final code = await AuthService(auth: auth).prepareAccountDeletion();
      verifyAppleCredential(auth.currentUser.credential!);
      expect(code, 'test-authorization-code');
    },
  );
}
