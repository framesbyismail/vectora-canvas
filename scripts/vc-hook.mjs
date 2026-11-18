#!/usr/bin/env node
/**
 * Vectora Canvas — Real-Time Agent Lifecycle Hook (vc-hook.mjs)
 * Runs in <15ms on PreInvocation & PostToolUse so Vectora Canvas and the Coding Agent stay 100% synced in real time ("sathe sathe"):
 *  - PreInvocation: If the user edited elements, applied a Famous Style, inserted a Famous Element/Template, or clicked Save in Vectora Canvas,
 *    automatically injects a concise structured delta into the Coding Agent's context and marks those events delivered.
 *  - PostToolUse: When the Coding Agent edits/writes an HTML/CSS/JS file, immediately pings Vectora Canvas (/ __vc_api/fs-notify)
 *    so the live preview hot-updates with zero manual refresh!
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..');
const LIVE_SYNC_FILE = path.join(SKILL_ROOT, 'memory', 'live-agent-sync.json');

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function pingVectoraFsNotify(filePath) {
  return new Promise((resolve) => {
    const body = Buffer.from(JSON.stringify({ filePath: String(filePath || '') }), 'utf8');
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(process.env.VECTORA_PORT || 4680),
        path: '/__vc_api/fs-notify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
      }
    );
    req.setTimeout(120, () => {
      req.destroy();
      resolve();
    });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function main() {
  const input = readStdinJson();
  const event = input.hookEventName || process.argv[2] || '';

  if (event === 'PostToolUse') {
    const args = input.toolCall?.args || {};
    const editedPath = args.Path || args.TargetFile || args.file_path || '';
    if (editedPath && /\.(html?|css|m?js)$/i.test(String(editedPath))) {
      await pingVectoraFsNotify(editedPath);
    }
    process.stdout.write('{}\n');
    return;
  }

  if (event === 'PreInvocation') {
    try {
      if (fs.existsSync(LIVE_SYNC_FILE)) {
        const sync = JSON.parse(fs.readFileSync(LIVE_SYNC_FILE, 'utf8'));
        const pending = Array.isArray(sync.pendingEvents) ? sync.pendingEvents : [];
        if (pending.length > 0) {
          const lines = [
            `[VECTORA CANVAS LIVE SYNC — REAL-TIME USER DESIGN UPDATES]`,
            `Target Project: ${sync.targetProject || 'active workspace'} (${sync.entry || 'index.html'})`
          ];
          if (sync.activeFamousStyle) {
            lines.push(
              `Active Famous Style: ${sync.activeFamousStyle.styleName} (${sync.activeFamousStyle.styleId}) — ${sync.activeFamousStyle.directive || ''}`
            );
          }
          for (const ev of pending.slice(-8)) {
            lines.push(`- [${ev.kind}] ${ev.summary}`);
          }
          lines.push(
            `Note: Direct HTML/CSS file updates have already been written by Vectora Canvas. Keep all new or edited components, JS state, and secondary pages 100% consistent with these live changes and Figma/Illustrator scene-graph authoring rules.`
          );

          sync.pendingEvents = [];
          sync.lastDeliveredToAgentAt = new Date().toISOString();
          fs.writeFileSync(LIVE_SYNC_FILE, JSON.stringify(sync, null, 2), 'utf8');

          process.stdout.write(
            JSON.stringify({
              injectSteps: [
                {
                  systemMessage: {
                    systemMessage: lines.join('\n')
                  }
                }
              ]
            }) + '\n'
          );
          return;
        }
      }
    } catch (_) {}
    process.stdout.write('{}\n');
    return;
  }

  process.stdout.write('{}\n');
}

main();
