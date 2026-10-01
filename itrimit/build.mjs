// Bundles src/ into one self-contained page. Outputs:
//   dist/iTrimIt.html        standalone file (zip it, send it, open it on the phone)
//   dist/web/                installable web app folder (host anywhere, Add to Home screen)
//   preview/index.html       body-only page for the Artifact preview
//
// `node build.mjs --apk` builds dist/web for the Android app: same page, no service worker
// (the APK already ships every file, and a worker would only serve stale copies after updates).
//
// Fonts are self-hosted from @fontsource so the app looks right offline:
// files in dist/web/fonts/, inlined as data URIs in the single-file outputs.
import { build } from 'esbuild';
import sharp from 'sharp';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';

const FOR_APK = process.argv.includes('--apk');

const FONTS = [
  { pkg: 'barlow', weights: [400, 600, 700] },
  { pkg: 'barlow-condensed', weights: [600, 700, 800] },
];
const FONT_SUBSETS = ['latin', 'latin-ext']; // latin-ext carries the macrons in te reo Māori place names

// ── fonts ────────────────────────────────────────────────

/** Every woff2 file the app needs, with the @font-face rule that loads it. */
async function fontFaces() {
  const faces = [];
  for (const { pkg, weights } of FONTS) {
    for (const weight of weights) {
      const css = await readFile(`node_modules/@fontsource/${pkg}/${weight}.css`, 'utf8');
      for (const subset of FONT_SUBSETS) faces.push(fontFace(css, `${pkg}-${subset}-${weight}-normal`, pkg));
    }
  }
  return faces;
}

/** Pull one subset's @font-face out of a fontsource stylesheet, keeping only its woff2 source. */
function fontFace(css, fileStem, pkg) {
  const rule = css.split('@font-face').find((block) => block.includes(`${fileStem}.woff2`));
  if (!rule) throw new Error(`No @font-face for ${fileStem}`);
  const file = `${fileStem}.woff2`;
  const body = rule.slice(rule.indexOf('{') + 1, rule.indexOf('}'))
    .replace(/src:[^;]+;/, 'src: url(__FONT_URL__) format(\'woff2\');');
  return { file, path: `node_modules/@fontsource/${pkg}/files/${file}`, rule: `@font-face {${body}}` };
}

/** @font-face CSS, with each font's URL chosen by `urlFor(face)`. */
async function fontCss(faces, urlFor) {
  const rules = await Promise.all(faces.map(async (face) => face.rule.replace('__FONT_URL__', await urlFor(face))));
  return rules.join('\n');
}

const fontFileUrl = (face) => `fonts/${face.file}`;
const fontDataUrl = async (face) => `data:font/woff2;base64,${(await readFile(face.path)).toString('base64')}`;

// ── page ─────────────────────────────────────────────────

const { outputFiles } = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020',
});
const js = outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const appCss = await readFile('src/styles.css', 'utf8');
const svg = await readFile('icon.svg');
const png = (size) => sharp(svg).resize(size, size).png().toBuffer();
const icon192 = `data:image/png;base64,${(await png(192)).toString('base64')}`;
const faces = await fontFaces();
const inlineFonts = await fontCss(faces, fontDataUrl);
const linkedFonts = await fontCss(faces, fontFileUrl);

const head = ({ fonts, extra = '' }) => `<title>iTrimIt</title>
<meta name="theme-color" content="#142419">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" href="${icon192}">
<link rel="apple-touch-icon" href="${icon192}">
${extra}<style>${fonts}\n${appCss}</style>`;

const body = `<div id="app"></div>\n<script>${js}</script>`;
const page = (headOptions, bodyEnd = '') => `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head(headOptions)}
</head>
<body>
${body}
${bodyEnd}</body>
</html>
`;

await mkdir('dist/web/fonts', { recursive: true });
await mkdir('preview', { recursive: true });

await writeFile('dist/iTrimIt.html', page({ fonts: inlineFonts }));
await writeFile('preview/index.html', `${head({ fonts: inlineFonts })}\n${body}\n`);

// ── installable web app (and the APK's web assets) ───────

const manifest = {
  name: 'iTrimIt', short_name: 'iTrimIt', start_url: './', scope: './', display: 'standalone',
  orientation: 'portrait', background_color: '#eef1e8', theme_color: '#142419',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
const fontFiles = faces.map(fontFileUrl);
const serviceWorker = `const CACHE='itrimit-${Date.now()}';
const FILES=${JSON.stringify(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', ...fontFiles])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('index.html'))))});
`;
const registerWorker = `<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js')</script>\n`;

const webHead = { fonts: linkedFonts, extra: '<link rel="manifest" href="manifest.webmanifest">\n' };
await writeFile('dist/web/index.html', page(webHead, FOR_APK ? '' : registerWorker));
await writeFile('dist/web/manifest.webmanifest', JSON.stringify(manifest, null, 2));
await writeFile('dist/web/icon-192.png', await png(192));
await writeFile('dist/web/icon-512.png', await png(512));
await Promise.all(faces.map(async (face) => writeFile(`dist/web/${fontFileUrl(face)}`, await readFile(face.path))));
if (FOR_APK) await rm('dist/web/sw.js', { force: true });
else await writeFile('dist/web/sw.js', serviceWorker);

console.log('built', (js.length / 1024).toFixed(1) + 'KB js', FOR_APK ? '(apk: no service worker)' : '');
