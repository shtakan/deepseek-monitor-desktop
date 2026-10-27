(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // options.js
  var require_options = __commonJS({
    "options.js"(exports, module) {
      (function() {
        "use strict";
        var BINDINGS = [
          { key: "data-i18n", target: "textContent" },
          { key: "data-i18n-placeholder", target: "placeholder" },
          { key: "data-i18n-title", target: "title" },
          { key: "data-i18n-aria-label", target: "aria-label" },
          // M-4.4: alt скриншотов руководства и карточек документации.
          { key: "data-i18n-alt", target: "alt" }
        ];
        function aiCmI18nAvailable() {
          return typeof chrome !== "undefined" && !!chrome.i18n && typeof chrome.i18n.getMessage === "function";
        }
        function aiCmI18nMessage2(key) {
          try {
            if (aiCmI18nAvailable()) {
              return chrome.i18n.getMessage(key) || "";
            }
          } catch (eMessage) {
            return "";
          }
          return "";
        }
        function aiCmI18nApply(root) {
          var scope = root || (typeof document !== "undefined" ? document : null);
          if (!scope || typeof scope.querySelectorAll !== "function") return 0;
          var applied = 0;
          for (var i = 0; i < BINDINGS.length; i++) {
            var binding = BINDINGS[i];
            var nodes = scope.querySelectorAll("[" + binding.key + "]");
            for (var j = 0; j < nodes.length; j++) {
              var message = aiCmI18nMessage2(nodes[j].getAttribute(binding.key));
              if (!message) continue;
              if (binding.target === "textContent") nodes[j].textContent = message;
              else nodes[j].setAttribute(binding.target, message);
              applied++;
            }
          }
          return applied;
        }
        function aiCmI18nBoot() {
          if (!aiCmI18nAvailable()) return;
          aiCmI18nApply(document);
        }
        if (typeof document !== "undefined") {
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", aiCmI18nBoot);
          } else {
            aiCmI18nBoot();
          }
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = {
            aiCmI18nApply,
            aiCmI18nMessage: aiCmI18nMessage2,
            aiCmI18nAvailable,
            bindings: BINDINGS
          };
        }
      })();
      (function() {
        var CHATGPT_DEFAULT_MODEL = "gpt-4o";
        function getConvIdFromPath(pathname) {
          try {
            var m = String(pathname || "").match(/\/c\/([A-Za-z0-9_-]+)/);
            return m ? m[1] : "";
          } catch (e) {
            return "";
          }
        }
        function shouldResetChatConversation(prevId, newId) {
          if (!newId) return false;
          return prevId !== newId;
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
        function parseChatGPTConversation(json) {
          var messages = [];
          var model = "";
          var tokens = 0;
          try {
            if (!json || typeof json !== "object") {
              return { messages: [], model: CHATGPT_DEFAULT_MODEL, tokens: 0 };
            }
            if (json.model_slug) model = json.model_slug;
            if (typeof json.tokens === "number") tokens = json.tokens;
            var mapping = json.mapping || {};
            var keys = orderChatGPTMapping(mapping);
            for (var i = 0; i < keys.length; i++) {
              var node = mapping[keys[i]];
              var msg = node && node.message;
              if (!msg || !msg.content) continue;
              var role = msg.author && msg.author.role;
              if (role === "system" || role === "tool") continue;
              var parts = msg.content.parts || [];
              var contentPieces = [];
              for (var j = 0; j < parts.length; j++) {
                if (typeof parts[j] === "string") {
                  contentPieces.push(sanitizeChatGPTText(parts[j]));
                } else if (parts[j] && typeof parts[j] === "object" && typeof parts[j].text === "string") {
                  contentPieces.push(sanitizeChatGPTText(parts[j].text));
                }
              }
              var content = contentPieces.join("\n").trim();
              if (content) {
                messages.push({
                  role: role === "assistant" ? "assistant" : "user",
                  content
                });
              }
            }
          } catch (e) {
            swallowSoft(e, "chatgpt-utils:parseChatGPTConversation");
          }
          if (!model) model = CHATGPT_DEFAULT_MODEL;
          return { messages, model, tokens };
        }
        var api = {
          getConvIdFromPath,
          shouldResetChatConversation,
          shouldResetConversationOnNav,
          orderChatGPTMapping,
          sanitizeChatGPTText,
          parseChatGPTConversation
        };
        if (typeof window !== "undefined") {
          window.ChatGPTConversationParser = api;
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = api;
        }
      })();
      (function() {
        function parsePerplexityThread(json) {
          function getTrim(obj, name) {
            if (!obj || typeof obj !== "object") return void 0;
            var keys = Object.keys(obj);
            for (var i2 = 0; i2 < keys.length; i2++) {
              if (keys[i2].trim() === name) return obj[keys[i2]];
            }
            return void 0;
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
              if (queryStr && typeof queryStr === "string" && queryStr.trim()) {
                pieces.push(queryStr.trim());
                ids.push(entryId + "_user");
                count++;
                lastText = queryStr.trim();
                messages.push({ role: "user", text: queryStr.trim() });
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
        if (typeof window !== "undefined") {
          window.parsePerplexityThread = parsePerplexityThread;
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = { parsePerplexityThread };
        }
      })();
      (function() {
        "use strict";
        var ARCHIVE_KEY_PREFIX = "aiCmArchive:";
        var CONV_SOURCE_KEY_PREFIX = "aiCmConvSource:";
        var SOURCE_ARCHIVE = "archive";
        var SOURCE_LIVE = "live";
        var ARCHIVE_RECORD_VERSION = 1;
        var FORMATS = {
          GEMINI_TAKEOUT: "gemini-takeout",
          CHATGPT_CONVERSATIONS: "chatgpt-conversations",
          CLAUDE_CONVERSATIONS: "claude-conversations",
          PERPLEXITY_THREADS: "perplexity-threads"
        };
        var SERVICE_BY_FORMAT = {};
        SERVICE_BY_FORMAT[FORMATS.GEMINI_TAKEOUT] = "gemini";
        SERVICE_BY_FORMAT[FORMATS.CHATGPT_CONVERSATIONS] = "chatgpt";
        SERVICE_BY_FORMAT[FORMATS.CLAUDE_CONVERSATIONS] = "claude";
        SERVICE_BY_FORMAT[FORMATS.PERPLEXITY_THREADS] = "perplexity";
        var FORMAT_LABEL = {};
        FORMAT_LABEL[FORMATS.GEMINI_TAKEOUT] = "Gemini Takeout";
        FORMAT_LABEL[FORMATS.CHATGPT_CONVERSATIONS] = "ChatGPT conversations.json";
        FORMAT_LABEL[FORMATS.CLAUDE_CONVERSATIONS] = "Claude export";
        FORMAT_LABEL[FORMATS.PERPLEXITY_THREADS] = "Perplexity threads";
        var MAX_CONVERSATION_BYTES = 2 * 1024 * 1024;
        var MAX_TOTAL_BYTES = 8 * 1024 * 1024;
        var MAX_MESSAGES_PER_CONVERSATION = 5e3;
        var MAX_ARCHIVE_SIZE = 50 * 1024 * 1024;
        function archiveStorageKey(convId) {
          return ARCHIVE_KEY_PREFIX + String(convId == null ? "" : convId);
        }
        function convSourceStorageKey(convId) {
          return CONV_SOURCE_KEY_PREFIX + String(convId == null ? "" : convId);
        }
        function normalizeText(v) {
          if (typeof v !== "string") return "";
          return v.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trim();
        }
        function collapseWs(v) {
          return String(v == null ? "" : v).replace(/\s+/g, " ").trim();
        }
        function hash6(s) {
          var str = String(s == null ? "" : s);
          var h = 5381;
          for (var i = 0; i < str.length; i++) {
            h = (h << 5) + h + str.charCodeAt(i) | 0;
          }
          var hex = (h >>> 0).toString(16);
          while (hex.length < 6) hex = "0" + hex;
          return hex.slice(-6);
        }
        function normalizeRole(role) {
          var r = collapseWs(role).toLowerCase();
          if (r === "user" || r === "human" || r === "me" || r === "prompt" || r === "you") return "user";
          if (r === "assistant" || r === "model" || r === "bot" || r === "ai" || r === "gpt" || r === "gemini" || r === "claude") return "assistant";
          return "";
        }
        function toMs(v) {
          if (typeof v === "number" && isFinite(v)) {
            return v > 1e12 ? Math.round(v) : Math.round(v * 1e3);
          }
          if (typeof v === "string" && v) {
            var t = Date.parse(v);
            if (!isNaN(t)) return t;
            var trimmed = v.replace(/(\.\d{3})\d+/, "$1");
            if (trimmed !== v) {
              t = Date.parse(trimmed);
              if (!isNaN(t)) return t;
            }
          }
          return 0;
        }
        function arrayifyConversations(json) {
          if (Array.isArray(json)) return json;
          if (!json || typeof json !== "object") return [];
          if (Array.isArray(json.conversations)) return json.conversations;
          return [json];
        }
        function resolveOrderChatGPTMapping(deps) {
          if (deps && typeof deps.orderChatGPTMapping === "function") return deps.orderChatGPTMapping;
          try {
            if (typeof __require === "function") {
              var m = __require("./chatgpt-conversation-parser.js");
              if (m && typeof m.orderChatGPTMapping === "function") return m.orderChatGPTMapping;
            }
          } catch (eR) {
          }
          try {
            if (typeof window !== "undefined" && window.ChatGPTConversationParser && typeof window.ChatGPTConversationParser.orderChatGPTMapping === "function") {
              return window.ChatGPTConversationParser.orderChatGPTMapping;
            }
          } catch (eW) {
          }
          return null;
        }
        function resolveSanitizeChatGPT(deps) {
          if (deps && typeof deps.sanitizeChatGPTText === "function") return deps.sanitizeChatGPTText;
          try {
            if (typeof __require === "function") {
              var m = __require("./chatgpt-conversation-parser.js");
              if (m && typeof m.sanitizeChatGPTText === "function") return m.sanitizeChatGPTText;
            }
          } catch (eR) {
          }
          try {
            if (typeof window !== "undefined" && window.ChatGPTConversationParser && typeof window.ChatGPTConversationParser.sanitizeChatGPTText === "function") {
              return window.ChatGPTConversationParser.sanitizeChatGPTText;
            }
          } catch (eW) {
          }
          return function(s) {
            return s;
          };
        }
        function resolveParsePerplexityThread(deps) {
          if (deps && typeof deps.parsePerplexityThread === "function") return deps.parsePerplexityThread;
          try {
            if (typeof __require === "function") {
              var m = __require("./perplexity-parser.js");
              if (m && typeof m.parsePerplexityThread === "function") return m.parsePerplexityThread;
            }
          } catch (eR) {
          }
          try {
            if (typeof window !== "undefined" && typeof window.parsePerplexityThread === "function") {
              return window.parsePerplexityThread;
            }
          } catch (eW) {
          }
          return null;
        }
        function normalizeMessage(raw, ordinal) {
          if (!raw || typeof raw !== "object") return null;
          var role = normalizeRole(raw.role != null ? raw.role : raw.sender);
          if (!role) return null;
          var text = normalizeText(raw.text != null ? raw.text : raw.content);
          if (!text) return null;
          return {
            id: typeof raw.id === "string" && raw.id ? raw.id : "a:" + (ordinal || 0) + ":" + hash6(role + "\0" + text),
            role,
            text,
            ts: typeof raw.ts === "number" && isFinite(raw.ts) ? raw.ts : toMs(raw.created_at != null ? raw.created_at : raw.time)
          };
        }
        function finalizeConversation(conv) {
          var messages = [];
          var textLen = 0;
          var raw = conv && Array.isArray(conv.messages) ? conv.messages : [];
          for (var i = 0; i < raw.length; i++) {
            var m = normalizeMessage(raw[i], messages.length);
            if (!m) continue;
            if (messages.length >= MAX_MESSAGES_PER_CONVERSATION) break;
            messages.push(m);
            textLen += m.text.length;
          }
          var title = normalizeText(conv && conv.title);
          if (!title) {
            for (var t = 0; t < messages.length; t++) {
              if (messages[t].role === "user") {
                title = collapseWs(messages[t].text).slice(0, 80);
                break;
              }
            }
          }
          return {
            convId: String(conv && conv.convId || ""),
            service: conv && conv.service || "",
            format: conv && conv.format || "",
            title,
            updatedAt: conv && typeof conv.updatedAt === "number" && isFinite(conv.updatedAt) ? conv.updatedAt : 0,
            messages,
            count: messages.length,
            textLen
          };
        }
        function looksLikeGeminiActivity(item) {
          if (!item || typeof item !== "object") return false;
          var url = String(item.titleUrl || item.title_url || "");
          if (/gemini\.google\.com\/app\//.test(url)) return true;
          return collapseWs(item.header).toLowerCase() === "gemini apps";
        }
        function detectArchiveFormat(json) {
          var items = arrayifyConversations(json);
          if (!items.length) return null;
          var limit = Math.min(items.length, 20);
          for (var i = 0; i < limit; i++) {
            var it = items[i];
            if (!it || typeof it !== "object") continue;
            if (it.mapping && typeof it.mapping === "object") return FORMATS.CHATGPT_CONVERSATIONS;
            if (Array.isArray(it.chat_messages)) return FORMATS.CLAUDE_CONVERSATIONS;
            if (Array.isArray(it.entries) || it.thread && Array.isArray(it.thread.entries)) return FORMATS.PERPLEXITY_THREADS;
            if (looksLikeGeminiActivity(it)) return FORMATS.GEMINI_TAKEOUT;
          }
          return null;
        }
        function serviceOfFormat(format) {
          return SERVICE_BY_FORMAT[format] || "";
        }
        function messageTextOf(m) {
          if (!m || typeof m !== "object") return "";
          return normalizeText(m.text != null ? m.text : m.content);
        }
        function aggregateMessageList(conv) {
          if (Array.isArray(conv.messages)) return conv.messages;
          if (Array.isArray(conv.chat_messages)) return conv.chat_messages;
          if (Array.isArray(conv.entries)) return conv.entries;
          return [];
        }
        function detectFullTextAnomaly(conv) {
          if (!conv || typeof conv !== "object") return null;
          if (typeof conv.full !== "string") return null;
          var fullText = normalizeText(conv.full);
          if (!fullText) return null;
          var raw = aggregateMessageList(conv);
          var msgsLen = 0;
          for (var i = 0; i < raw.length; i++) msgsLen += messageTextOf(raw[i]).length;
          if (fullText.length <= msgsLen) return null;
          return {
            convId: String(conv.convId || conv.conversation_id || conv.uuid || conv.id || ""),
            code: "full-longer-than-messages",
            fullLen: fullText.length,
            msgsLen,
            over: fullText.length - msgsLen,
            msgCount: raw.length
          };
        }
        function collectFullTextAnomalies(json) {
          var items = arrayifyConversations(json);
          var out = [];
          for (var i = 0; i < items.length; i++) {
            var a = detectFullTextAnomaly(items[i]);
            if (a) out.push(a);
          }
          return out;
        }
        function reportFullTextAnomalies(json, deps) {
          var d = deps || {};
          var warn = typeof d.warn === "function" ? d.warn : typeof console !== "undefined" && console && typeof console.warn === "function" ? function(msg) {
            console.warn(msg);
          } : null;
          var anomalies = collectFullTextAnomalies(json);
          if (warn) {
            for (var i = 0; i < anomalies.length; i++) {
              var a = anomalies[i];
              warn("[AI CM][archive] \u0430\u043D\u043E\u043C\u0430\u043B\u0438\u044F full>messages convId=" + (a.convId || "-") + " full=" + a.fullLen + " msgs=" + a.msgsLen + " over=" + a.over + " msgsCount=" + a.msgCount);
            }
          }
          return anomalies;
        }
        function extractConvIdFromUrl(url) {
          var m = String(url == null ? "" : url).match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);
          return m ? m[1] : "";
        }
        var GEMINI_PROMPT_PREFIX = /^(prompted|asked|you asked|said|запрос:?|вы спросили:?|запрос\s)\s*/i;
        var GEMINI_RESPONSE_DETAIL = /^(response|answer|ответ|ответ модели|model response)$/i;
        function geminiActivityUserText(rec) {
          var title = normalizeText(rec.title != null ? rec.title : rec.description);
          if (!title) return "";
          return normalizeText(title.replace(GEMINI_PROMPT_PREFIX, ""));
        }
        function geminiActivityAssistantText(rec) {
          var direct = normalizeText(rec.response != null ? rec.response : rec.answer);
          if (direct) return direct;
          var details = rec.details;
          if (!Array.isArray(details)) return "";
          for (var i = 0; i < details.length; i++) {
            var d = details[i];
            if (!d || typeof d !== "object") continue;
            if (!GEMINI_RESPONSE_DETAIL.test(collapseWs(d.name))) continue;
            var val = normalizeText(d.value);
            if (val) return val;
          }
          return "";
        }
        function parseGeminiTakeout(json) {
          var items = Array.isArray(json) ? json : json && Array.isArray(json.items) ? json.items : [];
          var order = [];
          var byConv = {};
          var skippedNoConvId = 0;
          var skippedEmpty = 0;
          for (var i = 0; i < items.length; i++) {
            var rec = items[i];
            if (!rec || typeof rec !== "object") {
              skippedEmpty++;
              continue;
            }
            var convId = extractConvIdFromUrl(rec.titleUrl != null ? rec.titleUrl : rec.title_url);
            if (!convId) {
              skippedNoConvId++;
              continue;
            }
            var ts = toMs(rec.time);
            var userText = geminiActivityUserText(rec);
            var assistantText = geminiActivityAssistantText(rec);
            if (!userText && !assistantText) {
              skippedEmpty++;
              continue;
            }
            if (!byConv[convId]) {
              byConv[convId] = {
                convId,
                service: SERVICE_BY_FORMAT[FORMATS.GEMINI_TAKEOUT],
                format: FORMATS.GEMINI_TAKEOUT,
                title: "",
                updatedAt: 0,
                messages: []
              };
              order.push(convId);
            }
            var conv = byConv[convId];
            if (userText) conv.messages.push({ role: "user", text: userText, ts });
            if (assistantText) conv.messages.push({ role: "assistant", text: assistantText, ts });
            if (ts > conv.updatedAt) conv.updatedAt = ts;
            if (!conv.title && userText) conv.title = collapseWs(userText).slice(0, 80);
          }
          var out = [];
          for (var k = 0; k < order.length; k++) out.push(finalizeConversation(byConv[order[k]]));
          return { conversations: out, skippedNoConvId, skippedEmpty };
        }
        function parseChatGPTArchive(json, deps) {
          var orderFn = resolveOrderChatGPTMapping(deps);
          if (!orderFn) return { conversations: [], error: "chatgpt-parser-unavailable", skippedNoConvId: 0, skippedEmpty: 0 };
          var sanitize = resolveSanitizeChatGPT(deps);
          var items = arrayifyConversations(json);
          var out = [];
          var skippedNoConvId = 0;
          var skippedEmpty = 0;
          for (var i = 0; i < items.length; i++) {
            var c = items[i];
            if (!c || typeof c !== "object" || !c.mapping || typeof c.mapping !== "object") {
              skippedEmpty++;
              continue;
            }
            var convId = String(c.conversation_id || c.id || "");
            if (!convId) {
              skippedNoConvId++;
              continue;
            }
            var keys = orderFn(c.mapping);
            var messages = [];
            for (var k = 0; k < keys.length; k++) {
              var node = c.mapping[keys[k]];
              var msg = node && node.message;
              if (!msg || !msg.content) continue;
              var role = normalizeRole(msg.author && msg.author.role);
              if (!role) continue;
              var parts = Array.isArray(msg.content.parts) ? msg.content.parts : [];
              var pieces = [];
              for (var p = 0; p < parts.length; p++) {
                if (typeof parts[p] === "string") {
                  var s = sanitize(parts[p]);
                  if (normalizeText(s)) pieces.push(normalizeText(s));
                } else if (parts[p] && typeof parts[p] === "object" && typeof parts[p].text === "string") {
                  var s2 = sanitize(parts[p].text);
                  if (normalizeText(s2)) pieces.push(normalizeText(s2));
                }
              }
              var text = normalizeText(pieces.join("\n"));
              if (!text) continue;
              messages.push({ role, text, ts: toMs(msg.create_time) });
            }
            out.push(finalizeConversation({
              convId,
              service: SERVICE_BY_FORMAT[FORMATS.CHATGPT_CONVERSATIONS],
              format: FORMATS.CHATGPT_CONVERSATIONS,
              title: c.title,
              updatedAt: toMs(c.update_time != null ? c.update_time : c.create_time),
              messages
            }));
          }
          return { conversations: out, skippedNoConvId, skippedEmpty };
        }
        function claudeMessageText(msg) {
          var parts = [];
          if (Array.isArray(msg.content)) {
            for (var i = 0; i < msg.content.length; i++) {
              var b = msg.content[i];
              if (!b || typeof b !== "object") continue;
              if (b.type === "text" && typeof b.text === "string") {
                var t = normalizeText(b.text);
                if (t) parts.push(t);
              }
            }
          }
          if (!parts.length) {
            var fallback = normalizeText(msg.text);
            if (fallback) parts.push(fallback);
          }
          return normalizeText(parts.join("\n"));
        }
        function parseClaudeArchive(json) {
          var items = arrayifyConversations(json);
          var out = [];
          var skippedNoConvId = 0;
          var skippedEmpty = 0;
          for (var i = 0; i < items.length; i++) {
            var c = items[i];
            if (!c || typeof c !== "object" || !Array.isArray(c.chat_messages)) {
              skippedEmpty++;
              continue;
            }
            var convId = String(c.uuid || c.id || "");
            if (!convId) {
              skippedNoConvId++;
              continue;
            }
            var messages = [];
            for (var k = 0; k < c.chat_messages.length; k++) {
              var msg = c.chat_messages[k];
              if (!msg || typeof msg !== "object") continue;
              var role = normalizeRole(msg.sender);
              if (!role) continue;
              var text = claudeMessageText(msg);
              if (!text) continue;
              messages.push({
                id: typeof msg.uuid === "string" && msg.uuid ? msg.uuid : void 0,
                role,
                text,
                ts: toMs(msg.created_at)
              });
            }
            var providerDate = String(c.updated_at || c.created_at || "");
            out.push(finalizeConversation({
              convId,
              service: SERVICE_BY_FORMAT[FORMATS.CLAUDE_CONVERSATIONS],
              format: FORMATS.CLAUDE_CONVERSATIONS,
              title: c.name || c.title,
              updatedAt: toMs(providerDate),
              messages
            }));
          }
          return { conversations: out, skippedNoConvId, skippedEmpty };
        }
        function parsePerplexityArchive(json, deps) {
          var parseThread = resolveParsePerplexityThread(deps);
          if (!parseThread) return { conversations: [], error: "perplexity-parser-unavailable", skippedNoConvId: 0, skippedEmpty: 0 };
          var items = arrayifyConversations(json);
          var out = [];
          var skippedNoConvId = 0;
          var skippedEmpty = 0;
          for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (!it || typeof it !== "object") {
              skippedEmpty++;
              continue;
            }
            var thread = it.thread && typeof it.thread === "object" ? it.thread : it;
            var entries = Array.isArray(it.entries) ? it.entries : Array.isArray(thread.entries) ? thread.entries : null;
            if (!entries) {
              skippedEmpty++;
              continue;
            }
            var convId = String(thread.id || thread.slug || it.id || it.slug || "");
            if (!convId) {
              skippedNoConvId++;
              continue;
            }
            var parsed = parseThread({ entries }) || {};
            var msgs = Array.isArray(parsed.messages) ? parsed.messages : [];
            var messages = [];
            for (var k = 0; k < msgs.length; k++) {
              var m = msgs[k];
              if (!m || typeof m !== "object") continue;
              var role = normalizeRole(m.role);
              var text = normalizeText(m.text);
              if (!role || !text) continue;
              messages.push({ role, text, ts: 0 });
            }
            out.push(finalizeConversation({
              convId,
              service: SERVICE_BY_FORMAT[FORMATS.PERPLEXITY_THREADS],
              format: FORMATS.PERPLEXITY_THREADS,
              title: thread.title || it.title,
              updatedAt: toMs(thread.updated_at || it.updated_at),
              messages
            }));
          }
          return { conversations: out, skippedNoConvId, skippedEmpty };
        }
        function parseArchive(json, deps) {
          reportFullTextAnomalies(json, deps);
          var format = detectArchiveFormat(json);
          if (!format) {
            return { ok: false, format: null, service: "", error: "unknown-format", conversations: [], skippedNoConvId: 0, skippedEmpty: 0 };
          }
          var res;
          if (format === FORMATS.GEMINI_TAKEOUT) res = parseGeminiTakeout(json);
          else if (format === FORMATS.CHATGPT_CONVERSATIONS) res = parseChatGPTArchive(json, deps);
          else if (format === FORMATS.CLAUDE_CONVERSATIONS) res = parseClaudeArchive(json);
          else res = parsePerplexityArchive(json, deps);
          if (res.error) {
            return { ok: false, format, service: serviceOfFormat(format), error: res.error, conversations: [], skippedNoConvId: 0, skippedEmpty: 0 };
          }
          return {
            ok: true,
            format,
            service: serviceOfFormat(format),
            error: null,
            conversations: res.conversations || [],
            skippedNoConvId: res.skippedNoConvId || 0,
            skippedEmpty: res.skippedEmpty || 0
          };
        }
        function parseArchiveText(text, deps) {
          var json = null;
          try {
            json = JSON.parse(String(text == null ? "" : text));
          } catch (e) {
            return { ok: false, format: null, service: "", error: "invalid-json", conversations: [], skippedNoConvId: 0, skippedEmpty: 0 };
          }
          return parseArchive(json, deps);
        }
        function buildArchiveRecord(conversation, extra) {
          var conv = finalizeConversation(conversation);
          var x = extra || {};
          return {
            v: ARCHIVE_RECORD_VERSION,
            convId: conv.convId,
            service: conv.service,
            format: conv.format,
            title: conv.title,
            count: conv.count,
            textLen: conv.textLen,
            messages: conv.messages,
            importedAt: typeof x.importedAt === "number" ? x.importedAt : Date.now(),
            fileName: String(x.fileName || "")
          };
        }
        function buildConvSourceRecord(archiveRecord, extra) {
          var r = archiveRecord || {};
          var x = extra || {};
          var rec = {
            kind: SOURCE_ARCHIVE,
            service: String(r.service || ""),
            format: String(r.format || ""),
            count: typeof r.count === "number" ? r.count : 0,
            textLen: typeof r.textLen === "number" ? r.textLen : 0,
            importedAt: typeof r.importedAt === "number" ? r.importedAt : Date.now()
          };
          rec.label = describeSource(rec);
          if (x.fileName) rec.fileName = String(x.fileName);
          return rec;
        }
        function buildLiveSourceRecord(extra) {
          var x = extra || {};
          var rec = {
            kind: SOURCE_LIVE,
            service: String(x.service || ""),
            format: "",
            count: typeof x.count === "number" ? x.count : 0,
            textLen: typeof x.textLen === "number" ? x.textLen : 0,
            importedAt: 0
          };
          rec.label = describeSource(rec);
          return rec;
        }
        function describeSource(record) {
          if (!record || typeof record !== "object") return "\u2014";
          if (record.kind === SOURCE_LIVE) return "live (\u0441\u0435\u0442\u044C/DOM)";
          if (record.kind !== SOURCE_ARCHIVE) return "\u2014";
          var fmt = FORMAT_LABEL[record.format] || record.format || "\u0430\u0440\u0445\u0438\u0432";
          var n = typeof record.count === "number" && record.count > 0 ? " \xB7 " + record.count + " \u0441\u043E\u043E\u0431\u0449." : "";
          return "\u0430\u0440\u0445\u0438\u0432: " + fmt + n;
        }
        function sourceBadge(record) {
          if (!record || typeof record !== "object") return "";
          if (record.kind === SOURCE_ARCHIVE) return "\u{1F4E6} \u0430\u0440\u0445\u0438\u0432";
          if (record.kind === SOURCE_LIVE) return "\u26A1 live";
          return "";
        }
        function isArchiveRecordFor(record, convId) {
          if (!record || typeof record !== "object") return false;
          if (!convId) return false;
          return String(record.convId || "") === String(convId);
        }
        function recordBytes(rec) {
          try {
            return JSON.stringify(rec).length;
          } catch (e) {
            return Infinity;
          }
        }
        function planArchiveImport(conversations, opts) {
          var o = opts || {};
          var perConv = typeof o.maxConversationBytes === "number" ? o.maxConversationBytes : MAX_CONVERSATION_BYTES;
          var total = typeof o.maxTotalBytes === "number" ? o.maxTotalBytes : MAX_TOTAL_BYTES;
          var fileName = o.fileName || "";
          var importedAt = typeof o.importedAt === "number" ? o.importedAt : Date.now();
          var accepted = [];
          var skipped = [];
          var used = 0;
          var list = Array.isArray(conversations) ? conversations : [];
          for (var i = 0; i < list.length; i++) {
            var conv = list[i];
            if (!conv || !conv.convId) {
              skipped.push({ convId: "", reason: "no-conv-id", bytes: 0 });
              continue;
            }
            if (!conv.messages || !conv.messages.length) {
              skipped.push({ convId: conv.convId, reason: "empty", bytes: 0 });
              continue;
            }
            var rec = buildArchiveRecord(conv, { fileName, importedAt });
            var bytes = recordBytes(rec);
            if (bytes > perConv) {
              skipped.push({ convId: conv.convId, reason: "too-large", bytes });
              continue;
            }
            if (used + bytes > total) {
              skipped.push({ convId: conv.convId, reason: "budget-exceeded", bytes });
              continue;
            }
            used += bytes;
            accepted.push(rec);
          }
          return { accepted, skipped, bytes: used };
        }
        var Api = {
          ARCHIVE_KEY_PREFIX,
          CONV_SOURCE_KEY_PREFIX,
          ARCHIVE_RECORD_VERSION,
          FORMATS,
          SERVICE_BY_FORMAT,
          FORMAT_LABEL,
          SOURCE_ARCHIVE,
          SOURCE_LIVE,
          MAX_CONVERSATION_BYTES,
          MAX_TOTAL_BYTES,
          MAX_MESSAGES_PER_CONVERSATION,
          MAX_ARCHIVE_SIZE,
          archiveStorageKey,
          convSourceStorageKey,
          normalizeText,
          normalizeRole,
          normalizeMessage,
          hash6,
          toMs,
          detectArchiveFormat,
          serviceOfFormat,
          detectFullTextAnomaly,
          collectFullTextAnomalies,
          reportFullTextAnomalies,
          extractConvIdFromUrl,
          parseGeminiTakeout,
          parseChatGPTArchive,
          parseClaudeArchive,
          parsePerplexityArchive,
          parseArchive,
          parseArchiveText,
          buildArchiveRecord,
          buildConvSourceRecord,
          buildLiveSourceRecord,
          describeSource,
          sourceBadge,
          isArchiveRecordFor,
          recordBytes,
          planArchiveImport
        };
        if (typeof window !== "undefined") window.AiCmArchiveImport = Api;
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
      })();
      (function() {
        "use strict";
        function cleanInline(s) {
          s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");
          s = s.replace(/(\*\*|__)/g, "");
          s = s.replace(/(?<![*\w])\*([^*\n]+)\*(?![\w*])/g, "$1");
          s = s.replace(/(?<![\w_])\_([^_\n]+)\_(?![\w_])/g, "$1");
          s = s.replace(/`/g, "");
          return s;
        }
        function cleanLine(line) {
          var s = String(line == null ? "" : line);
          s = s.replace(/^#{1,6}\s+/, "");
          s = s.replace(/^>\s?/, "");
          s = s.replace(/^[-*+]\s+/, "");
          return s;
        }
        function cleanText(text) {
          var lines = String(text).split("\n");
          var out = [];
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            if (/^-{3,}$/.test(trimmed)) continue;
            out.push(cleanInline(cleanLine(line)));
          }
          return out.join("\n");
        }
        function buildReferenceText(messages) {
          var list = Array.isArray(messages) ? messages : [];
          var parts = [];
          for (var i = 0; i < list.length; i++) {
            var msg = list[i] || {};
            parts.push(cleanText(msg.text == null ? "" : msg.text));
          }
          return parts.join("\n\n");
        }
        if (typeof module !== "undefined" && module.exports) module.exports = buildReferenceText;
        if (typeof window !== "undefined") window.buildReferenceText = buildReferenceText;
      })();
      (function() {
        "use strict";
        function aiCmI18nMessage2(key, fallback, substitutions) {
          try {
            if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
              var message = substitutions ? chrome.i18n.getMessage(key, substitutions) : chrome.i18n.getMessage(key);
              if (message) return message;
            }
          } catch (eMessage) {
          }
          return fallback;
        }
        var REASONING_SECTION_TAG = "[REASONING]";
        var ANSWER_SECTION_TAG = "[ANSWER]";
        function reasoningOfMessage(msg) {
          if (!msg || typeof msg !== "object") return "";
          var r = msg.reasoning;
          return typeof r === "string" ? r : "";
        }
        function withReasoningSections(text, reasoning) {
          var t = typeof text === "string" ? text : "";
          var r = typeof reasoning === "string" ? reasoning : "";
          if (!r) return t;
          if (t.indexOf(r) !== -1) return t;
          return REASONING_SECTION_TAG + "\n" + r + "\n\n" + ANSWER_SECTION_TAG + "\n" + t;
        }
        function messageTextWithReasoning(msg) {
          if (!msg || typeof msg !== "object") return "";
          return withReasoningSections(msg.text, reasoningOfMessage(msg));
        }
        function reasoningOfMessageForExport(msg, useHidden) {
          var r = reasoningOfMessage(msg);
          if (r) return r;
          if (useHidden !== true || !msg || typeof msg !== "object") return "";
          return typeof msg.hiddenReasoning === "string" ? msg.hiddenReasoning : "";
        }
        function markersMessageTextWithReasoning(msg, useHidden) {
          return withReasoningSections(
            messageTextForMarkers(msg),
            reasoningOfMessageForExport(msg, useHidden)
          );
        }
        var TXT_ROLE_MARKER_SITES = ["qwen"];
        function isTxtRoleMarkerHistory(history) {
          try {
            var site = String(history && history.site || "").toLowerCase();
            return TXT_ROLE_MARKER_SITES.indexOf(site) !== -1;
          } catch (e) {
            return false;
          }
        }
        function txtRoleMarker(role) {
          return role === "user" ? "USER:" : "ASSISTANT:";
        }
        function mdRoleMarker(role) {
          return role === "user" ? "### USER" : "### ASSISTANT";
        }
        var CONTAINER_MIN_CONTAINED = 2;
        var CONTAINER_COVER_MIN = 0.8;
        function messageTextForMarkers(msg) {
          if (!msg || typeof msg !== "object") return "";
          if (typeof msg.text === "string" && msg.text) return msg.text;
          if (typeof msg.content === "string") return msg.content;
          return typeof msg.text === "string" ? msg.text : "";
        }
        function dropContainerMessages(list) {
          var src = Array.isArray(list) ? list : [];
          var texts = [];
          for (var t = 0; t < src.length; t++) texts.push(messageTextForMarkers(src[t]));
          var keep = [];
          for (var c = 0; c < src.length; c++) {
            var candidate = texts[c];
            var contained = 0;
            var covered = 0;
            var longest = 0;
            if (candidate) {
              for (var j = 0; j < texts.length; j++) {
                var other = texts[j];
                if (j === c || !other || other.length >= candidate.length) continue;
                if (candidate.indexOf(other) === -1) continue;
                contained++;
                covered += other.length;
                if (other.length > longest) longest = other.length;
              }
            }
            var isContainer = contained >= CONTAINER_MIN_CONTAINED && covered >= CONTAINER_COVER_MIN * candidate.length && candidate.length >= 2 * longest;
            if (!isContainer) keep.push(src[c]);
          }
          return keep;
        }
        function diagTxtRoleStructure(list, totalCount) {
          if (!diagOn()) return false;
          try {
            var kept = Array.isArray(list) ? list.length : -1;
            var total = typeof totalCount === "number" ? totalCount : kept;
            var first = Array.isArray(list) && list.length > 0 ? list[0] : null;
            var text = messageTextForMarkers(first);
            var kind = "\u043D\u0435\u0442";
            if (first && typeof first === "object") {
              if (typeof first.text === "string") kind = "text";
              else if (typeof first.content === "string") kind = "content";
            }
            console.log(DIAG_PREFIX + " txt-roles site=qwen isArray=" + Array.isArray(list) + " msgs=" + total + " kept=" + kept + " dropped-containers=" + (kept >= 0 && total >= kept ? total - kept : 0) + " first.role=" + (first && first.role !== void 0 && first.role !== null ? String(first.role) : "(\u043D\u0435\u0442)") + " first.kind=" + kind + " first.len=" + text.length + " first.head=" + (diagHead(text, 60) || "\u043F\u0443\u0441\u0442\u043E"));
          } catch (eLogRoles) {
          }
          return true;
        }
        function renderReferenceText(list) {
          if (typeof window !== "undefined" && typeof window.buildReferenceText === "function") {
            return window.buildReferenceText(list);
          }
          if (typeof __require === "function") {
            try {
              return __require("./buildReferenceText.js")(list);
            } catch (e) {
            }
          }
          return null;
        }
        function renderReferenceTextWithRoleMarkers(list) {
          var src = Array.isArray(list) ? list : [];
          var parts = [];
          for (var i = 0; i < src.length; i++) {
            var m = src[i] || {};
            var text = renderReferenceText([{ role: m.role, text: messageTextForMarkers(m) }]);
            if (text === null) return null;
            if (!String(text).trim()) continue;
            parts.push(txtRoleMarker(m.role) + "\n" + text);
          }
          return parts.join("\n\n");
        }
        function buildTxtFromHistory(history) {
          var hist = history || {};
          var site = typeof hist.site === "string" ? hist.site : "";
          var messages = history && Array.isArray(history.messages) ? history.messages : [];
          var marked = isTxtRoleMarkerHistory(history);
          var kept = marked ? dropContainerMessages(messages) : messages;
          var forTxt = kept.map(function(m) {
            var text = marked ? markersMessageTextWithReasoning(m, true) : messageTextWithReasoning(m);
            if (!m || typeof m !== "object" || text === m.text) return m;
            var copy = {};
            for (var k in m) {
              if (Object.prototype.hasOwnProperty.call(m, k)) copy[k] = m[k];
            }
            copy.text = text;
            return copy;
          });
          var out;
          if (marked) {
            diagTxtRoleStructure(forTxt, messages.length);
            out = renderReferenceTextWithRoleMarkers(forTxt);
          } else {
            out = renderReferenceText(forTxt);
          }
          if (site === "gemini" && hist.sourceTier && out) out = hist.sourceTier + "\n\n" + out;
          return out === null ? "" : out;
        }
        function buildMdFromHistory(history, platform) {
          var h = history || {};
          var site = typeof h.site === "string" ? h.site : "";
          var lines = [];
          lines.push(aiCmI18nMessage2("export_md_title", "# AI Context Monitor \u2014 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"));
          lines.push("");
          lines.push(aiCmI18nMessage2("export_md_platform", "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: " + (platform || "AI Chat"), [platform || "AI Chat"]));
          lines.push(aiCmI18nMessage2("export_md_model", "\u041C\u043E\u0434\u0435\u043B\u044C: " + (h.model || "\u2014"), [h.model || "\u2014"]));
          var exportedAt = (/* @__PURE__ */ new Date()).toISOString();
          lines.push(aiCmI18nMessage2("export_md_date", "\u0414\u0430\u0442\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430: " + exportedAt, [exportedAt]));
          var tokens = typeof h.tokens === "number" ? h.tokens : 0;
          var limit = typeof h.limit === "number" ? h.limit : 0;
          var percent = typeof h.percent === "number" ? h.percent : 0;
          lines.push(aiCmI18nMessage2("export_md_tokens", "\u0422\u043E\u043A\u0435\u043D\u044B: " + tokens + " / " + limit + " (" + percent + "%)", [String(tokens), String(limit), String(percent)]));
          lines.push("");
          if (site === "gemini" && h.sourceTier) {
            lines.push(h.sourceTier, "");
          }
          var mdMarked = isTxtRoleMarkerHistory(h);
          var messages = Array.isArray(h.messages) ? h.messages : [];
          if (mdMarked) messages = dropContainerMessages(messages);
          for (var i = 0; i < messages.length; i++) {
            var msg = messages[i] || {};
            if (typeof aiCmDiagLine === "function") {
              aiCmDiagLine("claude-role-builder", { msgRole: msg.role, mdMarked });
            }
            var title = mdMarked ? mdRoleMarker(msg.role) : msg.role === "user" || msg.role === "human" ? aiCmI18nMessage2("export_md_role_user", "## \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C") : aiCmI18nMessage2("export_md_role_assistant", "## \u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442");
            lines.push(title);
            lines.push("");
            lines.push(mdMarked ? markersMessageTextWithReasoning(msg, true) : messageTextWithReasoning(msg));
            lines.push("");
          }
          return lines.join("\n");
        }
        function buildJsonFromHistory(history, platform) {
          var h = history || {};
          return JSON.stringify({
            platform: platform || "AI Chat",
            model: h.model || "",
            exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
            tokens: typeof h.tokens === "number" ? h.tokens : 0,
            limit: typeof h.limit === "number" ? h.limit : 0,
            percent: typeof h.percent === "number" ? h.percent : 0,
            // Two-Tier (v89): аддитивное поле метаданных. undefined → JSON.stringify ключ НЕ
            // добавляет, поэтому у прочих платформ и у Gemini без метки байты прежние.
            sourceTier: h.sourceTier,
            messages: Array.isArray(h.messages) ? h.messages : []
          }, null, 2);
        }
        var DIAG_PREFIX = "[AI CM][diag]";
        function diagOn() {
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
        function diagHead(v, n) {
          try {
            var lim = typeof n === "number" && n > 0 ? n : 100;
            if (v === void 0 || v === null) return "";
            var s = String(v);
            if (!s) return "";
            var flat = s.replace(/\s+/g, " ").trim();
            if (!flat) return "";
            return flat.length > lim ? flat.slice(0, lim) + "\u2026" : flat;
          } catch (eHead) {
            return "";
          }
        }
        function diagStack() {
          try {
            var lines = String(new Error().stack || "").split("\n");
            var out = [];
            for (var i = 1; i < lines.length && out.length < 4; i++) {
              var s = String(lines[i] || "").replace(/\s+/g, " ").trim();
              if (!s || s.indexOf("diag") !== -1) continue;
              out.push(s);
            }
            return out.join(" <- ");
          } catch (eStack) {
            return "";
          }
        }
        function diagDownload(trigger, content, fileName, extra) {
          try {
            if (typeof aiCmDiagDownload === "function") return aiCmDiagDownload(trigger, content, fileName, extra);
          } catch (eGlobal) {
          }
          if (!diagOn()) return false;
          try {
            var e = extra || {};
            var url = "";
            try {
              url = String(typeof location !== "undefined" && location && location.href || "");
            } catch (eUrl) {
            }
            console.log(DIAG_PREFIX + " download trigger=" + (trigger || "(\u043D\u0435\u0442)") + " file=" + (fileName === void 0 || fileName === null || String(fileName) === "" ? "\u043F\u0443\u0441\u0442\u043E\u0435" : String(fileName)) + " bytes100=" + (diagHead(content, 100) || "\u043F\u0443\u0441\u0442\u043E") + " len=" + (content === void 0 || content === null ? 0 : String(content).length) + " mime=" + (e.mime === void 0 ? "(\u043D\u0435\u0442)" : e.mime) + " url=" + url + " threadId=" + (e.threadId === void 0 || e.threadId === "" ? "(\u043D\u0435\u0442)" : e.threadId) + " site=" + (e.site === void 0 ? "" : e.site) + " reason=" + (e.reason === void 0 ? "" : e.reason) + " src=" + diagStack());
          } catch (eLog) {
          }
          return true;
        }
        var XSSI_PREFIX_LEN = 4;
        function startsWithXssiPrefix(content) {
          try {
            if (content === void 0 || content === null) return false;
            var s = String(content);
            if (s.length < XSSI_PREFIX_LEN) return false;
            return s.charCodeAt(0) === 41 && s.charCodeAt(1) === 93 && s.charCodeAt(2) === 125 && s.charCodeAt(3) === 39;
          } catch (eXssi) {
            return false;
          }
        }
        function downloadBlockReason(content, fileName) {
          if (startsWithXssiPrefix(content)) return "xssi-prefix";
          if (fileName === void 0 || fileName === null || String(fileName).trim() === "") return "empty-name";
          return null;
        }
        function diagDownloadBlocked(trigger, content, fileName, reason, extra) {
          try {
            if (typeof aiCmDiagDownloadBlocked === "function") {
              return aiCmDiagDownloadBlocked(trigger, content, fileName, reason, extra);
            }
          } catch (eGlobalBlocked) {
          }
          if (!diagOn()) return false;
          try {
            var e = extra || {};
            var url = "";
            try {
              url = String(typeof location !== "undefined" && location && location.href || "");
            } catch (eUrlB) {
            }
            console.log(DIAG_PREFIX + " download-blocked reason=" + (reason || "(\u043D\u0435\u0442)") + " trigger=" + (trigger || "(\u043D\u0435\u0442)") + " file=" + (fileName === void 0 || fileName === null || String(fileName) === "" ? "\u043F\u0443\u0441\u0442\u043E\u0435" : String(fileName)) + " bytes100=" + (diagHead(content, 100) || "\u043F\u0443\u0441\u0442\u043E") + " len=" + (content === void 0 || content === null ? 0 : String(content).length) + " mime=" + (e.mime === void 0 ? "(\u043D\u0435\u0442)" : e.mime) + " url=" + url + " threadId=" + (e.threadId === void 0 || e.threadId === "" ? "(\u043D\u0435\u0442)" : e.threadId) + " site=" + (e.site === void 0 ? "" : e.site) + " src=" + diagStack());
          } catch (eLogBlocked) {
          }
          return true;
        }
        function downloadBlob2(content, fileName, mimeType, trigger, extra) {
          var ex = extra || {};
          var blockReason = downloadBlockReason(content, fileName);
          if (blockReason) {
            try {
              diagDownloadBlocked(
                trigger || "builder-download",
                content,
                fileName,
                blockReason,
                { mime: mimeType, threadId: ex.threadId, site: ex.site }
              );
            } catch (eDiagBlocked) {
            }
            return false;
          }
          try {
            diagDownload(
              trigger || "builder-download",
              content,
              fileName,
              { mime: mimeType, threadId: ex.threadId, site: ex.site, reason: ex.reason }
            );
          } catch (eDiag) {
          }
          try {
            var blob = new Blob([content], { type: mimeType });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function() {
              URL.revokeObjectURL(url);
            }, 1e3);
          } catch (e) {
            console.warn("[export] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0444\u0430\u0439\u043B:", e);
          }
          return true;
        }
        var Api = {
          buildTxtFromHistory,
          buildMdFromHistory,
          buildJsonFromHistory,
          downloadBlob: downloadBlob2,
          // O-27 (защитный фикс): причина отказа точки скачивания (null — выдача разрешена) и
          // сама точка отказа наружу — для пинов тестов и переиспользования вызывающим кодом.
          aiCmDownloadBlockReason: downloadBlockReason,
          aiCmDiagDownloadBlocked: diagDownloadBlocked,
          // O-27/O-32: диагностические хелперы наружу (content.js/export-manager.js зовут их
          // через window.AiCmExportBuilders, если глобальный utils/debug.js не подключён).
          aiCmDiagOn: diagOn,
          aiCmDiagHead: diagHead,
          aiCmDiagDownload: diagDownload,
          // O-35: рендер reasoning контрактом DeepSeek — чистая функция наружу (пины тестов
          // и переиспользование; на боевом пути вызывается только двумя сборщиками выше).
          aiCmMessageTextWithReasoning: messageTextWithReasoning,
          aiCmWithReasoningSections: withReasoningSections,
          // O-37 (C): источник размышления для маркерного пути (reasoning, иначе поле захвата
          // hiddenReasoning) и композиция «текст сообщения + секции» — чистые функции наружу;
          // на боевом пути их зовут только buildTxtFromHistory/buildMdFromHistory выше.
          aiCmReasoningOfMessageForExport: reasoningOfMessageForExport,
          aiCmMarkersMessageTextWithReasoning: markersMessageTextWithReasoning,
          // O-36 (D2): маркеры ролей txt-экспорта — чистые предикаты наружу (пины тестов;
          // на боевом пути вызываются только сборщиком buildTxtFromHistory выше).
          aiCmTxtRoleMarker: txtRoleMarker,
          aiCmIsTxtRoleMarkerHistory: isTxtRoleMarkerHistory,
          aiCmTxtRoleMarkerSites: TXT_ROLE_MARKER_SITES,
          // O-36 (D2.1): маркер роли md (Qwen Studio), текст сообщения для маркерного пути
          // (с фолбэком на .content) и контейнер-чистка — чистые функции наружу для пинов
          // и переиспользования; на боевом пути их зовут только два сборщика выше.
          aiCmMdRoleMarker: mdRoleMarker,
          aiCmMessageTextForMarkers: messageTextForMarkers,
          aiCmDropContainerMessages: dropContainerMessages,
          aiCmDiagTxtRoleStructure: diagTxtRoleStructure,
          aiCmContainerRules: { minContained: CONTAINER_MIN_CONTAINED, coverMin: CONTAINER_COVER_MIN }
        };
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmExportBuilders = Api;
      })();
      console.log("AI Context Monitor: \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B");
      var siteEl = document.getElementById("stat-site");
      var modelEl = document.getElementById("stat-model");
      var tokensEl = document.getElementById("stat-tokens");
      var limitEl = document.getElementById("stat-limit");
      var percentEl = document.getElementById("stat-percent");
      var modelSelect = document.getElementById("model-select");
      var customLimit = document.getElementById("custom-limit");
      var showWidget = document.getElementById("show-widget");
      var apiKeyInput = document.getElementById("api-key");
      var toggleApiKeyBtn = document.getElementById("toggle-api-key");
      var exactCountCheckbox = document.getElementById("exact-count");
      var exactCountWarningEl = document.getElementById("exact-count-warning");
      var versionEl = document.querySelector(".version");
      var exportMdBtn = document.getElementById("export-md");
      var exportJsonBtn = document.getElementById("export-json");
      var exportPdfBtn = document.getElementById("export-pdf");
      var exportTxtBtn = document.getElementById("export-txt");
      var exportHintEl = document.getElementById("export-hint");
      var staleWarningEl = document.getElementById("stale-warning");
      var exportDiagBtn = document.getElementById("export-diag");
      var sourceEl = document.getElementById("stat-source");
      function percentColor(p) {
        if (p < 50) return "#22c55e";
        if (p < 80) return "#eab308";
        return "#ef4444";
      }
      try {
        manifest = chrome.runtime.getManifest();
        if (versionEl && manifest.version) versionEl.textContent = "v" + manifest.version;
      } catch (e) {
        aiCmPopupDiagLine("manifest-version", { err: String(e) });
      }
      var manifest;
      var privacyLink = document.getElementById("privacy-link");
      privacyLink && privacyLink.addEventListener("click", function(e) {
        e.preventDefault();
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL("privacy/privacy.html") });
        } catch (ePrivacy) {
          console.warn("[privacy] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0443 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438:", ePrivacy);
        }
      });
      var helpLink = document.getElementById("help-link");
      helpLink && helpLink.addEventListener("click", function(e) {
        e.preventDefault();
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL("docs/index.html") });
        } catch (eHelp) {
          console.warn("[help] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E:", eHelp);
        }
      });
      var siteLabels = {
        "chatgpt": "ChatGPT",
        "gemini": "Gemini",
        "aistudio": "Google AI Studio",
        "google_search": "Google Search AI",
        "deepseek": "DeepSeek",
        "claude": "Claude",
        "perplexity": "Perplexity"
      };
      chrome.storage.sync.get(["selectedModel", "customLimit", "showWidget"], function(data) {
        if (data.selectedModel) modelSelect.value = data.selectedModel;
        if (data.customLimit) customLimit.value = data.customLimit;
        if (data.showWidget !== void 0) showWidget.checked = data.showWidget;
      });
      var AI_CM_BYOK_SESSION_KEY = "aiCmApiKeySession";
      var AI_CM_BYOK_LEGACY_KEYS = [
        "ai_cm_gemini_api_key",
        "ai_cm_api_key",
        "ai_cm_byok_key",
        "aiCmGeminiApiKey",
        "aiCmApiKey",
        "gemini_api_key"
      ];
      var apiKeyStatusEl = document.getElementById("api-key-status");
      var removeApiKeyBtn = document.getElementById("api-key-remove");
      function aiCmFirstLegacyByokKey(data) {
        for (var iLk = 0; iLk < AI_CM_BYOK_LEGACY_KEYS.length; iLk++) {
          var vLk = data ? data[AI_CM_BYOK_LEGACY_KEYS[iLk]] : null;
          if (typeof vLk === "string" && vLk) return vLk;
        }
        return "";
      }
      function aiCmPurgeLegacyByokKeys() {
        try {
          if (!chrome.storage || !chrome.storage.local || typeof chrome.storage.local.remove !== "function") return;
          chrome.storage.local.remove(AI_CM_BYOK_LEGACY_KEYS);
        } catch (ePurge) {
          console.warn("[AI CM][catch] aiCmPurgeLegacyByokKeys:", ePurge);
        }
      }
      function aiCmI18nMessage(key, fallback, substitutions) {
        try {
          if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
            var message = substitutions ? chrome.i18n.getMessage(key, substitutions) : chrome.i18n.getMessage(key);
            if (message) return message;
          }
        } catch (eMessage) {
          aiCmPopupDiagLine("aiCmI18nMessage", { err: String(eMessage) });
        }
        return fallback;
      }
      function aiCmRenderApiKeyStatus(hasKey) {
        if (!apiKeyStatusEl) return;
        apiKeyStatusEl.textContent = hasKey ? aiCmI18nMessage("options_byok_status_set", "\u041A\u043B\u044E\u0447: \u0437\u0430\u0434\u0430\u043D") : aiCmI18nMessage("options_byok_status_unset", "\u041A\u043B\u044E\u0447: \u043D\u0435 \u0437\u0430\u0434\u0430\u043D");
      }
      function aiCmSaveByokKey(value) {
        try {
          if (chrome.storage && chrome.storage.session && typeof chrome.storage.session.set === "function") {
            var patch = {};
            patch[AI_CM_BYOK_SESSION_KEY] = value;
            chrome.storage.session.set(patch);
          }
        } catch (eSet) {
          console.warn("[AI CM][catch] aiCmSaveByokKey:", eSet);
        }
        aiCmPurgeLegacyByokKeys();
      }
      var aiCmByokHasKeyState = null;
      function aiCmRenderExactCountWarning(show) {
        if (!exactCountWarningEl) return;
        exactCountWarningEl.textContent = show ? aiCmI18nMessage(
          "options_exact_count_nokey",
          "\u041A\u043B\u044E\u0447 API \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043B\u044E\u0447 \u0437\u0430\u043D\u043E\u0432\u043E, \u0447\u0442\u043E\u0431\u044B \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0442\u043E\u0447\u043D\u044B\u0439 \u043F\u043E\u0434\u0441\u0447\u0451\u0442"
        ) : "";
      }
      function aiCmSyncExactCountWithByok(hasKey) {
        if (hasKey !== true && hasKey !== false) return;
        aiCmByokHasKeyState = hasKey;
        if (hasKey || !exactCountCheckbox || !exactCountCheckbox.checked) {
          aiCmRenderExactCountWarning(false);
          return;
        }
        exactCountCheckbox.checked = false;
        aiCmRenderExactCountWarning(true);
        try {
          chrome.storage.local.set({ ai_cm_exact_token_count: false });
        } catch (eSync) {
          console.warn("[AI CM][catch] aiCmSyncExactCountWithByok:", eSync);
        }
      }
      function aiCmLoadByokKey() {
        try {
          let onSession2 = function(data) {
            if (handled) return;
            handled = true;
            var key = data ? data[AI_CM_BYOK_SESSION_KEY] : "";
            if (typeof key === "string" && key) {
              if (apiKeyInput) apiKeyInput.value = key;
              aiCmRenderApiKeyStatus(true);
              aiCmSyncExactCountWithByok(true);
              return;
            }
            aiCmRenderApiKeyStatus(false);
            aiCmSyncExactCountWithByok(false);
            try {
              chrome.storage.local.get(AI_CM_BYOK_LEGACY_KEYS, function(dl) {
                var legacy = aiCmFirstLegacyByokKey(dl);
                if (!legacy) return;
                aiCmSaveByokKey(legacy);
                if (apiKeyInput) apiKeyInput.value = legacy;
                aiCmRenderApiKeyStatus(true);
                aiCmSyncExactCountWithByok(true);
                console.log("[AI CM][byok] migrated plaintext\u2192session");
              });
            } catch (eLeg) {
              aiCmPopupDiagLine("aiCmLoadByokKey", { err: String(eLeg) });
            }
          };
          var onSession = onSession2;
          if (!chrome.storage || !chrome.storage.session || typeof chrome.storage.session.get !== "function") {
            aiCmRenderApiKeyStatus(false);
            return;
          }
          var handled = false;
          var maybePromise = chrome.storage.session.get([AI_CM_BYOK_SESSION_KEY], onSession2);
          if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.then(onSession2, function() {
              if (!handled) {
                handled = true;
                aiCmRenderApiKeyStatus(false);
                aiCmSyncExactCountWithByok(false);
              }
            });
          }
        } catch (eLoad) {
          aiCmRenderApiKeyStatus(false);
        }
      }
      chrome.storage.local.get(["ai_cm_exact_token_count"], function(data) {
        if (data.ai_cm_exact_token_count === void 0) return;
        exactCountCheckbox.checked = !!data.ai_cm_exact_token_count;
        if (aiCmByokHasKeyState === false) aiCmSyncExactCountWithByok(false);
      });
      aiCmLoadByokKey();
      modelSelect && modelSelect.addEventListener("change", function() {
        chrome.storage.sync.set({ selectedModel: modelSelect.value });
      });
      var CUSTOM_LIMIT_DEBOUNCE_MS = 500;
      var customLimitWriteTimer = null;
      function aiCmCancelCustomLimitWrite() {
        if (customLimitWriteTimer !== null) {
          clearTimeout(customLimitWriteTimer);
          customLimitWriteTimer = null;
        }
      }
      customLimit && customLimit.addEventListener("input", function() {
        aiCmCancelCustomLimitWrite();
        customLimitWriteTimer = setTimeout(function() {
          customLimitWriteTimer = null;
          var value = customLimit.value ? parseInt(customLimit.value) : null;
          chrome.storage.sync.set({ customLimit: value });
        }, CUSTOM_LIMIT_DEBOUNCE_MS);
      });
      customLimit && customLimit.addEventListener("change", function() {
        if (!customLimit.value) {
          aiCmCancelCustomLimitWrite();
          customLimit.placeholder = aiCmI18nMessage("options_limit_placeholder", "\u0410\u0432\u0442\u043E");
          chrome.storage.sync.set({ customLimit: null });
        }
      });
      showWidget && showWidget.addEventListener("change", function() {
        chrome.storage.sync.set({ showWidget: showWidget.checked });
      });
      var debugLogsCheckbox = document.getElementById("debugLogs");
      chrome.storage.local.get(["aiCmDebugLogs"], function(data) {
        if (debugLogsCheckbox) debugLogsCheckbox.checked = data.aiCmDebugLogs === true;
      });
      debugLogsCheckbox && debugLogsCheckbox.addEventListener("change", function() {
        chrome.storage.local.set({ aiCmDebugLogs: debugLogsCheckbox.checked });
      });
      var includeHiddenCheckbox = document.getElementById("aiCmIncludeHiddenInExport");
      chrome.storage.local.get(["aiCmIncludeHiddenInExport"], function(data) {
        if (includeHiddenCheckbox) includeHiddenCheckbox.checked = !!(data && data.aiCmIncludeHiddenInExport === true);
      });
      includeHiddenCheckbox && includeHiddenCheckbox.addEventListener("change", function() {
        chrome.storage.local.set({ aiCmIncludeHiddenInExport: includeHiddenCheckbox.checked });
      });
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName !== "local") return;
          if (changes.aiCmIncludeHiddenInExport && includeHiddenCheckbox) {
            includeHiddenCheckbox.checked = changes.aiCmIncludeHiddenInExport.newValue === true;
          }
        });
      } catch (eHiddenSync) {
        aiCmPopupDiagLine("hidden-sync", { err: String(eHiddenSync) });
      }
      var proactiveCheckbox = document.getElementById("aiCmProactive");
      var proactiveNotifyCheckbox = document.getElementById("aiCmProactiveNotify");
      chrome.storage.local.get(["aiCmProactive", "aiCmProactiveNotify"], function(data) {
        if (proactiveCheckbox) proactiveCheckbox.checked = !(data && data.aiCmProactive === false);
        if (proactiveNotifyCheckbox) proactiveNotifyCheckbox.checked = !!(data && data.aiCmProactiveNotify === true);
      });
      proactiveCheckbox && proactiveCheckbox.addEventListener("change", function() {
        chrome.storage.local.set({ aiCmProactive: proactiveCheckbox.checked });
      });
      proactiveNotifyCheckbox && proactiveNotifyCheckbox.addEventListener("change", function() {
        chrome.storage.local.set({ aiCmProactiveNotify: proactiveNotifyCheckbox.checked });
      });
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName !== "local") return;
          if (changes.aiCmProactive && proactiveCheckbox) {
            proactiveCheckbox.checked = changes.aiCmProactive.newValue !== false;
          }
          if (changes.aiCmProactiveNotify && proactiveNotifyCheckbox) {
            proactiveNotifyCheckbox.checked = changes.aiCmProactiveNotify.newValue === true;
          }
        });
      } catch (e) {
        aiCmPopupDiagLine("proactive-changed", { err: String(e) });
      }
      var thrLowInput = document.getElementById("aiCmProactiveLow");
      var thrMedInput = document.getElementById("aiCmProactiveMedium");
      var thrHighInput = document.getElementById("aiCmProactiveHigh");
      var PROACTIVE_THRESHOLDS_DEFAULT = [70, 85, 95];
      function validProactiveThresholds(arr) {
        try {
          if (!Array.isArray(arr) || arr.length < 3) return null;
          var out = [];
          for (var i = 0; i < 3; i++) {
            var n = parseInt(arr[i], 10);
            if (isNaN(n) || n < 1 || n > 100) return null;
            out.push(n);
          }
          if (!(out[0] < out[1] && out[1] < out[2])) return null;
          return out;
        } catch (e) {
          return null;
        }
      }
      function readProactiveThresholdInputs() {
        return [
          thrLowInput ? thrLowInput.value : void 0,
          thrMedInput ? thrMedInput.value : void 0,
          thrHighInput ? thrHighInput.value : void 0
        ];
      }
      function fillProactiveThresholdInputs(arr) {
        if (!arr || arr.length < 3) return;
        if (thrLowInput) thrLowInput.value = arr[0];
        if (thrMedInput) thrMedInput.value = arr[1];
        if (thrHighInput) thrHighInput.value = arr[2];
      }
      function applyProactiveThresholdInputs() {
        try {
          var raw = readProactiveThresholdInputs();
          var t = validProactiveThresholds(raw);
          if (!t) {
            console.warn("[AI CM][thresholds] \u0431\u0438\u0442\u044B\u0439 \u0432\u0432\u043E\u0434 \u043F\u043E\u0440\u043E\u0433\u043E\u0432 \u2192 \u0444\u043E\u043B\u0431\u044D\u043A [70,85,95]", raw);
            t = PROACTIVE_THRESHOLDS_DEFAULT;
          }
          fillProactiveThresholdInputs(t);
          chrome.storage.local.set({ aiCmProactiveThresholds: t });
        } catch (eP) {
          aiCmPopupDiagLine("applyProactiveThresholdInputs", { err: String(eP) });
        }
      }
      try {
        chrome.storage.local.get(["aiCmProactiveThresholds"], function(data) {
          try {
            var hasStored = data && data.aiCmProactiveThresholds !== void 0;
            var t = validProactiveThresholds(hasStored ? data.aiCmProactiveThresholds : null);
            if (hasStored && !t) {
              console.warn("[AI CM][thresholds] \u0431\u0438\u0442\u044B\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 aiCmProactiveThresholds \u2192 \u0434\u0435\u0444\u043E\u043B\u0442 [70,85,95]", data.aiCmProactiveThresholds);
            }
            fillProactiveThresholdInputs(t || PROACTIVE_THRESHOLDS_DEFAULT);
          } catch (eInit) {
            aiCmPopupDiagLine("thresholds-init", { err: String(eInit) });
          }
        });
      } catch (eLoad) {
        aiCmPopupDiagLine("thresholds-load", { err: String(eLoad) });
      }
      [thrLowInput, thrMedInput, thrHighInput].forEach(function(el) {
        if (!el) return;
        el.addEventListener("change", applyProactiveThresholdInputs);
        el.addEventListener("blur", applyProactiveThresholdInputs);
      });
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName === "local" && changes.aiCmProactiveThresholds) {
            var t2 = validProactiveThresholds(changes.aiCmProactiveThresholds.newValue);
            if (!t2) return;
            if (document.activeElement === thrLowInput || document.activeElement === thrMedInput || document.activeElement === thrHighInput) return;
            fillProactiveThresholdInputs(t2);
          }
        });
      } catch (e) {
        aiCmPopupDiagLine("thresholds-changed", { err: String(e) });
      }
      apiKeyInput && apiKeyInput.addEventListener("input", function() {
        aiCmSaveByokKey(apiKeyInput.value);
        aiCmRenderApiKeyStatus(!!apiKeyInput.value);
        aiCmSyncExactCountWithByok(!!apiKeyInput.value);
      });
      removeApiKeyBtn && removeApiKeyBtn.addEventListener("click", function() {
        try {
          if (chrome.storage && chrome.storage.session && typeof chrome.storage.session.remove === "function") {
            chrome.storage.session.remove([AI_CM_BYOK_SESSION_KEY]);
          }
        } catch (eRm) {
          console.warn("[AI CM][catch] removeApiKey:", eRm);
        }
        aiCmPurgeLegacyByokKeys();
        if (apiKeyInput) apiKeyInput.value = "";
        aiCmRenderApiKeyStatus(false);
        aiCmSyncExactCountWithByok(false);
      });
      toggleApiKeyBtn && toggleApiKeyBtn.addEventListener("click", function() {
        if (apiKeyInput.type === "password") {
          apiKeyInput.type = "text";
          toggleApiKeyBtn.textContent = "\u{1F648}";
        } else {
          apiKeyInput.type = "password";
          toggleApiKeyBtn.textContent = "\u{1F441}";
        }
        toggleApiKeyBtn.setAttribute("aria-pressed", String(apiKeyInput.type === "text"));
      });
      exactCountCheckbox && exactCountCheckbox.addEventListener("change", function() {
        chrome.storage.local.set({ ai_cm_exact_token_count: exactCountCheckbox.checked });
        if (aiCmByokHasKeyState === false && exactCountCheckbox.checked) {
          aiCmSyncExactCountWithByok(false);
        } else {
          aiCmRenderExactCountWarning(false);
        }
      });
      var autoExportCheckbox = document.getElementById("aiCmAutoExport");
      var autoExportPctInput = document.getElementById("aiCmAutoExportPct");
      var autoExportFmtSelect = document.getElementById("aiCmAutoExportFmt");
      function normalizeAutoExportFmt(v) {
        return v === "md" || v === "json" ? v : "txt";
      }
      function clampAutoExportPct(v) {
        var n = parseInt(v, 10);
        if (isNaN(n)) return null;
        if (n < 1) n = 1;
        if (n > 100) n = 100;
        return n;
      }
      var AI_CM_AUTO_EXPORT_PCT_DEFAULT = 90;
      function aiCmAutoExportWriteFull() {
        try {
          var pctFull = clampAutoExportPct(autoExportPctInput.value);
          pctFull = pctFull === null ? AI_CM_AUTO_EXPORT_PCT_DEFAULT : pctFull;
          autoExportPctInput.value = pctFull;
          chrome.storage.local.set({
            aiCmAutoExport: autoExportCheckbox.checked === true,
            aiCmAutoExportPct: pctFull,
            aiCmAutoExportFmt: normalizeAutoExportFmt(autoExportFmtSelect.value)
          });
        } catch (eFull) {
          aiCmPopupDiagLine("aiCmAutoExportWriteFull", { err: String(eFull) });
        }
      }
      try {
        chrome.storage.local.get(["aiCmAutoExport", "aiCmAutoExportPct", "aiCmAutoExportFmt"], function(data) {
          try {
            data = data || {};
            if (autoExportCheckbox) autoExportCheckbox.checked = data.aiCmAutoExport === true;
            var pctInit = clampAutoExportPct(data.aiCmAutoExportPct);
            if (autoExportPctInput) autoExportPctInput.value = pctInit === null ? AI_CM_AUTO_EXPORT_PCT_DEFAULT : pctInit;
            if (autoExportFmtSelect) autoExportFmtSelect.value = normalizeAutoExportFmt(data.aiCmAutoExportFmt);
            var needsNormalize = typeof data.aiCmAutoExport !== "boolean" || pctInit === null || normalizeAutoExportFmt(data.aiCmAutoExportFmt) !== data.aiCmAutoExportFmt;
            if (needsNormalize) aiCmAutoExportWriteFull();
          } catch (eInit) {
            aiCmPopupDiagLine("autoexport-init", { err: String(eInit) });
          }
        });
      } catch (eLoad) {
        aiCmPopupDiagLine("autoexport-load", { err: String(eLoad) });
      }
      autoExportCheckbox && autoExportCheckbox.addEventListener("change", aiCmAutoExportWriteFull);
      autoExportPctInput && autoExportPctInput.addEventListener("change", aiCmAutoExportWriteFull);
      autoExportPctInput && autoExportPctInput.addEventListener("blur", aiCmAutoExportWriteFull);
      autoExportFmtSelect && autoExportFmtSelect.addEventListener("change", aiCmAutoExportWriteFull);
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName === "local" && changes.aiCmDebugLogs) {
            debugLogsCheckbox.checked = changes.aiCmDebugLogs.newValue === true;
          }
          if (areaName === "local" && changes.aiCmAutoExportPct && autoExportPctInput && document.activeElement !== autoExportPctInput) {
            var pct = clampAutoExportPct(changes.aiCmAutoExportPct.newValue);
            autoExportPctInput.value = pct === null ? 90 : pct;
          }
        });
      } catch (e) {
        aiCmPopupDiagLine("autoexport-changed", { err: String(e) });
      }
      document.getElementById("reset-limit") && document.getElementById("reset-limit").addEventListener("click", function() {
        aiCmCancelCustomLimitWrite();
        customLimit.value = "";
        customLimit.placeholder = aiCmI18nMessage("options_limit_placeholder", "\u0410\u0432\u0442\u043E");
        chrome.storage.sync.set({ customLimit: null });
      });
      var chatDialogPathBySite = {
        "chatgpt": /\/(c|g|share)\//,
        "gemini": /\/app\//,
        "claude": /\/chat\//,
        "perplexity": /\/(search|follow)\//,
        "deepseek": /\/a\//
      };
      function detectChatSite(hostname) {
        if (!hostname) return null;
        var host = String(hostname).toLowerCase();
        if (host.indexOf("chatgpt.com") !== -1) return "chatgpt";
        if (host.indexOf("gemini.google.com") !== -1) return "gemini";
        if (host.indexOf("claude.ai") !== -1) return "claude";
        if (host.indexOf("perplexity.ai") !== -1) return "perplexity";
        if (host.indexOf("chat.deepseek.com") !== -1) return "deepseek";
        return null;
      }
      function isChatHome(hostname, pathname) {
        var site = detectChatSite(hostname);
        if (!site) return false;
        return chatDialogPathBySite[site].test(String(pathname || ""));
      }
      function updateStatsFromState(state, tabHost, tabPath, fromCache) {
        siteEl.textContent = siteLabels[state.site] || state.site || "\u2014";
        modelEl.textContent = state.model || "\u2014";
        tokensEl.textContent = typeof state.tokens === "number" ? state.tokens.toLocaleString() : "\u2014";
        limitEl.textContent = typeof state.limit === "number" ? state.limit.toLocaleString() : "\u2014";
        var p = state.percent || 0;
        percentEl.textContent = p + "%";
        percentEl.style.color = percentColor(p);
        if (sourceEl) {
          sourceEl.textContent = fromCache ? aiCmI18nMessage("options_source_cache", "\u043A\u044D\u0448 (\u043F\u0440\u043E\u0448\u043B\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430)") : state.sourceLabel || "\u2014";
        }
        updateStaleWarning(state, tabHost, tabPath);
      }
      function updateStaleWarning(state, tabHost, tabPath) {
        if (!staleWarningEl) return;
        var showStale = !!(state && state.stale === true && isChatHome(tabHost, tabPath));
        if (showStale) {
          var siteLabel = siteLabels[state.site] || state.site || aiCmI18nMessage("options_stale_site_fallback", "\u0441\u0430\u0439\u0442\u043E\u043C");
          staleWarningEl.textContent = aiCmI18nMessage("options_stale_warning", "\u0418\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F \u0441 " + siteLabel + " \u043C\u043E\u0433\u043B\u0430 \u0443\u0441\u0442\u0430\u0440\u0435\u0442\u044C: \u0441\u0430\u0439\u0442 \u043D\u0435 \u043E\u0442\u0434\u0430\u0451\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0430. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u044F.", [siteLabel]);
          staleWarningEl.style.display = "block";
        } else {
          staleWarningEl.style.display = "none";
          staleWarningEl.textContent = "";
        }
      }
      function aiCmPopupDiagLine(tag, fields) {
        try {
          if (typeof aiCmDiagLine === "function") return aiCmDiagLine(tag, fields);
          var on = false;
          try {
            on = !!(typeof sessionStorage !== "undefined" && sessionStorage && sessionStorage.getItem("aiCmDebug") === "1");
          } catch (eSess) {
            on = false;
          }
          if (!on) {
            try {
              on = window.__aiCmDebugLogs === true;
            } catch (eWin) {
              return false;
            }
          }
          if (!on) return false;
          var parts = [];
          var f = fields || {};
          for (var k in f) {
            if (!Object.prototype.hasOwnProperty.call(f, k)) continue;
            var v = f[k];
            parts.push(k + "=" + (v === void 0 || v === null ? "-" : String(v)));
          }
          console.log("[AI CM][diag] " + tag + " " + parts.join(" "));
          return true;
        } catch (eDiag) {
          return false;
        }
      }
      function showNoData(message) {
        try {
          aiCmPopupDiagLine("qwen-badge", {
            ts: Date.now(),
            event: "showNoData",
            reason: String(message || "-"),
            url: String(typeof location !== "undefined" && location && location.href || "")
          });
        } catch (eQnd) {
          aiCmPopupDiagLine("showNoData", { err: String(eQnd) });
        }
        siteEl.textContent = message || aiCmI18nMessage("options_no_data", "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445");
        modelEl.textContent = "\u2014";
        tokensEl.textContent = "\u2014";
        limitEl.textContent = "\u2014";
        percentEl.textContent = "\u2014";
        percentEl.style.color = "#8888aa";
      }
      function formatTime(ts) {
        try {
          var d = new Date(ts);
          return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        } catch (e) {
          return "??:??";
        }
      }
      var cachedState = null;
      function loadStats() {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tab = tabs && tabs[0];
            if (!tab || !tab.url) {
              showNoData(aiCmI18nMessage("options_no_active_tab", "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0438"));
              return;
            }
            if (tab.url.indexOf("chrome://") === 0 || tab.url.indexOf("chrome-extension://") === 0) {
              showNoData(aiCmI18nMessage("options_open_supported_site", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u0430\u0439\u0442"));
              return;
            }
            var tabHost = "";
            var tabPath = "";
            try {
              var activeTabUrl = new URL(tab.url);
              tabHost = activeTabUrl.hostname;
              tabPath = activeTabUrl.pathname;
            } catch (e) {
              aiCmPopupDiagLine("loadStats-tab-url", { err: String(e) });
            }
            chrome.storage.local.get(["aiCmState", "aiCmState:" + tabHost], function(data) {
              var state = data["aiCmState:" + tabHost] || null;
              if (!state && data.aiCmState && data.aiCmState.host === tabHost) {
                state = data.aiCmState;
              }
              if (state) {
                cachedState = state;
                updateStatsFromState(state, tabHost, tabPath);
              } else if (cachedState && cachedState.host === tabHost) {
                updateStatsFromState(cachedState, tabHost, tabPath, true);
                var cachedAt = formatTime(cachedState.updatedAt);
                siteEl.textContent += aiCmI18nMessage("options_data_from", " \xB7 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0442 " + cachedAt, [cachedAt]);
              } else {
                showNoData(aiCmI18nMessage("options_open_supported_site", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u0430\u0439\u0442"));
              }
            });
          });
        } catch (e) {
          showNoData(aiCmI18nMessage("options_reload_page", "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443"));
        }
      }
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName !== "local") return;
          var candidates = [];
          if (changes.aiCmState && changes.aiCmState.newValue) candidates.push(changes.aiCmState.newValue);
          for (var key in changes) {
            if (key.indexOf("aiCmState:") === 0 && changes[key] && changes[key].newValue) {
              candidates.push(changes[key].newValue);
            }
          }
          if (!candidates.length) {
            var removedForTab = false;
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              var tab = tabs && tabs[0];
              var tabHost = "";
              try {
                if (tab && tab.url) tabHost = new URL(tab.url).hostname;
              } catch (e) {
                aiCmPopupDiagLine("stats-changed-removed", { err: String(e) });
              }
              removedForTab = !tabHost && (!!changes.aiCmState || !!changes["aiCmState:" + tabHost]) || !!tabHost && (!!changes["aiCmState:" + tabHost] || !!changes.aiCmState && !!(changes.aiCmState.oldValue && changes.aiCmState.oldValue.host === tabHost));
              if (!removedForTab) return;
              cachedState = null;
              showNoData(aiCmI18nMessage("options_open_supported_site", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u0430\u0439\u0442"));
              updateStaleWarning(null, tabHost, "");
            });
            return;
          }
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tab = tabs && tabs[0];
            var tabHost = "";
            var tabPath = "";
            try {
              if (tab && tab.url) {
                var activeTabUrl = new URL(tab.url);
                tabHost = activeTabUrl.hostname;
                tabPath = activeTabUrl.pathname;
              }
            } catch (e) {
              aiCmPopupDiagLine("stats-changed-live", { err: String(e) });
            }
            var best = null;
            for (var i = 0; i < candidates.length; i++) {
              var s = candidates[i];
              if (s.host === tabHost && (!best || (s.updatedAt || 0) > (best.updatedAt || 0))) best = s;
            }
            if (best) {
              cachedState = best;
              updateStatsFromState(best, tabHost, tabPath);
            }
          });
        });
      } catch (e) {
        aiCmPopupDiagLine("stats-changed", { err: String(e) });
      }
      var cachedHistory = null;
      var currentTabHost = "";
      function getActiveTabHost(cb) {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tab = tabs && tabs[0];
            var host = "";
            if (tab && tab.url) {
              try {
                host = new URL(tab.url).hostname;
              } catch (e) {
                host = "";
              }
            }
            currentTabHost = host;
            cb(host);
          });
        } catch (e) {
          cb("");
        }
      }
      function updateExportButtons() {
        if (!exportMdBtn || !exportJsonBtn || !exportPdfBtn) return;
        var enabled = !!(cachedHistory && cachedHistory.host === currentTabHost);
        exportMdBtn.disabled = !enabled;
        exportJsonBtn.disabled = !enabled;
        exportPdfBtn.disabled = !enabled;
        if (exportTxtBtn) exportTxtBtn.disabled = !enabled;
        if (exportHintEl) {
          if (enabled) {
            var exportAt = formatTime(cachedHistory.updatedAt);
            exportHintEl.textContent = aiCmI18nMessage("options_ready_to_export", "\u0413\u043E\u0442\u043E\u0432\u043E \u043A \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0443 \xB7 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0442 " + exportAt, [exportAt]);
          } else {
            exportHintEl.textContent = aiCmI18nMessage("options_open_supported_site", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0441\u0430\u0439\u0442");
          }
        }
      }
      function buildTxtText(hist) {
        return window.AiCmExportBuilders ? window.AiCmExportBuilders.buildTxtFromHistory(hist || cachedHistory) : "";
      }
      function refreshExportState() {
        getActiveTabHost(function(host) {
          chrome.storage.local.get(["aiCmHistory", "aiCmHistory:" + host], function(data) {
            var hist = data["aiCmHistory:" + host] || null;
            if (!hist && data.aiCmHistory && data.aiCmHistory.host === host) {
              hist = data.aiCmHistory;
            }
            cachedHistory = hist;
            updateExportButtons();
          });
        });
      }
      function pad2(n) {
        return (n < 10 ? "0" : "") + n;
      }
      function buildFileName(ext, hist) {
        hist = hist || cachedHistory;
        var d = /* @__PURE__ */ new Date();
        var stamp = d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "-" + pad2(d.getHours()) + "-" + pad2(d.getMinutes());
        var site = hist && hist.site || "chat";
        var model = hist && hist.model || "model";
        var safeSite = String(site).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "chat";
        var safeModel = String(model).replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "model";
        var lowConfPrefix = hist && hist.isLowConfidenceBase === true ? "[LOW CONFIDENCE]_" : "";
        return lowConfPrefix + "ai-context-monitor-" + safeSite + "-" + safeModel + "-" + stamp + "." + ext;
      }
      function downloadBlob(content, fileName, mimeType, trigger) {
        if (window.AiCmExportBuilders && window.AiCmExportBuilders.downloadBlob) {
          window.AiCmExportBuilders.downloadBlob(content, fileName, mimeType, trigger || "options");
        }
      }
      function getPlatform(hist) {
        hist = hist || cachedHistory;
        var site = hist && hist.site;
        return siteLabels[site] || site || "AI Chat";
      }
      function buildJsonText(hist) {
        hist = hist || cachedHistory;
        var exportedAt = (/* @__PURE__ */ new Date()).toISOString();
        return JSON.stringify({
          platform: getPlatform(hist),
          model: hist && hist.model || "",
          exportedAt,
          tokens: hist && typeof hist.tokens === "number" ? hist.tokens : 0,
          limit: hist && typeof hist.limit === "number" ? hist.limit : 0,
          percent: hist && typeof hist.percent === "number" ? hist.percent : 0,
          messages: hist && Array.isArray(hist.messages) ? hist.messages : []
        }, null, 2);
      }
      function buildMdText(hist) {
        return window.AiCmExportBuilders ? window.AiCmExportBuilders.buildMdFromHistory(hist || cachedHistory, getPlatform(hist)) : "";
      }
      function getCurrentConvSnapshot(cb) {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var tab = tabs && tabs[0];
            if (!tab || !tab.id) {
              cb(null);
              return;
            }
            try {
              chrome.tabs.sendMessage(tab.id, { type: "aiCmExportCurrent" }, function(resp) {
                if (chrome.runtime.lastError || !resp || !resp.data) {
                  cb(null);
                  return;
                }
                cb(resp.data);
              });
            } catch (eS) {
              cb(null);
            }
          });
        } catch (eQ) {
          cb(null);
        }
      }
      function pickExportHistory(snap) {
        if (snap && snap.convId) return snap;
        return cachedHistory;
      }
      exportMdBtn && exportMdBtn.addEventListener("click", function() {
        if (exportMdBtn.disabled) return;
        getCurrentConvSnapshot(function(snap) {
          var hist = pickExportHistory(snap);
          if (!hist) return;
          downloadBlob(buildMdText(hist), buildFileName("md", hist), "text/markdown", "options-md");
        });
      });
      exportJsonBtn && exportJsonBtn.addEventListener("click", function() {
        if (exportJsonBtn.disabled) return;
        getCurrentConvSnapshot(function(snap) {
          var hist = pickExportHistory(snap);
          if (!hist) return;
          downloadBlob(buildJsonText(hist), buildFileName("json", hist), "application/json", "options-json");
        });
      });
      exportTxtBtn && exportTxtBtn.addEventListener("click", function() {
        if (exportTxtBtn.disabled) return;
        getCurrentConvSnapshot(function(snap) {
          var hist = pickExportHistory(snap);
          if (!hist) return;
          var txt = buildTxtText(hist);
          if (txt.charAt(0) !== "\uFEFF") txt = "\uFEFF" + txt;
          downloadBlob(txt, buildFileName("txt", hist), "text/plain;charset=utf-8", "options-txt");
        });
      });
      exportPdfBtn && exportPdfBtn.addEventListener("click", function() {
        if (exportPdfBtn.disabled) return;
        getActiveTab(function(tab) {
          if (!tab || !tab.id) return;
          var url = chrome.runtime.getURL("print/print.html") + "?tab=" + tab.id;
          try {
            chrome.tabs.create({ url });
          } catch (e) {
            console.warn("[export-pdf] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0435\u0447\u0430\u0442\u043D\u0443\u044E \u0444\u043E\u0440\u043C\u0443:", e);
          }
        });
      });
      function getActiveTab(cb) {
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            cb(tabs && tabs[0] ? tabs[0] : null);
          });
        } catch (e) {
          cb(null);
        }
      }
      function buildDiagnosticsFileName() {
        return "ai-context-monitor-diagnostics-" + Date.now() + ".json";
      }
      exportDiagBtn && exportDiagBtn.addEventListener("click", function() {
        getActiveTab(function(tab) {
          if (!tab || !tab.id) {
            downloadBlob(JSON.stringify({ error: "\u043D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0438", at: (/* @__PURE__ */ new Date()).toISOString() }, null, 2), buildDiagnosticsFileName(), "application/json", "options-diag");
            return;
          }
          try {
            chrome.tabs.sendMessage(tab.id, { type: "aiCmDiag" }, function(response) {
              var payload;
              if (chrome.runtime.lastError) {
                payload = {
                  error: "content script \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B: " + chrome.runtime.lastError.message,
                  at: (/* @__PURE__ */ new Date()).toISOString()
                };
              } else {
                payload = response && response.diag ? response.diag : { error: "\u043F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442", response: response || null };
              }
              downloadBlob(JSON.stringify(payload, null, 2), buildDiagnosticsFileName(), "application/json", "options-diag");
            });
          } catch (e) {
            downloadBlob(JSON.stringify({ error: "sendMessage error: " + e.message, at: (/* @__PURE__ */ new Date()).toISOString() }, null, 2), buildDiagnosticsFileName(), "application/json", "options-diag");
          }
        });
      });
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName !== "local") return;
          var hist = null;
          if (changes.aiCmHistory && changes.aiCmHistory.newValue) hist = changes.aiCmHistory.newValue;
          for (var key in changes) {
            if (key.indexOf("aiCmHistory:") === 0 && changes[key] && changes[key].newValue) {
              var v = changes[key].newValue;
              if (!hist || (v.updatedAt || 0) > (hist.updatedAt || 0)) hist = v;
            }
          }
          if (!hist) return;
          getActiveTabHost(function() {
            if (hist.host === currentTabHost) cachedHistory = hist;
            updateExportButtons();
          });
        });
      } catch (e) {
        aiCmPopupDiagLine("history-changed", { err: String(e) });
      }
      var archiveFileInput = document.getElementById("archive-file");
      var archiveImportBtn = document.getElementById("archive-import");
      var archiveRefreshBtn = document.getElementById("archive-refresh");
      var archiveStatusEl = document.getElementById("archive-status");
      var archiveListEl = document.getElementById("archive-list");
      var AI_ARCHIVE_MAX_FILES = 20;
      function aiCmArchiveApi() {
        try {
          return typeof window !== "undefined" && window.AiCmArchiveImport ? window.AiCmArchiveImport : null;
        } catch (e) {
          return null;
        }
      }
      function aiCmSetArchiveStatus(text, isError) {
        if (!archiveStatusEl) return;
        archiveStatusEl.textContent = text || "";
        archiveStatusEl.style.color = isError ? "#ef4444" : "";
      }
      function buildArchiveStoragePatch(records, fileName) {
        const API = aiCmArchiveApi();
        const patch = {};
        if (!API || !Array.isArray(records)) return patch;
        records.forEach(function(rec) {
          if (!rec || !rec.convId) return;
          patch[API.archiveStorageKey(rec.convId)] = rec;
          patch[API.convSourceStorageKey(rec.convId)] = API.buildConvSourceRecord(rec, { fileName });
        });
        return patch;
      }
      function aiCmImportArchiveFiles(files, onDone) {
        const API = aiCmArchiveApi();
        if (!API) {
          onDone(aiCmI18nMessage("options_archive_module_missing", "\u043C\u043E\u0434\u0443\u043B\u044C \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D (utils/archive-import.js)"));
          return;
        }
        const list = Array.prototype.slice.call(files || []).filter(function(f) {
          return !!f;
        }).slice(0, AI_ARCHIVE_MAX_FILES);
        if (!list.length) {
          onDone(aiCmI18nMessage("options_archive_no_files", "\u0444\u0430\u0439\u043B\u044B \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u044B"));
          return;
        }
        const report = {
          files: 0,
          conversations: 0,
          accepted: 0,
          bytes: 0,
          skipped: [],
          errors: [],
          patch: {}
        };
        let idx = 0;
        function step() {
          if (idx >= list.length) {
            onDone(null, report);
            return;
          }
          const file = list[idx++];
          report.files++;
          const maxArchiveSize = Number(API.MAX_ARCHIVE_SIZE) || 0;
          const fileSize = Number(file && file.size) || 0;
          if (maxArchiveSize > 0 && fileSize > maxArchiveSize) {
            const limitMb = String(Math.round(maxArchiveSize / (1024 * 1024)));
            report.errors.push({
              fileName: file.name,
              error: "file-too-large",
              size: fileSize,
              limit: maxArchiveSize,
              message: aiCmI18nMessage(
                "options_archive_file_too_large",
                "\u0444\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 (\u0431\u043E\u043B\u044C\u0448\u0435 " + limitMb + " \u041C\u0411) \u2014 \u0447\u0442\u0435\u043D\u0438\u0435 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E",
                [limitMb]
              )
            });
            step();
            return;
          }
          let reader;
          try {
            reader = new FileReader();
          } catch (eNew) {
            report.errors.push({ fileName: file.name, error: "filereader-unavailable" });
            step();
            return;
          }
          reader.onerror = function() {
            report.errors.push({ fileName: file.name, error: "read-error" });
            step();
          };
          reader.onload = function() {
            try {
              const parsed = API.parseArchiveText(String(reader.result == null ? "" : reader.result));
              if (!parsed.ok) {
                report.errors.push({ fileName: file.name, error: parsed.error });
                step();
                return;
              }
              report.conversations += parsed.conversations.length;
              const plan = API.planArchiveImport(parsed.conversations, { fileName: file.name });
              (plan.skipped || []).forEach(function(s) {
                report.skipped.push({ fileName: file.name, convId: s.convId, reason: s.reason });
              });
              report.accepted += plan.accepted.length;
              report.bytes += plan.bytes || 0;
              Object.assign(report.patch, buildArchiveStoragePatch(plan.accepted, file.name));
            } catch (eParse) {
              report.errors.push({ fileName: file.name, error: "parse-exception" });
            }
            step();
          };
          try {
            reader.readAsText(file);
          } catch (eRead) {
            report.errors.push({ fileName: file.name, error: "read-exception" });
            step();
          }
        }
        step();
      }
      function formatArchiveReport(report) {
        if (!report) return "";
        const parts = [];
        var nFiles = String(report.files);
        var nConvs = String(report.conversations);
        var nAccepted = String(report.accepted);
        parts.push(aiCmI18nMessage("options_archive_report_files", "\u0444\u0430\u0439\u043B\u043E\u0432: " + nFiles, [nFiles]));
        parts.push(aiCmI18nMessage("options_archive_report_conversations", "\u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432: " + nConvs, [nConvs]));
        parts.push(aiCmI18nMessage("options_archive_report_imported", "\u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E: " + nAccepted, [nAccepted]));
        if (report.bytes) {
          var kb = String(Math.round(report.bytes / 1024));
          parts.push(aiCmI18nMessage("options_archive_report_kb", "\u2248" + kb + " \u041A\u0411", [kb]));
        }
        if (report.skipped && report.skipped.length) {
          const byReason = {};
          report.skipped.forEach(function(s) {
            byReason[s.reason] = (byReason[s.reason] || 0) + 1;
          });
          var skippedList = Object.keys(byReason).map(function(r) {
            return r + "\xD7" + byReason[r];
          }).join(", ");
          parts.push(aiCmI18nMessage("options_archive_report_skipped", "\u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E: " + skippedList, [skippedList]));
        }
        if (report.errors && report.errors.length) {
          var errorList = report.errors.map(function(e) {
            return e.fileName + " (" + (e.message || e.error) + ")";
          }).join(", ");
          parts.push(aiCmI18nMessage("options_archive_report_errors", "\u043E\u0448\u0438\u0431\u043A\u0438: " + errorList, [errorList]));
        }
        return parts.join(" \xB7 ");
      }
      function aiCmListArchiveSourceKeys(cb) {
        try {
          if (chrome.storage.local.getKeys) {
            chrome.storage.local.getKeys(function(keys) {
              cb((keys || []).filter(function(k) {
                return k.indexOf("aiCmArchive:") === 0;
              }).map(function(k) {
                return k.slice("aiCmArchive:".length);
              }));
            });
            return;
          }
        } catch (eKeys) {
          aiCmPopupDiagLine("aiCmListArchiveSourceKeys", { err: String(eKeys) });
        }
        try {
          chrome.storage.local.get(null, function(all) {
            cb(Object.keys(all || {}).filter(function(k) {
              return k.indexOf("aiCmArchive:") === 0;
            }).map(function(k) {
              return k.slice("aiCmArchive:".length);
            }));
          });
        } catch (eAll) {
          cb([]);
        }
      }
      function aiCmRenderArchiveList() {
        if (!archiveListEl) return;
        const API = aiCmArchiveApi();
        if (!API) {
          archiveListEl.textContent = "";
          return;
        }
        aiCmListArchiveSourceKeys(function(convIds) {
          if (!convIds.length) {
            archiveListEl.textContent = aiCmI18nMessage("options_archive_empty", "\u0410\u0440\u0445\u0438\u0432\u044B \u043D\u0435 \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u044B.");
            return;
          }
          const srcKeys = convIds.map(function(cid) {
            return API.convSourceStorageKey(cid);
          });
          chrome.storage.local.get(srcKeys, function(data) {
            archiveListEl.textContent = "";
            convIds.forEach(function(cid) {
              const rec = (data || {})[API.convSourceStorageKey(cid)] || null;
              const row = document.createElement("div");
              row.className = "archive-item";
              const info = document.createElement("span");
              info.className = "archive-info";
              const label = rec ? rec.label || API.describeSource(rec) : aiCmI18nMessage("options_archive_fallback", "\u0430\u0440\u0445\u0438\u0432");
              const when = rec && rec.importedAt ? " \xB7 " + formatTime(rec.importedAt) : "";
              const file = rec && rec.fileName ? " \xB7 " + rec.fileName : "";
              info.textContent = cid.slice(0, 8) + aiCmI18nMessage("options_info_separator", "\xA0\u2014\xA0") + label + when + file;
              row.appendChild(info);
              const del = document.createElement("button");
              del.className = "btn-reset archive-del";
              del.type = "button";
              del.textContent = aiCmI18nMessage("options_archive_delete", "\u0423\u0434\u0430\u043B\u0438\u0442\u044C");
              del.setAttribute("data-conv-id", cid);
              del.addEventListener("click", function() {
                aiCmDeleteArchive(cid);
              });
              row.appendChild(del);
              archiveListEl.appendChild(row);
            });
          });
        });
      }
      function aiCmDeleteArchive(convId) {
        const API = aiCmArchiveApi();
        if (!API || !convId) return;
        try {
          chrome.storage.local.remove([API.archiveStorageKey(convId), API.convSourceStorageKey(convId)], function() {
            var shortId = String(convId).slice(0, 8);
            aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_deleted", "\u0430\u0440\u0445\u0438\u0432 " + shortId + " \u0443\u0434\u0430\u043B\u0451\u043D", [shortId]));
            aiCmRenderArchiveList();
          });
        } catch (eDel) {
          var delErr = String(eDel && eDel.message || eDel);
          aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_delete_error", "\u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0430\u0440\u0445\u0438\u0432: " + delErr, [delErr]), true);
        }
      }
      function aiCmApplyArchiveImport() {
        const files = archiveFileInput && archiveFileInput.files;
        aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_reading", "\u0447\u0442\u0435\u043D\u0438\u0435 \u0444\u0430\u0439\u043B\u043E\u0432\u2026"));
        aiCmImportArchiveFiles(files, function(err, report) {
          if (err) {
            aiCmSetArchiveStatus(err, true);
            return;
          }
          const keys = Object.keys(report.patch);
          if (!keys.length) {
            var nothingReport = formatArchiveReport(report);
            aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_nothing", "\u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E \xB7 " + nothingReport, [nothingReport]), true);
            aiCmRenderArchiveList();
            return;
          }
          try {
            chrome.storage.local.set(report.patch, function() {
              var doneReport = formatArchiveReport(report);
              aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_done", "\u0433\u043E\u0442\u043E\u0432\u043E \xB7 " + doneReport, [doneReport]));
              aiCmRenderArchiveList();
            });
          } catch (eSet) {
            var setErr = String(eSet && eSet.message || eSet);
            aiCmSetArchiveStatus(aiCmI18nMessage("options_archive_set_error", "\u043E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435: " + setErr, [setErr]), true);
          }
        });
      }
      archiveImportBtn && archiveImportBtn.addEventListener("click", aiCmApplyArchiveImport);
      archiveRefreshBtn && archiveRefreshBtn.addEventListener("click", function() {
        aiCmSetArchiveStatus("");
        aiCmRenderArchiveList();
      });
      try {
        chrome.storage.onChanged.addListener(function(changes, areaName) {
          if (areaName !== "local") return;
          for (var k in changes) {
            if (k.indexOf("aiCmArchive:") === 0) {
              aiCmRenderArchiveList();
              return;
            }
          }
        });
      } catch (eArcCh) {
        aiCmPopupDiagLine("archive-changed", { err: String(eArcCh) });
      }
      document.addEventListener("DOMContentLoaded", function() {
        loadStats();
        refreshExportState();
        aiCmRenderArchiveList();
      });
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          isChatHome,
          buildArchiveStoragePatch,
          aiCmImportArchiveFiles,
          formatArchiveReport
        };
      }
    }
  });
  require_options();
})();
//# sourceMappingURL=options.js.map
