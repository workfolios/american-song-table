import {test, expect} from '@playwright/test';
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const evidenceRoot = path.resolve('qa-artifacts');

function evidencePath(...parts) {
  const outputPath = path.join(evidenceRoot, ...parts);
  mkdirSync(path.dirname(outputPath), {recursive: true});
  return outputPath;
}

async function expectImageLoaded(locator) {
  await expect(locator).toBeVisible();
  const dimensions = await locator.evaluate((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  }));
  expect(dimensions.complete).toBe(true);
  expect(dimensions.naturalWidth).toBeGreaterThan(0);
  expect(dimensions.naturalHeight).toBeGreaterThan(0);
}

async function expectResource(request, url, expectedTypes, minimumBytes = 1) {
  const response = await request.get(url);
  expect(response.status(), `${url} should return HTTP 200`).toBe(200);

  const contentType = response.headers()['content-type'] ?? '';
  const allowedTypes = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
  expect(
    allowedTypes.some((expectedType) => contentType.includes(expectedType)),
    `${url} should use one of: ${allowedTypes.join(', ')}; received ${contentType}`,
  ).toBe(true);

  const body = await response.body();
  expect(body.length, `${url} should not be empty`).toBeGreaterThanOrEqual(minimumBytes);
}

test('approved styling renders and the page does not fall back to unstyled HTML', async ({page, request}, testInfo) => {
  const localRequestFailures = [];
  page.on('requestfailed', (failedRequest) => {
    if (failedRequest.url().startsWith('http://127.0.0.1:4173/')) {
      localRequestFailures.push(`${failedRequest.method()} ${failedRequest.url()}`);
    }
  });

  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts?.ready);

  await expect(page).toHaveTitle(/Half Smile Grace/);
  await expect(page.locator('main#main-content')).toBeVisible();
  await expect(page.locator('.hero-title')).toContainText('Half');
  await expect(page.locator('.hero-title')).toContainText('Smile');
  await expect(page.locator('.hero-title')).toContainText('Grace');

  const stylesheetUrls = await page.locator('link[rel="stylesheet"]').evaluateAll((links) =>
    links.map((link) => link.href),
  );
  const pageOrigin = new URL(page.url()).origin;
  const stylesheetUrl = stylesheetUrls.find((url) => new URL(url).origin === pageOrigin);
  expect(stylesheetUrl, 'A same-origin production stylesheet should be linked').toBeTruthy();

  const stylesheetResponse = await request.get(stylesheetUrl);
  expect(stylesheetResponse.status()).toBe(200);
  expect(stylesheetResponse.headers()['content-type'] ?? '').toContain('text/css');
  const stylesheetText = await stylesheetResponse.text();
  expect(stylesheetText).toMatch(/--color-page-bg:\s*#020814/i);
  expect(stylesheetText).toMatch(/--font-serif:[^;]*Playfair Display/i);

  const rendering = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const hero = document.querySelector('.hero-container');
    const heroStyle = hero ? getComputedStyle(hero) : null;
    return {
      bodyBackground: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      bodyFont: bodyStyle.fontFamily,
      heroDisplay: heroStyle?.display ?? null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  expect(rendering.bodyBackground).toBe('rgb(2, 8, 20)');
  expect(rendering.bodyColor).toBe('rgb(242, 238, 232)');
  expect(rendering.bodyFont).toContain('Inter');
  expect(rendering.heroDisplay).toBe('grid');
  expect(rendering.scrollWidth).toBeLessThanOrEqual(rendering.clientWidth + 1);
  expect(localRequestFailures).toEqual([]);

  await expectImageLoaded(page.locator('.masthead-img'));
  await expectImageLoaded(page.locator('.hero-profile-img'));

  const projectName = testInfo.project.name;
  await page.screenshot({
    path: evidencePath('screenshots', `${projectName}-opening.png`),
    fullPage: false,
  });

  const mediaSection = page.locator('.ast-media');
  await mediaSection.scrollIntoViewIfNeeded();
  await mediaSection.screenshot({path: evidencePath('screenshots', `${projectName}-media.png`)});

  const contactSection = page.locator('.contact-section');
  await contactSection.scrollIntoViewIfNeeded();
  await contactSection.screenshot({path: evidencePath('screenshots', `${projectName}-contact.png`)});
});

test('publication downloads and mobile lead-sheet viewer are available', async ({page, request}, testInfo) => {
  await page.goto('/', {waitUntil: 'domcontentloaded'});

  const pdfHref = await page.getByRole('link', {name: 'Download Three-Page PDF'}).getAttribute('href');
  const viewerHref = await page.getByRole('link', {name: 'View Mobile Image Set'}).getAttribute('href');
  const zipHref = await page.getByRole('link', {name: 'Download All Mobile Images (.ZIP)'}).getAttribute('href');

  expect(pdfHref).toBeTruthy();
  expect(viewerHref).toBeTruthy();
  expect(zipHref).toBeTruthy();

  await expectResource(request, new URL(pdfHref, page.url()).toString(), 'application/pdf', 100_000);
  await expectResource(
    request,
    new URL(zipHref, page.url()).toString(),
    ['application/zip', 'application/octet-stream', 'application/x-zip-compressed'],
    100_000,
  );

  await page.goto(viewerHref, {waitUntil: 'networkidle'});
  await expect(page.getByRole('heading', {name: /Mobile Image Set/i})).toBeVisible();

  const viewerImages = page.locator('main img');
  await expect(viewerImages).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expectImageLoaded(viewerImages.nth(index));
  }

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  await page.screenshot({
    path: evidencePath('screenshots', `${testInfo.project.name}-mobile-lead-sheet.png`),
    fullPage: true,
  });
});

test('critical accessibility regressions are blocked', async ({page}, testInfo) => {
  await page.goto('/', {waitUntil: 'networkidle'});

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  await page.addScriptTag({path: axePath});
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
  }));

  writeFileSync(
    evidencePath('accessibility', `${testInfo.project.name}-axe.json`),
    JSON.stringify(results, null, 2),
  );

  const criticalViolations = results.violations.filter((violation) => violation.impact === 'critical');
  expect(criticalViolations, JSON.stringify(criticalViolations, null, 2)).toEqual([]);
});
