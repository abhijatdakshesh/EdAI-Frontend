import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../auth/session_store.dart";

const String _baseUrl = String.fromEnvironment(
  "API_BASE_URL",
  defaultValue: "http://10.0.2.2:3001",
);

// ── Auth Interceptor ──────────────────────────────────────────────────────────
//
// Attaches Bearer token to every request.
// On 401, tries silent refresh — if that also fails, clears session.

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._sessionStore, this._dio);

  final SessionStore _sessionStore;
  final Dio _dio;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final session = await _sessionStore.restore();
    if (session != null) {
      var token = session.accessToken;

      // Proactively refresh if near-expiry
      if (session.isExpired && session.refreshToken.isNotEmpty) {
        token = await _tryRefresh(session.refreshToken) ?? token;
      }

      options.headers["Authorization"] = "Bearer $token";
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      final session = await _sessionStore.restore();
      if (session != null && session.refreshToken.isNotEmpty) {
        final newToken = await _tryRefresh(session.refreshToken);
        if (newToken != null) {
          // Retry the original request with the new token
          final opts = err.requestOptions;
          opts.headers["Authorization"] = "Bearer $newToken";
          try {
            final res = await _dio.fetch<dynamic>(opts);
            return handler.resolve(res);
          } catch (_) {}
        }
      }
      // Refresh failed — clear session so app redirects to login
      await _sessionStore.clear();
    }
    return handler.next(err);
  }

  Future<String?> _tryRefresh(String refreshToken) async {
    try {
      final res = await Dio(BaseOptions(baseUrl: _baseUrl)).post<Map<String, dynamic>>(
        "/api/auth/refresh",
        data: {"refreshToken": refreshToken},
      );
      final data = res.data!;
      final newAccessToken = data["accessToken"] as String;
      final expiresIn = (data["expiresIn"] as num).toInt();
      final session = await _sessionStore.restore();
      if (session != null) {
        await _sessionStore.save(session.copyWith(
          accessToken: newAccessToken,
          accessTokenExpiresAt:
              DateTime.now().millisecondsSinceEpoch + expiresIn * 1000,
        ));
      }
      return newAccessToken;
    } catch (_) {
      return null;
    }
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

final dioProvider = Provider<Dio>((ref) {
  final sessionStore = SessionStore();
  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {"Content-Type": "application/json"},
    ),
  );

  dio.interceptors.addAll([
    _AuthInterceptor(sessionStore, dio),
    LogInterceptor(
      requestBody: false,
      responseBody: false,
      error: true,
    ),
  ]);

  return dio;
});

// ── Generic API error helper ──────────────────────────────────────────────────

String extractApiError(DioException e) {
  try {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data["message"] ?? data["error"];
      if (msg is String) return msg;
    }
  } catch (_) {}
  return e.message ?? "Request failed";
}
