import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly navLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.userMenu = page.getByRole('button', { name: 'User menu' });
    this.logoutButton = page.getByRole('menuitem', { name: 'Sign out' });
    this.navLinks = page.getByRole('navigation').getByRole('link');
  }

  async goto(): Promise<void> {
    await this.navigate('/dashboard');
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
