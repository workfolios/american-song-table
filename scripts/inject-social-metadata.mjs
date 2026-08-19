import {readFileSync, writeFileSync} from 'node:fs';

const indexPath = 'dist/index.html';
let html = readFileSync(indexPath, 'utf8');

const pageTitle = 'Half Smile Grace: The Room Beside You | American Song Table';
const pageDescription = 'American Song Table’s Summer 2026 cover story on The Room Beside You, a living legacy tribute to Karen Sunderman rooted in Lake Byron, South Dakota.';
const canonicalURL = 'https://workfolios.github.io/american-song-table/';
const socialImageURL = `${canonicalURL}assets/media/american-song-table-summer-2026.jpg`;

html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${pageDescription}">`,
);

if (!html.includes('name="robots"')) {
  html = html.replace(
    '<meta name="theme-color" content="#020814">',
    '<meta name="theme-color" content="#020814">\n  <meta name="robots" content="index, follow, max-image-preview:large">',
  );
}

const metadata = `
  <link rel="canonical" href="${canonicalURL}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="American Song Table">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:url" content="${canonicalURL}">
  <meta property="og:image" content="${socialImageURL}">
  <meta property="og:image:secure_url" content="${socialImageURL}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1086">
  <meta property="og:image:height" content="1448">
  <meta property="og:image:alt" content="American Song Table Summer 2026 magazine cover featuring the Half Smile Grace story about The Room Beside You.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${pageDescription}">
  <meta name="twitter:image" content="${socialImageURL}">
  <meta name="twitter:image:alt" content="American Song Table Summer 2026 magazine cover featuring the Half Smile Grace story about The Room Beside You.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Half Smile Grace",
    "alternativeHeadline": "How The Room Beside You finds its power in restraint, place, and Karen Sunderman’s quiet strength.",
    "description": "${pageDescription}",
    "image": ["${socialImageURL}"],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${canonicalURL}"
    },
    "inLanguage": "en-US"
  }
  </script>`;

const refinementAssets = `
  <link rel="stylesheet" href="./refinement.css">
  <script defer src="./refinement.js"></script>`;

if (!html.includes('property="og:image"')) {
  html = html.replace('</head>', `${metadata}\n</head>`);
}

if (!html.includes('refinement.css')) {
  html = html.replace('</head>', `${refinementAssets}\n</head>`);
}

writeFileSync(indexPath, html);
