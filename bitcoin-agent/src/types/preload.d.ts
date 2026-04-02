interface BitcoinAgentAPI {
  importXpub: (xpub: string) => Promise<{ success: boolean; error?: string }>;
  getXpub: () => Promise<string | null>;
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number }>;
  getAddresses: (start: number, count: number) => Promise<string[]>;
}

declare global {
  interface Window {
    bitcoinAgent: BitcoinAgentAPI;
  }
}

export {};
