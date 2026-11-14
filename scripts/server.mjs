#!/usr/bin/env node
/**
 * Vectora Canvas — Universal Direct-HTML Visual Workspace Server (Zero External Dependencies)
 * Works with any coding engine: Antigravity, Claude Code, Codex, OpenCode, Cursor, Windsurf, VS Code.
 * Edits HTML directly on Save so coding agents stay 100% in sync with visual changes.
 * Isolated memory stored strictly inside <SKILL_ROOT>/memory/.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const codeSync = require('../studio/code-sync.js');
const SKILL_ROOT = path.resolve(__dirname, '..');
const STUDIO_DIR = path.join(SKILL_ROOT, 'studio');
const MEMORY_DIR = path.join(SKILL_ROOT, 'memory');
const PROJECTS_ROOT = path.join(MEMORY_DIR, 'projects');
const MEMORY_FILE = path.join(MEMORY_DIR, 'skill-memory.json');
const NOTES_FILE = path.join(MEMORY_DIR, 'agent-notes.json');
const BACKUP_ROOT = path.join(MEMORY_DIR, 'backups');
const SANDBOX_ROOT = path.join(MEMORY_DIR, 'sandboxes');

function parseArgs(argv) {
  const sidecarPort = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || 0);
  const out = {
    target: process.env.VECTORA_TARGET || process.env.HTML_EDIT_TARGET || '',
    hasExplicitTarget: Boolean(process.env.VECTORA_TARGET || process.env.HTML_EDIT_TARGET),
    entry: process.env.VECTORA_ENTRY || process.env.HTML_EDIT_ENTRY || 'index.html',
    port: sidecarPort || Number(process.env.PORT || 4680),
    host: '127.0.0.1',
    previewCopy: false,
    open: false,
    isSidecar: Boolean(sidecarPort)
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '--target' || a === '-t') && argv[i + 1]) {
      out.target = argv[++i];
      out.hasExplicitTarget = true;
    } else if (a.startsWith('--target=')) {
      out.target = a.slice(9);
      out.hasExplicitTarget = true;
    } else if ((a === '--entry' || a === '-e') && argv[i + 1]) {
      out.entry = argv[++i];
    } else if (a.startsWith('--entry=')) {
      out.entry = a.slice(8);
    } else if ((a === '--port' || a === '-p') && argv[i + 1] && !sidecarPort) {
      out.port = Number(argv[++i]) || 4680;
    } else if (a.startsWith('--port=') && !sidecarPort) {
      out.port = Number(a.slice(7)) || 4680;
    } else if (a === '--host' && argv[i + 1]) {
      out.host = argv[++i];
    } else if (a === '--preview-copy') {
      out.previewCopy = true;
    } else if (a === '--open' && !sidecarPort) {
      out.open = true;
    } else if (!a.startsWith('-') && !out.hasExplicitTarget && fs.existsSync(path.resolve(a))) {
      out.target = path.resolve(a);
      out.hasExplicitTarget = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv);

fs.mkdirSync(MEMORY_DIR, { recursive: true });
fs.mkdirSync(BACKUP_ROOT, { recursive: true });

function defaultPreferences() {
  return {
    autoSave: false, // Manual Save by default per Vectora Canvas spec ("saves only when clicked, not automatically")
    smartGuides: true,
    autoGroupButtons: true,
    scaleStrokesAndEffects: true,
    scaleCorners: true,
    multiScaleMode: 'in-place', // 'in-place' (default) | 'normal'
    keyboardIncrement: 1,
    accelPreference: 'auto', // 'auto' (GPU-first -> CPU fallback) | 'gpu' | 'cpu'
    defaultMode: 'edit',
    workspaceLayout: 'canvas' // 'canvas' | 'inline'
  };
}

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
      parsed.preferences = { ...defaultPreferences(), ...(parsed.preferences || {}) };
      return parsed;
    }
  } catch (_) {}
  const init = {
    skillName: 'vectora-canvas',
    displayName: 'Vectora Canvas',
    version: '2.0.0',
    isolatedMemory: true,
    memoryScope: 'vectora-canvas-only',
    preferences: defaultPreferences(),
    customPresets: [],
    ignoredWords: ['VisionPilot', 'Vectora', 'Mirage', 'WebGL', 'Three.js', 'Figma', 'MP4', 'JSON', 'MCP', 'FPS', 'FOV'],
    recentWorkspaces: []
  };
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(init, null, 2), 'utf8');
  return init;
}

function saveMemory(mem) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2), 'utf8');
}

function loadAgentNotesStore() {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    }
  } catch (_) {}
  const init = {
    skillName: 'vectora-canvas',
    noteScope: 'coding-agent-instructions-only',
    notPartOfDesign: true,
    workspaces: {}
  };
  fs.writeFileSync(NOTES_FILE, JSON.stringify(init, null, 2), 'utf8');
  return init;
}

function saveAgentNotesStore(store) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(NOTES_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function getWorkspaceNotes(wsId) {
  const store = loadAgentNotesStore();
  return Array.isArray(store.workspaces?.[wsId]) ? store.workspaces[wsId] : [];
}

function mutateWorkspaceNotes(wsId, payload) {
  const store = loadAgentNotesStore();
  store.workspaces = store.workspaces || {};
  let list = Array.isArray(store.workspaces[wsId]) ? store.workspaces[wsId] : [];
  const action = payload.action || 'upsert';

  if (action === 'clear') {
    list = [];
  } else if (action === 'delete' && payload.id) {
    list = list.filter((n) => n.id !== payload.id);
  } else if (action === 'upsert' && payload.note) {
    const incoming = payload.note;
    const now = new Date().toISOString();
    const id = incoming.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const idx = list.findIndex((n) => n.id === id);
    const nextNumber = idx >= 0 ? list[idx].number : (list.reduce((m, x) => Math.max(m, Number(x.number) || 0), 0) + 1);
    const record = {
      id,
      number: nextNumber,
      entry: incoming.entry || args.entry || 'index.html',
      viewContext: incoming.viewContext || '',
      status: incoming.status || 'open',
      taskType: incoming.taskType || 'fix',
      selector: incoming.selector || '',
      elementTag: incoming.elementTag || '',
      sectionLabel: incoming.sectionLabel || '',
      markRect: incoming.markRect || null,
      text: String(incoming.text || '').trim(),
      createdAt: idx >= 0 ? list[idx].createdAt : now,
      updatedAt: now
    };
    if (idx >= 0) list[idx] = record;
    else list.push(record);
  }

  store.workspaces[wsId] = list;
  saveAgentNotesStore(store);
  return list;
}

// Real-time SSE clients for Coding Agent Live-Mode control
const sseClients = new Set();
const pendingAgentWaiters = new Map();

function broadcastSse(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

function copyDirFiltered(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const skip = new Set([
    '.git', 'node_modules', 'dist', 'dist-web', '_site', '.wrangler', '.vp-memory', 'memory',
    'desktop', 'release', 'win-unpacked', 'mac', 'linux-unpacked', 'out', 'build', '.next', '.cache'
  ]);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const sPath = path.join(src, ent.name);
    const dPath = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDirFiltered(sPath, dPath);
    } else if (ent.isFile()) {
      const stat = fs.statSync(sPath);
      if (stat.size > 15 * 1024 * 1024) {
        try {
          if (fs.existsSync(dPath)) fs.unlinkSync(dPath);
          fs.linkSync(sPath, dPath);
          continue;
        } catch (_) {}
      }
      fs.copyFileSync(sPath, dPath);
    }
  }
}

if (!args.target) {
  const savedMem = loadMemory();
  const recent = (savedMem.recentWorkspaces || []).find((w) => {
    const candidate = w.originalSourceDir || w.target;
    return candidate && fs.existsSync(candidate);
  });
  args.target = recent ? (recent.originalSourceDir || recent.target) : process.cwd();
  if (recent && recent.entry && !process.argv.some((a) => a.startsWith('--entry') || a === '-e')) {
    args.entry = recent.entry;
  }
}

let isRemoteTarget = /^https?:\/\//i.test(args.target);
let resolvedTargetDir = isRemoteTarget ? '' : path.resolve(args.target);
let originalSourceDir = resolvedTargetDir;

if (!isRemoteTarget && args.previewCopy) {
  const slug = path.basename(resolvedTargetDir).replace(/[^a-z0-9_-]/gi, '_') || 'project';
  const sandboxDir = path.join(SANDBOX_ROOT, slug);
  if (fs.existsSync(sandboxDir)) {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  }
  copyDirFiltered(resolvedTargetDir, sandboxDir);
  resolvedTargetDir = sandboxDir;
}

let workspaceId = crypto
  .createHash('sha1')
  .update(resolvedTargetDir || args.target)
  .digest('hex')
  .slice(0, 12);
let workspaceBackupDir = path.join(BACKUP_ROOT, workspaceId);
let sessionOriginDir = path.join(BACKUP_ROOT, `${workspaceId}_origin`);
let savedBaselineDir = path.join(BACKUP_ROOT, `${workspaceId}_saved`);

function normalizeFolderIdentity(p) {
  return String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function recordWorkspaceBoot() {
  const memBoot = loadMemory();
  const curFolderKey = normalizeFolderIdentity(originalSourceDir || resolvedTargetDir || args.target);
  memBoot.recentWorkspaces = [
    {
      workspaceId,
      target: resolvedTargetDir || args.target,
      originalSourceDir: originalSourceDir || args.target,
      previewCopy: Boolean(args.previewCopy),
      entry: args.entry,
      openedAt: new Date().toISOString()
    },
    ...(memBoot.recentWorkspaces || []).filter((w) => {
      const wKey = normalizeFolderIdentity(w.originalSourceDir || w.target || '');
      return w.workspaceId !== workspaceId && (!curFolderKey || wKey !== curFolderKey);
    })
  ].slice(0, 15);
  // Deduplicate recentSessions strictly to 1 entry per project folder
  if (Array.isArray(memBoot.recentSessions)) {
    const seenSessFolders = new Set();
    memBoot.recentSessions = memBoot.recentSessions.filter((s) => {
      const k = normalizeFolderIdentity(s?.originalSourceDir || s?.target || s?.projectName || '');
      if (!k || seenSessFolders.has(k)) return false;
      seenSessFolders.add(k);
      return true;
    });
  }
  saveMemory(memBoot);
}
recordWorkspaceBoot();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.cact': 'application/octet-stream',
  '.safetensors': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4'
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 24 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function listProjectFiles(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir)) return { html: [], css: [], js: [], all: [] };
  const html = [];
  const css = [];
  const js = [];
  const skip = new Set([
    '.git', 'node_modules', 'dist', 'dist-web', '_site', '.wrangler', 'desktop', 'memory', '.vp-memory',
    'release', 'win-unpacked', 'mac', 'linux-unpacked', 'out', 'build', '.next', '.cache'
  ]);
  function walk(dir, depth = 0) {
    if (depth > 3) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');
      if (ent.isDirectory()) {
        walk(full, depth + 1);
      } else if (ent.isFile()) {
        if (/\.html?$/i.test(ent.name)) html.push(rel);
        else if (/\.css$/i.test(ent.name) && ent.name !== 'html-edit-overrides.css') css.push(rel);
        else if (/\.m?js$/i.test(ent.name)) js.push(rel);
      }
    }
  }
  walk(rootDir, 0);
  html.sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  css.sort();
  js.sort();
  return { html, css, js, all: [...html, ...css, ...js] };
}

function readWholeFolderTextMap(rootDir, refreshOrigins = false) {
  const listed = listProjectFiles(rootDir);
  const contents = {};
  const origins = {};
  for (const rel of listed.all) {
    const full = path.join(rootDir, rel);
    try {
      const st = fs.statSync(full);
      if (st.size > 2.5 * 1024 * 1024) continue; // skip huge multi-MB bundled vendor blobs
      ensureWorkspacesSnapshots(rel, refreshOrigins);
      contents[rel] = fs.readFileSync(full, 'utf8');
      const origPath = path.join(sessionOriginDir, rel);
      origins[rel] = fs.existsSync(origPath) ? fs.readFileSync(origPath, 'utf8') : contents[rel];
    } catch (_) {}
  }
  return { files: listed, contents, origins };
}

function ensureWorkspacesSnapshots(relFile, refreshSessionOrigin = false) {
  if (!resolvedTargetDir) return;
  const srcFile = path.join(resolvedTargetDir, relFile);
  if (!fs.existsSync(srcFile)) return;

  const pristineFile = path.join(workspaceBackupDir, relFile);
  if (!fs.existsSync(pristineFile)) {
    fs.mkdirSync(path.dirname(pristineFile), { recursive: true });
    fs.copyFileSync(srcFile, pristineFile);
  }

  const originFile = path.join(sessionOriginDir, relFile);
  if (refreshSessionOrigin || !fs.existsSync(originFile)) {
    fs.mkdirSync(path.dirname(originFile), { recursive: true });
    fs.copyFileSync(srcFile, originFile);
  }

  const savedFile = path.join(savedBaselineDir, relFile);
  if (!fs.existsSync(savedFile)) {
    fs.mkdirSync(path.dirname(savedFile), { recursive: true });
    fs.copyFileSync(srcFile, savedFile);
  }
}

// ============================================================================
// SURGICAL DIRECT-HTML PATCH ENGINE
// Edits the HTML source file directly (inline styles, inserted divs/shapes,
// wrapper groups, deleted elements, text edits, Google Fonts) while preserving
// scripts, formatting, comments, and dynamic app attributes intact.
// ============================================================================
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function camelToKebab(prop) {
  if (prop.startsWith('--')) return prop;
  return String(prop).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function parseStyleMap(styleStr) {
  const map = new Map();
  if (!styleStr) return map;
  // Split declarations outside parentheses (so linear-gradient(...) or rgb(...) stay intact)
  let depth = 0;
  let start = 0;
  const parts = [];
  for (let i = 0; i < styleStr.length; i++) {
    const ch = styleStr[i];
    if (ch === '(') depth++;
    else if (ch === ')' && depth > 0) depth--;
    else if (ch === ';' && depth === 0) {
      parts.push(styleStr.slice(start, i));
      start = i + 1;
    }
  }
  if (start < styleStr.length) parts.push(styleStr.slice(start));

  for (const raw of parts) {
    const idx = raw.indexOf(':');
    if (idx <= 0) continue;
    const k = raw.slice(0, idx).trim().toLowerCase();
    const v = raw.slice(idx + 1).trim();
    if (k && v) map.set(k, v);
  }
  return map;
}

function serializeStyleMap(map) {
  const out = [];
  for (const [k, v] of map.entries()) {
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      out.push(`${k}: ${String(v).trim()}`);
    }
  }
  return out.length ? out.join('; ') + ';' : '';
}

function mergeStyleIntoOpenTag(openTagHtml, stylePropsObj) {
  const styleAttrRe = /\sstyle=(["'])([\s\S]*?)\1/i;
  const existingMatch = styleAttrRe.exec(openTagHtml);
  const styleMap = parseStyleMap(existingMatch ? existingMatch[2] : '');

  for (const [rawKey, rawVal] of Object.entries(stylePropsObj || {})) {
    const k = camelToKebab(rawKey).toLowerCase();
    if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
      styleMap.delete(k);
    } else {
      styleMap.set(k, String(rawVal).trim().replace(/;+$/, ''));
    }
  }

  const serialized = serializeStyleMap(styleMap).replace(/"/g, "'");
  if (!serialized) {
    return existingMatch ? openTagHtml.replace(styleAttrRe, '') : openTagHtml;
  }
  if (existingMatch) {
    return openTagHtml.replace(styleAttrRe, ` style="${serialized}"`);
  }
  return openTagHtml.replace(/(\s*\/?)>$/, ` style="${serialized}"$1>`);
}

/**
 * Lightweight HTML open/close tag scanner with parent-child tree & exact byte offsets
 */
function parseStaticHtmlTree(html) {
  const root = { tag: '#document', children: [], start: 0, end: html.length };
  const stack = [root];
  const byId = new Map();
  const tagRe = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>|<([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^>"'/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?)>/g;

  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const full = m[0];
    if (full.startsWith('<!--') || full.startsWith('<!')) continue;

    if (m[1]) {
      // Closing tag
      const closeTag = m[1].toLowerCase();
      for (let s = stack.length - 1; s >= 1; s--) {
        if (stack[s].tag === closeTag) {
          stack[s].closeStart = m.index;
          stack[s].end = tagRe.lastIndex;
          stack.length = s;
          break;
        }
      }
      continue;
    }

    const openTag = m[2].toLowerCase();
    const attrText = m[3] || '';
    const selfClosing = VOID_TAGS.has(openTag) || /\/\s*>$/.test(full);

    const idMatch = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrText);
    const clsMatch = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrText);
    const idVal = idMatch ? (idMatch[1] ?? idMatch[2] ?? idMatch[3] ?? '') : '';
    const clsVal = clsMatch ? (clsMatch[1] ?? clsMatch[2] ?? clsMatch[3] ?? '') : '';

    const node = {
      tag: openTag,
      id: idVal,
      classes: clsVal ? clsVal.trim().split(/\s+/).filter(Boolean) : [],
      attrText,
      start: m.index,
      openEnd: tagRe.lastIndex,
      closeStart: selfClosing ? tagRe.lastIndex : html.length,
      end: selfClosing ? tagRe.lastIndex : html.length,
      selfClosing,
      parent: stack[stack.length - 1],
      children: []
    };
    stack[stack.length - 1].children.push(node);
    if (idVal && !byId.has(idVal)) byId.set(idVal, node);

    // Skip raw text bodies of <script> and <style>
    if (!selfClosing && (openTag === 'script' || openTag === 'style')) {
      const closeRe = new RegExp(`<\\/${openTag}\\s*>`, 'ig');
      closeRe.lastIndex = tagRe.lastIndex;
      const cm = closeRe.exec(html);
      if (cm) {
        node.closeStart = cm.index;
        node.end = closeRe.lastIndex;
        tagRe.lastIndex = closeRe.lastIndex;
      }
      continue;
    }

    if (!selfClosing) {
      stack.push(node);
    }
  }

  return { root, byId };
}

function matchSimpleSelectorSegment(node, seg) {
  let rest = seg.trim();
  if (!rest) return false;

  let nthOfType = null;
  let nthChild = null;
  rest = rest.replace(/:nth-of-type\((\d+)\)/g, (_, n) => { nthOfType = parseInt(n, 10); return ''; });
  rest = rest.replace(/:nth-child\((\d+)\)/g, (_, n) => { nthChild = parseInt(n, 10); return ''; });
  // Strip any attribute selector like [data-vc-id="..."]
  const attrMatches = [];
  rest = rest.replace(/\[([^\]=]+)(?:=["']?([^\]"']*)["']?)?\]/g, (_, k, v) => {
    attrMatches.push({ k: k.trim(), v: v ?? null });
    return '';
  });

  if (rest.startsWith('#')) {
    const idName = rest.slice(1).split('.')[0].replace(/\\/g, '');
    if (node.id !== idName) return false;
  } else {
    const dotParts = rest.split('.');
    const tagPart = dotParts[0].replace(/\\/g, '').toLowerCase();
    if (tagPart && tagPart !== '*' && node.tag !== tagPart) return false;
    for (let i = 1; i < dotParts.length; i++) {
      const cName = dotParts[i].replace(/\\/g, '');
      if (cName && !node.classes.includes(cName)) return false;
    }
  }

  for (const am of attrMatches) {
    const re = new RegExp(`\\b${escapeRegExp(am.k)}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?`, 'i');
    const m = re.exec(node.attrText || '');
    if (!m) return false;
    if (am.v !== null) {
      const actual = m[1] ?? m[2] ?? m[3] ?? '';
      if (actual !== am.v) return false;
    }
  }

  if (nthOfType !== null && node.parent) {
    const sibs = node.parent.children.filter((c) => c.tag === node.tag);
    if (sibs.indexOf(node) + 1 !== nthOfType) return false;
  }
  if (nthChild !== null && node.parent) {
    if (node.parent.children.indexOf(node) + 1 !== nthChild) return false;
  }
  return true;
}

function findNodeInTree(tree, id, selector) {
  if (id && tree.byId.has(id)) {
    return tree.byId.get(id);
  }
  if (!selector) return null;
  const parts = selector.split(/\s*>\s*/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;

  let currentCandidates = [];
  const first = parts[0];
  if (first.startsWith('#')) {
    const idOnly = first.slice(1).split(/[.:\[]/)[0].replace(/\\/g, '');
    const found = tree.byId.get(idOnly);
    if (found) currentCandidates = [found];
  } else if (first === 'body' || first.startsWith('body.') || first.startsWith('body[')) {
    const htmlNode = tree.root.children.find((c) => c.tag === 'html');
    const bodyNode = (htmlNode ? htmlNode.children : tree.root.children).find((c) => c.tag === 'body');
    if (bodyNode) currentCandidates = [bodyNode];
  } else {
    const walkAll = (n) => {
      for (const ch of n.children || []) {
        if (matchSimpleSelectorSegment(ch, first)) currentCandidates.push(ch);
        walkAll(ch);
      }
    };
    walkAll(tree.root);
  }

  for (let i = 1; i < parts.length && currentCandidates.length; i++) {
    const seg = parts[i];
    const next = [];
    for (const cand of currentCandidates) {
      for (const ch of cand.children || []) {
        if (matchSimpleSelectorSegment(ch, seg)) next.push(ch);
      }
    }
    currentCandidates = next;
  }
  return currentCandidates[0] || null;
}

function applySurgicalReplacements(html, edits) {
  // Sort edits in descending byte order so earlier byte offsets stay valid
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let out = html;
  let lastStart = Infinity;
  for (const ed of sorted) {
    if (ed.end > lastStart) continue; // Guard against overlapping byte spans
    out = out.slice(0, ed.start) + ed.replacement + out.slice(ed.end);
    lastStart = ed.start;
  }
  return out;
}

const LEGACY_OVERRIDE_RE = /\s*<link[^>]*href=["'](?:\.\/)?html-edit-overrides\.css["'][^>]*>\s*/gi;
const VECTORA_SYNC_STYLE_RE = /\s*<style[^>]*id=["']vectora-sync-styles["'][^>]*>[\s\S]*?<\/style>\s*/gi;
const VECTORA_GFONT_LINK_RE = /\s*<link[^>]*data-vc-gfont=["'][^"']*["'][^>]*>\s*/gi;

function applyDirectHtmlSave(payload) {
  if (isRemoteTarget || !resolvedTargetDir) {
    return { ok: true, mode: 'remote-memory-only', savedAt: Date.now() };
  }
  const relHtml = String(payload.entry || args.entry || 'index.html').replace(/^\/+/, '');
  const htmlPath = path.resolve(resolvedTargetDir, relHtml);
  if (!htmlPath.startsWith(resolvedTargetDir) || !fs.existsSync(htmlPath)) {
    throw new Error(`Target HTML file not found: ${relHtml}`);
  }

  ensureWorkspacesSnapshots(relHtml, false);
  const legacyOverridePath = path.join(path.dirname(htmlPath), 'html-edit-overrides.css');
  if (fs.existsSync(legacyOverridePath)) {
    try { fs.unlinkSync(legacyOverridePath); } catch (_) {}
  }

  // Start from sessionOrigin/<relHtml> (the static HTML loaded into this iframe session)
  // so Save -> Undo -> Save deterministically produces exact clean HTML!
  const originFile = path.join(sessionOriginDir, relHtml);
  let htmlContent = fs.existsSync(originFile)
    ? fs.readFileSync(originFile, 'utf8')
    : fs.readFileSync(htmlPath, 'utf8');

  htmlContent = htmlContent
    .replace(LEGACY_OVERRIDE_RE, '\n')
    .replace(VECTORA_SYNC_STYLE_RE, '\n')
    .replace(VECTORA_GFONT_LINK_RE, '\n');

  // 1. Delete removed static elements first
  const deletedTargets = Array.isArray(payload.deletedTargets) ? payload.deletedTargets : [];
  const fallbackDynamicRules = [];
  if (deletedTargets.length) {
    const tree1 = parseStaticHtmlTree(htmlContent);
    const delEdits = [];
    for (const dt of deletedTargets) {
      const node = findNodeInTree(tree1, dt.id, dt.selector);
      if (node && node.tag !== 'body' && node.tag !== 'html') {
        delEdits.push({ start: node.start, end: node.end, replacement: '' });
      } else if (dt.selector) {
        fallbackDynamicRules.push(`${dt.selector} { display: none !important; }`);
      }
    }
    if (delEdits.length) {
      htmlContent = applySurgicalReplacements(htmlContent, delEdits);
    }
  }

  // 2. Apply direct text & attribute edits on static HTML elements
  const textPatches = Array.isArray(payload.textPatches) ? payload.textPatches : [];
  if (textPatches.length) {
    for (const tp of textPatches) {
      if (!tp || typeof tp.after !== 'string') continue;
      const treeT = parseStaticHtmlTree(htmlContent);
      const node = findNodeInTree(treeT, tp.id, tp.selector);
      if (node) {
        if (tp.attr && ['placeholder', 'title', 'value', 'aria-label'].includes(tp.attr)) {
          const openSlice = htmlContent.slice(node.start, node.openEnd);
          const attrRe = new RegExp(`(\\b${escapeRegExp(tp.attr)}\\s*=\\s*)(["'])([\\s\\S]*?)\\2`, 'i');
          const safeVal = tp.after.replace(/"/g, '&quot;');
          const nextOpen = attrRe.test(openSlice)
            ? openSlice.replace(attrRe, `$1"${safeVal}"`)
            : openSlice.replace(/(\s*\/?)>$/, ` ${tp.attr}="${safeVal}"$1>`);
          htmlContent = htmlContent.slice(0, node.start) + nextOpen + htmlContent.slice(node.openEnd);
        } else if (!node.selfClosing) {
          const innerSlice = htmlContent.slice(node.openEnd, node.closeStart);
          if (node.children.length === 0) {
            const safeTxt = tp.after
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            htmlContent = htmlContent.slice(0, node.openEnd) + safeTxt + htmlContent.slice(node.closeStart);
          } else if (tp.before && innerSlice.includes(tp.before)) {
            const replacedInner = innerSlice.replace(tp.before, tp.after);
            htmlContent = htmlContent.slice(0, node.openEnd) + replacedInner + htmlContent.slice(node.closeStart);
          }
        }
      } else if (tp.before && tp.before !== tp.after) {
        const tagTextRe = new RegExp(`(>[^<]*?)${escapeRegExp(tp.before)}([^<]*?<)`);
        if (tagTextRe.test(htmlContent)) {
          htmlContent = htmlContent.replace(tagTextRe, `$1${tp.after}$2`);
        }
      }
    }
  }

  // 3. Apply direct inline style="..." patches onto static HTML elements
  const stylePatches = Array.isArray(payload.stylePatches) ? payload.stylePatches : [];
  if (stylePatches.length) {
    const treeS = parseStaticHtmlTree(htmlContent);
    const styleEdits = [];
    for (const sp of stylePatches) {
      if (!sp || !sp.props || typeof sp.props !== 'object') continue;
      const entries = Object.entries(sp.props).filter(([, v]) => v !== undefined);
      if (!entries.length) continue;
      const node = findNodeInTree(treeS, sp.id, sp.selector);
      if (node) {
        const openTagHtml = htmlContent.slice(node.start, node.openEnd);
        const updatedOpenTag = mergeStyleIntoOpenTag(openTagHtml, sp.props);
        if (updatedOpenTag !== openTagHtml) {
          styleEdits.push({ start: node.start, end: node.openEnd, replacement: updatedOpenTag });
        }
      } else if (sp.selector) {
        const decls = entries
          .filter(([, v]) => v !== null && String(v).trim() !== '')
          .map(([k, v]) => `  ${camelToKebab(k)}: ${String(v).trim()} !important;`);
        if (decls.length) {
          fallbackDynamicRules.push(`${sp.selector} {\n${decls.join('\n')}\n}`);
        }
      }
    }
    if (styleEdits.length) {
      htmlContent = applySurgicalReplacements(htmlContent, styleEdits);
    }
  }

  // 3B. Apply direct attribute / link patches (href, data-vc-link, target, etc.)
  const attrPatches = Array.isArray(payload.attrPatches) ? payload.attrPatches : [];
  if (attrPatches.length && typeof codeSync.mergeAttrsIntoOpenTag === 'function') {
    const treeA = parseStaticHtmlTree(htmlContent);
    const attrEdits = [];
    const seenAttrStarts = new Set();
    for (const ap of attrPatches) {
      if (!ap || !ap.attrs || typeof ap.attrs !== 'object') continue;
      const node = findNodeInTree(treeA, ap.id, ap.selector);
      if (node && !seenAttrStarts.has(node.start)) {
        seenAttrStarts.add(node.start);
        attrEdits.push({
          start: node.start,
          end: node.openEnd,
          replacement: codeSync.mergeAttrsIntoOpenTag(node.openTagRaw, ap.attrs)
        });
      }
    }
    if (attrEdits.length) {
      htmlContent = applySurgicalReplacements(htmlContent, attrEdits);
    }
  }

  // 4. Insert newly created Shapes, Flow Divs, Wrapper Groups, or Pasted/Duplicated elements directly into HTML!
  const insertedNodes = Array.isArray(payload.insertedNodes) ? payload.insertedNodes : [];
  for (const ins of insertedNodes) {
    if (!ins || !ins.cleanHtml) continue;
    const treeI = parseStaticHtmlTree(htmlContent);
    const parentNode =
      findNodeInTree(treeI, ins.parentId, ins.parentSelector) ||
      findNodeInTree(treeI, '', 'body');
    if (!parentNode || parentNode.selfClosing) continue;

    let insertPos = parentNode.closeStart;
    if (ins.refId || ins.refSelector) {
      const refNode = findNodeInTree(treeI, ins.refId, ins.refSelector);
      if (refNode && refNode.parent === parentNode) {
        insertPos = ins.position === 'after' ? refNode.end : refNode.start;
      }
    } else if (typeof ins.childIndex === 'number' && ins.childIndex >= 0 && ins.childIndex < parentNode.children.length) {
      insertPos = parentNode.children[ins.childIndex].start;
    }

    const snippet = `\n  ${ins.cleanHtml.trim()}\n`;
    htmlContent = htmlContent.slice(0, insertPos) + snippet + htmlContent.slice(insertPos);
  }

  // 5. Inject Google Fonts <link> tags directly into <head>
  const googleFonts = Array.isArray(payload.googleFonts) ? payload.googleFonts.filter(Boolean) : [];
  const headInsertions = [];
  if (googleFonts.length) {
    const families = googleFonts
      .map((f) => `family=${encodeURIComponent(String(f).trim()).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
      .join('&');
    const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    if (!htmlContent.includes(href)) {
      headInsertions.push(`  <link rel="stylesheet" href="${href}" data-vc-gfont="true">`);
    }
  }

  // 6. Theme / Palette CSS or fallback rules for JS-generated dynamic nodes
  const extraCssBlocks = [];
  if (payload.themeCss && String(payload.themeCss).trim()) {
    extraCssBlocks.push(String(payload.themeCss).trim());
  }
  if (fallbackDynamicRules.length) {
    extraCssBlocks.push(fallbackDynamicRules.join('\n'));
  }
  if (extraCssBlocks.length) {
    headInsertions.push(`  <style id="vectora-sync-styles">\n${extraCssBlocks.join('\n')}\n  </style>`);
  }

  if (headInsertions.length) {
    const block = '\n' + headInsertions.join('\n') + '\n';
    if (/<\/head>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/<\/head>/i, `${block}</head>`);
    } else {
      htmlContent = block + htmlContent;
    }
  }

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  // Update the "Saved / Original" baseline file on disk so Original reflects the latest saved state!
  const savedFile = path.join(savedBaselineDir, relHtml);
  fs.mkdirSync(path.dirname(savedFile), { recursive: true });
  fs.copyFileSync(htmlPath, savedFile);

  const mem = loadMemory();
  mem.workspaceStates = mem.workspaceStates || {};
  mem.workspaceStates[workspaceId] = {
    entry: relHtml,
    preset: payload.preset || 'original',
    primaryColor: payload.primaryColor || '',
    secondaryColor: payload.secondaryColor || '',
    stylePatchCount: stylePatches.length,
    insertedNodeCount: insertedNodes.length,
    deletedCount: deletedTargets.length,
    googleFonts,
    updatedAt: new Date().toISOString()
  };
  saveMemory(mem);

  return {
    ok: true,
    directHtmlEdited: true,
    file: relHtml,
    stylePatchesApplied: stylePatches.length,
    insertedNodesApplied: insertedNodes.length,
    deletedNodesApplied: deletedTargets.length,
    googleFontsApplied: googleFonts.length,
    savedAt: Date.now()
  };
}

function restorePristineProject() {
  if (isRemoteTarget || !resolvedTargetDir) return { ok: true };
  if (fs.existsSync(workspaceBackupDir)) {
    const walkRestore = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const bFull = path.join(dir, ent.name);
        const rel = path.relative(workspaceBackupDir, bFull);
        const tFull = path.join(resolvedTargetDir, rel);
        if (ent.isDirectory()) walkRestore(bFull);
        else if (ent.isFile()) {
          fs.mkdirSync(path.dirname(tFull), { recursive: true });
          fs.copyFileSync(bFull, tFull);
          const originFull = path.join(sessionOriginDir, rel);
          fs.mkdirSync(path.dirname(originFull), { recursive: true });
          fs.copyFileSync(bFull, originFull);
          const savedFull = path.join(savedBaselineDir, rel);
          fs.mkdirSync(path.dirname(savedFull), { recursive: true });
          fs.copyFileSync(bFull, savedFull);
        }
      }
    };
    walkRestore(workspaceBackupDir);
  }
  const ov = path.join(resolvedTargetDir, 'html-edit-overrides.css');
  if (fs.existsSync(ov)) {
    try { fs.unlinkSync(ov); } catch (_) {}
  }
  return { ok: true, restoredAt: Date.now() };
}

function serveStaticFile(req, res, filePath, injectBridge = false) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  if (injectBridge && (ext === '.html' || ext === '.htm')) {
    const rel = path.relative(resolvedTargetDir, filePath).replace(/\\/g, '/');
    ensureWorkspacesSnapshots(rel, true);

    let html = fs.readFileSync(filePath, 'utf8');
    const preBypassTag = `\n<script src="/__vc_studio/prebypass.js" data-vc-bridge="true"></script>\n`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${preBypassTag}`);
    } else {
      html = preBypassTag + html;
    }

    const bridgeTag = `\n<script data-vc-bridge="true">
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
        }
      } catch (_) {}
    </script>\n<script src="/__vc_studio/bridge.js" data-vc-bridge="true"></script>\n`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${bridgeTag}</body>`);
    } else {
      html += bridgeTag;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-store'
    });
    if (req.method === 'HEAD') res.end();
    else res.end(html, 'utf8');
    return;
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(stat.size - 1, parseInt(m[2], 10)) : stat.size - 1;
      if (start <= end && start < stat.size) {
        res.writeHead(206, {
          'Content-Type': mime,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Cache-Control': 'no-store'
        });
        if (req.method === 'HEAD') res.end();
        else fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
  }

  res.writeHead(200, {
    'Content-Type': mime,
    'Accept-Ranges': 'bytes',
    'Content-Length': stat.size,
    'Cache-Control': 'no-store'
  });
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const rawPathname = decodeURIComponent(u.pathname);
    // Normalize legacy /__he_* routes to /__vc_* so any caller works seamlessly
    const pathname = rawPathname
      .replace(/^\/__he_api\//, '/__vc_api/')
      .replace(/^\/__he_studio\//, '/__vc_studio/')
      .replace(/^\/__he_target\//, '/__vc_target/');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    if (pathname === '/__vc_api/status') {
      const mem = loadMemory();
      const files = listProjectFiles(resolvedTargetDir);
      sendJson(res, 200, {
        ok: true,
        skill: 'vectora-canvas',
        displayName: 'Vectora Canvas',
        workspaceId,
        target: resolvedTargetDir || args.target,
        originalSourceDir: originalSourceDir || args.target,
        previewCopy: Boolean(args.previewCopy),
        projectName: isRemoteTarget ? args.target : path.basename(originalSourceDir || resolvedTargetDir),
        entry: args.entry,
        files,
        memoryPath: MEMORY_FILE,
        notesPath: NOTES_FILE,
        isolatedMemory: true,
        preferences: mem.preferences || defaultPreferences(),
        ignoredWords: mem.ignoredWords || [],
        notes: getWorkspaceNotes(workspaceId),
        savedState: (mem.workspaceStates && mem.workspaceStates[workspaceId]) || null
      });
      return;
    }

    if (pathname === '/__vc_api/files') {
      sendJson(res, 200, { ok: true, ...listProjectFiles(resolvedTargetDir) });
      return;
    }

    if (pathname === '/__vc_api/switch-target' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body.target && fs.existsSync(path.resolve(body.target))) {
        args.target = path.resolve(body.target);
        args.entry = body.entry || 'index.html';
        isRemoteTarget = false;
        resolvedTargetDir = args.target;
        originalSourceDir = args.target;
        workspaceId = crypto.createHash('sha1').update(resolvedTargetDir).digest('hex').slice(0, 12);
        workspaceBackupDir = path.join(BACKUP_ROOT, workspaceId);
        sessionOriginDir = path.join(BACKUP_ROOT, `${workspaceId}_origin`);
        savedBaselineDir = path.join(BACKUP_ROOT, `${workspaceId}_saved`);
        recordWorkspaceBoot();
        broadcastSse('target_switched', { target: resolvedTargetDir, entry: args.entry });
        sendJson(res, 200, { ok: true, target: resolvedTargetDir, entry: args.entry, workspaceId });
        return;
      }
      sendJson(res, 400, { ok: false, error: 'Target folder does not exist' });
      return;
    }

    if (pathname === '/__vc_api/memory') {
      if (req.method === 'GET') {
        sendJson(res, 200, { ok: true, memoryPath: MEMORY_FILE, memory: loadMemory() });
        return;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const mem = loadMemory();
        if (body.preferences && typeof body.preferences === 'object') {
          mem.preferences = { ...mem.preferences, ...body.preferences };
        }
        if (Array.isArray(body.ignoredWords)) {
          mem.ignoredWords = Array.from(new Set([...(mem.ignoredWords || []), ...body.ignoredWords]));
        }
        if (Array.isArray(body.customPresets)) {
          mem.customPresets = body.customPresets;
        }
        saveMemory(mem);
        sendJson(res, 200, { ok: true, memory: mem });
        return;
      }
    }

    if (pathname === '/__vc_api/notes') {
      if (req.method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          notesPath: NOTES_FILE,
          notPartOfDesign: true,
          workspaceId,
          notes: getWorkspaceNotes(workspaceId)
        });
        return;
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const notes = mutateWorkspaceNotes(workspaceId, body);
        broadcastSse('notes_updated', { workspaceId, notes });
        sendJson(res, 200, { ok: true, notesPath: NOTES_FILE, notes });
        return;
      }
    }

    if (pathname === '/__vc_api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(`event: connected\ndata: ${JSON.stringify({ workspaceId, ts: Date.now() })}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (pathname === '/__vc_api/agent-command' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const cmdId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const commandPayload = { cmdId, ...body };
      const waitMs = Math.min(8000, Math.max(400, Number(body.waitMs) || 3500));

      if (sseClients.size === 0) {
        sendJson(res, 200, {
          ok: true,
          queuedOnly: true,
          cmdId,
          note: 'No active studio browser connected yet; open Vectora Canvas URL to execute live command.'
        });
        return;
      }

      const resultPromise = new Promise((resolve) => {
        const timer = setTimeout(() => {
          pendingAgentWaiters.delete(cmdId);
          resolve({ timedOut: true, cmdId });
        }, waitMs);
        pendingAgentWaiters.set(cmdId, (ack) => {
          clearTimeout(timer);
          pendingAgentWaiters.delete(cmdId);
          resolve(ack);
        });
      });

      broadcastSse('agent_command', commandPayload);
      const ack = await resultPromise;
      sendJson(res, 200, { ok: true, cmdId, ...ack });
      return;
    }

    if (pathname === '/__vc_api/agent-ack' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body && body.cmdId && pendingAgentWaiters.has(body.cmdId)) {
        pendingAgentWaiters.get(body.cmdId)(body);
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname === '/__vc_api/save' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = applyDirectHtmlSave(body);
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/__vc_api/project-files' && req.method === 'GET') {
      const snap = readWholeFolderTextMap(resolvedTargetDir, false);
      const mem = loadMemory();
      sendJson(res, 200, {
        ok: true,
        projectName: isRemoteTarget ? args.target : path.basename(originalSourceDir || resolvedTargetDir),
        target: resolvedTargetDir,
        entry: args.entry,
        files: snap.files,
        contents: snap.contents,
        origins: snap.origins,
        recentWorkspaces: mem.recentWorkspaces || [],
        recentSessions: mem.recentSessions || []
      });
      return;
    }

    if (pathname === '/__vc_api/save-project' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (isRemoteTarget || !resolvedTargetDir) {
        sendJson(res, 200, { ok: true, mode: 'remote-memory-only', savedAt: Date.now() });
        return;
      }
      const autoSyncOnly = Boolean(body.autoSyncOnly);
      const snap = readWholeFolderTextMap(resolvedTargetDir, false);
      const mergedMap = { ...snap.contents, ...(body.files || {}) };
      const originMap = { ...snap.origins };
      // If user explicitly edited raw code in the Code tab, treat those edits as part of the base map
      if (body.codeEditedFiles && typeof body.codeEditedFiles === 'object') {
        for (const [k, v] of Object.entries(body.codeEditedFiles)) {
          mergedMap[k] = String(v);
          originMap[k] = String(v);
        }
      }
      let outFiles = mergedMap;
      let modifiedList = Object.keys(body.files || {});
      if (body.payload) {
        const synced = codeSync.applyCanvasPayloadToProject({
          entry: body.entry || args.entry || 'index.html',
          filesMap: mergedMap,
          originFilesMap: originMap,
          payload: body.payload,
          projectMeta: body.projectMeta || {}
        });
        outFiles = synced.filesMap;
        modifiedList = Array.from(new Set([...modifiedList, ...synced.modifiedFiles]));
      }
      const written = [];
      for (const rel of modifiedList) {
        const cleanRel = codeSync.normalizeRelPath(rel);
        if (!cleanRel || outFiles[cleanRel] === undefined) continue;
        const full = path.resolve(resolvedTargetDir, cleanRel);
        if (!full.startsWith(resolvedTargetDir)) continue;
        if (fs.existsSync(full)) ensureWorkspacesSnapshots(cleanRel, false);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, String(outFiles[cleanRel]), 'utf8');
        if (!autoSyncOnly) {
          const savedFile = path.join(savedBaselineDir, cleanRel);
          fs.mkdirSync(path.dirname(savedFile), { recursive: true });
          fs.copyFileSync(full, savedFile);
          if (body.codeEditedFiles && body.codeEditedFiles[cleanRel] !== undefined) {
            const origFile = path.join(sessionOriginDir, cleanRel);
            fs.mkdirSync(path.dirname(origFile), { recursive: true });
            fs.copyFileSync(full, origFile);
          }
        }
        written.push(cleanRel);
      }
      sendJson(res, 200, {
        ok: true,
        autoSyncOnly,
        writtenFiles: written,
        contents: outFiles,
        files: listProjectFiles(resolvedTargetDir),
        savedAt: Date.now()
      });
      return;
    }

    if (pathname === '/__vc_api/create-session' && req.method === 'POST') {
      const body = await readJsonBody(req);
      let fileName = codeSync.normalizeRelPath(body.name || `session-${Date.now().toString(36).slice(-4)}.html`);
      if (!/\.html?$/i.test(fileName)) fileName += '.html';
      const full = path.resolve(resolvedTargetDir, fileName);
      if (!full.startsWith(resolvedTargetDir)) {
        sendJson(res, 403, { ok: false, error: 'Invalid session filename' });
        return;
      }
      const existing = listProjectFiles(resolvedTargetDir);
      if (!fs.existsSync(full)) {
        const projName = path.basename(originalSourceDir || resolvedTargetDir);
        const tpl = codeSync.createSessionHtmlTemplate(fileName, projName, existing.css.slice(0, 2), existing.js.slice(0, 2));
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, tpl, 'utf8');
      }
      args.entry = fileName;
      ensureWorkspacesSnapshots(fileName, true);
      const mem = loadMemory();
      const folderKey = normalizeFolderIdentity(originalSourceDir || resolvedTargetDir);
      mem.recentSessions = [
        {
          id: `${workspaceId}`,
          projectName: path.basename(originalSourceDir || resolvedTargetDir),
          target: resolvedTargetDir,
          originalSourceDir: originalSourceDir || resolvedTargetDir,
          entry: fileName,
          openedAt: new Date().toISOString()
        },
        ...(mem.recentSessions || []).filter((s) => normalizeFolderIdentity(s.originalSourceDir || s.target || s.projectName) !== folderKey)
      ].slice(0, 20);
      saveMemory(mem);
      const snap = readWholeFolderTextMap(resolvedTargetDir, false);
      sendJson(res, 200, { ok: true, entry: fileName, files: snap.files, contents: snap.contents, origins: snap.origins, recentSessions: mem.recentSessions });
      return;
    }

    if (pathname === '/__vc_api/create-project' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const rawName = String(body.name || 'Vectora Project').trim() || 'Vectora Project';
      const slug = rawName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now().toString(36)}`;
      const baseRoot = body.parentDir && fs.existsSync(path.resolve(body.parentDir))
        ? path.resolve(body.parentDir)
        : PROJECTS_ROOT;
      const projDir = path.join(baseRoot, slug);
      fs.mkdirSync(projDir, { recursive: true });
      const starter = codeSync.createStarterProjectFiles(rawName);
      for (const [rel, txt] of Object.entries(starter)) {
        const fPath = path.join(projDir, rel);
        fs.mkdirSync(path.dirname(fPath), { recursive: true });
        fs.writeFileSync(fPath, txt, 'utf8');
      }
      args.target = projDir;
      args.entry = 'index.html';
      isRemoteTarget = false;
      resolvedTargetDir = projDir;
      originalSourceDir = projDir;
      workspaceId = crypto.createHash('sha1').update(resolvedTargetDir).digest('hex').slice(0, 12);
      workspaceBackupDir = path.join(BACKUP_ROOT, workspaceId);
      sessionOriginDir = path.join(BACKUP_ROOT, `${workspaceId}_origin`);
      savedBaselineDir = path.join(BACKUP_ROOT, `${workspaceId}_saved`);
      recordWorkspaceBoot();
      const snap = readWholeFolderTextMap(resolvedTargetDir, true);
      broadcastSse('target_switched', { target: resolvedTargetDir, entry: args.entry });
      sendJson(res, 200, {
        ok: true,
        projectName: rawName,
        target: resolvedTargetDir,
        entry: 'index.html',
        files: snap.files,
        contents: snap.contents,
        origins: snap.origins
      });
      return;
    }

    if (pathname === '/__vc_api/read-file' && req.method === 'GET') {
      const rel = codeSync.normalizeRelPath(u.searchParams.get('file') || args.entry || 'index.html');
      const full = path.resolve(resolvedTargetDir, rel);
      if (!full.startsWith(resolvedTargetDir) || !fs.existsSync(full)) {
        sendJson(res, 404, { ok: false, error: 'File not found' });
        return;
      }
      sendJson(res, 200, { ok: true, file: rel, content: fs.readFileSync(full, 'utf8') });
      return;
    }

    if (pathname === '/__vc_api/restore-pristine' && req.method === 'POST') {
      const result = restorePristineProject();
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/__vc_api/read-source' && req.method === 'GET') {
      const rel = String(u.searchParams.get('entry') || args.entry || 'index.html').replace(/^\/+/, '');
      const full = path.resolve(resolvedTargetDir, rel);
      if (!full.startsWith(resolvedTargetDir) || !fs.existsSync(full)) {
        sendJson(res, 404, { ok: false, error: 'File not found' });
        return;
      }
      sendJson(res, 200, { ok: true, file: rel, html: fs.readFileSync(full, 'utf8') });
      return;
    }

    // Studio UI Shell
    if (pathname === '/' || pathname === '/__vc_studio' || pathname === '/__vc_studio/') {
      serveStaticFile(req, res, path.join(STUDIO_DIR, 'index.html'), false);
      return;
    }

    if (['/studio.css', '/code-sync.js', '/studio.js', '/bridge.js', '/prebypass.js'].includes(pathname)) {
      serveStaticFile(req, res, path.join(STUDIO_DIR, pathname.slice(1)), false);
      return;
    }

    if (pathname.startsWith('/__vc_studio/')) {
      const rel = pathname.slice('/__vc_studio/'.length);
      const studioFile = path.resolve(STUDIO_DIR, rel);
      if (!studioFile.startsWith(STUDIO_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      serveStaticFile(req, res, studioFile, false);
      return;
    }

    // Clean full-page Publish route (serves target HTML, CSS, JS, and assets WITHOUT editor bridge!)
    if (pathname === '/__vc_publish' || pathname.startsWith('/__vc_publish/')) {
      let pubRel = pathname.startsWith('/__vc_publish/')
        ? pathname.slice('/__vc_publish/'.length)
        : '';
      if (!pubRel || pubRel.endsWith('/')) pubRel += args.entry || 'index.html';
      if (!isRemoteTarget && resolvedTargetDir) {
        const pubFile = path.resolve(resolvedTargetDir, pubRel);
        if (!pubFile.startsWith(resolvedTargetDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        serveStaticFile(req, res, pubFile, false);
        return;
      }
    }

    // Target project files under /__vc_target/... (and root fallback for root-relative assets like /models/... or /favicon.svg)
    let targetRel = pathname.startsWith('/__vc_target/')
      ? pathname.slice('/__vc_target/'.length)
      : pathname.replace(/^\/+/, '');
    if (!targetRel || targetRel.endsWith('/')) {
      targetRel += args.entry || 'index.html';
    }

    if (!isRemoteTarget && resolvedTargetDir) {
      const targetFile = path.resolve(resolvedTargetDir, targetRel);
      if (!targetFile.startsWith(resolvedTargetDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const inject = pathname.startsWith('/__vc_target/') && /\.html?$/i.test(targetFile);
      serveStaticFile(req, res, targetFile, inject);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err?.message || err) });
  }
});

function openInUserBrowser(url) {
  try {
    if (process.platform === 'win32') {
      const chromeCandidates = [
        path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
      ].filter(Boolean);
      const chromeExe = chromeCandidates.find((p) => fs.existsSync(p));
      if (chromeExe) {
        spawn(chromeExe, ['--new-window', url], { detached: true, stdio: 'ignore' }).unref();
        return;
      }
      spawn('explorer.exe', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (_) {}
}

server.listen(args.port, args.host, () => {
  const boundPort = server.address()?.port || args.port;
  const url = `http://${args.host}:${boundPort}`;
  console.log(`[Vectora Canvas] Visual HTML Workspace running at ${url}`);
  console.log(`[Vectora Canvas] Target project: ${resolvedTargetDir || args.target}`);
  console.log(`[Vectora Canvas] Memory: ${MEMORY_FILE}`);
  if (args.open) {
    openInUserBrowser(url);
  }
});
