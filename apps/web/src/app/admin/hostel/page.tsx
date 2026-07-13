import { AppShell } from "@/components/layout/shell";
import HostelManagement from "@/features/admin/hostel-management";

export const metadata = { title: "Hostel Management — Ed8AI" };

export default function AdminHostelPage() {
  return (
    <AppShell title="Hostel Management">
      <HostelManagement />
    </AppShell>
  );
}
