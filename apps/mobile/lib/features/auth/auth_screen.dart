import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../core/auth/auth_provider.dart";

class AuthScreenPage extends ConsumerStatefulWidget {
  const AuthScreenPage({super.key});

  @override
  ConsumerState<AuthScreenPage> createState() => _AuthScreenPageState();
}

class _AuthScreenPageState extends ConsumerState<AuthScreenPage> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;
    if (email.isEmpty || password.isEmpty) return;
    await ref.read(authProvider.notifier).login(email, password);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.value?.isLoading ?? false;
    final error = authState.value?.error;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo / branding
                const Icon(Icons.school_outlined, size: 64, color: Color(0xFF1C1810)),
                const SizedBox(height: 12),
                const Text(
                  "EdAI",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 4,
                    color: Color(0xFF1C1810),
                  ),
                ),
                Text(
                  "RV Trust Education Platform",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 48),

                // Email
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(
                    labelText: "Email",
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(
                    labelText: "Password",
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  onFieldSubmitted: (_) => _login(),
                ),
                const SizedBox(height: 12),

                // Error
                if (error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(error,
                        style: TextStyle(color: Colors.red.shade700, fontSize: 14)),
                  ),
                  const SizedBox(height: 12),
                ],

                // Login button
                FilledButton(
                  onPressed: isLoading ? null : _login,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1C1810),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text("Sign In", style: TextStyle(fontSize: 16)),
                ),

                const SizedBox(height: 32),

                // Dev hints
                if (const bool.fromEnvironment("dart.vm.product") == false) ...[
                  Text("Dev accounts", style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _DevChip("admin@rvce.edu", "Admin@123", _emailCtrl, _passCtrl),
                      _DevChip("teacher@rvce.edu", "Teacher@123", _emailCtrl, _passCtrl),
                      _DevChip("student@rvce.edu", "Student@123", _emailCtrl, _passCtrl),
                      _DevChip("parent@rvce.edu", "Parent@123", _emailCtrl, _passCtrl),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DevChip extends StatelessWidget {
  const _DevChip(this.email, this.password, this.emailCtrl, this.passCtrl);

  final String email;
  final String password;
  final TextEditingController emailCtrl;
  final TextEditingController passCtrl;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(email.split("@").first, style: const TextStyle(fontSize: 11)),
      onPressed: () {
        emailCtrl.text = email;
        passCtrl.text = password;
      },
    );
  }
}
