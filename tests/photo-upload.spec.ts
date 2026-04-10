import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, 'fixtures');
const photo = (name: string) => path.join(FIXTURES, name);

test.beforeEach(async ({ page }) => {
  await page.goto('/slideshow-maker.html');
});

test.describe('Photo Upload', () => {
  test('upload zone is visible on initial load', async ({ page }) => {
    await expect(page.locator('#upload-zone')).toBeVisible();
    await expect(page.locator('#thumbnail-area')).not.toBeVisible();
  });

  test('upload single photo via file input', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(photo('test-photo-1.png'));

    await expect(page.locator('#thumbnail-area')).toBeVisible();
    await expect(page.locator('#photo-count-label')).toContainText('1');
  });

  test('upload multiple photos', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
      photo('test-photo-3.png'),
    ]);

    await expect(page.locator('#photo-count-label')).toContainText('3');
    const thumbs = page.locator('#thumbs-grid .thumb-wrap');
    await expect(thumbs).toHaveCount(3);
  });

  test('add more photos to existing selection', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
    ]);
    await expect(page.locator('#photo-count-label')).toContainText('2');

    const addInput = page.locator('#file-input-add');
    await addInput.setInputFiles([
      photo('test-photo-3.png'),
      photo('test-photo-4.png'),
    ]);
    await expect(page.locator('#photo-count-label')).toContainText('4');
  });

  test('shows export button after uploading photos', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(photo('test-photo-1.png'));

    await expect(page.locator('#btn-export')).toBeVisible();
    await expect(page.locator('#btn-export')).toBeEnabled();
  });

  test('settings form becomes visible after upload', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(photo('test-photo-1.png'));

    await expect(page.locator('#settings-form')).toBeVisible();
    await expect(page.locator('#inp-duration')).toBeVisible();
    await expect(page.locator('#inp-resolution')).toBeVisible();
  });
});

test.describe('Photo Management', () => {
  test.beforeEach(async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
      photo('test-photo-3.png'),
    ]);
  });

  test('delete a photo reduces count', async ({ page }) => {
    await expect(page.locator('#photo-count-label')).toContainText('3');

    const deleteBtn = page.locator('#thumbs-grid .thumb-wrap .thumb-remove').first();
    await deleteBtn.click({ force: true });

    await expect(page.locator('#photo-count-label')).toContainText('2');
    const thumbs = page.locator('#thumbs-grid .thumb-wrap');
    await expect(thumbs).toHaveCount(2);
  });

  test('delete all photos shows upload zone again', async ({ page }) => {
    const deleteBtns = page.locator('#thumbs-grid .thumb-wrap .thumb-remove');
    const count = await deleteBtns.count();
    for (let i = count - 1; i >= 0; i--) {
      await deleteBtns.nth(i).click({ force: true });
    }

    await expect(page.locator('#upload-zone')).toBeVisible();
    await expect(page.locator('#thumbnail-area')).not.toBeVisible();
  });

  test('reorder photos with arrow buttons', async ({ page }) => {
    // Get first thumbnail's image src before reorder
    const firstThumb = page.locator('#thumbs-grid .thumb-wrap').first();
    const firstSrc = await firstThumb.locator('img').getAttribute('src');

    // Click right arrow (▶) on first thumbnail to move it right
    const rightArrow = firstThumb.locator('.thumb-arrows .thumb-arrow').nth(1);
    await rightArrow.click({ force: true });

    // First thumbnail should now have a different image
    const newFirst = page.locator('#thumbs-grid .thumb-wrap').first();
    const newFirstSrc = await newFirst.locator('img').getAttribute('src');
    expect(newFirstSrc).not.toBe(firstSrc);
  });

  test('per-photo duration badge is clickable', async ({ page }) => {
    const badge = page.locator('#thumbs-grid .dur-badge').first();
    await badge.click();

    // Duration editor should appear
    const editor = page.locator('.dur-badge-editor');
    await expect(editor).toBeVisible();
  });
});

test.describe('Photo Validation', () => {
  test('estimate info updates after photos uploaded', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles([
      photo('test-photo-1.png'),
      photo('test-photo-2.png'),
    ]);

    const estimateInfo = page.locator('#estimate-info');
    await expect(estimateInfo).not.toBeEmpty();
  });
});
