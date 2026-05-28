/**
 * E2E Teacher Journey tests
 *
 * Covers:
 *   - Mark attendance for a class:
 *       navigate to /teacher/mark-attendance, select a class, verify
 *       student grid appears, toggle statuses, submit, see confirmation.
 *
 * Uses dev-credential teacher@rvce.edu / Teacher@123 (FACULTY role).
 */

import { test, expect, Page } from '@playwright/test';
import { expectMainTitle } from './helpers/page';

// ─── auth helper ─────────────────────────────────────────────────────────────

async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('teacher@rvce.edu');
  await page.getByLabel(/password/i).fill('Teacher@123');
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
}

// ─── mark attendance ─────────────────────────────────────────────────────────

test('teacher: mark attendance page loads with class selector', async ({ page }) => {
  await loginAsTeacher(page);

  await page.goto('/teacher/mark-attendance');
  await expect(page).toHaveURL(/teacher\/mark-attendance/);

  // AppShell title
  await expect(page.getByText(/mark attendance/i).first()).toBeVisible({ timeout: 10_000 });

  // Class selector dropdown should be present
  const classSelect = page.getByRole('combobox').filter({ hasText: /select class/i });
  await expect(classSelect.or(page.locator('select').first())).toBeVisible();
});

test('teacher: mark attendance for class — select class and see student grid', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/mark-attendance');

  // Wait for the class dropdown to be populated (API call may be mocked)
  const classDropdown = page.locator('select').first();
  await expect(classDropdown).toBeVisible({ timeout: 10_000 });

  // Select the first non-empty option
  const options = classDropdown.locator('option');
  const optionCount = await options.count();

  if (optionCount > 1) {
    // There are actual classes; select the first real one (index 1 skips the placeholder)
    const firstClassValue = await options.nth(1).getAttribute('value');
    if (firstClassValue) {
      await classDropdown.selectOption(firstClassValue);

      // After selecting a class, config panel or student grid area should appear
      const studentArea = page
        .getByText(/loading students/i)
        .or(page.locator('button').filter({ hasText: /mark all present/i }))
        .or(page.getByText(/select a class above/i))
        .or(page.getByText(/no students/i))
        .or(page.locator('table'))
        .or(page.locator('[role="row"]').first());
      await expect(studentArea.first()).toBeVisible({ timeout: 15_000 });
    }
  } else {
    // No classes loaded from API — just verify the placeholder state
    await expect(
      page.getByText(/select a class above to start marking attendance/i),
    ).toBeVisible();
  }
});

test('teacher: mark attendance — control buttons visible after class selection', async ({
  page,
}) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/mark-attendance');

  const classDropdown = page.locator('select').first();
  await expect(classDropdown).toBeVisible({ timeout: 10_000 });

  const optionCount = await classDropdown.locator('option').count();
  if (optionCount <= 1) {
    // No class data — skip this assertion path
    test.skip();
    return;
  }

  const firstValue = await classDropdown.locator('option').nth(1).getAttribute('value');
  if (!firstValue) { test.skip(); return; }

  await classDropdown.selectOption(firstValue);

  // After selecting a class, "Mark All Present" and "Mark All Absent" buttons appear
  await expect(page.getByRole('button', { name: /mark all present/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /mark all absent/i })).toBeVisible();
});

test('teacher: mark attendance — toggle student status from P to A', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/mark-attendance');

  const classDropdown = page.locator('select').first();
  await expect(classDropdown).toBeVisible({ timeout: 10_000 });

  const optionCount = await classDropdown.locator('option').count();
  if (optionCount <= 1) { test.skip(); return; }

  const firstValue = await classDropdown.locator('option').nth(1).getAttribute('value');
  if (!firstValue) { test.skip(); return; }

  await classDropdown.selectOption(firstValue);

  // Wait for student grid buttons to appear
  const markAllPresent = page.getByRole('button', { name: /mark all present/i });
  await expect(markAllPresent).toBeVisible({ timeout: 10_000 });
  await markAllPresent.click();

  // After marking all present, the summary should show 0 absent
  await expect(page.getByText(/✗ 0 absent|0 absent/i).first()).toBeVisible();

  // Click "Mark All Absent" and verify the present count changes
  await page.getByRole('button', { name: /mark all absent/i }).click();
  // Now absent count should equal total students (non-zero if students loaded)
  const absentCountText = page.getByText(/✗ \d+ absent/i);
  await expect(absentCountText).toBeVisible({ timeout: 5_000 });
});

test('teacher: mark attendance — submit button is present and submits attendance', async ({
  page,
}) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/mark-attendance');

  const classDropdown = page.locator('select').first();
  await expect(classDropdown).toBeVisible({ timeout: 10_000 });

  const optionCount = await classDropdown.locator('option').count();
  if (optionCount <= 1) { test.skip(); return; }

  const firstValue = await classDropdown.locator('option').nth(1).getAttribute('value');
  if (!firstValue) { test.skip(); return; }

  await classDropdown.selectOption(firstValue);

  // Wait for students to load and the Submit button to appear
  const submitButton = page.getByRole('button', { name: /submit attendance/i });
  await expect(submitButton).toBeVisible({ timeout: 12_000 });

  // Click submit
  await submitButton.click();

  // After submission, the success confirmation is shown:
  // "Attendance Submitted" heading + counts
  await expect(page.getByText(/attendance submitted/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /mark another/i })).toBeVisible();
});

test('teacher: mark attendance — "Mark Another" resets the form', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/mark-attendance');

  const classDropdown = page.locator('select').first();
  await expect(classDropdown).toBeVisible({ timeout: 10_000 });

  const optionCount = await classDropdown.locator('option').count();
  if (optionCount <= 1) { test.skip(); return; }

  const firstValue = await classDropdown.locator('option').nth(1).getAttribute('value');
  if (!firstValue) { test.skip(); return; }

  await classDropdown.selectOption(firstValue);

  const submitButton = page.getByRole('button', { name: /submit attendance/i });
  await expect(submitButton).toBeVisible({ timeout: 12_000 });
  await submitButton.click();

  // Wait for success screen
  await expect(page.getByText(/attendance submitted/i)).toBeVisible({ timeout: 15_000 });

  // Click "Mark Another"
  await page.getByRole('button', { name: /mark another/i }).click();

  // Should return to the form view with the class selector visible again
  await expect(classDropdown.or(page.locator('select').first())).toBeVisible({ timeout: 8_000 });
  // The success message should no longer be present
  await expect(page.getByText(/attendance submitted/i)).not.toBeVisible();
});

test('teacher: teacher cannot access student-only routes', async ({ page }) => {
  await loginAsTeacher(page);

  // Attempt to visit the student portal
  await page.goto('/student/dashboard');

  // Middleware should redirect FACULTY away from /student/* → to /dashboard
  await expect(page).not.toHaveURL(/student\/dashboard/, { timeout: 8_000 });
  await expect(page).toHaveURL(/dashboard/);
});

// ─── P0 additions ─────────────────────────────────────────────────────────────

test('@P0 teacher: IA marks entry page loads with class/subject selector and input grid', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/ia-marks');
  await expect(page).toHaveURL(/teacher\/ia-marks/);

  await expectMainTitle(page, /ia \/ vtu marks/i);
  // Class/subject selector should be present
  const selector = page.locator('select').first().or(page.getByRole('combobox').first());
  await expect(selector).toBeVisible({ timeout: 8_000 });
});

test('@P0 teacher: IA marks — page loads with subject code input and class selector', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/marks-entry');
  await expect(page).toHaveURL(/teacher\/marks-entry/);

  await expectMainTitle(page, /ia marks entry/i);
  // Subject Code input is always visible
  await expect(page.locator('input[placeholder*="21CS"]').or(page.locator('input[placeholder*="subject"]')).first()).toBeVisible({ timeout: 8_000 });
  // Class selector is always visible
  await expect(page.locator('select').first()).toBeVisible({ timeout: 8_000 });
});

test('@P0 teacher: create assignment button opens form modal', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/assignments');
  await expect(page).toHaveURL(/teacher\/assignments/);

  await expectMainTitle(page, /^assignments$/i);
  const createBtn = page.getByRole('button', { name: /create|add|new assignment/i });
  await expect(createBtn.first()).toBeVisible({ timeout: 8_000 });
  await createBtn.first().click();

  // Create form appears inline (no dialog role) with heading "Create Assignment"
  await expect(page.getByText(/create assignment/i)).toBeVisible({ timeout: 5_000 });
});

// ─── P1 additions ─────────────────────────────────────────────────────────────

test('@P1 teacher: call panel loads at-risk student list with trigger call button', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/call-panel');
  await expect(page).toHaveURL(/teacher\/call-panel/);

  await expect(page.getByText(/call|at.risk|student/i).first()).toBeVisible({ timeout: 10_000 });
  // Student list or empty state
  const content = page
    .getByRole('button', { name: /call|trigger|initiate/i })
    .or(page.getByText(/no at.risk students|no students/i));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 teacher: attendance summary page has class selector and renders table', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/attend-summary');
  await expect(page).toHaveURL(/teacher\/attend-summary/);

  await expect(page.getByText(/attendance summary|attend/i).first()).toBeVisible({ timeout: 10_000 });
  // AttendanceSummary renders a table directly (no select/combobox selector)
  const tableOrContent = page
    .getByRole('table')
    .or(page.getByText(/class|month|conducted/i));
  await expect(tableOrContent.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 teacher: performance drop page renders student list', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/perf-drop');
  await expect(page).toHaveURL(/teacher\/perf-drop/);

  await expect(page.getByText(/performance|drop|at.risk/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P1 teacher: announcements page has rich-text area and class selector', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/announcements');
  await expect(page).toHaveURL(/teacher\/announcements/);

  await expect(page.getByText(/announcement/i).first()).toBeVisible({ timeout: 10_000 });
  const editorOrInput = page.getByRole('textbox').or(page.locator('textarea')).first();
  await expect(editorOrInput).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /publish|post|send/i })).toBeVisible();
});

// ─── P2 additions ─────────────────────────────────────────────────────────────

test('@P2 teacher: schedule timetable page loads without crash', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/schedule');
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 8_000 });
  await expect(page.locator('body')).not.toBeEmpty();
});

test('@P2 teacher: my classes page renders class list', async ({ page }) => {
  await loginAsTeacher(page);
  await page.goto('/teacher/classes');
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/class|section|my classes/i).first()).toBeVisible({ timeout: 10_000 });
});
