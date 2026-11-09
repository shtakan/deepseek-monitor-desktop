(() => {
  // utils/debug.ts
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
  function debugLog2(level, ...rest) {
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
      if (typeof aiCmDiagLine !== "function") return;
      aiCmDiagLine("swallow-soft", { tag: label, err: error });
    } catch (eSoftDiag) {
      return void 0;
    }
  }
  try {
    if (typeof window !== "undefined") window.__aiCmSwallowSoft = swallowSoft;
  } catch (eSoftExport) {
    __aiCmPushLogRing("[swallow-soft-export] " + eSoftExport);
  }

  // utils/intercept-common.ts
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
  var ONFREEZE_ERROR_RE = /Only fetch keepalive is allowed during onfreeze/i;
  function isOnFreezeError(error) {
    try {
      var message = error && typeof error.message !== "undefined" ? String(error.message) : String(error);
      return ONFREEZE_ERROR_RE.test(message);
    } catch (eText) {
      return false;
    }
  }
  function fetchGuarded(fetchFn, thisArg, args) {
    try {
      var list = Array.prototype.slice.call(args);
      return Reflect.apply(fetchFn, thisArg, list);
    } catch (eCall) {
      if (!isOnFreezeError(eCall)) throw eCall;
      swallowSoft(eCall, "intercept-common:onfreeze-fetch");
      var rejected = Promise.reject(eCall);
      rejected.catch(function() {
      });
      return rejected;
    }
  }

  // utils/chatgpt-conversation-parser.ts
  function getConvIdFromPath(pathname) {
    try {
      var m = String(pathname || "").match(/\/c\/([A-Za-z0-9_-]+)/);
      return m ? m[1] : "";
    } catch (e) {
      return "";
    }
  }
  function shouldResetConversationOnNav(prevId, newId) {
    var p = prevId == null ? "" : String(prevId);
    var n = newId == null ? "" : String(newId);
    return p !== n;
  }
  function sanitizeChatGPTText(s) {
    if (typeof s !== "string") return s;
    return String(s).replace(/\uE200entity\uE202([^\uE200\uE201]*?)\uE201/g, function(m, payload) {
      try {
        var arr = JSON.parse(payload);
        if (Array.isArray(arr) && arr.length > 1 && typeof arr[1] === "string" && arr[1]) return arr[1];
      } catch (e) {
        swallowSoft(e, "chatgpt-utils:sanitizeChatGPTText-entity");
      }
      try {
        var mt = String(payload).match(/"([^"]+)"/g);
        if (mt && mt.length > 1) {
          var v = mt[1].replace(/^"|"$/g, "");
          if (v) return v;
        }
      } catch (e2) {
      }
      return "";
    }).replace(/\uE200(?:cite|image_group)\uE202[^\uE200\uE201]*?\uE201/g, "").replace(/[\uE000-\uF8FF]/g, "").replace(/\[entity\](?:\[[^\]]*\])+/g, "").replace(/\[entity\]/g, "").replace(/\[cite:[^\]]*\]/g, "").replace(/[ \t]{2,}/g, " ");
  }
  function orderChatGPTMapping(mapping) {
    var keys = Object.keys(mapping || {});
    if (!keys.length) return [];
    var byId = {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var n = mapping[k];
      var nid = n && n.id != null ? String(n.id) : k;
      byId[nid] = k;
    }
    var hasParent = false;
    var hasChildren = false;
    for (var p = 0; p < keys.length; p++) {
      var np = mapping[keys[p]];
      if (np && np.parent !== void 0) hasParent = true;
      if (np && Array.isArray(np.children) && np.children.length) hasChildren = true;
    }
    var childrenOf = {};
    for (var c0 = 0; c0 < keys.length; c0++) childrenOf[keys[c0]] = [];
    var roots = [];
    for (var m = 0; m < keys.length; m++) {
      var kk = keys[m];
      var nn = mapping[kk];
      var pid = nn && nn.parent != null ? String(nn.parent) : null;
      var pk = pid ? byId[pid] || pid : null;
      if (pk) {
        if (childrenOf[pk]) childrenOf[pk].push(kk);
      } else if (hasParent) {
        roots.push(kk);
      }
    }
    if (!hasParent) {
      if (hasChildren) {
        var isChild = {};
        for (var c1 = 0; c1 < keys.length; c1++) {
          var n1 = mapping[keys[c1]];
          if (n1 && Array.isArray(n1.children)) {
            for (var c2 = 0; c2 < n1.children.length; c2++) {
              var cid = String(n1.children[c2]);
              isChild[byId[cid] || cid] = true;
            }
          }
        }
        roots = keys.filter(function(k2) {
          return !isChild[k2];
        });
        if (!roots.length) roots = [keys[0]];
      } else {
        return keys.slice().sort(function(a, b) {
          var ca = mapping[a] && mapping[a].message && mapping[a].message.create_time || 0;
          var cb = mapping[b] && mapping[b].message && mapping[b].message.create_time || 0;
          return ca - cb;
        });
      }
    }
    roots.sort(function(a, b) {
      var ca = mapping[a] && mapping[a].message && mapping[a].message.create_time || 0;
      var cb = mapping[b] && mapping[b].message && mapping[b].message.create_time || 0;
      return ca - cb;
    });
    var out = [];
    var visited = {};
    function walk(k2) {
      if (!k2 || visited[k2] || mapping[k2] === void 0) return;
      visited[k2] = true;
      out.push(k2);
      var ch = childrenOf[k2] || [];
      if (mapping[k2] && Array.isArray(mapping[k2].children) && mapping[k2].children.length) {
        ch = mapping[k2].children.map(function(cid2) {
          return byId[String(cid2)] || String(cid2);
        });
      }
      for (var w = 0; w < ch.length; w++) walk(ch[w]);
    }
    for (var r = 0; r < roots.length; r++) walk(roots[r]);
    for (var u = 0; u < keys.length; u++) if (!visited[keys[u]]) out.push(keys[u]);
    return out;
  }

  // core/page-intercept.js
  (function() {
    if (window.__aiCmInterceptInstalled) return;
    window.__aiCmInterceptInstalled = true;
    try {
      window.addEventListener("ai-cm-debug-logs", function(ev) {
        __aiCmSetDebugLogs(!!(ev && ev.detail));
      });
    } catch (e) {
    }
    var originalFetch = window.fetch;
    if (typeof originalFetch !== "function") return;
    var lastHeaders = null;
    var lastSnapshotUrl = null;
    var refreshBusy = false;
    var activeDisabled = false;
    var dirty = false;
    var loggedActiveStatus = false;
    var guardToken = "__aicm_active__";
    var IMAGE_DEFAULT_TOKENS = 765;
    var attachSeen = {};
    var attachTokens = 0;
    var attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
    var loggedAttach = false;
    var lastLoadedConvId = "";
    var switchRefetchTimer = null;
    var activeRetryCount = 0;
    var passiveGetInFlight = false;
    var fallbackTimer = null;
    function getConvId() {
      return getConvIdFromPath(location.pathname);
    }
    var currentConvId = getConvId();
    function resetForNewConversation() {
      lastSnapshotUrl = null;
      lastLoadedConvId = "";
      dirty = false;
      refreshBusy = false;
      activeDisabled = false;
      loggedActiveStatus = false;
      attachSeen = {};
      attachTokens = 0;
      attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
      loggedAttach = false;
      activeRetryCount = 0;
      debugLog("log", "[ai-cm-intercept] \u0441\u043C\u0435\u043D\u0430 \u0447\u0430\u0442\u0430 \u2192 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u043E (convId=" + (currentConvId || "(\u043D\u0435 \u0447\u0430\u0442)") + ")");
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-conversation-changed"));
      } catch (e) {
      }
      scheduleSwitchRefetch();
      scheduleFallback(currentConvId, 2e3);
    }
    function checkConvChange() {
      var newId = getConvId();
      var shouldReset = shouldResetConversationOnNav(currentConvId, newId);
      if (shouldReset) {
        currentConvId = newId;
        resetForNewConversation();
      }
    }
    try {
      var origPush = history.pushState;
      if (origPush) {
        history.pushState = function() {
          var r = origPush.apply(this, arguments);
          try {
            checkConvChange();
          } catch (e) {
          }
          return r;
        };
      }
      var origReplace = history.replaceState;
      if (origReplace) {
        history.replaceState = function() {
          var r = origReplace.apply(this, arguments);
          try {
            checkConvChange();
          } catch (e) {
          }
          return r;
        };
      }
      window.addEventListener("popstate", function() {
        try {
          checkConvChange();
        } catch (e) {
        }
      });
    } catch (e) {
    }
    function convIdFromBackendUrl(url) {
      try {
        var m = url.match(/\/backend-api\/conversation\/([A-Za-z0-9_-]+)/);
        return m ? m[1] : "";
      } catch (e) {
        return "";
      }
    }
    function urlOf(input) {
      try {
        if (typeof input === "string") return input;
        if (input && input.url) return input.url;
      } catch (e) {
      }
      return "";
    }
    function methodOf(input, init) {
      try {
        if (init && init.method) return String(init.method).toUpperCase();
        if (input && input.method) return String(input.method).toUpperCase();
      } catch (e) {
      }
      return "GET";
    }
    function tail(url) {
      var i = url.indexOf("/backend-api/");
      var s = i !== -1 ? url.slice(i) : url;
      return s.length > 72 ? s.slice(0, 72) + "\u2026" : s;
    }
    function isFullSnapshotGet(url, m) {
      return !!url && m === "GET" && url.indexOf("/backend-api/conversation/") !== -1 && url.indexOf("/stream") === -1 && url.indexOf("/f/") === -1 && url.indexOf("/textdocs") === -1 && url.indexOf(guardToken) === -1;
    }
    function isBackend(url) {
      return !!url && url.indexOf("/backend-api/") !== -1;
    }
    function isSendPost(url, m) {
      return !!url && m === "POST" && url.indexOf("/f/conversation") !== -1 && url.indexOf("/prepare") === -1;
    }
    function isStreamEnd(url, m) {
      return !!url && m === "GET" && url.indexOf("/backend-api/conversation/") !== -1 && url.indexOf("/stream") !== -1;
    }
    function captureHeaders(input, init) {
      var h = {};
      try {
        if (typeof Request !== "undefined" && input instanceof Request && input.headers && typeof input.headers.forEach === "function") {
          input.headers.forEach(function(v, k2) {
            h[k2] = v;
          });
        }
      } catch (e) {
        swallow(e, "page-intercept:captureHeaders-request");
      }
      try {
        if (init && init.headers) {
          var hh = init.headers;
          if (hh && typeof hh.forEach === "function") {
            hh.forEach(function(v, k2) {
              h[k2] = v;
            });
          } else if (Array.isArray(hh)) {
            for (var i = 0; i < hh.length; i++) if (hh[i] && hh[i][0]) h[hh[i][0]] = hh[i][1];
          } else if (typeof hh === "object") {
            for (var k in hh) h[k] = hh[k];
          }
        }
      } catch (e) {
        swallow(e, "page-intercept:captureHeaders-init");
      }
      return h;
    }
    function hasAuth(h) {
      if (!h) return false;
      for (var k in h) if (k.toLowerCase() === "authorization" && h[k]) return true;
      return false;
    }
    function parseHistory(data) {
      var mapping = data && data.mapping ? data.mapping : {};
      var nodeCount = 0;
      try {
        nodeCount = Object.keys(mapping).length;
      } catch (e) {
        nodeCount = 0;
      }
      var pieces = [];
      var ids = [];
      var roles = [];
      var count = 0;
      var lastText = "";
      var lastModelSlug = "";
      var lastRole = "";
      var localImgSeen = {};
      var imgCount = 0;
      var imgTokens = 0;
      var strippedMarkers = 0;
      var firstUserHead = "";
      var orderedKeys = orderChatGPTMapping(mapping);
      var sanitizeText = sanitizeChatGPTText;
      function countMarkers(s) {
        if (typeof s !== "string") return 0;
        var n = 0;
        var m;
        m = s.match(/\uE200(?:entity|cite|image_group)\uE202[^\uE200\uE201]*?\uE201/g);
        if (m) n += m.length;
        m = s.match(/\[entity\](?:\[[^\]]*\])+/g);
        if (m) n += m.length;
        m = s.match(/\[entity\]/g);
        if (m) n += m.length;
        m = s.match(/\[cite:[^\]]*\]/g);
        if (m) n += m.length;
        return n;
      }
      for (var ki = 0; ki < orderedKeys.length; ki++) {
        var key = orderedKeys[ki];
        var node = mapping[key];
        var msg = node && node.message;
        if (!msg || !msg.content) continue;
        var role = msg.author && msg.author.role ? msg.author.role : "";
        if (role === "system") continue;
        var parts = msg.content.parts;
        if (!Array.isArray(parts)) continue;
        var text = "";
        for (var i = 0; i < parts.length; i++) {
          if (typeof parts[i] === "string") {
            strippedMarkers += countMarkers(parts[i]);
            text += sanitizeText(parts[i]) + "\n";
          } else if (typeof parts[i] === "object" && parts[i] !== null) {
            if (typeof parts[i].text === "string" && parts[i].text) {
              strippedMarkers += countMarkers(parts[i].text);
              text += sanitizeText(parts[i].text) + "\n";
              continue;
            }
            var isImage = false;
            if (parts[i].content_type && typeof parts[i].content_type === "string" && parts[i].content_type.indexOf("image") !== -1) isImage = true;
            if (!isImage && parts[i].asset_pointer) isImage = true;
            if (!isImage) {
              try {
                if (parts[i].content_type && typeof parts[i].content_type === "string") isImage = true;
              } catch (e) {
              }
            }
            if (isImage) {
              var imgKey = key + "_" + i;
              if (!localImgSeen[imgKey]) {
                localImgSeen[imgKey] = 1;
                imgCount++;
                imgTokens += IMAGE_DEFAULT_TOKENS;
                if (!attachSeen[imgKey]) {
                  attachSeen[imgKey] = 1;
                  attachBreak.imgTokens += IMAGE_DEFAULT_TOKENS;
                  attachBreak.imgCount++;
                  attachTokens += IMAGE_DEFAULT_TOKENS;
                }
              }
            }
          }
        }
        text = text.trim();
        var meta = msg.metadata || {};
        var slug = meta.model_slug || meta.model || "";
        if (text) {
          if (!firstUserHead && role === "user") firstUserHead = text.slice(0, 40);
          pieces.push(text);
          ids.push(String(key));
          roles.push(role);
          count++;
          lastText = text;
          lastRole = role;
          if (slug) lastModelSlug = slug;
        }
      }
      if (!loggedAttach && attachTokens > 0) {
        loggedAttach = true;
        console.log("[ai-cm] \u043A\u0430\u0440\u0442\u0438\u043D\u043E\u043A \u0432 \u0434\u0438\u0430\u043B\u043E\u0433\u0435: " + attachBreak.imgCount + ", \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432: " + attachBreak.imgTokens + " (\u043F\u043E " + IMAGE_DEFAULT_TOKENS + " \u0442\u043E\u043A/\u0438\u0437\u043E\u0431\u0440, high-detail \u043E\u0446\u0435\u043D\u043A\u0430 OpenAI 1024\xD71024)");
      }
      return { text: pieces.join("\n"), count, lastText, lastModelSlug, pieces, ids, roles, lastRole, imgCount, imgTokens, strippedMarkers, firstUserHead, nodeCount };
    }
    function emitSnapshot(parsed, when) {
      if (!parsed.text) return;
      lastLoadedConvId = currentConvId;
      console.log('[ai-cm-intercept] head="' + (parsed.firstUserHead || "") + '" stripped=' + (parsed.strippedMarkers || 0));
      var diagTail = [];
      var diagPieces = parsed.pieces || [];
      var diagRoles = parsed.roles || [];
      for (var di = Math.max(0, diagRoles.length - 3); di < diagRoles.length; di++) {
        diagTail.push(diagRoles[di] + ":" + (diagPieces[di] ? diagPieces[di].length : 0));
      }
      console.log("[ai-cm-intercept] diag: \u0445\u0432\u043E\u0441\u0442 \u0441\u043D\u0438\u043C\u043A\u0430: " + JSON.stringify(diagTail));
      console.log("[ai-cm-intercept] \u{1F4E5} \u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (" + when + "): " + parsed.count + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439" + (parsed.lastModelSlug ? ", model_slug=" + parsed.lastModelSlug : "") + (attachTokens > 0 ? ", \u043A\u0430\u0440\u0442\u0438\u043D\u043E\u043A=" + attachBreak.imgCount + " \u2248" + attachBreak.imgTokens + " \u0442\u043E\u043A" : "") + " (\u0431\u0435\u0437 \u0441\u043A\u0440\u043E\u043B\u043B\u0430)");
      console.log("[ai-cm-intercept] ChatGPT-\u0442\u043E\u043A\u0435\u043D\u044B: \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0432 \u0432\u0435\u0442\u043A\u0435=" + parsed.count + ", \u0443\u0437\u043B\u043E\u0432 \u0432\u043E \u0432\u0441\u0451\u043C mapping=" + (parsed.nodeCount || 0) + ", \u043A\u0430\u0440\u0442\u0438\u043D\u043E\u043A \u0432 \u043E\u0446\u0435\u043D\u043A\u0435 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439=" + (attachBreak.imgCount || 0) + ", \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u2248=" + (attachTokens || 0) + "; \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0432\u0445\u043E\u0434\u044F\u0442 \u0432 \u0438\u0442\u043E\u0433: " + (attachTokens > 0 ? "\u0434\u0430 (tokenEstimate += attachTokens \u0432 content.js)" : "\u043D\u0435\u0442 (\u043D\u0435\u0442 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439)"));
      var messages = [];
      for (var mi = 0; mi < diagPieces.length; mi++) {
        var mRole = diagRoles[mi] || "";
        messages.push({ role: mRole === "user" ? "user" : "assistant", text: diagPieces[mi] || "" });
      }
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", {
          detail: {
            text: parsed.text,
            count: parsed.count,
            lastMessageText: parsed.lastText,
            modelSlug: parsed.lastModelSlug,
            messageTexts: parsed.pieces,
            messageIds: parsed.ids,
            messages,
            attachTokens,
            attachBreak: { imgTokens: attachBreak.imgTokens, docTokens: attachBreak.docTokens, imgCount: attachBreak.imgCount, docCount: attachBreak.docCount },
            historyComplete: true,
            serverTokens: 0
          }
        }));
      } catch (e) {
      }
    }
    function handleSnapshot(response, when, expectedConvId) {
      var copy = response.clone();
      copy.json().then(function(data) {
        if (expectedConvId && expectedConvId !== currentConvId) {
          debugLog("log", "[ai-cm-intercept] \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (convId \u043E\u0442\u0432\u0435\u0442\u0430 " + expectedConvId + " != \u0442\u0435\u043A\u0443\u0449\u0438\u0439 " + currentConvId + ")");
          return;
        }
        emitSnapshot(parseHistory(data), when);
      }).catch(function() {
      });
    }
    function activeRefresh(reason) {
      if (activeDisabled || refreshBusy) return;
      var baseUrl = lastSnapshotUrl || (currentConvId ? location.origin + "/backend-api/conversation/" + currentConvId : null);
      if (!baseUrl || !lastHeaders || !hasAuth(lastHeaders)) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
          debugLog("log", "[virtual-f5] \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u043E\u0442\u043B\u043E\u0436\u0435\u043D: \u043D\u0435\u0442 \u0430\u0434\u0440\u0435\u0441\u0430/\u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430 \u043F\u043E\u043A\u0430");
        }
        return;
      }
      var sentConvId = currentConvId;
      refreshBusy = true;
      var headers = {};
      for (var k in lastHeaders) headers[k] = lastHeaders[k];
      var sep = baseUrl.indexOf("?") === -1 ? "?" : "&";
      var markedUrl = baseUrl + sep + guardToken + "=1&cb=" + Date.now();
      originalFetch(markedUrl, { method: "GET", headers, credentials: "include" }).then(function(resp) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
          console.log("[virtual-f5] \u043F\u0435\u0440\u0432\u044B\u0439 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441: \u0441\u0442\u0430\u0442\u0443\u0441 " + resp.status + " (\u043F\u0440\u043E\u043F\u0443\u0441\u043A=" + (hasAuth(lastHeaders) ? "\u0434\u0430" : "\u043D\u0435\u0442") + ")");
        }
        if (!resp || !resp.ok) {
          activeDisabled = true;
          if (!(resp && resp.status === 404)) {
            debugLog("log", "[virtual-f5] \u043D\u0435 \u043F\u0440\u043E\u0448\u0451\u043B (\u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none") + ") \u2192 \u043E\u0441\u0442\u0430\u0451\u043C\u0441\u044F \u043D\u0430 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u043E\u0439 \u043B\u043E\u0432\u043B\u0435 + DOM-\u0445\u0432\u043E\u0441\u0442 (\u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u043A\u0430\u043A \u0440\u0430\u043D\u044C\u0448\u0435)");
          }
          return null;
        }
        console.log("[virtual-f5] \u2713 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u2014 realtime \u0442\u0435\u043F\u0435\u0440\u044C \u043F\u043E \u043F\u043E\u043B\u043D\u043E\u043C\u0443 \u0441\u043D\u0438\u043C\u043A\u0443 \u0431\u0435\u0437 F5 (" + reason + ")");
        return resp.json();
      }).then(function(data) {
        if (!data) return;
        if (sentConvId !== currentConvId) {
          debugLog("log", "[ai-cm-intercept] \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (convId \u043E\u0442\u0432\u0435\u0442\u0430 " + sentConvId + " != \u0442\u0435\u043A\u0443\u0449\u0438\u0439 " + currentConvId + ")");
          return;
        }
        var parsed = parseHistory(data);
        if (parsed.text) {
          emitSnapshot(parsed, "\u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 F5");
          dirty = false;
          if (parsed.lastRole === "user" && activeRetryCount < 4) {
            activeRetryCount++;
            var retrySchedule = [1500, 4e3, 9e3, 16e3];
            var retryDelay = retrySchedule[activeRetryCount - 1] || 16e3;
            setTimeout(function() {
              activeRefresh("\u0440\u0435\u0442\u0440\u0430\u0439 \u043F\u043E\u0441\u043B\u0435 \u043E\u0442\u0432\u0435\u0442\u0430 #" + activeRetryCount);
            }, retryDelay);
          } else if (parsed.lastRole === "assistant") {
            activeRetryCount = 0;
          }
        }
      }).catch(function(err) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
        }
        activeDisabled = true;
        debugLog("log", "[virtual-f5] \u043E\u0448\u0438\u0431\u043A\u0430 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430: " + err + " \u2192 \u043E\u0441\u0442\u0430\u0451\u043C\u0441\u044F \u043D\u0430 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u043E\u0439 \u043B\u043E\u0432\u043B\u0435 + DOM-\u0445\u0432\u043E\u0441\u0442");
      }).finally(function() {
        refreshBusy = false;
      });
    }
    function scheduleActive(reason, delay) {
      if (activeDisabled) return;
      dirty = true;
      setTimeout(function() {
        activeRefresh(reason);
      }, delay);
    }
    function fallbackSnapshot(convId) {
      if (!convId) return;
      if (lastLoadedConvId === convId) {
        console.log("[ai-cm-intercept] fallback: \u043F\u0440\u043E\u043F\u0443\u0441\u043A (\u043F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u0443\u0436\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D)");
        return;
      }
      if (passiveGetInFlight) {
        console.log("[ai-cm-intercept] fallback: \u043F\u0440\u043E\u043F\u0443\u0441\u043A (\u043F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439 GET \u0435\u0449\u0451 \u0432 \u043F\u043E\u043B\u0451\u0442\u0435)");
        return;
      }
      console.log("[ai-cm-intercept] fallback: \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A");
      var url = location.origin + "/backend-api/conversation/" + convId;
      var init = { method: "GET", credentials: "include" };
      if (lastHeaders && hasAuth(lastHeaders)) {
        var fh = {};
        for (var fk in lastHeaders) fh[fk] = lastHeaders[fk];
        init.headers = fh;
      }
      originalFetch(url, init).then(function(resp) {
        if (!resp || !resp.ok) {
          if (resp && resp.status === 404) return null;
          debugLog("log", "[ai-cm-intercept] fallback: \u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none") + " \u0434\u043B\u044F " + convId);
          return null;
        }
        handleSnapshot(resp, "fallback", convId);
        return null;
      }).catch(function() {
      });
    }
    function scheduleFallback(convId, delay) {
      try {
        clearTimeout(fallbackTimer);
      } catch (e) {
      }
      fallbackTimer = setTimeout(function() {
        if (!convId) return;
        fallbackSnapshot(convId);
      }, delay);
    }
    function scheduleSwitchRefetch() {
      try {
        clearTimeout(switchRefetchTimer);
      } catch (e) {
      }
      switchRefetchTimer = setTimeout(function() {
        try {
          if (currentConvId && currentConvId !== lastLoadedConvId && lastHeaders && hasAuth(lastHeaders)) {
            activeRefresh("\u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0447\u0430\u0442\u0430 (\u0441\u0430\u0439\u0442 \u043D\u0435 \u0441\u0445\u043E\u0434\u0438\u043B \u0432 \u0441\u0435\u0442\u044C)");
          }
        } catch (e) {
          swallow(e, "page-intercept:switchRefetch-timer");
        }
      }, 1200);
    }
    var aiCmPoll = setIntervalVisible;
    aiCmPoll(function() {
      if (activeDisabled || !dirty || refreshBusy) return;
      activeRefresh("\u0442\u0430\u0439\u043C\u0435\u0440-\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430");
    }, 12e3);
    window.fetch = function(input, init) {
      var url = "";
      var method = "";
      try {
        url = urlOf(input);
        method = methodOf(input, init);
      } catch (e) {
        url = "";
        method = "";
      }
      if (isBackend(url)) {
        try {
          var h = captureHeaders(input, init);
          if (hasAuth(h)) lastHeaders = h;
        } catch (e) {
        }
      }
      var responsePromise;
      try {
        responsePromise = fetchGuarded(originalFetch, this, arguments);
      } catch (e) {
        return Promise.reject(e);
      }
      responsePromise.catch(function() {
      });
      if (isFullSnapshotGet(url, method)) {
        debugLog("log", "[ai-cm-intercept] req GET " + tail(url));
        var snapshotConvId = convIdFromBackendUrl(url);
        var isPassiveForCurrent = !!(snapshotConvId && snapshotConvId === currentConvId);
        if (isPassiveForCurrent) passiveGetInFlight = true;
        responsePromise.then(function(resp) {
          try {
            if (resp && resp.ok) {
              lastSnapshotUrl = url;
              dirty = false;
              handleSnapshot(resp, document.readyState === "complete" ? "\u043F\u043E\u0441\u043B\u0435 \u043E\u0442\u0432\u0435\u0442\u0430/\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F" : "\u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435", snapshotConvId);
            }
          } catch (e) {
            swallow(e, "page-intercept:poll-passive-snapshot");
          }
          if (isPassiveForCurrent) passiveGetInFlight = false;
          return resp;
        }, function() {
          if (isPassiveForCurrent) passiveGetInFlight = false;
        });
      }
      if (isSendPost(url, method)) scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438", 2500);
      if (isStreamEnd(url, method)) scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u043A\u043E\u043D\u0446\u0430 \u043E\u0442\u0432\u0435\u0442\u0430", 2e3);
      return responsePromise;
    };
    window.addEventListener("load", function() {
      var cid = getConvId();
      if (cid) scheduleFallback(cid, 2e3);
    });
    if (document.readyState === "complete") {
      var cid2 = getConvId();
      if (cid2) scheduleFallback(cid2, 2e3);
    }
    console.log("[ai-cm-intercept] \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A v14 (\u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 F5 + \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u0430\u044F \u043B\u043E\u0432\u043B\u044F + \u0434\u0435\u0442\u0435\u043A\u0442\u043E\u0440 \u0441\u043C\u0435\u043D\u044B \u0447\u0430\u0442\u0430 + \u0444\u0438\u043A\u0441 \u0433\u043E\u043D\u043A\u0438 GET + switch-refetch \u0441 constructedUrl + \u043F\u043E\u0434\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0447\u0443\u0436\u0438\u0445 unhandled fetch + \u043E\u0442\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0439 \u0444\u043E\u043B\u0431\u044D\u043A \u0441\u043D\u0438\u043C\u043A\u0430) \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
  })();
})();
