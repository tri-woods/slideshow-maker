import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, '..', 'fixtures');
const photo = (name: string) => path.join(FIXTURES, name);

test.describe('Landing page', () => {
  test('loads with correct canonical URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://cinema-slide.app/');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content', 'https://cinema-slide.app/');
  });

  test('old GitHub Pages origin redirects here', async ({ request }) => {
    const resp = await request.get('https://tri-woods.github.io/slideshow-maker/');
    expect(resp.ok()).toBeTruthy();
    expect(new URL(resp.url()).hostname).toBe('cinema-slide.app');
  });
});

test.describe('App boot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slideshow-maker.html');
  });

  test('app boots to the upload screen', async ({ page }) => {
    await expect(page.locator('#upload-zone')).toBeVisible();
    await expect(page.locator('#thumbnail-area')).not.toBeVisible();
  });

  test('service worker registers and activates', async ({ page }) => {
    const sw = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return { scope: reg.scope, active: !!reg.active };
    });
    expect(sw.active).toBe(true);
    expect(new URL(sw.scope).hostname).toBe('cinema-slide.app');
  });
});

test.describe('Export path', () => {
  test('full export produces done screen with download link', async ({ page }) => {
    test.setTimeout(180_000); // network load + encoding

    await page.goto('/slideshow-maker.html');
    await page.locator('#file-input').setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
    ]);
    // Fastest encoding options, mirroring tests/export-flow.spec.ts
    await page.locator('#inp-duration').fill('1');
    await page.locator('#inp-fade').fill('0.3');
    await page.locator('#inp-resolution').selectOption('854x480');
    await page.locator('#inp-fps').selectOption('12');
    await page.locator('#chk-show-title').uncheck();
    await page.locator('#chk-show-credits').uncheck();

    await page.locator('#btn-export').click();

    await expect(page.locator('#screen-done')).toBeVisible({ timeout: 150_000 });
    const downloadLink = page.locator('#download-link');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute('href', /^blob:/);
  });
});
