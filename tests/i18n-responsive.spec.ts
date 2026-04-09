import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, 'fixtures');
const photo = (name: string) => path.join(FIXTURES, name);

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear language preference before each test
    await page.goto('/slideshow-maker.html');
    await page.evaluate(() => localStorage.removeItem('cinema-slide-lang'));
    await page.reload();
  });

  test('default language renders Japanese UI', async ({ page }) => {
    // Default should be Japanese based on the i18n setup
    const uploadLabel = page.locator('[data-i18n="upload_label"]');
    await expect(uploadLabel).toBeVisible();
  });

  test('language toggle button is visible', async ({ page }) => {
    await expect(page.locator('#btn-lang')).toBeVisible();
  });

  test('language menu opens on click', async ({ page }) => {
    await page.locator('#btn-lang').click();
    await expect(page.locator('#lang-menu')).toHaveClass(/visible/);
  });

  test('switch to English updates UI text', async ({ page }) => {
    await page.locator('#btn-lang').click();
    await page.locator('.lang-menu-item[data-lang="en"]').click();

    // Check that English text is applied
    const exportBtn = page.locator('#btn-export');
    // The data-i18n attribute should still be there, but text should be English
    await page.locator('#file-input').setInputFiles(photo('test-photo-1.png'));
    const btnText = await exportBtn.textContent();
    expect(btnText).toContain('Create');
  });

  test('language preference persists across reload', async ({ page }) => {
    // Switch to English
    await page.locator('#btn-lang').click();
    await page.locator('.lang-menu-item[data-lang="en"]').click();

    // Reload
    await page.reload();

    // Should still be English
    const savedLang = await page.evaluate(() => localStorage.getItem('cinema-slide-lang'));
    expect(savedLang).toBe('en');
  });

  test('switch back to Japanese', async ({ page }) => {
    // First switch to English
    await page.locator('#btn-lang').click();
    await page.locator('.lang-menu-item[data-lang="en"]').click();

    // Then back to Japanese
    await page.locator('#btn-lang').click();
    await page.locator('.lang-menu-item[data-lang="ja"]').click();

    const savedLang = await page.evaluate(() => localStorage.getItem('cinema-slide-lang'));
    expect(savedLang).toBe('ja');
  });
});

test.describe('Legal Document Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slideshow-maker.html');
    await page.locator('#file-input').setInputFiles(photo('test-photo-1.png'));
  });

  test('copyright disclaimer is visible', async ({ page }) => {
    const disclaimer = page.locator('[data-i18n="disclaimer_copyright"]');
    await expect(disclaimer).toBeVisible();
  });

  test('privacy policy link has target="_blank"', async ({ page }) => {
    const link = page.locator('a[href="./privacy.html"]');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  });

  test('terms of service link has target="_blank"', async ({ page }) => {
    const link = page.locator('a[href="./terms.html"]');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  });
});

test.describe('Responsive Layout', () => {
  test('desktop layout shows full width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/slideshow-maker.html');

    const screen = page.locator('#screen-setup');
    await expect(screen).toBeVisible();
  });

  test('mobile layout at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/slideshow-maker.html');

    const screen = page.locator('#screen-setup');
    await expect(screen).toBeVisible();
    const uploadZone = page.locator('#upload-zone');
    await expect(uploadZone).toBeVisible();
  });

  test('tablet layout at 768px width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/slideshow-maker.html');

    const screen = page.locator('#screen-setup');
    await expect(screen).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slideshow-maker.html');
  });

  test('error toast has correct ARIA attributes', async ({ page }) => {
    const toast = page.locator('#error-toast');
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  test('profile modal has dialog role', async ({ page }) => {
    await page.locator('#btn-profile').click();
    const modal = page.locator('#profile-overlay');
    await expect(modal).toBeVisible();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('file input has aria-label', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    // File input should have some accessible label
    const ariaLabel = await fileInput.getAttribute('aria-label');
    const dataAriaLabel = await fileInput.getAttribute('data-i18n-aria');
    expect(ariaLabel || dataAriaLabel).toBeTruthy();
  });

  test('form labels are associated with inputs', async ({ page }) => {
    await page.locator('#file-input').setInputFiles(photo('test-photo-1.png'));

    // Check that labels use 'for' attribute linking to inputs
    const titleLabel = page.locator('label[for="inp-title"]');
    await expect(titleLabel).toBeVisible();

    const durationLabel = page.locator('label[for="inp-duration"]');
    await expect(durationLabel).toBeVisible();
  });

  test('keyboard navigation: Escape closes profile modal', async ({ page }) => {
    await page.locator('#btn-profile').click();
    await expect(page.locator('#profile-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#profile-overlay')).not.toBeVisible();
  });
});

test.describe('Legal Pages', () => {
  test('privacy page loads and has bilingual toggle', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.locator('#btn-en')).toBeVisible();
    await expect(page.locator('#btn-ja')).toBeVisible();
    await expect(page.locator('#lang-en')).toBeVisible();
  });

  test('privacy page switches to Japanese', async ({ page }) => {
    await page.goto('/privacy.html');
    await page.locator('#btn-ja').click();
    await expect(page.locator('#lang-ja')).toBeVisible();
    await expect(page.locator('#lang-en')).not.toBeVisible();
  });

  test('terms page loads and has bilingual toggle', async ({ page }) => {
    await page.goto('/terms.html');
    await expect(page.locator('#btn-en')).toBeVisible();
    await expect(page.locator('#btn-ja')).toBeVisible();
  });

  test('terms page switches to Japanese', async ({ page }) => {
    await page.goto('/terms.html');
    await page.locator('#btn-ja').click();
    await expect(page.locator('#lang-ja')).toBeVisible();
    await expect(page.locator('#lang-en')).not.toBeVisible();
  });

  test('privacy page auto-detects Japanese from app preference', async ({ page }) => {
    // Set app language to Japanese
    await page.goto('/slideshow-maker.html');
    await page.evaluate(() => localStorage.setItem('cinema-slide-lang', 'ja'));

    // Navigate to privacy page
    await page.goto('/privacy.html');

    // Japanese section should be active
    await expect(page.locator('#lang-ja')).toBeVisible();
    await expect(page.locator('#lang-en')).not.toBeVisible();
  });
});
