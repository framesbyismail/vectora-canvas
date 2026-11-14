# Vectora Canvas — Complete Engineering, Architecture & Publishing Log (Phase 1 + Phase 2)

- **Repository**: https://github.com/framesbyismail/vectora-canvas
- **Live Web App (Cloudflare Pages, No Sign-In)**: https://vectora-canvas.pages.dev
- **Local Skill & Server Root**: `H:\AntyGravety\Vectora Canvas` (mirrored to `H:\AntyGravety\HTML Edit Skill`)
- **Coding Agent Rules**: `H:\AntyGravety\Vectora Canvas\rules\AGENTS.md` + Global Antigravity Plugin (`~/.gemini/config/plugins/vectora-canvas/`)

---

## Part A — Phase 1: Core Studio Architecture, Illustrator/Figma Engine & Initial Cloud Deployment

### 1. Selection Engine (Illustrator Shortcuts & Lower-Object Marquee)
- **Files**: `studio/bridge.js`, `studio/studio.js`
- **How it was built**:
  - **Plain Click**: Replaces the current selection cleanly (`selectedSet.clear()` → select target).
  - **`Shift + Click`**: Toggles/adds elements into `selectedSet` without clearing previous selections.
  - **`Ctrl + Click` / `Cmd + Click` (Illustrator Temporary Selection + Select-Behind)**:
    - Temporarily overrides active non-selection tools (Type, Shape, Eyedropper, Div, Note) to act as Selection while `Ctrl` is held.
    - Uses `document.elementsFromPoint(clientX, clientY)` at the click point (`lastSelectBehindPoint`) to cycle downward through overlapping stacked layers (`selectBehindIndex++`), and supports `Ctrl + Shift + Click` for additive Select-Behind.
  - **Lower-Object Marquee Drag**: Rubber-band marquee checks `rectsIntersect(marqueeRect, elRect)` across all selectable elements (excluding full-bleed background wrappers unless fully enclosed), selecting lower/underneath objects just like Adobe Illustrator.

### 2. Natural 16:9 Artboard Framing, Fixed-Box Workspace Zoom & 4-Way Figma Pan
- **Files**: `studio/studio.css`, `studio/studio.js`, `studio/bridge.js`
- **How it was built**:
  - **Natural Artboard Size**: Default `1920 × 1080` (`16:9` widescreen website frame) scaled via `fitArtboardToStage()` so the page renders at natural desktop proportions (`1.0x` layout pixels inside `#previewFrame`) and fills the stage cleanly without squeezing responsive breakpoints.
  - **Fixed Workspace Box Zoom**: `#canvasScroll` uses `overflow: hidden; contain: layout paint;` and transforms `#artboardWrap` via `transform-origin: 0 0` anchored mathematically at cursor coordinates (`setZoomAtPoint`), never pulling empty scrollbars or shifting surrounding panels.
  - **4-Way Middle-Click Figma Pan**: Middle mouse drag (`ev.button === 1`), `Space + Drag`, and Hand tool (`H`) capture pointer deltas both on the outer pasteboard and inside the iframe (`vc_pan_delta`), panning smoothly up, down, left, and right.

### 3. Static-Snapshot Edit Mode vs Full Live Mode (State-Preserving)
- **Files**: `studio/prebypass.js`, `studio/bridge.js`, `studio/studio.js`
- **How it was built**:
  - `prebypass.js` patches `HTMLCanvasElement.prototype.getContext` (`preserveDrawingBuffer: true` on WebGL/WebGL2) and wraps `window.requestAnimationFrame` + `window.setInterval` behind `window.__vcSetFrozen(freeze)`.
  - **Edit Mode (`freeze = true`)**: Locks scroll offsets, pauses CSS animations/transitions (`animation-play-state: paused !important`), freezes `requestAnimationFrame` loops, and prevents 3D WebGL viewports from orbiting on click.
  - **Live Mode (`freeze = false`)**: Unfreezes scroll, CSS transitions, and queued RAF callbacks so interactive UI and 3D scenes run normally. Switching back to **Edit Mode** freezes the DOM & WebGL buffers in their exact Live state without reloading.

### 4. Flow Div Auto-Space & Two-Axis Gap Closing on Delete
- **Files**: `studio/bridge.js`
- **How it was built**:
  - Drawing or converting to a **Flow Div (`D`)** inserts `<div data-vc-flow-div="true">` in normal document flow (`position: relative; flex: 0 0 auto`) at the drop index so surrounding elements shift naturally to make room.
  - Deleting a Flow Div or box removes it from flow and runs `closeSurroundingGapAfterDelete()`, resetting residual sibling transforms/margins and compacting explicit grid tracks so neighbors close the gap both horizontally and vertically.

### 5. Illustrator Tool Cursors, Primary/Secondary Palette Sync, Whole-Folder Sync & Publish
- **Files**: `studio/studio.css`, `studio/code-sync.js`, `studio/studio.js`, `scripts/server.mjs`
- **How it was built**:
  - Custom inline-SVG data-URI cursors (`cursor: url(...)`) for Selection (`V`), Direct Selection (`A`), Transform (`E`), Pen/Shape/Div/Marquee crosshair, Type I-beam (`T`), Eyedropper (`I`), Note (`N`), Hand (`H`), and Zoom (`Z` / `Alt+Z`).
  - Independent live Primary (`#inpPrimaryColor`) & Secondary (`#inpSecondaryColor`) CSS variable & accent recoloring with single-step Undo/Redo.
  - `VectoraCodeSync` (`studio/code-sync.js`) synchronizes canvas edits across all `.html`, `.css`, and `.js` files in the folder (`Synced · HTML/CSS/JS`), provides a pure-JS CRC32 `.zip` exporter (`File → Export`), and powers the **Publish** button (`/__vc_publish/...` or clean standalone Blob tab with zero editor overlays).

### 6. How Vectora Canvas Is Published (GitHub + Cloudflare Pages Pipeline)
1. **Standalone Static Architecture**: Everything inside `studio/` (`index.html`, `studio.css`, `studio.js`, `code-sync.js`, `bridge.js`, `prebypass.js`, `_headers`) is 100% static and runs with zero server dependencies when opened on Cloudflare Pages (`bootStudio()` detects static hosting and boots the full client-side VFS workspace automatically).
2. **GitHub Push**:
   ```bash
   cd "H:/AntyGravety/Vectora Canvas"
   git add -A
   git commit -m "<commit message>"
   git push origin main
   ```
   Pushes to `https://github.com/framesbyismail/vectora-canvas`.
3. **Cloudflare Pages Direct Deployment**:
   ```bash
   npx.cmd --yes wrangler pages deploy "H:/AntyGravety/Vectora Canvas/studio" --project-name vectora-canvas --branch main --commit-dirty=true
   ```
   Publishes directly to production at **`https://vectora-canvas.pages.dev`** with no login wall.

---

## Part B — Phase 2: UI/UX Upgrades, Selection/Group/Isolation Fixes, Links Tab, Bypass Lock & GPU/CPU Engine

### 1. Custom Warm Grey Stone + Orange Color Picker Popover (Image 1 Fix)
- **Problem**: Clicking native `<input type="color">` opened Chromium/OS's mismatched rainbow popup (`rgb(28, 26, 24)`).
- **Fix (`studio/index.html`, `studio/studio.css`, `studio/studio.js`)**:
  - Built `#vcColorPopover` — a custom in-app Warm Grey Stone + Orange color picker with an interactive 2D Saturation/Value canvas, Hue spectrum bar, Hex + R/G/B numeric fields, Eyedropper trigger, quick theme swatches, and `None`/Unfill button.
  - Intercepted clicks on `#inpPrimaryColor`, `#inpSecondaryColor`, `#activePaintPicker`, `#gradStopColor`, `#propColorPicker`, and Fill/Stroke proxies so the OS color dialog never appears.

### 2. Illustrator Fill / Stroke / Swap / Default + Unfill (`None` / `/`) (Image 2 Fix)
- **Problem**: Fill & Stroke proxies lacked Illustrator's 3 bottom mode chips and had no way to **Unfill (`None`)** an already-filled or stroked element.
- **Fix (`studio/index.html`, `studio/studio.css`, `studio/studio.js`, `studio/bridge.js`)**:
  - Upgraded `#dockSwatches` (left toolbar) and `.ai-proxy-box` / `#paintModeTabs` (right inspector) with Default Fill/Stroke reset, Swap (`Shift+X`), and the 3 mini Illustrator mode chips underneath (`[Solid]`, `[Gradient]`, `[None / Unfill diagonal red slash]`, shortcut `/`).
  - Added `unfillActiveTarget` (`applyUnfillToActiveProxy()`), which authoritatively writes `background: none !important; background-color: transparent !important; background-image: none !important;` (for Fill) or `border: none !important; border-width: 0px !important;` (for Stroke) with full Undo/Redo support.

### 3. Direct Unselected `<div>` Press-Drag & Marquee `<div>` Selection Fix
- **Problem**: Dragging across or pressing directly on an unselected `<div>` didn't select & move it in one motion; users had to click first and drag second.
- **Fix (`studio/bridge.js`)**:
  - Expanded `isSelectableElement()` and `resolveTargetFromEvent()` to recognize all visible/layout `<div>` containers (`.card`, `.cbody`, flex/grid wrappers, Flow Divs, custom `<div>`s) while still skipping `<html>`/`<body>` and closed full-bleed backdrops.
  - In `onMouseDown`, pressing on any unselected `<div>` immediately selects it (`selectedSet.add(target)`) and arms `dragSession` on the very same `mousedown` so moving `> 2px` drags the `<div>` in one seamless gesture.

### 4. Reliable Alignment Engine (`collectAlignmentUnits`)
- **Problem**: Align sometimes failed on single items, inline elements (`<a>`, `<span>`), nested selections (double-moving child + parent), or composite groups (collapsing internal group children onto each other).
- **Fix (`studio/bridge.js`)**:
  - Implemented `collectAlignmentUnits()` which groups composite group members into **1 rigid Alignment Unit** (translating every member by the exact same `(dx, dy)` delta so internal layout never collapses) and deduplicates ancestor/descendant selections.
  - Auto-promotes `display: inline` elements to `inline-block` so CSS `transform` applies reliably, and aligns single units to the Artboard (or active Isolation container) automatically.

### 5. Double-Click Group Isolation Mode (Illustrator-Style)
- **Problem**: Users needed to double-click a group to isolate it, dim everything outside, and select/move/edit every child inside individually.
- **Fix (`studio/bridge.js`, `studio/index.html`, `studio/studio.css`, `studio/studio.js`)**:
  - Added `isolationStack`, `enterIsolationMode()`, `exitIsolationMode()`, and `applyIsolationDimmingToDom()`.
  - Double-clicking any composite group (`groupsById`) or multi-child container enters Isolation Mode, marks outside subtrees with `data-vc-iso-dim="1"` (`opacity: 0.2 !important; pointer-events: none !important;`), displays `#isolationBar` breadcrumb in the canvas toolbar, and unlocks inner children (`resolveTargetFromEvent` stops promoting clicks to the isolated group ID).
  - Pressing `Esc`, clicking `Exit Isolation`, or double-clicking outside exits cleanly.

### 6. Group Drag Hold & Selected Invisible `<div>` Empty-Middle Dragging
- **Problem**: Moving a selected group or dragging inside the empty middle (`majkhane faka jaga`) of an already-selected invisible `<div>` dropped the selection because `ev.target` hit the underlying element.
- **Fix (`studio/bridge.js`)**:
  - Added `findSelectedHitAtPoint(clientX, clientY)` at the start of `onMouseDown`: before running normal DOM hit-testing, Vectora checks if `(clientX, clientY)` falls inside the bounding box of the currently selected composite group or any currently selected element (including an invisible/transparent `<div>`!). If so, it preserves the selection and starts dragging immediately from anywhere inside its interior.
  - Also implemented smart `8px` outer-rim hit disambiguation when an invisible `<div>` overlaps a visible `<div>`.

### 7. Coding Agent Rules (`rules/AGENTS.md`) & Invisible-Over-Visible Div Inset Rule
- **Files**: `rules/AGENTS.md`, `AGENTS.md`, `SKILL.md`, `~/.gemini/config/plugins/vectora-canvas/`
- **What was set**:
  - Auto-open rule when the user mentions `Vectora` / `Vectora Canvas`.
  - **Mandatory Invisible-Over-Visible Div Inset Rule**: Any invisible `<div>` placed over a visible `<div>` of the same region MUST be `8px`–`12px` smaller (`inset: 8px`) than the visible `<div>` so both remain independently selectable and draggable.
  - Additional rules for closed modal `pointer-events: none`, semantic `id`/`data-name`, relative links for the `Links` tab, flex/grid flow layout, and `--primary`/`--secondary` variables.

### 8. Single-Line Sync Pill, File Dropdown Ellipsis, & Unclipped Canvas Toolbar (Images 3, 4, 5 + `#ddPage`)
- **Fixes (`studio/studio.css`, `studio/index.html`, `studio/studio.js`, `scripts/server.mjs`)**:
  - **Image 3**: `#codeSyncBadge` (`Synced · HTML/CSS/JS`) uses `white-space: nowrap; flex-shrink: 0;` inside `.single-line-head` — strictly 1 horizontal line.
  - **Image 4**: `#ddCodeFile` / `#ddCodeFileBtn` uses `min-width: 0; overflow: hidden; text-overflow: ellipsis;` + skips Electron build folders (`win-unpacked`, `release`, `desktop`, `out`, `build`, `.next`) + flex column sizing on `.code-pane-sec` so top/bottom code text never clips.
  - **Image 5**: `.canvas-toolbar` uses compact responsive spacing and scrollable `#shapeSubbar` (`max-width: min(300px, 30vw); overflow-x: auto;`) so `Guides`, `Notes`, `Fit`, `−`, `50%`, `+`, `100%`, and `Reload` never get cut off on the right.
  - **Topbar `#ddPage`**: Fixed at `width: 114px; min-width: 114px; max-width: 114px;` with `text-overflow: ellipsis` so long filenames show their leading characters cleanly without pushing topbar buttons.

### 9. Animated Bypass Padlock + Web VFS Local-Folder Dynamic Script & Multi-Page Navigation Fix
- **Fixes (`studio/index.html`, `studio/studio.css`, `studio/prebypass.js`, `studio/code-sync.js`, `studio/bridge.js`, `studio/studio.js`)**:
  - Replaced static lock icons with `#iconBypassPadlock` featuring CSS keyframe shackle animations (`vcPadlockUnlock` / `vcPadlockLock`).
  - **Unlocked** (`state.bypassGates = true`) unlocks Auth/Pro gates; **Locked** (`state.bypassGates = false`) clears preview entitlements (`vp_entitlement_v1`), sets `AC.setPro(false)`, removes `.vc-bypass-revealed`, and enforces gates authentically.
  - **Web Local-Folder Runtime (`compileStandaloneHtml`)**: Injects an in-page VFS runtime (`window.__VC_VFS_BLOBS__` + `window.__VC_VFS_TEXT__`) that intercepts dynamic `<script src="video.js">` creation (`appendChild`/`insertBefore`/`src` setter), relative `fetch()` (including `.json` like `version.json`), `history.replaceState` on `blob:` origins, and `<a href>` / `<button onclick="location.href=...">` / `data-vc-link` / `#hash` section jumps so multi-page & dynamic local folders work seamlessly in the browser web app!

### 10. New `"Links"` Inspector Tab (`Edit | Code | Links | CSS | DOM`)
- **Fixes (`studio/index.html`, `studio/studio.css`, `studio/bridge.js`, `studio/studio.js`, `studio/code-sync.js`)**:
  - Added `#iTabLinks` and `#paneLinks` with separate scrollable `.link-card` boxes (`#linksList`) for every link/button/URL on the artboard (including group badges when inside a group).
  - Clicking any `.link-card` selects, scrolls to, and flashes an orange highlight on the corresponding button/text/object/group on the artboard (`focus_link_target`).
  - Editing any URL (or attaching a new link to any selected button/object/group via `#inpSelectedLinkUrl`) updates `href` / `data-vc-link` live with Undo/Redo and surgical HTML open-tag sync (`attrPatches` in `code-sync.js` & `server.mjs`).

### 11. `Layers` Selection Highlight + Auto-Scroll & 1-Folder `Open Recent Project`
- **Fixes (`studio/studio.js`, `studio/bridge.js`, `scripts/server.mjs`)**:
  - Selecting any element or group on the artboard highlights its `.layer-item.selected` row in `Layers` and calls `scrollIntoView({ block: 'nearest' })`.
  - Renamed `Open Recent Session` to `Open Recent Project` (`#fileOpenRecent`) and deduplicated both client (`getProjectFolderKey`) and server (`normalizeFolderIdentity`) recent lists so each folder appears strictly once.

### 12. GPU-First Acceleration with Automatic CPU Fallback
- **Fixes (`studio/studio.js`, `studio/studio.css`, `studio/bridge.js`, `studio/index.html`)**:
  - `detectHardwareAcceleration()` probes WebGL2/WebGL1 + `WEBGL_debug_renderer_info` to distinguish hardware GPUs from software renderers (`SwiftShader`, `llvmpipe`, `Basic Render Driver`) or unavailable WebGL.
  - Applies `html[data-vc-accel="gpu"]` (`translate3d` GPU layer compositing) when hardware GPU is active, and automatically falls back to `html[data-vc-accel="cpu"]` (integer `translate()` 2D transforms, zero `will-change` layer bloat, lightweight borders) when GPU is missing or software-emulated, controllable anytime from `#accelModeBadge` or `Preferences → Compute Acceleration Engine (Auto / GPU / CPU)`.

---

## Phase 3 — Persistent Marked-Region Notes + Coding Agent Handoff & Illustrator Live Corner Controls

### 13. Note Tool (`N`) Marked Area Persistence & Full Coding Agent Handoff
- **Root Cause**: Previously, releasing the mouse (`mouseup`) after dragging a Note marquee cleared the temporary box before the user finished typing in `#notePopup`, and saved notes only rendered a `20×20` pin without drawing the marked region rectangle (`markRect`).
- **Fixes (`studio/bridge.js`, `studio/studio.js`, `studio/index.html`, `studio/studio.css`, `scripts/server.mjs`)**:
  - **Persistent Draft & Saved Region Box**: `mouseup` now stores `pendingNoteMark` (`__vc_note_box__.is-pending`) so the exact marked area box stays clearly visible while `#notePopup` is open (displaying `Marked Area: X, Y · W × H px · K items`), clears cleanly if canceled, and stays permanently visible on the artboard (`__vc_note_box__` + `__vc_note_pin__`) once saved. Clicking a note card in `#notesDrawer` focuses, highlights, and scrolls to that marked region (`focus_note_mark`).
  - **Full Coding Agent Context (`collectNoteRegionContext` + `buildAgentNotesBrief`)**: Captures `markRect` (`x, y, w, h, artboardW, artboardH`), `sectionLabel`, primary `selector`, **all `enclosedElements`** inside the marked rectangle, sanitized `htmlSnippet`, `taskType`, `entry`, and `text`, writing them + `latestAgentBrief` automatically to `memory/agent-notes.json` (`/__vc_api/notes`), 1-click `Copy Prompt` / `Copy for Agent`, and `.vectora-notes.json` inside `.zip` exports (while keeping published HTML 100% clean).

### 14. Shape Round Corner Control + Adobe Illustrator Topbar Pixel (`px`) & Roundness (`%`) Display
- **Fixes (`studio/index.html`, `studio/studio.css`, `studio/bridge.js`, `studio/studio.js`)**:
  - **4 On-Canvas Live Corner Widgets (`__vc_corner_widget__`)**: Renders 4 Illustrator-style circular bulls-eye handles (`tl`, `tr`, `br`, `bl`) inside the corners of any selected shape, `<div>`, or card. Dragging inward/outward rounds all 4 corners smoothly with live floating HUD (`Corners: 28 px · 47%`) and full Undo/Redo; holding **`Alt+Drag`** rounds a single corner independently.
  - **Topbar Illustrator `Corners:` Control (`#cornerControlBar`)**: Placed directly beside `[Shape Tool (R)] [Rect | Rounded | Ellipse | Pill | Line] div` in `.canvas-toolbar .ct-left`, featuring a dynamic SVG corner arc (`#cornerArcPath` + `#cornerArcDot`) that bends proportionally from 90° (`0%`) to a full curve (`100%`), scrubbable `Corners:` label, live Warm Orange slider (`#topCornerSlider`), exact pixel input (`#topCornerInput`, e.g. `33 px`), and live roundness percentage badge (`#topCornerRoundBadge`, e.g. `55%`) with zero toolbar clipping.
