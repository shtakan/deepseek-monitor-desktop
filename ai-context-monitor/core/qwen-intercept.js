(() => {
  // utils/stream-frames.js
  function splitJsonObjects(s) {
    var out = [], depth = 0, start = -1, inStr = false, esc = false;
    var str = String(s == null ? "" : s);
    for (var i = 0; i < str.length; i++) {
      var c = str.charAt(i);
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") {
        if (depth++ === 0) start = i;
      } else if (c === "}") {
        if (--depth === 0 && start >= 0) {
          out.push(str.slice(start, i + 1));
          start = -1;
        }
      }
    }
    return out;
  }
  var TEXT_DECODER = (function() {
    try {
      if (typeof TextDecoder !== "undefined") return TextDecoder;
    } catch (eG) {
    }
    return null;
  })();
  function makeDecodeStream() {
    var dec = null;
    if (TEXT_DECODER) {
      try {
        dec = new TEXT_DECODER();
      } catch (eNew) {
        dec = null;
      }
    }
    if (dec) {
      return {
        text: function(v, stream) {
          return dec.decode(v, { stream: stream === true });
        },
        flush: function() {
          return dec.decode();
        }
      };
    }
    var pending = [];
    function asBytes(v) {
      try {
        if (typeof v === "string") return null;
        if (v && typeof v.length === "number") return v;
        if (v && typeof v.byteLength === "number") return new Uint8Array(v);
      } catch (eB) {
      }
      return null;
    }
    function seqLen(b) {
      if (b < 128) return 1;
      if (b >= 194 && b <= 223) return 2;
      if (b >= 224 && b <= 239) return 3;
      if (b >= 240 && b <= 244) return 4;
      return 1;
    }
    function decodeNative(v) {
      var b = asBytes(v);
      if (!b) return String(v);
      var bytes = pending.length ? pending.concat(Array.prototype.slice.call(b)) : Array.prototype.slice.call(b);
      pending = [];
      var out = "";
      var i = 0;
      while (i < bytes.length) {
        var n = seqLen(bytes[i]);
        if (i + n > bytes.length) {
          pending = bytes.slice(i);
          break;
        }
        var cp;
        if (n === 1) cp = bytes[i];
        else if (n === 2) cp = (bytes[i] & 31) << 6 | bytes[i + 1] & 63;
        else if (n === 3) cp = (bytes[i] & 15) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
        else cp = (bytes[i] & 7) << 18 | (bytes[i + 1] & 63) << 12 | (bytes[i + 2] & 63) << 6 | bytes[i + 3] & 63;
        if (cp > 65535) {
          cp -= 65536;
          out += String.fromCharCode(55296 + (cp >> 10), 56320 + (cp & 1023));
        } else {
          out += String.fromCharCode(cp);
        }
        i += n;
      }
      return out;
    }
    return {
      text: function(v) {
        return decodeNative(v);
      },
      flush: function() {
        var rest = pending;
        pending = [];
        var out = "";
        for (var i = 0; i < rest.length; i++) out += String.fromCharCode(rest[i]);
        return out;
      }
    };
  }
  async function* framesNative(res, dec) {
    var ct = "";
    try {
      if (res && res.headers && typeof res.headers.get === "function") ct = String(res.headers.get("content-type") || "").toLowerCase();
    } catch (eCt) {
      ct = "";
    }
    var isSSE = ct.indexOf("event-stream") !== -1;
    var reader = res && res.body && typeof res.body.getReader === "function" ? res.body.getReader() : null;
    if (!reader) return;
    var buf = "";
    if (!isSSE) {
      var all = "";
      while (true) {
        var r0 = await reader.read();
        if (!r0 || r0.done) break;
        all += dec.text(r0.value, true);
      }
      all += dec.flush();
      var trimmed = all.trim();
      if (!trimmed) return;
      if (trimmed.charAt(0) === "[") {
        var arr = null;
        try {
          arr = JSON.parse(trimmed);
        } catch (eArr) {
          arr = null;
        }
        if (arr && typeof arr.length === "number") {
          for (var ai = 0; ai < arr.length; ai++) yield { data: JSON.stringify(arr[ai]) };
        }
      } else {
        var glued = splitJsonObjects(trimmed);
        for (var gi = 0; gi < glued.length; gi++) yield { data: glued[gi] };
      }
      return;
    }
    var pendingEvent = null;
    while (true) {
      var r1 = await reader.read();
      if (!r1 || r1.done) break;
      buf += dec.text(r1.value, true);
      var idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        var line = buf.slice(0, idx);
        if (line.charAt(line.length - 1) === "\r") line = line.slice(0, -1);
        buf = buf.slice(idx + 1);
        if (!line) {
          pendingEvent = null;
          continue;
        }
        if (line.charAt(0) === ":") continue;
        var ev = /^event:\s?(.*)$/.exec(line);
        if (ev) {
          pendingEvent = ev[1];
          continue;
        }
        var d = /^data:\s?(.*)$/.exec(line);
        if (d) yield { event: pendingEvent, data: d[1] };
      }
    }
    var tail = buf;
    if (tail.charAt(tail.length - 1) === "\r") tail = tail.slice(0, -1);
    var dt = /^data:\s?(.*)$/.exec(tail);
    if (dt) yield { event: pendingEvent, data: dt[1] };
  }
  var framesDecodeStream = makeDecodeStream();
  function frames(res) {
    return framesNative(res, framesDecodeStream);
  }
  function num() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === "number") return arguments[i];
    }
    return null;
  }
  function pick(obj, key) {
    try {
      return obj && typeof obj === "object" ? obj[key] : void 0;
    } catch (e) {
      return void 0;
    }
  }
  function normalizeUsage(u) {
    if (!u || typeof u !== "object") return null;
    return {
      input: num(u.input_tokens, u.prompt_tokens, u.promptTokenCount),
      output: num(u.output_tokens, u.completion_tokens, u.candidatesTokenCount),
      total: num(u.total_tokens, u.totalTokenCount),
      reasoning: num(
        pick(u.output_tokens_details, "reasoning_tokens"),
        pick(u.completion_tokens_details, "reasoning_tokens"),
        u.thoughtsTokenCount
      ),
      cached: num(
        pick(u.prompt_tokens_details, "cached_tokens"),
        u.cache_read_input_tokens,
        u.cachedContentTokenCount
      )
    };
  }
  function mergeUsage(prev, next, cumulative) {
    if (!next) return prev;
    if (!prev) {
      var copy = {};
      for (var k0 in next) {
        if (Object.prototype.hasOwnProperty.call(next, k0)) copy[k0] = next[k0];
      }
      return copy;
    }
    var out = {};
    for (var k1 in prev) {
      if (Object.prototype.hasOwnProperty.call(prev, k1)) out[k1] = prev[k1];
    }
    for (var k2 in next) {
      if (!Object.prototype.hasOwnProperty.call(next, k2)) continue;
      var v = next[k2];
      if (v === null || v === void 0) continue;
      out[k2] = cumulative ? v : (typeof out[k2] === "number" ? out[k2] : 0) + v;
    }
    return out;
  }

  // core/qwen-intercept.js
  (function() {
    if (window.__aiCmQwenInterceptInstalled) return;
    window.__aiCmQwenInterceptInstalled = true;
    var DEBUG_LOGS = false;
    var GATE_SEEN = false;
    try {
      window.addEventListener("ai-cm-debug-logs", function(ev) {
        DEBUG_LOGS = !!(ev && ev.detail);
        GATE_SEEN = true;
        try {
          if (typeof __aiCmSetDebugLogs === "function") __aiCmSetDebugLogs(!!(ev && ev.detail));
        } catch (eCanon) {
        }
        flushDiagRing();
      });
    } catch (eGate) {
    }
    var originalFetch = window.fetch;
    var REASONING_TAG = "[REASONING]";
    var ANSWER_TAG = "[ANSWER]";
    var FILE_ONLY_PLACEHOLDER = "[\u0412\u043B\u043E\u0436\u0435\u043D\u0438\u0435]";
    var PHASE_THINKING = "thinking_summary";
    var PHASE_ANSWER = "answer";
    function diagOn() {
      try {
        if (typeof sessionStorage !== "undefined" && sessionStorage && sessionStorage.getItem("aiCmDebug") === "1") return true;
      } catch (eSess) {
      }
      return DEBUG_LOGS === true;
    }
    var DIAG_RING_MAX = 50;
    var diagRing = [];
    var diagLineCount = 0;
    function diagLine(tag, fields) {
      emitDiag("qwen-" + tag, fields);
    }
    function diagTag(fullTag, fields) {
      emitDiag(fullTag, fields);
    }
    function emitDiag(fullTag, fields) {
      if (diagOn()) {
        printDiag(fullTag, fields);
        return;
      }
      if (GATE_SEEN) return;
      try {
        diagRing.push([fullTag, fields]);
        if (diagRing.length > DIAG_RING_MAX) diagRing.shift();
      } catch (eRing) {
      }
    }
    function printDiag(fullTag, fields) {
      try {
        var f = fields || {};
        diagLineCount++;
        if (typeof aiCmDiagLine === "function") {
          aiCmDiagLine(fullTag, f);
          return;
        }
        var parts = [];
        for (var k in f) {
          if (!Object.prototype.hasOwnProperty.call(f, k)) continue;
          var v = f[k];
          parts.push(k + "=" + (v === void 0 || v === null ? "(\u043D\u0435\u0442)" : String(v)));
        }
        console.log("[AI CM][diag] " + fullTag + " " + parts.join(" "));
      } catch (ePrint) {
      }
    }
    function flushDiagRing() {
      if (!diagOn()) {
        diagRing = [];
        return;
      }
      try {
        for (var i = 0; i < diagRing.length; i++) printDiag(diagRing[i][0], diagRing[i][1]);
      } catch (eFlush) {
      }
      diagRing = [];
    }
    function diagUrl() {
      try {
        return String(typeof location !== "undefined" && location && location.href || "");
      } catch (eU) {
        return "";
      }
    }
    function urlOf(input) {
      try {
        if (typeof input === "string") return input;
        if (input && typeof input.url === "string") return input.url;
      } catch (eUrl) {
      }
      return "";
    }
    function methodOf(init, input) {
      try {
        if (init && init.method) return String(init.method).toUpperCase();
        if (input && typeof input.method === "string") return String(input.method).toUpperCase();
      } catch (eM) {
      }
      return "GET";
    }
    var QWEN_COMPLETIONS_RE = /\/api\/v\d+\/chat\/completions(\?|$|\/)/;
    function isQwenCompletions(url, method) {
      if (method !== "POST") return false;
      return QWEN_COMPLETIONS_RE.test(url);
    }
    var QWEN_HISTORY_RE = /\/api\/v\d+\/chats\/([A-Za-z0-9_-]+)(?:[?#]|$)/;
    var QWEN_HISTORY_NOT_ID = { "new": true, "list": true, "folders": true, "tags": true, "models": true };
    function isQwenHistory(url, method) {
      if (method !== "GET") return false;
      var id = historyChatIdFromUrl(url);
      return !!id && QWEN_HISTORY_NOT_ID[id] !== true;
    }
    function historyChatIdFromUrl(url) {
      try {
        var m = QWEN_HISTORY_RE.exec(String(url || ""));
        if (m && m[1]) return decodeURIComponent(m[1]);
      } catch (eQh) {
      }
      return "";
    }
    function chatIdFromUrl(url) {
      try {
        var m = /[?&]chat_id=([^&]+)/.exec(url);
        if (m) return decodeURIComponent(m[1]);
      } catch (eQ) {
      }
      return "";
    }
    function chrOf(url) {
      try {
        var m = /\/c\/([A-Za-z0-9_-]+)/.exec(String(location.pathname || ""));
        if (m) return m[1];
      } catch (eC) {
      }
      return "";
    }
    var currentChatId = chrOf();
    var lastReqChatId = "";
    var aiCmQwenFiles = typeof window !== "undefined" && window.AiCmQwenFiles ? window.AiCmQwenFiles : null;
    var SF = { frames, normUsage: normalizeUsage, mergeUsage };
    var lastEmitMeta = { tokens: 0, complete: true, chatId: "", responseId: "" };
    var sse = null;
    var turns = [];
    var userTurns = [];
    var turnSeq = 0;
    var dispatchSig = null;
    var lastDispatchResult = false;
    function beginStream(meta) {
      sse = {
        chatId: meta.chatId || "",
        url: meta.url || "",
        // только для диагностики qwen-sse (в detail не уходит)
        userPrompt: meta.userPrompt || "",
        userKey: meta.userKey || "",
        parentId: meta.parentId || "",
        model: meta.model || "",
        responseId: "",
        reasoning: "",
        answer: "",
        usage: null,
        // нормализованный, кумулятивный → mergeUsage(prev,next,true)
        rawUsage: null,
        // последний сырой usage-объект кадра (для серверных полей)
        usageFrames: 0,
        frames: 0,
        reasoningFrames: 0,
        answerFrames: 0,
        ended: false,
        finished: false
      };
    }
    function applyMeta(obj) {
      if (!sse) return;
      var meta = obj["response.created"];
      if (!meta || typeof meta !== "object") return;
      if (typeof meta.response_id === "string" && meta.response_id) sse.responseId = meta.response_id;
      if (typeof meta.chat_id === "string" && meta.chat_id) sse.chatId = meta.chat_id;
      if (typeof meta.parent_id === "string") sse.parentId = meta.parent_id;
      diagLine("response-created", {
        chat: String(sse.chatId || "").slice(0, 8),
        response: String(sse.responseId || "").slice(0, 8),
        parent: String(sse.parentId || "").slice(0, 8)
      });
    }
    function applyUsage(obj) {
      if (!sse || !obj || !obj.usage || typeof obj.usage !== "object") return;
      var next = normalizeUsage(obj.usage);
      if (!next) return;
      sse.usage = mergeUsage(sse.usage, next, true);
      sse.rawUsage = obj.usage;
      sse.usageFrames++;
      diagLine("usage", {
        frame: sse.usageFrames,
        input: next.input,
        output: next.output,
        total: next.total,
        reasoning: next.reasoning,
        cached: next.cached
      });
    }
    function applyDelta(obj) {
      if (!sse) return;
      var choices = obj.choices;
      var d = choices && choices[0] && choices[0].delta ? choices[0].delta : null;
      if (!d || typeof d !== "object") return;
      if (d.phase === PHASE_THINKING) {
        var extra = d.extra;
        var thought = extra && extra.summary_thought ? extra.summary_thought.content : null;
        if (Array.isArray(thought)) {
          sse.reasoning = thought.join("");
          sse.reasoningFrames++;
          diagLine("reasoning-replace", { items: thought.length, len: sse.reasoning.length });
        }
        return;
      }
      if (typeof d.content === "string" && d.content) {
        sse.answer += d.content;
        sse.answerFrames++;
      }
    }
    function feedFrame(f) {
      if (!sse || f.data == null) return;
      var raw = String(f.data).trim();
      if (!raw) return;
      if (raw === "[DONE]") {
        endStream("done-marker");
        return;
      }
      var obj = null;
      try {
        obj = JSON.parse(raw);
      } catch (eParse) {
        swallow(eParse, "qwen:feed-frame-parse");
        return;
      }
      if (!obj || typeof obj !== "object") return;
      sse.frames++;
      applyMeta(obj);
      applyUsage(obj);
      applyDelta(obj);
    }
    function consumeStream(resp, meta) {
      beginStream(meta);
      diagLine("consume-enter", { chat: String(meta.chatId || "").slice(0, 8) });
      var clone = null;
      try {
        clone = resp.clone();
      } catch (eClone) {
        clone = null;
      }
      if (!clone) {
        diagLine("stream-skip", { reason: "clone-failed", fallback: "dom" });
        sse = null;
        return;
      }
      if (!clone.body || typeof clone.body.getReader !== "function") {
        diagLine("stream-skip", { reason: "no-reader", fallback: "dom" });
        sse = null;
        return;
      }
      Promise.resolve().then(function() {
        return readFrames(clone);
      }).then(function() {
        endStream("body-end");
      }).catch(function(eRead) {
        diagLine("stream-error", { err: String(eRead && eRead.message || eRead).slice(0, 80) });
        endStream("read-error");
      });
    }
    function readFrames(resp) {
      var iterator = SF.frames(resp);
      if (!iterator || typeof iterator.next !== "function") return Promise.resolve();
      var stopped = false;
      function step() {
        if (stopped) return Promise.resolve();
        return iterator.next().then(function(r) {
          if (!r || r.done) return;
          feedFrame(r.value);
          if (sse === null || sse && sse.ended) {
            stopped = true;
            if (typeof iterator.return === "function") {
              try {
                iterator.return();
              } catch (eRet) {
              }
            }
            return;
          }
          return step();
        });
      }
      return step();
    }
    function endStream(reason) {
      if (!sse || sse.ended) return;
      sse.ended = true;
      var s = sse;
      sse = null;
      diagLine("stream-end", {
        reason,
        frames: s.frames,
        answerFrames: s.answerFrames,
        reasoningFrames: s.reasoningFrames,
        answerLen: s.answer.length,
        reasoningLen: s.reasoning.length
      });
      diagTag("qwen-sse", {
        ts: Date.now(),
        event: "stream-end",
        reason,
        url: s.url || "",
        frames: s.frames,
        usageFrames: s.usageFrames,
        hasUsage: s.usage && typeof s.usage.input === "number" ? 1 : 0,
        serverTokens: s.usage && typeof s.usage.input === "number" ? s.usage.input : 0,
        output: s.usage && typeof s.usage.output === "number" ? s.usage.output : 0,
        total: s.usage && typeof s.usage.total === "number" ? s.usage.total : 0,
        reasoning: s.usage && typeof s.usage.reasoning === "number" ? s.usage.reasoning : 0
      });
      if (!s.answer && !s.reasoning) {
        diagLine("emit-skip", { reason: "empty-stream" });
        return;
      }
      try {
        recordTurn(s);
      } catch (eRec) {
        diagLine("record-error", { err: String(eRec && eRec.message || eRec).slice(0, 80) });
        return;
      }
      emitSnapshot(s);
    }
    function composeTurnText(answer, reasoning) {
      if (!reasoning) return answer;
      return REASONING_TAG + "\n" + reasoning + "\n\n" + ANSWER_TAG + "\n" + answer;
    }
    function recordTurn(s) {
      var chatId = s.chatId || lastReqChatId || currentChatId || "";
      var userKey = s.userKey || (s.parentId ? "p:" + s.parentId : "");
      if (s.userPrompt && userKey) {
        var known = false;
        for (var u = 0; u < userTurns.length; u++) {
          if (userTurns[u].key === userKey) {
            known = true;
            break;
          }
        }
        if (!known) userTurns.push({ key: userKey, text: s.userPrompt });
      }
      var key = s.responseId || chatId + "#" + turnSeq;
      turnSeq++;
      var existing = null;
      for (var i = 0; i < turns.length; i++) {
        if (turns[i].key === key) {
          existing = turns[i];
          break;
        }
      }
      var model = s.model || "";
      if (existing) {
        existing.answer = s.answer;
        existing.reasoning = s.reasoning;
        existing.text = composeTurnText(s.answer, s.reasoning);
        existing.userKey = existing.userKey || userKey;
        existing.filesOnly = s.filesOnly === true && !s.answer && !s.reasoning;
        return { turn: existing, created: false };
      }
      var fileOnly = null;
      if (userKey) {
        for (var fi = 0; fi < turns.length; fi++) {
          var fc = turns[fi];
          if (fc && fc.filesOnly === true && typeof fc.key === "string" && fc.key.indexOf("file-only:") === 0 && fc.userKey === userKey) {
            fileOnly = fc;
            break;
          }
        }
      }
      if (fileOnly) {
        fileOnly.key = key;
        fileOnly.model = model || fileOnly.model;
        fileOnly.answer = s.answer || "";
        fileOnly.reasoning = s.reasoning || "";
        fileOnly.text = composeTurnText(fileOnly.answer, fileOnly.reasoning);
        fileOnly.filesOnly = s.filesOnly === true && !s.answer && !s.reasoning;
        return { turn: fileOnly, created: false };
      }
      if (s.filesOnly === true && userKey && key.indexOf("file-only:") === 0) {
        for (var fj = 0; fj < turns.length; fj++) {
          var fd = turns[fj];
          if (fd && fd.filesOnly === true && fd.userKey === userKey) {
            return { turn: fd, created: false };
          }
        }
      }
      var maxOrder = -1;
      for (var oi = 0; oi < turns.length; oi++) {
        if (typeof turns[oi].order === "number" && turns[oi].order > maxOrder) maxOrder = turns[oi].order;
      }
      var added = {
        key,
        order: maxOrder + 1,
        model,
        userKey,
        answer: s.answer,
        reasoning: s.reasoning,
        text: composeTurnText(s.answer, s.reasoning),
        filesOnly: s.filesOnly === true
      };
      turns.push(added);
      return { turn: added, created: true };
    }
    function contentListOf(node) {
      if (!node || typeof node !== "object") return null;
      if (Array.isArray(node.content_list)) return node.content_list;
      if (Array.isArray(node.contentList)) return node.contentList;
      return null;
    }
    function isHistoryMessageNode(node) {
      if (!node || typeof node !== "object" || Array.isArray(node)) return false;
      var role = node.role;
      if (role !== "user" && role !== "assistant" && role !== "system") return false;
      var list = contentListOf(node);
      if (list && list.length) return true;
      if (Array.isArray(node.files) && node.files.length) return true;
      return typeof node.content === "string" || typeof node.text === "string";
    }
    function walkHistoryMessages(node, out, depth, visited) {
      if (!node || typeof node !== "object" || depth > 12) return;
      for (var v = 0; v < visited.length; v++) {
        if (visited[v] === node) return;
      }
      visited.push(node);
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) walkHistoryMessages(node[i], out, depth + 1, visited);
        return;
      }
      if (isHistoryMessageNode(node)) out.push(node);
      for (var key in node) {
        if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
        var child = node[key];
        if (child && typeof child === "object") walkHistoryMessages(child, out, depth + 1, visited);
      }
    }
    function historyMessageId(node, role) {
      if (!node || typeof node !== "object") return "";
      var keys = role === "user" ? ["fid", "id", "message_id", "msg_id", "uuid"] : ["response_id", "responseId", "message_id", "msg_id", "uuid", "id", "fid"];
      for (var i = 0; i < keys.length; i++) {
        var v = node[keys[i]];
        if (typeof v === "string" && v) return v;
        if (typeof v === "number") return String(v);
      }
      return "";
    }
    function thinkingTextOf(item) {
      var extras = item.extras || item.extra || null;
      var thought = extras && extras.summary_thought ? extras.summary_thought.content : null;
      if (Array.isArray(thought)) {
        var parts = [];
        for (var j = 0; j < thought.length; j++) {
          var p = thought[j];
          if (typeof p === "string" && p) parts.push(p);
          else if (p && typeof p === "object" && typeof p.content === "string" && p.content) parts.push(p.content);
        }
        return parts.join("\n\n");
      }
      if (typeof thought === "string" && thought) return thought;
      if (typeof item.content === "string" && item.content) return item.content;
      return "";
    }
    function historyThinkingOf(list) {
      var first = null;
      var firstWithText = "";
      var occurrences = 0;
      for (var i = 0; i < list.length; i++) {
        var item = typeof qwenThinkingItem === "function" ? qwenThinkingItem(list[i]) : list[i];
        if (!item || typeof item !== "object") continue;
        if (item.phase !== PHASE_THINKING) continue;
        occurrences++;
        if (!first) first = item;
        if (!firstWithText) firstWithText = thinkingTextOf(item);
      }
      if (!first) return { text: "", occurrences: 0 };
      return { text: firstWithText || thinkingTextOf(first), occurrences };
    }
    function historyAnswerOf(list) {
      var out = "", fallbackAnswer = "";
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item || typeof item !== "object") continue;
        if (item.phase === PHASE_THINKING || item.phase === "thinking") continue;
        if (typeof item.content === "string" && item.content) {
          if (item.phase === "answer") out += item.content;
          else fallbackAnswer += item.content;
        }
      }
      return out || fallbackAnswer;
    }
    function historyUsageOf(node) {
      var raw = node && node.usage && typeof node.usage === "object" ? node.usage : null;
      if (!raw) return null;
      var norm = normalizeUsage(raw);
      if (norm) return norm;
      return {
        input: typeof raw.input_tokens === "number" ? raw.input_tokens : null,
        output: typeof raw.output_tokens === "number" ? raw.output_tokens : null,
        total: typeof raw.total_tokens === "number" ? raw.total_tokens : null,
        reasoning: null,
        cached: null
      };
    }
    function historyChatIdOf(node) {
      if (!node || typeof node !== "object") return "";
      var keys = ["chat_id", "chatId"];
      for (var i = 0; i < keys.length; i++) {
        if (typeof node[keys[i]] === "string" && node[keys[i]]) return node[keys[i]];
      }
      return "";
    }
    function findHistoryChatId(node, depth, visited) {
      if (!node || typeof node !== "object" || depth > 4) return "";
      for (var v = 0; v < visited.length; v++) {
        if (visited[v] === node) return "";
      }
      visited.push(node);
      var direct = historyChatIdOf(node);
      if (direct) return direct;
      for (var key in node) {
        if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
        var child = node[key];
        if (child && typeof child === "object") {
          var found = findHistoryChatId(child, depth + 1, visited);
          if (found) return found;
        }
      }
      return "";
    }
    function historyFilesOf(node) {
      var out = [];
      try {
        if (!node || typeof node !== "object") return out;
        var list = Array.isArray(node.files) ? node.files : [];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && typeof list[i] === "object") out.push(list[i]);
        }
        if (!out.length) {
          var cl = contentListOf(node) || [];
          for (var j = 0; j < cl.length; j++) {
            var c = cl[j];
            if (c && typeof c === "object" && typeof c.url === "string" && c.url) out.push(c);
          }
        }
      } catch (eFiles) {
        swallow(eFiles, "qwen:history-files");
      }
      return out;
    }
    function parseQwenHistory(payload) {
      var nodes = [], chain = false, fullParsed = typeof qwenParseFullChain === "function" ? qwenParseFullChain(payload) : null;
      if (fullParsed && fullParsed.nodes && fullParsed.nodes.length) {
        nodes = fullParsed.nodes;
        chain = true;
      } else {
        try {
          walkHistoryMessages(payload, nodes, 0, []);
        } catch (eWalk) {
          nodes = [];
        }
      }
      var messages = [];
      var seen = {};
      var chatId = "";
      var duplicates = 0;
      var thinkingDuplicates = 0;
      var reasoningMessages = 0;
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.offChain === true) continue;
        var role = node.role === "user" ? "user" : node.role === "assistant" ? "assistant" : "";
        if (!role) continue;
        if (!chatId) chatId = historyChatIdOf(node);
        var list = contentListOf(node) || [];
        var thinking = historyThinkingOf(list);
        var nodeReasoning = typeof qwenReasoningOf === "function" ? qwenReasoningOf(node) : "";
        if (thinking.occurrences > 1) thinkingDuplicates++;
        var text = historyAnswerOf(list);
        if (!text && typeof node.content === "string") text = node.content;
        if (!text && typeof node.text === "string") text = node.text;
        var id = historyMessageId(node, role);
        var dedupeKey = id || role + "\0" + text + "\0" + (nodeReasoning || thinking.text);
        if (seen[dedupeKey] === 1) {
          duplicates++;
          continue;
        }
        seen[dedupeKey] = 1;
        if (nodeReasoning || thinking.text) reasoningMessages++;
        messages.push({
          key: id,
          role,
          text,
          reasoning: nodeReasoning || thinking.text,
          usage: historyUsageOf(node),
          model: typeof node.model === "string" ? node.model : "",
          parentId: typeof node.parent_id === "string" ? node.parent_id : typeof node.parentId === "string" ? node.parentId : "",
          // R2: вложения хода. Уходят в core/qwen-files.js уже на recordTurn (ниже).
          files: historyFilesOf(node)
        });
      }
      if (!chatId) chatId = findHistoryChatId(payload, 0, []) || (payload && payload.data && payload.data.id || "");
      return {
        chatId,
        messages,
        nodes: nodes.length,
        duplicates,
        thinkingDuplicates,
        reasoningMessages,
        chain
      };
    }
    function applyHistoryPayload(payload, meta) {
      var m = meta || {};
      var pgRaw = payload && payload.data && payload.data.chat && payload.data.chat.history ? payload.data.chat.history.pagination : null;
      var fullDoc = m.full === true || typeof isFullHistoryUrl === "function" && isFullHistoryUrl(m.url) && !pgRaw;
      if (fullHistoryBlocksPage(m.chatId || currentChatId || lastReqChatId, m.url, m)) return skipFullHistoryPage(m);
      var parsed = parseQwenHistory(payload);
      if (!parsed.messages.length) {
        diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "no-messages", url: m.url || "" });
        return { added: 0, foreign: false };
      }
      var chatId = m.chatId || parsed.chatId || currentChatId || lastReqChatId || "";
      if (chatId) {
        lastReqChatId = chatId;
        if (!currentChatId) currentChatId = chatId;
      }
      if (currentChatId && m.chatId && m.chatId !== currentChatId) {
        diagLine("skip-request", { reason: "other-chat", req: String(m.chatId).slice(0, 8) });
        diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "other-chat", url: m.url || "" });
        return { added: 0, foreign: true };
      }
      var pendingUserKey = "";
      var pendingUserText = "";
      var pendingUserFiles = [];
      var lastUsage = null;
      var lastResponseId = "";
      var lastModel = "";
      var applied = 0;
      var created = [], pageTurns = [];
      var filesOnlyTurns = 0;
      function enqueueHistoryFiles(pendingUserFiles2, rec2, source) {
        if (!pendingUserFiles2 || !pendingUserFiles2.length) return;
        if (!rec2 || !rec2.turn || !rec2.turn.userKey) return;
        if (typeof aiCmQwenFiles !== "undefined" && aiCmQwenFiles) {
          try {
            aiCmQwenFiles.qfEnqueueUserFiles(chatId, rec2.turn.userKey, pendingUserFiles2);
          } catch (eQf) {
            swallow(eQf, "qwen:files-enqueue");
          }
        }
        diagTag("qwen-history-files", {
          ts: Date.now(),
          event: "enqueue",
          chat: String(chatId || "").slice(0, 8),
          source,
          files: pendingUserFiles2.length
        });
      }
      for (var i = 0; i < parsed.messages.length; i++) {
        var msg = parsed.messages[i];
        if (msg.role === "user") {
          pendingUserKey = msg.key || "h:u:" + i;
          pendingUserText = msg.text || "";
          pendingUserFiles = Array.isArray(msg.files) ? msg.files : [];
          if (!pendingUserText.trim() && pendingUserFiles.length) {
            pendingUserText = FILE_ONLY_PLACEHOLDER;
          }
          continue;
        }
        if (msg.role !== "assistant") continue;
        var msgFiles = Array.isArray(msg.files) ? msg.files : [];
        var turnFiles = pendingUserFiles.concat(msgFiles);
        var filesOnly = !msg.text && !msg.reasoning;
        if (filesOnly && !turnFiles.length) continue;
        var fileSource = pendingUserFiles.length && msgFiles.length ? "both" : msgFiles.length ? "assistant" : "user";
        if (msg.usage) lastUsage = msg.usage;
        if (msg.key) lastResponseId = msg.key;
        if (msg.model) lastModel = msg.model;
        var rec = recordTurn({
          chatId,
          url: m.url || "",
          // responseId — ключ хода (как у стрима: response.created.response_id).
          responseId: msg.key || "",
          userPrompt: pendingUserText || (turnFiles.length ? FILE_ONLY_PLACEHOLDER : ""),
          userKey: pendingUserKey || (msg.key ? "h:" + msg.key : "h:a:" + i),
          parentId: msg.parentId || "",
          model: msg.model || "",
          reasoning: msg.reasoning || "",
          answer: msg.text || "",
          usage: msg.usage || null,
          rawUsage: null,
          usageFrames: msg.usage ? 1 : 0,
          frames: 1,
          reasoningFrames: msg.reasoning ? 1 : 0,
          answerFrames: msg.text ? 1 : 0,
          ended: true,
          finished: true,
          filesOnly
        });
        if (rec && rec.turn && rec.turn.userKey) {
          enqueueHistoryFiles(turnFiles, rec, fileSource);
        }
        if (filesOnly) filesOnlyTurns++;
        pendingUserKey = "";
        pendingUserText = "";
        pendingUserFiles = [];
        if (rec && rec.turn) {
          pageTurns.push(rec.turn);
          if (rec.created) created.push(rec);
        }
        applied++;
      }
      if (pendingUserKey && pendingUserFiles.length) {
        var recU = recordTurn({
          chatId,
          url: m.url || "",
          responseId: "file-only:" + pendingUserKey,
          userPrompt: pendingUserText || FILE_ONLY_PLACEHOLDER,
          userKey: pendingUserKey,
          parentId: "",
          model: "",
          reasoning: "",
          answer: "",
          usage: null,
          rawUsage: null,
          usageFrames: 0,
          frames: 0,
          reasoningFrames: 0,
          answerFrames: 0,
          ended: true,
          finished: true,
          filesOnly: true
        });
        if (recU && recU.turn && recU.turn.userKey) {
          enqueueHistoryFiles(pendingUserFiles, recU, "user");
        }
        if (recU && recU.turn) {
          pageTurns.push(recU.turn);
          if (recU.created) created.push(recU);
        }
        filesOnlyTurns++;
        applied++;
        pendingUserKey = "";
        pendingUserText = "";
        pendingUserFiles = [];
      }
      if (!applied) {
        diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "no-turns", url: m.url || "" });
        return { added: 0, foreign: false };
      }
      if (parsed.duplicates > 0 || parsed.thinkingDuplicates > 0) {
        diagTag("qwen-history-duplicate", {
          ts: Date.now(),
          event: "duplicate",
          url: m.url || "",
          messages: parsed.duplicates,
          thinking: parsed.thinkingDuplicates,
          nodes: parsed.nodes,
          taken: "first"
        });
      }
      if (created.length) renumberHistoryPage(pageTurns, m.paginate, m.url);
      if (fullDoc && parsed.chain === true && typeof reindexByChain === "function") reindexByChain(pageTurns);
      if (fullDoc && pq && typeof pqAbort === "function") pqAbort("full-history");
      var paginating = false, fullPending = false;
      if (!m.paginate && !fullDoc) {
        var fullStatus = typeof ensureFullHistory === "function" ? ensureFullHistory(chatId, m.url, payload, m, created.length) : false;
        fullPending = fullStatus === "pending";
        if (!fullStatus) {
          try {
            paginating = startQwenPagination(m, payload, created.length);
          } catch (eStart) {
            swallow(eStart, "qwen:paginate-start");
          }
        }
      }
      var partialFlag = m.paginate || paginating || fullPending;
      var emitted = emitSnapshot({
        chatId,
        url: m.url || "",
        model: lastModel,
        responseId: lastResponseId,
        usage: lastUsage,
        rawUsage: null,
        frames: applied,
        usageFrames: lastUsage ? 1 : 0,
        reasoningFrames: 0,
        answerFrames: 0,
        reasoning: "",
        answer: "",
        ended: true,
        finished: true,
        // O-53: неполнота ТОЛЬКО у промежуточной страницы; финал взводит pqFinish.
        complete: !partialFlag,
        partial: partialFlag ? { pages: pq ? pq.pages : 0, reason: "in-progress" } : null
      });
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "emit",
        url: m.url || "",
        chat: String(chatId || "").slice(0, 8),
        nodes: parsed.nodes,
        messages: parsed.messages.length,
        turns: applied,
        reasonings: parsed.reasoningMessages,
        duplicates: parsed.duplicates,
        thinking: parsed.thinkingDuplicates,
        filesOnly: filesOnlyTurns,
        hasUsage: lastUsage && typeof lastUsage.input === "number" ? 1 : 0,
        serverTokens: lastUsage && typeof lastUsage.input === "number" ? lastUsage.input : 0,
        emitted: emitted ? 1 : 0
      });
      return { added: created.length, foreign: false };
    }
    function consumeHistory(resp, meta) {
      var clone = null;
      try {
        clone = resp.clone();
      } catch (eClone) {
        clone = null;
      }
      if (!clone) {
        diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "clone-failed", url: meta.url || "" });
        return;
      }
      var parsedPromise = null;
      try {
        if (typeof clone.json === "function") parsedPromise = clone.json();
        else if (typeof clone.text === "function") {
          parsedPromise = clone.text().then(function(t) {
            return JSON.parse(String(t == null ? "" : t));
          });
        }
      } catch (eJson) {
        parsedPromise = null;
      }
      if (!parsedPromise || typeof parsedPromise.then !== "function") {
        diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "no-json", url: meta.url || "" });
        return;
      }
      Promise.resolve(parsedPromise).then(function(payload) {
        try {
          applyHistoryPayload(payload, meta);
        } catch (eApply) {
          diagTag("qwen-history", {
            ts: Date.now(),
            event: "error",
            url: meta.url || "",
            err: String(eApply && eApply.message || eApply).slice(0, 80)
          });
        }
      }, function(eRead) {
        diagTag("qwen-history", {
          ts: Date.now(),
          event: "skip",
          reason: "json-error",
          url: meta.url || "",
          err: String(eRead && eRead.message || eRead).slice(0, 80)
        });
      });
    }
    function consumeHistoryXhr(xhr, meta) {
      var m = meta || {};
      try {
        if (fullHistoryBlocksPage(m.chatId || currentChatId || lastReqChatId, m.url, m)) return skipFullHistoryPage(m, "xhr");
        var status = 0;
        try {
          status = Number(xhr.status) || 0;
        } catch (eXSt) {
          status = 0;
        }
        if (status && (status < 200 || status >= 300)) {
          diagLine("response-skip", { reason: "http", status });
          diagTag("qwen-history", {
            ts: Date.now(),
            event: "skip",
            reason: "http",
            status,
            url: m.url || "",
            transport: "xhr"
          });
          return;
        }
        var rt = "";
        try {
          rt = xhr.responseType == null ? "" : String(xhr.responseType);
        } catch (eXRt) {
          rt = "";
        }
        var payload = null;
        if (rt === "" || rt === "text") {
          var raw = "";
          try {
            raw = xhr.responseText;
          } catch (eXBody) {
            diagTag("qwen-history", {
              ts: Date.now(),
              event: "skip",
              reason: "body-unreadable",
              url: m.url || "",
              transport: "xhr"
            });
            return;
          }
          try {
            payload = JSON.parse(String(raw == null ? "" : raw));
          } catch (eXParse) {
            diagLine("response-error", { err: String(eXParse && eXParse.message || eXParse).slice(0, 80) });
            diagTag("qwen-history", {
              ts: Date.now(),
              event: "error",
              url: m.url || "",
              transport: "xhr",
              err: String(eXParse && eXParse.message || eXParse).slice(0, 80)
            });
            return;
          }
        } else if (rt === "json") {
          try {
            payload = xhr.response;
          } catch (eXJson) {
            payload = null;
          }
          if (payload === null || payload === void 0) {
            diagTag("qwen-history", {
              ts: Date.now(),
              event: "skip",
              reason: "no-json",
              url: m.url || "",
              transport: "xhr"
            });
            return;
          }
        } else {
          diagTag("qwen-history", {
            ts: Date.now(),
            event: "skip",
            reason: "response-type",
            responseType: rt,
            url: m.url || "",
            transport: "xhr"
          });
          return;
        }
        lastHistoryHeaders = xhr && xhr.__aiCmQwenHistHeaders ? xhr.__aiCmQwenHistHeaders : null;
        if (isFullHistoryUrl(m.url)) noteNativeFullHistory(m.chatId);
        applyHistoryPayload(payload, { chatId: m.chatId, url: m.url });
        lastHistoryHeaders = null;
      } catch (eXConsume) {
        diagTag("qwen-history", {
          ts: Date.now(),
          event: "error",
          url: m.url || "",
          transport: "xhr",
          err: String(eXConsume && eXConsume.message || eXConsume).slice(0, 80)
        });
      }
    }
    function buildSignature(serverTokens, complete, soft) {
      try {
        var parts = [String(currentChatId || ""), String(turns.length), String(serverTokens || 0)];
        parts.push("c:" + (complete === false ? 0 : 1));
        parts.push("s:" + (soft === true ? 1 : 0));
        if (typeof userTurns !== "undefined" && userTurns) parts.push("u:" + userTurns.reduce(function(n, u) {
          return n + (u && typeof u.text === "string" ? u.text.length : 0);
        }, 0));
        for (var i = 0; i < turns.length; i++) {
          var t = turns[i];
          parts.push(t.key + ":" + t.userKey + ":" + t.order + ":" + (t.text || "").length + ":" + (t.reasoning || "").length);
          if (typeof aiCmQwenFiles !== "undefined" && aiCmQwenFiles && t.userKey) {
            try {
              parts.push("f:" + aiCmQwenFiles.qfSectionLength(currentChatId, t.userKey));
            } catch (eSigSec) {
              parts.push("f:0");
            }
          }
        }
        return parts.join("|");
      } catch (eSig) {
        return null;
      }
    }
    function userTextOf(key) {
      if (!key) return "";
      for (var i = 0; i < userTurns.length; i++) {
        if (userTurns[i].key === key) return userTurns[i].text;
      }
      return "";
    }
    function emitSnapshot(s) {
      var usage = s.usage || {};
      var serverTokens = typeof usage.input === "number" && usage.input > 0 ? usage.input : 0;
      var complete = s.complete !== false;
      var sig = buildSignature(serverTokens, s.complete, s.partialSoft === true && complete === false);
      if (sig !== null && dispatchSig !== null && sig === dispatchSig) {
        diagLine("emit-skip", { reason: "same-signature" });
        return lastDispatchResult;
      }
      var pieces = [];
      var messages = [];
      var reasonings = [];
      var ids = [];
      var reasoningTurns = 0;
      var lastModel = "";
      var sortedTurns = turns.slice().sort(function(a, b) {
        return a.order - b.order;
      });
      for (var i = 0; i < sortedTurns.length; i++) {
        var t = sortedTurns[i];
        var userText = userTextOf(t.userKey);
        var fileSec = "";
        if (typeof aiCmQwenFiles !== "undefined" && aiCmQwenFiles && t.userKey) {
          try {
            fileSec = aiCmQwenFiles.qfSectionsFor(currentChatId, t.userKey) || "";
          } catch (eFileSec) {
            swallow(eFileSec, "qwen:files-sections");
          }
        }
        if (userText || fileSec) {
          var userBlock = userText ? userText + fileSec : fileSec.replace(/^\n\n/, "");
          pieces.push(userBlock);
          ids.push("u:" + t.userKey);
          messages.push({ role: "user", text: userBlock, reasoning: "" });
          reasonings.push("");
        }
        if (t.model) lastModel = t.model;
        if (!t.filesOnly || t.text) {
          pieces.push(t.text);
          ids.push(t.key);
          var msg = { role: "assistant", text: t.text, reasoning: t.reasoning || "" };
          if (t.reasoning) {
            msg.hiddenReasoning = t.reasoning;
            reasoningTurns++;
          }
          messages.push(msg);
          reasonings.push(t.reasoning || "");
        }
      }
      var text = pieces.join("\n");
      if (!text) {
        diagLine("emit-skip", { reason: "empty-text" });
        return false;
      }
      var detail = {
        convId: currentChatId || lastReqChatId || "",
        text,
        count: pieces.length,
        lastMessageText: pieces.length ? pieces[pieces.length - 1] : "",
        modelSlug: lastModel || "",
        messageTexts: pieces,
        messageIds: ids,
        messages,
        reasoningTexts: reasonings,
        reasoningTurns,
        attachTokens: 0,
        attachBreak: { imgTokens: 0, docTokens: 0, imgCount: 0, docCount: 0 },
        // O-53: полнота снимка. Живой SSE — полная база по построению (контракт O-35/O-39);
        // история может быть НЕПОЛНОЙ: базовая страница Qwen — это 10 последних турнов, старше
        // которых сервер отдаёт только по курсору (O-53 добирает их и объявляет конец сам).
        historyComplete: complete,
        reachedRoot: complete,
        // partial — диагностика неполной базы для UI/экспорта: сколько страниц добрано и почему
        // остановились (in-progress/error/no-gain/page-cap/time-cap/cursor-loop).
        partial: complete ? null : s.partial || { pages: 0, reason: "in-progress" },
        // R1: мягкий финал (time-cap/page-cap/no-gain) — база неполная, но продолжать нечем:
        // автоэкспорт разрешён с префиксом [LOW CONFIDENCE]_. Аддитивное булево: у прочих
        // сайтов и у честного/промежуточного снимка — false (O-54 не ослабляется).
        partialSoft: complete ? false : s.partialSoft === true,
        baseEmpty: false,
        // ===== O-47 (badge-метрика Qwen): serverTokens В detail НЕ УЕЗЖАЕТ =====
        // Корень дефекта: usage.input из SSE — КУМУЛИРУЕМОЕ сервисом потребление API (input
        // текущего запроса + накопленный на его стороне контекст), а НЕ размер текущего контекста
        // диалога: число растёт от хода к ходу и не описывает ни окно, ни базу (в фикстурах O-35 —
        // 1709 при двух сообщениях). У DeepSeek аналог (accumulated_token_usage) авторитетен по
        // решению O-23 — у Qwen нет. Поэтому поле не публикуется вовсе: badge/pct Qwen считаются
        // ТОЛЬКО эвристикой Tokenizer.estimateDialogTokens (tokens~), а content.js дополнительно
        // гасит серверный счётчик для site=qwen (core/content.js:aiCmMetricServerTokens).
        // Диагностика числа не теряется: локальная переменная serverTokens уходит в строки
        // 'emit' (diagLine) и qwen-sse (diagTag) ниже, а также в сигнатуру дедупа снимка.
        // O-35: поля серверного usage Qwen — тултип берёт их как источник истины.
        // output ВКЛЮЧАЕТ reasoning (output_tokens_details.reasoning_tokens), поэтому
        // reasoningTokens идёт отдельной строкой и поясняет состав output.
        qwenUsage: {
          inputTokens: typeof usage.input === "number" ? usage.input : 0,
          outputTokens: typeof usage.output === "number" ? usage.output : 0,
          totalTokens: typeof usage.total === "number" ? usage.total : 0,
          reasoningTokens: typeof usage.reasoning === "number" ? usage.reasoning : 0,
          cachedTokens: typeof usage.cached === "number" ? usage.cached : 0
        },
        responseId: s.responseId || "",
        chatId: s.chatId || ""
      };
      try {
        window.dispatchEvent(new CustomEvent("ai-cm-full-history", { detail }));
        dispatchSig = sig;
        lastDispatchResult = true;
        if (typeof lastEmitMeta !== "undefined") {
          lastEmitMeta = {
            tokens: serverTokens,
            complete,
            chatId: s.chatId || "",
            responseId: s.responseId || ""
          };
        }
        diagLine("emit", {
          conv: String(detail.convId || "").slice(0, 8),
          count: detail.count,
          serverTokens,
          reasoningTokens: detail.qwenUsage.reasoningTokens,
          responseId: String(detail.responseId || "").slice(0, 8)
        });
        diagTag("qwen-sse", {
          ts: Date.now(),
          event: "emit",
          convId: String(detail.convId || ""),
          url: s.url || diagUrl(),
          serverTokens,
          inputTokens: detail.qwenUsage.inputTokens,
          outputTokens: detail.qwenUsage.outputTokens,
          reasoningTokens: detail.qwenUsage.reasoningTokens,
          count: detail.count
        });
      } catch (eEmit) {
        lastDispatchResult = false;
        diagLine("emit-error", { err: String(eEmit && eEmit.message || eEmit).slice(0, 80) });
      }
      return lastDispatchResult;
    }
    var PQ_PAGE_CAP = 10;
    var PQ_TIME_CAP_MS = 3e4;
    var PQ_ERR_RETRY_CAP = 3;
    var PQ_ERR_BACKOFF_MS = 2e3;
    var PQ_PACE_MS = 200;
    var pq = null;
    var lastHistoryHeaders = null;
    function qwenPaginationApi() {
      try {
        var api = typeof window !== "undefined" ? window.AiCmQwenPagination : null;
        return api && typeof api.historyPageUrl === "function" ? api : null;
      } catch (eApi) {
        return null;
      }
    }
    function collectRequestHeaders(input, init) {
      var out = {};
      try {
        var src = init && init.headers || (input && typeof input === "object" ? input.headers : null);
        if (!src) return out;
        if (typeof src.forEach === "function" && !Array.isArray(src)) {
          src.forEach(function(v, k) {
            if (k) out[String(k)] = String(v);
          });
        } else if (Array.isArray(src)) {
          for (var i = 0; i < src.length; i++) {
            if (src[i] && src[i].length >= 2) out[String(src[i][0])] = String(src[i][1]);
          }
        } else if (typeof src === "object") {
          var keys = Object.keys(src);
          for (var j = 0; j < keys.length; j++) out[keys[j]] = String(src[keys[j]]);
        }
      } catch (eHdr) {
        swallow(eHdr, "qwen:headers-collect");
      }
      return out;
    }
    function renumberHistoryPage(pageTurns, fromCycle, url) {
      var api = qwenPaginationApi();
      if (!api || !pageTurns || !pageTurns.length) return;
      if (!fromCycle && !(api.isOlderPageUrl && api.isOlderPageUrl(url))) return;
      try {
        var base = api.assignPageOrders(pageTurns, api.floorOf(turns, pageTurns));
        if (pq) pq.orderFloor = base;
      } catch (eOrd) {
        swallow(eOrd, "qwen:page-orders");
      }
    }
    function startQwenPagination(meta, payload, createdCount) {
      var api = qwenPaginationApi();
      if (!api) return false;
      var m = meta || {};
      var chatId = String(m.chatId || currentChatId || "");
      if (!chatId) return false;
      if (pq && pq.running) {
        if (pq.chatId === chatId) {
          var alive = api.nextCursorOf(payload);
          if (alive && !pq.usedCursors[alive]) pq.cursor = alive;
        }
        return true;
      }
      var info = api.paginationInfo(payload);
      var cursor = api.nextCursorOf(payload);
      var cursorSrc = "field";
      if (!cursor) {
        if (info && info.found && info.hasMoreOlder === false) return false;
        if (info && info.found && info.hasMoreOlder !== true) return false;
        if (createdCount >= api.PAGE_LIMIT) {
          var guess = api.oldestMessageId(payload);
          if (guess) {
            cursor = guess;
            cursorSrc = "id-guess";
          }
        }
        if (!cursor) return false;
      }
      pq = {
        chatId,
        url: String(m.url || ""),
        headers: m.headers && typeof m.headers === "object" ? m.headers : lastHistoryHeaders,
        cursor,
        cursorSrc,
        pages: 0,
        startTs: Date.now(),
        orderFloor: 0,
        usedCursors: {},
        lastAdded: 0,
        errStreak: 0,
        running: true,
        aborted: false,
        partialReason: ""
      };
      pq.usedCursors[cursor] = 1;
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "paginate-start",
        chat: String(chatId).slice(0, 8),
        url: pq.url,
        cursor: String(cursor).slice(0, 8),
        src: cursorSrc
      });
      setTimeout(pqStep, PQ_PACE_MS);
      return true;
    }
    function pqStep() {
      if (!pq || !pq.running || pq.aborted) return;
      var api = qwenPaginationApi();
      if (!api) {
        pqAbort("module-missing");
        return;
      }
      var decision = api.pageStepDecision({
        hasCursor: !!pq.cursor,
        pages: pq.pages,
        elapsedMs: Date.now() - pq.startTs,
        added: pq.lastAdded
      }, { pageCap: PQ_PAGE_CAP, timeCapMs: PQ_TIME_CAP_MS });
      if (decision.action === "cap") {
        pqFinish(decision.reason);
        return;
      }
      if (!pq.cursor) {
        pqFinish("end");
        return;
      }
      var url;
      try {
        url = api.historyPageUrl(pq.url, pq.cursor);
      } catch (eUrl) {
        pqFinish("error");
        return;
      }
      if (!url) {
        pqFinish("end");
        return;
      }
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "paginate-request",
        chat: String(pq.chatId).slice(0, 8),
        page: pq.pages + 1,
        cursor: String(pq.cursor).slice(0, 8),
        src: pq.cursorSrc
      });
      var opts = { method: "GET", credentials: "include" };
      if (pq.headers) opts.headers = pq.headers;
      var promise;
      try {
        promise = originalFetch.call(window, url, opts);
      } catch (eFetch) {
        pqFail(eFetch);
        return;
      }
      Promise.resolve(promise).then(function(resp) {
        if (!pq || !pq.running || pq.aborted) return null;
        if (!resp || !resp.ok) {
          var eHttp = new Error("http " + (resp ? resp.status : "none"));
          eHttp.status = resp ? resp.status : 0;
          throw eHttp;
        }
        return resp.json().then(function(json) {
          pqApplyPage(json);
        });
      }).catch(function(eStep) {
        if (!pq || !pq.running || pq.aborted) return;
        pqFail(eStep);
      });
    }
    function pqApplyPage(json) {
      if (!pq || !pq.running || pq.aborted) return;
      if (currentChatId && pq.chatId && currentChatId !== pq.chatId) {
        pqAbort("chat-changed");
        return;
      }
      var api = qwenPaginationApi();
      var res = null;
      try {
        res = applyHistoryPayload(json, { chatId: pq.chatId, url: pq.url, paginate: true });
      } catch (eApply) {
        diagTag("qwen-history", {
          ts: Date.now(),
          event: "paginate-error",
          reason: "apply",
          err: String(eApply && eApply.message || eApply).slice(0, 80)
        });
        pqFail(eApply);
        return;
      }
      if (!res || res.foreign) {
        pqAbort("foreign-chat");
        return;
      }
      pq.pages++;
      pq.errStreak = 0;
      var added = res.added || 0;
      pq.lastAdded = added;
      var next = api ? api.nextCursorOf(json) : "";
      if (!next) {
        pqFinish(api && typeof api.paginationInfo === "function" && api.paginationInfo(json).hasMoreOlder === false ? "end" : "no-cursor");
        return;
      }
      if (!added) {
        pqFinish("no-gain");
        return;
      }
      if (pq.usedCursors[next]) {
        pqFinish("cursor-loop");
        return;
      }
      pq.cursor = next;
      pq.cursorSrc = "field";
      pq.usedCursors[next] = 1;
      setTimeout(pqStep, PQ_PACE_MS);
    }
    function pqFail(err) {
      if (!pq || !pq.running || pq.aborted) return;
      pq.errStreak++;
      var status = err && typeof err.status === "number" ? err.status : 0;
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "paginate-error",
        chat: String(pq.chatId).slice(0, 8),
        page: pq.pages + 1,
        status,
        err: String(err && err.message || err).slice(0, 80)
      });
      if (pq.cursorSrc === "id-guess" && status >= 400 && status < 500) {
        pqFinish("end");
        return;
      }
      if (pq.errStreak >= PQ_ERR_RETRY_CAP) {
        pqFinish("error");
        return;
      }
      setTimeout(pqStep, PQ_ERR_BACKOFF_MS);
    }
    function pqFinish(reason) {
      if (!pq) return;
      var st = pq;
      st.running = false;
      st.partialReason = reason === "end" ? "" : reason;
      var pqApi = qwenPaginationApi();
      var soft = pqApi && typeof pqApi.isSoftPartialReason === "function" ? pqApi.isSoftPartialReason(reason) === true : false;
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "paginate",
        chat: String(st.chatId || "").slice(0, 8),
        pages: st.pages,
        reason,
        soft: soft ? 1 : 0,
        added: turns.length,
        elapsed: Date.now() - st.startTs,
        cursorSrc: st.cursorSrc
      });
      var honest = reason === "end";
      try {
        emitSnapshot({
          chatId: st.chatId,
          url: st.url,
          complete: honest,
          partial: honest ? null : { pages: st.pages, reason },
          partialSoft: !honest && soft
        });
      } catch (eFin) {
        swallow(eFin, "qwen:paginate-finish");
      }
    }
    function pqAbort(reason) {
      if (!pq) return;
      diagTag("qwen-history", {
        ts: Date.now(),
        event: "paginate-abort",
        chat: String(pq.chatId || "").slice(0, 8),
        pages: pq.pages,
        reason
      });
      pq.running = false;
      pq.aborted = true;
      pq = null;
    }
    if (typeof originalFetch === "function") {
      window.fetch = function(input, init) {
        var url = urlOf(input);
        try {
          if (typeof rememberFetchHeaders === "function") rememberFetchHeaders(url, input, init);
        } catch (eRh) {
          swallow(eRh, "qwen:auth-headers");
        }
        var method = methodOf(init, input);
        var hit = false;
        try {
          hit = isQwenCompletions(url, method);
        } catch (eDet) {
          hit = false;
        }
        var histHit = false;
        try {
          histHit = isQwenHistory(url, method);
        } catch (eDetH) {
          histHit = false;
        }
        if (hit) diagTag("qwen-sse", { ts: Date.now(), event: "url-match", method, url });
        if (histHit) diagTag("qwen-history", { ts: Date.now(), event: "url-match", method, url, transport: "fetch" });
        if (hit) {
          var reqChatId = chatIdFromUrl(url);
          if (reqChatId) {
            lastReqChatId = reqChatId;
            if (!currentChatId) currentChatId = reqChatId;
          }
          if (currentChatId && reqChatId && reqChatId !== currentChatId) {
            diagLine("skip-request", { reason: "other-chat", req: String(reqChatId).slice(0, 8) });
            hit = false;
          }
        }
        var meta = null;
        var histMeta = null;
        if (hit) {
          meta = { chatId: reqChatId || currentChatId || "", url, userPrompt: "", userKey: "", parentId: "", model: "" };
          try {
            var bodyStr = init && typeof init.body === "string" ? init.body : "";
            if (bodyStr) {
              var payload = JSON.parse(bodyStr);
              meta.parentId = payload.parentId || payload.parent_id || "";
              meta.model = typeof payload.model === "string" ? payload.model : "";
              var msgs = payload.messages;
              if (Array.isArray(msgs)) {
                for (var i = msgs.length - 1; i >= 0; i--) {
                  if (msgs[i] && msgs[i].role === "user" && typeof msgs[i].content === "string") {
                    meta.userPrompt = msgs[i].content;
                    meta.userKey = typeof msgs[i].fid === "string" && msgs[i].fid ? msgs[i].fid : "";
                    break;
                  }
                }
              }
            }
          } catch (eBody) {
            swallow(eBody, "qwen:fetch-body-parse");
          }
          if (!meta.userKey) {
            meta.userKey = meta.parentId ? "p:" + meta.parentId : "l:" + turnSeq;
          }
          diagLine("request", {
            chat: String(meta.chatId || "").slice(0, 8),
            parent: String(meta.parentId || "").slice(0, 8),
            promptLen: meta.userPrompt.length
          });
        } else if (histHit) {
          var histChatId = historyChatIdFromUrl(url);
          if (histChatId) {
            lastReqChatId = histChatId;
            if (!currentChatId) currentChatId = histChatId;
          }
          if (currentChatId && histChatId && histChatId !== currentChatId) {
            diagLine("skip-request", { reason: "other-chat", req: String(histChatId).slice(0, 8) });
            diagTag("qwen-history", { ts: Date.now(), event: "skip-request", reason: "other-chat", url });
            histHit = false;
          } else {
            histMeta = { chatId: histChatId || currentChatId || "", url };
            histMeta.headers = collectRequestHeaders(input, init);
          }
        }
        var promise;
        try {
          promise = originalFetch.apply(this, arguments);
        } catch (eCall) {
          return Promise.reject(eCall);
        }
        if (promise && typeof promise.catch === "function") promise.catch(function() {
        });
        if (hit) {
          promise.then(function(resp) {
            try {
              if (!resp || !resp.ok) {
                diagLine("response-skip", { reason: "http", status: resp ? resp.status : "none" });
                return resp;
              }
              consumeStream(resp, meta);
            } catch (eResp) {
              diagLine("response-error", { err: String(eResp && eResp.message || eResp).slice(0, 80) });
            }
            return resp;
          }, function() {
          });
        } else if (histHit && histMeta) {
          promise.then(function(resp) {
            try {
              if (!resp || !resp.ok) {
                diagLine("response-skip", { reason: "http", status: resp ? resp.status : "none" });
                diagTag("qwen-history", { ts: Date.now(), event: "skip", reason: "http", status: resp ? resp.status : "none", url: histMeta.url || "" });
                return resp;
              }
              if (isFullHistoryUrl(histMeta.url)) noteNativeFullHistory(histMeta.chatId);
              consumeHistory(resp, histMeta);
            } catch (eResp) {
              diagLine("response-error", { err: String(eResp && eResp.message || eResp).slice(0, 80) });
            }
            return resp;
          }, function() {
          });
        }
        return promise;
      };
    }
    try {
      if (typeof XMLHttpRequest === "function" && XMLHttpRequest.prototype) {
        var origXHROpen = XMLHttpRequest.prototype.open;
        var origXHRSend = XMLHttpRequest.prototype.send;
        var origXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
          try {
            if (typeof isQwenApiUrl === "function" && isQwenApiUrl(this.__aiCmQwenUrl)) {
              var oneHdr = {};
              oneHdr[String(name)] = String(value);
              mergeQwenHeaders(oneHdr);
            }
            if (this.__aiCmQwenHist) {
              if (!this.__aiCmQwenHistHeaders) this.__aiCmQwenHistHeaders = {};
              this.__aiCmQwenHistHeaders[String(name)] = String(value);
            }
          } catch (eXHdr) {
          }
          return origXHRSetHeader.apply(this, arguments);
        };
        XMLHttpRequest.prototype.open = function(method, url) {
          try {
            this.__aiCmQwenHist = null;
            this.__aiCmQwenHistHeaders = null;
            this.__aiCmQwenUrl = null;
            var xMethod = String(method == null ? "GET" : method).toUpperCase();
            var xUrl = String(url == null ? "" : url);
            this.__aiCmQwenUrl = xUrl;
            var xHit = false;
            try {
              xHit = isQwenHistory(xUrl, xMethod);
            } catch (eXDet) {
              xHit = false;
            }
            if (xHit) {
              diagTag("qwen-history", {
                ts: Date.now(),
                event: "url-match",
                method: xMethod,
                url: xUrl,
                transport: "xhr"
              });
              var xChatId = historyChatIdFromUrl(xUrl);
              if (xChatId) {
                lastReqChatId = xChatId;
                if (!currentChatId) currentChatId = xChatId;
              }
              if (currentChatId && xChatId && xChatId !== currentChatId) {
                diagLine("skip-request", { reason: "other-chat", req: String(xChatId).slice(0, 8) });
                diagTag("qwen-history", {
                  ts: Date.now(),
                  event: "skip-request",
                  reason: "other-chat",
                  url: xUrl,
                  transport: "xhr"
                });
              } else {
                this.__aiCmQwenHist = { chatId: xChatId || currentChatId || "", url: xUrl, method: xMethod };
              }
            }
          } catch (eXOpen) {
          }
          return origXHROpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
          try {
            var xMeta = this.__aiCmQwenHist;
            if (xMeta) {
              var xSelf = this;
              xSelf.addEventListener("loadend", function() {
                try {
                  consumeHistoryXhr(xSelf, xMeta);
                } catch (eXLoad) {
                  swallow(eXLoad, "qwen:xhr-loadend-history");
                }
              });
            }
          } catch (eXSend) {
          }
          return origXHRSend.apply(this, arguments);
        };
      }
    } catch (eXhrHook) {
      swallow(eXhrHook, "qwen:install-network-hooks");
    }
    function checkChatChange() {
      try {
        var next = chrOf();
        if (next === currentChatId) return;
        var prev = currentChatId;
        currentChatId = next;
        if (sse) {
          sse.ended = true;
          sse = null;
        }
        turns = [];
        userTurns = [];
        turnSeq = 0;
        dispatchSig = null;
        if (typeof aiCmQwenFiles !== "undefined" && aiCmQwenFiles) {
          try {
            aiCmQwenFiles.qfReset(next);
          } catch (eQfReset) {
            swallow(eQfReset, "qwen:files-reset");
          }
        }
        if (pq) pqAbort("chat-changed");
        if (prev && fh[prev]) delete fh[prev];
        fhFallback = null;
        diagLine("chat-change", { chat: String(next || "").slice(0, 8) });
        var dispatched = 0;
        try {
          window.dispatchEvent(new CustomEvent("ai-cm-conversation-changed"));
          dispatched = 1;
        } catch (eDispatch) {
        }
        diagTag("qwen-spa", {
          ts: Date.now(),
          event: "chat-change",
          from: String(prev || "").slice(0, 8),
          to: String(next || "").slice(0, 8),
          convId: String(next || ""),
          url: diagUrl(),
          reset: 1,
          dispatched
        });
      } catch (eCh) {
        swallow(eCh, "qwen:checkChatChange");
      }
    }
    try {
      var origPushState = history.pushState;
      if (origPushState) {
        history.pushState = function() {
          var r = origPushState.apply(this, arguments);
          try {
            checkChatChange();
          } catch (eP) {
          }
          return r;
        };
      }
      var origReplaceState = history.replaceState;
      if (origReplaceState) {
        history.replaceState = function() {
          var r = origReplaceState.apply(this, arguments);
          try {
            checkChatChange();
          } catch (eR) {
          }
          return r;
        };
      }
      window.addEventListener("popstate", function() {
        try {
          checkChatChange();
        } catch (ePop) {
        }
      });
    } catch (eHist) {
    }
    if (aiCmQwenFiles) {
      try {
        aiCmQwenFiles.__bind({
          emitSnapshot,
          diagLine,
          get currentChatId() {
            return currentChatId;
          },
          get originalFetch() {
            return originalFetch;
          },
          get lastEmitMeta() {
            return lastEmitMeta;
          }
        });
      } catch (eBind) {
        swallow(eBind, "qwen:files-bind");
      }
    }
    window.__aiCmQwenBridge = {
      isQwenCompletions,
      isQwenHistory,
      isFullHistoryUrl,
      chatIdFromUrl,
      historyChatIdFromUrl,
      composeTurnText,
      // O-39: чистый разбор payload истории и его применение к состоянию (тесты гоняют РЕАЛЬНЫЙ
      // файл; боевой путь вызывает то же самое из consumeHistory).
      parseQwenHistory,
      applyHistory: function(payload, meta) {
        return applyHistoryPayload(payload, meta || {});
      },
      // O-53: состояние прогона пагинации (null — не запущена) и ручной старт для тестов.
      paginateState: function() {
        if (!pq) return null;
        return {
          running: !!pq.running,
          chatId: pq.chatId,
          cursor: pq.cursor,
          cursorSrc: pq.cursorSrc,
          pages: pq.pages,
          orderFloor: pq.orderFloor,
          partialReason: pq.partialReason,
          usedCursors: Object.keys(pq.usedCursors)
        };
      },
      startPagination: function(payload, meta) {
        return startQwenPagination(meta || {}, payload, 0);
      },
      turns: function() {
        return turns;
      },
      // R2: снимок файлового состояния (очередь/тексты вложений) — только чтение.
      files: function() {
        return aiCmQwenFiles ? aiCmQwenFiles.qfStats() : null;
      },
      usage: function() {
        return sse ? sse.usage : null;
      },
      diagLines: function() {
        return diagLineCount;
      },
      diagOn,
      applyFrames: function(objects) {
        if (!sse) beginStream({ chatId: currentChatId, userPrompt: "", parentId: "" });
        for (var i = 0; i < objects.length; i++) feedFrame({ data: JSON.stringify(objects[i]) });
        endStream("bridge");
      }
    };
    diagLine("installed", { chat: String(currentChatId || "").slice(0, 8) });
    console.log("[qwen-intercept] \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Qwen \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D (\u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B, SSE \u0447\u0435\u0440\u0435\u0437 utils/stream-frames.js, usage \u043A\u0443\u043C\u0443\u043B\u044F\u0442\u0438\u0432\u043D\u044B\u0439 \u2192 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043A\u0430\u0434\u0440, \u0444\u0430\u0437\u044B thinking_summary(REPLACE)/answer(APPEND), \u0444\u043E\u043B\u0431\u044D\u043A \u2014 DOM-\u0430\u0434\u0430\u043F\u0442\u0435\u0440, O-39: JSON-\u0438\u0441\u0442\u043E\u0440\u0438\u044F GET /api/v*N*/chats/{id} \u0447\u0435\u0440\u0435\u0437 resp.clone().json() (fetch) \u0438 XMLHttpRequest loadend (XHR/jQuery); O-53: \u043A\u0443\u0440\u0441\u043E\u0440\u043D\u0430\u044F \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 (pagination.oldest_id, limit=10, \u0434\u043E has_more_older=false)");
    function qwenContentText(raw) {
      if (typeof raw === "string") return raw;
      if (Array.isArray(raw)) {
        var parts = [];
        for (var i = 0; i < raw.length; i++) {
          var p = raw[i];
          if (typeof p === "string" && p) parts.push(p);
          else if (p && typeof p === "object" && typeof p.content === "string" && p.content) parts.push(p.content);
        }
        return parts.join("\n\n");
      }
      if (raw && typeof raw === "object" && typeof raw.content === "string") return raw.content;
      return "";
    }
    function qwenThinkingItem(item) {
      if (!item || typeof item !== "object") return item;
      if (item.phase !== "thinking") return item;
      return {
        phase: PHASE_THINKING,
        content: typeof item.content === "string" && item.content ? item.content : typeof item.reasoning_content === "string" ? item.reasoning_content : "",
        extras: item.extras || item.extra || null
      };
    }
    function qwenReasoningOf(node) {
      if (!node || typeof node !== "object") return "";
      var raw = node.reasoning_content;
      if (raw == null) raw = node.reasoningContent;
      return qwenContentText(raw);
    }
    function qwenParseFullChain(payload) {
      function nodeIdOf(node2) {
        if (!node2 || typeof node2 !== "object") return "";
        var keys2 = ["id", "message_id", "msg_id", "uuid", "response_id", "fid"];
        for (var i2 = 0; i2 < keys2.length; i2++) {
          var v = node2[keys2[i2]];
          if (typeof v === "string" && v) return v;
          if (typeof v === "number") return String(v);
        }
        return "";
      }
      function parentIdOf(node2) {
        if (!node2 || typeof node2 !== "object") return "";
        if (typeof node2.parentId === "string") return node2.parentId;
        if (typeof node2.parent_id === "string") return node2.parent_id;
        return "";
      }
      var found = null;
      var seenRoots = [];
      function scan(node2, depth) {
        if (found || !node2 || typeof node2 !== "object" || depth > 6) return;
        for (var v = 0; v < seenRoots.length; v++) {
          if (seenRoots[v] === node2) return;
        }
        seenRoots.push(node2);
        var hist = node2.history;
        if (hist && typeof hist === "object" && hist.messages && typeof hist.messages === "object" && !Array.isArray(hist.messages)) {
          var cid = typeof hist.currentId === "string" && hist.currentId ? hist.currentId : typeof hist.current_id === "string" && hist.current_id ? hist.current_id : "";
          if (cid) {
            found = { messages: hist.messages, currentId: cid };
            return;
          }
        }
        for (var key2 in node2) {
          if (!Object.prototype.hasOwnProperty.call(node2, key2)) continue;
          var child = node2[key2];
          if (child && typeof child === "object") scan(child, depth + 1);
        }
      }
      try {
        scan(payload, 0);
      } catch (eScan) {
        swallow(eScan, "qwen:full-chain-scan");
      }
      if (!found) return { nodes: [] };
      var byKey = {}, byId = {}, keys = [];
      for (var key in found.messages) {
        if (!Object.prototype.hasOwnProperty.call(found.messages, key)) continue;
        var node = found.messages[key];
        if (!node || typeof node !== "object" || Array.isArray(node)) continue;
        byKey[key] = node;
        var id = nodeIdOf(node);
        if (id && !byId[id]) byId[id] = node;
        keys.push(key);
      }
      function resolve(ref) {
        return ref ? byKey[ref] || byId[ref] || null : null;
      }
      function markOffChain(node2) {
        var copy = {};
        for (var k in node2) {
          if (Object.prototype.hasOwnProperty.call(node2, k)) copy[k] = node2[k];
        }
        copy.offChain = true;
        return copy;
      }
      var seq = [], visited = [], cur = found.currentId, truncated = false;
      while (cur) {
        var curNode = resolve(cur);
        if (!curNode || visited.indexOf(curNode) !== -1) {
          truncated = true;
          break;
        }
        visited.push(curNode);
        seq.push(curNode);
        cur = parentIdOf(curNode);
      }
      if (!seq.length) return { nodes: [] };
      seq.reverse();
      for (var i = 0; i < keys.length; i++) {
        var extra = byKey[keys[i]];
        if (visited.indexOf(extra) === -1) {
          visited.push(extra);
          seq.push(truncated ? extra : markOffChain(extra));
        }
      }
      return { nodes: seq };
    }
    function reindexByChain(pageTurns) {
      if (!pageTurns || !pageTurns.length) return;
      try {
        var inChain = {};
        for (var i = 0; i < pageTurns.length; i++) {
          if (!pageTurns[i]) continue;
          pageTurns[i].order = i;
          inChain[pageTurns[i].key] = 1;
        }
        var rest = [];
        for (var j = 0; j < turns.length; j++) {
          if (!turns[j] || inChain[turns[j].key]) continue;
          rest.push(turns[j]);
        }
        rest.sort(function(a, b) {
          return (a.order || 0) - (b.order || 0);
        });
        for (var k = 0; k < rest.length; k++) rest[k].order = pageTurns.length + k;
        if (pq) pq.orderFloor = 0;
      } catch (eReindex) {
        swallow(eReindex, "qwen:reindex-chain");
      }
    }
    function isFullHistoryUrl(url) {
      try {
        var s = String(url || "");
        var q = s.indexOf("?");
        if (q === -1) return true;
        var query = s.slice(q + 1).split("#")[0];
        if (!query) return true;
        var parts = query.split("&");
        for (var i = 0; i < parts.length; i++) {
          var k = parts[i].split("=")[0];
          if (k === "direction" || k === "limit" || k === "cursor") return false;
        }
        return true;
      } catch (eFull) {
        return false;
      }
    }
    function fullHistoryBlocksPage(chatId, url, meta) {
      var m = meta || {};
      if (m.full === true) return false;
      if (typeof isFullHistoryUrl !== "function") return false;
      if (isFullHistoryUrl(url)) return false;
      if (typeof fh === "undefined" || !fh) return false;
      var id = String(chatId || "");
      return !!id && fh[id] === "done";
    }
    function skipFullHistoryPage(meta, transport) {
      var m = meta || {};
      var ev = { ts: Date.now(), event: "skip", reason: "full-history-applied", url: m.url || "" };
      if (transport) ev.transport = transport;
      diagTag("qwen-history", ev);
      return { added: 0, foreign: false, blocked: "full-history" };
    }
    var FH_HEADER_NAMES = ["authorization", "bx-ua", "bx-umidtoken", "bx-v", "accept"];
    var qwenAuthHeaders = {};
    var fh = {};
    var fhFallback = null;
    function isQwenApiUrl(url) {
      try {
        var s = String(url || "");
        if (!/\/api\/v\d+\//.test(s)) return false;
        if (/^https?:\/\//i.test(s) && !/qwen\.ai/i.test(s)) return false;
        return true;
      } catch (eQa) {
        return false;
      }
    }
    function mergeQwenHeaders(src) {
      if (!src) return;
      try {
        for (var k in src) {
          if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
          var lk = String(k).toLowerCase();
          if (FH_HEADER_NAMES.indexOf(lk) === -1) continue;
          var v = src[k];
          if (v == null || v === "") continue;
          qwenAuthHeaders[lk] = String(v);
        }
      } catch (eMerge) {
        swallow(eMerge, "qwen:auth-headers");
      }
    }
    function rememberFetchHeaders(url, input, init) {
      if (!isQwenApiUrl(url)) return;
      mergeQwenHeaders(collectRequestHeaders(input, init));
    }
    function nativeFullHeaders() {
      var out = {};
      for (var k in qwenAuthHeaders) {
        if (Object.prototype.hasOwnProperty.call(qwenAuthHeaders, k)) out[k] = qwenAuthHeaders[k];
      }
      if (!out.accept) out.accept = "application/json, text/plain, */*";
      return out;
    }
    function fullHistoryUrlOf(pageUrl, chatId) {
      try {
        var s = String(pageUrl || "");
        var q = s.indexOf("?");
        var noQuery = q === -1 ? s : s.slice(0, q);
        var h = noQuery.indexOf("#");
        if (h !== -1) noQuery = noQuery.slice(0, h);
        if (/\/api\/v\d+\/chats\/[A-Za-z0-9_-]+$/.test(noQuery)) return noQuery;
        var u = typeof URL === "function" ? new URL(s, typeof location !== "undefined" ? location.href : void 0) : null;
        if (u && /\/api\/v\d+\/chats\//.test(u.pathname)) return u.origin + u.pathname;
        if (u) return u.origin + "/api/v2/chats/" + encodeURIComponent(chatId);
      } catch (eFullUrl) {
        swallow(eFullUrl, "qwen:full-history-url");
      }
      return "";
    }
    function noteNativeFullHistory(chatId) {
      if (chatId) fh[chatId] = "done";
    }
    function ensureFullHistory(chatId, pageUrl, payload, meta, createdCount) {
      if (!chatId) return false;
      if (pq && pq.running) return false;
      var state = fh[chatId];
      if (state === "pending") return "pending";
      if (state === "done") return "done";
      if (state === "failed") return false;
      if (!qwenAuthHeaders["authorization"]) return false;
      var url = fullHistoryUrlOf(pageUrl, chatId);
      if (!url) return false;
      fh[chatId] = "pending";
      fhFallback = { chatId, payload, meta, count: createdCount };
      var promise = null;
      try {
        promise = originalFetch.call(window, url, {
          method: "GET",
          credentials: "include",
          headers: nativeFullHeaders()
        });
      } catch (eCall) {
        fh[chatId] = "failed";
        return false;
      }
      Promise.resolve(promise).then(function(resp) {
        if (!resp || !resp.ok) throw new Error("http " + (resp ? resp.status : "none"));
        return resp.json();
      }).then(function(json) {
        fh[chatId] = "done";
        fhFallback = null;
        diagTag("qwen-history", {
          ts: Date.now(),
          event: "full-history",
          chat: String(chatId).slice(0, 8),
          url
        });
        try {
          applyHistoryPayload(json, { chatId, url, full: true });
        } catch (eApplyFull) {
          swallow(eApplyFull, "qwen:full-history-apply");
        }
      }).catch(function(eFull) {
        if (fh[chatId] === "done") return;
        if (currentChatId && String(currentChatId) !== String(chatId)) return;
        fh[chatId] = "failed";
        diagTag("qwen-history", {
          ts: Date.now(),
          event: "full-history-fail",
          chat: String(chatId).slice(0, 8),
          err: String(eFull && eFull.message || eFull).slice(0, 80)
        });
        var fb = fhFallback;
        fhFallback = null;
        if (!fb || fb.chatId !== chatId) return;
        var started = false;
        try {
          started = startQwenPagination(fb.meta || {}, fb.payload, fb.count);
        } catch (eFb) {
          swallow(eFb, "qwen:full-history-fallback");
        }
        if (!started) {
          try {
            emitSnapshot({ chatId, url: fb.meta && fb.meta.url || url, complete: true });
          } catch (eFbEmit) {
            swallow(eFbEmit, "qwen:full-history-fallback-emit");
          }
        }
      });
      return "pending";
    }
  })();
})();
