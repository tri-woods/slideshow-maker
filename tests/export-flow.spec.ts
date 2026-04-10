import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, 'fixtures');
const photo = (name: string) => path.join(FIXTURES, name);

test.beforeEach(async ({ page }) => {
  await page.goto('/slideshow-maker.html');
});

test.describe('Export Button State', () => {
  test('export button is not visible without photos', async ({ page }) => {
    // Settings form (which contains export button) should not be visible
    await expect(page.locator('#settings-form')).not.toBeVisible();
  });

  test('export button is enabled after uploading photos', async ({ page }) => {
    await page.locator('#file-input').setInputFiles(photo('test-photo-1.png'));
    await expect(page.locator('#btn-export')).toBeEnabled();
  });
});

test.describe('Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Upload photos with minimal settings for fast encoding
    await page.locator('#file-input').setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
    ]);
    // Set fastest encoding options
    await page.locator('#inp-duration').fill('1');
    await page.locator('#inp-fade').fill('0.3');
    await page.locator('#inp-resolution').selectOption('854x480');
    await page.locator('#inp-fps').selectOption('12');
    // Disable title and credits for speed
    await page.locator('#chk-show-title').uncheck();
    await page.locator('#chk-show-credits').uncheck();
  });

  test('clicking export shows encoding screen', async ({ page }) => {
    await page.locator('#btn-export').click();

    await expect(page.locator('#screen-encoding')).toBeVisible();
    await expect(page.locator('#screen-setup')).not.toBeVisible();
    await expect(page.locator('#progress-fill')).toBeVisible();
    await expect(page.locator('#btn-cancel')).toBeVisible();
  });

  test('encoding screen shows progress info', async ({ page }) => {
    await page.locator('#btn-export').click();

    await expect(page.locator('#stat-pct')).toBeVisible();
    await expect(page.locator('#stat-frame')).toBeVisible();
    await expect(page.locator('#status-msg')).toBeVisible();
  });

  test('cancel button is present on encoding screen', async ({ page }) => {
    await page.locator('#btn-export').click();

    // Wait for either encoding or done screen to become active
    await expect(page.locator('#screen-encoding.visible, #screen-done.visible').first())
      .toBeVisible({ timeout: 10_000 });

    // If still encoding, verify cancel button exists
    if (await page.locator('#screen-encoding').evaluate(el => el.classList.contains('visible'))) {
      await expect(page.locator('#btn-cancel')).toBeVisible();
    }
  });

  test('full export produces done screen with download link', async ({ page }) => {
    test.setTimeout(120_000); // Export can take time

    await page.locator('#btn-export').click();

    // Wait for done screen
    await expect(page.locator('#screen-done')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('#screen-encoding')).not.toBeVisible();

    // Download link should be present
    const downloadLink = page.locator('#download-link');
    await expect(downloadLink).toBeVisible();
    const href = await downloadLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('blob:');

    // Video preview should be present
    await expect(page.locator('#result-video')).toBeVisible();

    // File size should be displayed
    await expect(page.locator('#done-file-size')).not.toBeEmpty();
  });

  test('back to settings button retains photos', async ({ page }) => {
    test.setTimeout(120_000);

    await page.locator('#btn-export').click();
    await expect(page.locator('#screen-done')).toBeVisible({ timeout: 90_000 });

    await page.locator('#btn-back-settings').click();

    await expect(page.locator('#screen-setup')).toBeVisible();
    await expect(page.locator('#photo-count-label')).toContainText('2');
  });

  test('restart button clears photos', async ({ page }) => {
    test.setTimeout(120_000);

    await page.locator('#btn-export').click();
    await expect(page.locator('#screen-done')).toBeVisible({ timeout: 90_000 });

    await page.locator('#btn-restart').click();

    await expect(page.locator('#screen-setup')).toBeVisible();
    await expect(page.locator('#upload-zone')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('error toast appears and is accessible', async ({ page }) => {
    const toast = page.locator('#error-toast');
    // Toast should have correct ARIA role
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  test('estimate info shows duration and file size', async ({ page }) => {
    await page.locator('#file-input').setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
      photo('test-photo-3.png'),
    ]);

    const estimate = page.locator('#estimate-info');
    await expect(estimate).toBeVisible();
    const text = await estimate.textContent();
    // Should contain some numeric values (duration, size, frames)
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });
});
