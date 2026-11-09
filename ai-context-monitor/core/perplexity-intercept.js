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

  // utils/perplexity-parser.ts
  function parsePerplexityThread(json) {
    function getTrim(obj, name) {
      if (!obj || typeof obj !== "object") return void 0;
      var rec = obj;
      var keys = Object.keys(rec);
      for (var i2 = 0; i2 < keys.length; i2++) {
        if (keys[i2].trim() === name) return rec[keys[i2]];
      }
      return void 0;
    }
    function isAttachmentUrl(url) {
      if (typeof url !== "string" || !url) return false;
      return url.indexOf("ppl-ai-file-upload") !== -1 && url.indexOf("/attachments/") !== -1;
    }
    function isImageAttachment(url) {
      if (!isAttachmentUrl(url)) return false;
      var path = String(url).split("#")[0].split("?")[0];
      return /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i.test(path);
    }
    function stripUrlQuery(url) {
      return String(url).split("#")[0].split("?")[0];
    }
    function collectEntryImages(entry2) {
      var out = [];
      var atts = getTrim(entry2, "attachments");
      if (!Array.isArray(atts)) return out;
      for (var a = 0; a < atts.length; a++) {
        var att = atts[a];
        var url = "";
        if (typeof att === "string") url = att;
        else if (att && typeof att === "object") url = getTrim(att, "url") || getTrim(att, "src") || "";
        if (!isImageAttachment(url)) continue;
        var clean = stripUrlQuery(url);
        if (out.indexOf(clean) === -1) out.push(clean);
      }
      return out;
    }
    function basenameOf(url) {
      var parts = String(url || "").split("/");
      return parts[parts.length - 1] || "";
    }
    var model = "";
    var pieces = [];
    var ids = [];
    var count = 0;
    var lastText = "";
    var messages = [];
    try {
      var entries = getTrim(json, "entries");
      if (!Array.isArray(entries)) entries = [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry || typeof entry !== "object") continue;
        var queryStr = getTrim(entry, "query_str") || "";
        var displayModel = getTrim(entry, "display_model") || "";
        var userSelectedModel = getTrim(entry, "user_selected_model") || "";
        var threadUrlSlug = getTrim(entry, "thread_url_slug") || "";
        var entryModel = displayModel || userSelectedModel || "";
        if (entryModel) model = entryModel;
        var entryId = threadUrlSlug || "entry" + i;
        var entryImages = collectEntryImages(entry);
        if (queryStr && typeof queryStr === "string" && queryStr.trim()) {
          var userText = queryStr.trim();
          for (var im = 0; im < entryImages.length; im++) {
            userText += "\n[Image: " + entryImages[im] + "]";
          }
          pieces.push(userText);
          ids.push(entryId + "_user");
          count++;
          lastText = userText;
          messages.push({ role: "user", text: userText });
        }
        var entryImageNames = [];
        for (var inm = 0; inm < entryImages.length; inm++) {
          entryImageNames.push(basenameOf(entryImages[inm]));
        }
        var blocks = getTrim(entry, "blocks");
        var assistantPushed = false;
        if (Array.isArray(blocks)) {
          var assistantTextParts = [];
          for (var j = 0; j < blocks.length; j++) {
            var block = blocks[j];
            if (!block || typeof block !== "object") continue;
            var wfBlock = getTrim(block, "workflow_block");
            if (wfBlock && typeof wfBlock === "object") {
              var steps = getTrim(wfBlock, "steps");
              if (Array.isArray(steps)) {
                for (var s = 0; s < steps.length; s++) {
                  var step = steps[s];
                  if (!step || typeof step !== "object") continue;
                  var items = getTrim(step, "items");
                  if (Array.isArray(items)) {
                    for (var it = 0; it < items.length; it++) {
                      var item = items[it];
                      if (!item || typeof item !== "object") continue;
                      if (getTrim(item, "type") === "WORKFLOW_ITEM_TEXT") {
                        var payload = getTrim(item, "payload");
                        if (payload && typeof payload === "object") {
                          var textPayload = getTrim(payload, "text_payload");
                          if (textPayload && typeof textPayload === "object") {
                            var text = getTrim(textPayload, "text");
                            if (typeof text === "string" && text.trim()) {
                              assistantTextParts.push(text.trim());
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            var wrBlock = getTrim(block, "web_result_block");
            if (wrBlock && typeof wrBlock === "object") {
              var webResults = getTrim(wrBlock, "web_results");
              if (Array.isArray(webResults)) {
                for (var w = 0; w < webResults.length; w++) {
                  var wr = webResults[w];
                  if (!wr || typeof wr !== "object") continue;
                  var wrName = getTrim(wr, "name") || "";
                  var wrSnippet = getTrim(wr, "snippet") || "";
                  var wrUrl = getTrim(wr, "url");
                  if (isAttachmentUrl(wrUrl)) continue;
                  if (!wrUrl && wrName && !wrSnippet && entryImageNames.indexOf(basenameOf(String(wrName))) !== -1) continue;
                  if (wrName || wrSnippet) {
                    var wrText = (wrName ? wrName + ": " : "") + (wrSnippet || "");
                    if (wrText.trim()) assistantTextParts.push("[source] " + wrText.trim());
                  }
                }
              }
            }
          }
          if (assistantTextParts.length > 0) {
            var assistantText = assistantTextParts.join("\n").trim();
            if (assistantText) {
              pieces.push(assistantText);
              ids.push(entryId + "_assistant");
              count++;
              lastText = assistantText;
              messages.push({ role: "assistant", text: assistantText });
              assistantPushed = true;
            }
          }
        }
        if (!assistantPushed) {
          var entryText = getTrim(entry, "text");
          if (typeof entryText === "string" && entryText.trim()) {
            var stepsJson = null;
            try {
              stepsJson = JSON.parse(entryText);
            } catch (e1) {
              stepsJson = null;
            }
            var stepItems = null;
            if (Array.isArray(stepsJson)) stepItems = stepsJson;
            else if (stepsJson && typeof stepsJson === "object") {
              stepItems = Object.keys(stepsJson).map(function(k) {
                return stepsJson[k];
              });
            }
            var answerText = "";
            if (stepItems) {
              for (var si = 0; si < stepItems.length; si++) {
                var stepItem = stepItems[si];
                if (!stepItem || typeof stepItem !== "object") continue;
                if (getTrim(stepItem, "step_type") !== "FINAL") continue;
                var stepContent = getTrim(stepItem, "content");
                var contentObj = null;
                if (typeof stepContent === "string") {
                  try {
                    contentObj = JSON.parse(stepContent);
                  } catch (e2) {
                    contentObj = null;
                  }
                } else if (stepContent && typeof stepContent === "object") {
                  contentObj = stepContent;
                }
                if (!contentObj) continue;
                var answerRaw = getTrim(contentObj, "answer");
                if (typeof answerRaw === "string" && answerRaw.trim()) {
                  var answerObj = null;
                  try {
                    answerObj = JSON.parse(answerRaw);
                  } catch (e3) {
                    answerObj = null;
                  }
                  if (answerObj && typeof answerObj === "object") {
                    var answerField = getTrim(answerObj, "answer");
                    if (typeof answerField === "string") answerText = answerField;
                  } else if (typeof answerObj === "string") {
                    answerText = answerObj;
                  }
                } else if (answerRaw && typeof answerRaw === "object") {
                  var answerField2 = getTrim(answerRaw, "answer");
                  if (typeof answerField2 === "string") answerText = answerField2;
                }
                if (answerText) break;
              }
            }
            answerText = answerText.trim();
            if (answerText) {
              pieces.push(answerText);
              ids.push(entryId + "_assistant");
              count++;
              lastText = answerText;
              messages.push({ role: "assistant", text: answerText });
            }
          }
        }
      }
    } catch (e) {
      swallowSoft(e, "perplexity-utils:parsePerplexityThread");
    }
    return {
      text: pieces.join("\n"),
      count,
      lastText,
      modelSlug: model,
      pieces,
      ids,
      messages,
      model
    };
  }
  function stripPerplexityHistoryTruncation(urlStr) {
    var src = String(urlStr || "");
    if (!src) return src;
    var hash = "";
    var h = src.indexOf("#");
    if (h !== -1) {
      hash = src.slice(h);
      src = src.slice(0, h);
    }
    var q = src.indexOf("?");
    if (q === -1) return src + hash;
    var base = src.slice(0, q);
    var parts = src.slice(q + 1).split("&");
    var kept = [];
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      var name = parts[i].split("=")[0];
      if (name === "limit" || name === "offset" || name === "from_first") continue;
      kept.push(parts[i]);
    }
    return base + (kept.length ? "?" + kept.join("&") : "") + hash;
  }

  // core/perplexity-intercept.js
  (function() {
    if (window.__aiCmPerplexityInterceptInstalled) return;
    window.__aiCmPerplexityInterceptInstalled = true;
    try {
      window.addEventListener("ai-cm-debug-logs", function(ev) {
        __aiCmSetDebugLogs(!!(ev && ev.detail));
      });
    } catch (e) {
    }
    console.log("[perplexity-intercept] parser available: " + typeof parsePerplexityThread);
    var originalFetch = window.fetch;
    if (typeof originalFetch !== "function") return;
    var lastHistoryUrl = null;
    var historyUrlTemplate = null;
    var lastModel = "";
    var refreshBusy = false;
    var activeDisabled = false;
    var activeRetryTimer = null;
    var activeRetryDelay = 3e4;
    var dirty = false;
    var loggedActiveStatus = false;
    var guardToken = "__aicm_perplexity__";
    function scheduleActiveRetry() {
      if (activeRetryTimer) return;
      activeRetryTimer = setTimeout(function() {
        activeRetryTimer = null;
        debugLog("log", "[perplexity-vf5] retry \u043F\u043E\u0441\u043B\u0435 \u0441\u0431\u043E\u044F (delay=" + activeRetryDelay + "\u043C\u0441)");
        activeRefresh("retry-backoff");
      }, activeRetryDelay);
      activeRetryDelay = Math.min(activeRetryDelay * 2, 12e4);
    }
    function clearActiveRetry() {
      if (activeRetryTimer) {
        clearTimeout(activeRetryTimer);
        activeRetryTimer = null;
      }
      activeRetryDelay = 3e4;
    }
    var snapshotReceived = false;
    var bootstrapTimer = null;
    var bootstrapAcceptJsonRetryTimer = null;
    var bootstrapAcceptJsonRetryCount = 0;
    var bootstrapAcceptJsonRetryDelay = 2e3;
    var bootstrapAcceptJsonInFlight = false;
    function scheduleBootstrapAcceptJsonRetry() {
      if (bootstrapAcceptJsonRetryCount >= 3) {
        console.log("[perplexity-intercept] bootstrap: Accept=json \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B JSON \u043F\u043E\u0441\u043B\u0435 3 \u0440\u0435\u0442\u0440\u0430\u0435\u0432 \u2014 \u0441\u0434\u0430\u0451\u043C\u0441\u044F \u0434\u043E \u0441\u043C\u0435\u043D\u044B \u0442\u0440\u0435\u0434\u0430");
        return;
      }
      if (bootstrapAcceptJsonRetryTimer) return;
      bootstrapAcceptJsonRetryTimer = setTimeout(function() {
        bootstrapAcceptJsonRetryTimer = null;
        bootstrapAcceptJsonRetryCount++;
        debugLog("log", "[perplexity-intercept] bootstrap: retry Accept=json #" + bootstrapAcceptJsonRetryCount + " (delay=" + bootstrapAcceptJsonRetryDelay + "\u043C\u0441)");
        bootstrapSnapshot();
      }, bootstrapAcceptJsonRetryDelay);
      bootstrapAcceptJsonRetryDelay = Math.min(bootstrapAcceptJsonRetryDelay * 2, 8e3);
    }
    function clearBootstrapAcceptJsonRetry() {
      if (bootstrapAcceptJsonRetryTimer) {
        clearTimeout(bootstrapAcceptJsonRetryTimer);
        bootstrapAcceptJsonRetryTimer = null;
      }
      bootstrapAcceptJsonRetryCount = 0;
      bootstrapAcceptJsonRetryDelay = 2e3;
      bootstrapAcceptJsonInFlight = false;
    }
    function getTrim(obj, name) {
      if (!obj || typeof obj !== "object") return void 0;
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].trim() === name) return obj[keys[i]];
      }
      return void 0;
    }
    function hasEntriesAndMetadata(data) {
      if (!data || typeof data !== "object") return false;
      var entries = getTrim(data, "entries");
      var meta = getTrim(data, "thread_metadata");
      return Array.isArray(entries) && meta && typeof meta === "object";
    }
    function extractUrl(args) {
      try {
        var a = args && args.length > 0 ? args[0] : void 0;
        var raw = "";
        if (typeof a === "string") {
          raw = a;
        } else if (a && typeof a.url === "string") {
          raw = a.url;
        } else if (a) {
          raw = String(a);
        }
        try {
          raw = new URL(raw, location.href).href;
        } catch (e) {
        }
        return raw;
      } catch (e) {
        return "";
      }
    }
    function getMethod(input, init) {
      try {
        if (init && init.method) return String(init.method).toUpperCase();
        if (input && input.method) return String(input.method).toUpperCase();
      } catch (e) {
        swallow(e, "perplexity:getMethod");
      }
      return "GET";
    }
    function isExcludedUrl(urlStr) {
      if (!urlStr) return true;
      if (urlStr.indexOf("_next/static") !== -1) return true;
      if (urlStr.indexOf("restricted-static-assets") !== -1) return true;
      if (urlStr.indexOf("cdn-cgi") !== -1) return true;
      if (urlStr.indexOf("datadoghq") !== -1) return true;
      if (urlStr.indexOf("eppo") !== -1) return true;
      if (/\.(js|css|png|svg|woff|woff2|ico|jpg|jpeg|gif|webp|mp4|webm)(\?|#|$)/.test(urlStr)) return true;
      return false;
    }
    function isPerplexityUrl(urlStr) {
      try {
        if (!urlStr) return false;
        var u = new URL(urlStr, location.href);
        var host = u.hostname.toLowerCase();
        return host === "www.perplexity.ai" || host === "perplexity.ai";
      } catch (e) {
        return false;
      }
    }
    function getConvId() {
      try {
        var parts = location.pathname.split("/");
        if (parts.length >= 3) {
          var type = parts[1];
          if (type === "search" || type === "thread" || type === "session") return parts.slice(2).join("/");
        }
        return "";
      } catch (e) {
        return "";
      }
    }
    var currentConvId = getConvId();
    function slugFromThreadUrl(urlStr) {
      try {
        if (!urlStr) return "";
        var path = String(urlStr);
        try {
          path = new URL(String(urlStr), location.href).pathname;
        } catch (eU) {
          path = String(urlStr);
        }
        var m = path.match(/\/(?:search|thread|session|rest\/thread|rest\/session|api\/thread)\/([^\/?#]+)/);
        if (!m) return "";
        var raw = m[1];
        try {
          raw = decodeURIComponent(raw);
        } catch (eD) {
        }
        return String(raw).trim();
      } catch (e) {
        return "";
      }
    }
    function snapshotSlug(data, url) {
      try {
        var meta = getTrim(data, "thread_metadata");
        if (meta && typeof meta === "object") {
          var names = ["slug", "url_slug", "thread_url_slug", "thread_id"];
          for (var i = 0; i < names.length; i++) {
            var cand = getTrim(meta, names[i]);
            if (typeof cand === "string" && cand.trim()) return cand.trim();
          }
        }
        var entries = getTrim(data, "entries");
        if (Array.isArray(entries)) {
          var only = null;
          for (var j = 0; j < entries.length; j++) {
            var s = getTrim(entries[j], "thread_url_slug");
            if (typeof s !== "string" || !s.trim()) continue;
            s = s.trim();
            if (only === null) only = s;
            else if (only !== s) {
              only = null;
              break;
            }
          }
          if (only) return only;
        }
        return slugFromThreadUrl(url);
      } catch (e) {
        return "";
      }
    }
    var FULL_HISTORY_QUERY = "?with_parent_info=true&supported_block_use_cases=true";
    var FULL_HISTORY_PARAMS = ["with_parent_info", "supported_block_use_cases"];
    function hasFullHistoryParams(urlStr) {
      var u = String(urlStr || "");
      var q = u.indexOf("?");
      if (q === -1) return false;
      var query = u.slice(q + 1);
      for (var i = 0; i < FULL_HISTORY_PARAMS.length; i++) {
        if (query.indexOf(FULL_HISTORY_PARAMS[i]) !== -1) return true;
      }
      return false;
    }
    function normalizeHistoryUrl(urlStr) {
      return stripPerplexityHistoryTruncation(String(urlStr || ""));
    }
    function learnTemplateFromRejectedUrl(urlStr) {
      if (historyUrlTemplate) return false;
      var url = String(urlStr || "");
      if (!hasFullHistoryParams(url)) return false;
      var m = url.match(/\/(?:search|thread|session|rest\/thread|rest\/session|api\/thread)\/([^\/?#]+)/);
      if (!m) return false;
      historyUrlTemplate = normalizeHistoryUrl(url.slice(0, m.index) + m[0].slice(0, m[0].length - m[1].length) + "{slug}" + url.slice(m.index + m[0].length));
      debugLog("log", "[perplexity-intercept] \u0433\u0435\u0439\u0442 M-12: \u0448\u0430\u0431\u043B\u043E\u043D \u0432\u044B\u0443\u0447\u0435\u043D \u0438\u0437 URL \u043E\u0442\u043A\u043B\u043E\u043D\u0451\u043D\u043D\u043E\u0433\u043E \u0441\u043D\u0438\u043C\u043A\u0430: " + historyUrlTemplate);
      return true;
    }
    function resetForNewConversation() {
      lastHistoryUrl = null;
      lastModel = "";
      dirty = false;
      refreshBusy = false;
      activeDisabled = false;
      loggedActiveStatus = false;
      snapshotReceived = false;
      clearBootstrapAcceptJsonRetry();
      clearActiveRetry();
      if (bootstrapTimer) {
        clearTimeout(bootstrapTimer);
        bootstrapTimer = null;
      }
      debugLog("log", "[perplexity-intercept] \u0441\u043C\u0435\u043D\u0430 \u0442\u0440\u0435\u0434\u0430 \u2192 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u043E (slug=" + (currentConvId || "(\u043D\u0435 \u0442\u0440\u0435\u0434)") + ")");
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-conversation-changed"));
      } catch (e) {
      }
      bootstrapTimer = setTimeout(function() {
        bootstrapSnapshot();
      }, 1500);
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
    function bootstrapSnapshot() {
      if (bootstrapTimer) {
        clearTimeout(bootstrapTimer);
        bootstrapTimer = null;
      }
      if (!currentConvId) {
        debugLog("log", "[perplexity-intercept] bootstrap: \u043D\u0435\u0442 slug \u2014 \u043D\u0435 \u0442\u0440\u0435\u0434");
        return;
      }
      if (snapshotReceived) {
        debugLog("log", "[perplexity-intercept] bootstrap: \u043D\u0435 \u043D\u0443\u0436\u0435\u043D");
        return;
      }
      if (historyUrlTemplate) {
        var url = historyUrlTemplate.replace("{slug}", currentConvId);
        debugLog("log", "[perplexity-intercept] bootstrap: \u043F\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u0443 (" + url + ")");
        originalFetch(url, { credentials: "include" }).then(function(resp) {
          if (!resp || !resp.ok) return null;
          return resp.json();
        }).then(function(data) {
          if (!data || currentConvId !== getConvId()) return;
          snapshotReceived = true;
          lastHistoryUrl = url;
          emitSnapshot(data, "bootstrap");
        }).catch(function(e) {
          debugLog("log", "[perplexity-intercept] bootstrap: \u043E\u0448\u0438\u0431\u043A\u0430 " + e);
        });
      } else if (bootstrapAcceptJsonRetryCount < 3 && !bootstrapAcceptJsonInFlight) {
        var url2 = new URL(location.pathname, location.href).href;
        debugLog("log", "[perplexity-intercept] bootstrap: Accept=json (\u043F\u043E\u043F\u044B\u0442\u043A\u0430 " + (bootstrapAcceptJsonRetryCount + 1) + ", " + url2 + ")");
        bootstrapAcceptJsonInFlight = true;
        originalFetch(url2, { headers: { "Accept": "application/json" }, credentials: "include" }).then(function(resp) {
          if (!resp || !resp.ok) return null;
          return resp.text();
        }).then(function(rawText) {
          bootstrapAcceptJsonInFlight = false;
          if (!rawText) return;
          try {
            var data = JSON.parse(rawText);
            if (hasEntriesAndMetadata(data)) {
              clearBootstrapAcceptJsonRetry();
              snapshotReceived = true;
              lastHistoryUrl = url2;
              tryBuildTemplate(url2, data);
              emitSnapshot(data, "bootstrap");
            } else {
              bootstrapRestSnapshot();
            }
          } catch (e) {
            bootstrapRestSnapshot();
          }
        }).catch(function(e) {
          bootstrapAcceptJsonInFlight = false;
          bootstrapRestSnapshot();
        });
      }
    }
    function bootstrapRestSnapshot() {
      if (!currentConvId) return;
      var restUrl = location.origin + "/rest/thread/" + currentConvId + FULL_HISTORY_QUERY;
      debugLog("log", "[perplexity-intercept] bootstrap: REST-fallback (" + restUrl + ")");
      originalFetch(restUrl, { credentials: "include" }).then(function(resp) {
        if (!resp || !resp.ok) return null;
        return resp.json();
      }).then(function(data) {
        if (currentConvId !== getConvId()) return;
        if (!data || !hasEntriesAndMetadata(data)) {
          scheduleBootstrapAcceptJsonRetry();
          return;
        }
        clearBootstrapAcceptJsonRetry();
        snapshotReceived = true;
        lastHistoryUrl = restUrl;
        tryBuildTemplate(restUrl, data);
        emitSnapshot(data, "bootstrap-rest");
      }).catch(function(e) {
        scheduleBootstrapAcceptJsonRetry();
        debugLog("log", "[perplexity-intercept] bootstrap: REST-fallback \u043E\u0448\u0438\u0431\u043A\u0430 " + e);
      });
    }
    function emitSnapshot(data, when) {
      var parsed = { text: "", count: 0 };
      try {
        parsed = parsePerplexityThread(data) || { text: "", count: 0 };
      } catch (e) {
        console.log("[perplexity-intercept] \u043E\u0448\u0438\u0431\u043A\u0430 emitSnapshot:", e && e.message);
        return;
      }
      if (!parsed || !parsed.text) return;
      var model = parsed.model || lastModel || "";
      if (model) lastModel = model;
      console.log("[perplexity-intercept] " + String.fromCodePoint(128229) + " \u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (" + when + "): " + parsed.count + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, model=" + (model || "(\u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E)"));
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", {
          detail: {
            text: parsed.text,
            count: parsed.count,
            lastMessageText: parsed.lastText,
            modelSlug: model,
            messageTexts: parsed.pieces || [],
            messageIds: parsed.ids || [],
            messages: parsed.messages || [],
            attachTokens: 0,
            attachBreak: { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 },
            historyComplete: true,
            serverTokens: 0
          }
        }));
      } catch (e) {
        console.log("[perplexity-intercept] \u043E\u0448\u0438\u0431\u043A\u0430 emitSnapshot:", e && e.message);
      }
    }
    function tryBuildTemplate(url, data) {
      if (historyUrlTemplate) return;
      var slugToReplace = "";
      var entries = getTrim(data, "entries");
      if (Array.isArray(entries) && entries.length > 0) {
        var firstSlug = getTrim(entries[0], "thread_url_slug");
        if (firstSlug && typeof firstSlug === "string" && url.indexOf(firstSlug) !== -1) slugToReplace = firstSlug;
        if (!slugToReplace) {
          var enc = encodeURIComponent(firstSlug || "");
          if (enc && url.indexOf(enc) !== -1) slugToReplace = enc;
        }
      }
      if (!slugToReplace && currentConvId) {
        if (url.indexOf(currentConvId) !== -1) slugToReplace = currentConvId;
        else {
          var enc2 = encodeURIComponent(currentConvId);
          if (url.indexOf(enc2) !== -1) slugToReplace = enc2;
        }
      }
      if (slugToReplace) {
        historyUrlTemplate = normalizeHistoryUrl(url.replace(slugToReplace, "{slug}"));
        debugLog("log", "[perplexity-intercept] historyUrlTemplate \u0432\u044B\u0443\u0447\u0435\u043D: " + historyUrlTemplate);
        if (currentConvId && !snapshotReceived) {
          if (bootstrapTimer) {
            clearTimeout(bootstrapTimer);
            bootstrapTimer = null;
          }
          bootstrapTimer = setTimeout(function() {
            bootstrapSnapshot();
          }, 300);
        }
      }
    }
    var PERPLEXITY_DOM_MESSAGE_SELECTORS = [
      '[data-testid="answer"]',
      '[data-testid="copilot-answer"]',
      '[class*="prose"]'
    ];
    function aiCmPerplexityDomMessageCount() {
      try {
        if (typeof document === "undefined" || !document || typeof document.querySelectorAll !== "function") return 0;
        var best = 0;
        for (var i = 0; i < PERPLEXITY_DOM_MESSAGE_SELECTORS.length; i++) {
          var n = 0;
          try {
            n = document.querySelectorAll(PERPLEXITY_DOM_MESSAGE_SELECTORS[i]).length;
          } catch (eQ) {
            n = 0;
          }
          if (n > best) best = n;
        }
        return best;
      } catch (e) {
        return 0;
      }
    }
    function processHistoryData(data, url, source) {
      if (!data) return;
      var domMsgs = aiCmPerplexityDomMessageCount();
      if (!currentConvId && domMsgs <= 0) {
        debugLog("log", "[perplexity-intercept] \u0441\u043D\u0438\u0444\u0444\u0438\u043D\u0433 (" + source + "): \u043D\u0435\u0442 slug \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u2014 \u043D\u0435 \u0442\u0440\u0435\u0434, \u0441\u043D\u0438\u043C\u043E\u043A \u043D\u0435 \u044D\u043C\u0438\u0442\u0438\u043C (" + url + ")");
        learnTemplateFromRejectedUrl(url);
        return;
      }
      if (!currentConvId) {
        debugLog("log", "[perplexity-intercept] \u0441\u043D\u0438\u0444\u0444\u0438\u043D\u0433 (" + source + "): \u043D\u0435\u0442 slug \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B, \u043D\u043E \u0432 DOM " + domMsgs + " \u0441\u043E\u043E\u0431\u0449. \u2014 \u044D\u043C\u0438\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D (M-12 fallback)");
      }
      if (currentConvId) {
        var sniffSlug = snapshotSlug(data, url);
        if (sniffSlug !== currentConvId) {
          debugLog("log", "[perplexity-intercept] \u0441\u043D\u0438\u0444\u0444\u0438\u043D\u0433 (" + source + "): \u0447\u0443\u0436\u043E\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (slug=" + (sniffSlug || "(\u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D)") + " != slug \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B " + currentConvId + ") \u2014 \u043F\u0440\u043E\u043F\u0443\u0441\u043A, URL: " + url);
          learnTemplateFromRejectedUrl(url);
          return;
        }
      }
      console.log("[perplexity-intercept] \u0441\u043D\u0438\u0444\u0444\u0438\u043D\u0433: \u0441\u043D\u0438\u043C\u043E\u043A \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u043F\u043E\u0439\u043C\u0430\u043D (" + source + "), URL: " + url);
      if (bootstrapTimer) {
        clearTimeout(bootstrapTimer);
        bootstrapTimer = null;
      }
      snapshotReceived = true;
      lastHistoryUrl = url;
      tryBuildTemplate(url, data);
      emitSnapshot(data, source);
    }
    function activeRefresh(reason) {
      if (activeDisabled || refreshBusy) return;
      var url = lastHistoryUrl;
      if (!url && historyUrlTemplate && currentConvId) url = historyUrlTemplate.replace("{slug}", currentConvId);
      if (!url) {
        debugLog("log", "[perplexity-vf5] \u043D\u0435\u0442 \u0430\u0434\u0440\u0435\u0441\u0430 \u0441\u043D\u0438\u043C\u043A\u0430 \u2192 bootstrapSnapshot (\u0432\u044B\u0443\u0447\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D)");
        if (loggedActiveStatus) loggedActiveStatus = false;
        bootstrapSnapshot();
        return;
      }
      if (!currentConvId) return;
      var sentConvId = currentConvId;
      refreshBusy = true;
      var sep = url.indexOf("?") === -1 ? "?" : "&";
      originalFetch(url + sep + guardToken + "=1", { method: "GET", credentials: "include" }).then(function(resp) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
          console.log("[perplexity-vf5] \u043F\u0435\u0440\u0432\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441: \u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none"));
        }
        if (!resp || !resp.ok) {
          activeDisabled = true;
          scheduleActiveRetry();
          debugLog("log", "[perplexity-vf5] \u043D\u0435 \u043F\u0440\u043E\u0448\u0451\u043B (\u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none") + ") \u2192 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u0430\u044F \u043B\u043E\u0432\u043B\u044F, retry \u0447\u0435\u0440\u0435\u0437 " + activeRetryDelay / 1e3 + "\u0441");
          return null;
        }
        clearActiveRetry();
        console.log("[perplexity-vf5] \u2713 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 (" + reason + ")");
        return resp.json();
      }).then(function(data) {
        if (!data || sentConvId !== currentConvId) return;
        emitSnapshot(data, "\u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 F5");
        dirty = false;
      }).catch(function(err) {
        if (!loggedActiveStatus) loggedActiveStatus = true;
        activeDisabled = true;
        scheduleActiveRetry();
        debugLog("log", "[perplexity-vf5] \u043E\u0448\u0438\u0431\u043A\u0430: " + err + " \u2192 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u0430\u044F \u043B\u043E\u0432\u043B\u044F, retry \u0447\u0435\u0440\u0435\u0437 " + activeRetryDelay / 1e3 + "\u0441");
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
    function sniffResponseText(resp, url, source) {
      try {
        var copy = resp.clone ? resp.clone() : resp;
        copy.text().then(function(rawText) {
          try {
            var data = JSON.parse(rawText);
            if (hasEntriesAndMetadata(data)) processHistoryData(data, url, source);
            else {
              var he = getTrim(data, "entries");
              if (he !== void 0) debugLog("log", "[perplexity-intercept] JSON \u0441 entries \u043D\u043E \u043D\u0435\u0442 thread_metadata");
            }
          } catch (e) {
            console.log("[perplexity-intercept] \u043E\u0448\u0438\u0431\u043A\u0430 emitSnapshot:", e && e.message);
          }
        }).catch(function() {
        });
      } catch (e) {
        swallow(e, "perplexity:sniffResponseText");
      }
    }
    (function() {
      var origXHROpen = XMLHttpRequest.prototype.open;
      var origXHRSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        this.__aicm_method = method;
        this.__aicm_url = url;
        return origXHROpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        var xhr = this;
        var method = (xhr.__aicm_method || "GET").toUpperCase();
        var rawUrl = xhr.__aicm_url || "";
        var url = rawUrl;
        try {
          url = new URL(rawUrl, location.href).href;
        } catch (e) {
          url = rawUrl;
        }
        if (method === "GET" && isPerplexityUrl(url) && !isExcludedUrl(url) && url.indexOf(guardToken) === -1) {
          xhr.addEventListener("loadend", function() {
            var respUrl = this.responseURL;
            try {
              respUrl = new URL(respUrl || url, location.href).href;
            } catch (e) {
            }
            console.log("[perplexity-intercept] diag: XHR same-host GET", (respUrl || url).slice(0, 140));
            try {
              var data = JSON.parse(xhr.responseText);
              if (hasEntriesAndMetadata(data)) processHistoryData(data, respUrl || url, "XHR");
              else {
                var he = getTrim(data, "entries");
                if (he !== void 0) debugLog("log", "[perplexity-intercept] XHR: JSON \u0441 entries \u043D\u043E \u043D\u0435\u0442 thread_metadata");
              }
            } catch (e) {
              console.log("[perplexity-intercept] \u043E\u0448\u0438\u0431\u043A\u0430 emitSnapshot:", e && e.message);
            }
          });
        }
        return origXHRSend.apply(this, arguments);
      };
    })();
    window.fetch = function() {
      var url = extractUrl(arguments);
      var method = getMethod(arguments[0], arguments[1]);
      var isAsk = method === "POST" && url.indexOf("perplexity_ask") !== -1;
      var isSameHost = isPerplexityUrl(url);
      var isExcluded = isExcludedUrl(url);
      var isGuard = url.indexOf(guardToken) !== -1;
      var shouldSniff = method !== "POST" && isSameHost && !isExcluded && !isGuard;
      if (isSameHost && !isExcluded && !isGuard) {
        console.log("[perplexity-intercept] diag: same-host GET", url.slice(0, 140));
      }
      var fetchPromise = fetchGuarded(originalFetch, this, arguments);
      if (shouldSniff) {
        fetchPromise.then(function(resp) {
          if (!resp || !resp.ok) return;
          sniffResponseText(resp, url, "fetch");
        }).catch(function() {
        });
      }
      if (isAsk) {
        fetchPromise.then(function(resp) {
          if (!resp || !resp.ok || !resp.body) return;
          var reader = resp.clone().body.getReader();
          var decoder = new TextDecoder("utf-8");
          var chunks = [];
          function readLoop() {
            reader.read().then(function(result) {
              if (result.done) {
                scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u0440\u0438\u043C\u0430", 800);
                return;
              }
              chunks.push(decoder.decode(result.value, { stream: true }));
              readLoop();
            }).catch(function() {
              scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u0440\u0438\u043C\u0430 (err)", 1200);
            });
          }
          readLoop();
        }).catch(function() {
        });
      }
      if (fetchPromise && typeof fetchPromise.catch === "function") fetchPromise.catch(function() {
      });
      return fetchPromise;
    };
    var aiCmPoll = setIntervalVisible;
    aiCmPoll(function() {
      if (dirty && !refreshBusy) activeRefresh("\u0442\u0430\u0439\u043C\u0435\u0440-\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430");
    }, 15e3);
    bootstrapTimer = setTimeout(function() {
      bootstrapSnapshot();
    }, 1500);
    console.log("[perplexity-intercept] \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Perplexity \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D (parsePerplexityThread + extractUrl + \u0441\u043D\u0438\u0444\u0444\u0438\u043D\u0433, MAIN world, document_start)");
  })();
})();
