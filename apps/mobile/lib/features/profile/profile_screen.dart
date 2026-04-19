import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "../../core/auth/auth_provider.dart";

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final user = session?.user;
    if (user == null) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Center(child: CircleAvatar(
          radius: 48,
          child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : "?", style: const TextStyle(fontSize: 32)),
        )),
        const SizedBox(height: 16),
        Center(child: Text(user.name, style: Theme.of(context).textTheme.headlineSmall)),
        Center(child: Text(user.role.label, style: TextStyle(color: Colors.grey.shade600))),
        const SizedBox(height: 24),
        Card(child: Column(children: [
          ListTile(leading: const Icon(Icons.email_outlined), title: Text(user.email)),
          ListTile(leading: const Icon(Icons.badge_outlined), title: Text(user.sapId ?? "—"), subtitle: const Text("SAP ID")),
          ListTile(leading: const Icon(Icons.business_outlined), title: Text(user.institutionId)),
          ListTile(leading: const Icon(Icons.language_outlined), title: Text(user.preferredLanguage.toUpperCase()), subtitle: const Text("Language")),
        ])),
        const SizedBox(height: 24),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text("Logout"),
          onTap: () => ref.read(authProvider.notifier).logout(),
        ),
      ],
    );
  }
}
