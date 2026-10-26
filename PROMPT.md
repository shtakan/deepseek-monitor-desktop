```markdown
# Контекст-перенос проекта: Интеграция AI Context Monitor в Pake (DeepSeek Desktop App)

## 🎯 Цель проекта
Превратить браузерное расширение Chrome MV3 [ai-context-monitor](https://github.com/shtakan/ai-context-monitor) в автономное десктопное приложение для **DeepSeek** с помощью **Pake** (оболочка на базе Rust / Tauri / WebView2).

Приложение должно:
1. Загружать веб-версию `https://chat.deepseek.com`.
2. Внедрять монолитный скрипт `ai-context-monitor\pake-bundle.deepseek.js` со всеми утилитами расширения и полифилом Chrome API.
3. Отображать на странице виджет-бейдж с реальным процентом использования контекста и точной моделью ИИ.

---

## 📌 Текущий статус и успехи
1. **Сборка Pake налажена**:
   Команда для отладочной сборки в PowerShell:
   ```powershell
   pake https://chat.deepseek.com --name "DeepSeek-Monitor" --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js --debug
   ```
2. **Эмулятор Chrome API (`polyfill.js`) реализован**:
   - Реализована эмуляция `chrome.runtime` (с методами `getManifest()`, `getURL()`, `id`).
   - Реализована эмуляция `chrome.storage.local`, `chrome.storage.sync`, `chrome.storage.session` поверх `localStorage` с исправленной функцией `set()`.
   - Реализована **внутренняя шина сообщений (Message Bus)**: `chrome.runtime.sendMessage` и `chrome.tabs.sendMessage` вызывают подписки `chrome.runtime.onMessage.addListener`, заменяя IPC-механизмы браузера внутри монолитного файла.
   - Заглушены необходимые методы `chrome.tabs` и `chrome.action`.
3. **Виджет физически отрисовывается в DOM**:
   - Устранены ошибки `ReferenceError` и `SyntaxError` (объявления `let`/`const` на верхнем уровне сглажены в `var` для избежания конфликтов повторного объявления).
   - Бейдж встраивается в UI DeepSeek после наступления события `DOMContentLoaded`.

---

## ❌ Текущая проблема / Точка останова
**Бейдж появляется на экране, но считает токены некорректно и показывает имя модели по умолчанию (`DeepSeek V3` вместо актуальной).**

### Анализ возможных причин:
1. **Сбой сетевого перехвата (`fetch` / `XHR`)**:
   - Модули `core/deepseek-intercept.js`, `core/deepseek-net.js` и `core/deepseek-sse.js` не получают или не распарсивают ответы API DeepSeek (`accumulated_token_usage`, `thinking_enabled`).
   - В среде Pake WebView2 перехват `window.fetch` может происходить со сдвигом по времени либо стримы SSE обрабатываются не полностью.
2. **Переход в аварийный фолбэк (DOM counting)**:
   - Из-за отсутствия сетевых ответов от перехватчика скрипт переходит на подсчёт токенов по прочитанным символам из DOM (`DeepSeekAdapter.extractMessages()`), что даёт заниженный процент (3.5%).
3. **Логика определения модели**:
   - `core/deepseek-parse.js` без сетевых данных сбрасывает определение модели на дефолтную `deepseek-v3`.

---

## 📁 Актуальная структура файлов репозитория (GitHub release)
```
/
├── polyfill.js                 # Эмулятор Chrome API + Message Bus (наш полифил)
├── background.js               # Service Worker: расчёт токенов, пороги, менеджер состояний
├── content.js                  # Инициализация UI, монтирование виджета в DOM
├── shared-i18n.js              # Локализация
├── core/
│   ├── deepseek-intercept.js   # Перехватчик fetch/XHR для DeepSeek
│   ├── deepseek-net.js         # Сетевой слой и обработка ответов
│   ├── deepseek-sse.js         # Парсер SSE-потока токенов
│   ├── deepseek-parse.js       # Парсер сообщений и моделей
│   ├── deepseek-ingest.js      # Инжест данных
│   ├── deepseek-files.js       # Догрузка текстов вложений (Step D.10)
│   ├── deepseek-conv.js        # Управление тредами чата
│   ├── deepseek-emit.js        # Генерация событий
│   ├── deepseek-refetch.js     # Дозапрос истории
│   ├── deepseek-netsync.js     # Синхронизация сети
│   └── deepseek-diag.js        # Диагностика
└── utils/
    ├── stream-frames.js        # Кадры фреймов
    ├── intercept-common.js     # Общие утилиты перехватчиков
    └── debug.js                # Логирование
```

---

## ⚙️ Скрипт сборки бандла

> Устаревший PowerShell-скрипт удалён: он собирал `pake-bundle.js` в алфавитном
> порядке и не включал панель настроек. Актуальная сборка — `build-pake-bundle.js`.

```powershell
cd C:\Users\oleg\Desktop\~AI~\ai-desktop-app
node .\build-pake-bundle.js
node --check .\ai-context-monitor\pake-bundle.deepseek.js
```

`build-pake-bundle.js` берёт точный порядок MAIN-world модулей из `background.js`,
проверяет, что все `core/deepseek-*.js` включены в список и объявлены до
`core/deepseek-intercept.js`, инлайнит `polyfill.js`, настройки и UI.

Полный цикл обновления расширения из `ai-context-monitor-clean` (сборка `dist`,
копирование, синхронизация `polyfill.js`, MSI) описан в `PAKE-README.md`.

---

## 🎯 Задача для ИИ-агента
1. Исследовать файлы `core/deepseek-intercept.js`, `core/deepseek-net.js` и `core/deepseek-sse.js` внутри локальной папки проекта.
2. Проверить механизм подмены `window.fetch` в среде WebView2 (Pake) и выяснить, почему `accumulated_token_usage` и данные о текущей модели не доходят до `background.js` / `widget.js`.
3. Скоректировать передачу сетевых данных или порядок вызовов в `pake-bundle.deepseek.js`, чтобы восстановить точный расчёт токенов и определение актуальной модели.
```