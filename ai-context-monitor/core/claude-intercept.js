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

  // core/claude-intercept.js
  (function() {
    if (window.__aiCmClaudeInterceptInstalled) return;
    window.__aiCmClaudeInterceptInstalled = true;
    try {
      window.addEventListener("ai-cm-debug-logs", function(ev) {
        __aiCmSetDebugLogs(!!(ev && ev.detail));
      });
    } catch (e) {
    }
    function traceLog(msg) {
      try {
        if (window.__aiCmDebugLogs) console.info("[AI CM][Claude][trace] " + msg);
      } catch (e) {
      }
    }
    var originalFetch = window.fetch;
    if (typeof originalFetch !== "function") return;
    var lastHistoryUrl = null;
    var lastOrgPrefix = "";
    var lastModel = "";
    var refreshBusy = false;
    var activeDisabled = false;
    var activeRetryTimer = null;
    var activeRetryDelay = 3e4;
    var dirty = false;
    var loggedActiveStatus = false;
    var guardToken = "__aicm_claude__";
    function scheduleActiveRetry() {
      if (activeRetryTimer) return;
      var retryConvId = currentConvId;
      activeRetryTimer = setTimeout(function() {
        activeRetryTimer = null;
        if (currentConvId !== retryConvId) {
          traceLog("vf5 retry skip (\u0447\u0430\u0442 \u0441\u043C\u0435\u043D\u0438\u043B\u0441\u044F)");
          return;
        }
        debugLog("log", "[claude-vf5] retry \u043F\u043E\u0441\u043B\u0435 \u0441\u0431\u043E\u044F (delay=" + activeRetryDelay + "\u043C\u0441)");
        try {
          activeRefresh("retry-backoff");
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] vf5 retry timer: " + e.message);
        }
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
    var orgId = "";
    var snapshotReceived = false;
    var bootstrapTimer = null;
    var validEmitConvId = "";
    var validEmitCount = 0;
    var IMAGE_DEFAULT_TOKENS = 516;
    var DOC_EST_TOKENS = 2500;
    var attachSeen = {};
    var attachTokens = 0;
    var attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
    var loggedAttach = false;
    var fileTextCache = {};
    var fileFetchInFlight = {};
    var fileTextCacheMax = 50;
    var fileTextCacheOrder = [];
    function fileTextCacheInsert(uuid, val) {
      try {
        var idx = fileTextCacheOrder.indexOf(uuid);
        if (idx !== -1) fileTextCacheOrder.splice(idx, 1);
        fileTextCache[uuid] = val;
        fileTextCacheOrder.push(uuid);
        while (fileTextCacheOrder.length > fileTextCacheMax) {
          var oldest = fileTextCacheOrder.shift();
          delete fileTextCache[oldest];
        }
      } catch (e) {
        swallow(e, "claude:fileTextCacheInsert");
      }
    }
    function fileTextCacheTouch(uuid) {
      try {
        var idx = fileTextCacheOrder.indexOf(uuid);
        if (idx !== -1) {
          fileTextCacheOrder.splice(idx, 1);
          fileTextCacheOrder.push(uuid);
        }
      } catch (e) {
        swallow(e, "claude:fileTextCacheTouch");
      }
    }
    var lastHistoryRaw = null;
    var lastHistoryRawConvId = "";
    var postSendTimer = null;
    var lastEmitDetail = null;
    var lastEmitDetailConvId = "";
    var internalFetchUrls = {};
    function markInternalUrl(u) {
      internalFetchUrls[u] = true;
      setTimeout(function() {
        try {
          delete internalFetchUrls[u];
        } catch (e) {
        }
      }, 6e4);
    }
    var PASTED_TEXT_FIELDS = ["extracted_text", "preview_text", "text_content", "content_text", "pasted_text", "paste", "text", "content", "body", "value", "contents"];
    function findPastedInValue(val, depth, found) {
      if (!val || typeof val !== "object" || depth > 6) return;
      if (Array.isArray(val)) {
        for (var ai = 0; ai < val.length; ai++) findPastedInValue(val[ai], depth + 1, found);
        return;
      }
      var id = "";
      try {
        id = typeof val.file_uuid === "string" && val.file_uuid || typeof val.uuid === "string" && val.uuid || "";
      } catch (e) {
        swallow(e, "claude:find-pasted-id");
      }
      if (id) {
        if (val.file_kind) {
          try {
            debugLog("log", "[AI CM][Claude][pasted] req-keys keys=" + Object.keys(val).join("|"));
          } catch (e) {
          }
        }
        for (var fi = 0; fi < PASTED_TEXT_FIELDS.length; fi++) {
          var fv = null;
          try {
            fv = val[PASTED_TEXT_FIELDS[fi]];
          } catch (e) {
            swallow(e, "claude:find-pasted-field");
          }
          if (typeof fv === "string" && fv.trim()) {
            found.push({ uuid: id, key: PASTED_TEXT_FIELDS[fi], text: fv });
            break;
          }
        }
      }
      try {
        var ks = Object.keys(val);
        for (var ki = 0; ki < ks.length; ki++) {
          var child = null;
          try {
            child = val[ks[ki]];
          } catch (e) {
            swallow(e, "claude:find-pasted-child");
          }
          if (child && typeof child === "object") findPastedInValue(child, depth + 1, found);
        }
      } catch (e) {
        swallow(e, "claude:find-pasted-keys");
      }
    }
    function applyFoundPasted(found) {
      if (!found || !found.length) return false;
      var applied = false;
      for (var i = 0; i < found.length; i++) {
        var it = found[i];
        var cur = Object.prototype.hasOwnProperty.call(fileTextCache, it.uuid) ? fileTextCache[it.uuid] : void 0;
        if (typeof cur === "string") {
          fileTextCacheTouch(it.uuid);
          continue;
        }
        var t = it.text;
        var realLen = t.length;
        if (realLen > 5e5) {
          t = t.slice(0, 5e5) + "\n[\u043E\u0431\u0440\u0435\u0437\u0430\u043D\u043E]";
        }
        fileTextCacheInsert(it.uuid, t);
        fetchAttempted[it.uuid] = true;
        debugLog("log", "[AI CM][Claude][pasted] req-body uuid=" + String(it.uuid).slice(0, 8) + " textLen=" + realLen + " keys=" + it.key);
        applied = true;
      }
      return applied;
    }
    function clipKeyList(obj) {
      var out = "";
      try {
        var ks = Object.keys(obj || {}).slice(0, 20);
        for (var i = 0; i < ks.length; i++) ks[i] = String(ks[i]).slice(0, 40);
        out = ks.join("|");
      } catch (eK) {
        out = "(err)";
      }
      return out;
    }
    function traceBodyStruct(url, rawText) {
      try {
        var data = JSON.parse(rawText);
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        traceLog("body-struct url=" + String(url).slice(0, 80) + " keys=" + clipKeyList(data));
        var ks = Object.keys(data).slice(0, 20);
        for (var i = 0; i < ks.length; i++) {
          var k = String(ks[i]);
          var v = null;
          try {
            v = data[k];
          } catch (eG) {
            continue;
          }
          if (!v || typeof v !== "object") continue;
          var isArr = Array.isArray(v);
          var line = "body-struct." + k.slice(0, 40) + " kind=" + (isArr ? "array" : "object");
          if (isArr) {
            line += " len=" + Math.min(v.length, 999);
            if (v.length > 0 && v[0] && typeof v[0] === "object" && !Array.isArray(v[0])) {
              line += " itemKeys=" + clipKeyList(v[0]);
            }
          } else {
            line += " subkeys=" + clipKeyList(v);
          }
          traceLog(line);
        }
      } catch (e) {
      }
    }
    var DECOMP_FORMATS = ["gzip", "deflate", "deflate-raw"];
    function decompressProbe(url, u8) {
      var dLen = -1;
      try {
        dLen = u8 && typeof u8.byteLength === "number" ? u8.byteLength : u8 && u8.length || -1;
      } catch (eLen) {
      }
      var ctorS = "";
      try {
        ctorS = Object.prototype.toString.call(u8).replace(/^\[object /, "").replace(/\]$/, "").slice(0, 40);
      } catch (eCt) {
      }
      traceLog("decomp-start url=" + String(url).slice(0, 160) + " len=" + dLen + " ctor=" + ctorS);
      try {
        if (!u8 || u8.length < 64 || u8.length > 2 * 1024 * 1024) {
          traceLog("body-decomp all-failed len=" + dLen);
          return;
        }
        var tryNext = function(idx) {
          try {
            if (idx >= DECOMP_FORMATS.length) {
              traceLog("body-decomp all-failed len=" + u8.length);
              return;
            }
            var fmt = DECOMP_FORMATS[idx];
            var ds = null;
            try {
              ds = new DecompressionStream(fmt);
            } catch (eC) {
              setTimeout(function() {
                tryNext(idx + 1);
              }, 0);
              return;
            }
            var copy = u8.slice();
            var srcStream = null;
            try {
              srcStream = new Response(copy).body.pipeThrough(ds);
            } catch (eS) {
              setTimeout(function() {
                tryNext(idx + 1);
              }, 0);
              return;
            }
            new Response(srcStream).text().then(function(text) {
              try {
                var prev = "";
                try {
                  prev = (String(text).match(/[\x20-\x7E\u00A0-\uD7FF\uE000-\uFFFD]{4,}/g) || []).join("|").slice(0, 150);
                } catch (eP) {
                }
                if (prev) {
                  traceLog("body-decomp url=" + String(url).slice(0, 160) + " format=" + fmt + " ok=1 outLen=" + text.length + " preview=" + prev);
                  traceDecompStruct(text);
                  captureSettleTarget(url, text);
                  try {
                    var dj = JSON.parse(text);
                    var dAtts = dj && Array.isArray(dj.attachments) ? dj.attachments : [];
                    for (var di = 0; di < dAtts.length; di++) {
                      var da = dAtts[di];
                      if (!da || typeof da.extracted_content !== "string" || !da.extracted_content.trim()) continue;
                      var dName = String(da.file_name || "pasted").slice(0, 40);
                      var dSize = Number(da.file_size || 0) || 0;
                      var dText = da.extracted_content.slice(0, 5e5);
                      reqAttachCache[dName + "|" + dSize] = dText;
                      var rk = Object.keys(reqAttachCache);
                      while (rk.length > 5) {
                        delete reqAttachCache[rk[0]];
                        rk.shift();
                      }
                      debugLog("log", "[AI CM][Claude][pasted] req-attach name=" + dName + " size=" + dSize + " textLen=" + dText.length);
                    }
                  } catch (eDA) {
                  }
                } else {
                  setTimeout(function() {
                    tryNext(idx + 1);
                  }, 0);
                }
              } catch (eO) {
                setTimeout(function() {
                  tryNext(idx + 1);
                }, 0);
              }
            }).catch(function() {
              setTimeout(function() {
                tryNext(idx + 1);
              }, 0);
            });
          } catch (eT) {
            setTimeout(function() {
              tryNext(idx + 1);
            }, 0);
          }
        };
        tryNext(0);
      } catch (e) {
        traceLog("decomp-error msg=" + (e && e.message || String(e)));
      }
    }
    function traceDecompStruct(text) {
      try {
        var data = JSON.parse(text);
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        traceLog("decomp-struct keys=" + clipKeyList(data));
        var ks = Object.keys(data).slice(0, 20);
        for (var i = 0; i < ks.length; i++) {
          var k = String(ks[i]);
          var v = null;
          try {
            v = data[k];
          } catch (eG) {
            continue;
          }
          if (!v || typeof v !== "object") continue;
          var isArr = Array.isArray(v);
          var line = "decomp-struct." + k.slice(0, 40) + " kind=" + (isArr ? "array" : "object");
          if (isArr) {
            line += " len=" + Math.min(v.length, 999);
            if (v.length > 0 && v[0] && typeof v[0] === "object" && !Array.isArray(v[0])) {
              line += " itemKeys=" + clipKeyList(v[0]);
            }
          } else {
            line += " subkeys=" + clipKeyList(v);
          }
          traceLog(line);
        }
      } catch (e) {
      }
    }
    function processPostBody(url, rawText) {
      var jsonOk = 0;
      try {
        if (!rawText || typeof rawText !== "string") return 0;
        if (rawText.length > 5 * 1024 * 1024) return 0;
        var roots = [];
        var parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch (e) {
          parsed = null;
        }
        if (parsed) {
          roots.push(parsed);
        } else {
          var pairs = rawText.split("&");
          for (var pi = 0; pi < pairs.length && pi < 200; pi++) {
            var eq = pairs[pi].indexOf("=");
            if (eq === -1) continue;
            var v = pairs[pi].substring(eq + 1);
            try {
              v = decodeURIComponent(v.replace(/\+/g, " "));
            } catch (e2) {
            }
            if (v.charAt(0) === "{" || v.charAt(0) === "[") {
              try {
                roots.push(JSON.parse(v));
              } catch (e3) {
                swallow(e3, "claude:processPostBody-json-parse");
              }
            }
          }
        }
        jsonOk = roots.length > 0 ? 1 : 0;
        var found = [];
        for (var ri = 0; ri < roots.length; ri++) findPastedInValue(roots[ri], 1, found);
        if (applyFoundPasted(found)) scheduleReEmit("req-body");
      } catch (e) {
        swallow(e, "claude:processPostBody");
      }
      return jsonOk;
    }
    function capturePostBody(input, init) {
      try {
        var url = "", method = "GET", body = null;
        var hasInitBody = !!(init && init.body != null);
        if (typeof input === "string") {
          url = input;
          method = init && init.method || "GET";
          body = init ? init.body : null;
        } else if (input && typeof input === "object") {
          url = input.url || "";
          method = init && init.method || input.method || "GET";
          body = hasInitBody ? init.body : null;
        }
        method = String(method).toUpperCase();
        var isApiScan = !!url && url.indexOf("/api/") !== -1 && url.indexOf(guardToken) === -1 && !internalFetchUrls[url] && !NOISE_URL_RE.test(url) && (method === "POST" || method === "PUT");
        if (!isApiScan) return;
        if (/\/completion/.test(String(url)) && method === "POST") {
          var sendConvId = "";
          try {
            var mSend = String(url).match(/\/chat_conversations\/([0-9a-fA-F-]{8,})/);
            if (mSend) sendConvId = mSend[1];
            var orgAt = String(url).indexOf("/api/organizations/");
            if (orgAt !== -1) {
              var convAt = String(url).indexOf("/chat_conversations/", orgAt);
              if (convAt !== -1) lastOrgPrefix = String(url).slice(orgAt, convAt + "/chat_conversations/".length);
            }
          } catch (eM3) {
            swallow(eM3, "claude:capturePostBody-convid");
          }
          traceLog("post-send state convIdUrl=" + String(sendConvId || "-").slice(0, 8) + " lastHistoryConvId=" + String(currentConvId || "-").slice(0, 8) + " orgPrefix=" + (lastOrgPrefix ? 1 : 0));
          if (sendConvId && !postSendTimer) {
            var urlConvAtSched = sendConvId;
            settle_target_uuid = "";
            postSendTimer = setTimeout(function() {
              postSendTimer = null;
              try {
                var curNow = getConvId();
                if (!curNow || curNow !== urlConvAtSched) {
                  traceLog("post-send refresh=skipped(reason=convId-changed)");
                  return;
                }
                if (refreshBusy || !lastHistoryUrl && !lastOrgPrefix) {
                  traceLog("post-send refresh=skipped(reason=" + (refreshBusy ? "busy" : "no-url") + ")");
                  return;
                }
                traceLog("post-send refresh=triggered");
                settleSchedule(urlConvAtSched);
              } catch (eR) {
                debugLog("error", "[AI CM][Claude][error] post-send refresh: " + eR.message);
              }
            }, 2e3);
          }
        }
        if (/\/completion/.test(String(url))) {
          var probeU8 = asUint8View(body);
          if (probeU8) {
            decompressProbe(url, probeU8);
          } else {
            traceLog("probe-skip url=" + String(url).slice(0, 160) + " reason=" + (method !== "POST" && method !== "PUT" ? "not-post" : body == null ? "no-body" : "not-binary"));
          }
        } else if (method === "POST" || method === "PUT") {
          traceLog("probe-skip url=" + String(url).slice(0, 160) + " reason=not-completion");
        }
        var inputIsRequest = typeof Request !== "undefined" && input instanceof Request ? 1 : 0;
        var kind = "other", len = -1, scanText = null;
        if (typeof body === "string") {
          kind = "string";
          len = body.length;
          scanText = len <= 5 * 1024 * 1024 ? body : null;
        } else if (body && typeof FormData !== "undefined" && body instanceof FormData) {
          kind = "formdata";
        } else if (body && typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
          kind = "urlsp";
          try {
            scanText = body.toString();
            len = scanText.length;
          } catch (eU) {
            swallow(eU, "claude:capturePostBody-urlsp");
          }
        } else if (body && typeof body.getReader === "function") {
          kind = "stream";
        } else if (!hasInitBody && inputIsRequest) {
          kind = "stream";
        }
        if (kind === "stream") {
          traceLog("body-scan " + method + " " + String(url).slice(0, 100) + " bodyKind=stream skip len=- jsonOk=0 inputIsRequest=" + inputIsRequest);
          return;
        }
        var jsonOk = 0;
        if (kind === "formdata") {
          var parts = [];
          try {
            body.forEach(function(v, k) {
              if (typeof v === "string") parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
            });
          } catch (eF) {
            swallow(eF, "claude:capturePostBody-formdata");
          }
          jsonOk = processPostBody(url, parts.join("&"));
        } else if (scanText != null) {
          jsonOk = processPostBody(url, scanText);
          if (kind === "string" && jsonOk === 1) {
            traceBodyStruct(url, scanText);
            captureSettleTarget(url, scanText);
          }
        }
        try {
          var hCt = "-", hCe = "-";
          var hdrs = null;
          if (init && init.headers) hdrs = init.headers;
          else if (inputIsRequest && input && input.headers) hdrs = input.headers;
          if (hdrs) {
            if (typeof Headers !== "undefined" && hdrs instanceof Headers) {
              hCt = String(hdrs.get("content-type") || "-");
              hCe = String(hdrs.get("content-encoding") || "-");
            } else {
              try {
                hdrs.forEach(function(hv, hk) {
                  var hkl = String(hk).toLowerCase();
                  if (hkl === "content-type") hCt = String(hv);
                  else if (hkl === "content-encoding") hCe = String(hv);
                });
              } catch (eF2) {
              }
            }
          }
          traceLog("req-headers url=" + String(url).slice(0, 160) + " ct=" + hCt.slice(0, 60) + " ce=" + hCe.slice(0, 60));
        } catch (eH) {
        }
        var diag = "";
        if (kind === "other") {
          var ctorName = "";
          try {
            ctorName = Object.prototype.toString.call(body).replace(/^\[object /, "").replace(/\]$/, "").slice(0, 40);
          } catch (eC) {
          }
          diag = " bodyCtor=" + (ctorName || "?") + " inputIsRequest=" + inputIsRequest;
          var prev = binaryPreview(body);
          if (prev) {
            traceLog("body-preview url=" + String(url).slice(0, 160) + " len=" + binaryPreviewLen(body) + " preview=" + prev);
          }
        }
        traceLog("body-scan " + method + " " + String(url).slice(0, 160) + " bodyKind=" + kind + " len=" + len + " jsonOk=" + jsonOk + diag);
      } catch (e) {
        swallow(e, "claude:capturePostBody");
      }
    }
    function getConvId() {
      try {
        var parts = location.pathname.split("/");
        var chatIdx = parts.indexOf("chat");
        if (chatIdx !== -1 && chatIdx + 1 < parts.length) return parts[chatIdx + 1];
        return "";
      } catch (e) {
        return "";
      }
    }
    var currentConvId = getConvId();
    function snapshotConvIdOf(data) {
      try {
        return String(data && data.uuid || "");
      } catch (e) {
        return "";
      }
    }
    function isStaleSnapshotBody(data, where) {
      var dConv = snapshotConvIdOf(data);
      if (!dConv || dConv === currentConvId) return false;
      traceLog("tape-restore convId=" + currentConvId + " cacheConvId=" + dConv + " action=ignored (" + where + ")");
      return true;
    }
    function resetForNewConversation() {
      try {
        lastHistoryUrl = null;
        lastModel = "";
        dirty = false;
        refreshBusy = false;
        activeDisabled = false;
        loggedActiveStatus = false;
        attachSeen = {};
        attachTokens = 0;
        attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
        loggedAttach = false;
        fileTextCache = {};
        fileTextCacheOrder = [];
        fileFetchInFlight = {};
        lastHistoryRaw = null;
        lastHistoryRawConvId = "";
        snapshotReceived = false;
        validEmitConvId = "";
        validEmitCount = 0;
        lastEmitDetail = null;
        lastEmitDetailConvId = "";
        clearActiveRetry();
        if (bootstrapTimer) {
          clearTimeout(bootstrapTimer);
          bootstrapTimer = null;
        }
        debugLog("log", "[claude-intercept] \u0441\u043C\u0435\u043D\u0430 \u0447\u0430\u0442\u0430 \u2192 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u043E (convId=" + (currentConvId || "(\u043D\u0435 \u0447\u0430\u0442)") + ")");
        try {
          window.dispatchEvent(new CustomEvent("ai-cm-conversation-changed"));
        } catch (e) {
        }
        bootstrapTimer = setTimeout(function() {
          try {
            bootstrapSnapshot();
          } catch (bsErr) {
            debugLog("error", "[AI CM][Claude][error] bootstrap timer (SPA): " + bsErr.message);
          }
        }, 1500);
      } catch (e) {
        debugLog("error", "[AI CM][Claude][error] reset: " + e.message);
      }
    }
    function checkConvChange() {
      var newId = getConvId();
      if (newId !== currentConvId) {
        currentConvId = newId;
        settleReset("\u0441\u043C\u0435\u043D\u0430 \u0447\u0430\u0442\u0430");
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
        debugLog("log", "[claude-intercept] bootstrap: \u043D\u0435\u0442 convId \u2014 \u043D\u0435 \u0447\u0430\u0442");
        return;
      }
      if (snapshotReceived) {
        debugLog("log", "[claude-intercept] bootstrap: \u043D\u0435 \u043D\u0443\u0436\u0435\u043D (\u0441\u043D\u0438\u043C\u043E\u043A \u0443\u0436\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D \u0434\u043B\u044F " + currentConvId + ")");
        return;
      }
      function doFetchWithOrg(id) {
        var url = "/api/organizations/" + id + "/chat_conversations/" + currentConvId + "?tree=True&rendering_mode=messages&render_all_tools=true&consistency=eventual";
        debugLog("log", "[claude-intercept] bootstrap: \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 (" + url + ")");
        originalFetch(url, { credentials: "include" }).then(function(resp) {
          if (!resp || !resp.ok) {
            debugLog("log", "[claude-intercept] bootstrap: \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0442\u0430\u0442\u0443\u0441=" + (resp ? resp.status : "none"));
            return null;
          }
          return resp.json();
        }).then(function(data) {
          try {
            if (!data) return;
            if (isStaleSnapshotBody(data, "bootstrap")) return;
            snapshotReceived = true;
            lastHistoryUrl = url;
            emitSnapshot(parseHistoryWithEffects(data), "bootstrap");
          } catch (e) {
            debugLog("error", "[AI CM][Claude][error] bootstrap parse: " + e.message);
          }
        }).catch(function(e) {
          debugLog("log", "[claude-intercept] bootstrap: \u043E\u0448\u0438\u0431\u043A\u0430 fetch: " + e);
        });
      }
      if (orgId) {
        doFetchWithOrg(orgId);
      } else {
        debugLog("log", "[claude-intercept] bootstrap: orgId \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D, \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u044E /api/organizations");
        originalFetch("/api/organizations", { credentials: "include" }).then(function(resp) {
          if (!resp || !resp.ok) {
            debugLog("log", "[claude-intercept] bootstrap: /api/organizations \u0441\u0442\u0430\u0442\u0443\u0441=" + (resp ? resp.status : "none"));
            return null;
          }
          return resp.json();
        }).then(function(data) {
          if (!data) return;
          var id = "";
          if (Array.isArray(data) && data.length > 0) {
            id = data[0].uuid || data[0].id || "";
          } else if (typeof data === "object" && data !== null) {
            var keys = Object.keys(data);
            if (keys.length > 0) {
              var first = data[keys[0]];
              id = first && (first.uuid || first.id) || keys[0];
            }
          }
          if (id) {
            orgId = id;
            debugLog("log", "[claude-intercept] bootstrap: orgId \u043F\u043E\u043B\u0443\u0447\u0435\u043D=" + orgId);
            doFetchWithOrg(orgId);
          } else {
            debugLog("log", "[claude-intercept] bootstrap: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C orgId \u0438\u0437 \u043E\u0442\u0432\u0435\u0442\u0430");
          }
        }).catch(function(e) {
          debugLog("log", "[claude-intercept] bootstrap: \u043E\u0448\u0438\u0431\u043A\u0430 fetch \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439: " + e);
        });
      }
    }
    function collectAttachments(messages, seenLocal) {
      try {
        if (!Array.isArray(messages)) return;
        if (!seenLocal || typeof seenLocal !== "object") seenLocal = {};
        for (var i = 0; i < messages.length; i++) {
          var msg = messages[i];
          var blocks = msg && msg.content;
          if (!Array.isArray(blocks)) continue;
          for (var j = 0; j < blocks.length; j++) {
            var b = blocks[j];
            if (!b || typeof b !== "object") continue;
            if (b.type === "image" || b.type === "image_url") {
              var imgKey = "img_" + (msg.uuid || i) + "_" + j;
              if (!seenLocal[imgKey]) {
                seenLocal[imgKey] = 1;
                attachTokens += IMAGE_DEFAULT_TOKENS;
                attachBreak.imgTokens += IMAGE_DEFAULT_TOKENS;
                attachBreak.imgCount++;
              }
            }
          }
        }
        if (!loggedAttach && attachTokens > 0) {
          loggedAttach = true;
          debugLog("log", "[claude-intercept] \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439 \u0432 \u0434\u0438\u0430\u043B\u043E\u0433\u0435: " + attachBreak.imgCount + ", \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432: " + attachBreak.imgTokens + " (\u043F\u043E " + IMAGE_DEFAULT_TOKENS + " \u0442\u043E\u043A/\u0438\u0437\u043E\u0431\u0440)");
        }
      } catch (eCA) {
        debugLog("error", "[AI CM][Claude][error] collectAttachments: " + eCA.message);
      }
    }
    function estimateImageTokensFromFile(f) {
      try {
        var pa = f.preview_asset || f.previewAsset || {};
        var w = pa.image_width || pa.width;
        var h = pa.image_height || pa.height;
        if (w && h) return Math.ceil(w * h / 750);
      } catch (e) {
      }
      return 1500;
    }
    function extractPastedText(f) {
      var fields = ["extracted_text", "preview_text", "text_content", "content_text", "text", "content", "body", "value"];
      for (var i = 0; i < fields.length; i++) {
        try {
          var v = f[fields[i]];
          if (typeof v === "string" && v.trim()) return v;
        } catch (e) {
          swallow(e, "claude:extractPastedText");
        }
      }
      return "";
    }
    function logPastedDebug(f, uuid, textLen, phase) {
      var keys = "";
      try {
        keys = Object.keys(f).join("|");
      } catch (e) {
        keys = "(err)";
      }
      var hasPreviewUrl = !!(f && f.preview_url);
      debugLog("log", "[AI CM][Claude][pasted] " + (phase || "") + " uuid=" + String(uuid).slice(0, 8) + " kind=" + (f && f.file_kind) + " type=" + typeof (f && f.text) + " textLen=" + textLen + " hasPreviewUrl=" + hasPreviewUrl + " keys=" + keys);
    }
    var fetchAttempted = {};
    function fileSizeOf(f) {
      try {
        return Number(f.file_size || f.size_bytes || f.size || 0) || 0;
      } catch (eS) {
        return 0;
      }
    }
    function fileKindOf(f) {
      try {
        return String(f.file_kind || f.kind || "");
      } catch (eK) {
        return "";
      }
    }
    var PASTE_TTL_MS = 10 * 60 * 1e3;
    var pasteQueue = [];
    var reqAttachCache = {};
    function pasteQueuePrune() {
      try {
        var now = Date.now();
        while (pasteQueue.length && now - pasteQueue[0].ts > PASTE_TTL_MS) pasteQueue.shift();
      } catch (eP) {
      }
    }
    function utf8ByteLen(s) {
      try {
        return new TextEncoder().encode(s).length;
      } catch (eE) {
        return -1;
      }
    }
    function takePastedFromQueue(uuid, sizeBytes) {
      try {
        pasteQueuePrune();
        for (var i = 0; i < pasteQueue.length; i++) {
          var it = pasteQueue[i];
          var bl = utf8ByteLen(it.text);
          if (sizeBytes > 0 && bl === sizeBytes) {
            pasteQueue.splice(i, 1);
            debugLog("log", "[AI CM][Claude][pasted] paste-match uuid=" + String(uuid).slice(0, 8) + " by=size-utf8 textLen=" + it.text.length);
            return it.text;
          }
          if (sizeBytes > 0 && it.text.length === sizeBytes) {
            pasteQueue.splice(i, 1);
            debugLog("log", "[AI CM][Claude][pasted] paste-match uuid=" + String(uuid).slice(0, 8) + " by=size-utf16 textLen=" + it.text.length);
            return it.text;
          }
        }
        debugLog("log", "[AI CM][Claude][pasted] paste-match uuid=" + String(uuid).slice(0, 8) + " miss (reason=" + (pasteQueue.length ? "size-mismatch" : "empty-queue") + ")");
      } catch (eQ) {
        swallow(eQ, "claude:takePastedFromQueue");
      }
      return "";
    }
    if (!window.__aiCmPasteMsgListenerInstalled) {
      window.__aiCmPasteMsgListenerInstalled = true;
      try {
        window.addEventListener("message", function(ev) {
          try {
            if (!ev || ev.source !== window) return;
            if (ev.origin !== location.origin) return;
            var d = ev.data;
            if (!d || d.source !== "ai-cm-paste" || typeof d.text !== "string" || !d.text) return;
            pasteQueue.push({ text: d.text, ts: Date.now() });
            while (pasteQueue.length > 5) pasteQueue.shift();
            debugLog("log", "[AI CM][Claude][pasted] paste-recv len=" + d.text.length + " queueSize=" + pasteQueue.length);
          } catch (e2) {
            swallow(e2, "claude:paste-message-listener");
          }
        });
      } catch (eM) {
      }
    }
    function scheduleFileTextFetch(f, fileName) {
      var uuid = f.file_uuid || "";
      if (!uuid) return;
      if (typeof fileTextCache[uuid] === "string") {
        fileTextCacheTouch(uuid);
        debugLog("log", "[AI CM][Claude][pasted] paste-match skip uuid=" + String(uuid).slice(0, 8) + " already-cached");
        return;
      }
      if (fileFetchInFlight[uuid]) return;
      var inline = extractPastedText(f);
      if (inline) {
        fileTextCacheInsert(uuid, inline);
        logPastedDebug(f, uuid, inline.length, "inline");
        scheduleReEmit(fileName);
        return;
      }
      var pasteSize = fileSizeOf(f);
      var pasteKind = fileKindOf(f);
      try {
        pasteQueuePrune();
        var qU8 = [], qU16 = [], qLens = [];
        for (var qi = 0; qi < pasteQueue.length && qi < 5; qi++) {
          qU8.push(utf8ByteLen(pasteQueue[qi].text));
          qU16.push(pasteQueue[qi].text.length);
          qLens.push(pasteQueue[qi].text.length);
        }
        debugLog("log", "[AI CM][Claude][pasted] paste-check uuid=" + String(uuid).slice(0, 8) + " size_bytes=" + pasteSize + " utf8=[" + qU8.join(",") + "] utf16=[" + qU16.join(",") + "] queue=[" + qLens.join(",") + "] file_kind=" + pasteKind);
      } catch (ePC) {
      }
      var ptext2 = takePastedFromQueue(uuid, pasteSize);
      if (ptext2) {
        fileTextCacheInsert(uuid, ptext2);
        scheduleReEmit(fileName);
        return;
      }
      if (fetchAttempted[uuid]) {
        logPastedDebug(f, uuid, 0, "already-attempted");
        return;
      }
      fetchAttempted[uuid] = true;
      var rawPath = f.preview_url || f.path || "";
      var url = "";
      if (rawPath) {
        if (rawPath.indexOf("http") === 0) url = rawPath;
        else {
          try {
            url = location.origin + (rawPath.charAt(0) === "/" ? rawPath : "/" + rawPath);
          } catch (e) {
            url = rawPath;
          }
        }
      }
      if (!url) {
        fileTextCacheInsert(uuid, null);
        logPastedDebug(f, uuid, 0, "no-preview-url");
        return;
      }
      fileFetchInFlight[uuid] = true;
      markInternalUrl(url);
      originalFetch(url, { credentials: "include" }).then(function(r) {
        fileFetchInFlight[uuid] = false;
        if (!r || !r.ok) {
          fileTextCacheInsert(uuid, null);
          logPastedDebug(f, uuid, 0, "http-" + (r ? r.status : "none"));
          return;
        }
        var ct = "";
        try {
          ct = r.headers && r.headers.get("content-type") || "";
        } catch (e) {
        }
        return r.clone().text().then(function(body) {
          var ctLower = String(ct).toLowerCase();
          var trimmed = String(body || "").trim();
          var looksHtml = ctLower.indexOf("html") !== -1 || trimmed.charAt(0) === "<" && (trimmed.indexOf("<html") !== -1 || trimmed.indexOf("<!doctype") !== -1 || trimmed.indexOf("<script") !== -1);
          if (looksHtml) {
            fileTextCacheInsert(uuid, null);
            debugLog("log", "[AI CM][Claude][pasted] html-rejected uuid=" + String(uuid).slice(0, 8) + " len=" + (body || "").length);
            return;
          }
          var isTextCt = ctLower.indexOf("text") !== -1 || ctLower.indexOf("json") !== -1;
          if (!isTextCt && body.indexOf("\0") !== -1) {
            fileTextCacheInsert(uuid, null);
            logPastedDebug(f, uuid, 0, "binary-rejected ct=" + String(ct).slice(0, 40));
            return;
          }
          var realLen = (body || "").length;
          if (realLen > 5e5) {
            body = body.slice(0, 5e5) + "\n[\u043E\u0431\u0440\u0435\u0437\u0430\u043D\u043E]";
            debugLog("log", "[AI CM][Claude][pasted] fetch truncated uuid=" + String(uuid).slice(0, 8) + " realLen=" + realLen);
          }
          fileTextCacheInsert(uuid, body || "");
          debugLog("log", "[AI CM][Claude][pasted] fetch uuid=" + String(uuid).slice(0, 8) + " status=" + r.status + " ct=" + String(ct).slice(0, 40) + " len=" + realLen + " url=" + String(url).slice(0, 120));
          scheduleReEmit(fileName);
        });
      }).catch(function() {
        fileFetchInFlight[uuid] = false;
        logPastedDebug(f, uuid, 0, "fetch-error");
      });
    }
    function reEmitWithFileText(fileName) {
      debugLog("log", "[claude-intercept] \u0444\u0430\u0439\u043B \u0434\u043E\u0433\u0440\u0443\u0436\u0435\u043D: " + fileName);
      if (lastHistoryRaw) {
        if (lastHistoryRawConvId !== currentConvId) {
          debugLog("log", "[claude-intercept] reEmit \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u2014 \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (raw=" + String(lastHistoryRawConvId).slice(0, 8) + ", \u0442\u0435\u043A\u0443\u0449\u0438\u0439=" + String(currentConvId).slice(0, 8) + ")");
          return;
        }
        try {
          emitSnapshot(parseHistoryWithEffects(lastHistoryRaw), "\u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0434\u043E\u0433\u0440\u0443\u0436\u0435\u043D\u044B");
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] re-emit \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439: " + e.message);
        }
      }
    }
    var reEmitPending = false;
    function scheduleReEmit(fileName) {
      try {
        if (reEmitPending) return;
        reEmitPending = true;
        setTimeout(function() {
          reEmitPending = false;
          try {
            reEmitWithFileText(fileName);
          } catch (eSR) {
            debugLog("error", "[AI CM][Claude][error] scheduleReEmit: " + eSR.message);
          }
        }, 50);
      } catch (eS) {
      }
    }
    function applyMessageFiles(parsed, messages, seenLocal) {
      var stats = { extrasBlocks: 0, histAttachCount: 0 };
      try {
        if (!Array.isArray(messages) || !parsed || !parsed.uuidIdx) return stats;
        if (!seenLocal || typeof seenLocal !== "object") seenLocal = {};
        for (var i = 0; i < messages.length; i++) {
          var msg = messages[i];
          var files = msg && Array.isArray(msg.files) ? msg.files : [];
          var nodeSender = "";
          try {
            nodeSender = String(msg && msg.sender || "").toLowerCase();
          } catch (eNS) {
            nodeSender = "";
          }
          var attsAllowed = nodeSender !== "assistant";
          var atts = msg && attsAllowed && Array.isArray(msg.attachments) ? msg.attachments : [];
          if (!files.length && !atts.length) continue;
          var k = parsed.uuidIdx[String(msg.uuid)];
          if (k == null || !parsed.messages[k]) continue;
          var extras = [];
          for (var fi = 0; fi < files.length; fi++) {
            var f = files[fi];
            if (!f || typeof f !== "object") continue;
            var fname = f.file_name || "\u0444\u0430\u0439\u043B";
            var fkey = "file_" + (f.file_uuid || (msg.uuid || i) + "_" + fi);
            if (f.file_kind === "image") {
              extras.push("[\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u0435: " + fname + "]");
              if (!seenLocal[fkey]) {
                seenLocal[fkey] = 1;
                var it = estimateImageTokensFromFile(f);
                attachTokens += it;
                attachBreak.imgTokens += it;
                attachBreak.imgCount++;
              }
            } else {
              var uuid = f.file_uuid || "";
              var cached = uuid && Object.prototype.hasOwnProperty.call(fileTextCache, uuid) ? fileTextCache[uuid] : void 0;
              var inline = typeof cached !== "string" ? extractPastedText(f) : "";
              if (typeof cached === "string" && cached) {
                if (uuid) fileTextCacheTouch(uuid);
                debugLog("log", "[AI CM][Claude][pasted] paste-match skip uuid=" + String(uuid || "").slice(0, 8) + " already-cached");
                extras.push("[File " + fname + "]:\n" + cached);
              } else if (inline) {
                if (uuid) fileTextCacheInsert(uuid, inline);
                extras.push("[File " + fname + "]:\n" + inline);
                logPastedDebug(f, uuid || "noidx_" + fi, inline.length, "inline");
              } else {
                var ptextA = takePastedFromQueue(uuid || "noidx_" + fi, fileSizeOf(f));
                if (ptextA) {
                  if (uuid) fileTextCacheInsert(uuid, ptextA);
                  extras.push("[File " + fname + "]:\n" + ptextA);
                } else {
                  extras.push("[\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u0435: " + fname + "]");
                  if (uuid) scheduleFileTextFetch(f, fname);
                  else logPastedDebug(f, "noidx_" + fi, 0, "no-uuid");
                }
              }
            }
          }
          for (var ai = 0; ai < atts.length; ai++) {
            var a = atts[ai];
            if (!a || typeof a !== "object") continue;
            var aname = a.file_name || "pasted";
            var akey = String(aname) + "|" + fileSizeOf(a);
            var attKey = "";
            try {
              var aSize = a.size_bytes != null ? a.size_bytes : a.file_size != null ? a.file_size : fileSizeOf(a);
              attKey = "att_" + String(a.file_uuid || a.uuid || String(aname) + "|" + aSize).slice(0, 56);
            } catch (eAK) {
              attKey = "att_" + String(aname).slice(0, 56);
            }
            if (seenLocal[attKey]) {
              debugLog("log", "[AI CM][Claude][pasted] hist-attach dup-skip key=" + attKey.slice(0, 60));
              continue;
            }
            var atext = "";
            var asrc = "none";
            if (typeof a.extracted_content === "string" && a.extracted_content.trim()) {
              atext = a.extracted_content;
              asrc = "inline";
            } else if (reqAttachCache[akey]) {
              atext = reqAttachCache[akey];
              asrc = "req-cache";
            } else {
              var aptext = takePastedFromQueue(a.file_uuid || aname, fileSizeOf(a));
              if (ptext) {
                atext = ptext;
                asrc = "paste-queue";
              }
            }
            debugLog("log", "[AI CM][Claude][pasted] hist-attach name=" + String(aname).slice(0, 40) + " textLen=" + atext.length + " source=" + asrc + " key=" + attKey.slice(0, 60));
            seenLocal[attKey] = 1;
            if (atext) {
              if (atext.length > 5e5) atext = atext.slice(0, 5e5) + "\n[\u043E\u0431\u0440\u0435\u0437\u0430\u043D\u043E]";
              extras.push("[File " + aname + "]:\n" + atext);
              stats.histAttachCount++;
              var dt = Math.max(1, Math.round(atext.length / 4));
              attachTokens += dt;
              attachBreak.docTokens += dt;
              attachBreak.docCount++;
            } else {
              extras.push("[\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u0435: " + aname + "]");
            }
          }
          if (extras.length) {
            stats.extrasBlocks += extras.length;
            var newText = parsed.messages[k].text + "\n" + extras.join("\n");
            parsed.messages[k].text = newText;
            parsed.pieces[k] = newText;
            parsed.lastText = parsed.pieces[parsed.pieces.length - 1];
            parsed.text = parsed.pieces.join("\n");
          }
        }
        if (!loggedAttach && attachTokens > 0) {
          loggedAttach = true;
          debugLog("log", "[claude-intercept] \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0438\u0437 files: \u0442\u043E\u043A\u0435\u043D\u043E\u0432\u2248" + attachTokens + " (img=" + attachBreak.imgCount + ")");
        }
        return stats;
      } catch (eAM) {
        debugLog("error", "[AI CM][Claude][error] applyMessageFiles: " + eAM.message);
        return stats;
      }
    }
    function parseHistory(data) {
      var messages = data.chat_messages;
      if (!Array.isArray(messages)) messages = [];
      var model = data.model || "";
      var resultMessages = [];
      var pieces = [];
      var ids = [];
      var uuidIdx = {};
      var count = 0;
      var lastText = "";
      var traceNodeCount = 0;
      for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        if (!msg || !msg.content) continue;
        var sender = msg.sender || "";
        if (sender === "system") continue;
        var blocks = msg.content;
        if (!Array.isArray(blocks)) continue;
        var textParts = [];
        for (var j = 0; j < blocks.length; j++) {
          var b = blocks[j];
          if (!b || typeof b !== "object") continue;
          if (b.type === "text" && typeof b.text === "string") {
            textParts.push(b.text);
          } else if (b.type === "tool_use") {
            var toolName = b.name && typeof b.name === "string" ? b.name : "unknown";
            textParts.push("[tool: " + toolName + "]");
          }
        }
        var text = textParts.join("\n").trim();
        var atts = sender !== "assistant" && Array.isArray(msg.attachments) ? msg.attachments : [];
        var filesN = sender !== "assistant" && Array.isArray(msg.files) ? msg.files.length : 0;
        var hasFiles = sender !== "assistant" && (Array.isArray(msg.files) && msg.files.length > 0 || atts.length > 0);
        if (sender === "human" && traceNodeCount < 5) {
          traceNodeCount++;
          var nodeKeys = "";
          try {
            nodeKeys = Object.keys(msg || {}).slice(0, 20).map(function(s) {
              return String(s).slice(0, 40);
            }).join("|");
          } catch (eNK) {
          }
          traceLog("parse-node kind=user textLen=" + text.length + " attach=" + (filesN + atts.length) + " keys=" + nodeKeys + " \u2192 " + (text || hasFiles ? "included" : "skipped(no-text-no-files)"));
        }
        if (text || hasFiles) {
          if (msg.uuid) uuidIdx[String(msg.uuid)] = resultMessages.length;
          resultMessages.push({ role: sender === "assistant" ? "assistant" : "human", text });
          pieces.push(text);
          ids.push(msg.uuid || "msg" + i);
          count++;
          if (text) lastText = text;
        }
      }
      return { text: pieces.join("\n"), count, lastText, modelSlug: model, pieces, ids, uuidIdx, messages: resultMessages, model };
    }
    function parseHistoryWithEffects(data) {
      var parsed = parseHistory(data);
      var model = parsed.model || lastModel || "";
      if (model) lastModel = model;
      parsed.modelSlug = model;
      var messages = data.chat_messages;
      var seenLocal = {};
      attachTokens = 0;
      attachBreak = { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 };
      loggedAttach = false;
      if (Array.isArray(messages)) collectAttachments(messages, seenLocal);
      lastHistoryRaw = data;
      lastHistoryRawConvId = currentConvId;
      var amStats = { extrasBlocks: 0, histAttachCount: 0 };
      try {
        amStats = applyMessageFiles(parsed, messages, seenLocal) || amStats;
      } catch (eAM2) {
      }
      traceLog("parse-summary msgs=" + parsed.count + " rawLen=" + (parsed.text || "").length + " extrasBlocks=" + amStats.extrasBlocks + " hist-attach-count=" + amStats.histAttachCount);
      parsed.convId = snapshotConvIdOf(data) || currentConvId;
      parsed.attachTokens = attachTokens;
      parsed.attachBreak = {
        imgTokens: attachBreak.imgTokens,
        docTokens: attachBreak.docTokens,
        imgCount: attachBreak.imgCount,
        docCount: attachBreak.docCount
      };
      return parsed;
    }
    function emitSnapshot(parsed, when) {
      if (!parsed.text) return;
      traceLog("snapshot source=network convId=" + (parsed.convId || "-") + " msgs=" + (parsed.count || 0));
      var statTotal = Math.round(parsed.text.length / 4) + (parsed.attachTokens || 0);
      traceLog("[AI CM][Claude][trace] emit-stat src=" + (when || "-") + " convId=" + (parsed.convId || "-") + " textLen=" + parsed.text.length + " tokens~" + Math.round(parsed.text.length / 4) + " attachTokens=" + (parsed.attachTokens || 0) + " total=" + statTotal);
      traceLog("emit (" + when + ") msgs=" + parsed.count + " model=" + (parsed.modelSlug || "-") + " textLen=" + parsed.text.length + " tokens~" + (Math.round(parsed.text.length / 4) + (parsed.attachTokens || 0)) + " attachTokens=" + (parsed.attachTokens || 0));
      console.log("[claude-intercept] " + String.fromCodePoint(128229) + " \u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (" + when + "): " + parsed.count + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439" + (parsed.modelSlug ? ", model=" + parsed.modelSlug : "") + ((parsed.attachTokens || 0) > 0 ? ", \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439" + String.fromCodePoint(8776) + parsed.attachTokens + " \u0442\u043E\u043A" : "") + " (\u0431\u0435\u0437 \u0441\u043A\u0440\u043E\u043B\u043B\u0430)");
      var detail = {
        text: parsed.text,
        count: parsed.count,
        lastMessageText: parsed.lastText,
        modelSlug: parsed.modelSlug,
        messageTexts: parsed.pieces,
        messageIds: parsed.ids,
        messages: parsed.messages || [],
        convId: parsed.convId || "",
        attachTokens: parsed.attachTokens || 0,
        attachBreak: parsed.attachBreak || { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 },
        historyComplete: true,
        serverTokens: 0
      };
      lastEmitDetail = detail;
      lastEmitDetailConvId = detail.convId || "";
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", {
          detail
        }));
        if (parsed.count > 0) {
          validEmitConvId = parsed.convId || currentConvId;
          validEmitCount = parsed.count;
        }
      } catch (e) {
      }
    }
    function reEmitLastSnapshot(reason) {
      if (!lastEmitDetail) {
        traceLog("re-emit skip (" + reason + ") \u2014 \u0440\u0435\u0442\u0435\u0439\u043D\u0430 \u043D\u0435\u0442");
        return;
      }
      if (lastEmitDetailConvId && currentConvId && lastEmitDetailConvId !== currentConvId) {
        traceLog("re-emit skip (" + reason + ") \u2014 \u0440\u0435\u0442\u0435\u0439\u043D \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (" + String(lastEmitDetailConvId).slice(0, 8) + " != " + String(currentConvId).slice(0, 8) + ")");
        return;
      }
      traceLog("re-emit (" + reason + ") msgs=" + (lastEmitDetail.count || 0) + " convId=" + (lastEmitDetailConvId || "-") + " textLen=" + (lastEmitDetail.text || "").length);
      console.log("[claude-intercept] " + String.fromCodePoint(8634) + " \u0440\u0435-\u044D\u043C\u0438\u0442 \u0441\u043D\u0438\u043C\u043A\u0430 \u043F\u043E " + reason + ": " + (lastEmitDetail.count || 0) + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439");
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", { detail: lastEmitDetail }));
      } catch (e) {
      }
    }
    try {
      window.addEventListener("ai-cm-content-ready", function() {
        reEmitLastSnapshot("content-ready");
      });
    } catch (eCr) {
    }
    try {
      window.addEventListener("ai-cm-request-emit", function() {
        reEmitLastSnapshot("request-emit");
      });
    } catch (eRe) {
    }
    function handleHistoryResponse(response, when, expectedConvId) {
      var copy = response.clone();
      var st = 0;
      try {
        st = response.status;
      } catch (e) {
      }
      copy.text().then(function(rawText) {
        var bodyLen = (rawText || "").length;
        traceLog("intercept-resp (" + when + ") status=" + st + " bodyLen=" + bodyLen);
        var data = null;
        try {
          data = JSON.parse(rawText);
        } catch (pj) {
          debugLog("log", "[claude-intercept] \u043D\u0435-JSON \u0438\u0441\u0442\u043E\u0440\u0438\u044F (" + when + ") status=" + st + " bodyLen=" + bodyLen);
          return;
        }
        try {
          if (expectedConvId && expectedConvId !== currentConvId) {
            debugLog("log", "[claude-intercept] \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (convId=" + expectedConvId + " != \u0442\u0435\u043A\u0443\u0449\u0438\u0439 " + currentConvId + ")");
            if (!snapshotReceived && !bootstrapTimer && currentConvId) {
              bootstrapTimer = setTimeout(function() {
                bootstrapTimer = null;
                try {
                  bootstrapSnapshot();
                } catch (bsErr) {
                  debugLog("error", "[AI CM][Claude][error] bootstrap retry: " + bsErr.message);
                }
              }, 1500);
            }
            return;
          }
          if (isStaleSnapshotBody(data, String(when || "passive"))) return;
          var parsedHist = parseHistoryWithEffects(data);
          traceLog("parse-end (" + when + ") msgs=" + parsedHist.count + " model=" + (parsedHist.modelSlug || "-") + " attachTokens=" + attachTokens);
          if (!parsedHist.count) {
            if (validEmitCount > 0 && validEmitConvId === currentConvId) {
              traceLog("parse-empty skip (" + when + ") status=" + st + " bodyLen=" + bodyLen + " \u2014 \u0435\u0441\u0442\u044C \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A msgs=" + validEmitCount);
              return;
            }
            debugLog("log", "[claude-intercept] \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (" + when + ") status=" + st + " bodyLen=" + bodyLen + " \u2014 \u0436\u0434\u0451\u043C bootstrap/\u043F\u043E\u0432\u0442\u043E\u0440");
            return;
          }
          if (bootstrapTimer) {
            clearTimeout(bootstrapTimer);
            bootstrapTimer = null;
          }
          snapshotReceived = true;
          emitSnapshot(parsedHist, when);
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] history parse: " + e.message);
        }
      }).catch(function(e) {
        debugLog("log", "[claude-intercept] \u043E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0442\u0435\u043B\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438: " + e);
      });
    }
    function activeRefresh(reason) {
      if (activeDisabled || refreshBusy) return;
      if (!currentConvId) {
        traceLog("vf5 skip (" + reason + ") \u2014 \u043D\u0435 \u0432 \u0447\u0430\u0442\u0435");
        return;
      }
      var refreshSource = "last";
      var baseUrl = "";
      try {
        var mU = String(lastHistoryUrl || "").match(/\/chat_conversations\/([0-9a-fA-F-]{8,})/);
        var urlConv = mU ? mU[1] : "";
        if (lastHistoryUrl && urlConv === currentConvId) {
          baseUrl = lastHistoryUrl;
        } else if (lastOrgPrefix) {
          baseUrl = lastOrgPrefix + currentConvId + "?tree=True&rendering_mode=messages&render_all_tools=true&consistency=eventual";
          lastHistoryUrl = baseUrl;
          refreshSource = "built";
        } else {
          traceLog("refresh-url skip reason=no-org-prefix");
          if (!loggedActiveStatus) {
            loggedActiveStatus = true;
            debugLog("log", "[claude-vf5] \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u043E\u0442\u043B\u043E\u0436\u0435\u043D: \u043D\u0435\u0442 \u0430\u0434\u0440\u0435\u0441\u0430 \u0441\u043D\u0438\u043C\u043A\u0430 \u043F\u043E\u043A\u0430");
          }
          return;
        }
      } catch (eBu) {
        debugLog("log", "[claude-vf5] \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044F url: " + eBu);
        return;
      }
      traceLog("refresh-url " + String(baseUrl).slice(0, 160) + " source=" + refreshSource);
      var sentConvId = currentConvId;
      refreshBusy = true;
      var sep = baseUrl.indexOf("?") === -1 ? "?" : "&";
      var markedUrl = baseUrl + sep + guardToken + "=1";
      originalFetch(markedUrl, { method: "GET", credentials: "include" }).then(function(resp) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
          console.log("[claude-vf5] \u043F\u0435\u0440\u0432\u044B\u0439 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441: \u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none"));
        }
        if (!resp || !resp.ok) {
          activeDisabled = true;
          scheduleActiveRetry();
          debugLog("log", "[claude-vf5] \u043D\u0435 \u043F\u0440\u043E\u0448\u0451\u043B (\u0441\u0442\u0430\u0442\u0443\u0441 " + (resp ? resp.status : "none") + ") \u2192 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u0430\u044F \u043B\u043E\u0432\u043B\u044F, retry \u0447\u0435\u0440\u0435\u0437 " + activeRetryDelay / 1e3 + "\u0441");
          return null;
        }
        clearActiveRetry();
        console.log("[claude-vf5] " + String.fromCodePoint(10003) + " \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 (" + reason + ")");
        return resp.json();
      }).then(function(data) {
        try {
          if (!data) return;
          if (sentConvId !== currentConvId) {
            debugLog("log", "[claude-intercept] \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0439 vf5 (convId=" + sentConvId + " != \u0442\u0435\u043A\u0443\u0449\u0438\u0439 " + currentConvId + ")");
            return;
          }
          if (isStaleSnapshotBody(data, "vf5")) return;
          var parsedVf5 = parseHistoryWithEffects(data);
          emitSnapshot(parsedVf5, "\u0432\u0438\u0440\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 F5");
          settleCheckSnapshot(parsedVf5);
          dirty = false;
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] vf5 parse: " + e.message);
        }
      }).catch(function(err) {
        if (!loggedActiveStatus) {
          loggedActiveStatus = true;
        }
        activeDisabled = true;
        scheduleActiveRetry();
        debugLog("log", "[claude-vf5] \u043E\u0448\u0438\u0431\u043A\u0430: " + err + " \u2192 \u043F\u0430\u0441\u0441\u0438\u0432\u043D\u0430\u044F \u043B\u043E\u0432\u043B\u044F, retry \u0447\u0435\u0440\u0435\u0437 " + activeRetryDelay / 1e3 + "\u0441");
      }).finally(function() {
        refreshBusy = false;
      });
    }
    function scheduleActive(reason, delay) {
      if (activeDisabled) return;
      dirty = true;
      var schedConvId = currentConvId;
      setTimeout(function() {
        if (currentConvId !== schedConvId) {
          traceLog("vf5 timer skip (" + reason + ") \u2014 \u0447\u0430\u0442 \u0441\u043C\u0435\u043D\u0438\u043B\u0441\u044F");
          return;
        }
        try {
          activeRefresh(reason);
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] vf5 timer (" + reason + "): " + e.message);
        }
      }, delay);
    }
    function parseSSEStream(text, url) {
      var lines = text.split("\n");
      var model = "";
      var stopDetected = false;
      var textParts = [];
      var rateLimit5h = 0;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf("event: ") === 0 || line.indexOf("data: ") !== 0) continue;
        var jsonStr = line.substring(6);
        try {
          var data = JSON.parse(jsonStr);
          if (data.type === "message_start" && data.message && data.message.model) {
            model = data.message.model;
          }
          if (data.type === "content_block_delta" && data.delta && typeof data.delta.text === "string") {
            textParts.push(data.delta.text);
          }
          if (data.type === "content_block_delta" && data.delta && data.delta.type === "thinking_delta" && typeof data.delta.thinking === "string") {
            textParts.push(data.delta.thinking);
          }
          if (data.type === "content_block_delta" && data.delta && data.delta.type === "thinking_summary_delta" && data.delta.thinking_summary) {
            textParts.push(data.delta.thinking_summary);
          }
          if (data.type === "message_limit" && data.message_limit && data.message_limit.windows && data.message_limit.windows["5h"] && typeof data.message_limit.windows["5h"].utilization === "number") {
            rateLimit5h = data.message_limit.windows["5h"].utilization;
          }
          if (data.type === "message_stop") {
            stopDetected = true;
          }
        } catch (e) {
          swallow(e, "claude:parseSSEStream");
        }
      }
      return { model, stopDetected, text: textParts.join(""), rateLimit5h };
    }
    function parseSSEWithEffects(fullText, url) {
      var parsed = parseSSEStream(fullText, url);
      if (parsed.model) lastModel = parsed.model;
      return parsed;
    }
    var NOISE_URL_RE = /datadoghq|event_logging|\/rum/i;
    var UPLOAD_URL_RE = /upload|file|files|blob|store|attachment|pasted/i;
    function binaryPreviewLen(body) {
      try {
        return body && typeof body.byteLength === "number" ? body.byteLength : -1;
      } catch (eL) {
        return -1;
      }
    }
    function asUint8View(body) {
      try {
        if (typeof Uint8Array !== "undefined" && body instanceof Uint8Array) return body;
        if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return new Uint8Array(body);
        if (body && body.buffer instanceof ArrayBuffer && typeof body.byteLength === "number") {
          return new Uint8Array(body.buffer, body.byteOffset || 0, body.byteLength);
        }
      } catch (e) {
      }
      return null;
    }
    function binaryPreview(body) {
      try {
        var u8 = null;
        if (typeof Uint8Array !== "undefined" && body instanceof Uint8Array) u8 = body;
        else if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) u8 = new Uint8Array(body);
        else if (body && body.buffer instanceof ArrayBuffer && typeof body.byteLength === "number") {
          u8 = new Uint8Array(body.buffer, body.byteOffset || 0, body.byteLength);
        } else return "";
        var dec = null;
        try {
          dec = new TextDecoder("utf-8", { fatal: false });
        } catch (eD) {
          return "";
        }
        var s = dec.decode(u8.subarray(0, 400));
        var runs = String(s).match(/[\x20-\x7E\u00A0-\uD7FF\uE000-\uFFFD]{4,}/g) || [];
        return runs.join("|").slice(0, 150);
      } catch (e) {
        return "";
      }
    }
    function observeUpload(method, url, promise) {
      try {
        if (!promise || typeof promise.then !== "function") return;
        if (!UPLOAD_URL_RE.test(String(url || ""))) return;
        promise.then(function(resp) {
          try {
            var cl = "-";
            try {
              cl = resp && resp.headers && resp.headers.get("content-length") || "-";
            } catch (e1) {
            }
            traceLog("upload-candidate " + method + " " + String(url).slice(0, 120) + " status=" + (resp ? resp.status : "none") + " bodyLen=" + cl);
          } catch (e2) {
          }
        }).catch(function() {
          traceLog("upload-candidate " + method + " " + String(url).slice(0, 120) + " status=error");
        });
      } catch (e) {
      }
    }
    function makeUrlMatcher(url) {
      try {
        var u = typeof url === "string" ? url : url && url.url ? url.url : "";
        return {
          full: u,
          // v36/v52: история = ТОЛЬКО /chat_conversations/<uuid> с концом пути или '?'
          // (composer_notices/title/completion и др. подпути снимком НЕ являются —
          // иначе lastHistoryUrl загрязнялся не-историческим URL).
          isHistory: /\/chat_conversations\/[0-9a-fA-F-]{8,}(\?|$)/.test(u) && u.indexOf("/completion") === -1,
          isCompletion: u.indexOf("/completion") !== -1,
          hasGuard: u.indexOf(guardToken) !== -1
        };
      } catch (e) {
        return { full: "", isHistory: false, isCompletion: false, hasGuard: false };
      }
    }
    window.fetch = function(input, init) {
      var m = makeUrlMatcher(input);
      try {
        if (m.full && internalFetchUrls[m.full]) {
          return fetchGuarded(originalFetch, this, [input, init]);
        }
      } catch (e) {
      }
      try {
        capturePostBody(input, init);
      } catch (e) {
        swallow(e, "claude:fetch-capture-entry");
      }
      if (!orgId) {
        try {
          var orgMatch = m.full.match(/\/api\/organizations\/([0-9a-f-]{36})/);
          if (orgMatch) {
            orgId = orgMatch[1];
            debugLog("log", "[claude-intercept] orgId \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0447\u0435\u043D \u0438\u0437 URL: " + orgId);
          }
        } catch (e) {
          swallow(e, "claude:fetch-orgid");
        }
      }
      var _mth = "GET";
      try {
        _mth = String(init && init.method || input && input.method || "GET").toUpperCase();
      } catch (e0) {
        swallow(e0, "claude:fetch-method");
      }
      var isHistory = m.isHistory && !m.hasGuard;
      var isCompletion = m.isCompletion;
      var canReadStream = _mth === "GET" || _mth === "HEAD";
      if (!canReadStream && (isHistory || isCompletion)) {
        traceLog("intercept-skip " + _mth + " " + String(m.full || "").slice(0, 80) + " \u2014 \u043E\u0442\u0432\u0435\u0442 \u043D\u0435 \u0447\u0438\u0442\u0430\u0435\u043C (\u043D\u0435 GET)");
        isHistory = false;
        isCompletion = false;
      }
      if (isHistory || isCompletion) {
        var _uClip = _mth === "POST" || _mth === "PUT" ? 160 : 80;
        traceLog("intercept " + _mth + " " + String(m.full || "").slice(0, _uClip));
      }
      if (!isHistory && !isCompletion) {
        var p = fetchGuarded(originalFetch, this, [input, init]);
        observeUpload(_mth, m.full, p);
        if (p && typeof p.catch === "function") p.catch(function() {
        });
        return p;
      }
      var sentConvId = currentConvId;
      if (isHistory) {
        try {
          lastHistoryUrl = typeof input === "string" ? input : input && input.url ? input.url : "";
        } catch (e) {
          swallow(e, "claude:fetch-history-url");
        }
        if (lastHistoryUrl.indexOf(guardToken) !== -1) {
          lastHistoryUrl = lastHistoryUrl.replace(/[?&]__aicm_claude__=1/, "").replace(/\?$/, "");
        }
        try {
          var mOrg = String(lastHistoryUrl).match(/\/api\/organizations\/[0-9a-fA-F-]+\/chat_conversations\//);
          if (mOrg) lastOrgPrefix = mOrg[0];
        } catch (eOrg) {
          swallow(eOrg, "claude:fetch-org-prefix");
        }
      }
      var fetchPromise = fetchGuarded(originalFetch, this, [input, init]);
      observeUpload(_mth, m.full, fetchPromise);
      if (isHistory) {
        fetchPromise.then(function(resp) {
          try {
            if (!resp || !resp.ok) return;
            handleHistoryResponse(resp, "\u043F\u0430\u0441\u0441\u0438\u0432", sentConvId);
          } catch (e) {
            debugLog("error", "[AI CM][Claude][error] fetch-\u0438\u0441\u0442\u043E\u0440\u0438\u044F \u043A\u043E\u043B\u0431\u044D\u043A: " + e.message);
          }
        }).catch(function() {
        });
      }
      if (isCompletion) {
        fetchPromise.then(function(resp) {
          if (!resp || !resp.ok || !resp.body) return;
          var reader = resp.clone().body.getReader();
          var decoder = new TextDecoder("utf-8");
          var chunks = [];
          function readLoop() {
            reader.read().then(function(result) {
              try {
                if (result.done) {
                  var fullText = chunks.join("");
                  var parsed = null;
                  var stopDetected = false;
                  try {
                    parsed = parseSSEWithEffects(fullText, m.full);
                    stopDetected = parsed.stopDetected;
                  } catch (parseErr) {
                    debugLog("error", "[AI CM][Claude][error] sse parse: " + parseErr.message);
                  }
                  if (stopDetected) {
                    scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u0440\u0438\u043C\u0430", 800);
                  }
                  return;
                }
                chunks.push(decoder.decode(result.value, { stream: true }));
                readLoop();
              } catch (eLoop) {
                debugLog("error", "[AI CM][Claude][error] sse readLoop: " + eLoop.message);
              }
            }).catch(function() {
              scheduleActive("\u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u0440\u0438\u043C\u0430 (err)", 1200);
            });
          }
          readLoop();
        }).catch(function() {
        });
      }
      if (fetchPromise && typeof fetchPromise.catch === "function") {
        fetchPromise.catch(function() {
        });
      }
      return fetchPromise;
    };
    (function() {
      try {
        var OrigXHR = window.XMLHttpRequest;
        if (!OrigXHR || !OrigXHR.prototype) return;
        var origOpen = OrigXHR.prototype.open;
        var origSend = OrigXHR.prototype.send;
        OrigXHR.prototype.open = function(method, url) {
          try {
            this.__aicm_method = method;
            this.__aicm_url = url;
          } catch (e) {
            swallow(e, "claude:xhr-open-hook");
          }
          return origOpen.apply(this, arguments);
        };
        OrigXHR.prototype.send = function(bodyValue) {
          try {
            var method = String(this.__aicm_method || "GET").toUpperCase();
            var url = String(this.__aicm_url || "");
            var isApiScan = (method === "POST" || method === "PUT") && url.indexOf("/api/") !== -1 && url.indexOf(guardToken) === -1 && !internalFetchUrls[url] && !NOISE_URL_RE.test(url);
            if (isApiScan) {
              var kind = "other", len = -1, scanText = null, jsonOk = 0;
              if (typeof bodyValue === "string") {
                kind = "string";
                len = bodyValue.length;
                scanText = len <= 5 * 1024 * 1024 ? bodyValue : null;
              } else if (bodyValue && typeof FormData !== "undefined" && bodyValue instanceof FormData) {
                kind = "formdata";
              } else if (bodyValue && typeof URLSearchParams !== "undefined" && bodyValue instanceof URLSearchParams) {
                kind = "urlsp";
                try {
                  scanText = bodyValue.toString();
                  len = scanText.length;
                } catch (eU) {
                  swallow(eU, "claude:xhr-send-urlsp");
                }
              }
              if (kind === "string" && scanText != null) {
                jsonOk = processPostBody(url, scanText);
                if (jsonOk === 1) traceBodyStruct(url, scanText);
              } else if (kind === "formdata") {
                var parts = [];
                try {
                  bodyValue.forEach(function(v, k) {
                    if (typeof v === "string") parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
                  });
                } catch (e2) {
                  swallow(e2, "claude:xhr-send-formdata");
                }
                jsonOk = processPostBody(url, parts.join("&"));
              }
              var diagX = "";
              if (kind === "other") {
                var ctorNameX = "";
                try {
                  ctorNameX = Object.prototype.toString.call(bodyValue).replace(/^\[object /, "").replace(/\]$/, "").slice(0, 40);
                } catch (eC2) {
                }
                diagX = " bodyCtor=" + (ctorNameX || "?") + " inputIsRequest=0";
                var prevX = binaryPreview(bodyValue);
                if (prevX) {
                  traceLog("body-preview url=" + url.slice(0, 160) + " len=" + binaryPreviewLen(bodyValue) + " preview=" + prevX);
                }
              }
              traceLog("body-scan " + method + " " + url.slice(0, 160) + " bodyKind=" + kind + " len=" + len + " jsonOk=" + jsonOk + diagX);
            }
            if (UPLOAD_URL_RE.test(url)) {
              var xhr = this;
              if (!xhr.__aicm_upl_obs) {
                xhr.__aicm_upl_obs = true;
                xhr.addEventListener("loadend", function() {
                  try {
                    var blen = -1;
                    try {
                      blen = typeof xhr.responseText === "string" ? xhr.responseText.length : -1;
                    } catch (eR) {
                    }
                    traceLog("upload-candidate " + method + " " + url.slice(0, 120) + " status=" + (xhr.status || "none") + " bodyLen=" + blen);
                  } catch (eL) {
                  }
                });
              }
            }
          } catch (e) {
            swallow(e, "claude:xhr-send");
          }
          return origSend.apply(this, arguments);
        };
      } catch (e) {
        debugLog("error", "[AI CM][Claude][error] xhr wrap: " + e.message);
      }
    })();
    var aiCmPoll = setIntervalVisible;
    aiCmPoll(function() {
      if (dirty && !refreshBusy) {
        try {
          activeRefresh("\u0442\u0430\u0439\u043C\u0435\u0440-\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430");
        } catch (e) {
          debugLog("error", "[AI CM][Claude][error] vf5 \u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430: " + e.message);
        }
      }
    }, 15e3);
    var SETTLE_DELAYS = [2e3, 5e3, 1e4, 15e3, 3e4];
    var settle_target_uuid = "";
    var settle_attempt = 0;
    var settle_timer = null;
    var settle_conv_id = "";
    function settleShort(s) {
      return String(s || "-").slice(0, 8);
    }
    function captureSettleTarget(url, rawText) {
      try {
        if (String(url).indexOf("/completion") === -1) return;
        var obj = JSON.parse(rawText);
        var tm = obj && typeof obj === "object" ? obj.turn_message_uuids : null;
        settle_target_uuid = tm && typeof tm.assistant_message_uuid === "string" ? tm.assistant_message_uuid : "";
        traceLog("settle target=" + settleShort(settle_target_uuid) + " source=POST /completion");
      } catch (eT) {
        settle_target_uuid = "";
        debugLog("log", "[claude-settle] \u0446\u0435\u043B\u044C settle \u043D\u0435 \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u0430 (\u0442\u0435\u043B\u043E \u0431\u0435\u0437 turn_message_uuids): " + eT.message);
      }
    }
    function settleStop(reason) {
      if (settle_timer) {
        clearTimeout(settle_timer);
        settle_timer = null;
      }
      if (settle_attempt) traceLog("settle stop attempt=" + settle_attempt + " reason=" + reason);
      settle_attempt = 0;
      settle_conv_id = "";
      dirty = false;
    }
    function settleReset(reason) {
      if (!settle_timer && settle_attempt < 1) return;
      settleStop(reason);
      traceLog("settle reset (" + reason + ") \u2014 \u0442\u0430\u0439\u043C\u0435\u0440 \u043E\u0442\u043C\u0435\u043D\u0451\u043D, \u0447\u0443\u0436\u043E\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u043D\u0435 \u044D\u043C\u0438\u0442\u0438\u0442\u0441\u044F");
    }
    function settleCheckSnapshot(parsed) {
      if (settle_attempt < 1) return;
      var ids = parsed && parsed.ids || [];
      var msgs = parsed && parsed.messages || [];
      var lastMsg = msgs.length ? msgs[msgs.length - 1] : null;
      var lastId = ids.length ? String(ids[ids.length - 1]) : "";
      var snapConv = String(parsed && parsed.convId || "");
      if (settle_conv_id && snapConv !== settle_conv_id) {
        traceLog("settle check skip \u2014 \u0447\u0443\u0436\u043E\u0439 \u0441\u043D\u0438\u043C\u043E\u043A (" + settleShort(snapConv) + " != " + settleShort(settle_conv_id) + ")");
        return;
      }
      var isAssistant = !!(lastMsg && lastMsg.role === "assistant");
      var settled = isAssistant && (!settle_target_uuid || lastId === settle_target_uuid);
      traceLog("settle check attempt=" + settle_attempt + " msgs=" + msgs.length + " lastRole=" + (lastMsg ? lastMsg.role : "-") + " lastId=" + settleShort(lastId) + " target=" + settleShort(settle_target_uuid) + " settled=" + (settled ? 1 : 0));
      if (settled) settleStop("settled");
    }
    function settleAttemptNow(att) {
      try {
        if (settle_attempt !== att) return;
        if (!currentConvId || getConvId() !== settle_conv_id || currentConvId !== settle_conv_id) {
          settleReset("convId-changed");
          return;
        }
        traceLog("settle attempt=" + att + "/" + SETTLE_DELAYS.length + " at=+" + SETTLE_DELAYS[att - 1] + " target=" + settleShort(settle_target_uuid) + " convId=" + settleShort(settle_conv_id));
        if (refreshBusy || !lastHistoryUrl && !lastOrgPrefix) {
          traceLog("settle attempt=" + att + " refresh=skipped reason=" + (refreshBusy ? "busy" : "no-url"));
        } else {
          activeRefresh("settle-" + att);
        }
        settle_attempt = att + 1;
        if (settle_attempt > SETTLE_DELAYS.length) {
          settleStop("exhausted");
          return;
        }
        var delay = Math.max(0, SETTLE_DELAYS[settle_attempt - 1] - SETTLE_DELAYS[att - 1]);
        var next = settle_attempt;
        settle_timer = setTimeout(function() {
          settle_timer = null;
          settleAttemptNow(next);
        }, delay);
      } catch (eS) {
        debugLog("error", "[AI CM][Claude][error] settle attempt: " + eS.message);
      }
    }
    function settleSchedule(convId) {
      settleStop("restart");
      settle_conv_id = String(convId || "") || currentConvId;
      settle_attempt = 1;
      traceLog("settle schedule start convId=" + settleShort(settle_conv_id) + " target=" + settleShort(settle_target_uuid) + " tries=" + SETTLE_DELAYS.length);
      settleAttemptNow(1);
    }
    bootstrapTimer = setTimeout(function() {
      try {
        bootstrapSnapshot();
      } catch (e) {
        debugLog("error", "[AI CM][Claude][error] bootstrap timer: " + e.message);
      }
    }, 1500);
    console.log("[claude-intercept] \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Claude \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D (GET \u0438\u0441\u0442\u043E\u0440\u0438\u0438 + SSE completion \u2192 vf5 + bootstrap, MAIN world, document_start)");
  })();
})();
