/**
 * Vectora Canvas — Famous Styles, Famous UI Elements & Premade Templates Engine (design-library.js)
 * Zero external dependencies. Runs identically in Browser (window.VectoraDesignLibrary) and Node.js (CommonJS).
 *
 * Every element and template generated here strictly obeys the Vectora Figma & Illustrator Scene-Graph Standard:
 *  - Every logical section, card, row, and control group has deterministic id, data-name, and data-vc-section.
 *  - Every visible piece of text is a standalone semantic element (Point Text width: fit-content; Area Text max-width + height: auto).
 *  - Zero bare TextNodes mixed alongside sibling <svg>, <button>, <input>, or <span> elements.
 *  - Zero unselectable ::before / ::after decorative shapes — every badge, dot, divider, sparkline, and icon is a real DOM / <svg> vector node.
 *  - Driven by semantic :root CSS tokens (--primary, --secondary, --bg, --surface, --surface-2, --border, --text, --text-muted, --radius)
 *    so any Famous Style transforms both existing agent UIs and inserted elements seamlessly in 1 click.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VectoraDesignLibrary = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // =========================================================================
  // 1. FAMOUS DESIGN STYLES (WHOLE-UI TRANSFORMATION PRESETS)
  // =========================================================================
  const FAMOUS_STYLES = [
    {
      id: 'linear-dark',
      name: 'Linear Dark Precision',
      badge: 'SaaS · Dark',
      inspiration: 'Linear.app',
      summary: 'Obsidian surfaces, 1px translucent hairlines, top-edge specular sheen, tight Inter tracking.',
      googleFonts: ['Inter', 'JetBrains Mono'],
      swatches: ['#08090a', '#121316', '#5e6ad2', '#f7f8f8'],
      tokens: {
        '--bg': '#08090a',
        '--surface': '#111215',
        '--surface-2': '#181a1f',
        '--border': 'rgba(255, 255, 255, 0.085)',
        '--text': '#f7f8f8',
        '--text-muted': '#8a8f98',
        '--primary': '#5e6ad2',
        '--secondary': '#8a8f98',
        '--radius': '10px',
        '--radius-lg': '14px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.06) inset, 0 14px 36px -12px rgba(0,0,0,0.65)',
        '--font-display': "'Inter', system-ui, sans-serif",
        '--font-sans': "'Inter', system-ui, sans-serif",
        '--font-mono': "'JetBrains Mono', monospace"
      },
      extraRules: `
        body { letter-spacing: -0.014em; background-image: radial-gradient(ellipse 80% 45% at 50% -10%, rgba(94, 106, 210, 0.16), transparent 70%); }
        h1, h2, h3 { letter-spacing: -0.032em; font-weight: 600; }
      `
    },
    {
      id: 'apple-liquid-glass',
      name: 'Apple Liquid Glass',
      badge: 'visionOS · Glass',
      inspiration: 'Apple macOS / visionOS',
      summary: 'Frosted 28px backdrop blur, luminous specular inner rim, 22px squircle corners, airy spatial depth.',
      googleFonts: ['Plus Jakarta Sans'],
      swatches: ['#0c1017', '#1e2636', '#f97316', '#f8fafc'],
      tokens: {
        '--bg': '#0b0f17',
        '--surface': 'rgba(255, 255, 255, 0.075)',
        '--surface-2': 'rgba(255, 255, 255, 0.12)',
        '--border': 'rgba(255, 255, 255, 0.18)',
        '--text': '#f8fafc',
        '--text-muted': 'rgba(248, 250, 252, 0.68)',
        '--primary': '#ff7a18',
        '--secondary': '#cbd5e1',
        '--radius': '18px',
        '--radius-lg': '24px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.26) inset, 0 24px 48px -12px rgba(0,0,0,0.52)',
        '--font-display': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        '--font-sans': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      },
      glassBackdrop: 'blur(26px) saturate(180%)',
      extraRules: `
        body { background-image: radial-gradient(circle at 18% 12%, rgba(255, 122, 24, 0.22), transparent 42%), radial-gradient(circle at 84% 20%, rgba(251, 146, 60, 0.14), transparent 46%); }
      `
    },
    {
      id: 'vercel-geist',
      name: 'Vercel Geist Monochrome',
      badge: 'DevTools · Minimal',
      inspiration: 'Vercel / Geist',
      summary: 'Pure high-contrast #0a0a0a matte surfaces, razor-sharp 1px #262626 borders, technical 6px geometry.',
      googleFonts: ['Inter', 'JetBrains Mono'],
      swatches: ['#000000', '#111111', '#ededed', '#888888'],
      tokens: {
        '--bg': '#000000',
        '--surface': '#0a0a0a',
        '--surface-2': '#141414',
        '--border': '#262626',
        '--text': '#ededed',
        '--text-muted': '#888888',
        '--primary': '#ededed',
        '--primary-ink': '#0a0a0a',
        '--secondary': '#a1a1aa',
        '--radius': '6px',
        '--radius-lg': '10px',
        '--shadow-card': '0 0 0 1px #262626',
        '--font-display': "'Inter', system-ui, sans-serif",
        '--font-sans': "'Inter', system-ui, sans-serif",
        '--font-mono': "'JetBrains Mono', monospace"
      },
      extraRules: `
        h1, h2, h3 { letter-spacing: -0.04em; font-weight: 700; }
      `
    },
    {
      id: 'stripe-clean-luxe',
      name: 'Stripe Editorial Clean',
      badge: 'Fintech · Light',
      inspiration: 'Stripe.com',
      summary: 'Crisp #f6f9fc light canvas, elevated pure-white cards, multi-layered ambient shadows, refined slate ink.',
      googleFonts: ['Plus Jakarta Sans', 'JetBrains Mono'],
      swatches: ['#f6f9fc', '#ffffff', '#0a2540', '#ea580c'],
      tokens: {
        '--bg': '#f6f9fc',
        '--surface': '#ffffff',
        '--surface-2': '#f1f5f9',
        '--border': 'rgba(10, 37, 64, 0.10)',
        '--text': '#0a2540',
        '--text-muted': '#425466',
        '--primary': '#ea580c',
        '--secondary': '#425466',
        '--radius': '12px',
        '--radius-lg': '18px',
        '--shadow-card': '0 13px 27px -5px rgba(50,50,93,0.12), 0 8px 16px -8px rgba(0,0,0,0.14)',
        '--font-display': "'Plus Jakarta Sans', system-ui, sans-serif",
        '--font-sans': "'Plus Jakarta Sans', system-ui, sans-serif"
      },
      isLight: true,
      extraRules: `
        h1, h2, h3 { letter-spacing: -0.03em; color: #0a2540; }
      `
    },
    {
      id: 'shadcn-zinc',
      name: 'Shadcn Modern Zinc',
      badge: 'Product · UI Kit',
      inspiration: 'ui.shadcn.com',
      summary: 'Balanced #09090b / #18181b zinc tokens, clean 8px radius, crisp outline & solid button hierarchy.',
      googleFonts: ['Inter', 'JetBrains Mono'],
      swatches: ['#09090b', '#18181b', '#f97316', '#fafafa'],
      tokens: {
        '--bg': '#09090b',
        '--surface': '#121215',
        '--surface-2': '#18181b',
        '--border': '#27272a',
        '--text': '#fafafa',
        '--text-muted': '#a1a1aa',
        '--primary': '#f97316',
        '--secondary': '#a1a1aa',
        '--radius': '8px',
        '--radius-lg': '12px',
        '--shadow-card': '0 1px 2px rgba(0,0,0,0.45)',
        '--font-display': "'Inter', system-ui, sans-serif",
        '--font-sans': "'Inter', system-ui, sans-serif"
      },
      extraRules: ``
    },
    {
      id: 'anthropic-warm-paper',
      name: 'Anthropic Warm Editorial',
      badge: 'AI · Editorial',
      inspiration: 'Anthropic / Claude',
      summary: 'Warm alabaster parchment #faf9f5, literary serif display headings, terracotta #d97757 craft accent.',
      googleFonts: ['Instrument Serif', 'Plus Jakarta Sans'],
      swatches: ['#faf9f5', '#f2efe8', '#d97757', '#141413'],
      tokens: {
        '--bg': '#faf9f5',
        '--surface': '#f3f0e8',
        '--surface-2': '#e8e4d9',
        '--border': 'rgba(20, 20, 19, 0.12)',
        '--text': '#141413',
        '--text-muted': '#5c5a53',
        '--primary': '#d97757',
        '--secondary': '#5c5a53',
        '--radius': '12px',
        '--radius-lg': '18px',
        '--shadow-card': '0 4px 20px rgba(20, 20, 19, 0.05)',
        '--font-display': "'Instrument Serif', Georgia, serif",
        '--font-sans': "'Plus Jakarta Sans', system-ui, sans-serif"
      },
      isLight: true,
      extraRules: `
        h1, h2 { font-family: 'Instrument Serif', Georgia, serif !important; font-weight: 400 !important; letter-spacing: -0.015em; }
      `
    },
    {
      id: 'neo-brutalist-pop',
      name: 'Neo-Brutalist Studio',
      badge: 'Bold · Gumroad',
      inspiration: 'Gumroad / Figma Config',
      summary: 'Warm cream canvas, crisp 2px solid #141413 ink borders, tactile 4px hard offset shadows, Space Grotesk.',
      googleFonts: ['Space Grotesk', 'DM Sans'],
      swatches: ['#f4f0e8', '#ffffff', '#ff6b2c', '#141413'],
      tokens: {
        '--bg': '#f4f0e8',
        '--surface': '#ffffff',
        '--surface-2': '#ebe5d8',
        '--border': '#141413',
        '--text': '#141413',
        '--text-muted': '#4a4740',
        '--primary': '#ff6b2c',
        '--secondary': '#141413',
        '--radius': '10px',
        '--radius-lg': '14px',
        '--shadow-card': '4px 4px 0px #141413',
        '--font-display': "'Space Grotesk', system-ui, sans-serif",
        '--font-sans': "'DM Sans', system-ui, sans-serif"
      },
      isLight: true,
      borderWidth: '2px',
      extraRules: `
        button, .btn, .btn-primary, .btn-secondary { border: 2px solid #141413 !important; box-shadow: 3px 3px 0px #141413 !important; font-weight: 700 !important; }
      `
    },
    {
      id: 'raycast-glow',
      name: 'Raycast Midnight Glow',
      badge: 'Desktop · Pro',
      inspiration: 'Raycast.com',
      summary: 'Deep charcoal glass, warm coral-amber top aura, crisp keyboard-first surfaces and glowing rims.',
      googleFonts: ['Inter', 'JetBrains Mono'],
      swatches: ['#0c0d10', '#16181d', '#ff6363', '#f4f4f6'],
      tokens: {
        '--bg': '#0c0d10',
        '--surface': 'rgba(26, 28, 35, 0.86)',
        '--surface-2': '#22252e',
        '--border': 'rgba(255, 255, 255, 0.10)',
        '--text': '#f4f4f6',
        '--text-muted': '#9499a6',
        '--primary': '#ff6347',
        '--secondary': '#9499a6',
        '--radius': '14px',
        '--radius-lg': '18px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 42px -14px rgba(0,0,0,0.72)',
        '--font-display': "'Inter', system-ui, sans-serif",
        '--font-sans': "'Inter', system-ui, sans-serif"
      },
      glassBackdrop: 'blur(18px) saturate(150%)',
      extraRules: `
        body { background-image: radial-gradient(ellipse 65% 38% at 50% 0%, rgba(255, 99, 71, 0.18), transparent 72%); }
      `
    },
    {
      id: 'framer-bento-luxe',
      name: 'Framer Bento Luxe',
      badge: 'Agency · Bento',
      inspiration: 'Framer.com',
      summary: 'Pitch #050505 stage, sculptural 24px bento cards with subtle inner rim light, bold Syne display scale.',
      googleFonts: ['Syne', 'Plus Jakarta Sans'],
      swatches: ['#050505', '#121214', '#f97316', '#ffffff'],
      tokens: {
        '--bg': '#050505',
        '--surface': '#111113',
        '--surface-2': '#1a1a1e',
        '--border': 'rgba(255, 255, 255, 0.09)',
        '--text': '#ffffff',
        '--text-muted': '#8e8e98',
        '--primary': '#f97316',
        '--secondary': '#a1a1aa',
        '--radius': '20px',
        '--radius-lg': '28px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 54px -18px rgba(0,0,0,0.8)',
        '--font-display': "'Syne', 'Plus Jakarta Sans', sans-serif",
        '--font-sans': "'Plus Jakarta Sans', system-ui, sans-serif"
      },
      extraRules: `
        h1, h2 { font-family: 'Syne', 'Plus Jakarta Sans', sans-serif !important; letter-spacing: -0.03em; }
      `
    },
    {
      id: 'vectora-stone-orange',
      name: 'Vectora Stone + Orange',
      badge: 'Studio · Signature',
      inspiration: 'Vectora Canvas / Airship',
      summary: 'Warm tactile grey stone #161514–#242321 surfaces paired with crisp #f97316 safety-orange craft accents.',
      googleFonts: ['Plus Jakarta Sans', 'JetBrains Mono'],
      swatches: ['#161514', '#242321', '#f97316', '#ece9e5'],
      tokens: {
        '--bg': '#161514',
        '--surface': '#211f1d',
        '--surface-2': '#2b2926',
        '--border': '#383430',
        '--text': '#ece9e5',
        '--text-muted': '#a8a29e',
        '--primary': '#f97316',
        '--secondary': '#a8a29e',
        '--radius': '12px',
        '--radius-lg': '16px',
        '--shadow-card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 36px -12px rgba(0,0,0,0.62)',
        '--font-display': "'Plus Jakarta Sans', system-ui, sans-serif",
        '--font-sans': "'Plus Jakarta Sans', system-ui, sans-serif"
      },
      extraRules: ``
    }
  ];

  function getFamousStyleById(styleId) {
    return FAMOUS_STYLES.find((s) => s.id === styleId) || null;
  }

  /**
   * Generates a complete, clean CSS transformation stylesheet that restyles ANY existing agent-built UI
   * into the chosen Famous Style while preserving 3D canvases, images, SVGs, and Vectora gizmos.
   */
  function compileStyleCss(styleId, customOverrides = {}) {
    const style = getFamousStyleById(styleId);
    if (!style) return '';
    const t = { ...style.tokens, ...(customOverrides || {}) };
    const bw = style.borderWidth || '1px';
    const btnInk = t['--primary-ink'] || (style.isLight && t['--primary'] === '#ededed' ? '#111111' : '#ffffff');
    const glassRule = style.glassBackdrop
      ? `backdrop-filter: ${style.glassBackdrop}; -webkit-backdrop-filter: ${style.glassBackdrop};`
      : '';

    const tokenLines = Object.entries(t)
      .map(([k, v]) => `  ${k}: ${v} !important;`)
      .join('\n');

    return `/* === VECTORA FAMOUS STYLE: ${style.name} (${style.id}) === */
:root {
${tokenLines}
  --accent: ${t['--primary']} !important;
  --accent-color: ${t['--primary']} !important;
}

html, body {
  background-color: var(--bg) !important;
  color: var(--text) !important;
  font-family: var(--font-sans) !important;
}

header:not([data-vc-bridge]),
nav:not([data-vc-bridge]),
.site-header, .navbar, .topbar-nav, .vc-ui-navbar {
  background: var(--surface) !important;
  border-color: var(--border) !important;
  color: var(--text) !important;
  ${glassRule}
}

.card, .panel, .feature-card, .bento-card, .pricing-card, .stat-card, .vc-ui-card,
article:not([data-vc-bridge]),
section[class*="card"], div[class*="card"]:not([class*="cards"]):not([class*="grid"]) {
  background: var(--surface) !important;
  border: ${bw} solid var(--border) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-card) !important;
  color: var(--text) !important;
  ${glassRule}
}

h1, h2, h3, h4, .brand-title, .vc-ui-title {
  color: var(--text) !important;
  font-family: var(--font-display) !important;
}

p, .subtitle, .text-muted, .vc-ui-muted, small, label {
  color: var(--text-muted);
}

button.btn-primary, .btn-primary, a.btn-primary, .vc-btn-primary,
button[type="submit"], .cta-primary {
  background: var(--primary) !important;
  color: ${btnInk} !important;
  border: ${bw} solid var(--primary) !important;
  border-radius: var(--radius) !important;
}

button.btn-secondary, .btn-secondary, a.btn-secondary, .vc-btn-secondary, .btn-outline {
  background: var(--surface-2) !important;
  color: var(--text) !important;
  border: ${bw} solid var(--border) !important;
  border-radius: var(--radius) !important;
}

input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
select, textarea {
  background: var(--surface-2) !important;
  color: var(--text) !important;
  border: ${bw} solid var(--border) !important;
  border-radius: var(--radius) !important;
}

.badge, .pill, .eyebrow, .chip, .vc-ui-badge {
  border-radius: 999px !important;
  border: 1px solid var(--border) !important;
}
${style.extraRules || ''}`.trim();
  }

  function buildAgentStyleBrief(styleId) {
    const s = getFamousStyleById(styleId);
    if (!s) return null;
    return {
      styleId: s.id,
      styleName: s.name,
      inspiration: s.inspiration,
      googleFonts: s.googleFonts,
      tokens: s.tokens,
      directive: `User transformed the UI into the "${s.name}" (${s.inspiration}) design style in Vectora Canvas. Keep all CSS custom properties, surfaces, typography (${s.googleFonts.join(' + ')}), component borders, and secondary pages strictly aligned with these tokens.`
    };
  }

  // =========================================================================
  // SHARED BASE CSS FOR INSERTED FAMOUS ELEMENTS & PREMADE TEMPLATES
  // =========================================================================
  const SHARED_COMPONENT_CSS = `
/* === VECTORA LIBRARY BASE TOKENS & UTILITIES === */
:root {
  --bg: var(--bg, #121110);
  --surface: var(--surface, #1c1a18);
  --surface-2: var(--surface-2, #262320);
  --border: var(--border, rgba(255, 255, 255, 0.10));
  --text: var(--text, #f5f3f0);
  --text-muted: var(--text-muted, #a6a09b);
  --primary: var(--primary, #f97316);
  --secondary: var(--secondary, #a8a29e);
  --radius: var(--radius, 12px);
  --radius-lg: var(--radius-lg, 18px);
  --shadow-card: var(--shadow-card, 0 16px 38px -14px rgba(0,0,0,0.55));
  --font-display: var(--font-display, 'Plus Jakarta Sans', system-ui, sans-serif);
  --font-sans: var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif);
}
.vc-pt { width: fit-content; display: inline-block; }
.vc-area-txt { max-width: 64ch; height: auto; line-height: 1.6; margin: 0; }
.vc-ui-card {
  background: var(--surface, #1c1a18);
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: var(--radius-lg, 18px);
  box-shadow: var(--shadow-card, 0 16px 38px -14px rgba(0,0,0,0.55));
  color: var(--text, #f5f3f0);
  box-sizing: border-box;
}
.vc-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 18px; border-radius: var(--radius, 10px);
  background: var(--primary, #f97316); color: #ffffff;
  border: 1px solid var(--primary, #f97316); font-weight: 600; font-size: 14px;
  cursor: pointer; text-decoration: none; box-sizing: border-box;
}
.vc-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 18px; border-radius: var(--radius, 10px);
  background: var(--surface-2, #262320); color: var(--text, #f5f3f0);
  border: 1px solid var(--border, rgba(255,255,255,0.12)); font-weight: 600; font-size: 14px;
  cursor: pointer; text-decoration: none; box-sizing: border-box;
}
.vc-ui-badge {
  display: inline-flex; align-items: center; gap: 7px; width: fit-content;
  padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
  background: var(--surface-2, #262320); color: var(--text, #f5f3f0);
  border: 1px solid var(--border, rgba(255,255,255,0.12));
}
`.trim();

  // =========================================================================
  // 2. FAMOUS UI ELEMENTS (100% FIGMA FRAME + ILLUSTRATOR VECTOR READY)
  // =========================================================================
  const FAMOUS_ELEMENTS = [
    // --- NAVIGATION & COMMAND ---
    {
      id: 'el-floating-glass-nav',
      category: 'Navigation',
      name: 'Floating Glass Navbar',
      inspiration: 'Apple / Framer',
      summary: 'Floating pill header with vector mark, 4 Links-Tab ready nav items, and primary CTA.',
      build() {
        const u = uid('nav');
        return {
          html: `
<header id="${u}" class="vc-ui-navbar vc-ui-card" data-name="Floating Glass Navbar" data-vc-section="Floating Navbar" style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:12px 22px;border-radius:999px;width:100%;max-width:1080px;margin:16px auto;backdrop-filter:blur(20px);">
  <a id="${u}_brand" href="index.html" data-name="Brand Group" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:inherit;">
    <svg id="${u}_logo" data-name="Brand Vector Mark" viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" fill="var(--primary, #f97316)"/><path d="M7.5 8L12 16.5L16.5 8" stroke="#141312" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <strong id="${u}_title" class="vc-pt" data-name="Brand Title" style="font-size:15px;font-weight:700;width:fit-content;">Acme Studio</strong>
  </a>
  <nav id="${u}_links" data-name="Nav Links Group" data-vc-section="Nav Links" style="display:flex;align-items:center;gap:22px;">
    <a id="${u}_l1" href="#features" data-name="Features Link" style="text-decoration:none;color:var(--text, #f5f3f0);font-size:13.5px;font-weight:500;"><span class="vc-pt">Features</span></a>
    <a id="${u}_l2" href="#bento" data-name="Bento Link" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13.5px;font-weight:500;"><span class="vc-pt">Architecture</span></a>
    <a id="${u}_l3" href="#pricing" data-name="Pricing Link" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13.5px;font-weight:500;"><span class="vc-pt">Pricing</span></a>
    <a id="${u}_l4" href="about.html" data-name="Docs Link" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13.5px;font-weight:500;"><span class="vc-pt">Docs</span></a>
  </nav>
  <div id="${u}_actions" data-name="Navbar CTA Group" style="display:flex;align-items:center;gap:10px;">
    <button type="button" id="${u}_signin" class="vc-btn-secondary" data-vc-link="login.html" data-name="Sign In Button" style="padding:8px 15px;border-radius:999px;font-size:13px;"><span class="vc-pt">Sign in</span></button>
    <button type="button" id="${u}_cta" class="vc-btn-primary" data-vc-link="#start" data-name="Get Started CTA" style="padding:8px 16px;border-radius:999px;font-size:13px;"><span class="vc-pt">Get Started</span><svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </div>
</header>`.trim()
        };
      }
    },
    {
      id: 'el-command-palette',
      category: 'Navigation',
      name: 'Command Palette (⌘K)',
      inspiration: 'Raycast / Linear',
      summary: 'Spotlight search bar, KBD shortcut badges, and selectable quick-action rows.',
      build() {
        const u = uid('cmdk');
        return {
          html: `
<div id="${u}" class="vc-ui-card" data-name="Command Palette Card" data-vc-section="Command Palette" style="display:flex;flex-direction:column;gap:10px;padding:14px;width:100%;max-width:520px;margin:16px auto;">
  <div id="${u}_search" data-name="Command Search Bar" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--surface-2, #262320);border:1px solid var(--border, rgba(255,255,255,0.1));">
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <span id="${u}_ph" class="vc-pt" style="color:var(--text-muted, #a6a09b);font-size:13.5px;flex:1;">Type a command or search workspace…</span>
    <span id="${u}_esc" class="vc-pt" style="padding:2px 7px;border-radius:5px;border:1px solid var(--border, rgba(255,255,255,0.14));font-size:11px;font-family:monospace;">ESC</span>
  </div>
  <div id="${u}_list" data-name="Command Actions List" data-vc-section="Command Items" style="display:flex;flex-direction:column;gap:4px;">
    <button type="button" id="${u}_r1" data-name="Action Row 1" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:8px;background:rgba(249,115,22,0.14);border:1px solid rgba(249,115,22,0.35);color:var(--text, #f5f3f0);cursor:pointer;">
      <span style="display:inline-flex;align-items:center;gap:9px;"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 2.5v11M2.5 8h11" stroke="var(--primary, #f97316)" stroke-width="1.6" stroke-linecap="round"/></svg><span class="vc-pt" style="font-size:13px;font-weight:600;">Create New Design Frame</span></span>
      <span class="vc-pt" style="font-size:11px;opacity:0.75;font-family:monospace;">⌘N</span>
    </button>
    <button type="button" id="${u}_r2" data-name="Action Row 2" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:8px;background:transparent;border:1px solid transparent;color:var(--text, #f5f3f0);cursor:pointer;">
      <span style="display:inline-flex;align-items:center;gap:9px;"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 8h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span class="vc-pt" style="font-size:13px;">Switch Theme Preset</span></span>
      <span class="vc-pt" style="font-size:11px;opacity:0.65;font-family:monospace;">⌘T</span>
    </button>
    <button type="button" id="${u}_r3" data-name="Action Row 3" style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:8px;background:transparent;border:1px solid transparent;color:var(--text, #f5f3f0);cursor:pointer;">
      <span style="display:inline-flex;align-items:center;gap:9px;"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M9.5 2.5h4v4M13.2 2.8L7.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12.5 9.5v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span class="vc-pt" style="font-size:13px;">Open Live Verification Tab</span></span>
      <span class="vc-pt" style="font-size:11px;opacity:0.65;font-family:monospace;">⌘P</span>
    </button>
  </div>
</div>`.trim()
        };
      }
    },
    {
      id: 'el-macos-dock',
      category: 'Navigation',
      name: 'Floating Icon Dock',
      inspiration: 'macOS / Rauno',
      summary: 'Sculpted floating glass dock with crisp vector app buttons and active indicator dot.',
      build() {
        const u = uid('dock');
        return {
          html: `
<nav id="${u}" class="vc-ui-card" data-name="Floating App Dock" data-vc-section="Floating Dock" style="display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:22px;margin:16px auto;backdrop-filter:blur(22px);">
  <button type="button" id="${u}_d1" data-name="Dock Home" style="width:42px;height:42px;border-radius:12px;background:var(--primary, #f97316);border:none;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><svg viewBox="0 0 18 18" width="18" height="18" fill="none"><path d="M3 7.5L9 2.8l6 4.7V15H3V7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
  <button type="button" id="${u}_d2" data-name="Dock Layers" style="width:42px;height:42px;border-radius:12px;background:var(--surface-2, #262320);border:1px solid var(--border, rgba(255,255,255,0.1));color:var(--text, #f5f3f0);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><svg viewBox="0 0 18 18" width="18" height="18" fill="none"><path d="M9 2.5L15.5 6 9 9.5 2.5 6 9 2.5ZM2.5 9.5L9 13l6.5-3.5M2.5 12.8L9 16.2l6.5-3.4" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
  <button type="button" id="${u}_d3" data-name="Dock Canvas" style="width:42px;height:42px;border-radius:12px;background:var(--surface-2, #262320);border:1px solid var(--border, rgba(255,255,255,0.1));color:var(--text, #f5f3f0);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;"><svg viewBox="0 0 18 18" width="18" height="18" fill="none"><rect x="3" y="3" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="2.2" fill="currentColor"/></svg></button>
  <span id="${u}_sep" data-name="Dock Divider" style="width:1px;height:26px;background:var(--border, rgba(255,255,255,0.14));display:inline-block;"></span>
  <button type="button" id="${u}_d4" data-name="Dock Launch" style="height:42px;padding:0 16px;border-radius:12px;background:var(--surface-2, #262320);border:1px solid var(--border, rgba(255,255,255,0.1));color:var(--text, #f5f3f0);display:inline-flex;align-items:center;gap:7px;cursor:pointer;"><span class="vc-pt" style="font-size:13px;font-weight:600;">Deploy</span><svg viewBox="0 0 14 14" width="13" height="13" fill="none"><path d="M3 11L11 3M5.5 3H11v5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
</nav>`.trim()
        };
      }
    },

    // --- HERO & BENTO ---
    {
      id: 'el-linear-hero',
      category: 'Hero & Bento',
      name: 'Precision SaaS Hero Stack',
      inspiration: 'Linear / Vercel',
      summary: 'Announcement pill badge, bold display headline, readable lead copy, dual CTA row, and metric strip.',
      build() {
        const u = uid('hero');
        return {
          html: `
<section id="${u}" data-name="Precision Hero Section" data-vc-section="Hero Section" style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:22px;padding:64px 28px;max-width:980px;margin:0 auto;">
  <div id="${u}_pill" class="vc-ui-badge" data-name="Announcement Pill">
    <svg viewBox="0 0 12 12" width="10" height="10"><circle cx="6" cy="6" r="4.5" fill="var(--primary, #f97316)"/></svg>
    <span id="${u}_pill_txt" class="vc-pt">Release 3.0 · Live Visual-to-Code Engine</span>
  </div>
  <h1 id="${u}_h1" class="vc-ui-title" data-name="Hero Headline" style="font-size:52px;line-height:1.06;letter-spacing:-0.035em;margin:0;max-width:17ch;">Craft interfaces like Figma. Ship real production code.</h1>
  <p id="${u}_sub" class="vc-area-txt vc-ui-muted" data-name="Hero Subtitle" style="font-size:17px;max-width:58ch;">Every section, vector icon, card, and typography token stays 100% directly selectable, resizable, and synced with your coding agent in real time.</p>
  <div id="${u}_ctas" data-name="Hero CTA Group" data-vc-section="Hero CTAs" style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
    <button type="button" id="${u}_btn1" class="vc-btn-primary" data-vc-link="#pricing" data-name="Primary Hero CTA" style="padding:12px 24px;font-size:14.5px;"><span class="vc-pt">Start Designing Free</span><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" id="${u}_btn2" class="vc-btn-secondary" data-vc-link="about.html" data-name="Secondary Hero CTA" style="padding:12px 24px;font-size:14.5px;"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><polygon points="5,3.5 13,8 5,12.5" fill="currentColor"/></svg><span class="vc-pt">Watch 90s Demo</span></button>
  </div>
</section>`.trim()
        };
      }
    },
    {
      id: 'el-bento-grid-4',
      category: 'Hero & Bento',
      name: '4-Card Asymmetric Bento Grid',
      inspiration: 'Apple / Framer',
      summary: '2-row responsive bento feature showcase with vector charts, status pills, and independently editable cards.',
      build() {
        const u = uid('bento');
        return {
          html: `
<section id="${u}" data-name="Bento Feature Grid" data-vc-section="Bento Grid" style="display:grid;grid-template-columns:repeat(12, minmax(0, 1fr));gap:18px;padding:32px 24px;max-width:1120px;margin:0 auto;">
  <article id="${u}_c1" class="vc-ui-card" data-name="Bento Card — Real-Time Sync" data-vc-section="Bento Card 1" style="grid-column:span 7;display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:28px;">
    <div id="${u}_c1_top" data-name="Card 1 Copy" style="display:flex;flex-direction:column;gap:8px;">
      <span class="vc-ui-badge"><span class="vc-pt">Zero Latency AST Sync</span></span>
      <h3 class="vc-pt" style="font-size:22px;margin:4px 0 0;">Instant Two-Way Code Sync</h3>
      <p class="vc-area-txt vc-ui-muted" style="font-size:14px;">Move, resize, or restyle any frame on the canvas and watch HTML, CSS, and agent state update in under 150ms.</p>
    </div>
    <svg id="${u}_c1_chart" data-name="Card 1 Vector Graph" viewBox="0 0 420 96" width="100%" height="96" fill="none"><rect x="1" y="1" width="418" height="94" rx="12" fill="var(--surface-2, #262320)" stroke="var(--border, rgba(255,255,255,0.08))"/><path d="M22 72 C85 68, 118 28, 175 36 C232 44, 268 18, 330 24 C362 27, 384 14, 400 16" stroke="var(--primary, #f97316)" stroke-width="3" stroke-linecap="round"/><circle cx="175" cy="36" r="5" fill="var(--primary, #f97316)"/><circle cx="330" cy="24" r="5" fill="var(--primary, #f97316)"/></svg>
  </article>
  <article id="${u}_c2" class="vc-ui-card" data-name="Bento Card — Vector Engine" data-vc-section="Bento Card 2" style="grid-column:span 5;display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:28px;">
    <div id="${u}_c2_top" data-name="Card 2 Copy" style="display:flex;flex-direction:column;gap:8px;">
      <span class="vc-ui-badge"><span class="vc-pt">1600% Crisp Zoom</span></span>
      <h3 class="vc-pt" style="font-size:22px;margin:4px 0 0;">Pure Mathematical Vectors</h3>
      <p class="vc-area-txt vc-ui-muted" style="font-size:14px;">Illustrator isolation mode, live corner widgets, and magnetic Figma pixel rulers.</p>
    </div>
    <div id="${u}_c2_stat" data-name="Card 2 Metric Group" style="display:flex;align-items:baseline;gap:10px;">
      <strong class="vc-pt" style="font-size:40px;letter-spacing:-0.03em;color:var(--primary, #f97316);">60 FPS</strong>
      <span class="vc-pt vc-ui-muted" style="font-size:13px;">GPU Composited</span>
    </div>
  </article>
  <article id="${u}_c3" class="vc-ui-card" data-name="Bento Card — Famous Styles" data-vc-section="Bento Card 3" style="grid-column:span 5;display:flex;flex-direction:column;gap:12px;padding:26px;">
    <h3 class="vc-pt" style="font-size:19px;margin:0;">1-Click Famous Style Morphing</h3>
    <p class="vc-area-txt vc-ui-muted" style="font-size:13.5px;">Transform any rough prototype into Linear, Apple Liquid Glass, Stripe, or Anthropic editorial polish.</p>
  </article>
  <article id="${u}_c4" class="vc-ui-card" data-name="Bento Card — Agent Ready" data-vc-section="Bento Card 4" style="grid-column:span 7;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:26px;flex-wrap:wrap;">
    <div id="${u}_c4_copy" data-name="Card 4 Copy" style="display:flex;flex-direction:column;gap:6px;max-width:46ch;">
      <h3 class="vc-pt" style="font-size:19px;margin:0;">Built for Antigravity, Claude Code, Cursor &amp; Codex</h3>
      <p class="vc-area-txt vc-ui-muted" style="font-size:13.5px;">Visual PNG notes with reference-image arrows guide your coding agent with pixel accuracy.</p>
    </div>
    <button type="button" id="${u}_c4_btn" class="vc-btn-primary" data-vc-link="#explore" data-name="Explore Library Button"><span class="vc-pt">Explore Components</span></button>
  </article>
</section>`.trim()
        };
      }
    },
    {
      id: 'el-social-proof-strip',
      category: 'Hero & Bento',
      name: 'Avatar Stack & 5-Star Proof',
      inspiration: 'Stripe / Framer',
      summary: 'Overlapping pure-SVG user avatars, 5 crisp vector stars, and verified rating copy.',
      build() {
        const u = uid('proof');
        return {
          html: `
<div id="${u}" class="vc-ui-card" data-name="Social Proof Strip" data-vc-section="Social Proof" style="display:inline-flex;align-items:center;gap:16px;padding:12px 20px;border-radius:999px;margin:12px auto;">
  <div id="${u}_avatars" data-name="Avatar Vector Stack" style="display:flex;align-items:center;">
    <svg viewBox="0 0 32 32" width="30" height="30"><circle cx="16" cy="16" r="15" fill="#f97316" stroke="var(--surface, #1c1a18)" stroke-width="2"/><circle cx="16" cy="13" r="4.5" fill="#fff"/><path d="M8.5 25c1.8-4 13.2-4 15 0" fill="#fff"/></svg>
    <svg viewBox="0 0 32 32" width="30" height="30" style="margin-left:-8px;"><circle cx="16" cy="16" r="15" fill="#fb923c" stroke="var(--surface, #1c1a18)" stroke-width="2"/><circle cx="16" cy="13" r="4.5" fill="#18181b"/><path d="M8.5 25c1.8-4 13.2-4 15 0" fill="#18181b"/></svg>
    <svg viewBox="0 0 32 32" width="30" height="30" style="margin-left:-8px;"><circle cx="16" cy="16" r="15" fill="#ea580c" stroke="var(--surface, #1c1a18)" stroke-width="2"/><circle cx="16" cy="13" r="4.5" fill="#fff"/><path d="M8.5 25c1.8-4 13.2-4 15 0" fill="#fff"/></svg>
  </div>
  <div id="${u}_meta" data-name="Rating Meta Group" style="display:flex;flex-direction:column;gap:2px;">
    <div id="${u}_stars" data-name="Five Star Row" style="display:flex;align-items:center;gap:3px;color:#f59e0b;">
      <svg viewBox="0 0 14 14" width="13" height="13"><polygon points="7,1 8.8,4.8 13,5.3 9.9,8.2 10.7,12.4 7,10.3 3.3,12.4 4.1,8.2 1,5.3 5.2,4.8" fill="currentColor"/></svg>
      <svg viewBox="0 0 14 14" width="13" height="13"><polygon points="7,1 8.8,4.8 13,5.3 9.9,8.2 10.7,12.4 7,10.3 3.3,12.4 4.1,8.2 1,5.3 5.2,4.8" fill="currentColor"/></svg>
      <svg viewBox="0 0 14 14" width="13" height="13"><polygon points="7,1 8.8,4.8 13,5.3 9.9,8.2 10.7,12.4 7,10.3 3.3,12.4 4.1,8.2 1,5.3 5.2,4.8" fill="currentColor"/></svg>
      <svg viewBox="0 0 14 14" width="13" height="13"><polygon points="7,1 8.8,4.8 13,5.3 9.9,8.2 10.7,12.4 7,10.3 3.3,12.4 4.1,8.2 1,5.3 5.2,4.8" fill="currentColor"/></svg>
      <svg viewBox="0 0 14 14" width="13" height="13"><polygon points="7,1 8.8,4.8 13,5.3 9.9,8.2 10.7,12.4 7,10.3 3.3,12.4 4.1,8.2 1,5.3 5.2,4.8" fill="currentColor"/></svg>
      <strong class="vc-pt" style="font-size:12.5px;color:var(--text, #f5f3f0);margin-left:4px;">4.9/5</strong>
    </div>
    <span id="${u}_lbl" class="vc-pt vc-ui-muted" style="font-size:12px;">Trusted by 14,000+ designers &amp; engineers</span>
  </div>
</div>`.trim()
        };
      }
    },

    // --- PRICING & CARDS ---
    {
      id: 'el-pricing-3tier',
      category: 'Pricing & Cards',
      name: '3-Tier SaaS Pricing Grid',
      inspiration: 'Stripe / Shadcn',
      summary: 'Starter, highlighted Pro (Most Popular), and Team tiers with SVG checkmarks and CTA buttons.',
      build() {
        const u = uid('price');
        const chk = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(249,115,22,0.16)"/><path d="M5 8.2l2 2L11 6" stroke="var(--primary, #f97316)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        return {
          html: `
<section id="${u}" data-name="Pricing 3-Tier Section" data-vc-section="Pricing Section" style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:20px;padding:36px 24px;max-width:1100px;margin:0 auto;align-items:stretch;">
  <article id="${u}_t1" class="vc-ui-card" data-name="Starter Tier Card" data-vc-section="Starter Plan" style="display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:28px;">
    <div style="display:flex;flex-direction:column;gap:12px;">
      <span class="vc-pt" style="font-size:13px;font-weight:600;color:var(--text-muted, #a6a09b);">Starter</span>
      <div style="display:flex;align-items:baseline;gap:6px;"><strong class="vc-pt" style="font-size:38px;letter-spacing:-0.03em;">$0</strong><span class="vc-pt vc-ui-muted" style="font-size:13px;">/ forever</span></div>
      <p class="vc-area-txt vc-ui-muted" style="font-size:13.5px;">Everything needed for solo prototypes and local folder visual editing.</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:6px;">
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Unlimited local HTML/CSS projects</span></div>
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Figma rulers &amp; Illustrator isolation</span></div>
      </div>
    </div>
    <button type="button" id="${u}_b1" class="vc-btn-secondary" data-vc-link="#signup" data-name="Starter CTA" style="width:100%;"><span class="vc-pt">Get Started</span></button>
  </article>
  <article id="${u}_t2" class="vc-ui-card" data-name="Pro Popular Tier Card" data-vc-section="Pro Plan" style="display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:28px;outline:2px solid var(--primary, #f97316);">
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span class="vc-pt" style="font-size:13px;font-weight:700;color:var(--primary, #f97316);">Pro Studio</span>
        <span class="vc-ui-badge" style="padding:3px 10px;font-size:11px;"><span class="vc-pt">Most Popular</span></span>
      </div>
      <div style="display:flex;align-items:baseline;gap:6px;"><strong class="vc-pt" style="font-size:38px;letter-spacing:-0.03em;">$24</strong><span class="vc-pt vc-ui-muted" style="font-size:13px;">/ month</span></div>
      <p class="vc-area-txt vc-ui-muted" style="font-size:13.5px;">Full Famous Styles engine, real-time coding agent sync, and team templates.</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:6px;">
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">10 Famous Style 1-click transforms</span></div>
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Visual PNG arrow notes for AI agents</span></div>
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Instant Live Verification Preview</span></div>
      </div>
    </div>
    <button type="button" id="${u}_b2" class="vc-btn-primary" data-vc-link="#pro" data-name="Pro CTA" style="width:100%;"><span class="vc-pt">Upgrade to Pro</span></button>
  </article>
  <article id="${u}_t3" class="vc-ui-card" data-name="Scale Tier Card" data-vc-section="Scale Plan" style="display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:28px;">
    <div style="display:flex;flex-direction:column;gap:12px;">
      <span class="vc-pt" style="font-size:13px;font-weight:600;color:var(--text-muted, #a6a09b);">Enterprise</span>
      <div style="display:flex;align-items:baseline;gap:6px;"><strong class="vc-pt" style="font-size:38px;letter-spacing:-0.03em;">$79</strong><span class="vc-pt vc-ui-muted" style="font-size:13px;">/ seat</span></div>
      <p class="vc-area-txt vc-ui-muted" style="font-size:13.5px;">Shared design-token governance, custom MCP pipelines, and SSO security.</p>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:6px;">
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Custom org Design System tokens</span></div>
        <div style="display:flex;align-items:center;gap:8px;">${chk}<span class="vc-pt" style="font-size:13px;">Dedicated multi-agent swarm sync</span></div>
      </div>
    </div>
    <button type="button" id="${u}_b3" class="vc-btn-secondary" data-vc-link="#contact" data-name="Enterprise CTA" style="width:100%;"><span class="vc-pt">Contact Sales</span></button>
  </article>
</section>`.trim()
        };
      }
    },
    {
      id: 'el-kpi-sparkline-card',
      category: 'Pricing & Cards',
      name: 'KPI Stat + Vector Sparkline',
      inspiration: 'Linear / Stripe Dashboard',
      summary: 'Metric card with positive growth badge, large tabular figure, and editable SVG sparkline.',
      build() {
        const u = uid('kpi');
        return {
          html: `
<article id="${u}" class="vc-ui-card" data-name="KPI Sparkline Card" data-vc-section="KPI Metric Card" style="display:flex;flex-direction:column;gap:14px;padding:22px;width:100%;max-width:340px;">
  <div id="${u}_head" data-name="KPI Header" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
    <span class="vc-pt vc-ui-muted" style="font-size:13px;font-weight:500;">Monthly Recurring Revenue</span>
    <span class="vc-ui-badge" style="padding:3px 9px;font-size:11.5px;color:#22c55e;"><span class="vc-pt">+28.4%</span></span>
  </div>
  <strong id="${u}_val" class="vc-pt" data-name="KPI Value" style="font-size:34px;letter-spacing:-0.03em;">$148,920</strong>
  <svg id="${u}_spark" data-name="KPI Vector Sparkline" viewBox="0 0 280 56" width="100%" height="56" fill="none"><path d="M4 46 L48 39 L92 42 L136 25 L182 28 L228 13 L276 8" stroke="var(--primary, #f97316)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="276" cy="8" r="4" fill="var(--primary, #f97316)"/></svg>
</article>`.trim()
        };
      }
    },
    {
      id: 'el-testimonial-card',
      category: 'Pricing & Cards',
      name: 'Editorial Testimonial Card',
      inspiration: 'Vercel / Raycast',
      summary: 'Vector quote mark, crisp customer review, and author identity row.',
      build() {
        const u = uid('quote');
        return {
          html: `
<article id="${u}" class="vc-ui-card" data-name="Testimonial Quote Card" data-vc-section="Testimonial Card" style="display:flex;flex-direction:column;gap:16px;padding:26px;width:100%;max-width:420px;">
  <svg id="${u}_ico" data-name="Quote Vector Icon" viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M9.5 7C6.5 8.5 5 11 5 14.5c0 2 1.3 3.5 3.2 3.5 1.8 0 3-1.2 3-2.8 0-1.6-1.1-2.7-2.6-2.7-.4 0-.8.1-1 .2.4-1.8 1.6-3.3 3.4-4.2L9.5 7Zm9 0c-3 1.5-4.5 4-4.5 7.5 0 2 1.3 3.5 3.2 3.5 1.8 0 3-1.2 3-2.8 0-1.6-1.1-2.7-2.6-2.7-.4 0-.8.1-1 .2.4-1.8 1.6-3.3 3.4-4.2L18.5 7Z" fill="var(--primary, #f97316)"/></svg>
  <p id="${u}_body" class="vc-area-txt" data-name="Testimonial Text" style="font-size:15px;line-height:1.6;">“Vectora turned our AI-generated frontend into a tactile Figma-grade workspace. We restyled the entire product in ten seconds and shipped the same afternoon.”</p>
  <div id="${u}_author" data-name="Author Row" style="display:flex;align-items:center;gap:12px;">
    <svg viewBox="0 0 36 36" width="36" height="36"><circle cx="18" cy="18" r="18" fill="var(--primary, #f97316)"/><circle cx="18" cy="14" r="5.5" fill="#fff"/><path d="M9 30c2.4-5 15.6-5 18 0" fill="#fff"/></svg>
    <div style="display:flex;flex-direction:column;gap:2px;">
      <strong class="vc-pt" style="font-size:13.5px;">Elena Rostova</strong>
      <span class="vc-pt vc-ui-muted" style="font-size:12px;">Head of Product Design, Kinetix</span>
    </div>
  </div>
</article>`.trim()
        };
      }
    },

    // --- AI, FORMS & CONTROLS ---
    {
      id: 'el-ai-prompt-composer',
      category: 'AI & Controls',
      name: 'AI Prompt Composer Box',
      inspiration: 'Claude / Cursor',
      summary: 'Modern AI chat/prompt input card with model pill, attachment button, and orange Send button.',
      build() {
        const u = uid('prompt');
        return {
          html: `
<div id="${u}" class="vc-ui-card" data-name="AI Prompt Composer" data-vc-section="AI Prompt Box" style="display:flex;flex-direction:column;gap:14px;padding:16px 18px;width:100%;max-width:680px;margin:16px auto;">
  <textarea id="${u}_in" data-name="Prompt Input Area" rows="2" placeholder="Ask the agent to refine layout, add animations, or connect an API…" style="width:100%;background:transparent !important;border:none !important;outline:none;resize:none;font-size:14.5px;color:var(--text, #f5f3f0);font-family:inherit;"></textarea>
  <div id="${u}_bar" data-name="Prompt Toolbar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <button type="button" id="${u}_attach" class="vc-btn-secondary" data-name="Attach Reference Button" style="padding:6px 11px;font-size:12px;"><svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span class="vc-pt">Attach</span></button>
      <span id="${u}_model" class="vc-ui-badge" data-name="Model Selector Badge"><span class="vc-pt">Studio Pro 3.7</span></span>
    </div>
    <button type="button" id="${u}_send" class="vc-btn-primary" data-name="Send Prompt Button" style="padding:7px 16px;border-radius:999px;font-size:13px;"><span class="vc-pt">Generate</span><svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M8 12.5V3.5M4 7.5l4-4 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </div>
</div>`.trim()
        };
      }
    },
    {
      id: 'el-auth-signin-card',
      category: 'AI & Controls',
      name: 'Clean Auth / Sign-In Card',
      inspiration: 'Shadcn / Clerk',
      summary: 'SSO vector buttons, labeled email/password inputs, and full-width submit button.',
      build() {
        const u = uid('auth');
        return {
          html: `
<form id="${u}" class="vc-ui-card" data-name="Auth Sign-In Card" data-vc-section="Sign-In Card" onsubmit="return false;" style="display:flex;flex-direction:column;gap:16px;padding:28px;width:100%;max-width:400px;margin:20px auto;">
  <div id="${u}_head" data-name="Auth Header" style="display:flex;flex-direction:column;gap:5px;">
    <h3 class="vc-pt" style="font-size:21px;margin:0;">Welcome back</h3>
    <span class="vc-pt vc-ui-muted" style="font-size:13px;">Sign in to continue to your workspace</span>
  </div>
  <div id="${u}_sso" data-name="SSO Buttons Row" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <button type="button" class="vc-btn-secondary" data-name="GitHub SSO"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 1.2a6.8 6.8 0 0 0-2.15 13.25c.34.06.46-.15.46-.33v-1.2c-1.9.41-2.3-.9-2.3-.9-.3-.78-.76-.99-.76-.99-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.6.74 1.99.57.06-.44.24-.74.43-.91-1.51-.17-3.1-.76-3.1-3.37 0-.75.27-1.36.7-1.84-.07-.17-.3-.86.07-1.8 0 0 .57-.18 1.88.7a6.5 6.5 0 0 1 3.42 0c1.3-.88 1.88-.7 1.88-.7.37.94.14 1.63.07 1.8.44.48.7 1.09.7 1.84 0 2.62-1.59 3.2-3.11 3.37.25.21.46.63.46 1.27v1.88c0 .18.12.4.47.33A6.8 6.8 0 0 0 8 1.2Z"/></svg><span class="vc-pt">GitHub</span></button>
    <button type="button" class="vc-btn-secondary" data-name="Google SSO"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 8h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="vc-pt">Google</span></button>
  </div>
  <div id="${u}_f1" data-name="Email Field" style="display:flex;flex-direction:column;gap:6px;">
    <label class="vc-pt" style="font-size:12.5px;font-weight:600;">Email address</label>
    <input type="email" placeholder="name@company.com" style="padding:10px 12px;font-size:13.5px;width:100%;box-sizing:border-box;">
  </div>
  <div id="${u}_f2" data-name="Password Field" style="display:flex;flex-direction:column;gap:6px;">
    <label class="vc-pt" style="font-size:12.5px;font-weight:600;">Password</label>
    <input type="password" placeholder="••••••••" style="padding:10px 12px;font-size:13.5px;width:100%;box-sizing:border-box;">
  </div>
  <button type="submit" id="${u}_sub" class="vc-btn-primary" data-name="Continue Sign-In CTA" style="width:100%;padding:11px;"><span class="vc-pt">Continue</span></button>
</form>`.trim()
        };
      }
    },
    {
      id: 'el-saas-footer',
      category: 'AI & Controls',
      name: 'Multi-Column SaaS Footer',
      inspiration: 'Linear / Stripe',
      summary: 'Clean 4-column footer with brand bio, product/company/legal link lists, and status pill.',
      build() {
        const u = uid('foot');
        return {
          html: `
<footer id="${u}" class="vc-ui-card" data-name="SaaS Multi-Column Footer" data-vc-section="Site Footer" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:28px;padding:40px 32px;max-width:1120px;margin:28px auto;border-radius:var(--radius-lg, 18px);">
  <div id="${u}_col0" data-name="Footer Brand Column" style="display:flex;flex-direction:column;gap:12px;">
    <div style="display:inline-flex;align-items:center;gap:9px;">
      <svg viewBox="0 0 20 20" width="18" height="18"><rect x="2" y="2" width="16" height="16" rx="4" fill="var(--primary, #f97316)"/><path d="M6 6.5L10 14L14 6.5" fill="none" stroke="#141312" stroke-width="2.1" stroke-linecap="round"/></svg>
      <strong class="vc-pt" style="font-size:15px;">Acme Studio</strong>
    </div>
    <p class="vc-area-txt vc-ui-muted" style="font-size:13px;max-width:32ch;">Precision visual HTML, CSS, and vector tooling synced natively with modern coding agents.</p>
    <span class="vc-ui-badge" style="font-size:11.5px;"><svg viewBox="0 0 8 8" width="7" height="7"><circle cx="4" cy="4" r="3.5" fill="#22c55e"/></svg><span class="vc-pt">All systems operational</span></span>
  </div>
  <div id="${u}_col1" data-name="Footer Product Links" style="display:flex;flex-direction:column;gap:9px;">
    <strong class="vc-pt" style="font-size:12.5px;">Product</strong>
    <a href="#features" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Features</span></a>
    <a href="#pricing" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Pricing</span></a>
    <a href="about.html" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Changelog</span></a>
  </div>
  <div id="${u}_col2" data-name="Footer Resources Links" style="display:flex;flex-direction:column;gap:9px;">
    <strong class="vc-pt" style="font-size:12.5px;">Developers</strong>
    <a href="about.html" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Documentation</span></a>
    <a href="#mcp" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">MCP SDK</span></a>
    <a href="#templates" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Templates</span></a>
  </div>
  <div id="${u}_col3" data-name="Footer Legal Links" style="display:flex;flex-direction:column;gap:9px;">
    <strong class="vc-pt" style="font-size:12.5px;">Company</strong>
    <a href="about.html" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">About</span></a>
    <a href="#privacy" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Privacy</span></a>
    <a href="#terms" style="text-decoration:none;color:var(--text-muted, #a6a09b);font-size:13px;"><span class="vc-pt">Terms</span></a>
  </div>
</footer>`.trim()
        };
      }
    }
  ];

  function getFamousElementById(elId) {
    return FAMOUS_ELEMENTS.find((e) => e.id === elId) || null;
  }

  // =========================================================================
  // 3. PREMADE FULL-PAGE UI TEMPLATES (100% EDITABLE & STYLE-COMPATIBLE)
  // =========================================================================
  const PREMADE_TEMPLATES = [
    {
      id: 'tpl-modern-saas-landing',
      name: 'Modern SaaS Landing Page',
      badge: 'Full Page · SaaS',
      defaultStyle: 'linear-dark',
      summary: 'Complete SaaS marketing page: Floating Glass Navbar + Hero + Social Proof + 4-Card Bento + 3-Tier Pricing + Footer.',
      buildBodyHtml() {
        const nav = getFamousElementById('el-floating-glass-nav').build().html;
        const hero = getFamousElementById('el-linear-hero').build().html;
        const proof = getFamousElementById('el-social-proof-strip').build().html;
        const bento = getFamousElementById('el-bento-grid-4').build().html;
        const pricing = getFamousElementById('el-pricing-3tier').build().html;
        const footer = getFamousElementById('el-saas-footer').build().html;
        return `
<div id="saasPageShell" data-name="SaaS Page Wrapper" data-vc-section="Page Shell" style="min-height:100vh;padding:12px 20px 48px;box-sizing:border-box;">
  ${nav}
  <div id="heroProofWrap" data-name="Hero & Proof Stack" style="display:flex;flex-direction:column;align-items:center;">
    ${hero}
    ${proof}
  </div>
  ${bento}
  ${pricing}
  ${footer}
</div>`.trim();
      }
    },
    {
      id: 'tpl-ai-creative-workspace',
      name: 'AI Creative Studio Workspace',
      badge: 'App UI · AI',
      defaultStyle: 'vectora-stone-orange',
      summary: 'App shell with top bar, left prompt & tool sidebar, central preview canvas card, and KPI telemetry dock.',
      buildBodyHtml() {
        const composer = getFamousElementById('el-ai-prompt-composer').build().html;
        const kpi = getFamousElementById('el-kpi-sparkline-card').build().html;
        return `
<div id="aiStudioShell" data-name="AI Studio Shell" data-vc-section="AI Studio Shell" style="display:flex;flex-direction:column;gap:18px;min-height:100vh;padding:20px 24px;box-sizing:border-box;max-width:1440px;margin:0 auto;">
  <header id="aiStudioHeader" class="vc-ui-card" data-name="Studio Topbar" data-vc-section="Studio Topbar" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;">
    <div style="display:inline-flex;align-items:center;gap:10px;">
      <svg viewBox="0 0 22 22" width="20" height="20"><rect x="2" y="2" width="18" height="18" rx="5" fill="var(--primary, #f97316)"/><circle cx="11" cy="11" r="4" fill="#141312"/></svg>
      <strong class="vc-pt" style="font-size:15px;">Vision Studio AI</strong>
      <span class="vc-ui-badge"><span class="vc-pt">v3.2 Live</span></span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <button type="button" class="vc-btn-secondary" data-vc-link="about.html" data-name="History Button"><span class="vc-pt">History</span></button>
      <button type="button" class="vc-btn-primary" data-vc-link="#export" data-name="Export Render Button"><span class="vc-pt">Export Render</span></button>
    </div>
  </header>
  <div id="aiStudioGrid" data-name="Studio Main 3-Column Grid" data-vc-section="Main Studio Grid" style="display:grid;grid-template-columns:300px 1fr 320px;gap:18px;flex:1;align-items:stretch;">
    <aside id="aiLeftControls" class="vc-ui-card" data-name="Scene Parameters Panel" data-vc-section="Parameters Panel" style="display:flex;flex-direction:column;gap:16px;padding:20px;">
      <strong class="vc-pt" style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;">Scene Controls</strong>
      <div id="aspectGroup" data-name="Aspect Ratio Group" data-vc-section="Aspect Ratio" style="display:flex;flex-direction:column;gap:8px;">
        <label class="vc-pt" style="font-size:12px;">Aspect Ratio</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          <button type="button" class="vc-btn-primary" style="padding:8px;"><span class="vc-pt">16:9</span></button>
          <button type="button" class="vc-btn-secondary" style="padding:8px;"><span class="vc-pt">1:1</span></button>
          <button type="button" class="vc-btn-secondary" style="padding:8px;"><span class="vc-pt">9:16</span></button>
        </div>
      </div>
      <div id="styleChipsGroup" data-name="Key Style Chips" data-vc-section="Style Chips" style="display:flex;flex-direction:column;gap:8px;">
        <label class="vc-pt" style="font-size:12px;">Style Modifiers</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <span class="vc-ui-badge"><span class="vc-pt">Photoreal 8K</span></span>
          <span class="vc-ui-badge"><span class="vc-pt">Volumetric Rim</span></span>
          <span class="vc-ui-badge"><span class="vc-pt">35mm Anamorphic</span></span>
        </div>
      </div>
    </aside>
    <main id="aiCenterStage" class="vc-ui-card" data-name="Central Render Viewport" data-vc-section="Render Viewport" style="display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:24px;">
      <div id="renderFrameBox" data-name="Viewport Artwork Stage" style="flex:1;min-height:360px;border-radius:14px;background:var(--surface-2, #262320);border:1px solid var(--border, rgba(255,255,255,0.08));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;">
        <svg viewBox="0 0 120 80" width="110" height="74" fill="none"><rect x="6" y="6" width="108" height="68" rx="10" stroke="var(--primary, #f97316)" stroke-width="2"/><circle cx="38" cy="30" r="9" fill="var(--primary, #f97316)"/><path d="M14 66L46 38l24 20 18-14 18 22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="vc-pt vc-ui-muted" style="font-size:13.5px;">Interactive Render Stage · Drop reference or prompt below</span>
      </div>
      ${composer}
    </main>
    <aside id="aiRightTelemetry" data-name="Output & Telemetry Column" data-vc-section="Output Column" style="display:flex;flex-direction:column;gap:18px;">
      ${kpi}
      <div id="renderQueueCard" class="vc-ui-card" data-name="Render Queue Card" data-vc-section="Render Queue" style="display:flex;flex-direction:column;gap:10px;padding:20px;flex:1;">
        <strong class="vc-pt" style="font-size:14px;">Recent Variations</strong>
        <p class="vc-area-txt vc-ui-muted" style="font-size:13px;">Select any frame on the artboard to tweak corner radius, glass blur, or layout spacing.</p>
      </div>
    </aside>
  </div>
</div>`.trim();
      }
    },
    {
      id: 'tpl-analytics-bento-dashboard',
      name: 'Executive Analytics Dashboard',
      badge: 'Dashboard · Data',
      defaultStyle: 'shadcn-zinc',
      summary: 'Clean executive KPI grid, revenue sparklines, command search, and live customer activity cards.',
      buildBodyHtml() {
        const nav = getFamousElementById('el-floating-glass-nav').build().html;
        const kpi1 = getFamousElementById('el-kpi-sparkline-card').build().html;
        const kpi2 = getFamousElementById('el-kpi-sparkline-card').build().html.replace('Monthly Recurring Revenue', 'Active Pro Workspaces').replace('$148,920', '18,492').replace('+28.4%', '+19.1%');
        const cmdk = getFamousElementById('el-command-palette').build().html;
        const bento = getFamousElementById('el-bento-grid-4').build().html;
        return `
<div id="dashPageShell" data-name="Analytics Dashboard Shell" data-vc-section="Dashboard Shell" style="min-height:100vh;padding:12px 24px 48px;box-sizing:border-box;">
  ${nav}
  <section id="dashTopRow" data-name="KPI & Command Row" data-vc-section="KPI Overview" style="display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:18px;max-width:1120px;margin:20px auto;align-items:stretch;">
    ${kpi1}
    ${kpi2}
    ${cmdk}
  </section>
  ${bento}
</div>`.trim();
      }
    },
    {
      id: 'tpl-editorial-portfolio',
      name: 'Editorial Designer Portfolio',
      badge: 'Portfolio · Luxe',
      defaultStyle: 'anthropic-warm-paper',
      summary: 'Warm literary serif showcase with selected case-study bento cards, testimonial quote, and contact CTA.',
      buildBodyHtml() {
        const nav = getFamousElementById('el-floating-glass-nav').build().html.replace('Acme Studio', 'Studio Aria');
        const hero = getFamousElementById('el-linear-hero').build().html
          .replace('Craft interfaces like Figma. Ship real production code.', 'Digital products shaped with quiet precision & craft.')
          .replace('Start Designing Free', 'View Selected Work');
        const bento = getFamousElementById('el-bento-grid-4').build().html;
        const quote = getFamousElementById('el-testimonial-card').build().html;
        const footer = getFamousElementById('el-saas-footer').build().html;
        return `
<div id="portfolioShell" data-name="Editorial Portfolio Shell" data-vc-section="Portfolio Shell" style="min-height:100vh;padding:12px 24px 48px;box-sizing:border-box;">
  ${nav}
  ${hero}
  ${bento}
  <section id="portfolioTestimonialWrap" data-name="Client Endorsement Section" data-vc-section="Client Endorsement" style="display:flex;justify-content:center;padding:24px;">
    ${quote}
  </section>
  ${footer}
</div>`.trim();
      }
    },
    {
      id: 'tpl-split-auth-onboarding',
      name: 'Split-Screen Auth & Onboarding',
      badge: 'Auth · Onboarding',
      defaultStyle: 'apple-liquid-glass',
      summary: '2-column onboarding experience: left brand story + social proof + testimonial, right interactive Sign-In card.',
      buildBodyHtml() {
        const proof = getFamousElementById('el-social-proof-strip').build().html;
        const quote = getFamousElementById('el-testimonial-card').build().html;
        const auth = getFamousElementById('el-auth-signin-card').build().html;
        return `
<div id="splitAuthShell" data-name="Split Auth Page" data-vc-section="Split Auth Layout" style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:32px;min-height:100vh;padding:40px 48px;max-width:1280px;margin:0 auto;align-items:center;box-sizing:border-box;">
  <section id="splitAuthBrandCol" data-name="Brand Story Pane" data-vc-section="Brand Story" style="display:flex;flex-direction:column;align-items:flex-start;gap:22px;">
    ${proof}
    <h1 class="vc-ui-title" style="font-size:44px;line-height:1.1;letter-spacing:-0.03em;margin:0;max-width:16ch;">Design &amp; ship at the speed of thought.</h1>
    <p class="vc-area-txt vc-ui-muted" style="font-size:16px;">Every frame, typography scale, and interactive button stays directly editable right inside your coding agent.</p>
    ${quote}
  </section>
  <section id="splitAuthFormCol" data-name="Sign-In Form Pane" data-vc-section="Sign-In Form" style="display:flex;justify-content:center;">
    ${auth}
  </section>
</div>`.trim();
      }
    }
  ];

  function getPremadeTemplateById(tplId) {
    return PREMADE_TEMPLATES.find((t) => t.id === tplId) || null;
  }

  return {
    FAMOUS_STYLES,
    FAMOUS_ELEMENTS,
    PREMADE_TEMPLATES,
    SHARED_COMPONENT_CSS,
    getFamousStyleById,
    compileStyleCss,
    buildAgentStyleBrief,
    getFamousElementById,
    getPremadeTemplateById
  };
});
