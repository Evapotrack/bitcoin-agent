import { app, BrowserWindow, ipcMain } from 'electron';
import * as bitcoin from 'bitcoinjs-lib';
import {
  validateXpub,
  getDefaultAddresses,
  deriveAddresses,
  fetchBalance,
} from './bitcoin/wallet';
import { storeXpub, getXpub } from './keychain';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Testnet by default during development
const NETWORK = bitcoin.networks.testnet;
const NETWORK_TYPE: 'testnet' | 'mainnet' = 'testnet';

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    title: 'Bitcoin Agent',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// --- IPC Handlers ---

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
    if (!xpub) {
      throw new Error('No wallet imported');
    }
    const addresses = getDefaultAddresses(xpub, NETWORK);
    return fetchBalance(addresses, NETWORK_TYPE);
  }
);

ipcMain.handle(
  'wallet:getAddresses',
  async (_event, start: number, count: number): Promise<string[]> => {
    const xpub = await getXpub();
    if (!xpub) {
      throw new Error('No wallet imported');
    }
    return deriveAddresses(xpub, NETWORK, start, count);
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
