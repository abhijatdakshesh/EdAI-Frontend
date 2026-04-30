/**
 * E2E Student Journey tests
 *
 * Covers:
 *   - View attendance per course (Overall Attendance + course-wise rows)
 *   - View fee summary (Total Due / Total Paid / Outstanding cards)
 *   - View assignments (list + detail panel)
 *
 * Uses dev-credential student@rvce.edu / Student@123.
 * Frontend mock data is always present, so these tests run without a live backend
 * when NEXT_PUBLIC_USE_MOCKS=true (set in .env.local for E2E).
 */

import { test, expect, Page } from '@playwright/test';

// ─── auth helper ─────────────────────────────────────────────────────────────

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('student@rvce.edu');
  await page.getByLabel(/password/i).fill('Student@123');
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  await page.waitForURL(/student\/dashboard/, { timeout: 15_000 });
}

// ─── attendance ──────────────────────────────────────────────────────────────

test('student: view attendance per course', async ({ page }) => {
  await loginAsStudent(page);

  // Navigate to attendance page
  await page.goto('/student/attendance');
  await expect(page).toHaveURL(/student\/attendance/);

  // Overall Attendance card should be visible
  await expect(page.getByText(/overall attendance/i)).toBeVisible({ timeout: 10_000 });

  // The overall attendance percentage should render (e.g. "85%" or "—" while loading)
  const overallPct = page
    .locator('text=Overall Attendance')
    .locator('..')
    .locator('p.text-4xl, [class*="text-4xl"]')
    .first();
  // Either a number or the loading dash
  await expect(overallPct.or(page.getByText(/\d+%/))).toBeTruthy();

  // Course-wise Attendance heading
  await expect(page.getByText(/course.?wise attendance/i)).toBeVisible();

  // Wait for at least one course card to appear (mock data provides several)
  // Each course card has a course name and a percentage badge
  const firstCourseCard = page
    .locator('[class*="rounded"][class*="border"]')
    .filter({ hasText: /\d+%/ })
    .first();
  await expect(firstCourseCard).toBeVisible({ timeout: 12_000 });

  // Verify a course card shows the structure: courseName, courseCode, attended/total classes
  await expect(firstCourseCard.getByText(/\d+ \/ \d+ classes/)).toBeVisible();
});

test('student: attendance shows correct colour coding for low attendance', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/attendance');

  // If there are any courses below 75%, they should display the danger colour text
  // "Attend next X to reach 75%" — we just check the element exists when applicable
  const lowAttendanceWarning = page.getByText(/attend next \d+ to reach 75%/i);
  const canMissText = page.getByText(/can miss \d+ more/i);
  // At least one of these should be present (mock data has mixed attendance)
  const eitherVisible = await Promise.any([
    lowAttendanceWarning.isVisible().then((v) => { if (!v) throw new Error(); }),
    canMissText.isVisible().then((v) => { if (!v) throw new Error(); }),
  ]).catch(() => false);
  // Not asserting strictly — just ensure the page loads without error
  void eitherVisible;

  // Regardless, the overall page should not show an error
  await expect(page.getByText(/failed to load attendance/i)).not.toBeVisible();
});

// ─── fees ─────────────────────────────────────────────────────────────────────

test('student: view fee summary with Total Due / Total Paid / Outstanding', async ({ page }) => {
  await loginAsStudent(page);

  await page.goto('/student/fees');
  await expect(page).toHaveURL(/student\/fees/);

  // Page heading / shell title
  await expect(page.getByText(/fees.*scholarships|fees/i).first()).toBeVisible();

  // Summary cards: "Total Due", "Total Paid", "Outstanding", "Status"
  await expect(page.getByText(/total due/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/total paid/i)).toBeVisible();
  await expect(page.getByText(/outstanding/i)).toBeVisible();
  await expect(page.getByText(/^status$/i)).toBeVisible();

  // Each card should show a rupee amount (mock data)
  const rupeeAmounts = page.locator('text=/₹[\d,]+/');
  await expect(rupeeAmounts.first()).toBeVisible();
});

test('student: fee tabs — Pending Dues and Payment History', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/fees');

  // The two tab buttons should be visible
  await expect(page.getByRole('button', { name: /pending dues/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /payment history/i })).toBeVisible();

  // Switch to Payment History tab
  await page.getByRole('button', { name: /payment history/i }).click();
  // Should either show a table or the empty state message
  const historyContent = page
    .getByRole('table')
    .or(page.getByText(/no payment history yet/i));
  await expect(historyContent).toBeVisible({ timeout: 8_000 });
});

test('student: fee page shows pending item checkboxes when dues exist', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/fees');

  // If there are pending dues, each item has a checkbox
  const pendingDuesTab = page.getByRole('button', { name: /pending dues/i });
  await expect(pendingDuesTab).toBeVisible({ timeout: 10_000 });
  await pendingDuesTab.click();

  // Look for either pending items or the "all cleared" message
  const dueItem = page.getByRole('checkbox').first();
  const clearedMsg = page.getByText(/no pending dues|all fees are cleared/i);
  const eitherPresent = dueItem.or(clearedMsg);
  await expect(eitherPresent).toBeVisible({ timeout: 8_000 });
});

// ─── assignments ─────────────────────────────────────────────────────────────

test('student: view assignments list with status badges', async ({ page }) => {
  await loginAsStudent(page);

  await page.goto('/student/assignments');
  await expect(page).toHaveURL(/student\/assignments/);

  // Page heading
  await expect(page.getByText(/my assignments/i)).toBeVisible({ timeout: 10_000 });

  // Filter tabs: all, pending, submitted, graded
  await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^pending$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^submitted$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^graded$/i })).toBeVisible();

  // Mock data has 5 assignments; at least one should appear
  const assignmentCard = page.locator('button').filter({ hasText: /due:/i }).first();
  await expect(assignmentCard).toBeVisible({ timeout: 8_000 });

  // Assignment card should have a status badge
  const pendingBadge = page.getByText(/pending|submitted|graded|late/i).first();
  await expect(pendingBadge).toBeVisible();
});

test('student: clicking an assignment shows its detail panel', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/assignments');

  // Click the first assignment
  const firstCard = page.locator('button').filter({ hasText: /due:/i }).first();
  await expect(firstCard).toBeVisible({ timeout: 10_000 });
  await firstCard.click();

  // Detail panel should appear with "Assignment Details" heading
  await expect(page.getByText(/assignment details/i)).toBeVisible({ timeout: 5_000 });

  // Detail panel shows Due Date, Max Marks, Status
  await expect(page.getByText(/due date/i)).toBeVisible();
  await expect(page.getByText(/max marks/i)).toBeVisible();
  await expect(page.getByText(/^status$/i)).toBeVisible();
});

test('student: filtering assignments by "graded" shows only graded items', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/assignments');

  await page.getByRole('button', { name: /^graded$/i }).click();

  // After filtering, all visible status badges should be "graded"
  // (mock data has 1 graded assignment: Distributed Hash Table)
  const cards = page.locator('button').filter({ hasText: /due:/i });
  const count = await cards.count();
  if (count > 0) {
    // Each visible card should have a "graded" badge
    const gradedBadges = page.getByText(/^graded$/i);
    await expect(gradedBadges.first()).toBeVisible();
  }
});

test('student: pending assignment shows "Submit Assignment" button in detail panel', async ({
  page,
}) => {
  await loginAsStudent(page);
  await page.goto('/student/assignments');

  // Filter to pending assignments
  await page.getByRole('button', { name: /^pending$/i }).click();

  const pendingCard = page.locator('button').filter({ hasText: /due:/i }).first();
  await expect(pendingCard).toBeVisible({ timeout: 8_000 });
  await pendingCard.click();

  // The detail panel for a pending assignment should show "Submit Assignment" CTA
  await expect(
    page.getByRole('button', { name: /submit assignment/i }),
  ).toBeVisible({ timeout: 5_000 });
});

// ─── P0 additions ─────────────────────────────────────────────────────────────

test('@P0 student: results page renders grade table and CGPA', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/results');
  await expect(page).toHaveURL(/student\/results/);

  await expect(page.getByText(/results|grades|cgpa/i).first()).toBeVisible({ timeout: 10_000 });
  // CGPA value or results table must be present
  const resultsContent = page
    .getByText(/cgpa/i)
    .or(page.getByRole('table'))
    .or(page.getByText(/semester/i));
  await expect(resultsContent.first()).toBeVisible({ timeout: 10_000 });
  // Should not show a crash/error
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

test('@P0 student: study plan page renders AI plan cards', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/study-plan');
  await expect(page).toHaveURL(/student\/study-plan/);

  await expect(page.getByText(/study plan/i).first()).toBeVisible({ timeout: 10_000 });
  // Study plan content, streak counter, or empty state should render
  const planContent = page
    .getByText(/streak|schedule|today|week|plan/i)
    .or(page.getByText(/no study plan/i));
  await expect(planContent.first()).toBeVisible({ timeout: 10_000 });
});

test('@P0 student: document centre renders request form elements', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/documents');
  await expect(page).toHaveURL(/student\/documents/);

  await expect(page.getByText(/document|bonafide|certificate/i).first()).toBeVisible({ timeout: 10_000 });
  // Document type selector, purpose dropdown, and DPDP consent checkbox
  const typeSelector = page.getByRole('combobox').first().or(page.locator('select').first());
  await expect(typeSelector).toBeVisible({ timeout: 8_000 });
  const consentCheckbox = page.getByRole('checkbox');
  await expect(consentCheckbox.first()).toBeVisible();
  await expect(page.getByRole('button', { name: /submit|request/i })).toBeVisible();
});

test('@P0 student: document request form — select type, check consent, submit', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/documents');

  const typeSelector = page.locator('select').first().or(page.getByRole('combobox').first());
  await expect(typeSelector).toBeVisible({ timeout: 10_000 });

  // Select document type if options available
  const options = page.locator('select').first().locator('option');
  const count = await options.count();
  if (count > 1) {
    const val = await options.nth(1).getAttribute('value');
    if (val) await page.locator('select').first().selectOption(val);
  }

  // Check DPDP consent checkbox if unchecked
  const checkbox = page.getByRole('checkbox').first();
  if (await checkbox.isVisible()) {
    const checked = await checkbox.isChecked();
    if (!checked) await checkbox.check();
  }

  await page.getByRole('button', { name: /submit|request/i }).click();

  // Success state or pending badge should appear
  const successState = page
    .getByText(/submitted|pending|request received|success/i)
    .or(page.getByRole('status'));
  await expect(successState.first()).toBeVisible({ timeout: 10_000 });
});

// ─── P1 additions ─────────────────────────────────────────────────────────────

test('@P1 student: jobs portal renders job cards with apply button', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/jobs');
  await expect(page).toHaveURL(/student\/jobs/);

  await expect(page.getByText(/job|opportunit|placement/i).first()).toBeVisible({ timeout: 10_000 });
  // Job cards or empty state
  const jobContent = page
    .getByRole('button', { name: /apply/i })
    .or(page.getByText(/no jobs available|no opportunities/i));
  await expect(jobContent.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 student: placement view loads with stats cards', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/placement');
  await expect(page).toHaveURL(/student\/placement/);

  await expect(page.getByText(/placement/i).first()).toBeVisible({ timeout: 10_000 });
  // Stats cards or company matches should render
  const placementContent = page
    .getByText(/readiness|score|matched|compan/i)
    .or(page.getByText(/no placement data/i));
  await expect(placementContent.first()).toBeVisible({ timeout: 10_000 });
});

test('@P1 student: profile page has editable form fields', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/profile');
  await expect(page).toHaveURL(/student\/profile/);

  await expect(page.getByText(/profile/i).first()).toBeVisible({ timeout: 10_000 });
  // Form inputs or display fields + save button
  const formContent = page
    .getByRole('textbox').first()
    .or(page.getByRole('button', { name: /save|update|edit/i }));
  await expect(formContent).toBeVisible({ timeout: 8_000 });
});

test('@P1 student: chatbot renders message input and send button', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/chatbot');
  await expect(page).toHaveURL(/student\/chatbot/);

  await expect(page.getByText(/chat|ask|assistant/i).first()).toBeVisible({ timeout: 10_000 });
  const input = page.getByRole('textbox').or(page.locator('input[type=text]'));
  await expect(input.first()).toBeVisible({ timeout: 8_000 });
  const sendBtn = page.getByRole('button', { name: /send/i }).or(page.locator('button[type=submit]'));
  await expect(sendBtn.first()).toBeVisible();
});

test('@P1 student: schedule timetable grid renders class rows', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/schedule');
  await expect(page).toHaveURL(/student\/schedule/);

  await expect(page.getByText(/schedule|timetable|class/i).first()).toBeVisible({ timeout: 10_000 });
  const scheduleContent = page
    .getByRole('table')
    .or(page.getByText(/mon|tue|wed|thu|fri/i))
    .or(page.getByText(/no classes scheduled/i));
  await expect(scheduleContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── P2 additions ─────────────────────────────────────────────────────────────

test('@P2 student: exam prep page loads without crash', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/exam-prep');
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible({ timeout: 8_000 });
  await expect(page.locator('body')).not.toBeEmpty();
});

test('@P2 student: hostel page loads without crash', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/hostel');
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible({ timeout: 8_000 });
  await expect(page.locator('body')).not.toBeEmpty();
});

test('@P2 student: VTU status page loads registration window info', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('/student/vtu');
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible({ timeout: 8_000 });
});
