import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';

const baseURL = process.env.LIVE_BASE_URL || 'https://workfolios.github.io/american-song-table/';
const expectedTitle = 'Half Smile Grace: The Room Beside You | American Song Table';
const expectedDescription = 'American Song Table’s Summer 2026 cover story on The Room Beside You, a living legacy tribute to Karen Sunderman rooted in Lake Byron, South Dakota.';
const evidenceRoot = path.resolve('qa-artifacts', 'live');
mkdirSync(evidenceRoot, {recursive: true});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForRelease() {
  let lastStatus = 'no response';

  for (let attempt = 1; attempt <= 18; attempt += 1) {
    try {
      const response = await fetch(baseURL, {cache: 'no-store'});
      lastStatus = `HTTP ${response.status}`;
      if (response.ok) {
        const html = await response.text();
        if (
          html.includes('refinement.css')
          && html.includes('refinement.js')
          && html.includes(expectedTitle)
          && html.includes('max-image-preview:large')
          && html.includes('application/ld+json')
        ) {
          return;
        }
        lastStatus = 'SEO release markers not present yet';
      }
    } catch (error) {
      lastStatus = error.message;
    }

    console.log(`Live release not converged on attempt ${attempt}: ${lastStatus}`);
    await delay(10_000);
  }

  throw new Error(`Live release did not converge: ${lastStatus}`);
}

async function expectPublicResource(relativePath) {
  const response = await fetch(new URL(relativePath, baseURL), {cache: 'no-store'});
  assert.equal(response.status, 200, `${relativePath} should return HTTP 200`);
  return response;
}

await waitForRelease();
await expectPublicResource('refinement.css');
await expectPublicResource('refinement.js');
await expectPublicResource('assets/media/american-song-table-summer-2026.jpg');
await expectPublicResource('mobile-lead-sheet/');
const sitemapResponse = await expectPublicResource('sitemap.xml');
const sitemapText = await sitemapResponse.text();
assert.match(sitemapText, /<loc>https:\/\/workfolios\.github\.io\/american-song-table\/<\/loc>/);

const browser = await chromium.launch();

try {
  const desktopContext = await browser.newContext({viewport: {width: 1440, height: 900}});
  const desktopPage = await desktopContext.newPage();
  const localFailures = [];
  const pageErrors = [];

  desktopPage.on('requestfailed', (request) => {
    if (request.url().startsWith(baseURL) && !request.url().includes('/assets/media/audio/')) {
      localFailures.push(`${request.method()} ${request.url()}`);
    }
  });
  desktopPage.on('pageerror', (error) => pageErrors.push(error.message));

  await desktopPage.goto(baseURL, {waitUntil: 'networkidle'});
  await desktopPage.evaluate(() => document.fonts?.ready);
  assert.equal(await desktopPage.title(), expectedTitle);
  assert.equal(await desktopPage.locator('main#main-content').count(), 1);
  assert.equal(await desktopPage.locator('#ast-reading-progress').count(), 1);
  assert.equal(await desktopPage.locator('#contact-form').getAttribute('action'), 'https://formspree.io/f/mrenokqv');

  const seoState = await desktopPage.evaluate(() => {
    const metaContent = (selector) => document.querySelector(selector)?.getAttribute('content') || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const articleNode = document.querySelector('script[type="application/ld+json"]');
    const article = articleNode?.textContent ? JSON.parse(articleNode.textContent) : null;
    return {
      description: metaContent('meta[name="description"]'),
      robots: metaContent('meta[name="robots"]'),
      ogTitle: metaContent('meta[property="og:title"]'),
      twitterTitle: metaContent('meta[name="twitter:title"]'),
      canonical,
      article,
    };
  });

  assert.equal(seoState.description, expectedDescription);
  assert.equal(seoState.robots, 'index, follow, max-image-preview:large');
  assert.equal(seoState.ogTitle, expectedTitle);
  assert.equal(seoState.twitterTitle, expectedTitle);
  assert.equal(seoState.canonical, baseURL);
  assert.equal(seoState.article?.['@type'], 'Article');
  assert.equal(seoState.article?.headline, 'Half Smile Grace');
  assert.equal(seoState.article?.mainEntityOfPage?.['@id'], baseURL);

  // Live rendering can grow after the first bottom scroll as late layout work
  // settles. Recalculate the endpoint and re-scroll until the document height,
  // scroll position, and RO-005 progress value converge on the same final state.
  let liveState = null;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    await desktopPage.evaluate(() => {
      const root = document.scrollingElement || document.documentElement;
      const maxScroll = Math.max(root.scrollHeight - window.innerHeight, 0);
      window.scrollTo(0, maxScroll);
    });
    await desktopPage.waitForTimeout(150);

    liveState = await desktopPage.evaluate(() => {
      const root = document.scrollingElement || document.documentElement;
      const bar = document.querySelector('.ast-reading-progress__bar');
      const match = bar?.style.transform.match(/scaleX\(([-\d.]+)\)/);
      return {
        progress: match ? Number(match[1]) : 0,
        scrollTop: window.scrollY,
        maxScroll: Math.max(root.scrollHeight - window.innerHeight, 0),
      };
    });

    const atDocumentEnd = Math.abs(liveState.maxScroll - liveState.scrollTop) <= 2;
    if (atDocumentEnd && liveState.progress > 0.98) {
      break;
    }
  }

  assert.ok(liveState, 'Live document-end state should be measurable');
  assert.ok(
    Math.abs(liveState.maxScroll - liveState.scrollTop) <= 2,
    `Live page should reach the stabilized document end; scrollTop=${liveState.scrollTop}, maxScroll=${liveState.maxScroll}`,
  );
  assert.ok(liveState.progress > 0.98, `Live progress should reach the stabilized end; received ${liveState.progress}`);

  const heroImageLoaded = await desktopPage.locator('.hero-profile-img').evaluate((image) =>
    image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
  );
  assert.equal(heroImageLoaded, true);
  assert.deepEqual(localFailures, []);
  assert.deepEqual(pageErrors, []);

  await desktopPage.screenshot({path: path.join(evidenceRoot, 'live-desktop.png'), fullPage: false});
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: {width: 390, height: 844},
    hasTouch: true,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(baseURL, {waitUntil: 'networkidle'});

  const actionHeights = await mobilePage.locator('.ast-narration__external, .ast-media__download, .ast-media__external').evaluateAll((elements) =>
    elements.filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).map((element) => element.getBoundingClientRect().height),
  );
  assert.ok(actionHeights.length >= 6);
  assert.ok(actionHeights.every((height) => height >= 44), `Live touch targets should be >=44px: ${actionHeights.join(', ')}`);

  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `Live mobile page should not overflow horizontally; delta=${overflow}`);

  await mobilePage.locator('.ast-media').scrollIntoViewIfNeeded();
  await mobilePage.screenshot({path: path.join(evidenceRoot, 'live-mobile-media.png'), fullPage: false});

  await mobilePage.goto(new URL('mobile-lead-sheet/', baseURL).toString(), {waitUntil: 'networkidle'});
  assert.equal(await mobilePage.locator('main#lead-sheet-pages img').count(), 3);
  assert.equal(await mobilePage.getByRole('heading', {name: 'The Room Beside You'}).count(), 1);
  const mobileRobots = await mobilePage.locator('meta[name="robots"]').getAttribute('content');
  assert.equal(mobileRobots, 'noindex, follow');
  await mobilePage.screenshot({path: path.join(evidenceRoot, 'live-mobile-lead-sheet.png'), fullPage: false});
  await mobileContext.close();
} finally {
  await browser.close();
}

console.log(`Live smoke verification passed for ${baseURL}`);
