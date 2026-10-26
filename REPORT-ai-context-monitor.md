# Отчёт: изменения в `ai-context-monitor` для Pake-сборки DeepSeek

Дата: 23.10.2026  
Папка: `C:\Users\oleg\Desktop\~AI~\ai-desktop-app\ai-context-monitor`  
Контекст: упаковка `chat.deepseek.com` в Pake 3.17.6 (WebView2), встраивание настроек расширения в страницу.

---

## 1. Кратко

Изменены два исходных файла и сгенерирован один бандл:

| Файл | Статус | Причина |
|---|---|---|
| `core/deepseek-intercept.js` | изменён | Исправлено определение модели для старых чатов DeepSeek (без `conversation_mode`) |
| `polyfill.js` | расширен | Эмуляция `chrome.*` для WebView2: storage, tabs, session, мост настроек |
| `pake-bundle.deepseek.js` | сгенерирован | Единый инъектируемый бандл для Pake (порядок зависимостей + UI + настройки) |
| `pake-bundle.js` | устарел | Старый all-provider бандл (1.7 МБ), не содержит фиксов и панели настроек |

Остальные файлы расширения (`content.js`, `options.js`, `options/options.html`,
`options/options.css`, `background.js`, `manifest.json`, `core/*` кроме intercept)
**не менялись**.

Связанные изменения вне папки: `..\build-pake-bundle.js`, `..\PAKE-README.md`,
пересобранный `..\DeepSeek-Monitor.msi`.

---

## 2. `core/deepseek-intercept.js`

### Что изменено

Резолвер модели `__aiCmDeepseekResolveModelSlug`:

```diff
  var isDefaultType = modelType === 'default';
  var isDefaultConv = convMode === 'DEFAULT';
+ // Контракт 2026-10-22: у чатов, созданных до unified Intelligent Mode, поля
+ // conversation_mode в chat_session НЕТ вовсе, но model_type:"default" — это тот же
+ // V4.1 Flash. Раньше отсутствие conversation_mode уводило в фолбэк thinking_enabled
+ // → 'deepseek-r1' и занижало окно до 128K.
+ var isUnifiedDefault = isDefaultType && (isDefaultConv || convMode === '');
- if ((isDefaultType && isDefaultConv) || emptyModelNewContract || ...
+ if (isUnifiedDefault || emptyModelNewContract || ...
```

Добавлен только один смысловой вариант: `model_type === "default"` при **отсутствующем**
`conversation_mode` (`convMode === ''`). Явный непустой `model` по-прежнему имеет приоритет.

### Причина

У старых чатов DeepSeek в ответе `chat_session` есть `model_type: "default"`, но поля
`conversation_mode` нет вообще. Старое условие требовало одновременно `default` + `DEFAULT`,
поэтому резолвер возвращал `''`, срабатывал старый фолбэк по `thinking_enabled` →
`deepseek-r1`, лимит 128K вместо 1M, модель и процент в бейдже были неверными.

Проверочный чат: `1fa718ad-7cb2-4edd-8a0b-b56277220de3`
(`model_type="default"`, `conversation_mode` отсутствует, `accumulated_token_usage=570929`).

### Результат

- Модель: `DeepSeek V4.1 Flash`
- Окно: `1 000 000`
- Процент: `570 929 / 1 000 000 = 57.1%`

### Влияние

Файл используется и Chrome-расширением (MAIN world), и Pake-бандлом. Фикс общий, не
Pake-специфичный.

### Риск

Правило завязано на текущий контракт DeepSeek (2026-10-22). Если появится ещё один
`model_type:"default"` без `conversation_mode`, но с другим окном — понадобится новый
дискриминатор. Явный `model` из сети и ветка `is_default/configName` остаются приоритетными.

---

## 3. `polyfill.js`

Файл эмулирует `chrome.*` в page world, потому что Pake/WebView2 не предоставляет
extension API и service worker. Он встраивается в бандл **и отдельно** в iframe настроек.

### 3.1. Storage

**Убрано:**

```diff
- ai_cm_safe_pct_deepseek: 85
```

Причина: Chrome-расширение по умолчанию не задаёт порог (`Авто` = 100% окна). Значение 85
завышало процент и раньше включало жёлтый/красный. Теперь по умолчанию бейдж считает
`tokens / limit`.

**Добавлено в `storage.local`:**

- `remove(keys, cb)` — используется страницей настроек.
- `getKeys(cb)` — используется архивом/диагностикой.
- `readStored()` — единое чтение с JSON-парсингом.
- `notifyStorage()` — рассылка `onChanged`.

**`storage.session` больше не алиас `local`:**

```diff
- window.chrome.storage.session = window.chrome.storage.local;
+ // отдельное хранилище на sessionStorage, префикс ai_cm_sess_
```

Причина: `options.js` хранит в session BYOK-ключ. При старом алиасе ключ попадал в
`localStorage` и оставался навсегда. Теперь он живёт до закрытия приложения.

`storage.sync` по-прежнему указывает на `local`: в Pake нет облачной синхронизации.

### 3.2. Мост storage между iframe настроек и страницей

Добавлен флаг `window.__AI_CM_OPTIONS_FRAME__` (выставляется в HTML iframe до polyfill) и:

- запись из iframe → `parent.postMessage({__aiCmStorage:1, changes, area})`;
- родительское окно ловит сообщение и вызывает свои `chrome.storage.onChanged`-листенеры;
- `content.js` применяет `showWidget`, `selectedModel`, `customLimit` сразу, без перезагрузки.

Причина: у каждого окна свой набор листенеров; без моста настройки из iframe не доходили
до UI в родительском окне.

### 3.3. Tabs

```diff
- query → [{id:1}]
+ query → [{id:1, url: location.href, title: document.title}]
```

Для iframe настроек URL/заголовок берутся у родителя (`parent.location.href`), потому что
сам iframe имеет `about:srcdoc`.

Причина: `options.js` определяет сайт по URL активной вкладки и читает
`aiCmState:<host>`. Без URL статистика показывала `—`.

Также добавлен `chrome.tabs.create` (открывает ссылки «Политика»/«Помощь» через
`window.open`); `sendMessage` проксирует в `runtime.sendMessage`.

### 3.4. Runtime

Без изменений по смыслу: `onMessage` + `sendMessage` с таймаутом 10 мс, `getManifest`,
`getURL`, `lastError`, заглушки `onInstalled`/`onStartup`.

### 3.5. Известные отклонения от Chrome (важно для кодера)

- **Нет изоляции**: `content.js` и polyfill работают в page world, поэтому `localStorage`
  с историей/настройками доступен скриптам самого сайта. В Chrome это isolated world.
  BYOK-ключ в `sessionStorage` тоже читается скриптами страницы (в Chrome
  `chrome.storage.session` контент-скриптам недоступен).
- `chrome.i18n` не реализован. `options.js` и `content.js` это переживают (гарды), но
  локализация берётся из разметки, а не из `_locales`.
- `chrome.notifications`, `alarms`, `declarativeNetRequest` и т.п. отсутствуют; текущий
  функционал их не использует.
- `runtime.getManifest()` возвращает версию из `manifest.json` (**2.0.24** на момент
  обновления). Версию в `polyfill.js` нужно синхронизировать вручную после каждого
  обновления расширения.
- `storage.get` для отсутствующего ключа возвращает `true` (историческое поведение).
  Это может включать чекбоксы/флаги, которых пользователь не задавал. При рефакторинге
  лучше вернуть `undefined`, но проверить все места, где ждут boolean.
- `storage.sync` не синхронизируется между устройствами.
- `localStorage` ограничен квотой ~5 МБ; история/архив могут упереться.

---

## 4. `pake-bundle.deepseek.js` (сгенерированный файл)

Не редактировать руками. Собирается из корня:

```powershell
node .\build-pake-bundle.js
```

Размер ~1.11 МБ (1 158 842 байт на диске для версии расширения 2.0.24). Состав:

1. `polyfill.js`
2. `pake-relay.js` (виртуальная секция) — кэширует последний `ai-cm-full-history` и умеет
   повторно отдать его UI. Нужен, если первый снимок пришёл до инициализации `content.js`.
3. MAIN-world модули в порядке из `background.js`:
   `utils/debug.js` → `deepseek-diag` → `deepseek-netsync` → `deepseek-refetch` →
   `deepseek-parse` → `deepseek-conv` → `deepseek-emit` → `deepseek-net` →
   `deepseek-ingest` → `deepseek-files` → `deepseek-sse` → `deepseek-intercept`.
4. UI bootstrap: `content.js` после DOMReady + повторная отдача снимка (0.5/1.5/3 с).
5. `pake-settings`: srcdoc-iframe с инлайн-версией `options/options.html` +
   `options.css` + `options.js` + `polyfill.js`, кнопка «⚙ Настройки расширения» в
   `#ai-widget-panel`.

### Почему порядок критичен

`core/deepseek-intercept.js` в конце IIFE связывает зависимости через
`window.AiCmDeepseek*` и запоминает их навсегда. При алфавитном порядке
`deepseek-intercept.js` оказывался раньше `netsync/parse/sse/refetch/net`, ядро
получало `null`, перехват истории/SSE не работал, виджет падал в DOM-фолбэк.

`build-pake-bundle.js` теперь:

- берёт порядок 1:1 из `background.js`;
- падает, если в `MAIN_WORLD_FILES` пропущен какой-либо `core/deepseek-*.js`;
- проверяет позиции экспортов и падает, если зависимость объявлена после intercept;
- инлайнит настройки;
- экранирует `</script` внутри JS;
- использует replace-функцию (иначе `$&` внутри `options.js` подставлял тег и ломал скрипт).

---

## 5. `pake-bundle.js` — устаревший артефакт

- 1.7 МБ, собран 22.10 в 16:48, **до** фикса резолвера и панели настроек.
- Содержит все провайдеры, но не содержит `pake-settings`/`ai-cm-options-overlay`.
- В `PROMPT.md` инструкции про `pake-bundle.js` были устаревшими — обновлены на
  `pake-bundle.deepseek.js`.

Рекомендация: не использовать для сборки. Либо удалить, либо переименовать в
`pake-bundle.legacy.js`. Текущий Pake-инжект: `ai-context-monitor\pake-bundle.deepseek.js`.

---

## 6. Проверено

Стенд: release-сборка Pake, WebView2 + CDP.

| Проверка | Результат |
|---|---|
| Бейдж на реальном чате | `57.1%` |
| Модель | `DeepSeek V4.1 Flash` |
| Токены / лимит | `570 929` / `1 000 000` |
| Источник | `live (сеть/DOM)` |
| Настройки: статистика | сайт, модель, токены, лимит, процент, источник — заполнены |
| `customLimit=50` | `114.2%`, сброс в Авто → `57.1%` |
| Принудительная `DeepSeek V3` | `446.0%`, возврат в Авто → `57.1%` |
| «Показывать индикатор» | скрывает/показывает виджет без перезагрузки |
| Закрытие настроек | ✕ / Esc / клик по фону |
| Исключения в iframe | нет |
| Сохранение после перезапуска | `showWidget=false` сохранился, виджет остался скрыт |
| `node --check` бандла | OK |

---

## 7. Как пересобрать и проверить

```powershell
cd C:\Users\oleg\Desktop\~AI~\ai-desktop-app

node .\build-pake-bundle.js
node --check .\ai-context-monitor\pake-bundle.deepseek.js

pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

`--icon .\icons\app.png` — свой значок приложения; без него Pake возьмёт иконку по
умолчанию (подробнее в `PAKE-README.md`).

После изменения **любого** из файлов `polyfill.js`, `options.js`, `options/options.html`,
`options/options.css`, `content.js`, `core/*` бандл нужно пересобрать: настройки и
polyfill зашиты в него на момент сборки.

---

## 8. Что стоит сделать кодерам

1. Версия в `polyfill.js` синхронизирована с `manifest.json` (`2.0.24`), но её нужно
   обновлять вручную после каждого обновления расширения.
2. `pake-bundle.js` не используется; актуальный артефакт — `pake-bundle.deepseek.js`,
   `PROMPT.md` обновлён.
3. Оценить безопасность page-world хранения (история, BYOK) и при необходимости
   вынести секреты в Tauri-хранилище/закрытие, а не `sessionStorage`.
4. При правках `options.js` помнить про мост storage: настройки должны идти через
   `chrome.storage.*`, иначе UI не обновится без перезагрузки.
5. После изменений контракта DeepSeek перепроверять резолвер модели на старом и новом чате.
