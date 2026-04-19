import "package:flutter_riverpod/flutter_riverpod.dart";
import "auth_repository.dart";
import "session_store.dart";

// ── Auth state ─────────────────────────────────────────────────────────────────

class AuthState {
  const AuthState({
    this.session,
    this.isLoading = false,
    this.error,
  });

  final AuthSession? session;
  final bool isLoading;
  final String? error;

  bool get isAuthenticated => session != null;
  UserRole? get role => session?.user.role;

  AuthState copyWith({
    AuthSession? session,
    bool? isLoading,
    String? error,
    bool clearSession = false,
    bool clearError = false,
  }) {
    return AuthState(
      session: clearSession ? null : (session ?? this.session),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class AuthNotifier extends AsyncNotifier<AuthState> {
  late AuthRepository _repo;

  @override
  Future<AuthState> build() async {
    _repo = AuthRepository();
    final session = await _repo.restoreSession();
    return AuthState(session: session);
  }

  Future<void> login(String email, String password) async {
    state = AsyncData(state.value!.copyWith(isLoading: true, clearError: true));
    try {
      final session = await _repo.login(email, password);
      state = AsyncData(AuthState(session: session));
    } on AuthException catch (e) {
      state = AsyncData(state.value!.copyWith(
        isLoading: false,
        error: e.message,
      ));
    } catch (e) {
      state = AsyncData(state.value!.copyWith(
        isLoading: false,
        error: "Login failed. Please try again.",
      ));
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncData(AuthState());
  }

  void clearError() {
    if (state.value != null) {
      state = AsyncData(state.value!.copyWith(clearError: true));
    }
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

/// Convenience: current session (null when logged out)
final sessionProvider = Provider<AuthSession?>((ref) {
  return ref.watch(authProvider).value?.session;
});

/// Convenience: current role (null when logged out)
final roleProvider = Provider<UserRole?>((ref) {
  return ref.watch(sessionProvider)?.user.role;
});

/// True while initial session restore is in progress
final authLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isLoading;
});
