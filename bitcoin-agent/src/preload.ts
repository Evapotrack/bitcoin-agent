import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bitcoinAgent', {
  importXpub: (xpub: string) =>
    ipcRenderer.invoke('wallet:importXpub', xpub),
  getXpub: () => ipcRenderer.invoke('wallet:getXpub'),
  getBalance: () => ipcRenderer.invoke('wallet:getBalance'),
  getAddresses: (start: number, count: number) =>
    ipcRenderer.invoke('wallet:getAddresses', start, count),
});
