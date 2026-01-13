/* global Camera, FaceMesh */

const SCREENS = {
  WELCOME: "welcome",
  SCANNING: "scanning",
  RESULTS: "results",
  ERROR: "error",
};

const ANALYSIS_DURATION_MS = 9000;
const STATUS_MESSAGES = [
  "Scanne Hautprofil",
  "Vergleiche mit Datenbank",
  "Lichttemperatur kalibriert",
  "Porenstruktur erkannt",
  "Feuchtigkeitsschicht kartiert",
  "Roetungen klassifiziert",
  "Mikrotextur analysiert",
  "Talgverteilung modelliert",
  "Sensitivitaet bewertet",
  "Barrierestress berechnet",
];

const PRODUCT_IMAGE_MAP = [
  { match: ["cleanser", "reinigung"], src: "./images/cleanser.webp" },
  { match: ["serum", "niacinamid", "panthenol", "hydrating"], src: "./images/hydrating-serum.webp" },
  { match: ["creme", "cream", "barrier", "ceramide", "lotion", "pflege"], src: "./images/barrier-creme.webp" },
  { match: ["spf", "sonnenschutz", "uv"], src: "./images/spf-50-fluid.webp" },
];

const PROFILES = [
  {
    id: "trocken",
    subtitle: "Trocken & dehydriert - Fokus: Barriere + Feuchtigkeit",
    scores: [
      { name: "Feuchtigkeit", value: 38 },
      { name: "Barriere", value: 44 },
      { name: "Poren", value: 62 },
      { name: "Rötungen", value: 55 },
    ],
    tips: [
      "Reinigung ohne Duftstoffe (kein Quietschgefuehl).",
      "Feuchtigkeit zuerst: Hyaluron/Glycerin auf leicht feuchter Haut.",
      "Barriere-Creme abends als letzter Schritt, besonders im Winter.",
      "Taeglich SPF 30-50, auch bei Wolken.",
    ],
    routine: {
      morning: ["Milder Cleanser", "Feuchtigkeitsserum", "Barrierelotion", "SPF 50"],
      evening: ["Milder Cleanser", "Feuchtigkeitsserum", "Barriercreme"],
    },
    products: [
      {
        name: "Milder Cleanser (parfumfrei)",
        why: "Reinigt ohne die Hautbarriere zu stressen.",
        meta: "dm / Douglas",
      },
      {
        name: "Hydrating Serum (Hyaluron + Glycerin)",
        why: "Bindet Wasser, sorgt fuer pralleren Look.",
        meta: "dm",
      },
      {
        name: "Barrier-Creme (Ceramide)",
        why: "Unterstuetzt die Schutzbarriere ueber Nacht.",
        meta: "Douglas",
      },
      {
        name: "SPF 50 Fluid",
        why: "Schuetzt vor Photoaging & Irritationen.",
        meta: "dm / Douglas",
      },
    ],
  },
  {
    id: "unrein",
    subtitle: "Mischhaut mit Unreinheiten - Fokus: sanft klaeren",
    scores: [
      { name: "Talg/Glanz", value: 72 },
      { name: "Poren", value: 68 },
      { name: "Unreinheiten", value: 63 },
      { name: "Feuchtigkeit", value: 52 },
    ],
    tips: [
      "Nicht zu aggressiv reinigen - sonst mehr Nachfetten.",
      "2-3x pro Woche BHA (Salicylsaeure) langsam steigern.",
      "Leichte, nicht-komedogene Pflege (Gel/Fluid).",
      "SPF taeglich - auch bei aktiven Wirkstoffen.",
    ],
    routine: {
      morning: ["Gel-Cleanser", "Niacinamid-Serum", "Leichtes Fluid", "SPF 50"],
      evening: ["Gel-Cleanser", "BHA (2-3x/Woche)", "Leichte Pflege"],
    },
    products: [
      {
        name: "Gel-Cleanser",
        why: "Entfernt ueberschuessigen Talg ohne Reizung.",
        meta: "dm / Douglas",
      },
      {
        name: "Niacinamid Serum",
        why: "Wirkt ausgleichend, unterstuetzt Porenbild.",
        meta: "dm",
      },
      {
        name: "BHA Toner (2%)",
        why: "Hilft bei verstopften Poren (langsam steigern).",
        meta: "Douglas",
      },
      {
        name: "SPF 50 Gel-Fluid",
        why: "Mattes Finish, taeglicher Schutz.",
        meta: "dm / Douglas",
      },
    ],
  },
  {
    id: "sensibel",
    subtitle: "Sensibel & geroetet - Fokus: beruhigen + minimal",
    scores: [
      { name: "Roetungen", value: 71 },
      { name: "Sensitivitaet", value: 66 },
      { name: "Barriere", value: 49 },
      { name: "Feuchtigkeit", value: 57 },
    ],
    tips: [
      "Weniger Schritte, dafuer konsequent - Skinimalism.",
      "Parfumfrei & alkoholfrei priorisieren.",
      "Neue Produkte einzeln einfuehren (Patch-Test).",
      "Sonnenschutz als taeglicher Standard.",
    ],
    routine: {
      morning: [
        "Sehr milder Cleanser",
        "Beruhigendes Serum",
        "Creme (parfumfrei)",
        "SPF 50 (sensitiv)",
      ],
      evening: ["Sehr milder Cleanser", "Beruhigendes Serum", "Creme"],
    },
    products: [
      {
        name: "Sehr milder Cleanser (sensitiv)",
        why: "Reduziert Reizpotenzial.",
        meta: "dm",
      },
      {
        name: "Beruhigendes Serum (Panthenol)",
        why: "Beruhigt, unterstuetzt Regeneration.",
        meta: "Douglas",
      },
      {
        name: "Creme (parfumfrei)",
        why: "Okklusiv ohne viele Extras.",
        meta: "dm / Douglas",
      },
      {
        name: "SPF 50 (sensitiv)",
        why: "Schutz, oft besser vertraeglich.",
        meta: "dm / Douglas",
      },
    ],
  },
];

const dom = {
  app: document.getElementById("app"),
  video: document.getElementById("camera"),
  fx: document.getElementById("fx"),
  btnStartCamera: document.getElementById("btnStartCamera"),
  btnStartDemo: document.getElementById("btnStartDemo"),
  btnCancel: document.getElementById("btnCancel"),
  btnRescan: document.getElementById("btnRescan"),
  btnRetryCamera: document.getElementById("btnRetryCamera"),
  btnFallbackDemo: document.getElementById("btnFallbackDemo"),
  errorMessage: document.getElementById("errorMessage"),
  progressFill: document.getElementById("progressFill"),
  progressLabel: document.getElementById("progressLabel"),
  scanHint: document.getElementById("scanHint"),
  scanStatus: document.getElementById("scanStatus"),
  scanHud: document.querySelector(".scan-hud"),
  profileSubtitle: document.getElementById("profileSubtitle"),
  profileFocus: document.getElementById("profileFocus"),
  scanId: document.getElementById("scanId"),
  glowScoreRing: document.getElementById("glowScoreRing"),
  glowScoreValue: document.getElementById("glowScoreValue"),
  resultsTags: document.getElementById("resultsTags"),
  scores: document.getElementById("scores"),
  analysisSteps: document.getElementById("analysisSteps"),
  products: document.getElementById("products"),
};

const state = {
  screen: SCREENS.WELCOME,
  cameraMode: "none", // none | camera | demo
  preferredMode: "demo",
  scanningStartedAt: 0,
  profileIndex: 0,
  lastLandmarks: null,
  faceDetectedAt: 0,
  rafId: 0,
  camera: null,
  faceMesh: null,
  nextStatusSpawnAt: 0,
  statusIndex: 0,
  recentStatusMessages: [],
  activeStatusBubbles: [],
  smoothedCenter: { x: 0, y: 0 },
  smoothedRadius: 0,
  hasSmoothed: false,
  demoMaskPoints: null,
};

function setScreen(screen) {
  state.screen = screen;
  for (const node of document.querySelectorAll("[data-screen]")) {
    const isActive = node.getAttribute("data-screen") === screen;
    node.classList.toggle("is-hidden", !isActive);
  }
  dom.app.classList.toggle("is-scanning", screen === SCREENS.SCANNING);
  dom.app.classList.toggle("is-results", screen === SCREENS.RESULTS);
  if (screen !== SCREENS.SCANNING) {
    clearStatusBubbles();
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getProductImageSrc(productName) {
  const name = String(productName || "").toLowerCase();
  for (const { match, src } of PRODUCT_IMAGE_MAP) {
    if (match.some((key) => name.includes(key))) return src;
  }
  return null;
}

function computeCoverTransform(videoW, videoH, screenW, screenH) {
  const scale = Math.max(screenW / videoW, screenH / videoH);
  const drawW = videoW * scale;
  const drawH = videoH * scale;
  const offsetX = (screenW - drawW) / 2;
  const offsetY = (screenH - drawH) / 2;
  return { scale, offsetX, offsetY };
}

function getFaceBounds(landmarks) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  return { minX, minY, maxX, maxY };
}

function getMap() {
  const vw = dom.video.videoWidth || 1280;
  const vh = dom.video.videoHeight || 720;
  const cover = computeCoverTransform(vw, vh, window.innerWidth, window.innerHeight);
  const map = (nx, ny) => {
    const x = 1 - nx;
    const px = x * vw;
    const py = ny * vh;
    return {
      x: cover.offsetX + px * cover.scale,
      y: cover.offsetY + py * cover.scale,
    };
  };
  return { map, vw, vh, cover };
}

function getFaceCenterAndRadius(vw, vh, map, cover) {
  if (state.lastLandmarks) {
    const bounds = getFaceBounds(state.lastLandmarks);
    const centerNormX = (bounds.minX + bounds.maxX) / 2;
    const centerNormY = (bounds.minY + bounds.maxY) / 2;
    const center = map(centerNormX, centerNormY);
    const faceWpx = (bounds.maxX - bounds.minX) * vw;
    const faceHpx = (bounds.maxY - bounds.minY) * vh;
    const radius = Math.max(faceWpx, faceHpx) * 0.62 * cover.scale;
    return { center, radius };
  }
  return {
    center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    radius: Math.min(window.innerWidth, window.innerHeight) * 0.22,
  };
}

let dotSprite = null;
let dotSpriteDpr = 0;

function getDotSprite() {
  const dpr = window.devicePixelRatio || 1;
  if (dotSprite && dotSpriteDpr === dpr) return dotSprite;
  dotSpriteDpr = dpr;

  const size = Math.round(64 * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.22, "rgba(242,212,189,0.85)");
  g.addColorStop(0.55, "rgba(217,165,123,0.35)");
  g.addColorStop(1, "rgba(217,165,123,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  dotSprite = canvas;
  return canvas;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function getDemoMaskPoints() {
  if (state.demoMaskPoints) return state.demoMaskPoints;

  const rand = mulberry32(43117);
  const points = [];

  const outlineCount = 54;
  for (let i = 0; i < outlineCount; i += 1) {
    const a = (i / outlineCount) * Math.PI * 2;
    const x = Math.cos(a) * 0.86;
    const y = Math.sin(a) * 1.1 - 0.06;
    points.push({ x, y });
  }

  const count = 190;
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    let x = Math.cos(a) * r * 0.82;
    let y = Math.sin(a) * r * 1.05 - 0.06;
    const pinch = 1 - Math.max(0, y) * 0.22;
    x *= pinch;
    points.push({ x, y });
  }

  state.demoMaskPoints = points;
  return points;
}

function drawFx(nowMs) {
  const ctx = dom.fx.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (dom.fx.width !== w || dom.fx.height !== h) {
    dom.fx.width = w;
    dom.fx.height = h;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const isScanning = state.screen === SCREENS.SCANNING;
  if (!isScanning) return;

  const { map, vw, vh, cover } = getMap();
  const { center, radius } = getFaceCenterAndRadius(vw, vh, map, cover);

  if (state.cameraMode === "camera" && state.lastLandmarks) {
    const bounds = getFaceBounds(state.lastLandmarks);
    drawFaceMaskPoints(ctx, nowMs, map, center, radius, bounds);
    return;
  }

  drawDemoMaskPoints(ctx, nowMs, center, radius);
}

function getFocusPoint(stage, mapFn) {
  if (!state.lastLandmarks) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  const idx = stage === "kinn" ? 152 : stage === "stirn" ? 10 : -1;
  if (idx >= 0 && state.lastLandmarks[idx]) {
    const pt = state.lastLandmarks[idx];
    return mapFn(pt.x, pt.y);
  }
  const leftCheek = state.lastLandmarks[234];
  const rightCheek = state.lastLandmarks[454];
  if (!leftCheek || !rightCheek) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  const x = (leftCheek.x + rightCheek.x) / 2;
  const y = (leftCheek.y + rightCheek.y) / 2;
  return mapFn(x, y);
}

function drawScanRing(ctx, nowMs, center, radius) {
  const t = nowMs / 1000;
  const pulse = 0.04 + 0.02 * Math.sin(t * 2.2);
  const ringR = radius * (1 + pulse);

  ctx.save();
  ctx.shadowColor = "rgba(217,165,123,0.6)";
  ctx.shadowBlur = 24;
  ctx.strokeStyle = "rgba(240, 219, 204, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(center.x, center.y, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const angle = t * 2.6;
  const x2 = center.x + Math.cos(angle) * ringR;
  const y2 = center.y + Math.sin(angle) * ringR;

  ctx.save();
  const grad = ctx.createLinearGradient(center.x, center.y, x2, y2);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(217,165,123,0.95)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawFocusPulse(ctx, nowMs, focus) {
  const t = nowMs / 1000;
  const r = 10 + 6 * Math.sin(t * 5);

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(217,165,123,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFallbackScan(ctx, nowMs) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const center = { x: w / 2, y: h / 2 };
  const radius = Math.min(w, h) * 0.26;
  drawScanRing(ctx, nowMs, center, radius);
}

function drawScanline(ctx, left, right, opacity = 0.22) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = "rgba(217,165,123,0.35)";
  ctx.shadowBlur = 18;
  const grad = ctx.createLinearGradient(left.x, left.y, right.x, right.y);
  grad.addColorStop(0, "rgba(217,165,123,0)");
  grad.addColorStop(0.5, "rgba(242,212,189,0.6)");
  grad.addColorStop(1, "rgba(217,165,123,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.stroke();
  ctx.restore();
}

function drawFaceMaskPoints(ctx, nowMs, mapFn, center, radius, bounds) {
  const sprite = getDotSprite();
  const t = nowMs / 1000;
  const progress = clamp01((nowMs - state.scanningStartedAt) / ANALYSIS_DURATION_MS);
  const fadeIn = clamp01((nowMs - state.scanningStartedAt) / 650);

  const ySpan = Math.max(0.0001, bounds.maxY - bounds.minY);
  const lineY = bounds.minY + progress * ySpan;

  const left = mapFn(bounds.minX, lineY);
  const right = mapFn(bounds.maxX, lineY);
  drawScanline(ctx, left, right, 0.18);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const base = Math.max(5, radius * 0.018);
  const waveSpeed = 2.35;
  const waveFreq = 8.8;

  for (let i = 0; i < state.lastLandmarks.length; i += 3) {
    const pt = state.lastLandmarks[i];
    const p = mapFn(pt.x, pt.y);

    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const norm = dist / Math.max(radius, 1);

    const lineDist = Math.abs(pt.y - lineY) / ySpan;
    const scanBand = Math.exp(-(lineDist * lineDist) * 180);

    const ripple = (Math.sin(t * waveSpeed - norm * waveFreq) + 1) / 2;
    const twinkle = 0.88 + 0.12 * Math.sin(t * 6.1 + i * 0.27);

    const intensity = clamp01(0.12 + scanBand * 0.92 + ripple * 0.22) * twinkle;
    const alpha = fadeIn * (0.05 + intensity * 0.55);
    const size = base * (0.6 + intensity * 1.6);

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
  }

  ctx.restore();
}

function drawDemoMaskPoints(ctx, nowMs, center, radius) {
  const sprite = getDotSprite();
  const points = getDemoMaskPoints();

  const t = nowMs / 1000;
  const progress = clamp01((nowMs - state.scanningStartedAt) / ANALYSIS_DURATION_MS);
  const fadeIn = clamp01((nowMs - state.scanningStartedAt) / 650);

  let minY = Infinity;
  let maxY = -Infinity;
  for (const pt of points) {
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const ySpan = Math.max(0.0001, maxY - minY);
  const lineY = minY + progress * ySpan;

  const yScale = radius * 0.86;
  const xScale = radius * 1.05;
  drawScanline(
    ctx,
    { x: center.x - radius * 1.55, y: center.y + lineY * yScale },
    { x: center.x + radius * 1.55, y: center.y + lineY * yScale },
    0.14
  );

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const base = Math.max(6, radius * 0.02);
  const waveSpeed = 2.15;
  const waveFreq = 7.9;

  for (let i = 0; i < points.length; i += 1) {
    const pt = points[i];
    const px = center.x + pt.x * xScale;
    const py = center.y + pt.y * yScale;

    const dx = px - center.x;
    const dy = py - center.y;
    const norm = Math.sqrt(dx * dx + dy * dy) / Math.max(radius, 1);

    const lineDist = Math.abs(pt.y - lineY) / ySpan;
    const scanBand = Math.exp(-(lineDist * lineDist) * 160);
    const ripple = (Math.sin(t * waveSpeed - norm * waveFreq) + 1) / 2;
    const twinkle = 0.9 + 0.1 * Math.sin(t * 5.6 + i * 0.33);

    const intensity = clamp01(0.1 + scanBand * 0.9 + ripple * 0.2) * twinkle;
    const alpha = fadeIn * (0.045 + intensity * 0.5);
    const size = base * (0.55 + intensity * 1.6);

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
  }

  ctx.restore();
}

function clearStatusBubbles() {
  dom.scanStatus.innerHTML = "";
  state.activeStatusBubbles = [];
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function pickStatusMessage() {
  const maxAttempts = 7;
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = STATUS_MESSAGES[Math.floor(Math.random() * STATUS_MESSAGES.length)];
    if (!state.recentStatusMessages.includes(candidate)) {
      state.recentStatusMessages.unshift(candidate);
      state.recentStatusMessages = state.recentStatusMessages.slice(0, 5);
      return candidate;
    }
  }
  const fallback = STATUS_MESSAGES[state.statusIndex % STATUS_MESSAGES.length];
  state.statusIndex += 1;
  state.recentStatusMessages.unshift(fallback);
  state.recentStatusMessages = state.recentStatusMessages.slice(0, 5);
  return fallback;
}

function spawnStatusBubble(center, radius) {
  const message = pickStatusMessage();

  const wrap = document.createElement("div");
  wrap.className = "status-bubble-wrap";

  const bubble = document.createElement("div");
  bubble.className = "status-bubble";
  if (Math.random() < 0.24) bubble.dataset.tone = "accent";
  bubble.innerHTML = `<span class="bubble-dot" aria-hidden="true"></span><span class="bubble-text">${escapeHtml(message)}</span>`;
  wrap.appendChild(bubble);

  const angle = Math.random() * Math.PI * 2;
  const distance = radius * (1.25 + Math.random() * 0.9);
  let dx = Math.cos(angle) * distance;
  let dy = Math.sin(angle) * distance;

  const padding = 86;
  const targetX = center.x + dx;
  const targetY = center.y + dy;
  if (targetX < padding) dx += padding - targetX;
  if (targetX > window.innerWidth - padding) dx -= targetX - (window.innerWidth - padding);
  if (targetY < padding) dy += padding - targetY;
  if (targetY > window.innerHeight - padding) dy -= targetY - (window.innerHeight - padding);

  const driftX = -14 + Math.random() * 28;
  const driftY = -18 - Math.random() * 22;
  const life = Math.round(3000 + Math.random() * 1200);

  wrap.style.setProperty("--dx", `${dx}px`);
  wrap.style.setProperty("--dy", `${dy}px`);
  wrap.style.setProperty("--drift-x", `${driftX.toFixed(1)}px`);
  wrap.style.setProperty("--drift-y", `${driftY.toFixed(1)}px`);
  wrap.style.setProperty("--life", `${life}ms`);

  dom.scanStatus.appendChild(wrap);
  state.activeStatusBubbles.push(wrap);

  const maxBubbles = 7;
  while (state.activeStatusBubbles.length > maxBubbles) {
    const old = state.activeStatusBubbles.shift();
    old?.remove?.();
  }

  window.setTimeout(() => {
    const idx = state.activeStatusBubbles.indexOf(wrap);
    if (idx >= 0) state.activeStatusBubbles.splice(idx, 1);
    wrap.remove();
  }, life + 160);
}

function updateStatusBubbles(nowMs) {
  const { map, vw, vh, cover } = getMap();
  const { center, radius } = getFaceCenterAndRadius(vw, vh, map, cover);

  if (!state.hasSmoothed) {
    state.smoothedCenter = { x: center.x, y: center.y };
    state.smoothedRadius = radius;
    state.hasSmoothed = true;
  } else {
    const smooth = 0.14;
    state.smoothedCenter = {
      x: lerp(state.smoothedCenter.x, center.x, smooth),
      y: lerp(state.smoothedCenter.y, center.y, smooth),
    };
    state.smoothedRadius = lerp(state.smoothedRadius, radius, smooth);
  }

  dom.scanStatus.style.setProperty("--cx", `${state.smoothedCenter.x}px`);
  dom.scanStatus.style.setProperty("--cy", `${state.smoothedCenter.y}px`);

  const hudRect = dom.scanHud?.getBoundingClientRect?.();
  const hudW = Math.max(320, Math.min(520, hudRect?.width || 520));
  const hudH = Math.max(120, Math.min(260, hudRect?.height || 170));
  const pad = 18;

  const desiredHudX = state.smoothedCenter.x;
  const offsetY = Math.max(46, state.smoothedRadius * 0.48);
  const desiredBelowY = state.smoothedCenter.y + offsetY;
  const desiredAboveY = state.smoothedCenter.y - offsetY;

  const minHudX = hudW / 2 + pad;
  const maxHudX = window.innerWidth - hudW / 2 - pad;
  const clampedHudX = Math.max(minHudX, Math.min(maxHudX, desiredHudX));

  const minHudY = hudH / 2 + pad;
  const maxHudY = window.innerHeight - hudH / 2 - pad;

  const fitsBelow = desiredBelowY <= maxHudY;
  const candidateY = fitsBelow ? desiredBelowY : desiredAboveY;
  const clampedHudY = Math.max(minHudY, Math.min(maxHudY, candidateY));

  dom.app.style.setProperty("--hud-x", `${clampedHudX}px`);
  dom.app.style.setProperty("--hud-y", `${clampedHudY}px`);

  if (nowMs < state.nextStatusSpawnAt) return;
  state.nextStatusSpawnAt = nowMs + 650 + Math.random() * 520;

  spawnStatusBubble(state.smoothedCenter, state.smoothedRadius);
}

function stopVision() {
  try {
    state.camera?.stop?.();
  } catch {
    // ignore
  }
  state.camera = null;

  try {
    state.faceMesh?.close?.();
  } catch {
    // ignore
  }
  state.faceMesh = null;

  const stream = dom.video.srcObject;
  if (stream && typeof stream.getTracks === "function") {
    for (const track of stream.getTracks()) track.stop();
  }
  dom.video.srcObject = null;

  state.lastLandmarks = null;
  state.faceDetectedAt = 0;
}

async function startCameraAndVision() {
  if (typeof FaceMesh === "undefined" || typeof Camera === "undefined") {
    throw new Error(
      "FaceMesh konnte nicht geladen werden (kein Internet?). Starte den Demo-Modus."
    );
  }

  const faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults((results) => {
    const landmarks = results?.multiFaceLandmarks?.[0] || null;
    state.lastLandmarks = landmarks;
    if (landmarks) state.faceDetectedAt = performance.now();
  });

  const camera = new Camera(dom.video, {
    onFrame: async () => {
      await faceMesh.send({ image: dom.video });
    },
    width: 1280,
    height: 720,
  });

  state.faceMesh = faceMesh;
  state.camera = camera;

  await camera.start();
}

function beginScanning() {
  state.scanningStartedAt = performance.now();
  state.nextStatusSpawnAt = 0;
  state.statusIndex = Math.floor(Math.random() * STATUS_MESSAGES.length);
  state.recentStatusMessages = [];
  state.hasSmoothed = false;
  clearStatusBubbles();
  setScreen(SCREENS.SCANNING);
  dom.progressFill.style.width = "0%";
  dom.progressLabel.textContent = "0%";
  dom.scanHint.textContent =
    state.cameraMode === "camera"
      ? "Bitte schau in die Kamera und halte dein Gesicht im Sichtfeld."
      : "Demo-Modus: Ablauf ist hardcodiert (ohne Kamera).";
}

function getScore(profile, keywords, fallbackIndex = 0) {
  const lower = profile.scores.map((score) => ({
    name: score.name.toLowerCase(),
    value: score.value,
  }));
  for (const keyword of keywords) {
    const found = lower.find((score) => score.name.includes(keyword));
    if (found) return found.value;
  }
  return profile.scores[fallbackIndex]?.value ?? 60;
}

function describeScore(value, lowLabel, midLabel, highLabel) {
  if (value >= 70) return highLabel;
  if (value >= 55) return midLabel;
  return lowLabel;
}

function parseFocus(subtitle) {
  const match = subtitle.split("Fokus:");
  if (match.length > 1) return match[1].trim();
  return "Balance + Schutz";
}

function buildTags(profile) {
  const tags = [];

  const focus = parseFocus(profile.subtitle);
  const focusParts = focus
    .split(/[+&]/)
    .map((part) => part.trim())
    .filter(Boolean);
  tags.push(...focusParts);

  const weakest = profile.scores.reduce((acc, score) => (score.value < acc.value ? score : acc), {
    name: "",
    value: 101,
  });
  const key = String(weakest.name || "").toLowerCase();
  if (key.includes("feucht")) tags.push("Feuchtigkeit");
  else if (key.includes("barriere")) tags.push("Barriere");
  else if (key.includes("poren")) tags.push("Poren");
  else if (key.includes("roet") || key.includes("röt") || key.includes("rot")) tags.push("Rötungen");
  else if (key.includes("sens")) tags.push("Sensitivität");

  const unique = [];
  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === normalized)) {
      unique.push(tag);
    }
  }
  return unique.slice(0, 4);
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function animateValue(from, to, durationMs, onUpdate) {
  const start = performance.now();

  const frame = (now) => {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = easeOutCubic(t);
    const value = from + (to - from) * eased;
    onUpdate(value);
    if (t < 1) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function triggerResultsEntrance() {
  const root = document.querySelector('[data-screen="results"] .results-full');
  if (!root) return;
  root.classList.remove("is-entering");
  void root.offsetWidth;
  root.classList.add("is-entering");
}

function buildAnalysisSteps(profile) {
  const hydration = getScore(profile, ["feuchtigkeit"]);
  const barrier = getScore(profile, ["barriere"]);
  const pores = getScore(profile, ["poren"]);
  const redness = getScore(profile, ["roetungen", "sensitivitaet"]);

  return [
    {
      title: "Feuchtigkeitsmatrix",
      copy: `${hydration}% - ${describeScore(hydration, "unter Zielbereich", "ausbalanciert", "sehr hoch")}`,
      meta: describeScore(hydration, "niedrig", "mittel", "hoch"),
    },
    {
      title: "Barriere-Check",
      copy: `${barrier}% - ${describeScore(barrier, "leicht geschwaecht", "stabil", "sehr stabil")}`,
      meta: describeScore(barrier, "sensitiv", "stabil", "robust"),
    },
    {
      title: "Poren & Textur",
      copy: `${pores}% - ${describeScore(pores, "fein", "sichtbar", "betont")}`,
      meta: describeScore(pores, "glatt", "strukturiert", "aktiv"),
    },
    {
      title: "Roetungen/Stress",
      copy: `${redness}% - ${describeScore(redness, "ruhig", "reaktiv", "sensitiv")}`,
      meta: describeScore(redness, "ruhig", "reaktiv", "sensitiv"),
    },
  ];
}

function renderResults(profile) {
  dom.profileSubtitle.textContent = profile.subtitle;
  const focus = parseFocus(profile.subtitle);
  dom.profileFocus.textContent = focus;
  dom.scanId.textContent = `GM-${String(Date.now()).slice(-4)}`;

  if (dom.glowScoreRing && dom.glowScoreValue) {
    const avg =
      profile.scores.reduce((sum, score) => sum + (Number(score.value) || 0), 0) /
      Math.max(1, profile.scores.length);
    const target = Math.round(avg);
    dom.glowScoreRing.style.setProperty("--p", "0");
    dom.glowScoreRing.setAttribute("aria-label", `Glow Score ${target}%`);
    dom.glowScoreValue.textContent = "0";
    animateValue(0, target, 920, (value) => {
      dom.glowScoreRing.style.setProperty("--p", value.toFixed(1));
      dom.glowScoreValue.textContent = String(Math.round(value));
    });
  }

  if (dom.resultsTags) {
    dom.resultsTags.innerHTML = "";
    const tags = buildTags(profile);
    tags.forEach((tag, index) => {
      const el = document.createElement("div");
      el.className = "tag";
      el.style.setProperty("--i", String(index));
      el.textContent = tag;
      dom.resultsTags.appendChild(el);
    });
  }

  dom.scores.innerHTML = "";
  profile.scores.forEach((score, index) => {
    const row = document.createElement("div");
    row.className = "score";
    row.style.setProperty("--i", String(index));
    row.innerHTML = `
      <div class="score-name">${escapeHtml(score.name)}</div>
      <div class="score-bar"><div class="score-fill" data-value="${score.value}"></div></div>
      <div class="score-value">${score.value}%</div>
    `;
    dom.scores.appendChild(row);
    const fill = row.querySelector(".score-fill");
    if (fill) {
      const value = Number(score.value) || 0;
      requestAnimationFrame(() => {
        fill.style.width = `${value}%`;
      });
    }
  });

  dom.analysisSteps.innerHTML = "";
  const steps = buildAnalysisSteps(profile);
  steps.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "analysis-step";
    item.style.setProperty("--i", String(index));
    item.innerHTML = `
      <div class="step-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <div class="step-title">${escapeHtml(step.title)}</div>
        <div class="step-copy">${escapeHtml(step.copy)}</div>
      </div>
      <div class="step-meta">${escapeHtml(step.meta)}</div>
    `;
    dom.analysisSteps.appendChild(item);
  });

  dom.products.innerHTML = "";
  profile.products.forEach((product, index) => {
    const imgSrc = getProductImageSrc(product.name);
    const card = document.createElement("div");
    card.className = "product";
    card.style.setProperty("--i", String(index));
    card.innerHTML = `
      <div class="product-icon" aria-hidden="true">
        ${
          imgSrc
            ? `<img class="product-icon-img" src="${imgSrc}" alt="" loading="lazy" decoding="async" />`
            : ""
        }
      </div>
      <div>
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-why">${escapeHtml(product.why)}</div>
      </div>
      <div class="product-meta">${escapeHtml(product.meta)}</div>
    `;
    dom.products.appendChild(card);
  });
}

function showResults(profile) {
  stopVision();
  state.cameraMode = "none";
  setScreen(SCREENS.RESULTS);
  renderResults(profile);
  triggerResultsEntrance();
}

function setError(message) {
  dom.errorMessage.textContent = message;
  setScreen(SCREENS.ERROR);
}

function tick(nowMs) {
  if (state.screen === SCREENS.SCANNING) {
    const progress = clamp01((nowMs - state.scanningStartedAt) / ANALYSIS_DURATION_MS);
    const percent = Math.round(progress * 100);
    dom.progressFill.style.width = `${percent}%`;
    dom.progressLabel.textContent = `${percent}%`;

    if (state.cameraMode === "camera") {
      const lastSeenAgo = nowMs - state.faceDetectedAt;
      if (!state.faceDetectedAt || lastSeenAgo > 650) {
        dom.scanHint.textContent = "Gesicht nicht erkannt - bitte naeher zur Kamera.";
      } else {
        dom.scanHint.textContent = "Perfekt - bitte stillhalten.";
      }
    }

    updateStatusBubbles(nowMs);

    if (progress >= 1) {
      const profile = PROFILES[state.profileIndex % PROFILES.length];
      showResults(profile);
      state.profileIndex = (state.profileIndex + 1) % PROFILES.length;
    }
  }

  drawFx(nowMs);
  state.rafId = requestAnimationFrame(tick);
}

async function startPreferredScan() {
  if (state.preferredMode === "camera") {
    stopVision();
    state.cameraMode = "camera";
    try {
      await startCameraAndVision();
      beginScanning();
      return;
    } catch {
      stopVision();
      state.cameraMode = "demo";
      state.preferredMode = "demo";
    }
  }

  stopVision();
  state.cameraMode = "demo";
  beginScanning();
}

function initButtons() {
  dom.btnStartDemo.addEventListener("click", () => {
    stopVision();
    state.cameraMode = "demo";
    state.preferredMode = "demo";
    beginScanning();
  });

  dom.btnStartCamera.addEventListener("click", async () => {
    stopVision();
    state.cameraMode = "camera";
    state.preferredMode = "camera";
    try {
      await startCameraAndVision();
      beginScanning();
    } catch (err) {
      stopVision();
      state.cameraMode = "none";
      setError(String(err?.message || err));
    }
  });

  dom.btnCancel.addEventListener("click", () => {
    stopVision();
    state.cameraMode = "none";
    setScreen(SCREENS.WELCOME);
  });

  dom.btnRescan.addEventListener("click", () => {
    startPreferredScan();
  });

  dom.btnRetryCamera.addEventListener("click", async () => {
    stopVision();
    state.cameraMode = "camera";
    state.preferredMode = "camera";
    try {
      await startCameraAndVision();
      beginScanning();
    } catch (err) {
      stopVision();
      state.cameraMode = "none";
      setError(String(err?.message || err));
    }
  });

  dom.btnFallbackDemo.addEventListener("click", () => {
    stopVision();
    state.cameraMode = "demo";
    state.preferredMode = "demo";
    beginScanning();
  });
}

function start() {
  setScreen(SCREENS.WELCOME);
  initButtons();
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(tick);
}

start();
