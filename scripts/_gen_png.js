'use strict';
// Dev-only: rasterize the SVGs to PNG (marketplace icon + README hero). No browser.
//   npm i -D @resvg/resvg-js && node scripts/_gen_png.js
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

function render(svgPath, outPath, width) {
  const r = new Resvg(fs.readFileSync(svgPath), { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } });
  fs.writeFileSync(outPath, r.render().asPng());
  console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes');
}

const root = path.join(__dirname, '..');
render(path.join(root, 'icon.svg'), path.join(root, 'icon.png'), 256);
render(path.join(root, 'docs', 'hero.svg'), path.join(root, 'docs', 'screenshot.png'), 1640);
