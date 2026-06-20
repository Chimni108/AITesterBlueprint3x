import { test as base } from '@playwright/test';

type DbFixtures = {
  cleanupIds: string[];
};

export const test = base.extend<DbFixtures>({
  cleanupIds: async ({}, use) => {
    const ids: string[] = [];
    await use(ids);
    // Teardown: delete any records created during the test
    for (const id of ids) {
      await fetch(`${process.env.API_URL}/cleanup/${id}`, { method: 'DELETE' });
    }
  },
});

export { expect } from '@playwright/test';
