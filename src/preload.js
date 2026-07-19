const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bbcodePreview', {
  readSample: () => ipcRenderer.invoke('sample:read'),
  getPaths: () => ipcRenderer.invoke('app:paths'),
  openLogin: () => ipcRenderer.invoke('auth:open-login'),
  authStatus: () => ipcRenderer.invoke('auth:status'),
  loadPost: (postUrl) => ipcRenderer.invoke('post:load', postUrl),
  savePost: (content) => ipcRenderer.invoke('post:save', content),
  loadMediaPost: (postUrl) => ipcRenderer.invoke('media:load-post', postUrl),
  mediaState: () => ipcRenderer.invoke('media:state'),
  uploadMedia: (payload) => ipcRenderer.invoke('media:upload', payload),
  deleteMedia: (payload) => ipcRenderer.invoke('media:delete', payload),
  nameMedia: (payload) => ipcRenderer.invoke('media:name', payload),
  onMediaContent: (callback) => ipcRenderer.on('media:content', (_event, content) => callback(content)),
  saveCooldownState: () => ipcRenderer.invoke('post-save:cooldown-state'),
  onSaveCooldown: (callback) => ipcRenderer.on('post-save:cooldown', (_event, state) => callback(state)),
  onMediaOperationState: (callback) => ipcRenderer.on('media:operation-state', (_event, state) => callback(state))
});
