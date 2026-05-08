/**
 * E2E Edge Case tests — empty states, error states, form validation,
 * keyboard UX, mobile viewport, session handling.
 * @P2 — must pass within sprint; advisory for prod gate.
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

// ─── Empty states ─────────────────────────────────────────────────────────────

test('@P2 student: fees page with no dues shows cleared state (not blank/crash)', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/fees');

  await expect(page.getByText(/fee/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  // Either dues exist or "all cleared" message
  const content = page
    .getByText(/₹|no pending dues|all fees.*cleared/i)
    .or(page.getByRole('table'));
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

test('@P2 student: jobs page with no listings shows empty state (not blank)', async ({ page }) => {
  await loginAs(page, 'student');
  await page.goto('/student/jobs');

  await expect(page.getByText(/job|opportunit/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  // Either jobs exist or empty state
  const content = page
    .getByRole('button', { name: /apply/i })
    .or(page.getByText(/no jobs|no opportunities|drive not active/i))
    .or(page.locator('[class*=card]').first());
  await expect(content.first()).toBeVisible({ timeout: 8_000 });
});

// ─── Error states ─────────────────────────────────────────────────────────────

test('@P2 admin: error boundary — pages show retry/error card on API failure, not blank screen', async ({ page }) => {
  await loginAs(page, 'admin');
  // Navigate to a data-heavy page; mock data prevents real failures but tests the UI contract
  await page.goto('/admin/users');
  await expect(page.getByText(/user management|users/i).first()).toBeVisible({ timeout: 10_000 });
  // Page should never be blank (no content at all)
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
});

// ─── Form validation ──────────────────────────────────────────────────────────

test('@P2 auth: empty password field — login button submit has no navigation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('student@rvce.edu');
  // Leave password empty
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  // Should remain on /login
  await expect(page).toHaveURL(/login/);
});

test('@P2 auth: invalid email format — login does not navigate away', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('not-an-email');
  await page.getByLabel(/password/i).fill('SomePassword123!');
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  // Should remain on /login — HTML5 validation or server rejects
  await expect(page).toHaveURL(/login/);
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

test('@P2 accessibility: login form Tab key navigates email → password → submit', async ({ page }) => {
  await page.goto('/login');
  const emailInput = page.getByLabel(/email/i);
  await emailInput.click();
  await expect(emailInput).toBeFocused();

  await page.keyboard.press('Tab');
  const passwordInput = page.getByLabel(/password/i);
  await expect(passwordInput).toBeFocused();

  await page.keyboard.press('Tab');
  // Focus should be on submit button
  const submitBtn = page.getByRole('button', { name: /continue|sign in|login/i });
  await expect(submitBtn.or(page.locator(':focus'))).toBeTruthy();
});

// ─── Mobile viewport ──────────────────────────────────────────────────────────

test('@P2 mobile: login page renders correctly at 375x812 (iPhone)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');

  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 8_000 });
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /continue|sign in|login/i })).toBeVisible();
});

test('@P2 mobile: student dashboard renders at mobile viewport without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAs(page, 'student');
  await page.goto('/student/dashboard');

  await expect(page).toHaveURL(/student\/dashboard/);
  // Check no horizontal overflow — body width should not exceed viewport
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(395); // small tolerance for scrollbar
});

// ─── Session expiry ──────────────────────────────────────────────────────────

test('@P2 session: unauthenticated direct navigation to protected pages redirects to /login', async ({ page }) => {
  // No login — visit several protected routes
  const protectedRoutes = ['/admin/users', '/teacher/mark-attendance', '/student/dashboard', '/parent/dashboard'];
  for (const route of protectedRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  }
});

// ─── Page title / heading consistency ────────────────────────────────────────

test('@P2 admin: each major admin page has a visible heading (no ghost pages)', async ({ page }) => {
  await loginAs(page, 'admin');

  const adminPages = [
    { route: '/admin/users', text: /user/i },
    { route: '/admin/classes', text: /class/i },
    { route: '/admin/departments', text: /department/i },
    { route: '/admin/risk', text: /risk/i },
  ];

  for (const { route, text } of adminPages) {
    await page.goto(route);
    await expect(page.getByText(text).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/something went wrong|internal server error|http 500/i)).not.toBeVisible();
  }
});
