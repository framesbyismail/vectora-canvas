/**
 * Vectora Canvas — Early Gate / Sign-In / Paywall Bypass & Session View Discovery (prebypass.js)
 * Runs in <head> BEFORE target page scripts ONLY inside the local Vectora Canvas preview.
 * Never modifies project source files on disk — lets the user & coding agent open and design
 * gated screens (e.g. Vision Pilot Advanced Mode, Multiple Mode, Video & 3D, Admin, Pro/Auth views)
 * without getting blocked by external OAuth sign-in or payment walls.
 */
(function () {
  if (window.__VC_PREBYPASS_LOADED__) return;
  window.__VC_PREBYPASS_LOADED__ = true;

  // =========================================================================
  // 0. WEBGL BUFFER PRESERVATION + EDIT-MODE RAF / ANIMATION FREEZE GATE
  // =========================================================================
  try {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    if (typeof origGetContext === 'function') {
      HTMLCanvasElement.prototype.getContext = function (type, attrs) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          attrs = Object.assign({}, attrs || {}, { preserveDrawingBuffer: true });
        }
        return origGetContext.call(this, type, attrs);
      };
    }
  } catch (_) {}

  const nativeRAF = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (cb) => setTimeout(() => cb(performance.now()), 16);
  const nativeCAF = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;
  window.__vcNativeRAF = nativeRAF;
  window.__vcNativeCAF = nativeCAF;

  let vcFrozen = false;
  let allowedStepTicks = 3; // Allow initial 3 boot ticks so 3D scenes render their static initial frame before Edit freeze locks
  let syntheticRafSeq = 900000;
  const queuedRafCallbacks = new Map(); // id -> callback
  const nativeRafIds = new Map(); // syntheticId -> nativeId

  window.requestAnimationFrame = function (cb) {
    if (typeof cb !== 'function') return 0;
    if (!vcFrozen || allowedStepTicks > 0) {
      if (vcFrozen && allowedStepTicks > 0) allowedStepTicks--;
      const synId = ++syntheticRafSeq;
      const natId = nativeRAF((ts) => {
        nativeRafIds.delete(synId);
        if (vcFrozen && allowedStepTicks <= 0 && !queuedRafCallbacks.has(synId)) {
          // Freeze engaged while callback was in flight — queue for Live resume!
          queuedRafCallbacks.set(synId, cb);
          return;
        }
        cb(ts);
      });
      nativeRafIds.set(synId, natId);
      return synId;
    }
    const synId = ++syntheticRafSeq;
    queuedRafCallbacks.set(synId, cb);
    return synId;
  };

  window.cancelAnimationFrame = function (id) {
    queuedRafCallbacks.delete(id);
    if (nativeRafIds.has(id)) {
      nativeCAF(nativeRafIds.get(id));
      nativeRafIds.delete(id);
    } else {
      nativeCAF(id);
    }
  };

  // Gate target-page setInterval tickers while frozen in Edit mode without losing intervals for Live mode
  const nativeSetInterval = window.setInterval.bind(window);
  window.setInterval = function (fn, delay, ...args) {
    if (typeof fn !== 'function') return nativeSetInterval(fn, delay, ...args);
    return nativeSetInterval(() => {
      if (vcFrozen) return;
      fn(...args);
    }, delay);
  };

  function flushQueuedRafOnce() {
    if (!queuedRafCallbacks.size) return;
    const entries = [...queuedRafCallbacks.entries()];
    queuedRafCallbacks.clear();
    nativeRAF((ts) => {
      for (const [, fn] of entries) {
        try {
          fn(ts);
        } catch (_) {}
      }
    });
  }

  window.__vcSetFrozen = function (freeze) {
    const next = Boolean(freeze);
    if (vcFrozen === next) return;
    vcFrozen = next;
    window.__VC_FROZEN__ = vcFrozen;
    if (!vcFrozen) {
      flushQueuedRafOnce();
    }
  };

  window.__vcStepFrames = function (count = 2) {
    allowedStepTicks = Math.max(allowedStepTicks, Number(count) || 2);
    if (vcFrozen && queuedRafCallbacks.size) {
      const entries = [...queuedRafCallbacks.entries()];
      queuedRafCallbacks.clear();
      nativeRAF((ts) => {
        if (allowedStepTicks > 0) allowedStepTicks--;
        for (const [, fn] of entries) {
          try {
            fn(ts);
          } catch (_) {}
        }
      });
    }
  };

  // Protect target-page scripts from SecurityError on history.replaceState/pushState inside blob: iframes
  try {
    if (location.protocol === 'blob:' && window.history) {
      const origReplace = window.history.replaceState ? window.history.replaceState.bind(window.history) : null;
      const origPush = window.history.pushState ? window.history.pushState.bind(window.history) : null;
      if (origReplace) {
        window.history.replaceState = function (stateObj, title, url) {
          try {
            return origReplace(stateObj, title, url);
          } catch (_) {}
        };
      }
      if (origPush) {
        window.history.pushState = function (stateObj, title, url) {
          try {
            return origPush(stateObj, title, url);
          } catch (_) {}
        };
      }
    }
  } catch (_) {}

  let bypassEnabled = typeof window.__VC_BYPASS_INIT__ === 'boolean' ? window.__VC_BYPASS_INIT__ : true;
  try {
    if (typeof window.__VC_BYPASS_INIT__ === 'boolean') {
      sessionStorage.setItem('__vc_bypass_gates', bypassEnabled ? '1' : '0');
    } else if (sessionStorage.getItem('__vc_bypass_gates') === '0' || sessionStorage.getItem('__he_bypass_gates') === '0') {
      bypassEnabled = false;
    }
  } catch (_) {}

  const GATE_ATTRS = ['data-gated', 'data-locked', 'data-auth-locked', 'data-paywall', 'inert'];
  const savedRootGateAttrs = new Map();
  const savedBodyGateAttrs = new Map();

  function stripGateAttributes() {
    if (!bypassEnabled) return;
    const root = document.documentElement;
    if (root) {
      for (const attr of GATE_ATTRS) {
        if (root.hasAttribute(attr)) {
          if (!savedRootGateAttrs.has(attr)) savedRootGateAttrs.set(attr, root.getAttribute(attr) ?? '');
          root.removeAttribute(attr);
        }
      }
      root.setAttribute('data-vc-preview-unlocked', 'true');
    }
    if (document.body) {
      for (const attr of GATE_ATTRS) {
        if (document.body.hasAttribute(attr)) {
          if (!savedBodyGateAttrs.has(attr)) savedBodyGateAttrs.set(attr, document.body.getAttribute(attr) ?? '');
          document.body.removeAttribute(attr);
        }
      }
      if (!document.body.classList.contains('adv')) {
        document.body.classList.add('adv');
        document.body.setAttribute('data-vc-added-adv', '1');
      }
      if (!document.body.classList.contains('pro')) {
        document.body.classList.add('pro');
        document.body.setAttribute('data-vc-added-pro', '1');
      }
    }
  }

  function seedPreviewEntitlements() {
    if (!bypassEnabled) return;
    try {
      localStorage.setItem('vp-pro', '1');
      if (!localStorage.getItem('vp-token')) {
        localStorage.setItem('vp-token', 'vc-studio-preview-owner-token');
      }
      sessionStorage.setItem('vp_boot_seen', '1');
      localStorage.setItem('__vc_preview_pro', 'true');
    } catch (_) {}
  }

  function clearPreviewEntitlementsAndLock() {
    try {
      if (localStorage.getItem('__vc_preview_pro') === 'true') {
        localStorage.removeItem('vp-pro');
        localStorage.removeItem('__vc_preview_pro');
      }
      if (localStorage.getItem('vp-token') === 'vc-studio-preview-owner-token') {
        localStorage.removeItem('vp-token');
      }
    } catch (_) {}

    const root = document.documentElement;
    if (root) {
      root.removeAttribute('data-vc-preview-unlocked');
      for (const [attr, val] of savedRootGateAttrs.entries()) {
        root.setAttribute(attr, val);
      }
    }
    if (document.body) {
      for (const [attr, val] of savedBodyGateAttrs.entries()) {
        document.body.setAttribute(attr, val);
      }
      if (document.body.hasAttribute('data-vc-added-adv')) {
        document.body.classList.remove('adv');
        document.body.removeAttribute('data-vc-added-adv');
      }
      if (document.body.hasAttribute('data-vc-added-pro')) {
        document.body.classList.remove('pro');
        document.body.removeAttribute('data-vc-added-pro');
      }
    }

    try {
      if (window.AC && typeof window.AC.setPro === 'function') {
        window.AC.setPro(false);
      }
      document.querySelectorAll('[data-vc-gate-hidden="1"]').forEach((el) => {
        el.removeAttribute('data-vc-gate-hidden');
        el.style.removeProperty('display');
      });
      document.querySelectorAll('[data-vc-blur-cleared="1"]').forEach((el) => {
        el.removeAttribute('data-vc-blur-cleared');
        el.style.removeProperty('filter');
      });
      window.dispatchEvent(new CustomEvent('vp-auth-changed'));
    } catch (_) {}

    return { unlocked: false, bypassEnabled: false };
  }

  if (bypassEnabled) {
    seedPreviewEntitlements();
    stripGateAttributes();
  } else {
    clearPreviewEntitlementsAndLock();
  }

  try {
    const attrObs = new MutationObserver(() => {
      if (bypassEnabled) stripGateAttributes();
    });
    if (document.documentElement) {
      attrObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: GATE_ATTRS
      });
    }
  } catch (_) {}

  const MOCK_USER = {
    id: 'vc-preview-owner',
    name: 'Vectora Designer',
    email: 'designer@local.preview',
    approved: true,
    owner: true,
    admin: true,
    pro: true,
    authenticated: true,
    plan: 'pro',
    subscription: { status: 'active', tier: 'pro' }
  };

  if (typeof window.fetch === 'function') {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const urlStr = typeof input === 'string' ? input : (input && input.url) || '';
      if (urlStr && !urlStr.includes('/__vc_api/') && !urlStr.includes('/__he_api/')) {
        try {
          const baseOrigin = location.origin && location.origin !== 'null' ? location.origin : 'https://local.vectora.preview';
          const parsed = new URL(urlStr, baseOrigin);
          const p = parsed.pathname.toLowerCase();

          if (bypassEnabled) {
            if (
              p === '/me' ||
              p === '/api/me' ||
              p === '/api/user' ||
              p === '/api/auth/session' ||
              p === '/api/auth/me' ||
              p === '/api/subscription' ||
              p === '/api/billing/status' ||
              p === '/api/entitlements'
            ) {
              return new Response(JSON.stringify(MOCK_USER), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (p === '/request' || p === '/api/request' || p === '/admin/approve' || p === '/api/admin/approve') {
              return new Response(JSON.stringify({ ok: true, approved: true, user: MOCK_USER }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            if (p === '/api/sync-state') {
              return new Response(
                JSON.stringify({
                  token: 'vc-studio-preview-owner-token',
                  user: MOCK_USER,
                  pro: '1',
                  updatedAt: Date.now()
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }

            if (p === '/admin/list' || p === '/api/admin/users' || p === '/api/admin/requests') {
              return new Response(
                JSON.stringify({
                  ok: true,
                  owner: MOCK_USER.email,
                  users: [
                    { email: 'alex.creator@example.com', name: 'Alex Rivera', provider: 'google', requested: true, approved: false, requestedAt: new Date().toISOString() },
                    { email: 'sara.studio@example.com', name: 'Sara Chen', provider: 'github', requested: true, approved: true, approvedAt: new Date().toISOString() }
                  ],
                  requests: [
                    { email: 'alex.creator@example.com', name: 'Alex Rivera', status: 'pending' }
                  ]
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
          } else if (p === '/me' || p === '/api/me' || p === '/api/auth/session' || p === '/api/auth/me') {
            // When Padlock is LOCKED (Bypass OFF), return unauthenticated 401 cleanly instead of CORS error inside blob:
            return new Response(JSON.stringify({ authenticated: false, pro: false, approved: false }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (_) {}
      }
      return nativeFetch(input, init);
    };
  }

  function unlockRuntimeGates() {
    if (!bypassEnabled) return { unlocked: false, bypassEnabled: false };
    stripGateAttributes();
    seedPreviewEntitlements();

    try {
      if (window.AC && typeof window.AC.setPro === 'function') {
        window.AC.setPro(true);
      }
      if (window.AC && typeof window.AC.hideAdv === 'function') {
        window.AC.hideAdv();
      }
      for (const id of ['vpLoadingScreen', 'vpSkeletonScreen']) {
        const el = document.getElementById(id);
        if (el) el.classList.add('is-hidden');
      }
      const advModal = document.getElementById('advModal');
      if (advModal && !advModal.hasAttribute('data-vc-force-open')) {
        advModal.hidden = true;
      }
      window.dispatchEvent(new CustomEvent('vp-auth-changed'));
    } catch (_) {}

    try {
      const gateSelectors = [
        '[data-paywall-overlay]',
        '[data-auth-gate]',
        '.paywall-overlay',
        '.paywall-backdrop',
        '.auth-wall',
        '.login-wall'
      ];
      document.querySelectorAll(gateSelectors.join(',')).forEach((el) => {
        if (!el.hasAttribute('data-vc-force-open')) {
          el.setAttribute('data-vc-gate-hidden', '1');
          el.style.setProperty('display', 'none', 'important');
        }
      });
      document.querySelectorAll('main, .workspace, #app, .vgrid').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.filter && cs.filter.includes('blur')) {
          el.setAttribute('data-vc-blur-cleared', '1');
          el.style.setProperty('filter', 'none', 'important');
        }
        if (cs.pointerEvents === 'none') {
          el.style.setProperty('pointer-events', 'auto', 'important');
        }
      });
    } catch (_) {}

    return { unlocked: true, bypassEnabled };
  }

  function discoverSwitchableViews() {
    const views = [];
    const seen = new Set();
    const pushView = (id, label, kind, action) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      views.push({ id, label, kind, action });
    };

    document.querySelectorAll('button[id], [role="tab"], nav a[href], .tabbar button').forEach((el) => {
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt || txt.length > 34) return;
      if (el.id) {
        if (/^(app|mode|fMode|tab|nav)/i.test(el.id) || el.getAttribute('role') === 'tab') {
          pushView(`click:${el.id}`, `${txt} (#${el.id})`, 'mode', { type: 'click', selector: `#${CSS.escape(el.id)}` });
        }
      } else if (el.closest('.tabbar')) {
        const idx = Array.from(el.parentElement.children).indexOf(el);
        const grp = el.closest('[id]')?.id || '';
        const sel = grp ? `#${CSS.escape(grp)} .tabbar button:nth-child(${idx + 1})` : '';
        if (sel) pushView(`tab:${sel}`, `${txt}`, 'tab', { type: 'click', selector: sel });
      }
    });

    document.querySelectorAll('.modal[id], [role="dialog"][id], aside[id][hidden], section[id][hidden]').forEach((el) => {
      const title =
        el.querySelector('h1, h2, h3, .mhead, strong')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 28) || el.id;
      pushView(`modal:${el.id}`, `${title} (#${el.id})`, 'modal', {
        type: 'reveal',
        selector: `#${CSS.escape(el.id)}`
      });
    });

    return views.slice(0, 32);
  }

  function activateDiscoveredView(actionObj) {
    if (!actionObj) return false;
    if (bypassEnabled) unlockRuntimeGates();
    if (typeof window.__vcStepFrames === 'function') window.__vcStepFrames(3);
    if (actionObj.type === 'click' && actionObj.selector) {
      const el = document.querySelector(actionObj.selector);
      if (el) {
        if (bypassEnabled) el.removeAttribute('disabled');
        el.click();
        return true;
      }
    } else if (actionObj.type === 'reveal' && actionObj.selector) {
      const el = document.querySelector(actionObj.selector);
      if (el) {
        el.hidden = false;
        el.setAttribute('data-vc-force-open', '1');
        el.style.removeProperty('display');
        if (getComputedStyle(el).display === 'none') {
          el.style.setProperty('display', 'flex', 'important');
        }
        return true;
      }
    }
    return false;
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (bypassEnabled) {
      unlockRuntimeGates();
      setTimeout(() => { if (bypassEnabled) unlockRuntimeGates(); }, 400);
      setTimeout(() => { if (bypassEnabled) unlockRuntimeGates(); }, 1200);
    } else {
      clearPreviewEntitlementsAndLock();
    }
  });

  const api = {
    isEnabled: () => bypassEnabled,
    setEnabled: (val) => {
      bypassEnabled = Boolean(val);
      try {
        sessionStorage.setItem('__vc_bypass_gates', bypassEnabled ? '1' : '0');
      } catch (_) {}
      if (bypassEnabled) {
        unlockRuntimeGates();
      } else {
        clearPreviewEntitlementsAndLock();
      }
      return bypassEnabled;
    },
    unlockRuntimeGates,
    lockRuntimeGates: clearPreviewEntitlementsAndLock,
    discoverSwitchableViews,
    activateDiscoveredView
  };

  window.__VC_PREBYPASS__ = api;
  window.__HE_PREBYPASS__ = api;
})();
