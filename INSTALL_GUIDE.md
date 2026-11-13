# Vectora Canvas — Universal Installation & Usage Guide

**Vectora Canvas** (`vectora-canvas`) is a standalone, zero-dependency visual HTML/CSS/JS editor, whole-folder studio, and live preview workspace inspired by **Adobe Illustrator**, **Figma**, and **Airship**.

- **Live Web App (No Sign-In)**: https://vectora-canvas.pages.dev
- **GitHub Repository**: https://github.com/framesbyismail/vectora-canvas

---

## 1. Prerequisites (Local CLI / Agent Skill Mode)

- **Node.js 18+** (built-in `node:http`, `node:fs`, `node:path` — **no `npm install` required**).
- Or open **https://vectora-canvas.pages.dev** (or `studio/index.html`) directly in any modern browser with zero backend required.

---

## 2. Install Across Any Coding Engine

### A. Google Antigravity (Global Skill + Sidecar)
Copy `SKILL.md` to:
```text
C:\Users\<YOU>\.gemini\config\skills\vectora-canvas\SKILL.md
```
Optional Sidecar panel (`C:\Users\<YOU>\.gemini\config\sidecars\vectora-canvas\sidecar.json`):
```json
{
  "id": "vectora-canvas",
  "name": "Vectora Canvas",
  "description": "Grey Stone & Orange Direct-HTML/CSS/JS Visual Editor (Live & Edit Modes)",
  "command": "node",
  "args": ["H:/AntyGravety/Vectora Canvas/scripts/server.mjs"],
  "type": "web"
}
```

### B. Claude Code (`~/.claude/skills/vectora-canvas/SKILL.md`)
```bash
mkdir -p ~/.claude/skills/vectora-canvas
cp "H:/AntyGravety/Vectora Canvas/SKILL.md" ~/.claude/skills/vectora-canvas/SKILL.md
```

### C. OpenAI Codex CLI (`~/.codex/skills/vectora-canvas/SKILL.md`)
```bash
mkdir -p ~/.codex/skills/vectora-canvas
cp "H:/AntyGravety/Vectora Canvas/SKILL.md" ~/.codex/skills/vectora-canvas/SKILL.md
```

### D. OpenCode / Cursor / Windsurf
- **OpenCode**: Place `SKILL.md` in `~/.config/opencode/skill/vectora-canvas/SKILL.md`
- **Cursor**: Add `SKILL.md` to `.cursor/rules/vectora-canvas.mdc`
- **Windsurf**: Reference `H:/AntyGravety/Vectora Canvas/SKILL.md` in `.windsurfrules` or global skills

---

## 3. Running Locally from Terminal

```bash
# Windows
"H:\AntyGravety\Vectora Canvas\vectora.cmd" --target "H:\MyProject" --entry index.html --port 4680 --open

# macOS / Linux / Git Bash
node "H:/AntyGravety/Vectora Canvas/scripts/server.mjs" --target "/path/to/project" --open
```

Then open **`http://127.0.0.1:4680/`**.

---

## 4. File Menu, Whole-Folder Sync & Publishing

- **File Box** (beside `Sessions & Views`): `New Session`, `New Project`, `Open Recent Session`, `Open Project` (supports whole folders with HTML, CSS & JS), `Save Project`, and `Export` (downloads `.zip` archive for multi-file projects or `.html` for single files).
- **Auto Code Sync**: Canvas changes automatically update HTML, CSS, and JavaScript in the **Code** tab (`Synced HTML · CSS · JS`).
- **Notes & Publish**: Use `Notes` (`N`) to pin design feedback and **Publish** (beside `Notes`) to launch the clean full live page in a new tab.

---

## 5. Key Shortcuts Reference

| Shortcut | Action |
|---|---|
| **Click / `Shift+Click`** | Replace selection / Add object to selection |
| **`Ctrl+Click` / `Ctrl+Shift+Click`** | Illustrator temporary selection & Select-Behind cycling / Additive Select-Behind |
| **Middle-Click Drag / `Space`+Drag / `H`** | 4-way Figma Hand Pan (`up`, `down`, `left`, `right`) |
| **`Ctrl + Space + Scroll` / `Ctrl + Scroll`** | Fixed-workspace Zoom anchored at cursor |
| **`V` / `A` / `E` / `S`** | Selection / Direct Selection / Transform / Session Tool |
| **`R` / `D` / `T` / `I` / `N`** | Shape / Flow Div Spacer / Type / Eyedropper / Agent Note |
| **`Ctrl + G` / `Ctrl + Alt + G`** | Group (supports nested & cross-session) / Ungroup |
| **`Ctrl + 2` / `Ctrl + Alt + 2`** | Lock selected / Unlock selected item |
| **`Ctrl + ]` / `Ctrl + [`** | Bring Forward / Send Backward |
| **`Ctrl + C` / `Ctrl + X` / `Ctrl + V` / `Del`** | Copy / Cut / Paste / Delete (closes horizontal & vertical Flow Div gaps) |
| **`Ctrl + Z` / `Ctrl + Y`** | Undo / Redo (works across every step including after Save) |
| **`Ctrl + S`** | Save Project & update `Original` baseline |
| **`Ctrl + E` / `Ctrl + K` / `?`** | Toggle Frozen Edit vs Full Live Mode / Command Palette / Shortcuts Sheet |
