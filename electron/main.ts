import { app, BrowserWindow, dialog, shell, session, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { writeFile } from 'fs/promises';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Security: block the renderer from opening new windows. Route any
  // legitimate external links to the OS browser instead of an in-app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Security: prevent in-place navigation away from the app's own origin.
  const appOrigin = isDev ? 'http://localhost:3000' : 'file://';
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appOrigin)) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://')) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIpc() {
  // Render the current page to a text-based PDF (selectable, searchable,
  // tagged) — unlike the renderer's html2canvas fallback which rasterises.
  // The page's @media print rules isolate the invoice and drop app chrome.
  ipcMain.handle('export-pdf', async (_event, opts: { defaultFileName?: string } = {}) => {
    if (!mainWindow) return { success: false, error: 'No active window' };

    // Render the invoice in an isolated, hidden window (dashboard-free) so the
    // capture isn't affected by the app's responsive layout, scroll containers
    // or scale transform. The print view reads the same draft from localStorage.
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });

    try {
      if (isDev) {
        await printWin.loadURL('http://localhost:3000/?print=1');
      } else {
        await printWin.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
          query: { print: '1' },
        });
      }

      // Wait until the invoice has mounted, fonts are ready, and a frame has
      // painted (with a 5s safety cap) before capturing.
      await printWin.webContents.executeJavaScript(`new Promise((resolve) => {
        const start = Date.now();
        const ready = () => ((document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve())
          .then(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const check = () => { (document.querySelector('#invoice-preview') || Date.now() - start > 5000) ? ready() : setTimeout(check, 30); };
        check();
      })`);

      const data = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Invoice PDF',
        defaultPath: opts.defaultFileName || 'invoice.pdf',
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      await writeFile(filePath, data);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      if (!printWin.isDestroyed()) printWin.close();
    }
  });

  // Allowlisted external-link opener (mailto / http(s) only). Needed because
  // the will-navigate guard blocks in-renderer navigation to mailto: links.
  ipcMain.handle('open-external', (_event, url: unknown) => {
    if (typeof url === 'string' && /^(mailto:|https:\/\/|http:\/\/)/i.test(url)) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });
}

function setupCSP() {
  // Vite's dev server injects an inline React-refresh/HMR preamble and relies
  // on eval + a websocket — none of which the strict production policy allows,
  // which would leave the dev window blank. Relax the policy in dev only;
  // the packaged build keeps the locked-down policy.
  const csp = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://localhost:3000 http://localhost:3000"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

function checkForUpdates() {
  // Portable builds can't silently auto-update (no install location to write to).
  // Instead, detect new versions and offer to open the releases page.
  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    if (!mainWindow) return;
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `SmartInvoice v${info.version} is available. You are running v${app.getVersion()}.`,
      detail: 'Would you like to open the download page?',
      buttons: ['Download', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        shell.openExternal('https://github.com/nurulashraf/invoice-generator/releases/latest');
      }
    });
  });

  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  setupCSP();
  setupIpc();
  createWindow();

  if (!isDev) {
    checkForUpdates();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
