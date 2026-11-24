(() => {
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
    return el.tagName === "H2" && Boolean(el.className) && String(el.className).indexOf("iMqumd") !== -1;
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
    if (turns.length > 1) {
      var domOrder = "no-evidence";
      try {
        var liveDoc = typeof document !== "undefined" ? document : null;
        if (liveDoc && typeof liveDoc.querySelectorAll === "function") {
          var domTid = readThreadId(liveDoc);
          if (!threadId || !domTid || threadId === domTid) {
            var domTurns = extractTurnsFromDocument(liveDoc);
            if (domTurns.length > 0) {
              var ordered = orderTurnsByDom(turns, domTurns);
              domOrder = ordered.verdict;
              if (ordered.verdict !== "no-evidence") turns = ordered.turns;
            }
          }
        }
      } catch (e) {
        swallowSoft(e, "gsa-utils:parseGoogleFolwrOpen-order");
      }
      if (domOrder === "no-evidence") turns.reverse();
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
        } else {
          q = resolveUserQuestionForTurn(doc, turnsArr[i]);
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
  function isSyntheticTurnId(id) {
    var s = String(id == null ? "" : id);
    if (!s) return true;
    return s.indexOf("idx") === 0 || s.indexOf("folif_") === 0;
  }
  function domRankOfTurn(turn, domTurns) {
    if (!turn) return -1;
    var i;
    var id = String(turn.id == null ? "" : turn.id);
    if (!isSyntheticTurnId(id)) {
      for (i = 0; i < domTurns.length; i++) {
        if (domTurns[i] && String(domTurns[i].id == null ? "" : domTurns[i].id) === id) return i;
      }
    }
    var key = canonicalTurnKeyOf(turn);
    if (key && key !== "||") {
      for (i = 0; i < domTurns.length; i++) {
        if (canonicalTurnKeyOf(domTurns[i]) === key) return i;
      }
    }
    var body = turnIdentityParts(turn).a;
    if (body) {
      for (i = 0; i < domTurns.length; i++) {
        var other = turnIdentityParts(domTurns[i]).a;
        if (other && bodiesPrefixCompatible(body, other)) return i;
      }
    }
    return -1;
  }
  function orderTurnsByDom(turns, domTurns) {
    var list = Array.isArray(turns) ? turns : [];
    var dom = Array.isArray(domTurns) ? domTurns : [];
    var ranks = [];
    var i;
    for (i = 0; i < list.length; i++) {
      var rank = domRankOfTurn(list[i], dom);
      if (rank >= 0) ranks.push(rank);
    }
    var matched = ranks.length;
    if (matched < 2) return { turns: list, verdict: "no-evidence", matched };
    var up = 0;
    var down = 0;
    for (i = 1; i < ranks.length; i++) {
      if (ranks[i] > ranks[i - 1]) up++;
      else if (ranks[i] < ranks[i - 1]) down++;
    }
    if (down > up) return { turns: list.slice().reverse(), verdict: "reversed", matched };
    return { turns: list, verdict: "kept", matched };
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
  var HISTORY_CURSOR_RE = /^AUtEx/i;
  function isHistoryCursor(token) {
    if (!token || typeof token !== "string") return false;
    return HISTORY_CURSOR_RE.test(token.trim());
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
  function stripGsaUserEcho(text) {
    var t = String(text == null ? "" : text).trim();
    if (!t) return t;
    var m = /^Вы\s+отправили[\s\S]*?запрос\s*:?\s*"/i.exec(t.slice(0, 240));
    if (!m) return t;
    var rest = t.slice(m[0].length);
    var close = rest.lastIndexOf('"');
    if (close === -1) return t;
    if (rest.slice(close + 1).trim()) return t;
    var q = rest.slice(0, close).trim();
    return q || t;
  }
  function gsaAnswerEchoParts(text) {
    var m = /^Ответ\s+в\s+режиме\s+ИИ(?:[\s,]|$)[\s\S]*?запрос\s*:?\s*"/i.exec(text.slice(0, 300));
    if (!m) return null;
    var rest = text.slice(m[0].length);
    var close = -1;
    for (var i = 0; i < rest.length; i++) {
      if (rest.charAt(i) !== '"') continue;
      var tail = rest.slice(i + 1);
      if (/^[\r\n]/.test(tail) && isAnswerWrapperTail(tail)) {
        close = i;
        break;
      }
    }
    if (close === -1) {
      for (var j = 0; j < rest.length; j++) {
        if (rest.charAt(j) !== '"') continue;
        if (isAnswerWrapperTail(rest.slice(j + 1))) {
          close = j;
          break;
        }
      }
    }
    if (close === -1) {
      var last = rest.lastIndexOf('"');
      if (last !== -1 && !rest.slice(last + 1).trim()) close = last;
    }
    if (close === -1) return null;
    var body = rest.slice(close + 1).replace(/^["»”']{0,2}/, "").replace(/^[\s.,:;-]+/, "");
    return { question: rest.slice(0, close).trim(), body };
  }
  function stripGsaAssistantEcho(text) {
    var t = String(text == null ? "" : text).trim();
    if (!t) return t;
    var wrapper = gsaAnswerEchoParts(t);
    if (wrapper) return wrapper.body;
    if (/^Ответ\s+в\s+режиме\s+ИИ(?:[\s,]|$)/i.test(t) && wrapperPrefix(t)) return "";
    return t;
  }
  function extractEchoQuestion(turnEl) {
    try {
      if (!turnEl || typeof turnEl.querySelector !== "function") return null;
      var h3 = turnEl.querySelector("h3.iMqumd");
      if (!h3) return null;
      var raw = String(h3.textContent == null ? "" : h3.textContent).trim();
      var prefix = wrapperPrefix(raw);
      if (!prefix) return null;
      var rest = raw.slice(prefix.length);
      var close = rest.lastIndexOf('"');
      if (close === -1) return null;
      if (rest.slice(close + 1).replace(/\s+/g, "").length > 0) return null;
      var q = rest.slice(0, close).trim();
      return q || null;
    } catch (e) {
      return null;
    }
  }
  function stripBubbleQuotes(text) {
    return String(text == null ? "" : text).trim().replace(/^["'«»„“”‘’]+/, "").replace(/["'«»„“”‘’]+$/, "").trim();
  }
  function resolveUserQuestionForTurn(doc, turnEl) {
    try {
      if (!doc || typeof doc.querySelectorAll !== "function") return null;
      var echoQ = extractEchoQuestion(turnEl);
      if (!echoQ) return null;
      var want = normalizeTurnKeyPart(echoQ);
      if (!want) return null;
      var spans = doc.querySelectorAll("span");
      var found = null;
      for (var i = 0; i < spans.length; i++) {
        var el = spans[i];
        if (!el || !el.textContent) continue;
        if (el.children && el.children.length > 0) continue;
        if (typeof el.closest === "function" && el.closest('[data-scope-id="turn"]')) continue;
        var text = stripBubbleQuotes(el.textContent);
        if (!text || normalizeTurnKeyPart(text) !== want) continue;
        if (found !== null) return null;
        found = text;
      }
      return found;
    } catch (e) {
      return null;
    }
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
  function turnIdentityParts(turn) {
    if (!turn) return { u: "", a: "" };
    var wrapper = answerWrapperParts(turn.assistantText);
    var u = normalizeTurnKeyPart(turn.userText);
    if (!u && wrapper) u = normalizeTurnKeyPart(wrapper.question);
    var a = normalizeTurnKeyPart(wrapper ? wrapper.body : canonicalAnswerBody(turn.assistantText));
    return { u, a };
  }
  function canonicalTurnKeyOf(turn) {
    if (!turn) return "";
    var parts = turnIdentityParts(turn);
    return parts.u + "||" + parts.a;
  }
  function wrapperQuestion(text) {
    var s = String(text == null ? "" : text);
    var prefix = wrapperPrefix(s);
    if (!prefix) return "";
    var rest = s.slice(prefix.length);
    var firstWs = -1;
    for (var i = 0; i < rest.length; i++) {
      if (rest.charAt(i) !== '"') continue;
      var tail = rest.slice(i + 1);
      if (!isAnswerWrapperTail(tail)) continue;
      if (/^[\r\n]/.test(tail)) return rest.slice(0, i).trim();
      if (firstWs === -1 && /^\s/.test(tail)) firstWs = i;
    }
    if (firstWs !== -1) return rest.slice(0, firstWs).trim();
    var legacy = answerWrapperParts(s);
    return legacy ? legacy.question : "";
  }
  function canonicalizeTurnForThread(turn) {
    if (!turn) return turn;
    var question = turn.userText == null ? "" : String(turn.userText).trim();
    if (!question) {
      question = wrapperQuestion(turn.assistantText);
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
  var PREFIX_MIN_CHARS = 12;
  var PREFIX_FUZZY_RATIO = 0.8;
  function bodiesPrefixCompatible(a, b) {
    var x = String(a == null ? "" : a);
    var y = String(b == null ? "" : b);
    if (!x || !y) return false;
    if (x === y) return true;
    var n = Math.min(x.length, y.length);
    if (n < PREFIX_MIN_CHARS) return false;
    var common = 0;
    while (common < n && x.charCodeAt(common) === y.charCodeAt(common)) common++;
    if (common === n) return true;
    return common / n >= PREFIX_FUZZY_RATIO;
  }
  function isFullerTurn(candidate, current) {
    var la = turnIdentityParts(candidate).a.length;
    var lb = turnIdentityParts(current).a.length;
    if (la !== lb) return la > lb;
    return isBetterTurn(candidate, current);
  }
  var PARAGRAPH_PERMUTATION_MIN = 2;
  function answerBodyParagraphs(turn) {
    var wrapper = answerWrapperParts(turn && turn.assistantText);
    var body = wrapper ? wrapper.body : canonicalAnswerBody(turn && turn.assistantText);
    var lines = String(body == null ? "" : body).split(String.fromCharCode(10));
    var out = [];
    var cur = "";
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.trim() === "") {
        var p = normalizeTurnKeyPart(cur);
        if (p) out.push(p);
        cur = "";
        continue;
      }
      cur = cur ? cur + String.fromCharCode(10) + line : line;
    }
    var tail = normalizeTurnKeyPart(cur);
    if (tail) out.push(tail);
    return out;
  }
  function bodiesParagraphPermutation(aTurn, bTurn) {
    var pa = answerBodyParagraphs(aTurn);
    var pb = answerBodyParagraphs(bTurn);
    if (pa.length < PARAGRAPH_PERMUTATION_MIN || pa.length !== pb.length) return false;
    pa.sort();
    pb.sort();
    for (var i = 0; i < pa.length; i++) {
      if (pa[i] !== pb[i]) return false;
    }
    return true;
  }
  function findPrefixCompatibleIndex(turns, turn) {
    var parts = turnIdentityParts(turn);
    if (!parts.u || !parts.a) return -1;
    for (var i = 0; i < turns.length; i++) {
      var other = turnIdentityParts(turns[i]);
      if (other.u !== parts.u) continue;
      if (bodiesPrefixCompatible(other.a, parts.a)) return i;
      if (other.a.length === parts.a.length && bodiesParagraphPermutation(turns[i], turn)) return i;
    }
    return -1;
  }
  function reindexTurnKey(byKey, turns, at) {
    var k;
    for (k in byKey) {
      if (byKey[k] === at) delete byKey[k];
    }
    var key = canonicalTurnKeyOf(turns[at]);
    if (key !== "||") byKey[key] = at;
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
      var at = hasId ? byId[id] : hasKey ? byKey[key] : findPrefixCompatibleIndex(out, t);
      if (at !== -1) {
        var otherParts = turnIdentityParts(out[at]);
        var parts = turnIdentityParts(t);
        if (hasId && !hasKey && parts.u && otherParts.u && parts.u !== otherParts.u && !bodiesPrefixCompatible(otherParts.a, parts.a)) {
          byKey[key] = out.length;
          out.push(turnRecord(t, id));
          return;
        }
        var richer = hasId || hasKey ? isBetterTurn(t, out[at]) : isFullerTurn(t, out[at]);
        if (richer) {
          out[at] = turnRecord(t, out[at].id);
          reindexTurnKey(byKey, out, at);
        }
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
    var byKey = {};
    var out = [];
    function add(t) {
      if (!t) return;
      var key = canonicalTurnKeyOf(t);
      if (key === "||") return;
      var hasKey = Object.prototype.hasOwnProperty.call(byKey, key);
      var at = hasKey ? byKey[key] : findPrefixCompatibleIndex(out, t);
      if (at === -1) {
        byKey[key] = out.length;
        out.push(turnRecord(t, "x" + out.length));
        return;
      }
      var richer = hasKey ? isBetterTurn(t, out[at]) : isFullerTurn(t, out[at]);
      var prevUserText = out[at].userText;
      if (richer) {
        out[at] = turnRecord(t, out[at].id);
        if (!out[at].userText && prevUserText) out[at].userText = prevUserText;
        reindexTurnKey(byKey, out, at);
      }
      if (!out[at].userText && t.userText) {
        out[at] = { id: out[at].id, userText: t.userText, assistantText: out[at].assistantText };
        delete byKey[key];
        reindexTurnKey(byKey, out, at);
      }
    }
    for (var i = 0; i < baseTurns.length; i++) add(baseTurns[i]);
    for (var j = 0; j < extraTurns.length; j++) add(extraTurns[j]);
    return out;
  }
  function fillMissingUserText(baseTurns, extraTurns) {
    if (!Array.isArray(baseTurns) || baseTurns.length === 0) {
      return Array.isArray(baseTurns) ? baseTurns : [];
    }
    if (!Array.isArray(extraTurns) || extraTurns.length === 0) return baseTurns;
    var byKey = {};
    var ambiguous = {};
    var byAnswer = {};
    var ambiguousAnswer = {};
    for (var i = 0; i < extraTurns.length; i++) {
      var t = extraTurns[i];
      if (!t || !t.userText) continue;
      var body = turnIdentityParts(t).a;
      if (body) {
        if (Object.prototype.hasOwnProperty.call(byAnswer, body)) {
          if (byAnswer[body] !== t.userText) {
            delete byAnswer[body];
            ambiguousAnswer[body] = true;
          }
        } else if (!ambiguousAnswer[body]) {
          byAnswer[body] = t.userText;
        }
      }
      var key = canonicalTurnKeyOf(t);
      if (key === "||" || ambiguous[key]) continue;
      if (Object.prototype.hasOwnProperty.call(byKey, key)) {
        if (byKey[key] !== t.userText) {
          delete byKey[key];
          ambiguous[key] = true;
        }
        continue;
      }
      byKey[key] = t.userText;
    }
    var out = [];
    var filled = false;
    for (var j = 0; j < baseTurns.length; j++) {
      var turn = baseTurns[j];
      var fill = null;
      if (turn && !turn.userText) {
        var ownKey = canonicalTurnKeyOf(turn);
        if (ownKey !== "||" && Object.prototype.hasOwnProperty.call(byKey, ownKey)) fill = byKey[ownKey];
        if (!fill) {
          var answerBody = turnIdentityParts(turn).a;
          if (answerBody && Object.prototype.hasOwnProperty.call(byAnswer, answerBody)) {
            fill = byAnswer[answerBody];
          }
        }
      }
      if (!fill) {
        out.push(turn);
        continue;
      }
      out.push({ id: turn.id, userText: fill, assistantText: turn.assistantText });
      filled = true;
    }
    return filled ? out : baseTurns;
  }
  var TAIL_QUESTION_MIN = 12;
  function tailEchoQuestion(assistantText, questionText) {
    var q = String(questionText == null ? "" : questionText);
    if (q.length < TAIL_QUESTION_MIN) return false;
    var echo = String(assistantText == null ? "" : assistantText);
    var prefix = wrapperPrefix(echo);
    if (!prefix) return false;
    var rest = echo.slice(prefix.length).replace(/^["»”'\u00ab\u201c\u2018\s]+/, "");
    return rest.indexOf(q) === 0;
  }
  function foldTailTurns(turns) {
    var out = turns;
    for (var iter = 0; iter < 3; iter++) {
      if (out.length < 2) break;
      var first = out[out.length - 2];
      var second = out[out.length - 1];
      if (!first || !second) break;
      var firstA = first.assistantText == null ? "" : String(first.assistantText);
      var secondA = second.assistantText == null ? "" : String(second.assistantText);
      var firstU = first.userText == null ? "" : String(first.userText);
      var secondU = second.userText == null ? "" : String(second.userText);
      if (firstA && secondA && firstA === secondA && (firstU ? 1 : 0) + (secondU ? 1 : 0) === 1) {
        out[out.length - 2] = { id: first.id, userText: firstU || secondU, assistantText: firstA };
        out.pop();
        continue;
      }
      var folded = null;
      if (!firstA && firstU && secondA && (!secondU || secondU === firstU) && tailEchoQuestion(secondA, firstU)) {
        folded = { id: second.id, userText: firstU, assistantText: secondA };
      } else if (!secondA && secondU && firstA && (!firstU || firstU === secondU) && tailEchoQuestion(firstA, secondU)) {
        folded = { id: first.id, userText: secondU, assistantText: firstA };
      }
      if (!folded) break;
      out[out.length - 2] = folded;
      out.pop();
    }
    return out;
  }
  function dedupeTurns(turns) {
    var list = Array.isArray(turns) ? turns : [];
    var byKey = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (!t) continue;
      var key = canonicalTurnKeyOf(t);
      var hasKey = key !== "||" && Object.prototype.hasOwnProperty.call(byKey, key);
      var at = hasKey ? byKey[key] : findPrefixCompatibleIndex(out, t);
      if (at === -1) {
        if (key !== "||") byKey[key] = out.length;
        out.push(t);
        continue;
      }
      var richer = hasKey ? isBetterTurn(t, out[at]) : isFullerTurn(t, out[at]);
      if (richer) {
        var prevUserText = out[at].userText;
        if (!t.userText && prevUserText) {
          out[at] = turnRecord(t, out[at].id);
          out[at].userText = prevUserText;
        } else {
          out[at] = t;
        }
        reindexTurnKey(byKey, out, at);
      }
    }
    return foldTailTurns(out);
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
    var kind;
    var complete, canContinue;
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
      // O-32 (фикс A/C): префикс-терпимая идентичность хода и дедуп списка перед кэшем.
      turnIdentityParts,
      bodiesPrefixCompatible,
      dedupeTurns,
      // BUG-M: probe разрешён только по курсору истории; folif-mstk курсором не считается.
      isHistoryCursor,
      // BUG-G: A-only ход — вопрос из DOM-пузыря (эхо-валидация) и узкий fill-only добор
      // userText по каноническому ключу; повторной копии алгоритма у адаптера/перехватчика нет.
      resolveUserQuestionForTurn,
      fillMissingUserText,
      // BUG-J: порядок ходов по живому DOM — эталон направления для open-пути перехватчика.
      orderTurnsByDom,
      // O-45: общий рендер код-блоков (```lang … ```) и отбор узлов DOM-пути —
      // переиспользуются адаптером (adapters/google-search-adapter.js) и тестами.
      renderCodeBlock,
      answerTextOf,
      answerDomNodes,
      isCodeBlockElement,
      // BUG-08/фаза 4: эхо-обёртки GSA снимаются только на проекции файла.
      stripGsaUserEcho,
      stripGsaAssistantEcho
    };
  }
})();
