import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'public', 'favicon.svg'));
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const tasks = [
  { size: 192, file: 'icon-192.png', bg: '#FFF7ED', pad: 0 },
  { size: 512, file: 'icon-512.png', bg: '#FFF7ED', pad: 0 },
  { size: 512, file: 'icon-maskable-512.png', bg: '#9A3412', pad: 0.18 },
  { size: 180, file: 'apple-touch-icon.png', bg: '#FFF7ED', pad: 0 },
];

for (const t of tasks) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  const icon = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: {
      width: t.size,
      height: t.size,
      channels: 4,
      background: t.bg,
    },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toFile(join(outDir, t.file));
  console.log('wrote', t.file);
}
