import {readFileSync, writeFileSync} from 'node:fs';

const indexPath = 'dist/index.html';
let html = readFileSync(indexPath, 'utf8');

const metadata = `
  <link rel="canonical" href="https://workfolios.github.io/american-song-table/">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="American Song Table">
  <meta property="og:title" content="Half Smile Grace | The Room Beside You">
  <meta property="og:description" content="An American Song Table cover story on The Room Beside You, shaped by restraint, Lake Byron memory, quiet strength, and the warmth of an American story-song.">
  <meta property="og:url" content="https://workfolios.github.io/american-song-table/">
  <meta property="og:image" content="https://workfolios.github.io/american-song-table/assets/images/editorial/american-song-table-summer-2026.jpg">
  <meta property="og:image:secure_url" content="https://workfolios.github.io/american-song-table/assets/images/editorial/american-song-table-summer-2026.jpg">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1086">
  <meta property="og:image:height" content="1448">
  <meta property="og:image:alt" content="American Song Table Summer 2026 magazine cover featuring the Half Smile Grace story about The Room Beside You.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Half Smile Grace | The Room Beside You">
  <meta name="twitter:description" content="American Song Table — Summer 2026.">
  <meta name="twitter:image" content="https://workfolios.github.io/american-song-table/assets/images/editorial/american-song-table-summer-2026.jpg">
  <meta name="twitter:image:alt" content="American Song Table Summer 2026 magazine cover featuring the Half Smile Grace story about The Room Beside You.">`;

if (!html.includes('property="og:image"')) {
  html = html.replace('</head>', `${metadata}\n</head>`);
}

writeFileSync(indexPath, html);
