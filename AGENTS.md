# Vectora Canvas — Always-On Figma & Illustrator UI Design + Real-Time Sync Rules

Once **Vectora Canvas** (`H:/AntyGravety/Vectora Canvas` / `https://vectora-canvas.pages.dev`) is installed in **any** coding agent (Antigravity, Claude Code, Codex, Cursor, Windsurf, OpenCode), **ALL rules below are ALWAYS ACTIVE** whenever you design, generate, edit, refactor, or preview **any** web UI, component, landing page, dashboard, or HTML/CSS/JS application — even when the user does not explicitly mention "Vectora" in that prompt!

---

## 0. Always-On Figma Frame & Adobe Illustrator Vector Object Rule (Mandatory for Every UI You Build)

Think and author as a **Principal Web & UI Designer** building a live **Figma Auto-Layout + Adobe Illustrator Vector Scene-Graph**: **every single visual object on screen must be individually grabbable, movable, resizable, isolatable, and restylable (`sob dhore dhore kaj kora jabe`)**.

1. **Zero Unselectable CSS Pseudo-Element Art (`::before` / `::after` Shape Ban)**:
   - **Never** draw visible badges, status dots, dividers, accent lines, glow orbs, icons, checkmarks, or decorative shapes using `::before`, `::after`, or multi-`box-shadow` clones — pseudo-elements cannot be clicked, selected, moved, or resized on a design canvas!
   - **Every visible visual element must be a real DOM or `<svg>` element** (`<span id="..." data-name="Status Dot">`, `<svg data-name="Sparkline">`, `<div data-name="Divider">`).
2. **Standalone Point Text vs. Reflowable Area Text (Illustrator Typography Model)**:
   - **Never** mix bare unwrapped `TextNode`s beside sibling `<svg>`, `<button>`, `<input>`, `<select>`, `<a>`, or `<span>` elements inside a parent container:
     ```html
     <!-- WRONG: bare text node mixed beside <svg> or <span> -->
     <button id="ctaBtn"><svg>...</svg> Launch (<span id="cnt">0</span>)</button>

     <!-- CORRECT: every text piece is a tight standalone <span> -->
     <button id="ctaBtn" data-name="Launch CTA">
       <svg data-name="Launch Icon">...</svg>
       <span class="vc-pt">Launch</span>
       <span id="cnt" class="vc-pt">0</span>
     </button>
     ```
   - **Point Text** (`<span>`, `<label>`, badges, nav links, button text, single-line `<h1>`–`<h6>`): give `width: fit-content;` (never stretched `100%`-wide invisible text boxes inside flex/grid columns).
   - **Area Text** (multi-line `<p>` body copy): give `max-width: 60ch; height: auto;` so resizing width reflows lines naturally without vertical clipping.
3. **Universal Editable Frames — Sections, Sub-Sections, Cards & Controls**:
   - Wrap every logical section AND sub-section (navbar, hero copy stack, CTA row, bento card, KPI header, chip group, form `.field`, slider row, pricing tier, footer column) in its own clean semantic container with **deterministic `id`, `data-name`, and `data-vc-section`**.
   - Use `display: flex` or `display: grid` with `gap` (Figma Auto-Layout) instead of brittle hard-coded `position: absolute` page layouts or locked `max-height` traps so Flow Div (`D`), resize handles (`Hug` / `Fill` / `Fixed`), and child elements adapt smoothly.
4. **100% Pure Mathematical `<svg>` Vectors (Illustrator Isolation & Vector Paint Ready)**:
   - Render all icons, logos, avatars, stars, arrows, and charts as crisp inline `<svg>` vectors (`stroke="currentColor"` / clean `<path>`, `<rect>`, `<circle>`, `<g>` primitives) — never emojis or low-DPI raster icons — so Direct Selection (`A`), Double-Click SVG Isolation Mode, Vector Fill/Stroke painting, and `1600%` zoom stay razor-sharp.
5. **Standard `:root` Design System Token Contract (1-Click Famous Style Morphing)**:
   - Always define semantic tokens in `:root` and wire components to them:
     ```css
     :root {
       --bg: #0b0c0e;
       --surface: #14161a;
       --surface-2: #1d2026;
       --border: rgba(255, 255, 255, 0.09);
       --text: #f5f6f8;
       --text-muted: #9499a6;
       --primary: #f97316;
       --secondary: #a8a29e;
       --radius: 10px;
       --radius-lg: 16px;
       --shadow-card: 0 14px 34px -12px rgba(0, 0, 0, 0.55);
       --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
       --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
     }
     ```
   - Avoid generic "AI slop" (random purple-blue gradients, cluttered borders, low-contrast text `< 4.5:1`, tiny `< 36px` click targets, misaligned column edges). Pair intentional display + body typography and crisp 8px spatial rhythm.
6. **Hit-Target Inset & Zero Viewport Blockers**:
   - Interactive invisible hit-divs over a visible container must be inset by `8px` (`inset: 8px`) so the visible parent keeps a selectable `8px` outer rim; purely decorative glow/mesh overlays must set `pointer-events: none`.
   - Closed modals, drawers, and backdrops **must** have `hidden`, `display: none`, or `pointer-events: none`.
7. **Discoverable Navigation Links (`Links` Inspector Ready)**:
   - Attach page/section destinations via relative `<a href="pricing.html">`, `<button data-vc-link="pricing.html">`, or `data-href="#features"` so every link is editable in Vectora's **`Links` Tab** and works in both local server and browser VFS modes.

---

## 1. Real-Time Live Preview, Instant Two-Way Sync (`sathe sathe`) & Temporary Verification Tab

1. **Instant In-IDE & Browser Live Preview**:
   - Whenever you build/edit a web UI or the user types **`Vectora`** / **`Vectora Canvas`** / asks for a preview:
     1. Audit & enforce Section 0's Figma/Illustrator rules (preserving 100% visual fidelity & runtime behavior on existing apps).
     2. Ensure Vectora Canvas server is running or switched to the project folder on port `4680`:
        ```bash
        node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680
        ```
        *(Or call MCP tool `open_project`, or `POST http://127.0.0.1:4680/__vc_api/switch-target` with `{"target":"<PROJECT_FOLDER>","entry":"index.html"}`.)*
     3. Surface `[Vectora Canvas](sidecar://vectora-canvas/studio/)` so the user gets the **fully functional embedded studio right inside Antigravity**, alongside `http://127.0.0.1:4680/`.
2. **Real-Time Two-Way Sync (`sathe sathe` — Never Wait Until Later)**:
   - **Canvas → Code & Agent**: With **Live Sync** ON (default), every visual edit, **Famous Style** transformation (*Linear Dark*, *Apple Liquid Glass*, *Vercel Geist*, *Stripe Clean*, *Shadcn Zinc*, *Anthropic Warm Editorial*, *Neo-Brutalist*, *Raycast Glow*, *Framer Bento*, *Vectora Stone + Orange*), **Famous UI Element** insertion, **Premade UI Template** swap, or **Save (`Ctrl+S`)** writes directly to HTML/CSS/JS **immediately** and streams deltas to `H:/AntyGravety/Vectora Canvas/memory/live-agent-sync.json` (auto-injected via `PreInvocation` hook & readable via `GET /__vc_api/live-sync` / MCP `get_live_sync_state`). Keep all component logic, JS state, and secondary pages aligned with the user's live style/template/layout changes! Preserve `/* === VECTORA CANVAS SYNC START === */` CSS/JS blocks and `data-vc-*` attributes.
   - **Agent → Canvas**: Whenever you edit `.html`, `.css`, or `.js` files on disk, `server.mjs`'s recursive `fs.watch` + `PostToolUse` hook automatically hot-reloads CSS/DOM inside Vectora Canvas in real time.
   - **Visual PNG Notes & Reference Image Arrows**: Always inspect `H:/AntyGravety/Vectora Canvas/memory/agent-notes.json` (`noteImagePath` via `read_file` + `arrows` + `referenceImages` + `markRect`) whenever user notes exist.
3. **Temporary Live Verification Preview (`Temp Preview`)**:
   - After completing UI/code work (or when the user clicks **`Temp Preview`** next to `Notes`), call `POST http://127.0.0.1:4680/__vc_api/temp-preview` (or MCP `open_temp_preview`) to open an ephemeral, zero-editor `/__vc_temp/<token>/<entry>` tab with automatic SSE live-reload to verify real clicks, routing, forms, animations, and 3D WebGL in a clean runtime tab.
