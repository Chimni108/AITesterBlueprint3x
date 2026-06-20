import { test, expect } from '@playwright/test';
import { mockApiResponse } from '../../utils/helpers';
import { products } from '../../utils/test-data';

test.describe('Shopping cart', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponse(page, '**/api/products', products);
    await page.goto('/products');
  });

  test('should display products @smoke', async ({ page }) => {
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('Product B')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product A to cart' }).click();
    await expect(page.getByRole('status')).toContainText('1 item');
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto('/upload');
    const fileInput = page.getByLabel('Upload document');
    await fileInput.setInputFiles('test-data/sample.pdf');
    await expect(page.getByText('sample.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Upload successful')).toBeVisible();
  });
});
