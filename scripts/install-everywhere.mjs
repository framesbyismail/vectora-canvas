#!/usr/bin/env node
/**
 * Vectora Canvas — Universal Cross-Agent Skill, Always-On Rule, Sidecar, Hook & MCP Installer
 * Installs Vectora Canvas cleanly across:
 *   1. Google Antigravity (~/.gemini/config/plugins/vectora-canvas + ~/.gemini/config/sidecars/vectora-canvas + ~/.gemini/config/skills/vectora-canvas + ~/.gemini/config/AGENTS.md)
 *   2. Claude Code (~/.claude/skills/vectora-canvas + ~/.claude/CLAUDE.md marker block)
 *   3. OpenAI Codex (~/.codex/skills/vectora-canvas + ~/.codex/AGENTS.md marker block)
 *   4. Cursor (~/.cursor/rules/vectora-canvas.mdc if ~/.cursor exists)
 *   5. OpenCode (~/.config/opencode/skill/vectora-canvas if ~/.config/opencode exists)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const home = os.homedir();

const RULE_START = '<!-- VECTORA_CANVAS_RULES_START -->';
const RULE_END = '<!-- VECTORA_CANVAS_RULES_END -->';

function copyFileSafe(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function upsertMarkedRuleBlock(targetFile, ruleBody) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  const wrapped = `${RULE_START}\n${ruleBody.trim()}\n${RULE_END}\n`;
  if (!fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, wrapped, 'utf8');
    return;
  }
  const cur = fs.readFileSync(targetFile, 'utf8');
  const startIdx = cur.indexOf(RULE_START);
  const endIdx = cur.indexOf(RULE_END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const next = cur.slice(0, startIdx) + wrapped + cur.slice(endIdx + RULE_END.length).replace(/^\r?\n/, '');
    fs.writeFileSync(targetFile, next, 'utf8');
    return;
  }
  // If the entire file is already a Vectora Canvas AGENTS.md, replace cleanly
  if (cur.includes('# Vectora Canvas —')) {
    fs.writeFileSync(targetFile, ruleBody.trim() + '\n', 'utf8');
    return;
  }
  fs.writeFileSync(targetFile, cur.replace(/\s*$/, '\n\n') + wrapped, 'utf8');
}

function installAll() {
  const skillSrc = path.join(SKILL_ROOT, 'SKILL.md');
  const agentsSrc = path.join(SKILL_ROOT, 'AGENTS.md');
  const rulesText = fs.readFileSync(agentsSrc, 'utf8');
  const installed = [];

  // 1. Google Antigravity Plugin + Sidecar + Global Skill + Global Rules
  const agyConfig = path.join(home, '.gemini', 'config');
  const agyPluginDir = path.join(agyConfig, 'plugins', 'vectora-canvas');
  fs.mkdirSync(agyPluginDir, { recursive: true });

  const pluginJson = {
    name: 'vectora-canvas',
    displayName: 'Vectora Canvas',
    version: '3.0.0',
    description:
      'Figma & Adobe Illustrator Scene-Graph HTML/CSS/JS Visual Studio, Famous Styles & Premade UI Library, Temporary Live Verification Preview, and Real-Time Two-Way Coding Agent Sync.',
    homepage: 'https://vectora-canvas.pages.dev',
    repository: 'https://github.com/framesbyismail/vectora-canvas'
  };
  fs.writeFileSync(path.join(agyPluginDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2) + '\n', 'utf8');

  copyFileSafe(agentsSrc, path.join(agyPluginDir, 'rules', 'AGENTS.md'));
  copyFileSafe(skillSrc, path.join(agyPluginDir, 'skills', 'vectora-canvas', 'SKILL.md'));

  // MCP Server inside Antigravity plugin
  const mcpConfig = {
    mcpServers: {
      vectora_canvas_mcp: {
        command: 'node',
        args: [`${SKILL_ROOT}/scripts/mcp-server.mjs`]
      }
    }
  };
  fs.writeFileSync(path.join(agyPluginDir, 'mcp_config.json'), JSON.stringify(mcpConfig, null, 2) + '\n', 'utf8');

  // Real-Time Lifecycle Hooks inside Antigravity plugin
  const hooksConfig = {
    'vectora-live-sync': {
      PreInvocation: [
        {
          type: 'command',
          command: `node "${SKILL_ROOT}/scripts/vc-hook.mjs" PreInvocation`,
          timeout: 5
        }
      ],
      PostToolUse: [
        {
          matcher: 'write_file|edit_file',
          hooks: [
            {
              type: 'command',
              command: `node "${SKILL_ROOT}/scripts/vc-hook.mjs" PostToolUse`,
              timeout: 5
            }
          ]
        }
      ]
    }
  };
  fs.writeFileSync(path.join(agyPluginDir, 'hooks.json'), JSON.stringify(hooksConfig, null, 2) + '\n', 'utf8');

  // Sidecar definition (both standalone sidecar://vectora-canvas/ and plugin sidecar)
  const sidecarDef = {
    command: 'node',
    args: [`${SKILL_ROOT}/scripts/server.mjs`],
    restart_policy: 'always',
    display_name: 'Vectora Canvas',
    description: 'Interactive Figma & Illustrator Visual HTML/CSS/JS Studio with Real-Time Coding Agent Sync',
    has_web_ui: true,
    ui_config: {
      display_name: 'Vectora Canvas',
      views: [
        {
          title: 'Vectora Canvas',
          path: '/',
          entrypoint: 'SIDECAR_UI_ENTRYPOINT_AUX_PANE'
        }
      ]
    }
  };
  const sidecarJsonStr = JSON.stringify(sidecarDef, null, 2) + '\n';
  fs.mkdirSync(path.join(agyPluginDir, 'sidecars', 'studio'), { recursive: true });
  fs.writeFileSync(path.join(agyPluginDir, 'sidecars', 'studio', 'sidecar.json'), sidecarJsonStr, 'utf8');
  fs.writeFileSync(path.join(SKILL_ROOT, 'sidecar', 'sidecar.json'), sidecarJsonStr, 'utf8');

  // Global Antigravity skill + AGENTS.md
  copyFileSafe(skillSrc, path.join(agyConfig, 'skills', 'vectora-canvas', 'SKILL.md'));
  upsertMarkedRuleBlock(path.join(agyConfig, 'AGENTS.md'), rulesText);
  installed.push(`Antigravity Plugin + Sidecar + MCP + Live Hooks (${agyPluginDir})`);

  // 2. Claude Code (~/.claude)
  const claudeDir = path.join(home, '.claude');
  if (fs.existsSync(claudeDir)) {
    copyFileSafe(skillSrc, path.join(claudeDir, 'skills', 'vectora-canvas', 'SKILL.md'));
    copyFileSafe(agentsSrc, path.join(claudeDir, 'skills', 'vectora-canvas', 'AGENTS.md'));
    upsertMarkedRuleBlock(path.join(claudeDir, 'CLAUDE.md'), rulesText);
    installed.push(`Claude Code Skill + Global CLAUDE.md (${claudeDir})`);
  }

  // 3. OpenAI Codex (~/.codex)
  const codexDir = path.join(home, '.codex');
  if (fs.existsSync(codexDir)) {
    copyFileSafe(skillSrc, path.join(codexDir, 'skills', 'vectora-canvas', 'SKILL.md'));
    copyFileSafe(agentsSrc, path.join(codexDir, 'skills', 'vectora-canvas', 'AGENTS.md'));
    upsertMarkedRuleBlock(path.join(codexDir, 'AGENTS.md'), rulesText);
    installed.push(`OpenAI Codex Skill + Global AGENTS.md (${codexDir})`);
  }

  // 4. Cursor (~/.cursor)
  const cursorDir = path.join(home, '.cursor');
  if (fs.existsSync(cursorDir)) {
    const mdc = `---\ndescription: Vectora Canvas Always-On Figma & Illustrator UI Scene-Graph Authoring Rules\nglobs: **/*.{html,css,js,jsx,ts,tsx,vue,svelte}\nalwaysApply: true\n---\n\n${rulesText}\n`;
    fs.mkdirSync(path.join(cursorDir, 'rules'), { recursive: true });
    fs.writeFileSync(path.join(cursorDir, 'rules', 'vectora-canvas.mdc'), mdc, 'utf8');
    installed.push(`Cursor Always-On Rule (${path.join(cursorDir, 'rules', 'vectora-canvas.mdc')})`);
  }

  // 5. OpenCode (~/.config/opencode)
  const openCodeDir = path.join(home, '.config', 'opencode');
  if (fs.existsSync(openCodeDir)) {
    copyFileSafe(skillSrc, path.join(openCodeDir, 'skill', 'vectora-canvas', 'SKILL.md'));
    upsertMarkedRuleBlock(path.join(openCodeDir, 'AGENTS.md'), rulesText);
    installed.push(`OpenCode Skill + Global Rules (${openCodeDir})`);
  }

  console.log('[Vectora Canvas] Universal Install Complete:');
  for (const line of installed) {
    console.log('  ✓ ' + line);
  }
}

installAll();
