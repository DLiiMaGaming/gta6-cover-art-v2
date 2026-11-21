// Vice Coast Cover Lab v2 — cover renderer (written fresh in this session).
// Draws multi-panel GTA-style poster covers on a canvas: sky + scanlines,
// photo panels with face-safe focus, a full sun disc, and a title band.

export const GRADES = {
  'vice-pink':   { name: 'Vice Pink',   skyTop: '#2b1055', skyBot: '#ff2e88', sun: '#ffd166', band: '#12041f', gold: '#ffd166', title: '#ffffff', sub: '#ffd166', badge: '#ff2e88', tint: '#ff2e88', tintA: 0.14 },
  'teal-dusk':   { name: 'Teal Dusk',   skyTop: '#062a33', skyBot: '#0fb5a6', sun: '#ffe9a8', band: '#03161a', gold: '#7ef0e0', title: '#ffffff', sub: '#7ef0e0', badge: '#0fb5a6', tint: '#0fb5a6', tintA: 0.13 },
  'sunset-gold': { name: 'Sunset Gold', skyTop: '#3a0d2e', skyBot: '#ff7a18', sun: '#fff3b0', band: '#1c060f', gold: '#ffb703', title: '#fff8e7', sub: '#ffb703', badge: '#ff7a18', tint: '#ff7a18', tintA: 0.15 },
  'palm-noir':   { name: 'Palm Noir',   skyTop: '#0b0b12', skyBot: '#3d3d5c', sun: '#f5f0ff', band: '#050508', gold: '#c9c9ff', title: '#ffffff', sub: '#c9c9ff', badge: '#5c5c8a', tint: '#5c5c8a', tintA: 0.12 },
  'neon-vice':   { name: 'Neon Vice',   skyTop: '#12002e', skyBot: '#00e5ff', sun: '#ff00e5', band: '#0a0018', gold: '#00e5ff', title: '#ffffff', sub: '#00e5ff', badge: '#ff00e5', tint: '#00e5ff', tintA: 0.13 },
  'coral-heat':  { name: 'Coral Heat',  skyTop: '#4a0e0e', skyBot: '#ff5e3a', sun: '#ffe66d', band: '#200505', gold: '#ffe66d', title: '#fff6ec', sub: '#ffe66d', badge: '#ff5e3a', tint: '#ff5e3a', tintA: 0.15 },
  'midnight-palm': { name: 'Midnight Palm', skyTop: '#020617', skyBot: '#1e3a8a', sun: '#fde68a', band: '#010409', gold: '#93c5fd', title: '#ffffff', sub: '#93c5fd', badge: '#1e3a8a', tint: '#1e3a8a', tintA: 0.14 },
};

export const LAYOUTS = ['nine', 'hero', 'duo', 'triptych', 'strip', 'poster'];

export const LAYOUT_LABELS = {
  nine: 'Nine Panel',
  hero: 'Hero Split',
  duo: 'Duo',
  triptych: 'Triptych',
  strip: 'Film Strip',
  poster: 'Poster',
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

// Nine face-safe crops: fx across, fy kept high (0.20-0.30) so faces survive.
export const CROPS = [
  { fx: 0.30, fy: 0.20, zoom: 1.08 }, { fx: 0.50, fy: 0.20, zoom: 1.08 }, { fx: 0.70, fy: 0.20, zoom: 1.08 },
  { fx: 0.30, fy: 0.25, zoom: 1.12 }, { fx: 0.50, fy: 0.25, zoom: 1.12 }, { fx: 0.70, fy: 0.25, zoom: 1.12 },
  { fx: 0.30, fy: 0.30, zoom: 1.16 }, { fx: 0.50, fy: 0.30, zoom: 1.16 }, { fx: 0.70, fy: 0.30, zoom: 1.16 },
];

export function defaultCrop(rect) {
  const wide = rect.w / rect.h > 1.15;
  return { fx: 0.5, fy: wide ? 0.22 : 0.35, zoom: 1.05 };
}

// Panel rectangles for a layout, inside the area above the title band.
export function layoutPanels(layout, W, H, bandH, gap) {
  const top = 0;
  const bottom = H - bandH;
  const ah = bottom - top;
  const g = gap;
  const inset = (x, y, w, h) => ({ x, y, w, h });
  if (layout === 'nine') {
    const cw = (W - g * 4) / 3;
    const ch = (ah - g * 4) / 3;
    const out = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        out.push(inset(g + c * (cw + g), g + r * (ch + g), cw, ch));
    return out;
  }
  if (layout === 'hero') {
    const hw = (W - g * 3) * 0.56;
    const rx = g + hw + g;
    const rw = W - rx - g;
    const cw = (rw - g) / 2;
    const ch = (ah - g * 3) / 2;
    return [
      inset(g, g, hw, ah - g * 2),
      inset(rx, g, cw, ch), inset(rx + cw + g, g, cw, ch),
      inset(rx, g + ch + g, cw, ch), inset(rx + cw + g, g + ch + g, cw, ch),
    ];
  }
  if (layout === 'duo') {
    const cw = (W - g * 3) / 2;
    return [inset(g, g, cw, ah - g * 2), inset(g * 2 + cw, g, cw, ah - g * 2)];
  }
  if (layout === 'triptych') {
    const cw = (W - g * 4) / 3;
    return [0, 1, 2].map((i) => inset(g + i * (cw + g), g, cw, ah - g * 2));
  }
  if (layout === 'strip') {
    const cw = (W - g * 5) / 4;
    return [0, 1, 2, 3].map((i) => inset(g + i * (cw + g), g, cw, ah - g * 2));
  }
  // poster: one full-bleed panel
  return [inset(g, g, W - g * 2, ah - g * 2)];
}

export function panelCount(layout) {
  return layoutPanels(layout, 100, 100, 16, 2).length;
}

function drawPhotoCover(ctx, img, rect, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * crop.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = Math.min(1, Math.max(0, crop.fx));
  const fy = Math.min(1, Math.max(0, crop.fy));
  const dx = rect.x + (rect.w - dw) * fx;
  const dy = rect.y + (rect.h - dh) * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawSun(ctx, W, H, grade) {
  const cx = 0.86 * W;
  const cy = 0.15 * H;
  const r = 0.13 * Math.min(W, H);
  const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
  glow.addColorStop(0, grade.sun + 'cc');
  glow.addColorStop(1, grade.sun + '00');
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grade.sun;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#ffffff55';
  ctx.stroke();
  ctx.restore();
}

function drawScanlines(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  ctx.restore();
}

function drawTitleBand(ctx, W, H, bandH, grade, title, subtitle, badge) {
  const y = H - bandH;
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, y, W, bandH);
  ctx.fillStyle = grade.gold;
  ctx.fillRect(0, y, W, Math.max(2, bandH * 0.03));
  const cx = W / 2;
  const titleSize = bandH * 0.46;
  const subSize = bandH * 0.17;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.title;
  ctx.font = `${titleSize}px Anton, sans-serif`;
  const ty = y + bandH * 0.40;
  ctx.fillText(title.toUpperCase(), cx, ty, W * 0.94);
  if (subtitle) {
    ctx.fillStyle = grade.sub;
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillText(subtitle, cx, y + bandH * 0.78, W * 0.9);
  }
  if (badge) {
    ctx.font = `bold ${Math.max(10, bandH * 0.11)}px Anton, sans-serif`;
    const bw = ctx.measureText(badge.toUpperCase()).width + bandH * 0.28;
    const bh = bandH * 0.24;
    const bx = W - bw - bandH * 0.18;
    const by = y + bandH * 0.14;
    ctx.fillStyle = grade.badge;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badge.toUpperCase(), bx + bw / 2, by + bh / 2 + 1);
  }
  ctx.restore();
}

// state: { photos: HTMLImageElement[], layout, grade, title, subtitle, badge,
//           crops: [{fx,fy,zoom}], spread: bool, tilt: bool, W, H }
export function drawCover(canvas, state) {
  const W = state.W;
  const H = state.H;
  canvas.width = W;
  canvas.height = H;
  const grade = GRADES[state.grade] || GRADES['vice-pink'];
  const ctx = canvas.getContext('2d');
  const bandH = Math.round(H * 0.17);
  const gap = Math.max(4, Math.round(Math.min(W, H) * 0.008));

  // Offscreen pass so `tilt` can rotate the whole composition.
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const o = off.getContext('2d');

  const sky = o.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(1, grade.skyBot);
  o.fillStyle = sky;
  o.fillRect(0, 0, W, H);
  drawScanlines(o, W, H);

  const panels = layoutPanels(state.layout, W, H, bandH, gap);
  const photos = state.photos && state.photos.length ? state.photos : [];
  panels.forEach((rect, i) => {
    o.save();
    o.fillStyle = '#1a1030';
    o.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (photos.length) {
      const img = state.spread ? photos[i % photos.length] : photos[0];
      const crop = (state.crops && state.crops[i]) || defaultCrop(rect);
      drawPhotoCover(o, img, rect, crop);
      o.fillStyle = grade.tint;
      o.globalAlpha = grade.tintA;
      o.fillRect(rect.x, rect.y, rect.w, rect.h);
      o.globalAlpha = 1;
    } else {
      o.fillStyle = grade.tint;
      o.globalAlpha = 0.25;
      o.fillRect(rect.x, rect.y, rect.w, rect.h);
      o.globalAlpha = 1;
      o.fillStyle = '#ffffff88';
      o.font = `${Math.max(12, rect.h * 0.09)}px Anton, sans-serif`;
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillText('DROP PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    o.strokeStyle = grade.gold;
    o.globalAlpha = 0.85;
    o.lineWidth = Math.max(1.5, Math.min(W, H) * 0.002);
    o.strokeRect(rect.x, rect.y, rect.w, rect.h);
    o.restore();
  });

  // Sun AFTER scanlines and panels: the disc stays whole.
  drawSun(o, W, H, grade);
  drawTitleBand(o, W, H, bandH, grade, state.title || 'VICE COAST', state.subtitle || '', state.badge || '');

  ctx.save();
  if (state.tilt) {
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.045);
    ctx.drawImage(off, -W / 2, -H / 2);
  } else {
    ctx.drawImage(off, 0, 0);
  }
  ctx.restore();
  return panels;
}

export function defaultState() {
  return {
    photos: [],
    layout: 'nine',
    grade: 'vice-pink',
    title: 'VICE COAST',
    subtitle: 'Welcome to the Coast',
    badge: 'EST. 2026',
    crops: CROPS.slice(),
    spread: true,
    tilt: false,
    W: 1080,
    H: 1080,
  };
}
