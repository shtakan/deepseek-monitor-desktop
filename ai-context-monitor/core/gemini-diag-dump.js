(function() {
  if (typeof window !== "undefined" && window.AiCmGeminiDiagDump) return;
  var D = null;
  var Fn = { __bind: null };
  function __bind(d) {
    D = d;
    try {
      window.addEventListener("ai-cm-diag-request", function() {
        if (!D) {
          debugLog("error", "[gemini-diag-dump] D is null, event ignored");
          return;
        }
        try {
          var turnDump = [];
          var mapKeys = Object.keys(D.turnsMap);
          for (var di = 0; di < mapKeys.length; di++) {
            var dk = mapKeys[di];
            var dRec = D.turnsMap[dk];
            turnDump.push({
              id: dk,
              order: dRec.order,
              pageMode: dRec.pageMode || "",
              r1: dRec.r1 || null,
              role: dRec.role,
              preview: String(dRec.text || "").slice(0, 60).replace(/\s+/g, " ")
            });
          }
          var orderedPreviews = [];
          for (var op = 0; op < D.lastOrderedIds.length; op++) {
            var oid = D.lastOrderedIds[op];
            var oRec = D.turnsMap[oid];
            orderedPreviews.push((oRec ? oRec.role + "|" : "?|") + (oRec ? String(oRec.text || "").slice(0, 60).replace(/\s+/g, " ") : oid));
          }
          var response = {
            logsIntercept: typeof __aiCmGetLogRing === "function" ? __aiCmGetLogRing() : [],
            turns: turnDump,
            orderedPreviews,
            failedPageSkeleton: D.lastFailedSkeleton || null
          };
          window.dispatchEvent(new CustomEvent("ai-cm-diag-response", { detail: response }));
        } catch (e) {
        }
      });
    } catch (e) {
    }
  }
  Fn.__bind = __bind;
  if (typeof window !== "undefined") window.AiCmGeminiDiagDump = Fn;
  if (typeof module !== "undefined" && module.exports) module.exports = Fn;
})();
