(() => {
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
  function sanitizeGeminiText(s) {
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
  function collectTurnText(node, out, state) {
    state = state || { inThinking: false };
    if (typeof node === "string") {
      var s = sanitizeGeminiText(node);
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
      var s = sanitizeGeminiText(q).trim();
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
  function fileRefFromNode(n) {
    try {
      if (!Array.isArray(n)) return null;
      var name = typeof n[2] === "string" ? n[2].trim() : "";
      if (!name) return null;
      var mime = typeof n[11] === "string" ? n[11] : "";
      var type = typeof n[1] === "number" ? n[1] : 0;
      var token = typeof n[5] === "string" ? n[5] : "";
      var img = typeof n[3] === "string" ? n[3] : "";
      var tail = n ? n[15] : null;
      var size = Array.isArray(tail) && typeof tail[2] === "number" && isFinite(tail[2]) && tail[2] > 0 ? tail[2] : 0;
      var dl = "";
      var urls = [];
      (function walk(v) {
        if (typeof v === "string") {
          if (v) urls.push(v);
          if (!dl && v.indexOf("contribution.usercontent.google.com/download") !== -1) dl = v;
        } else if (Array.isArray(v)) {
          for (var i = 0; i < v.length; i++) walk(v[i]);
        }
      })(n[7]);
      return {
        name,
        mime,
        type,
        token,
        size,
        img,
        dl,
        urls,
        isImage: type === 1 || /^image\//i.test(mime)
      };
    } catch (e) {
      return null;
    }
  }
  function collectTurnFiles(turn) {
    var out = [];
    try {
      var arr = turn[2][0][4][0][4];
      if (!Array.isArray(arr)) return out;
      for (var i = 0; i < arr.length; i++) {
        var ref = fileRefFromNode(arr[i]);
        if (ref) {
          ref.pos = i;
          out.push(ref);
        }
      }
    } catch (e) {
    }
    return out;
  }
  var filePoolsByConv = {};
  function fileOwnerTs(ts) {
    return typeof ts === "number" && isFinite(ts) && ts > 0 ? ts : 0;
  }
  function fileOwnerOrder(order) {
    return typeof order === "number" && isFinite(order) && order >= 0 ? order : -1;
  }
  function filePoolForConv(convId, create) {
    var cid = typeof convId === "string" ? convId : "";
    var pool = filePoolsByConv[cid];
    if (!pool && create) {
      pool = { turns: {}, seq: 0 };
      filePoolsByConv[cid] = pool;
    }
    return pool || null;
  }
  function fileRefPoolName(ref) {
    return ref && typeof ref.name === "string" ? ref.name : "";
  }
  function poolSharedPrefixLen(a, b) {
    var n = Math.min(a.length, b.length);
    var k = 0;
    while (k < n && fileRefPoolName(a[k]) === fileRefPoolName(b[k])) k++;
    return k;
  }
  function isTurnBefore(a, b) {
    var aTs = fileOwnerTs(a.ts);
    var bTs = fileOwnerTs(b.ts);
    if (aTs > 0 && bTs > 0 && aTs !== bTs) return aTs < bTs;
    if (aTs > 0 && bTs === 0) return true;
    if (aTs === 0 && bTs > 0) return false;
    var aRefs = Array.isArray(a.refs) ? a.refs : null;
    var bRefs = Array.isArray(b.refs) ? b.refs : null;
    if (aRefs && bRefs && aRefs.length !== bRefs.length) {
      var nest = poolSharedPrefixLen(aRefs, bRefs);
      if (nest === Math.min(aRefs.length, bRefs.length)) return aRefs.length < bRefs.length;
    }
    var aTid = typeof a.turnId === "string" ? a.turnId : "";
    var bTid = typeof b.turnId === "string" ? b.turnId : "";
    if (aTid && bTid && aTid !== bTid) return aTid < bTid;
    var aOrd = fileOwnerOrder(a.order);
    var bOrd = fileOwnerOrder(b.order);
    if (aOrd >= 0 && bOrd >= 0 && aOrd !== bOrd) return aOrd < bOrd;
    return a.seq < b.seq;
  }
  function fileRefIdentityKey(ref) {
    var name = ref && typeof ref.name === "string" ? ref.name : "";
    var size = ref && typeof ref.size === "number" && isFinite(ref.size) ? ref.size : 0;
    return name + "|" + size;
  }
  function registerTurnFileOwner(turn, convId, turnId, ts, order) {
    var own = typeof turnId === "string" ? turnId : "";
    if (!own) return 0;
    var all = collectTurnFiles(turn);
    var pool = filePoolForConv(convId, true);
    if (!all.length) {
      if (pool && pool.turns[own]) delete pool.turns[own];
      return 0;
    }
    var nTs = fileOwnerTs(ts);
    var nOrd = fileOwnerOrder(order);
    var prev = pool.turns[own];
    if (prev) {
      prev.refs = all;
      if (nTs > 0) prev.ts = nTs;
      if (nOrd >= 0) prev.order = nOrd;
      return all.length;
    }
    pool.seq++;
    pool.turns[own] = { turnId: own, ts: nTs, order: nOrd, seq: pool.seq, refs: all };
    return all.length;
  }
  function previousPoolTurn(pool, rec, all) {
    var ids = Object.keys(pool.turns);
    var chrono = null;
    var i;
    for (i = 0; i < ids.length; i++) {
      if (ids[i] === rec.turnId) continue;
      var cand = pool.turns[ids[i]];
      if (!cand || !Array.isArray(cand.refs)) continue;
      if (!isTurnBefore(cand, rec)) continue;
      if (!chrono || isTurnBefore(chrono, cand)) chrono = cand;
    }
    var donor = null;
    for (i = 0; i < ids.length; i++) {
      if (ids[i] === rec.turnId) continue;
      var reg = pool.turns[ids[i]];
      if (!reg || !Array.isArray(reg.refs)) continue;
      var len = reg.refs.length;
      if (!len || len >= all.length) continue;
      if (poolSharedPrefixLen(reg.refs, all) !== len) continue;
      if (!donor || len > donor.refs.length) donor = reg;
    }
    if (donor && (!chrono || donor.refs.length > chrono.refs.length)) return donor;
    return chrono;
  }
  function poolDelta(prevRefs, all) {
    var k = poolSharedPrefixLen(prevRefs, all);
    if (k === prevRefs.length || k === all.length) return all.slice(k);
    var spent = {};
    var i;
    for (i = 0; i < prevRefs.length; i++) {
      var pk = fileRefIdentityKey(prevRefs[i]);
      spent[pk] = (spent[pk] || 0) + 1;
    }
    var out = [];
    for (i = 0; i < all.length; i++) {
      var ck = fileRefIdentityKey(all[i]);
      if (spent[ck] > 0) {
        spent[ck]--;
        continue;
      }
      out.push(all[i]);
    }
    return out;
  }
  function assignPoolOwners(turns) {
    var list = Array.isArray(turns) ? turns : [];
    var out = [];
    var prevPool = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;
      var pool = Array.isArray(item.refs) ? item.refs : [];
      var own = [];
      if (pool.length) {
        own = prevPool.length ? poolDelta(prevPool, pool) : pool.slice(0);
        prevPool = pool;
      }
      out.push({ id: item.id, own });
    }
    return out;
  }
  function collectTurnFilesForOwner(turn, convId, ownerId, ts, order) {
    var all = collectTurnFiles(turn);
    var own = typeof ownerId === "string" ? ownerId : "";
    if (!own) return all;
    if (!all.length) return [];
    var pool = filePoolForConv(convId, true);
    var rec = pool.turns[own];
    if (!rec) {
      pool.seq++;
      rec = { turnId: own, ts: fileOwnerTs(ts), order: fileOwnerOrder(order), seq: pool.seq, refs: all };
      pool.turns[own] = rec;
    }
    rec.refs = all;
    if (fileOwnerTs(ts) > 0) rec.ts = fileOwnerTs(ts);
    if (fileOwnerOrder(order) >= 0) rec.order = fileOwnerOrder(order);
    var prev = previousPoolTurn(pool, rec, all);
    if (!prev) return all;
    return poolDelta(prev.refs, all);
  }
  function __resetFileOwners(convId) {
    if (convId === void 0 || convId === null || convId === "") {
      filePoolsByConv = {};
      return;
    }
    delete filePoolsByConv[typeof convId === "string" ? convId : String(convId)];
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
      var s = sanitizeGeminiText(cands[i]).trim();
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
    return sanitizeGeminiText(s).trim();
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
  function splitTurnMessages(turn) {
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
        var msgs = splitTurnMessages(t);
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
    sanitizeGeminiText,
    collectTurnText,
    isThinkingAssistant,
    firstCyrillicIndex,
    stripLeadingThinking,
    splitTurnMessages,
    extractDrTexts,
    injectDrLinks,
    __setDrTexts,
    fileRefFromNode,
    fileRefIdentityKey,
    collectTurnFiles,
    registerTurnFileOwner,
    collectTurnFilesForOwner,
    assignPoolOwners,
    __resetFileOwners,
    parseGeminiHistory
  };
  if (typeof window !== "undefined") {
    window.GeminiBatchexecuteParser = api;
  }
})();
