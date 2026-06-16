/**
 * convert-images.mjs
 * Converts all JPG/PNG images in ../img/ to WebP and saves them to
 * public/catalog-images/, named item_001.webp, item_002.webp, etc.
 * in chronological order (by filename timestamp).
 *
 * Usage: node scripts/convert-images.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR  = path.resolve(__dirname, '../../img');
const OUT_DIR  = path.resolve(__dirname, '../public/catalog-images');
const MAX_WIDTH = 1200;
const QUALITY   = 85;

// ── Ensure output directory exists ─────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Get and sort image files ────────────────────────────────────────────────
const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];
const files = fs
  .readdirSync(SRC_DIR)
  .filter(f => EXTS.includes(path.extname(f).toLowerCase()))
  .sort(); // sort alphabetically = chronological for IMG_timestamp filenames

if (files.length === 0) {
  console.error(`❌ No images found in ${SRC_DIR}`);
  process.exit(1);
}

console.log(`\n🏺 Porcelanas Image Converter`);
console.log(`   Source : ${SRC_DIR}`);
console.log(`   Output : ${OUT_DIR}`);
console.log(`   Found  : ${files.length} images\n`);

// ── Convert each file ───────────────────────────────────────────────────────
const results = [];

for (let i = 0; i < files.length; i++) {
  const srcFile  = path.join(SRC_DIR, files[i]);
  const outName  = `item_${String(i + 1).padStart(3, '0')}.webp`;
  const outFile  = path.join(OUT_DIR, outName);
  const num      = String(i + 1).padStart(3, ' ');

  process.stdout.write(`  [${num}/${files.length}] ${files[i].padEnd(45)} → ${outName}  `);

  try {
    const info = await sharp(srcFile)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outFile);

    const srcSize = fs.statSync(srcFile).size;
    const outSize = info.size;
    const savings = Math.round((1 - outSize / srcSize) * 100);

    console.log(`✓  ${(srcSize / 1024).toFixed(0)} KB → ${(outSize / 1024).toFixed(0)} KB  (-${savings}%)`);
    results.push({ original: files[i], webp: outName, srcKB: srcSize / 1024, outKB: outSize / 1024, savings });
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
const totalSrcKB = results.reduce((s, r) => s + r.srcKB, 0);
const totalOutKB = results.reduce((s, r) => s + r.outKB, 0);
const totalSavings = Math.round((1 - totalOutKB / totalSrcKB) * 100);

console.log('\n─────────────────────────────────────────────────────────');
console.log(`✅ Done! ${results.length} images converted`);
console.log(`   Total original : ${(totalSrcKB / 1024).toFixed(1)} MB`);
console.log(`   Total WebP     : ${(totalOutKB / 1024).toFixed(1)} MB`);
console.log(`   Space saved    : ${totalSavings}%`);
console.log(`\n📁 Files ready in: ${OUT_DIR}`);
console.log(`\nNext steps:`);
console.log(`   1. Go to http://localhost:5173/admin`);
console.log(`   2. The images are now served at /catalog-images/item_001.webp etc.`);
console.log(`   3. Use the Admin panel to group them into catalog items\n`);

// ── Write a mapping file for reference ──────────────────────────────────────
const mapping = results.map((r, i) => ({
  index: i + 1,
  webpName: r.webp,
  originalName: r.original,
  path: `/catalog-images/${r.webp}`,
}));
fs.writeFileSync(
  path.join(OUT_DIR, '_mapping.json'),
  JSON.stringify(mapping, null, 2)
);
console.log(`📋 Filename mapping saved to: ${OUT_DIR}/_mapping.json`);
