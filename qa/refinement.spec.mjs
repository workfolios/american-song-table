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
    ['small-320', 320, 800],
    ['small-360', 360, 800],
    ['mobile-375', 375, 812],
    ['mobile-390', 390, 844],
    ['mobile-430', 430, 932],
    ['mobile-480', 480, 900],
    ['mobile-600', 600, 900],
    ['mobile-699', 699, 900],
    ['tablet-700', 700, 900],
    ['tablet-768', 768, 1024],
    ['tablet-912', 912, 1368],
    ['tablet-959', 959, 900],
    ['tablet-960', 960, 900],
    ['tablet-980', 980, 900],
    ['tablet-1023', 1023, 900],
    ['compact-1024', 1024, 900],
    ['compact-1032', 1032, 1376],
    ['compact-1112', 1112, 834],
    ['compact-1199', 1199, 900],
    ['compact-1279', 1279, 900],
    ['desktop-1280', 1280, 900],
    ['desktop-1440', 1440, 900],
    ['landscape-844x390', 844, 390],
  ];

  const gridColumns = new Map();

  for (const [name, width, height] of viewports) {
    await page.setViewportSize({width, height});
    await page.waitForTimeout(60);

    const state = await page.evaluate(() => {
      const root = document.documentElement;
      const hero = document.querySelector('.hero-container');
      const heroText = document.querySelector('.hero-text')?.getBoundingClientRect();
      const illustration = document.querySelector('.hero-illustration-container')?.getBoundingClientRect();
      const portraitElement = document.querySelector('.hero-profile-img');
      const portrait = portraitElement?.getBoundingClientRect();
      const title = document.querySelector('.hero-title')?.getBoundingClientRect();
      const subtitleElement = document.querySelector('.hero-subtitle');
      const titleElement = document.querySelector('.hero-title');
      const subtitle = subtitleElement?.getBoundingClientRect();
      const headingFont = titleElement ? Number.parseFloat(getComputedStyle(titleElement).fontSize) : null;
      const subtitleFont = subtitleElement ? Number.parseFloat(getComputedStyle(subtitleElement).fontSize) : null;
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        heroColumns: hero ? getComputedStyle(hero).gridTemplateColumns : '',
        titleVisible: Boolean(document.querySelector('.hero-title')?.getBoundingClientRect().height),
        heroText: heroText ? {left: heroText.left, right: heroText.right, top: heroText.top, bottom: heroText.bottom} : null,
        illustration: illustration ? {left: illustration.left, right: illustration.right, top: illustration.top, bottom: illustration.bottom, width: illustration.width} : null,
        portrait: portrait ? {left: portrait.left, top: portrait.top, right: portrait.right, bottom: portrait.bottom, width: portrait.width, height: portrait.height} : null,
        title: title ? {left: title.left, right: title.right, top: title.top, bottom: title.bottom, height: title.height} : null,
        subtitle: subtitle ? {left: subtitle.left, right: subtitle.right, top: subtitle.top, bottom: subtitle.bottom, width: subtitle.width} : null,
        headingFont,
        subtitleFont,
        textBlockHeight: heroText?.height ?? null,
        portraitNaturalRatio: portraitElement?.naturalWidth && portraitElement?.naturalHeight
          ? portraitElement.naturalWidth / portraitElement.naturalHeight : null,
      };
    });

    expect(state.scrollWidth, `${name} should not overflow horizontally`).toBeLessThanOrEqual(state.clientWidth + 1);
    expect(state.titleVisible, `${name} should preserve the feature title`).toBe(true);
    gridColumns.set(name, state.heroColumns);

    expect(state.portrait, `${name} should retain the approved portrait asset`).not.toBeNull();
    expect(state.portraitNaturalRatio, `${name} portrait aspect ratio should be known`).not.toBeNull();
    expect(state.portrait.width / state.portrait.height, `${name} portrait must remain undistorted`)
      .toBeCloseTo(state.portraitNaturalRatio, 2);
    // Validate the actually visible ink bounds rather than the original
    // opaque 1086 x 1448 image canvas used by the source art.
    const ink = {
      left: state.portrait.left + state.portrait.width * (297 / 1086),
      right: state.portrait.left + state.portrait.width * (944 / 1086),
      top: state.portrait.top + state.portrait.height * (150 / 1448),
      bottom: state.portrait.top + state.portrait.height * (1371 / 1448),
      height: state.portrait.height * ((1371 - 150) / 1448),
      width: state.portrait.width * ((944 - 297) / 1086),
    };
    expect(state.illustration, `${name} should preserve the reference-led portrait window`).not.toBeNull();
    expect(ink.left, `${name} portrait ink should not be cropped on the left`)
      .toBeGreaterThanOrEqual(state.illustration.left - 1);
    expect(ink.right, `${name} portrait ink should not be cropped on the right`)
      .toBeLessThanOrEqual(state.illustration.right + 1);
    expect(ink.top, `${name} portrait ink should not be cropped at the top`)
      .toBeGreaterThanOrEqual(state.illustration.top - 1);
    expect(ink.bottom, `${name} portrait ink should not be cropped at the bottom`)
      .toBeLessThanOrEqual(state.illustration.bottom + 1);
    expect(state.illustration.right, `${name} portrait window should stay in the viewport`)
      .toBeLessThanOrEqual(state.clientWidth + 1);
    expect(ink.height / state.title.height, `${name} portrait ink should have cover-like scale relative to headline`)
      .toBeGreaterThanOrEqual(1.65);
    expect(ink.height / state.title.height, `${name} portrait should not overwhelm headline`)
      .toBeLessThanOrEqual(3.5);
    expect(state.heroText.right, `${name} text should not reach the illustration window`)
      .toBeLessThanOrEqual(state.illustration.left + 1);
    expect(state.subtitle.right, `${name} subtitle should stay within the text column`)
      .toBeLessThanOrEqual(state.illustration.left + 1);

    if (width >= 700) {
      // Match the Open Graph cover's visual hierarchy without altering the
      // portrait or reproducing absent cover content in the published hero.
      expect(state.headingFont, `${name} tablet/desktop headline should have sufficient editorial scale`)
        .toBeGreaterThanOrEqual(width < 1024 ? 65 : 83);
      expect(state.subtitleFont, `${name} tablet/desktop subtitle should be legible and prominent`)
        .toBeGreaterThanOrEqual(20);
      expect(state.textBlockHeight / (state.illustration.bottom - state.illustration.top),
        `${name} text block should counterbalance the visible silhouette`)
        .toBeGreaterThanOrEqual(0.64);
      expect(state.subtitle.width, `${name} subtitle should retain a deliberate multiline measure`)
        .toBeLessThanOrEqual(width <= 1023 ? 246 : 376);

      if (width >= 1024 && width <= 1279) {
        const expectedTextMeasure = Math.max(245, Math.min(375, width * 0.5078 - 275));
        expect(state.subtitle.width, `${name} subtitle measure should bridge tablet to desktop smoothly`)
          .toBeLessThanOrEqual(expectedTextMeasure + 1);
      }
    }

    await page.screenshot({path: evidencePath(`boundary-${name}.png`), fullPage: false});
  }

  for (const viewport of ['mobile-699', 'tablet-700', 'tablet-1023', 'compact-1024', 'compact-1032', 'desktop-1280', 'desktop-1440']) {
    expect(gridColumns.get(viewport).trim().split(/\s+/), `${viewport} should preserve the two-column hero`)
      .toHaveLength(2);
  }
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
