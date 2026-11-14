# Vectora Canvas — Coding Agent Rules & HTML Authoring Guidelines

Follow these rules whenever creating, editing, refactoring, or opening **any** HTML/CSS/JS project with **Vectora Canvas** (`H:/AntyGravety/Vectora Canvas` or `https://vectora-canvas.pages.dev`).

## 1. Mandatory Pre-Open Audit & Instant Live Open Rule

- Whenever the user types **`Vectora`**, **`Vectora Canvas`**, asks to visually edit HTML/CSS/JS, or asks to open/preview a project in Vectora:
  1. **Audit & Enforce All Vectora Rules First (Mandatory)**: Before opening any existing or newly created design in Vectora Canvas, inspect its HTML/CSS/JS and apply Rules 2–5 below (especially the **Standalone Tight Text Rule**, **Universal Editable Section & Sub-Section Rule**, **Invisible-Over-Visible Div Inset Rule**, semantic `[data-name]`/`id`/`[data-vc-section]` labels, `:root` `--primary`/`--secondary`, and discoverable links) while preserving **100% exact visual appearance (`0` pixel change) and 100% runtime functionality**.
  2. **Start or Switch Server on Port `4680`**:
     ```bash
     node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680
     ```
     *(If port `4680` is already running, switch targets live via `POST http://127.0.0.1:4680/__vc_api/switch-target` with `{"target":"<PROJECT_FOLDER>","entry":"index.html"}`.)*
  3. **Open Live Workspace**: Open `http://127.0.0.1:4680/` in the browser / built-in browser pane so the user can edit immediately, and in Google Antigravity always include `[Vectora Canvas](sidecar://vectora-canvas/)`.

## 2. Standalone Tight Text Rule — No Text Stuck Inside Invisible Boxes (Mandatory for All Designs)

- **Every visible piece of text must be its own standalone semantic text element** (`<span>`, `<label>`, `<h1>`–`<h6>`, `<p>`, `<small>`, `<b>`, `<strong>`, `<output>`) — **never** trapped inside an oversized or invisible wrapper `<div>`!
- **Never mix bare unwrapped `TextNode`s alongside sibling elements** (`<svg>`, `<button>`, `<input>`, `<select>`, `<a>`, `<small>`) inside a parent container:
  ```html
  <!-- WRONG: bare text node mixed beside <svg> or <button> -->
  <button id="resetBtn"><svg>...</svg> Reset</button>
  <div class="labrow"><span><button class="kb"></button>Rotate</span><output>0°</output></div>

  <!-- CORRECT: every text is a standalone tight <span> -->
  <button id="resetBtn"><svg>...</svg><span class="vp-txt">Reset</span></button>
  <div class="labrow"><span><button class="kb"></button><span class="vp-txt">Rotate</span></span><output>0°</output></div>
  ```
- **Tight Glyph-Fitting Bounds (`width: fit-content`)**:
  - In flex-column or grid containers (`display: flex; flex-direction: column;` where `align-items: stretch` is the CSS default), give standalone `<label>`, heading, and caption tags `width: fit-content;` (and `align-self: center;` when centered) so their selection box hugs the text tightly instead of stretching into a `100%`-wide invisible box across the panel.
  - Pure layout wrapper `<div>`s (`.row`, `.field`, `.cbody`, `.labrow`) must remain clean layout containers without swallowing clicks meant for standalone text.

## 3. Universal Editable Section & Sub-Section Rule (Mandatory for All Web Designs)

- **Every logical section AND sub-section of a web design must be directly selectable, movable, and resizable (larger & smaller) in Vectora Canvas**, just like a native Figma / Illustrator design file:
  - Wrap every distinct functional group — cards, prompt/chip sections (e.g. `Key Prompts`), subject/focus panes (`Select Focus Point`, `Select Focus Subject`), slider blocks, segmented rows, form `.field`s, button rows, and split panes — in its own clean semantic container with `id`, `data-name`, and `data-vc-section`:
    ```html
    <div class="field" id="keyPromptsSection" data-name="Key Prompts Section" data-vc-section="Key Prompts">
      <label class="field-lbl">Key prompts</label>
      <div class="chips" id="keys" data-name="Key Prompt Chips">...</div>
    </div>
    ```
  - Avoid locking sub-sections with rigid un-resizable constraints (`pointer-events: none` on visible containers or hard `min-height`/`max-height` lockups without flex flow) so any card, `.field`, `.chips`, `.sl`, `.seg`, or pane can be grabbed, moved, enlarged, and shrunk smoothly while standalone tight text inside it remains tightly selectable.

## 4. Invisible-Over-Visible Div Inset Rule (Mandatory)

- **Never** place a transparent or invisible `<div>` (overlay, hit-target, click-catcher, or hidden `<input>` overlay) at the exact `100% × 100%` (`inset: 0`) size directly on top of a visible `<div>`, `.card`, or `<section>`.
- **Always make the overlapping invisible `<div>` `8px`–`12px` smaller on each side** than the visible `<div>` underneath:
  ```css
  /* Correct: leaves an 8px–10px selectable outer rim on the visible parent div */
  .overlay-hit-div {
    position: absolute;
    inset: 8px; /* or width: calc(100% - 16px); height: calc(100% - 16px); */
  }
  ```
- **Why**: Clicking/dragging the outer `8px` rim selects and moves the **visible `<div>`**, while clicking the inner area selects the **invisible `<div>`** (which holds selection and drags smoothly from its empty middle).

## 5. Vectora-Friendly HTML, CSS & JS Structure Rules

1. **No Full-Viewport Invisible Pointer Blockers**:
   - Closed modals, drawers, backdrops, and loading/toast overlays **must** have `hidden`, `display: none`, or `pointer-events: none`. Never leave an invisible `position: fixed; inset: 0; pointer-events: auto` layer covering the artboard.
2. **Semantic IDs & Layer Labels**:
   - Give major sections, sub-sections, cards, buttons, and interactive `<div>`s stable `id`, `data-name`, and `data-vc-section` attributes (e.g. `<section id="heroSection" data-name="Hero Banner" data-vc-section="Hero Banner">`) so Vectora's **Layers**, **Sessions**, **DOM**, and **Code Sync** map elements cleanly without brittle `nth-of-type` paths.
3. **Discoverable Button & Page Links (`Links` Tab Ready)**:
   - Use `<a href="about.html">`, `<button data-vc-link="pricing.html">`, or `data-href="#features"` with relative paths (`./docs.html`, `assets/app.js`) so every navigable button, card, and link appears in Vectora Canvas's **`Links` Inspector Tab** and works identically on local servers, `blob:` VFS previews, and static hosts.
4. **Flex/Grid Flow Layout & Clean Pixel Alignment**:
   - Prefer `display: flex` or `display: grid` with `gap` on parent containers instead of hard-coded `position: absolute` coordinates for page sections and card grids so Vectora's **Flow Div (`D`)** tool claims space on insert and closes horizontal/vertical gaps on delete, and verify top/bottom/side column edges and text baselines align cleanly against Vectora's **Figma Pixel Rulers & Magnetic Snap Guides**.
5. **Global Theme CSS Custom Properties**:
   - Define `--primary` (or `--accent`) and `--secondary` in `:root` so Vectora Canvas's Primary & Secondary color pickers live-preview and persist theme changes cleanly.
6. **Adobe Illustrator Isolation Mode Ready**:
   - Keep composite controls (`<button>`, `<a>`, `.btn`, cards) cleanly structured with `<svg>` icons and standalone `<span>` labels inside so single-click selects/moves the control as a unit, while **Double-Click** enters **Illustrator Isolation Mode** (1 hierarchy level per double-click) to move/edit inner icons and text independently without grabbing raw text characters.
7. **Visual PNG Notes, Reference Image Arrows & Coding Agent Handoff (`agent-notes.json` + `noteImagePath`)**:
   - Whenever the user marks a region or draws an arrow from a pasted Reference Image with the **Note Tool (`N`)**, read `H:/AntyGravety/Vectora Canvas/memory/agent-notes.json` (or `GET http://127.0.0.1:4680/__vc_api/notes` / `.vectora-notes.json` in `.zip` exports).
   - Every note is also rendered and saved **as a visual composite PNG image** at `noteImagePath` (`H:/AntyGravety/Vectora Canvas/memory/note-images/<workspaceId>/note_<number>_<id>.png`, or `.vectora-notes/note_<number>.png` in `.zip` exports) showing the live UI region + pasted reference design image(s) + directional orange vector arrow(s) + target callout. **Always inspect `noteImagePath` with `read_file`** alongside `markRect`, `arrows`, `referenceImages`, `sectionLabel`, `selector`, `enclosedElements`, `htmlSnippet`, and `text`. Preserve `/* === VECTORA CANVAS SYNC === */` CSS blocks and `data-vc-*` attributes.
8. **100% Crisp Vector Rendering (Never Pixelated)**:
   - Keep icons, logos, cursors, shapes, badges, rulers, arrows, and UI controls as pure mathematical SVG / CSS vectors (never fixed low-DPI raster bitmaps or `will-change: transform` bitmap-cached containers that blur under CSS `scale()`), and size any interactive `<canvas>` gizmos by `window.devicePixelRatio` so zooming up to `1600%` stays razor-sharp.
