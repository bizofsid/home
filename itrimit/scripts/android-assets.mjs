// Generates the Android launcher icons (adaptive + legacy) and splash images from icon.svg.
// Run after `npx cap add android`; safe to re-run whenever icon.svg changes.
//
// Adaptive icon: the artwork (icon.svg minus its background square) is the foreground layer,
// scaled into the 72dp safe zone of the 108dp canvas; the background layer is a flat colour.
import sharp from 'sharp';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const RES = 'android/app/src/main/res';
const BACKGROUND = '#142419';
const MONOCHROME = '#ffffff';

const DENSITIES = [
  { name: 'mdpi', scale: 1 },
  { name: 'hdpi', scale: 1.5 },
  { name: 'xhdpi', scale: 2 },
  { name: 'xxhdpi', scale: 3 },
  { name: 'xxxhdpi', scale: 4 },
];
const LEGACY_DP = 48;
const ADAPTIVE_DP = 108;
const SAFE_ZONE_DP = 72;

const svg = await readFile('icon.svg', 'utf8');
const BACKGROUND_RECT = /<rect width="512" height="512"[^>]*\/>/;
if (!BACKGROUND_RECT.test(svg)) throw new Error('icon.svg: expected a full-size background <rect>');

/** The artwork with no background square, optionally recoloured to one flat colour. */
function artworkSvg(color) {
  const art = svg.replace(BACKGROUND_RECT, '');
  return color ? art.replace(/fill="#[0-9a-fA-F]{3,6}"/g, `fill="${color}"`) : art;
}

/** Artwork centred in a transparent square, filling `artShare` of its width. */
async function paddedArtwork(size, artShare, color) {
  const artSize = Math.round(size * artShare);
  const art = await sharp(Buffer.from(artworkSvg(color))).resize(artSize, artSize).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** Full icon (with background) clipped to a circle, for ic_launcher_round. */
async function roundIcon(size) {
  const circle = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
  return sharp(Buffer.from(svg)).resize(size, size).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
}

/** Splash: the artwork on the brand background, sized to a third of the short side. */
async function splash(width, height) {
  const art = await paddedArtwork(Math.round(Math.min(width, height) / 3), 1);
  return sharp({ create: { width, height, channels: 4, background: BACKGROUND } })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function writeLauncherIcons() {
  const safeShare = SAFE_ZONE_DP / ADAPTIVE_DP;
  for (const { name, scale } of DENSITIES) {
    const dir = `${RES}/mipmap-${name}`;
    const legacy = Math.round(LEGACY_DP * scale);
    const adaptive = Math.round(ADAPTIVE_DP * scale);
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/ic_launcher.png`, await sharp(Buffer.from(svg)).resize(legacy, legacy).png().toBuffer());
    await writeFile(`${dir}/ic_launcher_round.png`, await roundIcon(legacy));
    await writeFile(`${dir}/ic_launcher_foreground.png`, await paddedArtwork(adaptive, safeShare));
    await writeFile(`${dir}/ic_launcher_monochrome.png`, await paddedArtwork(adaptive, safeShare, MONOCHROME));
  }
}

async function writeAdaptiveXml() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;
  await writeFile(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, xml);
  await writeFile(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, xml);
  await writeFile(`${RES}/values/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BACKGROUND}</color>
</resources>
`);
  // Capacitor's placeholder vector layers; the mipmaps above replace them.
  await rm(`${RES}/drawable/ic_launcher_background.xml`, { force: true });
  await rm(`${RES}/drawable-v24`, { recursive: true, force: true });
}

/** Overwrite every splash.png the template ships, keeping each one's size. */
async function writeSplashes() {
  const dirs = (await readdir(RES)).filter((dir) => dir.startsWith('drawable'));
  for (const dir of dirs) {
    const file = `${RES}/${dir}/splash.png`;
    const meta = await sharp(file).metadata().catch(() => null);
    if (meta) await writeFile(file, await splash(meta.width, meta.height));
  }
}

await writeLauncherIcons();
await writeAdaptiveXml();
await writeSplashes();
console.log('android icons and splash written');
