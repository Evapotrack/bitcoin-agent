import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as bitcoin from 'bitcoinjs-lib';
import * as fs from 'fs';
import {
  validateXpub,
  getDefaultAddresses,
  deriveAddresses,
  fetchBalance,
} from './bitcoin/wallet';
import { fetchUtxos, stripScriptPubKey } from './bitcoin/utxo';
import { fetchFeeEstimates } from './bitcoin/fees';
import {
  buildPsbt,
  validateSignedPsbt,
  broadcastTransaction,
} from './bitcoin/transactions';
import {
  storeXpub,
  getXpub,
  hasPassword,
  verifyPassword,
  setPassword,
  changePassword,
  createRecoveryKey,
  getRecoveryKey,
  resetPasswordWithRecovery,
  hasApiKey,
  getApiKey,
  storeApiKey,
} from './keychain';
import { sendAgentMessage } from './agent/agent';
import { getUtxoLabels } from './agent/tools';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Testnet by default during development
const NETWORK = bitcoin.networks.testnet;
const NETWORK_TYPE: 'testnet' | 'mainnet' = 'testnet';

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    title: 'BTC Agent App',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// --- M1 IPC Handlers ---

ipcMain.handle(
  'wallet:importXpub',
  async (_event, xpub: string): Promise<{ success: boolean; error?: string }> => {
    if (!validateXpub(xpub, NETWORK)) {
      return {
        success: false,
        error: 'Invalid extended public key. Ensure it is a valid tpub (testnet) and does not contain a private key.',
      };
    }
    try {
      await storeXpub(xpub);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: `Failed to store key in Keychain: ${(err as Error).message}`,
      };
    }
  }
);

ipcMain.handle(
  'wallet:getXpub',
  async (): Promise<string | null> => {
    return getXpub();
  }
);

ipcMain.handle(
  'wallet:getBalance',
  async (): Promise<{ confirmed: number; unconfirmed: number }> => {
    const xpub = await getXpub();
    if (!xpub) throw new Error('No wallet imported');
    const addresses = getDefaultAddresses(xpub, NETWORK);
    return fetchBalance(addresses, NETWORK_TYPE);
  }
);

ipcMain.handle(
  'wallet:getAddresses',
  async (_event, start: number, count: number): Promise<string[]> => {
    const xpub = await getXpub();
    if (!xpub) throw new Error('No wallet imported');
    return deriveAddresses(xpub, NETWORK, start, count);
  }
);

// --- M2 IPC Handlers ---

ipcMain.handle('wallet:getUtxos', async () => {
  const xpub = await getXpub();
  if (!xpub) throw new Error('No wallet imported');
  const utxos = await fetchUtxos(xpub, NETWORK, NETWORK_TYPE);
  return stripScriptPubKey(utxos);
});

ipcMain.handle('wallet:getFees', async () => {
  return fetchFeeEstimates(NETWORK_TYPE);
});

ipcMain.handle(
  'wallet:buildPsbt',
  async (
    _event,
    params: { destination: string; amountSats: number; feeRate: number }
  ) => {
    const xpub = await getXpub();
    if (!xpub) throw new Error('No wallet imported');
    const utxos = await fetchUtxos(xpub, NETWORK, NETWORK_TYPE);
    return buildPsbt({
      ...params,
      utxos,
      xpub,
      network: NETWORK,
      networkType: NETWORK_TYPE,
    });
  }
);

ipcMain.handle(
  'wallet:exportPsbtFile',
  async (_event, psbtBase64: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Unsigned PSBT',
      defaultPath: 'transaction.psbt',
      filters: [{ name: 'PSBT', extensions: ['psbt'] }],
    });
    if (result.canceled || !result.filePath) {
      return { success: false };
    }
    const buffer = Buffer.from(psbtBase64, 'base64');
    fs.writeFileSync(result.filePath, buffer);
    return { success: true, filePath: result.filePath };
  }
);

ipcMain.handle('wallet:importSignedPsbt', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Signed PSBT',
    filters: [{ name: 'PSBT', extensions: ['psbt'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' };
  }
  try {
    const buffer = fs.readFileSync(result.filePaths[0]);
    const psbtBase64 = buffer.toString('base64');
    const validation = validateSignedPsbt(psbtBase64, NETWORK);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    return { success: true, txHex: validation.txHex };
  } catch (err) {
    return { success: false, error: `Failed to read file: ${(err as Error).message}` };
  }
});

ipcMain.handle(
  'wallet:broadcastTx',
  async (_event, txHex: string) => {
    try {
      const txid = await broadcastTransaction(txHex, NETWORK_TYPE);
      return { success: true, txid };
    } catch (err) {
      return {
        success: false,
        error: `Broadcast failed: ${(err as Error).message}`,
      };
    }
  }
);

// --- Agent IPC Handlers ---

// In-memory chat history for the agent session
let agentChatHistory: MessageParam[] = [];

ipcMain.handle('agent:hasApiKey', async () => {
  return hasApiKey();
});

ipcMain.handle('agent:setApiKey', async (_event, key: string) => {
  await storeApiKey(key);
  return { success: true };
});

ipcMain.handle('agent:sendMessage', async (_event, message: string) => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const xpub = await getXpub();
  if (!xpub) throw new Error('No wallet imported');

  const context = { xpub, network: NETWORK, networkType: NETWORK_TYPE };

  const response = await sendAgentMessage(
    apiKey,
    message,
    agentChatHistory,
    context
  );

  // Update chat history for continuity
  agentChatHistory.push({ role: 'user', content: message });
  agentChatHistory.push({ role: 'assistant', content: response.message });

  return response;
});

// --- UTXO Label IPC Handlers ---

ipcMain.handle(
  'wallet:labelUtxo',
  async (_event, txid: string, vout: number, label: string) => {
    const { getUtxoLabels: getLabels } = await import('./agent/tools');
    const labels = getLabels();
    labels[`${txid}:${vout}`] = label;
  }
);

ipcMain.handle('wallet:getUtxoLabels', async () => {
  return getUtxoLabels();
});

// --- Recovery Key IPC Handlers ---

ipcMain.handle('auth:createRecoveryKey', async () => {
  return createRecoveryKey();
});

ipcMain.handle('auth:getRecoveryKey', async (_event, password: string) => {
  const valid = await verifyPassword(password);
  if (!valid) return { success: false, error: 'Incorrect password' };
  const key = await getRecoveryKey();
  return { success: true, recoveryKey: key };
});

ipcMain.handle(
  'auth:resetWithRecovery',
  async (_event, recoveryKey: string, newPassword: string) => {
    const success = await resetPasswordWithRecovery(recoveryKey, newPassword);
    return { success, error: success ? undefined : 'Invalid recovery key' };
  }
);

// --- Password IPC Handlers ---

ipcMain.handle('auth:hasPassword', async () => {
  return hasPassword();
});

ipcMain.handle('auth:verifyPassword', async (_event, password: string) => {
  return verifyPassword(password);
});

ipcMain.handle('auth:setPassword', async (_event, password: string) => {
  await setPassword(password);
  return { success: true };
});

ipcMain.handle(
  'auth:changePassword',
  async (_event, currentPassword: string, newPassword: string) => {
    const changed = await changePassword(currentPassword, newPassword);
    return { success: changed, error: changed ? undefined : 'Current password is incorrect' };
  }
);

// --- App lifecycle ---

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
