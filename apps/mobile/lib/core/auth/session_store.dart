import "package:flutter_secure_storage/flutter_secure_storage.dart";
import "dart:convert";

// ── User roles ──────────────────────────────────────────────────────────────

enum UserRole {
  admin,
  faculty,
  hod,
  dean,
  principal,
  trustee,
  counsellor,
  student,
  parent;

  /// Convert the backend string (e.g. "FACULTY") to enum.
  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (r) => r.name.toUpperCase() == value.toUpperCase(),
      orElse: () => UserRole.student,
    );
  }

  /// Human-readable display label.
  String get label {
    const labels = {
      UserRole.admin: "Admin",
      UserRole.faculty: "Faculty",
      UserRole.hod: "HoD",
      UserRole.dean: "Dean",
      UserRole.principal: "Principal",
      UserRole.trustee: "Trustee",
      UserRole.counsellor: "Counsellor",
      UserRole.student: "Student",
      UserRole.parent: "Parent",
    };
    return labels[this] ?? name;
  }
}

// ── User profile ─────────────────────────────────────────────────────────────

class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.institutionId,
    required this.preferredLanguage,
    this.sapId,
  });

  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String institutionId;
  final String preferredLanguage;
  final String? sapId;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json["id"] as String,
      name: json["name"] as String,
      email: json["email"] as String,
      role: UserRole.fromString(json["role"] as String),
      institutionId: json["institutionId"] as String,
      preferredLanguage: (json["preferredLanguage"] as String?) ?? "en",
      sapId: json["sapId"] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "email": email,
        "role": role.name.toUpperCase(),
        "institutionId": institutionId,
        "preferredLanguage": preferredLanguage,
        if (sapId != null) "sapId": sapId,
      };
}

// ── Auth session ──────────────────────────────────────────────────────────────

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.accessTokenExpiresAt,
  });

  final UserProfile user;
  final String accessToken;
  final String refreshToken;

  /// Unix timestamp in milliseconds when the access token expires.
  final int accessTokenExpiresAt;

  /// True if the access token is expired or expires within the next 30 s.
  bool get isExpired =>
      DateTime.now().millisecondsSinceEpoch >= accessTokenExpiresAt - 30000;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      user: UserProfile.fromJson(json["user"] as Map<String, dynamic>),
      accessToken: json["accessToken"] as String,
      refreshToken: json["refreshToken"] as String,
      accessTokenExpiresAt: json["accessTokenExpiresAt"] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        "user": user.toJson(),
        "accessToken": accessToken,
        "refreshToken": refreshToken,
        "accessTokenExpiresAt": accessTokenExpiresAt,
      };

  AuthSession copyWith({
    String? accessToken,
    String? refreshToken,
    int? accessTokenExpiresAt,
  }) =>
      AuthSession(
        user: user,
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        accessTokenExpiresAt:
            accessTokenExpiresAt ?? this.accessTokenExpiresAt,
      );
}

// ── Session store ─────────────────────────────────────────────────────────────
// Uses flutter_secure_storage so tokens are kept in the device keychain /
// Android EncryptedSharedPreferences — never in plain SharedPreferences.

class SessionStore {
  static const _sessionKey = "rv.auth.session";

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  Future<AuthSession?> restore() async {
    final raw = await _storage.read(key: _sessionKey);
    if (raw == null) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return AuthSession.fromJson(json);
    } catch (_) {
      await clear(); // corrupt data — clear and force re-login
      return null;
    }
  }

  Future<void> save(AuthSession session) async {
    await _storage.write(
      key: _sessionKey,
      value: jsonEncode(session.toJson()),
    );
  }

  Future<void> clear() async {
    await _storage.delete(key: _sessionKey);
  }
}
