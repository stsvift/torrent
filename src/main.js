const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = import('webtorrent').then(({ default: WebTorrent }) => new WebTorrent());
  }
  return clientPromise;
}
const torrents = new Map();
let mainWindow;
let downloadPath = app.getPath('downloads');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 650,
    title: 'EmberTorrent',
    backgroundColor: '#090909',
    titleBarStyle: process.platform === 'win32' ? 'hidden' : 'default',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#090909',
      symbolColor: '#f97316',
      height: 38
    } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function serializeTorrent(torrent) {
  const downloaded = torrent.downloaded || 0;
  const length = torrent.length || 0;
  const progress = length > 0 ? torrent.progress : 0;

  return {
    id: torrent.infoHash,
    name: torrent.name || 'Loading metadata...',
    magnetURI: torrent.magnetURI,
    path: torrent.path,
    progress,
    downloaded,
    length,
    downloadSpeed: torrent.downloadSpeed || 0,
    uploadSpeed: torrent.uploadSpeed || 0,
    ratio: torrent.ratio || 0,
    numPeers: torrent.numPeers || 0,
    timeRemaining: torrent.timeRemaining || 0,
    paused: torrent.paused,
    done: torrent.done,
    files: torrent.files.map((file) => ({
      name: file.name,
      path: file.path,
      length: file.length,
      progress: file.progress
    }))
  };
}

function broadcastState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('torrents:update', Array.from(torrents.values()).map(serializeTorrent));
}

function registerTorrent(torrent) {
  torrents.set(torrent.infoHash, torrent);
  torrent.on('metadata', broadcastState);
  torrent.on('download', broadcastState);
  torrent.on('upload', broadcastState);
  torrent.on('done', broadcastState);
  torrent.on('warning', (warning) => {
    mainWindow?.webContents.send('toast', { type: 'warning', message: warning.message });
  });
  torrent.on('error', (error) => {
    mainWindow?.webContents.send('toast', { type: 'error', message: error.message });
  });
  broadcastState();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (clientPromise) clientPromise.then((client) => client.destroy());
});

ipcMain.handle('torrent:add', async (_event, input) => {
  const source = String(input || '').trim();
  if (!source) throw new Error('Paste a magnet link, info hash, or torrent URL.');

  const client = await getClient();
  const existing = client.get(source);
  if (existing) return serializeTorrent(existing);

  const torrent = client.add(source, { path: downloadPath });
  registerTorrent(torrent);
  return serializeTorrent(torrent);
});

ipcMain.handle('torrent:addFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open torrent file',
    filters: [{ name: 'Torrent files', extensions: ['torrent'] }],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const client = await getClient();
  const torrent = client.add(result.filePaths[0], { path: downloadPath });
  registerTorrent(torrent);
  return serializeTorrent(torrent);
});

ipcMain.handle('torrent:remove', async (_event, id, destroyStore = false) => {
  const torrent = torrents.get(id);
  if (!torrent) return;
  await new Promise((resolve) => torrent.destroy({ destroyStore: Boolean(destroyStore) }, resolve));
  torrents.delete(id);
  broadcastState();
});

ipcMain.handle('torrent:clearCompleted', async () => {
  const completed = Array.from(torrents.values()).filter((torrent) => torrent.done);
  await Promise.all(completed.map((torrent) => new Promise((resolve) => {
    torrent.destroy({ destroyStore: false }, resolve);
    torrents.delete(torrent.infoHash);
  })));
  broadcastState();
  return completed.length;
});

ipcMain.handle('torrent:togglePause', async (_event, id) => {
  const torrent = torrents.get(id);
  if (!torrent) return null;
  if (torrent.paused) torrent.resume();
  else torrent.pause();
  broadcastState();
  return serializeTorrent(torrent);
});

ipcMain.handle('torrent:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose download folder',
    defaultPath: downloadPath,
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths[0]) downloadPath = result.filePaths[0];
  return downloadPath;
});

ipcMain.handle('torrent:getState', async () => ({
  downloadPath,
  torrents: Array.from(torrents.values()).map(serializeTorrent)
}));

ipcMain.handle('torrent:reveal', async (_event, id) => {
  const torrent = torrents.get(id);
  if (!torrent) return 'Torrent not found';
  if (torrent.files[0]?.path) return shell.showItemInFolder(path.join(torrent.path, torrent.files[0].path));
  return shell.openPath(torrent.path || downloadPath);
});

ipcMain.handle('app:openDownloads', async () => shell.openPath(downloadPath));

setInterval(broadcastState, 1000);
