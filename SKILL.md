---
name: vectora-canvas
description: Opens Vectora Canvas — an Adobe Illustrator, Figma & Airship-inspired Direct-HTML/CSS/JS visual editor, whole-folder project studio, and standalone web app for any coding engine (Antigravity, Claude Code, Codex, OpenCode, Cursor, Windsurf). Trigger immediately whenever the user types just "Vectora" or "Vectora Canvas", or asks to visually edit HTML/CSS/JS or open a live preview. Features a Grey Stone + Orange theme, static-snapshot Edit mode vs full Live mode (preserving live state on return), whole-folder HTML/CSS/JS automatic sync, File menu (New Session, New Project, Open Recent Session, Open Project, Save Project, Export .zip/.html), Publish clean-page button, Illustrator Shift-click / Ctrl+Click Select-Behind / lower-object marquee selection, custom tool cursors, 4-way middle-click Figma pan, fixed-box workspace zoom, Flow Div auto-space & gap-closing layout, Primary & Secondary colour sync, and Coding Agent Notes.
---

# Vectora Canvas (`vectora-canvas`)

**Vectora Canvas** is a zero-dependency, universal **Direct-HTML/CSS/JS Visual Editor, Live Preview Workspace & Standalone Web App** that works across **any coding engine** (Google Antigravity, Claude Code, OpenAI Codex, OpenCode, Cursor, Windsurf, VS Code, or terminal agents) as well as directly in the browser.

- **Standalone Live Web App (Cloudflare Pages, No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

## Trigger Rules

1. **Instant Trigger on `"Vectora"`**: Whenever the user types just **`Vectora`** (or **`Vectora Canvas`**, *"open X in Vectora"*, *"show live preview in Vectora"*), activate this skill immediately.
2. **Live Preview on Request**: Launch or switch the Vectora Canvas server to the target project folder and open the live workspace URL (`http://127.0.0.1:4680/`) in the side browser pane and/or the user's browser.

---

## Quick Launch Commands (Any Coding Engine)

Vectora Canvas requires **only Node.js 18+** locally (zero `npm install` needed), or runs 100% client-side as a standalone static app.

### Windows / macOS / Linux
```bash
node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680 --open
```
Or via the included CLI wrapper:
```bash
"H:/AntyGravety/Vectora Canvas/vectora.cmd" --target "<PROJECT_FOLDER>" --open
```

### Switching Target Project Live (If Server Already Running on Port 4680)
```bash
curl -X POST http://127.0.0.1:4680/__vc_api/switch-target \
  -H "Content-Type: application/json" \
  -d "{\"target\":\"<PROJECT_FOLDER>\",\"entry\":\"index.html\"}"
```

### Antigravity Sidecar Pill
When running inside Google Antigravity with the Vectora Canvas sidecar installed, surface `[Vectora Canvas](sidecar://vectora-canvas/)` alongside `http://127.0.0.1:4680/`.

---

## Whole-Folder HTML, CSS & JavaScript Sync

- **Whole-Folder Multi-File Editing**: Works across all `.html`, `.css`, and `.js` files in a project folder (browseable in the left **Files** tree and editable in the right **Code** tab).
- **Automatic Canvas-to-Code Sync**: Any visual change on the canvas (dragging, resizing, recolouring, adding/deleting Flow Divs or Shapes, editing text, switching themes) automatically updates the project's **HTML, CSS (`styles.css` / `/* === VECTORA CANVAS SYNC === */`), and JavaScript (`/* === VECTORA CANVAS SYNC STATE === */`)** buffers in real time (`Synced HTML · CSS · JS`).
- **File Box (`#ddFile` beside `Sessions & Views`)**:
  - **New Session**: Creates a named session inside the active page.
  - **New Project**: Scaffolds a fresh multi-file (`index.html`, `styles.css`, `script.js`) project.
  - **Open Recent Session**: Switches to recently visited sessions or project folders.
  - **Open Project**: Opens a local folder via browser directory picker (`webkitdirectory`) or server path.
  - **Save Project**: Writes synced HTML, CSS, and JS files to disk (`Ctrl+S`) or browser storage in standalone mode, updating the `Original` baseline while preserving full Undo/Redo history.
  - **Export**: Downloads the full multi-file project as a pure-JS `.zip` archive (or `.html` for single-file pages).
- **Notes & Publish**:
  - **Notes (`N` / `Notes` drawer)**: Pin element-anchored notes per page (`memory/agent-notes.json` or standalone `localStorage`) and copy structured prompts for any coding agent.
  - **Publish (`Publish` button beside `Notes`)**: Opens the clean, full live page (with all synced HTML/CSS/JS and zero editor overlays) in a new browser tab.

---

## Core Workspace Capabilities

- **Theme**: Cohesive Grey Stone (`#151413`–`#363330`) + Orange (`#f97316`) accent, crisp inline SVG icons, dark custom dropdowns, and custom tool cursors matching Adobe Illustrator (`V`, `A`, `E`, `S`, `R`, `D`, `T`, `I`, `M`, `N`, `H`, `Z`/`Alt+Z`).
- **Selection**: Plain click replaces selection; `Shift+Click` adds without clearing; `Ctrl+Click` follows Illustrator's temporary selection override + Select-Behind cycling through overlapping objects (`Ctrl+Shift+Click` additive); intersection drag-marquee selects lower/occluded objects too.
- **Artboard & Navigation**: Natural `1920×1080` (16:9) website framing filling the workspace; zoom stays strictly inside the fixed workspace viewport; middle-click drag (`button === 1`), `Space+Drag`, or `H` pans freely in all 4 directions (`up`, `down`, `left`, `right`) like Figma.
- **Frozen Edit vs Full Live Mode**: Edit mode freezes scroll, CSS animations/transitions, `requestAnimationFrame`, and 3D WebGL viewports like a static snapshot; Live mode runs scroll, animations, and 3D normally; returning to Edit mode preserves the exact live state.
- **Flow Layout**: Adding a Flow Div (`D`) automatically claims layout space; deleting a Flow Div closes surrounding horizontal and vertical gaps across flex, block, and CSS grid containers.
