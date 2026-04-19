import "package:flutter/material.dart";

import "../../core/data/phase_repository.dart";
import "../../shared/widgets/feature_shell.dart";

class IntegrationsScreen extends StatelessWidget {
  const IntegrationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FeatureShell(
      label: "Integrations",
      title: "SAP and External Integrations",
      description: "Connector state, sync health, retries, and reconciliation checks.",
      actionText: "Run Sync",
      checklist: PhaseRepository.checklistByModule["integrations"]!,
    );
  }
}
