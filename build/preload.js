const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => 'http://127.0.0.1:5000'
});