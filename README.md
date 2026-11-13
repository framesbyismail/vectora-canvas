# Vectora Canvas

**Vectora Canvas** is a standalone visual HTML, CSS, and JavaScript workspace & coding-agent skill inspired by **Adobe Illustrator**, **Figma**, and **Airship** — styled in a clean **Grey Stone + Orange** interface with zero sign-in required.

- **Live Standalone App (Cloudflare Pages)**: https://vectora-canvas.pages.dev
- **Repository**: https://github.com/framesbyismail/vectora-canvas

## Highlights

- **Standalone Web App + Local Coding-Agent Studio**: Run directly in the browser on Cloudflare Pages (no login) or point the zero-dependency Node 18+ server (`scripts/server.mjs`) at any local project folder.
- **Automatic HTML, CSS & JS Code Sync**: Dragging, resizing, recolouring, editing typography, or adding/deleting layout blocks on the canvas updates HTML, CSS, and JavaScript automatically in real time (`Code` tab + `Files` tree).
- **Whole-Folder File Menu**: `New Session`, `New Project`, `Open Recent Session`, `Open Project` (upload any local folder with HTML/CSS/JS), `Save Project`, and `Export` (`.zip` bundle or `.html`).
- **Notes & One-Click Publish**: Pin element-specific agent notes (`Notes`) or click **`Publish`** right beside `Notes` to open the full live page cleanly in a new tab.
- **Illustrator & Figma Precision**:
  - Plain click replace, `Shift+Click` multi-select, `Ctrl+Click` Select-Behind / temporary selection override, and drag-marquee lower-object selection.
  - Natural `1920×1080` (16:9) website artboard framing, fixed-viewport zoom, and 4-way middle-click Figma panning.
  - Static-snapshot **Edit** mode (freezes scroll, animations, and 3D WebGL) vs interactive **Live** mode (preserving live state when switching back).
  - Automatic **Flow Div (`D`)** space reservation and horizontal + vertical gap closure on delete.
  - Custom Illustrator-style tool cursors (`V`, `A`, `E`, `S`, `R`, `D`, `T`, `I`, `M`, `N`, `H`, `Z`) and synchronized Primary/Secondary colour controls.

## Quick Start

### 1. Standalone Web App
Open **https://vectora-canvas.pages.dev** — start editing the built-in multi-file starter project immediately, or click **`File → Open Project`** to load any folder containing `.html`, `.css`, and `.js` files.

### 2. Local Folder Mode (Node.js 18+, Zero Dependencies)
```bash
node scripts/server.mjs --target /path/to/your-web-folder --entry index.html --port 4680 --open
```

See [INSTALL_GUIDE.md](./INSTALL_GUIDE.md) and [SKILL.md](./SKILL.md) for coding-agent integration instructions.
