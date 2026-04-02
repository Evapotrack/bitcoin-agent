import { safeStorage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Store encrypted secrets in app's userData directory
// safeStorage uses the OS keychain for the encryption key (no external native modules)
// Lazy path resolution — app.getPath() requires app to be ready
function getStorePath(): string {
  return path.join(app.getPath('userData'), 'secure-store.enc');
}

interface SecureStore {
  password?: string;
  recoveryKey?: string;
  xpub?: string;
  apiKey?: string;
}

function loadStore(): SecureStore {
  try {
    if (!fs.existsSync(getStorePath())) return {};
    const encrypted = fs.readFileSync(getStorePath());
    if (!safeStorage.isEncryptionAvailable()) return {};
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

function saveStore(store: SecureStore): void {
  try {
    if (!safeStorage.isEncryptionAvailable()) return;
    const json = JSON.stringify(store);
    const encrypted = safeStorage.encryptString(json);
    const dir = path.dirname(getStorePath());
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getStorePath(), encrypted);
  } catch (err) {
    console.error('Failed to save secure store:', err);
  }
}

// --- xpub ---
export async function storeXpub(xpub: string): Promise<void> {
  const store = loadStore();
  store.xpub = xpub;
  saveStore(store);
}

export async function getXpub(): Promise<string | null> {
  return loadStore().xpub || null;
}

export async function deleteXpub(): Promise<boolean> {
  const store = loadStore();
  delete store.xpub;
  saveStore(store);
  return true;
}

// --- Password ---
export async function hasPassword(): Promise<boolean> {
  return !!loadStore().password;
}

export async function verifyPassword(password: string): Promise<boolean> {
  return loadStore().password === password;
}

export async function setPassword(password: string): Promise<void> {
  const store = loadStore();
  store.password = password;
  saveStore(store);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const store = loadStore();
  if (store.password !== currentPassword) return false;
  store.password = newPassword;
  saveStore(store);
  return true;
}

// --- Recovery key ---
function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 6; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
}

export async function createRecoveryKey(): Promise<string> {
  const key = generateRecoveryKey();
  const store = loadStore();
  store.recoveryKey = key;
  saveStore(store);
  return key;
}

export async function getRecoveryKey(): Promise<string | null> {
  return loadStore().recoveryKey || null;
}

export async function verifyRecoveryKey(key: string): Promise<boolean> {
  return loadStore().recoveryKey === key;
}

export async function resetPasswordWithRecovery(
  recoveryKey: string,
  newPassword: string
): Promise<boolean> {
  const store = loadStore();
  if (store.recoveryKey !== recoveryKey) return false;
  store.password = newPassword;
  saveStore(store);
  return true;
}

// --- API key ---
export async function hasApiKey(): Promise<boolean> {
  return !!loadStore().apiKey;
}

export async function getApiKey(): Promise<string | null> {
  return loadStore().apiKey || null;
}

export async function storeApiKey(key: string): Promise<void> {
  const store = loadStore();
  store.apiKey = key;
  saveStore(store);
}
