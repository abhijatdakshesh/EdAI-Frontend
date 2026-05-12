import { AppShell } from "@/components/layout/shell";

export const metadata = { title: "Student Feedback — Ed8AI" };

/**
 * Stu_01_04 — placeholder destination for the VTU "Student Feedback"
 * notification. The full feedback workflow (course feedback, faculty
 * rating, anonymous channel) will land in a follow-up sprint; until
 * then this page gives users an actionable landing instead of a 404.
 */
export default function StudentFeedbackPage() {
  return (
    <AppShell title="Student Feedback">
      <div className="grid gap-5">
        <div className="rounded border border-border bg-surface p-6">
          <p className="label-track">Course & Faculty Feedback</p>
          <h2 className="mt-2 text-xl font-medium">Feedback window opens at the end of each semester</h2>
          <p className="mt-2 text-sm text-text-muted">
            VTU mandates anonymous course-feedback submissions before exam admit cards
            are released. Once your department opens the cycle, it will appear here
            with the list of subjects and faculty awaiting your response.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Open Forms", value: "0" },
            { label: "Submitted", value: "0" },
            { label: "Cycle Status", value: "Closed" },
          ].map((s) => (
            <div key={s.label} className="rounded border border-border bg-surface p-4">
              <p className="label-track">{s.label}</p>
              <p className="mt-1 text-2xl font-light">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded border border-dashed border-border p-8 text-center text-sm text-text-muted">
          No feedback forms are open right now. You will be notified when the next cycle starts.
        </div>
      </div>
    </AppShell>
  );
}
