(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // shared-i18n.js
  var require_shared_i18n = __commonJS({
    "shared-i18n.js"(exports, module) {
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
    }
  });
  require_shared_i18n();
})();
//# sourceMappingURL=shared-i18n.js.map
