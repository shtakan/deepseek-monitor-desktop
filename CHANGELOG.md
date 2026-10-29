# Changelog

Все заметные изменения проекта. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/lang/ru/).

## [1.1.1] - 2026-10-29

Обновление поставки встроенного расширения **AI Context Monitor** (2.0.32 → 2.0.33).
Логика приложения не менялась: правки — метаданные, встроенное расширение и документация.

### Изменено

- Встроенное расширение **AI Context Monitor**: 2.0.32 → 2.0.33.
- Пагинация в Qwen: новые модули `core/qwen-pagination.js` и `core/qwen-files.js` —
  постраничная подгрузка истории диалога вместо обрыва на первом экране.
- Экспорт вложений Qwen: файлы из чата попадают в выгрузку md/json/txt/pdf.

## [1.1.0] - 2026-10-28

Обновление поставки встроенного расширения **AI Context Monitor** (2.0.28 → 2.0.32).
Логика приложения не менялась: правки — метаданные и документация.

### Изменено

- Встроенное расширение **AI Context Monitor**: 2.0.28 → 2.0.32.
- Перехват Google AI Studio: новый MAIN-world модуль `core/aistudio-intercept.js` и адаптер
  `adapters/aistudio-adapter.js` — бейдж и статистика контекста работают и на AI Studio.
- Определение модели в старых чатах: `core/content.js` и `core/deepseek-intercept.js`
  определяют модель и в чатах без `conversation_mode`.
- Экспорт диалога: доработки `options/options.js` и `print/print.js` — выгрузка в
  md/json/txt/pdf с учётом reasoning и вложений.

## [1.0.0] - 2026-10-26

Первый публичный релиз **DeepSeek-Monitor** — десктопное приложение на Pake (Rust + Tauri +
WebView2) для `chat.deepseek.com` со встроенным расширением **AI Context Monitor** (2.0.28).

### Добавлено

- Оболочка Pake для `chat.deepseek.com` и MSI-установщик `DeepSeek-Monitor.msi`
  с кастомной иконкой приложения (`--icon icons/app.png`).
- Инжектируемый бандл `ai-context-monitor/pake-bundle.deepseek.js`, собираемый
  `build-pake-bundle.js`: утилиты расширения, MAIN-world модули DeepSeek и UI в одном файле.
- Полифил `ai-context-monitor/polyfill.js` — эмуляция `chrome.*` (runtime, storage, tabs,
  action) поверх WebView2 и `localStorage`, включая внутреннюю шину сообщений.
- Бейдж загрузки контекста на странице: процент, модель, токены и лимит окна.
- Встроенная страница настроек (`srcdoc`-iframe с инлайн-версией `options.html`,
  `options.css`, `options.js` и `polyfill.js`) вместо попапа расширения Chrome.
- Горячие клавиши: `Ctrl+Alt+,` — открыть/закрыть настройки, `Ctrl+Alt+H` — показать/скрыть
  индикатор.
- Автосворачивание блоков рассуждений «Думал N секунд» нативным кликом по заголовку.
- Исправлено определение модели для старых чатов DeepSeek (без `conversation_mode`)
  в `ai-context-monitor/core/deepseek-intercept.js`.
- Проверка сборщиком списка `MAIN_WORLD_FILES`: пропуск любого `core/deepseek-*.js`
  теперь приводит к ошибке сборки.
- Документация: `README.md` (установка, настройки, пересборка, обновление расширения),
  `PROJECT_HANDOFF.md`, `LICENSE` (MIT), `.gitignore`.

### Известные ограничения

- Экспорт reasoning при выключенной опции экспорта не попадает в файл — штатное поведение
  расширения; при сворачивании DeepSeek убирает текст рассуждения из DOM, поэтому
  DOM-фолбэк без перехвата сети может его не увидеть.
- `polyfill.js` нет в `dist` расширения-источника: при обновлении версии его нужно
  синхронизировать вручную.
