import "package:flutter/material.dart";

import "../../core/theme/raycraft_colors.dart";
import "../../core/theme/raycraft_text_styles.dart";

class FeatureShell extends StatelessWidget {
  const FeatureShell({
    super.key,
    required this.label,
    required this.title,
    required this.description,
    required this.actionText,
    this.checklist = const [],
  });

  final String label;
  final String title;
  final String description;
  final String actionText;
  final List<String> checklist;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(), style: RaycraftTextStyles.label),
              const SizedBox(height: 10),
              Text(title, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 14),
              Text(description, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 20),
              ElevatedButton(onPressed: () {}, child: Text(actionText)),
              if (checklist.isNotEmpty) ...[
                const SizedBox(height: 12),
                for (final item in checklist)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text("• $item", style: RaycraftTextStyles.bodySm),
                  ),
              ],
              const SizedBox(height: 8),
              Text(
                "Status: scaffold complete, integrate APIs next.",
                style: RaycraftTextStyles.bodySm.copyWith(color: RaycraftColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
