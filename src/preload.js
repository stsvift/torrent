const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emberTorrent', {
  add: (input) => ipcRenderer.invoke('torrent:add', input),
  addFile: () => ipcRenderer.invoke('torrent:addFile'),
  remove: (id) => ipcRenderer.invoke('torrent:remove', id),
  togglePause: (id) => ipcRenderer.invoke('torrent:togglePause', id),
  selectFolder: () => ipcRenderer.invoke('torrent:selectFolder'),
  getState: () => ipcRenderer.invoke('torrent:getState'),
  openDownloads: () => ipcRenderer.invoke('app:openDownloads'),
  onTorrents: (callback) => ipcRenderer.on('torrents:update', (_event, torrents) => callback(torrents)),
  onToast: (callback) => ipcRenderer.on('toast', (_event, toast) => callback(toast))
});
