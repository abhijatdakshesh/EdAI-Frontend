import { AppShell } from "@/components/layout/shell";
import TransportManagement from "@/features/admin/transport-management";

export const metadata = { title: "Transport Management — Ed8AI" };

export default function AdminTransportPage() {
  return (
    <AppShell title="Transport Management">
      <TransportManagement />
    </AppShell>
  );
}
