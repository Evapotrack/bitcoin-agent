const sections = [
  {
    title: 'Getting Started',
    content: [
      'Bitcoin Agent is a watch-only wallet with an AI agent that helps you manage your Bitcoin.',
      'On first launch, paste your extended public key (tpub for testnet, xpub/zpub for mainnet) to import your wallet. The xpub is stored securely in the macOS Keychain — never on disk.',
      'The app derives addresses from your xpub and queries mempool.space for balance and transaction data. It never has access to your private keys.',
    ],
  },
  {
    title: 'Security Model',
    content: [
      'Three-layer architecture: Hot (this app, watch-only) -> Warm (PSBT signing interface) -> Cold (hardware device holds keys).',
      'All spending goes through unsigned PSBT -> hardware sign on Coldcard or Jade -> broadcast. The agent prepares transactions but never signs them.',
      'Your API key for Claude is stored in the macOS Keychain via keytar. No secrets are ever written to files or environment variables.',
    ],
  },
  {
    title: 'How Transactions Work',
    content: [
      'To send Bitcoin, tell the agent the destination address, amount, and fee preference. The agent builds an unsigned PSBT.',
      'Export the PSBT as a file or QR code, sign it on your hardware wallet (Coldcard, Jade, or air-gapped Sparrow), then import the signed PSBT back to broadcast.',
      'The agent monitors transactions automatically: Pending (0 conf) -> Confirming (1-5 conf) -> Confirmed (6+ conf). Desktop notifications fire at key milestones.',
    ],
  },
  {
    title: 'Privacy & UTXO Management',
    content: [
      'A fresh address is generated for every receive — no address is ever reused.',
      'UTXOs from exchanges (Strike, Coinbase, etc.) are flagged as KYC-origin. The agent will warn before mixing them with non-KYC UTXOs in a single transaction.',
      'UTXO consolidation is privacy-partitioned: KYC and non-KYC UTXOs are always consolidated in separate batches. Consolidation is only proposed when fees are below your threshold (default 5 sat/vB).',
      'The agent provides coin control suggestions before every send, explaining the privacy implications in plain language.',
    ],
  },
  {
    title: 'Agent Chat',
    content: [
      'The chat window accepts natural language instructions for all wallet tasks. See the Reference tab for a full list of tasks and example prompts.',
      'The agent confirms all amounts and addresses before building any PSBT. Amounts over 0.01 BTC require explicit typed confirmation.',
      'The agent remembers your preferences and context within a session. It stores conversation history locally in SQLite.',
    ],
  },
  {
    title: 'Earning Sats (Phase 2-3)',
    content: [
      'The agent can earn sats through L402 paid API responses, Nostr content zaps, Lightning routing fees, and completing bounties on whitelisted platforms.',
      'Autonomous task scanning checks Stacker News, Bitbounty, and Nostr bounties on a configurable schedule. All tasks require your approval before the agent acts.',
      'When your Lightning balance exceeds a threshold, the agent automatically proposes a cold storage sweep PSBT.',
    ],
  },
  {
    title: 'Data Export',
    content: [
      'All data the agent accumulates is exportable on demand as Markdown, JSON, or PDF.',
      'Exports include: transaction history with labels, task log with sat/hour rates, conversation history, UTXO register, earning/spending summaries, and cold storage sweep log.',
      'Exports are local files only — never uploaded or transmitted. You own your data completely.',
    ],
  },
  {
    title: 'Testnet vs Mainnet',
    content: [
      'The app defaults to testnet during development. Testnet uses tpub keys and testnet Bitcoin (no real value).',
      'Mainnet support is enabled in Phase 10 after full security hardening and Tor routing.',
      'The network badge in the sidebar shows which network is active.',
    ],
  },
  {
    title: 'Compatible Tools',
    content: [
      'Bitcoin Agent is designed to work alongside Sparrow Wallet and Blockstream Green. Import the same xpub to keep them in sync.',
      'PSBTs follow the BIP174 standard and are fully compatible with Sparrow\'s coin control features.',
      'Hardware wallets: Coldcard MK4 (QR or SD card), Blockstream Jade (USB), and air-gapped Sparrow machines are all supported signing devices.',
    ],
  },
];

export function HowToView() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-2">How To Use</h2>
      <p className="text-sm text-gray-400 mb-8">
        A guide to using Bitcoin Agent for self-custody wallet management.
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-3">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.content.map((paragraph, i) => (
                <p key={i} className="text-xs text-gray-400 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
