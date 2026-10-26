// Заглушки для логгера и отладочных функций расширения
if (typeof window.debugLog === 'undefined') {
  window.debugLog = function(...args) {
    console.log('[AI CM DEBUG]', ...args);
  };
}
if (typeof window.__aiCmSetDebugLogs === 'undefined') {
  window.__aiCmSetDebugLogs = function() {};
}

// Эмулятор Chrome API для Pake / Tauri
(function() {
  window.chrome = window.chrome || {};

  var messageListeners = [];
  var storageListeners = [];

  var onMessageStub = {
    addListener: function(fn) {
      if (typeof fn === 'function' && !messageListeners.includes(fn)) {
        messageListeners.push(fn);
      }
    },
    removeListener: function(fn) {
      messageListeners = messageListeners.filter(function(l) { return l !== fn; });
    },
    hasListener: function(fn) { return messageListeners.includes(fn); }
  };

  var onChangedStub = {
    addListener: function(fn) {
      if (typeof fn === 'function' && !storageListeners.includes(fn)) {
        storageListeners.push(fn);
      }
    },
    removeListener: function(fn) {
      storageListeners = storageListeners.filter(function(l) { return l !== fn; });
    }
  };

  function createEventStub() {
    return {
      addListener: function() {},
      removeListener: function() {},
      hasListener: function() { return false; },
      dispatch: function() {}
    };
  }

  // Runtime API
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.runtime.id = 'pake-ai-context-monitor';
  window.chrome.runtime.getURL = window.chrome.runtime.getURL || function(path) { return path; };
  window.chrome.runtime.getManifest = window.chrome.runtime.getManifest || function() {
    return { version: '2.0.29', manifest_version: 3, name: 'AI Context Monitor' };
  };
  window.chrome.runtime.onMessage = onMessageStub;
  window.chrome.runtime.onInstalled = createEventStub();
  window.chrome.runtime.onStartup = createEventStub();
  window.chrome.runtime.lastError = null;

  // Отправка сообщений между фоновым сервисом и страницей
  window.chrome.runtime.sendMessage = function(message, callback) {
    return new Promise(function(resolve) {
      var responded = false;
      var sender = { id: 'pake-ai-context-monitor', tab: { id: 1 } };

      var sendResponse = function(response) {
        if (!responded) {
          responded = true;
          if (callback) callback(response);
          resolve(response);
        }
      };

      var listeners = messageListeners.slice();
      listeners.forEach(function(listener) {
        try {
          listener(message, sender, sendResponse);
        } catch (e) {
          console.error('[AI CM Polyfill] Ошибка обработчика:', e);
        }
      });

      if (!responded) {
        setTimeout(function() {
          if (!responded) {
            responded = true;
            if (callback) callback();
            resolve();
          }
        }, 10);
      }
    });
  };

  // Storage API
  window.chrome.storage = window.chrome.storage || {};
  window.chrome.storage.onChanged = onChangedStub;

  // Настройки открываются в iframe поверх страницы (аналог иконки расширения).
  // Запись из iframe должна сразу доходить до content.js в родительском окне.
  var IS_OPTIONS_FRAME = (typeof window !== 'undefined') && window.__AI_CM_OPTIONS_FRAME__ === true;

  function notifyStorage(changes, area) {
    storageListeners.forEach(function(listener) {
      try { listener(changes, area); } catch (e) {}
    });
    if (IS_OPTIONS_FRAME) {
      try { parent.postMessage({ __aiCmStorage: 1, changes: changes, area: area }, '*'); } catch (e) {}
    }
  }

  function readStored(store, key) {
    var raw = store.getItem('ai_cm_' + key);
    if (raw === null) return undefined;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }

  if (!window.chrome.storage.local) {
    window.chrome.storage.local = {
      get: function(keys, callback) {
        var res = {};
        var defaults = {
          showWidget: true,
          showBadge: true,
          enabled: true
          // ai_cm_safe_pct_<site> НЕ задаём: как и в Chrome, порог по умолчанию
          // не задан (100% окна), пока пользователь сам не выставит его в панели.
        };

        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);

        keysArr.forEach(function(k) {
          var val = readStored(localStorage, k);
          if (val !== undefined) {
            res[k] = val;
          } else {
            res[k] = defaults[k] !== undefined ? defaults[k] : true;
          }
        });

        if (typeof keys === 'object' && !Array.isArray(keys) && keys !== null) {
          Object.keys(keys).forEach(function(k) {
            if (res[k] === undefined) res[k] = keys[k];
          });
        }

        if (callback) callback(res);
        return Promise.resolve(res);
      },
      set: function(obj, callback) {
        var changes = {};
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(function(k) {
            var oldVal = readStored(localStorage, k);
            var newVal = obj[k];
            localStorage.setItem('ai_cm_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);
            changes[k] = { oldValue: oldVal, newValue: newVal };
          });
        }
        notifyStorage(changes, 'local');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: function(keys, callback) {
        var arr = Array.isArray(keys) ? keys : [keys];
        var changes = {};
        arr.forEach(function(k) {
          var oldVal = readStored(localStorage, k);
          if (oldVal !== undefined) {
            localStorage.removeItem('ai_cm_' + k);
            changes[k] = { oldValue: oldVal, newValue: undefined };
          }
        });
        if (Object.keys(changes).length) notifyStorage(changes, 'local');
        if (callback) callback();
        return Promise.resolve();
      },
      getKeys: function(callback) {
        var keys = [];
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('ai_cm_') === 0) keys.push(k.slice(6));
          }
        } catch (e) {}
        if (callback) callback(keys);
        return Promise.resolve(keys);
      }
    };
  }

  // session: как в Chrome — отдельное хранилище (BYOK-ключи не должны попадать в local)
  if (!window.chrome.storage.session) {
    window.chrome.storage.session = {
      get: function(keys, callback) {
        var res = {};
        var keysArr = Array.isArray(keys) ? keys : (typeof keys === 'object' && keys !== null ? Object.keys(keys) : [keys]);
        keysArr.forEach(function(k) {
          var val = readStored(sessionStorage, 'sess_' + k);
          if (val !== undefined) res[k] = val;
        });
        if (callback) callback(res);
        return Promise.resolve(res);
      },
      set: function(obj, callback) {
        var changes = {};
        if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(function(k) {
            var oldVal = readStored(sessionStorage, 'sess_' + k);
            var newVal = obj[k];
            sessionStorage.setItem('ai_cm_sess_' + k, typeof newVal === 'object' ? JSON.stringify(newVal) : newVal);
            changes[k] = { oldValue: oldVal, newValue: newVal };
          });
        }
        notifyStorage(changes, 'session');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: function(keys, callback) {
        var arr = Array.isArray(keys) ? keys : [keys];
        var changes = {};
        arr.forEach(function(k) {
          var oldVal = readStored(sessionStorage, 'sess_' + k);
          if (oldVal !== undefined) {
            sessionStorage.removeItem('ai_cm_sess_' + k);
            changes[k] = { oldValue: oldVal, newValue: undefined };
          }
        });
        if (Object.keys(changes).length) notifyStorage(changes, 'session');
        if (callback) callback();
        return Promise.resolve();
      }
    };
  }

  window.chrome.storage.sync = window.chrome.storage.local;

  if (!IS_OPTIONS_FRAME) {
    try {
      window.addEventListener('message', function(ev) {
        var d = ev && ev.data;
        if (!d || d.__aiCmStorage !== 1 || !d.changes) return;
        storageListeners.forEach(function(listener) {
          try { listener(d.changes, d.area || 'local'); } catch (e) {}
        });
      });
    } catch (e) {}
  }

  // Tabs API
  window.chrome.tabs = window.chrome.tabs || {};
  window.chrome.tabs.query = function(q, cb) {
    var href = (typeof location !== 'undefined' ? location.href : '');
    var title = (typeof document !== 'undefined' ? document.title : '');
    // Настройки живут в srcdoc-iframe: активная "вкладка" — это родительская страница.
    if (IS_OPTIONS_FRAME) {
      try { if (parent && parent.location) href = parent.location.href; } catch (e) {}
      try { if (parent && parent.document) title = parent.document.title; } catch (e) {}
    }
    var tab = { id: 1, active: true, currentWindow: true, url: href, title: title };
    if (cb) cb([tab]);
    return Promise.resolve([tab]);
  };
  window.chrome.tabs.sendMessage = function(tabId, message, callback) {
    return window.chrome.runtime.sendMessage(message, callback);
  };
  window.chrome.tabs.create = function(opts, cb) {
    try { if (opts && opts.url) window.open(opts.url, '_blank'); } catch (e) {}
    if (cb) cb();
  };
  window.chrome.tabs.onUpdated = createEventStub();
  window.chrome.tabs.onActivated = createEventStub();

  window.chrome.action = window.chrome.action || {
    setIcon: function() {}, setBadgeText: function() {}, setBadgeBackgroundColor: function() {}
  };
})();