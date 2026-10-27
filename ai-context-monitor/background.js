(() => {
  // background.js
  var DEBUG = false;
  var lastGoodModel = "";
  function debugLog(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (level === "error" || level === "warn") {
      (console[level] || console.log).apply(console, args);
      return;
    }
    if (DEBUG) {
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
  function aiCmI18nMessage(key, fallback, substitutions) {
    try {
      if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
        var message = substitutions ? chrome.i18n.getMessage(key, substitutions) : chrome.i18n.getMessage(key);
        if (message) return message;
      }
    } catch (eMessage) {
    }
    return fallback;
  }
  console.log("AI Context Monitor: Service Worker \u0437\u0430\u043F\u0443\u0449\u0435\u043D");
  var aiCmSwBootTs = Date.now();
  console.log("[AI CM][COLD_START] Service Worker \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u043B ts=" + aiCmSwBootTs + " iso=" + new Date(aiCmSwBootTs).toISOString() + " ext=" + chrome.runtime.getManifest().version);
  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ aiCmLastSwStart: "COLD_START@" + aiCmSwBootTs });
    }
  } catch (eCsBoot) {
    swallowSoft(eCsBoot, "background:coldStartMarker");
  }
  try {
    if (chrome.storage.session && chrome.storage.session.setAccessLevel) {
      chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
    }
  } catch (eO3Access) {
    swallow(eO3Access, "background:setAccessLevel");
  }
  try {
    if (chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.addListener === "function") {
      chrome.storage.onChanged.addListener(function(changes, area) {
        try {
          if (area !== "session" || !changes || !changes[AI_CM_BYOK_SESSION_KEY]) return;
          chrome.tabs.query({}, function(tabs) {
            try {
              for (var iT = 0; iT < (tabs || []).length; iT++) {
                if (tabs[iT] && tabs[iT].id != null && chrome.tabs && typeof chrome.tabs.sendMessage === "function") {
                  chrome.tabs.sendMessage(tabs[iT].id, { type: "aiCm-byok-key-changed" }, function() {
                    try {
                      void chrome.runtime.lastError;
                    } catch (eLe) {
                    }
                  });
                }
              }
            } catch (eBs) {
            }
          });
        } catch (eCh) {
        }
      });
    }
  } catch (eByokWatch) {
  }
  if (typeof importScripts === "function") {
    try {
      importScripts("/utils/gemini-intercept-logic.js");
    } catch (e) {
      console.warn("[AI CM][thresholds] importScripts error:", e);
    }
  }
  async function registerSafe(id, cfg) {
    try {
      await chrome.scripting.registerContentScripts([cfg]);
    } catch (e) {
      if (/Duplicate script ID/.test(String(e && e.message))) {
        await chrome.scripting.unregisterContentScripts({ ids: [id] });
        await chrome.scripting.registerContentScripts([cfg]);
      } else throw e;
    }
  }
  async function ensureInterceptor() {
    try {
      if (!chrome.scripting || !chrome.scripting.registerContentScripts) return;
      var existing = [];
      try {
        existing = await chrome.scripting.getRegisteredContentScripts();
      } catch (e) {
        existing = [];
      }
      var ids = existing.map(function(s) {
        return s.id;
      });
      if (ids.indexOf("ai-cm-page-intercept") === -1) {
        await registerSafe("ai-cm-page-intercept", {
          id: "ai-cm-page-intercept",
          matches: ["https://chatgpt.com/*"],
          js: ["utils/debug.js", "utils/chatgpt-conversation-parser.js", "utils/intercept-common.js", "core/page-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A ChatGPT \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-gemini-intercept-v11") === -1) {
        try {
          await chrome.scripting.unregisterContentScripts({ ids: ["ai-cm-gemini-intercept", "ai-cm-gemini-intercept-v2", "ai-cm-gemini-intercept-v3", "ai-cm-gemini-intercept-v4", "ai-cm-gemini-intercept-v5", "ai-cm-gemini-intercept-v6", "ai-cm-gemini-intercept-v7", "ai-cm-gemini-intercept-v8", "ai-cm-gemini-intercept-v9", "ai-cm-gemini-intercept-v10"] });
        } catch (eUnregGemini) {
        }
        await registerSafe("ai-cm-gemini-intercept-v11", {
          id: "ai-cm-gemini-intercept-v11",
          matches: ["https://gemini.google.com/*", "https://aistudio.google.com/*"],
          js: ["utils/debug.js", "utils/gemini-batchexecute-parser.js", "utils/gemini-intercept-logic.js", "core/gemini-hidden-scroll.js", "core/gemini-diag.js", "core/gemini-rpc.js", "core/gemini-parse.js", "core/gemini-sse.js", "core/pagination/pagination.js", "core/gemini-loader-scroll.js", "core/gemini-ingest.js", "core/gemini-overlay.js", "core/gemini-archive.js", "core/gemini-oracle.js", "core/gemini-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Gemini (v11) \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-deepseek-intercept-v12") === -1) {
        try {
          await chrome.scripting.unregisterContentScripts({ ids: ["ai-cm-deepseek-intercept-v10", "ai-cm-deepseek-intercept-v11"] });
        } catch (eUnregDeepseek) {
        }
        await registerSafe("ai-cm-deepseek-intercept-v12", {
          id: "ai-cm-deepseek-intercept-v12",
          matches: ["https://chat.deepseek.com/*"],
          js: ["utils/debug.js", "core/deepseek-diag.js", "core/deepseek-netsync.js", "core/deepseek-refetch.js", "core/deepseek-parse.js", "core/deepseek-conv.js", "core/deepseek-emit.js", "core/deepseek-net.js", "core/deepseek-ingest.js", "core/deepseek-files.js", "core/deepseek-sse.js", "core/deepseek-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A DeepSeek v12 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-claude-intercept") === -1) {
        await registerSafe("ai-cm-claude-intercept", {
          id: "ai-cm-claude-intercept",
          matches: ["https://claude.ai/*"],
          js: ["utils/debug.js", "utils/intercept-common.js", "core/claude-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Claude \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-perplexity-intercept") === -1) {
        await registerSafe("ai-cm-perplexity-intercept", {
          id: "ai-cm-perplexity-intercept",
          matches: ["https://www.perplexity.ai/*", "https://perplexity.ai/*"],
          js: ["utils/debug.js", "utils/perplexity-parser.js", "utils/intercept-common.js", "core/perplexity-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Perplexity \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-google-search-intercept") === -1) {
        await registerSafe("ai-cm-google-search-intercept", {
          id: "ai-cm-google-search-intercept",
          matches: ["https://www.google.com/*"],
          js: ["utils/debug.js", "utils/google-search-folwr-parser.js", "utils/intercept-common.js", "core/google-search-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Google Search AI \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-qwen-intercept") === -1) {
        await registerSafe("ai-cm-qwen-intercept", {
          id: "ai-cm-qwen-intercept",
          matches: ["https://chat.qwen.ai/*"],
          js: ["utils/debug.js", "utils/stream-frames.js", "core/qwen-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Qwen \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
      if (ids.indexOf("ai-cm-aistudio-intercept") === -1) {
        await registerSafe("ai-cm-aistudio-intercept", {
          id: "ai-cm-aistudio-intercept",
          matches: ["https://aistudio.google.com/*"],
          js: ["utils/debug.js", "core/aistudio-intercept.js"],
          runAt: "document_start",
          world: "MAIN",
          allFrames: false
        });
        console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A AI Studio \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
      }
    } catch (err) {
      console.warn("AI Context Monitor: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A:", err);
    }
  }
  chrome.runtime.onInstalled.addListener(() => {
    console.log("AI Context Monitor \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D");
    chrome.storage.sync.set({
      selectedModel: "auto",
      customLimit: null,
      showPercentage: true
    });
    aiCmPruneHistory();
    aiCmMigrateByokToSession();
    ensureInterceptor();
  });
  if (chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
      aiCmPruneHistory();
      aiCmMigrateByokToSession();
      ensureInterceptor();
    });
  }
  ensureInterceptor();
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debugLog("log", "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0432 Service Worker:", message);
    if (message.type === "close-print-tab") {
      if (sender && sender.tab && sender.tab.id != null) {
        chrome.tabs.remove(sender.tab.id);
      }
    }
    if (message.type === "COUNT_TOKENS") {
      handleCountTokens(message, sender).then(sendResponse).catch(function(err) {
        debugLog("error", "COUNT_TOKENS error:", err);
        sendResponse({ error: err.message || "unknown_error" });
      });
      return true;
    }
    if (message.type === "THRESHOLD_PCT") {
      checkThresholds(message.data || {}, sender);
    }
    if (message.type === "BADGE_RESET") {
      var tabIdR = sender && sender.tab && sender.tab.id != null ? sender.tab.id : null;
      if (tabIdR != null && chrome.action && chrome.action.setBadgeText) {
        try {
          chrome.action.setBadgeText({ text: "", tabId: tabIdR });
          debugLog("log", "[AI CM][thresholds] badge-reset tabId=" + tabIdR);
        } catch (eR) {
        }
      }
    }
    if (message.type === "aiCm-get-byok-key") {
      if (!aiCmTrustedSender(sender)) {
        sendResponse({ hasKey: false });
        return true;
      }
      aiCmGetByokKeyForContent().then(function(key) {
        debugLog("log", "[AI CM][byok] get-key \u2192 " + (key ? "***" : "(\u043F\u0443\u0441\u0442\u043E)"));
        sendResponse({ hasKey: !!key });
      }).catch(function(errK) {
        debugLog("error", "aiCm-get-byok-key error:", errK);
        sendResponse({ hasKey: false });
      });
      return true;
    }
    if (message.type === "aiCm-latch-get") {
      if (!aiCmTrustedSender(sender)) {
        sendResponse({ fired: false });
        return true;
      }
      aiCmLatchRead(message.service, message.convId).then(function(fired) {
        sendResponse({ fired });
      }).catch(function(errLg) {
        debugLog("error", "aiCm-latch-get error:", errLg);
        sendResponse({ fired: false });
      });
      return true;
    }
    if (message.type === "aiCm-latch-set") {
      if (!aiCmTrustedSender(sender)) {
        sendResponse({ ok: false });
        return true;
      }
      aiCmLatchWrite(message.service, message.convId, true).then(function(ok) {
        sendResponse({ ok });
      }).catch(function(errLs) {
        debugLog("error", "aiCm-latch-set error:", errLs);
        sendResponse({ ok: false });
      });
      return true;
    }
    if (message.type === "aiCm-latch-remove") {
      if (!aiCmTrustedSender(sender)) {
        sendResponse({ ok: false });
        return true;
      }
      aiCmLatchWrite(message.service, message.convId, false).then(function(ok) {
        sendResponse({ ok });
      }).catch(function(errLr) {
        debugLog("error", "aiCm-latch-remove error:", errLr);
        sendResponse({ ok: false });
      });
      return true;
    }
    if (message.type === "aiCm-latch-get-all") {
      if (!aiCmTrustedSender(sender)) {
        sendResponse({ map: {} });
        return true;
      }
      aiCmLatchAllFired().then(function(map) {
        sendResponse({ map });
      }).catch(function(errLa) {
        debugLog("error", "aiCm-latch-get-all error:", errLa);
        sendResponse({ map: {} });
      });
      return true;
    }
    return true;
  });
  function aiCmZoneColorFor(t, thresholds) {
    var thr = thresholds && thresholds.length === 3 ? thresholds : [70, 85, 95];
    if (t >= thr[2]) return "#ef4444";
    if (t >= thr[1]) return "#eab308";
    return "#22c55e";
  }
  async function checkThresholds(data, sender) {
    try {
      var cfg = await new Promise(function(r) {
        chrome.storage.local.get(["aiCmProactive", "aiCmProactiveNotify"], r);
      });
      if (cfg.aiCmProactive === false) return;
      var convId = data && data.convId ? String(data.convId) : "";
      var pct = data && typeof data.pct === "number" ? data.pct : NaN;
      if (!convId || !isFinite(pct)) return;
      var latchKey = "aiCmThr:" + convId;
      var ses = await new Promise(function(r) {
        chrome.storage.session.get([latchKey], r);
      });
      var firedArr = Array.isArray(ses[latchKey]) ? ses[latchKey] : [];
      var firedSet = new Set(firedArr);
      var G = typeof GeminiInterceptLogic !== "undefined" ? GeminiInterceptLogic : typeof self !== "undefined" ? self.GeminiInterceptLogic : null;
      var thresholds = G && typeof G.getProactiveThresholds === "function" ? await G.getProactiveThresholds() : [70, 85, 95];
      var T = G && typeof G.pickProactiveThreshold === "function" ? G.pickProactiveThreshold(pct, firedSet, thresholds) : null;
      if (T == null) return;
      var tabId = sender && sender.tab && sender.tab.id != null ? sender.tab.id : null;
      if (tabId != null && chrome.action && chrome.action.setBadgeText) {
        try {
          chrome.action.setBadgeText({ text: String(T), tabId });
          chrome.action.setBadgeBackgroundColor({ color: aiCmZoneColorFor(T, thresholds), tabId });
        } catch (eB) {
        }
      }
      firedArr.push(T);
      var THRESHOLDS = thresholds && thresholds.length === 3 ? thresholds : [70, 85, 95];
      for (var i = 0; i < THRESHOLDS.length; i++) {
        if (THRESHOLDS[i] !== T && pct >= THRESHOLDS[i] && firedArr.indexOf(THRESHOLDS[i]) === -1) {
          firedArr.push(THRESHOLDS[i]);
        }
      }
      var patch = {};
      patch[latchKey] = firedArr;
      await new Promise(function(r) {
        chrome.storage.session.set(patch, r);
      });
      var notifyOn = cfg.aiCmProactiveNotify === true;
      if (!notifyOn) {
        debugLog("log", "[AI CM][thresholds] notify-skip reason=settings-off");
      } else if (!chrome.notifications || !chrome.notifications.create) {
        debugLog("log", "[AI CM][thresholds] notify-skip reason=no-notifications-api");
      } else {
        var notifId = "aiCmThr|" + (tabId == null ? "" : String(tabId)) + "|" + convId + "|" + T;
        var notifPct = String(Math.round(pct * 10) / 10);
        var notifMessage = aiCmI18nMessage(
          "bg_notification_message",
          "\u0417\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 " + notifPct + "% \u2014 \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442 \u043F\u043E\u0440\u043E\u0433 " + T + "%",
          [notifPct, String(T)]
        );
        var notifButtonOpen = aiCmI18nMessage("bg_notification_button_open_chat", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0447\u0430\u0442");
        try {
          chrome.notifications.create(notifId, {
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/icon128.png"),
            title: "AI Context Monitor",
            message: notifMessage,
            requireInteraction: false,
            buttons: [{ title: notifButtonOpen }]
          }, function() {
            var le = chrome.runtime.lastError;
            if (le) debugLog("log", "[AI CM][thresholds] notify-skip reason=api-error " + (le.message || ""));
            else debugLog("log", "[AI CM][thresholds] notify-fire T=" + T + " convId=" + convId);
          });
        } catch (eN) {
          debugLog("log", "[AI CM][thresholds] notify-skip reason=api-error " + eN);
        }
      }
      debugLog("log", "[AI CM][thresholds] fired T=" + T + "% pct=" + pct + " convId=" + convId);
    } catch (err) {
      debugLog("error", "[AI CM][thresholds] checkThresholds error:", err);
    }
  }
  if (chrome.notifications && chrome.notifications.onButtonClicked) {
    chrome.notifications.onButtonClicked.addListener(function(notifId) {
      try {
        var parts = String(notifId).split("|");
        if (parts[0] !== "aiCmThr" || parts.length < 3 || parts[1] === "") return;
        var tabId = parseInt(parts[1], 10);
        if (!isFinite(tabId)) return;
        chrome.tabs.get(tabId, function(tab) {
          if (chrome.runtime.lastError || !tab) return;
          try {
            chrome.tabs.update(tabId, { active: true });
            if (chrome.windows && tab.windowId != null) {
              chrome.windows.update(tab.windowId, { focused: true });
            }
          } catch (eU) {
          }
        });
      } catch (e) {
      }
    });
  }
  var AI_CM_BYOK_SESSION_KEY = "aiCmApiKeySession";
  var AI_CM_BYOK_LEGACY_KEYS = [
    "ai_cm_gemini_api_key",
    "ai_cm_api_key",
    "ai_cm_byok_key",
    "aiCmGeminiApiKey",
    "aiCmApiKey",
    "gemini_api_key"
  ];
  function aiCmFirstLegacyByokKey(data) {
    for (var i = 0; i < AI_CM_BYOK_LEGACY_KEYS.length; i++) {
      var v = data ? data[AI_CM_BYOK_LEGACY_KEYS[i]] : null;
      if (typeof v === "string" && v) return v;
    }
    return "";
  }
  function aiCmPurgeLegacyByokKeys() {
    try {
      if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.remove !== "function") return;
      chrome.storage.local.remove(AI_CM_BYOK_LEGACY_KEYS);
    } catch (ePurge) {
      swallowSoft(ePurge, "background:purgeLegacyByokKeys");
    }
  }
  function aiCmMigrateByokToSession() {
    try {
      if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") return;
      chrome.storage.local.get(AI_CM_BYOK_LEGACY_KEYS, function(data) {
        var legacy = aiCmFirstLegacyByokKey(data);
        if (!legacy) return;
        try {
          if (chrome.storage.session && typeof chrome.storage.session.set === "function") {
            var patch = {};
            patch[AI_CM_BYOK_SESSION_KEY] = legacy;
            chrome.storage.session.set(patch);
          }
        } catch (eSet) {
          swallowSoft(eSet, "background:migrateByok-sessionWrite");
        }
        aiCmPurgeLegacyByokKeys();
        console.log("[AI CM][byok] migrated plaintext\u2192session");
      });
    } catch (eMig) {
      swallowSoft(eMig, "background:migrateByok-sessionRead");
    }
  }
  function aiCmSessionByokGet() {
    return new Promise(function(resolve) {
      try {
        if (!chrome.storage || !chrome.storage.session || typeof chrome.storage.session.get !== "function") {
          resolve("");
          return;
        }
        chrome.storage.session.get([AI_CM_BYOK_SESSION_KEY], function(d) {
          var v = d ? d[AI_CM_BYOK_SESSION_KEY] : "";
          resolve(typeof v === "string" ? v : "");
        });
      } catch (eGet) {
        resolve("");
      }
    });
  }
  async function aiCmReadByokApiKey() {
    var key = await aiCmSessionByokGet();
    if (key) return key;
    var legacy = await new Promise(function(resolve) {
      try {
        if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
          resolve("");
          return;
        }
        chrome.storage.local.get(AI_CM_BYOK_LEGACY_KEYS, function(d) {
          resolve(aiCmFirstLegacyByokKey(d));
        });
      } catch (eLeg) {
        resolve("");
      }
    });
    if (!legacy) return "";
    try {
      if (chrome.storage.session && typeof chrome.storage.session.set === "function") {
        var patch = {};
        patch[AI_CM_BYOK_SESSION_KEY] = legacy;
        chrome.storage.session.set(patch);
      }
    } catch (eSet) {
      swallowSoft(eSet, "background:readByokApiKey-sessionWrite");
    }
    aiCmPurgeLegacyByokKeys();
    console.log("[AI CM][byok] migrated plaintext\u2192session");
    return legacy;
  }
  async function aiCmGetByokKeyForContent() {
    return await aiCmReadByokApiKey();
  }
  var AI_CM_FIRED_SESSION_PREFIX = "aiCmFired:";
  function aiCmLatchKey(service, convId) {
    return AI_CM_FIRED_SESSION_PREFIX + String(service == null ? "" : service) + "|" + String(convId == null ? "" : convId);
  }
  function aiCmTrustedSender(sender) {
    try {
      if (!sender) return false;
      if (sender.id && chrome.runtime && chrome.runtime.id && sender.id !== chrome.runtime.id) return false;
      return !!(sender.tab && sender.tab.id != null);
    } catch (eSnd) {
      return false;
    }
  }
  function aiCmLatchRead(service, convId) {
    return new Promise(function(resolve) {
      try {
        if (!service || !convId) {
          resolve(false);
          return;
        }
        if (!chrome.storage || !chrome.storage.session || typeof chrome.storage.session.get !== "function") {
          resolve(false);
          return;
        }
        var k = aiCmLatchKey(service, convId);
        chrome.storage.session.get([k], function(d) {
          resolve(!!d && d[k] === 1);
        });
      } catch (eRead) {
        resolve(false);
      }
    });
  }
  function aiCmLatchWrite(service, convId, fired) {
    return new Promise(function(resolve) {
      try {
        let finish2 = function(ok) {
          if (!done) {
            done = true;
            resolve(ok);
          }
        };
        var finish = finish2;
        if (!service || !convId) {
          resolve(false);
          return;
        }
        if (!chrome.storage || !chrome.storage.session) {
          resolve(false);
          return;
        }
        var k = aiCmLatchKey(service, convId);
        var done = false;
        if (fired) {
          if (typeof chrome.storage.session.set !== "function") {
            resolve(false);
            return;
          }
          var patch = {};
          patch[k] = 1;
          chrome.storage.session.set(patch, function() {
            finish2(true);
          });
        } else {
          if (typeof chrome.storage.session.remove !== "function") {
            resolve(false);
            return;
          }
          chrome.storage.session.remove([k], function() {
            finish2(true);
          });
        }
      } catch (eWrite) {
        resolve(false);
      }
    });
  }
  function aiCmLatchAllFired() {
    return new Promise(function(resolve) {
      try {
        if (!chrome.storage || !chrome.storage.session || typeof chrome.storage.session.get !== "function") {
          resolve({});
          return;
        }
        chrome.storage.session.get(null, function(all) {
          var out = {};
          try {
            for (var k in all || {}) {
              if (k.indexOf(AI_CM_FIRED_SESSION_PREFIX) === 0) out[k] = all[k];
            }
          } catch (eCopy) {
          }
          resolve(out);
        });
      } catch (eAll) {
        resolve({});
      }
    });
  }
  var COUNT_TOKENS_TIMEOUT_MS = 1e4;
  var COUNT_TOKENS_DEBOUNCE_MS = 800;
  var COUNT_TOKENS_CACHE_MAX = 200;
  var countTokensCache = /* @__PURE__ */ new Map();
  function countTokensHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h.toString(16);
  }
  function countTokensCacheGet(model, text) {
    var key = model + ":" + countTokensHash(text);
    var hit = countTokensCache.get(key);
    if (!hit || hit.len !== text.length) return null;
    return { key, tokens: hit.tokens };
  }
  function countTokensCacheSet(model, text, tokens) {
    var key = model + ":" + countTokensHash(text);
    if (countTokensCache.has(key)) countTokensCache.delete(key);
    countTokensCache.set(key, { tokens, len: text.length });
    while (countTokensCache.size > COUNT_TOKENS_CACHE_MAX) {
      countTokensCache.delete(countTokensCache.keys().next().value);
    }
  }
  var countTokensPending = /* @__PURE__ */ new Map();
  function scheduleCountTokens(key, payload, debounced) {
    var entry = countTokensPending.get(key);
    if (entry && entry.timer != null) {
      clearTimeout(entry.timer);
      entry.timer = null;
      entry.debounced = 1;
    }
    if (!entry) {
      entry = { promise: null, resolve: null, timer: null, debounced: 0 };
      entry.promise = new Promise(function(resolve) {
        entry.resolve = resolve;
      });
      countTokensPending.set(key, entry);
    }
    entry.debounced = debounced || entry.debounced;
    entry.payload = { text: payload.text, model: payload.model, debounced: entry.debounced };
    if (entry.timer == null) {
      entry.timer = setTimeout(function() {
        countTokensPending.delete(key);
        handleCountTokensRun(entry.payload).then(entry.resolve, function(e) {
          entry.resolve({ error: e && e.message ? e.message : "unknown_error" });
        });
      }, COUNT_TOKENS_DEBOUNCE_MS);
    }
    return entry.promise;
  }
  function handleCountTokens(message, sender) {
    var text = message && message.text || "";
    var model = message.model || "gemini-flash-latest";
    if (!text || text.length === 0) return Promise.resolve({ totalTokens: 0 });
    var hit = countTokensCacheGet(model, text);
    if (hit) {
      console.log("[AI CM][countTokens] cache-hit model=" + model + " tokens=" + hit.tokens + " cached=1 debounced=0");
      return Promise.resolve({
        ok: true,
        totalTokens: hit.tokens,
        tokens: hit.tokens,
        cached: 1,
        debounced: 0
      });
    }
    var tabId = sender && sender.tab && sender.tab.id != null ? sender.tab.id : "";
    var convId = message && message.convId ? String(message.convId) : "";
    var key = tabId + ":" + convId + ":" + model;
    return scheduleCountTokens(key, { text, model }, 0);
  }
  async function handleCountTokensRun(run) {
    var text = run.text;
    var model = run.model;
    if (!text || text.length === 0) return { totalTokens: 0 };
    var isDebounced = run.debounced ? 1 : 0;
    var logPrefix = "[AI CM][countTokens]";
    var apiKey = await aiCmReadByokApiKey();
    if (!apiKey) return { ok: false, reason: "no-key" };
    var rawCandidates = [lastGoodModel, model, "gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash"];
    var candidates = [];
    for (var i = 0; i < rawCandidates.length; i++) {
      var c = rawCandidates[i];
      if (c && candidates.indexOf(c) === -1) candidates.push(c);
    }
    for (var j = 0; j < candidates.length; j++) {
      var cand = candidates[j];
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(cand) + ":countTokens";
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var abortReason = "";
      var timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          abortReason = "timeout";
          controller.abort();
        }, COUNT_TOKENS_TIMEOUT_MS);
      }
      try {
        var fetchOpts = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }]
          })
        };
        if (controller) fetchOpts.signal = controller.signal;
        var response = await fetch(url, fetchOpts);
        if (response.ok) {
          lastGoodModel = cand;
          console.log("[count-tokens] \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C: " + cand);
          var json = await response.json();
          var totalTokens = json && typeof json.totalTokens === "number" ? json.totalTokens : 0;
          if (totalTokens > 0) countTokensCacheSet(model, text, totalTokens);
          console.log(logPrefix + " ok model=" + cand + " tokens=" + totalTokens + " cached=0 debounced=" + isDebounced);
          return { ok: true, totalTokens, tokens: totalTokens, cached: 0, debounced: isDebounced };
        }
        var errText = "";
        try {
          errText = await response.text();
        } catch (e) {
        }
        aiCmDiagWarn("background:handleCountTokensRun", "[count-tokens] \u043C\u043E\u0434\u0435\u043B\u044C " + cand + " \u0432\u0435\u0440\u043D\u0443\u043B\u0430 " + response.status + ": " + errText.slice(0, 120));
      } catch (fetchError) {
        if (abortReason === "timeout") {
          console.log(logPrefix + " abort reason=timeout model=" + cand + " debounced=" + isDebounced);
          return { ok: false, error: "timeout", reason: "timeout", totalTokens: 0, cached: 0, debounced: isDebounced };
        }
        aiCmDiagWarn("background:handleCountTokensRun", "[count-tokens] \u043C\u043E\u0434\u0435\u043B\u044C " + cand + " fetch error: " + fetchError.message);
      } finally {
        if (timeoutId != null) clearTimeout(timeoutId);
      }
    }
    return { error: "all_models_failed" };
  }
  var AI_CM_HISTORY_TTL_MS = 2592e6;
  function aiCmHistoryEntryStale(rec, now) {
    var ts = rec && typeof rec.ts === "number" ? rec.ts : null;
    if (ts == null) return false;
    return now - ts > AI_CM_HISTORY_TTL_MS;
  }
  function aiCmHistoryPruneRemove(stale) {
    if (!stale.length) {
      console.log("[AI CM][storage] prune removed=0");
      return;
    }
    if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.remove !== "function") return;
    chrome.storage.local.remove(stale, function() {
      console.log("[AI CM][storage] prune removed=" + stale.length);
    });
  }
  function aiCmPruneHistory() {
    try {
      if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") return;
      chrome.storage.local.get(null, function(all) {
        try {
          var now = Date.now();
          var stale = [];
          var keys = all && typeof all === "object" ? Object.keys(all) : [];
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf("aiCmHistory:") !== 0) continue;
            if (aiCmHistoryEntryStale(all[key], now)) stale.push(key);
          }
          aiCmHistoryPruneRemove(stale);
        } catch (e) {
          aiCmDiagWarn("background:pruneHistory", "[AI CM][storage] prune error:", e);
        }
      });
    } catch (e2) {
      aiCmDiagWarn("background:pruneHistory", "[AI CM][storage] prune error:", e2);
    }
  }
  var aiCmHistWinDebugOn = false;
  var aiCmHistWin = {};
  try {
    if (chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === "function") {
      chrome.storage.local.get(["aiCmDebugLogs"], function(d) {
        aiCmHistWinDebugOn = !!(d && d.aiCmDebugLogs === true);
      });
    }
  } catch (eDarkGate) {
  }
  function aiCmHistWinCount(changes, keys) {
    try {
      if (!aiCmHistWinDebugOn) return;
      var now = Date.now();
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.indexOf("aiCmHistory:") !== 0) continue;
        var w = aiCmHistWin[k];
        if (!w || now - w.startTs > 100) {
          w = { startTs: now, count: 0 };
        }
        w.count++;
        aiCmHistWin[k] = w;
        var nv = changes[k] && changes[k].newValue || {};
        console.log("[AI CM][diag] o22-hist-onchanged key=" + k + " ts=" + now + " win100ms=" + w.count + " convId=" + (nv.convId || "(none)") + " msgs=" + (nv.messages && nv.messages.length || 0) + " updatedAt=" + (nv.updatedAt || "(\u043D\u0435\u0442)"));
      }
    } catch (eWinCount) {
    }
  }
  if (chrome.storage && chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
    chrome.storage.onChanged.addListener(function(changes, areaName) {
      if (areaName !== "local" || !changes) return;
      if (changes.aiCmDebugLogs) aiCmHistWinDebugOn = changes.aiCmDebugLogs.newValue === true;
      var touched = false;
      var changedKeys = Object.keys(changes);
      for (var i = 0; i < changedKeys.length; i++) {
        if (changedKeys[i].indexOf("aiCmHistory:") === 0) {
          touched = true;
          break;
        }
      }
      if (changedKeys.length) aiCmHistWinCount(changes, changedKeys);
      if (touched) aiCmPruneHistory();
    });
  }
  function swallowSoft(error, tag) {
    try {
      if (typeof debugLog !== "function") return;
      if (!aiCmHistWinDebugOn) return;
      debugLog("warn", "[swallow-soft][" + (tag || "unlabeled") + "]", error);
    } catch (eSoftSw) {
      return void 0;
    }
  }
  function aiCmDiagWarn(tag, message, detail) {
    try {
      if (typeof debugLog !== "function") return;
      if (!aiCmHistWinDebugOn) return;
      debugLog("warn", "[AI CM][warn][" + (tag || "unlabeled") + "] " + message, detail);
    } catch (eWarnSw) {
      return void 0;
    }
  }
})();
//# sourceMappingURL=background.js.map
