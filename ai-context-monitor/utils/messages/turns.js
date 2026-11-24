var __aiCmMessagesTurnsClassic = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var stdin_exports = {};
  __export(stdin_exports, {
    aiCmMergeTurnSegments: () => aiCmMergeTurnSegments,
    mergeTurnSegments: () => mergeTurnSegments
  });
  function mergeTurnSegments(segs) {
    if (!Array.isArray(segs) || !segs.length) return segs;
    const out = [];
    let lastTurnId = "";
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i] || {};
      const txt = seg && seg.text ? String(seg.text).trim() : "";
      if (!txt) continue;
      const role = seg.role === "user" ? "user" : "assistant";
      const segTurnId = typeof seg.turnId === "string" ? seg.turnId : "";
      const canMerge = out.length > 0 && out[out.length - 1].role === role && (!lastTurnId || !segTurnId || lastTurnId === segTurnId);
      if (canMerge) {
        out[out.length - 1].text += "\n\n" + txt;
        if (!lastTurnId && segTurnId) lastTurnId = segTurnId;
      } else {
        out.push({ role, text: txt });
        lastTurnId = segTurnId;
      }
    }
    return out;
  }
  const aiCmMergeTurnSegments = mergeTurnSegments;
  return __toCommonJS(stdin_exports);
})();

Object.assign(globalThis, __aiCmMessagesTurnsClassic);

globalThis.AiCmMessagesTurns = __aiCmMessagesTurnsClassic;
