---
name: vectora-canvas
description: Opens Vectora Canvas — an Adobe Illustrator, Figma & Airship-inspired Direct-HTML/CSS/JS visual design studio, Famous Styles & Premade UI Library, Temporary Live Verification Preview, and Real-Time Two-Way Coding Agent Sync engine for any coding agent (Antigravity, Claude Code, Codex, OpenCode, Cursor, Windsurf). Enforces Always-On Figma Frame & Illustrator Vector Scene-Graph authoring on every UI built. Trigger immediately whenever the user types "Vectora" or "Vectora Canvas", designs/edits web UI, or asks for a live preview.
---

# Vectora Canvas (`vectora-canvas` v3.0)

**Vectora Canvas** is a zero-dependency, universal **Figma & Adobe Illustrator Scene-Graph HTML/CSS/JS Visual Studio, Famous Design Styles & Premade UI Library, Temporary Verification Preview, and Real-Time Two-Way Coding Agent Sync Engine**.

- **Standalone Live Web App (Cloudflare Pages, No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

---

## 1. Universal Install (Activates Always-On Rules, Sidecar, Hooks & MCP Across All Agents)

Run once to install Vectora Canvas across **Google Antigravity** (Plugin + Embedded Sidecar + MCP Server + Real-Time `PreInvocation`/`PostToolUse` Hooks + Global Rules), **Claude Code**, **OpenAI Codex**, **Cursor**, and **OpenCode**:

```bash
node "H:/AntyGravety/Vectora Canvas/scripts/install-everywhere.mjs"
```

---

## 2. Always-On Figma Frame & Illustrator Vector Scene-Graph Rule (Every UI You Build)

Whenever this skill/plugin is installed, **every UI, webpage, dashboard, or component you author must be 100% directly manipulable like a native Figma / Adobe Illustrator file (`sob dhore dhore kaj kora jabe`)**:

1. **Zero CSS Pseudo-Element Shapes (`::before` / `::after` Ban)**: Every visible badge, dot, divider, glow orb, checkmark, chart, and icon must be a real DOM or `<svg>` node (`data-name="..."`) — never unselectable `::before`/`::after` shapes.
2. **Standalone Point Text (`width: fit-content`) vs. Area Text (`max-width` + `height: auto`)**:
   - Wrap every text piece in its own semantic tag (`<span class="vc-pt">`, `<label>`, `<h1>`–`<h6>`, `<p>`). Never mix bare `TextNode`s alongside `<svg>`, `<button>`, `<input>`, or `<span>` siblings.
3. **Universal Editable Frames & Sub-Sections**: Give every section, sub-section, card, `.field`, chip bar, button group, and column deterministic `id`, `data-name`, and `data-vc-section` with `display: flex` / `display: grid` + `gap` (Figma Auto-Layout).
4. **Pure Mathematical `<svg>` Vectors**: Author icons, logos, avatars, stars, and charts as crisp inline `<svg>` primitives (`<path>`, `<rect>`, `<circle>`, `<g>`) supporting Direct Selection (`A`), Double-Click Vector Isolation Mode, and Vector Fill/Stroke painting without raster pixelation up to `1600%` zoom.
5. **Standard `:root` Design System Tokens**: Define `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--primary`, `--secondary`, `--radius`, `--radius-lg`, `--shadow-card`, `--font-display`, `--font-sans` in `:root` so Vectora's **10 Famous Styles** transform the entire UI cleanly in 1 click.
6. **Hit-Target `8px` Inset, Zero Closed-Overlay Blockers & `Links` Tab Attributes** (`href` / `data-vc-link`).

---

## 3. Real-Time Embedded Preview, Instant Two-Way Sync (`sathe sathe`) & Temp Preview

1. **Launch / Switch Target & Surface Embedded Sidecar**:
   ```bash
   node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "<PROJECT_FOLDER>" --entry index.html --port 4680
   ```
   Or switch live via `POST http://127.0.0.1:4680/__vc_api/switch-target` (`{"target":"<PROJECT_FOLDER>","entry":"index.html"}`) or MCP tool `open_project`. Always include `[Vectora Canvas](sidecar://vectora-canvas/studio/)` in Antigravity so the user can edit directly inside the side pane!
2. **Real-Time Two-Way Sync (`sathe sathe`)**:
   - **Canvas → Code & Agent**: **Live Sync** (`#autoSaveLabel`) is **ON by default** (`150ms` AST/CSS/HTML write + `memory/live-agent-sync.json` + SSE `live_sync_updated` + `PreInvocation` hook). Clicking **Save (`Ctrl+S`)** commits the `Original` baseline and dispatches a `saved` sync revision to the Coding Agent.
   - **Agent → Canvas**: Recursive `fs.watch` + `PostToolUse` hook broadcasts SSE `disk_files_changed` -> zero-flicker live CSS hot-swap (`hot_reload_stylesheets`) or state-preserving artboard reload!
3. **Design Studio Library (`Styles & UI` / Shortcut `L`)**:
   - **10 Famous Styles** (*Linear Dark Precision*, *Apple Liquid Glass*, *Vercel Geist Monochrome*, *Stripe Editorial Clean*, *Shadcn Modern Zinc*, *Anthropic Warm Editorial*, *Neo-Brutalist Studio*, *Raycast Midnight Glow*, *Framer Bento Luxe*, *Vectora Stone + Orange*) — 1-click transforms whatever UI the Coding Agent built and syncs tokens + CSS back to code & agent!
   - **Famous UI Elements** (Floating Glass Navbar, `⌘K` Command Palette, Floating Dock, Precision Hero, 4-Card Bento Grid, Social Proof Strip, 3-Tier Pricing, KPI Sparkline Card, Testimonial Card, AI Prompt Composer, Clean Auth Card, SaaS Footer) — `Insert` or `Swap Selected`!
   - **Premade Full-Page UI Templates** (*Modern SaaS Landing*, *AI Creative Studio*, *Executive Analytics Dashboard*, *Editorial Portfolio*, *Split-Screen Auth & Onboarding*) — transform the current page (`Ctrl+Z` undoable) or create a `+ New Page`.
4. **Temporary Live Verification Preview (`Temp Preview` / `/__vc_api/temp-preview`)**:
   - Beside `Notes`, **`Temp Preview`** (and MCP `open_temp_preview`) spins up an ephemeral `/__vc_temp/<token>/<entry>` tab (zero editor gizmos + automatic SSE live-reload on file edits + 30-min auto-expiry) — ideal for live runtime testing by both user and Coding Agent.
