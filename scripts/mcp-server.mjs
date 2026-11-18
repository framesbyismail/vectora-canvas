#!/usr/bin/env node
/**
 * Vectora Canvas — Model Context Protocol (MCP) Server (Stdio JSON-RPC 2.0)
 * Zero external dependencies. Connects Antigravity, Claude Code, Cursor, Windsurf, and Codex
 * directly to Vectora Canvas's live design sync, Famous Styles, UI Elements, and Temporary Preview!
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const SKILL_ROOT = path.resolve(__dirname, '..');
const MEMORY_DIR = path.join(SKILL_ROOT, 'memory');
const LIVE_SYNC_FILE = path.join(MEMORY_DIR, 'live-agent-sync.json');
const NOTES_FILE = path.join(MEMORY_DIR, 'agent-notes.json');
const SERVER_SCRIPT = path.join(__dirname, 'server.mjs');
const designLib = require('../studio/design-library.js');

const DEFAULT_PORT = Number(process.env.VECTORA_PORT || 4680);

function httpJson(method, urlPath, bodyObj = null, port = DEFAULT_PORT, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? Buffer.from(JSON.stringify(bodyObj), 'utf8') : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': payload.length }
          : {}
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const txt = Buffer.concat(chunks).toString('utf8');
          try {
            resolve(JSON.parse(txt));
          } catch (_) {
            resolve({ ok: res.statusCode < 400, raw: txt });
          }
        });
      }
    );
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function ensureServerRunning(targetDir = '', entry = 'index.html') {
  try {
    const st = await httpJson('GET', '/__vc_api/status', null, DEFAULT_PORT, 900);
    if (st && st.ok) {
      if (targetDir && fs.existsSync(path.resolve(targetDir))) {
        await httpJson('POST', '/__vc_api/switch-target', { target: path.resolve(targetDir), entry }, DEFAULT_PORT, 2500);
      }
      return await httpJson('GET', '/__vc_api/status', null, DEFAULT_PORT, 1500);
    }
  } catch (_) {}

  const spawnArgs = [SERVER_SCRIPT, '--port', String(DEFAULT_PORT)];
  if (targetDir && fs.existsSync(path.resolve(targetDir))) {
    spawnArgs.push('--target', path.resolve(targetDir), '--entry', entry || 'index.html');
  }
  const child = spawn(process.execPath, spawnArgs, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();

  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 180));
    try {
      const st = await httpJson('GET', '/__vc_api/status', null, DEFAULT_PORT, 800);
      if (st && st.ok) return st;
    } catch (_) {}
  }
  return { ok: false, error: 'Timed out starting Vectora Canvas server on port ' + DEFAULT_PORT };
}

const TOOLS = [
  {
    name: 'open_project',
    description: 'Launch or switch Vectora Canvas to a target HTML/CSS/JS project folder and return its live Studio URL and Antigravity sidecar link.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Absolute path to the project directory.' },
        entry: { type: 'string', description: 'Entry HTML file relative to target (default: index.html).' }
      },
      required: ['target']
    }
  },
  {
    name: 'get_live_sync_state',
    description: 'Read real-time visual edits, active Famous Style tokens, inserted Famous Elements/Templates, and visual PNG notes made by the user in Vectora Canvas.',
    inputSchema: {
      type: 'object',
      properties: {
        acknowledge: { type: 'boolean', description: 'Mark pending live sync revisions as read by the coding agent.' }
      }
    }
  },
  {
    name: 'apply_famous_style',
    description: `Transform the active project UI into one of Vectora's Famous Design Styles (${designLib.FAMOUS_STYLES.map((s) => s.id).join(', ')}). Updates CSS & live canvas immediately.`,
    inputSchema: {
      type: 'object',
      properties: {
        styleId: {
          type: 'string',
          enum: designLib.FAMOUS_STYLES.map((s) => s.id),
          description: 'Famous Style identifier.'
        }
      },
      required: ['styleId']
    }
  },
  {
    name: 'open_temp_preview',
    description: 'Create and return a clean Temporary Live Verification Preview URL (/ __vc_temp/<token>/...) without editor overlays so the coding agent or user can verify live runtime behavior in a browser tab.',
    inputSchema: {
      type: 'object',
      properties: {
        entry: { type: 'string', description: 'HTML file to preview (default: active entry).' },
        ttlMinutes: { type: 'number', description: 'Auto-expiry in minutes (default: 30).' },
        openBrowser: { type: 'boolean', description: 'Open in system browser tab immediately (default: false).' }
      }
    }
  }
];

async function handleToolCall(name, args = {}) {
  if (name === 'open_project') {
    const st = await ensureServerRunning(args.target, args.entry || 'index.html');
    return {
      studioUrl: `http://127.0.0.1:${DEFAULT_PORT}/`,
      sidecarPill: '[Vectora Canvas](sidecar://vectora-canvas/studio/)',
      status: st
    };
  }

  if (name === 'get_live_sync_state') {
    let liveSync = {};
    let notes = {};
    try {
      if (fs.existsSync(LIVE_SYNC_FILE)) liveSync = JSON.parse(fs.readFileSync(LIVE_SYNC_FILE, 'utf8'));
    } catch (_) {}
    try {
      if (fs.existsSync(NOTES_FILE)) notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
    } catch (_) {}
    if (args.acknowledge && liveSync && Array.isArray(liveSync.pendingEvents)) {
      liveSync.pendingEvents = [];
      liveSync.lastAckAt = new Date().toISOString();
      try {
        fs.writeFileSync(LIVE_SYNC_FILE, JSON.stringify(liveSync, null, 2), 'utf8');
      } catch (_) {}
    }
    return { ok: true, liveSync, notes };
  }

  if (name === 'apply_famous_style') {
    await ensureServerRunning();
    const res = await httpJson('POST', '/__vc_api/apply-style', { styleId: args.styleId }, DEFAULT_PORT, 4500);
    return res;
  }

  if (name === 'open_temp_preview') {
    await ensureServerRunning();
    const res = await httpJson(
      'POST',
      '/__vc_api/temp-preview',
      {
        entry: args.entry || '',
        ttlMinutes: Number(args.ttlMinutes) || 30,
        openBrowser: Boolean(args.openBrowser)
      },
      DEFAULT_PORT,
      4000
    );
    return res;
  }

  throw new Error(`Unknown tool: ${name}`);
}

// Stdio MCP JSON-RPC framing (supports both newline-delimited JSON and Content-Length headers)
let useContentLength = false;
let recvBuf = Buffer.alloc(0);

function sendRpc(obj) {
  const json = JSON.stringify(obj);
  if (useContentLength) {
    const byteLen = Buffer.byteLength(json, 'utf8');
    process.stdout.write(`Content-Length: ${byteLen}\r\n\r\n${json}`);
  } else {
    process.stdout.write(`${json}\n`);
  }
}

async function dispatchRpc(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;

  if (method === 'notifications/initialized' || id === undefined) return;

  try {
    if (method === 'initialize') {
      sendRpc({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion || '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'vectora-canvas-mcp', version: '3.0.0' }
        }
      });
      return;
    }
    if (method === 'ping') {
      sendRpc({ jsonrpc: '2.0', id, result: {} });
      return;
    }
    if (method === 'tools/list') {
      sendRpc({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      return;
    }
    if (method === 'tools/call') {
      const data = await handleToolCall(params?.name, params?.arguments || {});
      sendRpc({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
        }
      });
      return;
    }
    sendRpc({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    });
  } catch (err) {
    sendRpc({
      jsonrpc: '2.0',
      id,
      result: {
        isError: true,
        content: [{ type: 'text', text: String(err?.message || err) }]
      }
    });
  }
}

process.stdin.on('data', (chunk) => {
  recvBuf = Buffer.concat([recvBuf, chunk]);
  while (recvBuf.length > 0) {
    const headPreview = recvBuf.subarray(0, Math.min(64, recvBuf.length)).toString('utf8');
    if (/^Content-Length:/i.test(headPreview)) {
      useContentLength = true;
      const sepIdx = recvBuf.indexOf('\r\n\r\n');
      if (sepIdx === -1) break;
      const headerStr = recvBuf.subarray(0, sepIdx).toString('utf8');
      const m = /Content-Length:\s*(\d+)/i.exec(headerStr);
      const len = m ? parseInt(m[1], 10) : 0;
      const totalNeeded = sepIdx + 4 + len;
      if (recvBuf.length < totalNeeded) break;
      const bodyStr = recvBuf.subarray(sepIdx + 4, totalNeeded).toString('utf8');
      recvBuf = recvBuf.subarray(totalNeeded);
      try {
        dispatchRpc(JSON.parse(bodyStr));
      } catch (_) {}
    } else {
      const nlIdx = recvBuf.indexOf('\n');
      if (nlIdx === -1) break;
      const line = recvBuf.subarray(0, nlIdx).toString('utf8').trim();
      recvBuf = recvBuf.subarray(nlIdx + 1);
      if (!line) continue;
      try {
        dispatchRpc(JSON.parse(line));
      } catch (_) {}
    }
  }
});
