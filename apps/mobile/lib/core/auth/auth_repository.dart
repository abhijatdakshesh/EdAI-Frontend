import "package:dio/dio.dart";
import "session_store.dart";

const String _baseUrl = String.fromEnvironment(
  "API_BASE_URL",
  defaultValue: "http://10.0.2.2:3001",
);

/// All authentication operations for the mobile app.
///
/// Usage (inside a StatefulWidget or Riverpod provider):
///   final repo = AuthRepository();
///   final session = await repo.login("teacher@rvce.edu", "Teacher@123");
class AuthRepository {
  AuthRepository({
    SessionStore? sessionStore,
    Dio? dio,
  })  : _sessionStore = sessionStore ?? SessionStore(),
        _dio = dio ??
            Dio(BaseOptions(
              baseUrl: _baseUrl,
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 30),
              headers: {"Content-Type": "application/json"},
            ));

  final SessionStore _sessionStore;
  final Dio _dio;

  // ── Login ──────────────────────────────────────────────────────────────────

  /// Calls POST /api/auth/login, persists the session, and returns it.
  Future<AuthSession> login(String email, String password) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        "/api/auth/login",
        data: {"email": email, "password": password},
      );

      final data = res.data!;
      final session = AuthSession(
        user: UserProfile.fromJson(data["user"] as Map<String, dynamic>),
        accessToken: data["accessToken"] as String,
        refreshToken: data["refreshToken"] as String,
        accessTokenExpiresAt:
            DateTime.now().millisecondsSinceEpoch +
                (data["expiresIn"] as int) * 1000,
      );

      await _sessionStore.save(session);
      return session;
    } on DioException catch (e) {
      final msg = _extractMessage(e) ?? "Invalid credentials";
      throw AuthException(msg);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  /// Invalidates the refresh token on the server, then clears local session.
  Future<void> logout() async {
    final session = await _sessionStore.restore();
    if (session != null) {
      try {
        await _dio.post<void>(
          "/api/auth/logout",
          data: {"refreshToken": session.refreshToken},
        );
      } catch (_) {
        // Best-effort — always clear local session even if server call fails
      }
    }
    await _sessionStore.clear();
  }

  // ── Restore session ────────────────────────────────────────────────────────

  /// Returns the persisted session, or null if not logged in.
  Future<AuthSession?> restoreSession() => _sessionStore.restore();

  // ── Private helpers ────────────────────────────────────────────────────────

  String? _extractMessage(DioException e) {
    try {
      final data = e.response?.data;
      if (data is Map) return data["message"] as String?;
    } catch (_) {}
    return null;
  }
}

// ── AuthException ──────────────────────────────────────────────────────────────

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => "AuthException: $message";
}
