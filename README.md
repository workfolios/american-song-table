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

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the site whenever `main` changes. In repository settings, select **Settings → Pages → Build and deployment → Source → GitHub Actions**.

The workflow:

1. Checks out the repository.
2. Installs the locked npm dependencies.
3. Runs the Vite production build.
4. Uploads `dist/` as the Pages artifact.
5. Deploys the artifact to the `github-pages` environment.

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
