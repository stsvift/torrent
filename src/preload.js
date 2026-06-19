const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('emberTorrent', {
  add: (input) => ipcRenderer.invoke('torrent:add', input),
  addFile: () => ipcRenderer.invoke('torrent:addFile'),
  remove: (id, destroyStore = false) => ipcRenderer.invoke('torrent:remove', id, destroyStore),
  clearCompleted: () => ipcRenderer.invoke('torrent:clearCompleted'),
  reveal: (id) => ipcRenderer.invoke('torrent:reveal', id),
  togglePause: (id) => ipcRenderer.invoke('torrent:togglePause', id),
  selectFolder: () => ipcRenderer.invoke('torrent:selectFolder'),
  getState: () => ipcRenderer.invoke('torrent:getState'),
  openDownloads: () => ipcRenderer.invoke('app:openDownloads'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  copyText: (text) => clipboard.writeText(String(text || '')),
  onTorrents: (callback) => ipcRenderer.on('torrents:update', (_event, torrents) => callback(torrents)),
  onToast: (callback) => ipcRenderer.on('toast', (_event, toast) => callback(toast))
});
