import {readFileSync, writeFileSync} from 'node:fs';

const indexPath = 'dist/index.html';
let html = readFileSync(indexPath, 'utf8');

const currentMarkup = `          <div class="ast-media__actions ast-media__actions--downloads">
            <div class="ast-media__pdf-set">
              <a class="ast-media__download" href="assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-guitar-chart.pdf" download>Download Three-Page PDF</a>
              <p class="ast-media__supporting">For desktop-viewing.</p>
            </div>

            <div class="ast-media__mobile-set">
              <a class="ast-media__download" href="assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-mobile-images.zip" download>Download Mobile Image Set</a>
              <p class="ast-media__supporting">For mobile or tablet device-viewing. Ideal for text message sharing.</p>
            </div>
          </div>`;

const enhancedMarkup = `          <div class="ast-media__actions ast-media__actions--downloads">
            <div class="ast-media__pdf-set">
              <a class="ast-media__download" href="assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-guitar-chart.pdf" download>Download Three-Page PDF</a>
              <p class="ast-media__supporting">For desktop viewing, printing, reading, or saving as one complete document.</p>
            </div>

            <div class="ast-media__mobile-set">
              <a class="ast-media__download" href="mobile-lead-sheet/">View Mobile Image Set</a>
              <p class="ast-media__supporting">Open the three mobile-formatted pages directly in your browser.</p>
              <p class="ast-media__supporting">
                <a class="ast-media__external" href="assets/downloads/lead-sheet/the-room-beside-you-lyric-lead-sheet-mobile-images.zip" download>Download All Mobile Images (.ZIP)</a><br>
                Download the complete JPG image set for offline storage or transfer.
              </p>
            </div>
          </div>`;

if (!html.includes(currentMarkup)) {
  throw new Error('Lead-sheet download markup was not found; no changes were written.');
}

html = html.replace(currentMarkup, enhancedMarkup);
writeFileSync(indexPath, html);
