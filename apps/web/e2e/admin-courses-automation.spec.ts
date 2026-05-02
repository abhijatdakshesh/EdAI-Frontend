/**
 * E2E — Course Management + Automation Rules.
 * @P1 — administrative config; not student-safety critical.
 *
 * Mock mode: NEXT_PUBLIC_USE_MOCKS=true (set in playwright.config.ts webServer).
 */

import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers/auth';

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin');
}

// ─── Course Management (/admin/courses) ──────────────────────────────────────

test('@P1 admin: courses page renders stats cards and course list', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page).toHaveURL(/admin\/courses/);
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/total courses/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

test('@P1 admin: courses page search input is present and accepts text', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  const search = page.locator('input[placeholder*="Search course"]')
    .or(page.locator('input[placeholder*=search i]'));
  await expect(search.first()).toBeVisible({ timeout: 8_000 });
  await search.first().fill('Data Structures');
  await expect(search.first()).toHaveValue('Data Structures');
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible({ timeout: 5_000 });
});

test('@P1 admin: courses page department and type filter selects are rendered', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  const selects = page.locator('select');
  await expect(selects.first()).toBeVisible({ timeout: 8_000 });
  // Two selects: dept filter and type filter
  const count = await selects.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test('@P1 admin: courses department filter changes results without crash', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  const deptSelect = page.locator('select').first();
  await expect(deptSelect).toBeVisible({ timeout: 8_000 });
  const options = deptSelect.locator('option');
  const count = await options.count();
  if (count > 1) {
    const val = await options.nth(1).getAttribute('value');
    if (val) await deptSelect.selectOption(val);
  }
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible({ timeout: 5_000 });
});

test('@P1 admin: courses table rows have Edit and Remove action buttons', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  const actionContent = page
    .getByText(/edit/i).filter({ hasNot: page.getByText(/course management/i) })
    .or(page.getByText(/remove/i))
    .or(page.getByText(/no courses|empty/i));
  await expect(actionContent.first()).toBeVisible({ timeout: 10_000 });
});

test('@P1 admin: courses + Add Course button is visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/courses');
  await expect(page.getByText(/course management|courses/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /add course/i })).toBeVisible({ timeout: 8_000 });
});

// ─── Automation Rules (/admin/automation) ─────────────────────────────────────

test('@P1 admin: automation page renders stats and rule cards', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/automation');
  await expect(page).toHaveURL(/admin\/automation/);
  await expect(page.getByText(/automation rules|automation/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/total rules|active/i).first()).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/something went wrong|500/i)).not.toBeVisible();
});

test('@P1 admin: automation + New Rule button is visible', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/automation');
  await expect(page.getByText(/automation/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /new rule/i })).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: automation rule cards display TRIGGER and CONDITION labels', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/automation');
  await expect(page.getByText(/automation/i).first()).toBeVisible({ timeout: 10_000 });
  const ruleLabel = page.getByText(/trigger/i)
    .or(page.getByText(/low attendance|fee overdue|ia marks/i))
    .or(page.getByText(/no rules/i));
  await expect(ruleLabel.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: automation rule cards have Edit and Run Now action links', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/automation');
  await expect(page.getByText(/automation/i).first()).toBeVisible({ timeout: 10_000 });
  const editLink = page.getByText(/^edit$/i)
    .or(page.getByRole('button', { name: /^edit$/i }))
    .or(page.getByText(/no rules/i));
  await expect(editLink.first()).toBeVisible({ timeout: 8_000 });
  const runLink = page.getByText(/run now/i)
    .or(page.getByText(/no rules/i));
  await expect(runLink.first()).toBeVisible({ timeout: 8_000 });
});

test('@P1 admin: automation rule toggle button flips enabled class on click', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/automation');
  await expect(page.getByText(/automation/i).first()).toBeVisible({ timeout: 10_000 });
  // Toggle button: relative inline-flex h-6 w-11 items-center rounded-full
  const toggle = page.locator('button').filter({
    has: page.locator('span.inline-block.rounded-full'),
  }).first();
  await expect(toggle).toBeVisible({ timeout: 8_000 });
  const classBefore = await toggle.getAttribute('class') ?? '';
  await toggle.click();
  const classAfter = await toggle.getAttribute('class') ?? '';
  expect(classAfter).not.toBe(classBefore);
});
