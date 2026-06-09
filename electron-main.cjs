const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Information Security Lab Station",
    icon: path.join(__dirname, 'public', 'favicon.ico'), // Desktop icon if exists
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true
    }
  });

  // Load the built Vite index.html file
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    console.error("Failed to load compiled index.html:", err);
    // Fallback info if the app wasn't compiled yet
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #0b0a14; color: #ffffff; }
            h1 { color: #f43f5e; font-size: 24px; }
            p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
            code { background: #1e1b4b; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #17ED61; }
          </style>
        </head>
        <body>
          <h1>App Build Required</h1>
          <p>The Electron wrapper started but could not find the compiled React application folder (<code>dist/</code>).</p>
          <p>Please compile the application by running: <br><code>npm run build</code> in your terminal first, then try again!</p>
        </body>
      </html>
    `));
  });

  // Handle link clicks to open in user's default browser instead of the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Prepare app events
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
