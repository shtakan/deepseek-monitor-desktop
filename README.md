[English](README.md) | [Русский](README.ru.md)

# DeepSeek-Monitor

**DeepSeek-Monitor** is a desktop app built with [Pake](https://github.com/tw93/Pake)
(Rust + Tauri + WebView2) for the `chat.deepseek.com` web client, with the
**AI Context Monitor** extension built in: the badge shows context usage, the model and
the limit, and settings open right on the page — the equivalent of clicking the extension
icon in Chrome.

- **Extension repository:** [shtakan/ai-context-monitor](https://github.com/shtakan/ai-context-monitor)
- **Stack:** Pake 3.x (Rust, Tauri, WebView2); Node.js is used only to build the injected bundle
- **Platform:** Windows (MSI installer, WebView2 Runtime)
- **Current version:** 1.1.0 — see [CHANGELOG.md](CHANGELOG.md)
- **Bundled extension:** 2.0.32 — AI Context Monitor, see [manifest.json](ai-context-monitor/manifest.json)

## Installation

1. Download the latest DeepSeek-Monitor.msi from the [Releases page](https://github.com/shtakan/deepseek-monitor-desktop/releases).
2. Open the installed **DeepSeek-Monitor**.
3. Sign in to DeepSeek and open any chat.

## Extension settings

1. Click the round badge in the bottom-right corner.
2. In the panel that opens, click **⚙ Extension settings**.
3. The settings page appears (like the extension popup in Chrome):
   - statistics for the current chat (site, model, tokens, limit, fill level, source);
   - model: "Auto-detect" or a forced selection;
   - context limit: "Auto" or a percentage of the auto threshold;
   - the "Show indicator" toggle;
   - other extension options.

To close: the **✕** button, the **Esc** key, or a click on the dimmed background.

Changes apply immediately, with no restart: clearing the "Show indicator" checkbox hides
the badge, and checking it again brings the badge back.

## Hotkeys

- **Ctrl+Alt+,** — open/close settings. Works even when the indicator is hidden.
- **Ctrl+Alt+H** — show/hide the indicator on the page.

A hint about these shortcuts is shown on the settings page itself, right below the
"Show indicator on the page" checkbox.

## Collapsed reasoning chains

"Thought for N seconds" blocks are **collapsed** by default — both when a chat is opened
and for new responses. Collapsing is done with a native click on the DeepSeek header, so
the behavior and animation are the stock ones.

- Click the header to expand.
- Click again to collapse.
- If the user expanded a block manually, the background auto-collapse leaves it alone.

About export: if the "Include reasoning and neighboring extensions' injections in export"
option is enabled in the settings, reasoning ends up in the file via network interception —
even when the blocks are collapsed. If the option is disabled, reasoning is intentionally
left out of the export; that is a deliberate extension setting, not a consequence of
collapsing.

Limitation: when collapsing, DeepSeek removes the reasoning text from the DOM. The
DOM-only fallback therefore may not see the reasoning without the network; the primary
network path preserves it.

## What is saved

Settings are stored in the WebView2 profile (localStorage) and survive an app restart.
Verified: `showWidget=false` persists after closing and relaunching the app.

The API key (BYOK) is stored in `sessionStorage` and is cleared when the app closes — this
is closer to the behavior of `chrome.storage.session` in Chrome.

## Embedded panel limitations

- The settings page is a `srcdoc` iframe with an inline version of `options.html` +
  `options.css` + `options.js` + `polyfill.js`. The external "Privacy Policy" and "Help"
  links open externally (in the default browser).
- Export and diagnostics use `chrome.tabs.sendMessage`; in Pake they work through the
  polyfill and the `chrome.runtime.onMessage` handler in `content.js`.

## Updating the extension from `ai-context-monitor-clean`

`ai-context-monitor/` is not a place for manual edits: it is a copy of the built `dist`
from the source repository. The full update cycle:

1. Build the extension in the source repo:

   ```powershell
   cd <path_to_source_repo>
   node build.mjs
   ```

2. Copy **everything** from `dist` into `ai-context-monitor` (overwriting):

   ```powershell
   $src = '<path_to_source_repo>\dist'
   $dst = '<path_to_desktop_app>\ai-context-monitor'
   Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
   ```

3. Change to the app folder, check the version, then synchronize `polyfill.js`:

   ```powershell
   cd <path_to_desktop_app>
   (Get-Content .\ai-context-monitor\manifest.json -Raw | ConvertFrom-Json).version
   Select-String -Path .\ai-context-monitor\polyfill.js -Pattern "version: '"
   ```

   The version in `manifest.json` must match the source `package.json`, and the version in
   `chrome.runtime.getManifest()` inside `polyfill.js` must match `manifest.json`.
   `polyfill.js` is not part of `dist`, so copying does not update it: edit it by hand.

4. Check the list of MAIN-world modules. If a new `core/deepseek-*.js` appeared in `dist`,
   it must be added to `MAIN_WORLD_FILES` in `build-pake-bundle.js` before
   `core/deepseek-intercept.js`. The builder now fails with an error if any
   `core/deepseek-*.js` is not on the list. Missing `core/deepseek-files.js` once broke
   attachment-text export.

5. Build and verify the bundle:

   ```powershell
   cd <path_to_desktop_app>
   node .\build-pake-bundle.js
   node --check .\ai-context-monitor\pake-bundle.deepseek.js
   ```

6. Build the MSI (see "Rebuild" and "Building an MSI with a custom icon"), then
   **uninstall the old app version**, install the new MSI and launch it again. An old
   process can keep the previous bundle alive.

Quick post-launch check (CDP/DevTools): `chrome.runtime.getManifest().version` matches
`manifest.json`, and the export contains attachments with their text.

## Rebuild

From the project folder:

```powershell
node .\build-pake-bundle.js

pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Ready installer: `DeepSeek-Monitor.msi` in the project root.

## Building an MSI with a custom icon

The icon is set with the `--icon` flag. On Windows, Pake converts PNG/JPG/WebP/SVG into a
multi-size `.ico` itself (16–256 px frames), so no manual conversion is needed.

### 1. Put the icon into the `icons` folder

```
<path_to_desktop_app>\icons\app.png
```

PNG requirements:

- square, preferably **1024×1024** (256×256 minimum);
- transparent background;
- no rounded corners or edge shadows — Windows/the installer adds them.

You can also drop in a ready-made `.ico` — it will be used as is (preferably with a
256×256 frame inside).

### 2. Build the extension bundle

If you changed `ai-context-monitor`:

```powershell
cd <path_to_desktop_app>
node .\build-pake-bundle.js
```

### 3. Build the MSI with the icon

As a single line:

```powershell
pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Or with line breaks (in PowerShell the backtick must be the **last** character of the line,
with no spaces after it):

```powershell
pake https://chat.deepseek.com `
  --name "DeepSeek-Monitor" `
  --identifier com.deepseek.monitor `
  --icon .\icons\app.png `
  --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

### 4. Result

`DeepSeek-Monitor.msi` in the project root. The icon is applied to the exe, the shortcut,
the app window and the installer.

### If the icon did not apply

- Make sure the file exists. With a wrong path, Pake prints
  `Custom icon path may be invalid` and builds with the default icon.
- A relative path is resolved from the current folder, so run the command from the
  project root. You can also pass an absolute path:
  `--icon "<path_to_desktop_app>\icons\app.png"`.
- If the old icon is still visible after reinstalling, Windows caches it by `identifier`.
  Uninstall the old version, change `--app-version` or `--identifier` if needed, and
  rebuild.
- The `.msi` file in Explorer may show the standard installer icon — that is normal. The
  custom icon will be on the installed app and its shortcut.

### System tray icon (optional)

```powershell
pake https://chat.deepseek.com --name "DeepSeek-Monitor" --identifier com.deepseek.monitor --icon .\icons\app.png --show-system-tray --system-tray-icon .\icons\tray.ico --inject .\ai-context-monitor\pake-bundle.deepseek.js
```

Both `.ico` and `.png` work for the tray. If `--system-tray-icon` is not specified, the app
icon is used.

### Other providers

The pattern is the same: for each site its own `--name`, `--identifier`, `--icon`, and its
own built `--inject` bundle (for example `pake-bundle.chatgpt.js`). Icons can live in the
same folder: `icons\chatgpt.png`, `icons\gemini.png`, and so on.

For debugging, you can add `--debug` and launch the exe with CDP:

```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9222 --remote-allow-origins=*'
```

## Files

- `build-pake-bundle.js` — builds the bundle, inlines the settings page and the buttons in the badge panel.
- `ai-context-monitor/pake-bundle.deepseek.js` — the ready-to-inject bundle.
- `ai-context-monitor/polyfill.js` — the `chrome.*` shim for WebView2 (storage, tabs, session).
- `ai-context-monitor/options/options.html`, `options.css` — the settings page.
- `ai-context-monitor/options.js` — settings logic (minified).
- `icons\` — put the app icon for `--icon` here (e.g. `icons\app.png`).
