import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "core/auth/auth_provider.dart";
import "core/auth/session_store.dart";
import "core/router/app_router.dart";
import "features/auth/auth_screen.dart";

void main() {
  runApp(const ProviderScope(child: EdAIApp()));
}

class EdAIApp extends ConsumerWidget {
  const EdAIApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    // Build router — re-evaluated whenever auth state changes
    final router = GoRouter(
      debugLogDiagnostics: false,
      initialLocation: AppRoutes.auth,
      refreshListenable: _AuthChangeNotifier(ref),
      redirect: (context, state) {
        final isLoading = authAsync.isLoading;
        if (isLoading) return null;

        final session = authAsync.value?.session;
        final isAuthenticated = session != null;
        final onAuth = state.matchedLocation.startsWith(AppRoutes.auth);

        if (!isAuthenticated && !onAuth) return AppRoutes.auth;
        if (isAuthenticated && onAuth) return _homeForRole(session.user.role);
        return null;
      },
      routes: _buildRoutes(ref),
    );

    return MaterialApp.router(
      title: "EdAI",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1C1810),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: "Inter",
      ),
      routerConfig: router,
    );
  }

  String _homeForRole(UserRole role) {
    switch (role) {
      case UserRole.admin:
      case UserRole.principal:
      case UserRole.dean:
      case UserRole.trustee:
      case UserRole.hod:
        return AppRoutes.adminDashboard;
      case UserRole.faculty:
      case UserRole.counsellor:
        return AppRoutes.teacherDashboard;
      case UserRole.student:
        return AppRoutes.studentDashboard;
      case UserRole.parent:
        return AppRoutes.parentDashboard;
    }
  }

  List<RouteBase> _buildRoutes(WidgetRef ref) {
    return buildAppRouter(ref).configuration.routes;
  }
}

// Bridges Riverpod auth state changes → GoRouter redirect re-evaluation
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
  }
  final WidgetRef _ref;
}
