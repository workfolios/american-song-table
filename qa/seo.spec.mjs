import {test, expect} from '@playwright/test';

const expectedTitle = 'Half Smile Grace: The Room Beside You | American Song Table';
const expectedDescription = 'American Song Table’s Summer 2026 cover story on The Room Beside You, a living legacy tribute to Karen Sunderman rooted in Lake Byron, South Dakota.';
const canonicalURL = 'https://workfolios.github.io/american-song-table/';

test('publication exposes the governed SEO contract', async ({page, request}) => {
  await page.goto('/');

  await expect(page).toHaveTitle(expectedTitle);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', expectedDescription);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalURL);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', expectedTitle);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', expectedDescription);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', expectedTitle);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', expectedDescription);

  const article = await page.locator('script[type="application/ld+json"]').evaluate((element) => JSON.parse(element.textContent || '{}'));
  expect(article['@context']).toBe('https://schema.org');
  expect(article['@type']).toBe('Article');
  expect(article.headline).toBe('Half Smile Grace');
  expect(article.mainEntityOfPage?.['@id']).toBe(canonicalURL);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain(`<loc>${canonicalURL}</loc>`);
});

test('utility lead-sheet viewer remains excluded from indexing', async ({page}) => {
  await page.goto('/mobile-lead-sheet/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});
