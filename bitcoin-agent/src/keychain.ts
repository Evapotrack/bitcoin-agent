import * as keytar from 'keytar';

const SERVICE = 'bitcoin-agent';
const ACCOUNT_XPUB = 'xpub';

export async function storeXpub(xpub: string): Promise<void> {
  await keytar.setPassword(SERVICE, ACCOUNT_XPUB, xpub);
}

export async function getXpub(): Promise<string | null> {
  return keytar.getPassword(SERVICE, ACCOUNT_XPUB);
}

export async function deleteXpub(): Promise<boolean> {
  return keytar.deletePassword(SERVICE, ACCOUNT_XPUB);
}
