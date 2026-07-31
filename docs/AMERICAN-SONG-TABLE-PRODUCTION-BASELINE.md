# American Song Table — Production Baseline and Maintenance Runbook

**Repository:** `workfolios/american-song-table`  
**Published site:** `https://workfolios.github.io/american-song-table/`  
**Baseline established:** July 31, 2026  
**Status:** Stable production maintenance

## 1.0 Purpose

This document is the controlling production-baseline, recovery, and maintenance record for the American Song Table GitHub Pages website.

It applies only to this repository and website. It does not govern any other website, repository, or portfolio project.

## 2.0 Approved Production Baseline

The approved production presentation and functional baseline is anchored to:

- **Approved visual and functional baseline commit:** `891f57a701dd9abab44955451c7a83d8875f78e7`
- **Recovery branch:** `baseline/approved-production-2026-07-31`
- **DevOps QA guardrails:** Pull Request #5, `Add blocking DevOps browser QA guardrails`
- **Emergency restoration commit:** `6487b1ff2860ba2c49dbcbd441819fe1d324e8f0`

The responsive visual-rhythm experiment introduced through Pull Request #3 is rejected. Its production changes were fully rolled back through Pull Request #4.

The approved baseline includes:

- The editorial masthead, hero, article, media, inquiry form, and footer presentation
- The article narration and both song-version audio players
- The Lake Byron visualization and YouTube destinations
- The three-page PDF download
- The browser-viewable mobile lead-sheet image set
- The mobile-image ZIP download
- Social and text-message preview metadata
- Responsive desktop, tablet, and mobile behavior
- Blocking browser QA before GitHub Pages publication

## 3.0 Production Architecture

The site is a static Vite application deployed through GitHub Actions to GitHub Pages.

The deployment workflow:

1. Checks out the repository.
2. Installs locked application dependencies.
3. Validates approved publication assets and checksums.
4. Stages the PDF, ZIP, and extracted mobile JPG pages.
5. Builds the production site into `dist/`.
6. Injects approved social-preview metadata.
7. Injects approved mobile lead-sheet actions and viewer markup.
8. Verifies required production files and copy markers.
9. Installs the browser-QA runtime.
10. Runs Playwright and axe-core guardrails against the exact production artifact.
11. Uploads QA evidence.
12. Publishes to GitHub Pages only after the build job succeeds.

## 4.0 Blocking QA Controls

Future pull requests and production deployments must pass the existing browser-QA suite.

| Control | Blocking condition |
|---|---|
| Primary stylesheet | Missing, empty, non-CSS response, or not linked |
| Approved design field | Body does not render on `#020814` |
| Approved text field | Body text does not render in the approved ivory tone |
| Typography | Expected production font stack is not active |
| Hero structure | Hero no longer renders as the expected grid composition |
| Responsive integrity | Horizontal overflow occurs at a governed viewport |
| Editorial imagery | Masthead or hero image fails to load |
| Audio delivery | Any governed MP3 is missing, empty, or returned with an invalid media type |
| Lead-sheet delivery | PDF, ZIP, viewer, or any of the three JPG pages is unavailable |
| Mobile viewer | Viewer loses its approved dark presentation or develops overflow |
| Keyboard access | Skip link does not receive initial keyboard focus |
| Accessibility | A critical axe-core violation is detected |

Governed viewport classes:

- Desktop: `1440 × 900`
- Tablet: `768 × 1024`
- Mobile: `390 × 844`

## 5.0 Protected Public Endpoints

The following production endpoints are part of the baseline and must remain operational:

- Main website: `https://workfolios.github.io/american-song-table/`
- Mobile lead-sheet viewer: `https://workfolios.github.io/american-song-table/mobile-lead-sheet/`
- PDF: `https://workfolios.github.io/american-song-table/assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-guitar-chart.pdf`
- Mobile-image ZIP: `https://workfolios.github.io/american-song-table/assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-mobile-images.zip`

The workflow also protects the three extracted mobile JPG pages and the publication audio files.

## 6.0 Change-Control Standard

### 6.1 Nonvisual maintenance

Documentation, workflow hardening, test maintenance, dependency maintenance, and repository housekeeping may proceed through a pull request when they do not alter the published experience.

### 6.2 Visual or content changes

Any change to layout, spacing, typography, imagery, color, copy, CTA language, navigation, article structure, media presentation, or responsive behavior requires:

1. Explicit authorization from the project owner.
2. A dedicated branch and pull request.
3. Responsive evidence at desktop, tablet, and mobile sizes.
4. Review of the rendered artifact before merge.
5. A stated rollback target.
6. Successful blocking QA.

A production deployment must not be used as the preview environment for an unapproved visual experiment.

### 6.3 Media replacement

Any replacement publication file must include:

- Confirmed filename and public destination
- Updated checksum protection
- Successful local and browser QA
- Verification that links and social metadata still resolve

## 7.0 Emergency Recovery Protocol

When the live site presents an obvious visual, asset, or functional regression:

1. Freeze additional design or content changes.
2. Identify the most recent production-changing pull request.
3. Revert only the offending change through a dedicated rollback branch and pull request.
4. Preserve known-good media and download enhancements unless they are part of the defect.
5. Require the complete production build and browser-QA gate to pass.
6. Merge the rollback.
7. Confirm GitHub Pages deployment.
8. Verify the live site in a new or private browser session.
9. Record the incident and remediation in the applicable pull request.

The recovery branch `baseline/approved-production-2026-07-31` provides a fixed comparison point for the approved baseline.

## 8.0 QA Evidence and Retention

Each workflow run stores:

- Responsive screenshots
- Playwright HTML report
- Failure screenshots
- Browser traces
- Failure videos
- axe-core accessibility results

Evidence retention is set to 90 days. Important incident evidence should additionally be summarized in the corresponding pull request because GitHub Actions artifacts are not permanent records.

## 9.0 Known Residual Risks

The current controls materially reduce deployment risk but do not eliminate every failure mode.

| Residual risk | Current disposition |
|---|---|
| Browser-engine coverage | Chromium only; Safari and Firefox remain manual confirmation areas |
| Viewport coverage | Three representative classes; uncommon devices may still require manual review |
| Accessibility threshold | Critical violations block; lower-severity findings require review rather than automatic failure |
| Pixel-level drift | No approved-baseline pixel-diff gate is active |
| Live post-deployment probe | The workflow validates the deployable artifact before publication; the live URL is not yet re-tested after deployment |
| External services | YouTube, form delivery, and third-party font availability can change outside this repository |
| Post-build injection | Social metadata and mobile lead-sheet actions still rely on controlled build-time HTML injection |

These items are deferred maintenance opportunities, not authorization for automatic implementation.

## 10.0 Maintenance Posture

The website is now in stable production maintenance.

Permitted work is limited to:

- Defect correction
- Broken-link or media recovery
- Security and dependency maintenance
- QA-test maintenance
- Accessibility remediation
- Explicitly authorized editorial or design updates

No additional visual-rhythm optimization is pending.

## 11.0 Closeout Record

The current stabilization sequence is complete when:

- This baseline record is merged into `main`.
- The updated README accurately describes the production controls.
- The pull-request governance checklist is available.
- The full build and browser-QA workflow passes.
- GitHub Pages republishes the unchanged website artifact successfully.

After those conditions are satisfied, American Song Table remains an active published website under maintenance rather than an open-ended redesign project.
