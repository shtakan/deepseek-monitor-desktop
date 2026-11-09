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
    try {
      if (typeof window !== "undefined" && window.__aiCmDebugLogs === true) enabled = true;
    } catch (e) {
    }
    if (enabled) {
      (console[level] || console.log).apply(console, args);
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
