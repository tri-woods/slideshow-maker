import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, 'fixtures');
const photo = (name: string) => path.join(FIXTURES, name);

test.beforeEach(async ({ page }) => {
  await page.goto('/slideshow-maker.html');
  // Upload photos so settings form is visible
  const fileInput = page.locator('#file-input');
  await fileInput.setInputFiles([
    photo('test-photo-1.png'),
    photo('test-photo-2.png'),
  ]);
  await expect(page.locator('#settings-form')).toBeVisible();
});

test.describe('Title & Credits', () => {
  test('title input accepts text', async ({ page }) => {
    await page.fill('#inp-title', 'Test Slideshow 2026');
    await expect(page.locator('#inp-title')).toHaveValue('Test Slideshow 2026');
  });

  test('subtitle input accepts text', async ({ page }) => {
    await page.fill('#inp-subtitle', 'A Collection of Memories');
    await expect(page.locator('#inp-subtitle')).toHaveValue('A Collection of Memories');
  });

  test('credits input accepts multiline text', async ({ page }) => {
    await page.fill('#inp-credits', 'Photography by Taro\n2026 All Rights Reserved');
    await expect(page.locator('#inp-credits')).toHaveValue('Photography by Taro\n2026 All Rights Reserved');
  });

  test('toggle title card off hides title fields', async ({ page }) => {
    const checkbox = page.locator('#chk-show-title');
    const fields = page.locator('#title-card-fields');

    await expect(fields).toBeVisible();
    await checkbox.uncheck();
    await expect(fields).not.toBeVisible();
  });

  test('toggle credits card off hides credits fields', async ({ page }) => {
    const checkbox = page.locator('#chk-show-credits');
    const fields = page.locator('#credits-card-fields');

    await expect(fields).toBeVisible();
    await checkbox.uncheck();
    await expect(fields).not.toBeVisible();
  });
});

test.describe('Slideshow Settings', () => {
  test('duration slider changes displayed value', async ({ page }) => {
    const slider = page.locator('#inp-duration');
    await slider.fill('5');
    await expect(page.locator('#val-duration')).toHaveText('5');
  });

  test('fade slider changes displayed value', async ({ page }) => {
    const slider = page.locator('#inp-fade');
    await slider.fill('1.5');
    await expect(page.locator('#val-fade')).toHaveText('1.5');
  });

  test('transition dropdown has 4 options', async ({ page }) => {
    const options = page.locator('#inp-transition option');
    await expect(options).toHaveCount(4);
  });

  test('can select each transition type', async ({ page }) => {
    const select = page.locator('#inp-transition');
    for (const value of ['fade-to-black', 'crossfade', 'slide', 'wipe']) {
      await select.selectOption(value);
      await expect(select).toHaveValue(value);
    }
  });

  test('resolution dropdown has 5 options', async ({ page }) => {
    const options = page.locator('#inp-resolution option');
    await expect(options).toHaveCount(5);
  });

  test('can select each resolution', async ({ page }) => {
    const select = page.locator('#inp-resolution');
    for (const value of ['854x480', '1280x720', '1920x1080', '1080x1080', '1080x1920']) {
      await select.selectOption(value);
      await expect(select).toHaveValue(value);
    }
  });

  test('FPS dropdown has 4 options with 15 as default', async ({ page }) => {
    const options = page.locator('#inp-fps option');
    await expect(options).toHaveCount(4);
    await expect(page.locator('#inp-fps')).toHaveValue('15');
  });

  test('Ken Burns checkbox toggles', async ({ page }) => {
    const checkbox = page.locator('#chk-ken-burns');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });
});

test.describe('Audio Settings', () => {
  test('audio section shows no file selected initially', async ({ page }) => {
    await expect(page.locator('#audio-file-name')).toBeVisible();
    await expect(page.locator('#btn-audio-clear')).not.toBeVisible();
  });

  test('audio format hint is visible', async ({ page }) => {
    const hint = page.locator('[data-i18n="audio_formats_hint"]');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('MP3');
  });

  test('audio volume slider defaults to 50', async ({ page }) => {
    await expect(page.locator('#inp-audio-volume')).toHaveValue('50');
    await expect(page.locator('#val-audio-volume')).toHaveText('50');
  });

  test('audio volume slider updates display', async ({ page }) => {
    const slider = page.locator('#inp-audio-volume');
    await slider.fill('80');
    await slider.dispatchEvent('input');
    await expect(page.locator('#val-audio-volume')).toHaveText('80');
  });
});

test.describe('Profile System', () => {
  test('profile button opens modal', async ({ page }) => {
    const profileBtn = page.locator('#btn-profile');
    await profileBtn.click();
    await expect(page.locator('#profile-overlay')).toBeVisible();
  });

  test('profile modal closes with close button', async ({ page }) => {
    await page.locator('#btn-profile').click();
    await expect(page.locator('#profile-overlay')).toBeVisible();
    await page.locator('#btn-profile-close').click();
    await expect(page.locator('#profile-overlay')).not.toBeVisible();
  });

  test('profile modal closes with Escape key', async ({ page }) => {
    await page.locator('#btn-profile').click();
    await expect(page.locator('#profile-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#profile-overlay')).not.toBeVisible();
  });

  test('profile saves and persists across reload', async ({ page }) => {
    await page.locator('#btn-profile').click();
    await page.fill('#inp-profile-name', 'Test Photographer');
    await page.locator('#btn-profile-save').click();

    // Toast should appear
    await expect(page.locator('#profile-saved-toast')).toBeVisible();

    // Reload and check persistence
    await page.reload();
    await page.locator('#btn-profile').click();
    await expect(page.locator('#inp-profile-name')).toHaveValue('Test Photographer');
  });

  test('profile clear resets to defaults', async ({ page }) => {
    // Save a profile first
    await page.locator('#btn-profile').click();
    await page.fill('#inp-profile-name', 'Test Photographer');
    await page.locator('#btn-profile-save').click();
    await page.locator('#btn-profile-close').click();

    // Clear it
    await page.locator('#btn-profile').click();
    await page.locator('#btn-profile-clear').click();

    // Verify defaults restored
    await page.locator('#btn-profile').click();
    await expect(page.locator('#inp-profile-name')).toHaveValue('');
  });
});
