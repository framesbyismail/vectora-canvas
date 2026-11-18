# Vectora Canvas v3.0 — Universal Installation, Always-On Rules & Studio Guide

**Vectora Canvas** (`vectora-canvas`) is a zero-dependency **Figma & Adobe Illustrator Scene-Graph HTML/CSS/JS Visual Studio**, **Famous Styles & Premade UI Library**, **Temporary Verification Preview**, and **Real-Time Two-Way Coding Agent Sync Engine**.

- **Live Web App (No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

---

## 1. One-Command Universal Install (Antigravity, Claude Code, Codex, Cursor, OpenCode)

```bash
node "H:/AntyGravety/Vectora Canvas/scripts/install-everywhere.mjs"
```

This automatically installs and activates:
1. **Always-On Figma Frame & Illustrator Vector Scene-Graph Authoring Rules** (`AGENTS.md` / `CLAUDE.md` / `vectora-canvas.mdc`) so every UI built by any coding agent is 100% object-by-object selectable, movable, resizable, and restylable.
2. **Antigravity UI Sidecar (`[Vectora Canvas](sidecar://vectora-canvas/)`)** with dual-port mirroring (`ANTIGRAVITY_SIDECAR_WEB_PORT` + `http://127.0.0.1:4680`) for embedded functional in-IDE editing.
3. **Real-Time Lifecycle Hooks (`hooks.json` -> `scripts/vc-hook.mjs`)** & **MCP Server (`mcp_config.json` -> `scripts/mcp-server.mjs`)** for instant two-way sync (`sathe sathe`) between canvas edits and coding agents.

---

## 2. Running Locally or Switching Projects

```bash
# Start studio on a project folder
node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "H:/MyProject" --entry index.html --port 4680 --open

# Switch active project live
curl -X POST http://127.0.0.1:4680/__vc_api/switch-target -H "Content-Type: application/json" -d "{\"target\":\"H:/MyProject\",\"entry\":\"index.html\"}"

# Open a Temporary Live Verification Preview tab (Coding Agent test tab)
curl -X POST http://127.0.0.1:4680/__vc_api/temp-preview -H "Content-Type: application/json" -d "{\"entry\":\"index.html\",\"openBrowser\":true}"
```

---

## 3. Key Studio Shortcuts

| Shortcut | Action |
|---|---|
| **`L`** | Toggle **Design Studio Library** (`Famous Styles` · `UI Elements` · `Premade Templates`) |
| **Click / `Shift+Click` / `Ctrl+Click`** | Select / Add to selection / Illustrator Select-Behind |
| **Double-Click Frame or `<svg>` / `Esc`** | Enter Illustrator **Isolation Mode** (1 level per double-click, including `<svg>` paths!) / Exit |
| **Middle-Click Drag / `Space`+Drag / `H`** | 4-way Figma Hand Pan |
| **`Ctrl + Scroll` / `Ctrl + Space + Scroll`** | Cursor-anchored Zoom |
| **`V` / `A` / `E` / `S`** | Selection / Direct Selection (selects inner SVG paths!) / Free Transform / Session Tool |
| **`R` / `D` / `T` / `I` / `N`** | Shape / Flow Div / Type / Eyedropper / Visual PNG + Arrow Agent Note |
| **`/` / `Shift + X`** | Unfill (`None`) / Swap Fill & Stroke |
| **`Ctrl + G` / `Ctrl + Alt + G`** | Group / Ungroup |
| **`Ctrl + 2` / `Ctrl + Alt + 2`** | Lock / Unlock item |
| **`Ctrl + Z` / `Ctrl + Y` / `Ctrl + S`** | Undo / Redo / Commit Save & Sync with Coding Agent |
