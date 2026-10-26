# Changelog

Все заметные изменения проекта. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версионирование — [Semantic Versioning](https://semver.org/lang/ru/).

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
