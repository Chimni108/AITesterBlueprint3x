import { Page } from '@playwright/test';

export async function mockApiResponse(
  page: Page,
  urlPattern: string,
  body: unknown,
  status = 200
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

export async function waitForApiCall(page: Page, urlPattern: string): Promise<number> {
  const responsePromise = page.waitForResponse(urlPattern);
  const response = await responsePromise;
  return response.status();
}

export function generateEmail(prefix = 'user'): string {
  return `${prefix}+${Date.now()}@example.com`;
}
