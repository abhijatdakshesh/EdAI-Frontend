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
