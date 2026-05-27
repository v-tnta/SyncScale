import 'package:cloud_firestore/cloud_firestore.dart';

class Onboarding {
  Onboarding({
    required this.step1,
    required this.step2,
    required this.step3,
    required this.step4,
    required this.completed,
    this.mobileInstalled,
    this.mobilePromoDismissedAt,
  });

  final bool step1;
  final bool step2;
  final bool step3;
  final bool step4;
  final bool completed;
  final bool? mobileInstalled;
  final DateTime? mobilePromoDismissedAt;

  factory Onboarding.fromMap(Map<String, dynamic> map) {
    DateTime? dismissedAt;
    final rawDismissed = map['mobilePromoDismissedAt'];
    if (rawDismissed is Timestamp) {
      dismissedAt = rawDismissed.toDate();
    } else if (rawDismissed is String) {
      dismissedAt = DateTime.tryParse(rawDismissed);
    }

    return Onboarding(
      step1: map['step1'] ?? false,
      step2: map['step2'] ?? false,
      step3: map['step3'] ?? false,
      step4: map['step4'] ?? false,
      completed: map['completed'] ?? false,
      mobileInstalled: map['mobileInstalled'] as bool?,
      mobilePromoDismissedAt: dismissedAt,
    );
  }
}
