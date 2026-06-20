import { test, expect } from '../../fixtures/auth.fixture';
import { users } from '../../utils/test-data';

test.describe('Login functionality', () => {
  test('should login with valid credentials @smoke', async ({ loginPage, page }) => {
    await loginPage.login(users.admin.email, users.admin.password);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login(users.invalid.email, users.invalid.password);
    await loginPage.expectErrorMessage('Invalid email or password');
  });

  test('should navigate to forgot password page', async ({ loginPage, page }) => {
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL('/forgot-password');
  });
});
