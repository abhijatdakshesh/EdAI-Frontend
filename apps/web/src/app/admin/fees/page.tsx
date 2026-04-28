import { AppShell } from '@/components/layout/shell';
import FeeDashboard from '@/features/fee-reminders/fee-dashboard';

export const metadata = { title: 'Fee Collection Intelligence — EdAI' };

export default function FeesPage() {
  return (
    <AppShell title="Fee Collection Intelligence">
      <FeeDashboard />
    </AppShell>
  );
}
