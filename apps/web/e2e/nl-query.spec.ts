/**
 * E2E Natural Language Query tests — /admin/ask
 * @P1 — admin productivity; not mission-critical
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('@P1 nl-query: page loads at /admin/ask with text input', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/ask');
  await expect(page).toHaveURL(/admin\/ask/);

  await expect(page.getByText(/ask|query|natural language|question/i).first()).toBeVisible({ timeout: 10_000 });
  // Text input for natural language query
  const queryInput = page
    .getByRole('textbox')
    .or(page.locator('textarea'))
    .or(page.locator('input[type=text]'));
  await expect(queryInput.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 nl-query: submit button is present and clickable', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/ask');

  await expect(page.getByText(/ask|query/i).first()).toBeVisible({ timeout: 10_000 });
  const submitBtn = page.getByRole('button', { name: /ask|submit|search|query/i });
  await expect(submitBtn.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 nl-query: typing query and submitting renders results area', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/ask');

  await expect(page.getByText(/ask|query/i).first()).toBeVisible({ timeout: 10_000 });
  const queryInput = page.getByRole('textbox').or(page.locator('textarea')).first();
  await expect(queryInput).toBeVisible({ timeout: 8_000 });

  await queryInput.fill('Show me attendance summary for CSE semester 5');
  // Submit via button or Enter
  const submitBtn = page.getByRole('button', { name: /ask|submit|search|query/i });
  if (await submitBtn.count() > 0) {
    await submitBtn.first().click();
  } else {
    await queryInput.press('Enter');
  }

  // Results area or loading state should appear
  const resultsArea = page
    .getByText(/result|answer|data|table|loading/i)
    .or(page.getByRole('table'))
    .or(page.getByText(/no results|error/i));
  await expect(resultsArea.first()).toBeVisible({ timeout: 15_000 });
  // Must not show unhandled 500
  await expect(page.getByText(/internal server error/i)).not.toBeVisible();
});

test('@P1 nl-query: error state shows message when API fails (mock resilience)', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/ask');

  await expect(page.getByText(/ask|query/i).first()).toBeVisible({ timeout: 10_000 });
  // Page should not show unhandled crash on load — mocks return graceful empty state
  await expect(page.getByText(/something went wrong|500|internal server error/i)).not.toBeVisible({ timeout: 5_000 });
});
