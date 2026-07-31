# American Song Table — Summer 2026 Issue

This repository contains the static, responsive digital edition of the fictional American music magazine *American Song Table* (Summer 2026), presenting the feature story “Half Smile Grace” about the original song “The Room Beside You.”

## Design And System Features

- **Editorial Typography:** High-contrast serif typography paired with Inter for metadata and utility labels.
- **Continuous Page Background:** A single-page editorial flow on the approved `#020814` field.
- **Responsive Masthead:** The approved Summer 2026 issue masthead scales across desktop, tablet, and mobile.
- **Accessible Media:** Native HTML5 audio controls, keyboard-visible focus states, descriptive labels, and download actions.
- **Static Architecture:** No database, API key, server-side runtime, or environment variable is required.

## Local Development

```bash
npm ci
npm run dev
```

The local development server runs at `http://localhost:3000`.

## Production Build

```bash
npm run build
```

Vite writes the deployable site to `dist/`. The configuration uses fully relative paths so the site works at the GitHub Pages project URL:

`https://workfolios.github.io/american-song-table/`

## GitHub Pages Deployment

The repository is configured to validate pull requests and publish through GitHub Actions. The workflow at `.github/workflows/deploy-pages.yml` runs whenever `main` changes, when a pull request targets `main`, or when an authorized maintainer starts it manually.

The workflow:

1. Checks out the repository.
2. Installs the locked application dependencies.
3. Validates the approved publication assets and checksums.
4. Stages the PDF, ZIP, and extracted mobile lead-sheet JPG pages.
5. Runs the Vite production build.
6. Injects the approved social-preview metadata.
7. Injects the approved mobile lead-sheet actions and viewer.
8. Verifies the required production files and copy markers.
9. Runs blocking Playwright browser QA in desktop, tablet, and mobile viewports.
10. Verifies stylesheet delivery, approved computed styling, responsive overflow, imagery, MP3s, downloads, mobile-viewer assets, keyboard access, and critical axe-core accessibility results.
11. Uploads screenshots, reports, traces, videos, and accessibility evidence for 90 days.
12. Uploads and deploys `dist/` to the `github-pages` environment only after the complete build job succeeds.

Pull-request runs validate the deployable artifact but do not publish it.

## Production Baseline And Maintenance

The controlling project-specific production baseline and maintenance runbook is:

[`docs/AMERICAN-SONG-TABLE-PRODUCTION-BASELINE.md`](docs/AMERICAN-SONG-TABLE-PRODUCTION-BASELINE.md)

The approved recovery reference is:

`baseline/approved-production-2026-07-31`

The website is in stable production maintenance. Visual or content changes require explicit project-owner authorization, responsive evidence review, a stated rollback target, and successful blocking QA before merge.

## Pull Request Governance

`.github/pull_request_template.md` provides the required scope, protected-asset, QA-evidence, authorization, rollback, and residual-risk checklist for future changes.

A production deployment must not be used as the preview environment for an unapproved visual experiment.

## Publication Boundary

The repository includes only the approved public website assets:

- Article narration MP3
- Original song MP3
- Still Starlight version MP3
- Lake Byron visualization MP4
- Three-page lyric lead sheet / guitar chord chart PDF
- Mobile JPG image-set ZIP
- Approved editorial images

The excluded large visual-narration MP4 and high-resolution PNG lead-sheet masters are not part of this deployment package.

## Integrity Verification

`SHA256.txt` contains checksums for the deployed media, downloads, and editorial image assets. From the repository root:

```bash
sha256sum --check SHA256.txt
```
