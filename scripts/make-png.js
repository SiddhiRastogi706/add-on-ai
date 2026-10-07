const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // Truecolor RGB
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data: height scanlines, each line starts with filter byte 0
  const rowBytes = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowBytes);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crc = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeAndData, crcBuf]);
}

// Standard PNG CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const pubDir = path.resolve(__dirname, '../src/client/public');
const assetsDir = path.join(pubDir, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// 1. Logo (512x512, Royal Blue brand color)
fs.writeFileSync(path.join(pubDir, 'logo.png'), createPng(512, 512, 37, 99, 235));
console.log('Created logo.png');

// 2. OG Banner (1200x630, Slate Dark Blue brand color)
fs.writeFileSync(path.join(assetsDir, 'og-banner.png'), createPng(1200, 630, 15, 23, 42));
console.log('Created assets/og-banner.png');
