/**
 * Vectora Canvas — Outer Studio Shell Controller (studio.js)
 * Coordinates Topbar, Custom Dark Dropdowns, Vertical Illustrator Toolbar,
 * Pasteboard Viewport Zoom/Pan/Minimap, Photoshop Scrubby Number Fields,
 * Illustrator Align, Fill/Stroke/Gradient, Google Fonts Search, Airship CSS/DOM Tabs,
 * Right-Click Context Menu, Agent Notes, and Direct-HTML Save / Original / Undo-Redo.
 */
(function () {
  const GOOGLE_FONTS = [
    'Inherit',
    'Inter', 'Plus Jakarta Sans', 'DM Sans', 'Space Grotesk', 'Outfit', 'Manrope',
    'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato', 'Nunito', 'Work Sans',
    'Rubik', 'Raleway', 'Ubuntu', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo',
    'Sora', 'Urbanist', 'Figtree', 'Lexend', 'Instrument Sans', 'Bricolage Grotesque',
    'Syne', 'Cabinet Grotesk', 'Barlow', 'Mulish', 'Quicksand', 'Karla', 'Josefin Sans',
    'Titillium Web', 'Exo 2', 'Chakra Petch', 'Orbitron', 'Rajdhani', 'Teko',
    'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Libre Baskerville',
    'Cormorant Garamond', 'Fraunces', 'Instrument Serif', 'Crimson Pro', 'EB Garamond',
    'Bitter', 'Zilla Slab', 'DM Serif Display', 'Cinzel', 'Bodoni Moda', 'Spectral',
    'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Space Mono',
    'Inconsolata', 'Roboto Mono', 'Ubuntu Mono', 'DM Mono', 'Red Hat Mono',
    'IBM Plex Sans', 'Red Hat Display', 'Public Sans', 'Schibsted Grotesk', 'Onest',
    'Hanken Grotesk', 'Albert Sans', 'Epilogue', 'Commissioner', 'Jost', 'Kanit',
    'Hind', 'Mukta', 'Asap', 'Maven Pro', 'Signika', 'Catamaran', 'Varela Round',
    'Comfortaa', 'Righteous', 'Abril Fatface', 'Pacifico', 'Caveat', 'Dancing Script',
    'Permanent Marker', 'Satisfy', 'Noto Sans', 'Noto Serif', 'Noto Sans Bengali', 'Hind Siliguri'
  ];

  const UI_PRESETS = [
    { id: 'original', label: 'Theme: Default', reset: true, primary: '', secondary: '', extraCss: '' },
    {
      id: 'stone-orange',
      label: 'Stone & Orange',
      primary: '#f97316',
      secondary: '#44403c',
      extraCss: ''
    },
    {
      id: 'warm-amber',
      label: 'Warm Amber',
      primary: '#f59e0b',
      secondary: '#57534e',
      extraCss: ''
    },
    {
      id: 'ember-dark',
      label: 'Ember Studio',
      primary: '#ea580c',
      secondary: '#292524',
      extraCss: ''
    },
    {
      id: 'warm-paper',
      label: 'Editorial Stone',
      primary: '#c2410c',
      secondary: '#78716c',
      extraCss: ''
    }
  ];

  const ARTBOARD_SIZES = [
    { w: 1920, h: 1080, label: '1920×1080 (16:9)' },
    { w: 1440, h: 810, label: '1440×810 (16:9)' },
    { w: 1280, h: 720, label: '1280×720 (16:9)' },
    { w: 1024, h: 768, label: '1024×768 Tablet' },
    { w: 768, h: 1024, label: '768×1024 Portrait' },
    { w: 390, h: 844, label: '390×844 Mobile' }
  ];

  const DISPLAY_OPTIONS = ['block', 'flex', 'inline-flex', 'grid', 'inline-block', 'none'];
  const STROKE_STYLES = ['solid', 'dashed', 'dotted', 'double', 'none'];
  const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800'];

  const TOOL_NAMES = {
    select: 'Selection (V)',
    direct: 'Direct Selection (A)',
    transform: 'Free Transform (E)',
    section: 'Session Tool (S)',
    shape: 'Shape Tool (R)',
    div: 'Flow Div Spacer (D)',
    text: 'Type Tool (T)',
    eyedropper: 'Eyedropper (I)',
    marquee: 'Marquee Select (M)',
    note: 'Agent Note (N)',
    hand: 'Hand Pan (H)',
    zoom: 'Zoom (Z)'
  };

  // Crisp inline SVG helper icons for dynamic lists (zero emojis!)
  const SVG_ICONS = {
    lockClosed: '<svg viewBox="0 0 14 14" width="12" height="12"><rect x="2.5" y="6.2" width="9" height="5.8" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 6.2V4.3a2.5 2.5 0 0 1 5 0v1.9" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    lockOpen: '<svg viewBox="0 0 14 14" width="12" height="12"><rect x="2.5" y="6.2" width="9" height="5.8" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.55"/><path d="M4.5 6.2V4.3a2.5 2.5 0 0 1 4.5-1.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/></svg>',
    session: '<svg viewBox="0 0 14 14" width="12" height="12"><rect x="1.8" y="2.2" width="10.4" height="3" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="1.8" y="7" width="4.8" height="4.8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="7" width="4.2" height="4.8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    group: '<svg viewBox="0 0 14 14" width="12" height="12"><path d="M1.8 4a1 1 0 0 1 1-1h2.6l1.2 1.4h4.6a1 1 0 0 1 1 1v5.4a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1V4Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    layer: '<svg viewBox="0 0 14 14" width="12" height="12"><rect x="2.2" y="2.8" width="9.6" height="8.4" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    file: '<svg viewBox="0 0 14 14" width="12" height="12"><path d="M3.5 1.8h4.8l2.5 2.5v7.9H3.5V1.8Z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    view: '<svg viewBox="0 0 14 14" width="12" height="12"><rect x="1.8" y="2.4" width="10.4" height="9.2" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M1.8 5.2h10.4" stroke="currentColor" stroke-width="1.2"/></svg>'
  };

  // Studio State
  const state = {
    hasServerBackend: false,
    vfsMode: false, // true when running standalone OR when user opened a browser folder via Open Project
    targetPath: '',
    entry: 'index.html',
    projectName: 'Workspace',
    htmlFiles: ['index.html'],
    cssFiles: [],
    jsFiles: [],
    allFiles: ['index.html'],
    projectFiles: {}, // { 'index.html': '...', 'styles.css': '...', 'script.js': '...' }
    originFiles: {},  // baseline files before runtime canvas edits
    codeEditedFiles: {},
    binaryAssets: {}, // { 'img/logo.png': Uint8Array }
    assetBlobUrls: {}, // { 'img/logo.png': 'blob:...' }
    dirHandle: null,
    activeCodeFile: 'index.html',
    recentSessions: [],
    recentWorkspaces: [],
    everEditedInSession: false,
    discoveredViews: [],
    mode: 'edit', // 'edit' | 'live'
    tool: 'select',
    shapeKind: 'rect',
    shapeRadius: 16,
    bypassGates: true,
    artboardWidth: 1920,
    artboardHeight: 1080,
    artboardMetrics: { pasteboardW: 1920, pasteboardH: 1080, artboardW: 1920, artboardH: 1080, offsetX: 0, offsetY: 0 },
    zoom: 0.55,
    panX: 0,
    panY: 0,
    hasManualViewport: false,
    spaceHeld: false,
    smartGuides: true,
    showNotes: true,
    autoGroupButtons: true,
    alignTo: '__bounds__',
    refPoint: 'c',
    lockAspect: false,
    aspectRatio: 1,
    activePreset: 'original',
    effectiveAccel: 'gpu',
    gpuInfo: { webglAvailable: true, hasHardwareGpu: true, renderer: 'GPU Compositor', api: 'WebGL2' },
    preferences: {
      autoSave: false, // Manual Save ONLY when clicked by default!
      scaleStrokesAndEffects: true,
      scaleCorners: true,
      multiScaleMode: 'in-place', // 'in-place' | 'normal'
      keyboardIncrement: 1,
      accelPreference: 'auto' // 'auto' (GPU -> CPU fallback) | 'gpu' | 'cpu'
    },
    ignoredWords: [],
    notes: [],
    editingNote: null,
    noteTaskType: 'fix',
    sessions: [],
    layers: [],
    domTree: [],
    links: [],
    isolation: { active: false, stack: [] },
    pendingHashTarget: '',
    selection: { count: 0, selectedIds: [], props: null },
    grammarIssues: [],

    // Illustrator Fill / Stroke / Gradient Proxy State
    activeProxy: 'fill', // 'fill' | 'stroke'
    paint: {
      fillMode: 'solid', // 'solid' | 'linear' | 'radial' | 'none'
      fillColor: '#f97316',
      strokeMode: 'solid',
      strokeColor: '#78716c',
      strokeWidth: 1,
      strokeStyle: 'solid',
      gradAngle: 135,
      gradStops: [
        { pos: 0, color: '#f97316' },
        { pos: 100, color: '#ea580c' }
      ],
      selectedStopIdx: 0
    }
  };

  const $ = (id) => document.getElementById(id);
  const previewFrame = $('previewFrame');
  const canvasScroll = $('canvasScroll');
  const frameSizer = $('frameSizer');
  const frameStage = $('frameStage');

  let pendingSaveResolvers = new Map();
  let autoSaveTimer = null;
  let autoCodeSyncTimer = null;
  let activePreviewBlobUrl = null;
  let toastTimer = null;

  const STUDIO_BASE_URL = new URL('.', window.location.href).href.replace(/\/+$/, '');
  const LS_STANDALONE_PROJ = 'vc_standalone_project_v1';
  const LS_RECENT_SESSIONS = 'vc_recent_sessions_v1';
  const LS_STANDALONE_NOTES = 'vc_standalone_notes_v1';
  const LS_STANDALONE_PREFS = 'vc_standalone_prefs_v1';

  function showToast(msgText, durationMs = 2000) {
    const t = $('vcToast');
    if (!t) return;
    t.textContent = msgText;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, durationMs);
  }

  function loadLocalRecentSessions() {
    try {
      const raw = localStorage.getItem(LS_RECENT_SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function getProjectFolderKey(itemOrTarget, projName) {
    const rawTarget = typeof itemOrTarget === 'object'
      ? (itemOrTarget?.originalSourceDir || itemOrTarget?.target || '')
      : (itemOrTarget || '');
    const normTarget = String(rawTarget).replace(/\\/g, '/').replace(/\/+$/, '').trim().toLowerCase();
    if (normTarget) return `dir::${normTarget}`;
    const rawName = typeof itemOrTarget === 'object'
      ? (itemOrTarget?.projectName || projName || '')
      : (projName || '');
    return `vfs::${String(rawName || 'project').trim().toLowerCase()}`;
  }

  function recordLocalRecentSession(entryRel, projName, extra = {}) {
    const resolvedProj = projName || state.projectName || 'Project';
    const resolvedTarget = extra.target !== undefined ? extra.target : (state.targetPath || '');
    const folderKey = getProjectFolderKey(resolvedTarget, resolvedProj);
    const prevAll = loadLocalRecentSessions();
    const prevSame = prevAll.find((x) => getProjectFolderKey(x) === folderKey);
    const item = {
      id: folderKey,
      projectName: resolvedProj,
      entry: entryRel || state.entry || 'index.html',
      target: resolvedTarget,
      vfsSnapshot: extra.saveSnapshot ? { ...state.projectFiles } : (prevSame?.vfsSnapshot || null),
      openedAt: new Date().toISOString()
    };
    const prev = prevAll.filter((x) => getProjectFolderKey(x) !== folderKey);
    const next = [item, ...prev].slice(0, 15);
    state.recentSessions = next;
    try {
      localStorage.setItem(LS_RECENT_SESSIONS, JSON.stringify(next));
    } catch (_) {}
  }

  function rebuildFileListsFromMap(filesMap) {
    const keys = Object.keys(filesMap || {});
    const html = keys.filter((k) => /\.html?$/i.test(k)).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
    const css = keys.filter((k) => /\.css$/i.test(k)).sort();
    const js = keys.filter((k) => /\.m?js$/i.test(k)).sort();
    state.htmlFiles = html.length ? html : [state.entry || 'index.html'];
    state.cssFiles = css;
    state.jsFiles = js;
    state.allFiles = [...state.htmlFiles, ...css, ...js];
    if (!state.allFiles.includes(state.activeCodeFile)) {
      state.activeCodeFile = state.entry && state.allFiles.includes(state.entry) ? state.entry : (state.allFiles[0] || 'index.html');
    }
  }

  function persistStandaloneVfsToStorage() {
    try {
      localStorage.setItem(
        LS_STANDALONE_PROJ,
        JSON.stringify({
          projectName: state.projectName,
          entry: state.entry,
          projectFiles: state.projectFiles,
          originFiles: state.originFiles,
          updatedAt: Date.now()
        })
      );
    } catch (_) {}
  }

  async function writeFilesToDirHandle(filesToWrite = []) {
    if (!state.dirHandle) return;
    for (const rel of filesToWrite) {
      const content = state.projectFiles[rel];
      if (content === undefined) continue;
      try {
        const parts = rel.split('/').filter(Boolean);
        let dir = state.dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          dir = await dir.getDirectoryHandle(parts[i], { create: true });
        }
        const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await fh.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (_) {}
    }
  }

  function postToBridge(cmd, extra = {}) {
    try {
      if (previewFrame && previewFrame.contentWindow) {
        previewFrame.contentWindow.postMessage({ __vc_cmd: true, cmd, ...extra }, '*');
      }
    } catch (_) {}
  }

  // =========================================================================
  // 1. CUSTOM DARK DROPDOWN ENGINE (.vc-dd) — ZERO NATIVE <select> WHITE POPUPS
  // =========================================================================
  function closeAllDropdowns(exceptEl = null) {
    document.querySelectorAll('.vc-dd').forEach((dd) => {
      if (dd === exceptEl) return;
      dd.classList.remove('open');
      const menu = dd.querySelector('.vc-dd-menu');
      if (menu) menu.hidden = true;
    });
  }

  function wireDropdownToggle(ddId, onOpen) {
    const dd = $(ddId);
    if (!dd) return;
    const btn = dd.querySelector('.vc-dd-btn');
    const menu = dd.querySelector('.vc-dd-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const willOpen = menu.hidden;
      closeAllDropdowns(dd);
      menu.hidden = !willOpen;
      dd.classList.toggle('open', willOpen);
      if (willOpen && typeof onOpen === 'function') onOpen(menu);
    });

    menu.addEventListener('click', (ev) => ev.stopPropagation());
  }

  window.addEventListener('click', () => {
    closeAllDropdowns();
    hideContextMenu();
    closeCustomColorPopover();
  });

  function populateSimpleDropdown(menuEl, items, activeVal, onPick) {
    if (!menuEl) return;
    menuEl.innerHTML = '';
    for (const item of items) {
      const val = typeof item === 'object' ? item.value : item;
      const lbl = typeof item === 'object' ? item.label : item;
      const ico = typeof item === 'object' && item.icon ? item.icon : '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dd-opt' + (String(val) === String(activeVal) ? ' active' : '');
      btn.innerHTML = `${ico}<span>${escapeHtml(lbl)}</span>`;
      btn.addEventListener('click', () => {
        closeAllDropdowns();
        onPick(val, item);
      });
      menuEl.appendChild(btn);
    }
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 1B. GPU-FIRST ACCELERATION WITH AUTOMATIC CPU FALLBACK ENGINE
  // =========================================================================
  function detectHardwareAcceleration() {
    try {
      const probe = document.createElement('canvas');
      probe.width = 1;
      probe.height = 1;
      let api = 'WebGL2';
      let gl = probe.getContext('webgl2', { powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
      if (!gl) {
        api = 'WebGL1';
        gl = probe.getContext('webgl', { powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }) ||
          probe.getContext('experimental-webgl');
      }
      if (!gl) {
        return {
          webglAvailable: false,
          hasHardwareGpu: false,
          renderer: 'No WebGL — CPU Canvas2D Compositor',
          api: 'Canvas2D'
        };
      }
      let renderer = String(gl.getParameter(gl.RENDERER) || api);
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          const unmasked = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
          if (unmasked) renderer = String(unmasked);
        }
      } catch (_) {}
      // Release temporary WebGL probe context immediately so iframe 3D apps keep all context slots
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch (_) {}

      const isSoftwareRenderer = /swiftshader|llvmpipe|software|basic render driver|lavapipe/i.test(renderer);
      return {
        webglAvailable: true,
        hasHardwareGpu: !isSoftwareRenderer,
        renderer,
        api
      };
    } catch (_) {
      return {
        webglAvailable: false,
        hasHardwareGpu: false,
        renderer: 'CPU 2D Fallback',
        api: 'Canvas2D'
      };
    }
  }

  function syncAccelerationEngineUI() {
    const pref = state.preferences.accelPreference || 'auto';
    let effective = 'gpu';
    if (pref === 'cpu') {
      effective = 'cpu';
    } else if (pref === 'gpu') {
      effective = state.gpuInfo.webglAvailable ? 'gpu' : 'cpu';
    } else {
      effective = state.gpuInfo.hasHardwareGpu ? 'gpu' : 'cpu';
    }
    state.effectiveAccel = effective;
    document.documentElement.setAttribute('data-vc-accel', effective);

    const badge = $('accelModeBadge');
    if (badge) {
      badge.textContent = effective === 'gpu' ? 'GPU' : 'CPU';
      badge.classList.toggle('is-cpu', effective === 'cpu');
      badge.style.cursor = 'pointer';
      badge.title = effective === 'gpu'
        ? `GPU Accelerated (${state.gpuInfo.renderer}) · Pref: ${pref.toUpperCase()} — Click for Compute Settings`
        : `CPU Fallback Active (${state.gpuInfo.renderer}) · Pref: ${pref.toUpperCase()} — Click for Compute Settings`;
    }

    if ($('prefBtnAccelAuto')) $('prefBtnAccelAuto').classList.toggle('active', pref === 'auto');
    if ($('prefBtnAccelGpu')) $('prefBtnAccelGpu').classList.toggle('active', pref === 'gpu');
    if ($('prefBtnAccelCpu')) $('prefBtnAccelCpu').classList.toggle('active', pref === 'cpu');

    const statusEl = $('prefAccelStatusText');
    if (statusEl) {
      const modeDesc = effective === 'gpu' ? 'GPU Hardware Compositor active' : 'CPU 2D Fallback active (GPU unavailable or disabled)';
      statusEl.textContent = `${modeDesc} · Detected: ${state.gpuInfo.renderer}`;
    }

    updateCanvasTransform();
    postToBridge('set_accel_mode', { accelMode: effective });
  }

  function setAccelerationPreference(nextPref) {
    const valid = ['auto', 'gpu', 'cpu'].includes(nextPref) ? nextPref : 'auto';
    state.preferences.accelPreference = valid;
    syncAccelerationEngineUI();
    persistPreferences();
  }

  // =========================================================================
  // 2. CANVAS PASTEBOARD GEOMETRY, ZOOM, PAN & MINIMAP (FIGMA 4-WAY PAN)
  // =========================================================================
  let activePanSession = null;

  function getMinimapBounds() {
    const artW = Math.max(1, state.artboardWidth || 1920);
    const artH = Math.max(1, state.artboardHeight || 1080);
    const vw = Math.max(1, canvasScroll.clientWidth || 1000);
    const vh = Math.max(1, canvasScroll.clientHeight || 700);
    const z = Math.max(0.05, state.zoom || 1);

    const vpLeft = -state.panX / z;
    const vpTop = -state.panY / z;
    const vpRight = (vw - state.panX) / z;
    const vpBottom = (vh - state.panY) / z;

    const padX = artW * 0.25;
    const padY = artH * 0.25;
    const minX = Math.min(-padX, vpLeft);
    const minY = Math.min(-padY, vpTop);
    const maxX = Math.max(artW + padX, vpRight);
    const maxY = Math.max(artH + padY, vpBottom);

    return { artW, artH, vw, vh, z, vpLeft, vpTop, vpW: vw / z, vpH: vh / z, minX, minY, maxX, maxY };
  }

  function updateCanvasTransform() {
    const artW = state.artboardWidth || 1920;
    const artH = state.artboardHeight || 1080;

    previewFrame.style.width = `${artW}px`;
    previewFrame.style.height = `${artH}px`;
    frameStage.style.width = `${artW}px`;
    frameStage.style.height = `${artH}px`;

    const px = Math.round(state.panX * 100) / 100;
    const py = Math.round(state.panY * 100) / 100;
    if (state.effectiveAccel === 'cpu') {
      frameStage.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px) scale(${state.zoom})`;
    } else {
      frameStage.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${state.zoom})`;
    }

    // Never assign fixed pixel sizes to frameSizer — keeps workspace box fixed with zero side empty space pull!
    frameSizer.style.width = '';
    frameSizer.style.height = '';

    $('zoomLabel').textContent = `${Math.round(state.zoom * 100)}%`;
    updateMinimap();
  }

  function setZoomAtPoint(newZoom, anchorStageX, anchorStageY) {
    const clamped = Math.min(4.0, Math.max(0.15, Math.round(newZoom * 1000) / 1000));
    const prevZoom = state.zoom;
    if (Math.abs(clamped - prevZoom) < 0.0005) return;

    const rect = canvasScroll.getBoundingClientRect();
    const vx = anchorStageX !== undefined ? anchorStageX : rect.width / 2;
    const vy = anchorStageY !== undefined ? anchorStageY : rect.height / 2;

    // Artboard coordinate under (vx, vy) stays pinned strictly inside the fixed workspace!
    const artX = (vx - state.panX) / prevZoom;
    const artY = (vy - state.panY) / prevZoom;

    state.zoom = clamped;
    state.panX = vx - artX * clamped;
    state.panY = vy - artY * clamped;
    state.hasManualViewport = true;
    updateCanvasTransform();
  }

  function fitArtboardToStage() {
    const rect = canvasScroll.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return;

    const artW = state.artboardWidth || 1920;
    const artH = state.artboardHeight || 1080;
    const pad = 16;
    const fitX = (rect.width - pad * 2) / artW;
    const fitY = (rect.height - pad * 2) / artH;
    const fitZ = Math.max(0.15, Math.min(2.0, Math.min(fitX, fitY)));

    state.zoom = Math.round(fitZ * 1000) / 1000;
    state.panX = Math.round(((rect.width - artW * state.zoom) / 2) * 10) / 10;
    state.panY = Math.round(((rect.height - artH * state.zoom) / 2) * 10) / 10;
    state.hasManualViewport = false;
    updateCanvasTransform();
  }

  function startCanvasPan(hostClientX, hostClientY) {
    activePanSession = { lastX: hostClientX, lastY: hostClientY };
    canvasScroll.classList.add('pan-dragging');
    previewFrame.style.pointerEvents = 'none';
  }

  function stopCanvasPan() {
    if (!activePanSession) return;
    activePanSession = null;
    canvasScroll.classList.remove('pan-dragging');
    previewFrame.style.pointerEvents = '';
    postToBridge('end_pan');
  }

  function updateMinimap() {
    const mm = $('canvasMinimap');
    const mmArt = $('mmArtboard');
    const mmVp = $('mmViewport');
    if (!mm || !mmArt || !mmVp) return;

    const mw = mm.clientWidth || 124;
    const mh = mm.clientHeight || 74;
    const b = getMinimapBounds();
    const spanX = Math.max(1, b.maxX - b.minX);
    const spanY = Math.max(1, b.maxY - b.minY);
    const s = Math.min(mw / spanX, mh / spanY);
    const ox = (mw - spanX * s) / 2;
    const oy = (mh - spanY * s) / 2;

    mmArt.style.left = `${ox + (0 - b.minX) * s}px`;
    mmArt.style.top = `${oy + (0 - b.minY) * s}px`;
    mmArt.style.width = `${b.artW * s}px`;
    mmArt.style.height = `${b.artH * s}px`;

    const vx = ox + (b.vpLeft - b.minX) * s;
    const vy = oy + (b.vpTop - b.minY) * s;
    mmVp.style.left = `${Math.max(0, vx)}px`;
    mmVp.style.top = `${Math.max(0, vy)}px`;
    mmVp.style.width = `${Math.min(mw, b.vpW * s)}px`;
    mmVp.style.height = `${Math.min(mh, b.vpH * s)}px`;
  }

  function wireMinimapAndOuterCanvasPanZoom() {
    window.addEventListener('resize', () => {
      if (!state.hasManualViewport) fitArtboardToStage();
      else updateMinimap();
    });

    // Outer canvas wheel zoom (Ctrl+Scroll, Meta+Scroll, or Space+Ctrl+Scroll) — strictly inside workspace!
    canvasScroll.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const rect = canvasScroll.getBoundingClientRect();
      if (ev.ctrlKey || ev.metaKey || (state.spaceHeld && ev.ctrlKey)) {
        const factor = ev.deltaY < 0 ? 1.1 : 1 / 1.1;
        setZoomAtPoint(state.zoom * factor, ev.clientX - rect.left, ev.clientY - rect.top);
      } else {
        // Two-finger trackpad / wheel pan on pasteboard around artboard (Figma-style)
        state.panX -= ev.deltaX || 0;
        state.panY -= ev.deltaY || 0;
        state.hasManualViewport = true;
        updateCanvasTransform();
      }
    }, { passive: false });

    // Outer canvas Middle-click pan, Hand tool pan, or Space+drag pan (all 4 directions: up, down, left, right)
    canvasScroll.addEventListener('auxclick', (ev) => {
      if (ev.button === 1) ev.preventDefault();
    });
    canvasScroll.addEventListener('mousedown', (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('#canvasMinimap')) return;
      if (ev.button === 1 || state.spaceHeld || state.tool === 'hand') {
        ev.preventDefault();
        startCanvasPan(ev.clientX, ev.clientY);
      } else if (ev.button === 0 && state.mode === 'edit' && state.tool === 'zoom') {
        ev.preventDefault();
        const rect = canvasScroll.getBoundingClientRect();
        const factor = ev.altKey ? 0.8 : 1.25;
        setZoomAtPoint(state.zoom * factor, ev.clientX - rect.left, ev.clientY - rect.top);
      }
    });
    window.addEventListener('mousemove', (ev) => {
      if (!activePanSession) return;
      const dx = ev.clientX - activePanSession.lastX;
      const dy = ev.clientY - activePanSession.lastY;
      activePanSession.lastX = ev.clientX;
      activePanSession.lastY = ev.clientY;
      if (dx !== 0 || dy !== 0) {
        state.panX += dx;
        state.panY += dy;
        state.hasManualViewport = true;
        updateCanvasTransform();
      }
    });
    window.addEventListener('mouseup', () => {
      stopCanvasPan();
    });
    window.addEventListener('blur', () => {
      stopCanvasPan();
    });

    // Minimap click/drag pan
    const mm = $('canvasMinimap');
    let mmDrag = false;
    const jumpMinimap = (ev) => {
      const r = mm.getBoundingClientRect();
      const mw = r.width || 124;
      const mh = r.height || 74;
      const b = getMinimapBounds();
      const spanX = Math.max(1, b.maxX - b.minX);
      const spanY = Math.max(1, b.maxY - b.minY);
      const s = Math.min(mw / spanX, mh / spanY);
      const ox = (mw - spanX * s) / 2;
      const oy = (mh - spanY * s) / 2;
      const worldX = b.minX + (ev.clientX - r.left - ox) / s;
      const worldY = b.minY + (ev.clientY - r.top - oy) / s;
      state.panX = Math.round(b.vw / 2 - worldX * state.zoom);
      state.panY = Math.round(b.vh / 2 - worldY * state.zoom);
      state.hasManualViewport = true;
      updateCanvasTransform();
    };
    mm.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      mmDrag = true;
      jumpMinimap(ev);
    });
    window.addEventListener('mousemove', (ev) => {
      if (mmDrag) jumpMinimap(ev);
    });
    window.addEventListener('mouseup', () => { mmDrag = false; });

    $('btnZoomFit').addEventListener('click', fitArtboardToStage);
    $('btnZoomIn').addEventListener('click', () => setZoomAtPoint(state.zoom * 1.15));
    $('btnZoomOut').addEventListener('click', () => setZoomAtPoint(state.zoom / 1.15));
    $('btnZoomReset').addEventListener('click', () => setZoomAtPoint(1.0));
    $('btnReloadFrame').addEventListener('click', () => loadEntryIntoIframe(state.entry));
  }

  // =========================================================================
  // 3. PHOTOSHOP DRAGGABLE SCRUBBY NUMBER FIELDS
  // =========================================================================
  function parseNumericValue(raw, fallback = 0) {
    const m = /[-+]?\d*\.?\d+/.exec(String(raw ?? ''));
    return m ? parseFloat(m[0]) : fallback;
  }

  function formatUnitValue(val, unit) {
    const rounded = Math.abs(val - Math.round(val)) < 0.001 ? Math.round(val) : Math.round(val * 100) / 100;
    return unit ? `${rounded}${unit === 'px' && String(unit) === 'px' ? 'px' : unit}` : String(rounded);
  }

  function dispatchInspectorFieldChange(inputId, numericVal, previewOnly, commitScrub) {
    switch (inputId) {
      case 'propX':
        postToBridge('patch_style', { xPos: numericVal, previewOnly, commitScrub });
        break;
      case 'propY':
        postToBridge('patch_style', { yPos: numericVal, previewOnly, commitScrub });
        break;
      case 'propW': {
        const props = { width: `${Math.max(4, numericVal)}px`, boxSizing: 'border-box', maxWidth: 'none' };
        if (state.lockAspect && state.aspectRatio > 0) {
          const h = Math.max(4, Math.round((numericVal / state.aspectRatio) * 10) / 10);
          props.height = `${h}px`;
          $('propH').value = `${h}px`;
        }
        postToBridge('patch_style', { props, previewOnly, commitScrub });
        break;
      }
      case 'propH': {
        const props = { height: `${Math.max(4, numericVal)}px`, boxSizing: 'border-box' };
        if (state.lockAspect && state.aspectRatio > 0) {
          const w = Math.max(4, Math.round(numericVal * state.aspectRatio * 10) / 10);
          props.width = `${w}px`;
          $('propW').value = `${w}px`;
        }
        postToBridge('patch_style', { props, previewOnly, commitScrub });
        break;
      }
      case 'propRotate':
        postToBridge('patch_style', { rotateDeg: numericVal, previewOnly, commitScrub });
        break;
      case 'propScalePct':
        postToBridge('patch_style', { scalePercent: Math.max(10, numericVal), previewOnly, commitScrub });
        if (commitScrub) $('propScalePct').value = '100%';
        break;
      case 'propPadding':
        postToBridge('patch_style', { props: { padding: `${Math.max(0, numericVal)}px` }, previewOnly, commitScrub });
        break;
      case 'propMargin':
        postToBridge('patch_style', { props: { margin: `${numericVal}px` }, previewOnly, commitScrub });
        break;
      case 'propFlexGap':
        postToBridge('patch_style', { props: { gap: `${Math.max(0, numericVal)}px` }, previewOnly, commitScrub });
        break;
      case 'propRadius':
        postToBridge('patch_style', { props: { borderRadius: `${Math.max(0, numericVal)}px` }, previewOnly, commitScrub });
        break;
      case 'propZIndex':
        postToBridge('patch_style', { props: { position: 'relative', zIndex: String(Math.round(numericVal)) }, previewOnly, commitScrub });
        break;
      case 'propOpacity':
        postToBridge('patch_style', { props: { opacity: String(Math.min(1, Math.max(0, numericVal / 100))) }, previewOnly, commitScrub });
        break;
      case 'propBorderWidth': {
        const bw = Math.max(0, numericVal);
        state.paint.strokeWidth = bw;
        const props = bw > 0
          ? { borderWidth: `${bw}px`, borderStyle: state.paint.strokeStyle || 'solid', borderColor: state.paint.strokeColor || '#78716c' }
          : { borderWidth: '0px' };
        syncPaintProxiesUI();
        postToBridge('patch_style', { props, previewOnly, commitScrub });
        break;
      }
      case 'propFontSize':
        postToBridge('patch_style', { props: { fontSize: `${Math.max(6, numericVal)}px` }, previewOnly, commitScrub });
        break;
      case 'propLineHeight':
        postToBridge('patch_style', { props: { lineHeight: String(Math.max(0.5, numericVal)) }, previewOnly, commitScrub });
        break;
      case 'propLetterSpacing':
        postToBridge('patch_style', { props: { letterSpacing: `${numericVal}px` }, previewOnly, commitScrub });
        break;
      case 'gradStopPos': {
        const stop = state.paint.gradStops[state.paint.selectedStopIdx];
        if (stop) {
          stop.pos = Math.min(100, Math.max(0, Math.round(numericVal)));
          renderGradientEditorUI();
          applyActiveGradientToSelection(previewOnly, commitScrub);
        }
        break;
      }
      case 'gradAngle': {
        state.paint.gradAngle = Math.round(numericVal);
        renderGradientEditorUI();
        applyActiveGradientToSelection(previewOnly, commitScrub);
        break;
      }
      case 'prefKeyInc': {
        state.preferences.keyboardIncrement = Math.max(1, Math.round(numericVal));
        postToBridge('set_prefs', { prefs: state.preferences });
        if (commitScrub) persistPreferences();
        break;
      }
      case 'inpDistGap':
        // Used when clicking Vertical/Horizontal Distribute Space buttons
        break;
    }
    if (commitScrub && state.preferences.autoSave) scheduleAutoSaveIfEnabled();
  }

  function wireAllScrubbyNumberFields() {
    document.querySelectorAll('[data-scrub-for]').forEach((wrap) => {
      const inputId = wrap.getAttribute('data-scrub-for');
      const input = $(inputId);
      if (!input) return;

      const baseStep = parseFloat(wrap.getAttribute('data-step') || '1') || 1;
      const minAttr = wrap.hasAttribute('data-min') ? parseFloat(wrap.getAttribute('data-min')) : -Infinity;
      const maxAttr = wrap.hasAttribute('data-max') ? parseFloat(wrap.getAttribute('data-max')) : Infinity;
      const unit = wrap.getAttribute('data-unit') ?? '';

      const handleEl = wrap.querySelector('.scrub-lbl, .scrub-glyph') || wrap;

      const beginScrub = (ev) => {
        if (ev.button !== 0) return;
        // Allow normal click-to-type inside <input> unless Alt is held
        if (ev.target === input && !ev.altKey) return;
        ev.preventDefault();

        const startX = ev.clientX;
        const startVal = parseNumericValue(input.value, 0);
        let curVal = startVal;
        let dragged = false;
        document.body.style.cursor = 'ew-resize';

        const onMove = (mev) => {
          const dx = mev.clientX - startX;
          if (!dragged && Math.abs(dx) < 1) return;
          dragged = true;
          const mult = mev.shiftKey ? 10 : mev.altKey ? 0.1 : 1;
          const rawNext = startVal + (dx / 2) * baseStep * mult;
          const stepped = Math.round(rawNext / (baseStep * mult)) * (baseStep * mult);
          curVal = Math.min(maxAttr, Math.max(minAttr, Math.round(stepped * 100) / 100));
          input.value = formatUnitValue(curVal, unit);
          dispatchInspectorFieldChange(inputId, curVal, true, false);
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          if (dragged) {
            dispatchInspectorFieldChange(inputId, curVal, false, true);
          } else {
            input.focus();
            input.select();
          }
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };

      handleEl.addEventListener('mousedown', beginScrub);
      input.addEventListener('mousedown', (ev) => {
        if (ev.altKey) beginScrub(ev);
      });

      // Keyboard ArrowUp / ArrowDown & Enter commit inside number input
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
          ev.preventDefault();
          const dir = ev.key === 'ArrowUp' ? 1 : -1;
          const mult = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
          const cur = parseNumericValue(input.value, 0);
          const next = Math.min(maxAttr, Math.max(minAttr, Math.round((cur + dir * baseStep * mult) * 100) / 100));
          input.value = formatUnitValue(next, unit);
          dispatchInspectorFieldChange(inputId, next, false, true);
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          const next = Math.min(maxAttr, Math.max(minAttr, parseNumericValue(input.value, 0)));
          input.value = formatUnitValue(next, unit);
          dispatchInspectorFieldChange(inputId, next, false, true);
          input.blur();
        }
      });

      input.addEventListener('change', () => {
        const next = Math.min(maxAttr, Math.max(minAttr, parseNumericValue(input.value, 0)));
        input.value = formatUnitValue(next, unit);
        dispatchInspectorFieldChange(inputId, next, false, true);
      });
    });
  }

  // =========================================================================
  // 4. ILLUSTRATOR FILL, STROKE & MULTI-STOP GRADIENT ENGINE
  // =========================================================================
  function buildCssGradientFromState() {
    const stopsSorted = [...state.paint.gradStops].sort((a, b) => a.pos - b.pos);
    const stopStr = stopsSorted.map((s) => `${s.color} ${s.pos}%`).join(', ');
    if (state.paint.fillMode === 'radial') {
      return `radial-gradient(circle, ${stopStr})`;
    }
    return `linear-gradient(${state.paint.gradAngle}deg, ${stopStr})`;
  }

  function syncPaintProxiesUI() {
    const p = state.paint;
    const fillBg = p.fillMode === 'none'
      ? 'repeating-linear-gradient(-45deg, #2c2a28 0 4px, #ef4444 4px 5.5px, #2c2a28 5.5px 9px)'
      : (p.fillMode === 'linear' || p.fillMode === 'radial')
        ? buildCssGradientFromState()
        : p.fillColor;

    const strokeIsNone = p.strokeMode === 'none' || p.strokeWidth <= 0;
    const fillIsNone = p.fillMode === 'none';
    const strokeCol = strokeIsNone ? 'transparent' : p.strokeColor;

    $('proxyFillBtn').style.background = fillBg;
    $('dockFillSwatch').style.background = fillBg;
    $('proxyStrokeBtn').style.borderColor = strokeCol === 'transparent' ? '#494540' : strokeCol;
    $('dockStrokeSwatch').style.borderColor = strokeCol === 'transparent' ? '#494540' : strokeCol;

    $('proxyFillBtn').classList.toggle('is-none', fillIsNone);
    $('dockFillSwatch').classList.toggle('is-none', fillIsNone);
    $('proxyStrokeBtn').classList.toggle('is-none', strokeIsNone);
    $('dockStrokeSwatch').classList.toggle('is-none', strokeIsNone);

    const isFill = state.activeProxy === 'fill';
    $('proxyFillBtn').classList.toggle('active-proxy', isFill);
    $('dockFillSwatch').classList.toggle('active-proxy', isFill);
    $('proxyStrokeBtn').classList.toggle('active-proxy', !isFill);
    $('dockStrokeSwatch').classList.toggle('active-proxy', !isFill);

    const activeMode = isFill ? p.fillMode : p.strokeMode;
    document.querySelectorAll('#paintModeTabs .pm-tab').forEach((btn) => {
      const m = btn.getAttribute('data-pmode');
      // Disable gradient tabs when Stroke proxy is focused (CSS borders use solid/none)
      if (!isFill && (m === 'linear' || m === 'radial')) {
        btn.style.opacity = '0.35';
      } else {
        btn.style.opacity = '1';
      }
      btn.classList.toggle('active', m === activeMode);
    });

    // Sync Illustrator left toolbar mini mode buttons ([Solid] [Gradient] [None / Unfill])
    const curSolidHex = isFill ? (p.fillColor || '#f97316') : (p.strokeColor || '#78716c');
    if ($('dockMiniSolidChip')) {
      $('dockMiniSolidChip').style.background = curSolidHex;
    }
    if ($('btnDockModeSolid')) {
      $('btnDockModeSolid').classList.toggle('active', activeMode === 'solid');
    }
    if ($('btnDockModeGrad')) {
      $('btnDockModeGrad').classList.toggle('active', isFill && (activeMode === 'linear' || activeMode === 'radial'));
      $('btnDockModeGrad').style.opacity = isFill ? '1' : '0.45';
    }
    if ($('btnDockModeNone')) {
      $('btnDockModeNone').classList.toggle('active', activeMode === 'none');
    }

    const showGrad = isFill && (p.fillMode === 'linear' || p.fillMode === 'radial');
    // Keep solid color picker & quick swatches accessible even when Fill/Stroke is 'none' so picking a color immediately activates Solid!
    $('paintSolidPane').hidden = showGrad;
    $('paintGradientPane').hidden = !showGrad;
    $('gradAngleWrap').style.visibility = p.fillMode === 'radial' ? 'hidden' : 'visible';

    const curHex = isFill ? p.fillColor : p.strokeColor;
    if (/^#[0-9a-f]{6}$/i.test(curHex)) {
      $('activePaintPicker').value = curHex;
    }
    $('activePaintHex').value = curHex;

    postToBridge('set_active_paint', {
      paint: {
        fillMode: p.fillMode,
        fillColor: p.fillColor,
        fillGradient: buildCssGradientFromState(),
        strokeMode: p.strokeMode,
        strokeColor: p.strokeColor,
        strokeWidth: p.strokeWidth,
        strokeStyle: p.strokeStyle
      }
    });
  }

  function renderGradientEditorUI() {
    const bar = $('gradPreviewBar');
    const track = $('gradStopsTrack');
    if (!bar || !track) return;

    const gradCss = buildCssGradientFromState();
    bar.style.background = gradCss;
    track.innerHTML = '';

    state.paint.gradStops.forEach((stop, idx) => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'grad-stop-pin' + (idx === state.paint.selectedStopIdx ? ' active' : '');
      pin.style.left = `${stop.pos}%`;
      pin.style.background = stop.color;
      pin.title = `${stop.color} at ${stop.pos}%`;

      pin.addEventListener('mousedown', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        state.paint.selectedStopIdx = idx;
        renderGradientEditorUI();

        const rect = track.getBoundingClientRect();
        let moved = false;
        const onMove = (mev) => {
          moved = true;
          const pct = Math.min(100, Math.max(0, Math.round(((mev.clientX - rect.left) / Math.max(1, rect.width)) * 100)));
          state.paint.gradStops[idx].pos = pct;
          renderGradientEditorUI();
          applyActiveGradientToSelection(true, false);
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          if (moved) applyActiveGradientToSelection(false, true);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

      track.appendChild(pin);
    });

    const sel = state.paint.gradStops[state.paint.selectedStopIdx] || state.paint.gradStops[0];
    if (sel) {
      if (/^#[0-9a-f]{6}$/i.test(sel.color)) $('gradStopColor').value = sel.color;
      $('gradStopHex').value = sel.color;
      $('gradStopPos').value = `${sel.pos}%`;
    }
    $('gradAngle').value = `${state.paint.gradAngle}deg`;
    syncPaintProxiesUI();
  }

  function applyActiveGradientToSelection(previewOnly = false, commitScrub = true) {
    const grad = buildCssGradientFromState();
    postToBridge('patch_style', {
      props: { background: null, backgroundImage: grad, backgroundColor: 'transparent' },
      previewOnly,
      commitScrub
    });
  }

  function applyUnfillToActiveProxy() {
    if (state.activeProxy === 'fill') {
      state.paint.fillMode = 'none';
      syncPaintProxiesUI();
      postToBridge('patch_style', {
        unfillTarget: 'fill',
        props: { background: 'none', backgroundImage: 'none', backgroundColor: 'transparent' },
        previewOnly: false,
        commitScrub: true
      });
    } else {
      state.paint.strokeMode = 'none';
      state.paint.strokeWidth = 0;
      if ($('propBorderWidth')) $('propBorderWidth').value = '0px';
      syncPaintProxiesUI();
      postToBridge('patch_style', {
        unfillTarget: 'stroke',
        props: { border: 'none', borderWidth: '0px', borderColor: 'transparent' },
        previewOnly: false,
        commitScrub: true
      });
    }
  }

  function applyDefaultFillAndStroke() {
    state.paint.fillMode = 'solid';
    state.paint.fillColor = '#ece9e5';
    state.paint.strokeMode = 'solid';
    state.paint.strokeColor = '#292524';
    state.paint.strokeWidth = 1;
    state.paint.strokeStyle = 'solid';
    if ($('propBorderWidth')) $('propBorderWidth').value = '1px';
    if ($('ddStrokeStyleLabel')) $('ddStrokeStyleLabel').textContent = 'solid';
    syncPaintProxiesUI();
    postToBridge('patch_style', {
      props: {
        background: null,
        backgroundImage: 'none',
        backgroundColor: '#ece9e5',
        border: null,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#292524'
      },
      previewOnly: false,
      commitScrub: true
    });
  }

  function applyPaintModeChoice(m) {
    if (m === 'none') {
      applyUnfillToActiveProxy();
      return;
    }
    if (state.activeProxy === 'stroke' && (m === 'linear' || m === 'radial')) {
      state.activeProxy = 'fill';
    }
    if (state.activeProxy === 'fill') {
      state.paint.fillMode = m;
      syncPaintProxiesUI();
      if (m === 'solid') {
        postToBridge('patch_style', {
          props: { background: null, backgroundImage: 'none', backgroundColor: state.paint.fillColor },
          commitScrub: true
        });
      } else {
        renderGradientEditorUI();
        applyActiveGradientToSelection(false, true);
      }
    } else {
      state.paint.strokeMode = 'solid';
      const bw = state.paint.strokeWidth || 1;
      state.paint.strokeWidth = bw;
      if ($('propBorderWidth')) $('propBorderWidth').value = `${bw}px`;
      syncPaintProxiesUI();
      postToBridge('patch_style', {
        props: { borderWidth: `${bw}px`, borderStyle: state.paint.strokeStyle || 'solid', borderColor: state.paint.strokeColor },
        commitScrub: true
      });
    }
  }

  function swapFillAndStroke() {
    const prevFill = state.paint.fillColor;
    state.paint.fillColor = state.paint.strokeColor || '#f97316';
    state.paint.strokeColor = prevFill || '#78716c';
    if (state.paint.fillMode === 'none') state.paint.fillMode = 'solid';
    if (state.paint.strokeMode === 'none') state.paint.strokeMode = 'solid';
    if (!state.paint.strokeWidth) {
      state.paint.strokeWidth = 1;
      $('propBorderWidth').value = '1px';
    }
    syncPaintProxiesUI();
    postToBridge('patch_style', {
      props: {
        background: 'none',
        backgroundImage: 'none',
        backgroundColor: state.paint.fillColor,
        borderColor: state.paint.strokeColor,
        borderWidth: `${state.paint.strokeWidth}px`,
        borderStyle: state.paint.strokeStyle || 'solid'
      },
      previewOnly: false,
      commitScrub: true
    });
  }

  // =========================================================================
  // 4B. CUSTOM WARM GREY STONE + ORANGE COLOR PICKER POPOVER (#vcColorPopover)
  // Replaces native OS/Chromium rainbow <input type="color"> popup completely!
  // =========================================================================
  const cpState = {
    open: false,
    targetInput: null,
    allowUnfill: false,
    h: 24,
    s: 0.91,
    v: 0.98,
    dirtyPreview: false
  };

  function cpHexToRgb(hex) {
    let s = String(hex || '').trim().replace(/^#/, '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return { r: 249, g: 115, b: 22 };
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16)
    };
  }

  function cpRgbToHex(r, g, b) {
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
    const toH = (n) => clamp(n).toString(16).padStart(2, '0');
    return `#${toH(r)}${toH(g)}${toH(b)}`;
  }

  function cpRgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d > 0.00001) {
      if (max === rn) h = 60 * (((gn - bn) / d) % 6);
      else if (max === gn) h = 60 * ((bn - rn) / d + 2);
      else h = 60 * ((rn - gn) / d + 4);
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
  }

  function cpHsvToRgb(h, s, v) {
    const hh = ((Number(h) % 360) + 360) % 360;
    const ss = Math.max(0, Math.min(1, Number(s)));
    const vv = Math.max(0, Math.min(1, Number(v)));
    const c = vv * ss;
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = vv - c;
    let r1 = 0; let g1 = 0; let b1 = 0;
    if (hh < 60) { r1 = c; g1 = x; }
    else if (hh < 120) { r1 = x; g1 = c; }
    else if (hh < 180) { g1 = c; b1 = x; }
    else if (hh < 240) { g1 = x; b1 = c; }
    else if (hh < 300) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function renderCustomColorPopoverUI() {
    const pop = $('vcColorPopover');
    if (!pop || pop.hidden) return;
    const rgb = cpHsvToRgb(cpState.h, cpState.s, cpState.v);
    const hex = cpRgbToHex(rgb.r, rgb.g, rgb.b);
    const pureRgb = cpHsvToRgb(cpState.h, 1, 1);
    const pureHex = cpRgbToHex(pureRgb.r, pureRgb.g, pureRgb.b);

    const cvs = $('vcCpSvCanvas');
    if (cvs) {
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const w = cvs.width || 216;
        const h = cvs.height || 128;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = pureHex;
        ctx.fillRect(0, 0, w, h);

        const gradW = ctx.createLinearGradient(0, 0, w, 0);
        gradW.addColorStop(0, 'rgba(255,255,255,1)');
        gradW.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradW;
        ctx.fillRect(0, 0, w, h);

        const gradB = ctx.createLinearGradient(0, 0, 0, h);
        gradB.addColorStop(0, 'rgba(0,0,0,0)');
        gradB.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gradB;
        ctx.fillRect(0, 0, w, h);
      }
    }

    const svThumb = $('vcCpSvThumb');
    if (svThumb) {
      svThumb.style.left = `${Math.round(cpState.s * 1000) / 10}%`;
      svThumb.style.top = `${Math.round((1 - cpState.v) * 1000) / 10}%`;
      svThumb.style.background = hex;
    }
    const hueThumb = $('vcCpHueThumb');
    if (hueThumb) {
      hueThumb.style.left = `${Math.round((cpState.h / 360) * 1000) / 10}%`;
      hueThumb.style.background = pureHex;
    }
    if ($('vcCpPreviewChip')) $('vcCpPreviewChip').style.background = hex;

    if ($('vcCpHex') && document.activeElement !== $('vcCpHex')) $('vcCpHex').value = hex;
    if ($('vcCpR') && document.activeElement !== $('vcCpR')) $('vcCpR').value = String(rgb.r);
    if ($('vcCpG') && document.activeElement !== $('vcCpG')) $('vcCpG').value = String(rgb.g);
    if ($('vcCpB') && document.activeElement !== $('vcCpB')) $('vcCpB').value = String(rgb.b);
  }

  function pushCustomPickerColorToTarget(commit = false) {
    const inp = cpState.targetInput;
    if (!inp) return;
    const rgb = cpHsvToRgb(cpState.h, cpState.s, cpState.v);
    const hex = cpRgbToHex(rgb.r, rgb.g, rgb.b);
    inp.value = hex;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    if (commit) {
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      cpState.dirtyPreview = false;
    } else {
      cpState.dirtyPreview = true;
    }
  }

  function closeCustomColorPopover() {
    const pop = $('vcColorPopover');
    if (!pop || pop.hidden) return;
    if (cpState.dirtyPreview && cpState.targetInput) {
      cpState.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    cpState.dirtyPreview = false;
    cpState.open = false;
    cpState.targetInput = null;
    pop.hidden = true;
  }

  function openCustomColorPopover(targetInput, anchorEl = null) {
    const pop = $('vcColorPopover');
    if (!pop || !targetInput) return;

    closeAllDropdowns();
    hideContextMenu();

    cpState.targetInput = targetInput;
    cpState.open = true;
    cpState.dirtyPreview = false;
    cpState.allowUnfill = targetInput.id === 'activePaintPicker';

    const titleMap = {
      inpPrimaryColor: 'Primary Color',
      inpSecondaryColor: 'Secondary Color',
      activePaintPicker: state.activeProxy === 'stroke' ? 'Stroke Color' : 'Fill Color',
      gradStopColor: 'Gradient Stop Color',
      propColorPicker: 'Text Color'
    };
    if ($('vcCpTitle')) {
      $('vcCpTitle').textContent = titleMap[targetInput.id] || 'Color Picker';
    }
    if ($('vcCpUnfill')) $('vcCpUnfill').hidden = !cpState.allowUnfill;
    const noneSw = pop.querySelector('.vcp-sw-none');
    if (noneSw) noneSw.hidden = !cpState.allowUnfill;

    const initialHex = targetInput.value || '#f97316';
    const rgb = cpHexToRgb(initialHex);
    const hsv = cpRgbToHsv(rgb.r, rgb.g, rgb.b);
    if (hsv.s > 0.01) cpState.h = hsv.h;
    cpState.s = hsv.s;
    cpState.v = hsv.v;

    pop.hidden = false;
    renderCustomColorPopoverUI();

    const refEl = anchorEl || targetInput.closest('.color-chip, .color-field') || targetInput;
    const rect = refEl.getBoundingClientRect();
    const popW = pop.offsetWidth || 236;
    const popH = pop.offsetHeight || 262;

    let left = rect.left;
    let top = rect.bottom + 6;
    // If anchored on left toolbar dock, place to the right of the dock
    if (rect.left < 90) {
      left = rect.right + 8;
      top = Math.min(window.innerHeight - popH - 10, Math.max(44, rect.top - 40));
    } else {
      if (left + popW > window.innerWidth - 10) {
        left = Math.max(10, window.innerWidth - popW - 10);
      }
      if (top + popH > window.innerHeight - 10) {
        top = Math.max(44, rect.top - popH - 6);
      }
    }
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  }

  function wireCustomColorPopover() {
    const pop = $('vcColorPopover');
    if (!pop) return;

    pop.addEventListener('click', (ev) => ev.stopPropagation());
    pop.addEventListener('mousedown', (ev) => ev.stopPropagation());

    // Intercept ALL native <input type="color"> clicks/keys so OS color dialog NEVER appears!
    document.querySelectorAll('input[type="color"]').forEach((inp) => {
      inp.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (cpState.open && cpState.targetInput === inp) {
          closeCustomColorPopover();
        } else {
          openCustomColorPopover(inp, inp.closest('.color-chip, .color-field') || inp);
        }
      });
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          ev.stopPropagation();
          openCustomColorPopover(inp, inp.closest('.color-chip, .color-field') || inp);
        }
      });
    });

    if ($('vcCpClose')) {
      $('vcCpClose').addEventListener('click', () => closeCustomColorPopover());
    }
    if ($('vcCpEyedropper')) {
      $('vcCpEyedropper').addEventListener('click', () => {
        closeCustomColorPopover();
        setActiveTool('eyedropper');
      });
    }
    if ($('vcCpUnfill')) {
      $('vcCpUnfill').addEventListener('click', () => {
        applyUnfillToActiveProxy();
        cpState.dirtyPreview = false;
        closeCustomColorPopover();
      });
    }

    const svWrap = $('vcCpSvWrap');
    if (svWrap) {
      const pickSv = (ev, commit) => {
        const r = svWrap.getBoundingClientRect();
        cpState.s = Math.max(0, Math.min(1, (ev.clientX - r.left) / Math.max(1, r.width)));
        cpState.v = Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / Math.max(1, r.height)));
        renderCustomColorPopoverUI();
        pushCustomPickerColorToTarget(commit);
      };
      svWrap.addEventListener('mousedown', (ev) => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        pickSv(ev, false);
        const onMove = (mev) => pickSv(mev, false);
        const onUp = (uev) => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          pickSv(uev, true);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    }

    const hueTrack = $('vcCpHueTrack');
    if (hueTrack) {
      const pickHue = (ev, commit) => {
        const r = hueTrack.getBoundingClientRect();
        cpState.h = Math.max(0, Math.min(360, ((ev.clientX - r.left) / Math.max(1, r.width)) * 360));
        renderCustomColorPopoverUI();
        pushCustomPickerColorToTarget(commit);
      };
      hueTrack.addEventListener('mousedown', (ev) => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        pickHue(ev, false);
        const onMove = (mev) => pickHue(mev, false);
        const onUp = (uev) => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          pickHue(uev, true);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    }

    if ($('vcCpHex')) {
      const onHexInput = (commit) => {
        let v = $('vcCpHex').value.trim();
        if (v && !v.startsWith('#')) v = '#' + v;
        if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
          const rgb = cpHexToRgb(v);
          const hsv = cpRgbToHsv(rgb.r, rgb.g, rgb.b);
          if (hsv.s > 0.01) cpState.h = hsv.h;
          cpState.s = hsv.s;
          cpState.v = hsv.v;
          renderCustomColorPopoverUI();
          pushCustomPickerColorToTarget(commit);
        }
      };
      $('vcCpHex').addEventListener('input', () => onHexInput(false));
      $('vcCpHex').addEventListener('change', () => onHexInput(true));
      $('vcCpHex').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          onHexInput(true);
        }
      });
    }

    ['vcCpR', 'vcCpG', 'vcCpB'].forEach((rgbId) => {
      const el = $(rgbId);
      if (!el) return;
      const onRgb = (commit) => {
        const r = Math.max(0, Math.min(255, parseInt($('vcCpR').value || '0', 10) || 0));
        const g = Math.max(0, Math.min(255, parseInt($('vcCpG').value || '0', 10) || 0));
        const b = Math.max(0, Math.min(255, parseInt($('vcCpB').value || '0', 10) || 0));
        const hsv = cpRgbToHsv(r, g, b);
        if (hsv.s > 0.01) cpState.h = hsv.h;
        cpState.s = hsv.s;
        cpState.v = hsv.v;
        renderCustomColorPopoverUI();
        pushCustomPickerColorToTarget(commit);
      };
      el.addEventListener('input', () => onRgb(false));
      el.addEventListener('change', () => onRgb(true));
    });

    document.querySelectorAll('#vcCpSwatches button[data-vcp-sw]').forEach((swBtn) => {
      swBtn.addEventListener('click', () => {
        const sw = swBtn.getAttribute('data-vcp-sw');
        if (sw === 'none') {
          if (cpState.allowUnfill) {
            applyUnfillToActiveProxy();
            cpState.dirtyPreview = false;
            closeCustomColorPopover();
          }
          return;
        }
        const rgb = cpHexToRgb(sw);
        const hsv = cpRgbToHsv(rgb.r, rgb.g, rgb.b);
        if (hsv.s > 0.01) cpState.h = hsv.h;
        cpState.s = hsv.s;
        cpState.v = hsv.v;
        renderCustomColorPopoverUI();
        pushCustomPickerColorToTarget(true);
      });
    });
  }

  function wirePaintControls() {
    const focusProxy = (which, openPickerIfAlreadyActive = false, anchorEl = null) => {
      const wasAlreadyActive = state.activeProxy === which;
      state.activeProxy = which;
      syncPaintProxiesUI();
      if (openPickerIfAlreadyActive && wasAlreadyActive) {
        openCustomColorPopover($('activePaintPicker'), anchorEl || $('activePaintPicker'));
      }
    };
    $('proxyFillBtn').addEventListener('click', (ev) => { ev.stopPropagation(); focusProxy('fill', true, $('proxyFillBtn')); });
    $('dockFillSwatch').addEventListener('click', (ev) => { ev.stopPropagation(); focusProxy('fill', true, $('dockFillSwatch')); });
    $('proxyStrokeBtn').addEventListener('click', (ev) => { ev.stopPropagation(); focusProxy('stroke', true, $('proxyStrokeBtn')); });
    $('dockStrokeSwatch').addEventListener('click', (ev) => { ev.stopPropagation(); focusProxy('stroke', true, $('dockStrokeSwatch')); });
    $('proxyFillBtn').addEventListener('dblclick', (ev) => { ev.stopPropagation(); focusProxy('fill', false); openCustomColorPopover($('activePaintPicker'), $('proxyFillBtn')); });
    $('dockFillSwatch').addEventListener('dblclick', (ev) => { ev.stopPropagation(); focusProxy('fill', false); openCustomColorPopover($('activePaintPicker'), $('dockFillSwatch')); });
    $('proxyStrokeBtn').addEventListener('dblclick', (ev) => { ev.stopPropagation(); focusProxy('stroke', false); openCustomColorPopover($('activePaintPicker'), $('proxyStrokeBtn')); });
    $('dockStrokeSwatch').addEventListener('dblclick', (ev) => { ev.stopPropagation(); focusProxy('stroke', false); openCustomColorPopover($('activePaintPicker'), $('dockStrokeSwatch')); });
    $('btnSwapFillStroke').addEventListener('click', swapFillAndStroke);
    $('btnDockSwap').addEventListener('click', swapFillAndStroke);
    if ($('btnDockDefault')) $('btnDockDefault').addEventListener('click', applyDefaultFillAndStroke);
    if ($('btnProxyDefault')) $('btnProxyDefault').addEventListener('click', applyDefaultFillAndStroke);

    // Wire Illustrator left dock mini mode buttons ([Solid] [Gradient] [None / Unfill])
    if ($('btnDockModeSolid')) {
      $('btnDockModeSolid').addEventListener('click', () => applyPaintModeChoice('solid'));
    }
    if ($('btnDockModeGrad')) {
      $('btnDockModeGrad').addEventListener('click', () => {
        state.activeProxy = 'fill';
        applyPaintModeChoice('linear');
      });
    }
    if ($('btnDockModeNone')) {
      $('btnDockModeNone').addEventListener('click', () => applyUnfillToActiveProxy());
    }

    document.querySelectorAll('#paintModeTabs .pm-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyPaintModeChoice(btn.getAttribute('data-pmode'));
      });
    });

    const applySolidColor = (hex, commit) => {
      if (!/^#[0-9a-f]{3,8}$/i.test(hex)) return;
      if (state.activeProxy === 'fill') {
        state.paint.fillMode = 'solid';
        state.paint.fillColor = hex;
        syncPaintProxiesUI();
        postToBridge('patch_style', {
          props: { background: null, backgroundImage: 'none', backgroundColor: hex },
          previewOnly: !commit,
          commitScrub: commit
        });
      } else {
        state.paint.strokeMode = 'solid';
        state.paint.strokeColor = hex;
        if (!state.paint.strokeWidth) {
          state.paint.strokeWidth = 1;
          $('propBorderWidth').value = '1px';
        }
        syncPaintProxiesUI();
        postToBridge('patch_style', {
          props: {
            border: null,
            borderColor: hex,
            borderWidth: `${state.paint.strokeWidth}px`,
            borderStyle: state.paint.strokeStyle || 'solid'
          },
          previewOnly: !commit,
          commitScrub: commit
        });
      }
    };

    $('activePaintPicker').addEventListener('input', (e) => {
      $('activePaintHex').value = e.target.value;
      applySolidColor(e.target.value, false);
    });
    $('activePaintPicker').addEventListener('change', (e) => applySolidColor(e.target.value, true));
    $('activePaintHex').addEventListener('input', (e) => {
      const v = e.target.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) applySolidColor(v, false);
    });
    $('activePaintHex').addEventListener('change', (e) => applySolidColor(e.target.value.trim(), true));

    document.querySelectorAll('#quickSwatchStrip button[data-sw]').forEach((sw) => {
      sw.addEventListener('click', () => applySolidColor(sw.getAttribute('data-sw'), true));
    });

    // Gradient bar click-to-add-stop & controls
    $('gradPreviewBar').addEventListener('click', (ev) => {
      const r = ev.currentTarget.getBoundingClientRect();
      const pos = Math.min(100, Math.max(0, Math.round(((ev.clientX - r.left) / Math.max(1, r.width)) * 100)));
      state.paint.gradStops.push({ pos, color: '#fb923c' });
      state.paint.selectedStopIdx = state.paint.gradStops.length - 1;
      renderGradientEditorUI();
      applyActiveGradientToSelection(false, true);
    });

    $('gradStopColor').addEventListener('input', (ev) => {
      const stop = state.paint.gradStops[state.paint.selectedStopIdx];
      if (!stop) return;
      stop.color = ev.target.value;
      $('gradStopHex').value = ev.target.value;
      renderGradientEditorUI();
      applyActiveGradientToSelection(true, false);
    });
    $('gradStopColor').addEventListener('change', () => applyActiveGradientToSelection(false, true));
    $('gradStopHex').addEventListener('change', (ev) => {
      const stop = state.paint.gradStops[state.paint.selectedStopIdx];
      if (stop && /^#[0-9a-f]{3,8}$/i.test(ev.target.value.trim())) {
        stop.color = ev.target.value.trim();
        renderGradientEditorUI();
        applyActiveGradientToSelection(false, true);
      }
    });

    $('btnReverseGrad').addEventListener('click', () => {
      state.paint.gradStops.forEach((s) => { s.pos = 100 - s.pos; });
      renderGradientEditorUI();
      applyActiveGradientToSelection(false, true);
    });

    $('btnRemoveGradStop').addEventListener('click', () => {
      if (state.paint.gradStops.length <= 2) return;
      state.paint.gradStops.splice(state.paint.selectedStopIdx, 1);
      state.paint.selectedStopIdx = 0;
      renderGradientEditorUI();
      applyActiveGradientToSelection(false, true);
    });
  }

  // =========================================================================
  // 5. SEARCHABLE GOOGLE FONTS PICKER
  // =========================================================================
  function renderGoogleFontOptions(filterText = '') {
    const listEl = $('fontOptionsList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const q = filterText.trim().toLowerCase();
    const curFont = state.selection.props?.fontFamily || 'Inherit';

    const matches = GOOGLE_FONTS.filter((f) => !q || f.toLowerCase().includes(q));
    if (q && !GOOGLE_FONTS.some((f) => f.toLowerCase() === q)) {
      const customFamily = filterText.trim();
      matches.unshift(customFamily);
    }

    for (const fam of matches) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dd-opt' + (fam.toLowerCase() === curFont.toLowerCase() ? ' active' : '');
      btn.textContent = fam === 'Inherit' ? 'Inherit / Default' : fam;
      btn.addEventListener('click', () => {
        closeAllDropdowns();
        $('ddGoogleFontLabel').textContent = fam === 'Inherit' ? 'Inherit / Default' : fam;
        if (fam === 'Inherit') {
          postToBridge('patch_style', { props: { fontFamily: null }, commitScrub: true });
        } else {
          // Load preview font in studio shell too + apply inside iframe and record for <link> HTML save!
          postToBridge('patch_style', {
            googleFont: fam,
            props: { fontFamily: `'${fam}', sans-serif` },
            commitScrub: true
          });
        }
      });
      listEl.appendChild(btn);
    }
  }

  // =========================================================================
  // 6. SAVING, AUTOMATIC HTML/CSS/JS SYNC & CLICKABLE ORIGINAL BUTTON
  // =========================================================================
  function requestSavePayloadFromBridge(timeoutMs = 3500) {
    const reqId = `save_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingSaveResolvers.delete(reqId);
        reject(new Error('Timed out waiting for iframe save payload'));
      }, timeoutMs);
      pendingSaveResolvers.set(reqId, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
      postToBridge('request_save_payload', { requestId: reqId });
    });
  }

  async function syncCanvasToProjectFiles({ autoSyncOnly = false, markBaseline = false } = {}) {
    const codeSync = window.VectoraCodeSync;
    if (!codeSync) return null;

    let payload = null;
    try {
      payload = await requestSavePayloadFromBridge(2500);
    } catch (_) {
      payload = null;
    }

    const enrichedPayload = payload
      ? {
          ...payload,
          preset: state.activePreset,
          primaryColor: $('inpPrimaryColor').value,
          secondaryColor: $('inpSecondaryColor').value
        }
      : null;

    const synced = enrichedPayload
      ? codeSync.applyCanvasPayloadToProject({
          entry: state.entry,
          filesMap: state.projectFiles,
          originFilesMap: state.originFiles,
          payload: enrichedPayload,
          projectMeta: { artboard: { width: state.artboardWidth, height: state.artboardHeight } }
        })
      : { filesMap: { ...state.projectFiles }, modifiedFiles: Object.keys(state.codeEditedFiles || {}), hasChanges: false };

    state.projectFiles = synced.filesMap;
    rebuildFileListsFromMap(state.projectFiles);
    renderCodeEditorUI(false);

    if (state.hasServerBackend && !state.vfsMode) {
      const resp = await fetch('/__vc_api/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: state.entry,
          autoSyncOnly,
          payload: enrichedPayload,
          files: state.projectFiles,
          codeEditedFiles: state.codeEditedFiles,
          projectMeta: { artboard: { width: state.artboardWidth, height: state.artboardHeight } }
        })
      });
      const json = await resp.json();
      if (json && json.ok && json.contents) {
        state.projectFiles = json.contents;
        rebuildFileListsFromMap(state.projectFiles);
        renderCodeEditorUI(false);
      }
    } else {
      persistStandaloneVfsToStorage();
      await writeFilesToDirHandle(synced.modifiedFiles);
    }

    if ($('codeSyncBadge')) {
      $('codeSyncBadge').textContent = 'Synced · HTML/CSS/JS';
    }

    if (markBaseline) {
      state.codeEditedFiles = {};
      postToBridge('mark_saved_baseline');
      const origBtn = $('btnOriginal');
      origBtn.classList.remove('dirty');
      origBtn.classList.add('active');
      $('autoSaveLabel').classList.remove('unsaved');
      $('autoSaveLabel').textContent = 'Saved';
      setTimeout(() => {
        $('autoSaveLabel').textContent = 'Auto Save';
      }, 1400);
    }

    return synced;
  }

  function scheduleAutoCodeSync() {
    clearTimeout(autoCodeSyncTimer);
    autoCodeSyncTimer = setTimeout(() => {
      syncCanvasToProjectFiles({ autoSyncOnly: true, markBaseline: false }).catch(() => {});
    }, 180);
  }

  function scheduleAutoSaveIfEnabled() {
    if (!state.preferences.autoSave) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      triggerDirectHtmlSave();
    }, 650);
  }

  async function triggerDirectHtmlSave(showSavedToast = false) {
    const saveBtn = $('btnSave');
    saveBtn.disabled = true;
    try {
      await syncCanvasToProjectFiles({ autoSyncOnly: false, markBaseline: true });
      if (showSavedToast) {
        showToast(`Saved project (${state.allFiles.length} file${state.allFiles.length === 1 ? '' : 's'})`);
      }
    } catch (err) {
      console.error('[Vectora Canvas] Save error:', err);
    } finally {
      saveBtn.disabled = false;
    }
  }

  function updateHistoryAndOriginalButtons(undoCount, redoCount, dirty) {
    $('undoCount').textContent = String(undoCount);
    $('redoCount').textContent = String(redoCount);
    $('btnUndo').disabled = undoCount === 0;
    $('btnRedo').disabled = redoCount === 0;

    if (undoCount > 0 || redoCount > 0 || dirty) {
      state.everEditedInSession = true;
    }

    const origBtn = $('btnOriginal');
    origBtn.classList.toggle('dirty', Boolean(dirty));
    origBtn.classList.toggle('active', !dirty);

    const autoLbl = $('autoSaveLabel');
    autoLbl.classList.toggle('unsaved', Boolean(dirty) && !state.preferences.autoSave);
    autoLbl.title = state.preferences.autoSave
      ? 'Auto Save enabled in Preferences'
      : (dirty ? 'Canvas synced to code — click Save to commit baseline' : 'All changes match Saved / Original state');

    // Automatically keep HTML, CSS, and JavaScript synced with canvas changes!
    if (state.everEditedInSession) {
      scheduleAutoCodeSync();
    }

    if (dirty && state.preferences.autoSave) {
      scheduleAutoSaveIfEnabled();
    }
  }

  // =========================================================================
  // 7. SESSIONS, LAYERS (WITH LOCKING & UNLOCK ALL), DOM TREE & INSPECTOR SYNC
  // =========================================================================
  function renderSessionsAndLayers() {
    $('allSectionBadge').textContent = String(state.sessions.length);

    const secList = $('sectionList');
    secList.innerHTML = '';
    for (const s of state.sessions) {
      const isSel = state.selection.selectedIds.includes(s.vcId);
      const row = document.createElement('div');
      row.className = 'layer-item' + (isSel ? ' selected' : '') + (s.locked ? ' locked-row' : '');
      row.innerHTML = `
        <span class="layer-main">
          ${SVG_ICONS.session}
          <span>${escapeHtml(s.name)}</span>
        </span>
        <span class="inline-actions">
          <span class="layer-badge">${escapeHtml(s.kind === 'tab-session' ? 'tab' : s.tag)}</span>
          <button type="button" class="lock-toggle-btn ${s.locked ? 'is-locked' : ''}" title="${s.locked ? 'Unlock (Ctrl+Alt+2)' : 'Lock (Ctrl+2)'}">
            ${s.locked ? SVG_ICONS.lockClosed : SVG_ICONS.lockOpen}
          </button>
        </span>
      `;
      row.addEventListener('click', () => {
        postToBridge('select_session', { sessionId: s.sessionId });
      });
      row.querySelector('.lock-toggle-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        postToBridge('toggle_entity_lock', { id: s.vcId });
      });
      secList.appendChild(row);
    }

    const layList = $('layerList');
    layList.innerHTML = '';
    for (const l of state.layers) {
      const isLockedTarget = state.selection.lockedSelectedId === l.id;
      const row = document.createElement('div');
      row.className = 'layer-item' + ((l.selected || isLockedTarget) ? ' selected' : '') + (l.locked ? ' locked-row' : '');
      row.style.paddingLeft = `${6 + (l.depth || 0) * 12}px`;
      row.innerHTML = `
        <span class="layer-main">
          ${l.isGroup ? SVG_ICONS.group : SVG_ICONS.layer}
          <span>${escapeHtml(l.name)}</span>
          <span class="layer-tag">${escapeHtml(l.isGroup ? `(${l.memberCount})` : l.tag)}</span>
        </span>
        <button type="button" class="lock-toggle-btn ${l.locked ? 'is-locked' : ''}" title="${l.locked ? 'Locked — click or press Ctrl+Alt+2 to unlock' : 'Click to lock (Ctrl+2)'}">
          ${l.locked ? SVG_ICONS.lockClosed : SVG_ICONS.lockOpen}
        </button>
      `;
      row.addEventListener('click', (ev) => {
        postToBridge('select_layer', { id: l.id, additive: ev.shiftKey });
      });
      row.querySelector('.lock-toggle-btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        postToBridge('toggle_entity_lock', { id: l.id });
      });
      layList.appendChild(row);
    }

    if (!layList.hidden) {
      const selLayerRow = layList.querySelector('.layer-item.selected');
      if (selLayerRow && typeof selLayerRow.scrollIntoView === 'function') {
        try { selLayerRow.scrollIntoView({ block: 'nearest' }); } catch (_) {}
      }
    }
    if (!$('sectionList').hidden) {
      const selSecRow = secList.querySelector('.layer-item.selected');
      if (selSecRow && typeof selSecRow.scrollIntoView === 'function') {
        try { selSecRow.scrollIntoView({ block: 'nearest' }); } catch (_) {}
      }
    }

    // DOM Tab (Airship live hierarchy)
    const domEl = $('domTreeList');
    if (domEl && !$('paneDom').hidden) {
      renderDomTab();
    }

    // Links Tab (All page & button links in separate scrollable cards)
    if ($('paneLinks') && !$('paneLinks').hidden) {
      renderLinksTab();
    }
    if ($('linksCountBadge')) {
      $('linksCountBadge').textContent = String((state.links || []).length);
    }
  }

  function syncIsolationBarUI() {
    const bar = $('isolationBar');
    if (!bar) return;
    const active = Boolean(state.isolation && state.isolation.active && Array.isArray(state.isolation.stack) && state.isolation.stack.length);
    bar.hidden = !active;
    if (active && $('isolationBreadcrumb')) {
      const trail = state.isolation.stack.map((s) => s.name || 'Group').join(' ▸ ');
      $('isolationBreadcrumb').textContent = `Artboard ▸ ${trail}`;
    }
  }

  function renderLinksTab() {
    const listEl = $('linksList');
    if (!listEl) return;

    // Populate datalist with project HTML pages for quick autocomplete
    const dl = $('vcProjectPagesDatalist');
    if (dl) {
      dl.innerHTML = '';
      for (const pageFile of state.htmlFiles || []) {
        const opt = document.createElement('option');
        opt.value = pageFile;
        dl.appendChild(opt);
      }
    }

    const links = Array.isArray(state.links) ? state.links : [];
    if ($('linksCountBadge')) {
      $('linksCountBadge').textContent = String(links.length);
    }

    // Sync top "Link Selected" binder box with active selection
    const selProps = state.selection?.props;
    const selTargetLbl = $('linkSelectedTargetLabel');
    const selUrlInp = $('inpSelectedLinkUrl');
    if (selTargetLbl) {
      if (selProps) {
        selTargetLbl.textContent = `${selProps.tag}${selProps.id ? '#' + selProps.id : ''} · ${state.selection.summary || 'Selected'}`;
      } else {
        selTargetLbl.textContent = 'Select a button, text, object, or group on the artboard';
      }
    }
    if (selUrlInp && document.activeElement !== selUrlInp) {
      selUrlInp.value = selProps?.linkInfo?.url || '';
    }

    listEl.innerHTML = '';
    if (!links.length) {
      listEl.innerHTML = '<div class="empty-note">No links detected yet. Select any button, text, box, or group on the artboard and assign a page or URL above.</div>';
      return;
    }

    for (const item of links) {
      const card = document.createElement('div');
      card.className = 'link-card' + (item.selected ? ' is-selected' : '');
      card.setAttribute('data-link-vcid', item.vcId);
      card.innerHTML = `
        <div class="lc-head" title="Click to select & highlight this element/group on the artboard">
          <span class="lc-title-wrap">
            <span class="lc-tag-pill">${escapeHtml(item.tag)}</span>
            <span class="lc-label">${escapeHtml(item.label)}</span>
          </span>
          ${item.groupName ? `<span class="lc-group-badge" title="Group / Section: ${escapeHtml(item.groupName)}">${escapeHtml(item.groupName)}</span>` : ''}
        </div>
        <div class="lc-sub" title="Click to select on artboard">${escapeHtml(item.selector || item.tag)}</div>
        <div class="lc-edit-row">
          <input type="text" class="prop-input lc-url-input" list="vcProjectPagesDatalist" value="${escapeHtml(item.url || '')}" placeholder="about.html, #section, https://…">
          <button type="button" class="mini-btn accent lc-save-btn" title="Update link URL">Apply</button>
        </div>
      `;

      const focusOnCanvas = () => {
        postToBridge('focus_link_target', { vcId: item.vcId, selectGroup: true });
      };
      card.querySelector('.lc-head').addEventListener('click', focusOnCanvas);
      card.querySelector('.lc-sub').addEventListener('click', focusOnCanvas);

      const urlInp = card.querySelector('.lc-url-input');
      const applyBtn = card.querySelector('.lc-save-btn');
      const commitCardLink = () => {
        const nextUrl = urlInp.value.trim();
        state.everEditedInSession = true;
        postToBridge('set_element_link', { vcId: item.vcId, url: nextUrl });
        scheduleAutoCodeSync();
        showToast(nextUrl ? `Updated link → ${nextUrl}` : 'Removed link');
      };
      applyBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        commitCardLink();
      });
      urlInp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          commitCardLink();
          urlInp.blur();
        }
      });
      urlInp.addEventListener('change', () => {
        if (urlInp.value.trim() !== String(item.url || '').trim()) {
          commitCardLink();
        }
      });

      listEl.appendChild(card);
    }

    const selCard = listEl.querySelector('.link-card.is-selected');
    if (selCard && typeof selCard.scrollIntoView === 'function' && !listEl.contains(document.activeElement)) {
      try { selCard.scrollIntoView({ block: 'nearest' }); } catch (_) {}
    }
  }

  function renderDomTab() {
    const domEl = $('domTreeList');
    if (!domEl) return;
    domEl.innerHTML = '';
    for (const d of state.domTree) {
      const row = document.createElement('div');
      row.className = 'layer-item' + (d.selected ? ' selected' : '') + (d.locked ? ' locked-row' : '');
      row.style.paddingLeft = `${6 + Math.min(5, d.depth) * 10}px`;
      const desc = `${d.tag}${d.idAttr ? '#' + d.idAttr : ''}${d.cls ? '.' + d.cls : ''}`;
      row.innerHTML = `<span class="layer-main"><span class="layer-tag">&lt;${escapeHtml(desc)}&gt;</span></span>`;
      row.addEventListener('click', (ev) => {
        postToBridge('select_layer', { id: d.vcId, additive: ev.shiftKey });
      });
      domEl.appendChild(row);
    }
  }

  function updateCornerArcPreview(roundPct) {
    const pct = Math.min(100, Math.max(0, Math.round(Number(roundPct) || 0)));
    const arcEl = $('cornerArcPath');
    const dotEl = $('cornerArcDot');
    if (arcEl) {
      if (pct <= 0) {
        arcEl.setAttribute('d', 'M3 13L3 3L13 3');
      } else {
        const r = (0.6 + (pct / 100) * 8.4).toFixed(1);
        const startEnd = (3 + parseFloat(r)).toFixed(1);
        arcEl.setAttribute('d', `M3 13L3 ${startEnd}A${r} ${r} 0 0 1 ${startEnd} 3L13 3`);
      }
    }
    if (dotEl) {
      const d = (6.8 + (pct / 100) * 3.0).toFixed(1);
      dotEl.setAttribute('cx', d);
      dotEl.setAttribute('cy', d);
    }
  }

  function syncTopCornerControlBar(liveOverride = null) {
    const bar = $('cornerControlBar');
    if (!bar) return;
    const sel = state.selection || { count: 0, props: null };
    const p = sel.props;
    const isShapeTool = state.tool === 'shape';
    const isLineShape =
      (isShapeTool && state.shapeKind === 'line' && sel.count === 0) ||
      (p && p.shapeKind === 'line');

    const showBar = !isLineShape && (isShapeTool || (sel.count > 0 && Boolean(p)));
    bar.hidden = !showBar;
    if (!showBar) return;

    let radPx = 0;
    let maxRad = 120;
    let roundPct = 0;
    let displayTxt = '0 px';

    if (liveOverride) {
      radPx = Math.max(0, Math.round(Number(liveOverride.radius) || 0));
      maxRad = Math.max(12, Math.round(Number(liveOverride.maxRadius) || 120));
      roundPct = Math.min(100, Math.max(0, Math.round(Number(liveOverride.roundPct) || 0)));
      displayTxt = `${radPx} px`;
      if (liveOverride.shapeKind && isShapeTool) {
        state.shapeKind = liveOverride.shapeKind;
        document.querySelectorAll('#shapeSubbar .shape-opt').forEach((x) => {
          x.classList.toggle('active', x.getAttribute('data-shape') === state.shapeKind);
        });
      }
    } else if (sel.count > 0 && p) {
      radPx = Math.max(0, Math.round(Number(p.radius) || 0));
      maxRad = Math.max(12, Math.round(Number(p.maxRadius) || Math.min(p.w || 120, p.h || 120) / 2 || 120));
      roundPct = p.roundPct !== undefined
        ? Math.min(100, Math.max(0, Math.round(p.roundPct)))
        : Math.min(100, Math.round((radPx / Math.max(1, maxRad)) * 100));
      displayTxt = p.radiusCss === '50%' ? `50% (${radPx}px)` : `${radPx} px`;
      if (p.shapeKind && isShapeTool) {
        state.shapeKind = p.shapeKind;
        document.querySelectorAll('#shapeSubbar .shape-opt').forEach((x) => {
          x.classList.toggle('active', x.getAttribute('data-shape') === state.shapeKind);
        });
      }
    } else {
      // No selection, Shape Tool active — show default radius for the chosen shape kind
      maxRad = 120;
      if (state.shapeKind === 'rect') {
        radPx = 0;
        roundPct = 0;
        displayTxt = '0 px';
      } else if (state.shapeKind === 'rounded') {
        radPx = Math.max(1, state.shapeRadius || 16);
        roundPct = Math.min(100, Math.round((radPx / 60) * 100));
        displayTxt = `${radPx} px`;
      } else if (state.shapeKind === 'ellipse') {
        radPx = 60;
        roundPct = 100;
        displayTxt = '50%';
      } else if (state.shapeKind === 'pill') {
        radPx = 120;
        roundPct = 100;
        displayTxt = '999 px';
      }
    }

    const slider = $('topCornerSlider');
    if (slider) {
      slider.max = String(Math.max(24, Math.min(400, maxRad)));
      if (document.activeElement !== slider) {
        slider.value = String(Math.min(Number(slider.max), radPx));
      }
    }
    const pxIn = $('topCornerInput');
    if (pxIn && document.activeElement !== pxIn) {
      pxIn.value = displayTxt;
    }
    const pctBadge = $('topCornerRoundBadge');
    if (pctBadge) {
      pctBadge.textContent = `${roundPct}%`;
    }
    updateCornerArcPreview(roundPct);
  }

  function populateInspectorFromSelection() {
    const sel = state.selection;
    $('selectionSummary').textContent = sel.summary || `${state.artboardWidth} × ${state.artboardHeight} Artboard`;
    syncTopCornerControlBar();

    const p = sel.props;
    if (!p) {
      $('cssSelectorLabel').textContent = 'No element selected';
      $('rawInlineCss').value = '';
      return;
    }

    if (p.w > 0 && p.h > 0) {
      state.aspectRatio = p.w / p.h;
    }

    const setIfIdle = (id, val) => {
      const el = $(id);
      if (el && document.activeElement !== el) el.value = val;
    };

    setIfIdle('propX', `${p.x}px`);
    setIfIdle('propY', `${p.y}px`);
    setIfIdle('propW', `${p.w}px`);
    setIfIdle('propH', `${p.h}px`);
    setIfIdle('propRotate', `${p.rotate}deg`);
    setIfIdle('propScalePct', '100%');

    setIfIdle('propPadding', `${p.padding}px`);
    setIfIdle('propMargin', `${p.margin}px`);
    setIfIdle('propFlexGap', `${p.gap}px`);
    setIfIdle('propRadius', `${p.radius}px`);
    $('ddDisplayLabel').textContent = p.display || 'auto';
    setIfIdle('propZIndex', p.zIndex || '');
    setIfIdle('propOpacity', `${p.opacity}%`);

    state.paint.fillMode = p.fillMode || 'solid';
    if (p.fillColor) state.paint.fillColor = p.fillColor;
    state.paint.strokeWidth = p.strokeWidth || 0;
    state.paint.strokeStyle = p.strokeStyle || 'solid';
    if (p.strokeColor) state.paint.strokeColor = p.strokeColor;
    state.paint.strokeMode = p.strokeMode || (p.strokeWidth > 0 ? 'solid' : 'none');

    setIfIdle('propBorderWidth', `${p.strokeWidth}px`);
    $('ddStrokeStyleLabel').textContent = p.strokeStyle || 'solid';
    syncPaintProxiesUI();

    $('ddGoogleFontLabel').textContent = p.fontFamily || 'Inherit / Default';
    setIfIdle('propFontSize', `${p.fontSize}px`);
    $('ddFontWeightLabel').textContent = p.fontWeight || '400';
    setIfIdle('propLineHeight', String(p.lineHeight));
    setIfIdle('propLetterSpacing', `${p.letterSpacing}px`);
    setIfIdle('propColor', p.color);
    if (/^#[0-9a-f]{6}$/i.test(p.color)) $('propColorPicker').value = p.color;
    setIfIdle('propText', p.text || '');

    document.querySelectorAll('#textAlignGroup button').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-talign') === p.textAlign);
    });

    // Airship CSS Box Model tab
    if (p.boxModel) {
      $('bmMarT').textContent = p.boxModel.mt;
      $('bmMarR').textContent = p.boxModel.mr;
      $('bmMarB').textContent = p.boxModel.mb;
      $('bmMarL').textContent = p.boxModel.ml;
      $('bmPadT').textContent = p.boxModel.pt;
      $('bmPadR').textContent = p.boxModel.pr;
      $('bmPadB').textContent = p.boxModel.pb;
      $('bmPadL').textContent = p.boxModel.pl;
      $('bmContent').textContent = `${p.boxModel.cw} × ${p.boxModel.ch}`;
    }
    $('cssSelectorLabel').textContent = p.selector || p.tag;
    setIfIdle('rawInlineCss', p.inlineStyle ? p.inlineStyle.replace(/;\s*/g, ';\n').trim() : '');
  }

  // =========================================================================
  // 8. RIGHT-CLICK CONTEXT MENU & MULTI-SELECTION SCALE MODE SYNC
  // =========================================================================
  function syncScaleModeUI() {
    const inPlace = state.preferences.multiScaleMode !== 'normal';
    $('btnScaleModeToggle').textContent = inPlace ? 'Scale in Place' : 'Scale Normally';
    $('btnScaleModeToggle').classList.toggle('active', true);

    const chkIn = $('chkMarkInPlace')?.querySelector('svg');
    const chkNorm = $('chkMarkNormal')?.querySelector('svg');
    if (chkIn) chkIn.hidden = !inPlace;
    if (chkNorm) chkNorm.hidden = inPlace;

    $('prefBtnScaleInPlace').classList.toggle('active', inPlace);
    $('prefBtnScaleNormal').classList.toggle('active', !inPlace);

    postToBridge('set_prefs', { prefs: state.preferences });
  }

  function setMultiScaleMode(modeName) {
    state.preferences.multiScaleMode = modeName === 'normal' ? 'normal' : 'in-place';
    syncScaleModeUI();
    persistPreferences();
  }

  function showContextMenuAt(studioX, studioY, info = {}) {
    const menu = $('vcContextMenu');
    if (!menu) return;
    menu.hidden = false;

    const multi = (info.selectionCount || state.selection.count) > 1;
    $('ctxScaleSep').hidden = false;
    $('ctxScaleInPlace').style.opacity = multi ? '1' : '0.75';
    $('ctxScaleNormal').style.opacity = multi ? '1' : '0.75';

    const mw = menu.offsetWidth || 230;
    const mh = menu.offsetHeight || 340;
    const x = Math.min(window.innerWidth - mw - 8, Math.max(8, studioX));
    const y = Math.min(window.innerHeight - mh - 8, Math.max(8, studioY));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  function hideContextMenu() {
    const menu = $('vcContextMenu');
    if (menu) menu.hidden = true;
  }

  function handleContextAction(act) {
    hideContextMenu();
    switch (act) {
      case 'copy': postToBridge('clipboard', { action: 'copy' }); break;
      case 'cut': postToBridge('clipboard', { action: 'cut' }); break;
      case 'paste': postToBridge('clipboard', { action: 'paste' }); break;
      case 'duplicate': postToBridge('clipboard', { action: 'duplicate' }); break;
      case 'delete': postToBridge('clipboard', { action: 'delete' }); break;
      case 'group': postToBridge('group'); break;
      case 'ungroup': postToBridge('ungroup'); break;
      case 'toggle-lock': postToBridge('toggle_entity_lock', {}); break;
      case 'unlock-item': postToBridge('unlock_item', {}); break;
      case 'convert-div': postToBridge('convert_to_div'); break;
      case 'bring-front': postToBridge('arrange', { action: 'bring-front' }); break;
      case 'bring-forward': postToBridge('arrange', { action: 'bring-forward' }); break;
      case 'send-backward': postToBridge('arrange', { action: 'send-backward' }); break;
      case 'send-back': postToBridge('arrange', { action: 'send-back' }); break;
      case 'scale-in-place': setMultiScaleMode('in-place'); break;
      case 'scale-normal': setMultiScaleMode('normal'); break;
    }
  }

  // =========================================================================
  // 9. AGENT NOTES (OUTSIDE HTML DESIGN) & PREFERENCES PERSISTENCE
  // =========================================================================
  function getNotesForCurrentEntry() {
    return (state.notes || []).filter((n) => !n.entry || n.entry === state.entry);
  }

  function formatSingleNoteForAgent(n, idxFallback = 1) {
    const mr = n.markRect || {};
    const num = n.number || idxFallback;
    const areaLine = typeof mr.x === 'number'
      ? `x: ${mr.x}px, y: ${mr.y}px, width: ${mr.w}px, height: ${mr.h}px (Artboard ${mr.artboardW || state.artboardWidth}×${mr.artboardH || state.artboardHeight})`
      : 'Selected Element / Page';
    const lines = [
      `### Note #${num} [${String(n.taskType || 'fix').toUpperCase()}] — Page: \`${n.entry || state.entry || 'index.html'}\``,
      `- **Marked Area**: ${areaLine}`
    ];
    if (n.sectionLabel) lines.push(`- **Section**: \`${n.sectionLabel}\``);
    if (n.selector) lines.push(`- **Primary Target**: \`${n.selector}\` (<${n.elementTag || 'div'}>)`);
    if (Array.isArray(n.enclosedElements) && n.enclosedElements.length > 0) {
      const items = n.enclosedElements
        .map((e) => `\`${e.selector}\`${e.text ? ` ("${e.text.slice(0, 42)}")` : ''}`)
        .join(', ');
      lines.push(`- **Elements Inside Marked Area**: ${items}`);
    }
    if (n.htmlSnippet) lines.push(`- **HTML Context**: \`${n.htmlSnippet}\``);
    lines.push(`- **Instruction**: ${n.text || '(pending)'}`);
    return lines.join('\n');
  }

  function formatAllNotesForCodingAgent(notesList) {
    const arr = Array.isArray(notesList) ? notesList : [];
    if (!arr.length) return 'No open notes.';
    const header = [
      `# Vectora Canvas — Marked UI Notes for Coding Agent`,
      `Project: ${state.projectName || 'Workspace'}${state.targetPath ? ` (${state.targetPath})` : ''}`,
      ``
    ];
    return [...header, ...arr.map((n, idx) => formatSingleNoteForAgent(n, idx + 1))].join('\n\n');
  }

  async function copyTextToClipboardSafe(text) {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch (_) {
      return false;
    }
  }

  function renderNotesUI() {
    const cnt = state.notes.length;
    $('topNoteCount').textContent = String(cnt);
    $('drawerNoteCount').textContent = String(cnt);

    const list = $('notesDrawerList');
    list.innerHTML = '';
    if (!cnt) {
      list.innerHTML = '<div class="empty-note">Select Note tool (N) and drag on any UI area — or click + New — to attach Coding Agent instructions outside HTML.</div>';
    } else {
      for (const n of state.notes) {
        const mr = n.markRect || {};
        const coordsLabel = typeof mr.x === 'number'
          ? `Marked: X:${mr.x}, Y:${mr.y} · ${mr.w}×${mr.h}px${Array.isArray(n.enclosedElements) && n.enclosedElements.length ? ` · ${n.enclosedElements.length} el` : ''}`
          : '';
        const card = document.createElement('div');
        card.className = 'nd-card' + (state.editingNote && state.editingNote.id === n.id ? ' active' : '');
        card.innerHTML = `
          <div class="nd-card-top">
            <span>#${escapeHtml(n.number)} · ${escapeHtml((n.taskType || 'fix').toUpperCase())}</span>
            <span>${escapeHtml(n.entry || 'index.html')}</span>
          </div>
          <div class="nd-card-sel">${escapeHtml(n.sectionLabel ? `${n.sectionLabel} · ${n.selector || 'region'}` : (n.selector || 'region'))}</div>
          ${coordsLabel ? `<div class="nd-card-coords">${escapeHtml(coordsLabel)}</div>` : ''}
          <div>${escapeHtml(n.text)}</div>
        `;
        card.addEventListener('mouseenter', () => {
          if (!n.entry || n.entry === state.entry) {
            postToBridge('focus_note_mark', { id: n.id });
          }
        });
        card.addEventListener('click', () => {
          if (n.entry && n.entry !== state.entry && state.htmlFiles.includes(n.entry)) {
            loadEntryIntoIframe(n.entry);
            setTimeout(() => {
              postToBridge('focus_note_mark', { id: n.id, markRect: n.markRect });
              openNotePopup(n);
            }, 300);
            return;
          }
          postToBridge('focus_note_mark', { id: n.id, markRect: n.markRect });
          openNotePopup(n);
        });
        list.appendChild(card);
      }
    }
    postToBridge('set_notes', {
      notes: getNotesForCurrentEntry(),
      clearPending: !$('notePopup') || $('notePopup').hidden,
      activeNoteId: state.editingNote?.id || null
    });
  }

  function closeNotePopup() {
    state.editingNote = null;
    $('notePopup').hidden = true;
    postToBridge('clear_pending_note_mark', { clearHighlight: true });
    renderNotesUI();
  }

  function openNotePopup(noteObj) {
    state.editingNote = noteObj;
    state.noteTaskType = noteObj.taskType || 'fix';
    const secPrefix = noteObj.sectionLabel ? `${noteObj.sectionLabel} ▸ ` : '';
    $('notePopupTarget').textContent = `Target: ${secPrefix}${noteObj.selector || noteObj.elementTag || 'Marked Region'}`;
    const mr = noteObj.markRect;
    const encCount = Array.isArray(noteObj.enclosedElements) ? noteObj.enclosedElements.length : 0;
    if ($('notePopupCoords')) {
      $('notePopupCoords').textContent = mr && typeof mr.x === 'number'
        ? `Marked Area: X:${mr.x}, Y:${mr.y} · ${mr.w} × ${mr.h} px${encCount ? ` · ${encCount} item${encCount === 1 ? '' : 's'}` : ''}`
        : 'Marked Area: Selected Element';
    }
    $('notePopupInput').value = noteObj.text || '';
    $('btnDeleteNote').hidden = !noteObj.id;
    document.querySelectorAll('#noteTypeGroup .np-type').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-ntype') === state.noteTaskType);
    });
    if (noteObj.id) {
      postToBridge('focus_note_mark', { id: noteObj.id });
    }
    $('notePopup').hidden = false;
    $('notePopupInput').focus();
  }

  function loadStandaloneNotesFromStorage() {
    try {
      const raw = localStorage.getItem(LS_STANDALONE_NOTES);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function persistStandaloneNotesToStorage() {
    try {
      localStorage.setItem(LS_STANDALONE_NOTES, JSON.stringify(state.notes || []));
    } catch (_) {}
  }

  async function saveActiveNote() {
    const txt = $('notePopupInput').value.trim();
    if (!txt || !state.editingNote) {
      closeNotePopup();
      return;
    }
    // Always ensure Note regions & pins are visible on the artboard after saving a note!
    if (!state.showNotes) {
      state.showNotes = true;
      if ($('chkShowNotes')) $('chkShowNotes').checked = true;
      postToBridge('set_prefs', { showNotes: true });
    }

    let savedNum = state.editingNote.number || (state.notes.length + 1);
    if (state.hasServerBackend && !state.vfsMode) {
      const resp = await fetch('/__vc_api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          note: {
            ...state.editingNote,
            entry: state.editingNote.entry || state.entry,
            taskType: state.noteTaskType,
            text: txt
          }
        })
      });
      const json = await resp.json();
      if (json && Array.isArray(json.notes)) {
        state.notes = json.notes;
        savedNum = state.notes[state.notes.length - 1]?.number || savedNum;
      }
    } else {
      const existingIdx = state.editingNote.id
        ? state.notes.findIndex((n) => n.id === state.editingNote.id)
        : -1;
      if (existingIdx >= 0) {
        savedNum = state.notes[existingIdx].number;
        state.notes[existingIdx] = {
          ...state.notes[existingIdx],
          ...state.editingNote,
          entry: state.editingNote.entry || state.entry,
          taskType: state.noteTaskType,
          text: txt,
          updatedAt: new Date().toISOString()
        };
      } else {
        const nextNum = state.notes.reduce((m, n) => Math.max(m, Number(n.number) || 0), 0) + 1;
        savedNum = nextNum;
        state.notes.push({
          ...state.editingNote,
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          number: nextNum,
          entry: state.entry,
          taskType: state.noteTaskType,
          text: txt,
          createdAt: new Date().toISOString()
        });
      }
      persistStandaloneNotesToStorage();
    }
    state.editingNote = null;
    $('notePopup').hidden = true;
    postToBridge('clear_pending_note_mark', { clearHighlight: false });
    renderNotesUI();
    showToast(`Saved Note #${savedNum} + Marked Area for Coding Agent`);
  }

  async function persistPreferences() {
    try {
      localStorage.setItem(LS_STANDALONE_PREFS, JSON.stringify(state.preferences));
    } catch (_) {}
    if (!state.hasServerBackend) return;
    try {
      await fetch('/__vc_api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: state.preferences })
      });
    } catch (_) {}
  }

  // =========================================================================
  // 10. COMMAND PALETTE (CTRL+K)
  // =========================================================================
  const COMMANDS = [
    { label: 'Save Changes Directly to HTML (Ctrl+S)', run: () => triggerDirectHtmlSave() },
    { label: 'Publish — Open Full Page in New Tab', run: () => publishFullPageInNewTab() },
    { label: 'Export Project Archive / HTML', run: () => triggerProjectExportDownload() },
    { label: 'Revert to Saved / Original State', run: () => postToBridge('restore_original') },
    { label: 'Toggle Live / Edit Mode (Ctrl+E)', run: () => setWorkspaceMode(state.mode === 'edit' ? 'live' : 'edit') },
    { label: 'Selection Tool (V)', run: () => setActiveTool('select') },
    { label: 'Direct Selection Tool (A)', run: () => setActiveTool('direct') },
    { label: 'Free Transform & Scale Tool (E)', run: () => setActiveTool('transform') },
    { label: 'Shape Tool (R)', run: () => setActiveTool('shape') },
    { label: 'Flow Div Spacer Tool (D)', run: () => setActiveTool('div') },
    { label: 'Type Tool — Direct In-Group Text Edit (T)', run: () => setActiveTool('text') },
    { label: 'Eyedropper — Pick Fill, Gradient & Stroke (I)', run: () => setActiveTool('eyedropper') },
    { label: 'Unfill / No Paint on Active Fill or Stroke (/)', run: () => applyUnfillToActiveProxy() },
    { label: 'Exit Group Isolation Mode (Esc)', run: () => postToBridge('exit_isolation', { exitAll: false }) },
    { label: 'Open Links Inspector Tab (All Buttons & URLs)', run: () => switchInspectorTab('links') },
    { label: 'Compute Engine: Auto (GPU-First -> CPU Fallback)', run: () => setAccelerationPreference('auto') },
    { label: 'Convert Selected Shape/Box to Flow Div', run: () => postToBridge('convert_to_div') },
    { label: 'Group Selection (Ctrl+G)', run: () => postToBridge('group') },
    { label: 'Ungroup Selection (Ctrl+Alt+G)', run: () => postToBridge('ungroup') },
    { label: 'Unlock All Layers & Groups', run: () => postToBridge('unlock_all') },
    { label: 'Multi-Scale: Scale in Place (Default)', run: () => setMultiScaleMode('in-place') },
    { label: 'Multi-Scale: Scale Normally (Shared Anchor)', run: () => setMultiScaleMode('normal') },
    { label: 'Fit Artboard to Window (Shift+1)', run: () => fitArtboardToStage() },
    { label: 'Open Preferences', run: () => { $('prefsModal').hidden = false; } }
  ];

  function openCommandPalette() {
    const modal = $('cmdPaletteModal');
    const inp = $('cmdSearchInput');
    modal.hidden = false;
    inp.value = '';
    renderCommandList('');
    inp.focus();
  }

  function renderCommandList(query) {
    const list = $('cmdResultsList');
    list.innerHTML = '';
    const q = query.trim().toLowerCase();
    COMMANDS.filter((c) => !q || c.label.toLowerCase().includes(q)).forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmd-item';
      btn.innerHTML = `<span>${escapeHtml(c.label)}</span>`;
      btn.addEventListener('click', () => {
        $('cmdPaletteModal').hidden = true;
        c.run();
      });
      list.appendChild(btn);
    });
  }

  // =========================================================================
  // 11. MODE, TOOL SWITCHING & IFRAME LOADING
  // =========================================================================
  function syncHostCanvasCursor() {
    if (!canvasScroll) return;
    if (state.mode === 'live') {
      canvasScroll.setAttribute('data-vc-tool', 'live');
      canvasScroll.classList.remove('pan-ready');
      return;
    }
    if (state.spaceHeld || state.tool === 'hand') {
      canvasScroll.setAttribute('data-vc-tool', 'hand');
      canvasScroll.classList.add('pan-ready');
      return;
    }
    canvasScroll.classList.remove('pan-ready');
    if (state.ctrlHeld && state.tool !== 'select' && state.tool !== 'direct') {
      canvasScroll.setAttribute('data-vc-tool', state.lastSelectionTool || 'select');
      return;
    }
    if (state.tool === 'zoom' && state.altHeld) {
      canvasScroll.setAttribute('data-vc-tool', 'zoom-out');
      return;
    }
    canvasScroll.setAttribute('data-vc-tool', state.tool || 'select');
  }

  function setWorkspaceMode(nextMode) {
    state.mode = nextMode === 'live' ? 'live' : 'edit';
    $('btnModeLive').classList.toggle('active', state.mode === 'live');
    $('btnModeEdit').classList.toggle('active', state.mode === 'edit');
    $('workspaceRoot').classList.toggle('live-mode', state.mode === 'live');
    syncHostCanvasCursor();
    postToBridge('set_mode', { mode: state.mode });
    setTimeout(updateMinimap, 60);
  }

  function setActiveTool(toolName) {
    state.tool = toolName;
    if (toolName === 'select' || toolName === 'direct') {
      state.lastSelectionTool = toolName;
    }
    document.querySelectorAll('#aiToolbar .ai-tool').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tool') === toolName);
    });
    $('activeToolBadge').textContent = TOOL_NAMES[toolName] || toolName;
    $('shapeSubbar').hidden = toolName !== 'shape';
    syncTopCornerControlBar();
    syncHostCanvasCursor();
    postToBridge('set_tool', { tool: toolName, shapeKind: state.shapeKind, shapeRadius: state.shapeRadius });
  }

  function switchInspectorTab(target) {
    document.querySelectorAll('.insp-tabs .insp-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-itab') === target);
    });
    if ($('paneEdit')) $('paneEdit').hidden = target !== 'edit';
    if ($('paneCode')) $('paneCode').hidden = target !== 'code';
    if ($('paneLinks')) $('paneLinks').hidden = target !== 'links';
    if ($('paneCss')) $('paneCss').hidden = target !== 'css';
    if ($('paneDom')) $('paneDom').hidden = target !== 'dom';
    if (target === 'dom') renderDomTab();
    if (target === 'code') renderCodeEditorUI(true);
    if (target === 'links') renderLinksTab();
  }

  function switchLeftTreeTab(treeName) {
    ['sections', 'layers', 'files'].forEach((k) => {
      const tabId = k === 'sections' ? 'tabTreeSections' : (k === 'layers' ? 'tabTreeLayers' : 'tabTreeFiles');
      const listId = k === 'sections' ? 'sectionList' : (k === 'layers' ? 'layerList' : 'fileTreeList');
      if ($(tabId)) $(tabId).classList.toggle('active', k === treeName);
      if ($(listId)) $(listId).hidden = k !== treeName;
    });
    if (treeName === 'files') renderFileTreeUI();
    if (treeName === 'layers') {
      const selLayerRow = $('layerList')?.querySelector('.layer-item.selected');
      if (selLayerRow && typeof selLayerRow.scrollIntoView === 'function') {
        try { selLayerRow.scrollIntoView({ block: 'nearest' }); } catch (_) {}
      }
    }
  }

  async function ensureFileContentLoaded(relPath) {
    if (!relPath) return '';
    if (state.projectFiles[relPath] !== undefined) return state.projectFiles[relPath];
    if (state.hasServerBackend && !state.vfsMode) {
      try {
        const res = await fetch(`/__vc_api/read-file?file=${encodeURIComponent(relPath)}`);
        const data = await res.json();
        if (data && data.ok && typeof data.content === 'string') {
          state.projectFiles[relPath] = data.content;
          if (state.originFiles[relPath] === undefined) state.originFiles[relPath] = data.content;
          return data.content;
        }
      } catch (_) {}
    }
    return '';
  }

  function renderFileTreeUI() {
    const list = $('fileTreeList');
    if (!list) return;
    list.innerHTML = '';
    const files = state.allFiles.length ? state.allFiles : [state.entry];
    for (const rel of files) {
      const ext = /\.css$/i.test(rel) ? 'CSS' : (/\.m?js$/i.test(rel) ? 'JS' : 'HTML');
      const isSelected = (ext === 'HTML' && rel === state.entry) || rel === state.activeCodeFile;
      const row = document.createElement('div');
      row.className = 'layer-item' + (isSelected ? ' selected' : '');
      row.innerHTML = `
        <span class="layer-main">
          ${SVG_ICONS.file}
          <span>${escapeHtml(rel)}</span>
        </span>
        <span class="file-ext-badge ${ext === 'HTML' ? 'ext-html' : ''}">${ext}</span>
      `;
      row.addEventListener('click', async () => {
        state.activeCodeFile = rel;
        await ensureFileContentLoaded(rel);
        if (ext === 'HTML') {
          loadEntryIntoIframe(rel, { keepCodeFile: true });
        } else {
          renderFileTreeUI();
          switchInspectorTab('code');
        }
      });
      list.appendChild(row);
    }
  }

  function renderCodeEditorUI(forceUpdate = false) {
    const lbl = $('ddCodeFileLabel');
    const area = $('projectCodeEditor');
    const meta = $('codeFileMeta');
    if (!lbl || !area) return;

    const targetFile = state.activeCodeFile || state.entry || 'index.html';
    state.activeCodeFile = targetFile;
    lbl.textContent = targetFile;

    const content = state.projectFiles[targetFile] ?? '';
    if (forceUpdate || document.activeElement !== area) {
      area.value = content;
      if (forceUpdate) {
        area.scrollTop = 0;
        area.scrollLeft = 0;
      }
    }
    if (meta) {
      const lines = content ? content.split(/\r?\n/).length : 0;
      meta.textContent = `${targetFile} · ${lines} line${lines === 1 ? '' : 's'}`;
    }
  }

  async function applyEditedProjectCode() {
    const area = $('projectCodeEditor');
    if (!area) return;
    const rel = state.activeCodeFile || state.entry || 'index.html';
    const nextCode = area.value;

    state.projectFiles[rel] = nextCode;
    state.originFiles[rel] = nextCode;
    state.codeEditedFiles[rel] = nextCode;
    state.everEditedInSession = true;

    if (state.hasServerBackend && !state.vfsMode) {
      try {
        await fetch('/__vc_api/save-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry: state.entry,
            autoSyncOnly: false,
            files: { [rel]: nextCode },
            codeEditedFiles: { [rel]: nextCode }
          })
        });
      } catch (_) {}
    } else {
      persistStandaloneVfsToStorage();
      await writeFilesToDirHandle([rel]);
    }

    renderCodeEditorUI(false);
    loadEntryIntoIframe(state.entry, { keepCodeFile: true });
    showToast(`Applied ${rel} to canvas`);
  }

  function loadEntryIntoIframe(entryRel, options = {}) {
    const codeSync = window.VectoraCodeSync;
    state.entry = codeSync ? codeSync.normalizeRelPath(entryRel || 'index.html') : String(entryRel || 'index.html').replace(/^\/+/, '');
    if (!state.entry) state.entry = 'index.html';
    $('ddPageLabel').textContent = state.entry;

    if (!options.keepCodeFile) {
      state.activeCodeFile = state.entry;
    }

    recordLocalRecentSession(state.entry, state.projectName, {
      target: state.targetPath,
      saveSnapshot: state.vfsMode || !state.hasServerBackend
    });

    renderFileTreeUI();
    renderCodeEditorUI(true);
    renderNotesUI();

    if (!state.hasServerBackend || state.vfsMode) {
      const compiled = codeSync
        ? codeSync.compileStandaloneHtml({
            entry: state.entry,
            filesMap: state.projectFiles,
            assetUrls: state.assetBlobUrls,
            studioBaseUrl: STUDIO_BASE_URL,
            includeBridge: true,
            bypassEnabled: state.bypassGates,
            accelMode: state.effectiveAccel
          })
        : (state.projectFiles[state.entry] || '<!doctype html><html><body></body></html>');

      const prevUrl = activePreviewBlobUrl;
      const blob = new Blob([compiled], { type: 'text/html;charset=utf-8' });
      activePreviewBlobUrl = URL.createObjectURL(blob);
      previewFrame.src = activePreviewBlobUrl;
      if (prevUrl) {
        setTimeout(() => {
          try { URL.revokeObjectURL(prevUrl); } catch (_) {}
        }, 1200);
      }
      return;
    }

    ensureFileContentLoaded(state.entry).then(() => renderCodeEditorUI(false));
    const clean = state.entry.replace(/^\/+/, '');
    previewFrame.src = `/__vc_target/${clean}?vc_ts=${Date.now()}`;
  }

  function closeFileDialog() {
    if ($('fileDialogModal')) $('fileDialogModal').hidden = true;
  }

  function openFileDialog(title, buildBodyFn) {
    const modal = $('fileDialogModal');
    const titleEl = $('fileDialogTitle');
    const bodyEl = $('fileDialogBody');
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = '';
    buildBodyFn(bodyEl);
    modal.hidden = false;
  }

  function revokeAssetBlobUrls() {
    for (const u of Object.values(state.assetBlobUrls || {})) {
      try { URL.revokeObjectURL(u); } catch (_) {}
    }
    state.assetBlobUrls = {};
  }

  async function ingestBrowserFolderFiles(rawFileEntries, fallbackFolderName = 'Folder Project', dirHandle = null) {
    const codeSync = window.VectoraCodeSync;
    const skipSegs = new Set([
      '.git', 'node_modules', 'dist', 'dist-web', '_site', '.wrangler', 'memory', '.vp-memory',
      'desktop', 'release', 'win-unpacked', 'mac', 'linux-unpacked', 'out', 'build', '.next', '.cache'
    ]);
    const textFiles = {};
    const binFiles = {};
    revokeAssetBlobUrls();
    const assetUrls = {};

    let detectedRootName = fallbackFolderName;
    const normalizedItems = [];

    for (const item of rawFileEntries) {
      const fileObj = item.file || item;
      const rawRel = String(item.relPath || fileObj.webkitRelativePath || fileObj.name || '').replace(/\\/g, '/');
      if (!rawRel) continue;
      const segs = rawRel.split('/').filter(Boolean);
      if (segs.some((s) => skipSegs.has(s))) continue;
      normalizedItems.push({ fileObj, segs });
    }

    if (!normalizedItems.length) {
      showToast('No supported project files found in folder');
      return;
    }

    // Strip shared top-level folder prefix if all files come from one selected root folder
    const firstSeg = normalizedItems[0].segs.length > 1 ? normalizedItems[0].segs[0] : '';
    const stripFirst = Boolean(firstSeg && normalizedItems.every((it) => it.segs.length > 1 && it.segs[0] === firstSeg));
    if (stripFirst) detectedRootName = firstSeg;

    for (const { fileObj, segs } of normalizedItems) {
      const rel = (stripFirst ? segs.slice(1) : segs).join('/');
      if (!rel) continue;
      // Double-check relative path segments after stripping root folder name
      if (rel.split('/').some((s) => skipSegs.has(s))) continue;
      if (/\.(?:html?|css|m?js)$/i.test(rel)) {
        if (fileObj.size <= 3 * 1024 * 1024) {
          textFiles[rel] = await fileObj.text();
        }
      } else if (/\.json$/i.test(rel)) {
        // Keep lightweight JSON configs (e.g. version.json, manifest.json) in VFS for relative fetch()
        if (fileObj.size <= 512 * 1024) {
          textFiles[rel] = await fileObj.text();
        }
      } else if (/\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf|glb|gltf|mp4)$/i.test(rel)) {
        if (fileObj.size <= 15 * 1024 * 1024) {
          const buf = await fileObj.arrayBuffer();
          binFiles[rel] = new Uint8Array(buf);
          assetUrls[rel] = URL.createObjectURL(fileObj);
        }
      }
    }

    if (!Object.keys(textFiles).some((k) => /\.html?$/i.test(k))) {
      // Ensure at least an index.html exists if folder only had CSS/JS snippets
      const cssList = Object.keys(textFiles).filter((k) => /\.css$/i.test(k));
      const jsList = Object.keys(textFiles).filter((k) => /\.m?js$/i.test(k));
      textFiles['index.html'] = codeSync
        ? codeSync.createSessionHtmlTemplate('index.html', detectedRootName, cssList, jsList)
        : '<!doctype html><html><body><h1>Project</h1></body></html>';
    }

    state.vfsMode = true;
    state.dirHandle = dirHandle;
    state.targetPath = '';
    state.projectName = detectedRootName || 'Folder Project';
    state.projectFiles = textFiles;
    state.originFiles = { ...textFiles };
    state.codeEditedFiles = {};
    state.binaryAssets = binFiles;
    state.assetBlobUrls = assetUrls;
    state.everEditedInSession = false;

    rebuildFileListsFromMap(state.projectFiles);
    state.entry = state.htmlFiles.includes('index.html') ? 'index.html' : state.htmlFiles[0];
    state.activeCodeFile = state.entry;
    $('projectName').textContent = state.projectName;

    persistStandaloneVfsToStorage();
    closeFileDialog();
    loadEntryIntoIframe(state.entry);
    setTimeout(fitArtboardToStage, 120);
    showToast(`Opened "${state.projectName}" (${state.allFiles.length} HTML/CSS/JS files)`);
  }

  async function pickDirectoryViaFileSystemAccessApi() {
    if (typeof window.showDirectoryPicker !== 'function') {
      $('inpFolderPicker')?.click();
      return;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const collected = [];
      const skip = new Set([
        '.git', 'node_modules', 'dist', 'dist-web', '_site', '.wrangler', 'memory', '.vp-memory',
        'desktop', 'release', 'win-unpacked', 'mac', 'linux-unpacked', 'out', 'build', '.next', '.cache'
      ]);
      async function walkHandle(handle, prefix = '', depth = 0) {
        if (depth > 4) return;
        for await (const [name, entry] of handle.entries()) {
          if (skip.has(name)) continue;
          const rel = prefix ? `${prefix}/${name}` : name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            collected.push({ file, relPath: rel });
          } else if (entry.kind === 'directory') {
            await walkHandle(entry, rel, depth + 1);
          }
        }
      }
      await walkHandle(dirHandle, '', 0);
      await ingestBrowserFolderFiles(collected, dirHandle.name || 'Folder Project', dirHandle);
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        console.warn('[Vectora Canvas] Directory picker error:', err);
      }
    }
  }

  async function publishFullPageInNewTab() {
    const codeSync = window.VectoraCodeSync;
    const cleanEntry = (state.entry || 'index.html').replace(/^\/+/, '');

    if (state.hasServerBackend && !state.vfsMode) {
      const pubUrl = `/__vc_publish/${cleanEntry}?vc_pub=${Date.now()}`;
      if (!state.everEditedInSession) {
        window.open(pubUrl, '_blank');
        showToast(`Published ${cleanEntry} in new tab`);
        return;
      }
      const newTab = window.open('about:blank', '_blank');
      await syncCanvasToProjectFiles({ autoSyncOnly: true, markBaseline: false });
      if (newTab) newTab.location.href = pubUrl;
      else window.open(pubUrl, '_blank');
      showToast(`Published ${cleanEntry} in new tab`);
      return;
    }

    const newTab = window.open('about:blank', '_blank');
    if (state.everEditedInSession) {
      await syncCanvasToProjectFiles({ autoSyncOnly: true, markBaseline: false });
    }
    const compiledFullPage = codeSync
      ? codeSync.compileStandaloneHtml({
          entry: state.entry,
          filesMap: state.projectFiles,
          assetUrls: state.assetBlobUrls,
          studioBaseUrl: STUDIO_BASE_URL,
          includeBridge: false,
          bypassEnabled: false,
          accelMode: state.effectiveAccel
        })
      : (state.projectFiles[state.entry] || '<!doctype html><html><body></body></html>');
    const blob = new Blob([compiledFullPage], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    if (newTab) {
      newTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
    showToast(`Published ${cleanEntry} in new tab`);
  }

  async function triggerProjectExportDownload() {
    const codeSync = window.VectoraCodeSync;
    await syncCanvasToProjectFiles({ autoSyncOnly: true, markBaseline: false });

    // Ensure full folder text map is loaded if exporting a server-backed folder
    if (state.hasServerBackend && !state.vfsMode && Object.keys(state.projectFiles).length < state.allFiles.length) {
      try {
        const res = await fetch('/__vc_api/project-files');
        const snap = await res.json();
        if (snap && snap.ok && snap.contents) {
          state.projectFiles = { ...snap.contents, ...state.projectFiles };
          rebuildFileListsFromMap(state.projectFiles);
        }
      } catch (_) {}
    }

    const textKeys = Object.keys(state.projectFiles || {});
    const binKeys = Object.keys(state.binaryAssets || {});
    const slug = (state.projectName || 'vectora-project').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'vectora-project';

    let blob;
    let downloadName;
    if ((textKeys.length > 1 || binKeys.length > 0 || state.notes.length > 0) && codeSync && typeof codeSync.buildZipUint8Array === 'function') {
      const filesForExport = { ...state.projectFiles };
      if (state.notes.length > 0) {
        filesForExport['.vectora-notes.json'] = JSON.stringify(
          {
            skillName: 'vectora-canvas',
            notPartOfDesign: true,
            projectName: state.projectName,
            agentBrief: formatAllNotesForCodingAgent(state.notes),
            notes: state.notes
          },
          null,
          2
        );
      }
      const zipBytes = codeSync.buildZipUint8Array(filesForExport, state.binaryAssets);
      blob = new Blob([zipBytes], { type: 'application/zip' });
      downloadName = `${slug}.zip`;
    } else {
      const htmlName = (state.entry || 'index.html').split('/').pop() || 'index.html';
      const htmlStr = state.projectFiles[state.entry] || Object.values(state.projectFiles)[0] || '<!doctype html><html><body></body></html>';
      blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
      downloadName = htmlName;
    }

    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = downloadName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      try { URL.revokeObjectURL(dlUrl); } catch (_) {}
    }, 2500);
    showToast(`Exported ${downloadName}`);
  }

  async function handleFileMenuAction(act) {
    closeAllDropdowns();
    const codeSync = window.VectoraCodeSync;

    switch (act) {
      case 'new-session': {
        openFileDialog('New Session', (body) => {
          const suggested = `session-${state.htmlFiles.length + 1}.html`;
          const linkedNote = [...state.cssFiles.slice(0, 2), ...state.jsFiles.slice(0, 2)].join(', ') || 'project styles';
          body.innerHTML = `
            <div class="fd-stack">
              <div>
                <label class="fd-label" for="inpNewSessionName">Session HTML File Name</label>
                <input type="text" class="fd-input" id="inpNewSessionName" value="${escapeHtml(suggested)}" placeholder="e.g. pricing.html">
              </div>
              <div class="code-file-hint">Automatically links shared folder assets (${escapeHtml(linkedNote)}).</div>
              <div class="fd-actions">
                <button type="button" class="mini-btn" id="btnCancelFileModal">Cancel</button>
                <button type="button" class="tb-btn primary" id="btnConfirmNewSession">Create Session</button>
              </div>
            </div>
          `;
          body.querySelector('#btnCancelFileModal').addEventListener('click', closeFileDialog);
          const submit = async () => {
            let fileName = (body.querySelector('#inpNewSessionName').value || '').trim() || suggested;
            if (!/\.html?$/i.test(fileName)) fileName += '.html';
            fileName = codeSync ? codeSync.normalizeRelPath(fileName) : fileName;

            if (state.hasServerBackend && !state.vfsMode) {
              const resp = await fetch('/__vc_api/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: fileName })
              });
              const json = await resp.json();
              if (json && json.ok) {
                state.projectFiles = json.contents || state.projectFiles;
                state.originFiles = json.origins || state.originFiles;
                if (Array.isArray(json.recentSessions)) state.recentSessions = json.recentSessions;
                rebuildFileListsFromMap(state.projectFiles);
                closeFileDialog();
                loadEntryIntoIframe(json.entry || fileName);
                showToast(`Created session ${json.entry || fileName}`);
              }
            } else {
              const tpl = codeSync
                ? codeSync.createSessionHtmlTemplate(fileName, state.projectName, state.cssFiles.slice(0, 2), state.jsFiles.slice(0, 2))
                : `<!doctype html><html><body><h1>${escapeHtml(fileName)}</h1></body></html>`;
              state.projectFiles[fileName] = tpl;
              state.originFiles[fileName] = tpl;
              rebuildFileListsFromMap(state.projectFiles);
              persistStandaloneVfsToStorage();
              await writeFilesToDirHandle([fileName]);
              closeFileDialog();
              loadEntryIntoIframe(fileName);
              showToast(`Created session ${fileName}`);
            }
          };
          body.querySelector('#btnConfirmNewSession').addEventListener('click', submit);
          const inp = body.querySelector('#inpNewSessionName');
          inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') submit(); });
          setTimeout(() => { inp.focus(); inp.select(); }, 20);
        });
        break;
      }

      case 'new-project': {
        openFileDialog('New Project', (body) => {
          body.innerHTML = `
            <div class="fd-stack">
              <div>
                <label class="fd-label" for="inpNewProjectName">Project Name</label>
                <input type="text" class="fd-input" id="inpNewProjectName" value="Vectora Web Project" placeholder="My Web App">
              </div>
              <div class="code-file-hint">Creates a multi-file folder with <code>index.html</code>, <code>about.html</code>, <code>styles.css</code>, and <code>script.js</code>.</div>
              <div class="fd-actions">
                <button type="button" class="mini-btn" id="btnCancelFileModal">Cancel</button>
                <button type="button" class="tb-btn primary" id="btnConfirmNewProject">Create Project</button>
              </div>
            </div>
          `;
          body.querySelector('#btnCancelFileModal').addEventListener('click', closeFileDialog);
          const submit = async () => {
            const projName = (body.querySelector('#inpNewProjectName').value || '').trim() || 'Vectora Web Project';
            if (state.hasServerBackend && !state.vfsMode) {
              const resp = await fetch('/__vc_api/create-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projName })
              });
              const json = await resp.json();
              if (json && json.ok) {
                state.vfsMode = false;
                state.dirHandle = null;
                state.projectName = json.projectName || projName;
                state.targetPath = json.target || '';
                state.projectFiles = json.contents || {};
                state.originFiles = json.origins || {};
                state.codeEditedFiles = {};
                revokeAssetBlobUrls();
                state.binaryAssets = {};
                state.everEditedInSession = false;
                rebuildFileListsFromMap(state.projectFiles);
                $('projectName').textContent = state.projectName;
                closeFileDialog();
                loadEntryIntoIframe(json.entry || 'index.html');
                setTimeout(fitArtboardToStage, 120);
                showToast(`Created project "${state.projectName}"`);
              }
            } else {
              const starter = codeSync ? codeSync.createStarterProjectFiles(projName) : { 'index.html': '<!doctype html><html><body></body></html>' };
              state.vfsMode = true;
              state.dirHandle = null;
              state.targetPath = '';
              state.projectName = projName;
              state.projectFiles = starter;
              state.originFiles = { ...starter };
              state.codeEditedFiles = {};
              revokeAssetBlobUrls();
              state.binaryAssets = {};
              state.everEditedInSession = false;
              rebuildFileListsFromMap(state.projectFiles);
              $('projectName').textContent = state.projectName;
              persistStandaloneVfsToStorage();
              closeFileDialog();
              loadEntryIntoIframe('index.html');
              setTimeout(fitArtboardToStage, 120);
              showToast(`Created project "${projName}"`);
            }
          };
          body.querySelector('#btnConfirmNewProject').addEventListener('click', submit);
          const inp = body.querySelector('#inpNewProjectName');
          inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') submit(); });
          setTimeout(() => { inp.focus(); inp.select(); }, 20);
        });
        break;
      }

      case 'open-recent': {
        openFileDialog('Open Recent Project', (body) => {
          const localRecents = loadLocalRecentSessions();
          const workspaceItems = (state.recentWorkspaces || []).map((w) => {
            const folderPath = w.originalSourceDir || w.target || '';
            const folderBase = folderPath ? folderPath.replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop() : 'Project';
            return {
              projectName: folderBase || 'Project',
              entry: w.entry || 'index.html',
              target: folderPath,
              openedAt: w.openedAt || ''
            };
          });
          const merged = [];
          const seenFolders = new Set();
          // Strictly 1 entry per project folder — never list multiple files from the same folder!
          for (const s of [...localRecents, ...workspaceItems, ...(state.recentSessions || [])]) {
            if (!s) continue;
            const folderPath = s.originalSourceDir || s.target || '';
            const folderBase = folderPath
              ? folderPath.replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop()
              : (s.projectName || 'Project');
            const projTitle = s.projectName || folderBase || 'Project';
            const folderKey = getProjectFolderKey(folderPath, projTitle);
            if (seenFolders.has(folderKey)) continue;
            seenFolders.add(folderKey);
            merged.push({
              ...s,
              projectName: projTitle,
              target: folderPath,
              entry: s.entry || 'index.html'
            });
          }

          if (!merged.length) {
            body.innerHTML = `<div class="empty-note">No recent projects recorded yet.</div>`;
            return;
          }

          const wrap = document.createElement('div');
          wrap.className = 'recent-list';
          for (const item of merged) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'recent-item';
            btn.innerHTML = `
              <b>${escapeHtml(item.projectName || 'Project')}</b>
              <span>${escapeHtml(item.target || 'Browser Folder Workspace')}</span>
            `;
            btn.addEventListener('click', async () => {
              closeFileDialog();
              if (item.vfsSnapshot && (state.vfsMode || !state.hasServerBackend || !item.target)) {
                state.vfsMode = true;
                state.projectName = item.projectName || state.projectName;
                state.projectFiles = { ...item.vfsSnapshot };
                state.originFiles = { ...item.vfsSnapshot };
                state.everEditedInSession = false;
                rebuildFileListsFromMap(state.projectFiles);
                $('projectName').textContent = state.projectName;
                persistStandaloneVfsToStorage();
                loadEntryIntoIframe(item.entry || 'index.html');
              } else if (state.hasServerBackend && item.target && item.target !== state.targetPath) {
                state.vfsMode = false;
                await fetch('/__vc_api/switch-target', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ target: item.target, entry: item.entry || 'index.html' })
                });
                await bootStudio();
              } else {
                loadEntryIntoIframe(item.entry || 'index.html');
              }
              showToast(`Opened project "${item.projectName}"`);
            });
            wrap.appendChild(btn);
          }
          body.appendChild(wrap);
        });
        break;
      }

      case 'open-project': {
        openFileDialog('Open Project', (body) => {
          const hasDirApi = typeof window.showDirectoryPicker === 'function';
          body.innerHTML = `
            <div class="fd-stack">
              <div class="code-file-hint">Load a whole folder containing HTML, CSS, JavaScript, and media assets.</div>
              <div class="fd-actions" style="justify-content: flex-start; flex-wrap: wrap;">
                <button type="button" class="tb-btn primary" id="btnBrowseFolderInput">Select Project Folder…</button>
                ${hasDirApi ? '<button type="button" class="tb-btn" id="btnPickLiveDirHandle">Live Disk Folder Access…</button>' : ''}
              </div>
              ${state.hasServerBackend ? `
                <div style="border-top: 1px solid var(--border); padding-top: 8px;">
                  <label class="fd-label" for="inpServerFolderPath">Or Open Local Server Path</label>
                  <div class="prop-row" style="gap: 6px;">
                    <input type="text" class="fd-input" id="inpServerFolderPath" value="${escapeHtml(state.targetPath || '')}" placeholder="C:/path/to/project">
                    <button type="button" class="mini-btn accent" id="btnOpenServerPath">Open Path</button>
                  </div>
                </div>
              ` : ''}
            </div>
          `;
          body.querySelector('#btnBrowseFolderInput').addEventListener('click', () => {
            const picker = $('inpFolderPicker');
            if (picker) {
              picker.value = '';
              picker.click();
            }
          });
          if (hasDirApi && body.querySelector('#btnPickLiveDirHandle')) {
            body.querySelector('#btnPickLiveDirHandle').addEventListener('click', () => {
              pickDirectoryViaFileSystemAccessApi();
            });
          }
          if (state.hasServerBackend && body.querySelector('#btnOpenServerPath')) {
            body.querySelector('#btnOpenServerPath').addEventListener('click', async () => {
              const p = (body.querySelector('#inpServerFolderPath').value || '').trim();
              if (!p) return;
              const resp = await fetch('/__vc_api/switch-target', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: p, entry: 'index.html' })
              });
              const json = await resp.json();
              if (json && json.ok) {
                state.vfsMode = false;
                closeFileDialog();
                await bootStudio();
                showToast(`Opened folder ${p}`);
              } else {
                showToast(json?.error || 'Folder path not found');
              }
            });
          }
        });
        break;
      }

      case 'save-project': {
        await triggerDirectHtmlSave(true);
        break;
      }

      case 'export': {
        await triggerProjectExportDownload();
        break;
      }
    }
  }

  // =========================================================================
  // 12. WIRE ALL UI CONTROLS, SHORTCUTS, BRIDGE MESSAGES & SSE
  // =========================================================================
  function wireUiControls() {
    // Topbar Dropdowns
    wireDropdownToggle('ddPage', (menu) => {
      populateSimpleDropdown(
        menu,
        state.htmlFiles.map((f) => ({ value: f, label: f, icon: SVG_ICONS.file })),
        state.entry,
        (picked) => loadEntryIntoIframe(picked)
      );
    });

    wireDropdownToggle('ddFile');
    document.querySelectorAll('#ddFileMenu [data-file-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handleFileMenuAction(btn.getAttribute('data-file-act'));
      });
    });

    if ($('inpFolderPicker')) {
      $('inpFolderPicker').addEventListener('change', async (ev) => {
        const files = Array.from(ev.target.files || []);
        if (files.length) {
          await ingestBrowserFolderFiles(files, 'Imported Folder', null);
        }
      });
    }

    if ($('btnCloseFileDialog')) {
      $('btnCloseFileDialog').addEventListener('click', closeFileDialog);
    }
    if ($('fileDialogModal')) {
      $('fileDialogModal').addEventListener('click', (ev) => {
        if (ev.target === $('fileDialogModal')) closeFileDialog();
      });
    }

    wireDropdownToggle('ddView', (menu) => {
      menu.innerHTML = '';
      const pageHeader = document.createElement('div');
      pageHeader.className = 'dd-group-title';
      pageHeader.textContent = 'HTML Pages';
      menu.appendChild(pageHeader);
      state.htmlFiles.forEach((f) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dd-opt' + (f === state.entry ? ' active' : '');
        b.innerHTML = `${SVG_ICONS.file}<span>${escapeHtml(f)}</span>`;
        b.addEventListener('click', () => {
          closeAllDropdowns();
          loadEntryIntoIframe(f);
        });
        menu.appendChild(b);
      });

      if (state.discoveredViews.length) {
        const vHead = document.createElement('div');
        vHead.className = 'dd-group-title';
        vHead.textContent = 'Screens, Unlocked Modes & Modals';
        menu.appendChild(vHead);
        state.discoveredViews.forEach((v) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'dd-opt';
          b.innerHTML = `${SVG_ICONS.view}<span>${escapeHtml(v.label)}</span>`;
          b.addEventListener('click', () => {
            closeAllDropdowns();
            $('ddViewLabel').textContent = v.label.slice(0, 18);
            postToBridge('activate_view', { action: v.action });
          });
          menu.appendChild(b);
        });
      }
    });

    wireDropdownToggle('ddPreset', (menu) => {
      populateSimpleDropdown(
        menu,
        UI_PRESETS.map((p) => ({ value: p.id, label: p.label })),
        state.activePreset,
        (val) => {
          const pr = UI_PRESETS.find((x) => x.id === val) || UI_PRESETS[0];
          state.activePreset = pr.id;
          $('ddPresetLabel').textContent = pr.label;
          if (pr.reset) {
            postToBridge('set_theme_palette', {
              palette: { reset: true, presetId: 'original' },
              previewOnly: false,
              commit: true
            });
          } else {
            if (pr.primary) $('inpPrimaryColor').value = pr.primary;
            if (pr.secondary) $('inpSecondaryColor').value = pr.secondary;
            postToBridge('set_theme_palette', {
              palette: {
                primary: pr.primary,
                secondary: pr.secondary,
                extraCss: pr.extraCss || '',
                presetId: pr.id
              },
              previewOnly: false,
              commit: true
            });
          }
        }
      );
    });

    wireDropdownToggle('ddArtboard', (menu) => {
      populateSimpleDropdown(
        menu,
        ARTBOARD_SIZES.map((a) => ({ value: `${a.w}x${a.h}`, w: a.w, h: a.h, label: a.label })),
        `${state.artboardWidth}x${state.artboardHeight}`,
        (_val, item) => {
          state.artboardWidth = Number(item.w) || 1920;
          state.artboardHeight = Number(item.h) || 1080;
          $('ddArtboardLabel').textContent = item.label;
          postToBridge('set_artboard', { width: state.artboardWidth, height: state.artboardHeight });
          fitArtboardToStage();
        }
      );
    });

    wireDropdownToggle('ddDisplay', (menu) => {
      populateSimpleDropdown(menu, DISPLAY_OPTIONS, $('ddDisplayLabel').textContent, (val) => {
        $('ddDisplayLabel').textContent = val;
        postToBridge('patch_style', { props: { display: val }, commitScrub: true });
      });
    });

    wireDropdownToggle('ddStrokeStyle', (menu) => {
      populateSimpleDropdown(menu, STROKE_STYLES, state.paint.strokeStyle, (val) => {
        state.paint.strokeStyle = val;
        $('ddStrokeStyleLabel').textContent = val;
        postToBridge('patch_style', {
          props: {
            borderStyle: val,
            borderWidth: val === 'none' ? '0px' : `${state.paint.strokeWidth || 1}px`,
            borderColor: state.paint.strokeColor
          },
          commitScrub: true
        });
      });
    });

    wireDropdownToggle('ddGoogleFont', () => {
      $('inpFontSearch').value = '';
      renderGoogleFontOptions('');
      setTimeout(() => $('inpFontSearch').focus(), 20);
    });
    $('inpFontSearch').addEventListener('input', (ev) => renderGoogleFontOptions(ev.target.value));

    wireDropdownToggle('ddFontWeight', (menu) => {
      populateSimpleDropdown(menu, FONT_WEIGHTS, $('ddFontWeightLabel').textContent, (val) => {
        $('ddFontWeightLabel').textContent = val;
        postToBridge('patch_style', { props: { fontWeight: val }, commitScrub: true });
      });
    });

    // Mode, Bypass, History, Save & Original
    $('btnModeLive').addEventListener('click', () => setWorkspaceMode('live'));
    $('btnModeEdit').addEventListener('click', () => setWorkspaceMode('edit'));

    $('btnBypassGates').addEventListener('click', () => {
      state.bypassGates = !state.bypassGates;
      syncBypassButtonUI(true);
      postToBridge('set_bypass', { enabled: state.bypassGates });
      showToast(state.bypassGates ? 'Bypass Unlocked — Auth/Pro gates bypassed' : 'Bypass Locked — Auth/Pro gates enforced');
    });

    if ($('btnExitIsolation')) {
      $('btnExitIsolation').addEventListener('click', () => {
        postToBridge('exit_isolation', { exitAll: false });
      });
    }
    if ($('accelModeBadge')) {
      $('accelModeBadge').addEventListener('click', () => {
        $('prefsModal').hidden = false;
      });
    }

    $('btnUndo').addEventListener('click', () => postToBridge('undo'));
    $('btnRedo').addEventListener('click', () => postToBridge('redo'));
    $('btnSave').addEventListener('click', () => triggerDirectHtmlSave());
    $('btnOriginal').addEventListener('click', () => postToBridge('restore_original'));

    // Global Primary / Secondary Palette (independent live input preview + single-step Undo commit!)
    const pushPrimaryPalette = (commit) => {
      const p = $('inpPrimaryColor').value;
      state.activePreset = 'custom';
      $('ddPresetLabel').textContent = 'Theme: Custom';
      postToBridge('set_theme_palette', {
        palette: { primary: p, presetId: 'custom' },
        previewOnly: !commit,
        commit
      });
    };
    const pushSecondaryPalette = (commit) => {
      const s = $('inpSecondaryColor').value;
      state.activePreset = 'custom';
      $('ddPresetLabel').textContent = 'Theme: Custom';
      postToBridge('set_theme_palette', {
        palette: { secondary: s, presetId: 'custom' },
        previewOnly: !commit,
        commit
      });
    };
    $('inpPrimaryColor').addEventListener('input', () => pushPrimaryPalette(false));
    $('inpPrimaryColor').addEventListener('change', () => pushPrimaryPalette(true));
    $('inpSecondaryColor').addEventListener('input', () => pushSecondaryPalette(false));
    $('inpSecondaryColor').addEventListener('change', () => pushSecondaryPalette(true));

    // Modals & Command Palette
    $('btnCmdPalette').addEventListener('click', openCommandPalette);
    $('cmdSearchInput').addEventListener('input', (ev) => renderCommandList(ev.target.value));
    $('cmdPaletteModal').addEventListener('click', (ev) => {
      if (ev.target === $('cmdPaletteModal')) $('cmdPaletteModal').hidden = true;
    });

    $('btnOpenPrefs').addEventListener('click', () => { $('prefsModal').hidden = false; });
    $('btnClosePrefs').addEventListener('click', () => { $('prefsModal').hidden = true; });
    $('prefsModal').addEventListener('click', (ev) => {
      if (ev.target === $('prefsModal')) $('prefsModal').hidden = true;
    });

    $('prefScaleStrokes').addEventListener('change', (ev) => {
      state.preferences.scaleStrokesAndEffects = ev.target.checked;
      postToBridge('set_prefs', { prefs: state.preferences });
      persistPreferences();
    });
    $('prefScaleCorners').addEventListener('change', (ev) => {
      state.preferences.scaleCorners = ev.target.checked;
      postToBridge('set_prefs', { prefs: state.preferences });
      persistPreferences();
    });
    $('prefAutoSave').addEventListener('change', (ev) => {
      state.preferences.autoSave = ev.target.checked;
      persistPreferences();
    });
    $('prefBtnScaleInPlace').addEventListener('click', () => setMultiScaleMode('in-place'));
    $('prefBtnScaleNormal').addEventListener('click', () => setMultiScaleMode('normal'));
    if ($('prefBtnAccelAuto')) $('prefBtnAccelAuto').addEventListener('click', () => setAccelerationPreference('auto'));
    if ($('prefBtnAccelGpu')) $('prefBtnAccelGpu').addEventListener('click', () => setAccelerationPreference('gpu'));
    if ($('prefBtnAccelCpu')) $('prefBtnAccelCpu').addEventListener('click', () => setAccelerationPreference('cpu'));

    $('btnOpenShortcuts').addEventListener('click', () => { $('shortcutsModal').hidden = false; });
    $('btnCloseShortcuts').addEventListener('click', () => { $('shortcutsModal').hidden = true; });
    $('shortcutsModal').addEventListener('click', (ev) => {
      if (ev.target === $('shortcutsModal')) $('shortcutsModal').hidden = true;
    });

    // Left Panel: Quick Select, Sessions/Layers Tabs, Unlock All, Group/Ungroup, Grammar
    $('btnClearSel').addEventListener('click', () => postToBridge('clear_selection'));
    document.querySelectorAll('.cat-btn[data-cat]').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.id === 'btnAllSections') b.classList.toggle('active');
        postToBridge('quick_select', { category: b.getAttribute('data-cat') });
      });
    });

    $('tabTreeSections').addEventListener('click', () => switchLeftTreeTab('sections'));
    $('tabTreeLayers').addEventListener('click', () => switchLeftTreeTab('layers'));
    if ($('tabTreeFiles')) {
      $('tabTreeFiles').addEventListener('click', () => switchLeftTreeTab('files'));
    }

    $('btnUnlockAll').addEventListener('click', () => postToBridge('unlock_all'));
    $('btnGroup').addEventListener('click', () => postToBridge('group'));
    $('btnUngroup').addEventListener('click', () => postToBridge('ungroup'));
    $('chkAutoGroupBtn').addEventListener('change', (ev) => {
      state.autoGroupButtons = ev.target.checked;
      postToBridge('set_prefs', { autoGroupButtons: state.autoGroupButtons });
    });
    $('btnRefreshTree').addEventListener('click', () => postToBridge('refresh_tree'));

    $('btnScanGrammar').addEventListener('click', () => {
      postToBridge('scan_grammar', { ignoredWords: state.ignoredWords });
    });
    $('btnFixAllGrammar').addEventListener('click', () => {
      if (state.grammarIssues.length) {
        postToBridge('fix_grammar', { items: state.grammarIssues });
        state.grammarIssues = [];
        renderGrammarIssues();
      }
    });

    // Vertical Illustrator Toolbar + Shape Sub-bar
    document.querySelectorAll('#aiToolbar .ai-tool').forEach((btn) => {
      btn.addEventListener('click', () => setActiveTool(btn.getAttribute('data-tool')));
    });
    document.querySelectorAll('#shapeSubbar .shape-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.shapeKind = btn.getAttribute('data-shape');
        document.querySelectorAll('#shapeSubbar .shape-opt').forEach((x) => x.classList.toggle('active', x === btn));
        postToBridge('set_shape_kind', {
          shapeKind: state.shapeKind,
          applyToSelectedShape: Boolean(state.selection?.isShape && state.selection?.count > 0)
        });
        syncTopCornerControlBar();
      });
    });

    // Topbar Adobe Illustrator Live Corner Radius Controls (#cornerControlBar)
    if ($('topCornerSlider')) {
      const emitCornerRadius = (valPx, previewOnly, commitScrub) => {
        const clamped = Math.max(0, Math.round(Number(valPx) || 0));
        if (clamped > 0) state.shapeRadius = clamped;
        if (state.tool === 'shape' && state.selection.count === 0) {
          state.shapeKind = clamped === 0 ? 'rect' : 'rounded';
          document.querySelectorAll('#shapeSubbar .shape-opt').forEach((x) => {
            x.classList.toggle('active', x.getAttribute('data-shape') === state.shapeKind);
          });
        }
        const maxR = Number($('topCornerSlider').max) || 120;
        const pct = Math.min(100, Math.round((Math.min(maxR, clamped) / Math.max(1, maxR)) * 100));
        if ($('topCornerInput') && document.activeElement !== $('topCornerInput')) {
          $('topCornerInput').value = `${clamped} px`;
        }
        if ($('topCornerRoundBadge')) $('topCornerRoundBadge').textContent = `${pct}%`;
        if ($('propRadius') && document.activeElement !== $('propRadius')) $('propRadius').value = `${clamped}px`;
        updateCornerArcPreview(pct);
        postToBridge('set_corner_radius', { radius: clamped, previewOnly, commitScrub });
      };

      $('topCornerSlider').addEventListener('input', (ev) => {
        emitCornerRadius(ev.target.value, true, false);
      });
      $('topCornerSlider').addEventListener('change', (ev) => {
        emitCornerRadius(ev.target.value, false, true);
      });

      if ($('topCornerInput')) {
        const commitCornerInput = () => {
          const raw = ($('topCornerInput').value || '').trim();
          if (raw === '50%') {
            postToBridge('set_corner_radius', { radius: 60, radiusCss: '50%', previewOnly: false, commitScrub: true });
            return;
          }
          const parsed = Math.max(0, Math.round(parseFloat(raw) || 0));
          if ($('topCornerSlider')) $('topCornerSlider').value = String(Math.min(Number($('topCornerSlider').max) || 120, parsed));
          emitCornerRadius(parsed, false, true);
          $('topCornerInput').value = `${parsed} px`;
        };
        $('topCornerInput').addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            commitCornerInput();
            $('topCornerInput').blur();
          } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            const step = ev.shiftKey ? 10 : 1;
            const cur = Math.max(0, Math.round(parseFloat($('topCornerInput').value) || 0));
            const next = Math.max(0, cur + (ev.key === 'ArrowUp' ? step : -step));
            $('topCornerInput').value = `${next} px`;
            if ($('topCornerSlider')) $('topCornerSlider').value = String(Math.min(Number($('topCornerSlider').max) || 120, next));
            emitCornerRadius(next, false, true);
          }
        });
        $('topCornerInput').addEventListener('change', commitCornerInput);
      }

      if ($('cornerScrubHandle')) {
        $('cornerScrubHandle').addEventListener('mousedown', (ev) => {
          if (ev.button !== 0) return;
          ev.preventDefault();
          const startX = ev.clientX;
          const startVal = Math.max(0, Math.round(parseFloat($('topCornerInput')?.value) || Number($('topCornerSlider')?.value) || 0));
          const onMove = (me) => {
            const dx = Math.round((me.clientX - startX) * (me.shiftKey ? 2 : 0.5));
            const next = Math.max(0, startVal + dx);
            if ($('topCornerSlider')) $('topCornerSlider').value = String(Math.min(Number($('topCornerSlider').max) || 120, next));
            emitCornerRadius(next, true, false);
          };
          const onUp = (ue) => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const dx = Math.round((ue.clientX - startX) * (ue.shiftKey ? 2 : 0.5));
            const next = Math.max(0, startVal + dx);
            emitCornerRadius(next, false, true);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        });
      }
    }

    $('chkSmartGuides').addEventListener('change', (ev) => {
      state.smartGuides = ev.target.checked;
      postToBridge('set_prefs', { smartGuides: state.smartGuides });
    });
    $('chkShowNotes').addEventListener('change', (ev) => {
      state.showNotes = ev.target.checked;
      postToBridge('set_prefs', { showNotes: state.showNotes });
    });

    // Right Inspector Tabs (Edit | Code | CSS | DOM)
    document.querySelectorAll('.insp-tabs .insp-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        switchInspectorTab(tab.getAttribute('data-itab'));
      });
    });

    wireDropdownToggle('ddCodeFile', (menu) => {
      populateSimpleDropdown(
        menu,
        state.allFiles.map((f) => ({ value: f, label: f, icon: SVG_ICONS.file })),
        state.activeCodeFile,
        async (picked) => {
          state.activeCodeFile = picked;
          await ensureFileContentLoaded(picked);
          renderFileTreeUI();
          renderCodeEditorUI(true);
        }
      );
    });

    if ($('btnApplyProjectCode')) {
      $('btnApplyProjectCode').addEventListener('click', () => applyEditedProjectCode());
    }
    if ($('projectCodeEditor')) {
      $('projectCodeEditor').addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
          ev.preventDefault();
          applyEditedProjectCode();
        }
      });
    }

    // Links Tab Controls
    const submitSelectedLink = () => {
      const inp = $('inpSelectedLinkUrl');
      if (!inp) return;
      const nextUrl = inp.value.trim();
      postToBridge('set_element_link', { vcId: '', url: nextUrl });
      state.everEditedInSession = true;
      scheduleAutoCodeSync();
      showToast(nextUrl ? `Link set to ${nextUrl}` : 'Removed link from selected element');
    };
    if ($('btnSetSelectedLink')) {
      $('btnSetSelectedLink').addEventListener('click', submitSelectedLink);
    }
    if ($('inpSelectedLinkUrl')) {
      $('inpSelectedLinkUrl').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          submitSelectedLink();
        }
      });
    }
    if ($('btnRefreshLinks')) {
      $('btnRefreshLinks').addEventListener('click', () => postToBridge('refresh_tree'));
    }

    // Illustrator Align Panel
    document.querySelectorAll('.ai-align-icon[data-align]').forEach((btn) => {
      btn.addEventListener('click', () => {
        postToBridge('align', { alignType: btn.getAttribute('data-align') });
      });
    });
    $('btnApplyGapY').addEventListener('click', () => {
      postToBridge('align', { alignType: 'space-y', gapPx: parseNumericValue($('inpDistGap').value, 0) });
    });
    $('btnApplyGapX').addEventListener('click', () => {
      postToBridge('align', { alignType: 'space-x', gapPx: parseNumericValue($('inpDistGap').value, 0) });
    });
    document.querySelectorAll('.ai-alignto-btns .ai-align-icon').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.alignTo = btn.getAttribute('data-alignto');
        document.querySelectorAll('.ai-alignto-btns .ai-align-icon').forEach((x) => x.classList.toggle('active', x === btn));
        postToBridge('set_align_to', { alignTo: state.alignTo });
      });
    });

    // Arrange & Object Bar
    $('btnBringFront').addEventListener('click', () => postToBridge('arrange', { action: 'bring-front' }));
    $('btnBringForward').addEventListener('click', () => postToBridge('arrange', { action: 'bring-forward' }));
    $('btnSendBackward').addEventListener('click', () => postToBridge('arrange', { action: 'send-backward' }));
    $('btnSendBack').addEventListener('click', () => postToBridge('arrange', { action: 'send-back' }));
    $('btnLockSelected').addEventListener('click', () => postToBridge('toggle_entity_lock', {}));
    $('btnConvertToDiv').addEventListener('click', () => postToBridge('convert_to_div'));
    $('btnDeleteSelected').addEventListener('click', () => postToBridge('clipboard', { action: 'delete' }));

    // Transform Panel
    $('btnScaleModeToggle').addEventListener('click', () => {
      setMultiScaleMode(state.preferences.multiScaleMode === 'normal' ? 'in-place' : 'normal');
    });
    document.querySelectorAll('#refGrid9 button').forEach((b) => {
      b.addEventListener('click', () => {
        state.refPoint = b.getAttribute('data-ref');
        document.querySelectorAll('#refGrid9 button').forEach((x) => x.classList.toggle('active', x === b));
        postToBridge('set_ref_point', { refPoint: state.refPoint });
      });
    });
    $('btnLockAspect').addEventListener('click', () => {
      state.lockAspect = !state.lockAspect;
      $('btnLockAspect').classList.toggle('active', state.lockAspect);
    });
    $('btnResetElement').addEventListener('click', () => postToBridge('reset_element'));

    // Typography Color, Alignment & Content
    $('propColorPicker').addEventListener('input', (e) => {
      $('propColor').value = e.target.value;
      postToBridge('patch_style', { props: { color: e.target.value }, previewOnly: true, commitScrub: false });
    });
    $('propColorPicker').addEventListener('change', (e) => {
      postToBridge('patch_style', { props: { color: e.target.value }, commitScrub: true });
    });
    $('propColor').addEventListener('change', (e) => {
      postToBridge('patch_style', { props: { color: e.target.value.trim() }, commitScrub: true });
    });

    document.querySelectorAll('#textAlignGroup button').forEach((b) => {
      b.addEventListener('click', () => {
        const align = b.getAttribute('data-talign');
        document.querySelectorAll('#textAlignGroup button').forEach((x) => x.classList.toggle('active', x === b));
        postToBridge('patch_style', { props: { textAlign: align }, commitScrub: true });
      });
    });

    $('propText').addEventListener('change', (e) => {
      postToBridge('patch_text', { text: e.target.value });
    });

    // CSS & DOM Tabs
    $('btnApplyRawCss').addEventListener('click', () => {
      postToBridge('apply_raw_css', { cssText: $('rawInlineCss').value });
    });
    $('btnRefreshDomTab').addEventListener('click', () => postToBridge('refresh_tree'));

    // Right-Click Context Menu Items
    document.querySelectorAll('#vcContextMenu .ctx-item').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        handleContextAction(btn.getAttribute('data-ctx'));
      });
    });

    // Notes Drawer, Publish Button & Popup
    const syncNotesToggleState = () => {
      $('btnToggleNotesDrawer').classList.toggle('active', !$('notesDrawer').hidden);
    };
    $('btnToggleNotesDrawer').addEventListener('click', () => {
      $('notesDrawer').hidden = !$('notesDrawer').hidden;
      syncNotesToggleState();
    });
    $('btnCloseNotesDrawer').addEventListener('click', () => {
      $('notesDrawer').hidden = true;
      syncNotesToggleState();
    });
    if ($('btnAddNoteFromDrawer')) {
      $('btnAddNoteFromDrawer').addEventListener('click', () => {
        const selProps = state.selection?.props;
        openNotePopup({
          selector: selProps?.selector || 'body',
          elementTag: selProps?.tag || 'page',
          markRect: selProps ? { x: selProps.x || 40, y: selProps.y || 40, w: selProps.w || 160, h: selProps.h || 48 } : { x: 48, y: 48, w: 180, h: 56 },
          taskType: 'fix',
          text: ''
        });
      });
    }
    if ($('btnPublishPage')) {
      $('btnPublishPage').addEventListener('click', () => {
        publishFullPageInNewTab();
      });
    }
    document.querySelectorAll('#noteTypeGroup .np-type').forEach((b) => {
      b.addEventListener('click', () => {
        state.noteTaskType = b.getAttribute('data-ntype');
        document.querySelectorAll('#noteTypeGroup .np-type').forEach((x) => x.classList.toggle('active', x === b));
      });
    });
    $('btnCancelNote').addEventListener('click', closeNotePopup);
    $('btnSaveNote').addEventListener('click', saveActiveNote);
    if ($('notePopupInput')) {
      $('notePopupInput').addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
          ev.preventDefault();
          saveActiveNote();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          closeNotePopup();
        }
      });
    }
    if ($('btnCopySingleNote')) {
      $('btnCopySingleNote').addEventListener('click', async () => {
        if (!state.editingNote) return;
        const draft = {
          ...state.editingNote,
          entry: state.editingNote.entry || state.entry,
          taskType: state.noteTaskType,
          text: ($('notePopupInput')?.value || '').trim() || state.editingNote.text || ''
        };
        const formatted = formatSingleNoteForAgent(draft, draft.number || (state.notes.length + 1));
        await copyTextToClipboardSafe(formatted);
        showToast('Copied Marked Area + Note for Coding Agent');
      });
    }
    $('btnDeleteNote').addEventListener('click', async () => {
      if (!state.editingNote?.id) return;
      if (state.hasServerBackend && !state.vfsMode) {
        const resp = await fetch('/__vc_api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: state.editingNote.id })
        });
        const json = await resp.json();
        if (json && Array.isArray(json.notes)) {
          state.notes = json.notes;
        }
      } else {
        state.notes = state.notes.filter((n) => n.id !== state.editingNote.id);
        persistStandaloneNotesToStorage();
      }
      closeNotePopup();
    });
    $('btnClearAllNotes').addEventListener('click', async () => {
      if (state.hasServerBackend && !state.vfsMode) {
        const resp = await fetch('/__vc_api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' })
        });
        const json = await resp.json();
        if (json && Array.isArray(json.notes)) {
          state.notes = json.notes;
          renderNotesUI();
        }
      } else {
        state.notes = [];
        persistStandaloneNotesToStorage();
        renderNotesUI();
      }
    });
    $('btnCopyAgentNotes').addEventListener('click', async () => {
      const payload = formatAllNotesForCodingAgent(state.notes);
      await copyTextToClipboardSafe(payload);
      showToast(state.notes.length ? `Copied ${state.notes.length} Marked Agent Note${state.notes.length === 1 ? '' : 's'}` : 'No open notes to copy');
    });

    // Studio-level Keyboard Shortcuts
    window.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        state.spaceHeld = true;
      }
      state.altHeld = Boolean(ev.altKey);
      state.ctrlHeld = Boolean(ev.ctrlKey || ev.metaKey);
      syncHostCanvasCursor();
      postToBridge('modifier_sync', {
        spaceHeld: Boolean(state.spaceHeld),
        altHeld: Boolean(state.altHeld),
        ctrlHeld: Boolean(state.ctrlHeld)
      });
      if (['INPUT', 'TEXTAREA'].includes(ev.target?.tagName)) {
        if (ev.key === 'Escape') {
          ev.target.blur();
          $('cmdPaletteModal').hidden = true;
        }
        return;
      }

      const ctrl = ev.ctrlKey || ev.metaKey;
      const k = ev.key.toLowerCase();

      if (ctrl && k === 'k') {
        ev.preventDefault();
        openCommandPalette();
      } else if (ctrl && k === 'e') {
        ev.preventDefault();
        setWorkspaceMode(state.mode === 'edit' ? 'live' : 'edit');
      } else if (ctrl && k === 's') {
        ev.preventDefault();
        triggerDirectHtmlSave();
      } else if (ctrl && k === 'z' && !ev.shiftKey) {
        ev.preventDefault();
        postToBridge('undo');
      } else if ((ctrl && k === 'y') || (ctrl && ev.shiftKey && k === 'z')) {
        ev.preventDefault();
        postToBridge('redo');
      } else if (ctrl && !ev.altKey && !ev.shiftKey && k === 'g') {
        ev.preventDefault();
        postToBridge('group');
      } else if (ctrl && (ev.altKey || ev.shiftKey) && k === 'g') {
        ev.preventDefault();
        postToBridge('ungroup');
      } else if (ctrl && ev.altKey && ev.code === 'Digit2') {
        ev.preventDefault();
        postToBridge('unlock_item', {});
      } else if (ctrl && !ev.altKey && ev.code === 'Digit2') {
        ev.preventDefault();
        postToBridge('toggle_entity_lock', {});
      } else if (ctrl && ev.code === 'BracketRight') {
        ev.preventDefault();
        postToBridge('arrange', { action: ev.shiftKey ? 'bring-front' : 'bring-forward' });
      } else if (ctrl && ev.code === 'BracketLeft') {
        ev.preventDefault();
        postToBridge('arrange', { action: ev.shiftKey ? 'send-back' : 'send-backward' });
      } else if (ctrl && k === 'c') {
        ev.preventDefault();
        postToBridge('clipboard', { action: 'copy' });
      } else if (ctrl && k === 'x') {
        ev.preventDefault();
        postToBridge('clipboard', { action: 'cut' });
      } else if (ctrl && k === 'v') {
        ev.preventDefault();
        postToBridge('clipboard', { action: 'paste' });
      } else if (ctrl && k === 'd') {
        ev.preventDefault();
        postToBridge('clipboard', { action: 'duplicate' });
      } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault();
        postToBridge('clipboard', { action: 'delete' });
      } else if (ev.shiftKey && k === 'x') {
        ev.preventDefault();
        swapFillAndStroke();
      } else if (!ctrl && !ev.altKey && ev.key === '/') {
        ev.preventDefault();
        applyUnfillToActiveProxy();
      } else if (ev.shiftKey && ev.code === 'Digit1') {
        ev.preventDefault();
        fitArtboardToStage();
      } else if (ctrl && ev.code === 'Digit0') {
        ev.preventDefault();
        setZoomAtPoint(1.0);
      } else if (ev.key === '?') {
        ev.preventDefault();
        $('shortcutsModal').hidden = !$('shortcutsModal').hidden;
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key) && state.mode === 'edit' && state.selection.count > 0) {
        ev.preventDefault();
        postToBridge('nudge_selection', { key: ev.key, shiftKey: Boolean(ev.shiftKey) });
      } else if (ev.key === 'Escape') {
        closeAllDropdowns();
        hideContextMenu();
        closeCustomColorPopover();
        $('cmdPaletteModal').hidden = true;
        $('prefsModal').hidden = true;
        $('shortcutsModal').hidden = true;
        closeFileDialog();
        if (state.isolation && state.isolation.active) {
          postToBridge('exit_isolation', { exitAll: false });
        } else {
          postToBridge('clear_selection');
        }
      } else if (!ctrl && !ev.altKey) {
        const toolKeys = { v: 'select', a: 'direct', e: 'transform', s: 'section', r: 'shape', d: 'div', t: 'text', i: 'eyedropper', m: 'marquee', n: 'note', h: 'hand', z: 'zoom' };
        if (toolKeys[k]) {
          ev.preventDefault();
          setActiveTool(toolKeys[k]);
        }
      }
    });

    window.addEventListener('keyup', (ev) => {
      if (ev.code === 'Space') state.spaceHeld = false;
      state.altHeld = Boolean(ev.altKey);
      state.ctrlHeld = Boolean(ev.ctrlKey || ev.metaKey);
      syncHostCanvasCursor();
      postToBridge('modifier_sync', {
        spaceHeld: Boolean(state.spaceHeld),
        altHeld: Boolean(state.altHeld),
        ctrlHeld: Boolean(state.ctrlHeld)
      });
    });
  }

  function renderGrammarIssues() {
    $('grammarCount').textContent = String(state.grammarIssues.length);
    const list = $('grammarList');
    list.innerHTML = '';
    if (!state.grammarIssues.length) {
      list.innerHTML = '<div class="empty-note">No spelling issues detected in visible text.</div>';
      return;
    }
    state.grammarIssues.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'grammar-item';
      row.innerHTML = `
        <div class="gr-row">
          <span><span class="gr-bad">${escapeHtml(it.bad)}</span> → <span class="gr-good">${escapeHtml(it.good)}</span></span>
          <span class="layer-badge">Fix</span>
        </div>
        <div class="gr-reason">${escapeHtml(it.reason)}</div>
      `;
      row.addEventListener('click', () => {
        postToBridge('fix_grammar', { items: [it] });
        state.grammarIssues = state.grammarIssues.filter((x) => x !== it);
        renderGrammarIssues();
      });
      list.appendChild(row);
    });
  }

  let bypassAnimTimer = null;
  function syncBypassButtonUI(animate = false) {
    const btn = $('btnBypassGates');
    if (!btn) return;
    const unlocked = Boolean(state.bypassGates);
    btn.classList.toggle('active', unlocked);
    btn.classList.toggle('is-unlocked', unlocked);
    btn.classList.toggle('is-locked', !unlocked);
    btn.setAttribute('aria-pressed', unlocked ? 'true' : 'false');
    btn.title = unlocked
      ? 'Unlocked = Bypass Auth/Pro gates active · Click to Lock (disable bypass)'
      : 'Locked = Bypass OFF (Auth/Pro gates enforced) · Click to Unlock (enable bypass)';
    if ($('bypassBtnLabel')) {
      $('bypassBtnLabel').textContent = unlocked ? 'Bypass Auth' : 'Gates Locked';
    }
    if (animate) {
      btn.classList.remove('anim-unlock', 'anim-lock');
      void btn.offsetWidth;
      btn.classList.add(unlocked ? 'anim-unlock' : 'anim-lock');
      clearTimeout(bypassAnimTimer);
      bypassAnimTimer = setTimeout(() => {
        btn.classList.remove('anim-unlock', 'anim-lock');
      }, 380);
    }
  }

  function syncTopbarPaletteUI(pal) {
    if (!pal) return;
    if (pal.primary && /^#[0-9a-f]{6}$/i.test(pal.primary)) {
      $('inpPrimaryColor').value = pal.primary;
    }
    if (pal.secondary && /^#[0-9a-f]{6}$/i.test(pal.secondary)) {
      $('inpSecondaryColor').value = pal.secondary;
    }
    if (pal.presetId) {
      state.activePreset = pal.presetId;
      const matched = UI_PRESETS.find((x) => x.id === pal.presetId);
      $('ddPresetLabel').textContent = matched ? matched.label : 'Theme: Custom';
    }
  }

  // Listen to messages from bridge.js inside iframe
  window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || !msg.__vc) return;

    switch (msg.type) {
      case 'vc_bridge_ready': {
        if (state.hasServerBackend && !state.vfsMode) {
          try {
            const locPath = previewFrame?.contentWindow?.location?.pathname || '';
            if (locPath.startsWith('/__vc_target/')) {
              const navRel = decodeURIComponent(locPath.slice('/__vc_target/'.length)).replace(/^\/+/, '');
              if (navRel && navRel !== state.entry) {
                state.entry = navRel;
                $('ddPageLabel').textContent = state.entry;
                state.activeCodeFile = state.entry;
                renderFileTreeUI();
                ensureFileContentLoaded(state.entry).then(() => renderCodeEditorUI(true));
              }
            }
          } catch (_) {}
        }
        if (msg.artboardRect) state.artboardMetrics = msg.artboardRect;
        if (msg.palette) syncTopbarPaletteUI(msg.palette);
        if (!state.hasManualViewport) fitArtboardToStage();
        else updateCanvasTransform();
        postToBridge('init_sync', {
          mode: state.mode,
          tool: state.tool,
          artboardWidth: state.artboardWidth,
          artboardHeight: state.artboardHeight,
          prefs: state.preferences,
          bypassEnabled: state.bypassGates,
          accelMode: state.effectiveAccel,
          notes: getNotesForCurrentEntry()
        });
        postToBridge('set_bypass', { enabled: state.bypassGates });
        postToBridge('set_accel_mode', { accelMode: state.effectiveAccel });
        if (state.pendingHashTarget) {
          const hashSel = state.pendingHashTarget;
          state.pendingHashTarget = '';
          setTimeout(() => {
            postToBridge('activate_view', { action: { kind: 'reveal', selector: hashSel } });
          }, 80);
        }
        syncPaintProxiesUI();
        break;
      }
      case 'vc_palette_sync': {
        syncTopbarPaletteUI(msg.palette);
        break;
      }
      case 'vc_state_sync': {
        state.sessions = msg.sessions || [];
        state.layers = msg.layers || [];
        state.domTree = msg.domTree || [];
        state.links = msg.links || [];
        state.isolation = msg.isolation || { active: false, stack: [] };
        state.selection = msg.selection || { count: 0, selectedIds: [], props: null };
        state.discoveredViews = msg.views || [];
        if (msg.artboardRect) {
          state.artboardMetrics = msg.artboardRect;
          updateCanvasTransform();
        }
        syncIsolationBarUI();
        renderSessionsAndLayers();
        populateInspectorFromSelection();
        break;
      }
      case 'vc_history_state': {
        updateHistoryAndOriginalButtons(msg.undoCount || 0, msg.redoCount || 0, Boolean(msg.dirty));
        break;
      }
      case 'vc_pan_iframe_down': {
        canvasScroll.classList.add('pan-dragging');
        break;
      }
      case 'vc_pan_iframe_up': {
        canvasScroll.classList.remove('pan-dragging');
        break;
      }
      case 'vc_pan_delta': {
        state.panX += (msg.dx || 0);
        state.panY += (msg.dy || 0);
        state.hasManualViewport = true;
        updateCanvasTransform();
        break;
      }
      case 'vc_wheel_zoom': {
        const frameRect = previewFrame.getBoundingClientRect();
        const scrollRect = canvasScroll.getBoundingClientRect();
        const stageX = (frameRect.left - scrollRect.left) + (msg.clientX || 0) * state.zoom;
        const stageY = (frameRect.top - scrollRect.top) + (msg.clientY || 0) * state.zoom;
        const factor = msg.deltaY < 0 ? 1.1 : 1 / 1.1;
        setZoomAtPoint(state.zoom * factor, stageX, stageY);
        break;
      }
      case 'vc_step_zoom': {
        const frameRect = previewFrame.getBoundingClientRect();
        const scrollRect = canvasScroll.getBoundingClientRect();
        const stageX = (frameRect.left - scrollRect.left) + (msg.clientX || 0) * state.zoom;
        const stageY = (frameRect.top - scrollRect.top) + (msg.clientY || 0) * state.zoom;
        const factor = msg.dir > 0 ? 1.25 : 0.8;
        setZoomAtPoint(state.zoom * factor, stageX, stageY);
        break;
      }
      case 'vc_contextmenu': {
        const frameRect = previewFrame.getBoundingClientRect();
        const studioX = frameRect.left + (msg.clientX || 0) * state.zoom;
        const studioY = frameRect.top + (msg.clientY || 0) * state.zoom;
        showContextMenuAt(studioX, studioY, msg);
        break;
      }
      case 'vc_eyedropper_pick': {
        const p = msg.paint || {};
        state.paint.fillMode = p.fillMode || 'solid';
        if (p.fillColor) state.paint.fillColor = p.fillColor;
        state.paint.strokeMode = p.strokeMode || 'none';
        if (p.strokeColor) state.paint.strokeColor = p.strokeColor;
        state.paint.strokeWidth = p.strokeWidth || 0;
        state.paint.strokeStyle = p.strokeStyle || 'solid';
        $('propBorderWidth').value = `${state.paint.strokeWidth}px`;
        $('ddStrokeStyleLabel').textContent = state.paint.strokeStyle;
        syncPaintProxiesUI();
        break;
      }
      case 'vc_tool_switched': {
        if (msg.tool) setActiveTool(msg.tool);
        break;
      }
      case 'vc_shortcut_save': {
        triggerDirectHtmlSave();
        break;
      }
      case 'vc_shortcut_unfill': {
        applyUnfillToActiveProxy();
        break;
      }
      case 'vc_shortcut_swap_paint': {
        swapFillAndStroke();
        break;
      }
      case 'vc_save_payload_ready': {
        const fn = pendingSaveResolvers.get(msg.requestId);
        if (fn) {
          pendingSaveResolvers.delete(msg.requestId);
          fn(msg.payload);
        }
        break;
      }
      case 'vc_corner_live': {
        if (typeof msg.radius === 'number' && msg.radius > 0) {
          state.shapeRadius = msg.radius;
        }
        if ($('propRadius') && document.activeElement !== $('propRadius')) {
          $('propRadius').value = `${msg.radius || 0}px`;
        }
        syncTopCornerControlBar(msg);
        break;
      }
      case 'vc_note_marked': {
        openNotePopup({
          selector: msg.selector,
          elementTag: msg.elementTag,
          sectionLabel: msg.sectionLabel || '',
          markRect: msg.markRect,
          enclosedElements: Array.isArray(msg.enclosedElements) ? msg.enclosedElements : [],
          htmlSnippet: msg.htmlSnippet || '',
          taskType: 'fix',
          text: ''
        });
        break;
      }
      case 'vc_open_note': {
        if (msg.note) openNotePopup(msg.note);
        break;
      }
      case 'vc_grammar_results': {
        state.grammarIssues = msg.issues || [];
        renderGrammarIssues();
        break;
      }
      case 'vc_vfs_navigate': {
        const codeSync = window.VectoraCodeSync;
        const rawHref = String(msg.href || '').trim();
        const hashIdx = rawHref.indexOf('#');
        const rawPath = (hashIdx >= 0 ? rawHref.slice(0, hashIdx) : rawHref).split('?')[0].trim();
        const rawHash = msg.hash || (hashIdx >= 0 ? rawHref.slice(hashIdx) : '');

        if (!rawPath && rawHash) {
          postToBridge('activate_view', { action: { kind: 'reveal', selector: rawHash } });
          break;
        }

        const cleanDirect = codeSync ? codeSync.normalizeRelPath(rawPath) : rawPath.replace(/^\.?\//, '');
        const resolvedRel = codeSync
          ? codeSync.resolveRelativeAssetPath(state.entry, rawPath)
          : cleanDirect;

        const candidates = [
          cleanDirect,
          resolvedRel,
          cleanDirect && !/\.html?$/i.test(cleanDirect) ? `${cleanDirect}.html` : '',
          resolvedRel && !/\.html?$/i.test(resolvedRel) ? `${resolvedRel}.html` : '',
          cleanDirect ? `${cleanDirect.replace(/\/+$/, '')}/index.html` : ''
        ].filter(Boolean);

        let matchedPage = candidates.find((c) => state.projectFiles[c] !== undefined);
        if (!matchedPage) {
          const lowerCands = candidates.map((c) => c.toLowerCase());
          matchedPage = state.htmlFiles.find((f) => lowerCands.includes(f.toLowerCase()));
        }
        if (!matchedPage && cleanDirect) {
          const base = cleanDirect.split('/').pop().toLowerCase();
          matchedPage = state.htmlFiles.find((f) => {
            const fb = f.split('/').pop().toLowerCase();
            return fb === base || fb === `${base}.html`;
          });
        }

        if (matchedPage) {
          state.pendingHashTarget = rawHash || '';
          loadEntryIntoIframe(matchedPage);
          showToast(`Navigated to ${matchedPage}${rawHash || ''}`);
        } else if (rawHash) {
          postToBridge('activate_view', { action: { kind: 'reveal', selector: rawHash } });
        }
        break;
      }
      case 'vc_agent_ack': {
        if (state.hasServerBackend) {
          fetch('/__vc_api/agent-ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
          }).catch(() => {});
        }
        break;
      }
    }
  });

  let sseConnected = false;
  function connectSseEvents() {
    if (sseConnected || !state.hasServerBackend) return;
    sseConnected = true;
    try {
      const es = new EventSource('/__vc_api/events');
      es.addEventListener('notes_updated', (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (Array.isArray(data.notes)) {
            state.notes = data.notes;
            renderNotesUI();
          }
        } catch (_) {}
      });
      es.addEventListener('target_switched', (ev) => {
        try {
          const data = JSON.parse(ev.data);
          bootStudio();
          if (data.entry) loadEntryIntoIframe(data.entry);
        } catch (_) {}
      });
      es.addEventListener('agent_command', (ev) => {
        try {
          const cmd = JSON.parse(ev.data);
          if (cmd.mode) setWorkspaceMode(cmd.mode);
          if (cmd.entry && cmd.entry !== state.entry) {
            loadEntryIntoIframe(cmd.entry);
          }
          postToBridge('agent_live_exec', { payload: cmd });
        } catch (_) {}
      });
    } catch (_) {}
  }

  function bootStandaloneWorkspace() {
    const codeSync = window.VectoraCodeSync;
    state.hasServerBackend = false;
    state.vfsMode = true;
    state.targetPath = '';

    let savedProj = null;
    try {
      const raw = localStorage.getItem(LS_STANDALONE_PROJ);
      if (raw) savedProj = JSON.parse(raw);
    } catch (_) {}

    if (savedProj && savedProj.projectFiles && Object.keys(savedProj.projectFiles).length) {
      state.projectName = savedProj.projectName || 'Vectora Studio Starter';
      state.projectFiles = savedProj.projectFiles;
      state.originFiles = savedProj.originFiles || { ...savedProj.projectFiles };
      state.entry = savedProj.entry || 'index.html';
    } else {
      const starter = codeSync
        ? codeSync.createStarterProjectFiles('Vectora Studio Starter')
        : { 'index.html': '<!doctype html><html><body><h1>Vectora Studio</h1></body></html>' };
      state.projectName = 'Vectora Studio Starter';
      state.projectFiles = starter;
      state.originFiles = { ...starter };
      state.entry = 'index.html';
      persistStandaloneVfsToStorage();
    }

    try {
      const rawPrefs = localStorage.getItem(LS_STANDALONE_PREFS);
      if (rawPrefs) {
        state.preferences = { ...state.preferences, ...JSON.parse(rawPrefs) };
      }
    } catch (_) {}

    state.notes = loadStandaloneNotesFromStorage();
    state.recentSessions = loadLocalRecentSessions();
    state.everEditedInSession = false;

    rebuildFileListsFromMap(state.projectFiles);
    if (!state.htmlFiles.includes(state.entry)) {
      state.entry = state.htmlFiles[0] || 'index.html';
    }
    state.activeCodeFile = state.entry;

    $('projectName').textContent = state.projectName;
    $('ddPageLabel').textContent = state.entry;
    $('prefScaleStrokes').checked = Boolean(state.preferences.scaleStrokesAndEffects);
    $('prefScaleCorners').checked = Boolean(state.preferences.scaleCorners);
    $('prefAutoSave').checked = Boolean(state.preferences.autoSave);
    $('prefKeyInc').value = `${state.preferences.keyboardIncrement || 1}px`;

    syncScaleModeUI();
    syncBypassButtonUI(false);
    syncAccelerationEngineUI();
    renderNotesUI();
    renderGradientEditorUI();
    loadEntryIntoIframe(state.entry);
    setTimeout(fitArtboardToStage, 220);
  }

  async function bootStudio() {
    try {
      const res = await fetch('/__vc_api/status', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        bootStandaloneWorkspace();
        return;
      }
      const data = await res.json();
      if (data && data.ok) {
        state.hasServerBackend = true;
        state.vfsMode = false;
        state.targetPath = data.target || '';
        state.projectName = data.projectName || 'Workspace';
        state.entry = data.entry || 'index.html';
        state.htmlFiles = data.files?.html?.length ? data.files.html : [state.entry];
        state.cssFiles = data.files?.css || [];
        state.jsFiles = data.files?.js || [];
        state.allFiles = data.files?.all?.length ? data.files.all : [...state.htmlFiles, ...state.cssFiles, ...state.jsFiles];
        state.preferences = { ...state.preferences, ...(data.preferences || {}) };
        state.ignoredWords = data.ignoredWords || [];
        state.notes = data.notes || [];
        state.everEditedInSession = false;

        try {
          const pfRes = await fetch('/__vc_api/project-files', { cache: 'no-store' });
          if (pfRes.ok) {
            const pf = await pfRes.json();
            if (pf && pf.ok) {
              state.projectFiles = pf.contents || {};
              state.originFiles = pf.origins || {};
              state.recentWorkspaces = pf.recentWorkspaces || [];
              state.recentSessions = pf.recentSessions || loadLocalRecentSessions();
              if (Object.keys(state.projectFiles).length) {
                rebuildFileListsFromMap(state.projectFiles);
              }
            }
          }
        } catch (_) {}

        $('projectName').textContent = state.projectName;
        $('ddPageLabel').textContent = state.entry;
        $('prefScaleStrokes').checked = Boolean(state.preferences.scaleStrokesAndEffects);
        $('prefScaleCorners').checked = Boolean(state.preferences.scaleCorners);
        $('prefAutoSave').checked = Boolean(state.preferences.autoSave);
        $('prefKeyInc').value = `${state.preferences.keyboardIncrement || 1}px`;

        connectSseEvents();
        syncScaleModeUI();
        syncBypassButtonUI(false);
        syncAccelerationEngineUI();
        renderNotesUI();
        renderGradientEditorUI();
        loadEntryIntoIframe(state.entry);
        setTimeout(fitArtboardToStage, 220);
        return;
      }
      bootStandaloneWorkspace();
    } catch (_) {
      bootStandaloneWorkspace();
    }
  }

  // Initialize everything
  state.gpuInfo = detectHardwareAcceleration();
  syncAccelerationEngineUI();
  syncBypassButtonUI(false);
  syncHostCanvasCursor();
  wireUiControls();
  wireMinimapAndOuterCanvasPanZoom();
  wireAllScrubbyNumberFields();
  wirePaintControls();
  wireCustomColorPopover();
  bootStudio();
})();
