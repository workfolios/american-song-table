import {test, expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const evidenceRoot = path.resolve('qa-artifacts', 'refinement');

function evidencePath(filename) {
  mkdirSync(evidenceRoot, {recursive: true});
  return path.join(evidenceRoot, filename);
}

function runOnce(testInfo) {
  return testInfo.project.name === 'chromium-desktop-1440';
}

async function progressRatio(locator) {
  return locator.evaluate((element) => {
    const match = element.style.transform.match(/scaleX\(([-\d.]+)\)/);
    return match ? Number(match[1]) : 0;
  });
}

test('RO-005 provides restrained continuous reading-position feedback', async ({page}, testInfo) => {
  test.skip(!runOnce(testInfo), 'Targeted refinement evidence runs once in Chromium; representative cross-engine QA runs separately.');

  await page.goto('/', {waitUntil: 'networkidle'});

  const progress = page.locator('#ast-reading-progress');
  const bar = page.locator('.ast-reading-progress__bar');
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveAttribute('aria-hidden', 'true');

  const geometry = await progress.boundingBox();
  expect(geometry).not.toBeNull();
  expect(geometry.y).toBeLessThanOrEqual(1);
  expect(geometry.height).toBeLessThanOrEqual(3);
  expect(await progressRatio(bar)).toBeLessThanOrEqual(0.01);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await expect.poll(() => progressRatio(bar)).toBeGreaterThan(0.2);
  const midProgress = await progressRatio(bar);
  expect(midProgress).toBeLessThan(0.8);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('End');
  await expect.poll(() => progressRatio(bar)).toBeGreaterThan(0.98);

  await page.screenshot({path: evidencePath('ro-005-progress-end.png'), fullPage: false});
});

test('RO-090 preserves link styling while increasing coarse-pointer hit areas', async ({browser}, testInfo) => {
  test.skip(!runOnce(testInfo), 'Targeted refinement evidence runs once in Chromium; representative cross-engine QA runs separately.');

  const context = await browser.newContext({
    viewport: {width: 390, height: 844},
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/', {waitUntil: 'networkidle'});

  const coarsePointer = await page.evaluate(() =>
    window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches,
  );
  expect(coarsePointer).toBe(true);

  const actions = page.locator('.ast-narration__external, .ast-media__download, .ast-media__external');
  const count = await actions.count();
  expect(count).toBeGreaterThanOrEqual(6);

  for (let index = 0; index < count; index += 1) {
    const action = actions.nth(index);
    if (!(await action.isVisible())) {
      continue;
    }
    const box = await action.boundingBox();
    expect(box, `Action ${index + 1} should have measurable geometry`).not.toBeNull();
    expect(box.height, `Action ${index + 1} should meet the 44px project touch target`).toBeGreaterThanOrEqual(44);
    const decoration = await action.evaluate((element) => getComputedStyle(element).textDecorationLine);
    expect(decoration).toContain('underline');
  }

  const mediaSection = page.locator('.ast-media');
  await mediaSection.scrollIntoViewIfNeeded();
  await mediaSection.screenshot({path: evidencePath('ro-090-mobile-media-actions.png')});
  await context.close();
});

test('interaction focus and reduced-motion behavior remain coherent', async ({page}, testInfo) => {
  test.skip(!runOnce(testInfo), 'Targeted refinement evidence runs once in Chromium; representative cross-engine QA runs separately.');

  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/', {waitUntil: 'networkidle'});

  const reducedMotionState = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(document.querySelector('.ast-media__download')).transitionDuration,
  }));
  expect(reducedMotionState.scrollBehavior).toBe('auto');
  expect(reducedMotionState.transitionDuration).toBe('0s');

  const firstDownload = page.locator('.ast-media__download').first();
  await firstDownload.focus();
  await expect(firstDownload).toBeFocused();
  const focusStyle = await firstDownload.evaluate((element) => {
    const style = getComputedStyle(element);
    return {outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth};
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0);
});

test('breakpoint boundaries and landscape orientation remain overflow-safe', async ({page}, testInfo) => {
  test.skip(!runOnce(testInfo), 'Targeted boundary evidence runs once in Chromium; representative cross-engine QA runs separately.');

  await page.goto('/', {waitUntil: 'domcontentloaded'});

  const viewports = [
    ['small-360', 360, 800],
    ['mobile-699', 699, 900],
    ['tablet-700', 700, 900],
    ['tablet-1023', 1023, 900],
    ['desktop-1024', 1024, 900],
    ['landscape-844x390', 844, 390],
  ];

  const gridColumns = new Map();

  for (const [name, width, height] of viewports) {
    await page.setViewportSize({width, height});
    await page.waitForTimeout(60);

    const state = await page.evaluate(() => {
      const root = document.documentElement;
      const hero = document.querySelector('.hero-container');
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        heroColumns: hero ? getComputedStyle(hero).gridTemplateColumns : '',
        titleVisible: Boolean(document.querySelector('.hero-title')?.getBoundingClientRect().height),
      };
    });

    expect(state.scrollWidth, `${name} should not overflow horizontally`).toBeLessThanOrEqual(state.clientWidth + 1);
    expect(state.titleVisible, `${name} should preserve the feature title`).toBe(true);
    gridColumns.set(name, state.heroColumns);
    await page.screenshot({path: evidencePath(`boundary-${name}.png`), fullPage: false});
  }

  expect(gridColumns.get('mobile-699')).not.toBe(gridColumns.get('tablet-700'));
  expect(gridColumns.get('tablet-1023')).not.toBe(gridColumns.get('desktop-1024'));
});

test('form processing, success, provider error, and network recovery states are deterministic', async ({page}, testInfo) => {
  test.skip(!runOnce(testInfo), 'Targeted form-state evidence runs once in Chromium; representative accessibility QA runs separately.');

  const formUrl = 'https://formspree.io/f/mrenokqv';

  async function completeForm() {
    await page.locator('#contact-name').fill('QA Test');
    await page.locator('#contact-email').fill('qa@example.com');
    await page.locator('#contact-org').fill('American Song Table QA');
    await page.locator('#contact-msg').fill('Deterministic browser QA message.');
  }

  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await page.route(formUrl, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({status: 200, contentType: 'application/json', body: '{}'});
  });
  await completeForm();
  await page.locator('#contact-submit-btn').click();
  await expect(page.locator('#contact-submit-btn')).toBeDisabled();
  await expect(page.locator('#contact-submit-btn')).toHaveText('Sending...');
  await expect(page.locator('#contact-status')).toContainText('submitted successfully');
  await expect(page.locator('#contact-submit-btn')).toBeEnabled();

  await page.unroute(formUrl);
  await page.route(formUrl, async (route) => {
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({errors: [{message: 'Deterministic provider validation error'}]}),
    });
  });
  await completeForm();
  await page.locator('#contact-submit-btn').click();
  await expect(page.locator('#contact-status')).toContainText('Deterministic provider validation error');
  await expect(page.locator('#contact-status')).toHaveClass(/form-status--error/);
  await expect(page.locator('#contact-submit-btn')).toBeEnabled();

  await page.unroute(formUrl);
  await page.route(formUrl, async (route) => route.abort('internetdisconnected'));
  await page.locator('#contact-submit-btn').click();
  await expect(page.locator('#contact-status')).toContainText('Network error');
  await expect(page.locator('#contact-status')).toHaveClass(/form-status--error/);
  await expect(page.locator('#contact-submit-btn')).toBeEnabled();
});
