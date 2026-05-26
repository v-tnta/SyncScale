class Onboarding {
  Onboarding({
    required this.step1,
    required this.step2,
    required this.step3,
    required this.step4,
    required this.completed,
    this.mobileInstalled,
  });

  final bool step1;
  final bool step2;
  final bool step3;
  final bool step4;
  final bool completed;
  final bool? mobileInstalled;

  factory Onboarding.fromMap(Map<String, dynamic> map) {
    return Onboarding(
      step1: map['step1'] ?? false,
      step2: map['step2'] ?? false,
      step3: map['step3'] ?? false,
      step4: map['step4'] ?? false,
      completed: map['completed'] ?? false,
      mobileInstalled: map['mobileInstalled'] as bool?,
    );
  }
}
