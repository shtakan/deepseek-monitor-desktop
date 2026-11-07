(() => {
  // utils/debug.js
  var DEBUG = false;
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
  function debugLog2(level) {
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
  function swallow2(error, tag) {
    try {
      if (typeof debugLog2 !== "function") return;
      debugLog2("error", "[swallow][" + (tag || "unlabeled") + "]", error);
    } catch (eSwallow) {
    }
  }
  function aiCmDiagOn2() {
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
  function aiCmDiagLine2(tag, fields) {
    if (!aiCmDiagOn2()) return false;
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
  try {
    if (typeof window !== "undefined") window.__aiCmSwallow = swallow2;
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
      if (typeof aiCmDiagLine2 !== "function") return;
      aiCmDiagLine2("swallow-soft", { tag: label, err: error });
    } catch (eSoftDiag) {
      return void 0;
    }
  }
  try {
    if (typeof window !== "undefined") window.__aiCmSwallowSoft = swallowSoft;
  } catch (eSoftExport) {
    __aiCmPushLogRing("[swallow-soft-export] " + eSoftExport);
  }

  // utils/intercept-common.js
  function setIntervalVisible(fn, ms, opts) {
    var id = setInterval(function() {
      try {
        if (opts && opts.skipWhenHidden === false) {
          fn();
        } else if (document.visibilityState === "visible") {
          fn();
        }
      } catch (e) {
        swallowSoft(e, "intercept-common:setIntervalVisible-tick");
      }
    }, ms);
    return id;
  }

  // core/google-search-intercept.js
  (function() {
    if (window.__aiCmGoogleSearchInterceptInstalled) return;
    window.__aiCmGoogleSearchInterceptInstalled = true;
    try {
      window.addEventListener("ai-cm-debug-logs", function(ev) {
        __aiCmSetDebugLogs(!!(ev && ev.detail));
      });
    } catch (e) {
    }
    var MAX_CACHE_ENTRIES = 10;
    var seenKeys = {};
    var detectedModelSlug = null;
    var lastFullTurns = [];
    var lastFullMessages = [];
    var lastFullSnapshot = null;
    var currentThreadId = "";
    var emittedThreadId = "";
    var baseThreadId = "";
    var lastFolwrOpenUrl = "";
    var activeFolwrBusy = false;
    var activeFolwrInFlight = {};
    var lastPassiveFolwrTs = {};
    var lastFolwrSig = "";
    var SORRY_COOLDOWN_MS = 10 * 60 * 1e3;
    var FOLWR_PAGE_DELAY_MS = 400;
    var FOLWR_MAX_PAGES = 12;
    var FOLWR_RUN_MIN_COOLDOWN_MS = 2e3;
    var FOLWR_NO_GAIN_COOLDOWN_MS = 3e4;
    var sorryCooldownUntil = 0;
    function ownRequestsAllowed() {
      return Date.now() > sorryCooldownUntil;
    }
    function triggerSorryCooldown() {
      var wasActive = Date.now() <= sorryCooldownUntil;
      sorryCooldownUntil = Date.now() + SORRY_COOLDOWN_MS;
      if (!wasActive) {
        console.log("[ai-cm-google-search] 429/sorry \u2192 cooldown 10min: \u0441\u0432\u043E\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u044B \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u044B");
      }
    }
    function isSorryResponse(status, finalUrl) {
      try {
        if (status === 429) return true;
        return String(finalUrl || "").indexOf("/sorry/") !== -1;
      } catch (e) {
        return false;
      }
    }
    var threadCache = /* @__PURE__ */ new Map();
    function cacheSet(threadId, entry) {
      if (!threadId) return;
      if (threadCache.has(threadId)) {
        threadCache.delete(threadId);
      }
      threadCache.set(threadId, entry);
      while (threadCache.size > MAX_CACHE_ENTRIES) {
        var oldestKey = threadCache.keys().next().value;
        threadCache.delete(oldestKey);
      }
    }
    function isDiagTarget(rawUrl) {
      if (!rawUrl) return false;
      try {
        var u = new URL(rawUrl, location.href);
        var host = u.hostname.toLowerCase();
        if (host !== "google.com" && host !== "www.google.com") return false;
        var s = u.href;
        if (s.indexOf(".js") !== -1) return false;
        if (s.indexOf(".css") !== -1) return false;
        if (s.indexOf(".png") !== -1) return false;
        if (s.indexOf(".svg") !== -1) return false;
        if (s.indexOf(".woff") !== -1) return false;
        if (s.indexOf("gstatic") !== -1) return false;
        if (s.indexOf("googleapis") !== -1) return false;
        if (s.indexOf("_next/static") !== -1) return false;
        return true;
      } catch (e) {
        return false;
      }
    }
    function diagPreview(txt) {
      if (!txt) return "";
      if (txt.indexOf(")]}'") === 0) {
        var rest = txt.slice(4).replace(/^\s+/, "");
        var idx = -1;
        for (var i = 0; i < rest.length; i++) {
          if (rest[i] === "{" || rest[i] === "[") {
            idx = i;
            break;
          }
        }
        if (idx >= 0) rest = rest.slice(idx);
        return rest.slice(0, 300);
      }
      return txt.slice(0, 300);
    }
    function rawSnippet(txt, limit) {
      var n = typeof limit === "number" && limit > 0 ? limit : 120;
      if (!txt) return "";
      var s = String(txt).replace(/\s+/g, " ").trim();
      return s.length > n ? s.slice(0, n) + "\u2026" : s;
    }
    function gsaDiagTurnsShape(turns) {
      var n = 0, empty = 0, userLen = 0, asstLen = 0, maxLen = 0;
      try {
        n = turns && turns.length ? turns.length : 0;
        for (var i = 0; i < n; i++) {
          var t = turns[i] || {};
          var u = t.userText == null ? "" : String(t.userText).trim();
          var a = t.assistantText == null ? "" : String(t.assistantText).trim();
          if (!u && !a) empty++;
          userLen += u.length;
          asstLen += a.length;
          if (u.length > maxLen) maxLen = u.length;
          if (a.length > maxLen) maxLen = a.length;
        }
      } catch (eShape) {
      }
      return "turns=" + n + " empty=" + empty + " userLen=" + userLen + " asstLen=" + asstLen + " maxLen=" + maxLen;
    }
    function gsaDiagBaseWrite(path, turns, verdict, tid, extra) {
      try {
        if (typeof aiCmDiagOn !== "function" || !aiCmDiagOn()) return false;
        if (typeof aiCmDiagLine !== "function") return false;
        var f = {
          path,
          verdict,
          tid: tid || "(\u043F\u0443\u0441\u0442\u043E)",
          doc: typeof aiCmDiagDocKind === "function" ? aiCmDiagDocKind() : "unknown",
          shape: gsaDiagTurnsShape(turns),
          activeTid: baseThreadId || "",
          domTid: readDomThreadId() || "",
          baseTurns: lastFullTurns.length
        };
        if (extra) {
          for (var k in extra) {
            if (Object.prototype.hasOwnProperty.call(extra, k)) f[k] = extra[k];
          }
        }
        return aiCmDiagLine("gsa-base-write", f);
      } catch (eDiagWrite) {
        return false;
      }
    }
    function gsaDiagState(point, verdict, reason, extra) {
      try {
        if (typeof aiCmDiagOn !== "function" || !aiCmDiagOn()) return false;
        if (typeof aiCmDiagLine !== "function") return false;
        var f = {
          point,
          verdict,
          reason,
          doc: typeof aiCmDiagDocKind === "function" ? aiCmDiagDocKind() : "unknown",
          activeTid: baseThreadId || "",
          domTid: readDomThreadId() || "",
          baseTurns: lastFullTurns.length
        };
        if (extra) {
          for (var k in extra) {
            if (Object.prototype.hasOwnProperty.call(extra, k)) f[k] = extra[k];
          }
        }
        return aiCmDiagLine("gsa-state", f);
      } catch (eDiagStateG) {
        return false;
      }
    }
    var lastDiagSwitchSig = "";
    function gsaDiagVs(point, fields) {
      try {
        if (typeof aiCmDiagOn !== "function" || !aiCmDiagOn()) return false;
        if (typeof aiCmDiagLine !== "function") return false;
        var f = {
          point,
          site: "google_search",
          doc: typeof aiCmDiagDocKind === "function" ? aiCmDiagDocKind() : "unknown",
          activeTid: baseThreadId || "",
          domTid: readDomThreadId() || ""
        };
        if (fields) {
          for (var k in fields) {
            if (Object.prototype.hasOwnProperty.call(fields, k)) f[k] = fields[k];
          }
        }
        return aiCmDiagLine(point, f);
      } catch (eDiagVs) {
        return false;
      }
    }
    function describeFolwrPage(resp, txt, newTurns, cursor, sentCursor) {
      var body = txt == null ? "" : String(txt);
      var cls = null;
      try {
        if (window.GoogleFolwrUtils && window.GoogleFolwrUtils.classifyFolwrContinuation) {
          cls = window.GoogleFolwrUtils.classifyFolwrContinuation({
            ok: !!(resp && resp.ok),
            status: resp && resp.status || 0,
            bodyLength: body.length,
            newTurns,
            cursor,
            sentCursor
          });
        }
      } catch (e) {
      }
      if (!cls) {
        cls = {
          kind: "no-classifier",
          complete: false,
          canContinue: false,
          log: "kind=no-classifier status=" + (resp && resp.status || 0) + " ok=" + (resp && resp.ok ? 1 : 0) + " len=" + body.length + "B \u0445\u043E\u0434\u043E\u0432=+" + (newTurns || 0)
        };
      }
      var line = cls.log + ' raw="' + rawSnippet(body, 120) + '"' + (resp && resp.url ? ' finalUrl="' + rawSnippet(resp.url, 160) + '"' : "");
      return { cls, line };
    }
    function extractModel(htmlText) {
      try {
        var re = new RegExp("model:\\s*&quot;([A-Za-z0-9.\\-]+)&quot;", "g");
        var match;
        var lastModel = null;
        while ((match = re.exec(htmlText)) !== null) {
          lastModel = match[1];
        }
        return lastModel;
      } catch (e) {
        return null;
      }
    }
    function readDomThreadId() {
      try {
        var el = document.querySelector("[data-session-thread-id]");
        if (el) {
          var v = el.getAttribute("data-session-thread-id");
          return v ? v.trim() : "";
        }
      } catch (e) {
      }
      return "";
    }
    function isRawXssiPayload(s) {
      if (!s || s.length < 4) return false;
      return s.charCodeAt(0) === 41 && s.charCodeAt(1) === 93 && s.charCodeAt(2) === 125 && s.charCodeAt(3) === 39;
    }
    function isUsableTurn(t) {
      if (!t) return false;
      var u = t.userText == null ? "" : String(t.userText).trim();
      var a = t.assistantText == null ? "" : String(t.assistantText).trim();
      return !!(u || a);
    }
    function hasUsableTurns(turns) {
      if (!turns || !turns.length) return false;
      for (var i = 0; i < turns.length; i++) {
        if (isUsableTurn(turns[i])) return true;
      }
      return false;
    }
    function isGarbageBody(bodyText, turns) {
      if (!isRawXssiPayload(bodyText)) return false;
      return !hasUsableTurns(turns);
    }
    function gsaTurnKeyOfLocal(turn) {
      if (!turn) return "";
      function squash(s) {
        return String(s == null ? "" : s).toLowerCase().replace(/\u00a0/g, " ").replace(/[^a-zа-яё0-9]+/g, "");
      }
      function wrapperOf(text) {
        var s = String(text == null ? "" : text);
        var head = s.slice(0, 96);
        var at = head.indexOf(":");
        if (at === -1) return null;
        var m = /^\s*"/.exec(head.slice(at + 1));
        if (!m) return null;
        var rest = s.slice(at + 1 + m[0].length);
        var close = rest.indexOf('"');
        if (close === -1) return null;
        var tail = rest.slice(close + 1).replace(/^["»”']{0,2}/, "").replace(/^[\s.,:;-]{0,4}/, "");
        if (!tail.replace(/\s+/g, "").length) return null;
        var question = rest.slice(0, close).trim();
        if (!question) return null;
        return { question, body: tail.replace(/^[\s.,:;-]+/, "") };
      }
      var w = wrapperOf(turn.assistantText);
      var u = squash(turn.userText);
      if (!u && w) u = squash(w.question);
      var a = squash(w ? w.body : turn.assistantText);
      return u + "||" + a;
    }
    function gsaTurnKey(turn) {
      try {
        if (window.GoogleFolwrUtils && typeof window.GoogleFolwrUtils.canonicalTurnKeyOf === "function") {
          var k = window.GoogleFolwrUtils.canonicalTurnKeyOf(turn);
          if (typeof k === "string" && k) return k;
        }
      } catch (e) {
      }
      return gsaTurnKeyOfLocal(turn);
    }
    function seedSeenKeys(turns) {
      seenKeys = {};
      for (var i = 0; i < turns.length; i++) {
        var key = gsaTurnKey(turns[i]);
        if (key && key !== "||") seenKeys[key] = true;
      }
      return seenKeys;
    }
    function dedupeTurnsForCache(turns) {
      var list = Array.isArray(turns) ? turns : [];
      try {
        if (window.GoogleFolwrUtils && typeof window.GoogleFolwrUtils.dedupeTurns === "function") {
          var deduped = window.GoogleFolwrUtils.dedupeTurns(list);
          if (Array.isArray(deduped)) return deduped;
        }
      } catch (e) {
        deduped = null;
      }
      var seen = {};
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var key = gsaTurnKey(list[i]);
        if (key && key !== "||") {
          if (seen[key]) continue;
          seen[key] = true;
        }
        out.push(list[i]);
      }
      return out;
    }
    function messagesFromTurns(turns) {
      var msgs = [];
      for (var i = 0; i < turns.length; i++) {
        var t = turns[i];
        if (t.userText) msgs.push({ role: "user", text: t.userText });
        if (t.assistantText) msgs.push({ role: "assistant", text: t.assistantText });
      }
      return msgs;
    }
    function buildDetail(turns, messages, threadId, historyComplete) {
      if (!messages) messages = messagesFromTurns(turns);
      var messageTexts = messages.map(function(m) {
        return m.text;
      });
      var messageIds = [];
      for (var i = 0; i < turns.length; i++) {
        var t = turns[i];
        if (t.userText) messageIds.push(t.id + "_user");
        if (t.assistantText) messageIds.push(t.id + "_assistant");
      }
      var text = messageTexts.join("\n");
      return {
        convId: "",
        threadId: threadId || "",
        text,
        count: messageTexts.length,
        effectiveLen: text.length,
        lastMessageText: messageTexts.length ? messageTexts[messageTexts.length - 1] : "",
        modelSlug: detectedModelSlug || "",
        messageTexts,
        messageIds,
        messages,
        attachTokens: 0,
        attachBreak: { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 },
        // O-32: полнота — ДОКАЗАННОЕ свойство, а не дефолт. Было `historyComplete !== false`:
        // вызов без третьего аргумента (все DOM-доборы и накопительные merge) помечал снимок
        // ПОЛНЫМ, и content.js взводил baseComplete=true по неполной базе — гейт автоэкспорта
        // и метрики работали по недоказанной полноте. Теперь true только при явном вердикте
        // (probe-классификатор classifyFolwrContinuation → applyTurns(..., true)).
        historyComplete: historyComplete === true
      };
    }
    function emitDetail(detail) {
      try {
        if (typeof aiCmDiagLine === "function") {
          aiCmDiagLine("gsa-net-finalize", {
            ts: Date.now(),
            path: "emitDetail",
            threadId: detail && detail.threadId || "",
            msgs: detail && typeof detail.count === "number" ? detail.count : 0,
            textLen: detail && typeof detail.text === "string" ? detail.text.length : 0,
            historyComplete: detail && detail.historyComplete === true ? 1 : 0,
            activeTid: baseThreadId || "",
            domTid: readDomThreadId() || ""
          });
        }
      } catch (eNetFin) {
      }
      try {
        if (typeof aiCmDiagLine === "function") {
          var fpKeys = [];
          var fpTurns = detail && Array.isArray(detail.messageTexts) && Array.isArray(detail.messages) ? detail.messages : [];
          for (var fpI = 0; fpI < fpTurns.length; fpI++) {
            var fpM = fpTurns[fpI] || {};
            if (fpM.role === "user") {
              var fpNext = fpTurns[fpI + 1] || {};
              fpKeys.push(gsaTurnKey({
                userText: detail.messageTexts[fpI] == null ? null : detail.messageTexts[fpI],
                assistantText: fpNext.role === "assistant" && detail.messageTexts[fpI + 1] != null ? detail.messageTexts[fpI + 1] : null
              }));
              if (fpNext.role === "assistant") fpI++;
            } else {
              fpKeys.push(gsaTurnKey({ userText: null, assistantText: detail.messageTexts[fpI] == null ? null : detail.messageTexts[fpI] }));
            }
          }
          fpKeys.sort();
          var fpJoined = fpKeys.join("");
          var fpH = 2166136261;
          for (var fpC = 0; fpC < fpJoined.length; fpC++) {
            fpH ^= fpJoined.charCodeAt(fpC);
            fpH = Math.imul(fpH, 16777619) >>> 0;
          }
          aiCmDiagLine("gsa-thread-fingerprint", {
            threadId: detail && detail.threadId || "",
            hash: ("0000000" + fpH.toString(16)).slice(-8),
            count: fpKeys.length > 0 ? fpKeys.length : detail && detail.count || 0,
            msgs: detail && typeof detail.count === "number" ? detail.count : 0,
            textLen: detail && typeof detail.text === "string" ? detail.text.length : 0,
            historyComplete: detail && detail.historyComplete === true ? 1 : 0,
            activeTid: baseThreadId || ""
          });
        }
      } catch (eFp) {
      }
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", { detail }));
      } catch (e) {
      }
    }
    function isForeignThread(tid) {
      if (!tid) return false;
      var domTid = readDomThreadId();
      if (domTid) return tid !== domTid;
      if (currentThreadId) return tid !== currentThreadId;
      if (baseThreadId) return tid !== baseThreadId;
      return false;
    }
    function segmentTurnsOf(tid) {
      var seg = tid ? threadCache.get(tid) : null;
      return seg && Array.isArray(seg.turns) ? seg.turns : [];
    }
    function activateThread(tid) {
      tid = tid || "";
      if (tid === baseThreadId) return false;
      var prevBaseTid = baseThreadId;
      baseThreadId = tid;
      var seg = tid ? threadCache.get(tid) : null;
      lastFullTurns = seg && Array.isArray(seg.turns) ? seg.turns.slice() : [];
      lastFullMessages = seg && Array.isArray(seg.messages) ? seg.messages.slice() : [];
      lastFullSnapshot = seg && seg.snapshot ? seg.snapshot : null;
      seedSeenKeys(lastFullTurns);
      emittedThreadId = lastFullSnapshot ? tid : "";
      if (typeof gsaDiagState === "function") gsaDiagState("activateThread", "reset", "active-thread-switch", { from: prevBaseTid || "(\u043F\u0443\u0441\u0442\u043E)", to: tid || "(\u043F\u0443\u0441\u0442\u043E)", segTurns: lastFullTurns.length, emitted: emittedThreadId || "(\u043F\u0443\u0441\u0442\u043E)" });
      debugLog("log", "[ai-cm-google-search] \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440 \u2192 " + (tid || "(\u043F\u0443\u0441\u0442\u043E)") + ", \u0445\u043E\u0434\u043E\u0432=" + lastFullTurns.length);
      return true;
    }
    function absorbForeignSnapshot(tid, turns, complete) {
      if (!isForeignThread(tid)) return false;
      if (turns && turns.length > 0) {
        var mergeFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsById || function(a, b) {
          return a.concat(b);
        };
        var segTurns = mergeFn(segmentTurnsOf(tid), turns);
        var segMsgs = messagesFromTurns(segTurns);
        cacheSet(tid, {
          turns: segTurns,
          messages: segMsgs,
          snapshot: buildDetail(segTurns, segMsgs, tid, complete === true)
        });
      }
      debugLog("log", "[ai-cm-google-search] \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D: tid=" + tid + ", \u0445\u043E\u0434\u043E\u0432=" + (turns && turns.length || 0) + ", \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439=" + (baseThreadId || "(\u043F\u0443\u0441\u0442\u043E)"));
      return true;
    }
    function applySnapshot(parsed, threadId) {
      if (!parsed || !parsed.turns || parsed.turns.length === 0) return;
      var rawTurns = parsed.turns.slice();
      lastFullTurns = dedupeTurnsForCache(rawTurns);
      lastFullMessages = lastFullTurns.length === rawTurns.length && Array.isArray(parsed.messages) ? parsed.messages.slice() : messagesFromTurns(lastFullTurns);
      seedSeenKeys(lastFullTurns);
      lastFullSnapshot = buildDetail(lastFullTurns, lastFullMessages, threadId);
      emittedThreadId = threadId || "";
      if (threadId) cacheSet(threadId, { turns: lastFullTurns, messages: lastFullMessages, snapshot: lastFullSnapshot });
    }
    function mergeStreamTurns(streamTurns, threadId) {
      var merged = [];
      var seen = {};
      function addTurn(t) {
        var key = gsaTurnKey(t);
        if (key !== "||" && seen[key]) return;
        seen[key] = true;
        merged.push({ id: t && t.id || "x" + merged.length, userText: t ? t.userText : null, assistantText: t ? t.assistantText : null });
      }
      for (var i = 0; i < lastFullTurns.length; i++) addTurn(lastFullTurns[i]);
      for (var j = 0; j < streamTurns.length; j++) addTurn(streamTurns[j]);
      lastFullTurns = dedupeTurnsForCache(merged);
      seedSeenKeys(lastFullTurns);
      lastFullMessages = messagesFromTurns(lastFullTurns);
      lastFullSnapshot = buildDetail(lastFullTurns, lastFullMessages, threadId || currentThreadId || emittedThreadId);
      emittedThreadId = lastFullSnapshot.threadId || "";
      if (emittedThreadId) cacheSet(emittedThreadId, { turns: lastFullTurns, messages: lastFullMessages, snapshot: lastFullSnapshot });
      emitDetail(lastFullSnapshot);
    }
    function mergeTurns(newTurns, isFull, tidOfResponse, bodyText) {
      if (isGarbageBody(bodyText, newTurns)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("mergeTurns", newTurns, "reject", tidOfResponse, { full: isFull === true ? 1 : 0, validation: "hasUsableTurns=false", reason: "xssi-prefix" });
        debugLog("log", "[ai-cm-google-search] O-27: \u0444\u043E\u0440\u043C\u0430 \u043C\u0443\u0441\u043E\u0440\u0430 (XSSI-\u043F\u0440\u0435\u0444\u0438\u043A\u0441 \u0431\u0435\u0437 \u043F\u043E\u043B\u0435\u0437\u043D\u043E\u0433\u043E payload) \u2014 \u0431\u0430\u0437\u0430 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u0430 (merge, \u0445\u043E\u0434\u043E\u0432=" + (newTurns && newTurns.length || 0) + ")");
        return;
      }
      if (!hasUsableTurns(newTurns)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("mergeTurns", newTurns, "reject", tidOfResponse, { full: isFull === true ? 1 : 0, validation: "hasUsableTurns=false" });
        debugLog("log", "[ai-cm-google-search] O-27: \u0442\u0435\u043B\u043E \u0431\u0435\u0437 \u043D\u0435\u043F\u0443\u0441\u0442\u044B\u0445 \u0445\u043E\u0434\u043E\u0432 \u2014 \u0431\u0430\u0437\u0430 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u0430 (merge, \u0445\u043E\u0434\u043E\u0432=" + (newTurns && newTurns.length || 0) + ")");
        return;
      }
      var threadId = tidOfResponse || readDomThreadId() || currentThreadId || emittedThreadId;
      if (absorbForeignSnapshot(threadId, newTurns, false)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("mergeTurns", newTurns, "foreign-not-applied", threadId, { full: isFull === true ? 1 : 0 });
        return;
      }
      activateThread(threadId);
      if (isFull) {
        if (lastFullTurns.length > 0 && newTurns.length < lastFullTurns.length) {
          mergeStreamTurns(newTurns, threadId);
          return;
        }
        lastFullTurns = newTurns.slice();
        seedSeenKeys(lastFullTurns);
      } else {
        for (var j = 0; j < newTurns.length; j++) {
          var nt = newTurns[j];
          var key2 = gsaTurnKey(nt);
          if (key2 === "||") continue;
          if (!seenKeys[key2]) {
            seenKeys[key2] = true;
            lastFullTurns.push(nt);
          }
        }
      }
      lastFullTurns = dedupeTurnsForCache(lastFullTurns);
      seedSeenKeys(lastFullTurns);
      lastFullMessages = messagesFromTurns(lastFullTurns);
      if (lastFullTurns.length > 0) {
        lastFullSnapshot = buildDetail(lastFullTurns, lastFullMessages, threadId);
        emittedThreadId = lastFullSnapshot.threadId || "";
        if (emittedThreadId) cacheSet(emittedThreadId, { turns: lastFullTurns, messages: lastFullMessages, snapshot: lastFullSnapshot });
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("mergeTurns", lastFullTurns, "accept", threadId, { full: isFull === true ? 1 : 0, incoming: newTurns && newTurns.length || 0, emitted: emittedThreadId || "" });
        emitDetail(lastFullSnapshot);
      } else if (typeof gsaDiagBaseWrite === "function") {
        gsaDiagBaseWrite("mergeTurns", newTurns, "accept-empty-base", threadId, { full: isFull === true ? 1 : 0, incoming: newTurns && newTurns.length || 0 });
      }
    }
    function parseWithParser(htmlText) {
      try {
        if (window.parseGoogleFolwrOpen) {
          var p = window.parseGoogleFolwrOpen(htmlText);
          if (p && p.turns && p.turns.length > 0) {
            return p;
          }
        }
      } catch (e) {
      }
      var turns = parseTurns(htmlText);
      var messages = messagesFromTurns(turns);
      return {
        threadId: readDomThreadId(),
        turns,
        messages,
        text: messages.map(function(m) {
          return m.text;
        }).join("\n"),
        count: messages.length
      };
    }
    function parseTurns(htmlText) {
      var doc;
      try {
        doc = new DOMParser().parseFromString(htmlText, "text/html");
      } catch (e) {
        return [];
      }
      var turns = doc.querySelectorAll('[data-scope-id="turn"]');
      var allAimfl = doc.querySelectorAll('[data-subtree="aimfl"]');
      var allN6 = doc.querySelectorAll(".n6owBd.awi2gc");
      var questions = [];
      for (var i = 0; i < turns.length; i++) {
        var h2 = turns[i].querySelector("h2.iMqumd");
        var questionText = null;
        if (h2) {
          var raw = h2.textContent.trim();
          var match = raw.match(/^Вы сказали:\s*"([\s\S]*)"$/);
          questionText = match ? match[1].trim() : raw;
        }
        questions.push(questionText);
      }
      var answers = [];
      for (var ti = 0; ti < turns.length; ti++) answers[ti] = [];
      var blocks = doc.querySelectorAll(".n6owBd.awi2gc");
      for (var b = 0; b < blocks.length; b++) {
        var block = blocks[b];
        var assignedIdx = -1;
        for (var ti2 = 0; ti2 < turns.length; ti2++) {
          if (turns[ti2].compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) {
            assignedIdx = ti2;
          } else break;
        }
        if (assignedIdx >= 0 && assignedIdx < turns.length) {
          var cloneBlock = block.cloneNode(true);
          cloneBlock.querySelectorAll("script, style, button, svg").forEach(function(el) {
            el.remove();
          });
          var blockText = cloneBlock.textContent.trim();
          if (blockText) answers[assignedIdx].push(blockText);
        }
      }
      var assistantTexts = [];
      for (var ti3 = 0; ti3 < turns.length; ti3++) {
        var joined = answers[ti3].length > 0 ? answers[ti3].join("\n\n") : null;
        if (!joined && allAimfl[ti3]) {
          var aimText = allAimfl[ti3].textContent.trim();
          if (aimText) joined = aimText;
        }
        assistantTexts.push(joined);
      }
      var result = [];
      var count = questions.length;
      for (var k = 0; k < count; k++) {
        result.push({
          id: turns[k] && turns[k].getAttribute("jsuid") || "idx" + k,
          userText: questions[k] || null,
          assistantText: assistantTexts[k] || null
        });
      }
      var needTgBackfill = false;
      for (var bi = 0; bi < result.length; bi++) {
        if (!result[bi].userText) {
          needTgBackfill = true;
          break;
        }
      }
      if (needTgBackfill) {
        var commentQuestions = [];
        try {
          var tgReB = /<!--TgQPHd\|[\s\S]*?-->/g;
          var tgMatchB;
          while ((tgMatchB = tgReB.exec(htmlText)) !== null) {
            var commentB = tgMatchB[0];
            commentB = commentB.replace(new RegExp("&quot;", "g"), '"');
            commentB = commentB.replace(new RegExp("&amp;", "g"), "&");
            var longStrReB = /"([^"]{20,})"/g;
            var longMatchB, foundB = null;
            while ((longMatchB = longStrReB.exec(commentB)) !== null) {
              var candidateB = longMatchB[1];
              if (candidateB.indexOf("\\u0026") !== -1) continue;
              if (candidateB.indexOf("OLOoOd") !== -1) continue;
              if (candidateB.indexOf("dRog6c") !== -1) continue;
              if (candidateB.indexOf("TgQPHd") !== -1) continue;
              if (!/[а-яёА-ЯЁ]/.test(candidateB) && candidateB.indexOf(" ") === -1) continue;
              foundB = candidateB;
              break;
            }
            commentQuestions.push(foundB);
          }
        } catch (e) {
        }
        var cqi = 0;
        for (var bi2 = 0; bi2 < result.length; bi2++) {
          if (!result[bi2].userText && cqi < commentQuestions.length && commentQuestions[cqi]) {
            result[bi2].userText = commentQuestions[cqi];
            cqi++;
          }
        }
      }
      if (result.length === 0) {
        try {
          var tgRe2 = /<!--TgQPHd\|[\s\S]*?-->/g;
          var tgMatch2;
          var folifQuestion = null;
          while ((tgMatch2 = tgRe2.exec(htmlText)) !== null) {
            var comment = tgMatch2[0];
            comment = comment.replace(new RegExp("&quot;", "g"), '"');
            comment = comment.replace(new RegExp("&amp;", "g"), "&");
            var longStrRe2 = /"([^"]{20,})"/g;
            var longMatch2;
            while ((longMatch2 = longStrRe2.exec(comment)) !== null) {
              var candidate = longMatch2[1];
              if (candidate.indexOf("\\u0026") !== -1) continue;
              if (candidate.indexOf("OLOoOd") !== -1) continue;
              if (candidate.indexOf("dRog6c") !== -1) continue;
              if (candidate.indexOf("TgQPHd") !== -1) continue;
              if (!/[а-яёА-ЯЁ]/.test(candidate) && candidate.indexOf(" ") === -1) continue;
              folifQuestion = candidate;
              break;
            }
          }
          var folifAnswer = null;
          if (allAimfl.length > 0) {
            for (var aa = 0; aa < allAimfl.length; aa++) {
              var atext = allAimfl[aa].textContent.trim();
              if (atext) {
                folifAnswer = atext;
                break;
              }
            }
          }
          if (!folifAnswer && allN6.length > 0) {
            for (var bb = 0; bb < allN6.length; bb++) {
              var clone2 = allN6[bb].cloneNode(true);
              clone2.querySelectorAll("script, style, button, svg").forEach(function(el) {
                el.remove();
              });
              var ntext = clone2.textContent.trim();
              if (ntext) {
                folifAnswer = ntext;
                break;
              }
            }
          }
          if (folifQuestion || folifAnswer) {
            result.push({ id: "folif_" + Date.now(), userText: folifQuestion, assistantText: folifAnswer });
          }
        } catch (e) {
        }
      }
      return result;
    }
    function authUserFromUrl(rawUrl) {
      try {
        var u = new URL(rawUrl, location.href);
        var a = u.searchParams.get("authuser");
        if (a != null && a !== "") return a;
      } catch (e) {
      }
      try {
        return new URL(location.href).searchParams.get("authuser") || "";
      } catch (e) {
        return "";
      }
    }
    function threadAuthKey(threadId, rawUrl) {
      return (threadId || "") + "|" + authUserFromUrl(rawUrl);
    }
    function urlWithMstk(rawUrl, cursor) {
      if (!cursor) return rawUrl;
      try {
        var u = new URL(rawUrl, location.href);
        u.searchParams.set("mstk", cursor);
        return u.href;
      } catch (e) {
        return rawUrl;
      }
    }
    var folwrRunAtMap = {};
    var folwrNoGainMap = {};
    var folwrRunLiveMap = {};
    var folwrRunLastVerdict = {};
    var folwrGainSeenAtMap = {};
    function gsaDiagLoopGuard(path, tid, key, sincePrevRunMs, gained, verdict, reason) {
      try {
        if (typeof aiCmDiagOn !== "function" || !aiCmDiagOn()) return false;
        if (typeof aiCmDiagLine !== "function") return false;
        return aiCmDiagLine("gsa-loop-guard", {
          path,
          threadId: tid || "(\u043F\u0443\u0441\u0442\u043E)",
          key: key || "",
          sincePrevRunMs: typeof sincePrevRunMs === "number" ? sincePrevRunMs : -1,
          gained: typeof gained === "number" ? gained : 0,
          inFlight: folwrRunLiveMap[key] || 0,
          noGain: folwrNoGainMap[key] ? 1 : 0,
          verdict,
          reason: reason || ""
        });
      } catch (eDiagLoop) {
        return false;
      }
    }
    function folwrRunSince(prev) {
      var p = parseFloat(prev);
      if (!(p >= 0)) return -1;
      return Math.max(0, Math.round(Date.now() - p));
    }
    function folwrRunPermit(path, tid, key, opts) {
      var prev = folwrRunAtMap[key];
      var elapsed = folwrRunSince(prev);
      var priorNoGain = !!folwrNoGainMap[key];
      var cooldown = priorNoGain ? Math.max(FOLWR_NO_GAIN_COOLDOWN_MS, FOLWR_RUN_MIN_COOLDOWN_MS) : FOLWR_RUN_MIN_COOLDOWN_MS;
      var verdict = "start";
      var reason = "";
      if (folwrRunLiveMap[key]) {
        verdict = "suppress";
        reason = "run-in-flight";
      } else if (prev != null && elapsed < cooldown) {
        verdict = "suppress";
        reason = priorNoGain ? "no-gain-cooldown" : "cooldown";
      }
      var force = !!(opts && opts.growthPriority && opts.gained > 0);
      if (force) {
        verdict = "start";
        reason = "gain-priority";
      }
      var gained = typeof (opts && opts.gained) === "number" ? opts.gained : 0;
      gsaDiagLoopGuard(path, tid, key, elapsed, gained, verdict, reason);
      if (verdict !== "start") {
        folwrRunLastVerdict[key] = reason;
        return { permit: false, elapsed, reason, forced: false, key, tid };
      }
      delete folwrRunLastVerdict[key];
      if (prev != null && gained <= 0 && !(opts && opts.recordNoGain === false)) folwrNoGainMap[key] = Date.now();
      return { permit: true, elapsed, reason, forced: force, key, tid };
    }
    function beginFolwrRun(path, tid, key, opts) {
      var d = folwrRunPermit(path, tid, key, opts);
      if (d.permit) {
        folwrRunAtMap[key] = Date.now();
        folwrRunLiveMap[key] = (folwrRunLiveMap[key] || 0) + 1;
      }
      return d;
    }
    function endFolwrRun(key) {
      if (!key) return;
      var live = (folwrRunLiveMap[key] || 0) - 1;
      if (live > 0) folwrRunLiveMap[key] = live;
      else delete folwrRunLiveMap[key];
    }
    function markFolwrRunGain(key) {
      if (!key) return false;
      delete folwrRunAtMap[key];
      delete folwrNoGainMap[key];
      delete folwrRunLastVerdict[key];
      folwrGainSeenAtMap[key] = Date.now();
      return true;
    }
    function applyTurns(turns, tid, historyComplete, bodyText) {
      if (!turns || turns.length === 0) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("applyTurns", turns, "reject-empty", tid, { complete: historyComplete === true ? 1 : 0 });
        return;
      }
      if (isGarbageBody(bodyText, turns)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("applyTurns", turns, "reject", tid, { complete: historyComplete === true ? 1 : 0, validation: "hasUsableTurns=false", reason: "xssi-prefix" });
        debugLog("log", "[ai-cm-google-search] O-27: \u0444\u043E\u0440\u043C\u0430 \u043C\u0443\u0441\u043E\u0440\u0430 (XSSI-\u043F\u0440\u0435\u0444\u0438\u043A\u0441 \u0431\u0435\u0437 \u043F\u043E\u043B\u0435\u0437\u043D\u043E\u0433\u043E payload) \u2014 \u0431\u0430\u0437\u0430 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u0430 (apply, \u0445\u043E\u0434\u043E\u0432=" + turns.length + ", complete=" + (historyComplete === true ? 1 : 0) + ")");
        return;
      }
      if (!hasUsableTurns(turns)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("applyTurns", turns, "reject", tid, { complete: historyComplete === true ? 1 : 0, validation: "hasUsableTurns=false" });
        debugLog("log", "[ai-cm-google-search] O-27: \u0442\u0435\u043B\u043E \u0431\u0435\u0437 \u043D\u0435\u043F\u0443\u0441\u0442\u044B\u0445 \u0445\u043E\u0434\u043E\u0432 \u2014 \u0431\u0430\u0437\u0430 \u043D\u0435 \u0442\u0440\u043E\u043D\u0443\u0442\u0430 (apply, \u0445\u043E\u0434\u043E\u0432=" + turns.length + ", complete=" + (historyComplete === true ? 1 : 0) + ")");
        return;
      }
      if (absorbForeignSnapshot(tid, turns, historyComplete)) {
        if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("applyTurns", turns, "foreign-not-applied", tid, { complete: historyComplete === true ? 1 : 0 });
        return;
      }
      activateThread(tid);
      var unionFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsMonotone || function(a, b) {
        return a.concat(b);
      };
      lastFullTurns = unionFn(lastFullTurns, turns);
      lastFullMessages = messagesFromTurns(lastFullTurns);
      seedSeenKeys(lastFullTurns);
      lastFullSnapshot = buildDetail(lastFullTurns, lastFullMessages, tid, historyComplete);
      emittedThreadId = tid || "";
      if (tid) cacheSet(tid, { turns: lastFullTurns, messages: lastFullMessages, snapshot: lastFullSnapshot });
      if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("applyTurns", lastFullTurns, "accept", tid, { complete: historyComplete === true ? 1 : 0, emitted: emittedThreadId || "", baseComplete: lastFullSnapshot && lastFullSnapshot.historyComplete === true ? 1 : 0, validation: "hasUsableTurns=true" });
      emitDetail(lastFullSnapshot);
    }
    function followFolwrPagination(startUrl, startTurns, tid, firstCursor, gainedIn) {
      if (!startUrl || !firstCursor) return;
      var key = threadAuthKey(tid, startUrl);
      var gate = beginFolwrRun("pagination", tid, key, { gained: typeof gainedIn === "number" ? gainedIn : 0 });
      if (!gate.permit) return;
      var merged = Array.isArray(startTurns) ? startTurns.slice() : [];
      var mergeFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsById || function(a, b) {
        return a.concat(b);
      };
      var extractToken = window.GoogleFolwrUtils && window.GoogleFolwrUtils.extractContinuationToken || function() {
        return null;
      };
      var added = 0;
      var pages = 0;
      var accounted = 0;
      function accountGain() {
        if (added > accounted) {
          accounted = added;
          markFolwrRunGain(key);
        }
      }
      function finish() {
        activeFolwrInFlight[key] = false;
        endFolwrRun(key);
        if (added > 0) {
          accountGain();
          console.log("[ai-cm-google-search] \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F folwr: \u0434\u043E\u0441\u0431\u043E\u0440=" + added + " \u0445\u043E\u0434\u043E\u0432, \u0441\u0442\u0440\u0430\u043D\u0438\u0446=" + pages + ", \u0438\u0442\u043E\u0433\u043E=" + lastFullTurns.length);
        } else {
          vsDispatch("pagination-empty");
        }
      }
      function step(nextCursor) {
        if (!nextCursor) {
          finish();
          return;
        }
        if (!ownRequestsAllowed()) {
          console.log("[ai-cm-google-search] \u0434\u043E\u0441\u0431\u043E\u0440 \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D: cooldown 429/sorry \u0430\u043A\u0442\u0438\u0432\u0435\u043D");
          activeFolwrInFlight[key] = false;
          endFolwrRun(key);
          return;
        }
        if (pages >= FOLWR_MAX_PAGES - 1) {
          if (added > 0) {
            console.log("[ai-cm-google-search] \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F folwr: \u043B\u0438\u043C\u0438\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446, \u0434\u043E\u0441\u0431\u043E\u0440=" + added + ", \u0438\u0442\u043E\u0433\u043E=" + lastFullTurns.length);
          }
          activeFolwrInFlight[key] = false;
          endFolwrRun(key);
          return;
        }
        if (activeFolwrInFlight[key]) return;
        activeFolwrInFlight[key] = true;
        pages++;
        window.fetch(urlWithMstk(startUrl, nextCursor), { credentials: "include" }).then(function(resp) {
          if (isSorryResponse(resp && resp.status, resp && resp.url)) {
            triggerSorryCooldown();
            activeFolwrInFlight[key] = false;
            endFolwrRun(key);
            return null;
          }
          if (!resp) return { resp: null, txt: "" };
          return resp.text().then(function(t) {
            return { resp, txt: t || "" };
          }, function() {
            return { resp, txt: "" };
          });
        }).then(function(page) {
          activeFolwrInFlight[key] = false;
          if (!page) return;
          var txt = page.txt;
          var parsed = parseWithParser(txt);
          var before = merged.length;
          merged = mergeFn(merged, parsed.turns);
          var gained = merged.length - before;
          added += gained;
          var cursor = extractToken(txt);
          var pageInfo = describeFolwrPage(page.resp, txt, gained, cursor, nextCursor);
          console.log("[ai-cm-google-search] \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F folwr \u0448\u0430\u0433 " + pages + ": " + pageInfo.line);
          debugLog("log", "[ai-cm-google-search] \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F folwr \u0448\u0430\u0433 " + pages + " raw(" + txt.length + "B): " + diagPreview(txt));
          if (gained > 0) {
            if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("pagination", merged, "submit", tid, { page: pages, gained, kind: pageInfo.cls.kind, cursor: cursor ? cursor.slice(0, 12) : "\u043D\u0435\u0442" });
            applyTurns(merged, tid, false, txt);
            accountGain();
          } else if (typeof gsaDiagBaseWrite === "function") {
            gsaDiagBaseWrite("pagination", parsed.turns, "skip-no-gain", tid, { page: pages, gained: 0, kind: pageInfo.cls.kind, cursor: cursor ? cursor.slice(0, 12) : "\u043D\u0435\u0442" });
          }
          if (pageInfo.cls.canContinue) {
            setTimeout(function() {
              step(cursor);
            }, FOLWR_PAGE_DELAY_MS);
          } else {
            finish();
          }
        }).catch(function() {
          activeFolwrInFlight[key] = false;
          finish();
        });
      }
      step(firstCursor);
    }
    var VS_MAX_ITERATIONS = 20;
    var VS_STEP_WAIT_MS = 800;
    var VS_STALL_LIMIT = 3;
    var vsActive = null;
    var vsDispatch = function(reason) {
      return virtualScrollBackfill(reason);
    };
    function findChatScroller() {
      try {
        var turns = document.querySelectorAll('[data-scope-id="turn"]');
        var anchor = turns.length ? turns[0] : document.querySelector("[data-session-thread-id]");
        var el = anchor;
        while (el && el !== document.body) {
          if (el.scrollHeight > el.clientHeight + 50) return el;
          el = el.parentElement;
        }
      } catch (e) {
      }
      return null;
    }
    function virtualScrollBackfill(reason) {
      if (vsActive) {
        gsaDiagVs("gsa-vs-reentry", { active: vsActive, verdict: "skip-active", reason });
        return false;
      }
      if (!ownRequestsAllowed()) {
        console.log("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D: cooldown (" + reason + ")");
        return false;
      }
      var scroller = findChatScroller();
      if (!scroller) {
        console.log("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B: \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D (" + reason + ")");
        return false;
      }
      var tid = currentThreadId || emittedThreadId || readDomThreadId();
      vsActive = tid || "(\u043F\u0443\u0441\u0442\u043E)";
      var iterations = 0;
      var stalls = 0;
      var done = false;
      var lastScrollHeight = scroller.scrollHeight;
      var prevOpacity = scroller.style.opacity;
      var prevScrollTop = scroller.scrollTop;
      scroller.style.opacity = "0";
      console.log("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B \u0437\u0430\u043F\u0443\u0449\u0435\u043D (" + reason + ")");
      function restore() {
        scroller.style.opacity = prevOpacity;
        scroller.scrollTop = prevScrollTop;
      }
      function finishVs(logLine) {
        if (done) return;
        done = true;
        vsActive = null;
        restore();
        if (logLine) console.log(logLine);
      }
      function tick() {
        if (iterations >= VS_MAX_ITERATIONS) {
          finishVs("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B: \u043B\u0438\u043C\u0438\u0442 \u0438\u0442\u0435\u0440\u0430\u0446\u0438\u0439, \u0438\u0442\u043E\u0433\u043E=" + lastFullTurns.length);
          return;
        }
        var tidNow = currentThreadId || "";
        if (tidNow !== (tid || "")) {
          if (done) return;
          done = true;
          vsActive = null;
          gsaDiagVs("gsa-vs-thread-mismatch", { expected: tid || "", actual: tidNow, verdict: "abort", reason });
          console.log("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B \u043F\u0440\u0435\u0440\u0432\u0430\u043D: \u0442\u0440\u0435\u0434 \u0441\u043C\u0435\u043D\u0438\u043B\u0441\u044F (" + (tid || "(\u043F\u0443\u0441\u0442\u043E)") + " \u2192 " + (tidNow || "(\u043F\u0443\u0441\u0442\u043E)") + ")");
          return;
        }
        iterations++;
        scroller.scrollTop = 0;
        setTimeout(function() {
          try {
            var h = scroller.scrollHeight;
            if (window.GoogleFolwrUtils && window.GoogleFolwrUtils.extractTurnsFromDocument) {
              var domTurns = window.GoogleFolwrUtils.extractTurnsFromDocument(document);
              if (domTurns.length > lastFullTurns.length) {
                var mergeFn = window.GoogleFolwrUtils.mergeTurnsByKey || function(a, b) {
                  return a.concat(b);
                };
                if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("scroll-backfill", domTurns, "submit", tid, { iterations, stalls, domTurns: domTurns.length, baseTurns: lastFullTurns.length });
                applyTurns(mergeFn(lastFullTurns, domTurns), tid, false);
                stalls = 0;
              } else {
                stalls++;
              }
            } else {
              stalls++;
            }
            if (h === lastScrollHeight && stalls >= VS_STALL_LIMIT) {
              finishVs("[ai-cm-google-search] \u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u043A\u0440\u043E\u043B\u043B \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D: \u0438\u0442\u043E\u0433\u043E=" + lastFullTurns.length + " \u0445\u043E\u0434\u043E\u0432");
              return;
            }
            if (h !== lastScrollHeight) stalls = 0;
            lastScrollHeight = h;
            tick();
          } catch (e) {
            finishVs();
          }
        }, VS_STEP_WAIT_MS);
      }
      tick();
      return true;
    }
    var FOLWR_PROBE_MAX_STEPS = 10;
    var probedTids = {};
    function emitProbeState(running, tid) {
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-gsa-probe-state", {
          detail: { running: running === true, threadId: tid || "" }
        }));
      } catch (e) {
      }
    }
    function probeFolwrCompleteness(startUrl, startTurns, tid, firstCursor, gainedIn) {
      var gateKey = threadAuthKey(tid, startUrl);
      var gate = beginFolwrRun("probe", tid, gateKey, { gained: typeof gainedIn === "number" ? gainedIn : 0 });
      if (!gate.permit) return;
      if (probedTids[tid]) {
        endFolwrRun(gateKey);
        debugLog("log", "[ai-cm-google-search] probe \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D: \u0443\u0436\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u043B\u0441\u044F \u0434\u043B\u044F threadId=" + tid);
        return;
      }
      probedTids[tid] = true;
      console.log("[ai-cm-google-search] probe \u0437\u0430\u043F\u0443\u0449\u0435\u043D: threadId=" + tid);
      emitProbeState(true, tid);
      var key = gateKey;
      var merged = Array.isArray(startTurns) ? startTurns.slice() : [];
      var mergeFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsById || function(a, b) {
        return a.concat(b);
      };
      var extractToken = window.GoogleFolwrUtils && window.GoogleFolwrUtils.extractContinuationToken || function() {
        return null;
      };
      var steps = 0;
      var addedTotal = 0;
      var accounted = 0;
      var done = false;
      var lastBody = "";
      function accountGain() {
        if (addedTotal > accounted) {
          accounted = addedTotal;
          markFolwrRunGain(key);
        }
      }
      function finish(reason, complete) {
        if (done) return;
        done = true;
        activeFolwrInFlight[key] = false;
        if (complete) {
          if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("probe", merged, "submit-final", tid, { complete: 1, addedTotal, steps, reason });
          applyTurns(merged.length > 0 ? merged : lastFullTurns, tid, true, lastBody);
        } else if (typeof gsaDiagBaseWrite === "function") {
          gsaDiagBaseWrite("probe", merged, "skip-incomplete", tid, { complete: 0, addedTotal, steps, reason });
        }
        accountGain();
        endFolwrRun(key);
        emitProbeState(false, tid);
        console.log("[ai-cm-google-search] folwr-open: \u0445\u043E\u0434\u043E\u0432=" + lastFullTurns.length + ", DOM-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432=" + document.querySelectorAll('[data-scope-id="turn"]').length + ", probe +\u0445\u043E\u0434\u043E\u0432=" + addedTotal + ", \u0448\u0430\u0433\u043E\u0432=" + steps + ", \u041F\u041E\u041B\u041D\u0410\u042F=" + !!complete + ", threadId=" + tid);
        debugLog("log", "[ai-cm-google-search] probe \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D: reason=" + reason);
      }
      function step(cursor) {
        if (!cursor) {
          finish("\u043A\u0443\u0440\u0441\u043E\u0440 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D", true);
          return;
        }
        if (steps >= FOLWR_PROBE_MAX_STEPS) {
          finish("\u043B\u0438\u043C\u0438\u0442 \u0448\u0430\u0433\u043E\u0432", true);
          return;
        }
        if (!ownRequestsAllowed()) {
          debugLog("log", "[ai-cm-google-search] probe \u043F\u0440\u0435\u0440\u0432\u0430\u043D: cooldown 429/sorry");
          finish("cooldown-429-sorry", false);
          return;
        }
        if (activeFolwrInFlight[key]) return;
        activeFolwrInFlight[key] = true;
        steps++;
        var pageUrl = urlWithMstk(startUrl, cursor);
        window.fetch(pageUrl, { credentials: "include" }).then(function(resp) {
          if (isSorryResponse(resp && resp.status, resp && resp.url)) {
            triggerSorryCooldown();
            activeFolwrInFlight[key] = false;
            finish("429/sorry", false);
            return null;
          }
          if (!resp) return { resp: null, txt: "" };
          return resp.text().then(function(t) {
            return { resp, txt: t || "" };
          }, function() {
            return { resp, txt: "" };
          });
        }).then(function(page) {
          if (!page) return;
          activeFolwrInFlight[key] = false;
          var txt = page.txt;
          lastBody = txt;
          var parsed = parseWithParser(txt);
          var before = merged.length;
          merged = mergeFn(merged, parsed.turns);
          var added = merged.length - before;
          addedTotal += added;
          var next = extractToken(txt);
          var pageInfo = describeFolwrPage(page.resp, txt, added, next, cursor);
          console.log("[ai-cm-google-search] probe \u0448\u0430\u0433 " + steps + ": " + pageInfo.line);
          debugLog("log", "[ai-cm-google-search] probe \u0448\u0430\u0433 " + steps + ": +\u0445\u043E\u0434\u043E\u0432=" + added + " \u0432\u0441\u0435\u0433\u043E=" + merged.length + " raw(" + txt.length + "B): " + diagPreview(txt));
          if (added > 0) {
            if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("probe", merged, "submit", tid, { step: steps, added, kind: pageInfo.cls.kind, cursor: next ? next.slice(0, 12) : "\u043D\u0435\u0442" });
            applyTurns(merged, tid, false, txt);
            accountGain();
          } else if (typeof gsaDiagBaseWrite === "function") {
            gsaDiagBaseWrite("probe", parsed.turns, "skip-no-gain", tid, { step: steps, added: 0, kind: pageInfo.cls.kind, cursor: next ? next.slice(0, 12) : "\u043D\u0435\u0442" });
          }
          if (pageInfo.cls.complete) {
            finish("probe-" + pageInfo.cls.kind, true);
            return;
          }
          if (!pageInfo.cls.canContinue) {
            finish("probe-" + pageInfo.cls.kind, false);
            return;
          }
          setTimeout(function() {
            step(next);
          }, FOLWR_PAGE_DELAY_MS);
        }).catch(function() {
          activeFolwrInFlight[key] = false;
          finish("\u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0442\u0438", false);
        });
      }
      step(firstCursor);
    }
    function activeLoadFolwr(reason) {
      if (!lastFolwrOpenUrl) return;
      if (!ownRequestsAllowed()) {
        console.log("[ai-cm-google-search] \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u0430: cooldown 429/sorry (" + reason + ")");
        return;
      }
      var tid = readDomThreadId() || currentThreadId || emittedThreadId;
      var key = threadAuthKey(tid, lastFolwrOpenUrl);
      if (activeFolwrInFlight[key]) return;
      if (Date.now() - (lastPassiveFolwrTs[key] || 0) < 3e3) {
        console.log("[ai-cm-google-search] \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u0430: \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439 folwr <3\u0441 (" + reason + ")");
        return;
      }
      activeFolwrInFlight[key] = true;
      console.log("[ai-cm-google-search] \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u043F\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u0443 folwr (" + reason + ")");
      try {
        window.fetch(lastFolwrOpenUrl, { credentials: "include" }).catch(function() {
        }).then(function() {
          activeFolwrInFlight[key] = false;
        });
      } catch (e) {
        activeFolwrInFlight[key] = false;
      }
    }
    function checkThreadSwitch() {
      var tid = readDomThreadId();
      if (!tid) {
        var sigNoDom = "no-thread-dom|" + (baseThreadId || "");
        if (typeof lastDiagSwitchSig === "string" && sigNoDom !== lastDiagSwitchSig) {
          lastDiagSwitchSig = sigNoDom;
          if (typeof gsaDiagState === "function") gsaDiagState("checkThreadSwitch", "no-reset", "no-thread-dom", {});
        }
        return;
      }
      if (tid === currentThreadId && tid === baseThreadId) {
        var sigSame = "same|" + tid;
        if (typeof lastDiagSwitchSig === "string" && sigSame !== lastDiagSwitchSig) {
          lastDiagSwitchSig = sigSame;
          if (typeof gsaDiagState === "function") gsaDiagState("checkThreadSwitch", "no-reset", "same-thread", { from: tid, to: tid });
        }
        return false;
      }
      var prevSwitchTid = currentThreadId || "";
      currentThreadId = tid;
      probedTids = {};
      if (typeof gsaDiagState === "function") gsaDiagState("checkThreadSwitch", "switching", "thread-id-switch", { from: prevSwitchTid || "(\u043F\u0443\u0441\u0442\u043E)", to: tid, cache: threadCache.has(tid) ? 1 : 0 });
      activateThread(tid);
      var cached = threadCache.get(tid);
      if (cached && cached.snapshot) {
        lastFullTurns = (cached.turns || []).slice();
        lastFullMessages = (cached.messages || []).slice();
        lastFullSnapshot = cached.snapshot;
        emittedThreadId = tid;
        console.log("[ai-cm-google-search] threadId \u0441\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u2192 \u044D\u043C\u0438\u0442 \u043A\u044D\u0448\u0430 (" + tid + ")");
        emitDetail(lastFullSnapshot);
      } else {
        lastFullTurns = [];
        lastFullMessages = [];
        lastFullSnapshot = null;
        seenKeys = {};
        emittedThreadId = "";
        console.log("[ai-cm-google-search] threadId \u0441\u043C\u0435\u043D\u0438\u043B\u0441\u044F \u2192 \u043A\u044D\u0448\u0430 \u043D\u0435\u0442 (" + tid + ")");
        activeLoadFolwr("thread-switch:" + tid);
      }
      return true;
    }
    currentThreadId = readDomThreadId();
    baseThreadId = currentThreadId;
    var aiCmPoll = setIntervalVisible;
    aiCmPoll(function() {
      checkThreadSwitch();
    }, 1e3);
    var origFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = "";
      try {
        url = typeof input === "string" ? input : input && input.url || "";
      } catch (e) {
        swallow(e, "gsa:fetch-url-read");
      }
      var method = "";
      try {
        method = init && init.method ? String(init.method).toUpperCase() : "GET";
      } catch (e) {
        swallow(e, "gsa:fetch-method-read");
      }
      var isFolwr = url.indexOf("/folwr") !== -1;
      var isFolif = url.indexOf("/folif") !== -1;
      var isOpenFolwr = url.indexOf("/async/folwr") !== -1;
      var promise;
      try {
        promise = origFetch.apply(this, arguments);
      } catch (e) {
        return Promise.reject(e);
      }
      try {
        promise.then(function(resp) {
          try {
            if (isSorryResponse(resp && resp.status, resp && resp.url)) triggerSorryCooldown();
          } catch (e) {
            swallow(e, "gsa:sorry-detect-fetch");
          }
        }, function() {
        });
      } catch (e) {
        swallow(e, "gsa:fetch-then-hook");
      }
      if ((isFolwr || isFolif) && !isOpenFolwr) {
        var isFull = isFolwr;
        promise.then(function(resp) {
          try {
            if (typeof aiCmDiagLine === "function" && aiCmDiagOn()) {
              var fetchRedirected = !!(resp && resp.redirected);
              var fetchType = resp && resp.type || "";
              var fetchStatus = resp && resp.status || 0;
              var fetchFinalUrl = resp && resp.url || url;
              var fetchFinalHost = "";
              try {
                fetchFinalHost = new URL(fetchFinalUrl).host;
              } catch (eHost) {
                fetchFinalHost = "";
              }
              aiCmDiagLine("gsa-fetch-telemetry", {
                point: isFull ? "folwr" : "folif",
                threadId: currentThreadId || emittedThreadId || "",
                redirected: fetchRedirected,
                status: fetchStatus,
                type: fetchType,
                finalUrlHost: fetchFinalHost,
                verdict: fetchRedirected === true || fetchType === "opaqueredirect" || fetchStatus === 303 ? "consent-redirect-candidate" : "normal"
              });
            }
            if (resp && resp.ok) {
              lastPassiveFolwrTs[threadAuthKey(currentThreadId || emittedThreadId, url)] = Date.now();
              resp.clone().text().then(function(txt) {
                var model = extractModel(txt);
                if (model) detectedModelSlug = model;
                var parsed = parseWithParser(txt);
                if (parsed.turns.length > 0) {
                  if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite(isFull ? "passive-folwr" : "passive-folif", parsed.turns, "submit", parsed.threadId, { url: rawSnippet(url, 80), bodyLen: txt ? txt.length : 0 });
                  mergeTurns(parsed.turns, isFull, parsed.threadId, txt);
                } else if (typeof gsaDiagBaseWrite === "function") {
                  gsaDiagBaseWrite(isFull ? "passive-folwr" : "passive-folif", parsed.turns, "skip-no-turns", parsed.threadId, { url: rawSnippet(url, 80), bodyLen: txt ? txt.length : 0 });
                }
              }).catch(function() {
              });
            }
          } catch (e) {
          }
          return resp;
        }, function() {
        });
      }
      if (isOpenFolwr && method !== "POST") {
        try {
          lastFolwrOpenUrl = url;
        } catch (e) {
        }
        promise.then(function(resp) {
          if (resp && resp.ok) {
            resp.clone().text().then(function(txt) {
              if (txt) {
                var model = extractModel(txt);
                if (model) detectedModelSlug = model;
                try {
                  var parsed = parseWithParser(txt);
                  var tid = parsed.threadId || readDomThreadId();
                  if (tid && !isForeignThread(tid)) currentThreadId = tid;
                  if (parsed && parsed.turns && parsed.turns.length > 0) {
                    var folwrTurnCount = 0;
                    if (window.GoogleFolwrUtils && window.GoogleFolwrUtils.countTurnContainers) {
                      folwrTurnCount = window.GoogleFolwrUtils.countTurnContainers(txt);
                    }
                    var domTurnCount = 0;
                    try {
                      domTurnCount = document.querySelectorAll('[data-scope-id="turn"]').length;
                    } catch (e) {
                      swallow(e, "gsa:dom-turn-count");
                    }
                    var domTurns = [];
                    if (window.GoogleFolwrUtils && window.GoogleFolwrUtils.extractTurnsFromDocument) {
                      domTurns = window.GoogleFolwrUtils.extractTurnsFromDocument(document);
                    }
                    var baseTurns = parsed.turns;
                    var mergedTurns = baseTurns;
                    var dopasbor = 0;
                    if (domTurnCount > folwrTurnCount && domTurns.length > 0) {
                      var mergeFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsByKey || function(a, b) {
                        return a.concat(b);
                      };
                      mergedTurns = mergeFn(baseTurns, domTurns);
                      dopasbor = mergedTurns.length - baseTurns.length;
                    }
                    var folwrCursor = null;
                    if (window.GoogleFolwrUtils && window.GoogleFolwrUtils.extractContinuationToken) {
                      folwrCursor = window.GoogleFolwrUtils.extractContinuationToken(txt);
                    }
                    var historyComplete = !folwrCursor && domTurnCount <= folwrTurnCount;
                    if (emittedThreadId === tid && lastFullTurns.length > mergedTurns.length) {
                      var unionFn = window.GoogleFolwrUtils && window.GoogleFolwrUtils.mergeTurnsById || function(a, b) {
                        return a.concat(b);
                      };
                      mergedTurns = unionFn(lastFullTurns, mergedTurns);
                      console.log("[ai-cm-google-search] \u0431\u0430\u0437\u0430 \u0441\u0436\u0430\u0442\u0430 \u2014 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C (" + mergedTurns.length + " \u0445\u043E\u0434\u043E\u0432)");
                    }
                    var openKey = threadAuthKey(tid, url);
                    if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("open", mergedTurns, "submit", tid, { parsed: baseTurns.length, folwrContainers: folwrTurnCount, domContainers: domTurnCount, dopasbor, complete: historyComplete ? 1 : 0, cursor: folwrCursor ? folwrCursor.slice(0, 12) : "\u043D\u0435\u0442", bodyLen: txt ? txt.length : 0 });
                    var openGained = mergedTurns.length - lastFullTurns.length;
                    applyTurns(mergedTurns, tid, historyComplete, txt);
                    var sig = [
                      baseTurns.length,
                      folwrTurnCount,
                      domTurnCount,
                      dopasbor,
                      lastFullTurns.length,
                      folwrCursor ? folwrCursor.slice(0, 12) : "\u043D\u0435\u0442",
                      historyComplete,
                      tid
                    ].join("|");
                    if (sig !== lastFolwrSig) {
                      lastFolwrSig = sig;
                      console.log("[ai-cm-google-search] folwr-open: \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0435\u043D\u043E=" + baseTurns.length + ", folwr-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432=" + folwrTurnCount + ", DOM-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432=" + domTurnCount + ", \u0434\u043E\u0441\u0431\u043E\u0440=" + dopasbor + ", \u0432\u0438\u0434\u0438\u043C\u044B\u0445 \u0445\u043E\u0434\u043E\u0432=" + lastFullTurns.length + ", \u043A\u0443\u0440\u0441\u043E\u0440=" + (folwrCursor ? folwrCursor.slice(0, 12) : "\u043D\u0435\u0442") + ", \u041F\u041E\u041B\u041D\u0410\u042F=" + historyComplete + ", threadId=" + tid);
                    }
                    if (openGained > 0) markFolwrRunGain(openKey);
                    var openGate = openGained > 0 ? folwrRunPermit("open", tid, openKey, { gained: openGained, growthPriority: true, recordNoGain: false }) : null;
                    var openTailAllowed = !(openGate && !openGate.permit);
                    if (!openTailAllowed) {
                      debugLog("log", "[ai-cm-google-search] \u0445\u0432\u043E\u0441\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F (\u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F/probe) \u043F\u043E\u0434\u0430\u0432\u043B\u0435\u043D \u0433\u0430\u0440\u0434\u043E\u043C \u043F\u0435\u0442\u043B\u0438: threadId=" + tid);
                    }
                    if (folwrCursor && openTailAllowed) {
                      if (baseTurns.length === domTurnCount) {
                        probeFolwrCompleteness(url, mergedTurns, tid, folwrCursor, openGained);
                      } else {
                        followFolwrPagination(url, mergedTurns, tid, folwrCursor, openGained);
                      }
                    }
                  } else {
                    var openPageInfo = describeFolwrPage(resp, txt, 0, null, null);
                    console.log("[ai-cm-google-search] folwr-open: \u0445\u043E\u0434\u043E\u0432 \u043D\u0435 \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0435\u043D\u043E, " + openPageInfo.line);
                    debugLog("log", "[ai-cm-google-search] folwr-open raw(" + txt.length + "B): " + diagPreview(txt));
                    if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("open", [], "no-turns-parsed", tid, { bodyLen: txt ? txt.length : 0, head: typeof aiCmDiagHead === "function" ? aiCmDiagHead(txt, 100) : String(txt || "").slice(0, 100), kind: openPageInfo.cls.kind, status: resp && resp.status || 0, ok: resp && resp.ok ? 1 : 0 });
                  }
                } catch (e) {
                  console.log("[ai-cm-google-search] folwr-open: \u043E\u0448\u0438\u0431\u043A\u0430:", e && e.message);
                }
              }
            }).catch(function() {
            });
          }
        }).catch(function() {
        });
      }
      return promise;
    };
    var OrigXHR = window.XMLHttpRequest;
    if (OrigXHR) {
      var origOpen = OrigXHR.prototype.open;
      var origSend = OrigXHR.prototype.send;
      OrigXHR.prototype.open = function(method, url) {
        try {
          this.__aiCmUrl = String(url || "");
          this.__aiCmMethod = String(method || "GET");
        } catch (e) {
          this.__aiCmUrl = "";
          this.__aiCmMethod = "GET";
        }
        return origOpen.apply(this, arguments);
      };
      OrigXHR.prototype.send = function(body) {
        var url = "";
        try {
          url = this.__aiCmUrl || "";
        } catch (e) {
          swallow(e, "gsa:xhr-state-read");
        }
        var method = "";
        try {
          method = (this.__aiCmMethod || "GET").toUpperCase();
        } catch (e) {
          swallow(e, "gsa:xhr-method-read");
        }
        var isFolwr = url.indexOf("/folwr") !== -1;
        var isFolif = url.indexOf("/folif") !== -1;
        this.addEventListener("load", function() {
          try {
            if (isSorryResponse(this.status, this.responseURL)) triggerSorryCooldown();
          } catch (e) {
            swallow(e, "gsa:sorry-detect-xhr");
          }
        });
        if (isFolwr || isFolif) {
          var isFullXhr = isFolwr;
          var self = this;
          this.addEventListener("load", function() {
            try {
              if (self.status >= 200 && self.status < 300 && self.responseText) {
                lastPassiveFolwrTs[threadAuthKey(currentThreadId || emittedThreadId, url)] = Date.now();
                var txt = self.responseText;
                var modelXhr = extractModel(txt);
                if (modelXhr) detectedModelSlug = modelXhr;
                var parsed = parseWithParser(txt);
                if (parsed.turns.length > 0) {
                  if (typeof gsaDiagBaseWrite === "function") gsaDiagBaseWrite("xhr", parsed.turns, "submit", parsed.threadId, { full: isFullXhr === true ? 1 : 0, url: rawSnippet(url, 80), bodyLen: txt ? txt.length : 0 });
                  mergeTurns(parsed.turns, isFullXhr, parsed.threadId, txt);
                } else if (typeof gsaDiagBaseWrite === "function") {
                  gsaDiagBaseWrite("xhr", parsed.turns, "skip-no-turns", parsed.threadId, { full: isFullXhr === true ? 1 : 0, url: rawSnippet(url, 80), bodyLen: txt ? txt.length : 0 });
                }
              }
            } catch (e) {
              swallow(e, "gsa:passive-xhr-parse");
            }
          });
        }
        return origSend.apply(this, arguments);
      };
    }
    window.addEventListener("ai-cm-google-search-ready", function() {
      if (lastFullSnapshot) {
        console.log("[ai-cm-google-search] folwr-open: \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u044D\u043C\u0438\u0442 \u043F\u043E handshake");
        emitDetail(lastFullSnapshot);
      } else {
        activeLoadFolwr("handshake");
      }
    });
    console.log("[ai-cm-google-search] \u041F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
    console.log("[ai-cm-google-search] parser available: " + typeof window.parseGoogleFolwrOpen);
  })();
})();
