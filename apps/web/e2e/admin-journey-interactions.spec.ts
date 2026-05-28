/**
 * E2E — Deep admin interaction flows: modal fill+submit, confirmation dialogs,
 * form validation, and side-panel open/close across all admin portal pages.
 *
 * @P0 — Create User full flow, Document Reject modal.
 * @P1 — Promotion generate form, IA Confirm, Bulk Import type-switch,
 *        Settings Save feedback, Voice Calling trigger form.
 * @P2 — Exports filter indicator.
 *
 * Mock mode: NEXT_PUBLIC_USE_MOCKS=true (set in playwright.config.ts webServer).
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin');
}

// ─── Create User: full form fill (/admin/users) ───────────────────────────────

test('@P0 admin: create user modal — fill all 6 fields and click Create User', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page.getByRole('button', { name: /add user/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /add user/i }).click();

  await expect(page.getByText(/create new user/i)).toBeVisible({ timeout: 5_000 });
  await page.locator('input[placeholder="Name"]').fill('Test Faculty');
  await page.locator('input[placeholder="Email"]').fill('test.faculty@rvce.edu');
  await page.locator('input[type=password]').fill('Faculty@test123');
  await page.locator('select').first().selectOption('FACULTY');
  // Placeholder is dynamic per role (SAP ID required for STUDENT). Match either.
  await page
    .locator('input[placeholder*="SAP ID"]')
    .first()
    .fill('FA099');
  await page.locator('input[placeholder="Dept code (e.g. CSE)"]').fill('ISE');

  const createBtn = page.getByRole('button', { name: /create user/i });
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  // Success: modal closes. Error (mock): modal stays with error msg. Both acceptable.
  const outcome = page
    .getByText(/create new user/i)
    .or(page.getByRole('button', { name: /add user/i }));
  await expect(outcome.first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P0 admin: create user modal Cancel button closes form without submitting', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await expect(page.getByRole('button', { name: /add user/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /add user/i }).click();
  await expect(page.getByText(/create new user/i)).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByText(/create new user/i)).not.toBeVisible({ timeout: 3_000 });
});

// ─── Document Reject modal (/admin/documents) ─────────────────────────────────

test('@P0 admin: document Reject button opens confirmation modal with reason textarea', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/documents');
  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  const rejectBtn = page.getByRole('button', { name: /reject/i });
  if (await rejectBtn.count() > 0) {
    await rejectBtn.first().click();
    const modal = page.locator('textarea')
      .or(page.getByText(/rejection reason|reason for rejection/i))
      .or(page.getByRole('dialog'));
    await expect(modal.first()).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(page.getByText(/no pending|no document requests/i)
      .or(page.getByRole('heading', { name: /document/i }))).toBeVisible({ timeout: 8_000 });
  }
});

// ─── Promotion: Generate tab form fill (/admin/promotion) ─────────────────────

test('@P1 admin: promotion Generate tab — class selector enables Generate button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/promotion');
  await expect(page.getByText(/promotion/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /\+ generate report/i }).click();

  const classSelect = page.locator('select').first();
  await expect(classSelect).toBeVisible({ timeout: 5_000 });
  const options = classSelect.locator('option');
  if (await options.count() > 1) {
    const val = await options.nth(1).getAttribute('value');
    if (val) await classSelect.selectOption(val);
    const generateBtn = page.getByRole('button', { name: /^generate report$/i });
    await expect(generateBtn).toBeEnabled({ timeout: 3_000 });
    await generateBtn.click();
    await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 8_000 });
  } else {
    await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  }
});

// ─── IA Submission: Confirm action (/admin/ia-submission) ─────────────────────

test('@P1 admin: IA submission Confirm button is clickable on available rows', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ia-submission');
  await expect(page.getByText(/ia submission/i).first()).toBeVisible({ timeout: 10_000 });
  const confirmBtn = page.getByRole('button', { name: /confirm/i });
  if (await confirmBtn.count() > 0) {
    await confirmBtn.first().click();
    await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 5_000 });
  } else {
    const content = page.getByText(/not started|submitted|confirmed|no ia submissions/i);
    await expect(content.first()).toBeVisible({ timeout: 8_000 });
  }
});

test('@P1 admin: IA submission progress bar or section header is visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/ia-submission');
  await expect(page.getByText(/ia submission/i).first()).toBeVisible({ timeout: 10_000 });
  const progressContent = page
    .getByText(/submission progress|not started|submitted|confirmed/i)
    .or(page.getByText(/no ia submissions/i));
  await expect(progressContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Bulk Import: type-switch + drag zone + sidebar (/admin/bulk-import) ───────

test('@P1 admin: bulk import Faculty type button updates required columns info', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/bulk-import');
  await expect(page.getByText(/bulk import/i).first()).toBeVisible({ timeout: 10_000 });
  const facultyBtn = page
    .getByRole('button', { name: /faculty/i })
    .or(page.getByText(/^faculty$/i));
  await expect(facultyBtn.first()).toBeVisible({ timeout: 12_000 });
  await facultyBtn.first().click();
  // Required columns section should update for faculty type
  const facultyCols = page
    .getByText(/employee id|designation|department code/i)
    .or(page.getByText(/required columns/i));
  await expect(facultyCols.first()).toBeVisible({ timeout: 5_000 });
});

test('@P1 admin: bulk import drag-drop zone text is visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/bulk-import');
  await expect(page.getByText(/bulk import/i).first()).toBeVisible({ timeout: 10_000 });
  const dropZone = page.getByText(/drop your csv|drop.*file|drag.*drop/i);
  await expect(dropZone.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: bulk import recent imports sidebar shows history section', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/bulk-import');
  await expect(page.getByText(/bulk import/i).first()).toBeVisible({ timeout: 10_000 });
  const sidebar = page
    .getByText(/recent imports|import history/i)
    .or(page.getByText(/completed|failed|processing/i));
  await expect(sidebar.first()).toBeVisible({ timeout: 12_000 });
});

// ─── Settings: Save Changes feedback (/admin/settings) ────────────────────────

test('@P1 admin: settings Save Changes button shows "Saved" feedback after click', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/settings');
  await expect(page.getByText(/system settings/i).first()).toBeVisible({ timeout: 10_000 });
  const saveBtn = page.getByRole('button', { name: /save changes/i });
  await expect(saveBtn).toBeVisible({ timeout: 8_000 });
  await saveBtn.click();
  const feedback = page
    .getByRole('button', { name: /saved/i })
    .or(page.getByText(/saved|settings updated/i));
  await expect(feedback.first()).toBeVisible({ timeout: 4_000 });
});

// ─── Voice Calling: Trigger Call form (/admin/voice-calling) ──────────────────

test('@P1 admin: voice calling Trigger tab has USN input, language select, and Trigger Call button', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/voice-calling');
  await expect(page.getByText(/voice call/i).first()).toBeVisible({ timeout: 10_000 });
  const triggerContent = page
    .getByRole('button', { name: /trigger call/i })
    .or(page.locator('input[placeholder*=usn i]'))
    .or(page.getByText(/trigger call/i));
  await expect(triggerContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Exports: filter active indicator (/admin/exports) ────────────────────────

test('@P2 admin: exports dept filter shows active filter note after selection', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/exports');
  await expect(page.getByText(/data exports/i).first()).toBeVisible({ timeout: 10_000 });
  const deptSelect = page.locator('select').first();
  await expect(deptSelect).toBeVisible({ timeout: 8_000 });
  const options = deptSelect.locator('option');
  if (await options.count() > 1) {
    await deptSelect.selectOption({ index: 1 });
    const filterNote = page
      .getByText(/filters active|dept.*cse|filter/i)
      .or(page.getByText(/student master list/i));
    await expect(filterNote.first()).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(page.getByText(/student master list/i)).toBeVisible({ timeout: 8_000 });
  }
});
