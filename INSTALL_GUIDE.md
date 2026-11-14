# Vectora Canvas — Universal Installation, Coding Rules & Usage Guide

**Vectora Canvas** (`vectora-canvas`) is a standalone, zero-dependency Direct-HTML/CSS/JS visual editor, whole-folder studio, and live preview workspace inspired by **Adobe Illustrator**, **Figma**, and **Airship**.

- **Live Web App (No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

---

## 1. Prerequisites

- **Browser Web App Mode**: Zero install — open **https://vectora-canvas.pages.dev** (or `studio/index.html`) and use **File → Open Project** to open any local HTML/CSS/JS folder directly in your browser.
- **Local CLI / Coding Agent Mode**: **Node.js 18+** (uses built-in `node:http`, `node:fs`, `node:path` — **no `npm install` required**).

---

## 2. Install Skill + Coding Agent Rules Across Any Coding Engine

### A. Google Antigravity (Plugin Bundle: Skill + Always-On Rules + Sidecar)
1. **Plugin (`~/.gemini/config/plugins/vectora-canvas/`)**:
   - `plugin.json`
   - `skills/vectora-canvas/SKILL.md`
   - `rules/AGENTS.md` (enforces auto-opening in Vectora + the Invisible-Over-Visible Div `8px` Inset Rule)
2. **Standalone Global Skill (`~/.gemini/config/skills/vectora-canvas/SKILL.md`)**:
   ```text
   C:\Users\<YOU>\.gemini\config\skills\vectora-canvas\SKILL.md
   ```
3. **Optional Sidecar Panel (`~/.gemini/config/sidecars/vectora-canvas/sidecar.json`)**:
   ```json
   {
     "id": "vectora-canvas",
     "name": "Vectora Canvas",
     "description": "Warm Grey Stone & Orange Direct-HTML/CSS/JS Visual Editor (Live & Edit Modes)",
     "command": "node",
     "args": ["H:/AntyGravety/Vectora Canvas/scripts/server.mjs"],
     "type": "web"
   }
   ```

### B. Claude Code (`~/.claude/skills/vectora-canvas/` + `CLAUDE.md`)
```bash
mkdir -p ~/.claude/skills/vectora-canvas
cp "H:/AntyGravety/Vectora Canvas/SKILL.md" ~/.claude/skills/vectora-canvas/SKILL.md
cp "H:/AntyGravety/Vectora Canvas/rules/AGENTS.md" ~/.claude/skills/vectora-canvas/AGENTS.md
```

### C. OpenAI Codex CLI (`~/.codex/skills/vectora-canvas/`)
```bash
mkdir -p ~/.codex/skills/vectora-canvas
cp "H:/AntyGravety/Vectora Canvas/SKILL.md" ~/.codex/skills/vectora-canvas/SKILL.md
cp "H:/AntyGravety/Vectora Canvas/rules/AGENTS.md" ~/.codex/skills/vectora-canvas/AGENTS.md
```

### D. OpenCode / Cursor / Windsurf
- **OpenCode**: Copy `SKILL.md` to `~/.config/opencode/skill/vectora-canvas/SKILL.md` and `rules/AGENTS.md` into your project root `AGENTS.md`.
- **Cursor**: Copy `rules/AGENTS.md` to `.cursor/rules/vectora-canvas.mdc`.
- **Windsurf**: Reference `H:/AntyGravety/Vectora Canvas/rules/AGENTS.md` in `.windsurfrules`.

---

## 3. Running Locally from Terminal

```bash
# Windows
"H:\AntyGravety\Vectora Canvas\vectora.cmd" --target "H:\MyProject" --entry index.html --port 4680 --open

# macOS / Linux / Git Bash
node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "/path/to/project" --entry index.html --port 4680 --open
```

Then open **`http://127.0.0.1:4680/`**.

---

## 4. Coding Agent Authoring Rules Summary (`rules/AGENTS.md`)

1. **Invisible-Over-Visible Div Inset Rule**: Any transparent/invisible `<div>` placed over a visible `<div>` of the same area MUST be **`8px`–`12px` smaller (`inset: 8px`)** than the visible `<div>` so both remain independently selectable and draggable.
2. **Closed Overlays**: Hidden modals/drawers must set `hidden`, `display: none`, or `pointer-events: none`.
3. **Semantic IDs & Relative Links**: Give sections, cards, and buttons clear `id` / `data-name` attributes and relative `<a href>` / `data-vc-link` URLs so **Layers** and the **Links** tab stay clean and navigable in both local and browser VFS modes.

---

## 5. Key Shortcuts Reference

| Shortcut | Action |
|---|---|
| **Click / `Shift+Click`** | Replace selection / Add object to selection |
| **Double-Click Group / `Esc`** | Enter Illustrator **Isolation Mode** (dims outside to 20%) / Exit Isolation level |
| **`Ctrl+Click` / `Ctrl+Shift+Click`** | Illustrator Select-Behind cycling / Additive Select-Behind |
| **Middle-Click Drag / `Space`+Drag / `H`** | 4-way Figma Hand Pan (`up`, `down`, `left`, `right`) |
| **`Ctrl + Space + Scroll` / `Ctrl + Scroll`** | Fixed-workspace Zoom anchored at cursor |
| **`V` / `A` / `E` / `S`** | Selection / Direct Selection / Free Transform / Session Tool |
| **`R` / `D` / `T` / `I` / `N`** | Shape / Flow Div Spacer / Type / Eyedropper / Agent Note |
| **`/` / `Shift + X`** | **Unfill (`None`)** on active Fill or Stroke / Swap Fill & Stroke |
| **`Ctrl + G` / `Ctrl + Alt + G`** | Group / Ungroup |
| **`Ctrl + 2` / `Ctrl + Alt + 2`** | Lock selected / Unlock selected item |
| **`Ctrl + ]` / `Ctrl + [`** | Bring Forward / Send Backward |
| **`Ctrl + C` / `Ctrl + X` / `Ctrl + V` / `Del`** | Copy / Cut / Paste / Delete (closes horizontal & vertical Flow Div gaps) |
| **`Ctrl + Z` / `Ctrl + Y`** | Undo / Redo (across every edit, paint, align, and link change) |
| **`Ctrl + S` / `Ctrl + E` / `Ctrl + K`** | Save Project / Toggle Edit vs Live Mode / Command Palette |
