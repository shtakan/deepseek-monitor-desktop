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

  // content.js
  var require_content = __commonJS({
    "content.js"(exports, module) {
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
      function debugLog(level) {
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
      var CYRILLIC_CHARS_PER_TOKEN = 3.3;
      var Tokenizer = {
        CYRILLIC_CHARS_PER_TOKEN,
        /**
         * Определяет тип символа.
         */
        _getCharType(char) {
          if (/[а-яёА-ЯЁ]/.test(char)) return "cyrillic";
          if (/[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(char)) return "cjk";
          if (/[a-zA-Z]/.test(char)) return "latin";
          if (/[0-9]/.test(char)) return "digit";
          if (/\s/.test(char)) return "space";
          if (/[.,!?;:()\[\]{}"'«»\-—]/.test(char)) return "punctuation";
          return "other";
        },
        /**
         * Приблизительный подсчёт токенов в тексте.
         * @param {string} text - текст для оценки
         * @returns {number} - приблизительное количество токенов
         */
        countTokens(text) {
          if (!text || text.length === 0) return 0;
          let tokens = 0;
          let i = 0;
          while (i < text.length) {
            const char = text[i];
            const type = this._getCharType(char);
            if (type === "space") {
              i++;
              continue;
            }
            if (type === "cyrillic") {
              let cyrillicCount = 0;
              while (i < text.length && this._getCharType(text[i]) === "cyrillic") {
                cyrillicCount++;
                i++;
              }
              tokens += cyrillicCount / CYRILLIC_CHARS_PER_TOKEN;
              continue;
            }
            if (type === "cjk") {
              let cjkCount = 0;
              while (i < text.length && this._getCharType(text[i]) === "cjk") {
                cjkCount++;
                i++;
              }
              tokens += Math.ceil(cjkCount / 1.8);
              continue;
            }
            if (type === "latin") {
              let latinCount = 0;
              while (i < text.length && this._getCharType(text[i]) === "latin") {
                latinCount++;
                i++;
              }
              tokens += Math.ceil(latinCount / 4);
              continue;
            }
            if (type === "digit") {
              let digitCount = 0;
              while (i < text.length && this._getCharType(text[i]) === "digit") {
                digitCount++;
                i++;
              }
              tokens += Math.ceil(digitCount / 3);
              continue;
            }
            if (type === "punctuation") {
              tokens += 0.43;
              i++;
              continue;
            }
            tokens += 1;
            i++;
          }
          return Math.ceil(tokens);
        },
        // countTokensFast удалён в v1.1 — дублировал логику countTokens и не вызывался нигде.
        /**
         * Оценивает токены в диалоге с учётом структуры чата.
         * Учитывает накладные расходы на форматирование сообщений.
         * @param {string} dialogText - полный текст диалога
         * @param {number} messageCount - количество сообщений
         * @returns {number}
         */
        estimateDialogTokens(dialogText, messageCount = 1) {
          const textTokens = this.countTokens(dialogText);
          const overhead = messageCount * 4;
          return textTokens + overhead;
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = Tokenizer;
      }
      var ModelConfig = {
        EFFECTIVE_CAP_DEFAULT: 128e3,
        models: {
          // ---- OpenAI: текущая линейка 2026-10 ----
          // Окна взяты с официальной страницы моделей OpenAI (platform.openai.com/docs/models).
          // ВАЖНО: ChatGPT ВЕБ не документирует своё окно отдельной строкой — порог бейджа
          // для ChatGPT остаётся общим (128000), capExempt не выставляем: лимит 1 050 000
          // подтверждён для API, но веб-продукт его не заявляет (см. описание gpt-5.5).
          "gpt-5.6-sol": {
            name: "GPT-5.6 Sol",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-5.6 Sol \u2014 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u0442\u043A\u0430 GPT-5.6, \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-5.6-luna": {
            name: "GPT-5.6 Luna",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-5.6 Luna \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-5.6-terra": {
            name: "GPT-5.6 Terra",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-5.6 Terra \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-6-astra": {
            name: "GPT-6 Astra",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-6 Astra \u2014 \u0444\u043B\u0430\u0433\u043C\u0430\u043D GPT-6, \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-6.1-sol": {
            name: "GPT-6.1 Sol",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-6.1 Sol \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-6-sol": {
            name: "GPT-6 Sol",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-6 Sol \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-5.5": {
            name: "GPT-5.5",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D OpenAI 2026 (\u043E\u043A\u043D\u043E 1 050 000 \u0432 API; \u043F\u043E\u0440\u043E\u0433 \u0431\u0435\u0439\u0434\u0436\u0430 \u0432 ChatGPT \u2014 128000, capExempt \u043D\u0435 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C: \u0432\u0435\u0431-\u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u043E\u043A\u043D\u043E \u043D\u0435 \u0437\u0430\u044F\u0432\u043B\u044F\u0435\u0442)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-5.5-pro": {
            name: "GPT-5.5 Pro",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-5.5 Pro \u2014 \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          // ЖИВАЯ ПРИЁМКА 2026-10-04 (chatgpt.com, бесплатный аккаунт): сеть отдаёт
          // raw="gpt-5-6" → resolveModelId даёт префиксное совпадение с 'gpt-5'
          // (см. [model-detect] в консоли). Поэтому у GPT-5.6 нужен ОТДЕЛЬНЫЙ ключ 'gpt-5-6'.
          "gpt-5-6": {
            name: "GPT-5.6",
            provider: "OpenAI",
            contextLimit: 105e4,
            description: "GPT-5.6 \u2014 slug \u0438\u0437 \u0441\u0435\u0442\u0438 ChatGPT (gpt-5-6), \u043E\u043A\u043D\u043E 1 050 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-5": {
            name: "GPT-5",
            provider: "OpenAI",
            contextLimit: 4e5,
            description: "\u041B\u0438\u043D\u0435\u0439\u043A\u0430 GPT-5, \u043E\u043A\u043D\u043E 400 000 (API)"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-4.1": {
            name: "GPT-4.1",
            provider: "OpenAI",
            contextLimit: 1047576,
            description: "GPT-4.1, \u043E\u043A\u043D\u043E 1 047 576"
            // Источник: https://platform.openai.com/docs/models (снят 2026-10-04)
          },
          "gpt-4o": {
            name: "GPT-4o",
            provider: "OpenAI",
            contextLimit: 128e3,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C OpenAI"
          },
          "gpt-4o-mini": {
            name: "GPT-4o Mini",
            provider: "OpenAI",
            contextLimit: 128e3,
            description: "\u041E\u0431\u043B\u0435\u0433\u0447\u0451\u043D\u043D\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F GPT-4o"
          },
          "gpt-4-turbo": {
            name: "GPT-4 Turbo",
            provider: "OpenAI",
            contextLimit: 128e3,
            description: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0444\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C"
          },
          "gpt-4": {
            name: "GPT-4",
            provider: "OpenAI",
            contextLimit: 8192,
            description: "\u0411\u0430\u0437\u043E\u0432\u0430\u044F GPT-4"
          },
          "gpt-3.5-turbo": {
            name: "GPT-3.5 Turbo",
            provider: "OpenAI",
            contextLimit: 16385,
            description: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u043F\u043E\u043A\u043E\u043B\u0435\u043D\u0438\u0435"
          },
          // ---- Gemini: канонические ключи (дефолты/шапка) ----
          "gemini-2.5-pro": {
            name: "Gemini 2.5 Pro",
            provider: "Google",
            contextLimit: 1048576,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"
          },
          "gemini-2.5-flash": {
            name: "Gemini 2.5 Flash",
            provider: "Google",
            contextLimit: 1048576,
            description: "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"
          },
          // gemini-1.5-pro: официальная страница модели снята с docs (404, модель выведена из
          // эксплуатации) — цифру 2 097 152 подтвердить нечем, оставлена как есть (её пинят
          // tests/popup-overrides-display.test.js:106,241). Порог бейджа от неё не зависит.
          "gemini-1.5-pro": {
            name: "Gemini 1.5 Pro",
            provider: "Google",
            contextLimit: 2097152,
            description: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0444\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C. \u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043C\u043E\u0434\u0435\u043B\u0438 \u0441\u043D\u044F\u0442\u0430 (404), \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 2 097 152 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442\u0441\u044F \u2014 \u044D\u0442\u043E \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u043F\u0440\u0435\u0436\u043D\u0435\u0439 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438"
            // Источник (снят 2026-10-04): https://ai.google.dev/gemini-api/docs/models → 404 для gemini-1.5-pro
          },
          // ---- Gemini 3.x: канонические ключи живой линейки веб-UI ----
          // ЖИВАЯ ПРИЁМКА 2026-10-04 (gemini.google.com, меню режимов): в вебе есть ровно
          // 3.5 Flash-Lite, 3.6 Flash, 3.1 Pro — никакого «Ultra». API-окно у всех 1 048 576.
          // Окно ВЕБА у Gemini зависит от ТАРИФА, а не от модели: 32K Free / 128K AI Plus /
          // 1M AI Pro и Ultra. Тариф расширение не видит, поэтому порог бейджа для
          // Pro-семейства оставлен 128000 (окно тарифа AI Plus), capExempt НЕ выставляем:
          // на младших тарифах веб режет, послабление было бы враньём.
          "gemini-3.1-pro": {
            name: "Gemini 3.1 Pro",
            provider: "Google",
            contextLimit: 128e3,
            description: "Gemini 3.1 Pro. API-\u043E\u043A\u043D\u043E 1 048 576; \u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u0442\u0430\u0440\u0438\u0444\u0430 (32K Free / 128K AI Plus / 1M AI Pro), \u0432 \u043A\u043E\u043D\u0444\u0438\u0433\u0435 128000 = \u0442\u0430\u0440\u0438\u0444 AI Plus"
            // Источник API: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
            // Источник тарифов веба: https://support.google.com/gemini/answer/16275805 (снят 2026-10-04)
          },
          "gemini-3.6-flash": {
            name: "Gemini 3.6 Flash",
            provider: "Google",
            contextLimit: 1048576,
            description: "Gemini 3.6 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"
            // Источник: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
            // Источник тарифов веба: https://support.google.com/gemini/answer/16275805 (снят 2026-10-04)
          },
          "gemini-3.5-flash": {
            name: "Gemini 3.5 Flash",
            provider: "Google",
            contextLimit: 1048576,
            description: "Gemini 3.5 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"
            // Источник: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
            // Источник тарифов веба: https://support.google.com/gemini/answer/16275805 (снят 2026-10-04)
          },
          "gemini-3.5-flash-lite": {
            name: "Gemini 3.5 Flash Lite",
            provider: "Google",
            contextLimit: 1048576,
            description: "Gemini 3.5 Flash Lite \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"
            // Источник: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
            // Источник тарифов веба: https://support.google.com/gemini/answer/16275805 (снят 2026-10-04)
          },
          "gemini-3-flash": {
            name: "Gemini 3 Flash",
            provider: "Google",
            contextLimit: 1048576,
            description: "Gemini 3 Flash \u2014 API-\u043E\u043A\u043D\u043E 1 048 576 (\u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443)"
            // Источник: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
            // Источник тарифов веба: https://support.google.com/gemini/answer/16275805 (снят 2026-10-04)
          },
          // v1.26: дефолт GSA, когда slug из сети не определён. «1.5 Pro» не выдумываем.
          // 2026-10: дефолтная модель AI Mode — Gemini 3.5 Flash (официальный блог 2026-05-19),
          // поэтому 2 097 152 (остаток от 1.5 Pro) заменено на её реальное окно 1 048 576.
          // Порог бейджа НЕ меняется: min(1048576, EFFECTIVE_CAP_DEFAULT) = 128000, как и было.
          "gemini-search-default": {
            name: "Gemini (Search AI)",
            provider: "Google",
            contextLimit: 1048576,
            description: "Google Search AI: slug \u0438\u0437 \u0441\u0435\u0442\u0438 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D \u2192 \u0434\u0435\u0444\u043E\u043B\u0442\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C AI Mode. \u0421\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u043E\u043A\u043D\u043E AI Mode \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u041D\u0415 \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D\u043E, \u0441\u0442\u043E\u0438\u0442 \u043E\u043A\u043D\u043E Gemini 3.5 Flash \u043A\u0430\u043A \u043F\u0440\u043E\u043A\u0441\u0438"
            // Источник дефолтной модели: https://blog.google/products/search/ai-mode/ (снят 2026-10-04)
            // Источник окна: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
          },
          // ---- DeepSeek ----
          // Источник окон — таблица API https://api-docs.deepseek.com/quick_start/pricing
          // (колонка CONTEXT LENGTH). Актуальная V4-линейка: 1M токенов.
          // V3/R1: 128K — V3 подняли с 64K до 128K ещё в ветке V3
          // (https://api-docs.deepseek.com/zh-cn/news/news250325/), поэтому прежние 65536
          // были устаревшим полом, а не реальным окном.
          // Порог деградации при этом НЕ меняется: EFFECTIVE_CAP_DEFAULT = 128000, и
          // getEffectiveLimit() для V4 вернёт min(1000000, 128000) = 128000. contextLimit
          // двигает только формальное окно, бейдж по-прежнему считает от порога.
          "deepseek-v4-pro": {
            name: "DeepSeek V4 Pro",
            provider: "DeepSeek",
            contextLimit: 1e6,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D DeepSeek V4, \u043E\u043A\u043D\u043E 1M (API)"
          },
          "deepseek-flash": {
            name: "DeepSeek Flash",
            provider: "DeepSeek",
            contextLimit: 1e6,
            description: "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C DeepSeek V4, \u043E\u043A\u043D\u043E 1M (API)"
          },
          // v13 (2026-10-03): unified Intelligent Mode веб-версии DeepSeek. Имя модели в сети не
          // передаётся (model:"", model_type:"default", settings name:"Instant") — см.
          // core/deepseek-intercept.js resolveNetworkModelSlug(). Бейдж обязан считать от РЕАЛЬНОГО
          // окна 1M, поэтому ключ помечен capExempt: общий порог EFFECTIVE_CAP_DEFAULT = 128000
          // к нему не применяется (для остальных ключей поведение неизменно).
          "deepseek-v4.1-flash": {
            name: "DeepSeek V4.1 Flash",
            provider: "DeepSeek",
            contextLimit: 1e6,
            capExempt: true,
            description: "DeepSeek V4.1 Flash (unified Intelligent Mode), \u043E\u043A\u043D\u043E 1M"
          },
          "deepseek-v3": {
            name: "DeepSeek V3",
            provider: "DeepSeek",
            contextLimit: 128e3,
            description: "DeepSeek V3, \u043E\u043A\u043D\u043E 128K (API)"
          },
          "deepseek-r1": {
            name: "DeepSeek R1",
            provider: "DeepSeek",
            contextLimit: 128e3,
            description: "DeepSeek R1, \u0443\u0441\u0438\u043B\u0435\u043D\u043D\u044B\u0439 reasoning, \u043E\u043A\u043D\u043E 128K (API)"
          },
          // ---- Claude: окна веб-продукта по официальной таблице support.claude.com ----
          // Источники (оба сняты 2026-10-04):
          //   API-окна:  https://platform.claude.com/docs/en/models/overview
          //   Окна веб-продукта (таблица по тарифам): https://support.claude.com/en/articles/8606394
          // В вебе 1M у Fable 5.1 / Opus 5.5 / Opus 5 / Sonnet 5.5 / Sonnet 5; 500K у
          // Fable 5 / Opus 4.8 / 4.7 / 4.6 / Sonnet 4.6; 200K у всего остального (в т.ч. Haiku 4.5).
          // capExempt — только там, где веб реально отдаёт 1M: в чате можно загрузить 500K+,
          // иначе (500K — меньше 500K+? нет: 500K = 500 000, но порог бейджа 128000) —
          // у 500K-моделей веб-окно заявлено, значит capExempt:true; у 200K — потолок EFFECTIVE_CAP_DEFAULT.
          // РЕШЕНИЕ: capExempt:true у всех моделей с веб-окном > 128000 — веб-версия не режет.
          "claude-sonnet-5-5": {
            name: "Claude Sonnet 5.5",
            provider: "Anthropic",
            contextLimit: 1e6,
            capExempt: true,
            description: "Claude Sonnet 5.5 (claude-sonnet-5-5) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"
            // Источник: https://platform.claude.com/docs/en/models/overview (снят 2026-10-04)
            // Источник веб-окна: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-opus-5-5": {
            name: "Claude Opus 5.5",
            provider: "Anthropic",
            contextLimit: 1e6,
            capExempt: true,
            description: "Claude Opus 5.5 (claude-opus-5-5) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"
            // Источник: https://platform.claude.com/docs/en/models/overview (снят 2026-10-04)
            // Источник веб-окна: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-fable-5-1": {
            name: "Claude Fable 5.1",
            provider: "Anthropic",
            contextLimit: 1e6,
            capExempt: true,
            description: "Claude Fable 5.1 (claude-fable-5-1) \u2014 \u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435"
            // Источник: https://platform.claude.com/docs/en/models/overview (снят 2026-10-04)
            // Источник веб-окна: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-opus-5": {
            name: "Claude Opus 5",
            provider: "Anthropic",
            contextLimit: 1e6,
            capExempt: true,
            description: "Claude Opus 5 (\u0431\u0435\u0437 \u043C\u0438\u043D\u043E\u0440\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0438) \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M"
            // Источник: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-opus-4-8": {
            name: "Claude Opus 4.8",
            provider: "Anthropic",
            contextLimit: 5e5,
            capExempt: true,
            description: "Claude Opus 4.8 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"
            // Источник: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-opus-4-7": {
            name: "Claude Opus 4.7",
            provider: "Anthropic",
            contextLimit: 5e5,
            capExempt: true,
            description: "Claude Opus 4.7 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"
            // Источник: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          // ЖИВАЯ ПРИЁМКА 2026-10-04 (claude.ai): сеть отдаёт raw="claude-sonnet-5-5".
          // Без этого ключа resolveModelId даёт префиксное совпадение с 'claude-sonnet-5'.
          "claude-sonnet-5": {
            name: "Claude Sonnet 5",
            provider: "Anthropic",
            contextLimit: 1e6,
            capExempt: true,
            description: "Claude Sonnet 5 (\u043E\u043A\u043D\u043E 1M \u0432 API \u0438 \u0432 \u0432\u0435\u0431-\u0447\u0430\u0442\u0435)"
            // Источник: https://platform.claude.com/docs/en/models/overview (снят 2026-10-04)
            // Источник веб-окна: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-sonnet-4-6": {
            name: "Claude Sonnet 4.6",
            provider: "Anthropic",
            contextLimit: 5e5,
            capExempt: true,
            description: "Claude Sonnet 4.6 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"
            // Источник: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-sonnet-4-5": {
            name: "Claude Sonnet 4.5",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude Sonnet 4.5 (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-opus-4-6": {
            name: "Claude Opus 4.6",
            provider: "Anthropic",
            contextLimit: 5e5,
            capExempt: true,
            description: "Claude Opus 4.6 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 500K"
            // Источник: https://support.claude.com/en/articles/8606394 (снят 2026-10-04)
          },
          "claude-opus-4-5": {
            name: "Claude Opus 4.5",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude Opus 4.5 (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-haiku-4-5": {
            name: "Claude Haiku 4.5",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude Haiku 4.5 \u2014 \u0432\u0435\u0431-\u043E\u043A\u043D\u043E \u0438 API-\u043E\u043A\u043D\u043E 200K"
            // Источник: https://platform.claude.com/docs/en/models/overview (снят 2026-10-04)
          },
          "claude-3-5-sonnet": {
            name: "Claude 3.5 Sonnet",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude 3.5 Sonnet (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-3-5-haiku": {
            name: "Claude 3.5 Haiku",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude 3.5 Haiku (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-3-opus": {
            name: "Claude 3 Opus",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude 3 Opus (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-3-haiku": {
            name: "Claude 3 Haiku",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude 3 Haiku (\u043E\u043A\u043D\u043E 200K)"
          },
          "claude-3-sonnet": {
            name: "Claude 3 Sonnet",
            provider: "Anthropic",
            contextLimit: 2e5,
            description: "Claude 3 Sonnet (\u043E\u043A\u043D\u043E 200K)"
          },
          // ---- Perplexity ----
          // ЖИВАЯ ПРИЁМКА 2026-10-04 (perplexity.ai, аккаунт «Бесплатный план»): в меню моделей
          // НИ ОДНОЙ Sonar-модели нет, все 10 позиций — сторонние модели под paywall
          // «Получите доступ к лучшим моделям ИИ». Официального окна Perplexity для веба
          // найти НЕ удалось (help-center не публикует числа) → contextLimit оставлены прежними.
          "turbo": {
            name: "Perplexity Sonar (turbo)",
            provider: "Perplexity",
            contextLimit: 128e3,
            description: "Perplexity Sonar (turbo), \u043E\u043A\u043D\u043E 128K. \u0423\u0421\u0422\u0410\u0420\u0415\u041B\u041E: \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442 \u0432 \u0432\u0435\u0431-UI \u0441 2026-09 (Sonar Chat Completions \u0437\u0430\u043A\u0440\u044B\u0442 2026-09-27); \u043A\u043B\u044E\u0447 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u044B\u0445 \u0442\u0440\u0435\u0434\u043E\u0432 \u0438 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0430"
            // Источник: https://docs.perplexity.ai/getting-started/models (снят 2026-10-04)
          },
          "sonar": {
            name: "Perplexity Sonar",
            provider: "Perplexity",
            contextLimit: 128e3,
            description: "Perplexity Sonar, \u043E\u043A\u043D\u043E 128K"
          },
          "sonar-pro": {
            name: "Perplexity Sonar Pro",
            provider: "Perplexity",
            contextLimit: 2e5,
            description: "Perplexity Sonar Pro, \u043E\u043A\u043D\u043E 200K"
          },
          "sonar-reasoning": {
            name: "Perplexity Sonar Reasoning",
            provider: "Perplexity",
            contextLimit: 128e3,
            description: "Perplexity Sonar Reasoning, \u043E\u043A\u043D\u043E 128K"
          },
          "sonar-deep-research": {
            name: "Perplexity Sonar Deep Research",
            provider: "Perplexity",
            contextLimit: 2e5,
            description: "Perplexity Sonar Deep Research, \u043E\u043A\u043D\u043E 200K"
          },
          // ---- Qwen (O-35) ----
          // ГИПОТЕЗА ЗАКРЫТА ЖИВОЙ ПРИЁМКОЙ 2026-10-04 (chat.qwen.ai, GET /api/models, первый источник):
          //   qwen3.7-plus 1000000 · qwen3.8-max 1000000 · qwen3.8-omni-flash 1000000 ·
          //   qwen3.7-max 1000000 · qwen3.6-plus 1000000 · qwen3.5-plus 1000000 ·
          //   qwen3.5-omni-plus 262144  (поле info.meta.max_context_length — это контракт САМОГО ВЕБА,
          //   не API; значит порог 128000 резал реальный лимит, capExempt обоснован).
          // Раньше стоял «128K — HYPOTHESIS» (тесты qwen-provider-wiring.test.js:152-163 закрепляли
          // именно гипотезу) — расхождение зафиксировано в PROJECT_HANDOFF.md, тесты не правились.
          // ТЕХДОЛГ (закрыт здесь): ключ был РОВНО ОДИН. Слаг веб-модели, которого в таблице нет,
          // resolveModelId НЕ распознаёт — точного совпадения нет, а префиксного/подстрочного быть
          // не может ('qwen3.8-max' не префикс и не подстрока 'qwen3.7-plus'). Итог: сигнал есть,
          // id = null → resolveCurrentModel (core/content.js:1454) падает в siteDefaults.qwen, и в
          // виджете чужое имя модели (работал только фолбэк «сети нет»). Поэтому каждая актуальная
          // веб-модель получает СВОЙ точный слаг-ключ — тем же приёмом, что 'gpt-5-6' для GPT-5.6
          // (см. комментарий выше) и 'claude-sonnet-5-5' для Claude 5.5.
          // Приоритет точного ключа (resolveModelId шаг 1) снимает и риск, ради которого ключи
          // заводились у OpenAI/Anthropic: нормализация точек/подчёркиваний в дефис делает
          // 'qwen3.7-plus' === 'qwen3.7_plus' === ярлык DOM 'Qwen3.7-Plus'.
          "qwen3.7-plus": {
            name: "Qwen3.7-Plus",
            provider: "Qwen",
            contextLimit: 1e6,
            capExempt: true,
            description: "\u0410\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Qwen (chat.qwen.ai), \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M \u2014 \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0415\u041D\u041E \u0416\u0418\u0412\u042B\u041C /api/models 2026-10-04"
            // Источник: https://chat.qwen.ai/api/models (снят 2026-10-04) — первая строка списка
            // веб-моделей с info.meta.max_context_length = 1000000 (контракт самого веба, не API).
          },
          "qwen3.8-max": {
            name: "Qwen3.8-Max",
            provider: "Qwen",
            contextLimit: 1e6,
            capExempt: true,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Qwen (chat.qwen.ai), \u0432\u0435\u0431-\u043E\u043A\u043D\u043E 1M \u2014 \u041F\u041E\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0415\u041D\u041E \u0416\u0418\u0412\u042B\u041C /api/models 2026-10-04 (\u0431\u044B\u043B\u043E: 128K HYPOTHESIS)"
            // Источник: https://chat.qwen.ai/api/models (снят 2026-10-04)
            // Источник API-стороны: https://help.aliyun.com/en/model-studio/qwen3-8-max (снят 2026-10-04)
          },
          // ---- Gemini: строковые ключи (на случай, если детектор даст имя с префиксом/капсом) ----
          "Gemini 2.5 Pro": {
            name: "Gemini 2.5 Pro",
            provider: "Google",
            contextLimit: 1048576,
            description: "\u0424\u043B\u0430\u0433\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"
          },
          "Gemini 2.5 Flash": {
            name: "Gemini 2.5 Flash",
            provider: "Google",
            contextLimit: 1048576,
            description: "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C Google"
          }
        },
        siteDefaults: {
          "chatgpt": "gpt-5.5",
          "gemini": "gemini-2.5-flash",
          "aistudio": "gemini-2.5-pro",
          "google_search": "gemini-search-default",
          "deepseek": "deepseek-v3",
          "claude": "claude-sonnet-4-6",
          "perplexity": "turbo",
          "qwen": "qwen3.7-plus"
        },
        // v49: реальные семейные дефолты веб-UI Gemini (кнопка button.input-area-switch
        // не несёт номера версии). Пункт (c) приоритета DOM-сигнала — когда ни кэш меню,
        // ни сетевая версия с совпадающей семьёй не дали точной версии.
        // Окна сверены с записями таблицы: Pro=128_000, Flash/Flash-Lite=1_048_576.
        familyDefaults: {
          "pro": { modelId: "3.1 Pro", contextLimit: 128e3 },
          "pro-lite": { modelId: "3.1 Pro", contextLimit: 128e3 },
          "flash": { modelId: "3.6 Flash", contextLimit: 1048576 },
          "flash-lite": { modelId: "3.5 Flash Lite", contextLimit: 1048576 },
          // 'ultra': ЖИВАЯ ПРИЁМКА 2026-10-04 (gemini.google.com, меню режимов) — в веб-UI
          // никакой «3.1 Ultra» НЕТ (только 3.5 Flash-Lite / 3.6 Flash / 3.1 Pro), запись была
          // выдумана прежней авто-генерацией. Запись оставлена как страховка: ветка (c) в
          // core/content.js вызывается только когда ни кэш меню, ни снимок сети не дали версии,
          // и на текущем UI не срабатывает. Окно 1 048 576 = API-окно Gemini 3.x.
          // Источник: https://ai.google.dev/gemini-api/docs/models (снят 2026-10-04)
          "ultra": { modelId: "3.1 Ultra", contextLimit: 1048576 }
        },
        getModel(modelId) {
          return this.models[modelId] || null;
        },
        getDefaultModel(site) {
          return this.siteDefaults[site] || "gpt-5.5";
        },
        getContextLimit(modelId) {
          const model = this.getModel(modelId);
          return model ? model.contextLimit : 128e3;
        },
        /**
         * Действующий порог деградации бейджа для модели.
         * Приоритет: `capExempt` (реальное окно без общего потолка) →
         * `min(contextLimit, EFFECTIVE_CAP_DEFAULT)`.
         * Ветка явного `model.effectiveLimit` удалена в v20: поле было публичным, но не
         * носило ни одного ключа модели, ни одного теста, ни одного конфига и не могло
         * прийти извне (см. аппендикс v20 — инвентаризация).
         * @param {string} modelId
         * @returns {number}
         */
        getEffectiveLimit(modelId) {
          const model = this.getModel(modelId);
          if (!model) return this.EFFECTIVE_CAP_DEFAULT;
          if (model.capExempt === true) return model.contextLimit;
          return Math.min(model.contextLimit, this.EFFECTIVE_CAP_DEFAULT);
        },
        // ---- H19: оверрайды попапа (chrome.storage.sync: selectedModel / customLimit) ----
        // Явный выбор модели в дропдауне авторитетен для лимита и токенизации.
        // 'auto'/пусто/неизвестный id → null = «Автоопределение» (прежний путь: сетевой slug →
        // DOM-сигнал → дефолт сайта), поведение байтово прежнее.
        resolvePopupModelId(raw) {
          if (raw == null) return null;
          const s = String(raw).trim();
          if (!s || s.toLowerCase() === "auto") return null;
          const id = this.resolveModelId(s);
          return id && this.models[id] ? id : null;
        },
        // Поле «Лимит контекста» = % от Авто-порога. Пусто/null → null (Авто).
        // Вне 1–100 (2000, 0, мусор) → фолбэк 100 = как Авто.
        resolveLimitPct(raw) {
          if (raw == null) return null;
          const s = String(raw).trim();
          if (!s) return null;
          const n = Number(s);
          if (!isFinite(n) || n < 1 || n > 100) return 100;
          return n;
        },
        // displayLimit = Авто-порог × pct/100 (округление 1:1 с прежним виджетом).
        // pct не задан → Авто-порог байтово.
        applyLimitPct(effectiveLimit, pct) {
          if (typeof pct !== "number" || !(pct > 0)) return effectiveLimit;
          return Math.max(1, Math.round(pct / 100 * effectiveLimit));
        },
        computeDisplayLimit(modelId, pct) {
          return this.applyLimitPct(this.getEffectiveLimit(modelId), pct);
        },
        // v49: канонический ключ по семье(±варианту) без номера версии (DOM-сигнал v48).
        // variant нормируется: «Расширенный»/«Расширенная»/«Расширенн…» → «pro/…-расширенный»? нет:
        // вариант влияет только при выборе подходящего семейного дефолта (flash-lite vs flash).
        // Окно возвращаемой модели уже лежит в записи таблицы (см. переопределения ниже).
        getFamilyDefaultModelId(fam, variant) {
          const famK = String(fam || "").toLowerCase().replace(/[^a-z]/g, "");
          const varK = String(variant || "").toLowerCase();
          const isLite = /lite/.test(varK);
          const isExtension = /расширенн|extended|fast/.test(varK);
          const group = famK + (isLite ? "-lite" : "");
          const d = this.familyDefaults[group];
          if (!d) return null;
          return d.modelId;
        },
        // Привести сырое имя/slug к каноническому ключу. Нормализация схлопывает пробелы,
        // подчёркивания И ТОЧКИ в дефис (gpt-5-5 из сети == gpt-5.5; 3.6 Flash Расширенная == ключу).
        resolveModelId(raw) {
          if (!raw) return null;
          const norm = function(s) {
            return String(s).toLowerCase().replace(/[\s_./]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
          };
          const nRaw = norm(raw);
          if (!nRaw) return null;
          const keys = Object.keys(this.models);
          const slugM = /^gemini-([\d.]+)-(flash|pro|ultra)(-lite)?$/i.exec(String(raw).trim());
          const slugLite = !!(slugM && slugM[3]);
          if (slugM && !keys.some(function(k) {
            const nk = norm(k);
            if (!nk || nRaw.indexOf(nk) === -1) return false;
            return slugLite ? /-lite$/.test(nk) : !/-lite$/.test(nk);
          })) {
            const ver = slugM[1];
            const fam = slugM[2].toLowerCase();
            const lite = !!slugM[3];
            const family = fam.charAt(0).toUpperCase() + fam.slice(1) + (lite ? " Lite" : "");
            const key = "gemini-" + ver + "-" + fam + (lite ? "-lite" : "");
            const contextLimit = fam === "pro" ? 128e3 : 1048576;
            this.models[key] = {
              name: "Gemini " + ver + " " + family,
              provider: "Google",
              contextLimit,
              description: "Gemini " + ver + " " + family + " \u2014 \u0430\u0432\u0442\u043E-\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0441\u0435\u0442\u0435\u0432\u043E\u0433\u043E \u0441\u043B\u0430\u0433-\u0430 (\u043E\u043A\u043D\u043E " + contextLimit + ")"
            };
            return key;
          }
          for (let i = 0; i < keys.length; i++) {
            if (norm(keys[i]) === nRaw) return keys[i];
          }
          const byLen = keys.map(function(k) {
            return { k, n: norm(k) };
          }).sort(function(a, b) {
            return b.n.length - a.n.length;
          });
          for (let i = 0; i < byLen.length; i++) {
            if (byLen[i].n && nRaw.indexOf(byLen[i].n) === 0) return byLen[i].k;
          }
          for (let i = 0; i < byLen.length; i++) {
            if (byLen[i].n && nRaw.indexOf(byLen[i].n) !== -1) return byLen[i].k;
          }
          return null;
        },
        calculatePercentage(usedTokens, contextLimit) {
          if (contextLimit <= 0) return 0;
          const percentage = usedTokens / contextLimit * 100;
          return Math.min(100, Math.round(percentage * 10) / 10);
        },
        // Возвращает API-id модели для Google countTokens API.
        // Принимает канонический ключ (gemini-2.5-flash) или необработанный slug.
        // Токенизатор у Gemini общий, поэтому дефолт — стабильная общедоступная модель.
        // 09.2026: семейства 1.5/2.0 целиком 404 в v1beta → дефолт/фолбэк 'gemini-flash-latest'.
        getGeminiApiModelId(modelId) {
          var passthrough = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash"];
          if (passthrough.indexOf(modelId) !== -1) return modelId;
          if (!modelId) return "gemini-flash-latest";
          var map = {
            "gemini-2.5-pro": "gemini-2.5-pro",
            "gemini-2.5-flash": "gemini-2.5-flash",
            "gemini-search-default": "gemini-flash-latest",
            // токенизатор общий, дефолт GSA → стабильная модель
            "gemini-2.5-ultra": "gemini-2.5-ultra"
          };
          if (map[modelId]) return map[modelId];
          if (/^[a-zA-Z0-9.-]+$/.test(modelId) && modelId.indexOf("gemini") !== -1) return modelId;
          return "gemini-flash-latest";
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = ModelConfig;
      }
      (function() {
        var V = ["1.5", "2.0", "2.5", "3.1", "3.5", "3.6", "3.7"];
        var F = ["Flash", "Pro", "Ultra"];
        var S = ["", " Lite", " \u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F", " Extended"];
        function win(v, f) {
          return v === "1.5" && f === "Pro" ? 2097152 : 1048576;
        }
        V.forEach(function(v) {
          F.forEach(function(f) {
            S.forEach(function(s) {
              var key = v + " " + f + s;
              if (!ModelConfig.models[key]) {
                ModelConfig.models[key] = {
                  name: "Gemini " + key,
                  provider: "Google",
                  contextLimit: win(v, f),
                  description: "Gemini (\u0438\u043C\u044F \u0438\u0437 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0442\u0438, \u0430\u0432\u0442\u043E-\u043A\u043B\u044E\u0447)"
                };
              }
            });
          });
        });
      })();
      (function() {
        ["3.1 Pro", "3.5 Pro", "3.6 Pro", "3.7 Pro"].forEach(function(k) {
          var r = ModelConfig.models[k];
          if (r) r.contextLimit = 128e3;
        });
        ["3.6 Flash", "3.5 Flash Lite"].forEach(function(k) {
          var r = ModelConfig.models[k];
          if (r && r.contextLimit !== 1048576) r.contextLimit = 1048576;
        });
      })();
      var BaseAdapter = class {
        constructor() {
          this.siteName = "base";
          this.dialogContainerSelector = "";
          this.userMessageSelector = "";
          this.modelMessageSelector = "";
        }
        /**
         * Проверяет, находимся ли мы на странице диалога этого сайта.
         * @returns {boolean}
         */
        isOnDialogPage() {
          throw new Error("\u041C\u0435\u0442\u043E\u0434 isOnDialogPage() \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D");
        }
        /**
         * Извлекает все сообщения из диалога.
         * @returns {BaseExtractedMessage[]}
         */
        extractMessages() {
          throw new Error("\u041C\u0435\u0442\u043E\u0434 extractMessages() \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D");
        }
        /**
         * Собирает полный текст диалога для оценки токенов.
         * @returns {string}
         */
        getFullDialogText() {
          const messages = this.extractMessages();
          return messages.map((msg) => msg.content).join("\n");
        }
        /**
         * Возвращает количество сообщений в диалоге.
         * @returns {number}
         */
        getMessageCount() {
          return this.extractMessages().length;
        }
        /**
         * Определяет модель ИИ по DOM (если возможно).
         * @returns {string|null} - название модели или null
         */
        detectModel() {
          return null;
        }
        /**
         * Безопасное получение текста из элемента.
         * @param {Element} element
         * @returns {string}
         */
        _getTextContent(element) {
          return element ? element.textContent.trim() : "";
        }
        /**
         * Безопасный querySelector с проверкой.
         * @param {string} selector
         * @param {ParentNode} [parent] - Document по умолчанию
         * @returns {Element|null}
         */
        _safeQuerySelector(selector, parent = document) {
          try {
            return parent.querySelector(selector);
          } catch (e) {
            aiCmDiagWarn("adapter:base:safeQuerySelector", `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0430 "${selector}":`, e);
            return null;
          }
        }
        /**
         * Безопасный querySelectorAll с проверкой.
         * Ветка ошибки возвращает пустой массив, а не NodeList: у NodeList есть .item(),
         * у массива нет (TS2741). Потребители берут только .length и срез в массив
         * (Array.prototype.slice.call в qwen-adapter.js:143), поэтому обе формы годятся.
         * @param {string} selector
         * @param {ParentNode} [parent] - Document по умолчанию
         * @returns {NodeList|Element[]}
         */
        _safeQuerySelectorAll(selector, parent = document) {
          try {
            return parent.querySelectorAll(selector);
          } catch (e) {
            aiCmDiagWarn("adapter:base:safeQuerySelectorAll", `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440\u0430 "${selector}":`, e);
            return [];
          }
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = BaseAdapter;
      }
      var CHATGPT_ANSWER_PREFIX_RE = /^\s*(?:ChatGPT сказал|ChatGPT said|ChatGPT sagte):\s*/;
      var ChatGPTAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "chatgpt";
          this._turnSelectors = ["[data-turn-key]"];
          this._userSelectors = ['[class*="bg-user-message"]', '[class*="text-user-message"]'];
          this._assistantSelectors = ['[class*="block-"]', '[class*="content-"]'];
          this._userRoleMarkers = ["bg-user-message", "text-user-message"];
          this._legacyUserRoleMarkers = ["user-message-bubble-color"];
          this._assistantRoleMarkers = ["markdown", "assistant-message", "model-response"];
          this.allContentSelectors = ".whitespace-pre-wrap, .markdown";
          this._lastTurnStats = { turns: 0, users: 0, assistants: 0, skippedUnknown: 0, looseUsers: 0 };
        }
        /**
         * Есть ли в className узла хоть один из маркеров (подстрока — как в исходной версии:
         * хеш-суффиксы Tailwind являются частью того же класса-токена).
         * @param {string} className
         * @param {string[]} markers
         * @returns {boolean}
         */
        _markerHit(className, markers) {
          const cls = String(className || "");
          if (!cls) return false;
          for (let i = 0; i < markers.length; i++) {
            if (cls.indexOf(markers[i]) !== -1) return true;
          }
          return false;
        }
        /**
         * Несёт ли узел маркер реплики пользователя — сам, на предке до 5 уровней вверх
         * (в исходной версии маркер жил именно на предке) или внутри своего поддерева.
         * Служит и определению роли, и ИСКЛЮЧЕНИЮ обёрток: узел, внутри которого лежит
         * реплика пользователя, ответом быть не может (иначе в ответ попал бы и вопрос).
         * @param {Element} element
         * @returns {boolean}
         */
        _hasUserMarker(element) {
          if (!element) return false;
          if (this._markerHit(element.className, this._userRoleMarkers)) return true;
          if (this._markerHit(element.className, this._legacyUserRoleMarkers)) return true;
          let parent = element.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            if (this._markerHit(parent.className, this._userRoleMarkers)) return true;
            if (this._markerHit(parent.className, this._legacyUserRoleMarkers)) return true;
            parent = parent.parentElement;
          }
          if (element.querySelector && element.querySelector(this._userSelectors.join(", "))) return true;
          return false;
        }
        /**
         * Первая непустая реплика пользователя внутри узла. Кандидаты — по порядку
         * `_userSelectors`: первый непустой набор выигрывает (форма донора qwen-adapter.js).
         * @param {Document|Element} scope
         * @returns {Element|null}
         */
        _firstUserNode(scope) {
          for (let i = 0; i < this._userSelectors.length; i++) {
            const found = scope.querySelectorAll(this._userSelectors[i]);
            for (let j = 0; j < found.length; j++) {
              if (String(found[j].textContent || "").trim()) return found[j];
            }
          }
          return null;
        }
        /**
         * Структурный фолбэк: самый длинный текстовый узел поддерева, не являющийся репликой
         * пользователя и не содержащий её.
         * @param {Element} scope
         * @param {Element|null} userEl
         * @returns {Element|null}
         */
        _longestTextNode(scope, userEl) {
          const nodes = scope.querySelectorAll("*");
          let best = null;
          let bestLen = 0;
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node === userEl) continue;
            if (userEl && node.contains(userEl)) continue;
            if (this._hasUserMarker(node)) continue;
            if (String(node.textContent || "").trim().length <= bestLen) continue;
            const text = this._extractText(node);
            if (text.length > bestLen) {
              best = node;
              bestLen = text.length;
            }
          }
          return best;
        }
        /**
         * Узел ответа внутри хода. Уровень 1 — класс-контейнер ответа ([class*="block-"] /
         * [class*="content-"]) вне реплики пользователя; выигрывает самый ДЛИННЫЙ текст (у
         * Tailwind-классов длина хеш-суффикса меняется, поэтому «первый» кандидат нестабилен).
         * Уровень 2 (структурный) — самый длинный текстовый узел хода ПОСЛЕ реплики; он
         * включается, только если реплика пользователя найдена (иначе роль ответа угадывалась
         * бы длиной, а это тот же дефект, что и нормализация 'unknown' → 'user').
         * @param {Element} turn
         * @param {Element|null} userEl
         * @returns {Element|null}
         */
        _assistantInTurn(turn, userEl) {
          let best = null;
          let bestLen = 0;
          for (let i = 0; i < this._assistantSelectors.length; i++) {
            const found = turn.querySelectorAll(this._assistantSelectors[i]);
            for (let j = 0; j < found.length; j++) {
              const node = found[j];
              if (node === userEl) continue;
              if (this._hasUserMarker(node)) continue;
              if (String(node.textContent || "").trim().length <= bestLen) continue;
              const text = this._extractText(node);
              if (text.length > bestLen) {
                best = node;
                bestLen = text.length;
              }
            }
          }
          if (best) return best;
          if (!userEl) return null;
          return this._longestTextNode(turn, userEl);
        }
        /**
         * Узлы сообщений в порядке чтения — по ОДНОЙ записи с ролью на реплику.
         * Уровни 1-2: для каждого хода [data-turn-key] — user (первая непустая) и assistant.
         * Уровень 3: реплики пользователя БЕЗ хода (хвост/виртуализация), ответ — следующий
         * sibling с непустым текстом. Уровень 4 (легаси, .markdown/pre-wrap) — ПОСЛЕДНИМ и
         * только если живой отбор не дал ничего: на новых сборках он дал бы дубли.
         * Роль 'unknown' в результат НЕ попадает — исходная нормализация 'unknown' → 'user'
         * и была корнем дефекта (ответ записывался в базу как реплика пользователя).
         * @returns {{role: string, element: Element}[]}
         */
        _findMessageElements() {
          const found = [];
          const stats = { turns: 0, users: 0, assistants: 0, skippedUnknown: 0, looseUsers: 0 };
          const turnNodes = document.querySelectorAll(this._turnSelectors[0]);
          for (let i = 0; i < turnNodes.length; i++) {
            const turn = turnNodes[i];
            stats.turns++;
            const userEl = this._firstUserNode(turn);
            if (userEl) {
              found.push({ role: "user", element: userEl });
              stats.users++;
            }
            const assistantEl = this._assistantInTurn(turn, userEl);
            if (assistantEl) {
              found.push({ role: "assistant", element: assistantEl });
              stats.assistants++;
            }
          }
          const userSel = this._userSelectors.join(", ");
          const loose = document.querySelectorAll(userSel);
          for (let i = 0; i < loose.length; i++) {
            const el = loose[i];
            if (el.closest(this._turnSelectors[0])) continue;
            if (el.parentElement && el.parentElement.closest(userSel)) continue;
            found.push({ role: "user", element: el });
            stats.users++;
            stats.looseUsers++;
            let sib = el.nextElementSibling;
            while (sib) {
              if (String(sib.textContent || "").trim()) {
                found.push({ role: "assistant", element: sib });
                stats.assistants++;
                break;
              }
              sib = sib.nextElementSibling;
            }
          }
          if (found.length === 0) {
            const legacy = document.querySelectorAll(this.allContentSelectors);
            for (let i = 0; i < legacy.length; i++) {
              const role = this._detectRole(legacy[i]);
              if (role === "unknown") {
                stats.skippedUnknown++;
                continue;
              }
              found.push({ role, element: legacy[i] });
              if (role === "user") stats.users++;
              else stats.assistants++;
            }
          }
          this._lastTurnStats = stats;
          return found;
        }
        /**
         * Роль узла по классу самого узла и класса предков (до 5 уровней вверх) — ЛЕГАСИ-слой
         * (уровень 4), на живой разметке 2026-10-13 не используется.
         *
         * Возвращаем string, а не литеральный union 'user'|'assistant': пока тип узкий, tsc
         * (TS2367) счёл бы сверку `role === 'unknown'` в extractMessages заведомо ложной, а она —
         * живой детектор дрейфа разметки. TODO: уточнить тип в шаге 5 (контракт ролей адаптера).
         * @param {Element} element
         * @returns {string}
         */
        _detectRole(element) {
          const classAttr = String(element.className || "");
          if (classAttr.indexOf("markdown") !== -1) return "assistant";
          if (this._hasUserMarker(element)) return "user";
          if (this._markerHit(classAttr, this._assistantRoleMarkers)) return "assistant";
          return "unknown";
        }
        /**
         * Текст блочного узла с сохранением переводов строк: границы блочных элементов
         * (p/div/li/…, <br>) становятся `\n`, серии пустых строк схлопываются до одной пары.
         * Заменяет `clone.textContent`, который склеивал абзацы БЕЗ разделителя («первыйвторой»)
         * и тем самым ломал формат многострочного ответа. trim — только на краях результата:
         * значимые переводы строк ВНУТРИ текста сохраняются.
         * @param {Element} root
         * @returns {string}
         */
        _blockText(root) {
          let out = "";
          const BLOCK = {
            P: 1,
            DIV: 1,
            LI: 1,
            TR: 1,
            SECTION: 1,
            ARTICLE: 1,
            HEADER: 1,
            FOOTER: 1,
            MAIN: 1,
            H1: 1,
            H2: 1,
            H3: 1,
            H4: 1,
            H5: 1,
            H6: 1,
            PRE: 1,
            BLOCKQUOTE: 1,
            TABLE: 1,
            UL: 1,
            OL: 1
          };
          const walk = (node) => {
            if (node.nodeType === 3) {
              out += String(node.nodeValue || "");
              return;
            }
            if (node.nodeType !== 1) return;
            const tag = node.tagName;
            if (tag === "BR") {
              out += "\n";
              return;
            }
            const isBlock = BLOCK[tag] === 1;
            if (isBlock && out && out.charAt(out.length - 1) !== "\n") out += "\n";
            const kids = node.childNodes;
            for (let i = 0; i < kids.length; i++) walk(kids[i]);
            if (isBlock && out && out.charAt(out.length - 1) !== "\n") out += "\n";
          };
          walk(root);
          return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        }
        /**
         * Текст хода. markdown-рендер (легаси-разметка) — абзацы построчно. Иначе — клон без
         * кнопок/svg (как в исходной версии) и структурная нормализация блочных границ.
         * @param {Element} element
         * @returns {string}
         */
        _extractText(element) {
          const classAttr = String(element.className || "");
          if (classAttr.indexOf("markdown") !== -1) {
            const paragraphs = element.querySelectorAll("p");
            if (paragraphs.length > 0) {
              const lines = [];
              for (let i = 0; i < paragraphs.length; i++) {
                lines.push(String(paragraphs[i].textContent || "").trim());
              }
              return lines.join("\n").trim();
            }
          }
          const clone = (
            /** @type {Element} */
            element.cloneNode(true)
          );
          clone.querySelectorAll('button, [role="button"], svg').forEach((el) => el.remove());
          return this._blockText(clone);
        }
        /**
         * Ходы диалога из DOM. Роли берутся из структуры хода (turn-based), пустые тексты
         * отбрасываются, а роль 'unknown' (легаси-узел не опознан) ПРОПУСКАЕТСЯ: нормализации
         * 'unknown' → 'user' больше нет — это и был корень дефекта. Диагностика — ТОЛЬКО под
         * гейтом (typeof-гард: в срез-песочницах тестов хелперов гейта может не быть).
         * @returns {ChatGPTExtractedMessage[]}
         */
        extractMessages() {
          const diagOn = typeof aiCmDiagOn === "function" ? aiCmDiagOn() : false;
          const elements = this._findMessageElements();
          const messages = [];
          for (let i = 0; i < elements.length; i++) {
            const role = elements[i].role;
            const content = this._extractText(elements[i].element).replace(CHATGPT_ANSWER_PREFIX_RE, "");
            if (!content || content.length === 0) continue;
            if (role === "unknown") continue;
            messages.push({ role, content });
          }
          if (diagOn && typeof aiCmDiagLine === "function") {
            const stats = this._lastTurnStats;
            aiCmDiagLine("chatgpt-adapter-turn", {
              turns: stats.turns,
              users: stats.users,
              assistants: stats.assistants,
              msgs: messages.length,
              loose: stats.looseUsers,
              skippedUnknown: stats.skippedUnknown
            });
            if (stats.turns > 0 && stats.assistants === 0) {
              aiCmDiagLine("chatgpt-roles-miss", {
                turns: stats.turns,
                users: stats.users,
                turnSel: this._turnSelectors.join(", "),
                userSel: this._userSelectors.join(", "),
                assistantSel: this._assistantSelectors.join(", ")
              });
            }
          }
          return messages;
        }
        /**
         * Полный текст диалога: содержимое ходов, склеенное переводом строки.
         * Явное переопределение базового (у ChatGPT свой путь отбора узлов).
         * @returns {string}
         */
        getFullDialogText() {
          const messages = this.extractMessages();
          return messages.map((msg) => msg.content).join("\n");
        }
        /**
         * Находимся ли мы на странице диалога: есть ход ([data-turn-key]) либо реплика
         * пользователя (в т.ч. хвост без атрибута) либо легаси-узел содержимого.
         * @returns {boolean}
         */
        isOnDialogPage() {
          if (document.querySelector(this._turnSelectors.join(", "))) return true;
          if (document.querySelector(this._userSelectors.join(", "))) return true;
          return document.querySelector(this.allContentSelectors) !== null;
        }
        // Честный детектор модели из DOM (второй слой; первый — model_slug из сети в content.js).
        // Ищет имя модели в шапке/селекторе. Если шапка показывает только бренд ("ChatGPT")
        // без версии — возвращает null (НЕ захардкоженное 'gpt-4o'), чтобы content.js взял
        // дефолт/сеть. Лог один раз, без спама. Безопасно (try/catch).
        /**
         * Имя модели из шапки/селектора; если шапка показывает только бренд — null
         * (не захардкоженное имя), иначе модель возьмётся из сети/дефолта.
         * @returns {string|null}
         */
        detectModel() {
          if (this._modelDetectLogged === void 0) this._modelDetectLogged = false;
          let found = null;
          try {
            const re = /(GPT-[\w.\-]+|Gemini[\s\d.\-A-Za-z]*|DeepSeek[\s\-A-Za-z0-9]*|Claude[\s\d.\-A-Za-z]*|o[134]-[\w.\-]*)/i;
            const selectors = [
              '[data-testid="model-switcher-dropdown-button"]',
              '[data-testid="model-switcher"]',
              'button[aria-label*="model" i]',
              'button[aria-label*="\u043C\u043E\u0434\u0435\u043B\u044C" i]',
              "nav button",
              "header button"
            ];
            for (let i = 0; i < selectors.length && !found; i++) {
              const els = (
                /** @type {NodeListOf<HTMLElement>} */
                document.querySelectorAll(selectors[i])
              );
              for (let j = 0; j < els.length; j++) {
                const txt = (els[j].innerText || els[j].textContent || "").trim();
                const m = txt.match(re);
                if (m) {
                  found = m[1];
                  break;
                }
              }
            }
            if (!found) {
              const labeled = document.querySelectorAll("[aria-label],[title]");
              for (let k = 0; k < labeled.length; k++) {
                const s = (labeled[k].getAttribute("aria-label") || "") + " " + (labeled[k].getAttribute("title") || "");
                const m2 = s.match(re);
                if (m2) {
                  found = m2[1];
                  break;
                }
              }
            }
          } catch (e) {
            swallowSoft(e, "adapter:chatgpt:detectModel");
          }
          if (!this._modelDetectLogged) {
            this._modelDetectLogged = true;
            debugLog("log", "[model-detect][DOM] " + (found ? '\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0432 \u0448\u0430\u043F\u043A\u0435: "' + found + '"' : "\u0438\u043C\u044F \u043C\u043E\u0434\u0435\u043B\u0438 \u0432 \u0448\u0430\u043F\u043A\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E (\u0448\u0430\u043F\u043A\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0431\u0440\u0435\u043D\u0434 \u2014 \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u043E\u0437\u044C\u043C\u0451\u0442\u0441\u044F \u0438\u0437 \u0441\u0435\u0442\u0438/\u0434\u0435\u0444\u043E\u043B\u0442\u0430)"));
          }
          return found;
        }
      };
      var GeminiAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "gemini";
          this.defaultModel = "Gemini 2.5 Pro";
          debugLog("log", "[GeminiAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
        }
        /**
         * Находимся ли мы на диалоге (контейнер диалога ИЛИ поле ввода).
         * @returns {boolean}
         */
        isOnDialogPage() {
          try {
            const hasMessages = document.querySelector(".conversation-container") !== null;
            const hasInput = document.querySelector("rich-textarea, .input-area") !== null;
            const result = hasMessages || hasInput;
            debugLog("log", `[GeminiAdapter] isOnDialogPage: ${result}`);
            return result;
          } catch (error) {
            debugLog("error", "[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:", error);
            return false;
          }
        }
        /**
         * Ходы диалога: сперва по turn-контейнерам, при пустом результате — общий запасной
         * отбор по классам/дата-атрибутам роли. При ошибке — пустой массив.
         * @returns {GeminiExtractedMessage[]}
         */
        extractMessages() {
          try {
            const messages = [];
            const turnContainers = document.querySelectorAll("turn-container, .turn-container, [data-turn]");
            debugLog("log", `[GeminiAdapter] \u041D\u0430\u0439\u0434\u0435\u043D\u043E turn-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432: ${turnContainers.length}`);
            if (turnContainers.length > 0) {
              turnContainers.forEach((turn, index) => {
                try {
                  const userMessage = turn.querySelector('.user-query, [data-role="user"], .user-turn .query-text');
                  if (userMessage) {
                    const content = this._cleanText(userMessage.textContent);
                    if (content.length > 0) {
                      messages.push({ role: "user", content });
                    }
                  }
                  const assistantMessage = turn.querySelector('.model-response, [data-role="model"], .response-content, .assistant-turn .markdown');
                  if (assistantMessage) {
                    const content = this._cleanText(assistantMessage.textContent);
                    if (content.length > 0) {
                      messages.push({ role: "assistant", content });
                    }
                  }
                } catch (turnError) {
                  debugLog("error", `[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 turn #${index}:`, turnError);
                }
              });
            }
            if (messages.length === 0) {
              debugLog("log", "[GeminiAdapter] \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E \u0437\u0430\u043F\u0430\u0441\u043D\u043E\u0439 \u043C\u0435\u0442\u043E\u0434 \u043F\u043E\u0438\u0441\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439");
              const userMessages = document.querySelectorAll('.user-query, .query-text, [data-role="user"]');
              userMessages.forEach((msg) => {
                const content = this._cleanText(msg.textContent);
                if (content.length > 0) {
                  messages.push({ role: "user", content });
                }
              });
              const assistantMessages = document.querySelectorAll('.model-response, .response-content, [data-role="model"]');
              assistantMessages.forEach((msg) => {
                const content = this._cleanText(msg.textContent);
                if (content.length > 0) {
                  messages.push({ role: "assistant", content });
                }
              });
            }
            debugLog("log", `[GeminiAdapter] \u0412\u0441\u0435\u0433\u043E \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439: ${messages.length}`);
            return messages;
          } catch (error) {
            debugLog("error", "[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 extractMessages:", error);
            return [];
          }
        }
        /**
         * Модель: из DOM (.model-name и т.п.), затем localStorage, затем this.defaultModel.
         * @returns {string}
         */
        detectModel() {
          try {
            const modelIndicator = document.querySelector('.model-name, .current-model, [aria-label*="model"]');
            if (modelIndicator) {
              const modelText = modelIndicator.textContent.trim();
              debugLog("log", `[GeminiAdapter] \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C: ${modelText}`);
              return modelText || this.defaultModel;
            }
            const savedModel = localStorage.getItem("gemini-selected-model");
            if (savedModel) {
              debugLog("log", `[GeminiAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 localStorage: ${savedModel}`);
              return savedModel;
            }
            debugLog("log", `[GeminiAdapter] \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E \u043C\u043E\u0434\u0435\u043B\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: ${this.defaultModel}`);
            return this.defaultModel;
          } catch (error) {
            debugLog("error", "[GeminiAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 detectModel:", error);
            return this.defaultModel;
          }
        }
        /**
         * Нормализация текста хода (схлопывание пробелов и пустых строк).
         * @param {string} text
         * @returns {string}
         */
        _cleanText(text) {
          if (!text) return "";
          return text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        }
      };
      var AistudioAdapter = class extends GeminiAdapter {
        constructor() {
          super();
          this.siteName = "aistudio";
          this.defaultModel = "gemini-3.1-pro";
          debugLog("log", "[AistudioAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
        }
        /**
         * Находимся ли мы на диалоге: признак — узлы реплик ms-cmark-node.
         * @returns {boolean}
         */
        isOnDialogPage() {
          try {
            const hasMessageNodes = document.querySelector("ms-cmark-node") !== null;
            debugLog("log", `[AistudioAdapter] isOnDialogPage: ${hasMessageNodes}`);
            return hasMessageNodes;
          } catch (error) {
            debugLog("error", "[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:", error);
            return false;
          }
        }
        /**
         * Ходы диалога: все ms-cmark-node.v3-font-body, кроме вложенных в другой
         * ms-cmark-node (иначе текст реплики попал бы в счёт дважды — родитель и ребёнок).
         * Роль: класс user-chunk → 'user', иначе — 'assistant'.
         * @returns {AistudioExtractedMessage[]}
         */
        extractMessages() {
          try {
            const messages = [];
            const nodes = document.querySelectorAll("ms-cmark-node.v3-font-body");
            debugLog("log", `[AistudioAdapter] \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0443\u0437\u043B\u043E\u0432 \u0440\u0435\u043F\u043B\u0438\u043A: ${nodes.length}`);
            Array.prototype.forEach.call(nodes, (node, index) => {
              try {
                if (this._isNestedNode(node)) {
                  debugLog("log", `[AistudioAdapter] \u041F\u0440\u043E\u043F\u0443\u0441\u043A \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0433\u043E \u0443\u0437\u043B\u0430 #${index}`);
                  return;
                }
                const content = this._cleanText(this._readNodeText(node));
                if (content.length === 0) return;
                messages.push({ role: this._isUserChunk(node) ? "user" : "assistant", content });
              } catch (nodeError) {
                debugLog("error", `[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0443\u0437\u043B\u0430 #${index}:`, nodeError);
              }
            });
            debugLog("log", `[AistudioAdapter] \u0412\u0441\u0435\u0433\u043E \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439: ${messages.length}`);
            return messages;
          } catch (error) {
            debugLog("error", "[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 extractMessages:", error);
            return [];
          }
        }
        /**
         * Модель AI Studio: в DOM нет стабильного индикатора, распознавание не делаем —
         * возвращаем фолбэк (ключ есть в utils/model-config.js, окно 128k). Заглушка:
         * при появлении разметки переключателя модели сюда добавляется разбор DOM.
         * @returns {string}
         */
        detectModel() {
          return "gemini-3.1-pro";
        }
        /**
         * Текст узла реплики. innerText предпочтителен (видимый текст, как в браузере);
         * textContent — фолбэк для окружений без innerText (jsdom, песочницы тестов).
         * @param {Element} node
         * @returns {string}
         */
        _readNodeText(node) {
          try {
            const inner = (
              /** @type {HTMLElement} */
              node.innerText
            );
            if (typeof inner === "string" && inner.length > 0) return inner;
            return typeof node.textContent === "string" ? node.textContent : "";
          } catch (error) {
            debugLog("error", "[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0442\u0435\u043A\u0441\u0442\u0430 \u0443\u0437\u043B\u0430:", error);
            return "";
          }
        }
        /**
         * Вложенный ли узел: у него есть предок ms-cmark-node (текст уже учтён предком).
         * @param {Element} node
         * @returns {boolean}
         */
        _isNestedNode(node) {
          try {
            const parent = node && node.parentElement;
            if (!parent || typeof parent.closest !== "function") return false;
            return parent.closest("ms-cmark-node") !== null;
          } catch (error) {
            debugLog("error", "[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0432\u043B\u043E\u0436\u0435\u043D\u043D\u043E\u0441\u0442\u0438:", error);
            return false;
          }
        }
        /**
         * Реплика пользователя? В AI Studio её единственный признак — класс user-chunk.
         * @param {Element} node
         * @returns {boolean}
         */
        _isUserChunk(node) {
          try {
            return !!(node && node.classList && node.classList.contains("user-chunk"));
          } catch (error) {
            debugLog("error", "[AistudioAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F classList:", error);
            return false;
          }
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = AistudioAdapter;
      }
      var DeepSeekAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "deepseek";
          debugLog("log", "[DeepSeekAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
        }
        /**
        * Находимся ли мы на странице диалога: есть узлы ds-message ИЛИ поле ввода.
        * @returns {boolean}
        */
        isOnDialogPage() {
          const hasMessages = document.querySelectorAll('div[class*="ds-message"]').length > 0;
          const hasInput = document.querySelector("textarea") !== null;
          return hasMessages || hasInput;
        }
        // loadFullHistory удалён в v1.1 — скролл-пагинация противоречит архитектуре server-first
        // (основной источник данных — перехват сети). Метод не вызывался ни из одного файла.
        // ===== v2 (O-15): reasoning DeepSeek — ЧАСТЬ assistant-хода, а не отдельное сообщение =====
        // Панель размышлений в DOM живёт отдельным узлом с классом ds-message* — в живом прогоне
        // это давало «Извлечено 2 сообщений, роли: assi, assi»: пузыри пользователя отбрасывались
        // (роль 'unknown'), а reasoning и ответ уходили двумя assistant-сообщениями (пара
        // user→assistant рвалась, а «.» свёрнутой панели попадала в текст хода как [ANSWER]).
        // Классы DeepSeek ротируются, поэтому признак — комбинация: маркер reasoning + ОТСУТСТВИЕ
        // markdown-рендера ответа (.ds-markdown) внутри узла.
        /** Селекторы узлов панели размышлений (thinking) — классы DeepSeek ротируются. */
        _thinkSelector() {
          return '[class*="ds-think"], [class*="think-content"], [class*="ds-reason"], [data-testid*="think"]';
        }
        /**
         * Признак панели размышлений: класс узла, вложенный think-узел либо маркер в начале текста.
         * @param {Element} element
         * @returns {boolean}
         */
        _hasThinkMarker(element) {
          try {
            if (!element) return false;
            const cls = String(element.className || "");
            if (/ds-think|think-content|ds-reason/i.test(cls)) return true;
            if (typeof element.querySelector === "function" && element.querySelector(this._thinkSelector())) return true;
            const txt = String(element.textContent || "").trim();
            return /^(?:deepthink|deep\s*think|thought|thinking|размышлен|думаю|思考)/i.test(txt);
          } catch (e) {
            return false;
          }
        }
        /**
         * Узел markdown-рендера ответа (сам узел либо вложенный .ds-markdown), иначе null.
         * @param {Element} element
         * @returns {Element|null}
         */
        _answerMarkdown(element) {
          try {
            if (!element) return null;
            if (String(element.className || "").includes("ds-markdown")) return element;
            const md = typeof element.querySelector === "function" ? element.querySelector(".ds-markdown") : null;
            return md || null;
          } catch (e) {
            return null;
          }
        }
        // Узел — ТОЛЬКО панель размышлений (ответа в нём нет): сообщением хода не является.
        /**
         * Узел — только панель размышлений (ответа в нём нет): сообщением хода не является.
         * @param {Element} element
         * @returns {boolean}
         */
        _isReasoningOnly(element) {
          try {
            if (!element) return false;
            if (this._answerMarkdown(element)) return false;
            return this._hasThinkMarker(element);
          } catch (e) {
            return false;
          }
        }
        /**
         * Находится ли узел внутри панели размышлений (сам think-класс либо ближайший think-предок).
         * @param {Element} element
         * @returns {boolean}
         */
        _isInsideReasoning(element) {
          try {
            if (!element) return false;
            if (/ds-think|think-content|ds-reason/i.test(String(element.className || ""))) return true;
            return typeof element.closest === "function" && !!element.closest(this._thinkSelector());
          } catch (e) {
            return false;
          }
        }
        /**
         * Текст элемента БЕЗ панелей размышлений и служебных кнопок/иконок.
         * @param {Element} element
         * @returns {string}
         */
        _textWithoutReasoning(element) {
          try {
            const clone = (
              /** @type {Element} */
              element.cloneNode(true)
            );
            Array.prototype.slice.call(clone.querySelectorAll(this._thinkSelector())).forEach((el) => el.remove());
            clone.querySelectorAll('button, svg, [class*="avatar"], [class*="icon"], [class*="toolbar"]').forEach((el) => el.remove());
            return clone.textContent.trim();
          } catch (e) {
            return "";
          }
        }
        // ===== O-7 (hidden-захват): текст панели размышлений ОТДЕЛЬНЫМ полем =====
        // Базовый текст хода панель reasoning НЕ несёт (_textWithoutReasoning её вырезает,
        // _isReasoningOnly такие узлы вовсе пропускает) — в DOM-ветке reasoning исторически
        // терялся на ЗАХВАТЕ. Здесь он сохраняется рядом с текстом (hiddenReasoning) и НЕ
        // попадает ни в content, ни в метрики/токены: базовый текст байтово прежний, а в
        // экспорт блок уходит только при включённом тумблере aiCmIncludeHiddenInExport
        // (сырой режим, utils/export-emit-pipeline.js:includeHiddenExportBlocks).
        // Служебная шапка свёрнутой панели («DeepThink · 12 с», «Размышления:», «Thought for 3s») —
        /**
         * Снимает служебную шапку панели в начале текста («DeepThink · 12 с», «Размышления:»).
         * @param {string} text
         * @returns {string}
         */
        _stripReasoningHeader(text) {
          try {
            const s = String(text == null ? "" : text).trim();
            return s.replace(
              /^(?:deepthink|deep\s?think|thought|thinking|размышлен[а-яё]*|思考)\s*(?:[·:•\-–—]\s*\d+\s*(?:с|s|sec|сек|seconds?)?)?\s*[:·]?\s*/i,
              ""
            ).trim();
          } catch (e) {
            return String(text == null ? "" : text).trim();
          }
        }
        /**
         * Текст панели размышлений узла (сама панель либо вложенные think-узлы),
         * склеенный пустой строкой; пустые/служебные части отброшены.
         * @param {Element} element
         * @returns {string}
         */
        _reasoningText(element) {
          try {
            if (!element) return "";
            const nodes = [];
            if (this._isInsideReasoning(element)) {
              nodes.push(element);
            } else if (typeof element.querySelectorAll === "function") {
              const found = element.querySelectorAll(this._thinkSelector());
              for (let i = 0; i < found.length; i++) nodes.push(found[i]);
            }
            const parts = [];
            for (let j = 0; j < nodes.length; j++) {
              const text = this._stripReasoningHeader(nodes[j].textContent);
              if (text && this._hasRealContent(text)) parts.push(text);
            }
            return parts.join("\n\n").trim();
          } catch (e) {
            return "";
          }
        }
        // Артефакт интерфейса («.» свёрнутой панели) — не сообщение: в сообщении должна быть
        // хотя бы одна буква или цифра. Формат текста при этом не трогаем.
        /**
         * Есть ли в тексте реальные символы (буква/цифра), а не только артефакт интерфейса
         * вроде «.» свёрнутой панели.
         * @param {string} text
         * @returns {boolean}
         */
        _hasRealContent(text) {
          return /[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(String(text == null ? "" : text));
        }
        /**
         * Первый дочерний узел с текстом, годный как текст хода (без avatar/button/icon,
         * без панелей размышлений), иначе null.
         * @param {Element} element
         * @returns {Element|null}
         */
        _firstContentChild(element) {
          try {
            const candidates = element.querySelectorAll(
              'div:not([class*="avatar"]):not([class*="button"]):not([class*="icon"])'
            );
            for (let i = 0; i < candidates.length; i++) {
              if (this._isInsideReasoning(candidates[i])) continue;
              return candidates[i];
            }
          } catch (e) {
            swallowSoft(e, "adapter:deepseek:firstContentChild");
          }
          return null;
        }
        /**
         * Роль хода по разметке узла.
         *
         * Возвращаем string, а не литеральный union 'user'|'assistant': пока тип узкий,
         * tsc (TS2367) считает проверки `role !== 'unknown'` в extractMessages
         * (строки 219 и 236) заведомо ложными. Эти проверки — НАМЕРЕННЫЙ детектор дрейфа
         * предиката (см. комментарий O-21 у них), и удалять их нельзя: они должны
         * «ожить», если _detectRole снова начнёт отдавать 'unknown'. Тип string оставляет
         * гейт живым и типизирует функцию честно — она отдаёт произвольную строку роли.
         * TODO: уточнить тип в шаге 5 (контракт ролей адаптера).
         * @param {Element} element
         * @returns {string}
         */
        _detectRole(element) {
          const classes = element.className || "";
          if (classes.includes("d29f3d7d")) return "user";
          if (classes.includes("ds-markdown") || classes.includes("ds-assistant-message")) return "assistant";
          try {
            if (element.querySelector && element.querySelector(".ds-markdown, .ds-markdown-paragraph")) return "assistant";
            if (this._isReasoningOnly(element)) return "assistant";
          } catch (e) {
            swallow(e, "adapter:deepseek:detectRole");
          }
          return "user";
        }
        /**
         * Текст хода: markdown-абзацы ответа построчно, иначе первый текстовый узел
         * пузыря без панелей размышлений.
         * @param {Element} element
         * @returns {string}
         */
        _extractText(element) {
          const markdown = this._answerMarkdown(element);
          if (markdown) {
            const paragraphs = markdown.querySelectorAll(".ds-markdown-paragraph, p");
            if (paragraphs.length > 0) {
              return Array.from(paragraphs).map((p) => p.textContent.trim()).filter(Boolean).join("\n");
            }
          }
          const textChild = this._firstContentChild(element);
          if (textChild) return this._textWithoutReasoning(textChild);
          return this._textWithoutReasoning(element);
        }
        /**
         * Ходы диалога из DOM (v2/O-15 + O-7 + O-21).
         *
         * Узлы-панели reasoning сообщениями НЕ являются: их текст переносится в
         * hiddenReasoning ближайшего assistant-хода (висячий — предыдущего, иначе
         * последнего). Возвращает пустой массив при ошибке.
         * @returns {DeepSeekExtractedMessage[]}
         */
        extractMessages() {
          try {
            const messages = [];
            const messageElements = document.querySelectorAll('div[class*="ds-message"]');
            const o21DiagOn = typeof aiCmDiagOn === "function" ? aiCmDiagOn() : false;
            const o21Stats = o21DiagOn ? {
              totalFound: messageElements.length,
              extracted: 0,
              skippedNested: 0,
              skippedReasoningOnly: 0,
              skippedEmpty: 0,
              skippedUnknown: 0,
              skippedNoRealContent: 0,
              classesSample: [],
              neighborInjections: []
            } : null;
            if (o21Stats) {
              try {
                const o21Markers = ["BetterDeepSeek", "BDS:", "better-deepseek", "bds-"];
                const o21Root = typeof document !== "undefined" ? document.documentElement || document.body : null;
                const o21Html = o21Root ? String(o21Root.innerHTML || "").slice(0, 5e4) : "";
                for (let m = 0; m < o21Markers.length; m++) {
                  if (o21Html.indexOf(o21Markers[m]) !== -1) o21Stats.neighborInjections.push(o21Markers[m]);
                }
              } catch (eO21inj) {
              }
            }
            let pendingReasoning = "";
            messageElements.forEach((element, idx) => {
              if (o21Stats && idx < 3) {
                o21Stats.classesSample.push(String(element.className || "").slice(0, 60));
              }
              if (element.className?.includes("ds-markdown") && element.parentElement?.className?.includes("ds-message")) {
                if (o21Stats) o21Stats.skippedNested++;
                return;
              }
              if (this._isReasoningOnly(element)) {
                if (o21Stats) o21Stats.skippedReasoningOnly++;
                const orphanReasoning = this._reasoningText(element);
                if (orphanReasoning) {
                  pendingReasoning = pendingReasoning ? pendingReasoning + "\n\n" + orphanReasoning : orphanReasoning;
                }
                return;
              }
              const role = this._detectRole(element);
              const content = this._extractText(element);
              if (content && content.length > 0 && role !== "unknown" && this._hasRealContent(content)) {
                const msg = { role, content };
                if (role === "assistant") {
                  const ownReasoning = this._reasoningText(element);
                  const hiddenReasoning = [pendingReasoning, ownReasoning].filter(Boolean).join("\n\n").trim();
                  if (hiddenReasoning) msg.hiddenReasoning = hiddenReasoning;
                  pendingReasoning = "";
                }
                messages.push(msg);
                if (o21Stats) o21Stats.extracted++;
              } else if (o21Stats) {
                if (!content || content.length === 0) o21Stats.skippedEmpty++;
                else if (role === "unknown") o21Stats.skippedUnknown++;
                else o21Stats.skippedNoRealContent++;
              }
            });
            if (pendingReasoning) {
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role !== "assistant") continue;
                messages[i].hiddenReasoning = messages[i].hiddenReasoning ? messages[i].hiddenReasoning + "\n\n" + pendingReasoning : pendingReasoning;
                break;
              }
            }
            if (messages.length > 0) {
              debugLog("log", `[DeepSeekAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E ${messages.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u0440\u043E\u043B\u0438: ${messages.map((m) => m.role.substring(0, 4)).join(", ")}`);
            }
            if (o21Stats && typeof aiCmDiagLine === "function") {
              try {
                aiCmDiagLine("o21-dom-extract", {
                  site: this.siteName || "deepseek",
                  totalFound: o21Stats.totalFound,
                  extracted: o21Stats.extracted,
                  skipNested: o21Stats.skippedNested,
                  skipReasoningOnly: o21Stats.skippedReasoningOnly,
                  skipEmpty: o21Stats.skippedEmpty,
                  skipUnknown: o21Stats.skippedUnknown,
                  skipNoRealContent: o21Stats.skippedNoRealContent,
                  classesSample: o21Stats.classesSample.join(" | ") || "(\u043D\u0435\u0442)",
                  neighborInjections: o21Stats.neighborInjections.join(",") || "(\u043D\u0435\u0442)"
                });
              } catch (eO21line) {
              }
            }
            return messages;
          } catch (error) {
            debugLog("error", "[DeepSeekAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
            return [];
          }
        }
        /**
         * Полный текст диалога: содержимое ходов, склеенное переводом строки.
         * @returns {string}
         */
        getFullDialogText() {
          return this.extractMessages().map((msg) => msg.content).join("\n");
        }
        /**
         * Модель: DeepThink (R1) по aria-pressed, затем UI-селекторы, затем localStorage,
         * иначе 'deepseek-v3'.
         * @returns {string}
         */
        detectModel() {
          try {
            const deepThinkBtn = document.querySelector(
              'div.ds-toggle-button[aria-pressed="true"], div[class*="toggle-button"][aria-pressed="true"]'
            );
            if (deepThinkBtn && deepThinkBtn.textContent.includes("DeepThink")) {
              debugLog("log", "[DeepSeekAdapter] DeepThink \u0430\u043A\u0442\u0438\u0432\u0435\u043D \u2192 R1");
              return "deepseek-r1";
            }
            const modelSelectors = [
              ".model-selector",
              ".current-model",
              '[class*="model-switch"]',
              ".model-name",
              'select[name="model"]',
              '[aria-label*="model"]'
            ];
            for (const selector of modelSelectors) {
              const el = document.querySelector(selector);
              if (el) {
                let text = el.tagName === "SELECT" ? (
                  /** @type {HTMLSelectElement} */
                  el.options[
                    /** @type {HTMLSelectElement} */
                    el.selectedIndex
                  ]?.text || ""
                ) : el.textContent.trim();
                if (text) {
                  debugLog("log", "[DeepSeekAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 UI:", text);
                  if (text.toLowerCase().includes("r1")) return "deepseek-r1";
                  if (text.toLowerCase().includes("v3")) return "deepseek-v3";
                }
              }
            }
            const savedModel = localStorage.getItem("deepseek-selected-model") || localStorage.getItem("selected-model");
            if (savedModel) {
              debugLog("log", "[DeepSeekAdapter] \u041C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 localStorage:", savedModel);
              if (savedModel.toLowerCase().includes("r1")) return "deepseek-r1";
              if (savedModel.toLowerCase().includes("v3")) return "deepseek-v3";
            }
            return "deepseek-v3";
          } catch (error) {
            debugLog("error", "[DeepSeekAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 detectModel:", error);
            return "deepseek-v3";
          }
        }
      };
      function gsaFolwrUtils() {
        try {
          if (typeof window !== "undefined" && window.GoogleFolwrUtils && typeof window.GoogleFolwrUtils.answerTextOf === "function" && typeof window.GoogleFolwrUtils.answerDomNodes === "function") {
            return window.GoogleFolwrUtils;
          }
        } catch (e) {
        }
        try {
          if (typeof __require === "function") {
            var mod = __require("../utils/google-search-folwr-parser.js");
            if (mod && typeof mod.answerTextOf === "function" && typeof mod.answerDomNodes === "function") {
              return mod;
            }
          }
        } catch (e2) {
        }
        return null;
      }
      function gsaAnswerText(el) {
        var util = gsaFolwrUtils();
        if (util) {
          try {
            return String(util.answerTextOf(el) || "");
          } catch (e) {
            swallowSoft(e, "adapter:google-search:answerText");
          }
        }
        try {
          var clone = (
            /** @type {Element} */
            el.cloneNode(true)
          );
          clone.querySelectorAll("script, style, button, svg").forEach(function(n) {
            n.remove();
          });
          return String(clone.textContent || "");
        } catch (e2) {
          return "";
        }
      }
      function gsaAnswerNodes(root) {
        var util = gsaFolwrUtils();
        if (util) {
          try {
            var nodes = util.answerDomNodes(root);
            if (nodes) return nodes;
          } catch (e) {
            swallowSoft(e, "adapter:google-search:answerNodes");
          }
        }
        try {
          return root.querySelectorAll(".n6owBd.awi2gc");
        } catch (e2) {
          return [];
        }
      }
      var GoogleSearchAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "google_search";
          this._lastNetworkModel = "";
          this._lastExtractedCount = null;
          this._lastCodeBlockSig = null;
          console.log("[GoogleSearchAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (v2: AI-\u0440\u0435\u0436\u0438\u043C)");
          if (typeof window !== "undefined") {
            var self = this;
            try {
              window.addEventListener("ai-cm-full-history", function(ev) {
                var evt = (
                  /** @type {CustomEvent} */
                  ev
                );
                var detail = evt && evt.detail;
                if (detail && detail.modelSlug) {
                  self._lastNetworkModel = detail.modelSlug;
                }
              });
              window.dispatchEvent(new CustomEvent("ai-cm-google-search-ready"));
            } catch (e) {
            }
          }
        }
        /**
         * Находимся ли мы на странице диалога AI-режима: есть turn-контейнеры,
         * блок ответа aimfl или поле ввода.
         * @returns {boolean}
         */
        isOnDialogPage() {
          var hasTurns = document.querySelector('[data-scope-id="turn"]') !== null;
          var hasAimfl = document.querySelector('[data-subtree="aimfl"]') !== null;
          var hasInput = document.querySelector('textarea, [contenteditable="true"]') !== null;
          var result = hasTurns || hasAimfl || hasInput;
          console.log("[GoogleSearchAdapter] \u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0434\u0438\u0430\u043B\u043E\u0433\u0430: " + result);
          return result;
        }
        /**
         * Ходы диалога: вопрос из заголовка turn'а, ответ — блоки ответа, отнесённые к
         * тому же turn'у. Пустые вопросы/ответы пропускаются; при ошибке — пустой массив.
         * @returns {GoogleSearchExtractedMessage[]}
         */
        extractMessages() {
          try {
            var turns = document.querySelectorAll('[data-scope-id="turn"]');
            if (!turns || turns.length === 0) {
              console.log("[GoogleSearchAdapter] Turn-\u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
              return [];
            }
            var questions = [];
            for (var i = 0; i < turns.length; i++) {
              var h2 = turns[i].querySelector("h2.iMqumd");
              var qText = null;
              if (h2) {
                var raw = h2.textContent.trim();
                var match = raw.match(/^(?:Вы сказали|You said|You asked):\s*"([\s\S]*)"$/) || raw.match(/^Du hast Folgendes (?:gesagt|gesendet):\s*([\s\S]*)$/);
                if (match) {
                  qText = match[1].trim();
                } else {
                  qText = raw;
                }
              }
              questions.push(qText);
            }
            var answerBlocks = [];
            for (var ti = 0; ti < turns.length; ti++) {
              answerBlocks[ti] = [];
            }
            var blocks = gsaAnswerNodes(document);
            for (var b = 0; b < blocks.length; b++) {
              var block = blocks[b];
              var assignedIdx = -1;
              for (var ti2 = 0; ti2 < turns.length; ti2++) {
                if (turns[ti2].compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) {
                  assignedIdx = ti2;
                } else {
                  break;
                }
              }
              if (assignedIdx >= 0 && assignedIdx < turns.length) {
                var blockText = gsaAnswerText(
                  /** @type {Element} */
                  /** @type {unknown} */
                  block
                ).trim();
                if (blockText) {
                  answerBlocks[assignedIdx].push(blockText);
                }
              }
            }
            try {
              if (typeof aiCmDiagOn === "function" && aiCmDiagOn() && typeof aiCmDiagLine === "function") {
                var codeSels = [
                  ".n6owBd.awi2gc pre",
                  ".n6owBd.awi2gc code",
                  '[data-subtree="aimfl"] pre',
                  '[data-subtree="aimfl"] code',
                  "pre",
                  "code"
                ];
                var codeEl = null, codeVia = "";
                for (var cs = 0; cs < codeSels.length && !codeEl; cs++) {
                  codeEl = document.querySelector(codeSels[cs]);
                  if (codeEl) codeVia = codeSels[cs];
                }
                var codeSig = codeEl ? codeVia + "|" + codeEl.tagName + "|" + String(codeEl.className || "") + "|" + codeEl.textContent.length : "none";
                if (codeSig !== this._lastCodeBlockSig) {
                  this._lastCodeBlockSig = codeSig;
                  if (!codeEl) {
                    aiCmDiagLine("gsa-code-block", { found: 0, via: "(\u043D\u0435\u0442)", blocks: blocks.length, turns: turns.length });
                  } else {
                    var codeParent = codeEl.parentElement;
                    aiCmDiagLine("gsa-code-block", {
                      found: 1,
                      via: codeVia,
                      tag: codeEl.tagName,
                      cls: String(codeEl.className || "").slice(0, 120),
                      childs: codeEl.childNodes.length,
                      textLen: codeEl.textContent.length,
                      parentTag: codeParent && codeParent.tagName || "",
                      parentCls: codeParent && String(codeParent.className || "").slice(0, 120) || "",
                      // outerHTML.slice(0,500); переводы строк схлопнуты, чтобы строка лога осталась одной
                      html500: String(codeEl.outerHTML || "").replace(/\s+/g, " ").slice(0, 500)
                    });
                  }
                }
              }
            } catch (eCodeBlock) {
            }
            var answers = [];
            for (var ti3 = 0; ti3 < turns.length; ti3++) {
              var joined = answerBlocks[ti3].length > 0 ? answerBlocks[ti3].join("\n\n") : null;
              if (!joined) {
                var allAimfl = document.querySelectorAll('[data-subtree="aimfl"]');
                if (allAimfl[ti3]) {
                  var aimText = allAimfl[ti3].textContent.trim();
                  if (aimText) joined = aimText;
                }
              }
              answers.push(joined);
            }
            var messages = [];
            for (var k = 0; k < Math.min(questions.length, answers.length); k++) {
              if (questions[k]) {
                messages.push({ role: "user", content: questions[k] });
              }
              if (answers[k]) {
                messages.push({ role: "assistant", content: answers[k] });
              }
            }
            if (messages.length !== this._lastExtractedCount) {
              this._lastExtractedCount = messages.length;
              console.log("[GoogleSearchAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E " + messages.length + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439");
            }
            return messages;
          } catch (error) {
            debugLog("error", "[GoogleSearchAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
            return [];
          }
        }
        /**
         * Полный текст диалога: содержимое ходов, склеенное переводом строки.
         * @returns {string}
         */
        getFullDialogText() {
          return this.extractMessages().map(function(msg) {
            return msg.content;
          }).join("\n");
        }
        /**
         * Модель: ТОЛЬКО из сети (активный/пассивный ответ, detail.modelSlug), иначе ''.
         * DOM-догадка сознательно не возвращается — см. комментарий в теле метода.
         * @returns {string}
         */
        detectModel() {
          if (this._lastNetworkModel) return this._lastNetworkModel;
          return "";
        }
      };
      var ClaudeAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "claude";
          this.defaultModel = "claude-sonnet-4-6";
          debugLog("log", "[ClaudeAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
          this._lastNetworkModel = "";
          this._modelLogSent = false;
          if (typeof window !== "undefined") {
            var self = this;
            try {
              window.addEventListener("ai-cm-full-history", function(ev) {
                var evt = (
                  /** @type {CustomEvent} */
                  ev
                );
                var detail = evt && evt.detail;
                if (detail && detail.modelSlug && self.siteName === "claude") {
                  self._lastNetworkModel = detail.modelSlug;
                }
              });
            } catch (e) {
            }
          }
        }
        /**
         * Находимся ли мы на диалоге claude.ai (хост + префикс пути /chat/).
         * @returns {boolean}
         */
        isOnDialogPage() {
          try {
            var host = window.location.hostname;
            var path = window.location.pathname;
            var result = host === "claude.ai" && path.indexOf("/chat/") === 0;
            debugLog("log", "[ClaudeAdapter] isOnDialogPage: " + result);
            return result;
          } catch (error) {
            debugLog("error", "[ClaudeAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:", error);
            return false;
          }
        }
        /**
         * Запасной DOM-парсинг: всегда пустой (основной источник — сеть).
         * @returns {ClaudeExtractedMessage[]}
         */
        extractMessages() {
          debugLog("log", "[ClaudeAdapter] extractMessages: \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u2014 \u0441\u0435\u0442\u044C)");
          return [];
        }
        /**
         * Модель: сначала последняя из сети (точнее), иначе this.defaultModel.
         * @returns {string}
         */
        detectModel() {
          try {
            if (this._lastNetworkModel) {
              if (!this._modelLogSent) {
                this._modelLogSent = true;
                debugLog("log", "[ClaudeAdapter] \u043C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 \u0441\u0435\u0442\u0438: " + this._lastNetworkModel);
              }
              return this._lastNetworkModel;
            }
          } catch (e) {
          }
          return this.defaultModel;
        }
        /**
         * Нормализация текста хода (схлопывание пробелов и пустых строк).
         * @param {string} text
         * @returns {string}
         */
        _cleanText(text) {
          if (!text) return "";
          return text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        }
      };
      var PerplexityAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "perplexity";
          this.defaultModel = "turbo";
          debugLog("log", "[PerplexityAdapter] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
          this._lastNetworkModel = "";
          this._modelLogSent = false;
          if (typeof window !== "undefined") {
            var self = this;
            try {
              window.addEventListener("ai-cm-full-history", function(ev) {
                var evt = (
                  /** @type {CustomEvent} */
                  ev
                );
                var detail = evt && evt.detail;
                if (detail && detail.modelSlug && self.siteName === "perplexity") {
                  self._lastNetworkModel = detail.modelSlug;
                }
              });
            } catch (e) {
            }
          }
        }
        /**
         * Находимся ли мы на диалоге perplexity.ai (хост + префикс /search/ или /thread/).
         * @returns {boolean}
         */
        isOnDialogPage() {
          try {
            var host = window.location.hostname;
            var path = window.location.pathname;
            var result = (host === "www.perplexity.ai" || host === "perplexity.ai") && (path.indexOf("/search/") === 0 || path.indexOf("/thread/") === 0);
            debugLog("log", "[PerplexityAdapter] isOnDialogPage: " + result);
            return result;
          } catch (error) {
            debugLog("error", "[PerplexityAdapter] \u041E\u0448\u0438\u0431\u043A\u0430 \u0432 isOnDialogPage:", error);
            return false;
          }
        }
        /**
         * Запасной DOM-парсинг: всегда пустой (основной источник — сеть).
         * @returns {PerplexityExtractedMessage[]}
         */
        extractMessages() {
          debugLog("log", "[PerplexityAdapter] extractMessages: \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u044E \u043F\u0443\u0441\u0442\u043E\u0439 \u043C\u0430\u0441\u0441\u0438\u0432 (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u2014 \u0441\u0435\u0442\u044C)");
          return [];
        }
        /**
         * Модель: сначала последняя из сети (точнее), иначе this.defaultModel.
         * @returns {string}
         */
        detectModel() {
          try {
            if (this._lastNetworkModel) {
              if (!this._modelLogSent) {
                this._modelLogSent = true;
                debugLog("log", "[PerplexityAdapter] \u043C\u043E\u0434\u0435\u043B\u044C \u0438\u0437 \u0441\u0435\u0442\u0438: " + this._lastNetworkModel);
              }
              return this._lastNetworkModel;
            }
          } catch (e) {
          }
          return this.defaultModel;
        }
        /**
         * Нормализация текста хода (схлопывание пробелов и пустых строк).
         * @param {string} text
         * @returns {string}
         */
        _cleanText(text) {
          if (!text) return "";
          return text.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        }
      };
      var QWEN_BLOCK_TAGS = {
        ADDRESS: true,
        ARTICLE: true,
        ASIDE: true,
        BLOCKQUOTE: true,
        DD: true,
        DETAILS: true,
        DIALOG: true,
        DIV: true,
        DL: true,
        DT: true,
        FIELDSET: true,
        FIGCAPTION: true,
        FIGURE: true,
        FOOTER: true,
        FORM: true,
        H1: true,
        H2: true,
        H3: true,
        H4: true,
        H5: true,
        H6: true,
        HEADER: true,
        HR: true,
        LI: true,
        MAIN: true,
        NAV: true,
        OL: true,
        P: true,
        PRE: true,
        SECTION: true,
        TABLE: true,
        TD: true,
        TH: true,
        TR: true,
        UL: true
      };
      var QWEN_CUT_MARKER = "ai-cm-qwen-cut";
      var QwenAdapter = class extends BaseAdapter {
        constructor() {
          super();
          this.siteName = "qwen";
          this.dialogContainerSelector = '#chat-container, [class*="chat-container"], main';
          this.userMessageSelector = [
            '[data-message-role="user"]',
            '[data-role="user"]',
            '[class*="user-message"]',
            '[class*="message-user"]'
          ].join(", ");
          this.modelMessageSelector = [
            '[data-message-role="assistant"]',
            '[data-role="assistant"]',
            '[class*="assistant-message"]',
            '[class*="message-assistant"]'
          ].join(", ");
          this._messageSelectors = [
            ".qwen-chat-message.qwen-chat-message-user, .qwen-chat-message.qwen-chat-message-assistant",
            "[data-message-id]",
            "[data-message-role]",
            "[data-role][data-message-index]",
            '[class*="message-row"]',
            '[class*="message-item"]',
            '[class*="message-bubble"]',
            '[class*="chat-message"]:not(.qwen-chat-message-select-turn)'
          ];
          this._reasoningSelectors = [
            '[class*="thinking"]:not([class*="tool-status-card"])',
            '[class*="thought"]:not([class*="tool-status-card"])',
            '[data-testid*="think"]:not([class*="tool-status-card"])'
          ].join(", ");
          this._noiseSelectors = 'button, svg, textarea, [class*="toolbar"], [class*="action"], [class*="footer"], [class*="input"], [class*="avatar"], [class*="icon"], [class*="copy"], [class*="tool-status-card"]';
        }
        /**
         * Блочные теги для структурного фолбэка innerText (перевод строки после элемента).
         * @returns {Record<string, boolean>}
         */
        static get _BLOCK_TAGS() {
          return QWEN_BLOCK_TAGS;
        }
        /**
         * Живой признак ввода Qwen (подтверждён сниффером: textarea «Спросить Qwen»).
         * @returns {boolean}
         */
        _hasComposer() {
          try {
            return !!document.querySelector('textarea[placeholder*="Qwen"], textarea[placeholder*="qwen"]') || !!document.querySelector('textarea[placeholder*="\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C"], textarea[placeholder*="Ask"]');
          } catch (e) {
            return false;
          }
        }
        /**
         * Находимся ли мы на странице чата Qwen: хост qwen.ai И (поле ввода ИЛИ узлы реплик
         * ИЛИ адрес вида /c/<id>). Иначе адаптер не считается активным.
         * @returns {boolean}
         */
        isOnDialogPage() {
          try {
            if (!/chat\.qwen\.ai$/i.test(String(location.hostname || "")) && String(location.hostname || "").indexOf("qwen.ai") === -1) return false;
            return this._hasComposer() || this._messageNodes().length > 0 || /\/c\//.test(location.pathname);
          } catch (e) {
            return false;
          }
        }
        /**
         * Узлы сообщений: первый непустой набор кандидатов (точные классы — первым, см. шапку),
         * с отсевом обёрток turn-selection. Пусто, если не отрисовано ни одной реплики.
         * @returns {Element[]}
         */
        _messageNodes() {
          for (let i = 0; i < this._messageSelectors.length; i++) {
            const nodes = this._safeQuerySelectorAll(this._messageSelectors[i]);
            if (nodes && nodes.length > 0) return this._dropTurnOnlyNodes(Array.prototype.slice.call(nodes));
          }
          return [];
        }
        /**
         * Обёртки turn-selection сообщениями НЕ являются (снимок 2026-09-26: 47 узлов
         * `.qwen-chat-message-select-turn` + 94 `.qwen-chat-message-select-turn-message` вокруг 94
         * реальных реплик). Широкий кандидат исключает их через `:not()`; здесь — второй,
         * класс-независимый барьер (страховка на случай смены класса обёртки): узлом-обёрткой
         * считается ТОЛЬКО тот, чей класс содержит `select-turn`, — реальные реплики
         * (`.qwen-chat-message.qwen-chat-message-user/assistant`) не содержат его никогда.
         * @param {Element[]} nodes
         * @returns {Element[]}
         */
        _dropTurnOnlyNodes(nodes) {
          return nodes.filter(function(el) {
            const cls = String(el && el.className || "").toLowerCase();
            return cls.indexOf("select-turn") === -1;
          });
        }
        /**
         * Читаемый текст узла (текст УЖЕ БЕЗ служебных элементов и без блока размышлений).
         * Живой браузер: `innerText` — 1:1 с тем, что видит пользователь (многострочность).
         * jsdom/срез: `innerText` не реализован → структурный фолбэк (тот же принцип: перевод
         * строки после блочного элемента), затем ОДНА нормализация для обоих путей.
         * @param {Element & {innerText?: string}} element
         * @returns {string}
         */
        _readableText(element) {
          try {
            if (!element) return "";
            let raw = "";
            try {
              raw = element.innerText;
            } catch (eInner) {
              raw = "";
            }
            if (typeof raw !== "string" || raw.length === 0) raw = this._innerTextFallback(element);
            return this._normalizeLines(raw);
          } catch (e) {
            return "";
          }
        }
        /**
         * Структурный фолбэк innerText (jsdom/срез, где innerText не реализован): обход дерева,
         * перевод строки вокруг блочных элементов и на маркере среза; <br> — перевод строки.
         * @param {Element} root
         * @returns {string}
         */
        _innerTextFallback(root) {
          try {
            let out = "";
            const block = QWEN_BLOCK_TAGS;
            const walk = function(node) {
              const type = node.nodeType;
              if (type === 3) {
                out += node.nodeValue || "";
                return;
              }
              if (type === 8) {
                if (String(node.nodeValue || "") === QWEN_CUT_MARKER) out += "\n";
                return;
              }
              if (type !== 1) return;
              const tag = String(
                /** @type {Element} */
                /** @type {unknown} */
                node.tagName || ""
              ).toUpperCase();
              if (tag === "BR") {
                out += "\n";
                return;
              }
              if (block[tag] === true && out.length > 0 && out.charAt(out.length - 1) !== "\n") out += "\n";
              const kids = node.childNodes || [];
              for (let i = 0; i < kids.length; i++) walk(kids[i]);
              if (block[tag] === true && out.length > 0 && out.charAt(out.length - 1) !== "\n") out += "\n";
            };
            walk(root);
            return out;
          } catch (e) {
            return "";
          }
        }
        /**
         * Нормализация: пробелы перед переводом строки убираются, серии '\n' схлопываются в один.
         * Схлопывание — осознанный компромисс: пустые строки верстки (`\n\n` между абзацами) не
         * размножаются, многострочность и границы блоков при этом сохраняются (дефект textContent
         * был в ПОТЕРЕ переводов строк, а не в их количестве).
         * @param {string} text
         * @returns {string}
         */
        _normalizeLines(text) {
          try {
            return String(text == null ? "" : text).replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim();
          } catch (e) {
            return String(text == null ? "" : text).trim();
          }
        }
        /**
         * Снятие служебного узла с сохранением границы: на месте узла остаётся маркер-комментарий,
         * который `_innerTextFallback` превращает в перевод строки. Без маркера соседние текст-узлы
         * склеились бы («привет» + снятая кнопка + «как дела» → «приветкак дела»).
         * @param {NodeList|Element[]} nodes
         * @returns {void}
         */
        _removeKeepingCut(nodes) {
          Array.prototype.slice.call(nodes).forEach(function(el) {
            try {
              if (el.parentNode) el.parentNode.insertBefore(document.createComment(QWEN_CUT_MARKER), el);
            } catch (eMark) {
            }
            el.remove();
          });
        }
        /**
         * Текст узла БЕЗ служебных элементов и БЕЗ блока размышлений (многострочность сохранена).
         * @param {Element} element
         * @returns {string}
         */
        _textWithoutReasoning(element) {
          try {
            const clone = (
              /** @type {Element} */
              element.cloneNode(true)
            );
            this._removeKeepingCut(clone.querySelectorAll(this._noiseSelectors));
            this._removeKeepingCut(clone.querySelectorAll(this._reasoningSelectors));
            return this._readableText(clone);
          } catch (e) {
            return "";
          }
        }
        /**
         * Служебная шапка свёрнутой панели («Завершено размышление», «Thinking… 3s») — не текст.
         * @param {string} text
         * @returns {string}
         */
        _stripReasoningHeader(text) {
          try {
            var s = String(text == null ? "" : text).trim();
            var re = /^(?:завершено\s+размышлени[ея]|размышлени[ея]|размышляю|thinking|thought|思考)[\s.…·:•\-–—]*[\[(]?\s*(?:\d+\s*(?:с|s|sec|сек|seconds?)?)?\s*[\])]?\s*[·:•\-–—]?\s*/i;
            return s.replace(re, "").trim();
          } catch (e) {
            return String(text == null ? "" : text).trim();
          }
        }
        /**
         * Текст панели размышлений реплики (сама панель либо вложенные think-узлы), без шапки,
         * без карточек инструментов; части склеены пустой строкой.
         * @param {Element} element
         * @returns {string}
         */
        _reasoningText(element) {
          try {
            if (!element) return "";
            const nodes = [];
            if (typeof element.matches === "function" && element.matches(this._reasoningSelectors)) {
              nodes.push(element);
            } else if (typeof element.querySelectorAll === "function") {
              const found = element.querySelectorAll(this._reasoningSelectors);
              for (let i = 0; i < found.length; i++) nodes.push(found[i]);
            }
            const parts = [];
            for (let j = 0; j < nodes.length; j++) {
              const node = (
                /** @type {Element} */
                /** @type {unknown} */
                nodes[j]
              );
              if (this._isToolStatusCard(node)) continue;
              const text = this._stripReasoningHeader(this._readableText(node));
              if (text && /[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(text)) parts.push(text);
            }
            return parts.join("\n\n").trim();
          } catch (e) {
            return "";
          }
        }
        /**
         * Служебная карточка инструмента Qwen (не панель размышления) — по классу узла.
         * Вызывается только для элементов (узлы панели размышлений), поэтому className читаем
         * у узла как у Element.
         * @param {Node} node
         * @returns {boolean}
         */
        _isToolStatusCard(node) {
          try {
            const el = (
              /** @type {Element} */
              /** @type {unknown} */
              node
            );
            const cls = String(node && el.className || "").toLowerCase();
            return cls.indexOf("tool-status-card") !== -1;
          } catch (e) {
            return false;
          }
        }
        /**
         * Роль узла: ТОЛЬКО класс-токен живой разметки (`qwen-chat-message-user` →
         * `qwen-chat-message-assistant`), плюс классы старых сборок как фолбэк. data-* маркеров
         * роли в живом DOM нет (снимок 2026-09-26: `data-message-role`/`data-role` — 0 совпадений);
         * угадывание по позиции/«пузырю» убрано — неверная роль тише не становится.
         * Возвращаем string, а не литеральный union 'user'|'assistant': пока тип узкий,
         * tsc (TS2367) счёл бы вызовы и сверку ролей в extractMessages заведомо ложными.
         * TODO: уточнить тип в шаге 5 (контракт ролей адаптера).
         * @param {Element} element
         * @returns {string}
         */
        _detectRole(element) {
          try {
            const cls = String(element.className || "").toLowerCase();
            if (cls.indexOf("qwen-chat-message-user") !== -1) return "user";
            if (cls.indexOf("qwen-chat-message-assistant") !== -1) return "assistant";
            if (/user/.test(cls)) return "user";
            if (/assistant|model|bot|answer/.test(cls)) return "assistant";
            if (element.querySelector && element.querySelector(this.modelMessageSelector)) return "assistant";
            if (element.querySelector && element.querySelector('[class*="markdown"], [class*="prose"]')) return "assistant";
          } catch (e) {
            swallow(e, "adapter:qwen:detectRole");
          }
          return "user";
        }
        /**
         * O-36.2 (ФИКС): контейнер-чистка базы адаптера. Живой артефакт 20-50: 75 узлов, из них
         * ДВА — узлы-КОНТЕЙНЕРЫ всего чата (по 91 595 знаков, cover=0.9999, внутри все 73 реплики):
         * база раздувалась до tokens=81672 / pct=63.8 при реальном тексте ~27-33k (~21-26%).
         * Правило — ОБЩЕЕ со сборщиками экспорта (utils/export-text-builders.js):
         * aiCmDropContainerMessages (пороги — в aiCmContainerRules, здесь НЕ повторяются).
         * Хелпер резолвится ЛЕНИВО на каждом вызове: файл сборщиков подключён в manifest.json ПОСЛЕ
         * адаптера, но к моменту extractMessages он уже загружен (общий ISOLATED-мир контент-скриптов).
         * Хелпера нет (Node/срез-песочница) → массив возвращается КАК ЕСТЬ: поведение 1:1, никакой
         * второй копии правил здесь нет.
         * @param {(QwenExtractedMessage & {hiddenReasoning?: string})[]} messages
         * @returns {(QwenExtractedMessage & {hiddenReasoning?: string})[]}
         */
        _dropContainerNodes(messages) {
          try {
            var drop = (
              /** @type {QwenContainerDrop<unknown>|null} */
              this._containerDrop()
            );
            if (typeof drop === "function") return (
              /** @type {(QwenExtractedMessage & {hiddenReasoning?: string})[]} */
              /** @type {unknown} */
              drop(messages)
            );
          } catch (eDrop) {
            swallow(eDrop, "adapter:qwen:dropContainerNodes");
          }
          return messages;
        }
        /**
         * Ленивый резолв общего хелпера контейнер-чистки (боевой путь — window сборщиков,
         * Node-путь — require), иначе null (правила не дублируются локально).
         * TODO: уточнить тип в шаге 5 (форма window.AiCmExportBuilders без @types).
         * @returns {QwenContainerDrop<unknown>|null}
         */
        _containerDrop() {
          try {
            if (typeof window !== "undefined" && window && window.AiCmExportBuilders && typeof window.AiCmExportBuilders.aiCmDropContainerMessages === "function") {
              return window.AiCmExportBuilders.aiCmDropContainerMessages;
            }
          } catch (eWin) {
          }
          try {
            var hasNodeModule = typeof module !== "undefined" && !!module && typeof __require === "function";
            if (hasNodeModule) {
              var builders = __require("../utils/export-text-builders.js");
              if (builders && typeof builders.aiCmDropContainerMessages === "function") {
                return builders.aiCmDropContainerMessages;
              }
            }
          } catch (eReq) {
          }
          return null;
        }
        /**
         * Ходы диалога из DOM (фолбэк к live-SSE, см. шапку файла).
         *
         * Пустые и «технические» тексты (артефакт свёрнутой панели) пропускаются; текст панели
         * размышлений у assistant-хода уходит в hiddenReasoning, а не в content. Метод
         * stateless — пересъём без перезагрузки (см. комментарий O-35 C в теле).
         * @returns {QwenExtractedMessage[]}
         */
        extractMessages() {
          try {
            const messages = [];
            const nodes = this._messageNodes();
            for (let i = 0; i < nodes.length; i++) {
              const element = nodes[i];
              const role = this._detectRole(element);
              const content = this._textWithoutReasoning(element);
              if (!content || content.length === 0) continue;
              if (!/[0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(content)) continue;
              const msg = { role, content };
              if (role === "assistant") {
                const reasoning = this._reasoningText(element);
                if (reasoning) msg.hiddenReasoning = reasoning;
              }
              messages.push(msg);
            }
            const keptNodes = this._dropContainerNodes(messages);
            const droppedContainers = messages.length - keptNodes.length;
            if (droppedContainers > 0) {
              messages.length = 0;
              Array.prototype.push.apply(messages, keptNodes);
            }
            if (messages.length > 0) {
              debugLog("log", `[QwenAdapter] \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E ${messages.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u043E\u0432 \u043E\u0442\u0431\u0440\u043E\u0448\u0435\u043D\u043E: ${droppedContainers}, \u0440\u043E\u043B\u0438: ${messages.map((m) => String(m.role).substring(0, 4)).join(", ")}`);
            }
            return messages;
          } catch (error) {
            debugLog("error", "[QwenAdapter] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
            return [];
          }
        }
        /**
         * Полный текст диалога: содержимое ходов, склеенное переводом строки.
         * Явное переопределение базового (у Qwen путь отбора узлов свой).
         * @returns {string}
         */
        getFullDialogText() {
          try {
            return this.extractMessages().map((msg) => msg.content).join("\n");
          } catch (e) {
            return "";
          }
        }
        /**
         * Модель из UI. Живой id /chats/new — qwen3.8-max, но это НЕ дефолт: если в разметке
         * модели нет — возвращаем null («не определена»), как base-adapter.js:88-90.
         * @returns {string|null}
         */
        detectModel() {
          try {
            const selectors = ['[class*="model"] [class*="name"]', '[class*="model-select"]', '[class*="modelName"]'];
            for (let i = 0; i < selectors.length; i++) {
              const el = this._safeQuerySelector(selectors[i]);
              if (!el) continue;
              const text = String(el.textContent || "").trim();
              if (!text) continue;
              const m = /qwen[0-9.]*-[a-z]+/i.exec(text);
              if (m) return m[0].toLowerCase();
            }
          } catch (e) {
            swallowSoft(e, "adapter:qwen:detectModel");
          }
          return null;
        }
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = QwenAdapter;
      }
      (function() {
        var THINK_RE = /think|thought/i;
        var THINKING_LABEL_RE = /thinking|\bthought\b|\bдумал\b/i;
        var ATTACH_TOKEN_RE = /\$AXzLiR[A-Za-z0-9+\/=]+/g;
        function stripAttachmentTokens(s) {
          if (typeof s !== "string") return s;
          return s.replace(ATTACH_TOKEN_RE, " ").replace(/[ \t\f\v]+/g, " ");
        }
        function attrString(el, names) {
          var out = "";
          for (var i = 0; i < names.length; i++) {
            try {
              var v = el.getAttribute ? el.getAttribute(names[i]) : null;
              if (v) out += " " + v;
            } catch (e) {
            }
          }
          return out;
        }
        function classNameId(el) {
          try {
            return String(el.className || "") + " " + String(el.id || "");
          } catch (e) {
            return "";
          }
        }
        function isHiddenContainer(el) {
          var h = classNameId(el).toLowerCase();
          return h.indexOf("cdk-visually-hidden") !== -1 || h.indexOf("cdk-live-announcer") !== -1;
        }
        function isThinkingContainer(el) {
          if (THINK_RE.test(classNameId(el))) return true;
          var label = attrString(el, ["aria-label", "title"]);
          return THINKING_LABEL_RE.test(label);
        }
        function thinkingControlLabel(el) {
          var label = attrString(el, ["aria-label", "title"]);
          if (el.tagName && String(el.tagName).toLowerCase() === "button") {
            try {
              label += " " + (el.textContent || "");
            } catch (e) {
            }
          }
          return label;
        }
        function containsThinkingControl(node) {
          var found = false;
          (function scan(n, depth) {
            if (found || depth > 4) return;
            if (!n || n.nodeType !== 1) return;
            if (THINKING_LABEL_RE.test(thinkingControlLabel(n))) {
              found = true;
              return;
            }
            var ch = n.childNodes;
            for (var i = 0; i < ch.length; i++) scan(ch[i], depth + 1);
          })(node, 0);
          return found;
        }
        function containsTable(node) {
          try {
            return !!node.querySelector && !!node.querySelector("table");
          } catch (e) {
            return false;
          }
        }
        function isThinkingPanel(node) {
          if (isHiddenContainer(node) || isThinkingContainer(node)) return true;
          if (containsTable(node)) return false;
          return containsThinkingControl(node);
        }
        function cleanCell(el) {
          var clone;
          try {
            clone = el.cloneNode(true);
          } catch (e) {
            return "";
          }
          try {
            clone.querySelectorAll("script, style, button, svg").forEach(function(x) {
              x.remove();
            });
          } catch (e) {
          }
          try {
            return stripAttachmentTokens((clone.textContent || "").replace(/\s+/g, " ").trim());
          } catch (e) {
            return "";
          }
        }
        function tableToMarkdown(tableEl) {
          var rows = [];
          try {
            rows = tableEl.querySelectorAll("tr");
          } catch (e) {
            rows = [];
          }
          var lines = [];
          for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll("th, td");
            var cellTexts = [];
            for (var c = 0; c < cells.length; c++) {
              cellTexts.push(cleanCell(cells[c]));
            }
            if (cellTexts.length === 0) continue;
            lines.push("| " + cellTexts.join(" | ") + " |");
          }
          return lines.join("\n");
        }
        var BLOCK_TAGS = {
          "P": 1,
          "DIV": 1,
          "SECTION": 1,
          "ARTICLE": 1,
          "UL": 1,
          "OL": 1,
          "LI": 1,
          "H1": 1,
          "H2": 1,
          "H3": 1,
          "H4": 1,
          "H5": 1,
          "H6": 1,
          "BLOCKQUOTE": 1,
          "PRE": 1,
          "BR": 1,
          "HR": 1,
          "HEADER": 1,
          "FOOTER": 1,
          "MAIN": 1,
          "ASIDE": 1,
          "TR": 1,
          "THEAD": 1,
          "TBODY": 1
        };
        function extractGeminiResponse(root) {
          var parts = [];
          var buf = [];
          function flush() {
            if (!buf.length) return;
            var s = buf.join(" ");
            buf = [];
            s = s.replace(/\s+/g, " ").trim();
            if (s) parts.push(s);
          }
          function pushText(str) {
            if (typeof str !== "string") return;
            var t = stripAttachmentTokens(str.replace(/\s+/g, " ").trim());
            if (t) buf.push(t);
          }
          function walk(node) {
            if (!node) return;
            var type = node.nodeType;
            if (type === 3) {
              pushText(node.nodeValue || "");
              return;
            }
            if (type !== 1) return;
            if (isThinkingPanel(node)) {
              flush();
              return;
            }
            var tag = (node.tagName || "").toUpperCase();
            if (tag === "TABLE") {
              flush();
              var md = tableToMarkdown(node);
              if (md) parts.push(md);
              return;
            }
            if (BLOCK_TAGS[tag]) flush();
            var children = node.childNodes;
            for (var i2 = 0; i2 < children.length; i2++) {
              walk(children[i2]);
            }
            if (BLOCK_TAGS[tag]) flush();
          }
          if (root) {
            var rootChildren = root.childNodes;
            for (var i = 0; i < rootChildren.length; i++) {
              walk(rootChildren[i]);
            }
          }
          flush();
          var text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
          return { text, count: parts.length, parts };
        }
        var api = { extractGeminiResponse, tableToMarkdown, stripAttachmentTokens };
        if (typeof window !== "undefined") {
          window.GeminiDomParser = api;
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = api;
        }
      })();
      (function() {
        var PARSER_VERSION = "g3";
        function logSegmentParseFail(e, where) {
          try {
            console.log("[AI CM][batchexecute] segment parse fail " + where + ": " + (e && e.message || e));
          } catch (e2) {
          }
        }
        var ATTACH_TOKEN_RE = /\$AXzLiR[A-Za-z0-9+\/=]+/g;
        function stripAttachmentTokens(s) {
          if (typeof s !== "string") return s;
          return s.replace(ATTACH_TOKEN_RE, " ").replace(/[ \t\f\v]+/g, " ");
        }
        function sanitizeGeminiText2(s) {
          if (typeof s !== "string") return s;
          return s.replace(/\$AXzLiR[A-Za-z0-9+\/=\s]+/g, " ").replace(/File attachment was not previously registered/g, "").replace(/\[cite:\s*\d+\]/g, "");
        }
        function isIdLike(s) {
          return typeof s === "string" && /^(c_|r_|rc_|fbb[0-9a-f]|[0-9a-f]{16})/.test(s);
        }
        function isFileLike(s) {
          return typeof s === "string" && /\.(pdf|png|jpe?g|gif|docx?|txt|webp|csv|xlsx?)(\b|$)/i.test(s);
        }
        function isUrlLike(s) {
          return typeof s === "string" && /^https?:\/\//i.test(s);
        }
        function isTokenLike(s) {
          return typeof s === "string" && /^\$?AVuib/.test(s);
        }
        function isMimeLike(s) {
          return typeof s === "string" && /^(image|application|video|audio)\//i.test(s);
        }
        var UI_BLACKLIST = {
          "DE": 1,
          "ru": 1,
          "mk": 1,
          "generic": 1,
          "personal_context": 1,
          "google": 1,
          "\u0418\u0449\u0443 \u0432 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0435": 1,
          "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442": 1,
          "Google Search": 1,
          "true": 1,
          "false": 1
        };
        function isJunk(s) {
          if (typeof s !== "string") return true;
          var t = s.trim();
          if (t.length === 0) return true;
          if (UI_BLACKLIST[t]) return true;
          return isIdLike(t) || isFileLike(t) || isUrlLike(t) || isTokenLike(t) || isMimeLike(t);
        }
        function isUserQuestionJunk(s) {
          if (typeof s !== "string") return true;
          var t = s.trim();
          if (!t) return true;
          if (UI_BLACKLIST[t]) return true;
          return isIdLike(t) || isUrlLike(t) || isTokenLike(t) || isMimeLike(t);
        }
        var THINKING_TITLE_RE = /^\s*\*\*[^*\n]{1,120}\*\*/;
        var THINKING_BODY_RE = /^(I'm now|I've been|I am going|I'm currently|I'm focusing|I'm working|I will now|I've fleshed|I've got|I need to|I'm going to|I've shifted|My focus is|I've settled|I've outlined|I've started|I'm aiming|My approach is|I'm leaning|I'm choosing|I'm prioritizing)\b/i;
        var THINKING_BODY_EXTRA_RE = /^(I'm (?:currently|now|also|still) (?:focused|zeroing|analyzing|integrating|identifying|assessing|refining|evaluating|structuring|addressing|considering|formulating|prioritizing|parsing)|I've (?:been|now) (?:analyzing|noted|shifted|outlined|fleshed)|My (?:focus|goal) is|Specifically, I've)\b/i;
        var THINKING_GERUND_RE = /^(Assessing|Defining|Refining|Outlining|Constructing|Uncovering|Tracing|Confirming|Reassuring|Clarifying|Deepening|Integrating|Evaluating|Formulating|Focusing|Prioritizing|Solidifying|Exploring|Analyzing|Reviewing|Validating|Synthesizing|Considering|Identifying|Structuring|Addressing|Reconstructing)\b/;
        var FILE_ATTACHMENT_RE = /File attachment was not previously registered/;
        function hasCyrillic(s) {
          for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c >= 1024 && c <= 1279) return true;
          }
          return false;
        }
        function isThinkingStart(s) {
          if (typeof s !== "string") return false;
          var t = s.trim();
          if (!t) return false;
          if (hasCyrillic(t)) return false;
          if (THINKING_TITLE_RE.test(t)) return true;
          if (THINKING_BODY_RE.test(t)) return true;
          if (THINKING_BODY_EXTRA_RE.test(t)) return true;
          if (THINKING_GERUND_RE.test(t)) return true;
          return false;
        }
        function isResponseSegment(s) {
          if (typeof s !== "string") return false;
          var t = s.trim();
          if (!t) return false;
          if (hasCyrillic(t)) return true;
          if (/```/.test(t)) return true;
          if (/^\s*\|.+\|\s*$/m.test(t)) return true;
          return false;
        }
        function headIsThinking(node, depth) {
          if (typeof node === "string") return isThinkingStart(node);
          if (Array.isArray(node)) {
            if (depth > 4) return false;
            return headIsThinking(node[0], depth + 1);
          }
          return false;
        }
        function isThoughtBlock(node) {
          if (!Array.isArray(node)) return false;
          return headIsThinking(node[0], 0);
        }
        function collectTurnText(node, out, state) {
          state = state || { inThinking: false };
          if (typeof node === "string") {
            var s = sanitizeGeminiText2(node);
            var t = s.trim();
            if (!t) return;
            if (FILE_ATTACHMENT_RE.test(t)) return;
            if (isJunk(t)) return;
            if (state.inThinking) {
              if (!isResponseSegment(t)) return;
              state.inThinking = false;
              out.push(s);
              return;
            }
            if (isThinkingStart(t)) {
              state.inThinking = true;
              return;
            }
            out.push(s);
            return;
          }
          if (!Array.isArray(node)) return;
          for (var k = 0; k < node.length; k++) collectTurnText(node[k], out, state);
        }
        function extractUserQuestion(turn) {
          var q = "";
          try {
            q = turn[2][0][0];
          } catch (e) {
            q = "";
          }
          if (typeof q === "string") {
            var s = sanitizeGeminiText2(q).trim();
            if (s && !isUserQuestionJunk(s) && !isThinkingStart(s)) return s;
          }
          return "";
        }
        var MODEL_NAME_RE = /^\s*(?:Gemini\s*[\d.]?|\d+(?:\.\d+)?\s+(?:Flash|Pro|Ultra|Gemini))/i;
        function extractModelName(node) {
          var found = null;
          (function walk(n) {
            if (found) return;
            if (typeof n === "string") {
              if (n.length < 60 && n.indexOf("\n") < 0 && MODEL_NAME_RE.test(n)) {
                found = n.trim();
                return;
              }
            } else if (Array.isArray(n)) {
              for (var i = 0; i < n.length; i++) {
                walk(n[i]);
                if (found) return;
              }
            }
          })(node);
          return found || "";
        }
        function extractTurnId(node) {
          var found = null;
          (function walk(n) {
            if (found) return;
            if (typeof n === "string" && /^r_[0-9a-f]+$/.test(n)) {
              found = n;
              return;
            } else if (Array.isArray(n)) {
              for (var i = 0; i < n.length; i++) {
                walk(n[i]);
                if (found) return;
              }
            }
          })(node);
          return found;
        }
        function extractTurnR1(t) {
          try {
            if (Array.isArray(t) && Array.isArray(t[1]) && typeof t[1][1] === "string") return t[1][1];
          } catch (e) {
          }
          return null;
        }
        function extractTurnTs(t) {
          try {
            if (Array.isArray(t) && Array.isArray(t[4]) && typeof t[4][0] === "number" && t[4][0] > 1e9) return t[4][0];
          } catch (e) {
          }
          return 0;
        }
        var THINKING_ASSISTANT_RE = /^([A-Z][a-z]+ing\b|I'm\b|I've\b|My (?:focus|goal)\b|sr |Ev )/;
        var LEADING_THINKING_RE = /^\s*\*?\*?([A-Z][a-z]+ing\b|I'm|I've|My (focus|goal)|sr |Ev )/;
        function isThinkingAssistant(s) {
          if (typeof s !== "string") return false;
          var t = s.trim();
          if (!t) return false;
          if (hasCyrillic(t)) return false;
          return THINKING_ASSISTANT_RE.test(t);
        }
        function firstCyrillicIndex(s) {
          for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c >= 1024 && c <= 1279) return i;
          }
          return -1;
        }
        function stripLeadingThinking(s) {
          if (typeof s !== "string") return s;
          var t = s.trim();
          if (!LEADING_THINKING_RE.test(t)) return s;
          var idx = firstCyrillicIndex(t);
          if (idx < 0) return "";
          return t.slice(idx);
        }
        function hasMarkdownMarkup(t) {
          if (typeof t !== "string") return false;
          if (/\*\*[^*\n]+\*\*/.test(t)) return true;
          if (/^\s*#{1,6}\s/m.test(t)) return true;
          if (/^\s*\|.+\|\s*$/m.test(t)) return true;
          if (/```/.test(t)) return true;
          if (/^\s*[-*+]\s/m.test(t)) return true;
          if (/^\s*>\s/m.test(t)) return true;
          if (/\[[^\]]+\]\([^)]+\)/.test(t)) return true;
          if (/^\s*(---+|\*\*\*+|___+)\s*$/m.test(t)) return true;
          return false;
        }
        function pickCanonicalAnswer(parts) {
          if (!parts || !parts.length) return "";
          for (var i = 0; i < parts.length; i++) {
            if (hasMarkdownMarkup(parts[i])) return parts[i];
          }
          return parts[0];
        }
        function extractCanonicalAnswer(turn) {
          var cands = [];
          var isFallback = false;
          try {
            var box = Array.isArray(turn[3]) && Array.isArray(turn[3][0]) && Array.isArray(turn[3][0][0]) ? turn[3][0][0][1] : null;
            if (Array.isArray(box)) {
              for (var i = 0; i < box.length; i++) cands.push(box[i]);
            } else if (typeof box === "string") {
              cands.push(box);
            }
          } catch (e) {
          }
          if (!cands.length) {
            isFallback = true;
            try {
              collectTurnText(turn[3], cands);
            } catch (e) {
              swallowSoft(e, "gemini-utils:extractCanonicalAnswer-fallback");
            }
          }
          var cleaned = [];
          for (i = 0; i < cands.length; i++) {
            if (typeof cands[i] !== "string") continue;
            var s = sanitizeGeminiText2(cands[i]).trim();
            if (s) cleaned.push(s);
          }
          return { text: pickCanonicalAnswer(cleaned), isFallback };
        }
        var DR_REPORT_MIN_LEN = 1e3;
        var DR_PLAN_MIN_LEN = 60;
        function collectDrStrings(node, out, minLen, depth) {
          try {
            if (typeof node === "string") {
              if (node.length >= minLen) out.push(node);
              return;
            }
            if (Array.isArray(node) && depth < 40) {
              for (var i = 0; i < node.length; i++) collectDrStrings(node[i], out, minLen, depth + 1);
            }
          } catch (e) {
            swallowSoft(e, "gemini-utils:collectDrStrings");
          }
        }
        function ctText(s) {
          return sanitizeGeminiText2(s).trim();
        }
        function extractDrTexts(realTurns) {
          var res = { planText: "", reportText: "" };
          try {
            if (!Array.isArray(realTurns)) return res;
            var cands = [];
            for (var i = 0; i < realTurns.length; i++) collectDrStrings(realTurns[i], cands, DR_REPORT_MIN_LEN, 0);
            var best = "";
            for (var j = 0; j < cands.length; j++) {
              var s = cands[j];
              if (isUrlLike(s) || isJunk(s)) continue;
              if (!best || s.length > best.length) best = s;
            }
            if (best) res.reportText = ctText(best);
            var pc = [];
            for (var k = 0; k < realTurns.length; k++) collectDrStrings(realTurns[k], pc, DR_PLAN_MIN_LEN, 0);
            var pbest = "";
            for (var q = 0; q < pc.length; q++) {
              var ps = pc[q];
              if (isUrlLike(ps) || isJunk(ps)) continue;
              if (res.reportText && ps === res.reportText) continue;
              if (ps.indexOf("deep_research_confirmation_content") !== -1) continue;
              if (ps.indexOf("immersive_entry_chip") !== -1) continue;
              if (res.reportText && ps.length >= res.reportText.length) continue;
              if (!pbest || ps.length > pbest.length) pbest = ps;
            }
            if (pbest) res.planText = ctText(pbest);
          } catch (e) {
            swallowSoft(e, "gemini-utils:extractDrTexts");
          }
          return res;
        }
        var lastDrTexts = { planText: "", reportText: "" };
        function __setDrTexts(d) {
          try {
            lastDrTexts = d || { planText: "", reportText: "" };
          } catch (e) {
          }
        }
        function injectDrLinks(text, dr) {
          try {
            if (typeof text !== "string") return text;
            var t = text;
            if (dr && dr.reportText && t.indexOf("immersive_entry_chip/0") !== -1) {
              t = t.replace(/https?:\/\/googleusercontent\.com\/immersive_entry_chip\/0/gi, dr.reportText);
            }
            if (dr && dr.planText && t.indexOf("deep_research_confirmation_content/0") !== -1) {
              t = t.replace(/https?:\/\/googleusercontent\.com\/deep_research_confirmation_content\/0/gi, dr.planText);
            }
            return t;
          } catch (e) {
            return text;
          }
        }
        function buildTurnMessages(turn) {
          var question = extractUserQuestion(turn);
          var canon = extractCanonicalAnswer(turn);
          var answer = canon.text.replace(/\n{3,}/g, "\n\n").trim();
          var msgs = [];
          if (question) msgs.push({ role: "user", text: question });
          if (answer) {
            var drAn = injectDrLinks(answer, lastDrTexts);
            if (canon.isFallback) {
              if (isThinkingAssistant(drAn)) {
              } else {
                var kept = stripLeadingThinking(drAn);
                if (kept) msgs.push({ role: "assistant", text: kept });
              }
            } else {
              msgs.push({ role: "assistant", text: drAn });
            }
          }
          return msgs;
        }
        function handleOuter(outer, out) {
          try {
            if (!Array.isArray(outer) || !Array.isArray(outer[0])) return;
            if (outer[0][1] !== "hNvQHb") return;
            var inner = outer[0][2];
            if (typeof inner !== "string") return;
            var turns = JSON.parse(inner);
            if (!Array.isArray(turns)) return;
            var realTurns = Array.isArray(turns[0]) && Array.isArray(turns[0][0]) ? turns[0] : turns;
            try {
              lastDrTexts = extractDrTexts(realTurns);
            } catch (eD13) {
            }
            var rawCount = realTurns.length;
            for (var i = rawCount - 1; i >= 0; i--) {
              var t = realTurns[i];
              if (!Array.isArray(t)) continue;
              var modelName = extractModelName(t);
              var turnId = extractTurnId(t) || "idx" + i;
              var turnTs = extractTurnTs(t);
              var r1 = extractTurnR1(t);
              var msgs = buildTurnMessages(t);
              for (var m = 0; m < msgs.length; m++) {
                var role = msgs[m].role === "user" ? "user" : "assistant";
                out.push({
                  role,
                  content: msgs[m].text,
                  model: modelName || "",
                  id: turnId + "_" + role,
                  ts: turnTs,
                  r1
                });
              }
            }
          } catch (e) {
            logSegmentParseFail(e, "handleOuter");
          }
        }
        function parseByBytes(raw, out) {
          var bytes;
          try {
            bytes = new TextEncoder().encode(raw);
          } catch (e) {
            return;
          }
          var pos = 0;
          if (bytes.length >= 4 && bytes[0] === 41 && bytes[1] === 93 && bytes[2] === 125 && bytes[3] === 39) pos = 4;
          var dec = new TextDecoder("utf-8");
          var guard = 0;
          while (pos < bytes.length && guard++ < 200) {
            while (pos < bytes.length && (bytes[pos] < 48 || bytes[pos] > 57)) pos++;
            if (pos >= bytes.length) break;
            var n = 0;
            while (pos < bytes.length && bytes[pos] >= 48 && bytes[pos] <= 57) {
              n = n * 10 + (bytes[pos] - 48);
              pos++;
            }
            if (n <= 0) {
              pos++;
              continue;
            }
            if (pos < bytes.length && bytes[pos] === 10) pos++;
            var end = pos + n;
            if (end > bytes.length) end = bytes.length;
            var payloadStr = dec.decode(bytes.subarray(pos, end));
            pos = end;
            if (pos < bytes.length && bytes[pos] === 10) pos++;
            if (payloadStr.indexOf("hNvQHb") !== -1) {
              try {
                handleOuter(JSON.parse(payloadStr), out);
              } catch (e) {
                logSegmentParseFail(e, "parseByBytes");
              }
            }
          }
        }
        function parseByLines(raw, out) {
          var lines = raw.split("\n");
          for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            if (!ln || ln === ")]}'") continue;
            var c0 = ln.charAt(0);
            if (c0 !== "[" && c0 !== "{") continue;
            if (ln.indexOf("hNvQHb") === -1) continue;
            try {
              handleOuter(JSON.parse(ln), out);
            } catch (e) {
              logSegmentParseFail(e, "parseByLines");
            }
          }
        }
        function parseGeminiHistory(raw) {
          var parsed = [];
          parseByBytes(raw, parsed);
          if (!parsed.length) parseByLines(raw, parsed);
          var model = "";
          for (var i = 0; i < parsed.length; i++) {
            if (parsed[i].model) {
              model = parsed[i].model;
              break;
            }
          }
          var totalChars = 0;
          var messages = [];
          var texts = [];
          for (var j = 0; j < parsed.length; j++) {
            var txt = parsed[j].content || "";
            totalChars += txt.length;
            messages.push({ role: parsed[j].role, text: txt, model: parsed[j].model || "", id: parsed[j].id, ts: parsed[j].ts || 0, r1: parsed[j].r1 || null });
            texts.push(txt);
          }
          return {
            messages,
            model: model || "Gemini 2.5 Pro",
            tokens: Math.ceil(totalChars / 4),
            text: texts.join("\n"),
            count: messages.length
          };
        }
        var api = {
          PARSER_VERSION,
          stripAttachmentTokens,
          sanitizeGeminiText: sanitizeGeminiText2,
          collectTurnText,
          isThinkingAssistant,
          firstCyrillicIndex,
          stripLeadingThinking,
          splitTurnMessages: buildTurnMessages,
          extractDrTexts,
          injectDrLinks,
          __setDrTexts,
          parseGeminiHistory
        };
        if (typeof window !== "undefined") {
          window.GeminiBatchexecuteParser = api;
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = api;
        }
      })();
      (function() {
        function decodeEntities(s) {
          if (!s) return "";
          var out = String(s);
          out = out.replace(new RegExp("&quot;", "g"), '"');
          out = out.replace(new RegExp("&amp;", "g"), "&");
          out = out.replace(new RegExp("&#39;", "g"), "'");
          out = out.replace(new RegExp("&lt;", "g"), "<");
          out = out.replace(new RegExp("&gt;", "g"), ">");
          out = out.replace(new RegExp("&nbsp;", "g"), " ");
          out = out.replace(/&#(\d+);/g, function(m, d) {
            try {
              return String.fromCharCode(parseInt(d, 10));
            } catch (e) {
              return m;
            }
          });
          return out;
        }
        var FENCE_RE = /(`{3,})[\s\S]*?\1/g;
        function mapOutsideFences(s, fn) {
          var str = String(s == null ? "" : s);
          var out = "";
          var last = 0;
          var m;
          FENCE_RE.lastIndex = 0;
          while ((m = FENCE_RE.exec(str)) !== null) {
            out += fn(str.slice(last, m.index)) + m[0];
            last = m.index + m[0].length;
          }
          return out + fn(str.slice(last));
        }
        function stripTagsSeg(seg) {
          return String(seg).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        }
        function stripTags(html) {
          if (!html) return "";
          return mapOutsideFences(html, stripTagsSeg).replace(/^\s+/, "").replace(/\s+$/, "");
        }
        function sanitizeAssistantSeg(seg) {
          return String(seg).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/[ \t\f\v]+/g, " ").split("\n").map(function(ln) {
            return ln.trim();
          }).join("\n").replace(/\n{3,}/g, "\n\n");
        }
        function sanitizeAssistant(s) {
          if (!s) return "";
          return mapOutsideFences(s, sanitizeAssistantSeg).replace(/^\s+/, "").replace(/\s+$/, "");
        }
        function tableCellText(cellEl) {
          var clone = cellEl.cloneNode(true);
          clone.querySelectorAll("script, style, button, svg").forEach(function(el) {
            el.remove();
          });
          return stripTags(decodeEntities(clone.innerHTML)).trim();
        }
        function tableToMarkdown(tableEl) {
          var rows = tableEl.querySelectorAll("tr");
          var lines = [];
          for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll("th, td");
            var cellTexts = [];
            for (var c = 0; c < cells.length; c++) {
              cellTexts.push(tableCellText(cells[c]));
            }
            if (cellTexts.length === 0) continue;
            lines.push("| " + cellTexts.join(" | ") + " |");
          }
          return lines.join("\n");
        }
        function isQuestionHeading(el) {
          return el.tagName === "H2" && el.className && String(el.className).indexOf("iMqumd") !== -1;
        }
        var CODE_CONTAINER_SEL = 'pre, code, [class*="code-block"], [class*="codeBlock"], [class*="codeblock"]';
        var CODE_LANG_RE = /^[A-Za-z][A-Za-z0-9+#._-]{0,19}$/;
        function classOf(el) {
          try {
            return String(el && el.className || "");
          } catch (e) {
            return "";
          }
        }
        function isCodeLikeNode(el) {
          if (!el || !el.tagName) return false;
          var tag = String(el.tagName).toUpperCase();
          return tag === "PRE" || tag === "CODE" || /code-?block/i.test(classOf(el));
        }
        function codeTextOf(el) {
          if (!el || typeof el.cloneNode !== "function") return "";
          var clone;
          try {
            clone = el.cloneNode(true);
          } catch (e) {
            return "";
          }
          try {
            var junk = clone.querySelectorAll("script, style, button, svg");
            for (var i = 0; i < junk.length; i++) {
              if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
            }
            var brs = clone.querySelectorAll("br");
            var doc = clone.ownerDocument || (typeof document !== "undefined" ? document : null);
            for (var b = 0; b < brs.length; b++) {
              if (brs[b].parentNode && doc && doc.createTextNode) {
                brs[b].parentNode.replaceChild(doc.createTextNode("\n"), brs[b]);
              }
            }
          } catch (e2) {
          }
          var txt = "";
          try {
            txt = String(clone.textContent || "");
          } catch (e3) {
            txt = "";
          }
          if (txt.indexOf("\n") === -1 && clone.children && clone.children.length > 1) {
            var allBlock = true;
            for (var k = 0; k < clone.children.length; k++) {
              if (!/^(DIV|P|LI|TR|SECTION|ARTICLE|FIGURE|BLOCKQUOTE|H[1-6])$/.test(String(clone.children[k].tagName || "").toUpperCase())) {
                allBlock = false;
                break;
              }
            }
            if (allBlock) {
              var lines = [];
              for (var k2 = 0; k2 < clone.children.length; k2++) {
                lines.push(String(clone.children[k2].textContent || ""));
              }
              var joined = lines.join("\n");
              if (joined.replace(/\s+/g, "")) txt = joined;
            }
          }
          return txt.replace(/[ \t]+$/gm, "").replace(/^\n+/, "").replace(/\s+$/, "");
        }
        function codeBodyElement(el) {
          try {
            var inner = el.querySelectorAll ? el.querySelectorAll("pre, code") : null;
            if (inner && inner.length) return inner[inner.length - 1];
          } catch (e) {
          }
          return el;
        }
        function detectCodeLang(el, langHint) {
          if (langHint != null && CODE_LANG_RE.test(String(langHint).trim())) return String(langHint).trim();
          var attrNames = ["code-lang", "data-lang", "data-code-lang"];
          try {
            for (var a = 0; a < attrNames.length; a++) {
              var v = el && el.getAttribute ? el.getAttribute(attrNames[a]) : null;
              if (v && CODE_LANG_RE.test(String(v).trim())) return String(v).trim();
            }
          } catch (e) {
          }
          var m = classOf(el).match(/(?:^|[\s_-])(?:language|lang)[-_]([A-Za-z][A-Za-z0-9+#._-]{0,19})/);
          if (m && CODE_LANG_RE.test(m[1])) return m[1];
          var cur = el;
          for (var up = 0; cur && up < 4; up++) {
            var prev = cur.previousSibling;
            for (var hops = 0; prev && hops < 3; hops++) {
              var t = "";
              try {
                t = String(prev.textContent || "").trim();
              } catch (e2) {
                t = "";
              }
              if (t) {
                if (CODE_LANG_RE.test(t)) return t;
                break;
              }
              prev = prev.previousSibling;
            }
            cur = cur.parentNode;
          }
          return "";
        }
        function isCodeBlockElement(el) {
          if (!el || !el.tagName) return false;
          var tag = String(el.tagName).toUpperCase();
          if (/code-?block/i.test(classOf(el))) return true;
          if (tag === "PRE") return true;
          if (tag !== "CODE") return false;
          if (/(?:^|[\s_-])(?:language|lang)[-_]/.test(classOf(el))) return true;
          return codeTextOf(el).indexOf("\n") !== -1;
        }
        function renderCodeBlock(node, langHint) {
          if (!node) return "";
          var body = codeBodyElement(node);
          var text = codeTextOf(body);
          if (!text) text = codeTextOf(node);
          if (!text) return "";
          var lang = detectCodeLang(node, langHint) || detectCodeLang(body, langHint);
          var fence = "```";
          while (text.indexOf(fence) !== -1) fence += "`";
          return fence + lang + "\n" + text + "\n" + fence;
        }
        function answerTextOf(node) {
          if (!node) return "";
          if (isCodeBlockElement(node)) return renderCodeBlock(node);
          if (typeof node.cloneNode !== "function") return "";
          var clone;
          try {
            clone = node.cloneNode(true);
          } catch (e) {
            return "";
          }
          try {
            var junk = clone.querySelectorAll("script, style, button, svg");
            for (var i = 0; i < junk.length; i++) {
              if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
            }
            var found = clone.querySelectorAll ? clone.querySelectorAll(CODE_CONTAINER_SEL) : [];
            var outer = [];
            for (var f = 0; f < found.length; f++) {
              if (!isCodeBlockElement(found[f])) continue;
              var nested = false;
              for (var o = 0; o < outer.length; o++) {
                if (outer[o].contains && outer[o].contains(found[f])) {
                  nested = true;
                  break;
                }
              }
              if (!nested) outer.push(found[f]);
            }
            var doc = clone.ownerDocument || (typeof document !== "undefined" ? document : null);
            for (var c = outer.length - 1; c >= 0; c--) {
              var fenced = renderCodeBlock(outer[c]);
              if (!fenced || !outer[c].parentNode || !doc || !doc.createTextNode) continue;
              outer[c].parentNode.replaceChild(doc.createTextNode("\n" + fenced + "\n"), outer[c]);
            }
          } catch (e2) {
          }
          var txt = "";
          try {
            txt = String(clone.textContent || "");
          } catch (e3) {
            txt = "";
          }
          return txt.trim();
        }
        function answerDomNodes(root) {
          var doc = root || (typeof document !== "undefined" ? document : null);
          if (!doc || typeof doc.querySelectorAll !== "function") return [];
          var nodes = doc.querySelectorAll(".n6owBd.awi2gc, " + CODE_CONTAINER_SEL);
          var out = [];
          for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (isCodeLikeNode(el) && !isCodeBlockElement(el)) continue;
            var nested = false;
            for (var j = 0; j < out.length; j++) {
              if (out[j].contains && out[j].contains(el)) {
                nested = true;
                break;
              }
            }
            if (nested) continue;
            out.push(el);
          }
          return out;
        }
        var WEB_SEARCH_CHIP_RE = /(?:Самые популярные результаты веб-поиска по этой теме|People also search|Related searches|Похожие запросы|Связанные запросы)/i;
        var FOREIGN_QUESTION_RE = /^Вы сказали:\s*"/;
        function nodeText(node) {
          try {
            return (node.textContent || "").trim();
          } catch (e) {
            return "";
          }
        }
        function isWebSearchChipNode(node) {
          return WEB_SEARCH_CHIP_RE.test(nodeText(node));
        }
        function isForeignQuestionNode(node) {
          return FOREIGN_QUESTION_RE.test(nodeText(node));
        }
        function listItemToMarkdown(liEl) {
          var clone = liEl.cloneNode(true);
          clone.querySelectorAll("script, style, button, svg").forEach(function(el) {
            el.remove();
          });
          var label = null;
          var b = clone.querySelector("strong, b");
          if (b) {
            label = (b.textContent || "").replace(/\s+/g, " ").trim();
            b.remove();
          }
          var rest = stripTags(decodeEntities(clone.innerHTML)).trim();
          if (label) {
            return "- **" + label + "**" + (rest ? ": " + rest : "");
          }
          return rest ? "- " + rest : "";
        }
        function listToText(listEl) {
          var items = listEl.querySelectorAll("li");
          var lines = [];
          for (var r = 0; r < items.length; r++) {
            var t = listItemToMarkdown(items[r]);
            if (t) lines.push(t);
          }
          return lines.join("\n");
        }
        function gatherAnswerContentNodes(doc) {
          var raw = doc.querySelectorAll('.n6owBd.awi2gc, table, [role="heading"], h2, h3, h4, ul, ol, li, [role="list"], [role="listitem"], ' + CODE_CONTAINER_SEL);
          var out = [];
          for (var i = 0; i < raw.length; i++) {
            var el = raw[i];
            if (isQuestionHeading(el)) continue;
            if (isCodeLikeNode(el) && !isCodeBlockElement(el)) continue;
            var nested = false;
            for (var j = 0; j < out.length; j++) {
              if (out[j].contains && out[j].contains(el)) {
                nested = true;
                break;
              }
            }
            if (nested) continue;
            out.push(el);
          }
          return out;
        }
        function assignContentToTurns(turnsArr, contentNodes) {
          var answers = [];
          var skipAfterChip = [];
          for (var ti = 0; ti < turnsArr.length; ti++) {
            answers[ti] = [];
            skipAfterChip[ti] = false;
          }
          for (var n = 0; n < contentNodes.length; n++) {
            var node = contentNodes[n];
            var assigned = -1;
            for (var t2 = 0; t2 < turnsArr.length; t2++) {
              if (turnsArr[t2].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) {
                assigned = t2;
              } else {
                break;
              }
            }
            if (assigned < 0) continue;
            if (isForeignQuestionNode(node)) continue;
            if (isWebSearchChipNode(node)) {
              skipAfterChip[assigned] = true;
              continue;
            }
            if (skipAfterChip[assigned]) continue;
            var part = null;
            if (node.tagName === "TABLE") {
              var md = tableToMarkdown(node);
              if (md) part = md;
            } else if (node.tagName === "UL" || node.tagName === "OL") {
              var lt = listToText(node);
              if (lt) part = lt;
            } else {
              var ct = answerTextOf(node).trim();
              if (ct) part = ct;
            }
            if (part) answers[assigned].push(part);
          }
          return answers;
        }
        function readThreadId(doc) {
          try {
            var el = doc.querySelector("[data-session-thread-id]");
            if (el) {
              var v = el.getAttribute("data-session-thread-id");
              return v ? v.trim() : "";
            }
          } catch (e) {
          }
          return "";
        }
        function parseGoogleFolwrOpen(htmlText) {
          var turns = [];
          var messages = [];
          if (!htmlText || typeof htmlText !== "string") {
            return { threadId: "", turns, messages, text: "", count: 0 };
          }
          var doc;
          try {
            doc = new DOMParser().parseFromString(htmlText, "text/html");
          } catch (e) {
            return { threadId: "", turns, messages, text: "", count: 0 };
          }
          var threadId = readThreadId(doc);
          var turnEls = doc.querySelectorAll('[data-scope-id="turn"]');
          var allAimfl = doc.querySelectorAll('[data-subtree="aimfl"]');
          var turnsArr = Array.prototype.slice.call(turnEls);
          var tgQuestions = [];
          try {
            var tgRe = /<!--TgQPHd\|[\s\S]*?-->/g;
            var m;
            while ((m = tgRe.exec(htmlText)) !== null) {
              var c = decodeEntities(m[0]);
              var longRe = /"([^"]{20,})"/g;
              var lm;
              var found = null;
              while ((lm = longRe.exec(c)) !== null) {
                var cand = lm[1];
                if (cand.indexOf("\\u0026") !== -1) continue;
                if (cand.indexOf("OLOoOd") !== -1) continue;
                if (cand.indexOf("dRog6c") !== -1) continue;
                if (cand.indexOf("TgQPHd") !== -1) continue;
                if (!/[а-яёА-ЯЁ]/.test(cand) && cand.indexOf(" ") === -1) continue;
                found = cand;
                break;
              }
              tgQuestions.push(found);
            }
          } catch (e) {
            swallowSoft(e, "gsa-utils:parseGoogleFolwrOpen-tgqphd");
          }
          var contentNodes = gatherAnswerContentNodes(doc);
          var answers = assignContentToTurns(turnsArr, contentNodes);
          for (var i = 0; i < turnsArr.length; i++) {
            var turn = turnsArr[i];
            var question = null;
            var h2 = turn.querySelector("h2.iMqumd");
            if (h2) {
              var raw = (h2.textContent || "").trim();
              var qm = raw.match(/^Вы сказали:\s*"([\s\S]*)"$/);
              question = qm ? qm[1].trim() : raw;
            }
            var assistantText = answers[i].length > 0 ? answers[i].join("\n\n") : null;
            if (!assistantText) {
              var nestedAimfl = turn.querySelector('[data-subtree="aimfl"]');
              if (nestedAimfl) {
                var nat = (nestedAimfl.textContent || "").trim();
                if (nat) assistantText = nat;
              }
            }
            if (!assistantText && allAimfl[i]) {
              var at = (allAimfl[i].textContent || "").trim();
              if (at) assistantText = at;
            }
            if (!question && tgQuestions[i]) question = tgQuestions[i];
            turns.push({
              id: turn.getAttribute && turn.getAttribute("jsuid") || "idx" + i,
              userText: question || null,
              assistantText: assistantText || null
            });
          }
          if (turns.length === 0) {
            var folifAnswer = null;
            for (var aa = 0; aa < allAimfl.length; aa++) {
              var at2 = (allAimfl[aa].textContent || "").trim();
              if (at2) {
                folifAnswer = at2;
                break;
              }
            }
            if (!folifAnswer && contentNodes.length > 0) {
              var firstNode = contentNodes[0];
              if (firstNode.tagName === "TABLE") {
                folifAnswer = tableToMarkdown(firstNode);
              } else {
                folifAnswer = answerTextOf(firstNode).trim() || null;
              }
            }
            var folifQuestion = tgQuestions.length > 0 ? tgQuestions[0] : null;
            if (folifQuestion || folifAnswer) {
              turns.push({ id: "folif_" + Date.now(), userText: folifQuestion, assistantText: folifAnswer });
            }
          }
          for (var t = 0; t < turns.length; t++) {
            var t2 = turns[t];
            if (t2.userText) messages.push({ role: "user", text: stripTags(decodeEntities(t2.userText)) });
            if (t2.assistantText) messages.push({ role: "assistant", text: sanitizeAssistant(t2.assistantText) });
          }
          var text = "";
          for (var mi = 0; mi < messages.length; mi++) {
            text += (mi > 0 ? "\n" : "") + messages[mi].text;
          }
          return { threadId, turns, messages, text, count: messages.length };
        }
        function countTurnContainers(htmlText) {
          if (!htmlText || typeof htmlText !== "string") return 0;
          try {
            var doc = new DOMParser().parseFromString(htmlText, "text/html");
            return doc.querySelectorAll('[data-scope-id="turn"]').length;
          } catch (e) {
            return 0;
          }
        }
        function extractTurnsFromDocument(doc) {
          if (!doc || typeof doc.querySelectorAll !== "function") return [];
          var turns = [];
          try {
            var turnEls = doc.querySelectorAll('[data-scope-id="turn"]');
            var allAimfl = doc.querySelectorAll('[data-subtree="aimfl"]');
            var turnsArr = Array.prototype.slice.call(turnEls);
            var questions = [];
            for (var i = 0; i < turnsArr.length; i++) {
              var h2 = turnsArr[i].querySelector("h2.iMqumd");
              var q = null;
              if (h2) {
                var raw = (h2.textContent || "").trim();
                var m = raw.match(/^Вы сказали:\s*"([\s\S]*)"$/);
                q = m ? m[1].trim() : raw;
              }
              questions.push(q);
            }
            var answers = [];
            for (var t = 0; t < turnsArr.length; t++) answers[t] = [];
            var blocks = answerDomNodes(doc);
            for (var b = 0; b < blocks.length; b++) {
              var blk = blocks[b];
              var assigned = -1;
              for (var t2 = 0; t2 < turnsArr.length; t2++) {
                if (turnsArr[t2].compareDocumentPosition(blk) & Node.DOCUMENT_POSITION_FOLLOWING) assigned = t2;
                else break;
              }
              if (assigned >= 0 && assigned < turnsArr.length) {
                var txt = answerTextOf(blk).trim();
                if (txt) answers[assigned].push(txt);
              }
            }
            for (var k = 0; k < turnsArr.length; k++) {
              var joined = answers[k].length ? answers[k].join("\n\n") : null;
              if (!joined && allAimfl[k]) {
                var at = (allAimfl[k].textContent || "").trim();
                if (at) joined = at;
              }
              turns.push({
                id: turnsArr[k].getAttribute && turnsArr[k].getAttribute("jsuid") || "idx" + k,
                userText: questions[k] || null,
                assistantText: joined || null
              });
            }
          } catch (e) {
            swallowSoft(e, "gsa-utils:extractTurnsFromDocument");
          }
          return turns;
        }
        function extractContinuationToken(htmlText) {
          if (!htmlText || typeof htmlText !== "string") return null;
          try {
            var doc = new DOMParser().parseFromString(htmlText, "text/html");
            var els = doc.querySelectorAll("[data-mstk]");
            var last = null;
            for (var i = 0; i < els.length; i++) {
              var v = els[i].getAttribute("data-mstk");
              if (v) last = v.trim();
            }
            return last;
          } catch (e) {
            return null;
          }
        }
        function normalizeTurnKeyPart(s) {
          return String(s == null ? "" : s).toLowerCase().replace(/\u00a0/g, " ").replace(/[^a-zа-яё0-9]+/g, "");
        }
        function isAnswerWrapperTail(tail) {
          var t = String(tail == null ? "" : tail);
          var body = t.replace(/^["»”']{0,2}/, "").replace(/^[\s.,:;-]{0,4}/, "");
          return body.replace(/\s+/g, "").length > 0;
        }
        var QUESTION_ASK_RE = /^(?:в\s+)?(?:ответ(?:е)?(?:\s+на\s+вопрос)?|на\s+вопрос|вопрос)\s*:?\s*/i;
        function wrapperPrefix(text) {
          var s = String(text == null ? "" : text);
          var head = s.slice(0, 96);
          var at = head.indexOf(":");
          if (at === -1) return null;
          var after = head.slice(at + 1);
          var m = /^\s*"/.exec(after);
          if (!m) return null;
          return s.slice(0, at + 1 + m[0].length);
        }
        function answerWrapperParts(text) {
          var s = String(text == null ? "" : text);
          var prefix = wrapperPrefix(s);
          if (!prefix) return null;
          var rest = s.slice(prefix.length);
          var close = rest.indexOf('"');
          if (close === -1) return null;
          var tail = rest.slice(close + 1);
          if (!isAnswerWrapperTail(tail)) return null;
          var question = rest.slice(0, close).trim();
          if (!question) return null;
          var body = tail.replace(/^["»”']{0,2}/, "").replace(/^[\s.,:;-]+/, "");
          if (!body) return null;
          return { question, body };
        }
        function canonicalAnswerBody(text) {
          var wrapper = answerWrapperParts(text);
          if (wrapper) return wrapper.body;
          var s = String(text == null ? "" : text);
          try {
            var q = QUESTION_ASK_RE.exec(s);
            if (q) {
              var rest2 = s.slice(q[0].length);
              var close2 = rest2.indexOf('"?');
              if (close2 !== -1 && close2 < 200) {
                var body2 = rest2.slice(close2 + 2).replace(/^[\s.,:;-]+/, "");
                if (body2) s = body2;
              }
            }
          } catch (e) {
            return String(text == null ? "" : text);
          }
          return s;
        }
        function canonicalTurnKeyOf(turn) {
          if (!turn) return "";
          var wrapper = answerWrapperParts(turn.assistantText);
          var u = normalizeTurnKeyPart(turn.userText);
          if (!u && wrapper) u = normalizeTurnKeyPart(wrapper.question);
          var a = normalizeTurnKeyPart(wrapper ? wrapper.body : canonicalAnswerBody(turn.assistantText));
          return u + "||" + a;
        }
        function canonicalizeTurnForThread(turn) {
          if (!turn) return turn;
          var question = turn.userText == null ? "" : String(turn.userText).trim();
          if (!question) {
            var wrapper = answerWrapperParts(turn.assistantText);
            if (wrapper) question = wrapper.question;
          }
          return {
            id: turn.id,
            userText: question || null,
            assistantText: turn.assistantText == null ? null : turn.assistantText
          };
        }
        function isBetterTurn(candidate, current) {
          if (!current) return true;
          var la = String(candidate && candidate.assistantText || "").length;
          var lb = String(current && current.assistantText || "").length;
          if (la !== lb) return la > lb;
          return String(candidate && candidate.userText || "").length > String(current && current.userText || "").length;
        }
        function turnRecord(t, idFallback) {
          return {
            id: t && t.id != null ? t.id : idFallback,
            userText: t && t.userText || null,
            assistantText: t && t.assistantText || null
          };
        }
        function mergeTurnsById(baseTurns, extraTurns) {
          baseTurns = Array.isArray(baseTurns) ? baseTurns : [];
          extraTurns = Array.isArray(extraTurns) ? extraTurns : [];
          var byId = {};
          var byKey = {};
          var out = [];
          function add(t) {
            if (!t) return;
            var id = t.id != null ? String(t.id) : "x" + out.length;
            var key = canonicalTurnKeyOf(t);
            var hasId = Object.prototype.hasOwnProperty.call(byId, id);
            var hasKey = key !== "||" && Object.prototype.hasOwnProperty.call(byKey, key);
            if (hasId || hasKey) {
              var at = hasId ? byId[id] : byKey[key];
              if (isBetterTurn(t, out[at])) out[at] = turnRecord(t, out[at].id);
              return;
            }
            byId[id] = out.length;
            if (key !== "||") byKey[key] = out.length;
            out.push(turnRecord(t, id));
          }
          var i;
          for (i = 0; i < baseTurns.length; i++) add(baseTurns[i]);
          for (i = 0; i < extraTurns.length; i++) add(extraTurns[i]);
          return out;
        }
        function mergeTurnsMonotone(baseTurns, extraTurns) {
          return mergeTurnsById(baseTurns, extraTurns);
        }
        function mergeTurnsByKey(baseTurns, extraTurns) {
          baseTurns = Array.isArray(baseTurns) ? baseTurns : [];
          extraTurns = Array.isArray(extraTurns) ? extraTurns : [];
          var seen = {};
          var out = [];
          function add(t) {
            if (!t) return;
            var key = canonicalTurnKeyOf(t);
            if (key === "||") return;
            if (seen[key] === void 0) {
              seen[key] = out.length;
              out.push(turnRecord(t, "x" + out.length));
              return;
            }
            var at = seen[key];
            if (isBetterTurn(t, out[at])) out[at] = turnRecord(t, out[at].id);
          }
          for (var i = 0; i < baseTurns.length; i++) add(baseTurns[i]);
          for (var j = 0; j < extraTurns.length; j++) add(extraTurns[j]);
          return out;
        }
        function classifyFolwrContinuation(input) {
          var i = input || {};
          var ok = i.ok === true;
          var status = i.status == null ? 0 : i.status;
          var bodyLength = typeof i.bodyLength === "number" && i.bodyLength >= 0 ? i.bodyLength : 0;
          var newTurns = typeof i.newTurns === "number" && i.newTurns > 0 ? i.newTurns : 0;
          var cursor = i.cursor ? String(i.cursor) : null;
          var sentCursor = i.sentCursor ? String(i.sentCursor) : null;
          var cursorRepeated = !!(cursor && sentCursor && cursor === sentCursor);
          var kind, complete, canContinue;
          if (!ok) {
            kind = "http-error";
            complete = false;
            canContinue = false;
          } else if (bodyLength === 0) {
            kind = "empty-body";
            complete = true;
            canContinue = false;
          } else if (cursorRepeated) {
            kind = "cursor-repeat";
            complete = true;
            canContinue = false;
          } else if (newTurns > 0) {
            kind = "new-turns";
            complete = false;
            canContinue = true;
          } else {
            kind = "no-new-turns";
            complete = true;
            canContinue = false;
          }
          return {
            kind,
            complete,
            canContinue,
            status,
            ok,
            bodyLength,
            newTurns,
            cursor,
            cursorRepeated,
            log: "kind=" + kind + " status=" + status + " ok=" + (ok ? 1 : 0) + " len=" + bodyLength + "B \u0445\u043E\u0434\u043E\u0432=+" + newTurns + " \u043A\u0443\u0440\u0441\u043E\u0440=" + (cursor ? "\u0435\u0441\u0442\u044C(" + (cursorRepeated ? "\u043F\u043E\u0432\u0442\u043E\u0440" : "\u043D\u043E\u0432\u044B\u0439") + ")" : "\u043D\u0435\u0442")
          };
        }
        if (typeof window !== "undefined") {
          window.parseGoogleFolwrOpen = parseGoogleFolwrOpen;
          window.GoogleFolwrUtils = {
            countTurnContainers,
            extractTurnsFromDocument,
            mergeTurnsByKey,
            extractContinuationToken,
            mergeTurnsById,
            mergeTurnsMonotone,
            classifyFolwrContinuation,
            // O-32: каноническая идентичность/форма хода — ОДИН источник правды для сетевого пути,
            // DOM-добора перехватчика и DOM-пути адаптера (см. блок «O-32» ниже по файлу).
            canonicalTurnKeyOf,
            canonicalAnswerBody,
            canonicalizeTurnForThread,
            normalizeTurnKeyPart,
            // O-45: общий рендер код-блоков (```lang … ```) и отбор узлов DOM-пути —
            // переиспользуются адаптером (adapters/google-search-adapter.js) и тестами.
            renderCodeBlock,
            answerTextOf,
            answerDomNodes,
            isCodeBlockElement
          };
        }
        if (typeof module !== "undefined" && module.exports) {
          module.exports = {
            parseGoogleFolwrOpen,
            countTurnContainers,
            extractTurnsFromDocument,
            mergeTurnsByKey,
            extractContinuationToken,
            mergeTurnsById,
            mergeTurnsMonotone,
            classifyFolwrContinuation,
            canonicalTurnKeyOf,
            canonicalAnswerBody,
            canonicalizeTurnForThread,
            normalizeTurnKeyPart,
            renderCodeBlock,
            answerTextOf,
            answerDomNodes,
            isCodeBlockElement
          };
        }
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
        function downloadBlob(content, fileName, mimeType, trigger, extra) {
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
          downloadBlob,
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
      (function() {
        "use strict";
        function safeSeg(s) {
          return String(s == null ? "" : s).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
        }
        function extractConvIdFromUrl(pathname) {
          try {
            var p = String(pathname || "");
            var mApp = p.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);
            if (mApp) return mApp[1];
            var mDs = p.match(/\/a\/chat\/s\/([A-Za-z0-9_-]+)/);
            if (mDs) return mDs[1];
            var parts = p.split("/");
            var chatIdx = parts.indexOf("chat");
            if (chatIdx !== -1 && chatIdx + 1 < parts.length && parts[chatIdx + 1]) return parts[chatIdx + 1];
            var mC = p.match(/\/c\/([A-Za-z0-9_-]+)/);
            if (mC) return mC[1];
            var mPs = p.match(/\/search\/([A-Za-z0-9_-]{8,})/);
            if (mPs) return mPs[1];
            var mP = p.match(/\/thread\/([A-Za-z0-9_-]+)/);
            if (mP) return mP[1];
            return "";
          } catch (e) {
            return "";
          }
        }
        function normExportFmt(fmt) {
          return fmt === "md" ? "md" : fmt === "json" ? "json" : "txt";
        }
        function exportPad2(n) {
          return (n < 10 ? "0" : "") + n;
        }
        function convIdStamp(d) {
          return d.getFullYear() + "-" + exportPad2(d.getMonth() + 1) + "-" + exportPad2(d.getDate()) + "_" + exportPad2(d.getHours()) + "-" + exportPad2(d.getMinutes());
        }
        function manualExportStamp(d) {
          return d.getFullYear() + "-" + exportPad2(d.getMonth() + 1) + "-" + exportPad2(d.getDate()) + "-" + exportPad2(d.getHours()) + "-" + exportPad2(d.getMinutes());
        }
        function safeModelSeg(model) {
          return String(model == null ? "" : model).replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "model";
        }
        function isFileNameTaken(taken, name) {
          try {
            if (!taken || !name) return false;
            if (typeof Set !== "undefined" && taken instanceof Set) return taken.has(name);
            if (Array.isArray(taken)) return taken.indexOf(name) !== -1;
            if (typeof taken === "object") return Object.prototype.hasOwnProperty.call(taken, name);
            return false;
          } catch (e) {
            return false;
          }
        }
        function disambiguateFileName(name, taken) {
          var base = String(name == null ? "" : name);
          try {
            if (!isFileNameTaken(taken, base)) return base;
            var m = base.match(/^(.*)\.([A-Za-z0-9]+)$/);
            var stem = m ? m[1] : base;
            var ext = m ? "." + m[2] : "";
            for (var i = 2; i <= 999; i++) {
              var cand = stem + "-" + i + ext;
              if (!isFileNameTaken(taken, cand)) return cand;
            }
            return stem + "-" + Date.now() + ext;
          } catch (e) {
            return base;
          }
        }
        function buildAutoExportFileName(spec) {
          var s = spec || {};
          var lowConfPrefix = s.isLowConfidence === true ? "[LOW CONFIDENCE]_" : "";
          var d = /* @__PURE__ */ new Date();
          var base;
          if (s.mask === "manual") {
            var siteSeg = safeSeg(s.site) || "google_search";
            base = "ai-context-monitor-" + siteSeg + "-" + safeModelSeg(s.model) + "-" + manualExportStamp(d);
          } else {
            var cidSeg = safeSeg(String(s.convId || "").slice(0, 8)) || "noconv";
            var svcSeg = safeSeg(s.service) || "chat";
            var suffix = "";
            if (s.reason === "pre-trim") suffix = "-pretrim";
            else if (s.reason === "base-complete") suffix = "-base-complete";
            base = svcSeg + "-" + cidSeg + "-" + convIdStamp(d) + suffix;
          }
          return disambiguateFileName(lowConfPrefix + base + "." + normExportFmt(s.fmt), s.taken);
        }
        function buildExportFileName(service, convId, reason, isLowConfidence, fmt) {
          return buildAutoExportFileName({
            mask: "convId",
            service,
            convId,
            reason,
            isLowConfidence,
            fmt,
            taken: arguments.length > 5 ? arguments[5] : null
          });
        }
        function buildGsaExportFileName(site, model, isLowConfidence, fmt) {
          return buildAutoExportFileName({
            mask: "manual",
            site,
            model,
            isLowConfidence,
            fmt,
            taken: arguments.length > 4 ? arguments[4] : null
          });
        }
        function resolveAutoExportConvId(site, urlConvId, threadId) {
          var cid = String(urlConvId == null ? "" : urlConvId);
          if (cid) return cid;
          if (String(site == null ? "" : site) === "google_search") {
            return String(threadId == null ? "" : threadId);
          }
          return "";
        }
        function notCompleteReason(state) {
          var s = state || {};
          if (s.site === "google_search" && s.probeRunning === true) return "probe-running";
          return "not-complete";
        }
        function pickExportSource(hasBaseSeen, hasNetworkTexts) {
          return hasBaseSeen === true ? "network" : "adapter";
        }
        function resolveExportSource(state) {
          var s = state || {};
          if (s.isGemini !== true) return { action: "local", reason: "non-gemini" };
          if (s.bridge !== true) return { action: "local", reason: "no-bridge" };
          var arch = typeof s.archiveCount === "number" && s.archiveCount > 0 ? s.archiveCount : 0;
          if (arch <= 0) return { action: "local", reason: "no-archive" };
          var live = typeof s.liveCount === "number" ? s.liveCount : null;
          if (live === 0) return { action: "block", reason: "archive-only-base" };
          var base = typeof s.baseCount === "number" ? s.baseCount : 0;
          var local = typeof s.localCount === "number" ? s.localCount : 0;
          if (live !== null && live > 0 && base > local) return { action: "union", reason: "stale-local-source" };
          return { action: "local", reason: "in-sync" };
        }
        function sourceTierOf(state) {
          var s = state || {};
          var arch = typeof s.archiveCount === "number" && s.archiveCount > 0 ? s.archiveCount : 0;
          var live = typeof s.liveCount === "number" && s.liveCount > 0 ? s.liveCount : 0;
          if (arch > 0 && live > 0) return "[MERGED: ARCHIVE+LIVE]";
          if (arch > 0) return "[ARCHIVE]";
          return "[BEST-EFFORT: LIVE CAPTURE]";
        }
        function shouldSkipGsaPageGuard(state) {
          var s = state || {};
          if (s.site !== "google_search") return { skip: false, reason: null };
          if (s.chatPageMarker === false) return { skip: true, reason: "not-chat-page" };
          if (typeof s.msgCount === "number" && s.msgCount < 1) return { skip: true, reason: "no-messages" };
          if (typeof s.baseTextLen === "number" && s.baseTextLen < 1) return { skip: true, reason: "empty-base" };
          return { skip: false, reason: null };
        }
        function shouldSkipAutoExport(state) {
          var s = state || {};
          if (s.enabled !== true) return { skip: true, reason: "not-enabled", resetFired: false };
          if (typeof s.percentage !== "number" || !(s.percentage >= 0)) return { skip: true, reason: "no-pct", resetFired: false };
          var gsaPage = shouldSkipGsaPageGuard(s);
          if (gsaPage.skip) return { skip: true, reason: gsaPage.reason, resetFired: false };
          var threshold = typeof s.threshold === "number" && s.threshold >= 1 && s.threshold <= 100 ? s.threshold : 90;
          var domBaseTrusted = s.domBaseTrusted === true;
          var networkCompleteLatch = s.gsaNetworkCompleteLatch === true;
          var completeOk = s.baseComplete === true || networkCompleteLatch;
          var baseReady = completeOk || domBaseTrusted;
          var basePending = s.isGemini !== true && s.baseSeen !== true && !domBaseTrusted && !networkCompleteLatch;
          if (!baseReady && !basePending) return { skip: true, reason: "not-complete", resetFired: false };
          if (s.isGemini === true && typeof s.archiveCount === "number" && s.archiveCount > 0 && typeof s.baseCount === "number" && s.baseCount <= s.archiveCount) {
            return { skip: true, reason: "archive-pending-live", resetFired: false };
          }
          if (s.isGemini === true && s.loaderRunning) return { skip: true, reason: "loader-running", resetFired: false };
          if (s.percentage < threshold - 10) {
            if (s.isGemini === true || s.baseSeen === true) return { skip: true, reason: "below-threshold-hysteresis", resetFired: true };
            return { skip: true, reason: "below-threshold-unreliable", resetFired: false };
          }
          if (s.percentage < threshold) return { skip: true, reason: "below-threshold", resetFired: false };
          if (!baseReady && basePending) return { skip: true, reason: "base-pending", resetFired: false };
          if (s.fired) return { skip: true, reason: "already-fired", resetFired: false };
          return { skip: false, reason: null, resetFired: false };
        }
        function shouldSkipBaseCompleteTrigger(state) {
          var s = state || {};
          var threshold = typeof s.threshold === "number" && s.threshold >= 1 && s.threshold <= 100 ? s.threshold : 90;
          if (typeof s.percentage !== "number" || !(s.percentage >= 0)) {
            return { skip: true, reason: "no-pct", threshold };
          }
          if (s.percentage < threshold) {
            return { skip: true, reason: "below-threshold-base-complete", threshold };
          }
          return { skip: false, reason: null, threshold };
        }
        function effectiveAutoExportThreshold(globalPct, perSitePct) {
          function clampPerSite(v) {
            var n = parseInt(v, 10);
            if (isNaN(n)) return null;
            if (n < 1) return 1;
            if (n > 100) return 100;
            return n;
          }
          if (perSitePct !== void 0 && perSitePct !== null && String(perSitePct).trim() !== "") {
            var per = clampPerSite(perSitePct);
            if (per != null) return per;
          }
          var g = typeof globalPct === "number" && globalPct >= 1 && globalPct <= 100 ? globalPct : null;
          return g == null ? 90 : g;
        }
        function latchKey(service, convId) {
          return safeSeg(service) + "|" + String(convId || "");
        }
        function markAutoExportFired(store, service, convId) {
          try {
            store[latchKey(service, convId)] = 1;
          } catch (e) {
          }
        }
        function getAutoExportFired(store, service, convId) {
          try {
            return store[latchKey(service, convId)] === 1;
          } catch (e) {
            return false;
          }
        }
        function resetAutoExportFired(store, service, convId) {
          try {
            delete store[latchKey(service, convId)];
          } catch (e) {
          }
        }
        var FIRED_SESSION_PREFIX = "aiCmFired:";
        function firedSessionKey(service, convId) {
          return FIRED_SESSION_PREFIX + latchKey(service, convId);
        }
        function isFiredInSession(sessionMap, service, convId) {
          try {
            return !!sessionMap && sessionMap[firedSessionKey(service, convId)] === 1;
          } catch (e) {
            return false;
          }
        }
        function sessionFiredPatch(service, convId) {
          var patch = {};
          try {
            patch[firedSessionKey(service, convId)] = 1;
          } catch (e) {
          }
          return patch;
        }
        function normalizeExportMessages(raw) {
          var out = [];
          try {
            if (!Array.isArray(raw)) return out;
            for (var i = 0; i < raw.length; i++) {
              var m = raw[i] || {};
              var text = typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : "";
              if (!text) continue;
              var norm = { role: m.role === "user" || m.role === "human" ? "user" : "assistant", text };
              if (typeof aiCmDiagLine === "function") {
                aiCmDiagLine("claude-role-normalize", { inputRole: m.role, outputRole: norm.role });
              }
              if (typeof m.hiddenReasoning === "string" && m.hiddenReasoning) norm.hiddenReasoning = m.hiddenReasoning;
              out.push(norm);
            }
          } catch (e) {
            swallow(e, "export-utils:normalizeExportMessages");
          }
          return out;
        }
        var RE_RAW_HEADING_LINE = /^[\s>*+\-\d.)\]]*#{1,}(?=\s|$)/;
        var RE_MARKER_RESIDUE_LINE = /^[\s>*+\-\d.)\]]*#{1,}[\s]*$/;
        var RE_CODE_FENCE_LINE = /^[\s>*+\-\d.)\]]*(`{3,}|~{3,})/;
        var RE_LIST_MARK = /^(?:[-*+]|\d+[.)])[ \t]+/;
        var RE_ANY_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g;
        function deSpaceAny(s) {
          return String(s == null ? "" : s).replace(RE_ANY_SPACE, " ");
        }
        function coreOfLine(line) {
          try {
            var s = deSpaceAny(line);
            if (RE_CODE_FENCE_LINE.test(s)) return "";
            var prev;
            do {
              prev = s;
              s = s.replace(/^[ \t]+/, "");
              if (/^>[ \t]?/.test(s)) s = s.replace(/^>[ \t]?/, "");
              else if (RE_LIST_MARK.test(s)) s = s.replace(RE_LIST_MARK, "");
              else if (RE_RAW_HEADING_LINE.test(s)) s = s.replace(/^#{1,}[ \t]*/, "");
            } while (s !== prev);
            return s.replace(/[*_`~#>]+/g, " ").replace(/\s+/g, " ").trim();
          } catch (e) {
            return "";
          }
        }
        function coreText(text) {
          try {
            var lines = deSpaceAny(text).split("\n");
            var kept = [];
            for (var i = 0; i < lines.length; i++) {
              var c = coreOfLine(lines[i]);
              if (c) kept.push(c);
            }
            return kept.join(" ");
          } catch (e) {
            return "";
          }
        }
        function stripMarkerResidue(text) {
          try {
            var s = String(text == null ? "" : text);
            if (s.indexOf("#") === -1) return s;
            var lines = s.split("\n");
            var kept = [];
            var dropped = false;
            for (var i = 0; i < lines.length; i++) {
              if (RE_MARKER_RESIDUE_LINE.test(lines[i])) {
                dropped = true;
                continue;
              }
              kept.push(lines[i]);
            }
            return dropped ? kept.join("\n") : s;
          } catch (e) {
            return String(text == null ? "" : text);
          }
        }
        function dedupeMessages(messages) {
          var out = [];
          var seen = {};
          var removed = 0;
          try {
            if (!Array.isArray(messages)) return { messages: out, removed: 0 };
            for (var i = 0; i < messages.length; i++) {
              var m = messages[i] || {};
              var role = m.role === "user" ? "user" : "assistant";
              var text = typeof m.text === "string" ? m.text : "";
              var key = role + "\0" + coreText(text);
              if (Object.prototype.hasOwnProperty.call(seen, key)) {
                removed++;
                continue;
              }
              seen[key] = true;
              var keep = { role, text };
              if (m.id != null) keep.id = m.id;
              out.push(keep);
            }
          } catch (e) {
            swallow(e, "export-utils:dedupeMessages");
          }
          return { messages: out, removed };
        }
        var INTRA_CORE_MIN_LEN = 20;
        function isRawMarkdownBlock(block) {
          try {
            var lines = String(block == null ? "" : block).split("\n");
            for (var i = 0; i < lines.length; i++) {
              if (RE_RAW_HEADING_LINE.test(lines[i])) return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        }
        function separateRawBlocks(text) {
          return String(text).replace(/([^#\n])[ \t]*(#{1,6})(?=[ \t])/g, function(all, prev, hashes) {
            if (hashes.length < 2 && !/[.!?;:»")\]]$/.test(prev)) return all;
            return prev + "\n\n" + hashes;
          });
        }
        function splitRawSections(block) {
          try {
            var lines = String(block == null ? "" : block).split("\n");
            var out = [];
            var cur = null;
            for (var i = 0; i < lines.length; i++) {
              if (RE_RAW_HEADING_LINE.test(lines[i])) {
                if (cur) out.push(cur.join("\n"));
                cur = [lines[i]];
              } else if (cur) {
                cur.push(lines[i]);
              } else {
                cur = [lines[i]];
              }
            }
            if (cur) out.push(cur.join("\n"));
            return out.length ? out : [String(block == null ? "" : block)];
          } catch (e) {
            return [String(block == null ? "" : block)];
          }
        }
        function sepForSections(block) {
          return /\n{2,}/.test(String(block == null ? "" : block)) ? "\n\n" : "\n";
        }
        function cutLeadingCopy(section, folded) {
          var lines = String(section).split("\n");
          if (lines.length < 2) return { text: String(section), trimmed: false };
          var head = lines[0];
          var body = lines.slice(1).join("\n");
          var bodyNorm = normalizeIntraBlock(body);
          var copyNorm = normalizeIntraBlock(folded);
          if (!bodyNorm || !copyNorm) return { text: String(section), trimmed: false };
          if (bodyNorm === copyNorm) return null;
          if (bodyNorm.indexOf(copyNorm) === 0) {
            var tail = bodyNorm.slice(copyNorm.length).replace(/^\s+/, "");
            if (!tail) return null;
            var lastWord = copyNorm.split(" ").pop();
            var at = body.lastIndexOf(lastWord);
            if (at < 0) return null;
            var rest = body.slice(at + lastWord.length).replace(/^\s+/, "");
            if (!rest) return null;
            return { text: head + "\n" + rest, trimmed: true };
          }
          var cutIdx = corePrefixCutIndex(body, coreText(folded));
          if (cutIdx < 0) return { text: String(section), trimmed: false };
          var restCore = body.slice(cutIdx).replace(/^\s+/, "");
          if (!restCore) return null;
          return { text: head + "\n" + restCore, trimmed: true };
        }
        function corePrefixCutIndex(body, copyCore) {
          try {
            if (!copyCore) return -1;
            if (coreText(body).indexOf(copyCore) !== 0) return -1;
            var re = /(\S+)/g;
            var m;
            while ((m = re.exec(body)) !== null) {
              var end = m.index + m[0].length;
              var probe = coreText(body.slice(0, end));
              if (probe === copyCore) return end;
              if (probe.length > copyCore.length) return -1;
            }
            return -1;
          } catch (e) {
            return -1;
          }
        }
        function renderedBeforeRaw(blocks, i, raw) {
          for (var b = i - 1; b >= 0; b--) {
            if (b === i || raw[b]) continue;
            if (!coreText(blocks[b])) continue;
            return String(blocks[b]);
          }
          return null;
        }
        function normalizeIntraBlock(block) {
          return String(block == null ? "" : block).replace(/\s+/g, " ").trim();
        }
        function intraBlocksSimilar(a, b) {
          var x = coreText(a);
          var y = coreText(b);
          if (!x || !y) return false;
          if (x === y) return true;
          var minLen = x.length < y.length ? x.length : y.length;
          if (minLen < INTRA_CORE_MIN_LEN) return false;
          return x.length >= y.length ? x.indexOf(y) !== -1 : y.indexOf(x) !== -1;
        }
        function dedupeIntraMessage(message) {
          var text = message && typeof message.text === "string" ? message.text : "";
          var removedBlocks = 0;
          try {
            let coreDup = function(core, selfIdx, minLen) {
              if (!core) return false;
              if (seenCore[core]) return true;
              if (core.length < minLen) return false;
              for (var q = 0; q < blocks.length; q++) {
                if (q === selfIdx || drop[q] || raw[q] || !norm[q]) continue;
                if (intraBlocksSimilar(core, blocks[q])) return true;
              }
              return false;
            };
            if (!text) return { text, removedBlocks: 0 };
            var seam = separateRawBlocks(text);
            var blocks = seam.split(/\n{2,}/);
            if (blocks.length < 2) return { text, removedBlocks: 0 };
            var norm = [];
            var raw = [];
            var i;
            for (i = 0; i < blocks.length; i++) {
              norm.push(coreText(blocks[i]));
              raw.push(isRawMarkdownBlock(blocks[i]));
            }
            var drop = {};
            var seen = /* @__PURE__ */ Object.create(null);
            for (i = 0; i < blocks.length; i++) {
              if (!norm[i]) continue;
              if (seen[norm[i]]) {
                drop[i] = true;
                removedBlocks++;
                continue;
              }
              seen[norm[i]] = true;
            }
            var seenCore = /* @__PURE__ */ Object.create(null);
            var cores = [];
            for (i = 0; i < blocks.length; i++) {
              cores.push(coreOfBlock(blocks[i]));
              if (drop[i] || raw[i] || !norm[i]) continue;
              if (cores[i]) seenCore[cores[i]] = true;
            }
            for (i = 0; i < blocks.length; i++) {
              if (drop[i] || !raw[i]) continue;
              if (coreDup(cores[i], i, INTRA_CORE_MIN_LEN)) {
                drop[i] = true;
                removedBlocks++;
                continue;
              }
              var secs = splitRawSections(blocks[i]);
              var folded = renderedBeforeRaw(blocks, i, raw);
              if (folded === null) continue;
              var cutSecs = 0;
              var keptSecs = [];
              for (var s = 0; s < secs.length; s++) {
                if (coreDup(coreOfBlock(secs[s]), i, 0)) {
                  cutSecs++;
                  continue;
                }
                var cut = cutLeadingCopy(secs[s], folded);
                if (cut === null) {
                  cutSecs++;
                  continue;
                }
                if (cut.trimmed) cutSecs++;
                keptSecs.push(cut.text);
              }
              if (cutSecs === 0) continue;
              removedBlocks += cutSecs;
              if (keptSecs.length === 0) {
                drop[i] = true;
                continue;
              }
              blocks[i] = keptSecs.join(sepForSections(blocks[i])).replace(/^\n+/, "");
              norm[i] = coreText(blocks[i]);
              cores[i] = coreOfBlock(blocks[i]);
              raw[i] = isRawMarkdownBlock(blocks[i]);
            }
            for (i = 0; i < blocks.length; i++) {
              if (drop[i] || !raw[i]) continue;
              var coreRaw = cores[i];
              if (coreRaw.length < INTRA_CORE_MIN_LEN) continue;
              for (var j = i + 1; j < blocks.length; j++) {
                if (drop[j] || raw[j]) continue;
                if (intraBlocksSimilar(coreRaw, blocks[j])) {
                  drop[i] = true;
                  removedBlocks++;
                  break;
                }
              }
            }
            if (removedBlocks === 0) return { text, removedBlocks: 0 };
            var kept = [];
            for (i = 0; i < blocks.length; i++) {
              if (!drop[i]) kept.push(blocks[i]);
            }
            return { text: kept.join("\n\n"), removedBlocks };
          } catch (e) {
            swallow(e, "export-utils:dedupeIntraMessage");
          }
          return { text, removedBlocks: 0 };
        }
        function coreOfBlock(block) {
          try {
            var lines = String(block == null ? "" : block).split("\n");
            var kept = [];
            for (var i = 0; i < lines.length; i++) {
              if (RE_RAW_HEADING_LINE.test(lines[i])) continue;
              kept.push(lines[i]);
            }
            return coreText(kept.join("\n"));
          } catch (e) {
            return coreText(block);
          }
        }
        var CROSS_RAW_MIN_LINES = 2;
        var CROSS_RAW_MIN_CHARS = 80;
        function blockLinePair(block) {
          var raw = deSpaceAny(block).split("\n");
          var core = [];
          for (var i = 0; i < raw.length; i++) core.push(coreOfLine(raw[i]));
          return trimPairEdges(raw, core);
        }
        function trimPairEdges(raw, core) {
          var a = 0, b = raw.length;
          while (a < b && !core[a]) a++;
          while (b > a && !core[b - 1]) b--;
          return { raw: raw.slice(a, b), core: core.slice(a, b) };
        }
        function cutPairHead(pair, n) {
          return trimPairEdges(pair.raw.slice(n), pair.core.slice(n));
        }
        function cutPairTail(pair, n) {
          var k = pair.raw.length - n;
          return trimPairEdges(pair.raw.slice(0, k), pair.core.slice(0, k));
        }
        function trimEdgeEmpty(lines) {
          var a = lines.slice();
          while (a.length && !a[0]) a.shift();
          while (a.length && !a[a.length - 1]) a.pop();
          return a;
        }
        function seqEqual(a, b) {
          if (a.length !== b.length) return false;
          for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
          }
          return true;
        }
        function seqIsPrefix(shortArr, longArr) {
          if (!shortArr.length || shortArr.length >= longArr.length) return false;
          for (var i = 0; i < shortArr.length; i++) {
            if (shortArr[i] !== longArr[i]) return false;
          }
          return true;
        }
        function seqIsSuffix(shortArr, longArr) {
          if (!shortArr.length || shortArr.length >= longArr.length) return false;
          var off = longArr.length - shortArr.length;
          for (var i = 0; i < shortArr.length; i++) {
            if (shortArr[i] !== longArr[off + i]) return false;
          }
          return true;
        }
        function crossCopyIsSubstantial(lines) {
          var ls = trimEdgeEmpty(lines);
          var nonEmpty = 0;
          var chars = 0;
          for (var i = 0; i < ls.length; i++) {
            if (!ls[i]) continue;
            nonEmpty++;
            chars += ls[i].length;
          }
          return nonEmpty >= CROSS_RAW_MIN_LINES && chars >= CROSS_RAW_MIN_CHARS;
        }
        function dedupeCrossRawCopies(messages) {
          var out = [];
          var removed = 0;
          var refs = [];
          try {
            var src = Array.isArray(messages) ? messages : [];
            for (var i = 0; i < src.length; i++) {
              var m = src[i] || {};
              var text = typeof m.text === "string" ? m.text : "";
              if (!text) {
                out.push(m);
                continue;
              }
              var blocks = separateRawBlocks(text).split(/\n{2,}/);
              var keptBlocks = [];
              var touched = false;
              for (var b = 0; b < blocks.length; b++) {
                if (!isRawMarkdownBlock(blocks[b])) {
                  keptBlocks.push(blocks[b]);
                  continue;
                }
                var pair = blockLinePair(blocks[b]);
                var origJoin = pair.raw.join("\n");
                var dropped = false;
                var changed = true;
                while (changed && !dropped) {
                  changed = false;
                  for (var r = 0; r < refs.length; r++) {
                    var ref = refs[r];
                    if (seqEqual(ref, pair.core)) {
                      if (!crossCopyIsSubstantial(ref)) continue;
                      dropped = true;
                      removed++;
                      break;
                    }
                    if (seqIsSuffix(ref, pair.core) && crossCopyIsSubstantial(ref)) {
                      pair = cutPairTail(pair, ref.length);
                      changed = true;
                      break;
                    }
                    if (seqIsPrefix(ref, pair.core) && crossCopyIsSubstantial(ref)) {
                      pair = cutPairHead(pair, ref.length);
                      changed = true;
                      break;
                    }
                  }
                  if (!dropped && !pair.raw.length) {
                    dropped = true;
                    removed++;
                  }
                }
                if (dropped || !pair.raw.length) {
                  touched = true;
                  continue;
                }
                var rebuilt = pair.raw.join("\n");
                if (rebuilt !== origJoin) touched = true;
                keptBlocks.push(rebuilt);
                if (isRawMarkdownBlock(rebuilt)) refs.push(pair.core);
              }
              var keep = { role: m.role === "user" ? "user" : "assistant", text: touched ? keptBlocks.join("\n\n") : text };
              if (m.id != null) keep.id = m.id;
              out.push(keep);
            }
          } catch (e) {
            return { messages: Array.isArray(messages) ? messages : [], removed: 0 };
          }
          return { messages: out, removed };
        }
        function prepareExportMessages(raw, onMessageDedupe) {
          var intraRemoved = 0;
          var out = [];
          try {
            var src = Array.isArray(raw) ? raw : [];
            for (var i = 0; i < src.length; i++) {
              var m = src[i] || {};
              var role = m.role === "user" ? "user" : "assistant";
              var text = typeof m.text === "string" ? m.text : "";
              var res = dedupeIntraMessage({ role, text });
              var next = { role, text: res.text };
              if (m.id != null) next.id = m.id;
              out.push(next);
              if (res.removedBlocks > 0) {
                intraRemoved += res.removedBlocks;
                if (typeof onMessageDedupe === "function") {
                  try {
                    onMessageDedupe(role, res.removedBlocks);
                  } catch (eCb) {
                  }
                }
              }
            }
          } catch (e) {
            out = Array.isArray(raw) ? raw : [];
            intraRemoved = 0;
          }
          var inter = dedupeMessages(out);
          var cross = dedupeCrossRawCopies(inter.messages);
          var cleaned = [];
          for (var k = 0; k < cross.messages.length; k++) {
            var mk = cross.messages[k] || {};
            var clean = {
              role: mk.role === "user" ? "user" : "assistant",
              text: stripMarkerResidue(typeof mk.text === "string" ? mk.text : "")
            };
            if (mk.id != null) clean.id = mk.id;
            cleaned.push(clean);
          }
          return {
            messages: cleaned,
            intraRemoved,
            removed: inter.removed + cross.removed,
            crossRemoved: cross.removed
          };
        }
        var VISIBLE_USER_PROMPT_START = "<!-- deepseek-pp-visible-user-prompt:start -->";
        var VISIBLE_USER_PROMPT_END = "<!-- deepseek-pp-visible-user-prompt:end -->";
        var VISIBLE_USER_PROMPT_VALUE = "<!-- deepseek-pp-visible-user-prompt:value=";
        function countMarker(text, marker) {
          var n = 0;
          var at = text.indexOf(marker);
          while (at !== -1) {
            n++;
            at = text.indexOf(marker, at + marker.length);
          }
          return n;
        }
        function injectedUserTextSkipReason(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          var starts = countMarker(s, VISIBLE_USER_PROMPT_START);
          var ends = countMarker(s, VISIBLE_USER_PROMPT_END);
          if (starts === 0 && ends === 0) {
            return s.indexOf(VISIBLE_USER_PROMPT_VALUE) !== -1 ? "value-only" : "no-markers";
          }
          if (starts === 1 && ends === 1) {
            return s.indexOf(VISIBLE_USER_PROMPT_END) < s.indexOf(VISIBLE_USER_PROMPT_START) ? "unpaired-markers" : null;
          }
          if (starts > 1 || ends > 1) return "multiple-pairs";
          return "unpaired-markers";
        }
        function sanitizeInjectedUserText(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          if (injectedUserTextSkipReason(s) !== null) return s;
          var from = s.indexOf(VISIBLE_USER_PROMPT_START) + VISIBLE_USER_PROMPT_START.length;
          var to = s.indexOf(VISIBLE_USER_PROMPT_END, from);
          return s.slice(from, to).trim();
        }
        var BDS_OPEN_TAG = "<BetterDeepSeek>";
        var BDS_CLOSE_TAG = "</BetterDeepSeek>";
        var BDS_TRUNCATION_MARK = "...[truncated]";
        var BDS_BOM = "\uFEFF";
        function bdsDiagLine(tag, fields) {
          try {
            if (typeof aiCmDiagLine !== "function") return false;
            return aiCmDiagLine(tag, fields) !== false;
          } catch (eDiag) {
            return false;
          }
        }
        function bdsDiagSlice(text, from, n) {
          try {
            var s = typeof text === "string" ? text : String(text == null ? "" : text);
            return JSON.stringify(from === 0 ? s.slice(0, n) : s.slice(Math.max(0, s.length - n)));
          } catch (eSlice) {
            return '""';
          }
        }
        var BDS_INJECTION_FORMS = [
          {
            id: "bds-deep-code-prompt",
            match: "exact",
            head: "[DEEP_CODE_MODE_ACTIVE]",
            basis: "artifact 1-257 (message), 999-1191 / 1223-1415 (span in <original_task>)"
          },
          {
            id: "bds-tool-system-prompt",
            match: "exact",
            head: "You are Better DeepSeek. You have access to specialized tools.",
            basis: "artifact 259-947 (message)"
          },
          {
            id: "bds-system-datetime",
            match: "prefix",
            head: "User's System Date & Time: ",
            basis: "artifact 980-982 (message; line 981)"
          }
        ];
        var BDS_WRAPPER_ID = "bds-prompt-wrapper";
        function isBdsOpenTagLine(line, at) {
          if (line === BDS_OPEN_TAG) return true;
          return at === 0 && line === BDS_BOM + BDS_OPEN_TAG;
        }
        function bdsFormOfHeadLine(line) {
          var s = typeof line === "string" ? line : "";
          for (var i = 0; i < BDS_INJECTION_FORMS.length; i++) {
            var f = BDS_INJECTION_FORMS[i];
            if (f.match === "prefix") {
              if (s.slice(0, f.head.length) === f.head) return f;
            } else if (s === f.head) return f;
          }
          return null;
        }
        function bdsFirstContentLine(lines) {
          for (var i = 0; i < lines.length; i++) {
            if (String(lines[i]).trim() !== "") return i;
          }
          return -1;
        }
        function bdsLastContentLine(lines) {
          for (var i = lines.length - 1; i >= 0; i--) {
            if (String(lines[i]).trim() !== "") return i;
          }
          return -1;
        }
        function sanitizeBetterDeepSeekText(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          if (s.indexOf(BDS_OPEN_TAG) === -1) return { text: s, removed: 0, forms: [] };
          var lines = s.split("\n");
          var drop = {};
          var forms = [];
          var diagRows = typeof aiCmDiagLine === "function" ? [] : null;
          var firstLine = bdsFirstContentLine(lines);
          var lastLine = bdsLastContentLine(lines);
          for (var k = 0; k < lines.length; k++) {
            if (!isBdsOpenTagLine(lines[k], k)) continue;
            var form = k + 1 < lines.length ? bdsFormOfHeadLine(lines[k + 1]) : null;
            if (form) {
              var end = -1;
              for (var j = k + 2; j < lines.length; j++) {
                if (isBdsOpenTagLine(lines[j], j)) break;
                if (lines[j] === BDS_CLOSE_TAG || lines[j] === BDS_TRUNCATION_MARK) {
                  end = j;
                  break;
                }
              }
              if (end === -1) {
                if (diagRows) diagRows.push({ k, first: firstLine, pair: -1, last: lastLine, form: form.id, skip: "no-boundary" });
                continue;
              }
              if (diagRows) diagRows.push({ k, first: firstLine, pair: end, last: lastLine, form: form.id, skip: "(\u043D\u0435\u0442)" });
              for (var d = k; d <= end; d++) drop[d] = true;
              forms.push(form.id);
              k = end;
              continue;
            }
            var pair = -1;
            for (var p = k + 1; p < lines.length; p++) {
              if (isBdsOpenTagLine(lines[p], p)) break;
              if (lines[p] === BDS_CLOSE_TAG) {
                pair = p;
                break;
              }
            }
            if (pair === -1) {
              if (diagRows) diagRows.push({ k, first: firstLine, pair: -1, last: lastLine, form: "(\u043D\u0435\u0442)", skip: "unpaired-tag" });
              continue;
            }
            if (diagRows) diagRows.push({ k, first: firstLine, pair, last: lastLine, form: BDS_WRAPPER_ID, skip: "(\u043D\u0435\u0442)" });
            drop[k] = true;
            drop[pair] = true;
            forms.push(BDS_WRAPPER_ID);
            k = pair;
          }
          var removedTotal = forms.length;
          if (diagRows) {
            for (var r = 0; r < diagRows.length; r++) {
              bdsDiagLine("o40-bds-line", {
                k: diagRows[r].k,
                firstLine: diagRows[r].first,
                pair: diagRows[r].pair,
                lastLine: diagRows[r].last,
                form: diagRows[r].form,
                skip: diagRows[r].skip,
                removed: removedTotal
              });
            }
          }
          if (!forms.length) return { text: s, removed: 0, forms: [] };
          var kept = [];
          for (var m = 0; m < lines.length; m++) {
            if (!drop[m]) kept.push(lines[m]);
          }
          return { text: kept.join("\n"), removed: forms.length, forms };
        }
        var TC_LFR_OPEN = "<local_file_read>";
        var TC_LFR_CLOSE = "</local_file_read>";
        var TC_TASK_OPEN = "<original_task>";
        var TC_TASK_CLOSE = "</original_task>";
        var TC_RESULTS_OPEN = "<tool_results>";
        var TC_RESULTS_CLOSE = "</tool_results>";
        var TC_PROSE_ANCHOR = "These are the tool results just executed for the tool-continuation task.";
        var TC_ENVELOPE_FORMS = [
          {
            id: "tc-local-file-read",
            rule: "pair",
            open: TC_LFR_OPEN,
            close: TC_LFR_CLOSE,
            boundary: "\u043E\u0442 \u0441\u0442\u0440\u043E\u043A\u0438 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0435\u0433\u043E \u0442\u0435\u0433\u0430 \u0434\u043E \u0441\u0442\u0440\u043E\u043A\u0438 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0435\u0433\u043E; \u0441\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u043F\u0430\u0440\u0430 \u2014 \u0446\u0435\u043B\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 (\u0441\u043F\u0430\u043D \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u2014 \u0431\u0430\u0439\u0442\u043E\u0432\u043E: \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F \u0441\u043F\u0430\u043D\u0430 \u0432 \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u0435 \u043D\u0435\u0442)",
            scope: "tool-request",
            basis: "artifact 10-19 msg 1/3/9/11/13 lines 1-3 (whole message, role=assistant)"
          },
          {
            id: "tc-prose-continuation",
            rule: "run",
            openPrefix: TC_PROSE_ANCHOR,
            boundary: "\u043E\u0442 \u0441\u0442\u0440\u043E\u043A\u0438-\u044F\u043A\u043E\u0440\u044F \u0434\u043E \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438 \u043F\u0440\u043E\u0437\u044B (\u043F\u0435\u0440\u0435\u0434 \u043F\u0443\u0441\u0442\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439)",
            scope: "envelope",
            basis: "artifact 10-19 msg 2/4/7/8/10/12/14 lines 1-9"
          },
          {
            id: "tc-original-task",
            rule: "pair",
            open: TC_TASK_OPEN,
            close: TC_TASK_CLOSE,
            boundary: "\u043E\u0442 <original_task> \u0434\u043E </original_task>; \u043F\u0443\u0441\u0442\u0430\u044F \u043F\u0430\u0440\u0430 11-12 \u2014 \u0442\u0430 \u0436\u0435 \u0433\u0440\u0430\u043D\u0438\u0446\u0430",
            scope: "envelope",
            basis: "artifact 10-19 msg 2/4 lines 11-12 (empty), msg 7/8/10/12/14 lines 11-17"
          },
          {
            id: "tc-tool-results",
            rule: "pair",
            open: TC_RESULTS_OPEN,
            close: TC_RESULTS_CLOSE,
            boundary: "\u043E\u0442 <tool_results> \u0434\u043E </tool_results>; \u0432 \u0430\u0440\u0442\u0435\u0444\u0430\u043A\u0442\u0435 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0438\u0439 \u0442\u0435\u0433 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F (7/7)",
            scope: "envelope",
            basis: "artifact 10-19 msg 2/4 lines 14-26 / 14-35, msg 7/8/10/12/14 lines 19-66"
          }
        ];
        function tcPairAfter(lines, from, open, close) {
          for (var i = Math.max(0, from); i < lines.length; i++) {
            if (lines[i] !== open) continue;
            for (var j = i + 1; j < lines.length; j++) {
              if (lines[j] === close) return { open: i, close: j };
            }
            return null;
          }
          return null;
        }
        function tcIsWholeMessagePair(lines, pair) {
          var i;
          for (i = 0; i < pair.open; i++) {
            if (String(lines[i]).trim() !== "") return false;
          }
          for (i = pair.close + 1; i < lines.length; i++) {
            if (String(lines[i]).trim() !== "") return false;
          }
          return true;
        }
        function tcProseAnchorLine(lines) {
          for (var i = 0; i < lines.length; i++) {
            if (String(lines[i]).slice(0, TC_PROSE_ANCHOR.length) === TC_PROSE_ANCHOR) return i;
          }
          return -1;
        }
        function sanitizeToolContinuationText(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          if (s.indexOf(TC_LFR_OPEN) === -1 && s.indexOf(TC_TASK_OPEN) === -1 && s.indexOf(TC_RESULTS_OPEN) === -1 && s.indexOf(TC_PROSE_ANCHOR) === -1) {
            return { text: s, removed: 0, forms: [] };
          }
          var lines = s.split("\n");
          var drop = {};
          var forms = [];
          var anchor = tcProseAnchorLine(lines);
          if (anchor !== -1) {
            var runEnd = anchor;
            for (var p = anchor + 1; p < lines.length; p++) {
              if (String(lines[p]).trim() === "") break;
              runEnd = p;
            }
            var spanEnd = runEnd;
            var afterRun = runEnd + 1;
            var task = tcPairAfter(lines, afterRun, TC_TASK_OPEN, TC_TASK_CLOSE);
            if (task) {
              spanEnd = task.close;
              afterRun = task.close + 1;
            }
            var results = tcPairAfter(lines, afterRun, TC_RESULTS_OPEN, TC_RESULTS_CLOSE);
            if (results) {
              spanEnd = results.close;
            }
            for (var d = anchor; d <= spanEnd; d++) drop[d] = true;
            forms.push("tc-prose-continuation");
            if (task) forms.push("tc-original-task");
            if (results) forms.push("tc-tool-results");
          }
          for (var k = 0; k < lines.length; k++) {
            if (drop[k] || lines[k] !== TC_LFR_OPEN) continue;
            var lfr = tcPairAfter(lines, k, TC_LFR_OPEN, TC_LFR_CLOSE);
            if (!lfr) continue;
            if (!tcIsWholeMessagePair(lines, lfr)) {
              k = lfr.close;
              continue;
            }
            for (var d2 = lfr.open; d2 <= lfr.close; d2++) drop[d2] = true;
            forms.push("tc-local-file-read");
            k = lfr.close;
          }
          if (!forms.length) return { text: s, removed: 0, forms: [] };
          var kept = [];
          for (var m = 0; m < lines.length; m++) {
            if (!drop[m]) kept.push(lines[m]);
          }
          return { text: kept.join("\n"), removed: forms.length, forms };
        }
        var SECTION_REASONING_TAG = "[REASONING]";
        var SECTION_ANSWER_TAG = "[ANSWER]";
        function stripReasoningSections(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          if (s.indexOf(SECTION_REASONING_TAG) === -1 || s.indexOf(SECTION_ANSWER_TAG) === -1) return s;
          var out = "";
          var i = 0;
          var changed = false;
          while (i < s.length) {
            var a = s.indexOf(SECTION_ANSWER_TAG, i);
            if (a === -1) {
              out += s.slice(i);
              break;
            }
            var r = a > 0 ? s.lastIndexOf(SECTION_REASONING_TAG, a - 1) : -1;
            if (r === -1 || r < i) {
              out += s.slice(i, a + SECTION_ANSWER_TAG.length);
              i = a + SECTION_ANSWER_TAG.length;
              continue;
            }
            out += s.slice(i, r);
            i = a + SECTION_ANSWER_TAG.length;
            if (s.charAt(i) === "\r" && s.charAt(i + 1) === "\n") i += 2;
            else if (s.charAt(i) === "\n") i += 1;
            changed = true;
          }
          return changed ? out : s;
        }
        function splitReasoningSections(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          var r = s.indexOf(SECTION_REASONING_TAG);
          if (r === -1) return { reasoning: "", answer: s };
          var a = s.indexOf(SECTION_ANSWER_TAG, r + SECTION_REASONING_TAG.length);
          if (a === -1) return { reasoning: "", answer: s };
          var reasoning = s.slice(r + SECTION_REASONING_TAG.length, a).replace(/^\r?\n/, "").replace(/\s+$/, "");
          var i = a + SECTION_ANSWER_TAG.length;
          if (s.charAt(i) === "\r" && s.charAt(i + 1) === "\n") i += 2;
          else if (s.charAt(i) === "\n") i += 1;
          return { reasoning, answer: s.slice(i) };
        }
        function applyReasoningExportFields(messages, enabled) {
          var changed = 0;
          try {
            if (enabled !== true || !Array.isArray(messages)) return { changed: 0 };
            for (var i = 0; i < messages.length; i++) {
              var m = messages[i];
              if (!m || typeof m !== "object") continue;
              var text = typeof m.text === "string" ? m.text : "";
              var reasoning = typeof m.reasoning === "string" ? m.reasoning : "";
              var captured = typeof m.hiddenReasoning === "string" ? m.hiddenReasoning : "";
              if (!reasoning) reasoning = captured;
              if (!reasoning && text && m.role !== "user") {
                var pair = splitReasoningSections(text);
                if (pair && pair.reasoning) {
                  reasoning = pair.reasoning;
                  text = pair.answer;
                }
              }
              if (!reasoning) continue;
              if (!captured && text === m.text) continue;
              var next = {};
              for (var k in m) {
                if (Object.prototype.hasOwnProperty.call(m, k)) next[k] = m[k];
              }
              next.text = text;
              next.reasoning = reasoning;
              if (next.hiddenReasoning) delete next.hiddenReasoning;
              messages[i] = next;
              changed++;
            }
          } catch (eApply) {
            return { changed };
          }
          return { changed };
        }
        var TOOL_RESULTS_OPEN = "[TOOL_RESULTS]";
        var TOOL_RESULTS_CLOSE = "[/TOOL_RESULTS]";
        var TOOL_RESULTS_TAIL = "Continue answering based on the tool results above.";
        function isToolResultsOnlyText(text) {
          try {
            var s = typeof text === "string" ? text : String(text == null ? "" : text);
            var t = s.trim();
            if (t.indexOf(TOOL_RESULTS_OPEN) !== 0) return false;
            var close = t.indexOf(TOOL_RESULTS_CLOSE);
            if (close === -1) return false;
            var rest = t.slice(close + TOOL_RESULTS_CLOSE.length).trim();
            if (rest === TOOL_RESULTS_TAIL) rest = "";
            return rest === "";
          } catch (e) {
            return false;
          }
        }
        var TOOL_CALL_TAG_NAMES = [
          "browser_navigate",
          "browser_go_back",
          "browser_go_forward",
          "browser_refresh",
          "browser_list_tabs",
          "browser_select_tab",
          "browser_close_tab",
          "browser_snapshot",
          "browser_click",
          "browser_hover",
          "browser_fill",
          "browser_fill_form",
          "browser_key",
          "browser_type",
          "browser_attach_file",
          "browser_wait_for",
          "browser_handle_dialog",
          "browser_evaluate_script",
          "memory_save",
          "memory_update",
          "memory_delete",
          "web_search",
          "web_fetch"
        ];
        var TOOL_CALL_TAG_ALT = "(?:" + TOOL_CALL_TAG_NAMES.join("|") + "|shell_\\w+|python_\\w+|skill_\\w+)";
        var RE_TOOL_CALL_BLOCK = new RegExp(
          "<(" + TOOL_CALL_TAG_ALT + ")(?:\\s[^>]*)?>[\\s\\S]*?<\\/\\1\\s*>\\s*",
          "g"
        );
        function stripToolCallBlocks(text) {
          var s = typeof text === "string" ? text : String(text == null ? "" : text);
          if (s.indexOf("<") === -1) return s;
          RE_TOOL_CALL_BLOCK.lastIndex = 0;
          var out = s.replace(RE_TOOL_CALL_BLOCK, "");
          if (out === s) return s;
          return out.replace(/\s+$/, "");
        }
        function isEmptyExportText(text) {
          try {
            return String(text == null ? "" : text).trim() === "";
          } catch (e) {
            return false;
          }
        }
        function copyMessageWithText(message, text) {
          var keep = {};
          for (var k in message) {
            if (Object.prototype.hasOwnProperty.call(message, k)) keep[k] = message[k];
          }
          keep.text = text;
          return keep;
        }
        function sanitizeEmitMessages(messages) {
          var out = [];
          var sanitized = 0;
          var skipped = [];
          var dropped = 0;
          var bdsRemoved = 0;
          var bdsForms = [];
          var tcRemoved = 0;
          var tcForms = [];
          try {
            var src = Array.isArray(messages) ? messages : [];
            for (var i = 0; i < src.length; i++) {
              var m = stripHiddenFields(src[i]);
              if (!m || typeof m !== "object") {
                bdsDiagLine("o40-emit-msg", { i, len: 0, head: bdsDiagSlice("", 0, 40), tail: bdsDiagSlice("", 1, 40), called: 0, removed: 0 });
                out.push(m);
                continue;
              }
              var raw = typeof m.text === "string" ? m.text : "";
              if (typeof aiCmDiagOn === "function" && aiCmDiagOn() && m.role === "user" && isToolResultsOnlyText(raw)) {
                bdsDiagLine("o40-emit-msg", { i, len: raw.length, head: bdsDiagSlice(raw, 0, 40), tail: bdsDiagSlice(raw, 1, 40), called: 0, removed: 0 });
              }
              if (m.role === "user" && isToolResultsOnlyText(raw)) {
                dropped++;
                continue;
              }
              var bare = stripReasoningSections(raw);
              if (bare !== raw) m = copyMessageWithText(m, bare);
              var bdsIn = typeof m.text === "string" ? m.text : "";
              var bds = sanitizeBetterDeepSeekText(bdsIn);
              bdsDiagLine("o40-emit-msg", { i, len: bdsIn.length, head: bdsDiagSlice(bdsIn, 0, 40), tail: bdsDiagSlice(bdsIn, 1, 40), called: 1, removed: bds.removed });
              if (bds.removed > 0) {
                m = copyMessageWithText(m, bds.text);
                bdsRemoved += bds.removed;
                for (var bf = 0; bf < bds.forms.length; bf++) bdsForms.push(bds.forms[bf]);
              }
              var tc = sanitizeToolContinuationText(typeof m.text === "string" ? m.text : "");
              if (tc.removed > 0) {
                m = copyMessageWithText(m, tc.text);
                tcRemoved += tc.removed;
                for (var tf = 0; tf < tc.forms.length; tf++) tcForms.push(tc.forms[tf]);
              }
              if (m.role !== "user") {
                var cut = stripToolCallBlocks(typeof m.text === "string" ? m.text : "");
                if (cut !== m.text) m = copyMessageWithText(m, cut);
              } else {
                var text = typeof m.text === "string" ? m.text : "";
                var reason = injectedUserTextSkipReason(text);
                if (reason !== null) {
                  skipped.push(reason);
                } else {
                  m = copyMessageWithText(m, sanitizeInjectedUserText(text));
                  sanitized++;
                }
              }
              if (isEmptyExportText(typeof m.text === "string" ? m.text : "")) {
                dropped++;
                continue;
              }
              out.push(m);
            }
          } catch (e) {
            return {
              messages: Array.isArray(messages) ? messages : [],
              sanitized: 0,
              skipped: [],
              dropped: 0,
              bdsRemoved: 0,
              bdsForms: [],
              tcRemoved: 0,
              tcForms: []
            };
          }
          return {
            messages: out,
            sanitized,
            skipped,
            dropped,
            bdsRemoved,
            bdsForms,
            tcRemoved,
            tcForms
          };
        }
        var HIDDEN_REASONING_TAG = SECTION_REASONING_TAG;
        var HIDDEN_ANSWER_TAG = SECTION_ANSWER_TAG;
        function hasHiddenFields(message) {
          try {
            if (!message || typeof message !== "object") return false;
            return Object.prototype.hasOwnProperty.call(message, "hiddenReasoning") || Object.prototype.hasOwnProperty.call(message, "hiddenInjection");
          } catch (e) {
            return false;
          }
        }
        function hiddenReasoningOf(message) {
          try {
            var r = message && typeof message.hiddenReasoning === "string" ? message.hiddenReasoning : "";
            return r.trim();
          } catch (e) {
            return "";
          }
        }
        function withoutHiddenFields(message) {
          var keep = {};
          for (var k in message) {
            if (!Object.prototype.hasOwnProperty.call(message, k)) continue;
            if (k === "hiddenReasoning" || k === "hiddenInjection") continue;
            keep[k] = message[k];
          }
          return keep;
        }
        function stripHiddenFields(message) {
          if (!message || typeof message !== "object") return message;
          return hasHiddenFields(message) ? withoutHiddenFields(message) : message;
        }
        function hasReasoningInSource(messages) {
          var src = Array.isArray(messages) ? messages : [];
          for (var i = 0; i < src.length; i++) {
            var m = src[i];
            if (!m || typeof m !== "object") continue;
            var reasoning = typeof m.reasoning === "string" ? m.reasoning : "";
            if (reasoning.trim() !== "") return true;
            var text = typeof m.text === "string" ? m.text : "";
            if (text.indexOf(SECTION_REASONING_TAG) !== -1) return true;
          }
          return false;
        }
        function effectiveReasoningToggle(userToggle, sourceHasReasoning, site) {
          if (userToggle === true) return true;
          if (site === "qwen" || site === "deepseek") return false;
          return sourceHasReasoning === true;
        }
        function includeHiddenExportBlocks(messages) {
          var src = Array.isArray(messages) ? messages : [];
          var out = [];
          for (var i = 0; i < src.length; i++) {
            var m = src[i];
            if (!m || typeof m !== "object" || !hasHiddenFields(m)) {
              out.push(m);
              continue;
            }
            var keep = withoutHiddenFields(m);
            var reasoning = hiddenReasoningOf(m);
            var text = typeof keep.text === "string" ? keep.text : "";
            if (reasoning && text.indexOf(reasoning) === -1) {
              keep.text = HIDDEN_REASONING_TAG + "\n" + reasoning + "\n\n" + HIDDEN_ANSWER_TAG + "\n" + text;
            }
            out.push(keep);
          }
          return out;
        }
        function unionTurnsById(existing, incoming) {
          var seen = {};
          var out = [];
          var i, t;
          for (i = 0; existing && i < existing.length; i++) {
            t = existing[i];
            if (!t || t.id == null || seen[t.id]) continue;
            seen[t.id] = true;
            out.push(t);
          }
          for (i = 0; incoming && i < incoming.length; i++) {
            t = incoming[i];
            if (!t || t.id == null || seen[t.id]) continue;
            seen[t.id] = true;
            out.push(t);
          }
          return out;
        }
        var Api = {
          buildAutoExportFileName,
          disambiguateFileName,
          isFileNameTaken,
          buildExportFileName,
          buildGsaExportFileName,
          resolveAutoExportConvId,
          notCompleteReason,
          shouldSkipGsaPageGuard,
          shouldSkipAutoExport,
          shouldSkipBaseCompleteTrigger,
          effectiveAutoExportThreshold,
          pickExportSource,
          resolveExportSource,
          // Two-Tier (v89): метка достоверности источника файла — чистая функция наружу
          // (её зовёт core/export-manager.js:aiCmGetSourceTier).
          sourceTierOf,
          markAutoExportFired,
          getAutoExportFired,
          resetAutoExportFired,
          firedSessionKey,
          isFiredInSession,
          sessionFiredPatch,
          extractConvIdFromUrl,
          normalizeExportMessages,
          coreText,
          stripMarkerResidue,
          dedupeMessages,
          dedupeIntraMessage,
          dedupeCrossRawCopies,
          separateRawBlocks,
          prepareExportMessages,
          sanitizeInjectedUserText,
          injectedUserTextSkipReason,
          sanitizeEmitMessages,
          // O-40: инъекции соседнего расширения Better DeepSeek — чистые функции и таблица
          // измеренных форм наружу (пины D/R нового тест-файла читают формы из таблицы).
          sanitizeBetterDeepSeekText,
          betterDeepSeekForms: BDS_INJECTION_FORMS,
          bdsWrapperFormId: BDS_WRAPPER_ID,
          // O-42: агентный конверт Better DeepSeek (tool-continuation) — чистая функция и таблица
          // измеренных дескрипторов конверта наружу (пины D/R нового тест-файла читают таблицу).
          sanitizeToolContinuationText,
          toolContinuationForms: TC_ENVELOPE_FORMS,
          // O-7 (OFF): урезание секций reasoning на выходе экспорта — чистая функция наружу.
          stripReasoningSections,
          // O-37 (C): обратное преобразование пары [REASONING]/[ANSWER] в отдельные поля
          // (reasoning/answer) — чистая функция наружу (переиспользуется точкой сбора экспорта).
          splitReasoningSections,
          // O-37 (C): нормализация размышления на выходе точки сбора экспорта (по месту, по флагу
          // сайта) — чистая функция наружу; на боевом пути её зовёт core/export-manager.js.
          applyReasoningExportFields,
          // O-7 (OFF, S3/S4): служебный тул-мусор DeepSeek++ — чистые функции наружу.
          isToolResultsOnlyText,
          stripToolCallBlocks,
          // O-7: hidden-блоки DeepSeek (сырой режим экспорта) — чистые функции наружу.
          includeHiddenExportBlocks,
          stripHiddenFields,
          hiddenReasoningOf,
          // D-O41: авто-ON тумблера при наличии reasoning в источнике — чистые функции наружу
          // (пины S/D нового тест-файла; на боевом пути их зовёт core/export-manager.js).
          hasReasoningInSource,
          effectiveReasoningToggle,
          unionTurnsById,
          latchKey
        };
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmExportEmitPipeline = Api;
      })();
      var currentAdapter = null;
      var observer = null;
      var isInitialized = false;
      var lastPercentage = -1;
      var updateTimer = null;
      var widgetElement = null;
      var lastWidgetData = null;
      var badgeSuppressed = false;
      var maxTokenCount = 0;
      var restoredTapeLoaded = false;
      var restoreDone = false;
      var cacheRefreshPlanned = {};
      var tapeRestoreSeen = {};
      var aiCmTapeAccountIdx = {};
      var aiCmRestoredDispatched = {};
      var baseText = "";
      var baseCount = 0;
      var baseSeen = false;
      var aiCmNetRawCount = 0;
      var aiCmNetRawCountUsed = -1;
      var adapterBaseSeen = false;
      var baseComplete = false;
      var lastBounded = false;
      var lastTailSig = null;
      var lastBaseSig = null;
      var lastEmitSig = null;
      var lastDrawSig = null;
      var lastHybridTailSig = null;
      var lastMetricSig = null;
      var notCompleteLogged = {};
      var aiCmLoaderFreeze = false;
      var baseIdSet = null;
      var lastBaseIds = [];
      var lastBaseTexts = [];
      var baseSkelSet = null;
      var baseAnchors = null;
      var ANCHOR_MIN = 40;
      var stale = false;
      var staleTimer = null;
      var lastDetailMessages = null;
      var lastHistoryWroteKey = null;
      var lastThreadId = null;
      var detectedModelSlug = "";
      var lastResolvedModelId = null;
      var lastSnapshotModelName = "";
      var netAttachTokens = 0;
      var netAttachBreak = null;
      var netServerTokens = 0;
      var netQwenUsage = null;
      var netEffectiveLen = 0;
      var exactCountEnabled = false;
      var geminiApiKey = "";
      var lastCountTokensText = "";
      var lastCountTokensCache = 0;
      var lastCountTokensConvId = "";
      var lastCountTokensErrorText = "";
      var countTokensTimer = null;
      var countTokensPending = false;
      var safePct = null;
      var popupRawModel = null;
      var popupRawPct = null;
      var popupModelId = null;
      var popupLimitPct = null;
      var aiCmLastDomEmitSig = null;
      var aiCmLastDomEmitConvId = null;
      var lastEmitConvId = "";
      var lastSnapConvId = "";
      var aiCmConvSourceByConv = {};
      var aiCmArchiveLoadStarted = {};
      var aiCmArchiveRestoredDispatched = {};
      var aiCmArchiveCountByConv = {};
      var aiCmSourceLabelNow = "";
      var autoExportSettings = { enabled: false, pct: 90, fmt: "txt" };
      var aiCmAutoExportFlagMissingLogged = false;
      var autoExportFired = {};
      var aiCmAutoExportFiredOnce = /* @__PURE__ */ Object.create(null);
      var aiCmAutoExportLastLogState = /* @__PURE__ */ Object.create(null);
      var autoExportPctBySite = {};
      var aiCmGsaNetworkCompleteLatch = /* @__PURE__ */ Object.create(null);
      var aiCmGsaNetworkCompleteThreadId = null;
      var autoExportLastConvId = "";
      var aiCmLoaderRunningByConv = {};
      var autoExportLastPct = -1;
      var aiCmPendingHistWrite = null;
      var aiCmCursorLiveByConv = {};
      var aiCmBaseConfirmedByConv = {};
      var aiCmLowConfidenceByConv = {};
      var aiCmLateCheckByConv = {};
      var trimProbe = {};
      var preTrimExportFired = {};
      var trimRetryByConv = {};
      var TRIM_HEAD_IDS_N = 10;
      var aiCmSwAlive = function() {
        try {
          return typeof chrome !== "undefined" && !!chrome.runtime && typeof chrome.runtime.sendMessage === "function";
        } catch (eAlive) {
          return false;
        }
      };
      function aiCmSwAsk(payload) {
        return new Promise(function(resolve) {
          try {
            if (!aiCmSwAlive()) {
              resolve(null);
              return;
            }
            chrome.runtime.sendMessage(payload, function(resp) {
              var err = null;
              try {
                err = chrome.runtime.lastError;
              } catch (eLe) {
                err = null;
              }
              resolve(err ? null : resp || null);
            });
          } catch (eAsk) {
            resolve(null);
          }
        });
      }
      function aiCmLatchGetAll() {
        return aiCmSwAsk({ type: "aiCm-latch-get-all" }).then(function(resp) {
          return resp && typeof resp === "object" && resp.map ? resp.map : {};
        }).catch(function() {
          return {};
        });
      }
      function aiCmLatchSet(service, convId) {
        return aiCmSwAsk({ type: "aiCm-latch-set", service: String(service || ""), convId: String(convId || "") }).then(function(resp) {
          return !!(resp && resp.ok);
        }).catch(function() {
          return false;
        });
      }
      function aiCmLatchRemove(service, convId) {
        return aiCmSwAsk({ type: "aiCm-latch-remove", service: String(service || ""), convId: String(convId || "") }).then(function(resp) {
          return !!(resp && resp.ok);
        }).catch(function() {
          return false;
        });
      }
      (function() {
        var Api = {};
        Object.defineProperty(Api, "currentAdapter", {
          enumerable: true,
          get: function() {
            return currentAdapter;
          },
          set: function(value) {
            currentAdapter = value;
          }
        });
        Object.defineProperty(Api, "observer", {
          enumerable: true,
          get: function() {
            return observer;
          },
          set: function(value) {
            observer = value;
          }
        });
        Object.defineProperty(Api, "isInitialized", {
          enumerable: true,
          get: function() {
            return isInitialized;
          },
          set: function(value) {
            isInitialized = value;
          }
        });
        Object.defineProperty(Api, "lastPercentage", {
          enumerable: true,
          get: function() {
            return lastPercentage;
          },
          set: function(value) {
            lastPercentage = value;
          }
        });
        Object.defineProperty(Api, "updateTimer", {
          enumerable: true,
          get: function() {
            return updateTimer;
          },
          set: function(value) {
            updateTimer = value;
          }
        });
        Object.defineProperty(Api, "widgetElement", {
          enumerable: true,
          get: function() {
            return widgetElement;
          },
          set: function(value) {
            widgetElement = value;
          }
        });
        Object.defineProperty(Api, "lastWidgetData", {
          enumerable: true,
          get: function() {
            return lastWidgetData;
          },
          set: function(value) {
            lastWidgetData = value;
          }
        });
        Object.defineProperty(Api, "badgeSuppressed", {
          enumerable: true,
          get: function() {
            return badgeSuppressed;
          },
          set: function(value) {
            badgeSuppressed = value;
          }
        });
        Object.defineProperty(Api, "maxTokenCount", {
          enumerable: true,
          get: function() {
            return maxTokenCount;
          },
          set: function(value) {
            maxTokenCount = value;
          }
        });
        Object.defineProperty(Api, "restoredTapeLoaded", {
          enumerable: true,
          get: function() {
            return restoredTapeLoaded;
          },
          set: function(value) {
            restoredTapeLoaded = value;
          }
        });
        Object.defineProperty(Api, "restoreDone", {
          enumerable: true,
          get: function() {
            return restoreDone;
          },
          set: function(value) {
            restoreDone = value;
          }
        });
        Object.defineProperty(Api, "cacheRefreshPlanned", {
          enumerable: true,
          get: function() {
            return cacheRefreshPlanned;
          },
          set: function(value) {
            cacheRefreshPlanned = value;
          }
        });
        Object.defineProperty(Api, "tapeRestoreSeen", {
          enumerable: true,
          get: function() {
            return tapeRestoreSeen;
          },
          set: function(value) {
            tapeRestoreSeen = value;
          }
        });
        Object.defineProperty(Api, "aiCmTapeAccountIdx", {
          enumerable: true,
          get: function() {
            return aiCmTapeAccountIdx;
          },
          set: function(value) {
            aiCmTapeAccountIdx = value;
          }
        });
        Object.defineProperty(Api, "aiCmRestoredDispatched", {
          enumerable: true,
          get: function() {
            return aiCmRestoredDispatched;
          },
          set: function(value) {
            aiCmRestoredDispatched = value;
          }
        });
        Object.defineProperty(Api, "baseText", {
          enumerable: true,
          get: function() {
            return baseText;
          },
          set: function(value) {
            baseText = value;
          }
        });
        Object.defineProperty(Api, "baseCount", {
          enumerable: true,
          get: function() {
            return baseCount;
          },
          set: function(value) {
            baseCount = value;
          }
        });
        Object.defineProperty(Api, "baseSeen", {
          enumerable: true,
          get: function() {
            return baseSeen;
          },
          set: function(value) {
            baseSeen = value;
          }
        });
        Object.defineProperty(Api, "baseComplete", {
          enumerable: true,
          get: function() {
            return baseComplete;
          },
          set: function(value) {
            baseComplete = value;
          }
        });
        Object.defineProperty(Api, "lastBounded", {
          enumerable: true,
          get: function() {
            return lastBounded;
          },
          set: function(value) {
            lastBounded = value;
          }
        });
        Object.defineProperty(Api, "lastTailSig", {
          enumerable: true,
          get: function() {
            return lastTailSig;
          },
          set: function(value) {
            lastTailSig = value;
          }
        });
        Object.defineProperty(Api, "lastBaseSig", {
          enumerable: true,
          get: function() {
            return lastBaseSig;
          },
          set: function(value) {
            lastBaseSig = value;
          }
        });
        Object.defineProperty(Api, "lastEmitSig", {
          enumerable: true,
          get: function() {
            return lastEmitSig;
          },
          set: function(value) {
            lastEmitSig = value;
          }
        });
        Object.defineProperty(Api, "lastDrawSig", {
          enumerable: true,
          get: function() {
            return lastDrawSig;
          },
          set: function(value) {
            lastDrawSig = value;
          }
        });
        Object.defineProperty(Api, "lastHybridTailSig", {
          enumerable: true,
          get: function() {
            return lastHybridTailSig;
          },
          set: function(value) {
            lastHybridTailSig = value;
          }
        });
        Object.defineProperty(Api, "lastMetricSig", {
          enumerable: true,
          get: function() {
            return lastMetricSig;
          },
          set: function(value) {
            lastMetricSig = value;
          }
        });
        Object.defineProperty(Api, "notCompleteLogged", {
          enumerable: true,
          get: function() {
            return notCompleteLogged;
          },
          set: function(value) {
            notCompleteLogged = value;
          }
        });
        Object.defineProperty(Api, "aiCmLoaderFreeze", {
          enumerable: true,
          get: function() {
            return aiCmLoaderFreeze;
          },
          set: function(value) {
            aiCmLoaderFreeze = value;
          }
        });
        Object.defineProperty(Api, "baseIdSet", {
          enumerable: true,
          get: function() {
            return baseIdSet;
          },
          set: function(value) {
            baseIdSet = value;
          }
        });
        Object.defineProperty(Api, "lastBaseIds", {
          enumerable: true,
          get: function() {
            return lastBaseIds;
          },
          set: function(value) {
            lastBaseIds = value;
          }
        });
        Object.defineProperty(Api, "lastBaseTexts", {
          enumerable: true,
          get: function() {
            return lastBaseTexts;
          },
          set: function(value) {
            lastBaseTexts = value;
          }
        });
        Object.defineProperty(Api, "baseSkelSet", {
          enumerable: true,
          get: function() {
            return baseSkelSet;
          },
          set: function(value) {
            baseSkelSet = value;
          }
        });
        Object.defineProperty(Api, "baseAnchors", {
          enumerable: true,
          get: function() {
            return baseAnchors;
          },
          set: function(value) {
            baseAnchors = value;
          }
        });
        Object.defineProperty(Api, "ANCHOR_MIN", {
          enumerable: true,
          get: function() {
            return ANCHOR_MIN;
          },
          set: function(value) {
            ANCHOR_MIN = value;
          }
        });
        Object.defineProperty(Api, "stale", {
          enumerable: true,
          get: function() {
            return stale;
          },
          set: function(value) {
            stale = value;
          }
        });
        Object.defineProperty(Api, "staleTimer", {
          enumerable: true,
          get: function() {
            return staleTimer;
          },
          set: function(value) {
            staleTimer = value;
          }
        });
        Object.defineProperty(Api, "lastDetailMessages", {
          enumerable: true,
          get: function() {
            return lastDetailMessages;
          },
          set: function(value) {
            lastDetailMessages = value;
          }
        });
        Object.defineProperty(Api, "lastHistoryWroteKey", {
          enumerable: true,
          get: function() {
            return lastHistoryWroteKey;
          },
          set: function(value) {
            lastHistoryWroteKey = value;
          }
        });
        Object.defineProperty(Api, "lastThreadId", {
          enumerable: true,
          get: function() {
            return lastThreadId;
          },
          set: function(value) {
            lastThreadId = value;
          }
        });
        Object.defineProperty(Api, "detectedModelSlug", {
          enumerable: true,
          get: function() {
            return detectedModelSlug;
          },
          set: function(value) {
            detectedModelSlug = value;
          }
        });
        Object.defineProperty(Api, "lastResolvedModelId", {
          enumerable: true,
          get: function() {
            return lastResolvedModelId;
          },
          set: function(value) {
            lastResolvedModelId = value;
          }
        });
        Object.defineProperty(Api, "lastSnapshotModelName", {
          enumerable: true,
          get: function() {
            return lastSnapshotModelName;
          },
          set: function(value) {
            lastSnapshotModelName = value;
          }
        });
        Object.defineProperty(Api, "netAttachTokens", {
          enumerable: true,
          get: function() {
            return netAttachTokens;
          },
          set: function(value) {
            netAttachTokens = value;
          }
        });
        Object.defineProperty(Api, "netAttachBreak", {
          enumerable: true,
          get: function() {
            return netAttachBreak;
          },
          set: function(value) {
            netAttachBreak = value;
          }
        });
        Object.defineProperty(Api, "netServerTokens", {
          enumerable: true,
          get: function() {
            return netServerTokens;
          },
          set: function(value) {
            netServerTokens = value;
          }
        });
        Object.defineProperty(Api, "netEffectiveLen", {
          enumerable: true,
          get: function() {
            return netEffectiveLen;
          },
          set: function(value) {
            netEffectiveLen = value;
          }
        });
        Object.defineProperty(Api, "exactCountEnabled", {
          enumerable: true,
          get: function() {
            return exactCountEnabled;
          },
          set: function(value) {
            exactCountEnabled = value;
          }
        });
        Object.defineProperty(Api, "geminiApiKey", {
          enumerable: true,
          get: function() {
            return geminiApiKey;
          },
          set: function(value) {
            geminiApiKey = value;
          }
        });
        Object.defineProperty(Api, "lastCountTokensText", {
          enumerable: true,
          get: function() {
            return lastCountTokensText;
          },
          set: function(value) {
            lastCountTokensText = value;
          }
        });
        Object.defineProperty(Api, "lastCountTokensCache", {
          enumerable: true,
          get: function() {
            return lastCountTokensCache;
          },
          set: function(value) {
            lastCountTokensCache = value;
          }
        });
        Object.defineProperty(Api, "lastCountTokensConvId", {
          enumerable: true,
          get: function() {
            return lastCountTokensConvId;
          },
          set: function(value) {
            lastCountTokensConvId = value;
          }
        });
        Object.defineProperty(Api, "lastCountTokensErrorText", {
          enumerable: true,
          get: function() {
            return lastCountTokensErrorText;
          },
          set: function(value) {
            lastCountTokensErrorText = value;
          }
        });
        Object.defineProperty(Api, "countTokensTimer", {
          enumerable: true,
          get: function() {
            return countTokensTimer;
          },
          set: function(value) {
            countTokensTimer = value;
          }
        });
        Object.defineProperty(Api, "countTokensPending", {
          enumerable: true,
          get: function() {
            return countTokensPending;
          },
          set: function(value) {
            countTokensPending = value;
          }
        });
        Object.defineProperty(Api, "safePct", {
          enumerable: true,
          get: function() {
            return safePct;
          },
          set: function(value) {
            safePct = value;
          }
        });
        Object.defineProperty(Api, "popupRawModel", {
          enumerable: true,
          get: function() {
            return popupRawModel;
          },
          set: function(value) {
            popupRawModel = value;
          }
        });
        Object.defineProperty(Api, "popupRawPct", {
          enumerable: true,
          get: function() {
            return popupRawPct;
          },
          set: function(value) {
            popupRawPct = value;
          }
        });
        Object.defineProperty(Api, "popupModelId", {
          enumerable: true,
          get: function() {
            return popupModelId;
          },
          set: function(value) {
            popupModelId = value;
          }
        });
        Object.defineProperty(Api, "popupLimitPct", {
          enumerable: true,
          get: function() {
            return popupLimitPct;
          },
          set: function(value) {
            popupLimitPct = value;
          }
        });
        Object.defineProperty(Api, "aiCmLastDomEmitSig", {
          enumerable: true,
          get: function() {
            return aiCmLastDomEmitSig;
          },
          set: function(value) {
            aiCmLastDomEmitSig = value;
          }
        });
        Object.defineProperty(Api, "aiCmLastDomEmitConvId", {
          enumerable: true,
          get: function() {
            return aiCmLastDomEmitConvId;
          },
          set: function(value) {
            aiCmLastDomEmitConvId = value;
          }
        });
        Object.defineProperty(Api, "lastEmitConvId", {
          enumerable: true,
          get: function() {
            return lastEmitConvId;
          },
          set: function(value) {
            lastEmitConvId = value;
          }
        });
        Object.defineProperty(Api, "lastSnapConvId", {
          enumerable: true,
          get: function() {
            return lastSnapConvId;
          },
          set: function(value) {
            lastSnapConvId = value;
          }
        });
        Object.defineProperty(Api, "aiCmConvSourceByConv", {
          enumerable: true,
          get: function() {
            return aiCmConvSourceByConv;
          },
          set: function(value) {
            aiCmConvSourceByConv = value;
          }
        });
        Object.defineProperty(Api, "aiCmArchiveLoadStarted", {
          enumerable: true,
          get: function() {
            return aiCmArchiveLoadStarted;
          },
          set: function(value) {
            aiCmArchiveLoadStarted = value;
          }
        });
        Object.defineProperty(Api, "aiCmArchiveRestoredDispatched", {
          enumerable: true,
          get: function() {
            return aiCmArchiveRestoredDispatched;
          },
          set: function(value) {
            aiCmArchiveRestoredDispatched = value;
          }
        });
        Object.defineProperty(Api, "aiCmArchiveCountByConv", {
          enumerable: true,
          get: function() {
            return aiCmArchiveCountByConv;
          },
          set: function(value) {
            aiCmArchiveCountByConv = value;
          }
        });
        Object.defineProperty(Api, "aiCmSourceLabelNow", {
          enumerable: true,
          get: function() {
            return aiCmSourceLabelNow;
          },
          set: function(value) {
            aiCmSourceLabelNow = value;
          }
        });
        Object.defineProperty(Api, "autoExportSettings", {
          enumerable: true,
          get: function() {
            return autoExportSettings;
          },
          set: function(value) {
            autoExportSettings = value;
          }
        });
        Object.defineProperty(Api, "aiCmAutoExportFlagMissingLogged", {
          enumerable: true,
          get: function() {
            return aiCmAutoExportFlagMissingLogged;
          },
          set: function(value) {
            aiCmAutoExportFlagMissingLogged = value;
          }
        });
        Object.defineProperty(Api, "autoExportFired", {
          enumerable: true,
          get: function() {
            return autoExportFired;
          },
          set: function(value) {
            autoExportFired = value;
          }
        });
        Object.defineProperty(Api, "aiCmAutoExportFiredOnce", {
          enumerable: true,
          get: function() {
            return aiCmAutoExportFiredOnce;
          },
          set: function(value) {
            aiCmAutoExportFiredOnce = value;
          }
        });
        Object.defineProperty(Api, "aiCmAutoExportLastLogState", {
          enumerable: true,
          get: function() {
            return aiCmAutoExportLastLogState;
          },
          set: function(value) {
            aiCmAutoExportLastLogState = value;
          }
        });
        Object.defineProperty(Api, "autoExportPctBySite", {
          enumerable: true,
          get: function() {
            return autoExportPctBySite;
          },
          set: function(value) {
            autoExportPctBySite = value;
          }
        });
        Object.defineProperty(Api, "aiCmGsaNetworkCompleteLatch", {
          enumerable: true,
          get: function() {
            return aiCmGsaNetworkCompleteLatch;
          },
          set: function(value) {
            aiCmGsaNetworkCompleteLatch = value;
          }
        });
        Object.defineProperty(Api, "aiCmGsaNetworkCompleteThreadId", {
          enumerable: true,
          get: function() {
            return aiCmGsaNetworkCompleteThreadId;
          },
          set: function(value) {
            aiCmGsaNetworkCompleteThreadId = value;
          }
        });
        Object.defineProperty(Api, "autoExportLastConvId", {
          enumerable: true,
          get: function() {
            return autoExportLastConvId;
          },
          set: function(value) {
            autoExportLastConvId = value;
          }
        });
        Object.defineProperty(Api, "aiCmLoaderRunningByConv", {
          enumerable: true,
          get: function() {
            return aiCmLoaderRunningByConv;
          },
          set: function(value) {
            aiCmLoaderRunningByConv = value;
          }
        });
        Object.defineProperty(Api, "autoExportLastPct", {
          enumerable: true,
          get: function() {
            return autoExportLastPct;
          },
          set: function(value) {
            autoExportLastPct = value;
          }
        });
        Object.defineProperty(Api, "aiCmPendingHistWrite", {
          enumerable: true,
          get: function() {
            return aiCmPendingHistWrite;
          },
          set: function(value) {
            aiCmPendingHistWrite = value;
          }
        });
        Object.defineProperty(Api, "aiCmCursorLiveByConv", {
          enumerable: true,
          get: function() {
            return aiCmCursorLiveByConv;
          },
          set: function(value) {
            aiCmCursorLiveByConv = value;
          }
        });
        Object.defineProperty(Api, "aiCmBaseConfirmedByConv", {
          enumerable: true,
          get: function() {
            return aiCmBaseConfirmedByConv;
          },
          set: function(value) {
            aiCmBaseConfirmedByConv = value;
          }
        });
        Object.defineProperty(Api, "aiCmLowConfidenceByConv", {
          enumerable: true,
          get: function() {
            return aiCmLowConfidenceByConv;
          },
          set: function(value) {
            aiCmLowConfidenceByConv = value;
          }
        });
        Object.defineProperty(Api, "aiCmLateCheckByConv", {
          enumerable: true,
          get: function() {
            return aiCmLateCheckByConv;
          },
          set: function(value) {
            aiCmLateCheckByConv = value;
          }
        });
        Object.defineProperty(Api, "trimProbe", {
          enumerable: true,
          get: function() {
            return trimProbe;
          },
          set: function(value) {
            trimProbe = value;
          }
        });
        Object.defineProperty(Api, "preTrimExportFired", {
          enumerable: true,
          get: function() {
            return preTrimExportFired;
          },
          set: function(value) {
            preTrimExportFired = value;
          }
        });
        Object.defineProperty(Api, "trimRetryByConv", {
          enumerable: true,
          get: function() {
            return trimRetryByConv;
          },
          set: function(value) {
            trimRetryByConv = value;
          }
        });
        Object.defineProperty(Api, "TRIM_HEAD_IDS_N", {
          enumerable: true,
          get: function() {
            return TRIM_HEAD_IDS_N;
          },
          set: function(value) {
            TRIM_HEAD_IDS_N = value;
          }
        });
        Object.defineProperty(Api, "aiCmSwAsk", {
          enumerable: true,
          get: function() {
            return aiCmSwAsk;
          }
        });
        Object.defineProperty(Api, "aiCmLatchGetAll", {
          enumerable: true,
          get: function() {
            return aiCmLatchGetAll;
          }
        });
        Object.defineProperty(Api, "aiCmLatchSet", {
          enumerable: true,
          get: function() {
            return aiCmLatchSet;
          }
        });
        Object.defineProperty(Api, "aiCmLatchRemove", {
          enumerable: true,
          get: function() {
            return aiCmLatchRemove;
          }
        });
        Object.defineProperty(Api, "aiCmNetRawCount", {
          enumerable: true,
          get: function() {
            return aiCmNetRawCount;
          },
          set: function(value) {
            aiCmNetRawCount = value;
          }
        });
        Object.defineProperty(Api, "aiCmNetRawCountUsed", {
          enumerable: true,
          get: function() {
            return aiCmNetRawCountUsed;
          },
          set: function(value) {
            aiCmNetRawCountUsed = value;
          }
        });
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmState = Api;
      })();
      function safePctKey() {
        return "ai_cm_safe_pct_" + getServiceKey();
      }
      var aiCmRingThresholds = null;
      function aiCmRingBounds() {
        var raw = typeof aiCmRingThresholds !== "undefined" ? aiCmRingThresholds : null;
        if (raw && typeof raw === "object" && raw.length === 3) {
          var a = parseInt(raw[0], 10), b = parseInt(raw[1], 10), c = parseInt(raw[2], 10);
          if (isFinite(a) && isFinite(b) && isFinite(c) && a >= 1 && b >= 1 && c >= 1 && a <= 100 && b <= 100 && c <= 100 && a < b && b < c) return [a, c];
        }
        return [70, 95];
      }
      function zoneColor(p) {
        const bounds = typeof aiCmRingBounds === "function" ? aiCmRingBounds() : [70, 95];
        if (p < bounds[0]) return "#22c55e";
        if (p < bounds[1]) return "#eab308";
        return "#ef4444";
      }
      function aiCmActivePct() {
        if (typeof safePct === "number" && safePct > 0) return safePct;
        if (typeof popupLimitPct === "number" && popupLimitPct > 0 && popupLimitPct !== 100) return popupLimitPct;
        return null;
      }
      function computeEffectiveLimit(modelId) {
        return ModelConfig.computeDisplayLimit(modelId, aiCmActivePct());
      }
      function aiCmSetPopupOverrides(rawModel, rawPct) {
        popupRawModel = rawModel === void 0 ? null : rawModel;
        popupRawPct = rawPct === void 0 ? null : rawPct;
        aiCmRefreshPopupOverrides();
      }
      function aiCmRefreshPopupOverrides() {
        const m = ModelConfig.resolvePopupModelId(popupRawModel);
        const p = ModelConfig.resolveLimitPct(popupRawPct);
        const changed = m !== popupModelId || p !== popupLimitPct;
        popupModelId = m;
        popupLimitPct = p;
        if (!changed) return;
        debugLog("log", "[model-detect] H19 popup-override model=" + (popupModelId || "\u0430\u0432\u0442\u043E") + " pct=" + (popupLimitPct == null ? "\u0430\u0432\u0442\u043E" : popupLimitPct));
        updatePanel();
        if (isInitialized) processAndSend();
      }
      function aiCmLoadPopupOverrides() {
        try {
          if (!isExtensionValid() || !chrome.storage || !chrome.storage.sync) return;
          chrome.storage.sync.get(["selectedModel", "customLimit"], function(d) {
            try {
              aiCmSetPopupOverrides(d && d.selectedModel, d && d.customLimit);
            } catch (eA) {
              swallowSoft(eA, "widget:loadPopupOverrides-callback");
            }
          });
        } catch (e) {
          debugLog("log", "[model-detect] H19 popup-override load error: " + (e && e.message || e));
        }
      }
      function updatePanel() {
        if (!widgetElement) return;
        const i18n = typeof aiCmI18nMessage === "function" ? aiCmI18nMessage : function(key, fallback) {
          return fallback;
        };
        const status = widgetElement.querySelector(".ai-cm-limit-text");
        const input = widgetElement.querySelector(".ai-cm-input");
        if (!status) return;
        const effLim = lastWidgetData ? lastWidgetData.effectiveLimit : 0;
        const pct = aiCmActivePct();
        if (pct != null) {
          const eff = Math.max(1, Math.round(pct / 100 * effLim));
          status.textContent = i18n("content_panel_threshold", "\u041F\u043E\u0440\u043E\u0433 " + pct + "% = " + eff.toLocaleString() + " \u0442\u043E\u043A", [String(pct), eff.toLocaleString()]);
          if (input) input.value = String(pct);
        } else {
          status.textContent = i18n("content_panel_auto_status", "\u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433: " + effLim.toLocaleString() + " \u0442\u043E\u043A (= 100% \u0432 \u043F\u043E\u043B\u0435)", [effLim.toLocaleString()]);
          if (input) input.value = "";
        }
      }
      function snapCurrentPct() {
        const eff = lastWidgetData ? lastWidgetData.effectiveLimit : 0;
        const t = lastWidgetData ? lastWidgetData.tokenEstimate : 0;
        if (!eff || !t || t <= 0) return;
        safePct = Math.max(1, Math.round(t / eff * 1e3) / 10);
        if (isExtensionValid()) {
          try {
            chrome.storage.sync.set({ [safePctKey()]: safePct });
          } catch (e) {
            swallowSoft(e, "widget:snapCurrentPct");
          }
        }
        updatePanel();
        processAndSend();
      }
      function setSafePctFromInput(v) {
        const n = parseFloat(v);
        if (isNaN(n) || n <= 0) {
          resetSafePct();
          return;
        }
        safePct = Math.round(n * 10) / 10;
        if (isExtensionValid()) {
          try {
            chrome.storage.sync.set({ [safePctKey()]: safePct });
          } catch (e) {
            swallowSoft(e, "widget:setSafePctFromInput");
          }
        }
        updatePanel();
        processAndSend();
      }
      function resetSafePct() {
        safePct = null;
        if (isExtensionValid()) {
          try {
            chrome.storage.sync.set({ [safePctKey()]: null });
          } catch (e) {
            swallowSoft(e, "widget:resetSafePct");
          }
        }
        updatePanel();
        processAndSend();
      }
      function stepSafePct(delta) {
        if (!widgetElement) return;
        const input = widgetElement.querySelector(".ai-cm-input");
        if (!input) return;
        let cur = parseFloat(input.value);
        if (isNaN(cur)) cur = 100;
        let next = Math.round((cur + delta) * 10) / 10;
        if (next < 1) next = 1;
        if (next > 100) next = 100;
        setSafePctFromInput(String(next));
      }
      function resetConversationState() {
        if (typeof aiCmDiagLine === "function") {
          aiCmDiagLine("gsa-state", {
            point: "resetConversationState",
            verdict: "reset",
            reason: "caller-see-src",
            doc: typeof aiCmDiagDocKind === "function" ? aiCmDiagDocKind() : "unknown",
            site: typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "",
            threadId: typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() : "",
            src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : ""
          });
        }
        debugLog("log", "[content-trace] RESET \u0432\u0438\u0434\u0436\u0435\u0442\u0430 seq=" + (++window.__aiCmTraceSeq || (window.__aiCmTraceSeq = 1)) + " t=" + Date.now());
        baseText = "";
        baseCount = 0;
        baseSeen = false;
        aiCmNetRawCount = 0;
        aiCmNetRawCountUsed = -1;
        baseComplete = false;
        if (typeof aiCmGsaNetworkCompleteReset === "function") {
          aiCmGsaNetworkCompleteReset(typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() || "" : "");
        }
        try {
          aiCmLateCheckByConv = {};
          aiCmCursorLiveByConv = {};
        } catch (eReset) {
        }
        try {
          aiCmBaseConfirmedByConv = {};
        } catch (eReset2) {
        }
        try {
          aiCmLowConfidenceByConv = {};
        } catch (eResetLc63) {
        }
        try {
          trimProbe = {};
          preTrimExportFired = {};
          trimRetryByConv = {};
        } catch (eTrimReset) {
        }
        lastBounded = false;
        maxTokenCount = 0;
        baseIdSet = null;
        baseSkelSet = null;
        baseAnchors = null;
        lastTailSig = null;
        lastBaseIds = [];
        lastBaseTexts = [];
        lastDetailMessages = null;
        aiCmBasePrepared = null;
        lastHistoryWroteKey = null;
        lastThreadId = null;
        detectedModelSlug = "";
        netAttachTokens = 0;
        netAttachBreak = null;
        netServerTokens = 0;
        netEffectiveLen = 0;
        lastCountTokensText = "";
        lastCountTokensCache = 0;
        lastCountTokensConvId = "";
        lastCountTokensErrorText = "";
        lastPercentage = -1;
        lastResolvedModelId = null;
        lastSnapshotModelName = "";
        restoredTapeLoaded = false;
        cacheRefreshPlanned = {};
        restoreDone = false;
        tapeRestoreSeen = {};
        aiCmRestoredDispatched = {};
        aiCmArchiveLoadStarted = {};
        aiCmArchiveRestoredDispatched = {};
        aiCmArchiveCountByConv = {};
        lastEmitConvId = "";
        autoExportLastPct = -1;
        try {
          var cidD14 = getCurrentConvId() || "";
          var P14 = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          var siteD14 = currentAdapter && currentAdapter.siteName || "";
          if (siteD14 === "google_search") {
            var logCidD14 = cidD14 || (typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() || "" : "");
            var logFiredD14 = typeof aiCmAutoExportLogFiredBit === "function" ? aiCmAutoExportLogFiredBit(siteD14, logCidD14) : 0;
            var logChangedD14 = typeof aiCmAutoExportLogOnChange !== "function" || aiCmAutoExportLogOnChange("spa-entry", siteD14 + "|" + logCidD14 + "|fired=" + logFiredD14);
            if (logChangedD14) {
              debugLog("log", "[AI CM][auto-export] site=google_search latch kept reason=spa-entry convId=" + (cidD14 || "(threadId)"));
            }
          } else if (P14 && typeof P14.resetAutoExportFired === "function") {
            P14.resetAutoExportFired(autoExportFired, siteD14, cidD14);
            try {
              if (P14.firedSessionKey) {
                aiCmLatchRemove(siteD14, cidD14);
                var pkD14 = P14.firedSessionKey(siteD14, cidD14);
                if (pkD14 && typeof sessionFiredCache === "object" && sessionFiredCache) delete sessionFiredCache[pkD14];
              }
            } catch (eO3D14) {
            }
          } else if (cidD14) {
            delete autoExportFired[cidD14];
          }
        } catch (eD14c) {
        }
        stale = false;
        scheduleStaleCheck();
        if (widgetElement) {
          const circle = widgetElement.querySelector(".ai-widget-fill");
          const pt = widgetElement.querySelector(".ai-widget-text");
          const tt = widgetElement.querySelector(".ai-widget-tooltip");
          if (circle) {
            const C = 2 * Math.PI * 43;
            circle.style.strokeDasharray = String(C);
            circle.style.strokeDashoffset = String(C);
            circle.style.stroke = zoneColor(0);
          }
          if (pt) pt.textContent = "\u2014";
          try {
            if (typeof aiCmDiagLine === "function" && typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "qwen") {
              aiCmDiagLine("qwen-badge", {
                ts: Date.now(),
                event: "placeholder",
                reason: "reset-conversation",
                convId: (typeof getCurrentConvId === "function" ? getCurrentConvId() || "" : "") || "(none)",
                url: String(typeof location !== "undefined" && location && location.href || "")
              });
            }
          } catch (eQbReset) {
          }
          if (tt) {
            const i18n = typeof aiCmI18nMessage === "function" ? aiCmI18nMessage : function(key, fallback) {
              return fallback;
            };
            tt.textContent = i18n("content_widget_loading", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430...");
          }
        }
        badgeSuppressed = true;
        adapterBaseSeen = false;
        lastWidgetData = null;
        try {
          if (aiCmRequestEmitTimer) clearTimeout(aiCmRequestEmitTimer);
          aiCmRequestEmitTimer = null;
          aiCmContentReadySent = false;
        } catch (eH23c) {
        }
        debugLog("log", "[content] \u0441\u043C\u0435\u043D\u0430 \u0447\u0430\u0442\u0430 \u2192 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u043E");
        try {
          if (isExtensionValid() && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove(["aiCmState", "aiCmState:" + window.location.hostname]);
          }
        } catch (eResetState14) {
          swallowSoft(eResetState14, "widget:resetConversationState-localRemove");
        }
        try {
          if (typeof aiCmRestartWidgetSafeBottomWatch === "function") aiCmRestartWidgetSafeBottomWatch();
        } catch (eSafeBottomReset) {
        }
      }
      var THEME_CONFIGS = {
        chatgpt: {
          font: "S\xF6hne, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          light: { bgTrack: "#f0f0f0", bgFill: "#10a37f", text: "#212121", tooltipBg: "#ffffff", tooltipText: "#212121", shadow: "0 2px 6px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)", border: "1px solid #e5e5e5" },
          dark: { bgTrack: "#2f2f2f", bgFill: "#19c37d", text: "#ececf1", tooltipBg: "#212121", tooltipText: "#ececf1", shadow: "0 2px 6px rgba(0,0,0,0.3)", border: "1px solid #424242" }
        },
        deepseek: {
          font: "Inter, system-ui, -apple-system, sans-serif",
          light: { bgTrack: "#e5e7eb", bgFill: "#4d6bfe", text: "#111827", tooltipBg: "#ffffff", tooltipText: "#111827", shadow: "0 4px 12px rgba(77, 107, 254, 0.1)", border: "1px solid #e5e7eb" },
          dark: { bgTrack: "#242b3d", bgFill: "#3d5afe", text: "#f3f4f6", tooltipBg: "#181f30", tooltipText: "#f3f4f6", shadow: "0 4px 20px rgba(0, 0, 0, 0.4)", border: "1px solid #2e374a" }
        },
        gemini: {
          font: '"Google Sans", Roboto, Arial, sans-serif',
          light: { bgTrack: "#e9eef6", bgFill: "url(#gemini-gradient)", text: "#1f1f1f", tooltipBg: "#e9eef6", tooltipText: "#1f1f1f", shadow: "0 4px 16px rgba(0,0,0,0.08)", border: "none" },
          dark: { bgTrack: "#37393b", bgFill: "url(#gemini-gradient)", text: "#e3e3e3", tooltipBg: "#1e1f20", tooltipText: "#e3e3e3", shadow: "0 4px 24px rgba(0,0,0,0.5)", border: "none" }
        },
        google_search: {
          font: '"Google Sans", Roboto, helvetica, arial, sans-serif',
          light: { bgTrack: "#f1f3f4", bgFill: "#1a73e8", text: "#3c4043", tooltipBg: "#ffffff", tooltipText: "#3c4043", shadow: "0 1px 6px rgba(32,33,36,0.28)", border: "1px solid #dadce0" },
          dark: { bgTrack: "#3c4043", bgFill: "#8ab4f8", text: "#e8eaed", tooltipBg: "#303134", tooltipText: "#e8eaed", shadow: "0 1px 6px rgba(0,0,0,0.4)", border: "1px solid #5f6368" }
        }
      };
      function getServiceKey() {
        const host = window.location.hostname;
        if (host.includes("chatgpt.com")) return "chatgpt";
        if (host.includes("deepseek.com")) return "deepseek";
        if (host.includes("gemini.google.com")) return "gemini";
        if (host.includes("google.com")) return "google_search";
        return host.includes("perplexity.ai") ? "perplexity" : host.includes("chat.qwen.ai") ? "qwen" : host.includes("claude.ai") ? "claude" : "chatgpt";
      }
      function aiCmInAppTheme() {
        try {
          const root = document.documentElement;
          const body = document.body;
          if (getServiceKey() === "gemini") {
            const cls = (root && root.className || "") + " " + (body && body.className || "");
            if (/(^|\s)dark-theme(\s|$)/.test(cls)) return "dark";
            if (/(^|\s)light-theme(\s|$)/.test(cls)) return "light";
            const hostEl = document.querySelector(".theme-host.dark-theme, .theme-host.light-theme");
            if (hostEl) return hostEl.classList.contains("dark-theme") ? "dark" : "light";
          }
          const probes = [body, root];
          for (let i = 0; i < probes.length; i++) {
            const el = probes[i];
            if (!el || typeof window.getComputedStyle !== "function") continue;
            const c = window.getComputedStyle(el).backgroundColor || "";
            const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s]+([\d.]+))?/);
            if (!m) continue;
            if (m[4] !== void 0 && parseFloat(m[4]) === 0) continue;
            if (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] < 100) return "dark";
          }
          return null;
        } catch (e) {
          return null;
        }
      }
      function isDarkMode() {
        const htmlClass = document.documentElement.classList;
        const bodyClass = document.body.classList;
        const dataTheme = document.documentElement.getAttribute("data-theme") || document.body.getAttribute("data-theme");
        if (htmlClass.contains("dark") || bodyClass.contains("dark") || dataTheme === "dark") return true;
        if (htmlClass.contains("light") || bodyClass.contains("light") || dataTheme === "light") return false;
        const inApp = aiCmInAppTheme();
        if (inApp === "dark") return true;
        if (inApp === "light") return false;
        return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      }
      var aiCmWidgetAppliedTheme = null;
      var aiCmThemePollTimer = null;
      var AI_CM_THEME_POLL_MS = 5e3;
      function applyNativeStyles(container) {
        const serviceKey = getServiceKey();
        const isDark = isDarkMode();
        const config = THEME_CONFIGS[serviceKey] || THEME_CONFIGS.chatgpt;
        const styles = isDark ? config.dark : config.light;
        container.style.setProperty("--w-font", config.font);
        container.style.setProperty("--w-bg-track", styles.bgTrack);
        container.style.setProperty("--w-bg-fill", styles.bgFill);
        container.style.setProperty("--w-text", styles.text);
        container.style.setProperty("--w-tooltip-bg", styles.tooltipBg);
        container.style.setProperty("--w-tooltip-text", styles.tooltipText);
        container.style.setProperty("--w-shadow", styles.shadow);
        container.style.setProperty("--w-border", styles.border);
        aiCmWidgetAppliedTheme = isDark;
      }
      function aiCmRefreshThemeIfNeeded() {
        try {
          const el = widgetElement;
          if (!el) return false;
          if (typeof el.isConnected === "boolean" && !el.isConnected) return false;
          const nowDark = isDarkMode();
          if (aiCmWidgetAppliedTheme === nowDark) return false;
          applyNativeStyles(el);
          debugLog("log", "[AI CM][theme] \u043F\u0430\u043B\u0438\u0442\u0440\u0430 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0448\u0435\u043D\u0430: " + (nowDark ? "dark" : "light") + " (live-\u0441\u043C\u0435\u043D\u0430 \u0442\u0435\u043C\u044B \u0441\u0435\u0440\u0432\u0438\u0441\u0430, \u0431\u0435\u0437 reload)");
          return true;
        } catch (eTh25) {
          return false;
        }
      }
      function aiCmStartThemePoll() {
        aiCmStopThemePoll();
        aiCmThemePollTimer = setInterval(function() {
          if (!widgetElement || typeof widgetElement.isConnected === "boolean" && !widgetElement.isConnected) {
            aiCmStopThemePoll();
            return;
          }
          aiCmRefreshThemeIfNeeded();
        }, AI_CM_THEME_POLL_MS);
      }
      function aiCmStopThemePoll() {
        if (aiCmThemePollTimer) {
          clearInterval(aiCmThemePollTimer);
          aiCmThemePollTimer = null;
        }
      }
      function aiCmRevealWidget() {
        try {
          if (!widgetElement) return;
          if (widgetElement.style.display === "none") widgetElement.style.display = "";
        } catch (eRev) {
        }
      }
      var AI_CM_SAFE_BOTTOM_DEFAULT = 24;
      var AI_CM_SAFE_BOTTOM_MIN = 12;
      var AI_CM_SAFE_BOTTOM_GAP = 12;
      var AI_CM_SAFE_BOTTOM_MAX_PX = 320;
      var AI_CM_SAFE_BOTTOM_MAX_VH = 0.4;
      var AI_CM_SAFE_BOTTOM_THROTTLE_MS = 150;
      var AI_CM_BOTTOM_CONTROL_SELECTOR = 'textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"], button[type="submit"]';
      var AI_CM_SAFE_BOTTOM_LISTEN_OPTS = { capture: true, passive: true };
      var aiCmSafeBottomWatchContainer = null;
      var aiCmSafeBottomObserver = null;
      var aiCmSafeBottomTimer = null;
      var aiCmSafeBottomRafPending = false;
      var aiCmSafeBottomLastRunAt = 0;
      function aiCmWidgetHostEl(container) {
        if (container) return container;
        return typeof document !== "undefined" && document && document.getElementById ? document.getElementById("ai-context-widget") : null;
      }
      function aiCmComputeWidgetSafeBottom(container) {
        const vh = typeof window !== "undefined" && typeof window.innerHeight === "number" ? window.innerHeight : 0;
        if (!(vh > 0)) return AI_CM_SAFE_BOTTOM_DEFAULT;
        const host = aiCmWidgetHostEl(container);
        let minTop = null;
        if (typeof document !== "undefined" && document && typeof document.querySelectorAll === "function") {
          const controls = document.querySelectorAll(AI_CM_BOTTOM_CONTROL_SELECTOR);
          for (let i = 0; i < controls.length; i++) {
            const el = (
              /** @type {HTMLElement} */
              controls[i]
            );
            if (host && el !== host && host.contains && host.contains(el)) continue;
            if (!el.offsetParent) continue;
            const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
            if (!rect || !(rect.width > 0) || !(rect.height > 0)) continue;
            if (!(rect.bottom > vh * 0.5)) continue;
            if (!(rect.top < vh)) continue;
            if (minTop === null || rect.top < minTop) minTop = rect.top;
          }
        }
        const raw = minTop === null ? AI_CM_SAFE_BOTTOM_DEFAULT : vh - minTop + AI_CM_SAFE_BOTTOM_GAP;
        const capped = Math.min(raw, vh * AI_CM_SAFE_BOTTOM_MAX_VH, AI_CM_SAFE_BOTTOM_MAX_PX);
        return Math.max(AI_CM_SAFE_BOTTOM_MIN, capped);
      }
      function aiCmUpdateWidgetSafeBottom(container) {
        const px = aiCmComputeWidgetSafeBottom(container);
        const host = aiCmWidgetHostEl(container);
        try {
          if (host && host.style && typeof host.style.setProperty === "function") host.style.setProperty("--acm-safe-bottom", px + "px");
        } catch (eSafeBottomWrite) {
        }
        return px;
      }
      function aiCmSafeBottomFlush() {
        aiCmSafeBottomTimer = null;
        aiCmSafeBottomRafPending = false;
        const el = aiCmSafeBottomWatchContainer;
        if (!el) return;
        if (typeof el.isConnected === "boolean" && !el.isConnected) {
          aiCmStopWidgetSafeBottomWatch();
          return;
        }
        aiCmSafeBottomLastRunAt = Date.now();
        aiCmUpdateWidgetSafeBottom(el);
      }
      function aiCmSafeBottomSchedule() {
        if (!aiCmSafeBottomWatchContainer) return;
        if (aiCmSafeBottomTimer !== null || aiCmSafeBottomRafPending) return;
        const elapsed = Date.now() - aiCmSafeBottomLastRunAt;
        if (elapsed < AI_CM_SAFE_BOTTOM_THROTTLE_MS) {
          aiCmSafeBottomTimer = setTimeout(function() {
            aiCmSafeBottomTimer = null;
            aiCmSafeBottomSchedule();
          }, AI_CM_SAFE_BOTTOM_THROTTLE_MS - elapsed);
          return;
        }
        aiCmSafeBottomRafPending = true;
        const raf = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" ? function(cb) {
          window.requestAnimationFrame(cb);
        } : function(cb) {
          setTimeout(cb, 16);
        };
        raf(function() {
          aiCmSafeBottomFlush();
        });
      }
      function aiCmStartWidgetSafeBottomWatch(container) {
        if (!container || typeof document === "undefined" || !document.body) return;
        if (aiCmSafeBottomWatchContainer === container && aiCmSafeBottomObserver) return;
        aiCmStopWidgetSafeBottomWatch();
        aiCmSafeBottomWatchContainer = container;
        try {
          if (typeof window !== "undefined" && window && typeof window.addEventListener === "function") {
            window.addEventListener("resize", aiCmSafeBottomSchedule, AI_CM_SAFE_BOTTOM_LISTEN_OPTS);
            window.addEventListener("scroll", aiCmSafeBottomSchedule, AI_CM_SAFE_BOTTOM_LISTEN_OPTS);
          }
          if (typeof MutationObserver === "function") {
            aiCmSafeBottomObserver = new MutationObserver(aiCmSafeBottomSchedule);
            aiCmSafeBottomObserver.observe(document.body, { childList: true, subtree: true });
          }
        } catch (eSafeBottomWatch) {
        }
        aiCmSafeBottomLastRunAt = Date.now();
        aiCmUpdateWidgetSafeBottom(container);
      }
      function aiCmStopWidgetSafeBottomWatch() {
        if (aiCmSafeBottomTimer !== null) {
          clearTimeout(aiCmSafeBottomTimer);
          aiCmSafeBottomTimer = null;
        }
        aiCmSafeBottomRafPending = false;
        if (aiCmSafeBottomObserver) {
          try {
            aiCmSafeBottomObserver.disconnect();
          } catch (eSafeBottomUnobserve) {
          }
          aiCmSafeBottomObserver = null;
        }
        try {
          if (typeof window !== "undefined" && window && typeof window.removeEventListener === "function") {
            window.removeEventListener("resize", aiCmSafeBottomSchedule, AI_CM_SAFE_BOTTOM_LISTEN_OPTS);
            window.removeEventListener("scroll", aiCmSafeBottomSchedule, AI_CM_SAFE_BOTTOM_LISTEN_OPTS);
          }
        } catch (eSafeBottomUnbind) {
        }
        aiCmSafeBottomWatchContainer = null;
      }
      function aiCmRestartWidgetSafeBottomWatch() {
        aiCmStopWidgetSafeBottomWatch();
        if (widgetElement) aiCmStartWidgetSafeBottomWatch(widgetElement);
      }
      var aiCmWidgetA11yBound = false;
      function aiCmWidgetCircleEl() {
        return widgetElement && typeof widgetElement.querySelector === "function" ? widgetElement.querySelector(".ai-widget-circle") : null;
      }
      function aiCmWidgetPanelEl() {
        return widgetElement && typeof widgetElement.querySelector === "function" ? widgetElement.querySelector(".ai-widget-panel") : null;
      }
      function aiCmSetWidgetPanelOpen(open, restoreFocus) {
        const panel = aiCmWidgetPanelEl();
        const circle = aiCmWidgetCircleEl();
        if (!panel || !circle) return false;
        const isOpen = open === true;
        panel.classList.toggle("open", isOpen);
        if (widgetElement) widgetElement.classList.toggle("ai-panel-open", isOpen);
        circle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) {
          updatePanel();
          const input = typeof widgetElement.querySelector === "function" ? (
            /** @type {HTMLInputElement} */
            widgetElement.querySelector(".ai-cm-input")
          ) : null;
          if (input && typeof input.focus === "function") {
            try {
              input.focus();
            } catch (eA11yFocusIn) {
            }
          }
        } else if (restoreFocus === true && typeof /** @type {HTMLElement} */
        circle.focus === "function") {
          try {
            circle.focus();
          } catch (eA11yFocusOut) {
          }
        }
        return isOpen;
      }
      function aiCmToggleWidgetPanel(restoreFocus) {
        const panel = aiCmWidgetPanelEl();
        if (!panel) return;
        aiCmSetWidgetPanelOpen(!panel.classList.contains("open"), restoreFocus);
      }
      function aiCmWidgetA11yKeydown(e) {
        if (!e || !widgetElement) return;
        const panel = aiCmWidgetPanelEl();
        if (!panel || !panel.classList.contains("open")) return;
        if (e.key !== "Escape" && e.key !== "Esc") return;
        if (typeof e.preventDefault === "function") e.preventDefault();
        aiCmSetWidgetPanelOpen(false, true);
      }
      function aiCmWidgetA11yDocClick(e) {
        if (!e || !widgetElement) return;
        const panel = aiCmWidgetPanelEl();
        if (!panel || !panel.classList.contains("open")) return;
        const target = e.target;
        if (target && typeof target.closest === "function" && target.closest("#ai-context-widget")) return;
        aiCmSetWidgetPanelOpen(false, false);
      }
      function aiCmBindWidgetA11y() {
        if (aiCmWidgetA11yBound) return;
        if (typeof document === "undefined" || !document || typeof document.addEventListener !== "function") return;
        aiCmWidgetA11yBound = true;
        document.addEventListener("keydown", aiCmWidgetA11yKeydown, true);
        document.addEventListener("click", aiCmWidgetA11yDocClick, true);
      }
      function aiCmSetWidgetA11yLabel(circleEl, percentage) {
        if (!circleEl || typeof circleEl.setAttribute !== "function") return;
        const i18n = typeof aiCmI18nMessage === "function" ? aiCmI18nMessage : function(key, fallback) {
          return fallback;
        };
        const pct = typeof percentage === "number" && isFinite(percentage) ? percentage : 0;
        const pctLabel = pct.toFixed(1);
        const bounds = typeof aiCmRingBounds === "function" ? aiCmRingBounds() : [70, 95];
        const status = pct < bounds[0] ? i18n("content_a11y_status_ok", "\u043D\u043E\u0440\u043C\u0430") : pct < bounds[1] ? i18n("content_a11y_status_warning", "\u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435") : i18n("content_a11y_status_critical", "\u043A\u0440\u0438\u0442\u0438\u0447\u043D\u043E");
        circleEl.setAttribute("aria-label", i18n("content_a11y_circle_label", "AI Context Monitor: " + pctLabel + "% \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E, " + status, [pctLabel, status]));
      }
      function aiCmRepaintRing() {
        if (typeof widgetElement === "undefined" || !widgetElement) return;
        var data = typeof lastWidgetData !== "undefined" && lastWidgetData ? lastWidgetData : null;
        if (!data || typeof data.percentage !== "number" || !isFinite(data.percentage)) return;
        var fill = widgetElement.querySelector(".ai-widget-fill");
        if (fill && fill.style) fill.style.stroke = zoneColor(data.percentage);
        try {
          if (typeof aiCmSetWidgetA11yLabel === "function") {
            aiCmSetWidgetA11yLabel(widgetElement.querySelector(".ai-widget-circle"), data.percentage);
          }
        } catch (eRingA11y) {
        }
      }
      function aiCmLoadRingThresholds() {
        if (typeof chrome === "undefined" || !chrome || !chrome.storage || !chrome.storage.local) return;
        try {
          chrome.storage.local.get(["aiCmProactiveThresholds"], function(res) {
            aiCmRingThresholds = res && res.aiCmProactiveThresholds !== void 0 ? res.aiCmProactiveThresholds : null;
            aiCmRepaintRing();
          });
        } catch (eRingGet) {
          swallowSoft(eRingGet, "widget:loadRingThresholds");
        }
        try {
          var selfRing = aiCmLoadRingThresholds;
          if (chrome.storage.onChanged && !selfRing.aiCmBound) {
            selfRing.aiCmBound = true;
            chrome.storage.onChanged.addListener(function(changes, areaName) {
              if (areaName !== "local" || !changes || !changes.aiCmProactiveThresholds) return;
              aiCmRingThresholds = changes.aiCmProactiveThresholds.newValue;
              aiCmRepaintRing();
            });
          }
        } catch (eRingWatch) {
        }
      }
      function createWidget() {
        if (document.getElementById("ai-context-widget")) return;
        const t = typeof aiCmI18nMessage === "function" ? aiCmI18nMessage : function(key, fallback) {
          return fallback;
        };
        const container = document.createElement("div");
        container.id = "ai-context-widget";
        container.replaceChildren(...(function(h) {
          var d = new DOMParser().parseFromString("<body>" + h + "</body>", "text/html");
          var o = [];
          for (var n = d.body.firstChild; n; n = n.nextSibling) o.push(document.importNode(n, true));
          return o;
        })(`<style> #ai-context-widget { position: fixed; bottom: var(--acm-safe-bottom, 24px); right: 24px; z-index: 999999; font-family: var(--w-font); user-select: none; } .ai-widget-circle { width: 64px; height: 64px; position: relative; cursor: pointer; background: var(--w-tooltip-bg); border-radius: 50%; box-shadow: var(--w-shadow); border: var(--w-border); display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); } .ai-widget-circle:hover { transform: scale(1.06); } .ai-widget-circle:focus-visible { outline: 2px solid var(--w-text); outline-offset: 2px; } .ai-widget-circle svg { width: 88%; height: 88%; transform: rotate(-90deg); } .ai-widget-bg { fill: none; stroke: var(--w-bg-track); stroke-width: 7; } .ai-widget-fill { fill: none; stroke: var(--w-bg-fill); stroke-width: 7; stroke-linecap: round; transition: stroke 0.18s ease, stroke-dashoffset 0.4s ease; } .ai-widget-text { position: absolute; font-size: 13px; font-weight: 600; color: var(--w-text); letter-spacing: -0.03em; } .ai-widget-tooltip { visibility: hidden; opacity: 0; position: absolute; bottom: 76px; right: 0; width: max-content; box-sizing: border-box; max-width: min(320px, calc(100vw - 48px)); max-height: 40vh; overflow-y: auto; overscroll-behavior: contain; background: var(--w-tooltip-bg); color: var(--w-tooltip-text); padding: 8px 12px; border-radius: 8px; font-size: 12px; line-height: 1.4; white-space: normal; overflow-wrap: break-word; box-shadow: var(--w-shadow); border: var(--w-border); transition: opacity 0.15s ease, visibility 0s linear 0.3s; } .ai-widget-circle:hover .ai-widget-tooltip { visibility: visible; opacity: 1; transition: opacity 0.15s ease, visibility 0s linear 0s; } #ai-context-widget.ai-panel-open .ai-widget-tooltip { visibility: hidden !important; opacity: 0 !important; transition: none; } .ai-widget-panel { display: none; position: absolute; bottom: 76px; right: 0; background: var(--w-tooltip-bg); color: var(--w-tooltip-text); padding: 10px; border-radius: 10px; box-shadow: var(--w-shadow); border: var(--w-border); flex-direction: column; gap: 6px; width: min(290px, calc(100vw - 48px)); max-height: calc(100vh - 108px); /* fallback for engines without var()/clamp() support in max-height; declared FIRST on purpose - this literal is pinned by tests/panel-overflow-contrast.test.js (i18n pin M-4.2: no user-facing ru literals here) */ max-height: clamp(130px, calc(100vh - var(--acm-safe-bottom, 24px) - 84px), calc(100vh - 108px)); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(127,127,127,0.5) transparent; box-sizing: border-box; font-size: 12px; line-height: 1.4; z-index: 1000000; white-space: normal; } .ai-widget-panel.open { display: flex; } .ai-cm-limit-text { font-weight: 600; margin-bottom: 2px; } .ai-cm-row { display: flex; align-items: center; gap: 6px; } .ai-cm-input { width: 55px; padding: 4px 2px; text-align: center; border-radius: 6px; border: 1px solid rgba(127,127,127,0.4); background: rgba(127,127,127,0.12); color: inherit; font-family: inherit; font-size: 13px; -webkit-appearance: textfield; -moz-appearance: textfield; appearance: textfield; } .ai-cm-input::-webkit-outer-spin-button, .ai-cm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; } .ai-cm-spin { display: flex; flex-direction: column; margin-left: -2px; } .ai-cm-spin button { cursor: pointer; border: 1px solid rgba(127,127,127,0.4); background: rgba(127,127,127,0.12); color: inherit; font-size: 8px; line-height: 1; padding: 2px 5px; font-family: inherit; } .ai-cm-spin button:first-child { border-radius: 4px 4px 0 0; border-bottom: none; } .ai-cm-spin button:last-child { border-radius: 0 0 4px 4px; } .ai-cm-spin button:hover { background: rgba(127,127,127,0.32); } .ai-cm-spin button:active { background: rgba(127,127,127,0.45); } .ai-cm-spin button:disabled { opacity: 0.38; cursor: default; } .ai-cm-btn { cursor: pointer; border: none; border-radius: 6px; padding: 6px 8px; font-size: 12px; font-family: inherit; background: rgba(127,127,127,0.18); color: inherit; text-align: left; } .ai-cm-btn:hover { background: rgba(127,127,127,0.32); } .ai-cm-btn:active { background: rgba(127,127,127,0.45); } .ai-cm-btn:focus-visible:not([aria-hidden="true"]), .ai-cm-spin button:focus-visible:not([aria-hidden="true"]) { outline: 2px solid var(--w-text); outline-offset: 2px; } .ai-cm-btn:disabled { opacity: 0.38; cursor: default; } .ai-cm-hint { opacity: 1; color: var(--w-tooltip-text); font-size: 11px; } .ai-widget-tt-primary { font-size: 13px; font-weight: 600; } .ai-widget-tt-secondary { font-size: 11px; } .ai-widget-tt-sep { display: block; height: 1px; background: currentColor; opacity: 0.18; margin: 4px 0; } </style> <div class="ai-widget-circle" tabindex="0" role="button" aria-haspopup="dialog" aria-controls="ai-widget-panel" aria-expanded="false" aria-label="${t("content_a11y_circle_initial", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C \u043F\u043E\u0440\u043E\u0433\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430")}"> <svg viewBox="0 0 100 100"> <defs> <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" stop-color="#4285F4" /> <stop offset="50%" stop-color="#9B51E0" /> <stop offset="100%" stop-color="#EA4335" /> </linearGradient> </defs> <circle class="ai-widget-bg" cx="50" cy="50" r="43"/> <circle class="ai-widget-fill" cx="50" cy="50" r="43"/> </svg> <div class="ai-widget-text">\u2014</div> <div class="ai-widget-tooltip">${t("content_widget_loading", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430...")}</div> </div> <div class="ai-widget-panel" id="ai-widget-panel"> <div class="ai-cm-limit-text">${t("content_panel_auto_label", "\u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433")}</div> <div class="ai-cm-row"><input type="number" min="1" max="100" step="1" class="ai-cm-input" placeholder="${t("content_panel_placeholder", "\u0410\u0432\u0442\u043E")}"><span class="ai-cm-spin"><button type="button" class="ai-cm-spin-up" tabindex="-1" aria-label="${t("content_panel_spin_up", "\u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0442\u044C \u043F\u043E\u0440\u043E\u0433")}">\u25B2</button><button type="button" class="ai-cm-spin-down" tabindex="-1" aria-label="${t("content_panel_spin_down", "\u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043F\u043E\u0440\u043E\u0433")}">\u25BC</button></span><span>${t("content_panel_pct_auto", "% \u043E\u0442 \u0410\u0432\u0442\u043E")}</span></div> <div class="ai-cm-row"><button class="ai-cm-btn ai-cm-snap">${t("content_panel_snap_btn", "\u{1F4CC} \u0422\u0435\u043A\u0443\u0449\u0435\u0435 = 100%")}</button><button class="ai-cm-btn ai-cm-auto">${t("content_panel_auto_btn", "\u21BA \u0410\u0432\u0442\u043E")}</button></div> <div class="ai-cm-hint">${t("content_panel_hint", "\u041F\u043E\u0440\u043E\u0433 \u0432 % \u043E\u0442 \u0410\u0432\u0442\u043E-\u043F\u043E\u0440\u043E\u0433\u0430 (\u043E\u0446\u0435\u043D\u0451\u043D\u043D\u043E\u0439 \u0442\u043E\u0447\u043A\u0438, \u0433\u0434\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u0437\u0430\u0431\u044B\u0432\u0430\u0442\u044C). 100% = \u043A\u0430\u043A \u0410\u0432\u0442\u043E. \u041C\u0435\u043D\u044C\u0448\u0435 = \u0441\u0442\u0440\u043E\u0436\u0435: \u0446\u0432\u0435\u0442\u0430 \u0438 % \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u0440\u043E\u0433\u0430. \u041F\u0440\u0438\u043C\u0435\u0440: \u043F\u043E\u0440\u043E\u0433 10% \u2192 \u0436\u0451\u043B\u0442\u044B\u0439, \u043A\u043E\u0433\u0434\u0430 \u0410\u0432\u0442\u043E\u22485%, \u043A\u0440\u0430\u0441\u043D\u044B\u0439 \u043F\u0440\u0438 \u0410\u0432\u0442\u043E\u22488%.")}</div> </div>`));
        document.body.appendChild(container);
        widgetElement = container;
        applyNativeStyles(container);
        try {
          if (typeof aiCmBadgeHoldActive === "function" && aiCmBadgeHoldActive()) container.style.display = "none";
        } catch (eHold) {
        }
        const circleEl = container.querySelector(".ai-widget-circle");
        const panelEl = container.querySelector(".ai-widget-panel");
        const snapBtn = container.querySelector(".ai-cm-snap");
        const autoBtn = container.querySelector(".ai-cm-auto");
        const inputEl = container.querySelector(".ai-cm-input");
        const upBtn = container.querySelector(".ai-cm-spin-up");
        const dnBtn = container.querySelector(".ai-cm-spin-down");
        if (circleEl && panelEl) {
          circleEl.addEventListener("click", () => aiCmToggleWidgetPanel(true));
          circleEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
              e.preventDefault();
              aiCmToggleWidgetPanel(true);
            }
          });
        }
        try {
          if (typeof aiCmUpdateWidgetSafeBottom === "function") aiCmUpdateWidgetSafeBottom(container);
          if (typeof aiCmStartWidgetSafeBottomWatch === "function") aiCmStartWidgetSafeBottomWatch(container);
          if (typeof aiCmBindWidgetA11y === "function") aiCmBindWidgetA11y();
          if (typeof aiCmLoadRingThresholds === "function") aiCmLoadRingThresholds();
        } catch (eWidgetCritical) {
        }
        if (snapBtn) snapBtn.addEventListener("click", snapCurrentPct);
        if (autoBtn) autoBtn.addEventListener("click", resetSafePct);
        if (inputEl) inputEl.addEventListener("change", (e) => setSafePctFromInput(
          /** @type {HTMLInputElement} */
          e.target.value
        ));
        if (upBtn) upBtn.addEventListener("click", () => stepSafePct(1));
        if (dnBtn) dnBtn.addEventListener("click", () => stepSafePct(-1));
        updatePanel();
        const themeObserver = new MutationObserver(() => applyNativeStyles(container));
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
        const themeHostEl = document.querySelector(".theme-host");
        if (themeHostEl && themeHostEl !== document.documentElement && themeHostEl !== document.body) {
          themeObserver.observe(themeHostEl, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
        }
        try {
          const mqlTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
          if (mqlTheme && mqlTheme.addEventListener) mqlTheme.addEventListener("change", () => applyNativeStyles(container));
        } catch (eMq) {
        }
        aiCmStartThemePoll();
        processAndSend();
      }
      function updateWidget(percentage, tokens, effectiveLimit, contextLimit, displayLimit, modelName, attachBreak) {
        if (!widgetElement) return;
        try {
          aiCmUpdateSourceIndicator();
        } catch (eSrcW) {
        }
        aiCmRefreshThemeIfNeeded();
        debugLog("log", "[AI CM][trace] badge-update pct=" + percentage + "% tokens=" + tokens + " model=" + modelName);
        const circle = (
          /** @type {SVGElement} */
          widgetElement.querySelector(".ai-widget-fill")
        );
        const percentText = widgetElement.querySelector(".ai-widget-text");
        const tooltip = widgetElement.querySelector(".ai-widget-tooltip");
        if (!circle || !percentText) return;
        const radius = 43;
        const circumference = 2 * Math.PI * radius;
        const pDraw = Math.min(100, Math.max(0, percentage));
        const offset = circumference - pDraw / 100 * circumference;
        circle.style.strokeDasharray = String(circumference);
        circle.style.strokeDashoffset = String(offset);
        circle.style.stroke = zoneColor(percentage);
        var aiCmAdapterBasePresent = typeof baseCount === "number" && baseCount > 0 || typeof lastBaseTexts !== "undefined" && lastBaseTexts && lastBaseTexts.length > 0 || typeof adapterBaseSeen !== "undefined" && adapterBaseSeen === true;
        var aiCmStalePlaceholder = stale === true && !aiCmAdapterBasePresent;
        percentText.textContent = aiCmStalePlaceholder ? "\u2014" : percentage.toFixed(1) + "%";
        try {
          aiCmSetWidgetA11yLabel(widgetElement.querySelector(".ai-widget-circle"), percentage);
        } catch (eA11yW) {
        }
        try {
          if (aiCmStalePlaceholder && typeof aiCmDiagLine === "function" && typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "qwen") {
            aiCmDiagLine("qwen-badge", {
              ts: Date.now(),
              event: "placeholder",
              reason: "stale",
              pct: percentage,
              tokens,
              baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
              adapterBase: aiCmAdapterBasePresent ? 1 : 0,
              url: String(typeof location !== "undefined" && location && location.href || "")
            });
          }
        } catch (eQbStale) {
        }
        if (tooltip) {
          const i18n = typeof aiCmI18nMessage === "function" ? aiCmI18nMessage : function(key, fallback) {
            return fallback;
          };
          const limPct = aiCmActivePct();
          const limLine = limPct != null ? i18n("content_tooltip_limit_pct", `\u041F\u0440\u0435\u0434\u0435\u043B: ${limPct}% \u043E\u0442 \u0410\u0432\u0442\u043E = ${displayLimit.toLocaleString()} \u0442\u043E\u043A`, [String(limPct), displayLimit.toLocaleString()]) : i18n("content_tooltip_limit_auto", `\u041F\u0440\u0435\u0434\u0435\u043B: \u0410\u0432\u0442\u043E = ${effectiveLimit.toLocaleString()} \u0442\u043E\u043A`, [effectiveLimit.toLocaleString()]);
          const esc = String;
          const lines = [
            i18n("content_tooltip_model", `\u041C\u043E\u0434\u0435\u043B\u044C: ${esc(modelName)}`, [esc(modelName)]),
            i18n("content_tooltip_tokens", `\u0422\u043E\u043A\u0435\u043D\u044B: ${tokens.toLocaleString()}`, [tokens.toLocaleString()]),
            limLine,
            i18n("content_tooltip_window", `\u041E\u043A\u043D\u043E \u043C\u043E\u0434\u0435\u043B\u0438: ${contextLimit.toLocaleString()}`, [contextLimit.toLocaleString()])
          ];
          try {
            if (typeof netQwenUsage !== "undefined" && netQwenUsage && typeof netQwenUsage === "object") {
              const qOut = typeof netQwenUsage.outputTokens === "number" ? netQwenUsage.outputTokens : 0;
              const qRea = typeof netQwenUsage.reasoningTokens === "number" ? netQwenUsage.reasoningTokens : 0;
              if (qOut > 0) lines.push(i18n("content_tooltip_tokens", `\u0422\u043E\u043A\u0435\u043D\u044B: ${qOut.toLocaleString()}`, ["output " + qOut.toLocaleString()]));
              if (qRea > 0) lines.push(i18n("content_tooltip_tokens", `\u0422\u043E\u043A\u0435\u043D\u044B: ${qRea.toLocaleString()}`, ["reasoning " + qRea.toLocaleString()]));
            }
          } catch (eQwUsageTt) {
          }
          try {
            const staleMark = stale === true && aiCmAdapterBasePresent ? " \xB7 stale" : "";
            const srcVal = aiCmSourceLabelNow ? esc(aiCmSourceLabelNow) + staleMark : staleMark ? "stale" : "";
            if (srcVal) lines.push(i18n("content_source_label", `\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: ${srcVal}`, [srcVal]));
          } catch (eSrcL) {
          }
          if (attachBreak && (attachBreak.imgCount > 0 || attachBreak.docCount > 0)) {
            const attachTotal = (attachBreak.imgTokens + attachBreak.docTokens).toLocaleString();
            lines.push(i18n("content_tooltip_attachments", `\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u2248 ${attachTotal} \u0442\u043E\u043A\u0435\u043D\u043E\u0432`, [attachTotal]));
            if (attachBreak.imgCount > 0) lines.push(i18n("content_tooltip_attach_images", `\xB7 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0438: ${attachBreak.imgCount} \u0448\u0442 \u2248 ${attachBreak.imgTokens.toLocaleString()} (\u043F\u043E 2 \u0442\u0430\u0439\u043B\u0430)`, [String(attachBreak.imgCount), attachBreak.imgTokens.toLocaleString()]));
            if (attachBreak.docCount > 0) lines.push(i18n("content_tooltip_attach_files", `\xB7 \u0444\u0430\u0439\u043B\u044B: ${attachBreak.docCount} \u0448\u0442 \u2248 ${attachBreak.docTokens.toLocaleString()} (\u043E\u0446\u0435\u043D\u043E\u0447\u043D\u043E)`, [String(attachBreak.docCount), attachBreak.docTokens.toLocaleString()]));
          }
          while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
          lines.forEach((line, i) => {
            if (i > 0) tooltip.appendChild(document.createElement("br"));
            if (i === 3) {
              const sep = document.createElement("span");
              sep.className = "ai-widget-tt-sep";
              sep.setAttribute("aria-hidden", "true");
              tooltip.appendChild(sep);
            }
            const row = document.createElement("span");
            row.className = i < 3 ? "ai-widget-tt-primary" : "ai-widget-tt-secondary";
            row.textContent = line;
            tooltip.appendChild(row);
          });
        }
        try {
          if (typeof aiCmRevealWidget === "function") aiCmRevealWidget();
        } catch (eRevW) {
        }
      }
      (function() {
        var Api = {};
        Api.safePctKey = safePctKey;
        Api.zoneColor = zoneColor;
        Api.aiCmRingBounds = aiCmRingBounds;
        Api.aiCmSetRingThresholds = function(raw) {
          aiCmRingThresholds = raw === void 0 ? null : raw;
        };
        Api.aiCmRepaintRing = aiCmRepaintRing;
        Api.aiCmLoadRingThresholds = aiCmLoadRingThresholds;
        Api.aiCmActivePct = aiCmActivePct;
        Api.computeEffectiveLimit = computeEffectiveLimit;
        Api.aiCmSetPopupOverrides = aiCmSetPopupOverrides;
        Api.aiCmRefreshPopupOverrides = aiCmRefreshPopupOverrides;
        Api.aiCmLoadPopupOverrides = aiCmLoadPopupOverrides;
        Api.updatePanel = updatePanel;
        Api.snapCurrentPct = snapCurrentPct;
        Api.setSafePctFromInput = setSafePctFromInput;
        Api.resetSafePct = resetSafePct;
        Api.stepSafePct = stepSafePct;
        Api.resetConversationState = resetConversationState;
        Api.THEME_CONFIGS = THEME_CONFIGS;
        Api.getServiceKey = getServiceKey;
        Api.aiCmInAppTheme = aiCmInAppTheme;
        Api.isDarkMode = isDarkMode;
        Api.aiCmWidgetAppliedTheme = aiCmWidgetAppliedTheme;
        Api.aiCmThemePollTimer = aiCmThemePollTimer;
        Api.AI_CM_THEME_POLL_MS = AI_CM_THEME_POLL_MS;
        Api.applyNativeStyles = applyNativeStyles;
        Api.aiCmRefreshThemeIfNeeded = aiCmRefreshThemeIfNeeded;
        Api.aiCmStartThemePoll = aiCmStartThemePoll;
        Api.aiCmStopThemePoll = aiCmStopThemePoll;
        Api.aiCmComputeWidgetSafeBottom = aiCmComputeWidgetSafeBottom;
        Api.aiCmUpdateWidgetSafeBottom = aiCmUpdateWidgetSafeBottom;
        Api.aiCmStartWidgetSafeBottomWatch = aiCmStartWidgetSafeBottomWatch;
        Api.aiCmStopWidgetSafeBottomWatch = aiCmStopWidgetSafeBottomWatch;
        Api.aiCmRestartWidgetSafeBottomWatch = aiCmRestartWidgetSafeBottomWatch;
        Api.aiCmSetWidgetA11yLabel = aiCmSetWidgetA11yLabel;
        Api.aiCmSetWidgetPanelOpen = aiCmSetWidgetPanelOpen;
        Api.aiCmToggleWidgetPanel = aiCmToggleWidgetPanel;
        Api.createWidget = createWidget;
        Api.aiCmRevealWidget = aiCmRevealWidget;
        Api.updateWidget = updateWidget;
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmWidget = Api;
      })();
      function aiCmHostHistoryRecord(snapshot) {
        var rec = Object.assign({}, snapshot);
        rec.ts = Date.now();
        return rec;
      }
      function aiCmLogIntraDedupe(role, blocks) {
        if (!(blocks > 0)) return;
        var sig = "intra|" + (baseCount || 0) + "|" + (baseText ? baseText.length : 0);
        if (sig === lastDedupeLogSig) return;
        lastDedupeLogSig = sig;
        debugLog("log", "[AI CM][gemini] intra-dedupe removed=" + blocks + " blocks in message role=" + role);
      }
      function aiCmDedupeExportSource(messages) {
        try {
          var site = currentAdapter && currentAdapter.siteName || "";
          if (site === "google_search") {
            var Pgsa = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
            if (Pgsa && typeof Pgsa.prepareExportMessages === "function") {
              var resGsa = Pgsa.prepareExportMessages(messages, aiCmLogIntraDedupe);
              var outGsa = Array.isArray(resGsa.messages) ? resGsa.messages : messages;
              if (resGsa.removed > 0 || resGsa.intraRemoved > 0) {
                debugLog("log", "[AI CM][google_search] dedupe removed=" + resGsa.removed + " intra=" + resGsa.intraRemoved + " msgs=" + messages.length + "\u2192" + outGsa.length);
              }
              return { messages: outGsa, removed: resGsa.removed };
            }
            return { messages, removed: 0 };
          }
          if (site !== "gemini" && site !== "aistudio") {
            var keep = [];
            for (var p = 0; p < messages.length; p++) {
              var mp = messages[p] || {};
              var msg = { role: mp.role === "user" || mp.role === "human" ? "user" : "assistant", text: typeof mp.text === "string" ? mp.text : "" };
              if (typeof aiCmDiagLine === "function" && site === "claude") {
                aiCmDiagLine("claude-role-dedupe", { site, mpRole: mp.role, normalizedRole: msg.role });
              }
              if (typeof mp.reasoning === "string" && mp.reasoning) msg.reasoning = mp.reasoning;
              keep.push(msg);
            }
            return { messages: keep, removed: 0 };
          }
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P) return { messages, removed: 0 };
          if (typeof P.prepareExportMessages === "function") {
            var res18 = P.prepareExportMessages(messages, aiCmLogIntraDedupe);
            return { messages: res18.messages, removed: res18.removed };
          }
          if (typeof P.dedupeMessages === "function") return P.dedupeMessages(messages);
        } catch (eDed) {
          swallow(eDed, "base-handler:dedupeExportSource");
        }
        return { messages, removed: 0 };
      }
      var lastDedupeLogSig = null;
      function aiCmLogDedupeRemoved(removed) {
        if (!(removed > 0)) return;
        var sig = baseCount + "|" + (baseText ? baseText.length : 0);
        if (sig === lastDedupeLogSig) return;
        lastDedupeLogSig = sig;
        debugLog("log", "[AI CM][gemini] dedupe removed=" + removed);
      }
      function buildHistoryMessages() {
        return aiCmDedupeExportSource(aiCmCollectExportSource()).messages;
      }
      var aiCmBasePrepared = null;
      function aiCmPreparedText(messages) {
        var src = Array.isArray(messages) ? messages : [];
        var out = [];
        for (var i = 0; i < src.length; i++) out.push(String(src[i] && src[i].text || ""));
        return out.join("\n");
      }
      function aiCmMetricBaseText(fallback) {
        if (Array.isArray(aiCmBasePrepared) && aiCmBasePrepared.length > 0) return aiCmPreparedText(aiCmBasePrepared);
        return fallback;
      }
      function aiCmDiagHash6(id, text) {
        try {
          var s = String(id || "") + "\0" + String(text || "");
          var h = 2166136261;
          for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
          }
          return ("000000" + h.toString(16)).slice(-6);
        } catch (e) {
          return "000000";
        }
      }
      function aiCmGeminiTurnsSnapshotSync() {
        try {
          var resp = null;
          var h = function(ev) {
            resp = ev.detail;
          };
          window.addEventListener("ai-cm-turns-snap-response", h, { once: true });
          window.dispatchEvent(new CustomEvent("ai-cm-turns-snap-request"));
          window.removeEventListener("ai-cm-turns-snap-response", h);
          return resp;
        } catch (e) {
          return null;
        }
      }
      var aiCmNetSyncSeq = 0;
      function aiCmExportNetSyncSite() {
        try {
          return typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "deepseek";
        } catch (eSite) {
          return false;
        }
      }
      function aiCmExportNetSyncThen(convId, cb, timeoutMs) {
        var cap = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 3e3;
        var done = false;
        var timer = null;
        var handler = null;
        function finish(info) {
          if (done) return;
          done = true;
          if (timer) {
            try {
              clearTimeout(timer);
            } catch (eT) {
            }
            timer = null;
          }
          if (handler) {
            try {
              window.removeEventListener("ai-cm-deepseek-net-sync-done", handler);
            } catch (eR) {
            }
            handler = null;
          }
          try {
            aiCmLogNetSyncResult(convId, info || {});
          } catch (eL) {
          }
          try {
            if (cb) cb(info || {});
          } catch (eCb) {
            swallowSoft(eCb, "base-handler:netSync-finish-callback");
          }
        }
        try {
          if (!convId) {
            finish({ ok: false, reason: "no-conv" });
            return;
          }
          var reqId = "netsync-" + Date.now() + "-" + ++aiCmNetSyncSeq;
          handler = function(ev) {
            var d = ev && ev.detail;
            if (!d || String(d.requestId || "") !== reqId) return;
            finish(d);
          };
          window.addEventListener("ai-cm-deepseek-net-sync-done", handler);
          timer = setTimeout(function() {
            finish({ ok: false, reason: "timeout" });
          }, cap);
          window.dispatchEvent(new CustomEvent("ai-cm-deepseek-net-sync", {
            detail: JSON.stringify({ requestId: reqId, convId, timeoutMs: cap })
          }));
        } catch (eBridge) {
          finish({ ok: false, reason: "bridge-error" });
        }
      }
      function aiCmLogNetSyncResult(convId, info) {
        try {
          var v = info && info.verdicts ? JSON.stringify(info.verdicts) : "{}";
          var line = "[AI CM][net-sync] convId=" + String(convId || "").slice(0, 8) + " ok=" + (info && info.ok === true ? 1 : 0) + " reason=" + (info && info.reason || "-") + " refetched=" + (info && info.refetched === true ? 1 : 0) + " netTurns=" + (info && info.netTurns || 0) + " liveTurns=" + (info && info.liveTurns || 0) + " verdicts=" + v;
          debugLog("log", line);
        } catch (eLog) {
        }
      }
      function aiCmDumpTurnsSnapshot(tag, cid, msgs) {
        try {
          var snap = aiCmGeminiTurnsSnapshotSync();
          var msgsN = snap && snap.msgs || 0;
          var firstHash = "-", lastHash = "-", firstText = "", lastText = "";
          var bc = null, rs = null, cbs = null;
          if (snap && typeof snap === "object") {
            firstHash = snap.firstMsgHash || "-";
            lastHash = snap.lastMsgHash || "-";
            firstText = snap.firstText || "";
            lastText = snap.lastText || "";
            bc = snap.baseComplete;
            rs = snap.reachedStart;
            cbs = snap.confirmedByScroll;
          }
          if (!msgsN && Array.isArray(msgs) && msgs.length > 0) {
            msgsN = msgs.length;
            firstHash = aiCmDiagHash6("", msgs[0] && msgs[0].text);
            lastHash = aiCmDiagHash6("", msgs[msgs.length - 1] && msgs[msgs.length - 1].text);
            firstText = String(msgs[0] && msgs[0].text || "").slice(0, 80).replace(/\s+/g, " ");
            lastText = String(msgs[msgs.length - 1] && msgs[msgs.length - 1].text || "").slice(0, 80).replace(/\s+/g, " ");
          }
          if (bc === null) bc = baseComplete === true;
          if (rs === null || cbs === null) {
            var conf = aiCmBaseConfirmedByConv[cid] === 1;
            if (rs === null) rs = conf;
            if (cbs === null) cbs = conf;
          }
          debugLog("log", "[AI CM][turnsMap] " + tag + " convId=" + (cid || snap && snap.convId || "(none)") + " msgs=" + msgsN + " firstMsgHash=" + firstHash + " lastMsgHash=" + lastHash + ' firstText="' + firstText + '" lastText="' + lastText + '" baseComplete=' + (bc ? 1 : 0) + " reachedStart=" + (rs ? "true" : "false") + " confirmedByScroll=" + (cbs ? "true" : "false") + " scrollEngaged=" + (snap && snap.scrollEngaged ? "true" : "false"));
        } catch (e) {
        }
      }
      function scheduleStaleCheck() {
        if (!isExtensionValid()) return;
        try {
          clearTimeout(staleTimer);
        } catch (e) {
        }
        stale = false;
        staleTimer = setTimeout(function() {
          staleTimer = null;
          if (isInitialized && !baseSeen) {
            var hasMessages = false;
            try {
              if (currentAdapter) {
                var msgs = currentAdapter.extractMessages();
                hasMessages = !!msgs && msgs.length > 0;
              }
            } catch (e) {
              hasMessages = false;
            }
            if (hasMessages) {
              stale = true;
              processAndSend();
            }
          }
        }, 12e3);
      }
      var aiCmFilesDrainSeq = 0;
      function aiCmFilesQueuePending() {
        var pending = -1;
        var handler = null;
        try {
          if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return 0;
          handler = function(ev) {
            var d = ev && ev.detail;
            if (d && typeof d.pending === "number") pending = d.pending;
          };
          window.addEventListener("ai-cm-deepseek-files-state-response", handler);
          window.dispatchEvent(new CustomEvent("ai-cm-deepseek-files-state-request"));
        } catch (eState) {
          debugLog("log", "[AI CM][file-queue] state bridge: " + (eState && eState.message || eState));
        } finally {
          try {
            if (handler) window.removeEventListener("ai-cm-deepseek-files-state-response", handler);
          } catch (eOff) {
            debugLog("log", "[AI CM][file-queue] state listener off: " + (eOff && eOff.message || eOff));
          }
        }
        return pending;
      }
      function aiCmLogFilesDrain(convId, info) {
        try {
          var line = "[AI CM][file-queue] convId=" + String(convId || "").slice(0, 8) + " ok=" + (info && info.ok === true ? 1 : 0) + " reason=" + (info && info.reason || "-") + " drained=" + (info && info.drained === true ? 1 : 0) + " pending=" + (info && typeof info.pending === "number" ? info.pending : 0) + " waitedMs=" + (info && info.waitedMs || 0);
          debugLog("log", line);
        } catch (eLog) {
          debugLog("log", "[AI CM][file-queue] log failed: " + (eLog && eLog.message || eLog));
        }
      }
      function aiCmExportFilesDrainThen(convId, cb, timeoutMs) {
        var cap = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 2e3;
        var pending = aiCmFilesQueuePending();
        if (pending <= 0) {
          try {
            if (cb) cb({ ok: true, drained: true, reason: "idle-or-absent", pending: 0, waitedMs: 0 });
          } catch (eCb0) {
            swallowSoft(eCb0, "base-handler:filesDrain-idle-cb");
          }
          return;
        }
        var done = false;
        var timer = null;
        var handler = null;
        var startedAt = Date.now();
        function finish(info) {
          if (done) return;
          done = true;
          if (timer) {
            try {
              clearTimeout(timer);
            } catch (eT) {
              debugLog("log", "[AI CM][file-queue] timer off: " + (eT && eT.message || eT));
            }
            timer = null;
          }
          if (handler) {
            try {
              window.removeEventListener("ai-cm-deepseek-files-drain-done", handler);
            } catch (eR) {
              debugLog("log", "[AI CM][file-queue] listener off: " + (eR && eR.message || eR));
            }
            handler = null;
          }
          aiCmLogFilesDrain(convId, info || {});
          try {
            if (cb) cb(info || {});
          } catch (eCb) {
            swallowSoft(eCb, "base-handler:filesDrain-finish-callback");
          }
        }
        try {
          var reqId = "files-" + Date.now() + "-" + ++aiCmFilesDrainSeq;
          handler = function(ev) {
            var d = ev && ev.detail;
            if (!d || String(d.requestId || "") !== reqId) return;
            finish(d);
          };
          window.addEventListener("ai-cm-deepseek-files-drain-done", handler);
          timer = setTimeout(function() {
            finish({ ok: false, drained: false, reason: "file-queue-timeout", pending: aiCmFilesQueuePending(), waitedMs: Date.now() - startedAt });
          }, cap + 250);
          window.dispatchEvent(new CustomEvent("ai-cm-deepseek-files-drain", {
            detail: JSON.stringify({ requestId: reqId, timeoutMs: cap })
          }));
        } catch (eBridge) {
          finish({ ok: false, drained: false, reason: "bridge-error", pending, waitedMs: Date.now() - startedAt });
        }
      }
      function aiCmExportFilesThenNetSync(convId, cb, netTimeoutMs) {
        var next = function() {
          try {
            if (cb) cb();
          } catch (eCb) {
            swallowSoft(eCb, "base-handler:filesThenNet-callback");
          }
        };
        aiCmExportFilesDrainThen(convId, function() {
          if (typeof aiCmExportNetSyncThen === "function" && aiCmExportNetSyncSite()) {
            aiCmExportNetSyncThen(convId, next, netTimeoutMs);
            return;
          }
          next();
        }, 2e3);
      }
      (function() {
        var Api = {};
        Api.aiCmHostHistoryRecord = aiCmHostHistoryRecord;
        Api.aiCmLogIntraDedupe = aiCmLogIntraDedupe;
        Api.aiCmDedupeExportSource = aiCmDedupeExportSource;
        Api.lastDedupeLogSig = lastDedupeLogSig;
        Api.aiCmLogDedupeRemoved = aiCmLogDedupeRemoved;
        Api.buildHistoryMessages = buildHistoryMessages;
        Api.aiCmBasePrepared = aiCmBasePrepared;
        Api.aiCmPreparedText = aiCmPreparedText;
        Api.aiCmMetricBaseText = aiCmMetricBaseText;
        Api.aiCmDiagHash6 = aiCmDiagHash6;
        Api.aiCmGeminiTurnsSnapshotSync = aiCmGeminiTurnsSnapshotSync;
        Api.aiCmExportNetSyncSite = aiCmExportNetSyncSite;
        Api.aiCmExportNetSyncThen = aiCmExportNetSyncThen;
        Api.aiCmLogNetSyncResult = aiCmLogNetSyncResult;
        Api.aiCmFilesQueuePending = aiCmFilesQueuePending;
        Api.aiCmLogFilesDrain = aiCmLogFilesDrain;
        Api.aiCmExportFilesDrainThen = aiCmExportFilesDrainThen;
        Api.aiCmExportFilesThenNetSync = aiCmExportFilesThenNetSync;
        Api.aiCmDumpTurnsSnapshot = aiCmDumpTurnsSnapshot;
        Api.scheduleStaleCheck = scheduleStaleCheck;
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmBaseHandler = Api;
      })();
      function normalize(s) {
        return (s || "").toLowerCase().replace(/[^a-zа-яё0-9]+/g, "");
      }
      function stripMd(s) {
        if (!s) return "";
        return s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/`+/g, "");
      }
      var MSG_SELECTORS = [
        "[data-message-author-role]",
        "[data-message-id]",
        '.user-query, .model-response, .query-text, .response-content, [data-role="user"], [data-role="model"]'
      ];
      function findMessageNodes() {
        for (var i = 0; i < MSG_SELECTORS.length; i++) {
          var nodes = document.querySelectorAll(MSG_SELECTORS[i]);
          if (nodes && nodes.length > 0) return { nodes: Array.prototype.slice.call(nodes), sel: MSG_SELECTORS[i] };
        }
        return { nodes: [], sel: "(none)" };
      }
      function nodeIsBase(node, skel) {
        if (baseIdSet && baseIdSet.size > 0) {
          var id = "";
          try {
            id = node.getAttribute && node.getAttribute("data-message-id") || "";
          } catch (e) {
          }
          if (id && baseIdSet.has(String(id).trim())) return true;
        }
        if (!skel) return false;
        if (baseSkelSet && baseSkelSet.has(skel)) return true;
        if (baseAnchors) {
          for (var i = 0; i < baseAnchors.length; i++) {
            if (skel.indexOf(baseAnchors[i]) !== -1) return true;
          }
        }
        return false;
      }
      function shouldUseGeminiDomParser() {
        try {
          if (currentAdapter && currentAdapter.siteName === "gemini") return true;
        } catch (e) {
        }
        return false;
      }
      function computeTailFromDom() {
        var found = findMessageNodes();
        var nodes = found.nodes;
        if (!baseSeen || !baseText) return { text: "", count: 0, bounded: false, sel: found.sel, diag: "\u043D\u0435\u0442 \u0431\u0430\u0437\u044B" };
        if (nodes.length === 0) return { text: "", count: 0, bounded: false, sel: found.sel, diag: "\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043D\u0435 \u0434\u0430\u043B \u0443\u0437\u043B\u043E\u0432: " + found.sel };
        if ((!baseIdSet || baseIdSet.size === 0) && (!baseSkelSet || baseSkelSet.size === 0)) {
          return { text: "", count: 0, bounded: false, sel: found.sel, diag: "\u043A\u044D\u0448 \u0431\u0430\u0437\u044B \u043F\u0443\u0441\u0442 \u2192 \u0444\u043E\u043B\u0431\u044D\u043A \u043F\u043E \u0431\u0430\u0437\u0435" };
        }
        var tailNodes = [];
        var stopAt = -1;
        var stopFound = false;
        for (var k = nodes.length - 1; k >= 0; k--) {
          var raw = nodes[k].innerText || nodes[k].textContent || "";
          var skel = normalize(raw);
          if (nodeIsBase(nodes[k], skel)) {
            stopFound = true;
            stopAt = k;
            break;
          }
          if (skel.length > 0) tailNodes.unshift(nodes[k]);
        }
        var pieces = [];
        for (var j = 0; j < tailNodes.length; j++) {
          var txt = "";
          if (shouldUseGeminiDomParser()) {
            try {
              txt = typeof GeminiDomParser !== "undefined" && GeminiDomParser ? GeminiDomParser.extractGeminiResponse(tailNodes[j]).text : "";
            } catch (e) {
              txt = (tailNodes[j].innerText || tailNodes[j].textContent || "").trim();
            }
          } else {
            txt = (tailNodes[j].innerText || tailNodes[j].textContent || "").trim();
          }
          if (txt) pieces.push(txt);
        }
        return {
          text: pieces.join("\n"),
          count: tailNodes.length,
          bounded: stopFound,
          sel: found.sel,
          diag: "sel=" + found.sel + " \u0443\u0437\u043B\u043E\u0432=" + nodes.length + " \u0441\u0442\u043E\u043F=" + (stopFound ? "@" + stopAt : "\u043D\u0435\u0442(\u0432\u0441\u0435 \u0432 \u043E\u043A\u043D\u0435 \u2014 \u043D\u043E\u0432\u044B\u0435)") + " \u0445\u0432\u043E\u0441\u0442=" + tailNodes.length + " bdd=" + (stopFound ? "\u0434\u0430" : "\u043D\u0435\u0442")
        };
      }
      function aiCmTailMetricBase(fallback) {
        return typeof aiCmMetricBaseText === "function" ? aiCmMetricBaseText(fallback) : fallback;
      }
      function getEffectiveText() {
        if (baseSeen && baseText) {
          if (baseComplete) {
            lastBounded = true;
            return aiCmTailMetricBase(baseText);
          }
          var tail = computeTailFromDom();
          var sig = (tail.sel || "") + "|" + (tail.bounded ? "1" : "0");
          if (sig !== lastTailSig) {
            lastTailSig = sig;
            if (tail.diag !== lastHybridTailSig) {
              lastHybridTailSig = tail.diag;
              debugLog("log", "[hybrid-tail] " + tail.diag);
            }
          }
          lastBounded = tail.bounded;
          if (!tail.text) return aiCmTailMetricBase(baseText);
          if (tail.bounded) return aiCmTailMetricBase(baseText) + "\n" + tail.text;
          return aiCmTailMetricBase(baseText);
        }
        return "";
      }
      function getEffectiveCount(fallbackCount) {
        if (baseSeen && baseText) {
          if (baseComplete) return baseCount;
          var tail = computeTailFromDom();
          if (!tail.count) return baseCount;
          if (tail.bounded) return baseCount + tail.count;
          return baseCount;
        }
        return fallbackCount;
      }
      (function() {
        var Api = {};
        Api.normalize = normalize;
        Api.stripMd = stripMd;
        Api.MSG_SELECTORS = MSG_SELECTORS;
        Api.findMessageNodes = findMessageNodes;
        Api.nodeIsBase = nodeIsBase;
        Api.shouldUseGeminiDomParser = shouldUseGeminiDomParser;
        Api.computeTailFromDom = computeTailFromDom;
        Api.aiCmTailMetricBase = aiCmTailMetricBase;
        Api.getEffectiveText = getEffectiveText;
        Api.getEffectiveCount = getEffectiveCount;
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmHybridTail = Api;
      })();
      function sanitizeGeminiText(s) {
        if (typeof window !== "undefined" && window.GeminiBatchexecuteParser && window.GeminiBatchexecuteParser.sanitizeGeminiText) {
          return window.GeminiBatchexecuteParser.sanitizeGeminiText(s);
        }
        if (typeof s !== "string") return s;
        return s.replace(/\$AXzLiR[A-Za-z0-9+\/=\s]+/g, " ").replace(/File attachment was not previously registered/g, "").replace(/\[cite:\s*\d+\]/g, "");
      }
      var aiCmSanitizeSkipLogged = {};
      var aiCmIncludeHiddenInExport = false;
      function aiCmSanitizeDebugOn() {
        try {
          return sessionStorage.getItem("aiCmDebug") === "1";
        } catch (e) {
          return false;
        }
      }
      function aiCmLogSanitizeSkip(reasons) {
        if (!reasons || !reasons.length) return;
        if (!aiCmSanitizeDebugOn()) return;
        for (var i = 0; i < reasons.length; i++) {
          var r = String(reasons[i] || "");
          if (!r || aiCmSanitizeSkipLogged[r] === 1) continue;
          aiCmSanitizeSkipLogged[r] = 1;
          try {
            console.log("[AI CM][sanitize] skip reason=" + r);
          } catch (eL) {
          }
        }
      }
      function aiCmEmitEntryDiag(branch, inMsgs, outMsgs, effectiveOn) {
        try {
          if (typeof aiCmDiagLine !== "function") return false;
          var hiddenOn = effectiveOn === void 0 ? aiCmIncludeHiddenInExport === true : effectiveOn === true;
          return aiCmDiagLine("o40-emit-entry", {
            hidden: hiddenOn ? "on" : "off",
            branch,
            msgsIn: Array.isArray(inMsgs) ? inMsgs.length : 0,
            msgsOut: Array.isArray(outMsgs) ? outMsgs.length : 0
          }) !== false;
        } catch (eDiagEntry) {
          return false;
        }
      }
      function aiCmHiddenExportEffectiveOn(messages) {
        var userOn = typeof aiCmIncludeHiddenInExport !== "undefined" && aiCmIncludeHiddenInExport === true;
        try {
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P || typeof P.hasReasoningInSource !== "function" || typeof P.effectiveReasoningToggle !== "function") return userOn;
          var site = typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName ? currentAdapter.siteName : "";
          return P.effectiveReasoningToggle(userOn, P.hasReasoningInSource(messages) === true, site) === true;
        } catch (eEffective) {
          return userOn;
        }
      }
      function aiCmSanitizeEmitUserTexts(messages) {
        try {
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P || typeof P.sanitizeEmitMessages !== "function") {
            if (typeof aiCmEmitEntryDiag === "function") aiCmEmitEntryDiag("no-pipeline", messages, messages);
            return messages;
          }
          var hiddenExportEffective = typeof aiCmHiddenExportEffectiveOn === "function" ? aiCmHiddenExportEffectiveOn(messages) : aiCmIncludeHiddenInExport === true;
          var hiddenRawExport = function() {
            var onMsgs = typeof P.includeHiddenExportBlocks === "function" ? P.includeHiddenExportBlocks(messages) : messages;
            if (typeof aiCmEmitEntryDiag === "function") aiCmEmitEntryDiag("includeHiddenExportBlocks", messages, onMsgs, hiddenExportEffective);
            return onMsgs;
          };
          if (aiCmIncludeHiddenInExport === true) {
            return hiddenRawExport();
          }
          if (hiddenExportEffective) {
            return hiddenRawExport();
          }
          var res = P.sanitizeEmitMessages(messages);
          aiCmLogSanitizeSkip(res && res.skipped);
          if (typeof aiCmEmitEntryDiag === "function") aiCmEmitEntryDiag("sanitizeEmitMessages", messages, res && res.messages);
          return res && Array.isArray(res.messages) ? res.messages : messages;
        } catch (e) {
          return messages;
        }
      }
      var aiCmNetSyncInFlight = {};
      function aiCmReasoningExportSite() {
        try {
          return !!(currentAdapter && currentAdapter.siteName === "qwen");
        } catch (eRes) {
          return false;
        }
      }
      function aiCmPrepareReasoningForExport(messages) {
        try {
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P || typeof P.applyReasoningExportFields !== "function") return messages;
          P.applyReasoningExportFields(messages, aiCmReasoningExportSite());
        } catch (ePrep) {
          swallowSoft(ePrep, "export:aiCmPrepareReasoningForExport");
        }
        return messages;
      }
      function aiCmCollectExportSource() {
        var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
        var texts = lastBaseTexts || [];
        var prepareReasoning = typeof aiCmPrepareReasoningForExport === "function" ? aiCmPrepareReasoningForExport : null;
        var source = P && typeof P.pickExportSource === "function" ? P.pickExportSource(baseSeen === true, texts.length > 0) : baseSeen && texts.length > 0 ? "network" : "adapter";
        try {
          if (typeof aiCmDiagLine === "function" && typeof aiCmDiagOn === "function" && aiCmDiagOn() && typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "deepseek") {
            var o21DomMsgs = typeof currentAdapter.extractMessages === "function" ? currentAdapter.extractMessages().length : 0;
            var o21Reason = baseSeen === true ? texts.length > 0 ? "baseSeen+networkTexts" : "baseSeen-no-networkTexts" : "no-baseSeen";
            aiCmDiagLine("o21-source-select", {
              site: currentAdapter.siteName,
              domMsgs: o21DomMsgs,
              netMsgs: texts.length,
              sourceSelected: source === "network" ? "network" : "dom",
              reason: o21Reason
            });
          }
        } catch (eO21sel) {
        }
        var out = [];
        if (source === "network") {
          if (Array.isArray(lastDetailMessages) && lastDetailMessages.length === texts.length && texts.length > 0) {
            for (var i = 0; i < texts.length; i++) {
              var dm = lastDetailMessages[i] || {};
              var r = dm.role || "";
              var msg = { role: r === "user" || r === "human" ? "user" : "assistant", text: sanitizeGeminiText(texts[i]) };
              if (typeof aiCmDiagLine === "function" && typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "claude") {
                aiCmDiagLine("claude-role-network", { r, normalizedRole: msg.role });
              }
              if (typeof dm.reasoning === "string" && dm.reasoning) msg.reasoning = dm.reasoning;
              out.push(msg);
            }
          } else {
            for (var j = 0; j < texts.length; j++) {
              out.push({ role: j % 2 === 0 ? "user" : "assistant", text: sanitizeGeminiText(texts[j]) });
            }
          }
          if (prepareReasoning) prepareReasoning(out);
          var hiddenExportOn = typeof aiCmIncludeHiddenInExport !== "undefined" && aiCmIncludeHiddenInExport === true;
          if (!hiddenExportOn && typeof aiCmHiddenExportEffectiveOn === "function") {
            hiddenExportOn = aiCmHiddenExportEffectiveOn(out);
          }
          var reasoningExportSite = typeof aiCmReasoningExportSite === "function" ? aiCmReasoningExportSite : null;
          if (!hiddenExportOn && reasoningExportSite && reasoningExportSite()) {
            for (var ri = 0; ri < out.length; ri++) {
              if (out[ri] && typeof out[ri] === "object") delete out[ri].reasoning;
            }
          }
          return aiCmSanitizeEmitUserTexts(out);
        }
        try {
          if (currentAdapter && typeof currentAdapter.extractMessages === "function") {
            var raw = currentAdapter.extractMessages() || [];
            var hasRoles = false;
            for (var k = 0; k < raw.length; k++) {
              if (raw[k] && (raw[k].role === "user" || raw[k].role === "assistant" || raw[k].role === "human")) {
                hasRoles = true;
                break;
              }
            }
            var norm = P && typeof P.normalizeExportMessages === "function" ? P.normalizeExportMessages(raw) : [];
            if (typeof aiCmDiagLine === "function" && typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName === "claude") {
              aiCmDiagLine("claude-role-adapter", {
                rawRole: hasRoles ? raw[k].role : void 0,
                normalizedRole: norm.length > 0 ? norm[0].role : void 0,
                hasRoles
              });
            }
            if (prepareReasoning) prepareReasoning(norm);
            if (norm.length > 0 && hasRoles) return aiCmSanitizeEmitUserTexts(norm);
            for (var n2 = 0; n2 < norm.length; n2++) {
              var fbMsg = { role: n2 % 2 === 0 ? "user" : "assistant", text: norm[n2].text };
              for (var key in norm[n2]) {
                if (Object.prototype.hasOwnProperty.call(norm[n2], key) && key !== "role" && key !== "text") {
                  fbMsg[key] = norm[n2][key];
                }
              }
              out.push(fbMsg);
            }
          }
        } catch (eA) {
          swallow(eA, "export:aiCmCollectExportSource-dom-adapter");
        }
        if (prepareReasoning) prepareReasoning(out);
        return aiCmSanitizeEmitUserTexts(out);
      }
      function aiCmExportBaseSource(convId, localMsgs) {
        try {
          var site = currentAdapter && currentAdapter.siteName || "";
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P || typeof P.resolveExportSource !== "function") return null;
          if (site !== "gemini") return null;
          var snap = (
            /** @type {{convId?: string, messages?: Array<{role?: string, text?: string}>|null, archiveCount?: number, liveCount?: number, baseMsgs?: number}|null} */
            typeof aiCmGeminiTurnsSnapshotSync === "function" ? aiCmGeminiTurnsSnapshotSync() : null
          );
          var hasBridge = !!(snap && typeof snap === "object");
          if (hasBridge && snap.convId && convId && String(snap.convId) !== String(convId)) hasBridge = false;
          var union = hasBridge && Array.isArray(snap.messages) ? snap.messages : [];
          var localN = Array.isArray(localMsgs) ? localMsgs.length : 0;
          var verdict = P.resolveExportSource({
            isGemini: true,
            bridge: hasBridge,
            archiveCount: hasBridge && typeof snap.archiveCount === "number" ? snap.archiveCount : 0,
            liveCount: hasBridge && typeof snap.liveCount === "number" ? snap.liveCount : null,
            baseCount: hasBridge && typeof snap.baseMsgs === "number" ? snap.baseMsgs : 0,
            localCount: localN
          });
          if (!verdict || verdict.action === "local") return null;
          if (verdict.action === "block") {
            return {
              blocked: true,
              reason: verdict.reason,
              baseCount: hasBridge && typeof snap.baseMsgs === "number" ? snap.baseMsgs : 0,
              liveCount: hasBridge && typeof snap.liveCount === "number" ? snap.liveCount : 0,
              archiveCount: hasBridge && typeof snap.archiveCount === "number" ? snap.archiveCount : 0
            };
          }
          var out = [];
          for (var i = 0; i < union.length; i++) {
            var m = union[i] || {};
            if (typeof m.text !== "string" || !m.text) continue;
            out.push({ role: m.role === "user" ? "user" : "assistant", text: m.text });
          }
          if (out.length <= localN) return null;
          return {
            blocked: false,
            msgs: out,
            baseCount: union.length,
            liveCount: typeof snap.liveCount === "number" ? snap.liveCount : 0,
            archiveCount: typeof snap.archiveCount === "number" ? snap.archiveCount : 0
          };
        } catch (eEbs) {
          return null;
        }
      }
      function aiCmGetSourceTier() {
        try {
          if (!(currentAdapter && currentAdapter.siteName === "gemini")) return void 0;
          if (typeof aiCmGeminiTurnsSnapshotSync !== "function") return void 0;
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (!P || typeof P.sourceTierOf !== "function") return void 0;
          var snap = (
            /** @type {{archiveCount?: number, liveCount?: number}|null} */
            aiCmGeminiTurnsSnapshotSync()
          );
          if (!snap || typeof snap !== "object") return void 0;
          return P.sourceTierOf({
            archiveCount: typeof snap.archiveCount === "number" ? snap.archiveCount : 0,
            liveCount: typeof snap.liveCount === "number" ? snap.liveCount : 0
          });
        } catch (eTier) {
          swallow(eTier, "export:aiCmGetSourceTier");
        }
      }
      function autoExportPerSiteKey(siteName) {
        return "aiCmAutoExportPct_" + (siteName || "");
      }
      function loadAutoExportPerSitePct() {
        try {
          if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
          var site = currentAdapter && currentAdapter.siteName || "";
          if (!site) return;
          var key = autoExportPerSiteKey(site);
          chrome.storage.local.get([key], function(data) {
            try {
              var raw = data && data[key];
              var n = parseInt(raw, 10);
              autoExportPctBySite[site] = !isNaN(n) && n >= 1 && n <= 100 ? n : void 0;
              debugLog("log", "[AI CM][auto-export] per-site load " + key + "=" + (autoExportPctBySite[site] === void 0 ? "\u043D\u0435\u0442 (\u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u043B\u0431\u044D\u043A)" : autoExportPctBySite[site]));
            } catch (eParsePs) {
              swallowSoft(eParsePs, "export:loadAutoExportPerSitePct");
            }
          });
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] per-site load error:", e);
        }
      }
      var sessionFiredCache = {};
      var aiCmLatchReadyPromise = null;
      function aiCmLatchCacheReady() {
        if (aiCmLatchReadyPromise) return aiCmLatchReadyPromise;
        aiCmLatchReadyPromise = Promise.resolve().then(function() {
          return aiCmLatchGetAll();
        }).then(function(map) {
          try {
            for (var k in sessionFiredCache) delete sessionFiredCache[k];
            for (var k2 in map || {}) sessionFiredCache[k2] = map[k2];
          } catch (eHydr) {
          }
          return sessionFiredCache;
        }).catch(function() {
          return sessionFiredCache;
        });
        return aiCmLatchReadyPromise;
      }
      try {
        aiCmLatchCacheReady();
      } catch (eO3init) {
      }
      var AI_CM_LATE_RETRY_MAX = 3;
      var AI_CM_LATE_RETRY_MS = 2e3;
      var aiCmLateRetryByConv = {};
      function aiCmScheduleLateAutoExportRetry(cid) {
        try {
          if (!cid) return false;
          var used = aiCmLateRetryByConv[cid] || 0;
          if (used >= AI_CM_LATE_RETRY_MAX) {
            debugLog("log", "[AI CM][auto-export] late retry exhausted " + used + "/" + AI_CM_LATE_RETRY_MAX + " convId=" + cid + " reason=cursor-live");
            return false;
          }
          aiCmLateRetryByConv[cid] = used + 1;
          debugLog("log", "[AI CM][auto-export] late retry " + (used + 1) + "/" + AI_CM_LATE_RETRY_MAX + " scheduled in " + AI_CM_LATE_RETRY_MS + "ms convId=" + cid + " reason=cursor-live");
          setTimeout(function() {
            try {
              aiCmTryLateAutoExport(cid);
            } catch (eTick) {
              swallowSoft(eTick, "export:late-retry-tick");
            }
          }, AI_CM_LATE_RETRY_MS);
          return true;
        } catch (eSch) {
          swallowSoft(eSch, "export:scheduleLateRetry");
          return false;
        }
      }
      function aiCmTryLateAutoExport(cid) {
        try {
          if (!cid || !aiCmLateCheckByConv[cid]) return;
          if (baseComplete !== true) return;
          if (currentAdapter && currentAdapter.siteName === "gemini" && aiCmBaseConfirmedByConv[cid] !== 1) return;
          if (aiCmLoaderRunningByConv[cid]) return;
          if (aiCmCursorLiveByConv[cid]) {
            debugLog("log", "[AI CM][auto-export] skip reason=cursor-live convId=" + cid + " pct=" + autoExportLastPct + " baseComplete=" + (baseComplete === true ? "1" : "0") + " \u2192 late-retry");
            aiCmScheduleLateAutoExportRetry(cid);
            return;
          }
          aiCmLateCheckByConv[cid] = 0;
          aiCmLateRetryByConv[cid] = 0;
          if (typeof autoExportLastPct === "number" && autoExportLastPct >= 0) {
            debugLog("log", "[AI CM][auto-export] late re-check base-complete convId=" + cid + " pct=" + autoExportLastPct + " pendingCursor=0 baseComplete=1");
            maybeAutoExport(autoExportLastPct);
          }
        } catch (e) {
          swallowSoft(e, "export:aiCmTryLateAutoExport");
        }
      }
      function detectTrimStateFallback(prevProbe, snapshot) {
        var res = { suspect: false, confirmed: false, lostHead: false };
        try {
          if (!snapshot || !Array.isArray(snapshot.messageIds)) return res;
          if (snapshot.historyComplete === false) return res;
          var curCount = typeof snapshot.count === "number" ? snapshot.count : snapshot.messageIds.length;
          if (!prevProbe || !(typeof prevProbe.maxCount === "number") || !(prevProbe.maxCount > 0)) return res;
          if (!(curCount < prevProbe.maxCount)) return res;
          var prevFirst = Array.isArray(prevProbe.firstIds) ? prevProbe.firstIds : [];
          if (prevFirst.length === 0) return res;
          var head = [];
          var lim = Math.min(TRIM_HEAD_IDS_N, snapshot.messageIds.length);
          for (var i = 0; i < lim; i++) head.push(String(snapshot.messageIds[i]));
          for (var j = 0; j < prevFirst.length; j++) {
            if (head.indexOf(String(prevFirst[j])) !== -1) return res;
          }
          res.lostHead = true;
          res.suspect = true;
          res.confirmed = !!prevProbe.suspectPending;
        } catch (e) {
          swallow(e, "export:detectTrimStateFallback");
        }
        return res;
      }
      function geminiDetectTrim(detail) {
        try {
          if (!detail || !Array.isArray(detail.messageIds)) return;
          var site = currentAdapter && currentAdapter.siteName || "";
          if (site !== "gemini") return;
          var cid = detail.convId || lastEmitConvId || getCurrentConvId() || "";
          if (!cid) return;
          if (detail.historyComplete !== true) return;
          var G = window.GeminiInterceptLogic;
          var fn = G && typeof G.detectTrimState === "function" ? G.detectTrimState : detectTrimStateFallback;
          var prev = (
            /** @type {{maxCount?: number, firstIds?: string[], suspectPending?: number}|null} */
            trimProbe[cid] || null
          );
          var cnt = typeof detail.count === "number" && detail.count >= 0 ? detail.count : detail.messageIds.length;
          var st = fn(prev, { count: cnt, messageIds: detail.messageIds, historyComplete: true });
          var curFirstIds = detail.messageIds.slice(0, TRIM_HEAD_IDS_N);
          var keptFirstIds = st.lostHead && prev && Array.isArray(prev.firstIds) && prev.firstIds.length > 0 ? prev.firstIds : curFirstIds;
          var maxCount = Math.max(cnt, prev && typeof prev.maxCount === "number" ? prev.maxCount : 0);
          trimProbe[cid] = {
            maxCount,
            firstIds: keptFirstIds,
            suspectPending: st.lostHead ? 1 : 0
            // «подряд» сбрасывается любым стабильным снимком
          };
          if (st.confirmed) {
            debugLog("log", "[AI CM][trim] confirmed \u043E\u0431\u0440\u0435\u0437\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 convId=" + cid + " cnt=" + cnt + " maxCount=" + maxCount);
            maybeTrimExport(cid);
          }
        } catch (e) {
          swallow(e, "export:geminiDetectTrim");
        }
      }
      function maybeTrimExport(cid) {
        try {
          if (!cid || preTrimExportFired[cid]) return;
          preTrimExportFired[cid] = 1;
          var ready = baseComplete === true && !aiCmLoaderRunningByConv[cid] && !aiCmCursorLiveByConv[cid];
          if (!ready) {
            var n = trimRetryByConv[cid] || 0;
            if (n >= 5) {
              debugLog("log", "[AI CM][auto-export] skip reason=pre-trim-not-ready convId=" + cid + " retries=" + n + " baseComplete=" + (baseComplete === true ? "1" : "0"));
              return;
            }
            trimRetryByConv[cid] = n + 1;
            debugLog("log", "[AI CM][auto-export] pre-trim not ready, retry " + (n + 1) + "/5 in 2s convId=" + cid);
            setTimeout(function() {
              try {
                preTrimExportFired[cid] = 0;
                maybeTrimExport(cid);
              } catch (eRetry) {
                swallow(eRetry, "export:maybeTrimExport-retry");
              }
            }, 2e3);
            return;
          }
          var dispLimit = computeEffectiveLimit(lastResolvedModelId);
          var pct = dispLimit > 0 ? Math.round(maxTokenCount / dispLimit * 1e3) / 10 : 0;
          doAutoExportDownload(cid, pct, "pre-trim");
          debugLog("log", "[AI CM][auto-export] fired reason=pre-trim convId=" + cid + " msgs=" + (baseCount || 0) + " lostHead=1.");
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] error:", e);
        }
      }
      function aiCmCancelDeferredHistWrite(cid) {
        try {
          if (!aiCmPendingHistWrite) return;
          if (cid && aiCmPendingHistWrite.convId !== cid) return;
          clearTimeout(aiCmPendingHistWrite.timer);
          aiCmPendingHistWrite = null;
        } catch (e) {
        }
      }
      function aiCmUnionFileMessages(cid, localMsgs, isLowConfidence) {
        try {
          if (isLowConfidence !== true) return localMsgs;
          if (typeof aiCmExportBaseSource !== "function") return localMsgs;
          var union = aiCmExportBaseSource(cid, localMsgs);
          if (union && Array.isArray(union.msgs) && union.msgs.length > localMsgs.length) {
            debugLog("log", "[AI CM][export] O-49 low-confidence base-union: localMsgs=" + localMsgs.length + " unionMsgs=" + union.msgs.length + " baseMsgs=" + union.baseCount + " liveMsgs=" + union.liveCount + " archiveMsgs=" + union.archiveCount + " convId=" + (cid || "-"));
            return union.msgs;
          }
        } catch (eO49u) {
          debugLog("log", "[AI CM][export] silent-catch aiCmUnionFileMessages: " + (eO49u && eO49u.message || eO49u));
        }
        return localMsgs;
      }
      function aiCmCurrentBaseSnapshot(cid) {
        try {
          var cidSnap = cid || lastEmitConvId || getCurrentConvId() || "";
          var msgs = typeof aiCmCollectExportSource === "function" ? aiCmCollectExportSource() : null;
          if (Array.isArray(msgs) && msgs.length > 0 && typeof aiCmDedupeExportSource === "function") {
            msgs = aiCmDedupeExportSource(msgs).messages;
          }
          if (!Array.isArray(msgs) || msgs.length === 0) {
            msgs = typeof buildHistoryMessages === "function" ? buildHistoryMessages() : null;
          }
          if (!Array.isArray(msgs)) return null;
          msgs = aiCmUnionFileMessages(cidSnap, msgs, baseComplete !== true);
          return msgs;
        } catch (eSnap) {
          swallowSoft(eSnap, "export:currentBaseSnapshot");
          return null;
        }
      }
      function aiCmWriteCurrentHistory() {
        try {
          if (!isExtensionValid() || !baseSeen || !baseText) return;
          var cid = lastEmitConvId || getCurrentConvId() || "";
          var mid = lastResolvedModelId;
          var dispLimit = computeEffectiveLimit(mid);
          var pct = dispLimit > 0 ? Math.round(maxTokenCount / dispLimit * 1e3) / 10 : 0;
          var msgsWrite = typeof aiCmCurrentBaseSnapshot === "function" ? aiCmCurrentBaseSnapshot(cid) : null;
          if (!Array.isArray(msgsWrite) || msgsWrite.length === 0) {
            msgsWrite = typeof aiCmCollectExportSource === "function" ? aiCmCollectExportSource() : null;
            if (Array.isArray(msgsWrite) && msgsWrite.length > 0 && typeof aiCmDedupeExportSource === "function") {
              msgsWrite = aiCmDedupeExportSource(msgsWrite).messages;
            }
            if (!Array.isArray(msgsWrite) || msgsWrite.length === 0) msgsWrite = buildHistoryMessages();
            msgsWrite = aiCmUnionFileMessages(cid, msgsWrite, baseComplete !== true);
          }
          var histSnapshot = {
            host: window.location.hostname,
            convId: lastEmitConvId,
            site: currentAdapter && currentAdapter.siteName || "",
            model: lastSnapshotModelName || (mid ? ModelConfig.getModel(mid)?.name || mid : ""),
            tokens: maxTokenCount,
            limit: dispLimit,
            percent: pct,
            updatedAt: Date.now(),
            // v1.14.1: живой флаг вместо липкого — префикс [LOW CONFIDENCE]_ только пока
            // baseComplete !== true; после 0→1 липкий aiCmLowConfidenceByConv больше не лепит
            // ложный префикс переписанному снапшоту.
            isLowConfidenceBase: baseComplete !== true,
            // Two-Tier (v89): метка достоверности источника (только Gemini; у прочих — undefined,
            // ключ не попадает ни в файл, ни в storage-снимок: аддитивность без изменения байтов).
            // typeof-гард — прецедент срез-песочниц тестов (как у aiCmUnionFileMessages): там, где
            // хелпер не включён в срез, метка просто отсутствует — байты прежние.
            sourceTier: typeof aiCmGetSourceTier === "function" ? aiCmGetSourceTier() : void 0,
            messages: msgsWrite
          };
          var histPatch = { aiCmHistory: histSnapshot };
          histPatch["aiCmHistory:" + window.location.hostname] = aiCmHostHistoryRecord(histSnapshot);
          chrome.storage.local.set(histPatch);
        } catch (e) {
          debugLog("log", "[AI CM][export] silent-catch aiCmWriteCurrentHistory: " + (e && e.message || e));
        }
      }
      function aiCmFlushDeferredHistWrite(cid, reason) {
        try {
          var p = aiCmPendingHistWrite;
          if (!p) return;
          if (cid && p.convId !== cid) return;
          if (reason !== "timeout" && !(baseComplete === true && !aiCmLoaderRunningByConv[p.convId])) return;
          clearTimeout(p.timer);
          aiCmPendingHistWrite = null;
          debugLog("log", "[AI CM][export] deferred flushed reason=" + reason + " convId=" + p.convId);
          try {
            if (typeof aiCmDiagLine === "function") {
              aiCmDiagLine("o22-deferred-flush", {
                ts: Date.now(),
                convId: p.convId || "(none)",
                histKey: (typeof baseCount === "number" ? baseCount : 0) + "|" + (typeof baseText === "string" && baseText ? baseText.length : 0),
                lastKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0,
                reason: reason || "(none)",
                baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
                "baseComplete": typeof baseComplete !== "undefined" && baseComplete === true ? 1 : 0
              });
            }
          } catch (eO22e) {
          }
          aiCmWriteCurrentHistory();
        } catch (e) {
          debugLog("log", "[AI CM][export] silent-catch aiCmFlushDeferredHistWrite: " + (e && e.message || e));
        }
      }
      function aiCmScheduleDeferredHistWrite(cid) {
        try {
          let fireDeferredTimeout2 = function() {
            if (aiCmPendingHistWrite !== p) return;
            if (document.visibilityState !== "visible") {
              p.timer = setTimeout(fireDeferredTimeout2, 6e4);
              debugLog("log", "[AI CM][export] deferred-wait-visible convId=" + cid + " (\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0441\u043A\u0440\u044B\u0442\u0430 \u2014 \u0442\u0430\u0439\u043C\u0430\u0443\u0442 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0451\u043D, \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u043A\u0430\u043A \u0435\u0441\u0442\u044C \u043E\u0442\u043B\u043E\u0436\u0435\u043D)");
              return;
            }
            aiCmPendingHistWrite = null;
            var curCid = getCurrentConvId() || "";
            if (curCid && cid !== curCid) {
              debugLog("log", "[AI CM][export] deferred-timeout skip reason=stale-conv timerConv=" + cid + " current=" + curCid);
              return;
            }
            debugLog("log", "[AI CM][export] deferred-timeout(60s), exporting as-is convId=" + cid + " pendingCursor=" + (aiCmCursorLiveByConv[cid] ? "1" : "0") + " baseComplete=" + (baseComplete === true ? "1" : "0"));
            if (baseComplete !== true) {
              try {
                aiCmLowConfidenceByConv[cid] = true;
                if (lastEmitConvId && lastEmitConvId !== cid) aiCmLowConfidenceByConv[lastEmitConvId] = true;
              } catch (eLc64) {
                debugLog("log", "[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite(fireDeferredTimeout/lowConf): " + (eLc64 && eLc64.message || eLc64));
              }
              debugLog("log", "[AI CM][export] as-is baseComplete=0 \u2192 isLowConfidenceBase=true convId=" + cid);
            }
            try {
              if (typeof aiCmDiagLine === "function") {
                aiCmDiagLine("o50-timeout-download", {
                  ts: Date.now(),
                  convId: cid,
                  path: "deferred-timeout-60s",
                  asIs: baseComplete !== true ? 1 : 0,
                  baseComplete: baseComplete === true ? 1 : 0,
                  snapshot: "write-current-history",
                  download: "absent",
                  reason: "no-download-point-on-timeout-path",
                  fired: typeof autoExportFired === "object" && autoExportFired && autoExportFired[cid] === 1 ? 1 : 0,
                  dlNames: typeof aiCmAutoExportNamesUsed === "object" && aiCmAutoExportNamesUsed ? Object.keys(aiCmAutoExportNamesUsed).length : 0
                });
              }
            } catch (eO50d) {
            }
            try {
              aiCmWriteCurrentHistory();
            } catch (eW) {
              debugLog("log", "[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite(fireDeferredTimeout/export): " + (eW && eW.message || eW));
            }
          };
          var fireDeferredTimeout = fireDeferredTimeout2;
          aiCmCancelDeferredHistWrite();
          debugLog("log", "[AI CM][export] deferred until base-complete convId=" + cid + " loader=" + !!aiCmLoaderRunningByConv[cid] + " baseComplete=" + baseComplete);
          var p = { convId: cid, timer: null };
          p.timer = setTimeout(fireDeferredTimeout2, 6e4);
          aiCmPendingHistWrite = p;
        } catch (e) {
          debugLog("log", "[AI CM][export] silent-catch aiCmScheduleDeferredHistWrite: " + (e && e.message || e));
        }
      }
      function loadAutoExportSettings() {
        try {
          if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
          chrome.storage.local.get(["aiCmAutoExport", "aiCmAutoExportPct", "aiCmAutoExportFmt"], function(data) {
            try {
              data = data || {};
              if (typeof data.aiCmAutoExport !== "boolean") {
                autoExportSettings.enabled = false;
                if (!aiCmAutoExportFlagMissingLogged) {
                  aiCmAutoExportFlagMissingLogged = true;
                  console.log("[AI CM][auto-export] \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438: \u0444\u043B\u0430\u0433 enabled \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u2014 \u0430\u0432\u0442\u043E\u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D");
                }
              } else {
                aiCmAutoExportFlagMissingLogged = false;
                autoExportSettings.enabled = data.aiCmAutoExport === true;
              }
              var p = parseInt(data.aiCmAutoExportPct, 10);
              autoExportSettings.pct = !isNaN(p) && p >= 1 && p <= 100 ? p : 90;
              var fmtRaw = data.aiCmAutoExportFmt;
              autoExportSettings.fmt = fmtRaw === "md" || fmtRaw === "json" ? fmtRaw : "txt";
            } catch (eParse) {
              debugLog("error", "[AI CM][auto-export] parse settings error:", eParse);
            }
          });
          try {
            chrome.storage.onChanged.addListener(function(changes, areaName) {
              if (areaName !== "local") return;
              if (changes.aiCmAutoExport || changes.aiCmAutoExportPct || changes.aiCmAutoExportFmt) {
                loadAutoExportSettings();
              }
            });
          } catch (eL) {
          }
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] load settings error:", e);
        }
      }
      function loadExportHiddenSetting() {
        try {
          if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
          chrome.storage.local.get(["aiCmIncludeHiddenInExport"], function(data) {
            try {
              aiCmIncludeHiddenInExport = !!(data && data.aiCmIncludeHiddenInExport === true);
            } catch (eParse7) {
            }
          });
          try {
            chrome.storage.onChanged.addListener(function(changes, areaName) {
              if (areaName !== "local") return;
              if (changes.aiCmIncludeHiddenInExport) {
                aiCmIncludeHiddenInExport = changes.aiCmIncludeHiddenInExport.newValue === true;
              }
            });
          } catch (eL7) {
          }
        } catch (e7) {
          debugLog("error", "[AI CM][export] include-hidden setting load error:", e7);
        }
      }
      function aiCmAutoExportConvId() {
        try {
          var urlCid = getCurrentConvId() || "";
          var site = currentAdapter && currentAdapter.siteName || "";
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (P && typeof P.resolveAutoExportConvId === "function") {
            return P.resolveAutoExportConvId(site, urlCid, lastThreadId || "") || "";
          }
          return urlCid;
        } catch (e) {
          return getCurrentConvId() || "";
        }
      }
      function aiCmGsaNetworkCompleteReset(threadId) {
        try {
          var tid = threadId === void 0 || threadId === null ? "" : String(threadId);
          var prev = typeof aiCmGsaNetworkCompleteThreadId === "string" ? aiCmGsaNetworkCompleteThreadId : null;
          if (prev !== null && prev === tid) return false;
          if (typeof aiCmGsaNetworkCompleteLatch === "object" && aiCmGsaNetworkCompleteLatch) {
            for (var k in aiCmGsaNetworkCompleteLatch) {
              if (Object.prototype.hasOwnProperty.call(aiCmGsaNetworkCompleteLatch, k)) delete aiCmGsaNetworkCompleteLatch[k];
            }
          }
          aiCmGsaNetworkCompleteThreadId = tid;
          return true;
        } catch (e) {
          return false;
        }
      }
      function aiCmGsaNetworkCompleteSet(threadId) {
        try {
          var site = currentAdapter && currentAdapter.siteName || "";
          if (site !== "google_search") return false;
          var tid = threadId === void 0 || threadId === null ? "" : String(threadId);
          var cid = aiCmAutoExportConvId() || tid;
          if (!cid) return false;
          if (typeof aiCmGsaNetworkCompleteLatch !== "object" || !aiCmGsaNetworkCompleteLatch) return false;
          aiCmGsaNetworkCompleteLatch[site + "|" + cid] = 1;
          return true;
        } catch (e) {
          return false;
        }
      }
      function aiCmGsaNetworkCompleteIs(site, cid) {
        try {
          if (site !== "google_search") return false;
          if (!cid) return false;
          if (typeof aiCmGsaNetworkCompleteLatch !== "object" || !aiCmGsaNetworkCompleteLatch) return false;
          return aiCmGsaNetworkCompleteLatch[site + "|" + cid] === 1;
        } catch (e) {
          return false;
        }
      }
      var aiCmGsaProbeByThread = {};
      var aiCmGsaProbeRunning = false;
      window.addEventListener("ai-cm-gsa-probe-state", function(ev) {
        try {
          var d = ev && ev.detail;
          if (!d) return;
          aiCmGsaProbeRunning = d.running === true;
          if (d.threadId) aiCmGsaProbeByThread[d.threadId] = aiCmGsaProbeRunning ? 1 : 0;
        } catch (eGsaProbe) {
        }
      });
      function aiCmGsaProbeRunningFor(cid) {
        try {
          if (cid && typeof aiCmGsaProbeByThread[cid] !== "undefined") return aiCmGsaProbeByThread[cid] === 1;
          return aiCmGsaProbeRunning === true;
        } catch (e) {
          return false;
        }
      }
      function aiCmAutoExportLogOnChange(family, key) {
        var self = (
          /** @type {any} */
          aiCmAutoExportLogOnChange
        );
        try {
          var f = String(family || "");
          var k = key === void 0 || key === null ? "" : String(key);
          var st = typeof aiCmAutoExportLastLogState === "object" && aiCmAutoExportLastLogState ? aiCmAutoExportLastLogState : null;
          if (!st) {
            if (!self.__state) self.__state = /* @__PURE__ */ Object.create(null);
            st = self.__state;
          }
          if (st[f] === k) return false;
          st[f] = k;
          return true;
        } catch (e) {
          return true;
        }
      }
      function aiCmAutoExportLogFiredBit(site, cid) {
        try {
          var c = cid === void 0 || cid === null ? "" : String(cid);
          if (!c) return 0;
          var k = String(site || "") + "|" + c;
          if (typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce && aiCmAutoExportFiredOnce[k] === 1) return 1;
          if (typeof autoExportFired === "object" && autoExportFired && autoExportFired[k] === 1) return 1;
          return 0;
        } catch (e) {
          return 0;
        }
      }
      function aiCmGsaAutoExportSkipLog(reason, cid, percentage) {
        try {
          if (reason === "not-complete" || reason === "probe-running") {
            var k = "gsa:" + cid;
            if (notCompleteLogged[k]) return;
            notCompleteLogged[k] = 1;
          } else if (reason === "not-chat-page" || reason === "no-messages" || reason === "empty-base") {
            var k27 = "gsa27:" + reason + ":" + cid;
            if (notCompleteLogged[k27]) return;
            notCompleteLogged[k27] = 1;
          }
          if (typeof aiCmAutoExportLogOnChange === "function") {
            var firedBit = typeof aiCmAutoExportLogFiredBit === "function" ? aiCmAutoExportLogFiredBit("google_search", cid) : 0;
            if (!aiCmAutoExportLogOnChange(
              "gsa-skip",
              "google_search|" + cid + "|" + reason + "|fired=" + firedBit
            )) {
              return;
            }
          }
          debugLog("log", "[AI CM][auto-export] site=google_search skip reason=" + reason + " convId=" + cid + " pct=" + percentage + " probeRunning=" + (aiCmGsaProbeRunningFor(cid) ? "1" : "0"));
        } catch (e) {
        }
      }
      var AI_CM_DS_STREAM_DEFER_MS = 800;
      var AI_CM_DS_STREAM_DEFER_MAX = 150;
      var aiCmDsStreamDeferByConv = {};
      var aiCmDsStreamDeferLogged = {};
      var aiCmDsStreamFlushLogged = {};
      function aiCmDeepseekStreamProbe() {
        try {
          var resp = null;
          var h = function(ev) {
            resp = ev.detail;
          };
          window.addEventListener("ai-cm-deepseek-stream-probe-response", h, { once: true });
          window.dispatchEvent(new CustomEvent("ai-cm-deepseek-stream-probe"));
          window.removeEventListener("ai-cm-deepseek-stream-probe-response", h);
          return resp;
        } catch (e) {
          return null;
        }
      }
      function aiCmDeepseekStreamActiveFor(cid) {
        try {
          if ((currentAdapter && currentAdapter.siteName || "") !== "deepseek") return false;
          var snap = aiCmDeepseekStreamProbe();
          if (!snap || snap.active !== true) return false;
          if (snap.convId && cid && String(snap.convId) !== String(cid)) return false;
          return true;
        } catch (e) {
          return false;
        }
      }
      function aiCmFlushLiveStreamForExport(cid) {
        try {
          if (!aiCmDeepseekStreamActiveFor(cid)) return false;
          window.dispatchEvent(new CustomEvent("ai-cm-deepseek-stream-flush"));
          if (cid && !aiCmDsStreamFlushLogged[cid]) {
            aiCmDsStreamFlushLogged[cid] = 1;
            debugLog("log", "[AI CM][auto-export] stream-flush convId=" + cid + " reason=manual");
          }
          return true;
        } catch (e) {
          return false;
        }
      }
      function aiCmDeferAutoExportOnLiveStream(cid, percentage) {
        try {
          if (!cid) return false;
          if (!aiCmDeepseekStreamActiveFor(cid)) return false;
          var n = (aiCmDsStreamDeferByConv[cid] || 0) + 1;
          aiCmDsStreamDeferByConv[cid] = n;
          if (n > AI_CM_DS_STREAM_DEFER_MAX) {
            aiCmDsStreamDeferByConv[cid] = 0;
            aiCmFlushLiveStreamForExport(cid);
            debugLog("log", "[AI CM][auto-export] stream-flush convId=" + cid + " reason=defer-cap defers=" + AI_CM_DS_STREAM_DEFER_MAX);
            return false;
          }
          if (!aiCmDsStreamDeferLogged[cid]) {
            aiCmDsStreamDeferLogged[cid] = 1;
            debugLog("log", "[AI CM][auto-export] defer reason=stream-active convId=" + cid + " pct=" + percentage + " ms=" + AI_CM_DS_STREAM_DEFER_MS + " histSource=memory");
          }
          setTimeout(function() {
            try {
              if (!cid || cid !== aiCmAutoExportConvId()) return;
              maybeAutoExport(percentage);
            } catch (eR) {
              swallowSoft(eR, "export:aiCmDeferAutoExportOnLiveStream-timer");
            }
          }, AI_CM_DS_STREAM_DEFER_MS);
          return true;
        } catch (e) {
          return false;
        }
      }
      var aiCmAutoExportSkipReasonState = { reason: "" };
      function aiCmAutoExportBasePendingLog(cid, percentage) {
        try {
          if (typeof aiCmDiagLine !== "function") return;
          var site = typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "";
          aiCmDiagLine("auto-export", {
            point: "maybeAutoExport",
            verdict: "skip",
            reason: "base-pending",
            site,
            convId: cid,
            pct: percentage,
            baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
            baseComplete: typeof baseComplete !== "undefined" && baseComplete === true ? 1 : 0
          });
        } catch (eBp) {
        }
      }
      function aiCmAutoExportDecisionDiag(percentage, verdictSkip, reason) {
        try {
          if (typeof aiCmDiagLine !== "function") return false;
          var site = typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "";
          var memMsgs = typeof lastBaseTexts !== "undefined" && Array.isArray(lastBaseTexts) ? lastBaseTexts.length : 0;
          var memTextLen = typeof baseText === "string" ? baseText.length : 0;
          if (memTextLen === 0 && typeof lastBaseTexts !== "undefined" && Array.isArray(lastBaseTexts)) {
            memTextLen = lastBaseTexts.join("\n").length;
          }
          var netLatchNow = typeof aiCmGsaNetworkCompleteIs === "function" ? aiCmGsaNetworkCompleteIs(site, aiCmAutoExportConvId() || "") === true : false;
          var fileSource;
          try {
            var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
            if (P && typeof P.pickExportSource === "function") {
              fileSource = P.pickExportSource(baseSeen === true, memMsgs > 0);
            }
          } catch (eSrc) {
            fileSource = void 0;
          }
          aiCmDiagLine("auto-export-decision", {
            ts: Date.now(),
            point: "maybeAutoExport",
            site,
            convId: aiCmAutoExportConvId() || "",
            verdict: verdictSkip === true ? "skip" : "fire",
            reason: verdictSkip === true ? reason || "" : "threshold",
            pct: percentage,
            histSource: typeof baseSeen !== "undefined" && baseSeen === true ? "network" : "memory",
            fileSource,
            baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
            baseComplete: typeof baseComplete !== "undefined" && baseComplete === true ? 1 : 0,
            // O-43: полнота читается гейтом из монотонного латча (см. aiCmGsaNetworkCompleteIs):
            // histSource=memory в момент файра — признак ухода файла по памяти, а не по сети.
            netLatch: netLatchNow,
            msgs: typeof baseCount === "number" ? baseCount : 0,
            memMsgs,
            textLen: memTextLen
          });
          return true;
        } catch (eDec) {
          return false;
        }
      }
      function maybeAutoExport(percentage) {
        try {
          var s = autoExportSettings;
          if (!s || s.enabled !== true) return;
          var cid = aiCmAutoExportConvId();
          if (cid !== autoExportLastConvId) {
            notCompleteLogged = {};
            autoExportLastConvId = cid;
          }
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          var siteName = currentAdapter && currentAdapter.siteName || "";
          var perSiteThr = typeof autoExportPctBySite === "object" && autoExportPctBySite ? autoExportPctBySite[siteName] : void 0;
          var threshold = P && typeof P.effectiveAutoExportThreshold === "function" ? P.effectiveAutoExportThreshold(s.pct, perSiteThr) : typeof s.pct === "number" && s.pct >= 1 && s.pct <= 100 ? s.pct : 90;
          if (typeof percentage !== "number" || !(percentage >= 0)) return;
          if (baseSeen === true || siteName === "gemini") {
            autoExportLastPct = percentage;
          }
          var isGeminiSvc = siteName === "gemini";
          var gsaMsgCount;
          var gsaBaseTextLen;
          var gsaChatMarker;
          var gsaNetworkLatch;
          if (siteName === "google_search") {
            gsaMsgCount = typeof baseCount === "number" ? baseCount : void 0;
            gsaChatMarker = typeof aiCmGsaChatPageMarker === "function" ? aiCmGsaChatPageMarker() : void 0;
            if (typeof baseText === "string") {
              gsaBaseTextLen = baseText.length;
            } else if (typeof lastBaseTexts !== "undefined" && Array.isArray(lastBaseTexts)) {
              gsaBaseTextLen = lastBaseTexts.join("\n").length;
            }
            gsaNetworkLatch = typeof aiCmGsaNetworkCompleteIs === "function" ? aiCmGsaNetworkCompleteIs(siteName, cid) === true : false;
          }
          if (P && typeof P.shouldSkipAutoExport === "function") {
            var verdict = P.shouldSkipAutoExport({
              enabled: s.enabled,
              percentage,
              threshold,
              baseComplete: baseComplete === true,
              baseSeen: baseSeen === true,
              loaderRunning: !!(cid && aiCmLoaderRunningByConv[cid]),
              // T1-fix#2 (v1.16.2): база из одного архива (baseCount <= archiveMsgs) полнотой
              // живого яруса не является — гейт внутри shouldSkipAutoExport (archive-pending-live).
              archiveCount: aiCmArchiveCountFor(cid),
              baseCount,
              // v1.14.1 (O3): fired = in-memory ИЛИ session-латч (кросс-табовый)
              // O-38: + модульный латч — переживает resetConversationState (SPA-возврат)
              fired: P.getAutoExportFired(autoExportFired, siteName, cid) || (typeof P.isFiredInSession === "function" ? P.isFiredInSession(sessionFiredCache, siteName, cid) : false) || typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce && aiCmAutoExportFiredOnce[siteName + "|" + cid] === 1,
              isGemini: isGeminiSvc,
              // O-37 (A): база сервиса БЕЗ сети (qwen) — доверенная по дизайну O-35 (живой источник —
              // DOM-адаптер; признак «база адаптера принята» взведён записью source=adapter). Предикат живёт в
              // content.js (там же, где писатель признака) и вызывается typeof-гардом: в срез-
              // песочницах без него вердикт прежний, а сам гейт получает только БУЛЕВО (имя признака
              // в автоэкспорт-контур не проникает — пин v54/G). false → поведение всех платформ 1:1.
              domBaseTrusted: typeof aiCmAutoExportTrustedBase === "function" ? aiCmAutoExportTrustedBase() === true : false,
              // O-27 (b/c): сайт + факты страницы (см. shouldSkipGsaPageGuard)
              site: siteName,
              chatPageMarker: gsaChatMarker,
              msgCount: gsaMsgCount,
              baseTextLen: gsaBaseTextLen,
              // O-43: монотонный латч сетевой полноты GSA (только google_search; undefined у прочих —
              // поле опционально, вердикты шести платформ байтово прежние)
              gsaNetworkCompleteLatch: gsaNetworkLatch
            });
            var skipReasonState = typeof aiCmAutoExportSkipReasonState !== "undefined" ? aiCmAutoExportSkipReasonState : null;
            if (verdict && verdict.skip) {
              var basePendingChanged = !skipReasonState || skipReasonState.reason !== "base-pending";
              if (skipReasonState) skipReasonState.reason = verdict.reason;
              if (verdict.reason === "below-threshold-hysteresis") {
                P.resetAutoExportFired(autoExportFired, siteName, cid);
                try {
                  if (typeof P.firedSessionKey === "function") {
                    aiCmLatchRemove(siteName, cid);
                    var pkHys = P.firedSessionKey(siteName, cid);
                    if (pkHys) delete sessionFiredCache[pkHys];
                  }
                } catch (eO3hys) {
                  swallowSoft(eO3hys, "export:maybeAutoExport-latch-hysteresis");
                }
              }
              if (verdict.reason === "base-pending") {
                if (basePendingChanged && typeof aiCmAutoExportBasePendingLog === "function") {
                  aiCmAutoExportBasePendingLog(cid, percentage);
                }
                return;
              }
              if (siteName === "google_search") {
                var gsaReason = verdict.reason;
                if (verdict.reason === "not-complete" && P && typeof P.notCompleteReason === "function") {
                  gsaReason = P.notCompleteReason({ site: siteName, probeRunning: aiCmGsaProbeRunningFor(cid) });
                }
                aiCmGsaAutoExportSkipLog(gsaReason, cid, percentage);
                return;
              }
              if (verdict.reason === "not-complete") {
                if (cid && !notCompleteLogged[cid]) {
                  notCompleteLogged[cid] = 1;
                  debugLog("log", "[AI CM][auto-export] skip reason=not-complete convId=" + cid + " pct=" + percentage);
                }
              } else if (verdict.reason === "already-fired") {
                debugLog("log", "[AI CM][auto-export] skip reason=already-fired convId=" + cid);
              } else if (verdict.reason === "loader-running") {
                debugLog("log", "[AI CM][auto-export] skip reason=loader-running convId=" + cid + " pct=" + percentage);
              } else if (verdict.reason === "archive-pending-live") {
                if (cid && !notCompleteLogged["arch:" + cid]) {
                  notCompleteLogged["arch:" + cid] = 1;
                  debugLog("log", "[AI CM][auto-export] skip reason=archive-pending-live convId=" + cid + " baseCount=" + baseCount + " archiveMsgs=" + aiCmArchiveCountFor(cid));
                }
              } else if (verdict.reason === "below-threshold") {
                debugLog("log", "[AI CM][auto-export] skip reason=below-threshold convId=" + cid + " pct=" + percentage);
              } else if (verdict.reason === "below-threshold-hysteresis") {
              } else if (verdict.reason === "below-threshold-unreliable") {
              }
              if (typeof aiCmAutoExportDecisionDiag === "function") aiCmAutoExportDecisionDiag(percentage, true, verdict.reason);
              return;
            }
            if (skipReasonState) skipReasonState.reason = "";
            if (cid) {
              delete notCompleteLogged[cid];
              delete notCompleteLogged["gsa:" + cid];
            }
            if (!cid) return;
            if (aiCmCursorLiveByConv[cid]) {
              if (!notCompleteLogged["cur:" + cid]) {
                notCompleteLogged["cur:" + cid] = 1;
                debugLog("log", "[AI CM][auto-export] skip reason=cursor-live convId=" + cid + " pct=" + percentage + " pendingCursor=1 baseComplete=" + (baseComplete === true ? "1" : "0"));
              }
              return;
            }
            if (typeof aiCmAutoExportDecisionDiag === "function") aiCmAutoExportDecisionDiag(percentage, false);
            doAutoExportDownload(cid, percentage, "threshold");
            return;
          }
          if (isGeminiSvc) {
            var archMsgsFb = aiCmArchiveCountFor(cid);
            if (archMsgsFb > 0 && baseCount <= archMsgsFb) {
              debugLog("log", "[AI CM][auto-export] skip reason=archive-pending-live convId=" + cid + " baseCount=" + baseCount + " archiveMsgs=" + archMsgsFb);
              return;
            }
          }
          if (baseComplete !== true) {
            if (cid && !notCompleteLogged[cid]) {
              notCompleteLogged[cid] = 1;
              debugLog("log", "[AI CM][auto-export] skip reason=not-complete convId=" + cid + " pct=" + percentage);
            }
            return;
          }
          if (cid) delete notCompleteLogged[cid];
          if (cid && aiCmLoaderRunningByConv[cid]) {
            debugLog("log", "[AI CM][auto-export] skip reason=loader-running convId=" + cid + " pct=" + percentage);
            return;
          }
          if (percentage < threshold - 10) {
            if (baseSeen === true && cid) {
              delete autoExportFired[cid];
              try {
                if (P && typeof P.firedSessionKey === "function") {
                  aiCmLatchRemove(siteName, cid);
                  var pkHys2 = P.firedSessionKey(siteName, cid);
                  if (pkHys2) delete sessionFiredCache[pkHys2];
                }
              } catch (eO3hys2) {
                swallowSoft(eO3hys2, "export:maybeAutoExport-latch-below-threshold");
              }
            }
            return;
          }
          if (percentage < threshold) {
            debugLog("log", "[AI CM][auto-export] skip reason=below-threshold convId=" + cid + " pct=" + percentage);
            return;
          }
          if (!cid) return;
          if (autoExportFired[cid] || P && typeof P.isFiredInSession === "function" && P.isFiredInSession(sessionFiredCache, siteName, cid) || typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce && aiCmAutoExportFiredOnce[siteName + "|" + cid] === 1) {
            debugLog("log", "[AI CM][auto-export] skip reason=already-fired convId=" + cid);
            return;
          }
          if (aiCmCursorLiveByConv[cid]) {
            if (!notCompleteLogged["cur:" + cid]) {
              notCompleteLogged["cur:" + cid] = 1;
              debugLog("log", "[AI CM][auto-export] skip reason=cursor-live convId=" + cid + " pct=" + percentage + " pendingCursor=1 baseComplete=" + (baseComplete === true ? "1" : "0"));
            }
            return;
          }
          doAutoExportDownload(cid, percentage, "threshold");
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] error:", e);
        }
      }
      function aiCmEffectiveAutoExportThreshold(siteName) {
        try {
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          var s = typeof autoExportSettings === "object" && autoExportSettings ? autoExportSettings : null;
          var globalPct = s && typeof s.pct === "number" ? s.pct : void 0;
          var perSitePct = typeof autoExportPctBySite === "object" && autoExportPctBySite ? autoExportPctBySite[siteName || ""] : void 0;
          if (P && typeof P.effectiveAutoExportThreshold === "function") {
            return P.effectiveAutoExportThreshold(globalPct, perSitePct);
          }
          return typeof globalPct === "number" && globalPct >= 1 && globalPct <= 100 ? globalPct : 90;
        } catch (eThr) {
          return 90;
        }
      }
      var aiCmAutoExportNamesUsed = /* @__PURE__ */ Object.create(null);
      function aiCmAutoExportStartDownload(content, file, fmt) {
        var Pdl = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
        var used = typeof aiCmAutoExportNamesUsed === "object" && aiCmAutoExportNamesUsed ? aiCmAutoExportNamesUsed : null;
        if (used && file && Pdl && typeof Pdl.isFileNameTaken === "function" && Pdl.isFileNameTaken(used, file) && typeof Pdl.disambiguateFileName === "function") {
          file = Pdl.disambiguateFileName(file, used);
        }
        try {
          if (used && file) used[file] = 1;
        } catch (eNameReserve) {
        }
        var Bdl = typeof window !== "undefined" && window.AiCmExportBuilders ? window.AiCmExportBuilders : null;
        if (!Bdl || typeof Bdl.downloadBlob !== "function") throw new Error("utils/export-text-builders.js \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");
        Bdl.downloadBlob(content, file, fmt === "md" ? "text/markdown" : fmt === "json" ? "application/json" : "text/plain;charset=utf-8", "autoexport");
        return file;
      }
      function doAutoExportDownload(cid, percentage, reason, netSynced) {
        try {
          let aiCmWriteAutoExportFile2 = function(fileMsgs, histSource, histConvId, histSite) {
            try {
              if (histConvId && cid && String(histConvId) !== String(cid) || histSite && siteNameD && String(histSite) !== String(siteNameD)) {
                debugLog("log", "[AI CM][auto-export] abort reason=history-source-mismatch histConvId=" + histConvId + " site=" + histSite);
                return;
              }
              var msgs2 = fileMsgs;
              try {
                aiCmDumpTurnsSnapshot("snapshot-at-fired", cid, msgs2);
              } catch (eDump) {
              }
              var hist = {
                site: currentAdapter && currentAdapter.siteName || "",
                model: ModelConfig.getModel(lastResolvedModelId || "")?.name || "",
                tokens: maxTokenCount,
                limit: 0,
                percent: percentage,
                // Two-Tier (v89): метка источника — из ОБЪЕДИНЁННОЙ базы в момент сборки файла;
                // сборщики TXT/MD ставят её первой строкой/блоком только для Gemini.
                // typeof-гард — как у снимка истории выше (срез-песочницы тестов).
                sourceTier: typeof aiCmGetSourceTier === "function" ? aiCmGetSourceTier() : void 0,
                messages: msgs2
              };
              var content = fmt === "md" ? B.buildMdFromHistory(hist, currentAdapter && currentAdapter.siteName || "AI Chat") : fmt === "json" ? typeof B.buildJsonFromHistory === "function" ? B.buildJsonFromHistory(hist, currentAdapter && currentAdapter.siteName || "AI Chat") : "" : B.buildTxtFromHistory(hist);
              if (typeof content !== "string") content = "";
              var textLen = String(content).replace(/^\uFEFF/, "").replace(/\s+/g, "").length;
              if (textLen <= 0) {
                debugLog("log", "[AI CM][auto-export] skip reason=empty-text convId=" + cid);
                return;
              }
              if (fmt === "txt" && content.charAt(0) !== "\uFEFF") content = "\uFEFF" + content;
              if (reason !== "pre-trim") {
                var PDl = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
                if (PDl && typeof PDl.markAutoExportFired === "function") {
                  PDl.markAutoExportFired(autoExportFired, currentAdapter && currentAdapter.siteName || "", cid);
                  try {
                    var siteOnce = currentAdapter && currentAdapter.siteName || "";
                    if (typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce) {
                      aiCmAutoExportFiredOnce[siteOnce + "|" + cid] = 1;
                    }
                  } catch (eOnce) {
                    swallowSoft(eOnce, "export:aiCmWriteAutoExportFile-once");
                  }
                  try {
                    var siteO3 = currentAdapter && currentAdapter.siteName || "";
                    var pkO3 = typeof PDl.firedSessionKey === "function" ? PDl.firedSessionKey(siteO3, cid) : null;
                    if (pkO3) {
                      aiCmLatchSet(siteO3, cid);
                      sessionFiredCache[pkO3] = 1;
                    }
                  } catch (eO3write) {
                    swallowSoft(eO3write, "export:aiCmWriteAutoExportFile-fired-latch");
                  }
                } else {
                  autoExportFired[cid] = 1;
                  try {
                    var siteOnceFb = currentAdapter && currentAdapter.siteName || "";
                    if (typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce) {
                      aiCmAutoExportFiredOnce[siteOnceFb + "|" + cid] = 1;
                    }
                  } catch (eOnceFb) {
                    swallowSoft(eOnceFb, "export:aiCmWriteAutoExportFile-once-fallback");
                  }
                }
              }
              aiCmCancelDeferredHistWrite(cid);
              try {
                var BdiagDl = typeof window !== "undefined" && window && window.AiCmExportBuilders ? window.AiCmExportBuilders : null;
                if (BdiagDl && typeof BdiagDl.aiCmDiagDownload === "function") {
                  BdiagDl.aiCmDiagDownload("autoexport", content, file, {
                    reason,
                    site: typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName ? currentAdapter.siteName : "",
                    threadId: typeof lastThreadId === "string" ? lastThreadId : "",
                    mime: fmt
                  });
                }
              } catch (eDiagDl) {
              }
              file = aiCmAutoExportStartDownload(content, file, fmt);
              debugLog("log", "[AI CM][auto-export] fired convId=" + cid + " pct=" + percentage + " file=" + file + " textLen=" + textLen + " pendingCursor=" + (aiCmCursorLiveByConv[cid] ? "1" : "0") + " baseComplete=" + (baseComplete === true ? "1" : "0") + " histSource=" + histSource + " histConvId=" + histConvId);
              try {
                window.dispatchEvent(new CustomEvent("ai-cm-auto-export-fired", { detail: JSON.stringify({
                  convId: cid,
                  site: siteNameD || "",
                  reason: reason || ""
                }) }));
              } catch (eFiredEvt) {
                swallowSoft(eFiredEvt, "export:auto-export-fired-event");
              }
              try {
                if (typeof aiCmAutoExportTrustedBaseDiag === "function") {
                  aiCmAutoExportTrustedBaseDiag(reason, cid, percentage);
                }
              } catch (eTrustDiag) {
              }
              if (siteNameD === "google_search") {
                debugLog("log", "[AI CM][auto-export] site=google_search fired convId=" + cid + " pct=" + percentage + " file=" + file + " fmt=" + fmt + " model=" + (gsaModelD || "") + " lowConfidence=" + (lowConfD === true ? "1" : "0") + " baseComplete=" + (baseComplete === true ? "1" : "0") + " histSource=" + histSource + " histConvId=" + histConvId);
              }
            } catch (eInner) {
              debugLog("error", "[AI CM][auto-export] error:", eInner);
            }
          };
          var aiCmWriteAutoExportFile = aiCmWriteAutoExportFile2;
          if (typeof aiCmDeferAutoExportOnLiveStream === "function" && aiCmDeferAutoExportOnLiveStream(cid, percentage)) return;
          if (netSynced !== true && (typeof aiCmExportFilesThenNetSync === "function" || typeof aiCmExportNetSyncThen === "function") && aiCmExportNetSyncSite()) {
            if (!aiCmNetSyncInFlight[cid]) {
              aiCmNetSyncInFlight[cid] = 1;
              var selfSync = function() {
                delete aiCmNetSyncInFlight[cid];
                doAutoExportDownload(cid, percentage, reason, true);
              };
              try {
                if (typeof aiCmExportFilesThenNetSync === "function") aiCmExportFilesThenNetSync(cid, selfSync);
                else aiCmExportNetSyncThen(cid, selfSync);
              } catch (eSync) {
                delete aiCmNetSyncInFlight[cid];
                selfSync();
              }
              return;
            }
            debugLog("log", "[AI CM][auto-export] net-sync \u0443\u0436\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F convId=" + cid);
            return;
          }
          var B = typeof window !== "undefined" && window.AiCmExportBuilders ? window.AiCmExportBuilders : null;
          if (!B) throw new Error("utils/export-text-builders.js \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D");
          var fmt = autoExportSettings.fmt === "md" ? "md" : autoExportSettings.fmt === "json" ? "json" : "txt";
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          var siteNameD = currentAdapter && currentAdapter.siteName || "";
          var lowConfD = siteNameD === "gemini" ? aiCmLowConfidenceByConv[cid] === true : siteNameD === "google_search" ? baseComplete !== true : false;
          var gsaModelD = siteNameD === "google_search" && typeof lastSnapshotModelName === "string" ? lastSnapshotModelName : "";
          var file;
          var namesUsedD = typeof aiCmAutoExportNamesUsed === "object" && aiCmAutoExportNamesUsed ? aiCmAutoExportNamesUsed : null;
          if (siteNameD === "google_search" && P && typeof P.buildGsaExportFileName === "function") {
            file = P.buildGsaExportFileName(siteNameD, gsaModelD, lowConfD, fmt, namesUsedD);
          } else if (P && typeof P.buildExportFileName === "function") {
            file = P.buildExportFileName(siteNameD, cid, reason, lowConfD, fmt, namesUsedD);
          } else {
            let ap2Fb2 = function(n) {
              return (n < 10 ? "0" : "") + n;
            };
            var ap2Fb = ap2Fb2;
            var dFb = /* @__PURE__ */ new Date();
            file = "chat-" + String(cid).slice(0, 8) + "-" + dFb.getFullYear() + "-" + ap2Fb2(dFb.getMonth() + 1) + "-" + ap2Fb2(dFb.getDate()) + "_" + ap2Fb2(dFb.getHours()) + "-" + ap2Fb2(dFb.getMinutes()) + (reason === "pre-trim" ? "-pretrim" : "") + "." + fmt;
          }
          var msgs = buildHistoryMessages();
          if (baseSeen === true && lastBaseTexts.length === 0) {
            debugLog("log", "[AI CM][auto-export] skip reason=source-mismatch convId=" + cid + " baseSeen=1 networkTexts=0");
            return;
          }
          var baseSrc = aiCmExportBaseSource(cid, msgs);
          var srcTag = "local";
          if (baseSrc && baseSrc.blocked === true) {
            debugLog("log", "[AI CM][auto-export] skip reason=archive-pending-live convId=" + cid + " baseMsgs=" + baseSrc.baseCount + " liveMsgs=" + baseSrc.liveCount + " archiveMsgs=" + baseSrc.archiveCount + " source=archive-only-base");
            return;
          }
          if (baseSrc && Array.isArray(baseSrc.msgs)) {
            debugLog("log", "[AI CM][auto-export] source=base-union convId=" + cid + " baseMsgs=" + baseSrc.baseCount + " localMsgs=" + (Array.isArray(msgs) ? msgs.length : 0) + " liveMsgs=" + baseSrc.liveCount + " archiveMsgs=" + baseSrc.archiveCount);
            msgs = baseSrc.msgs;
            srcTag = "base-union";
          }
          var histConvIdMem = "";
          try {
            if (typeof lastEmitConvId === "string" && lastEmitConvId) histConvIdMem = lastEmitConvId;
            else if (siteNameD === "google_search" && typeof lastThreadId === "string" && lastThreadId) histConvIdMem = lastThreadId;
            else if (typeof getCurrentConvId === "function") histConvIdMem = getCurrentConvId() || "";
          } catch (eHistCid) {
            histConvIdMem = "";
          }
          var histSiteMem = siteNameD;
          if (!Array.isArray(msgs) || msgs.length === 0) {
            var hostFb = "";
            try {
              hostFb = typeof window !== "undefined" && window.location && window.location.hostname || "";
            } catch (eHostFb) {
            }
            var hostKeyFb = hostFb ? "aiCmHistory:" + hostFb : "";
            var readFb = false;
            var fbDone = false;
            var onHostHistFb = function(data) {
              if (fbDone) return;
              fbDone = true;
              var rec = data && typeof data === "object" ? data[hostKeyFb] : null;
              if (!rec || !Array.isArray(rec.messages) || rec.messages.length === 0) {
                debugLog("log", "[AI CM][auto-export] skip reason=empty-history convId=" + cid + " histSource=storage-host");
                return;
              }
              aiCmWriteAutoExportFile2(rec.messages, "storage-host", rec.convId || "", rec.site || "");
            };
            try {
              if (hostKeyFb && typeof chrome !== "undefined" && chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === "function") {
                readFb = true;
                var maybePromiseFb = chrome.storage.local.get([hostKeyFb], onHostHistFb);
                if (maybePromiseFb && typeof maybePromiseFb.then === "function") {
                  maybePromiseFb.then(onHostHistFb, function() {
                    onHostHistFb(null);
                  });
                }
              }
            } catch (eHostRead) {
              readFb = false;
            }
            if (!readFb) {
              debugLog("log", "[AI CM][auto-export] skip reason=empty-history convId=" + cid);
            }
            return;
          }
          aiCmWriteAutoExportFile2(msgs, "memory", histConvIdMem, histSiteMem);
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] error:", e);
        }
      }
      window.addEventListener("ai-cm-loader-state", function(ev) {
        try {
          var d = ev && ev.detail;
          if (!d || !d.convId) return;
          var __fullServer95 = (d.reachedStart === true || d.reachedStart === 1) && (d.historyFullByQuiet === true || d.historyFullByQuiet === 1 || d.baseComplete === true);
          if (d.running) {
            aiCmLoaderRunningByConv[d.convId] = 1;
            aiCmCursorLiveByConv[d.convId] = __fullServer95 === true ? false : !!d.pendingCursor;
            aiCmBaseConfirmedByConv[d.convId] = d.baseComplete === true && d.reachedStart === true ? 1 : 0;
            return;
          }
          delete aiCmLoaderRunningByConv[d.convId];
          aiCmCursorLiveByConv[d.convId] = __fullServer95 === true ? false : !!d.pendingCursor;
          aiCmBaseConfirmedByConv[d.convId] = d.baseComplete === true && d.reachedStart === true ? 1 : 0;
          if (aiCmBaseConfirmedByConv[d.convId] === 1) {
            aiCmFlushDeferredHistWrite(d.convId, "loader-stop");
            if (typeof aiCmResyncMetricsAfterFlush === "function") {
              aiCmResyncMetricsAfterFlush(d.convId, "loader-stop");
            }
          } else {
            debugLog("log", "[AI CM][export] deferred kept reason=base-unconfirmed convId=" + d.convId + " baseComplete=" + (d.baseComplete === true ? "1" : "0") + " reachedStart=" + (d.reachedStart === true ? "1" : "0"));
          }
          var cid = getCurrentConvId() || "";
          if (cid && cid === d.convId && autoExportSettings.enabled === true && typeof autoExportLastPct === "number" && autoExportLastPct >= 0) {
            if (baseComplete !== true || aiCmBaseConfirmedByConv[cid] !== 1 || !!d.pendingCursor && __fullServer95 !== true) {
              aiCmLateCheckByConv[cid] = 1;
              aiCmTryLateAutoExport(cid);
              debugLog("log", "[AI CM][auto-export] loader-stop \u0441 \u043D\u0435\u043F\u043E\u043B\u043D\u043E\u0439 \u0431\u0430\u0437\u043E\u0439 \u2192 \u043D\u0435 \u0441\u0442\u0440\u0435\u043B\u044F\u044E, \u0436\u0434\u0443 base-complete convId=" + cid + " pct=" + autoExportLastPct + " pendingCursor=" + (!!d.pendingCursor ? "1" : "0") + " baseComplete=" + (baseComplete === true ? "1" : "0") + " fullServer=" + (__fullServer95 === true ? "1" : "0"));
            } else {
              debugLog("log", "[AI CM][auto-export] re-check \u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u043E\u043F\u0430 \u043B\u043E\u0430\u0434\u0435\u0440\u0430 convId=" + cid + " pct=" + autoExportLastPct);
              maybeAutoExport(autoExportLastPct);
            }
          }
          try {
            if (cid && cid === d.convId && autoExportSettings.enabled === true && baseComplete === true && !aiCmCursorLiveByConv[cid] && !(function() {
              var siteBc = currentAdapter && currentAdapter.siteName || "";
              var Pbc = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
              return Pbc.getAutoExportFired(autoExportFired, siteBc, cid) || (typeof Pbc.isFiredInSession === "function" ? Pbc.isFiredInSession(sessionFiredCache, siteBc, cid) : false) || typeof aiCmAutoExportFiredOnce === "object" && aiCmAutoExportFiredOnce && aiCmAutoExportFiredOnce[siteBc + "|" + cid] === 1;
            })() && (baseCount || 0) > 0) {
              var pctBc64 = typeof autoExportLastPct === "number" && autoExportLastPct >= 0 ? autoExportLastPct : 0;
              var thrBc64 = aiCmEffectiveAutoExportThreshold(typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "");
              var Pbc64 = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
              var gateBc64 = Pbc64 && typeof Pbc64.shouldSkipBaseCompleteTrigger === "function" ? Pbc64.shouldSkipBaseCompleteTrigger({ percentage: pctBc64, threshold: thrBc64 }) : { skip: pctBc64 < thrBc64, reason: "below-threshold-base-complete", threshold: thrBc64 };
              if (gateBc64.skip) {
                debugLog("log", "[AI CM][auto-export] skip reason=" + gateBc64.reason + " convId=" + cid + " pct=" + pctBc64 + " threshold=" + gateBc64.threshold + " trigger=base-complete");
              } else {
                debugLog("log", "[AI CM][auto-export] base-complete trigger convId=" + cid + " msgs=" + baseCount + " pendingCursor=0 baseComplete=1 pct=" + pctBc64);
                doAutoExportDownload(cid, pctBc64, "base-complete");
              }
            }
          } catch (eBc64) {
            debugLog("error", "[AI CM][auto-export] base-complete trigger error:", eBc64);
          }
        } catch (e) {
          debugLog("error", "[AI CM][auto-export] loader-state error:", e);
        }
      });
      (function() {
        var Api = {};
        Api.sanitizeGeminiText = sanitizeGeminiText;
        Api.aiCmCollectExportSource = aiCmCollectExportSource;
        Api.aiCmExportBaseSource = aiCmExportBaseSource;
        Api.aiCmGetSourceTier = aiCmGetSourceTier;
        Api.aiCmUnionFileMessages = aiCmUnionFileMessages;
        Api.autoExportPerSiteKey = autoExportPerSiteKey;
        Api.loadAutoExportPerSitePct = loadAutoExportPerSitePct;
        Api.sessionFiredCache = sessionFiredCache;
        Api.aiCmTryLateAutoExport = aiCmTryLateAutoExport;
        Api.aiCmScheduleLateAutoExportRetry = aiCmScheduleLateAutoExportRetry;
        Api.aiCmLateRetryByConv = aiCmLateRetryByConv;
        Api.aiCmCurrentBaseSnapshot = aiCmCurrentBaseSnapshot;
        Api.detectTrimStateFallback = detectTrimStateFallback;
        Api.geminiDetectTrim = geminiDetectTrim;
        Api.maybeTrimExport = maybeTrimExport;
        Api.aiCmCancelDeferredHistWrite = aiCmCancelDeferredHistWrite;
        Api.aiCmWriteCurrentHistory = aiCmWriteCurrentHistory;
        Api.aiCmFlushDeferredHistWrite = aiCmFlushDeferredHistWrite;
        Api.aiCmScheduleDeferredHistWrite = aiCmScheduleDeferredHistWrite;
        Api.loadAutoExportSettings = loadAutoExportSettings;
        Api.aiCmAutoExportConvId = aiCmAutoExportConvId;
        Api.aiCmGsaProbeByThread = aiCmGsaProbeByThread;
        Api.aiCmGsaProbeRunning = aiCmGsaProbeRunning;
        Api.aiCmGsaProbeRunningFor = aiCmGsaProbeRunningFor;
        Api.aiCmGsaAutoExportSkipLog = aiCmGsaAutoExportSkipLog;
        Api.maybeAutoExport = maybeAutoExport;
        Api.aiCmEffectiveAutoExportThreshold = aiCmEffectiveAutoExportThreshold;
        Api.doAutoExportDownload = doAutoExportDownload;
        Api.aiCmDeepseekStreamProbe = aiCmDeepseekStreamProbe;
        Api.aiCmDeepseekStreamActiveFor = aiCmDeepseekStreamActiveFor;
        Api.aiCmFlushLiveStreamForExport = aiCmFlushLiveStreamForExport;
        Api.aiCmDeferAutoExportOnLiveStream = aiCmDeferAutoExportOnLiveStream;
        Api.AI_CM_DS_STREAM_DEFER_MS = AI_CM_DS_STREAM_DEFER_MS;
        if (typeof module !== "undefined" && module.exports) module.exports = Api;
        if (typeof window !== "undefined") window.AiCmExportManager = Api;
      })();
      (function() {
        let v = "unknown";
        try {
          v = chrome.runtime.getManifest().version;
        } catch (e) {
          v = "unknown";
        }
        console.log("AI Context Monitor v" + v + " \u2014 \u0438\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 (ChatGPT, Gemini, DeepSeek, Claude, Perplexity, Google Search AI)");
      })();
      function isExtensionValid() {
        try {
          return !!chrome.runtime?.id;
        } catch (e) {
          return false;
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
      var STORAGE_PREFIX = "ai-cm-gemini-tape-";
      var STORAGE_INDEX_PREFIX = "ai-cm-gemini-index-";
      var MAX_DIALOGUES = 50;
      var MAX_AGE_MS = 30 * 24 * 60 * 60 * 1e3;
      function geminiParserVersion() {
        try {
          if (typeof window !== "undefined" && window.GeminiBatchexecuteParser && window.GeminiBatchexecuteParser.PARSER_VERSION) {
            return window.GeminiBatchexecuteParser.PARSER_VERSION;
          }
        } catch (e) {
        }
        return "";
      }
      function getAccountIndex() {
        try {
          var m = location.pathname.match(/\/u\/(\d+)\//);
          return m ? m[1] : "0";
        } catch (e) {
          return "0";
        }
      }
      function geminiTapeKey(convId) {
        return STORAGE_PREFIX + geminiParserVersion() + "-u" + getAccountIndex() + "-" + convId;
      }
      var GeminiTapeStore = {
        load: function(convId) {
          if (!isExtensionValid() || !convId) return Promise.resolve(null);
          return new Promise(function(resolve) {
            var key = geminiTapeKey(convId);
            chrome.storage.local.get([key], function(data) {
              var entry = data[key];
              if (!entry) {
                resolve(null);
                return;
              }
              entry.meta = entry.meta || {};
              entry.meta.ts = Date.now();
              var kv = {};
              kv[key] = entry;
              chrome.storage.local.set(kv);
              resolve(entry);
            });
          });
        },
        save: function(convId, turns, meta) {
          if (!isExtensionValid() || !convId || !turns || !turns.length) return Promise.resolve();
          var self = this;
          meta = meta || {};
          meta.ts = Date.now();
          meta.version = geminiParserVersion();
          meta.orderVersion = 2;
          return new Promise(function(resolve) {
            self.load(convId).then(function(entry) {
              var existing = entry && entry.turns || [];
              var unionTurns = turns;
              var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
              if (P && typeof P.unionTurnsById === "function") {
                var u = P.unionTurnsById(existing, turns);
                if (u.length > turns.length) unionTurns = u;
              } else if (existing.length > turns.length) {
                unionTurns = existing;
              }
              debugLog("log", "[AI CM][tape-save] convId=" + convId + " action=written msgs=" + unionTurns.length + (unionTurns.length > turns.length ? " (union \u0441 \u043F\u0440\u0435\u0436\u043D\u0438\u043C \u0442\u0435\u0439\u043F\u043E\u043C " + existing.length + ")" : ""));
              var record = { turns: unionTurns, meta };
              var kv = {};
              kv[geminiTapeKey(convId)] = record;
              chrome.storage.local.set(kv, function() {
                GeminiTapeStore._touchIndex(convId).then(resolve);
              });
            });
          });
        },
        remove: function(convId) {
          if (!isExtensionValid() || !convId) return Promise.resolve();
          return new Promise(function(resolve) {
            chrome.storage.local.remove([geminiTapeKey(convId), STORAGE_INDEX_PREFIX + convId], function() {
              resolve();
            });
          });
        },
        cleanup: function() {
          if (!isExtensionValid()) return Promise.resolve();
          return new Promise(function(resolve) {
            chrome.storage.local.get(null, function(all) {
              var now = Date.now();
              var entries = [];
              for (var k in all) {
                if (k.indexOf(STORAGE_PREFIX) !== 0) continue;
                var convId = k.slice(STORAGE_PREFIX.length);
                var entry = all[k];
                var ts = entry && entry.meta && entry.meta.ts ? entry.meta.ts : 0;
                entries.push({ convId, ts });
              }
              entries.sort(function(a, b) {
                return b.ts - a.ts;
              });
              var toRemove = [];
              for (var i = 0; i < entries.length; i++) {
                if (now - entries[i].ts > MAX_AGE_MS || i >= MAX_DIALOGUES) {
                  toRemove.push(STORAGE_PREFIX + entries[i].convId);
                  toRemove.push(STORAGE_INDEX_PREFIX + entries[i].convId);
                }
              }
              if (toRemove.length > 0) {
                chrome.storage.local.remove(toRemove, function() {
                  resolve();
                });
              } else {
                resolve();
              }
            });
          });
        },
        // вспомогательное: метка времени в индексе
        _touchIndex: function(convId) {
          return new Promise(function(resolve) {
            var kv = {};
            kv[STORAGE_INDEX_PREFIX + convId] = { ts: Date.now() };
            chrome.storage.local.set(kv, function() {
              resolve();
            });
          });
        }
      };
      function aiCmSwByokHasKey() {
        return aiCmSwAsk({ type: "aiCm-get-byok-key" }).then(function(resp) {
          return !!(resp && resp.hasKey);
        }).catch(function() {
          return false;
        });
      }
      function aiCmByokFlag(hasKey) {
        return hasKey ? "1" : "";
      }
      var aiCmLastSeenConvId = getCurrentConvId() || "";
      var aiCmQwenSpaResetAt = 0;
      window.addEventListener("ai-cm-conversation-changed", function() {
        try {
          var newCid = getCurrentConvId() || "";
          try {
            if (typeof aiCmDiagLine === "function") {
              aiCmDiagLine("o22-conv-changed", {
                ts: Date.now(),
                convId: newCid || "(none)",
                prev: aiCmLastSeenConvId || "(none)",
                changed: newCid !== aiCmLastSeenConvId ? 1 : 0,
                lastHistKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0,
                verdict: "reset-unconditional"
              });
            }
          } catch (eO22a) {
          }
          try {
            if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
              aiCmDiagLine("qwen-spa", {
                ts: Date.now(),
                event: "conv-changed-recv",
                convId: newCid || "(none)",
                prev: aiCmLastSeenConvId || "(none)",
                changed: newCid !== aiCmLastSeenConvId ? 1 : 0,
                url: String(typeof location !== "undefined" && location && location.href || "")
              });
            }
          } catch (eQspa) {
          }
          if (newCid !== aiCmLastSeenConvId) {
            debugLog("log", "[AI CM][spa] conv-changed old=" + (aiCmLastSeenConvId || "(none)") + " new=" + (newCid || "(none)") + " (content)");
            try {
              aiCmCancelDeferredHistWrite("");
            } catch (eDw) {
            }
            try {
              chrome.runtime.sendMessage({ type: "BADGE_RESET" }).catch(function() {
              });
            } catch (eBr) {
            }
            aiCmLastSeenConvId = newCid;
          }
        } catch (eSpa) {
          swallowSoft(eSpa, "content:conversation-changed-outer");
        }
        aiCmGsaDiagState("conv-changed", "reset", "conversation-id-change", {
          convId: String(getCurrentConvId() || ""),
          lastSeenConvId: String(aiCmLastSeenConvId || "")
        });
        resetConversationState();
        aiCmAdapterBaseCount = 0;
        try {
          if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
            aiCmQwenSpaResetAt = Date.now();
            aiCmDiagLine("qwen-spa", {
              ts: aiCmQwenSpaResetAt,
              event: "reset-done",
              reason: "conversation-id-change",
              convId: String(getCurrentConvId() || "") || "(none)",
              url: String(typeof location !== "undefined" && location && location.href || ""),
              baseSeen: baseSeen === true ? 1 : 0,
              baseCount: typeof baseCount === "number" ? baseCount : 0
            });
          }
        } catch (eQspaR) {
        }
        try {
          if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
            aiCmDiagLine("qwen-spa", {
              ts: Date.now(),
              event: "reshoot",
              convId: String(getCurrentConvId() || "") || "(none)",
              initialized: isInitialized === true ? 1 : 0,
              url: String(typeof location !== "undefined" && location && location.href || "")
            });
          }
        } catch (eQspaSh) {
        }
        aiCmQwenSpaReshoot();
      });
      function aiCmResetStaleStateOnChatlessChatGptUrl() {
        try {
          if (!currentAdapter || currentAdapter.siteName !== "chatgpt") return false;
          if (getCurrentConvId()) return false;
          resetConversationState();
          try {
            chrome.runtime.sendMessage({ type: "BADGE_RESET" }).catch(function() {
            });
          } catch (eBr) {
          }
          debugLog("log", "[AI CM][spa] O-34: URL \u0431\u0435\u0437 /c/<id> \u2014 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0432\u0438\u0434\u0436\u0435\u0442\u0430 \u0438 \u0431\u0435\u0439\u0434\u0436 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B");
          return true;
        } catch (eChatless) {
          return false;
        }
      }
      window.addEventListener("ai-cm-loader-freeze", function(ev) {
        try {
          aiCmLoaderFreeze = !!(ev.detail && ev.detail.on);
          if (!aiCmLoaderFreeze && lastWidgetData) {
            const d = lastWidgetData;
            updateWidget(d.percentage, d.tokenEstimate, d.effectiveLimit, d.contextLimit, d.displayLimit, d.modelName, d.attachBreak);
            debugLog("log", "[content-trace] badge-unfreeze: \u0432\u0438\u0434\u0436\u0435\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D pct=" + d.percentage);
          }
        } catch (e) {
          swallowSoft(e, "content:loader-freeze");
        }
      });
      window.addEventListener("ai-cm-dom-emit-request", function() {
        try {
          if (!currentAdapter) return;
          if (document.hidden || document.visibilityState !== "visible") return;
          if (!baseSeen || !baseText) return;
          if (aiCmLoaderFreeze) return;
          var probe = getEffectiveText();
          if (!(baseComplete || lastBounded)) {
            debugLog("log", "[AI CM][realtime] dom-emit skip: \u0445\u0432\u043E\u0441\u0442 \u0431\u0435\u0437 \u0433\u0440\u0430\u043D\u0438\u0446\u044B (unbounded) \u0438 \u0431\u0430\u0437\u0430 \u043D\u0435\u043F\u043E\u043B\u043D\u0430\u044F");
            return;
          }
          var sig = aiCmDomRealTextLen() + "|" + (probe ? probe.length : 0);
          if (sig === aiCmLastDomEmitSig) return;
          aiCmLastDomEmitSig = sig;
          processAndSend();
          debugLog("log", "[AI CM][realtime] dom-emit pct=" + lastPercentage + " tokens=" + maxTokenCount);
        } catch (eDe) {
          swallowSoft(eDe, "content:dom-emit-request");
        }
      });
      function aiCmDomThreadId() {
        try {
          var el = document.querySelector("[data-session-thread-id]");
          if (!el) return "";
          var v = el.getAttribute("data-session-thread-id");
          return v ? String(v).trim() : "";
        } catch (e) {
          return "";
        }
      }
      function aiCmSnapshotIsCurrentThread(emitThreadId, domThreadId) {
        if (!emitThreadId) return true;
        if (!domThreadId) return true;
        return String(emitThreadId) === String(domThreadId);
      }
      function aiCmGsaChatPageMarker() {
        try {
          if (typeof aiCmDomThreadId === "function" && aiCmDomThreadId()) return true;
          if (document.querySelector('[data-scope-id="turn"]')) return true;
          if (document.querySelector('[data-subtree="aimfl"]')) return true;
        } catch (e) {
          swallowSoft(e, "content:aiCmGsaChatPageMarker");
        }
        return false;
      }
      var aiCmGsaDiagNoResetLogged = {};
      function aiCmGsaDiagState(point, verdict, reason, extra) {
        try {
          var doc = typeof aiCmDiagDocKind === "function" ? aiCmDiagDocKind() : "unknown";
          if (verdict === "no-reset") {
            var key = String(point) + "|" + String(reason) + "|" + String(doc);
            if (aiCmGsaDiagNoResetLogged[key] === 1) return false;
            aiCmGsaDiagNoResetLogged[key] = 1;
          }
          var f = {
            point,
            verdict,
            reason,
            doc,
            site: typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "",
            baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
            baseComplete: typeof baseComplete !== "undefined" && baseComplete === true ? 1 : 0,
            baseCount: typeof baseCount === "number" ? baseCount : 0,
            threadId: typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() : ""
          };
          if (extra) {
            for (var k in extra) {
              if (Object.prototype.hasOwnProperty.call(extra, k)) f[k] = extra[k];
            }
          }
          if (typeof aiCmDiagLine === "function") aiCmDiagLine("gsa-state", f);
          return true;
        } catch (eDiagState) {
          return false;
        }
      }
      function aiCmGsaResetStaleStateOnChatlessDoc() {
        try {
          if (!currentAdapter || currentAdapter.siteName !== "google_search") return false;
          if (typeof document === "undefined" || document.readyState !== "complete") {
            aiCmGsaDiagState("reset-stale", "no-reset", "doc-not-complete");
            return false;
          }
          if (aiCmGsaChatPageMarker()) {
            aiCmGsaDiagState("reset-stale", "no-reset", "chat-page");
            return false;
          }
          var hasState = baseSeen === true || baseComplete === true || baseCount > 0;
          if (!hasState) {
            aiCmGsaDiagState("reset-stale", "no-reset", "no-stale-state");
            return false;
          }
          resetConversationState();
          aiCmGsaDiagState("reset-stale", "reset", "chatless-doc (captcha/search)");
          debugLog("log", "[AI CM][auto-export] site=google_search O-27: \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0431\u0435\u0437 \u0447\u0430\u0442\u0430 \u2014 \u0431\u0430\u0437\u0430/pct \u043F\u0440\u043E\u0448\u043B\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B");
          return true;
        } catch (e) {
          return false;
        }
      }
      function aiCmEstimateTokensTilde(text, attachTokens) {
        var t = typeof text === "string" ? text : "";
        var attach = typeof attachTokens === "number" && attachTokens > 0 ? attachTokens : 0;
        var TK = typeof Tokenizer !== "undefined" ? Tokenizer : null;
        var result;
        var tkOk = false;
        if (TK && typeof TK.countTokens === "function") {
          try {
            result = TK.countTokens(t) + attach;
            tkOk = true;
          } catch (eTk) {
            swallowSoft(eTk, "content:aiCmEstimateTokensTilde");
          }
        }
        if (!tkOk) {
          var cyr = (t.match(/[а-яёА-ЯЁ]/g) || []).length;
          result = Math.ceil(cyr / 3.3) + Math.round((t.length - cyr) / 4) + attach;
        }
        if (typeof aiCmDiagOn === "function" && aiCmDiagOn()) {
          try {
            var cyrDiag = (t.match(/[а-яёА-ЯЁ]/g) || []).length;
            var cyrillicPct = t.length ? (cyrDiag / t.length * 100).toFixed(1) : "0.0";
            aiCmDiagLine("o23-cyrillic-share", {
              textLen: t.length,
              cyrillicPct,
              attachTokens: attach,
              tokensTilde: result
            });
          } catch (eO23) {
          }
        }
        return result;
      }
      window.addEventListener("ai-cm-model-slug", function(ev) {
        var md = ev && ev.detail;
        if (md && typeof md.slug === "string" && md.slug) detectedModelSlug = md.slug;
      });
      window.addEventListener("ai-cm-full-history", function(ev) {
        try {
          if (typeof aiCmDiagLine === "function") {
            aiCmDiagLine("o22-listener-entry", { ts: Date.now() });
          }
        } catch (eO22L1) {
        }
        try {
          if (!window.__aiCmEmitChannelSeen) {
            window.__aiCmEmitChannelSeen = true;
            var P1 = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
            debugLog("log", "[AI CM][svc-emit-trace] site=" + (currentAdapter && currentAdapter.siteName || "?") + " emit-channel=received convId=" + (P1 && P1.extractConvIdFromUrl(location.pathname) || ""));
          }
        } catch (eEmit1) {
        }
        try {
          if (typeof aiCmDiagLine === "function") {
            aiCmDiagLine("o22-svc-emit", {
              ts: Date.now(),
              convId: ev && ev.detail && ev.detail.convId || (typeof getCurrentConvId === "function" ? getCurrentConvId() || "" : "") || "(none)",
              histKey: (typeof baseCount === "number" ? baseCount : 0) + "|" + (typeof baseText === "string" && baseText ? baseText.length : 0),
              msgs: ev && ev.detail && ev.detail.count || 0,
              textLen: ev && ev.detail && typeof ev.detail.text === "string" ? ev.detail.text.length : 0,
              lastHistKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0,
              src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : ""
            });
          }
        } catch (eO22b) {
        }
        const detail = ev && ev.detail;
        if (!detail || !detail.text) return;
        if (typeof aiCmSnapshotIsCurrentThread === "function") {
          var domTid31 = typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() : "";
          if (!aiCmSnapshotIsCurrentThread(detail.threadId, domTid31)) {
            debugLog("log", "[content] O-31: \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u0430 \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D (emit=" + detail.threadId + ", dom=" + domTid31 + ", msgs=" + (detail.count || 0) + ")");
            return;
          }
        }
        var tokenTilde = typeof aiCmEstimateTokensTilde === "function" ? aiCmEstimateTokensTilde(detail.text, detail.attachTokens) : Math.round((detail.text || "").length / 4) + (detail.attachTokens || 0);
        debugLog("log", "[AI CM][trace] badge-recv convId=" + (detail.convId || "-") + " msgs=" + (detail.count || 0) + " tokens~" + tokenTilde);
        try {
          if (typeof aiCmDiagLine === "function") {
            aiCmDiagLine("o22-badge-recv", {
              ts: Date.now(),
              convId: detail.convId || "(none)",
              msgs: detail.count || 0,
              lastHistKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0
            });
          }
        } catch (eO22c) {
        }
        var emitConvId = detail.convId || "";
        if (emitConvId && getCurrentConvId() && emitConvId !== getCurrentConvId() && !(detail.count > 0)) {
          debugLog("log", "[content] v38: \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u041F\u0423\u0421\u0422\u041E\u0419 \u0441\u043D\u0438\u043C\u043E\u043A \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (emit=" + emitConvId + ", current=" + getCurrentConvId() + ")");
          return;
        }
        lastEmitConvId = emitConvId;
        badgeSuppressed = false;
        if (emitConvId && emitConvId !== lastSnapConvId) {
          maxTokenCount = 0;
          lastSnapConvId = emitConvId;
          debugLog("log", "[content-trace] v37: \u043D\u043E\u0432\u044B\u0439 convId \u0441\u043D\u0438\u043C\u043A\u0430 \u2192 maxTokenCount=0 (" + emitConvId.slice(0, 8) + ")");
        }
        if (detail.threadId) {
          if (lastThreadId !== null && detail.threadId !== lastThreadId) {
            aiCmGsaDiagState("emit-thread-switch", "reset", "thread-id-change", { from: String(lastThreadId), to: String(detail.threadId) });
            resetConversationState();
          }
          lastThreadId = detail.threadId;
        }
        const newBaseComplete = !!detail.historyComplete;
        var completeTransition79 = newBaseComplete && !baseComplete;
        if (newBaseComplete && !baseComplete) {
          maxTokenCount = 0;
        }
        baseComplete = newBaseComplete;
        if (newBaseComplete && typeof aiCmGsaNetworkCompleteSet === "function") {
          aiCmGsaNetworkCompleteSet(detail.threadId || "");
        }
        if (emitConvId) {
          aiCmBaseConfirmedByConv[emitConvId] = newBaseComplete && detail.reachedStart === true ? 1 : 0;
          try {
            aiCmLowConfidenceByConv[emitConvId] = detail.isLowConfidenceBase === true;
          } catch (eLc63) {
          }
        }
        baseText = detail.text;
        baseCount = detail.count || 0;
        if (typeof detail.count === "number") aiCmNetRawCount = detail.count;
        detectedModelSlug = detail.modelSlug || "";
        netAttachTokens = detail.attachTokens || 0;
        netAttachBreak = detail.attachBreak || null;
        netServerTokens = detail.serverTokens || 0;
        netQwenUsage = detail.qwenUsage && typeof detail.qwenUsage === "object" ? detail.qwenUsage : null;
        netEffectiveLen = typeof detail.effectiveLen === "number" && detail.effectiveLen > 0 ? detail.effectiveLen : 0;
        baseSeen = true;
        stale = false;
        var texts = Array.isArray(detail.messageTexts) ? detail.messageTexts : [];
        var ids = Array.isArray(detail.messageIds) ? detail.messageIds : [];
        lastBaseIds = ids;
        lastBaseTexts = texts;
        try {
          if ((currentAdapter && currentAdapter.siteName) === "google_search" && typeof aiCmDiagLine === "function") {
            aiCmDiagLine("gsa-base-accept", {
              point: "content-emit",
              verdict: texts.length > 0 ? "accept" : "accept-empty",
              msgs: texts.length,
              textLen: typeof detail.text === "string" ? detail.text.length : 0,
              historyComplete: detail.historyComplete === true ? 1 : 0,
              threadId: detail.threadId || "",
              convId: emitConvId || "",
              head: typeof aiCmDiagHead === "function" ? aiCmDiagHead(detail.text, 100) : ""
            });
          }
        } catch (eDiagAccept) {
        }
        if (texts.length > 0) {
          var rawMsgs18 = Array.isArray(detail.messages) && detail.messages.length === texts.length ? detail.messages : null;
          var preDedupe18 = [];
          for (var d18 = 0; d18 < texts.length; d18++) {
            var r18 = rawMsgs18 ? rawMsgs18[d18] && rawMsgs18[d18].role || "" : d18 % 2 === 0 ? "user" : "assistant";
            preDedupe18.push({
              // FIX (Claude md): ход пользователя парсера Claude приходит в снимок ролью 'human'
              // (core/claude-intercept.js:parseHistory) — нормализуем её в 'user' ЗДЕСЬ, на записи
              // сетевой базы: иначе 'human' умирал бы в 'assistant' ДО точек collect/dedupe
              // (core/base-handler.js:54, core/export-manager.js:178 — те уже знают 'human', но
              // получали готовый 'assistant') и все ходы Claude шли под '## Ассистент'.
              role: r18 === "user" || r18 === "human" ? "user" : "assistant",
              text: sanitizeGeminiText(texts[d18]),
              id: rawMsgs18 && rawMsgs18[d18] && rawMsgs18[d18].id != null ? String(rawMsgs18[d18].id) : String(ids[d18])
            });
          }
          var ded18 = aiCmDedupeExportSource(preDedupe18);
          var prepared18 = Array.isArray(ded18.messages) ? ded18.messages : [];
          aiCmBasePrepared = prepared18;
          var texts18 = [];
          var ids18 = [];
          var msgs18 = [];
          for (var e18 = 0; e18 < prepared18.length; e18++) {
            var me18 = prepared18[e18] || {};
            var mid18 = me18.id != null ? String(me18.id) : preDedupe18[e18] && preDedupe18[e18].id != null ? String(preDedupe18[e18].id) : "";
            texts18.push(String(me18.text == null ? "" : me18.text));
            ids18.push(mid18);
            msgs18.push({ role: me18.role, text: String(me18.text == null ? "" : me18.text), id: mid18 });
          }
          lastBaseTexts = texts18;
          lastBaseIds = ids18;
          lastDetailMessages = msgs18;
          baseCount = texts18.length;
          baseText = texts18.join("\n");
          if (ded18.removed > 0 && netEffectiveLen > baseText.length) netEffectiveLen = baseText.length;
          aiCmLogDedupeRemoved(ded18.removed);
        } else {
          aiCmBasePrepared = null;
          lastDetailMessages = Array.isArray(detail.messages) ? detail.messages : null;
        }
        baseIdSet = /* @__PURE__ */ new Set();
        for (var i = 0; i < lastBaseIds.length; i++) {
          var s = String(lastBaseIds[i]).trim();
          if (s) baseIdSet.add(s);
        }
        baseSkelSet = /* @__PURE__ */ new Set();
        baseAnchors = [];
        for (var t = 0; t < lastBaseTexts.length; t++) {
          var sk = normalize(stripMd(lastBaseTexts[t]));
          if (sk) {
            baseSkelSet.add(sk);
            if (sk.length >= ANCHOR_MIN) baseAnchors.push(sk);
          }
        }
        lastTailSig = null;
        var baseSig = [baseCount, baseText ? baseText.length : 0, baseComplete ? 1 : 0, netEffectiveLen].join("|");
        if (baseSig !== lastBaseSig) {
          lastBaseSig = baseSig;
          console.log("\u{1F4E5} \u0431\u0430\u0437\u0430 \u043F\u043E\u043B\u043D\u043E\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0438: " + baseCount + " \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u043A\u044D\u0448 id=" + baseIdSet.size + ", \u0441\u043A\u0435\u043B\u0435\u0442\u043E\u0432=" + baseSkelSet.size + ", \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u044F\u043A\u043E\u0440\u0435\u0439=" + baseAnchors.length + (detectedModelSlug ? ", slug \u0438\u0437 \u0441\u0435\u0442\u0438=" + detectedModelSlug : "") + (netAttachTokens > 0 ? ", \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u2248" + netAttachTokens + " \u0442\u043E\u043A" : "") + (netServerTokens > 0 ? ", serverTokens=" + netServerTokens : "") + (baseComplete ? ", \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u041F\u041E\u041B\u041D\u0410\u042F \u043F\u043E \u0441\u0435\u0442\u0438 (\u0438\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u043F\u043E \u0431\u0430\u0437\u0435, DOM \u0438\u0433\u043D\u043E\u0440)" : ""));
        }
        if (baseSig !== lastEmitSig) {
          lastEmitSig = baseSig;
          debugLog("log", "[content-trace] EMIT \u043F\u0440\u0438\u043D\u044F\u0442 seq=" + (window.__aiCmTraceSeq || 0) + " baseComplete=" + baseComplete + " baseCount=" + baseCount + " textLen=" + (baseText ? baseText.length : 0) + " t=" + Date.now());
        }
        try {
          geminiDetectTrim(detail);
        } catch (eTrim) {
          swallowSoft(eTrim, "content:full-history-trim");
        }
        if (!isInitialized) {
          tryInit();
          setTimeout(function() {
            if (!isInitialized) tryInit();
          }, 500);
          setTimeout(function() {
            if (!isInitialized) tryInit();
          }, 1500);
        }
        if (restoreDone && baseComplete) {
          var convId = detail.convId || "";
          var msgs = Array.isArray(detail.messages) ? detail.messages : [];
          if (convId && msgs.length > 0) {
            var turns = [];
            for (var x = 0; x < msgs.length; x++) {
              var mm = msgs[x] || {};
              turns.push({
                id: mm.id != null ? String(mm.id) : "",
                text: mm.text || "",
                role: mm.role === "user" ? "user" : "assistant",
                r1: mm.r1 || null,
                turnId: mm.turnId || null
              });
            }
            debugLog("log", "[AI CM][tape-save] convId=" + convId + " action=written msgs=" + turns.length + " baseComplete=1");
            GeminiTapeStore.save(convId, turns, {
              count: detail.count || 0,
              effectiveLen: detail.effectiveLen || 0,
              modelSlug: detail.modelSlug || "",
              version: geminiParserVersion()
            });
          } else {
            debugLog("log", "[AI CM][tape-save] action=skipped reason=" + (!convId ? "no-convId" : "no-messages") + " baseComplete=1 msgs=" + (msgs ? msgs.length : 0));
          }
        }
        if (completeTransition79) {
          try {
            var cid79 = emitConvId || lastEmitConvId || getCurrentConvId() || "";
            if (cid79) {
              if (aiCmLateCheckByConv[cid79]) {
                aiCmTryLateAutoExport(cid79);
              } else if (autoExportSettings.enabled === true && typeof autoExportLastPct === "number" && autoExportLastPct >= 0) {
                debugLog("log", "[AI CM][auto-export] base-complete 0\u21921 check (\u043D\u0435 loader-stop) convId=" + cid79 + " pct=" + autoExportLastPct);
                maybeAutoExport(autoExportLastPct);
              }
              try {
                aiCmFlushDeferredHistWrite(cid79, "base-complete");
              } catch (eF79) {
                swallowSoft(eF79, "content:full-history-flush-deferred");
              }
              try {
                aiCmResyncMetricsAfterFlush(cid79, "base-complete");
              } catch (eRs79) {
                swallowSoft(eRs79, "content:metrics-resync-flush");
              }
            }
          } catch (e79) {
            swallowSoft(e79, "content:full-history-complete-transition");
          }
        }
        try {
          if (typeof aiCmDiagLine === "function") {
            aiCmDiagLine("o22-call725", {
              ts: Date.now(),
              src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(2) : ""
            });
          }
        } catch (eO22L2) {
        }
        processAndSend();
      });
      var AI_CM_H23_SITES = ["claude"];
      var aiCmContentReadySent = false;
      var aiCmRequestEmitTimer = null;
      function aiCmH23Site() {
        try {
          return !!currentAdapter && AI_CM_H23_SITES.indexOf(currentAdapter.siteName) !== -1;
        } catch (e) {
          return false;
        }
      }
      function aiCmDispatchContentReady() {
        if (aiCmContentReadySent) return;
        if (!aiCmH23Site()) return;
        if (window.__aiCmEmitChannelSeen) {
          debugLog("log", "[AI CM][emit-channel] content-ready \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u2014 emit \u0443\u0436\u0435 \u0434\u043E\u0448\u0451\u043B site=" + (currentAdapter && currentAdapter.siteName || "?"));
          return;
        }
        aiCmContentReadySent = true;
        try {
          window.dispatchEvent(new CustomEvent("ai-cm-content-ready"));
        } catch (eCr) {
        }
        debugLog("log", "[AI CM][emit-channel] content-ready site=" + (currentAdapter && currentAdapter.siteName || "?"));
        try {
          var siteCr = currentAdapter && currentAdapter.siteName || "";
          if (aiCmRequestEmitTimer) clearTimeout(aiCmRequestEmitTimer);
          aiCmRequestEmitTimer = setTimeout(function() {
            aiCmRequestEmitTimer = null;
            if (window.__aiCmEmitChannelSeen) return;
            try {
              window.dispatchEvent(new CustomEvent("ai-cm-request-emit"));
            } catch (eRe) {
            }
            debugLog("log", "[AI CM][emit-channel] request-emit (3\u0441 \u0431\u0435\u0437 badge-recv) site=" + siteCr);
          }, 3e3);
        } catch (eCr2) {
        }
      }
      function getCurrentConvId() {
        try {
          var P = typeof window !== "undefined" && window.AiCmExportEmitPipeline ? window.AiCmExportEmitPipeline : null;
          if (P && typeof P.extractConvIdFromUrl === "function") return P.extractConvIdFromUrl(location.pathname) || "";
          var m = location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);
          if (m) return m[1];
          var parts = location.pathname.split("/");
          var chatIdx = parts.indexOf("chat");
          if (chatIdx !== -1 && chatIdx + 1 < parts.length) return parts[chatIdx + 1];
          return "";
        } catch (e) {
          return "";
        }
      }
      function aiCmAssignAdapterByHost() {
        const hostname = window.location.hostname;
        if (hostname.includes("chatgpt.com")) {
          currentAdapter = new ChatGPTAdapter();
        } else if (hostname.includes("aistudio.google.com")) {
          currentAdapter = new AistudioAdapter();
        } else if (hostname.includes("gemini.google.com")) {
          currentAdapter = new GeminiAdapter();
        } else if (hostname.includes("chat.deepseek.com")) {
          currentAdapter = new DeepSeekAdapter();
        } else if (hostname.includes("google.com") && !hostname.includes("aistudio")) {
          currentAdapter = new GoogleSearchAdapter();
        } else if (hostname.includes("claude.ai")) {
          currentAdapter = new ClaudeAdapter();
        } else if (hostname.includes("perplexity.ai")) {
          currentAdapter = new PerplexityAdapter();
        } else if (hostname.includes("chat.qwen.ai")) {
          currentAdapter = new QwenAdapter();
        }
        return currentAdapter;
      }
      function aiCmQwenInitErrText(e) {
        try {
          return String(e && e.name ? e.name + ": " + (e.message || "") : e);
        } catch (eQiErr) {
          return "(read-error)";
        }
      }
      function aiCmQwenInitDiag(event, fields) {
        try {
          if (typeof aiCmDiagLine !== "function") return false;
          if (typeof currentAdapter === "undefined" || !currentAdapter) return false;
          if (currentAdapter.siteName !== "qwen") return false;
          var f = {
            ts: Date.now(),
            event,
            initialized: typeof isInitialized !== "undefined" && isInitialized === true ? 1 : 0
          };
          if (fields) {
            for (var k in fields) {
              if (Object.prototype.hasOwnProperty.call(fields, k)) f[k] = fields[k];
            }
          }
          return aiCmDiagLine("qwen-init", f);
        } catch (eQid) {
          return false;
        }
      }
      function aiCmQwenSpaReshoot() {
        try {
          if (!currentAdapter || currentAdapter.siteName !== "qwen") {
            try {
              aiCmQwenInitDiag("reshoot-exit", { ret: 0, branch: "not-qwen" });
            } catch (eQi1) {
            }
            return false;
          }
          aiCmAssignAdapterByHost();
          if (!currentAdapter || currentAdapter.siteName !== "qwen") {
            try {
              aiCmQwenInitDiag("reshoot-exit", { ret: 0, branch: "not-qwen-after-detect" });
            } catch (eQi2) {
            }
            return false;
          }
          try {
            aiCmQwenInitDiag("reshoot-enter", { branch: isInitialized ? "awake" : "asleep", convId: typeof getCurrentConvId === "function" ? getCurrentConvId() || "(none)" : "(none)", url: String(typeof location !== "undefined" && location && location.href || ""), src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
          } catch (eQi3) {
          }
          if (!isInitialized) {
            tryInit();
            try {
              aiCmQwenInitDiag("reshoot-after-sync", { branch: isInitialized ? "awake" : "asleep" });
            } catch (eQi4) {
            }
            if (!isInitialized) {
              setTimeout(function() {
                if (!isInitialized) tryInit();
                try {
                  aiCmQwenInitDiag("reshoot-retry", { delay: 500 });
                } catch (eQi5) {
                }
              }, 500);
              setTimeout(function() {
                if (!isInitialized) tryInit();
                try {
                  aiCmQwenInitDiag("reshoot-retry", { delay: 1500 });
                } catch (eQi6) {
                }
              }, 1500);
              setTimeout(function() {
                if (!isInitialized) tryInit();
                try {
                  aiCmQwenInitDiag("reshoot-retry", { delay: 3e3 });
                } catch (eQi7) {
                }
              }, 3e3);
              setTimeout(function() {
                if (typeof aiCmQwenTerminalReshoot !== "function") return;
                aiCmQwenTerminalReshoot();
              }, 6e3);
            }
          } else {
            processAndSend();
            try {
              aiCmQwenInitDiag("reshoot-awake-send", {});
            } catch (eQi8) {
            }
          }
          try {
            aiCmQwenInitDiag("reshoot-exit", { ret: 1, branch: isInitialized ? "awake" : "asleep" });
          } catch (eQi9) {
          }
          return true;
        } catch (eQwenReshoot) {
          try {
            aiCmQwenInitDiag("reshoot-throw", { error: aiCmQwenInitErrText(eQwenReshoot) });
          } catch (eQi10) {
          }
          return false;
        }
      }
      function aiCmQwenTerminalReshoot() {
        if (isInitialized) return false;
        var termMsgs = -1;
        try {
          if (currentAdapter && typeof currentAdapter.extractMessages === "function") {
            termMsgs = currentAdapter.extractMessages().length;
          }
        } catch (eQiTm) {
          termMsgs = -2;
          try {
            aiCmQwenInitDiag("reshoot-terminal-throw", { error: aiCmQwenInitErrText(eQiTm) });
          } catch (eQiT1) {
          }
        }
        if (typeof aiCmAdapterBaseCount !== "undefined") {
          aiCmAdapterBaseCount = termMsgs > 0 ? termMsgs : 0;
        }
        try {
          aiCmQwenInitDiag("reshoot-terminal", { adapterMsgs: termMsgs, ready: typeof aiCmAdapterBaseSeen === "function" && aiCmAdapterBaseSeen() ? 1 : 0 });
        } catch (eQiT2) {
        }
        processAndSend();
        return true;
      }
      async function initialize() {
        try {
          aiCmAssignAdapterByHost();
          if (!currentAdapter) {
            try {
              aiCmQwenInitDiag("initialize-exit", { ret: 0, reason: "no-adapter" });
            } catch (eQi18) {
            }
            return;
          }
          try {
            aiCmQwenInitDiag("initialize-enter", { adapter: currentAdapter.siteName, url: String(typeof location !== "undefined" && location && location.href || "") });
          } catch (eQi19) {
          }
          debugLog("log", "\u0410\u0434\u0430\u043F\u0442\u0435\u0440:", currentAdapter.siteName);
          if (typeof aiCmResetStaleStateOnChatlessChatGptUrl === "function") {
            aiCmResetStaleStateOnChatlessChatGptUrl();
          }
          aiCmDispatchContentReady();
          loadAutoExportPerSitePct();
          loadByokSettings();
          if (typeof loadByokSettingsAsync === "function") {
            await loadByokSettingsAsync();
          }
          if (typeof aiCmLatchCacheReady === "function") {
            await aiCmLatchCacheReady();
          }
          loadByokCache();
          aiCmLoadPopupOverrides();
          if (isExtensionValid()) {
            chrome.storage.sync.get([safePctKey()], (d) => {
              const v = d[safePctKey()];
              safePct = typeof v === "number" && v > 0 ? v : null;
              updatePanel();
              if (isInitialized) processAndSend();
            });
          }
          if (isExtensionValid()) {
            chrome.storage.sync.get(["showWidget"], (data) => {
              if (data.showWidget !== false) {
                createWidget();
              }
            });
          } else {
            createWidget();
          }
          await tryInit();
          try {
            aiCmQwenInitDiag("initialize-after-tryinit", {});
          } catch (eQi20) {
          }
          if (!isInitialized) {
            [2e3, 4e3, 6e3].forEach((delay) => {
              setTimeout(async () => {
                if (!isInitialized) await tryInit();
              }, delay);
            });
            try {
              aiCmQwenInitDiag("initialize-ladder", { delays: "2000,4000,6000", scheduled: 3 });
            } catch (eQi21) {
            }
          }
          try {
            aiCmQwenInitDiag("initialize-exit", { ret: 1 });
          } catch (eQi22) {
          }
        } catch (eInitialize) {
          try {
            aiCmQwenInitDiag("initialize-throw", { error: aiCmQwenInitErrText(eInitialize), src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
          } catch (eQi23) {
          }
          throw eInitialize;
        }
      }
      async function tryInit() {
        try {
          if (isInitialized) {
            try {
              aiCmQwenInitDiag("tryinit-skip", { reason: "already-initialized" });
            } catch (eQi11) {
            }
            return;
          }
          let found = findMessageNodes();
          try {
            aiCmQwenInitDiag("tryinit-enter", { nodes: found.nodes.length, sel: found.sel, src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
          } catch (eQi12) {
          }
          var qiAdapterMsgs = -1;
          if (found.nodes.length === 0 && currentAdapter && typeof currentAdapter.extractMessages === "function") {
            try {
              const ams = currentAdapter.extractMessages();
              qiAdapterMsgs = ams && typeof ams.length === "number" ? ams.length : 0;
              if (ams && ams.length > 0) {
                found = { nodes: (
                  /** @type {Element[]} */
                  /** @type {unknown} */
                  ams
                ), sel: (currentAdapter.siteName || "adapter") + ".extractMessages()" };
              }
            } catch (e) {
              qiAdapterMsgs = -2;
              try {
                aiCmQwenInitDiag("tryinit-adapter-throw", { error: aiCmQwenInitErrText(e) });
              } catch (eQi13) {
              }
            }
          }
          if (found.nodes.length > 0) {
            debugLog("log", "\u0414\u0438\u0430\u043B\u043E\u0433 \u043D\u0430\u0439\u0434\u0435\u043D:", found.nodes.length, "\u0443\u0437\u043B\u043E\u0432 (" + found.sel + ")");
            try {
              aiCmQwenInitDiag("tryinit-nodes", { nodes: found.nodes.length, sel: found.sel, action: "set-initialized" });
            } catch (eQi14) {
            }
            isInitialized = true;
            processAndSend();
            startObserving();
            try {
              aiCmQwenInitDiag("tryinit-exit", { action: "initialized", nodes: found.nodes.length, sel: found.sel, observer: typeof observer !== "undefined" && observer ? 1 : 0 });
            } catch (eQi15) {
            }
          } else {
            try {
              aiCmQwenInitDiag("tryinit-exit", { action: "not-found", nodes: 0, adapterMsgs: qiAdapterMsgs });
            } catch (eQi16) {
            }
          }
        } catch (eTryInit) {
          try {
            aiCmQwenInitDiag("tryinit-throw", { error: aiCmQwenInitErrText(eTryInit), src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
          } catch (eQi17) {
          }
          throw eTryInit;
        }
      }
      var AI_CM_WIDGET_ELEMENT_ID = "ai-context-widget";
      function aiCmIsWidgetNode(node) {
        try {
          if (!node) return false;
          var el = node.nodeType === 1 ? node : node.parentElement;
          if (!el || typeof el.closest !== "function") return false;
          if (el.closest("#" + AI_CM_WIDGET_ELEMENT_ID)) return true;
          var w = document.getElementById(AI_CM_WIDGET_ELEMENT_ID);
          return !!(w && typeof w.contains === "function" && (w === el || w.contains(el)));
        } catch (eW) {
          return false;
        }
      }
      function aiCmDomRealTextLen() {
        try {
          var found = typeof findMessageNodes === "function" ? findMessageNodes() : null;
          var nodes = found && found.nodes ? found.nodes : [];
          var sum = 0;
          for (var i = 0; i < nodes.length; i++) {
            var el = (
              /** @type {HTMLElement} */
              nodes[i]
            );
            var raw = el.innerText || el.textContent || "";
            sum += String(raw).trim().length;
          }
          return sum;
        } catch (eDomLen) {
          return 0;
        }
      }
      function aiCmDomTextSig() {
        var eff = "";
        if (baseSeen && baseText) {
          try {
            eff = getEffectiveText() || "";
          } catch (eSig) {
            eff = "";
          }
        }
        return aiCmDomRealTextLen() + "|" + eff.length;
      }
      function aiCmSiteConvFired() {
        try {
          if (typeof aiCmAutoExportFiredOnce !== "object" || !aiCmAutoExportFiredOnce) return false;
          var cid = typeof getCurrentConvId === "function" ? getCurrentConvId() || "" : "";
          if (!cid) return false;
          var site = typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "";
          return aiCmAutoExportFiredOnce[site + "|" + cid] === 1;
        } catch (eFired) {
          return false;
        }
      }
      function startObserving() {
        if (observer) observer.disconnect();
        let mutationCount = 0;
        observer = new MutationObserver((mutations) => {
          const hasNewText = mutations.some((mutation) => {
            if (aiCmIsWidgetNode(mutation.target)) return false;
            if (mutation.type === "childList") {
              for (const node of mutation.addedNodes) {
                if (aiCmIsWidgetNode(node)) continue;
                if (node.nodeType === 1 && node.textContent?.trim()?.length > 10) return true;
              }
            }
            return mutation.type === "characterData";
          });
          if (hasNewText) {
            const sigConvId = typeof getCurrentConvId === "function" ? getCurrentConvId() || "" : "";
            if (aiCmLastDomEmitConvId !== sigConvId) {
              aiCmLastDomEmitConvId = sigConvId;
              aiCmLastDomEmitSig = null;
            }
            const sig = aiCmDomTextSig();
            if (sig === aiCmLastDomEmitSig && aiCmSiteConvFired()) {
              if (typeof aiCmDiagLine === "function") {
                aiCmDiagLine("o24-dom-emit-guard", {
                  verdict: "skip-sig-unchanged",
                  sig,
                  convId: sigConvId || "(none)",
                  ms: mutations.length,
                  t: Date.now()
                });
              }
              return;
            }
            aiCmLastDomEmitSig = sig;
            mutationCount++;
            clearTimeout(updateTimer);
            const delay = Math.min(800 + mutationCount * 300, 3e3);
            updateTimer = setTimeout(() => {
              mutationCount = 0;
              processAndSend();
            }, delay);
          }
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: false
        });
      }
      var GEMINI_UI_MODEL_RE = /(?:gemini\s*)?(\d+(?:[.,]\d+)?)?\s*(ultra|pro|flash)(?:\s+(?:lite|расширенн[аяый]|extended|fast))?/i;
      var geminiUiModelByFamily = {};
      var lastModelSourceSig = "";
      function extractUiModelText(text) {
        const t = String(text || "").replace(/\s+/g, " ").trim();
        if (!t || t.length > 60) return "";
        const m = t.match(GEMINI_UI_MODEL_RE);
        if (!m) return "";
        if (!m[1] && !/gemini/i.test(t)) return "";
        return m[0].trim();
      }
      function probeGeminiUiMenuChecked() {
        const items = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"], [role="option"]');
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          if (it.getAttribute("aria-checked") !== "true" && !it.querySelector('[aria-checked="true"]')) continue;
          const name = extractUiModelText(it.textContent);
          if (name) return name;
        }
        return "";
      }
      function normalizeUiModelText(text) {
        return String(text || "").replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, "$1 $2").replace(/\s+/g, " ").trim();
      }
      function resolveFamilyVariantId(fam, variant, snapModelId) {
        const cached = geminiUiModelByFamily[fam];
        if (cached) {
          const cachedId = ModelConfig.resolveModelId(cached);
          if (cachedId) return cachedId;
        }
        if (snapModelId) {
          const snapName = ModelConfig.getModel(snapModelId) && ModelConfig.getModel(snapModelId).name || "";
          const snapFam = snapName.match(/ultra|pro|flash/i);
          if (snapFam && snapFam[0].toLowerCase() === fam) return snapModelId;
        }
        const defId = ModelConfig.getFamilyDefaultModelId && ModelConfig.getFamilyDefaultModelId(fam, variant);
        if (defId) return defId;
        return snapModelId || "";
      }
      function probeGeminiUiButton(snapModelId) {
        const btn = document.querySelector("button.input-area-switch");
        if (!btn || !btn.textContent) return "";
        const text = normalizeUiModelText(btn.textContent);
        const m = text.match(GEMINI_UI_MODEL_RE);
        if (!m) return "";
        const famM = m[0].match(/ultra|pro|flash/i);
        if (!famM) return "";
        const fam = famM[0].toLowerCase();
        if (m[1]) {
          geminiUiModelByFamily[fam] = m[0].trim();
          return m[0].trim();
        }
        const varM = m[0].match(/lite|расширенн[а-яё]*|extended|fast/i);
        return resolveFamilyVariantId(fam, varM ? varM[0] : "", snapModelId);
      }
      function detectSelectedModelFromDom(snapModelId) {
        const fromMenu = probeGeminiUiMenuChecked();
        if (fromMenu) {
          const famM = fromMenu.match(/ultra|pro|flash/i);
          if (famM) geminiUiModelByFamily[famM[0].toLowerCase()] = fromMenu;
          return fromMenu;
        }
        return probeGeminiUiButton(snapModelId) || "";
      }
      function resolveCurrentModel() {
        const rawFromNet = detectedModelSlug || "";
        const snapNetId = rawFromNet ? ModelConfig.resolveModelId(rawFromNet) : null;
        let uiRaw = "";
        try {
          if ((window.location.hostname || "").indexOf("gemini.google.com") !== -1) {
            uiRaw = detectSelectedModelFromDom(snapNetId) || "";
          }
        } catch (e) {
          uiRaw = "";
        }
        const uiResolved = uiRaw ? ModelConfig.resolveModelId(uiRaw) : null;
        if (uiRaw && !uiResolved) uiRaw = "";
        const rawFromDom = rawFromNet || uiRaw ? "" : currentAdapter.detectModel() || "";
        const rawSnapshot = rawFromNet || rawFromDom || "";
        const snapModelId = rawSnapshot ? ModelConfig.resolveModelId(rawSnapshot) : null;
        if (snapModelId) {
          lastSnapshotModelName = ModelConfig.getModel(snapModelId)?.name || snapModelId;
        }
        const raw = popupModelId || rawSnapshot || uiRaw || "";
        const rawSrc = popupModelId ? "\u043F\u043E\u043F\u0430\u043F" : rawSnapshot ? rawFromNet ? "\u0441\u0435\u0442\u044C" : "DOM" : uiRaw ? "dom" : "";
        let modelId = raw ? ModelConfig.resolveModelId(raw) : null;
        let path;
        if (modelId) {
          path = rawSrc || "\u0434\u0435\u0444\u043E\u043B\u0442";
        } else {
          modelId = ModelConfig.getDefaultModel(currentAdapter.siteName);
          path = raw ? (rawFromNet ? "\u0441\u0435\u0442\u044C" : "DOM") + "\u2192\u0434\u0435\u0444\u043E\u043B\u0442(\u043D\u0435 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D)" : "\u0434\u0435\u0444\u043E\u043B\u0442";
        }
        if (!snapModelId && currentAdapter && currentAdapter.siteName === "google_search") {
          lastSnapshotModelName = ModelConfig.getModel(modelId)?.name || modelId;
        }
        const source = rawSrc === "\u043F\u043E\u043F\u0430\u043F" ? "popup" : rawSrc === "dom" ? "dom" : "snapshot";
        if (modelId !== lastResolvedModelId) {
          lastResolvedModelId = modelId;
          const ctx = ModelConfig.getContextLimit(modelId);
          const eff = ModelConfig.getEffectiveLimit(modelId);
          console.log("[model-detect] \u043F\u0443\u0442\u044C=" + path + (raw ? ', raw="' + raw + '"' : "") + " \u2192 id=" + modelId + ", \u0438\u043C\u044F=" + (ModelConfig.getModel(modelId)?.name || modelId) + ", \u043E\u043A\u043D\u043E=" + ctx.toLocaleString() + ", \u043F\u043E\u0440\u043E\u0433 \u043F\u043E\u0442\u0435\u0440\u0438 \u0434\u0435\u0442\u0430\u043B\u0435\u0439=" + eff.toLocaleString());
        }
        const srcSig = source + "|" + modelId;
        if (srcSig !== lastModelSourceSig) {
          lastModelSourceSig = srcSig;
          debugLog("log", source === "popup" ? '[model-detect] H19 popup raw="' + popupRawModel + '" \u2192 id=' + modelId + " \xB7 model-source=popup" : source === "dom" ? '[model-detect] v48 dom raw="' + uiRaw + '" \u2192 id=' + modelId + " \xB7 model-source=dom" : "[model-detect] v47 model-source=snapshot" + (rawSnapshot ? ', \u0441\u043D\u0438\u043C\u043E\u043A="' + rawSnapshot + '"' : "") + " \u2192 id=" + modelId);
        }
        return modelId;
      }
      function logTextProbe(label, text) {
        if (!text) return;
        var totalLen = text.length;
        var normText = normalize(text);
        var skelLen = normText.length;
        var pieces = text.split("\n");
        var baseHits = 0;
        var nonBase = 0;
        for (var p = 0; p < pieces.length; p++) {
          var pieceNorm = normalize(pieces[p]);
          if (!pieceNorm) continue;
          if (baseSkelSet && baseSkelSet.has(pieceNorm)) {
            baseHits++;
          } else {
            nonBase++;
          }
        }
        console.log("[text-probe] " + label + " totalLen=" + totalLen + " skelLen=" + skelLen + " \u043A\u0443\u0441\u043A\u043E\u0432\u0411\u0430\u0437\u0430=" + baseHits + " \u043A\u0443\u0441\u043A\u043E\u0432\u041D\u0435\u0411\u0430\u0437\u0430=" + nonBase);
      }
      function requestExactTokens(fullText, modelId) {
        if (!isExtensionValid()) return;
        if (!exactCountEnabled || !geminiApiKey) {
          netServerTokens = 0;
          return;
        }
        if (!fullText) {
          netServerTokens = 0;
          return;
        }
        console.log("[byok-src] baseComplete=" + baseComplete + " baseSeen=" + baseSeen + " fullIsBase=" + (fullText === baseText) + " baseLen=" + baseText.length + " fullLen=" + fullText.length + " baseCount=" + baseCount);
        if (fullText === lastCountTokensText) {
          netServerTokens = lastCountTokensCache;
          return;
        }
        clearTimeout(countTokensTimer);
        if (countTokensPending) return;
        countTokensPending = /** @type {boolean|Map<unknown, unknown>} */
        true;
        var apiModelId = ModelConfig.getGeminiApiModelId(modelId);
        logTextProbe("pre-send", fullText);
        chrome.runtime.sendMessage({
          type: "COUNT_TOKENS",
          text: fullText,
          model: apiModelId
        }, function(response) {
          countTokensPending = /** @type {boolean|Map<unknown, unknown>} */
          false;
          if (response && typeof response.totalTokens === "number") {
            lastCountTokensText = fullText;
            lastCountTokensCache = response.totalTokens;
            lastCountTokensConvId = getCurrentConvId() || "";
            lastCountTokensErrorText = "";
            netServerTokens = response.totalTokens;
            console.log("[exact-tokens] countTokens \u0432\u0435\u0440\u043D\u0443\u043B " + response.totalTokens + " \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438 " + apiModelId);
            logTextProbe("post-ok:" + response.totalTokens, fullText);
            if (isExtensionValid()) {
              var convId = getCurrentConvId();
              try {
                chrome.storage.local.set({
                  "ai-cm-byok-cache": { convId, text: fullText, count: response.totalTokens, ts: Date.now() }
                });
                console.log("[byok-cache] \u0442\u043E\u0447\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435: " + response.totalTokens);
              } catch (e) {
                swallowSoft(e, "content:requestExactTokens");
              }
            }
            processAndSend();
          } else {
            var err = response && response.error ? response.error : "unknown";
            aiCmDiagWarn("content:requestExactTokens", "[exact-tokens] \u043E\u0448\u0438\u0431\u043A\u0430 countTokens: " + err + " \u2014 \u0444\u043E\u043B\u0431\u044D\u043A \u043D\u0430 \u044D\u0432\u0440\u0438\u0441\u0442\u0438\u043A\u0443");
            lastCountTokensConvId = "";
            lastCountTokensErrorText = fullText;
            if (fullText === lastCountTokensText && lastCountTokensCache > 0) {
              netServerTokens = lastCountTokensCache;
            } else {
              netServerTokens = 0;
            }
          }
        });
      }
      function loadByokSettings() {
        if (!isExtensionValid()) return;
        chrome.storage.local.get(["ai_cm_exact_token_count"], function(data) {
          exactCountEnabled = !!data.ai_cm_exact_token_count;
          aiCmSwByokHasKey().then(function(hasKey) {
            geminiApiKey = aiCmByokFlag(hasKey);
            console.log("[byok] \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B: exactCount=" + exactCountEnabled + ", key=" + (geminiApiKey ? "***" : "(\u043F\u0443\u0441\u0442\u043E)"));
          });
        });
      }
      var aiCmByokKeyPromise = null;
      function loadByokSettingsAsync() {
        if (aiCmByokKeyPromise) return aiCmByokKeyPromise;
        aiCmByokKeyPromise = new Promise(function(resolve) {
          try {
            if (!isExtensionValid()) {
              resolve(false);
              return;
            }
            aiCmSwByokHasKey().then(function(hasKey) {
              geminiApiKey = aiCmByokFlag(hasKey);
              console.log("[byok] \u043A\u043B\u044E\u0447 \u043F\u043E\u043B\u0443\u0447\u0435\u043D \u043E\u0442 SW: " + (hasKey ? "***" : "(\u043F\u0443\u0441\u0442\u043E)"));
              resolve(hasKey);
            });
          } catch (eByokP) {
            resolve(false);
          }
        });
        return aiCmByokKeyPromise;
      }
      function aiCmByokKeyInvalidate() {
        aiCmByokKeyPromise = null;
        try {
          if (!isExtensionValid()) return;
          aiCmSwByokHasKey().then(function(hasKey) {
            geminiApiKey = aiCmByokFlag(hasKey);
            lastCountTokensText = "";
            lastCountTokensCache = 0;
            lastCountTokensConvId = "";
            lastCountTokensErrorText = "";
            netServerTokens = 0;
            console.log("[byok] \u043A\u043B\u044E\u0447 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u043C SW: " + (geminiApiKey ? "***" : "(\u043F\u0443\u0441\u0442\u043E)"));
            if (isInitialized) processAndSend();
          });
        } catch (eByokInv) {
          swallowSoft(eByokInv, "content:aiCmByokKeyInvalidate");
        }
      }
      function loadByokCache() {
        if (!isExtensionValid()) return;
        var currentConvId = getCurrentConvId();
        if (!currentConvId) return;
        chrome.storage.local.get(["ai-cm-byok-cache"], function(data) {
          var entry = data["ai-cm-byok-cache"];
          if (!entry || entry.convId !== currentConvId) return;
          if (!entry.text || typeof entry.count !== "number" || entry.count <= 0) return;
          lastCountTokensText = entry.text;
          lastCountTokensCache = entry.count;
          lastCountTokensConvId = currentConvId;
          console.log("[byok-cache] \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0442\u043E\u0447\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0438\u0437 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430: " + entry.count + " \u0442\u043E\u043A\u0435\u043D\u043E\u0432");
        });
      }
      var AI_ARCHIVE_PREFIX = "aiCmArchive:";
      var AI_CONV_SOURCE_PREFIX = "aiCmConvSource:";
      function aiCmArchiveCountFor(convId) {
        try {
          return convId && aiCmArchiveCountByConv[convId] || 0;
        } catch (eAcf) {
          return 0;
        }
      }
      var aiCmAdapterBaseCount = 0;
      function aiCmAdapterBaseSeen() {
        return !baseSeen && (typeof aiCmAdapterBaseCount === "number" && aiCmAdapterBaseCount > 0 || typeof baseCount === "number" && baseCount > 0 || Array.isArray(lastBaseTexts) && lastBaseTexts.length > 0);
      }
      function aiCmSourceInfo() {
        var cid = getCurrentConvId() || "";
        var rec = cid ? aiCmConvSourceByConv[cid] : null;
        if (rec && rec.kind === "archive") {
          var fmt = rec.format || "?";
          var cnt = String(rec.count || 0);
          return { kind: "archive", label: rec.label || aiCmI18nMessage("content_source_archive", "\u0430\u0440\u0445\u0438\u0432: " + fmt + " \xB7 " + cnt + " \u0441\u043E\u043E\u0431\u0449.", [fmt, cnt]) };
        }
        if (baseSeen) return { kind: "live", label: aiCmI18nMessage("content_source_live", "live (\u0441\u0435\u0442\u044C/DOM)") };
        if (aiCmAdapterBaseSeen()) return { kind: "live", label: aiCmI18nMessage("content_source_live", "live (\u0441\u0435\u0442\u044C/DOM)") };
        return null;
      }
      function aiCmLoadArchiveTier(convId, reason) {
        if (!convId || !isExtensionValid()) return;
        try {
          var archKey = AI_ARCHIVE_PREFIX + convId;
          var srcKey = AI_CONV_SOURCE_PREFIX + convId;
          chrome.storage.local.get([archKey, srcKey], function(data) {
            try {
              if (!isExtensionValid()) return;
              if (getCurrentConvId() !== convId) {
                debugLog("log", "[AI CM][archive-restore] skip reason=stale convId=" + convId + " current=" + (getCurrentConvId() || "(none)"));
                return;
              }
              var src = data[srcKey] || null;
              if (src) aiCmConvSourceByConv[convId] = src;
              var rec = data[archKey] || null;
              var hasMsgs = !!(rec && Array.isArray(rec.messages) && rec.messages.length);
              if (rec) {
                var recCount = typeof rec.count === "number" && rec.count > 0 ? rec.count : hasMsgs ? rec.messages.length : 0;
                if (recCount > 0) aiCmArchiveCountByConv[convId] = recCount;
              }
              debugLog("log", "[AI CM][archive-restore] convId=" + convId + " action=" + (hasMsgs ? "used" : "none") + " cachedMsgs=" + (hasMsgs ? rec.messages.length : 0) + " count=" + (rec && rec.count || 0) + " format=" + (rec && rec.format || "-") + " reason=" + (reason || ""));
              if (hasMsgs && !aiCmArchiveRestoredDispatched[convId]) {
                aiCmArchiveRestoredDispatched[convId] = true;
                try {
                  window.dispatchEvent(new CustomEvent("ai-cm-archive-restore", {
                    detail: JSON.stringify({
                      convId,
                      messages: rec.messages,
                      count: typeof rec.count === "number" && rec.count > 0 ? rec.count : rec.messages.length,
                      textLen: typeof rec.textLen === "number" ? rec.textLen : 0,
                      format: rec.format || "",
                      service: rec.service || "",
                      title: rec.title || ""
                    })
                  }));
                  debugLog("log", "[AI CM][archive-restore] dispatched convId=" + convId + " msgs=" + rec.messages.length);
                } catch (eD) {
                }
              }
              aiCmUpdateSourceIndicator();
            } catch (eInner) {
              swallowSoft(eInner, "content:aiCmLoadArchiveTier");
            }
          });
        } catch (eL) {
          debugLog("log", "[AI CM][archive-restore] silent-catch load: " + (eL && eL.message || eL));
        }
      }
      function aiCmUpdateSourceIndicator() {
        try {
          var info = aiCmSourceInfo();
          aiCmSourceLabelNow = info ? info.label : "";
          if (!widgetElement) return;
          var panel = widgetElement.querySelector(".ai-widget-panel");
          if (!panel) return;
          var el = (
            /** @type {HTMLElement|null} */
            panel.querySelector(".ai-cm-source")
          );
          var want = aiCmSourceLabelNow ? aiCmI18nMessage("content_source_label", "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A: " + aiCmSourceLabelNow, [aiCmSourceLabelNow]) : "";
          if (el && el.textContent === want && el.style.display === (want ? "block" : "none")) return;
          if (!want) {
            if (el) {
              el.textContent = "";
              el.style.display = "none";
            }
            return;
          }
          if (!el) {
            el = document.createElement("div");
            el.className = "ai-cm-source";
            panel.appendChild(el);
          }
          el.textContent = want;
          el.style.display = "block";
        } catch (eSrc) {
        }
      }
      var AI_CM_BADGE_HOLD_FALLBACK_MS = 1e4;
      var aiCmBadgeHoldUntil = 0;
      var aiCmBadgeHoldSpent = false;
      var aiCmBadgeHoldTimer = null;
      function aiCmBadgeHoldDiag(reason) {
        try {
          if (typeof aiCmDiagLine !== "function") return;
          aiCmDiagLine("badge-hold", {
            point: "badge-hold",
            reason,
            site: currentAdapter && currentAdapter.siteName || "",
            convId: (typeof getCurrentConvId === "function" ? getCurrentConvId() : "") || "",
            baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
            fallbackMs: AI_CM_BADGE_HOLD_FALLBACK_MS
          });
        } catch (eHoldDiag) {
        }
      }
      function aiCmBadgeHoldRelease(reason, reveal) {
        try {
          if (aiCmBadgeHoldSpent) return false;
          aiCmBadgeHoldSpent = true;
          aiCmBadgeHoldUntil = 0;
          debugLog("log", "[content-trace] badge-hold (O-1): \u0449\u0438\u0442 \u043E\u0442\u043F\u0443\u0449\u0435\u043D (" + reason + ") t=" + Date.now());
          aiCmBadgeHoldDiag(reason);
          if (reveal) {
            try {
              aiCmRevealWidget();
            } catch (eRevO1) {
              swallowSoft(eRevO1, "content:aiCmBadgeHoldRelease");
            }
            processAndSend();
          }
          return true;
        } catch (eRelO1) {
          return false;
        }
      }
      function aiCmBadgeHoldActive() {
        try {
          if (aiCmBadgeHoldSpent) return false;
          if (!currentAdapter || currentAdapter.siteName !== "chatgpt") return false;
          if (baseSeen) {
            aiCmBadgeHoldRelease("released-baseSeen", false);
            return false;
          }
          if (!aiCmBadgeHoldUntil) {
            var armReason = getCurrentConvId() ? "armed" : "armed-empty-convid";
            aiCmBadgeHoldUntil = Date.now() + AI_CM_BADGE_HOLD_FALLBACK_MS;
            debugLog("log", "[content-trace] badge-hold (O-1): ChatGPT \u2014 \u0437\u0430\u043F\u0438\u0441\u0438 \u0431\u0430\u0437\u044B \u0435\u0449\u0451 \u043D\u0435\u0442, \u0432\u0438\u0434\u0436\u0435\u0442 \u0441\u043A\u0440\u044B\u0442 (" + armReason + ") t=" + Date.now());
            aiCmBadgeHoldDiag(armReason);
            aiCmArmBadgeHoldFallback();
          }
          if (Date.now() >= aiCmBadgeHoldUntil) {
            aiCmBadgeHoldRelease("released-fallback", false);
            return false;
          }
          return true;
        } catch (eHoldO1) {
          return false;
        }
      }
      function aiCmArmBadgeHoldFallback() {
        try {
          if (aiCmBadgeHoldTimer) return;
          aiCmBadgeHoldTimer = setTimeout(function() {
            aiCmBadgeHoldTimer = null;
            if (aiCmBadgeHoldSpent || baseSeen) return;
            aiCmBadgeHoldRelease("released-fallback", true);
          }, AI_CM_BADGE_HOLD_FALLBACK_MS);
        } catch (eArmO1) {
        }
      }
      function aiCmMetricServerTokens(svc, text) {
        if (svc === "qwen") return 0;
        var exact = typeof aiCmExactTokensFor === "function" ? aiCmExactTokensFor(text) : 0;
        if (exact > 0) return exact;
        return typeof netServerTokens === "number" && netServerTokens > 0 ? netServerTokens : 0;
      }
      function aiCmExactTokensFor(text) {
        if (!exactCountEnabled || !geminiApiKey) return 0;
        if (!text) return 0;
        var cached = typeof lastCountTokensCache === "number" && lastCountTokensCache > 0 ? lastCountTokensCache : 0;
        if (cached <= 0) return 0;
        if (text === lastCountTokensText) return cached;
        var convSame = false;
        try {
          var curConv = typeof getCurrentConvId === "function" ? getCurrentConvId() : "";
          convSame = !!(curConv && typeof lastCountTokensConvId === "string" && lastCountTokensConvId === curConv);
        } catch (eConv) {
          convSame = false;
        }
        return convSame ? cached : 0;
      }
      function aiCmHeuristicHoldForByok(svc, text) {
        if (!exactCountEnabled || !geminiApiKey) return false;
        if (svc !== "gemini" && svc !== "aistudio" && svc !== "google_search") return false;
        if (!text) return false;
        if (typeof isExtensionValid === "function" && !isExtensionValid()) return false;
        var exact = typeof aiCmExactTokensFor === "function" ? aiCmExactTokensFor(text) : 0;
        if (exact > 0) return false;
        var errText = typeof lastCountTokensErrorText === "string" ? lastCountTokensErrorText : "";
        if (errText && errText === text) return false;
        return true;
      }
      function aiCmResyncMetricsAfterFlush(cid, reason) {
        try {
          if (baseSeen !== true) return false;
          if (typeof aiCmCurrentBaseSnapshot !== "function") return false;
          var curCid = getCurrentConvId() || "";
          if (!cid || curCid && cid !== curCid) return false;
          var msgs = aiCmCurrentBaseSnapshot(cid);
          if (!Array.isArray(msgs) || msgs.length === 0) return false;
          var prevCount = typeof baseCount === "number" ? baseCount : 0;
          var rawKnown = typeof aiCmNetRawCount === "number" && typeof aiCmNetRawCountUsed === "number";
          var rawCount = rawKnown ? aiCmNetRawCount : 0;
          var prevRaw = rawKnown ? aiCmNetRawCountUsed : 0;
          var rawUnchanged = !rawKnown || rawCount === prevRaw;
          if (msgs.length < prevCount) {
            debugLog("log", "[AI CM][export] metrics-resync skip reason=shrink convId=" + cid + " final=" + msgs.length + " current=" + prevCount);
            return false;
          }
          var texts = [];
          for (var i = 0; i < msgs.length; i++) {
            var mi = (
              /** @type {any} */
              msgs[i]
            );
            texts.push(String(mi && mi.text || ""));
          }
          var joined = texts.join("\n");
          var newKey = msgs.length + "|" + joined.length;
          var sameCount = msgs.length === prevCount;
          var canSkip = sameCount && newKey === lastHistoryWroteKey && rawUnchanged;
          try {
            if (typeof aiCmDiagLine === "function") {
              aiCmDiagLine("o22-metrics-resync", {
                ts: Date.now(),
                convId: cid,
                reason: reason || "(none)",
                finalMsgs: msgs.length,
                prevMsgs: prevCount,
                histKey: newKey,
                lastKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0,
                rawMsgs: rawCount,
                prevRawMsgs: prevRaw,
                verdict: canSkip ? "skip" : rawUnchanged ? "resync" : "resync-raw"
              });
            }
          } catch (eRsD) {
            swallowSoft(eRsD, "content:metrics-resync-diag");
          }
          if (canSkip) {
            debugLog("log", "[AI CM][export] metrics-resync skip reason=same convId=" + cid + " histKey=" + newKey);
            return false;
          }
          baseCount = msgs.length;
          lastBaseTexts = texts;
          baseText = joined;
          var keyRepeated = newKey === lastHistoryWroteKey;
          lastHistoryWroteKey = rawUnchanged || !keyRepeated ? newKey : null;
          if (rawKnown) aiCmNetRawCountUsed = rawCount;
          debugLog("log", "[AI CM][export] metrics-resync reason=" + (reason || "(none)") + " convId=" + cid + " msgs=" + prevCount + "->" + msgs.length + " histKey=" + newKey + (rawKnown ? " raw=" + prevRaw + "->" + rawCount : ""));
          processAndSend();
          return true;
        } catch (eRs) {
          swallowSoft(eRs, "content:metrics-resync");
          return false;
        }
      }
      function processAndSend() {
        if (!currentAdapter) return;
        try {
          aiCmGsaResetStaleStateOnChatlessDoc();
        } catch (eO27c) {
          swallowSoft(eO27c, "content:processAndSend-gsa-stale-reset");
        }
        try {
          var siteNameS1 = currentAdapter.siteName || "";
          if (siteNameS1 && siteNameS1 !== "gemini") {
            var histWritePathS1 = baseSeen && lastBaseTexts.length > 0 ? "network" : !baseSeen ? "adapter" : "none";
            var netMsgsS1 = lastBaseTexts.length;
            var domMsgsS1 = typeof currentAdapter.extractMessages === "function" ? currentAdapter.extractMessages().length : 0;
            debugLog("log", "[AI CM][svc-emit-trace] site=" + siteNameS1 + " convId=" + (getCurrentConvId() || "") + " msgs=" + domMsgsS1 + " domMsgs=" + domMsgsS1 + " netMsgs=" + netMsgsS1 + " histWritePath=" + histWritePathS1);
          }
        } catch (eS1) {
        }
        try {
          var cidArc = getCurrentConvId() || "";
          if (cidArc && !aiCmArchiveLoadStarted[cidArc]) {
            aiCmArchiveLoadStarted[cidArc] = true;
            aiCmLoadArchiveTier(cidArc, "page-load");
          }
        } catch (eArcInit) {
          swallowSoft(eArcInit, "content:processAndSend-archive-init");
        }
        if (!restoredTapeLoaded) {
          restoredTapeLoaded = true;
          var svc0 = getServiceKey();
          if (svc0 === "gemini" || svc0 === "aistudio") {
            var convId = "";
            try {
              var m = location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);
              convId = m ? m[1] : "";
            } catch (e) {
            }
            if (convId) {
              debugLog("log", "[AI CM][tape-restore] key=" + geminiTapeKey(convId));
              aiCmTapeAccountIdx[convId] = getAccountIndex();
              if (tapeRestoreSeen[convId]) {
                debugLog("log", "[AI CM][tape-restore] skip reason=already-restored convId=" + convId + " (per-page session, v77)");
              } else {
                GeminiTapeStore.load(convId).then(function(entry) {
                  restoreDone = true;
                  var hasTurns66 = !!(entry && entry.turns && entry.turns.length);
                  if (!hasTurns66 && baseSeen && baseComplete === true && Array.isArray(lastDetailMessages) && lastDetailMessages.length > 0 && getCurrentConvId() === convId) {
                    var lateTurns66 = [];
                    for (var lt66 = 0; lt66 < lastDetailMessages.length; lt66++) {
                      var lm66 = lastDetailMessages[lt66] || {};
                      lateTurns66.push({
                        id: lm66.id != null ? String(lm66.id) : "",
                        text: lm66.text || "",
                        role: lm66.role === "user" ? "user" : "assistant",
                        r1: lm66.r1 || null,
                        turnId: lm66.turnId || null
                      });
                    }
                    if (lateTurns66.length > 0) {
                      debugLog("log", "[AI CM][tape-save] convId=" + convId + " action=late-save msgs=" + lateTurns66.length + " baseComplete=1 (\u043F\u043E\u043B\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u043F\u0440\u0438\u0448\u0451\u043B \u0434\u043E/\u0432\u043C\u0435\u0441\u0442\u043E \u0437\u0430\u043F\u0438\u0441\u0438 \u043B\u0435\u043D\u0442\u044B \u2014 \u0434\u043E\u0433\u043E\u0432\u0430\u0440\u0438\u0432\u0430\u044E)");
                      GeminiTapeStore.save(convId, lateTurns66, {
                        count: baseCount || 0,
                        effectiveLen: netEffectiveLen || 0,
                        modelSlug: detectedModelSlug || "",
                        version: geminiParserVersion()
                      });
                    }
                  }
                  var hasTurns = !!(entry && entry.turns && entry.turns.length);
                  var diagTape0 = hasTurns && entry.turns[0] || null;
                  var diagTapeN = hasTurns && entry.turns[entry.turns.length - 1] || null;
                  debugLog("log", "[AI CM][tape-restore] convId=" + convId + " cacheConvId=" + convId + " action=" + (hasTurns ? "used" : "empty") + " cachedMsgs=" + (hasTurns ? entry.turns.length : 0) + " firstMsgHash=" + (diagTape0 ? aiCmDiagHash6(diagTape0.id, diagTape0.text) : "-") + " lastMsgHash=" + (diagTapeN ? aiCmDiagHash6(diagTapeN.id, diagTapeN.text) : "-"));
                  if (!hasTurns) return;
                  tapeRestoreSeen[convId] = true;
                  if (getCurrentConvId() !== convId) {
                    debugLog("log", "[content] v35: restore \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D \u2014 \u043B\u0435\u043D\u0442\u0430 \u0447\u0443\u0436\u043E\u0433\u043E \u0447\u0430\u0442\u0430 (saved=" + convId + ", current=" + getCurrentConvId() + ")");
                    debugLog("log", "[AI CM][tape-restore] convId=" + getCurrentConvId() + " cacheConvId=" + convId + " action=stale cachedMsgs=" + entry.turns.length + " firstMsgHash=" + aiCmDiagHash6(entry.turns[0] && entry.turns[0].id, entry.turns[0] && entry.turns[0].text) + " lastMsgHash=" + aiCmDiagHash6(entry.turns[entry.turns.length - 1] && entry.turns[entry.turns.length - 1].id, entry.turns[entry.turns.length - 1] && entry.turns[entry.turns.length - 1].text));
                    return;
                  }
                  badgeSuppressed = false;
                  debugLog("log", "[content-trace] badge: \u0441\u043D\u044F\u0442\u0430 \u0441\u0443\u043F\u0440\u0435\u0441\u0441\u0438\u044F \u2014 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u043B\u0435\u043D\u0442\u0430 \u043A\u044D\u0448\u0430 convId=" + convId);
                  if (aiCmRestoredDispatched[convId]) {
                    debugLog("log", "[AI CM][tape-restore] skip reason=already-dispatched convId=" + convId + " cachedMsgs=" + entry.turns.length);
                  } else {
                    aiCmRestoredDispatched[convId] = true;
                    try {
                      window.dispatchEvent(new CustomEvent("ai-cm-restored-history", {
                        detail: JSON.stringify({
                          convId,
                          turns: entry.turns,
                          meta: entry.meta || {}
                        })
                      }));
                    } catch (e) {
                    }
                  }
                  try {
                    var tapeCheckCid79 = getCurrentConvId() || "";
                    if (tapeCheckCid79 && autoExportSettings.enabled === true && typeof autoExportLastPct === "number" && autoExportLastPct >= 0) {
                      debugLog("log", "[AI CM][auto-export] tape-restore applied \u2192 check convId=" + tapeCheckCid79 + " pct=" + autoExportLastPct);
                      maybeAutoExport(autoExportLastPct);
                    }
                  } catch (eT79) {
                    swallowSoft(eT79, "content:processAndSend-tape-restore");
                  }
                  if (!cacheRefreshPlanned[convId]) {
                    cacheRefreshPlanned[convId] = true;
                    setTimeout(function() {
                      if (getCurrentConvId() !== convId) return;
                      try {
                        window.dispatchEvent(new CustomEvent("ai-cm-cache-refresh", { detail: JSON.stringify({ convId }) }));
                      } catch (e2) {
                      }
                    }, 2e3);
                  }
                });
                GeminiTapeStore.cleanup();
              }
            }
          }
        }
        try {
          var svcD8 = getServiceKey();
          if (svcD8 === "gemini" || svcD8 === "aistudio") {
            var cidD8 = "";
            try {
              var mD8 = location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/);
              cidD8 = mD8 ? mD8[1] : "";
            } catch (eD8) {
            }
            if (cidD8 && restoredTapeLoaded && aiCmTapeAccountIdx[cidD8] !== void 0 && String(aiCmTapeAccountIdx[cidD8]) !== String(getAccountIndex())) {
              debugLog("log", "[AI CM][tape-restore] retry reason=account-index-stabilized u" + aiCmTapeAccountIdx[cidD8] + "\u2192u" + getAccountIndex() + " convId=" + cidD8 + " key=" + geminiTapeKey(cidD8));
              aiCmTapeAccountIdx[cidD8] = getAccountIndex();
              restoredTapeLoaded = false;
            }
          }
        } catch (eD8b) {
        }
        var drawSig = [baseComplete ? 1 : 0, baseSeen ? 1 : 0, isInitialized ? 1 : 0, baseCount, baseText ? baseText.length : 0].join("|");
        if (!isInitialized && !(baseSeen && baseComplete) && !aiCmAdapterBaseSeen()) {
          if (drawSig !== lastDrawSig) {
            lastDrawSig = drawSig;
            debugLog("log", "[content-trace] DRAW-\u041F\u0420\u041E\u041F\u0423\u0421\u041A (guard) seq=" + (window.__aiCmTraceSeq || 0) + " baseComplete=" + baseComplete + " baseSeen=" + baseSeen + " isInitialized=" + isInitialized + " t=" + Date.now());
          }
          try {
            aiCmQwenInitDiag("draw-guard", { verdict: "skip", reason: "not-initialized", baseSeen: baseSeen === true ? 1 : 0, baseComplete: baseComplete === true ? 1 : 0, baseCount: typeof baseCount === "number" ? baseCount : 0, adapterMsgs: typeof aiCmAdapterBaseCount === "number" ? aiCmAdapterBaseCount : -1, src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
          } catch (eQg1) {
          }
          return;
        }
        if (drawSig !== lastDrawSig) {
          lastDrawSig = drawSig;
          debugLog("log", "[content-trace] DRAW seq=" + (window.__aiCmTraceSeq || 0) + " baseComplete=" + baseComplete + " baseSeen=" + baseSeen + " isInitialized=" + isInitialized + " effectiveLen=" + (function() {
            var e = getEffectiveText();
            return e ? e.length : 0;
          })() + " t=" + Date.now());
        }
        try {
          aiCmQwenInitDiag("draw-guard", { verdict: "pass", baseSeen: baseSeen === true ? 1 : 0, baseComplete: baseComplete === true ? 1 : 0, baseCount: typeof baseCount === "number" ? baseCount : 0, src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : "" });
        } catch (eQg2) {
        }
        try {
          const svc = getServiceKey();
          const isGeminiLike = svc === "gemini" || svc === "aistudio";
          let messageCount;
          if (!baseSeen) {
            messageCount = isGeminiLike ? 0 : currentAdapter.extractMessages().length;
            aiCmAdapterBaseCount = messageCount;
          } else {
            messageCount = baseCount;
          }
          const modelId = resolveCurrentModel();
          const effective = getEffectiveText();
          let fullText;
          let countForTokens;
          if (effective) {
            fullText = effective;
            countForTokens = getEffectiveCount(messageCount);
          } else {
            if (isGeminiLike) {
              fullText = "";
              countForTokens = 0;
            } else {
              fullText = currentAdapter.getFullDialogText();
              countForTokens = messageCount;
            }
          }
          const isGeminiSvc = svc === "gemini" || svc === "aistudio" || svc === "google_search";
          if (isGeminiSvc && exactCountEnabled && geminiApiKey && fullText) {
            requestExactTokens(fullText, modelId);
          }
          const metricServerTokens = aiCmMetricServerTokens(svc, fullText);
          const byokHeuristicHold = aiCmHeuristicHoldForByok(svc, fullText);
          let tokenEstimate = metricServerTokens > 0 ? metricServerTokens : Tokenizer.estimateDialogTokens(fullText, countForTokens);
          if (baseComplete === true && metricServerTokens === 0 && netEffectiveLen > 0 && fullText && fullText.length > 0 && netEffectiveLen > fullText.length) {
            tokenEstimate = Math.round(tokenEstimate * (netEffectiveLen / fullText.length));
          }
          tokenEstimate += netAttachTokens;
          const contextLimit = ModelConfig.getContextLimit(modelId);
          const effectiveLimit = ModelConfig.getEffectiveLimit(modelId);
          const displayLimit = computeEffectiveLimit(modelId);
          const useMonotonic = baseComplete || lastBounded || baseSeen && baseCount > 0;
          try {
            var metricSrc = baseComplete ? "base-complete" : lastBounded ? "base-floor+dom-tail" : "base-floor";
            var metricSig = [metricSrc, baseCount, fullText ? fullText.length : 0, tokenEstimate, baseSeen ? 1 : 0].join("|");
            if (typeof aiCmDiagLine === "function" && metricSig !== lastMetricSig) {
              lastMetricSig = metricSig;
              aiCmDiagLine("gsa-metric-src", {
                site: svc,
                src: metricSrc,
                note: !baseComplete && baseCount > 0 ? "incomplete-canonical-floor" : "",
                msgs: baseCount,
                countForTokens,
                textLen: fullText ? fullText.length : 0,
                baseComplete: baseComplete ? 1 : 0,
                baseSeen: baseSeen ? 1 : 0,
                lastBounded: lastBounded ? 1 : 0,
                useMonotonic: useMonotonic ? 1 : 0,
                tokens: tokenEstimate,
                baseTextLen: baseText ? baseText.length : 0,
                threadId: lastThreadId || ""
              });
            }
          } catch (eMetricSrc) {
          }
          if (metricServerTokens > 0) {
            maxTokenCount = tokenEstimate;
          } else if (byokHeuristicHold) {
          } else if (baseComplete === true) {
            maxTokenCount = tokenEstimate;
          } else if (useMonotonic) {
            if (tokenEstimate > maxTokenCount) maxTokenCount = tokenEstimate;
          } else {
            maxTokenCount = tokenEstimate;
          }
          const percentage = displayLimit > 0 ? Math.round(maxTokenCount / displayLimit * 1e3) / 10 : 0;
          const hasChanged = percentage !== lastPercentage;
          lastPercentage = percentage;
          var badgeSuppressActive = badgeSuppressed && !baseSeen && !adapterBaseSeen;
          if (badgeSuppressActive) {
            debugLog("log", "[content-trace] badge-suppress: \u043F\u0440\u043E\u043F\u0443\u0441\u043A updateWidget \u0434\u043E \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0441\u043D\u0438\u043C\u043A\u0430 \u043D\u043E\u0432\u043E\u0433\u043E convId");
          } else if (aiCmLoaderFreeze) {
            lastWidgetData = {
              percentage,
              tokenEstimate: maxTokenCount,
              effectiveLimit,
              contextLimit,
              displayLimit,
              modelName: ModelConfig.getModel(modelId)?.name || modelId,
              attachBreak: netAttachBreak
            };
            debugLog("log", "[content-trace] badge-freeze: \u0441\u043A\u0440\u044B\u0442\u0430\u044F \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043B\u043E\u0430\u0434\u0435\u0440\u0430 \u2014 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u043E, \u0432\u0438\u0434\u0436\u0435\u0442 \u0434\u0435\u0440\u0436\u0438\u0442\u0441\u044F");
          } else if (aiCmBadgeHoldActive()) {
          } else if (byokHeuristicHold) {
            debugLog("log", "[content-trace] byok-hold: \u0442\u043E\u0447\u043D\u043E\u0433\u043E \u0447\u0438\u0441\u043B\u0430 \u0434\u043B\u044F \u0442\u0435\u043A\u0441\u0442\u0430 \u0435\u0449\u0451 \u043D\u0435\u0442 \u2014 \u0431\u0435\u0439\u0434\u0436 \u0434\u0435\u0440\u0436\u0438\u043C");
          } else {
            updateWidget(percentage, maxTokenCount, effectiveLimit, contextLimit, displayLimit, ModelConfig.getModel(modelId)?.name || modelId, netAttachBreak);
            lastWidgetData = {
              percentage,
              tokenEstimate: maxTokenCount,
              effectiveLimit,
              contextLimit,
              displayLimit,
              modelName: ModelConfig.getModel(modelId)?.name || modelId,
              attachBreak: netAttachBreak
            };
          }
          try {
            if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
              aiCmDiagLine("qwen-badge", {
                ts: Date.now(),
                event: "badge-update",
                reason: badgeSuppressActive ? "spa-suppress" : aiCmLoaderFreeze ? "loader-freeze" : "draw",
                pct: percentage,
                tokens: maxTokenCount,
                stale: stale === true ? 1 : 0,
                baseSeen: baseSeen === true ? 1 : 0,
                baseComplete: baseComplete === true ? 1 : 0,
                // O-35 (v54): признак «база принята адаптером» — объясняет baseCount=0 в живом
                // логе: baseCount/netBaseMsgs описывают СЕТЕВУЮ базу, адаптерная живёт здесь.
                adapterBaseSeen: adapterBaseSeen === true ? 1 : 0,
                netBaseMsgs: lastBaseTexts.length,
                baseCount,
                // O-47: netServerTokens — что ПРИНЯЛИ из снимка (измерение ingest'а), metricServerTokens —
                // что реально пошло в метрику. У Qwen второе ВСЕГДА 0 (число игнорируется, pct по tokens~):
                // расхождение этих двух полей в живой строке и есть доказательство работы правила.
                netServerTokens: typeof netServerTokens === "number" ? netServerTokens : 0,
                metricServerTokens: typeof metricServerTokens === "number" ? metricServerTokens : 0,
                convId: (typeof getCurrentConvId === "function" ? getCurrentConvId() || "" : "") || "(none)",
                url: String(typeof location !== "undefined" && location && location.href || ""),
                source: typeof aiCmSourceLabelNow === "string" && aiCmSourceLabelNow ? aiCmSourceLabelNow : "-"
              });
            }
          } catch (eQbw) {
          }
          maybeAutoExport(percentage);
          sendThresholdPct(percentage);
          if (hasChanged) {
            const tagPct = aiCmActivePct();
            const tag = tagPct != null ? "\u043F\u043E\u0440\u043E\u0433 " + tagPct + "% \u043E\u0442 \u0410\u0432\u0442\u043E" : "\u0410\u0432\u0442\u043E";
            debugLog("log", `\u{1F4CA} ${ModelConfig.getModel(modelId)?.name || modelId}: ${maxTokenCount} / ${displayLimit.toLocaleString()} (${tag}) \xB7 \u043E\u043A\u043D\u043E ${contextLimit.toLocaleString()} \xB7 ${percentage}%` + (netAttachTokens > 0 ? ` \xB7 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u2248${netAttachTokens}` : "") + (metricServerTokens > 0 ? " \xB7 serverTokens" : "") + (baseComplete ? " \xB7 \u043F\u043E \u0431\u0430\u0437\u0435" : ""));
          }
          if (isExtensionValid()) {
            try {
              var stateSnapshot = {
                host: window.location.hostname,
                site: currentAdapter.siteName,
                model: ModelConfig.getModel(modelId)?.name || modelId,
                tokens: maxTokenCount,
                limit: displayLimit,
                percent: percentage,
                updatedAt: Date.now(),
                stale,
                // T1 (v1.16): источник первого/второго яруса для индикатора в попапе
                sourceKind: (function() {
                  try {
                    var si = aiCmSourceInfo();
                    return si ? si.kind : "";
                  } catch (eSi) {
                    return "";
                  }
                })(),
                sourceLabel: (function() {
                  try {
                    var si2 = aiCmSourceInfo();
                    return si2 ? si2.label : "";
                  } catch (eSi2) {
                    return "";
                  }
                })()
              };
              var statePatch = { aiCmState: stateSnapshot };
              statePatch["aiCmState:" + window.location.hostname] = stateSnapshot;
              chrome.storage.local.set(statePatch);
            } catch (e) {
              swallowSoft(e, "content:processAndSend-state-write");
            }
          }
          var emitConvA = lastEmitConvId || "";
          var currentConvB = getCurrentConvId() || "";
          if (isExtensionValid() && baseSeen && lastBaseTexts.length > 0 && !(emitConvA && currentConvB && emitConvA !== currentConvB)) {
            var histKey = baseCount + "|" + (baseText ? baseText.length : 0);
            try {
              if (typeof aiCmDiagLine === "function") {
                aiCmDiagLine("o22-histkey-dedup", {
                  ts: Date.now(),
                  convId: emitConvA || currentConvB || "(none)",
                  histKey,
                  lastKey: typeof lastHistoryWroteKey !== "undefined" ? lastHistoryWroteKey : void 0,
                  verdict: histKey !== lastHistoryWroteKey ? "write" : "dedup-skip",
                  baseCount,
                  textLen: baseText ? baseText.length : 0,
                  src: typeof aiCmDiagStack === "function" ? aiCmDiagStack(1) : ""
                });
              }
            } catch (eO22d) {
            }
            if (histKey !== lastHistoryWroteKey) {
              lastHistoryWroteKey = histKey;
              debugLog("log", "[AI CM][trace] history-write source=network convId=" + (emitConvA || "-") + " msgs=" + baseCount);
              try {
                if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
                  aiCmDiagLine("qwen-adapter", {
                    ts: Date.now(),
                    source: "network",
                    msgs: baseCount,
                    netBaseMsgs: lastBaseTexts.length,
                    convId: emitConvA || "(none)",
                    url: String(typeof location !== "undefined" && location && location.href || ""),
                    histKey,
                    sinceSpaResetMs: aiCmQwenSpaResetAt ? Date.now() - aiCmQwenSpaResetAt : -1
                  });
                }
              } catch (eQadN) {
              }
              try {
                var histSnapshot = {
                  host: window.location.hostname,
                  convId: lastEmitConvId,
                  site: currentAdapter.siteName,
                  // v47: экспорт НЕ переводим на UI-модель — здесь остаётся модель снимка
                  model: lastSnapshotModelName || (ModelConfig.getModel(modelId)?.name || modelId),
                  tokens: maxTokenCount,
                  limit: displayLimit,
                  percent: percentage,
                  updatedAt: Date.now(),
                  // v63: low-confidence база (sanity-фолбэк без proof) — options.js ставит префикс [LOW CONFIDENCE]_
                  isLowConfidenceBase: aiCmLowConfidenceByConv[emitConvA] === true,
                  // T1 (v1.16): источник истории — архив (первый ярус) или live (сеть/DOM)
                  sourceKind: (function() {
                    try {
                      var si = aiCmSourceInfo();
                      return si ? si.kind : "";
                    } catch (eSi) {
                      return "";
                    }
                  })(),
                  sourceLabel: (function() {
                    try {
                      var si2 = aiCmSourceInfo();
                      return si2 ? si2.label : "";
                    } catch (eSi2) {
                      return "";
                    }
                  })(),
                  messages: buildHistoryMessages()
                };
                var histPatch = { aiCmHistory: histSnapshot };
                histPatch["aiCmHistory:" + window.location.hostname] = aiCmHostHistoryRecord(histSnapshot);
                var cidForGate = emitConvA || currentConvB || "";
                var isGeminiGate = currentAdapter && currentAdapter.siteName === "gemini";
                if (cidForGate && (aiCmLoaderRunningByConv[cidForGate] || baseComplete !== true || isGeminiGate && aiCmBaseConfirmedByConv[cidForGate] !== 1)) {
                  aiCmScheduleDeferredHistWrite(cidForGate);
                } else {
                  aiCmCancelDeferredHistWrite(cidForGate || "");
                  chrome.storage.local.set(histPatch);
                }
              } catch (e) {
                swallowSoft(e, "content:processAndSend-history-write");
              }
            }
          }
          try {
            var svcS24 = getServiceKey();
            var isGeminiS24 = svcS24 === "gemini" || svcS24 === "aistudio";
            if (!isGeminiS24 && isExtensionValid() && !baseSeen && !(lastEmitConvId && currentConvB && lastEmitConvId !== currentConvB)) {
              var cidS24 = getCurrentConvId() || "";
              var msgsS24 = buildHistoryMessages();
              var histKeyS24 = "adapter|" + msgsS24.length;
              if (msgsS24.length > 0 && histKeyS24 !== lastHistoryWroteKey) {
                lastHistoryWroteKey = histKeyS24;
                adapterBaseSeen = true;
                debugLog("log", "[AI CM][trace] history-write source=adapter site=" + (currentAdapter.siteName || "") + " convId=" + cidS24 + " msgs=" + msgsS24.length);
                try {
                  if (typeof aiCmDiagLine === "function" && currentAdapter && currentAdapter.siteName === "qwen") {
                    var qUsers = 0;
                    var qAssist = 0;
                    for (var qr = 0; qr < msgsS24.length; qr++) {
                      if (msgsS24[qr] && msgsS24[qr].role === "user") qUsers++;
                      else qAssist++;
                    }
                    aiCmDiagLine("qwen-adapter", {
                      ts: Date.now(),
                      source: "adapter",
                      msgs: msgsS24.length,
                      adapterMsgs: msgsS24.length,
                      roles: qUsers + "u/" + qAssist + "a",
                      convId: cidS24 || "(none)",
                      url: String(typeof location !== "undefined" && location && location.href || ""),
                      histKey: histKeyS24,
                      sinceSpaResetMs: aiCmQwenSpaResetAt ? Date.now() - aiCmQwenSpaResetAt : -1
                    });
                  }
                } catch (eQadA) {
                }
                var histSnapshotS24 = {
                  host: window.location.hostname,
                  convId: cidS24,
                  site: currentAdapter.siteName,
                  model: lastSnapshotModelName || (ModelConfig.getModel(modelId)?.name || modelId),
                  tokens: maxTokenCount,
                  limit: displayLimit,
                  percent: percentage,
                  updatedAt: Date.now(),
                  // v81 (2.5): полный DOM-адаптер НЕ помечается low-confidence автоматически
                  isLowConfidenceBase: false,
                  messages: msgsS24
                };
                var histPatchS24 = { aiCmHistory: histSnapshotS24 };
                histPatchS24["aiCmHistory:" + window.location.hostname] = aiCmHostHistoryRecord(histSnapshotS24);
                chrome.storage.local.set(histPatchS24);
              }
            }
          } catch (eS24) {
            swallowSoft(eS24, "content:processAndSend-history-write-adapter");
          }
          if (isExtensionValid()) {
            chrome.runtime.sendMessage({
              type: "CONTEXT_UPDATE",
              data: {
                site: currentAdapter.siteName,
                model: modelId,
                modelName: ModelConfig.getModel(modelId)?.name || modelId,
                tokenCount: maxTokenCount,
                contextLimit: effectiveLimit,
                percentage,
                messageCount,
                timestamp: Date.now()
              }
            }).catch(() => {
            });
          }
        } catch (error) {
          debugLog("error", "\u041E\u0448\u0438\u0431\u043A\u0430:", error);
        }
      }
      document.addEventListener("visibilitychange", function() {
        try {
          if (document.visibilityState !== "visible") return;
          debugLog("log", "[visibility] tab-focused");
          if (!currentAdapter) return;
          if (baseSeen || lastWidgetData) {
            processAndSend();
          }
        } catch (eVis77) {
          swallowSoft(eVis77, "content:visibilitychange-refresh");
        }
      });
      var aiCmProactiveEnabled = true;
      function aiCmLoadProactiveFlag() {
        try {
          if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
          chrome.storage.local.get(["aiCmProactive"], function(data) {
            aiCmProactiveEnabled = !(data && data.aiCmProactive === false);
          });
          try {
            chrome.storage.onChanged.addListener(function(changes, areaName) {
              if (areaName === "local" && changes.aiCmProactive) {
                aiCmProactiveEnabled = changes.aiCmProactive.newValue !== false;
              }
            });
          } catch (eL) {
          }
        } catch (e) {
          debugLog("error", "[AI CM][thresholds] load flag error:", e);
        }
      }
      function sendThresholdPct(pct) {
        try {
          if (!isExtensionValid() || !aiCmProactiveEnabled) return;
          if (typeof pct !== "number" || !(pct >= 0)) return;
          var cid = lastEmitConvId || getCurrentConvId() || "";
          var siteName = currentAdapter && currentAdapter.siteName ? currentAdapter.siteName : "";
          chrome.runtime.sendMessage({
            type: "THRESHOLD_PCT",
            data: { convId: cid, site: siteName, pct }
          }).catch(function() {
          });
        } catch (e) {
          debugLog("error", "[AI CM][thresholds] send error:", e);
        }
      }
      aiCmLoadProactiveFlag();
      loadAutoExportSettings();
      loadExportHiddenSetting();
      function aiCmQwenExportBaseTrusted() {
        try {
          return !!(currentAdapter && currentAdapter.siteName === "qwen" && adapterBaseSeen === true);
        } catch (eQbt) {
          return false;
        }
      }
      function aiCmAutoExportTrustedBase() {
        try {
          return !!(currentAdapter && currentAdapter.siteName === "qwen" && adapterBaseSeen === true);
        } catch (eAtb) {
          return false;
        }
      }
      function aiCmAutoExportTrustedBaseDiag(trigger, cid, percentage) {
        try {
          if (typeof aiCmDiagLine !== "function") return false;
          if (!aiCmAutoExportTrustedBase()) return false;
          aiCmDiagLine("auto-export", {
            point: "maybeAutoExport",
            verdict: "fire",
            trigger,
            site: "qwen",
            convId: cid,
            pct: percentage,
            baseSeen: typeof baseSeen !== "undefined" && baseSeen === true ? 1 : 0,
            baseComplete: typeof baseComplete !== "undefined" && baseComplete === true ? 1 : 0,
            adapterBaseSeen: typeof adapterBaseSeen !== "undefined" && adapterBaseSeen === true ? 1 : 0
          });
          return true;
        } catch (eAtbd) {
          return false;
        }
      }
      if (isExtensionValid()) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === "aiCmDiag") {
            handleAiCmDiag(sendResponse);
            return true;
          }
          if (message.type === "aiCm-byok-key-changed") {
            aiCmByokKeyInvalidate();
            return true;
          }
          if (message.type === "aiCmExportCurrent") {
            var curCidExp = getCurrentConvId() || "";
            try {
              aiCmFlushLiveStreamForExport(curCidExp);
            } catch (eFlushExp) {
              swallowSoft(eFlushExp, "content:aiCmAutoExportTrustedBaseDiag-flush");
            }
            var pctExp = typeof lastPercentage === "number" && lastPercentage >= 0 ? lastPercentage : 0;
            try {
              aiCmDumpTurnsSnapshot("snapshot-at-manual", curCidExp, buildHistoryMessages());
            } catch (eDumpM) {
            }
            var replyManualExport = function() {
              var manualSnapshot = (
                /** @type {{host: string, convId: string, site: string, model: string, tokens: number, limit: number, percent: number, updatedAt: number, isLowConfidenceBase: boolean, sourceTier?: string, messages: Array<{role?: string, text?: string}>}} */
                {
                  host: window.location.hostname,
                  convId: curCidExp,
                  site: currentAdapter && currentAdapter.siteName || "",
                  model: lastSnapshotModelName || (lastResolvedModelId || ""),
                  tokens: maxTokenCount,
                  limit: computeEffectiveLimit(lastResolvedModelId),
                  percent: pctExp,
                  updatedAt: Date.now(),
                  // v1.14.1: живой флаг — ручной as-is экспорт при baseComplete=0 получает
                  // префикс [LOW CONFIDENCE]_ (options.js:378), после base-complete — без префикса.
                  isLowConfidenceBase: baseComplete !== true,
                  // Two-Tier (v89): метка достоверности источника — рядом с прочими метаданными
                  // снимка. undefined у прочих сервисов/без моста → в storage ключ не появляется,
                  // файл и ручной экспорт байтово прежние.
                  sourceTier: typeof aiCmGetSourceTier === "function" ? aiCmGetSourceTier() : void 0,
                  messages: buildHistoryMessages()
                }
              );
              if (typeof aiCmQwenExportBaseTrusted === "function" && aiCmQwenExportBaseTrusted()) {
                manualSnapshot.isLowConfidenceBase = false;
              }
              try {
                if (typeof aiCmUnionFileMessages === "function") {
                  manualSnapshot.messages = aiCmUnionFileMessages(
                    curCidExp,
                    manualSnapshot.messages,
                    manualSnapshot.isLowConfidenceBase === true
                  );
                }
              } catch (eO49m) {
                debugLog("log", "[AI CM][export] silent-catch replyManualExport(O-49 union): " + (eO49m && eO49m.message || eO49m));
              }
              sendResponse({ data: manualSnapshot });
            };
            if ((typeof aiCmExportFilesThenNetSync === "function" || typeof aiCmExportNetSyncThen === "function") && aiCmExportNetSyncSite()) {
              if (typeof aiCmExportFilesThenNetSync === "function") aiCmExportFilesThenNetSync(curCidExp, replyManualExport);
              else aiCmExportNetSyncThen(curCidExp, replyManualExport);
            } else {
              replyManualExport();
            }
            return true;
          }
          if (message.type === "GET_STATS") {
            if (currentAdapter && (isInitialized || baseSeen && baseComplete)) {
              const messages = currentAdapter.extractMessages();
              const effective = getEffectiveText();
              const fullText = effective ? effective : currentAdapter.getFullDialogText();
              const countForTokens = effective ? getEffectiveCount(messages.length) : messages.length;
              const modelId = resolveCurrentModel();
              const metricServerTokens = aiCmMetricServerTokens(currentAdapter.siteName, fullText);
              let tokenEstimate = metricServerTokens > 0 ? metricServerTokens : Tokenizer.estimateDialogTokens(fullText, countForTokens);
              if (baseComplete === true && metricServerTokens === 0 && netEffectiveLen > 0 && fullText && fullText.length > 0 && netEffectiveLen > fullText.length) {
                tokenEstimate = Math.round(tokenEstimate * (netEffectiveLen / fullText.length));
              }
              tokenEstimate += netAttachTokens;
              const displayTokens = metricServerTokens > 0 ? tokenEstimate : Math.max(tokenEstimate, maxTokenCount);
              const contextLimit = ModelConfig.getContextLimit(modelId);
              const effectiveLimit = ModelConfig.getEffectiveLimit(modelId);
              const displayLimit = computeEffectiveLimit(modelId);
              const percent = displayLimit > 0 ? Math.round(displayTokens / displayLimit * 1e3) / 10 : 0;
              sendResponse({
                data: {
                  site: currentAdapter.siteName,
                  modelName: ModelConfig.getModel(modelId)?.name || modelId,
                  tokenCount: displayTokens,
                  contextLimit: effectiveLimit,
                  percentage: percent,
                  messageCount: messages.length
                }
              });
            } else {
              sendResponse({ data: null });
            }
          }
          return true;
        });
      }
      function handleAiCmDiag(sendResponse) {
        var intercepted = null;
        var timer = null;
        function finishWithResponse() {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          try {
            chrome.storage.local.get(["aiCmHistory"], function(data) {
              var h = data.aiCmHistory;
              var sameHost = !!(h && h.host === window.location.hostname);
              var meta = sameHost ? {
                host: h.host,
                model: h.model || "",
                tokens: typeof h.tokens === "number" ? h.tokens : 0,
                percent: typeof h.percent === "number" ? h.percent : 0,
                count: Array.isArray(h.messages) ? h.messages.length : 0
              } : {
                host: window.location.hostname,
                model: "",
                tokens: 0,
                percent: 0,
                count: 0
              };
              var historyPreviews = [];
              if (sameHost && Array.isArray(h.messages)) {
                for (var i = 0; i < h.messages.length; i++) {
                  var msg = h.messages[i] || {};
                  historyPreviews.push((msg.role || "?") + "|" + String(msg.text || "").slice(0, 60).replace(/\s+/g, " "));
                }
              }
              var diag = {
                generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
                url: window.location.href,
                logsContent: typeof __aiCmGetLogRing === "function" ? __aiCmGetLogRing() : [],
                aiCmHistoryMeta: meta,
                historyPreviews,
                intercept: intercepted || null
              };
              sendResponse({ ok: true, diag });
            });
          } catch (e) {
            sendResponse({ ok: true, diag: { generatedAt: (/* @__PURE__ */ new Date()).toISOString(), url: window.location.href, logsContent: [], aiCmHistoryMeta: null, historyPreviews: [], intercept: intercepted } });
          }
        }
        function onResponse(ev) {
          try {
            intercepted = ev && ev.detail || null;
          } catch (e) {
            intercepted = null;
          }
          finishWithResponse();
        }
        window.addEventListener("ai-cm-diag-response", onResponse);
        timer = setTimeout(finishWithResponse, 900);
        try {
          window.dispatchEvent(new CustomEvent("ai-cm-diag-request"));
        } catch (e) {
        }
      }
      function applyDebugLogs(v) {
        __aiCmSetDebugLogs(v);
        try {
          window.dispatchEvent(new CustomEvent("ai-cm-debug-logs", { detail: !!v }));
        } catch (e) {
        }
      }
      if (isExtensionValid()) {
        try {
          chrome.storage.local.get(["aiCmDebugLogs"], function(data) {
            applyDebugLogs(data.aiCmDebugLogs === true);
          });
          chrome.storage.onChanged.addListener(function(changes, areaName) {
            if (areaName === "local" && changes.aiCmDebugLogs) {
              applyDebugLogs(changes.aiCmDebugLogs.newValue === true);
            }
          });
        } catch (e) {
        }
      }
      (function() {
        try {
          if (!window.location.hostname.includes("claude.ai")) return;
          var pasteOrigin = "/";
          try {
            var oOrig = window.location.origin;
            if (typeof oOrig === "string" && oOrig && oOrig !== "null") pasteOrigin = oOrig;
          } catch (eO) {
            pasteOrigin = "/";
          }
          document.addEventListener("paste", function(e) {
            try {
              var t = e.clipboardData && e.clipboardData.getData("text");
              if (t && String(t).trim()) {
                window.postMessage({ source: "ai-cm-paste", text: String(t).slice(0, 5e5) }, pasteOrigin);
                debugLog("log", "[AI CM][Claude][pasted] paste-capture len=" + t.length);
                debugLog("log", "[AI CM][Claude][pasted] paste-send len=" + t.length);
              }
            } catch (e2) {
            }
          }, true);
        } catch (e) {
        }
      })();
      setTimeout(() => initialize(), 1500);
      scheduleStaleCheck();
      document.addEventListener("keydown", function(e) {
        if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
          e.preventDefault();
          var turns = [];
          for (var i = 0; i < lastBaseIds.length; i++) {
            var t = lastBaseTexts[i] || "";
            turns.push({
              id: lastBaseIds[i],
              len: t.length,
              preview: t.slice(0, 60).replace(/\s+/g, " ")
            });
          }
          var payload = {
            convId: (location.pathname.match(/\/app\/(?!prompts(?:\/|$)|new(?:\/|$)|apikey(?:\/|$))([A-Za-z0-9_-]+)/) || [])[1] || "",
            count: lastBaseIds.length,
            turns
          };
          var dumpFile = "ai-cm-history-" + Date.now() + ".json";
          try {
            var BdiagHot = typeof window !== "undefined" && window && window.AiCmExportBuilders ? window.AiCmExportBuilders : null;
            if (BdiagHot && typeof BdiagHot.aiCmDiagDownload === "function") {
              BdiagHot.aiCmDiagDownload("hotkey-json-dump", JSON.stringify(payload, null, 2), dumpFile, {
                site: typeof currentAdapter !== "undefined" && currentAdapter && currentAdapter.siteName || "",
                threadId: typeof aiCmDomThreadId === "function" ? aiCmDomThreadId() : ""
              });
            }
          } catch (eDiagHot) {
          }
          try {
            var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = dumpFile;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function() {
              URL.revokeObjectURL(url);
            }, 1e3);
            console.log("[byok-dump] \u0434\u0430\u043C\u043F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441\u043A\u0430\u0447\u0430\u043D: " + payload.count + " \u0445\u043E\u0434\u043E\u0432");
          } catch (err) {
            aiCmDiagWarn("content:byok-dump", "[byok-dump] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u0430\u0447\u0430\u0442\u044C \u0434\u0430\u043C\u043F:", err);
          }
        }
      });
      if (isExtensionValid()) {
        chrome.storage.onChanged.addListener((changes) => {
          if (changes.showWidget) {
            if (changes.showWidget.newValue === false) {
              const widget = document.getElementById("ai-context-widget");
              if (widget) widget.remove();
              widgetElement = null;
              aiCmStopThemePoll();
            } else {
              createWidget();
              if (lastWidgetData) {
                updateWidget(
                  lastWidgetData.percentage,
                  lastWidgetData.tokenEstimate,
                  lastWidgetData.effectiveLimit,
                  lastWidgetData.contextLimit,
                  lastWidgetData.displayLimit,
                  lastWidgetData.modelName,
                  lastWidgetData.attachBreak
                );
              }
            }
          }
          const sk = safePctKey();
          if (changes[sk]) {
            const v = changes[sk].newValue;
            safePct = typeof v === "number" && v > 0 ? v : null;
            updatePanel();
            if (isInitialized) processAndSend();
          }
          try {
            var cidArcCh = getCurrentConvId() || "";
            if (cidArcCh) {
              var archKeyCh = AI_ARCHIVE_PREFIX + cidArcCh;
              var srcKeyCh = AI_CONV_SOURCE_PREFIX + cidArcCh;
              if (changes[archKeyCh] || changes[srcKeyCh]) {
                delete aiCmArchiveRestoredDispatched[cidArcCh];
                aiCmLoadArchiveTier(cidArcCh, "storage-changed");
              }
            }
          } catch (eArcCh) {
          }
          if (changes.selectedModel || changes.customLimit) {
            if (changes.selectedModel) popupRawModel = changes.selectedModel.newValue;
            if (changes.customLimit) popupRawPct = changes.customLimit.newValue;
            aiCmRefreshPopupOverrides();
          }
          try {
            var perSiteChKey = null;
            for (var chPsKey in changes) {
              if (chPsKey.indexOf("aiCmAutoExportPct_") === 0) {
                perSiteChKey = chPsKey;
                break;
              }
            }
            if (perSiteChKey) {
              var siteCh = perSiteChKey.slice("aiCmAutoExportPct_".length);
              var nvPs = changes[perSiteChKey].newValue;
              var nPs = parseInt(nvPs, 10);
              autoExportPctBySite[siteCh] = !isNaN(nPs) && nPs >= 1 && nPs <= 100 ? nPs : void 0;
              debugLog("log", "[AI CM][auto-export] per-site onChanged " + perSiteChKey + "=" + (autoExportPctBySite[siteCh] === void 0 ? "\u043D\u0435\u0442 (\u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u0444\u043E\u043B\u0431\u044D\u043A)" : autoExportPctBySite[siteCh]));
              if (isInitialized && typeof autoExportLastPct === "number" && autoExportLastPct >= 0) {
                maybeAutoExport(autoExportLastPct);
              }
            }
          } catch (ePerSite) {
            swallowSoft(ePerSite, "content:storage-onchanged-per-site");
          }
          if (changes.ai_cm_exact_token_count || changes.ai_cm_gemini_api_key) {
            loadByokSettings();
            lastCountTokensText = "";
            lastCountTokensCache = 0;
            lastCountTokensConvId = "";
            lastCountTokensErrorText = "";
            netServerTokens = 0;
            if (isInitialized) processAndSend();
          }
        });
      }
    }
  });
  require_content();
})();
//# sourceMappingURL=content.js.map
