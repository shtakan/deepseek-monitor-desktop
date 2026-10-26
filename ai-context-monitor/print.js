(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // print.js
  var require_print = __commonJS({
    "print.js"(exports, module) {
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
        function aiCmI18nMessage(key) {
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
              var message = aiCmI18nMessage(nodes[j].getAttribute(binding.key));
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
            aiCmI18nMessage,
            aiCmI18nAvailable,
            bindings: BINDINGS
          };
        }
      })();
      (function() {
        "use strict";
        function escapeHtml(s) {
          return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function inline(text) {
          var src = escapeHtml(text);
          return src.replace(
            /(`[^`\n]+`)|(\*{2}[^*\n]+\*{2})|(\*[^*\s\n][^*\n]*\*)|(_[^_\s\n][^_\n]*_)|(\[[^\]]+\]\(([^)\s]+)\))/g,
            function(m, code, bold, italic, underline, link, url) {
              if (code) return "<code>" + code.slice(1, -1) + "</code>";
              if (bold) return "<strong>" + bold.slice(2, -2) + "</strong>";
              if (italic) return "<em>" + italic.slice(1, -1) + "</em>";
              if (underline) return "<em>" + underline.slice(1, -1) + "</em>";
              if (link) {
                var u = String(url || "").trim();
                if (/^(https?:|mailto:|#|\/)/i.test(u)) {
                  var label = link.slice(1, link.indexOf("]("));
                  return '<a href="' + escapeHtml(u) + '">' + label + "</a>";
                }
                return m;
              }
              return m;
            }
          );
        }
        function isTableSeparator(line) {
          if (!line) return false;
          var c = line.charAt(0);
          if (c !== "|" && c !== "-" && c !== ":") return false;
          return /^[\s|:—-]+$/.test(line) && /-/.test(line);
        }
        function parseRow(line, tag) {
          var s = String(line || "").trim();
          if (s.charAt(0) === "|") s = s.slice(1);
          if (s.charAt(s.length - 1) === "|") s = s.slice(0, -1);
          var cells = s.split("|");
          var out = "<tr>";
          for (var c = 0; c < cells.length; c++) {
            out += "<" + tag + ">" + inline(cells[c].trim()) + "</" + tag + ">";
          }
          return out + "</tr>";
        }
        function renderTable(lines, i) {
          var head = parseRow(lines[i], "th");
          var body = [];
          var j = i + 2;
          while (j < lines.length) {
            var t = (lines[j] || "").trim();
            if (t === "" || t.indexOf("|") === -1) break;
            body.push(parseRow(lines[j], "td"));
            j++;
          }
          return {
            html: "<table><thead>" + head + "</thead>" + (body.length ? "<tbody>" + body.join("") + "</tbody>" : "") + "</table>",
            nextIndex: j
          };
        }
        var LIST_RE = /^([-*+]|\d+[.)])\s+(.*)$/;
        var HEADING_RE = /^(#{1,6})\s+(.*)$/;
        var FENCE_RE = /^```/;
        function renderMarkdown(md) {
          if (typeof md !== "string") return "";
          var lines = String(md).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
          var out = [];
          var i = 0;
          while (i < lines.length) {
            var trimmed = (lines[i] || "").trim();
            if (FENCE_RE.test(trimmed)) {
              var lang = trimmed.slice(3).trim();
              var codeLines = [];
              i++;
              while (i < lines.length && !FENCE_RE.test((lines[i] || "").trim())) {
                codeLines.push(lines[i]);
                i++;
              }
              i++;
              out.push("<pre" + (lang ? ' data-lang="' + escapeHtml(lang) + '"' : "") + "><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
              continue;
            }
            var hm = trimmed.match(HEADING_RE);
            if (hm) {
              var level = hm[1].length;
              out.push("<h" + level + ">" + inline(hm[2]) + "</h" + level + ">");
              i++;
              continue;
            }
            if (trimmed.charAt(0) === "|" && isTableSeparator((lines[i + 1] || "").trim())) {
              var tbl = renderTable(lines, i);
              out.push(tbl.html);
              i = tbl.nextIndex;
              continue;
            }
            var lm = trimmed.match(LIST_RE);
            if (lm) {
              var ordered = /\d+[.)]/.test(lm[1]);
              var tag = ordered ? "ol" : "ul";
              var items = [];
              while (i < lines.length) {
                var t2 = (lines[i] || "").trim();
                if (t2 === "") break;
                var m2 = t2.match(LIST_RE);
                if (!m2) break;
                items.push("<li>" + inline(m2[2]) + "</li>");
                i++;
              }
              out.push("<" + tag + ">" + items.join("") + "</" + tag + ">");
              continue;
            }
            if (trimmed === "") {
              i++;
              continue;
            }
            var paraLines = [lines[i]];
            i++;
            while (i < lines.length) {
              var t3 = (lines[i] || "").trim();
              if (t3 === "") break;
              if (HEADING_RE.test(t3) || FENCE_RE.test(t3)) break;
              if (LIST_RE.test(t3)) break;
              if (t3.charAt(0) === "|" && isTableSeparator((lines[i + 1] || "").trim())) break;
              paraLines.push(lines[i]);
              i++;
            }
            out.push("<p>" + inline(paraLines.join("\n")) + "</p>");
          }
          return out.join("\n");
        }
        var MarkdownRenderer = {
          render: renderMarkdown,
          inline,
          escapeHtml
        };
        if (typeof module !== "undefined" && module.exports) module.exports = MarkdownRenderer;
        if (typeof window !== "undefined") window.MarkdownRenderer = MarkdownRenderer;
      })();
      (function() {
        "use strict";
        function aiCmI18nMessage(key, fallback, substitutions) {
          try {
            if (typeof chrome !== "undefined" && chrome.i18n && typeof chrome.i18n.getMessage === "function") {
              var message = substitutions ? chrome.i18n.getMessage(key, substitutions) : chrome.i18n.getMessage(key);
              if (message) return message;
            }
          } catch (eMessage) {
            return fallback;
          }
          return fallback;
        }
        var SITE_LABELS = {
          "chatgpt": "ChatGPT",
          "gemini": "Gemini",
          "aistudio": "Google AI Studio",
          "google_search": "Google Search AI",
          "deepseek": "DeepSeek",
          "claude": "Claude",
          "perplexity": "Perplexity"
        };
        function getParam(name) {
          try {
            return new URLSearchParams(window.location.search).get(name);
          } catch (e) {
            return null;
          }
        }
        function pad2(n) {
          return (n < 10 ? "0" : "") + n;
        }
        function formatDateTime(ts) {
          var d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
          return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
        }
        function buildHeader(history) {
          var h = history || {};
          var tokens = typeof h.tokens === "number" ? h.tokens : 0;
          var limit = typeof h.limit === "number" ? h.limit : 0;
          var percent = typeof h.percent === "number" ? h.percent : 0;
          var platform = SITE_LABELS[h.site] || h.site || "AI Chat";
          var html = '<div class="doc-header">';
          html += "<h1>" + escapeText(aiCmI18nMessage("print_doc_title", "AI Context Monitor \u2014 \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0434\u0438\u0430\u043B\u043E\u0433\u0430")) + "</h1>";
          html += '<div class="doc-meta">';
          html += "<b>" + escapeText(aiCmI18nMessage("print_meta_platform", "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430:")) + "</b> " + escapeText(platform) + "<br>";
          html += "<b>" + escapeText(aiCmI18nMessage("print_meta_model", "\u041C\u043E\u0434\u0435\u043B\u044C:")) + "</b> " + escapeText(h.model || "\u2014") + "<br>";
          html += "<b>" + escapeText(aiCmI18nMessage("print_meta_date", "\u0414\u0430\u0442\u0430:")) + "</b> " + escapeText(formatDateTime(h.updatedAt)) + "<br>";
          html += "<b>" + escapeText(aiCmI18nMessage("print_meta_tokens", "\u0422\u043E\u043A\u0435\u043D\u044B:")) + "</b> " + tokens.toLocaleString() + " / " + limit.toLocaleString() + " (" + percent + "%)";
          html += "</div></div>";
          return html;
        }
        function buildMessages(messages) {
          var html = "";
          for (var i = 0; i < messages.length; i++) {
            var msg = messages[i] || {};
            var role = msg.role === "user" ? "user" : "assistant";
            var text = typeof msg.text === "string" ? msg.text : "";
            html += '<div class="msg-block ' + role + '">';
            html += '<div class="msg-role">' + escapeText(role === "user" ? aiCmI18nMessage("print_role_user", "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C") : aiCmI18nMessage("print_role_assistant", "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442")) + "</div>";
            html += '<div class="msg-body">' + renderMarkdown(text) + "</div>";
            html += "</div>";
          }
          return html;
        }
        function render(history) {
          var messages = history && Array.isArray(history.messages) ? history.messages : [];
          var header = buildHeader(history);
          var body = messages.length ? buildMessages(messages) : "<p>" + escapeText(aiCmI18nMessage("print_empty_body", "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u043F\u0443\u0441\u0442\u0430: \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u043D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0438.")) + "</p>";
          return header + body;
        }
        function escapeText(s) {
          var md = typeof window.MarkdownRenderer !== "undefined" && window.MarkdownRenderer ? window.MarkdownRenderer : null;
          if (md && md.escapeHtml) return md.escapeHtml(s);
          return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function renderMarkdown(text) {
          var md = typeof window.MarkdownRenderer !== "undefined" && window.MarkdownRenderer ? window.MarkdownRenderer : null;
          if (md && md.render) return md.render(text);
          return escapeText(text);
        }
        function showEmpty() {
          printDiag("print-pdf-empty", { reason: "history-not-found" });
          document.getElementById("print-content").innerHTML = "";
          document.getElementById("empty-state").style.display = "block";
        }
        function showContent(history) {
          try {
            var msgsDiag = history && Array.isArray(history.messages) ? history.messages : [];
            var partsDiag = [];
            for (var miDiag = 0; miDiag < msgsDiag.length; miDiag++) {
              partsDiag.push(msgsDiag[miDiag] && msgsDiag[miDiag].text || "");
            }
            diagBaseHead = partsDiag.join("\n");
            diagBaseConvId = history && history.convId || "";
            diagBaseSite = history && history.site || "";
            diagBaseMsgs = msgsDiag.length;
            printDiag("print-render", { reason: "form-rendered" });
          } catch (eDiagShow) {
            diagBaseHead = "";
            diagBaseConvId = "";
            diagBaseSite = "";
            diagBaseMsgs = 0;
          }
          document.getElementById("empty-state").style.display = "none";
          document.getElementById("print-content").innerHTML = render(history);
        }
        function waitForRenderer(cb) {
          if (typeof window.MarkdownRenderer !== "undefined" && window.MarkdownRenderer) {
            cb();
            return;
          }
          setTimeout(function() {
            waitForRenderer(cb);
          }, 30);
        }
        function scheduleClosePrintTab() {
          var sent = false;
          function send() {
            if (sent) return;
            sent = true;
            try {
              chrome.runtime.sendMessage({ type: "close-print-tab" });
            } catch (e) {
              printDiag("catch:print", { err: String(e) });
            }
          }
          window.addEventListener("afterprint", send);
          setTimeout(send, 2e3);
        }
        var PRINT_TITLE_FALLBACK = "AI Context Monitor \u2014 \u043F\u0435\u0447\u0430\u0442\u043D\u0430\u044F \u0444\u043E\u0440\u043C\u0430";
        var printInvoked = false;
        var diagBaseHead = "";
        var diagBaseConvId = "";
        var diagBaseSite = "";
        var diagBaseMsgs = 0;
        function printDiagOn() {
          try {
            if (typeof sessionStorage !== "undefined" && sessionStorage && sessionStorage.getItem("aiCmDebug") === "1") return true;
          } catch (eSess) {
            return false;
          }
          try {
            if (typeof window !== "undefined" && window && window.__aiCmDebugLogs === true) return true;
          } catch (eWin) {
            return false;
          }
          return false;
        }
        function printDiagStack() {
          try {
            var lines = String(new Error().stack || "").split("\n");
            var out = [];
            for (var i = 1; i < lines.length && out.length < 4; i++) {
              var s = String(lines[i] || "").replace(/\s+/g, " ").trim();
              if (!s || s.indexOf("printDiag") !== -1) continue;
              out.push(s);
            }
            return out.join(" <- ");
          } catch (eStack) {
            return "";
          }
        }
        function printDiag(trigger, extra) {
          if (!printDiagOn()) return false;
          try {
            var url = "";
            try {
              url = String(typeof location !== "undefined" && location && location.href || "");
            } catch (eUrl) {
              url = "";
            }
            var title = "";
            try {
              title = String(document.title || "");
            } catch (eTitle) {
              title = "";
            }
            var head = String(diagBaseHead || "").replace(/\s+/g, " ").trim();
            if (head.length > 100) head = head.slice(0, 100) + "\u2026";
            console.log("[AI CM][diag] download trigger=" + trigger + " file=" + (title || "\u043F\u0443\u0441\u0442\u043E\u0435") + " bytes100=" + (head || "(\u043F\u0443\u0441\u0442\u043E)") + " len=" + String(diagBaseHead || "").length + " url=" + url + " threadId=(\u043D\u0435\u0442) convId=" + (diagBaseConvId || "(\u043D\u0435\u0442)") + " site=" + (diagBaseSite || "") + " msgs=" + diagBaseMsgs + " reason=" + (extra && extra.reason || "") + " src=" + printDiagStack());
          } catch (eDiag) {
            return false;
          }
          return true;
        }
        function ensurePrintTitle() {
          try {
            document.title = aiCmI18nMessage("print_page_title", PRINT_TITLE_FALLBACK);
          } catch (e) {
            document.title = PRINT_TITLE_FALLBACK;
          }
          return document.title;
        }
        function triggerPrint() {
          if (printInvoked) {
            printDiag("print-pdf-suppressed", { reason: "duplicate print suppressed (E-2)" });
            console.log("[AI CM][print] duplicate print suppressed");
            return false;
          }
          printInvoked = true;
          ensurePrintTitle();
          printDiag("print-pdf", { reason: "auto-print (window.print); user saves PDF" });
          scheduleClosePrintTab();
          window.print();
          return true;
        }
        function init() {
          var tabId = getParam("tab");
          if (!tabId) {
            showEmpty();
            return;
          }
          chrome.tabs.get(parseInt(tabId, 10), function(tab) {
            var host = "";
            if (chrome.runtime.lastError) {
              host = "";
            } else if (tab && tab.url) {
              try {
                host = new URL(tab.url).hostname;
              } catch (e) {
                host = "";
              }
            }
            chrome.tabs.sendMessage(parseInt(tabId, 10), { type: "aiCmExportCurrent" }, function(snapResp) {
              var snap = snapResp && snapResp.data ? snapResp.data : null;
              chrome.storage.local.get(["aiCmHistory"], function(data) {
                var history = null;
                var all = data && data.aiCmHistory ? data.aiCmHistory : null;
                if (snap && snap.convId) {
                  history = snap;
                } else if (all && all.messages) {
                  if (!host || all.host === host) history = all;
                }
                if (!history || !history.messages || !history.messages.length) {
                  showEmpty();
                  return;
                }
                showContent(history);
                setTimeout(function() {
                  triggerPrint();
                }, 50);
              });
            });
          });
        }
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", waitForRenderer.bind(null, init));
        } else {
          waitForRenderer(init);
        }
        try {
          window.__aiCmPrintTrigger = triggerPrint;
        } catch (e) {
          console.warn("[AI CM][catch] print:", e);
        }
      })();
    }
  });
  require_print();
})();
//# sourceMappingURL=print.js.map
