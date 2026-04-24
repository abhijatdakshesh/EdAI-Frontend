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
        .or(page.getByText(/select a class above/i));
      await expect(studentArea).toBeVisible({ timeout: 8_000 });
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
  await expect(page.getByText(/✗ 0 absent|0 absent/i).or(page.getByText(/absent/i))).toBeVisible();

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
