import {readFileSync, writeFileSync} from 'node:fs';

const indexPath = 'dist/index.html';
let html = readFileSync(indexPath, 'utf8');

const stylesheet = '<link rel="stylesheet" href="visual-rhythm.css">';

if (!html.includes(stylesheet)) {
  html = html.replace('</head>', `  ${stylesheet}\n</head>`);
}

writeFileSync(indexPath, html);
