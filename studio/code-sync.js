/**
 * Vectora Canvas — Universal Multi-File Code Sync, Standalone Compiler & ZIP Exporter (code-sync.js)
 * Zero external dependencies. Runs identically in Browser (window.VectoraCodeSync) and Node.js (CommonJS require).
 * Keeps whole-folder HTML, CSS, and JavaScript files automatically synchronized with canvas edits.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VectoraCodeSync = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const LEGACY_OVERRIDE_RE = /\s*<link[^>]*href=["'](?:\.\/)?html-edit-overrides\.css["'][^>]*>\s*/gi;
  const VECTORA_SYNC_STYLE_RE = /\s*<style[^>]*id=["']vectora-sync-styles["'][^>]*>[\s\S]*?<\/style>\s*/gi;
  const VECTORA_GFONT_LINK_RE = /\s*<link[^>]*data-vc-gfont=["'][^"']*["'][^>]*>\s*/gi;
  const VECTORA_BLOCK_RE = /\n?\/\* === VECTORA CANVAS SYNC START === \*\/[\s\S]*?\/\* === VECTORA CANVAS SYNC END === \*\/\n?/g;

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function camelToKebab(prop) {
    if (String(prop).startsWith('--')) return String(prop);
    return String(prop).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  }

  function normalizeRelPath(p) {
    return String(p || '')
      .replace(/\\/g, '/')
      .replace(/^(?:\.\/)+/, '')
      .replace(/^\/+/, '')
      .trim();
  }

  function resolveRelativeAssetPath(fromEntry, relHref) {
    if (!relHref || /^(?:https?:|data:|blob:|mailto:|tel:|#|javascript:|\/__vc_)/i.test(relHref)) {
      return null;
    }
    const cleanHref = relHref.split('#')[0].split('?')[0];
    if (!cleanHref) return null;
    if (cleanHref.startsWith('/')) {
      return normalizeRelPath(cleanHref);
    }
    const baseParts = normalizeRelPath(fromEntry || 'index.html').split('/');
    baseParts.pop(); // dirname
    for (const seg of cleanHref.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') baseParts.pop();
      else baseParts.push(seg);
    }
    return baseParts.join('/');
  }

  function parseStyleMap(styleStr) {
    const map = new Map();
    if (!styleStr) return map;
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

  function mergeAttrsIntoOpenTag(openTagHtml, attrsObj) {
    let out = openTagHtml;
    for (const [rawName, rawVal] of Object.entries(attrsObj || {})) {
      const attrName = String(rawName || '').trim();
      if (!attrName || attrName.toLowerCase() === 'style') continue;
      const attrRe = new RegExp(`\\s+${escapeRegExp(attrName)}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'>]+))?`, 'ig');
      if (rawVal === null || rawVal === undefined || String(rawVal) === '') {
        out = out.replace(attrRe, '');
      } else {
        const safeVal = String(rawVal).replace(/"/g, '&quot;');
        if (attrRe.test(out)) {
          attrRe.lastIndex = 0;
          out = out.replace(attrRe, ` ${attrName}="${safeVal}"`);
        } else {
          out = out.replace(/(\s*\/?)>$/, ` ${attrName}="${safeVal}"$1>`);
        }
      }
    }
    return out;
  }

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
    const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
    let out = html;
    let lastStart = Infinity;
    for (const ed of sorted) {
      if (ed.end > lastStart) continue;
      out = out.slice(0, ed.start) + ed.replacement + out.slice(ed.end);
      lastStart = ed.start;
    }
    return out;
  }

  /**
   * Patches a single HTML string using bridge save payload; returns { html, extraCssRules, summary }.
   */
  function patchSingleHtmlString(baseHtml, payload = {}, options = {}) {
    const embedCssInline = options.embedCssInline !== false;
    let htmlContent = String(baseHtml || '')
      .replace(LEGACY_OVERRIDE_RE, '\n')
      .replace(VECTORA_SYNC_STYLE_RE, '\n')
      .replace(VECTORA_GFONT_LINK_RE, '\n');

    if (payload.replaceBodyHtml && typeof payload.replaceBodyHtml === 'string') {
      const bodyMatch = /(<body\b[^>]*>)([\s\S]*?)(<\/body\s*>)/i.exec(htmlContent);
      if (bodyMatch) {
        const trailingScripts = [];
        const scriptRe = /<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>\s*<\/script>/gi;
        let sm;
        while ((sm = scriptRe.exec(bodyMatch[2])) !== null) {
          if (!/data-vc-bridge/i.test(sm[0])) trailingScripts.push('  ' + sm[0].trim());
        }
        const preservedScripts = trailingScripts.length ? '\n' + trailingScripts.join('\n') + '\n' : '\n';
        htmlContent =
          htmlContent.slice(0, bodyMatch.index) +
          bodyMatch[1] +
          '\n' +
          payload.replaceBodyHtml.trim() +
          preservedScripts +
          bodyMatch[3] +
          htmlContent.slice(bodyMatch.index + bodyMatch[0].length);
      }
    }

    const deletedTargets = Array.isArray(payload.deletedTargets) ? payload.deletedTargets : [];
    const fallbackDynamicRules = [];
    const syncedCssRules = [];

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

    const stylePatches = Array.isArray(payload.stylePatches) ? payload.stylePatches : [];
    if (stylePatches.length) {
      const treeS = parseStaticHtmlTree(htmlContent);
      const styleEdits = [];
      for (const sp of stylePatches) {
        if (!sp || !sp.props || typeof sp.props !== 'object') continue;
        const entries = Object.entries(sp.props).filter(([, v]) => v !== undefined);
        if (!entries.length) continue;
        const decls = entries
          .filter(([, v]) => v !== null && String(v).trim() !== '')
          .map(([k, v]) => `  ${camelToKebab(k)}: ${String(v).trim()};`);
        const selKey = sp.id ? `#${sp.id}` : sp.selector;
        if (selKey && decls.length) {
          syncedCssRules.push(`${selKey} {\n${decls.join('\n')}\n}`);
        }
        const node = findNodeInTree(treeS, sp.id, sp.selector);
        if (node) {
          const openTagHtml = htmlContent.slice(node.start, node.openEnd);
          const updatedOpenTag = mergeStyleIntoOpenTag(openTagHtml, sp.props);
          if (updatedOpenTag !== openTagHtml) {
            styleEdits.push({ start: node.start, end: node.openEnd, replacement: updatedOpenTag });
          }
        } else if (sp.selector) {
          const impDecls = entries
            .filter(([, v]) => v !== null && String(v).trim() !== '')
            .map(([k, v]) => `  ${camelToKebab(k)}: ${String(v).trim()} !important;`);
          if (impDecls.length) {
            fallbackDynamicRules.push(`${sp.selector} {\n${impDecls.join('\n')}\n}`);
          }
        }
      }
      if (styleEdits.length) {
        htmlContent = applySurgicalReplacements(htmlContent, styleEdits);
      }
    }

    const attrPatches = Array.isArray(payload.attrPatches) ? payload.attrPatches : [];
    if (attrPatches.length) {
      const treeA = parseStaticHtmlTree(htmlContent);
      const attrEdits = [];
      for (const ap of attrPatches) {
        if (!ap || !ap.attrs || typeof ap.attrs !== 'object') continue;
        const node = findNodeInTree(treeA, ap.id, ap.selector);
        if (node) {
          const openTagHtml = htmlContent.slice(node.start, node.openEnd);
          const updatedOpenTag = mergeAttrsIntoOpenTag(openTagHtml, ap.attrs);
          if (updatedOpenTag !== openTagHtml) {
            attrEdits.push({ start: node.start, end: node.openEnd, replacement: updatedOpenTag });
          }
        }
      }
      if (attrEdits.length) {
        htmlContent = applySurgicalReplacements(htmlContent, attrEdits);
      }
    }

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

    const extraCssBlocks = [];
    if (payload.libraryBaseCss && String(payload.libraryBaseCss).trim()) {
      extraCssBlocks.push(String(payload.libraryBaseCss).trim());
    }
    if (payload.famousStyleCss && String(payload.famousStyleCss).trim()) {
      extraCssBlocks.push(String(payload.famousStyleCss).trim());
    }
    if (payload.themeCss && String(payload.themeCss).trim()) {
      extraCssBlocks.push(String(payload.themeCss).trim());
    }
    if (fallbackDynamicRules.length) {
      extraCssBlocks.push(fallbackDynamicRules.join('\n'));
    }

    if (embedCssInline && extraCssBlocks.length) {
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

    return {
      html: htmlContent,
      extraCssBlocks,
      syncedCssRules,
      hasChanges: Boolean(
        payload.replaceBodyHtml ||
        deletedTargets.length ||
        textPatches.length ||
        stylePatches.length ||
        attrPatches.length ||
        insertedNodes.length ||
        googleFonts.length ||
        (payload.libraryBaseCss && String(payload.libraryBaseCss).trim()) ||
        (payload.famousStyleCss && String(payload.famousStyleCss).trim()) ||
        (payload.themeCss && String(payload.themeCss).trim())
      ),
      counts: {
        stylePatchesApplied: stylePatches.length,
        textPatchesApplied: textPatches.length,
        attrPatchesApplied: attrPatches.length,
        insertedNodesApplied: insertedNodes.length,
        deletedNodesApplied: deletedTargets.length,
        googleFontsApplied: googleFonts.length
      }
    };
  }

  function findLinkedProjectFile(entry, htmlText, filesMap, extRegex) {
    const keys = Object.keys(filesMap || {}).filter((k) => extRegex.test(k) && !/\.min\.(?:css|js)$/i.test(k));
    if (!keys.length) return '';
    const hrefRe = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = hrefRe.exec(htmlText || '')) !== null) {
      const resolved = resolveRelativeAssetPath(entry, m[1]);
      if (resolved && keys.includes(resolved)) return resolved;
    }
    return keys[0];
  }

  /**
   * Synchronizes canvas edits across HTML, CSS, and JavaScript files in a whole-folder project!
   */
  function applyCanvasPayloadToProject({ entry, filesMap, originFilesMap, payload = {}, projectMeta = {} }) {
    const relEntry = normalizeRelPath(entry || 'index.html');
    const outFiles = { ...(filesMap || {}) };
    const origins = originFilesMap || filesMap || {};
    const baseHtml = origins[relEntry] ?? outFiles[relEntry] ?? '';

    const targetCssFile = findLinkedProjectFile(relEntry, baseHtml, outFiles, /\.css$/i);
    const targetJsFile = findLinkedProjectFile(relEntry, baseHtml, outFiles, /\.m?js$/i);

    // If a dedicated .css file exists in the folder, sync theme/palette & rules into that .css file AND keep HTML clean!
    const patched = patchSingleHtmlString(baseHtml, payload, {
      embedCssInline: !targetCssFile
    });
    outFiles[relEntry] = patched.html;
    const modifiedFiles = [relEntry];

    if (targetCssFile && outFiles[targetCssFile] !== undefined) {
      const baseCss = String(origins[targetCssFile] ?? outFiles[targetCssFile] ?? '').replace(VECTORA_BLOCK_RE, '');
      const cssSyncParts = [...patched.extraCssBlocks, ...patched.syncedCssRules].filter(Boolean);
      if (cssSyncParts.length) {
        outFiles[targetCssFile] =
          baseCss.replace(/\s*$/, '\n\n') +
          `/* === VECTORA CANVAS SYNC START === */\n` +
          cssSyncParts.join('\n\n') +
          `\n/* === VECTORA CANVAS SYNC END === */\n`;
      } else {
        outFiles[targetCssFile] = baseCss;
      }
      modifiedFiles.push(targetCssFile);
    }

    if (targetJsFile && outFiles[targetJsFile] !== undefined) {
      const baseJs = String(origins[targetJsFile] ?? outFiles[targetJsFile] ?? '').replace(VECTORA_BLOCK_RE, '');
      if (patched.hasChanges) {
        const elementSyncMap = {};
        for (const sp of Array.isArray(payload.stylePatches) ? payload.stylePatches : []) {
          const key = sp.id ? `#${sp.id}` : sp.selector;
          if (!key || !sp.props) continue;
          elementSyncMap[key] = { ...(elementSyncMap[key] || {}), styles: sp.props };
        }
        for (const tp of Array.isArray(payload.textPatches) ? payload.textPatches : []) {
          const key = tp.id ? `#${tp.id}` : tp.selector;
          if (!key || typeof tp.after !== 'string') continue;
          elementSyncMap[key] = { ...(elementSyncMap[key] || {}), text: tp.after };
        }
        for (const ap of Array.isArray(payload.attrPatches) ? payload.attrPatches : []) {
          const key = ap.id ? `#${ap.id}` : ap.selector;
          if (!key || !ap.attrs) continue;
          elementSyncMap[key] = { ...(elementSyncMap[key] || {}), attrs: ap.attrs };
        }
        const syncManifest = {
          entry: relEntry,
          artboard: projectMeta.artboard || { width: 1920, height: 1080 },
          palette: {
            primary: payload.primaryColor || '',
            secondary: payload.secondaryColor || '',
            preset: payload.preset || 'original'
          },
          famousStyle: payload.famousStyle || null,
          templateId: payload.templateId || '',
          elements: elementSyncMap,
          counts: patched.counts
        };
        outFiles[targetJsFile] =
          baseJs.replace(/\s*$/, '\n\n') +
          `/* === VECTORA CANVAS SYNC START === */\n` +
          `globalThis.__VECTORA_DESIGN__ = ${JSON.stringify(syncManifest, null, 2)};\n` +
          `/* === VECTORA CANVAS SYNC END === */\n`;
      } else {
        outFiles[targetJsFile] = baseJs;
      }
      modifiedFiles.push(targetJsFile);
    }

    return {
      filesMap: outFiles,
      modifiedFiles,
      targetCssFile,
      targetJsFile,
      hasChanges: patched.hasChanges,
      counts: patched.counts
    };
  }

  function rewriteCssAssetUrls(cssText, fromFile, assetUrls) {
    if (!cssText || !assetUrls || !Object.keys(assetUrls).length) return cssText;
    return String(cssText).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, q, rawUrl) => {
      const resolved = resolveRelativeAssetPath(fromFile, rawUrl.trim());
      if (resolved && assetUrls[resolved]) {
        return `url("${assetUrls[resolved]}")`;
      }
      return full;
    });
  }

  /**
   * Compiles a multi-file folder project (HTML + CSS + JS + Blob assets) into an executable document
   * for standalone preview (with bridge.js) OR clean full-page Publish in a new tab (without bridge.js).
   */
  function compileStandaloneHtml({
    entry,
    filesMap = {},
    assetUrls = {},
    studioBaseUrl = '',
    includeBridge = false,
    bypassEnabled = true,
    accelMode = 'gpu'
  }) {
    const relEntry = normalizeRelPath(entry || 'index.html');
    let html = String(filesMap[relEntry] ?? Object.values(filesMap)[0] ?? '<!doctype html><html><body></body></html>');
    const inlinedJsSet = new Set();

    // 1. Inline project <link rel="stylesheet" href="..."> from filesMap (rewriting CSS url() assets)
    html = html.replace(/<link\b([^>]*?)>/gi, (fullTag, attrs) => {
      if (!/\brel\s*=\s*["']?stylesheet["']?/i.test(attrs)) return fullTag;
      const hm = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
      if (!hm) return fullTag;
      const href = hm[1] ?? hm[2] ?? hm[3] ?? '';
      const resolved = resolveRelativeAssetPath(relEntry, href);
      if (resolved && filesMap[resolved] !== undefined) {
        const cssBody = rewriteCssAssetUrls(filesMap[resolved], resolved, assetUrls);
        return `<style data-vc-vfs-css="${resolved}">\n${cssBody}\n</style>`;
      }
      return fullTag;
    });

    // 2. Rewrite relative image/media src="..." and inline <style> url(...) against assetUrls
    if (assetUrls && Object.keys(assetUrls).length) {
      html = html.replace(/\b(src|poster)\s*=\s*(["'])([^"']+)\2/gi, (full, attr, q, val) => {
        const resolved = resolveRelativeAssetPath(relEntry, val);
        if (resolved && assetUrls[resolved]) {
          return `${attr}=${q}${assetUrls[resolved]}${q}`;
        }
        return full;
      });
    }

    // 3. Inline project <script src="..."></script> from filesMap (preserving defer & escaping </script)
    html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (fullTag, attrs) => {
      const sm = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
      if (!sm) return fullTag;
      const srcVal = sm[1] ?? sm[2] ?? sm[3] ?? '';
      const resolved = resolveRelativeAssetPath(relEntry, srcVal);
      if (resolved && filesMap[resolved] !== undefined) {
        inlinedJsSet.add(resolved);
        const isMod = /\btype\s*=\s*["']?module["']?/i.test(attrs);
        const isDefer = !isMod && /\bdefer\b/i.test(attrs);
        const safeJs = String(filesMap[resolved]).replace(/<\/script/gi, '<\\/script');
        const wrappedJs = isDefer
          ? `(function(){var __vcRun=function(){\n${safeJs}\n};if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',__vcRun,{once:true});}else{__vcRun();}})();`
          : safeJs;
        return `<script${isMod ? ' type="module"' : ''} data-vc-vfs-js="${resolved}">\n${wrappedJs}\n</script>`;
      }
      return fullTag;
    });

    // 4. Build VFS Runtime Dictionary for dynamic <script src="video.js">, relative fetch(), & local button/page links
    const allPages = Object.keys(filesMap).filter((k) => /\.html?$/i.test(k));
    const runtimeTextFiles = {};
    for (const [k, content] of Object.entries(filesMap)) {
      if (/\.html?$/i.test(k)) {
        if (!includeBridge && k !== relEntry) runtimeTextFiles[k] = content;
        continue;
      }
      if (!inlinedJsSet.has(k)) {
        runtimeTextFiles[k] = content;
      }
    }
    const safeVfsJson = JSON.stringify({
      entry: relEntry,
      pages: allPages,
      files: runtimeTextFiles,
      assets: assetUrls || {},
      includeBridge: Boolean(includeBridge)
    }).replace(/<\/script/gi, '<\\/script');

    const vfsBootScript = `\n<script data-vc-bridge="true">
(function(){
  window.__VC_BYPASS_INIT__ = ${Boolean(bypassEnabled)};
  window.__VC_ACCEL_INIT__ = ${JSON.stringify(accelMode || 'gpu')};
  try { document.documentElement.setAttribute('data-vc-accel', window.__VC_ACCEL_INIT__); } catch(_) {}
  var VFS = window.__VC_VFS__ = ${safeVfsJson};
  var blobCache = {};
  function normPath(p) {
    return String(p || '').replace(/\\\\/g, '/').replace(/^(?:\\.\\/)+/, '').replace(/^\\/+/, '').trim();
  }
  function resolveRel(relHref) {
    if (!relHref || /^(?:https?:|data:|blob:|mailto:|tel:|javascript:|\\/__vc_)/i.test(relHref)) return null;
    var clean = String(relHref).split('#')[0].split('?')[0];
    if (!clean) return '';
    if (clean.charAt(0) === '/') return normPath(clean);
    var parts = normPath(VFS.entry || 'index.html').split('/');
    parts.pop();
    var segs = clean.split('/');
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (!s || s === '.') continue;
      if (s === '..') parts.pop(); else parts.push(s);
    }
    return parts.join('/');
  }
  function getVfsBlobUrl(resolved) {
    if (VFS.assets && VFS.assets[resolved]) return VFS.assets[resolved];
    if (blobCache[resolved]) return blobCache[resolved];
    if (VFS.files && Object.prototype.hasOwnProperty.call(VFS.files, resolved)) {
      var mime = /\\.m?js$/i.test(resolved) ? 'application/javascript' : /\\.css$/i.test(resolved) ? 'text/css' : /\\.json$/i.test(resolved) ? 'application/json' : /\\.svg$/i.test(resolved) ? 'image/svg+xml' : 'text/plain';
      blobCache[resolved] = URL.createObjectURL(new Blob([VFS.files[resolved]], { type: mime }));
      return blobCache[resolved];
    }
    return null;
  }
  function rewriteDynamicNode(node) {
    if (!node || node.nodeType !== 1 || node.hasAttribute('data-vc-bridge')) return;
    var tag = (node.tagName || '').toLowerCase();
    if (tag === 'script') {
      var rawSrc = node.getAttribute('src') || '';
      var res = resolveRel(rawSrc);
      if (res) {
        var bUrl = getVfsBlobUrl(res);
        if (bUrl && rawSrc !== bUrl) node.setAttribute('src', bUrl);
      }
    } else if (tag === 'img' || tag === 'video' || tag === 'audio' || tag === 'source') {
      var rawMedia = node.getAttribute('src') || '';
      var resM = resolveRel(rawMedia);
      if (resM && VFS.assets && VFS.assets[resM] && rawMedia !== VFS.assets[resM]) {
        node.setAttribute('src', VFS.assets[resM]);
      }
    } else if (tag === 'link' && /stylesheet/i.test(node.getAttribute('rel') || '')) {
      var rawHref = node.getAttribute('href') || '';
      var resCss = resolveRel(rawHref);
      if (resCss) {
        var cUrl = getVfsBlobUrl(resCss);
        if (cUrl && rawHref !== cUrl) node.setAttribute('href', cUrl);
      }
    }
  }
  try {
    var origAppend = Node.prototype.appendChild;
    Node.prototype.appendChild = function(ch) { rewriteDynamicNode(ch); return origAppend.call(this, ch); };
    var origInsert = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(ch, ref) { rewriteDynamicNode(ch); return origInsert.call(this, ch, ref); };
    var scriptSrcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (scriptSrcDesc && scriptSrcDesc.set) {
      Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get: scriptSrcDesc.get,
        set: function(val) {
          var res = resolveRel(val);
          var bUrl = res ? getVfsBlobUrl(res) : null;
          return scriptSrcDesc.set.call(this, bUrl || val);
        }
      });
    }
  } catch(_) {}
  if (typeof window.fetch === 'function') {
    var vfsOrigFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
      var u = typeof input === 'string' ? input : (input && input.url) || '';
      var res = resolveRel(u);
      if (res && VFS.files && Object.prototype.hasOwnProperty.call(VFS.files, res)) {
        var ct = /\\.json$/i.test(res) ? 'application/json' : /\\.m?js$/i.test(res) ? 'application/javascript' : 'text/plain';
        return Promise.resolve(new Response(VFS.files[res], { status: 200, headers: { 'Content-Type': ct } }));
      }
      return vfsOrigFetch(input, init);
    };
  }
  function findMatchingPage(rawTarget) {
    if (!rawTarget || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(rawTarget)) return null;
    var hashIdx = rawTarget.indexOf('#');
    var hashPart = hashIdx >= 0 ? rawTarget.slice(hashIdx) : '';
    var pathPart = (hashIdx >= 0 ? rawTarget.slice(0, hashIdx) : rawTarget).split('?')[0].trim();
    if (!pathPart) return hashPart ? { page: '', hash: hashPart } : null;
    var cand = resolveRel(pathPart);
    if (!cand) return null;
    var pages = VFS.pages || [];
    var exact = pages.find(function(p){ return p.toLowerCase() === cand.toLowerCase(); });
    if (!exact) {
      var withHtml = cand.replace(/\\/+$/, '') + '.html';
      exact = pages.find(function(p){ return p.toLowerCase() === withHtml.toLowerCase(); });
    }
    if (!exact) {
      var baseOnly = cand.split('/').pop().toLowerCase();
      exact = pages.find(function(p){ return p.split('/').pop().toLowerCase() === baseOnly || p.split('/').pop().toLowerCase() === baseOnly + '.html'; });
    }
    if (exact || /\\.html?$/i.test(cand)) {
      return { page: exact || cand, hash: hashPart };
    }
    return null;
  }
  function activateInPageHash(hashStr) {
    if (!hashStr || hashStr === '#') return false;
    var id = decodeURIComponent(hashStr.replace(/^#/, ''));
    var el = document.getElementById(id) || document.querySelector('[name="' + id.replace(/"/g, '') + '"]');
    if (!el) return false;
    var cur = el;
    while (cur && cur !== document.body) {
      if (cur.hidden) cur.hidden = false;
      if (cur.classList && cur.classList.contains('is-hidden')) cur.classList.remove('is-hidden');
      cur = cur.parentElement;
    }
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) { el.scrollIntoView(); }
    return true;
  }
  window.__vcNavigateLocal = function(rawTarget) {
    var match = findMatchingPage(rawTarget);
    if (!match) return false;
    if ((!match.page || match.page === VFS.entry) && match.hash) {
      return activateInPageHash(match.hash);
    }
    if (match.page) {
      if (window.parent && window.parent !== window && VFS.includeBridge) {
        window.parent.postMessage({ __vc: true, type: 'vc_vfs_navigate', href: match.page, hash: match.hash || '' }, '*');
        return true;
      }
      if (VFS.files && VFS.files[match.page]) {
        var nextBlob = URL.createObjectURL(new Blob([VFS.files[match.page]], { type: 'text/html;charset=utf-8' }));
        window.location.href = nextBlob + (match.hash || '');
        return true;
      }
    }
    return false;
  };
  var origWinOpen = window.open ? window.open.bind(window) : null;
  window.open = function(url, target, features) {
    if (url && window.__vcNavigateLocal(String(url))) return window;
    return origWinOpen ? origWinOpen(url, target, features) : null;
  };
  document.addEventListener('click', function(ev) {
    if (document.documentElement.classList.contains('__vc_edit_mode__')) return;
    var t = ev.target && ev.target.closest ? ev.target.closest('a[href], [data-vc-link], [data-href], [data-url], [data-page], button[formaction], [onclick]') : null;
    if (!t) return;
    var targetHref = t.getAttribute('data-vc-link') || t.getAttribute('href') || t.getAttribute('data-href') || t.getAttribute('data-url') || t.getAttribute('data-page') || t.getAttribute('formaction') || '';
    if (!targetHref && t.hasAttribute('onclick')) {
      var oc = t.getAttribute('onclick') || '';
      var m = /(?:location(?:\\.href)?\\s*=\\s*|location\\.(?:assign|replace)\\s*\\(\\s*|window\\.open\\s*\\(\\s*)(['"])([^'"]+)\\1/i.exec(oc);
      if (m) targetHref = m[2];
    }
    if (targetHref && window.__vcNavigateLocal(targetHref)) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('submit', function(ev) {
    if (document.documentElement.classList.contains('__vc_edit_mode__')) return;
    var form = ev.target;
    var act = form && form.getAttribute ? (form.getAttribute('action') || '') : '';
    if (act && window.__vcNavigateLocal(act)) {
      ev.preventDefault();
    }
  }, true);
})();
</script>\n`;

    if (includeBridge && studioBaseUrl) {
      const baseClean = studioBaseUrl.replace(/\/+$/, '');
      const preTag = `${vfsBootScript}<script src="${baseClean}/prebypass.js" data-vc-bridge="true"></script>\n`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}${preTag}`);
      } else {
        html = preTag + html;
      }
      const bridgeTag = `\n<script src="${baseClean}/bridge.js" data-vc-bridge="true"></script>\n`;
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${bridgeTag}</body>`);
      } else {
        html += bridgeTag;
      }
    } else {
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}${vfsBootScript}`);
      } else {
        html = vfsBootScript + html;
      }
    }

    return html;
  }

  /**
   * Starter Whole-Folder Project (index.html + about.html + styles.css + script.js)
   * Includes scrollable sections, CSS animation, interactive JS controls, and a live 3D WebGL viewport!
   */
  function createStarterProjectFiles(projectName = 'Vectora Studio Starter') {
    const safeTitle = String(projectName || 'Vectora Studio Starter').replace(/[<>&"]/g, '');
    const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header" id="headerSession" data-name="Site Header" data-vc-section="Site Header">
    <div class="brand-row" id="brandGroup" data-name="Brand Group">
      <span class="pulse-dot" id="livePulseDot" data-name="Live Status Dot"></span>
      <strong class="brand-title" id="brandTitle" data-name="Brand Title">${safeTitle}</strong>
    </div>
    <nav class="nav-links" id="mainNav" data-name="Navigation Bar" data-vc-section="Navigation">
      <a href="index.html" class="nav-link active" id="navOverview"><span class="vc-pt">Overview</span></a>
      <a href="about.html" class="nav-link" id="navSpecs"><span class="vc-pt">Specs &amp; Sessions</span></a>
      <button type="button" class="btn-secondary" id="btnSecondaryAction" data-vc-link="about.html" data-name="Preview Specs Button"><span class="vc-pt">Preview Specs</span></button>
      <button type="button" class="btn-primary" id="btnPrimaryCta" data-vc-link="#featuresSession" data-name="Launch Workspace CTA"><span class="vc-pt">Launch Workspace</span></button>
    </nav>
  </header>

  <main class="page-shell" id="pageShell" data-name="Main Page Shell">
    <section class="hero-section" id="heroSession" data-name="Hero Section" data-vc-section="Hero Section">
      <div class="hero-copy" id="heroCopyGroup" data-name="Hero Copy Group" data-vc-section="Hero Copy">
        <span class="eyebrow" id="heroEyebrow" data-name="Hero Eyebrow">DIRECT MULTI-FILE HTML · CSS · JS</span>
        <h1 id="heroHeading" data-name="Hero Headline">Design visually on the artboard. Keep every file in sync.</h1>
        <p class="subtitle" id="heroSubtitle" data-name="Hero Subtitle">Select, group, align, insert Flow Divs, apply Famous Styles, or switch to Live mode to test real scrolling, animations, and 3D WebGL scenes.</p>
        <div class="cta-row" id="heroActions" data-name="Hero Actions Row" data-vc-section="Hero Actions">
          <button type="button" class="btn-primary" id="btnHeroStart" data-name="Start Building CTA"><span class="vc-pt">Start Building</span></button>
          <button type="button" class="btn-secondary" id="btnCycleScene" data-name="Cycle 3D Camera Button"><span class="vc-pt">Cycle 3D Camera</span><span id="clickCounter" class="vc-pt" style="margin-left:6px;">0</span></button>
        </div>
      </div>
      <div class="viewport-card card" id="viewportCard" data-name="3D Viewport Card" data-vc-section="3D Stage">
        <div class="vp-bar" id="vpHeaderBar" data-name="Viewport Header">
          <span id="vpLabel" class="vc-pt">Interactive 3D WebGL Stage</span>
          <span class="vp-fps vc-pt" id="vpAngleBadge">Yaw 0°</span>
        </div>
        <canvas id="heroGlCanvas" width="560" height="320" data-name="3D WebGL Canvas"></canvas>
      </div>
    </section>

    <section class="features-section" id="featuresSession" data-name="Features Section" data-vc-section="Core Capabilities">
      <h2 class="subtitle" id="featuresTitle" data-name="Features Heading" style="width:fit-content;">Core Capabilities</h2>
      <div class="feature-grid" id="featureGrid" data-name="Features Card Grid" data-vc-section="Feature Grid">
        <article class="card feature-card" id="featCard1" data-name="Whole-Folder Sync Card" data-vc-section="Feature Card 1">
          <h3 id="featTitle1" style="width:fit-content;">Whole-Folder Live Sync</h3>
          <p id="featBody1">Edits immediately update HTML structure, CSS tokens, and Coding Agent state together.</p>
        </article>
        <article class="card feature-card" id="featCard2" data-name="Illustrator Precision Card" data-vc-section="Feature Card 2">
          <h3 id="featTitle2" style="width:fit-content;">Figma &amp; Illustrator Precision</h3>
          <p id="featBody2">Shift-click, Isolation Mode, vector SVG paint, magnetic rulers, and Famous Styles.</p>
        </article>
        <article class="card feature-card" id="featCard3" data-name="Snapshot vs Live Card" data-vc-section="Feature Card 3">
          <h3 id="featTitle3" style="width:fit-content;">Snapshot Edit &amp; Temp Preview</h3>
          <p id="featBody3">Freeze animations in Edit mode, or launch a Temporary Live Verification tab anytime.</p>
        </article>
      </div>
    </section>
  </main>

  <script src="script.js"></script>
</body>
</html>
`;

    const aboutHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} — Specs</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="site-header" id="aboutHeader">
    <div class="brand-row">
      <span class="pulse-dot"></span>
      <strong class="brand-title">${safeTitle}</strong>
    </div>
    <nav class="nav-links">
      <a href="index.html" class="nav-link">Overview</a>
      <a href="about.html" class="nav-link active">Specs &amp; Sessions</a>
    </nav>
  </header>
  <main class="page-shell">
    <section class="features-section" id="specsSession">
      <h1 id="specsHeading">Multi-Session Architecture</h1>
      <p class="subtitle">Every HTML page in your folder shares styles.css and script.js seamlessly.</p>
      <div class="feature-grid" id="specsGrid">
        <article class="card feature-card" id="specBox1">
          <h3>Session 01</h3>
          <p>Shared stylesheet tokens and responsive layout rules.</p>
        </article>
        <article class="card feature-card" id="specBox2">
          <h3>Session 02</h3>
          <p>Export the full project archive or publish directly to a clean tab.</p>
        </article>
      </div>
    </section>
  </main>
  <script src="script.js"></script>
</body>
</html>
`;

    const stylesCss = `:root {
  --primary: #f97316;
  --accent: #f97316;
  --secondary: #292524;
  --surface: #292524;
  --bg: #171615;
  --text: #f5f5f4;
  --muted: #a8a29e;
  --border: #44403c;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 56px;
  border-bottom: 1px solid var(--border);
  background: #1c1a18;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  animation: vcPulse 1.8s ease-in-out infinite;
}

@keyframes vcPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.45); opacity: 0.55; }
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 18px;
}

.nav-link {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.nav-link.active {
  color: var(--text);
}

.btn-primary {
  background: var(--primary);
  color: #141312;
  border: 1px solid var(--primary);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary {
  background: var(--secondary);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.page-shell {
  max-width: 1680px;
  margin: 0 auto;
  padding: 48px 56px 96px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero-section {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 40px;
  align-items: center;
}

.eyebrow {
  display: inline-block;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.hero-copy h1 {
  font-size: 46px;
  line-height: 1.12;
  margin: 0 0 16px;
}

.subtitle {
  color: var(--muted);
  font-size: 18px;
  margin: 0 0 24px;
}

.cta-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card {
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
}

.viewport-card {
  padding: 16px;
}

.vp-bar {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 10px;
}

#heroGlCanvas {
  width: 100%;
  height: 320px;
  display: block;
  border-radius: 10px;
  background: #121110;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.feature-card h3 {
  margin: 0 0 8px;
  font-size: 19px;
}

.feature-card p {
  margin: 0;
  color: var(--muted);
  font-size: 14.5px;
}
`;

    const scriptJs = `(function () {
  let count = 0;
  let yawDeg = 24;
  let pitchDeg = 16;
  let dragging = false;
  let lastX = 0;

  const btnCycle = document.getElementById('btnCycleScene');
  const counterEl = document.getElementById('clickCounter');
  const angleBadge = document.getElementById('vpAngleBadge');
  const canvas = document.getElementById('heroGlCanvas');

  if (btnCycle) {
    btnCycle.addEventListener('click', () => {
      count += 1;
      yawDeg = (yawDeg + 35) % 360;
      if (counterEl) counterEl.textContent = String(count);
    });
  }

  if (!canvas) return;
  const preferCpu = document.documentElement.getAttribute('data-vc-accel') === 'cpu';
  const gl = !preferCpu ? (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) : null;
  const ctx2d = !gl ? canvas.getContext('2d') : null;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yawDeg = (yawDeg + (e.clientX - lastX) * 0.6 + 360) % 360;
    lastX = e.clientX;
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  function renderFrame() {
    yawDeg = (yawDeg + 0.35) % 360;
    if (angleBadge) angleBadge.textContent = 'Yaw ' + Math.round(yawDeg) + '°';
    const t = (yawDeg * Math.PI) / 180;
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.08 + 0.04 * Math.sin(t), 0.07, 0.06, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else if (ctx2d) {
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.fillStyle = '#141312';
      ctx2d.fillRect(0, 0, w, h);
      ctx2d.strokeStyle = '#f97316';
      ctx2d.lineWidth = 2;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const rx = 96;
      const ry = 42;
      ctx2d.beginPath();
      for (let i = 0; i < 4; i++) {
        const a1 = t + (i * Math.PI) / 2;
        const a2 = t + ((i + 1) * Math.PI) / 2;
        const x1 = cx + Math.cos(a1) * rx;
        const y1 = cy - 42 + Math.sin(a1) * ry * 0.55;
        const x2 = cx + Math.cos(a2) * rx;
        const y2 = cy - 42 + Math.sin(a2) * ry * 0.55;
        ctx2d.moveTo(x1, y1);
        ctx2d.lineTo(x2, y2);
        ctx2d.moveTo(x1, y1 + 84);
        ctx2d.lineTo(x2, y2 + 84);
        ctx2d.moveTo(x1, y1);
        ctx2d.lineTo(x1, y1 + 84);
      }
      ctx2d.stroke();
    }
    requestAnimationFrame(renderFrame);
  }
  requestAnimationFrame(renderFrame);
})();
`;

    return {
      'index.html': indexHtml,
      'about.html': aboutHtml,
      'styles.css': stylesCss,
      'script.js': scriptJs
    };
  }

  function createSessionHtmlTemplate(fileName, projectName = 'Project', cssFiles = [], jsFiles = []) {
    const cleanName = normalizeRelPath(fileName || 'session.html').replace(/\.html?$/i, '');
    const title = cleanName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const cssLinks = cssFiles.length
      ? cssFiles.map((f) => `  <link rel="stylesheet" href="${f}">`).join('\n')
      : `  <style>\n    body { margin: 0; padding: 48px; background: #171615; color: #f5f5f4; font-family: system-ui, sans-serif; }\n    .card { background: #292524; border: 1px solid #44403c; border-radius: 12px; padding: 24px; }\n  </style>`;
    const jsTags = jsFiles.map((f) => `  <script src="${f}"></script>`).join('\n');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${projectName} — ${title}</title>
${cssLinks}
</head>
<body>
  <main class="page-shell" id="${cleanName.replace(/[^a-zA-Z0-9_-]/g, '')}Root">
    <section class="card" id="${cleanName.replace(/[^a-zA-Z0-9_-]/g, '')}Hero">
      <h1>${title}</h1>
      <p class="subtitle">New session ready for visual editing in Vectora Canvas.</p>
      <button type="button" class="btn-primary">Primary Action</button>
    </section>
  </main>
${jsTags}
</body>
</html>
`;
  }

  // =========================================================================
  // PURE-JS ZERO-DEPENDENCY PKZIP ARCHIVE BUILDER (FOR MULTI-FILE EXPORT)
  // =========================================================================
  const CRC_TABLE = (() => {
    const tbl = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      tbl[i] = c >>> 0;
    }
    return tbl;
  })();

  function crc32Bytes(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function stringToUtf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(String(str ?? ''));
    }
    return Uint8Array.from(Buffer.from(String(str ?? ''), 'utf8'));
  }

  function buildZipUint8Array(textFilesMap = {}, binaryFilesMap = {}) {
    const entries = [];
    for (const [rel, txt] of Object.entries(textFilesMap || {})) {
      const nameBytes = stringToUtf8Bytes(normalizeRelPath(rel));
      const dataBytes = stringToUtf8Bytes(txt);
      entries.push({ nameBytes, dataBytes, crc: crc32Bytes(dataBytes) });
    }
    for (const [rel, bin] of Object.entries(binaryFilesMap || {})) {
      if (!(bin instanceof Uint8Array)) continue;
      const nameBytes = stringToUtf8Bytes(normalizeRelPath(rel));
      entries.push({ nameBytes, dataBytes: bin, crc: crc32Bytes(bin) });
    }

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const e of entries) {
      const nLen = e.nameBytes.length;
      const dLen = e.dataBytes.length;

      const localHdr = new Uint8Array(30 + nLen);
      const lv = new DataView(localHdr.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
      lv.setUint16(8, 0, true); // STORE (0)
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x21, true);
      lv.setUint32(14, e.crc, true);
      lv.setUint32(18, dLen, true);
      lv.setUint32(22, dLen, true);
      lv.setUint16(26, nLen, true);
      lv.setUint16(28, 0, true);
      localHdr.set(e.nameBytes, 30);

      localParts.push(localHdr, e.dataBytes);

      const centHdr = new Uint8Array(46 + nLen);
      const cv = new DataView(centHdr.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, e.crc, true);
      cv.setUint32(20, dLen, true);
      cv.setUint32(24, dLen, true);
      cv.setUint16(28, nLen, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centHdr.set(e.nameBytes, 46);

      centralParts.push(centHdr);
      offset += localHdr.length + dLen;
    }

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const totalLen = offset + centralSize + eocd.length;
    const out = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of localParts) { out.set(p, pos); pos += p.length; }
    for (const p of centralParts) { out.set(p, pos); pos += p.length; }
    out.set(eocd, pos);
    return out;
  }

  return {
    normalizeRelPath,
    resolveRelativeAssetPath,
    mergeStyleIntoOpenTag,
    mergeAttrsIntoOpenTag,
    patchSingleHtmlString,
    applyCanvasPayloadToProject,
    compileStandaloneHtml,
    createStarterProjectFiles,
    createSessionHtmlTemplate,
    buildZipUint8Array
  };
});
