# PROJECT_HANDOFF — DeepSeek-Monitor

Базовая версия документа для продолжения работы в будущих сессиях.
Дата фиксации: 2026-10-26 · Версия: 1.0.0 · **Статус: готово**.

## 1. Что это

Десктопное приложение для веб-версии `chat.deepseek.com`, собранное сборщиком **Pake**.
Внутрь страницы инжектится расширение **AI Context Monitor**
([shtakan/ai-context-monitor](https://github.com/shtakan/ai-context-monitor), Chrome MV3):
бейдж показывает загрузку контекста, модель, токены и лимит окна, а настройки расширения
открываются поверх страницы вместо попапа Chrome.

## 2. Стек

| Слой | Технология |
|---|---|
| Оболочка приложения | Pake 3.x — **Rust + Tauri**, WebView2 (Windows) |
| Рантайм страницы | WebView2 / Chromium, `chat.deepseek.com` |
| Расширение внутри страницы | JS (Chrome MV3 `dist`), один инжектируемый бандл |
| Сборка бандла | Node.js, `build-pake-bundle.js` (без внешних зависимостей) |
| Установщик | MSI (генерирует Pake), иконка `icons/app.png` |

`package.json` (Electron 45, `main.js`) — ранний прототип загрузки расширения через
Electron. В актуальной сборке не используется, оставлен как исторический артефакт.

## 3. Архитектура репозитория

```
ai-desktop-app/
├─ build-pake-bundle.js              # сборщик бандла + инлайн страницы настроек
├─ ai-context-monitor/               # КОПИЯ dist оригинального расширения (см. §4)
│  ├─ manifest.json                  # версия 2.0.28 — источник истины по версии
│  ├─ core/deepseek-*.js             # MAIN-world модули (перехват сети, модель)
│  ├─ polyfill.js                    # шим chrome.* для WebView2 (см. §5)
│  ├─ pake-bundle.deepseek.js        # СГЕНЕРИРОВАННЫЙ бандл — не править руками
│  ├─ pake-bundle.js                 # устаревший all-provider бандл
│  └─ options/, content.js, options.js, …
├─ icons/app.png                     # иконка приложения для --icon
├─ DeepSeek-Monitor.msi              # готовый установщик (в .gitignore)
├─ README.md, CHANGELOG.md, LICENSE, PROJECT_HANDOFF.md
└─ PROMPT.md, REPORT-ai-context-monitor.md   # история разработки и отчёт по правкам
```

### `ai-context-monitor/` — копия `dist`

Каталог **не является источником кода**. Это результат `node build.mjs` из репозитория
`ai-context-monitor-clean` (`dist`), скопированный целиком. Ручные правки здесь теряются
при следующем обновлении из источника — исключение составляют `polyfill.js` и
`pake-bundle.deepseek.js` (генерируются/поддерживаются в этом репозитории).

### `polyfill.js` — шим `chrome.*`

Эмулирует браузерные API расширения поверх WebView2 и `localStorage`:

- `chrome.runtime` — `getManifest()`, `getURL()`, `id`, `onMessage`/`sendMessage`;
- `chrome.storage.local` / `.sync` / `.session` — обёртка над `localStorage`
  (session очищается при закрытии приложения, как `chrome.storage.session`);
- `chrome.tabs` / `chrome.action` — заглушки + внутренняя шина сообщений,
  заменяющая IPC между `background` и `content` внутри монолитного файла;
- мост настроек: страница настроек открывается как `srcdoc`-iframe.

Файла `polyfill.js` нет в `dist` расширения-источника, поэтому при обновлении версии
копирование его не обновляет — версию в `chrome.runtime.getManifest()` правят вручную.

### `build-pake-bundle.js` — сборщик

Склеивает модули расширения в один инжектируемый файл в строгом порядке зависимостей
(`MAIN_WORLD_FILES`, до `core/deepseek-intercept.js`), инлайнит страницу настроек
(`options.html` + `options.css` + `options.js` + `polyfill.js`) и UI кнопки в панели бейджа.
Падает с ошибкой, если какой-либо `core/deepseek-*.js` не включён в `MAIN_WORLD_FILES`
(именно пропуск `core/deepseek-files.js` однажды лишил экспорт текстов вложений).

## 4. Сборка

```powershell
# 1. бандл расширения
node .\build-pake-bundle.js
node --check .\ai-context-monitor\pake-bundle.deepseek.js

# 2. приложение + MSI
pake https://chat.deepseek.com --name "DeepSeek-Monitor" `
  --identifier com.deepseek.monitor --icon .\icons\app.png `
  --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Результат — `DeepSeek-Monitor.msi` в корне. Перед проверкой новой сборки **удалить старую
версию приложения**: работающий процесс держит прежний бандл.

Обновление расширения из источника: собрать `dist` в `ai-context-monitor-clean`,
скопировать всё содержимое `dist` в `ai-context-monitor/` с заменой, синхронизировать
версию в `polyfill.js` и `manifest.json`, проверить `MAIN_WORLD_FILES`, пересобрать бандл.
Подробный цикл — в `README.md`, раздел «Обновление расширения».

## 5. Статус

**Готово (1.0.0).** Проверено:

- приложение запускается, `chat.deepseek.com` открывается, бейдж отрисован в DOM;
- бейдж на тестовом чате: **57.1%**, модель **DeepSeek V4.1 Flash**, токены **570 929**,
  окно **1 000 000** (570 929 / 1 000 000 = 57.1%);
- страница настроек открывается поверх страницы, изменения применяются без перезапуска
  (снятие «Показывать индикатор» скрывает бейдж, возврат — показывает);
- горячие клавиши `Ctrl+Alt+,` (настройки) и `Ctrl+Alt+H` (индикатор) работают,
  в том числе при скрытом индикаторе;
- настройки в `localStorage` профиля WebView2 переживают перезапуск
  (проверено на `showWidget=false`);
- блоки «Думал N секунд» свёрнуты по умолчанию, автосворот не трогает раскрытые вручную;
- MSI собран с кастомной иконкой.

Не входит в 1.0.0 / открытые задачи:

- публикация репозитория на GitHub (шаг владельца, `git push` не выполняется);
- сборка под macOS/Linux (схема Pake та же, но MSI-путь только для Windows);
- замена/удаление Electron-прототипа (`main.js`, `package.json`) либо его документирование
  как отдельного legacy-режима.

## 6. Правила для будущих сессий

1. Не править `ai-context-monitor/` вручную, кроме `polyfill.js` и сгенерированного бандла.
2. Не трогать `pake-bundle.deepseek.js` напрямую — генерировать `build-pake-bundle.js`.
3. Держать версии `manifest.json`, `polyfill.js` и `package.json` источника согласованными.
4. После изменения бандла — `node --check`, пересборка MSI и переустановка приложения.
5. Файлы: UTF-8, LF. В git не попадают `node_modules/`, `*.msi`, `*.exe`, `dist/`, `.env`,
   `~AI~/`, `*.log`.
