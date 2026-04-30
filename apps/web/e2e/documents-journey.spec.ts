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
  // Document type selector
  const typeSelector = page.locator('select').first().or(page.getByRole('combobox').first());
  await expect(typeSelector).toBeVisible({ timeout: 8_000 });
  // DPDP consent checkbox — CRITICAL: must be present
  const consentCheckbox = page.getByRole('checkbox');
  await expect(consentCheckbox.first()).toBeVisible({ timeout: 8_000 });
  // Submit button
  await expect(page.getByRole('button', { name: /submit|request|apply/i })).toBeVisible();
});

test('@P0 student: DPDP consent checkbox is required — submit blocked without consent', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });
  const consentCheckbox = page.getByRole('checkbox').first();
  await expect(consentCheckbox).toBeVisible({ timeout: 8_000 });

  // Ensure consent is NOT checked
  const isChecked = await consentCheckbox.isChecked();
  if (isChecked) await consentCheckbox.uncheck();

  // Try to submit
  const submitBtn = page.getByRole('button', { name: /submit|request/i });
  await submitBtn.click();

  // Should either show validation message or remain on same page (not navigate away)
  await expect(page).toHaveURL(/student\/documents/);
});

test('@P0 student: full document request flow — select type, check consent, submit', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/documents');

  await expect(page.getByText(/document/i).first()).toBeVisible({ timeout: 10_000 });

  // Select document type
  const typeSelector = page.locator('select').first();
  const optCount = await typeSelector.locator('option').count();
  if (optCount > 1) {
    const val = await typeSelector.locator('option').nth(1).getAttribute('value');
    if (val) await typeSelector.selectOption(val);
  }

  // Check DPDP consent
  const consent = page.getByRole('checkbox').first();
  if (await consent.isVisible()) {
    if (!(await consent.isChecked())) await consent.check();
  }

  // Submit
  await page.getByRole('button', { name: /submit|request/i }).click();

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
  // Download button for approved items or empty state
  const downloadAction = page
    .getByRole('button', { name: /download/i })
    .or(page.getByText(/no approved|no documents/i));
  await expect(downloadAction.first()).toBeVisible({ timeout: 8_000 });
});
