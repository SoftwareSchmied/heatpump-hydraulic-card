import { expect, test } from '@playwright/test';

test('browser self-test passes', async ({ page }, testInfo) => {
  await page.goto('/test/selftest.html');

  const result = page.locator('#result');
  await expect(result).toHaveText(/^(PASS|FAIL)$/, { timeout: 60_000 });

  const status = (await result.textContent())?.trim();
  const log = (await page.locator('#log').textContent())?.trim() || '(no self-test log)';
  await testInfo.attach('selftest.log', {
    body: Buffer.from(log),
    contentType: 'text/plain',
  });

  expect(status, log).toBe('PASS');
});
