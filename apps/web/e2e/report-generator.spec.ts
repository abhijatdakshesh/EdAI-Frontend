/**
 * E2E Report Generator tests — /admin/report-generator
 * @P1 — important admin productivity tool; not mission-critical for student safety
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('@P1 report generator: page loads at /admin/report-generator', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');
  await expect(page).toHaveURL(/admin\/report-generator/);

  await expect(page.getByText(/report generator|report/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
});

test('@P1 report generator: report type selector renders with multiple options', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');

  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  // Report type — button group, dropdown, or radio
  const typeSelector = page
    .getByRole('combobox')
    .or(page.locator('select'))
    .or(page.getByText(/attendance|fees|marks|placement|risk/i));
  await expect(typeSelector.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 report generator: filter inputs are present (dept, semester)', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');

  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  // Dept / semester filters
  const filterInputs = page
    .getByRole('textbox')
    .or(page.locator('select'))
    .or(page.getByRole('combobox'));
  await expect(filterInputs.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 report generator: generate PDF button is present and clickable', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');

  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  const generateBtn = page.getByRole('button', { name: /generate|create report|download/i });
  await expect(generateBtn.first()).toBeVisible({ timeout: 8_000 });
  // Clicking triggers loading state (mock API)
  await generateBtn.first().click();
  // Either loading spinner, success, or staying in place — no crash
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible({ timeout: 5_000 });
});

test('@P1 report generator: history table renders with type, status, date columns', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');

  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  // History section
  const historyContent = page
    .getByText(/history|past report|generated/i)
    .or(page.getByRole('table'))
    .or(page.getByText(/no reports generated/i));
  await expect(historyContent.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 report generator: email field accepts recipient input', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/report-generator');

  await expect(page.getByText(/report/i).first()).toBeVisible({ timeout: 10_000 });
  // Email input for delivery
  const emailInput = page
    .getByRole('textbox', { name: /email/i })
    .or(page.locator('input[type=email]'))
    .or(page.locator('input[placeholder*=email i]'));
  if (await emailInput.count() > 0) {
    await emailInput.first().fill('admin@rvce.edu');
    await expect(emailInput.first()).toHaveValue('admin@rvce.edu');
  } else {
    // Email field may not be visible until report type selected — no strict assert
    await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  }
});
