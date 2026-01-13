/* global Camera, FaceMesh */

const SCREENS = {
  WELCOME: "welcome",
  SCANNING: "scanning",
  RESULTS: "results",
  ERROR: "error",
};

const ANALYSIS_DURATION_MS = 9000;

const PROFILES = [
  {
    id: "trocken",
    subtitle: "Trocken & dehydriert – Fokus: Barriere + Feuchtigkeit",
    scores: [
      { name: "Feuchtigkeit", value: 38 },
      { name: "Barriere", value: 44 },
      { name: "Poren", value: 62 },
      { name: "Rötungen", value: 55 },
    ],
    tips: [
      "Reinigung ohne Duftstoffe (kein “Quietschgefühl”).",
      "Feuchtigkeit zuerst: Hyaluron/Glycerin auf leicht feuchter Haut.",
      "Barriere-Creme abends als letzter Schritt, besonders im Winter.",
      "Täglich SPF 30–50, auch bei Wolken.",
    ],
    routine: {
      morning: [
        "Milder Cleanser",
        "Feuchtigkeitsserum",
        "Barrierelotion",
        "SPF 50",
      ],
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
        why: "Bindet Wasser, sorgt für pralleren Look.",
        meta: "dm",
      },
      {
        name: "Barrier-Creme (Ceramide)",
        why: "Unterstützt die Schutzbarriere über Nacht.",
        meta: "Douglas",
      },
      {
        name: "SPF 50 Fluid",
        why: "Schützt vor Photoaging & Irritationen.",
        meta: "dm / Douglas",
      },
    ],
  },
  {
    id: "unrein",
    subtitle: "Mischhaut mit Unreinheiten – Fokus: sanft klären",
    scores: [
      { name: "Talg/Glanz", value: 72 },
      { name: "Poren", value: 68 },
      { name: "Unreinheiten", value: 63 },
      { name: "Feuchtigkeit", value: 52 },
    ],
    tips: [
      "Nicht zu aggressiv reinigen – sonst mehr Nachfetten.",
      "2–3× pro Woche BHA (Salicylsäure) langsam steigern.",
      "Leichte, nicht-komedogene Pflege (Gel/Fluid).",
      "SPF täglich – auch bei aktiven Wirkstoffen.",
    ],
    routine: {
      morning: ["Gel-Cleanser", "Niacinamid-Serum", "Leichtes Fluid", "SPF 50"],
      evening: ["Gel-Cleanser", "BHA (2–3×/Woche)", "Leichte Pflege"],
    },
    products: [
      {
        name: "Gel-Cleanser",
        why: "Entfernt überschüssigen Talg ohne Reizung.",
        meta: "dm / Douglas",
      },
      {
        name: "Niacinamid Serum",
        why: "Wirkt ausgleichend, unterstützt Porenbild.",
        meta: "dm",
      },
      {
        name: "BHA Toner (2%)",
        why: "Hilft bei verstopften Poren (langsam steigern).",
        meta: "Douglas",
      },
      {
        name: "SPF 50 Gel-Fluid",
        why: "Mattes Finish, täglicher Schutz.",
        meta: "dm / Douglas",
      },
    ],
  },
  {
    id: "sensibel",
    subtitle: "Sensibel & gerötet – Fokus: beruhigen + minimal",
    scores: [
      { name: "Rötungen", value: 71 },
      { name: "Sensitivität", value: 66 },
      { name: "Barriere", value: 49 },
      { name: "Feuchtigkeit", value: 57 },
    ],
    tips: [
      "Weniger Schritte, dafür konsequent – “Skinimalism”.",
      "Parfumfrei & alkoholfrei priorisieren.",
      "Neue Produkte einzeln einführen (Patch-Test).",
      "Sonnenschutz als täglicher Standard.",
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
        why: "Beruhigt, unterstützt Regeneration.",
        meta: "Douglas",
      },
      {
        name: "Creme (parfumfrei)",
        why: "Okklusiv ohne viele Extras.",
        meta: "dm / Douglas",
      },
      {
        name: "SPF 50 (sensitiv)",
        why: "Schutz, oft besser verträglich.",
        meta: "dm / Douglas",
      },
    ],
  },
];

const dom = {
  video: document.getElementById("camera"),
  fx: document.getElementById("fx"),
  statusChip: document.getElementById("statusChip"),
  btnFullscreen: document.getElementById("btnFullscreen"),

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

  profileSubtitle: document.getElementById("profileSubtitle"),
  routineMorning: document.getElementById("routineMorning"),
  routineEvening: document.getElementById("routineEvening"),
  tipsList: document.getElementById("tipsList"),
  scores: document.getElementById("scores"),
  products: document.getElementById("products"),
};

const state = {
  screen: SCREENS.WELCOME,
  cameraMode: "none", // none | camera | demo
  scanningStartedAt: 0,
  profileIndex: 0,
  lastLandmarks: null,
  faceDetectedAt: 0,
  rafId: 0,
  camera: null,
  faceMesh: null,
};

function setStatus(text) {
  dom.statusChip.textContent = text;
}

function setScreen(screen) {
  state.screen = screen;
  for (const node of document.querySelectorAll("[data-screen]")) {
    const isActive = node.getAttribute("data-screen") === screen;
    node.classList.toggle("is-hidden", !isActive);
  }
}

function setActiveTab(tabId) {
  for (const btn of document.querySelectorAll(".tab")) {
    btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tabId);
  }
  for (const pane of document.querySelectorAll("[data-pane]")) {
    pane.classList.toggle("is-active", pane.getAttribute("data-pane") === tabId);
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function setScanSteps(progress) {
  const steps = [
    { key: "kinn", threshold: 0.34 },
    { key: "wangen", threshold: 0.67 },
    { key: "stirn", threshold: 1.01 },
  ];

  const activeIndex =
    progress < steps[0].threshold ? 0 : progress < steps[1].threshold ? 1 : 2;

  for (const [index, step] of steps.entries()) {
    const node = document.querySelector(`.step[data-step="${step.key}"]`);
    if (!node) continue;
    node.classList.toggle("is-active", index === activeIndex);
    node.classList.toggle("is-done", progress >= step.threshold);
  }
}

function renderResults(profile) {
  dom.profileSubtitle.textContent = profile.subtitle;

  dom.routineMorning.innerHTML = "";
  for (const item of profile.routine.morning) {
    const li = document.createElement("li");
    li.textContent = item;
    dom.routineMorning.appendChild(li);
  }

  dom.routineEvening.innerHTML = "";
  for (const item of profile.routine.evening) {
    const li = document.createElement("li");
    li.textContent = item;
    dom.routineEvening.appendChild(li);
  }

  dom.tipsList.innerHTML = "";
  for (const tip of profile.tips) {
    const li = document.createElement("li");
    li.textContent = tip;
    dom.tipsList.appendChild(li);
  }

  dom.scores.innerHTML = "";
  for (const score of profile.scores) {
    const row = document.createElement("div");
    row.className = "score";
    row.innerHTML = `
      <div class="score-name">${escapeHtml(score.name)}</div>
      <div class="score-bar"><div class="score-fill" style="width:${score.value}%"></div></div>
      <div class="score-value">${score.value}%</div>
    `;
    dom.scores.appendChild(row);
  }

  dom.products.innerHTML = "";
  for (const product of profile.products) {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <div class="product-icon" aria-hidden="true"></div>
      <div>
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-why">${escapeHtml(product.why)}</div>
      </div>
      <div class="product-meta">${escapeHtml(product.meta)}</div>
    `;
    dom.products.appendChild(card);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const showMesh = isScanning;
  if (state.cameraMode !== "camera" || !state.lastLandmarks) {
    if (isScanning) {
      drawFallbackScan(ctx, nowMs);
    }
    return;
  }

  const vw = dom.video.videoWidth || 1280;
  const vh = dom.video.videoHeight || 720;
  const cover = computeCoverTransform(vw, vh, window.innerWidth, window.innerHeight);

  const map = (nx, ny) => {
    const x = 1 - nx; // mirror to match video CSS transform
    const px = x * vw;
    const py = ny * vh;
    return {
      x: cover.offsetX + px * cover.scale,
      y: cover.offsetY + py * cover.scale,
    };
  };

  const bounds = getFaceBounds(state.lastLandmarks);
  const centerNormX = (bounds.minX + bounds.maxX) / 2;
  const centerNormY = (bounds.minY + bounds.maxY) / 2;
  const center = map(centerNormX, centerNormY);

  const faceWpx = (bounds.maxX - bounds.minX) * vw;
  const faceHpx = (bounds.maxY - bounds.minY) * vh;
  const radius = Math.max(faceWpx, faceHpx) * 0.6 * cover.scale;

  if (showMesh) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < state.lastLandmarks.length; i += 3) {
      const pt = state.lastLandmarks[i];
      const p = map(pt.x, pt.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (!isScanning) return;

  const progress = clamp01((nowMs - state.scanningStartedAt) / ANALYSIS_DURATION_MS);
  const stage = progress < 0.34 ? "kinn" : progress < 0.67 ? "wangen" : "stirn";
  const focus = getFocusPoint(stage, map);

  drawScanRing(ctx, nowMs, center, radius);
  drawFocusPulse(ctx, nowMs, focus);
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
  ctx.shadowColor = "rgba(183,139,115,0.55)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "rgba(230, 200, 175, 0.85)";
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
  grad.addColorStop(1, "rgba(183,139,115,0.95)");
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

  ctx.strokeStyle = "rgba(183,139,115,0.85)";
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

  setStatus("Kamera…");
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
  setStatus("Live");
}

function beginScanning() {
  state.scanningStartedAt = performance.now();
  setScreen(SCREENS.SCANNING);
  setStatus(state.cameraMode === "camera" ? "Scan läuft" : "Demo");
  dom.progressFill.style.width = "0%";
  dom.progressLabel.textContent = "0%";
  dom.scanHint.textContent =
    state.cameraMode === "camera"
      ? "Bitte schau in die Kamera und halte dein Gesicht im Sichtfeld."
      : "Demo-Modus: Ablauf ist hardcodiert (ohne Kamera).";
  setScanSteps(0);
}

function showResults(profile) {
  setScreen(SCREENS.RESULTS);
  setStatus("Ergebnis");
  setActiveTab("routine");
  renderResults(profile);
}

function setError(message) {
  dom.errorMessage.textContent = message;
  setScreen(SCREENS.ERROR);
  setStatus("Fehler");
}

function tick(nowMs) {
  if (state.screen === SCREENS.SCANNING) {
    const progress = clamp01((nowMs - state.scanningStartedAt) / ANALYSIS_DURATION_MS);
    const percent = Math.round(progress * 100);
    dom.progressFill.style.width = `${percent}%`;
    dom.progressLabel.textContent = `${percent}%`;
    setScanSteps(progress);

    if (state.cameraMode === "camera") {
      const lastSeenAgo = nowMs - state.faceDetectedAt;
      if (!state.faceDetectedAt || lastSeenAgo > 650) {
        dom.scanHint.textContent = "Gesicht nicht erkannt – bitte näher zur Kamera.";
      } else {
        dom.scanHint.textContent = "Perfekt – bitte stillhalten…";
      }
    }

    if (progress >= 1) {
      const profile = PROFILES[state.profileIndex % PROFILES.length];
      showResults(profile);
      state.profileIndex = (state.profileIndex + 1) % PROFILES.length;
    }
  }

  drawFx(nowMs);
  state.rafId = requestAnimationFrame(tick);
}

function initTabs() {
  for (const btn of document.querySelectorAll(".tab")) {
    btn.addEventListener("click", () => {
      setActiveTab(btn.getAttribute("data-tab"));
    });
  }
}

function initButtons() {
  dom.btnFullscreen.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  });

  dom.btnStartDemo.addEventListener("click", () => {
    stopVision();
    state.cameraMode = "demo";
    beginScanning();
  });

  dom.btnStartCamera.addEventListener("click", async () => {
    stopVision();
    state.cameraMode = "camera";
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
    setStatus("Bereit");
  });

  dom.btnRescan.addEventListener("click", () => {
    beginScanning();
  });

  dom.btnRetryCamera.addEventListener("click", async () => {
    stopVision();
    state.cameraMode = "camera";
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
    beginScanning();
  });
}

function start() {
  setScreen(SCREENS.WELCOME);
  setStatus("Bereit");
  initTabs();
  initButtons();
  cancelAnimationFrame(state.rafId);
  state.rafId = requestAnimationFrame(tick);
}

start();
