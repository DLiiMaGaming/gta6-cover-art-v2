// Vice Coast Cover Lab v2 — editor + screenshot/selftest driver (written fresh).
import { GRADES, LAYOUTS, LAYOUT_LABELS, SIZES, CROPS, drawCover, defaultState, defaultCrop, panelCount } from './render.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const state = defaultState();
let selectedPanel = 0;
let lastPanels = [];
let pageErrors = 0;
window.addEventListener('error', () => { pageErrors++; });
window.__pageErrors = 0;

function sizeOf() {
  return SIZES[$('sizeSel').value] || SIZES.square;
}

function renderPreview() {
  const canvas = $('preview');
  const s = sizeOf();
  const st = { ...state, W: s.w, H: s.h };
  lastPanels = drawCover(canvas, st);
  $('panelInfo').textContent = `Panel ${selectedPanel + 1}/${lastPanels.length} — ${LAYOUT_LABELS[state.layout]} — ${panelCount(state.layout)} panels`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(f));
    state.photos.push(img);
  }
  if (!state.crops.length) state.crops = CROPS.slice();
  renderPreview();
  updateThumbRow();
}

function updateThumbRow() {
  const row = $('thumbs');
  row.innerHTML = '';
  state.photos.forEach((img, i) => {
    const t = document.createElement('canvas');
    t.width = 72; t.height = 72;
    const c = t.getContext('2d');
    const s = Math.max(72 / img.naturalWidth, 72 / img.naturalHeight);
    c.drawImage(img, (72 - img.naturalWidth * s) / 2, (72 - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    t.title = `Photo ${i + 1}`;
    t.onclick = () => { state.photos.splice(i, 1); updateThumbRow(); renderPreview(); };
    row.appendChild(t);
  });
  $('photoCount').textContent = state.photos.length ? `${state.photos.length} photo(s) loaded — click a thumb to remove` : 'No photos yet — using sample photos below';
}

function applyCropPreset(i) {
  const rect = lastPanels[selectedPanel];
  if (!rect) return;
  const base = CROPS[i % CROPS.length];
  state.crops[selectedPanel] = { ...base };
  renderPreview();
}

function bindEditor() {
  const fileInput = $('fileInput');
  $('uploadBtn').onclick = () => fileInput.click();
  fileInput.onchange = (e) => addFiles([...e.target.files]);
  $('dropZone').ondragover = (e) => { e.preventDefault(); $('dropZone').classList.add('over'); };
  $('dropZone').ondragleave = () => $('dropZone').classList.remove('over');
  $('dropZone').ondrop = (e) => { e.preventDefault(); $('dropZone').classList.remove('over'); addFiles([...e.dataTransfer.files]); };

  const layoutSel = $('layoutSel');
  LAYOUTS.forEach((l) => {
    const o = document.createElement('option');
    o.value = l; o.textContent = LAYOUT_LABELS[l];
    layoutSel.appendChild(o);
  });
  layoutSel.value = state.layout;
  layoutSel.onchange = () => { state.layout = layoutSel.value; selectedPanel = 0; renderPreview(); };

  const gradeSel = $('gradeSel');
  Object.entries(GRADES).forEach(([k, g]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = g.name;
    gradeSel.appendChild(o);
  });
  gradeSel.value = state.grade;
  gradeSel.onchange = () => { state.grade = gradeSel.value; renderPreview(); };

  const sizeSel = $('sizeSel');
  Object.entries(SIZES).forEach(([k, s]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = s.label;
    sizeSel.appendChild(o);
  });
  sizeSel.value = 'square';
  sizeSel.onchange = renderPreview;

  $('titleInput').value = state.title;
  $('titleInput').oninput = (e) => { state.title = e.target.value; renderPreview(); };
  $('subInput').value = state.subtitle;
  $('subInput').oninput = (e) => { state.subtitle = e.target.value; renderPreview(); };
  $('badgeInput').value = state.badge;
  $('badgeInput').oninput = (e) => { state.badge = e.target.value; renderPreview(); };
  $('spreadChk').checked = state.spread;
  $('spreadChk').onchange = (e) => { state.spread = e.target.checked; renderPreview(); };
  $('tiltChk').checked = state.tilt;
  $('tiltChk').onchange = (e) => { state.tilt = e.target.checked; renderPreview(); };

  const cropRow = $('cropRow');
  CROPS.forEach((c, i) => {
    const b = document.createElement('button');
    b.textContent = `C${i + 1}`;
    b.title = `Crop ${i + 1}: fx ${c.fx} fy ${c.fy} zoom ${c.zoom}`;
    b.onclick = () => applyCropPreset(i);
    cropRow.appendChild(b);
  });
  $('zoomRange').oninput = (e) => {
    const rect = lastPanels[selectedPanel];
    if (!rect) return;
    const cur = state.crops[selectedPanel] || defaultCrop(rect);
    state.crops[selectedPanel] = { ...cur, zoom: parseFloat(e.target.value) };
    renderPreview();
  };

  // Drag a panel to pan its photo; wheel zooms the selected panel.
  const canvas = $('preview');
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    const idx = lastPanels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (idx >= 0) {
      selectedPanel = idx;
      drag = { x, y, rect: lastPanels[idx] };
      canvas.setPointerCapture(e.pointerId);
      renderPreview();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    const cur = state.crops[selectedPanel] || defaultCrop(drag.rect);
    const nx = Math.min(1, Math.max(0, cur.fx + (x - drag.x) / drag.rect.w));
    const ny = Math.min(1, Math.max(0, cur.fy + (y - drag.y) / drag.rect.h));
    state.crops[selectedPanel] = { ...cur, fx: nx, fy: ny };
    drag.x = x; drag.y = y;
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = lastPanels[selectedPanel];
    if (!rect) return;
    const cur = state.crops[selectedPanel] || defaultCrop(rect);
    const z = Math.min(2.5, Math.max(1, cur.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    state.crops[selectedPanel] = { ...cur, zoom: z };
    $('zoomRange').value = String(z);
    renderPreview();
  }, { passive: false });

  $('exportBtn').onclick = () => exportSize(sizeOf(), 'vice-coast-cover');
  $('exportAllBtn').onclick = async () => {
    for (const [key, s] of Object.entries(SIZES)) {
      exportSize(s, `vice-coast-cover-${key}`);
      await new Promise((r) => setTimeout(r, 350));
    }
  };
  $('sampleBtn').onclick = loadSamples;
}

function exportSize(s, name) {
  const off = document.createElement('canvas');
  drawCover(off, { ...state, W: s.w, H: s.h });
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${s.w}x${s.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

async function loadSamples() {
  try {
    const a = await loadImage('samples/boulevard.jpg');
    const b = await loadImage('samples/pier.jpg');
    state.photos = [a, b];
    state.crops = CROPS.slice();
    updateThumbRow();
    renderPreview();
  } catch (err) {
    pageErrors++;
  }
}

// Full-bleed cover mode for screenshots (?shot=cover) and selftest.
async function coverMode() {
  document.body.classList.add('cover-mode');
  state.layout = params.get('layout') || 'nine';
  state.grade = params.get('grade') || 'vice-pink';
  state.tilt = params.get('tilt') === '1';
  state.title = params.get('title') || 'VICE COAST';
  state.subtitle = params.get('subtitle') || 'Welcome to the Coast';
  state.badge = params.get('badge') || 'EST. 2026';
  state.spread = true;
  const sizeKey = params.get('size') || 'wide';
  const s = SIZES[sizeKey] || SIZES.wide;
  await loadSamplesForCover();
  const canvas = $('coverCanvas');
  drawCover(canvas, { ...state, W: s.w, H: s.h });
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  if (params.get('selftest') === '1') await runSelftest();
}

async function loadSamplesForCover() {
  const a = await loadImage('samples/boulevard.jpg');
  const b = await loadImage('samples/pier.jpg');
  state.photos = [a, b];
  state.crops = CROPS.slice();
}

async function runSelftest() {
  const results = [];
  let errors = pageErrors;
  for (const [key, s] of Object.entries(SIZES)) {
    try {
      const off = document.createElement('canvas');
      drawCover(off, { ...state, W: s.w, H: s.h });
      const ctx = off.getContext('2d');
      const px = ctx.getImageData(Math.floor(s.w / 2), Math.floor(s.h / 2), 1, 1).data;
      const blank = px[3] === 0;
      const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
      results.push({ size: `${s.w}x${s.h}`, bytes: blob ? blob.size : 0, blank });
      if (blank || !blob || blob.size < 1000) errors++;
    } catch (err) {
      errors++;
      results.push({ size: `${s.w}x${s.h}`, bytes: 0, blank: true, error: String(err) });
    }
  }
  window.__pageErrors = pageErrors;
  const ok = errors === 0 && results.every((r) => !r.blank && r.bytes > 1000);
  window.__selftest = { ok, errors, results };
  const el = $('selftest-result');
  el.textContent = ok
    ? `SELFTEST OK ${results.map((r) => `${r.size}:${r.bytes}B`).join(' ')} errors=0`
    : `SELFTEST FAIL errors=${errors} ${JSON.stringify(results)}`;
  el.dataset.ok = ok ? '1' : '0';
  document.title = el.textContent;
}

async function init() {
  if (params.get('shot') === 'cover') {
    await coverMode();
    return;
  }
  bindEditor();
  if (params.get('shot') === 'editor') {
    await loadSamples();
    // Keep the Export panel in view: editor layout already fits 1600x1600.
  } else {
    renderPreview();
    updateThumbRow();
  }
}

init();
