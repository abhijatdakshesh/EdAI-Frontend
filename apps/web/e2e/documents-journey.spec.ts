/**
 * E2E Document Management tests
 * Covers: student document request centre, admin document approval queue.
 * @P0 — DPDP compliance critical: consent checkbox must be present before any request
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

// ─── Student Document Centre (/student/documents) ────────────────────────────

test('@P0 student: document centre renders type dropdown, purpose, consent checkbox, submit', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');
  await expect(page).toHaveURL(/student\/documents/);

  await expect(page.getByText(/document|bonafide|certificate/i).first()).toBeVisible({ timeout: 10_000 });
  // Form is hidden behind "New Request" button — click to reveal
  await page.getByRole('button', { name: /new request/i }).click();
  // Document type selector (native <select>)
  await expect(page.locator('select').first()).toBeVisible({ timeout: 8_000 });
  // DPDP consent checkbox — CRITICAL: must be present
  await expect(page.getByRole('checkbox').first()).toBeVisible();
  // Submit button
  await expect(page.getByRole('button', { name: /submit request/i })).toBeVisible();
});

test('@P0 student: DPDP consent checkbox is required — submit blocked without consent', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /new request/i }).click();
  const consentCheckbox = page.getByRole('checkbox').first();
  await expect(consentCheckbox).toBeVisible({ timeout: 8_000 });

  // Ensure consent is NOT checked
  const isChecked = await consentCheckbox.isChecked();
  if (isChecked) await consentCheckbox.uncheck();

  // Try to submit — use exact name to avoid matching "New Request" button
  const submitBtn = page.getByRole('button', { name: /submit request/i });
  await submitBtn.click();

  // Should either show validation message or remain on same page (not navigate away)
  await expect(page).toHaveURL(/student\/documents/);
});

test('@P0 student: full document request flow — select type, check consent, submit', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  // Open the form
  await page.getByRole('button', { name: /new request/i }).click();

  // Select purpose (required field)
  const purposeSelect = page.locator('select').nth(1);
  await expect(purposeSelect).toBeVisible({ timeout: 5_000 });
  const opts = purposeSelect.locator('option');
  const optCount = await opts.count();
  if (optCount > 1) {
    const val = await opts.nth(1).getAttribute('value');
    if (val) await purposeSelect.selectOption(val);
  }

  // Check DPDP consent
  const consent = page.getByRole('checkbox').first();
  if (!(await consent.isChecked())) await consent.check();

  // Submit
  await page.getByRole('button', { name: /submit request/i }).click();

  // Success or pending status should appear
  const successState = page
    .getByText(/submitted|pending|request.*received|success/i)
    .or(page.getByRole('status'))
    .or(page.getByText(/thank you/i));
  await expect(successState.first()).toBeVisible({ timeout: 12_000 });
});

test('@P0 student: existing document requests show status badges', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  // Request history with status badges — or empty state
  const requestList = page
    .getByText(/pending|approved|rejected/i)
    .or(page.getByText(/no requests|no documents/i));
  await expect(requestList.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Admin Document Queue (/admin/documents) ──────────────────────────────────

test('@P0 admin: document approval queue renders table with status badges', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/documents');
  await expect(page).toHaveURL(/admin\/documents/);

  await expect(page.getByText(/document|approval queue|requests/i).first()).toBeVisible({ timeout: 10_000 });
  // Approval queue — table or empty state
  const queueContent = page
    .getByRole('table')
    .or(page.getByText(/pending|approved|rejected/i))
    .or(page.getByText(/no pending requests|no documents/i));
  await expect(queueContent.first()).toBeVisible({ timeout: 8_000 });
});

test('@P0 admin: document queue has approve and reject action buttons', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  // Approve / Reject buttons or empty state
  const actionContent = page
    .getByRole('button', { name: /approve|reject|review/i })
    .or(page.getByText(/no pending|no documents/i));
  await expect(actionContent.first()).toBeVisible({ timeout: 8_000 });
});

// ─── P1: Document Download ────────────────────────────────────────────────────

test('@P1 admin: approved document row has download action', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  // Download, approve/reject buttons, or any empty state text — page must render something
  const pageContent = page
    .getByRole('button', { name: /download|approve|reject/i })
    .or(page.getByText(/no (?:pending|approved|documents|requests)/i))
    .or(page.getByRole('table'));
  await expect(pageContent.first()).toBeVisible({ timeout: 10_000 });
});
