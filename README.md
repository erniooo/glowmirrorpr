# GlowMirror Prototype (Uni-Demo)

Kleiner, **hardcodierter** Design‑Prototyp als Web‑App (Deutsch) mit Kamera‑Mirror‑View, Scan‑Overlay und **Face‑Landmarks (MediaPipe FaceMesh)**.

## Start

1. Terminal öffnen im Repo:
   - `cd prototype`
2. Lokalen Server starten:
   - `python -m http.server 5173`
3. Im Browser öffnen:
   - `http://localhost:5173`

## Demo-Flow

- **Hautanalyse starten**: nutzt die Laptop‑Kamera + Face‑Landmarks Overlay.
- **Demo (ohne Kamera)**: gleicher Ablauf ohne Kamera (falls Berechtigungen/WLAN zicken).

Hinweis: Die Face‑Landmarks werden über MediaPipe‑Dateien von `cdn.jsdelivr.net` geladen (Internet nötig). Ohne Internet funktioniert der Demo‑Modus weiterhin.

## Dateien

- `prototype/index.html`
- `prototype/styles.css`
- `prototype/app.js`
