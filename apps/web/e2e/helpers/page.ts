import { expect, Locator, Page } from '@playwright/test';

/** Authenticated page body — excludes hidden mobile sidebar nav duplicates. */
export function main(page: Page): Locator {
  return page.getByRole('main');
}

export function mainTitle(page: Page, name: string | RegExp): Locator {
  return main(page).getByRole('heading', { level: 1, name });
}

export async function expectMainTitle(
  page: Page,
  name: string | RegExp,
  options?: { timeout?: number },
) {
  await expect(mainTitle(page, name).first()).toBeVisible({
    timeout: options?.timeout ?? 10_000,
  });
}

/** Pages without AppShell (standalone layout) — heading is outside `<main>`. */
export async function expectHeading(
  page: Page,
  name: string | RegExp,
  options?: { timeout?: number },
) {
  await expect(page.getByRole('heading', { name }).first()).toBeVisible({
    timeout: options?.timeout ?? 10_000,
  });
}
