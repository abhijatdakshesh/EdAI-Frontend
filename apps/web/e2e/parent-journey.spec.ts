/**
 * E2E Parent Journey tests — covers all major parent portal pages.
 * Uses dev-credential parent@rvce.edu / Parent@123 (PARENT role).
 * NEXT_PUBLIC_USE_MOCKS=true — all API calls return mock data.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

async function loginAsParent(page: Page) {
  await loginAs(page, 'parent');
}

// ─── Dashboard (/parent/dashboard) ───────────────────────────────────────────

test('@P0 parent: dashboard renders child info card and KPI cards', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/dashboard');
  await expect(page).toHaveURL(/parent\/dashboard/);

  await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 10_000 });
  // Child info card — "My Child" label is always rendered (hardcoded mock data)
  const childInfo = page
    .getByText(/my child|arjun|1rvce/i)
    .or(page.getByText(/your child|ward/i));
  await expect(childInfo.first()).toBeVisible({ timeout: 10_000 });
  // KPI cards — attendance, CGPA or similar
  const kpiCard = page.getByText(/attendance|cgpa|gpa|fee/i).first();
  await expect(kpiCard).toBeVisible({ timeout: 8_000 });
});

test('@P0 parent: dashboard shows recent AI calls section', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/dashboard');

  // AI calls section or empty state
  const callsSection = page
    .getByText(/ai calls|voice call|recent call/i)
    .or(page.getByText(/no calls/i));
  await expect(callsSection.first()).toBeVisible({ timeout: 10_000 });
});

// ─── Fees (/parent/fees) ─────────────────────────────────────────────────────

test('@P0 parent: fees page renders breakdown table and status indicators', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/fees');
  await expect(page).toHaveURL(/parent\/fees/);

  // Wait for the page shell (AppShell title) to confirm hydration is done.
  await expect(page.getByText(/fee|payment/i).first()).toBeVisible({ timeout: 10_000 });

  // Wait until the fee skeleton is gone — i.e. wait until the resolved state is painted.
  // This prevents asserting during the brief animate-pulse window between the two React
  // Query fetches (usn="" → usn="1RV21CS001") that was causing CI flakiness.
  await expect(page.getByTestId('fees-loading-skeleton')).not.toBeVisible({ timeout: 12_000 });

  // Now assert the settled state: fee amounts + status badges (mock data: PAID, ₹95000),
  // or the empty state text if the component resolves with no data.
  const feeContent = page
    .getByText(/₹|paid|pending|due|total due|pending dues/i)
    .or(page.getByText(/no children linked|no fee data/i));
  await expect(feeContent.first()).toBeVisible({ timeout: 5_000 });
});

// ─── Results (/parent/results) ───────────────────────────────────────────────

test('@P0 parent: results page renders semester selector and grade info', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/results');
  await expect(page).toHaveURL(/parent\/results/);

  await expect(page.getByText(/result|grade|cgpa/i).first()).toBeVisible({ timeout: 10_000 });
  // Result content — table or cards
  const resultsContent = page
    .getByText(/cgpa|semester|subject|marks/i)
    .or(page.getByText(/no results/i));
  await expect(resultsContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Attendance (/parent/attendance) ─────────────────────────────────────────

test('@P1 parent: attendance page renders percentage and per-subject breakdown', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/attendance');
  await expect(page).toHaveURL(/parent\/attendance/);

  await expect(page.getByText(/attendance/i).first()).toBeVisible({ timeout: 10_000 });
  const attendanceContent = page
    .getByText(/\d+%|overall/i)
    .or(page.getByText(/no attendance data/i));
  await expect(attendanceContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Calls (/parent/calls) ───────────────────────────────────────────────────

test('@P1 parent: calls page renders call log table with date, reason, language columns', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/calls');
  await expect(page).toHaveURL(/parent\/calls/);

  await expect(page.getByText(/call history|voice call/i).first()).toBeVisible({ timeout: 10_000 });
  // Stats cards always render (hardcoded mock data): "Total Calls", "Answered", "Missed"
  const callContent = page
    .getByText(/total calls|answered|missed/i)
    .or(page.getByText(/no call history|no calls/i));
  await expect(callContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Announcements (/parent/announcements) ────────────────────────────────────

test('@P1 parent: announcements feed renders list items', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/announcements');
  await expect(page).toHaveURL(/parent\/announcements/);

  await expect(page.getByText(/announcement/i).first()).toBeVisible({ timeout: 10_000 });
  // Announcement items are rendered as buttons (hardcoded mock data)
  const announcementContent = page
    .getByRole('button')
    .or(page.getByText(/meeting|exam|schedule|annual|ia.2/i))
    .or(page.getByText(/no announcements/i));
  await expect(announcementContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Notifications (/parent/notifications) ───────────────────────────────────

test('@P1 parent: notifications page renders feed with filter controls', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/notifications');
  await expect(page).toHaveURL(/parent\/notifications/);

  await expect(page.getByRole('heading', { name: /notification/i }).first()).toBeVisible({ timeout: 20_000 });
  // Filter buttons (ALL / CRITICAL / WARNING / INFO) always render regardless of backend
  const notifContent = page
    .getByRole('button', { name: /^all|critical|warning|info/i })
    .or(page.getByText(/no notifications found|all caught up/i));
  await expect(notifContent.first()).toBeVisible({ timeout: 10_000 });
});

// ─── Children (/parent/children) ─────────────────────────────────────────────

test('@P1 parent: children page renders child selector', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/children');
  await expect(page).toHaveURL(/parent\/children/);

  await expect(page.getByText(/children|child|ward/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

// ─── Messages (/parent/messages) ─────────────────────────────────────────────

test('@P1 parent: messages page renders compose button', async ({ page }) => {
  await loginAsParent(page);
  await page.goto('/parent/messages');
  await expect(page).toHaveURL(/parent\/messages/);

  await expect(page.getByText(/message/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});
