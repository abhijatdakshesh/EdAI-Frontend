import { Page } from '@playwright/test';

type Role = 'admin' | 'teacher' | 'student' | 'parent';

const CREDS: Record<Role, { email: string; password: string }> = {
  admin:   { email: 'admin@rvce.edu',   password: 'Admin@123' },
  teacher: { email: 'teacher@rvce.edu', password: 'Teacher@123' },
  student: { email: 'student@rvce.edu', password: 'Student@123' },
  parent:  { email: 'parent@rvce.edu',  password: 'Parent@123' },
};

const POST_LOGIN_URL: Record<Role, RegExp> = {
  admin:   /dashboard/,
  teacher: /dashboard/,
  student: /student\/dashboard/,
  parent:  /parent\/dashboard/,
};

export async function loginAs(page: Page, role: Role): Promise<void> {
  const { email, password } = CREDS[role];
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /continue|sign in|login/i }).click();
  await page.waitForURL(POST_LOGIN_URL[role], { timeout: 30_000 });
}
