// Vice Coast Cover Lab v2 — screenshot driver (written fresh in this session).
// Serves app/ on localhost, captures 4 screenshots with the headless shell,
// then downscales them with PIL so every file fits the gate caps
// (long side <= 1280, short side >= 480, <= 256 KiB).
import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const appDir = join(root, 'app');
const shotDir = join(root, 'screenshots');
const rawDir = join(root, '.shots-raw');
const shell = join(process.env.HOME, '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.txt': 'text/plain' };

function serve() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        let p = decodeURIComponent(url.pathname);
        if (p === '/') p = '/index.html';
        const file = join(appDir, p);
        if (!file.startsWith(appDir)) { res.writeHead(403); res.end(); return; }
        const data = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404); res.end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

function run(cmd, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', rejectRun);
    child.on('exit', (code) => (code === 0 ? resolveRun() : rejectRun(new Error(`${cmd} exited ${code}`))));
  });
}

function shot(url, w, h, out) {
  return run(shell, [
    `--screenshot=${out}`, `--window-size=${w},${h}`, '--hide-scrollbars',
    '--no-sandbox', '--virtual-time-budget=12000', '--disable-gpu', url,
  ]);
}

const SHOTS = [
  { name: '1-cover-nine-vice-pink.jpg', q: 'shot=cover&layout=nine&grade=vice-pink&size=wide&title=VICE%20COAST&subtitle=Welcome%20to%20the%20Coast', w: 1920, h: 1080, tw: 1280, th: 720 },
  { name: '2-editor-nine-vice-pink.jpg', q: 'shot=editor', w: 1600, h: 1600, tw: 1280, th: 1280 },
  { name: '3-cover-portrait-teal-dusk.jpg', q: 'shot=cover&layout=nine&grade=teal-dusk&size=portrait&title=TEAL%20DUSK&subtitle=Neon%20Nights', w: 1080, h: 1350, tw: 1024, th: 1280 },
  { name: '4-cover-tilt-gold.jpg', q: 'shot=cover&layout=hero&grade=sunset-gold&size=square&tilt=1&title=GOLDEN%20HOUR&subtitle=Sunset%20Strip', w: 1080, h: 1080, tw: 1080, th: 1080 },
];

const server = await serve();
const port = server.address().port;
await mkdir(rawDir, { recursive: true });
try {
  for (const s of SHOTS) {
    const raw = join(rawDir, s.name.replace('.jpg', '.png'));
    await shot(`http://127.0.0.1:${port}/index.html?${s.q}`, s.w, s.h, raw);
    console.log('captured', raw);
  }
} finally {
  server.close();
}

// Downscale with PIL: one tiny inline script, target sizes from SHOTS.
const py = `
import sys
from PIL import Image
jobs = ${JSON.stringify(SHOTS.map((s) => [join(rawDir, s.name.replace('.jpg', '.png')), join(shotDir, s.name), s.tw, s.th]))}
for src, dst, tw, th in jobs:
    im = Image.open(src).convert('RGB')
    im = im.resize((tw, th), Image.LANCZOS)
    q = 88
    while True:
        im.save(dst, 'JPEG', quality=q)
        import os
        if os.path.getsize(dst) <= 256 * 1024 or q <= 55:
            break
        q -= 8
    print(dst, im.size, os.path.getsize(dst), 'bytes q=', q)
`;
await mkdir(shotDir, { recursive: true });
await new Promise((resolvePy, rejectPy) => {
  execFile('python3', ['-c', py], { stdio: 'inherit' }, (err) => (err ? rejectPy(err) : resolvePy()));
});
const files = await readdir(shotDir);
console.log('screenshots:', files.sort().join(', '));
