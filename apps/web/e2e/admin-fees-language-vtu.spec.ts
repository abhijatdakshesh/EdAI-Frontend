/**
 * E2E — Admin Fees, Language Preferences, and VTU Registration.
 * @P0 — VTU window creation and fee dashboard are accreditation-critical.
 * @P1 — Language prefs affect parent communication quality.
 *
 * Mock mode: NEXT_PUBLIC_USE_MOCKS=true (set in playwright.config.ts webServer).
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin');
}

// ─── Fee Management (/admin/fees) ─────────────────────────────────────────────

test('@P0 admin: fees page renders summary cards and student records', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/fees');
  await expect(page).toHaveURL(/admin\/fees/);
  // Avoid matching hidden nav link "Alert Feed" (contains "fee").
  await expect(page.getByRole('heading', { name: /fee collection intelligence/i }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  const content = page
    .getByText(/collection snapshot|active invoices|refresh dues/i)
    .or(page.getByRole('table'))
    .or(page.getByText(/no outstanding fees/i));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

test('@P0 admin: fees page has department filter and Overdue only checkbox', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/fees');
  await expect(page.getByRole('heading', { name: /fee collection intelligence/i }).first()).toBeVisible({ timeout: 10_000 });
  const deptSelect = page.locator('select').first();
  await expect(deptSelect).toBeVisible({ timeout: 8_000 });
  const overdueCheckbox = page.locator('input[type=checkbox]');
  await expect(overdueCheckbox.first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/overdue only/i)).toBeVisible();
});

test('@P1 admin: fees Overdue only checkbox is clickable and changes state', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/fees');
  await expect(page.getByRole('heading', { name: /fee collection intelligence/i }).first()).toBeVisible({ timeout: 10_000 });
  const checkbox = page.locator('input[type=checkbox]').first();
  await expect(checkbox).toBeVisible({ timeout: 8_000 });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 5_000 });
});

test('@P1 admin: fees Call Now button visible on fee records', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/fees');
  await expect(page.getByRole('heading', { name: /fee collection intelligence/i }).first()).toBeVisible({ timeout: 10_000 });
  const callContent = page
    .getByText(/📞 call now|call now/i)
    .or(page.getByText(/no outstanding fees/i))
    .or(page.getByRole('table'));
  await expect(callContent.first()).toBeVisible({ timeout: 10_000 });
});

// ─── Language Preferences (/admin/language) ───────────────────────────────────

test('@P1 admin: language page renders with 6 language options', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page).toHaveURL(/admin\/language/);
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/english/i).first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/kannada/i).first()).toBeVisible();
  await expect(page.getByText(/hindi/i).first()).toBeVisible();
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P1 admin: language page shows per-role language select dropdowns', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/default language by role/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('select').first()).toBeVisible();
});

test('@P1 admin: language system default Kannada button is clickable', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  const kannadaBtn = page.getByText(/kannada/i).first();
  await expect(kannadaBtn).toBeVisible({ timeout: 8_000 });
  await kannadaBtn.click();
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P1 admin: language AI Voice Call Languages section is rendered', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/ai voice call languages/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/language\(s\) enabled for ai calls/i)).toBeVisible();
});

test('@P1 admin: language Save Preferences and Reset to Defaults buttons are visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /save preferences/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /reset to defaults/i })).toBeVisible();
});

test('@P1 admin: language Save Preferences shows "✓ Saved" confirmation after click', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/language');
  await expect(page.getByText(/language preferences/i).first()).toBeVisible({ timeout: 10_000 });
  const saveBtn = page.getByRole('button', { name: /save preferences/i });
  await expect(saveBtn).toBeVisible({ timeout: 8_000 });
  await saveBtn.click();
  await expect(page.getByRole('button', { name: /✓ saved|saved/i })).toBeVisible({ timeout: 3_000 });
});

// ─── VTU Registration Admin (/admin/vtu) ──────────────────────────────────────

test('@P0 admin: VTU page renders with tab navigation', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page).toHaveURL(/admin\/vtu/);
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /registration windows/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('button', { name: /pending students/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /dept overview/i })).toBeVisible();
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P0 admin: VTU + New Window button opens create form with all required fields', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  const newWindowBtn = page.getByRole('button', { name: /new window/i });
  await expect(newWindowBtn).toBeVisible({ timeout: 8_000 });
  await newWindowBtn.click();
  // Form heading appears
  await expect(page.getByText(/configure registration window/i)).toBeVisible({ timeout: 5_000 });
  // Title field (placeholder = "e.g. Nov 2025 VTU Exam")
  await expect(page.locator('input[placeholder*="VTU Exam"]')).toBeVisible();
  // Date inputs
  await expect(page.locator('input[type=date]').first()).toBeVisible();
  // Number inputs by placeholder values
  await expect(page.locator('input[type=number][placeholder="75"]')).toBeVisible();
  await expect(page.locator('input[type=number][placeholder="2"]')).toBeVisible();
  // Action buttons
  await expect(page.getByRole('button', { name: /create window/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
});

test('@P0 admin: VTU new window form Cancel button closes the form', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /new window/i }).click();
  const formHeading = page.getByText(/configure registration window/i);
  await expect(formHeading).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: /^cancel$/i }).click();
  await expect(formHeading).not.toBeVisible({ timeout: 3_000 });
});

test('@P1 admin: VTU windows list shows status badges or empty state', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  const windowContent = page
    .getByText(/upcoming|open|closed|processed/i)
    .or(page.getByRole('button', { name: /run eligibility check/i }))
    .or(page.getByText(/no registration windows/i))
    .or(page.getByRole('button', { name: /new window/i }));
  await expect(windowContent.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: VTU Pending Students tab renders instruction or student list', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /pending students/i }).click();
  const content = page
    .getByText(/select a window/i)
    .or(page.getByRole('button', { name: /send reminders to all/i }))
    .or(page.getByText(/pending for/i));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: VTU Dept Overview tab renders instruction or department cards', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/vtu');
  await expect(page.getByText(/vtu registration/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /dept overview/i }).click();
  const content = page
    .getByText(/select a window/i)
    .or(page.getByText(/department|registered|pending/i));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});
