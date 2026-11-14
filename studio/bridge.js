/**
 * Vectora Canvas — In-Iframe Direct-HTML Visual & Vector Engine (bridge.js)
 * Runs inside the target application's iframe.
 * - Grey Stone Pasteboard + 1920x1080 Full-Screen Artboard (no squeeze, overflow allowed)
 * - Reversible Undo/Redo stack across every edit (including after Save & Original restore)
 * - Surgical Direct-HTML Save serializer (inline styles, inserted divs/shapes, deleted tags, text, Google Fonts)
 * - Middle-click Hand pan & Ctrl+Space+Scroll / Ctrl+Scroll cursor-anchored zoom
 * - Plain <div> selection/resizing, Flow Div spacer tool (D), Convert Shape to Flow Div
 * - Shape tool (R), Eyedropper (I) sampling Fill/Gradient/Stroke/Text, Type tool (T) direct in-group editing
 * - Illustrator intersection marquee (selects lower objects), Named Sessions, Nested Grouping, Layer Locking
 * - Multi-selection Scaling: "Scale in Place" (default) & "Scale Normally" (shared anchor past artboard/session edge)
 */
(function () {
  if (window.__VC_BRIDGE_ACTIVE__) return;
  window.__VC_BRIDGE_ACTIVE__ = true;

  const BRIDGE_ATTR = 'data-vc-ui';
  const ARTBOARD_DEFAULT_W = 1920;
  const ARTBOARD_DEFAULT_H = 1080;

  let mode = 'edit'; // 'edit' | 'live'
  let activeTool = 'select'; // select | direct | transform | section | shape | div | text | eyedropper | marquee | note | hand | zoom
  let lastSelectionTool = 'select'; // 'select' | 'direct' — used for Illustrator Ctrl/Cmd temporary selection override
  let ctrlHeld = false;
  let activeShapeKind = 'rect'; // rect | rounded | ellipse | pill | line
  let artboardWidth = ARTBOARD_DEFAULT_W;
  let artboardHeight = ARTBOARD_DEFAULT_H;
  let showSmartGuides = true;
  let showNotePins = true;
  let autoGroupButtons = true;
  let alignKeyMode = '__bounds__'; // '__artboard__' | '__bounds__' | '__key__'
  let transformRefPoint = 'c'; // nw | n | ne | w | c | e | sw | s | se

  let prefs = {
    scaleStrokesAndEffects: true,
    scaleCorners: true,
    multiScaleMode: 'in-place', // 'in-place' | 'normal'
    keyboardIncrement: 1
  };

  // Active Paint state synced from studio.js for drawing new Shapes / Flow Divs
  let activePaint = {
    fillMode: 'solid', // solid | linear | radial | none
    fillColor: '#f97316',
    fillGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    strokeMode: 'solid', // solid | none
    strokeColor: '#78716c',
    strokeWidth: 1,
    strokeStyle: 'solid'
  };

  // Element identity & tracking
  let vcSeq = 1;
  const elById = new Map();
  const idByEl = new WeakMap();
  const initialStyleByEl = new WeakMap();
  const initialTextByEl = new WeakMap();
  const patchedPropsByEl = new Map(); // vcId -> Map<cssProp, value|null>
  const textPatchesByEl = new Map(); // vcId -> { id, selector, attr, before, after }
  const createdElements = new Set(); // Elements created via Shape/FlowDiv/Paste/Duplicate
  const deletedStaticRecords = new Map(); // vcId -> { id, selector, el, parent, nextSibling }

  // Selection, Key Object, Locking, Nested Composite Groups
  let selectedIds = []; // Leaf element vcIds currently selected
  let activeGroupSelectionId = null; // Optional top-level group id if a group is selected
  let keyObjectId = null;
  const lockedIds = new Set(); // Can contain element vcIds or groupIds
  let lastClickedLayerLockedId = null;

  let groupSeq = 1;
  // groupId -> { id, name, memberIds: string[] (element vcId or child groupId), parentGroupId: string|null }
  const groupsById = new Map();
  // memberId (vcId or groupId) -> parentGroupId
  const parentGroupOf = new Map();

  // Illustrator Group Isolation Mode stack: [{ id, kind: 'group'|'container', name }]
  const isolationStack = [];
  // Link / attribute patches: vcId -> { id, selector, attrs: { ... } }
  const attrPatchesByEl = new Map();
  const initialAttrsByEl = new WeakMap();
  // Hardware acceleration mode ('gpu' | 'cpu')
  let accelMode = typeof window.__VC_ACCEL_INIT__ === 'string' ? window.__VC_ACCEL_INIT__ : 'gpu';
  let flashHighlightRect = null;
  let flashHighlightTimer = null;

  // Named Sessions cache
  let namedSessions = []; // { sessionId, name, vcId, tabTriggerSelector, kind, tag, locked }
  let showAllSessionsOverlay = false;

  // Clipboard (internal vector/HTML clipboard)
  let clipboardItems = [];

  // Google Fonts & Theme CSS state
  const loadedGoogleFonts = new Set();
  let activeThemeCss = '';
  let activePalette = { primary: '', secondary: '', extraCss: '', presetId: 'original' };
  let pendingThemeBefore = null;
  let pagePaletteProfile = null;

  // Reversible History (NEVER cleared on Save!)
  const undoStack = [];
  const redoStack = [];
  // Saved / Original baseline snapshot (captures state at boot AND updates whenever Save is clicked)
  let savedBaseline = null;

  // Pointer interaction states
  let spaceHeld = false;
  let altHeld = false;
  let hoverId = null;
  let activeInlineEdit = null; // { el, vcId, beforeText, beforeHtml }
  let pointerAction = null; // Active drag/resize/marquee/shape/div/note/pan session
  let currentNotes = [];

  // =========================================================================
  // 1. INJECT BRIDGE OVERLAY & DARK PASTEBOARD CSS (ZERO BLUE, ZERO WHITE UI)
  // =========================================================================
  function injectBridgeStyles() {
    if (document.getElementById('__vc_bridge_css__')) return;
    const st = document.createElement('style');
    st.id = '__vc_bridge_css__';
    st.setAttribute('data-vc-bridge', 'true');
    st.textContent = `
      * {
        scrollbar-width: thin;
        scrollbar-color: #44403c #191817;
      }
      *::-webkit-scrollbar { width: 8px; height: 8px; }
      *::-webkit-scrollbar-track { background: #191817; }
      *::-webkit-scrollbar-thumb { background: #44403c; border-radius: 4px; border: 1px solid #191817; }
      *::-webkit-scrollbar-thumb:hover { background: #57534e; }

      :where(html.__vc_pasteboard__) {
        margin: 0;
        padding: 0;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
      }
      :where(html.__vc_pasteboard__) > :where(body) {
        width: 100%;
        min-height: 100%;
        margin: 0;
        position: relative;
        box-sizing: border-box;
      }
      html.__vc_edit_mode__,
      html.__vc_edit_mode__ *,
      html.__vc_edit_mode__ *::before,
      html.__vc_edit_mode__ *::after {
        animation-play-state: paused !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      html.__vc_edit_mode__ .vc-flow-div {
        outline: 1px dashed rgba(249, 115, 22, 0.55);
        outline-offset: -1px;
        background-image: repeating-linear-gradient(-45deg, rgba(249,115,22,0.05) 0 6px, transparent 6px 12px);
      }
      :root {
        --vc-cur-select: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 2.5L16.5 12.2L10.8 13.1L13.6 19L11.2 20.1L8.4 14.2L4 17.8V2.5Z' fill='%23141413' stroke='%23fafaf9' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 4 2, default;
        --vc-cur-direct: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 2.5L16.5 12.2L10.8 13.1L13.6 19L11.2 20.1L8.4 14.2L4 17.8V2.5Z' fill='%23fafaf9' stroke='%23141413' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 4 2, default;
        --vc-cur-transform: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3.5 2.5L13.5 10.2L9 11L11.1 15.6L9.3 16.4L7.2 11.8L3.5 14.8V2.5Z' fill='%23141413' stroke='%23fafaf9' stroke-width='1.3' stroke-linejoin='round'/%3E%3Crect x='13.5' y='13.5' width='7.5' height='7.5' fill='none' stroke='%23f97316' stroke-width='1.6'/%3E%3Crect x='12.5' y='12.5' width='2.5' height='2.5' fill='%23fafaf9' stroke='%23141413' stroke-width='0.8'/%3E%3Crect x='19.5' y='19.5' width='2.5' height='2.5' fill='%23fafaf9' stroke='%23141413' stroke-width='0.8'/%3E%3C/svg%3E") 3 2, default;
        --vc-cur-crosshair: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 3v6M12 15v6M3 12h6M15 12h6' stroke='%23141413' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M12 3v6M12 15v6M3 12h6M15 12h6' stroke='%23fafaf9' stroke-width='1.4' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23f97316'/%3E%3C/svg%3E") 12 12, crosshair;
        --vc-cur-section: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='4.5' y='4.5' width='15' height='15' fill='none' stroke='%23141413' stroke-width='2.6' stroke-dasharray='3 2'/%3E%3Crect x='4.5' y='4.5' width='15' height='15' fill='none' stroke='%23f97316' stroke-width='1.4' stroke-dasharray='3 2'/%3E%3Cpath d='M12 8v8M8 12h8' stroke='%23fafaf9' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, crosshair;
        --vc-cur-text: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='3.5' y='3.5' width='17' height='17' rx='1.5' fill='rgba(20,20,19,0.38)' stroke='%23fafaf9' stroke-width='1.1' stroke-dasharray='2 2'/%3E%3Cpath d='M8.5 6.5h7M12 6.5v11M9.2 17.5h5.6' fill='none' stroke='%23141413' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M8.5 6.5h7M12 6.5v11M9.2 17.5h5.6' fill='none' stroke='%23fafaf9' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, text;
        --vc-cur-eyedropper: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M16.2 3.4a2.6 2.6 0 0 1 3.7 3.7l-2.3 2.3-3.7-3.7 2.3-2.3ZM12.7 6.9l3.7 3.7-7.8 7.8-4.6 1.6 1.6-4.6 7.1-8.5Z' fill='%23fafaf9' stroke='%23141413' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M11.6 5.8l5.9 5.9' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='3.2' cy='20.8' r='1.3' fill='%23f97316' stroke='%23141413' stroke-width='0.8'/%3E%3C/svg%3E") 3 21, crosshair;
        --vc-cur-hand: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M8.5 11V5.2a1.3 1.3 0 0 1 2.6 0V10m0 0V4a1.3 1.3 0 0 1 2.6 0v6m0 0V5.2a1.3 1.3 0 0 1 2.6 0v5.5m0 0V7.5a1.3 1.3 0 0 1 2.6 0v6.7a6 6 0 0 1-6 6h-2.2a5.5 5.5 0 0 1-4.7-2.6l-2.1-3.5a1.4 1.4 0 0 1 2.2-1.6l1.8 1.8V11Z' fill='%23fafaf9' stroke='%23141413' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 12 12, grab;
        --vc-cur-hand-grab: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M7.5 11.5a1.4 1.4 0 0 1 2.7-.4 1.4 1.4 0 0 1 2.7-.2 1.4 1.4 0 0 1 2.7.2 1.4 1.4 0 0 1 2.6.8v3.3a5.5 5.5 0 0 1-5.5 5.5h-2a5 5 0 0 1-4.4-2.6l-1.5-2.7a1.3 1.3 0 0 1 2-1.5l.7.6v-1Z' fill='%23fafaf9' stroke='%23141413' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 12 12, grabbing;
        --vc-cur-note: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4.5 4h14a1.8 1.8 0 0 1 1.8 1.8v9a1.8 1.8 0 0 1-1.8 1.8H9.8L4.5 21v-4.4A1.8 1.8 0 0 1 3 14.8v-9A1.8 1.8 0 0 1 4.5 4Z' fill='%23f97316' stroke='%23141413' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M7.2 8.5h8.5M7.2 12h5.5' stroke='%23fafaf9' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E") 4 21, crosshair;
        --vc-cur-zoom-in: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='10' cy='10' r='6.5' fill='rgba(20,20,19,0.65)' stroke='%23fafaf9' stroke-width='1.8'/%3E%3Cpath d='M15 15l5.2 5.2' stroke='%23141413' stroke-width='3.4' stroke-linecap='round'/%3E%3Cpath d='M15 15l5.2 5.2' stroke='%23fafaf9' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M10 7.2v5.6M7.2 10h5.6' stroke='%23fafaf9' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E") 10 10, zoom-in;
        --vc-cur-zoom-out: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='10' cy='10' r='6.5' fill='rgba(20,20,19,0.65)' stroke='%23fafaf9' stroke-width='1.8'/%3E%3Cpath d='M15 15l5.2 5.2' stroke='%23141413' stroke-width='3.4' stroke-linecap='round'/%3E%3Cpath d='M15 15l5.2 5.2' stroke='%23fafaf9' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M7.2 10h5.6' stroke='%23fafaf9' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E") 10 10, zoom-out;
      }
      html[data-vc-cursor="hand-grab"],
      html[data-vc-cursor="hand-grab"] * {
        cursor: var(--vc-cur-hand-grab) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="select"],
      html.__vc_edit_mode__[data-vc-cursor="select"] *:not([data-vc-ui]):not([contenteditable="true"].__vc_typing__) {
        cursor: var(--vc-cur-select) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="direct"],
      html.__vc_edit_mode__[data-vc-cursor="direct"] *:not([data-vc-ui]):not([contenteditable="true"].__vc_typing__) {
        cursor: var(--vc-cur-direct) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="transform"],
      html.__vc_edit_mode__[data-vc-cursor="transform"] *:not([data-vc-ui]):not([contenteditable="true"].__vc_typing__) {
        cursor: var(--vc-cur-transform) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="section"],
      html.__vc_edit_mode__[data-vc-cursor="section"] *:not([data-vc-ui]):not([contenteditable="true"].__vc_typing__) {
        cursor: var(--vc-cur-section) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="shape"],
      html.__vc_edit_mode__[data-vc-cursor="shape"] *:not([data-vc-ui]),
      html.__vc_edit_mode__[data-vc-cursor="div"],
      html.__vc_edit_mode__[data-vc-cursor="div"] *:not([data-vc-ui]),
      html.__vc_edit_mode__[data-vc-cursor="marquee"],
      html.__vc_edit_mode__[data-vc-cursor="marquee"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-crosshair) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="text"],
      html.__vc_edit_mode__[data-vc-cursor="text"] *:not([data-vc-ui]):not([contenteditable="true"].__vc_typing__) {
        cursor: var(--vc-cur-text) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="eyedropper"],
      html.__vc_edit_mode__[data-vc-cursor="eyedropper"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-eyedropper) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="hand"],
      html.__vc_edit_mode__[data-vc-cursor="hand"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-hand) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="note"],
      html.__vc_edit_mode__[data-vc-cursor="note"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-note) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="zoom"],
      html.__vc_edit_mode__[data-vc-cursor="zoom"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-zoom-in) !important;
      }
      html.__vc_edit_mode__[data-vc-cursor="zoom-out"],
      html.__vc_edit_mode__[data-vc-cursor="zoom-out"] *:not([data-vc-ui]) {
        cursor: var(--vc-cur-zoom-out) !important;
      }
      html.__vc_edit_mode__ [contenteditable="true"].__vc_typing__ {
        outline: 2px solid #f97316 !important;
        outline-offset: 2px !important;
        cursor: text !important;
      }
      html[data-vc-preview-unlocked="true"] [data-pro-only]:not(.modal):not([role="dialog"]):not([hidden]),
      html[data-vc-preview-unlocked="true"] [data-pro-locked]:not(.modal):not([role="dialog"]):not([hidden]),
      html[data-vc-preview-unlocked="true"] [data-requires-auth]:not(.modal):not([role="dialog"]):not([hidden]),
      html[data-vc-preview-unlocked="true"] [data-auth-required]:not(.modal):not([role="dialog"]):not([hidden]),
      html[data-vc-preview-unlocked="true"] .pro-only:not(.modal):not([role="dialog"]):not([hidden]),
      html[data-vc-preview-unlocked="true"] .pro-locked:not(.modal):not([role="dialog"]):not([hidden]) {
        display: block !important;
      }
      #__vc_overlay_root__ {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483640;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .__vc_hover_box__ {
        position: fixed;
        border: 1px solid rgba(249, 115, 22, 0.78);
        pointer-events: none;
        border-radius: 2px;
      }
      .__vc_hover_tag__ {
        position: absolute;
        left: -1px;
        top: -19px;
        background: #242321;
        color: #f97316;
        border: 1px solid rgba(249, 115, 22, 0.6);
        font-size: 10px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 3px;
        white-space: nowrap;
      }
      .__vc_sel_box__ {
        position: fixed;
        border: 1.5px solid #f97316;
        pointer-events: none;
      }
      .__vc_sel_box__.is-key {
        border: 2.5px solid #fb923c;
        box-shadow: 0 0 0 1px #151413;
      }
      .__vc_sel_label__ {
        position: absolute;
        left: -1px;
        top: -20px;
        background: #f97316;
        color: #141312;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 3px;
        white-space: nowrap;
      }
      .__vc_handle__ {
        position: fixed;
        width: 8px;
        height: 8px;
        background: #ece9e5;
        border: 1.5px solid #f97316;
        border-radius: 1.5px;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        z-index: 2147483645;
      }
      .__vc_handle__:hover {
        background: #f97316;
      }
      .__vc_rot_handle__ {
        position: fixed;
        width: 10px;
        height: 10px;
        background: #f97316;
        border: 1.5px solid #151413;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: grab;
        z-index: 2147483645;
      }
      .__vc_anchor_dot__ {
        position: fixed;
        width: 8px;
        height: 8px;
        border: 2px solid #f97316;
        background: #151413;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .__vc_marquee__ {
        position: fixed;
        border: 1px dashed #f97316;
        background: rgba(249, 115, 22, 0.12);
        pointer-events: none;
      }
      .__vc_guide_line__ {
        position: fixed;
        background: #f97316;
        pointer-events: none;
      }
      .__vc_measure_pill__ {
        position: fixed;
        background: #f97316;
        color: #141312;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 3px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        white-space: nowrap;
      }
      .__vc_session_frame__ {
        position: fixed;
        border: 1.5px dashed rgba(249, 115, 22, 0.72);
        background: rgba(249, 115, 22, 0.04);
        pointer-events: none;
        border-radius: 5px;
      }
      .__vc_session_pill__ {
        position: absolute;
        left: 6px;
        top: 6px;
        background: #242321;
        color: #f97316;
        border: 1px solid rgba(249, 115, 22, 0.65);
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 3px;
        pointer-events: auto;
        cursor: pointer;
      }
      .__vc_drop_line__ {
        position: fixed;
        background: #f97316;
        box-shadow: 0 0 8px rgba(249, 115, 22, 0.8);
        pointer-events: none;
        border-radius: 2px;
      }
      .__vc_note_pin__ {
        position: fixed;
        min-width: 20px;
        height: 20px;
        background: #f97316;
        color: #141312;
        border: 1.5px solid #151413;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.55);
      }
      .__vc_artboard_badge__ {
        position: fixed;
        background: #242321;
        color: #a8a29e;
        border: 1px solid #363330;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 3px;
        pointer-events: none;
      }
      html.__vc_edit_mode__ [data-vc-iso-dim="1"] {
        opacity: 0.2 !important;
        filter: saturate(0.45) !important;
        pointer-events: none !important;
      }
      .__vc_iso_frame__ {
        position: fixed;
        border: 1.5px dashed rgba(249, 115, 22, 0.85);
        box-shadow: 0 0 0 1px rgba(20, 19, 18, 0.65);
        pointer-events: none;
        border-radius: 3px;
      }
      .__vc_link_flash__ {
        position: fixed;
        border: 2.5px solid #fb923c;
        background: rgba(249, 115, 22, 0.16);
        border-radius: 4px;
        pointer-events: none;
      }
      html[data-vc-accel="gpu"] #__vc_overlay_root__ {
        will-change: contents;
      }
    `;
    (document.head || document.documentElement).appendChild(st);
  }

  let overlayRoot = null;
  function ensureOverlayRoot() {
    if (overlayRoot && overlayRoot.isConnected) return overlayRoot;
    overlayRoot = document.getElementById('__vc_overlay_root__');
    if (!overlayRoot) {
      overlayRoot = document.createElement('div');
      overlayRoot.id = '__vc_overlay_root__';
      overlayRoot.setAttribute(BRIDGE_ATTR, '1');
      (document.body || document.documentElement).appendChild(overlayRoot);
    }
    return overlayRoot;
  }

  let frozenWindowScroll = { x: 0, y: 0 };
  let frozenElementScrolls = new WeakMap();
  let restoringFrozenScroll = false;
  const pausedWebAnimations = new Set();

  function captureEditFreezeState() {
    frozenWindowScroll = { x: window.scrollX || 0, y: window.scrollY || 0 };
    frozenElementScrolls = new WeakMap();
    if (document.body) {
      const all = document.body.querySelectorAll('*');
      for (const el of all) {
        if (isBridgeNode(el)) continue;
        if (el.scrollTop > 0 || el.scrollLeft > 0 || el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
          frozenElementScrolls.set(el, { top: el.scrollTop, left: el.scrollLeft });
        }
      }
    }
    try {
      if (typeof document.getAnimations === 'function') {
        for (const anim of document.getAnimations()) {
          if (anim.playState === 'running') {
            anim.pause();
            pausedWebAnimations.add(anim);
          }
        }
      }
    } catch (_) {}
    try {
      document.querySelectorAll('video, audio').forEach((media) => {
        if (!media.paused) {
          media.setAttribute('data-vc-was-playing', '1');
          media.pause();
        }
      });
    } catch (_) {}
    if (typeof window.__vcSetFrozen === 'function') {
      window.__vcSetFrozen(true);
    }
  }

  function releaseEditFreezeState() {
    if (typeof window.__vcSetFrozen === 'function') {
      window.__vcSetFrozen(false);
    }
    try {
      for (const anim of pausedWebAnimations) {
        try {
          anim.play();
        } catch (_) {}
      }
      pausedWebAnimations.clear();
    } catch (_) {}
    try {
      document.querySelectorAll('video[data-vc-was-playing="1"], audio[data-vc-was-playing="1"]').forEach((media) => {
        media.removeAttribute('data-vc-was-playing');
        const p = media.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      });
    } catch (_) {}
  }

  function applyArtboardMode() {
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--vc-artboard-w', `${artboardWidth}px`);
    root.style.setProperty('--vc-artboard-h', `${artboardHeight}px`);
    root.setAttribute('data-vc-accel', accelMode || 'gpu');
    root.classList.add('__vc_pasteboard__');
    if (mode === 'edit') {
      root.classList.add('__vc_edit_mode__');
      captureEditFreezeState();
    } else {
      root.classList.remove('__vc_edit_mode__');
      releaseEditFreezeState();
    }
  }

  function sendToStudio(msg) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ __vc: true, ...msg }, '*');
      }
    } catch (_) {}
  }

  // =========================================================================
  // 2. ELEMENT IDENTITY, SELECTORS & LOCK / GROUP HELPERS
  // =========================================================================
  function isBridgeNode(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.id === '__vc_overlay_root__' || el.id === '__vc_bridge_css__') return true;
    if (el.hasAttribute(BRIDGE_ATTR) || el.hasAttribute('data-vc-bridge')) return true;
    if (el.closest && el.closest('#__vc_overlay_root__')) return true;
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'link', 'meta', 'head', 'title', 'noscript'].includes(tag)) return true;
    return false;
  }

  function ensureVcId(el) {
    if (!el || el.nodeType !== 1 || isBridgeNode(el)) return null;
    let id = idByEl.get(el);
    if (!id) {
      id = `vc_${vcSeq++}`;
      idByEl.set(el, id);
      elById.set(id, el);
      if (!initialStyleByEl.has(el)) {
        initialStyleByEl.set(el, el.getAttribute('style') || '');
      }
      if (!initialTextByEl.has(el) && el.children.length === 0) {
        initialTextByEl.set(el, el.textContent || '');
      }
    }
    return id;
  }

  function getEl(vcId) {
    const el = elById.get(vcId);
    return el && el.isConnected ? el : null;
  }

  function computeCleanSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id && !el.id.startsWith('vc_')) {
      return `#${CSS.escape(el.id)}`;
    }
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== 'html') {
      const tag = cur.tagName.toLowerCase();
      if (cur.id && !cur.id.startsWith('vc_')) {
        parts.unshift(`#${CSS.escape(cur.id)}`);
        break;
      }
      if (tag === 'body') {
        parts.unshift('body');
        break;
      }
      let seg = tag;
      const validClasses = Array.from(cur.classList || []).filter(
        (c) => c && !c.startsWith('__vc_') && c !== 'vc-selected'
      );
      if (validClasses.length) {
        seg += '.' + validClasses.slice(0, 2).map((c) => CSS.escape(c)).join('.');
      }
      if (cur.parentElement) {
        const sameTagSibs = Array.from(cur.parentElement.children).filter(
          (s) => s.tagName === cur.tagName && !isBridgeNode(s)
        );
        if (sameTagSibs.length > 1) {
          seg += `:nth-of-type(${sameTagSibs.indexOf(cur) + 1})`;
        }
      }
      parts.unshift(seg);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function getActiveIsolation() {
    while (isolationStack.length > 0) {
      const top = isolationStack[isolationStack.length - 1];
      if (top.kind === 'group' && groupsById.has(top.id)) return top;
      if (top.kind === 'container' && getEl(top.id)) return top;
      isolationStack.pop();
    }
    return null;
  }

  function getIsolatedRootElements(iso = getActiveIsolation()) {
    if (!iso) return [];
    if (iso.kind === 'container') {
      const el = getEl(iso.id);
      return el ? [el] : [];
    }
    const leaves = expandGroupLeafIds(iso.id, []).map(getEl).filter(Boolean);
    return leaves.filter((el) => !leaves.some((other) => other !== el && other.contains(el)));
  }

  function getIsolatedBounds() {
    const roots = getIsolatedRootElements();
    if (!roots.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of roots) {
      const r = el.getBoundingClientRect();
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }
    if (!isFinite(minX)) return null;
    return { left: minX, top: minY, right: maxX, bottom: maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
  }

  function isElementInsideActiveIsolation(el) {
    const iso = getActiveIsolation();
    if (!iso) return true;
    if (!el || isBridgeNode(el)) return false;
    const roots = getIsolatedRootElements(iso);
    return roots.some((rootEl) => rootEl === el || rootEl.contains(el));
  }

  function syncIsolationDimming() {
    document.querySelectorAll('[data-vc-iso-dim="1"]').forEach((n) => n.removeAttribute('data-vc-iso-dim'));
    const iso = getActiveIsolation();
    if (!iso || mode !== 'edit' || !document.body) return;
    const roots = getIsolatedRootElements(iso);
    if (!roots.length) return;

    const dimDisjointSubtrees = (parent) => {
      for (const ch of Array.from(parent.children || [])) {
        if (isBridgeNode(ch)) continue;
        if (roots.includes(ch)) continue;
        if (roots.some((rEl) => ch.contains(rEl))) {
          dimDisjointSubtrees(ch);
        } else {
          ch.setAttribute('data-vc-iso-dim', '1');
        }
      }
    };
    dimDisjointSubtrees(document.body);
  }

  function enterIsolationMode(entryObj, initialSelectEl = null) {
    if (!entryObj || !entryObj.id) return false;
    const cur = getActiveIsolation();
    if (cur && cur.id === entryObj.id) return false;
    isolationStack.push({
      id: entryObj.id,
      kind: entryObj.kind || 'group',
      name: entryObj.name || entryObj.id
    });
    activeGroupSelectionId = null;
    if (initialSelectEl && isElementInsideActiveIsolation(initialSelectEl)) {
      const vid = ensureVcId(initialSelectEl);
      selectedIds = vid ? [vid] : [];
    } else {
      selectedIds = [];
    }
    syncIsolationDimming();
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function exitIsolationMode(exitAll = false) {
    if (!isolationStack.length) return false;
    let exited = null;
    if (exitAll) {
      exited = isolationStack[0];
      isolationStack.length = 0;
    } else {
      exited = isolationStack.pop();
    }
    syncIsolationDimming();
    if (exited) {
      if (exited.kind === 'group' && groupsById.has(exited.id)) {
        activeGroupSelectionId = exited.id;
        selectedIds = expandGroupLeafIds(exited.id, []);
      } else if (exited.kind === 'container' && getEl(exited.id)) {
        activeGroupSelectionId = null;
        selectedIds = [exited.id];
      }
    }
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function getTopmostGroupOf(memberId, ignoreIsolation = false) {
    const activeIso = !ignoreIsolation ? getActiveIsolation() : null;
    const stopGroup = activeIso && activeIso.kind === 'group' ? activeIso.id : null;

    const resolveChainFrom = (startId) => {
      let cur = startId;
      let topGroup = null;
      const guard = new Set();
      while (parentGroupOf.has(cur) && !guard.has(cur)) {
        guard.add(cur);
        const pg = parentGroupOf.get(cur);
        if (!groupsById.has(pg)) break;
        if (stopGroup && pg === stopGroup) break;
        topGroup = pg;
        cur = pg;
      }
      return topGroup;
    };

    const directGrp = resolveChainFrom(memberId);
    if (directGrp) return directGrp;

    // Also walk DOM ancestors in case a parent <div>/card was grouped and user clicked an inner tag!
    const el = getEl(memberId);
    if (el) {
      const isoRoots = activeIso ? getIsolatedRootElements(activeIso) : [];
      let p = el.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        if (isoRoots.includes(p) && activeIso.kind === 'container') break;
        const pid = idByEl.get(p);
        if (pid) {
          if (stopGroup && groupsById.get(stopGroup)?.memberIds.includes(pid)) {
            return null;
          }
          const ancGrp = resolveChainFrom(pid);
          if (ancGrp) return ancGrp;
        }
        p = p.parentElement;
      }
    }
    return null;
  }

  function expandGroupLeafIds(groupId, out = []) {
    const grp = groupsById.get(groupId);
    if (!grp) return out;
    for (const m of grp.memberIds) {
      if (groupsById.has(m)) {
        expandGroupLeafIds(m, out);
      } else if (getEl(m)) {
        if (!out.includes(m)) out.push(m);
      }
    }
    return out;
  }

  function isEntityLocked(id) {
    if (!id) return false;
    if (lockedIds.has(id)) return true;
    // Check parent composite groups
    let cur = id;
    const seen = new Set();
    while (parentGroupOf.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      const pg = parentGroupOf.get(cur);
      if (lockedIds.has(pg)) return true;
      cur = pg;
    }
    // Check DOM ancestors
    const el = getEl(id);
    if (el) {
      let p = el.parentElement;
      while (p && p !== document.body && p !== document.documentElement) {
        const pid = idByEl.get(p);
        if (pid && lockedIds.has(pid)) return true;
        p = p.parentElement;
      }
    }
    return false;
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected || isBridgeNode(el)) return false;
    if (el.hidden) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (el.id === 'vpLoadingScreen' || el.id === 'vpSkeletonScreen') {
      if (el.classList.contains('is-hidden')) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  }

  // =========================================================================
  // 3. REVERSIBLE TRANSACTION HISTORY + SAVED / ORIGINAL BOOKMARK
  // =========================================================================
  function syncAuthoritativeStyleRules() {
    let tag = document.getElementById('__vc_authoritative_css__');
    const rules = [];
    for (const [vcId, propMap] of patchedPropsByEl.entries()) {
      const el = getEl(vcId);
      if (!el || !propMap || !propMap.size) continue;
      const w = propMap.get('width');
      const h = propMap.get('height');
      const tr = propMap.get('transform');
      const disp = propMap.get('display');
      const unfillFill = el.getAttribute('data-vc-unfill-fill') === '1' || propMap.get('background') === 'none';
      const unfillStroke = el.getAttribute('data-vc-unfill-stroke') === '1' || propMap.get('border-style') === 'none';
      if (!w && !h && !tr && !disp && !unfillFill && !unfillStroke) continue;
      const sel = computeCleanSelector(el);
      if (!sel) continue;
      const decls = [];
      if (w || h) {
        decls.push('box-sizing: border-box !important', 'flex-shrink: 0 !important');
      }
      if (w) {
        decls.push(`width: ${w} !important`, 'max-width: none !important');
      }
      if (h) {
        decls.push(`height: ${h} !important`, `min-height: ${h} !important`, `max-height: ${h} !important`);
      }
      if (disp) {
        decls.push(`display: ${disp} !important`);
      }
      if (tr) {
        decls.push(`transform: ${tr} !important`);
      }
      if (unfillFill) {
        decls.push('background: none !important', 'background-color: transparent !important', 'background-image: none !important');
      }
      if (unfillStroke) {
        decls.push('border: none !important', 'border-width: 0px !important');
      }
      if (decls.length) {
        rules.push(`${sel} { ${decls.join('; ')}; }`);
      }
    }
    if (!rules.length) {
      if (tag) tag.textContent = '';
      return;
    }
    if (!tag) {
      tag = document.createElement('style');
      tag.id = '__vc_authoritative_css__';
      tag.setAttribute('data-vc-bridge', 'true');
      (document.head || document.documentElement).appendChild(tag);
    }
    tag.textContent = rules.join('\n');
  }

  function recordPatchedProp(el, prop, val) {
    const id = ensureVcId(el);
    if (!id) return;
    if (!patchedPropsByEl.has(id)) patchedPropsByEl.set(id, new Map());
    patchedPropsByEl.get(id).set(prop, val === '' || val === undefined ? null : val);
    if (
      prop === 'width' ||
      prop === 'height' ||
      prop === 'transform' ||
      prop === 'display' ||
      prop === 'background' ||
      prop === 'background-color' ||
      prop === 'background-image' ||
      prop === 'border' ||
      prop === 'border-width' ||
      prop === 'border-style'
    ) {
      syncAuthoritativeStyleRules();
    }
  }

  function snapshotElementState(el) {
    const id = ensureVcId(el);
    const propMap = patchedPropsByEl.get(id);
    return {
      vcId: id,
      el,
      cssText: el.getAttribute('style') || '',
      unfillFill: el.getAttribute('data-vc-unfill-fill') || '',
      unfillStroke: el.getAttribute('data-vc-unfill-stroke') || '',
      tx: el.getAttribute('data-vc-tx') || '',
      ty: el.getAttribute('data-vc-ty') || '',
      rot: el.getAttribute('data-vc-rot') || '',
      patchedProps: propMap ? new Map(propMap) : new Map()
    };
  }

  function applyElementSnapshot(snap) {
    if (!snap || !snap.el) return;
    if (snap.cssText) snap.el.setAttribute('style', snap.cssText);
    else snap.el.removeAttribute('style');
    if (snap.unfillFill) snap.el.setAttribute('data-vc-unfill-fill', snap.unfillFill);
    else snap.el.removeAttribute('data-vc-unfill-fill');
    if (snap.unfillStroke) snap.el.setAttribute('data-vc-unfill-stroke', snap.unfillStroke);
    else snap.el.removeAttribute('data-vc-unfill-stroke');
    if (snap.tx) snap.el.setAttribute('data-vc-tx', snap.tx);
    else snap.el.removeAttribute('data-vc-tx');
    if (snap.ty) snap.el.setAttribute('data-vc-ty', snap.ty);
    else snap.el.removeAttribute('data-vc-ty');
    if (snap.rot) snap.el.setAttribute('data-vc-rot', snap.rot);
    else snap.el.removeAttribute('data-vc-rot');
    if (snap.patchedProps && snap.patchedProps.size) {
      patchedPropsByEl.set(snap.vcId, new Map(snap.patchedProps));
    } else {
      patchedPropsByEl.delete(snap.vcId);
    }
    syncAuthoritativeStyleRules();
  }

  function snapshotGroupsState() {
    const grps = [];
    for (const [k, v] of groupsById.entries()) {
      grps.push([k, { id: v.id, name: v.name, memberIds: [...v.memberIds], parentGroupId: v.parentGroupId }]);
    }
    return {
      groups: grps,
      parents: Array.from(parentGroupOf.entries())
    };
  }

  function restoreGroupsState(snap) {
    groupsById.clear();
    parentGroupOf.clear();
    if (!snap) return;
    for (const [k, v] of snap.groups) {
      groupsById.set(k, { id: v.id, name: v.name, memberIds: [...v.memberIds], parentGroupId: v.parentGroupId });
    }
    for (const [m, p] of snap.parents) {
      parentGroupOf.set(m, p);
    }
  }

  function pushHistoryStep(step) {
    if (!step || !Array.isArray(step.entries) || !step.entries.length) return;
    undoStack.push(step);
    redoStack.length = 0;
    notifyHistoryAndDirty();
  }

  function applyHistoryEntry(entry, direction) {
    const isUndo = direction === 'undo';
    switch (entry.kind) {
      case 'style': {
        applyElementSnapshot(isUndo ? entry.before : entry.after);
        break;
      }
      case 'attr': {
        const el = entry.el;
        if (!el) break;
        const mapToApply = isUndo ? entry.beforeAttrs : entry.afterAttrs;
        const id = ensureVcId(el);
        for (const [attrName, attrVal] of Object.entries(mapToApply || {})) {
          if (attrVal === null || attrVal === undefined || attrVal === '') {
            el.removeAttribute(attrName);
          } else {
            el.setAttribute(attrName, String(attrVal));
          }
        }
        const origMap = initialAttrsByEl.get(el) || {};
        const diffAttrs = {};
        let hasDiff = false;
        for (const k of Object.keys(mapToApply || {})) {
          const curVal = el.hasAttribute(k) ? el.getAttribute(k) : null;
          const origVal = origMap[k] !== undefined ? origMap[k] : null;
          if (curVal !== origVal) {
            diffAttrs[k] = curVal;
            hasDiff = true;
          }
        }
        if (hasDiff) {
          attrPatchesByEl.set(id, {
            id: el.id && !el.id.startsWith('vc_') ? el.id : '',
            selector: computeCleanSelector(el),
            attrs: diffAttrs
          });
        } else {
          attrPatchesByEl.delete(id);
        }
        break;
      }
      case 'text': {
        const el = entry.el;
        if (!el) break;
        const val = isUndo ? entry.beforeText : entry.afterText;
        if (entry.attr) {
          el.setAttribute(entry.attr, val);
        } else if (entry.beforeHtml !== undefined && entry.afterHtml !== undefined) {
          el.innerHTML = isUndo ? entry.beforeHtml : entry.afterHtml;
        } else {
          el.textContent = val;
        }
        const id = ensureVcId(el);
        if (val === entry.originText) {
          textPatchesByEl.delete(id);
        } else {
          textPatchesByEl.set(id, {
            id: el.id && !el.id.startsWith('vc_') ? el.id : '',
            selector: computeCleanSelector(el),
            attr: entry.attr || '',
            before: entry.originText,
            after: el.textContent || val
          });
        }
        break;
      }
      case 'insert': {
        const { el, parent, nextSibling } = entry;
        if (!el || !parent) break;
        if (isUndo) {
          if (el.parentNode) el.parentNode.removeChild(el);
          createdElements.delete(el);
        } else {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(el, nextSibling);
          } else {
            parent.appendChild(el);
          }
          createdElements.add(el);
        }
        break;
      }
      case 'delete': {
        const { el, parent, nextSibling, vcId, wasCreated, staticRecord } = entry;
        if (!el || !parent) break;
        if (isUndo) {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(el, nextSibling);
          } else {
            parent.appendChild(el);
          }
          if (wasCreated) createdElements.add(el);
          deletedStaticRecords.delete(vcId);
        } else {
          if (el.parentNode) el.parentNode.removeChild(el);
          if (wasCreated) createdElements.delete(el);
          else if (staticRecord) deletedStaticRecords.set(vcId, staticRecord);
        }
        break;
      }
      case 'dom_move': {
        const { el, oldParent, oldNext, newParent, newNext, beforeSnap, afterSnap, beforeClass, afterClass, beforeCreatedAttr, afterCreatedAttr } = entry;
        if (!el) break;
        const targetParent = isUndo ? oldParent : newParent;
        const targetNext = isUndo ? oldNext : newNext;
        if (targetParent) {
          if (targetNext && targetNext.parentNode === targetParent && targetNext !== el) {
            targetParent.insertBefore(el, targetNext);
          } else {
            targetParent.appendChild(el);
          }
        }
        if (beforeClass !== undefined) el.className = isUndo ? beforeClass : afterClass;
        if (beforeCreatedAttr !== undefined) {
          const v = isUndo ? beforeCreatedAttr : afterCreatedAttr;
          if (v) el.setAttribute('data-vc-created', v);
          else el.removeAttribute('data-vc-created');
        }
        applyElementSnapshot(isUndo ? beforeSnap : afterSnap);
        break;
      }
      case 'group': {
        restoreGroupsState(isUndo ? entry.beforeGroups : entry.afterGroups);
        break;
      }
      case 'lock': {
        lockedIds.clear();
        for (const id of isUndo ? entry.beforeLocked : entry.afterLocked) {
          lockedIds.add(id);
        }
        break;
      }
      case 'doc_meta': {
        const fonts = isUndo ? entry.beforeFonts : entry.afterFonts;
        loadedGoogleFonts.clear();
        fonts.forEach((f) => {
          loadedGoogleFonts.add(f);
          ensureGoogleFontLoadedInDom(f);
        });
        activeThemeCss = isUndo ? entry.beforeTheme : entry.afterTheme;
        if (entry.beforePalette || entry.afterPalette) {
          const pal = isUndo ? entry.beforePalette : entry.afterPalette;
          activePalette = pal ? { ...pal } : { primary: '', secondary: '', extraCss: '', presetId: 'original' };
        }
        applyLiveThemeTag(activeThemeCss);
        syncPaletteToStudio();
        break;
      }
    }
  }

  function performUndo() {
    if (!undoStack.length) return false;
    const step = undoStack.pop();
    for (let i = step.entries.length - 1; i >= 0; i--) {
      applyHistoryEntry(step.entries[i], 'undo');
    }
    redoStack.push(step);
    syncAuthoritativeStyleRules();
    pruneDisconnectedSelection();
    renderOverlays();
    sendTreeAndSelectionUpdate();
    notifyHistoryAndDirty();
    return true;
  }

  function performRedo() {
    if (!redoStack.length) return false;
    const step = redoStack.pop();
    for (let i = 0; i < step.entries.length; i++) {
      applyHistoryEntry(step.entries[i], 'redo');
    }
    undoStack.push(step);
    syncAuthoritativeStyleRules();
    pruneDisconnectedSelection();
    renderOverlays();
    sendTreeAndSelectionUpdate();
    notifyHistoryAndDirty();
    return true;
  }

  // Captures current full state as the "Saved / Original" baseline
  function captureSavedBaseline() {
    const elementStyles = new Map();
    const elementTexts = new Map();
    document.querySelectorAll('*').forEach((el) => {
      if (isBridgeNode(el)) return;
      const id = ensureVcId(el);
      if (!id) return;
      elementStyles.set(id, snapshotElementState(el));
      if (el.children.length === 0) {
        elementTexts.set(id, el.textContent || '');
      }
    });

    const createdList = [];
    for (const el of createdElements) {
      if (el.isConnected && el.parentNode) {
        createdList.push({
          el,
          parent: el.parentNode,
          nextSibling: el.nextSibling,
          snap: snapshotElementState(el),
          className: el.className
        });
      }
    }

    savedBaseline = {
      elementStyles,
      elementTexts,
      createdList,
      deletedRecords: new Map(deletedStaticRecords),
      groups: snapshotGroupsState(),
      locked: Array.from(lockedIds),
      fonts: Array.from(loadedGoogleFonts),
      themeCss: activeThemeCss,
      palette: { ...activePalette },
      stepMarker: undoStack.length
    };
    notifyHistoryAndDirty();
  }

  function isDirtyFromBaseline() {
    if (!savedBaseline) return undoStack.length > 0;
    return undoStack.length !== savedBaseline.stepMarker;
  }

  function restoreToSavedBaseline() {
    if (!savedBaseline) return false;
    const entries = [];

    // 1. Remove elements created AFTER baseline
    const baselineCreatedEls = new Set(savedBaseline.createdList.map((c) => c.el));
    for (const el of Array.from(createdElements)) {
      if (!baselineCreatedEls.has(el) && el.parentNode) {
        const vcId = ensureVcId(el);
        const parent = el.parentNode;
        const nextSibling = el.nextSibling;
        el.parentNode.removeChild(el);
        createdElements.delete(el);
        entries.push({
          kind: 'delete',
          el,
          parent,
          nextSibling,
          vcId,
          wasCreated: true,
          staticRecord: null
        });
      }
    }

    // 2. Re-insert baseline-created elements that were deleted after baseline
    for (const item of savedBaseline.createdList) {
      if (!item.el.isConnected && item.parent) {
        if (item.nextSibling && item.nextSibling.parentNode === item.parent) {
          item.parent.insertBefore(item.el, item.nextSibling);
        } else {
          item.parent.appendChild(item.el);
        }
        createdElements.add(item.el);
        entries.push({
          kind: 'insert',
          el: item.el,
          parent: item.parent,
          nextSibling: item.nextSibling
        });
      }
    }

    // 3. Restore static elements deleted after baseline
    for (const [vcId, rec] of Array.from(deletedStaticRecords.entries())) {
      if (!savedBaseline.deletedRecords.has(vcId) && rec.el && rec.parent) {
        const next = rec.nextSibling;
        if (next && next.parentNode === rec.parent) {
          rec.parent.insertBefore(rec.el, next);
        } else {
          rec.parent.appendChild(rec.el);
        }
        deletedStaticRecords.delete(vcId);
        // Inverse of restoring a deleted node is inserting it in forward direction
        entries.push({
          kind: 'insert',
          el: rec.el,
          parent: rec.parent,
          nextSibling: next
        });
      }
    }

    // 4. Restore element styles & texts to baseline
    for (const [vcId, baseSnap] of savedBaseline.elementStyles.entries()) {
      const el = getEl(vcId);
      if (!el) continue;
      const curCss = el.getAttribute('style') || '';
      if (curCss !== baseSnap.cssText) {
        const before = snapshotElementState(el);
        applyElementSnapshot(baseSnap);
        entries.push({ kind: 'style', before, after: snapshotElementState(el) });
      }
    }

    for (const [vcId, baseTxt] of savedBaseline.elementTexts.entries()) {
      const el = getEl(vcId);
      if (!el || el.children.length > 0) continue;
      const curTxt = el.textContent || '';
      if (curTxt !== baseTxt) {
        const originText = initialTextByEl.get(el) ?? baseTxt;
        el.textContent = baseTxt;
        if (baseTxt === originText) textPatchesByEl.delete(vcId);
        entries.push({
          kind: 'text',
          el,
          attr: '',
          originText,
          beforeText: curTxt,
          afterText: baseTxt
        });
      }
    }

    // 5. Restore groups, locks, fonts, theme
    const beforeGroups = snapshotGroupsState();
    restoreGroupsState(savedBaseline.groups);
    entries.push({ kind: 'group', beforeGroups, afterGroups: snapshotGroupsState() });

    const beforeFonts = Array.from(loadedGoogleFonts);
    const beforeTheme = activeThemeCss;
    const beforePalette = { ...activePalette };
    if (beforeTheme !== savedBaseline.themeCss || beforeFonts.join(',') !== savedBaseline.fonts.join(',')) {
      loadedGoogleFonts.clear();
      savedBaseline.fonts.forEach((f) => loadedGoogleFonts.add(f));
      activeThemeCss = savedBaseline.themeCss;
      activePalette = savedBaseline.palette ? { ...savedBaseline.palette } : { primary: '', secondary: '', extraCss: '', presetId: 'original' };
      applyLiveThemeTag(activeThemeCss);
      syncPaletteToStudio();
      entries.push({
        kind: 'doc_meta',
        beforeFonts,
        afterFonts: Array.from(loadedGoogleFonts),
        beforeTheme,
        afterTheme: activeThemeCss,
        beforePalette,
        afterPalette: { ...activePalette }
      });
    }

    if (entries.length) {
      undoStack.push({ label: 'Revert to Original', entries });
      redoStack.length = 0;
      savedBaseline.stepMarker = undoStack.length;
    }

    syncAuthoritativeStyleRules();
    pruneDisconnectedSelection();
    renderOverlays();
    sendTreeAndSelectionUpdate();
    notifyHistoryAndDirty();
    return true;
  }

  function notifyHistoryAndDirty() {
    sendToStudio({
      type: 'vc_history_state',
      undoCount: undoStack.length,
      redoCount: redoStack.length,
      dirty: isDirtyFromBaseline()
    });
  }

  // =========================================================================
  // 4. DIRECT-HTML SAVE SERIALIZER (FOR server.mjs applyDirectHtmlSave)
  // =========================================================================
  function buildCleanElementOuterHtml(el) {
    const clone = el.cloneNode(true);
    const scrub = (node) => {
      if (node.nodeType !== 1) return;
      node.removeAttribute('contenteditable');
      node.classList.remove('__vc_typing__', 'vc-selected');
      for (const ch of Array.from(node.children)) {
        if (isBridgeNode(ch)) ch.remove();
        else scrub(ch);
      }
    };
    scrub(clone);
    return clone.outerHTML;
  }

  function serializeDirectSavePayload() {
    const stylePatches = [];
    for (const [vcId, propMap] of patchedPropsByEl.entries()) {
      const el = getEl(vcId);
      if (!el || createdElements.has(el)) continue;
      const props = {};
      let hasAny = false;
      for (const [k, v] of propMap.entries()) {
        props[k] = v;
        hasAny = true;
      }
      if (hasAny) {
        stylePatches.push({
          id: el.id && !el.id.startsWith('vc_') ? el.id : '',
          selector: computeCleanSelector(el),
          props
        });
      }
    }

    const textPatches = Array.from(textPatchesByEl.values()).filter((tp) => tp.before !== tp.after);
    const attrPatches = Array.from(attrPatchesByEl.values()).filter(
      (ap) => ap && ap.attrs && Object.keys(ap.attrs).length > 0
    );

    const insertedNodes = [];
    for (const el of createdElements) {
      if (!el.isConnected || !el.parentElement) continue;
      // Skip if an ancestor is also in createdElements (ancestor outerHTML already includes it)
      let anc = el.parentElement;
      let nestedInCreated = false;
      while (anc) {
        if (createdElements.has(anc)) { nestedInCreated = true; break; }
        anc = anc.parentElement;
      }
      if (nestedInCreated) continue;

      const parent = el.parentElement;
      const prevStatic = (() => {
        let p = el.previousElementSibling;
        while (p && (isBridgeNode(p) || createdElements.has(p))) p = p.previousElementSibling;
        return p;
      })();
      const nextStatic = (() => {
        let n = el.nextElementSibling;
        while (n && (isBridgeNode(n) || createdElements.has(n))) n = n.nextElementSibling;
        return n;
      })();

      const staticSiblings = Array.from(parent.children).filter((c) => !isBridgeNode(c) && !createdElements.has(c));
      insertedNodes.push({
        parentId: parent.id && !parent.id.startsWith('vc_') ? parent.id : '',
        parentSelector: computeCleanSelector(parent),
        refId: nextStatic?.id && !nextStatic.id.startsWith('vc_') ? nextStatic.id : (prevStatic?.id && !prevStatic.id.startsWith('vc_') ? prevStatic.id : ''),
        refSelector: nextStatic ? computeCleanSelector(nextStatic) : (prevStatic ? computeCleanSelector(prevStatic) : ''),
        position: nextStatic ? 'before' : (prevStatic ? 'after' : 'append'),
        childIndex: staticSiblings.length,
        cleanHtml: buildCleanElementOuterHtml(el)
      });
    }

    const deletedTargets = [];
    for (const rec of deletedStaticRecords.values()) {
      deletedTargets.push({
        id: rec.id || '',
        selector: rec.selector || ''
      });
    }

    return {
      stylePatches,
      textPatches,
      attrPatches,
      insertedNodes,
      deletedTargets,
      googleFonts: Array.from(loadedGoogleFonts),
      themeCss: activeThemeCss
    };
  }

  // =========================================================================
  // 5. NAMED SESSIONS DETECTOR (SPLITS INPUT, UPSCALE, REMOVE BG, OUTPUT, ETC.)
  // =========================================================================
  function collectNamedSessions() {
    const sessions = [];
    const seenEls = new Set();
    const seenNames = new Set();

    const addSession = (el, rawName, kind = 'section', tabTriggerSelector = '') => {
      if (!el || isBridgeNode(el)) return;
      const vcId = ensureVcId(el);
      if (!vcId) return;
      const cleanName = String(rawName || '').replace(/\s+/g, ' ').trim();
      if (!cleanName) return;
      const key = `${vcId}::${cleanName.toLowerCase()}`;
      if (seenNames.has(key)) return;
      seenNames.add(key);
      seenEls.add(el);
      sessions.push({
        sessionId: `sess_${sessions.length + 1}_${vcId}`,
        name: cleanName,
        vcId,
        tag: el.tagName.toLowerCase(),
        kind,
        tabTriggerSelector,
        locked: isEntityLocked(vcId)
      });
    };

    // 1. Top Menubar / Header
    document.querySelectorAll('body > nav, body > header, .topbar, .navbar').forEach((navEl) => {
      if (isBridgeNode(navEl)) return;
      const r = navEl.getBoundingClientRect();
      if (r.height >= 24) addSession(navEl, 'Menubar', 'menubar');
    });

    // Build lookup of visible dock / tabbar buttons by lowercase label (e.g. Input | Upscale | Remove BG | Output | Presets)
    const tabBtnByLabel = new Map();
    document.querySelectorAll('.tabbar button, .tabs button, [role="tablist"] button, [role="tab"]').forEach((btn) => {
      if (isBridgeNode(btn) || !isElementVisible(btn)) return;
      const lbl = (btn.textContent || '').replace(/\s+/g, ' ').trim();
      if (!lbl || lbl.length > 32 || /^img\s*\d+$/i.test(lbl)) return;
      const key = lbl.toLowerCase();
      if (!tabBtnByLabel.has(key)) {
        tabBtnByLabel.set(key, btn.id ? `#${CSS.escape(btn.id)}` : computeCleanSelector(btn));
      }
    });

    const vGridEl = document.getElementById('vGrid');
    const isVideoMode = Boolean(
      (document.body && (document.body.classList.contains('video') || document.body.dataset?.app === 'video')) ||
      (vGridEl && isElementVisible(vGridEl))
    );

    // 2. Cards & Semantic Sections — split tabbed/docked cards into individual Named Sessions!
    const cardCandidates = document.querySelectorAll(
      '[data-name], .card[id], main section[id], main aside[id], .view[id], #pTimeline, body > section, body > footer'
    );

    cardCandidates.forEach((el) => {
      if (isBridgeNode(el)) return;
      // Skip giant wrapper columns that hold multiple cards or views
      if (el.matches('.col, .dock, [id="iCenter"], [id="vCenter"], [id="vThree"], main.grid, main.vgrid')) return;
      if (el.closest('.modal[hidden]')) return;

      const visibleNow = isElementVisible(el);
      if (!visibleNow) {
        if (!isVideoMode && (el.classList.contains('vonly') || el.id === 'pObjects' || el.id === 'pViewport' || el.id === 'pTimeline')) return;
        if (isVideoMode && el.classList.contains('ionly')) return;
      }

      // Check if this card has an internal multi-tab bar without separate [data-name] sibling cards
      const tabButtons = Array.from(
        el.querySelectorAll(':scope > .tabbar button, :scope > .tabs button, :scope > .shead .tabbar button, :scope [role="tablist"] [role="tab"]')
      ).filter((b) => {
        const t = (b.textContent || '').trim();
        return t && t.length <= 28 && !/^img\s*\d+$/i.test(t);
      });

      if (tabButtons.length >= 2 && !el.hasAttribute('data-name')) {
        tabButtons.forEach((btn, idx) => {
          const tabName = (btn.textContent || '').replace(/\s+/g, ' ').trim();
          const btnSel = btn.id ? `#${CSS.escape(btn.id)}` : computeCleanSelector(btn);
          const ariaCtrl = btn.getAttribute('aria-controls');
          const panelEl =
            (ariaCtrl && document.getElementById(ariaCtrl)) ||
            el.querySelector(`[data-tab-panel="${CSS.escape(tabName.toLowerCase())}"]`) ||
            el.querySelector('.cbody') ||
            el;
          addSession(panelEl, tabName, 'tab-session', btnSel || '');
          if (panelEl === el && idx > 0) {
            sessions[sessions.length - 1].vcId = ensureVcId(el);
          }
        });
        return;
      }

      const explicitName =
        el.getAttribute('data-name') ||
        el.querySelector(':scope > .tag, :scope > .shead .tag, .vtag, :scope > h1, :scope > h2, :scope > h3')?.textContent ||
        (el.id === 'pViewport' ? '3D Viewport' : el.id === 'pTimeline' ? 'Timeline' : el.id);

      if (explicitName) {
        const cleanExp = String(explicitName).replace(/\s+/g, ' ').trim();
        const matchedTabSel = tabBtnByLabel.get(cleanExp.toLowerCase()) || '';
        const r = el.getBoundingClientRect();
        // Include visible sections AND docked tab sessions (e.g. Upscale, Remove BG, Presets, Camera & lens)
        if (r.width >= 40 || matchedTabSel || el.hasAttribute('data-name')) {
          addSession(el, cleanExp, matchedTabSel ? 'tab-session' : 'section', matchedTabSel);
        }
      }
    });

    // Fallback for generic HTML pages without .card or [data-name]
    if (sessions.length < 2 && document.body) {
      Array.from(document.body.children).forEach((ch, idx) => {
        if (isBridgeNode(ch)) return;
        const r = ch.getBoundingClientRect();
        if (r.height < 24 || r.width < 60) return;
        const heading = ch.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 26);
        const label = heading || ch.id || `${ch.tagName.toLowerCase()} ${idx + 1}`;
        addSession(ch, label, 'section');
      });
    }

    namedSessions = sessions;
    return sessions;
  }

  function buildLayerEntryForEl(el) {
    const vcId = ensureVcId(el);
    if (!vcId) return null;
    const tag = el.tagName.toLowerCase();
    const createdKind = el.getAttribute('data-vc-created');
    const rawTxt = (
      el.getAttribute('data-name') ||
      (el.id && !el.id.startsWith('vc_') ? `#${el.id}` : '') ||
      el.getAttribute('aria-label') ||
      el.textContent ||
      ''
    ).replace(/\s+/g, ' ').trim().slice(0, 28);
    const name = createdKind === 'div'
      ? (el.id && !el.id.startsWith('vc_') ? el.id : 'Flow Div Spacer')
      : createdKind === 'shape'
        ? (el.getAttribute('data-vc-shape') || 'Shape')
        : (rawTxt || tag);
    const pGrp = getTopmostGroupOf(vcId, true) || parentGroupOf.get(vcId) || null;
    return {
      id: vcId,
      isGroup: false,
      name,
      tag: createdKind === 'div' ? 'flow-div' : createdKind === 'shape' ? 'shape' : tag,
      parentGroupId: pGrp,
      depth: pGrp ? 1 : 0,
      locked: isEntityLocked(vcId),
      selected: selectedIds.includes(vcId)
    };
  }

  function collectLayersList() {
    const layers = [];
    // 1. Top-level & nested composite groups first
    for (const [gid, grp] of groupsById.entries()) {
      const depth = (() => {
        let d = 0;
        let cur = gid;
        while (parentGroupOf.has(cur) && d < 8) { d++; cur = parentGroupOf.get(cur); }
        return d;
      })();
      layers.push({
        id: gid,
        isGroup: true,
        name: grp.name,
        tag: 'group',
        memberCount: grp.memberIds.length,
        depth,
        locked: isEntityLocked(gid),
        selected: activeGroupSelectionId === gid
      });
    }

    // 2. Created shapes & flow divs + all selectable interactive / text / layout elements
    const candidates = document.querySelectorAll(
      '[data-vc-created], .card, header, nav, section, article, aside, footer, button, a, input, select, textarea, label, h1, h2, h3, h4, h5, h6, p, span, strong, img, svg, canvas, div, .vc-flow-div, .vc-shape'
    );
    const added = new Set();
    candidates.forEach((el) => {
      if (layers.length >= 280) return;
      if (isBridgeNode(el)) return;
      const vcId = ensureVcId(el);
      if (!vcId || added.has(vcId)) return;
      const isSel = selectedIds.includes(vcId);
      if (!isSel && isStructuralGridWrapper(el)) return;
      if (!isSel && el.tagName === 'SPAN' && autoGroupButtons && el.closest('button, a')) return;
      const r = el.getBoundingClientRect();
      const locked = lockedIds.has(vcId);
      if (!locked && !isSel && (r.width < 6 || r.height < 6)) return;
      added.add(vcId);
      const entry = buildLayerEntryForEl(el);
      if (entry) layers.push(entry);
    });

    // 3. Guarantee EVERY currently selected element appears in Layers and is marked selected: true!
    for (const selId of selectedIds) {
      if (added.has(selId)) continue;
      const el = getEl(selId);
      if (!el || isBridgeNode(el)) continue;
      added.add(selId);
      const entry = buildLayerEntryForEl(el);
      if (entry) layers.push(entry);
    }

    return layers;
  }

  function extractElementLinkInfo(el) {
    if (!el || el.nodeType !== 1 || isBridgeNode(el)) return null;
    const tag = el.tagName.toLowerCase();
    const vcLink = el.getAttribute('data-vc-link');
    if (vcLink !== null && vcLink !== '') {
      return { attrName: 'data-vc-link', url: vcLink };
    }
    if ((tag === 'a' || tag === 'area') && el.hasAttribute('href')) {
      return { attrName: 'href', url: el.getAttribute('href') || '' };
    }
    for (const attr of ['data-href', 'data-url', 'data-page', 'formaction']) {
      if (el.hasAttribute(attr)) {
        return { attrName: attr, url: el.getAttribute(attr) || '' };
      }
    }
    if (tag === 'form' && el.hasAttribute('action')) {
      return { attrName: 'action', url: el.getAttribute('action') || '' };
    }
    if (el.hasAttribute('onclick')) {
      const oc = el.getAttribute('onclick') || '';
      const m = /(?:location(?:\.href)?\s*=\s*|location\.(?:assign|replace)\s*\(\s*|window\.open\s*\(\s*)(['"])([^'"]*)\1/i.exec(oc);
      if (m) {
        return { attrName: 'onclick', url: m[2] };
      }
    }
    return null;
  }

  function collectPageLinks() {
    if (!document.body) return [];
    const out = [];
    const seen = new Set();
    const nodes = document.body.querySelectorAll(
      'a, area, [data-vc-link], [data-href], [data-url], [data-page], button[formaction], form[action], [onclick]'
    );
    nodes.forEach((el) => {
      if (isBridgeNode(el) || out.length >= 200) return;
      const info = extractElementLinkInfo(el);
      const tag = el.tagName.toLowerCase();
      if (!info && tag !== 'a') return;
      const vcId = ensureVcId(el);
      if (!vcId || seen.has(vcId)) return;
      seen.add(vcId);

      const url = info ? info.url : (el.getAttribute('href') || '');
      const labelTxt = (
        el.textContent ||
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.id ||
        tag
      ).replace(/\s+/g, ' ').trim().slice(0, 38) || tag;

      const topGrp = getTopmostGroupOf(vcId, true);
      let groupName = '';
      if (topGrp && groupsById.has(topGrp)) {
        groupName = groupsById.get(topGrp).name;
      } else {
        const sec = el.closest('[data-name], nav, header, section, .card');
        if (sec && sec !== el && !isBridgeNode(sec)) {
          groupName = (
            sec.getAttribute('data-name') ||
            sec.querySelector(':scope > .tag, :scope > .shead .tag, :scope > h2, :scope > h3')?.textContent ||
            (sec.id && !sec.id.startsWith('vc_') ? `#${sec.id}` : sec.tagName.toLowerCase())
          ).replace(/\s+/g, ' ').trim().slice(0, 22);
        }
      }

      out.push({
        vcId,
        idAttr: el.id && !el.id.startsWith('vc_') ? el.id : '',
        selector: computeCleanSelector(el),
        tag,
        label: labelTxt,
        url,
        attrName: info ? info.attrName : 'href',
        groupId: topGrp || '',
        groupName,
        selected: selectedIds.includes(vcId) || (Boolean(topGrp) && activeGroupSelectionId === topGrp)
      });
    });
    return out;
  }

  function snapshotInitialAttrsIfNeeded(el, attrNames) {
    if (!initialAttrsByEl.has(el)) {
      initialAttrsByEl.set(el, {});
    }
    const map = initialAttrsByEl.get(el);
    for (const k of attrNames) {
      if (!(k in map)) {
        map[k] = el.hasAttribute(k) ? el.getAttribute(k) : null;
      }
    }
  }

  function setElementLinkWithUndo(targetVcId, rawUrl) {
    let el = targetVcId ? getEl(targetVcId) : null;
    if (!el && selectedIds.length > 0) {
      // Prefer a button or <a> inside selection if a group is selected, else first selected element
      const selEls = selectedIds.map(getEl).filter(Boolean);
      el = selEls.find((e) => ['A', 'BUTTON'].includes(e.tagName)) || selEls[0] || null;
    }
    if (!el || isBridgeNode(el)) return false;

    const vcId = ensureVcId(el);
    const cleanUrl = String(rawUrl ?? '').trim();
    const tag = el.tagName.toLowerCase();

    const touchedAttrs = ['href', 'data-vc-link', 'data-href', 'data-url', 'action', 'onclick'];
    snapshotInitialAttrsIfNeeded(el, touchedAttrs);
    const beforeAttrs = {};
    for (const k of touchedAttrs) {
      beforeAttrs[k] = el.hasAttribute(k) ? el.getAttribute(k) : null;
    }

    if (tag === 'a' || tag === 'area') {
      if (cleanUrl) el.setAttribute('href', cleanUrl);
      else el.removeAttribute('href');
    } else if (tag === 'form') {
      if (cleanUrl) el.setAttribute('action', cleanUrl);
      else el.removeAttribute('action');
    } else {
      if (cleanUrl) {
        el.setAttribute('data-vc-link', cleanUrl);
        if (el.hasAttribute('data-href')) el.setAttribute('data-href', cleanUrl);
        const curOc = el.getAttribute('onclick') || '';
        const isNavOc = !curOc || /^\s*(?:window\.)?location(?:\.href)?\s*=/i.test(curOc);
        if (isNavOc) {
          const safeJsUrl = cleanUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          el.setAttribute('onclick', `location.href='${safeJsUrl}'`);
        }
      } else {
        el.removeAttribute('data-vc-link');
        el.removeAttribute('data-href');
        const curOc = el.getAttribute('onclick') || '';
        if (/^\s*(?:window\.)?location(?:\.href)?\s*=/i.test(curOc)) {
          el.removeAttribute('onclick');
        }
      }
    }

    const afterAttrs = {};
    let anyChanged = false;
    for (const k of touchedAttrs) {
      afterAttrs[k] = el.hasAttribute(k) ? el.getAttribute(k) : null;
      if (afterAttrs[k] !== beforeAttrs[k]) anyChanged = true;
    }
    if (!anyChanged) return false;

    const origMap = initialAttrsByEl.get(el) || {};
    const diffAttrs = {};
    let hasDiff = false;
    for (const k of touchedAttrs) {
      const curV = afterAttrs[k];
      const origV = origMap[k] !== undefined ? origMap[k] : null;
      if (curV !== origV) {
        diffAttrs[k] = curV;
        hasDiff = true;
      }
    }
    if (hasDiff) {
      attrPatchesByEl.set(vcId, {
        id: el.id && !el.id.startsWith('vc_') ? el.id : '',
        selector: computeCleanSelector(el),
        attrs: diffAttrs
      });
    } else {
      attrPatchesByEl.delete(vcId);
    }

    pushHistoryStep({
      label: cleanUrl ? `Set Link (${cleanUrl})` : 'Clear Link',
      entries: [{ kind: 'attr', el, beforeAttrs, afterAttrs }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function focusLinkTargetOnArtboard(vcId, selectGroup = false) {
    const el = getEl(vcId);
    if (!el || isBridgeNode(el)) return false;

    // Reveal ancestor if inside a hidden section/modal
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.hidden) cur.hidden = false;
      if (cur.classList && cur.classList.contains('is-hidden')) cur.classList.remove('is-hidden');
      cur = cur.parentElement;
    }

    const topGrp = getTopmostGroupOf(vcId, false);
    if (selectGroup && topGrp && groupsById.has(topGrp)) {
      activeGroupSelectionId = topGrp;
      selectedIds = expandGroupLeafIds(topGrp, []);
    } else {
      activeGroupSelectionId = null;
      selectedIds = [vcId];
    }

    // Scroll into view cleanly even while frozen in Edit mode
    const r0 = el.getBoundingClientRect();
    if (r0.bottom < 0 || r0.top > window.innerHeight || r0.right < 0 || r0.left > window.innerWidth) {
      restoringFrozenScroll = true;
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        frozenWindowScroll = { x: window.scrollX || 0, y: window.scrollY || 0 };
      } catch (_) {}
      restoringFrozenScroll = false;
    }

    const r = (activeGroupSelectionId ? getSelectionBounds() : el.getBoundingClientRect()) || r0;
    flashHighlightRect = { left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 };
    if (flashHighlightTimer) clearTimeout(flashHighlightTimer);
    renderOverlays();
    sendTreeAndSelectionUpdate();
    flashHighlightTimer = setTimeout(() => {
      flashHighlightRect = null;
      renderOverlays();
    }, 750);
    return true;
  }

  function collectDomHierarchy() {
    const out = [];
    const walk = (el, depth) => {
      if (!el || isBridgeNode(el) || out.length >= 220 || depth > 7) return;
      const vcId = ensureVcId(el);
      const tag = el.tagName.toLowerCase();
      const cls = Array.from(el.classList || [])
        .filter((c) => !c.startsWith('__vc_'))
        .slice(0, 2)
        .join('.');
      out.push({
        vcId,
        tag,
        idAttr: el.id && !el.id.startsWith('vc_') ? el.id : '',
        cls,
        depth,
        locked: isEntityLocked(vcId),
        selected: selectedIds.includes(vcId)
      });
      for (const ch of el.children) {
        walk(ch, depth + 1);
      }
    };
    if (document.body) walk(document.body, 0);
    return out;
  }

  // =========================================================================
  // 6. HIT-TESTING & ILLUSTRATOR MULTI-AREA / STACKED SELECTION ENGINE
  // =========================================================================
  const STRUCTURAL_WRAPPER_SEL = 'main, .grid, .vgrid, .col, .dock, #app, #iCenter, #vCenter, #vThree';

  function isStructuralGridWrapper(el) {
    if (!el || el.nodeType !== 1) return false;
    try {
      return el.matches(STRUCTURAL_WRAPPER_SEL);
    } catch (_) {
      return false;
    }
  }

  function isVisuallyTransparentDiv(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName.toUpperCase();
    if (tag !== 'DIV' && tag !== 'SPAN') return false;
    if (el.getAttribute('data-vc-unfill-fill') === '1' && el.getAttribute('data-vc-unfill-stroke') === '1') {
      return !hasDirectNonEmptyText(el);
    }
    const cs = getComputedStyle(el);
    const bgHex = rgbToHex(cs.backgroundColor);
    const hasBgImg = Boolean(cs.backgroundImage && cs.backgroundImage !== 'none');
    const bw =
      (parseFloat(cs.borderTopWidth) || 0) +
      (parseFloat(cs.borderRightWidth) || 0) +
      (parseFloat(cs.borderBottomWidth) || 0) +
      (parseFloat(cs.borderLeftWidth) || 0);
    const hasBorder = bw > 0 && cs.borderTopStyle !== 'none';
    const hasShadow = Boolean(cs.boxShadow && cs.boxShadow !== 'none');
    return !bgHex && !hasBgImg && !hasBorder && !hasShadow && !hasDirectNonEmptyText(el);
  }

  function resolveSelectableTarget(rawTarget, toolOverride, opts = {}) {
    const t = toolOverride || activeTool;
    const directSubSelect = Boolean(opts.directSubSelect) || t === 'direct';
    if (!rawTarget || rawTarget.nodeType !== 1 || isBridgeNode(rawTarget)) return null;
    if (rawTarget === document.documentElement || rawTarget === document.body) return null;

    let el = rawTarget;

    // Promote inner SVG primitives (<path>, <rect>, <circle>, <g>, etc.) up to <svg> or interactive control
    if (['PATH', 'G', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE', 'POLYGON', 'DEFS', 'STOP', 'USE', 'TEXT', 'TSPAN'].includes(el.tagName.toUpperCase())) {
      el = el.closest('svg') || el.parentElement;
    }
    if (!el || isBridgeNode(el)) return null;

    const activeIso = getActiveIsolation();
    if (activeIso) {
      if (!isElementInsideActiveIsolation(el)) return null;
      if (activeIso.kind === 'container' && ensureVcId(el) === activeIso.id && !opts.allowIsolatedRoot) {
        return null;
      }
    }

    if (t === 'section') {
      collectNamedSessions();
      let cur = el;
      while (cur && cur !== document.body) {
        const vid = ensureVcId(cur);
        if (namedSessions.some((s) => s.vcId === vid)) {
          return isEntityLocked(vid) ? null : cur;
        }
        cur = cur.parentElement;
      }
    }

    // In Selection tool (V), clicking empty space of page-level structural grid wrappers starts marquee rather than dragging <main>
    if (t === 'select' && !directSubSelect && isStructuralGridWrapper(el)) {
      return null;
    }

    // With Selection tool (V), promote inner icon/span inside <button>/<a> to the button when Smart Btns is on (unless directSubSelect)
    if (t === 'select' && autoGroupButtons && !directSubSelect) {
      const btn = el.closest('button, a, [role="button"]');
      if (btn && !isBridgeNode(btn) && (!activeIso || isElementInsideActiveIsolation(btn))) {
        el = btn;
      }
    }

    // Walk up if element has zero area (e.g. hidden span)
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) break;
      el = el.parentElement;
    }
    if (!el || el === document.body || el === document.documentElement) return null;
    if (t === 'select' && !directSubSelect && isStructuralGridWrapper(el)) return null;
    if (activeIso) {
      if (!isElementInsideActiveIsolation(el)) return null;
      if (activeIso.kind === 'container' && ensureVcId(el) === activeIso.id && !opts.allowIsolatedRoot) return null;
    }

    const vcId = ensureVcId(el);
    if (isEntityLocked(vcId)) return null;

    // Invisible-Over-Visible Div Rim Inset Rule (8px outer rim hits the visible underlying div; inner area hits the invisible div!)
    if (
      !opts.skipRimInset &&
      opts.clientX !== undefined &&
      opts.clientY !== undefined &&
      !selectedIds.includes(vcId) &&
      isVisuallyTransparentDiv(el)
    ) {
      const er = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(opts.clientX, opts.clientY);
      for (const under of stack) {
        if (!under || under === el || isBridgeNode(under) || under === document.body || under === document.documentElement) continue;
        if (isStructuralGridWrapper(under) || isVisuallyTransparentDiv(under)) continue;
        if (activeIso && !isElementInsideActiveIsolation(under)) continue;
        const ur = under.getBoundingClientRect();
        const sameFootprint =
          Math.abs(er.left - ur.left) <= 12 &&
          Math.abs(er.top - ur.top) <= 12 &&
          Math.abs(er.width - ur.width) <= 24 &&
          Math.abs(er.height - ur.height) <= 24;
        if (sameFootprint) {
          const onOuterRim =
            opts.clientX - ur.left <= 8 ||
            ur.right - opts.clientX <= 8 ||
            opts.clientY - ur.top <= 8 ||
            ur.bottom - opts.clientY <= 8;
          if (onOuterRim) {
            const resolvedUnder = resolveSelectableTarget(under, toolOverride, { ...opts, skipRimInset: true });
            if (resolvedUnder) return resolvedUnder;
          }
          break;
        }
      }
    }

    return el;
  }

  /**
   * Returns ordered front-to-back selectable entities at (clientX, clientY) for Illustrator Ctrl+Click ("Select Behind")
   * and multi-area stacked selection. Also includes geometrically overlapping elements even if pointer-events:none!
   */
  function resolveSelectableStackAtPoint(clientX, clientY, effectiveTool = 'select', directSubSelect = false) {
    const out = [];
    const seenVcIds = new Set();
    const seenGroups = new Set();

    const pushCandidate = (rawEl) => {
      const resolved = resolveSelectableTarget(rawEl, effectiveTool, { directSubSelect });
      if (!resolved) return;
      const vcId = ensureVcId(resolved);
      if (!vcId || isEntityLocked(vcId)) return;

      if (effectiveTool === 'select' && !directSubSelect) {
        const topGrp = getTopmostGroupOf(vcId);
        if (topGrp && !isEntityLocked(topGrp)) {
          if (seenGroups.has(topGrp)) return;
          seenGroups.add(topGrp);
          seenVcIds.add(vcId);
          out.push({ kind: 'group', groupId: topGrp, el: resolved, vcId, leafIds: expandGroupLeafIds(topGrp, []) });
          return;
        }
      }

      if (seenVcIds.has(vcId)) return;
      seenVcIds.add(vcId);
      out.push({ kind: 'element', groupId: null, el: resolved, vcId, leafIds: [vcId] });
    };

    // 1. Primary z-ordered hit stack from browser compositor
    const hitEls = document.elementsFromPoint(clientX, clientY);
    for (const h of hitEls) {
      if (isBridgeNode(h) || h === document.body || h === document.documentElement) continue;
      pushCandidate(h);
    }

    // 2. Also include any visible element whose bounding box contains (clientX, clientY) (e.g. pointer-events:none or occluded canvas/div)
    if (document.body) {
      const extras = [];
      document.body.querySelectorAll('[data-vc-created], .vc-shape, .vc-flow-div, button, input, select, textarea, a, img, canvas, h1, h2, h3, h4, p, .card, div[id]').forEach((el) => {
        if (isBridgeNode(el) || !isElementVisible(el)) return;
        const r = el.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
          extras.push(el);
        }
      });
      // Reverse DOM order approximates front-to-back paint order for unvisited elements
      for (let i = extras.length - 1; i >= 0; i--) {
        pushCandidate(extras[i]);
      }
    }

    // Filter out broad container cards from the stack ONLY when the user didn't already select them, unless they are leaf/sibling overlap targets
    if (out.length > 1 && !directSubSelect) {
      const nonAncestors = out.filter((cand, idx) => {
        // Keep if it is NOT a DOM ancestor of an earlier (higher) candidate, OR if the earlier candidate is ALREADY selected (allowing drill-out/behind!)
        const earlierDescendant = out.slice(0, idx).find((prev) => cand.el.contains(prev.el) && cand.el !== prev.el);
        if (!earlierDescendant) return true;
        // If cand is a huge section/card containing the clicked button, don't cycle to the parent card before cycling to sibling/behind objects;
        // put non-ancestor behind-objects BEFORE ancestor containers!
        return false;
      });
      const ancestors = out.filter((cand) => !nonAncestors.includes(cand));
      return [...nonAncestors, ...ancestors];
    }

    return out;
  }

  function pruneDisconnectedSelection() {
    selectedIds = selectedIds.filter((id) => Boolean(getEl(id)) && !isEntityLocked(id));
    if (keyObjectId && !selectedIds.includes(keyObjectId)) {
      keyObjectId = null;
    }
    if (activeGroupSelectionId) {
      if (!groupsById.has(activeGroupSelectionId)) {
        activeGroupSelectionId = null;
      } else {
        const gLeaves = expandGroupLeafIds(activeGroupSelectionId, []);
        if (gLeaves.length !== selectedIds.length || !gLeaves.every((id) => selectedIds.includes(id))) {
          activeGroupSelectionId = null;
        }
      }
    }
  }

  /**
   * Selects or toggles a target element/group.
   * Returns { deselected: boolean } so mousedown knows not to start a drag if Shift-click just deselected an item!
   */
  function selectSingleOrToggle(el, additive = false, opts = {}) {
    const forceDirect = Boolean(opts.forceDirect);
    const effectiveTool = opts.effectiveTool || activeTool;

    if (!el) {
      if (!additive) {
        selectedIds = [];
        activeGroupSelectionId = null;
        keyObjectId = null;
      }
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return { deselected: false };
    }
    const vcId = ensureVcId(el);
    if (!vcId || isEntityLocked(vcId)) return { deselected: false };

    let deselected = false;

    // If Selection Tool (V) hits a member of a composite/nested group (and not forceDirect), select/toggle the whole top-level group!
    if (effectiveTool === 'select' && !forceDirect) {
      const topGrp = getTopmostGroupOf(vcId);
      if (topGrp && !isEntityLocked(topGrp)) {
        const leafIds = expandGroupLeafIds(topGrp, []);
        if (additive) {
          const allSelected = leafIds.every((id) => selectedIds.includes(id));
          if (allSelected) {
            selectedIds = selectedIds.filter((id) => !leafIds.includes(id));
            deselected = true;
          } else {
            for (const id of leafIds) {
              if (!selectedIds.includes(id)) selectedIds.push(id);
            }
          }
          // Only set activeGroupSelectionId if selectedIds matches this single group alone
          activeGroupSelectionId =
            selectedIds.length === leafIds.length && leafIds.every((id) => selectedIds.includes(id))
              ? topGrp
              : null;
        } else {
          selectedIds = [...leafIds];
          activeGroupSelectionId = topGrp;
          keyObjectId = null;
        }
        renderOverlays();
        sendTreeAndSelectionUpdate();
        return { deselected };
      }
    }

    if (additive) {
      if (selectedIds.includes(vcId)) {
        selectedIds = selectedIds.filter((x) => x !== vcId);
        if (keyObjectId === vcId) keyObjectId = null;
        deselected = true;
      } else {
        selectedIds.push(vcId);
      }
      activeGroupSelectionId = null;
    } else {
      activeGroupSelectionId = null;
      // If Align-to-Key-Object mode is active and clicking an already-selected item in multi-selection, mark as Key Object!
      if (alignKeyMode === '__key__' && selectedIds.length > 1 && selectedIds.includes(vcId)) {
        keyObjectId = keyObjectId === vcId ? null : vcId;
      } else {
        selectedIds = [vcId];
        keyObjectId = null;
      }
    }
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return { deselected };
  }

  /**
   * Adobe Illustrator Control-Click (Ctrl+Click / Cmd+Click) handler:
   * 1) From any non-selection tool, Ctrl acts as temporary Selection tool (V/A).
   * 2) On overlapping objects where a front object at (clientX, clientY) is already selected:
   *    - Plain Ctrl+Click ("Select Behind"): cycles downward to select the next object behind it in the z-stack!
   *    - Ctrl+Shift+Click: adds the next unselected object in the z-stack (or across separate groups/areas) without clearing earlier selections!
   * 3) Inside a composite group or smart button where the group/button is already selected (or with Direct tool):
   *    drills into the inner sub-element directly across multiple separate areas!
   */
  function handleIllustratorControlClick(ev, effectiveTool) {
    const additive = Boolean(ev.shiftKey);
    const stack = resolveSelectableStackAtPoint(ev.clientX, ev.clientY, effectiveTool, false);
    const directStack = resolveSelectableStackAtPoint(ev.clientX, ev.clientY, 'direct', true);

    if (!stack.length && !directStack.length) {
      if (!additive) {
        selectedIds = [];
        activeGroupSelectionId = null;
        keyObjectId = null;
        renderOverlays();
        sendTreeAndSelectionUpdate();
      }
      return { hit: null, deselected: false };
    }

    const isCandidateSelected = (cand) =>
      cand && cand.leafIds.length > 0 && cand.leafIds.every((id) => selectedIds.includes(id));

    // Check if an item at this click coordinate in `stack` is already selected
    const selectedIdxInStack = stack.findIndex(isCandidateSelected);

    if (!additive) {
      if (selectedIdxInStack >= 0) {
        // Check if there is a non-ancestor object behind it in `stack` first ("Illustrator Select Behind")
        if (stack.length > 1) {
          const nextIdx = (selectedIdxInStack + 1) % stack.length;
          const nextCand = stack[nextIdx];
          // If the currently selected item is a composite group/button and stack only looped to an ancestor card,
          // allow drilling into the specific inner element if available
          if (
            directStack.length > 0 &&
            directStack[0].vcId !== stack[selectedIdxInStack].vcId &&
            !selectedIds.includes(directStack[0].vcId) &&
            nextCand.el.contains(stack[selectedIdxInStack].el)
          ) {
            const subEl = directStack[0].el;
            selectSingleOrToggle(subEl, false, { forceDirect: true, effectiveTool: 'direct' });
            return { hit: subEl, deselected: false };
          }
          selectSingleOrToggle(nextCand.el, false, {
            forceDirect: nextCand.kind === 'element' && Boolean(getTopmostGroupOf(nextCand.vcId)),
            effectiveTool
          });
          return { hit: nextCand.el, deselected: false };
        }
        // Only 1 top-level group/button at this point and it's already selected -> drill into inner sub-element!
        if (directStack.length > 0 && directStack[0].vcId !== stack[selectedIdxInStack].vcId) {
          const subEl = directStack[0].el;
          selectSingleOrToggle(subEl, false, { forceDirect: true, effectiveTool: 'direct' });
          return { hit: subEl, deselected: false };
        }
      }

      // Nothing at this point was selected yet: select top candidate (or inner sub-object if inside a group in another area when Direct/sub-select applies)
      const first = stack[0] || directStack[0];
      selectSingleOrToggle(first.el, false, { effectiveTool });
      return { hit: first.el, deselected: false };
    }

    // Ctrl + Shift + Click (Multi-Area & Multi-Layer Additive Selection!):
    // If top candidate at this point is NOT selected yet, add it without clearing earlier areas!
    // If top candidate IS already selected and there are lower objects behind it, add the next unselected lower object behind it!
    const nextUnselected = stack.find((c) => !isCandidateSelected(c)) || directStack.find((c) => !isCandidateSelected(c));
    if (nextUnselected) {
      const forceDirect = !stack.includes(nextUnselected);
      const res = selectSingleOrToggle(nextUnselected.el, true, { forceDirect, effectiveTool });
      return { hit: nextUnselected.el, deselected: res.deselected };
    }
    // All stacked items at this spot are already selected -> toggle the topmost one off (Illustrator Shift+Click toggle)
    const topToToggle = stack[0] || directStack[0];
    const res = selectSingleOrToggle(topToToggle.el, true, { effectiveTool });
    return { hit: topToToggle.el, deselected: res.deselected };
  }

  // =========================================================================
  // 7. COMPUTED INSPECTOR PAYLOAD (EDIT + CSS BOX MODEL + PAINT + FONTS)
  // =========================================================================
  function rgbToHex(rgbStr) {
    if (!rgbStr || rgbStr === 'transparent') return '';
    const trimmed = String(rgbStr).trim();
    if (trimmed.startsWith('#')) {
      if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
        return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
      }
      return trimmed.slice(0, 7).toLowerCase();
    }
    const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i.exec(trimmed);
    if (!m) return '';
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return '';
    const toHex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0');
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
  }

  function extractRotationDeg(el, cs) {
    const inlineTr = el.style.transform || '';
    const m = /rotate\(\s*([-\d.]+)deg\s*\)/i.exec(inlineTr);
    if (m) return Math.round(parseFloat(m[1]) * 10) / 10;
    const tr = cs.transform;
    if (tr && tr !== 'none') {
      const mm = /matrix\(\s*([-\d.]+)\s*,\s*([-\d.]+)/.exec(tr);
      if (mm) {
        return Math.round(Math.atan2(parseFloat(mm[2]), parseFloat(mm[1])) * (180 / Math.PI));
      }
    }
    return 0;
  }

  function getSelectionBounds() {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of selectedIds) {
      const el = getEl(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }
    if (!isFinite(minX)) return null;
    const bodyRect = document.body ? document.body.getBoundingClientRect() : { left: 0, top: 0 };
    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      artboardX: Math.round(minX - bodyRect.left),
      artboardY: Math.round(minY - bodyRect.top)
    };
  }

  function resolveEditableTextSlot(el) {
    if (!el || isBridgeNode(el)) return null;
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      if (['button', 'submit', 'reset'].includes(t)) return { targetEl: el, attr: 'value', mode: 'attr' };
      return { targetEl: el, attr: 'placeholder', mode: 'attr' };
    }
    if (el.children.length === 0) {
      return { targetEl: el, mode: 'leaf' };
    }
    const childEls = Array.from(el.children).filter((c) => !isBridgeNode(c));
    const isIconLike = (c) => ['SVG', 'IMG', 'CANVAS', 'VIDEO'].includes(c.tagName.toUpperCase()) || (c.children.length === 0 && !(c.textContent || '').trim());
    const textLeaves = childEls.filter((c) => !isIconLike(c) && c.children.length === 0 && (c.textContent || '').trim().length > 0);
    const complexChildren = childEls.filter((c) => !isIconLike(c) && !textLeaves.includes(c));
    if (textLeaves.length === 1 && complexChildren.length === 0) {
      return { targetEl: textLeaves[0], mode: 'leaf' };
    }
    const directTextNodes = Array.from(el.childNodes).filter((n) => n.nodeType === 3 && (n.nodeValue || '').trim().length > 0);
    if (directTextNodes.length === 1 && complexChildren.length === 0 && textLeaves.length === 0) {
      return { targetEl: el, textNode: directTextNodes[0], mode: 'textNode' };
    }
    return null;
  }

  function readEditableTextFromElement(el) {
    const slot = resolveEditableTextSlot(el);
    if (!slot) return '';
    if (slot.mode === 'attr') return slot.targetEl.getAttribute(slot.attr) || '';
    if (slot.mode === 'textNode') return (slot.textNode.nodeValue || '').trim();
    return slot.targetEl.textContent || '';
  }

  function buildSelectionPayload() {
    pruneDisconnectedSelection();
    const bounds = getSelectionBounds();
    if (!selectedIds.length) {
      return {
        count: 0,
        selectedIds: [],
        activeGroupId: null,
        lockedSelectedId: lastClickedLayerLockedId,
        summary: `${artboardWidth} × ${artboardHeight} Artboard`,
        props: null
      };
    }

    const firstEl = getEl(selectedIds[0]);
    const cs = firstEl ? getComputedStyle(firstEl) : null;
    const bgImg = cs ? cs.backgroundImage : 'none';
    const bgHex = cs ? rgbToHex(cs.backgroundColor) : '';
    const unfillFill = firstEl ? firstEl.getAttribute('data-vc-unfill-fill') === '1' : false;
    const unfillStroke = firstEl ? firstEl.getAttribute('data-vc-unfill-stroke') === '1' : false;
    const fillMode = unfillFill
      ? 'none'
      : bgImg && bgImg.includes('linear-gradient')
        ? 'linear'
        : bgImg && bgImg.includes('radial-gradient')
          ? 'radial'
          : bgHex
            ? 'solid'
            : 'none';

    const borderW = cs ? parseFloat(cs.borderTopWidth) || 0 : 0;
    const strokeHex = cs ? rgbToHex(cs.borderTopColor) : '#78716c';
    const strokeMode = !unfillStroke && borderW > 0 && cs && cs.borderTopStyle !== 'none' ? 'solid' : 'none';

    const grpLabel = activeGroupSelectionId && groupsById.has(activeGroupSelectionId)
      ? `${groupsById.get(activeGroupSelectionId).name} (${selectedIds.length} items)`
      : selectedIds.length > 1
        ? `${selectedIds.length} objects selected`
        : `${firstEl.tagName.toLowerCase()}${firstEl.id && !firstEl.id.startsWith('vc_') ? '#' + firstEl.id : ''}`;

    return {
      count: selectedIds.length,
      selectedIds: [...selectedIds],
      activeGroupId: activeGroupSelectionId,
      keyObjectId,
      lockedSelectedId: lastClickedLayerLockedId,
      isFlowDiv: Boolean(firstEl && firstEl.classList.contains('vc-flow-div')),
      isShape: Boolean(firstEl && firstEl.getAttribute('data-vc-created') === 'shape'),
      summary: grpLabel,
      props: firstEl && cs ? {
        selector: computeCleanSelector(firstEl),
        tag: firstEl.tagName.toLowerCase(),
        x: bounds ? bounds.artboardX : 0,
        y: bounds ? bounds.artboardY : 0,
        w: Math.round(bounds ? bounds.width : firstEl.getBoundingClientRect().width),
        h: Math.round(bounds ? bounds.height : firstEl.getBoundingClientRect().height),
        rotate: extractRotationDeg(firstEl, cs),
        padding: Math.round(parseFloat(cs.paddingTop) || 0),
        margin: Math.round(parseFloat(cs.marginTop) || 0),
        gap: Math.round(parseFloat(cs.gap || cs.columnGap) || 0),
        radius: Math.round(parseFloat(cs.borderTopLeftRadius) || 0),
        display: cs.display || 'block',
        zIndex: cs.zIndex === 'auto' ? '' : cs.zIndex,
        opacity: Math.round((parseFloat(cs.opacity ?? '1') || 1) * 100),
        fillMode,
        unfillFill,
        fillColor: bgHex || '#f97316',
        fillGradient: bgImg && bgImg !== 'none' ? bgImg : '',
        strokeMode,
        unfillStroke,
        strokeWidth: unfillStroke ? 0 : Math.round(borderW * 10) / 10,
        strokeStyle: cs.borderTopStyle && cs.borderTopStyle !== 'none' ? cs.borderTopStyle : 'solid',
        strokeColor: strokeHex || '#78716c',
        fontFamily: (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim(),
        fontSize: Math.round(parseFloat(cs.fontSize) || 14),
        fontWeight: cs.fontWeight || '400',
        lineHeight: cs.lineHeight === 'normal' ? '1.4' : (Math.round((parseFloat(cs.lineHeight) / Math.max(1, parseFloat(cs.fontSize))) * 100) / 100 || '1.4'),
        letterSpacing: Math.round((parseFloat(cs.letterSpacing) || 0) * 10) / 10,
        color: rgbToHex(cs.color) || '#ece9e5',
        textAlign: cs.textAlign || 'left',
        text: readEditableTextFromElement(firstEl),
        linkInfo: extractElementLinkInfo(firstEl),
        inlineStyle: firstEl.getAttribute('style') || '',
        boxModel: {
          mt: Math.round(parseFloat(cs.marginTop) || 0),
          mr: Math.round(parseFloat(cs.marginRight) || 0),
          mb: Math.round(parseFloat(cs.marginBottom) || 0),
          ml: Math.round(parseFloat(cs.marginLeft) || 0),
          pt: Math.round(parseFloat(cs.paddingTop) || 0),
          pr: Math.round(parseFloat(cs.paddingRight) || 0),
          pb: Math.round(parseFloat(cs.paddingBottom) || 0),
          pl: Math.round(parseFloat(cs.paddingLeft) || 0),
          cw: Math.round(firstEl.clientWidth),
          ch: Math.round(firstEl.clientHeight)
        }
      } : null
    };
  }

  function sendTreeAndSelectionUpdate() {
    const sessions = collectNamedSessions();
    const layers = collectLayersList();
    const domTree = collectDomHierarchy();
    const selection = buildSelectionPayload();
    const links = collectPageLinks();
    const activeIso = getActiveIsolation();
    const views = window.__VC_PREBYPASS__?.discoverSwitchableViews?.() || [];
    sendToStudio({
      type: 'vc_state_sync',
      sessions,
      layers,
      domTree,
      selection,
      links,
      isolation: activeIso
        ? { active: true, stack: isolationStack.map((s) => ({ id: s.id, name: s.name, kind: s.kind })) }
        : { active: false, stack: [] },
      views,
      lockedCount: lockedIds.size,
      artboardRect: getArtboardMetrics()
    });
  }

  function getArtboardMetrics() {
    return {
      pasteboardW: artboardWidth,
      pasteboardH: artboardHeight,
      artboardW: artboardWidth,
      artboardH: artboardHeight,
      offsetX: 0,
      offsetY: 0
    };
  }

  // =========================================================================
  // 8. VISUAL OVERLAY RENDERER (HANDLES, SESSIONS, ALT-MEASURE, GUIDES, PINS)
  // =========================================================================
  function getAnchorCoordsForBounds(b, ref) {
    const xMap = { nw: b.left, n: (b.left + b.right) / 2, ne: b.right, w: b.left, c: (b.left + b.right) / 2, e: b.right, sw: b.left, s: (b.left + b.right) / 2, se: b.right };
    const yMap = { nw: b.top, n: b.top, ne: b.top, w: (b.top + b.bottom) / 2, c: (b.top + b.bottom) / 2, e: (b.top + b.bottom) / 2, sw: b.bottom, s: b.bottom, se: b.bottom };
    return { x: xMap[ref] ?? (b.left + b.right) / 2, y: yMap[ref] ?? (b.top + b.bottom) / 2 };
  }

  function syncEffectiveToolCursor() {
    const rootEl = document.documentElement;
    if (!rootEl) return;
    if (pointerAction && pointerAction.type === 'pan') {
      rootEl.setAttribute('data-vc-cursor', 'hand-grab');
      return;
    }
    if (mode !== 'edit') {
      rootEl.removeAttribute('data-vc-cursor');
      return;
    }
    if (spaceHeld || activeTool === 'hand') {
      rootEl.setAttribute('data-vc-cursor', 'hand');
      return;
    }
    if (ctrlHeld && activeTool !== 'select' && activeTool !== 'direct') {
      rootEl.setAttribute('data-vc-cursor', lastSelectionTool);
      return;
    }
    if (activeTool === 'zoom' && altHeld) {
      rootEl.setAttribute('data-vc-cursor', 'zoom-out');
      return;
    }
    rootEl.setAttribute('data-vc-cursor', activeTool || 'select');
  }

  function renderOverlays(extra = {}) {
    syncEffectiveToolCursor();
    const root = ensureOverlayRoot();
    root.innerHTML = '';
    if (mode !== 'edit') return;

    // Group / Container Isolation Mode dashed frame
    const activeIso = getActiveIsolation();
    if (activeIso) {
      const ib = getIsolatedBounds();
      if (ib) {
        const isoBox = document.createElement('div');
        isoBox.className = '__vc_iso_frame__';
        isoBox.style.left = `${ib.left - 4}px`;
        isoBox.style.top = `${ib.top - 4}px`;
        isoBox.style.width = `${ib.width + 8}px`;
        isoBox.style.height = `${ib.height + 8}px`;
        const isoPill = document.createElement('div');
        isoPill.className = '__vc_iso_pill__';
        isoPill.textContent = `Isolated: ${activeIso.name}`;
        isoBox.appendChild(isoPill);
        root.appendChild(isoBox);
      }
    }

    // Link target flash highlight box
    if (flashHighlightRect) {
      const fb = document.createElement('div');
      fb.className = '__vc_link_flash__';
      fb.style.left = `${flashHighlightRect.left - 3}px`;
      fb.style.top = `${flashHighlightRect.top - 3}px`;
      fb.style.width = `${flashHighlightRect.width + 6}px`;
      fb.style.height = `${flashHighlightRect.height + 6}px`;
      root.appendChild(fb);
    }

    // Named Sessions framing when Session tool (S) or "All Sessions" is active
    if (showAllSessionsOverlay || activeTool === 'section') {
      collectNamedSessions();
      for (const s of namedSessions) {
        const el = getEl(s.vcId);
        if (!el || !isElementVisible(el)) continue;
        const r = el.getBoundingClientRect();
        const f = document.createElement('div');
        f.className = '__vc_session_frame__';
        f.style.left = `${r.left}px`;
        f.style.top = `${r.top}px`;
        f.style.width = `${r.width}px`;
        f.style.height = `${r.height}px`;
        const pill = document.createElement('div');
        pill.className = '__vc_session_pill__';
        pill.setAttribute(BRIDGE_ATTR, '1');
        pill.textContent = s.name;
        pill.addEventListener('mousedown', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          activateAndSelectSession(s.sessionId);
        });
        f.appendChild(pill);
        root.appendChild(f);
      }
    }

    // Hover outline + Alt+Hover Airship spacing measurement
    if (hoverId && !selectedIds.includes(hoverId) && !pointerAction) {
      const hEl = getEl(hoverId);
      if (hEl && isElementVisible(hEl)) {
        const hr = hEl.getBoundingClientRect();
        const hb = document.createElement('div');
        hb.className = '__vc_hover_box__';
        hb.style.left = `${hr.left}px`;
        hb.style.top = `${hr.top}px`;
        hb.style.width = `${hr.width}px`;
        hb.style.height = `${hr.height}px`;
        const htag = document.createElement('div');
        htag.className = '__vc_hover_tag__';
        const kind = hEl.getAttribute('data-vc-created') === 'div' ? 'div.flow-spacer' : hEl.tagName.toLowerCase();
        htag.textContent = `${kind} · ${Math.round(hr.width)}×${Math.round(hr.height)}`;
        hb.appendChild(htag);
        root.appendChild(hb);

        // Airship Alt + Hover distance measurement from active selection to hovered element
        if (altHeld && selectedIds.length > 0 && showSmartGuides) {
          const sb = getSelectionBounds();
          if (sb) renderAltDistanceLines(root, sb, hr);
        }
      }
    }

    // Individual selection outlines + Combined Bounding Box + 8 Resize Handles
    pruneDisconnectedSelection();
    if (selectedIds.length > 0 && !activeInlineEdit) {
      for (const id of selectedIds) {
        const el = getEl(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const sb = document.createElement('div');
        sb.className = '__vc_sel_box__' + (keyObjectId === id ? ' is-key' : '');
        sb.style.left = `${r.left}px`;
        sb.style.top = `${r.top}px`;
        sb.style.width = `${r.width}px`;
        sb.style.height = `${r.height}px`;
        if (selectedIds.length === 1) {
          const lbl = document.createElement('div');
          lbl.className = '__vc_sel_label__';
          lbl.textContent = `${el.tagName.toLowerCase()} · ${Math.round(r.width)} × ${Math.round(r.height)}`;
          sb.appendChild(lbl);
        }
        root.appendChild(sb);
      }

      const bounds = getSelectionBounds();
      if (bounds) {
        if (selectedIds.length > 1) {
          const gb = document.createElement('div');
          gb.className = '__vc_sel_box__';
          gb.style.borderStyle = 'dashed';
          gb.style.left = `${bounds.left}px`;
          gb.style.top = `${bounds.top}px`;
          gb.style.width = `${bounds.width}px`;
          gb.style.height = `${bounds.height}px`;
          const gl = document.createElement('div');
          gl.className = '__vc_sel_label__';
          gl.textContent = activeGroupSelectionId && groupsById.has(activeGroupSelectionId)
            ? `${groupsById.get(activeGroupSelectionId).name} (${selectedIds.length})`
            : `${selectedIds.length} Selected · ${prefs.multiScaleMode === 'normal' ? 'Scale Normally' : 'Scale in Place'}`;
          gb.appendChild(gl);
          root.appendChild(gb);
        }

        // 8 Illustrator resize handles
        const handleDefs = [
          ['nw', bounds.left, bounds.top, 'nwse-resize'],
          ['n', (bounds.left + bounds.right) / 2, bounds.top, 'ns-resize'],
          ['ne', bounds.right, bounds.top, 'nesw-resize'],
          ['e', bounds.right, (bounds.top + bounds.bottom) / 2, 'ew-resize'],
          ['se', bounds.right, bounds.bottom, 'nwse-resize'],
          ['s', (bounds.left + bounds.right) / 2, bounds.bottom, 'ns-resize'],
          ['sw', bounds.left, bounds.bottom, 'nesw-resize'],
          ['w', bounds.left, (bounds.top + bounds.bottom) / 2, 'ew-resize']
        ];

        for (const [dir, hx, hy, cursor] of handleDefs) {
          const h = document.createElement('div');
          h.className = '__vc_handle__';
          h.setAttribute(BRIDGE_ATTR, '1');
          h.dataset.handle = dir;
          h.style.left = `${hx}px`;
          h.style.top = `${hy}px`;
          h.style.cursor = cursor;
          h.addEventListener('mousedown', (ev) => startResizeDrag(ev, dir));
          root.appendChild(h);
        }

        // Transform tool (E): show rotation lollipop handle + 9-point anchor dot
        if (activeTool === 'transform') {
          const rx = (bounds.left + bounds.right) / 2;
          const ry = bounds.top - 22;
          const stem = document.createElement('div');
          stem.className = '__vc_guide_line__';
          stem.style.left = `${rx}px`;
          stem.style.top = `${ry}px`;
          stem.style.width = '1.5px';
          stem.style.height = '22px';
          root.appendChild(stem);

          const rh = document.createElement('div');
          rh.className = '__vc_rot_handle__';
          rh.setAttribute(BRIDGE_ATTR, '1');
          rh.style.left = `${rx}px`;
          rh.style.top = `${ry}px`;
          rh.title = 'Drag to rotate';
          rh.addEventListener('mousedown', startRotateDrag);
          root.appendChild(rh);

          const anc = getAnchorCoordsForBounds(bounds, transformRefPoint);
          const adot = document.createElement('div');
          adot.className = '__vc_anchor_dot__';
          adot.style.left = `${anc.x}px`;
          adot.style.top = `${anc.y}px`;
          root.appendChild(adot);
        }
      }
    }

    // Marquee / Shape / Div / Note live drag preview box
    if (extra.dragBox) {
      const mb = document.createElement('div');
      mb.className = '__vc_marquee__';
      mb.style.left = `${extra.dragBox.left}px`;
      mb.style.top = `${extra.dragBox.top}px`;
      mb.style.width = `${extra.dragBox.width}px`;
      mb.style.height = `${extra.dragBox.height}px`;
      root.appendChild(mb);
    }

    // Flow Div insertion indicator line
    if (extra.dropLine) {
      const dl = document.createElement('div');
      dl.className = '__vc_drop_line__';
      dl.style.left = `${extra.dropLine.left}px`;
      dl.style.top = `${extra.dropLine.top}px`;
      dl.style.width = `${extra.dropLine.width}px`;
      dl.style.height = `${extra.dropLine.height}px`;
      root.appendChild(dl);
    }

    // Smart alignment guide lines during drag
    if (Array.isArray(extra.guides)) {
      for (const g of extra.guides) {
        const gl = document.createElement('div');
        gl.className = '__vc_guide_line__';
        gl.style.left = `${g.x}px`;
        gl.style.top = `${g.y}px`;
        gl.style.width = `${g.w}px`;
        gl.style.height = `${g.h}px`;
        root.appendChild(gl);
      }
    }

    // Coding Agent Note pins
    if (showNotePins && Array.isArray(currentNotes) && document.body) {
      const br = document.body.getBoundingClientRect();
      for (const n of currentNotes) {
        let px = br.left + 40;
        let py = br.top + 40;
        if (n.markRect && typeof n.markRect.x === 'number') {
          px = br.left + n.markRect.x + (n.markRect.w || 0);
          py = br.top + n.markRect.y;
        } else if (n.selector) {
          try {
            const tEl = document.querySelector(n.selector);
            if (tEl) {
              const tr = tEl.getBoundingClientRect();
              px = tr.right;
              py = tr.top;
            }
          } catch (_) {}
        }
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = '__vc_note_pin__';
        pin.setAttribute(BRIDGE_ATTR, '1');
        pin.style.left = `${px}px`;
        pin.style.top = `${py}px`;
        pin.textContent = String(n.number || '!');
        pin.title = n.text || 'Coding Agent Note';
        pin.addEventListener('mousedown', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          sendToStudio({ type: 'vc_open_note', note: n });
        });
        root.appendChild(pin);
      }
    }
  }

  function renderAltDistanceLines(root, sb, hr) {
    const addLine = (x1, y1, x2, y2, dist) => {
      if (dist < 1) return;
      const line = document.createElement('div');
      line.className = '__vc_guide_line__';
      line.style.left = `${Math.min(x1, x2)}px`;
      line.style.top = `${Math.min(y1, y2)}px`;
      line.style.width = `${Math.max(1.5, Math.abs(x2 - x1))}px`;
      line.style.height = `${Math.max(1.5, Math.abs(y2 - y1))}px`;
      root.appendChild(line);

      const pill = document.createElement('div');
      pill.className = '__vc_measure_pill__';
      pill.style.left = `${(x1 + x2) / 2}px`;
      pill.style.top = `${(y1 + y2) / 2}px`;
      pill.textContent = `${Math.round(dist)}px`;
      root.appendChild(pill);
    };

    const cy = (sb.top + sb.bottom) / 2;
    const cx = (sb.left + sb.right) / 2;
    if (hr.left > sb.right) addLine(sb.right, cy, hr.left, cy, hr.left - sb.right);
    else if (sb.left > hr.right) addLine(hr.right, cy, sb.left, cy, sb.left - hr.right);

    if (hr.top > sb.bottom) addLine(cx, sb.bottom, cx, hr.top, hr.top - sb.bottom);
    else if (sb.top > hr.bottom) addLine(cx, hr.bottom, cx, sb.top, sb.top - hr.bottom);
  }

  // =========================================================================
  // 9. MOVING, MULTI-OBJECT SCALING ("IN PLACE" VS "NORMALLY"), ROTATING
  // =========================================================================
  function readElementTranslate(el) {
    const tx = parseFloat(el.getAttribute('data-vc-tx') || '0') || 0;
    const ty = parseFloat(el.getAttribute('data-vc-ty') || '0') || 0;
    const rot = parseFloat(el.getAttribute('data-vc-rot') || '') || extractRotationDeg(el, getComputedStyle(el));
    return { tx, ty, rot };
  }

  function applyElementPositionOffset(el, newTx, newTy, newRot) {
    const cs = getComputedStyle(el);
    if (cs.position === 'static' && el.getAttribute('data-vc-created') === 'shape') {
      el.style.position = 'absolute';
      recordPatchedProp(el, 'position', 'absolute');
    }
    const isShape = el.getAttribute('data-vc-created') === 'shape';
    const canUseLeftTop =
      isShape ||
      (cs.position === 'absolute' &&
        (Boolean(el.style.left) || cs.right === 'auto') &&
        (Boolean(el.style.top) || cs.bottom === 'auto') &&
        (!cs.transform || cs.transform === 'none' || Boolean(el.getAttribute('data-vc-tx'))));

    if (canUseLeftTop) {
      if (!isShape) {
        if (cs.right !== 'auto' && !el.style.right) {
          el.style.right = 'auto';
          recordPatchedProp(el, 'right', 'auto');
        }
        if (cs.bottom !== 'auto' && !el.style.bottom) {
          el.style.bottom = 'auto';
          recordPatchedProp(el, 'bottom', 'auto');
        }
      }
      const rawLeft = parseFloat(el.style.left || cs.left);
      const rawTop = parseFloat(el.style.top || cs.top);
      const curLeft = Number.isFinite(rawLeft) ? rawLeft : (el.offsetLeft || 0);
      const curTop = Number.isFinite(rawTop) ? rawTop : (el.offsetTop || 0);
      const prevTx = parseFloat(el.getAttribute('data-vc-tx') || '0') || 0;
      const prevTy = parseFloat(el.getAttribute('data-vc-ty') || '0') || 0;
      const dx = newTx - prevTx;
      const dy = newTy - prevTy;
      const nextL = `${Math.round((curLeft + dx) * 10) / 10}px`;
      const nextT = `${Math.round((curTop + dy) * 10) / 10}px`;
      el.style.left = nextL;
      el.style.top = nextT;
      recordPatchedProp(el, 'left', nextL);
      recordPatchedProp(el, 'top', nextT);
      el.setAttribute('data-vc-tx', String(newTx));
      el.setAttribute('data-vc-ty', String(newTy));
      if (newRot !== undefined) {
        el.setAttribute('data-vc-rot', String(newRot));
        const rotStr = newRot ? `rotate(${Math.round(newRot * 10) / 10}deg)` : '';
        el.style.transform = rotStr;
        recordPatchedProp(el, 'transform', rotStr || null);
      }
      return;
    }

    // CSS transform has NO effect on display:inline elements (<a>, <span>, <label>, <strong>) -> promote to inline-block!
    if (cs.display === 'inline') {
      el.style.display = 'inline-block';
      recordPatchedProp(el, 'display', 'inline-block');
    }

    el.setAttribute('data-vc-tx', String(newTx));
    el.setAttribute('data-vc-ty', String(newTy));
    const r = newRot !== undefined ? newRot : (parseFloat(el.getAttribute('data-vc-rot') || '0') || 0);
    el.setAttribute('data-vc-rot', String(r));
    const parts = [];
    if (Math.abs(newTx) >= 0.1 || Math.abs(newTy) >= 0.1) {
      parts.push(`translate(${Math.round(newTx * 10) / 10}px, ${Math.round(newTy * 10) / 10}px)`);
    }
    if (Math.abs(r) >= 0.1) {
      parts.push(`rotate(${Math.round(r * 10) / 10}deg)`);
    }
    const trVal = parts.join(' ');
    el.style.transform = trVal;
    recordPatchedProp(el, 'transform', trVal || null);
  }

  function startMoveDrag(ev, clickedHit = null, collapseOnClick = false) {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return;
    // Filter out descendants whose ancestor is ALSO selected so moving parent+child never double-transforms the child
    const selEls = selectedIds.map((id) => ({ id, el: getEl(id) })).filter((x) => Boolean(x.el));
    const topMoveEls = selEls.filter(
      (item) => !selEls.some((other) => other.el !== item.el && other.el.contains(item.el))
    );
    const items = topMoveEls.map(({ id, el }) => {
      const { tx, ty, rot } = readElementTranslate(el);
      return {
        id,
        el,
        before: snapshotElementState(el),
        origTx: tx,
        origTy: ty,
        origRot: rot,
        origRect: el.getBoundingClientRect()
      };
    });
    if (!items.length) return;

    const startBounds = getSelectionBounds();
    pointerAction = {
      type: 'move',
      startX: ev.clientX,
      startY: ev.clientY,
      items,
      startBounds,
      moved: false,
      dragThreshold: ev.shiftKey || ev.ctrlKey || ev.metaKey ? 5 : 2,
      clickedHit,
      collapseOnClick
    };
  }

  function updateMoveDrag(ev) {
    const act = pointerAction;
    let dx = ev.clientX - act.startX;
    let dy = ev.clientY - act.startY;
    if (!act.moved && Math.hypot(dx, dy) < (act.dragThreshold || 2)) return;
    act.moved = true;

    if (ev.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy)) dy = 0;
      else dx = 0;
    }

    const guides = [];
    if (showSmartGuides && act.startBounds && document.body) {
      const br = document.body.getBoundingClientRect();
      const candCx = (act.startBounds.left + act.startBounds.right) / 2 + dx;
      const artCx = (br.left + br.right) / 2;
      if (Math.abs(candCx - artCx) <= 5) {
        dx += artCx - candCx;
        guides.push({ x: artCx, y: br.top, w: 1, h: br.height });
      }
    }

    for (const it of act.items) {
      applyElementPositionOffset(it.el, it.origTx + dx, it.origTy + dy, it.origRot);
    }
    renderOverlays({ guides });
  }

  function finishMoveDrag(act) {
    if (act && act.moved) {
      const entries = act.items.map((it) => ({
        kind: 'style',
        before: it.before,
        after: snapshotElementState(it.el)
      }));
      pushHistoryStep({ label: 'Move Selection', entries });
      sendTreeAndSelectionUpdate();
    } else if (act && act.collapseOnClick && act.clickedHit && alignKeyMode !== '__key__') {
      selectSingleOrToggle(act.clickedHit, false);
    }
  }

  // Opposite handle anchor map (Illustrator standard: opposite corner or edge stays fixed!)
  const OPPOSITE_REF = {
    nw: 'se',
    n: 's',
    ne: 'sw',
    e: 'w',
    se: 'nw',
    s: 'n',
    sw: 'ne',
    w: 'e'
  };

  function captureScaleItem(id) {
    const el = getEl(id);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const { tx, ty, rot } = readElementTranslate(el);
    return {
      id,
      el,
      before: snapshotElementState(el),
      origRect: r,
      origW: Math.max(2, r.width),
      origH: Math.max(2, r.height),
      origTx: tx,
      origTy: ty,
      origRot: rot,
      origBorderW: parseFloat(cs.borderTopWidth) || 0,
      origRadius: parseFloat(cs.borderTopLeftRadius) || 0,
      origFontSize: parseFloat(cs.fontSize) || 14,
      isFlowDiv: el.classList.contains('vc-flow-div')
    };
  }

  function startResizeDrag(ev, handleDir) {
    ev.stopPropagation();
    ev.preventDefault();
    pruneDisconnectedSelection();
    if (!selectedIds.length) return;
    const startBounds = getSelectionBounds();
    if (!startBounds) return;

    const items = selectedIds.map(captureScaleItem).filter(Boolean);
    if (!items.length) return;

    // Allow parent overflow:visible when scaling normally so objects can extend past session/artboard edges!
    if (items.length > 1 && prefs.multiScaleMode === 'normal') {
      items.forEach((it) => {
        let p = it.el.parentElement;
        while (p && p !== document.body) {
          const pcs = getComputedStyle(p);
          if (pcs.overflow === 'hidden' || pcs.overflowX === 'hidden' || pcs.overflowY === 'hidden') {
            p.style.overflow = 'visible';
          }
          p = p.parentElement;
        }
      });
    }

    pointerAction = {
      type: 'resize',
      handleDir,
      startX: ev.clientX,
      startY: ev.clientY,
      startBounds,
      items,
      moved: false
    };
  }

  function applyScaledDimensionsAndEffects(it, newW, newH, newTx, newTy, uniformFactor) {
    const wVal = `${Math.max(4, Math.round(newW * 10) / 10)}px`;
    const hVal = `${Math.max(2, Math.round(newH * 10) / 10)}px`;
    it.el.style.boxSizing = 'border-box';
    it.el.style.width = wVal;
    it.el.style.height = hVal;
    it.el.style.minWidth = '0px';
    it.el.style.maxWidth = 'none';
    it.el.style.maxHeight = 'none';
    it.el.style.flexShrink = '0';
    recordPatchedProp(it.el, 'box-sizing', 'border-box');
    recordPatchedProp(it.el, 'width', wVal);
    recordPatchedProp(it.el, 'height', hVal);
    recordPatchedProp(it.el, 'max-width', 'none');
    recordPatchedProp(it.el, 'max-height', 'none');
    recordPatchedProp(it.el, 'flex-shrink', '0');

    if (it.isFlowDiv) {
      it.el.style.flex = '0 0 auto';
      recordPatchedProp(it.el, 'flex', '0 0 auto');
    } else {
      applyElementPositionOffset(it.el, newTx, newTy, it.origRot);
    }

    if (prefs.scaleStrokesAndEffects && uniformFactor && Math.abs(uniformFactor - 1) > 0.01) {
      if (it.origBorderW > 0) {
        const bw = `${Math.max(0.5, Math.round(it.origBorderW * uniformFactor * 10) / 10)}px`;
        it.el.style.borderWidth = bw;
        recordPatchedProp(it.el, 'border-width', bw);
      }
      if (it.el.children.length === 0 && (it.el.textContent || '').trim()) {
        const fs = `${Math.max(6, Math.round(it.origFontSize * uniformFactor * 10) / 10)}px`;
        it.el.style.fontSize = fs;
        recordPatchedProp(it.el, 'font-size', fs);
      }
    }

    if (prefs.scaleCorners && it.origRadius > 0 && uniformFactor && Math.abs(uniformFactor - 1) > 0.01) {
      const rad = `${Math.max(0, Math.round(it.origRadius * uniformFactor * 10) / 10)}px`;
      it.el.style.borderRadius = rad;
      recordPatchedProp(it.el, 'border-radius', rad);
    }
  }

  function updateResizeDrag(ev) {
    const act = pointerAction;
    const dx = ev.clientX - act.startX;
    const dy = ev.clientY - act.startY;
    if (!act.moved && Math.hypot(dx, dy) < 1.5) return;
    act.moved = true;

    const dir = act.handleDir;
    const sb = act.startBounds;
    const affectsW = dir.includes('e') || dir.includes('w');
    const affectsH = dir.includes('n') || dir.includes('s');

    let sx = 1;
    let sy = 1;
    if (affectsW) {
      const signedDx = dir.includes('e') ? dx : -dx;
      const factor = ev.altKey ? (sb.width + signedDx * 2) / sb.width : (sb.width + signedDx) / sb.width;
      sx = Math.max(0.06, factor);
    }
    if (affectsH) {
      const signedDy = dir.includes('s') ? dy : -dy;
      const factor = ev.altKey ? (sb.height + signedDy * 2) / sb.height : (sb.height + signedDy) / sb.height;
      sy = Math.max(0.06, factor);
    }

    if (ev.shiftKey) {
      const uni = affectsW && affectsH ? Math.max(sx, sy) : affectsW ? sx : sy;
      sx = uni;
      sy = uni;
    }

    const uniformFactor = (sx + sy) / 2;
    const isMulti = act.items.length > 1;
    const modeToUse = isMulti ? prefs.multiScaleMode : 'normal';

    if (!isMulti || modeToUse === 'in-place') {
      // Single object OR Multi-selection "Scale in Place" (each object keeps its own opposite edge/corner fixed!)
      for (const it of act.items) {
        const newW = affectsW || ev.shiftKey ? it.origW * sx : it.origW;
        const newH = affectsH || ev.shiftKey ? it.origH * sy : it.origH;
        const dw = newW - it.origW;
        const dh = newH - it.origH;

        let offsetX = 0;
        let offsetY = 0;
        if (ev.altKey) {
          offsetX = -dw / 2;
          offsetY = -dh / 2;
        } else {
          // Dragging left ('w'): right edge stays fixed -> shift left by -dw
          if (dir.includes('w')) offsetX = -dw;
          // Dragging top ('n'): bottom edge stays fixed -> grows upward by -dh!
          if (dir.includes('n')) offsetY = -dh;
        }

        applyScaledDimensionsAndEffects(
          it,
          newW,
          newH,
          it.origTx + offsetX,
          it.origTy + offsetY,
          uniformFactor
        );
      }
    } else {
      // Multi-Selection "Scale Normally" (Illustrator shared anchor point — opposite corner/edge of combined bounds!)
      const anchorRef = ev.altKey ? 'c' : (OPPOSITE_REF[dir] || 'nw');
      const anchor = getAnchorCoordsForBounds(sb, anchorRef);

      for (const it of act.items) {
        const effSx = affectsW || ev.shiftKey ? sx : 1;
        const effSy = affectsH || ev.shiftKey ? sy : 1;
        const newW = it.origW * effSx;
        const newH = it.origH * effSy;

        const targetLeft = anchor.x + (it.origRect.left - anchor.x) * effSx;
        const targetTop = anchor.y + (it.origRect.top - anchor.y) * effSy;
        const deltaLeft = targetLeft - it.origRect.left;
        const deltaTop = targetTop - it.origRect.top;

        applyScaledDimensionsAndEffects(
          it,
          newW,
          newH,
          it.origTx + deltaLeft,
          it.origTy + deltaTop,
          uniformFactor
        );
      }
    }

    renderOverlays();
  }

  function finishResizeDrag(act) {
    if (act && act.moved) {
      const entries = act.items.map((it) => ({
        kind: 'style',
        before: it.before,
        after: snapshotElementState(it.el)
      }));
      pushHistoryStep({ label: 'Scale Selection', entries });
      sendTreeAndSelectionUpdate();
    }
  }

  function startRotateDrag(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const bounds = getSelectionBounds();
    if (!bounds) return;
    const anchor = getAnchorCoordsForBounds(bounds, transformRefPoint);
    const startAngle = Math.atan2(ev.clientY - anchor.y, ev.clientX - anchor.x) * (180 / Math.PI);
    const items = selectedIds.map((id) => {
      const el = getEl(id);
      if (!el) return null;
      const { tx, ty, rot } = readElementTranslate(el);
      return { id, el, before: snapshotElementState(el), origTx: tx, origTy: ty, origRot: rot };
    }).filter(Boolean);

    pointerAction = {
      type: 'rotate',
      anchor,
      startAngle,
      items,
      moved: false
    };
  }

  function updateRotateDrag(ev) {
    const act = pointerAction;
    const curAngle = Math.atan2(ev.clientY - act.anchor.y, ev.clientX - act.anchor.x) * (180 / Math.PI);
    let delta = curAngle - act.startAngle;
    if (ev.shiftKey) delta = Math.round(delta / 15) * 15;
    act.moved = true;
    for (const it of act.items) {
      applyElementPositionOffset(it.el, it.origTx, it.origTy, it.origRot + delta);
    }
    renderOverlays();
  }

  function finishRotateDrag(act) {
    if (act && act.moved) {
      pushHistoryStep({
        label: 'Rotate Selection',
        entries: act.items.map((it) => ({ kind: 'style', before: it.before, after: snapshotElementState(it.el) }))
      });
      sendTreeAndSelectionUpdate();
    }
  }

  // =========================================================================
  // 10. SHAPE TOOL (R), FLOW DIV TOOL (D), CONVERT TO FLOW DIV, EYEDROPPER (I)
  // =========================================================================
  function buildPaintStylesString() {
    const styles = [];
    if (activePaint.fillMode === 'none') {
      styles.push('background: transparent');
    } else if (activePaint.fillMode === 'linear' || activePaint.fillMode === 'radial') {
      styles.push(`background-image: ${activePaint.fillGradient}`);
    } else {
      styles.push(`background-color: ${activePaint.fillColor || '#f97316'}`);
    }
    if (activePaint.strokeMode === 'none' || !activePaint.strokeWidth) {
      styles.push('border: none');
    } else {
      styles.push(`border: ${activePaint.strokeWidth}px ${activePaint.strokeStyle || 'solid'} ${activePaint.strokeColor || '#78716c'}`);
    }
    return styles.join('; ');
  }

  function createShapeInArtboard(box) {
    if (!document.body) return;
    const br = document.body.getBoundingClientRect();
    const x = Math.round(box.left - br.left);
    const y = Math.round(box.top - br.top);
    const w = Math.max(16, Math.round(box.width));
    const h = activeShapeKind === 'line' ? Math.max(2, activePaint.strokeWidth || 2) : Math.max(16, Math.round(box.height));

    const shape = document.createElement('div');
    shape.id = `vc_shape_${++vcSeq}_${Date.now().toString(36).slice(-4)}`;
    shape.className = 'vc-shape';
    shape.setAttribute('data-vc-created', 'shape');
    shape.setAttribute('data-vc-shape', activeShapeKind);

    let radiusCss = '0px';
    if (activeShapeKind === 'rounded') radiusCss = '12px';
    else if (activeShapeKind === 'ellipse') radiusCss = '50%';
    else if (activeShapeKind === 'pill') radiusCss = '9999px';

    const paintCss = activeShapeKind === 'line'
      ? `background-color: ${activePaint.strokeColor || activePaint.fillColor || '#f97316'}; border: none`
      : buildPaintStylesString();

    shape.setAttribute(
      'style',
      `position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; border-radius: ${radiusCss}; box-sizing: border-box; z-index: 20; ${paintCss};`
    );

    document.body.appendChild(shape);
    createdElements.add(shape);
    const vcId = ensureVcId(shape);
    pushHistoryStep({
      label: `Draw ${activeShapeKind}`,
      entries: [{ kind: 'insert', el: shape, parent: document.body, nextSibling: null }]
    });

    selectedIds = [vcId];
    activeGroupSelectionId = null;
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  function getComputedGridTrackCount(cs) {
    if (!cs || !cs.gridTemplateColumns || cs.gridTemplateColumns === 'none') return 0;
    return cs.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
  }

  function isLeafBoxRatherThanFlowSection(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.classList && (el.classList.contains('vc-flow-div') || el.classList.contains('vc-shape'))) return true;
    const tag = el.tagName;
    if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'PATH', 'CANVAS', 'IMG', 'SPAN', 'LABEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(tag)) {
      return true;
    }
    if (['MAIN', 'SECTION', 'HEADER', 'FOOTER', 'NAV', 'ASIDE', 'ARTICLE', 'FORM', 'UL', 'OL'].includes(tag)) {
      return false;
    }
    // Plain DIV: if it has 0 element children, or only inline text/icon spans inside a small box, treat its parent as the flow container!
    const elChildren = Array.from(el.children).filter((c) => !isBridgeNode(c));
    if (elChildren.length === 0) return true;
    const allInline = elChildren.every((c) => ['SPAN', 'B', 'STRONG', 'I', 'EM', 'SMALL', 'SVG', 'IMG'].includes(c.tagName));
    if (allInline && el.getBoundingClientRect().height < 140) return true;
    return false;
  }

  function isContainerHorizontalRow(container, visibleChildren) {
    const cs = getComputedStyle(container);
    if (cs.display.includes('flex')) {
      return cs.flexDirection.startsWith('row');
    }
    if (cs.display.includes('grid')) {
      const tracks = getComputedGridTrackCount(cs);
      if (tracks >= 2) return true;
    }
    if (visibleChildren && visibleChildren.length >= 2) {
      const r0 = visibleChildren[0].getBoundingClientRect();
      const r1 = visibleChildren[1].getBoundingClientRect();
      if (Math.abs(r0.top - r1.top) < Math.min(r0.height, r1.height) * 0.5 && r1.left >= r0.right - 4) {
        return true;
      }
    }
    return false;
  }

  function findFlowContainerInsertion(clientX, clientY, ignoreEl = null) {
    const stack = document.elementsFromPoint(clientX, clientY).filter(
      (el) => !isBridgeNode(el) && el !== ignoreEl && (!ignoreEl || !ignoreEl.contains(el))
    );
    let container = stack.find((el) => {
      if (isLeafBoxRatherThanFlowSection(el)) return false;
      const cs = getComputedStyle(el);
      const isLayout = cs.display.includes('flex') || cs.display.includes('grid') || el.children.length >= 1 || el === document.body;
      return isLayout && el.getBoundingClientRect().width >= 60;
    }) || document.body;

    const children = Array.from(container.children).filter((c) => !isBridgeNode(c) && c !== ignoreEl && isElementVisible(c));
    const isRow = isContainerHorizontalRow(container, children);

    let nextSibling = null;
    let dropLine = null;
    const cr = container.getBoundingClientRect();

    for (const ch of children) {
      const r = ch.getBoundingClientRect();
      if (isRow) {
        if (clientX < (r.left + r.right) / 2) {
          nextSibling = ch;
          dropLine = { left: r.left - 2, top: r.top, width: 3, height: r.height };
          break;
        }
      } else {
        if (clientY < (r.top + r.bottom) / 2) {
          nextSibling = ch;
          dropLine = { left: r.left, top: r.top - 2, width: r.width, height: 3 };
          break;
        }
      }
    }

    if (!dropLine) {
      if (children.length) {
        const lastR = children[children.length - 1].getBoundingClientRect();
        dropLine = isRow
          ? { left: lastR.right + 1, top: lastR.top, width: 3, height: lastR.height }
          : { left: lastR.left, top: lastR.bottom + 1, width: lastR.width, height: 3 };
      } else {
        dropLine = { left: cr.left + 6, top: cr.top + 6, width: Math.max(40, cr.width - 12), height: 3 };
      }
    }

    return { container, nextSibling, isRow, dropLine };
  }

  function createFlowDivAt(insertion, box) {
    const { container, nextSibling, isRow } = insertion;
    if (!container) return;

    const existingChildren = Array.from(container.children).filter((c) => !isBridgeNode(c) && isElementVisible(c));
    const draggedW = box && box.width >= 12 ? Math.round(box.width) : 0;
    const draggedH = box && box.height >= 12 ? Math.round(box.height) : 0;

    // Natural space sizing: in a horizontal row, match row height if user only clicked or dragged narrow; in vertical stack, span 100% width by default so space is cleanly reserved!
    const refSiblingH = existingChildren.length ? Math.round(existingChildren[0].getBoundingClientRect().height) : 48;
    const w = isRow ? (draggedW || 64) : draggedW;
    const h = draggedH || (isRow ? Math.max(36, refSiblingH) : 48);

    const cs = getComputedStyle(container);
    const isInlineRow = isRow && !cs.display.includes('flex') && !cs.display.includes('grid');

    const div = document.createElement('div');
    div.id = `vc_div_${++vcSeq}_${Date.now().toString(36).slice(-4)}`;
    div.className = 'vc-flow-div';
    div.setAttribute('data-vc-created', 'div');

    if (isRow) {
      div.setAttribute(
        'style',
        `display: ${isInlineRow ? 'inline-block' : 'block'}; position: relative; width: ${w}px; min-width: ${w}px; height: ${h}px; min-height: ${h}px; flex: 0 0 ${w}px; box-sizing: border-box; vertical-align: top;`
      );
    } else {
      div.setAttribute(
        'style',
        `display: block; position: relative; width: ${w ? w + 'px' : '100%'}; height: ${h}px; min-height: ${h}px; flex: 0 0 ${h}px; box-sizing: border-box;`
      );
    }

    const entries = [];

    // If inserting horizontally into a single-row explicit CSS Grid (e.g. 3 columns -> 4 columns), expand gridTemplateColumns so the new div takes up its sideways space automatically!
    const gridTracks = cs.display.includes('grid') ? getComputedGridTrackCount(cs) : 0;
    if (isRow && gridTracks >= 1 && existingChildren.length === gridTracks) {
      const beforeContainer = snapshotElementState(container);
      const insertIdx = nextSibling ? Math.max(0, existingChildren.indexOf(nextSibling)) : existingChildren.length;
      const newCols = [];
      for (let i = 0; i <= existingChildren.length; i++) {
        if (i === insertIdx) newCols.push(`${w}px`);
        if (i < existingChildren.length) newCols.push('minmax(0, 1fr)');
      }
      const nextTpl = newCols.join(' ');
      container.style.gridTemplateColumns = nextTpl;
      recordPatchedProp(container, 'grid-template-columns', nextTpl);
      entries.push({ kind: 'style', before: beforeContainer, after: snapshotElementState(container) });
    }

    if (nextSibling && nextSibling.parentNode === container) {
      container.insertBefore(div, nextSibling);
    } else {
      container.appendChild(div);
    }

    createdElements.add(div);
    const vcId = ensureVcId(div);
    entries.push({ kind: 'insert', el: div, parent: container, nextSibling });

    pushHistoryStep({
      label: 'Insert Flow Div',
      entries
    });

    selectedIds = [vcId];
    activeGroupSelectionId = null;
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  function convertSelectedToFlowDiv() {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return false;
    const entries = [];

    for (const vcId of selectedIds) {
      const el = getEl(vcId);
      if (!el || el === document.body) continue;
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2;
      const insertY = r.top + Math.min(6, r.height * 0.25);
      const insertion = findFlowContainerInsertion(cx, insertY, el);
      const targetParent = insertion.container || el.parentElement || document.body;
      const targetNext = insertion.nextSibling;

      const beforeSnap = snapshotElementState(el);
      const beforeClass = el.className;
      const beforeCreatedAttr = el.getAttribute('data-vc-created') || '';
      const oldParent = el.parentNode;
      const oldNext = el.nextSibling;

      // Convert floating/shape positioning into in-flow layout div spacer that pushes neighbors!
      el.classList.remove('vc-shape');
      el.classList.add('vc-flow-div');
      if (createdElements.has(el)) {
        el.setAttribute('data-vc-created', 'div');
      }
      el.removeAttribute('data-vc-tx');
      el.removeAttribute('data-vc-ty');

      el.style.position = 'relative';
      el.style.left = '';
      el.style.top = '';
      el.style.right = '';
      el.style.bottom = '';
      el.style.transform = '';
      el.style.display = 'block';
      el.style.flex = '0 0 auto';
      el.style.boxSizing = 'border-box';
      el.style.width = `${Math.max(12, Math.round(r.width))}px`;
      el.style.height = `${Math.max(12, Math.round(r.height))}px`;

      recordPatchedProp(el, 'position', 'relative');
      recordPatchedProp(el, 'left', null);
      recordPatchedProp(el, 'top', null);
      recordPatchedProp(el, 'transform', null);
      recordPatchedProp(el, 'display', 'block');
      recordPatchedProp(el, 'flex', '0 0 auto');
      recordPatchedProp(el, 'box-sizing', 'border-box');
      recordPatchedProp(el, 'width', el.style.width);
      recordPatchedProp(el, 'height', el.style.height);

      if (targetNext && targetNext.parentNode === targetParent && targetNext !== el) {
        targetParent.insertBefore(el, targetNext);
      } else {
        targetParent.appendChild(el);
      }

      entries.push({
        kind: 'dom_move',
        el,
        oldParent,
        oldNext,
        newParent: targetParent,
        newNext: targetNext,
        beforeSnap,
        afterSnap: snapshotElementState(el),
        beforeClass,
        afterClass: el.className,
        beforeCreatedAttr,
        afterCreatedAttr: el.getAttribute('data-vc-created') || ''
      });
    }

    if (entries.length) {
      pushHistoryStep({ label: 'Convert to Flow Div', entries });
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return true;
    }
    return false;
  }

  function sampleWithEyedropper(targetEl) {
    if (!targetEl || isBridgeNode(targetEl)) return;
    // Walk up slightly if an empty wrapper has transparent bg & zero border
    let el = targetEl;
    let cs = getComputedStyle(el);
    if (rgbToHex(cs.backgroundColor) === '' && (!cs.backgroundImage || cs.backgroundImage === 'none') && (parseFloat(cs.borderTopWidth) || 0) === 0 && el.parentElement && el.parentElement !== document.body) {
      const pcs = getComputedStyle(el.parentElement);
      if (rgbToHex(pcs.backgroundColor) || (pcs.backgroundImage && pcs.backgroundImage !== 'none') || (parseFloat(pcs.borderTopWidth) || 0) > 0) {
        el = el.parentElement;
        cs = pcs;
      }
    }

    const bgImg = cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : '';
    const fillHex = rgbToHex(cs.backgroundColor);
    const strokeW = Math.round((parseFloat(cs.borderTopWidth) || 0) * 10) / 10;
    const strokeHex = rgbToHex(cs.borderTopColor) || (el.getAttribute('stroke') || '');
    const textHex = rgbToHex(cs.color) || '#ece9e5';

    const sampled = {
      fillMode: bgImg.includes('radial-gradient') ? 'radial' : bgImg.includes('linear-gradient') ? 'linear' : fillHex ? 'solid' : 'none',
      fillColor: fillHex || textHex || '#f97316',
      fillGradient: bgImg || '',
      strokeMode: strokeW > 0 ? 'solid' : 'none',
      strokeColor: strokeHex || '#78716c',
      strokeWidth: strokeW,
      strokeStyle: cs.borderTopStyle && cs.borderTopStyle !== 'none' ? cs.borderTopStyle : 'solid',
      textColor: textHex
    };

    activePaint = { ...activePaint, ...sampled };
    sendToStudio({ type: 'vc_eyedropper_pick', paint: sampled });

    // Apply sampled Fill & Stroke directly to any currently selected elements with full Undo/Redo!
    pruneDisconnectedSelection();
    if (selectedIds.length > 0) {
      const entries = [];
      for (const id of selectedIds) {
        const selEl = getEl(id);
        if (!selEl) continue;
        const before = snapshotElementState(selEl);
        if (sampled.fillMode === 'linear' || sampled.fillMode === 'radial') {
          selEl.style.backgroundImage = sampled.fillGradient;
          recordPatchedProp(selEl, 'background-image', sampled.fillGradient);
        } else if (sampled.fillMode === 'solid') {
          selEl.style.backgroundImage = 'none';
          selEl.style.backgroundColor = sampled.fillColor;
          recordPatchedProp(selEl, 'background-image', 'none');
          recordPatchedProp(selEl, 'background-color', sampled.fillColor);
        } else {
          selEl.style.backgroundImage = 'none';
          selEl.style.backgroundColor = 'transparent';
          recordPatchedProp(selEl, 'background-image', 'none');
          recordPatchedProp(selEl, 'background-color', 'transparent');
        }
        if (sampled.strokeWidth > 0) {
          selEl.style.borderWidth = `${sampled.strokeWidth}px`;
          selEl.style.borderStyle = sampled.strokeStyle;
          selEl.style.borderColor = sampled.strokeColor;
          recordPatchedProp(selEl, 'border-width', `${sampled.strokeWidth}px`);
          recordPatchedProp(selEl, 'border-style', sampled.strokeStyle);
          recordPatchedProp(selEl, 'border-color', sampled.strokeColor);
        }
        entries.push({ kind: 'style', before, after: snapshotElementState(selEl) });
      }
      if (entries.length) {
        pushHistoryStep({ label: 'Apply Eyedropper Style', entries });
        sendTreeAndSelectionUpdate();
      }
    }
  }

  // =========================================================================
  // 11. TYPE TOOL (T) — DIRECT IN-GROUP TEXT EDITING WITHOUT ISOLATE MODE
  // =========================================================================
  function findDirectTextElementAt(rawTarget, clientX, clientY) {
    if (!rawTarget || isBridgeNode(rawTarget)) return null;
    // Check deepest element containing direct text node at click point
    const stack = document.elementsFromPoint(clientX, clientY).filter((e) => !isBridgeNode(e));
    for (const cand of stack) {
      if (['INPUT', 'TEXTAREA'].includes(cand.tagName)) return cand;
      const hasDirectText = Array.from(cand.childNodes).some(
        (n) => n.nodeType === 3 && (n.nodeValue || '').trim().length > 0
      );
      if (hasDirectText && !isEntityLocked(ensureVcId(cand))) {
        return cand;
      }
    }
    if (!isEntityLocked(ensureVcId(rawTarget)) && rawTarget !== document.body) {
      return rawTarget;
    }
    return null;
  }

  function startInlineTypeEdit(el) {
    if (!el || isBridgeNode(el)) return;
    commitInlineTypeEdit();

    const vcId = ensureVcId(el);
    if (isEntityLocked(vcId)) return;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.focus();
      selectedIds = [vcId];
      sendTreeAndSelectionUpdate();
      return;
    }

    const originText = initialTextByEl.has(el) ? initialTextByEl.get(el) : (el.textContent || '');
    if (!initialTextByEl.has(el)) initialTextByEl.set(el, originText);

    activeInlineEdit = {
      el,
      vcId,
      originText,
      beforeText: el.textContent || '',
      beforeHtml: el.innerHTML
    };

    el.setAttribute('contenteditable', 'true');
    el.classList.add('__vc_typing__');
    el.focus();

    selectedIds = [vcId];
    activeGroupSelectionId = null;
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  function commitInlineTypeEdit() {
    if (!activeInlineEdit) return;
    const { el, vcId, originText, beforeText, beforeHtml } = activeInlineEdit;
    activeInlineEdit = null;
    if (!el) return;

    el.removeAttribute('contenteditable');
    el.classList.remove('__vc_typing__');

    const afterText = el.textContent || '';
    const afterHtml = el.innerHTML;

    if (afterText !== beforeText) {
      textPatchesByEl.set(vcId, {
        id: el.id && !el.id.startsWith('vc_') ? el.id : '',
        selector: computeCleanSelector(el),
        attr: '',
        before: originText,
        after: afterText
      });
      pushHistoryStep({
        label: 'Edit Text',
        entries: [{
          kind: 'text',
          el,
          attr: '',
          originText,
          beforeText,
          afterText,
          beforeHtml,
          afterHtml
        }]
      });
    }
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  // =========================================================================
  // 12. MARQUEE INTERSECTION SELECTION (SELECTS LOWER / OVERLAPPED OBJECTS)
  // =========================================================================
  function runIllustratorMarqueeSelection(box, additive = false) {
    const mx0 = box.left;
    const my0 = box.top;
    const mx1 = box.left + box.width;
    const my1 = box.top + box.height;
    const activeIso = getActiveIsolation();

    const rawCandidates = [];
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (isBridgeNode(el) || isStructuralGridWrapper(el)) continue;
      if (['PATH', 'G', 'CIRCLE', 'RECT', 'LINE', 'POLYLINE', 'POLYGON', 'DEFS', 'STOP', 'USE', 'OPTION', 'BR', 'WBR'].includes(el.tagName.toUpperCase())) continue;
      if (activeIso) {
        if (!isElementInsideActiveIsolation(el)) continue;
        if (activeIso.kind === 'container' && ensureVcId(el) === activeIso.id) continue;
      }
      const vcId = ensureVcId(el);
      if (!vcId || isEntityLocked(vcId)) continue;
      if (!isElementVisible(el)) continue;

      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;

      // Illustrator intersection check: pure bounding-box overlap selects ALL objects at this region,
      // including lower / occluded / z-underneath objects and invisible/empty <div> boxes!
      const intersects = !(r.right < mx0 || r.left > mx1 || r.bottom < my0 || r.top > my1);
      if (!intersects) continue;

      const isCreated = el.hasAttribute('data-vc-created') || el.classList.contains('vc-shape') || el.classList.contains('vc-flow-div');
      if (!isCreated) {
        const enclosesMarquee = r.left < mx0 - 6 && r.right > mx1 + 6 && r.top < my0 - 6 && r.bottom > my1 + 6;
        // Skip broad layout containers ONLY when they completely enclose the marquee AND have child elements inside
        if (enclosesMarquee && (el.matches('section, header, nav, aside, footer') || el.children.length >= 1)) {
          continue;
        }
      }

      rawCandidates.push(el);
    }

    // Filter out inner spans/icons inside matched <button>/<a> (when Smart Btns is on),
    // AND filter out layout wrapper ancestors ONLY when the wrapper is NOT completely enclosed by the marquee
    // and its own child controls are matched, while keeping standalone/empty/enclosed <div> boxes selectable!
    const rawSet = new Set(rawCandidates);
    const matchedEls = rawCandidates.filter((el) => {
      if (autoGroupButtons && activeTool !== 'direct') {
        const pBtn = el.parentElement?.closest('button, a, [role="button"]');
        if (pBtn && rawSet.has(pBtn)) return false;
      }
      const isCreated = el.hasAttribute('data-vc-created') || el.classList.contains('vc-shape') || el.classList.contains('vc-flow-div');
      if (!isCreated && !['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'IMG', 'CANVAS', 'SVG'].includes(el.tagName.toUpperCase())) {
        const r = el.getBoundingClientRect();
        const fullyEnclosedByMarquee = r.left >= mx0 - 2 && r.right <= mx1 + 2 && r.top >= my0 - 2 && r.bottom <= my1 + 2;
        if (!fullyEnclosedByMarquee) {
          const hasMatchedDescendant = rawCandidates.some((other) => other !== el && el.contains(other));
          if (hasMatchedDescendant) return false;
        }
      }
      return true;
    });

    const refinedIds = [];
    const matchedGroups = new Set();
    for (const el of matchedEls) {
      const vcId = ensureVcId(el);
      const topGrp = activeTool !== 'direct' ? getTopmostGroupOf(vcId) : null;
      if (topGrp && !isEntityLocked(topGrp)) {
        matchedGroups.add(topGrp);
        for (const lid of expandGroupLeafIds(topGrp)) {
          if (!refinedIds.includes(lid)) refinedIds.push(lid);
        }
      } else if (!refinedIds.includes(vcId)) {
        refinedIds.push(vcId);
      }
    }

    if (additive) {
      for (const id of refinedIds) {
        if (!selectedIds.includes(id)) selectedIds.push(id);
      }
      activeGroupSelectionId = null;
    } else {
      selectedIds = refinedIds;
      if (matchedGroups.size === 1) {
        const singleGrp = Array.from(matchedGroups)[0];
        const grpLeaves = expandGroupLeafIds(singleGrp, []);
        activeGroupSelectionId =
          selectedIds.length === grpLeaves.length && grpLeaves.every((id) => selectedIds.includes(id))
            ? singleGrp
            : null;
      } else {
        activeGroupSelectionId = null;
      }
    }
    keyObjectId = null;
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  // =========================================================================
  // 13. NESTED GROUPING, LOCKING, Z-ORDER, CLIPBOARD, DELETE, ALIGN, PROPS
  // =========================================================================
  function groupSelectedItems() {
    pruneDisconnectedSelection();
    if (selectedIds.length < 1) return false;

    const beforeGroups = snapshotGroupsState();
    // Collect top-level members for the selected leaves (so grouping existing groups + new items nests cleanly!)
    const memberSet = new Set();
    for (const leafId of selectedIds) {
      const topGrp = getTopmostGroupOf(leafId);
      memberSet.add(topGrp || leafId);
    }
    const members = Array.from(memberSet);
    if (members.length === 1 && groupsById.has(members[0])) {
      // Already a single top-level group; allow wrapping into a nested parent group if requested explicitly
    }

    const gid = `grp_${groupSeq++}`;
    const gname = `Group ${groupSeq - 1}`;
    groupsById.set(gid, {
      id: gid,
      name: gname,
      memberIds: members,
      parentGroupId: null
    });
    for (const m of members) {
      parentGroupOf.set(m, gid);
      if (groupsById.has(m)) {
        groupsById.get(m).parentGroupId = gid;
      }
    }

    activeGroupSelectionId = gid;
    pushHistoryStep({
      label: `Create ${gname}`,
      entries: [{ kind: 'group', beforeGroups, afterGroups: snapshotGroupsState() }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function ungroupSelectedItems() {
    pruneDisconnectedSelection();
    const targetGroups = new Set();
    if (activeGroupSelectionId && groupsById.has(activeGroupSelectionId)) {
      targetGroups.add(activeGroupSelectionId);
    } else {
      for (const leafId of selectedIds) {
        const tg = getTopmostGroupOf(leafId);
        if (tg) targetGroups.add(tg);
      }
    }
    if (!targetGroups.size) return false;

    const beforeGroups = snapshotGroupsState();
    for (const gid of targetGroups) {
      const grp = groupsById.get(gid);
      if (!grp) continue;
      for (const m of grp.memberIds) {
        if (parentGroupOf.get(m) === gid) {
          if (grp.parentGroupId) parentGroupOf.set(m, grp.parentGroupId);
          else parentGroupOf.delete(m);
        }
        if (groupsById.has(m)) {
          groupsById.get(m).parentGroupId = grp.parentGroupId || null;
        }
      }
      groupsById.delete(gid);
      parentGroupOf.delete(gid);
    }

    activeGroupSelectionId = null;
    pushHistoryStep({
      label: 'Ungroup',
      entries: [{ kind: 'group', beforeGroups, afterGroups: snapshotGroupsState() }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function lockSelection() {
    pruneDisconnectedSelection();
    const targetId = activeGroupSelectionId || (selectedIds.length ? selectedIds : null);
    if (!targetId) return false;
    const beforeLocked = Array.from(lockedIds);
    if (typeof targetId === 'string') {
      lockedIds.add(targetId);
      lastClickedLayerLockedId = targetId;
    } else {
      targetId.forEach((id) => {
        lockedIds.add(id);
        lastClickedLayerLockedId = id;
      });
    }
    selectedIds = [];
    activeGroupSelectionId = null;
    pushHistoryStep({
      label: 'Lock Item',
      entries: [{ kind: 'lock', beforeLocked, afterLocked: Array.from(lockedIds) }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function unlockSelectedOrTarget(explicitId = '') {
    const beforeLocked = Array.from(lockedIds);
    let changed = false;
    if (explicitId && lockedIds.has(explicitId)) {
      lockedIds.delete(explicitId);
      changed = true;
    } else if (lastClickedLayerLockedId && lockedIds.has(lastClickedLayerLockedId)) {
      lockedIds.delete(lastClickedLayerLockedId);
      changed = true;
    } else if (lockedIds.size > 0) {
      // Unlock the most recently locked item when Ctrl+Alt+2 is pressed
      const last = Array.from(lockedIds).pop();
      lockedIds.delete(last);
      changed = true;
      lastClickedLayerLockedId = last;
    }
    if (!changed) return false;

    const unlockedId = explicitId || lastClickedLayerLockedId;
    if (unlockedId) {
      if (groupsById.has(unlockedId)) {
        activeGroupSelectionId = unlockedId;
        selectedIds = expandGroupLeafIds(unlockedId, []);
      } else if (getEl(unlockedId)) {
        selectedIds = [unlockedId];
      }
    }
    lastClickedLayerLockedId = null;

    pushHistoryStep({
      label: 'Unlock Item',
      entries: [{ kind: 'lock', beforeLocked, afterLocked: Array.from(lockedIds) }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function unlockAllItems() {
    if (!lockedIds.size) return false;
    const beforeLocked = Array.from(lockedIds);
    lockedIds.clear();
    lastClickedLayerLockedId = null;
    pushHistoryStep({
      label: 'Unlock All',
      entries: [{ kind: 'lock', beforeLocked, afterLocked: [] }]
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
    return true;
  }

  function arrangeSelection(modeAction) {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return false;

    // Collect sibling max/min z-index across document
    let minZ = 0;
    let maxZ = 10;
    document.querySelectorAll('*').forEach((n) => {
      if (isBridgeNode(n)) return;
      const z = parseInt(getComputedStyle(n).zIndex, 10);
      if (!isNaN(z) && Math.abs(z) < 100000) {
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
    });

    const entries = [];
    for (const vcId of selectedIds) {
      const el = getEl(vcId);
      if (!el) continue;
      const before = snapshotElementState(el);
      const cs = getComputedStyle(el);
      if (cs.position === 'static') {
        el.style.position = 'relative';
        recordPatchedProp(el, 'position', 'relative');
      }
      const curZ = parseInt(cs.zIndex, 10) || 0;
      let nextZ = curZ;
      if (modeAction === 'bring-front') nextZ = maxZ + 2;
      else if (modeAction === 'bring-forward') nextZ = curZ + 1;
      else if (modeAction === 'send-backward') nextZ = curZ - 1;
      else if (modeAction === 'send-back') nextZ = Math.min(minZ - 1, -1);

      el.style.zIndex = String(nextZ);
      recordPatchedProp(el, 'z-index', String(nextZ));
      entries.push({ kind: 'style', before, after: snapshotElementState(el) });
    }

    if (entries.length) {
      pushHistoryStep({ label: `Arrange (${modeAction})`, entries });
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return true;
    }
    return false;
  }

  function copySelectionToClipboard() {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return false;
    clipboardItems = selectedIds.map((id) => {
      const el = getEl(id);
      if (!el) return null;
      return {
        html: buildCleanElementOuterHtml(el),
        parentSelector: computeCleanSelector(el.parentElement || document.body),
        wasShape: el.getAttribute('data-vc-created') === 'shape'
      };
    }).filter(Boolean);
    return clipboardItems.length > 0;
  }

  function hasDirectNonEmptyText(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent && n.textContent.trim().length > 0) return true;
    }
    return false;
  }

  function deleteSelection(recordLabel = 'Delete Selection') {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return false;
    const entries = [];
    const affectedParents = new Map(); // parentEl -> { tracksBefore, prevVisibleCount }

    const noteAffectedParent = (p) => {
      if (!p || p.nodeType !== 1 || p === document.documentElement || affectedParents.has(p)) return;
      const cs = getComputedStyle(p);
      const visCount = Array.from(p.children).filter((c) => !isBridgeNode(c) && isElementVisible(c)).length;
      affectedParents.set(p, {
        tracksBefore: cs.display.includes('grid') ? getComputedGridTrackCount(cs) : 0,
        prevVisibleCount: visCount,
        wasSpaceBetween: cs.display.includes('flex') && cs.flexDirection.startsWith('row') && cs.justifyContent === 'space-between'
      });
    };

    for (const vcId of [...selectedIds]) {
      const el = getEl(vcId);
      if (!el || el === document.body || el === document.documentElement || !el.parentNode) continue;
      const parent = el.parentNode;
      noteAffectedParent(parent);
      const nextSibling = el.nextSibling;
      const wasCreated = createdElements.has(el);
      const staticRecord = wasCreated ? null : {
        id: el.id && !el.id.startsWith('vc_') ? el.id : '',
        selector: computeCleanSelector(el),
        el,
        parent,
        nextSibling
      };
      parent.removeChild(el);
      if (wasCreated) createdElements.delete(el);
      else deletedStaticRecords.set(vcId, staticRecord);

      entries.push({
        kind: 'delete',
        el,
        parent,
        nextSibling,
        vcId,
        wasCreated,
        staticRecord
      });
    }

    // 1. Collapse wrapper boxes/sections that had children before deletion and are now completely empty so they never leave vertical or sideways gaps!
    for (const [parent, meta] of [...affectedParents.entries()]) {
      let cur = parent;
      let curPrevCount = meta.prevVisibleCount;
      while (cur && cur !== document.body && cur !== document.documentElement && cur.isConnected) {
        if (cur.classList && cur.classList.contains('vc-flow-div')) break;
        const remVis = Array.from(cur.children).filter((c) => !isBridgeNode(c) && isElementVisible(c));
        if (curPrevCount >= 1 && remVis.length === 0 && !hasDirectNonEmptyText(cur)) {
          const grandParent = cur.parentElement;
          if (grandParent) noteAffectedParent(grandParent);
          const beforeWrap = snapshotElementState(cur);
          cur.style.display = 'none';
          recordPatchedProp(cur, 'display', 'none');
          entries.push({ kind: 'style', before: beforeWrap, after: snapshotElementState(cur) });
          cur = grandParent;
          curPrevCount = 1;
        } else {
          break;
        }
      }
    }

    // 2. Reflow affected multi-column CSS Grids and space-between Flex rows so surrounding boxes close sideways & vertical gaps automatically!
    for (const [parent, meta] of affectedParents.entries()) {
      if (!parent || !parent.isConnected) continue;
      const cs = getComputedStyle(parent);
      if (cs.display === 'none') continue;
      const remChildren = Array.from(parent.children).filter((c) => !isBridgeNode(c) && isElementVisible(c));
      if (remChildren.length >= 1 && cs.display.includes('grid')) {
        const tracksNow = getComputedGridTrackCount(cs);
        if (tracksNow > remChildren.length || (meta.tracksBefore >= 2 && meta.prevVisibleCount === meta.tracksBefore && remChildren.length < meta.tracksBefore)) {
          const beforeGrid = snapshotElementState(parent);
          const nextTpl = `repeat(${remChildren.length}, minmax(0, 1fr))`;
          parent.style.gridTemplateColumns = nextTpl;
          recordPatchedProp(parent, 'grid-template-columns', nextTpl);
          entries.push({ kind: 'style', before: beforeGrid, after: snapshotElementState(parent) });
          for (const rc of remChildren) {
            const rcs = getComputedStyle(rc);
            if (rc.style.gridColumn || (rcs.gridColumnStart && rcs.gridColumnStart !== 'auto')) {
              const beforeChild = snapshotElementState(rc);
              rc.style.gridColumn = 'auto';
              recordPatchedProp(rc, 'grid-column', 'auto');
              entries.push({ kind: 'style', before: beforeChild, after: snapshotElementState(rc) });
            }
          }
        }
      } else if (remChildren.length >= 1 && meta.wasSpaceBetween && remChildren.length < meta.prevVisibleCount) {
        const beforeFlex = snapshotElementState(parent);
        parent.style.justifyContent = 'flex-start';
        if (!cs.columnGap || cs.columnGap === 'normal' || parseFloat(cs.columnGap) === 0) {
          parent.style.gap = '16px';
          recordPatchedProp(parent, 'gap', '16px');
        }
        recordPatchedProp(parent, 'justify-content', 'flex-start');
        entries.push({ kind: 'style', before: beforeFlex, after: snapshotElementState(parent) });
      }
    }

    syncAuthoritativeStyleRules();
    selectedIds = [];
    activeGroupSelectionId = null;
    keyObjectId = null;
    if (entries.length) {
      pushHistoryStep({ label: recordLabel, entries });
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return true;
    }
    return false;
  }

  function pasteFromClipboard() {
    if (!clipboardItems.length || !document.body) return false;
    const entries = [];
    const newSel = [];
    for (const item of clipboardItems) {
      const temp = document.createElement('div');
      temp.innerHTML = item.html.trim();
      const clone = temp.firstElementChild;
      if (!clone) continue;

      // Ensure unique ID on pasted element
      if (clone.id) clone.id = `${clone.id}_copy_${Math.random().toString(36).slice(2, 5)}`;
      if (!clone.getAttribute('data-vc-created')) {
        clone.setAttribute('data-vc-created', 'paste');
      }

      let targetParent = null;
      try {
        if (item.parentSelector) targetParent = document.querySelector(item.parentSelector);
      } catch (_) {}
      if (!targetParent) targetParent = document.body;

      // Offset slightly so pasted copy is immediately visible
      if (clone.style.position === 'absolute' || item.wasShape) {
        clone.style.left = `${(parseFloat(clone.style.left) || 40) + 18}px`;
        clone.style.top = `${(parseFloat(clone.style.top) || 40) + 18}px`;
      } else {
        const tx = (parseFloat(clone.getAttribute('data-vc-tx') || '0') || 0) + 14;
        const ty = (parseFloat(clone.getAttribute('data-vc-ty') || '0') || 0) + 14;
        clone.setAttribute('data-vc-tx', String(tx));
        clone.setAttribute('data-vc-ty', String(ty));
        clone.style.transform = `translate(${tx}px, ${ty}px)`;
      }

      targetParent.appendChild(clone);
      createdElements.add(clone);
      const newId = ensureVcId(clone);
      newSel.push(newId);
      entries.push({ kind: 'insert', el: clone, parent: targetParent, nextSibling: null });
    }

    if (entries.length) {
      selectedIds = newSel;
      activeGroupSelectionId = null;
      pushHistoryStep({ label: 'Paste', entries });
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return true;
    }
    return false;
  }

  // =========================================================================
  // 14. ILLUSTRATOR ALIGN & DISTRIBUTE + INSPECTOR STYLE PATCHING + FONTS
  // =========================================================================
  function collectAlignmentUnits() {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return [];

    const units = [];
    const consumedIds = new Set();

    if (activeTool !== 'direct') {
      for (const id of selectedIds) {
        if (consumedIds.has(id)) continue;
        const topGrp = getTopmostGroupOf(id);
        if (topGrp && groupsById.has(topGrp)) {
          const grpLeaves = expandGroupLeafIds(topGrp, []);
          const allSelected = grpLeaves.length > 0 && grpLeaves.every((lid) => selectedIds.includes(lid));
          if (allSelected) {
            grpLeaves.forEach((lid) => consumedIds.add(lid));
            const rawEls = grpLeaves.map(getEl).filter(Boolean);
            const topEls = rawEls.filter((el) => !rawEls.some((other) => other !== el && other.contains(el)));
            if (!topEls.length) continue;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const members = topEls.map((el) => {
              const r = el.getBoundingClientRect();
              minX = Math.min(minX, r.left);
              minY = Math.min(minY, r.top);
              maxX = Math.max(maxX, r.right);
              maxY = Math.max(maxY, r.bottom);
              const { tx, ty, rot } = readElementTranslate(el);
              return { el, before: snapshotElementState(el), tx, ty, rot };
            });
            units.push({
              unitId: topGrp,
              isKey: Boolean(keyObjectId && grpLeaves.includes(keyObjectId)),
              r: { left: minX, top: minY, right: maxX, bottom: maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) },
              members
            });
          }
        }
      }
    }

    const remItems = selectedIds
      .filter((id) => !consumedIds.has(id))
      .map((id) => ({ id, el: getEl(id) }))
      .filter((x) => Boolean(x.el));

    const topRemItems = remItems.filter(
      (item) => !remItems.some((other) => other.el !== item.el && other.el.contains(item.el))
    );

    for (const { id, el } of topRemItems) {
      const r = el.getBoundingClientRect();
      const { tx, ty, rot } = readElementTranslate(el);
      units.push({
        unitId: id,
        isKey: id === keyObjectId,
        r: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: Math.max(1, r.width), height: Math.max(1, r.height) },
        members: [{ el, before: snapshotElementState(el), tx, ty, rot }]
      });
    }

    return units;
  }

  function shiftAlignmentUnit(unit, dx, dy) {
    for (const m of unit.members) {
      if (getComputedStyle(m.el).display === 'inline') {
        m.el.style.display = 'inline-block';
        recordPatchedProp(m.el, 'display', 'inline-block');
      }
    }
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
    for (const m of unit.members) {
      applyElementPositionOffset(m.el, m.tx + dx, m.ty + dy, m.rot);
    }
  }

  function alignSelection(alignType, gapPx = 0) {
    const units = collectAlignmentUnits();
    if (!units.length) return;

    const br = document.body
      ? document.body.getBoundingClientRect()
      : { left: 0, top: 0, right: artboardWidth, bottom: artboardHeight, width: artboardWidth, height: artboardHeight };
    const isoBounds = getActiveIsolation() ? getIsolatedBounds() : null;

    let unionMinX = Infinity, unionMinY = Infinity, unionMaxX = -Infinity, unionMaxY = -Infinity;
    for (const u of units) {
      unionMinX = Math.min(unionMinX, u.r.left);
      unionMinY = Math.min(unionMinY, u.r.top);
      unionMaxX = Math.max(unionMaxX, u.r.right);
      unionMaxY = Math.max(unionMaxY, u.r.bottom);
    }
    const unionRect = {
      left: unionMinX,
      top: unionMinY,
      right: unionMaxX,
      bottom: unionMaxY,
      width: Math.max(1, unionMaxX - unionMinX),
      height: Math.max(1, unionMaxY - unionMinY)
    };

    let refRect = br;
    if (alignKeyMode === '__artboard__') {
      refRect = br;
    } else if (alignKeyMode === '__key__' && keyObjectId) {
      const kUnit = units.find((u) => u.isKey);
      refRect = kUnit ? kUnit.r : (units.length > 1 ? unionRect : (isoBounds || br));
    } else if (units.length > 1) {
      refRect = unionRect;
    } else {
      refRect = isoBounds || br;
    }

    if (alignType.startsWith('dist-') && units.length >= 3) {
      if (['dist-left', 'dist-x', 'dist-right'].includes(alignType)) {
        const sorted = [...units].sort((a, b) => a.r.left - b.r.left);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const spanStart = alignType === 'dist-left' ? first.r.left : alignType === 'dist-right' ? first.r.right : (first.r.left + first.r.right) / 2;
        const spanEnd = alignType === 'dist-left' ? last.r.left : alignType === 'dist-right' ? last.r.right : (last.r.left + last.r.right) / 2;
        const step = (spanEnd - spanStart) / (sorted.length - 1);
        sorted.forEach((u, idx) => {
          if (idx === 0 || idx === sorted.length - 1) return;
          const target = spanStart + step * idx;
          const cur = alignType === 'dist-left' ? u.r.left : alignType === 'dist-right' ? u.r.right : (u.r.left + u.r.right) / 2;
          shiftAlignmentUnit(u, target - cur, 0);
        });
      } else {
        const sorted = [...units].sort((a, b) => a.r.top - b.r.top);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const spanStart = alignType === 'dist-top' ? first.r.top : alignType === 'dist-bottom' ? first.r.bottom : (first.r.top + first.r.bottom) / 2;
        const spanEnd = alignType === 'dist-top' ? last.r.top : alignType === 'dist-bottom' ? last.r.bottom : (last.r.top + last.r.bottom) / 2;
        const step = (spanEnd - spanStart) / (sorted.length - 1);
        sorted.forEach((u, idx) => {
          if (idx === 0 || idx === sorted.length - 1) return;
          const target = spanStart + step * idx;
          const cur = alignType === 'dist-top' ? u.r.top : alignType === 'dist-bottom' ? u.r.bottom : (u.r.top + u.r.bottom) / 2;
          shiftAlignmentUnit(u, 0, target - cur);
        });
      }
    } else if ((alignType === 'space-x' || alignType === 'space-y') && units.length >= 2) {
      const isX = alignType === 'space-x';
      const sorted = [...units].sort((a, b) => (isX ? a.r.left - b.r.left : a.r.top - b.r.top));
      let cursor = isX ? sorted[0].r.right : sorted[0].r.bottom;
      for (let i = 1; i < sorted.length; i++) {
        const u = sorted[i];
        if (isX) {
          const dx = cursor + gapPx - u.r.left;
          shiftAlignmentUnit(u, dx, 0);
          cursor = cursor + gapPx + u.r.width;
        } else {
          const dy = cursor + gapPx - u.r.top;
          shiftAlignmentUnit(u, 0, dy);
          cursor = cursor + gapPx + u.r.height;
        }
      }
    } else {
      for (const u of units) {
        if (alignKeyMode === '__key__' && u.isKey && units.length > 1) continue;
        let dx = 0;
        let dy = 0;
        if (alignType === 'left') dx = refRect.left - u.r.left;
        else if (alignType === 'center-x') dx = (refRect.left + refRect.right) / 2 - (u.r.left + u.r.right) / 2;
        else if (alignType === 'right') dx = refRect.right - u.r.right;
        else if (alignType === 'top') dy = refRect.top - u.r.top;
        else if (alignType === 'center-y') dy = (refRect.top + refRect.bottom) / 2 - (u.r.top + u.r.bottom) / 2;
        else if (alignType === 'bottom') dy = refRect.bottom - u.r.bottom;
        shiftAlignmentUnit(u, dx, dy);
      }
    }

    syncAuthoritativeStyleRules();
    const entries = [];
    for (const u of units) {
      for (const m of u.members) {
        entries.push({ kind: 'style', before: m.before, after: snapshotElementState(m.el) });
      }
    }
    pushHistoryStep({
      label: `Align (${alignType})`,
      entries
    });
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  function ensureGoogleFontLoadedInDom(fontFamily) {
    const clean = String(fontFamily || '').trim();
    if (!clean || clean === 'Inherit' || clean === 'inherit') return;
    const id = `__vc_gfont_${clean.replace(/[^a-z0-9]/gi, '_')}__`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.setAttribute('data-vc-bridge', 'true');
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    (document.head || document.documentElement).appendChild(link);
  }

  function hexToRgbTuple(hex) {
    const clean = rgbToHex(hex);
    if (!/^#[0-9a-f]{6}$/i.test(clean)) return '';
    const r = parseInt(clean.slice(1, 3), 16);
    const g = parseInt(clean.slice(3, 5), 16);
    const b = parseInt(clean.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  function ensurePagePaletteProfile() {
    if (pagePaletteProfile) return pagePaletteProfile;
    const primaryVarSet = new Set([
      '--primary', '--accent', '--acc', '--brand', '--color-primary',
      '--bs-primary', '--theme-primary', '--cta', '--highlight'
    ]);
    const secondaryVarSet = new Set([
      '--secondary', '--sec', '--acc2', '--accent-2', '--color-secondary',
      '--bs-secondary', '--theme-secondary', '--surface', '--panel', '--card',
      '--bg-secondary', '--card-bg', '--panel-bg', '--bdr', '--muted', '--mut'
    ]);

    let cssAccumulator = '';
    try {
      for (const sheet of Array.from(document.styleSheets || [])) {
        if (sheet.ownerNode && sheet.ownerNode.hasAttribute && sheet.ownerNode.hasAttribute('data-vc-bridge')) continue;
        let rules;
        try { rules = sheet.cssRules; } catch (_) { continue; }
        if (!rules) continue;
        for (const r of Array.from(rules)) {
          const txt = r.cssText || '';
          cssAccumulator += '\n' + txt;
          const declMatches = txt.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g);
          for (const dm of declMatches) {
            const prop = dm[1];
            if (/^--(?:[\w-]*?(?:primary|accent|brand|cta)|acc)$/i.test(prop) && !/rgb|fg|text/i.test(prop)) {
              primaryVarSet.add(prop);
            } else if (/^--(?:[\w-]*?(?:secondary|surface|panel|card|muted)|sec|acc2|mut|bdr)$/i.test(prop) && !/rgb/i.test(prop)) {
              secondaryVarSet.add(prop);
            }
          }
        }
      }
    } catch (_) {}

    const usesPrimaryCssVars = Array.from(primaryVarSet).some((v) => cssAccumulator.includes(`var(${v}`));
    const usesSecondaryCssVars = Array.from(secondaryVarSet).some((v) => cssAccumulator.includes(`var(${v}`));

    // Detect initial colors for UI swatch display without mutating page
    let detectedPrimary = '';
    let detectedSecondary = '';
    try {
      const rootCs = getComputedStyle(document.documentElement);
      for (const v of primaryVarSet) {
        const val = rgbToHex(rootCs.getPropertyValue(v));
        if (val) { detectedPrimary = val; break; }
      }
      for (const v of secondaryVarSet) {
        const val = rgbToHex(rootCs.getPropertyValue(v));
        if (val) { detectedSecondary = val; break; }
      }
      if (!detectedPrimary && document.body) {
        const cta = document.body.querySelector('button.primary, .btn-primary, .cta, button, a.btn');
        if (cta && !isBridgeNode(cta)) {
          detectedPrimary = rgbToHex(getComputedStyle(cta).backgroundColor) || '';
        }
      }
      if (!detectedSecondary && document.body) {
        const secEl = document.body.querySelector('button.secondary, .btn-secondary, .secondary, .card, .panel, section');
        if (secEl && !isBridgeNode(secEl)) {
          const scs = getComputedStyle(secEl);
          detectedSecondary = rgbToHex(scs.backgroundColor) || rgbToHex(scs.borderTopColor) || '';
        }
      }
    } catch (_) {}

    pagePaletteProfile = {
      primaryVars: Array.from(primaryVarSet),
      secondaryVars: Array.from(secondaryVarSet),
      usesPrimaryCssVars,
      usesSecondaryCssVars,
      detectedPrimary: detectedPrimary || '#f97316',
      detectedSecondary: detectedSecondary || '#a8a29e'
    };
    return pagePaletteProfile;
  }

  function buildPaletteThemeCss(pal = {}) {
    const profile = ensurePagePaletteProfile();
    const p = pal.primary ? rgbToHex(pal.primary) : '';
    const s = pal.secondary ? rgbToHex(pal.secondary) : '';
    const extra = String(pal.extraCss || '').trim();
    const blocks = [];
    const rootDecls = [];

    if (p) {
      for (const v of profile.primaryVars) {
        rootDecls.push(`${v}: ${p} !important;`);
      }
      const pRgb = hexToRgbTuple(p);
      if (pRgb) {
        rootDecls.push(`--primary-rgb: ${pRgb} !important;`);
        rootDecls.push(`--acc-rgb: ${pRgb} !important;`);
      }
    }

    if (s) {
      for (const v of profile.secondaryVars) {
        rootDecls.push(`${v}: ${s} !important;`);
      }
      const sRgb = hexToRgbTuple(s);
      if (sRgb) {
        rootDecls.push(`--secondary-rgb: ${sRgb} !important;`);
      }
    }

    if (rootDecls.length) {
      blocks.push(`:root {\n  ${rootDecls.join('\n  ')}\n}`);
    }

    // Semantic selectors so Primary & Secondary ALWAYS work even on plain HTML/CSS pages without CSS variables!
    if (p) {
      blocks.push(
        `button.primary, .btn-primary, .primary, .cta, [class*="btn-primary"], [data-vc-role="primary"] {\n` +
        `  background-color: ${p} !important;\n  border-color: ${p} !important;\n}`
      );
      if (!profile.usesPrimaryCssVars) {
        blocks.push(
          `body button:not([data-vc-bridge]):not(.secondary):not(.btn-secondary):not([class*="secondary"]):not([class*="ghost"]):not([class*="outline"]),\n` +
          `body a.btn:not(.secondary):not(.btn-secondary),\n` +
          `body input[type="submit"], body input[type="button"] {\n` +
          `  background-color: ${p} !important;\n  border-color: ${p} !important;\n}\n` +
          `body a:not(.btn):not([class*="btn"]), .accent, .text-primary, [class*="text-primary"] {\n` +
          `  color: ${p} !important;\n}`
        );
      }
    }

    if (s) {
      blocks.push(
        `button.secondary, .btn-secondary, .secondary, [class*="btn-secondary"], .badge-secondary, [data-vc-role="secondary"] {\n` +
        `  background-color: ${s} !important;\n  border-color: ${s} !important;\n}`
      );
      if (!profile.usesSecondaryCssVars) {
        blocks.push(
          `body .card:not([data-vc-bridge]), body .panel:not([data-vc-bridge]), body section:not([data-vc-bridge]), body article:not([data-vc-bridge]), body aside:not([data-vc-bridge]), body [class*="card"]:not([data-vc-bridge]) {\n` +
          `  border-color: ${s} !important;\n}\n` +
          `body .sub, body .subtitle, body .muted, body .lead, body h2:not([data-vc-bridge]), body [class*="text-secondary"] {\n` +
          `  color: ${s} !important;\n}`
        );
      }
    }

    if (extra) blocks.push(extra);
    return blocks.join('\n');
  }

  function syncPaletteToStudio() {
    const profile = ensurePagePaletteProfile();
    sendToStudio({
      type: 'vc_palette_sync',
      palette: {
        primary: activePalette.primary || profile.detectedPrimary,
        secondary: activePalette.secondary || profile.detectedSecondary,
        rawPrimary: activePalette.primary,
        rawSecondary: activePalette.secondary,
        presetId: activePalette.presetId || 'original'
      }
    });
  }

  function applyLiveThemeTag(cssText) {
    let tag = document.getElementById('__vc_live_theme__');
    if (!cssText) {
      if (tag) tag.remove();
      return;
    }
    if (!tag) {
      tag = document.createElement('style');
      tag.id = '__vc_live_theme__';
      tag.setAttribute('data-vc-bridge', 'true');
      (document.head || document.documentElement).appendChild(tag);
    }
    tag.textContent = cssText;
  }

  // Supports live scrubby preview (commit=false) AND single Undo step commit (commit=true)
  let pendingScrubStep = null;

  function applyStylePatchFromInspector(patchMsg) {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return;
    const { props, previewOnly, commitScrub, googleFont, scalePercent, xPos, yPos, rotateDeg, unfillTarget } = patchMsg;

    if (!pendingScrubStep) {
      pendingScrubStep = selectedIds.map((id) => {
        const el = getEl(id);
        return el ? { id, el, before: snapshotElementState(el), scaleItem: captureScaleItem(id) } : null;
      }).filter(Boolean);
    }

    const beforeFonts = Array.from(loadedGoogleFonts);
    if (googleFont && googleFont !== 'inherit') {
      loadedGoogleFonts.add(googleFont);
      ensureGoogleFontLoadedInDom(googleFont);
    }

    const bounds = getSelectionBounds();
    const br = document.body ? document.body.getBoundingClientRect() : { left: 0, top: 0 };

    for (const item of pendingScrubStep) {
      const el = item.el;
      if (!el) continue;

      if (xPos !== undefined && bounds) {
        const { tx, ty, rot } = readElementTranslate(el);
        const curArtX = bounds.artboardX;
        applyElementPositionOffset(el, tx + (xPos - curArtX), ty, rot);
      }
      if (yPos !== undefined && bounds) {
        const { tx, ty, rot } = readElementTranslate(el);
        const curArtY = bounds.artboardY;
        applyElementPositionOffset(el, tx, ty + (yPos - curArtY), rot);
      }
      if (rotateDeg !== undefined) {
        const { tx, ty } = readElementTranslate(el);
        applyElementPositionOffset(el, tx, ty, rotateDeg);
      }
      if (scalePercent !== undefined && item.scaleItem) {
        const factor = Math.max(0.1, scalePercent / 100);
        const si = item.scaleItem;
        if (pendingScrubStep.length > 1 && prefs.multiScaleMode === 'normal' && bounds) {
          const anchor = getAnchorCoordsForBounds(
            {
              left: pendingScrubStep[0].scaleItem.origRect.left,
              top: pendingScrubStep[0].scaleItem.origRect.top,
              right: Math.max(...pendingScrubStep.map((p) => p.scaleItem.origRect.right)),
              bottom: Math.max(...pendingScrubStep.map((p) => p.scaleItem.origRect.bottom))
            },
            transformRefPoint
          );
          const tLeft = anchor.x + (si.origRect.left - anchor.x) * factor;
          const tTop = anchor.y + (si.origRect.top - anchor.y) * factor;
          applyScaledDimensionsAndEffects(
            si,
            si.origW * factor,
            si.origH * factor,
            si.origTx + (tLeft - si.origRect.left),
            si.origTy + (tTop - si.origRect.top),
            factor
          );
        } else {
          const newW = si.origW * factor;
          const newH = si.origH * factor;
          applyScaledDimensionsAndEffects(
            si,
            newW,
            newH,
            si.origTx - (newW - si.origW) / 2,
            si.origTy - (newH - si.origH) / 2,
            factor
          );
        }
      }

      if (unfillTarget === 'fill') {
        el.setAttribute('data-vc-unfill-fill', '1');
        el.style.setProperty('background', 'none');
        el.style.setProperty('background-color', 'transparent');
        el.style.setProperty('background-image', 'none');
        recordPatchedProp(el, 'background', 'none');
        recordPatchedProp(el, 'background-color', 'transparent');
        recordPatchedProp(el, 'background-image', 'none');
      } else if (unfillTarget === 'stroke') {
        el.setAttribute('data-vc-unfill-stroke', '1');
        el.style.setProperty('border', 'none');
        el.style.setProperty('border-width', '0px');
        el.style.setProperty('border-style', 'none');
        el.style.setProperty('border-color', 'transparent');
        recordPatchedProp(el, 'border', 'none');
        recordPatchedProp(el, 'border-width', '0px');
        recordPatchedProp(el, 'border-style', 'none');
        recordPatchedProp(el, 'border-color', 'transparent');
      }

      if (props && typeof props === 'object') {
        const hasVisibleFill =
          (props.backgroundColor && props.backgroundColor !== 'transparent' && props.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
          (props.backgroundImage && props.backgroundImage !== 'none');
        if (hasVisibleFill && unfillTarget !== 'fill') {
          el.removeAttribute('data-vc-unfill-fill');
          if (el.style.background === 'none') el.style.removeProperty('background');
          recordPatchedProp(el, 'background', null);
        }

        const nextBw = props.borderWidth !== undefined ? parseFloat(props.borderWidth) : NaN;
        const hasVisibleStroke = (!Number.isNaN(nextBw) && nextBw > 0) || (props.borderStyle && props.borderStyle !== 'none' && Number.isNaN(nextBw) && el.getAttribute('data-vc-unfill-stroke') !== '1');
        if (!Number.isNaN(nextBw) && nextBw === 0) {
          el.setAttribute('data-vc-unfill-stroke', '1');
        } else if (hasVisibleStroke && unfillTarget !== 'stroke') {
          el.removeAttribute('data-vc-unfill-stroke');
          if (el.style.border === 'none') el.style.removeProperty('border');
          recordPatchedProp(el, 'border', null);
        }

        for (const [k, v] of Object.entries(props)) {
          const kebab = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
          if (v === null || v === '') {
            el.style.removeProperty(kebab);
            recordPatchedProp(el, kebab, null);
          } else {
            el.style.setProperty(kebab, String(v));
            recordPatchedProp(el, kebab, String(v));
          }
        }
      }
    }

    syncAuthoritativeStyleRules();
    renderOverlays();

    if (!previewOnly || commitScrub) {
      const entries = pendingScrubStep.map((it) => ({
        kind: 'style',
        before: it.before,
        after: snapshotElementState(it.el)
      }));
      if (googleFont && !beforeFonts.includes(googleFont)) {
        entries.push({
          kind: 'doc_meta',
          beforeFonts,
          afterFonts: Array.from(loadedGoogleFonts),
          beforeTheme: activeThemeCss,
          afterTheme: activeThemeCss
        });
      }
      pendingScrubStep = null;
      pushHistoryStep({ label: 'Update Properties', entries });
      sendTreeAndSelectionUpdate();
    }
  }

  function activateAndSelectSession(sessionId) {
    collectNamedSessions();
    const sess = namedSessions.find((s) => s.sessionId === sessionId);
    if (!sess) return;
    let clickedTab = false;
    if (sess.tabTriggerSelector) {
      try {
        const trig = document.querySelector(sess.tabTriggerSelector);
        if (trig) {
          trig.click();
          clickedTab = true;
        }
      } catch (_) {}
    }
    if (!clickedTab) {
      const targetLower = sess.name.toLowerCase();
      const fallbackBtn = Array.from(
        document.querySelectorAll('.tabbar button, .tabs button, [role="tablist"] button, [role="tab"]')
      ).find((b) => !isBridgeNode(b) && isElementVisible(b) && (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === targetLower);
      if (fallbackBtn) {
        fallbackBtn.click();
        clickedTab = true;
      }
    }
    setTimeout(() => {
      collectNamedSessions();
      const updated = namedSessions.find((s) => s.name === sess.name) || sess;
      const el = getEl(updated.vcId);
      if (el && !isEntityLocked(updated.vcId)) {
        selectedIds = [updated.vcId];
        activeGroupSelectionId = null;
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        renderOverlays();
        sendTreeAndSelectionUpdate();
      }
    }, clickedTab ? 60 : 0);
  }

  // =========================================================================
  // 15. GRAMMAR SCANNER & QUICK CATEGORY SELECT
  // =========================================================================
  const COMMON_TYPOS = {
    teh: 'the', recieve: 'receive', adress: 'address', occured: 'occurred',
    seperate: 'separate', definately: 'definitely',寬: '', enviroment: 'environment',
    vison: 'vision', multipol: 'multiple', singel: 'single', relode: 'reload'
  };

  function scanGrammarIssues(ignoredWords = []) {
    const ignoreSet = new Set(ignoredWords.map((w) => String(w).toLowerCase()));
    const issues = [];
    if (!document.body) return issues;
    document.body.querySelectorAll('h1,h2,h3,h4,p,span,button,label,a').forEach((el) => {
      if (isBridgeNode(el) || el.children.length > 0 || !isElementVisible(el)) return;
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 180) return;
      const words = txt.split(/\s+/);
      for (const raw of words) {
        const clean = raw.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
        const low = clean.toLowerCase();
        if (!low || ignoreSet.has(low)) continue;
        if (COMMON_TYPOS[low]) {
          issues.push({
            vcId: ensureVcId(el),
            bad: clean,
            good: COMMON_TYPOS[low],
            reason: 'Spelling suggestion'
          });
        }
      }
    });
    return issues.slice(0, 30);
  }

  function quickSelectCategory(cat) {
    if (cat === 'sections') {
      showAllSessionsOverlay = !showAllSessionsOverlay;
      renderOverlays();
      sendTreeAndSelectionUpdate();
      return;
    }
    const selMap = {
      headers: 'h1, h2, h3, .tag, .mhead',
      'main-text': 'p, li, .vpl-desc-text',
      'sec-text': 'small, .hint, .lbl, label',
      buttons: 'button, .btn',
      inputs: 'input, select, textarea',
      cards: '.card, .vc-flow-div, .vc-shape, div[id]'
    };
    const q = selMap[cat];
    if (!q || !document.body) return;
    const found = [];
    document.body.querySelectorAll(q).forEach((el) => {
      if (isBridgeNode(el) || !isElementVisible(el)) return;
      const id = ensureVcId(el);
      if (id && !isEntityLocked(id)) found.push(id);
    });
    selectedIds = found.slice(0, 80);
    activeGroupSelectionId = null;
    renderOverlays();
    sendTreeAndSelectionUpdate();
  }

  // =========================================================================
  // 16. INPUT EVENTS (MIDDLE-CLICK PAN, CTRL+SPACE+WHEEL ZOOM, TOOLS, KEYS)
  // =========================================================================
  window.addEventListener('auxclick', (ev) => {
    if (ev.button === 1) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);

  const scheduleOverlayRefresh = () => {
    const raf = window.__vcNativeRAF || requestAnimationFrame;
    raf(() => renderOverlays());
  };

  // Block 3D OrbitControls / target-page pointer listeners in Edit mode without cancelling compatibility mouse events!
  for (const ptrEvt of ['pointerdown', 'pointermove', 'pointerup']) {
    window.addEventListener(ptrEvt, (ev) => {
      if (mode !== 'edit') return;
      if (ev.target && ev.target.closest && ev.target.closest('#__vc_overlay_root__')) return;
      if (activeInlineEdit && activeInlineEdit.el.contains(ev.target)) return;
      ev.stopImmediatePropagation();
    }, true);
  }

  window.addEventListener('touchmove', (ev) => {
    if (mode !== 'edit') return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
  }, { passive: false, capture: true });

  window.addEventListener('wheel', (ev) => {
    if (ev.ctrlKey || ev.metaKey || (spaceHeld && ev.ctrlKey)) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      sendToStudio({
        type: 'vc_wheel_zoom',
        deltaY: ev.deltaY,
        clientX: ev.clientX,
        clientY: ev.clientY
      });
      return;
    }
    if (mode === 'edit') {
      // Edit mode freezes the page like a static snapshot — scrolling does NOT run in Edit mode!
      ev.preventDefault();
      ev.stopImmediatePropagation();
      return;
    }
    scheduleOverlayRefresh();
  }, { passive: false, capture: true });

  window.addEventListener('scroll', (ev) => {
    if (mode === 'edit' && !restoringFrozenScroll) {
      restoringFrozenScroll = true;
      try {
        const tgt = ev.target;
        if (!tgt || tgt === document || tgt === document.documentElement || tgt === document.body) {
          if (window.scrollX !== frozenWindowScroll.x || window.scrollY !== frozenWindowScroll.y) {
            window.scrollTo(frozenWindowScroll.x, frozenWindowScroll.y);
          }
        } else if (tgt.nodeType === 1) {
          const saved = frozenElementScrolls.get(tgt);
          const lockTop = saved ? saved.top : 0;
          const lockLeft = saved ? saved.left : 0;
          if (tgt.scrollTop !== lockTop) tgt.scrollTop = lockTop;
          if (tgt.scrollLeft !== lockLeft) tgt.scrollLeft = lockLeft;
        }
      } finally {
        restoringFrozenScroll = false;
      }
      return;
    }
    scheduleOverlayRefresh();
  }, true);

  window.addEventListener('contextmenu', (ev) => {
    if (mode !== 'edit') return;
    ev.preventDefault();
    ev.stopPropagation();
    const hit = resolveSelectableTarget(ev.target, activeTool, { clientX: ev.clientX, clientY: ev.clientY });
    if (hit) {
      const vcId = ensureVcId(hit);
      if (!selectedIds.includes(vcId)) {
        selectSingleOrToggle(hit, false);
      }
    }
    sendToStudio({
      type: 'vc_contextmenu',
      clientX: ev.clientX,
      clientY: ev.clientY,
      selectionCount: selectedIds.length,
      hasGroup: Boolean(activeGroupSelectionId || selectedIds.some((id) => getTopmostGroupOf(id))),
      inIsolation: Boolean(getActiveIsolation()),
      hasLocked: lockedIds.size > 0
    });
  }, true);

  function getHostPointerCoords(ev) {
    try {
      if (window.frameElement) {
        const fr = window.frameElement.getBoundingClientRect();
        const scaleX = fr.width / Math.max(1, window.innerWidth || artboardWidth);
        const scaleY = fr.height / Math.max(1, window.innerHeight || artboardHeight);
        return {
          x: fr.left + ev.clientX * scaleX,
          y: fr.top + ev.clientY * scaleY
        };
      }
    } catch (_) {}
    return { x: ev.screenX, y: ev.screenY };
  }

  window.addEventListener('auxclick', (ev) => {
    if (ev.button === 1) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);

  window.addEventListener('mousedown', (ev) => {
    // 1. Middle-Click Drag OR Space+Drag OR Hand Tool (H) -> Figma-style 4-way Canvas Pan!
    if (ev.button === 1 || (mode === 'edit' && (spaceHeld || activeTool === 'hand'))) {
      ev.preventDefault();
      ev.stopPropagation();
      const hp = getHostPointerCoords(ev);
      pointerAction = {
        type: 'pan',
        lastHostX: hp.x,
        lastHostY: hp.y
      };
      syncEffectiveToolCursor();
      sendToStudio({ type: 'vc_pan_iframe_down' });
      return;
    }

    if (mode !== 'edit' || ev.button !== 0) return;
    if (ev.target && ev.target.closest && ev.target.closest('#__vc_overlay_root__')) return;

    // Commit active Type tool edit if clicking outside it
    if (activeInlineEdit && !activeInlineEdit.el.contains(ev.target)) {
      commitInlineTypeEdit();
    }
    if (activeInlineEdit && activeInlineEdit.el.contains(ev.target)) {
      return; // Let native caret placement work inside active contenteditable
    }

    ev.preventDefault();
    ev.stopPropagation();

    const isCtrl = Boolean(ev.ctrlKey || ev.metaKey);

    // Adobe Illustrator Ctrl/Cmd modifier: temporarily overrides non-selection tools with lastSelectionTool ('select' or 'direct')!
    const effectiveTool = isCtrl && !['select', 'direct'].includes(activeTool)
      ? lastSelectionTool
      : activeTool;

    if (!isCtrl) {
      if (effectiveTool === 'zoom') {
        sendToStudio({
          type: 'vc_step_zoom',
          dir: ev.altKey ? -1 : 1,
          clientX: ev.clientX,
          clientY: ev.clientY
        });
        return;
      }

      if (effectiveTool === 'eyedropper') {
        sampleWithEyedropper(ev.target);
        return;
      }

      if (effectiveTool === 'text') {
        const txtEl = findDirectTextElementAt(ev.target, ev.clientX, ev.clientY);
        if (txtEl) startInlineTypeEdit(txtEl);
        return;
      }

      if (effectiveTool === 'shape' || effectiveTool === 'div' || effectiveTool === 'note' || effectiveTool === 'marquee') {
        pointerAction = {
          type: effectiveTool === 'marquee' ? 'marquee' : `draw_${effectiveTool}`,
          startX: ev.clientX,
          startY: ev.clientY,
          curX: ev.clientX,
          curY: ev.clientY,
          additive: ev.shiftKey,
          rawTarget: ev.target
        };
        return;
      }
    }

    // Illustrator Control-Click (Ctrl+Click / Cmd+Click / Ctrl+Shift+Click):
    // Supports Select-Behind through overlapping stacks, sub-object selection inside groups, and temporary Selection override + Ctrl-drag multi-area marquee!
    if (isCtrl) {
      const rawHit = resolveSelectableTarget(ev.target, effectiveTool);
      const isEmptyOrUnselectedContainer =
        !rawHit ||
        (!selectedIds.includes(ensureVcId(rawHit)) && rawHit.matches && rawHit.matches('section, header, nav, aside, .card, .cbody'));

      if (!rawHit) {
        if (!ev.shiftKey) {
          selectedIds = [];
          activeGroupSelectionId = null;
          keyObjectId = null;
          renderOverlays();
          sendTreeAndSelectionUpdate();
        }
        pointerAction = {
          type: 'marquee',
          startX: ev.clientX,
          startY: ev.clientY,
          curX: ev.clientX,
          curY: ev.clientY,
          additive: Boolean(ev.shiftKey || selectedIds.length > 0)
        };
        return;
      }

      // If starting Ctrl-press on an unselected broad container background, allow Ctrl+Drag to draw a multi-area marquee, OR Ctrl+Click on mouseup!
      if (isEmptyOrUnselectedContainer && ev.target === rawHit) {
        pointerAction = {
          type: 'pending_container_or_marquee',
          startX: ev.clientX,
          startY: ev.clientY,
          curX: ev.clientX,
          curY: ev.clientY,
          additive: Boolean(ev.shiftKey),
          isCtrl: true,
          effectiveTool,
          containerEl: rawHit
        };
        return;
      }

      const { hit: ctrlHit, deselected } = handleIllustratorControlClick(ev, effectiveTool);
      if (ctrlHit && !deselected) {
        startMoveDrag(ev, ctrlHit, false);
      }
      return;
    }

    // Selection (V) / Direct (A) / Transform (E) / Session (S)
    pruneDisconnectedSelection();

    // 1) Hold active Group selection when pressing anywhere inside the selected group's bounds (including gaps between members!)
    if (!ev.shiftKey && ['select', 'transform'].includes(effectiveTool) && activeGroupSelectionId && groupsById.has(activeGroupSelectionId)) {
      const grpBounds = getSelectionBounds();
      if (
        grpBounds &&
        ev.clientX >= grpBounds.left - 2 &&
        ev.clientX <= grpBounds.right + 2 &&
        ev.clientY >= grpBounds.top - 2 &&
        ev.clientY <= grpBounds.bottom + 2
      ) {
        startMoveDrag(ev, null, false);
        return;
      }
    }

    const hit = resolveSelectableTarget(ev.target, effectiveTool, { clientX: ev.clientX, clientY: ev.clientY });

    // 2) Hold already-selected invisible / transparent / hollow <div> when pressing anywhere in its empty middle (`majkhane faka jaga`)!
    if (!ev.shiftKey && ['select', 'direct', 'transform'].includes(effectiveTool) && selectedIds.length > 0) {
      for (const sid of selectedIds) {
        const selEl = getEl(sid);
        if (!selEl || !isElementVisible(selEl)) continue;
        const sr = selEl.getBoundingClientRect();
        const insideSelRect =
          ev.clientX >= sr.left &&
          ev.clientX <= sr.right &&
          ev.clientY >= sr.top &&
          ev.clientY <= sr.bottom;
        if (!insideSelRect) continue;
        if (isVisuallyTransparentDiv(selEl) || !hit || hit === selEl) {
          startMoveDrag(ev, selEl, false);
          return;
        }
      }
    }

    if (!hit) {
      // Dragging on empty artboard/pasteboard starts Illustrator intersection marquee!
      if (!ev.shiftKey) {
        selectedIds = [];
        activeGroupSelectionId = null;
        keyObjectId = null;
        renderOverlays();
        sendTreeAndSelectionUpdate();
      }
      pointerAction = {
        type: 'marquee',
        startX: ev.clientX,
        startY: ev.clientY,
        curX: ev.clientX,
        curY: ev.clientY,
        additive: ev.shiftKey
      };
      return;
    }

    const vcId = ensureVcId(hit);
    // Only full-bleed page landmarks (section/header/nav/aside/footer >= 75% artboard width) start background marquee;
    // ALL <div>s (.card, .cbody, flow divs, custom divs) immediately select and drag in one fluid motion!
    const hitRect = hit.getBoundingClientRect();
    const isCreatedBox = hit.hasAttribute('data-vc-created') || hit.classList.contains('vc-shape') || hit.classList.contains('vc-flow-div');
    const isFullWidthTransparentWrapperDiv =
      hit.tagName === 'DIV' &&
      !isCreatedBox &&
      hitRect.width >= artboardWidth * 0.75 &&
      isVisuallyTransparentDiv(hit) &&
      hit.children.length >= 1;
    const isUnselectedPageLandmark =
      effectiveTool === 'select' &&
      !selectedIds.includes(vcId) &&
      ev.target === hit &&
      hitRect.width >= artboardWidth * 0.75 &&
      (isFullWidthTransparentWrapperDiv || (hit.tagName !== 'DIV' && hit.matches && hit.matches('section, header, nav, aside, footer')));

    if (isUnselectedPageLandmark) {
      pointerAction = {
        type: 'pending_container_or_marquee',
        startX: ev.clientX,
        startY: ev.clientY,
        curX: ev.clientX,
        curY: ev.clientY,
        additive: ev.shiftKey,
        isCtrl: false,
        effectiveTool,
        containerEl: hit
      };
      return;
    }

    const alreadyInMulti = selectedIds.length > 1 && selectedIds.includes(vcId) && !ev.shiftKey;
    let deselected = false;
    if (!alreadyInMulti) {
      const res = selectSingleOrToggle(hit, ev.shiftKey, { effectiveTool });
      deselected = Boolean(res && res.deselected);
    } else if (alignKeyMode === '__key__') {
      keyObjectId = keyObjectId === vcId ? null : vcId;
      renderOverlays();
    }
    if (!deselected) {
      startMoveDrag(ev, hit, alreadyInMulti && !activeGroupSelectionId);
    }
  }, true);

  window.addEventListener('mousemove', (ev) => {
    altHeld = ev.altKey;
    ctrlHeld = Boolean(ev.ctrlKey || ev.metaKey);
    if (pointerAction) {
      if (pointerAction.type === 'pan') {
        const hp = getHostPointerCoords(ev);
        const dx = hp.x - pointerAction.lastHostX;
        const dy = hp.y - pointerAction.lastHostY;
        pointerAction.lastHostX = hp.x;
        pointerAction.lastHostY = hp.y;
        if (dx !== 0 || dy !== 0) {
          sendToStudio({ type: 'vc_pan_delta', dx, dy });
        }
        return;
      }
      if (pointerAction.type === 'move') {
        updateMoveDrag(ev);
        return;
      }
      if (pointerAction.type === 'resize') {
        updateResizeDrag(ev);
        return;
      }
      if (pointerAction.type === 'rotate') {
        updateRotateDrag(ev);
        return;
      }
      if (pointerAction.type === 'pending_container_or_marquee') {
        pointerAction.curX = ev.clientX;
        pointerAction.curY = ev.clientY;
        if (Math.hypot(ev.clientX - pointerAction.startX, ev.clientY - pointerAction.startY) >= 5) {
          pointerAction.type = 'marquee';
          if (!pointerAction.additive) {
            selectedIds = [];
            activeGroupSelectionId = null;
          }
          const box = {
            left: Math.min(pointerAction.startX, ev.clientX),
            top: Math.min(pointerAction.startY, ev.clientY),
            width: Math.abs(ev.clientX - pointerAction.startX),
            height: Math.abs(ev.clientY - pointerAction.startY)
          };
          renderOverlays({ dragBox: box });
        }
        return;
      }
      if (pointerAction.type === 'marquee' || pointerAction.type.startsWith('draw_')) {
        pointerAction.curX = ev.clientX;
        pointerAction.curY = ev.clientY;
        const box = {
          left: Math.min(pointerAction.startX, ev.clientX),
          top: Math.min(pointerAction.startY, ev.clientY),
          width: Math.abs(ev.clientX - pointerAction.startX),
          height: Math.abs(ev.clientY - pointerAction.startY)
        };
        const extra = { dragBox: box };
        if (pointerAction.type === 'draw_div') {
          extra.dropLine = findFlowContainerInsertion(pointerAction.startX, pointerAction.startY).dropLine;
        }
        renderOverlays(extra);
        return;
      }
    }

    if (mode !== 'edit') return;

    if (activeTool === 'div' && !ctrlHeld) {
      const ins = findFlowContainerInsertion(ev.clientX, ev.clientY);
      renderOverlays({ dropLine: ins.dropLine });
      return;
    }

    const effTool = ctrlHeld && activeTool !== 'select' && activeTool !== 'direct' ? lastSelectionTool : activeTool;
    const hit = resolveSelectableTarget(ev.target, effTool, { clientX: ev.clientX, clientY: ev.clientY });
    const nextHover = hit ? ensureVcId(hit) : null;
    if (nextHover !== hoverId || altHeld) {
      hoverId = nextHover;
      renderOverlays();
    }
  }, true);

  window.addEventListener('mouseup', (ev) => {
    if (!pointerAction) return;
    const act = pointerAction;
    pointerAction = null;

    if (act.type === 'pan') {
      syncEffectiveToolCursor();
      sendToStudio({ type: 'vc_pan_iframe_up' });
    } else if (act.type === 'move') {
      finishMoveDrag(act);
    } else if (act.type === 'resize') {
      finishResizeDrag(act);
    } else if (act.type === 'rotate') {
      finishRotateDrag(act);
    } else if (act.type === 'pending_container_or_marquee') {
      if (act.isCtrl) {
        handleIllustratorControlClick(ev, act.effectiveTool || 'select');
      } else if (act.containerEl) {
        selectSingleOrToggle(act.containerEl, act.additive, { effectiveTool: act.effectiveTool || 'select' });
      }
    } else if (act.type === 'marquee') {
      const box = {
        left: Math.min(act.startX, ev.clientX),
        top: Math.min(act.startY, ev.clientY),
        width: Math.abs(ev.clientX - act.startX),
        height: Math.abs(ev.clientY - act.startY)
      };
      if (box.width >= 4 || box.height >= 4) {
        runIllustratorMarqueeSelection(box, act.additive);
      } else {
        renderOverlays();
      }
    } else if (act.type === 'draw_shape') {
      const box = {
        left: Math.min(act.startX, ev.clientX),
        top: Math.min(act.startY, ev.clientY),
        width: Math.max(48, Math.abs(ev.clientX - act.startX)),
        height: Math.max(36, Math.abs(ev.clientY - act.startY))
      };
      createShapeInArtboard(box);
    } else if (act.type === 'draw_div') {
      const box = {
        left: Math.min(act.startX, ev.clientX),
        top: Math.min(act.startY, ev.clientY),
        width: Math.abs(ev.clientX - act.startX),
        height: Math.abs(ev.clientY - act.startY)
      };
      const ins = findFlowContainerInsertion(act.startX, act.startY);
      createFlowDivAt(ins, box);
    } else if (act.type === 'draw_note') {
      const br = document.body ? document.body.getBoundingClientRect() : { left: 0, top: 0 };
      const left = Math.min(act.startX, ev.clientX);
      const top = Math.min(act.startY, ev.clientY);
      const w = Math.max(24, Math.abs(ev.clientX - act.startX));
      const h = Math.max(24, Math.abs(ev.clientY - act.startY));
      const hit = resolveSelectableTarget(act.rawTarget, 'direct');
      sendToStudio({
        type: 'vc_note_marked',
        selector: hit ? computeCleanSelector(hit) : 'body',
        elementTag: hit ? hit.tagName.toLowerCase() : 'region',
        markRect: {
          x: Math.round(left - br.left),
          y: Math.round(top - br.top),
          w: Math.round(w),
          h: Math.round(h)
        }
      });
      renderOverlays();
    }
  }, true);

  // Prevent accidental button clicks/form submits in Edit mode
  window.addEventListener('click', (ev) => {
    if (mode !== 'edit') return;
    if (ev.target && ev.target.closest && ev.target.closest('#__vc_overlay_root__')) return;
    if (activeInlineEdit && activeInlineEdit.el.contains(ev.target)) return;
    ev.preventDefault();
    ev.stopPropagation();
  }, true);

  window.addEventListener('dblclick', (ev) => {
    if (mode !== 'edit') return;
    if (ev.target && ev.target.closest && ev.target.closest('#__vc_overlay_root__')) return;
    ev.preventDefault();
    ev.stopPropagation();

    // 1) Double-click on a composite group (or nested subgroup inside current isolation) -> Enter Group Isolation Mode!
    const directHit = resolveSelectableTarget(ev.target, 'direct', {
      directSubSelect: true,
      clientX: ev.clientX,
      clientY: ev.clientY
    });
    const candGrp = directHit
      ? getTopmostGroupOf(ensureVcId(directHit))
      : (activeGroupSelectionId && groupsById.has(activeGroupSelectionId) ? activeGroupSelectionId : null);

    if (candGrp && groupsById.has(candGrp)) {
      const grp = groupsById.get(candGrp);
      enterIsolationMode({ id: candGrp, kind: 'group', name: grp.name || 'Group' }, directHit);
      return;
    }

    // 2) If Isolation Mode is active and user double-clicks outside the isolated bounds -> Exit Isolation Mode (like Illustrator)!
    if (getActiveIsolation()) {
      const ib = getIsolatedBounds();
      const outside =
        !ib ||
        ev.clientX < ib.left - 8 ||
        ev.clientX > ib.right + 8 ||
        ev.clientY < ib.top - 8 ||
        ev.clientY > ib.bottom + 8;
      if (outside) {
        exitIsolationMode(true);
        return;
      }
    }

    // 3) Double-click on direct text leaf (ungrouped, or already inside Isolation Mode) -> Inline text editing
    const txtEl = findDirectTextElementAt(ev.target, ev.clientX, ev.clientY);
    if (txtEl && (txtEl.children.length === 0 || ['BUTTON', 'A', 'H1', 'H2', 'H3', 'H4', 'P', 'SPAN', 'LABEL'].includes(txtEl.tagName))) {
      startInlineTypeEdit(txtEl);
      return;
    }

    // 4) Double-click on a multi-child container (div/card/section) -> Enter Container Isolation Mode!
    if (directHit && directHit.children && directHit.children.length >= 2) {
      const cid = ensureVcId(directHit);
      const cname = `${directHit.tagName.toLowerCase()}${directHit.id && !directHit.id.startsWith('vc_') ? '#' + directHit.id : ''}`;
      enterIsolationMode({ id: cid, kind: 'container', name: cname });
    }
  }, true);

  window.addEventListener('keydown', (ev) => {
    if (ev.code === 'Space' && !activeInlineEdit && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      spaceHeld = true;
    }
    altHeld = ev.altKey;
    ctrlHeld = Boolean(ev.ctrlKey || ev.metaKey);
    syncEffectiveToolCursor();

    if (activeInlineEdit) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        commitInlineTypeEdit();
      }
      return;
    }

    if (mode !== 'edit') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(ev.target?.tagName)) return;

    // Prevent scroll keys in Edit mode so the page stays a static snapshot
    if (['PageUp', 'PageDown', 'Home', 'End'].includes(ev.key) || ev.code === 'Space') {
      ev.preventDefault();
    }

    // Forward studio-wide shortcuts or handle directly
    const ctrl = ev.ctrlKey || ev.metaKey;
    const keyLow = ev.key.toLowerCase();

    if (ctrl && keyLow === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      performUndo();
    } else if ((ctrl && keyLow === 'y') || (ctrl && ev.shiftKey && keyLow === 'z')) {
      ev.preventDefault();
      performRedo();
    } else if (ctrl && keyLow === 's') {
      ev.preventDefault();
      sendToStudio({ type: 'vc_shortcut_save' });
    } else if (ctrl && !ev.altKey && !ev.shiftKey && keyLow === 'g') {
      ev.preventDefault();
      groupSelectedItems();
    } else if (ctrl && (ev.altKey || ev.shiftKey) && keyLow === 'g') {
      ev.preventDefault();
      ungroupSelectedItems();
    } else if (ctrl && ev.altKey && ev.code === 'Digit2') {
      ev.preventDefault();
      unlockSelectedOrTarget();
    } else if (ctrl && !ev.altKey && ev.code === 'Digit2') {
      ev.preventDefault();
      lockSelection();
    } else if (ctrl && ev.code === 'BracketRight') {
      ev.preventDefault();
      arrangeSelection(ev.shiftKey ? 'bring-front' : 'bring-forward');
    } else if (ctrl && ev.code === 'BracketLeft') {
      ev.preventDefault();
      arrangeSelection(ev.shiftKey ? 'send-back' : 'send-backward');
    } else if (ctrl && keyLow === 'c') {
      ev.preventDefault();
      copySelectionToClipboard();
    } else if (ctrl && keyLow === 'x') {
      ev.preventDefault();
      if (copySelectionToClipboard()) deleteSelection('Cut Selection');
    } else if (ctrl && keyLow === 'v') {
      ev.preventDefault();
      pasteFromClipboard();
    } else if (ctrl && keyLow === 'd') {
      ev.preventDefault();
      if (copySelectionToClipboard()) pasteFromClipboard();
    } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      deleteSelection();
    } else if (ev.key === 'Escape') {
      if (getActiveIsolation()) {
        exitIsolationMode(false);
      } else {
        selectedIds = [];
        activeGroupSelectionId = null;
        keyObjectId = null;
        showAllSessionsOverlay = false;
        renderOverlays();
        sendTreeAndSelectionUpdate();
      }
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key) && selectedIds.length) {
      ev.preventDefault();
      nudgeSelectedElements(ev.key, Boolean(ev.shiftKey));
    } else if (!ctrl && !ev.altKey && ev.key === '/') {
      ev.preventDefault();
      sendToStudio({ type: 'vc_shortcut_unfill' });
    } else if (!ctrl && !ev.altKey && ev.shiftKey && keyLow === 'x') {
      ev.preventDefault();
      sendToStudio({ type: 'vc_shortcut_swap_paint' });
    } else if (!ctrl && !ev.altKey) {
      const toolKeys = { v: 'select', a: 'direct', e: 'transform', s: 'section', r: 'shape', d: 'div', t: 'text', i: 'eyedropper', m: 'marquee', n: 'note', h: 'hand', z: 'zoom' };
      if (toolKeys[keyLow]) {
        ev.preventDefault();
        activeTool = toolKeys[keyLow];
        if (activeTool === 'select' || activeTool === 'direct') lastSelectionTool = activeTool;
        sendToStudio({ type: 'vc_tool_switched', tool: activeTool });
        renderOverlays();
      }
    }
  }, true);

  window.addEventListener('keyup', (ev) => {
    if (ev.code === 'Space') spaceHeld = false;
    ctrlHeld = Boolean(ev.ctrlKey || ev.metaKey);
    syncEffectiveToolCursor();
    if (!ev.altKey && altHeld) {
      altHeld = false;
      renderOverlays();
    }
  }, true);

  function nudgeSelectedElements(key, shiftKey = false) {
    pruneDisconnectedSelection();
    if (!selectedIds.length) return;
    const step = (shiftKey ? 10 : 1) * (prefs.keyboardIncrement || 1);
    const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
    const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
    if (dx === 0 && dy === 0) return;
    const entries = [];
    for (const id of selectedIds) {
      const el = getEl(id);
      if (!el) continue;
      const before = snapshotElementState(el);
      const { tx, ty, rot } = readElementTranslate(el);
      applyElementPositionOffset(el, tx + dx, ty + dy, rot);
      entries.push({ kind: 'style', before, after: snapshotElementState(el) });
    }
    if (entries.length) {
      pushHistoryStep({ label: 'Nudge Selection', entries });
      renderOverlays();
      sendTreeAndSelectionUpdate();
    }
  }

  // =========================================================================
  // 17. STUDIO <-> BRIDGE MESSAGE BUS
  // =========================================================================
  window.addEventListener('message', (ev) => {
    const msg = ev.data;
    if (!msg || !msg.__vc_cmd) return;

    switch (msg.cmd) {
      case 'nudge_selection': {
        if (mode === 'edit') {
          nudgeSelectedElements(msg.key, Boolean(msg.shiftKey));
        }
        break;
      }
      case 'init_sync': {
        mode = msg.mode || mode;
        activeTool = msg.tool || activeTool;
        if (activeTool === 'select' || activeTool === 'direct') lastSelectionTool = activeTool;
        artboardWidth = Number(msg.artboardWidth) || ARTBOARD_DEFAULT_W;
        artboardHeight = Number(msg.artboardHeight) || ARTBOARD_DEFAULT_H;
        if (msg.accelMode) accelMode = msg.accelMode === 'cpu' ? 'cpu' : 'gpu';
        if (msg.prefs) prefs = { ...prefs, ...msg.prefs };
        if (Array.isArray(msg.notes)) currentNotes = msg.notes;
        applyArtboardMode();
        if (!savedBaseline) captureSavedBaseline();
        renderOverlays();
        sendTreeAndSelectionUpdate();
        notifyHistoryAndDirty();
        break;
      }
      case 'exit_isolation': {
        exitIsolationMode(Boolean(msg.exitAll));
        break;
      }
      case 'enter_isolation': {
        if (msg.id) {
          if (groupsById.has(msg.id)) {
            enterIsolationMode({ id: msg.id, kind: 'group', name: groupsById.get(msg.id).name });
          } else if (getEl(msg.id)) {
            enterIsolationMode({ id: msg.id, kind: 'container', name: msg.name || msg.id });
          }
        }
        break;
      }
      case 'set_element_link': {
        setElementLinkWithUndo(msg.vcId, msg.url);
        break;
      }
      case 'focus_link_target': {
        focusLinkTargetOnArtboard(msg.vcId, msg.selectGroup !== false);
        break;
      }
      case 'set_accel_mode': {
        accelMode = msg.accelMode === 'cpu' ? 'cpu' : 'gpu';
        applyArtboardMode();
        renderOverlays();
        break;
      }
      case 'end_pan': {
        if (pointerAction && pointerAction.type === 'pan') {
          pointerAction = null;
          syncEffectiveToolCursor();
        }
        break;
      }
      case 'modifier_sync': {
        if (typeof msg.spaceHeld === 'boolean') spaceHeld = msg.spaceHeld;
        if (typeof msg.altHeld === 'boolean') altHeld = msg.altHeld;
        if (typeof msg.ctrlHeld === 'boolean') ctrlHeld = msg.ctrlHeld;
        syncEffectiveToolCursor();
        break;
      }
      case 'set_mode': {
        commitInlineTypeEdit();
        mode = msg.mode === 'live' ? 'live' : 'edit';
        applyArtboardMode();
        renderOverlays();
        if (mode === 'edit') {
          sendTreeAndSelectionUpdate();
        }
        break;
      }
      case 'set_tool': {
        commitInlineTypeEdit();
        activeTool = msg.tool || 'select';
        if (activeTool === 'select' || activeTool === 'direct') lastSelectionTool = activeTool;
        if (msg.shapeKind) activeShapeKind = msg.shapeKind;
        renderOverlays();
        break;
      }
      case 'set_shape_kind': {
        activeShapeKind = msg.shapeKind || 'rect';
        break;
      }
      case 'set_artboard': {
        artboardWidth = Number(msg.width) || ARTBOARD_DEFAULT_W;
        artboardHeight = Number(msg.height) || ARTBOARD_DEFAULT_H;
        applyArtboardMode();
        renderOverlays();
        sendTreeAndSelectionUpdate();
        break;
      }
      case 'set_prefs': {
        prefs = { ...prefs, ...(msg.prefs || {}) };
        if (msg.smartGuides !== undefined) showSmartGuides = Boolean(msg.smartGuides);
        if (msg.showNotes !== undefined) showNotePins = Boolean(msg.showNotes);
        if (msg.autoGroupButtons !== undefined) autoGroupButtons = Boolean(msg.autoGroupButtons);
        renderOverlays();
        break;
      }
      case 'set_active_paint': {
        activePaint = { ...activePaint, ...(msg.paint || {}) };
        break;
      }
      case 'set_align_to': {
        alignKeyMode = msg.alignTo || '__bounds__';
        renderOverlays();
        break;
      }
      case 'set_ref_point': {
        transformRefPoint = msg.refPoint || 'c';
        renderOverlays();
        break;
      }
      case 'undo': {
        performUndo();
        break;
      }
      case 'redo': {
        performRedo();
        break;
      }
      case 'request_save_payload': {
        commitInlineTypeEdit();
        const payload = serializeDirectSavePayload();
        sendToStudio({
          type: 'vc_save_payload_ready',
          requestId: msg.requestId || '',
          payload
        });
        break;
      }
      case 'mark_saved_baseline': {
        // Updates Original state to the newly saved state while preserving full Undo/Redo stack!
        captureSavedBaseline();
        break;
      }
      case 'restore_original': {
        commitInlineTypeEdit();
        restoreToSavedBaseline();
        break;
      }
      case 'select_session': {
        activateAndSelectSession(msg.sessionId);
        break;
      }
      case 'select_layer': {
        const id = msg.id;
        if (isEntityLocked(id)) {
          lastClickedLayerLockedId = id;
          selectedIds = [];
          activeGroupSelectionId = null;
          renderOverlays();
          sendTreeAndSelectionUpdate();
        } else if (groupsById.has(id)) {
          activeGroupSelectionId = id;
          selectedIds = expandGroupLeafIds(id, []);
          lastClickedLayerLockedId = null;
          renderOverlays();
          sendTreeAndSelectionUpdate();
        } else {
          const el = getEl(id);
          if (el) {
            lastClickedLayerLockedId = null;
            selectSingleOrToggle(el, Boolean(msg.additive));
          }
        }
        break;
      }
      case 'toggle_entity_lock': {
        const id = msg.id;
        if (!id) {
          if (selectedIds.length || activeGroupSelectionId) lockSelection();
          else unlockSelectedOrTarget();
        } else if (lockedIds.has(id)) {
          unlockSelectedOrTarget(id);
        } else {
          const beforeLocked = Array.from(lockedIds);
          lockedIds.add(id);
          selectedIds = selectedIds.filter((s) => s !== id && !expandGroupLeafIds(id, []).includes(s));
          if (activeGroupSelectionId === id) activeGroupSelectionId = null;
          lastClickedLayerLockedId = id;
          pushHistoryStep({
            label: 'Lock Layer',
            entries: [{ kind: 'lock', beforeLocked, afterLocked: Array.from(lockedIds) }]
          });
          renderOverlays();
          sendTreeAndSelectionUpdate();
        }
        break;
      }
      case 'unlock_item': {
        unlockSelectedOrTarget(msg.id || '');
        break;
      }
      case 'unlock_all': {
        unlockAllItems();
        break;
      }
      case 'group': {
        groupSelectedItems();
        break;
      }
      case 'ungroup': {
        ungroupSelectedItems();
        break;
      }
      case 'arrange': {
        arrangeSelection(msg.action);
        break;
      }
      case 'clipboard': {
        if (msg.action === 'copy') copySelectionToClipboard();
        else if (msg.action === 'cut') { if (copySelectionToClipboard()) deleteSelection('Cut Selection'); }
        else if (msg.action === 'paste') pasteFromClipboard();
        else if (msg.action === 'duplicate') { if (copySelectionToClipboard()) pasteFromClipboard(); }
        else if (msg.action === 'delete') deleteSelection();
        break;
      }
      case 'convert_to_div': {
        convertSelectedToFlowDiv();
        break;
      }
      case 'align': {
        alignSelection(msg.alignType, Number(msg.gapPx) || 0);
        break;
      }
      case 'patch_style': {
        applyStylePatchFromInspector(msg);
        break;
      }
      case 'patch_text': {
        pruneDisconnectedSelection();
        if (selectedIds.length === 1) {
          const outerEl = getEl(selectedIds[0]);
          const slot = outerEl ? resolveEditableTextSlot(outerEl) : null;
          if (slot) {
            const el = slot.targetEl;
            const targetVcId = ensureVcId(el);
            const afterText = String(msg.text ?? '');
            if (slot.mode === 'attr') {
              const originText = initialTextByEl.get(el) ?? (el.getAttribute(slot.attr) || '');
              if (!initialTextByEl.has(el)) initialTextByEl.set(el, originText);
              const beforeText = el.getAttribute(slot.attr) || '';
              if (beforeText !== afterText) {
                el.setAttribute(slot.attr, afterText);
                textPatchesByEl.set(targetVcId, {
                  id: el.id && !el.id.startsWith('vc_') ? el.id : '',
                  selector: computeCleanSelector(el),
                  attr: slot.attr,
                  before: originText,
                  after: afterText
                });
                pushHistoryStep({
                  label: 'Edit Text',
                  entries: [{ kind: 'text', el, attr: slot.attr, originText, beforeText, afterText }]
                });
                renderOverlays();
                sendTreeAndSelectionUpdate();
              }
            } else if (slot.mode === 'textNode') {
              const originText = initialTextByEl.get(el) ?? (slot.textNode.nodeValue || '').trim();
              if (!initialTextByEl.has(el)) initialTextByEl.set(el, originText);
              const beforeText = (slot.textNode.nodeValue || '').trim();
              if (beforeText !== afterText) {
                const beforeHtml = el.innerHTML;
                slot.textNode.nodeValue = ` ${afterText}`;
                const afterHtml = el.innerHTML;
                textPatchesByEl.set(targetVcId, {
                  id: el.id && !el.id.startsWith('vc_') ? el.id : '',
                  selector: computeCleanSelector(el),
                  attr: '',
                  before: originText,
                  after: afterText
                });
                pushHistoryStep({
                  label: 'Edit Text',
                  entries: [{ kind: 'text', el, attr: '', originText, beforeText, afterText, beforeHtml, afterHtml }]
                });
                renderOverlays();
                sendTreeAndSelectionUpdate();
              }
            } else {
              const originText = initialTextByEl.get(el) ?? (el.textContent || '');
              if (!initialTextByEl.has(el)) initialTextByEl.set(el, originText);
              const beforeText = el.textContent || '';
              if (beforeText !== afterText) {
                el.textContent = afterText;
                textPatchesByEl.set(targetVcId, {
                  id: el.id && !el.id.startsWith('vc_') ? el.id : '',
                  selector: computeCleanSelector(el),
                  attr: '',
                  before: originText,
                  after: afterText
                });
                pushHistoryStep({
                  label: 'Edit Text',
                  entries: [{ kind: 'text', el, attr: '', originText, beforeText, afterText }]
                });
                renderOverlays();
                sendTreeAndSelectionUpdate();
              }
            }
          }
        }
        break;
      }
      case 'apply_raw_css': {
        pruneDisconnectedSelection();
        if (selectedIds.length === 1) {
          const el = getEl(selectedIds[0]);
          if (el) {
            const before = snapshotElementState(el);
            el.setAttribute('style', String(msg.cssText || ''));
            const map = new Map();
            String(msg.cssText || '').split(';').forEach((decl) => {
              const i = decl.indexOf(':');
              if (i > 0) map.set(decl.slice(0, i).trim().toLowerCase(), decl.slice(i + 1).trim());
            });
            patchedPropsByEl.set(selectedIds[0], map);
            syncAuthoritativeStyleRules();
            pushHistoryStep({ label: 'Apply Raw CSS', entries: [{ kind: 'style', before, after: snapshotElementState(el) }] });
            renderOverlays();
            sendTreeAndSelectionUpdate();
          }
        }
        break;
      }
      case 'reset_element': {
        pruneDisconnectedSelection();
        if (selectedIds.length) {
          const entries = [];
          for (const id of selectedIds) {
            const el = getEl(id);
            if (!el) continue;
            const before = snapshotElementState(el);
            const origCss = initialStyleByEl.get(el) || '';
            if (origCss) el.setAttribute('style', origCss);
            else el.removeAttribute('style');
            patchedPropsByEl.delete(id);
            entries.push({ kind: 'style', before, after: snapshotElementState(el) });
          }
          syncAuthoritativeStyleRules();
          pushHistoryStep({ label: 'Reset Element Styles', entries });
          renderOverlays();
          sendTreeAndSelectionUpdate();
        }
        break;
      }
      case 'clear_selection': {
        selectedIds = [];
        activeGroupSelectionId = null;
        keyObjectId = null;
        showAllSessionsOverlay = false;
        renderOverlays();
        sendTreeAndSelectionUpdate();
        break;
      }
      case 'quick_select': {
        quickSelectCategory(msg.category);
        break;
      }
      case 'set_theme_palette':
      case 'set_theme_css': {
        ensurePagePaletteProfile();
        if (!pendingThemeBefore) {
          pendingThemeBefore = {
            themeCss: activeThemeCss,
            palette: { ...activePalette }
          };
        }
        if (msg.cmd === 'set_theme_palette' || msg.palette) {
          const incoming = msg.palette || msg;
          if (incoming.reset) {
            activePalette = { primary: '', secondary: '', extraCss: '', presetId: incoming.presetId || 'original' };
          } else {
            activePalette = {
              primary: incoming.primary !== undefined ? String(incoming.primary || '') : activePalette.primary,
              secondary: incoming.secondary !== undefined ? String(incoming.secondary || '') : activePalette.secondary,
              extraCss: incoming.extraCss !== undefined ? String(incoming.extraCss || '') : activePalette.extraCss,
              presetId: incoming.presetId !== undefined ? String(incoming.presetId || 'custom') : activePalette.presetId
            };
          }
          activeThemeCss = buildPaletteThemeCss(activePalette);
        } else {
          activeThemeCss = String(msg.themeCss || '');
        }
        applyLiveThemeTag(activeThemeCss);

        const shouldCommit = msg.commit !== false && !msg.previewOnly;
        if (shouldCommit) {
          const snapBefore = pendingThemeBefore;
          pendingThemeBefore = null;
          if (snapBefore.themeCss !== activeThemeCss) {
            pushHistoryStep({
              label: 'Update Palette Theme',
              entries: [{
                kind: 'doc_meta',
                beforeFonts: Array.from(loadedGoogleFonts),
                afterFonts: Array.from(loadedGoogleFonts),
                beforeTheme: snapBefore.themeCss,
                afterTheme: activeThemeCss,
                beforePalette: snapBefore.palette,
                afterPalette: { ...activePalette }
              }]
            });
          }
          syncPaletteToStudio();
        }
        renderOverlays();
        sendTreeAndSelectionUpdate();
        break;
      }
      case 'set_bypass': {
        window.__VC_PREBYPASS__?.setEnabled?.(Boolean(msg.enabled));
        setTimeout(() => {
          renderOverlays();
          sendTreeAndSelectionUpdate();
        }, 120);
        break;
      }
      case 'activate_view': {
        window.__VC_PREBYPASS__?.activateDiscoveredView?.(msg.action);
        setTimeout(() => {
          renderOverlays();
          sendTreeAndSelectionUpdate();
        }, 160);
        break;
      }
      case 'set_notes': {
        currentNotes = Array.isArray(msg.notes) ? msg.notes : [];
        renderOverlays();
        break;
      }
      case 'scan_grammar': {
        sendToStudio({
          type: 'vc_grammar_results',
          issues: scanGrammarIssues(msg.ignoredWords || [])
        });
        break;
      }
      case 'fix_grammar': {
        const items = Array.isArray(msg.items) ? msg.items : [];
        const entries = [];
        for (const it of items) {
          const el = getEl(it.vcId);
          if (!el || el.children.length > 0) continue;
          const originText = initialTextByEl.get(el) ?? (el.textContent || '');
          const beforeText = el.textContent || '';
          const afterText = beforeText.replace(new RegExp(`\\b${it.bad}\\b`, 'g'), it.good);
          if (afterText !== beforeText) {
            el.textContent = afterText;
            textPatchesByEl.set(it.vcId, {
              id: el.id && !el.id.startsWith('vc_') ? el.id : '',
              selector: computeCleanSelector(el),
              attr: '',
              before: originText,
              after: afterText
            });
            entries.push({ kind: 'text', el, attr: '', originText, beforeText, afterText });
          }
        }
        if (entries.length) {
          pushHistoryStep({ label: 'Fix Spelling', entries });
          sendTreeAndSelectionUpdate();
        }
        break;
      }
      case 'refresh_tree': {
        renderOverlays();
        sendTreeAndSelectionUpdate();
        break;
      }
      case 'agent_live_exec': {
        const ac = msg.payload || {};
        window.__VC_PREBYPASS__?.unlockRuntimeGates?.();
        let ok = true;
        if (ac.clickSelector) {
          const el = document.querySelector(ac.clickSelector);
          if (el) el.click();
          else ok = false;
        }
        if (ac.revealSelector) {
          window.__VC_PREBYPASS__?.activateDiscoveredView?.({ type: 'reveal', selector: ac.revealSelector });
        }
        setTimeout(() => {
          renderOverlays();
          sendTreeAndSelectionUpdate();
          sendToStudio({ type: 'vc_agent_ack', cmdId: ac.cmdId, executed: ok, title: document.title });
        }, 180);
        break;
      }
    }
  });

  // Boot bridge once DOM is ready
  function bootBridge() {
    injectBridgeStyles();
    applyArtboardMode();
    ensureOverlayRoot();
    setTimeout(() => {
      window.__VC_PREBYPASS__?.unlockRuntimeGates?.();
      const profile = ensurePagePaletteProfile();
      captureSavedBaseline();
      renderOverlays();
      sendTreeAndSelectionUpdate();
      sendToStudio({
        type: 'vc_bridge_ready',
        artboardRect: getArtboardMetrics(),
        palette: {
          primary: activePalette.primary || profile.detectedPrimary,
          secondary: activePalette.secondary || profile.detectedSecondary,
          rawPrimary: activePalette.primary,
          rawSecondary: activePalette.secondary,
          presetId: activePalette.presetId || 'original'
        }
      });
    }, 260);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootBridge, { once: true });
  } else {
    bootBridge();
  }
})();
