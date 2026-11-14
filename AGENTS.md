# Vectora Canvas — Coding Agent Rules & HTML Authoring Guidelines

Follow these rules whenever creating, editing, refactoring, or previewing HTML/CSS/JS projects with **Vectora Canvas** (`H:/AntyGravety/Vectora Canvas` or `https://vectora-canvas.pages.dev`).

## 1. Instant Vectora Trigger & Live Open Rule

- Whenever the user types **`Vectora`**, **`Vectora Canvas`**, asks to visually edit HTML/CSS/JS, or asks to open/preview a project in Vectora:
  1. Start (or switch) the local Vectora Canvas server on port `4680` pointing at the project root:
     ```bash
     node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680
     ```
     *(If port `4680` is already running, switch targets live via `POST http://127.0.0.1:4680/__vc_api/switch-target` with `{"target":"<PROJECT_FOLDER>","entry":"index.html"}`.)*
  2. Open `http://127.0.0.1:4680/` in the browser / built-in browser pane so the user can edit immediately.
  3. In Google Antigravity, also include `[Vectora Canvas](sidecar://vectora-canvas/)` when the sidecar is installed.

## 2. Invisible-Over-Visible Div Inset Rule (Mandatory)

- **Never** place a transparent or invisible `<div>` (overlay, hit-target, click-catcher, or wrapper) at the exact `100% × 100%` (`inset: 0`) size directly on top of a visible `<div>`, `.card`, or `<section>`.
- **Always make the overlapping invisible `<div>` `8px`–`12px` smaller on each side** than the visible `<div>` underneath:
  ```css
  /* Correct: leaves an 8px–10px selectable outer rim on the visible parent div */
  .overlay-hit-div {
    position: absolute;
    inset: 8px; /* or width: calc(100% - 16px); height: calc(100% - 16px); */
  }
  ```
- **Why**: This guarantees that in Vectora Canvas, clicking or dragging the outer `8px` rim selects and moves the **visible `<div>`**, while clicking the inner area selects the **invisible `<div>`** (which can then be dragged from anywhere inside its empty middle without losing selection).

## 3. Vectora-Friendly HTML, CSS & JS Structure Rules

1. **No Full-Viewport Invisible Pointer Blockers**:
   - Closed modals, drawers, backdrops, and toast containers **must** have `hidden`, `display: none`, or `pointer-events: none`. Never leave an invisible `position: fixed; inset: 0; pointer-events: auto` layer covering the page.
2. **Semantic IDs & Layer Labels**:
   - Give major sections, cards, buttons, and interactive `<div>`s stable `id` or `data-name` attributes (e.g. `<section id="heroSection" data-name="Hero Banner">`) so Vectora's **Layers**, **Sessions**, **DOM**, and **Code Sync** map elements cleanly without brittle nth-of-type paths.
3. **Discoverable Button & Page Links (`Links` Tab Ready)**:
   - Use `<a href="about.html">`, `<button data-vc-link="pricing.html">`, or `data-href="#features"` for page/section navigation so every navigable button, card, and link appears in Vectora Canvas's **`Links` Inspector Tab** as an editable card.
   - Always use relative paths (`about.html`, `./docs.html`, `assets/app.js`) rather than hard-coded root `/` paths so projects run identically on local servers, `blob:` VFS previews, and static hosts.
4. **Flex/Grid Flow Layout Compatibility**:
   - Prefer `display: flex` or `display: grid` with `gap` on parent containers instead of hard-coded `position: absolute` coordinates for page sections and card grids. This lets Vectora's **Flow Div (`D`)** tool automatically claim space on insert and close horizontal/vertical gaps on delete.
5. **Global Theme CSS Custom Properties**:
   - Define `--primary` (or `--accent`) and `--secondary` in `:root` so Vectora Canvas's Primary & Secondary color pickers live-preview and persist theme changes cleanly.
6. **Composite Button & Group Cleanliness**:
   - Keep button icons (`<svg>`) and labels (`<span>`) inside a single `<button>` or `.btn` container so Vectora treats the button as a cohesive unit by default and allows **Double-Click Isolation Mode** when editing inner icons/text individually.
7. **Sync Blocks & Coding Agent Notes**:
   - Check `H:/AntyGravety/Vectora Canvas/memory/agent-notes.json` (or `.vectora-notes.json`) when asked to implement notes pinned in Vectora Canvas.
   - Preserve or cleanly merge `/* === VECTORA CANVAS SYNC === */` CSS blocks and `data-vc-*` link attributes saved from Vectora Canvas.
