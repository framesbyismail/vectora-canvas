# Vectora Canvas v3.0

**Figma & Adobe Illustrator Scene-Graph Visual HTML/CSS/JS Studio · Famous Design Styles & Premade UI Library · Real-Time Two-Way Coding Agent Sync · Temporary Live Verification Preview**

- **Live Standalone Web App (Cloudflare Pages)**: https://vectora-canvas.pages.dev
- **Works with Every Coding Agent**: Google Antigravity (`sidecar://vectora-canvas/` + MCP + Hooks), Claude Code, OpenAI Codex, Cursor, Windsurf, OpenCode, and VS Code.

## Quick Install (All Coding Agents)

```bash
node scripts/install-everywhere.mjs
```

## Highlights

- **Always-On Figma & Illustrator Scene-Graph Rules**: Once installed, coding agents author every UI out of discrete, selectable frames, tight `fit-content` point text, reflowable area text, semantic `:root` design tokens, and pure mathematical `<svg>` vectors (zero unselectable `::before`/`::after` shapes).
- **Real-Time Two-Way Sync (`sathe sathe`)**:
  - **Canvas → Code & Agent**: Live Sync writes HTML/CSS/JS in `150ms` and streams structured design/style/template deltas via `memory/live-agent-sync.json`, `PreInvocation` hooks, and MCP (`vectora_canvas_mcp`).
  - **Agent → Canvas**: Recursive `fs.watch` + `PostToolUse` hooks hot-swap CSS with zero flicker or reload the artboard while preserving zoom, pan, and mode.
- **Design Studio Library (`Styles & UI` / `L`)**:
  - **10 Famous Styles**: *Linear Dark Precision*, *Apple Liquid Glass*, *Vercel Geist Monochrome*, *Stripe Editorial Clean*, *Shadcn Modern Zinc*, *Anthropic Warm Editorial*, *Neo-Brutalist Studio*, *Raycast Midnight Glow*, *Framer Bento Luxe*, and *Vectora Stone + Orange* — 1-click morphs whatever UI the coding agent built!
  - **Famous UI Elements & Full-Page Premade Templates**: Insert or swap 100% Figma/Illustrator-editable navbars, `⌘K` command palettes, floating docks, bento grids, 3-tier pricing, KPI sparkline cards, AI prompt composers, auth cards, and full-page templates.
- **Temporary Live Verification Preview (`Temp Preview`)**: Ephemeral `/__vc_temp/<token>/<entry>` test tab (zero editor overlays + live SSE auto-reload) for instant runtime verification.
