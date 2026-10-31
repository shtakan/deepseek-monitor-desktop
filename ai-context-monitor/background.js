(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // background.js
  var require_background = __commonJS({
    "background.js"(exports, module) {
      function aiCmIsFirefox() {
        try {
          var api = typeof browser !== "undefined" && browser && browser.runtime ? browser : typeof chrome !== "undefined" && chrome && chrome.runtime ? chrome : null;
          if (!api) return false;
          if (api.runtime && typeof api.runtime.getURL === "function") {
            return String(api.runtime.getURL("")).indexOf("moz-extension://") === 0;
          }
          if (typeof api.getURL === "function") {
            return String(api.getURL("")).indexOf("moz-extension://") === 0;
          }
          return false;
        } catch (e) {
          return false;
        }
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = { aiCmIsFirefox };
      }
      (function() {
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
        var TAPE_ORDER_VERSION = 2;
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
        if (typeof module !== "undefined" && module.exports) {
          module.exports = api;
        }
      })();
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
          if (ids.indexOf("ai-cm-gemini-intercept-v12") === -1) {
            try {
              await chrome.scripting.unregisterContentScripts({ ids: ["ai-cm-gemini-intercept", "ai-cm-gemini-intercept-v2", "ai-cm-gemini-intercept-v3", "ai-cm-gemini-intercept-v4", "ai-cm-gemini-intercept-v5", "ai-cm-gemini-intercept-v6", "ai-cm-gemini-intercept-v7", "ai-cm-gemini-intercept-v8", "ai-cm-gemini-intercept-v9", "ai-cm-gemini-intercept-v10", "ai-cm-gemini-intercept-v11"] });
            } catch (eUnregGemini) {
            }
            await registerSafe("ai-cm-gemini-intercept-v12", {
              id: "ai-cm-gemini-intercept-v12",
              matches: ["https://gemini.google.com/*", "https://aistudio.google.com/*"],
              js: ["utils/debug.js", "utils/gemini-batchexecute-parser.js", "utils/gemini-intercept-logic.js", "core/gemini-hidden-scroll.js", "core/gemini-diag.js", "core/gemini-rpc.js", "core/gemini-parse.js", "core/gemini-sse.js", "core/pagination/pagination.js", "core/gemini-loader-scroll.js", "core/gemini-files.js", "core/gemini-ingest.js", "core/gemini-overlay.js", "core/gemini-archive.js", "core/gemini-oracle.js", "core/gemini-intercept.js"],
              runAt: "document_start",
              world: "MAIN",
              allFrames: false
            });
            console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Gemini (v12) \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
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
          if (ids.indexOf("ai-cm-qwen-intercept-v3") === -1) {
            try {
              await chrome.scripting.unregisterContentScripts({ ids: ["ai-cm-qwen-intercept", "ai-cm-qwen-intercept-v2"] });
            } catch (eUnregQwen) {
            }
            await registerSafe("ai-cm-qwen-intercept-v3", {
              id: "ai-cm-qwen-intercept-v3",
              matches: ["https://chat.qwen.ai/*"],
              js: ["utils/debug.js", "utils/stream-frames.js", "core/qwen-pagination.js", "core/qwen-files.js", "core/qwen-intercept.js"],
              runAt: "document_start",
              world: "MAIN",
              allFrames: false
            });
            console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A Qwen (v3, \u043F\u0430\u0433\u0438\u043D\u0430\u0446\u0438\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u0438 + \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F) \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
          }
          if (ids.indexOf("ai-cm-aistudio-intercept-v2") === -1) {
            try {
              await chrome.scripting.unregisterContentScripts({ ids: ["ai-cm-aistudio-intercept"] });
            } catch (eUnregAistudio) {
            }
            await registerSafe("ai-cm-aistudio-intercept-v2", {
              id: "ai-cm-aistudio-intercept-v2",
              matches: ["https://aistudio.google.com/*"],
              js: ["utils/debug.js", "core/aistudio-intercept.js", "core/aistudio-files.js"],
              runAt: "document_start",
              world: "MAIN",
              allFrames: false
            });
            console.log("AI Context Monitor: \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0447\u0438\u043A AI Studio (v2, \u0438\u0441\u0442\u043E\u0440\u0438\u044F + \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F) \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D (\u043C\u0438\u0440 \u0441\u0430\u0439\u0442\u0430, document_start)");
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
        if (aiCmIsFirefox()) {
          return Promise.resolve({ ok: false, reason: "byok-disabled-firefox" });
        }
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
    }
  });
  require_background();
})();
//# sourceMappingURL=background.js.map
