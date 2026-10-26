// build-pake-bundle.js
// Собирает DeepSeek-only бандл для Pake/Electron-инъекции в правильном порядке.
// Порядок взят 1:1 из ai-context-monitor/background.js (chrome.scripting.registerContentScripts,
// id "ai-cm-deepseek-intercept-v11", runAt document_start, world MAIN).
//
// Использование:
//   node build-pake-bundle.js
//   node build-pake-bundle.js --out pake-bundle.deepseek.js
//
// Почему это важно: core/deepseek-intercept.js в конце своего IIFE связывает
// зависимости через window.AiCmDeepseek*. Если модуль ещё не загружен, ядро
// навсегда запоминает null и forwarder падает на первом же сетевом ответе.
// Алфавитный порядок Get-ChildItem ставил intercept РАНЬШЕ netsync/parse/sse/refetch/net,
// из-за чего перехват истории/SSE не работал, а виджет падал в DOM-фолбэк.

'use strict';

const fs = require('fs');
const path = require('path');

const extDir = path.join(__dirname, 'ai-context-monitor');
const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const outFile = outArg !== -1 && args[outArg + 1]
  ? path.resolve(args[outArg + 1])
  : path.join(extDir, 'pake-bundle.deepseek.js');

// Точный порядок из background.js (js[] одного registration).
const MAIN_WORLD_FILES = [
  'utils/debug.js',
  'core/deepseek-diag.js',
  'core/deepseek-netsync.js',
  'core/deepseek-refetch.js',
  'core/deepseek-parse.js',
  'core/deepseek-conv.js',
  'core/deepseek-emit.js',
  'core/deepseek-net.js',
  'core/deepseek-ingest.js',
  'core/deepseek-files.js',
  'core/deepseek-sse.js',
  'core/deepseek-intercept.js',
];

// Страховка от регрессии: если в расширении появился новый core/deepseek-*.js, но его
// забыли добавить в MAIN_WORLD_FILES, модуль молча выпадет из бандла. Именно так однажды
// пропал core/deepseek-files.js — и экспорт потерял тексты вложений.
const missingMainWorld = fs.readdirSync(path.join(extDir, 'core'))
  .filter((name) => /^deepseek-.*\.js$/.test(name))
  .filter((name) => !MAIN_WORLD_FILES.includes('core/' + name));
if (missingMainWorld.length) {
  throw new Error(
    'В MAIN_WORLD_FILES не включены модули: ' + missingMainWorld.join(', ') +
    '. Добавьте их в правильном порядке (до core/deepseek-intercept.js).'
  );
}

const UI_FILES = ['content.js'];

function read(rel) {
  const abs = path.join(extDir, rel);
  if (!fs.existsSync(abs)) throw new Error('Не найден файл: ' + abs);
  return fs.readFileSync(abs, 'utf8');
}

function section(rel, code) {
  return '\n\n/* ===== ' + rel + ' ===== */\n\n' + code.replace(/\s+$/, '') + '\n';
}

// Инлайн <script> в HTML: последовательность "</script" внутри строки оборвала бы
// тег. Экранируем слэш — для JS-строки значение не меняется ("<\/script" === "</script>").
function inlineForHtml(code) {
  return code.split('</script').join('<\\/script');
}

// 1. Полифил chrome.* для page-world (storage/localStorage, runtime messages, tabs/action).
let bundle = '/* AI Context Monitor — DeepSeek bundle (generated) */\n';
bundle += '/* Chrome MV3 MAIN-world interceptors + UI, order from background.js */\n';
bundle += section('polyfill.js', read('polyfill.js'));

// 2. Relay: кэширует последний снимок и умеет повторно отдать его UI.
//    Нужен, если первый ai-cm-full-history пришёл до инициализации content.js.
bundle += section('pake-relay.js', `
(function () {
  var lastSnapshot = null;
  try {
    window.addEventListener('ai-cm-full-history', function (ev) {
      try { lastSnapshot = (ev && ev.detail) ? ev.detail : null; } catch (e) { }
    });
  } catch (e) { }
  window.__aiCmPackReplay = function () {
    if (!lastSnapshot) return false;
    try {
      window.dispatchEvent(new CustomEvent('ai-cm-full-history', { detail: lastSnapshot }));
      return true;
    } catch (e) { return false; }
  };
})();
`);

// 3. MAIN-world перехватчики в строгом порядке зависимостей.
for (const rel of MAIN_WORLD_FILES) {
  bundle += section(rel, read(rel));
}

// 4. UI (content.js) после DOMReady + повторная отдача кэшированного снимка.
let ui = UI_FILES.map((rel) => read(rel)).join('\n\n');

bundle += `
/* ===== UI bootstrap (content.js) ===== */
(function () {
  function replay() {
    try { if (typeof window.__aiCmPackReplay === 'function') window.__aiCmPackReplay(); } catch (e) { }
  }
  function initUI() {
    try {
${ui}
    } catch (e) {
      console.error('[AI CM][pack] UI init error:', e);
    }
    replay();
    setTimeout(replay, 500);
    setTimeout(replay, 1500);
    setTimeout(replay, 3000);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initUI();
  } else {
    document.addEventListener('DOMContentLoaded', initUI);
  }
  window.addEventListener('load', replay);
})();
`;

// 5. Сворачивание цепочек рассуждений DeepSeek по умолчанию.
//    Сайт сворачивает блок нативным кликом по заголовку (контент .ds-think-content
//    удаляется из DOM). Скрипт делает это для уже отрисованных и новых блоков,
//    но не трогает блок, который пользователь раскрыл вручную.
bundle += section('pake-think-collapse', `
(function () {
  if (window.__aiCmThinkCollapseInstalled) return;
  window.__aiCmThinkCollapseInstalled = true;

  var THINK_RE = /(Думал|Думаю|Размышлял|Размышляю|Thought|Thinking|思考|已思考)/i;
  var autoClicking = false;

  function findHeader(block) {
    if (!block) return null;
    for (var i = 0; i < block.children.length; i++) {
      var c = block.children[i];
      if (c.classList && c.classList.contains('ds-think-content')) continue;
      var txt = (c.textContent || '').trim();
      if (txt && txt.length < 80 && THINK_RE.test(txt)) return c;
    }
    return null;
  }

  function collapseOne(content) {
    var block = content.parentElement;
    if (!block) return false;
    if (block.getAttribute('data-ai-cm-think-auto') === '1') return false;
    if (block.getAttribute('data-ai-cm-think-manual') === '1') return false;
    var msg = block.closest ? block.closest('.ds-message') : null;
    if (msg && msg.getAttribute('data-ai-cm-think-manual') === '1') return false;
    var header = findHeader(block);
    if (!header) return false;
    block.setAttribute('data-ai-cm-think-auto', '1');
    autoClicking = true;
    try { header.click(); } catch (e) {}
    setTimeout(function () { autoClicking = false; }, 0);
    return true;
  }

  function scan() {
    var list = document.querySelectorAll('.ds-think-content');
    for (var i = 0; i < list.length; i++) collapseOne(list[i]);
  }

  // Ручной клик по заголовку помечает блок/сообщение: больше не сворачиваем.
  document.addEventListener('click', function (ev) {
    if (autoClicking) return;
    var n = ev.target;
    for (var i = 0; i < 7 && n; i++, n = n.parentElement) {
      var header = findHeader(n);
      if (header && (header === ev.target || header.contains(ev.target))) {
        n.setAttribute('data-ai-cm-think-manual', '1');
        var msg = n.closest ? n.closest('.ds-message') : null;
        if (msg) msg.setAttribute('data-ai-cm-think-manual', '1');
        return;
      }
    }
  }, true);

  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; scan(); }, 150);
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].addedNodes && muts[i].addedNodes.length) { schedule(); return; }
    }
  });
  try { mo.observe(document.body || document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  setInterval(schedule, 2000);
  scan();
})();
`);

// 6. Встроенная страница настроек (аналог клика по иконке расширения в Chrome).
//    options.html + options.css + options.js инлайнятся в srcdoc-iframe: в WebView2
//    inline-скрипты в srcdoc работают (проверено), а chrome.* даёт polyfill.
let optionsHtml = read('options/options.html');
optionsHtml = optionsHtml.replace(
  '<link rel="stylesheet" href="options.css">',
  function () { return '<style>\n' + read('options/options.css') + '\n</style>'; }
);
optionsHtml = optionsHtml.replace(
  '<script src="../options.js"></script>',
  function () {
    // ВАЖНО: replace-функция, а не строка — иначе "$&" внутри options.js
    // подставит сюда найденный тег и сломает инлайн-скрипт.
    return '<script>\n' + inlineForHtml(read('polyfill.js')) + '\n</script>\n<script>\n' + inlineForHtml(read('options.js')) + '\n</script>';
  }
);
optionsHtml = optionsHtml.replace(
  '<head>',
  '<head>\n<script>window.__AI_CM_OPTIONS_FRAME__=true;</script>'
);

bundle += section('pake-settings', `
(function () {
  var OPTIONS_HTML = ${JSON.stringify(optionsHtml)};
  var overlay = null;

  function closeOptions() {
    try { document.removeEventListener('keydown', onKeyDown); } catch (e) {}
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function onKeyDown(ev) {
    if (ev && ev.key === 'Escape') closeOptions();
  }

  function openOptions() {
    if (overlay) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', openOptions); return; }

    overlay = document.createElement('div');
    overlay.id = 'ai-cm-options-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(17,24,39,.55);display:flex;align-items:center;justify-content:center;padding:24px;';

    var frame = document.createElement('iframe');
    frame.setAttribute('title', 'AI Context Monitor — настройки');
    frame.style.cssText = 'width:420px;max-width:96vw;height:min(780px,92vh);border:0;border-radius:14px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.35);';
    frame.addEventListener('load', function () { bindFrame(frame); });
    frame.srcdoc = OPTIONS_HTML;

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть настройки');
    close.textContent = '✕';
    close.style.cssText = 'position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;border:0;background:#fff;color:#111827;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);';
    close.addEventListener('click', closeOptions);

    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeOptions(); });
    overlay.appendChild(frame);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeyDown);
  }

  window.__aiCmOpenOptions = openOptions;
  window.__aiCmCloseOptions = closeOptions;

  function isSettingsShortcut(ev) {
    return !!(ev && ev.ctrlKey && ev.altKey && !ev.shiftKey &&
      (ev.code === 'Comma' || ev.key === ','));
  }

  function isWidgetShortcut(ev) {
    return !!(ev && ev.ctrlKey && ev.altKey && !ev.shiftKey &&
      (ev.code === 'KeyH' || ev.key === 'h' || ev.key === 'H' || ev.key === 'р' || ev.key === 'Р'));
  }

  function toggleWidget() {
    try {
      chrome.storage.sync.get(['showWidget'], function (res) {
        // Скрыт -> показать, видим -> скрыть.
        var next = !!(res && res.showWidget === false);
        chrome.storage.sync.set({ showWidget: next });
      });
    } catch (e) {}
  }

  function bindFrame(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc) return;

      // Подсказка на случай, если индикатор скрыли и не знают, как вернуть.
      var cb = doc.getElementById('show-widget');
      var row = cb && cb.closest ? cb.closest('.checkbox-row') : null;
      if (row && !doc.getElementById('ai-cm-pake-hint')) {
        var hint = doc.createElement('div');
        hint.id = 'ai-cm-pake-hint';
        hint.className = 'hint';
        hint.style.marginTop = '6px';
        hint.textContent = 'Если индикатор скрыт: Ctrl+Alt+H — показать, Ctrl+Alt+, — настройки.';
        row.insertAdjacentElement('afterend', hint);
      }

      // Esc и горячие клавиши внутри iframe не всплывают в родительское окно.
      if (!frame.__aiCmKeysBound) {
        frame.__aiCmKeysBound = true;
        doc.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') {
            ev.preventDefault();
            closeOptions();
          } else if (isSettingsShortcut(ev)) {
            ev.preventDefault();
            closeOptions();
          } else if (isWidgetShortcut(ev)) {
            ev.preventDefault();
            toggleWidget();
          }
        }, true);
      }
    } catch (e) {}
  }

  document.addEventListener('keydown', function (ev) {
    if (isSettingsShortcut(ev)) {
      ev.preventDefault();
      if (overlay) closeOptions(); else openOptions();
    } else if (isWidgetShortcut(ev)) {
      ev.preventDefault();
      toggleWidget();
    }
  }, true);

  function addSettingsButton() {
    var panel = document.getElementById('ai-widget-panel');
    if (!panel || panel.querySelector('.ai-cm-settings-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-cm-btn ai-cm-settings-btn';
    btn.textContent = '⚙ Настройки расширения';
    btn.style.cssText = 'margin-top:8px;width:100%;';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openOptions();
    });
    panel.appendChild(btn);
  }

  function start() { setInterval(addSettingsButton, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
`);

fs.writeFileSync(outFile, bundle, 'utf8');

// 5. Статическая проверка порядка: все зависимости должны быть объявлены ДО ядра.
const positions = {};
for (const name of ['Conv', 'Diag', 'Emit', 'Ingest', 'Net', 'Netsync', 'Parse', 'Refetch', 'Sse']) {
  positions[name] = bundle.indexOf('window.AiCmDeepseek' + name + ' = Fn');
}
positions.Intercept = bundle.indexOf('window.__aiCmDeepseekInterceptInstalled = true');
positions.Ui = bundle.indexOf('/* ===== UI bootstrap');

const required = ['Conv', 'Diag', 'Emit', 'Ingest', 'Net', 'Netsync', 'Parse', 'Refetch', 'Sse'];
const errors = [];
for (const name of required) {
  if (positions[name] === -1) errors.push('не найден экспорт ' + name);
  else if (positions[name] > positions.Intercept) errors.push(name + ' объявлен ПОСЛЕ intercept');
}
if (positions.Intercept === -1) errors.push('intercept не установлен');
if (positions.Ui === -1 || positions.Ui < positions.Intercept) errors.push('UI должен идти после intercept');

const bytes = Buffer.byteLength(bundle, 'utf8');
console.log('Собрано: ' + outFile);
console.log('Размер: ' + (bytes / 1024 / 1024).toFixed(2) + ' МБ');
console.log('Порядок: ' + ['Conv', 'Diag', 'Emit', 'Ingest', 'Netsync', 'Parse', 'Refetch', 'Sse', 'Net', 'Intercept', 'Ui']
  .map((n) => n + '=' + positions[n]).join(' '));
if (errors.length) {
  console.error('ОШИБКА ПОРЯДКА:\n - ' + errors.join('\n - '));
  process.exit(1);
}
console.log('OK: все зависимости DeepSeek объявлены до core/deepseek-intercept.js');
