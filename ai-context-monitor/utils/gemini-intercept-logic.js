(() => {
  var FLOOR_KEY_PREFIX = "ai-cm-gemini-floor";
  function floorStorageKey(convId, parserVersion) {
    return FLOOR_KEY_PREFIX + "-" + (parserVersion || "") + "-" + convId;
  }
  var TAPE_KEY_PREFIX = "ai-cm-gemini-tape";
  function tapeStorageKey(convId, parserVersion) {
    return TAPE_KEY_PREFIX + "-" + (parserVersion || "") + "-" + convId;
  }
  function tapeVersionOf(entry) {
    if (entry && entry.meta && typeof entry.meta.version === "string") return entry.meta.version;
    return "";
  }
  function shouldAcceptTape(entry, parserVersion) {
    if (!parserVersion) return false;
    return tapeVersionOf(entry) === parserVersion;
  }
  function restoredTurnKeyOf(id) {
    return String(id == null ? "" : id).replace(/_(user|assistant)$/, "");
  }
  function restoredRoleOf(m) {
    if (m && m.role) return m.role === "user" ? "user" : "assistant";
    var id = m && m.id || "";
    if (/_user$/.test(id)) return "user";
    if (/_assistant$/.test(id)) return "assistant";
    return "";
  }
  function parseFloor(raw, parserVersion) {
    try {
      var f = JSON.parse(raw);
      if (!f || typeof f.count !== "number" || typeof f.effectiveLen !== "number") return null;
      if (parserVersion && f.version !== parserVersion) return null;
      return f;
    } catch (e) {
      return null;
    }
  }
  function loadFloor(convId, parserVersion, storage) {
    if (!storage || !convId) return null;
    try {
      var raw = storage.getItem(floorStorageKey(convId, parserVersion));
      if (!raw) return null;
      return parseFloor(raw, parserVersion);
    } catch (e) {
      return null;
    }
  }
  function saveFloor(convId, parserVersion, count, effectiveLen, storage) {
    if (!storage || !convId) return;
    var key = floorStorageKey(convId, parserVersion);
    var existing = loadFloor(convId, parserVersion, storage);
    if (!existing || count > existing.count || count === existing.count && effectiveLen > existing.effectiveLen) {
      var val = JSON.stringify({ count, effectiveLen, ts: Date.now(), version: parserVersion });
      try {
        storage.setItem(key, val);
      } catch (e) {
        swallowSoft(e, "gemini-utils:saveFloor");
      }
    }
  }
  function diagnoseFloorAbsence(convId, parserVersion, storage) {
    if (!storage) return "no-storage";
    if (!convId) return "no-conv";
    var raw = null;
    try {
      raw = storage.getItem(floorStorageKey(convId, parserVersion));
    } catch (e) {
      raw = null;
    }
    if (typeof raw !== "string" || !raw) return "no-floor-saved";
    var f = parseFloor(raw, parserVersion);
    if (!f) return "version-mismatch-or-invalid";
    if (!f.count) return "floor-count-zero";
    return "ok";
  }
  function resolveFloor(textLen, count, savedFloor, baseComplete) {
    if (!savedFloor || baseComplete) {
      return { effectiveLen: textLen, floorApplied: false, floorValue: 0 };
    }
    if (savedFloor.count > count) {
      return {
        effectiveLen: Math.max(textLen, savedFloor.effectiveLen),
        floorApplied: true,
        floorValue: savedFloor.effectiveLen
      };
    }
    return { effectiveLen: textLen, floorApplied: false, floorValue: 0 };
  }
  function shouldSaveFloor(baseComplete, reachedStart) {
    return !!(baseComplete && reachedStart);
  }
  function selfHealFloorVerdict(opts) {
    var o = opts || {};
    var baseCount = typeof o.baseCount === "number" && o.baseCount > 0 ? o.baseCount : 0;
    var floorCount = typeof o.floorCount === "number" && o.floorCount > 0 ? o.floorCount : 0;
    var floorLen = typeof o.floorLen === "number" && o.floorLen > 0 ? o.floorLen : 0;
    var provenLen = typeof o.provenLen === "number" && o.provenLen > 0 ? o.provenLen : 0;
    var confirmations = typeof o.confirmations === "number" && o.confirmations > 0 ? o.confirmations : 0;
    if (o.cleanEnd !== true) return { lower: false, reason: "no-clean-end" };
    if (o.pendingCursor) return { lower: false, reason: "cursor-alive" };
    if (o.quietActive === true) return { lower: false, reason: "quiet-active" };
    if (o.pageError === true) return { lower: false, reason: "page-error" };
    if (o.loaderRunning === true) return { lower: false, reason: "loader-running" };
    if (o.archivePending === true) return { lower: false, reason: "archive-pending-live" };
    if (!baseCount) return { lower: false, reason: "base-empty" };
    if (!floorCount) return { lower: false, reason: "no-floor" };
    if (baseCount >= floorCount) return { lower: false, reason: "floor-not-stale" };
    if (confirmations < 1) return { lower: false, reason: "unconfirmed" };
    return {
      lower: true,
      count: baseCount,
      effectiveLen: provenLen || floorLen,
      floorWas: floorCount,
      source: "clean-end-self-heal",
      reachedStart: o.reachedStart === true,
      reason: "stale-floor"
    };
  }
  function writeSelfHealedFloor(convId, parserVersion, count, effectiveLen, source, storage) {
    if (!storage || !convId) return null;
    if (typeof count !== "number" || !(count > 0)) return null;
    var len = typeof effectiveLen === "number" && effectiveLen > 0 ? effectiveLen : 0;
    var rec = {
      count,
      effectiveLen: len,
      ts: Date.now(),
      version: parserVersion,
      source: source || "clean-end-self-heal"
    };
    try {
      storage.setItem(floorStorageKey(convId, parserVersion), JSON.stringify(rec));
      return rec;
    } catch (e) {
      return null;
    }
  }
  function isSubsetIds(incomingIds, existingIds) {
    var incoming = Array.isArray(incomingIds) ? incomingIds : [];
    var existing = Array.isArray(existingIds) ? existingIds : [];
    if (!incoming.length || !existing.length) return false;
    var seen = {};
    for (var i = 0; i < existing.length; i++) {
      if (existing[i]) seen[existing[i]] = true;
    }
    var hits = 0;
    for (var j = 0; j < incoming.length; j++) {
      var id = incoming[j];
      if (!id || !seen[id]) return false;
      hits++;
    }
    return hits > 0;
  }
  function shouldFullRebuild(opts) {
    opts = opts || {};
    if (!(opts.fromVirtualF5 && opts.wasFull && !opts.hasCursor)) return false;
    if (opts.existingIds || opts.incomingIds) {
      if (isSubsetIds(opts.incomingIds, opts.existingIds)) return false;
    }
    return true;
  }
  function shouldDisjointReset(opts) {
    opts = opts || {};
    var src = opts.src || "";
    if (src !== "vf5" && src !== "passive") return false;
    if (opts.incomingConvId && opts.currentConvId && opts.incomingConvId === opts.currentConvId) return false;
    var existing = Array.isArray(opts.existingIds) ? opts.existingIds : [];
    var incoming = Array.isArray(opts.incomingIds) ? opts.incomingIds : [];
    if (!existing.length || !incoming.length) return false;
    var liveExisting = 0;
    var liveIncoming = 0;
    for (var le = 0; le < existing.length; le++) {
      if (existing[le]) liveExisting++;
    }
    for (var li = 0; li < incoming.length; li++) {
      if (incoming[li]) liveIncoming++;
    }
    if (!liveExisting || !liveIncoming) return false;
    var seen = {};
    for (var i = 0; i < existing.length; i++) seen[existing[i]] = true;
    for (var j = 0; j < incoming.length; j++) {
      if (incoming[j] && seen[incoming[j]]) return false;
    }
    return true;
  }
  function assignPageOrders(pageLen, mode, state) {
    state = state || { orderCounter: 0, prependCursor: -1 };
    var orders = [];
    for (var i = 0; i < pageLen; i++) {
      if (mode === "older") orders.push(state.prependCursor - (pageLen - i));
      else orders.push(state.orderCounter++);
    }
    if (mode === "older") state.prependCursor -= pageLen;
    return orders;
  }
  function orderPages(pages) {
    var seen = {};
    var state = { orderCounter: 0, prependCursor: -1 };
    var ordered = [];
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var turns = page && page.turns || [];
      var mode = page && page.mode === "older" ? "older" : "fresh";
      var pageLen = turns.length;
      for (var j = 0; j < pageLen; j++) {
        var t = turns[j];
        if (!t || !t.id) continue;
        if (seen[t.id]) continue;
        seen[t.id] = true;
        var order;
        if (mode === "older") order = state.prependCursor - (pageLen - j);
        else order = state.orderCounter++;
        ordered.push({ id: t.id, text: t.text, role: t.role, r1: t.r1 || null, order });
      }
      if (mode === "older") state.prependCursor -= pageLen;
    }
    ordered.sort(function(a, b) {
      return a.order - b.order;
    });
    return ordered.map(function(x) {
      return { id: x.id, text: x.text, role: x.role, r1: x.r1 };
    });
  }
  function orderByArrival(items) {
    var turns = {};
    var i, it, tk;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (!it || !it.id) continue;
      tk = it.turnId || it.id;
      var ord = it.order != null ? it.order : 0;
      if (!turns[tk]) {
        turns[tk] = { order: ord, msgs: [] };
      } else if (ord < turns[tk].order) {
        turns[tk].order = ord;
      }
      turns[tk].msgs.push(it);
    }
    var turnIds = Object.keys(turns);
    if (!turnIds.length) return { ok: true, ids: [] };
    var orderOwner = {};
    for (i = 0; i < turnIds.length; i++) {
      var o = turns[turnIds[i]].order;
      if (orderOwner[o] !== void 0 && orderOwner[o] !== turnIds[i]) {
        return { ok: false, ids: [] };
      }
      orderOwner[o] = turnIds[i];
    }
    turnIds.sort(function(a, b) {
      return turns[a].order - turns[b].order;
    });
    var ids = [];
    for (i = 0; i < turnIds.length; i++) {
      var msgs = turns[turnIds[i]].msgs.slice();
      msgs.sort(function(a, b) {
        var ra = a.role === "user" ? 0 : 1;
        var rb = b.role === "user" ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return (a.order || 0) - (b.order || 0);
      });
      for (var m = 0; m < msgs.length; m++) ids.push(msgs[m].id);
    }
    return { ok: true, ids };
  }
  function orderPageByR1(pageMsgs) {
    var turns = {};
    var r1Targets = {};
    var i, it, tk;
    for (i = 0; i < pageMsgs.length; i++) {
      it = pageMsgs[i];
      if (!it || !it.id) continue;
      tk = it.turnId || it.id;
      if (!turns[tk]) turns[tk] = { next: it.r1 || null, msgs: [] };
      else if (!turns[tk].next && it.r1) turns[tk].next = it.r1;
      turns[tk].msgs.push(it);
      if (it.r1) r1Targets[it.r1] = true;
    }
    var turnIds = Object.keys(turns);
    if (!turnIds.length) return { ok: true, ids: [] };
    function expand(chainTurnIds) {
      var ids = [];
      for (var c = 0; c < chainTurnIds.length; c++) {
        var msgs = turns[chainTurnIds[c]].msgs.slice();
        msgs.sort(function(a, b) {
          var ra = a.role === "user" ? 0 : 1;
          var rb = b.role === "user" ? 0 : 1;
          if (ra !== rb) return ra - rb;
          return 0;
        });
        for (var m = 0; m < msgs.length; m++) ids.push(msgs[m].id);
      }
      return ids;
    }
    function fallbackIds() {
      var seq = [];
      var seen2 = {};
      for (var a = 0; a < pageMsgs.length; a++) {
        var mm = pageMsgs[a];
        var mk = mm && mm.turnId || mm && mm.id;
        if (mk && !seen2[mk]) {
          seen2[mk] = true;
          seq.push(mk);
        }
      }
      return expand(seq);
    }
    var heads = [];
    for (i = 0; i < turnIds.length; i++) {
      if (!r1Targets[turnIds[i]]) heads.push(turnIds[i]);
    }
    if (heads.length !== 1) return { ok: false, ids: fallbackIds() };
    var chain = [];
    var seen = {};
    var cur = heads[0];
    var guard = turnIds.length + 1;
    while (cur && turns[cur] && !seen[cur] && chain.length < guard) {
      seen[cur] = true;
      chain.push(cur);
      cur = turns[cur].next;
    }
    if (chain.length !== turnIds.length) return { ok: false, ids: fallbackIds() };
    chain.reverse();
    return { ok: true, ids: expand(chain) };
  }
  function orderRestoredTape(tapeMsgs) {
    function turnKeyOf(id) {
      return String(id == null ? "" : id).replace(/_(user|assistant)$/, "");
    }
    function roleOf(m2) {
      if (m2 && m2.role) return m2.role === "user" ? "user" : "assistant";
      var id = m2 && m2.id || "";
      if (/_user$/.test(id)) return "user";
      if (/_assistant$/.test(id)) return "assistant";
      return "";
    }
    function expand(turnIds2) {
      var out = [];
      for (var i2 = 0; i2 < turnIds2.length; i2++) {
        var msgs = turns[turnIds2[i2]].msgs.slice();
        msgs.sort(function(a, b) {
          var ra = a.role === "user" ? 0 : 1;
          var rb = b.role === "user" ? 0 : 1;
          if (ra !== rb) return ra - rb;
          return 0;
        });
        for (var k = 0; k < msgs.length; k++) out.push(msgs[k].id);
      }
      return out;
    }
    var turns = {};
    var order = [];
    var i, m, tk;
    for (i = 0; i < tapeMsgs.length; i++) {
      m = tapeMsgs[i];
      if (!m || !m.id) continue;
      tk = turnKeyOf(m.id);
      if (!turns[tk]) {
        turns[tk] = { r1: m.r1 ? turnKeyOf(m.r1) : null, msgs: [] };
        order.push(tk);
      } else if (!turns[tk].r1 && m.r1) {
        turns[tk].r1 = turnKeyOf(m.r1);
      }
      turns[tk].msgs.push({ id: m.id, role: roleOf(m) });
    }
    var turnIds = Object.keys(turns);
    if (!turnIds.length) return [];
    var hasR1 = false;
    for (i = 0; i < turnIds.length; i++) {
      if (turns[turnIds[i]].r1) {
        hasR1 = true;
        break;
      }
    }
    if (!hasR1) {
      var fb = [];
      for (i = order.length - 1; i >= 0; i--) fb.push(order[i]);
      return expand(fb);
    }
    var r1Targets = {};
    for (i = 0; i < turnIds.length; i++) {
      var rt = turns[turnIds[i]].r1;
      if (rt) r1Targets[rt] = true;
    }
    var heads = [];
    for (i = 0; i < turnIds.length; i++) {
      if (!r1Targets[turnIds[i]]) heads.push(turnIds[i]);
    }
    if (!heads.length) {
      var fbc = [];
      for (i = order.length - 1; i >= 0; i--) fbc.push(order[i]);
      return expand(fbc);
    }
    var chains = [];
    var seen = {};
    for (i = 0; i < heads.length; i++) {
      var cur = heads[i];
      var chain = [];
      var guard = turnIds.length + 1;
      while (cur && turns[cur] && !seen[cur] && chain.length < guard) {
        seen[cur] = true;
        chain.push(cur);
        if (!turns[cur].r1) break;
        if (seen[turns[cur].r1]) {
          cur = null;
          break;
        }
        cur = turns[cur].r1;
      }
      if (chain.length) chains.push(chain);
    }
    var extra = [];
    for (i = 0; i < turnIds.length; i++) {
      if (!seen[turnIds[i]]) extra.push(turnIds[i]);
    }
    var final = [];
    for (i = 0; i < chains.length; i++) {
      for (var g = chains[i].length - 1; g >= 0; g--) final.push(chains[i][g]);
    }
    for (i = extra.length - 1; i >= 0; i--) final.push(extra[i]);
    return expand(final);
  }
  function countR1Inversions(finalItems) {
    var pos = {};
    var i, it, tk;
    for (i = 0; i < finalItems.length; i++) {
      it = finalItems[i];
      if (!it) continue;
      tk = it.turnId || it.id;
      if (tk && pos[tk] === void 0) pos[tk] = i;
    }
    var inv = 0;
    for (i = 0; i < finalItems.length; i++) {
      it = finalItems[i];
      if (!it || !it.r1) continue;
      tk = it.turnId || it.id;
      var rp = pos[it.r1];
      if (rp !== void 0 && pos[tk] !== void 0 && pos[tk] < rp) inv++;
    }
    return inv;
  }
  function reverseRawTurnPage(rawMsgs) {
    var arr = [];
    for (var i = 0; i < rawMsgs.length; i++) arr.push(rawMsgs[i]);
    arr.reverse();
    arr.sort(function(a, b) {
      var at = a && a.turnId || a && a.id || "";
      var bt = b && b.turnId || b && b.id || "";
      if (at === bt) {
        var ra = a && a.role === "user" ? 0 : 1;
        var rb = b && b.role === "user" ? 0 : 1;
        return ra - rb;
      }
      return 0;
    });
    return arr;
  }
  function orderExportMessages(orderItems) {
    try {
      var archItems = [];
      var restItems = [];
      for (var q = 0; q < orderItems.length; q++) {
        var qi = orderItems[q];
        if (!qi || !qi.id) continue;
        if (qi.archive === true) archItems.push(qi);
        else restItems.push(qi);
      }
      var res = orderExportMessagesBase(restItems);
      if (!archItems.length) return res;
      archItems.sort(function(a, b) {
        var ao = a.order != null ? a.order : 0;
        var bo = b.order != null ? b.order : 0;
        if (ao !== bo) return ao - bo;
        return 0;
      });
      var ids = [];
      for (var am = 0; am < archItems.length; am++) ids.push(archItems[am].id);
      for (var rm = 0; rm < res.ids.length; rm++) ids.push(res.ids[rm]);
      return { ids, mode: res.mode };
    } catch (e) {
      return { ids: orderItems.filter(function(x) {
        return x && x.id;
      }).map(function(x) {
        return x.id;
      }), mode: "order-sort" };
    }
  }
  function orderExportMessagesBase(orderItems) {
    try {
      var r1 = orderByR1Chain(orderItems);
      if (r1.ok && r1.ids.length) return { ids: r1.ids, mode: "chain-r1" };
      var arr = orderByArrival(orderItems);
      if (arr.ok) return { ids: arr.ids, mode: "arrival" };
      var byOrder = [];
      for (var j = 0; j < orderItems.length; j++) {
        if (orderItems[j] && orderItems[j].id) byOrder.push(orderItems[j]);
      }
      byOrder.sort(function(a, b) {
        var ao = a.order != null ? a.order : 0;
        var bo = b.order != null ? b.order : 0;
        if (ao !== bo) return ao - bo;
        return String(a.id).localeCompare(String(b.id));
      });
      return { ids: byOrder.map(function(x) {
        return x.id;
      }), mode: "order-sort" };
    } catch (e) {
      return { ids: orderItems.filter(function(x) {
        return x && x.id;
      }).map(function(x) {
        return x.id;
      }), mode: "order-sort" };
    }
  }
  function shouldBypassCacheComplete(seenFlags, rerunUsed, convId) {
    if (!convId) return false;
    if (!(seenFlags && seenFlags[convId])) return false;
    if (rerunUsed && rerunUsed[convId]) return false;
    return true;
  }
  function shouldHideScroller(state) {
    var h = state && typeof state.scrollH === "number" ? state.scrollH : 0;
    var minH = state && typeof state.minHideH === "number" ? state.minHideH : 8e3;
    var older = !!(state && state.olderHistorySeen);
    var reachedStart = !!(state && state.reachedStart);
    var oracleIncomplete = !!(state && state.oracleIncomplete);
    if (h > minH) return { hide: true, bootstrapShort: false };
    var bootstrapShort = older && !reachedStart && oracleIncomplete;
    if (bootstrapShort) return { hide: true, bootstrapShort: true };
    return { hide: false, bootstrapShort: false };
  }
  function orderByR1Chain(items) {
    var turns = {};
    var r1Targets = {};
    var i, it, tk;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (!it || !it.id) continue;
      tk = it.turnId || it.id;
      var ord = it.order != null ? it.order : 0;
      if (!turns[tk]) {
        turns[tk] = { next: it.r1 || null, msgs: [], order: ord };
      } else {
        if (!turns[tk].next && it.r1) turns[tk].next = it.r1;
        if (ord < turns[tk].order) turns[tk].order = ord;
      }
      turns[tk].msgs.push(it);
      if (it.r1) r1Targets[it.r1] = true;
    }
    var turnIds = Object.keys(turns);
    if (!turnIds.length) return { ok: true, ids: [] };
    var heads = [];
    for (i = 0; i < turnIds.length; i++) {
      if (!r1Targets[turnIds[i]]) heads.push(turnIds[i]);
    }
    if (!heads.length) return { ok: false, ids: [] };
    var head = heads[0];
    if (heads.length > 1) {
      for (i = 1; i < heads.length; i++) {
        if (turns[heads[i]].order > turns[head].order) head = heads[i];
      }
    }
    var W = [];
    var seen = {};
    var cur = head;
    var guard = turnIds.length + 1;
    while (cur && turns[cur] && !seen[cur] && W.length < guard) {
      seen[cur] = true;
      W.push(cur);
      cur = turns[cur].next;
    }
    var M = [];
    for (i = 0; i < turnIds.length; i++) {
      if (!seen[turnIds[i]]) M.push(turnIds[i]);
    }
    M.sort(function(a, b) {
      return turns[a].order - turns[b].order;
    });
    var minOrderW = Infinity;
    for (i = 0; i < W.length; i++) {
      if (turns[W[i]].order < minOrderW) minOrderW = turns[W[i]].order;
    }
    var childrenM = {};
    for (i = 0; i < M.length; i++) {
      var tkM = M[i];
      var nxM = turns[tkM].next;
      if (nxM && turns[nxM] && !seen[nxM]) {
        (childrenM[nxM] = childrenM[nxM] || []).push(tkM);
      }
    }
    var seenSeg = {};
    var segments = [];
    for (i = 0; i < M.length; i++) {
      if (seenSeg[M[i]]) continue;
      var comp = [];
      var stack = [M[i]];
      seenSeg[M[i]] = true;
      while (stack.length) {
        var nd = stack.pop();
        comp.push(nd);
        var fw = turns[nd].next;
        if (fw && turns[fw] && !seenSeg[fw]) {
          seenSeg[fw] = true;
          stack.push(fw);
        }
        var ch = childrenM[nd];
        if (ch) {
          for (var c2 = 0; c2 < ch.length; c2++) {
            if (!seenSeg[ch[c2]]) {
              seenSeg[ch[c2]] = true;
              stack.push(ch[c2]);
            }
          }
        }
      }
      segments.push(comp);
    }
    var M_older = [];
    var M_rest = [];
    for (i = 0; i < segments.length; i++) {
      var segMin = Infinity;
      for (var s2 = 0; s2 < segments[i].length; s2++) {
        if (turns[segments[i][s2]].order < segMin) segMin = turns[segments[i][s2]].order;
      }
      var target = segMin < minOrderW ? M_older : M_rest;
      for (var a2 = 0; a2 < segments[i].length; a2++) target.push(segments[i][a2]);
    }
    M_older.sort(function(a, b) {
      return turns[a].order - turns[b].order;
    });
    M_rest.sort(function(a, b) {
      return turns[a].order - turns[b].order;
    });
    var chain = [];
    for (i = 0; i < M_older.length; i++) chain.push(M_older[i]);
    for (i = W.length - 1; i >= 0; i--) chain.push(W[i]);
    for (i = 0; i < M_rest.length; i++) chain.push(M_rest[i]);
    var ids = [];
    for (i = 0; i < chain.length; i++) {
      var msgs = turns[chain[i]].msgs.slice();
      msgs.sort(function(a, b) {
        var ra = a.role === "user" ? 0 : 1;
        var rb = b.role === "user" ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return (a.order || 0) - (b.order || 0);
      });
      for (var m = 0; m < msgs.length; m++) ids.push(msgs[m].id);
    }
    return { ok: true, ids };
  }
  function mergeRestoredTurns(networkItems, restoredTurns) {
    var netIds = {};
    var i, it, rt;
    for (i = 0; i < networkItems.length; i++) {
      it = networkItems[i];
      if (it && it.id != null) netIds[String(it.id)] = true;
    }
    var maxOrder = 0;
    for (i = 0; i < networkItems.length; i++) {
      it = networkItems[i];
      if (it && it.order != null && it.order > maxOrder) maxOrder = it.order;
    }
    var items = networkItems.slice();
    var missingCount = 0;
    for (i = 0; i < restoredTurns.length; i++) {
      rt = restoredTurns[i];
      if (!rt || rt.id == null) continue;
      if (Object.prototype.hasOwnProperty.call(netIds, String(rt.id))) continue;
      items.push({
        id: String(rt.id),
        turnId: restoredTurnKeyOf(rt.id),
        r1: null,
        // v1.6 (D15a-2/D17): r1 тейпа НЕ наследуется (повёрнутый порядок) — порядок пересчитает chain-r1
        order: i - (maxOrder + 1),
        // до сети: старший сегмент уходит в начало (фикс B)
        role: restoredRoleOf(rt),
        text: rt.text == null ? "" : String(rt.text)
      });
      missingCount++;
    }
    return { items, missingCount };
  }
  function isProtobufSkeleton(skel) {
    if (!skel || typeof skel !== "object") return false;
    var hasString = false;
    var hasArray = false;
    (function walk(n) {
      if (hasString && hasArray) return;
      if (typeof n === "string") {
        hasString = true;
        return;
      }
      if (Array.isArray(n)) {
        hasArray = true;
        for (var i = 0; i < n.length; i++) walk(n[i]);
        return;
      }
      if (n && typeof n === "object" && "arr" in n) {
        hasArray = true;
        if (n.items) walk(n.items);
      }
    })(skel);
    return hasArray && !hasString;
  }
  function effectiveReachedStart(reachedStart, added, failedSkeleton) {
    if (!reachedStart) return false;
    if (!added || added <= 0) return false;
    if (isProtobufSkeleton(failedSkeleton)) return false;
    return true;
  }
  function shouldMergeRestoredTurns(reachedStart) {
    return reachedStart !== true;
  }
  var MIN_MSGS_FOR_FALLBACK = 5;
  var MIN_TEXT_LEN_FOR_FALLBACK = 500;
  function canConfirmByScroll(state) {
    var top = !!(state && state.topReached === true);
    var engaged = !!(state && state.scrollEngaged === true);
    var tape = !!(state && state.tapeWasUsedInThisColdStart);
    var vf5 = !!(state && state.vf5OverlapSinceLoaderStart);
    var msgCount = state && typeof state.msgCount === "number" ? state.msgCount : 0;
    var textLength = state && typeof state.textLength === "number" ? state.textLength : 0;
    if (!top) return { allowed: false, lowConfidence: false, reason: "top-not-reached" };
    if (!engaged) return { allowed: false, lowConfidence: false, reason: "scroll-not-engaged" };
    if (tape) return { allowed: true, lowConfidence: false, reason: "tape-used" };
    if (vf5) return { allowed: true, lowConfidence: false, reason: "vf5-overlap" };
    if (msgCount >= MIN_MSGS_FOR_FALLBACK || textLength >= MIN_TEXT_LEN_FOR_FALLBACK) {
      return { allowed: true, lowConfidence: true, reason: "fallback-sanity-check" };
    }
    return { allowed: false, lowConfidence: false, reason: "no-tape-no-vf5-overlap-and-failed-sanity" };
  }
  var DEFAULT_PAGINATE_PAGE_CAP = 25;
  var DEFAULT_PAGINATE_TIME_CAP_MS = 6e4;
  function paginateStepDecision(state, caps) {
    caps = caps || {};
    var pageCap = typeof caps.pageCap === "number" && caps.pageCap > 0 ? caps.pageCap : DEFAULT_PAGINATE_PAGE_CAP;
    var timeCapMs = typeof caps.timeCapMs === "number" && caps.timeCapMs > 0 ? caps.timeCapMs : DEFAULT_PAGINATE_TIME_CAP_MS;
    var hasCursor = !!(state && state.hasCursor);
    var pages = state && typeof state.pages === "number" ? state.pages : 0;
    var elapsedMs = state && typeof state.elapsedMs === "number" ? state.elapsedMs : 0;
    var added = state && typeof state.added === "number" ? state.added : 0;
    var failedSkeleton = state && state.failedSkeleton;
    if (pages >= pageCap) {
      return { action: "cap", reason: "page-cap", reachedStart: false, baseComplete: false, warn: "\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043E\u0447\u043D\u044B\u0439 \u043F\u043E\u0442\u043E\u043B\u043E\u043A \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442 (" + pageCap + ")" };
    }
    if (elapsedMs >= timeCapMs) {
      return { action: "cap", reason: "time-cap", reachedStart: false, baseComplete: false, warn: "\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043E\u0447\u043D\u044B\u0439 \u043F\u043E\u0442\u043E\u043B\u043E\u043A \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442 (" + timeCapMs + "\u043C\u0441)" };
    }
    if (hasCursor) {
      return { action: "continue", reason: "cursor-alive", reachedStart: false, baseComplete: false, warn: "" };
    }
    var rs = effectiveReachedStart(true, added, failedSkeleton);
    return { action: "complete", reason: rs ? "end" : "no-start", reachedStart: rs, baseComplete: rs, warn: "" };
  }
  function resetPaginationCounters(prev) {
    return { pageCount: 0, startTs: 0 };
  }
  function completenessOracle(state) {
    var cursorExhausted = !!(state && state.cursorExhausted === true);
    var dbFirstHash = state && typeof state.dbFirstHash === "string" ? state.dbFirstHash : "";
    var serverFirstHash = state && typeof state.serverFirstHash === "string" ? state.serverFirstHash : "";
    if (!cursorExhausted) {
      return { complete: false, reason: "cursor-alive", retry: false };
    }
    if (!serverFirstHash) {
      return { complete: false, reason: "no-server-probe", retry: false };
    }
    if (dbFirstHash && serverFirstHash && dbFirstHash === serverFirstHash) {
      return { complete: true, reason: "first-hash-match", retry: false };
    }
    return { complete: false, reason: "first-hash-mismatch", retry: true };
  }
  function sanitizeFinalMessages(messages, helpers) {
    helpers = helpers || {};
    var isTA = typeof helpers.isThinkingAssistant === "function" ? helpers.isThinkingAssistant : function() {
      return false;
    };
    var strip = typeof helpers.stripLeadingThinking === "function" ? helpers.stripLeadingThinking : function(s) {
      return s;
    };
    var out = [];
    var prev = null;
    var seenUserIds = {};
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (!m) continue;
      var role = m.role === "user" ? "user" : "assistant";
      var id = m.id != null ? String(m.id) : null;
      var text = m.text == null ? "" : String(m.text);
      if (role === "assistant") {
        if (isTA(text)) {
          prev = null;
          continue;
        }
        text = strip(text);
        if (!text || !text.trim()) {
          prev = null;
          continue;
        }
      }
      if (role === "user") {
        if (id !== null && seenUserIds[id]) continue;
        if (prev && prev.role === "user") {
          if (id !== null && prev.id !== null && id === prev.id) {
            seenUserIds[id] = 1;
            continue;
          }
          if (text === prev.text) {
            if (id !== null) seenUserIds[id] = 1;
            continue;
          }
        }
        if (id !== null) seenUserIds[id] = 1;
      }
      if (prev && prev.role === "assistant" && role === "assistant") {
        if (id !== null && prev.id !== null && id === prev.id) continue;
        if (text === prev.text) continue;
      }
      var rec = { role, text };
      if (id !== null) rec.id = id;
      out.push(rec);
      prev = rec;
    }
    return out;
  }
  function newDomReadiness() {
    return { samples: [], readyByElements: false };
  }
  function advanceReadiness(state, scrollHeight, elementCount, expected) {
    state = state || newDomReadiness();
    if (elementCount > 10 && elementCount === expected) {
      state.readyByElements = true;
      return { ready: true, reason: "elements:" + elementCount, samples: state.samples.slice() };
    }
    state.samples.push(scrollHeight);
    if (state.samples.length > 3) {
      state.samples = state.samples.slice(state.samples.length - 3);
    }
    if (state.samples.length >= 2) {
      var a = state.samples[state.samples.length - 2];
      var b = state.samples[state.samples.length - 1];
      if (Math.abs(b - a) < 100) {
        var lo = Math.min(a, b);
        var hi = Math.max(a, b);
        return { ready: true, reason: "stable:" + lo + "-" + hi, samples: state.samples.slice() };
      }
    }
    return { ready: false, reason: "pending", samples: state.samples.slice() };
  }
  function shouldRetryAutoscroll(actualTurns, expectedTurns, retryCount, maxRetry) {
    if (!expectedTurns || expectedTurns <= 0) return false;
    if (retryCount >= maxRetry) return false;
    return actualTurns < expectedTurns;
  }
  var TRIM_HEAD_IDS_N = 10;
  function detectTrimState(prevProbe, snapshot) {
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
      swallow(e, "gemini-utils:detectTrimState");
    }
    return res;
  }
  function shouldPollVf5(state, nowMs) {
    state = state || {};
    var baseComplete = !!state.baseComplete;
    var reachedStart = !!state.reachedStart;
    var lastActivityAt = typeof state.lastActivityAt === "number" ? state.lastActivityAt : 0;
    var idleMs = nowMs - lastActivityAt;
    if (baseComplete && reachedStart && idleMs >= 6e4) return false;
    return true;
  }
  var PROACTIVE_THRESHOLDS = [70, 85, 95];
  function normalizeProactiveThresholds(v) {
    try {
      if (!Array.isArray(v) || v.length < 3) return null;
      var out = [];
      for (var i = 0; i < 3; i++) {
        var n = parseInt(v[i], 10);
        if (isNaN(n) || n < 1 || n > 100) return null;
        out.push(n);
      }
      if (!(out[0] < out[1] && out[1] < out[2])) return null;
      return out;
    } catch (e) {
      return null;
    }
  }
  function getProactiveThresholds() {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== "function") {
      return Promise.resolve(PROACTIVE_THRESHOLDS);
    }
    try {
      return new Promise(function(resolve) {
        chrome.storage.local.get(["aiCmProactiveThresholds"], function(data) {
          try {
            var raw = data && typeof data === "object" ? data.aiCmProactiveThresholds : void 0;
            var t = normalizeProactiveThresholds(raw);
            if (!t && raw !== void 0) {
              try {
                console.warn("[AI CM][thresholds] \u0431\u0438\u0442\u044B\u0435 aiCmProactiveThresholds \u2192 \u0434\u0435\u0444\u043E\u043B\u0442 [70,85,95]", raw);
              } catch (eW) {
              }
            }
            resolve(t || PROACTIVE_THRESHOLDS);
          } catch (eInner) {
            resolve(PROACTIVE_THRESHOLDS);
          }
        });
      });
    } catch (e) {
      return Promise.resolve(PROACTIVE_THRESHOLDS);
    }
  }
  function pickProactiveThreshold(pct, firedSet, thresholds) {
    if (typeof pct !== "number" || !isFinite(pct)) return null;
    var list = thresholds && thresholds.length === 3 ? thresholds : PROACTIVE_THRESHOLDS;
    var t = null;
    for (var i = 0; i < list.length; i++) {
      var cand = list[i];
      if (pct >= cand && !(firedSet && typeof firedSet.has === "function" && firedSet.has(cand))) {
        t = cand;
      }
    }
    return t;
  }
  var STREAM_MSGID_RE = /^(rc_[0-9a-f]+|r_[0-9a-f]+)$/;
  var STREAM_TURNID_RE = /^c_[0-9a-f]+$/;
  var STREAM_NUMID_RE = /^[0-9]{10,}$/;
  var STREAM_ROLE_TOKENS = { me: 1, model: 1, user: 1, assistant: 1 };
  function streamParseFrames(raw) {
    var frames = [];
    try {
      var lines = String(raw).split("\n");
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        if (!ln || ln.charAt(0) !== "[") continue;
        var parsedLine;
        try {
          parsedLine = JSON.parse(ln);
        } catch (e) {
          swallowSoft(e, "gemini-utils:streamParseFrames-line");
          continue;
        }
        if (!Array.isArray(parsedLine)) continue;
        for (var j = 0; j < parsedLine.length; j++) {
          var fr = parsedLine[j];
          if (!Array.isArray(fr) || fr[0] !== "wrb.fr") continue;
          var rpcid = typeof fr[1] === "string" ? fr[1] : "";
          var inner = fr[2] != null ? fr[2] : typeof fr[1] === "string" && fr[1].length > 1 && fr[1].charAt(0) === "[" ? fr[1] : null;
          var obj = null;
          if (typeof inner === "string") {
            try {
              obj = JSON.parse(inner);
            } catch (e2) {
              obj = null;
            }
          } else obj = inner;
          frames.push({ rpcid, obj });
        }
      }
    } catch (e) {
      swallowSoft(e, "gemini-utils:streamParseFrames-outer");
    }
    return frames;
  }
  function streamLastFrame(raw, rpcids) {
    var frames = streamParseFrames(raw);
    for (var i = frames.length - 1; i >= 0; i--) {
      if (frames[i].obj != null && rpcids[frames[i].rpcid]) return frames[i];
    }
    return null;
  }
  function streamIsJunkStr(s) {
    if (typeof s !== "string" || s.length === 0) return true;
    if (s.charAt(0) === "$") return true;
    if (/^[0-9]+$/.test(s)) return true;
    if (STREAM_MSGID_RE.test(s) || STREAM_TURNID_RE.test(s)) return true;
    if (/^(https?:\/\/|image\/|application\/|video\/|audio\/|text\/)/i.test(s)) return true;
    if (/\.(pdf|png|jpe?g|gif|docx?|txt|webp|csv|xlsx?)($|\?)/i.test(s)) return true;
    if (STREAM_ROLE_TOKENS[s]) return true;
    return false;
  }
  function streamCollectText(node, seen, out) {
    if (out.length > 80) return;
    if (typeof node === "string") {
      if (!streamIsJunkStr(node) && node.length > 1 && !seen[node]) {
        seen[node] = 1;
        out.push(node);
      }
      return;
    }
    if (!Array.isArray(node)) return;
    for (var i = 0; i < node.length; i++) streamCollectText(node[i], seen, out);
  }
  function extractStreamUserTurn(raw) {
    try {
      var fr = streamLastFrame(raw, { I4z33b: 1 });
      if (!fr) return null;
      var meNode = null;
      (function walk(n) {
        if (meNode || !Array.isArray(n)) return;
        if (n.length > 0 && n[0] === "me") {
          meNode = n;
          return;
        }
        for (var i = 0; i < n.length; i++) {
          walk(n[i]);
          if (meNode) return;
        }
      })(fr.obj);
      if (!meNode) return null;
      var id = null;
      (function walkId(n) {
        if (id || Array.isArray(n)) {
          if (Array.isArray(n)) {
            for (var i = 0; i < n.length; i++) {
              walkId(n[i]);
              if (id) return;
            }
          }
          return;
        }
        if (typeof n === "string" && (STREAM_NUMID_RE.test(n) || STREAM_MSGID_RE.test(n) || STREAM_TURNID_RE.test(n))) id = n;
      })(meNode);
      if (!id) return null;
      var pieces = [];
      streamCollectText(meNode, {}, pieces);
      var text = pieces.join("\n").trim();
      if (!text) return null;
      return { role: "me", id, turnId: null, text };
    } catch (e) {
      return null;
    }
  }
  function extractStreamModelTurn(raw) {
    try {
      var fr = streamLastFrame(raw, { Bsxleb: 1 });
      if (!fr) return null;
      var entry = null;
      (function walk(n) {
        if (entry || !Array.isArray(n)) return;
        if (n.length > 0 && typeof n[0] === "string" && STREAM_TURNID_RE.test(n[0])) {
          entry = n;
          return;
        }
        for (var i = 0; i < n.length; i++) {
          walk(n[i]);
          if (entry) return;
        }
      })(fr.obj);
      if (!entry) return null;
      var turnId = entry[0];
      var msgId = null;
      (function walkMsg(n) {
        if (!Array.isArray(n)) {
          if (typeof n === "string" && STREAM_MSGID_RE.test(n)) msgId = n;
          return;
        }
        for (var i = 0; i < n.length; i++) walkMsg(n[i]);
      })(entry);
      if (!msgId) return null;
      var pieces = [];
      streamCollectText(entry, {}, pieces);
      var text = pieces.join("\n").trim();
      if (!text) return null;
      return { role: "model", id: msgId, turnId, text };
    } catch (e) {
      return null;
    }
  }
  function fallbackProbeReady(meta, wideCur) {
    return Boolean(meta && meta.atEncoded && meta.baseUrl && meta.headers && wideCur);
  }
  function updateProbeMetaRetain(prev, incoming, stepOk) {
    if (!stepOk) return prev;
    if (!incoming || !incoming.atEncoded || !incoming.baseUrl || !incoming.headers) return prev;
    return incoming;
  }
  function probeTerminalGate(state) {
    var floorCount = state && typeof state.floorCount === "number" ? state.floorCount : 0;
    var baseCount = state && typeof state.baseCount === "number" ? state.baseCount : 0;
    if (floorCount > 0 && baseCount < floorCount) {
      return { block: true, reason: "below-floor-probe-terminal" };
    }
    if (state && state.pbError === true) {
      return { block: true, reason: "pb-error-page" };
    }
    return null;
  }
  function collapseGuardVerdict(state) {
    var h = state && typeof state.scrollH === "number" ? state.scrollH : 0;
    var maxSeen = state && typeof state.maxScrollHSeen === "number" ? state.maxScrollHSeen : 0;
    var baseCount = state && typeof state.baseCount === "number" ? state.baseCount : 0;
    var floorCount = state && typeof state.floorCount === "number" ? state.floorCount : 0;
    if (h < Math.max(3e3, maxSeen * 0.5) && baseCount < floorCount) {
      return { collapsed: true };
    }
    return { collapsed: false };
  }
  function untrustedTopVerdict(state) {
    var floorCount = state && typeof state.floorCount === "number" ? state.floorCount : 0;
    var hadCursor = !!(state && state.hadCursor);
    var anyGrowth = !!(state && state.anyGrowth);
    var maxSeen = state && typeof state.maxScrollHSeen === "number" ? state.maxScrollHSeen : 0;
    var viewportH = state && typeof state.viewportH === "number" ? state.viewportH : 0;
    if (floorCount === 0 && hadCursor && !anyGrowth && maxSeen <= (viewportH || 700) + 400) {
      return { untrusted: true, reason: "no-floor-no-growth" };
    }
    return null;
  }
  function pagStepBroken(state) {
    if (!state || typeof state.added !== "number") return false;
    var added = state.added;
    var nextCursor = !!state.nextCursor;
    var failedSkeleton = !!state.failedSkeleton;
    var opaqueCandidates = state && typeof state.opaqueCandidates === "number" ? state.opaqueCandidates : 0;
    if (added === 0 && !nextCursor && (failedSkeleton || opaqueCandidates === 0)) {
      return true;
    }
    return false;
  }
  function decideRestoredMerge(prev, incoming) {
    var oldLen = (prev && prev.text || "").length;
    var newLen = (incoming && incoming.text || "").length;
    if (newLen >= oldLen) return { replace: true, r1: null, turnId: null };
    return {
      replace: false,
      r1: prev && !prev.r1 && incoming && incoming.r1 ? incoming.r1 : null,
      turnId: prev && !prev.turnId && incoming && incoming.turnId ? incoming.turnId : null
    };
  }
  function isBardErrorPage(outer) {
    try {
      if (!Array.isArray(outer) || !Array.isArray(outer[0])) return false;
      var inner = outer[0][2];
      if (typeof inner === "string") {
        try {
          var metaS = "";
          var a0m = outer[0];
          for (var mi = 3; mi < a0m.length && metaS.length < 4e3; mi++) {
            try {
              metaS += JSON.stringify(a0m[mi]);
            } catch (e) {
            }
          }
          if (metaS.indexOf("type.googleapis.com") !== -1 || metaS.indexOf("BardErrorInfo") !== -1) return true;
        } catch (e) {
        }
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  function paginateErrorRetryDecision(state) {
    var cap = 3;
    var errPage = !!(state && state.errPage === true);
    var hasCursor = !!(state && state.hasCursor);
    var added = state && typeof state.added === "number" ? state.added : 0;
    var retries = state && typeof state.retries === "number" ? state.retries : 0;
    if (errPage && !hasCursor && added === 0 && retries < cap) {
      return { retry: true, backoffMs: 2e3 * (retries + 1) };
    }
    return { retry: false, backoffMs: 0 };
  }
  function paginateErrorEscalation(state) {
    state = state || {};
    var cap = state && typeof state.cap === "number" && state.cap > 0 ? state.cap : 3;
    var errPage = !!(state && state.errPage === true);
    var hasCursor = !!(state && state.hasCursor);
    var added = state && typeof state.added === "number" ? state.added : 0;
    var retries = state && typeof state.retries === "number" ? state.retries : 0;
    if (!errPage || hasCursor || added > 0) return { escalate: false, reason: "not-ready" };
    if (retries < cap) return { escalate: false, reason: "retry-budget-alive" };
    if (state && state.loaderRunning) return { escalate: false, reason: "loader-running" };
    if (state && state.nativeEscalationUsed) return { escalate: false, reason: "native-escalation-used" };
    return { escalate: true, reason: "err1177-exhausted" };
  }
  function paginatePaceDelayMs(depth, errSeen) {
    if (!errSeen) return 0;
    var d = typeof depth === "number" && depth > 0 ? depth : 0;
    return 1200 + Math.min(d, 8) * 75;
  }
  function isShortHexMarker(s) {
    if (typeof s !== "string") return false;
    if (s.length >= 40) return false;
    return /^[0-9a-fA-F]+$/.test(s);
  }
  function classifyOpaque(s) {
    if (typeof s !== "string") return false;
    if (s.length < 40 || s.length > 2e3) return false;
    if (!/^[A-Za-z0-9+\/]+={0,2}$/.test(s)) return false;
    if (isShortHexMarker(s)) return false;
    if (s.indexOf("$AVuibg") === 0) return false;
    return true;
  }
  function startsWithMimeType(s) {
    return s.indexOf("image/") === 0 || s.indexOf("video/") === 0 || s.indexOf("audio/") === 0 || s.indexOf("application/") === 0 || s.indexOf("text/") === 0;
  }
  function classifyOpaqueWide(s) {
    if (typeof s !== "string") return false;
    if (s.length < 16 || s.length > 2e3) return false;
    if (!/^[A-Za-z0-9+/=]+$/.test(s)) return false;
    if (isShortHexMarker(s)) return false;
    if (s.indexOf("$AVuibg") === 0) return false;
    if (startsWithMimeType(s)) return false;
    return true;
  }
  function extractCursor(turns) {
    var c = [];
    (function collect(n) {
      if (c.length > 8) return;
      if (typeof n === "string") {
        if (classifyOpaque(n)) c.push(n);
        return;
      }
      if (Array.isArray(n)) {
        for (var i = 0; i < n.length; i++) collect(n[i]);
      }
    })(turns);
    if (!c.length) return null;
    var best = c[c.length - 1];
    for (var j = 0; j < c.length; j++) {
      if (c[j].length > best.length) best = c[j];
    }
    return best;
  }
  function extractCursorWide(outer) {
    var best = null;
    function scanWideZone(zone) {
      (function walkW(n) {
        if (typeof n === "string") {
          if (classifyOpaqueWide(n) && (!best || n.length > best.length)) best = n;
          return;
        }
        if (Array.isArray(n)) {
          for (var i = 0; i < n.length; i++) walkW(n[i]);
        }
      })(zone);
    }
    try {
      if (!Array.isArray(outer) || !Array.isArray(outer[0])) return null;
      var innerParsed = null;
      try {
        var innerStr = outer[0][2];
        if (typeof innerStr === "string") {
          var parsedInner = JSON.parse(innerStr);
          if (Array.isArray(parsedInner)) innerParsed = parsedInner;
        }
      } catch (eH13In) {
        innerParsed = null;
      }
      if (innerParsed) scanWideZone(innerParsed);
      scanWideZone(outer[0].slice(3));
      return best;
    } catch (eH13) {
      return null;
    }
  }
  function archiveContentKey(m) {
    var role = m && m.role === "user" ? "user" : "assistant";
    var text = String(m && (m.text != null ? m.text : m.content) || "").replace(/\s+/g, " ").trim();
    return role + "\0" + text;
  }
  function archiveTurnId(m, index) {
    if (m && m.id != null && String(m.id)) return String(m.id);
    var s = archiveContentKey(m);
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
    var hex = (h >>> 0).toString(16);
    while (hex.length < 6) hex = "0" + hex;
    return "a:" + index + ":" + hex.slice(-6);
  }
  function archiveMergeTurns(networkItems, archiveMessages) {
    var net = Array.isArray(networkItems) ? networkItems : [];
    var arch = Array.isArray(archiveMessages) ? archiveMessages : [];
    var seenIds = {};
    var seenKeys = {};
    var i, it;
    for (i = 0; i < net.length; i++) {
      it = net[i];
      if (!it) continue;
      if (it.id != null) seenIds[String(it.id)] = true;
      var kNet = archiveContentKey(it);
      if (kNet !== "assistant\0" && kNet !== "user\0") seenKeys[kNet] = true;
    }
    var items = [];
    var duplicateCount = 0;
    for (i = 0; i < arch.length; i++) {
      var m = arch[i];
      if (!m) continue;
      var key = archiveContentKey(m);
      if (key === "assistant\0" || key === "user\0") continue;
      var id = archiveTurnId(m, i);
      if (seenIds[id] || seenKeys[key]) {
        duplicateCount++;
        continue;
      }
      seenIds[id] = true;
      seenKeys[key] = true;
      items.push({
        id,
        turnId: id,
        r1: null,
        // порядок архива не наследуем
        order: i - (arch.length + 1),
        // старший сегмент → в начало экспорта
        role: m.role === "user" ? "user" : "assistant",
        text: String(m.text == null ? "" : m.text)
      });
    }
    return { items, addedCount: items.length, duplicateCount };
  }
  function archiveFloorRecord(existingFloor, archiveCount, archiveTextLen) {
    var prevCount = existingFloor && typeof existingFloor.count === "number" && existingFloor.count > 0 ? existingFloor.count : 0;
    var prevLen = existingFloor && typeof existingFloor.effectiveLen === "number" && existingFloor.effectiveLen > 0 ? existingFloor.effectiveLen : 0;
    var archCount = typeof archiveCount === "number" && archiveCount > 0 ? archiveCount : 0;
    var archLen = typeof archiveTextLen === "number" && archiveTextLen > 0 ? archiveTextLen : 0;
    var count = Math.max(prevCount, archCount);
    var len = Math.max(prevLen, archLen);
    if (!count && !len) return null;
    if (count <= prevCount && len <= prevLen) return null;
    return { count, effectiveLen: len, source: "archive" };
  }
  function archiveCompleteVerdict(opts) {
    var o = opts || {};
    var archConv = String(o.archiveConvId || "");
    var curConv = String(o.currentConvId || "");
    var archiveCount = typeof o.archiveCount === "number" && o.archiveCount > 0 ? o.archiveCount : 0;
    var baseCount = typeof o.baseCount === "number" && o.baseCount > 0 ? o.baseCount : 0;
    var floorCount = typeof o.floorCount === "number" && o.floorCount > 0 ? o.floorCount : 0;
    var live = o.live && typeof o.live === "object" ? o.live : null;
    if (!archConv) return { complete: false, reason: "no-archive" };
    if (!curConv) return { complete: false, reason: "no-conv" };
    if (archConv !== curConv) return { complete: false, reason: "conv-mismatch" };
    if (!archiveCount) return { complete: false, reason: "archive-empty" };
    if (live && live.loaderRunning === true) return { complete: false, reason: "loader-running" };
    if (baseCount < archiveCount) return { complete: false, reason: "below-archive-count" };
    if (live) {
      if (live.loaderDone !== true && live.grewBeyondArchive !== true) {
        return { complete: false, reason: "live-loader-pending" };
      }
      if (live.active === true) return { complete: false, reason: "live-loading" };
    }
    if (floorCount > 0 && baseCount < floorCount) return { complete: false, reason: "below-floor" };
    return { complete: true, reason: "archive-complete" };
  }
  var api = {
    floorStorageKey,
    archiveContentKey,
    archiveMergeTurns,
    archiveFloorRecord,
    archiveCompleteVerdict,
    PROACTIVE_THRESHOLDS,
    normalizeProactiveThresholds,
    getProactiveThresholds,
    pickProactiveThreshold,
    tapeStorageKey,
    tapeVersionOf,
    shouldAcceptTape,
    loadFloor,
    saveFloor,
    resolveFloor,
    diagnoseFloorAbsence,
    shouldSaveFloor,
    selfHealFloorVerdict,
    writeSelfHealedFloor,
    shouldFullRebuild,
    isSubsetIds,
    shouldDisjointReset,
    assignPageOrders,
    orderPages,
    reverseRawTurnPage,
    orderPageByR1,
    orderRestoredTape,
    countR1Inversions,
    orderByArrival,
    orderByR1Chain,
    orderExportMessages,
    shouldBypassCacheComplete,
    shouldHideScroller,
    mergeRestoredTurns,
    isProtobufSkeleton,
    effectiveReachedStart,
    shouldMergeRestoredTurns,
    canConfirmByScroll,
    paginateStepDecision,
    resetPaginationCounters,
    completenessOracle,
    DEFAULT_PAGINATE_PAGE_CAP,
    DEFAULT_PAGINATE_TIME_CAP_MS,
    sanitizeFinalMessages,
    newDomReadiness,
    advanceReadiness,
    shouldRetryAutoscroll,
    shouldPollVf5,
    detectTrimState,
    extractStreamUserTurn,
    extractStreamModelTurn,
    fallbackProbeReady,
    updateProbeMetaRetain,
    probeTerminalGate,
    collapseGuardVerdict,
    untrustedTopVerdict,
    pagStepBroken,
    isBardErrorPage,
    paginateErrorRetryDecision,
    paginateErrorEscalation,
    paginatePaceDelayMs,
    classifyOpaque,
    classifyOpaqueWide,
    extractCursor,
    extractCursorWide,
    decideRestoredMerge
  };
  if (typeof window !== "undefined") {
    window.GeminiInterceptLogic = api;
  }
  if (typeof self !== "undefined") {
    self.GeminiInterceptLogic = api;
  }
})();
