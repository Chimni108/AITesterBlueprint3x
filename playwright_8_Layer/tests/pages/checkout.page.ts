import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  readonly placeOrderButton: Locator;
  readonly promoCodeInput: Locator;
  readonly cardNumberInput: Locator;
  readonly orderSummary: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    this.promoCodeInput = page.getByLabel('Promo code');
    this.cardNumberInput = page.getByLabel('Card number');
    this.orderSummary = page.getByRole('region', { name: 'Order Summary' });
    this.errorBanner = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.navigate('/checkout');
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.promoCodeInput.fill(code);
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }

  async fillCardNumber(cardNumber: string): Promise<void> {
    await this.cardNumberInput.fill(cardNumber);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.orderSummary).toBeVisible();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toHaveText(message);
  }
}
