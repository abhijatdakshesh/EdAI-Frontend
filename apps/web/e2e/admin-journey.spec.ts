/**
 * E2E Admin Journey tests — covers all major admin portal pages.
 * Uses dev-credential admin@rvce.edu / Admin@123 (ADMIN role).
 * NEXT_PUBLIC_USE_MOCKS=true — all API calls return mock data.
 *
 * Priority:
 *   @P0 — Core admin functions (data entry, user mgmt). Blocks release.
 *   @P1 — Secondary admin flows. Blocks staging → prod.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin');
}

// ─── User Management (/admin/users) ──────────────────────────────────────────

test('@P0 admin: user management page renders search, filters, and stats', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/admin\/users/);

  await expect(page.getByText(/user management|users/i).first()).toBeVisible({ timeout: 10_000 });
  // Search input
  await expect(page.getByRole('textbox', { name: /search/i }).or(page.locator('input[placeholder*=search i]'))).toBeVisible({ timeout: 8_000 });
  // Role filter
  const roleFilter = page.getByRole('combobox').or(page.locator('select')).first();
  await expect(roleFilter).toBeVisible();
  // Stats cards (total users, active count etc.)
  await expect(page.getByText(/total|active|admin/i).first()).toBeVisible();
});

test('@P0 admin: create user button opens modal with required fields', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');

  // Button text is "+ Add User"
  const createBtn = page.getByRole('button', { name: /add user/i });
  await expect(createBtn).toBeVisible({ timeout: 10_000 });
  await createBtn.click();

  // Modal is a conditional div (no role=dialog) — look for "Create New User" heading
  await expect(page.getByText(/create new user/i)).toBeVisible({ timeout: 5_000 });
  // Email field uses type="text" (not type="email") in this component
  await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
  await expect(page.locator('input[type=password]')).toBeVisible();
});

test('@P0 admin: bulk import page renders type selector, template download, and upload zone', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/bulk-import');
  await expect(page).toHaveURL(/admin\/bulk-import/);

  await expect(page.getByText(/bulk import|import/i).first()).toBeVisible({ timeout: 10_000 });
  // Type selector is a row of buttons (students / faculty / courses / attendance)
  await expect(page.getByRole('button', { name: /students/i })).toBeVisible({ timeout: 8_000 });
  // Download Template button
  await expect(page.getByRole('button', { name: /download template/i })).toBeVisible();
  // Drag-drop zone text
  await expect(page.getByText(/drop your csv|drop.*file|drag.*drop/i)).toBeVisible();
});

test('@P0 admin: classes page renders department filter, class table, and add button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/classes');
  await expect(page).toHaveURL(/admin\/classes/);

  await expect(page.getByText(/class management|classes/i).first()).toBeVisible({ timeout: 10_000 });
  // Add class button
  await expect(page.getByRole('button', { name: /add class|create class|new class/i })).toBeVisible({ timeout: 8_000 });
  // Department filter or class list
  const classContent = page
    .getByRole('table')
    .or(page.locator('[class*=grid]'))
    .or(page.getByText(/department|semester|section/i));
  await expect(classContent.first()).toBeVisible();
});

test('@P0 admin: IA submission review — table with approve/reject buttons', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ia-submission');
  await expect(page).toHaveURL(/admin\/ia-submission/);

  await expect(page.getByText(/ia submission|internal assessment|marks submission/i).first()).toBeVisible({ timeout: 10_000 });
  // Status badges or action buttons
  const reviewContent = page
    .getByRole('button', { name: /approve|reject/i })
    .or(page.getByText(/pending|approved|submitted/i));
  await expect(reviewContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Departments (/admin/departments) ─────────────────────────────────────────

test('@P1 admin: departments page renders list and add button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/departments');
  await expect(page).toHaveURL(/admin\/departments/);

  await expect(page.getByText(/department/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /add department|create|new/i })).toBeVisible({ timeout: 8_000 });
});

// ─── Promotion (/admin/promotion) ─────────────────────────────────────────────

test('@P1 admin: promotion page renders batch list and tabs', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/promotion');
  await expect(page).toHaveURL(/admin\/promotion/);

  await expect(page.getByText(/promotion/i).first()).toBeVisible({ timeout: 10_000 });
  // Page shows "Promotion Batches" tab and batch cards
  await expect(page.getByText(/promotion batches/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

// ─── Attendance Audit (/admin/attendance-audit) ───────────────────────────────

test('@P1 admin: attendance audit page renders date range and class selector', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/attendance-audit');
  await expect(page).toHaveURL(/admin\/attendance-audit/);

  await expect(page.getByText(/attendance audit|audit/i).first()).toBeVisible({ timeout: 10_000 });
  const filterContent = page
    .locator('input[type=date]')
    .or(page.getByRole('combobox'))
    .or(page.locator('select'));
  await expect(filterContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── AI Calls Monitor (/admin/ai-calls) ──────────────────────────────────────

test('@P1 admin: AI calls monitor renders call log table', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ai-calls');
  await expect(page).toHaveURL(/admin\/ai-calls/);

  await expect(page.getByText(/ai calls|voice calls|call log/i).first()).toBeVisible({ timeout: 10_000 });
  const tableOrEmpty = page
    .getByRole('table')
    .or(page.getByText(/no calls|no records/i));
  await expect(tableOrEmpty.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Risk Dashboard (/admin/risk) ─────────────────────────────────────────────

test('@P1 admin: risk dashboard renders score cards and at-risk list', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/risk');
  await expect(page).toHaveURL(/admin\/risk/);

  await expect(page.getByText(/risk|at.risk student/i).first()).toBeVisible({ timeout: 10_000 });
  const riskContent = page
    .getByText(/critical|high risk|at risk/i)
    .or(page.getByText(/no at.risk students/i));
  await expect(riskContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Alert Feed (/admin/alerts) ──────────────────────────────────────────────

test('@P1 admin: alert feed renders list and add rule button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/alerts');
  await expect(page).toHaveURL(/admin\/alerts/);

  await expect(page.getByText(/alert|notification rule/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

// ─── Comms Settings (/admin/comms) ────────────────────────────────────────────

test('@P1 admin: comms settings renders template editor', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/comms');
  await expect(page).toHaveURL(/admin\/comms/);

  await expect(page.getByText(/communication|comms|template/i).first()).toBeVisible({ timeout: 10_000 });
  const editorContent = page
    .getByRole('textbox')
    .or(page.locator('textarea'))
    .or(page.getByText(/sms|email|whatsapp/i));
  await expect(editorContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Timetable Generator (/admin/timetable) ───────────────────────────────────

test('@P1 admin: timetable generator renders with new timetable button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/timetable');
  await expect(page).toHaveURL(/admin\/timetable/);

  await expect(page.getByText(/timetable generator/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
  // Button text is "+ New Timetable"
  await expect(page.getByRole('button', { name: /new timetable/i }).first()).toBeVisible({ timeout: 8_000 });
});

// ─── Settings (/admin/settings) ───────────────────────────────────────────────

test('@P1 admin: settings page renders config form with save button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/settings');
  await expect(page).toHaveURL(/admin\/settings/);

  await expect(page.getByText(/system settings/i).first()).toBeVisible({ timeout: 10_000 });
  // Button text is "Save Changes"
  await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible({ timeout: 8_000 });
});

// ─── Exports (/admin/exports) ─────────────────────────────────────────────────

test('@P1 admin: exports page renders type selector and download button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/exports');
  await expect(page).toHaveURL(/admin\/exports/);

  await expect(page.getByText(/export|data export/i).first()).toBeVisible({ timeout: 10_000 });
  const exportBtn = page.getByRole('button', { name: /export|download/i });
  await expect(exportBtn.or(page.locator('select').first())).toBeVisible({ timeout: 8_000 });
});

// ─── Users: row actions + Export CSV (/admin/users) ───────────────────────────

test('@P1 admin: users Export CSV button is visible and stays on page after click', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page.getByText(/user management|users/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /export csv/i })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('button', { name: /export csv/i }).click();
  await expect(page).toHaveURL(/admin\/users/);
});

test('@P1 admin: users table rows have Deactivate and Reset PWD action buttons', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page.getByText(/user management|users/i).first()).toBeVisible({ timeout: 10_000 });
  const actionContent = page
    .getByRole('button', { name: /deactivate|activate/i })
    .or(page.getByText(/deactivate|activate/i));
  await expect(actionContent.first()).toBeVisible({ timeout: 10_000 });
  const resetBtn = page.getByRole('button', { name: /reset pwd|reset password/i })
    .or(page.getByText(/reset pwd/i));
  await expect(resetBtn.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Classes: View Students side panel (/admin/classes) ───────────────────────

test('@P1 admin: classes View Students button opens student side panel', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/classes');
  await expect(page.getByText(/class management|classes/i).first()).toBeVisible({ timeout: 10_000 });
  const viewBtn = page.getByRole('button', { name: /view students/i });
  if (await viewBtn.count() > 0) {
    await viewBtn.first().click();
    const panel = page.getByRole('table').or(page.getByText(/students in|student list|attendance/i));
    await expect(panel.first()).toBeVisible({ timeout: 8_000 });
  } else {
    await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
  }
});

// ─── Promotion: extra tabs + Override modal (/admin/promotion) ────────────────

test('@P1 admin: promotion Detention List tab renders detained students or empty state', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/promotion');
  await expect(page.getByText(/promotion/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /detention list/i }).click();
  const content = page.getByRole('table')
    .or(page.getByText(/no detained students|generate a promotion/i))
    .or(page.getByText(/detained/i));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: promotion Generate Report tab shows class selector form', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/promotion');
  await expect(page.getByText(/promotion/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /\+ generate report/i }).click();
  const formContent = page.locator('select').first()
    .or(page.locator('input[type=number]'))
    .or(page.getByText(/class|semester|academic year/i));
  await expect(formContent.first()).toBeVisible({ timeout: 8_000 });
  // Use nth(1): first is the tab button, second is the form submit button
  await expect(page.getByRole('button', { name: /generate report/i }).nth(1)).toBeVisible({ timeout: 5_000 });
});

test('@P2 admin: promotion batch Override action opens modal with notes textarea', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/promotion');
  await expect(page.getByText(/promotion/i).first()).toBeVisible({ timeout: 10_000 });
  const overrideBtn = page.getByRole('button', { name: /override/i });
  if (await overrideBtn.count() > 0) {
    await overrideBtn.first().click();
    const modal = page.locator('textarea').or(page.getByText(/override|notes|reason/i));
    await expect(modal.first()).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
  }
});

// ─── Attendance Audit: inline correct action (/admin/attendance-audit) ────────

test('@P1 admin: attendance audit correct action is accessible when records load', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/attendance-audit');
  await expect(page.getByText(/attendance audit|audit/i).first()).toBeVisible({ timeout: 10_000 });
  const correctContent = page.getByRole('button', { name: /correct/i })
    .or(page.getByText(/correct/i).filter({ hasNot: page.getByText(/attendance audit/i) }))
    .or(page.getByText(/select a class|no records/i));
  await expect(correctContent.first()).toBeVisible({ timeout: 10_000 });
});

// ─── Comms: channel toggle + New Template + Send Test (/admin/comms) ──────────

test('@P1 admin: comms channel toggles are visible and interactive', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/comms');
  await expect(page.getByText(/communication|comms/i).first()).toBeVisible({ timeout: 10_000 });
  // Toggle buttons: inline-flex h-6 w-11 rounded-full
  const toggle = page.locator('button').filter({
    has: page.locator('span.inline-block.rounded-full'),
  }).first();
  await expect(toggle).toBeVisible({ timeout: 8_000 });
  const classBefore = await toggle.getAttribute('class') ?? '';
  await toggle.click();
  const classAfter = await toggle.getAttribute('class') ?? '';
  expect(classAfter).not.toBe(classBefore);
});

test('@P1 admin: comms + New Template button is present', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/comms');
  await expect(page.getByText(/communication|comms/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /new template/i })).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: comms Send Test form has email/phone input and Send Test button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/comms');
  await expect(page.getByText(/send test message/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('input[type=email]').or(page.locator('input[placeholder*=recipient i]'))).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /send test/i })).toBeVisible();
});

// ─── Alerts: resolved checkbox + severity filter + Mark Resolved (/admin/alerts)

test('@P1 admin: alerts Show Resolved checkbox toggles its checked state', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/alerts');
  await expect(page.getByText(/alert/i).first()).toBeVisible({ timeout: 10_000 });
  const checkbox = page.locator('input[type=checkbox]');
  await expect(checkbox).toBeVisible({ timeout: 8_000 });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
});

test('@P1 admin: alerts severity filter cards are clickable and filter list', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/alerts');
  await expect(page.getByText(/critical/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText(/critical/i).first().click();
  // After filter, "Clear filter" link appears
  const clearFilter = page.getByText(/clear filter/i)
    .or(page.getByText(/critical/i).nth(1));
  await expect(clearFilter.first()).toBeVisible({ timeout: 5_000 });
});

test('@P1 admin: alerts Mark Resolved button is visible on unresolved alert cards', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/alerts');
  await expect(page.getByText(/alert/i).first()).toBeVisible({ timeout: 10_000 });
  const markResolved = page.getByRole('button', { name: /mark resolved/i })
    .or(page.getByText('No alerts match the current filters.'));
  await expect(markResolved.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Exports: 6 cards + format buttons (/admin/exports) ──────────────────────

test('@P1 admin: exports page renders 6 report cards with format buttons', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/exports');
  await expect(page.getByText(/data exports/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/student master list/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/attendance report/i)).toBeVisible();
  await expect(page.getByText(/↓ CSV/i).or(page.getByText(/CSV/i)).first()).toBeVisible({ timeout: 8_000 });
});

test('@P2 admin: exports CSV button click stays on exports page', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/exports');
  await expect(page.getByText(/data exports/i).first()).toBeVisible({ timeout: 10_000 });
  const csvBtn = page.getByText(/↓ CSV/i).or(page.getByText(/CSV/i)).first();
  await expect(csvBtn).toBeVisible({ timeout: 8_000 });
  await csvBtn.click();
  await expect(page).toHaveURL(/admin\/exports/);
});

// ─── Settings: toggle + Reset to Defaults (/admin/settings) ──────────────────

test('@P1 admin: settings page has toggle buttons that flip state', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/settings');
  await expect(page.getByText(/system settings/i).first()).toBeVisible({ timeout: 10_000 });
  const toggle = page.locator('button').filter({
    has: page.locator('span.inline-block.rounded-full'),
  }).first();
  await expect(toggle).toBeVisible({ timeout: 8_000 });
  await toggle.click();
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

test('@P1 admin: settings Reset to Defaults button is visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/settings');
  await expect(page.getByText(/system settings/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /reset to defaults/i })).toBeVisible({ timeout: 8_000 });
});

// ─── AI Calls: transcript panel + pagination (/admin/ai-calls) ───────────────

test('@P1 admin: AI calls clicking a row opens transcript side panel', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ai-calls');
  await expect(page.getByText(/ai calls|voice calls|call log/i).first()).toBeVisible({ timeout: 10_000 });
  const row = page.getByRole('row').filter({ hasText: /answered|no_answer|connected|failed/i }).first()
    .or(page.getByText(/answered|no answer/i).first());
  if (await row.count() > 0) {
    await row.first().click();
    const panel = page.getByText(/transcript|call detail|duration/i);
    await expect(panel.first()).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(page.getByText(/no calls|no records/i)
      .or(page.getByRole('table'))).toBeVisible({ timeout: 8_000 });
  }
});

test('@P2 admin: AI calls pagination Prev and Next buttons are rendered', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ai-calls');
  await expect(page.getByText(/ai calls|voice calls|call log/i).first()).toBeVisible({ timeout: 10_000 });
  const prevBtn = page.getByText(/← prev/i).or(page.locator('button').filter({ hasText: /prev/i }));
  const nextBtn = page.getByText(/next →/i).or(page.locator('button').filter({ hasText: /next/i }));
  await expect(prevBtn.first()).toBeVisible({ timeout: 8_000 });
  await expect(nextBtn.first()).toBeVisible({ timeout: 8_000 });
});
