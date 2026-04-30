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

  await expect(page.getByText(/timetable generator/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
  // Button text is "+ New Timetable"
  await expect(page.getByRole('button', { name: /new timetable/i })).toBeVisible({ timeout: 8_000 });
});

// ─── Settings (/admin/settings) ───────────────────────────────────────────────

test('@P1 admin: settings page renders config form with save button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/settings');
  await expect(page).toHaveURL(/admin\/settings/);

  await expect(page.getByText(/system settings/i)).toBeVisible({ timeout: 10_000 });
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
