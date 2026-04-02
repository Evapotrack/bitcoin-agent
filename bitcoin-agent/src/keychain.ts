import * as keytar from 'keytar';

const SERVICE = 'bitcoin-agent';
const ACCOUNT_XPUB = 'xpub';
const ACCOUNT_PASSWORD = 'app-password';

export async function storeXpub(xpub: string): Promise<void> {
  await keytar.setPassword(SERVICE, ACCOUNT_XPUB, xpub);
}

export async function getXpub(): Promise<string | null> {
  return keytar.getPassword(SERVICE, ACCOUNT_XPUB);
}

export async function deleteXpub(): Promise<boolean> {
  return keytar.deletePassword(SERVICE, ACCOUNT_XPUB);
}

// Password management
export async function hasPassword(): Promise<boolean> {
  const pw = await keytar.getPassword(SERVICE, ACCOUNT_PASSWORD);
  return pw !== null;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await keytar.getPassword(SERVICE, ACCOUNT_PASSWORD);
  return stored === password;
}

export async function setPassword(password: string): Promise<void> {
  await keytar.setPassword(SERVICE, ACCOUNT_PASSWORD, password);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const valid = await verifyPassword(currentPassword);
  if (!valid) return false;
  await keytar.setPassword(SERVICE, ACCOUNT_PASSWORD, newPassword);
  return true;
}
