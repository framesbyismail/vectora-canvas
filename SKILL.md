---
name: vectora-canvas
description: Opens Vectora Canvas — an Adobe Illustrator, Figma & Airship-inspired Direct-HTML/CSS/JS visual editor, whole-folder project studio, and standalone web app for any coding engine (Antigravity, Claude Code, Codex, OpenCode, Cursor, Windsurf). Trigger immediately whenever the user types just "Vectora" or "Vectora Canvas", or asks to visually edit HTML/CSS/JS or open a live preview. Features a Warm Grey Stone + Orange theme (custom in-app color picker, Illustrator Fill/Stroke/Gradient + Unfill `/`), Double-Click Group Isolation Mode, Links Inspector Tab, Animated Auth/Gate Bypass Lock, GPU-first with automatic CPU fallback, static-snapshot Edit vs Live mode, whole-folder HTML/CSS/JS sync, Flow Div layout, and Coding Agent Rules.
---

# Vectora Canvas (`vectora-canvas`)

**Vectora Canvas** is a zero-dependency, universal **Direct-HTML/CSS/JS Visual Editor, Live Preview Workspace & Standalone Web App** that works across **any coding engine** (Google Antigravity, Claude Code, OpenAI Codex, OpenCode, Cursor, Windsurf, VS Code, or terminal agents) as well as 100% client-side in the browser.

- **Standalone Live Web App (Cloudflare Pages, No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

---

## 1. Trigger & Auto-Open Rules

1. **Instant Trigger on `"Vectora"`**: Whenever the user types just **`Vectora`** (or **`Vectora Canvas`**, *"open X in Vectora"*, *"show live preview in Vectora"*), activate this skill immediately.
2. **Live Preview on Request**: Launch or switch the Vectora Canvas server to the target project folder and open `http://127.0.0.1:4680/` in the browser / side browser pane.
3. **Antigravity Sidecar Pill**: When running inside Google Antigravity with the Vectora Canvas sidecar installed, include `[Vectora Canvas](sidecar://vectora-canvas/)` alongside `http://127.0.0.1:4680/`.

---

## 2. Mandatory Coding Agent HTML/CSS Authoring Rules for Vectora Canvas

Whenever generating, editing, or preparing HTML/CSS/JS to be used or opened in **Vectora Canvas**, ALWAYS follow these rules (also enforced in `rules/AGENTS.md`):

1. **Invisible-Over-Visible Div Inset Rule (Critical)**:
   - **Never** size a transparent or invisible `<div>` (overlay, hit-zone, click-catcher, or wrapper) to the exact `100% × 100%` (`inset: 0`) bounds of a visible `<div>` / `.card` / `<section>` directly underneath it.
   - **Always inset the overlapping invisible `<div>` by `8px`–`12px`** (`inset: 8px;` or `width: calc(100% - 16px); height: calc(100% - 16px);`) so it is slightly smaller than the visible `<div>`.
   - This preserves an `8px` outer rim around the visible `<div>` so both the visible container and the invisible `<div>` can be clicked, marquee-selected, and dragged independently (and once selected, an invisible `<div>` can also be dragged from anywhere inside its empty middle!).
2. **Zero Full-Bleed Pointer Blockers**:
   - Closed modals, backdrops, and overlays must use `hidden`, `display: none`, or `pointer-events: none` — never leave an invisible `position: fixed; inset: 0; pointer-events: auto` layer blocking canvas clicks.
3. **Semantic IDs & Layer Names**:
   - Add descriptive `id` or `data-name` attributes on sections, cards, `<div>`s, and buttons so they appear cleanly in **Layers** (which auto-scrolls and highlights the active selection), **Sessions**, **DOM**, and **Links**.
4. **Links Tab Compatibility**:
   - Put navigable destinations on `<a href="page.html">`, `<button data-vc-link="page.html">`, or `data-href="#section"` using relative paths so the **`Links` Inspector Tab** lists every button/page link as an editable card and works in both server mode and `blob:` VFS local-folder mode.
5. **Flex/Grid Flow & Theme Variables**:
   - Prefer `display: flex` / `display: grid` with `gap` so Flow Divs (`D`) automatically claim space and close horizontal/vertical gaps on delete; expose `:root` `--primary` and `--secondary` CSS variables for live palette editing.
6. **Marked Region Notes & Sync Blocks (`agent-notes.json`)**:
   - Check `H:/AntyGravety/Vectora Canvas/memory/agent-notes.json` (or `GET http://127.0.0.1:4680/__vc_api/notes` / `.vectora-notes.json`) for pinned user tasks — each note supplies `latestAgentBrief`, exact `markRect` (`x, y, w, h`), `sectionLabel`, primary `selector`, all `enclosedElements` inside the marked box, `htmlSnippet`, and the user's `text` instruction. Preserve `/* === VECTORA CANVAS SYNC === */` blocks.
7. **100% Pure Vector Authoring (Never Pixelated)**:
   - Use pure SVG icons, CSS gradients/borders, and `devicePixelRatio`-aware `<canvas>` sizing (avoiding low-DPI raster icons or `will-change: transform` bitmap layer caching) so every element stays razor-sharp up to `1600%` zoom.

---

## 3. Quick Launch Commands (Any Coding Engine)

Vectora Canvas requires **only Node.js 18+** locally (zero `npm install` needed), or runs 100% client-side as a standalone static web app.

### Launch Local Server
```bash
node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680 --open
```
Or via CLI wrapper:
```bash
"H:/AntyGravety/Vectora Canvas/vectora.cmd" --target "<PROJECT_FOLDER>" --open
```

### Switch Active Project Folder Live (If Port 4680 Is Running)
```bash
curl -X POST http://127.0.0.1:4680/__vc_api/switch-target \
  -H "Content-Type: application/json" \
  -d "{\"target\":\"<PROJECT_FOLDER>\",\"entry\":\"index.html\"}"
```

---

## 4. Core Studio & Web App Capabilities

- **Warm Grey Stone + Orange UI & Custom Color Popover (`#vcColorPopover`)**: Cohesive `#151413`–`#363330` stone surfaces with `#f97316` orange accent, crisp SVG icons, custom 2D SV + Hue + Hex/RGB + Eyedropper + Swatches color popover (zero mismatched OS color dialogs), and Illustrator Fill/Stroke proxies with **Solid**, **Linear/Radial Gradient**, Swap (`Shift+X`), Default, and **Unfill (`None` / `/` diagonal red slash)**.
- **Direct Div Dragging, Group Hold & Isolation Mode**:
  - Pressing and dragging any unselected `<div>` or `.card` selects and moves it immediately in one motion; marquee drag selects `<div>` boxes and lower objects cleanly.
  - Selected composite groups and invisible `<div>`s hold selection reliably — including dragging anywhere inside the empty middle of a selected invisible `<div>`.
  - **Double-Click Group Isolation Mode**: Double-clicking any group enters Illustrator-style Isolation Mode (dimming outside artwork to `20%` opacity and unlocking every inner child for individual selection/editing; exit via `Esc`, `#isolationBar`, or double-clicking outside).
- **Rigid Alignment Engine**: Align (`Left`, `Center`, `Right`, `Top`, `Middle`, `Bottom`) and Distribute work reliably on single elements (to Artboard/Isolation bounds), multiple elements, inline `<a>`/`<span>` tags, and composite groups (moving groups as rigid units without collapsing internal children).
- **Links Inspector Tab (`Edit | Code | Links | CSS | DOM`)**: Dedicated scrollable card list of every button, `<a>`, `onclick`, and `data-vc-link` destination on the artboard — click any card to select & highlight the element/group on the canvas, or edit/add URLs with live HTML/CSS/JS sync and Undo/Redo.
- **Animated Auth/Gate Bypass Lock & Web Local-Folder Runtime**:
  - Animated padlock shackle (`#btnBypassGates`): **Unlocked** = bypasses sign-in/paywall gates for preview; **Locked** = disables bypass and enforces real page gates.
  - Full client-side VFS runtime resolves dynamic `<script src="...">` injection, relative `fetch()`, `#hash` scrolling, and multi-page button/link navigation when opening local folders in the web app.
- **One-Folder Recent Projects & Fixed-Width Page Selector**: `Open Recent Project` deduplicates strictly to one entry per project folder; topbar page selector (`#ddPage`) keeps a fixed `128px` width; `Layers` highlights and auto-scrolls to any canvas selection.
- **GPU-First Acceleration with Automatic CPU Fallback**: Automatically probes WebGL2/WebGL1 hardware vs software/unavailable GPU, runs 3D `translate3d` compositor acceleration when GPU is healthy, and falls back seamlessly to lightweight 2D CPU rendering (`#accelModeBadge` + Preferences `Auto / GPU / CPU`).
- **Persistent Marked-Area Note Tool (`N`) + Full Coding Agent Handoff**: Dragging with the Note tool draws a persistent Warm Orange region rectangle (`__vc_note_box__`) that stays visible both while writing the note (`is-pending`) and after saving alongside its numbered pin (`__vc_note_pin__`), syncing `markRect`, `sectionLabel`, `selector`, `enclosedElements`, `htmlSnippet`, and `text` directly to `memory/agent-notes.json`, `/__vc_api/notes`, 1-click `Copy Prompt`, and `.vectora-notes.json` in `.zip` exports.
- **Adobe Illustrator Live Corner Widgets & Topbar Pixel/Roundness Control**: Selecting any shape, `<div>`, or card renders 4 circular Live Corner handles (`tl`, `tr`, `br`, `bl` — drag to round all corners, `Alt+Drag` for a single corner) and activates `#cornerControlBar` in the top canvas toolbar with a dynamic bending corner SVG, scrubbable `Corners:` label, slider, exact pixel input (`px`), and live roundness percentage badge (`%`).
- **100% Pure Mathematical Vector Rendering (Zero Pixelation up to `1600%` Zoom)**: Zero `<canvas>` bitmaps in Studio UI (including a pure mathematical CSS-gradient 2D SV color field), native Skia vector re-rasterization on `.frame-stage` at every zoom level (`will-change: auto`), `geometricPrecision` SVG/text rendering, zoom-invariant `1px`/`1.5px` vector hairline overlays/handles/corner widgets, and automatic dynamic `devicePixelRatio` (`up to 6×`) supersampling for HTML5 `<canvas>` gizmos.
