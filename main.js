const { app, BrowserWindow, session } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const extensionPath = path.join(__dirname, 'ai-context-monitor');
  
  try {
    // Загружаем расширение
    await session.defaultSession.extensions.loadExtension(extensionPath, {
      allowFileAccess: true
    });
    console.log('Расширение ai-context-monitor успешно подключено!');
  } catch (err) {
    console.error('Ошибка при загрузке расширения:', err);
  }

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'DeepSeek Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true // Если индикатор не появится, попробуйте временно поставить false для проверки
    }
  });

  // Включаем встроенные инструменты разработчика Chrome для отладки
  win.webContents.openDevTools();

  // Загружаем DeepSeek
  await win.loadURL('https://chat.deepseek.com');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});