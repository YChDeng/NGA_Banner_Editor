const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bbcodePreview', {
  readSample: () => ipcRenderer.invoke('sample:read'),
  getPaths: () => ipcRenderer.invoke('app:paths'),
  openLogin: () => ipcRenderer.invoke('auth:open-login'),
  authStatus: () => ipcRenderer.invoke('auth:status'),
  loadPost: (postUrl) => ipcRenderer.invoke('post:load', postUrl),
  savePost: (content) => ipcRenderer.invoke('post:save', content)
});
