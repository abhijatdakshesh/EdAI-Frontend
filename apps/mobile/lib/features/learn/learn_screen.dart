import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/dio_client.dart';

final _learnCoursesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get<Map<String, dynamic>>('/api/student/learn/courses');
  final list = res.data?['courses'] as List<dynamic>? ?? [];
  return list
      .cast<Map<String, dynamic>>()
      .where((c) => c['hasLms'] == true)
      .toList();
});

class LearnScreen extends ConsumerWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(_learnCoursesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Learn')),
      body: coursesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (courses) {
          if (courses.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No LMS courses enrolled. Use the web app to start learning.'),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: courses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final c = courses[i];
              final code = c['code'] as String? ?? '';
              final name = c['name'] as String? ?? code;
              final path = c['learnUrl'] as String? ?? '/student/learn/$code';
              return Card(
                child: ListTile(
                  title: Text(name),
                  subtitle: Text(code),
                  trailing: const Icon(Icons.open_in_browser),
                  onTap: () {
                    final uri = Uri.parse('http://localhost:3000$path');
                    launchUrl(uri, mode: LaunchMode.externalApplication);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
