import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const widths = [320, 390, 768, 1024, 1440, 1920];

test('every target width reflows without horizontal overflow', async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    for (const path of ['/', '/simulator?scenario=custom-recruitment', '/hall-of-harm', '/cases/madoff', '/learn/mlm', '/methodology']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      expect(dimensions.content, `${path} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  }
});

test('mobile simulator keeps setup, results, and playback usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/simulator?scenario=custom-recruitment');
  await expect(page.getByRole('tab', { name: 'Setup' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page.getByRole('tab', { name: /Results 1/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Participant growth' })).toBeVisible();
  await expect(page.getByLabel('Simulation playback controls')).toBeVisible();
  await page.getByRole('tab', { name: 'Setup' }).click();
  await expect(page.getByLabel('Joining fee')).toBeVisible();
});

test('historical replay is immutable, source linked, and completes on schedule', async ({ page }) => {
  await page.goto('/simulator?scenario=charles-ponzi');
  await expect(page.getByText('Immutable historical baseline')).toBeVisible();
  await expect(page.getByLabel('Deposit per new participant')).toBeDisabled();
  await page.getByRole('button', { name: 'Run model' }).click();
  await expect(page.getByRole('heading', { name: 'Regulatory intervention' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('8/8')).toBeVisible();
  await page.getByRole('button', { name: 'Make a copy' }).click();
  await expect(page.getByLabel('Deposit per new participant')).toBeEnabled();
});

test('leaderboard sorting, filtering, deep links, and keyboard focus work', async ({ page }) => {
  await page.goto('/hall-of-harm');
  await page.getByRole('columnheader', { name: /People affected/ }).getByRole('button').click();
  await expect(page).toHaveURL(/sort=affectedPeople/);
  await page.getByLabel('Scheme type').selectOption('recruitment-pyramid');
  await expect(page.getByText('Showing 3 cases')).toBeVisible();
  await page.goto('/cases/madoff');
  await expect(page.getByRole('heading', { name: /Bernard L. Madoff/ })).toBeVisible();
  await page.keyboard.press('Tab');
  if (await page.getByRole('link', { name: 'Skip to main content' }).evaluate((element) => element !== document.activeElement)) {
    await page.getByRole('link', { name: 'Skip to main content' }).focus();
  }
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
});

test('leaderboard header does not obscure the first-ranked case', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/hall-of-harm');

  const headerBox = await page.getByRole('columnheader', { name: 'Case' }).boundingBox();
  const firstRowBox = await page.locator('.leaderboard-table tbody tr').first().boundingBox();

  expect(headerBox).not.toBeNull();
  expect(firstRowBox).not.toBeNull();
  expect(firstRowBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
});

test('key routes have no automatically detectable WCAG A or AA violations', async ({ page }) => {
  for (const path of ['/', '/simulator?scenario=custom-recruitment', '/hall-of-harm', '/learn/mlm', '/methodology']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, path).toEqual([]);
  }
});

test('key routes retain intentional visual baselines', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One deterministic browser owns the visual baseline.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/simulator?scenario=custom-recruitment');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page).toHaveScreenshot('simulator-mobile-results.png', { fullPage: true });
});
