[English](README.md) | [Русский](README.ru.md)

# DeepSeek-Monitor

**DeepSeek-Monitor** — десктопное приложение на [Pake](https://github.com/tw93/Pake)
(Rust + Tauri + WebView2) для веб-версии `chat.deepseek.com` со встроенным расширением
**AI Context Monitor**: бейдж показывает загрузку контекста, модель и лимит, а настройки
открываются прямо на странице — аналог клика по иконке расширения в Chrome.

- **Репозиторий расширения:** [shtakan/ai-context-monitor](https://github.com/shtakan/ai-context-monitor)
- **Стек:** Pake 3.x (Rust, Tauri, WebView2), Node.js — только для сборки инжектируемого бандла
- **Платформа:** Windows (MSI-установщик, WebView2 Runtime)
- **Текущая версия:** 1.0.0 — см. [CHANGELOG.md](CHANGELOG.md)

## Установка

1. Скачайте последнюю версию DeepSeek-Monitor.msi со [страницы релизов](https://github.com/shtakan/deepseek-monitor-desktop/releases).
2. Откройте установленный **DeepSeek-Monitor**.
3. Войдите в DeepSeek и откройте любой чат.

## Настройки расширения

1. Нажмите на круглый бейдж внизу справа.
2. В открывшейся панели нажмите **⚙ Настройки расширения**.
3. Появится страница настроек (как попап расширения в Chrome):
   - статистика по текущему чату (сайт, модель, токены, лимит, заполнение, источник);
   - модель: «Автоопределение» или принудительный выбор;
   - лимит контекста: «Авто» или % от авто-порога;
   - переключатель «Показывать индикатор»;
   - прочие параметры расширения.

Закрыть: кнопка **✕**, клавиша **Esc** или клик по затемнённому фону.

Изменения применяются сразу, без перезапуска: например, снятие галочки
«Показывать индикатор» скрывает бейдж, а возврат галочки — показывает.

## Горячие клавиши

- **Ctrl+Alt+,** — открыть/закрыть настройки. Работает, даже если индикатор скрыт.
- **Ctrl+Alt+H** — показать/скрыть индикатор на странице.

Подсказка про эти сочетания добавлена прямо на страницу настроек, под чекбоксом
«Показывать индикатор на странице».

## Свёрнутые цепочки рассуждений

Блоки «Думал N секунд» по умолчанию **свёрнуты** — и при открытии чата, и у новых
ответов. Сворачивание делается нативным кликом по заголовку DeepSeek, поэтому
поведение и анимация штатные.

- Клик по заголовку — раскрыть.
- Повторный клик — свернуть.
- Если пользователь раскрыл блок вручную, фоновый автосворот его больше не трогает.

Про экспорт: если в настройках включена опция «Включать reasoning и инъекции соседних
расширений в экспорт», reasoning попадает в файл из сетевого перехвата — даже когда
блоки свёрнуты. Если опция выключена, reasoning намеренно не попадает в экспорт; это
штатная настройка расширения, а не следствие свёртывания.

Ограничение: при сворачивании DeepSeek убирает текст рассуждения из DOM. Поэтому
DOM-фолбэк без сети может не увидеть reasoning; основной сетевой путь его сохраняет.

## Что сохраняется

Настройки хранятся в профиле WebView2 (localStorage) и переживают перезапуск приложения.
Проверено: `showWidget=false` остаётся после закрытия и повторного запуска.

API-ключ (BYOK) хранится в `sessionStorage` и очищается при закрытии приложения —
это ближе к поведению `chrome.storage.session` в Chrome.

## Ограничения встроенной панели

- Страница настроек — это `srcdoc`-iframe с инлайн-версией `options.html` + `options.css` +
  `options.js` + `polyfill.js`. Внешние ссылки «Политика» и «Помощь» открываются
  как внешние (в браузере по умолчанию).
- Экспорт и диагностика используют `chrome.tabs.sendMessage`; в Pake они работают через
  polyfill и обработчик `chrome.runtime.onMessage` в `content.js`.

## Обновление расширения из `ai-context-monitor-clean`

`ai-context-monitor/` — не место для ручных правок: это копия собранного `dist` из
репозитория-источника. Полный цикл обновления:

1. Собрать расширение в источнике:

   ```powershell
   cd <path_to_source_repo>
   node build.mjs
   ```

2. Скопировать **всё** содержимое `dist` в `ai-context-monitor` (с заменой):

   ```powershell
   $src = '<path_to_source_repo>\dist'
   $dst = '<path_to_desktop_app>\ai-context-monitor'
   Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
   ```

3. Перейдите в папку приложения и проверьте версию, затем синхронизируйте `polyfill.js`:

   ```powershell
   cd <path_to_desktop_app>
   (Get-Content .\ai-context-monitor\manifest.json -Raw | ConvertFrom-Json).version
   Select-String -Path .\ai-context-monitor\polyfill.js -Pattern "version: '"
   ```

   Версия в `manifest.json` должна совпадать с `package.json` источника, а версия в
   `chrome.runtime.getManifest()` внутри `polyfill.js` — с `manifest.json`. Файла
   `polyfill.js` в `dist` нет, поэтому копирование его не обновляет: правьте вручную.

4. Проверить список MAIN-world модулей. Если в `dist` появился новый
   `core/deepseek-*.js`, он должен быть добавлен в `MAIN_WORLD_FILES` в
   `build-pake-bundle.js` до `core/deepseek-intercept.js`. Сборщик теперь падает с
   ошибкой, если какой-то `core/deepseek-*.js` не включён в список. Именно пропуск
   `core/deepseek-files.js` однажды лишил экспорт текстов вложений.

5. Собрать и проверить бандл:

   ```powershell
   cd <path_to_desktop_app>
   node .\build-pake-bundle.js
   node --check .\ai-context-monitor\pake-bundle.deepseek.js
   ```

6. Собрать MSI (см. «Пересборка» и «Сборка MSI со своей иконкой»), затем **удалить
   старую версию приложения**, установить новый MSI и запустить заново. Старый процесс
   может держать прежний бандл.

Быстрая проверка после запуска (CDP/DevTools): `chrome.runtime.getManifest().version`
совпадает с `manifest.json`, в экспорте присутствуют вложения с текстом.

## Пересборка

Из папки проекта:

```powershell
node .\build-pake-bundle.js

pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Готовый установщик: `DeepSeek-Monitor.msi` в корне проекта.

## Сборка MSI со своей иконкой

Иконка задаётся флагом `--icon`. На Windows Pake сам конвертирует PNG/JPG/WebP/SVG
в многоразмерный `.ico` (кадры 16–256 px), поэтому вручную конвертировать не нужно.

### 1. Положите иконку в папку `icons`

```
<path_to_desktop_app>\icons\app.png
```

Требования к PNG:

- квадрат, лучше **1024×1024** (минимум 256×256);
- прозрачный фон;
- без скруглений и теней по краям — их добавляет Windows/установщик.

Можно положить и готовый `.ico` — он будет использован как есть (желательно
с кадром 256×256 внутри).

### 2. Соберите бандл расширения

Если меняли `ai-context-monitor`:

```powershell
cd <path_to_desktop_app>
node .\build-pake-bundle.js
```

### 3. Соберите MSI с иконкой

Одной строкой:

```powershell
pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Или с переносами (в PowerShell обратная кавычка должна быть **последним**
символом строки, без пробелов после неё):

```powershell
pake https://chat.deepseek.com `
  --name "DeepSeek-Monitor" `
  --identifier com.deepseek.monitor `
  --icon .\icons\app.png `
  --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

### 4. Результат

`DeepSeek-Monitor.msi` в корне проекта. Иконка попадёт в exe, ярлык, окно
приложения и установщик.

### Если иконка не применилась

- Проверьте, что файл существует. При неверном пути Pake пишет
  `Custom icon path may be invalid` и собирает с иконкой по умолчанию.
- Относительный путь считается от текущей папки, поэтому запускайте команду
  из корня проекта. Можно указать абсолютный путь:
  `--icon "<path_to_desktop_app>\icons\app.png"`.
- Если после переустановки видна старая иконка — Windows кэширует её по
  `identifier`. Удалите старую версию, при необходимости смените
  `--app-version` или `--identifier` и пересоберите.
- Файл `.msi` в Проводнике может показывать стандартную иконку установщика —
  это нормально. Кастомная иконка будет у установленного приложения и ярлыка.

### Иконка в системном трее (опционально)

```powershell
pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --show-system-tray --system-tray-icon .\icons\tray.ico --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Для трея подходят `.ico` и `.png`. Если `--system-tray-icon` не указан,
используется иконка приложения.

### Другие провайдеры

Схема та же: для каждого сайта свой `--name`, `--identifier`, `--icon` и свой
собранный бандл `--inject` (например, `pake-bundle.chatgpt.js`). Иконки можно
держать в той же папке: `icons\chatgpt.png`, `icons\gemini.png` и т.д.

Для отладки можно добавить `--debug` и запустить exe с CDP:

```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9222 --remote-allow-origins=*'
```

## Файлы

- `build-pake-bundle.js` — сборка бандла, инлайн страницы настроек и кнопки в панели бейджа.
- `ai-context-monitor/pake-bundle.deepseek.js` — готовый инжектируемый бандл.
- `ai-context-monitor/polyfill.js` — шим `chrome.*` для WebView2 (storage, tabs, session).
- `ai-context-monitor/options/options.html`, `options.css` — страница настроек.
- `ai-context-monitor/options.js` — логика настроек (минифицирована).
- `icons\` — сюда кладётся иконка приложения для `--icon` (например, `icons\app.png`).
