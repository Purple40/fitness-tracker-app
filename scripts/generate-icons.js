/**
 * Generates minimal valid PNG icons for the PWA manifest.
 * Uses only Node.js built-ins (zlib) — no extra dependencies needed.
 * Run: node scripts/generate-icons.js
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// FitTrack brand color: #e11d48 = rgb(225, 29, 72)
const R = 225, G = 29, B = 72;

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([len, typeBuffer, data, crcBuf]);
}

function createPNG(size) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit-depth=8, color-type=2 (RGB), compress=0, filter=0, interlace=0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build raw scanlines: filter-byte(0) + RGB pixels
  // Add a simple rounded-corner effect: corners are white, center is brand color
  const rows = [];
  const radius = Math.floor(size * 0.22); // ~22% corner radius

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      // Check if pixel is inside rounded rectangle
      const dx = Math.max(0, Math.max(radius - x, x - (size - 1 - radius)));
      const dy = Math.max(0, Math.max(radius - y, y - (size - 1 - radius)));
      const inside = (dx * dx + dy * dy) <= (radius * radius);

      const offset = 1 + x * 3;
      if (inside) {
        row[offset]     = R;
        row[offset + 1] = G;
        row[offset + 2] = B;
      } else {
        // Outside rounded corner → transparent-ish (white background)
        row[offset]     = 255;
        row[offset + 1] = 255;
        row[offset + 2] = 255;
      }
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const png = createPNG(size);
  const outPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✓ Created icon-${size}x${size}.png (${png.length} bytes)`);
});

console.log('\nAll icons generated in public/icons/');
