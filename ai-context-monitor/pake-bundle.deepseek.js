/* AI Context Monitor — DeepSeek bundle (generated) */
/* Chrome MV3 MAIN-world interceptors + UI, order from background.js */


/* ===== polyfill.js ===== */

// Р—Р°РіР»СѓС€РєРё РґР»СЏ Р»РѕРіРіРµСЂР° Рё РѕС‚Р»Р°РґРѕС‡РЅС‹С… С„СѓРЅРєС†РёР№ СЂР°СЃС€РёСЂРµРЅРёСЏ
if (typeof window.debugLog === 'undefined') {
  window.debugLog = function(...args) {
    console.log('[AI CM DEBUG]', ...args);
  };
}
if (typeof window.__aiCmSetDebugLogs === 'undefined') {
  window.__aiCmSetDebugLogs = function() {};
}

// Р­РјСѓР»СЏС‚РѕСЂ Chrome API РґР»СЏ Pake / Tauri
(function() {
  window.chrome = window.chrome || {};

  var messageListeners = [];
  var storageListeners = [];

  var onMessageStub = {
    addListener: function(fn) {
      if (typeof fn === 'function' && !messageListeners.includes(fn)) {
        messageListeners.push(fn);
      }
    },
    removeListener: function(fn) {
      messageListeners = messageListeners.filter(function(l) { return l !== fn; });
    },
    hasListener: function(fn) { return messageListeners.includes(fn); }
  };

  var onChangedStub = {
    addListener: function(fn) {
      if (typeof fn === 'function' && !storageListeners.includes(fn)) {
        storageListeners.push(fn);
      }
    },
    removeListener: function(fn) {
      storageListeners = storageListeners.filter(function(l) { return l !== fn; });
    }
  };

  function createEventStub() {
    return {
      addListener: function() {},
      removeListener: function() {},
      hasListener: function() { return false; },
      dispatch: function() {}
    };
  }

  // Runtime API
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.runtime.id = 'pake-ai-context-monitor';
  window.chrome.runtime.getURL = window.chrome.runtime.getURL || function(path) { return path; };
  window.chrome.runtime.getManifest = window.chrome.runtime.getManifest || function() {
    return { version: '2.2.0', manifest_version: 3, name: 'AI Context Monitor' };
  };
  window.chrome.runtime.onMessage = onMessageStub;
  window.chrome.runtime.onInstalled = createEventStub();
  window.chrome.runtime.onStartup = createEventStub();
  window.chrome.runtime.lastError = null;

  // РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№ РјРµР¶РґСѓ С„РѕРЅРѕРІС‹Рј СЃРµСЂРІРёСЃРѕРј Рё СЃС‚СЂР°РЅРёС†РµР№
  window.chrome.runtime.sendMessage = function(message, callback) {
    return new Promise(function(resolve) {
      var responded = false;
      var sender = { id: 'pake-ai-context-monitor', tab: { id: 1 } };

      var sendResponse = function(response) {
        if (!responded) {
          responded = true;
          if (callback) callback(response);
          resolve(response);
        }
      };

      var listeners = messageListeners.slice();
      listeners.forEach(function(listener) {
        try {
          listener(message, sender, sendResponse);
        } catch (e) {
          console.error('[AI CM Polyfill] РћС€РёР±РєР° РѕР±СЂР°Р±РѕС‚С‡РёРєР°:', e);
        }
      });

      if (!responded) {
        setTimeout(function() {
          if (!responded) {
            responded = true;
            if (callback) callback();
            resolve();
          }
        }, 10);
      }
    });
  };

  // Storage API
  window.chrome.storage = window.chrome.storage || {};
  window.chrome.storage.onChanged = onChangedStub;

  // РќР°СЃС‚СЂРѕР№РєРё РѕС‚РєСЂС‹РІР°СЋС‚СЃСЏ РІ iframe РїРѕРІРµСЂС… СЃС‚СЂР°РЅРёС†С‹ (Р°РЅР°Р»РѕРі РёРєРѕРЅРєРё СЂР°СЃС€РёСЂРµРЅРёСЏ).
  // Р—Р°РїРёСЃСЊ РёР· iframe РґРѕР»Р¶РЅР° СЃСЂР°Р·Сѓ РґРѕС…РѕРґРёС‚СЊ РґРѕ content.js РІ СЂРѕРґРёС‚РµР»СЊСЃРєРѕРј РѕРєРЅРµ.
  var IS_OPTIONS_FRAME = (typeof window !== 'undefined') && window.__AI_CM_OPTIONS_FRAME__ === true;

  function notifyStorage(changes, area) {
    storageListeners.forEach(function(listener) {
      try { listener(changes, area); } catch (e) {}
    });
    if (IS_OPTIONS_FRAME) {
      try { parent.postMessage({ __aiCmStorage: 1, changes: changes, area: area }, '*'); } catch (e) {}
    }
  }

  function readStored(store, key) {
    var raw = store.getItem('ai_cm_' + key);
    if (raw === null) return undefined;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }

  if (!window.chrome.storage.local) {
    window.chrome.storage.local = {
      get: function(keys, callback) {
        var res = {};
        var defaults = {
          showWidget: true,
          showBadge: true,
          enabled: true
          // ai_cm_safe_pct_<site> РќР• Р·Р°РґР°С‘Рј: РєР°Рє Рё РІ Chrome, РїРѕСЂРѕРі РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
          // РЅРµ Р·Р°РґР°РЅ (100% РѕРєРЅР°), РїРѕРєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃР°Рј РЅРµ РІС‹СЃС‚Р°РІРёС‚ РµРіРѕ РІ РїР°РЅРµР»Рё.
        };

        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);

        keysArr.forEach(function(k) {
          var val = readStored(localStorage, k);
          if (val !== undefined) {
            res[k] = val;
          } else {
            res[k] = defaults[k] !== undefined ? defaults[k] : true;
          }
        });

        if (typeof keys === 'object' && !Array.isArray(keys) && keys !== null) {
          Object.keys(keys).forEach(function(k) {
            if (res[k] === undefined) res[k] = keys[k];
          });
        }

        if (callback) callback(res);
        return Promise.resolve(res);
      },
      set: function(obj, callback) {
        var changes = {};
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(function(k) {
            var oldVal = readStored(localStorage, k);
            var newVal = obj[k];
            localStorage.setItem('ai_cm_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);
            changes[k] = { oldValue: oldVal, newValue: newVal };
          });
        }
        notifyStorage(changes, 'local');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: function(keys, callback) {
        var arr = Array.isArray(keys) ? keys : [keys];
        var changes = {};
        arr.forEach(function(k) {
          var oldVal = readStored(localStorage, k);
          if (oldVal !== undefined) {
            localStorage.removeItem('ai_cm_' + k);
            changes[k] = { oldValue: oldVal, newValue: undefined };
          }
        });
        if (Object.keys(changes).length) notifyStorage(changes, 'local');
        if (callback) callback();
        return Promise.resolve();
      },
      getKeys: function(callback) {
        var keys = [];
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('ai_cm_') === 0) keys.push(k.slice(6));
          }
        } catch (e) {}
        if (callback) callback(keys);
        return Promise.resolve(keys);
      }
    };
  }

  // session: РєР°Рє РІ Chrome вЂ” РѕС‚РґРµР»СЊРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ (BYOK-РєР»СЋС‡Рё РЅРµ РґРѕР»Р¶РЅС‹ РїРѕРїР°РґР°С‚СЊ РІ local)
  if (!window.chrome.storage.session) {
    window.chrome.storage.session = {
      get: function(keys, callback) {
        var res = {};
        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);
        keysArr.forEach(function(k) {
          var val = readStored(sessionStorage, 'sess_' + k);
          if (val !== undefined) res[k] = val;
        });
        if (callback) callback(res);
        return Promise.resolve(res);
      },
      set: function(obj, callback) {
        var changes = {};
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(function(k) {
            var oldVal = readStored(sessionStorage, 'sess_' + k);
            var newVal = obj[k];
            sessionStorage.setItem('ai_cm_sess_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);
            changes[k] = { oldValue: oldVal, newValue: newVal };
          });
        }
        notifyStorage(changes, 'session');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: function(keys, callback) {
        var arr = Array.isArray(keys) ? keys : [keys];
        var changes = {};
        arr.forEach(function(k) {
          var oldVal = readStored(sessionStorage, 'sess_' + k);
          if (oldVal !== undefined) {
            sessionStorage.removeItem('ai_cm_sess_' + k);
            changes[k] = { oldValue: oldVal, newValue: undefined };
          }
        });
        if (Object.keys(changes).length) notifyStorage(changes, 'session');
        if (callback) callback();
        return Promise.resolve();
      }
    };
  }

  window.chrome.storage.sync = window.chrome.storage.local;

  if (!IS_OPTIONS_FRAME) {
    try {
      window.addEventListener('message', function(ev) {
        var d = ev && ev.data;
        if (!d || d.__aiCmStorage !== 1 || !d.changes) return;
        storageListeners.forEach(function(listener) {
          try { listener(d.changes, d.area || 'local'); } catch (e) {}
        });
      });
    } catch (e) {}
  }

  // Tabs API
  window.chrome.tabs = window.chrome.tabs || {};
  window.chrome.tabs.query = function(q, cb) {
    var href = (typeof location !== 'undefined' ? location.href : '');
    var title = (typeof document !== 'undefined' ? document.title : '');
    // РќР°СЃС‚СЂРѕР№РєРё Р¶РёРІСѓС‚ РІ srcdoc-iframe: Р°РєС‚РёРІРЅР°СЏ "РІРєР»Р°РґРєР°" вЂ” СЌС‚Рѕ СЂРѕРґРёС‚РµР»СЊСЃРєР°СЏ СЃС‚СЂР°РЅРёС†Р°.
    if (IS_OPTIONS_FRAME) {
      try { if (parent && parent.location) href = parent.location.href; } catch (e) {}
      try { if (parent && parent.document) title = parent.document.title; } catch (e) {}
    }
    var tab = { id: 1, active: true, currentWindow: true, url: href, title: title };
    if (cb) cb([tab]);
    return Promise.resolve([tab]);
  };
  window.chrome.tabs.sendMessage = function(tabId, message, callback) {
    return window.chrome.runtime.sendMessage(message, callback);
  };
  window.chrome.tabs.create = function(opts, cb) {
    try { if (opts && opts.url) window.open(opts.url, '_blank'); } catch (e) {}
    if (cb) cb();
  };
  window.chrome.tabs.onUpdated = createEventStub();
  window.chrome.tabs.onActivated = createEventStub();

  window.chrome.action = window.chrome.action || {
    setIcon: function() {}, setBadgeText: function() {}, setBadgeBackgroundColor: function() {}
  };
})();


/* ===== pake-relay.js ===== */


(function () {
  var lastSnapshot = null;
  try {
    window.addEventListener('ai-cm-full-history', function (ev) {
      try { lastSnapshot = (ev && ev.detail) ? ev.detail : null; } catch (e) { }
    });
  } catch (e) { }
  window.__aiCmPackReplay = function () {
    if (!lastSnapshot) return false;
    try {
      window.dispatchEvent(new CustomEvent('ai-cm-full-history', { detail: lastSnapshot }));
      return true;
    } catch (e) { return false; }
  };
})();


/* ===== utils/debug.js ===== */

var __aiCmDebugClassic = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var stdin_exports = {};
  __export(stdin_exports, {
    __aiCmGetLogRing: () => __aiCmGetLogRing,
    __aiCmPushLogRing: () => __aiCmPushLogRing,
    __aiCmSetDebugLogs: () => __aiCmSetDebugLogs,
    __aiCmStringifyArg: () => __aiCmStringifyArg,
    aiCmDiagDocKind: () => aiCmDiagDocKind,
    aiCmDiagDownload: () => aiCmDiagDownload,
    aiCmDiagDownloadBlocked: () => aiCmDiagDownloadBlocked,
    aiCmDiagHead: () => aiCmDiagHead,
    aiCmDiagLine: () => aiCmDiagLine,
    aiCmDiagOn: () => aiCmDiagOn,
    aiCmDiagStack: () => aiCmDiagStack,
    aiCmDiagWarn: () => aiCmDiagWarn,
    debugLog: () => debugLog,
    swallow: () => swallow,
    swallowSoft: () => swallowSoft
  });
  var DEBUG = false;
  function __aiCmSetDebugLogs(v) {
    DEBUG = !!v;
    try {
      if (typeof window !== "undefined") window.__aiCmDebugLogs = !!v;
    } catch (e) {
    }
  }
  var __aiCmLogRing = [];
  var __aiCmLogRingMax = 200;
  function __aiCmStringifyArg(a) {
    if (typeof a === "string") return a;
    try {
      var s = JSON.stringify(a);
      if (s === void 0) return String(a);
      if (s.length > 500) s = s.slice(0, 500) + "\u2026";
      return s;
    } catch (e) {
      return String(a);
    }
  }
  function __aiCmPushLogRing(line) {
    try {
      __aiCmLogRing.push(line);
      if (__aiCmLogRing.length > __aiCmLogRingMax) __aiCmLogRing.shift();
    } catch (e) {
    }
  }
  function __aiCmGetLogRing() {
    try {
      return __aiCmLogRing.slice();
    } catch (e) {
      return [];
    }
  }
  function debugLog(level, ...rest) {
    var args = Array.prototype.slice.call(arguments, 1);
    try {
      var line = args.map(__aiCmStringifyArg).join(" ");
      __aiCmPushLogRing(line);
    } catch (e) {
    }
    if (level === "error" || level === "warn") {
      (console[level] || console.log).apply(console, args);
      return;
    }
    var enabled = DEBUG;
    var key = level;
    try {
      if (typeof window !== "undefined" && window.__aiCmDebugLogs === true) enabled = true;
    } catch (e) {
    }
    if (enabled) {
      (console[key] || console.log).apply(console, args);
    }
  }
  function swallow(error, tag) {
    try {
      if (typeof debugLog !== "function") return;
      debugLog("error", "[swallow][" + (tag || "unlabeled") + "]", error);
    } catch (eSwallow) {
    }
  }
  function aiCmDiagOn() {
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage && sessionStorage.getItem("aiCmDebug") === "1") return true;
    } catch (eSess) {
    }
    try {
      if (typeof window !== "undefined" && window && window.__aiCmDebugLogs === true) return true;
    } catch (eWin) {
    }
    return false;
  }
  function aiCmDiagDocKind() {
    var href = "";
    var host = "";
    try {
      href = String(typeof location !== "undefined" && location && location.href || "");
    } catch (eHref) {
    }
    try {
      host = String(typeof location !== "undefined" && location && location.hostname || "");
    } catch (eHost) {
    }
    var isGoogle = host === "google.com" || host === "www.google.com";
    try {
      if (href.indexOf("/sorry/") !== -1) return "captcha";
      if (isGoogle && (document.querySelector("#captcha-form") || document.querySelector('form[action*="sorry"]') || document.querySelector('iframe[src*="recaptcha"]'))) return "captcha";
    } catch (eCap) {
    }
    try {
      var tid = "";
      var el = document.querySelector("[data-session-thread-id]");
      if (el) tid = String(el.getAttribute("data-session-thread-id") || "").trim();
      if (tid) return "chat";
      if (document.querySelector('[data-scope-id="turn"]') || document.querySelector('[data-subtree="aimfl"]')) return "chat";
    } catch (eChat) {
    }
    if (isGoogle) return "search";
    return "chat";
  }
  function aiCmDiagHead(v, n) {
    try {
      var lim = typeof n === "number" && n > 0 ? n : 100;
      if (v === void 0 || v === null) return "(\u043F\u0443\u0441\u0442\u043E)";
      var s = String(v);
      if (!s) return "(\u043F\u0443\u0441\u0442\u043E)";
      var flat = s.replace(/\s+/g, " ").trim();
      if (!flat) return "(\u043F\u0443\u0441\u0442\u043E/\u043F\u0440\u043E\u0431\u0435\u043B\u044B)";
      return flat.length > lim ? flat.slice(0, lim) + "\u2026" : flat;
    } catch (eHead) {
      return "(\u043E\u0448\u0438\u0431\u043A\u0430)";
    }
  }
  function aiCmDiagStack(skip) {
    try {
      var st = String(new Error().stack || "");
      if (!st) return "";
      var lines = st.split("\n");
      var out = [];
      var from = 1 + (typeof skip === "number" && skip >= 0 ? skip : 0);
      for (var i = from; i < lines.length && out.length < 4; i++) {
        var s = String(lines[i] || "").replace(/\s+/g, " ").trim();
        if (!s || s.indexOf("aiCmDiag") !== -1) continue;
        out.push(s);
      }
      return out.join(" <- ");
    } catch (eStack) {
      return "";
    }
  }
  function aiCmDiagLine(tag, fields) {
    if (!aiCmDiagOn()) return false;
    try {
      var parts = [];
      var f = fields || {};
      for (var k in f) {
        if (!Object.prototype.hasOwnProperty.call(f, k)) continue;
        var v = f[k];
        parts.push(k + "=" + (v === void 0 || v === null ? "(\u043D\u0435\u0442)" : String(v)));
      }
      console.log("[AI CM][diag] " + tag + " " + parts.join(" "));
    } catch (eLine) {
    }
    return true;
  }
  function aiCmDiagDownload(trigger, content, fileName, extra) {
    if (!aiCmDiagOn()) return false;
    var e = extra || {};
    var url = "";
    try {
      url = String(typeof location !== "undefined" && location && location.href || "");
    } catch (eUrl) {
    }
    return aiCmDiagLine("download", {
      trigger: trigger || "(\u043D\u0435\u0442)",
      file: fileName === void 0 || fileName === null || String(fileName) === "" ? "\u043F\u0443\u0441\u0442\u043E\u0435" : String(fileName),
      bytes100: aiCmDiagHead(content, 100),
      len: content === void 0 || content === null ? 0 : String(content).length,
      mime: e.mime,
      url,
      threadId: e.threadId,
      site: e.site,
      reason: e.reason,
      src: aiCmDiagStack(1)
    });
  }
  function aiCmDiagDownloadBlocked(trigger, content, fileName, reason, extra) {
    if (!aiCmDiagOn()) return false;
    var e = extra || {};
    var url = "";
    try {
      url = String(typeof location !== "undefined" && location && location.href || "");
    } catch (eUrlB) {
    }
    return aiCmDiagLine("download-blocked", {
      reason: reason || "(\u043D\u0435\u0442)",
      trigger: trigger || "(\u043D\u0435\u0442)",
      file: fileName === void 0 || fileName === null || String(fileName) === "" ? "\u043F\u0443\u0441\u0442\u043E\u0435" : String(fileName),
      bytes100: aiCmDiagHead(content, 100),
      len: content === void 0 || content === null ? 0 : String(content).length,
      mime: e.mime,
      url,
      threadId: e.threadId,
      site: e.site,
      src: aiCmDiagStack(1)
    });
  }
  try {
    if (typeof window !== "undefined") window.__aiCmSwallow = swallow;
  } catch (eSwallowExport) {
  }
  function swallowSoft(error, tag) {
    var label = tag || "unlabeled";
    var msg = "";
    try {
      msg = error && error.message ? String(error.message) : String(error);
    } catch (eSoftMsg) {
      msg = "(\u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430)";
    }
    try {
      if (typeof __aiCmPushLogRing === "function") __aiCmPushLogRing("[swallow-soft][" + label + "] " + msg);
    } catch (eSoftRing) {
      return void 0;
    }
    try {
      if (typeof aiCmDiagLine !== "function") return;
      aiCmDiagLine("swallow-soft", { tag: label, err: error });
    } catch (eSoftDiag) {
      return void 0;
    }
  }
  function aiCmDiagWarn(tag, message, detail) {
    var label = tag || "unlabeled";
    var text = message === void 0 || message === null ? "" : String(message);
    try {
      var tail = "";
      if (detail !== void 0) tail = " " + (typeof __aiCmStringifyArg === "function" ? __aiCmStringifyArg(detail) : String(detail));
      if (typeof __aiCmPushLogRing === "function") __aiCmPushLogRing("[ai-cm-warn][" + label + "] " + text + tail);
    } catch (eWarnRing) {
      return void 0;
    }
    try {
      if (typeof aiCmDiagOn !== "function" || !aiCmDiagOn()) return;
      console.log("[AI CM][warn][" + label + "] " + text, detail);
    } catch (eWarnPrint) {
      return void 0;
    }
  }
  try {
    if (typeof window !== "undefined") window.__aiCmSwallowSoft = swallowSoft;
  } catch (eSoftExport) {
    __aiCmPushLogRing("[swallow-soft-export] " + eSoftExport);
  }
  return __toCommonJS(stdin_exports);
})();

Object.assign(globalThis, __aiCmDebugClassic);


/* ===== core/deepseek-diag.js ===== */

// =============================================================================
// core/deepseek-diag.js — Step D.1 (декомпозиция core/deepseek-intercept.js).
// ДИАГНОСТИКА DEEPSEEK: СЕКЦИИ 13/13D/13B ядра — диагностический дамп снапшота
// (dumpHistorySnapshot, маркеры o22-dispatch/ingest-branch), вербатим-дамп usage по
// ходам при загрузке истории (O-26) и измерение live vs network с кольцами сырья (O-18).
//
// Кластер вынесен из core/deepseek-intercept.js. Раньше обе части жили в ОДНОМ IIFE,
// поэтому кластер обращался к состоянию ядра по именам. Теперь у модуля свой IIFE,
// и состояние ядра приходит через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE (важно для производительности). Тела перенесены БАЙТ-В-БАЙТ и без
// префиксов D., но лежат в ДВУХ зонах:
//   • PURE-зона (этот IIFE, до __bind) — 8 DIAG_*-констант, 11 diag-переменных (diagSeq,
//     diagOps, diagSseRing, diagHistRing, diagMarks, diagLiveTurns, diagLiveOrder,
//     diagNetTurns, diagEnrich, diagFlag, diagExports), USAGE_FIELD_RE и функции, которым
//     состояние ядра НЕ нужно: isDebugEnabled, getNavigationType, normalizeRole,
//     buildMessagesFromRaw, collectUsageFieldsVerbatim, fragContentLength, diagOn,
//     diagHash6, diagClip, diagPushRing, diagStat, diagFirstDiff, diagVerdict,
//     diagLiveTurnRecord.
//   • BIND-зона ('with (D) { … }' внутри __bind) — тела, читающие состояние/функции ядра:
//     determineState, buildMessagesFromTurnsMap, dumpTurnUsageAtHistoryLoad,
//     dumpHistorySnapshot, diagFragState, diagMark, diagChunkRecord, diagHistRecord,
//     diagSnapshotNetTurns, diagDumpRings, diagExportHook, diagResetForConv, мосты O-18.
// ПОЧЕМУ ТАК: внутри with каждый свободный идентификатор резолвится ДИНАМИЧЕСКИ (ES3
// Annex B), и горячий цикл FNV-хеша деградирует ~в 40 раз (микробенчмарк: 200×200 КБ —
// 81 мс вне with против 3309 мс в with). Тела, которым нужен только собственный scope,
// обязаны жить вне with — иначе O-18-прогон frag-resync растёт с 1.3 с до 5.1 с и
// упирается в таймаут jest. Байтовая идентичность тел сохранена в обеих зонах.
//
// Живое состояние ядра отдаётся геттерами (ro) и геттерами+сеттерами (rw): модуль и
// ядро работают с ОДНИМИ И ТЕМИ ЖЕ переменными IIFE, а не с копиями значений. rw —
// ровно те имена, что модуль перезаписывает: sseFragments/sseFragmentTypes (seed-мост
// O-18 подменяет буфер фрагментов) и lastDiagConvId (кольца O-18 живут в пределах одного
// convId; переменная осталась в ядре — её читает и пишет resetForNewConversation).
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v4',
// document_start, world MAIN): utils/debug.ts -> ЭТОТ ФАЙЛ -> core/deepseek-netsync.js
// (Step D.2) -> core/deepseek-intercept.js.
// До связки на window.AiCmDeepseekDiag лежит только __bind; после связки Fn заполнен
// значениями 26 диагностических функций, а ядро раздаёт их 16 форвардерами по прежним
// именам. Экспорт: window.AiCmDeepseekDiag + module.exports.
// =============================================================================

(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekDiag) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: собственное состояние модуля и функции без зависимости от ядра ----
  // ===== СЕКЦИЯ 13: ДИАГНОСТИЧЕСКИЙ ДАМП (только при sessionStorage aiCmDebug === '1') =====

  function isDebugEnabled() {
    try {
      return sessionStorage.getItem('aiCmDebug') === '1';
    } catch (e) { return false; }
  }

  function getNavigationType() {
    try {
      var entries = performance.getEntriesByType('navigation');
      if (entries && entries.length > 0) {
        return entries[0].type || '';
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  // Нормализация роли: USER→user, ASSISTANT→assistant, иначе→unknown
  function normalizeRole(rawRole) {
    if (!rawRole) return 'unknown';
    if (rawRole === 'USER') return 'user';
    if (rawRole === 'ASSISTANT') return 'assistant';
    return 'unknown';
  }

  function buildMessagesFromRaw(chatMessages, chain) {
    var chainIds = {};
    for (var ci = 0; ci < chain.length; ci++) {
      chainIds[String(chain[ci].message_id)] = true;
    }

    var messages = [];
    for (var i = 0; i < chatMessages.length; i++) {
      var msg = chatMessages[i];
      var mid = String(msg.message_id || '');
      var totalLen = 0;
      var thinkLen = 0;   // v8 (O-7): длина reasoning-фрагментов (type === 'THINK')
      var hasContent = false;
      var frags = Array.isArray(msg.fragments) ? msg.fragments : [];
      for (var fi = 0; fi < frags.length; fi++) {
        if (typeof frags[fi].content === 'string') {
          totalLen += frags[fi].content.length;
        }
        if (frags[fi] && frags[fi].type === 'THINK' && typeof frags[fi].content === 'string') {
          thinkLen += frags[fi].content.length;
        }
      }
      if (totalLen > 0) hasContent = true;

      var atts = Array.isArray(msg.attachments) ? msg.attachments : [];
      var attCount = atts.length;
      var attTokens = null;
      if (attCount > 0) {
        attTokens = 0;
        for (var ai = 0; ai < atts.length; ai++) {
          var a = atts[ai];
          if (a && typeof a.token_count === 'number') attTokens += a.token_count;
        }
        if (attTokens === 0) attTokens = null;
      }

      messages.push({
        index: i,
        messageIdPrefix: mid.slice(0, 8),
        role: normalizeRole(msg.role),
        hasContent: hasContent,
        contentLength: totalLen,
        reasoningLength: thinkLen,        // v8 (O-7): символов reasoning (THINK) в сообщении
        hasReasoning: thinkLen > 0,       // v8
        inActiveChain: !!chainIds[mid],
        hasTokenField: typeof msg.accumulated_token_usage === 'number',
        tokenFieldName: 'accumulated_token_usage',
        tokenValue: typeof msg.accumulated_token_usage === 'number' ? msg.accumulated_token_usage : null,
        hasParentId: !!msg.parent_id,
        parentIdPrefix: msg.parent_id ? String(msg.parent_id).slice(0, 8) : null,
        hasAttachments: attCount > 0,
        attachmentCount: attCount,
        attachmentTokens: attTokens,
        hasThinkingEnabled: typeof msg.thinking_enabled === 'boolean',
        thinkingEnabled: typeof msg.thinking_enabled === 'boolean' ? msg.thinking_enabled : null
      });
    }
    return messages;
  }

  // ===== СЕКЦИЯ 13D (O-26): ВЕРБАТИМ-ДАМП USAGE ПО ХОДАМ ПРИ ЗАГРУЗКЕ ИСТОРИИ =====
  // ИЗМЕРЕНИЕ (поведение НЕ меняется). Мотив O-26: на длинном чате бейдж DeepSeek растёт
  // сверхлинейно (151.3% → 396.3% при +3 коротких ходах). Подозрение — семантика поля
  // accumulated_token_usage в payload: это не «токены хода», а НАКОПИТЕЛЬ (сумма по ходам),
  // поэтому походовое чтение даёт квадратичный рост. Проверяется ТОЛЬКО фактами payload:
  // дамп печатает usage-поля КАЖДОГО сообщения цепочки ровно так, как они пришли —
  // без суммирования, приведения типов, агрегации и без правок расчёта pct/serverTokens.
  // Гейт: sessionStorage aiCmDebug === '1' (тот же, что у всей СЕКЦИИ 13); при выключенном
  // флаге функция выходит ПЕРВОЙ строкой — ни строки лога, ни работы с данными.
  // Однократность: вызов стоит в блоке `if (!loggedHistory)` ingestHistory — один дамп на
  // загрузку истории чата (loggedHistory сбрасывается сменой чата).
  // Ключи usage собираются по имени (token/usage/prompt/completion/cache/credit/cost) —
  // набор «соседних» ключей заранее неизвестен, поэтому печатается их фактический состав.
  var USAGE_FIELD_RE = /(token|usage|prompt|completion|cache|credit|cost)/i;
  function collectUsageFieldsVerbatim(msg) {
    var out = {};
    if (!msg || typeof msg !== 'object') return out;
    for (var k in msg) {
      if (!Object.prototype.hasOwnProperty.call(msg, k)) continue;
      if (k === 'fragments') continue;              // контент хода, не usage
      if (!USAGE_FIELD_RE.test(k)) continue;
      out[k] = msg[k];                              // значение КАК ЕСТЬ (включая вложенный объект usage)
    }
    return out;
  }
  function fragContentLength(frags) {
    var total = 0;
    for (var i = 0; i < frags.length; i++) {
      if (typeof frags[i].content === 'string') total += frags[i].content.length;
    }
    return total;
  }

  // ===== СЕКЦИЯ 13B (O-18, ФАЗА 1): ИЗМЕРЕНИЕ live vs network =====
  // Правило фазы: ПОВЕДЕНИЕ НЕ МЕНЯЕТСЯ. Всё ниже — либо чтение уже существующего
  // состояния, либо запись в СОБСТВЕННЫЕ буферы и console.log. Включается ТОЛЬКО флагом
  // sessionStorage aiCmDebug === '1': при выключенном флаге ни один буфер не наполняется и
  // ни одна строка не логируется, а вызовы в горячих путях сводятся к одному кэшированному
  // чтению sessionStorage раз в секунду (diagOn). Ни одна diag-функция не пишет в turnsMap,
  // не трогает гейты/латчи/экспорт/формат файла.
  //   diagSseRing   — кольцо сырых SSE-чанков (response/fragments*, o=APPEND/SET) + состояние
  //                   буфера фрагментов ДО и ПОСЛЕ обработки чанка (len/hash по фрагментам);
  //   diagHistRing  — кольцо ответов history_messages текущего convId (сырьё + состав
  //                   фрагментов по каждому сообщению: type/len/hash/head);
  //   diagMarks     — маркеры веток ingestHistory (MERGE/EMPTY-AUTH/EMPTY-NONAUTH/TRUNCATED/
  //                   ACCEPT/дозапрос) и фаз потока (begin/reset/end/finish);
  //   diagLiveTurns — per-turn текст, собранный LIVE-путём (SSE), с ревизиями;
  //   diagNetTurns  — per-turn текст последнего ПРИНЯТОГО снимка history_messages (network);
  //   diagEnrich    — ревизии live-текста, где вердикт не EQUAL (кандидат «длиннее побеждает»).
  // Дамп на КАЖДЫЙ экспорт: мост ai-cm-turns-snap-request уже вызывается экспортёром в обеих
  // точках записи файла (snapshot-at-fired / snapshot-at-manual) — здесь только читаем.
  var DIAG_SSE_RING_MAX = 400;
  var DIAG_HIST_RING_MAX = 3;
  var DIAG_MARK_MAX = 40;
  var DIAG_ENRICH_MAX = 60;
  var DIAG_REV_MAX = 8;
  var DIAG_RAW_CAP = 240;
  var DIAG_HIST_RAW_CAP = 200000;
  var DIAG_SEAM_MIN = 48;      // мин. длина «шва» для вердикта MIDDLE-HOLE
  var diagSeq = 0;
  var diagOps = { APPEND: 0, SET: 0, other: 0 };
  var diagSseRing = [];
  var diagHistRing = [];
  var diagMarks = [];
  var diagLiveTurns = {};
  var diagLiveOrder = [];
  var diagNetTurns = null;
  var diagEnrich = [];
  var diagFlag = { v: false, at: 0 };
  var diagExports = 0;

  function diagOn() {
    var now = Date.now();
    if (now - diagFlag.at < 1000) return diagFlag.v;
    diagFlag.at = now;
    diagFlag.v = isDebugEnabled();
    return diagFlag.v;
  }
  // FNV-1a 32-bit → 6 hex (тот же отпечаток, что aiCmDiagHash6 в base-handler.js)
  function diagHash6(s) {
    try {
      var str = String(s === null || s === undefined ? '' : s);
      var h = 0x811c9dc5;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return ('000000' + h.toString(16)).slice(-6);
    } catch (e) { return '000000'; }
  }
  function diagClip(s, cap) {
    try {
      var str = String(s === null || s === undefined ? '' : s);
      return str.length > cap ? str.slice(0, cap) : str;
    } catch (e) { return ''; }
  }
  function diagPushRing(arr, item, max) {
    try {
      arr.push(item);
      while (arr.length > max) arr.shift();
    } catch (e) { /* ignore */ }
  }
  function diagStat(t) {
    if (t === null || t === undefined) return '(none)';
    var s = String(t);
    return s.length + ':' + diagHash6(s);
  }
  function diagFirstDiff(a, b) {
    try {
      var A = String(a === null || a === undefined ? '' : a);
      var B = String(b === null || b === undefined ? '' : b);
      var n = Math.min(A.length, B.length);
      for (var i = 0; i < n; i++) { if (A.charAt(i) !== B.charAt(i)) return i; }
      return A.length === B.length ? -1 : n;
    } catch (e) { return 0; }
  }
  // Вердикт «live-текст против network-текста»: что именно потерял/приобрел live.
  //   EQUAL / TAIL-CUT (live — префикс net) / MIDDLE-HOLE (live потерял срединный кусок и
  //   СШИЛСЯ с net дальше — точная сигнатура O-18) / MIDDLE-HOLE-PARTIAL / LIVE-EXTRA / DIFF-OTHER
  function diagVerdict(lt, nt) {
    var out = { verdict: 'ONE-SIDE', firstDiff: null, lost: 0, resync: null };
    try {
      if (lt === null || lt === undefined || nt === null || nt === undefined) return out;
      var L = String(lt), N = String(nt);
      var fd = diagFirstDiff(L, N);
      out.firstDiff = fd;
      if (fd === -1) { out.verdict = 'EQUAL'; return out; }
      if (fd === L.length && L === N.slice(0, L.length)) {
        out.verdict = 'TAIL-CUT'; out.lost = N.length - L.length; return out;
      }
      if (fd < L.length) {
        var tail = L.slice(fd);
        var seam = (tail.length >= DIAG_SEAM_MIN) ? N.indexOf(tail, fd + 1) : -1;
        if (seam > fd) {
          out.resync = seam;
          out.lost = seam - fd;
          out.verdict = (seam + tail.length === N.length) ? 'MIDDLE-HOLE' : 'MIDDLE-HOLE-PARTIAL';
          return out;
        }
      }
      if (fd === N.length && N === L.slice(0, N.length)) {
        out.verdict = 'LIVE-EXTRA'; out.lost = L.length - N.length; return out;
      }
    } catch (e) { /* ignore */ }
    out.verdict = 'DIFF-OTHER';
    return out;
  }
  // Per-turn LIVE-текст (SSE-путь) + ревизии: видно, КАК менялся ход от финала к финалу.
  function diagLiveTurnRecord(id, role, text, reason) {
    try {
      if (!diagOn()) return;
      var key = String(id);
      var txt = (typeof text === 'string') ? text : '';
      var rec = diagLiveTurns[key];
      if (!rec) {
        rec = { id: key, role: String(role || ''), len: 0, hash: '', revs: [] };
        diagLiveTurns[key] = rec;
        diagLiveOrder.push(key);
      }
      var prev = rec.lastText || '';
      // Первая ревизия хода: сравнивать не с чем (prev пуст) — вердикт не выносим.
      var v = (prev.length > 0) ? diagVerdict(prev, txt) : { verdict: 'FIRST', firstDiff: null, lost: 0, resync: null };
      rec.revs.push({
        seq: ++diagSeq, t: Date.now(), reason: String(reason || ''), len: txt.length, hash: diagHash6(txt),
        prevLen: prev.length, firstDiff: v.firstDiff, verdict: v.verdict, lost: v.lost, resync: v.resync
      });
      while (rec.revs.length > DIAG_REV_MAX) rec.revs.shift();
      if (v.verdict !== 'EQUAL' && v.verdict !== 'ONE-SIDE') {
        diagPushRing(diagEnrich, {
          seq: ++diagSeq, t: Date.now(), id: key, role: String(role || ''), reason: String(reason || ''),
          prevLen: prev.length, newLen: txt.length, prevHash: diagHash6(prev), newHash: diagHash6(txt),
          firstDiff: v.firstDiff, verdict: v.verdict, lost: v.lost, resync: v.resync
        }, DIAG_ENRICH_MAX);
        console.log('[ai-cm-debug][O18][live-rev] id=' + key.slice(0, 8) + ' role=' + (role || '-') +
          ' reason=' + reason + ' prevLen=' + prev.length + ' newLen=' + txt.length +
          ' firstDiff=' + (v.firstDiff === null ? '-' : v.firstDiff) + ' verdict=' + v.verdict +
          ' lost=' + v.lost + ' resync=' + (v.resync === null ? '-' : v.resync));
      }
      rec.role = String(role || rec.role || '');
      rec.lastText = txt;
      rec.len = txt.length;
      rec.hash = diagHash6(txt);
    } catch (e) { /* ignore */ }
  }

  function __bind(d) {
    D = d;
    with (D) {
      // ---- BIND-зона: тела, читающие живое состояние/функции ядра через with (D) ----

  function determineState() {
    var navType = getNavigationType();
    var convPrefix = '';
    try { convPrefix = (currentConvId || '').slice(0, 8); } catch (e) { /* ignore */ }
    var visitedKey = '';
    var wasVisited = false;
    if (convPrefix) {
      visitedKey = 'aiCmVisited:' + convPrefix;
      try { wasVisited = sessionStorage.getItem(visitedKey) === '1'; } catch (e) { /* ignore */ }
    }

    if (navType === 'reload' || navType === 'back_forward') {
      return { state: 'after_f5', reason: 'navigationType=' + navType + ', convId=' + convPrefix, navType: navType };
    }
    if (wasVisited) {
      return { state: 'after_f5', reason: 'sessionStorage marker found for ' + convPrefix, navType: navType };
    }
    if (convPrefix) {
      try { sessionStorage.setItem(visitedKey, '1'); } catch (e) { /* ignore */ }
    }
    return { state: 'open', reason: 'first visit (nav=' + (navType || 'unknown') + ', convId=' + convPrefix + ')', navType: navType };
  }

  function buildMessagesFromTurnsMap() {
    var ids = Object.keys(turnsMap);
    // Сортируем по order, при одинаковом — по ts
    var orderSource = 'order';
    var hasOrder = true;
    var hasTs = true;
    for (var k = 0; k < ids.length; k++) {
      var t = turnsMap[ids[k]];
      if (typeof t.order !== 'number') { hasOrder = false; }
      if (typeof t.ts !== 'number') { hasTs = false; }
    }
    if (!hasOrder) orderSource = 'keys_unknown';

    ids.sort(function (a, b) {
      var oa = turnsMap[a].order;
      var ob = turnsMap[b].order;
      if (typeof oa === 'number' && typeof ob === 'number') {
        if (oa !== ob) return oa - ob;
        // при одинаковом order — по ts
        var tsa = turnsMap[a].ts;
        var tsb = turnsMap[b].ts;
        if (typeof tsa === 'number' && typeof tsb === 'number') return tsa - tsb;
        return 0;
      }
      if (typeof oa === 'number') return -1;
      if (typeof ob === 'number') return 1;
      // оба без order — по ts если доступно
      var tsa2 = turnsMap[a].ts;
      var tsb2 = turnsMap[b].ts;
      if (typeof tsa2 === 'number' && typeof tsb2 === 'number') return tsa2 - tsb2;
      return 0;
    });

    var messages = [];
    for (var i = 0; i < ids.length; i++) {
      var ti = turnsMap[ids[i]];
      var role = (ti.role === 'user' || ti.role === 'assistant') ? ti.role : 'unknown';

      messages.push({
        index: i,
        messageIdPrefix: ids[i].slice(0, 8),
        role: role,
        hasContent: !!ti.text && ti.text.length > 0,
        contentLength: ti.text ? ti.text.length : 0,
        inActiveChain: null,
        hasTokenField: false,
        tokenFieldName: null,
        tokenValue: null,
        hasParentId: null,
        parentIdPrefix: null,
        hasAttachments: null,
        attachmentCount: null,
        attachmentTokens: null,
        hasThinkingEnabled: null,
        thinkingEnabled: null,
        modelSlug: ti.modelSlug || null,
        hasReasoning: !!ti.reasoning,               // v8 (O-7)
        reasoningLength: ti.reasoning ? ti.reasoning.length : 0   // v8
      });
    }

    return { messages: messages, orderSource: orderSource };
  }
  function dumpTurnUsageAtHistoryLoad(chain, chatMessages, chatSession) {
    try {
      if (!isDebugEnabled()) return;                // без флага — молчание
      var list = Array.isArray(chain) ? chain : [];
      var all = Array.isArray(chatMessages) ? chatMessages : [];
      var usageKeys = [];
      var seenKeys = {};
      // Шапка: сколько сообщений в цепочке/снимке и какой состав usage-полей найден.
      for (var p = 0; p < list.length; p++) {
        var u0 = collectUsageFieldsVerbatim(list[p]);
        for (var k0 in u0) {
          if (!Object.prototype.hasOwnProperty.call(u0, k0)) continue;
          if (seenKeys[k0]) continue;
          seenKeys[k0] = 1;
          usageKeys.push(k0);
        }
      }
      console.log('[ai-cm-debug][O26][usage] turns=' + list.length +
        ' chatMessages=' + all.length +
        ' modelType=' + ((chatSession && chatSession.model_type) || '(default)') +
        ' usageKeys=' + (usageKeys.length ? usageKeys.join(',') : '(none)'));
      for (var i = 0; i < list.length; i++) {
        var msg = list[i] || {};
        var frags = Array.isArray(msg.fragments) ? msg.fragments : [];
        var rec = {
          index: i,
          messageIdPrefix: String(msg.message_id == null ? '' : msg.message_id).slice(0, 8),
          role: normalizeRole(msg.role),
          fragments: frags.length,
          contentLength: fragContentLength(frags),
          answerLength: collectTurnText(frags, msg.role).length,
          reasoningLength: collectTurnReasoning(frags, msg.role).length,
          usage: collectUsageFieldsVerbatim(msg)     // ВЕРБАТИМ: значения как в payload
        };
        var line = '';
        try { line = JSON.stringify(rec); } catch (eSer) { line = '(несериализуемо)'; }
        console.log('[ai-cm-debug][O26][turn] ' + line);
      }
    } catch (e) { /* ignore */ }
  }

  function dumpHistorySnapshot(state, stateReason, ctx) {
    // Вызывается ТОЛЬКО после проверки isDebugEnabled() в точках вызова
    try {
      ctx = ctx || {};
      var nowTs = Date.now();
      var convPrefix = '';
      try { convPrefix = (currentConvId || '').slice(0, 8); } catch (e) { /* ignore */ }

      // Виджет-процент из DOM
      var widgetPercent = null;
      var widgetPercentRaw = null;
      var widgetPercentSource = 'none';
      try {
        var widgetEl = document.querySelector('.ai-widget-text');
        if (widgetEl) {
          widgetPercentRaw = widgetEl.textContent || '';
          var pctMatch = widgetPercentRaw.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (pctMatch) {
            widgetPercent = parseFloat(pctMatch[1]);
            widgetPercentSource = 'dom';
          }
        }
      } catch (e) { /* ignore */ }

      // Модель — по последнему ходу по order (упорядоченный turnsMap)
      var lastModel = '';
      var tmIds = Object.keys(turnsMap).sort(function (a, b) {
        return (turnsMap[a].order || 0) - (turnsMap[b].order || 0);
      });
      for (var j = 0; j < tmIds.length; j++) {
        var t = turnsMap[tmIds[j]];
        if (t.modelSlug) lastModel = t.modelSlug;
      }

      var modelMode = '';
      if (typeof ctx.chatMode === 'string') modelMode = ctx.chatMode;
      if (typeof ctx.modelType === 'string' && ctx.modelType) modelMode = ctx.modelType;

      // serverTokens
      var stUsed = null;
      var stSource = 'none';
      var stAccumulated = null;
      var stSseEntry = null;
      var stSseFinal = null;

      if (ctx.lastAccumulated !== undefined) {
        stAccumulated = (typeof ctx.lastAccumulated === 'number' && ctx.lastAccumulated > 0) ? ctx.lastAccumulated : null;
        stUsed = stAccumulated;
        stSource = 'accumulated_last_message';
      }
      if (ctx.sseEntry !== undefined) {
        stSseEntry = (typeof ctx.sseEntry === 'number' && ctx.sseEntry > 0) ? ctx.sseEntry : null;
      }
      if (ctx.sseFinal !== undefined) {
        stSseFinal = (typeof ctx.sseFinal === 'number' && ctx.sseFinal > 0) ? ctx.sseFinal : null;
      }
      // SSE приоритетнее — перезаписывает used/source
      if (stSseFinal !== null) {
        stUsed = stSseFinal;
        stSource = 'sse_final_batch';
      } else if (stSseEntry !== null) {
        stUsed = stSseEntry;
        stSource = 'sse_entry_response';
      }

      // Сообщения
      var messages;
      var messagesSource;
      var messagesOrderSource = null;
      var rawMessagesCount = null;
      var activeChainCount = null;
      if (Array.isArray(ctx.chatMessages)) {
        var chain = Array.isArray(ctx.chain) ? ctx.chain : [];
        messages = buildMessagesFromRaw(ctx.chatMessages, chain);
        messagesSource = 'chat_messages_raw';
        messagesOrderSource = 'raw_array_order';
        rawMessagesCount = ctx.chatMessages.length;
        activeChainCount = chain.length;
      } else {
        var tmResult = buildMessagesFromTurnsMap();
        messages = tmResult.messages;
        messagesSource = 'turns_map';
        messagesOrderSource = tmResult.orderSource;
      }

      var turnsMapSize = Object.keys(turnsMap).length;

      // Статистика
      var userCount = 0;
      var assistantCount = 0;
      var unknownCount = 0;
      var totalContentLength = 0;
      var reasoningMessages = 0;        // v8 (O-7)
      var totalReasoningLength = 0;     // v8
      var maxTokenValue = null;
      var lastTokenValue = null;
      for (var mi = 0; mi < messages.length; mi++) {
        var m = messages[mi];
        if (m.role === 'user') userCount++;
        else if (m.role === 'assistant') assistantCount++;
        else unknownCount++;
        if (typeof m.contentLength === 'number') totalContentLength += m.contentLength;
        if (m.hasReasoning) { reasoningMessages++; totalReasoningLength += (m.reasoningLength || 0); }   // v8
        if (typeof m.tokenValue === 'number') {
          lastTokenValue = m.tokenValue;
          if (maxTokenValue === null || m.tokenValue > maxTokenValue) {
            maxTokenValue = m.tokenValue;
          }
        }
      }

      // historyFullByNetwork: только для ingestHistory и только если реально дошли до корня
      var capPoint = ctx.capturePoint || 'unknown';
      var hfbn = null;
      if (capPoint === 'ingestHistory') {
        hfbn = histCompletion.historyComplete;
      }

      var dump = {
        ai: 'deepseek',
        state: state,
        stateReason: stateReason || '',
        navigationType: ctx.navType || '',
        capturedAt: nowTs,
        capturePoint: capPoint,
        convIdPrefix: convPrefix || null,
        widgetPercent: widgetPercent,
        widgetPercentRaw: widgetPercentRaw,
        widgetPercentSource: widgetPercentSource,
        model: lastModel || null,
        modelMode: modelMode || null,
        flags: {
          historyFullByNetwork: hfbn,
          historyComplete: histCompletion.historyComplete,   // v7: честная полнота
          reachedRoot: histCompletion.reachedRoot,           // v7: доказан ли корень
          loggedHistory: loggedHistory,
          loggedRealtime: loggedRealtime,
          reasoningEnabled: REASONING_ENABLED    // v8 (O-7)
        },
        serverTokens: {
          used: stUsed,
          source: stSource,
          accumulatedFromLastMessage: stAccumulated,
          sseEntryTokens: stSseEntry,
          sseFinalTokens: stSseFinal
        },
        messages: messages,
        summary: {
          totalMessages: messages.length,
          userMessages: userCount,
          assistantMessages: assistantCount,
          unknownMessages: unknownCount,
          totalContentLength: totalContentLength,
          reasoningMessages: reasoningMessages,           // v8 (O-7): сообщений с непустым reasoning
          totalReasoningLength: totalReasoningLength,     // v8 (O-7)
          sumTokenFields: null,
          maxTokenValue: maxTokenValue,
          lastTokenValue: lastTokenValue,
          tokenFieldPolicy: 'cumulative_not_summable',
          rawMessagesCount: rawMessagesCount,
          activeChainCount: activeChainCount,
          turnsMapSize: turnsMapSize,
          historyLoadedTurns: turnsMapSize,
          messagesSource: messagesSource,
          messagesOrderSource: messagesOrderSource
        }
      };

      try {
        console.log('[ai-cm-debug] DEEPSEEK_STRUCT_DUMP\n' + JSON.stringify(dump, null, 2));
      } catch (jsonErr) {
        console.warn('[ai-cm-debug] DEEPSEEK_STRUCT_DUMP ошибка сериализации:', jsonErr);
      }
    } catch (e) {
      console.warn('[ai-cm-debug] DEEPSEEK_STRUCT_DUMP ошибка дампа:', e);
    }
  }
  var lastDiagConvId = currentConvId;   // O-18: кольца живут в пределах одного convId
  // Срез буфера фрагментов потока: состав, длина и отпечаток контента каждого фрагмента.
  function diagFragState() {
    var out = [];
    try {
      for (var i = 0; i < sseFragments.length; i++) {
        var f = sseFragments[i] || {};
        var c = (typeof f.content === 'string') ? f.content : '';
        out.push({ i: i, type: String(f.type || ''), len: c.length, hash: diagHash6(c) });
      }
    } catch (e) { /* ignore */ }
    return out;
  }
  function diagMark(kind, data) {
    try {
      if (!diagOn()) return;
      var m = { seq: ++diagSeq, t: Date.now(), kind: String(kind || ''), conv: (currentConvId || '').slice(0, 8) };
      if (data) {
        for (var k in data) { if (Object.prototype.hasOwnProperty.call(data, k)) m[k] = data[k]; }
      }
      m.ops = { APPEND: diagOps.APPEND, SET: diagOps.SET, other: diagOps.other };
      m.frags = diagFragState();
      diagPushRing(diagMarks, m, DIAG_MARK_MAX);
      console.log('[ai-cm-debug][O18][mark] ' + JSON.stringify(m));
    } catch (e) { /* ignore */ }
  }
  // Запись чанка SSE в кольцо + детектор СЖАТИЯ уже собранного контента (прямая улика потери).
  function diagChunkRecord(path, op, val, before, after) {
    try {
      var p = String(path === null || path === undefined ? '' : path);
      if (p.indexOf('fragments') === -1) { diagOps.other++; return; }
      if (op === 'APPEND') diagOps.APPEND++;
      else if (op === 'SET') diagOps.SET++;
      else diagOps.other++;
      var entry = {
        seq: ++diagSeq, t: Date.now(), conv: (currentConvId || '').slice(0, 8),
        path: p, op: String(op === null || op === undefined ? '' : op), kind: '',
        types: [], contentLens: [], rawLen: 0, raw: '', rawCut: false,
        before: before, after: after, changed: false
      };
      if (typeof val === 'string') {
        entry.kind = 'string';
        entry.rawLen = val.length;
        entry.raw = diagClip(val, DIAG_RAW_CAP);
        entry.rawCut = val.length > DIAG_RAW_CAP;
      } else if (Array.isArray(val)) {
        entry.kind = 'array';
        var js = '';
        try { js = JSON.stringify(val); } catch (eJs) { js = ''; }
        entry.rawLen = js.length;
        entry.raw = diagClip(js, DIAG_RAW_CAP);
        entry.rawCut = js.length > DIAG_RAW_CAP;
        for (var i = 0; i < val.length; i++) {
          var it = val[i];
          if (typeof it === 'string') { entry.types.push(it); entry.contentLens.push(0); }
          else if (it && typeof it === 'object') {
            entry.types.push(String(it.type || ''));
            entry.contentLens.push(typeof it.content === 'string' ? it.content.length : 0);
          } else { entry.types.push('?'); entry.contentLens.push(0); }
        }
      } else if (val !== undefined && val !== null) {
        entry.kind = typeof val;
        entry.rawLen = String(val).length;
        entry.raw = diagClip(String(val), DIAG_RAW_CAP);
      } else {
        entry.kind = 'empty';
      }
      try { entry.changed = JSON.stringify(before) !== JSON.stringify(after); } catch (eCh) { entry.changed = true; }
      diagPushRing(diagSseRing, entry, DIAG_SSE_RING_MAX);
      // Улика: контент уже собранного фрагмента УМЕНЬШИЛСЯ или фрагмент пропал из буфера.
      var shrink = [];
      if (before && after) {
        for (var q = 0; q < before.length && q < after.length; q++) {
          if (after[q].len < before[q].len) {
            shrink.push({ i: q, type: before[q].type, from: before[q].len, to: after[q].len, fromHash: before[q].hash, toHash: after[q].hash });
          }
        }
        if (after.length < before.length) shrink.push({ droppedFragments: before.length - after.length });
      }
      if (shrink.length) {
        console.warn('[ai-cm-debug][O18][SHRINK] op=' + entry.op + ' path=' + entry.path +
          ' types=' + JSON.stringify(entry.types) + ' shrink=' + JSON.stringify(shrink) +
          ' before=' + JSON.stringify(before) + ' after=' + JSON.stringify(after));
      }
    } catch (e) { /* ignore */ }
  }
  // Сырой ответ history_messages: сводка + состав фрагментов по каждому сообщению.
  function diagHistRecord(json, src) {
    try {
      if (!diagOn()) return;
      var raw = '';
      try { raw = JSON.stringify(json); } catch (eR) { raw = ''; }
      var bd = json && json.data && json.data.biz_data;
      var cs = bd && bd.chat_session;
      var cms = (bd && Array.isArray(bd.chat_messages)) ? bd.chat_messages : [];
      var rec = {
        seq: ++diagSeq, t: Date.now(), src: String(src || ''),
        conv: (currentConvId || '').slice(0, 8),
        url: diagClip(lastHistoryUrl || '', 140),
        code: (json && json.code),
        rawLen: raw.length, rawCut: raw.length > DIAG_HIST_RAW_CAP,
        chatMessages: cms.length,
        isEmpty: cs ? cs.is_empty : null,
        currentMessageId: (cs && cs.current_message_id != null) ? String(cs.current_message_id).slice(0, 8) : null,
        modelType: cs ? cs.model_type : null,
        fragTotal: 0,
        messages: []
      };
      var cap = Math.min(cms.length, 300);
      for (var i = 0; i < cap; i++) {
        var msg = cms[i] || {};
        var fr = Array.isArray(msg.fragments) ? msg.fragments : [];
        var frags = [];
        for (var j = 0; j < fr.length; j++) {
          var f = fr[j] || {};
          var c = (typeof f.content === 'string') ? f.content : '';
          frags.push({ type: String(f.type || ''), len: c.length, hash: diagHash6(c), head: diagClip(c, 80) });
        }
        rec.fragTotal += frags.length;
        rec.messages.push({
          i: i, id: String(msg.message_id || '').slice(0, 8), role: String(msg.role || ''),
          parent: msg.parent_id != null ? String(msg.parent_id).slice(0, 8) : null,
          insertedAt: msg.inserted_at || null,
          accumulated: (typeof msg.accumulated_token_usage === 'number') ? msg.accumulated_token_usage : null,
          thinkingEnabled: (typeof msg.thinking_enabled === 'boolean') ? msg.thinking_enabled : null,
          frags: frags
        });
      }
      rec.raw = diagClip(raw, DIAG_HIST_RAW_CAP);
      diagPushRing(diagHistRing, rec, DIAG_HIST_RING_MAX);
      console.log('[ai-cm-debug][O18][history] src=' + rec.src + ' conv=' + rec.conv +
        ' chatMessages=' + rec.chatMessages + ' is_empty=' + rec.isEmpty +
        ' current=' + rec.currentMessageId + ' rawLen=' + rec.rawLen + ' frags=' + rec.fragTotal +
        ' refetchDone=' + (historyRefetchDone === true ? 1 : 0));
    } catch (e) { /* ignore */ }
  }
  // Снимок NETWORK-текста по ходам: ровно то, что принятый ingestHistory положил в turnsMap.
  function diagSnapshotNetTurns(reason) {
    try {
      if (!diagOn()) return;
      var ids = Object.keys(turnsMap).sort(function (a, b) {
        return (turnsMap[a].order || 0) - (turnsMap[b].order || 0);
      });
      var map = {}, order = [], lens = [];
      for (var i = 0; i < ids.length; i++) {
        var t = turnsMap[ids[i]] || {};
        var txt = (typeof t.text === 'string') ? t.text : '';
        map[ids[i]] = { role: t.role || '', len: txt.length, hash: diagHash6(txt), text: txt };
        order.push(ids[i]);
        lens.push(txt.length);
      }
      diagNetTurns = { conv: (currentConvId || '').slice(0, 8), t: Date.now(), reason: String(reason || ''), order: order, map: map };
      console.log('[ai-cm-debug][O18][net] snapshot reason=' + reason + ' turns=' + order.length + ' lens=' + lens.join(','));
    } catch (e) { /* ignore */ }
  }
  function diagDumpRings(trigger) {
    try {
      var payload = {
        o18: 'live-vs-network', trigger: String(trigger || ''), at: Date.now(),
        conv: (currentConvId || '').slice(0, 8), convFull: currentConvId || '',
        ops: diagOps, exports: diagExports,
        flags: {
          historyComplete: histCompletion.historyComplete, reachedRoot: histCompletion.reachedRoot,
          baseEmpty: histCompletion.baseEmpty, historyRefetchDone: historyRefetchDone,
          streamActive: sseStreamActive === true, turnFinished: sseTurnFinished === true,
          requestMessageId: sseRequestMessageId ? String(sseRequestMessageId).slice(0, 8) : null,
          responseMessageId: sseResponseMessageId ? String(sseResponseMessageId).slice(0, 8) : null
        },
        netSnapshot: diagNetTurns ? { conv: diagNetTurns.conv, t: diagNetTurns.t, reason: diagNetTurns.reason, turns: diagNetTurns.order.length } : null,
        // v12 (O-18, фаза 2): ресинхрон парсера (сколько раз, сколько байт восстановлено)
        // и состояние экспортного сетевого дозапроса — прямо в дампе приёмки.
        resync: {
          count: sseResyncCount, bytes: sseResyncBytes, ring: sseResyncRing.length,
          unknown: sseUnknownCount, unknownChars: sseUnknownChars, types: Object.keys(SSE_FRAGMENT_TYPES).join(',')
        },
        netSync: {
          stats: netSyncStats, needed: netSyncNeeded(), liveTurns: liveTurnOrder.length,
          netAt: netSnapshotAt, lastTurnDoneAt: lastTurnDoneAt, netTurnIds: Object.keys(netTurnIds).length
        },
        liveOrder: diagLiveOrder,
        liveTurns: {},
        enrich: diagEnrich, marks: diagMarks, sse: diagSseRing, history: diagHistRing
      };
      for (var i = 0; i < diagLiveOrder.length; i++) {
        var id = diagLiveOrder[i], r = diagLiveTurns[id];
        if (r) payload.liveTurns[id] = { role: r.role, len: r.len, hash: r.hash, revs: r.revs };
      }
      console.log('[ai-cm-debug][O18][rings] ' + JSON.stringify(payload));
    } catch (e) { console.warn('[ai-cm-debug][O18] ошибка дампа колец:', e); }
  }
  // Дамп на КАЖДЫЙ экспорт: per-turn сравнение live(SSE) vs network(history_messages) vs
  // текущий turnsMap (то, что реально уйдёт в файл) + кольца сырья.
  function diagExportHook(trigger) {
    try {
      if (!diagOn()) return;
      diagExports++;
      var net = diagNetTurns;
      var ids = [], seen = {}, i, id;
      if (net && net.order) {
        for (i = 0; i < net.order.length; i++) { id = net.order[i]; if (!seen[id]) { seen[id] = 1; ids.push(id); } }
      }
      for (i = 0; i < diagLiveOrder.length; i++) { id = diagLiveOrder[i]; if (!seen[id]) { seen[id] = 1; ids.push(id); } }
      var tally = {};
      console.log('[ai-cm-debug][O18][export] ==== EXPORT SNAPSHOT #' + diagExports + ' trigger=' + trigger +
        ' conv=' + (currentConvId || '').slice(0, 8) + ' liveTurns=' + diagLiveOrder.length +
        ' netTurns=' + (net ? net.order.length : 0) + ' netAgeMs=' + (net ? (Date.now() - net.t) : -1) +
        ' netReason=' + (net ? net.reason : '-') + ' ====');
      for (i = 0; i < ids.length; i++) {
        id = ids[i];
        var lv = diagLiveTurns[id] || null;
        var nv = (net && net.map[id]) || null;
        var cv = turnsMap[id] || null;
        var curText = (cv && typeof cv.text === 'string') ? cv.text : null;
        var vLN = diagVerdict(lv ? lv.lastText : null, nv ? nv.text : null);
        var vCN = diagVerdict(curText, nv ? nv.text : null);
        tally[vLN.verdict] = (tally[vLN.verdict] || 0) + 1;
        console.log('[ai-cm-debug][O18][turn] #' + i + ' role=' + ((lv && lv.role) || (nv && nv.role) || (cv && cv.role) || '-') +
          ' id=' + String(id).slice(0, 8) +
          ' live=' + diagStat(lv ? lv.lastText : null) +
          ' net=' + diagStat(nv ? nv.text : null) +
          ' cur=' + diagStat(curText) +
          ' live_vs_net[firstDiff=' + (vLN.firstDiff === null ? '-' : vLN.firstDiff) + ' verdict=' + vLN.verdict +
          ' lost=' + vLN.lost + ' resync=' + (vLN.resync === null ? '-' : vLN.resync) + ']' +
          ' cur_vs_net[firstDiff=' + (vCN.firstDiff === null ? '-' : vCN.firstDiff) + ' verdict=' + vCN.verdict +
          ' lost=' + vCN.lost + ' resync=' + (vCN.resync === null ? '-' : vCN.resync) + ']');
      }
      console.log('[ai-cm-debug][O18][summary] turns=' + ids.length + ' verdicts=' + JSON.stringify(tally) +
        ' ops=' + JSON.stringify(diagOps) + ' sseRing=' + diagSseRing.length + ' histRing=' + diagHistRing.length +
        ' marks=' + diagMarks.length + ' enrich=' + diagEnrich.length +
        ' resync=' + sseResyncCount + '/' + sseResyncBytes + 'b' +
        ' netSync=' + JSON.stringify(netSyncStats));
      // v12 (O-18, фаза 2): приёмка «типов вне белого списка в буфере нет» видна прямо здесь.
      var outside = [];
      for (i = 0; i < sseFragments.length; i++) {
        var ft = String((sseFragments[i] || {}).type || '');
        if (ft && !streamKnownType(ft)) outside.push(ft);
      }
      if (outside.length) console.warn('[ai-cm-debug][O18][WHITELIST] типы вне белого списка: ' + JSON.stringify(outside));
      else console.log('[ai-cm-debug][O18][WHITELIST] frags вне белого списка: нет (типы=' +
        sseFragmentTypes.join(',') + ')');
      diagDumpRings(trigger);
    } catch (e) { console.warn('[ai-cm-debug][O18] ошибка сравнения на экспорте:', e); }
  }
  // Смена чата: кольца и per-turn базы относятся к ОДНОМУ convId — начинаем заново.
  function diagResetForConv(reason, prevConv) {
    try {
      if (!diagOn()) return;
      console.log('[ai-cm-debug][O18][reset] reason=' + reason + ' prevConv=' + String(prevConv || '').slice(0, 8) +
        ' newConv=' + (currentConvId || '').slice(0, 8) + ' dropped: sse=' + diagSseRing.length +
        ' history=' + diagHistRing.length + ' marks=' + diagMarks.length + ' liveTurns=' + diagLiveOrder.length);
      diagSseRing = []; diagHistRing = []; diagMarks = [];
      diagLiveTurns = {}; diagLiveOrder = []; diagNetTurns = null; diagEnrich = [];
      diagOps = { APPEND: 0, SET: 0, other: 0 };
    } catch (e) { /* ignore */ }
  }
  // Ручной дамп из консоли: window.__aiCmDebug.dumpDeepSeekO18('tag')
  try {
    if (!window.__aiCmDebug) window.__aiCmDebug = {};
    window.__aiCmDebug.dumpDeepSeekO18 = function (tag) {
      if (!isDebugEnabled()) {
        console.log('[ai-cm-debug][O18] флаг выключен: sessionStorage.aiCmDebug !== "1"');
        return null;
      }
      diagExportHook('manual:' + (tag || 'dump'));
      return {
        sse: diagSseRing.length, history: diagHistRing.length, marks: diagMarks.length,
        liveTurns: diagLiveOrder.length, netTurns: diagNetTurns ? diagNetTurns.order.length : 0
      };
    };
    // v12 (O-18, фаза 2): воспроизведение состояния буфера СТАРОЙ версии (мусорные «типы»,
    // в которые ушёл контент) — только под aiCmDebug=1. Нужно регресс-фикстурам: они
    // проверяют, что буфер лечится ресинком из сырого кольца, а не остаётся обрезанным.
    // При выключенном флаге функции нет — поведение страницы не меняется.
    window.__aiCmDebug.seedDeepSeekFragmentsO18 = function (frags) {
      if (!isDebugEnabled()) {
        console.log('[ai-cm-debug][O18] флаг выключен: sessionStorage.aiCmDebug !== "1"');
        return null;
      }
      var list = Array.isArray(frags) ? frags : [];
      sseFragments = [];
      sseFragmentTypes = [];
      for (var si = 0; si < list.length; si++) {
        var it = list[si] || {};
        sseFragments.push({ type: String(it.type || ''), content: String(it.content || '') });
        sseFragmentTypes.push(String(it.type || ''));
      }
      return { frags: sseFragments.length, types: sseFragmentTypes.join(',') };
    };
  } catch (e) { /* ignore */ }

      // ---- экспорт: все 26 функций кластера (16 из них ядро зовёт форвардерами) ----
      Fn.isDebugEnabled = isDebugEnabled;
      Fn.getNavigationType = getNavigationType;
      Fn.determineState = determineState;
      Fn.normalizeRole = normalizeRole;
      Fn.buildMessagesFromRaw = buildMessagesFromRaw;
      Fn.buildMessagesFromTurnsMap = buildMessagesFromTurnsMap;
      Fn.collectUsageFieldsVerbatim = collectUsageFieldsVerbatim;
      Fn.fragContentLength = fragContentLength;
      Fn.dumpTurnUsageAtHistoryLoad = dumpTurnUsageAtHistoryLoad;
      Fn.dumpHistorySnapshot = dumpHistorySnapshot;
      Fn.diagOn = diagOn;
      Fn.diagHash6 = diagHash6;
      Fn.diagClip = diagClip;
      Fn.diagPushRing = diagPushRing;
      Fn.diagStat = diagStat;
      Fn.diagFirstDiff = diagFirstDiff;
      Fn.diagVerdict = diagVerdict;
      Fn.diagFragState = diagFragState;
      Fn.diagMark = diagMark;
      Fn.diagChunkRecord = diagChunkRecord;
      Fn.diagHistRecord = diagHistRecord;
      Fn.diagSnapshotNetTurns = diagSnapshotNetTurns;
      Fn.diagLiveTurnRecord = diagLiveTurnRecord;
      Fn.diagDumpRings = diagDumpRings;
      Fn.diagExportHook = diagExportHook;
      Fn.diagResetForConv = diagResetForConv;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekDiag = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-netsync.js ===== */

// =============================================================================
// core/deepseek-netsync.js — Step D.2 (декомпозиция core/deepseek-intercept.js).
// СЕТЕВОЙ ДОЗАПРОС ИСТОРИИ В МОМЕНТ ЭКСПОРТА: СЕКЦИЯ 9C ядра (O-18, фаза 2) —
// live-кэш ходов (liveTurnRecord), решение о дозапросе (netSyncNeeded), per-turn
// выбор live/сеть при композиции файла (exportComposeTurns), приёмка сетевого
// снимка в режиме экспорта (applyExportNetSnapshot), сам дозапрос с жёстким
// таймаутом (exportNetSync) и мост window 'ai-cm-deepseek-net-sync'.
//
// Кластер вынесен из core/deepseek-intercept.js по образцу шага D.1
// (core/deepseek-diag.js). Раньше обе части жили в ОДНОМ IIFE, поэтому кластер
// обращался к состоянию ядра по именам. Теперь у модуля свой IIFE, и состояние
// ядра приходит через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE (важно для производительности). Тела перенесены БАЙТ-В-БАЙТ
// и без префиксов D., но лежат в ДВУХ зонах:
//   • PURE-зона (этот IIFE, до __bind) — собственное состояние модуля, ядру не
//     видимое: NET_SYNC_TIMEOUT_DEFAULT (дефолт жёсткого таймаута дозапроса) и
//     netSyncSeq (счётчик попыток дозапроса, телами не читается).
//   • BIND-зона ('with (D) { … }' внутри __bind) — тела, читающие живое состояние
//     и функции ядра: liveTurnRecord, netSyncNeeded, exportComposeTurns,
//     applyExportNetSnapshot, exportNetSync и мост 'ai-cm-deepseek-net-sync'.
// ПОЧЕМУ ТАК: внутри with каждый свободный идентификатор резолвится ДИНАМИЧЕСКИ
// (ES3 Annex B) — урок D.1: горячий цикл FNV-хеша в with деградирует ~в 40 раз
// (200×200 КБ: 81 мс вне with против 3309 мс в with; живой стенд o18-frag-resync
// 1.3 с → 5.1 с при возврате таких тел в with). В K7 перебайтовых циклов нет:
// хэширование живёт в PURE-зоне core/deepseek-diag.js (diagVerdict зовётся отсюда
// через форвардер ядра), а циклы K7 идут ПО ХОДАМ (единицы на экспорт), не по
// байтам. Поэтому все 5 тел — BIND, а PURE держит только константы модуля.
// Байтовая идентичность тел сохранена в обеих зонах.
//
// Состояние сетевого дозапроса (liveTurns, liveTurnOrder, netSnapshotAt, netTurnIds,
// lastTurnDoneAt, netSyncStats) ОСТАЛОСЬ В ЯДРЕ: его читают и пишут оставшиеся
// секции (resetForNewConversation — сброс на смену чата; ingestHistory — приёмка
// сетевого снимка; finishSseStream — lastTurnDoneAt; диагностика — ro-геттеры).
// Ядро отдаёт его rw-парами, поэтому «длиннее побеждает» (O-16) и ONE-SIDE-доливка
// видят ТОТ ЖЕ объект, что и ядро, а не копию. orderCounter (per-turn порядок в
// файле), ingestMode и exportSyncTruncated (режим экспортного ingest) — тоже rw:
// тела их перезаписывают ('orderCounter++', 'ingestMode = "export-sync"',
// 'exportSyncTruncated = false'); без сеттера запись молча терялась бы (sloppy),
// и порядок ходов в файле перестал бы расти.
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v4',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js -> ЭТОТ ФАЙЛ ->
// core/deepseek-intercept.js. До связки на window.AiCmDeepseekNetsync лежит только
// __bind; после связки Fn заполнен 5 функциями, а ядро раздаёт 2 из них
// форвардерами по прежним именам (liveTurnRecord, netSyncNeeded — function
// declaration, хойстятся). Экспорт: window.AiCmDeepseekNetsync + module.exports.
// =============================================================================

(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekNetsync) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: собственное состояние модуля, ядру не видимое ----
  // ===== СЕКЦИЯ 9C (O-18, ФАЗА 2): СЕТЕВОЙ ДОЗАПРОС ИСТОРИИ В МОМЕНТ ЭКСПОРТА =====
  // Мост: ISOLATED (core/base-handler.js: aiCmExportNetSyncThen) →
  //   'ai-cm-deepseek-net-sync' {requestId, convId, timeoutMs}
  //   ← 'ai-cm-deepseek-net-sync-done' {requestId, ok, reason, refetched, netTurns, verdicts}
  // Правило: ПЕРЕД композицией файла (авто и ручной экспорт) история текущего чата
  // запрашивается по сети, если снимок сети пуст ИЛИ старше последнего завершённого хода.
  // Таймаут (по умолчанию 3 с) — жёсткий: не дождались/сети нет → прежний live-путь.
  var NET_SYNC_TIMEOUT_DEFAULT = 3000;

  var netSyncSeq = 0;

  // v2.0.29 (Xray/Firefox): detail моста ISOLATED→MAIN приходит СТРОКОЙ (JSON.stringify в
  // content-скрипте). Объект чужого компартмента Firefox отдаёт MAIN-миру под Xray-обёрткой,
  // и чтение его полей падает «Permission denied to access property» — мост терял событие.
  // Строка — примитив: границу миров пересекает без обёртки. Объект принимаем как есть —
  // так остаются живыми старые отправители и тестовые фикстуры jsdom.
  function aiCmBridgeDetail(ev) {
    var raw = (ev && ev.detail !== undefined) ? ev.detail : null;
    if (typeof raw !== 'string') return raw || null;
    try { return JSON.parse(raw); } catch (eBd) { return null; }
  }

  function __bind(d) {
    D = d;
    with (D) {
      // ---- BIND-зона: тела, читающие живое состояние/функции ядра через with (D) ----

  // LIVE-текст хода: пишется на КАЖДОЙ финализации потока (не только под флагом диагностики).
  // «Длиннее побеждает» — та же монотонность, что у обогащения хода (O-16): усечённая
  // ревизия не может вытеснить полную.
  function liveTurnRecord(id, role, text, answer, reasoning, modelSlug) {
    try {
      var key = String(id || '');
      if (!key || !text) return;
      var prev = liveTurns[key];
      if (!prev) liveTurnOrder.push(key);
      if (prev && String(prev.text || '').length > String(text).length) return;
      liveTurns[key] = {
        role: role, text: String(text), answer: String(answer || ''), reasoning: String(reasoning || ''),
        modelSlug: modelSlug || '', ts: Date.now() / 1000
      };
    } catch (e) { swallowSoft(e, 'deepseek:liveTurnRecord'); }
  }
  // Нужен ли сетевой дозапрос: сети не было / снимок старше последнего завершённого хода /
  // снимок не покрывает live-ходы.
  function netSyncNeeded() {
    try {
      if (!liveTurnOrder.length) return false;        // live-ходов нет: база и так сетевая
      if (!netSnapshotAt) return true;                // сети не было вовсе
      if (netSnapshotAt < lastTurnDoneAt) return true; // снимок старше последнего хода
      for (var i = 0; i < liveTurnOrder.length; i++) {
        if (!netTurnIds[liveTurnOrder[i]]) return true;   // хода нет в снимке сети
      }
      return false;
    } catch (e) { return false; }
  }
  // Per-turn выбор текста: EQUAL → live (байт-в-байт то же); MIDDLE-HOLE*/TAIL-CUT → сетевой
  // (он полнее: live потерял середину/хвост — сигнатура O-18); LIVE-EXTRA/DIFF-OTHER → live
  // (сеть короче либо различие не классифицировано — молча не заменяем); ONE-SIDE → live.
  // LIVE-ANSWER-EMPTY (Firefox): live-ход финализировался с ПУСТЫМ answer (гонка пустого
  // ответа), а сетевой снимок несёт непустой ответ — сетевой текст хода НЕ затирается.
  function exportComposeTurns() {
    var verdicts = {};
    var bump = function (v) { verdicts[v] = (verdicts[v] || 0) + 1; };
    try {
      var ids = Object.keys(turnsMap);
      var i, id, t, lv, v;
      for (i = 0; i < ids.length; i++) {
        id = ids[i]; t = turnsMap[id]; lv = liveTurns[id];
        if (!t) continue;
        if (!lv) { bump('ONE-SIDE'); continue; }                    // ход только из сети
        // Firefox: live-ход финализировался с пустым answer (гонка пустого ответа), а
        // сетевой снимок ответ нёс — сетевой текст хода не затираем (LIVE-ANSWER-EMPTY).
        // Пробельный answer ответом не считается: пустая строка и одни пробелы — одно и то же.
        if (String(lv.answer || '').trim() === '' && String(t.answer || '').trim() !== '') {
          bump('LIVE-ANSWER-EMPTY');
          console.log('[deepseek-intercept] экспорт: ход ' + String(id).slice(0, 8) +
            ' — live answer пуст, но сетевой ответ непустой (LIVE-ANSWER-EMPTY), берём сеть');
          continue;                                                  // остаётся сетевой текст
        }
        v = diagVerdict(lv.text, t.text);                            // lt=live, nt=net
        bump(v.verdict);
        if (v.verdict === 'MIDDLE-HOLE' || v.verdict === 'MIDDLE-HOLE-PARTIAL' || v.verdict === 'TAIL-CUT') {
          console.log('[deepseek-intercept] экспорт: ход ' + String(id).slice(0, 8) + ' — сетевой текст полнее live (' +
            v.verdict + ', live=' + lv.text.length + ' net=' + t.text.length + '), берём сеть');
          continue;                                                  // остаётся сетевой текст
        }
        t.text = lv.text; t.answer = lv.answer; t.reasoning = lv.reasoning;
        if (lv.modelSlug) t.modelSlug = lv.modelSlug;
      }
      // Ходы, которых в сети НЕТ вовсе (ONE-SIDE): доливаем live-текст в конец базы.
      for (i = 0; i < liveTurnOrder.length; i++) {
        id = liveTurnOrder[i];
        if (turnsMap[id]) continue;
        lv = liveTurns[id];
        if (!lv) continue;
        bump('ONE-SIDE'); netSyncStats.oneSide++;
        turnsMap[id] = {
          text: lv.text, answer: lv.answer, reasoning: lv.reasoning, modelSlug: lv.modelSlug,
          order: orderCounter++, ts: lv.ts, role: lv.role
        };
        console.log('[deepseek-intercept] экспорт: ход ' + String(id).slice(0, 8) +
          ' есть только в live-базе (ONE-SIDE, сети нет) — в файл идёт live-текст ' + lv.text.length + ' симв.');
      }
    } catch (e) { swallowSoft(e, 'deepseek:exportComposeTurns'); }
    return verdicts;
  }
  // Приёмка сетевого снимка в режиме экспорта: форсированный ingestHistory + per-turn выбор.
  function applyExportNetSnapshot(json, convId) {
    var res = { ok: false, reason: 'rejected', verdicts: {} };
    try {
      if (!json || json.code !== 0) return res;
      var bd = json.data && json.data.biz_data;
      var cms = bd && Array.isArray(bd.chat_messages) ? bd.chat_messages : null;
      if (!bd || !bd.chat_session || !cms) return res;
      diagHistRecord(json, 'export-net-sync');
      if (!cms.length) {
        // Сети нет: авторитетно пустая история (SPA-созданный чат) — базу НЕ трогаем,
        // файл собирается live-путём, как и раньше. Маркер — в лог.
        netSyncStats.empty++;
        console.log('[deepseek-intercept] экспорт: history_messages пуста (чат без истории в сети) → ' +
          'файл из live-базы, ходов live=' + liveTurnOrder.length + ' (ONE-SIDE)');
        res.ok = false; res.reason = 'empty';
        res.verdicts = { 'ONE-SIDE': liveTurnOrder.length };
        return res;
      }
      var prevComplete = histCompletion.historyComplete === true;
      var prevReached = histCompletion.reachedRoot === true;
      ingestMode = 'export-sync';
      exportSyncTruncated = false;
      try { ingestHistory(json); } finally { ingestMode = ''; }
      if (exportSyncTruncated) {
        // Усечённый снимок не принят (см. ingestHistory): база осталась live-базой.
        netSyncStats.failed++;
        res.ok = false; res.reason = 'truncated';
        res.verdicts = { 'ONE-SIDE': liveTurnOrder.length };
        return res;
      }
      // Дозапрос в момент экспорта не ПОНИЖАЕТ вердикт полноты (O-17): база уже была
      // признана полной — сеть здесь лишь уточняет тексты ходов.
      if (prevComplete && !histCompletion.historyComplete) {
        histCompletion.historyComplete = true;
        histCompletion.reachedRoot = prevReached || histCompletion.reachedRoot;
      }
      res.verdicts = exportComposeTurns();
      var turns = Object.keys(turnsMap).length;
      // O-22 (ИЗМЕРЕНИЕ-2): маркер ТОЧКИ диспатча ai-cm-full-history (site=S1467).
      try {
        if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
          diagMark('o22-dispatch-site', {
            site: 'S1467', ts: Date.now(),
            count: turns, textLen: '(вне области)'
          });
        }
      } catch (eO22s1467) { /* ignore */ }
      emitBaseSnapshot(Math.max(lastBaseServerTokens || 0, sseRealtimeFinalTokens || 0), sseModelType || lastBaseChatMode);
      res.ok = turns > 0; res.reason = 'merged';
      console.log('[deepseek-intercept] экспорт: сетевой дозапрос применён — ходов в базе=' + turns +
        ', вердикты=' + JSON.stringify(res.verdicts));
    } catch (e) {
      res.ok = false; res.reason = 'error';
    }
    return res;
  }
  function exportNetSync(requestId, convId, timeoutMs) {
    var cap = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : NET_SYNC_TIMEOUT_DEFAULT;
    var done = false;
    var timer = null;
    netSyncStats.calls++;
    diagMark('export-net-sync', {
      conv: String(convId || '').slice(0, 8), needed: netSyncNeeded(),
      live: liveTurnOrder.length, netAt: netSnapshotAt
    });
    function reply(status) {
      if (done) return;
      done = true;
      try { clearTimeout(timer); } catch (eT) { /* ignore */ }
      try {
        window.dispatchEvent(new CustomEvent('ai-cm-deepseek-net-sync-done', {
          detail: {
            requestId: String(requestId || ''), convId: String(convId || ''),
            ok: status.ok === true, reason: String(status.reason || ''),
            refetched: status.refetched === true,
            netTurns: Object.keys(netTurnIds).length,
            liveTurns: liveTurnOrder.length,
            verdicts: status.verdicts || {}
          }
        }));
      } catch (eD) { swallowSoft(eD, 'deepseek:exportNetSync-reply'); }
    }
    timer = setTimeout(function () { netSyncStats.timeout++; reply({ ok: false, reason: 'timeout' }); }, cap);
    try {
      if (!convId || convId !== currentConvId) { reply({ ok: false, reason: 'conv-mismatch' }); return; }
      if (!netSyncNeeded()) {
        netSyncStats.fresh++;
        reply({ ok: true, reason: 'fresh' });      // снимок сети свежий и покрывает live-ходы
        return;
      }
      var url = historyRefetchUrl();
      netSyncStats.fetched++;
      console.log('[deepseek-intercept] экспорт: сетевой дозапрос истории (convId=' +
        String(convId).slice(0, 8) + ', live-ходов=' + liveTurnOrder.length + ', снимок сети=' +
        (netSnapshotAt ? 'старше хода' : 'отсутствует') + ')');
      var p;
      try {
        p = originalFetch.call(window, url, { method: 'GET', headers: lastAuthHeaders || {} });
      } catch (eF) { netSyncStats.failed++; reply({ ok: false, reason: 'fetch-throw' }); return; }
      p.then(function (r) { return (r && r.ok) ? r.json() : null; })
        .then(function (json) {
          if (done) return;
          if (!json) { netSyncStats.failed++; reply({ ok: false, reason: 'http' }); return; }
          var applied = applyExportNetSnapshot(json, convId);
          if (applied.ok) netSyncStats.ok++;
          reply({ ok: applied.ok, reason: applied.reason, refetched: true, verdicts: applied.verdicts });
        })
        .catch(function () {
          if (done) return;
          netSyncStats.failed++;
          aiCmDiagWarn('deepseek:exportNetSync', '[deepseek-intercept] экспорт: сетевой дозапрос не удался → прежний live-путь');
          reply({ ok: false, reason: 'error' });
        });
    } catch (e0) {
      reply({ ok: false, reason: 'error' });
    }
  }
  try {
    window.addEventListener('ai-cm-deepseek-net-sync', function (ev) {
      try {
        var d = aiCmBridgeDetail(ev) || {};
        exportNetSync(d.requestId, d.convId || currentConvId || getConvId() || '', d.timeoutMs);
      } catch (eNs) { swallowSoft(eNs, 'deepseek:netSyncBridge'); }
    });
  } catch (eNetBridge) { /* ignore */ }

      Fn.liveTurnRecord = liveTurnRecord;
      Fn.netSyncNeeded = netSyncNeeded;
      Fn.exportComposeTurns = exportComposeTurns;
      Fn.applyExportNetSnapshot = applyExportNetSnapshot;
      Fn.exportNetSync = exportNetSync;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekNetsync = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-refetch.js ===== */

// =============================================================================
// core/deepseek-refetch.js — Step D.3 (декомпозиция core/deepseek-intercept.js).
// K8: REFETCH/URL-ГИГИЕНА — СЕКЦИЯ 10 (гард перекрёста chat_session_id vs currentConvId:
// convIdFromHistoryUrl, convIdFromCompletionBody, guardCheck) и СЕКЦИЯ 10B (хелперы
// MERGE-дозапроса: collectHeaders, stripCacheParams, historyRefetchUrl, historyUrlForConv,
// refetchFullHistory, scheduleHistoryRefetch) + таймер historyRefetchTimer.
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js) и D.2
// (core/deepseek-netsync.js). Раньше обе части жили в ОДНОМ IIFE, поэтому кластер
// обращался к состоянию ядра по именам. Теперь у модуля свой IIFE, и состояние ядра
// приходит через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D., но лежат в
// ДВУХ зонах:
//   • PURE-зона (этот IIFE, до __bind) — тела, которым ядро НЕ нужно:
//     convIdFromHistoryUrl и convIdFromCompletionBody (извлечение convId из URL/тела),
//     collectHeaders (сбор заголовков запроса), stripCacheParams (URL-гигиена) и
//     historyUrlForConv (зовёт первые два) — плюс собственное состояние модуля
//     historyRefetchTimer, ядру не видимое.
//   • BIND-зона ('with (D) { … }' внутри __bind) — тела, читающие живое состояние и
//     функции ядра: guardCheck (currentConvId), historyRefetchUrl (currentConvId),
//     refetchFullHistory (diagMark, originalFetch, ingestHistory, currentConvId) и
//     scheduleHistoryRefetch (lastLoadedConvId, lastAuthHeaders).
// ПОЧЕМУ ТАК: внутри with каждый свободный идентификатор резолвится ДИНАМИЧЕСКИ
// (ES3 Annex B) — урок D.1: горячий цикл FNV-хеша в with деградирует ~в 40 раз
// (200×200 КБ: 81 мс вне with против 3309 мс в with). В K8 перебайтовых циклов нет
// (проходы идут по заголовкам и ключам — единицы элементов), поэтому критерий зоны
// здесь — ЗАВИСИМОСТЬ ОТ ЯДРА, а не скорость: пять тел, которым ядро не нужно,
// вынесены в PURE. Байтовая идентичность тел сохранена в обеих зонах.
//
// Состояние refetch-гигиены (lastAuthHeaders, lastHistoryUrl, historyRefetchDone) и
// lastLoadedConvId ОСТАЛИСЬ В ЯДРЕ: их пишут оставшиеся секции (resetForNewConversation —
// сброс на смену чата; fetch-хук и XHR-копилка K9/K11 — lastAuthHeaders/lastHistoryUrl;
// приём снимка истории и детекторы усечения — lastLoadedConvId/historyRefetchDone).
// Ядро отдаёт lastAuthHeaders/lastHistoryUrl/historyRefetchDone rw-парами: модуль —
// владелец семантики refetch-состояния и пишет их наравне с ядром, поэтому без сеттера
// запись из модуля молча терялась бы (sloppy), а «длиннее побеждает» на этих полях
// расходилось бы между копиями. lastLoadedConvId — ro: модуль его только читает.
// historyRefetchTimer переехал в модуль целиком — его не читает и не пишет ни одна
// оставшаяся секция ядра.
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v5',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> ЭТОТ ФАЙЛ -> core/deepseek-intercept.js. До связки на
// window.AiCmDeepseekRefetch лежит только __bind; после связки ядро раздаёт 7 из 9
// функций форвардерами по прежним именам (convIdFromHistoryUrl, convIdFromCompletionBody,
// guardCheck, collectHeaders, historyRefetchUrl, refetchFullHistory, scheduleHistoryRefetch —
// function declaration, хойстятся). stripCacheParams и historyUrlForConv наружу не
// выдаются: их зовут только тела этого модуля (historyUrlForConv — из BIND-зоны
// refetchFullHistory, через PURE-зону).
// Экспорт: window.AiCmDeepseekRefetch + module.exports.
// =============================================================================

(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekRefetch) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: тела без зависимости от ядра; состояние модуля, ядру не видимое ----
  // ===== СЕКЦИЯ 10: ГАРД ПЕРЕКРЁСТА (chat_session_id vs currentConvId) =====
  function convIdFromHistoryUrl(url) {
    try {
      var m = url.match(/[?&]chat_session_id=([A-Za-z0-9_-]+)/);
      return m ? m[1] : '';
    } catch (e) { return ''; }
  }

  function convIdFromCompletionBody(bodyStr) {
    try {
      if (typeof bodyStr !== 'string' || !bodyStr) return '';
      var obj = JSON.parse(bodyStr);
      return obj.chat_session_id || '';
    } catch (e) { return ''; }
  }

  // ===== СЕКЦИЯ 10B: ХЕЛПЕРЫ ДЛЯ MERGE-ДОЗАПРОСА =====

  // Сбор заголовков из fetch-запроса в plain object (поддержка Headers, Array, Object)
  function collectHeaders(input, init) {
    var h = {};
    try {
      var src = (init && init.headers) || (input && input.headers ? input.headers : null);
      if (!src) return h;
      // Headers-объект (forEach существует)
      if (typeof src.forEach === 'function') {
        src.forEach(function (v, k) { h[k] = v; });
      } else if (Array.isArray(src)) {
        for (var i = 0; i < src.length; i++) {
          if (Array.isArray(src[i]) && src[i].length >= 2) h[src[i][0]] = src[i][1];
        }
      } else if (typeof src === 'object') {
        var keys = Object.keys(src);
        for (i = 0; i < keys.length; i++) {
          h[keys[i]] = src[keys[i]];
        }
      }
    } catch (e) { /* ignore */ }
    return h;
  }

  // Удаление cache_version и cache_reset_at из URL (оставляем chat_session_id и всё остальное)
  function stripCacheParams(url) {
    try {
      var u = new URL(url, location.origin);
      u.searchParams.delete('cache_version');
      u.searchParams.delete('cache_reset_at');
      return u.toString();
    } catch (e) {
      return url.replace(/[?&]cache_(version|reset_at)=[^&]*/g, '').replace(/\?$/, '');
    }
  }

  // URL пригоден для дозапроса, только если он про историю И про ЭТОТ чат.
  // v11 (O-17): после SPA-перехода lastHistoryUrl хранит запрос ПРЕДЫДУЩЕГО чата —
  // его использование вливало в базу текущего чата чужую историю (ingestHistory идёт
  // без conv-гарда: гард стоит на вызывающей стороне).
  function historyUrlForConv(url, convId) {
    try {
      if (typeof url !== 'string' || url.indexOf('history_messages') === -1) return '';
      var urlConv = convIdFromHistoryUrl(url);
      if (!urlConv) return '';                    // чат в URL не назван — берём канонический
      if (convId && urlConv !== convId) return '';
      return stripCacheParams(url);
    } catch (e) { return ''; }
  }

  // ---- PURE-состояние модуля: таймер дозапроса после смены чата ----
  // Переехал из ядра (K8): тела scheduleHistoryRefetch единственные, кто его читает
  // и пишет; ни одна оставшаяся секция ядра к нему не обращается.
  var historyRefetchTimer = null;

  function __bind(d) {
    D = d;
    with (D) {
      // ---- BIND-зона: тела, читающие живое состояние/функции ядра через with (D) ----

  function guardCheck(reqConvId) {
    if (!reqConvId) return true;   // не удалось извлечь — пропускаем (не блокируем)
    if (reqConvId !== currentConvId) {
      console.log('[deepseek-intercept] пропущен ответ (convId запроса ' + reqConvId + ' != текущий ' + currentConvId + ')');
      return false;
    }
    return true;
  }

  // v11 (O-17): КАНОНИЧЕСКИЙ URL полной истории текущего чата (без cache-параметров).
  // Единственный источник для обоих дозапросов (таймер после SPA-смены чата и детектор
  // усечения/MERGE) — чужой URL в базу попасть не может по построению.
  function historyRefetchUrl() {
    return location.origin + '/api/v0/chat/history_messages?chat_session_id=' + encodeURIComponent(currentConvId);
  }

  // Тихий повторный запрос полной истории БЕЗ cache_version/cache_reset_at
  // Использует originalFetch (нативный fetch ДО нашей обёртки) — рекурсия исключена по построению
  function refetchFullHistory(originalUrl, authHeaders, convId) {
    if (!convId || convId !== currentConvId) { return; }
    // v11 (O-17): берём переданный URL ТОЛЬКО если он про этот же чат, иначе — канонический
    var cleanUrl = historyUrlForConv(originalUrl, convId) || historyRefetchUrl();
    diagMark('refetch-full-history', { conv: String(convId).slice(0, 8) });   // O-18 (ИЗМЕРЕНИЕ)
    originalFetch.call(window, cleanUrl, {
      method: 'GET',
      headers: authHeaders || {}
    }).then(function (r) {
      if (r && r.ok) return r.json();
      return null;
    }).then(function (json) {
      if (json && convId === currentConvId) {
        ingestHistory(json);
      }
    }).catch(function (e) {
      aiCmDiagWarn('deepseek:refetchFullHistory', '[deepseek-intercept] refetchFullHistory ошибка:', e);
    });
  }

  // Таймер-дозапрос после смены чата (если сайт не прислал историю сам)
  function scheduleHistoryRefetch() {
    try { clearTimeout(historyRefetchTimer); } catch (e) { /* ignore */ }
    historyRefetchTimer = setTimeout(function () {
      try {
        if (currentConvId && currentConvId !== lastLoadedConvId && lastAuthHeaders && (lastAuthHeaders.Authorization || lastAuthHeaders.authorization)) {
          console.log('[deepseek-intercept] история не пришла после смены чата → тихий дозапрос по таймеру (convId=' + currentConvId + ')');
          refetchFullHistory(historyRefetchUrl(), lastAuthHeaders, currentConvId);   // v11 (O-17): канонический URL
        }
      } catch (e) { swallowSoft(e, 'deepseek:scheduleHistoryRefetch'); }
    }, 1000);
  }

      Fn.convIdFromHistoryUrl = convIdFromHistoryUrl;
      Fn.convIdFromCompletionBody = convIdFromCompletionBody;
      Fn.guardCheck = guardCheck;
      Fn.collectHeaders = collectHeaders;
      Fn.stripCacheParams = stripCacheParams;
      Fn.historyRefetchUrl = historyRefetchUrl;
      Fn.historyUrlForConv = historyUrlForConv;
      Fn.refetchFullHistory = refetchFullHistory;
      Fn.scheduleHistoryRefetch = scheduleHistoryRefetch;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekRefetch = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-parse.js ===== */

// =============================================================================
// core/deepseek-parse.js — Step D.4 (декомпозиция core/deepseek-intercept.js).
// K3+K4: ЦЕПОЧКА + ТЕКСТ ХОДА + MODEL-ХЕЛПЕР — СЕКЦИЯ 5 (getModelSlug: slug модели хода
// по сетевым сигналам K0 с фолбэком по thinking_enabled), СЕКЦИЯ 6 (buildActiveChain:
// walk по parent_id, ловушка №1), СЕКЦИЯ 7 (collectTurnText / collectTurnReasoning /
// composeTurnText: сборка текста хода по type фрагментов, а не по их порядку) и
// hidden-пометки базы (DS_PP_VISIBLE_MARKER + hasInjectedUserPrompt, v13/O-7).
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js), D.2
// (core/deepseek-netsync.js) и D.3 (core/deepseek-refetch.js). Раньше все части жили в
// ОДНОМ IIFE, поэтому кластер обращался к состоянию ядра по именам. Теперь у модуля свой
// IIFE, и зависимости ядра приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D., но лежат в
// ДВУХ зонах:
//   • PURE-зона (этот IIFE, до __bind) — тела, которым ядро НЕ нужно: buildActiveChain
//     (обход parent_id по переданным аргументам), collectTurnText и collectTurnReasoning
//     (проход по фрагментам хода) и hasInjectedUserPrompt (поиск маркера в строке) —
//     плюс константы кластера REASONING_TAG/ANSWER_TAG, переехавшие из СЕКЦИИ 1 ядра.
//   • BIND-зона ('with (D) { … }' внутри __bind) — тела, читающие ядро: getModelSlug
//     (зовёт K0-резолвер __aiCmDeepseekResolveModelSlug) и composeTurnText (гейт
//     REASONING_ENABLED).
// ПОЧЕМУ ТАК: внутри with каждый свободный идентификатор резолвится ДИНАМИЧЕСКИ
// (ES3 Annex B) — урок D.1: горячий цикл FNV-хеша в with деградирует ~ в 40 раз
// (200×200 КБ: 81 мс вне with против 3309 мс в with). В K3/K4 критерий тот же, что и в
// D.1: три тела работают в ГОРЯЧИХ циклах (buildActiveChain — обход всех ходов чата на
// каждом ingest истории, collectTurnText/collectTurnReasoning — проход по всем фрагментам
// хода на каждой финализации потока), поэтому они лежат В PURE, вне with. В BIND остались
// ровно два тела, которые действительно читают ядро, и оба зовутся один раз на ход
// (композиция текста хода), а не на фрагмент. Байтовая идентичность тел сохранена в
// обеих зонах.
//
// КОНСТАНТЫ. REASONING_TAG/ANSWER_TAG уехали В МОДУЛЬ целиком: их читает только
// composeTurnText, и после выноса в ядре не осталось ни одного обращения к ним (пин
// tests/adapters/deepseek-o17-spa-chat.test.js ищет литералы в КОНКАТЕНАЦИИ js[] —
// tests/helpers/deepseek-intercept-source.js — и видит их здесь). REASONING_ENABLED
// ОСТАЛСЯ В ЯДРЕ: его читают оставшиеся секции (приём снимка истории и SSE-финализация —
// K5/K7) и он входит в контракт диагностики D.1 ro-геттером; модуль получает его
// ro-геттером и видит ТУ ЖЕ переменную ядра, а не копию значения. DS_PP_VISIBLE_MARKER
// переехал вместе с hasInjectedUserPrompt — других читателей у маркера нет.
//
// СОСТОЯНИЕ: у кластера его нет вовсе (K3/K4 — чистые функции: аргументы на входе,
// значение на выходе), поэтому в контракте нет ни fn-передач, ни rw-пар: только два
// ro-геттера (REASONING_ENABLED и __aiCmDeepseekResolveModelSlug — K0, чистый резолвер
// slug, объявленный ВНЕ IIFE ядра и остающийся там). Ни одного rw-пересечения с ядром у
// модуля нет: писать ему нечего.
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v6',
// document_start, world MAIN): utils/debug.js -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> ЭТОТ ФАЙЛ ->
// core/deepseek-intercept.js. До связки на window.AiCmDeepseekParse лежит только __bind;
// после связки ядро раздаёт ВСЕ 6 тел форвардерами по прежним именам (buildActiveChain,
// collectTurnText, collectTurnReasoning, composeTurnText, hasInjectedUserPrompt,
// getModelSlug — function declaration, хойстятся: вызовы в ingestHistory, композиции ходов
// и SSE-финализации выше по файлу не тронуты).
// Экспорт: window.AiCmDeepseekParse + module.exports.
// =============================================================================

(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekParse) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: тела без зависимости от ядра; состояние модуля отсутствует ----
  // ---- Константы кластера: переехали из СЕКЦИИ 1 ядра (K4, Step D.4) ----
  // Их читает только composeTurnText (BIND-зона): внутри with имя, которого нет в D,
  // резолвится в скоуп этого IIFE. REASONING_ENABLED остался в ядре и приходит ro-геттером.
  var REASONING_TAG = '[REASONING]';
  var ANSWER_TAG = '[ANSWER]';

  // ===== СЕКЦИЯ 6: АКТИВНАЯ ЦЕПОЧКА (walk по parent_id, ловушка №1) =====
  // v6: возвращает { chain, truncated }
  //   - truncated = false: дошли до корня (parent_id === null/undefined) — норма
  //   - truncated = true: walk остановился, потому что следующий parent_id не null,
  //     но сообщения с таким id нет в messagesById — цепочка оборвана (усечение)
  function buildActiveChain(chatSession, messagesById) {
    var chain = [];
    var currentId = chatSession.current_message_id;
    var visited = {};
    var truncated = false;
    // v7: reachedRoot — true, когда обход довёл цепочку до корня (узел без parent_id),
    // т.е. цикл завершился по исчерпанию parent_id, а не по обрыву/циклу/пустой цепочке
    var reachedRoot = false;
    while (currentId != null && currentId !== undefined) {
      var msg = messagesById[currentId];
      if (!msg) {
        // parent_id не null, но сообщение отсутствует в полученном chat_messages → усечение
        truncated = true;
        break;
      }
      if (visited[currentId]) break;   // защита от циклов
      visited[currentId] = true;
      chain.push(msg);
      currentId = msg.parent_id;
    }
    reachedRoot = !truncated && chain.length > 0 && (currentId == null || currentId === undefined);
    chain.reverse();
    // v7: sort по inserted_at УБРАН. WHY:
    //  (1) inserted_at — ISO-строка ('2026-08-29T..Z'), вычитание строк даёт NaN →
    //      компаратор недетерминирован, порядок зависит от реализации sort;
    //  (2) внутри пары (user,assistant одного хода) серверный inserted_at ставит
    //      assistant РАНЬШЕ user → сортировка ИНВЕРТИРУЕТ пару (a,u,a,u вместо u,a,u,a).
    //  Единственный источник хронологии — обход parent_id + chain.reverse() выше.
    return { chain: chain, truncated: truncated, reachedRoot: reachedRoot };
  }

  // ===== СЕКЦИЯ 7: СБОР ТЕКСТА ХОДА (по type, не по порядку фрагментов) =====
  // v8: ответ хода — ТОЛЬКО фрагменты RESPONSE; THINK собирается отдельно (collectTurnReasoning).
  function collectTurnText(fragments, role) {
    var types = (role === 'USER') ? ['REQUEST'] : ['RESPONSE'];
    var parts = [];
    for (var i = 0; i < fragments.length; i++) {
      var f = fragments[i];
      if (types.indexOf(f.type) !== -1 && typeof f.content === 'string') {
        parts.push(f.content);
      }
      // TIP — всегда игнорируем
    }
    return parts.join('').trim();
  }

  // v8 (O-7): reasoning хода — фрагменты type === 'THINK' (цепочка рассуждений DeepSeek).
  // У USER-хода reasoning нет по определению. TIP/TEMPLATE_RESPONSE игнорируем.
  function collectTurnReasoning(fragments, role) {
    if (role === 'USER') return '';
    var parts = [];
    for (var i = 0; i < fragments.length; i++) {
      var f = fragments[i];
      if (f && f.type === 'THINK' && typeof f.content === 'string') {
        parts.push(f.content);
      }
    }
    return parts.join('').trim();
  }

  // v13 (O-7): HIDDEN-ПОМЕТКИ БАЗЫ (текст хода при этом НЕ меняется ни байтом).
  // reasoning хода уже лежит в тексте секциями [REASONING]/[ANSWER] (v8) — здесь он
  // ДОПОЛНИТЕЛЬНО помечается полем hiddenReasoning: одно имя поля для ОБОИХ путей захвата
  // (сеть + DOM-адаптер), которое читает сырой режим экспорта
  // (utils/export-emit-pipeline.js:includeHiddenExportBlocks) при включённом тумблере
  // aiCmIncludeHiddenInExport. Метрики/токены hidden-поля не видят: они считаются по
  // тексту хода (messageTexts), а не по пометкам.
  // Инъекции DeepSeek++ в user-ходе помечаются флагом hiddenInjection: текст остаётся
  // КАК ЕСТЬ, а вырезает инъекции санация O-20 на выходе экспорта (при выключенном тумблере).
  var DS_PP_VISIBLE_MARKER = 'deepseek-pp-visible-user-prompt:start';
  function hasInjectedUserPrompt(text) {
    return typeof text === 'string' && text.indexOf(DS_PP_VISIBLE_MARKER) !== -1;
  }

  function __bind(d) {
    D = d;
    with (D) {
      // ---- BIND-зона: тела, читающие ядро через with (D) ----

  // ===== СЕКЦИЯ 5: МОДЕЛЬ (v13: сетевые сигналы контракта, затем фолбэк по thinking_enabled) =====
  /**
   * Slug модели хода: сначала сигналы нового сетевого контракта, затем прежний фолбэк.
   * @param {boolean} thinkingEnabled
   * @param {AiCmDeepSeekModelSignals} [signals]
   * @returns {string}
   */
  function getModelSlug(thinkingEnabled, signals) {
    var networkSlug = __aiCmDeepseekResolveModelSlug(signals);
    if (networkSlug) return networkSlug;
    return thinkingEnabled === true ? 'deepseek-r1' : 'deepseek-v3';
  }

  // v8 (O-7): формат экспортного текста хода с reasoning:
  //   [REASONING]\n<рассуждение>\n\n[ANSWER]\n<ответ>
  // Нет reasoning (или фича выключена) → текст хода байтово прежний (только ответ).
  function composeTurnText(answer, reasoning) {
    if (!REASONING_ENABLED || !reasoning) return answer;
    return REASONING_TAG + '\n' + reasoning + '\n\n' + ANSWER_TAG + '\n' + answer;
  }

      Fn.buildActiveChain = buildActiveChain;
      Fn.collectTurnText = collectTurnText;
      Fn.collectTurnReasoning = collectTurnReasoning;
      Fn.composeTurnText = composeTurnText;
      Fn.hasInjectedUserPrompt = hasInjectedUserPrompt;
      Fn.getModelSlug = getModelSlug;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekParse = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-conv.js ===== */

// =============================================================================
// core/deepseek-conv.js — Step D.5 (декомпозиция core/deepseek-intercept.js).
// K1: CONV ID + ДЕТЕКТОР СМЕНЫ ЧАТА (СЕКЦИЯ 3 ядра, строки 244-338 HEAD 6c899fd,
// ~95 строк) — getConvId (парсер /a/chat/s/<id> и /a/chat/<id> из location.pathname),
// resetForNewConversation (полный сброс состояния перехватчика на смену разговора),
// checkConvChange (сравнение свежего convId с текущим) и патчи history.pushState /
// history.replaceState / window.popstate, которые этот детектор взводят.
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js), D.2
// (core/deepseek-netsync.js), D.3 (core/deepseek-refetch.js) и D.4
// (core/deepseek-parse.js). Раньше все части жили в ОДНОМ IIFE, поэтому кластер
// обращался к состоянию ядра по именам. Теперь у модуля свой IIFE, и зависимости ядра
// приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D. Все три тела
// (getConvId, resetForNewConversation, checkConvChange) и патчи pushState/replaceState/
// popstate объявлены В ОДНОЙ BIND-зоне — внутри `with (D) { … }` — и вот почему:
//   • ЛЕКСИЧЕСКИЙ СКОУП, А НЕ СКОРОСТЬ. Функция, объявленная ВНЕ `with (D)`, НЕ видит
//     bind-имена: её замыкание не включает with-окружение, созданное в __bind. Зов из
//     with-обёртки тут не спасает — резолв идёт по замыканию объявления, а не по месту
//     вызова. Репро (tools/_repro-with.js): тело, объявленное вне with, падает на первом
//     же свободном имени (ReferenceError: currentConvId is not defined), а объявленное
//     внутри — работает. Поэтому даже getConvId (ему из ядра нужен только location)
//     обязан жить в BIND: checkConvChange, объявленный рядом, зовёт его, а currentConvId
//     вообще принадлежит ядру. PURE-зона держит ровно байтовый заголовок СЕКЦИИ 3.
//   • ЦЕНА with ЗДЕСЬ НУЛЕВАЯ. Урок D.1 (81 мс вне with против 3309 мс в with на
//     200×200 КБ) касается ГОРЯЧИХ перебайтовых циклов — в K1 таких нет: парсинг пути,
//     три присваивания счётчиков и обход патчей, то есть единицы резолвов на навигацию,
//     а не на байт. Формально BIND, фактически — холодный путь.
//   • ПАТЧИ СТАВЯТСЯ НА ЗАГРУЗКЕ МОДУЛЯ. Блок `try { history.pushState = … }` лежит в
//     BIND-зоне, но BIND-зона исполняется на РАННЕЙ связке __bind({}): ядро зовёт её
//     сразу после объявления загрузчика, ещё до инициализации currentConvId (см. ниже),
//     поэтому патчи pushState/replaceState/popstate стоят уже к первому SPA-переходу
//     страницы. Ранней связки достаточно: getConvId из D не читает НИЧЕГО (location —
//     глобал), а checkConvChange и popstate-слушатель зовутся позже. ПОЛНАЯ связка — в
//     конце IIFE ядра, там же, где связки D.1-D.4.
// Байтовая идентичность тел сохранена.
//
// СОСТОЯНИЕ: currentConvId ОСТАЛСЯ В ЯДРЕ — переменная входит в контракты диагностики
// D.1 (ro) и сетевого дозапроса D.2 (ro), а читает её половина оставшихся секций
// (emit-композиция, ingest, guard-хуки K9/K11). Модуль получает её rw-парой и видит
// ТУ ЖЕ переменную, а не копию: resetForNewConversation и checkConvChange её
// ПЕРЕЗАПИСЫВАЮТ (без сеттера запись в sloppy-режиме молча терялась бы — детектор
// смены чата не замечал бы новый разговор и сброс не срабатывал бы вовсе).
// lastDiagConvId — тоже переменная ЯДРА (её объявляет связка D.1): rw-пара, потому что
// resetForNewConversation читает её как prevConv и перезаписывает текущим convId.
// Остальное состояние сброса (turnsMap/orderCounter/attach*/logged*/lastLoadedConvId/
// lastHistoryUrl/historyRefetchDone/lastBaseServerTokens/lastBaseChatMode/live*/
// netSnapshotAt/netTurnIds/lastTurnDoneAt) отдано rw-парами ровно там, где тело
// ПЕРЕЗАПИСЫВАЕТ переменную (без сеттера сброс молча терялся бы); histCompletion —
// ro-геттер: тело мутирует ПОЛЯ объекта, а не переприсваивает имя, и мутация по ссылке
// видна ядру без сеттера. diagResetForConv и resetStreamState переданы значением
// (function declaration ядра хойстятся — значения доступны на момент связки),
// scheduleHistoryRefetch — ro-геттер: в ядре это форвардер модуля D.3.
//
// ЧТО НЕ УЕХАЛО: объявления (lastAuthHeaders … histCompletion) и O-22-слушатель
// resetForNewConversation→lastDispatchSig ОСТАЛИСЬ в ядре: lastAuthHeaders/lastHistoryUrl/
// historyRefetchDone/histCompletion-флаги читают fetch-хук (K11), XHR-копилка (K9), приём
// снимка (K5) и emit-композиция (K3/K4), а lastDispatchSig/lastDispatchResult пишет сам
// emit-гард O-22. Их переезд означал бы правку K3-K11 (запрещено рамками шага).
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v7',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> core/deepseek-parse.js ->
// ЭТОТ ФАЙЛ -> core/deepseek-intercept.js. До связки на window.AiCmDeepseekConv лежит
// только __bind; после связки ядро раздаёт 2 из 3 тел форвардерами по прежним именам
// (getConvId, resetForNewConversation — function declaration, хойстятся: вызовы в
// emit-композиции, guard-хуках K9/K11 и сбросе чата выше по файлу не тронуты).
// checkConvChange наружу не выдаётся: его зовут только патчи и popstate-слушатель
// этого же модуля (в ядре он был локальным).
// Экспорт: window.AiCmDeepseekConv + module.exports.
// =============================================================================
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekConv) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: тела без зависимости от ядра (состояние кластера — в ядре) ----
  // ===== СЕКЦИЯ 3: CONV ID + ДЕТЕКТОР СМЕНЫ ЧАТА (образец: gemini v17 + page-intercept v11) =====
  function getConvId() {
    try {
      var m = location.pathname.match(/\/a\/chat\/s\/([A-Za-z0-9_-]+)/);
      if (m) return m[1];
      m = location.pathname.match(/\/a\/chat\/([A-Za-z0-9_-]+)/);
      return m ? m[1] : '';
    } catch (e) { return ''; }
  }

  function __bind(d) {
    D = d;
    with (D) {
  // ---- BIND-зона: тела K1, читающие живое состояние ядра через with (D) ----

  function resetForNewConversation() {
    if (!D || Object.keys(D).length === 0) { return; }   // ранняя связка: ядро ещё не отдало состояние
    diagResetForConv('conv-change', lastDiagConvId);   // O-18 (ИЗМЕРЕНИЕ): кольца — на один convId
    lastDiagConvId = currentConvId;                    // O-18 (ИЗМЕРЕНИЕ)
    turnsMap = {};
    orderCounter = 0;
    attachTokens = 0;
    attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
    loggedOk = false;
    loggedHistory = false;
    loggedRealtime = false;
    lastLoadedConvId = '';
    lastHistoryUrl = '';          // v6
    historyRefetchDone = false;   // v6
    histCompletion.historyComplete = false;  // v7: новая база ещё не подтверждена
    histCompletion.reachedRoot = false;      // v7
    histCompletion.baseEmpty = false;        // v11 (O-17)
    lastBaseServerTokens = 0;                // v11 (O-17)
    lastBaseChatMode = '';                   // v11 (O-17)
    // v12 (O-18, фаза 2): live-кэш ходов и состояние сетевого дозапроса — на один чат
    liveTurns = {};
    liveTurnOrder = [];
    netSnapshotAt = 0;
    netTurnIds = {};
    lastTurnDoneAt = 0;
    resetStreamState(); if (typeof resetFiles === 'function') resetFiles();   // D.10: файловый кэш вложений (deepseek-files.js) не переезжает в следующий чат
    console.log('[deepseek-intercept] смена чата → состояние перехватчика сброшено (convId=' + (currentConvId || '(не чат)') + ')');
    try { window.dispatchEvent(new CustomEvent('ai-cm-conversation-changed')); } catch (e) { /* ignore */ }
    scheduleHistoryRefetch();
  }

  function checkConvChange() {
    var newId = getConvId();
    if (newId !== currentConvId) {
      currentConvId = newId;
      resetForNewConversation();
    }
  }

  try {
    var origPush = history.pushState;
    if (origPush) {
      history.pushState = function () {
        var r = origPush.apply(this, arguments);
        try { checkConvChange(); } catch (e) { /* ignore */ }
        return r;
      };
    }
    var origReplace = history.replaceState;
    if (origReplace) {
      history.replaceState = function () {
        var r = origReplace.apply(this, arguments);
        try { checkConvChange(); } catch (e) { /* ignore */ }
        return r;
      };
    }
    window.addEventListener('popstate', function () { try { checkConvChange(); } catch (e) { /* ignore */ } });
  } catch (e) { /* ignore */ }

      Fn.getConvId = getConvId;
      Fn.resetForNewConversation = resetForNewConversation;
      Fn.checkConvChange = checkConvChange;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekConv = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-emit.js ===== */

// =============================================================================
// core/deepseek-emit.js — Step D.6 (декомпозиция core/deepseek-intercept.js).
// K2: EMIT (СЕКЦИЯ 4 ядра, строки 307-489 HEAD d6a74c2, 183 строки) —
// buildDispatchSignature (O-22, ФИКС F4: payload-точная сигнатура снимка),
// emitBaseSnapshot (единая точка публикации события ai-cm-full-history: 3 сайта
// вызова в ядре — приём снимка истории и два realtime-финала, плюс ре-эмит полноты
// 0→1), clipTurnText и turnsSnapshot (сводка turnsMap для дампов экспорта, v11/O-17)
// и мост ai-cm-turns-snap-request → ai-cm-turns-snap-response (ответ DeepSeek на
// запрос экспортёра, которого у сервиса раньше не было).
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js), D.2
// (core/deepseek-netsync.js), D.3 (core/deepseek-refetch.js), D.4
// (core/deepseek-parse.js) и D.5 (core/deepseek-conv.js). Раньше все части жили
// в ОДНОМ IIFE, поэтому кластер обращался к состоянию ядра по именам. Теперь у
// модуля свой IIFE, и зависимости ядра приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D.
//   • PURE-зона держит ровно байтовый заголовок СЕКЦИИ 4 (7 строк): это
//     комментарий, ядру он не нужен.
//   • BIND-зона (внутри `with (D) { … }`) держит ВСЕ тела кластера, и причина
//     здесь ЛЕКСИЧЕСКАЯ, а не скоростная: функция, объявленная ВНЕ with, НЕ видит
//     bind-имена — её замыкание не включает with-окружение, созданное в __bind,
//     и зов из with-обёртки не спасает (резолв идёт по замыканию объявления, а не
//     по месту вызова). Репро — tools/_repro-with.js (урок D.5/D.1): тело вне with
//     падает на первом же свободном имени ядра (buildDispatchSignature читает
//     turnsMap → ReferenceError: turnsMap is not defined).
//   • ЦЕНА with ЗДЕСЬ НЕ ГОРЯЧАЯ. Урок D.1 (81 мс вне with против 3309 мс в with на
//     200×200 КБ) касается ПЕРЕБАЙТОВЫХ циклов с резолвом имени на символ. В K2
//     перебайтовый цикл ровно один — FNV-1a в diagHash6 — и он лежит в PURE-зоне
//     своего модуля (core/deepseek-diag.js, шаг D.1): buildDispatchSignature зовёт
//     diagHash6 ОДИН раз на текст хода, то есть динамический резолв имени приходится
//     на ВЫЗОВ функции, а не на символ текста. Собственные циклы K2 — по ходам
//     (Object.keys(turnsMap)) и по фрагментам строки, без перебайтового резолва.
// Байтовая идентичность тел сохранена.
//
// СОСТОЯНИЕ. turnsMap / attachTokens / attachBreak / histCompletion / currentConvId
// ОСТАЛИСЬ В ЯДРЕ: их ведут оставшиеся секции (K5 ingest, K6 SSE, K9 XHR-копилка,
// K11 fetch-хук) и контракты D.1-D.5, а K2 их только ЧИТАЕТ — поэтому здесь
// ro-геттеры (запись в поля turnsMap и мутация полей histCompletion идут по ссылке
// и видны ядру без сеттера). lastBaseServerTokens / lastBaseChatMode /
// lastDispatchSig / lastDispatchResult — rw-пары: это состояние ПЕРЕЗАПИСЫВАЕТ само
// тело emitBaseSnapshot (запоминание реально опубликованного снимка и параметров
// последнего эмита), а читают его K2 (гард повторного диспатча + вход в ре-эмит),
// ре-эмит полноты 0→1 в ingestHistory (K5) и O-22-слушатель смены разговора в ядре
// (он же обнуляет lastDispatchSig). Без сеттера запись в sloppy-режиме молча
// терялась бы — гард O-22 перестал бы глушить повторные снимки. Объявления этих
// четырёх переменных — в ЯДРЕ (строки 292-297): при выносе var из IIFE ядро читало бы
// НЕЯВНЫЕ ГЛОБАЛЫ (в браузере это работало бы, в изолированном vm/jsdom-скоупе дало
// бы ReferenceError — урок D.5 на lastDispatchSig). Собственного состояния у кластера
// нет: все var внутри тел — локальные (ids/pieces/messages/reasonings/turns/parts…).
//
// ЧТО НЕ УЕХАЛО: заголовок СЕКЦИИ 4 уехал (PURE). O-22-слушатель
// 'ai-cm-conversation-changed' (строки 299-304 ядра) ОСТАЛСЯ в ядре: он пишет
// lastDispatchSig, объявленный в ядре. Функции ядра, которые зовут тела (diagHash6 /
// diagMark / diagOn / diagExportHook / isDebugEnabled — форвардеры D.1, getConvId —
// форвардер D.5, hasInjectedUserPrompt — форвардер D.4), переданы ЗНАЧЕНИЕМ: function
// declaration ядра хойстятся, поэтому значения доступны на момент связки.
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v8',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> core/deepseek-parse.js ->
// core/deepseek-conv.js -> ЭТОТ ФАЙЛ -> core/deepseek-intercept.js. До связки на
// window.AiCmDeepseekEmit лежит только __bind; после связки ядро раздаёт 1 из 4 тел
// форвардером по прежнему имени (emitBaseSnapshot — function declaration, хойстится:
// 3 сайта вызова выше по файлу и fn-передача в контракт D.2 не тронуты).
// buildDispatchSignature / clipTurnText / turnsSnapshot наружу не выдаются: их зовут
// только тела этого же модуля (мост turns-snap — тот же модуль).
// Экспорт: window.AiCmDeepseekEmit + module.exports.
// =============================================================================
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekEmit) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: байтовый заголовок СЕКЦИИ 4 (тела K2 читают состояние ядра) ----
  // ===== СЕКЦИЯ 4: EMIT (контракт как в gemini v21, + serverTokens, + modelMode) =====
  // O-22 (ФИКС F4): payload-точная сигнатура диспатча. Берутся ВСЕ поля области видимости, из
  // которых собирается detail события ai-cm-full-history: convId, состав и тексты ходов
  // (id, order, role, modelSlug, текст и reasoning — длиной и отпечатком FNV-1a), serverTokens,
  // chatMode, вложения и вердикт полноты (historyComplete/reachedRoot/baseEmpty). Равенство
  // сигнатур означает побайтово тот же снимок, поэтому второй диспатч не несёт новой информации.
  // Сбой сборки → null: гард не действует, диспатч идёт как прежде.
  function __bind(d) {
    D = d;
    with (D) {
  // ---- BIND-зона: тела K2, читающие живое состояние ядра через with (D) ----

  function buildDispatchSignature(convId, serverTokens, chatMode) {
    try {
      var parts = [
        String(convId || ''),
        String(Object.keys(turnsMap).length),
        String(serverTokens || 0),
        String(chatMode || ''),
        String(attachTokens || 0),
        (attachBreak.imgTokens || 0) + ',' + (attachBreak.docTokens || 0) + ',' +
          (attachBreak.imgCount || 0) + ',' + (attachBreak.docCount || 0),
        (histCompletion.historyComplete === true ? '1' : '0') +
          (histCompletion.reachedRoot === true ? '1' : '0') +
          (histCompletion.baseEmpty === true ? '1' : '0')
      ];
      var keys = Object.keys(turnsMap);
      var turns = [];
      for (var i = 0; i < keys.length; i++) {
        var k = String(keys[i]);
        var t = turnsMap[k] || {};
        var tx = (typeof t.text === 'string') ? t.text : '';
        var rs = (typeof t.reasoning === 'string') ? t.reasoning : '';
        turns.push(k + ':' + (t.order || 0) + ':' + (t.role || '') + ':' + (t.modelSlug || '') + ':' +
          tx.length + ':' + diagHash6(tx) + ':' + rs.length + ':' + diagHash6(rs));
      }
      turns.sort();   // снимок — это состав, а не порядок ключей turnsMap (порядок detail задаёт t.order)
      parts.push(turns.join(';'));
      return parts.join('|');
    } catch (e) { return null; }
  }
  function emitBaseSnapshot(serverTokens, chatMode) {
    // O-22 (ИЗМЕРЕНИЕ-2): маркер входа в функцию диспатча ai-cm-full-history.
    // count — из turnsMap (в области видимости), текст на входе тела ещё не собран →
    // литерал «(вне области)»; convId — из области видимости. Только диагностика под гейтом.
    try {
      if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
        diagMark('o22-dispatch-fn', {
          ts: Date.now(),
          count: Object.keys(turnsMap).length,
          textLen: '(вне области)',
          convId: (typeof getConvId === 'function') ? (getConvId() || currentConvId || '') : (currentConvId || '')
        });
      }
    } catch (eO22fn) { /* ignore */ }
    serverTokens = (typeof serverTokens === 'number' && serverTokens > 0) ? serverTokens : 0;
    chatMode = chatMode || '';
    // O-22 (ФИКС F4): payload-точный гард ПОВТОРНОГО диспатча — единая точка для ВСЕХ сайтов
    // (S560/S692/S1172/S1467). Живой лог 2026-09-18 21:31:12: один и тот же снимок
    // (convId 2d0090f5, count=10, ops APPEND:1765/SET:2, frags THINK 5437#809dbd +
    // RESPONSE 1592#c40b57) ушёл 3 раза за 10 мс. Сигнатура совпала с последней
    // ОПУБЛИКОВАННОЙ → снимок не изменился, событие ai-cm-full-history не публикуем.
    // Гард не зависит от aiCmDebug: под гейтом только строка o22-dispatch-skip.
    var dispatchSig = buildDispatchSignature(
      (typeof getConvId === 'function') ? (getConvId() || currentConvId) : currentConvId,
      serverTokens, chatMode);
    if (dispatchSig !== null && lastDispatchSig !== null && dispatchSig === lastDispatchSig) {
      try {
        if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
          diagMark('o22-dispatch-skip', {
            site: 'emitBaseSnapshot', ts: Date.now(),
            count: Object.keys(turnsMap).length, textLen: '(вне области)',
            convId: (typeof getConvId === 'function') ? (getConvId() || currentConvId || '') : (currentConvId || ''),
            sig: (typeof diagHash6 === 'function') ? diagHash6(dispatchSig) : '',
            sigLen: dispatchSig.length
          });
        }
      } catch (eO22skip) { /* ignore */ }
      return lastDispatchResult;
    }
    lastBaseServerTokens = serverTokens;   // v11 (O-17): для ре-эмита при полноте 0→1
    lastBaseChatMode = chatMode;           // v11 (O-17)
    var ids = Object.keys(turnsMap).sort(function (a, b) {
      return (turnsMap[a].order || 0) - (turnsMap[b].order || 0);
    });
    var pieces = [];
    var messages = [];
    var reasonings = [];              // v8: reasoning по ходам (пустая строка — reasoning нет)
    var reasoningTurns = 0;           // v8: сколько ходов реально несут reasoning
    var lastModel = '';
    for (var j = 0; j < ids.length; j++) {
      var t = turnsMap[ids[j]];
      pieces.push(t.text);
      // v7: роль unknown сохраняется КАК ЕСТЬ (не маппится в assistant) — разрешение
      // на уровне отображения (content.js buildHistoryMessages: не-user → assistant).
      // Факт нестандартной роли логируем только под debug-флагом (isDebugEnabled).
      // v8: reasoning хода едет и в messages[], и отдельным массивом reasoningTexts.
      var turnReasoning = t.reasoning || '';
      // v13 (O-7): hidden-пометки базы — текст хода не меняется (см. hasInjectedUserPrompt).
      var turnMsg = { role: t.role || 'unknown', text: t.text, reasoning: turnReasoning };
      if (turnReasoning) turnMsg.hiddenReasoning = turnReasoning;
      if (t.role === 'user' && hasInjectedUserPrompt(t.text)) turnMsg.hiddenInjection = true;
      messages.push(turnMsg);
      reasonings.push(turnReasoning);
      if (turnReasoning) reasoningTurns++;
      if (!(t.role === 'user' || t.role === 'assistant') && isDebugEnabled()) {
        console.log('[deepseek-intercept] роль "' + (t.role || 'unknown') + '" оставлена как есть (не маппится в assistant)');
      }
      if (t.modelSlug) lastModel = t.modelSlug;
    }
    var text = pieces.join('\n');
    try {
      window.dispatchEvent(new CustomEvent('ai-cm-full-history', {
        detail: {
          convId: getConvId() || currentConvId,   // v7: зеркально gemini — stale-conv гард в content.js работает и для DeepSeek
          text: text,
          count: ids.length,
          lastMessageText: pieces.length ? pieces[pieces.length - 1] : '',
          modelSlug: lastModel || '',
          modelMode: chatMode,
          messageTexts: pieces,
          messageIds: ids,
          messages: messages,
          reasoningTexts: reasonings,        // v8: reasoning по ходам ([REASONING]/[ANSWER] уже в messageTexts)
          reasoningTurns: reasoningTurns,    // v8: ходов с непустым reasoning
          attachTokens: attachTokens,
          attachBreak: {
            imgTokens: attachBreak.imgTokens,
            docTokens: attachBreak.docTokens,
            imgCount: attachBreak.imgCount,
            docCount: attachBreak.docCount
          },
          historyComplete: histCompletion.historyComplete,   // v7: честно — true только если обход дошёл до корня
          reachedRoot: histCompletion.reachedRoot,           // v7: доказан ли корень (узел без parent_id)
          baseEmpty: histCompletion.baseEmpty === true,      // v11 (O-17): полнота вынесена по авторитетно пустой базе (наследуется live-эмитами)
          serverTokens: serverTokens
        }
      }));
    } catch (e) { swallowSoft(e, 'deepseek:emitBaseSnapshot'); }
    var result = { count: ids.length, textLen: text.length, lastModel: lastModel, serverTokens: serverTokens, reasoningTurns: reasoningTurns };
    // O-22 (ФИКС F4): запоминаем ТОЛЬКО реально опубликованный снимок — по этой сигнатуре
    // следующий диспатч того же снимка будет остановлен до события.
    lastDispatchSig = dispatchSig;
    lastDispatchResult = result;
    return result;
  }

  // v11 (O-17): сводка turnsMap для дампов в момент экспорта (aiCmDumpTurnsSnapshot,
  // core/base-handler.js). DeepSeek раньше на мост не отвечал (мост Gemini), поэтому в живом
  // логе «snapshot-at-manual msgs=0 firstText=""» читалось как ПУСТОЙ turnsMap, хотя база была
  // собрана: фолбэк дампа подставляет msgs только когда передан массив, а ручной путь
  // (content.js) передаёт null. Теперь msgs — реальное число ходов перехватчика.
  function clipTurnText(t) {
    try { return String((t && t.text) || '').slice(0, 80).replace(/\s+/g, ' '); } catch (e) { return ''; }
  }
  function turnsSnapshot() {
    var ids = Object.keys(turnsMap).sort(function (a, b) {
      return (turnsMap[a].order || 0) - (turnsMap[b].order || 0);
    });
    var first = ids.length ? turnsMap[ids[0]] : null;
    var last = ids.length ? turnsMap[ids[ids.length - 1]] : null;
    return {
      convId: currentConvId || getConvId() || '',
      msgs: ids.length,
      firstText: clipTurnText(first),
      lastText: clipTurnText(last),
      baseComplete: histCompletion.historyComplete === true,
      // v11 (O-17): начало истории на DeepSeek не требует скролла — вердикт полноты тот же,
      // что и у базы; скролл-подтверждений у сервиса нет вовсе.
      reachedStart: histCompletion.historyComplete === true,
      confirmedByScroll: false,
      scrollEngaged: false,
      baseMsgs: ids.length,
      liveCount: ids.length,
      archiveCount: 0
    };
  }
  try {
    window.addEventListener('ai-cm-turns-snap-request', function () {
      try {
        window.dispatchEvent(new CustomEvent('ai-cm-turns-snap-response', { detail: turnsSnapshot() }));
      } catch (eTurnsResp) { /* ignore */ }
      // O-18 (ИЗМЕРЕНИЕ): этот мост экспортёр дёргает в ОБЕИХ точках записи файла
      // (snapshot-at-fired / snapshot-at-manual) — здесь снимаем per-turn сравнение
      // live vs network и дамп колец. Только чтение + console.log под флагом aiCmDebug.
      try { diagExportHook('turns-snap-request'); } catch (eDiagExp) { /* ignore */ }
    });
  } catch (eTurnsBridge) { /* ignore */ }

      Fn.buildDispatchSignature = buildDispatchSignature;
      Fn.emitBaseSnapshot = emitBaseSnapshot;
      Fn.clipTurnText = clipTurnText;
      Fn.turnsSnapshot = turnsSnapshot;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekEmit = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-net.js ===== */

// =============================================================================
// core/deepseek-net.js — Step D.7 (декомпозиция core/deepseek-intercept.js).
// K9: NETWORK (СЕКЦИИ 11-12 ядра, строки 1411-1628 HEAD 9aca03a, 218 строк) —
// сетевой слой сайта: обёртка window.fetch (СЕКЦИЯ 11: v5-тихий catch против ложного
// unhandled rejection, копилка auth-заголовков lastAuthHeaders, история + MERGE-дозапрос,
// разбор тела completion в параметры потока, настройки модели /client/settings) и
// обёртки XMLHttpRequest.prototype.open/send/setRequestHeader (СЕКЦИЯ 12: зеркало
// fetch плюс setRequestHeader-копилка заголовков авторизации).
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js), D.2
// (core/deepseek-netsync.js), D.3 (core/deepseek-refetch.js), D.4
// (core/deepseek-parse.js), D.5 (core/deepseek-conv.js) и D.6 (core/deepseek-emit.js).
// Раньше все части жили в ОДНОМ IIFE, поэтому кластер обращался к состоянию ядра по
// именам. Теперь у модуля свой IIFE, и зависимости ядра приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D.
//   • PURE-зона держит ровно байтовые заголовки СЕКЦИЙ 11 и 12 (2 строки): это
//     комментарии, ядру они не нужны.
//   • BIND-зона (внутри `with (D) { … }`) держит ОБА тела кластера, и причина здесь
//     ЛЕКСИЧЕСКАЯ, а не скоростная (урок D.5): функция, объявленная ВНЕ with, НЕ видит
//     bind-имена — её замыкание не включает with-окружение, созданное в __bind, и зов из
//     with-обёртки не спасает (резолв идёт по замыканию объявления, а не по месту вызова).
//     Репро — tools/_repro-with.js: тело вне with падает на первом же свободном имени
//     ядра (fetch-хук читает originalFetch → ReferenceError: originalFetch is not defined).
//   • ЦЕНА with ЗДЕСЬ НЕ ГОРЯЧАЯ. Урок D.1 (81 мс вне with против 3309 мс в with на
//     200×200 КБ) касается ПЕРЕБАЙТОВЫХ циклов с динамическим резолвом имени на символ.
//     У K9 таких циклов нет: тела резолвят имена на ЗАПРОС страницы (десятки резолвов
//     на fetch/XHR), а не на байт тела ответа.
// Байтовая идентичность тел сохранена.
//
// СОСТОЯНИЕ. Собственного состояния у кластера нет: все var внутри тел — локальные
// (url/method/allH/isHistory/promise/info/…), а var originalSetRequestHeader —
// __bind-локальная. Копилки и параметры потока остались В ЯДРЕ и отданы rw-парами:
// lastAuthHeaders/lastHistoryUrl/lastLoadedConvId (строки 279-283) и sseUserPrompt/
// sseParentMessageId/sseThinkingEnabled (строки 632-634). Тела K9 их ПЕРЕЗАПИСЫВАЮТ,
// поэтому без сеттера запись в sloppy-режиме молча терялась бы: копилка авторизации
// и URL осталась бы прежней (MERGE-дозапрос ушёл бы по чужому URL — v6/v11/O-17), а
// разбор тела completion не доехал бы до SSE-финализации K6. Читают это состояние,
// кроме K9: K8 (модуль D.3 — refetchFullHistory/scheduleHistoryRefetch) и K6 (SSE).
// Объявления всех шести переменных — в ЯДРЕ: при выносе var из IIFE ядро читало бы
// НЕЯВНЫЕ ГЛОБАЛЫ (в браузере это работало бы, в изолированном vm/jsdom-скоупе дало бы
// ReferenceError — урок D.5 на lastDispatchSig). originalFetch / OriginalXHR /
// originalXHROpen / originalXHRSend / currentConvId — ro-геттеры: тела их только читают,
// а мутация идёт по ссылке (прототип XHR) или через сам объект.
//
// ЧТО НЕ УЕХАЛО: объявления originalFetch/OriginalXHR/originalXHROpen/originalXHRSend
// (строки 222-225 ядра) ОСТАЛИСЬ в ядре: originalFetch отдан ro-геттером ещё и
// контрактам D.2/D.3, а XHR-оригиналы ядро передаёт этому модулю. Связка модуля
// вызывается в КОНЦЕ IIFE ядра — ПОСЛЕ захвата originalFetch, поэтому обёртка fetch
// никогда не замыкается сама на себя (иначе бесконечная рекурсия). Функции ядра,
// которые зовут тела, переданы ЗНАЧЕНИЕМ (function declaration ядра хойстятся и
// доступны на момент связки): collectHeaders/convIdFromHistoryUrl/
// convIdFromCompletionBody/guardCheck/refetchFullHistory — форвардеры D.3,
// diagOn/diagHistRecord — форвардеры D.1, ingestHistory — K5 (СЕКЦИЯ 8),
// parseSSE/consumeSseResponse/ingestModelSettings — K6 (СЕКЦИЯ 9).
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v9',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> core/deepseek-parse.js ->
// core/deepseek-conv.js -> core/deepseek-emit.js -> ЭТОТ ФАЙЛ ->
// core/deepseek-intercept.js. До связки на window.AiCmDeepseekNet лежит только __bind.
// Fn наружу не отдаёт ни одного тела: прежние имена кластера — window.fetch и
// OriginalXHR.prototype.open/send/setRequestHeader — читает САЙТ, а не ядро, поэтому
// форвардеров у D.7 нет вовсе (в отличие от D.1-D.6).
// Экспорт: window.AiCmDeepseekNet + module.exports.
// =============================================================================
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekNet) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: байтовые заголовки СЕКЦИЙ 11 и 12 (тела K9 читают состояние ядра) ----
  // ===== СЕКЦИЯ 11: ПЕРЕХВАТ FETCH (v5: тихий catch + устранение висячих Promise.reject) =====
  // ===== СЕКЦИЯ 12: ПЕРЕХВАТ XHR (зеркалит fetch, +setRequestHeader-копилка) =====
  function __bind(d) {
    D = d;
    with (D) {
  // ---- BIND-зона: тела K9 (fetch-хук и XHR-хук) — свободные имена резолвятся в with (D) ----

  if (typeof originalFetch === 'function') {
    window.fetch = function (input, init) {
      var url = '';
      try { url = (typeof input === 'string') ? input : (input && input.url) || ''; } catch (e) { swallowSoft(e, 'deepseek:fetch-url'); }
      var method = (init && init.method) ? String(init.method).toUpperCase() : 'GET';

      // Сбор заголовков ВСЕХ запросов (для сохранения auth)
      var allH = collectHeaders(input, init);
      if (allH.Authorization || allH.authorization) lastAuthHeaders = allH;

      // --- история: URL содержит "history_messages" ---
      var isHistory = (url.indexOf('history_messages') !== -1);
      var historyConvId = '';
      var historyAuthHeaders = null;
      if (isHistory) {
        historyConvId = convIdFromHistoryUrl(url);
        historyAuthHeaders = allH;
        lastHistoryUrl = url;   // v6: сохраняем URL для возможного дозапроса при усечении
      }

      // --- отправка: URL содержит "completion", метод POST ---
      var isCompletion = (url.indexOf('completion') !== -1 && method === 'POST');
      var completionConvId = '';
      if (isCompletion) {
        var bodyStr = '';
        try {
          if (init && typeof init.body === 'string') {
            bodyStr = init.body;
            var payload = JSON.parse(bodyStr);
            sseUserPrompt = payload.prompt || '';
            sseParentMessageId = payload.parent_message_id || null;
            sseThinkingEnabled = payload.thinking_enabled;        // сохраняем для getModelSlug
            completionConvId = payload.chat_session_id || '';
          }
        } catch (e) { swallowSoft(e, 'deepseek:fetch-completion-body'); }
      }

      // --- настройки модели: URL содержит "client/settings" (v13, scope=model) ---
      var isModelSettings = (url.indexOf('client/settings') !== -1);

      var promise;
      try { promise = originalFetch.apply(this, arguments); } catch (e) { return Promise.reject(e); }

      // v5: тихий catch — снимает ложный unhandled rejection для чужих прерванных запросов
      // (Failed to fetch при навигации/переключении/обрыве стрима), не меняя поведения страницы
      promise.catch(function () { /* тихо: снимаем ложный unhandled для чужих прерванных запросов */ });

      // обработка ответа истории
      if (isHistory) {
        promise.then(function (resp) {
          try {
            if (resp && resp.ok && guardCheck(historyConvId)) {
              resp.clone().json().then(function (json) {
                // Проверка «пусто+MERGE»: сервер вернул пустой chat_messages при is_empty!==true
                var bd = json && json.data && json.data.biz_data;
                if (bd) {
                  var cs = bd.chat_session;
                  var emptyMERGE = cs && cs.is_empty !== true && (!Array.isArray(bd.chat_messages) || bd.chat_messages.length === 0);
                  if (emptyMERGE && guardCheck(historyConvId)) {
                    if (diagOn()) diagHistRecord(json, 'fetch-history:emptyMERGE');   // O-18 (ИЗМЕРЕНИЕ)
                    console.log('[deepseek-intercept] кеш MERGE → тихий дозапрос полной истории (без cache_version)');
                    lastLoadedConvId = currentConvId;
                    refetchFullHistory(url, historyAuthHeaders, historyConvId);
                    return;
                  }
                }
                ingestHistory(json);
              }).catch(function () { });
            }
          } catch (e) { swallowSoft(e, 'deepseek:fetch-history'); }
          return resp;
        }, function () { /* v5: тихо — не создаём висячий Promise.reject */ });
      }

      // обработка ответа стрима (v9: инкрементально — терминальный чанк закрывает ход
      // сразу, не дожидаясь конца тела ответа)
      if (isCompletion) {
        promise.then(function (resp) {
          try {
            if (resp && resp.ok && guardCheck(completionConvId)) {
              consumeSseResponse(resp, completionConvId);
            }
          } catch (e) { swallowSoft(e, 'deepseek:fetch-completion'); }
          return resp;
        }, function () { /* v5: тихо — не создаём висячий Promise.reject */ });
      }

      // обработка ответа настроек модели (v13): тихий разбор, только чтение
      if (isModelSettings) {
        promise.then(function (resp) {
          try {
            if (resp && resp.ok) {
              resp.clone().json().then(function (json) {
                ingestModelSettings(json);
              }).catch(function () { });
            }
          } catch (e) { swallowSoft(e, 'deepseek:fetch-settings'); }
          return resp;
        }, function () { /* тихо */ });
      }

      return promise;
    };
  }

  if (originalXHROpen && originalXHRSend) {
    // Обёртка setRequestHeader — копим заголовки для повторного запроса при MERGE
    var originalSetRequestHeader = OriginalXHR.prototype.setRequestHeader;
    if (originalSetRequestHeader) {
      OriginalXHR.prototype.setRequestHeader = function (name, value) {
        try {
          if (this.__aiCmDs && this.__aiCmDs.headers) {
            this.__aiCmDs.headers[name] = value;
          }
        } catch (e) { /* ignore */ }
        return originalSetRequestHeader.apply(this, arguments);
      };
    }

    OriginalXHR.prototype.open = function (method, url) {
      try {
        this.__aiCmDs = {
          method: String(method).toUpperCase(),
          url: String(url),
          completionBody: null,
          completionConvId: '',
          historyConvId: '',
          headers: {}
        };
      } catch (e) { swallowSoft(e, 'deepseek:xhr-open'); }
      return originalXHROpen.apply(this, arguments);
    };

    OriginalXHR.prototype.send = function (body) {
      var info = this.__aiCmDs;
      if (!info) return originalXHRSend.apply(this, arguments);

      // Сохраняем auth-заголовки при наличии Authorization
      if (info.headers && (info.headers.Authorization || info.headers.authorization)) lastAuthHeaders = info.headers;

      var url = info.url || '';
      var method = info.method || 'GET';

      // --- история ---
      if (url.indexOf('history_messages') !== -1) {
        info.historyConvId = convIdFromHistoryUrl(url);
        lastHistoryUrl = url;   // v6: сохраняем URL для возможного дозапроса при усечении
      }

      // --- отправка ---
      if (url.indexOf('completion') !== -1 && method === 'POST') {
        var bodyStr = (typeof body === 'string') ? body : '';
        info.completionBody = bodyStr;
        info.completionConvId = convIdFromCompletionBody(bodyStr);
        try {
          if (bodyStr) {
            var payload = JSON.parse(bodyStr);
            sseUserPrompt = payload.prompt || '';
            sseParentMessageId = payload.parent_message_id || null;
            sseThinkingEnabled = payload.thinking_enabled;
          }
        } catch (e) { swallowSoft(e, 'deepseek:xhr-send'); }
      }

      var self = this;

      // обработка ответа (load)
      this.addEventListener('load', function () {
        var info2 = self.__aiCmDs;
        if (!info2) return;
        try {
          if (self.status < 200 || self.status >= 300) return;
          if (!self.responseText) return;

          var loadUrl = info2.url || '';

          // история
          if (loadUrl.indexOf('history_messages') !== -1) {
            if (guardCheck(info2.historyConvId)) {
              try {
                var jsonH = JSON.parse(self.responseText);
                // Проверка «пусто+MERGE»: сервер вернул пустой chat_messages при is_empty!==true
                var bdH = jsonH && jsonH.data && jsonH.data.biz_data;
                if (bdH) {
                  var csH = bdH.chat_session;
                  var emptyMERGE = csH && csH.is_empty !== true && (!Array.isArray(bdH.chat_messages) || bdH.chat_messages.length === 0);
                  if (emptyMERGE && guardCheck(info2.historyConvId)) {
                    if (diagOn()) diagHistRecord(jsonH, 'xhr-history:emptyMERGE');   // O-18 (ИЗМЕРЕНИЕ)
                    console.log('[deepseek-intercept] кеш MERGE → тихий дозапрос полной истории (без cache_version)');
                    lastLoadedConvId = currentConvId;
                    refetchFullHistory(loadUrl, info2.headers || {}, info2.historyConvId);
                    return;
                  }
                }
                ingestHistory(jsonH);
              } catch (e) { swallowSoft(e, 'deepseek:xhr-load-history'); }
            }
          }

          // стрим
          if (loadUrl.indexOf('completion') !== -1 && info2.method === 'POST') {
            if (guardCheck(info2.completionConvId)) {
              parseSSE(self.responseText);
            }
          }

          // настройки модели (v13): name активной конфигурации (Instant)
          if (loadUrl.indexOf('client/settings') !== -1) {
            try { ingestModelSettings(JSON.parse(self.responseText)); } catch (eSet) { swallowSoft(eSet, 'deepseek:xhr-load-settings'); }
          }
        } catch (e) { swallowSoft(e, 'deepseek:xhr-load'); }
      });

      return originalXHRSend.apply(this, arguments);
    };
  }
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekNet = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-ingest.js ===== */

// =============================================================================
// core/deepseek-ingest.js — Step D.8 (декомпозиция core/deepseek-intercept.js).
// K5: INGEST (СЕКЦИЯ 8 ядра, строки 340-614 HEAD 2623b3a, 275 строк) — приёмка
// авторитетного сетевого снимка history_messages: Map<message_id,msg>, восстановление
// активной цепочки (buildActiveChain, ловушка №1), v6-детектор усечения цепочки с
// однократным тихим дозапросом полной истории, v11/O-17 авторитетно пустая база
// (чат, созданный SPA-переходом) и MERGE-ветка пустого кеша, v12/O-18 режим экспортного
// дозапроса (ingestMode === 'export-sync': усечённый снимок НЕ принимается), сборка
// turnsMap ПОХОДОВО по thinking_enabled (v9/O-15: ход = user + assistant, «висячий»
// reasoning приклеивается к соседнему ходу), per-turn modelSlug по сетевым сигналам,
// фиксация снимка сети (netSnapshotAt/netTurnIds), вердикт полноты histCompletion,
// единая публикация базы (emitBaseSnapshot) и однократный диагностический дамп.
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js), D.2
// (core/deepseek-netsync.js), D.3 (core/deepseek-refetch.js), D.4 (core/deepseek-parse.js),
// D.5 (core/deepseek-conv.js), D.6 (core/deepseek-emit.js) и D.7 (core/deepseek-net.js).
// Раньше все части жили в ОДНОМ IIFE, поэтому кластер обращался к состоянию ядра по
// именам. Теперь у модуля свой IIFE, и зависимости ядра приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тело перенесено БАЙТ-В-БАЙТ и без префиксов D.
//   • PURE-зона держит ровно байтовый заголовок СЕКЦИИ 8 (6 строк): это комментарии,
//     ядру они не нужны.
//   • BIND-зона (внутри `with (D) { … }`) держит тело K5, и причина здесь ЛЕКСИЧЕСКАЯ,
//     а не скоростная (урок D.5): функция, объявленная ВНЕ with, НЕ видит bind-имена —
//     её замыкание не включает with-окружение, созданное в __bind, и зов из with-обёртки
//     не спасает (резолв идёт по замыканию объявления, а не по месту вызова). Репро —
//     tools/_repro-with.js: тело вне with падает на первом же свободном имени
//     (ingestHistory читает ingestMode → ReferenceError: ingestMode is not defined).
//   • ЦЕНА with ЗДЕСЬ НЕ ГОРЯЧАЯ (урок D.1). Перебайтовых циклов у K5 нет вовсе: вся
//     перебайтовая работа O-18 — кольцо сырых ответов и FNV-хеш — живёт в PURE-зоне
//     core/deepseek-diag.js (шаг D.1) и вызывается отсюда форвардером diagHistRecord,
//     то есть динамический резолв приходится на ВЫЗОВ, а не на байт тела ответа.
//     Собственные циклы K5 идут ПО ХОДАМ истории (единицы-десятки итераций): сборка
//     messagesById (371-376), обход активной цепочки (495-542), netTurnIds (562-564) и
//     максимум accumulated_token_usage (568-573). Три из четырёх читают/пишут bind-имена
//     (turnsMap/orderCounter/netTurnIds) или зовут bind-функции (collectTurnText/
//     composeTurnText/getModelSlug), поэтому обязаны лежать в BIND; вынести их в PURE
//     можно было бы только разрезом тела на хелперы, а это нарушило бы байтовую
//     идентичность — первое требование шага.
// Байтовая идентичность тела сохранена.
//
// СОСТОЯНИЕ. Собственного состояния у кластера нет: все var внутри тела — локальные
// (exportSync/bizData/chatSession/chatMessages/messagesById/i/msg/chainResult/chain/
// truncated/baseEmptyAuthoritative/chatMode/chatModelSignals/pendingReasoning/
// lastAssistantId/c/ch/chId/fragments/text/chRole/chReasoning/prevTurn/mergedReasoning/
// tailTurn/nk/lastAccumulated/ci/at/em/diagState). Состояние кластера ОСТАЛОСЬ В ЯДРЕ и
// отдано rw-парами: turnsMap/orderCounter/histCompletion/netSnapshotAt/netTurnIds/
// loggedHistory/lastLoadedConvId/historyRefetchDone (тело их ПЕРЕЗАПИСЫВАЕТ: turnsMap = {},
// orderCounter = 0 и orderCounter++, установка полей histCompletion, netSnapshotAt =
// Date.now(), netTurnIds = {}, loggedHistory = true, lastLoadedConvId = currentConvId,
// historyRefetchDone = true) и ingestMode/exportSyncTruncated (режим экспортного ingest:
// тело читает ingestMode и поднимает exportSyncTruncated). Без сеттеров запись в
// sloppy-режиме молча терялась бы: база не пересобиралась бы, вердикт полноты не
// поднимался бы, а экспорт принял бы усечённый снимок за авторитетный.
//   Объявления ingestMode/exportSyncTruncated остались var в ЯДРЕ (строки 346-347
//   HEAD 2623b3a — сразу под надгробием D.8): их ставит и снимает ещё и контракт D.2
//   (applyExportNetSnapshot: `ingestMode = 'export-sync'` и `ingestMode = ''`), поэтому
//   вынос var в модуль заставил бы ядро читать НЕЯВНЫЕ ГЛОБАЛЫ (в браузере это
//   работало бы, в изолированном vm/jsdom-скоупе дало бы ReferenceError — урок D.5 на
//   lastDispatchSig). Остальные восемь rw-имён объявлены в СЕКЦИЯХ 1-3 ядра и
//   обслуживают ещё K6 (SSE), K7 (сетевой дозапрос), K9/K11 (сетевой слой).
//   ro-геттеры — 8 имён: currentConvId/lastHistoryUrl/lastAuthHeaders (ядро владеет ими
//   вместе с D.2/D.3/D.7 — тело K5 только читает), sseConfigName (сессионный факт из
//   /client/settings; K6 ещё НЕ вынесен, поэтому переменная остаётся в ядре до D.9),
//   REASONING_ENABLED (гейт v8/O-7) и MODEL_WINDOW_DEFAULT (окно модели для лога),
//   lastBaseServerTokens/lastBaseChatMode (параметры последнего эмита — ре-эмит полноты
//   0→1). histCompletion отдан rw-парой, хотя тело мутирует только ПОЛЯ объекта: так
//   контракт D.8 не зависит от того, переприсвоит ли тело имя в будущем (в D.5/D.6 то же
//   имя отдано ro-геттером — сеттер строгость не понижает).
//
// ЧТО НЕ УЕХАЛО: объявления ingestMode/exportSyncTruncated и все восемь rw-имён
// состояния ОСТАЛИСЬ в ядре — их ведут K6/K7/K9/K11 и контракты D.1-D.7. Функции ядра,
// которые зовёт тело, переданы ЗНАЧЕНИЕМ (function declaration ядра хойстятся, поэтому
// значения доступны на момент связки): diagOn/diagMark/diagHistRecord/
// diagSnapshotNetTurns/isDebugEnabled/determineState/dumpHistorySnapshot/
// dumpTurnUsageAtHistoryLoad — форвардеры D.1, refetchFullHistory — форвардер D.3,
// buildActiveChain/collectTurnText/collectTurnReasoning/composeTurnText/getModelSlug —
// форвардеры D.4, emitBaseSnapshot — форвардер D.6. Итого 15 fn.
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v10',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> core/deepseek-parse.js ->
// core/deepseek-conv.js -> core/deepseek-emit.js -> core/deepseek-net.js -> ЭТОТ ФАЙЛ ->
// core/deepseek-intercept.js. До связки на window.AiCmDeepseekIngest лежит только __bind;
// после связки Fn заполнен ровно одним телом (ingestHistory), а ядро раздаёт его
// форвардером по прежнему имени (function declaration, хойстится: fn-передачи
// `ingestHistory: ingestHistory` в контрактах D.2 (приёмка экспортного снимка),
// D.3 (приёмка ответа тихого дозапроса) и D.7 (копилка XHR) не тронуты — прямых
// вызовов K5 в ядре не осталось вовсе).
// Экспорт: window.AiCmDeepseekIngest + module.exports.
// =============================================================================
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekIngest) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: байтовый заголовок СЕКЦИИ 8 (тело K5 читает состояние ядра) ----
  // ===== СЕКЦИЯ 8: ПАРСИНГ history_messages =====
  // v6: детектор усечения активной цепочки + однократный тихий дозапрос полной истории
  // v12 (O-18, фаза 2): ingestMode === 'export-sync' — приёмка снимка, запрошенного ПЕРЕД
  // композицией файла: рекурсивные дозапросы не запускаются (таймаут экспорта уже идёт),
  // а вердикт полноты не понижается. Обычный путь (ingestMode === '') не меняется —
  // сигнатура функции прежняя, режим передаётся состоянием, а не аргументом.

  function __bind(d) {
    D = d;
    with (D) {
  // ---- BIND-зона: тело K5 — свободные имена резолвятся в with (D) ----

  function ingestHistory(jsonBody) {
    var exportSync = (ingestMode === 'export-sync');
    try {
      if (jsonBody.code !== 0) return;
      var bizData = jsonBody.data && jsonBody.data.biz_data;
      if (!bizData) return;
      var chatSession = bizData.chat_session;
      var chatMessages = bizData.chat_messages;
      if (!chatSession || !Array.isArray(chatMessages)) return;

      // O-18 (ИЗМЕРЕНИЕ): вход в ingestHistory + сырьё ответа history_messages (кольцо).
      diagMark('ingest-enter', {
        chatMessages: chatMessages.length,
        is_empty: chatSession.is_empty === true,
        currentMessageId: chatSession.current_message_id != null
      });
      diagHistRecord(jsonBody, 'ingestHistory');

      // Помечаем «ответ для текущего чата обработан» — ДО buildActiveChain и ДО return по пустой цепочке
      lastLoadedConvId = currentConvId;

      // Строим Map<message_id, msg>
      var messagesById = {};
      for (var i = 0; i < chatMessages.length; i++) {
        var msg = chatMessages[i];
        if (msg && msg.message_id != null) {
          messagesById[msg.message_id] = msg;
        }
      }

      // Восстанавливаем активную цепочку (ловушка №1)
      // v6: получаем { chain, truncated } вместо просто массива
      var chainResult = buildActiveChain(chatSession, messagesById);
      var chain = chainResult.chain;
      var truncated = chainResult.truncated;

      // v11 (O-17): авторитетно ПУСТАЯ база — сервер явно говорит, что чат пуст
      // (is_empty=true), либо не отдал ни одного сообщения и не назвал активный узел.
      // Это ЧАСТЬ протокола (новый чат, созданный SPA-переходом), а не «полнота не доказана»:
      // вся история такого чата = 0 ходов, курсора пагинации у DeepSeek нет вовсе.
      var baseEmptyAuthoritative = (chatMessages.length === 0) &&
        (chatSession.is_empty === true || chatSession.current_message_id == null);

      // v11 (O-17): MERGE/cache-ответ (пустой chat_messages при is_empty!==true) —
      // снимок НЕ авторитетен. В ветках fetch/XHR этот случай ловит обёртка, но путь тихого
      // дозапроса после SPA-смены чата (scheduleHistoryRefetch → refetchFullHistory) приходит
      // сюда напрямую: раньше он стирал turnsMap и молча выходил. Теперь — тот же тихий
      // дозапрос полной истории без cache_version/cache_reset_at, база не трогается.
      if (!chain.length && chatMessages.length === 0 && !baseEmptyAuthoritative && !historyRefetchDone && !exportSync) {
        historyRefetchDone = true;
        diagMark('ingest-branch-MERGE-refetch', { chainLen: 0, chatMessages: 0 });   // O-18 (ИЗМЕРЕНИЕ)
        console.log('[deepseek-intercept] пустой кеш (MERGE) без авторитетной пустоты → тихий дозапрос полной истории (без cache_version)');
        refetchFullHistory(lastHistoryUrl, lastAuthHeaders, currentConvId);
        return;
      }

      if (!chain.length) {
        // O-18 (ИЗМЕРЕНИЕ): какая именно ветка пустой цепочки сработала.
        diagMark(baseEmptyAuthoritative ? 'ingest-branch-EMPTY-AUTH' : 'ingest-branch-EMPTY-NONAUTH', {
          chatMessages: chatMessages.length,
          is_empty: chatSession.is_empty === true,
          currentMessageId: chatSession.current_message_id != null
        });
        // v11 (O-17): ЕДИНЫЙ критерий полноты для обеих веток. Пустая цепочка больше не
        // означает «полнота не доказана»: авторитетно пустая база — полная база (0 ходов).
        // Вердикт обязателен именно здесь: realtime-эмиты наследуют histCompletion, и без
        // него на SPA-созданном чате baseComplete не наступал НИКОГДА → гейт O-16 «defer до
        // base-complete» разрешался только 60s-таймаутом (as-is + [LOW CONFIDENCE]_).
        if (baseEmptyAuthoritative) {
          histCompletion.reachedRoot = false;
          histCompletion.historyComplete = true;
          histCompletion.baseEmpty = true;
          console.log('[deepseek-intercept] ✓ база пустая и авторитетная (чат без ходов): история ПОЛНАЯ по сети (0 ходов)');
          // Поверх уже собранных live-ходов (дозапрос пришёл после первого обмена) полноту
          // 0→1 надо отдать content.js СРАЗУ: пустой снимок он игнорирует (`!detail.text`),
          // а следующий непустой EMIT может прийти нескоро — и экспорт ушёл бы по 60s-таймауту.
          if (Object.keys(turnsMap).length > 0) {
            // O-22 (ИЗМЕРЕНИЕ-2): маркер ТОЧКИ диспатча ai-cm-full-history (site=S560).
            try {
              if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
                diagMark('o22-dispatch-site', {
                  site: 'S560', ts: Date.now(),
                  count: Object.keys(turnsMap).length, textLen: '(вне области)'
                });
              }
            } catch (eO22s560) { /* ignore */ }
            emitBaseSnapshot(lastBaseServerTokens, lastBaseChatMode);
          }
        }
        // turnsMap НЕ трогаем: авторитетно пустой ответ не повод стирать live-ходы
        // (иначе следующий realtime-финал публикует СХЛОПНУВШУЮСЯ базу — живой лог: msgs=1..2
        // в записи истории при 4 ходах в чате).
        return;
      }

      // v6: ДЕТЕКТОР УСЕЧЕНИЯ — если цепочка оборвана и дозапрос ещё не делался
      if (truncated && !historyRefetchDone && !exportSync) {
        historyRefetchDone = true;
        // O-18 (ИЗМЕРЕНИЕ): ветка «цепочка оборвана → дозапрос».
        diagMark('ingest-branch-TRUNCATED-refetch', { chainLen: chain.length, chatMessages: chatMessages.length });
        // НЕ помечаем loggedHistory = true — лог и диагностический дамп сработают на полной истории
        console.log('[deepseek-intercept] кеш усечён (цепочка оборвана) → тихий дозапрос полной истории (без cache_version)');
        refetchFullHistory(lastHistoryUrl, lastAuthHeaders, currentConvId);
        return; // не обрабатываем усечённый ответ — ждём полный (собранные live-ходы сохранены)
      }
      // v12 (O-18, фаза 2): в режиме экспортного дозапроса усечённый снимок НЕ принимается.
      // Экспорт не имеет права стать ХУЖЕ live-базы: сброс turnsMap по обрезанной цепочке
      // потерял бы ранние ходы. Такой ответ — как «сети нет»: база не тронута, live-путь.
      if (truncated && exportSync) {
        exportSyncTruncated = true;
        diagMark('ingest-branch-TRUNCATED-export-sync', { chainLen: chain.length, chatMessages: chatMessages.length });
        console.log('[deepseek-intercept] экспорт: сетевой снимок усечён (цепочка оборвана) → база не тронута, прежний live-путь');
        return;
      }

      // v11 (O-17): снимок ПРИНЯТ как авторитетный — только теперь СБРОС и пересборка
      // (история = полный авторитетный снимок, условие 3 из рецензии).
      turnsMap = {};
      orderCounter = 0;
      // (attachTokens/attachBreak на 1-м этапе не трогаем — всегда 0)

      // v7: честная полнота — true, только если цепочка реально дошла до корня.
      // Дозапрос уже либо выполнен (путь выше), либо не нужен (truncated=false).
      histCompletion.reachedRoot = chainResult.reachedRoot;
      histCompletion.historyComplete = chainResult.reachedRoot && !chainResult.truncated;
      histCompletion.baseEmpty = false;   // v11 (O-17): база непустая

      // chatMode — модель чата (expert/default/null), не влияет на выбор модели
      var chatMode = chatSession.model_type || '';
      // v13: сигналы нового контракта из chat_session (model/model_type/conversation_mode)
      // + активная конфигурация из /client/settings (name:"Instant"), если уже захвачена.
      var chatModelSignals = {
        modelPresent: Object.prototype.hasOwnProperty.call(chatSession, 'model'),
        model: chatSession.model,
        modelType: chatSession.model_type,
        conversationMode: chatSession.conversation_mode,
        configName: sseConfigName
      };

      // Заполняем turnsMap: модель ПОХОДОВО по thinking_enabled.
      // v9 (O-15): ход = user + assistant(reasoning+answer). Узел-assistant БЕЗ ответа
      // (фрагменты только THINK — «пара assi+assi» из живого лога) отдельным ходом не
      // становится: его рассуждение приклеивается к следующему assistant-узлу, а если
      // следующего нет — к предыдущему (у которого ответ уже есть). В v8 такой узел
      // отбрасывался (`if (!text) continue`) — reasoning терялся, а пара сбивалась.
      var pendingReasoning = '';
      var lastAssistantId = null;
      for (var c = 0; c < chain.length; c++) {
        var ch = chain[c];
        var chId = String(ch.message_id);
        if (turnsMap[chId]) continue;          // дедуп
        var fragments = Array.isArray(ch.fragments) ? ch.fragments : [];
        var text = collectTurnText(fragments, ch.role);
        var chRole = (!ch.role) ? 'unknown' : (ch.role === 'USER' ? 'user' : (ch.role === 'ASSISTANT' ? 'assistant' : 'unknown'));
        // v8 (O-7): reasoning хода — фрагменты THINK; в текст уходит секциями [REASONING]/[ANSWER]
        var chReasoning = REASONING_ENABLED ? collectTurnReasoning(fragments, ch.role) : '';
        if (chRole === 'assistant') {
          if (!text) {
            // reasoning без ответа: НЕ отдельное сообщение и не потеря
            if (chReasoning) {
              if (lastAssistantId && turnsMap[lastAssistantId]) {
                var prevTurn = turnsMap[lastAssistantId];
                prevTurn.reasoning = (prevTurn.reasoning || '') + chReasoning;
                prevTurn.text = composeTurnText(prevTurn.answer || '', prevTurn.reasoning);
              } else {
                pendingReasoning += chReasoning;   // ждём ответ следующего assistant-узла
              }
            }
            continue;
          }
          var mergedReasoning = pendingReasoning + chReasoning;
          pendingReasoning = '';
          turnsMap[chId] = {
            text: composeTurnText(text, mergedReasoning),
            answer: text,                        // v9: ответ хода (для пересборки при хвостовом reasoning)
            reasoning: mergedReasoning,
            modelSlug: getModelSlug(ch.thinking_enabled === true, chatModelSignals),
            order: orderCounter++,
            ts: ch.inserted_at || 0,
            role: chRole
          };
          lastAssistantId = chId;
          continue;
        }
        // Сообщение из ОДНИХ вложений: у пользовательского хода нет REQUEST-текста, поэтому
        // раньше он молча пропускался, а файловый модуль заводил ход-заглушку уже ПОСЛЕ
        // цикла — с order из хвоста orderCounter, и текст вложения уезжал в конец экспорта.
        // Заводим ход ЗДЕСЬ: order берётся на своём месте в цепочке, а текст файла допишется
        // в t.text, когда ответ files.deepseeksvc.com придёт (applyFileTextToTurn).
        if (!text) {
          if (chRole === 'user' && typeof filesMessageHasRefs === 'function' && filesMessageHasRefs(ch)) {
            turnsMap[chId] = {
              text: '',
              answer: '',
              reasoning: '',
              modelSlug: getModelSlug(ch.thinking_enabled === true, chatModelSignals),
              order: orderCounter++,
              ts: ch.inserted_at || 0,
              role: chRole
            };
          }
          continue;
        }
        turnsMap[chId] = {
          text: composeTurnText(text, chReasoning),
          answer: text,
          reasoning: chReasoning,
          modelSlug: getModelSlug(ch.thinking_enabled === true, chatModelSignals),
          order: orderCounter++,
          ts: ch.inserted_at || 0,
          role: chRole
        };
      }
      // v9 (O-15): «висячий» reasoning в конце цепочки (assistant-узел без ответа и без
      // последующего ответа) доливаем в последний assistant-ход — отдельного хода нет.
      if (pendingReasoning && lastAssistantId && turnsMap[lastAssistantId]) {
        var tailTurn = turnsMap[lastAssistantId];
        tailTurn.reasoning = (tailTurn.reasoning || '') + pendingReasoning;
        tailTurn.text = composeTurnText(tailTurn.answer || '', tailTurn.reasoning);
      }

      // O-18 (ИЗМЕРЕНИЕ): снимок ПРИНЯТ как авторитетный — фиксируем ветку и per-turn
      // NETWORK-текст (ровно тот, что сейчас лежит в turnsMap и уйдёт в экспорт).
      diagMark('ingest-branch-ACCEPT', {
        chainLen: chain.length, chatMessages: chatMessages.length,
        reachedRoot: chainResult.reachedRoot === true, truncated: chainResult.truncated === true
      });
      diagSnapshotNetTurns('ingestHistory');
      // v12 (O-18, фаза 2): снимок сети ПРИНЯТ — фиксируем его время и состав ходов.
      // По этим данным экспорт решает, нужен ли дозапрос («снимок старше последнего хода»).
      netSnapshotAt = Date.now();
      netTurnIds = {};
      for (var nk in turnsMap) {
        if (Object.prototype.hasOwnProperty.call(turnsMap, nk)) netTurnIds[nk] = 1;
      }

      // УСЛОВИЕ 1: accumulated_token_usage — максимум по всем сообщениям цепочки (накопительное, монотонно растёт)
      var lastAccumulated = 0;
      for (var ci = 0; ci < chain.length; ci++) {
        var at = chain[ci].accumulated_token_usage;
        if (typeof at === 'number' && at > lastAccumulated) {
          lastAccumulated = at;
        }
      }

      // O-22 (ИЗМЕРЕНИЕ-2): маркер ТОЧКИ диспатча ai-cm-full-history (site=S692).
      try {
        if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
          diagMark('o22-dispatch-site', {
            site: 'S692', ts: Date.now(),
            count: Object.keys(turnsMap).length, textLen: '(вне области)'
          });
        }
      } catch (eO22s692) { /* ignore */ }
      // Step D.10 (Вариант B): ПРИНЯТУЮ цепочку отдаём файловому модулю — он заводит
      // ходы-заглушки для сообщений из одних вложений, ставит файлы в FIFO-очередь и
      // возвращает уже скачанные тексты в ТОЛЬКО ЧТО пересобранный turnsMap (повторный
      // ingest не качает файл заново — дедуп convId|fileId и карта fileTextsByMsg живут
      // дольше одного снимка). Ошибка связки не имеет права сорвать приёмку истории.
      try {
        if (typeof enqueueChainFiles === 'function') enqueueChainFiles(chain, chatModelSignals);
        if (typeof applyPendingFileTexts === 'function') applyPendingFileTexts();
      } catch (eFilesD10) {
        if (typeof aiCmDiagWarn === 'function') aiCmDiagWarn('deepseek:ingestHistory', '[deepseek-intercept] связка файлов не сработала:', eFilesD10);
      }
      var em = emitBaseSnapshot(lastAccumulated, chatMode);
      if (!loggedHistory) {
        loggedHistory = true;
        console.log('[deepseek-intercept] ✓ история загружена: ходов=' + em.count +
          ', символов=' + em.textLen + ', модель=' + (em.lastModel || '?') +
          ', serverTokens=' + lastAccumulated +
          (lastAccumulated > 0 ? ' (' + Math.round(lastAccumulated / MODEL_WINDOW_DEFAULT * 1000) / 10 + '%)' : '') +
          ', modelMode=' + (chatMode || '(default)') +
          ', reasoning-ходов=' + em.reasoningTurns);   // v8 (O-7)

        // ДИАГНОСТИЧЕСКИЙ ДАМП — только при включённом флаге aiCmDebug
        if (isDebugEnabled()) {
          var diagState = determineState();
          dumpHistorySnapshot(diagState.state, diagState.reason, {
            capturePoint: 'ingestHistory',
            navType: diagState.navType,
            chatMessages: chatMessages,
            chatSession: chatSession,
            chain: chain,
            lastAccumulated: lastAccumulated,
            chatMode: chatMode
          });
          // O-26: однократный вербатим-дамп usage по ходам (точка — загрузка истории).
          // Ничего не пишет в turnsMap/состояние, на pct/serverTokens/экспорт не влияет.
          dumpTurnUsageAtHistoryLoad(chain, chatMessages, chatSession);
        }
      }
    } catch (e) {
      aiCmDiagWarn('deepseek:ingestHistory', '[deepseek-intercept] ошибка парсинга history_messages:', e);
    }
  }

      Fn.ingestHistory = ingestHistory;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekIngest = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-files.js ===== */

/**
 * core/deepseek-files.js — Step D.10 (Вариант B + A-лайт): асинхронная догрузка ТЕКСТА
 * вложений DeepSeek в MAIN-мире.
 *
 * Зачем: фрагмент типа FILE в history_messages/completion несёт только МЕТАДАННЫЕ файла
 * (file_id/имя), а тело лежит на ОТДЕЛЬНОМ файловом хосте:
 *   GET https://files.deepseeksvc.com/api/file?file_id=<id>[&state=<signed_path>]
 * Без текста вложения ход в экспорте состоит из одной метки, то есть файл (PDF/док)
 * теряет содержимое. JSON-вложения (дампы вида {"code":0,"data":{…}}) не имеют текстовых
 * полей — для них содержимым файла считается СЫРОЕ тело ответа.
 *
 * Что делает модуль (Вариант B — асинхронная догрузка):
 *   • при ПРИЁМКЕ авторитетного снимка (D.8, ветка ACCEPT) ядро отдаёт цепочку ходов сюда —
 *     enqueueChainFiles(chain, chatModelSignals): из каждого хода вынимаются ссылки на файлы
 *     (fragment.type === 'FILE', fragment.files[], msg.files[], msg.attachments[]). Ход из
 *     ОДНИХ вложений создаёт сам ingest на его месте в цепочке (предикат messageHasRefs),
 *     а filesEnsureTurn остаётся страховкой для путей, где turnsMap собран не D.8;
 *   • файлы ставятся в FIFO-очередь (concurrency 2, дедуп по `convId|fileId`: один файл,
 *     приложенный к нескольким ходам, качается ОДИН раз);
 *   • fetchFileContent(fileId, signedPath) идёт ЧЕРЕЗ originalFetch (снят ядром до хука D.7)
 *     на files.deepseeksvc.com, БЕЗ заголовков и БЕЗ кук (credentials:'omit': файловый хост
 *     авторизует запрос подписью в signed_path, а credentialed CORS-запрос ломает ответ), таймаут
 *     10 с и кап 2 000 000 символов (файл на 1 МБ не теряет хвост);
 *   • при получении текста обновляется fileTextsByMsg (`<convId>\u0000<msgId>` → СПИСОК файлов
 *     сообщения: ключ включает разговор, чтобы одинаковый message_id из другого чата не подмешал
 *     чужой файл); затем текст хода ПЕРЕСОБИРАЕТСЯ: composeTurnText(answer, reasoning) + по секции
 *     на КАЖДЫЙ файл (порядок — как во вложениях сообщения), формат секции
 *     «\n\n[FILE: <имя>]\n<текст>»; затем с дебаунсом 250 мс вызывается emitBaseSnapshot —
 *     база уезжает в ISOLATED-мир и попадает в history_messages экспорта;
 *   • A-лайт (core/base-handler.js): перед композицией файла проверяется, ПУСТА ли очередь;
 *     если нет — ждём до 2000 мс (протокол ai-cm-deepseek-files-drain/-done), затем пишем
 *     файл и в лог уходит `reason=file-queue-timeout`.
 *
 * Контракт связки (как у D.1-D.9): ядро -> модуль ТОЛЬКО через __bind(deps). Имена:
 *   fn (3): emitBaseSnapshot — форвардер D.6 (ре-эмит после прихода текста);
 *           composeTurnText/getModelSlug — форвардеры D.4 (пересборка текста хода).
 *   rw (2): turnsMap/orderCounter — тело ДОБАВЛЯЕТ ход-заглушку для вложений без текста
 *           и перезаписывает text уже собранного хода (set — чтобы запись не терялась).
 *   ro (4): currentConvId (ключ дедупа), originalFetch (запрос тела),
 *           lastBaseServerTokens/lastBaseChatMode (аргументы ре-эмита).
 *   Итого 9 имён (3 fn + 2 rw + 4 ro).
 *   связка: ядро форвардит в модуль enqueueChainFiles/applyPendingFileTexts (форвардеры D.10),
 *   а модуль отдаёт ядру предикат filesMessageHasRefs — его ingest зовёт, чтобы завести ход из
 *   одних вложений на своём месте (D.11).
 *   Сброс: ядро (resetForNewConversation) зовёт Fn.resetFiles() при смене разговора — очередь,
 *   карта текстов и ожидания прежнего чата не переезжают в следующий (фикс утечки между чатами).
 *
 * Метрики serverTokens/tokens~ НЕ ТРОГАЮТСЯ: модуль не считает токены, он лишь дописывает
 * текст хода и просит ядро переопубликовать базу тем же emitBaseSnapshot; счётчик токенов
 * и подпись диспатча считаются там же, где и раньше.
 *
 * Жизненный цикл: документ-скоуп MAIN-мира, живёт столько же, сколько ядро. Повторная
 * загрузка гардится (window.AiCmDeepseekFiles), как у D.1-D.9.
 *
 * Зоны (стандарт D.x): PURE-зона — состояние очереди/чистые хелперы без состояния ядра;
 * BIND-зона — тела внутри `with (D)`, которым нужны turnsMap/emitBaseSnapshot/fetch.
 * Прямых обращений вида `D.` в файле нет — только свободные имена в `with (D)`.
 */
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekFiles) return;

  // Зависимости ядра. Заполняется ровно один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ===== СЕКЦИЯ 14: ОЧЕРЕДЬ ТЕКСТА ВЛОЖЕНИЙ (PURE-зона) =====
  // Константы протокола догрузки. Кап/таймаут — требование задачи (Вариант B): одно
  // вложение не имеет права ни раздуть память (500k символов), ни подвесить очередь (10 с).
  var FILES_CONCURRENCY = 2;          // одновременно в полёте (FIFO, остальное ждёт)
  var FILES_TEXT_CAP = 2000000;       // символов текста на файл (жёсткий кап; 1 МБ файла целиком)
  var FILES_FETCH_TIMEOUT_MS = 10000; // запрос тела файла
  // v2.0.37 (PDF): файл-PDF (в пределах 10 МиБ) скачивает и разбирает pdf.js —
  // байты идут через MAIN-хелпер core/pdf-bytes.js, текст возвращается как текст.
  var FILES_PDF_MAX = 10 * 1024 * 1024;
  var FILES_PDF_TIMEOUT_MS = 15000;
  var FILES_EMIT_DEBOUNCE_MS = 250;   // ре-эмит базы после прихода текста
  var FILES_DRAIN_TIMEOUT_MS = 2000;  // A-лайт: ожидание опустошения очереди у экспорта
  // Файловый хост DeepSeek (проверено по бандлу сайта и трафику): тело вложения отдаёт
  // files.deepseeksvc.com, а не chat.deepseek.com. Параметр файла — `file_id` (не `id`),
  // `ty=r` (raw) — дописываем, если типа в URL ещё нет; ty=p — превью картинки.
  // Путь — `/api/file`: префикс версии API `/api` ОБЯЗАТЕЛЕН (без него тело не отдаётся;
  // живой трафик сайта идёт на `files.deepseeksvc.com/api/file?file_id=…`, см. docs).
  var FILES_HOST = 'https://files.deepseeksvc.com';
  var FILES_FILE_URL = 'https://files.deepseeksvc.com/api/file';

  // v2.0.29 (Xray/Firefox): detail моста ISOLATED→MAIN приходит СТРОКОЙ (JSON.stringify в
  // core/base-handler.js). Объект чужого компартмента Firefox отдаёт MAIN-миру под
  // Xray-обёрткой, и чтение его полей падает «Permission denied to access property».
  // Разбираем строку; объект принимаем как есть (старые отправители, фикстуры jsdom).
  function aiCmBridgeDetail(ev) {
    var raw = (ev && ev.detail !== undefined) ? ev.detail : null;
    if (typeof raw !== 'string') return raw || null;
    try { return JSON.parse(raw); } catch (eBd) { return null; }
  }

  // Очередь: FIFO-массив элементов + карта дедупа по `convId|fileId` + счётчик активных.
  // Элемент: { key, convId, fileId, signedPath, name, msgIds:{}, status, startedAt, doneAt }.
  var fileQueue = [];
  var fileQueueByKey = {};
  var fileQueueActive = 0;
  // Результат: `<convId>\u0000<msgId>` -> [ { convId, fileId, name, text, truncated, failed, order, at }, ... ].
  // СПИСОК, а не одна запись: в одном сообщении бывает 3–4 вложения (живой кейс 2026-10-24: из
  // четырёх файлов в экспорт попадал РОВНО ОДИН — последний по времени прихода, остальные
  // затирались). Ключ включает convId: одинаковый message_id в ДВУХ чатах (у DeepSeek он
  // приходит из history_messages) раньше перетирал чужой текст и подмешивал файл старого чата
  // в новый. Живёт до конца разговора (или до явного resetFiles при смене чата):
  // ход может пережить несколько ingest'ов (SPA-навигация, дозапрос), и текст должен
  // примениться к ПЕРЕСОБРАННОМУ turnsMap без повторного запроса.
  var fileTextsByMsg = {};
  // Поколение файлового состояния. resetFiles() инкрементит его: fetch, поставленный ДО
  // смены чата, не имеет права воскресить запись уже после сброса (его завершение
  // отбрасывается по epoch, а не пишет в пустую карту нового разговора).
  var filesEpoch = 0;
  // Отложенный ре-эмит базы (дебаунс 250 мс) и ожидающие A-лайт-запросы экспорта.
  var filesEmitTimer = null;
  var filesDrainWaiters = [];

  // Ключ карты текстов: разговор + сообщение. NUL — разделитель, которого не бывает в
  // convId/message_id, поэтому склейка однозначна.
  function fileTextKey(convId, msgId) {
    return fileStr(convId) + '\u0000' + ((msgId === undefined || msgId === null) ? '' : String(msgId));
  }

  // Полный сброс файлового состояния на смену разговора. Зовётся ядром через контракт
  // __bind (resetFiles) из resetForNewConversation (core/deepseek-conv.js): текст и очередь
  // вложений принадлежат ОДНОМУ чату и не переезжают в следующий. Заодно гасим отложенный
  // ре-эмит и ожидания экспорта — они относятся к прежнему разговору.
  function resetFiles() {
    filesEpoch++;
    fileTextsByMsg = {};
    fileQueue = [];
    fileQueueByKey = {};
    fileQueueActive = 0;
    filesDrainWaiters.length = 0;
    if (filesEmitTimer !== null) { clearTimeout(filesEmitTimer); filesEmitTimer = null; }
    Fn.fileTextsByMsg = fileTextsByMsg;   // экспорт смотрит на АКТУАЛЬНУЮ карту, а не на старую
    return true;
  }

  // Канал диагностики: aiCmDiagWarn — глобал utils/debug.ts (канал B); в модульных
  // песочницах без него падаем на console.warn, но НИКОГДА не молчим в catch.
  function filesWarn(tag, msg, e) {
    // Канал B: bare console.warn запрещён стражем tests/no-bare-console-warn.test.js.
    // Нет aiCmDiagWarn (срез-песочница) — молчим, кольцо диагностики ведёт debug.js.
    if (typeof aiCmDiagWarn === 'function') aiCmDiagWarn(tag, msg, e);
  }

  function fileStr(v) {
    return (typeof v === 'string') ? v : '';
  }

  // Строка диагностики под гейтом aiCmDebug (utils/debug.ts сам решает, печатать ли).
  // В срез-песочницах без хелпера молчим: диагностика не имеет права ломать догрузку.
  function filesDiag(tag, fields) {
    if (typeof aiCmDiagLine === 'function') aiCmDiagLine(tag, fields);
  }

  // Тело ответа может прийти JSON-ом, JSON-строкой или сырым текстом — пробуем оба слоя.
  function fileMaybeJson(raw) {
    if (typeof raw !== 'string') return null;
    var s = raw.trim();
    if (!s) return null;
    var c = s.charAt(0);
    if (c !== '{' && c !== '[') return null;
    try { return JSON.parse(s); } catch (eParse) {
      filesWarn('deepseek:files:parse', '[deepseek-intercept] тело вложения не JSON:', eParse);
      return null;
    }
  }

  // Первая непустая строка по списку ключей (в т.ч. вложенный объект — на один уровень).
  function fileFirstText(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    for (var i = 0; i < keys.length; i++) {
      var v = obj[keys[i]];
      if (typeof v === 'string' && v) return v;
      if (v && typeof v === 'object') {
        for (var j = 0; j < keys.length; j++) {
          var v2 = v[keys[j]];
          if (typeof v2 === 'string' && v2) return v2;
        }
      }
    }
    return '';
  }

  // Ссылка на файл из объекта метаданных (fragment/files/attachments): id + подписанный путь.
  // Картинки (is_image:true или ty=p в готовом URL) в очередь ТЕКСТА не попадают: у них нет
  // текстового содержимого, а ty=p отдаёт превью, а не тело документа.
  function fileRefFromObject(o) {
    if (!o || typeof o !== 'object') return null;
    var id = o.file_id || o.fileId || o.id || o.fid || '';
    if (typeof id === 'number') id = String(id);
    id = fileStr(id);
    if (!id) return null;
    var signed = fileFirstText(o, ['signed_path', 'signedPath', 'path', 'url', 'download_url', 'file_path']);
    var name = fileFirstText(o, ['file_name', 'filename', 'name', 'title']);
    var ty = fileStr(o.ty).toLowerCase();
    if (!ty && signed) {
      var mTy = /[?&]ty=([a-z])/i.exec(signed);
      if (mTy) ty = mTy[1].toLowerCase();
    }
    // v2.0.37: тип и размер нужны, чтобы отличить PDF от прочих «нечитаемых» файлов
    // и уехать в pdf.js-ветку (сайт кладёт тип в file_type/content_type).
    var mime = fileFirstText(o, ['file_type', 'fileType', 'content_type', 'contentType', 'mime', 'mime_type', 'mimeType']);
    var sizeRaw = (o.size !== undefined && o.size !== null) ? o.size : ((o.file_size !== undefined) ? o.file_size : o.fileSize);
    var size = parseInt(sizeRaw, 10);
    if (!isFinite(size) || size < 0) size = 0;
    return {
      fileId: id,
      signedPath: signed || '',
      name: name || '',
      mime: fileStr(mime),
      size: size,
      isImage: (o.is_image === true || o.isImage === true || ty === 'p'),
      isPdf: /application\/pdf/i.test(fileStr(mime)) || /\.pdf$/i.test(name || '')
    };
  }

  // Метка-строка (фрагмент FILE иногда приходит текстом или JSON-строкой) — мягкий разбор.
  function fileRefFromText(text) {
    var s = fileStr(text);
    if (!s) return null;
    var obj = null;
    if (s.charAt(0) === '{' || s.charAt(0) === '[') obj = fileMaybeJson(s);
    if (obj && typeof obj === 'object') return fileRefFromObject(obj);
    var m = s.match(/(?:file[_-]?id|fileId)["'\s:=]+([A-Za-z0-9_-]{6,})/);
    if (!m) return null;
    return { fileId: m[1], signedPath: '', name: '', mime: '', size: 0, isImage: false, isPdf: false };
  }

  // Настоящий id файла сайт раздаёт как UUID (36 символов) или `file-…`; числовой «id»
  // вида `1` приезжает из попутных JSON-полей фрагмента и файлом не является: по нему нет
  // ни подписи, ни имени, сервер отвечает 400 без access-control-allow-origin → в текст
  // хода уезжала пустая метка `[FILE: 1 — текст не получен: network]` на каждом сообщении.
  var FILES_JUNK_ID_RE = /^\d{1,7}$/;

  // Ссылка осмысленна, если её можно скачать (есть подпись), либо у неё есть имя —
  // тогда даже неудача полезна: в экспорте видно, ЧТО не дочиталось.
  function filesRefUsable(ref) {
    if (fileStr(ref.signedPath)) return true;
    if (fileStr(ref.name)) return true;
    return !FILES_JUNK_ID_RE.test(fileStr(ref.fileId));
  }

  function filesPushRef(out, seen, ref) {
    if (!ref || !ref.fileId || seen[ref.fileId] || ref.isImage) return;
    if (!filesRefUsable(ref)) {
      filesDiag('deepseek-files-ref-skip', { fileId: ref.fileId, name: ref.name || '' });
      return;
    }
    seen[ref.fileId] = 1;
    out.push(ref);
  }

  // Все ссылки на файлы одного сообщения. Формы протокола (проверяются все):
  // fragments[].type === 'FILE' (объект или строка), fragments[].files[], msg.files[],
  // msg.attachments[] (иногда attachments лежат внутри fragments[] — тоже смотрим).
  function extractFileRefs(msg) {
    var out = [];
    var seen = {};
    if (!msg || typeof msg !== 'object') return out;
    var frags = Array.isArray(msg.fragments) ? msg.fragments : [];
    for (var i = 0; i < frags.length; i++) {
      var f = frags[i];
      if (!f || typeof f !== 'object') continue;
      if (f.type === 'FILE') {
        var own = fileRefFromObject(f);
        if (!own && typeof f.content === 'string') own = fileRefFromText(f.content);
        filesPushRef(out, seen, own);
      }
      if (Array.isArray(f.files)) {
        for (var j = 0; j < f.files.length; j++) filesPushRef(out, seen, fileRefFromObject(f.files[j]));
      }
      if (Array.isArray(f.attachments)) {
        for (var k = 0; k < f.attachments.length; k++) filesPushRef(out, seen, fileRefFromObject(f.attachments[k]));
      }
    }
    if (Array.isArray(msg.files)) {
      for (var m = 0; m < msg.files.length; m++) filesPushRef(out, seen, fileRefFromObject(msg.files[m]));
    }
    if (Array.isArray(msg.attachments)) {
      for (var n = 0; n < msg.attachments.length; n++) filesPushRef(out, seen, fileRefFromObject(msg.attachments[n]));
    }
    return out;
  }

  // Есть ли у сообщения хоть одно вложение. Нужно ingest-модулю (D.8): ход из ОДНИХ
  // вложений (у пользовательского сообщения нет REQUEST-текста) обязан родиться на своём
  // месте в turnsMap — со своим order, а не хвостовой заглушкой после всего цикла.
  function messageHasRefs(msg) {
    return extractFileRefs(msg).length > 0;
  }

  // Текст файла из ответа files.deepseeksvc.com: {ok, reason, text, name, truncated}.
  function filesTextFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.code === 'number' && payload.code !== 0) {
      return { ok: false, reason: 'api-' + payload.code, text: '' };
    }
    var inner = (payload.data && typeof payload.data === 'object') ? payload.data : payload;
    var text = fileFirstText(inner, ['content', 'text', 'file_content', 'body', 'content_text']);
    if (!text && typeof payload === 'object') text = fileFirstText(payload, ['content', 'text', 'file_content']);
    if (!text) return null;
    var name = fileFirstText(inner, ['file_name', 'filename', 'name', 'title']);
    var truncated = false;
    if (text.length > FILES_TEXT_CAP) {
      text = text.slice(0, FILES_TEXT_CAP);
      truncated = true;
    }
    return { ok: true, text: text, name: name || '', truncated: truncated };
  }

  // URL тела файла: параметр называется `file_id` (не `id`) — так его ждёт файловый хост.
  // Префикс версии API `/api` — обязательная часть пути: тело отдаётся только по
  // `/api/file?...`, без префикса — 404. Готовый signed_path уже подписан сайтом:
  //   `/api/file?...` — уходит как есть (нормализуем только имя параметра `id=`);
  //   `/file?...`     — префикс `/api` дописываем принудительно;
  //   пусто/иное      — фолбэк `/api/file?file_id=<id>[&state=<подпись>]`.
  // Склейка с хостом — БАЙТ-В-БАЙТ (остальное URL-кодировать нельзя: сломает подпись).
  // `ty=r` — сырое тело файла (raw), единственное значение, которое отдаёт содержимое;
  // дописываем, если типа в URL ещё нет (`ty=p` — превью картинки, его не качаем).
  // ЛОВУШКА: `ty=t` (тип «текст») сервер отвергает с 400, а у 400-ответа НЕТ заголовка
  // `access-control-allow-origin` → браузер режет ответ как CORS-ошибку (`net::ERR_FAILED`).
  // Именно на этом три предыдущих захода («вернуть /api», «id= → file_id=», «ty=t») и умирали.
  // Сайт подписывает путь со старым именем параметра (`id=`), поэтому нормализуем ТОЛЬКО имя
  // первого параметра: `id=` в начале строки параметров либо сразу после `&` → `file_id=`;
  // прочие вхождения (значения, `file_id=`, `&xid=`) не трогаем.
  var FILES_API_PREFIX = '/api';
  function fileUrlWithTy(url) {
    return (/[?&]ty=/i).test(url) ? url : url + '&ty=r';
  }
  function resolveFileUrl(fileId, signedPath) {
    var id = (fileId === undefined || fileId === null) ? '' : String(fileId);
    var signed = fileStr(signedPath);
    var apiFilePath = FILES_API_PREFIX + '/file?';
    if (signed.indexOf(apiFilePath) === 0) {
      return fileUrlWithTy(FILES_HOST + signed.replace(/([?&])id=/, '$1file_id='));
    }
    if (signed.indexOf('/file?') === 0) {
      return fileUrlWithTy(FILES_HOST + FILES_API_PREFIX + signed.replace(/([?&])id=/, '$1file_id='));
    }
    if (signed) return fileUrlWithTy(FILES_FILE_URL + '?file_id=' + encodeURIComponent(id) + '&state=' + signed);
    return fileUrlWithTy(FILES_FILE_URL + '?file_id=' + encodeURIComponent(id.replace(/^file-/, '')));
  }

  // Секция вложения в тексте хода. Метка файла видна в экспорте (заголовок [FILE: имя]).
  // Провал догрузки НЕ прячет файл: в экспорт едет метка с причиной — иначе по экспорту
  // нельзя понять, что вложение вообще было (раньше такие файлы исчезали бесследно).
  function filesSection(rec) {
    var name = (rec && rec.name) ? rec.name : ((rec && rec.fileId) ? rec.fileId : 'attachment');
    if (rec && rec.failed) {
      return '\n\n[FILE: ' + name + ' — текст не получен' + (rec.reason ? ': ' + rec.reason : '') + ']';
    }
    var text = (rec && rec.text) ? rec.text : '';
    return '\n\n[FILE: ' + name + ']\n' + text;
  }

  function filesPendingCount() {
    // Отложенный ре-эмит считается «в полёте»: экспорт не имеет права снять базу РАНЬШЕ,
    // чем ISOLATED-мир получит текст вложения (иначе файл уйдёт без содержимого).
    return fileQueue.length + fileQueueActive + (filesEmitTimer !== null ? 1 : 0);
  }

  function filesTextCount() {
    var ids = Object.keys(fileTextsByMsg);
    var n = 0;
    for (var i = 0; i < ids.length; i++) {
      var recs = fileTextsByMsg[ids[i]] || [];
      for (var j = 0; j < recs.length; j++) {
        if (recs[j] && recs[j].text) { n++; break; }
      }
    }
    return n;
  }

  // --- протокол A-лайт: синхронный опрос состояния и асинхронное ожидание опустошения ---
  function filesStateRespond() {
    try {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      window.dispatchEvent(new CustomEvent('ai-cm-deepseek-files-state-response', {
        detail: { pending: filesPendingCount(), active: fileQueueActive, queued: fileQueue.length, texts: filesTextCount() }
      }));
    } catch (eState) {
      filesWarn('deepseek:files:state', '[deepseek-intercept] состояние очереди вложений:', eState);
    }
  }

  function filesDrainRespond(requestId, detail) {
    try {
      var payload = { requestId: requestId };
      var keys = Object.keys(detail || {});
      for (var i = 0; i < keys.length; i++) payload[keys[i]] = detail[keys[i]];
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      window.dispatchEvent(new CustomEvent('ai-cm-deepseek-files-drain-done', { detail: payload }));
    } catch (eDone) {
      filesWarn('deepseek:files:drain', '[deepseek-intercept] ответ на ожидание очереди:', eDone);
    }
  }

  function filesDrainSettle(w, reason) {
    var idx = filesDrainWaiters.indexOf(w);
    if (idx === -1) return;
    filesDrainWaiters.splice(idx, 1);
    if (w.timer !== null) { clearTimeout(w.timer); w.timer = null; }
    filesDrainRespond(w.requestId, {
      ok: reason === 'drained',
      drained: reason === 'drained',
      reason: reason,
      pending: filesPendingCount(),
      waitedMs: Date.now() - w.at
    });
  }

  // Вызывается после каждого завершённого элемента очереди: очередь опустела — будим экспорт.
  function filesDrainKick(reason) {
    if (!filesDrainWaiters.length || filesPendingCount() > 0) return;
    var waiters = filesDrainWaiters.slice();
    for (var i = 0; i < waiters.length; i++) filesDrainSettle(waiters[i], reason || 'drained');
  }

  function filesDrainHandle(detail) {
    var reqId = detail && detail.requestId;
    if (!reqId) return;
    var cap = (detail && typeof detail.timeoutMs === 'number' && detail.timeoutMs > 0)
      ? detail.timeoutMs : FILES_DRAIN_TIMEOUT_MS;
    if (filesPendingCount() === 0) {
      filesDrainRespond(reqId, { ok: true, drained: true, reason: 'idle', pending: 0, waitedMs: 0 });
      return;
    }
    var w = { requestId: String(reqId), at: Date.now(), timer: null };
    w.timer = setTimeout(function () { filesDrainSettle(w, 'file-queue-timeout'); }, cap);
    filesDrainWaiters.push(w);
  }

  // Слушатели ставятся на загрузке модуля (до __bind): A-лайт спрашивает состояние
  // СИНХРОННО, потому что CustomEvent в DOM доставляется синхронно в оба мира.
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('ai-cm-deepseek-files-state-request', function () { filesStateRespond(); });
    window.addEventListener('ai-cm-deepseek-files-drain', function (ev) { filesDrainHandle(aiCmBridgeDetail(ev)); });
  }

  // ===== СЕКЦИЯ 15: ТЕЛА, КОТОРЫМ НУЖНО СОСТОЯНИЕ ЯДРА (BIND-зона) =====
  function __bind(d) {
    D = d;

    with (D) {
      // Роль хода для заглушки: тем же правилом, что D.8 (USER -> user, ASSISTANT -> assistant).
      function filesRole(role) {
        if (role === 'USER') return 'user';
        if (role === 'ASSISTANT') return 'assistant';
        return 'unknown';
      }

      function filesModelSlug(msg, modelSignals) {
        if (typeof getModelSlug !== 'function') return '';
        return getModelSlug(msg && msg.thinking_enabled === true, modelSignals || {});
      }

      // Следующий order для заглушки. orderCounter принадлежит ядру (rw): инкремент обязан
      // дойти до ЖИВОЙ переменной, иначе D.8 построит ходы в другом порядке.
      function filesNextOrder() {
        if (typeof orderCounter !== 'number') return 0;
        var n = orderCounter;
        orderCounter = n + 1;
        return n;
      }

      // Ход, состоящий ТОЛЬКО из вложений: D.8 его не создаст (у пользовательского хода нет
      // текста REQUEST, у ответа — RESPONSE), а экспорт обязан видеть сообщение. Заглушка
      // заводится сразу, текст приедет позже и пересоберёт t.text.
      function filesEnsureTurn(msg, modelSignals) {
        var id = String(msg.message_id);
        if (!turnsMap) return id;
        if (turnsMap[id]) return id;
        turnsMap[id] = {
          text: '',
          answer: '',
          reasoning: '',
          modelSlug: filesModelSlug(msg, modelSignals),
          order: filesNextOrder(),
          ts: msg.inserted_at || 0,
          role: filesRole(msg.role)
        };
        return id;
      }

      // Поставить все файлы сообщения в очередь. Дедуп: один convId|fileId — один запрос,
      // даже если файл приложен к нескольким ходам; msgId добавляется в карту элемента,
      // поэтому текст доедет до КАЖДОГО хода.
      function enqueueMessageFiles(convId, msg) {
        var refs = extractFileRefs(msg);
        if (!refs.length) return 0;
        var cid = fileStr(convId);
        if (!cid && typeof currentConvId === 'string') cid = currentConvId;
        var msgId = (msg && msg.message_id != null) ? String(msg.message_id) : '';
        var added = 0;
        for (var i = 0; i < refs.length; i++) {
          var ref = refs[i];
          var key = cid + '|' + ref.fileId;
          if (fileQueueByKey[key]) {
            var known = fileQueueByKey[key];
            if (msgId) {
              known.msgIds[msgId] = 1;
              known.orderByMsg[msgId] = i;
              // Ответ уже пришёл (файл приложен к НОВОМУ сообщению): из очереди элемент уже
              // вышел, filesOnFetched больше не вызовется — раскладываем сохранённый результат
              // сразу, иначе текст не доедет до нового хода никогда.
              if (known.result && typeof known.result === 'object') {
                filesPutRec(cid, msgId, filesRecFor(known, msgId));
                applyFileTextToTurn(cid, msgId);
              }
            }
            continue;
          }
          var item = {
            key: key,
            convId: cid,
            fileId: ref.fileId,
            signedPath: ref.signedPath,
            name: ref.name,
            msgIds: {},
            orderByMsg: {},
            status: 'queued',
            result: null,
            epoch: filesEpoch,
            startedAt: 0,
            doneAt: 0
          };
          if (msgId) {
            item.msgIds[msgId] = 1;
            item.orderByMsg[msgId] = i;
          }
          fileQueueByKey[key] = item;
          fileQueue.push(item);
          added++;
        }
        if (added) pumpFileQueue();
        return added;
      }

      // Точка входа из D.8 (ACCEPT-ветка): завести заглушки и поставить файлы в очередь.
      // Возвращает число поставленных в очередь файлов (0 — вложений нет).
      function enqueueChainFiles(chain, modelSignals) {
        if (!Array.isArray(chain)) return 0;
        var added = 0;
        for (var i = 0; i < chain.length; i++) {
          var msg = chain[i];
          if (!msg || msg.message_id == null) continue;
          if (!extractFileRefs(msg).length) continue;
          filesEnsureTurn(msg, modelSignals);
          added += enqueueMessageFiles(currentConvId, msg);
        }
        if (added) {
          filesDiag('deepseek-files-enqueue', {
            convId: currentConvId,
            files: added,
            queued: fileQueue.length,
            active: fileQueueActive
          });
        }
        return added;
      }

      function startFileFetch(item) {
        item.startedAt = Date.now();
        fetchFileContent(item.fileId, item.signedPath, item).then(function (res) {
          fileQueueActive--;
          if (fileQueueActive < 0) fileQueueActive = 0;
          // Разговор сменился, пока файл был в полёте: результат принадлежит прежнему чату и
          // после resetFiles() в карту не пишется (иначе сброс «воскресал» бы ответом).
          if (item.epoch !== filesEpoch) { pumpFileQueue(); return; }
          filesOnFetched(item, res);
          filesDrainKick('drained');
          pumpFileQueue();
        }, function (eFetch) {
          fileQueueActive--;
          if (fileQueueActive < 0) fileQueueActive = 0;
          if (item.epoch !== filesEpoch) { pumpFileQueue(); return; }
          item.status = 'failed';
          if (fileQueueByKey[item.key] === item) delete fileQueueByKey[item.key];
          filesDiag('deepseek-files-error', {
            fileId: item.fileId,
            reason: 'reject',
            error: (eFetch && eFetch.message) ? eFetch.message : String(eFetch)
          });
          filesWarn('deepseek:files:fetch', '[deepseek-intercept] вложение ' + item.fileId + ' не догружено:', eFetch);
          filesDrainKick('drained');
          pumpFileQueue();
        });
      }

      // FIFO с concurrency 2: берём из головы, пока в полёте меньше двух.
      function pumpFileQueue() {
        while (fileQueueActive < FILES_CONCURRENCY && fileQueue.length > 0) {
          var item = fileQueue.shift();
          if (!item || item.status !== 'queued') continue;
          item.status = 'active';
          fileQueueActive++;
          startFileFetch(item);
        }
      }

      // Запрос тела файла. originalFetch — НАТИВНЫЙ fetch, снятый ядром до хука D.7:
      // иначе собственный перехватчик перехватил бы свой же запрос вложения.
      // Ни заголовков, ни кук: файловый хост авторизует запрос подписью в signed_path, а
      // auth-заголовки чата/credentials:'include' превратили бы simple CORS-запрос в
      // credentialed и ответ без Access-Control-Allow-Credentials не прошёл бы вовсе.
      // v2.0.37: PDF опознаём по типу/имени — fileRefFromObject кладёт mime и isPdf.
      function filesPdfRef(ref) {
        if (!ref) return false;
        if (ref.isPdf === true) return true;
        if (/application\/pdf/i.test(fileStr(ref.mime))) return true;
        return /\.pdf$/i.test(fileStr(ref.name));
      }

      function filesPdfAvailable() {
        return typeof window !== 'undefined' && !!window.AiCmPdf &&
          typeof window.AiCmPdf.fromUrl === 'function';
      }

      // Байты тянет pdf-bytes.js тем же нативным fetch (подпись в URL, без кук), разбор —
      // pdf.js в offscreen-документе/event page. В очередь возвращается обычный {ok,text},
      // поэтому filesOnFetched/filesSection менять не нужно.
      function filesFetchPdf(url, ref, fetchImpl) {
        var pdf = (typeof window !== 'undefined') ? window.AiCmPdf : null;
        if (!pdf || typeof pdf.fromUrl !== 'function') {
          return Promise.resolve({ ok: false, reason: 'pdf-unavailable', text: '' });
        }
        return Promise.resolve(pdf.fromUrl(url, {
          fetch: fetchImpl,
          credentials: 'omit',
          name: fileStr(ref && ref.name),
          maxBytes: FILES_PDF_MAX,
          maxChars: FILES_TEXT_CAP,
          timeoutMs: FILES_PDF_TIMEOUT_MS
        })).then(function (r) {
          var res = r || {};
          var text = fileStr(res.text);
          return {
            ok: res.ok === true && text !== '',
            pdf: true,
            text: text,
            truncated: res.truncated === true,
            reason: fileStr(res.reason) || (res.ok === true ? '' : 'pdf-no-text')
          };
        }, function (ePdf) {
          filesWarn('deepseek:files:pdf', '[deepseek-intercept] pdf.js не разобрал PDF:', ePdf);
          return { ok: false, reason: 'pdf-host-error', text: '' };
        });
      }

      function fetchFileContent(fileId, signedPath, ref) {
        var url = resolveFileUrl(fileId, signedPath);
        var fetchImpl = (typeof originalFetch === 'function') ? originalFetch
          : ((typeof window !== 'undefined' && typeof window.fetch === 'function') ? window.fetch : null);
        if (!fetchImpl) return Promise.resolve({ ok: false, reason: 'no-fetch', text: '' });
        // v2.0.37: PDF не читаем как текст — байты и разбор отдаём pdf.js.
        if (filesPdfRef(ref)) {
          // Фикс A: раньше PDF без хелпера проваливался в текстовую ветку и
          // превращался в мусор UTF-8 без причины. Теперь причина видна в логе
          // и в записи (reason: pdf-unavailable).
          if (filesPdfAvailable()) return filesFetchPdf(url, ref, fetchImpl);
          filesDiag('deepseek-files-pdf-unavailable', { file: fileStr(ref && ref.name) });
          filesWarn('deepseek:files:pdf-unavailable', '[deepseek-files] pdf.js-хелпер недоступен, PDF не разобран: ' + fileStr(ref && ref.name));
          return Promise.resolve({ ok: false, reason: 'pdf-unavailable', text: '' });
        }
        filesDiag('deepseek-files-fetch-start', {
          fileId: fileId,
          url: url,
          timeoutMs: FILES_FETCH_TIMEOUT_MS
        });
        var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
        var opts = { method: 'GET', credentials: 'omit' };
        if (ctrl && ctrl.signal) opts.signal = ctrl.signal;
        return new Promise(function (resolve) {
          var settled = false;
          var timer = setTimeout(function () {
            if (settled) return;
            settled = true;
            if (ctrl) { try { ctrl.abort(); } catch (eAbort) { filesWarn('deepseek:files:abort', '[deepseek-intercept] abort вложения:', eAbort); } }
            resolve({ ok: false, reason: 'timeout', text: '' });
          }, FILES_FETCH_TIMEOUT_MS);
          function done(res) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(res || { ok: false, reason: 'empty', text: '' });
          }
          var p;
          try { p = fetchImpl(url, opts); } catch (eFetch) {
            filesWarn('deepseek:files:fetch', '[deepseek-intercept] fetch вложения упал:', eFetch);
            done({ ok: false, reason: 'fetch-throw', text: '' });
            return;
          }
          Promise.resolve(p).then(function (res) {
            if (!res || res.ok !== true) {
              done({ ok: false, reason: 'http-' + ((res && res.status) || '?'), text: '' });
              return;
            }
            return Promise.resolve(res.text()).then(function (raw) {
              var payload = fileMaybeJson(raw);
              if (payload && typeof payload === 'object') {
                var parsed = filesTextFromPayload(payload);
                if (parsed) { done(parsed); return; }
                // JSON разобрался, но текстовых полей в нём нет — это и есть СОДЕРЖИМОЕ
                // файла (дамп API вида {"code":0,"data":{…}}). Раньше здесь стоял 'no-text',
                // и JSON-вложения уходили в экспорт пустой меткой; идём в общий фолбэк
                // ниже и отдаём сырое тело. Ошибку сервера отдал filesTextFromPayload выше.
              }
              var rawText = fileStr(raw);
              if (!rawText) { done({ ok: false, reason: 'empty-body', text: '' }); return; }
              if (rawText.length > FILES_TEXT_CAP) rawText = rawText.slice(0, FILES_TEXT_CAP);
              done({ ok: true, text: rawText, name: '', truncated: rawText.length >= FILES_TEXT_CAP });
            }, function (eBody) {
              filesWarn('deepseek:files:body', '[deepseek-intercept] тело вложения не прочитано:', eBody);
              done({ ok: false, reason: 'body-error', text: '' });
            });
          }, function (eNet) {
            filesWarn('deepseek:files:net', '[deepseek-intercept] сеть вложения:', eNet);
            done({ ok: false, reason: 'network', text: '' });
          });
        });
      }

      // Пересобрать текст хода: база (answer + reasoning, как в D.8) + секция на КАЖДЫЙ файл
      // сообщения. Раньше запоминались ОДИН fileText/fileName — второе вложение затирало первое,
      // и из четырёх файлов в экспорт попадал только последний пришедший.
      // convId обязателен: текст чужого разговора не применяется даже при совпадении message_id.
      function applyFileTextToTurn(convId, msgId) {
        if (!turnsMap || !msgId) return false;
        var cid = fileStr(convId);
        if (cid !== fileStr(currentConvId)) return false;
        var recs = fileTextsByMsg[fileTextKey(cid, msgId)];
        if (!recs || !recs.length) return false;
        var t = turnsMap[msgId];
        if (!t) return false;
        var base = (typeof t.answer === 'string') ? t.answer : '';
        var reasoning = (typeof t.reasoning === 'string') ? t.reasoning : '';
        var core = base;
        if (typeof composeTurnText === 'function') core = composeTurnText(base, reasoning);
        var text = core;
        for (var i = 0; i < recs.length; i++) text += filesSection(recs[i]);
        if (t.text === text) return false;
        t.fileTexts = recs;   // ссылка на список — для дампов/диагностики; решение по тексту ниже
        t.text = text;
        filesDiag('deepseek-files-apply', {
          msgId: msgId,
          fileId: recs[0].fileId,
          name: recs[0].name || '',
          files: recs.length,
          chars: text.length - core.length
        });
        return true;
      }

      // Применить уже скачанные тексты к СВЕЖЕМУ turnsMap (D.8 только что его пересобрал).
      // Только текущий разговор: ключ карты — `<convId>\u0000<msgId>`, чужие записи не трогаем.
      function applyPendingFileTexts() {
        if (!turnsMap) return 0;
        var cid = fileStr(currentConvId);
        var ids = Object.keys(fileTextsByMsg);
        var applied = 0;
        for (var i = 0; i < ids.length; i++) {
          var sep = ids[i].indexOf('\u0000');
          if (sep === -1 || ids[i].slice(0, sep) !== cid) continue;
          var msgId = ids[i].slice(sep + 1);
          if (!turnsMap[msgId]) continue;
          if (applyFileTextToTurn(cid, msgId)) applied++;
        }
        if (applied) scheduleFilesEmit();
        return applied;
      }

      // Ре-эмит базы с дебаунсом 250 мс. Аргументы — те же, что у прошлого эмита ядра
      // (serverTokens/chatMode): токены не пересчитываются, подпись диспатча — по turnsMap.
      // filesEmitNow — тот же эмит без ожидания дебаунса: нужен, если A-лайт уже держит
      // экспорт и ждать 250 мс нельзя (иначе файл снимается раньше, чем текст доедет
      // до ISOLATED-мира). После эмита будим ожидающий экспорт: очередь могла опустеть.
      function filesEmitNow() {
        if (filesEmitTimer !== null) { clearTimeout(filesEmitTimer); filesEmitTimer = null; }
        if (typeof emitBaseSnapshot === 'function') {
          var tokens = (typeof lastBaseServerTokens === 'number') ? lastBaseServerTokens : 0;
          var mode = (typeof lastBaseChatMode === 'string') ? lastBaseChatMode : '';
          try { emitBaseSnapshot(tokens, mode); } catch (eEmit) {
            filesWarn('deepseek:files:emit', '[deepseek-intercept] ре-эмит после вложения:', eEmit);
          }
        }
        filesDrainKick('drained');
      }

      function scheduleFilesEmit() {
        if (filesEmitTimer !== null) { clearTimeout(filesEmitTimer); filesEmitTimer = null; }
        filesEmitTimer = setTimeout(filesEmitNow, FILES_EMIT_DEBOUNCE_MS);
      }

      // Положить запись файла в список сообщения: замена по fileId (повторный ingest) или
      // вставка на позицию order, чтобы секции шли как вложения в чате, а не как пришли ответы.
      // Ключ карты — `<convId>\u0000<msgId>`: одинаковые message_id из разных чатов не смешиваются.
      function filesPutRec(convId, msgId, rec) {
        var key = fileTextKey(convId, msgId);
        var recs = fileTextsByMsg[key];
        if (!recs) { recs = []; fileTextsByMsg[key] = recs; }
        for (var i = 0; i < recs.length; i++) {
          if (recs[i] && recs[i].fileId === rec.fileId) { recs[i] = rec; return; }
        }
        var pos = recs.length;
        for (var j = 0; j < recs.length; j++) {
          if ((recs[j].order || 0) > (rec.order || 0)) { pos = j; break; }
        }
        recs.splice(pos, 0, rec);
      }

      // Запись файла для конкретного хода из уже полученного ответа (item.result). Один и тот
      // же ответ раскладывается и по msgId первого снимка, и по msgId, который приехал позже
      // (файл приложен повторно к новому сообщению): тело второй раз не качаем.
      function filesRecFor(item, msgId) {
        var res = item.result || {};
        var ok = res.ok === true && !!res.text;
        return {
          convId: fileStr(item.convId),
          fileId: item.fileId,
          name: res.name || item.name || '',
          text: ok ? res.text : '',
          truncated: ok ? (res.truncated === true) : false,
          failed: !ok,
          reason: ok ? '' : (res.reason || 'empty'),
          order: item.orderByMsg[msgId] || 0,
          at: item.doneAt || Date.now()
        };
      }

      // Пришёл ответ по файлу: разложить текст по всем msgId элемента, пересобрать ходы,
      // переопубликовать базу. Ошибка — метка-заглушка в тексте хода + лог: очередь идёт дальше.
      function filesOnFetched(item, res) {
        item.doneAt = Date.now();
        item.result = (res && typeof res === 'object') ? res : { ok: false, reason: 'empty', text: '' };
        var ids = Object.keys(item.msgIds);
        var ok = item.result.ok === true && !!item.result.text;
        if (!ok) {
          item.status = 'failed';
          // Провал не должен «залипать» в дедупе: следующий ingest обязан попробовать снова.
          if (fileQueueByKey[item.key] === item) delete fileQueueByKey[item.key];
        } else {
          item.status = 'done';
        }
        var applied = 0;
        for (var i = 0; i < ids.length; i++) {
          // Метка с причиной и на провале: файл остаётся виден в экспорте, даже если тело не пришло.
          filesPutRec(item.convId, ids[i], filesRecFor(item, ids[i]));
          if (applyFileTextToTurn(item.convId, ids[i])) applied++;
        }
        if (!ok) {
          filesDiag('deepseek-files-error', {
            fileId: item.fileId,
            reason: item.result.reason || 'empty',
            ms: item.doneAt - item.startedAt
          });
          filesWarn('deepseek:files:fetch', '[deepseek-intercept] текст вложения не получен: fileId=' +
            item.fileId + ' reason=' + (item.result.reason || '-'));
          scheduleFilesEmit();
          return;
        }
        filesDiag('deepseek-files-fetch-done', {
          fileId: item.fileId,
          chars: item.result.text.length,
          truncated: item.result.truncated === true,
          ms: item.doneAt - item.startedAt,
          turns: ids.length,
          applied: applied
        });
        console.log('[deepseek-intercept] ✓ текст вложения: fileId=' + item.fileId +
          ', символов=' + item.result.text.length + (item.result.truncated === true ? ' (обрезан)' : '') +
          ', ходов=' + ids.length + ', применено=' + applied);
        scheduleFilesEmit();
      }

      // Снимок очереди для отладки/тестов (не влияет на протокол).
      function fileQueueStats() {
        return {
          queued: fileQueue.length,
          active: fileQueueActive,
          pending: filesPendingCount(),
          texts: filesTextCount(),
          keys: Object.keys(fileTextsByMsg)
        };
      }

      Fn.enqueueChainFiles = enqueueChainFiles;
      Fn.applyPendingFileTexts = applyPendingFileTexts;
      Fn.extractFileRefs = extractFileRefs;
      Fn.filesMessageHasRefs = messageHasRefs;
      Fn.fetchFileContent = fetchFileContent;
      Fn.fileQueueStats = fileQueueStats;
      Fn.fileTextsByMsg = fileTextsByMsg;
      Fn.resetFiles = resetFiles;
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekFiles = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-sse.js ===== */

// =============================================================================
// core/deepseek-sse.js — Step D.9 (декомпозиция core/deepseek-intercept.js).
// K6: SSE (СЕКЦИЯ 9 ядра, ДВЕ области 358-1046 + 1066-1136 HEAD 6e65e73, 760 строк) —
// сигналы модели потока v13 (sseModelSignals/ingestModelSettings), снимок и диспатч
// состояния живого потока (O-16: beginSseStream/endSseStream/resetStreamState/
// streamStateSnapshot/dispatchStreamState), белый список типов фрагментов и ресинк
// парсера из сырого кольца (v12/O-18: SSE_FRAGMENT_TYPES/streamKnownType/streamTypeShape/
// streamNoteMisroute/streamUnknownPush/streamLastValidFragment/streamResync), единая точка
// записи байтов контента (streamContentInto/streamPushFragment/streamAppendContent/
// streamSetContent), сборка текста хода (streamFragmentText/streamOtherText), обработка
// чанков (processChunk/processChunkCore), разбор потока по строкам (parseSSELines —
// постфактум и ИНКРЕМЕНТАЛЬНО, ловушка №2), терминал хода (finishSseStream), входные пути
// (parseSSE для XHR/фолбэка и consumeSseResponse для инкрементального чтения тела) и
// синхронный мост probe/flush для экспортёра (O-16).
//
// Кластер вынесен по образцу шагов D.1 (core/deepseek-diag.js) … D.8 (core/deepseek-ingest.js).
// Раньше все части жили в ОДНОМ IIFE, поэтому кластер обращался к состоянию ядра по именам.
// Теперь у модуля свой IIFE, и зависимости ядра приходят через __bind(deps).
//
// РАЗДЕЛЕНИЕ ПО SCOPE. Тела перенесены БАЙТ-В-БАЙТ и без префиксов D.
//   • PURE-зона держит байтовый заголовок СЕКЦИИ 9 (1 строка) и 11 module-owned
//     объявлений состояния потока: sseLastPath/sseLastOp/sseModel/sseModelPresent/
//     sseConversationMode/sseCurrentEvent/SSE_RESYNC_MAX_ENTRIES/SSE_RESYNC_MAX_CHARS/
//     sseResyncChars/SSE_UNKNOWN_MAX_CHARS/sseUnknownParts. Ни одной ссылки вне выреза у них
//     нет (проверено AST-обходом ядра), инициализаторы — литералы; ядру они не нужны.
//   • BIND-зона (внутри `with (D) { … }`) держит 26 тел и мост probe/flush. Причина
//     ЛЕКСИЧЕСКАЯ, а не скоростная (урок D.5): функция, объявленная ВНЕ with, НЕ видит
//     bind-имена — её замыкание не включает with-окружение, созданное в __bind.
//   • ЦЕНА with ЗДЕСЬ НЕ ПЕРЕБАЙТОВАЯ: собственные циклы K6 идут ПО ЧАНКАМ/СТРОКАМ
//     (processChunkCore — на чанк, parseSSELines — на строку потока), а перебайтовая работа
//     (FNV-хеш, кольца сырья) живёт в PURE-зоне core/deepseek-diag.js и зовётся
//     форвардерами diagMark/diagChunkRecord/diagFragState — динамический резолв приходится
//     на ВЫЗОВ, а не на байт тела ответа. Цикл восстановления streamResync крутит
//     ЛОКАЛЬНЫЕ bf/e.v и зовёт streamSetContent/streamAppendContent без свободных имён.
//     Живой замер обязателен (канарейка o18-frag-resync, аппендикс D.9).
//
// СОСТОЯНИЕ. 19 имён состояния ОСТАЛИСЬ var в ЯДРЕ и отданы живыми аксессорами: их читают
// K7 (finalizeRealtimeTurn: sseRequestMessageId/sseResponseMessageId/sseUserPrompt/
// sseThinkingEnabled/sseRealtimeFinalTokens/sseRealtimeEntryTokens/sseModelType, пишет
// sseTurnFinished) и контракты D.1 (rw sseFragments/sseFragmentTypes + ro sseStreamActive/
// sseTurnFinished/sseRequestMessageId/sseResponseMessageId/sseResyncRing/sseResyncCount/
// sseResyncBytes/sseUnknownCount/sseUnknownChars/SSE_FRAGMENT_TYPES), D.2 (ro
// sseRealtimeFinalTokens/sseModelType), D.7 (rw sseUserPrompt/sseParentMessageId/
// sseThinkingEnabled) и D.8 (ro sseConfigName). Без сеттеров запись в sloppy-режиме молча
// терялась бы: буфер фрагментов не наполнялся бы, копилка сброса не чистилась бы, а
// USER-ход live-потока терялся бы на старте следующего потока.
//   sseConfigName ОСТАЁТСЯ в ядре: её читает ro-геттер ingest-связки D.8
//   (core/deepseek-intercept.js, `get sseConfigName() { return sseConfigName; }`), поэтому
//   обещание аппендикса v48 «с D.9 переменная уезжает с телом K6» НЕ выполняется —
//   вынос потребовал бы правки контракта D.8.
//
// ЧТО НЕ УЕХАЛО. finalizeRealtimeTurn (K7) остался в ЯДРЕ: он пишет turnsMap/orderCounter,
// зовёт emitBaseSnapshot (единая точка публикации, сайт O-22 S1172), liveTurnRecord,
// composeTurnText/getModelSlug и диспетчеризует состояние потока. Модуль получает его
// ЗНАЧЕНИЕМ через __bind. Обратный поток — 9 форвардеров ядра по прежним именам:
// sseModelSignals/streamFragmentText/streamOtherText/dispatchStreamState (зовёт K7),
// resetStreamState (fn-передача в контракт D.5), streamKnownType (fn-передача в D.1),
// parseSSE/consumeSseResponse/ingestModelSettings (fn-передачи в D.7).
//
// Порядок подключения (core/background.js, registerSafe 'ai-cm-deepseek-intercept-v11',
// document_start, world MAIN): utils/debug.ts -> core/deepseek-diag.js ->
// core/deepseek-netsync.js -> core/deepseek-refetch.js -> core/deepseek-parse.js ->
// core/deepseek-conv.js -> core/deepseek-emit.js -> core/deepseek-net.js ->
// core/deepseek-ingest.js -> ЭТОТ ФАЙЛ -> core/deepseek-intercept.js.
// До связки на window.AiCmDeepseekSse лежит только __bind; после связки Fn заполнен ровно
// девятью телами (форвардеры ядра), остальные 17 тел наружу не выдаются.
// Мост probe/flush регистрируется в __bind (как и патчи D.5/D.7 — в одном синхронном
// document_start-пакете; между загрузкой модуля и связкой событий страницы не бывает).
// Экспорт: window.AiCmDeepseekSse + module.exports.
// =============================================================================
(function () {
  if (typeof window !== 'undefined' && window.AiCmDeepseekSse) return;

  // Зависимости ядра. Заполняется один раз через __bind(...) из core/deepseek-intercept.js.
  var D = null;
  var Fn = {};

  // ---- PURE-зона: байтовый заголовок СЕКЦИИ 9 + module-owned состояние K6 ----
  // ===== СЕКЦИЯ 9: ПАРСЕР SSE (постфактум и ИНКРЕМЕНТАЛЬНО, ловушка №2) =====

  var sseLastPath = null;
  var sseLastOp = null;

  // v13: сигналы нового контракта из SSE. model/modelPresent приходят в update_session
  // (в контракте 2026-10-03 — model:""), conversation_mode — там же ("DEFAULT").
  // sseConfigName — сессионный факт из /client/settings (name:"Instant"), НЕ сбрасывается
  // при смене потока (см. ingestModelSettings).
  var sseModel = null;
  var sseModelPresent = false;
  var sseConversationMode = null;

  var sseCurrentEvent = '';    // v9: текущее SSE-событие (разбор по строкам, в т.ч. инкрементальный)

  // Сырое кольцо дельт, ушедших ЗА последнюю валидную границу (в невалидный фрагмент) либо
  // отвергнутых как мусорный «тип». В здоровом потоке ПУСТО (нулевая цена по памяти и времени);
  // наполняется только в момент десинхрона — из него контент пересобирается, а не теряется.
  var SSE_RESYNC_MAX_ENTRIES = 512;
  var SSE_RESYNC_MAX_CHARS = 65536;

  var sseResyncChars = 0;

  // Контент фрагментов, чьё имя типа вне белого списка (незнакомый протокол): в буфер
  // фрагментов такой «тип» не попадает, но байты сохраняются для аварийного streamOtherText.
  var SSE_UNKNOWN_MAX_CHARS = 262144;
  var sseUnknownParts = [];

  function __bind(d) {
    D = d;
    with (D) {
  // ---- BIND-зона: 26 тел K6 + мост probe/flush; свободные имена резолвятся в with (D) ----

  // E3 (2026-10-11): первый захват активной конфигурации (пусто → значение) будит ядро: оно пересчитает slug ходов и опубликует снимок заново (имя локализуется — матч в ядре структурный).
  var e3IngestSettings = ingestModelSettings; // eslint-disable-next-line no-func-assign -- E3 wrapper of hoisted name
  ingestModelSettings = function (json) { var e3HadConfig = !!sseConfigName; e3IngestSettings(json); var e3Cfg = e3ReadModelConfig(json); if (e3Cfg) { try { window.dispatchEvent(new CustomEvent('ai-cm-deepseek-model-settings', { detail: e3Cfg })); } catch (eCfgEv) { diagMark('ai-cm-deepseek:settings-model-skip', {}); } }
    if (!e3HadConfig && sseConfigName) { try { window.dispatchEvent(new CustomEvent('ai-cm-deepseek-settings-captured')); } catch (eE3) { diagMark('e3-settings-event-skip', {}); } } };
  /** v13: сигналы модели текущего/последнего потока для __aiCmDeepseekResolveModelSlug. @returns {AiCmDeepSeekModelSignals} */
  function sseModelSignals() {
    return {
      modelPresent: sseModelPresent === true,
      model: sseModel,
      modelType: sseModelType,
      conversationMode: sseConversationMode,
      configName: sseConfigName
    };
  }

  /**
   * v13: запоминает активную конфигурацию модели из /api/v0/client/settings?scope=model.
   * Новый контракт: активная запись имеет model_type:"default" и name:"Instant" — имя модели
   * в сети отсутствует. Резолвер использует её как резервный сигнал (см. configName).
   * @param {any} json распарсенное тело ответа settings
   * @returns {void}
   */
  function ingestModelSettings(json) {
    try {
      var settings = json && json.data && json.data.biz_data && json.data.biz_data.settings;
      var list = settings && settings.model_configs && settings.model_configs.value;
      if (!Array.isArray(list)) return;
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c || c.enabled === false) continue;
        if (c.is_default === true || c.model_type === 'default' || i === 0) {
          if (c.name) sseConfigName = c.name;
          break;
        }
      }
    } catch (eSettings) { swallowSoft(eSettings, 'deepseek:ingestModelSettings'); }
  }

  // v10 (O-16): снимок состояния потока наружу (ISOLATED-мир). convId — тот же, что в
  // detail ai-cm-full-history (stale-conv гард экспортёра работает и здесь).
  function streamStateSnapshot() {    return {
      convId: currentConvId || getConvId() || '',
      active: sseStreamActive === true,
      turnFinished: sseTurnFinished === true
    };
  }
  function dispatchStreamState(reason) {
    try {
      var snap = streamStateSnapshot();
      snap.reason = reason || '';
      window.dispatchEvent(new CustomEvent('ai-cm-deepseek-stream-state', { detail: snap }));
    } catch (e) { /* ignore */ }
  }
  // v10 (O-16): НОВЫЙ поток начинается здесь — только тут буфер обнуляется целиком.
  // Поля ЗАПРОСА (prompt/parent_message_id/thinking_enabled) выставлены обёрткой fetch
  // ДО старта чтения ответа — их сброс обнулил бы USER-ход каждого live-ответа
  // (проверено harness'ом: live-экспорт начинался с assistant). Сохраняем и возвращаем.
  function beginSseStream() {
    var keepPrompt = sseUserPrompt;
    var keepParentId = sseParentMessageId;
    var keepThinking = sseThinkingEnabled;
    resetStreamState();
    sseUserPrompt = keepPrompt;
    sseParentMessageId = keepParentId;
    sseThinkingEnabled = keepThinking;
    sseStreamActive = true;
    dispatchStreamState('begin');
    diagMark('sse-begin', { promptLen: (keepPrompt || '').length });   // O-18 (ИЗМЕРЕНИЕ)
  }
  // v10 (O-16): тело ответа дочитано (или оборвано) — стрима больше нет.
  function endSseStream() {
    if (!sseStreamActive) return;
    sseStreamActive = false;
    dispatchStreamState('end');
    diagMark('sse-end', { turnFinished: sseTurnFinished === true });   // O-18 (ИЗМЕРЕНИЕ)
  }

  function resetStreamState() {
    // O-18 (ИЗМЕРЕНИЕ): срез буфера ПЕРЕД обнулением — если сброс случится посреди ответа,
    // здесь видно, какие фрагменты были выброшены (кандидат «потеря середины»).
    diagMark('stream-reset', {});
    sseStreamActive = false;   // v10 (O-16)
    sseTurnFinished = false;   // v10 (O-16)
    sseLastPath = null;
    sseLastOp = null;
    sseRealtimeEntryTokens = 0;
    sseRealtimeFinalTokens = 0;
    sseRequestMessageId = null;
    sseResponseMessageId = null;
    sseModelType = null;
    sseModel = null;             // v13
    sseModelPresent = false;     // v13
    sseConversationMode = null;  // v13
    sseUserPrompt = '';
    sseParentMessageId = null;
    sseThinkingEnabled = null;
    sseFragments = [];       // v9
    sseFragmentTypes = [];   // v9
    sseCurrentEvent = '';    // v9
    // v12 (O-18): сырое кольцо ресинка и аварийный бакет неизвестных типов относятся к
    // ТЕКУЩЕМУ потоку — новый поток/смена чата их не наследует (иначе байты прошлого хода
    // могли бы попасть в аварийный ответ следующего).
    sseResyncRing = [];
    sseResyncChars = 0;
    sseUnknownParts = [];
    sseUnknownChars = 0;
  }

  // v9 (O-15): последний фрагмент потока — цель пути response/fragments/-1/content.
  function streamLastFragment() {
    return sseFragments.length ? sseFragments[sseFragments.length - 1] : null;
  }

  function streamKnownType(t) {
    return (typeof t === 'string') && SSE_FRAGMENT_TYPES[t] === 1;
  }
  // Форма «объявления типа» — тот же признак, по которому парсер до фикса заводил новый тип.
  function streamTypeShape(v) {
    return (typeof v === 'string') && /^[A-Z][A-Z_]{2,}$/.test(v);
  }


  function streamNoteMisroute(op, val) {
    try {
      if (typeof val !== 'string' || !val) return;
      sseResyncRing.push({ op: (op === 'SET') ? 'SET' : 'APPEND', v: val });
      sseResyncChars += val.length;
      while (sseResyncRing.length > SSE_RESYNC_MAX_ENTRIES || sseResyncChars > SSE_RESYNC_MAX_CHARS) {
        var drop = sseResyncRing.shift();
        if (!drop) break;
        sseResyncChars -= (drop.v || '').length;
      }
    } catch (e) { /* ignore */ }
  }
  function streamUnknownPush(type, content) {
    try {
      var val = (typeof content === 'string') ? content : '';
      sseUnknownCount++;
      aiCmDiagWarn('deepseek:streamUnknownPush', '[deepseek-intercept] имя фрагмента вне белого списка ("' + String(type || '').slice(0, 32) +
        '") — тип не заводится; контент ' + val.length + ' симв. сохранён аварийным (логу/фолбэку)');
      if (val) {
        sseUnknownParts.push(val);
        sseUnknownChars += val.length;
        while (sseUnknownChars > SSE_UNKNOWN_MAX_CHARS && sseUnknownParts.length > 1) {
          var d = sseUnknownParts.shift();
          sseUnknownChars -= (d || '').length;
        }
      }
      diagMark('frag-unknown-type', { type: String(type || '').slice(0, 32), len: val.length });
    } catch (e) { /* ignore */ }
    return null;
  }
  // Последняя ВАЛИДНАЯ граница — последний фрагмент, чьё имя типа из белого списка.
  function streamLastValidFragment() {
    for (var i = sseFragments.length - 1; i >= 0; i--) {
      if (sseFragments[i] && streamKnownType(sseFragments[i].type)) return sseFragments[i];
    }
    return null;
  }
  // РЕСИНХРОН: буфер приведён в невалидное состояние (мусорный «тип» или наследство старого
  // буфера) → выбрасываем невалидные фрагменты и ПЕРЕСОБИРАЕМ содержимое последнего валидного
  // фрагмента из сырого кольца дельт с последней валидной границы (порядок и op сохранены).
  function streamResync(reason) {
    try {
      var keep = [];
      for (var i = 0; i < sseFragments.length; i++) {
        if (sseFragments[i] && streamKnownType(sseFragments[i].type)) keep.push(sseFragments[i]);
      }
      sseFragments = keep;
      var bf = streamLastValidFragment();
      if (!bf) {
        // валидной границы не было вовсе (поток начался с мусора): ответ — единственный
        // осмысленный приёмник байтов, их тип в тексте хода читается.
        bf = { type: 'RESPONSE', content: '' };
        sseFragments.push(bf);
      }
      sseFragmentTypes = [];
      for (var k = 0; k < sseFragments.length; k++) sseFragmentTypes.push(sseFragments[k].type);
      var bytes = 0;
      for (var r = 0; r < sseResyncRing.length; r++) {
        var e = sseResyncRing[r];
        if (!e) continue;
        if (e.op === 'SET') streamSetContent(bf, e.v); else streamAppendContent(bf, e.v);
        bytes += (e.v || '').length;
      }
      sseResyncRing = [];
      sseResyncChars = 0;
      sseResyncCount++;
      sseResyncBytes += bytes;
      aiCmDiagWarn('deepseek:streamResync', '[deepseek-intercept] десинхрон парсера фрагментов (' + reason + ') → ресинк: ' +
        'восстановлено ' + bytes + ' симв. из сырого кольца, фрагментов=' + sseFragments.length + ', ' +
        'типы=' + sseFragmentTypes.join(','));
      diagMark('frag-resync', {
        reason: String(reason || ''), recovered: bytes, frags: sseFragmentTypes.length,
        types: sseFragmentTypes.join(',')
      });
    } catch (e) { swallowSoft(e, 'deepseek:streamResync'); }
  }
  // Единая точка «куда положить БАЙТЫ контента»: только в ВАЛИДНЫЙ фрагмент. Байты в
  // невалидный фрагмент не пишутся никогда — сначала ресинк (это и есть механика K1:
  // позиционное переиспользование не должно уводить контент в мусорный «тип»).
  function streamContentInto(op, val) {
    var f = streamLastFragment();
    if (!f) return;
    if (!streamKnownType(f.type)) {
      streamNoteMisroute(op, val);
      streamResync('content-into-invalid-fragment');
      return;
    }
    if (op === 'SET') streamSetContent(f, val); else streamAppendContent(f, val);
  }
  function streamPushFragment(type, content) {
    if (typeof type !== 'string' || !type) return null;
    if (!streamKnownType(type)) return streamUnknownPush(type, content);   // v12 (O-18): белый список
    var f = { type: type, content: (typeof content === 'string') ? content : '' };
    sseFragments.push(f);
    sseFragmentTypes.push(type);
    return f;
  }
  // v9 (O-15): APPEND — дельта, НО сервер иногда перевыдаёт фрагмент целиком (значение
  // начинается с уже собранного). Тогда это замена, а не дубль. Среза с фиксированным
  // смещением НЕТ: только проверка префикса (indexOf === 0) — байты не теряются никогда.
  function streamAppendContent(f, val) {
    if (!f || typeof val !== 'string' || !val) return;
    var cur = f.content || '';
    if (cur && val.indexOf(cur) === 0) { f.content = val; return; }
    f.content = cur + val;
  }
  // v9 (O-15): SET — замена контента фрагмента. Укорачивать уже собранное нельзя: SET
  // приходит и как «полный текст на данный момент». Значение-префикс уже собранного — игнор.
  function streamSetContent(f, val) {
    if (!f || typeof val !== 'string' || !val) return;
    var cur = f.content || '';
    if (!cur) { f.content = val; return; }
    if (val === cur) return;
    if (cur.indexOf(val) === 0) return;
    f.content = val;
  }
  // v9 (O-15): текст всех фрагментов одного типа в порядке потока (та же склейка, что в
  // history_messages: join('') + trim) — live и история дают ОДИН И ТОТ ЖЕ текст.
  function streamFragmentText(type) {
    var parts = [];
    for (var i = 0; i < sseFragments.length; i++) {
      var f = sseFragments[i];
      if (f && f.type === type && typeof f.content === 'string') parts.push(f.content);
    }
    return parts.join('').trim();
  }
  // v9 (O-15): контент фрагментов «прочих» типов (TIP/SEARCH/…) — в текст хода не идёт,
  // но служит аварийным ответом, если RESPONSE-фрагментов в потоке не было вовсе
  // (незнакомый протокол): лучше показать текст, чем пустой ход.
  // v12 (O-18): сюда же добавлен контент фрагментов, чьё имя типа вне белого списка —
  // раньше такой «тип» заводился в буфере, теперь байты живут в аварийном бакете (тот же
  // текст на выходе, но мусорных типов в буфере нет).
  function streamOtherText() {
    var parts = [];
    for (var i = 0; i < sseFragments.length; i++) {
      var f = sseFragments[i];
      if (f && f.type !== 'THINK' && f.type !== 'RESPONSE' && typeof f.content === 'string') parts.push(f.content);
    }
    for (var u = 0; u < sseUnknownParts.length; u++) parts.push(sseUnknownParts[u]);
    return parts.join('').trim();
  }

  // O-18 (ИЗМЕРЕНИЕ): тонкая обёртка — снимает срез буфера фрагментов ДО и ПОСЛЕ обработки
  // чанка и кладёт сырьё в diag-кольцо. Тело вынесено в processChunkCore БЕЗ правок: при
  // выключенном флаге обёртка не делает ничего, кроме кэшированной проверки diagOn(), и
  // управление/результат обработки — ровно те же (в т.ч. все ранние return).
  function processChunk(path, op, val) {
    var dOn = diagOn();
    var dBefore = dOn ? diagFragState() : null;
    processChunkCore(path, op, val);
    if (dOn) diagChunkRecord(path, op, val, dBefore, diagFragState());
  }

  function processChunkCore(path, op, val) {
    // v9 (O-15): сокращённый чанк может прийти и после чанка массива фрагментов. Строка —
    // это либо объявление типа ('THINK'), либо порция КОНТЕНТА последнего фрагмента
    // (иначе текст молча терялся). Различаем по форме: типы — ВЕРХНИЙ_РЕГИСТР.
    // v12 (O-18): форма — ТОЛЬКО предварительный признак; имя типа обязано быть в белом
    // списке. Типоподобный токен вне списка — это БАЙТЫ КОНТЕНТА (десинхрон парсера):
    // он не заводит новый «тип», а возвращается в последний валидный фрагмент.
    if (typeof val === 'string' && (path === 'response/fragments' || path === 'fragments')) {
      if (streamTypeShape(val)) {
        if (streamKnownType(val)) { streamPushFragment(val, ''); return; }
        streamNoteMisroute(op, val);
        streamResync('type-out-of-whitelist:' + val.slice(0, 24));
        return;
      }
      streamContentInto(op, val);
      return;
    }
    // v9 (O-15): чанк массива фрагментов — это И объявление типа нового фрагмента,
    // И ПЕРВАЯ ПОРЦИЯ ЕГО КОНТЕНТА. Регистрируем тип и НЕ ТЕРЯЕМ content.
    if (Array.isArray(val) && (path === 'response/fragments' || path === 'fragments')) {
      var i, item, itemType;
      if (op === 'SET') {
        // SET авторитетен для СОСТАВА массива; контент совпадающих по позиции фрагментов
        // сливаем (streamSetContent не укорачивает уже собранное).
        var next = [];
        for (i = 0; i < val.length; i++) {
          item = val[i];
          itemType = (typeof item === 'string') ? item : ((item && typeof item.type === 'string') ? item.type : '');
          if (!itemType) continue;
          // v12 (O-18): имя типа из массива — тоже ТОЛЬКО из белого списка. Незнакомое имя
          // фрагментом не становится (иначе в буфере живёт мусорный «тип», который не читает
          // ни текст хода, ни диагностика); контент сохраняется аварийным бакетом.
          if (!streamKnownType(itemType)) { streamUnknownPush(itemType, (item && typeof item === 'object') ? item.content : ''); continue; }
          var prevF = sseFragments[i];
          var fS = (prevF && prevF.type === itemType) ? prevF : { type: itemType, content: '' };
          if (item && typeof item === 'object') streamSetContent(fS, item.content);
          next.push(fS);
        }
        if (!next.length && sseFragments.length) return;   // пустой SET не стирает собранное
        sseFragments = next;
        sseFragmentTypes = [];
        for (i = 0; i < next.length; i++) sseFragmentTypes.push(next[i].type);
        return;
      }
      // APPEND: строки — только объявление типа (['THINK']), объекты — тип + первая порция
      for (i = 0; i < val.length; i++) {
        item = val[i];
        if (typeof item === 'string') { streamPushFragment(item, ''); continue; }
        if (!item || typeof item.type !== 'string') continue;
        if (!streamKnownType(item.type)) { streamUnknownPush(item.type, item.content); continue; }   // v12 (O-18)
        // Перевыдача последнего фрагмента целиком (тот же тип + значение начинается с
        // уже собранного) — это продолжение/замена, а не новый фрагмент: не дублируем.
        var lastF = streamLastFragment();
        if (lastF && lastF.type === item.type && typeof item.content === 'string' && item.content &&
            (lastF.content || '').length > 0 && item.content.indexOf(lastF.content) === 0) {
          streamAppendContent(lastF, item.content);
          continue;
        }
        streamPushFragment(item.type, item.content);
      }
      return;
    }
    // Путь к контенту ПОСЛЕДНЕГО фрагмента: APPEND — дельта, SET — замена.
    // v12 (O-18): пишем только в валидный фрагмент (streamContentInto) — байты контента
    // в мусорный «тип» не уходят никогда.
    if (path === 'response/fragments/-1/content') {
      if (op === 'APPEND' || op === 'SET') streamContentInto(op, val);
    }
  }


  // v9 (O-15): разбор идёт ПО СТРОКАМ — один и тот же код обслуживает полный текст
  // (XHR/фолбэк: parseSSE) и инкрементальное чтение потока (consumeSseResponse).
  function parseSSELines(lines) {
    if (!Array.isArray(lines)) return;

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];

      // event: ... (v9: состояние события живёт в sseCurrentEvent — разбор идёт по строкам,
      // в т.ч. инкрементально, поэтому локальная переменная не годится)
      if (ln.indexOf('event:') === 0) {
        sseCurrentEvent = ln.slice(6).trim();
        continue;
      }

      // data: ...
      if (ln.indexOf('data:') !== 0) continue;
      var jsonStr = ln.slice(5).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      var obj;
      try { obj = JSON.parse(jsonStr); } catch (e) { swallowSoft(e, 'deepseek:parseSSELines'); continue; }

      // === ready ===
      if (sseCurrentEvent === 'ready' && obj.request_message_id) {
        // v10 (O-16): новый ход внутри ТОГО ЖЕ тела ответа (другой response_message_id) —
        // буфер предыдущего хода уже закрыт финалом, начинаем чистый: иначе фрагменты
        // двух ходов склеились бы в один. Раньше границей служил reset внутри финала.
        if (sseResponseMessageId && obj.response_message_id &&
            String(obj.response_message_id) !== String(sseResponseMessageId)) {
          beginSseStream();
        }
        sseRequestMessageId = obj.request_message_id;
        sseResponseMessageId = obj.response_message_id;
        sseModelType = obj.model_type || null;
        sseCurrentEvent = '';
        continue;
      }

      // === update_session (v13: model/conversation_mode нового контракта; updated_at не нужен) ===
      if (sseCurrentEvent === 'update_session') {
        var usResp = obj && obj.v && obj.v.response;
        if (usResp) {
          if (Object.prototype.hasOwnProperty.call(usResp, 'model')) {
            sseModelPresent = true;
            if (typeof usResp.model === 'string') sseModel = usResp.model;
          }
          if (usResp.conversation_mode) sseConversationMode = usResp.conversation_mode;
          if (usResp.model_type && !sseModelType) sseModelType = usResp.model_type;
        }
        sseCurrentEvent = '';
        continue;
      }

      // === close ===
      if (sseCurrentEvent === 'close') {
        if (sseRequestMessageId && sseResponseMessageId) {
          finalizeRealtimeTurn();
        }
        sseCurrentEvent = '';
        continue;
      }

      // === первый response-объект: {v:{response:{...}}} ===
      // Извлекаем accumulated_token_usage, model_type И начальный контент из fragments
      // (первый символ ответа приходит здесь, а не в APPEND-чанках — без этого теряется символ)
      if (obj.v && obj.v.response && typeof obj.v.response.accumulated_token_usage === 'number') {
        sseRealtimeEntryTokens = obj.v.response.accumulated_token_usage;
        sseModelType = sseModelType || obj.v.response.model_type || null;
        // v13: те же сигналы контракта могут прийти и в первом response-объекте
        if (Object.prototype.hasOwnProperty.call(obj.v.response, 'model')) {
          sseModelPresent = true;
          if (typeof obj.v.response.model === 'string') sseModel = obj.v.response.model;
        }
        if (obj.v.response.conversation_mode) sseConversationMode = obj.v.response.conversation_mode;

        // v9 (O-15): начальные фрагменты разбирает ТОТ ЖЕ код, что и APPEND/SET-чанки
        // (тип + контент). Первый envelope — SET состава, повторный — APPEND новых.
        var initFrags = obj.v.response.fragments;
        if (Array.isArray(initFrags)) {
          processChunk('response/fragments', sseFragments.length ? 'APPEND' : 'SET', initFrags);
        }
        continue;
      }

      // === финальный BATCH: {p:"response", o:"BATCH", v:[...]} ===
      if (obj.p === 'response' && obj.o === 'BATCH' && Array.isArray(obj.v)) {
        for (var b = 0; b < obj.v.length; b++) {
          var batchItem = obj.v[b];
          if (batchItem.p === 'accumulated_token_usage' && typeof batchItem.v === 'number') {
            sseRealtimeFinalTokens = batchItem.v;
          }
          if (batchItem.p === 'quasi_status' && batchItem.v === 'FINISHED') {
            if (sseRequestMessageId && sseResponseMessageId) {
              finalizeRealtimeTurn();
            }
          }
        }
        continue;
      }

      // === status FINISHED (страховка, если BATCH не сработал) ===
      if (obj.p === 'response/status' && obj.o === 'SET' && obj.v === 'FINISHED') {
        if (!sseRealtimeFinalTokens && sseRequestMessageId && sseResponseMessageId) {
          finalizeRealtimeTurn();
        }
        continue;
      }

      // === чанк с путём (запоминаем lastPath/lastOp для сокращённых чанков — ловушка №2) ===
      if (obj.p && obj.o) {
        sseLastPath = obj.p;
        sseLastOp = obj.o;
        processChunk(obj.p, obj.o, obj.v);
        continue;
      }

      // === сокращённый чанк (только v, без p и o) — используем запомненный путь ===
      if (obj.v !== undefined && sseLastPath && sseLastOp) {
        processChunk(sseLastPath, sseLastOp, obj.v);
        continue;
      }
    }
  }

  // v9 (O-15): конец тела ответа = ход завершён. Раньше терминалом были ТОЛЬКО
  // BATCH quasi_status FINISHED и event: close; если сервер не прислал ни того, ни другого,
  // последний ход сессии вообще не попадал в live-экспорт. v10 (O-16): повторный финал
  // БЕЗОПАСЕН и не теряет текст — finalizeRealtimeTurn обогащает существующий ход
  // (буфер потока живёт до конца тела ответа), а не отбрасывает более полный текст.
  function finishSseStream() {
    if (sseRequestMessageId && sseResponseMessageId) finalizeRealtimeTurn();
    diagMark('sse-finish', {});   // O-18 (ИЗМЕРЕНИЕ)
  }

  // v10 (O-16): синхронный мост ISOLATED → MAIN (тот же приём, что у Gemini-моста
  // aiCmGeminiTurnsSnapshotSync): экспортёр спрашивает состояние потока перед записью
  // файла и может принудительно закрыть незавершённый буфер.
  try {
    window.addEventListener('ai-cm-deepseek-stream-probe', function () {
      try {
        window.dispatchEvent(new CustomEvent('ai-cm-deepseek-stream-probe-response', {
          detail: streamStateSnapshot()
        }));
      } catch (eProbe) { /* ignore */ }
    });
    window.addEventListener('ai-cm-deepseek-stream-flush', function () {
      try {
        if (sseStreamActive === true) {
          finishSseStream();
          dispatchStreamState('flush');
        }
      } catch (eFlush) { swallowSoft(eFlush, 'deepseek:streamFlushBridge'); }
    });
  } catch (eStreamBridge) { /* ignore */ }


  function parseSSE(text) {
    if (typeof text !== 'string' || !text) return;
    beginSseStream();   // v10 (O-16): новый поток (XHR/фолбэк полного текста)
    parseSSELines(text.split('\n'));
    finishSseStream();
    endSseStream();
  }

  // v9 (O-15): инкрементальное чтение потока: полные строки уходят в разбор СРАЗУ, поэтому
  // терминальный чанк закрывает ход, не дожидаясь конца тела ответа (live-экспорт «сразу
  // после диалога» видел только предыдущие ходы). Клон tee-ится — чтение страницы не
  // затрагивается; если body/reader/TextDecoder недоступны (или это XHR-путь) — прежний
  // фолбэк на clone().text() (полный текст).
  // Чат может смениться ПОКА поток читается (SPA-переход по сайдбару): ходы старого чата
  // в новый turnsMap не подмешиваем — тихая проверка convId на каждом шаге чтения.
  function consumeSseResponse(resp, convId) {
    var sameConv = function () { return !convId || convId === currentConvId; };
    var clone = null;
    try { clone = resp.clone(); } catch (e) { clone = null; }
    if (!clone) return;
    // v10 (O-16): старт нового потока — буфер прошлого хода обнуляется ЗДЕСЬ, а не в финале.
    beginSseStream();
    var body = clone.body;
    var Dec = (typeof TextDecoder !== 'undefined') ? TextDecoder : null;
    if (!body || typeof body.getReader !== 'function' || !Dec) {
      if (typeof clone.text === 'function') {
        clone.text().then(function (txt) {
          if (sameConv()) { parseSSE(txt); endSseStream(); }
        }).catch(function () { if (sameConv()) endSseStream(); });
      } else {
        endSseStream();
      }
      return;
    }
    var reader = null;
    var dec = null;
    try {
      reader = body.getReader();
      dec = new Dec('utf-8');
    } catch (eR) {
      endSseStream();
      return;
    }
    var buf = '';
    function pump() {
      if (!sameConv()) {
        try { reader.cancel(); } catch (eC) { /* ignore */ }
        endSseStream();
        return Promise.resolve();
      }
      return reader.read().then(function (r) {
        if (!r || r.done) {
          if (buf) { parseSSELines([buf.replace(/\r$/, '')]); buf = ''; }
          if (sameConv()) finishSseStream();
          endSseStream();
          return;
        }
        var chunk = '';
        try { chunk = dec.decode(r.value, { stream: true }); } catch (eD) { chunk = ''; }
        buf += chunk;
        var idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          var line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          parseSSELines([line.replace(/\r$/, '')]);
        }
        return pump();
      });
    }
    pump().catch(function () { if (sameConv()) finishSseStream(); endSseStream(); });
  }

      // Экспорт тел, которые ядро зовёт по прежним именам (9 форвардеров).
      Fn.sseModelSignals = sseModelSignals;
      Fn.ingestModelSettings = ingestModelSettings;
      Fn.dispatchStreamState = dispatchStreamState;
      Fn.resetStreamState = resetStreamState;
      Fn.streamKnownType = streamKnownType;
      Fn.streamFragmentText = streamFragmentText;
      Fn.streamOtherText = streamOtherText;
      Fn.parseSSE = parseSSE;
      Fn.consumeSseResponse = consumeSseResponse;
    } /* F5 (P3-A): активная запись настроек (is_default:true, enabled:true) → снимок в ядро; иначе null. */ function e3ReadModelConfig(json) { var list = json && json.data && json.data.biz_data && json.data.biz_data.settings && json.data.biz_data.settings.model_configs && json.data.biz_data.settings.model_configs.value; if (!Array.isArray(list)) return null; for (var i = 0; i < list.length; i++) { var c = list[i]; if (!c || c.is_default !== true || c.enabled !== true) continue; var sseConfigModelType = c.model_type; var sseConfigIsDefault = c.is_default; var sseConfigEnabled = c.enabled; return { modelType: sseConfigModelType, isDefault: sseConfigIsDefault, enabled: sseConfigEnabled }; } return null; }
  }
  Fn.__bind = __bind;
  if (typeof window !== 'undefined') window.AiCmDeepseekSse = Fn;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fn;
}());


/* ===== core/deepseek-intercept.js ===== */

// core/deepseek-intercept.js (v11 = v10 + полнота базы и turnsMap в SPA-созданном чате: O-17)
// Перехватчик DeepSeek в МИРЕ САЙТА (world: "MAIN"), document_start. Регистрация — background.js.
// В этом шаге меняются ТОЛЬКО этот файл и adapters/deepseek-adapter.js (v9: DOM-ветка
// live-режима — роли ходов и панель reasoning). content.js / page-intercept.js /
// gemini-intercept.js / background.js / manifest / model-config — НЕ ТРОГАТЬ.
//
// Источник данных: перехват fetch/XHR в МИРЕ САЙТА (world:"MAIN", document_start).
// Тихая пагинация: НЕ НУЖНА (вся история в одном ответе history_messages).
// Числитель процента: accumulated_token_usage с сервера (без токенизатора).
// Гард перекрёста: chat_session_id из URL/тела vs currentConvId из location.pathname.
//
// ВНИМАНИЕ: ModelConfig НЕ доступен в world:MAIN (инжектится в ISOLATED мире контент-скрипта).
// Модель определяется ПОХОДОВО: сначала по сетевым сигналам нового контракта (v13),
// затем прежним фолбэком по thinking_enabled: true → r1, иначе → v3.
// model_type (expert/default) передаётся как modelMode в detail и участвует в детекции v13.
//
// v13 (2026-10-03): новый сетевой контракт DeepSeek. Имя модели в сети не передаётся
//   (SSE ready: model_type:"default"; SSE update_session: model:"", conversation_mode:"DEFAULT";
//   /client/settings: name:"Instant", model_type:"default"). Прежняя эвристика по
//   thinking_enabled давала устаревший slug (deepseek-r1/v3) и занижала лимит бейджа до
//   65536/128000 вместо 1 000 000. Теперь сигналы контракта маппятся в 'deepseek-v4.1-flash'
//   (см. __aiCmDeepseekResolveModelSlug ниже). Числитель (accumulated_token_usage) не тронут.
//
// v5: подавление ложной кнопки «Ошибки» на плитке расширения (chrome://extensions).
//   Причина: обёртка window.fetch подменяет оригинал, поэтому ЛЮБОЙ fetch страницы создаёт
//   промис внутри нашей обёртки. Когда чужой запрос страницы отклоняется без обработчика
//   (Failed to fetch при навигации/переключении/обрыве стрима), браузер видит unhandled
//   rejection и, поскольку промис создан в обёртке, приписывает ошибку расширению.
//   Решение: (1) тихий .catch на промисе originalFetch — снимает unhandled-сигнал для
//   чужих прерванных запросов, не меняя поведения страницы; (2) устранение висячих
//   Promise.reject(err) в onRejected цепочек истории и стрима (замена на пустую функцию).
//
// v6: детектор усечения истории после F5.
//   Проблема: при перезагрузке сервер иногда возвращает усечённый history_messages —
//   не полную цепочку, а «хвост». Существующий MERGE-дозапрос срабатывает только
//   при полностью пустом chat_messages.
//   Решение: buildActiveChain возвращает флаг truncated (цепочка оборвана — первый
//   parent_id не null, но сообщение отсутствует в chat_messages). При усечении —
//   однократный тихий дозапрос полной истории без cache_version/cache_reset_at.
//   Флаг дозапроса сбрасывается в resetForNewConversation для защиты от зацикливания.
//
// v7: (1) убран sort по inserted_at в buildActiveChain — NaN по ISO-строкам + инверсия
//     пары (assistant ранее user); хронология ТОЛЬКО parent_id + reverse.
//     (2) reachedRoot (корень = узел без parent_id) и честный historyComplete
//     пробрасываются в detail события и в диагностический дамп.
//     (3) в detail добавлен convId (зеркально gemini) — stale-conv гард в content.js
//     работает и для DeepSeek.
//     (4) роль unknown сохраняется как есть (не маппится в assistant), лог только
//     под debug-флагом.
//
// v8 (O-7): reasoning-цепочки (фрагменты type:"THINK") попадают в текст хода.
//   ФАКТ: DeepSeek ОТДАЁТ reasoning — и в history_messages (fragments[].type === 'THINK'),
//   и в SSE-потоке completion (тот же тип THINK; порядок фрагментов задаёт, куда идёт
//   порция content по пути response/fragments/-1/content). Это НЕ ограничение платформы:
//   в v7 и раньше константа INCLUDE_THINKING=false просто выбрасывала THINK из текста хода.
//   Решение: ответ (RESPONSE) и рассуждение (THINK) собираются раздельно; текст хода
//   получает секции [REASONING]…[ANSWER]… (только если reasoning непустой — ходы без
//   reasoning байтово прежние). В detail добавлены reasoningTexts и messages[].reasoning.
//   Подсчёт токенов НЕ тронут (числитель для DeepSeek — серверный accumulated_token_usage).
//
// v9 (O-15): парность ходов live-режима и целостность фрагментов reasoning/answer.
//   ПРИЧИНА 1 (потеря 2 символов и головы [ANSWER], «точка-паразит»): чанк
//   {p:"response/fragments", o:"APPEND", v:[{type,content}]} — это не только ОБЪЯВЛЕНИЕ
//   типа нового фрагмента, но и ПЕРВАЯ ПОРЦИЯ ЕГО КОНТЕНТА. v8 регистрировал только тип
//   (val[i].type), а content выбрасывал → у каждого нового фрагмента терялось начало:
//   2 символа ("Ре"→зультаты, "Те"→перь, "По"→хоже) там, где сервер прислал в этом чанке
//   ровно 2 символа, и вся порция целиком там, где он прислал больше (в т.ч. ведущий "\n\n").
//   Тот же выброс головы ответа давал [ANSWER], начинающийся с точки (выпал "Итог: берите
//   модель B", осталось ". Она дешевле").
//   РЕШЕНИЕ: поток фрагментов собирается как В HISTORY — массив {type, content} в порядке
//   прихода; APPEND = дельта, SET = замена (без среза с фиксированным смещением: только
//   проверка префикса indexOf === 0), контент чанков fragments[] больше не выбрасывается.
//   ПРИЧИНА 2 (потеря ходов live): (а) ход ассистента создавался только при НЕПУСТОМ
//   sseCollectedText — если ответ пришёл в чанке fragments[], хода не было вовсе
//   («ответы 1–2 отсутствуют»); (б) терминал хода обрабатывался только на BATCH
//   quasi_status FINISHED / close, поэтому последний ход сессии не попадал в live-экспорт
//   (у него не было ни close, ни quasi_status). РЕШЕНИЕ: ход создаётся при непустом ответе
//   ИЛИ reasoning; поток читается инкрементально (полные строки — сразу в разбор), а конец
//   тела ответа закрывает ход (finishSseStream) — терминальный чанк больше не обязателен.
//   ПРИЧИНА 3 (пара assi+assi, «reasoning — отдельное сообщение»): в history_messages
//   reasoning может прийти ОТДЕЛЬНЫМ assistant-сообщением (только THINK). v8 пропускал
//   такой узел (`if (!text) continue`) — reasoning терялся. РЕШЕНИЕ: ход = user +
//   assistant(reasoning+answer): узел-assistant без ответа не становится ходом, его
//   рассуждение приклеивается к следующему (или предыдущему) assistant-узлу.
//   ИНВАРИАНТ: для одного чата live-экспорт и экспорт из истории совпадают по составу ходов
//   и по байтам текста (проверяется tools/_o7-reasoning-verify.js и tests/adapters/
//   deepseek-o15-pairing.test.js). Формат [REASONING]/[ANSWER], токены и прочие сервисы
//   не тронуты.
//
// v10 (O-16): ход ассистента больше не «замерзает» усечённым на живом стриме.
//   СИМПТОМ (живой прогон): файл автоэкспорта (histSource=memory) обрывался на полуслове
//   в последнем ответе ассистента, хотя в сети полный текст уже был.
//   ПРИЧИНА: терминальный чанк (quasi_status FINISHED / event: close / конец тела)
//   может прийти ДО того, как сервер дослал остаток ответа. finalizeRealtimeTurn в этот
//   момент (а) создавал assistant-ход с ЧАСТИЧНЫМ текстом и (б) вызывал resetStreamState(),
//   который обнулял sseRequestMessageId/sseResponseMessageId. Досланные после этого
//   фрагменты копились в новом буфере, но закрыть ход было уже нечем (finishSseStream
//   требует непустые id) — а гард `!turnsMap[assistantId]` запрещал обогатить уже
//   созданный ход. Итог: в memory-базе (lastBaseTexts) навсегда оставался усечённый ход,
//   и автоэкспорт/ручной экспорт писали файл «по полуслово».
//   РЕШЕНИЕ: (1) полный сброс потока — ТОЛЬКО на старте НОВОГО потока (beginSseStream)
//   и при смене чата; (2) повторный финал того же потока обогащает существующий ход
//   более полным текстом (merge «длиннее побеждает», без потери уже собранного);
//   (3) наружу отдаётся состояние потока: синхронный probe
//   'ai-cm-deepseek-stream-probe' → 'ai-cm-deepseek-stream-probe-response'
//   ({convId, active, turnFinished}) и принудительный сброс буфера
//   'ai-cm-deepseek-stream-flush' — ISOLATED-мир (core/export-manager.js) по ним
//   откладывает автоэкспорт на время стрима и флашит буфер для ручного экспорта.
//   Формат [REASONING]/[ANSWER], токены, парность ходов (O-15) и прочие сервисы не тронуты.
//
// v11 (O-17): полнота базы и turnsMap в чате, созданном через SPA (без F5).
//   СИМПТОМ (живой прогон, чат создан SPA-переходом, страница не перезагружалась):
//   EMIT идут с baseComplete=false (baseCount=2 → 4, pct=6%), автоэкспорт висит в
//   deferred до 60s-таймаута и пишет as-is с префиксом [LOW CONFIDENCE]_, ручной экспорт
//   отдаёт неполную базу. После F5 тот же чат даёт «история ПОЛНАЯ по сети» и полный файл.
//   ПРИЧИНА 1 (полнота): вердикт полноты выносился ТОЛЬКО по обходу цепочки
//   (buildActiveChain → reachedRoot) и требовал НЕПУСТОЙ цепочки, дошедшей до корня.
//   В ветке первичной загрузки страницы (ответ на запрос самой страницы) база непустая —
//   вердикт есть; в ветке «тихий дозапрос по таймеру» после SPA-смены чата
//   (scheduleHistoryRefetch → refetchFullHistory → ingestHistory) единственный ответ —
//   авторитетно ПУСТАЯ база нового чата (is_empty=true, chat_messages=[], current_message_id=null):
//   ранний `if (!chain.length) return;` оставлял histCompletion.historyComplete=false
//   НАВСЕГДА, realtime-эмиты наследовали false, гейт O-16 «defer до base-complete» не
//   разрешался, и файл уходил по аварийному пути. РЕШЕНИЕ: единый критерий полноты для
//   ОБЕИХ веток — DeepSeek отдаёт историю ОДНИМ ответом без курсора пагинации, поэтому
//   полнота ставится по САМОМУ ответу (скролл/лоадер/подтверждение начала не нужны):
//   цепочка дошла до корня ИЛИ база авторитетно пуста (0 ходов = вся история).
//   MERGE-ответ (пусто при is_empty!==true) полнотой НЕ признаётся — только дозапрос
//   без cache-параметров (тот же детектор v6, теперь и в ветке дозапроса).
//   ПРИЧИНА 2 (turnsMap/база): сброс turnsMap стоял ДО проверок снимка, поэтому
//   пустой/MERGE/усечённый ответ СТИРАЛ уже собранные live-ходы, а следующий realtime-финал
//   публиковал СХЛОПНУВШУЮСЯ базу (в живом логе: в записи истории msgs=1..2 при 4 ходах в
//   чате) — авто- и ручной экспорт получали обрезанный состав. РЕШЕНИЕ: turnsMap
//   сбрасывается ТОЛЬКО для снимка, принятого как авторитетный; пустой/чужой/MERGE-ответ
//   базу не трогает. Плюс: дозапрос больше не может уйти по URL ПРЕДЫДУЩЕГО чата
//   (lastHistoryUrl после SPA-перехода) — иначе в базу вливалась чужая история.
//   ДИАГНОСТИКА: DeepSeek теперь отвечает на мост ai-cm-turns-snap-request/response, поэтому
//   '[AI CM][turnsMap] snapshot-at-manual msgs=N' показывает РЕАЛЬНОЕ число ходов (раньше
//   snap=null → msgs=0 firstText="" — выглядело как пустой turnsMap).
//   Поведение O-15/O-16 сохранено: defer до base-complete остаётся, аварийный путь
//   deferred-timeout(60s)/as-is с [LOW CONFIDENCE]_ — только для реально неполной базы.
//
// v12 (O-18, фаза 2): ресинхронизация парсера фрагментов + сетевой дозапрос в момент экспорта.
//   ПЕРВОПРИЧИНА (измерено фазой 1, дамп прогона 19-12): строка-дельта пути response/fragments
//   классифицировалась по ФОРМЕ (`/^[A-Z][A-Z_]{2,}$/`), а не по белому списку. Любой
//   контент-чанк, целиком состоящий из заглавных латинских букв и '_' (длина ≥ 3), принимался
//   за ОБЪЯВЛЕНИЕ ТИПА нового фрагмента: «…|| DEFAULT_SU» | «BSCRIPT» | «ION» → тип «BSCRIPT»
//   (и «ION»), а весь дальнейший текст ответа уходил в мусорные фрагменты, которые
//   streamFragmentText('RESPONSE') не читает. Отсюда обрыв файла на «…DEFAULT_SU» при полном
//   ответе на странице (frags sse-finish: BSCRIPT/ION/OFF/REEN/UMENT/URL/DOM/ARS, live=5942
//   против полного ответа, verdicts ONE-SIDE×4 — сеть в тот прогон не опрашивалась вовсе).
//   РЕШЕНИЕ: (1) имя фрагмента принимается ТОЛЬКО из белого списка SSE_FRAGMENT_TYPES
//   (THINK/RESPONSE/… — типы протокола DeepSeek); (2) типоподобный токен вне белого списка —
//   признак ДЕСИНХРОНА: он (и всё, что уже ушло за последнюю валидную границу) возвращается
//   в контент последнего валидного фрагмента пересборкой из СЫРОГО кольца дельт
//   (sseResyncRing), а не заводится новый «тип»; (3) байты контента никогда не пишутся в
//   невалидный фрагмент (позиционное переиспользование исключено); (4) имена типов из
//   массивов response/fragments валидируются тем же белым списком — мусорных фрагментов в
//   буфере не остаётся вовсе. Кандидаты K4 («длиннее побеждает») и K7 (финал/flush) не тронуты:
//   дамп не показывает их вины.
//   СЕТЕВОЙ ДОЗАПРОС: перед композицией файла (авто и ручной экспорт) ISOLATED-мир спрашивает
//   MAIN по мосту ai-cm-deepseek-net-sync; если сетевого снимка нет или он старше последнего
//   завершённого хода — history_messages текущего convId запрашивается заново (таймаут 3 с),
//   per-turn выбирается текст (EQUAL → live, MIDDLE-HOLE/TAIL-CUT → сеть, ONE-SIDE → live +
//   маркер в логе), затем снимок публикуется обычным EMIT. Сеть недоступна/пуста — файл
//   собирается прежним live-путём. Латчи/пороги O-16, гейты полноты O-17 и формат
//   [REASONING]/[ANSWER] не тронуты.

// ===== v13 (2026-10-03): чистый резолвер slug модели по сетевым сигналам =====
// Определён ВНЕ IIFE: контрактный тест импортирует его через module.exports, не поднимая
// весь перехватчик (fetch/XHR-обёртки, состояние потока).
var AI_CM_DEEPSEEK_V4_FLASH_SLUG = 'deepseek-v4.1-flash';

/**
 * Сетевые сигналы модели DeepSeek (SSE ready/update_session, history chat_session, settings).
 * @typedef {Object} AiCmDeepSeekModelSignals
 * @property {string} [model]            значение поля model (в контракте 2026-10-03 — "")
 * @property {boolean} [modelPresent]    присутствовало ли поле model в payload
 * @property {string} [modelType]        model_type (default|expert|null)
 * @property {string} [conversationMode] conversation_mode (DEFAULT|...)
 * @property {string} [configName]       name активной конфигурации из /client/settings (Instant)
 * @property {boolean} [isDefault]       is_default активной конфигурации из /client/settings
 */
/**
 * Slug модели по сетевым сигналам. Приоритет:
 *   (a) живые сигналы unified Intelligent Mode → 'deepseek-v4.1-flash';
 *   (b) иначе непустой model (исторический chat_session.model) → он же;
 *   (c) пусто → '' — вызывающий применяет прежний фолбэк по thinking_enabled.
 * @param {AiCmDeepSeekModelSignals} [signals]
 * @returns {string}
 */
function __aiCmDeepseekResolveModelSlug(signals) {
  var s = signals || {};
  var raw = (typeof s.model === 'string') ? s.model.trim() : '';
  var modelType = String(s.modelType || '').toLowerCase();
  var convMode = String(s.conversationMode || '').toUpperCase();
  var configName = String(s.configName || '').toLowerCase();
  var isDefaultType = modelType === 'default';
  var isDefaultConv = convMode === 'DEFAULT';
  var emptyModelNewContract = (s.modelPresent === true) && raw === '' && isDefaultConv;
  // v94 (2026-10-23): у СТАРЫХ чатов conversation_mode в ответе НЕТ вовсе ('' после нормализации); пустой режим при model_type:"default" трактуем как DEFAULT — "default" в контракте DeepSeek единственная unified-запись (1M), а не фолбэк deepseek-v3 (128K). Контракт сети 2026-10-11: name локализуется (Instant / Быстрый / Fast); матч по структурному is_default + model_type, а не по локализованному имени.
  var isUnifiedDefault = isDefaultType && (isDefaultConv || convMode === '');
  if (isUnifiedDefault || emptyModelNewContract || (isDefaultType && (s.isDefault === true || configName !== ''))) {
    return AI_CM_DEEPSEEK_V4_FLASH_SLUG;   // (b)
  }
  // historical slug: chat_session.model, не текущая модель — фолбэк в самом конце
  if (raw) { if (typeof window !== 'undefined' && window.AiCmDeepseekDiag && window.AiCmDeepseekDiag.diagMark) window.AiCmDeepseekDiag.diagMark('model-slug-historical', { model: raw }); return raw; }   // (c)
  return '';   // (d)
}

if (typeof window !== 'undefined') {
  try { window.__aiCmDeepseekResolveModelSlug = __aiCmDeepseekResolveModelSlug; } catch (eWin) { /* ignore */ }
}

(function () {
  if (window.__aiCmDeepseekInterceptInstalled) return;
  window.__aiCmDeepseekInterceptInstalled = true;

  // v31: флаг «Подробные логи» транслируется из content.js (ISOLATED) через CustomEvent
  try { window.addEventListener('ai-cm-debug-logs', function (ev) { __aiCmSetDebugLogs(!!(ev && ev.detail)); }); } catch (e) { /* ignore */ }

  var originalFetch = window.fetch;
  var OriginalXHR = window.XMLHttpRequest;
  var originalXHROpen = OriginalXHR ? OriginalXHR.prototype.open : null;
  var originalXHRSend = OriginalXHR ? OriginalXHR.prototype.send : null;

  // ===== СЕКЦИЯ 1: КОНСТАНТЫ =====
  // v8 (O-7): reasoning-фрагменты THINK разбираются отдельно от ответа.
  //   REASONING_ENABLED=false возвращает поведение v7 (THINK не попадает в текст).
  var REASONING_ENABLED = true;
  // REASONING_TAG/ANSWER_TAG переехали в core/deepseek-parse.js (Step D.4): их читает
  // только composeTurnText, тело которого живёт в модуле.
  var MODEL_WINDOW_DEFAULT = 131072;  // совпадает с model-config deepseek-v3/r1

  // ===== СЕКЦИЯ 2: НАКОПИТЕЛИ =====
  var turnsMap = {};          // ключ = String(message_id)
  var orderCounter = 0;
  var attachTokens = 0;
  var attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
  var loggedOk = false;
  var loggedHistory = false;
  var loggedRealtime = false;

  // ===== Step D.5: K1 (CONV ID + ДЕТЕКТОР СМЕНЫ ЧАТА) вынесен в core/deepseek-conv.js =====
  // Здесь были getConvId (парсер convId из location.pathname), resetForNewConversation
  // (полный сброс состояния на смену разговора), checkConvChange и патчи
  // history.pushState / history.replaceState / window.popstate, которые взводят детектор.
  // Тела живут в модуле (PURE-зона и BIND-зона внутри `with (D)` — см. шапку
  // core/deepseek-conv.js) и обращаются к состоянию ядра через контракт __bind; связка —
  // в конце этого IIFE, форвардеры (getConvId, resetForNewConversation) хойстятся.
  // Модуль подключён в core/background.js строго перед этим файлом (js[] одного
  // registration, id -v7) и ИСПОЛНЯЕТСЯ раньше ядра: патчи pushState/replaceState ставятся
  // на загрузке модуля — иначе первый SPA-переход страницы не сбросил бы состояние.
  // Объявления ниже и O-22-слушатель ОСТАЛИСЬ ЗДЕСЬ: их читают/пишут оставшиеся секции
  // (fetch-хук K11, XHR-копилка K9, приём снимка K5, emit-гард O-22) — вынос означал бы
  // правку K3-K11. currentConvId тоже остался: его читают те же секции и контракты D.1/D.2,
  // а модуль получает переменную rw-парой и видит ТУ ЖЕ переменную (иначе перезапись при
  // смене чата молча терялась бы в sloppy-режиме).
  var aiCmDeepseekConv = (typeof window !== 'undefined' && window.AiCmDeepseekConv) || null;
  // РАННЯЯ связка модуля (пустые зависимости). Почему она нужна: Fn.getConvId/Fn.checkConvChange
  // появляются на объекте модуля ТОЛЬКО в __bind, а строка ниже ЧИТАЕТ НАЧАЛЬНЫЙ convId
  // НА ЗАГРУЗКЕ ядра — без ранней связки это был бы TypeError. Ранней связки достаточно ровно
  // потому, что getConvId не читает НИ ОДНОГО имени из D (смотрит в location), а
  // checkConvChange зовётся позже, уже после ПОЛНОЙ связки в конце этого IIFE (там же, где
  // связки D.1-D.4: к её моменту все переменные ядра объявлены). Тело resetForNewConversation
  // (оно читает состояние) дополнительно защищено guard-строкой полноты связки в модуле.
  if (aiCmDeepseekConv) aiCmDeepseekConv.__bind({});
  // Начальный convId: читаем модуль напрямую, а не через форвардер — Fn.getConvId пуст до связки.
  var currentConvId = aiCmDeepseekConv ? aiCmDeepseekConv.getConvId() : '';
  // O-22 (ФИКС F4): сигнатура последнего РЕАЛЬНО опубликованного снимка и его возвращаемое
  // значение (для раннего возврата вызывающим). null — гард пуст, первый диспатч не глушится.
  // ВАЖНО (Step D.5): lastBaseServerTokens/lastBaseChatMode/lastDispatchSig/lastDispatchResult
  // жили в СЕКЦИИ 3 среди объявлений вынесенного кластера. Объявления перенесены СЮДА, в ядро:
  // их читают emit-гард O-22 (последние два — ещё и слушатель смены разговора ниже) и
  // emitBaseSnapshot (с D.6 живёт в core/deepseek-emit.js, читает их rw-парой). Если
  // оставить их в модуле, ядро читало бы НЕЯВНЫЕ глобалы —
  // в браузере (window) это работало бы, но в стендах с изолированным vm/jsdom-скоупом дало бы
  // ReferenceError (поймано сьютом D.5 на lastDispatchSig).
  var lastAuthHeaders = {};
  var lastLoadedConvId = '';
  // historyRefetchTimer (таймер дозапроса) переехал в core/deepseek-refetch.js (Step D.3)
  var lastHistoryUrl = '';          // v6: URL последнего history-запроса для дозапроса при усечении
  var historyRefetchDone = false;   // v6: флаг «один дозапрос за загрузку чата»
  // v7: честная полнота базы — проставляется из reachedRoot после ingest (realtime-эмит
  // наследует последнее подтверждённое состояние). Сброс — при смене чата.
  // v11 (O-17): baseEmpty — база авторитетно пуста (новый чат создан через SPA): 0 ходов
  // тоже ПОЛНАЯ история; такие снимки не публикуются (content.js игнорирует пустой text),
  // но вердикт полноты наследуется следующим непустым эмитом.
  var histCompletion = { historyComplete: false, reachedRoot: false, baseEmpty: false };
  // v11 (O-17): параметры последнего эмита — нужны для ре-эмита базы в момент, когда
  // вердикт полноты меняется 0→1 без изменения текста (пустой ответ дозапроса поверх
  // уже собранных live-ходов): content.js узнаёт о полноте только из непустого EMIT.
  var lastBaseServerTokens = 0;
  var lastBaseChatMode = '';
  // O-22 (ФИКС F4): сигнатура последнего РЕАЛЬНО опубликованного снимка и его возвращаемое
  // значение (для раннего возврата вызывающим). null — гард пуст, первый диспатч не глушится.
  var lastDispatchSig = null;
  var lastDispatchResult = null; var publishBaseSnapshot = emitBaseSnapshot;   // E3: алиас единой точки публикации (статический счётчик литерала o22 не растёт).
  function __aiCmDeepseekReemitAfterSettings() { var ids = Object.keys(turnsMap); if (!ids.length) return; var signals = sseModelSignals(); if (sseConfigIsDefault === true && sseConfigEnabled === true) { signals.modelType = sseConfigModelType; signals.isDefault = sseConfigIsDefault; } if (!signals.modelType) signals.modelType = lastBaseChatMode || sseModelType || null; for (var i = 0; i < ids.length; i++) { var t = turnsMap[ids[i]]; if (t && t.role === 'assistant') t.modelSlug = getModelSlug(t.modelSlug === 'deepseek-r1', signals); } lastDispatchSig = null; publishBaseSnapshot(lastBaseServerTokens, lastBaseChatMode); }   // E3 (2026-10-11): первый захват активной конфигурации (D.9) → пересчёт slug ходов и ре-эмит снимка (model_type берём из последнего эмита: в момент захвата настроек SSE-потока ещё нет)
  // O-22 (ФИКС F4): сброс последней сигнатуры на событии смены разговора. Событие диспатчит
  // resetForNewConversation (выше) и ISOLATED-сторона при SPA-переходе: первый диспатч новой
  // базы не глушится, даже если convId в URL не изменился.
  try {
    window.addEventListener('ai-cm-conversation-changed', function () { lastDispatchSig = null; });
  } catch (eO22rs) { /* ignore */ }
  // E3 (2026-10-11): модуль D.9 сообщил о ПЕРВОМ захвате активной конфигурации (пусто → значение) — ядро пересчитывает slug ходов и публикует снимок заново.
  window.addEventListener('ai-cm-deepseek-settings-captured', __aiCmDeepseekReemitAfterSettings);
  // ===== Step D.6: K2 (EMIT) вынесен в core/deepseek-emit.js =====
  // Здесь были СЕКЦИЯ 4 целиком: buildDispatchSignature (payload-точная сигнатура
  // снимка, O-22/ФИКС F4), emitBaseSnapshot (единая точка публикации события
  // ai-cm-full-history + гард повторного диспатча; 3 сайта вызова остались в ядре —
  // приём снимка истории и два realtime-финала, плюс ре-эмит полноты 0→1),
  // clipTurnText и turnsSnapshot (сводка turnsMap для дампов экспорта, v11/O-17)
  // и мост ai-cm-turns-snap-request → ai-cm-turns-snap-response.
  // Тела живут в модуле (PURE-зона и BIND-зона внутри `with (D)` — см. шапку
  // core/deepseek-emit.js) и обращаются к состоянию ядра через контракт __bind:
  // 7 fn + 4 rw + 5 ro = 16 имён; связка — в конце этого IIFE, форвардер
  // emitBaseSnapshot (function declaration — хойстится) в блоке связки D.6.
  // Объявления lastBaseServerTokens/lastBaseChatMode/lastDispatchSig/lastDispatchResult
  // (строки 292-297 выше) и O-22-слушатель (299-304) ОСТАЛИСЬ: их читают ре-эмит
  // полноты 0→1 в ingestHistory и слушатель смены разговора; turnsMap/attachTokens/
  // attachBreak/histCompletion/currentConvId ведут K5/K6/K9/K11 — модуль получает их
  // ro-геттерами. Модуль подключён в core/background.js строго перед этим файлом
  // (js[] одного registration, id -v8): к связке в конце этого IIFE
  // window.AiCmDeepseekEmit уже есть.

  // ===== Step D.4: K3+K4 (MODEL-хелпер, цепочка, текст хода) вынесены в core/deepseek-parse.js =====
  // Здесь были СЕКЦИЯ 5 (getModelSlug — slug модели хода: сетевые сигналы K0, затем
  // фолбэк по thinking_enabled), СЕКЦИЯ 6 (buildActiveChain — walk по parent_id, ловушка
  // №1), СЕКЦИЯ 7 (collectTurnText/collectTurnReasoning/composeTurnText — сборка текста
  // хода по type фрагментов) и hidden-пометки базы (DS_PP_VISIBLE_MARKER +
  // hasInjectedUserPrompt, v13/O-7). Тела живут в модуле (PURE-зона и BIND-зона внутри
  // `with (D)` — см. шапку core/deepseek-parse.js) и читают ядро через контракт __bind;
  // связка — в конце этого IIFE. Модуль подключён в core/background.js строго перед этим
  // файлом (js[] одного registration, id -v6): на момент связки window.AiCmDeepseekParse
  // уже есть. Константы REASONING_TAG/ANSWER_TAG уехали вместе с composeTurnText (СЕКЦИЯ 1
  // выше), REASONING_ENABLED ОСТАЛСЯ: его читают K5/K7 и контракт диагностики D.1.
  // Форвардеры ядра (хойстятся, вызовы выше по файлу не тронуты) — в конце этого IIFE.

  // ===== Step D.8: K5 (INGEST) вынесен в core/deepseek-ingest.js =====
  // Здесь были СЕКЦИЯ 8 целиком: ingestHistory — приёмка авторитетного сетевого снимка
  // history_messages (v6-детектор усечения цепочки с однократным тихим дозапросом,
  // v11/O-17 авторитетно пустая база и MERGE-ветка пустого кеша, v12/O-18 режим
  // экспортного дозапроса, сборка turnsMap по ходам, снимок сети и вердикт полноты) —
  // 275 строк (340-614). Тело живёт в модуле (PURE-зона заголовка и BIND-зона внутри
  // `with (D)` — см. шапку core/deepseek-ingest.js) и читает состояние ядра через
  // контракт __bind: 17 fn + 10 rw + 8 ro = 35 имён; связка — в конце этого IIFE,
  // форвардер ingestHistory (function declaration — хойстится) раздаёт тело по прежнему
  // имени. Прямых вызовов K5 в ядре не осталось вовсе: значением форвардера пользуются
  // контракты D.2 (приёмка экспортного снимка), D.3 (приёмка ответа тихого дозапроса
  // в refetchFullHistory) и D.7 (копилка XHR: история → ingest). Объявления
  // ingestMode/exportSyncTruncated — НИЖЕ: их ставит и снимает applyExportNetSnapshot
  // модуля D.2, а читает тело K5 (rw-пары D.2/D.8); при выносе var в модуль ядро
  // читало бы НЕЯВНЫЕ ГЛОБАЛЫ (урок D.5 на lastDispatchSig).
  var ingestMode = '';
  var exportSyncTruncated = false;   // v12 (O-18): снимок экспортного дозапроса оказался усечён

  // ===== Step D.9: K6 (SSE) вынесен в core/deepseek-sse.js =====
  // Здесь была СЕКЦИЯ 9 целиком (ДВЕ области: 358-1046 и 1066-1136 HEAD 6e65e73;
  // parseSSE/consumeSseResponse стояли НИЖЕ надгробия D.2 — их сдвинула вставка состояния
  // netsync, 1048-1064): сигналы модели v13, снимок/диспатч состояния живого потока O-16,
  // beginSseStream/endSseStream/resetStreamState, белый список типов и ресинк парсера из
  // сырого кольца v12/O-18, processChunk/processChunkCore, parseSSELines (постфактум и
  // инкрементально), finishSseStream, parseSSE/consumeSseResponse и мост
  // ai-cm-deepseek-stream-probe/-flush — 760 строк.
  // Тела живут в модуле (PURE-зона заголовка/module-owned состояния и BIND-зона внутри
  // `with (D)` — см. шапку core/deepseek-sse.js) и читают состояние ядра через контракт
  // __bind: 6 fn + 18 rw + 2 ro = 26 имён; связка — в конце этого IIFE, форвардеры (9 штук,
  // function declaration — хойстятся) раздают тела по прежним именам.
  // Объявления 19 var состояния ОСТАЛИСЬ в ядре (ниже, а также SSE_FRAGMENT_TYPES/
  // sseResyncRing/sseResyncCount/sseResyncBytes/sseUnknownCount/sseUnknownChars в блоке v12):
  // их читают K7 и контракты D.1/D.2/D.7/D.8 живыми аксессорами D.9 — вынос var заставил бы
  // ядро читать НЕЯВНЫЕ ГЛОБАЛЫ (урок D.5 на lastDispatchSig). sseConfigName тоже осталась:
  // её читает ro-геттер ingest-связки D.8. Одиннадцать module-owned объявлений (sseLastPath/
  // sseLastOp/sseModel/sseModelPresent/sseConversationMode/sseCurrentEvent/SSE_RESYNC_MAX_*/
  // sseResyncChars/sseUnknownParts) уехали вместе с телами — внешних ссылок у них нет.
  // finalizeRealtimeTurn (K7: turnsMap/orderCounter/emitBaseSnapshot, сайт O-22 S1172)
  // остался ЗДЕСЬ и получает тела модуля форвардерами. Модуль подключён в core/background.js
  // строго перед этим файлом (js[] одного registration, id -v11): на момент связки
  // window.AiCmDeepseekSse уже есть.
  var sseRealtimeEntryTokens = 0;
  var sseRealtimeFinalTokens = 0;
  var sseRequestMessageId = null;
  var sseResponseMessageId = null;
  var sseModelType = null;
  var sseConfigName = null; var sseConfigModelType = null; var sseConfigIsDefault = null; var sseConfigEnabled = null;   // F5: активная настройка (/client/settings) для приоритета над историей
  var sseUserPrompt = '';
  var sseParentMessageId = null;
  var sseThinkingEnabled = null;
  // v9 (O-15): фрагменты потока — ОДИН массив в порядке прихода: { type, content }.
  // Это ровно та же форма, что fragments[] в history_messages, поэтому live-текст хода
  // собирается ТЕМИ ЖЕ правилами, что и экспорт из истории: RESPONSE → ответ,
  // THINK → reasoning (секции [REASONING]/[ANSWER]), прочие типы (TIP/SEARCH/…) в текст
  // хода не идут — как и в collectTurnText/collectTurnReasoning.
  // v8 держал только sseFragmentTypes (типы) и выбрасывал content чанков
  // {p:"response/fragments", o:"APPEND", v:[{type,content}]} — отсюда потеря начала
  // каждого нового фрагмента (2 символа и «точка-паразит» в начале [ANSWER]).
  var sseFragments = [];
  var sseFragmentTypes = [];   // производная (диагностика порядка типов)
  // v10 (O-16): состояние ЖИВОГО потока. active=true от старта чтения тела ответа
  // completion до его конца; turnFinished=true, если терминальный чанк уже пришёл
  // (ход зафиксирован), но тело ответа ещё может досылать фрагменты.
  var sseStreamActive = false;
  var sseTurnFinished = false;
  // ===== v12 (O-18, фаза 2): БЕЛЫЙ СПИСОК ТИПОВ + РЕСИНХРОН ПАРСЕРА ФРАГМЕНТОВ =====
  // Имя типа фрагмента — это ВСЕГДА одно из имён протокола DeepSeek. Любая другая строка
  // (в т.ч. типоподобная «BSCRIPT»/«ION»/«URL»/«DOM» — куски текста ответа) типом НЕ является.
  // Набор собран по самому протоколу: fragments[].type в history_messages (REQUEST/RESPONSE/
  // THINK/TIP/SEARCH — см. collectTurnText/collectTurnReasoning) и в SSE-потоке completion
  // (BEGIN/… не встречаются, но TEMPLATE_RESPONSE упоминается в комментариях v8).
  var SSE_FRAGMENT_TYPES = {
    THINK: 1, RESPONSE: 1, REQUEST: 1, TIP: 1, SEARCH: 1, TEMPLATE_RESPONSE: 1, FILE: 1
  };
  var sseResyncRing = [];
  var sseResyncCount = 0;
  var sseResyncBytes = 0;
  var sseUnknownCount = 0;   // отказов «имя типа вне белого списка» (строка или элемент массива)
  var sseUnknownChars = 0;

  function finalizeRealtimeTurn() {
    if (!sseRequestMessageId || !sseResponseMessageId) return;

    // v9 (O-15): ответ и reasoning — из ОДНОГО массива фрагментов потока, теми же
    // правилами, что и history_messages.
    var answerText = streamFragmentText('RESPONSE');
    if (!answerText) answerText = streamOtherText();   // аварийный фолбэк (незнакомый тип)
    var sseReasoning = REASONING_ENABLED ? streamFragmentText('THINK') : '';

    // O-18 (ИЗМЕРЕНИЕ): per-turn LIVE-текст (ровно тот, что уйдёт в ход) + ревизия.
    if (diagOn()) {
      if (sseRequestMessageId && sseUserPrompt) {
        diagLiveTurnRecord(String(sseRequestMessageId), 'user', sseUserPrompt, 'finalize');
      }
      diagLiveTurnRecord(String(sseResponseMessageId), 'assistant', composeTurnText(answerText, sseReasoning), 'finalize');
    }

    // v12 (O-18, фаза 2): LIVE-текст хода — в собственный кэш. Нужен потому, что приёмка
    // сетевого снимка ПЕРЕСТРАИВАЕТ turnsMap: без кэша ход, которого в сети нет (или её
    // текст хуже), было бы нечем восстановить при экспортном дозапросе.
    var liveText = composeTurnText(answerText, sseReasoning);
    liveTurnRecord(String(sseRequestMessageId), 'user', sseUserPrompt, sseUserPrompt, '', '');
    if (answerText || sseReasoning) {
      liveTurnRecord(String(sseResponseMessageId), 'assistant', liveText, answerText, sseReasoning,
        getModelSlug(sseThinkingEnabled === true, sseModelSignals()));
    }
    lastTurnDoneAt = Date.now();

    // УСЛОВИЕ 2: добавляем ОБА хода — USER и ASSISTANT
    // USER-ход
    var userId = String(sseRequestMessageId);
    if (!turnsMap[userId] && sseUserPrompt) {
      turnsMap[userId] = {
        text: sseUserPrompt,
        answer: sseUserPrompt,
        reasoning: '',
        modelSlug: '',
        order: orderCounter++,
        ts: Date.now() / 1000,
        role: 'user'
      };
    }

    // ASSISTANT-ход: модель по thinking_enabled (sseModelType не влияет на выбор).
    // v9 (O-15): ход создаётся при непустом ответе ИЛИ reasoning — v8 требовал ответ и
    // терял ход целиком, когда ответ приходил внутри чанка fragments[] («ответы 1–2
    // отсутствуют» в live-экспорте).
    var assistantId = String(sseResponseMessageId);
    if (!turnsMap[assistantId] && (answerText || sseReasoning)) {
      turnsMap[assistantId] = {
        text: composeTurnText(answerText, sseReasoning),
        answer: answerText,
        reasoning: sseReasoning,
        modelSlug: getModelSlug(sseThinkingEnabled === true, sseModelSignals()),
        order: orderCounter++,
        ts: Date.now() / 1000,
        role: 'assistant'
      };
    } else if (turnsMap[assistantId]) {
      // v10 (O-16): ход уже создан РАННИМ (промежуточным) финалом того же потока —
      // обогащаем его более полным текстом. Прежний гард `!turnsMap[assistantId]`
      // отбрасывал финальный (полный) текст, и усечённый ход оставался в memory-базе
      // навсегда — именно это и писал автоэкспорт. Merge безопасен: укорачивание
      // уже собранного невозможно (streamSetContent/streamAppendContent не укорачивают),
      // поэтому сравнение по длине монотонно.
      var ex = turnsMap[assistantId];
      var exAnswer = ex.answer || '';
      var exReasoning = ex.reasoning || '';
      var nextAnswer = (answerText && answerText.length >= exAnswer.length) ? answerText : exAnswer;
      var nextReasoning = (sseReasoning && sseReasoning.length >= exReasoning.length) ? sseReasoning : exReasoning;
      if (nextAnswer !== exAnswer || nextReasoning !== exReasoning) {
        // O-18 (ИЗМЕРЕНИЕ): «длиннее побеждает» — фиксируем факт замены текста хода,
        // её вердикт и шов (кандидат: более длинный, но ДЫРЯВЫЙ текст вытесняет полный).
        if (diagOn()) {
          var dEnr = diagVerdict(exAnswer, nextAnswer);
          diagMark('enrich-replace', {
            id: String(assistantId).slice(0, 8), prevLen: exAnswer.length, nextLen: nextAnswer.length,
            prevHash: diagHash6(exAnswer), nextHash: diagHash6(nextAnswer),
            firstDiff: dEnr.firstDiff, verdict: dEnr.verdict, lost: dEnr.lost, resync: dEnr.resync
          });
        }
        ex.answer = nextAnswer;
        ex.reasoning = nextReasoning;
        ex.text = composeTurnText(nextAnswer, nextReasoning);
      }
    }

    // Числитель = финальный accumulated_token_usage из BATCH (фолбэк — entry из первого response)
    var serverTokens = sseRealtimeFinalTokens || sseRealtimeEntryTokens || 0;

    // chatMode для realtime = sseModelType (expert/default/null)
    var chatMode = sseModelType || '';

    // O-22 (ИЗМЕРЕНИЕ-2): маркер ТОЧКИ диспатча ai-cm-full-history (site=S1172).
    try {
      if (typeof diagMark === 'function' && typeof diagOn === 'function' && diagOn()) {
        diagMark('o22-dispatch-site', {
          site: 'S1172', ts: Date.now(),
          count: Object.keys(turnsMap).length, textLen: '(вне области)'
        });
      }
    } catch (eO22s1172) { /* ignore */ }
    var em = emitBaseSnapshot(serverTokens, chatMode);
    if (!loggedRealtime) {
      loggedRealtime = true;
      console.log('[deepseek-intercept] ✓ realtime обновление: ходов=' + em.count +
        ', serverTokens=' + serverTokens +
        (serverTokens > 0 ? ' (' + Math.round(serverTokens / MODEL_WINDOW_DEFAULT * 1000) / 10 + '%)' : '') +
        ', модель=' + (em.lastModel || '?') +
        ', modelMode=' + (chatMode || '(default)') +
        ', reasoning-ходов=' + em.reasoningTurns);   // v8 (O-7)

      // ДИАГНОСТИЧЕСКИЙ ДАМП — только при включённом флаге aiCmDebug
      if (isDebugEnabled()) {
        dumpHistorySnapshot('after_reply', 'realtime turn finalized', {
          capturePoint: 'finalizeRealtimeTurn',
          navType: '',
          sseEntry: sseRealtimeEntryTokens,
          sseFinal: sseRealtimeFinalTokens,
          modelType: sseModelType
        });
      }
    }

    // v10 (O-16): повторный финал того же потока — норма (терминальный чанк может прийти
    // до конца тела ответа, а конец тела — ещё раз закрыть ход). Буфер НЕ обнуляем:
    // досланные фрагменты обязаны долиться в тот же ход. Полный сброс — beginSseStream()
    // (старт нового потока) и resetForNewConversation() (смена чата).
    sseTurnFinished = true;
    dispatchStreamState('finalize');
  }

  // ===== Step D.2: сетевой дозапрос истории вынесен в core/deepseek-netsync.js =====
  // Здесь была СЕКЦИЯ 9C (O-18, фаза 2): liveTurnRecord, netSyncNeeded, exportComposeTurns,
  // applyExportNetSnapshot, exportNetSync и мост window 'ai-cm-deepseek-net-sync'. Тела
  // живут в модуле (BIND-зона внутри `with (D)`, см. шапку core/deepseek-netsync.js) и
  // обращаются к состоянию ядра через контракт __bind; связка — в конце этого IIFE.
  // Модуль подключён в core/background.js строго перед этим файлом (js[] одного
  // registration, id -v4): на момент связки window.AiCmDeepseekNetsync уже есть.
  // Состояние дозапроса ОСТАЛОСЬ ЗДЕСЬ: его читают и пишут оставшиеся секции
  // (resetForNewConversation — сброс на смену чата, ingestHistory — приёмка сетевого
  // снимка, finishSseStream — lastTurnDoneAt), а модуль получает ТЕ ЖЕ переменные
  // rw-парами контракта, поэтому объекты общие, а не копии.
  var liveTurns = {};          // v12: LIVE-текст ходов (SSE) — переживает приёмку сети
  var liveTurnOrder = [];
  var netSnapshotAt = 0;       // время приёмки авторитетного сетевого снимка
  var netTurnIds = {};         // какие ходы пришли ИЗ СЕТИ (последний принятый снимок)
  var lastTurnDoneAt = 0;      // время последнего завершённого хода (финализация потока)
  var netSyncStats = { calls: 0, fetched: 0, ok: 0, fresh: 0, empty: 0, failed: 0, timeout: 0, oneSide: 0 };

  // ===== Step D.3: K8 (REFETCH/URL-гигиена) вынесен в core/deepseek-refetch.js =====
  // Здесь были СЕКЦИЯ 10 (гард перекрёста chat_session_id vs currentConvId:
  // convIdFromHistoryUrl, convIdFromCompletionBody, guardCheck) и СЕКЦИЯ 10B (хелперы
  // MERGE-дозапроса: collectHeaders, stripCacheParams, historyRefetchUrl,
  // historyUrlForConv, refetchFullHistory, scheduleHistoryRefetch). Тела живут в модуле
  // (PURE-зона и BIND-зона внутри `with (D)` — см. шапку core/deepseek-refetch.js) и
  // обращаются к состоянию ядра через контракт __bind; связка — в конце этого IIFE.
  // Модуль подключён в core/background.js строго перед этим файлом (js[] одного
  // registration, id -v5): на момент связки window.AiCmDeepseekRefetch уже есть.
  // Состояние refetch-гигиены ОСТАЛОСЬ ЗДЕСЬ: lastAuthHeaders/lastHistoryUrl пишут
  // fetch-хук (K11) и XHR-копилка (K9), historyRefetchDone — детекторы усечения (K5),
  // lastLoadedConvId — приём снимка истории; модуль получает эти переменные rw/ro-парами
  // контракта и видит ТЕ ЖЕ переменные, а не копии. historyRefetchTimer переехал в модуль.
  // Форвардеры ядра (хойстятся, вызовы выше по файлу не тронуты) — в конце этого IIFE.

  // ===== Step D.7: K9 (NETWORK) вынесен в core/deepseek-net.js =====
  // Здесь были СЕКЦИЯ 11 (перехват fetch: v5-тихий catch, копилка auth-заголовков,
  // история + MERGE-дозапрос, разбор тела completion, настройки модели) и СЕКЦИЯ 12
  // (перехват XHR: зеркало fetch + setRequestHeader-копилка) — 218 строк.
  // Тела живут в модуле (PURE-зона и BIND-зона внутри `with (D)` — см. шапку
  // core/deepseek-net.js) и обращаются к состоянию ядра через контракт __bind:
  // 11 fn + 6 rw + 5 ro = 22 имени; связка — в конце этого IIFE. Форвардеров нет:
  // модуль не отдаёт ядру ни одного тела — он публикует себя САЙТУ (window.fetch и
  // OriginalXHR.prototype.open/send/setRequestHeader), а ядро лишь снабжает его
  // зависимостями. Объявления originalFetch/OriginalXHR/originalXHROpen/
  // originalXHRSend (строки 222-225) и состояние копилок (lastAuthHeaders/
  // lastHistoryUrl/lastLoadedConvId/sseUserPrompt/sseParentMessageId/
  // sseThinkingEnabled) ОСТАЛИСЬ: их читают K6/K8 и контракты D.2/D.3. Модуль
  // подключён в core/background.js строго перед этим файлом (js[] одного
  // registration, id -v9), а связка стоит ПОСЛЕ захвата originalFetch — иначе
  // обёртка fetch замкнулась бы сама на себя.


  // ===== СЕКЦИЯ 14: ФИНАЛ =====
  console.log('[deepseek-intercept] перехватчик DeepSeek v12 установлен (server-first, walk parent_id, SSE инкрементально И постфактум, USER+ASSISTANT оба хода, ход = user + assistant(reasoning+answer), фрагменты потока как fragments[] истории (без потери контента чанков), терминал хода по BATCH/close/концу тела, historyComplete по reachedRoot ИЛИ авторитетно пустой базе (O-17: единый критерий для первичной загрузки и тихого дозапроса после SPA-смены чата), turnsMap сбрасывается только принятым снимком (O-17), serverTokens из accumulated_token_usage, +self-fetch при MERGE, +per-turn model по thinking_enabled, +modelMode в detail, +timer-refetch on switch, +подавление чужих unhandled fetch, +детектор усечения цепочки с дозапросом, +convId в detail, +unknown-роль без маппинга, +reasoning THINK секциями [REASONING]/[ANSWER], +O-16 живой поток не замораживает ход: повторный финал обогащает текст, probe/flush-мост для экспортёра, +O-17 мост turnsMap для дампов экспорта, +O-18 белый список типов фрагментов с ресинком из сырого кольца (контент больше не становится «типом»), +O-18 сетевой дозапрос history_messages в момент экспорта с per-turn выбором live/сеть)');

  // Экспорт для ручного вызова диагностического дампа
  try {
    if (!window.__aiCmDebug) window.__aiCmDebug = {};
    window.__aiCmDebug.dumpDeepSeekHistory = function (state) {
      if (!isDebugEnabled()) return;
      if (!state) {
        var ds = determineState();
        state = ds.state;
        var reason = 'manual:' + state + ' (nav=' + (ds.navType || 'unknown') + ', convId=' + (currentConvId || '').slice(0, 8) + ')';
      } else {
        reason = 'manual:' + state;
      }
      dumpHistorySnapshot(state, reason, {
        capturePoint: 'manual_call',
        navType: getNavigationType()
      });
    };
  } catch (e) { /* ignore */ } var __aiCmIngestCtx = false; var __aiCmIngestHistoryFwd = ingestHistory; ingestHistory = function (jsonBody) { var __aiCmIngestPrev = __aiCmIngestCtx; __aiCmIngestCtx = true; try { return __aiCmIngestHistoryFwd(jsonBody); } finally { __aiCmIngestCtx = __aiCmIngestPrev; } }; if (typeof window !== 'undefined') window.addEventListener('ai-cm-deepseek-model-settings', function (ev) { var d = ev && ev.detail; if (d && d.isDefault === true && d.enabled === true) { sseConfigModelType = d.modelType; sseConfigIsDefault = true; sseConfigEnabled = true; } else { sseConfigModelType = null; sseConfigIsDefault = null; sseConfigEnabled = null; } }); // eslint-disable-line no-func-assign
  // ===== Step D.1: кластер диагностики вынесен в core/deepseek-diag.js =====
  // Здесь были СЕКЦИИ 13/13D/13B: диагностический дамп снапшота (isDebugEnabled /
  // getNavigationType / determineState / dumpHistorySnapshot с маркерами o22-dispatch),
  // вербатим-дамп usage по ходам при загрузке истории (O-26) и измерение live vs network
  // с кольцами сырья (O-18: diagSseRing/diagHistRing/diagMarks/diagLiveTurns/diagNetTurns).
  // Тела живут в модуле (PURE-зона и with (D)-зона — см. шапку core/deepseek-diag.js).
  // Модуль подключён в core/background.js ПЕРЕД этим файлом (js[] одного registration,
  // id -v3), на момент связки window.AiCmDeepseekDiag уже есть; no-op заглушек здесь нет
  // намеренно — registration атомарный, а песочницы тестов получают конкатенацию через
  // tests/helpers/deepseek-intercept-source.js.
  var lastDiagConvId = currentConvId;   // O-18: кольца живут в пределах одного convId
  var aiCmDeepseekDiag = (typeof window !== 'undefined' && window.AiCmDeepseekDiag) || null;
  if (aiCmDeepseekDiag) {
    aiCmDeepseekDiag.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      collectTurnText: collectTurnText,
      collectTurnReasoning: collectTurnReasoning,
      netSyncNeeded: netSyncNeeded,
      streamKnownType: streamKnownType,
      // rw: живое состояние, которое модуль ПЕРЕЗАПИСЫВАЕТ (get + set).
      // sseFragments/sseFragmentTypes — seed-мост O-18 (seedDeepSeekFragmentsO18) подменяет
      // буфер фрагментов: ядро обязано видеть ТОТ ЖЕ буфер, а не копию.
      get sseFragments() { return sseFragments; },
      set sseFragments(v) { sseFragments = v; },
      get sseFragmentTypes() { return sseFragmentTypes; },
      set sseFragmentTypes(v) { sseFragmentTypes = v; },
      // lastDiagConvId — переменная ЯДРА: resetForNewConversation читает её как prevConv и
      // перезаписывает текущим convId после сброса колец модуля.
      get lastDiagConvId() { return lastDiagConvId; },
      set lastDiagConvId(v) { lastDiagConvId = v; },
      // ro: только чтение — модуль эти имена не перезаписывает (мутации объектов по
      // ссылке — turnsMap, histCompletion, netSyncStats — видны ядру и без сеттера).
      get turnsMap() { return turnsMap; },
      get currentConvId() { return currentConvId; },
      get histCompletion() { return histCompletion; },
      get historyRefetchDone() { return historyRefetchDone; },
      get lastHistoryUrl() { return lastHistoryUrl; },
      get loggedHistory() { return loggedHistory; },
      get loggedRealtime() { return loggedRealtime; },
      get REASONING_ENABLED() { return REASONING_ENABLED; },
      get liveTurnOrder() { return liveTurnOrder; },
      get netTurnIds() { return netTurnIds; },
      get netSnapshotAt() { return netSnapshotAt; },
      get lastTurnDoneAt() { return lastTurnDoneAt; },
      get netSyncStats() { return netSyncStats; },
      get sseStreamActive() { return sseStreamActive; },
      get sseTurnFinished() { return sseTurnFinished; },
      get sseRequestMessageId() { return sseRequestMessageId; },
      get sseResponseMessageId() { return sseResponseMessageId; },
      get sseResyncRing() { return sseResyncRing; },
      get sseResyncCount() { return sseResyncCount; },
      get sseResyncBytes() { return sseResyncBytes; },
      get sseUnknownCount() { return sseUnknownCount; },
      get sseUnknownChars() { return sseUnknownChars; },
      get SSE_FRAGMENT_TYPES() { return SSE_FRAGMENT_TYPES; }
    });
  }
  // Ядро продолжает вызывать диагностику по ПРЕЖНИМ именам (o22-гарды
  // typeof diagMark === 'function' и прямые вызовы маркеров в горячих путях).
  // Форвардеры — ИМЕННО function declaration: хойстятся, поэтому вызовы в любом месте
  // ядра (emitBaseSnapshot/ingestHistory/processChunk выше по файлу) видят имя, а тело
  // живёт в модуле. Набор — ровно те 16 функций, что зовёт ядро; остальные 10 тел
  // модуля (normalizeRole, buildMessagesFromTurnsMap, collectUsageFieldsVerbatim,
  // fragContentLength, diagClip, diagPushRing, diagStat, diagFirstDiff, diagDumpRings,
  // buildMessagesFromRaw) ядру не нужны и наружу не выдаются.
  function isDebugEnabled() { return aiCmDeepseekDiag.isDebugEnabled(); }
  function getNavigationType() { return aiCmDeepseekDiag.getNavigationType(); }
  function determineState() { return aiCmDeepseekDiag.determineState(); }
  function dumpTurnUsageAtHistoryLoad(chain, chatMessages, chatSession) { aiCmDeepseekDiag.dumpTurnUsageAtHistoryLoad(chain, chatMessages, chatSession); }
  function dumpHistorySnapshot(state, stateReason, ctx) { aiCmDeepseekDiag.dumpHistorySnapshot(state, stateReason, ctx); }
  function diagOn() { return aiCmDeepseekDiag.diagOn(); }
  function diagHash6(s) { return aiCmDeepseekDiag.diagHash6(s); }
  function diagVerdict(lt, nt) { return aiCmDeepseekDiag.diagVerdict(lt, nt); }
  function diagFragState() { return aiCmDeepseekDiag.diagFragState(); }
  function diagMark(kind, data) { aiCmDeepseekDiag.diagMark(kind, data); }
  function diagChunkRecord(path, op, val, before, after) { aiCmDeepseekDiag.diagChunkRecord(path, op, val, before, after); }
  function diagHistRecord(json, src) { aiCmDeepseekDiag.diagHistRecord(json, src); }
  function diagSnapshotNetTurns(reason) { aiCmDeepseekDiag.diagSnapshotNetTurns(reason); }
  function diagLiveTurnRecord(id, role, text, reason) { aiCmDeepseekDiag.diagLiveTurnRecord(id, role, text, reason); }
  function diagExportHook(trigger) { aiCmDeepseekDiag.diagExportHook(trigger); }
  function diagResetForConv(reason, prevConv) { aiCmDeepseekDiag.diagResetForConv(reason, prevConv); }

  // ===== Step D.2: связка модуля сетевого дозапроса (core/deepseek-netsync.js) =====
  // Контракт: 8 fn (форвардеры диагностики D.1 и функции ядра — значением), 9 rw
  // (состояние дозапроса + orderCounter/ingestMode/exportSyncTruncated — тела их
  // перезаписывают) и 9 ro. Живое состояние отдаётся аксессорами, поэтому модуль и
  // ядро работают с ОДНИМИ И ТЕМИ ЖЕ переменными IIFE, а не с копиями значений.
  var aiCmDeepseekNetsync = (typeof window !== 'undefined' && window.AiCmDeepseekNetsync) || null;
  if (aiCmDeepseekNetsync) {
    aiCmDeepseekNetsync.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      diagMark: diagMark,
      diagOn: diagOn,
      diagHistRecord: diagHistRecord,
      diagVerdict: diagVerdict,
      emitBaseSnapshot: emitBaseSnapshot,
      ingestHistory: ingestHistory,
      historyRefetchUrl: historyRefetchUrl,
      getConvId: getConvId,
      // rw: живое состояние сетевого дозапроса. liveTurns/liveTurnOrder/netSnapshotAt/
      // netTurnIds/lastTurnDoneAt/netSyncStats пишут и оставшиеся секции ядра
      // (resetForNewConversation, ingestHistory, finishSseStream) — модуль обязан
      // видеть ТЕ ЖЕ объекты. orderCounter — порядок хода в файле (`orderCounter++`
      // в exportComposeTurns); ingestMode/exportSyncTruncated — режим экспортного
      // ingest, который ставит и снимает applyExportNetSnapshot. Без сеттеров эти
      // три записи молча терялись бы (sloppy): порядок ходов в файле замер бы.
      get liveTurns() { return liveTurns; },
      set liveTurns(v) { liveTurns = v; },
      get liveTurnOrder() { return liveTurnOrder; },
      set liveTurnOrder(v) { liveTurnOrder = v; },
      get netSnapshotAt() { return netSnapshotAt; },
      set netSnapshotAt(v) { netSnapshotAt = v; },
      get netTurnIds() { return netTurnIds; },
      set netTurnIds(v) { netTurnIds = v; },
      get lastTurnDoneAt() { return lastTurnDoneAt; },
      set lastTurnDoneAt(v) { lastTurnDoneAt = v; },
      get netSyncStats() { return netSyncStats; },
      set netSyncStats(v) { netSyncStats = v; },
      get orderCounter() { return orderCounter; },
      set orderCounter(v) { orderCounter = v; },
      get ingestMode() { return ingestMode; },
      set ingestMode(v) { ingestMode = v; },
      get exportSyncTruncated() { return exportSyncTruncated; },
      set exportSyncTruncated(v) { exportSyncTruncated = v; },
      // ro: только чтение — модуль эти имена не перезаписывает (мутации объектов по
      // ссылке — turnsMap, histCompletion, lastAuthHeaders — видны ядру и без сеттера).
      get currentConvId() { return currentConvId; },
      get turnsMap() { return turnsMap; },
      get histCompletion() { return histCompletion; },
      get lastAuthHeaders() { return lastAuthHeaders; },
      get lastBaseServerTokens() { return lastBaseServerTokens; },
      get sseRealtimeFinalTokens() { return sseRealtimeFinalTokens; },
      get sseModelType() { return sseModelType; },
      get lastBaseChatMode() { return lastBaseChatMode; },
      get originalFetch() { return originalFetch; }
    });
  }
  // Ядро продолжает звать сетевой дозапрос по ПРЕЖНИМ именам: liveTurnRecord — на
  // каждой финализации потока (finishSseStream), netSyncNeeded — из связки
  // диагностики выше. Форвардеры — ИМЕННО function declaration: хойстятся, поэтому
  // вызовы выше по файлу видят имя. Заглушек нет намеренно: js[] регистрируется
  // атомарно, а песочницы тестов получают конкатенацию через хелпер deepseek-source.
  function liveTurnRecord(id, role, text, answer, reasoning, modelSlug) { return aiCmDeepseekNetsync.liveTurnRecord(id, role, text, answer, reasoning, modelSlug); }
  function netSyncNeeded() { return aiCmDeepseekNetsync.netSyncNeeded(); }

  // ===== Step D.3: связка модуля REFETCH/URL-гигиены (core/deepseek-refetch.js) =====
  // Контракт: 2 fn (функции ядра, которые зовут тела модуля — значением), 3 rw
  // (состояние refetch-гигиены: его пишут и ядро, и модуль — get+set обязателен) и
  // 3 ro. Живое состояние отдаётся аксессорами, поэтому модуль и ядро работают с
  // ОДНИМИ И ТЕМИ ЖЕ переменными IIFE, а не с копиями значений.
  var aiCmDeepseekRefetch = (typeof window !== 'undefined' && window.AiCmDeepseekRefetch) || null;
  if (aiCmDeepseekRefetch) {
    aiCmDeepseekRefetch.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      diagMark: diagMark,
      ingestHistory: ingestHistory,
      // rw: состояние refetch-гигиены. lastAuthHeaders пишут fetch-хук (K11) и XHR-копилка
      // (K9); lastHistoryUrl — fetch-хук (K11), XHR-копилка (K9) и сброс чата (K5);
      // historyRefetchDone — сброс чата и детекторы усечения (K5). Сеттеры обязательны:
      // владелец семантики — модуль.
      get lastAuthHeaders() { return lastAuthHeaders; },
      set lastAuthHeaders(v) { lastAuthHeaders = v; },
      get lastHistoryUrl() { return lastHistoryUrl; },
      set lastHistoryUrl(v) { lastHistoryUrl = v; },
      get historyRefetchDone() { return historyRefetchDone; },
      set historyRefetchDone(v) { historyRefetchDone = v; },
      // ro: только чтение — модуль эти имена не перезаписывает.
      get currentConvId() { return currentConvId; },
      get lastLoadedConvId() { return lastLoadedConvId; },
      get originalFetch() { return originalFetch; }
    });
  }
  // Ядро продолжает звать REFETCH-хелперы по ПРЕЖНИМ именам (перехватчики fetch/XHR —
  // K9/K11, ingestHistory, resetForNewConversation). Форвардеры — ИМЕННО function
  // declaration: хойстятся, поэтому вызовы выше по файлу видят имя. Контракт — 7 из 9
  // тел: stripCacheParams и historyUrlForConv ядру не нужны (их зовут только тела
  // модуля). Заглушек нет намеренно: js[] регистрируется атомарно, а песочницы тестов
  // получают конкатенацию через tests/helpers/deepseek-intercept-source.js.
  function convIdFromHistoryUrl(url) { return aiCmDeepseekRefetch.convIdFromHistoryUrl(url); }
  function convIdFromCompletionBody(bodyStr) { return aiCmDeepseekRefetch.convIdFromCompletionBody(bodyStr); }
  function guardCheck(reqConvId) { return aiCmDeepseekRefetch.guardCheck(reqConvId); }
  function collectHeaders(input, init) { return aiCmDeepseekRefetch.collectHeaders(input, init); }
  function historyRefetchUrl() { return aiCmDeepseekRefetch.historyRefetchUrl(); }
  function refetchFullHistory(originalUrl, authHeaders, convId) { return aiCmDeepseekRefetch.refetchFullHistory(originalUrl, authHeaders, convId); }
  function scheduleHistoryRefetch() { return aiCmDeepseekRefetch.scheduleHistoryRefetch(); }

  // ===== Step D.4: связка модуля цепочки/текста хода (core/deepseek-parse.js) =====
  // Контракт: 2 ro-геттера — имена ядра, которые читают тела модуля
  // (REASONING_ENABLED — гейт v8 (O-7) в composeTurnText; __aiCmDeepseekResolveModelSlug —
  // K0, чистый резолвер slug по сетевым сигналам, объявлен ВНЕ этого IIFE). fn-передач и
  // rw-пар нет: состояние кластера модуль не ведёт вовсе (K3/K4 — чистые функции), а
  // REASONING_TAG/ANSWER_TAG/DS_PP_VISIBLE_MARKER уехали в модуль вместе с телами.
  // Живые имена отдаются геттерами, поэтому модуль и ядро работают с ОДНИМИ И ТЕМИ ЖЕ
  // переменными IIFE, а не с копиями значений.
  var aiCmDeepseekParse = (typeof window !== 'undefined' && window.AiCmDeepseekParse) || null;
  if (aiCmDeepseekParse) {
    aiCmDeepseekParse.__bind({
      // ro: только чтение — модуль эти имена не перезаписывает.
      get REASONING_ENABLED() { return REASONING_ENABLED; },
      get __aiCmDeepseekResolveModelSlug() { return __aiCmDeepseekResolveModelSlug; }
    });
  }
  // Ядро продолжает звать K3/K4 по ПРЕЖНИМ именам (hidden-пометки базы и композиция
  // ходов в ingestHistory, сборка текста хода в SSE-финализации, slug модели хода).
  // Форвардеры — ИМЕННО function declaration: хойстятся, поэтому вызовы в любом месте
  // ядра выше по файлу видят имя, а тело живёт в модуле. Контракт — все 6 тел кластера;
  // константы тегов ядру больше не нужны. Заглушек нет намеренно: js[] регистрируется
  // атомарно, а песочницы тестов получают конкатенацию через
  // tests/helpers/deepseek-intercept-source.js.
  function buildActiveChain(chatSession, messagesById) { return aiCmDeepseekParse.buildActiveChain(chatSession, messagesById); }
  function collectTurnText(fragments, role) { return aiCmDeepseekParse.collectTurnText(fragments, role); }
  function collectTurnReasoning(fragments, role) { return aiCmDeepseekParse.collectTurnReasoning(fragments, role); }
  function composeTurnText(answer, reasoning) { return aiCmDeepseekParse.composeTurnText(answer, reasoning); }
  function hasInjectedUserPrompt(text) { return aiCmDeepseekParse.hasInjectedUserPrompt(text); }
  function getModelSlug(thinkingEnabled, signals) { if (__aiCmIngestCtx === true && sseConfigIsDefault === true && sseConfigEnabled === true) signals = { modelPresent: signals && signals.modelPresent, model: signals && signals.model, modelType: sseConfigModelType, isDefault: sseConfigIsDefault, conversationMode: signals && signals.conversationMode, configName: sseConfigName }; return aiCmDeepseekParse.getModelSlug(thinkingEnabled, signals); }

  // ===== Step D.5: связка модуля CONV ID (core/deepseek-conv.js) =====
  // Контракт: 4 fn (diagResetForConv, resetStreamState, scheduleHistoryRefetch, resetFiles —
  // сброс файлового кэша вложений живёт в core/deepseek-files.js и вызывается на смену чата) +
  // 19 rw (состояние, которое тело сброса ПЕРЕЗАПИСЫВАЕТ: без сеттера запись в sloppy-
  // режиме молча терялась бы, и сброс на смену чата перестал бы работать) + 1 ro
  // (histCompletion: тело мутирует ПОЛЯ объекта, а не переприсваивает имя — мутация
  // по ссылке видна ядру без сеттера). Итого 24 имени контракта: 4 fn + 19 rw + 1 ro.
  if (aiCmDeepseekConv) {
    aiCmDeepseekConv.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      diagResetForConv: diagResetForConv,
      resetStreamState: resetStreamState,
      scheduleHistoryRefetch: scheduleHistoryRefetch,
      resetFiles: resetFiles,
      // rw: живое состояние, которое модуль ПЕРЕЗАПИСЫВАЕТ (get + set).
      get currentConvId() { return currentConvId; },
      set currentConvId(v) { currentConvId = v; },
      get lastDiagConvId() { return lastDiagConvId; },
      set lastDiagConvId(v) { lastDiagConvId = v; },
      get turnsMap() { return turnsMap; },
      set turnsMap(v) { turnsMap = v; },
      get orderCounter() { return orderCounter; },
      set orderCounter(v) { orderCounter = v; },
      get attachTokens() { return attachTokens; },
      set attachTokens(v) { attachTokens = v; },
      get attachBreak() { return attachBreak; },
      set attachBreak(v) { attachBreak = v; },
      get loggedOk() { return loggedOk; },
      set loggedOk(v) { loggedOk = v; },
      get loggedHistory() { return loggedHistory; },
      set loggedHistory(v) { loggedHistory = v; },
      get loggedRealtime() { return loggedRealtime; },
      set loggedRealtime(v) { loggedRealtime = v; },
      get lastLoadedConvId() { return lastLoadedConvId; },
      set lastLoadedConvId(v) { lastLoadedConvId = v; },
      get lastHistoryUrl() { return lastHistoryUrl; },
      set lastHistoryUrl(v) { lastHistoryUrl = v; },
      get historyRefetchDone() { return historyRefetchDone; },
      set historyRefetchDone(v) { historyRefetchDone = v; },
      get lastBaseServerTokens() { return lastBaseServerTokens; },
      set lastBaseServerTokens(v) { lastBaseServerTokens = v; },
      get lastBaseChatMode() { return lastBaseChatMode; },
      set lastBaseChatMode(v) { lastBaseChatMode = v; },
      get liveTurns() { return liveTurns; },
      set liveTurns(v) { liveTurns = v; },
      get liveTurnOrder() { return liveTurnOrder; },
      set liveTurnOrder(v) { liveTurnOrder = v; },
      get netSnapshotAt() { return netSnapshotAt; },
      set netSnapshotAt(v) { netSnapshotAt = v; },
      get netTurnIds() { return netTurnIds; },
      set netTurnIds(v) { netTurnIds = v; },
      get lastTurnDoneAt() { return lastTurnDoneAt; },
      set lastTurnDoneAt(v) { lastTurnDoneAt = v; },
      // ro: только чтение — модуль эти имена не перезаписывает.
      get histCompletion() { return histCompletion; }
    });
  }
  // Ядро продолжает звать K1 по ПРЕЖНИМ именам (emit-композиция, guard-хуки K9/K11,
  // сброс чата из ingestHistory). Форвардеры — ИМЕННО function declaration: хойстятся,
  // поэтому вызовы в любом месте ядра выше по файлу видят имя, а тело живёт в модуле.
  // checkConvChange наружу не выдаётся: его зовут только патчи pushState/replaceState и
  // popstate-слушатель самого модуля. Гард `aiCmDeepseekConv &&` — не заглушка, а требование
  // стандарта: ядро грузится и БЕЗ модуля (контрактные тесты K0/слагов, одиночный require),
  // и обёртка не имеет права бросать на загрузке. В браузере js[] регистрируется атомарно,
  // и песочницы тестов получают конкатенацию через tests/helpers/deepseek-intercept-source.js.
  function getConvId() { return (aiCmDeepseekConv && aiCmDeepseekConv.getConvId()) || ''; }
  function resetForNewConversation() { if (aiCmDeepseekConv) return aiCmDeepseekConv.resetForNewConversation(); }

  // ===== Step D.6: связка модуля EMIT (core/deepseek-emit.js) =====
  // Контракт: 7 fn (функции ядра, которые зовут тела модуля — передаются значением:
  // форвардеры D.1 diagHash6/diagMark/diagOn/diagExportHook/isDebugEnabled, форвардер
  // D.5 getConvId и форвардер D.4 hasInjectedUserPrompt; все — function declaration,
  // хойстятся), 4 rw (состояние emit-гарда O-22: его ПЕРЕЗАПИСЫВАЕТ тело
  // emitBaseSnapshot — без сеттера запись в sloppy-режиме молча терялась бы, и гард
  // повторного диспатча перестал бы глушить одинаковые снимки) и 5 ro (turnsMap/
  // attachTokens/attachBreak/histCompletion/currentConvId: модуль их только читает,
  // а поля histCompletion и записи turnsMap мутируются по ссылке). Итого 16 имён
  // контракта: 7 fn + 4 rw + 5 ro.
  var aiCmDeepseekEmit = (typeof window !== 'undefined' && window.AiCmDeepseekEmit) || null;
  if (aiCmDeepseekEmit) {
    aiCmDeepseekEmit.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      diagHash6: diagHash6,
      diagMark: diagMark,
      diagOn: diagOn,
      diagExportHook: diagExportHook,
      isDebugEnabled: isDebugEnabled,
      getConvId: getConvId,
      hasInjectedUserPrompt: hasInjectedUserPrompt,
      // rw: живое состояние emit-гарда, которое модуль ПЕРЕЗАПИСЫВАЕТ (get + set).
      get lastBaseServerTokens() { return lastBaseServerTokens; },
      set lastBaseServerTokens(v) { lastBaseServerTokens = v; },
      get lastBaseChatMode() { return lastBaseChatMode; },
      set lastBaseChatMode(v) { lastBaseChatMode = v; },
      get lastDispatchSig() { return lastDispatchSig; },
      set lastDispatchSig(v) { lastDispatchSig = v; },
      get lastDispatchResult() { return lastDispatchResult; },
      set lastDispatchResult(v) { lastDispatchResult = v; },
      // ro: только чтение — модуль эти имена не перезаписывает.
      get turnsMap() { return turnsMap; },
      get attachTokens() { return attachTokens; },
      get attachBreak() { return attachBreak; },
      get histCompletion() { return histCompletion; },
      get currentConvId() { return currentConvId; }
    });
  }
  // Ядро продолжает звать EMIT по ПРЕЖНЕМУ имени (K5 ingest при ре-эмите полноты 0→1,
  // realtime-финалы K6/K7 и fn-передача в контракт D.2). Форвардер — ИМЕННО function
  // declaration: хойстится, поэтому вызовы выше по файлу видят имя, а тело живёт
  // в модуле. Остальные три тела кластера (buildDispatchSignature/clipTurnText/
  // turnsSnapshot) наружу не выдаются: их зовут только тела модуля. Заглушек нет
  // намеренно: js[] регистрируется атомарно, а песочницы тестов получают конкатенацию
  // через tests/helpers/deepseek-intercept-source.js.
  function emitBaseSnapshot(serverTokens, chatMode) { return aiCmDeepseekEmit.emitBaseSnapshot(serverTokens, chatMode); }

  // ===== Step D.7: связка модуля NETWORK (core/deepseek-net.js) =====
  // Контракт: 11 fn (функции ядра, которые зовут тела модуля — передаются значением:
  // форвардеры D.1 diagOn/diagHistRecord, форвардеры D.3 collectHeaders/
  // convIdFromHistoryUrl/convIdFromCompletionBody/guardCheck/refetchFullHistory и тела
  // ядра ingestHistory (K5), parseSSE/consumeSseResponse/ingestModelSettings (K6, СЕКЦИЯ 9);
  // все — function declaration, хойстятся), 6 rw (копилки и параметры потока, которые
  // тела K9 ПЕРЕЗАПИСЫВАЮТ: без сеттера запись в sloppy-режиме молча терялась бы, и
  // копилка авторизации/URL, признак «ответ текущего чата обработан» и параметры
  // нового потока остались бы прежними) и 5 ro (originalFetch/OriginalXHR/
  // originalXHROpen/originalXHRSend/currentConvId: модуль их только читает, мутация
  // прототипа XHR идёт по ссылке). Итого 22 имени контракта: 11 fn + 6 rw + 5 ro.
  // Связка — ПОСЛЕДНЯЯ и стоит после захвата originalFetch (строка 222): иначе обёртка
  // fetch замкнулась бы сама на себя. Форвардеров у D.7 нет: ядро тела кластера не зовёт.
  var aiCmDeepseekNet = (typeof window !== 'undefined' && window.AiCmDeepseekNet) || null;
  if (aiCmDeepseekNet) {
    aiCmDeepseekNet.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      collectHeaders: collectHeaders,
      convIdFromHistoryUrl: convIdFromHistoryUrl,
      convIdFromCompletionBody: convIdFromCompletionBody,
      guardCheck: guardCheck,
      refetchFullHistory: refetchFullHistory,
      diagOn: diagOn,
      diagHistRecord: diagHistRecord,
      ingestHistory: ingestHistory,
      parseSSE: parseSSE,
      consumeSseResponse: consumeSseResponse,
      ingestModelSettings: ingestModelSettings,
      // rw: живое состояние копилок и потока, которое модуль ПЕРЕЗАПИСЫВАЕТ (get + set).
      get lastAuthHeaders() { return lastAuthHeaders; },
      set lastAuthHeaders(v) { lastAuthHeaders = v; },
      get lastHistoryUrl() { return lastHistoryUrl; },
      set lastHistoryUrl(v) { lastHistoryUrl = v; },
      get lastLoadedConvId() { return lastLoadedConvId; },
      set lastLoadedConvId(v) { lastLoadedConvId = v; },
      get sseUserPrompt() { return sseUserPrompt; },
      set sseUserPrompt(v) { sseUserPrompt = v; },
      get sseParentMessageId() { return sseParentMessageId; },
      set sseParentMessageId(v) { sseParentMessageId = v; },
      get sseThinkingEnabled() { return sseThinkingEnabled; },
      set sseThinkingEnabled(v) { sseThinkingEnabled = v; },
      // ro: только чтение — модуль эти имена не перезаписывает.
      get originalFetch() { return originalFetch; },
      get OriginalXHR() { return OriginalXHR; },
      get originalXHROpen() { return originalXHROpen; },
      get originalXHRSend() { return originalXHRSend; },
      get currentConvId() { return currentConvId; }
    });
  }

  // ===== Step D.8: связка модуля INGEST (core/deepseek-ingest.js) =====
  // Контракт: 18 fn (функции ядра, которые зовёт тело модуля — передаются значением:
  // форвардеры D.1 diagOn/diagMark/diagHistRecord/diagSnapshotNetTurns/isDebugEnabled/
  // determineState/dumpHistorySnapshot/dumpTurnUsageAtHistoryLoad, форвардер D.3
  // refetchFullHistory, форвардеры D.4 buildActiveChain/collectTurnText/
  // collectTurnReasoning/composeTurnText/getModelSlug, форвардер D.6 emitBaseSnapshot, форвардеры D.10 enqueueChainFiles/applyPendingFileTexts и
  // предикат D.11 filesMessageHasRefs (ход из одних вложений рождается на своём месте);
  // все — function declaration, хойстятся), 10 rw (состояние кластера, которое тело
  // ПЕРЕЗАПИСЫВАЕТ: turnsMap/orderCounter/histCompletion/netSnapshotAt/netTurnIds/
  // loggedHistory/lastLoadedConvId/historyRefetchDone, плюс режим экспортного ingest
  // ingestMode/exportSyncTruncated, которым владеет ещё и контракт D.2; без сеттера
  // запись в sloppy-режиме молча терялась бы — база не пересобиралась бы, вердикт
  // полноты не поднимался бы, а экспорт принял бы усечённый снимок за авторитетный)
  // и 8 ro (currentConvId/lastHistoryUrl/lastAuthHeaders/sseConfigName/REASONING_ENABLED/
  // MODEL_WINDOW_DEFAULT/lastBaseServerTokens/lastBaseChatMode: тело их только читает,
  // мутации объектов turnsMap/netTurnIds/histCompletion идут по ссылке). Итого 36 имён.
  var aiCmDeepseekIngest = (typeof window !== 'undefined' && window.AiCmDeepseekIngest) || null;
  if (aiCmDeepseekIngest) {
    aiCmDeepseekIngest.__bind({
      // fn: функции ядра, которые зовёт тело модуля — передаются значением.
      diagOn: diagOn,
      diagMark: diagMark,
      diagHistRecord: diagHistRecord,
      diagSnapshotNetTurns: diagSnapshotNetTurns,
      isDebugEnabled: isDebugEnabled,
      determineState: determineState,
      dumpHistorySnapshot: dumpHistorySnapshot,
      dumpTurnUsageAtHistoryLoad: dumpTurnUsageAtHistoryLoad,
      refetchFullHistory: refetchFullHistory,
      buildActiveChain: buildActiveChain,
      collectTurnText: collectTurnText,
      collectTurnReasoning: collectTurnReasoning,
      composeTurnText: composeTurnText,
      getModelSlug: getModelSlug,
      emitBaseSnapshot: emitBaseSnapshot,
      enqueueChainFiles: enqueueChainFiles,
      applyPendingFileTexts: applyPendingFileTexts,
      filesMessageHasRefs: filesMessageHasRefs,
      // rw: живое состояние кластера, которое тело ПЕРЕЗАПИСЫВАЕТ (get + set).
      get turnsMap() { return turnsMap; },
      set turnsMap(v) { turnsMap = v; },
      get orderCounter() { return orderCounter; },
      set orderCounter(v) { orderCounter = v; },
      get histCompletion() { return histCompletion; },
      set histCompletion(v) { histCompletion = v; },
      get netSnapshotAt() { return netSnapshotAt; },
      set netSnapshotAt(v) { netSnapshotAt = v; },
      get netTurnIds() { return netTurnIds; },
      set netTurnIds(v) { netTurnIds = v; },
      get loggedHistory() { return loggedHistory; },
      set loggedHistory(v) { loggedHistory = v; },
      get lastLoadedConvId() { return lastLoadedConvId; },
      set lastLoadedConvId(v) { lastLoadedConvId = v; },
      get historyRefetchDone() { return historyRefetchDone; },
      set historyRefetchDone(v) { historyRefetchDone = v; },
      get ingestMode() { return ingestMode; },
      set ingestMode(v) { ingestMode = v; },
      get exportSyncTruncated() { return exportSyncTruncated; },
      set exportSyncTruncated(v) { exportSyncTruncated = v; },
      // ro: только чтение — тело K5 эти имена не перезаписывает.
      get currentConvId() { return currentConvId; },
      get lastHistoryUrl() { return lastHistoryUrl; },
      get lastAuthHeaders() { return lastAuthHeaders; },
      get sseConfigName() { return sseConfigName; },
      get REASONING_ENABLED() { return REASONING_ENABLED; },
      get MODEL_WINDOW_DEFAULT() { return MODEL_WINDOW_DEFAULT; },
      get lastBaseServerTokens() { return lastBaseServerTokens; },
      get lastBaseChatMode() { return lastBaseChatMode; }
    });
  }
  // Ядро продолжает звать K5 по ПРЕЖНЕМУ имени: форвардер раздаёт тело контрактам D.2
  // (приёмка сетевого снимка в момент экспорта), D.3 (приёмка ответа тихого дозапроса
  // в refetchFullHistory) и D.7 (копилка XHR: история → ingest). Форвардер — ИМЕННО
  // function declaration: хойстится, поэтому fn-передачи ВЫШЕ по файлу (D.2/D.3/D.7)
  // видят значение. Гард `if (aiCmDeepseekIngest)` — не заглушка, а требование
  // стандарта: ядро грузится и БЕЗ модуля (контрактные тесты K0/слагов, одиночный
  // require), и обёртка не имеет права бросать на загрузке; невалидный ответ и отсутствие
  // модуля дают undefined одинаково (все выходы тела — голый `return;`). Заглушек нет
  // намеренно: js[] регистрируется атомарно, а песочницы тестов получают конкатенацию
  // через tests/helpers/deepseek-intercept-source.js.
  function ingestHistory(jsonBody) { if (aiCmDeepseekIngest) return aiCmDeepseekIngest.ingestHistory(jsonBody); }
  // Step D.10: форвардеры файлового модуля — ИМЕННО function declaration (хойстятся):
  // D.8-связка стоит ВЫШЕ по файлу и передаёт их телу ingestHistory ЗНАЧЕНИЕМ, поэтому на
  // момент вызова (приёмка истории) aiCmDeepseekFiles уже связан в конце IIFE. Гард — как у
  // остальных: ядро грузится и без модуля, обёртка не имеет права бросать.
  function enqueueChainFiles(chain, modelSignals) { if (aiCmDeepseekFiles) return aiCmDeepseekFiles.enqueueChainFiles(chain, modelSignals); }
  function applyPendingFileTexts() { if (aiCmDeepseekFiles) return aiCmDeepseekFiles.applyPendingFileTexts(); }
  // Сброс файлового состояния на смену чата (фикс утечки кэша между чатами): очередь, карта
  // текстов и ожидания принадлежат ОДНОМУ разговору. Зовётся из resetForNewConversation (D.5).
  function resetFiles() { if (aiCmDeepseekFiles) return aiCmDeepseekFiles.resetFiles(); }
  // Предикат «у сообщения есть вложения»: ingest обязан создать ход из ОДНИХ вложений на его
  // месте в цепочке (без него файловый модуль заводил хвостовую заглушку и текст уезжал в конец).
  function filesMessageHasRefs(msg) { if (aiCmDeepseekFiles) return aiCmDeepseekFiles.filesMessageHasRefs(msg); return false; }

  // ===== Step D.9: связка модуля SSE (core/deepseek-sse.js) =====
  // Контракт: 6 fn (функции ядра, которые зовут тела модуля — передаются значением:
  // форвардеры D.1 diagOn/diagMark/diagFragState/diagChunkRecord, форвардер D.5 getConvId
  // и тело K7 finalizeRealtimeTurn — оно ОСТАЛОСЬ в ядре, пишет turnsMap и зовёт
  // emitBaseSnapshot), 18 rw (состояние потока, которое тела K6 ПЕРЕЗАПИСЫВАЮТ: без
  // сеттера запись в sloppy-режиме молча терялась бы — буфер фрагментов не наполнялся бы,
  // сброс потока не чистил бы копилки, а USER-ход live-ответа терялся бы на старте
  // следующего потока) и 2 ro (SSE_FRAGMENT_TYPES и currentConvId: тела только читают).
  // Итого 26 имён. Живое состояние отдаётся аксессорами, поэтому модуль и ядро работают с
  // ОДНИМИ И ТЕМИ ЖЕ переменными IIFE, а не с копиями значений.
  var aiCmDeepseekSse = (typeof window !== 'undefined' && window.AiCmDeepseekSse) || null;
  if (aiCmDeepseekSse) {
    aiCmDeepseekSse.__bind({
      // fn: функции ядра, которые зовут тела модуля — передаются значением.
      diagOn: diagOn,
      diagMark: diagMark,
      diagFragState: diagFragState,
      diagChunkRecord: diagChunkRecord,
      getConvId: getConvId,
      finalizeRealtimeTurn: finalizeRealtimeTurn,
      get sseRealtimeEntryTokens() { return sseRealtimeEntryTokens; },
      set sseRealtimeEntryTokens(v) { sseRealtimeEntryTokens = v; },
      get sseRealtimeFinalTokens() { return sseRealtimeFinalTokens; },
      set sseRealtimeFinalTokens(v) { sseRealtimeFinalTokens = v; },
      get sseRequestMessageId() { return sseRequestMessageId; },
      set sseRequestMessageId(v) { sseRequestMessageId = v; },
      get sseResponseMessageId() { return sseResponseMessageId; },
      set sseResponseMessageId(v) { sseResponseMessageId = v; },
      get sseModelType() { return sseModelType; },
      set sseModelType(v) { sseModelType = v; },
      get sseConfigName() { return sseConfigName; },
      set sseConfigName(v) { sseConfigName = v; },
      get sseUserPrompt() { return sseUserPrompt; },
      set sseUserPrompt(v) { sseUserPrompt = v; },
      get sseParentMessageId() { return sseParentMessageId; },
      set sseParentMessageId(v) { sseParentMessageId = v; },
      get sseThinkingEnabled() { return sseThinkingEnabled; },
      set sseThinkingEnabled(v) { sseThinkingEnabled = v; },
      get sseFragments() { return sseFragments; },
      set sseFragments(v) { sseFragments = v; },
      get sseFragmentTypes() { return sseFragmentTypes; },
      set sseFragmentTypes(v) { sseFragmentTypes = v; },
      get sseStreamActive() { return sseStreamActive; },
      set sseStreamActive(v) { sseStreamActive = v; },
      get sseTurnFinished() { return sseTurnFinished; },
      set sseTurnFinished(v) { sseTurnFinished = v; },
      get sseResyncRing() { return sseResyncRing; },
      set sseResyncRing(v) { sseResyncRing = v; },
      get sseResyncCount() { return sseResyncCount; },
      set sseResyncCount(v) { sseResyncCount = v; },
      get sseResyncBytes() { return sseResyncBytes; },
      set sseResyncBytes(v) { sseResyncBytes = v; },
      get sseUnknownCount() { return sseUnknownCount; },
      set sseUnknownCount(v) { sseUnknownCount = v; },
      get sseUnknownChars() { return sseUnknownChars; },
      set sseUnknownChars(v) { sseUnknownChars = v; },
      get SSE_FRAGMENT_TYPES() { return SSE_FRAGMENT_TYPES; },
      // ro: только чтение — тела K6 это имя не перезаписывают.
      get currentConvId() { return currentConvId; }
    });
  }
  // Ядро продолжает звать K6 по ПРЕЖНИМ именам: sseModelSignals/streamFragmentText/
  // streamOtherText/dispatchStreamState — из K7 (finalizeRealtimeTurn) и обработчика смены
  // чата; resetStreamState/streamKnownType/parseSSE/consumeSseResponse/ingestModelSettings —
  // ЗНАЧЕНИЕМ в контракты D.5/D.1/D.7 (их связки стоят ВЫШЕ по файлу, поэтому форвардеры —
  // ИМЕННО function declaration: хойстятся, и fn-передачи видят значение на момент связки).
  // Гард `if (aiCmDeepseekSse)` — требование стандарта: ядро грузится и БЕЗ модуля
  // (контрактные тесты K0/слагов, одиночный require), и обёртка не имеет права бросать.
  // Заглушек нет намеренно: js[] регистрируется атомарно, а песочницы тестов получают
  // конкатенацию через tests/helpers/deepseek-intercept-source.js.
  function sseModelSignals() { if (aiCmDeepseekSse) return aiCmDeepseekSse.sseModelSignals(); }
  function ingestModelSettings(json) { if (aiCmDeepseekSse) return aiCmDeepseekSse.ingestModelSettings(json); }
  function dispatchStreamState(reason) { if (aiCmDeepseekSse) return aiCmDeepseekSse.dispatchStreamState(reason); }
  function resetStreamState() { if (aiCmDeepseekSse) return aiCmDeepseekSse.resetStreamState(); }
  function streamKnownType(t) { if (aiCmDeepseekSse) return aiCmDeepseekSse.streamKnownType(t); }
  function streamFragmentText(type) { if (aiCmDeepseekSse) return aiCmDeepseekSse.streamFragmentText(type); }
  function streamOtherText() { if (aiCmDeepseekSse) return aiCmDeepseekSse.streamOtherText(); }
  function parseSSE(text) { if (aiCmDeepseekSse) return aiCmDeepseekSse.parseSSE(text); }
  function consumeSseResponse(resp, convId) { if (aiCmDeepseekSse) return aiCmDeepseekSse.consumeSseResponse(resp, convId); }

  // ===== Step D.10: связка модуля FILES (core/deepseek-files.js) =====
  // Контракт: 3 fn (форвардеры D.4 composeTurnText/getModelSlug — пересборка текста хода, и
  // форвардер D.6 emitBaseSnapshot — ре-эмит базы после прихода текста), 2 rw (turnsMap/
  // orderCounter: тело заводит ход-заглушку для сообщения из одних вложений и перезаписывает
  // text уже собранного хода; без сеттера запись в sloppy-режиме молча терялась бы — тот же
  // довод, что у D.8) и 4 ro (currentConvId — ключ дедупа convId|fileId, originalFetch —
  // НАТИВНЫЙ fetch, снятый ядром до хука D.7, lastBaseServerTokens/lastBaseChatMode —
  // аргументы ре-эмита без пересчёта токенов). Заголовки чата телу файла НЕ нужны:
  // файловый хост авторизует подпись в URL (core/deepseek-files.js, resolveFileUrl).
  // Итого 9 имён. Живое состояние отдаётся аксессорами, поэтому модуль и ядро работают с
  // ОДНИМИ И ТЕМИ ЖЕ переменными IIFE, а не с копиями значений.
  var aiCmDeepseekFiles = (typeof window !== 'undefined' && window.AiCmDeepseekFiles) || null;
  if (aiCmDeepseekFiles) {
    aiCmDeepseekFiles.__bind({
      // fn: форвардеры ядра, которые зовёт тело модуля — передаются значением.
      composeTurnText: composeTurnText,
      getModelSlug: getModelSlug,
      emitBaseSnapshot: emitBaseSnapshot,
      // rw: живое состояние кластера, которое тело ПЕРЕЗАПИСЫВАЕТ (get + set).
      get turnsMap() { return turnsMap; },
      set turnsMap(v) { turnsMap = v; },
      get orderCounter() { return orderCounter; },
      set orderCounter(v) { orderCounter = v; },
      // ro: только чтение — тело D.10 эти имена не перезаписывает.
      get currentConvId() { return currentConvId; },
      get originalFetch() { return originalFetch; },
      get lastBaseServerTokens() { return lastBaseServerTokens; },
      get lastBaseChatMode() { return lastBaseChatMode; }
    });
  }
})();

// v13: экспорт чистого резолвера для контрактного теста (jest/jsdom). В браузере module нет —
// блок не выполняется и на страницу не влияет.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolveNetworkModelSlug: __aiCmDeepseekResolveModelSlug,
    DEEPSEEK_V4_FLASH_SLUG: AI_CM_DEEPSEEK_V4_FLASH_SLUG
  };
}

/* ===== UI bootstrap (content.js) ===== */
(function () {
  function replay() {
    try { if (typeof window.__aiCmPackReplay === 'function') window.__aiCmPackReplay(); } catch (e) { }
  }
  function initUI() {
    try {
(()=>{var za=Object.defineProperty;var lm=Object.getOwnPropertyDescriptor;var cm=Object.getOwnPropertyNames;var fm=Object.prototype.hasOwnProperty;var Nl=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,n)=>(typeof require<"u"?require:t)[n]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var fe=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(r){throw n=[r],r}};var dm=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}},Bl=(e,t)=>{for(var n in t)za(e,n,{get:t[n],enumerable:!0})},gm=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of cm(t))!fm.call(e,i)&&i!==n&&za(e,i,{get:()=>t[i],enumerable:!(r=lm(t,i))||r.enumerable});return e};var pm=e=>gm(za({},"__esModule",{value:!0}),e);function ql(e){return typeof e!="string"?e:e.replace(hm," ").replace(/[ \t\f\v]+/g," ")}function jl(e,t){for(var n="",r=0;r<t.length;r++)try{var i=e.getAttribute?e.getAttribute(t[r]):null;i&&(n+=" "+i)}catch{}return n}function Wl(e){try{return String(e.className||"")+" "+String(e.id||"")}catch{return""}}function ym(e){var t=Wl(e).toLowerCase();return t.indexOf("cdk-visually-hidden")!==-1||t.indexOf("cdk-live-announcer")!==-1}function vm(e){if(mm.test(Wl(e)))return!0;var t=jl(e,["aria-label","title"]);return Hl.test(t)}function Cm(e){var t=jl(e,["aria-label","title"]);if(e.tagName&&String(e.tagName).toLowerCase()==="button")try{t+=" "+(e.textContent||"")}catch{}return t}function bm(e){var t=!1;return(function n(r,i){if(!(t||i>4)&&!(!r||r.nodeType!==1)){if(Hl.test(Cm(r))){t=!0;return}for(var o=r.childNodes,a=0;a<o.length;a++)n(o[a],i+1)}})(e,0),t}function xm(e){var t=e;try{return!!t.querySelector&&!!t.querySelector("table")}catch{return!1}}function wm(e){return ym(e)||vm(e)?!0:xm(e)?!1:bm(e)}function Sm(e){var t;try{t=e.cloneNode(!0)}catch{return""}try{t.querySelectorAll("script, style, button, svg").forEach(function(n){n.remove()})}catch{}try{return ql((t.textContent||"").replace(/\s+/g," ").trim())}catch{return""}}function Am(e){var t=[];try{t=e.querySelectorAll("tr")}catch{t=[]}for(var n=[],r=0;r<t.length;r++){for(var i=t[r].querySelectorAll("th, td"),o=[],a=0;a<i.length;a++)o.push(Sm(i[a]));o.length!==0&&n.push("| "+o.join(" | ")+" |")}return n.join(`
`)}function Yi(e){var t=[],n=[];function r(){if(n.length){var l=n.join(" ");n=[],l=l.replace(/\s+/g," ").trim(),l&&t.push(l)}}function i(l){if(typeof l=="string"){var c=ql(l.replace(/\s+/g," ").trim());c&&n.push(c)}}function o(l){if(l){var c=l.nodeType;if(c===3){i(l.nodeValue||"");return}if(c===1){var f=l;if(wm(f)){r();return}var d=(f.tagName||"").toUpperCase();if(d==="TABLE"){r();var h=Am(f);h&&t.push(h);return}Gl[d]&&r();for(var m=l.childNodes,y=0;y<m.length;y++)o(m[y]);Gl[d]&&r()}}}if(e)for(var a=e.childNodes,s=0;s<a.length;s++)o(a[s]);r();var u=t.join(`
`).replace(/\n{3,}/g,`

`).trim();return{text:u,count:t.length,parts:t}}var mm,Hl,hm,Gl,Ul=fe(()=>{mm=/think|thought/i,Hl=/thinking|\bthought\b|\bдумал\b/i,hm=/\$AXzLiR[A-Za-z0-9+\/=]+/g;Gl={P:1,DIV:1,SECTION:1,ARTICLE:1,UL:1,OL:1,LI:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,BLOCKQUOTE:1,PRE:1,BR:1,HR:1,HEADER:1,FOOTER:1,MAIN:1,ASIDE:1,TR:1,THEAD:1,TBODY:1}});function zl(){try{var e=typeof browser<"u"&&browser&&browser.runtime?browser:typeof chrome<"u"&&chrome&&chrome.runtime?chrome:null;return e?e.runtime&&typeof e.runtime.getURL=="function"?String(e.runtime.getURL("")).indexOf("moz-extension://")===0:typeof e.getURL=="function"?String(e.getURL("")).indexOf("moz-extension://")===0:!1:!1}catch{return!1}}var Kl=fe(()=>{});function Dt(e){var t=Array.isArray(e)?e:[];return t.map(function(n){return String(n?.text??"")}).join(`
`)}function Nr(e){for(var t=String(e??""),n=2166136261,r=0;r<t.length;r++)n^=t.charCodeAt(r),n=Math.imul(n,16777619);for(var i=(n>>>0).toString(16);i.length<8;)i="0"+i;return i}function kn(e,t){var n=Array.isArray(t)?t:[],r=String(e??"");if(Array.isArray(t)&&eo){var i=eo.get(n);if(i&&i.convId===r)return i.body}for(var o=Dt(n),a=[r,"\0"],s=0;s<n.length;s++){var u=n[s]||{};a.push(String(u.role==null?"":u.role),"\0",String(u.text==null?"":u.text),"")}var l=Nr(a.join("")),c=o.length,f={messages:n,text:o,chars:c,msgs:n.length,bodyHash:l+":"+c};return Array.isArray(t)&&eo&&eo.set(n,{convId:r,body:f}),f}var eo,to=fe(()=>{eo=typeof WeakMap=="function"?new WeakMap:null});function Vl(e){$l=!!e;try{typeof window<"u"&&(window.__aiCmDebugLogs=!!e)}catch{}}function Ka(e){if(typeof e=="string")return e;try{var t=JSON.stringify(e);return t===void 0?String(e):(t.length>500&&(t=t.slice(0,500)+"\u2026"),t)}catch{return String(e)}}function Qn(e){try{no.push(e),no.length>Tm&&no.shift()}catch{}}function $a(){try{return no.slice()}catch{return[]}}function p(e,...t){var n=Array.prototype.slice.call(arguments,1);try{var r=n.map(Ka).join(" ");Qn(r)}catch{}if(e==="error"||e==="warn"){(console[e]||console.log).apply(console,n);return}var i=$l,o=e;try{typeof window<"u"&&window.__aiCmDebugLogs===!0&&(i=!0)}catch{}i&&(console[o]||console.log).apply(console,n)}function At(e,t){try{if(typeof p!="function")return;p("error","[swallow]["+(t||"unlabeled")+"]",e)}catch{}}function Ne(){try{if(typeof sessionStorage<"u"&&sessionStorage&&sessionStorage.getItem("aiCmDebug")==="1")return!0}catch{}try{if(typeof window<"u"&&window&&window.__aiCmDebugLogs===!0)return!0}catch{}return!1}function Br(){var e="",t="";try{e=String(typeof location<"u"&&location&&location.href||"")}catch{}try{t=String(typeof location<"u"&&location&&location.hostname||"")}catch{}var n=t==="google.com"||t==="www.google.com";try{if(e.indexOf("/sorry/")!==-1||n&&(document.querySelector("#captcha-form")||document.querySelector('form[action*="sorry"]')||document.querySelector('iframe[src*="recaptcha"]')))return"captcha"}catch{}try{var r="",i=document.querySelector("[data-session-thread-id]");if(i&&(r=String(i.getAttribute("data-session-thread-id")||"").trim()),r||document.querySelector('[data-scope-id="turn"]')||document.querySelector('[data-subtree="aimfl"]'))return"chat"}catch{}return n?"search":"chat"}function Gr(e,t){try{var n=typeof t=="number"&&t>0?t:100;if(e==null)return"(\u043F\u0443\u0441\u0442\u043E)";var r=String(e);if(!r)return"(\u043F\u0443\u0441\u0442\u043E)";var i=r.replace(/\s+/g," ").trim();return i?i.length>n?i.slice(0,n)+"\u2026":i:"(\u043F\u0443\u0441\u0442\u043E/\u043F\u0440\u043E\u0431\u0435\u043B\u044B)"}catch{return"(\u043E\u0448\u0438\u0431\u043A\u0430)"}}function pe(e){try{var t=String(new Error().stack||"");if(!t)return"";for(var n=t.split(`
`),r=[],i=1+(typeof e=="number"&&e>=0?e:0),o=i;o<n.length&&r.length<4;o++){var a=String(n[o]||"").replace(/\s+/g," ").trim();!a||a.indexOf("aiCmDiag")!==-1||r.push(a)}return r.join(" <- ")}catch{return""}}function w(e,t){if(!Ne())return!1;try{var n=[],r=t||{};for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i)){var o=r[i];n.push(i+"="+(o==null?"(\u043D\u0435\u0442)":String(o)))}console.log("[AI CM][diag] "+e+" "+n.join(" "))}catch{}return!0}function Va(e,t,n,r){if(!Ne())return!1;var i=r||{},o="";try{o=String(typeof location<"u"&&location&&location.href||"")}catch{}return w("download",{trigger:e||"(\u043D\u0435\u0442)",file:n==null||String(n)===""?"\u043F\u0443\u0441\u0442\u043E\u0435":String(n),bytes100:Gr(t,100),len:t==null?0:String(t).length,mime:i.mime,url:o,threadId:i.threadId,site:i.site,reason:i.reason,src:pe(1)})}function Qa(e,t,n,r,i){if(!Ne())return!1;var o=i||{},a="";try{a=String(typeof location<"u"&&location&&location.href||"")}catch{}return w("download-blocked",{reason:r||"(\u043D\u0435\u0442)",trigger:e||"(\u043D\u0435\u0442)",file:n==null||String(n)===""?"\u043F\u0443\u0441\u0442\u043E\u0435":String(n),bytes100:Gr(t,100),len:t==null?0:String(t).length,mime:o.mime,url:a,threadId:o.threadId,site:o.site,src:pe(1)})}function v(e,t){var n=t||"unlabeled",r="";try{r=e&&e.message?String(e.message):String(e)}catch{r="(\u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430)"}try{typeof Qn=="function"&&Qn("[swallow-soft]["+n+"] "+r)}catch{return}try{if(typeof w!="function")return;w("swallow-soft",{tag:n,err:e})}catch{return}}function Hr(e,t,n){var r=e||"unlabeled",i=t==null?"":String(t);try{var o="";n!==void 0&&(o=" "+(typeof Ka=="function"?Ka(n):String(n))),typeof Qn=="function"&&Qn("[ai-cm-warn]["+r+"] "+i+o)}catch{return}try{if(typeof Ne!="function"||!Ne())return;console.log("[AI CM][warn]["+r+"] "+i,n)}catch{return}}var $l,no,Tm,Mn=fe(()=>{$l=!1;no=[],Tm=200;try{typeof window<"u"&&(window.__aiCmSwallow=At)}catch{}try{typeof window<"u"&&(window.__aiCmSwallowSoft=v)}catch(e){Qn("[swallow-soft-export] "+e)}});function Em(e){let t=e.cyr/mn.CYRILLIC_CHARS_PER_TOKEN+e.latin/mn.LATIN_CHARS_PER_TOKEN+e.digit/mn.DIGIT_CHARS_PER_TOKEN+e.punct*mn.PUNCT_TOKENS_PER_CHAR+e.cjk/mn.CJK_CHARS_PER_TOKEN+e.other*mn.OTHER_TOKENS_PER_CHAR+mn.CONST_TOKENS;return Math.max(0,Math.ceil(t))}function Ql(e){let t={cyr:0,latin:0,digit:0,cjk:0,punct:0,other:0};if(!e)return t;for(let n=0;n<e.length;n++){let r=e[n];if(/[\u0400-\u04FF]/.test(r))t.cyr++;else if(/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(r))t.cjk++;else if(/[A-Za-z]/.test(r))t.latin++;else if(/[0-9]/.test(r))t.digit++;else{if(/\s/.test(r))continue;/[.,!?;:()\[\]{}"'«»\-—]/.test(r)?t.punct++:t.other++}}return t}var mn,st,Jl=fe(()=>{mn={CYRILLIC_CHARS_PER_TOKEN:3.58,LATIN_CHARS_PER_TOKEN:4.611,DIGIT_CHARS_PER_TOKEN:.8045,PUNCT_TOKENS_PER_CHAR:.78665,CJK_CHARS_PER_TOKEN:1.8,OTHER_TOKENS_PER_CHAR:1.07511,CONST_TOKENS:0};st={CYRILLIC_CHARS_PER_TOKEN:mn.CYRILLIC_CHARS_PER_TOKEN,countTokens(e){return!e||e.length===0?0:Em(Ql(e))},countTokenizerFeatures(e){return Ql(e)},estimateDialogTokens(e,t=1){let n=this.countTokens(e),r=t*4;return n+r}}});var K,Zl=fe(()=>{K={EFFECTIVE_CAP_DEFAULT:128e3,models:{"gpt-5.6-sol":{name:"GPT-5.6 Sol",provider:"OpenAI",contextLimit:105e4,description:"GPT-5.6 Sol \u2014 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u0442\u043A\u0430 GPT-5.6, \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-5.6-luna":{name:"GPT-5.6 Luna",provider:"OpenAI",contextLimit:105e4,description:"GPT-5.6 Luna \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-5.6-terra":{name:"GPT-5.6 Terra",provider:"OpenAI",contextLimit:105e4,description:"GPT-5.6 Terra \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-6":{name:"GPT-6",provider:"OpenAI",contextLimit:105e4,description:"\u041B\u0438\u043D\u0435\u0439\u043A\u0430 GPT-6, \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-6-turbo":{name:"GPT-6 Turbo",provider:"OpenAI",contextLimit:105e4,description:"GPT-6 Turbo \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-6-astra":{name:"GPT-6 Astra",provider:"OpenAI",contextLimit:105e4,description:"GPT-6 Astra \u2014 \u0444\u043B\u0430\u0433\u043C\u0430\u043D GPT-6, \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-6.1-sol":{name:"GPT-6.1 Sol",provider:"OpenAI",contextLimit:105e4,description:"GPT-6.1 Sol \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-6-sol":{name:"GPT-6 Sol",provider:"OpenAI",contextLimit:105e4,description:"GPT-6 Sol \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-5.5":{name:"GPT-5.5",provider:"OpenAI",contextLimit:105e4,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D OpenAI 2026 (\u043E\u043A\u043D\u043E 1 050 000 \u0432 API; \u043F\u043E\u0440\u043E\u0433 \u0431\u0435\u0439\u0434\u0436\u0430 \u0432 ChatGPT \u2014 128000, capExempt \u043D\u0435 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C: \u0432\u0435\u0431-\u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u043E\u043A\u043D\u043E \u043D\u0435 \u0437\u0430\u044F\u0432\u043B\u044F\u0435\u0442)"},"gpt-5.5-pro":{name:"GPT-5.5 Pro",provider:"OpenAI",contextLimit:105e4,description:"GPT-5.5 Pro \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-5-6":{name:"GPT-5.6",provider:"OpenAI",contextLimit:105e4,description:"GPT-5.6 \u2014 slug \u0438\u0437 \u0441\u0435\u0442\u0438 ChatGPT (gpt-5-6), \u043E\u043A\u043D\u043E 1 050 000 (API)"},"gpt-5":{name:"GPT-5",provider:"OpenAI",contextLimit:4e5,description:"\u041B\u0438\u043D\u0435\u0439\u043A\u0430 GPT-5, \u043E\u043A\u043D\u043E 400 000 (API)"},"gpt-4.1":{name:"GPT-4.1",provider:"OpenAI",contextLimit:1047576,description:"GPT-4.1, \u043E\u043A\u043D\u043E 1 047 576"},"gpt-4o":{name:"GPT-4o",provider:"OpenAI",contextLimit:128e3,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C OpenAI"},"gpt-4o-mini":{name:"GPT-4o Mini",provider:"OpenAI",contextLimit:128e3,description:"\u041E\u0431\u043B\u0435\u0433\u0447\u0451\u043D\u043D\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F GPT-4o"},"gpt-4-turbo":{name:"GPT-4 Turbo",provider:"OpenAI",contextLimit:128e3,description:"\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0444\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C"},"gpt-4":{name:"GPT-4",provider:"OpenAI",contextLimit:8192,description:"\u0411\u0430\u0437\u043E\u0432\u0430\u044F GPT-4"},"gpt-3.5-turbo":{name:"GPT-3.5 Turbo",provider:"OpenAI",contextLimit:16385,description:"\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u0435"},"gemini-auto":{name:"Gemini (\u0410\u0432\u0442\u043E)",provider:"Google",contextLimit:1048576,description:"Gemini web, \u0440\u0435\u0436\u0438\u043C \u0410\u0432\u0442\u043E: \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u0430; API-\u043E\u043A\u043D\u043E 1 048 576, \u043F\u043E\u0440\u043E\u0433 \u043F\u043E\u043A\u0430\u0437\u0430 128 000"},"gemini-2.5-pro":{name:"Gemini 2.5 Pro",provider:"Google",contextLimit:1048576,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"},"gemini-2.5-flash":{name:"Gemini 2.5 Flash",provider:"Google",contextLimit:1048576,description:"\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"},"gemini-1.5-pro":{name:"Gemini 1.5 Pro",provider:"Google",contextLimit:2097152,description:"\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0444\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C. \u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043C\u043E\u0434\u0435\u043B\u0438 \u0441\u043D\u044F\u0442\u0430 (404), \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 2 097 152 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u2014 \u044D\u0442\u043E \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u043F\u0440\u0435\u0436\u043D\u0435\u0439 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438"},"gemini-3.1-pro":{name:"Gemini 3.1 Pro",provider:"Google",contextLimit:128e3,description:"Gemini 3.1 Pro. API-\u043E\u043A\u043D\u043E 1 048 576; \u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u0442\u0430\u0440\u0438\u0444\u0430 (32K Free / 128K AI Plus / 1M AI Pro), \u0432 \u043A\u043E\u043D\u0444\u0438\u0433\u0435 128000 = \u0442\u0430\u0440\u0438\u0444 AI Plus"},"gemini-3.6-flash":{name:"Gemini 3.6 Flash",provider:"Google",contextLimit:1048576,description:"Gemini 3.6 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"},"gemini-3.5-flash":{name:"Gemini 3.5 Flash",provider:"Google",contextLimit:1048576,description:"Gemini 3.5 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"},"gemini-3.5-flash-lite":{name:"Gemini 3.5 Flash Lite",provider:"Google",contextLimit:1048576,description:"Gemini 3.5 Flash Lite \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"},"gemini-3-flash":{name:"Gemini 3 Flash",provider:"Google",contextLimit:1048576,description:"Gemini 3 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"},"gemini-search-default":{name:"Gemini (Search AI)",provider:"Google",contextLimit:1048576,description:"Google Search AI: slug \u0438\u0437 \u0441\u0435\u0442\u0438 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D \u2192 \u0434\u0435\u0444\u043E\u043B\u0442\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C AI Mode. \u0421\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u043E\u043A\u043D\u043E AI Mode \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u041D\u0415 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043E, \u0441\u0442\u043E\u0438\u0442 \u043E\u043A\u043D\u043E Gemini 3.5 Flash \u043A\u0430\u043A \u043F\u0440\u043E\u043A\u0441\u0438"},"deepseek-v4-pro":{name:"DeepSeek V4 Pro",provider:"DeepSeek",contextLimit:1e6,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D DeepSeek V4, \u043E\u043A\u043D\u043E 1M (API)"},"deepseek-flash":{name:"DeepSeek Flash",provider:"DeepSeek",contextLimit:1e6,description:"\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C DeepSeek V4, \u043E\u043A\u043D\u043E 1M (API)"},"deepseek-v4.1-flash":{name:"DeepSeek V4.1 Flash",provider:"DeepSeek",contextLimit:1e6,capExempt:!0,description:"DeepSeek V4.1 Flash (unified Intelligent Mode), \u043E\u043A\u043D\u043E 1M"},"deepseek-v3":{name:"DeepSeek V3",provider:"DeepSeek",contextLimit:128e3,description:"DeepSeek V3, \u043E\u043A\u043D\u043E 128K (API)"},"deepseek-r1":{name:"DeepSeek R1",provider:"DeepSeek",contextLimit:128e3,description:"DeepSeek R1, \u0443\u0441\u0438\u043B\u0435\u043D\u043D\u044B\u0439 reasoning, \u043E\u043A\u043D\u043E 128K (API)"},"claude-sonnet-5-5":{name:"Claude Sonnet 5.5",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Sonnet 5.5 (claude-sonnet-5-5) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"},"claude-opus-5-5":{name:"Claude Opus 5.5",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Opus 5.5 (claude-opus-5-5) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"},"claude-fable-5-1":{name:"Claude Fable 5.1",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Fable 5.1 (claude-fable-5-1) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"},"claude-opus-5":{name:"Claude Opus 5",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Opus 5 (\u0431\u0435\u0437 \u043C\u0438\u043D\u043E\u0440\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0438) \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M"},"claude-opus-4-8":{name:"Claude Opus 4.8",provider:"Anthropic",contextLimit:5e5,capExempt:!0,description:"Claude Opus 4.8 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"},"claude-opus-4-7":{name:"Claude Opus 4.7",provider:"Anthropic",contextLimit:5e5,capExempt:!0,description:"Claude Opus 4.7 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"},"claude-sonnet-5":{name:"Claude Sonnet 5",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Sonnet 5 (\u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435)"},"claude-sonnet-4-6":{name:"Claude Sonnet 4.6",provider:"Anthropic",contextLimit:5e5,capExempt:!0,description:"Claude Sonnet 4.6 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"},"claude-sonnet-4-5":{name:"Claude Sonnet 4.5",provider:"Anthropic",contextLimit:2e5,description:"Claude Sonnet 4.5 (\u043E\u043A\u043D\u043E 200K)"},"claude-opus-4-6":{name:"Claude Opus 4.6",provider:"Anthropic",contextLimit:5e5,capExempt:!0,description:"Claude Opus 4.6 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"},"claude-opus-4-5":{name:"Claude Opus 4.5",provider:"Anthropic",contextLimit:2e5,description:"Claude Opus 4.5 (\u043E\u043A\u043D\u043E 200K)"},"claude-haiku-4-5":{name:"Claude Haiku 4.5",provider:"Anthropic",contextLimit:2e5,description:"Claude Haiku 4.5 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u0438 API-\u043E\u043A\u043D\u043E 200K"},"claude-haiku-5-5":{name:"Claude Haiku 5.5",provider:"Anthropic",contextLimit:1e6,capExempt:!0,description:"Claude Haiku 5.5 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M (docs Anthropic, 2026-11-12; \u043E\u043A\u043D\u043E \u0442\u0430\u0440\u0438\u0444\u0430 Free \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E)"},"claude-3-5-sonnet":{name:"Claude 3.5 Sonnet",provider:"Anthropic",contextLimit:2e5,description:"Claude 3.5 Sonnet (\u043E\u043A\u043D\u043E 200K)"},"claude-3-5-haiku":{name:"Claude 3.5 Haiku",provider:"Anthropic",contextLimit:2e5,description:"Claude 3.5 Haiku (\u043E\u043A\u043D\u043E 200K)"},"claude-3-opus":{name:"Claude 3 Opus",provider:"Anthropic",contextLimit:2e5,description:"Claude 3 Opus (\u043E\u043A\u043D\u043E 200K)"},"claude-3-haiku":{name:"Claude 3 Haiku",provider:"Anthropic",contextLimit:2e5,description:"Claude 3 Haiku (\u043E\u043A\u043D\u043E 200K)"},"claude-3-sonnet":{name:"Claude 3 Sonnet",provider:"Anthropic",contextLimit:2e5,description:"Claude 3 Sonnet (\u043E\u043A\u043D\u043E 200K)"},turbo:{name:"Perplexity Sonar (turbo)",provider:"Perplexity",contextLimit:128e3,description:"Perplexity Sonar (turbo), \u043E\u043A\u043D\u043E 128K. \u0423\u0421\u0422\u0410\u0420\u0415\u041B\u041E: \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442 \u0432 \u0432\u0435\u0431-UI \u0441 2026-09 (Sonar Chat Completions \u0437\u0430\u043A\u0440\u044B\u0442 2026-09-27); \u043A\u043B\u044E\u0447 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u044B\u0445 \u0442\u0440\u0435\u0434\u043E\u0432 \u0438 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430"},sonar:{name:"Perplexity Sonar",provider:"Perplexity",contextLimit:128e3,description:"Perplexity Sonar, \u043E\u043A\u043D\u043E 128K"},"sonar-pro":{name:"Perplexity Sonar Pro",provider:"Perplexity",contextLimit:2e5,description:"Perplexity Sonar Pro, \u043E\u043A\u043D\u043E 200K"},"sonar-reasoning":{name:"Perplexity Sonar Reasoning",provider:"Perplexity",contextLimit:128e3,description:"Perplexity Sonar Reasoning, \u043E\u043A\u043D\u043E 128K"},"sonar-deep-research":{name:"Perplexity Sonar Deep Research",provider:"Perplexity",contextLimit:2e5,description:"Perplexity Sonar Deep Research, \u043E\u043A\u043D\u043E 200K"},"qwen3.7-plus":{name:"Qwen3.7-Plus",provider:"Qwen",contextLimit:1e6,capExempt:!0,description:"\u0410\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Qwen (chat.qwen.ai), \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M \u2014 \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0415\u041D\u041E \u0416\u0418\u0412\u042B\u041C /api/models 2026-10-04"},"qwen3.8-max":{name:"Qwen3.8-Max",provider:"Qwen",contextLimit:1e6,capExempt:!0,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Qwen (chat.qwen.ai), \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M \u2014 \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0415\u041D\u041E \u0416\u0418\u0412\u042B\u041C /api/models 2026-10-04 (\u0431\u044B\u043B\u043E: 128K HYPOTHESIS)"},"Gemini 2.5 Pro":{name:"Gemini 2.5 Pro",provider:"Google",contextLimit:1048576,description:"\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"},"Gemini 2.5 Flash":{name:"Gemini 2.5 Flash",provider:"Google",contextLimit:1048576,description:"\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"}},siteDefaults:{chatgpt:"gpt-5.5",gemini:"gemini-2.5-flash",aistudio:"gemini-2.5-pro",google_search:"gemini-search-default",deepseek:"deepseek-v3",claude:"claude-sonnet-4-6",perplexity:"turbo",qwen:"qwen3.7-plus"},familyDefaults:{pro:{modelId:"3.1 Pro",contextLimit:128e3},"pro-lite":{modelId:"3.1 Pro",contextLimit:128e3},flash:{modelId:"3.6 Flash",contextLimit:1048576},"flash-lite":{modelId:"3.5 Flash Lite",contextLimit:1048576},ultra:{modelId:"3.1 Ultra",contextLimit:1048576}},getModel(e){return this.models[e]||null},getDefaultModel(e){return this.siteDefaults[e]||"gpt-5.5"},getContextLimit(e){let t=this.getModel(e);return t?t.contextLimit:128e3},getEffectiveLimit(e){let t=this.getModel(e);return t?t.capExempt===!0?t.contextLimit:Math.min(t.contextLimit,this.EFFECTIVE_CAP_DEFAULT):this.EFFECTIVE_CAP_DEFAULT},resolvePopupModelId(e){if(e==null)return null;let t=String(e).trim();if(!t||t.toLowerCase()==="auto")return null;let n=this.resolveModelId(t);return n&&this.models[n]?n:null},resolveLimitPct(e){if(e==null)return null;let t=String(e).trim();if(!t)return null;let n=Number(t);return!isFinite(n)||n<1||n>100?100:n},applyLimitPct(e,t){return typeof t!="number"||!(t>0)?e:Math.max(1,Math.round(t/100*e))},computeDisplayLimit(e,t){return this.applyLimitPct(this.getEffectiveLimit(e),t)},getFamilyDefaultModelId(e,t){let n=String(e||"").toLowerCase().replace(/[^a-z]/g,""),r=String(t||"").toLowerCase(),i=/lite/.test(r),o=/расширенн|extended|fast/.test(r),a=n+(i?"-lite":""),s=this.familyDefaults[a];return s?s.modelId:null},resolveModelId(e){if(!e)return null;let t=function(s){return String(s).toLowerCase().replace(/[\s_./]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")},n=t(e);if(!n)return null;let r=Object.keys(this.models),i=/^gemini-([\d.]+)-(flash|pro|ultra|hydrogen)(-lite)?$/i.exec(String(e).trim()),o=!!(i&&i[3]);if(i&&!r.some(function(s){let u=t(s);return!u||n.indexOf(u)===-1?!1:o?/-lite$/.test(u):!/-lite$/.test(u)})){let s=i[1],u=i[2].toLowerCase(),l=!!i[3],c=u.charAt(0).toUpperCase()+u.slice(1)+(l?" Lite":""),f="gemini-"+s+"-"+u+(l?"-lite":""),d=u==="pro"?128e3:1048576;return this.models[f]={name:"Gemini "+s+" "+c,provider:"Google",contextLimit:d,description:"Gemini "+s+" "+c+" \u2014 \u0430\u0432\u0442\u043E-\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0441\u0435\u0442\u0435\u0432\u043E\u0433\u043E \u0441\u043B\u0430\u0433-\u0430 (\u043E\u043A\u043D\u043E "+d+")"},f}for(let s=0;s<r.length;s++)if(t(r[s])===n)return r[s];let a=r.map(function(s){return{k:s,n:t(s)}}).sort(function(s,u){return u.n.length-s.n.length});for(let s=0;s<a.length;s++)if(a[s].n&&n.indexOf(a[s].n)===0)return a[s].k;for(let s=0;s<a.length;s++)if(a[s].n&&n.indexOf(a[s].n)!==-1)return a[s].k;return null},calculatePercentage(e,t){if(t<=0)return 0;let n=e/t*100;return Math.min(100,Math.round(n*10)/10)},getGeminiApiModelId(e){var t=["gemini-3.5-flash-lite","gemini-3.5-flash","gemini-3-flash"];if(e&&t.indexOf(e)!==-1)return e;if(!e)return"gemini-flash-latest";var n={"gemini-auto":"gemini-flash-latest","gemini-2.5-pro":"gemini-2.5-pro","gemini-2.5-flash":"gemini-2.5-flash","gemini-search-default":"gemini-flash-latest","gemini-2.5-ultra":"gemini-2.5-ultra"};return n[e]?n[e]:/^[a-zA-Z0-9.-]+$/.test(e)&&e.indexOf("gemini")!==-1?e:"gemini-flash-latest"}};(function(){var e=["1.5","2.0","2.5","3.1","3.5","3.6","3.7"],t=["Flash","Pro","Ultra"],n=[""," Lite"," \u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F"," Extended"];function r(i,o){return i==="1.5"&&o==="Pro"?2097152:1048576}e.forEach(function(i){t.forEach(function(o){n.forEach(function(a){var s=i+" "+o+a;K.models[s]||(K.models[s]={name:"Gemini "+s,provider:"Google",contextLimit:r(i,o),description:"Gemini (\u0438\u043C\u044F \u0438\u0437 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0442\u0438, \u0430\u0432\u0442\u043E-\u043A\u043B\u044E\u0447)"})})})})})();(function(){["3.1 Pro","3.5 Pro","3.6 Pro","3.7 Pro"].forEach(function(e){var t=K.models[e];t&&(t.contextLimit=128e3)}),["3.6 Flash","3.5 Flash Lite"].forEach(function(e){var t=K.models[e];t&&t.contextLimit!==1048576&&(t.contextLimit=1048576)})})()});function Yl(e){if(typeof e!="string")return null;let t=e.trim().toLowerCase();return t?(t=t.replace(/^[a-z][a-z0-9+.-]*:\/\//,""),t=t.split("/")[0].split("?")[0].split(":")[0],km[t]||t||null):null}function Mm(e,t){if(typeof e!="string")return null;let n=e.trim().toLowerCase().replace(/[_\s]+/g,"-");if(!n)return null;if(Yl(t)==="gemini"){if(n==="plus"||n==="aiplus"||n==="google-ai-plus")return"ai-plus";if(n==="pro"||n==="aipro"||n==="advanced"||n==="google-ai-pro")return"ai-pro"}return n}function qr(e){return typeof e!="number"||!isFinite(e)||e<=0?0:Math.round(e)}function Im(e){return e.filter(function(t){return!!t}).join("; ")}function ec(e){let t=e||{},n=Yl(t.site),r=Mm(t.plan,n),i=typeof t.modelId=="string"&&t.modelId.trim()?t.modelId.trim():null,o=n&&Xl[n]?Xl[n]:null,a=o&&r&&o.plans&&o.plans[r]?o.plans[r]:null,s=o&&i&&o.models&&o.models[i]?o.models[i]:null,u=s&&typeof s.displayThreshold=="number"?qr(s.displayThreshold):null,l=u!==null?u:o?qr(o.displayThreshold):0;return{site:n,plan:r,modelWindow:s?qr(s.modelWindow):0,siteWindow:o?qr(o.modelWindow):0,accountLimit:a&&qr(a.accountLimit)||null,displayThreshold:l,found:{site:!!o,plan:!!a,model:!!s},hasPlans:!!(o&&o.plans&&Object.keys(o.plans).length>0),note:Im([o?o.note:void 0,a?a.note:void 0,s?s.note:void 0])}}var km,Xl,tc=fe(()=>{km={"chatgpt.com":"chatgpt","chat.openai.com":"chatgpt","gemini.google.com":"gemini","aistudio.google.com":"aistudio",aistudio:"aistudio","ai-studio":"aistudio",google_search:"google_search","google-search":"google_search",gsa:"google_search","chat.qwen.ai":"qwen","qwen.ai":"qwen","chat.deepseek.com":"deepseek","deepseek.com":"deepseek","claude.ai":"claude","www.perplexity.ai":"perplexity","perplexity.ai":"perplexity"},Xl={gemini:{modelWindow:1048576,displayThreshold:128e3,note:"Gemini web: API-\u043E\u043A\u043D\u043E 1 048 576; \u043E\u043A\u043D\u043E \u0432\u0435\u0431\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u0442\u0430\u0440\u0438\u0444\u0430",plans:{free:{accountLimit:32768,note:"Gemini web Free: 32K"},"ai-plus":{accountLimit:128e3,note:"Gemini web AI Plus: 128K"},"ai-pro":{accountLimit:1048576,note:"Gemini web AI Pro: 1M"},ultra:{accountLimit:1048576,note:"Gemini web Ultra: 1M"}},models:{"gemini-3.1-pro":{modelWindow:1048576,note:"API-\u043E\u043A\u043D\u043E 1M; \u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u0437\u0430\u0434\u0430\u0451\u0442 \u0442\u0430\u0440\u0438\u0444, \u0430 \u043D\u0435 \u043C\u043E\u0434\u0435\u043B\u044C"}}},google_search:{modelWindow:1048576,displayThreshold:128e3,note:"Google Search AI: \u043E\u043A\u043D\u043E \u043C\u043E\u0434\u0435\u043B\u0438-\u043F\u0440\u043E\u043A\u0441\u0438 1 048 576; \u043B\u0438\u043C\u0438\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F"},aistudio:{modelWindow:1048576,displayThreshold:128e3,note:"AI Studio: \u043E\u043A\u043D\u043E \u0438\u0437 API; \u043B\u0438\u043C\u0438\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F"},qwen:{displayThreshold:128e3,note:"Qwen: \u043E\u043A\u043D\u043E 1M \u0443 qwen3.7-plus/qwen3.8-max; \u0442\u0430\u0440\u0438\u0444\u043D\u044B\u0439 \u043B\u0438\u043C\u0438\u0442 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F",models:{"qwen3.7-plus":{modelWindow:1e6,displayThreshold:0,note:"\u043E\u043A\u043D\u043E 1M \u2014 \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043E\u0442 \u043E\u043A\u043D\u0430"},"qwen3.8-max":{modelWindow:1e6,displayThreshold:0,note:"\u043E\u043A\u043D\u043E 1M \u2014 \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043E\u0442 \u043E\u043A\u043D\u0430"}}},deepseek:{displayThreshold:128e3,note:"DeepSeek: \u043E\u043A\u043D\u0430 \u043F\u043E \u043C\u043E\u0434\u0435\u043B\u044F\u043C; \u0442\u0430\u0440\u0438\u0444\u043D\u044B\u0439 \u043B\u0438\u043C\u0438\u0442 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F",models:{"deepseek-v4-pro":{modelWindow:1e6,displayThreshold:0},"deepseek-flash":{modelWindow:1e6,displayThreshold:0},"deepseek-v4.1-flash":{modelWindow:1e6,displayThreshold:0},"deepseek-v3":{modelWindow:128e3},"deepseek-r1":{modelWindow:128e3}}},claude:{displayThreshold:128e3,note:"Claude: \u043E\u043A\u043D\u0430 \u043F\u043E \u043C\u043E\u0434\u0435\u043B\u044F\u043C; \u043B\u0438\u043C\u0438\u0442 \u0442\u0430\u0440\u0438\u0444\u0430 Free \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D",models:{"claude-sonnet-5-5":{displayThreshold:0},"claude-opus-5-5":{displayThreshold:0},"claude-fable-5-1":{displayThreshold:0},"claude-opus-5":{displayThreshold:0},"claude-opus-4-8":{displayThreshold:0},"claude-opus-4-7":{displayThreshold:0},"claude-sonnet-5":{displayThreshold:0},"claude-sonnet-4-6":{displayThreshold:0},"claude-opus-4-6":{displayThreshold:0},"claude-haiku-5-5":{displayThreshold:0}}},chatgpt:{displayThreshold:128e3,note:"ChatGPT web: \u043E\u043A\u043D\u043E \u043D\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E; \u0431\u0430\u043D\u043D\u0435\u0440 \xAB\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\xBB \u2014 runtime-\u0441\u0438\u0433\u043D\u0430\u043B"},perplexity:{displayThreshold:128e3,note:"Perplexity: \u043A\u0432\u043E\u0442\u0430 \u043F\u043E\u0438\u0441\u043A\u0430 \u043D\u0435 \u0440\u0430\u0432\u043D\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0443; \u043B\u0438\u043C\u0438\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u043D\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442\u0441\u044F"}}});function In(e){return typeof e!="number"||!isFinite(e)||e<=0?0:Math.round(e)}function ro(e,t){t&&e.indexOf(t)===-1&&e.push(t)}function io(e){let t=e||{},n=ec({site:t.site,plan:t.plan,modelId:t.modelId}),r=In(t.modelWindow),i=t.windowSource||"catalog",o=r>0&&i==="api"?r:0,a=r>0&&i!=="fallback"?r:0,s=In(n.modelWindow),u=In(n.siteWindow),l=0,c=null;o>0?(l=o,c="api"):s>0?(l=s,c="catalog"):a>0?(l=a,c=i):u>0&&(l=u,c="catalog");let f=In(t.accountLimit),d=t.accountSource||"api",h=f>0&&d!=="fallback"?f:0,m=n.found.plan?In(n.accountLimit):0,y=0,C=null;h>0?(y=h,C=d):m>0&&(y=m,C="catalog");let S=n.plan,b=S?t.planSource||"api":null,x=In(t.displayLimit),M=t.displaySource||"settings",k=In(t.fallbackLimit),A=x>0&&M==="settings"?x:0,G=x>0&&M==="api"?x:0,H=x>0&&M==="catalog"?x:0,N=x>0&&M==="fallback"?x:0,D=0,L=null;A>0?(D=A,L="settings"):G>0?(D=G,L="api"):l>0&&y>0?(D=Math.min(l,y),L=(y<=l?C:c)||"catalog"):n.displayThreshold>0?(D=l>0?Math.min(l,n.displayThreshold):n.displayThreshold,L="catalog"):H>0?(D=l>0?Math.min(l,H):H,L="catalog"):l>0?(D=l,L=c):N>0?(D=N,L="fallback"):k>0&&(D=k,L="fallback");let z=l>0,X=z?l:D,ee=[];c&&ro(ee,c),C&&ro(ee,C),L&&ro(ee,L),ee.length===0&&k>0&&ro(ee,"fallback");let J=[];return z||J.push("window-unknown"),L==="fallback"&&J.push("fallback-display"),n.hasPlans&&!S&&J.push("plan-unknown"),y||J.push("account-limit-unknown"),{modelId:typeof t.modelId=="string"&&t.modelId?t.modelId:void 0,modelWindow:X,windowKnown:z,displayLimit:D,accountLimit:y>0?y:null,plan:S,sources:ee,provenance:{modelWindow:c,displayLimit:L,accountLimit:C,plan:b},warnings:J,sourceNote:n.note||void 0}}var Ja=fe(()=>{tc()});function _m(e){return e=e.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,"$1"),e=e.replace(/(\*\*|__)/g,""),e=e.replace(/(?<![*\w])\*([^*\n]+)\*(?![\w*])/g,"$1"),e=e.replace(/(?<![\w_])\_([^_\n]+)\_(?![\w_])/g,"$1"),e=e.replace(/`/g,""),e}function Rm(e){var t=String(e??"");return t=t.replace(/^#{1,6}\s+/,""),t=t.replace(/^>\s?/,""),t=t.replace(/^[-*+]\s+/,""),t}function Lm(e){for(var t=String(e).split(`
`),n=[],r=0;r<t.length;r++){var i=t[r],o=i.trim();/^-{3,}$/.test(o)||n.push(_m(Rm(i)))}return n.join(`
`)}function nc(e){for(var t=Array.isArray(e)?e:[],n=[],r=0;r<t.length;r++){var i=t[r]||{};n.push(Lm(i.text==null?"":i.text))}return n.join(`

`)}var rc=fe(()=>{});function Vt(e){return typeof e=="string"?e.trim():""}function ic(e,t){if(!e||typeof e!="object")return null;let n=e,r=Vt(n.name);if(!r)return null;let i={name:r},o=Vt(n.mime);o&&(i.mime=o);let a=typeof n.content=="string"?n.content:"";a&&(i.content=a);let s=Vt(n.turnId)||t||"";return s&&(i.turnId=s),i}function Om(e,t){if(!e||typeof e!="object")return null;let n=e,r=Vt(n.title),i=Vt(n.url);if(!r&&!i)return null;let o={title:r||i};i&&(o.url=i);let a=Vt(n.snippet);a&&(o.snippet=a);let s=Vt(n.turnId)||t||"";return s&&(o.turnId=s),o}function Pm(e){let t={artifacts:[],sources:[]};if(!e||typeof e!="object")return t;let n=e,r=Vt(n.reasoning);r&&(t.reasoning=r);let i=Vt(n.turnId),o=ic(n.artifact,i);if(o&&t.artifacts.push(o),Array.isArray(n.artifacts))for(let a=0;a<n.artifacts.length;a++){let s=ic(n.artifacts[a],i);s&&t.artifacts.push(s)}if(Array.isArray(n.sources))for(let a=0;a<n.sources.length;a++){let s=Om(n.sources[a],i);s&&t.sources.push(s)}return t}function Dm(e){return e.name+"\0"+(e.mime||"")+"\0"+(e.content||"")+"\0"+(e.turnId||"")}function Fm(e){return e.title+"\0"+(e.url||"")+"\0"+(e.snippet||"")+"\0"+(e.turnId||"")}function oo(e){let t={artifacts:[],sources:[],reasoningCount:0},n={},r={},i=Array.isArray(e)?e:[];for(let o=0;o<i.length;o++){let a=Pm(i[o]);a.reasoning&&t.reasoningCount++;for(let s=0;s<a.artifacts.length;s++){let u=Dm(a.artifacts[s]);n[u]||(n[u]=!0,t.artifacts.push(a.artifacts[s]))}for(let s=0;s<a.sources.length;s++){let u=Fm(a.sources[s]);r[u]||(r[u]=!0,t.sources.push(a.sources[s]))}}return t}var oc=fe(()=>{});function _n(e,t,n){try{if(typeof chrome<"u"&&chrome.i18n&&typeof chrome.i18n.getMessage=="function"){var r=n?chrome.i18n.getMessage(e,n):chrome.i18n.getMessage(e);if(r)return r}}catch{}return t}function ac(e){if(!e||typeof e!="object")return"";var t=e.reasoning;return typeof t=="string"?t:""}function Za(e,t){var n=typeof e=="string"?e:"",r=typeof t=="string"?t:"";return!r||n.indexOf(r)!==-1?n:Nm+`
`+r+`

`+Bm+`
`+n}function Xa(e){return!e||typeof e!="object"?"":Za(e.text,ac(e))}function sc(e,t){var n=ac(e);return n||(t!==!0||!e||typeof e!="object"?"":typeof e.hiddenReasoning=="string"?e.hiddenReasoning:"")}function Ya(e,t){return Za(jr(e),sc(e,t))}function es(e){try{var t=String(e&&e.site||"").toLowerCase();return uc.indexOf(t)!==-1}catch{return!1}}function lc(e){return e==="user"?"USER:":"ASSISTANT:"}function cc(e){return e==="user"?"### USER":"### ASSISTANT"}function jr(e){return!e||typeof e!="object"?"":typeof e.text=="string"&&e.text?e.text:typeof e.content=="string"?e.content:typeof e.text=="string"?e.text:""}function ts(e){for(var t=Array.isArray(e)?e:[],n=[],r=0;r<t.length;r++)n.push(jr(t[r]));for(var i=[],o=0;o<t.length;o++){var a=n[o],s=0,u=0,l=0;if(a)for(var c=0;c<n.length;c++){var f=n[c];c===o||!f||f.length>=a.length||a.indexOf(f)!==-1&&(s++,u+=f.length,f.length>l&&(l=f.length))}var d=s>=fc&&u>=dc*a.length&&a.length>=2*l;d||i.push(t[o])}return i}function gc(e,t){if(!so())return!1;try{var n=Array.isArray(e)?e.length:-1,r=typeof t=="number"?t:n,i=Array.isArray(e)&&e.length>0?e[0]:null,o=jr(i),a="\u043D\u0435\u0442";i&&typeof i=="object"&&(typeof i.text=="string"?a="text":typeof i.content=="string"&&(a="content")),console.log(ns+" txt-roles site=qwen isArray="+Array.isArray(e)+" msgs="+r+" kept="+n+" dropped-containers="+(n>=0&&r>=n?r-n:0)+" first.role="+(i&&i.role!==void 0&&i.role!==null?String(i.role):"(\u043D\u0435\u0442)")+" first.kind="+a+" first.len="+o.length+" first.head="+(uo(o,60)||"\u043F\u0443\u0441\u0442\u043E"))}catch{}return!0}function pc(e){return nc(e)}function Gm(e){for(var t=Array.isArray(e)?e:[],n=[],r=0;r<t.length;r++){var i=t[r]||{},o=pc([{role:i.role,text:jr(i)}]);if(o===null)return null;String(o).trim()&&n.push(lc(i.role)+`
`+o)}return n.join(`

`)}function ao(e){return e.bodyProjection==="projected"}function Hm(e){var t=e.name+(e.mime?" ("+e.mime+")":"");return e.content?t+`
`+e.content:t}function qm(e){var t="### "+e.name+(e.mime?" ("+e.mime+")":"");return e.content?t+`

`+e.content:t}function jm(e){var t="- "+e.title;return e.url&&(t+=" \u2014 "+e.url),e.snippet&&(t+=" \u2014 "+e.snippet),t}function Wm(e){var t="- ";return t+=e.url?"["+e.title+"]("+e.url+")":e.title,e.snippet&&(t+=" \u2014 "+e.snippet),t}function Um(e){var t=[];return e.artifacts.length&&t.push(`[ARTIFACTS]
`+e.artifacts.map(Hm).join(`

`)),e.sources.length&&t.push(`[SOURCES]
`+e.sources.map(jm).join(`
`)),t.join(`

`)}function zm(e){var t=[];return e.artifacts.length&&t.push(`## ARTIFACTS

`+e.artifacts.map(qm).join(`

`)),e.sources.length&&t.push(`## SOURCES

`+e.sources.map(Wm).join(`
`)),t.join(`

`)}function Km(e){var t=e||{},n=typeof t.site=="string"?t.site:"",r=e&&Array.isArray(e.messages)?e.messages:[],i=es(e),o=i?ts(r):r,a=o.map(function(c){var f=i?Ya(c,!0):Xa(c);if(!c||typeof c!="object"||f===c.text)return c;var d={};for(var h in c)Object.prototype.hasOwnProperty.call(c,h)&&(d[h]=c[h]);return d.text=f,d}),s;i?(gc(a,r.length),s=Gm(a)):s=pc(a);var u="";n==="gemini"&&t.sourceTier&&(u=t.sourceTier+`

`),ao(t)&&(u+=`[AI-CM projection: applied]

`),u&&s&&(s=u+s);var l=Um(oo(Array.isArray(r)?r:[]));return s&&l&&(s=s+`

`+l),s===null?"":s}function $m(e){var t=e||{},n=[];return typeof t.windowLimit=="number"&&t.windowLimit>0&&n.push("model-window: "+t.windowLimit),typeof t.displayLimit=="number"&&t.displayLimit>0&&n.push("display-limit: "+t.displayLimit),t.accountLimit===null?n.push("account-limit: unknown"):typeof t.accountLimit=="number"&&t.accountLimit>0&&n.push("account-limit: "+t.accountLimit),typeof t.limitPlan=="string"&&t.limitPlan&&n.push("limit-plan: "+t.limitPlan),Array.isArray(t.limitWarnings)&&t.limitWarnings.length&&n.push("limit-warnings: "+t.limitWarnings.join(",")),n}function Vm(e){var t=e||{},n=typeof t.tokens=="number"?t.tokens:0,r=typeof t.limit=="number"?t.limit:0,i=typeof t.percent=="number"?t.percent:0;if(t.saturated===!0)i=100;else if(r>0){var o=Math.round(n/r*1e3)/10;o!==i&&(i=o)}return{tokens:n,limit:r,percent:i}}function Qm(e,t){var n=e||{},r=typeof n.site=="string"?n.site:"",i=[];i.push(_n("export_md_title","# AI Context Monitor \u2014 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438")),i.push(""),i.push(_n("export_md_platform","\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: "+(t||"AI Chat"),[t||"AI Chat"])),i.push(_n("export_md_model","\u041C\u043E\u0434\u0435\u043B\u044C: "+(n.model||"\u2014"),[n.model||"\u2014"]));var o=new Date().toISOString();i.push(_n("export_md_date","\u0414\u0430\u0442\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430: "+o,[o]));var a=Vm(n),s=a.tokens,u=a.limit,l=a.percent;s===0&&u===0?i.push("\u0422\u043E\u043A\u0435\u043D\u044B: \u043D/\u0434 ("+l+"%)"):i.push(_n("export_md_tokens","\u0422\u043E\u043A\u0435\u043D\u044B: "+s+" / "+u+" ("+l+"%)",[String(s),String(u),String(l)]));for(var c=$m(n),f=0;f<c.length;f++)i.push(c[f]);n.saturated===!0&&i.push("context-saturated: 1"),typeof n.src=="string"&&n.src&&(i.push("metric-src: "+n.src),ao(n)&&i.push("[AI-CM projection: applied]")),n.partial===!0&&(i.push("metric-partial: 1"),i.push("metric-partial-reason: "+(n.partialReason||"incomplete"))),i.push(""),ao(n)&&!(typeof n.src=="string"&&n.src)&&i.push("[AI-CM projection: applied]"),r==="gemini"&&n.sourceTier&&i.push(n.sourceTier,"");var d=es(n),h=Array.isArray(n.messages)?n.messages:[];d&&(h=ts(h));for(var m=0;m<h.length;m++){var y=h[m]||{};typeof aiCmDiagLine=="function"&&aiCmDiagLine("claude-role-builder",{msgRole:y.role,mdMarked:d});var C=d?cc(y.role):y.role==="user"||y.role==="human"?_n("export_md_role_user","## \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C"):_n("export_md_role_assistant","## \u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442");i.push(C),i.push(""),i.push(d?Ya(y,!0):Xa(y)),i.push("")}var S=h.length>0?zm(oo(h)):"";return S&&i.push(S),i.join(`
`)}function Jm(e){for(var t=Array.isArray(e)?e:[],n=!1,r=0;r<t.length;r++){var i=t[r];if(i&&typeof i=="object"&&(Object.prototype.hasOwnProperty.call(i,"sources")||Object.prototype.hasOwnProperty.call(i,"artifact")||Object.prototype.hasOwnProperty.call(i,"artifacts"))){n=!0;break}}if(!n)return t;for(var o=[],a=0;a<t.length;a++){var s=t[a];if(!s||typeof s!="object"){o.push(s);continue}var u=Object.assign({},s);delete u.sources,delete u.artifact,delete u.artifacts,o.push(u)}return o}function Zm(e,t){var n=e||{},r=oo(Array.isArray(n.messages)?n.messages:[]);return JSON.stringify({platform:t||"AI Chat",model:n.model||"",exportedAt:new Date().toISOString(),tokens:typeof n.tokens=="number"?n.tokens:0,limit:typeof n.limit=="number"?n.limit:0,percent:n.saturated===!0?100:typeof n.percent=="number"?n.percent:0,modelWindow:n.windowLimit,displayLimit:n.displayLimit,accountLimit:n.accountLimit,limitPlan:n.limitPlan,limitWarnings:Array.isArray(n.limitWarnings)&&n.limitWarnings.length?n.limitWarnings:void 0,saturated:n.saturated===!0?!0:void 0,src:n.src,sourceTier:n.sourceTier,partial:n.partial===!0?!0:void 0,partialReason:n.partial===!0?n.partialReason||"incomplete":void 0,bodyProjection:ao(n)?!0:void 0,dedupe:n.dedupe,messages:Jm(n.messages),artifacts:r.artifacts.length?r.artifacts:void 0,sources:r.sources.length?r.sources:void 0},null,2)}function so(){try{if(typeof sessionStorage<"u"&&sessionStorage&&sessionStorage.getItem("aiCmDebug")==="1")return!0}catch{}try{var e=globalThis;if(e&&e.__aiCmDebugLogs===!0)return!0}catch{}return!1}function uo(e,t){try{var n=typeof t=="number"&&t>0?t:100;if(e==null)return"";var r=String(e);if(!r)return"";var i=r.replace(/\s+/g," ").trim();return i?i.length>n?i.slice(0,n)+"\u2026":i:""}catch{return""}}function mc(){try{for(var e=String(new Error().stack||"").split(`
`),t=[],n=1;n<e.length&&t.length<4;n++){var r=String(e[n]||"").replace(/\s+/g," ").trim();!r||r.indexOf("diag")!==-1||t.push(r)}return t.join(" <- ")}catch{return""}}function hc(e,t,n,r){try{if(typeof Va=="function")return Va(e,t,n,r)}catch{}if(!so())return!1;try{var i=r||{},o="";try{o=String(typeof location<"u"&&location&&location.href||"")}catch{}console.log(ns+" download trigger="+(e||"(\u043D\u0435\u0442)")+" file="+(n==null||String(n)===""?"\u043F\u0443\u0441\u0442\u043E\u0435":String(n))+" bytes100="+(uo(t,100)||"\u043F\u0443\u0441\u0442\u043E")+" len="+(t==null?0:String(t).length)+" mime="+(i.mime===void 0?"(\u043D\u0435\u0442)":i.mime)+" url="+o+" threadId="+(i.threadId===void 0||i.threadId===""?"(\u043D\u0435\u0442)":i.threadId)+" site="+(i.site===void 0?"":i.site)+" reason="+(i.reason===void 0?"":i.reason)+" src="+mc())}catch{}return!0}function Ym(e){try{if(e==null)return!1;var t=String(e);return t.length<Xm?!1:t.charCodeAt(0)===41&&t.charCodeAt(1)===93&&t.charCodeAt(2)===125&&t.charCodeAt(3)===39}catch{return!1}}function yc(e,t){return Ym(e)?"xssi-prefix":t==null||String(t).trim()===""?"empty-name":null}function vc(e,t,n,r,i){try{if(typeof Qa=="function")return Qa(e,t,n,r,i)}catch{}if(!so())return!1;try{var o=i||{},a="";try{a=String(typeof location<"u"&&location&&location.href||"")}catch{}console.log(ns+" download-blocked reason="+(r||"(\u043D\u0435\u0442)")+" trigger="+(e||"(\u043D\u0435\u0442)")+" file="+(n==null||String(n)===""?"\u043F\u0443\u0441\u0442\u043E\u0435":String(n))+" bytes100="+(uo(t,100)||"\u043F\u0443\u0441\u0442\u043E")+" len="+(t==null?0:String(t).length)+" mime="+(o.mime===void 0?"(\u043D\u0435\u0442)":o.mime)+" url="+a+" threadId="+(o.threadId===void 0||o.threadId===""?"(\u043D\u0435\u0442)":o.threadId)+" site="+(o.site===void 0?"":o.site)+" src="+mc())}catch{}return!0}function eh(e,t,n,r,i){var o=i||{},a=yc(e,t);if(a){try{vc(r||"builder-download",e,t,a,{mime:n,threadId:o.threadId,site:o.site})}catch{}return!1}try{hc(r||"builder-download",e,t,{mime:n,threadId:o.threadId,site:o.site,reason:o.reason})}catch{}try{var s=new Blob([e],{type:n}),u=URL.createObjectURL(s),l=document.createElement("a");l.href=u,l.download=t,document.body.appendChild(l),l.click(),l.remove(),setTimeout(function(){URL.revokeObjectURL(u)},1e3)}catch(c){console.warn("[export] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0444\u0430\u0439\u043B:",c)}return!0}var Nm,Bm,uc,fc,dc,ns,Xm,th,Be,Cc=fe(()=>{rc();Mn();oc();Nm="[REASONING]",Bm="[ANSWER]";uc=["qwen"];fc=2,dc=.8;ns="[AI CM][diag]";Xm=4;th={buildTxtFromHistory:Km,buildMdFromHistory:Qm,buildJsonFromHistory:Zm,downloadBlob:eh,aiCmDownloadBlockReason:yc,aiCmDiagDownloadBlocked:vc,aiCmDiagOn:so,aiCmDiagHead:uo,aiCmDiagDownload:hc,aiCmMessageTextWithReasoning:Xa,aiCmWithReasoningSections:Za,aiCmReasoningOfMessageForExport:sc,aiCmMarkersMessageTextWithReasoning:Ya,aiCmTxtRoleMarker:lc,aiCmIsTxtRoleMarkerHistory:es,aiCmTxtRoleMarkerSites:uc,aiCmMdRoleMarker:cc,aiCmMessageTextForMarkers:jr,aiCmDropContainerMessages:ts,aiCmDiagTxtRoleStructure:gc,aiCmContainerRules:{minContained:fc,coverMin:dc}},Be=th});var _={};Bl(_,{Api:()=>Rf,BDS_BOM:()=>cf,BDS_CLOSE_TAG:()=>ss,BDS_INJECTION_FORMS:()=>Vr,BDS_OPEN_TAG:()=>yo,BDS_TRUNCATION_MARK:()=>lf,BDS_WRAPPER_ID:()=>Qr,CROSS_RAW_MIN_CHARS:()=>Xc,CROSS_RAW_MIN_LINES:()=>Zc,FIRED_SESSION_PREFIX:()=>Bc,HIDDEN_ANSWER_TAG:()=>Ef,HIDDEN_REASONING_TAG:()=>Tf,INTRA_CORE_MIN_LEN:()=>mo,REASONING_SECTION_PAIR_RE:()=>hf,RE_ANY_SPACE:()=>Wc,RE_CODE_FENCE_LINE:()=>jc,RE_LIST_MARK:()=>rs,RE_MARKER_RESIDUE_LINE:()=>qc,RE_RAW_HEADING_LINE:()=>Yr,RE_TOOL_CALL_BLOCK:()=>ls,SECTION_ANSWER_TAG:()=>hn,SECTION_REASONING_TAG:()=>Zn,TC_ENVELOPE_FORMS:()=>ws,TC_LFR_CLOSE:()=>Cs,TC_LFR_OPEN:()=>zr,TC_PROSE_ANCHOR:()=>Jr,TC_RESULTS_CLOSE:()=>xs,TC_RESULTS_OPEN:()=>Co,TC_TASK_CLOSE:()=>bs,TC_TASK_OPEN:()=>vo,TOOL_CALL_TAG_ALT:()=>wf,TOOL_CALL_TAG_NAMES:()=>xf,TOOL_RESULTS_CLOSE:()=>us,TOOL_RESULTS_OPEN:()=>Cf,TOOL_RESULTS_TAIL:()=>bf,VISIBLE_USER_PROMPT_END:()=>ho,VISIBLE_USER_PROMPT_START:()=>$r,VISIBLE_USER_PROMPT_VALUE:()=>uf,applyReasoningExportFields:()=>vf,bdsDiagLine:()=>Ur,bdsDiagSlice:()=>Rn,bdsFirstContentLine:()=>df,bdsFormOfHeadLine:()=>ff,bdsLastContentLine:()=>gf,bdsWrapperFormId:()=>oh,betterDeepSeekForms:()=>ih,blockLinePair:()=>Yc,buildAutoExportFileName:()=>xo,buildExportFileName:()=>Tc,buildGsaExportFileName:()=>Ec,convIdStamp:()=>wc,copyMessageWithText:()=>Jn,coreOfBlock:()=>lo,coreOfLine:()=>ds,corePrefixCutIndex:()=>Qc,coreText:()=>Ge,countMarker:()=>as,crossCopyIsSubstantial:()=>co,cutLeadingCopy:()=>Vc,cutPairHead:()=>ef,cutPairTail:()=>tf,deSpaceAny:()=>So,dedupeCrossRawCopies:()=>hs,dedupeIntraMessage:()=>ms,dedupeMessages:()=>ps,default:()=>sh,diagTag:()=>yf,disambiguateFileName:()=>cs,effectiveAutoExportThreshold:()=>Pc,effectiveReasoningToggle:()=>Mf,exportPad2:()=>Qt,extractConvIdFromUrl:()=>bc,firedSessionKey:()=>wo,getAutoExportFired:()=>Fc,hasAdjacentUserCopy:()=>Uc,hasHiddenFields:()=>ks,hasReasoningInSource:()=>kf,hiddenReasoningOf:()=>Ms,includeHiddenExportBlocks:()=>If,injectedUserTextSkipReason:()=>Eo,intraBlocksSimilar:()=>os,isBdsOpenTagLine:()=>fo,isEmptyExportText:()=>Sf,isFileNameTaken:()=>po,isFiredInSession:()=>Gc,isRawMarkdownBlock:()=>Kr,isToolResultsOnlyText:()=>bo,isWholeSourceDuplicate:()=>zc,latchKey:()=>Xn,manualExportStamp:()=>Sc,markAutoExportFired:()=>Dc,normExportFmt:()=>xc,normalizeExportMessages:()=>Xr,normalizeIntraBlock:()=>is,notCompleteReason:()=>Mc,pickCanonicalSource:()=>Zr,pickExportSource:()=>Ic,prepareExportMessages:()=>sf,renderedBeforeRaw:()=>Jc,resetAutoExportFired:()=>Nc,resolveAutoExportConvId:()=>kc,resolveExportSource:()=>_c,safeModelSeg:()=>Ac,safeSeg:()=>Wr,sanitizeBetterDeepSeekText:()=>vs,sanitizeEmitMessages:()=>Af,sanitizeInjectedUserText:()=>ys,sanitizeToolContinuationText:()=>Ss,sepForSections:()=>$c,separateRawBlocks:()=>Ao,seqEqual:()=>rf,seqIsPrefix:()=>of,seqIsSuffix:()=>af,sessionFiredPatch:()=>Hc,shouldSkipAutoExport:()=>Lc,shouldSkipBaseCompleteTrigger:()=>Oc,shouldSkipGsaPageGuard:()=>fs,sourceTierOf:()=>Rc,splitRawSections:()=>Kc,splitReasoningSections:()=>Ts,stripHiddenFields:()=>_s,stripMarkerResidue:()=>gs,stripReasoningSections:()=>As,stripToolCallBlocks:()=>Es,tcIsWholeMessagePair:()=>pf,tcPairAfter:()=>go,tcProseAnchorLine:()=>mf,toolContinuationForms:()=>ah,trimEdgeEmpty:()=>nf,trimPairEdges:()=>To,unionTurnsById:()=>_f,withoutHiddenFields:()=>Is});function Wr(e){return String(e??"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")}function bc(e){try{var t=String(e||""),n=t.match(/\/prompts\/(?!new(?:_chat)?(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);if(n)return n[1];var r=t.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);if(r)return r[1];var i=t.match(/\/a\/chat\/s\/([A-Za-z0-9_-]+)/);if(i)return i[1];var o=t.split("/"),a=o.indexOf("chat");if(a!==-1&&a+1<o.length&&o[a+1])return o[a+1];var s=t.match(/\/c\/([A-Za-z0-9_-]+)/);if(s)return s[1];var u=t.match(/\/session\/([0-9a-f-]{8,})/);if(u)return u[1];var l=t.match(/\/search\/([A-Za-z0-9_-]{8,})/);if(l)return l[1];var c=t.match(/\/thread\/([A-Za-z0-9_-]+)/);return c?c[1]:""}catch{return""}}function xc(e){return e==="md"?"md":e==="json"?"json":"txt"}function Qt(e){return(e<10?"0":"")+e}function wc(e){return e.getFullYear()+"-"+Qt(e.getMonth()+1)+"-"+Qt(e.getDate())+"_"+Qt(e.getHours())+"-"+Qt(e.getMinutes())}function Sc(e){return e.getFullYear()+"-"+Qt(e.getMonth()+1)+"-"+Qt(e.getDate())+"-"+Qt(e.getHours())+"-"+Qt(e.getMinutes())}function Ac(e){return String(e??"").replace(/[^a-zA-Z0-9_.-]+/g,"-").replace(/^-+|-+$/g,"")||"model"}function po(e,t){try{return!e||!t?!1:typeof Set<"u"&&e instanceof Set?e.has(t):Array.isArray(e)?e.indexOf(t)!==-1:typeof e=="object"?Object.prototype.hasOwnProperty.call(e,t):!1}catch{return!1}}function cs(e,t){var n=String(e??"");try{if(!po(t,n))return n;for(var r=n.match(/^(.*)\.([A-Za-z0-9]+)$/),i=r?r[1]:n,o=r?"."+r[2]:"",a=2;a<=999;a++){var s=i+"-"+a+o;if(!po(t,s))return s}return i+"-"+Date.now()+o}catch{return n}}function xo(e){var t=e||{},n=t.isLowConfidence===!0?"[LOW CONFIDENCE]_":"",r=new Date,i;if(t.mask==="manual"){var o=Wr(t.site)||"google_search";i="ai-context-monitor-"+o+"-"+Ac(t.model)+"-"+Sc(r)}else{var a=Wr(String(t.convId||"").slice(0,8))||"noconv",s=Wr(t.service)||"chat",u="";t.reason==="pre-trim"?u="-pretrim":t.reason==="base-complete"&&(u="-base-complete"),i=s+"-"+a+"-"+wc(r)+u}return cs(n+i+"."+xc(t.fmt),t.taken)}function Tc(e,t,n,r,i){return xo({mask:"convId",service:e,convId:t,reason:n,isLowConfidence:r,fmt:i,taken:arguments.length>5?arguments[5]:null})}function Ec(e,t,n,r){return xo({mask:"manual",site:e,model:t,isLowConfidence:n,fmt:r,taken:arguments.length>4?arguments[4]:null})}function kc(e,t,n){var r=String(t??"");return r||(String(e??"")==="google_search"?String(n??""):"")}function Mc(e){var t=e||{};return t.site==="google_search"&&t.probeRunning===!0?"probe-running":"not-complete"}function Ic(e,t){return e===!0?"network":"adapter"}function Zr(e,t,n,r){let i=typeof e=="number"&&e>0?e:0,o=typeof t=="number"&&t>0?t:0,a=typeof n=="number"&&n>0?n:0,s=typeof r=="number"&&r>0?r:0;return i===0||o>0&&i<o-2||s>0&&a<s?"net":"dom"}function _c(e){var t=e||{};if(t.isGemini!==!0)return{action:"local",reason:"non-gemini"};if(t.bridge!==!0)return{action:"local",reason:"no-bridge"};var n=typeof t.archiveCount=="number"&&t.archiveCount>0?t.archiveCount:0;if(n<=0)return{action:"local",reason:"no-archive"};var r=typeof t.liveCount=="number"?t.liveCount:null;if(r===0)return{action:"block",reason:"archive-only-base"};var i=typeof t.baseCount=="number"?t.baseCount:0,o=typeof t.localCount=="number"?t.localCount:0;return r!==null&&r>0&&i>o?{action:"union",reason:"stale-local-source"}:{action:"local",reason:"in-sync"}}function Rc(e){var t=e||{},n=typeof t.archiveCount=="number"&&t.archiveCount>0?t.archiveCount:0,r=typeof t.liveCount=="number"&&t.liveCount>0?t.liveCount:0;return n>0&&r>0?"[MERGED: ARCHIVE+LIVE]":n>0?"[ARCHIVE]":"[BEST-EFFORT: LIVE CAPTURE]"}function fs(e){var t=e||{};return t.site!=="google_search"?{skip:!1,reason:null}:t.chatPageMarker===!1?{skip:!0,reason:"not-chat-page"}:typeof t.msgCount=="number"&&t.msgCount<1?{skip:!0,reason:"no-messages"}:typeof t.baseTextLen=="number"&&t.baseTextLen<1?{skip:!0,reason:"empty-base"}:{skip:!1,reason:null}}function Lc(e){var t=e||{};if(t.enabled!==!0)return{skip:!0,reason:"not-enabled",resetFired:!1};if(typeof t.percentage!="number"||!(t.percentage>=0))return{skip:!0,reason:"no-pct",resetFired:!1};var n=fs(t);if(n.skip)return{skip:!0,reason:n.reason,resetFired:!1};var r=typeof t.threshold=="number"&&t.threshold>=1&&t.threshold<=100?t.threshold:90,i=t.domBaseTrusted===!0,o=t.gsaNetworkCompleteLatch===!0,a=t.baseComplete===!0||o,s=a||i,u=t.isGemini!==!0&&t.baseSeen!==!0&&!i&&!o;return!s&&!u?{skip:!0,reason:"not-complete",resetFired:!1}:t.historyIncomplete===!0?{skip:!0,reason:"not-complete",resetFired:!1}:t.isGemini===!0&&typeof t.archiveCount=="number"&&t.archiveCount>0&&typeof t.baseCount=="number"&&t.baseCount<=t.archiveCount?{skip:!0,reason:"archive-pending-live",resetFired:!1}:t.isGemini===!0&&t.loaderRunning?{skip:!0,reason:"loader-running",resetFired:!1}:t.percentage<r-10?t.isGemini===!0||t.baseSeen===!0?{skip:!0,reason:"below-threshold-hysteresis",resetFired:!0}:{skip:!0,reason:"below-threshold-unreliable",resetFired:!1}:t.percentage<r?{skip:!0,reason:"below-threshold",resetFired:!1}:!s&&u?{skip:!0,reason:"base-pending",resetFired:!1}:t.fired?{skip:!0,reason:"already-fired",resetFired:!1}:{skip:!1,reason:null,resetFired:!1}}function Oc(e){var t=e||{},n=typeof t.threshold=="number"&&t.threshold>=1&&t.threshold<=100?t.threshold:90;return typeof t.percentage!="number"||!(t.percentage>=0)?{skip:!0,reason:"no-pct",threshold:n}:t.percentage<n?{skip:!0,reason:"below-threshold-base-complete",threshold:n}:{skip:!1,reason:null,threshold:n}}function Pc(e,t){function n(o){var a=parseInt(o,10);return isNaN(a)?null:a<1?1:a>100?100:a}if(t!=null&&String(t).trim()!==""){var r=n(String(t));if(r!=null)return r}var i=typeof e=="number"&&e>=1&&e<=100?e:null;return i??90}function Xn(e,t){return Wr(e)+"|"+String(t||"")}function Dc(e,t,n){try{e[Xn(t,n)]=1}catch{}}function Fc(e,t,n){try{return e[Xn(t,n)]===1}catch{return!1}}function Nc(e,t,n){try{delete e[Xn(t,n)]}catch{}}function wo(e,t){return Bc+Xn(e,t)}function Gc(e,t,n){try{return!!e&&e[wo(t,n)]===1}catch{return!1}}function Hc(e,t){var n={};try{n[wo(e,t)]=1}catch{}return n}function Xr(e){var t=[];try{if(!Array.isArray(e))return t;for(var n=0;n<e.length;n++){var r=e[n]||{},i=typeof r.text=="string"?r.text:typeof r.content=="string"?r.content:"";if(i){var o={role:r.role==="user"||r.role==="human"?"user":"assistant",text:i};typeof aiCmDiagLine=="function"&&aiCmDiagLine("claude-role-normalize",{inputRole:r.role,outputRole:o.role}),typeof r.hiddenReasoning=="string"&&r.hiddenReasoning&&(o.hiddenReasoning=r.hiddenReasoning),Array.isArray(r.sources)&&(o.sources=r.sources),r.artifact&&typeof r.artifact=="object"&&(o.artifact=r.artifact),Array.isArray(r.artifacts)&&(o.artifacts=r.artifacts),typeof r.turnId=="string"&&r.turnId&&(o.turnId=r.turnId),t.push(o)}}}catch(a){swallow(a,"export-utils:normalizeExportMessages")}return t}function So(e){return String(e??"").replace(Wc," ")}function ds(e){try{var t=So(e);if(jc.test(t))return"";var n;do n=t,t=t.replace(/^[ \t]+/,""),/^>[ \t]?/.test(t)?t=t.replace(/^>[ \t]?/,""):rs.test(t)?t=t.replace(rs,""):Yr.test(t)&&(t=t.replace(/^#{1,}[ \t]*/,""));while(t!==n);return t.replace(/[*_`~#>]+/g," ").replace(/\s+/g," ").trim()}catch{return""}}function Ge(e){try{for(var t=So(e).split(`
`),n=[],r=0;r<t.length;r++){var i=ds(t[r]);i&&n.push(i)}return n.join(" ")}catch{return""}}function gs(e){try{var t=String(e??"");if(t.indexOf("#")===-1)return t;for(var n=t.split(`
`),r=[],i=!1,o=0;o<n.length;o++){if(qc.test(n[o])){i=!0;continue}r.push(n[o])}return i?r.join(`
`):t}catch{return String(e??"")}}function Uc(e){try{if(!Array.isArray(e))return!1;for(var t="",n="",r=0;r<e.length;r++){var i=e[r]||{},o=i.role==="user"?"user":"assistant",a=typeof i.text=="string"?i.text:"",s=Ge(a);if(o==="user"&&t==="user"&&s&&s===n)return!0;t=o,n=s}}catch(u){swallow(u,"export-utils:hasAdjacentUserCopy")}return!1}function zc(e){try{if(!Array.isArray(e))return!1;var t=e.length;if(t<2||t%2!==0)return!1;for(var n=t/2,r=0;r<n;r++){var i=e[r]||{},o=e[r+n]||{},a=i.role==="user"?"user":"assistant",s=o.role==="user"?"user":"assistant";if(a!==s)return!1;var u=typeof i.text=="string"?i.text:"",l=typeof o.text=="string"?o.text:"";if(Ge(u)!==Ge(l))return!1}return!0}catch(c){swallow(c,"export-utils:isWholeSourceDuplicate")}return!1}function ps(e){var t=[],n={},r=0;try{if(!Array.isArray(e))return{messages:t,removed:0};for(var i=0,o=0,a=0;a<e.length;a++){var s=e[a]||{};s.role==="user"?i++:o++}for(var u=i>o||Uc(e)||zc(e),l=0;l<e.length;l++){var c=e[l]||{},f=c.role==="user"?"user":"assistant",d=typeof c.text=="string"?c.text:"",h=f+"\0"+Ge(d);if(u&&Object.prototype.hasOwnProperty.call(n,h)){r++;continue}n[h]=!0;var m={role:f,text:d};c.id!=null&&(m.id=c.id),Array.isArray(c.sources)&&(m.sources=c.sources),c.artifact&&typeof c.artifact=="object"&&(m.artifact=c.artifact),Array.isArray(c.artifacts)&&(m.artifacts=c.artifacts),t.push(m)}}catch(y){swallow(y,"export-utils:dedupeMessages")}return{messages:t,removed:r}}function Kr(e){try{for(var t=String(e??"").split(`
`),n=0;n<t.length;n++)if(Yr.test(t[n]))return!0;return!1}catch{return!1}}function Ao(e){return String(e).replace(/([^#\n])[ \t]*(#{1,6})(?=[ \t])/g,function(t,n,r){return r.length<2&&!/[.!?;:»")\]]$/.test(n)?t:n+`

`+r})}function Kc(e){try{for(var t=String(e??"").split(`
`),n=[],r=null,i=0;i<t.length;i++)Yr.test(t[i])?(r&&n.push(r.join(`
`)),r=[t[i]]):r?r.push(t[i]):r=[t[i]];return r&&n.push(r.join(`
`)),n.length?n:[String(e??"")]}catch{return[String(e??"")]}}function $c(e){return/\n{2,}/.test(String(e??""))?`

`:`
`}function Vc(e,t){var n=String(e).split(`
`);if(n.length<2)return{text:String(e),trimmed:!1};var r=n[0],i=n.slice(1).join(`
`),o=is(i),a=is(t);if(!o||!a)return{text:String(e),trimmed:!1};if(o===a)return null;if(o.indexOf(a)===0){var s=o.slice(a.length).replace(/^\s+/,"");if(!s)return null;var u=a.split(" "),l=u[u.length-1],c=i.lastIndexOf(l);if(c<0)return null;var f=i.slice(c+l.length).replace(/^\s+/,"");return f?{text:r+`
`+f,trimmed:!0}:null}var d=Qc(i,Ge(t));if(d<0)return{text:String(e),trimmed:!1};var h=i.slice(d).replace(/^\s+/,"");return h?{text:r+`
`+h,trimmed:!0}:null}function Qc(e,t){try{if(!t||Ge(e).indexOf(t)!==0)return-1;for(var n=/(\S+)/g,r;(r=n.exec(e))!==null;){var i=r.index+r[0].length,o=Ge(e.slice(0,i));if(o===t)return i;if(o.length>t.length)return-1}return-1}catch{return-1}}function Jc(e,t,n){for(var r=t-1;r>=0;r--)if(!(r===t||n[r])&&Ge(e[r]))return String(e[r]);return null}function is(e){return String(e??"").replace(/\s+/g," ").trim()}function os(e,t){var n=Ge(e),r=Ge(t);if(!n||!r)return!1;if(n===r)return!0;var i=n.length<r.length?n.length:r.length;return i<mo?!1:n.length>=r.length?n.indexOf(r)!==-1:r.indexOf(n)!==-1}function ms(e){var t=e&&typeof e.text=="string"?e.text:"",n=0;try{let k=function(A,G,H){if(!A)return!1;if(c[A])return!0;if(A.length<H)return!1;for(var N=0;N<i.length;N++)if(!(N===G||u[N]||a[N]||!o[N])&&os(A,i[N]))return!0;return!1};if(!t)return{text:t,removedBlocks:0};var r=Ao(t),i=r.split(/\n{2,}/);if(i.length<2)return{text:t,removedBlocks:0};var o=[],a=[],s;for(s=0;s<i.length;s++)o.push(Ge(i[s])),a.push(Kr(i[s]));var u={},l=Object.create(null);for(s=0;s<i.length;s++)if(o[s]){if(l[o[s]]){u[s]=!0,n++;continue}l[o[s]]=!0}var c=Object.create(null),f=[];for(s=0;s<i.length;s++)f.push(lo(i[s])),!(u[s]||a[s]||!o[s])&&f[s]&&(c[f[s]]=!0);for(s=0;s<i.length;s++)if(!(u[s]||!a[s])){if(k(f[s],s,mo)){u[s]=!0,n++;continue}var d=Kc(i[s]),h=Jc(i,s,a);if(h!==null){for(var m=0,y=[],C=0;C<d.length;C++){if(k(lo(d[C]),s,0)){m++;continue}var S=Vc(d[C],h);if(S===null){m++;continue}S.trimmed&&m++,y.push(S.text)}if(m!==0){if(n+=m,y.length===0){u[s]=!0;continue}i[s]=y.join($c(i[s])).replace(/^\n+/,""),o[s]=Ge(i[s]),f[s]=lo(i[s]),a[s]=Kr(i[s])}}}for(s=0;s<i.length;s++)if(!(u[s]||!a[s])){var b=f[s];if(!(b.length<mo)){for(var x=s+1;x<i.length;x++)if(!(u[x]||a[x])&&os(b,i[x])){u[s]=!0,n++;break}}}if(n===0)return{text:t,removedBlocks:0};var M=[];for(s=0;s<i.length;s++)u[s]||M.push(i[s]);return{text:M.join(`

`),removedBlocks:n}}catch(k){swallow(k,"export-utils:dedupeIntraMessage")}return{text:t,removedBlocks:0}}function lo(e){try{for(var t=String(e??"").split(`
`),n=[],r=0;r<t.length;r++)Yr.test(t[r])||n.push(t[r]);return Ge(n.join(`
`))}catch{return Ge(e)}}function Yc(e){for(var t=So(e).split(`
`),n=[],r=0;r<t.length;r++)n.push(ds(t[r]));return To(t,n)}function To(e,t){for(var n=0,r=e.length;n<r&&!t[n];)n++;for(;r>n&&!t[r-1];)r--;return{raw:e.slice(n,r),core:t.slice(n,r)}}function ef(e,t){return To(e.raw.slice(t),e.core.slice(t))}function tf(e,t){var n=e.raw.length-t;return To(e.raw.slice(0,n),e.core.slice(0,n))}function nf(e){for(var t=e.slice();t.length&&!t[0];)t.shift();for(;t.length&&!t[t.length-1];)t.pop();return t}function rf(e,t){if(e.length!==t.length)return!1;for(var n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function of(e,t){if(!e.length||e.length>=t.length)return!1;for(var n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function af(e,t){if(!e.length||e.length>=t.length)return!1;for(var n=t.length-e.length,r=0;r<e.length;r++)if(e[r]!==t[n+r])return!1;return!0}function co(e){for(var t=nf(e),n=0,r=0,i=0;i<t.length;i++)t[i]&&(n++,r+=t[i].length);return n>=Zc&&r>=Xc}function hs(e){var t=[],n=0,r=[];try{for(var i=Array.isArray(e)?e:[],o=0;o<i.length;o++){var a=i[o]||{},s=typeof a.text=="string"?a.text:"";if(!s){t.push(a);continue}for(var u=Ao(s).split(/\n{2,}/),l=[],c=!1,f=0;f<u.length;f++){if(!Kr(u[f])){l.push(u[f]);continue}for(var d=Yc(u[f]),h=d.raw.join(`
`),m=!1,y=!0;y&&!m;){y=!1;for(var C=0;C<r.length;C++){var S=r[C];if(rf(S,d.core)){if(!co(S))continue;m=!0,n++;break}if(af(S,d.core)&&co(S)){d=tf(d,S.length),y=!0;break}if(of(S,d.core)&&co(S)){d=ef(d,S.length),y=!0;break}}!m&&!d.raw.length&&(m=!0,n++)}if(m||!d.raw.length){c=!0;continue}var b=d.raw.join(`
`);b!==h&&(c=!0),l.push(b),Kr(b)&&r.push(d.core)}var x={role:a.role==="user"?"user":"assistant",text:c?l.join(`

`):s};a.id!=null&&(x.id=a.id),Array.isArray(a.sources)&&(x.sources=a.sources),a.artifact&&typeof a.artifact=="object"&&(x.artifact=a.artifact),Array.isArray(a.artifacts)&&(x.artifacts=a.artifacts),t.push(x)}}catch{return{messages:Array.isArray(e)?e:[],removed:0}}return{messages:t,removed:n}}function nh(e){for(var t=Array.isArray(e)?e:[],n=[],r=0,i=0;i<t.length;i++){var o=t[i];if(!o||typeof o!="object"){n.push(o);continue}n.push(o);var a=t[i+1];if(!(!a||typeof a!="object")&&!(o.role!=="user"||a.role!=="user")&&!(a.artifact||Array.isArray(a.artifacts)&&a.artifacts.length||a.reasoning||Array.isArray(a.sources)&&a.sources.length)){var s=typeof o.text=="string"?o.text:"",u=s.indexOf(`

[FILE: `);if(u<0&&(u=s.indexOf(`
[FILE: `)),!(u<=0)){var l=s.slice(0,u).replace(/\s+$/,"");if(l){var c=typeof a.text=="string"?a.text:"";c.trim()===l.trim()&&(i++,r++)}}}}return{messages:n,removed:r}}function sf(e,t,n){var r=n||{},i=0,o=[];try{for(var a=Array.isArray(e)?e:[],s=0;s<a.length;s++){var u=a[s]||{},l=u.role==="user"?"user":"assistant",c=typeof u.text=="string"?u.text:"",f=ms({role:l,text:c}),d={role:l,text:f.text};if(u.id!=null&&(d.id=u.id),Array.isArray(u.sources)&&(d.sources=u.sources),u.artifact&&typeof u.artifact=="object"&&(d.artifact=u.artifact),Array.isArray(u.artifacts)&&(d.artifacts=u.artifacts),o.push(d),f.removedBlocks>0&&(i+=f.removedBlocks,typeof t=="function"))try{t(l,f.removedBlocks)}catch{}}}catch{o=Array.isArray(e)?e:[],i=0}for(var h=ps(o),m=r.collapseFileUserDuplicates===!0?nh(h.messages):{messages:h.messages,removed:0},y=hs(m.messages),C=[],S=0;S<y.messages.length;S++){var b=y.messages[S]||{},x={role:b.role==="user"?"user":"assistant",text:gs(typeof b.text=="string"?b.text:"")};b.id!=null&&(x.id=b.id),Array.isArray(b.sources)&&(x.sources=b.sources),b.artifact&&typeof b.artifact=="object"&&(x.artifact=b.artifact),Array.isArray(b.artifacts)&&(x.artifacts=b.artifacts),C.push(x)}return{messages:C,intraRemoved:i,removed:h.removed+m.removed+y.removed,crossRemoved:y.removed}}function as(e,t){for(var n=0,r=e.indexOf(t);r!==-1;)n++,r=e.indexOf(t,r+t.length);return n}function Eo(e){var t=typeof e=="string"?e:String(e??""),n=as(t,$r),r=as(t,ho);return n===0&&r===0?t.indexOf(uf)!==-1?"value-only":"no-markers":n===1&&r===1?t.indexOf(ho)<t.indexOf($r)?"unpaired-markers":null:n>1||r>1?"multiple-pairs":"unpaired-markers"}function ys(e){var t=typeof e=="string"?e:String(e??"");if(Eo(t)!==null)return t;var n=t.indexOf($r)+$r.length,r=t.indexOf(ho,n);return t.slice(n,r).trim()}function Ur(e,t){try{return typeof aiCmDiagLine!="function"?!1:aiCmDiagLine(e,t)!==!1}catch{return!1}}function Rn(e,t,n){try{var r=typeof e=="string"?e:String(e??"");return JSON.stringify(t===0?r.slice(0,n):r.slice(Math.max(0,r.length-n)))}catch{return'""'}}function fo(e,t){return e===yo?!0:t===0&&e===cf+yo}function ff(e){for(var t=typeof e=="string"?e:"",n=0;n<Vr.length;n++){var r=Vr[n];if(r.match==="prefix"){if(t.slice(0,r.head.length)===r.head)return r}else if(t===r.head)return r}return null}function df(e){for(var t=0;t<e.length;t++)if(String(e[t]).trim()!=="")return t;return-1}function gf(e){for(var t=e.length-1;t>=0;t--)if(String(e[t]).trim()!=="")return t;return-1}function vs(e){var t=typeof e=="string"?e:String(e??"");if(t.indexOf(yo)===-1)return{text:t,removed:0,forms:[]};for(var n=t.split(`
`),r={},i=[],o=typeof aiCmDiagLine=="function"?[]:null,a=df(n),s=gf(n),u=0;u<n.length;u++)if(fo(n[u],u)){var l=u+1<n.length?ff(n[u+1]):null;if(l){for(var c=-1,f=u+2;f<n.length&&!fo(n[f],f);f++)if(n[f]===ss||n[f]===lf){c=f;break}if(c===-1){o&&o.push({k:u,first:a,pair:-1,last:s,form:l.id,skip:"no-boundary"});continue}o&&o.push({k:u,first:a,pair:c,last:s,form:l.id,skip:"(\u043D\u0435\u0442)"});for(var d=u;d<=c;d++)r[d]=!0;i.push(l.id),u=c;continue}for(var h=-1,m=u+1;m<n.length&&!fo(n[m],m);m++)if(n[m]===ss){h=m;break}if(h===-1){o&&o.push({k:u,first:a,pair:-1,last:s,form:"(\u043D\u0435\u0442)",skip:"unpaired-tag"});continue}o&&o.push({k:u,first:a,pair:h,last:s,form:Qr,skip:"(\u043D\u0435\u0442)"}),r[u]=!0,r[h]=!0,i.push(Qr),u=h}var y=i.length;if(o)for(var C=0;C<o.length;C++)Ur("o40-bds-line",{k:o[C].k,firstLine:o[C].first,pair:o[C].pair,lastLine:o[C].last,form:o[C].form,skip:o[C].skip,removed:y});if(!i.length)return{text:t,removed:0,forms:[]};for(var S=[],b=0;b<n.length;b++)r[b]||S.push(n[b]);return{text:S.join(`
`),removed:i.length,forms:i}}function go(e,t,n,r){for(var i=Math.max(0,t);i<e.length;i++)if(e[i]===n){for(var o=i+1;o<e.length;o++)if(e[o]===r)return{open:i,close:o};return null}return null}function pf(e,t){var n;for(n=0;n<t.open;n++)if(String(e[n]).trim()!=="")return!1;for(n=t.close+1;n<e.length;n++)if(String(e[n]).trim()!=="")return!1;return!0}function mf(e){for(var t=0;t<e.length;t++)if(String(e[t]).slice(0,Jr.length)===Jr)return t;return-1}function Ss(e){var t=typeof e=="string"?e:String(e??"");if(t.indexOf(zr)===-1&&t.indexOf(vo)===-1&&t.indexOf(Co)===-1&&t.indexOf(Jr)===-1)return{text:t,removed:0,forms:[]};var n=t.split(`
`),r={},i=[],o=mf(n);if(o!==-1){for(var a=o,s=o+1;s<n.length&&String(n[s]).trim()!=="";s++)a=s;var u=a,l=a+1,c=go(n,l,vo,bs);c&&(u=c.close,l=c.close+1);var f=go(n,l,Co,xs);f&&(u=f.close);for(var d=o;d<=u;d++)r[d]=!0;i.push("tc-prose-continuation"),c&&i.push("tc-original-task"),f&&i.push("tc-tool-results")}for(var h=0;h<n.length;h++)if(!(r[h]||n[h]!==zr)){var m=go(n,h,zr,Cs);if(m){if(!pf(n,m)){h=m.close;continue}for(var y=m.open;y<=m.close;y++)r[y]=!0;i.push("tc-local-file-read"),h=m.close}}if(!i.length)return{text:t,removed:0,forms:[]};for(var C=[],S=0;S<n.length;S++)r[S]||C.push(n[S]);return{text:C.join(`
`),removed:i.length,forms:i}}function As(e){var t=typeof e=="string"?e:String(e??"");if(t.indexOf(Zn)===-1||t.indexOf(hn)===-1)return t;for(var n="",r=0,i=!1;r<t.length;){var o=t.indexOf(hn,r);if(o===-1){n+=t.slice(r);break}var a=o>0?t.lastIndexOf(Zn,o-1):-1;if(a===-1||a<r){n+=t.slice(r,o+hn.length),r=o+hn.length;continue}n+=t.slice(r,a),r=o+hn.length,t.charAt(r)==="\r"&&t.charAt(r+1)===`
`?r+=2:t.charAt(r)===`
`&&(r+=1),i=!0}return i?n:t}function yf(e,t){try{return typeof aiCmDiagLine!="function"?!1:aiCmDiagLine(e,t)!==!1}catch{return!1}}function Ts(e){var t=typeof e=="string"?e:String(e??""),n=hf.exec(t);if(n)return{reasoning:n[1].replace(/\s+$/,""),answer:n[2]};var r=t.indexOf(Zn),i=t.indexOf(hn);return r!==-1&&i!==-1&&yf("reasoning-marker-in-prose",{len:t.length,r,a:i}),{reasoning:"",answer:t}}function vf(e,t){var n=0;try{if(t!==!0||!Array.isArray(e))return{changed:0};for(var r=0;r<e.length;r++){var i=e[r];if(!(!i||typeof i!="object")){var o=typeof i.text=="string"?i.text:"",a=typeof i.reasoning=="string"?i.reasoning:"",s=typeof i.hiddenReasoning=="string"?i.hiddenReasoning:"";if(a||(a=s),!a&&o&&i.role!=="user"){var u=Ts(o);u&&u.reasoning&&(a=u.reasoning,o=u.answer)}if(a&&!(!s&&o===i.text)){var l={};for(var c in i)Object.prototype.hasOwnProperty.call(i,c)&&(l[c]=i[c]);l.text=o,l.reasoning=a,l.hiddenReasoning&&delete l.hiddenReasoning,e[r]=l,n++}}}}catch{return{changed:n}}return{changed:n}}function bo(e){try{var t=typeof e=="string"?e:String(e??""),n=t.trim();if(n.indexOf(Cf)!==0)return!1;var r=n.indexOf(us);if(r===-1)return!1;var i=n.slice(r+us.length).trim();return i===bf&&(i=""),i===""}catch{return!1}}function Es(e){var t=typeof e=="string"?e:String(e??"");if(t.indexOf("<")===-1)return t;ls.lastIndex=0;var n=t.replace(ls,"");return n===t?t:n.replace(/\s+$/,"")}function Sf(e){try{return String(e??"").trim()===""}catch{return!1}}function rh(e){try{if(!e||typeof e!="object"||e.role!=="assistant")return!1;var t=typeof e.reasoning=="string"?e.reasoning:"";return t.trim()!==""}catch{return!1}}function Jn(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(n[r]=e[r]);return n.text=t,n}function Af(e){var t=[],n=0,r=[],i=0,o=0,a=[],s=0,u=[];try{for(var l=Array.isArray(e)?e:[],c=0;c<l.length;c++){var f=_s(l[c]);if(!f||typeof f!="object"){Ur("o40-emit-msg",{i:c,len:0,head:Rn("",0,40),tail:Rn("",1,40),called:0,removed:0}),t.push(f);continue}var d=typeof f.text=="string"?f.text:"";if(typeof aiCmDiagOn=="function"&&aiCmDiagOn()&&f.role==="user"&&bo(d)&&Ur("o40-emit-msg",{i:c,len:d.length,head:Rn(d,0,40),tail:Rn(d,1,40),called:0,removed:0}),f.role==="user"&&bo(d)){i++;continue}var h=As(d);h!==d&&(f=Jn(f,h));var m=typeof f.text=="string"?f.text:"",y=vs(m);if(Ur("o40-emit-msg",{i:c,len:m.length,head:Rn(m,0,40),tail:Rn(m,1,40),called:1,removed:y.removed}),y.removed>0){f=Jn(f,y.text),o+=y.removed;for(var C=0;C<y.forms.length;C++)a.push(y.forms[C])}var S=Ss(typeof f.text=="string"?f.text:"");if(S.removed>0){f=Jn(f,S.text),s+=S.removed;for(var b=0;b<S.forms.length;b++)u.push(S.forms[b])}if(f.role!=="user"){var x=Es(typeof f.text=="string"?f.text:"");x!==f.text&&(f=Jn(f,x))}else{var M=typeof f.text=="string"?f.text:"",k=Eo(M);k!==null?r.push(k):(f=Jn(f,ys(M)),n++)}if(Sf(typeof f.text=="string"?f.text:"")&&!rh(f)){i++;continue}t.push(f)}}catch{return{messages:Array.isArray(e)?e:[],sanitized:0,skipped:[],dropped:0,bdsRemoved:0,bdsForms:[],tcRemoved:0,tcForms:[]}}return{messages:t,sanitized:n,skipped:r,dropped:i,bdsRemoved:o,bdsForms:a,tcRemoved:s,tcForms:u}}function ks(e){try{return!e||typeof e!="object"?!1:Object.prototype.hasOwnProperty.call(e,"hiddenReasoning")||Object.prototype.hasOwnProperty.call(e,"hiddenInjection")}catch{return!1}}function Ms(e){try{var t=e&&typeof e.hiddenReasoning=="string"?e.hiddenReasoning:"";return t.trim()}catch{return""}}function Is(e){var t={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(n==="hiddenReasoning"||n==="hiddenInjection"||(t[n]=e[n]));return t}function _s(e){return!e||typeof e!="object"?e:ks(e)?Is(e):e}function kf(e){for(var t=Array.isArray(e)?e:[],n=0;n<t.length;n++){var r=t[n];if(!(!r||typeof r!="object")){var i=typeof r.reasoning=="string"?r.reasoning:"";if(i.trim()!=="")return!0;var o=typeof r.text=="string"?r.text:"";if(o.indexOf(Zn)!==-1)return!0}}return!1}function Mf(e,t,n){return e===!0?!0:n==="qwen"||n==="deepseek"?!1:t===!0}function If(e){for(var t=Array.isArray(e)?e:[],n=[],r=0;r<t.length;r++){var i=t[r];if(!i||typeof i!="object"||!ks(i)){n.push(i);continue}var o=Is(i),a=Ms(i),s=typeof o.text=="string"?o.text:"";a&&s.indexOf(a)===-1&&(o.text=Tf+`
`+a+`

`+Ef+`
`+s),n.push(o)}return n}function _f(e,t){var n={},r=[],i,o;for(i=0;e&&i<e.length;i++)o=e[i],!(!o||o.id==null||n[o.id])&&(n[o.id]=!0,r.push(o));for(i=0;t&&i<t.length;i++)o=t[i],!(!o||o.id==null||n[o.id])&&(n[o.id]=!0,r.push(o));return r}var Bc,Yr,qc,jc,rs,Wc,mo,Zc,Xc,$r,ho,uf,yo,ss,lf,cf,Vr,Qr,zr,Cs,vo,bs,Co,xs,Jr,ws,Zn,hn,hf,Cf,us,bf,xf,wf,ls,Tf,Ef,ih,oh,ah,Rf,sh,Lf=fe(()=>{"use strict";Bc="aiCmFired:";Yr=/^[\s>*+\-\d.)\]]*#{1,}(?=\s|$)/,qc=/^[\s>*+\-\d.)\]]*#{1,}[\s]*$/,jc=/^[\s>*+\-\d.)\]]*(`{3,}|~{3,})/,rs=/^(?:[-*+]|\d+[.)])[ \t]+/,Wc=/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g;mo=20;Zc=2,Xc=80;$r="<!-- deepseek-pp-visible-user-prompt:start -->",ho="<!-- deepseek-pp-visible-user-prompt:end -->",uf="<!-- deepseek-pp-visible-user-prompt:value=";yo="<BetterDeepSeek>",ss="</BetterDeepSeek>",lf="...[truncated]",cf="\uFEFF";Vr=[{id:"bds-deep-code-prompt",match:"exact",head:"[DEEP_CODE_MODE_ACTIVE]",basis:"artifact 1-257 (message), 999-1191 / 1223-1415 (span in <original_task>)"},{id:"bds-tool-system-prompt",match:"exact",head:"You are Better DeepSeek. You have access to specialized tools.",basis:"artifact 259-947 (message)"},{id:"bds-system-datetime",match:"prefix",head:"User's System Date & Time: ",basis:"artifact 980-982 (message; line 981)"}],Qr="bds-prompt-wrapper";zr="<local_file_read>",Cs="</local_file_read>",vo="<original_task>",bs="</original_task>",Co="<tool_results>",xs="</tool_results>",Jr="These are the tool results just executed for the tool-continuation task.",ws=[{id:"tc-local-file-read",rule:"pair",open:zr,close:Cs,boundary:"\u043E\u0442 \u0441\u0442\u0440\u043E\u043A\u0438 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0435\u0433\u043E \u0442\u0435\u0433\u0430 \u0434\u043E \u0441\u0442\u0440\u043E\u043A\u0438 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0435\u0433\u043E; \u0441\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u043F\u0430\u0440\u0430 \u2014 \u0446\u0435\u043B\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 (\u0441\u043F\u0430\u043D \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u2014 \u0431\u0430\u0439\u0442\u043E\u0432\u043E: \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F \u0441\u043F\u0430\u043D\u0430 \u0432 \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u0435 \u043D\u0435\u0442)",scope:"tool-request",basis:"artifact 10-19 msg 1/3/9/11/13 lines 1-3 (whole message, role=assistant)"},{id:"tc-prose-continuation",rule:"run",openPrefix:Jr,boundary:"\u043E\u0442 \u0441\u0442\u0440\u043E\u043A\u0438-\u044F\u043A\u043E\u0440\u044F \u0434\u043E \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438 \u043F\u0440\u043E\u0437\u044B (\u043F\u0435\u0440\u0435\u0434 \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439)",scope:"envelope",basis:"artifact 10-19 msg 2/4/7/8/10/12/14 lines 1-9"},{id:"tc-original-task",rule:"pair",open:vo,close:bs,boundary:"\u043E\u0442 <original_task> \u0434\u043E </original_task>; \u043F\u0443\u0441\u0442\u0430\u044F \u043F\u0430\u0440\u0430 11-12 \u2014 \u0442\u0430 \u0436\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u0430",scope:"envelope",basis:"artifact 10-19 msg 2/4 lines 11-12 (empty), msg 7/8/10/12/14 lines 11-17"},{id:"tc-tool-results",rule:"pair",open:Co,close:xs,boundary:"\u043E\u0442 <tool_results> \u0434\u043E </tool_results>; \u0432 \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u0435 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0438\u0439 \u0442\u0435\u0433 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F (7/7)",scope:"envelope",basis:"artifact 10-19 msg 2/4 lines 14-26 / 14-35, msg 7/8/10/12/14 lines 19-66"}];Zn="[REASONING]",hn="[ANSWER]";hf=/^\s*\[REASONING\]\r?\n([\s\S]*?)\r?\n\r?\n\[ANSWER\]\r?\n([\s\S]*)$/;Cf="[TOOL_RESULTS]",us="[/TOOL_RESULTS]",bf="Continue answering based on the tool results above.";xf=["browser_navigate","browser_go_back","browser_go_forward","browser_refresh","browser_list_tabs","browser_select_tab","browser_close_tab","browser_snapshot","browser_click","browser_hover","browser_fill","browser_fill_form","browser_key","browser_type","browser_attach_file","browser_wait_for","browser_handle_dialog","browser_evaluate_script","memory_save","memory_update","memory_delete","web_search","web_fetch"],wf="(?:"+xf.join("|")+"|shell_\\w+|python_\\w+|skill_\\w+)",ls=new RegExp("<("+wf+")(?:\\s[^>]*)?>[\\s\\S]*?<\\/\\1\\s*>\\s*","g");Tf=Zn,Ef=hn;ih=Vr,oh=Qr,ah=ws,Rf={buildAutoExportFileName:xo,disambiguateFileName:cs,isFileNameTaken:po,buildExportFileName:Tc,buildGsaExportFileName:Ec,resolveAutoExportConvId:kc,notCompleteReason:Mc,shouldSkipGsaPageGuard:fs,shouldSkipAutoExport:Lc,shouldSkipBaseCompleteTrigger:Oc,effectiveAutoExportThreshold:Pc,pickExportSource:Ic,pickCanonicalSource:Zr,resolveExportSource:_c,sourceTierOf:Rc,markAutoExportFired:Dc,getAutoExportFired:Fc,resetAutoExportFired:Nc,firedSessionKey:wo,isFiredInSession:Gc,sessionFiredPatch:Hc,extractConvIdFromUrl:bc,normalizeExportMessages:Xr,coreText:Ge,stripMarkerResidue:gs,dedupeMessages:ps,dedupeIntraMessage:ms,dedupeCrossRawCopies:hs,separateRawBlocks:Ao,prepareExportMessages:sf,sanitizeInjectedUserText:ys,injectedUserTextSkipReason:Eo,sanitizeEmitMessages:Af,sanitizeBetterDeepSeekText:vs,betterDeepSeekForms:Vr,bdsWrapperFormId:Qr,sanitizeToolContinuationText:Ss,toolContinuationForms:ws,stripReasoningSections:As,splitReasoningSections:Ts,applyReasoningExportFields:vf,isToolResultsOnlyText:bo,stripToolCallBlocks:Es,includeHiddenExportBlocks:If,stripHiddenFields:_s,hiddenReasoningOf:Ms,hasReasoningInSource:kf,effectiveReasoningToggle:Mf,unionTurnsById:_f,latchKey:Xn},sh=Rf});function Ps(e,t){try{console.log("[AI CM][batchexecute] segment parse fail "+t+": "+(e&&e.message||e))}catch{}}function ch(e){return typeof e!="string"?e:e.replace(lh," ").replace(/[ \t\f\v]+/g," ")}function ei(e){return typeof e!="string"?e:e.replace(/\$AXzLiR[A-Za-z0-9+\/=\s]+/g," ").replace(/File attachment was not previously registered/g,"").replace(/\[cite:\s*\d+\]/g,"")}function Ff(e){return typeof e=="string"&&/^(c_|r_|rc_|fbb[0-9a-f]|[0-9a-f]{16})/.test(e)}function fh(e){return typeof e=="string"&&/\.(pdf|png|jpe?g|gif|docx?|txt|webp|csv|xlsx?)(\b|$)/i.test(e)}function ko(e){return typeof e=="string"&&/^https?:\/\//i.test(e)}function Nf(e){return typeof e=="string"&&/^\$?AVuib/.test(e)}function Bf(e){return typeof e=="string"&&/^(image|application|video|audio)\//i.test(e)}function Rs(e){if(typeof e!="string")return!0;var t=e.trim();return t.length===0||Gf[t]?!0:Ff(t)||fh(t)||ko(t)||Nf(t)||Bf(t)}function dh(e){if(typeof e!="string")return!0;var t=e.trim();return!t||Gf[t]?!0:Ff(t)||ko(t)||Nf(t)||Bf(t)}function Ds(e){for(var t=0;t<e.length;t++){var n=e.charCodeAt(t);if(n>=1024&&n<=1279)return!0}return!1}function Hf(e){if(typeof e!="string")return!1;var t=e.trim();return!t||Ds(t)?!1:!!(gh.test(t)||ph.test(t)||mh.test(t)||hh.test(t))}function vh(e){if(typeof e!="string")return!1;var t=e.trim();return t?!!(Ds(t)||/```/.test(t)||/^\s*\|.+\|\s*$/m.test(t)):!1}function Fs(e,t,n){if(n=n||{inThinking:!1},typeof e=="string"){var r=ei(e),i=r.trim();if(!i||yh.test(i)||Rs(i))return;if(n.inThinking){if(!vh(i))return;n.inThinking=!1,t.push(r);return}if(Hf(i)){n.inThinking=!0;return}t.push(r);return}if(Array.isArray(e))for(var o=0;o<e.length;o++)Fs(e[o],t,n)}function Ch(e){var t="";try{t=e[2][0][0]}catch{t=""}if(typeof t=="string"){var n=ei(t).trim();if(n&&!dh(n)&&!Hf(n))return n}return""}function xh(e){return/\.(?:md|pdf|txt|json)$/i.test(e)||/-20\d\d-/.test(e)}function wh(e){var t=null;return(function n(r){if(!t){if(typeof r=="string"){var i=r.trim();if(i.length<60&&i.indexOf(`
`)<0&&!xh(i)&&bh.test(i)){t=i;return}}else if(Array.isArray(r)){for(var o=0;o<r.length;o++)if(n(r[o]),t)return}}})(e),t||""}function Sh(e){var t=null;return(function n(r){if(!t){if(typeof r=="string"&&/^r_[0-9a-f]+$/.test(r)){t=r;return}else if(Array.isArray(r)){for(var i=0;i<r.length;i++)if(n(r[i]),t)return}}})(e),t}function Ah(e){try{if(Array.isArray(e)&&Array.isArray(e[1])&&typeof e[1][1]=="string")return e[1][1]}catch{}return null}function Th(e){try{if(Array.isArray(e)&&Array.isArray(e[4])&&typeof e[4][0]=="number"&&e[4][0]>1e9)return e[4][0]}catch{}return 0}function qf(e){try{if(!Array.isArray(e))return null;var t=typeof e[2]=="string"?e[2].trim():"";if(!t)return null;var n=typeof e[11]=="string"?e[11]:"",r=typeof e[1]=="number"?e[1]:0,i=typeof e[5]=="string"?e[5]:"",o=typeof e[3]=="string"?e[3]:"",a=e?e[15]:null,s=Array.isArray(a)&&typeof a[2]=="number"&&isFinite(a[2])&&a[2]>0?a[2]:0,u="",l=[];return(function c(f){if(typeof f=="string")f&&l.push(f),!u&&f.indexOf("contribution.usercontent.google.com/download")!==-1&&(u=f);else if(Array.isArray(f))for(var d=0;d<f.length;d++)c(f[d])})(e[7]),{name:t,mime:n,type:r,token:i,size:s,img:o,dl:u,urls:l,isImage:r===1||/^image\//i.test(n)}}catch{return null}}function Ns(e){var t=[];try{var n=e[2][0][4][0][4];if(!Array.isArray(n))return t;for(var r=0;r<n.length;r++){var i=qf(n[r]);i&&(i.pos=r,t.push(i))}}catch{}return t}function Yn(e){return typeof e=="number"&&isFinite(e)&&e>0?e:0}function er(e){return typeof e=="number"&&isFinite(e)&&e>=0?e:-1}function jf(e,t){var n=typeof e=="string"?e:"",r=Mo[n];return!r&&t&&(r={turns:{},seq:0},Mo[n]=r),r||null}function Of(e){return e&&typeof e.name=="string"?e.name:""}function Bs(e,t){for(var n=Math.min(e.length,t.length),r=0;r<n&&Of(e[r])===Of(t[r]);)r++;return r}function Pf(e,t){var n=Yn(e.ts),r=Yn(t.ts);if(n>0&&r>0&&n!==r)return n<r;if(n>0&&r===0)return!0;if(n===0&&r>0)return!1;var i=Array.isArray(e.refs)?e.refs:null,o=Array.isArray(t.refs)?t.refs:null;if(i&&o&&i.length!==o.length){var a=Bs(i,o);if(a===Math.min(i.length,o.length))return i.length<o.length}var s=typeof e.turnId=="string"?e.turnId:"",u=typeof t.turnId=="string"?t.turnId:"";if(s&&u&&s!==u)return s<u;var l=er(e.order),c=er(t.order);return l>=0&&c>=0&&l!==c?l<c:e.seq<t.seq}function Ls(e){var t=e&&typeof e.name=="string"?e.name:"",n=e&&typeof e.size=="number"&&isFinite(e.size)?e.size:0;return t+"|"+n}function Eh(e,t,n,r,i){var o=typeof n=="string"?n:"";if(!o)return 0;var a=Ns(e),s=jf(t,!0);if(!s)return 0;if(!a.length)return s&&s.turns[o]&&delete s.turns[o],0;var u=Yn(r),l=er(i),c=s.turns[o];return c?(c.refs=a,u>0&&(c.ts=u),l>=0&&(c.order=l),a.length):(s.seq++,s.turns[o]={turnId:o,ts:u,order:l,seq:s.seq,refs:a},a.length)}function kh(e,t,n){var r=Object.keys(e.turns),i=null,o=0,a;for(a=0;a<r.length;a++)if(r[a]!==t.turnId){var s=e.turns[r[a]];!s||!Array.isArray(s.refs)||Pf(s,t)&&(!i||Pf(i,s))&&(i=s,o=s.refs.length)}var u=null,l=0;for(a=0;a<r.length;a++)if(r[a]!==t.turnId){var c=e.turns[r[a]];if(!(!c||!Array.isArray(c.refs))){var f=c.refs.length;!f||f>=n.length||Bs(c.refs,n)===f&&(!u||f>l)&&(u=c,l=f)}}return u&&(!i||l>o)?u:i}function Wf(e,t){var n=Bs(e,t);if(n===e.length||n===t.length)return t.slice(n);var r={},i;for(i=0;i<e.length;i++){var o=Ls(e[i]);r[o]=(r[o]||0)+1}var a=[];for(i=0;i<t.length;i++){var s=Ls(t[i]);if(r[s]>0){r[s]--;continue}a.push(t[i])}return a}function Mh(e){for(var t=Array.isArray(e)?e:[],n=[],r=[],i=0;i<t.length;i++){var o=t[i];if(o){var a=Array.isArray(o.refs)?o.refs:[],s=[];a.length&&(s=r.length?Wf(r,a):a.slice(0),r=a),n.push({id:o.id,own:s})}}return n}function Ih(e,t,n,r,i){var o=Ns(e),a=typeof n=="string"?n:"";if(!a)return o;if(!o.length)return[];var s=jf(t,!0);if(!s)return o;var u=s.turns[a];u||(s.seq++,u={turnId:a,ts:Yn(r),order:er(i),seq:s.seq,refs:o},s.turns[a]=u),u.refs=o,Yn(r)>0&&(u.ts=Yn(r)),er(i)>=0&&(u.order=er(i));var l=kh(s,u,o);return l?Wf(l.refs||[],o):o}function _h(e){if(e==null||e===""){Mo={};return}delete Mo[typeof e=="string"?e:String(e)]}function Uf(e){if(typeof e!="string")return!1;var t=e.trim();return!t||Ds(t)?!1:Rh.test(t)}function zf(e){for(var t=0;t<e.length;t++){var n=e.charCodeAt(t);if(n>=1024&&n<=1279)return t}return-1}function Kf(e){if(typeof e!="string")return e;var t=e.trim();if(!Lh.test(t))return e;var n=zf(t);return n<0?"":t.slice(n)}function Oh(e){return typeof e!="string"?!1:!!(/\*\*[^*\n]+\*\*/.test(e)||/^\s*#{1,6}\s/m.test(e)||/^\s*\|.+\|\s*$/m.test(e)||/```/.test(e)||/^\s*[-*+]\s/m.test(e)||/^\s*>\s/m.test(e)||/\[[^\]]+\]\([^)]+\)/.test(e)||/^\s*(---+|\*\*\*+|___+)\s*$/m.test(e))}function Ph(e){if(!e||!e.length)return"";for(var t=0;t<e.length;t++)if(Oh(e[t]))return e[t];return e[0]}function Dh(e){var t=[],n=!1;try{var r=Array.isArray(e[3])&&Array.isArray(e[3][0])&&Array.isArray(e[3][0][0])?e[3][0][0][1]:null;if(Array.isArray(r))for(var i=0;i<r.length;i++)t.push(r[i]);else typeof r=="string"&&t.push(r)}catch{}if(!t.length){n=!0;try{Fs(e[3],t)}catch(s){v(s,"gemini-utils:extractCanonicalAnswer-fallback")}}var o=[];for(i=0;i<t.length;i++)if(typeof t[i]=="string"){var a=ei(t[i]).trim();a&&o.push(a)}return{text:Ph(o),isFallback:n}}function Os(e,t,n,r){try{if(typeof e=="string"){e.length>=n&&t.push(e);return}if(Array.isArray(e)&&r<40)for(var i=0;i<e.length;i++)Os(e[i],t,n,r+1)}catch(o){v(o,"gemini-utils:collectDrStrings")}}function Df(e){return ei(e).trim()}function $f(e){var t={planText:"",reportText:""};try{if(!Array.isArray(e))return t;for(var n=[],r=0;r<e.length;r++)Os(e[r],n,Fh,0);for(var i="",o=0;o<n.length;o++){var a=n[o];ko(a)||Rs(a)||(!i||a.length>i.length)&&(i=a)}i&&(t.reportText=Df(i));for(var s=[],u=0;u<e.length;u++)Os(e[u],s,Nh,0);for(var l="",c=0;c<s.length;c++){var f=s[c];ko(f)||Rs(f)||t.reportText&&f===t.reportText||f.indexOf("deep_research_confirmation_content")===-1&&f.indexOf("immersive_entry_chip")===-1&&(t.reportText&&f.length>=t.reportText.length||(!l||f.length>l.length)&&(l=f))}l&&(t.planText=Df(l))}catch(d){v(d,"gemini-utils:extractDrTexts")}return t}function Bh(e){try{Gs=e||{planText:"",reportText:""}}catch{}}function Vf(e,t){try{if(typeof e!="string")return e;var n=e;return t&&t.reportText&&n.indexOf("immersive_entry_chip/0")!==-1&&(n=n.replace(/https?:\/\/googleusercontent\.com\/immersive_entry_chip\/0/gi,t.reportText)),t&&t.planText&&n.indexOf("deep_research_confirmation_content/0")!==-1&&(n=n.replace(/https?:\/\/googleusercontent\.com\/deep_research_confirmation_content\/0/gi,t.planText)),n}catch{return e}}function Qf(e){var t=Ch(e),n=Dh(e),r=n.text.replace(/\n{3,}/g,`

`).trim(),i=[];if(t&&i.push({role:"user",text:t}),r){var o=Vf(r,Gs);if(n.isFallback){if(!Uf(o)){var a=Kf(o);a&&i.push({role:"assistant",text:a})}}else i.push({role:"assistant",text:o})}return i}function Jf(e,t){try{if(!Array.isArray(e)||!Array.isArray(e[0])||e[0][1]!=="hNvQHb")return;var n=e[0][2];if(typeof n!="string")return;var r=JSON.parse(n);if(!Array.isArray(r))return;var i=Array.isArray(r[0])&&Array.isArray(r[0][0])?r[0]:r;try{Gs=$f(i)}catch{}for(var o=i.length,a=o-1;a>=0;a--){var s=i[a];if(Array.isArray(s))for(var u=wh(s),l=Sh(s)||"idx"+a,c=Th(s),f=Ah(s),d=Qf(s),h=0;h<d.length;h++){var m=d[h].role==="user"?"user":"assistant";t.push({role:m,content:d[h].text,model:u||"",id:l+"_"+m,ts:c,r1:f})}}}catch(y){Ps(y,"handleOuter")}}function Gh(e,t){var n;try{n=new TextEncoder().encode(e)}catch{return}var r=0;n.length>=4&&n[0]===41&&n[1]===93&&n[2]===125&&n[3]===39&&(r=4);for(var i=new TextDecoder("utf-8"),o=0;r<n.length&&o++<200;){for(;r<n.length&&(n[r]<48||n[r]>57);)r++;if(r>=n.length)break;for(var a=0;r<n.length&&n[r]>=48&&n[r]<=57;)a=a*10+(n[r]-48),r++;if(a<=0){r++;continue}r<n.length&&n[r]===10&&r++;var s=r+a;s>n.length&&(s=n.length);var u=i.decode(n.subarray(r,s));if(r=s,r<n.length&&n[r]===10&&r++,u.indexOf("hNvQHb")!==-1)try{Jf(JSON.parse(u),t)}catch(l){Ps(l,"parseByBytes")}}}function Hh(e,t){for(var n=e.split(`
`),r=0;r<n.length;r++){var i=n[r];if(!(!i||i===")]}'")){var o=i.charAt(0);if(!(o!=="["&&o!=="{")&&i.indexOf("hNvQHb")!==-1)try{Jf(JSON.parse(i),t)}catch(a){Ps(a,"parseByLines")}}}}function qh(e){var t=[];Gh(e,t),t.length||Hh(e,t);for(var n="",r=0;r<t.length;r++)if(t[r].model){n=t[r].model;break}for(var i=0,o=[],a=[],s=0;s<t.length;s++){var u=t[s].content||"";i+=u.length,o.push({role:t[s].role,text:u,model:t[s].model||"",id:t[s].id,ts:t[s].ts||0,r1:t[s].r1||null}),a.push(u)}return{messages:o,model:n||"Gemini 2.5 Pro",tokens:Math.ceil(i/4),text:a.join(`
`),count:o.length}}var uh,lh,Gf,gh,ph,mh,hh,yh,bh,Mo,Rh,Lh,Fh,Nh,Gs,jh,Zf=fe(()=>{Mn();uh="g3";lh=/\$AXzLiR[A-Za-z0-9+\/=]+/g;Gf={DE:1,ru:1,mk:1,generic:1,personal_context:1,google:1,"\u0418\u0449\u0443 \u0432 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0435":1,"\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442":1,"Google Search":1,true:1,false:1};gh=/^\s*\*\*[^*\n]{1,120}\*\*/,ph=/^(I'm now|I've been|I am going|I'm currently|I'm focusing|I'm working|I will now|I've fleshed|I've got|I need to|I'm going to|I've shifted|My focus is|I've settled|I've outlined|I've started|I'm aiming|My approach is|I'm leaning|I'm choosing|I'm prioritizing)\b/i,mh=/^(I'm (?:currently|now|also|still) (?:focused|zeroing|analyzing|integrating|identifying|assessing|refining|evaluating|structuring|addressing|considering|formulating|prioritizing|parsing)|I've (?:been|now) (?:analyzing|noted|shifted|outlined|fleshed)|My (?:focus|goal) is|Specifically, I've)\b/i,hh=/^(Assessing|Defining|Refining|Outlining|Constructing|Uncovering|Tracing|Confirming|Reassuring|Clarifying|Deepening|Integrating|Evaluating|Formulating|Focusing|Prioritizing|Solidifying|Exploring|Analyzing|Reviewing|Validating|Synthesizing|Considering|Identifying|Structuring|Addressing|Reconstructing)\b/,yh=/File attachment was not previously registered/;bh=/^\s*(?:Gemini\s+(?:\d+(?:\.\d+)*\s+)?|\d+(?:\.\d+)*\s+)(?:Flash|Pro|Ultra)(?:\s+(?:Lite|Расширенн[а-яё]*|Extended))?\s*$/i;Mo={};Rh=/^([A-Z][a-z]+ing\b|I'm\b|I've\b|My (?:focus|goal)\b|sr |Ev )/,Lh=/^\s*\*?\*?([A-Z][a-z]+ing\b|I'm|I've|My (focus|goal)|sr |Ev )/;Fh=1e3,Nh=60;Gs={planText:"",reportText:""};jh={PARSER_VERSION:uh,stripAttachmentTokens:ch,sanitizeGeminiText:ei,collectTurnText:Fs,isThinkingAssistant:Uf,firstCyrillicIndex:zf,stripLeadingThinking:Kf,splitTurnMessages:Qf,extractDrTexts:$f,injectDrLinks:Vf,__setDrTexts:Bh,fileRefFromNode:qf,fileRefIdentityKey:Ls,collectTurnFiles:Ns,registerTurnFileOwner:Eh,collectTurnFilesForOwner:Ih,assignPoolOwners:Mh,__resetFileOwners:_h,parseGeminiHistory:qh};typeof window<"u"&&(window.GeminiBatchexecuteParser=jh)});var Cd={};Bl(Cd,{answerDomNodes:()=>Ws,answerTextOf:()=>ti,bodiesPrefixCompatible:()=>ri,canonicalAnswerBody:()=>Fo,canonicalTurnKeyOf:()=>Ft,canonicalizeTurnForThread:()=>gd,classifyFolwrContinuation:()=>vd,countTurnContainers:()=>ud,dedupeTurns:()=>yd,extractContinuationToken:()=>ld,extractTurnsFromDocument:()=>Us,fillMissingUserText:()=>hd,isCodeBlockElement:()=>nr,isHistoryCursor:()=>cd,mergeTurnsById:()=>Qs,mergeTurnsByKey:()=>md,mergeTurnsMonotone:()=>pd,normalizeTurnKeyPart:()=>Jt,orderTurnsByDom:()=>zs,parseGoogleFolwrOpen:()=>sd,renderCodeBlock:()=>Lo,resolveUserQuestionForTurn:()=>Ks,stripGsaAssistantEcho:()=>dd,stripGsaUserEcho:()=>fd,turnIdentityParts:()=>ut});function _o(e){if(!e)return"";var t=String(e);return t=t.replace(new RegExp("&quot;","g"),'"'),t=t.replace(new RegExp("&amp;","g"),"&"),t=t.replace(new RegExp("&#39;","g"),"'"),t=t.replace(new RegExp("&lt;","g"),"<"),t=t.replace(new RegExp("&gt;","g"),">"),t=t.replace(new RegExp("&nbsp;","g")," "),t=t.replace(/&#(\d+);/g,function(n,r){try{return String.fromCharCode(parseInt(r,10))}catch{return n}}),t}function rd(e,t){var n=String(e??""),r="",i=0,o;for(Xf.lastIndex=0;(o=Xf.exec(n))!==null;)r+=t(n.slice(i,o.index))+o[0],i=o.index+o[0].length;return r+t(n.slice(i))}function Wh(e){return String(e).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ")}function qs(e){return e?rd(e,Wh).replace(/^\s+/,"").replace(/\s+$/,""):""}function Uh(e){return String(e).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/[ \t\f\v]+/g," ").split(`
`).map(function(t){return t.trim()}).join(`
`).replace(/\n{3,}/g,`

`)}function zh(e){return e?rd(e,Uh).replace(/^\s+/,"").replace(/\s+$/,""):""}function Kh(e){var t=e.cloneNode(!0);return t.querySelectorAll("script, style, button, svg").forEach(function(n){n.remove()}),qs(_o(t.innerHTML)).trim()}function id(e){for(var t=e.querySelectorAll("tr"),n=[],r=0;r<t.length;r++){for(var i=t[r].querySelectorAll("th, td"),o=[],a=0;a<i.length;a++)o.push(Kh(i[a]));o.length!==0&&n.push("| "+o.join(" | ")+" |")}return n.join(`
`)}function $h(e){return e.tagName==="H2"&&!!e.className&&String(e.className).indexOf("iMqumd")!==-1}function Ro(e){try{return String(e&&e.className||"")}catch{return""}}function od(e){if(!e||!e.tagName)return!1;var t=String(e.tagName).toUpperCase();return t==="PRE"||t==="CODE"||/code-?block/i.test(Ro(e))}function Hs(e){if(!e||typeof e.cloneNode!="function")return"";var t;try{t=e.cloneNode(!0)}catch{return""}try{for(var n=t.querySelectorAll("script, style, button, svg"),r=0;r<n.length;r++)n[r].parentNode&&n[r].parentNode.removeChild(n[r]);for(var i=t.querySelectorAll("br"),o=t.ownerDocument||(typeof document<"u"?document:null),a=0;a<i.length;a++)i[a].parentNode&&o&&o.createTextNode&&i[a].parentNode.replaceChild(o.createTextNode(`
`),i[a])}catch{}var s="";try{s=String(t.textContent||"")}catch{s=""}if(s.indexOf(`
`)===-1&&t.children&&t.children.length>1){for(var u=!0,l=0;l<t.children.length;l++)if(!/^(DIV|P|LI|TR|SECTION|ARTICLE|FIGURE|BLOCKQUOTE|H[1-6])$/.test(String(t.children[l].tagName||"").toUpperCase())){u=!1;break}if(u){for(var c=[],f=0;f<t.children.length;f++)c.push(String(t.children[f].textContent||""));var d=c.join(`
`);d.replace(/\s+/g,"")&&(s=d)}}return s.replace(/[ \t]+$/gm,"").replace(/^\n+/,"").replace(/\s+$/,"")}function Vh(e){try{var t=e.querySelectorAll?e.querySelectorAll("pre, code"):null;if(t&&t.length)return t[t.length-1]}catch{}return e}function Yf(e,t){if(t!=null&&Io.test(String(t).trim()))return String(t).trim();var n=["code-lang","data-lang","data-code-lang"];try{for(var r=0;r<n.length;r++){var i=e&&e.getAttribute?e.getAttribute(n[r]):null;if(i&&Io.test(String(i).trim()))return String(i).trim()}}catch{}var o=Ro(e).match(/(?:^|[\s_-])(?:language|lang)[-_]([A-Za-z][A-Za-z0-9+#._-]{0,19})/);if(o&&Io.test(o[1]))return o[1];for(var a=e,s=0;a&&s<4;s++){for(var u=a.previousSibling,l=0;u&&l<3;l++){var c="";try{c=String(u.textContent||"").trim()}catch{c=""}if(c){if(Io.test(c))return c;break}u=u.previousSibling}a=a.parentNode}return""}function nr(e){if(!e||!e.tagName)return!1;var t=String(e.tagName).toUpperCase();return/code-?block/i.test(Ro(e))||t==="PRE"?!0:t!=="CODE"?!1:/(?:^|[\s_-])(?:language|lang)[-_]/.test(Ro(e))?!0:Hs(e).indexOf(`
`)!==-1}function Lo(e,t){if(!e)return"";var n=Vh(e),r=Hs(n);if(r||(r=Hs(e)),!r)return"";for(var i=Yf(e,t)||Yf(n,t),o="```";r.indexOf(o)!==-1;)o+="`";return o+i+`
`+r+`
`+o}function ti(e){if(!e)return"";if(nr(e))return Lo(e);if(typeof e.cloneNode!="function")return"";var t;try{t=e.cloneNode(!0)}catch{return""}try{for(var n=t.querySelectorAll("script, style, button, svg"),r=0;r<n.length;r++)n[r].parentNode&&n[r].parentNode.removeChild(n[r]);for(var i=t.querySelectorAll?t.querySelectorAll(js):[],o=[],a=0;a<i.length;a++)if(nr(i[a])){for(var s=!1,u=0;u<o.length;u++)if(o[u].contains&&o[u].contains(i[a])){s=!0;break}s||o.push(i[a])}for(var l=t.ownerDocument||(typeof document<"u"?document:null),c=o.length-1;c>=0;c--){var f=Lo(o[c]);!f||!o[c].parentNode||!l||!l.createTextNode||o[c].parentNode.replaceChild(l.createTextNode(`
`+f+`
`),o[c])}}catch{}var d="";try{d=String(t.textContent||"")}catch{d=""}return d.trim()}function Ws(e){var t=e||(typeof document<"u"?document:null);if(!t||typeof t.querySelectorAll!="function")return[];for(var n=t.querySelectorAll(".n6owBd.awi2gc, "+js),r=[],i=0;i<n.length;i++){var o=n[i];if(!(od(o)&&!nr(o))){for(var a=!1,s=0;s<r.length;s++)if(r[s].contains&&r[s].contains(o)){a=!0;break}a||r.push(o)}}return r}function ad(e){try{return(e.textContent||"").trim()}catch{return""}}function Zh(e){return Qh.test(ad(e))}function Xh(e){return Jh.test(ad(e))}function Yh(e){var t=e.cloneNode(!0);t.querySelectorAll("script, style, button, svg").forEach(function(o){o.remove()});var n=null,r=t.querySelector("strong, b");r&&(n=(r.textContent||"").replace(/\s+/g," ").trim(),r.remove());var i=qs(_o(t.innerHTML)).trim();return n?"- **"+n+"**"+(i?": "+i:""):i?"- "+i:""}function ey(e){for(var t=e.querySelectorAll("li"),n=[],r=0;r<t.length;r++){var i=Yh(t[r]);i&&n.push(i)}return n.join(`
`)}function ty(e){for(var t=e.querySelectorAll('.n6owBd.awi2gc, table, [role="heading"], h2, h3, h4, ul, ol, li, [role="list"], [role="listitem"], '+js),n=[],r=0;r<t.length;r++){var i=t[r];if(!$h(i)&&!(od(i)&&!nr(i))){for(var o=!1,a=0;a<n.length;a++)if(n[a].contains&&n[a].contains(i)){o=!0;break}o||n.push(i)}}return n}function ny(e,t){for(var n=[],r=[],i=0;i<e.length;i++)n[i]=[],r[i]=!1;for(var o=0;o<t.length;o++){for(var a=t[o],s=-1,u=0;u<e.length&&e[u].compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING;u++)s=u;if(!(s<0)&&!Xh(a)){if(Zh(a)){r[s]=!0;continue}if(!r[s]){var l=null;if(a.tagName==="TABLE"){var c=id(a);c&&(l=c)}else if(a.tagName==="UL"||a.tagName==="OL"){var f=ey(a);f&&(l=f)}else{var d=ti(a).trim();d&&(l=d)}l&&n[s].push(l)}}}return n}function ed(e){try{var t=e.querySelector("[data-session-thread-id]");if(t){var n=t.getAttribute("data-session-thread-id");return n?n.trim():""}}catch{}return""}function sd(e){var t=[],n=[];if(!e||typeof e!="string")return{threadId:"",turns:t,messages:n,text:"",count:0};var r;try{r=new DOMParser().parseFromString(e,"text/html")}catch{return{threadId:"",turns:t,messages:n,text:"",count:0}}var i=ed(r),o=r.querySelectorAll('[data-scope-id="turn"]'),a=r.querySelectorAll('[data-subtree="aimfl"]'),s=Array.prototype.slice.call(o),u=[];try{for(var l=/<!--TgQPHd\|[\s\S]*?-->/g,c;(c=l.exec(e))!==null;){for(var f=_o(c[0]),d=/"([^"]{20,})"/g,h,m=null;(h=d.exec(f))!==null;){var y=h[1];if(y.indexOf("\\u0026")===-1&&y.indexOf("OLOoOd")===-1&&y.indexOf("dRog6c")===-1&&y.indexOf("TgQPHd")===-1&&!(!/[а-яёА-ЯЁ]/.test(y)&&y.indexOf(" ")===-1)){m=y;break}}u.push(m)}}catch(Le){swallowSoft(Le,"gsa-utils:parseGoogleFolwrOpen-tgqphd")}for(var C=ty(r),S=ny(s,C),b=0;b<s.length;b++){var x=s[b],M=null,k=x.querySelector("h2.iMqumd");if(k){var A=(k.textContent||"").trim(),G=A.match(/^Вы сказали:\s*"([\s\S]*)"$/);M=G?G[1].trim():A}var H=S[b].length>0?S[b].join(`

`):null;if(!H){var N=x.querySelector('[data-subtree="aimfl"]');if(N){var D=(N.textContent||"").trim();D&&(H=D)}}if(!H&&a[b]){var L=(a[b].textContent||"").trim();L&&(H=L)}!M&&u[b]&&(M=u[b]),t.push({id:x.getAttribute&&x.getAttribute("jsuid")||"idx"+b,userText:M||null,assistantText:H||null})}if(t.length===0){for(var z=null,X=0;X<a.length;X++){var ee=(a[X].textContent||"").trim();if(ee){z=ee;break}}if(!z&&C.length>0){var J=C[0];J.tagName==="TABLE"?z=id(J):z=ti(J).trim()||null}var Re=u.length>0?u[0]:null;(Re||z)&&t.push({id:"folif_"+Date.now(),userText:Re,assistantText:z})}if(t.length>1){var V="no-evidence";try{var ie=typeof document<"u"?document:null;if(ie&&typeof ie.querySelectorAll=="function"){var Y=ed(ie);if(!i||!Y||i===Y){var j=Us(ie);if(j.length>0){var te=zs(t,j);V=te.verdict,te.verdict!=="no-evidence"&&(t=te.turns)}}}}catch(Le){swallowSoft(Le,"gsa-utils:parseGoogleFolwrOpen-order")}V==="no-evidence"&&t.reverse()}for(var W=0;W<t.length;W++){var ke=t[W];ke.userText&&n.push({role:"user",text:qs(_o(ke.userText))}),ke.assistantText&&n.push({role:"assistant",text:zh(ke.assistantText)})}for(var F="",ye=0;ye<n.length;ye++)F+=(ye>0?`
`:"")+n[ye].text;return{threadId:i,turns:t,messages:n,text:F,count:n.length}}function ud(e){if(!e||typeof e!="string")return 0;try{var t=new DOMParser().parseFromString(e,"text/html");return t.querySelectorAll('[data-scope-id="turn"]').length}catch{return 0}}function Us(e){if(!e||typeof e.querySelectorAll!="function")return[];var t=[];try{for(var n=e.querySelectorAll('[data-scope-id="turn"]'),r=e.querySelectorAll('[data-subtree="aimfl"]'),i=Array.prototype.slice.call(n),o=[],a=0;a<i.length;a++){var s=i[a].querySelector("h2.iMqumd"),u=null;if(s){var l=(s.textContent||"").trim(),c=l.match(/^Вы сказали:\s*"([\s\S]*)"$/);u=c?c[1].trim():l}else u=Ks(e,i[a]);o.push(u)}for(var f=[],d=0;d<i.length;d++)f[d]=[];for(var h=Ws(e),m=0;m<h.length;m++){for(var y=h[m],C=-1,S=0;S<i.length&&i[S].compareDocumentPosition(y)&Node.DOCUMENT_POSITION_FOLLOWING;S++)C=S;if(C>=0&&C<i.length){var b=ti(y).trim();b&&f[C].push(b)}}for(var x=0;x<i.length;x++){var M=f[x].length?f[x].join(`

`):null;if(!M&&r[x]){var k=(r[x].textContent||"").trim();k&&(M=k)}t.push({id:i[x].getAttribute&&i[x].getAttribute("jsuid")||"idx"+x,userText:o[x]||null,assistantText:M||null})}}catch(A){swallowSoft(A,"gsa-utils:extractTurnsFromDocument")}return t}function ry(e){var t=String(e??"");return t?t.indexOf("idx")===0||t.indexOf("folif_")===0:!0}function iy(e,t){if(!e)return-1;var n,r=String(e.id==null?"":e.id);if(!ry(r)){for(n=0;n<t.length;n++)if(t[n]&&String(t[n].id==null?"":t[n].id)===r)return n}var i=Ft(e);if(i&&i!=="||"){for(n=0;n<t.length;n++)if(Ft(t[n])===i)return n}var o=ut(e).a;if(o)for(n=0;n<t.length;n++){var a=ut(t[n]).a;if(a&&ri(o,a))return n}return-1}function zs(e,t){var n=Array.isArray(e)?e:[],r=Array.isArray(t)?t:[],i=[],o;for(o=0;o<n.length;o++){var a=iy(n[o],r);a>=0&&i.push(a)}var s=i.length;if(s<2)return{turns:n,verdict:"no-evidence",matched:s};var u=0,l=0;for(o=1;o<i.length;o++)i[o]>i[o-1]?u++:i[o]<i[o-1]&&l++;return l>u?{turns:n.slice().reverse(),verdict:"reversed",matched:s}:{turns:n,verdict:"kept",matched:s}}function ld(e){if(!e||typeof e!="string")return null;try{for(var t=new DOMParser().parseFromString(e,"text/html"),n=t.querySelectorAll("[data-mstk]"),r=null,i=0;i<n.length;i++){var o=n[i].getAttribute("data-mstk");o&&(r=o.trim())}return r}catch{return null}}function cd(e){return!e||typeof e!="string"?!1:oy.test(e.trim())}function Jt(e){return String(e??"").toLowerCase().replace(/\u00a0/g," ").replace(/[^a-zа-яё0-9]+/g,"")}function Oo(e){var t=String(e??""),n=t.replace(/^["»”']{0,2}/,"").replace(/^[\s.,:;-]{0,4}/,"");return n.replace(/\s+/g,"").length>0}function ni(e){var t=String(e??""),n=t.slice(0,96),r=n.indexOf(":");if(r===-1)return null;var i=n.slice(r+1),o=/^\s*"/.exec(i);return o?t.slice(0,r+1+o[0].length):null}function Do(e){var t=String(e??""),n=ni(t);if(!n)return null;var r=t.slice(n.length),i=r.indexOf('"');if(i===-1)return null;var o=r.slice(i+1);if(!Oo(o))return null;var a=r.slice(0,i).trim();if(!a)return null;var s=o.replace(/^["»”']{0,2}/,"").replace(/^[\s.,:;-]+/,"");return s?{question:a,body:s}:null}function fd(e){var t=String(e??"").trim();if(!t)return t;var n=/^Вы\s+отправили[\s\S]*?запрос\s*:?\s*"/i.exec(t.slice(0,240));if(!n)return t;var r=t.slice(n[0].length),i=r.lastIndexOf('"');if(i===-1||r.slice(i+1).trim())return t;var o=r.slice(0,i).trim();return o||t}function sy(e){var t=/^Ответ\s+в\s+режиме\s+ИИ(?:[\s,]|$)[\s\S]*?запрос\s*:?\s*"/i.exec(e.slice(0,300));if(!t)return null;for(var n=e.slice(t[0].length),r=-1,i=0;i<n.length;i++)if(n.charAt(i)==='"'){var o=n.slice(i+1);if(/^[\r\n]/.test(o)&&Oo(o)){r=i;break}}if(r===-1){for(var a=0;a<n.length;a++)if(n.charAt(a)==='"'&&Oo(n.slice(a+1))){r=a;break}}if(r===-1){var s=n.lastIndexOf('"');s!==-1&&!n.slice(s+1).trim()&&(r=s)}if(r===-1)return null;var u=n.slice(r+1).replace(/^["»”']{0,2}/,"").replace(/^[\s.,:;-]+/,"");return{question:n.slice(0,r).trim(),body:u}}function dd(e){var t=String(e??"").trim();if(!t)return t;var n=sy(t);return n?n.body:/^Ответ\s+в\s+режиме\s+ИИ(?:[\s,]|$)/i.test(t)&&ni(t)?"":t}function uy(e){try{if(!e||typeof e.querySelector!="function")return null;var t=e.querySelector("h3.iMqumd");if(!t)return null;var n=String(t.textContent==null?"":t.textContent).trim(),r=ni(n);if(!r)return null;var i=n.slice(r.length),o=i.lastIndexOf('"');if(o===-1||i.slice(o+1).replace(/\s+/g,"").length>0)return null;var a=i.slice(0,o).trim();return a||null}catch{return null}}function ly(e){return String(e??"").trim().replace(/^["'«»„“”‘’]+/,"").replace(/["'«»„“”‘’]+$/,"").trim()}function Ks(e,t){try{if(!e||typeof e.querySelectorAll!="function")return null;var n=uy(t);if(!n)return null;var r=Jt(n);if(!r)return null;for(var i=e.querySelectorAll("span"),o=null,a=0;a<i.length;a++){var s=i[a];if(!(!s||!s.textContent)&&!(s.children&&s.children.length>0)&&!(typeof s.closest=="function"&&s.closest('[data-scope-id="turn"]'))){var u=ly(s.textContent);if(!(!u||Jt(u)!==r)){if(o!==null)return null;o=u}}}return o}catch{return null}}function Fo(e){var t=Do(e);if(t)return t.body;var n=String(e??"");try{var r=ay.exec(n);if(r){var i=n.slice(r[0].length),o=i.indexOf('"?');if(o!==-1&&o<200){var a=i.slice(o+2).replace(/^[\s.,:;-]+/,"");a&&(n=a)}}}catch{return String(e??"")}return n}function ut(e){if(!e)return{u:"",a:""};var t=Do(e.assistantText),n=Jt(e.userText);!n&&t&&(n=Jt(t.question));var r=Jt(t?t.body:Fo(e.assistantText));return{u:n,a:r}}function Ft(e){if(!e)return"";var t=ut(e);return t.u+"||"+t.a}function cy(e){var t=String(e??""),n=ni(t);if(!n)return"";for(var r=t.slice(n.length),i=-1,o=0;o<r.length;o++)if(r.charAt(o)==='"'){var a=r.slice(o+1);if(Oo(a)){if(/^[\r\n]/.test(a))return r.slice(0,o).trim();i===-1&&/^\s/.test(a)&&(i=o)}}if(i!==-1)return r.slice(0,i).trim();var s=Do(t);return s?s.question:""}function gd(e){if(!e)return e;var t=e.userText==null?"":String(e.userText).trim();return t||(t=cy(e.assistantText)),{id:e.id,userText:t||null,assistantText:e.assistantText==null?null:e.assistantText}}function No(e,t){if(!t)return!0;var n=String(e&&e.assistantText||"").length,r=String(t&&t.assistantText||"").length;return n!==r?n>r:String(e&&e.userText||"").length>String(t&&t.userText||"").length}function tr(e,t){return{id:e&&e.id!=null?e.id:t,userText:e&&e.userText||null,assistantText:e&&e.assistantText||null}}function ri(e,t){var n=String(e??""),r=String(t??"");if(!n||!r)return!1;if(n===r)return!0;var i=Math.min(n.length,r.length);if(i<fy)return!1;for(var o=0;o<i&&n.charCodeAt(o)===r.charCodeAt(o);)o++;return o===i?!0:o/i>=dy}function $s(e,t){var n=ut(e).a.length,r=ut(t).a.length;return n!==r?n>r:No(e,t)}function td(e){for(var t=Do(e&&e.assistantText),n=t?t.body:Fo(e&&e.assistantText),r=String(n??"").split(`
`),i=[],o="",a=0;a<r.length;a++){var s=r[a];if(s.trim()===""){var u=Jt(o);u&&i.push(u),o="";continue}o=o?o+`
`+s:s}var l=Jt(o);return l&&i.push(l),i}function py(e,t){var n=td(e),r=td(t);if(n.length<gy||n.length!==r.length)return!1;n.sort(),r.sort();for(var i=0;i<n.length;i++)if(n[i]!==r[i])return!1;return!0}function Vs(e,t){var n=ut(t);if(!n.u||!n.a)return-1;for(var r=0;r<e.length;r++){var i=ut(e[r]);if(i.u===n.u&&(ri(i.a,n.a)||i.a.length===n.a.length&&py(e[r],t)))return r}return-1}function Po(e,t,n){var r;for(r in e)e[r]===n&&delete e[r];var i=Ft(t[n]);i!=="||"&&(e[i]=n)}function Qs(e,t){e=Array.isArray(e)?e:[],t=Array.isArray(t)?t:[];var n={},r={},i=[];function o(s){if(s){var u=s.id!=null?String(s.id):"x"+i.length,l=Ft(s),c=Object.prototype.hasOwnProperty.call(n,u),f=l!=="||"&&Object.prototype.hasOwnProperty.call(r,l),d=c?n[u]:f?r[l]:Vs(i,s);if(d!==-1){var h=ut(i[d]),m=ut(s);if(c&&!f&&m.u&&h.u&&m.u!==h.u&&!ri(h.a,m.a)){r[l]=i.length,i.push(tr(s,u));return}var y=c||f?No(s,i[d]):$s(s,i[d]);y&&(i[d]=tr(s,i[d].id),Po(r,i,d));return}n[u]=i.length,l!=="||"&&(r[l]=i.length),i.push(tr(s,u))}}var a;for(a=0;a<e.length;a++)o(e[a]);for(a=0;a<t.length;a++)o(t[a]);return i}function pd(e,t){return Qs(e,t)}function md(e,t){e=Array.isArray(e)?e:[],t=Array.isArray(t)?t:[];var n={},r=[];function i(s){if(s){var u=Ft(s);if(u!=="||"){var l=Object.prototype.hasOwnProperty.call(n,u),c=l?n[u]:Vs(r,s);if(c===-1){n[u]=r.length,r.push(tr(s,"x"+r.length));return}var f=l?No(s,r[c]):$s(s,r[c]),d=r[c].userText;f&&(r[c]=tr(s,r[c].id),!r[c].userText&&d&&(r[c].userText=d),Po(n,r,c)),!r[c].userText&&s.userText&&(r[c]={id:r[c].id,userText:s.userText,assistantText:r[c].assistantText},delete n[u],Po(n,r,c))}}}for(var o=0;o<e.length;o++)i(e[o]);for(var a=0;a<t.length;a++)i(t[a]);return r}function hd(e,t){if(!Array.isArray(e)||e.length===0)return Array.isArray(e)?e:[];if(!Array.isArray(t)||t.length===0)return e;for(var n={},r={},i={},o={},a=0;a<t.length;a++){var s=t[a];if(!(!s||!s.userText)){var u=ut(s).a;u&&(Object.prototype.hasOwnProperty.call(i,u)?i[u]!==s.userText&&(delete i[u],o[u]=!0):o[u]||(i[u]=s.userText));var l=Ft(s);if(!(l==="||"||r[l])){if(Object.prototype.hasOwnProperty.call(n,l)){n[l]!==s.userText&&(delete n[l],r[l]=!0);continue}n[l]=s.userText}}}for(var c=[],f=!1,d=0;d<e.length;d++){var h=e[d],m=null;if(h&&!h.userText){var y=Ft(h);if(y!=="||"&&Object.prototype.hasOwnProperty.call(n,y)&&(m=n[y]),!m){var C=ut(h).a;C&&Object.prototype.hasOwnProperty.call(i,C)&&(m=i[C])}}if(!m){c.push(h);continue}c.push({id:h.id,userText:m,assistantText:h.assistantText}),f=!0}return f?c:e}function nd(e,t){var n=String(t??"");if(n.length<my)return!1;var r=String(e??""),i=ni(r);if(!i)return!1;var o=r.slice(i.length).replace(/^["»”'\u00ab\u201c\u2018\s]+/,"");return o.indexOf(n)===0}function hy(e){for(var t=e,n=0;n<3&&!(t.length<2);n++){var r=t[t.length-2],i=t[t.length-1];if(!r||!i)break;var o=r.assistantText==null?"":String(r.assistantText),a=i.assistantText==null?"":String(i.assistantText),s=r.userText==null?"":String(r.userText),u=i.userText==null?"":String(i.userText);if(o&&a&&o===a&&(s?1:0)+(u?1:0)==1){t[t.length-2]={id:r.id,userText:s||u,assistantText:o},t.pop();continue}var l=null;if(!o&&s&&a&&(!u||u===s)&&nd(a,s)?l={id:i.id,userText:s,assistantText:a}:!a&&u&&o&&(!s||s===u)&&nd(o,u)&&(l={id:r.id,userText:u,assistantText:o}),!l)break;t[t.length-2]=l,t.pop()}return t}function yd(e){for(var t=Array.isArray(e)?e:[],n={},r=[],i=0;i<t.length;i++){var o=t[i];if(o){var a=Ft(o),s=a!=="||"&&Object.prototype.hasOwnProperty.call(n,a),u=s?n[a]:Vs(r,o);if(u===-1){a!=="||"&&(n[a]=r.length),r.push(o);continue}var l=s?No(o,r[u]):$s(o,r[u]);if(l){var c=r[u].userText;!o.userText&&c?(r[u]=tr(o,r[u].id),r[u].userText=c):r[u]=o,Po(n,r,u)}}}return hy(r)}function vd(e){var t=e||{},n=t.ok===!0,r=t.status==null?0:t.status,i=typeof t.bodyLength=="number"&&t.bodyLength>=0?t.bodyLength:0,o=typeof t.newTurns=="number"&&t.newTurns>0?t.newTurns:0,a=t.cursor?String(t.cursor):null,s=t.sentCursor?String(t.sentCursor):null,u=!!(a&&s&&a===s),l,c,f;return n?i===0?(l="empty-body",c=!0,f=!1):u?(l="cursor-repeat",c=!0,f=!1):o>0?(l="new-turns",c=!1,f=!0):(l="no-new-turns",c=!0,f=!1):(l="http-error",c=!1,f=!1),{kind:l,complete:c,canContinue:f,status:r,ok:n,bodyLength:i,newTurns:o,cursor:a,cursorRepeated:u,log:"kind="+l+" status="+r+" ok="+(n?1:0)+" len="+i+"B \u0445\u043E\u0434\u043E\u0432=+"+o+" \u043A\u0443\u0440\u0441\u043E\u0440="+(a?"\u0435\u0441\u0442\u044C("+(u?"\u043F\u043E\u0432\u0442\u043E\u0440":"\u043D\u043E\u0432\u044B\u0439")+")":"\u043D\u0435\u0442")}}var Xf,js,Io,Qh,Jh,oy,ay,fy,dy,gy,my,Js=fe(()=>{Xf=/(`{3,})[\s\S]*?\1/g;js='pre, code, [class*="code-block"], [class*="codeBlock"], [class*="codeblock"]',Io=/^[A-Za-z][A-Za-z0-9+#._-]{0,19}$/;Qh=/(?:Самые популярные результаты веб-поиска по этой теме|People also search|Related searches|Похожие запросы|Связанные запросы)/i,Jh=/^Вы сказали:\s*"/;oy=/^AUtEx/i;ay=/^(?:в\s+)?(?:ответ(?:е)?(?:\s+на\s+вопрос)?|на\s+вопрос|вопрос)\s*:?\s*/i;fy=12,dy=.8;gy=2;my=12;typeof window<"u"&&(window.parseGoogleFolwrOpen=sd,window.GoogleFolwrUtils={countTurnContainers:ud,extractTurnsFromDocument:Us,mergeTurnsByKey:md,extractContinuationToken:ld,mergeTurnsById:Qs,mergeTurnsMonotone:pd,classifyFolwrContinuation:vd,canonicalTurnKeyOf:Ft,canonicalAnswerBody:Fo,canonicalizeTurnForThread:gd,normalizeTurnKeyPart:Jt,turnIdentityParts:ut,bodiesPrefixCompatible:ri,dedupeTurns:yd,isHistoryCursor:cd,resolveUserQuestionForTurn:Ks,fillMissingUserText:hd,orderTurnsByDom:zs,renderCodeBlock:Lo,answerTextOf:ti,answerDomNodes:Ws,isCodeBlockElement:nr,stripGsaUserEcho:fd,stripGsaAssistantEcho:dd})});function Xs(e){let t=String(e||"").match(/ultra|pro|flash/i);return t?t[0].toLowerCase():""}function Bo(e){return String(e||"").replace(/([a-zа-яё])([A-ZА-ЯЁ])/g,"$1 $2").replace(/\s+/g," ").trim()}function bd(e){let t=String(e||"").replace(/\s+/g," ").trim();if(!t||t.length>60)return"";let n=t.match(Zs);return!n||!n[1]&&!/gemini/i.test(t)?"":n[0].trim()}function Ln(e){return yy.test(String(e||""))}function vy(e,t){let n=e.document.querySelectorAll(".picker-primary-text");for(let r=0;r<n.length;r++){let i=Bo(n[r].textContent);if(i&&i.length<=60&&Ln(i))return ii}for(let r=0;r<n.length;r++){let i=Bo(n[r].textContent);if(!i||i.length>60)continue;if(Ln(i))return ii;let a=(bd(i)||i).match(Zs),s=a?Xs(a[0]):"";if(a&&s){if(a[1])return e.cache[s]=a[0].trim(),a[0].trim();let u=a[0].match(/lite|расширенн[а-яё]*|extended|fast/i);return xd(e,s,u?u[0]:"",t)||""}if(/gemini/i.test(i))return ii}return""}function Cy(e){let t=e.querySelectorAll('[role="menuitemradio"], [role="menuitem"], [role="option"]');for(let n=0;n<t.length;n++){let r=t[n];if(r.getAttribute("aria-checked")!=="true"&&!r.querySelector('[aria-checked="true"]'))continue;if(Ln(Bo(r.textContent)))return ii;let i=bd(r.textContent);if(i)return i}return""}function xd(e,t,n,r){let i=e.modelConfig,o=e.cache[t];if(o){let s=i.resolveModelId(o);if(s)return s}if(r){let s=i.getModel(r),l=(s&&s.name||"").match(/ultra|pro|flash/i);if(l&&l[0].toLowerCase()===t)return r}let a=i.getFamilyDefaultModelId(t,n);return a||r||""}function by(e,t){let n=e.document.querySelector("button.input-area-switch");if(!n||!n.textContent)return"";let r=Bo(n.textContent);if(Ln(r))return ii;let i=r.match(Zs);if(!i)return"";let o=Xs(i[0]);if(!o)return"";if(i[1])return e.cache[o]=i[0].trim(),i[0].trim();let a=i[0].match(/lite|расширенн[а-яё]*|extended|fast/i),s=a?a[0]:"";return xd(e,o,s,t)}function wd(e,t){let n=Cy(e.document);if(n){let i=Xs(n);return i&&(e.cache[i]=n),n}let r=vy(e,t);return r||by(e,t)||""}var Zs,ii,yy,Sd=fe(()=>{Zs=/(?:gemini\s*)?(\d+(?:[.,]\d+)?)?\s*(ultra|pro|flash)(?:\s+(?:lite|расширенн[аяый]|extended|fast))?/i,ii="Gemini (\u0410\u0432\u0442\u043E)",yy=/(?:^|[^a-zа-яё])(?:авто|auto)(?:[^a-zа-яё]|$)/i});function Sy(e){if(e==null)return null;var t=String(e).trim().toLowerCase();return wy[t]||null}function Ay(e){return e.nodeType||"message"}function Ty(e){return String(e??"").replace(/\r\n?/g,`
`)}function Md(e,t){return Nr(e+"\0"+t)}function Ey(e){var t=e.length>0&&e.every(function(r){return typeof r.ordinal=="number"&&isFinite(r.ordinal)});if(!t)return{messages:e.slice(),ordered:!1};var n=e.slice();return n.sort(function(r,i){return Number(r.ordinal)-Number(i.ordinal)}),{messages:n,ordered:!0}}function ky(e){return{kind:e.kind||"dom",capturedAt:typeof e.capturedAt=="number"?e.capturedAt:0,convId:e.convId==null?null:String(e.convId)}}function Ad(e,t,n,r,i,o,a){var s=Md(e,t),u=i.id==null?"":String(i.id),l={id:u||n+":"+r+":"+e+":"+s,turnId:n,seq:r,role:e,kind:"message",text:t,provenance:[ky(o)],hash:s};return a&&(l.reasoning=a),l}function Td(e,t){return e?t?e+kd+t:e:t}function Ed(e,t){var n=e.meta,r=n&&typeof n.turnId=="string"?n.turnId:"";return r||"t"+t}function Ys(e,t){var n=Ey(e),r={},i=0;function o(W){r[W]=(r[W]||0)+1,i++}var a=t.dropped||{};Object.keys(a).forEach(function(W){var ke=W,F=Number(a[ke]||0);F>0&&(r[ke]=(r[ke]||0)+F,i+=F)});for(var s={},u={},l=[],c=null,f="",d=0,h=0;h<n.messages.length;h++){var m=n.messages[h],y=Ay(m),C=Ty(m.text);if(y==="reasoning"){f=Td(f,C);continue}if(y!=="message"){o(y);continue}if(m.id!=null){var S=String(m.id);if(s[S])continue;s[S]=!0}var b=Sy(m.role);if(!b){o(y);continue}if(!C.trim()){b==="user"?d++:o(y);continue}if(b==="user"){var x=Ed(m,l.length+1),M=x+"\0user\0"+C;if(u[M])continue;u[M]=!0,c={id:x,user:Ad("user",C,x,0,m,t),segments:[]},l.push(c);continue}c||(d++,c={id:Ed(m,l.length+1),user:null,segments:[]},l.push(c));var k=c.id+"\0assistant\0"+C;u[k]||(u[k]=!0,c.segments.push(Ad("assistant",C,c.id,1+c.segments.length,m,t,f||void 0)),f="")}f&&o("reasoning");for(var A=[],G=[],H=0;H<l.length;H++){var N=l[H],D=null,L=[];if(N.segments.length===1)D=N.segments[0];else if(N.segments.length>1){L=N.segments;for(var z=L.map(function(W){return W.text}).join(kd),X=L.reduce(function(W,ke){return Td(W,ke.reasoning||"")},""),ee=Md("assistant",z),J=[],Re=0;Re<L.length;Re++)J=J.concat(L[Re].provenance);D={id:N.id+":1:assistant:"+ee,turnId:N.id,seq:1,role:"assistant",kind:"message",text:z,provenance:J,hash:ee},X&&(D.reasoning=X)}var V={id:N.id,user:N.user,assistant:D};L.length>1&&(V.segments=L),A.push(V),V.user&&G.push(V.user),V.assistant&&G.push(V.assistant)}var ie=[],Y=t.complete!==!1;t.complete===!1&&ie.push("incomplete"),d>0&&(ie.indexOf("missing-user-text")<0&&ie.push("missing-user-text"),Y=!1);var j={complete:Y,reasons:ie};i>0&&(j.droppedNodes=i),d>0&&(j.missingUserTurns=d);var te={convId:t.convId==null?null:String(t.convId),platform:t.platform,turns:A,messages:G,completeness:j};return t.model&&(te.model=t.model),te}function rr(e){return Ys(e.messages,{platform:e.platform,convId:e.convId,kind:e.kind,capturedAt:e.capturedAt,complete:e.complete,dropped:e.dropped})}var kd,wy,Go=fe(()=>{to();kd=`

`,wy={user:"user",human:"user",you:"user",assistant:"assistant",model:"assistant",ai:"assistant",bot:"assistant"}});function qo(e,t){let n=Array.isArray(e)?e:[],r=Array.isArray(t)?t:[];if(n.length===r.length)return;let i=0,o=0,a=0,s=0;for(let u=0;u<n.length;u++)n[u]&&n[u].role==="user"?i++:o++;for(let u=0;u<r.length;u++)r[u]&&r[u].role==="user"?a++:s++;return{input:n.length,output:r.length,removedUsers:Math.max(0,i-a),foldedAssistants:Math.max(0,o-s)}}function nu(e){let t=[],n=e&&Array.isArray(e.msgs)?e.msgs:[];for(let r=0;r<n.length;r++){let i=n[r]||{},o=String(i.text==null?"":i.text)+String(i.sections==null?"":i.sections),a={role:i.role==="assistant"||i.role==="model"?"assistant":"user",text:o};i.id!=null&&(a.id=String(i.id)),t.push(a)}return t}function My(){try{return typeof sessionStorage<"u"&&sessionStorage.getItem("aiCmV2Messages")==="1"}catch{return!1}}function ru(){return oi||jo(),My()||eu}function Rd(){oi||jo()}function Ld(){oi||jo();try{if(typeof sessionStorage<"u"&&sessionStorage.getItem("aiCmV2Messages")==="0")return!1}catch(e){v(e,"content:v2-messages-default-flag")}return!tu}function jo(){if(!oi){oi=!0;try{if(typeof chrome>"u"||!chrome.storage||!chrome.storage.local)return;chrome.storage.local.get("aiCmV2",function(e){let t=e&&e.aiCmV2;eu=!!(t&&t.messages===!0),tu=!!(t&&t.messages===!1),eu&&p("log","[AI CM][v2-messages] flag=on source=storage"),tu&&p("log","[AI CM][v2-messages] default=off source=storage")})}catch(e){v(e,"content:v2-messages-flag")}}}function Iy(e){let t=[];if(!Array.isArray(e))return t;for(let n=0;n<e.length;n++){let r=e[n];if(!r||typeof r.content!="string")continue;let i=r.content.replace(/\r\n?/g,`
`);i.trim()&&t.push({role:r.role==="user"?"user":"assistant",text:i})}return t}function Ho(e,t){let n=0;for(let r=0;r<e.length;r++)e[r].role===t&&n++;return n}function ai(e){return Nr(ir(e))}function ir(e){let t="";if(Array.isArray(e))for(let n=0;n<e.length;n++)t+=e[n]&&e[n].role==="user"?"u":"a";return t}function _y(e,t){let n=[],r=Math.max(e.length,t.length);for(let i=0;i<r;i++){let o=e[i]?e[i].role:"",a=t[i]?t[i].role:"";o!==a&&n.push(i)}return n}function Ry(e,t){let n=Math.max(e.length,t.length);for(let r=0;r<n;r++){let i=e[r],o=t[r];if(!i||!o||i.role!==o.role||i.text!==o.text)return r}return-1}function Ly(e,t){let n=Iy(e),r=rr(t),i=kn(t.convId||"",n),o=kn(r.convId||"",r.messages),a=Ry(n,r.messages),s=_y(n,r.messages),u=ai(n),l=ai(r.messages),c=Ho(n,"user"),f=Ho(n,"assistant"),d=Ho(r.messages,"user"),h=Ho(r.messages,"assistant"),m=[];return n.length!==r.messages.length&&m.push("count"),i.bodyHash!==o.bodyHash&&m.push("body-hash"),c!==d&&m.push("user-count"),f!==h&&m.push("assistant-count"),(u!==l||s.length>0)&&m.push("role-sequence"),a>=0&&m.push("first-diff"),r.completeness.missingUserTurns&&m.push("missing-user-turns"),{verdict:i.bodyHash===o.bodyHash&&n.length===r.messages.length&&u===l?"same":"diff",oldHash:i.bodyHash,newHash:o.bodyHash,oldRoleHash:u,newRoleHash:l,oldChars:i.chars,newChars:o.chars,oldUser:c,oldAssistant:f,newUser:d,newAssistant:h,firstDiff:a,firstRoleDiff:s.length?s[0]:-1,roleDiffs:s,oldRoles:ir(n),newRoles:ir(r.messages),reasons:m,newComplete:r.completeness.complete,newReasons:r.completeness.reasons.slice()}}function Oy(e,t){let n=[t.convId||"",t.kind,e.oldHash,e.newHash,e.oldRoleHash,e.newRoleHash,e.oldChars,e.newChars,e.firstDiff,e.roleDiffs.join(",")].join("|");n!==Id&&(Id=n,p("log","[AI CM][v2-messages] site=aistudio verdict="+e.verdict+" src="+t.kind+" old="+e.oldUser+"u/"+e.oldAssistant+"a new="+e.newUser+"u/"+e.newAssistant+"a oldHash="+e.oldHash+" newHash="+e.newHash+" oldRoleHash="+e.oldRoleHash+" newRoleHash="+e.newRoleHash+" oldChars="+e.oldChars+" newChars="+e.newChars),p("log","[AI CM][v2-messages-json] "+JSON.stringify({t:new Date().toISOString(),site:"aistudio",verdict:e.verdict,src:t.kind,convId:t.convId||"",old:{u:e.oldUser,a:e.oldAssistant,bodyHash:e.oldHash,roleHash:e.oldRoleHash,roles:e.oldRoles,chars:e.oldChars},new:{u:e.newUser,a:e.newAssistant,bodyHash:e.newHash,roleHash:e.newRoleHash,roles:e.newRoles,chars:e.newChars,complete:e.newComplete,reasons:e.newReasons},reasons:e.reasons,firstDiff:e.firstDiff,firstRoleDiff:e.firstRoleDiff,roleDiffs:e.roleDiffs})),e.verdict==="diff"&&p("log","[AI CM][v2-messages] diff site=aistudio first="+e.firstDiff+" firstRole="+e.firstRoleDiff+" roleDiffs="+(e.roleDiffs.join(",")||"-")+" reasons="+e.reasons.join(",")+" newComplete="+(e.newComplete?1:0)+" newReasons="+(e.newReasons.join(",")||"-")))}function Py(e,t){if(!ru()||!e||e.siteName!=="aistudio"||typeof e.capture!="function")return null;try{let n=e.capture();if(!n||!Array.isArray(n.messages))return null;let r=Ly(t,n);return Oy(r,n),r}catch(n){return v(n,"content:v2-messages-dualrun"),null}}function iu(e){if(_d||!e||!e.prototype)return!1;let t=e.prototype.extractMessages;return typeof t!="function"?!1:(_d=!0,jo(),e.prototype.extractMessages=function(...n){let r=t.apply(this,n);try{Py(this,r)}catch(i){v(i,"content:v2-messages-wrap")}return r},!0)}var eu,tu,oi,Id,_d,ou=fe(()=>{Go();to();Mn();eu=!1,tu=!1,oi=!1,Id="",_d=!1});function Dy(e){let t=[];if(!Array.isArray(e))return t;for(let n=0;n<e.length;n++){let r=e[n]||{},i=typeof r.content=="string"?r.content:typeof r.text=="string"?r.text:"";i&&t.push({role:r.role==="user"?"user":"assistant",text:i})}return t}function Fy(e,t){let n=Dy(e),i=rr(t).messages.map(function(c){return{role:c.role,text:c.text}}),o=ir(n),a=ir(i),s=[];n.length!==i.length&&s.push("count"),o!==a&&s.push("role-sequence");let u=-1,l=Math.max(n.length,i.length);for(let c=0;c<l;c++){let f=n[c],d=i[c];if(!f||!d||f.role!==d.role||f.text!==d.text){u=c,s.length||s.push("text");break}}return{verdict:s.length?"diff":"same",oldCount:n.length,newCount:i.length,oldRoles:o,newRoles:a,oldRoleHash:ai(n),newRoleHash:ai(i),firstDiff:u,reasons:s}}function Ny(e,t){if(!ru()||!e||e.siteName!=="qwen"||typeof e.capture!="function"||au)return null;au=!0;try{let n=e.capture();if(!n||!Array.isArray(n.messages))return null;let r=Fy(t,n),i=[r.verdict,r.oldCount,r.newCount,r.oldRoleHash,r.newRoleHash,r.reasons.join(",")].join("|");return i!==Pd&&(Pd=i,p("log","[AI CM][v2-messages] "+r.verdict+" site=qwen counts="+r.oldCount+"->"+r.newCount+" roleHash="+r.oldRoleHash+"->"+r.newRoleHash+" first="+r.firstDiff+" reasons="+(r.reasons.join(",")||"-"))),r}catch(n){return v(n,"content:v2-messages-qwen-dualrun"),null}finally{au=!1}}function su(e){if(Od||!e||!e.prototype)return!1;let t=e.prototype.extractMessages;return typeof t!="function"?!1:(Od=!0,Rd(),e.prototype.extractMessages=function(...n){let r=t.apply(this,n);try{Ny(this,r)}catch(i){v(i,"content:v2-messages-qwen-wrap")}return r},!0)}var Od,au,Pd,Dd=fe(()=>{Go();ou();Mn();Od=!1,au=!1,Pd=""});function si(e){return typeof e!="number"||!isFinite(e)||e<=0?0:Math.round(e)}function Fd(e){let t=[];if(!e)return t;let n=typeof e.convId=="string"&&e.convId?e.convId:null,r=typeof e.capturedAt=="number"&&isFinite(e.capturedAt)?e.capturedAt:0,i=e.baseComplete===!0;function o(a,s,u,l,c){if(s<=0)return;let f={kind:a,tokens:s,precision:u,coverage:l,convId:n,capturedAt:r,source:c};e&&typeof e.bodyHash=="string"&&e.bodyHash&&(f.bodyHash=e.bodyHash),t.push(f)}return o("native",si(e.nativeTokens),"exact","full",e.nativeSource||"native"),o("server",si(e.serverTokens),"reported",i?"full":"partial",e.serverSource||"server"),o("base",si(e.baseTokens),"derived",i?"full":"partial",e.baseSource||"base"),o("dom",si(e.domTokens),"derived","partial",e.domSource||"dom"),o("estimate",si(e.estimateTokens),"floor","partial",e.estimateSource||"estimate"),t}var Nd=fe(()=>{});function Gd(e,t){for(let n=0;n<e.length;n++)if(e[n]&&e[n].kind===t)return e[n];return null}function uu(e,t){for(let n=0;n<t.length;n++){let r=Gd(e,t[n]);if(r)return r}return null}function Hd(e,t,n){let r=Array.isArray(e)?e:[];if(r.length===0)return null;if(t==="legacy"){if(n){let i=Gd(r,n);if(i)return i}return uu(r,["native","server","base","dom","estimate"])}if(t==="reload-fuller"){for(let i=0;i<r.length;i++){let o=r[i];if(o&&o.coverage==="full"&&o.kind!=="estimate")return o}return uu(r,["native","server","base","dom","estimate"])}return uu(r,Bd[t]||Bd["native-first"])}function qd(e,t){return t&&Array.isArray(t.reasons)&&t.reasons.indexOf("stale")!==-1?"stale":e?e.precision==="exact"?"exact":e.precision==="reported"?"reported":e.precision==="derived"?"derived":"floor":"floor"}function jd(e,t){return e?e.precision==="derived"||e.precision==="floor"||e.coverage!=="full"?"provisional":t&&t.complete===!0?"settled":"provisional":t&&t.complete===!1?"collecting":"no-data"}var Bd,Wd=fe(()=>{Bd={"native-first":["native","server","base","dom","estimate"],"server-first":["server","native","base","dom","estimate"]}});function By(e,t){return t>0?Math.round(e/t*1e3)/10:0}function zd(e){let t=Array.isArray(e.readings)?e.readings:[],n=e.policy||"native-first",r=Hd(t,n,e.preferredKind),i=r?r.tokens:0,o=e.limitModel&&e.limitModel.displayLimit>0?e.limitModel.displayLimit:0,a=qd(r,e.completeness),s=jd(r,e.completeness),u=e.completeness?e.completeness:{complete:!1,reasons:[]},l={convId:e.convId,capturedAt:e.capturedAt,tokens:i,limit:o,percent:By(i,o),quality:a,readings:t,limitModel:e.limitModel,completeness:u,readiness:s};return typeof e.bodyHash=="string"&&e.bodyHash?l.bodyHash=e.bodyHash:r&&typeof r.bodyHash=="string"&&r.bodyHash&&(l.bodyHash=r.bodyHash),l}function Ud(e){return typeof e=="string"?e:""}function Kd(e,t){if(!e||!t)return{verdict:"diff",fields:["snapshot"]};let n=[];return typeof e.tokens=="number"&&e.tokens!==t.tokens&&n.push("tokens"),typeof e.limit=="number"&&e.limit!==t.limit&&n.push("limit"),typeof e.percent=="number"&&e.percent!==t.percent&&n.push("percent"),typeof e.bodyHash=="string"&&Ud(e.bodyHash)!==Ud(t.bodyHash)&&n.push("bodyHash"),typeof e.baseComplete=="boolean"&&e.baseComplete!==t.completeness.complete&&n.push("completeness"),{verdict:n.length?"diff":"same",fields:n}}var $d=fe(()=>{Wd()});function Gy(){try{return typeof sessionStorage<"u"&&sessionStorage.getItem("aiCmV2Metrics")==="1"}catch{return!1}}function Hy(){return cu||Qd(),Gy()||lu}function Qd(){if(!cu){cu=!0;try{if(typeof chrome>"u"||!chrome.storage||!chrome.storage.local)return;chrome.storage.local.get("aiCmV2",function(e){let t=e&&e.aiCmV2;lu=!!(t&&t.metrics===!0),lu&&p("log","[AI CM][v2-metrics] flag=on source=storage")})}catch(e){v(e,"content:v2-metrics-flag")}}}function qy(e){let t=e.baseComplete===!0&&e.partial!==!0;return{complete:t,reasons:t?[]:["incomplete"]}}function jy(e){return e.readings.map(function(t){return t.kind+":"+t.tokens}).join(",")||"-"}function fu(e,t){if(!Hy()||!e||!t||t.site!=="aistudio")return null;Qd();try{let n=Fd(t),r=io(t),i=qy(t),o=zd({convId:typeof e.convId=="string"&&e.convId?e.convId:t.convId||"",capturedAt:t.capturedAt,readings:n,limitModel:r,completeness:i,bodyHash:t.bodyHash||e.bodyHash,policy:"native-first"}),a=Kd(e,o),s=[t.site,o.tokens,o.limit,o.percent,o.quality,o.readiness,a.verdict,a.fields.join(",")].join("|");return s!==Vd&&(Vd=s,p("log","[AI CM][v2-metrics] "+a.verdict+" site=aistudio fields="+(a.fields.join(",")||"-")+" legacy="+(typeof e.tokens=="number"?e.tokens:"?")+"/"+(typeof e.limit=="number"?e.limit:"?")+"/"+(typeof e.percent=="number"?e.percent:"?")+" new="+o.tokens+"/"+o.limit+"/"+o.percent+" quality="+o.quality+" readiness="+o.readiness+" readings="+jy(o))),{snapshot:o,diff:a}}catch(n){return v(n,"content:v2-metrics-dualrun"),null}}var lu,cu,Vd,Jd=fe(()=>{Nd();Ja();$d();Mn();lu=!1,cu=!1,Vd=""});function Wy(e,t){let n=typeof e=="string"?e:JSON.stringify(e===void 0?null:e),r=typeof t=="string"?t:JSON.stringify(t===void 0?null:t);return n===r}function Zd(e,t){let n=Array.isArray(e)?e:[],r=[];for(let u=0;u<n.length;u++){let l=n[u];r.push(l&&typeof l=="object"?Object.assign({},l):l)}let i=t||{};if(typeof i.cleanText=="function")for(let u=0;u<r.length;u++){let l=r[u];if(!l||typeof l!="object")continue;let c=typeof l.text=="string"?l.text:"",f=i.cleanText(c,l);typeof f=="string"&&f!==c&&(l.text=f)}if(!(typeof i.hiddenEffective=="function"?i.hiddenEffective(r)===!0:i.includeHidden===!0))for(let u=0;u<r.length;u++)r[u]&&typeof r[u]=="object"&&delete r[u].reasoning;let a=typeof i.sanitize=="function"?i.sanitize(r):r;Array.isArray(a)||(a=r);let s=a.length!==n.length;if(!s)for(let u=0;u<n.length;u++){let l=n[u]||{},c=a[u]||{},f=Object.keys(l),d=Object.keys(c);if(f.length!==d.length){s=!0;break}for(let h=0;h<f.length;h++){let m=f[h];if(!Wy(l[m],c[m])){s=!0;break}}if(s)break}return s?{messages:a,mode:"projected"}:{messages:n,mode:""}}var Xd=fe(()=>{});function Yd(e){return!e||e.partial!==!0?{partial:void 0,partialReason:void 0}:{partial:!0,partialReason:(typeof e.partialReason=="string"?e.partialReason.trim():"")||"incomplete"}}var eg=fe(()=>{});var A0=dm((MC,le)=>{Ul();Kl();to();Mn();Jl();Zl();Ja();Cc();Lf();Zf();Js();Sd();ou();Dd();Jd();Go();Xd();eg();var qt=class{constructor(){this.siteName="base",this.dialogContainerSelector="",this.userMessageSelector="",this.modelMessageSelector=""}isOnDialogPage(){throw new Error("\u041C\u0435\u0442\u043E\u0434 isOnDialogPage() \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D")}extractMessages(t){throw new Error("\u041C\u0435\u0442\u043E\u0434 extractMessages() \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D")}getFullDialogText(){return this.extractMessages().map(n=>n.content).join("\\n")}getMessageCount(){return this.extractMessages().length}detectModel(){return null}_getTextContent(t){return t?t.textContent.trim():""}_safeQuerySelector(t,n=document){try{return n.querySelector(t)}catch(r){return Hr("adapter:base:safeQuerySelector",`\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0430 "${t}":`,r),null}}_safeQuerySelectorAll(t,n=document){try{return n.querySelectorAll(t)}catch(r){return Hr("adapter:base:safeQuerySelectorAll",`\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0430 "${t}":`,r),[]}}detectContextSaturation(){return{active:!1,reason:""}}};typeof le<"u"&&le.exports&&(le.exports=qt);var du=/^\s*(?:ChatGPT сказал|ChatGPT said|ChatGPT sagte):\s*/,Tu=class extends qt{constructor(){super();this._modelDetectLogged=!1;this.siteName="chatgpt",this._turnSelectors=["[data-turn-key]"],this._userSelectors=['[class*="bg-user-message"]','[class*="text-user-message"]'],this._assistantSelectors=['[class*="block-"]','[class*="content-"]'],this._userRoleMarkers=["bg-user-message","text-user-message"],this._legacyUserRoleMarkers=["user-message-bubble-color"],this._assistantRoleMarkers=["markdown","assistant-message","model-response"],this.allContentSelectors=".whitespace-pre-wrap, .markdown",this._lastTurnStats={turns:0,users:0,assistants:0,skippedUnknown:0,looseUsers:0}}_markerHit(n,r){let i=String(n||"");if(!i)return!1;for(let o=0;o<r.length;o++)if(i.indexOf(r[o])!==-1)return!0;return!1}_hasUserMarker(n){if(!n)return!1;if(this._markerHit(n.className,this._userRoleMarkers)||this._markerHit(n.className,this._legacyUserRoleMarkers))return!0;let r=n.parentElement;for(let i=0;i<5&&r;i++){if(this._markerHit(r.className,this._userRoleMarkers)||this._markerHit(r.className,this._legacyUserRoleMarkers))return!0;r=r.parentElement}return!!(n.querySelector&&n.querySelector(this._userSelectors.join(", ")))}_firstUserNode(n){for(let r=0;r<this._userSelectors.length;r++){let i=n.querySelectorAll(this._userSelectors[r]);for(let o=0;o<i.length;o++)if(String(i[o].textContent||"").trim())return i[o]}return null}_longestTextNode(n,r){let i=n.querySelectorAll("*"),o=null,a=0;for(let s=0;s<i.length;s++){let u=i[s];if(u===r||r&&u.contains(r)||this._hasUserMarker(u)||String(u.textContent||"").trim().length<=a)continue;let l=this._extractText(u);l.length>a&&(o=u,a=l.length)}return o}_assistantInTurn(n,r){let i=null,o=0;for(let a=0;a<this._assistantSelectors.length;a++){let s=n.querySelectorAll(this._assistantSelectors[a]);for(let u=0;u<s.length;u++){let l=s[u];if(l===r||this._hasUserMarker(l)||String(l.textContent||"").trim().length<=o)continue;let c=this._extractText(l);c.length>o&&(i=l,o=c.length)}}return i||(r?this._longestTextNode(n,r):null)}_findMessageElements(){let n=[],r={turns:0,users:0,assistants:0,skippedUnknown:0,looseUsers:0},i=document.querySelectorAll(this._turnSelectors[0]);for(let s=0;s<i.length;s++){let u=i[s];r.turns++;let l=this._firstUserNode(u);l&&(n.push({role:"user",element:l}),r.users++);let c=this._assistantInTurn(u,l);c&&(n.push({role:"assistant",element:c}),r.assistants++)}let o=this._userSelectors.join(", "),a=document.querySelectorAll(o);for(let s=0;s<a.length;s++){let u=a[s];if(u.closest(this._turnSelectors[0])||u.parentElement&&u.parentElement.closest(o))continue;n.push({role:"user",element:u}),r.users++,r.looseUsers++;let l=u.nextElementSibling;for(;l;){if(String(l.textContent||"").trim()){n.push({role:"assistant",element:l}),r.assistants++;break}l=l.nextElementSibling}}if(n.length===0){let s=document.querySelectorAll(this.allContentSelectors);for(let u=0;u<s.length;u++){let l=this._detectRole(s[u]);if(l==="unknown"){r.skippedUnknown++;continue}n.push({role:l,element:s[u]}),l==="user"?r.users++:r.assistants++}}return this._lastTurnStats=r,n}_detectRole(n){let r=String(n.className||"");return r.indexOf("markdown")!==-1?"assistant":this._hasUserMarker(n)?"user":this._markerHit(r,this._assistantRoleMarkers)?"assistant":"unknown"}_blockText(n){let r="",i={P:1,DIV:1,LI:1,TR:1,SECTION:1,ARTICLE:1,HEADER:1,FOOTER:1,MAIN:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,PRE:1,BLOCKQUOTE:1,TABLE:1,UL:1,OL:1},o=a=>{if(a.nodeType===3){r+=String(a.nodeValue||"");return}if(a.nodeType!==1)return;let s=a.tagName;if(s==="BR"){r+=`
`;return}let u=i[s]===1;u&&r&&r.charAt(r.length-1)!==`
`&&(r+=`
`);let l=a.childNodes;for(let c=0;c<l.length;c++)o(l[c]);u&&r&&r.charAt(r.length-1)!==`
`&&(r+=`
`)};return o(n),r.replace(/[ \t]+\n/g,`
`).replace(/\n{3,}/g,`

`).trim()}_extractText(n){if(String(n.className||"").indexOf("markdown")!==-1){let o=n.querySelectorAll("p");if(o.length>0){let a=[];for(let s=0;s<o.length;s++)a.push(String(o[s].textContent||"").trim());return a.join(`
`).trim()}}let i=n.cloneNode(!0);return i.querySelectorAll('button, [role="button"], svg').forEach(o=>o.remove()),this._blockText(i)}extractMessages(){let n=typeof Ne=="function"?Ne():!1,r=this._findMessageElements(),i=[];for(let o=0;o<r.length;o++){let a=r[o].role,s=this._extractText(r[o].element).replace(du,"");!s||s.length===0||a!=="unknown"&&i.push({role:a,content:s})}if(n&&typeof w=="function"){let o=this._lastTurnStats;w("chatgpt-adapter-turn",{turns:o.turns,users:o.users,assistants:o.assistants,msgs:i.length,loose:o.looseUsers,skippedUnknown:o.skippedUnknown}),o.turns>0&&o.assistants===0&&w("chatgpt-roles-miss",{turns:o.turns,users:o.users,turnSel:this._turnSelectors.join(", "),userSel:this._userSelectors.join(", "),assistantSel:this._assistantSelectors.join(", ")})}return i}getFullDialogText(){return this.extractMessages().map(r=>r.content).join(`
`)}isOnDialogPage(){return document.querySelector(this._turnSelectors.join(", "))||document.querySelector(this._userSelectors.join(", "))?!0:document.querySelector(this.allContentSelectors)!==null}detectModel(){let n=null;try{let r=/(GPT-[\w.\-]+|Gemini[\s\d.\-A-Za-z]*|DeepSeek[\s\-A-Za-z0-9]*|Claude[\s\d.\-A-Za-z]*|o[134]-[\w.\-]*)/i,i=['[data-testid="model-switcher-dropdown-button"]','[data-testid="model-switcher"]','button[aria-label*="model" i]','button[aria-label*="\u043C\u043E\u0434\u0435\u043B\u044C" i]',"nav button","header button"];for(let o=0;o<i.length&&!n;o++){let a=document.querySelectorAll(i[o]);for(let s=0;s<a.length;s++){let l=(a[s].innerText||a[s].textContent||"").trim().match(r);if(l){n=l[1];break}}}if(!n){let o=document.querySelectorAll("[aria-label],[title]");for(let a=0;a<o.length;a++){let u=((o[a].getAttribute("aria-label")||"")+" "+(o[a].getAttribute("title")||"")).match(r);if(u){n=u[1];break}}}}catch(r){v(r,"adapter:chatgpt:detectModel")}return this._modelDetectLogged||(this._modelDetectLogged=!0,p("log","[model-detect][DOM] "+(n?'\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 \u0448\u0430\u043F\u043A\u0435: "'+n+'"':"\u0438\u043C\u044F \u043C\u043E\u0434\u0435\u043B\u0438 \u0432 \u0448\u0430\u043F\u043A\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E (\u0448\u0430\u043F\u043A\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0431\u0440\u0435\u043D\u0434 \u2014 \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u043E\u0437\u044C\u043C\u0451\u0442\u0441\u044F \u0438\u0437 \u0441\u0435\u0442\u0438/\u0434\u0435\u0444\u043E\u043B\u0442\u0430)"))),n}getVisibleMessages(){try{let n=this._findMessageElements(),r=[];for(let i=0;i<n.length;i++){let o=this._extractText(n[i].element).replace(du,"").trim();o&&r.push({role:n[i].role,text:o})}return r}catch(n){return v(n,"adapter:chatgpt:visible-messages"),[]}}getLastAssistantText(){try{let n=this._findMessageElements();for(let r=n.length-1;r>=0;r--){if(n[r].role!=="assistant")continue;let i=this._extractText(n[r].element).replace(du,"").trim();if(i)return i}}catch(n){v(n,"adapter:chatgpt:last-assistant")}return""}detectContextSaturation(){try{let n=["\u043D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442","new chat","\u043F\u0435\u0440\u0435\u0439\u0442\u0438 \u043D\u0430 plus","upgrade to plus","upgrade plan","\u043F\u0435\u0440\u0435\u0439\u0442\u0438 \u043D\u0430 \u043F\u043B\u0430\u0442\u043D\u044B\u0439"],r=["\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u043D\u043E\u0435 \u043E\u043A\u043D\u043E \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u043E","context window is full","you\u2019ve reached the context limit","you've reached the context limit","conversation is too long"],i=document.querySelectorAll('button, a, [role="button"]');for(let o=0;o<i.length;o++){let a=i[o],s=String(a.textContent||"").trim().toLowerCase();if(!s||!n.some(function(l){return s.indexOf(l)!==-1}))continue;let u=a.parentElement;for(let l=0;l<7&&u&&!(u===document.body||u===document.documentElement);l++){let c=String(u.textContent||"").toLowerCase();if(c.length>0&&c.length<=1200){for(let f=0;f<r.length;f++)if(c.indexOf(r[f])!==-1)return{active:!0,reason:"chatgpt-context-full"}}u=u.parentElement}}}catch(n){v(n,"adapter:chatgpt:context-saturation")}return{active:!1,reason:""}}},Yo=class extends qt{constructor(){super(),this.siteName="gemini",this.defaultModel="Gemini 2.5 Pro",p("log","[GeminiAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D")}isOnDialogPage(){try{let t=document.querySelector(".conversation-container")!==null,n=document.querySelector("rich-textarea, .input-area")!==null,r=t||n;return p("log",`[GeminiAdapter] isOnDialogPage: ${r}`),r}catch(t){return p("error","[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:",t),!1}}extractMessages(){try{let t=[],n=document.querySelectorAll("turn-container, .turn-container, [data-turn]");return p("log",`[GeminiAdapter] \u041D\u0430\u0439\u0434\u0435\u043D\u043E turn-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432: ${n.length}`),n.length>0&&n.forEach((r,i)=>{try{let o=r.querySelector('.user-query, [data-role="user"], .user-turn .query-text');if(o){let s=this._cleanText(o.textContent);s.length>0&&t.push({role:"user",content:s})}let a=r.querySelector('.model-response, [data-role="model"], .response-content, .assistant-turn .markdown');if(a){let s=this._cleanText(a.textContent);s.length>0&&t.push({role:"assistant",content:s})}}catch(o){p("error",`[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 turn #${i}:`,o)}}),t.length===0&&(p("log","[GeminiAdapter] \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E \u0437\u0430\u043F\u0430\u0441\u043D\u043E\u0439 \u043C\u0435\u0442\u043E\u0434 \u043F\u043E\u0438\u0441\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439"),document.querySelectorAll('.user-query, .query-text, [data-role="user"]').forEach(o=>{let a=this._cleanText(o.textContent);a.length>0&&t.push({role:"user",content:a})}),document.querySelectorAll('.model-response, .response-content, [data-role="model"]').forEach(o=>{let a=this._cleanText(o.textContent);a.length>0&&t.push({role:"assistant",content:a})})),p("log",`[GeminiAdapter] \u0412\u0441\u0435\u0433\u043E \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439: ${t.length}`),t}catch(t){return p("error","[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 extractMessages:",t),[]}}detectModel(){try{let t=document.querySelector('.model-name, .current-model, [aria-label*="model"]');if(t){let r=t.textContent.trim();return p("log",`[GeminiAdapter] \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C: ${r}`),r||""}let n=localStorage.getItem("gemini-selected-model");return n?(p("log",`[GeminiAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 localStorage: ${n}`),n):(p("log","[GeminiAdapter] \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430 \u2014 \u043E\u0442\u0434\u0430\u044E \u043F\u0443\u0441\u0442\u043E (\u0440\u0435\u0448\u0438\u0442 content)"),"")}catch(t){return p("error","[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 detectModel:",t),""}}_cleanText(t){return t?t.replace(/\s+/g," ").replace(/\n{3,}/g,`

`).trim():""}},yr=class extends Yo{constructor(){super(),this.siteName="aistudio",this.defaultModel="gemini-3.1-pro",p("log","[AistudioAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D")}isOnDialogPage(){try{let t=document.querySelector("ms-cmark-node")!==null;if(p("log",`[AistudioAdapter] isOnDialogPage: ${t}`),t)return!0;let n=this._netMessages().length;return n>0?(p("log",`[AistudioAdapter] isOnDialogPage: true (\u0441\u0435\u0442\u044C: ${n} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439)`),!0):!1}catch(t){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:",t),!1}}extractMessages(){try{let t=this._rawMessages();return this._mergeAssistantRuns(t.messages)}catch(t){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 extractMessages:",t),[]}}_rawMessages(){let t=this._netMessages();if(t.length>0)return p("log",`[AistudioAdapter] \u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0438\u0437 \u0441\u0435\u0442\u0438: ${t.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 (DOM \u043D\u0435 \u0447\u0438\u0442\u0430\u0435\u043C)`),{messages:t,kind:"net",source:"net"};let n=[],r=document.querySelectorAll("ms-cmark-node.v3-font-body");p("log",`[AistudioAdapter] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0443\u0437\u043B\u043E\u0432 \u0440\u0435\u043F\u043B\u0438\u043A: ${r.length}`),Array.prototype.forEach.call(r,(o,a)=>{try{if(this._isNestedNode(o)){p("log",`[AistudioAdapter] \u041F\u0440\u043E\u043F\u0443\u0441\u043A \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0433\u043E \u0443\u0437\u043B\u0430 #${a}`);return}let s=this._cleanText(this._readNodeText(o));if(s.length===0)return;n.push({role:this._isUserChunk(o)?"user":"assistant",content:s})}catch(s){p("error",`[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0443\u0437\u043B\u0430 #${a}:`,s)}}),p("log",`[AistudioAdapter] \u0412\u0441\u0435\u0433\u043E \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439: ${n.length}`);let i=this._domPeakMessages();return i.length>n.length?(p("log",`[AistudioAdapter] DOM \u043A\u043E\u0440\u043E\u0447\u0435 \u043F\u0438\u043A\u0430: ${n.length} < ${i.length} \u2014 \u0431\u0435\u0440\u0451\u043C sessionStorage`),{messages:i,kind:"dom",source:"peak"}):{messages:n,kind:"dom",source:"dom"}}capture(){let t=this._rawMessages(),n=typeof window<"u"&&window&&window.location?window.location:typeof location<"u"?location:null,r=String(n&&n.pathname||""),i=r.match(/prompts\/([A-Za-z0-9_-]+)/),o=i&&i[1]!=="new_chat"?i[1]:null,a=i?"prompts/"+i[1]:r;return{v:1,platform:"aistudio",kind:t.kind,convId:o,routeKey:a,capturedAt:Date.now(),complete:!0,messages:t.messages.map((s,u)=>({role:s.role,text:s.content,ordinal:u,nodeType:"message"}))}}detectModel(){try{let t=this._modelSlugFromDom()||(typeof window<"u"?window.__aiCmNetModelSlug:"");if(typeof t=="string"&&t)return p("log",`[AistudioAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 \u0441\u0435\u0442\u0438: ${t}`),t}catch(t){p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u0437 \u0441\u0435\u0442\u0438:",t)}return"gemini-3.1-pro"}_netMessages(){try{let n=typeof window<"u"?window.__aiCmNetMsgs:null;if(!n||!Array.isArray(n.msgs)||n.msgs.length===0)return[];let r=String(window.location&&window.location.pathname||""),i=String(n.href||"");if(i&&typeof URL=="function"){let a=i;try{a=new URL(i).pathname}catch{a=i}var t=function(s){var u=String(s||"").match(/(?:^|\/)prompts\/([A-Za-z0-9_-]+)/);return u?"prompts/"+u[1]:String(s||"")};if(a&&r&&t(a)!==t(r))return[]}let o=[];return Array.prototype.forEach.call(n.msgs,a=>{let s=a;if(!s||typeof s.text!="string")return;let u=typeof s.sections=="string"?s.sections:"",l=this._cleanText(s.text)+u;l.length!==0&&o.push({role:s.role==="assistant"||s.role==="model"?"assistant":"user",content:l})}),o}catch(n){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0441\u0435\u0442\u0435\u0432\u043E\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0438:",n),[]}}_domPeakMessages(){try{let n=typeof sessionStorage<"u"&&sessionStorage?sessionStorage:typeof window<"u"&&window&&window.sessionStorage?window.sessionStorage:null;if(!n)return[];let r=String(window.location&&window.location.pathname||""),i=/\/prompts\/([^\/?#]+)/.exec(r);if(!i||!i[1])return[];let o=n.getItem("ai_cm_aistudio_history_"+i[1]);if(!o)return[];let a=JSON.parse(o);if(!a||a.v!==1||!Array.isArray(a.msgs)||a.msgs.length===0)return[];let s=String(a.href||"");if(s&&typeof URL=="function"){let l=s;try{l=new URL(s).pathname}catch{l=s}var t=function(c){var f=String(c||"").match(/(?:^|\/)prompts\/([A-Za-z0-9_-]+)/);return f?"prompts/"+f[1]:String(c||"")};if(l&&r&&t(l)!==t(r))return[]}let u=[];return Array.prototype.forEach.call(a.msgs,l=>{let c=l;if(!c||typeof c.text!="string")return;let f=typeof c.sections=="string"?c.sections:"",d=this._cleanText(c.text)+f;d.length!==0&&u.push({role:c.role==="assistant"||c.role==="model"?"assistant":"user",content:d})}),u}catch(n){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u043F\u0438\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438:",n),[]}}_readNodeText(t){try{let n=t.innerText;return typeof n=="string"&&n.length>0?n:typeof t.textContent=="string"?t.textContent:""}catch(n){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0442\u0435\u043A\u0441\u0442\u0430 \u0443\u0437\u043B\u0430:",n),""}}_isNestedNode(t){try{let n=t&&t.parentElement;return!n||typeof n.closest!="function"?!1:n.closest("ms-cmark-node")!==null}catch(n){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0441\u0442\u0438:",n),!1}}_isUserChunk(t){try{return!!(t&&t.classList&&t.classList.contains("user-chunk"))}catch(n){return p("error","[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F classList:",n),!1}}_mergeAssistantRuns(t){if(!Array.isArray(t)||t.length===0)return t;let n=[];for(let r=0;r<t.length;r++){let i=t[r];if(!i||typeof i.content!="string")continue;let o=n.length?n[n.length-1]:null;o&&o.role==="assistant"&&i.role==="assistant"?o.content=o.content+`

`+i.content:n.push({role:i.role,content:i.content})}return n}_modelSlugFromDom(){try{let t=document.querySelectorAll("span, div");for(let n=0;n<t.length&&n<3e3;n++){let r=t[n];if(r.children&&r.children.length>0)continue;let i=String(r.textContent||"").trim();if(!i||i.length>48)continue;let o=i.match(/^(gemini-[a-z0-9][a-z0-9.-]{1,40})$/i);if(o)return o[1].toLowerCase()}}catch{return""}return""}};typeof le<"u"&&le.exports&&(le.exports=yr);var Eu=class extends qt{constructor(){super(),this.siteName="deepseek",p("log","[DeepSeekAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D")}isOnDialogPage(){let t=document.querySelectorAll('div[class*="ds-message"]').length>0,n=document.querySelector("textarea")!==null;return t||n}_thinkSelector(){return'[class*="ds-think"], [class*="think-content"], [class*="ds-reason"], [data-testid*="think"]'}_hasThinkMarker(t){try{if(!t)return!1;let n=String(t.className||"");if(/ds-think|think-content|ds-reason/i.test(n)||typeof t.querySelector=="function"&&t.querySelector(this._thinkSelector()))return!0;let r=String(t.textContent||"").trim();return/^(?:deepthink|deep\s*think|thought|thinking|размышлен|думаю|思考)/i.test(r)}catch{return!1}}_answerMarkdown(t){try{return t?String(t.className||"").includes("ds-markdown")?t:(typeof t.querySelector=="function"?t.querySelector(".ds-markdown"):null)||null:null}catch{return null}}_isReasoningOnly(t){try{return!t||this._answerMarkdown(t)?!1:this._hasThinkMarker(t)}catch{return!1}}_isInsideReasoning(t){try{return t?/ds-think|think-content|ds-reason/i.test(String(t.className||""))?!0:typeof t.closest=="function"&&!!t.closest(this._thinkSelector()):!1}catch{return!1}}_textWithoutReasoning(t){try{let n=t.cloneNode(!0);return Array.prototype.slice.call(n.querySelectorAll(this._thinkSelector())).forEach(r=>r.remove()),n.querySelectorAll('button, svg, [class*="avatar"], [class*="icon"], [class*="toolbar"]').forEach(r=>r.remove()),n.textContent.trim()}catch{return""}}_stripReasoningHeader(t){try{return String(t??"").trim().replace(/^(?:deepthink|deep\s?think|thought|thinking|размышлен[а-яё]*|思考)\s*(?:[·:•\-–—]\s*\d+\s*(?:с|s|sec|сек|seconds?)?)?\s*[:·]?\s*/i,"").trim()}catch{return String(t??"").trim()}}_reasoningText(t){try{if(!t)return"";let n=[];if(this._isInsideReasoning(t))n.push(t);else if(typeof t.querySelectorAll=="function"){let i=t.querySelectorAll(this._thinkSelector());for(let o=0;o<i.length;o++)n.push(i[o])}let r=[];for(let i=0;i<n.length;i++){let o=this._stripReasoningHeader(n[i].textContent||"");o&&this._hasRealContent(o)&&r.push(o)}return r.join(`

`).trim()}catch{return""}}_hasRealContent(t){return/[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(String(t??""))}_firstContentChild(t){try{let n=t.querySelectorAll('div:not([class*="avatar"]):not([class*="button"]):not([class*="icon"])');for(let r=0;r<n.length;r++)if(!this._isInsideReasoning(n[r]))return n[r]}catch(n){v(n,"adapter:deepseek:firstContentChild")}return null}_detectRole(t){let n=t.className||"";if(n.includes("d29f3d7d"))return"user";if(n.includes("ds-markdown")||n.includes("ds-assistant-message"))return"assistant";try{if(t.querySelector&&t.querySelector(".ds-markdown, .ds-markdown-paragraph")||this._isReasoningOnly(t))return"assistant"}catch(r){At(r,"adapter:deepseek:detectRole")}return"user"}_extractText(t){let n=this._answerMarkdown(t);if(n){let i=n.querySelectorAll(".ds-markdown-paragraph, p");if(i.length>0)return Array.from(i).map(o=>o.textContent.trim()).filter(Boolean).join(`
`)}let r=this._firstContentChild(t);return r?this._textWithoutReasoning(r):this._textWithoutReasoning(t)}extractMessages(){try{let t=[],n=document.querySelectorAll('div[class*="ds-message"]'),i=(typeof Ne=="function"?Ne():!1)?{totalFound:n.length,extracted:0,skippedNested:0,skippedReasoningOnly:0,skippedEmpty:0,skippedUnknown:0,skippedNoRealContent:0,classesSample:[],neighborInjections:[]}:null;if(i)try{let a=["BetterDeepSeek","BDS:","better-deepseek","bds-"],s=typeof document<"u"?document.documentElement||document.body:null,u=s?String(s.innerHTML||"").slice(0,5e4):"";for(let l=0;l<a.length;l++)u.indexOf(a[l])!==-1&&i.neighborInjections.push(a[l])}catch{}let o="";if(n.forEach((a,s)=>{if(i&&s<3&&i.classesSample.push(String(a.className||"").slice(0,60)),a.className?.includes("ds-markdown")&&a.parentElement?.className?.includes("ds-message")){i&&i.skippedNested++;return}if(this._isReasoningOnly(a)){i&&i.skippedReasoningOnly++;let c=this._reasoningText(a);c&&(o=o?o+`

`+c:c);return}let u=this._detectRole(a),l=this._extractText(a);if(l&&l.length>0&&u!=="unknown"&&this._hasRealContent(l)){let c={role:u,content:l};if(u==="assistant"){let f=this._reasoningText(a),d=[o,f].filter(Boolean).join(`

`).trim();d&&(c.hiddenReasoning=d),o=""}t.push(c),i&&i.extracted++}else i&&(!l||l.length===0?i.skippedEmpty++:u==="unknown"?i.skippedUnknown++:i.skippedNoRealContent++)}),o){for(let a=t.length-1;a>=0;a--)if(t[a].role==="assistant"){t[a].hiddenReasoning=t[a].hiddenReasoning?t[a].hiddenReasoning+`

`+o:o;break}}if(t.length>0&&p("log",`[DeepSeekAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E ${t.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u0440\u043E\u043B\u0438: ${t.map(a=>a.role.substring(0,4)).join(", ")}`),i&&typeof w=="function")try{w("o21-dom-extract",{site:this.siteName||"deepseek",totalFound:i.totalFound,extracted:i.extracted,skipNested:i.skippedNested,skipReasoningOnly:i.skippedReasoningOnly,skipEmpty:i.skippedEmpty,skipUnknown:i.skippedUnknown,skipNoRealContent:i.skippedNoRealContent,classesSample:i.classesSample.join(" | ")||"(\u043D\u0435\u0442)",neighborInjections:i.neighborInjections.join(",")||"(\u043D\u0435\u0442)"})}catch{}return t}catch(t){return p("error","[DeepSeekAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:",t),[]}}getFullDialogText(){return this.extractMessages().map(t=>t.content).join(`
`)}detectModel(){try{let t=document.querySelector('div.ds-toggle-button[aria-pressed="true"], div[class*="toggle-button"][aria-pressed="true"]');if(t&&t.textContent.includes("DeepThink"))return p("log","[DeepSeekAdapter] DeepThink \u0430\u043A\u0442\u0438\u0432\u0435\u043D \u2192 R1"),"deepseek-r1";let n=[".model-selector",".current-model",'[class*="model-switch"]',".model-name",'select[name="model"]','[aria-label*="model"]'];for(let i of n){let o=document.querySelector(i);if(o){let a=o.tagName==="SELECT"?o.options[o.selectedIndex]?.text||"":o.textContent.trim();if(a){if(p("log","[DeepSeekAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 UI:",a),a.toLowerCase().includes("r1"))return"deepseek-r1";if(a.toLowerCase().includes("v3"))return"deepseek-v3"}}}let r=localStorage.getItem("deepseek-selected-model")||localStorage.getItem("selected-model");if(r){if(p("log","[DeepSeekAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 localStorage:",r),r.toLowerCase().includes("r1"))return"deepseek-r1";if(r.toLowerCase().includes("v3"))return"deepseek-v3"}return"deepseek-v3"}catch(t){return p("error","[DeepSeekAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 detectModel:",t),"deepseek-v3"}}};function ul(){try{if(typeof window<"u"&&window.GoogleFolwrUtils&&typeof window.GoogleFolwrUtils.answerTextOf=="function"&&typeof window.GoogleFolwrUtils.answerDomNodes=="function")return window.GoogleFolwrUtils}catch{}try{if(typeof Nl=="function"){var e=(Js(),pm(Cd));if(e&&typeof e.answerTextOf=="function"&&typeof e.answerDomNodes=="function")return e}}catch{}return null}function Uy(e){var t=ul();if(t)try{return String(t.answerTextOf(e)||"")}catch(r){v(r,"adapter:google-search:answerText")}try{var n=e.cloneNode(!0);return n.querySelectorAll("script, style, button, svg").forEach(function(r){r.remove()}),String(n.textContent||"")}catch{return""}}function zy(e){var t=ul();if(t)try{var n=t.answerDomNodes(e);if(n)return n}catch(r){v(r,"adapter:google-search:answerNodes")}try{return e.querySelectorAll(".n6owBd.awi2gc")}catch{return[]}}var ku=class extends qt{constructor(){if(super(),this.siteName="google_search",this._lastNetworkModel="",this._lastExtractedCount=null,this._lastCodeBlockSig=null,console.log("[GoogleSearchAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (v2: AI-\u0440\u0435\u0436\u0438\u043C)"),typeof window<"u"){var t=this;try{window.addEventListener("ai-cm-full-history",function(n){var r=n,i=r&&r.detail;i&&i.modelSlug&&(t._lastNetworkModel=i.modelSlug)}),window.dispatchEvent(new CustomEvent("ai-cm-google-search-ready"))}catch{}}}isOnDialogPage(){var t=document.querySelector('[data-scope-id="turn"]')!==null,n=document.querySelector('[data-subtree="aimfl"]')!==null,r=document.querySelector('textarea, [contenteditable="true"]')!==null,i=t||n||r;return console.log("[GoogleSearchAdapter] \u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0434\u0438\u0430\u043B\u043E\u0433\u0430: "+i),i}extractMessages(){try{var t=document.querySelectorAll('[data-scope-id="turn"]');if(!t||t.length===0)return console.log("[GoogleSearchAdapter] Turn-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"),[];for(var n=[],r=0;r<t.length;r++){var i=t[r].querySelector("h2.iMqumd"),o=null;if(i){var a=i.textContent.trim(),s=a.match(/^(?:Вы сказали|You said|You asked):\s*"([\s\S]*)"$/)||a.match(/^Du hast Folgendes (?:gesagt|gesendet):\s*([\s\S]*)$/);s?o=s[1].trim():o=a}else{var u=ul();if(u&&typeof u.resolveUserQuestionForTurn=="function")try{o=u.resolveUserQuestionForTurn(document,t[r])}catch{o=null}}n.push(o)}for(var l=[],c=0;c<t.length;c++)l[c]=[];for(var f=zy(document),d=0;d<f.length;d++){for(var h=f[d],m=-1,y=0;y<t.length&&t[y].compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING;y++)m=y;if(m>=0&&m<t.length){var C=Uy(h).trim();C&&l[m].push(C)}}try{if(typeof Ne=="function"&&Ne()&&typeof w=="function"){for(var S=[".n6owBd.awi2gc pre",".n6owBd.awi2gc code",'[data-subtree="aimfl"] pre','[data-subtree="aimfl"] code',"pre","code"],b=null,x="",M=0;M<S.length&&!b;M++)b=document.querySelector(S[M]),b&&(x=S[M]);var k=b?x+"|"+b.tagName+"|"+String(b.className||"")+"|"+b.textContent.length:"none";if(k!==this._lastCodeBlockSig)if(this._lastCodeBlockSig=k,!b)w("gsa-code-block",{found:0,via:"(\u043D\u0435\u0442)",blocks:f.length,turns:t.length});else{var A=b.parentElement;w("gsa-code-block",{found:1,via:x,tag:b.tagName,cls:String(b.className||"").slice(0,120),childs:b.childNodes.length,textLen:b.textContent.length,parentTag:A&&A.tagName||"",parentCls:A&&String(A.className||"").slice(0,120)||"",html500:String(b.outerHTML||"").replace(/\s+/g," ").slice(0,500)})}}}catch{}for(var G=[],H=0;H<t.length;H++){var N=l[H].length>0?l[H].join(`

`):null;if(!N){var D=document.querySelectorAll('[data-subtree="aimfl"]');if(D[H]){var L=D[H].textContent.trim();L&&(N=L)}}G.push(N)}for(var z=[],X=0;X<Math.min(n.length,G.length);X++){let ee=n[X];ee&&z.push({role:"user",content:ee});let J=G[X];J&&z.push({role:"assistant",content:J})}return z.length!==this._lastExtractedCount&&(this._lastExtractedCount=z.length,console.log("[GoogleSearchAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E "+z.length+" \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439")),z}catch(ee){return p("error","[GoogleSearchAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:",ee),[]}}getFullDialogText(){return this.extractMessages().map(function(t){return t.content}).join(`
`)}detectModel(){return this._lastNetworkModel?this._lastNetworkModel:""}},Mu=class extends qt{constructor(){if(super(),this.siteName="claude",this.defaultModel="claude-sonnet-4-6",p("debug","[ClaudeAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D"),this._lastNetworkModel="",this._modelLogSent=!1,this._stubLogConvId="",typeof window<"u"){var t=this;try{window.addEventListener("ai-cm-full-history",function(n){var r=n,i=r&&r.detail;i&&i.modelSlug&&t.siteName==="claude"&&(t._lastNetworkModel=i.modelSlug)})}catch{}}}isOnDialogPage(){try{var t=window.location.hostname,n=window.location.pathname,r=t==="claude.ai"&&n.indexOf("/chat/")===0;return p("debug","[ClaudeAdapter] isOnDialogPage: "+r),r}catch(i){return p("error","[ClaudeAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:",i),!1}}extractMessages(){var t="";try{t=(typeof T=="function"?T():"")||window.location&&window.location.pathname||""}catch{t=""}return t!==this._stubLogConvId&&(this._stubLogConvId=t,p("debug","[ClaudeAdapter] extractMessages: \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u2014 \u0441\u0435\u0442\u044C)")),[]}detectModel(){try{if(this._lastNetworkModel)return this._modelLogSent||(this._modelLogSent=!0,p("debug","[ClaudeAdapter] \u043C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 \u0441\u0435\u0442\u0438: "+this._lastNetworkModel)),this._lastNetworkModel}catch{}return this.defaultModel}_cleanText(t){return t?t.replace(/\s+/g," ").replace(/\n{3,}/g,`

`).trim():""}},Iu=class extends qt{constructor(){if(super(),this.siteName="perplexity",this.defaultModel="turbo",p("debug","[PerplexityAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D"),this._lastNetworkModel="",this._modelLogSent=!1,this._stubLogConvId="",typeof window<"u"){var t=this;try{window.addEventListener("ai-cm-full-history",function(n){var r=n,i=r&&r.detail;i&&i.modelSlug&&t.siteName==="perplexity"&&(t._lastNetworkModel=i.modelSlug)})}catch{}}}isOnDialogPage(){try{var t=window.location.hostname,n=window.location.pathname,r=(t==="www.perplexity.ai"||t==="perplexity.ai")&&(n.indexOf("/search/")===0||n.indexOf("/thread/")===0||n.indexOf("/session/")===0);return p("debug","[PerplexityAdapter] isOnDialogPage: "+r),r}catch(i){return p("error","[PerplexityAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:",i),!1}}extractMessages(){var t="";try{t=(typeof T=="function"?T():"")||window.location&&window.location.pathname||""}catch{t=""}return t!==this._stubLogConvId&&(this._stubLogConvId=t,p("debug","[PerplexityAdapter] extractMessages: \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u2014 \u0441\u0435\u0442\u044C)")),[]}detectModel(){try{if(this._lastNetworkModel)return this._modelLogSent||(this._modelLogSent=!0,p("debug","[PerplexityAdapter] \u043C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 \u0441\u0435\u0442\u0438: "+this._lastNetworkModel)),this._lastNetworkModel}catch{}return this.defaultModel}_cleanText(t){return t?t.replace(/\s+/g," ").replace(/\n{3,}/g,`

`).trim():""}},tg={ADDRESS:!0,ARTICLE:!0,ASIDE:!0,BLOCKQUOTE:!0,DD:!0,DETAILS:!0,DIALOG:!0,DIV:!0,DL:!0,DT:!0,FIELDSET:!0,FIGCAPTION:!0,FIGURE:!0,FOOTER:!0,FORM:!0,H1:!0,H2:!0,H3:!0,H4:!0,H5:!0,H6:!0,HEADER:!0,HR:!0,LI:!0,MAIN:!0,NAV:!0,OL:!0,P:!0,PRE:!0,SECTION:!0,TABLE:!0,TD:!0,TH:!0,TR:!0,UL:!0},gu="ai-cm-qwen-cut",vr=class extends qt{constructor(){super(),this.siteName="qwen",this.dialogContainerSelector='#chat-container, [class*="chat-container"], main',this.userMessageSelector=['[data-message-role="user"]','[data-role="user"]','[class*="user-message"]','[class*="message-user"]'].join(", "),this.modelMessageSelector=['[data-message-role="assistant"]','[data-role="assistant"]','[class*="assistant-message"]','[class*="message-assistant"]'].join(", "),this._messageSelectors=[".qwen-chat-message.qwen-chat-message-user, .qwen-chat-message.qwen-chat-message-assistant","[data-message-id]","[data-message-role]","[data-role][data-message-index]",'[class*="message-row"]','[class*="message-item"]','[class*="message-bubble"]','[class*="chat-message"]:not(.qwen-chat-message-select-turn)'],this._reasoningSelectors=['[class*="thinking"]:not([class*="tool-status-card"])','[class*="thought"]:not([class*="tool-status-card"])','[data-testid*="think"]:not([class*="tool-status-card"])'].join(", "),this._noiseSelectors='button, svg, textarea, [class*="toolbar"], [class*="action"], [class*="footer"], [class*="input"], [class*="avatar"], [class*="icon"], [class*="copy"], [class*="tool-status-card"]',this._mcpPanelSelectors='.qwen-mcp-tool-call-panel, [class*="mcp-tool-call-panel"]'}static get _BLOCK_TAGS(){return tg}_hasComposer(){try{return!!document.querySelector('textarea[placeholder*="Qwen"], textarea[placeholder*="qwen"]')||!!document.querySelector('textarea[placeholder*="\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C"], textarea[placeholder*="Ask"]')}catch{return!1}}isOnDialogPage(){try{return!/chat\.qwen\.ai$/i.test(String(location.hostname||""))&&String(location.hostname||"").indexOf("qwen.ai")===-1?!1:this._hasComposer()||this._messageNodes().length>0||/\/c\//.test(location.pathname)}catch{return!1}}_messageNodes(){for(let t=0;t<this._messageSelectors.length;t++){let n=this._safeQuerySelectorAll(this._messageSelectors[t]);if(n&&n.length>0)return this._dropTurnOnlyNodes(Array.prototype.slice.call(n))}return[]}_dropTurnOnlyNodes(t){return t.filter(function(n){return String(n&&n.className||"").toLowerCase().indexOf("select-turn")===-1})}_readableText(t){try{if(!t)return"";let n="";try{n=t.innerText??""}catch{n=""}return(typeof n!="string"||n.length===0)&&(n=this._innerTextFallback(t)),this._normalizeLines(n)}catch{return""}}_innerTextFallback(t){try{let n="",r=tg,i=function(o){let a=o.nodeType;if(a===3){n+=o.nodeValue||"";return}if(a===8){String(o.nodeValue||"")===gu&&(n+=`
`);return}if(a!==1)return;let s=String(o.tagName||"").toUpperCase();if(s==="BR"){n+=`
`;return}r[s]===!0&&n.length>0&&n.charAt(n.length-1)!==`
`&&(n+=`
`);let u=o.childNodes||[];for(let l=0;l<u.length;l++)i(u[l]);r[s]===!0&&n.length>0&&n.charAt(n.length-1)!==`
`&&(n+=`
`)};return i(t),n}catch{return""}}_normalizeLines(t){try{return String(t??"").replace(/\r\n?/g,`
`).replace(/[ \t]+\n/g,`
`).replace(/\n{2,}/g,`
`).trim()}catch{return String(t??"").trim()}}_removeKeepingCut(t){Array.prototype.slice.call(t).forEach(function(n){try{n.parentNode&&n.parentNode.insertBefore(document.createComment(gu),n)}catch{}n.remove()})}_detachJournal(t,n){Array.prototype.slice.call(t).forEach(function(r){try{let i=r.parentNode;if(!i)return;let o=document.createComment(gu);i.insertBefore(o,r),n.push({node:r,parent:i,marker:o,next:r.nextSibling}),r.remove()}catch(i){v(i,"adapter:qwen:mcp-detach")}})}_restoreJournal(t){for(let n=t.length-1;n>=0;n--){let r=t[n];try{r.marker&&r.marker.parentNode&&r.marker.parentNode.removeChild(r.marker),r.next&&r.next.parentNode===r.parent?r.parent.insertBefore(r.node,r.next):r.parent.appendChild(r.node)}catch(i){v(i,"adapter:qwen:mcp-restore")}}}_mcpPanelsOf(t){let n=[];try{let r=t.querySelectorAll(this._mcpPanelSelectors);for(let i=0;i<r.length;i++){let o=r[i],a=!1;for(let s=0;s<n.length;s++)if(n[s].contains(o)){a=!0;break}a||n.push(o)}}catch(r){v(r,"adapter:qwen:mcp-panels")}return n}_mcpPanelText(t){try{if(!t)return"";let r=typeof t.getClientRects=="function"&&t.getClientRects().length>0?this._normalizeLines(this._readableText(t)):"",i=t.cloneNode(!0);this._removeKeepingCut(i.querySelectorAll(this._noiseSelectors));let o=this._normalizeLines(this._innerTextFallback(i));return o.length>r.length?o:r}catch{return""}}_textWithoutReasoning(t){if(!t)return"";let n=[];try{let r=this._mcpPanelsOf(t),i=[];for(let s=0;s<r.length;s++){let u=this._mcpPanelText(r[s]);u&&i.push(u)}this._detachJournal(r,n),this._detachJournal(t.querySelectorAll(this._noiseSelectors),n),this._detachJournal(t.querySelectorAll(this._reasoningSelectors),n);let o=this._readableText(t),a=i.join(`
`);return a?o?o+`
`+a:a:o}catch{return""}finally{this._restoreJournal(n)}}_stripReasoningHeader(t){try{var n=String(t??"").trim(),r=/^(?:завершено\s+размышлени[ея]|размышлени[ея]|размышляю|thinking|thought|思考)[\s.…·:•\-–—]*[\[(]?\s*(?:\d+\s*(?:с|s|sec|сек|seconds?)?)?\s*[\])]?\s*[·:•\-–—]?\s*/i;return n.replace(r,"").trim()}catch{return String(t??"").trim()}}_reasoningText(t){try{if(!t)return"";let n=[];if(typeof t.matches=="function"&&t.matches(this._reasoningSelectors))n.push(t);else if(typeof t.querySelectorAll=="function"){let i=t.querySelectorAll(this._reasoningSelectors);for(let o=0;o<i.length;o++)n.push(i[o])}let r=[];for(let i=0;i<n.length;i++){let o=n[i];if(this._isToolStatusCard(o))continue;let a=this._stripReasoningHeader(this._readableText(o));a&&/[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(a)&&r.push(a)}return r.join(`

`).trim()}catch{return""}}_isToolStatusCard(t){try{return String(t&&t.className||"").toLowerCase().indexOf("tool-status-card")!==-1}catch{return!1}}_detectRole(t){try{let n=String(t.className||"").toLowerCase();if(n.indexOf("qwen-chat-message-user")!==-1)return"user";if(n.indexOf("qwen-chat-message-assistant")!==-1)return"assistant";if(/user/.test(n))return"user";if(/assistant|model|bot|answer/.test(n)||t.querySelector&&t.querySelector(this.modelMessageSelector)||t.querySelector&&t.querySelector('[class*="markdown"], [class*="prose"]'))return"assistant"}catch(n){At(n,"adapter:qwen:detectRole")}return"user"}_dropContainerNodes(t){try{var n=this._containerDrop();if(typeof n=="function")return n(t)}catch(r){At(r,"adapter:qwen:dropContainerNodes")}return t}_containerDrop(){try{if(typeof Be<"u"&&Be&&typeof Be.aiCmDropContainerMessages=="function")return Be.aiCmDropContainerMessages}catch{}try{if(typeof window<"u"&&window&&window.AiCmExportBuilders&&typeof window.AiCmExportBuilders.aiCmDropContainerMessages=="function")return window.AiCmExportBuilders.aiCmDropContainerMessages}catch{}return null}extractMessages(){try{let t=[],n=this._messageNodes(),r=!1;try{r=typeof window<"u"&&!!window&&window.__aiCmDebugLogs===!0||typeof sessionStorage<"u"&&sessionStorage.getItem("aiCmDebug")==="1"}catch(d){v(d,"adapter:qwen:node-diag-flag")}let i=[],o=0,a=0,s=0,u=0;for(let d=0;d<n.length;d++){let h=n[d],m=this._detectRole(h),y=0,C=0,S=0,b=0,x=0;if(r)try{y=(h.textContent||"").length,C=typeof h.innerText=="string"?String(h.innerText).length:0;let A=this._mcpPanelsOf(h);S=A.length;for(let G=0;G<A.length;G++)b+=(A[G].textContent||"").length,x+=this._mcpPanelText(A[G]).length;o+=y,a+=C,s+=b,u+=x}catch(A){v(A,"adapter:qwen:node-diag")}let M=this._textWithoutReasoning(h);if(!M||M.length===0){r&&i.push([d,m==="user"?"u":"a",y,C,S,b,x,0,"empty"]);continue}if(!/[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(M)){r&&i.push([d,m==="user"?"u":"a",y,C,S,b,x,M.length,"noalnum"]);continue}let k={role:m,content:M};if(m==="assistant"){let A=this._reasoningText(h);A&&(k.hiddenReasoning=A)}t.push(k),r&&i.push([d,m==="user"?"u":"a",y,C,S,b,x,M.length,"kept"])}let l=t.slice(),c=this._dropContainerNodes(t),f=t.length-c.length;if(f>0&&(t.length=0,Array.prototype.push.apply(t,c)),t.length>0&&p("log",`[QwenAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E ${t.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432 \u043E\u0442\u0431\u0440\u043E\u0448\u0435\u043D\u043E: ${f}, \u0440\u043E\u043B\u0438: ${t.map(d=>String(d.role).substring(0,4)).join(", ")}`),r)try{let d=[];for(let m=0;m<l.length;m++)if(c.indexOf(l[m])===-1){let y=String(l[m].content||"");d.push([m,y.length,y.slice(0,60).replace(/[\r\n\t]+/g," ")])}let h=0;for(let m=0;m<t.length;m++)h+=t[m].content.length;console.log("[QwenAdapter][node-diag] "+JSON.stringify({nodes:n.length,beforeDrop:l.length,afterDrop:t.length,sumTC:o,sumIT:a,sumPanelRaw:s,sumPanelRead:u,sumKept:h,rows:i,dropped:d}))}catch(d){v(d,"adapter:qwen:node-diag-dump")}return t}catch(t){return p("error","[QwenAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:",t),[]}}capture(){let t="";try{t=String(typeof location<"u"&&location&&location.pathname||"")}catch{t=""}let n=t.match(/\/c\/([A-Za-z0-9_-]+)/),r=n?n[1]:null,i=this.extractMessages();return{v:1,platform:"qwen",kind:"dom",convId:r,routeKey:n?"c/"+n[1]:t,capturedAt:Date.now(),complete:!0,messages:i.map((o,a)=>({role:o.role,text:o.content,ordinal:a,nodeType:"message"}))}}getFullDialogText(){try{return this.extractMessages().map(t=>t.content).join(`
`)}catch{return""}}detectModel(){try{let t=['[class*="model"] [class*="name"]','[class*="model-select"]','[class*="modelName"]'];for(let n=0;n<t.length;n++){let r=this._safeQuerySelector(t[n]);if(!r)continue;let i=String(r.textContent||"").trim();if(!i)continue;let o=/qwen[0-9.]*-[a-z]+/i.exec(i);if(o)return o[0].toLowerCase()}}catch(t){v(t,"adapter:qwen:detectModel")}return null}};typeof le<"u"&&le.exports&&(le.exports=vr);var g=null,bn=null,U=!1,je=-1,gi=null,q=null,be=null,Cr=!1,Ae=0,B=null,Ee="",Pn=!1,Si=!1,Ai={},Ti={},On={},Ei={},P="",R=0,I=!1,br=0,dr=-1,kt=!1,E=!1,ll="",xn=!1,xr=null,ea=null,ta=null,ar=null,na=null,ra=null,ng=null,Se={},Bn=!1,tt=null,lt=[],Q=[],Ct=null,nn=null,ki=40,Mt=!1,pi=null,Ie=null,me=null,Ze=null,Bt="",nt=null,We="",Xe=0,Qe=null,xe=0,vn=null,yt=0,sn=!1,It="",Gt="",ft=0,jt="",un="",_u=null,mi=!1,gt=null,wr=null,Mi=null,Yt=null,Nt=null,Fn=null,ia=null,we="",oa="",aa={},Ii={},Sr={},_i={},Tt="",_e={enabled:!1,pct:90,fmt:"txt"},hi=!1,Pe={},he=Object.create(null),yi=Object.create(null),rt={},ct=Object.create(null),vi=null,sa="",it={},ue=-1,Et=null,bt={},Ar={},Ru=1e4,ua={};function Lu(e){var t=String(e||"").trim();t&&(Ar[t]=Date.now())}function Ri(e){var t=String(e||"").trim();t&&delete Ar[t]}function ln(e){var t=String(e||"").trim();if(!t)return!1;var n=Ar[t];return n?Date.now()-Number(n)<Ru?!0:(delete Ar[t],!1):!1}var vt={},Sn={},Ht={},Gn={},Li={},gr={},Oi={},la=10,Ky=function(){try{return typeof chrome<"u"&&!!chrome.runtime&&typeof chrome.runtime.sendMessage=="function"}catch{return!1}};function Vi(e){return new Promise(function(t){try{if(!Ky()){t(null);return}chrome.runtime.sendMessage(e,function(n){var r=null;try{r=chrome.runtime.lastError}catch{r=null}t(r?null:n||null)})}catch{t(null)}})}function dp(){return Vi({type:"aiCm-latch-get-all"}).then(function(e){return e&&typeof e=="object"&&e.map?e.map:{}}).catch(function(){return{}})}function gp(e,t){return Vi({type:"aiCm-latch-set",service:String(e||""),convId:String(t||"")}).then(function(n){return!!(n&&n.ok)}).catch(function(){return!1})}function ca(e,t){return Vi({type:"aiCm-latch-remove",service:String(e||""),convId:String(t||"")}).then(function(n){return!!(n&&n.ok)}).catch(function(){return!1})}(function(){let e={};Object.defineProperty(e,"currentAdapter",{enumerable:!0,get:function(){return g},set:function(t){g=t}}),Object.defineProperty(e,"observer",{enumerable:!0,get:function(){return bn},set:function(t){bn=t}}),Object.defineProperty(e,"isInitialized",{enumerable:!0,get:function(){return U},set:function(t){U=t}}),Object.defineProperty(e,"lastPercentage",{enumerable:!0,get:function(){return je},set:function(t){je=t}}),Object.defineProperty(e,"updateTimer",{enumerable:!0,get:function(){return gi},set:function(t){gi=t}}),Object.defineProperty(e,"widgetElement",{enumerable:!0,get:function(){return q},set:function(t){q=t}}),Object.defineProperty(e,"lastWidgetData",{enumerable:!0,get:function(){return be},set:function(t){be=t}}),Object.defineProperty(e,"badgeSuppressed",{enumerable:!0,get:function(){return Cr},set:function(t){Cr=t}}),Object.defineProperty(e,"maxTokenCount",{enumerable:!0,get:function(){return Ae},set:function(t){Ae=t}}),Object.defineProperty(e,"lastTokensSnapshot",{enumerable:!0,get:function(){return B},set:function(t){B=t}}),Object.defineProperty(e,"aiCmWidgetDataFromSnapshot",{enumerable:!0,get:function(){return Qi}}),Object.defineProperty(e,"aiCmStatePatchFromSnapshot",{enumerable:!0,get:function(){return cl}}),Object.defineProperty(e,"aiCmBaseSource",{enumerable:!0,get:function(){return Ee},set:function(t){Ee=t}}),Object.defineProperty(e,"restoredTapeLoaded",{enumerable:!0,get:function(){return Pn},set:function(t){Pn=t}}),Object.defineProperty(e,"restoreDone",{enumerable:!0,get:function(){return Si},set:function(t){Si=t}}),Object.defineProperty(e,"cacheRefreshPlanned",{enumerable:!0,get:function(){return Ai},set:function(t){Ai=t}}),Object.defineProperty(e,"tapeRestoreSeen",{enumerable:!0,get:function(){return Ti},set:function(t){Ti=t}}),Object.defineProperty(e,"aiCmTapeAccountIdx",{enumerable:!0,get:function(){return On},set:function(t){On=t}}),Object.defineProperty(e,"aiCmRestoredDispatched",{enumerable:!0,get:function(){return Ei},set:function(t){Ei=t}}),Object.defineProperty(e,"baseText",{enumerable:!0,get:function(){return P},set:function(t){P=t}}),Object.defineProperty(e,"baseCount",{enumerable:!0,get:function(){return R},set:function(t){R=t}}),Object.defineProperty(e,"baseSeen",{enumerable:!0,get:function(){return I},set:function(t){I=t}}),Object.defineProperty(e,"baseComplete",{enumerable:!0,get:function(){return E},set:function(t){E=t}}),Object.defineProperty(e,"lastBounded",{enumerable:!0,get:function(){return xn},set:function(t){xn=t}}),Object.defineProperty(e,"lastTailSig",{enumerable:!0,get:function(){return xr},set:function(t){xr=t}}),Object.defineProperty(e,"lastBaseSig",{enumerable:!0,get:function(){return ea},set:function(t){ea=t}}),Object.defineProperty(e,"lastEmitSig",{enumerable:!0,get:function(){return ta},set:function(t){ta=t}}),Object.defineProperty(e,"lastDrawSig",{enumerable:!0,get:function(){return ar},set:function(t){ar=t}}),Object.defineProperty(e,"lastHybridTailSig",{enumerable:!0,get:function(){return na},set:function(t){na=t}}),Object.defineProperty(e,"lastMetricSig",{enumerable:!0,get:function(){return ra},set:function(t){ra=t}}),Object.defineProperty(e,"notCompleteLogged",{enumerable:!0,get:function(){return Se},set:function(t){Se=t}}),Object.defineProperty(e,"aiCmLoaderFreeze",{enumerable:!0,get:function(){return Bn},set:function(t){Bn=t}}),Object.defineProperty(e,"baseIdSet",{enumerable:!0,get:function(){return tt},set:function(t){tt=t}}),Object.defineProperty(e,"lastBaseIds",{enumerable:!0,get:function(){return lt},set:function(t){lt=t}}),Object.defineProperty(e,"lastBaseTexts",{enumerable:!0,get:function(){return Q},set:function(t){Q=t}}),Object.defineProperty(e,"baseSkelSet",{enumerable:!0,get:function(){return Ct},set:function(t){Ct=t}}),Object.defineProperty(e,"baseAnchors",{enumerable:!0,get:function(){return nn},set:function(t){nn=t}}),Object.defineProperty(e,"ANCHOR_MIN",{enumerable:!0,get:function(){return ki},set:function(t){ki=t}}),Object.defineProperty(e,"stale",{enumerable:!0,get:function(){return Mt},set:function(t){Mt=t}}),Object.defineProperty(e,"staleTimer",{enumerable:!0,get:function(){return pi},set:function(t){pi=t}}),Object.defineProperty(e,"lastDetailMessages",{enumerable:!0,get:function(){return Ie},set:function(t){Ie=t}}),Object.defineProperty(e,"lastHistoryWroteKey",{enumerable:!0,get:function(){return me},set:function(t){me=t}}),Object.defineProperty(e,"lastThreadId",{enumerable:!0,get:function(){return Ze},set:function(t){Ze=t}}),Object.defineProperty(e,"detectedModelSlug",{enumerable:!0,get:function(){return Bt},set:function(t){Bt=t}}),Object.defineProperty(e,"lastResolvedModelId",{enumerable:!0,get:function(){return nt},set:function(t){nt=t}}),Object.defineProperty(e,"lastSnapshotModelName",{enumerable:!0,get:function(){return We},set:function(t){We=t}}),Object.defineProperty(e,"netAttachTokens",{enumerable:!0,get:function(){return Xe},set:function(t){Xe=t}}),Object.defineProperty(e,"netAttachBreak",{enumerable:!0,get:function(){return Qe},set:function(t){Qe=t}}),Object.defineProperty(e,"netServerTokens",{enumerable:!0,get:function(){return xe},set:function(t){xe=t}}),Object.defineProperty(e,"netEffectiveLen",{enumerable:!0,get:function(){return yt},set:function(t){yt=t}}),Object.defineProperty(e,"exactCountEnabled",{enumerable:!0,get:function(){return sn},set:function(t){sn=t}}),Object.defineProperty(e,"geminiApiKey",{enumerable:!0,get:function(){return It},set:function(t){It=t}}),Object.defineProperty(e,"lastCountTokensText",{enumerable:!0,get:function(){return Gt},set:function(t){Gt=t}}),Object.defineProperty(e,"lastCountTokensCache",{enumerable:!0,get:function(){return ft},set:function(t){ft=t}}),Object.defineProperty(e,"lastCountTokensConvId",{enumerable:!0,get:function(){return jt},set:function(t){jt=t}}),Object.defineProperty(e,"lastCountTokensErrorText",{enumerable:!0,get:function(){return un},set:function(t){un=t}}),Object.defineProperty(e,"countTokensTimer",{enumerable:!0,get:function(){return _u},set:function(t){_u=t}}),Object.defineProperty(e,"countTokensPending",{enumerable:!0,get:function(){return mi},set:function(t){mi=t}}),Object.defineProperty(e,"safePct",{enumerable:!0,get:function(){return gt},set:function(t){gt=t}}),Object.defineProperty(e,"popupRawModel",{enumerable:!0,get:function(){return wr},set:function(t){wr=t}}),Object.defineProperty(e,"popupRawPct",{enumerable:!0,get:function(){return Mi},set:function(t){Mi=t}}),Object.defineProperty(e,"popupModelId",{enumerable:!0,get:function(){return Yt},set:function(t){Yt=t}}),Object.defineProperty(e,"popupLimitPct",{enumerable:!0,get:function(){return Nt},set:function(t){Nt=t}}),Object.defineProperty(e,"aiCmLastDomEmitSig",{enumerable:!0,get:function(){return Fn},set:function(t){Fn=t}}),Object.defineProperty(e,"aiCmLastDomEmitConvId",{enumerable:!0,get:function(){return ia},set:function(t){ia=t}}),Object.defineProperty(e,"lastEmitConvId",{enumerable:!0,get:function(){return we},set:function(t){we=t}}),Object.defineProperty(e,"lastSnapConvId",{enumerable:!0,get:function(){return oa},set:function(t){oa=t}}),Object.defineProperty(e,"aiCmConvSourceByConv",{enumerable:!0,get:function(){return aa},set:function(t){aa=t}}),Object.defineProperty(e,"aiCmArchiveLoadStarted",{enumerable:!0,get:function(){return Ii},set:function(t){Ii=t}}),Object.defineProperty(e,"aiCmArchiveRestoredDispatched",{enumerable:!0,get:function(){return Sr},set:function(t){Sr=t}}),Object.defineProperty(e,"aiCmArchiveCountByConv",{enumerable:!0,get:function(){return _i},set:function(t){_i=t}}),Object.defineProperty(e,"aiCmSourceLabelNow",{enumerable:!0,get:function(){return Tt},set:function(t){Tt=t}}),Object.defineProperty(e,"autoExportSettings",{enumerable:!0,get:function(){return _e},set:function(t){_e=t}}),Object.defineProperty(e,"aiCmAutoExportFlagMissingLogged",{enumerable:!0,get:function(){return hi},set:function(t){hi=t}}),Object.defineProperty(e,"autoExportFired",{enumerable:!0,get:function(){return Pe},set:function(t){Pe=t}}),Object.defineProperty(e,"aiCmAutoExportFiredOnce",{enumerable:!0,get:function(){return he},set:function(t){he=t}}),Object.defineProperty(e,"aiCmAutoExportLastLogState",{enumerable:!0,get:function(){return yi},set:function(t){yi=t}}),Object.defineProperty(e,"autoExportPctBySite",{enumerable:!0,get:function(){return rt},set:function(t){rt=t}}),Object.defineProperty(e,"aiCmGsaNetworkCompleteLatch",{enumerable:!0,get:function(){return ct},set:function(t){ct=t}}),Object.defineProperty(e,"aiCmGsaNetworkCompleteThreadId",{enumerable:!0,get:function(){return vi},set:function(t){vi=t}}),Object.defineProperty(e,"autoExportLastConvId",{enumerable:!0,get:function(){return sa},set:function(t){sa=t}}),Object.defineProperty(e,"aiCmLoaderRunningByConv",{enumerable:!0,get:function(){return it},set:function(t){it=t}}),Object.defineProperty(e,"autoExportLastPct",{enumerable:!0,get:function(){return ue},set:function(t){ue=t}}),Object.defineProperty(e,"aiCmPendingHistWrite",{enumerable:!0,get:function(){return Et},set:function(t){Et=t}}),Object.defineProperty(e,"aiCmCursorLiveByConv",{enumerable:!0,get:function(){return bt},set:function(t){bt=t}}),Object.defineProperty(e,"aiCmNetPendingAtBySite",{enumerable:!0,get:function(){return Ar},set:function(t){Ar=t}}),Object.defineProperty(e,"aiCmNetPendingLogged",{enumerable:!0,get:function(){return ua},set:function(t){ua=t}}),Object.defineProperty(e,"AI_CM_NET_PENDING_TTL_MS",{enumerable:!0,get:function(){return Ru},set:function(t){Ru=t}}),Object.defineProperty(e,"aiCmNetSnapshotPendingStart",{enumerable:!0,get:function(){return Lu}}),Object.defineProperty(e,"aiCmNetSnapshotPendingEnd",{enumerable:!0,get:function(){return Ri}}),Object.defineProperty(e,"aiCmNetSnapshotPending",{enumerable:!0,get:function(){return ln}}),Object.defineProperty(e,"aiCmBaseConfirmedByConv",{enumerable:!0,get:function(){return vt},set:function(t){vt=t}}),Object.defineProperty(e,"aiCmLowConfidenceByConv",{enumerable:!0,get:function(){return Sn},set:function(t){Sn=t}}),Object.defineProperty(e,"aiCmPartialSoftByConv",{enumerable:!0,get:function(){return Ht},set:function(t){Ht=t}}),Object.defineProperty(e,"aiCmLateCheckByConv",{enumerable:!0,get:function(){return Gn},set:function(t){Gn=t}}),Object.defineProperty(e,"trimProbe",{enumerable:!0,get:function(){return Li},set:function(t){Li=t}}),Object.defineProperty(e,"preTrimExportFired",{enumerable:!0,get:function(){return gr},set:function(t){gr=t}}),Object.defineProperty(e,"trimRetryByConv",{enumerable:!0,get:function(){return Oi},set:function(t){Oi=t}}),Object.defineProperty(e,"TRIM_HEAD_IDS_N",{enumerable:!0,get:function(){return la},set:function(t){la=t}}),Object.defineProperty(e,"aiCmSwAsk",{enumerable:!0,get:function(){return Vi}}),Object.defineProperty(e,"aiCmLatchGetAll",{enumerable:!0,get:function(){return dp}}),Object.defineProperty(e,"aiCmLatchSet",{enumerable:!0,get:function(){return gp}}),Object.defineProperty(e,"aiCmLatchRemove",{enumerable:!0,get:function(){return ca}}),Object.defineProperty(e,"aiCmNetRawCount",{enumerable:!0,get:function(){return br},set:function(t){br=t}}),Object.defineProperty(e,"aiCmNetRawCountUsed",{enumerable:!0,get:function(){return dr},set:function(t){dr=t}}),typeof le<"u"&&le.exports&&(le.exports=e),typeof window<"u"&&(window.AiCmState=e)})();function $y(e,t){return!(e===!0||t===!0)}function Qi(e){return e?{percentage:e.percent,tokenEstimate:e.tokens,effectiveLimit:e.effectiveLimit,contextLimit:e.contextLimit,displayLimit:e.limit,windowLimit:typeof e.windowLimit=="number"?e.windowLimit:void 0,accountLimit:e.accountLimit===null||typeof e.accountLimit=="number"?e.accountLimit:void 0,limitPlan:e.limitPlan===null||typeof e.limitPlan=="string"?e.limitPlan:void 0,limitWarnings:Array.isArray(e.limitWarnings)?e.limitWarnings:void 0,saturated:e.saturated===!0?!0:void 0,modelName:e.modelName,attachBreak:e.attachBreak||null,quality:e.quality,readiness:e.readiness}:null}function cl(e){var t=Qi(e);return t?{percentage:t.percentage,tokenEstimate:t.tokenEstimate,displayLimit:t.displayLimit,effectiveLimit:t.effectiveLimit,contextLimit:t.contextLimit,windowLimit:t.windowLimit,accountLimit:t.accountLimit,limitPlan:t.limitPlan,limitWarnings:t.limitWarnings,saturated:t.saturated,modelName:t.modelName,attachBreak:t.attachBreak}:{}}function Ou(e){if(!e)return!1;for(var t=String(e).slice(-800).toLowerCase(),n=["you stopped","\u0432\u044B \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0438","\u043E\u0442\u0432\u0435\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D","\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E","generation stopped"],r=0;r<n.length;r++)if(t.indexOf(n[r])!==-1)return!0;return!1}function Vy(e,t){if(!t.convId)return e;if(!e||e.convId!==t.convId)return t;var n=typeof it<"u"&&it&&it[t.convId]||typeof Ui=="function"&&Ui(t.convId)===!0||typeof ln=="function"&&ln(t.site)===!0||!t.bodyHash;if(n){var r=Object.assign({},e);return r.stale=!!(e.bodyHash&&t.bodyHash&&e.bodyHash!==t.bodyHash),r.partial=!0,r.partialReason=r.stale?"stale":t.partial&&t.partialReason&&t.partialReason!=="stale"?t.partialReason:"incomplete",r}t.stale=!1,t.partial?t.partialReason=t.partialReason&&t.partialReason!=="stale"?t.partialReason:"incomplete":delete t.partialReason;var i=e.convId===t.convId&&e.site===t.site&&e.model===t.model&&e.src===t.src&&e.tokens===t.tokens&&e.percent===t.percent&&e.limit===t.limit&&(e.windowLimit||0)===(t.windowLimit||0)&&(e.accountLimit===void 0?null:e.accountLimit)===(t.accountLimit===void 0?null:t.accountLimit)&&(e.limitPlan||"")===(t.limitPlan||"")&&e.saturated===!0==(t.saturated===!0)&&e.partial===t.partial&&e.partialReason===t.partialReason&&e.baseComplete===!0==(t.baseComplete===!0)&&(e.bodyHash||"")===(t.bodyHash||"");return i?e:t}function Z(){var e="";return typeof Ye=="function"&&(e=Ye()||""),!e&&typeof T=="function"&&(e=T()||""),e||""}function He(e){var t=typeof B<"u"&&B?B:null;if(!t)return null;var n=typeof e=="string"?e:"";if(!n||!t.convId||n!==t.convId)return null;var r=Object.assign({},t);return r.ageMs=typeof r.capturedAt=="number"&&r.capturedAt>0&&r.capturedAt<=Date.now()?Date.now()-r.capturedAt:0,r.stale=t.stale===!0,r}function rg(e){if(!Array.isArray(e))return!1;for(var t=0;t<e.length;t++)if(Ou(String(e[t]||"")))return!0;return!1}function Hn(){return"ai_cm_safe_pct_"+dt()}var Pi=null;function Di(){var e=typeof Pi<"u"?Pi:null;if(e&&typeof e=="object"&&e.length===3){var t=parseInt(e[0],10),n=parseInt(e[1],10),r=parseInt(e[2],10);if(isFinite(t)&&isFinite(n)&&isFinite(r)&&t>=1&&n>=1&&r>=1&&t<=100&&n<=100&&r<=100&&t<n&&n<r)return[t,r]}return[70,95]}function Oa(e){let t=typeof Di=="function"?Di():[70,95];return e<t[0]?"#22c55e":e<t[1]?"#eab308":"#ef4444"}function qn(){return typeof gt=="number"&&gt>0?gt:typeof Nt=="number"&&Nt>0&&Nt!==100?Nt:null}function An(e){return e===null?K.computeDisplayLimit("",qn()):K.computeDisplayLimit(e,qn())}function pp(e,t){wr=e===void 0?null:e,Mi=t===void 0?null:t,fl()}function fl(){let e=K.resolvePopupModelId(wr),t=K.resolveLimitPct(Mi),n=e!==Yt||t!==Nt;Yt=e,Nt=t,n&&(p("log","[model-detect] H19 popup-override model="+(Yt||"\u0430\u0432\u0442\u043E")+" pct="+(Nt??"\u0430\u0432\u0442\u043E")),Wt(),U&&oe())}function mp(){try{if(!$()||!chrome.storage||!chrome.storage.sync)return;chrome.storage.sync.get(["selectedModel","customLimit"],function(e){try{pp(e&&e.selectedModel,e&&e.customLimit)}catch(t){v(t,"widget:loadPopupOverrides-callback")}})}catch(e){p("log","[model-detect] H19 popup-override load error: "+Wn(e))}}function Wt(){if(!q)return;let e=typeof qe=="function"?qe:function(o,a){return a},t=q.querySelector(".ai-cm-limit-text"),n=q.querySelector(".ai-cm-input");if(!t)return;let r=be?be.effectiveLimit:0,i=qn();if(i!=null){let o=Math.max(1,Math.round(i/100*r));t.textContent=e("content_panel_threshold","\u041F\u043E\u0440\u043E\u0433 "+i+"% = "+o.toLocaleString()+" \u0442\u043E\u043A",[String(i),o.toLocaleString()]),n&&(n.value=String(i))}else t.textContent=e("content_panel_auto_status","\u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433: "+r.toLocaleString()+" \u0442\u043E\u043A (= 100% \u0432 \u043F\u043E\u043B\u0435)",[r.toLocaleString()]),n&&(n.value="")}function hp(){let e=be?be.effectiveLimit:0,t=be?be.tokenEstimate:0;if(!(!e||!t||t<=0)){if(gt=Math.max(1,Math.round(t/e*1e3)/10),$())try{chrome.storage.sync.set({[Hn()]:gt})}catch(n){v(n,"widget:snapCurrentPct")}Wt(),oe()}}function dl(e){let t=parseFloat(e);if(isNaN(t)||t<=0){gl();return}if(gt=Math.round(t*10)/10,$())try{chrome.storage.sync.set({[Hn()]:gt})}catch(n){v(n,"widget:setSafePctFromInput")}Wt(),oe()}function gl(){if(gt=null,$())try{chrome.storage.sync.set({[Hn()]:null})}catch(e){v(e,"widget:resetSafePct")}Wt(),oe()}function Pu(e){if(!q)return;let t=q.querySelector(".ai-cm-input");if(!t)return;let n=parseFloat(t.value);isNaN(n)&&(n=100);let r=Math.round((n+e)*10)/10;r<1&&(r=1),r>100&&(r=100),dl(String(r))}var Du={aistudio:"google_search"};function yp(){let e=dt(),t=Du&&Du[e]||"";return t?{own:"ai_cm_safe_pct_"+e,legacy:"ai_cm_safe_pct_"+t}:null}function vp(e,t){return e!==void 0||typeof t!="number"||!(t>0)?null:t}function Fu(e){let t=typeof e=="function"?e:function(){},n=!1,r=function(i){n||(n=!0,t(i))};try{let i=yp();return!i||!$()?!1:(chrome.storage.sync.get([i.own,i.legacy],function(o){try{let a=vp(o?o[i.own]:void 0,o?o[i.legacy]:void 0);if(typeof a!="number"){r(null);return}try{chrome.storage.sync.set({[i.own]:a})}catch(s){v(s,"widget:aiCmMigrateSafePct-set")}r(a)}catch(a){v(a,"widget:aiCmMigrateSafePct-apply"),r(null)}}),!0)}catch(i){return v(i,"widget:aiCmMigrateSafePct"),r(null),!0}}function Ji(){typeof w=="function"&&w("gsa-state",{point:"resetConversationState",verdict:"reset",reason:"caller-see-src",doc:typeof Br=="function"?Br():"unknown",site:typeof g<"u"&&g&&g.siteName||"",threadId:typeof Je=="function"?Je():"",src:typeof pe=="function"?pe(1):""}),typeof window.__aiCmTraceSeq!="number"&&(window.__aiCmTraceSeq=0),p("log","[content-trace] RESET \u0432\u0438\u0434\u0436\u0435\u0442\u0430 seq="+(++window.__aiCmTraceSeq||(window.__aiCmTraceSeq=1))+" t="+Date.now());var e=typeof Z=="function"&&Z()||"",t=!!(e&&typeof B<"u"&&B&&B.convId&&B.convId===e);P="",R=0,I=!1,br=0,dr=-1,Ee="",E=!1,ll="",typeof Tg=="function"&&Tg(typeof Je=="function"&&Je()||"");try{Gn={},bt={}}catch{}try{vt={}}catch{}try{Sn={}}catch{}try{Ht={}}catch{}try{Li={},gr={},Oi={}}catch{}typeof np=="function"&&np(),xn=!1,Ae=0,!t&&typeof B<"u"&&(B=null),tt=null,Ct=null,nn=null,xr=null,lt=[],Q=[],Ie=null,de=null,me=null,Ze=null,Bt="",Xe=0,Qe=null,xe=0,yt=0,Gt="",ft=0,jt="",un="",t||(je=-1),nt=null,We="",Pn=!1,Ai={},Si=!1,Ti={},Ei={},Ii={},Sr={},_i={},we="",ue=-1;try{var n=T()||"",r=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,i=g&&g.siteName||"";if(i==="google_search"){var o=n||typeof Je=="function"&&Je()||"",a=typeof Ea=="function"?Ea(i,o):0,s=typeof zi!="function"||zi("spa-entry",i+"|"+o+"|fired="+a);s&&p("log","[AI CM][auto-export] site=google_search latch kept reason=spa-entry convId="+(n||"(threadId)"))}else if(r&&typeof r.resetAutoExportFired=="function"){var u=typeof Zu=="function"?Zu():0;if(u)p("log","[AI CM][auto-export] latch kept reason=already-exported convId="+(n||"(threadId)"));else{r.resetAutoExportFired(Pe,i,n);try{if(r.firedSessionKey){ca(i,n);var l=r.firedSessionKey(i,n);l&&typeof Ue=="object"&&Ue&&delete Ue[l]}}catch{}}}else n&&delete Pe[n]}catch{}if(Mt=!1,Gi(),q){let c=q.querySelector(".ai-widget-fill"),f=q.querySelector(".ai-widget-text"),d=q.querySelector(".ai-widget-tooltip");if(c){let h=2*Math.PI*43;c.style.strokeDasharray=String(h),c.style.strokeDashoffset=String(h),c.style.stroke=Oa(0)}f&&(f.textContent="\u2014"),typeof ug=="function"&&ug(q.querySelector(".ai-widget-circle"));try{typeof w=="function"&&typeof g<"u"&&g&&g.siteName==="qwen"&&w("qwen-badge",{ts:Date.now(),event:"placeholder",reason:"reset-conversation",convId:typeof T=="function"&&T()||""||"(none)",url:String(typeof location<"u"&&location&&location.href||"")})}catch{}if(d){let h=typeof qe=="function"?qe:function(m,y){return y};d.textContent=h("content_widget_loading","\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430...")}}Cr=!0,kt=!1,typeof Zg=="function"&&Zg(),be=null;try{Dn&&clearTimeout(Dn),Dn=null,Ju=!1}catch{}p("log","[content] \u0441\u043C\u0435\u043D\u0430 \u0447\u0430\u0442\u0430 \u2192 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u043E");try{$()&&chrome.storage&&chrome.storage.local&&chrome.storage.local.remove(["aiCmState","aiCmState:"+window.location.hostname])}catch(c){v(c,"widget:resetConversationState-localRemove")}try{typeof Bu=="function"&&Bu()}catch{}}var Nu={chatgpt:{font:"S\xF6hne, Inter, -apple-system, BlinkMacSystemFont, sans-serif",light:{bgTrack:"#f0f0f0",bgFill:"#10a37f",text:"#212121",tooltipBg:"#ffffff",tooltipText:"#212121",shadow:"0 2px 6px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)",border:"1px solid #e5e5e5"},dark:{bgTrack:"#2f2f2f",bgFill:"#19c37d",text:"#ececf1",tooltipBg:"#212121",tooltipText:"#ececf1",shadow:"0 2px 6px rgba(0,0,0,0.3)",border:"1px solid #424242"}},deepseek:{font:"Inter, system-ui, -apple-system, sans-serif",light:{bgTrack:"#e5e7eb",bgFill:"#4d6bfe",text:"#111827",tooltipBg:"#ffffff",tooltipText:"#111827",shadow:"0 4px 12px rgba(77, 107, 254, 0.1)",border:"1px solid #e5e7eb"},dark:{bgTrack:"#242b3d",bgFill:"#3d5afe",text:"#f3f4f6",tooltipBg:"#181f30",tooltipText:"#f3f4f6",shadow:"0 4px 20px rgba(0, 0, 0, 0.4)",border:"1px solid #2e374a"}},gemini:{font:'"Google Sans", Roboto, Arial, sans-serif',light:{bgTrack:"#e9eef6",bgFill:"url(#gemini-gradient)",text:"#1f1f1f",tooltipBg:"#e9eef6",tooltipText:"#1f1f1f",shadow:"0 4px 16px rgba(0,0,0,0.08)",border:"none"},dark:{bgTrack:"#37393b",bgFill:"url(#gemini-gradient)",text:"#e3e3e3",tooltipBg:"#1e1f20",tooltipText:"#e3e3e3",shadow:"0 4px 24px rgba(0,0,0,0.5)",border:"none"}},google_search:{font:'"Google Sans", Roboto, helvetica, arial, sans-serif',light:{bgTrack:"#f1f3f4",bgFill:"#1a73e8",text:"#3c4043",tooltipBg:"#ffffff",tooltipText:"#3c4043",shadow:"0 1px 6px rgba(32,33,36,0.28)",border:"1px solid #dadce0"},dark:{bgTrack:"#3c4043",bgFill:"#8ab4f8",text:"#e8eaed",tooltipBg:"#303134",tooltipText:"#e8eaed",shadow:"0 1px 6px rgba(0,0,0,0.4)",border:"1px solid #5f6368"}},aistudio:{font:'"Google Sans", Roboto, helvetica, arial, sans-serif',light:{bgTrack:"#f1f3f4",bgFill:"#1a73e8",text:"#3c4043",tooltipBg:"#ffffff",tooltipText:"#3c4043",shadow:"0 1px 6px rgba(32,33,36,0.28)",border:"1px solid #dadce0"},dark:{bgTrack:"#3c4043",bgFill:"#8ab4f8",text:"#e8eaed",tooltipBg:"#303134",tooltipText:"#e8eaed",shadow:"0 1px 6px rgba(0,0,0,0.4)",border:"1px solid #5f6368"}}};function dt(){let e=window.location.hostname;return e.includes("chatgpt.com")?"chatgpt":e.includes("deepseek.com")?"deepseek":e.includes("gemini.google.com")?"gemini":e.includes("aistudio.google.com")?"aistudio":e.includes("google.com")?"google_search":e.includes("perplexity.ai")?"perplexity":e.includes("chat.qwen.ai")?"qwen":e.includes("claude.ai")?"claude":"chatgpt"}function Cp(){try{let e=document.documentElement,t=document.body;if(dt()==="gemini"){let r=(e&&e.className||"")+" "+(t&&t.className||"");if(/(^|\s)dark-theme(\s|$)/.test(r))return"dark";if(/(^|\s)light-theme(\s|$)/.test(r))return"light";let i=document.querySelector(".theme-host.dark-theme, .theme-host.light-theme");if(i)return i.classList.contains("dark-theme")?"dark":"light"}let n=[t,e];for(let r=0;r<n.length;r++){let i=n[r];if(!i||typeof window.getComputedStyle!="function")continue;let a=(window.getComputedStyle(i).backgroundColor||"").match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?/);if(a&&!(a[4]!==void 0&&parseFloat(a[4])===0)&&.2126*+a[1]+.7152*+a[2]+.0722*+a[3]<100)return"dark"}return null}catch{return null}}function pl(){let e=document.documentElement.classList,t=document.body.classList,n=document.documentElement.getAttribute("data-theme")||document.body.getAttribute("data-theme");if(e.contains("dark")||t.contains("dark")||n==="dark")return!0;if(e.contains("light")||t.contains("light")||n==="light")return!1;let r=Cp();return r==="dark"?!0:r==="light"?!1:window.matchMedia?.("(prefers-color-scheme: dark)").matches}var ml=null,Ci=null,bp=5e3;function bi(e){let t=dt(),n=pl(),r=Nu[t]||Nu.chatgpt,i=n?r.dark:r.light;e.style.setProperty("--w-font",r.font),e.style.setProperty("--w-bg-track",i.bgTrack),e.style.setProperty("--w-bg-fill",i.bgFill),e.style.setProperty("--w-text",i.text),e.style.setProperty("--w-tooltip-bg",i.tooltipBg),e.style.setProperty("--w-tooltip-text",i.tooltipText),e.style.setProperty("--w-shadow",i.shadow),e.style.setProperty("--w-border",i.border),ml=n}function hl(){try{let e=q;if(!e||typeof e.isConnected=="boolean"&&!e.isConnected)return!1;let t=pl();return ml===t?!1:(bi(e),p("log","[AI CM][theme] \u043F\u0430\u043B\u0438\u0442\u0440\u0430 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0448\u0435\u043D\u0430: "+(t?"dark":"light")+" (live-\u0441\u043C\u0435\u043D\u0430 \u0442\u0435\u043C\u044B \u0441\u0435\u0440\u0432\u0438\u0441\u0430, \u0431\u0435\u0437 reload)"),!0)}catch{return!1}}function xp(){fa(),Ci=setInterval(function(){if(!q||typeof q.isConnected=="boolean"&&!q.isConnected){fa();return}hl()},bp)}function fa(){Ci&&(clearInterval(Ci),Ci=null)}function da(){try{if(!q)return;q.style.display==="none"&&(q.style.display="")}catch{}}var ig=24,Qy=12,Jy=12,Zy=320,Xy=.4,og=150,Yy='textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"], button[type="submit"]',ga={capture:!0,passive:!0},Fi=null,pr=null,Nn=null,pa=!1,yl=0;function wp(e){return e||(typeof document<"u"&&document&&document.getElementById?document.getElementById("ai-context-widget"):null)}function Sp(e){let t=typeof window<"u"&&typeof window.innerHeight=="number"?window.innerHeight:0;if(!(t>0))return ig;let n=wp(e),r=null;if(typeof document<"u"&&document&&typeof document.querySelectorAll=="function"){let a=document.querySelectorAll(Yy);for(let s=0;s<a.length;s++){let u=a[s];if(n&&u!==n&&n.contains&&n.contains(u)||!u.offsetParent)continue;let l=typeof u.getBoundingClientRect=="function"?u.getBoundingClientRect():null;!l||!(l.width>0)||!(l.height>0)||l.bottom>t*.5&&l.top<t&&(r===null||l.top<r)&&(r=l.top)}}let i=r===null?ig:t-r+Jy,o=Math.min(i,t*Xy,Zy);return Math.max(Qy,o)}function Ni(e){let t=Sp(e),n=wp(e);try{n&&n.style&&typeof n.style.setProperty=="function"&&n.style.setProperty("--acm-safe-bottom",t+"px")}catch{}return t}function ev(){Nn=null,pa=!1;let e=Fi;if(e){if(typeof e.isConnected=="boolean"&&!e.isConnected){Pa();return}yl=Date.now(),Ni(e)}}function mr(){if(!Fi||Nn!==null||pa)return;let e=Date.now()-yl;if(e<og){Nn=setTimeout(function(){Nn=null,mr()},og-e);return}pa=!0,(typeof window<"u"&&typeof window.requestAnimationFrame=="function"?function(n){window.requestAnimationFrame(n)}:function(n){setTimeout(n,16)})(function(){ev()})}function ma(e){if(!(!e||typeof document>"u"||!document.body)&&!(Fi===e&&pr)){Pa(),Fi=e;try{typeof window<"u"&&window&&typeof window.addEventListener=="function"&&(window.addEventListener("resize",mr,ga),window.addEventListener("scroll",mr,ga)),typeof MutationObserver=="function"&&(pr=new MutationObserver(mr),pr.observe(document.body,{childList:!0,subtree:!0}))}catch{}yl=Date.now(),Ni(e)}}function Pa(){if(Nn!==null&&(clearTimeout(Nn),Nn=null),pa=!1,pr){try{pr.disconnect()}catch{}pr=null}try{typeof window<"u"&&window&&typeof window.removeEventListener=="function"&&(window.removeEventListener("resize",mr,ga),window.removeEventListener("scroll",mr,ga))}catch{}Fi=null}function Bu(){Pa(),q&&ma(q)}var ag=!1;function tv(){return q&&typeof q.querySelector=="function"?q.querySelector(".ai-widget-circle"):null}function Da(){return q&&typeof q.querySelector=="function"?q.querySelector(".ai-widget-panel"):null}function Fa(e,t){let n=Da(),r=tv();if(!n||!r)return!1;let i=e===!0;if(n.classList.toggle("open",i),q&&q.classList.toggle("ai-panel-open",i),r.setAttribute("aria-expanded",i?"true":"false"),i){Wt();let o=q&&typeof q.querySelector=="function"?q.querySelector(".ai-cm-input"):null;if(o&&typeof o.focus=="function")try{o.focus()}catch{}}else if(t===!0&&typeof r.focus=="function")try{r.focus()}catch{}return i}function Gu(e){let t=Da();t&&Fa(!t.classList.contains("open"),e)}function nv(e){if(!e||!q)return;let t=Da();!t||!t.classList.contains("open")||e.key!=="Escape"&&e.key!=="Esc"||(typeof e.preventDefault=="function"&&e.preventDefault(),Fa(!1,!0))}function rv(e){if(!e||!q)return;let t=Da();if(!t||!t.classList.contains("open"))return;let n=e.target;n&&typeof n.closest=="function"&&n.closest("#ai-context-widget")||Fa(!1,!1)}function sg(){ag||typeof document>"u"||!document||typeof document.addEventListener!="function"||(ag=!0,document.addEventListener("keydown",nv,!0),document.addEventListener("click",rv,!0))}function ha(e,t){if(!e||typeof e.setAttribute!="function")return;let n=typeof qe=="function"?qe:function(s,u){return u},r=typeof t=="number"&&isFinite(t)?t:0,i=r.toFixed(1),o=typeof Di=="function"?Di():[70,95],a=r<o[0]?n("content_a11y_status_ok","\u043D\u043E\u0440\u043C\u0430"):r<o[1]?n("content_a11y_status_warning","\u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435"):n("content_a11y_status_critical","\u043A\u0440\u0438\u0442\u0438\u0447\u043D\u043E");e.setAttribute("aria-label",n("content_a11y_circle_label","AI Context Monitor: "+i+"% \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E, "+a,[i,a]))}function Hu(){if(!(typeof q>"u"||!q)){var e=typeof be<"u"&&be?be:null;if(!(!e||typeof e.percentage!="number"||!isFinite(e.percentage))){var t=q.querySelector(".ai-widget-fill");t&&t.style&&(t.style.stroke=Oa(e.percentage));try{typeof ha=="function"&&ha(q.querySelector(".ai-widget-circle"),e.percentage)}catch{}}}}function ya(){if(!(typeof chrome>"u"||!chrome||!chrome.storage||!chrome.storage.local)){try{chrome.storage.local.get(["aiCmProactiveThresholds"],function(t){Pi=t&&t.aiCmProactiveThresholds!==void 0?t.aiCmProactiveThresholds:null,Hu()})}catch(t){v(t,"widget:loadRingThresholds")}try{var e=ya;chrome.storage.onChanged&&!e.aiCmBound&&(e.aiCmBound=!0,chrome.storage.onChanged.addListener(function(t,n){n!=="local"||!t||!t.aiCmProactiveThresholds||(Pi=t.aiCmProactiveThresholds.newValue,Hu())}))}catch{}}}function va(){if(document.getElementById("ai-context-widget"))return;let e=typeof qe=="function"?qe:function(f,d){return d},t=document.createElement("div");t.id="ai-context-widget",t.replaceChildren(...(function(f){for(var d=new DOMParser().parseFromString("<body>"+f+"</body>","text/html"),h=[],m=d.body.firstChild;m;m=m.nextSibling)h.push(document.importNode(m,!0));return h})(`<style> #ai-context-widget { position: fixed; bottom: var(--acm-safe-bottom, 24px); right: 24px; z-index: 999999; font-family: var(--w-font); user-select: none; --w-radius-s: 6px; --w-radius-m: 8px; --w-radius-l: 10px; --w-space-xs: 4px; --w-space-s: 6px; --w-space-m: 8px; --w-space-l: 10px; --w-space-xl: 12px; --w-type-s: 11px; --w-type-m: 12px; --w-type-l: 13px; } .ai-widget-circle { width: 64px; height: 64px; position: relative; cursor: pointer; background: var(--w-tooltip-bg); border-radius: 50%; box-shadow: var(--w-shadow); border: var(--w-border); display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); } .ai-widget-circle:hover { transform: scale(1.06); } .ai-widget-circle:focus-visible { outline: 2px solid var(--w-text); outline-offset: 2px; } .ai-widget-circle svg { width: 88%; height: 88%; transform: rotate(-90deg); } .ai-widget-bg { fill: none; stroke: var(--w-bg-track); stroke-width: 7; } .ai-widget-fill { fill: none; stroke: var(--w-bg-fill); stroke-width: 7; stroke-linecap: round; transition: stroke 0.18s ease, stroke-dashoffset 0.4s ease; } .ai-widget-text { position: absolute; font-size: var(--w-type-l); font-weight: 600; color: var(--w-text); letter-spacing: -0.03em; } .ai-widget-tooltip { visibility: hidden; opacity: 0; position: absolute; bottom: 76px; right: 0; width: max-content; box-sizing: border-box; max-width: min(320px, calc(100vw - 48px)); max-height: 40vh; overflow-y: auto; overscroll-behavior: contain; background: var(--w-tooltip-bg); color: var(--w-tooltip-text); padding: 8px 12px; /* #16: tooltip literals stay pinned by tests/tooltip-persist-reflow.test.js */ border-radius: 8px; font-size: 12px; line-height: 1.4; white-space: normal; overflow-wrap: break-word; box-shadow: var(--w-shadow); border: var(--w-border); transition: opacity 0.15s ease, visibility 0s linear 0.3s; } .ai-widget-circle:hover .ai-widget-tooltip { visibility: visible; opacity: 1; transition: opacity 0.15s ease, visibility 0s linear 0s; } #ai-context-widget.ai-panel-open .ai-widget-tooltip { visibility: hidden !important; opacity: 0 !important; transition: none; } .ai-widget-panel { display: none; position: absolute; bottom: 76px; right: 0; background: var(--w-tooltip-bg); color: var(--w-tooltip-text); /* #16: panel padding/radius stay literals (pinned by panel-overflow-contrast, widget-minor-polish) */ padding: 10px; border-radius: 10px; box-shadow: var(--w-shadow); border: var(--w-border); flex-direction: column; /* #16: panel gap stays a pinned literal (panel-overflow-contrast); row gap is moved to the scale above */ gap: 6px; width: min(290px, calc(100vw - 48px)); max-height: calc(100vh - 108px); /* fallback for engines without var()/clamp() support in max-height; declared FIRST on purpose - this literal is pinned by tests/panel-overflow-contrast.test.js (i18n pin M-4.2: no user-facing ru literals here) */ max-height: clamp(130px, calc(100vh - var(--acm-safe-bottom, 24px) - 84px), calc(100vh - 108px)); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(127,127,127,0.5) transparent; box-sizing: border-box; font-size: 12px; line-height: 1.4; z-index: 1000000; white-space: normal; } .ai-widget-panel.open { display: flex; } .ai-cm-limit-text { font-weight: 600; margin-bottom: 2px; } .ai-cm-row { display: flex; align-items: center; gap: var(--w-space-s); } .ai-cm-input { width: 55px; padding: var(--w-space-xs) 2px; text-align: center; border-radius: var(--w-radius-s); border: 1px solid rgba(127,127,127,0.4); background: rgba(127,127,127,0.12); color: inherit; font-family: inherit; font-size: var(--w-type-l); -webkit-appearance: textfield; -moz-appearance: textfield; appearance: textfield; } .ai-cm-input::-webkit-outer-spin-button, .ai-cm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } .ai-cm-spin { display: flex; flex-direction: column; margin-left: -2px; } .ai-cm-spin button { cursor: pointer; border: 1px solid rgba(127,127,127,0.4); background: rgba(127,127,127,0.12); color: inherit; font-size: 8px; line-height: 1; padding: 2px 5px; font-family: inherit; } .ai-cm-spin button:first-child { border-radius: 4px 4px 0 0; border-bottom: none; } .ai-cm-spin button:last-child { border-radius: 0 0 4px 4px; } .ai-cm-spin button:hover { background: rgba(127,127,127,0.32); } .ai-cm-spin button:active { background: rgba(127,127,127,0.45); } .ai-cm-spin button:disabled { opacity: 0.38; cursor: default; } .ai-cm-btn { cursor: pointer; border: none; border-radius: var(--w-radius-s); padding: var(--w-space-s) var(--w-space-m); font-size: var(--w-type-m); font-family: inherit; background: rgba(127,127,127,0.18); color: inherit; text-align: left; } .ai-cm-btn:hover { background: rgba(127,127,127,0.32); } .ai-cm-btn:active { background: rgba(127,127,127,0.45); } .ai-cm-btn:focus-visible:not([aria-hidden="true"]), .ai-cm-spin button:focus-visible:not([aria-hidden="true"]) { outline: 2px solid var(--w-text); outline-offset: 2px; } .ai-cm-btn:disabled { opacity: 0.38; cursor: default; } .ai-cm-hint { opacity: 1; color: var(--w-tooltip-text); font-size: 11px; } .ai-widget-tt-primary { font-size: 13px; font-weight: 600; } .ai-widget-tt-secondary { font-size: 11px; } .ai-widget-tt-sep { display: block; height: 1px; background: currentColor; opacity: 0.18; margin: 4px 0; } </style> <div class="ai-widget-circle" tabindex="0" role="button" aria-haspopup="dialog" aria-controls="ai-widget-panel" aria-expanded="false" aria-label="${e("content_a11y_circle_initial","\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u043E\u0440\u043E\u0433\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430")}"> <svg viewBox="0 0 100 100"> <defs> <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" stop-color="#4285F4" /> <stop offset="50%" stop-color="#9B51E0" /> <stop offset="100%" stop-color="#EA4335" /> </linearGradient> </defs> <circle class="ai-widget-bg" cx="50" cy="50" r="43"/> <circle class="ai-widget-fill" cx="50" cy="50" r="43"/> </svg> <div class="ai-widget-text">\u2014</div> <div class="ai-widget-tooltip">${e("content_widget_loading","\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430...")}</div> </div> <div class="ai-widget-panel" id="ai-widget-panel"> <div class="ai-cm-limit-text">${e("content_panel_auto_label","\u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433")}</div> <div class="ai-cm-row"><input type="number" min="1" max="100" step="1" class="ai-cm-input" placeholder="${e("content_panel_placeholder","\u0410\u0432\u0442\u043E")}"><span class="ai-cm-spin"><button type="button" class="ai-cm-spin-up" tabindex="-1" aria-label="${e("content_panel_spin_up","\u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u043F\u043E\u0440\u043E\u0433")}">\u25B2</button><button type="button" class="ai-cm-spin-down" tabindex="-1" aria-label="${e("content_panel_spin_down","\u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043F\u043E\u0440\u043E\u0433")}">\u25BC</button></span><span>${e("content_panel_pct_auto","% \u043E\u0442 \u0410\u0432\u0442\u043E")}</span></div> <div class="ai-cm-row"><button class="ai-cm-btn ai-cm-snap">${e("content_panel_snap_btn","\u{1F4CC} \u0422\u0435\u043A\u0443\u0449\u0435\u0435 = 100%")}</button><button class="ai-cm-btn ai-cm-auto">${e("content_panel_auto_btn","\u21BA \u0410\u0432\u0442\u043E")}</button></div> <div class="ai-cm-hint">${e("content_panel_hint","\u041F\u043E\u0440\u043E\u0433 \u0432 % \u043E\u0442 \u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433\u0430 (\u043E\u0446\u0435\u043D\u0451\u043D\u043D\u043E\u0439 \u0442\u043E\u0447\u043A\u0438, \u0433\u0434\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u0437\u0430\u0431\u044B\u0432\u0430\u0442\u044C). 100% = \u043A\u0430\u043A \u0410\u0432\u0442\u043E. \u041C\u0435\u043D\u044C\u0448\u0435 = \u0441\u0442\u0440\u043E\u0436\u0435: \u0446\u0432\u0435\u0442\u0430 \u0438 % \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u0440\u043E\u0433\u0430. \u041F\u0440\u0438\u043C\u0435\u0440: \u043F\u043E\u0440\u043E\u0433 10% \u2192 \u0436\u0451\u043B\u0442\u044B\u0439, \u043A\u043E\u0433\u0434\u0430 \u0410\u0432\u0442\u043E\u22485%, \u043A\u0440\u0430\u0441\u043D\u044B\u0439 \u043F\u0440\u0438 \u0410\u0432\u0442\u043E\u22488%.")}</div> </div>`)),document.body.appendChild(t),q=t,bi(t);try{typeof el=="function"&&el()&&(t.style.display="none")}catch{}let n=t.querySelector(".ai-widget-circle"),r=t.querySelector(".ai-widget-panel"),i=t.querySelector(".ai-cm-snap"),o=t.querySelector(".ai-cm-auto"),a=t.querySelector(".ai-cm-input"),s=t.querySelector(".ai-cm-spin-up"),u=t.querySelector(".ai-cm-spin-down");n&&r&&(n.addEventListener("click",()=>Gu(!0)),n.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" "||f.key==="Spacebar")&&(f.preventDefault(),Gu(!0))}));try{typeof Ni=="function"&&Ni(t),typeof ma=="function"&&ma(t),typeof sg=="function"&&sg(),typeof ya=="function"&&ya()}catch{}i&&i.addEventListener("click",hp),o&&o.addEventListener("click",gl),a&&a.addEventListener("change",f=>dl(f.target.value)),s&&s.addEventListener("click",()=>Pu(1)),u&&u.addEventListener("click",()=>Pu(-1)),Wt();let l=new MutationObserver(()=>bi(t));l.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-theme"]}),l.observe(document.body,{attributes:!0,attributeFilter:["class","style","data-theme"]});let c=document.querySelector(".theme-host");c&&c!==document.documentElement&&c!==document.body&&l.observe(c,{attributes:!0,attributeFilter:["class","style","data-theme"]});try{let f=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)");f&&f.addEventListener&&f.addEventListener("change",()=>bi(t))}catch{}xp(),oe()}function Na(e,t,n,r,i,o,a){if(!q)return;try{Yp()}catch{}hl(),p("log","[AI CM][trace] badge-update pct="+e+"% tokens="+t+" model="+o);let s=q.querySelector(".ai-widget-fill"),u=q.querySelector(".ai-widget-text"),l=q.querySelector(".ai-widget-tooltip");if(!s||!u)return;let f=2*Math.PI*43,d=Math.min(100,Math.max(0,e)),h=f-d/100*f;s.style.strokeDasharray=String(f),s.style.strokeDashoffset=String(h),s.style.stroke=Oa(e);var m=typeof R=="number"&&R>0||typeof Q<"u"&&Q&&Q.length>0||typeof kt<"u"&&kt===!0,y=Mt===!0&&!m;u.textContent=y?"\u2014":(typeof be<"u"&&be&&(be.readiness==="provisional"||be.readiness==="collecting"||be.quality==="derived"||be.quality==="floor"||be.quality==="stale")?"~":"")+e.toFixed(1)+"%";try{ha(q.querySelector(".ai-widget-circle"),e)}catch{}try{y&&typeof w=="function"&&typeof g<"u"&&g&&g.siteName==="qwen"&&w("qwen-badge",{ts:Date.now(),event:"placeholder",reason:"stale",pct:e,tokens:t,baseSeen:typeof I<"u"&&I===!0?1:0,adapterBase:m?1:0,url:String(typeof location<"u"&&location&&location.href||"")})}catch{}if(l){let C=typeof qe=="function"?qe:function(k,A){return A},S=qn(),b=S!=null?C("content_tooltip_limit_pct",`\u041F\u0440\u0435\u0434\u0435\u043B: ${S}% \u043E\u0442 \u0410\u0432\u0442\u043E = ${i.toLocaleString()} \u0442\u043E\u043A`,[String(S),i.toLocaleString()]):C("content_tooltip_limit_auto",`\u041F\u0440\u0435\u0434\u0435\u043B: \u0410\u0432\u0442\u043E = ${n.toLocaleString()} \u0442\u043E\u043A`,[n.toLocaleString()]),x=String,M=[C("content_tooltip_model",`\u041C\u043E\u0434\u0435\u043B\u044C: ${x(o)}`,[x(o)]),C("content_tooltip_tokens",`\u0422\u043E\u043A\u0435\u043D\u044B: ${t.toLocaleString()}`,[t.toLocaleString()]),b,C("content_tooltip_window",`\u041E\u043A\u043D\u043E \u043C\u043E\u0434\u0435\u043B\u0438: ${r>0?r.toLocaleString():"\u2014"}`,[r>0?r.toLocaleString():"\u2014"])];try{typeof B<"u"&&B&&B.saturated===!0&&M.push(C("content_tooltip_saturated","\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u043E\u0439"))}catch(k){v(k,"widget:tooltip-saturation")}try{if(typeof vn<"u"&&vn&&typeof vn=="object"){let k=typeof vn.outputTokens=="number"?vn.outputTokens:0,A=typeof vn.reasoningTokens=="number"?vn.reasoningTokens:0;k>0&&M.push(C("content_tooltip_tokens",`\u0422\u043E\u043A\u0435\u043D\u044B: ${k.toLocaleString()}`,["output "+k.toLocaleString()])),A>0&&M.push(C("content_tooltip_tokens",`\u0422\u043E\u043A\u0435\u043D\u044B: ${A.toLocaleString()}`,["reasoning "+A.toLocaleString()]))}}catch{}try{let k=Mt===!0&&m?" \xB7 stale":"",A=Tt?x(Tt)+k:k?"stale":"";A&&M.push(C("content_source_label",`\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ${A}`,[A]))}catch{}if(a&&(a.imgCount>0||a.docCount>0)){let k=(a.imgTokens+a.docTokens).toLocaleString();M.push(C("content_tooltip_attachments",`\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u2248 ${k} \u0442\u043E\u043A\u0435\u043D\u043E\u0432`,[k])),a.imgCount>0&&M.push(C("content_tooltip_attach_images",`\xB7 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0438: ${a.imgCount} \u0448\u0442 \u2248 ${a.imgTokens.toLocaleString()} (\u043F\u043E 2 \u0442\u0430\u0439\u043B\u0430)`,[String(a.imgCount),a.imgTokens.toLocaleString()])),a.docCount>0&&M.push(C("content_tooltip_attach_files",`\xB7 \u0444\u0430\u0439\u043B\u044B: ${a.docCount} \u0448\u0442 \u2248 ${a.docTokens.toLocaleString()} (\u043E\u0446\u0435\u043D\u043E\u0447\u043D\u043E)`,[String(a.docCount),a.docTokens.toLocaleString()]))}for(;l.firstChild;)l.removeChild(l.firstChild);M.forEach((k,A)=>{if(A>0&&l.appendChild(document.createElement("br")),A===3){let H=document.createElement("span");H.className="ai-widget-tt-sep",H.setAttribute("aria-hidden","true"),l.appendChild(H)}let G=document.createElement("span");G.className=A<3?"ai-widget-tt-primary":"ai-widget-tt-secondary",G.textContent=k,l.appendChild(G)})}try{typeof da=="function"&&da()}catch{}}function ug(e){if(!e||typeof e.setAttribute!="function")return;let t=typeof qe=="function"?qe:function(n,r){return r};e.setAttribute("aria-label",t("content_a11y_circle_initial","\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u043E\u0440\u043E\u0433\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430"))}(function(){let e={};e.safePctKey=Hn,e.zoneColor=Oa,e.aiCmRingBounds=Di,e.aiCmSetRingThresholds=function(t){Pi=t===void 0?null:t},e.aiCmRepaintRing=Hu,e.aiCmLoadRingThresholds=ya,e.aiCmActivePct=qn,e.computeEffectiveLimit=An,e.aiCmSetPopupOverrides=pp,e.aiCmRefreshPopupOverrides=fl,e.aiCmLoadPopupOverrides=mp,e.updatePanel=Wt,e.snapCurrentPct=hp,e.setSafePctFromInput=dl,e.resetSafePct=gl,e.stepSafePct=Pu,e.AI_CM_SAFE_PCT_MIGRATIONS=Du,e.aiCmSafePctMigrationSource=yp,e.aiCmSafePctMigrationValue=vp,e.aiCmMigrateSafePct=Fu,e.resetConversationState=Ji,e.THEME_CONFIGS=Nu,e.getServiceKey=dt,e.aiCmInAppTheme=Cp,e.isDarkMode=pl,e.aiCmWidgetAppliedTheme=ml,e.aiCmThemePollTimer=Ci,e.AI_CM_THEME_POLL_MS=bp,e.applyNativeStyles=bi,e.aiCmRefreshThemeIfNeeded=hl,e.aiCmStartThemePoll=xp,e.aiCmStopThemePoll=fa,e.aiCmComputeWidgetSafeBottom=Sp,e.aiCmUpdateWidgetSafeBottom=Ni,e.aiCmStartWidgetSafeBottomWatch=ma,e.aiCmStopWidgetSafeBottomWatch=Pa,e.aiCmRestartWidgetSafeBottomWatch=Bu,e.aiCmSetWidgetA11yLabel=ha,e.aiCmSetWidgetPanelOpen=Fa,e.aiCmToggleWidgetPanel=Gu,e.createWidget=va,e.aiCmRevealWidget=da,e.updateWidget=Na,typeof le<"u"&&le.exports&&(le.exports=e),typeof window<"u"&&(window.AiCmWidget=e)})();function Ca(e){var t=Object.assign({},e);return t.ts=Date.now(),t}function qu(e,t){if(t>0){var n="intra|"+(R||0)+"|"+(P?P.length:0);n!==Bi&&(Bi=n,p("log","[AI CM][gemini] intra-dedupe removed="+t+" blocks in message role="+e))}}function jn(e){try{var t=g&&g.siteName||"";if(t==="google_search"){var n=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(n&&typeof n.prepareExportMessages=="function"){var r=n.prepareExportMessages(e,qu),i=Array.isArray(r.messages)?r.messages:e;return(r.removed>0||r.intraRemoved>0)&&p("log","[AI CM][google_search] dedupe removed="+r.removed+" intra="+r.intraRemoved+" msgs="+e.length+"\u2192"+i.length),{messages:i,removed:r.removed}}return{messages:e,removed:0}}if(t!=="gemini"&&t!=="aistudio"){for(var o=[],a=0;a<e.length;a++){var s=e[a]||{},u={role:s.role==="user"||s.role==="human"?"user":"assistant",text:typeof s.text=="string"?s.text:""};Array.isArray(s.sources)&&(u.sources=s.sources),s.artifact&&typeof s.artifact=="object"&&(u.artifact=s.artifact),Array.isArray(s.artifacts)&&(u.artifacts=s.artifacts),typeof w=="function"&&t==="claude"&&w("claude-role-dedupe",{site:t,mpRole:s.role,normalizedRole:u.role}),typeof s.reasoning=="string"&&s.reasoning&&(u.reasoning=s.reasoning),o.push(u)}return{messages:o,removed:0}}var l=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!l)return{messages:e,removed:0};if(typeof l.prepareExportMessages=="function"){var c=l.prepareExportMessages(t==="aistudio"&&typeof cg=="function"?cg(e):e,qu,{collapseFileUserDuplicates:t==="aistudio"});return{messages:c.messages,removed:c.removed}}if(typeof l.dedupeMessages=="function")return l.dedupeMessages(e)}catch(f){At(f,"base-handler:dedupeExportSource")}return{messages:e,removed:0}}var Bi=null;function Ap(e){if(e>0){var t=R+"|"+(P?P.length:0);t!==Bi&&(Bi=t,p("log","[AI CM][gemini] dedupe removed="+e))}}function _t(){return jn(Ir()).messages}var de=null;function Tp(e){if(typeof Dt=="function")return Dt(e);for(var t=Array.isArray(e)?e:[],n=[],r=0;r<t.length;r++)n.push(String(t[r]&&t[r].text||""));return n.join(`
`)}function ju(e){return Array.isArray(de)&&de.length>0?Tp(de):e}function Zt(e,t){try{for(var n=String(e||"")+"\0"+String(t||""),r=2166136261,i=0;i<n.length;i++)r^=n.charCodeAt(i),r=Math.imul(r,16777619)>>>0;return("000000"+r.toString(16)).slice(-6)}catch{return"000000"}}function Tr(){try{var e=null,t=function(n){e=n.detail};return window.addEventListener("ai-cm-turns-snap-response",t,{once:!0}),window.dispatchEvent(new CustomEvent("ai-cm-turns-snap-request")),window.removeEventListener("ai-cm-turns-snap-response",t),e}catch{return null}}var iv=0;function Er(){try{return typeof g<"u"&&!!g&&g.siteName==="deepseek"}catch{return!1}}function ov(){try{if(typeof g>"u"||!g)return!1;var e=g.siteName;return e==="deepseek"||e==="qwen"||e==="aistudio"||e==="gemini"}catch{return!1}}function wn(e,t,n){var r=typeof n=="number"&&n>0?n:3e3,i=!1,o=null,a=null;function s(l){if(!i){if(i=!0,o){try{clearTimeout(o)}catch{}o=null}if(a){try{window.removeEventListener("ai-cm-deepseek-net-sync-done",a)}catch{}a=null}try{Ep(e,l||{})}catch{}try{t&&t(l||{})}catch(c){v(c,"base-handler:netSync-finish-callback")}}}try{if(!e){s({ok:!1,reason:"no-conv"});return}var u="netsync-"+Date.now()+"-"+ ++iv;a=function(l){var c=l?l.detail:null;!c||String(c.requestId||"")!==u||s(c)},window.addEventListener("ai-cm-deepseek-net-sync-done",a),o=setTimeout(function(){s({ok:!1,reason:"timeout"})},r),window.dispatchEvent(new CustomEvent("ai-cm-deepseek-net-sync",{detail:JSON.stringify({requestId:u,convId:e,timeoutMs:r})}))}catch{s({ok:!1,reason:"bridge-error"})}}function Ep(e,t){try{var n=t&&t.verdicts?JSON.stringify(t.verdicts):"{}",r="[AI CM][net-sync] convId="+String(e||"").slice(0,8)+" ok="+(t&&t.ok===!0?1:0)+" reason="+(t&&t.reason||"-")+" refetched="+(t&&t.refetched===!0?1:0)+" netTurns="+(t&&t.netTurns||0)+" liveTurns="+(t&&t.liveTurns||0)+" verdicts="+n;p("log",r)}catch{}}function vl(e,t,n){try{var r=Tr(),i=r&&r.msgs||0,o="-",a="-",s="",u="",l=null,c=null,f=null;if(r&&typeof r=="object"&&(o=r.firstMsgHash||"-",a=r.lastMsgHash||"-",s=r.firstText||"",u=r.lastText||"",l=r.baseComplete,c=r.reachedStart,f=r.confirmedByScroll),!i&&Array.isArray(n)&&n.length>0&&(i=n.length,o=Zt("",n[0]&&n[0].text||""),a=Zt("",n[n.length-1]&&n[n.length-1].text||""),s=String(n[0]&&n[0].text||"").slice(0,80).replace(/\s+/g," "),u=String(n[n.length-1]&&n[n.length-1].text||"").slice(0,80).replace(/\s+/g," ")),l===null&&(l=E===!0),c===null||f===null){var d=vt[String(t)]===1;c===null&&(c=d),f===null&&(f=d)}p("log","[AI CM][turnsMap] "+e+" convId="+(t||r&&r.convId||"(none)")+" msgs="+i+" firstMsgHash="+o+" lastMsgHash="+a+' firstText="'+s+'" lastText="'+u+'" baseComplete='+(l?1:0)+" reachedStart="+(c?"true":"false")+" confirmedByScroll="+(f?"true":"false")+" scrollEngaged="+(r&&r.scrollEngaged?"true":"false"))}catch{}}function Gi(){if($()){try{clearTimeout(pi??void 0)}catch{}Mt=!1,pi=setTimeout(function(){if(pi=null,U&&!I&&!fv()){var e=!1;try{if(g){var t=g.extractMessages();e=!!t&&t.length>0}}catch{e=!1}e&&(Mt=!0,oe())}},12e3)}}var av=0;function Wu(){var e=-1,t=null;try{if(typeof window>"u"||typeof window.dispatchEvent!="function")return 0;t=function(n){var r=n.detail;r&&typeof r.pending=="number"&&(e=r.pending)},window.addEventListener("ai-cm-deepseek-files-state-response",t),window.dispatchEvent(new CustomEvent("ai-cm-deepseek-files-state-request"))}catch(n){p("log","[AI CM][file-queue] state bridge: "+Wn(n))}finally{try{t&&window.removeEventListener("ai-cm-deepseek-files-state-response",t)}catch(n){p("log","[AI CM][file-queue] state listener off: "+Wn(n))}}return e}function kp(e,t){try{var n="[AI CM][file-queue] convId="+String(e||"").slice(0,8)+" ok="+(t&&t.ok===!0?1:0)+" reason="+(t&&t.reason||"-")+" drained="+(t&&t.drained===!0?1:0)+" pending="+(t&&typeof t.pending=="number"?t.pending:0)+" waitedMs="+(t&&t.waitedMs||0);p("log",n)}catch(r){p("log","[AI CM][file-queue] log failed: "+Wn(r))}}function Mp(e,t,n){var r=typeof n=="number"&&n>0?n:2e3,i=Wu();if(i<=0){try{t&&t({ok:!0,drained:!0,reason:"idle-or-absent",pending:0,waitedMs:0})}catch(f){v(f,"base-handler:filesDrain-idle-cb")}return}var o=!1,a=null,s=null,u=Date.now();function l(f){if(!o){if(o=!0,a){try{clearTimeout(a)}catch(d){p("log","[AI CM][file-queue] timer off: "+Wn(d))}a=null}if(s){try{window.removeEventListener("ai-cm-deepseek-files-drain-done",s)}catch(d){p("log","[AI CM][file-queue] listener off: "+Wn(d))}s=null}kp(e,f||{});try{t&&t(f||{})}catch(d){v(d,"base-handler:filesDrain-finish-callback")}}}try{var c="files-"+Date.now()+"-"+ ++av;s=function(f){var d=f?f.detail:null;!d||String(d.requestId||"")!==c||l(d)},window.addEventListener("ai-cm-deepseek-files-drain-done",s),a=setTimeout(function(){l({ok:!1,drained:!1,reason:"file-queue-timeout",pending:Wu(),waitedMs:Date.now()-u})},r+250),window.dispatchEvent(new CustomEvent("ai-cm-deepseek-files-drain",{detail:JSON.stringify({requestId:c,timeoutMs:r})}))}catch{l({ok:!1,drained:!1,reason:"bridge-error",pending:i,waitedMs:Date.now()-u})}}function hr(e,t,n){var r=function(){try{t&&t()}catch(i){v(i,"base-handler:filesThenNet-callback")}};Mp(e,function(){if(typeof wn=="function"&&Er()){wn(e,r,n);return}r()},2e3)}var lg=500,sv=5e3,pu=Object.create(null),ui=Object.create(null);function uv(){try{if(typeof window>"u")return null;var e=window;return e.AiCmAiStudioFiles||e.AiCmAistudioFiles||null}catch{return null}}function lv(){var e=uv();if(!e||typeof e.pending!="function")return 0;try{var t=e.pending();return typeof t=="number"&&t>0?t:0}catch{return 0}}function cv(e,t,n,r){try{if(typeof g>"u"||!g||g.siteName!=="aistudio")return!1;var i=lv(),o=String(e||"");if(i<=0)return delete ui[o],!1;var a=Date.now();return ui[o]||(ui[o]=a+sv),pu[o]?(p("log","[AI CM][auto-export] files-drain: \u0444\u0430\u0439\u0440 \u0443\u0436\u0435 \u0436\u0434\u0451\u0442 \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0444\u0430\u0439\u043B\u043E\u0432 convId="+o+" pending="+i),!0):a>=ui[o]?(delete ui[o],p("log","[AI CM][auto-export] files-drain: \u043F\u043E\u0442\u043E\u043B\u043E\u043A \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u2014 \u043F\u0438\u0448\u0435\u043C \u0444\u0430\u0439\u043B convId="+o+" pending="+i),!1):(p("log","[AI CM][auto-export] files-drain: \u0436\u0434\u0451\u043C \u043E\u0447\u0435\u0440\u0435\u0434\u044C \u0444\u0430\u0439\u043B\u043E\u0432 convId="+o+" pending="+i+" step="+lg+"ms"),pu[o]=setTimeout(function(){delete pu[o];try{var s=typeof Tn=="function"?Tn:null;s&&s(e,t,n,r)}catch(u){p("log","[AI CM][auto-export] files-drain: \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u0432\u0445\u043E\u0434 \u0443\u043F\u0430\u043B: "+Wn(u))}},lg),!0)}catch{return!1}}(function(){var e={};e.aiCmHostHistoryRecord=Ca,e.aiCmLogIntraDedupe=qu,e.aiCmDedupeExportSource=jn,e.lastDedupeLogSig=Bi,e.aiCmLogDedupeRemoved=Ap,e.buildHistoryMessages=_t,e.aiCmBasePrepared=de,e.aiCmPreparedText=Tp,e.aiCmMetricBaseText=ju,e.aiCmDiagHash6=Zt,e.aiCmGeminiTurnsSnapshotSync=Tr,e.aiCmExportNetSyncSite=Er,e.aiCmFilesDrainSite=ov,e.aiCmExportNetSyncThen=wn,e.aiCmLogNetSyncResult=Ep,e.aiCmFilesQueuePending=Wu,e.aiCmLogFilesDrain=kp,e.aiCmExportFilesDrainThen=Mp,e.aiCmExportFilesThenNetSync=hr,e.aiCmFilesDrainDefer=cv,e.aiCmDumpTurnsSnapshot=vl,e.scheduleStaleCheck=Gi,typeof le<"u"&&le.exports&&(le.exports=e),typeof window<"u"&&(window.AiCmBaseHandler=e)})();function Wn(e){var t=e&&e.message;return String(t||e)}function cg(e){if(!Array.isArray(e)||e.length===0)return e;for(var t=[],n=0;n<e.length;n++){var r=e[n]||{},i=r.role==="user"||r.role==="human"?"user":"assistant",o=typeof r.text=="string"?r.text:"",a=t.length?t[t.length-1]:null;a&&i==="assistant"&&a.role==="assistant"?a.text=a.text+`

`+o:t.push({role:i,text:o})}return t}function fv(){try{if(typeof g>"u"||!g||g.siteName!=="chatgpt")return!1;var e=typeof T=="function"&&T()||"";return!e||e.indexOf("local-chatgpt")===0}catch{return!1}}function ba(e){return(e||"").toLowerCase().replace(/[^a-zа-яё0-9]+/g,"")}function Ip(e){return e?e.replace(/!\[([^\]]*)\]\([^)]*\)/g,"$1").replace(/\[([^\]]*)\]\([^)]*\)/g,"$1").replace(/`+/g,""):""}var Jo=["[data-message-author-role]","[data-message-id]",'.user-query, .model-response, .query-text, .response-content, [data-role="user"], [data-role="model"]'];function kr(){for(var e=0;e<Jo.length;e++){var t=document.querySelectorAll(Jo[e]);if(t&&t.length>0)return{nodes:Array.prototype.slice.call(t),sel:Jo[e]}}return{nodes:[],sel:"(none)"}}function _p(e,t){if(tt&&tt.size>0){var n="";try{n=e.getAttribute&&e.getAttribute("data-message-id")||""}catch{}if(n&&tt.has(String(n).trim()))return!0}if(!t)return!1;if(Ct&&Ct.has(t))return!0;if(nn){for(var r=0;r<nn.length;r++)if(t.indexOf(nn[r])!==-1)return!0}return!1}function Rp(){try{if(g&&g.siteName==="gemini")return!0}catch{}return!1}function Lp(e){for(var t=e==null?"":String(e),n=t.length;n>0;){var r=t.lastIndexOf(`

[FILE: `,n-1),i=t.lastIndexOf(`

[IMAGE: `,n-1),o=r>i?r:i;if(o===-1)break;t=t.slice(0,o),n=o}return t}function Hi(e,t){var n=/^\s*image_[^\s]+\.(png|jpe?g|webp|gif)(\s+Ещё\s+\d+(?:\/\d+)?)?\s*$/,r=/^(?:\s*(?:\d+(?:[.,]\d+)?\s*(?:B|KB|MB|GB|КБ|МБ|ГБ|байт[а-яё]*)|Ещё\s+\d+(?:\/\d+)?))+\s*$/i,i=e==null?"":String(e);if(!i)return"";for(var o=i.split(`
`),a=[],s=0;s<o.length;s++){var u=n.test(o[s]);if(!u&&t&&t.length>0)for(var l=0;l<t.length;l++){var c=t[l];if(!(!c||o[s].indexOf(c)!==0)){var f=o[s].slice(c.length);if(f&&r.test(f)){u=!0;break}}}u||a.push(o[s])}return a.length===o.length?i:a.join(`
`).trim()}function Cl(e){for(var t=e==null?"":String(e),n=[],r=/\[(?:FILE|IMAGE):\s*([^\]\n]+)\]/g,i;(i=r.exec(t))!==null;){var o=String(i&&i[1]||"").trim();o=o.replace(/\s*\([^)]*\)\s*$/,""),o=o.replace(/\s+\d+(?:[.,]\d+)?\s*(?:B|KB|MB|GB|КБ|МБ|ГБ|байт[а-яё]*)$/i,""),o=o.trim(),o&&n.indexOf(o)===-1&&n.push(o)}return n}function rn(e,t){return ba(Ip(Hi(Lp(e),t)))}function Ba(){var e=kr(),t=e.nodes;if(!I||!P)return{text:"",count:0,bounded:!1,sel:e.sel,messages:[],diag:"\u043D\u0435\u0442 \u0431\u0430\u0437\u044B"};if(t.length===0)return{text:"",count:0,bounded:!1,sel:e.sel,messages:[],diag:"\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043D\u0435 \u0434\u0430\u043B \u0443\u0437\u043B\u043E\u0432: "+e.sel};if((!tt||tt.size===0)&&(!Ct||Ct.size===0))return{text:"",count:0,bounded:!1,sel:e.sel,messages:[],diag:"\u043A\u044D\u0448 \u0431\u0430\u0437\u044B \u043F\u0443\u0441\u0442 \u2192 \u0444\u043E\u043B\u0431\u044D\u043A \u043F\u043E \u0431\u0430\u0437\u0435"};var n=typeof de<"u"&&Array.isArray(de)&&de.length>0?de:null,r=[];if(n){for(var i=[],o=0;o<n.length;o++)i.push(String(n[o]&&n[o].text||""));r=Cl(i.join(`
`))}for(var a=[],s=-1,u=!1,l=t.length-1;l>=0;l--){var c=t[l].innerText||t[l].textContent||"",f=rn(c,r);if(_p(t[l],f)){u=!0,s=l;break}f.length>0&&a.unshift(t[l])}for(var d=[],h=0;h<a.length;h++){var m="";if(Rp())try{m=typeof Yi<"u"&&Yi?Yi(a[h]).text:""}catch{m=(a[h].innerText||a[h].textContent||"").trim()}else m=(a[h].innerText||a[h].textContent||"").trim();if(m=Hi(m),m){var y="";try{y=a[h].getAttribute&&a[h].getAttribute("data-message-author-role")||""}catch{y=""}if(!y){var C=!1;try{C=!!(a[h].matches&&a[h].matches(".user-query,.query-text"))||!!(a[h].querySelector&&a[h].querySelector(".user-query,.query-text"))}catch{C=!1}y=C?"user":"assistant"}d.push({role:y,text:m})}}if(n){for(var S=typeof ki=="number"?ki:40,b=Math.min(n.length,d.length),x=[],M=0;M<b;M++)x.push(rn(d[M].text||"",r));for(var k=[],A=n.length-b,G=0;G<b;G++){var H=n[A+G];k.push(rn(String(H&&H.text||""),r))}for(var N=0,D=b;D>=1;D--){for(var L=!0,z=0;z<D;z++){var X=n[A+(b-D)+z],ee=X&&X.role==="user"?"user":"assistant",J=d[z].role==="user"?"user":"assistant",Re=x[z];if(J!==ee||Re!==k[b-D+z]||Re.length<S){L=!1;break}}if(L){N=D;break}}N>0&&(d=d.slice(N))}for(var V=[],ie=0;ie<d.length;ie++)V.push(d[ie].text||"");return{text:V.join(`
`),count:d.length,bounded:u,sel:e.sel,messages:d,diag:"sel="+e.sel+" \u0443\u0437\u043B\u043E\u0432="+t.length+" \u0441\u0442\u043E\u043F="+(u?"@"+s:"\u043D\u0435\u0442(\u0432\u0441\u0435 \u0432 \u043E\u043A\u043D\u0435 \u2014 \u043D\u043E\u0432\u044B\u0435)")+" \u0445\u0432\u043E\u0441\u0442="+d.length+" bdd="+(u?"\u0434\u0430":"\u043D\u0435\u0442")}}function li(e){return typeof ju=="function"?ju(e):e}function mu(e){return String(e||"").toLowerCase().replace(/[*_`#>|]/g,"").replace(/^[()\[\]{}"'«».,;:!?—–-]+/,"").replace(/[()\[\]{}"'«».,;:!?—–-]+$/,"")}function fg(e){for(var t=/\S+/g,n,r=[];(n=t.exec(String(e||"")))!==null;)r.push({w:n[0],start:n.index,end:n.index+n[0].length});return r}function dv(e,t){for(var n=0,r=0;r<e.length;r++)if(/[*_`#>|]/.test(e.charAt(r))||n++,n>=t){r++;break}return r}function gv(e,t){var n=fg(e),r=fg(t);if(n.length<4||r.length<4)return-1;for(var i=Math.min(10,n.length,r.length),o=i;o>=4;o--){for(var a=n.length-o,s=[],u=0;u<o;u++)s.push(mu(n[a+u].w));if(s[o-1])for(var l=r.length-1;l>=o-1;l--){for(var c=!0,f=0;f<o-1;f++)if(mu(r[l-(o-1)+f].w)!==s[f]){c=!1;break}if(c){var d=mu(r[l].w);if(d){var h=s[o-1];if(d===h)return r[l].end;if(d.indexOf(h)===0){var m=dv(r[l].w,h.length);if(m>0)return r[l].start+m}}}}}return-1}function Op(){try{var e=g;if(typeof g<"u"&&g&&g.siteName==="chatgpt"&&e&&typeof e.getLastAssistantText=="function"){var t=String(e.getLastAssistantText()||"").trim();if(t)return{text:Hi(t),id:""}}}catch(l){typeof v=="function"&&v(l,"hybrid-tail:adapter-last-assistant")}for(var n=kr(),r=n.nodes||[],i=r.length-1;i>=0;i--){var o="";try{o=r[i].getAttribute&&r[i].getAttribute("data-message-author-role")||""}catch{o=""}if(!o){var a=!1;try{a=!!(r[i].matches&&r[i].matches(".user-query,.query-text"))||!!(r[i].querySelector&&r[i].querySelector(".user-query,.query-text"))}catch{a=!1}o=a?"user":"assistant"}if(o==="assistant"){var s="";try{s=(r[i].innerText||r[i].textContent||"").trim()}catch{s=""}s=Hi(s);var u="";try{u=r[i].getAttribute&&r[i].getAttribute("data-message-id")||""}catch{u=""}return{text:s,id:String(u||"").trim()}}}return{text:"",id:""}}function pv(){try{var e=typeof g<"u"?g:null;if(!e||e.siteName!=="chatgpt")return null;var t=null;if(typeof e.getVisibleMessages=="function"?t=e.getVisibleMessages():typeof e.extractMessages=="function"&&(t=e.extractMessages()),!Array.isArray(t)||!t.length)return null;for(var n=[],r=0;r<t.length;r++){var i=t[r]||{},o=i.role==="user"||i.role==="human"?"user":i.role==="assistant"?"assistant":"",a=String(i.text!=null?i.text:i.content!=null?i.content:"").trim();o&&a&&n.push({role:o,text:a})}return n.length?n:null}catch(s){return typeof v=="function"&&v(s,"hybrid-tail:dom-visible"),null}}function mv(e,t){var n=rn(String(e&&e.text||""));if(!n)return!1;for(var r=e&&e.role==="user"?"user":"assistant",i=t.length-1;i>=0;i--){var o=t[i]||{},a=o.role==="user"||o.role==="human"?"user":"assistant";if(a===r){var s=rn(String(o.text||""));if(s&&(s===n||s.indexOf(n)===0||n.indexOf(s)===0))return!0}}return!1}function cn(e){if(!Array.isArray(e)||!e.length)return null;var t=pv();if(!t||!t.length)return null;for(var n=e.length-1;n>=0&&!String(e[n]&&e[n].text||"").trim();)n--;if(n<0)return null;var r=e[n],i=r.role==="user"||r.role==="human"?"user":"assistant",o=rn(String(r.text||""));if(!o)return null;for(var a=-1,s=t.length-1;s>=0;s--)if(t[s].role===i){var u=rn(String(t[s].text||""));if(u&&(u===o||i==="assistant"&&(u.indexOf(o)===0||o.indexOf(u)===0))){a=s;break}}if(a<0){if(i!=="user"||typeof E<"u"&&E!==!0)return null;for(var l=t.length-1;l>=0;l--)if(t[l].role==="assistant"){if(mv(t[l],e))return null;var c=t.slice(l);return{messages:c,text:c.map(function(d){return d.text}).join(`
`),via:"new-answer"}}return null}var f=t.slice(a+1).filter(function(d){return!!d.text});return f.length?{messages:f,text:f.map(function(d){return d.text}).join(`
`),via:"anchor"}:null}var dg="";function Pp(e){try{if(typeof w!="function")return;var t=e.via+"|"+e.messages.length+"|"+e.text.length;if(t===dg)return;dg=t,w("chatgpt-dom-suffix",{via:e.via,msgs:e.messages.length,textLen:e.text.length})}catch(n){typeof v=="function"&&v(n,"hybrid-tail:dom-suffix-diag")}}var gg="";function pg(e,t,n){try{if(typeof w!="function")return;var r=e+"|"+t.length+"|"+n.length;if(r===gg)return;gg=r,w("chatgpt-final-overlay",{index:e,baseLen:t.length,domLen:n.length,delta:n.length-t.length})}catch(i){typeof v=="function"&&v(i,"hybrid-tail:final-overlay-diag")}}function Un(e){try{if(typeof g>"u"||!g||g.siteName!=="chatgpt")return null}catch{return null}if(!Array.isArray(e)||!e.length)return null;for(var t=e.length-1;t>=0&&e[t]&&e[t].role!=="assistant";)t--;if(t<0)return null;var n=String(e[t]&&e[t].text||"");if(!n)return null;var r=Op(),i=r.text;if(!i||i.length<=n.length||r.id&&tt&&tt.size>0&&!tt.has(r.id))return null;if(i.indexOf(n)===0)return pg(t,n,i),{index:t,before:n,text:i};var o=n,a="",s=n.match(/(?:\s*:::\s*)+$/);s&&s.index&&s.index>0&&(o=n.slice(0,s.index).replace(/\s+$/,""),a=n.slice(s.index));var u=gv(o,i);if(u>0&&u<i.length){var l=i.slice(u),c=o+l;return a&&!/(?:\s*:::\s*)+$/.test(l)&&(c+=a),pg(t,n,c),{index:t,before:n,text:c}}return null}function Dp(e){var t=typeof cn=="function"?cn(e):null;if(t)return Pp(t),(e||[]).concat(t.messages);var n=typeof Un=="function"?Un(e):null;if(!n)return e;var r=(e||[]).slice();return r[n.index]=Object.assign({},r[n.index],{text:n.text}),r}function hv(e){return Dp(e)}function qi(){if(I&&P){var e=Ba(),t=(e.sel||"")+"|"+(e.bounded?"1":"0");if(t!==xr&&(xr=t,e.diag!==na&&(na=e.diag,p("log","[hybrid-tail] "+e.diag))),xn=E?!0:e.bounded,e.bounded&&e.text)return li(P)+`
`+e.text;var n=typeof de<"u"&&Array.isArray(de)?de:null,r=typeof cn=="function"?cn(n):null;if(r)return Pp(r),li(P)+`
`+r.text;var i=typeof Un=="function"?Un(n):null;if(i){var o=li(P),a=i.before;if(o.length>=a.length&&o.slice(o.length-a.length)===a)return o.slice(0,o.length-a.length)+i.text}return li(P)}return""}function Fp(e){if(I&&P){var t=Ba();if(!t.count){var n=typeof de<"u"&&Array.isArray(de)?de:null,r=typeof cn=="function"?cn(n):null;return r?R+r.messages.length:R}return t.bounded?R+t.count:R}return e}var mg=null,hg="",yg=!1,vg="",Cg=-1,bg="",xg=null;function xa(){if(!I||!P)return null;var e=typeof de<"u"&&Array.isArray(de)&&de.length>0?de:null;if(!e)return null;var t=Ba(),n=t.text&&t.bounded?t.text:"",r=n||typeof cn!="function"?null:cn(e),i=r?r.text:"",o=n||r?null:typeof Un=="function"?Un(e):null,a=o?o.text:"",s=o?o.index:-1;if(mg===e&&hg===n&&yg===!!t.bounded&&bg===i&&vg===a&&Cg===s)return xg;var u;return n?u=e.concat(t.messages):r?u=e.concat(r.messages):o?(u=e.slice(),u[o.index]=Object.assign({},e[o.index],{text:o.text})):u=e,mg=e,hg=n,yg=!!t.bounded,bg=i,vg=a,Cg=s,xg=u,u}(function(){var e={};e.normalize=ba,e.stripMd=Ip,e.MSG_SELECTORS=Jo,e.findMessageNodes=kr,e.nodeIsBase=_p,e.shouldUseGeminiDomParser=Rp,e.aiCmStripAttachmentSections=Lp,e.aiCmAttachmentNames=Cl,e.aiCmStripChromeLines=Hi,e.aiCmTailSkel=rn,e.computeTailFromDom=Ba,e.aiCmTailMetricBase=li,e.getEffectiveText=qi,e.getEffectiveCount=Fp,e.getEffectiveMessages=xa,e.aiCmFinalAssistantOverlay=Un,e.aiCmApplyFinalAssistantOverlay=hv,e.aiCmApplyLiveDomTail=Dp,e.aiCmDomNewSuffix=cn,e.aiCmDomLastAssistant=Op,typeof le<"u"&&le.exports&&(le.exports=e),typeof window<"u"&&(window.AiCmHybridTail=e)})();function yv(e){return!!e&&typeof e.then=="function"}function wa(e){return typeof window<"u"&&window.GeminiBatchexecuteParser&&window.GeminiBatchexecuteParser.sanitizeGeminiText?window.GeminiBatchexecuteParser.sanitizeGeminiText(e):typeof e!="string"?e:e.replace(/\$AXzLiR[A-Za-z0-9+\/=\s]+/g," ").replace(/File attachment was not previously registered/g,"").replace(/\[cite:\s*\d+\]/g,"")}var wg={},Rt=!1;function vv(){try{return sessionStorage.getItem("aiCmDebug")==="1"}catch{return!1}}function Cv(e){if(!(!e||!e.length)&&vv())for(var t=0;t<e.length;t++){var n=String(e[t]||"");if(!(!n||wg[n]===1)){wg[n]=1;try{console.log("[AI CM][sanitize] skip reason="+n)}catch{}}}}function or(e,t,n,r){try{if(typeof w!="function")return!1;var i=r===void 0?Rt===!0:r===!0;return w("o40-emit-entry",{hidden:i?"on":"off",branch:e,msgsIn:Array.isArray(t)?t.length:0,msgsOut:Array.isArray(n)?n.length:0})!==!1}catch{return!1}}function Mr(e){var t=typeof Rt<"u"&&Rt===!0;try{var n=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!n||typeof n.hasReasoningInSource!="function"||typeof n.effectiveReasoningToggle!="function")return t;var r=typeof g<"u"&&g&&g.siteName?g.siteName:"";return n.effectiveReasoningToggle(t,n.hasReasoningInSource(e)===!0,r)===!0}catch{return t}}function sr(e){try{let i=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!i||typeof i.sanitizeEmitMessages!="function")return typeof or=="function"&&or("no-pipeline",e,e),e;var t=typeof Mr=="function"?Mr(e):Rt===!0,n=function(){var o=typeof i.includeHiddenExportBlocks=="function"?i.includeHiddenExportBlocks(e):e;return typeof or=="function"&&or("includeHiddenExportBlocks",e,o,t),o};if(Rt===!0||t)return n();var r=i.sanitizeEmitMessages(e);return Cv(r&&r.skipped),typeof or=="function"&&or("sanitizeEmitMessages",e,r&&r.messages),r&&Array.isArray(r.messages)?r.messages:e}catch{return e}}var Wo={};function Uu(){try{return!!(g&&g.siteName==="qwen")}catch{return!1}}function Sg(e){try{var t=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!t||typeof t.applyReasoningExportFields!="function")return e;t.applyReasoningExportFields(e,Uu())}catch(n){v(n,"export:aiCmPrepareReasoningForExport")}return e}function Ir(){var e=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,t=typeof cp=="function"?cp():null;if(t&&t.length)return sr(t);var n=Q||[],r=typeof Sg=="function"?Sg:null,i=e&&typeof e.pickExportSource=="function"?e.pickExportSource(I===!0,n.length>0):I&&n.length>0?"network":"adapter";try{if(typeof w=="function"&&typeof Ne=="function"&&Ne()&&typeof g<"u"&&g&&g.siteName==="deepseek"){var o=typeof g.extractMessages=="function"?g.extractMessages().length:0,a=I===!0?n.length>0?"baseSeen+networkTexts":"baseSeen-no-networkTexts":"no-baseSeen";w("o21-source-select",{site:g.siteName,domMsgs:o,netMsgs:n.length,sourceSelected:i==="network"?"network":"dom",reason:a})}}catch{}var s=[];if(i==="network"){if(Array.isArray(Ie)&&Ie.length===n.length&&n.length>0)for(var u=0;u<n.length;u++){var l=Ie[u]||{},c=l.role||"",f={role:c==="user"||c==="human"?"user":"assistant",text:wa(n[u])};Array.isArray(l.sources)&&(f.sources=l.sources),l.artifact&&typeof l.artifact=="object"&&(f.artifact=l.artifact),Array.isArray(l.artifacts)&&(f.artifacts=l.artifacts),typeof w=="function"&&typeof g<"u"&&g&&g.siteName==="claude"&&w("claude-role-network",{r:c,normalizedRole:f.role}),typeof l.reasoning=="string"&&l.reasoning&&(f.reasoning=l.reasoning),s.push(f)}else for(var d=0;d<n.length;d++)s.push({role:d%2===0?"user":"assistant",text:wa(n[d])});r&&r(s);try{var h=typeof window<"u"&&window&&window.AiCmHybridTail?window.AiCmHybridTail:null;if(h&&typeof h.aiCmApplyLiveDomTail=="function"){var m=h.aiCmApplyLiveDomTail(s);Array.isArray(m)&&m.length&&(s=m)}}catch(N){v(N,"export-manager:final-assistant-overlay")}var y=typeof Rt<"u"&&Rt===!0;!y&&typeof Mr=="function"&&(y=Mr(s));var C=typeof Uu=="function"?Uu:null;if(!y&&C&&C())for(var S=0;S<s.length;S++)s[S]&&typeof s[S]=="object"&&delete s[S].reasoning;return sr(s)}try{if(g&&typeof g.extractMessages=="function"){for(var b=g.extractMessages()||[],x=!1,M=0;M<b.length;M++)if(b[M]&&(b[M].role==="user"||b[M].role==="assistant"||b[M].role==="human")){x=!0;break}var k=e&&typeof e.normalizeExportMessages=="function"?e.normalizeExportMessages(b):[];if(typeof w=="function"&&typeof g<"u"&&g&&g.siteName==="claude"&&w("claude-role-adapter",{rawRole:x?b[M].role:void 0,normalizedRole:k.length>0?k[0].role:void 0,hasRoles:x}),r&&r(k),k.length>0&&x)return sr(k);for(var A=0;A<k.length;A++){var G={role:A%2===0?"user":"assistant",text:k[A].text};for(var H in k[A])Object.prototype.hasOwnProperty.call(k[A],H)&&H!=="role"&&H!=="text"&&(G[H]=k[A][H]);s.push(G)}}}catch(N){At(N,"export:aiCmCollectExportSource-dom-adapter")}return r&&r(s),sr(s)}function Sa(e,t){try{var n=g&&g.siteName||"",r=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!r||typeof r.resolveExportSource!="function"||n!=="gemini")return null;var i=typeof Tr=="function"?Tr():null,o=!!(i&&typeof i=="object");o&&i&&i.convId&&e&&String(i.convId)!==String(e)&&(o=!1);var a=o&&i&&Array.isArray(i.messages)?i.messages:[],s=Array.isArray(t)?t.length:0,u=r.resolveExportSource({isGemini:!0,bridge:o,archiveCount:o&&i&&typeof i.archiveCount=="number"?i.archiveCount:0,liveCount:o&&i&&typeof i.liveCount=="number"?i.liveCount:null,baseCount:o&&i&&typeof i.baseMsgs=="number"?i.baseMsgs:0,localCount:s});if(!u||u.action==="local")return null;if(u.action==="block")return{blocked:!0,reason:u.reason,baseCount:o&&i&&typeof i.baseMsgs=="number"?i.baseMsgs:0,liveCount:o&&i&&typeof i.liveCount=="number"?i.liveCount:0,archiveCount:o&&i&&typeof i.archiveCount=="number"?i.archiveCount:0};for(var l=[],c=0;c<a.length;c++){var f=a[c]||{};typeof f.text!="string"||!f.text||l.push({role:f.role==="user"?"user":"assistant",text:f.text})}return l.length<=s?null:{blocked:!1,msgs:l,baseCount:a.length,liveCount:i&&typeof i.liveCount=="number"?i.liveCount:0,archiveCount:i&&typeof i.archiveCount=="number"?i.archiveCount:0}}catch{return null}}function zn(){try{if(!(g&&g.siteName==="gemini")||typeof Tr!="function")return;var e=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(!e||typeof e.sourceTierOf!="function")return;var t=Tr();return!t||typeof t!="object"?void 0:e.sourceTierOf({archiveCount:typeof t.archiveCount=="number"?t.archiveCount:0,liveCount:typeof t.liveCount=="number"?t.liveCount:0})}catch(n){At(n,"export:aiCmGetSourceTier")}}function Np(e){return"aiCmAutoExportPct_"+(e||"")}function Bp(){try{if(!$()||!chrome.storage||!chrome.storage.local)return;var e=g&&g.siteName||"";if(!e)return;var t=Np(e);chrome.storage.local.get([t],function(n){try{var r=n&&n[t],i=parseInt(r,10);rt[e]=!isNaN(i)&&i>=1&&i<=100?i:void 0,p("log","[AI CM][auto-export] per-site load "+t+"="+(rt[e]===void 0?"\u043D\u0435\u0442 (\u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u043B\u0431\u044D\u043A)":rt[e]))}catch(o){v(o,"export:loadAutoExportPerSitePct")}})}catch(n){p("error","[AI CM][auto-export] per-site load error:",n)}}var Ue={},Uo=null;function zu(){return Uo||(Uo=Promise.resolve().then(function(){return dp()}).then(function(e){try{for(var t in Ue)delete Ue[t];for(var n in e||{})Ue[n]=e[n]}catch{}return Ue}).catch(function(){return Ue}),Uo)}try{zu()}catch{}var hu=3,Ag=2e3,Aa={};function Gp(e){try{if(!e)return!1;var t=Aa[e]||0;return t>=hu?(p("log","[AI CM][auto-export] late retry exhausted "+t+"/"+hu+" convId="+e+" reason=cursor-live"),!1):(Aa[e]=t+1,p("log","[AI CM][auto-export] late retry "+(t+1)+"/"+hu+" scheduled in "+Ag+"ms convId="+e+" reason=cursor-live"),setTimeout(function(){try{Ga(e)}catch(n){v(n,"export:late-retry-tick")}},Ag),!0)}catch(n){return v(n,"export:scheduleLateRetry"),!1}}function Ga(e){try{if(!e||!Gn[e]||E!==!0||g&&g.siteName==="gemini"&&vt[e]!==1||it[e])return;if(bt[e]){p("log","[AI CM][auto-export] skip reason=cursor-live convId="+e+" pct="+ue+" baseComplete="+(E===!0?"1":"0")+" \u2192 late-retry"),Gp(e);return}Gn[e]=0,Aa[e]=0,typeof ue=="number"&&ue>=0&&(p("log","[AI CM][auto-export] late re-check base-complete convId="+e+" pct="+ue+" pendingCursor=0 baseComplete=1"),En(ue))}catch(t){v(t,"export:aiCmTryLateAutoExport")}}function Hp(e,t){var n={suspect:!1,confirmed:!1,lostHead:!1};try{if(!t||!Array.isArray(t.messageIds)||t.historyComplete===!1)return n;var r=typeof t.count=="number"?t.count:t.messageIds.length;if(!e||typeof e.maxCount!="number"||!(e.maxCount>0)||!(r<e.maxCount))return n;var i=Array.isArray(e.firstIds)?e.firstIds:[];if(i.length===0)return n;for(var o=[],a=Math.min(la,t.messageIds.length),s=0;s<a;s++)o.push(String(t.messageIds[s]));for(var u=0;u<i.length;u++)if(o.indexOf(String(i[u]))!==-1)return n;n.lostHead=!0,n.suspect=!0,n.confirmed=!!e.suspectPending}catch(l){At(l,"export:detectTrimStateFallback")}return n}function qp(e){try{if(!e||!Array.isArray(e.messageIds))return;var t=g&&g.siteName||"";if(t!=="gemini")return;var n=e.convId||we||T()||"";if(!n||e.historyComplete!==!0)return;var r=window.GeminiInterceptLogic,i=r&&typeof r.detectTrimState=="function"?r.detectTrimState:Hp,o=Li[n]||null,a=typeof e.count=="number"&&e.count>=0?e.count:e.messageIds.length,s=i(o,{count:a,messageIds:e.messageIds,historyComplete:!0}),u=e.messageIds.slice(0,la),l=s.lostHead&&o&&Array.isArray(o.firstIds)&&o.firstIds.length>0?o.firstIds:u,c=Math.max(a,o&&typeof o.maxCount=="number"?o.maxCount:0);Li[n]={maxCount:c,firstIds:l,suspectPending:s.lostHead?1:0},s.confirmed&&(p("log","[AI CM][trim] confirmed \u043E\u0431\u0440\u0435\u0437\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 convId="+n+" cnt="+a+" maxCount="+c),bl(n))}catch(f){At(f,"export:geminiDetectTrim")}}function bl(e){try{if(!e||gr[e])return;gr[e]=1;var t=E===!0&&!it[e]&&!bt[e]&&!(typeof ln=="function"&&ln(g&&g.siteName||""));if(!t){var n=Oi[e]||0;if(n>=5){p("log","[AI CM][auto-export] skip reason=pre-trim-not-ready convId="+e+" retries="+n+" baseComplete="+(E===!0?"1":"0"));return}Oi[e]=n+1,p("log","[AI CM][auto-export] pre-trim not ready, retry "+(n+1)+"/5 in 2s convId="+e),setTimeout(function(){try{gr[e]=0,bl(e)}catch(s){At(s,"export:maybeTrimExport-retry")}},2e3);return}var r=An(nt),i=typeof B<"u"&&B?B:null,o=i&&typeof i.tokens=="number"?i.tokens:Ae,a=r>0?Math.round(o/r*1e3)/10:0;Tn(e,a,"pre-trim"),p("log","[AI CM][auto-export] fired reason=pre-trim convId="+e+" msgs="+(R||0)+" lostHead=1.")}catch(s){p("error","[AI CM][auto-export] error:",s)}}function Zi(e){try{if(!Et||e&&Et.convId!==e)return;clearTimeout(Et.timer),Et=null}catch{}}function ji(e,t,n){try{if(n!==!0||typeof Sa!="function")return t;var r=Sa(e,t);if(r&&Array.isArray(r.msgs)&&r.msgs.length>t.length)return p("log","[AI CM][export] O-49 low-confidence base-union: localMsgs="+t.length+" unionMsgs="+r.msgs.length+" baseMsgs="+r.baseCount+" liveMsgs="+r.liveCount+" archiveMsgs="+r.archiveCount+" convId="+(e||"-")),r.msgs}catch(i){p("log","[AI CM][export] silent-catch aiCmUnionFileMessages: "+(i instanceof Error&&i.message||String(i)))}return t}function Wi(e){try{var t=e||we||T()||"",n=typeof Ir=="function"?Ir():null;return Array.isArray(n)&&n.length>0&&typeof jn=="function"&&(n=jn(n).messages),(!Array.isArray(n)||n.length===0)&&(n=typeof _t=="function"?_t():null),Array.isArray(n)?(n=ji(t,n,E!==!0),n):null}catch(r){return v(r,"export:currentBaseSnapshot"),null}}function xl(){try{if(!$()||!I||!P)return;var e=we||T()||"",t=typeof He=="function"?He(typeof Z=="function"?Z():e||""):null,n=nt,r=An(n),i=typeof B<"u"&&B?B:null,o=i&&typeof i.tokens=="number"?i.tokens:Ae,a=i&&i.limit>0?i.limit:r,s=i&&typeof i.percent=="number"?i.percent:a>0?Math.round(o/a*1e3)/10:0,u=typeof Wi=="function"?Wi(e):null;(!Array.isArray(u)||u.length===0)&&(u=typeof Ir=="function"?Ir():null,Array.isArray(u)&&u.length>0&&typeof jn=="function"&&(u=jn(u).messages),(!Array.isArray(u)||u.length===0)&&(u=_t()),u=ji(e,u,E!==!0));var l={host:window.location.hostname,convId:we,site:g&&g.siteName||"",model:We||(n?K.getModel(n)?.name||n:""),msgOrder:2,tokens:o,limit:a,windowLimit:i&&typeof i.windowLimit=="number"?i.windowLimit:void 0,displayLimit:a,accountLimit:i&&(i.accountLimit===null||typeof i.accountLimit=="number")?i.accountLimit:void 0,limitPlan:i&&(i.limitPlan===null||typeof i.limitPlan=="string")?i.limitPlan:void 0,limitWarnings:i&&Array.isArray(i.limitWarnings)?i.limitWarnings:void 0,saturated:i&&i.saturated===!0?!0:void 0,percent:s,src:i&&i.src?i.src:void 0,updatedAt:Date.now(),isLowConfidenceBase:E!==!0,sourceTier:typeof zn=="function"?zn():void 0,partial:typeof Te=="function"?Te(t).partial:t&&t.partial===!0?!0:void 0,partialReason:typeof Te=="function"?Te(t).partialReason:t&&t.partial===!0?t.partialReason||"incomplete":void 0,messages:u},c={aiCmHistory:l};c["aiCmHistory:"+window.location.hostname]=Ca(l),chrome.storage.local.set(c)}catch(f){p("log","[AI CM][export] silent-catch aiCmWriteCurrentHistory: "+(f instanceof Error&&f.message||String(f)))}}function wl(e,t){try{var n=Et;if(!n||e&&n.convId!==e||t!=="timeout"&&!(E===!0&&!it[n.convId]))return;clearTimeout(n.timer),Et=null,p("log","[AI CM][export] deferred flushed reason="+t+" convId="+n.convId);try{typeof w=="function"&&w("o22-deferred-flush",{ts:Date.now(),convId:n.convId||"(none)",histKey:(typeof R=="number"?R:0)+"|"+(typeof P=="string"&&P?P.length:0),lastKey:typeof me<"u"?me:void 0,reason:t||"(none)",baseSeen:typeof I<"u"&&I===!0?1:0,baseComplete:typeof E<"u"&&E===!0?1:0})}catch{}xl()}catch(r){p("log","[AI CM][export] silent-catch aiCmFlushDeferredHistWrite: "+(r instanceof Error&&r.message||String(r)))}}function jp(e){try{let n=function(){if(Et===t){if(document.visibilityState!=="visible"){t.timer=setTimeout(n,6e4),p("log","[AI CM][export] deferred-wait-visible convId="+e+" (\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0441\u043A\u0440\u044B\u0442\u0430 \u2014 \u0442\u0430\u0439\u043C\u0430\u0443\u0442 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0451\u043D, \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u043A\u0430\u043A \u0435\u0441\u0442\u044C \u043E\u0442\u043B\u043E\u0436\u0435\u043D)");return}Et=null;var r=T()||"";if(r&&e!==r){p("log","[AI CM][export] deferred-timeout skip reason=stale-conv timerConv="+e+" current="+r);return}if(p("log","[AI CM][export] deferred-timeout(60s), exporting as-is convId="+e+" pendingCursor="+(bt[String(e)]?"1":"0")+" baseComplete="+(E===!0?"1":"0")),E!==!0){try{Sn[e]=!0,we&&we!==e&&(Sn[we]=!0)}catch(i){p("log","[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite(fireDeferredTimeout/lowConf): "+(i instanceof Error&&i.message||String(i)))}p("log","[AI CM][export] as-is baseComplete=0 \u2192 isLowConfidenceBase=true convId="+e)}try{typeof w=="function"&&w("o50-timeout-download",{ts:Date.now(),convId:e,path:"deferred-timeout-60s",asIs:E!==!0?1:0,baseComplete:E===!0?1:0,snapshot:"write-current-history",download:"absent",reason:"no-download-point-on-timeout-path",fired:typeof Pe=="object"&&Pe&&Pe[String(e)]===1?1:0,dlNames:typeof on=="object"&&on?Object.keys(on).length:0})}catch{}try{xl()}catch(i){p("log","[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite(fireDeferredTimeout/export): "+(i instanceof Error&&i.message||String(i)))}}};Zi(),p("log","[AI CM][export] deferred until base-complete convId="+e+" loader="+!!it[String(e)]+" baseComplete="+E);var t={convId:e,timer:null};t.timer=setTimeout(n,6e4),Et=t}catch(n){p("log","[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite: "+(n instanceof Error&&n.message||String(n)))}}function Sl(){try{if(!$()||!chrome.storage||!chrome.storage.local)return;chrome.storage.local.get(["aiCmAutoExport","aiCmAutoExportPct","aiCmAutoExportFmt"],function(e){try{e=e||{},typeof e.aiCmAutoExport!="boolean"?(_e.enabled=!1,hi||(hi=!0,console.log("[AI CM][auto-export] \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438: \u0444\u043B\u0430\u0433 enabled \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u2014 \u0430\u0432\u0442\u043E\u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D"))):(hi=!1,_e.enabled=e.aiCmAutoExport===!0);var t=parseInt(e.aiCmAutoExportPct,10);_e.pct=!isNaN(t)&&t>=1&&t<=100?t:90;var n=e.aiCmAutoExportFmt;_e.fmt=n==="md"||n==="json"?n:"txt"}catch(r){p("error","[AI CM][auto-export] parse settings error:",r)}});try{chrome.storage.onChanged.addListener(function(e,t){t==="local"&&(e.aiCmAutoExport||e.aiCmAutoExportPct||e.aiCmAutoExportFmt)&&Sl()})}catch{}}catch(e){p("error","[AI CM][auto-export] load settings error:",e)}}function bv(){try{if(!$()||!chrome.storage||!chrome.storage.local)return;chrome.storage.local.get(["aiCmIncludeHiddenInExport"],function(e){try{Rt=!!(e&&e.aiCmIncludeHiddenInExport===!0)}catch{}});try{chrome.storage.onChanged.addListener(function(e,t){t==="local"&&e.aiCmIncludeHiddenInExport&&(Rt=e.aiCmIncludeHiddenInExport.newValue===!0)})}catch{}}catch(e){p("error","[AI CM][export] include-hidden setting load error:",e)}}function Ye(){try{var e=T()||"",t=g&&g.siteName||"",n=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;return n&&typeof n.resolveAutoExportConvId=="function"?n.resolveAutoExportConvId(t,e,Ze||"")||"":e}catch{return T()||""}}function Tg(e){try{var t=e==null?"":String(e),n=typeof vi=="string"?vi:null;if(n!==null&&n===t)return!1;var r=0;if(typeof ct=="object"&&ct){for(var i in ct)Object.prototype.hasOwnProperty.call(ct,i)&&delete ct[i];r=1}return vi=t,typeof w=="function"&&w("gsa-latch",{point:"reset",tid:t,prev:String(n),cleared:r}),!0}catch{return!1}}function Eg(e,t){try{var n=t||g&&g.siteName||"";if(n!=="google_search")return!1;var r=e==null?"":String(e),i=Ye()||r;return!i||typeof ct!="object"||!ct?!1:(ct[n+"|"+i]=1,typeof w=="function"&&w("gsa-latch",{point:"set",cid:i,key:n+"|"+i}),!0)}catch{return!1}}function _r(e,t){try{return e!=="google_search"||!t||typeof ct!="object"||!ct?!1:ct[e+"|"+t]===1}catch{return!1}}var xv=15e3,Al={},Ta=!1;window.addEventListener("ai-cm-gsa-probe-state",function(e){try{var t=e&&e.detail;if(!t)return;Ta=t.running===!0,t.threadId&&(Al[t.threadId]=Ta?Date.now():0)}catch{}});function Ui(e){try{if(e){var t=Al[e];return t>0&&Date.now()-t<xv}return Ta===!0}catch{return!1}}function zi(e,t){var n=zi;try{var r=String(e||""),i=t==null?"":String(t),o=typeof yi=="object"&&yi?yi:null;return o||(n.__state||(n.__state=Object.create(null)),o=n.__state),o[r]===i?!1:(o[r]=i,!0)}catch{return!0}}function Ea(e,t){try{var n=t==null?"":String(t);if(!n)return 0;var r=String(e||"")+"|"+n;return typeof he=="object"&&he&&he[r]===1||typeof Pe=="object"&&Pe&&Pe[r]===1?1:0}catch{return 0}}function Wp(e,t,n){try{if(e==="not-complete"||e==="probe-running"){var r="gsa:"+t;if(Se[r])return;Se[r]=1}else if(e==="not-chat-page"||e==="no-messages"||e==="empty-base"){var i="gsa27:"+e+":"+t;if(Se[i])return;Se[i]=1}if(typeof zi=="function"){var o=typeof Ea=="function"?Ea("google_search",t):0;if(!zi("gsa-skip","google_search|"+t+"|"+e+"|fired="+o))return}p("log","[AI CM][auto-export] site=google_search skip reason="+e+" convId="+t+" pct="+n+" probeRunning="+(Ui(t)?"1":"0"))}catch{}}var Ku=800,kg=150,yu={},Mg={},Ig={};function Up(){try{var e=null,t=function(n){e=n.detail};return window.addEventListener("ai-cm-deepseek-stream-probe-response",t,{once:!0}),window.dispatchEvent(new CustomEvent("ai-cm-deepseek-stream-probe")),window.removeEventListener("ai-cm-deepseek-stream-probe-response",t),e}catch{return null}}function Tl(e){try{if((g&&g.siteName||"")!=="deepseek")return!1;var t=Up();return!(!t||t.active!==!0||t.convId&&e&&String(t.convId)!==String(e))}catch{return!1}}function El(e){try{return Tl(e)?(window.dispatchEvent(new CustomEvent("ai-cm-deepseek-stream-flush")),e&&!Ig[e]&&(Ig[e]=1,p("log","[AI CM][auto-export] stream-flush convId="+e+" reason=manual")),!0):!1}catch{return!1}}function $u(e,t){try{if(!e||!Tl(e))return!1;var n=(yu[e]||0)+1;return yu[e]=n,n>kg?(yu[e]=0,El(e),p("log","[AI CM][auto-export] stream-flush convId="+e+" reason=defer-cap defers="+kg),!1):(Mg[e]||(Mg[e]=1,p("log","[AI CM][auto-export] defer reason=stream-active convId="+e+" pct="+t+" ms="+Ku+" histSource=memory")),setTimeout(function(){try{if(!e||e!==Ye())return;En(t)}catch(r){v(r,"export:aiCmDeferAutoExportOnLiveStream-timer")}},Ku),!0)}catch{return!1}}var _g={reason:""};function Rg(e,t){try{if(typeof w!="function")return;var n=typeof g<"u"&&g&&g.siteName||"";w("auto-export",{point:"maybeAutoExport",verdict:"skip",reason:"base-pending",site:n,convId:e,pct:t,baseSeen:typeof I<"u"&&I===!0?1:0,baseComplete:typeof E<"u"&&E===!0?1:0})}catch{}}function zo(e,t,n){try{if(typeof w!="function")return!1;var r=typeof g<"u"&&g&&g.siteName||"",i=typeof Q<"u"&&Array.isArray(Q)?Q.length:0,o=typeof P=="string"?P.length:0;o===0&&typeof Q<"u"&&Array.isArray(Q)&&(o=Q.join(`
`).length);var a=typeof _r=="function"?_r(r,Ye()||"")===!0:!1,s;try{var u=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;u&&typeof u.pickExportSource=="function"&&(s=u.pickExportSource(I===!0,i>0))}catch{s=void 0}return w("auto-export-decision",{ts:Date.now(),point:"maybeAutoExport",site:r,convId:Ye()||"",verdict:t===!0?"skip":"fire",reason:t===!0?n||"":"threshold",pct:e,histSource:typeof I<"u"&&I===!0?"network":"memory",fileSource:s,baseSeen:typeof I<"u"&&I===!0?1:0,baseComplete:typeof E<"u"&&E===!0?1:0,netLatch:a,msgs:typeof R=="number"?R:0,memMsgs:i,textLen:o}),!0}catch{return!1}}function Lg(e,t,n,r){return e==="qwen"&&t===!0&&n!==!0&&r!==!0}function En(e){try{var t=_e;if(!t||t.enabled!==!0)return;var n=Ye();n!==sa&&(Se={},sa=n);var r=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,i=g&&g.siteName||"",o=typeof rt=="object"&&rt?rt[i]:void 0,a=r&&typeof r.effectiveAutoExportThreshold=="function"?r.effectiveAutoExportThreshold(t.pct,o):typeof t.pct=="number"&&t.pct>=1&&t.pct<=100?t.pct:90;if(typeof e!="number"||!(e>=0))return;if((I===!0||i==="gemini")&&(ue=e),typeof ln=="function"&&ln(i)){ua[n]||(ua[n]=1,p("log","[AI CM][auto-export] skip reason=network-pending convId="+n+" pct="+e+" baseComplete="+(E===!0?"1":"0")));return}var s=i==="gemini",u,l,c,f;if(i==="google_search"&&(u=typeof R=="number"?R:void 0,c=typeof Qu=="function"?Qu():void 0,typeof P=="string"?l=P.length:typeof Q<"u"&&Array.isArray(Q)&&(l=Q.join(`
`).length),f=typeof _r=="function"?_r(i,n)===!0:!1),r&&typeof r.shouldSkipAutoExport=="function"){var d=r.shouldSkipAutoExport({enabled:t.enabled,percentage:e,threshold:a,baseComplete:E===!0,baseSeen:I===!0,loaderRunning:!!(n&&it[n]),archiveCount:xu(n),baseCount:R,fired:r.getAutoExportFired(Pe,i,n)||(typeof r.isFiredInSession=="function"?r.isFiredInSession(Ue,i,n):!1)||typeof he=="object"&&he&&he[i+"|"+n]===1||typeof ur=="function"&&ur(n),isGemini:s,domBaseTrusted:typeof La=="function"?La()===!0:!1,historyIncomplete:typeof Lg=="function"?Lg(i,I===!0,E===!0,typeof Ht=="object"&&Ht?Ht[n]===!0:!1):!1,site:i,chatPageMarker:c,msgCount:u,baseTextLen:l,gsaNetworkCompleteLatch:f}),h=typeof _g<"u"?_g:null;if(d&&d.skip){var m=!h||h.reason!=="base-pending";if(h&&(h.reason=d.reason),d.reason==="below-threshold-hysteresis"){r.resetAutoExportFired(Pe,i,n);try{if(typeof r.firedSessionKey=="function"){ca(i,n);var y=r.firedSessionKey(i,n);y&&delete Ue[y]}}catch(x){v(x,"export:maybeAutoExport-latch-hysteresis")}}if(d.reason==="base-pending"){m&&typeof Rg=="function"&&Rg(n,e);return}if(i==="google_search"){var C=d.reason;d.reason==="not-complete"&&r&&typeof r.notCompleteReason=="function"&&(C=r.notCompleteReason({site:i,probeRunning:Ui(n)})),Wp(C,n,e);return}d.reason==="not-complete"?n&&!Se[n]&&(Se[n]=1,p("log","[AI CM][auto-export] skip reason=not-complete convId="+n+" pct="+e)):d.reason==="already-fired"?p("log","[AI CM][auto-export] skip reason=already-fired convId="+n):d.reason==="loader-running"?p("log","[AI CM][auto-export] skip reason=loader-running convId="+n+" pct="+e):d.reason==="archive-pending-live"?n&&!Se["arch:"+n]&&(Se["arch:"+n]=1,p("log","[AI CM][auto-export] skip reason=archive-pending-live convId="+n+" baseCount="+R+" archiveMsgs="+xu(n))):d.reason==="below-threshold"?p("log","[AI CM][auto-export] skip reason=below-threshold convId="+n+" pct="+e):d.reason==="below-threshold-hysteresis"||d.reason,typeof zo=="function"&&zo(e,!0,d.reason);return}if(h&&(h.reason=""),n&&(delete Se[n],delete Se["gsa:"+n]),!n)return;if(bt[n]){Se["cur:"+n]||(Se["cur:"+n]=1,p("log","[AI CM][auto-export] skip reason=cursor-live convId="+n+" pct="+e+" pendingCursor=1 baseComplete="+(E===!0?"1":"0")));return}typeof zo=="function"&&zo(e,!1),Tn(n,e,"threshold");return}if(s){var S=xu(n);if(S>0&&R<=S){p("log","[AI CM][auto-export] skip reason=archive-pending-live convId="+n+" baseCount="+R+" archiveMsgs="+S);return}}if(E!==!0){n&&!Se[n]&&(Se[n]=1,p("log","[AI CM][auto-export] skip reason=not-complete convId="+n+" pct="+e));return}if(n&&delete Se[n],n&&it[n]){p("log","[AI CM][auto-export] skip reason=loader-running convId="+n+" pct="+e);return}if(e<a-10){if(I===!0&&n){delete Pe[n];try{if(r&&typeof r.firedSessionKey=="function"){ca(i,n);var b=r.firedSessionKey(i,n);b&&delete Ue[b]}}catch(x){v(x,"export:maybeAutoExport-latch-below-threshold")}}return}if(e<a){p("log","[AI CM][auto-export] skip reason=below-threshold convId="+n+" pct="+e);return}if(!n)return;if(Pe[n]||r&&typeof r.isFiredInSession=="function"&&r.isFiredInSession(Ue,i,n)||typeof he=="object"&&he&&he[i+"|"+n]===1||typeof ur=="function"&&ur(n)){p("log","[AI CM][auto-export] skip reason=already-fired convId="+n);return}if(bt[n]){Se["cur:"+n]||(Se["cur:"+n]=1,p("log","[AI CM][auto-export] skip reason=cursor-live convId="+n+" pct="+e+" pendingCursor=1 baseComplete="+(E===!0?"1":"0")));return}Tn(n,e,"threshold")}catch(x){p("error","[AI CM][auto-export] error:",x)}}function zp(e){try{var t=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,n=typeof _e=="object"&&_e?_e:null,r=n&&typeof n.pct=="number"?n.pct:void 0,i=typeof rt=="object"&&rt?rt[e||""]:void 0;return t&&typeof t.effectiveAutoExportThreshold=="function"?t.effectiveAutoExportThreshold(r,i):typeof r=="number"&&r>=1&&r<=100?r:90}catch{return 90}}var on=Object.create(null);function wv(e,t,n){var r=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,i=typeof on=="object"&&on?on:null;i&&t&&r&&typeof r.isFileNameTaken=="function"&&r.isFileNameTaken(i,t)&&typeof r.disambiguateFileName=="function"&&(t=r.disambiguateFileName(t,i));try{i&&t&&(i[t]=1)}catch{}var o=typeof Be<"u"?Be:null;if(!o||typeof o.downloadBlob!="function")throw new Error("utils/export-text-builders.js \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");return o.downloadBlob(e,t,n==="md"?"text/markdown":n==="json"?"application/json":"text/plain;charset=utf-8","autoexport"),t}function Tn(e,t,n,r){try{let ie=function(Y,j,te,W){try{if(j==="storage-host"&&!te&&e||te&&e&&String(te)!==String(e)||W&&d&&String(W)!==String(d)){p("log","[AI CM][auto-export] abort reason=history-source-mismatch histConvId="+te+" site="+W);return}var ke=Y;try{vl("snapshot-at-fired",e,ke)}catch{}var F=typeof B<"u"&&B?B:null,ye=F&&F.limit>0?F.limit:typeof An=="function"?An(nt):0,Le=F&&typeof F.tokens=="number"?F.tokens:typeof Ae=="number"?Ae:0,Ot=F&&typeof F.percent=="number"?F.percent:typeof t=="number"?t:0;if(F&&F.saturated===!0)Ot=100;else if(ye>0){var xt=Math.round(Le/ye*1e3)/10;xt!==Ot&&(Ot=xt)}var De=typeof He=="function"?He(typeof Z=="function"?Z():e||""):null,ne={site:g&&g.siteName||"",model:F&&F.modelName?F.modelName:K.getModel(nt||"")?.name||"",tokens:Le,limit:ye,windowLimit:F&&typeof F.windowLimit=="number"?F.windowLimit:void 0,displayLimit:ye,accountLimit:F&&(F.accountLimit===null||typeof F.accountLimit=="number")?F.accountLimit:void 0,limitPlan:F&&(F.limitPlan===null||typeof F.limitPlan=="string")?F.limitPlan:void 0,limitWarnings:F&&Array.isArray(F.limitWarnings)?F.limitWarnings:void 0,saturated:F&&F.saturated===!0?!0:void 0,percent:Ot,src:F&&F.src?F.src:void 0,sourceTier:typeof zn=="function"?zn():void 0,partial:typeof Te=="function"?Te(De).partial:De&&De.partial===!0?!0:void 0,partialReason:typeof Te=="function"?Te(De).partialReason:De&&De.partial===!0?De.partialReason||"incomplete":void 0,bodyProjection:k||void 0,dedupe:typeof lp=="function"?lp(Ie,ke):void 0,messages:ke},ot=c==="md"?V.buildMdFromHistory(ne,typeof Ko=="function"?Ko(String(ne&&ne.site||"")):String(ne&&ne.site||"")||"AI Chat"):c==="json"?typeof V.buildJsonFromHistory=="function"?V.buildJsonFromHistory(ne,typeof Ko=="function"?Ko(String(ne&&ne.site||"")):String(ne&&ne.site||"")||"AI Chat"):"":V.buildTxtFromHistory(ne);typeof ot!="string"&&(ot="");var wt=String(ot).replace(/^\uFEFF/,"").replace(/\s+/g,"").length;if(wt<=0){p("log","[AI CM][auto-export] skip reason=empty-text convId="+e);return}if(c==="txt"&&ot.charAt(0)!=="\uFEFF"&&(ot="\uFEFF"+ot),n!=="pre-trim"){var Oe=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(Oe&&typeof Oe.markAutoExportFired=="function"){Oe.markAutoExportFired(Pe,g&&g.siteName||"",e);try{var dn=g&&g.siteName||"";typeof he=="object"&&he&&(he[dn+"|"+e]=1)}catch(Ce){v(Ce,"export:aiCmWriteAutoExportFile-once")}try{var Ut=g&&g.siteName||"",pt=typeof Oe.firedSessionKey=="function"?Oe.firedSessionKey(Ut,e):null;pt&&(gp(Ut,e),Ue[pt]=1)}catch(Ce){v(Ce,"export:aiCmWriteAutoExportFile-fired-latch")}}else{Pe[String(e)]=1;try{var zt=g&&g.siteName||"";typeof he=="object"&&he&&(he[zt+"|"+e]=1)}catch(Ce){v(Ce,"export:aiCmWriteAutoExportFile-once-fallback")}}}Zi(e);try{var at=typeof Be<"u"?Be:null;at&&typeof at.aiCmDiagDownload=="function"&&at.aiCmDiagDownload("autoexport",ot,y,{reason:n,site:typeof g<"u"&&g&&g.siteName?g.siteName:"",threadId:typeof Ze=="string"?Ze:"",mime:c})}catch{}y=wv(ot,y,c),typeof Og=="function"&&Og(e,n),p("log","[AI CM][auto-export] fired convId="+e+" pct="+t+" file="+y+" textLen="+wt+" pendingCursor="+(bt[String(e)]?"1":"0")+" baseComplete="+(E===!0?"1":"0")+" histSource="+j+" histConvId="+te);try{window.dispatchEvent(new CustomEvent("ai-cm-auto-export-fired",{detail:JSON.stringify({convId:e,site:d||"",reason:n||""})}))}catch(Ce){v(Ce,"export:auto-export-fired-event")}try{typeof Qg=="function"&&Qg(n,e,t)}catch{}d==="google_search"&&p("log","[AI CM][auto-export] site=google_search fired convId="+e+" pct="+t+" file="+y+" fmt="+c+" model="+(m||"")+" lowConfidence="+(h===!0?"1":"0")+" baseComplete="+(E===!0?"1":"0")+" histSource="+j+" histConvId="+te)}catch(Ce){p("error","[AI CM][auto-export] error:",Ce)}};if(n!=="pre-trim"){var i=null;try{i=typeof He=="function"?He(typeof Z=="function"?Z():e||""):null}catch{i=null}if(i&&i.partial===!0){p("log","[AI CM][auto-export] skip reason=partial convId="+e+" partialReason="+(i.partialReason||"incomplete"));return}}var o=typeof window<"u"&&window.AiCmBaseHandler?window.AiCmBaseHandler:null;if(o&&typeof o.aiCmFilesDrainDefer=="function"&&o.aiCmFilesDrainDefer(e,t,n,r)||typeof $u=="function"&&$u(e,t))return;var a=typeof window<"u"&&window.AiCmBaseHandler?window.AiCmBaseHandler:null,s=a&&typeof a.aiCmFilesDrainSite=="function"?a.aiCmFilesDrainSite()===!0:!1,u=typeof Er=="function"?Er():!1;if(r!==!0&&(s||u)&&(typeof hr=="function"||typeof wn=="function"||a&&typeof a.aiCmExportFilesDrainThen=="function")){if(!Wo[String(e)]){Wo[String(e)]=1;var l=function(){delete Wo[String(e)],Tn(e,t,n,!0)};try{u&&typeof hr=="function"?hr(e,l):u&&typeof wn=="function"?wn(e,l):a&&typeof a.aiCmExportFilesDrainThen=="function"?a.aiCmExportFilesDrainThen(e,l,6e3):l()}catch{delete Wo[String(e)],l()}return}p("log","[AI CM][auto-export] net-sync \u0443\u0436\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F convId="+e);return}let V=typeof Be<"u"?Be:null;if(!V)throw new Error("utils/export-text-builders.js \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");var c=_e.fmt==="md"?"md":_e.fmt==="json"?"json":"txt",f=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,d=g&&g.siteName||"",h=d==="gemini"?Sn[String(e)]===!0:d==="google_search"?E!==!0:d==="qwen"?E!==!0&&typeof Ht=="object"&&Ht&&Ht[String(e)]===!0:!1,m=d==="google_search"&&typeof We=="string"?We:"",y,C=typeof on=="object"&&on?on:null;if(d==="google_search"&&f&&typeof f.buildGsaExportFileName=="function")y=f.buildGsaExportFileName(d,m,h,c,C);else if(f&&typeof f.buildExportFileName=="function")y=f.buildExportFileName(d,e,n,h,c,C);else{let Y=function(j){return(j<10?"0":"")+j};var S=new Date;y="chat-"+String(e).slice(0,8)+"-"+S.getFullYear()+"-"+Y(S.getMonth()+1)+"-"+Y(S.getDate())+"_"+Y(S.getHours())+"-"+Y(S.getMinutes())+(n==="pre-trim"?"-pretrim":"")+"."+c}var b=_t();if(I===!0&&Q.length===0){p("log","[AI CM][auto-export] skip reason=source-mismatch convId="+e+" baseSeen=1 networkTexts=0");return}var x=Sa(e,b),M="local",k="";if(x&&x.blocked===!0){p("log","[AI CM][auto-export] skip reason=archive-pending-live convId="+e+" baseMsgs="+x.baseCount+" liveMsgs="+x.liveCount+" archiveMsgs="+x.archiveCount+" source=archive-only-base");return}if(x&&Array.isArray(x.msgs)&&(p("log","[AI CM][auto-export] source=base-union convId="+e+" baseMsgs="+x.baseCount+" localMsgs="+(Array.isArray(b)?b.length:0)+" liveMsgs="+x.liveCount+" archiveMsgs="+x.archiveCount),b=x.msgs,M="base-union",typeof en=="function")){var A=en(b,g&&g.siteName||"");b=A.messages,k=A.mode}if(I===!0&&M!=="base-union"&&typeof Rr=="function"){var G=Rr(e);if(G&&G.messages&&G.messages.length&&(b=G.messages),typeof en=="function"){var H=en(b,g&&g.siteName||"");b=H.messages,k=H.mode}}var N="";try{typeof we=="string"&&we?N=we:d==="google_search"&&typeof Ze=="string"&&Ze?N=Ze:typeof T=="function"&&(N=T()||"")}catch{N=""}var D=d;if(!Array.isArray(b)||b.length===0){var L="";try{L=typeof window<"u"&&window.location&&window.location.hostname||""}catch{}var z=L?"aiCmHistory:"+L:"",X=!1,ee=!1,J=function(Y){if(!ee){ee=!0;var j=Y&&typeof Y=="object"?Y[z]:null;if(!j||!Array.isArray(j.messages)||j.messages.length===0){p("log","[AI CM][auto-export] skip reason=empty-history convId="+e+" histSource=storage-host");return}ie(j.messages,"storage-host",j.convId||"",j.site||"")}};try{if(z&&typeof chrome<"u"&&chrome&&chrome.storage&&chrome.storage.local&&typeof chrome.storage.local.get=="function"){X=!0;var Re=chrome.storage.local.get([z],J);yv(Re)&&Re.then(J,function(){J(null)})}}catch{X=!1}X||p("log","[AI CM][auto-export] skip reason=empty-history convId="+e);return}ie(b,"memory",N,D)}catch(V){p("error","[AI CM][auto-export] error:",V)}}window.addEventListener("ai-cm-loader-state",function(e){try{var t=e&&e.detail;if(!t||!t.convId)return;var n=(t.reachedStart===!0||t.reachedStart===1)&&(t.historyFullByQuiet===!0||t.historyFullByQuiet===1||t.baseComplete===!0);if(t.running){it[t.convId]=1,bt[t.convId]=n===!0?!1:!!t.pendingCursor,vt[t.convId]=t.baseComplete===!0&&t.reachedStart===!0?1:0;return}delete it[t.convId],bt[t.convId]=n===!0?!1:!!t.pendingCursor,vt[t.convId]=t.baseComplete===!0&&t.reachedStart===!0?1:0,vt[t.convId]===1?(typeof tl=="function"&&tl(t.convId,"loader-stop"),wl(t.convId,"loader-stop")):p("log","[AI CM][export] deferred kept reason=base-unconfirmed convId="+t.convId+" baseComplete="+(t.baseComplete===!0?"1":"0")+" reachedStart="+(t.reachedStart===!0?"1":"0"));var r=T()||"";r&&r===t.convId&&_e.enabled===!0&&typeof ue=="number"&&ue>=0&&(E!==!0||vt[r]!==1||t.pendingCursor&&n!==!0?(Gn[r]=1,Ga(r),p("log","[AI CM][auto-export] loader-stop \u0441 \u043D\u0435\u043F\u043E\u043B\u043D\u043E\u0439 \u0431\u0430\u0437\u043E\u0439 \u2192 \u043D\u0435 \u0441\u0442\u0440\u0435\u043B\u044F\u044E, \u0436\u0434\u0443 base-complete convId="+r+" pct="+ue+" pendingCursor="+(t.pendingCursor?"1":"0")+" baseComplete="+(E===!0?"1":"0")+" fullServer="+(n===!0?"1":"0"))):(p("log","[AI CM][auto-export] re-check \u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u043E\u043F\u0430 \u043B\u043E\u0430\u0434\u0435\u0440\u0430 convId="+r+" pct="+ue),En(ue)));try{if(r&&r===t.convId&&_e.enabled===!0&&E===!0&&!bt[r]&&!(function(){var u=g&&g.siteName||"",l=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;return l.getAutoExportFired(Pe,u,r)||(typeof l.isFiredInSession=="function"?l.isFiredInSession(Ue,u,r):!1)||typeof he=="object"&&he&&he[u+"|"+r]===1||typeof ur=="function"&&ur(r)})()&&(R||0)>0){var i=typeof ue=="number"&&ue>=0?ue:0,o=zp(typeof g<"u"&&g&&g.siteName||""),a=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null,s=a&&typeof a.shouldSkipBaseCompleteTrigger=="function"?a.shouldSkipBaseCompleteTrigger({percentage:i,threshold:o}):{skip:i<o,reason:"below-threshold-base-complete",threshold:o};s.skip?p("log","[AI CM][auto-export] skip reason="+s.reason+" convId="+r+" pct="+i+" threshold="+s.threshold+" trigger=base-complete"):(p("log","[AI CM][auto-export] base-complete trigger convId="+r+" msgs="+R+" pendingCursor=0 baseComplete=1 pct="+i),Tn(r,i,"base-complete"))}}catch(u){p("error","[AI CM][auto-export] base-complete trigger error:",u)}}catch(u){p("error","[AI CM][auto-export] loader-state error:",u)}});function ur(e){try{return!e||typeof g>"u"||!g||g.siteName!=="qwen"||typeof sessionStorage>"u"||!sessionStorage?!1:sessionStorage.getItem("aiCmAutoExportFired_"+String(e))==="1"}catch(t){return v(t,"export:autoexport-fired-storage-read"),!1}}function Og(e,t){try{return t==="pre-trim"||!e||typeof g>"u"||!g||g.siteName!=="qwen"||typeof sessionStorage>"u"||!sessionStorage?!1:(sessionStorage.setItem("aiCmAutoExportFired_"+String(e),"1"),!0)}catch(n){return v(n,"export:autoexport-fired-storage-write"),!1}}var Pg=null,Dg="",Fg="",Ng=null;function Vu(e,t){var n=Array.isArray(e)?e:[],r=typeof Be<"u"&&Be?Be:null,i=n;if(t==="qwen"&&r&&typeof r.aiCmDropContainerMessages=="function"){var o=r.aiCmDropContainerMessages(n);Array.isArray(o)&&(i=o)}for(var a=[],s=0;s<i.length;s++){var u=i[s]||{},l=typeof u.text=="string"?u.text:u.text==null?"":String(u.text),c="";if(r&&typeof r.aiCmReasoningOfMessageForExport=="function"){var f=r.aiCmReasoningOfMessageForExport(u);typeof f=="string"&&(c=f)}else typeof u.reasoning=="string"&&(c=u.reasoning);var d=l;if(r&&typeof r.aiCmWithReasoningSections=="function"){var h=r.aiCmWithReasoningSections(l,c);typeof h=="string"&&(d=h)}var m=Object.assign({},u);m.role=u.role==="user"||u.role==="human"?"user":"assistant",m.text=String(d??""),a.push(m)}return a}function Rr(e){var t=typeof xa=="function"?xa():null;if(!t&&typeof _t=="function"&&(t=_t()),!t||!t.length)return null;var n=typeof g<"u"&&g?g.siteName:"";if(Pg===t&&Dg===e&&Fg===n)return Ng;var r=Vu(t,n),i=typeof kn=="function"?kn(e||"",r):null;return Pg=t,Dg=e,Fg=n,Ng=i,i}function en(e,t){var n=typeof fp=="function"?fp:null;if(!n)return{messages:Array.isArray(e)?e:[],mode:""};var r=null;try{var i=t==="google_search"&&typeof window<"u"&&window.GoogleFolwrUtils?window.GoogleFolwrUtils:null;if(i&&typeof i.stripGsaUserEcho=="function"&&typeof i.stripGsaAssistantEcho=="function"){var o=i;r=function(a,s){return s&&(s.role==="user"||s.role==="human")?o.stripGsaUserEcho(a):o.stripGsaAssistantEcho(a)}}}catch{r=null}return n(e,{includeHidden:typeof Rt<"u"&&Rt===!0,hiddenEffective:typeof Mr=="function"?Mr:null,sanitize:typeof sr=="function"?sr:null,cleanText:r})}(function(){var e={};e.sanitizeGeminiText=wa,e.aiCmCollectExportSource=Ir,e.aiCmExportBaseSource=Sa,e.aiCmProjectFileMessages=en,e.aiCmGetSourceTier=zn,e.aiCmUnionFileMessages=ji,e.autoExportPerSiteKey=Np,e.loadAutoExportPerSitePct=Bp,e.sessionFiredCache=Ue,e.aiCmTryLateAutoExport=Ga,e.aiCmScheduleLateAutoExportRetry=Gp,e.aiCmLateRetryByConv=Aa,e.aiCmCurrentBaseSnapshot=Wi,e.detectTrimStateFallback=Hp,e.geminiDetectTrim=qp,e.maybeTrimExport=bl,e.aiCmCancelDeferredHistWrite=Zi,e.aiCmWriteCurrentHistory=xl,e.aiCmFlushDeferredHistWrite=wl,e.aiCmScheduleDeferredHistWrite=jp,e.loadAutoExportSettings=Sl,e.aiCmAutoExportConvId=Ye,e.aiCmGsaProbeByThread=Al,e.aiCmGsaProbeRunning=Ta,e.aiCmGsaProbeRunningFor=Ui,e.aiCmGsaAutoExportSkipLog=Wp,e.maybeAutoExport=En,e.aiCmEffectiveAutoExportThreshold=zp,e.doAutoExportDownload=Tn,e.aiCmDeepseekStreamProbe=Up,e.aiCmDeepseekStreamActiveFor=Tl,e.aiCmFlushLiveStreamForExport=El,e.aiCmDeferAutoExportOnLiveStream=$u,e.AI_CM_DS_STREAM_DEFER_MS=Ku,typeof le<"u"&&le.exports&&(le.exports=e),typeof window<"u"&&(window.AiCmExportManager=e)})();function Ko(e){var t={chatgpt:"ChatGPT",gemini:"Gemini",deepseek:"DeepSeek",google_search:"Google Search AI",claude:"Claude",perplexity:"Perplexity",qwen:"Qwen"};return t[e]||e||"AI Chat"}(function(){let e="unknown";try{e=chrome.runtime.getManifest().version}catch{e="unknown"}console.log("AI Context Monitor v"+e+" \u2014 \u0438\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 (ChatGPT, Gemini, DeepSeek, Claude, Perplexity, Google Search AI)")})();function $(){try{return!!chrome.runtime?.id}catch{return!1}}function qe(e,t,n){try{if(typeof chrome<"u"&&chrome.i18n&&typeof chrome.i18n.getMessage=="function"){var r=n?chrome.i18n.getMessage(e,n):chrome.i18n.getMessage(e);if(r)return r}}catch{}return t}var Zo="ai-cm-gemini-tape-",vu="ai-cm-gemini-index-",Sv=50,Av=720*60*60*1e3;function Ha(){try{if(typeof window<"u"&&window.GeminiBatchexecuteParser&&window.GeminiBatchexecuteParser.PARSER_VERSION)return window.GeminiBatchexecuteParser.PARSER_VERSION}catch{}return""}function ci(){try{var e=location.pathname.match(/\/u\/(\d+)\//);return e?e[1]:"0"}catch{return"0"}}function xi(e){return Zo+Ha()+"-u"+ci()+"-"+e}var wi={load:function(e){return!$()||!e?Promise.resolve(null):new Promise(function(t){var n=xi(e);chrome.storage.local.get([n],function(r){var i=r[n];if(!i){t(null);return}i.meta=i.meta||{},i.meta.ts=Date.now();var o={};o[n]=i,chrome.storage.local.set(o),t(i)})})},save:function(e,t,n){if(!$()||!e||!t||!t.length)return Promise.resolve();var r=this;return n=n||{},n.ts=Date.now(),n.version=Ha(),n.orderVersion=2,new Promise(function(i){r.load(e).then(function(o){var a=o&&o.turns||[],s=t,u=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(u&&typeof u.unionTurnsById=="function"){var l=u.unionTurnsById(a,t);l.length>t.length&&(s=l)}else a.length>t.length&&(s=a);p("log","[AI CM][tape-save] convId="+e+" action=written msgs="+s.length+(s.length>t.length?" (union \u0441 \u043F\u0440\u0435\u0436\u043D\u0438\u043C \u0442\u0435\u0439\u043F\u043E\u043C "+a.length+")":""));var c={turns:s,meta:n},f={};f[xi(e)]=c,chrome.storage.local.set(f,function(){wi._touchIndex(e).then(i)})})})},remove:function(e){return!$()||!e?Promise.resolve():new Promise(function(t){chrome.storage.local.remove([xi(e),vu+e],function(){t()})})},cleanup:function(){return $()?new Promise(function(e){chrome.storage.local.get(null,function(t){var n=Date.now(),r=[];for(var i in t)if(i.indexOf(Zo)===0){var o=i.slice(Zo.length),a=t[i],s=a&&a.meta&&a.meta.ts?a.meta.ts:0;r.push({convId:o,ts:s})}r.sort(function(c,f){return f.ts-c.ts});for(var u=[],l=0;l<r.length;l++)(n-r[l].ts>Av||l>=Sv)&&(u.push(Zo+r[l].convId),u.push(vu+r[l].convId));u.length>0?chrome.storage.local.remove(u,function(){e()}):e()})}):Promise.resolve()},_touchIndex:function(e){return new Promise(function(t){var n={};n[vu+e]={ts:Date.now()},chrome.storage.local.set(n,function(){t()})})}};function kl(){return Vi({type:"aiCm-get-byok-key"}).then(function(e){return!!(e&&e.hasKey)}).catch(function(){return!1})}function Ml(e){return e||(sn=!1),e?"1":""}var yn=T()||"",lr=0;window.addEventListener("ai-cm-conversation-changed",function(){try{var e=T()||"";try{typeof w=="function"&&w("o22-conv-changed",{ts:Date.now(),convId:e||"(none)",prev:yn||"(none)",changed:e!==yn?1:0,lastHistKey:typeof me<"u"?me:void 0,verdict:"reset-unconditional"})}catch{}try{typeof w=="function"&&g&&g.siteName==="qwen"&&w("qwen-spa",{ts:Date.now(),event:"conv-changed-recv",convId:e||"(none)",prev:yn||"(none)",changed:e!==yn?1:0,url:String(typeof location<"u"&&location&&location.href||"")})}catch{}if(e!==yn){p("log","[AI CM][spa] conv-changed old="+(yn||"(none)")+" new="+(e||"(none)")+" (content)");try{Zi("")}catch{}try{chrome.runtime.sendMessage({type:"BADGE_RESET"}).catch(function(){})}catch{}yn=e}}catch(t){v(t,"content:conversation-changed-outer")}cr("conv-changed","reset","conversation-id-change",{convId:String(T()||""),lastSeenConvId:String(yn||"")}),Ji(),an=0,Il={},typeof Lt=="function"&&typeof il=="function"&&Lt()&&il();try{typeof w=="function"&&g&&g.siteName==="qwen"&&(lr=Date.now(),w("qwen-spa",{ts:lr,event:"reset-done",reason:"conversation-id-change",convId:String(T()||"")||"(none)",url:String(typeof location<"u"&&location&&location.href||""),baseSeen:I===!0?1:0,baseCount:typeof R=="number"?R:0}))}catch{}try{typeof w=="function"&&g&&g.siteName==="qwen"&&w("qwen-spa",{ts:Date.now(),event:"reshoot",convId:String(T()||"")||"(none)",initialized:U===!0?1:0,url:String(typeof location<"u"&&location&&location.href||"")})}catch{}Ov(),typeof ka=="function"&&ka()});function Bg(){try{if(!g)return!1;var e=g.siteName;if(!b0(e,String(typeof location<"u"&&location&&location.pathname||""),T))return!1;Ji();try{chrome.runtime.sendMessage({type:"BADGE_RESET"}).catch(function(){})}catch{}return p("log","[AI CM][spa] O-34: URL \u0431\u0435\u0437 /c/<id> \u2014 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u0438 \u0431\u0435\u0439\u0434\u0436 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B"),!0}catch{return!1}}window.addEventListener("ai-cm-loader-freeze",function(e){try{Bn=!!(e.detail&&e.detail.on);var t=Qi(He(typeof Z=="function"?Z():""));if(!Bn&&t){let n=t;Na(n.percentage,n.tokenEstimate,n.effectiveLimit,n.contextLimit,n.displayLimit,n.modelName,n.attachBreak),p("log","[content-trace] badge-unfreeze: \u0432\u0438\u0434\u0436\u0435\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D pct="+n.percentage)}}catch(n){v(n,"content:loader-freeze")}});window.addEventListener("ai-cm-dom-emit-request",function(){try{if(!g||document.hidden||document.visibilityState!=="visible"||!I||!P||Bn)return;var e=qi();if(!(E||xn)){p("log","[AI CM][realtime] dom-emit skip: \u0445\u0432\u043E\u0441\u0442 \u0431\u0435\u0437 \u0433\u0440\u0430\u043D\u0438\u0446\u044B (unbounded) \u0438 \u0431\u0430\u0437\u0430 \u043D\u0435\u043F\u043E\u043B\u043D\u0430\u044F");return}var t=Vp()+"|"+(e?e.length:0);if(t===Fn)return;Fn=t,oe(),p("log","[AI CM][realtime] dom-emit pct="+je+" tokens="+Ae)}catch(n){v(n,"content:dom-emit-request")}});function Je(){try{var e=document.querySelector("[data-session-thread-id]");if(!e)return"";var t=e.getAttribute("data-session-thread-id");return t?String(t).trim():""}catch{return""}}function Gg(e,t){return!e||!t?!0:String(e)===String(t)}function Qu(){try{if(typeof Je=="function"&&Je()||document.querySelector('[data-scope-id="turn"]')||document.querySelector('[data-subtree="aimfl"]'))return!0}catch(e){v(e,"content:aiCmGsaChatPageMarker")}return!1}var Hg={};function cr(e,t,n,r){try{var i=typeof Br=="function"?Br():"unknown";if(t==="no-reset"){var o=String(e)+"|"+String(n)+"|"+String(i);if(Hg[o]===1)return!1;Hg[o]=1}var a={point:e,verdict:t,reason:n,doc:i,site:typeof g<"u"&&g&&g.siteName||"",baseSeen:typeof I<"u"&&I===!0?1:0,baseComplete:typeof E<"u"&&E===!0?1:0,baseCount:typeof R=="number"?R:0,threadId:typeof Je=="function"?Je():""};if(r)for(var s in r)Object.prototype.hasOwnProperty.call(r,s)&&(a[s]=r[s]);return typeof w=="function"&&w("gsa-state",a),!0}catch{return!1}}function Tv(){try{if(!g||g.siteName!=="google_search")return!1;if(typeof document>"u"||document.readyState!=="complete")return cr("reset-stale","no-reset","doc-not-complete"),!1;if(Qu())return cr("reset-stale","no-reset","chat-page"),!1;var e=I===!0||E===!0||R>0;return e?(Ji(),cr("reset-stale","reset","chatless-doc (captcha/search)"),p("log","[AI CM][auto-export] site=google_search O-27: \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0431\u0435\u0437 \u0447\u0430\u0442\u0430 \u2014 \u0431\u0430\u0437\u0430/pct \u043F\u0440\u043E\u0448\u043B\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B"),!0):(cr("reset-stale","no-reset","no-stale-state"),!1)}catch{return!1}}function Ev(e,t){var n=typeof e=="string"?e:"",r=typeof t=="number"&&t>0?t:0,i=typeof st<"u"?st:null,o=0,a=!1;if(i&&typeof i.countTokens=="function")try{o=i.countTokens(n)+r,a=!0}catch(c){v(c,"content:aiCmEstimateTokensTilde")}if(!a){var s=(n.match(/[\u0400-\u04FF]/g)||[]).length;o=Math.ceil(s/3.58)+Math.round((n.length-s)/4)+r}if(typeof Ne=="function"&&Ne())try{var u=(n.match(/[\u0400-\u04FF]/g)||[]).length,l=n.length?(u/n.length*100).toFixed(1):"0.0";w("o23-cyrillic-share",{textLen:n.length,cyrillicPct:l,attachTokens:r,tokensTilde:o})}catch{}return o}function Kp(e,t,n){var r=typeof t=="number"&&t>0?t:0,i=typeof n=="number"&&n>0?n:0;if(typeof st<"u"&&st&&typeof st.estimateDialogTokens=="function")try{return st.estimateDialogTokens(e,i)+r}catch(o){v(o,"content:canonical-tokens")}return Ev(e,r)+i*4}function kv(e,t,n){var r=typeof t=="number"&&t>0?t:0;if(r<=0)return 0;var i=typeof e=="string"?e:"",o=i.indexOf("[FILE: ")!==-1||i.indexOf("[IMAGE: ")!==-1;if(!o)return r;var a=n&&typeof n=="object"?n:{},s=typeof a.imgCount=="number"&&a.imgCount>0?a.imgCount:0,u=typeof a.docCount=="number"&&a.docCount>0?a.docCount:0,l=s+u;if(l<=0)return 0;var c=(i.match(/(?:^|\n\n)\[FILE: (?!.* — )(?!.* \([\d.,]+ ?(?:B|KB|MB|GB|Б)\)\])[^\]\n]*\]/g)||[]).length,f=Math.min(c,u);return f>=l?0:Math.round(r*(l-f)/l)}function Mv(e,t,n,r){var i=typeof e=="string"?e:"",o=typeof t=="number"&&t>0?t:0,a=typeof dt=="function"?dt():typeof g<"u"&&g?g.siteName:null,s=qv(a,i),u=s>0?s:Kp(i,0,o);typeof E<"u"&&E===!0&&s===0&&typeof yt=="number"&&yt>0&&i.length>0&&yt>i.length&&(u=Math.round(u*(yt/i.length)));var l=kv(i,n,r);l>0&&(u+=l),a==="aistudio"&&typeof Pr=="function"&&Pr()>0&&l>0&&(u-=l);var c=typeof Ma=="function"?Ma():typeof nt=="string"&&nt?nt:"",f=typeof An=="function"?An(c):0,d=f>0?Math.round(u/f*1e3)/10:0;return{tokens:u,percent:d,limit:f,serverTokens:s}}window.addEventListener("ai-cm-model-slug",function(e){var t=e&&e.detail;if(t&&typeof t.slug=="string"&&t.slug){Bt=t.slug;try{Lt()&&(Xi=t.slug,window.__aiCmNetModelSlug=t.slug)}catch(n){v(n,"content:aistudio-model-slug")}}});var Iv=500,$o=null,Cu=-1,bu="";function Lr(e){try{if(!_e||_e.enabled!==!0||typeof e!="number"||!isFinite(e)||e<0)return;Cu=e,bu=typeof Ye=="function"&&Ye()||"",$o!==null&&clearTimeout($o),$o=setTimeout(function(){$o=null;var t=Cu,n=bu;if(Cu=-1,bu="",!(typeof t!="number"||t<0)&&!(n&&typeof Ye=="function"&&(Ye()||"")!==n))try{En(t)}catch(r){v(r,"content:autoexport-debounce")}},Iv)}catch(t){v(t,"content:autoexport-schedule")}}window.addEventListener("ai-cm-qwen-history-pending",function(e){try{var t=e&&e.detail;if(!t)return;var n=String(t.site||"qwen");String(t.phase||"")==="end"?typeof Ri=="function"&&Ri(n):typeof Lu=="function"&&Lu(n)}catch(r){v(r,"content:qwen-history-pending")}});window.addEventListener("ai-cm-full-history",function(e){try{typeof w=="function"&&w("o22-listener-entry",{ts:Date.now()})}catch{}try{if(!window.__aiCmEmitChannelSeen){window.__aiCmEmitChannelSeen=!0;var t=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;p("log","[AI CM][svc-emit-trace] site="+(g&&g.siteName||"?")+" emit-channel=received convId="+(t&&t.extractConvIdFromUrl(location.pathname)||""))}}catch{}try{typeof w=="function"&&w("o22-svc-emit",{ts:Date.now(),convId:e&&e.detail&&e.detail.convId||typeof T=="function"&&T()||""||"(none)",histKey:(typeof R=="number"?R:0)+"|"+(typeof P=="string"&&P?P.length:0),msgs:e&&e.detail&&e.detail.count||0,textLen:e&&e.detail&&typeof e.detail.text=="string"?e.detail.text.length:0,lastHistKey:typeof me<"u"?me:void 0,src:typeof pe=="function"?pe(1):""})}catch{}let n=e&&e.detail;if(!n||!n.text)return;try{var r=document.querySelectorAll(".qwen-chat-message");if(r&&r.length){for(var i=0,o=0,a=typeof w=="function",s=[],u='.qwen-mcp-tool-call-panel, [class*="mcp-tool-call-panel"]',l=0;l<r.length;l++){var c=r[l],f=(c.textContent||"").length,d=typeof c.innerText=="string"?c.innerText.length:0;if(i+=d,o+=f,a){for(var h=c.querySelectorAll(u),m=0,y=0;y<h.length;y++)m+=(h[y].textContent||"").length;s.push([l,f,d,h.length,m])}}if(typeof w=="function"){for(var C=document.querySelectorAll(u),S=0,b=0;b<C.length;b++)S+=(C[b].textContent||"").length;for(var x=[],M=0;M<C.length;M++){for(var k=!0,A=0;A<C.length;A++)if(A!==M&&C[A].contains(C[M])){k=!1;break}k&&x.push(C[M])}for(var G=0,H=0;H<x.length;H++)G+=(x[H].textContent||"").length;w("qwen-dom-diag",{ts:Date.now(),msgs:r.length,innerLen:i,textAllLen:o,panels:C.length,panelLen:S,withPanels:i+S,panelTop:x.length,panelTopLen:G,rows:s})}}}catch(ge){v(ge,"content:qwen-dom-diag")}if(typeof Gg=="function"){var N=typeof Je=="function"?Je():"";if(!Gg(n.threadId,N)){p("log","[content] O-31: \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D (emit="+n.threadId+", dom="+N+", msgs="+(n.count||0)+")");return}}var D=Kp(n.text,n.attachTokens,n.count||0);p("log","[AI CM][trace] badge-recv convId="+(n.convId||"-")+" msgs="+(n.count||0)+" tokens~"+D);try{typeof w=="function"&&w("o22-badge-recv",{ts:Date.now(),convId:n.convId||"(none)",msgs:n.count||0,lastHistKey:typeof me<"u"?me:void 0})}catch{}var L=n.convId||"";if(L&&T()&&L!==T()&&!(n.count>0)){p("log","[content] v38: \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u041F\u0423\u0421\u0422\u041E\u0419 \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (emit="+L+", current="+T()+")");return}if(we=L,Cr=!1,L&&L!==oa){Ae=0,Ee="";var z=typeof Z=="function"?Z()||"":L;typeof B<"u"&&B&&B.convId&&z&&B.convId!==z&&(B=null,je=-1),oa=L,p("log","[content-trace] v37: \u043D\u043E\u0432\u044B\u0439 convId \u0441\u043D\u0438\u043C\u043A\u0430 \u2192 maxTokenCount=0 ("+L.slice(0,8)+")")}n.threadId&&(Ze!==null&&n.threadId!==Ze&&(cr("emit-thread-switch","reset","thread-id-change",{from:String(Ze),to:String(n.threadId)}),Ji()),Ze=n.threadId);let X=!!n.historyComplete;var ee=X&&!E;if(X&&!E){var J=g&&g.siteName==="qwen";J||(Ae=0,typeof B<"u"&&(B=null))}if(E=X,ll=typeof n.historyCompleteReason=="string"&&n.historyCompleteReason?n.historyCompleteReason:X?"complete":"incomplete",typeof Ri=="function"&&Ri(g&&g.siteName||""),X&&typeof Eg=="function"){var Re=g&&g.siteName||(location.hostname==="www.google.com"?"google_search":"");Eg(n.threadId||"",Re)}if(L){vt[L]=X&&n.reachedStart===!0?1:0;try{Sn[L]=n.isLowConfidenceBase===!0}catch{}}var V=n.chatId||L||typeof T=="function"&&T()||"";if(V)try{Ht[V]=n.partialSoft===!0}catch{}P=n.text,R=n.count||0,typeof n.count=="number"&&(br=n.count),Bt=n.modelSlug||"",Xe=n.attachTokens||0,Qe=n.attachBreak||null,xe=n.serverTokens||0,vn=n.qwenUsage&&typeof n.qwenUsage=="object"?n.qwenUsage:null,yt=typeof n.effectiveLen=="number"&&n.effectiveLen>0?n.effectiveLen:0,I=!0,Mt=!1;var ie=Array.isArray(n.messageTexts)?n.messageTexts:[],Y=Array.isArray(n.messageIds)?n.messageIds:[];lt=Y,Q=ie;try{(g&&g.siteName)==="google_search"&&typeof w=="function"&&w("gsa-base-accept",{point:"content-emit",verdict:ie.length>0?"accept":"accept-empty",msgs:ie.length,textLen:typeof n.text=="string"?n.text.length:0,historyComplete:n.historyComplete===!0?1:0,threadId:n.threadId||"",convId:L||"",head:typeof Gr=="function"?Gr(n.text,100):""})}catch{}if(ie.length>0){for(var j=Array.isArray(n.messages)&&n.messages.length===ie.length?n.messages:null,te=[],W=0;W<ie.length;W++){var ke=j?j[W]&&j[W].role||"":W%2===0?"user":"assistant";te.push({role:ke==="user"||ke==="human"?"user":"assistant",text:wa(ie[W]),id:j&&j[W]&&j[W].id!=null?String(j[W].id):String(Y[W]),...j&&j[W]&&Array.isArray(j[W].sources)?{sources:j[W].sources}:{},...j&&j[W]&&j[W].artifact&&typeof j[W].artifact=="object"?{artifact:j[W].artifact}:{},...j&&j[W]&&Array.isArray(j[W].artifacts)?{artifacts:j[W].artifacts}:{}})}var F=jn(te),ye=Array.isArray(F.messages)?F.messages:[];de=ye;for(var Le=[],Ot=[],xt=[],De=0;De<ye.length;De++){var ne=ye[De]||{},ot=ne.id!=null?String(ne.id):te[De]&&te[De].id!=null?String(te[De].id):"";Le.push(String(ne.text==null?"":ne.text)),Ot.push(ot),xt.push({role:ne.role,text:String(ne.text==null?"":ne.text),id:ot,...Array.isArray(ne.sources)?{sources:ne.sources}:{},...ne.artifact&&typeof ne.artifact=="object"?{artifact:ne.artifact}:{},...Array.isArray(ne.artifacts)?{artifacts:ne.artifacts}:{}})}Q=Le,lt=Ot,Ie=xt,R=Le.length,P=Le.join(`
`),typeof Dt=="function"&&(P=Dt(ye)),F.removed>0&&yt>P.length&&(yt=P.length),Ap(F.removed),Ee="net";try{if(g&&g.siteName==="qwen"&&typeof g.extractMessages=="function"&&typeof _<"u"&&typeof Xr=="function"&&typeof Zr=="function"){for(var wt=P.length,Oe=g.extractMessages(),dn=Xr(Oe),Ut=[],pt=[],zt=[],at=0;at<dn.length;at++){var Ce=dn[at];if(Ce){var gn=String(Ce.text==null?"":Ce.text);Ut.push(gn),zt.push("dom-"+at),pt.push({role:Ce.role==="user"?"user":"assistant",text:gn,id:"dom-"+at})}}var Kn=Ut.join(`
`),O=Zr(pt.length,Le.length,Kn.length,wt);O==="dom"&&(de=pt,Q=Ut,lt=zt,Ie=pt,R=pt.length,P=Kn,Ee="dom"),typeof w=="function"&&w("qwen-canonical",{ts:Date.now(),cid:L||"",pick:O,domCount:pt.length,netCount:Le.length,domLen:Kn.length,netLen:wt,src:Ee})}}catch(ge){v(ge,"content:qwen-canonical")}}else de=null,Ie=Array.isArray(n.messages)?n.messages:null,Ee="";tt=new Set;for(var pn=0;pn<lt.length;pn++){var Ke=String(lt[pn]).trim();Ke&&tt.add(Ke)}Ct=new Set,nn=[];for(var ce=Cl(Q.join(`
`)),$e=0;$e<Q.length;$e++){var Ve=rn(Q[$e],ce);Ve&&(Ct.add(Ve),Ve.length>=ki&&nn.push(Ve))}xr=null;var ae=[R,P?P.length:0,E?1:0,yt].join("|");ae!==ea&&(ea=ae,console.log("\u{1F4E5} \u0431\u0430\u0437\u0430 \u043F\u043E\u043B\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0438: "+R+" \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u043A\u044D\u0448 id="+tt.size+", \u0441\u043A\u0435\u043B\u0435\u0442\u043E\u0432="+Ct.size+", \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u044F\u043A\u043E\u0440\u0435\u0439="+nn.length+(Bt?", slug \u0438\u0437 \u0441\u0435\u0442\u0438="+Bt:"")+(Xe>0?", \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u2248"+Xe+" \u0442\u043E\u043A":"")+(xe>0?", serverTokens="+xe:"")+(E?", \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u041F\u041E\u041B\u041D\u0410\u042F \u043F\u043E \u0441\u0435\u0442\u0438 (\u0438\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u043F\u043E \u0431\u0430\u0437\u0435, DOM \u0438\u0433\u043D\u043E\u0440)":""))),ae!==ta&&(ta=ae,p("log","[content-trace] EMIT \u043F\u0440\u0438\u043D\u044F\u0442 seq="+(window.__aiCmTraceSeq||0)+" baseComplete="+E+" baseCount="+R+" textLen="+(P?P.length:0)+" t="+Date.now()));try{qp(n)}catch(ge){v(ge,"content:full-history-trim")}if(U||(et(),setTimeout(function(){U||et()},500),setTimeout(function(){U||et()},1500)),Si&&E){var Fe=n.convId||"",Kt=Array.isArray(n.messages)?n.messages:[];if(Fe&&Kt.length>0){for(var St=[],mt=0;mt<Kt.length;mt++){var $t=Kt[mt]||{};St.push({id:$t.id!=null?String($t.id):"",text:$t.text||"",role:$t.role==="user"?"user":"assistant",r1:$t.r1||null,turnId:$t.turnId||null})}p("log","[AI CM][tape-save] convId="+Fe+" action=written msgs="+St.length+" baseComplete=1"),wi.save(Fe,St,{count:n.count||0,effectiveLen:n.effectiveLen||0,modelSlug:n.modelSlug||"",version:Ha()})}else p("log","[AI CM][tape-save] action=skipped reason="+(Fe?"no-messages":"no-convId")+" baseComplete=1 msgs="+(Kt?Kt.length:0))}if(ee)try{var ht=L||we||T()||"";if(ht){try{tl(ht,"base-complete")}catch(ge){v(ge,"content:metrics-resync-flush")}try{wl(ht,"base-complete")}catch(ge){v(ge,"content:full-history-flush-deferred")}var $n=typeof je=="number"&&je>=0?je:ue;Gn[ht]?Ga(ht):_e.enabled===!0&&typeof $n=="number"&&$n>=0&&(p("log","[AI CM][auto-export] base-complete 0\u21921 check (\u043D\u0435 loader-stop) convId="+ht+" pct="+$n),En($n))}}catch(ge){v(ge,"content:full-history-complete-transition")}try{typeof w=="function"&&w("o22-call725",{ts:Date.now(),src:typeof pe=="function"?pe(2):""})}catch{}oe(),typeof Lr=="function"&&Lr(je)});var _v=["claude"],Ju=!1,Dn=null;function Rv(){try{return!!g&&_v.indexOf(g.siteName)!==-1}catch{return!1}}function Lv(){if(!Ju&&Rv()){if(window.__aiCmEmitChannelSeen){p("log","[AI CM][emit-channel] content-ready \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u2014 emit \u0443\u0436\u0435 \u0434\u043E\u0448\u0451\u043B site="+(g&&g.siteName||"?"));return}Ju=!0;try{window.dispatchEvent(new CustomEvent("ai-cm-content-ready"))}catch{}p("log","[AI CM][emit-channel] content-ready site="+(g&&g.siteName||"?"));try{var e=g&&g.siteName||"";Dn&&clearTimeout(Dn),Dn=setTimeout(function(){if(Dn=null,!window.__aiCmEmitChannelSeen){try{window.dispatchEvent(new CustomEvent("ai-cm-request-emit"))}catch{}p("log","[AI CM][emit-channel] request-emit (3\u0441 \u0431\u0435\u0437 badge-recv) site="+e)}},3e3)}catch{}}}function T(){try{var e=typeof _<"u"&&_?_:typeof window<"u"&&window.AiCmExportEmitPipeline?window.AiCmExportEmitPipeline:null;if(e&&typeof e.extractConvIdFromUrl=="function")return e.extractConvIdFromUrl(location.pathname)||"";var t=location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);if(t)return t[1];var n=location.pathname.split("/"),r=n.indexOf("chat");return r!==-1&&r+1<n.length?n[r+1]:""}catch{return""}}function $p(){let e=window.location.hostname;return e.includes("chatgpt.com")?g=new Tu:e.includes("aistudio.google.com")?g=new yr:e.includes("gemini.google.com")?g=new Yo:e.includes("chat.deepseek.com")?g=new Eu:e.includes("google.com")&&!e.includes("aistudio")?g=new ku:e.includes("claude.ai")?g=new Mu:e.includes("perplexity.ai")?g=new Iu:e.includes("chat.qwen.ai")&&(g=new vr),g}function Ki(e){try{return String(e&&e.name?e.name+": "+(e.message||""):e)}catch{return"(read-error)"}}function re(e,t){try{if(typeof w!="function"||typeof g>"u"||!g||g.siteName!=="qwen")return!1;var n={ts:Date.now(),event:e,initialized:typeof U<"u"&&U===!0?1:0};if(t)for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(n[r]=t[r]);return w("qwen-init",n)}catch{return!1}}function Ov(){try{if(!g||g.siteName!=="qwen"){try{re("reshoot-exit",{ret:0,branch:"not-qwen"})}catch{}return!1}if($p(),!g||g.siteName!=="qwen"){try{re("reshoot-exit",{ret:0,branch:"not-qwen-after-detect"})}catch{}return!1}try{re("reshoot-enter",{branch:U?"awake":"asleep",convId:typeof T=="function"&&T()||"(none)",url:String(typeof location<"u"&&location&&location.href||""),src:typeof pe=="function"?pe(1):""})}catch{}if(U){oe();try{re("reshoot-awake-send",{})}catch{}}else{et();try{re("reshoot-after-sync",{branch:U?"awake":"asleep"})}catch{}U||(setTimeout(function(){U||et();try{re("reshoot-retry",{delay:500})}catch{}},500),setTimeout(function(){U||et();try{re("reshoot-retry",{delay:1500})}catch{}},1500),setTimeout(function(){U||et();try{re("reshoot-retry",{delay:3e3})}catch{}},3e3),setTimeout(function(){typeof qg=="function"&&qg()},6e3))}try{re("reshoot-exit",{ret:1,branch:U?"awake":"asleep"})}catch{}return!0}catch(e){try{re("reshoot-throw",{error:Ki(e)})}catch{}return!1}}function qg(){if(U)return!1;var e=-1;try{g&&typeof g.extractMessages=="function"&&(e=g.extractMessages().length)}catch(t){e=-2;try{re("reshoot-terminal-throw",{error:Ki(t)})}catch{}}typeof an<"u"&&(an=e>0?e:0);try{re("reshoot-terminal",{adapterMsgs:e,ready:typeof Ia=="function"&&Ia()?1:0})}catch{}return oe(),!0}async function Pv(){try{if($p(),!g){try{re("initialize-exit",{ret:0,reason:"no-adapter"})}catch{}return}try{re("initialize-enter",{adapter:g.siteName,url:String(typeof location<"u"&&location&&location.href||"")})}catch{}if(p("log","\u0410\u0434\u0430\u043F\u0442\u0435\u0440:",g.siteName),typeof Bg=="function"&&Bg(),Lv(),Bp(),Qp(),typeof Kg=="function"&&await Kg(),typeof zu=="function"&&await zu(),Gv(),mp(),$()){let e=()=>{chrome.storage.sync.get([Hn()],n=>{let r=n[Hn()];gt=typeof r=="number"&&r>0?r:null,Wt(),U&&oe()})};typeof Fu=="function"&&Fu(n=>{if(typeof n!="number"){e();return}gt=n,Wt(),U&&oe()})||e()}$()?chrome.storage.sync.get(["showWidget"],e=>{e.showWidget!==!1&&va()}):va(),await et();try{re("initialize-after-tryinit",{})}catch{}if(!U){[2e3,4e3,6e3].forEach(e=>{setTimeout(async()=>{U||await et()},e)});try{re("initialize-ladder",{delays:"2000,4000,6000",scheduled:3})}catch{}typeof ka=="function"&&ka()}try{re("initialize-exit",{ret:1})}catch{}}catch(e){try{re("initialize-throw",{error:Ki(e),src:typeof pe=="function"?pe(1):""})}catch{}throw e}}async function et(){try{if(U){try{re("tryinit-skip",{reason:"already-initialized"})}catch{}return}let t=kr();try{re("tryinit-enter",{nodes:t.nodes.length,sel:t.sel,src:typeof pe=="function"?pe(1):""})}catch{}var e=-1;if(t.nodes.length===0&&g&&typeof g.extractMessages=="function")try{let n=g.extractMessages();e=n&&typeof n.length=="number"?n.length:0,n&&n.length>0&&(t={nodes:n,sel:(g.siteName||"adapter")+".extractMessages()"})}catch(n){e=-2;try{re("tryinit-adapter-throw",{error:Ki(n)})}catch{}}if(t.nodes.length>0){p("log","\u0414\u0438\u0430\u043B\u043E\u0433 \u043D\u0430\u0439\u0434\u0435\u043D:",t.nodes.length,"\u0443\u0437\u043B\u043E\u0432 ("+t.sel+")");try{re("tryinit-nodes",{nodes:t.nodes.length,sel:t.sel,action:"set-initialized"})}catch{}U=!0,oe(),Xu();try{re("tryinit-exit",{action:"initialized",nodes:t.nodes.length,sel:t.sel,observer:typeof bn<"u"&&bn?1:0})}catch{}}else try{re("tryinit-exit",{action:"not-found",nodes:0,adapterMsgs:e})}catch{}}catch(t){try{re("tryinit-throw",{error:Ki(t),src:typeof pe=="function"?pe(1):""})}catch{}throw t}}var jg="ai-context-widget";function Wg(e){try{if(!e)return!1;var t=e.nodeType===1?e:e.parentElement;if(!t||typeof t.closest!="function")return!1;if(t.closest("#"+jg))return!0;var n=document.getElementById(jg);return!!(n&&typeof n.contains=="function"&&(n===t||n.contains(t)))}catch{return!1}}function Vp(){try{for(var e=typeof kr=="function"?kr():null,t=e&&e.nodes?e.nodes:[],n=0,r=0;r<t.length;r++){var i=t[r],o=i.innerText||i.textContent||"";n+=String(o).trim().length}return n}catch{return 0}}function Dv(){var e="";if(I&&P)try{e=qi()||""}catch{e=""}return Vp()+"|"+e.length}function Zu(){try{if(typeof he!="object"||!he)return!1;var e=typeof T=="function"&&T()||"";if(!e)return!1;var t=typeof g<"u"&&g&&g.siteName||"";return he[t+"|"+e]===1}catch{return!1}}function Xu(){bn&&bn.disconnect();let e=0;bn=new MutationObserver(t=>{if(t.some(r=>{if(Wg(r.target))return!1;if(r.type==="childList"){for(let i of r.addedNodes)if(!Wg(i)&&i.nodeType===1&&(i.textContent?.trim()?.length??0)>10)return!0}return r.type==="characterData"})){let r=typeof T=="function"&&T()||"";ia!==r&&(ia=r,Fn=null);let i=Dv();if(i===Fn&&Zu()){typeof w=="function"&&w("o24-dom-emit-guard",{verdict:"skip-sig-unchanged",sig:i,convId:r||"(none)",ms:t.length,t:Date.now()});return}Fn=i,e++,gi!==null&&clearTimeout(gi);let o=Math.min(800+e*300,3e3);gi=setTimeout(()=>{if(e=0,!U){if(typeof et=="function")try{et()}catch(a){v(a,"content:observer-tryinit")}return}oe()},o)}}),bn.observe(document.body,{childList:!0,subtree:!0,characterData:!0,attributes:!1})}function ka(){if(!U&&!(typeof g>"u"||!g)&&typeof Xu=="function")try{if(typeof g.isOnDialogPage=="function"&&!g.isOnDialogPage())return;Xu()}catch(e){typeof v=="function"&&v(e,"content:ensure-init-observer")}}var Fv={},Ug="";function Ma(){let e=Bt||"",t=e?K.resolveModelId(e):null,n="",r=!1,i=!1;try{i=(window.location.hostname||"").indexOf("gemini.google.com")!==-1,i&&(n=wd({document,modelConfig:K,cache:Fv},t)||"",r=!!(n&&typeof Ln=="function"&&Ln(n)))}catch{n="",r=!1}let o=n?K.resolveModelId(n):null;n&&!o&&(n="");let a=e||n||r?"":g.detectModel()||"",s=(typeof up=="function"?up():"")||e||a||"",u=s?K.resolveModelId(s):null;u&&(We=K.getModel(u)?.name||u);let l=Yt||n||s||"",c=Yt?"\u043F\u043E\u043F\u0430\u043F":n?"dom":s?e?"\u0441\u0435\u0442\u044C":"DOM":"",f=l?K.resolveModelId(l):null;var d=g&&g.siteName||"",h=!!l&&!f;let m=f,y;m?y=c||"\u0434\u0435\u0444\u043E\u043B\u0442":r&&!e&&!Yt||i&&d==="gemini"&&!Yt&&!e&&!a&&!n?(m="gemini-auto",y="dom(auto)"):(m=K.getDefaultModel(g.siteName),y=l?(e?"\u0441\u0435\u0442\u044C":"DOM")+"\u2192\u0434\u0435\u0444\u043E\u043B\u0442(\u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D)":"\u0434\u0435\u0444\u043E\u043B\u0442",h&&(d==="google_search"||d==="qwen")&&(y=(c||"\u0441\u0435\u0442\u044C")+"\u2192siteDefaults(\u0432\u043D\u0435 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430)")),m==="gemini-auto"&&(We=K.getModel("gemini-auto")?.name||"Gemini (auto)"),g&&(d==="google_search"||d==="qwen"&&h)&&(We=d==="qwen"?String(l).trim().slice(0,64):K.getModel(m)?.name||m);let C=c==="\u043F\u043E\u043F\u0430\u043F"?"popup":c==="dom"?"dom":"snapshot";if(m!==nt){nt=m;let b=K.getContextLimit(m),x=K.getEffectiveLimit(m);console.log("[model-detect] \u043F\u0443\u0442\u044C="+y+(l?', raw="'+l+'"':"")+" \u2192 id="+m+", \u0438\u043C\u044F="+(K.getModel(m)?.name||m)+", \u043E\u043A\u043D\u043E="+b.toLocaleString()+", \u043F\u043E\u0440\u043E\u0433 \u043F\u043E\u0442\u0435\u0440\u0438 \u0434\u0435\u0442\u0430\u043B\u0435\u0439="+x.toLocaleString())}let S=C+"|"+m;return S!==Ug&&(Ug=S,p("log",C==="popup"?'[model-detect] H19 popup raw="'+wr+'" \u2192 id='+m+" \xB7 model-source=popup":C==="dom"?'[model-detect] v48 dom raw="'+n+'" \u2192 id='+m+" \xB7 model-source=dom":"[model-detect] v47 model-source=snapshot"+(s?', \u0441\u043D\u0438\u043C\u043E\u043A="'+s+'"':"")+" \u2192 id="+m)),m}function zg(e,t){if(t){for(var n=t.length,r=ba(t),i=r.length,o=t.split(`
`),a=0,s=0,u=0;u<o.length;u++){var l=ba(o[u]);l&&(Ct&&Ct.has(l)?a++:s++)}console.log("[text-probe] "+e+" totalLen="+n+" skelLen="+i+" \u043A\u0443\u0441\u043A\u043E\u0432\u0411\u0430\u0437\u0430="+a+" \u043A\u0443\u0441\u043A\u043E\u0432\u041D\u0435\u0411\u0430\u0437\u0430="+s)}}function Nv(e,t){if($()){if(zl()||!sn||!It){xe=0;return}if(!e){xe=0;return}if(console.log("[byok-src] baseComplete="+E+" baseSeen="+I+" fullIsBase="+(e===P)+" baseLen="+P.length+" fullLen="+e.length+" baseCount="+R),e===Gt){xe=ft;return}if(clearTimeout(_u??void 0),!mi){mi=!0;var n=K.getGeminiApiModelId(t);zg("pre-send",e),chrome.runtime.sendMessage({type:"COUNT_TOKENS",text:e,model:n},function(r){if(mi=!1,r&&typeof r.totalTokens=="number"){Gt=e,ft=r.totalTokens,jt=T()||"",un="";try{if(typeof w=="function"&&typeof st<"u"&&st&&typeof st.countTokens=="function"&&typeof st.countTokenizerFeatures=="function"){var i=st.countTokenizerFeatures(e),o=i.cyr,a=i.cjk,s=i.latin,u=i.digit,l=i.punct,c=i.other,f=(e.match(/\s/g)||[]).length,d=st.countTokens(e),h=r.totalTokens;w("o23-calibration",{model:n,convId:typeof T=="function"&&T()||"",chars:e.length,cyr:o,latin:s,digit:u,cjk:a,punct:l,other:c,space:f,img:typeof Qe<"u"&&Qe&&Qe.imgCount?Qe.imgCount:0,doc:typeof Qe<"u"&&Qe&&Qe.docCount?Qe.docCount:0,attach:typeof Xe<"u"&&Xe>0?Xe:0,estimate:d,exact:h,ratio:h>0?(d/h).toFixed(4):"(n/a)"})}}catch(C){v(C,"content:o23-calibration")}if(xe=r.totalTokens,console.log("[exact-tokens] countTokens \u0432\u0435\u0440\u043D\u0443\u043B "+r.totalTokens+" \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438 "+n),zg("post-ok:"+r.totalTokens,e),$()){var m=T();try{chrome.storage.local.set({"ai-cm-byok-cache":{convId:m,text:e,count:r.totalTokens,ts:Date.now()}}),console.log("[byok-cache] \u0442\u043E\u0447\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435: "+r.totalTokens)}catch(C){v(C,"content:requestExactTokens")}}oe()}else{var y=r&&r.error?r.error:"unknown";Hr("content:requestExactTokens","[exact-tokens] \u043E\u0448\u0438\u0431\u043A\u0430 countTokens: "+y+" \u2014 \u0444\u043E\u043B\u0431\u044D\u043A \u043D\u0430 \u044D\u0432\u0440\u0438\u0441\u0442\u0438\u043A\u0443"),jt="",un=e,e===Gt&&ft>0?xe=ft:xe=0}})}}}function Qp(){$()&&chrome.storage.local.get(["ai_cm_exact_token_count"],function(e){sn=!!e.ai_cm_exact_token_count,kl().then(function(t){It=Ml(t),console.log("[byok] \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B: exactCount="+sn+", key="+(It?"***":"(\u043F\u0443\u0441\u0442\u043E)"))})})}var fi=null;function Kg(){return fi||(fi=new Promise(function(e){try{if(!$()){e(!1);return}kl().then(function(t){It=Ml(t),console.log("[byok] \u043A\u043B\u044E\u0447 \u043F\u043E\u043B\u0443\u0447\u0435\u043D \u043E\u0442 SW: "+(t?"***":"(\u043F\u0443\u0441\u0442\u043E)")),e(t)})}catch{e(!1)}}),fi)}function Bv(){fi=null;try{if(!$())return;kl().then(function(e){It=Ml(e),Gt="",ft=0,jt="",un="",xe=0,console.log("[byok] \u043A\u043B\u044E\u0447 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u043C SW: "+(It?"***":"(\u043F\u0443\u0441\u0442\u043E)")),U&&oe()})}catch(e){v(e,"content:aiCmByokKeyInvalidate")}}function Gv(){if($()){var e=T();e&&chrome.storage.local.get(["ai-cm-byok-cache"],function(t){var n=t["ai-cm-byok-cache"];!n||n.convId!==e||!n.text||typeof n.count!="number"||n.count<=0||(Gt=n.text,ft=n.count,jt=e,console.log("[byok-cache] \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u0447\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0438\u0437 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430: "+n.count+" \u0442\u043E\u043A\u0435\u043D\u043E\u0432"))})}}var Jp="aiCmArchive:",Zp="aiCmConvSource:";function xu(e){try{return e&&_i[e]||0}catch{return 0}}var an=0,Il={};window.addEventListener("ai-cm-gemini-no-older-history",function(e){try{var t=e.detail,n=t&&t.convId?String(t.convId):"";if(!n)return;Il[n]=!0;try{typeof w=="function"&&w("gemini-dom-base",{event:"no-older-history",convId:n})}catch(r){typeof v=="function"&&v(r,"content:gemini-dom-base-diag")}if(U)oe();else try{et()}catch(r){v(r,"content:gemini-dom-base-tryinit")}}catch(r){v(r,"content:gemini-no-older-history")}});function Ia(){return!I&&(typeof an=="number"&&an>0||typeof R=="number"&&R>0||Array.isArray(Q)&&Q.length>0)}function di(){var e=T()||"",t=e?aa[e]:null;if(t&&t.kind==="archive"){var n=t.format||"?",r=String(t.count||0);return{kind:"archive",label:t.label||qe("content_source_archive","\u0430\u0440\u0445\u0438\u0432: "+n+" \xB7 "+r+" \u0441\u043E\u043E\u0431\u0449.",[n,r])}}return I?{kind:"live",label:qe("content_source_live","live (\u0441\u0435\u0442\u044C/DOM)")}:Ia()?{kind:"live",label:qe("content_source_live","live (\u0441\u0435\u0442\u044C/DOM)")}:null}function Xp(e,t){if(!(!e||!$()))try{var n=Jp+e,r=Zp+e;chrome.storage.local.get([n,r],function(i){try{if(!$())return;if(T()!==e){p("log","[AI CM][archive-restore] skip reason=stale convId="+e+" current="+(T()||"(none)"));return}var o=i[r]||null;o&&(aa[e]=o);var a=i[n]||null,s=!!(a&&Array.isArray(a.messages)&&a.messages.length);if(a){var u=typeof a.count=="number"&&a.count>0?a.count:s?a.messages.length:0;u>0&&(_i[e]=u)}if(p("log","[AI CM][archive-restore] convId="+e+" action="+(s?"used":"none")+" cachedMsgs="+(s?a.messages.length:0)+" count="+(a&&a.count||0)+" format="+(a&&a.format||"-")+" reason="+(t||"")),s&&!Sr[e]){Sr[e]=!0;try{window.dispatchEvent(new CustomEvent("ai-cm-archive-restore",{detail:JSON.stringify({convId:e,messages:a.messages,count:typeof a.count=="number"&&a.count>0?a.count:a.messages.length,textLen:typeof a.textLen=="number"?a.textLen:0,format:a.format||"",service:a.service||"",title:a.title||""})})),p("log","[AI CM][archive-restore] dispatched convId="+e+" msgs="+a.messages.length)}catch{}}Yp()}catch(l){v(l,"content:aiCmLoadArchiveTier")}})}catch(i){p("log","[AI CM][archive-restore] silent-catch load: "+(i instanceof Error&&i.message||String(i)))}}function Yp(){try{var e=di();if(Tt=e?e.label:"",!q)return;var t=q.querySelector(".ai-widget-panel");if(!t)return;var n=t.querySelector(".ai-cm-source"),r=Tt?qe("content_source_label","\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: "+Tt,[Tt]):"";if(n&&n.textContent===r&&n.style.display===(r?"block":"none"))return;if(!r){n&&(n.textContent="",n.style.display="none");return}n||(n=document.createElement("div"),n.className="ai-cm-source",t.appendChild(n)),n.textContent=r,n.style.display="block"}catch{}}var _l=1e4,Xo=0,_a=!1,wu=null;function em(e){try{if(typeof w!="function")return;w("badge-hold",{point:"badge-hold",reason:e,site:g&&g.siteName||"",convId:(typeof T=="function"?T():"")||"",baseSeen:typeof I<"u"&&I===!0?1:0,fallbackMs:_l})}catch{}}function Yu(e,t){try{if(_a)return!1;if(_a=!0,Xo=0,p("log","[content-trace] badge-hold (O-1): \u0449\u0438\u0442 \u043E\u0442\u043F\u0443\u0449\u0435\u043D ("+e+") t="+Date.now()),em(e),t){try{da()}catch(n){v(n,"content:aiCmBadgeHoldRelease")}oe()}return!0}catch{return!1}}function el(){try{if(_a||!g||g.siteName!=="chatgpt")return!1;if(I)return Yu("released-baseSeen",!1),!1;if(!Xo){var e=T()?"armed":"armed-empty-convid";Xo=Date.now()+_l,p("log","[content-trace] badge-hold (O-1): ChatGPT \u2014 \u0437\u0430\u043F\u0438\u0441\u0438 \u0431\u0430\u0437\u044B \u0435\u0449\u0451 \u043D\u0435\u0442, \u0432\u0438\u0434\u0436\u0435\u0442 \u0441\u043A\u0440\u044B\u0442 ("+e+") t="+Date.now()),em(e),Hv()}return Date.now()>=Xo?(Yu("released-fallback",!1),!1):!0}catch{return!1}}function Hv(){try{if(wu)return;wu=setTimeout(function(){wu=null,!(_a||I)&&Yu("released-fallback",!0)},_l)}catch{}}function qv(e,t){if(e==="qwen")return 0;if(e==="aistudio"&&typeof Pr=="function"){var n=Pr();if(n>0)return n}var r=typeof Ra=="function"?Ra(t):0;return r>0?r:typeof xe=="number"&&xe>0?xe:0}function Ra(e){if(!sn||!It||!e)return 0;var t=typeof ft=="number"&&ft>0?ft:0;if(t<=0)return 0;if(e===Gt)return t;var n=!1;try{var r=typeof T=="function"?T():"";n=!!(r&&typeof jt=="string"&&jt===r)}catch{n=!1}return n?t:0}function jv(e,t){if(!sn||!It||e!=="gemini"&&e!=="aistudio"&&e!=="google_search"||!t||typeof $=="function"&&!$())return!1;var n=typeof Ra=="function"?Ra(t):0;if(n>0)return!1;var r=typeof un=="string"?un:"";return!(r&&r===t)}function tl(e,t){try{if(I!==!0||typeof Wi!="function")return!1;var n=T()||"";if(!e||n&&e!==n)return!1;var r=Wi(e);if(!Array.isArray(r)||r.length===0)return!1;var i=typeof R=="number"?R:0,o=typeof br=="number"&&typeof dr=="number",a=o?br:0,s=o?dr:0,u=!o||a===s;if(r.length<i)return p("log","[AI CM][export] metrics-resync skip reason=shrink convId="+e+" final="+r.length+" current="+i),!1;for(var l=[],c=0;c<r.length;c++){var f=r[c];l.push(String(f&&f.text||""))}var d=l.join(`
`);typeof Dt=="function"&&(d=Dt(r));var h=r.length+"|"+d.length,m=r.length===i,y=typeof P=="string"?P.length:0,C=d.length,S=y>0&&C<y,b=m&&h===me&&u;try{typeof w=="function"&&w("o22-metrics-resync",{ts:Date.now(),convId:e,reason:t||"(none)",finalMsgs:r.length,prevMsgs:i,prevLen:y,newLen:C,histKey:h,lastKey:typeof me<"u"?me:void 0,rawMsgs:a,prevRawMsgs:s,verdict:S?"shrink-length":b?"skip":u?"resync":"resync-raw"})}catch(D){v(D,"content:metrics-resync-diag")}if(S)return p("log","[AI CM][export] metrics-resync skip reason=shrink-length convId="+e+" prevLen="+y+" newLen="+C),!1;if(b)return p("log","[AI CM][export] metrics-resync skip reason=same convId="+e+" histKey="+h),!1;R=r.length,Q=l,P=d;for(var x=[],M=[],k=0;k<r.length;k++){var A=r[k]||{},G=l[k],H=A.id!=null?String(A.id):"";M.push(H),x.push({role:A.role==="user"?"user":"assistant",text:G,id:H,...Array.isArray(A.sources)?{sources:A.sources}:{},...A.artifact&&typeof A.artifact=="object"?{artifact:A.artifact}:{},...Array.isArray(A.artifacts)?{artifacts:A.artifacts}:{}})}de=x,Ie=x,lt=M,typeof Ee<"u"&&!Ee&&(Ee="net");var N=h===me;return me=u||!N?h:null,o&&(dr=a),p("log","[AI CM][export] metrics-resync reason="+(t||"(none)")+" convId="+e+" msgs="+i+"->"+r.length+" histKey="+h+(o?" raw="+s+"->"+a:"")),oe(),!0}catch(D){return v(D,"content:metrics-resync"),!1}}function $g(){try{if(typeof g>"u"||!g||g.siteName!=="gemini")return!1;var e=typeof T=="function"&&T()||"";if(!e||!Il[e]||typeof g.extractMessages!="function")return!1;var t=I;if(t&&(typeof Ee>"u"||Ee!=="dom"))return!1;var n=g.extractMessages()||[];if(!n.length||n.length>(t?120:20))return!1;for(var r=[],i=[],o=[],a=0;a<n.length;a++){var s=n[a]||{},u=String(s.content!=null?s.content:s.text!=null?s.text:"").trim();if(u){var l="dom-"+a;r.push({role:s.role==="user"||s.role==="human"?"user":"assistant",text:u,id:l}),i.push(u),o.push(l)}}if(!r.length)return!1;var c=typeof Dt=="function"?Dt(r):i.join(`
`);return t&&r.length<R||t&&r.length===R&&c.length<=P.length?!1:(de=r,Q=i,lt=o,Ie=r,R=r.length,P=c,I=!0,E=!0,typeof Ee<"u"&&(Ee="dom"),vt[e]=1,an=r.length,typeof Gi=="function"&&Gi(),p("log","[AI CM][gemini] dom-base "+(t?"refresh":"trusted")+" convId="+e+" msgs="+r.length+" textLen="+P.length),!0)}catch(f){return v(f,"content:gemini-dom-base-build"),!1}}function oe(){if(g){typeof $g=="function"&&$g();try{Tv()}catch(O){v(O,"content:processAndSend-gsa-stale-reset")}var e=null;try{var t=g.siteName||"";if(t&&t!=="gemini"){var n=I&&Q.length>0?"network":I?"none":"adapter",r=Q.length;e=typeof g.extractMessages=="function"?g.extractMessages():[];var i=e.length,o=t==="claude"||t==="perplexity"?"stub":"dom";p("log","[AI CM][svc-emit-trace] site="+t+" convId="+(T()||"")+" msgs="+i+" domMsgs="+i+" netMsgs="+r+" histWritePath="+n+" adapter="+o)}}catch{}if(e&&e.length>0)try{Jv(e)}catch(O){v(O,"content:processAndSend-aistudio-dom-cache")}try{var a=T()||"";a&&!Ii[a]&&(Ii[a]=!0,Xp(a,"page-load"))}catch(O){v(O,"content:processAndSend-archive-init")}if(!Pn){Pn=!0;var s=dt();if(s==="gemini"){var u="";try{var l=location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);u=l?l[1]:""}catch{}u&&(p("log","[AI CM][tape-restore] key="+xi(u)),On[u]=ci(),Ti[u]?p("log","[AI CM][tape-restore] skip reason=already-restored convId="+u+" (per-page session, v77)"):(wi.load(u).then(function(O){Si=!0;var pn=!!(O&&O.turns&&O.turns.length);if(!pn&&I&&E===!0&&Array.isArray(Ie)&&Ie.length>0&&T()===u){for(var Ke=[],ce=0;ce<Ie.length;ce++){var $e=Ie[ce]||{};Ke.push({id:$e.id!=null?String($e.id):"",text:$e.text||"",role:$e.role==="user"?"user":"assistant",r1:$e.r1||null,turnId:$e.turnId||null})}Ke.length>0&&(p("log","[AI CM][tape-save] convId="+u+" action=late-save msgs="+Ke.length+" baseComplete=1 (\u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u043F\u0440\u0438\u0448\u0451\u043B \u0434\u043E/\u0432\u043C\u0435\u0441\u0442\u043E \u0437\u0430\u043F\u0438\u0441\u0438 \u043B\u0435\u043D\u0442\u044B \u2014 \u0434\u043E\u0433\u043E\u0432\u0430\u0440\u0438\u0432\u0430\u044E)"),wi.save(u,Ke,{count:R||0,effectiveLen:yt||0,modelSlug:Bt||"",version:Ha()}))}var Ve=!!(O&&O.turns&&O.turns.length),ae=Ve&&O.turns[0]||null,Fe=Ve&&O.turns[O.turns.length-1]||null;if(p("log","[AI CM][tape-restore] convId="+u+" cacheConvId="+u+" action="+(Ve?"used":"empty")+" cachedMsgs="+(Ve?O.turns.length:0)+" firstMsgHash="+(ae?Zt(ae.id,ae.text):"-")+" lastMsgHash="+(Fe?Zt(Fe.id,Fe.text):"-")),!!Ve){if(Ti[u]=!0,T()!==u){p("log","[content] v35: restore \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u2014 \u043B\u0435\u043D\u0442\u0430 \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (saved="+u+", current="+T()+")"),p("log","[AI CM][tape-restore] convId="+T()+" cacheConvId="+u+" action=stale cachedMsgs="+O.turns.length+" firstMsgHash="+Zt(O.turns[0]&&O.turns[0].id,O.turns[0]&&O.turns[0].text)+" lastMsgHash="+Zt(O.turns[O.turns.length-1]&&O.turns[O.turns.length-1].id,O.turns[O.turns.length-1]&&O.turns[O.turns.length-1].text));return}if(Cr=!1,p("log","[content-trace] badge: \u0441\u043D\u044F\u0442\u0430 \u0441\u0443\u043F\u0440\u0435\u0441\u0441\u0438\u044F \u2014 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u043B\u0435\u043D\u0442\u0430 \u043A\u044D\u0448\u0430 convId="+u),Ei[u])p("log","[AI CM][tape-restore] skip reason=already-dispatched convId="+u+" cachedMsgs="+O.turns.length);else{Ei[u]=!0;try{window.dispatchEvent(new CustomEvent("ai-cm-restored-history",{detail:JSON.stringify({convId:u,turns:O.turns,meta:O.meta||{}})}))}catch{}}try{var Kt=T()||"";Kt&&_e.enabled===!0&&typeof ue=="number"&&ue>=0&&(p("log","[AI CM][auto-export] tape-restore applied \u2192 check convId="+Kt+" pct="+ue),En(ue))}catch(St){v(St,"content:processAndSend-tape-restore")}Ai[u]||(Ai[u]=!0,setTimeout(function(){if(T()===u)try{window.dispatchEvent(new CustomEvent("ai-cm-cache-refresh",{detail:JSON.stringify({convId:u})}))}catch{}},2e3))}}),wi.cleanup()))}}try{var c=dt();if(c==="gemini"){var f="";try{var d=location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);f=d?d[1]:""}catch{}f&&Pn&&On[f]!==void 0&&String(On[f])!==String(ci())&&(p("log","[AI CM][tape-restore] retry reason=account-index-stabilized u"+On[f]+"\u2192u"+ci()+" convId="+f+" key="+xi(f)),On[f]=ci(),Pn=!1)}}catch{}var h=[E?1:0,I?1:0,U?1:0,R,P?P.length:0].join("|");if(!U&&!(I&&E)&&!Ia()){h!==ar&&(ar=h,p("log","[content-trace] DRAW-\u041F\u0420\u041E\u041F\u0423\u0421\u041A (guard) seq="+(window.__aiCmTraceSeq||0)+" baseComplete="+E+" baseSeen="+I+" isInitialized="+U+" t="+Date.now()));try{re("draw-guard",{verdict:"skip",reason:"not-initialized",baseSeen:I===!0?1:0,baseComplete:E===!0?1:0,baseCount:typeof R=="number"?R:0,adapterMsgs:typeof an=="number"?an:-1,src:typeof pe=="function"?pe(1):""})}catch{}return}h!==ar&&(ar=h,p("log","[content-trace] DRAW seq="+(window.__aiCmTraceSeq||0)+" baseComplete="+E+" baseSeen="+I+" isInitialized="+U+" effectiveLen="+(function(){var O=qi();return O?O.length:0})()+" t="+Date.now()));try{re("draw-guard",{verdict:"pass",baseSeen:I===!0?1:0,baseComplete:E===!0?1:0,baseCount:typeof R=="number"?R:0,src:typeof pe=="function"?pe(1):""})}catch{}try{let O=dt(),pn=O==="gemini",Ke;I?Ke=R:(Ke=pn?0:g.extractMessages().length,an=Ke);let ce=Ma(),$e=S0(),Ve=qi(),ae,Fe;Ve?(ae=Ve,Fe=Fp(Ke)):pn?(ae="",Fe=0):(ae=g.getFullDialogText(),Fe=Ke),(O==="gemini"||O==="aistudio"||O==="google_search")&&sn&&It&&ae&&Nv(ae,ce);let St=xa(),mt=St&&typeof Rr=="function"?Rr(T()||""):St?kn(T()||"",St):null,$t=Mv(ae,Fe,Xe,Qe),ht=$t.serverTokens,$n=jv(O,ae),ge=$t.tokens;var m=typeof Ee<"u"&&Ee?Ee:E?"net":"dom",y=K.getModel(ce),C=io({site:O,modelId:ce,plan:O==="gemini"?Fl:null,modelWindow:y?K.getContextLimit(ce):0,windowSource:"catalog",displayLimit:K.getEffectiveLimit(ce),displaySource:"fallback",fallbackLimit:128e3});let Wa=C.windowKnown?C.modelWindow:0,Ua=C.displayLimit,Vn=K.applyLimitPct(Ua,qn());try{var S=E?"base-complete":xn?"base-floor+dom-tail":"base-floor",b=[S,m,R,ae?ae.length:0,ge,I?1:0].join("|");typeof w=="function"&&b!==ra&&(ra=b,w("gsa-metric-src",{site:O,src:S,valueSrc:m,baseSrc:typeof Ee<"u"?Ee:"",note:!E&&R>0?"incomplete-canonical-floor":"",msgs:R,countForTokens:Fe,textLen:ae?ae.length:0,baseComplete:E?1:0,baseSeen:I?1:0,lastBounded:xn?1:0,tokens:ge,baseTextLen:P?P.length:0,threadId:Ze||""}))}catch{}Ae=ge,ht>0&&(m="server"),typeof I<"u"&&I===!0&&typeof R=="number"&&R>0&&typeof e<"u"&&e&&e.length>0&&R>e.length&&(xn=!1);let sm=Vn>0?Math.round(Ae/Vn*1e3)/10:0,Pt=$e?100:sm,um=Pt!==je;je=Pt;var x=typeof ln=="function"?ln(g&&g.siteName||""):!1,M=!ae&&!(Xe>0)&&!(Fe>0);if(M&&typeof B<"u"&&(B=null),!x&&!M){var k=!!(mt&&mt.text===Ve),A=typeof Z=="function"?Z()||"":typeof Ye=="function"&&Ye()||""||typeof T=="function"&&T()||"",G=g&&g.siteName||"",H=La()===!0||typeof _r=="function"&&_r(G,A)===!0,N=$y(E===!0,H)||typeof Vo=="function"&&Vo(),D={convId:A,capturedAt:Date.now(),site:G,model:ce,modelName:(G==="google_search"||G==="qwen")&&typeof We=="string"&&We?We:K.getModel(ce)?.name||ce,src:m,tokens:Ae,percent:Pt,saturated:$e?!0:void 0,limit:Vn,effectiveLimit:Ua,contextLimit:Wa,windowLimit:Wa,accountLimit:C.accountLimit,limitPlan:C.plan,limitWarnings:C.warnings,attachBreak:Qe||null,partial:N};(k||G==="aistudio"&&I===!0&&E===!0&&ae)&&(D.chars=k?mt.chars:String(ae).length,D.msgs=k?mt.msgs:Fe||R||0,D.bodyHash=k?mt.bodyHash:typeof Zt=="function"?"ai"+Zt("aistudio",String(ae)):"len"+String(String(ae).length),D.baseComplete=E===!0),N&&(D.partialReason=x0(ll,typeof Vo=="function"&&Vo()));var L=typeof B<"u"?B:null;if(B=Vy(B,D),typeof fu=="function"){var z=fu(D,C0(D,ce,O==="aistudio"&&typeof Pr=="function"?Pr():0,ht));z&&B&&B.tokens===z.snapshot.tokens&&(B.quality=z.snapshot.quality,B.readiness=z.snapshot.readiness)}L&&L.convId===D.convId&&B===D&&L.percent-D.percent>10&&p("log","[content-trace] badge-shrink-anomaly: pct "+L.percent+"\u2192"+D.percent+" tokens "+L.tokens+"\u2192"+D.tokens+" bodyHash "+(L.bodyHash||"-")+"\u2192"+(D.bodyHash||"-"));var X=k?[A,m,Ae,mt.chars,mt.msgs,Xe,mt.bodyHash,E===!0?1:0].join("|"):"skip|no-canonical-body";X!==ng&&(ng=X,p("log",k?"[ctx-snap] "+X:"[ctx-snap] skip reason=no-canonical-body"))}var ee=He(typeof Z=="function"?Z():""),J=Qi(ee);be=J;var Re=Cr&&!I&&!kt;Re?p("log","[content-trace] badge-suppress: \u043F\u0440\u043E\u043F\u0443\u0441\u043A updateWidget \u0434\u043E \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0441\u043D\u0438\u043C\u043A\u0430 \u043D\u043E\u0432\u043E\u0433\u043E convId"):Bn?p("log","[content-trace] badge-freeze: \u0441\u043A\u0440\u044B\u0442\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043B\u043E\u0430\u0434\u0435\u0440\u0430 \u2014 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u043E, \u0432\u0438\u0434\u0436\u0435\u0442 \u0434\u0435\u0440\u0436\u0438\u0442\u0441\u044F"):el()||($n?p("log","[content-trace] byok-hold: \u0442\u043E\u0447\u043D\u043E\u0433\u043E \u0447\u0438\u0441\u043B\u0430 \u0434\u043B\u044F \u0442\u0435\u043A\u0441\u0442\u0430 \u0435\u0449\u0451 \u043D\u0435\u0442 \u2014 \u0431\u0435\u0439\u0434\u0436 \u0434\u0435\u0440\u0436\u0438\u043C"):J&&Na(J.percentage,J.tokenEstimate,J.effectiveLimit,J.contextLimit,J.displayLimit,J.modelName,J.attachBreak));try{typeof w=="function"&&g&&g.siteName==="qwen"&&w("qwen-badge",{ts:Date.now(),event:"badge-update",reason:Re?"spa-suppress":Bn?"loader-freeze":"draw",pct:Pt,tokens:Ae,stale:Mt===!0?1:0,baseSeen:I===!0?1:0,baseComplete:E===!0?1:0,adapterBaseSeen:kt===!0?1:0,netBaseMsgs:Q.length,baseCount:R,netServerTokens:typeof xe=="number"?xe:0,metricServerTokens:typeof ht=="number"?ht:0,convId:typeof T=="function"&&T()||""||"(none)",url:String(typeof location<"u"&&location&&location.href||""),source:typeof Tt=="string"&&Tt?Tt:"-"})}catch{}if(Uv(Pt),um){let se=qn(),Fr=se!=null?"\u043F\u043E\u0440\u043E\u0433 "+se+"% \u043E\u0442 \u0410\u0432\u0442\u043E":"\u0410\u0432\u0442\u043E";p("log",`\u{1F4CA} ${K.getModel(ce)?.name||ce}: ${Ae} / ${Vn.toLocaleString()} (${Fr}) \xB7 \u043E\u043A\u043D\u043E ${Wa.toLocaleString()} \xB7 ${Pt}%`+($e?" \xB7 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D":"")+(Xe>0?` \xB7 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u2248${Xe}`:"")+(ht>0?" \xB7 serverTokens":"")+(E?" \xB7 \u043F\u043E \u0431\u0430\u0437\u0435":""))}if($())try{var V=cl(ee),ie="aiCmState:"+window.location.hostname;if(typeof V.percentage=="number"&&typeof V.tokenEstimate=="number"){var Y={host:window.location.hostname,site:g.siteName,model:V.modelName,tokens:V.tokenEstimate,limit:V.displayLimit,windowLimit:V.windowLimit,accountLimit:V.accountLimit,limitPlan:V.limitPlan,limitWarnings:V.limitWarnings,saturated:V.saturated===!0?!0:void 0,percent:V.percentage,updatedAt:Date.now(),stale:Mt,netBaseMsgs:Q.length,sourceKind:(function(){try{var se=di();return se?se.kind:""}catch{return""}})(),sourceLabel:(function(){try{var se=di();return se?se.label:""}catch{return""}})()},j={aiCmState:Y};j["aiCmState:"+window.location.hostname]=Y,chrome.storage.local.set(j)}else chrome.storage.local.remove(["aiCmState",ie])}catch(se){v(se,"content:processAndSend-state-write")}var te=we||"",W=T()||"";if($()&&I&&Q.length>0&&!(te&&W&&te!==W)){var ke=g&&g.siteName||"",F=R+"|"+(P?P.length:0)+(ke==="google_search"?"|o2":"");try{typeof w=="function"&&w("o22-histkey-dedup",{ts:Date.now(),convId:te||W||"(none)",histKey:F,lastKey:typeof me<"u"?me:void 0,verdict:F!==me?"write":"dedup-skip",baseCount:R,textLen:P?P.length:0,src:typeof pe=="function"?pe(1):""})}catch{}if(F!==me){me=F,p("log","[AI CM][trace] history-write source=network convId="+(te||"-")+" msgs="+R);try{typeof w=="function"&&g&&g.siteName==="qwen"&&w("qwen-adapter",{ts:Date.now(),source:"network",msgs:R,netBaseMsgs:Q.length,convId:te||"(none)",url:String(typeof location<"u"&&location&&location.href||""),histKey:F,sinceSpaResetMs:lr?Date.now()-lr:-1})}catch{}try{var ye=typeof He=="function"?He(typeof Z=="function"?Z():te||we||""):null,Le={host:window.location.hostname,convId:we||(typeof fr=="function"?fr():""),site:g.siteName,model:We||K.getModel(ce)?.name||ce,msgOrder:2,tokens:Ae,limit:Vn,percent:Pt,updatedAt:Date.now(),isLowConfidenceBase:Sn[te]===!0,sourceKind:(function(){try{var se=di();return se?se.kind:""}catch{return""}})(),sourceLabel:(function(){try{var se=di();return se?se.label:""}catch{return""}})(),partial:typeof Te=="function"?Te(ye).partial:ye&&ye.partial===!0?!0:void 0,partialReason:typeof Te=="function"?Te(ye).partialReason:ye&&ye.partial===!0?ye.partialReason||"incomplete":void 0,messages:_t()},Ot={aiCmHistory:Le};Ot["aiCmHistory:"+window.location.hostname]=Ca(Le);var xt=te||W||"",De=g&&g.siteName==="gemini";xt&&(it[xt]||E!==!0||De&&vt[xt]!==1)?jp(xt):(Zi(xt||""),chrome.storage.local.set(Ot))}catch(se){v(se,"content:processAndSend-history-write")}}}try{var ne=dt(),ot=ne==="gemini";if(!ot&&$()&&!I&&!(we&&W&&we!==W)){var wt=T()||"",Oe=_t(),dn="adapter|"+Oe.length;if(Oe.length>0&&dn!==me&&wt!==""){me=dn,kt=!0,typeof Lr=="function"&&Lr(Pt),p("log","[AI CM][trace] history-write source=adapter site="+(g.siteName||"")+" convId="+wt+" msgs="+Oe.length);try{if(typeof w=="function"&&g&&g.siteName==="qwen"){for(var Ut=0,pt=0,zt=0;zt<Oe.length;zt++)Oe[zt]&&Oe[zt].role==="user"?Ut++:pt++;w("qwen-adapter",{ts:Date.now(),source:"adapter",msgs:Oe.length,adapterMsgs:Oe.length,roles:Ut+"u/"+pt+"a",convId:wt||"(none)",url:String(typeof location<"u"&&location&&location.href||""),histKey:dn,sinceSpaResetMs:lr?Date.now()-lr:-1})}}catch{}var at={host:window.location.hostname,convId:wt||(typeof fr=="function"?fr():""),site:g.siteName,model:We||K.getModel(ce)?.name||ce,tokens:Ae,limit:Vn,percent:Pt,updatedAt:Date.now(),isLowConfidenceBase:!1,messages:Oe},Ce={aiCmHistory:at};Ce["aiCmHistory:"+window.location.hostname]=Ca(at);var gn=typeof He=="function"?He(typeof Z=="function"?Z():wt):null;if(gn&&gn.partial===!0){var Kn={partial:typeof Te=="function"?Te(gn).partial:!0,partialReason:typeof Te=="function"?Te(gn).partialReason:gn.partialReason||"incomplete"};Object.assign(at,Kn),Object.assign(Ce["aiCmHistory:"+window.location.hostname],Kn)}chrome.storage.local.set(Ce)}}}catch(se){v(se,"content:processAndSend-history-write-adapter")}$()&&chrome.runtime.sendMessage({type:"CONTEXT_UPDATE",data:{site:g.siteName,model:ce,modelName:K.getModel(ce)?.name||ce,tokenCount:Ae,contextLimit:Ua,percentage:Pt,messageCount:Ke,timestamp:Date.now()}}).catch(()=>{})}catch(O){p("error","\u041E\u0448\u0438\u0431\u043A\u0430:",O)}}}document.addEventListener("visibilitychange",function(){try{if(document.visibilityState!=="visible"||(p("log","[visibility] tab-focused"),!g))return;(I||be)&&oe()}catch(e){v(e,"content:visibilitychange-refresh")}});var nl=!0;function Wv(){try{if(!$()||!chrome.storage||!chrome.storage.local)return;chrome.storage.local.get(["aiCmProactive"],function(e){nl=!(e&&e.aiCmProactive===!1)});try{chrome.storage.onChanged.addListener(function(e,t){t==="local"&&e.aiCmProactive&&(nl=e.aiCmProactive.newValue!==!1)})}catch{}}catch(e){p("error","[AI CM][thresholds] load flag error:",e)}}function Uv(e){try{if(!$()||!nl||typeof e!="number"||!(e>=0))return;var t=we||T()||"",n=g&&g.siteName?g.siteName:"";chrome.runtime.sendMessage({type:"THRESHOLD_PCT",data:{convId:t,site:n,pct:e}}).catch(function(){})}catch(r){p("error","[AI CM][thresholds] send error:",r)}}Wv();Sl();bv();function Vg(){try{return!!(g&&g.siteName==="qwen"&&kt===!0)}catch{return!1}}function La(){try{if(g&&g.siteName==="qwen"&&kt===!0)return!0;if(g&&g.siteName==="aistudio"&&kt===!0){var e=typeof Or=="function"&&Or()||"";return!!e&&Cn[e]===!0}return!1}catch{return!1}}function Qg(e,t,n){try{if(typeof w!="function"||!La())return!1;var r=g&&g.siteName||"",i=0;try{var o=r==="aistudio"&&typeof Or=="function"&&Or()||"";i=o&&Cn[o]===!0?1:0}catch{i=0}return w("auto-export",{point:"maybeAutoExport",verdict:"fire",trigger:e,site:r||"qwen",convId:t,pct:n,baseSeen:typeof I<"u"&&I===!0?1:0,baseComplete:typeof E<"u"&&E===!0?1:0,adapterBaseSeen:typeof kt<"u"&&kt===!0?1:0,domBaseTrusted:1,netReady:i}),!0}catch{return!1}}$()&&chrome.runtime.onMessage.addListener((e,t,n)=>{if(e.type==="aiCmDiag")return zv(n),!0;if(e.type==="aiCm-byok-key-changed")return Bv(),!0;if(e.type==="aiCmExportCurrent"){var r=T()||"";try{El(r)}catch(c){v(c,"content:aiCmAutoExportTrustedBaseDiag-flush")}var i=typeof je=="number"&&je>=0?je:0;try{vl("snapshot-at-manual",r,_t())}catch{}var o=function(){var c=typeof He=="function"?He(typeof Z=="function"?Z():r):null,f=c&&typeof c.limit=="number"&&c.limit>0?c.limit:An(nt),d={host:window.location.hostname,convId:r,site:g&&g.siteName||"",model:c&&c.modelName?c.modelName:We||nt||"",tokens:Ae,limit:f,percent:i,saturated:c&&c.saturated===!0||typeof B<"u"&&B&&B.saturated===!0?!0:void 0,windowLimit:c&&typeof c.windowLimit=="number"&&c.windowLimit>0?c.windowLimit:c&&typeof c.contextLimit=="number"&&c.contextLimit>0?c.contextLimit:void 0,displayLimit:c&&typeof c.limit=="number"&&c.limit>0?c.limit:void 0,accountLimit:c&&typeof c.accountLimit<"u"?c.accountLimit:void 0,limitPlan:c&&typeof c.limitPlan=="string"&&c.limitPlan?c.limitPlan:void 0,limitWarnings:c&&Array.isArray(c.limitWarnings)?c.limitWarnings:void 0,src:typeof B<"u"&&B&&B.src?B.src:void 0,updatedAt:Date.now(),isLowConfidenceBase:E!==!0,sourceTier:typeof zn=="function"?zn():void 0,partial:typeof Te=="function"?Te(c).partial:c&&c.partial===!0?!0:void 0,partialReason:typeof Te=="function"?Te(c).partialReason:c&&c.partial===!0?c.partialReason||"incomplete":void 0,messages:_t()};(g&&g.siteName||"")==="google_search"&&c&&(d.isLowConfidenceBase=c.partial===!0),typeof Vg=="function"&&Vg()&&(d.isLowConfidenceBase=!1);try{typeof ji=="function"&&(d.messages=ji(r,d.messages,d.isLowConfidenceBase===!0))}catch(b){p("log","[AI CM][export] silent-catch replyManualExport(O-49 union): "+(b instanceof Error&&b.message||String(b)))}if(d.isLowConfidenceBase===!0){if(typeof Vu=="function"&&(d.messages=Vu(d.messages,d.site||"")),typeof en=="function"){var h=en(d.messages,d.site||"");d.messages=h.messages;var m=d;m.bodyProjection=h.mode}}else if(typeof Rr=="function"){var y=Rr(r);if(y&&y.messages.length&&(d.messages=y.messages),typeof en=="function"){var C=en(d.messages,d.site||"");d.messages=C.messages;var S=d;S.bodyProjection=C.mode}}d.dedupe=typeof qo=="function"?qo(Ie,d.messages):void 0,n({data:d})};let s=typeof window<"u"&&window.AiCmBaseHandler?window.AiCmBaseHandler:null,u=s&&typeof s.aiCmFilesDrainSite=="function"?s.aiCmFilesDrainSite()===!0:!1,l=typeof Er=="function"?Er():!1;return l&&typeof hr=="function"?hr(r,o):l&&typeof wn=="function"?wn(r,o):u&&s&&typeof s.aiCmExportFilesDrainThen=="function"?s.aiCmExportFilesDrainThen(r,o,6e3):o(),!0}if(e.type==="GET_STATS")if(g&&(U||I&&E)){let s=g.extractMessages(),u=Ma();var a=cl(He(typeof Z=="function"?Z():""));n({data:{site:g.siteName,modelName:typeof a.modelName=="string"&&a.modelName?a.modelName:K.getModel(u)?.name||u,tokenCount:typeof a.tokenEstimate=="number"?a.tokenEstimate:null,contextLimit:typeof a.effectiveLimit=="number"?a.effectiveLimit:null,percentage:typeof a.percentage=="number"?a.percentage:null,messageCount:s.length}})}else n({data:null});return!0});function zv(e){var t=null,n=null;function r(){n&&(clearTimeout(n),n=null);try{chrome.storage.local.get(["aiCmHistory"],function(o){var a=o.aiCmHistory,s=!!(a&&a.host===window.location.hostname),u=s?{host:a.host,model:a.model||"",tokens:typeof a.tokens=="number"?a.tokens:0,percent:typeof a.percent=="number"?a.percent:0,count:Array.isArray(a.messages)?a.messages.length:0}:{host:window.location.hostname,model:"",tokens:0,percent:0,count:0},l=[];if(s&&Array.isArray(a.messages))for(var c=0;c<a.messages.length;c++){var f=a.messages[c]||{};l.push((f.role||"?")+"|"+String(f.text||"").slice(0,60).replace(/\s+/g," "))}var d={generatedAt:new Date().toISOString(),url:window.location.href,logsContent:typeof $a=="function"?$a():[],aiCmHistoryMeta:u,historyPreviews:l,intercept:t||null};e({ok:!0,diag:d})})}catch{e({ok:!0,diag:{generatedAt:new Date().toISOString(),url:window.location.href,logsContent:[],aiCmHistoryMeta:null,historyPreviews:[],intercept:t}})}}function i(o){try{t=o&&o.detail||null}catch{t=null}r()}window.addEventListener("ai-cm-diag-response",i),n=setTimeout(r,900);try{window.dispatchEvent(new CustomEvent("ai-cm-diag-request"))}catch{}}function Jg(e){Vl(e);try{window.dispatchEvent(new CustomEvent("ai-cm-debug-logs",{detail:!!e}))}catch{}}if($())try{chrome.storage.local.get(["aiCmDebugLogs"],function(e){Jg(e.aiCmDebugLogs===!0)}),chrome.storage.onChanged.addListener(function(e,t){t==="local"&&e.aiCmDebugLogs&&Jg(e.aiCmDebugLogs.newValue===!0)})}catch{}(function(){try{if(!window.location.hostname.includes("claude.ai"))return;var e="/";try{var t=window.location.origin;typeof t=="string"&&t&&t!=="null"&&(e=t)}catch{e="/"}document.addEventListener("paste",function(n){try{var r=n.clipboardData&&n.clipboardData.getData("text");r&&String(r).trim()&&(window.postMessage({source:"ai-cm-paste",text:String(r).slice(0,5e5)},e),p("log","[AI CM][Claude][pasted] paste-capture len="+r.length),p("log","[AI CM][Claude][pasted] paste-send len="+r.length))}catch{}},!0)}catch{}})();setTimeout(()=>Pv(),1500);Gi();document.addEventListener("keydown",function(e){if(e.ctrlKey&&e.shiftKey&&e.code==="KeyD"){e.preventDefault();for(var t=[],n=0;n<lt.length;n++){var r=Q[n]||"";t.push({id:lt[n],len:r.length,preview:r.slice(0,60).replace(/\s+/g," ")})}var i={convId:(location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/)||[])[1]||"",count:lt.length,turns:t},o="ai-cm-history-"+Date.now()+".json";try{var a=typeof Be<"u"?Be:null;a&&typeof a.aiCmDiagDownload=="function"&&a.aiCmDiagDownload("hotkey-json-dump",JSON.stringify(i,null,2),o,{site:typeof g<"u"&&g&&g.siteName||"",threadId:typeof Je=="function"?Je():""})}catch{}try{var s=new Blob([JSON.stringify(i,null,2)],{type:"application/json"}),u=URL.createObjectURL(s),l=document.createElement("a");l.href=u,l.download=o,document.body.appendChild(l),l.click(),l.remove(),setTimeout(function(){URL.revokeObjectURL(u)},1e3),console.log("[byok-dump] \u0434\u0430\u043C\u043F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441\u043A\u0430\u0447\u0430\u043D: "+i.count+" \u0445\u043E\u0434\u043E\u0432")}catch(c){Hr("content:byok-dump","[byok-dump] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0434\u0430\u043C\u043F:",c)}}});$()&&chrome.storage.onChanged.addListener(e=>{if(e.showWidget)if(e.showWidget.newValue===!1){let f=document.getElementById("ai-context-widget");f&&f.remove(),q=null,fa()}else{va();var t=Qi(He(typeof Z=="function"?Z():""));t&&Na(t.percentage,t.tokenEstimate,t.effectiveLimit,t.contextLimit,t.displayLimit,t.modelName,t.attachBreak)}let n=Hn();if(e[n]){let f=e[n].newValue;gt=typeof f=="number"&&f>0?f:null,Wt(),U&&oe()}try{var r=T()||"";if(r){var i=Jp+r,o=Zp+r;(e[i]||e[o])&&(delete Sr[r],Xp(r,"storage-changed"))}}catch{}(e.selectedModel||e.customLimit)&&(e.selectedModel&&(wr=e.selectedModel.newValue),e.customLimit&&(Mi=e.customLimit.newValue),fl());try{var a=null;for(var s in e)if(s.indexOf("aiCmAutoExportPct_")===0){a=s;break}if(a){var u=a.slice(18),l=e[a].newValue,c=parseInt(l,10);rt[u]=!isNaN(c)&&c>=1&&c<=100?c:void 0,p("log","[AI CM][auto-export] per-site onChanged "+a+"="+(rt[u]===void 0?"\u043D\u0435\u0442 (\u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u043B\u0431\u044D\u043A)":rt[u])),U&&typeof ue=="number"&&ue>=0&&En(ue)}}catch(f){v(f,"content:storage-onchanged-per-site")}(e.ai_cm_exact_token_count||e.ai_cm_gemini_api_key)&&(Qp(),Gt="",ft=0,jt="",un="",xe=0,U&&oe())});function Kv(e){var t=e&&e.detail!==void 0?e.detail:null;if(typeof t!="string")return t||null;try{return JSON.parse(t)}catch{return null}}var Me=null,Xt=0,Xi="",Cn={};function Or(){try{var e=typeof T=="function"&&T()||"";if(e)return e;var t=typeof tn=="function"?tn(window.location&&window.location.href):"";return t?"path:"+t:""}catch{return""}}function Zg(){try{if(!Cn||typeof Cn!="object")return!1;for(var e in Cn)Object.prototype.hasOwnProperty.call(Cn,e)&&delete Cn[e];return!0}catch(t){return v(t,"content:aistudio-net-ready-reset"),!1}}function Lt(){try{return String(window.location&&window.location.hostname||"").indexOf("aistudio.google.com")!==-1}catch(e){return v(e,"content:aistudio-net-host"),!1}}var Xg=["tokens","token","\u0442\u043E\u043A\u0435\u043D\u043E\u0432","\u0442\u043E\u043A\u0435\u043D\u0430","\u0442\u043E\u043A\u0435\u043D"],Yg=0,ep=0;function Su(e){var t=String(e??"").replace(/[\u00a0\u202f]/g," ").trim();if(!t||!/^\d+$/.test(t)&&!/^\d{1,3}(?:[\s.,]\d{3})+$/.test(t))return 0;var n=t.replace(/[^\d]/g,"");if(!n)return 0;var r=parseInt(n,10);return!isFinite(r)||r<=0||r>=1e8?0:r}function $v(e){if(!e||typeof e.querySelectorAll!="function")return 0;for(var t=e.querySelectorAll("*"),n=t.length>400?400:t.length,r=0;r<n;r++){var i=t[r];if(!(i.children&&i.children.length>0)){var o=String(i.textContent||"").trim(),a=o.toLowerCase(),s=/(?:^|[^\d.,])(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(?:tokens?|токен\w*)/i.exec(o);if(s&&Xg.indexOf(a)===-1){var u=Su(s[1]);if(u>0)return u}if(Xg.indexOf(a)!==-1){var l=i.previousElementSibling,c=Su(l?l.textContent:"");if(c>0)return c;var f=String(i.parentElement&&i.parentElement.textContent||"").replace(/[\u00a0\u202f]/g," "),d=/(?:^|[^\d.,])(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(?:tokens?|токен\w*)/i.exec(f),h=d?Su(d[1]):0;if(h>0)return h}}}return 0}function Pr(){try{if(!Lt())return 0;var e=Date.now();if(e-Yg<400)return ep;Yg=e;var t=Vv();return ep=t,t}catch(n){return v(n,"content:aistudio-native-tokens"),0}}function Vv(){try{if(!Lt())return 0;var e=document.querySelector("h1");if(!e)return typeof Qo=="function"?Qo():0;for(var t=e.parentElement,n=0;n<3&&t;n++){var r=String(t.textContent||"").length;if(r>0&&r<=4e3){var i=$v(t);if(i>0)return i}t=t.parentElement}}catch(o){v(o,"content:aistudio-native-probe")}return typeof Qo=="function"?Qo():0}var tp="ai_cm_aistudio_history_",Rl=1,$i="",rl="",Dr=0;function qa(){try{return typeof sessionStorage<"u"?sessionStorage:null}catch(e){return v(e,"content:aistudio-cache-storage"),null}}function tn(e){var t=String(e||"");if(!t)return"";try{return typeof URL=="function"?new URL(t).pathname:t}catch{return t}}function ja(e){var t=String(e||window.location&&window.location.href||""),n=tn(t),r=/\/prompts\/([^\/?#]+)/.exec(n);return r&&r[1]?tp+r[1]:t?tp+"href":""}function Ll(e){return e!==rl&&(rl=e,Dr=0),Dr}function Qv(){try{if(!Me||!Array.isArray(Me.msgs)||Me.msgs.length===0)return!1;var e=qa();if(!e)return!1;var t=ja(Me.href);return!t||Me.msgs.length<Ll(t)?!1:(e.setItem(t,JSON.stringify({v:Rl,href:Me.href,msgs:Me.msgs,count:Me.count,serverTokens:typeof Xt=="number"?Xt:0,model:Xi||"",ts:Me.ts})),$i=t,Dr=Me.msgs.length,!0)}catch(n){return v(n,"content:aistudio-cache-save"),!1}}function il(){try{if(!Lt())return!1;var e=qa();if(!e)return!1;var t=ja();if(!t)return!1;$i=t;var n=e.getItem(t);if(!n)return!1;var r=null;try{r=JSON.parse(n)}catch{r=null}if(!r||r.v!==Rl||!Array.isArray(r.msgs)||r.msgs.length===0)return!1;var i=tn(window.location&&window.location.href),o=tn(r.href);return i&&o&&i!==o?!1:(Ll(t),Dr=r.msgs.length,typeof r.model=="string"&&r.model&&(Xi=r.model,window.__aiCmNetModelSlug=r.model,Bt=r.model),tm({kind:"history",msgs:r.msgs,count:r.count,serverTokens:r.serverTokens,ts:r.ts,href:r.href,cached:!0}))}catch(a){return v(a,"content:aistudio-cache-restore"),!1}}function np(){try{if(!Lt())return!1;var e=$i;if(!e)return!1;var t=ja();if(e===t)return!1;var n=qa();return n&&n.removeItem(e),$i="",rl="",Dr=0,Xi="",window.__aiCmNetModelSlug="",!0}catch(r){return v(r,"content:aistudio-cache-clear"),!1}}function Jv(e){try{if(!Lt()||!Array.isArray(e)||e.length===0)return!1;var t=qa();if(!t)return!1;var n=String(window.location&&window.location.href||""),r=ja(n);if(!r||e.length<=Ll(r))return!1;for(var i=[],o=0;o<e.length;o++){var a=e[o];if(a){var s=typeof a.text=="string"?a.text:typeof a.content=="string"?a.content:"";s.length!==0&&i.push({role:a.role==="assistant"||a.role==="model"?"assistant":"user",text:s})}}return i.length===0?!1:(t.setItem(r,JSON.stringify({v:Rl,href:n,msgs:i,count:i.length,serverTokens:typeof Xt=="number"?Xt:0,model:Xi||"",ts:Date.now()})),$i=r,Dr=i.length,p("log","[AI CM][aistudio-cache] dom-peak key="+r+" msgs="+i.length),!0)}catch(u){return v(u,"content:aistudio-dom-cache-save"),!1}}function tm(e){if(!e)return!1;var t=!1;if(e.kind==="count"){var n=typeof e.serverTokens=="number"?e.serverTokens:parseInt(e.serverTokens,10);isFinite(n)&&n>0&&n!==Xt&&(Xt=n,xe=n,t=!0)}else if(e.kind==="history"&&Array.isArray(e.msgs)&&e.msgs.length>0){for(var r=[],i=0;i<e.msgs.length;i++){var o=e.msgs[i];if(!(!o||typeof o.text!="string")){var a=typeof o.sections=="string"?o.sections:"";if(!(o.text.length===0&&a.length===0)){var s={role:o.role==="assistant"||o.role==="model"?"assistant":"user",text:o.text};a&&(s.sections=a),Array.isArray(o.files)&&o.files.length>0&&(s.files=o.files),r.push(s)}}}if(r.length>0){var u=Me,l=String(e.href||window.location.href||""),c=!1;if(u&&Array.isArray(u.msgs)&&u.msgs.length>r.length&&tn(u.href)===tn(l)&&(r=u.msgs,c=!0),Me={msgs:r,count:r.length,ts:c&&u?u.ts:typeof e.ts=="number"?e.ts:Date.now(),href:l,historyComplete:!c},window.__aiCmNetMsgs=Me,typeof sp=="function"&&sp(),!c){var f=typeof Or=="function"&&Or()||"",d=tn(window.location&&window.location.href),h=tn(l);f&&(!d||!h||d===h)&&(Cn[f]=!0)}t=!u||u.count!==r.length||u.ts!==Me.ts;var m=typeof e.serverTokens=="number"?e.serverTokens:parseInt(e.serverTokens,10);isFinite(m)&&m>0&&m!==Xt&&(Xt=m,xe=m)}}return t?(p("log","[AI CM][aistudio-net] kind="+e.kind+" msgs="+(Me?Me.count:0)+" serverTokens="+Xt+(e.cached?" source=session-cache":"")),typeof ap=="function"&&ap(),!0):!1}window.addEventListener("ai-cm-aistudio-net",function(e){try{if(!Lt())return;var t=Kv(e);if(!t)return;var n=tm(t);n&&t.kind==="history"&&Qv()}catch(r){v(r,"content:aistudio-net")}});il();var rp=!1,ve={},nm=!1,Zv="ai-cm-pdf",Xv="ai-cm-pdf-local",Yv=10*1024*1024,ip=64,e0=1024*1024,t0=1,n0=250,rm=5*1024*1024,r0=12e3,i0=1200;function ze(e,t){typeof p=="function"&&p("warn","[AI CM][pdf] "+e,t)}function im(e){var t=e&&e.detail!==void 0?e.detail:null;if(typeof t!="string")return t&&typeof t=="object"?t:null;try{return JSON.parse(t)}catch(n){return ze("detail",n),null}}function o0(e){for(var t="",n=32768,r=0;r<e.length;r+=n)t+=String.fromCharCode.apply(null,Array.from(e.subarray(r,r+n)));try{return btoa(t)}catch(i){return ze("btoa",i),""}}function op(){try{window.dispatchEvent(new CustomEvent("ai-cm-pdf-ready",{detail:JSON.stringify({enabled:!0})}))}catch(e){ze("ready",e)}}function a0(){try{return typeof navigator>"u"||!navigator?!1:String(navigator.userAgent||"").indexOf("Firefox/")!==-1}catch(e){return ze("ua",e),!1}}function s0(e){if(!e||!e.parts||e.got<=0||e.size<=0)return null;for(var t=new Uint8Array(e.size),n=0,r=0;r<e.parts.length;r++){var i=e.parts[r];if(!i)return null;t.set(i,n),n+=i.length}return n===e.size?t:null}function om(e){if(!(!e||typeof e!="object")){for(var t=["retryTimer","localTimer","localReadyTimer"],n=0;n<t.length;n++){var r=e[t[n]];if(r!=null)try{clearTimeout(r)}catch(i){ze("clear-timer",i)}e[t[n]]=null}e.localBytes=null}}function fn(e,t){var n=ve[e];delete ve[e],om(n);var r=t&&typeof t=="object"?t:{},i={id:e,ok:r.ok===!0,text:typeof r.text=="string"?r.text:"",pages:typeof r.pages=="number"?r.pages:0,truncated:r.truncated===!0,reason:typeof r.reason=="string"?r.reason:r.ok===!0?"":"pdf-host-error",size:typeof r.size=="number"?r.size:n?n.size:0,ms:typeof r.ms=="number"?r.ms:0};if(n&&n.port)try{n.port.disconnect()}catch(o){ze("disconnect",o)}try{window.dispatchEvent(new CustomEvent("ai-cm-pdf-result",{detail:JSON.stringify(i)}))}catch(o){ze("result-event",o)}}function u0(e){if(!(!e||typeof e!="object")){e.retryTimer!==null&&e.retryTimer!==void 0&&(clearTimeout(e.retryTimer),e.retryTimer=null);var t=e.port;if(e.port=null,!!t)try{t.disconnect()}catch(n){ze("drop-port",n)}}}function Au(e,t,n){var r=ve[e];if(r){if(u0(r),n===!0&&r.attempt<t0){if(r.retryTimer!==null)return;r.retryTimer=setTimeout(function(){r.retryTimer=null,ve[e]&&Dl(e,r.attempt+1)},n0);return}if(r.localTried===!0){fn(e,{ok:!1,reason:typeof t=="string"&&t?t:"pdf-aborted"});return}Ol(e)}}function ol(e){var t=ve[e];if(!(!t||!t.localBytes)){t.localReadyTimer!==null&&t.localReadyTimer!==void 0&&(clearTimeout(t.localReadyTimer),t.localReadyTimer=null);var n=t.localBytes;t.localBytes=null;try{window.postMessage({source:Xv,id:e,bytes:n.buffer,maxChars:t.maxChars||2e5},"*",[n.buffer])}catch(r){ze("local-post",r),Pl(e,{ok:!1,reason:"pdf-host-error"})}}}function Ol(e){var t=ve[e];if(t&&!(t.localTried===!0||t.localPending===!0)){if(t.size>rm){fn(e,{ok:!1,reason:"pdf-too-large"});return}var n=s0(t);if(!n){fn(e,{ok:!1,reason:"pdf-invalid"});return}if(t.localTried=!0,t.localPending=!0,t.localBytes=n,t.localTimer=setTimeout(function(){t.localTimer=null,ve[e]&&Pl(e,{ok:!1,reason:"pdf-timeout"})},r0),nm===!0){ol(e);return}t.localReadyTimer=setTimeout(function(){t.localReadyTimer=null,ve[e]&&ol(e)},i0)}}function Pl(e,t){var n=ve[e];if(n){n.localTimer!==null&&n.localTimer!==void 0&&(clearTimeout(n.localTimer),n.localTimer=null),n.localReadyTimer!==null&&n.localReadyTimer!==void 0&&(clearTimeout(n.localReadyTimer),n.localReadyTimer=null),n.localPending=!1,n.localBytes=null;var r=t&&typeof t=="object"?t:{};if(r.ok===!0&&typeof r.text=="string"&&r.text!==""){fn(e,r);return}if(n.portEverStarted!==!0){Dl(e,0);return}fn(e,{ok:!1,reason:"pdf-aborted"})}}function Dl(e,t){var n=ve[e];if(n){if(typeof chrome>"u"||!chrome.runtime||typeof chrome.runtime.connect!="function"){Ol(e);return}var r;try{r=chrome.runtime.connect({name:"ai-cm-pdf:"+e})}catch(o){ze("connect",o),Au(e,"pdf-unavailable",!1);return}if(!ve[e]){try{r.disconnect()}catch(o){ze("disconnect",o)}return}n.port=r,n.attempt=t,n.portEverStarted=!0,r.onMessage.addListener(function(o){!o||typeof o!="object"||ve[e]!==n||n.port!==r||String(o.t||"")==="result"&&fn(e,o)}),r.onDisconnect.addListener(function(){try{chrome.runtime.lastError}catch(o){ze("lastError",o)}ve[e]!==n||n.port!==r||(n.port=null,Au(e,"pdf-aborted",!0))});try{r.postMessage({t:"begin",id:e,total:n.got,maxChars:n.maxChars||2e5});for(var i=0;i<n.parts.length;i++)n.parts[i]&&r.postMessage({t:"chunk",id:e,seq:i,b64:o0(n.parts[i])});r.postMessage({t:"end",id:e})}catch(o){ze("post",o),n.port=null,Au(e,"pdf-host-error",!1)}}}function l0(e){var t=ve[e];if(!(!t||t.sent)){if(t.sent=!0,a0()&&t.size>0&&t.size<=rm){Ol(e);return}Dl(e,0)}}function c0(e){if(!(!e||e.source!==window)){var t=e.data;if(!(!t||t.source!==Zv)){var n=typeof t.id=="string"?t.id:"";if(n){var r=ve[n];r||(r=ve[n]={total:0,parts:[],got:0,size:0,port:null,sent:!1,maxChars:0,attempt:-1,portEverStarted:!1,localTried:!1,localPending:!1,retryTimer:null,localTimer:null,localReadyTimer:null,localBytes:null}),typeof t.maxChars=="number"&&t.maxChars>0&&(r.maxChars=t.maxChars);var i=typeof t.total=="number"?t.total:0;i>0&&i<=ip&&(r.total=i);var o=typeof t.seq=="number"?t.seq:-1,a=t.bytes,s=a&&typeof a.byteLength=="number"?a.byteLength:0;if(o<0||o>=ip||s<=0||s>e0){fn(n,{ok:!1,reason:"pdf-invalid"});return}if(!r.parts[o]){if(r.size+s>Yv){fn(n,{ok:!1,reason:"pdf-too-large"});return}r.parts[o]=new Uint8Array(a),r.got++,r.size+=s,r.total>0&&r.got>=r.total&&l0(n)}}}}}function f0(){for(var e=Object.keys(ve),t=0;t<e.length;t++){var n=ve[e[t]];if(delete ve[e[t]],om(n),n&&n.port){try{n.port.postMessage({t:"cancel",id:e[t]})}catch(r){ze("cancel",r)}try{n.port.disconnect()}catch(r){ze("cancel-disconnect",r)}}}}function d0(e){var t=im(e),n=t&&typeof t.id=="string"?t.id:"";n&&fn(n,{ok:!1,reason:"pdf-aborted"})}function g0(e){var t=im(e),n=t&&typeof t.id=="string"?t.id:"";if(n){var r=ve[n];!r||r.localPending!==!0||Pl(n,t)}}function p0(){nm=!0;for(var e=Object.keys(ve),t=0;t<e.length;t++){var n=ve[e[t]];n&&n.localBytes&&ol(e[t])}}function m0(){rp||typeof chrome>"u"||!chrome.runtime||typeof chrome.runtime.connect!="function"||(rp=!0,window.addEventListener("message",c0),window.addEventListener("ai-cm-pdf-hello",op),window.addEventListener("ai-cm-pdf-cancel",d0),window.addEventListener("ai-cm-pdf-local-result",g0),window.addEventListener("ai-cm-pdf-local-ready",p0),window.addEventListener("pagehide",f0),op())}m0();function Vo(){return typeof Ou!="function"||typeof document>"u"||!document||!document.body?!1:Ou(String(document.body.innerText||""))||h0()||v0()}function fr(){var e=typeof Z=="function"&&Z()||"";return e||(e=typeof T=="function"&&T()||""),e||""}function ap(){if(typeof U<"u"&&!U&&typeof et=="function")try{et()}catch(e){v(e,"content:aistudio-net-kick")}typeof U<"u"&&U&&typeof oe=="function"&&(oe(),typeof Lr=="function"&&Lr(je))}function sp(){try{var e=Me;if(!e||!Array.isArray(e.msgs)||e.msgs.length===0)return;for(var t=[],n=0;n<e.msgs.length;n++){var r=e.msgs[n]||{},i=typeof r.text=="string"?r.text:"",o=typeof r.sections=="string"?r.sections:"";t.push(i+o)}var a=t.join(`
`);if(!a)return;P=a,R=e.msgs.length,Q=t,Ie=typeof nu=="function"?nu(e):null,I=!0,E=e.historyComplete===!0,Mt=!1}catch(s){v(s,"content:aistudio-net-base")}}function Qo(){try{if(!Lt())return 0;var e=document.querySelector(".v3-token-count-value");if(e){var t=String(e.textContent||"").trim(),n=t.match(/([\d][\d\s.,]*)\s*tokens?/i);if(n){var r=parseInt(String(n[1]).replace(/[^\d]/g,""),10);if(isFinite(r)&&r>0&&r<1e8)return r}}var i=document.querySelector("main")||document.body;if(!i)return 0;for(var o=i.querySelectorAll?i.querySelectorAll("*"):[],a=0;a<o.length&&a<4e3;a++){var s=o[a];if(!(s.children&&s.children.length>0)){var u=String(s.textContent||"").trim();if(!(!u||u.length>24)){var l=u.match(/^([\d][\d\s.,]*)\s*tokens?$/i);if(l){var c=parseInt(String(l[1]).replace(/[^\d]/g,""),10);if(!(!isFinite(c)||c<=0||c>1e8))return c}}}}return 0}catch{return 0}}function up(){try{if(!Lt()||typeof g>"u"||!g||typeof g.detectModel!="function")return"";var e=g.detectModel()||"";return typeof e=="string"?e:""}catch{return""}}function h0(){try{if(typeof g>"u"||!g||g.siteName!=="deepseek"||typeof rg!="function")return!1;var e=document.querySelectorAll('div[class*="ds-message"]');if(!e||e.length===0)return!1;for(var t=[],n=Math.max(0,e.length-3),r=n;r<e.length;r++){var i=e[r];t.push(String(i.innerText||i.textContent||""))}return rg(t)}catch(o){return v(o,"content:deepseek-stop-marker"),!1}}var al=0,sl="";function y0(e){try{if(typeof g>"u"||!g||g.siteName!=="qwen")return;var t=e.target;if(!t||typeof t.closest!="function")return;var n=t.closest('button, [role="button"]');if(!n)return;var r=(n.getAttribute("aria-label")||"")+" "+(n.getAttribute("title")||"")+" "+(n.className||"");if(!/stop-button|стоп|stop/i.test(r))return;al=Date.now(),sl=typeof Z=="function"&&Z()||""}catch(i){v(i,"content:qwen-stop-click")}}function v0(){if(!al||Date.now()-al>3e4||typeof g>"u"||!g||g.siteName!=="qwen")return!1;var e=typeof Z=="function"&&Z()||"";return!sl||!e||sl===e}try{typeof document<"u"&&document&&typeof document.addEventListener=="function"&&document.addEventListener("click",y0,!0)}catch(e){v(e,"content:qwen-stop-listener")}try{typeof yr=="function"&&typeof iu=="function"&&iu(yr),typeof vr=="function"&&typeof su=="function"&&su(vr)}catch(e){v(e,"content:v2-messages-install")}function lp(e,t){try{return typeof g>"u"||!g||g.siteName!=="aistudio"?void 0:qo(Array.isArray(e)?e:null,Array.isArray(t)?t:null)}catch{return}}function cp(){try{if(typeof g>"u"||!g||g.siteName!=="aistudio"||!Ld())return null;let e=[],t=typeof Me<"u"?Me:null;if(t&&Array.isArray(t.msgs)&&t.msgs.length>0){let o=[];for(let s=0;s<t.msgs.length;s++){let u=t.msgs[s]||{};o.push({role:u.role==="user"?"user":"assistant",text:String(u.text==null?"":u.text)+String(u.sections==null?"":u.sections),ordinal:s,nodeType:"message"})}let a=Ys(o,{platform:"aistudio",convId:typeof fr=="function"&&fr()||null,kind:"net",capturedAt:typeof t.ts=="number"&&t.ts>0?t.ts:Date.now(),complete:E===!0});for(let s=0;s<a.messages.length;s++){let u=a.messages[s];if(!u||!u.text)continue;let l={role:u.role==="user"?"user":"assistant",text:u.text};typeof u.reasoning=="string"&&u.reasoning&&(l.reasoning=u.reasoning),e.push(l)}return e.length?e:null}let n=g;if(typeof n.capture!="function")return null;let r=n.capture();if(!r||!Array.isArray(r.messages)||r.messages.length===0)return null;let i=rr(r);for(let o=0;o<i.messages.length;o++){let a=i.messages[o];if(!a||!a.text)continue;let s={role:a.role==="user"?"user":"assistant",text:a.text};typeof a.reasoning=="string"&&a.reasoning&&(s.reasoning=a.reasoning),e.push(s)}return e.length?e:null}catch(e){return v(e,"content:v2-messages-export-source"),null}}function fp(e,t){try{return Zd(e,t)}catch{return{messages:Array.isArray(e)?e:[],mode:""}}}function Te(e){try{return Yd(e)}catch{return{partial:void 0,partialReason:void 0}}}function C0(e,t,n,r){let i=e.baseComplete===!0,o=typeof dt=="function"?dt()||"":typeof g<"u"&&g&&g.siteName||"",a=typeof K<"u"&&K&&typeof K.getContextLimit=="function"?K.getContextLimit(t):0;return{site:o,convId:e.convId,capturedAt:e.capturedAt,nativeTokens:n,serverTokens:r,baseTokens:i?e.tokens:0,domTokens:i?0:e.tokens,estimateTokens:0,bodyHash:e.bodyHash,baseComplete:i,partial:e.partial===!0,modelId:t,modelWindow:a,displayLimit:e.limit,fallbackLimit:e.limit,accountLimit:null,plan:null,windowSource:"catalog",displaySource:"fallback",nativeSource:"span.v3-token-count-value",serverSource:"network/server",baseSource:"base:complete",domSource:"dom:visible"}}function b0(e,t,n){return e==="chatgpt"?!(typeof n=="function"&&n()):e==="gemini"?/^(?:\/u\/\d+)?\/app\/?$/.test(String(t||"")):e==="aistudio"?/^(?:\/app)?\/prompts(?:\/new_chat)?\/?$/.test(String(t||"")):!1}function x0(e,t){if(t)return"stopped";var n=String(e||"");return n.indexOf("missing-user-text")!==-1?"missing-user-text":n&&n!=="complete"&&n!=="passive-complete"?n:"incomplete"}var Fl=null;function am(e){if(typeof e!="string")return null;var t=e.trim();return t&&t!=="auto"?t:null}function w0(){try{if(!$()||typeof chrome>"u"||!chrome.storage||!chrome.storage.sync)return;chrome.storage.sync.get(["aiCmGeminiPlan"],function(e){try{Fl=am(e&&e.aiCmGeminiPlan),typeof U<"u"&&U&&oe()}catch(t){v(t,"content:gemini-plan-read")}})}catch(e){v(e,"content:gemini-plan-load")}}try{w0(),typeof chrome<"u"&&chrome.storage&&chrome.storage.onChanged&&chrome.storage.onChanged.addListener(function(e,t){if(!(t!=="sync"||!e||!e.aiCmGeminiPlan)){Fl=am(e.aiCmGeminiPlan.newValue);try{oe()}catch(n){v(n,"content:gemini-plan-change")}}})}catch(e){v(e,"content:gemini-plan-wire")}function S0(){try{if(typeof g>"u"||!g||g.siteName!=="chatgpt"||typeof g.detectContextSaturation!="function")return!1;var e=g.detectContextSaturation();return!!(e&&e.active)}catch(t){return v(t,"content:context-saturation"),!1}}});A0();})();

    } catch (e) {
      console.error('[AI CM][pack] UI init error:', e);
    }
    replay();
    setTimeout(replay, 500);
    setTimeout(replay, 1500);
    setTimeout(replay, 3000);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initUI();
  } else {
    document.addEventListener('DOMContentLoaded', initUI);
  }
  window.addEventListener('load', replay);
})();


/* ===== pake-think-collapse ===== */


(function () {
  if (window.__aiCmThinkCollapseInstalled) return;
  window.__aiCmThinkCollapseInstalled = true;

  var THINK_RE = /(Думал|Думаю|Размышлял|Размышляю|Thought|Thinking|思考|已思考)/i;
  var autoClicking = false;

  function findHeader(block) {
    if (!block) return null;
    for (var i = 0; i < block.children.length; i++) {
      var c = block.children[i];
      if (c.classList && c.classList.contains('ds-think-content')) continue;
      var txt = (c.textContent || '').trim();
      if (txt && txt.length < 80 && THINK_RE.test(txt)) return c;
    }
    return null;
  }

  function collapseOne(content) {
    var block = content.parentElement;
    if (!block) return false;
    if (block.getAttribute('data-ai-cm-think-auto') === '1') return false;
    if (block.getAttribute('data-ai-cm-think-manual') === '1') return false;
    var msg = block.closest ? block.closest('.ds-message') : null;
    if (msg && msg.getAttribute('data-ai-cm-think-manual') === '1') return false;
    var header = findHeader(block);
    if (!header) return false;
    block.setAttribute('data-ai-cm-think-auto', '1');
    autoClicking = true;
    try { header.click(); } catch (e) {}
    setTimeout(function () { autoClicking = false; }, 0);
    return true;
  }

  function scan() {
    var list = document.querySelectorAll('.ds-think-content');
    for (var i = 0; i < list.length; i++) collapseOne(list[i]);
  }

  // Ручной клик по заголовку помечает блок/сообщение: больше не сворачиваем.
  document.addEventListener('click', function (ev) {
    if (autoClicking) return;
    var n = ev.target;
    for (var i = 0; i < 7 && n; i++, n = n.parentElement) {
      var header = findHeader(n);
      if (header && (header === ev.target || header.contains(ev.target))) {
        n.setAttribute('data-ai-cm-think-manual', '1');
        var msg = n.closest ? n.closest('.ds-message') : null;
        if (msg) msg.setAttribute('data-ai-cm-think-manual', '1');
        return;
      }
    }
  }, true);

  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; scan(); }, 150);
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
    }
  });
  try { mo.observe(document.body || document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  setInterval(schedule, 2000);
  scan();
})();


/* ===== pake-settings ===== */


(function () {
  var OPTIONS_HTML = "<!DOCTYPE html>\n<html lang=\"ru\">\n\n<head>\n<script>window.__AI_CM_OPTIONS_FRAME__=true;</script>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title data-i18n=\"options_page_title\">AI Context Monitor</title>\n  <style>\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  /* Minor-B (#19, WCAG 1.4.10): фиксированные 300px убраны — раскладка тянется по окну.\n     Потокобезопасность на 320px: `overflow-wrap: anywhere` обнуляет min-content текста,\n     поэтому длинные RU/EN-подписи переносятся, а не выпирают за вьюпорт. */\n  min-width: 0;\n  max-width: 100%;\n  overflow-wrap: anywhere;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  background: #1a1a2e;\n  color: #e0e0e0;\n}\n\n.popup {\n  /* Minor-B (#19): колонка контента без фиксированной ширины (max-width — не фикс). */\n  padding: 16px;\n  max-width: 720px;\n}\n\n.header {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 16px;\n  padding-bottom: 12px;\n  border-bottom: 1px solid #2a2a4a;\n}\n\n.logo {\n  font-size: 24px;\n}\n\nh1 {\n  font-size: 16px;\n  font-weight: 600;\n  color: #ffffff;\n}\n\n.stats {\n  background: #16213e;\n  border-radius: 10px;\n  padding: 12px;\n  margin-bottom: 16px;\n}\n\n.stat-row {\n  display: flex;\n  justify-content: space-between;\n  padding: 4px 0;\n  font-size: 13px;\n}\n\n.stat-row.highlight {\n  margin-top: 4px;\n  padding-top: 8px;\n  border-top: 1px solid #2a2a4a;\n  font-weight: 600;\n}\n\n.stat-label {\n  color: #8b8bad;\n}\n\n.stat-value {\n  color: #ffffff;\n  font-variant-numeric: tabular-nums;\n}\n\n.section {\n  margin-bottom: 12px;\n}\n\n.label {\n  display: block;\n  font-size: 12px;\n  color: #8b8bad;\n  margin-bottom: 4px;\n}\n\nselect, input {\n  width: 100%;\n  padding: 8px 10px;\n  border-radius: 8px;\n  border: 1px solid #2a2a4a;\n  background: #16213e;\n  color: #ffffff;\n  font-size: 13px;\n}\n\nselect:focus, input:focus {\n  border-color: #7c3aed;\n}\n\n/* v1.20 (M-3): видимый фокус для клавиатуры. Прежняя смена border-color на :focus\n   сохранена выше как дополнение; outline больше не подавляется.\n   Кнопки/ссылки получили обводку впервые — раньше у них не было :focus-стилей вовсе. */\nbutton:focus-visible,\nselect:focus-visible,\ninput:focus-visible,\na:focus-visible,\n[tabindex]:focus-visible {\n  outline: 2px solid #a78bfa;\n  outline-offset: 2px;\n}\n\n/* v1.20 (M-1): смысловые группы (role=\"group\") — обычные .section-контейнеры:\n   ни рамки, ни собственных отступов, поэтому раскладка остаётся прежней. */\n[role=\"group\"].section {\n  border: none;\n  margin: 0 0 12px 0;\n  padding: 0;\n  min-width: 0;\n}\n\n.hint {\n  display: block;\n  font-size: 10px;\n  color: #8b8bad;\n  margin-top: 4px;\n}\n\n.checkbox-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n/* O-7: тумблер сырого режима экспорта — внутри секции «Экспорт истории»,\n   после ряда кнопок; раскладку прочих секций не трогает. */\n.export-hidden-row {\n  margin-top: 8px;\n}\n\n\n.checkbox-row input[type=\"checkbox\"] {\n  width: auto;\n  accent-color: #7c3aed;\n}\n\n.checkbox-row label {\n  font-size: 13px;\n  cursor: pointer;\n}\n\n.footer {\n  text-align: center;\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid #2a2a4a;\n}\n\n.version {\n  font-size: 11px;\n  color: #8b8bad;\n}\n\n/* v1.18 (P1): ссылка на политику конфиденциальности в футере */\n#privacy-link {\n  display: inline-block;\n  margin-left: 8px;\n  font-size: 11px;\n  color: #a78bfa;\n  text-decoration: none;\n  cursor: pointer;\n}\n\n#privacy-link:hover {\n  color: #c4b5fd;\n  text-decoration: underline;\n}\n\n/* v1.19 (M-6): ссылка на руководство в футере — стиль как у #privacy-link */\n#help-link {\n  display: inline-block;\n  margin-left: 8px;\n  font-size: 11px;\n  color: #a78bfa;\n  text-decoration: none;\n  cursor: pointer;\n}\n\n#help-link:hover {\n  color: #c4b5fd;\n  text-decoration: underline;\n}\n\n.input-row {\n  display: flex;\n  gap: 6px;\n}\n\n/* v1.8: ряд «Порог, %» — фикс ширины поля, чтобы цифра не заходила под стрелки спиннера */\n#auto-export-section .input-row {\n  gap: 8px;\n  align-items: center;\n}\n#aiCmAutoExportPct {\n  /* Minor-B (#19/#21): размер в ch вместо жёстких 64px; гарантия v1.8 («цифра не заходит\n     под стрелки спиннера») сохранена через min-width: 64px + padding-right: 20px. */\n  inline-size: 6ch !important;\n  min-width: 64px;\n  flex: 0 0 auto;\n  box-sizing: border-box;\n  padding-right: 20px;\n  height: 32px;\n}\n#aiCmAutoExportFmt {\n  flex: 1 1 auto;\n  min-width: 0;\n  height: 32px;\n}\n\n.input-row input {\n  flex: 1;\n  /* Minor-B (#19): flex-ребёнок без min-width: 0 не сжимается ниже min-content инпута. */\n  min-width: 0;\n}\n\n.btn-reset {\n  padding: 8px 12px;\n  border-radius: 8px;\n  border: 1px solid #2a2a4a;\n  background: #16213e;\n  color: #8b8bad;\n  font-size: 12px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.btn-reset:hover {\n  background: #2a2a4a;\n  color: #ffffff;\n}\n\n.api-key-row {\n  display: flex;\n  gap: 4px;\n}\n\n.api-key-row input {\n  flex: 1;\n  /* Minor-B (#19): без min-width: 0 поле ключа не сжимается на 320px. */\n  min-width: 0;\n}\n\n.btn-toggle {\n  padding: 8px 10px;\n  border-radius: 8px;\n  border: 1px solid #2a2a4a;\n  background: #16213e;\n  color: #e0e0e0;\n  font-size: 14px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.btn-toggle:hover {\n  background: #2a2a4a;\n}\n\n.export-row {\n  display: flex;\n  gap: 6px;\n}\n\n.btn-export {\n  flex: 1;\n  padding: 8px 10px;\n  border-radius: 8px;\n  border: 1px solid #2a2a4a;\n  background: #16213e;\n  color: #ffffff;\n  font-size: 12px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.btn-export:hover:not(:disabled) {\n  background: #2a2a4a;\n}\n\n.btn-export:disabled {\n  color: #9a9ab0;\n  cursor: not-allowed;\n}\n\n.stale-warning {\n  background: #3a1f2b;\n  border: 1px solid #7c3aed;\n  border-radius: 10px;\n  padding: 10px 12px;\n  margin-bottom: 12px;\n  font-size: 12px;\n  line-height: 1.45;\n  color: #f0b0c0;\n}\n\n/* T1 (v1.16): секция «Архивы» — первый ярус истории */\n.archive-list {\n  margin-top: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  font-size: 11px;\n  line-height: 1.4;\n  color: #c8c8e0;\n}\n\n.archive-item {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 6px;\n  padding: 4px 6px;\n  border: 1px solid #2a2a4a;\n  border-radius: 6px;\n}\n\n.archive-info {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.archive-del {\n  flex: 0 0 auto;\n  font-size: 11px;\n  padding: 2px 6px;\n}\n\n.archive-status {\n  display: block;\n  margin-top: 6px;\n}\n\n/* Аудит 1.6 (a11y, WCAG 2.2 target-size): минимальная область нажатия 24×24 px.\n   Блок только добавляющий: прежние объявления и цвета не изменены, раскладка\n   300-пиксельного попапа не затронута (габариты растут только до минимума). */\n.checkbox-row input[type=\"checkbox\"] {\n  min-width: 24px;\n  min-height: 24px;\n}\n\n.archive-del {\n  min-width: 24px;\n  min-height: 24px;\n}\n\n.btn-reset,\n.btn-toggle,\n.btn-export {\n  min-height: 24px;\n}\n\n#privacy-link,\n#help-link {\n  min-height: 24px;\n  line-height: 24px;\n}\n\n/* Major-подбатч 1 (аудит #10): свёрнутая секция «Дополнительно» (<details>/<summary>).\n   Блок только добавляющий: ни одно прежнее правило и ни один цвет не изменены. */\ndetails.section > summary {\n  cursor: pointer;\n  font-size: 12px;\n  color: #8b8bad;\n  padding: 4px 0;\n  margin-bottom: 4px;\n  list-style-position: inside;\n}\n\ndetails.section > summary::marker {\n  color: #a78bfa;\n}\n\ndetails.section > summary:hover {\n  color: #ffffff;\n}\n\n/* Аудит #10: :focus-visible для summary обязателен — подавлять обводку здесь нельзя\n   (это пинится в tests/a11y-options.test.js). Правило намеренно стоит ПОСЛЕ combined-правила\n   выше: a11y-пин берёт первое :focus-visible-правило файла и проверяет по нему\n   селекторы button/select/input/a/[tabindex]. */\nsummary:focus-visible {\n  outline: 2px solid #a78bfa;\n  outline-offset: 2px;\n}\n\n/* =====================================================================================\n * Minor-подбатч B (UI-аудит 2026-09-28, options: находки #19/#20/#21)\n * Блок только добавляющий. Изменены две прежние вещи (обе перечислены в отчёте):\n *   body — снята фикс-ширина 300px (#19);  #aiCmAutoExportPct — width → inline-size (#19).\n * ===================================================================================== */\n\n/* #20: сетка 2×2 для четырёх кнопок экспорта истории (MD / JSON / PDF / TXT).\n   minmax(72px, 1fr) не даёт кнопкам схлопнуться и не переполняет строку даже на 320px. */\n.export-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(72px, 1fr));\n  gap: 6px;\n  min-width: 0;\n}\n\n.export-grid .btn-export {\n  min-width: 0;\n}\n\n/* #20: MD — основной формат (primary); остальные кнопки остаются tonal (.btn-export).\n   Контраст: #ffffff на #7c3aed = 5.70:1; hover #ffffff на #6d28d9 = 7.10:1 (AA ≥ 4.5:1). */\n.export-grid .btn-export--primary {\n  background: #7c3aed;\n  border-color: #7c3aed;\n  color: #ffffff;\n  font-weight: 600;\n}\n\n.export-grid .btn-export--primary:hover:not(:disabled) {\n  background: #6d28d9;\n  border-color: #6d28d9;\n}\n\n/* #20: пока история недоступна, primary-вид не перебивает .btn-export:disabled. */\n.export-grid .btn-export--primary:disabled {\n  background: #16213e;\n  border-color: #2a2a4a;\n  color: #9a9ab0;\n}\n\n/* #21: ряд порогов — суффикс «%» внутри обёртки поля, размер в ch.\n   Число не уходит под стрелки спиннера: спиннер внутри инпута, «%» — снаружи него.\n   #21-polish: поля больше не растягиваются на всю ширину ряда — инпут компактный\n   (~8ch ≈ 55px, хватает под «100»), цифры по центру, «%» сразу за числом. */\n.thresholds-row {\n  gap: 8px;\n  align-items: center;\n}\n\n.threshold-field {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  flex: 0 0 auto;\n  min-width: 0;\n}\n\n.threshold-field input {\n  flex: 0 0 8ch;\n  min-width: 0;\n  inline-size: 8ch;\n  padding: 4px 2px;\n  font-size: 13px;\n  text-align: center;\n}\n\n.threshold-unit {\n  flex: 0 0 auto;\n  font-size: 11px;\n  color: #8b8bad;\n}\n\n/* #21: визуальная валидация диапазона 1–100 — чистый CSS, без aria-правок в options.js\n   (пин tests/a11y-options.test.js:340-342 допускает в options.js ровно одно aria-).\n   Контраст рамки: #ef4444 на фоне поля #16213e = 4.22:1 (≥ 3:1, WCAG 1.4.11). */\n#aiCmProactiveLow:invalid,\n#aiCmProactiveMedium:invalid,\n#aiCmProactiveHigh:invalid {\n  border-color: #ef4444;\n  outline: 1px solid #ef4444;\n}\n\n</style>\n</head>\n\n<body>\n  <div class=\"popup\">\n    <!-- Аудит 1.6 (a11y): весь контент попапа — ровно один main landmark -->\n    <main>\n    <div class=\"header\">\n      <span class=\"logo\">📊</span>\n      <h1 data-i18n=\"options_header_title\">AI Context Monitor</h1>\n    </div>\n\n    <!-- v1.20 (M-2): регион статистики объявляет изменения вежливо -->\n    <div class=\"stats\" id=\"stats\" aria-live=\"polite\">\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_site\">Сайт:</span>\n        <span class=\"stat-value\" id=\"stat-site\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_model\">Модель:</span>\n        <span class=\"stat-value\" id=\"stat-model\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_tokens\">Токены:</span>\n        <span class=\"stat-value\" id=\"stat-tokens\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_window\">Окно модели:</span>\n        <span class=\"stat-value\" id=\"stat-window\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_limit\">Порог показа:</span>\n        <span class=\"stat-value\" id=\"stat-limit\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_account\">Лимит аккаунта:</span>\n        <span class=\"stat-value\" id=\"stat-account\">—</span>\n      </div>\n      <div class=\"stat-row highlight\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_fill\">Заполнение:</span>\n        <span class=\"stat-value\" id=\"stat-percent\">—</span>\n      </div>\n      <div class=\"stat-row\">\n        <span class=\"stat-label\" data-i18n=\"options_stat_source\">Источник:</span>\n        <span class=\"stat-value\" id=\"stat-source\">—</span>\n      </div>\n    </div>\n\n    <!-- v1.20 (M-2): предупреждение об устаревших данных — срочное объявление -->\n    <div class=\"stale-warning\" id=\"stale-warning\" role=\"alert\" style=\"display: none;\"></div>\n    <!-- BIG-02: платформа сообщила «контекст заполнен» — отдельное предупреждение. -->\n    <div class=\"stale-warning\" id=\"saturation-warning\" role=\"alert\" style=\"display: none;\"></div>\n\n    <div class=\"section\">\n      <!-- v1.20 (M-1): подпись связана с select через for/id -->\n      <label class=\"label\" for=\"model-select\" data-i18n=\"options_model_label\">Модель:</label>\n      <select id=\"model-select\">\n        <option value=\"auto\" data-i18n=\"options_model_auto\">Автоопределение</option>\n        <optgroup label=\"OpenAI\">\n          <option value=\"gpt-4o\">GPT-4o (128K)</option>\n          <option value=\"gpt-4o-mini\">GPT-4o Mini (128K)</option>\n          <option value=\"gpt-4-turbo\">GPT-4 Turbo (128K)</option>\n          <option value=\"gpt-4\">GPT-4 (8K)</option>\n          <option value=\"gpt-3.5-turbo\">GPT-3.5 Turbo (16K)</option>\n        </optgroup>\n        <optgroup label=\"Google\">\n          <option value=\"gemini-2.5-pro\">Gemini 2.5 Pro (1M)</option>\n          <option value=\"gemini-2.5-flash\">Gemini 2.5 Flash (1M)</option>\n          <option value=\"gemini-1.5-pro\">Gemini 1.5 Pro (2M)</option>\n        </optgroup>\n        <optgroup label=\"DeepSeek\">\n          <option value=\"deepseek-v3\">DeepSeek V3 (128K)</option>\n          <option value=\"deepseek-r1\">DeepSeek R1 (128K)</option>\n        </optgroup>\n      </select>\n    </div>\n\n    <div class=\"section\">\n      <label class=\"label\" data-i18n=\"options_limit_label\">Лимит контекста:</label>\n      <div class=\"input-row\">\n        <!-- v1.20 (M-1): поле без видимой текстовой подписи получает имя доступности -->\n        <input type=\"number\" id=\"custom-limit\" aria-label=\"Пользовательский лимит токенов\" data-i18n-aria-label=\"options_limit_aria\" placeholder=\"Авто\" data-i18n-placeholder=\"options_limit_placeholder\" min=\"1\" max=\"100\" step=\"1\">\n        <button id=\"reset-limit\" class=\"btn-reset\" data-i18n=\"options_limit_auto_btn\">Авто</button>\n      </div>\n      <span class=\"hint\" data-i18n=\"options_limit_hint\">Порог в % от Авто-порога: цвета и % считаются от этого порога. 100% = как Авто. Пусто = Авто</span>\n    </div>\n\n    <div class=\"section checkbox-row\">\n      <input type=\"checkbox\" id=\"show-widget\" checked>\n      <label for=\"show-widget\" data-i18n=\"options_show_widget\">Показывать индикатор на странице</label>\n    </div>\n    <!-- Major-подбатч 1 (аудит #10): проактивные пороги остаются видимыми; редкие\n         настройки (логи, автоэкспорт, API-ключ, экспорт, архивы) свёрнуты в Advanced ниже. -->\n    <!-- v1.20 (M-1): смысловая группа «Проактивные пороги» -->\n    <div class=\"section\" id=\"proactive-section\" role=\"group\" aria-labelledby=\"proactive-legend\">\n      <label class=\"label\" id=\"proactive-legend\" data-i18n=\"options_proactive_legend\">Проактивные пороги</label>\n      <div class=\"checkbox-row\">\n        <input type=\"checkbox\" id=\"aiCmProactive\" checked>\n        <label for=\"aiCmProactive\" data-i18n=\"options_proactive_badge\">Бейдж и уведомления о порогах</label>\n      </div>\n      <div class=\"checkbox-row\">\n        <input type=\"checkbox\" id=\"aiCmProactiveNotify\">\n        <label for=\"aiCmProactiveNotify\" data-i18n=\"options_proactive_notify\">Chrome-уведомления</label>\n      </div>\n      <div class=\"input-row\">\n        <label class=\"label\" for=\"aiCmProactiveLow\" data-i18n=\"options_proactive_levels_label\">Пороги уведомлений и бейджа (1–100, возрастающий порядок):</label>\n      </div>\n      <div class=\"input-row thresholds-row\">\n        <!-- v1.20 (M-1): у трёх числовых полей порога — собственные имена доступности (title сохранён) -->\n        <!-- Minor-B (#21): суффикс единицы «%», inputmode=numeric и общая подсказка о диапазоне 1–100.\n             «%» — языконейтральный символ-токен (как MD/JSON/PDF/TXT): литерал без data-i18n,\n             т.к. пин tests/i18n-locales.test.js:187-204 требует, чтобы ЛЮБОЕ совпадение ru/en\n             (кроме брендовых строк и options_info_separator) было переведено. -->\n        <span class=\"threshold-field\">\n          <input type=\"number\" id=\"aiCmProactiveLow\" aria-label=\"Низкий порог процентов\" data-i18n-aria-label=\"options_proactive_low_aria\" inputmode=\"numeric\" min=\"1\" max=\"100\" step=\"1\" value=\"70\" title=\"Низкий порог — зелёный\" data-i18n-title=\"options_proactive_low_title\" aria-describedby=\"proactive-threshold-msg\">\n          <span class=\"threshold-unit\">%</span>\n        </span>\n        <span class=\"threshold-field\">\n          <input type=\"number\" id=\"aiCmProactiveMedium\" aria-label=\"Средний порог процентов\" data-i18n-aria-label=\"options_proactive_medium_aria\" inputmode=\"numeric\" min=\"1\" max=\"100\" step=\"1\" value=\"85\" title=\"Средний порог — жёлтый\" data-i18n-title=\"options_proactive_medium_title\" aria-describedby=\"proactive-threshold-msg\">\n          <span class=\"threshold-unit\">%</span>\n        </span>\n        <span class=\"threshold-field\">\n          <input type=\"number\" id=\"aiCmProactiveHigh\" aria-label=\"Высокий порог процентов\" data-i18n-aria-label=\"options_proactive_high_aria\" inputmode=\"numeric\" min=\"1\" max=\"100\" step=\"1\" value=\"95\" title=\"Высокий порог — красный\" data-i18n-title=\"options_proactive_high_title\" aria-describedby=\"proactive-threshold-msg\">\n          <span class=\"threshold-unit\">%</span>\n        </span>\n      </div>\n      <!-- v2.0.13: кольцо на странице красится ТЕМИ ЖЕ порогами — подсказка переписана -->\n      <span class=\"hint\" data-i18n=\"options_ring_zones_hint\">Цвет кольца на странице — по тем же порогам: зелёный ниже нижнего, жёлтый между нижним и верхним, красный от верхнего. Пороги также управляют уведомлениями и автоэкспортом.</span>\n      <!-- Minor-B (#21): статическое сообщение о диапазоне и фактическом поведении,\n           связано с тремя полями порогов через aria-describedby (инвалидация — CSS :invalid) -->\n      <span class=\"hint\" id=\"proactive-threshold-msg\" data-i18n=\"options_proactive_hint\">Допустимо 1–100. Каждый порог срабатывает один раз на разговор; при неверном значении берётся 70/85/95</span>\n    </div>\n\n    <!-- Major-подбатч 1 (аудит #10): один свёрнутый блок для редких настроек.\n         Без атрибута open — по умолчанию закрыт. -->\n    <details class=\"section\" id=\"advanced-section\">\n      <summary data-i18n=\"options_advanced_summary\">Дополнительно</summary>\n\n      <div class=\"section checkbox-row\">\n        <input type=\"checkbox\" id=\"debugLogs\">\n        <label for=\"debugLogs\" data-i18n=\"options_debug_logs\">Подробные логи</label>\n      </div>\n\n      <div class=\"section\">\n        <label class=\"label\" for=\"gemini-plan\" data-i18n=\"options_plan_label\">Тариф Gemini:</label>\n        <select id=\"gemini-plan\" aria-describedby=\"gemini-plan-hint\">\n          <option value=\"auto\" data-i18n=\"options_plan_auto\">Авто (не знаю)</option>\n          <option value=\"free\">Free — 32K</option>\n          <option value=\"ai-plus\">AI Plus — 128K</option>\n          <option value=\"ai-pro\">AI Pro — 1M</option>\n          <option value=\"ultra\">Ultra — 1M</option>\n        </select>\n        <span class=\"hint\" id=\"gemini-plan-hint\" data-i18n=\"options_plan_hint\">Окно модели — 1M. Тариф задаёт лимит аккаунта; «Авто» = лимит неизвестен.</span>\n      </div>\n\n      <!-- v1.20 (M-1): смысловая группа «Автоэкспорт чатов».\n           Выбран role=\"group\" + aria-labelledby (вместо fieldset/legend): имя группы\n           даёт существующая видимая подпись .label, а раскладка .section не меняется. -->\n      <div class=\"section\" id=\"auto-export-section\" role=\"group\" aria-labelledby=\"auto-export-legend\">\n        <label class=\"label\" id=\"auto-export-legend\" data-i18n=\"options_autoexport_legend\">Автоэкспорт чатов (все поддерживаемые платформы)</label>\n        <div class=\"checkbox-row\">\n          <input type=\"checkbox\" id=\"aiCmAutoExport\">\n          <label for=\"aiCmAutoExport\" data-i18n=\"options_autoexport_enable\">Автоэкспорт при пороге</label>\n        </div>\n        <div class=\"input-row\">\n          <label class=\"label\" for=\"aiCmAutoExportPct\" data-i18n=\"options_autoexport_pct_label\">Порог, %:</label>\n          <input type=\"number\" id=\"aiCmAutoExportPct\" min=\"1\" max=\"100\" step=\"1\" value=\"90\">\n          <select id=\"aiCmAutoExportFmt\" aria-label=\"Формат файла автоэкспорта\" data-i18n-aria-label=\"options_autoexport_fmt_aria\">\n            <option value=\"txt\">txt</option>\n            <option value=\"md\">md</option>\n            <option value=\"json\">json</option>\n          </select>\n        </div>\n        <span class=\"hint\" data-i18n=\"options_autoexport_hint\">Один раз скачивает историю чата при достижении порога</span>\n      </div>\n\n      <div class=\"section\">\n        <label class=\"label\" data-i18n=\"options_byok_label\">Gemini API — точный подсчёт токенов</label>\n        <!-- Major-подбатч 1 (аудит #12): у поля ключа появилась видимая подпись label[for] -->\n        <label class=\"label\" for=\"api-key\" data-i18n=\"options_byok_key_label\">API-ключ Google AI Studio</label>\n        <div class=\"api-key-row\">\n          <input type=\"password\" id=\"api-key\" placeholder=\"Введите API-ключ Google AI Studio\" data-i18n-placeholder=\"options_byok_key_placeholder\" autocomplete=\"off\">\n          <button id=\"toggle-api-key\" class=\"btn-toggle\" type=\"button\" aria-pressed=\"false\" title=\"Показать/скрыть ключ\" data-i18n-title=\"options_byok_toggle_title\">👁</button>\n        </div>\n        <span class=\"hint\" data-i18n=\"options_byok_hint\">Ключ хранится только до перезапуска браузера (chrome.storage.session). После перезапуска введите заново.</span>\n        <div class=\"api-key-row\">\n          <span class=\"hint\" id=\"api-key-status\" role=\"status\" data-i18n=\"options_byok_status_unset\">Ключ: не задан</span>\n          <button id=\"api-key-remove\" class=\"btn-toggle\" type=\"button\" data-i18n=\"options_byok_remove\">Убрать ключ</button>\n        </div>\n      </div>\n\n      <div class=\"section\">\n        <div class=\"checkbox-row\">\n          <input type=\"checkbox\" id=\"exact-count\">\n          <label for=\"exact-count\" data-i18n=\"options_exact_count\">Точный подсчёт токенов через Gemini API</label>\n        </div>\n        <!-- BYOK-синхронизация: ключ живёт в session (стирается при перезапуске), флаг — в local.\n             Текст подставляется из локали в options.js; пустой span == предупреждения нет. -->\n        <span class=\"hint\" id=\"exact-count-warning\" role=\"status\"></span>\n      </div>\n\n      <div class=\"section\">\n        <label class=\"label\" data-i18n=\"options_export_legend\">Экспорт истории</label>\n        <!-- Minor-B (#20): сетка 2×2, короткие визуальные подписи MD/JSON/PDF/TXT, доступное имя у каждой кнопки.\n             Локализованные строки действий («Сохранить .md», «Сохранить .txt (эталон)») переехали в title\n             через data-i18n-title: они остаются переводимыми и не дублируют короткую подпись. -->\n        <div class=\"export-grid\" id=\"export-history-grid\">\n          <button id=\"export-md\" class=\"btn-export btn-export--primary\" disabled title=\"Сохранить .md\" data-i18n-title=\"options_export_md\" aria-label=\"MD — сохранить историю в формате Markdown\" data-i18n-aria-label=\"options_export_md_aria\">MD</button>\n          <button id=\"export-json\" class=\"btn-export\" disabled title=\"Сохранить .json\" data-i18n-title=\"options_export_json\" aria-label=\"JSON — сохранить историю в формате JSON\" data-i18n-aria-label=\"options_export_json_aria\">JSON</button>\n          <button id=\"export-pdf\" class=\"btn-export\" disabled title=\"Сохранить .pdf\" data-i18n-title=\"options_export_pdf\" aria-label=\"PDF — сохранить историю в формате PDF\" data-i18n-aria-label=\"options_export_pdf_aria\">PDF</button>\n          <button id=\"export-txt\" class=\"btn-export\" disabled title=\"Сохранить .txt (эталон)\" data-i18n-title=\"options_export_txt\" aria-label=\"TXT — сохранить историю в формате TXT (эталон)\" data-i18n-aria-label=\"options_export_txt_aria\">TXT</button>\n        </div>\n        <div class=\"export-row\">\n          <button id=\"export-diag\" class=\"btn-export\" data-i18n=\"options_export_diag\">Экспорт диагностики</button>\n        </div>\n        <!-- O-7: единственный тумблер сырого режима экспорта (default OFF = текущее поведение) -->\n        <!-- D-O41 (UX): подсказка тумблера — reasoning автоматически попадает в экспорт, если он\n             есть в источнике; принудительное исключение (OFF) действует, когда reasoning в\n             источнике нет (force-exclude). Строки — ключ options_export_hidden_title (ru/en). -->\n        <div class=\"checkbox-row export-hidden-row\">\n          <input type=\"checkbox\" id=\"aiCmIncludeHiddenInExport\" title=\"Reasoning автоматически включается при наличии в источнике; тумблер принудительно исключает\" data-i18n-title=\"options_export_hidden_title\">\n          <label for=\"aiCmIncludeHiddenInExport\" data-i18n=\"options_export_hidden_label\">Включать reasoning и инъекции соседних расширений (DeepSeek++, Better DeepSeek) в экспорт</label>\n        </div>\n        <span class=\"hint\" data-i18n=\"options_export_hidden_hint\">Выключено: в файл попадают только вопросы и ответы, без размышлений и инъекций соседних расширений (DeepSeek++, Better DeepSeek). Включено: размышления и инъекции попадают в экспорт.</span>\n        <span class=\"hint\" id=\"export-hint\" data-i18n=\"options_open_supported_site\">Откройте поддерживаемый сайт</span>\n      </div>\n\n      <div class=\"section\" id=\"archive-section\">\n        <label class=\"label\" data-i18n=\"options_archive_legend\">Архивы (первый ярус истории)</label>\n        <div class=\"input-row\">\n          <input type=\"file\" id=\"archive-file\" accept=\".json,application/json\" multiple aria-label=\"Выбрать файлы архивов\" data-i18n-aria-label=\"options_archive_file_aria\">\n        </div>\n        <div class=\"input-row\">\n          <button id=\"archive-import\" class=\"btn-export\" type=\"button\" data-i18n=\"options_archive_import\">Импортировать</button>\n          <button id=\"archive-refresh\" class=\"btn-reset\" type=\"button\" data-i18n=\"options_archive_refresh\">Обновить список</button>\n        </div>\n        <span class=\"hint\" data-i18n=\"options_archive_hint\">Локальные экспорты: Gemini Takeout (MyActivity.json), ChatGPT conversations.json,\n          Claude conversations.json, Perplexity threads. Файлы читаются в браузере (FileReader) и никуда не отправляются.\n          Архив — первый ярус: он задаёт авторитетный пол истории и даёт терминальную полноту archive-complete.</span>\n        <!-- v1.20 (M-2): статус архива — вежливый live-region -->\n        <div class=\"hint archive-status\" id=\"archive-status\" role=\"status\"></div>\n        <div class=\"archive-list\" id=\"archive-list\"></div>\n      </div>\n    </details>\n\n    <div class=\"footer\">\n      <span class=\"version\"></span>\n      <a href=\"privacy/privacy.html\" id=\"privacy-link\" target=\"_blank\" rel=\"noopener\"><span data-i18n=\"options_footer_privacy\">Политика конфиденциальности</span></a>\n      <!-- v1.19 (M-6): ссылка на руководство docs/index.html (входит в пакет расширения) -->\n      <a href=\"../docs/index.html\" id=\"help-link\" target=\"_blank\" rel=\"noopener\"><span data-i18n=\"options_footer_help\">Помощь</span></a>\n    </div>\n    </main>\n  </div>\n</body>\n<script>\n// Р—Р°РіР»СѓС€РєРё РґР»СЏ Р»РѕРіРіРµСЂР° Рё РѕС‚Р»Р°РґРѕС‡РЅС‹С… С„СѓРЅРєС†РёР№ СЂР°СЃС€РёСЂРµРЅРёСЏ\nif (typeof window.debugLog === 'undefined') {\n  window.debugLog = function(...args) {\n    console.log('[AI CM DEBUG]', ...args);\n  };\n}\nif (typeof window.__aiCmSetDebugLogs === 'undefined') {\n  window.__aiCmSetDebugLogs = function() {};\n}\n\n// Р­РјСѓР»СЏС‚РѕСЂ Chrome API РґР»СЏ Pake / Tauri\n(function() {\n  window.chrome = window.chrome || {};\n\n  var messageListeners = [];\n  var storageListeners = [];\n\n  var onMessageStub = {\n    addListener: function(fn) {\n      if (typeof fn === 'function' && !messageListeners.includes(fn)) {\n        messageListeners.push(fn);\n      }\n    },\n    removeListener: function(fn) {\n      messageListeners = messageListeners.filter(function(l) { return l !== fn; });\n    },\n    hasListener: function(fn) { return messageListeners.includes(fn); }\n  };\n\n  var onChangedStub = {\n    addListener: function(fn) {\n      if (typeof fn === 'function' && !storageListeners.includes(fn)) {\n        storageListeners.push(fn);\n      }\n    },\n    removeListener: function(fn) {\n      storageListeners = storageListeners.filter(function(l) { return l !== fn; });\n    }\n  };\n\n  function createEventStub() {\n    return {\n      addListener: function() {},\n      removeListener: function() {},\n      hasListener: function() { return false; },\n      dispatch: function() {}\n    };\n  }\n\n  // Runtime API\n  window.chrome.runtime = window.chrome.runtime || {};\n  window.chrome.runtime.id = 'pake-ai-context-monitor';\n  window.chrome.runtime.getURL = window.chrome.runtime.getURL || function(path) { return path; };\n  window.chrome.runtime.getManifest = window.chrome.runtime.getManifest || function() {\n    return { version: '2.2.0', manifest_version: 3, name: 'AI Context Monitor' };\n  };\n  window.chrome.runtime.onMessage = onMessageStub;\n  window.chrome.runtime.onInstalled = createEventStub();\n  window.chrome.runtime.onStartup = createEventStub();\n  window.chrome.runtime.lastError = null;\n\n  // РћС‚РїСЂР°РІРєР° СЃРѕРѕР±С‰РµРЅРёР№ РјРµР¶РґСѓ С„РѕРЅРѕРІС‹Рј СЃРµСЂРІРёСЃРѕРј Рё СЃС‚СЂР°РЅРёС†РµР№\n  window.chrome.runtime.sendMessage = function(message, callback) {\n    return new Promise(function(resolve) {\n      var responded = false;\n      var sender = { id: 'pake-ai-context-monitor', tab: { id: 1 } };\n\n      var sendResponse = function(response) {\n        if (!responded) {\n          responded = true;\n          if (callback) callback(response);\n          resolve(response);\n        }\n      };\n\n      var listeners = messageListeners.slice();\n      listeners.forEach(function(listener) {\n        try {\n          listener(message, sender, sendResponse);\n        } catch (e) {\n          console.error('[AI CM Polyfill] РћС€РёР±РєР° РѕР±СЂР°Р±РѕС‚С‡РёРєР°:', e);\n        }\n      });\n\n      if (!responded) {\n        setTimeout(function() {\n          if (!responded) {\n            responded = true;\n            if (callback) callback();\n            resolve();\n          }\n        }, 10);\n      }\n    });\n  };\n\n  // Storage API\n  window.chrome.storage = window.chrome.storage || {};\n  window.chrome.storage.onChanged = onChangedStub;\n\n  // РќР°СЃС‚СЂРѕР№РєРё РѕС‚РєСЂС‹РІР°СЋС‚СЃСЏ РІ iframe РїРѕРІРµСЂС… СЃС‚СЂР°РЅРёС†С‹ (Р°РЅР°Р»РѕРі РёРєРѕРЅРєРё СЂР°СЃС€РёСЂРµРЅРёСЏ).\n  // Р—Р°РїРёСЃСЊ РёР· iframe РґРѕР»Р¶РЅР° СЃСЂР°Р·Сѓ РґРѕС…РѕРґРёС‚СЊ РґРѕ content.js РІ СЂРѕРґРёС‚РµР»СЊСЃРєРѕРј РѕРєРЅРµ.\n  var IS_OPTIONS_FRAME = (typeof window !== 'undefined') && window.__AI_CM_OPTIONS_FRAME__ === true;\n\n  function notifyStorage(changes, area) {\n    storageListeners.forEach(function(listener) {\n      try { listener(changes, area); } catch (e) {}\n    });\n    if (IS_OPTIONS_FRAME) {\n      try { parent.postMessage({ __aiCmStorage: 1, changes: changes, area: area }, '*'); } catch (e) {}\n    }\n  }\n\n  function readStored(store, key) {\n    var raw = store.getItem('ai_cm_' + key);\n    if (raw === null) return undefined;\n    try { return JSON.parse(raw); } catch (e) { return raw; }\n  }\n\n  if (!window.chrome.storage.local) {\n    window.chrome.storage.local = {\n      get: function(keys, callback) {\n        var res = {};\n        var defaults = {\n          showWidget: true,\n          showBadge: true,\n          enabled: true\n          // ai_cm_safe_pct_<site> РќР• Р·Р°РґР°С‘Рј: РєР°Рє Рё РІ Chrome, РїРѕСЂРѕРі РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ\n          // РЅРµ Р·Р°РґР°РЅ (100% РѕРєРЅР°), РїРѕРєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃР°Рј РЅРµ РІС‹СЃС‚Р°РІРёС‚ РµРіРѕ РІ РїР°РЅРµР»Рё.\n        };\n\n        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);\n\n        keysArr.forEach(function(k) {\n          var val = readStored(localStorage, k);\n          if (val !== undefined) {\n            res[k] = val;\n          } else {\n            res[k] = defaults[k] !== undefined ? defaults[k] : true;\n          }\n        });\n\n        if (typeof keys === 'object' && !Array.isArray(keys) && keys !== null) {\n          Object.keys(keys).forEach(function(k) {\n            if (res[k] === undefined) res[k] = keys[k];\n          });\n        }\n\n        if (callback) callback(res);\n        return Promise.resolve(res);\n      },\n      set: function(obj, callback) {\n        var changes = {};\n        if (obj && typeof obj === 'object') {\n          Object.keys(obj).forEach(function(k) {\n            var oldVal = readStored(localStorage, k);\n            var newVal = obj[k];\n            localStorage.setItem('ai_cm_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);\n            changes[k] = { oldValue: oldVal, newValue: newVal };\n          });\n        }\n        notifyStorage(changes, 'local');\n        if (callback) callback();\n        return Promise.resolve();\n      },\n      remove: function(keys, callback) {\n        var arr = Array.isArray(keys) ? keys : [keys];\n        var changes = {};\n        arr.forEach(function(k) {\n          var oldVal = readStored(localStorage, k);\n          if (oldVal !== undefined) {\n            localStorage.removeItem('ai_cm_' + k);\n            changes[k] = { oldValue: oldVal, newValue: undefined };\n          }\n        });\n        if (Object.keys(changes).length) notifyStorage(changes, 'local');\n        if (callback) callback();\n        return Promise.resolve();\n      },\n      getKeys: function(callback) {\n        var keys = [];\n        try {\n          for (var i = 0; i < localStorage.length; i++) {\n            var k = localStorage.key(i);\n            if (k && k.indexOf('ai_cm_') === 0) keys.push(k.slice(6));\n          }\n        } catch (e) {}\n        if (callback) callback(keys);\n        return Promise.resolve(keys);\n      }\n    };\n  }\n\n  // session: РєР°Рє РІ Chrome вЂ” РѕС‚РґРµР»СЊРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ (BYOK-РєР»СЋС‡Рё РЅРµ РґРѕР»Р¶РЅС‹ РїРѕРїР°РґР°С‚СЊ РІ local)\n  if (!window.chrome.storage.session) {\n    window.chrome.storage.session = {\n      get: function(keys, callback) {\n        var res = {};\n        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);\n        keysArr.forEach(function(k) {\n          var val = readStored(sessionStorage, 'sess_' + k);\n          if (val !== undefined) res[k] = val;\n        });\n        if (callback) callback(res);\n        return Promise.resolve(res);\n      },\n      set: function(obj, callback) {\n        var changes = {};\n        if (obj && typeof obj === 'object') {\n          Object.keys(obj).forEach(function(k) {\n            var oldVal = readStored(sessionStorage, 'sess_' + k);\n            var newVal = obj[k];\n            sessionStorage.setItem('ai_cm_sess_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);\n            changes[k] = { oldValue: oldVal, newValue: newVal };\n          });\n        }\n        notifyStorage(changes, 'session');\n        if (callback) callback();\n        return Promise.resolve();\n      },\n      remove: function(keys, callback) {\n        var arr = Array.isArray(keys) ? keys : [keys];\n        var changes = {};\n        arr.forEach(function(k) {\n          var oldVal = readStored(sessionStorage, 'sess_' + k);\n          if (oldVal !== undefined) {\n            sessionStorage.removeItem('ai_cm_sess_' + k);\n            changes[k] = { oldValue: oldVal, newValue: undefined };\n          }\n        });\n        if (Object.keys(changes).length) notifyStorage(changes, 'session');\n        if (callback) callback();\n        return Promise.resolve();\n      }\n    };\n  }\n\n  window.chrome.storage.sync = window.chrome.storage.local;\n\n  if (!IS_OPTIONS_FRAME) {\n    try {\n      window.addEventListener('message', function(ev) {\n        var d = ev && ev.data;\n        if (!d || d.__aiCmStorage !== 1 || !d.changes) return;\n        storageListeners.forEach(function(listener) {\n          try { listener(d.changes, d.area || 'local'); } catch (e) {}\n        });\n      });\n    } catch (e) {}\n  }\n\n  // Tabs API\n  window.chrome.tabs = window.chrome.tabs || {};\n  window.chrome.tabs.query = function(q, cb) {\n    var href = (typeof location !== 'undefined' ? location.href : '');\n    var title = (typeof document !== 'undefined' ? document.title : '');\n    // РќР°СЃС‚СЂРѕР№РєРё Р¶РёРІСѓС‚ РІ srcdoc-iframe: Р°РєС‚РёРІРЅР°СЏ \"РІРєР»Р°РґРєР°\" вЂ” СЌС‚Рѕ СЂРѕРґРёС‚РµР»СЊСЃРєР°СЏ СЃС‚СЂР°РЅРёС†Р°.\n    if (IS_OPTIONS_FRAME) {\n      try { if (parent && parent.location) href = parent.location.href; } catch (e) {}\n      try { if (parent && parent.document) title = parent.document.title; } catch (e) {}\n    }\n    var tab = { id: 1, active: true, currentWindow: true, url: href, title: title };\n    if (cb) cb([tab]);\n    return Promise.resolve([tab]);\n  };\n  window.chrome.tabs.sendMessage = function(tabId, message, callback) {\n    return window.chrome.runtime.sendMessage(message, callback);\n  };\n  window.chrome.tabs.create = function(opts, cb) {\n    try { if (opts && opts.url) window.open(opts.url, '_blank'); } catch (e) {}\n    if (cb) cb();\n  };\n  window.chrome.tabs.onUpdated = createEventStub();\n  window.chrome.tabs.onActivated = createEventStub();\n\n  window.chrome.action = window.chrome.action || {\n    setIcon: function() {}, setBadgeText: function() {}, setBadgeBackgroundColor: function() {}\n  };\n})();\n\n\n</script>\n<script>\n(()=>{var Bt=Object.defineProperty;var qn=Object.getOwnPropertyDescriptor;var Xn=Object.getOwnPropertyNames;var Yn=Object.prototype.hasOwnProperty;var tt=(e=>typeof require<\"u\"?require:typeof Proxy<\"u\"?new Proxy(e,{get:(t,r)=>(typeof require<\"u\"?require:t)[r]}):e)(function(e){if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+e+'\" is not supported')});var V=(e,t,r)=>()=>{if(r)throw r[0];try{return e&&(t=e(e=0)),t}catch(n){throw r=[n],n}};var $n=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(r){throw t=0,r}},br=(e,t)=>{for(var r in t)Bt(e,r,{get:t[r],enumerable:!0})},Jn=(e,t,r,n)=>{if(t&&typeof t==\"object\"||typeof t==\"function\")for(let i of Xn(t))!Yn.call(e,i)&&i!==r&&Bt(e,i,{get:()=>t[i],enumerable:!(n=qn(t,i))||n.enumerable});return e};var Ft=e=>Jn(Bt({},\"__esModule\",{value:!0}),e);function kr(){try{var e=typeof browser<\"u\"&&browser&&browser.runtime?browser:typeof chrome<\"u\"&&chrome&&chrome.runtime?chrome:null;return e?e.runtime&&typeof e.runtime.getURL==\"function\"?String(e.runtime.getURL(\"\")).indexOf(\"moz-extension://\")===0:typeof e.getURL==\"function\"?String(e.getURL(\"\")).indexOf(\"moz-extension://\")===0:!1:!1}catch{return!1}}var Ir=V(()=>{});function Zn(e){return e=e.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g,\"$1\"),e=e.replace(/(\\*\\*|__)/g,\"\"),e=e.replace(/(?<![*\\w])\\*([^*\\n]+)\\*(?![\\w*])/g,\"$1\"),e=e.replace(/(?<![\\w_])\\_([^_\\n]+)\\_(?![\\w_])/g,\"$1\"),e=e.replace(/`/g,\"\"),e}function Qn(e){var t=String(e??\"\");return t=t.replace(/^#{1,6}\\s+/,\"\"),t=t.replace(/^>\\s?/,\"\"),t=t.replace(/^[-*+]\\s+/,\"\"),t}function ei(e){for(var t=String(e).split(`\n`),r=[],n=0;n<t.length;n++){var i=t[n],o=i.trim();/^-{3,}$/.test(o)||r.push(Zn(Qn(i)))}return r.join(`\n`)}function wr(e){for(var t=Array.isArray(e)?e:[],r=[],n=0;n<t.length;n++){var i=t[n]||{};r.push(ei(i.text==null?\"\":i.text))}return r.join(`\n\n`)}var Tr=V(()=>{});function ni(e){if(typeof e==\"string\")return e;try{var t=JSON.stringify(e);return t===void 0?String(e):(t.length>500&&(t=t.slice(0,500)+\"\\u2026\"),t)}catch{return String(e)}}function rt(e){try{Gt.push(e),Gt.length>ri&&Gt.shift()}catch{}}function Rr(e,...t){var r=Array.prototype.slice.call(arguments,1);try{var n=r.map(ni).join(\" \");rt(n)}catch{}if(e===\"error\"||e===\"warn\"){(console[e]||console.log).apply(console,r);return}var i=ti,o=e;try{typeof window<\"u\"&&window.__aiCmDebugLogs===!0&&(i=!0)}catch{}i&&(console[o]||console.log).apply(console,r)}function ii(e,t){try{if(typeof Rr!=\"function\")return;Rr(\"error\",\"[swallow][\"+(t||\"unlabeled\")+\"]\",e)}catch{}}function Ht(){try{if(typeof sessionStorage<\"u\"&&sessionStorage&&sessionStorage.getItem(\"aiCmDebug\")===\"1\")return!0}catch{}try{if(typeof window<\"u\"&&window&&window.__aiCmDebugLogs===!0)return!0}catch{}return!1}function Pr(e,t){try{var r=typeof t==\"number\"&&t>0?t:100;if(e==null)return\"(\\u043F\\u0443\\u0441\\u0442\\u043E)\";var n=String(e);if(!n)return\"(\\u043F\\u0443\\u0441\\u0442\\u043E)\";var i=n.replace(/\\s+/g,\" \").trim();return i?i.length>r?i.slice(0,r)+\"\\u2026\":i:\"(\\u043F\\u0443\\u0441\\u0442\\u043E/\\u043F\\u0440\\u043E\\u0431\\u0435\\u043B\\u044B)\"}catch{return\"(\\u043E\\u0448\\u0438\\u0431\\u043A\\u0430)\"}}function Lr(e){try{var t=String(new Error().stack||\"\");if(!t)return\"\";for(var r=t.split(`\n`),n=[],i=1+(typeof e==\"number\"&&e>=0?e:0),o=i;o<r.length&&n.length<4;o++){var a=String(r[o]||\"\").replace(/\\s+/g,\" \").trim();!a||a.indexOf(\"aiCmDiag\")!==-1||n.push(a)}return n.join(\" <- \")}catch{return\"\"}}function nt(e,t){if(!Ht())return!1;try{var r=[],n=t||{};for(var i in n)if(Object.prototype.hasOwnProperty.call(n,i)){var o=n[i];r.push(i+\"=\"+(o==null?\"(\\u043D\\u0435\\u0442)\":String(o)))}console.log(\"[AI CM][diag] \"+e+\" \"+r.join(\" \"))}catch{}return!0}function jt(e,t,r,n){if(!Ht())return!1;var i=n||{},o=\"\";try{o=String(typeof location<\"u\"&&location&&location.href||\"\")}catch{}return nt(\"download\",{trigger:e||\"(\\u043D\\u0435\\u0442)\",file:r==null||String(r)===\"\"?\"\\u043F\\u0443\\u0441\\u0442\\u043E\\u0435\":String(r),bytes100:Pr(t,100),len:t==null?0:String(t).length,mime:i.mime,url:o,threadId:i.threadId,site:i.site,reason:i.reason,src:Lr(1)})}function Wt(e,t,r,n,i){if(!Ht())return!1;var o=i||{},a=\"\";try{a=String(typeof location<\"u\"&&location&&location.href||\"\")}catch{}return nt(\"download-blocked\",{reason:n||\"(\\u043D\\u0435\\u0442)\",trigger:e||\"(\\u043D\\u0435\\u0442)\",file:r==null||String(r)===\"\"?\"\\u043F\\u0443\\u0441\\u0442\\u043E\\u0435\":String(r),bytes100:Pr(t,100),len:t==null?0:String(t).length,mime:o.mime,url:a,threadId:o.threadId,site:o.site,src:Lr(1)})}function ge(e,t){var r=t||\"unlabeled\",n=\"\";try{n=e&&e.message?String(e.message):String(e)}catch{n=\"(\\u043D\\u0435\\u0447\\u0438\\u0442\\u0430\\u0435\\u043C\\u0430\\u044F \\u043E\\u0448\\u0438\\u0431\\u043A\\u0430)\"}try{typeof rt==\"function\"&&rt(\"[swallow-soft][\"+r+\"] \"+n)}catch{return}try{if(typeof nt!=\"function\")return;nt(\"swallow-soft\",{tag:r,err:e})}catch{return}}var ti,Gt,ri,it=V(()=>{ti=!1,Gt=[],ri=200;try{typeof window<\"u\"&&(window.__aiCmSwallow=ii)}catch{}try{typeof window<\"u\"&&(window.__aiCmSwallowSoft=ge)}catch(e){rt(\"[swallow-soft-export] \"+e)}});function W(e){return typeof e==\"string\"?e.trim():\"\"}function Mr(e,t){if(!e||typeof e!=\"object\")return null;let r=e,n=W(r.name);if(!n)return null;let i={name:n},o=W(r.mime);o&&(i.mime=o);let a=typeof r.content==\"string\"?r.content:\"\";a&&(i.content=a);let s=W(r.turnId)||t||\"\";return s&&(i.turnId=s),i}function oi(e,t){if(!e||typeof e!=\"object\")return null;let r=e,n=W(r.title),i=W(r.url);if(!n&&!i)return null;let o={title:n||i};i&&(o.url=i);let a=W(r.snippet);a&&(o.snippet=a);let s=W(r.turnId)||t||\"\";return s&&(o.turnId=s),o}function ai(e){let t={artifacts:[],sources:[]};if(!e||typeof e!=\"object\")return t;let r=e,n=W(r.reasoning);n&&(t.reasoning=n);let i=W(r.turnId),o=Mr(r.artifact,i);if(o&&t.artifacts.push(o),Array.isArray(r.artifacts))for(let a=0;a<r.artifacts.length;a++){let s=Mr(r.artifacts[a],i);s&&t.artifacts.push(s)}if(Array.isArray(r.sources))for(let a=0;a<r.sources.length;a++){let s=oi(r.sources[a],i);s&&t.sources.push(s)}return t}function si(e){return e.name+\"\\0\"+(e.mime||\"\")+\"\\0\"+(e.content||\"\")+\"\\0\"+(e.turnId||\"\")}function ui(e){return e.title+\"\\0\"+(e.url||\"\")+\"\\0\"+(e.snippet||\"\")+\"\\0\"+(e.turnId||\"\")}function ot(e){let t={artifacts:[],sources:[],reasoningCount:0},r={},n={},i=Array.isArray(e)?e:[];for(let o=0;o<i.length;o++){let a=ai(i[o]);a.reasoning&&t.reasoningCount++;for(let s=0;s<a.artifacts.length;s++){let u=si(a.artifacts[s]);r[u]||(r[u]=!0,t.artifacts.push(a.artifacts[s]))}for(let s=0;s<a.sources.length;s++){let u=ui(a.sources[s]);n[u]||(n[u]=!0,t.sources.push(a.sources[s]))}}return t}var Or=V(()=>{});function ie(e,t,r){try{if(typeof chrome<\"u\"&&chrome.i18n&&typeof chrome.i18n.getMessage==\"function\"){var n=r?chrome.i18n.getMessage(e,r):chrome.i18n.getMessage(e);if(n)return n}}catch{}return t}function Dr(e){if(!e||typeof e!=\"object\")return\"\";var t=e.reasoning;return typeof t==\"string\"?t:\"\"}function Ut(e,t){var r=typeof e==\"string\"?e:\"\",n=typeof t==\"string\"?t:\"\";return!n||r.indexOf(n)!==-1?r:ci+`\n`+n+`\n\n`+li+`\n`+r}function Vt(e){return!e||typeof e!=\"object\"?\"\":Ut(e.text,Dr(e))}function Nr(e,t){var r=Dr(e);return r||(t!==!0||!e||typeof e!=\"object\"?\"\":typeof e.hiddenReasoning==\"string\"?e.hiddenReasoning:\"\")}function Kt(e,t){return Ut(Pe(e),Nr(e,t))}function zt(e){try{var t=String(e&&e.site||\"\").toLowerCase();return Br.indexOf(t)!==-1}catch{return!1}}function Fr(e){return e===\"user\"?\"USER:\":\"ASSISTANT:\"}function Gr(e){return e===\"user\"?\"### USER\":\"### ASSISTANT\"}function Pe(e){return!e||typeof e!=\"object\"?\"\":typeof e.text==\"string\"&&e.text?e.text:typeof e.content==\"string\"?e.content:typeof e.text==\"string\"?e.text:\"\"}function qt(e){for(var t=Array.isArray(e)?e:[],r=[],n=0;n<t.length;n++)r.push(Pe(t[n]));for(var i=[],o=0;o<t.length;o++){var a=r[o],s=0,u=0,c=0;if(a)for(var l=0;l<r.length;l++){var f=r[l];l===o||!f||f.length>=a.length||a.indexOf(f)!==-1&&(s++,u+=f.length,f.length>c&&(c=f.length))}var d=s>=Hr&&u>=jr*a.length&&a.length>=2*c;d||i.push(t[o])}return i}function Wr(e,t){if(!st())return!1;try{var r=Array.isArray(e)?e.length:-1,n=typeof t==\"number\"?t:r,i=Array.isArray(e)&&e.length>0?e[0]:null,o=Pe(i),a=\"\\u043D\\u0435\\u0442\";i&&typeof i==\"object\"&&(typeof i.text==\"string\"?a=\"text\":typeof i.content==\"string\"&&(a=\"content\")),console.log(Xt+\" txt-roles site=qwen isArray=\"+Array.isArray(e)+\" msgs=\"+n+\" kept=\"+r+\" dropped-containers=\"+(r>=0&&n>=r?n-r:0)+\" first.role=\"+(i&&i.role!==void 0&&i.role!==null?String(i.role):\"(\\u043D\\u0435\\u0442)\")+\" first.kind=\"+a+\" first.len=\"+o.length+\" first.head=\"+(ut(o,60)||\"\\u043F\\u0443\\u0441\\u0442\\u043E\"))}catch{}return!0}function Ur(e){return wr(e)}function fi(e){for(var t=Array.isArray(e)?e:[],r=[],n=0;n<t.length;n++){var i=t[n]||{},o=Ur([{role:i.role,text:Pe(i)}]);if(o===null)return null;String(o).trim()&&r.push(Fr(i.role)+`\n`+o)}return r.join(`\n\n`)}function at(e){return e.bodyProjection===\"projected\"}function di(e){var t=e.name+(e.mime?\" (\"+e.mime+\")\":\"\");return e.content?t+`\n`+e.content:t}function pi(e){var t=\"### \"+e.name+(e.mime?\" (\"+e.mime+\")\":\"\");return e.content?t+`\n\n`+e.content:t}function gi(e){var t=\"- \"+e.title;return e.url&&(t+=\" \\u2014 \"+e.url),e.snippet&&(t+=\" \\u2014 \"+e.snippet),t}function mi(e){var t=\"- \";return t+=e.url?\"[\"+e.title+\"](\"+e.url+\")\":e.title,e.snippet&&(t+=\" \\u2014 \"+e.snippet),t}function hi(e){var t=[];return e.artifacts.length&&t.push(`[ARTIFACTS]\n`+e.artifacts.map(di).join(`\n\n`)),e.sources.length&&t.push(`[SOURCES]\n`+e.sources.map(gi).join(`\n`)),t.join(`\n\n`)}function vi(e){var t=[];return e.artifacts.length&&t.push(`## ARTIFACTS\n\n`+e.artifacts.map(pi).join(`\n\n`)),e.sources.length&&t.push(`## SOURCES\n\n`+e.sources.map(mi).join(`\n`)),t.join(`\n\n`)}function yi(e){var t=e||{},r=typeof t.site==\"string\"?t.site:\"\",n=e&&Array.isArray(e.messages)?e.messages:[],i=zt(e),o=i?qt(n):n,a=o.map(function(l){var f=i?Kt(l,!0):Vt(l);if(!l||typeof l!=\"object\"||f===l.text)return l;var d={};for(var p in l)Object.prototype.hasOwnProperty.call(l,p)&&(d[p]=l[p]);return d.text=f,d}),s;i?(Wr(a,n.length),s=fi(a)):s=Ur(a);var u=\"\";r===\"gemini\"&&t.sourceTier&&(u=t.sourceTier+`\n\n`),at(t)&&(u+=`[AI-CM projection: applied]\n\n`),u&&s&&(s=u+s);var c=hi(ot(Array.isArray(n)?n:[]));return s&&c&&(s=s+`\n\n`+c),s===null?\"\":s}function xi(e){var t=e||{},r=[];return typeof t.windowLimit==\"number\"&&t.windowLimit>0&&r.push(\"model-window: \"+t.windowLimit),typeof t.displayLimit==\"number\"&&t.displayLimit>0&&r.push(\"display-limit: \"+t.displayLimit),t.accountLimit===null?r.push(\"account-limit: unknown\"):typeof t.accountLimit==\"number\"&&t.accountLimit>0&&r.push(\"account-limit: \"+t.accountLimit),typeof t.limitPlan==\"string\"&&t.limitPlan&&r.push(\"limit-plan: \"+t.limitPlan),Array.isArray(t.limitWarnings)&&t.limitWarnings.length&&r.push(\"limit-warnings: \"+t.limitWarnings.join(\",\")),r}function Ci(e){var t=e||{},r=typeof t.tokens==\"number\"?t.tokens:0,n=typeof t.limit==\"number\"?t.limit:0,i=typeof t.percent==\"number\"?t.percent:0;if(t.saturated===!0)i=100;else if(n>0){var o=Math.round(r/n*1e3)/10;o!==i&&(i=o)}return{tokens:r,limit:n,percent:i}}function Ai(e,t){var r=e||{},n=typeof r.site==\"string\"?r.site:\"\",i=[];i.push(ie(\"export_md_title\",\"# AI Context Monitor \\u2014 \\u044D\\u043A\\u0441\\u043F\\u043E\\u0440\\u0442 \\u0438\\u0441\\u0442\\u043E\\u0440\\u0438\\u0438\")),i.push(\"\"),i.push(ie(\"export_md_platform\",\"\\u041F\\u043B\\u0430\\u0442\\u0444\\u043E\\u0440\\u043C\\u0430: \"+(t||\"AI Chat\"),[t||\"AI Chat\"])),i.push(ie(\"export_md_model\",\"\\u041C\\u043E\\u0434\\u0435\\u043B\\u044C: \"+(r.model||\"\\u2014\"),[r.model||\"\\u2014\"]));var o=new Date().toISOString();i.push(ie(\"export_md_date\",\"\\u0414\\u0430\\u0442\\u0430 \\u044D\\u043A\\u0441\\u043F\\u043E\\u0440\\u0442\\u0430: \"+o,[o]));var a=Ci(r),s=a.tokens,u=a.limit,c=a.percent;s===0&&u===0?i.push(\"\\u0422\\u043E\\u043A\\u0435\\u043D\\u044B: \\u043D/\\u0434 (\"+c+\"%)\"):i.push(ie(\"export_md_tokens\",\"\\u0422\\u043E\\u043A\\u0435\\u043D\\u044B: \"+s+\" / \"+u+\" (\"+c+\"%)\",[String(s),String(u),String(c)]));for(var l=xi(r),f=0;f<l.length;f++)i.push(l[f]);r.saturated===!0&&i.push(\"context-saturated: 1\"),typeof r.src==\"string\"&&r.src&&(i.push(\"metric-src: \"+r.src),at(r)&&i.push(\"[AI-CM projection: applied]\")),r.partial===!0&&(i.push(\"metric-partial: 1\"),i.push(\"metric-partial-reason: \"+(r.partialReason||\"incomplete\"))),i.push(\"\"),at(r)&&!(typeof r.src==\"string\"&&r.src)&&i.push(\"[AI-CM projection: applied]\"),n===\"gemini\"&&r.sourceTier&&i.push(r.sourceTier,\"\");var d=zt(r),p=Array.isArray(r.messages)?r.messages:[];d&&(p=qt(p));for(var m=0;m<p.length;m++){var h=p[m]||{};typeof aiCmDiagLine==\"function\"&&aiCmDiagLine(\"claude-role-builder\",{msgRole:h.role,mdMarked:d});var A=d?Gr(h.role):h.role===\"user\"||h.role===\"human\"?ie(\"export_md_role_user\",\"## \\u041F\\u043E\\u043B\\u044C\\u0437\\u043E\\u0432\\u0430\\u0442\\u0435\\u043B\\u044C\"):ie(\"export_md_role_assistant\",\"## \\u0410\\u0441\\u0441\\u0438\\u0441\\u0442\\u0435\\u043D\\u0442\");i.push(A),i.push(\"\"),i.push(d?Kt(h,!0):Vt(h)),i.push(\"\")}var S=p.length>0?vi(ot(p)):\"\";return S&&i.push(S),i.join(`\n`)}function Si(e){for(var t=Array.isArray(e)?e:[],r=!1,n=0;n<t.length;n++){var i=t[n];if(i&&typeof i==\"object\"&&(Object.prototype.hasOwnProperty.call(i,\"sources\")||Object.prototype.hasOwnProperty.call(i,\"artifact\")||Object.prototype.hasOwnProperty.call(i,\"artifacts\"))){r=!0;break}}if(!r)return t;for(var o=[],a=0;a<t.length;a++){var s=t[a];if(!s||typeof s!=\"object\"){o.push(s);continue}var u=Object.assign({},s);delete u.sources,delete u.artifact,delete u.artifacts,o.push(u)}return o}function _i(e,t){var r=e||{},n=ot(Array.isArray(r.messages)?r.messages:[]);return JSON.stringify({platform:t||\"AI Chat\",model:r.model||\"\",exportedAt:new Date().toISOString(),tokens:typeof r.tokens==\"number\"?r.tokens:0,limit:typeof r.limit==\"number\"?r.limit:0,percent:r.saturated===!0?100:typeof r.percent==\"number\"?r.percent:0,modelWindow:r.windowLimit,displayLimit:r.displayLimit,accountLimit:r.accountLimit,limitPlan:r.limitPlan,limitWarnings:Array.isArray(r.limitWarnings)&&r.limitWarnings.length?r.limitWarnings:void 0,saturated:r.saturated===!0?!0:void 0,src:r.src,sourceTier:r.sourceTier,partial:r.partial===!0?!0:void 0,partialReason:r.partial===!0?r.partialReason||\"incomplete\":void 0,bodyProjection:at(r)?!0:void 0,dedupe:r.dedupe,messages:Si(r.messages),artifacts:n.artifacts.length?n.artifacts:void 0,sources:n.sources.length?n.sources:void 0},null,2)}function st(){try{if(typeof sessionStorage<\"u\"&&sessionStorage&&sessionStorage.getItem(\"aiCmDebug\")===\"1\")return!0}catch{}try{var e=globalThis;if(e&&e.__aiCmDebugLogs===!0)return!0}catch{}return!1}function ut(e,t){try{var r=typeof t==\"number\"&&t>0?t:100;if(e==null)return\"\";var n=String(e);if(!n)return\"\";var i=n.replace(/\\s+/g,\" \").trim();return i?i.length>r?i.slice(0,r)+\"\\u2026\":i:\"\"}catch{return\"\"}}function Vr(){try{for(var e=String(new Error().stack||\"\").split(`\n`),t=[],r=1;r<e.length&&t.length<4;r++){var n=String(e[r]||\"\").replace(/\\s+/g,\" \").trim();!n||n.indexOf(\"diag\")!==-1||t.push(n)}return t.join(\" <- \")}catch{return\"\"}}function Kr(e,t,r,n){try{if(typeof jt==\"function\")return jt(e,t,r,n)}catch{}if(!st())return!1;try{var i=n||{},o=\"\";try{o=String(typeof location<\"u\"&&location&&location.href||\"\")}catch{}console.log(Xt+\" download trigger=\"+(e||\"(\\u043D\\u0435\\u0442)\")+\" file=\"+(r==null||String(r)===\"\"?\"\\u043F\\u0443\\u0441\\u0442\\u043E\\u0435\":String(r))+\" bytes100=\"+(ut(t,100)||\"\\u043F\\u0443\\u0441\\u0442\\u043E\")+\" len=\"+(t==null?0:String(t).length)+\" mime=\"+(i.mime===void 0?\"(\\u043D\\u0435\\u0442)\":i.mime)+\" url=\"+o+\" threadId=\"+(i.threadId===void 0||i.threadId===\"\"?\"(\\u043D\\u0435\\u0442)\":i.threadId)+\" site=\"+(i.site===void 0?\"\":i.site)+\" reason=\"+(i.reason===void 0?\"\":i.reason)+\" src=\"+Vr())}catch{}return!0}function bi(e){try{if(e==null)return!1;var t=String(e);return t.length<Ei?!1:t.charCodeAt(0)===41&&t.charCodeAt(1)===93&&t.charCodeAt(2)===125&&t.charCodeAt(3)===39}catch{return!1}}function zr(e,t){return bi(e)?\"xssi-prefix\":t==null||String(t).trim()===\"\"?\"empty-name\":null}function qr(e,t,r,n,i){try{if(typeof Wt==\"function\")return Wt(e,t,r,n,i)}catch{}if(!st())return!1;try{var o=i||{},a=\"\";try{a=String(typeof location<\"u\"&&location&&location.href||\"\")}catch{}console.log(Xt+\" download-blocked reason=\"+(n||\"(\\u043D\\u0435\\u0442)\")+\" trigger=\"+(e||\"(\\u043D\\u0435\\u0442)\")+\" file=\"+(r==null||String(r)===\"\"?\"\\u043F\\u0443\\u0441\\u0442\\u043E\\u0435\":String(r))+\" bytes100=\"+(ut(t,100)||\"\\u043F\\u0443\\u0441\\u0442\\u043E\")+\" len=\"+(t==null?0:String(t).length)+\" mime=\"+(o.mime===void 0?\"(\\u043D\\u0435\\u0442)\":o.mime)+\" url=\"+a+\" threadId=\"+(o.threadId===void 0||o.threadId===\"\"?\"(\\u043D\\u0435\\u0442)\":o.threadId)+\" site=\"+(o.site===void 0?\"\":o.site)+\" src=\"+Vr())}catch{}return!0}function ki(e,t,r,n,i){var o=i||{},a=zr(e,t);if(a){try{qr(n||\"builder-download\",e,t,a,{mime:r,threadId:o.threadId,site:o.site})}catch{}return!1}try{Kr(n||\"builder-download\",e,t,{mime:r,threadId:o.threadId,site:o.site,reason:o.reason})}catch{}try{var s=new Blob([e],{type:r}),u=URL.createObjectURL(s),c=document.createElement(\"a\");c.href=u,c.download=t,document.body.appendChild(c),c.click(),c.remove(),setTimeout(function(){URL.revokeObjectURL(u)},1e3)}catch(l){console.warn(\"[export] \\u043D\\u0435 \\u0443\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u0441\\u043A\\u0430\\u0447\\u0430\\u0442\\u044C \\u0444\\u0430\\u0439\\u043B:\",l)}return!0}var ci,li,Br,Hr,jr,Xt,Ei,Ii,G,Xr=V(()=>{Tr();it();Or();ci=\"[REASONING]\",li=\"[ANSWER]\";Br=[\"qwen\"];Hr=2,jr=.8;Xt=\"[AI CM][diag]\";Ei=4;Ii={buildTxtFromHistory:yi,buildMdFromHistory:Ai,buildJsonFromHistory:_i,downloadBlob:ki,aiCmDownloadBlockReason:zr,aiCmDiagDownloadBlocked:qr,aiCmDiagOn:st,aiCmDiagHead:ut,aiCmDiagDownload:Kr,aiCmMessageTextWithReasoning:Vt,aiCmWithReasoningSections:Ut,aiCmReasoningOfMessageForExport:Nr,aiCmMarkersMessageTextWithReasoning:Kt,aiCmTxtRoleMarker:Fr,aiCmIsTxtRoleMarkerHistory:zt,aiCmTxtRoleMarkerSites:Br,aiCmMdRoleMarker:Gr,aiCmMessageTextForMarkers:Pe,aiCmDropContainerMessages:qt,aiCmDiagTxtRoleStructure:Wr,aiCmContainerRules:{minContained:Hr,coverMin:jr}},G=Ii});var Yt={};br(Yt,{getConvIdFromPath:()=>wi,orderChatGPTMapping:()=>ct,parseChatGPTConversation:()=>Pi,sanitizeChatGPTText:()=>Le,shouldResetChatConversation:()=>Ti,shouldResetConversationOnNav:()=>Ri});function wi(e){try{var t=String(e||\"\").match(/\\/c\\/([A-Za-z0-9_-]+)/);return t?t[1]:\"\"}catch{return\"\"}}function Ti(e,t){return t?e!==t:!1}function Ri(e,t){var r=e==null?\"\":String(e),n=t==null?\"\":String(t);return r!==n}function Le(e){return typeof e!=\"string\"?e:String(e).replace(/\\uE200entity\\uE202([^\\uE200\\uE201]*?)\\uE201/g,function(t,r){try{var n=JSON.parse(r);if(Array.isArray(n)&&n.length>1&&typeof n[1]==\"string\"&&n[1])return n[1]}catch(a){ge(a,\"chatgpt-utils:sanitizeChatGPTText-entity\")}try{var i=String(r).match(/\"([^\"]+)\"/g);if(i&&i.length>1){var o=i[1].replace(/^\"|\"$/g,\"\");if(o)return o}}catch{}return\"\"}).replace(/\\uE200(?:cite|image_group)\\uE202[^\\uE200\\uE201]*?\\uE201/g,\"\").replace(/[\\uE000-\\uF8FF]/g,\"\").replace(/\\[entity\\](?:\\[[^\\]]*\\])+/g,\"\").replace(/\\[entity\\]/g,\"\").replace(/\\[cite:[^\\]]*\\]/g,\"\").replace(/fileciteturn\\d+file\\d+L\\d+-L\\d+/g,\"\").replace(/[ \\t]{2,}/g,\" \")}function ct(e){var t=Object.keys(e||{});if(!t.length)return[];for(var r={},n=0;n<t.length;n++){var i=t[n],o=e[i],a=o&&o.id!=null?String(o.id):i;r[a]=i}for(var s=!1,u=!1,c=0;c<t.length;c++){var l=e[t[c]];l&&l.parent!==void 0&&(s=!0),l&&Array.isArray(l.children)&&l.children.length&&(u=!0)}for(var f={},d=0;d<t.length;d++)f[t[d]]=[];for(var p=[],m=0;m<t.length;m++){var h=t[m],A=e[h],S=A&&A.parent!=null?String(A.parent):null,T=S?r[S]||S:null;T?f[T]&&f[T].push(h):s&&p.push(h)}if(!s)if(u){for(var w={},j=0;j<t.length;j++){var R=e[t[j]];if(R&&Array.isArray(R.children))for(var P=0;P<R.children.length;P++){var $=String(R.children[P]);w[r[$]||$]=!0}}p=t.filter(function(v){return!w[v]}),p.length||(p=[t[0]])}else return t.slice().sort(function(v,E){var L=e[v]&&e[v].message&&e[v].message.create_time||0,M=e[E]&&e[E].message&&e[E].message.create_time||0;return L-M});p.sort(function(v,E){var L=e[v]&&e[v].message&&e[v].message.create_time||0,M=e[E]&&e[E].message&&e[E].message.create_time||0;return L-M});var J=[],le={};function fe(v){if(!(!v||le[v]||e[v]===void 0)){le[v]=!0,J.push(v);var E=f[v]||[];e[v]&&Array.isArray(e[v].children)&&e[v].children.length&&(E=e[v].children.map(function(M){return r[String(M)]||String(M)}));for(var L=0;L<E.length;L++)fe(E[L])}}for(var Z=0;Z<p.length;Z++)fe(p[Z]);for(var Q=0;Q<t.length;Q++)le[t[Q]]||J.push(t[Q]);return J}function Pi(e){var t=[],r=\"\",n=0;try{if(!e||typeof e!=\"object\")return{messages:[],model:Yr,tokens:0};e.model_slug&&(r=e.model_slug),typeof e.tokens==\"number\"&&(n=e.tokens);for(var i=e.mapping||{},o=ct(i),a=0;a<o.length;a++){var s=i[o[a]],u=s&&s.message;if(!(!u||!u.content)){var c=u.author&&u.author.role;if(!(c===\"system\"||c===\"tool\")){var l=u.metadata||{};if(!(l.is_tool===!0||l.tool_name||l.tool_call_id)){var f=u.content&&typeof u.content.content_type==\"string\"?u.content.content_type:\"\";if(!(f===\"tool_result\"||f===\"tool_use\"||f===\"function_call\"||f===\"function_result\")){for(var d=u.content.parts||[],p=[],m=0;m<d.length;m++)typeof d[m]==\"string\"?p.push(Le(d[m])):d[m]&&typeof d[m]==\"object\"&&typeof d[m].text==\"string\"&&p.push(Le(d[m].text));var h=p.join(`\n`).trim();h&&t.push({role:c===\"assistant\"?\"assistant\":\"user\",content:h})}}}}}}catch(A){ge(A,\"chatgpt-utils:parseChatGPTConversation\")}return r||(r=Yr),{messages:t,model:r,tokens:n}}var Yr,lt=V(()=>{it();Yr=\"gpt-4o\"});var $r={};br($r,{parsePerplexityThread:()=>$t,stripPerplexityHistoryTruncation:()=>Li});function $t(e){function t(y,O){if(!(!y||typeof y!=\"object\")){for(var pe=y,ne=Object.keys(pe),D=0;D<ne.length;D++)if(ne[D].trim()===O)return pe[ne[D]]}}function r(y){return typeof y!=\"string\"||!y?!1:y.indexOf(\"ppl-ai-file-upload\")!==-1&&y.indexOf(\"/attachments/\")!==-1}function n(y){if(!r(y))return!1;var O=String(y).split(\"#\")[0].split(\"?\")[0];return/\\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i.test(O)}function i(y){return String(y).split(\"#\")[0].split(\"?\")[0]}function o(y){var O=[],pe=t(y,\"attachments\");if(!Array.isArray(pe))return O;for(var ne=0;ne<pe.length;ne++){var D=pe[ne],et=\"\";if(typeof D==\"string\"?et=D:D&&typeof D==\"object\"&&(et=t(D,\"url\")||t(D,\"src\")||\"\"),!!n(et)){var Er=i(et);O.indexOf(Er)===-1&&O.push(Er)}}return O}function a(y){var O=String(y||\"\").split(\"/\");return O[O.length-1]||\"\"}var s=\"\",u=[],c=[],l=0,f=\"\",d=[];try{var p=t(e,\"entries\");Array.isArray(p)||(p=[]);for(var m=0;m<p.length;m++){var h=p[m];if(!(!h||typeof h!=\"object\")){var A=t(h,\"query_str\")||\"\",S=t(h,\"display_model\")||\"\",T=t(h,\"user_selected_model\")||\"\",w=t(h,\"thread_url_slug\")||\"\",j=S||T||\"\";j&&(s=j);var R=w||\"entry\"+m,P=o(h);if(A&&typeof A==\"string\"&&A.trim()){for(var $=A.trim(),J=0;J<P.length;J++)$+=`\n[Image: `+P[J]+\"]\";u.push($),c.push(R+\"_user\"),l++,f=$,d.push({role:\"user\",text:$})}for(var le=[],fe=0;fe<P.length;fe++)le.push(a(P[fe]));var Z=t(h,\"blocks\"),Q=!1;if(Array.isArray(Z)){for(var v=[],E=[],L=0;L<Z.length;L++){var M=Z[L];if(!(!M||typeof M!=\"object\")){var St=t(M,\"workflow_block\");if(St&&typeof St==\"object\"){var _t=t(St,\"steps\");if(Array.isArray(_t))for(var Et=0;Et<_t.length;Et++){var bt=_t[Et];if(!(!bt||typeof bt!=\"object\")){var kt=t(bt,\"items\");if(Array.isArray(kt))for(var It=0;It<kt.length;It++){var $e=kt[It];if(!(!$e||typeof $e!=\"object\")&&t($e,\"type\")===\"WORKFLOW_ITEM_TEXT\"){var wt=t($e,\"payload\");if(wt&&typeof wt==\"object\"){var Tt=t(wt,\"text_payload\");if(Tt&&typeof Tt==\"object\"){var Rt=t(Tt,\"text\");typeof Rt==\"string\"&&Rt.trim()&&v.push(Rt.trim())}}}}}}}var Pt=t(M,\"web_result_block\");if(Pt&&typeof Pt==\"object\"){var Lt=t(Pt,\"web_results\");if(Array.isArray(Lt))for(var Mt=0;Mt<Lt.length;Mt++){var ke=Lt[Mt];if(!(!ke||typeof ke!=\"object\")){var Je=t(ke,\"name\")||\"\",Ot=t(ke,\"snippet\")||\"\",Ze=t(ke,\"url\");if(!r(Ze)&&!(!Ze&&Je&&!Ot&&le.indexOf(a(String(Je)))!==-1)){var ee={};Je&&(ee.title=Je),Ze&&(ee.url=Ze),Ot&&(ee.snippet=Ot),(ee.title||ee.url||ee.snippet)&&E.push(ee)}}}}}}if(v.length>0||E.length>0){var Ie=v.join(`\n`).trim();if(Ie||E.length>0){Ie&&(u.push(Ie),c.push(R+\"_assistant\"),l++,f=Ie);var Cr={role:\"assistant\",text:Ie};E.length>0&&(Cr.sources=E),d.push(Cr),Q=!0}}}if(!Q){var Dt=t(h,\"text\");if(typeof Dt==\"string\"&&Dt.trim()){var te=null;try{te=JSON.parse(Dt)}catch{te=null}var we=null;if(Array.isArray(te))we=te;else if(te&&typeof te==\"object\"){var Ar=te;we=Object.keys(Ar).map(function(y){return Ar[y]})}var F=\"\";if(we)for(var Nt=0;Nt<we.length;Nt++){var Qe=we[Nt];if(!(!Qe||typeof Qe!=\"object\")&&t(Qe,\"step_type\")===\"FINAL\"){var Te=t(Qe,\"content\"),Re=null;if(typeof Te==\"string\")try{Re=JSON.parse(Te)}catch{Re=null}else Te&&typeof Te==\"object\"&&(Re=Te);if(Re){var de=t(Re,\"answer\");if(typeof de==\"string\"&&de.trim()){var re=null;try{re=JSON.parse(de)}catch{re=null}if(re&&typeof re==\"object\"){var Sr=t(re,\"answer\");typeof Sr==\"string\"&&(F=Sr)}else typeof re==\"string\"&&(F=re)}else if(de&&typeof de==\"object\"){var _r=t(de,\"answer\");typeof _r==\"string\"&&(F=_r)}if(F)break}}}F=F.trim(),F&&(u.push(F),c.push(R+\"_assistant\"),l++,f=F,d.push({role:\"assistant\",text:F}))}}}}}catch(y){ge(y,\"perplexity-utils:parsePerplexityThread\")}return{text:u.join(`\n`),count:l,lastText:f,modelSlug:s,pieces:u,ids:c,messages:d,model:s}}function Li(e){var t=String(e||\"\");if(!t)return t;var r=\"\",n=t.indexOf(\"#\");n!==-1&&(r=t.slice(n),t=t.slice(0,n));var i=t.indexOf(\"?\");if(i===-1)return t+r;for(var o=t.slice(0,i),a=t.slice(i+1).split(\"&\"),s=[],u=0;u<a.length;u++)if(a[u]){var c=a[u].split(\"=\")[0];c===\"limit\"||c===\"offset\"||c===\"from_first\"||s.push(a[u])}return o+(s.length?\"?\"+s.join(\"&\"):\"\")+r}var Jt=V(()=>{it()});function Oi(e){return Jr+String(e??\"\")}function Di(e){return Zr+String(e??\"\")}function _(e){return typeof e!=\"string\"?\"\":e.replace(/\\r\\n?/g,`\n`).replace(/[ \\t]+$/gm,\"\").trim()}function Me(e){return String(e??\"\").replace(/\\s+/g,\" \").trim()}function nn(e){for(var t=String(e??\"\"),r=5381,n=0;n<t.length;n++)r=(r<<5)+r+t.charCodeAt(n)|0;for(var i=(r>>>0).toString(16);i.length<6;)i=\"0\"+i;return i.slice(-6)}function Oe(e){var t=Me(e).toLowerCase();return t===\"user\"||t===\"human\"||t===\"me\"||t===\"prompt\"||t===\"you\"?\"user\":t===\"assistant\"||t===\"model\"||t===\"bot\"||t===\"ai\"||t===\"gpt\"||t===\"gemini\"||t===\"claude\"?\"assistant\":\"\"}function K(e){if(typeof e==\"number\"&&isFinite(e))return e>1e12?Math.round(e):Math.round(e*1e3);if(typeof e==\"string\"&&e){var t=Date.parse(e);if(!isNaN(t))return t;var r=e.replace(/(\\.\\d{3})\\d+/,\"$1\");if(r!==e&&(t=Date.parse(r),!isNaN(t)))return t}return 0}function De(e){return Array.isArray(e)?e:!e||typeof e!=\"object\"?[]:Array.isArray(e.conversations)?e.conversations:[e]}function Ni(e){if(e&&typeof e.orderChatGPTMapping==\"function\")return e.orderChatGPTMapping;try{if(typeof tt==\"function\"){var t=(lt(),Ft(Yt));if(t&&typeof t.orderChatGPTMapping==\"function\")return t.orderChatGPTMapping}}catch{}try{if(typeof window<\"u\"&&window.ChatGPTConversationParser&&typeof window.ChatGPTConversationParser.orderChatGPTMapping==\"function\")return window.ChatGPTConversationParser.orderChatGPTMapping}catch{}return null}function Bi(e){if(e&&typeof e.sanitizeChatGPTText==\"function\")return e.sanitizeChatGPTText;try{if(typeof tt==\"function\"){var t=(lt(),Ft(Yt));if(t&&typeof t.sanitizeChatGPTText==\"function\")return t.sanitizeChatGPTText}}catch{}try{if(typeof window<\"u\"&&window.ChatGPTConversationParser&&typeof window.ChatGPTConversationParser.sanitizeChatGPTText==\"function\")return window.ChatGPTConversationParser.sanitizeChatGPTText}catch{}return function(r){return r}}function Fi(e){if(e&&typeof e.parsePerplexityThread==\"function\")return e.parsePerplexityThread;try{if(typeof tt==\"function\"){var t=(Jt(),Ft($r));if(t&&typeof t.parsePerplexityThread==\"function\")return t.parsePerplexityThread}}catch{}try{if(typeof window<\"u\"&&typeof window.parsePerplexityThread==\"function\")return window.parsePerplexityThread}catch{}return null}function on(e,t){if(!e||typeof e!=\"object\")return null;var r=Oe(e.role!=null?e.role:e.sender);if(!r)return null;var n=_(e.text!=null?e.text:e.content);return n?{id:typeof e.id==\"string\"&&e.id?e.id:\"a:\"+(t||0)+\":\"+nn(r+\"\\0\"+n),role:r,text:n,ts:typeof e.ts==\"number\"&&isFinite(e.ts)?e.ts:K(e.created_at!=null?e.created_at:e.time)}:null}function Ne(e){for(var t=[],r=0,n=e&&Array.isArray(e.messages)?e.messages:[],i=0;i<n.length;i++){var o=on(n[i],t.length);if(o){if(t.length>=rn)break;t.push(o),r+=o.text.length}}var a=_(e&&e.title);if(!a){for(var s=0;s<t.length;s++)if(t[s].role===\"user\"){a=Me(t[s].text).slice(0,80);break}}return{convId:String(e&&e.convId||\"\"),service:e&&e.service||\"\",format:e&&e.format||\"\",title:a,updatedAt:e&&typeof e.updatedAt==\"number\"&&isFinite(e.updatedAt)?e.updatedAt:0,messages:t,count:t.length,textLen:r}}function Gi(e){if(!e||typeof e!=\"object\")return!1;var t=String(e.titleUrl||e.title_url||\"\");return/gemini\\.google\\.com\\/app\\//.test(t)?!0:Me(e.header).toLowerCase()===\"gemini apps\"}function an(e){var t=De(e);if(!t.length)return null;for(var r=Math.min(t.length,20),n=0;n<r;n++){var i=t[n];if(!(!i||typeof i!=\"object\")){if(i.mapping&&typeof i.mapping==\"object\")return x.CHATGPT_CONVERSATIONS;if(Array.isArray(i.chat_messages))return x.CLAUDE_CONVERSATIONS;if(Array.isArray(i.entries)||i.thread&&Array.isArray(i.thread.entries))return x.PERPLEXITY_THREADS;if(Gi(i))return x.GEMINI_TAKEOUT}}return null}function Zt(e){return H[e]||\"\"}function Hi(e){return!e||typeof e!=\"object\"?\"\":_(e.text!=null?e.text:e.content)}function ji(e){return Array.isArray(e.messages)?e.messages:Array.isArray(e.chat_messages)?e.chat_messages:Array.isArray(e.entries)?e.entries:[]}function sn(e){if(!e||typeof e!=\"object\"||typeof e.full!=\"string\")return null;var t=_(e.full);if(!t)return null;for(var r=ji(e),n=0,i=0;i<r.length;i++)n+=Hi(r[i]).length;return t.length<=n?null:{convId:String(e.convId||e.conversation_id||e.uuid||e.id||\"\"),code:\"full-longer-than-messages\",fullLen:t.length,msgsLen:n,over:t.length-n,msgCount:r.length}}function un(e){for(var t=De(e),r=[],n=0;n<t.length;n++){var i=sn(t[n]);i&&r.push(i)}return r}function cn(e,t){var r=t||{},n=typeof r.warn==\"function\"?r.warn:typeof console<\"u\"&&console&&typeof console.warn==\"function\"?function(s){console.warn(s)}:null,i=un(e);if(n)for(var o=0;o<i.length;o++){var a=i[o];n(\"[AI CM][archive] \\u0430\\u043D\\u043E\\u043C\\u0430\\u043B\\u0438\\u044F full>messages convId=\"+(a.convId||\"-\")+\" full=\"+a.fullLen+\" msgs=\"+a.msgsLen+\" over=\"+a.over+\" msgsCount=\"+a.msgCount)}return i}function ln(e){var t=String(e??\"\").match(/\\/app\\/(?!prompts(?:\\/|$)|new(?:\\/|$)|apikey(?:\\/|$))([A-Za-z0-9_-]+)/);return t?t[1]:\"\"}function Vi(e){var t=_(e.title!=null?e.title:e.description);return t?_(t.replace(Wi,\"\")):\"\"}function Ki(e){var t=_(e.response!=null?e.response:e.answer);if(t)return t;var r=e.details;if(!Array.isArray(r))return\"\";for(var n=0;n<r.length;n++){var i=r[n];if(!(!i||typeof i!=\"object\")&&Ui.test(Me(i.name))){var o=_(i.value);if(o)return o}}return\"\"}function fn(e){for(var t=Array.isArray(e)?e:e&&Array.isArray(e.items)?e.items:[],r=[],n={},i=0,o=0,a=0;a<t.length;a++){var s=t[a];if(!s||typeof s!=\"object\"){o++;continue}var u=ln(s.titleUrl!=null?s.titleUrl:s.title_url);if(!u){i++;continue}var c=K(s.time),l=Vi(s),f=Ki(s);if(!l&&!f){o++;continue}n[u]||(n[u]={convId:u,service:H[x.GEMINI_TAKEOUT],format:x.GEMINI_TAKEOUT,title:\"\",updatedAt:0,messages:[]},r.push(u));var d=n[u];l&&d.messages.push({role:\"user\",text:l,ts:c}),f&&d.messages.push({role:\"assistant\",text:f,ts:c}),c>d.updatedAt&&(d.updatedAt=c),!d.title&&l&&(d.title=Me(l).slice(0,80))}for(var p=[],m=0;m<r.length;m++)p.push(Ne(n[r[m]]));return{conversations:p,skippedNoConvId:i,skippedEmpty:o}}function dn(e,t){var r=Ni(t);if(!r)return{conversations:[],error:\"chatgpt-parser-unavailable\",skippedNoConvId:0,skippedEmpty:0};for(var n=Bi(t),i=De(e),o=[],a=0,s=0,u=0;u<i.length;u++){var c=i[u];if(!c||typeof c!=\"object\"||!c.mapping||typeof c.mapping!=\"object\"){s++;continue}var l=String(c.conversation_id||c.id||\"\");if(!l){a++;continue}for(var f=r(c.mapping),d=[],p=0;p<f.length;p++){var m=c.mapping[f[p]],h=m&&m.message;if(!(!h||!h.content)){var A=Oe(h.author&&h.author.role);if(A){for(var S=Array.isArray(h.content.parts)?h.content.parts:[],T=[],w=0;w<S.length;w++)if(typeof S[w]==\"string\"){var j=n(S[w]);_(j)&&T.push(_(j))}else if(S[w]&&typeof S[w]==\"object\"&&typeof S[w].text==\"string\"){var R=n(S[w].text);_(R)&&T.push(_(R))}var P=_(T.join(`\n`));P&&d.push({role:A,text:P,ts:K(h.create_time)})}}}o.push(Ne({convId:l,service:H[x.CHATGPT_CONVERSATIONS],format:x.CHATGPT_CONVERSATIONS,title:c.title,updatedAt:K(c.update_time!=null?c.update_time:c.create_time),messages:d}))}return{conversations:o,skippedNoConvId:a,skippedEmpty:s}}function zi(e){var t=[];if(Array.isArray(e.content))for(var r=0;r<e.content.length;r++){var n=e.content[r];if(!(!n||typeof n!=\"object\")&&n.type===\"text\"&&typeof n.text==\"string\"){var i=_(n.text);i&&t.push(i)}}if(!t.length){var o=_(e.text);o&&t.push(o)}return _(t.join(`\n`))}function pn(e){for(var t=De(e),r=[],n=0,i=0,o=0;o<t.length;o++){var a=t[o];if(!a||typeof a!=\"object\"||!Array.isArray(a.chat_messages)){i++;continue}var s=String(a.uuid||a.id||\"\");if(!s){n++;continue}for(var u=[],c=0;c<a.chat_messages.length;c++){var l=a.chat_messages[c];if(!(!l||typeof l!=\"object\")){var f=Oe(l.sender);if(f){var d=zi(l);d&&u.push({id:typeof l.uuid==\"string\"&&l.uuid?l.uuid:void 0,role:f,text:d,ts:K(l.created_at)})}}}var p=String(a.updated_at||a.created_at||\"\");r.push(Ne({convId:s,service:H[x.CLAUDE_CONVERSATIONS],format:x.CLAUDE_CONVERSATIONS,title:a.name||a.title,updatedAt:K(p),messages:u}))}return{conversations:r,skippedNoConvId:n,skippedEmpty:i}}function gn(e,t){var r=Fi(t);if(!r)return{conversations:[],error:\"perplexity-parser-unavailable\",skippedNoConvId:0,skippedEmpty:0};for(var n=De(e),i=[],o=0,a=0,s=0;s<n.length;s++){var u=n[s];if(!u||typeof u!=\"object\"){a++;continue}var c=u.thread&&typeof u.thread==\"object\"?u.thread:u,l=Array.isArray(u.entries)?u.entries:Array.isArray(c.entries)?c.entries:null;if(!l){a++;continue}var f=String(c.id||c.slug||u.id||u.slug||\"\");if(!f){o++;continue}for(var d=r({entries:l})||{},p=Array.isArray(d.messages)?d.messages:[],m=[],h=0;h<p.length;h++){var A=p[h];if(!(!A||typeof A!=\"object\")){var S=Oe(A.role),T=_(A.text);!S||!T||m.push({role:S,text:T,ts:0})}}i.push(Ne({convId:f,service:H[x.PERPLEXITY_THREADS],format:x.PERPLEXITY_THREADS,title:c.title||u.title,updatedAt:K(c.updated_at||u.updated_at),messages:m}))}return{conversations:i,skippedNoConvId:o,skippedEmpty:a}}function mn(e,t){cn(e,t);var r=an(e);if(!r)return{ok:!1,format:null,service:\"\",error:\"unknown-format\",conversations:[],skippedNoConvId:0,skippedEmpty:0};var n;return r===x.GEMINI_TAKEOUT?n=fn(e):r===x.CHATGPT_CONVERSATIONS?n=dn(e,t):r===x.CLAUDE_CONVERSATIONS?n=pn(e):n=gn(e,t),n.error?{ok:!1,format:r,service:Zt(r),error:n.error,conversations:[],skippedNoConvId:0,skippedEmpty:0}:{ok:!0,format:r,service:Zt(r),error:null,conversations:n.conversations||[],skippedNoConvId:n.skippedNoConvId||0,skippedEmpty:n.skippedEmpty||0}}function qi(e,t){var r=null;try{r=JSON.parse(String(e??\"\"))}catch{return{ok:!1,format:null,service:\"\",error:\"invalid-json\",conversations:[],skippedNoConvId:0,skippedEmpty:0}}return mn(r,t)}function hn(e,t){var r=Ne(e),n=t||{};return{v:Qr,convId:r.convId,service:r.service,format:r.format,title:r.title,count:r.count,textLen:r.textLen,messages:r.messages,importedAt:typeof n.importedAt==\"number\"?n.importedAt:Date.now(),fileName:String(n.fileName||\"\")}}function Xi(e,t){var r=e||{},n=t||{},i={kind:ft,service:String(r.service||\"\"),format:String(r.format||\"\"),count:typeof r.count==\"number\"?r.count:0,textLen:typeof r.textLen==\"number\"?r.textLen:0,importedAt:typeof r.importedAt==\"number\"?r.importedAt:Date.now()};return i.label=Qt(i),n.fileName&&(i.fileName=String(n.fileName)),i}function Yi(e){var t=e||{},r={kind:dt,service:String(t.service||\"\"),format:\"\",count:typeof t.count==\"number\"?t.count:0,textLen:typeof t.textLen==\"number\"?t.textLen:0,importedAt:0};return r.label=Qt(r),r}function Qt(e){if(!e||typeof e!=\"object\")return\"\\u2014\";if(e.kind===dt)return\"live (\\u0441\\u0435\\u0442\\u044C/DOM)\";if(e.kind!==ft)return\"\\u2014\";var t=me[e.format]||e.format||\"\\u0430\\u0440\\u0445\\u0438\\u0432\",r=typeof e.count==\"number\"&&e.count>0?\" \\xB7 \"+e.count+\" \\u0441\\u043E\\u043E\\u0431\\u0449.\":\"\";return\"\\u0430\\u0440\\u0445\\u0438\\u0432: \"+t+r}function $i(e){return!e||typeof e!=\"object\"?\"\":e.kind===ft?\"\\u{1F4E6} \\u0430\\u0440\\u0445\\u0438\\u0432\":e.kind===dt?\"\\u26A1 live\":\"\"}function Ji(e,t){return!e||typeof e!=\"object\"||!t?!1:String(e.convId||\"\")===String(t)}function vn(e){try{return JSON.stringify(e).length}catch{return 1/0}}function Zi(e,t){for(var r=t||{},n=typeof r.maxConversationBytes==\"number\"?r.maxConversationBytes:en,i=typeof r.maxTotalBytes==\"number\"?r.maxTotalBytes:tn,o=r.fileName||\"\",a=typeof r.importedAt==\"number\"?r.importedAt:Date.now(),s=[],u=[],c=0,l=Array.isArray(e)?e:[],f=0;f<l.length;f++){var d=l[f];if(!d||!d.convId){u.push({convId:\"\",reason:\"no-conv-id\",bytes:0});continue}if(!d.messages||!d.messages.length){u.push({convId:d.convId,reason:\"empty\",bytes:0});continue}var p=hn(d,{fileName:o,importedAt:a}),m=vn(p);if(m>n){u.push({convId:d.convId,reason:\"too-large\",bytes:m});continue}if(c+m>i){u.push({convId:d.convId,reason:\"budget-exceeded\",bytes:m});continue}c+=m,s.push(p)}return{accepted:s,skipped:u,bytes:c}}var Jr,Zr,ft,dt,Qr,x,H,me,en,tn,rn,Mi,Wi,Ui,Qi,yn,xn=V(()=>{Jr=\"aiCmArchive:\",Zr=\"aiCmConvSource:\",ft=\"archive\",dt=\"live\",Qr=1,x={GEMINI_TAKEOUT:\"gemini-takeout\",CHATGPT_CONVERSATIONS:\"chatgpt-conversations\",CLAUDE_CONVERSATIONS:\"claude-conversations\",PERPLEXITY_THREADS:\"perplexity-threads\"},H={};H[x.GEMINI_TAKEOUT]=\"gemini\";H[x.CHATGPT_CONVERSATIONS]=\"chatgpt\";H[x.CLAUDE_CONVERSATIONS]=\"claude\";H[x.PERPLEXITY_THREADS]=\"perplexity\";me={};me[x.GEMINI_TAKEOUT]=\"Gemini Takeout\";me[x.CHATGPT_CONVERSATIONS]=\"ChatGPT conversations.json\";me[x.CLAUDE_CONVERSATIONS]=\"Claude export\";me[x.PERPLEXITY_THREADS]=\"Perplexity threads\";en=2*1024*1024,tn=8*1024*1024,rn=5e3,Mi=50*1024*1024;Wi=/^(prompted|asked|you asked|said|запрос:?|вы спросили:?|запрос\\s)\\s*/i,Ui=/^(response|answer|ответ|ответ модели|model response)$/i;Qi={ARCHIVE_KEY_PREFIX:Jr,CONV_SOURCE_KEY_PREFIX:Zr,ARCHIVE_RECORD_VERSION:Qr,FORMATS:x,SERVICE_BY_FORMAT:H,FORMAT_LABEL:me,SOURCE_ARCHIVE:ft,SOURCE_LIVE:dt,MAX_CONVERSATION_BYTES:en,MAX_TOTAL_BYTES:tn,MAX_MESSAGES_PER_CONVERSATION:rn,MAX_ARCHIVE_SIZE:Mi,archiveStorageKey:Oi,convSourceStorageKey:Di,normalizeText:_,normalizeRole:Oe,normalizeMessage:on,hash6:nn,toMs:K,detectArchiveFormat:an,serviceOfFormat:Zt,detectFullTextAnomaly:sn,collectFullTextAnomalies:un,reportFullTextAnomalies:cn,extractConvIdFromUrl:ln,parseGeminiTakeout:fn,parseChatGPTArchive:dn,parseClaudeArchive:pn,parsePerplexityArchive:gn,parseArchive:mn,parseArchiveText:qi,buildArchiveRecord:hn,buildConvSourceRecord:Xi,buildLiveSourceRecord:Yi,describeSource:Qt,sourceBadge:$i,isArchiveRecordFor:Ji,recordBytes:vn,planArchiveImport:Zi},yn=Qi});var xo=$n((Fo,ce)=>{Ir();Xr();xn();Jt();lt();(function(){\"use strict\";var e=[{key:\"data-i18n\",target:\"textContent\"},{key:\"data-i18n-placeholder\",target:\"placeholder\"},{key:\"data-i18n-title\",target:\"title\"},{key:\"data-i18n-aria-label\",target:\"aria-label\"},{key:\"data-i18n-alt\",target:\"alt\"}];function t(){return typeof chrome<\"u\"&&!!chrome.i18n&&typeof chrome.i18n.getMessage==\"function\"}function r(o){try{if(t())return chrome.i18n.getMessage(o)||\"\"}catch{return\"\"}return\"\"}function n(o){var a=o||(typeof document<\"u\"?document:null);if(!a||typeof a.querySelectorAll!=\"function\")return 0;for(var s=0,u=0;u<e.length;u++)for(var c=e[u],l=a.querySelectorAll(\"[\"+c.key+\"]\"),f=0;f<l.length;f++){var d=r(l[f].getAttribute(c.key));d&&(c.target===\"textContent\"?l[f].textContent=d:l[f].setAttribute(c.target,d),s++)}return s}function i(){t()&&n(document)}typeof document<\"u\"&&(document.readyState===\"loading\"?document.addEventListener(\"DOMContentLoaded\",i):i()),typeof ce<\"u\"&&ce.exports&&(ce.exports={aiCmI18nApply:n,aiCmI18nMessage:r,aiCmI18nAvailable:t,bindings:e})})();console.log(\"AI Context Monitor: \\u041D\\u0430\\u0441\\u0442\\u0440\\u043E\\u0439\\u043A\\u0438 \\u0437\\u0430\\u0433\\u0440\\u0443\\u0436\\u0435\\u043D\\u044B\");var ur=document.getElementById(\"stat-site\"),Ln=document.getElementById(\"stat-model\"),Mn=document.getElementById(\"stat-tokens\"),vt=document.getElementById(\"stat-window\"),ye=document.getElementById(\"stat-limit\"),yt=document.getElementById(\"stat-account\"),X=document.getElementById(\"stat-percent\"),mt=document.getElementById(\"model-select\"),ve=document.getElementById(\"gemini-plan\"),N=document.getElementById(\"custom-limit\"),ht=document.getElementById(\"show-widget\"),I=document.getElementById(\"api-key\"),Be=document.getElementById(\"toggle-api-key\"),U=document.getElementById(\"exact-count\"),Cn=document.getElementById(\"exact-count-warning\"),On=kr(),An=document.querySelector(\".version\"),He=document.getElementById(\"export-md\"),je=document.getElementById(\"export-json\"),We=document.getElementById(\"export-pdf\"),Ue=document.getElementById(\"export-txt\"),pt=document.getElementById(\"export-hint\"),Fe=document.getElementById(\"stale-warning\"),xe=document.getElementById(\"saturation-warning\"),Sn=document.getElementById(\"export-diag\"),_n=document.getElementById(\"stat-source\");function eo(e){return e<50?\"#22c55e\":e<80?\"#eab308\":\"#ef4444\"}try{er=chrome.runtime.getManifest(),An&&er.version&&(An.textContent=\"v\"+er.version)}catch(e){C(\"manifest-version\",{err:String(e)})}var er,En=document.getElementById(\"privacy-link\");En&&En.addEventListener(\"click\",function(e){e.preventDefault();try{chrome.tabs.create({url:chrome.runtime.getURL(\"privacy/privacy.html\")})}catch(t){console.warn(\"[privacy] \\u043D\\u0435 \\u0443\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u043E\\u0442\\u043A\\u0440\\u044B\\u0442\\u044C \\u043F\\u043E\\u043B\\u0438\\u0442\\u0438\\u043A\\u0443 \\u043A\\u043E\\u043D\\u0444\\u0438\\u0434\\u0435\\u043D\\u0446\\u0438\\u0430\\u043B\\u044C\\u043D\\u043E\\u0441\\u0442\\u0438:\",t)}});var bn=document.getElementById(\"help-link\");bn&&bn.addEventListener(\"click\",function(e){e.preventDefault();try{chrome.tabs.create({url:chrome.runtime.getURL(\"docs/index.html\")})}catch(t){console.warn(\"[help] \\u043D\\u0435 \\u0443\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u043E\\u0442\\u043A\\u0440\\u044B\\u0442\\u044C \\u0440\\u0443\\u043A\\u043E\\u0432\\u043E\\u0434\\u0441\\u0442\\u0432\\u043E:\",t)}});var cr={chatgpt:\"ChatGPT\",gemini:\"Gemini\",aistudio:\"Google AI Studio\",google_search:\"Google Search AI\",deepseek:\"DeepSeek\",claude:\"Claude\",perplexity:\"Perplexity\",qwen:\"Qwen\"};chrome.storage.sync.get([\"selectedModel\",\"customLimit\",\"showWidget\",\"aiCmGeminiPlan\"],function(e){e.selectedModel&&(mt.value=e.selectedModel),e.customLimit&&(N.value=String(e.customLimit)),e.showWidget!==void 0&&(ht.checked=e.showWidget),ve&&e.aiCmGeminiPlan&&(ve.value=e.aiCmGeminiPlan)});var xt=\"aiCmApiKeySession\",Ct=[\"ai_cm_gemini_api_key\",\"ai_cm_api_key\",\"ai_cm_byok_key\",\"aiCmGeminiApiKey\",\"aiCmApiKey\",\"gemini_api_key\"],kn=document.getElementById(\"api-key-status\"),In=document.getElementById(\"api-key-remove\");function to(e){for(var t=0;t<Ct.length;t++){var r=e?e[Ct[t]]:null;if(typeof r==\"string\"&&r)return r}return\"\"}function Dn(){try{if(!chrome.storage||!chrome.storage.local||typeof chrome.storage.local.remove!=\"function\")return;chrome.storage.local.remove(Ct)}catch(e){console.warn(\"[AI CM][catch] aiCmPurgeLegacyByokKeys:\",e)}}function g(e,t,r){try{if(typeof chrome<\"u\"&&chrome.i18n&&typeof chrome.i18n.getMessage==\"function\"){var n=r?chrome.i18n.getMessage(e,r):chrome.i18n.getMessage(e);if(n)return n}}catch(i){C(\"aiCmI18nMessage\",{err:String(i)})}return t}function z(e){kn&&(kn.textContent=e?g(\"options_byok_status_set\",\"\\u041A\\u043B\\u044E\\u0447: \\u0437\\u0430\\u0434\\u0430\\u043D\"):g(\"options_byok_status_unset\",\"\\u041A\\u043B\\u044E\\u0447: \\u043D\\u0435 \\u0437\\u0430\\u0434\\u0430\\u043D\"))}function Nn(e){try{if(chrome.storage&&chrome.storage.session&&typeof chrome.storage.session.set==\"function\"){var t={};t[xt]=e,chrome.storage.session.set(t)}}catch(r){console.warn(\"[AI CM][catch] aiCmSaveByokKey:\",r)}Dn()}var lr=null;function nr(e){Cn&&(Cn.textContent=e?g(\"options_exact_count_nokey\",\"\\u041A\\u043B\\u044E\\u0447 API \\u043D\\u0435 \\u043D\\u0430\\u0439\\u0434\\u0435\\u043D. \\u0412\\u0432\\u0435\\u0434\\u0438\\u0442\\u0435 \\u043A\\u043B\\u044E\\u0447 \\u0437\\u0430\\u043D\\u043E\\u0432\\u043E, \\u0447\\u0442\\u043E\\u0431\\u044B \\u0432\\u043A\\u043B\\u044E\\u0447\\u0438\\u0442\\u044C \\u0442\\u043E\\u0447\\u043D\\u044B\\u0439 \\u043F\\u043E\\u0434\\u0441\\u0447\\u0451\\u0442\"):\"\")}function Y(e){if(!(e!==!0&&e!==!1)){if(lr=e,e||!U||!U.checked){nr(!1);return}U.checked=!1,nr(!0);try{chrome.storage.local.set({ai_cm_exact_token_count:!1})}catch(t){console.warn(\"[AI CM][catch] aiCmSyncExactCountWithByok:\",t)}}}function ro(e){return!!e&&typeof e.then==\"function\"}function no(){try{let r=function(n){if(!e){e=!0;var i=n?n[xt]:\"\";if(typeof i==\"string\"&&i){I&&(I.value=i),z(!0),Y(!0);return}z(!1),Y(!1);try{chrome.storage.local.get(Ct,function(o){var a=to(o);a&&(Nn(a),I&&(I.value=a),z(!0),Y(!0),console.log(\"[AI CM][byok] migrated plaintext\\u2192session\"))})}catch(o){C(\"aiCmLoadByokKey\",{err:String(o)})}}};if(!chrome.storage||!chrome.storage.session||typeof chrome.storage.session.get!=\"function\"){z(!1);return}var e=!1,t=chrome.storage.session.get([xt],r);ro(t)&&t.then(r,function(){e||(e=!0,z(!1),Y(!1))})}catch{z(!1)}}chrome.storage.local.get([\"ai_cm_exact_token_count\"],function(e){if(On){[I,U].forEach(function(t){var r=t&&t.closest?t.closest(\".section\"):null;r&&(r.hidden=!0,r.style.display=\"none\")}),e.ai_cm_exact_token_count&&chrome.storage.local.set({ai_cm_exact_token_count:!1});return}e.ai_cm_exact_token_count!==void 0&&(U.checked=!!e.ai_cm_exact_token_count,lr===!1&&Y(!1))});On||no();mt&&mt.addEventListener(\"change\",function(){chrome.storage.sync.set({selectedModel:mt.value})});ve&&ve.addEventListener(\"change\",function(){var e=ve.value===\"auto\"?\"\":ve.value;chrome.storage.sync.set({aiCmGeminiPlan:e})});var io=500,Ve=null;function fr(){Ve!==null&&(clearTimeout(Ve),Ve=null)}N&&N.addEventListener(\"input\",function(){fr(),Ve=setTimeout(function(){Ve=null;var e=N.value?parseInt(N.value):null;chrome.storage.sync.set({customLimit:e})},io)});N&&N.addEventListener(\"change\",function(){N.value||(fr(),N.placeholder=g(\"options_limit_placeholder\",\"\\u0410\\u0432\\u0442\\u043E\"),chrome.storage.sync.set({customLimit:null}))});ht&&ht.addEventListener(\"change\",function(){chrome.storage.sync.set({showWidget:ht.checked})});var Ce=document.getElementById(\"debugLogs\");chrome.storage.local.get([\"aiCmDebugLogs\"],function(e){Ce&&(Ce.checked=e.aiCmDebugLogs===!0)});Ce&&Ce.addEventListener(\"change\",function(){chrome.storage.local.set({aiCmDebugLogs:Ce.checked})});var ae=document.getElementById(\"aiCmIncludeHiddenInExport\");chrome.storage.local.get([\"aiCmIncludeHiddenInExport\"],function(e){ae&&(ae.checked=!!(e&&e.aiCmIncludeHiddenInExport===!0))});ae&&ae.addEventListener(\"change\",function(){chrome.storage.local.set({aiCmIncludeHiddenInExport:ae.checked})});try{chrome.storage.onChanged.addListener(function(e,t){t===\"local\"&&e.aiCmIncludeHiddenInExport&&ae&&(ae.checked=e.aiCmIncludeHiddenInExport.newValue===!0)})}catch(e){C(\"hidden-sync\",{err:String(e)})}var se=document.getElementById(\"aiCmProactive\"),ue=document.getElementById(\"aiCmProactiveNotify\");chrome.storage.local.get([\"aiCmProactive\",\"aiCmProactiveNotify\"],function(e){se&&(se.checked=!(e&&e.aiCmProactive===!1)),ue&&(ue.checked=!!(e&&e.aiCmProactiveNotify===!0))});se&&se.addEventListener(\"change\",function(){chrome.storage.local.set({aiCmProactive:se.checked})});ue&&ue.addEventListener(\"change\",function(){chrome.storage.local.set({aiCmProactiveNotify:ue.checked})});try{chrome.storage.onChanged.addListener(function(e,t){t===\"local\"&&(e.aiCmProactive&&se&&(se.checked=e.aiCmProactive.newValue!==!1),e.aiCmProactiveNotify&&ue&&(ue.checked=e.aiCmProactiveNotify.newValue===!0))})}catch(e){C(\"proactive-changed\",{err:String(e)})}var Se=document.getElementById(\"aiCmProactiveLow\"),_e=document.getElementById(\"aiCmProactiveMedium\"),Ee=document.getElementById(\"aiCmProactiveHigh\"),Bn=[70,85,95];function dr(e){try{if(!Array.isArray(e)||e.length<3)return null;for(var t=[],r=0;r<3;r++){var n=parseInt(e[r],10);if(isNaN(n)||n<1||n>100)return null;t.push(n)}return t[0]<t[1]&&t[1]<t[2]?t:null}catch{return null}}function oo(){return[Se?Se.value:void 0,_e?_e.value:void 0,Ee?Ee.value:void 0]}function pr(e){!e||e.length<3||(Se&&(Se.value=e[0]),_e&&(_e.value=e[1]),Ee&&(Ee.value=e[2]))}function wn(){try{var e=oo(),t=dr(e);t||(console.warn(\"[AI CM][thresholds] \\u0431\\u0438\\u0442\\u044B\\u0439 \\u0432\\u0432\\u043E\\u0434 \\u043F\\u043E\\u0440\\u043E\\u0433\\u043E\\u0432 \\u2192 \\u0444\\u043E\\u043B\\u0431\\u044D\\u043A [70,85,95]\",e),t=Bn),pr(t),chrome.storage.local.set({aiCmProactiveThresholds:t})}catch(r){C(\"applyProactiveThresholdInputs\",{err:String(r)})}}try{chrome.storage.local.get([\"aiCmProactiveThresholds\"],function(e){try{var t=e&&e.aiCmProactiveThresholds!==void 0,r=dr(t?e.aiCmProactiveThresholds:null);t&&!r&&console.warn(\"[AI CM][thresholds] \\u0431\\u0438\\u0442\\u044B\\u0435 \\u0441\\u043E\\u0445\\u0440\\u0430\\u043D\\u0451\\u043D\\u043D\\u044B\\u0435 aiCmProactiveThresholds \\u2192 \\u0434\\u0435\\u0444\\u043E\\u043B\\u0442 [70,85,95]\",e.aiCmProactiveThresholds),pr(r||Bn)}catch(n){C(\"thresholds-init\",{err:String(n)})}})}catch(e){C(\"thresholds-load\",{err:String(e)})}[Se,_e,Ee].forEach(function(e){e&&(e.addEventListener(\"change\",wn),e.addEventListener(\"blur\",wn))});try{chrome.storage.onChanged.addListener(function(e,t){if(t===\"local\"&&e.aiCmProactiveThresholds){var r=dr(e.aiCmProactiveThresholds.newValue);if(!r||document.activeElement===Se||document.activeElement===_e||document.activeElement===Ee)return;pr(r)}})}catch(e){C(\"thresholds-changed\",{err:String(e)})}I&&I.addEventListener(\"input\",function(){Nn(I.value),z(!!I.value),Y(!!I.value)});In&&In.addEventListener(\"click\",function(){try{chrome.storage&&chrome.storage.session&&typeof chrome.storage.session.remove==\"function\"&&chrome.storage.session.remove([xt])}catch(e){console.warn(\"[AI CM][catch] removeApiKey:\",e)}Dn(),I&&(I.value=\"\"),z(!1),Y(!1)});Be&&Be.addEventListener(\"click\",function(){I.type===\"password\"?(I.type=\"text\",Be.textContent=\"\\u{1F648}\"):(I.type=\"password\",Be.textContent=\"\\u{1F441}\"),Be.setAttribute(\"aria-pressed\",String(I.type===\"text\"))});U&&U.addEventListener(\"change\",function(){chrome.storage.local.set({ai_cm_exact_token_count:U.checked}),lr===!1&&U.checked?Y(!1):nr(!1)});var Ke=document.getElementById(\"aiCmAutoExport\"),B=document.getElementById(\"aiCmAutoExportPct\"),ze=document.getElementById(\"aiCmAutoExportFmt\");function ir(e){return e===\"md\"||e===\"json\"?e:\"txt\"}function gr(e){var t=parseInt(e,10);return isNaN(t)?null:(t<1&&(t=1),t>100&&(t=100),t)}var Fn=90;function Ye(){try{var e=gr(B.value);e=e===null?Fn:e,B.value=String(e),chrome.storage.local.set({aiCmAutoExport:Ke.checked===!0,aiCmAutoExportPct:e,aiCmAutoExportFmt:ir(ze.value)})}catch(t){C(\"aiCmAutoExportWriteFull\",{err:String(t)})}}try{chrome.storage.local.get([\"aiCmAutoExport\",\"aiCmAutoExportPct\",\"aiCmAutoExportFmt\"],function(e){try{e=e||{},Ke&&(Ke.checked=e.aiCmAutoExport===!0);var t=gr(e.aiCmAutoExportPct);B&&(B.value=String(t===null?Fn:t)),ze&&(ze.value=ir(e.aiCmAutoExportFmt));var r=typeof e.aiCmAutoExport!=\"boolean\"||t===null||ir(e.aiCmAutoExportFmt)!==e.aiCmAutoExportFmt;r&&Ye()}catch(n){C(\"autoexport-init\",{err:String(n)})}})}catch(e){C(\"autoexport-load\",{err:String(e)})}Ke&&Ke.addEventListener(\"change\",Ye);B&&B.addEventListener(\"change\",Ye);B&&B.addEventListener(\"blur\",Ye);ze&&ze.addEventListener(\"change\",Ye);try{chrome.storage.onChanged.addListener(function(e,t){if(t===\"local\"&&e.aiCmDebugLogs&&(Ce.checked=e.aiCmDebugLogs.newValue===!0),t===\"local\"&&e.aiCmAutoExportPct&&B&&document.activeElement!==B){var r=gr(e.aiCmAutoExportPct.newValue);B.value=String(r===null?90:r)}})}catch(e){C(\"autoexport-changed\",{err:String(e)})}document.getElementById(\"reset-limit\")&&document.getElementById(\"reset-limit\").addEventListener(\"click\",function(){fr(),N.value=\"\",N.placeholder=g(\"options_limit_placeholder\",\"\\u0410\\u0432\\u0442\\u043E\"),chrome.storage.sync.set({customLimit:null})});var ao={chatgpt:/\\/(c|g|share)\\//,gemini:/\\/app\\//,claude:/\\/chat\\//,perplexity:/\\/(search|follow)\\//,deepseek:/\\/a\\//};function so(e){if(!e)return null;var t=String(e).toLowerCase();return t.indexOf(\"chatgpt.com\")!==-1?\"chatgpt\":t.indexOf(\"gemini.google.com\")!==-1?\"gemini\":t.indexOf(\"claude.ai\")!==-1?\"claude\":t.indexOf(\"perplexity.ai\")!==-1?\"perplexity\":t.indexOf(\"chat.deepseek.com\")!==-1?\"deepseek\":null}function uo(e){if(!e)return null;var t=String(e).toLowerCase();return t.indexOf(\"aistudio.google.com\")!==-1?\"aistudio\":t.indexOf(\"gemini.google.com\")!==-1?\"gemini\":t.indexOf(\"chatgpt.com\")!==-1?\"chatgpt\":t.indexOf(\"claude.ai\")!==-1?\"claude\":t.indexOf(\"perplexity.ai\")!==-1?\"perplexity\":t.indexOf(\"chat.deepseek.com\")!==-1?\"deepseek\":t.indexOf(\"chat.qwen.ai\")!==-1?\"qwen\":t===\"google.com\"||t===\"www.google.com\"?\"google_search\":null}function mr(e){return uo(e)?g(\"options_no_data\",\"\\u041D\\u0435\\u0442 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0445\"):g(\"options_open_supported_site\",\"\\u041E\\u0442\\u043A\\u0440\\u043E\\u0439\\u0442\\u0435 \\u043F\\u043E\\u0434\\u0434\\u0435\\u0440\\u0436\\u0438\\u0432\\u0430\\u0435\\u043C\\u044B\\u0439 \\u0441\\u0430\\u0439\\u0442\")}function or(e,t){var r=so(e);return r?ao[r].test(String(t||\"\")):!1}function co(e){return typeof e==\"number\"&&isFinite(e)&&e>0?e.toLocaleString():e===null?g(\"options_account_unknown\",\"\\u043D\\u0435\\u0438\\u0437\\u0432\\u0435\\u0441\\u0442\\u0435\\u043D\"):\"\\u2014\"}function ar(e,t,r,n){ur.textContent=cr[e.site]||e.site||\"\\u2014\",Ln.textContent=e.model||\"\\u2014\";var i=typeof e.tokens==\"number\"&&isFinite(e.tokens)&&e.tokens>0;Mn.textContent=i?e.tokens.toLocaleString():\"\\u2014\",vt&&(vt.textContent=typeof e.windowLimit==\"number\"&&e.windowLimit>0?e.windowLimit.toLocaleString():\"\\u2014\"),ye.textContent=typeof e.limit==\"number\"?e.limit.toLocaleString():\"\\u2014\",yt&&(yt.textContent=co(e.accountLimit));var o=e.percent||0;X.textContent=i?o+\"%\":\"\\u2014\",X.style.color=i?eo(o):\"#8888aa\";var a=e.site===\"perplexity\"?g(\"options_context_not_quota\",\"\\u041B\\u0438\\u043C\\u0438\\u0442 \\u043A\\u043E\\u043D\\u0442\\u0435\\u043A\\u0441\\u0442\\u0430 \\u043C\\u043E\\u0434\\u0435\\u043B\\u0438. \\u041A\\u0432\\u043E\\u0442\\u0430 \\u043F\\u043E\\u0438\\u0441\\u043A\\u0430 Perplexity \\u2014 \\u043D\\u0435 \\u0437\\u0430\\u043F\\u043E\\u043B\\u043D\\u0435\\u043D\\u0438\\u0435 \\u043A\\u043E\\u043D\\u0442\\u0435\\u043A\\u0441\\u0442\\u0430.\"):\"\";ye&&(ye.title=a),X&&(X.title=a),_n&&(_n.textContent=n?g(\"options_source_cache\",\"\\u043A\\u044D\\u0448 (\\u043F\\u0440\\u043E\\u0448\\u043B\\u0430\\u044F \\u0431\\u0435\\u0441\\u0435\\u0434\\u0430)\"):e.sourceLabel||\"\\u2014\"),Gn(e,t,r)}function Gn(e,t,r){if(xe){var n=!!(e&&e.saturated===!0&&or(t,r));xe.textContent=n?g(\"options_context_saturated\",\"\\u041F\\u043B\\u0430\\u0442\\u0444\\u043E\\u0440\\u043C\\u0430 \\u0441\\u043E\\u043E\\u0431\\u0449\\u0430\\u0435\\u0442: \\u043A\\u043E\\u043D\\u0442\\u0435\\u043A\\u0441\\u0442 \\u0437\\u0430\\u043F\\u043E\\u043B\\u043D\\u0435\\u043D. \\u041D\\u0430\\u0447\\u043D\\u0438\\u0442\\u0435 \\u043D\\u043E\\u0432\\u044B\\u0439 \\u0447\\u0430\\u0442.\"):\"\",xe.style.display=n?\"block\":\"none\"}if(Fe){var i=!!(e&&e.stale===!0&&or(t,r));if(i){var o=cr[e.site]||e.site||g(\"options_stale_site_fallback\",\"\\u0441\\u0430\\u0439\\u0442\\u043E\\u043C\");Fe.textContent=g(\"options_stale_warning\",\"\\u0418\\u043D\\u0442\\u0435\\u0433\\u0440\\u0430\\u0446\\u0438\\u044F \\u0441 \"+o+\" \\u043C\\u043E\\u0433\\u043B\\u0430 \\u0443\\u0441\\u0442\\u0430\\u0440\\u0435\\u0442\\u044C: \\u0441\\u0430\\u0439\\u0442 \\u043D\\u0435 \\u043E\\u0442\\u0434\\u0430\\u0451\\u0442 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0435 \\u0434\\u0438\\u0430\\u043B\\u043E\\u0433\\u0430. \\u041F\\u0440\\u043E\\u0432\\u0435\\u0440\\u044C\\u0442\\u0435 \\u043E\\u0431\\u043D\\u043E\\u0432\\u043B\\u0435\\u043D\\u0438\\u0435 \\u0440\\u0430\\u0441\\u0448\\u0438\\u0440\\u0435\\u043D\\u0438\\u044F.\",[o]),Fe.style.display=\"block\"}else Fe.style.display=\"none\",Fe.textContent=\"\"}}function C(e,t){try{if(typeof aiCmDiagLine==\"function\")return aiCmDiagLine(e,t);var r=!1;try{r=!!(typeof sessionStorage<\"u\"&&sessionStorage&&sessionStorage.getItem(\"aiCmDebug\")===\"1\")}catch{r=!1}if(!r)try{r=window.__aiCmDebugLogs===!0}catch{return!1}if(!r)return!1;var n=[],i=t||{};for(var o in i)if(Object.prototype.hasOwnProperty.call(i,o)){var a=i[o];n.push(o+\"=\"+(a==null?\"-\":String(a)))}return console.log(\"[AI CM][diag] \"+e+\" \"+n.join(\" \")),!0}catch{return!1}}function he(e){try{C(\"qwen-badge\",{ts:Date.now(),event:\"showNoData\",reason:String(e||\"-\"),url:String(typeof location<\"u\"&&location&&location.href||\"\")})}catch(t){C(\"showNoData\",{err:String(t)})}ur.textContent=e||g(\"options_no_data\",\"\\u041D\\u0435\\u0442 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0445\"),Ln.textContent=\"\\u2014\",Mn.textContent=\"\\u2014\",vt&&(vt.textContent=\"\\u2014\"),ye.textContent=\"\\u2014\",yt&&(yt.textContent=\"\\u2014\"),X.textContent=\"\\u2014\",X.style.color=\"#8888aa\",ye&&(ye.title=\"\"),X&&(X.title=\"\"),xe&&(xe.textContent=\"\",xe.style.display=\"none\")}function hr(e){try{var t=new Date(e);return(\"0\"+t.getHours()).slice(-2)+\":\"+(\"0\"+t.getMinutes()).slice(-2)}catch{return\"??:??\"}}var b=null;function lo(){try{chrome.tabs.query({active:!0,currentWindow:!0},function(e){var t=e&&e[0];if(!t){he(g(\"options_no_active_tab\",\"\\u041D\\u0435\\u0442 \\u0430\\u043A\\u0442\\u0438\\u0432\\u043D\\u043E\\u0439 \\u0432\\u043A\\u043B\\u0430\\u0434\\u043A\\u0438\"));return}if(!t.url){he(g(\"options_open_supported_site\",\"\\u041E\\u0442\\u043A\\u0440\\u043E\\u0439\\u0442\\u0435 \\u043F\\u043E\\u0434\\u0434\\u0435\\u0440\\u0436\\u0438\\u0432\\u0430\\u0435\\u043C\\u044B\\u0439 \\u0441\\u0430\\u0439\\u0442\"));return}if(t.url.indexOf(\"chrome://\")===0||t.url.indexOf(\"chrome-extension://\")===0){he(g(\"options_open_supported_site\",\"\\u041E\\u0442\\u043A\\u0440\\u043E\\u0439\\u0442\\u0435 \\u043F\\u043E\\u0434\\u0434\\u0435\\u0440\\u0436\\u0438\\u0432\\u0430\\u0435\\u043C\\u044B\\u0439 \\u0441\\u0430\\u0439\\u0442\"));return}var r=\"\",n=\"\";try{var i=new URL(t.url);r=i.hostname,n=i.pathname}catch(o){C(\"loadStats-tab-url\",{err:String(o)})}chrome.storage.local.get([\"aiCmState\",\"aiCmState:\"+r],function(o){var a=o.aiCmState?o.aiCmState:null,s=o[\"aiCmState:\"+r]||null;if(!s&&a&&a.host===r&&(s=a),s)b=s,ar(s,r,n),Xe();else if(b&&b.host===r){ar(b,r,n,!0);var u=hr(b.updatedAt);ur.textContent+=g(\"options_data_from\",\" \\xB7 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0435 \\u043E\\u0442 \"+u,[u])}else he(mr(r))})})}catch{he(g(\"options_reload_page\",\"\\u041E\\u0431\\u043D\\u043E\\u0432\\u0438\\u0442\\u0435 \\u0441\\u0442\\u0440\\u0430\\u043D\\u0438\\u0446\\u0443\"))}}try{chrome.storage.onChanged.addListener(function(e,t){if(t===\"local\"){var r=[];e.aiCmState&&e.aiCmState.newValue&&r.push(e.aiCmState.newValue);for(var n in e)n.indexOf(\"aiCmState:\")===0&&e[n]&&e[n].newValue&&r.push(e[n].newValue);if(!r.length){var i=!1;chrome.tabs.query({active:!0,currentWindow:!0},function(o){var a=o&&o[0],s=\"\";try{a&&a.url&&(s=new URL(a.url).hostname)}catch(c){C(\"stats-changed-removed\",{err:String(c)})}var u=e.aiCmState&&e.aiCmState.oldValue?e.aiCmState.oldValue:null;i=!s&&(!!e.aiCmState||!!e[\"aiCmState:\"+s])||!!s&&(!!e[\"aiCmState:\"+s]||!!e.aiCmState&&!!(u&&u.host===s)),i&&(b=null,he(mr(s)),Gn(null,s,\"\"),Xe())});return}chrome.tabs.query({active:!0,currentWindow:!0},function(o){var a=o&&o[0],s=\"\",u=\"\";try{if(a&&a.url){var c=new URL(a.url);s=c.hostname,u=c.pathname}}catch(p){C(\"stats-changed-live\",{err:String(p)})}for(var l=null,f=0;f<r.length;f++){var d=r[f];d.host===s&&(!l||(d.updatedAt||0)>(l.updatedAt||0))&&(l=d)}l&&(b=l,ar(l,s,u),Xe())})}})}catch(e){C(\"stats-changed\",{err:String(e)})}var k=null,oe=\"\",qe=!1;function Hn(e){return!!(e&&e.site===\"google_search\"&&e.msgOrder!==2)}function jn(e){try{chrome.tabs.query({active:!0,currentWindow:!0},function(t){var r=t&&t[0],n=\"\";if(r&&r.url)try{n=new URL(r.url).hostname}catch{n=\"\"}oe=n,e(n)})}catch{e(\"\")}}function Xe(){if(!(!He||!je||!We)){var e=!!(k&&k.host===oe),t=b&&b.host===oe&&typeof b.netBaseMsgs==\"number\"?b.netBaseMsgs:0,r=!!(b&&b.host===oe&&b.site===\"google_search\"),n=!!(k&&k.site===\"google_search\"&&k.msgOrder===2),i=qe||r&&!n;if(!e&&t>0&&!i&&(e=!0),He.disabled=!e,je.disabled=!e,We.disabled=!e,Ue&&(Ue.disabled=!e),pt)if(e){var o=k&&k.host===oe?k.updatedAt:b?b.updatedAt:0,a=hr(o);pt.textContent=g(\"options_ready_to_export\",\"\\u0413\\u043E\\u0442\\u043E\\u0432\\u043E \\u043A \\u044D\\u043A\\u0441\\u043F\\u043E\\u0440\\u0442\\u0443 \\xB7 \\u0434\\u0430\\u043D\\u043D\\u044B\\u0435 \\u043E\\u0442 \"+a,[a])}else i?pt.textContent=g(\"options_reload_page\",\"\\u041E\\u0431\\u043D\\u043E\\u0432\\u0438\\u0442\\u0435 \\u0441\\u0442\\u0440\\u0430\\u043D\\u0438\\u0446\\u0443\"):pt.textContent=mr(oe)}}function fo(e){return G?G.buildTxtFromHistory(e||k):\"\"}function po(){jn(function(e){chrome.storage.local.get([\"aiCmHistory\",\"aiCmHistory:\"+e],function(t){var r=t.aiCmHistory?t.aiCmHistory:null,n=t[\"aiCmHistory:\"+e]||null;!n&&r&&r.host===e&&(n=r),qe=Hn(n),qe&&(n=null),k=n,Xe()})})}function gt(e){return(e<10?\"0\":\"\")+e}function vr(e,t){t=t||k;var r=new Date,n=r.getFullYear()+\"-\"+gt(r.getMonth()+1)+\"-\"+gt(r.getDate())+\"-\"+gt(r.getHours())+\"-\"+gt(r.getMinutes()),i=t&&t.site||\"chat\",o=t&&t.model||\"model\",a=String(i).replace(/[^a-zA-Z0-9_-]+/g,\"-\").replace(/^-+|-+$/g,\"\")||\"chat\",s=String(o).replace(/[^a-zA-Z0-9_.-]+/g,\"-\").replace(/^-+|-+$/g,\"\")||\"model\",u=t&&t.isLowConfidenceBase===!0?\"[LOW CONFIDENCE]_\":\"\";return u+\"ai-context-monitor-\"+a+\"-\"+s+\"-\"+n+\".\"+e}function Ae(e,t,r,n){G&&G.downloadBlob&&G.downloadBlob(e,t,r,n||\"options\")}function go(e){e=e||k;var t=e&&e.site;return cr[t]||t||\"AI Chat\"}function Wn(e){var t=e||k;return G?G.buildJsonFromHistory(t,t&&t.site||\"AI Chat\"):\"\"}function Un(e){return G?G.buildMdFromHistory(e||k,go(e)):\"\"}function yr(e){try{chrome.tabs.query({active:!0,currentWindow:!0},function(t){var r=t&&t[0];if(!r||!r.id){e(null);return}try{chrome.tabs.sendMessage(r.id,{type:\"aiCmExportCurrent\"},function(n){if(chrome.runtime.lastError||!n||!n.data){e(null);return}e(n.data)})}catch{e(null)}})}catch{e(null)}}function xr(e){return e&&(e.convId||Array.isArray(e.messages)&&e.messages.length>0)?e:k}He&&He.addEventListener(\"click\",function(){He.disabled||yr(function(e){var t=xr(e);t&&Ae(Un(t),vr(\"md\",t),\"text/markdown\",\"options-md\")})});je&&je.addEventListener(\"click\",function(){je.disabled||yr(function(e){var t=xr(e);t&&Ae(Wn(t),vr(\"json\",t),\"application/json\",\"options-json\")})});Ue&&Ue.addEventListener(\"click\",function(){Ue.disabled||yr(function(e){var t=xr(e);if(t){var r=fo(t);r.charAt(0)!==\"\\uFEFF\"&&(r=\"\\uFEFF\"+r),Ae(r,vr(\"txt\",t),\"text/plain;charset=utf-8\",\"options-txt\")}})});We&&We.addEventListener(\"click\",function(){We.disabled||Vn(function(e){if(!(!e||!e.id)){var t=chrome.runtime.getURL(\"print/print.html\")+\"?tab=\"+e.id;try{chrome.tabs.create({url:t})}catch(r){console.warn(\"[export-pdf] \\u043D\\u0435 \\u0443\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u043E\\u0442\\u043A\\u0440\\u044B\\u0442\\u044C \\u043F\\u0435\\u0447\\u0430\\u0442\\u043D\\u0443\\u044E \\u0444\\u043E\\u0440\\u043C\\u0443:\",r)}}})});function Vn(e){try{chrome.tabs.query({active:!0,currentWindow:!0},function(t){e(t&&t[0]?t[0]:null)})}catch{e(null)}}function tr(){return\"ai-context-monitor-diagnostics-\"+Date.now()+\".json\"}Sn&&Sn.addEventListener(\"click\",function(){Vn(function(e){if(!e||!e.id){Ae(JSON.stringify({error:\"\\u043D\\u0435\\u0442 \\u0430\\u043A\\u0442\\u0438\\u0432\\u043D\\u043E\\u0439 \\u0432\\u043A\\u043B\\u0430\\u0434\\u043A\\u0438\",at:new Date().toISOString()},null,2),tr(),\"application/json\",\"options-diag\");return}try{chrome.tabs.sendMessage(e.id,{type:\"aiCmDiag\"},function(t){var r;chrome.runtime.lastError?r={error:\"content script \\u043D\\u0435 \\u043E\\u0442\\u0432\\u0435\\u0442\\u0438\\u043B: \"+chrome.runtime.lastError.message,at:new Date().toISOString()}:r=t&&t.diag?t.diag:{error:\"\\u043F\\u0443\\u0441\\u0442\\u043E\\u0439 \\u043E\\u0442\\u0432\\u0435\\u0442\",response:t||null},Ae(JSON.stringify(r,null,2),tr(),\"application/json\",\"options-diag\")})}catch(t){Ae(JSON.stringify({error:\"sendMessage error: \"+t.message,at:new Date().toISOString()},null,2),tr(),\"application/json\",\"options-diag\")}})});try{chrome.storage.onChanged.addListener(function(e,t){if(t===\"local\"){var r=null;e.aiCmHistory&&e.aiCmHistory.newValue&&(r=e.aiCmHistory.newValue);for(var n in e)if(n.indexOf(\"aiCmHistory:\")===0&&e[n]&&e[n].newValue){var i=e[n].newValue;(!r||(i.updatedAt||0)>(r.updatedAt||0))&&(r=i)}r&&jn(function(){r.host===oe&&(qe=Hn(r),k=qe?null:r),Xe()})}})}catch(e){C(\"history-changed\",{err:String(e)})}var Tn=document.getElementById(\"archive-file\"),Rn=document.getElementById(\"archive-import\"),Pn=document.getElementById(\"archive-refresh\"),rr=document.getElementById(\"archive-status\"),Ge=document.getElementById(\"archive-list\"),mo=20;function At(){let e=yn;return e&&typeof e.parseArchiveText==\"function\"&&typeof e.planArchiveImport==\"function\"?e:null}function q(e,t){rr&&(rr.textContent=e||\"\",rr.style.color=t?\"#ef4444\":\"\")}function Kn(e,t){let r=At(),n={};return!r||!Array.isArray(e)||e.forEach(function(i){!i||!i.convId||(n[r.archiveStorageKey(i.convId)]=i,n[r.convSourceStorageKey(i.convId)]=r.buildConvSourceRecord(i,{fileName:t}))}),n}function zn(e,t){let r=At();if(!r){t(g(\"options_archive_module_missing\",\"\\u043C\\u043E\\u0434\\u0443\\u043B\\u044C \\u0438\\u043C\\u043F\\u043E\\u0440\\u0442\\u0430 \\u043D\\u0435 \\u0437\\u0430\\u0433\\u0440\\u0443\\u0436\\u0435\\u043D (utils/archive-import.js)\"));return}let n=Array.prototype.slice.call(e||[]).filter(function(s){return!!s}).slice(0,mo);if(!n.length){t(g(\"options_archive_no_files\",\"\\u0444\\u0430\\u0439\\u043B\\u044B \\u043D\\u0435 \\u0432\\u044B\\u0431\\u0440\\u0430\\u043D\\u044B\"));return}let i={files:0,conversations:0,accepted:0,bytes:0,skipped:[],errors:[],patch:{}},o=0;function a(){if(o>=n.length){t(null,i);return}let s=n[o++];i.files++;let u=Number(r.MAX_ARCHIVE_SIZE)||0,c=Number(s&&s.size)||0;if(u>0&&c>u){let f=String(Math.round(u/1048576));i.errors.push({fileName:s.name,error:\"file-too-large\",size:c,limit:u,message:g(\"options_archive_file_too_large\",\"\\u0444\\u0430\\u0439\\u043B \\u0441\\u043B\\u0438\\u0448\\u043A\\u043E\\u043C \\u0431\\u043E\\u043B\\u044C\\u0448\\u043E\\u0439 (\\u0431\\u043E\\u043B\\u044C\\u0448\\u0435 \"+f+\" \\u041C\\u0411) \\u2014 \\u0447\\u0442\\u0435\\u043D\\u0438\\u0435 \\u043E\\u0442\\u043C\\u0435\\u043D\\u0435\\u043D\\u043E\",[f])}),a();return}let l;try{l=new FileReader}catch{i.errors.push({fileName:s.name,error:\"filereader-unavailable\"}),a();return}l.onerror=function(){i.errors.push({fileName:s.name,error:\"read-error\"}),a()},l.onload=function(){try{let f=r.parseArchiveText(String(l.result==null?\"\":l.result),{parsePerplexityThread:$t,orderChatGPTMapping:ct,sanitizeChatGPTText:Le});if(!f.ok){i.errors.push({fileName:s.name,error:f.error}),a();return}i.conversations+=f.conversations.length;let d=r.planArchiveImport(f.conversations,{fileName:s.name});(d.skipped||[]).forEach(function(p){i.skipped.push({fileName:s.name,convId:p.convId,reason:p.reason})}),i.accepted+=d.accepted.length,i.bytes+=d.bytes||0,Object.assign(i.patch,Kn(d.accepted,s.name))}catch{i.errors.push({fileName:s.name,error:\"parse-exception\"})}a()};try{l.readAsText(s)}catch{i.errors.push({fileName:s.name,error:\"read-exception\"}),a()}}a()}function sr(e){if(!e)return\"\";let t=[];var r=String(e.files),n=String(e.conversations),i=String(e.accepted);if(t.push(g(\"options_archive_report_files\",\"\\u0444\\u0430\\u0439\\u043B\\u043E\\u0432: \"+r,[r])),t.push(g(\"options_archive_report_conversations\",\"\\u0434\\u0438\\u0430\\u043B\\u043E\\u0433\\u043E\\u0432: \"+n,[n])),t.push(g(\"options_archive_report_imported\",\"\\u0438\\u043C\\u043F\\u043E\\u0440\\u0442\\u0438\\u0440\\u043E\\u0432\\u0430\\u043D\\u043E: \"+i,[i])),e.bytes){var o=String(Math.round(e.bytes/1024));t.push(g(\"options_archive_report_kb\",\"\\u2248\"+o+\" \\u041A\\u0411\",[o]))}if(e.skipped&&e.skipped.length){let u={};e.skipped.forEach(function(c){u[c.reason]=(u[c.reason]||0)+1});var a=Object.keys(u).map(function(c){return c+\"\\xD7\"+u[c]}).join(\", \");t.push(g(\"options_archive_report_skipped\",\"\\u043F\\u0440\\u043E\\u043F\\u0443\\u0449\\u0435\\u043D\\u043E: \"+a,[a]))}if(e.errors&&e.errors.length){var s=e.errors.map(function(u){return u.fileName+\" (\"+(u.message||u.error)+\")\"}).join(\", \");t.push(g(\"options_archive_report_errors\",\"\\u043E\\u0448\\u0438\\u0431\\u043A\\u0438: \"+s,[s]))}return t.join(\" \\xB7 \")}function ho(e){try{if(chrome.storage.local.getKeys){chrome.storage.local.getKeys(function(t){e((t||[]).filter(function(r){return r.indexOf(\"aiCmArchive:\")===0}).map(function(r){return r.slice(12)}))});return}}catch(t){C(\"aiCmListArchiveSourceKeys\",{err:String(t)})}try{chrome.storage.local.get(null,function(t){e(Object.keys(t||{}).filter(function(r){return r.indexOf(\"aiCmArchive:\")===0}).map(function(r){return r.slice(12)}))})}catch{e([])}}function be(){if(!Ge)return;let e=At();if(!e){Ge.textContent=\"\";return}ho(function(t){if(!t.length){Ge.textContent=g(\"options_archive_empty\",\"\\u0410\\u0440\\u0445\\u0438\\u0432\\u044B \\u043D\\u0435 \\u0438\\u043C\\u043F\\u043E\\u0440\\u0442\\u0438\\u0440\\u043E\\u0432\\u0430\\u043D\\u044B.\");return}let r=t.map(function(n){return e.convSourceStorageKey(n)});chrome.storage.local.get(r,function(n){Ge.textContent=\"\",t.forEach(function(i){let o=(n||{})[e.convSourceStorageKey(i)]||null,a=document.createElement(\"div\");a.className=\"archive-item\";let s=document.createElement(\"span\");s.className=\"archive-info\";let u=o?o.label||e.describeSource(o):g(\"options_archive_fallback\",\"\\u0430\\u0440\\u0445\\u0438\\u0432\"),c=o&&o.importedAt?\" \\xB7 \"+hr(o.importedAt):\"\",l=o&&o.fileName?\" \\xB7 \"+o.fileName:\"\";s.textContent=i.slice(0,8)+g(\"options_info_separator\",\"\\xA0\\u2014\\xA0\")+u+c+l,a.appendChild(s);let f=document.createElement(\"button\");f.className=\"btn-reset archive-del\",f.type=\"button\",f.textContent=g(\"options_archive_delete\",\"\\u0423\\u0434\\u0430\\u043B\\u0438\\u0442\\u044C\"),f.setAttribute(\"data-conv-id\",i),f.addEventListener(\"click\",function(){vo(i)}),a.appendChild(f),Ge.appendChild(a)})})})}function vo(e){let t=At();if(!(!t||!e))try{chrome.storage.local.remove([t.archiveStorageKey(e),t.convSourceStorageKey(e)],function(){var n=String(e).slice(0,8);q(g(\"options_archive_deleted\",\"\\u0430\\u0440\\u0445\\u0438\\u0432 \"+n+\" \\u0443\\u0434\\u0430\\u043B\\u0451\\u043D\",[n])),be()})}catch(n){var r=String(n&&n.message||n);q(g(\"options_archive_delete_error\",\"\\u043D\\u0435 \\u0443\\u0434\\u0430\\u043B\\u043E\\u0441\\u044C \\u0443\\u0434\\u0430\\u043B\\u0438\\u0442\\u044C \\u0430\\u0440\\u0445\\u0438\\u0432: \"+r,[r]),!0)}}function yo(){let e=Tn&&Tn.files;q(g(\"options_archive_reading\",\"\\u0447\\u0442\\u0435\\u043D\\u0438\\u0435 \\u0444\\u0430\\u0439\\u043B\\u043E\\u0432\\u2026\")),zn(e,function(t,r){if(t){q(t,!0);return}if(!Object.keys(r.patch).length){var i=sr(r);q(g(\"options_archive_nothing\",\"\\u043D\\u0438\\u0447\\u0435\\u0433\\u043E \\u043D\\u0435 \\u0438\\u043C\\u043F\\u043E\\u0440\\u0442\\u0438\\u0440\\u043E\\u0432\\u0430\\u043D\\u043E \\xB7 \"+i,[i]),!0),be();return}try{chrome.storage.local.set(r.patch,function(){var a=sr(r);q(g(\"options_archive_done\",\"\\u0433\\u043E\\u0442\\u043E\\u0432\\u043E \\xB7 \"+a,[a])),be()})}catch(a){var o=String(a&&a.message||a);q(g(\"options_archive_set_error\",\"\\u043E\\u0448\\u0438\\u0431\\u043A\\u0430 \\u0437\\u0430\\u043F\\u0438\\u0441\\u0438 \\u0432 \\u0445\\u0440\\u0430\\u043D\\u0438\\u043B\\u0438\\u0449\\u0435: \"+o,[o]),!0)}})}Rn&&Rn.addEventListener(\"click\",yo);Pn&&Pn.addEventListener(\"click\",function(){q(\"\"),be()});try{chrome.storage.onChanged.addListener(function(e,t){if(t===\"local\"){for(var r in e)if(r.indexOf(\"aiCmArchive:\")===0){be();return}}})}catch(e){C(\"archive-changed\",{err:String(e)})}document.addEventListener(\"DOMContentLoaded\",function(){lo(),po(),be()});typeof ce<\"u\"&&ce.exports&&(ce.exports={isChatHome:or,buildArchiveStoragePatch:Kn,aiCmImportArchiveFiles:zn,formatArchiveReport:sr,buildJsonText:Wn,buildMdText:Un})});xo();})();\n\n</script>\n\n</html>";
  var overlay = null;

  function closeOptions() {
    try { document.removeEventListener('keydown', onKeyDown); } catch (e) {}
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function onKeyDown(ev) {
    if (ev && ev.key === 'Escape') closeOptions();
  }

  function openOptions() {
    if (overlay) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', openOptions); return; }

    overlay = document.createElement('div');
    overlay.id = 'ai-cm-options-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(17,24,39,.55);display:flex;align-items:center;justify-content:center;padding:24px;';

    var frame = document.createElement('iframe');
    frame.setAttribute('title', 'AI Context Monitor — настройки');
    frame.style.cssText = 'width:420px;max-width:96vw;height:min(780px,92vh);border:0;border-radius:14px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.35);';
    frame.addEventListener('load', function () { bindFrame(frame); });
    frame.srcdoc = OPTIONS_HTML;

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть настройки');
    close.textContent = '✕';
    close.style.cssText = 'position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;border:0;background:#fff;color:#111827;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);';
    close.addEventListener('click', closeOptions);

    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeOptions(); });
    overlay.appendChild(frame);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);
  }

  window.__aiCmOpenOptions = openOptions;
  window.__aiCmCloseOptions = closeOptions;

  function isSettingsShortcut(ev) {
    return !!(ev && ev.ctrlKey && ev.altKey && !ev.shiftKey &&
      (ev.code === 'Comma' || ev.key === ','));
  }

  function isWidgetShortcut(ev) {
    return !!(ev && ev.ctrlKey && ev.altKey && !ev.shiftKey &&
      (ev.code === 'KeyH' || ev.key === 'h' || ev.key === 'H' || ev.key === 'р' || ev.key === 'Р'));
  }

  function toggleWidget() {
    try {
      chrome.storage.sync.get(['showWidget'], function (res) {
        // Скрыт -> показать, видим -> скрыть.
        var next = !!(res && res.showWidget === false);
        chrome.storage.sync.set({ showWidget: next });
      });
    } catch (e) {}
  }

  function bindFrame(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc) return;

      // Подсказка на случай, если индикатор скрыли и не знают, как вернуть.
      var cb = doc.getElementById('show-widget');
      var row = cb && cb.closest ? cb.closest('.checkbox-row') : null;
      if (row && !doc.getElementById('ai-cm-pake-hint')) {
        var hint = doc.createElement('div');
        hint.id = 'ai-cm-pake-hint';
        hint.className = 'hint';
        hint.style.marginTop = '6px';
        hint.textContent = 'Если индикатор скрыт: Ctrl+Alt+H — показать, Ctrl+Alt+, — настройки.';
        row.insertAdjacentElement('afterend', hint);
      }

      // Esc и горячие клавиши внутри iframe не всплывают в родительское окно.
      if (!frame.__aiCmKeysBound) {
        frame.__aiCmKeysBound = true;
        doc.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') {
            ev.preventDefault();
            closeOptions();
          } else if (isSettingsShortcut(ev)) {
            ev.preventDefault();
            closeOptions();
          } else if (isWidgetShortcut(ev)) {
            ev.preventDefault();
            toggleWidget();
          }
        }, true);
      }
    } catch (e) {}
  }

  document.addEventListener('keydown', function (ev) {
    if (isSettingsShortcut(ev)) {
      ev.preventDefault();
      if (overlay) closeOptions(); else openOptions();
    } else if (isWidgetShortcut(ev)) {
      ev.preventDefault();
      toggleWidget();
    }
  }, true);

  function addSettingsButton() {
    var panel = document.getElementById('ai-widget-panel');
    if (!panel || panel.querySelector('.ai-cm-settings-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-cm-btn ai-cm-settings-btn';
    btn.textContent = '⚙ Настройки расширения';
    btn.style.cssText = 'margin-top:8px;width:100%;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openOptions();
    });
    panel.appendChild(btn);
  }

  function start() { setInterval(addSettingsButton, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
