/**
 * E2E Auth tests — login flows for all roles plus error and access-control cases.
 *
 * Credentials come from the dev-credentials table in apps/web/src/auth.ts:
 *   student@rvce.edu  / Student@123  → STUDENT  → /student/dashboard
 *   teacher@rvce.edu  / Teacher@123  → FACULTY  → /dashboard
 *   admin@rvce.edu    / Admin@123    → ADMIN     → /dashboard
 *   parent@rvce.edu   / Parent@123   → PARENT    → /parent/dashboard
 *
 * Role-based redirects are enforced in middleware.ts.
 */

import { test, expect, Page } from '@playwright/test';

// ─── helpers ────────────────────────────────────────────────────────────────

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto('/login');
  // The login page uses <label for="email"> and <label for="password">
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
}

async function loginAs(page: Page, email: string, password: string) {
  await fillLoginForm(page, email, password);
  // Wait for navigation away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

// ─── student ─────────────────────────────────────────────────────────────────

test('student can login and reach student dashboard', async ({ page }) => {
  await loginAs(page, 'student@rvce.edu', 'Student@123');
  await expect(page).toHaveURL(/student\/dashboard/);
  // The page heading or shell title should identify this as the student dashboard
  await expect(
    page.getByRole('heading', { name: /dashboard/i }).or(page.getByText(/dashboard/i).first()),
  ).toBeVisible();
});

// ─── teacher / faculty ───────────────────────────────────────────────────────

test('teacher can login and reach dashboard', async ({ page }) => {
  await loginAs(page, 'teacher@rvce.edu', 'Teacher@123');
  // Faculty land on /dashboard
  await expect(page).toHaveURL(/dashboard/);
  // Should not be on the student or parent dashboard
  expect(page.url()).not.toMatch(/student\/dashboard/);
  expect(page.url()).not.toMatch(/parent\/dashboard/);
});

// ─── admin ───────────────────────────────────────────────────────────────────

test('admin can login and reach dashboard', async ({ page }) => {
  await loginAs(page, 'admin@rvce.edu', 'Admin@123');
  await expect(page).toHaveURL(/dashboard/);
  // Admin should not be on a role-specific portal dashboard
  expect(page.url()).not.toMatch(/student\/dashboard/);
  expect(page.url()).not.toMatch(/parent\/dashboard/);
});

// ─── parent ───────────────────────────────────────────────────────────────────

test('parent can login and reach parent dashboard', async ({ page }) => {
  await loginAs(page, 'parent@rvce.edu', 'Parent@123');
  await expect(page).toHaveURL(/parent\/dashboard/);
  await expect(
    page.getByRole('heading', { name: /dashboard/i }).or(page.getByText(/dashboard/i).first()),
  ).toBeVisible();
});

// ─── wrong password ───────────────────────────────────────────────────────────

test('wrong password shows an error message', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('student@rvce.edu');
  await page.getByLabel(/password/i).fill('WrongPassword999!');
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();

  // The login page renders the error inside a <p> with text about invalid credentials
  const errorMessage = page.getByText(/invalid email or password/i);
  await expect(errorMessage).toBeVisible({ timeout: 10_000 });
  // We should still be on /login
  await expect(page).toHaveURL(/login/);
});

test('empty email and password does not navigate away from login', async ({ page }) => {
  await page.goto('/login');
  // The button is disabled while fields are empty via HTML5 required validation;
  // try clicking it and confirm we stay on /login.
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  await expect(page).toHaveURL(/login/);
});

// ─── route access control ─────────────────────────────────────────────────────

test('student cannot access admin routes — redirected to student dashboard', async ({ page }) => {
  await loginAs(page, 'student@rvce.edu', 'Student@123');

  // Attempt to navigate to an admin-only page
  await page.goto('/admin/users');
  // Middleware should redirect a STUDENT away from /admin/* → to /student/dashboard
  await expect(page).toHaveURL(/student\/dashboard/, { timeout: 10_000 });
});

test('unauthenticated user trying to visit a protected page is redirected to /login', async ({
  page,
}) => {
  // Do NOT log in — visit a protected page directly
  await page.goto('/student/dashboard');
  await expect(page).toHaveURL(/login/, { timeout: 10_000 });
});

test('login page redirects already-authenticated student away to student dashboard', async ({
  page,
}) => {
  // First login as student
  await loginAs(page, 'student@rvce.edu', 'Student@123');
  await expect(page).toHaveURL(/student\/dashboard/);

  // Now navigate back to /login — should auto-redirect
  await page.goto('/login');
  await expect(page).toHaveURL(/student\/dashboard/, { timeout: 10_000 });
});
