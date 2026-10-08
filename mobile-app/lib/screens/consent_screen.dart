import 'package:flutter/material.dart';

import '../constants/agreement.dart';
import '../state/syncscale_state.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _saving = false;

  Future<void> _agree() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      await SyncScaleScope.of(context).recordConsent();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('同意を保存できませんでした: $error')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = SyncScaleScope.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('研究参加への同意書'),
        actions: [
          TextButton(onPressed: state.logout, child: const Text('ログアウト')),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (state.consentErrorMessage != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  state.consentErrorMessage!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Text(
                  agreementText,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(height: 1.65),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed:
                      _saving || state.consentErrorMessage != null
                          ? null
                          : _agree,
                  child:
                      _saving
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                          : const Text('説明を理解し、同意して研究に参加する'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
