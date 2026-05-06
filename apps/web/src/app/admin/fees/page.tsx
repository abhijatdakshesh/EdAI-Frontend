import { AppShell } from '@/components/layout/shell';
import FeeDashboard from '@/features/fee-reminders/fee-dashboard';

export const metadata = { title: 'Fee Collection Intelligence — Ed8AI' };

export default function FeesPage() {
  return (
    <AppShell title="Fee Collection Intelligence">
      <FeeDashboard />
    </AppShell>
  );
}
