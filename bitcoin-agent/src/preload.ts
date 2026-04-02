import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bitcoinAgent', {
  // Auth
  hasPassword: () => ipcRenderer.invoke('auth:hasPassword'),
  verifyPassword: (password: string) =>
    ipcRenderer.invoke('auth:verifyPassword', password),
  setPassword: (password: string) =>
    ipcRenderer.invoke('auth:setPassword', password),
  changePassword: (currentPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:changePassword', currentPassword, newPassword),

  // Agent
  hasApiKey: () => ipcRenderer.invoke('agent:hasApiKey'),
  setApiKey: (key: string) => ipcRenderer.invoke('agent:setApiKey', key),
  sendAgentMessage: (message: string) =>
    ipcRenderer.invoke('agent:sendMessage', message),

  // M1 — Wallet
  importXpub: (xpub: string) =>
    ipcRenderer.invoke('wallet:importXpub', xpub),
  getXpub: () => ipcRenderer.invoke('wallet:getXpub'),
  getBalance: () => ipcRenderer.invoke('wallet:getBalance'),
  getAddresses: (start: number, count: number) =>
    ipcRenderer.invoke('wallet:getAddresses', start, count),

  // M2 — PSBT
  getUtxos: () => ipcRenderer.invoke('wallet:getUtxos'),
  getFees: () => ipcRenderer.invoke('wallet:getFees'),
  buildPsbt: (params: {
    destination: string;
    amountSats: number;
    feeRate: number;
  }) => ipcRenderer.invoke('wallet:buildPsbt', params),
  exportPsbtFile: (psbtBase64: string) =>
    ipcRenderer.invoke('wallet:exportPsbtFile', psbtBase64),
  importSignedPsbt: () => ipcRenderer.invoke('wallet:importSignedPsbt'),
  broadcastTx: (txHex: string) =>
    ipcRenderer.invoke('wallet:broadcastTx', txHex),
});
