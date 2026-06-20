import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('should display dashboard after login @smoke', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show navigation links', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    const nav = authenticatedPage.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should logout successfully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.getByRole('button', { name: 'User menu' }).click();
    await authenticatedPage.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(authenticatedPage).toHaveURL('/login');
  });
});
