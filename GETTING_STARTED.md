# Bitcoin Agent — Getting Started Guide

## For new users setting up and running the app for the first time

---

## Prerequisites

Before running Bitcoin Agent, ensure you have:

1. **macOS** (Apple Silicon recommended — tested on M4 MacBook Air)
2. **Node.js 20+** installed (via nvm recommended)
3. **Xcode Command Line Tools** (required for native modules like keytar)

If you don't have these yet:

```bash
# Install Xcode CLI tools
xcode-select --install

# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc

# Install and use Node.js 20
nvm install 20
nvm use 20
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/[your-github-username]/bitcoin-agent.git
cd bitcoin-agent/bitcoin-agent
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs Electron, React, bitcoinjs-lib, keytar (macOS Keychain), and all other dependencies. Native modules (keytar) will compile automatically — this requires Xcode CLI tools.

If you see build errors for `keytar` or `tiny-secp256k1`, run:

```bash
xcode-select --install
npm rebuild
```

---

## Step 3: Launch the App

```bash
npm start
```

The Electron app will open. On first launch, you will see the **Import Watch-Only Wallet** screen.

---

## Step 4: Import Your Extended Public Key (xpub)

The app operates in **watch-only mode** — it can see your balance and transactions but never has access to your private keys.

1. Open the app — you'll see a text area asking for your extended public key
2. **For testnet** (default during development): paste a `tpub...` key
3. **For mainnet** (Phase 10+): paste an `xpub...` or `zpub...` key
4. Click **"Import Watch-Only Wallet"**

### Where to get your xpub/tpub:

- **Sparrow Wallet**: Settings → Keystore → Master Fingerprint → click "Show xpub"
- **Coldcard**: Settings → Advanced → View Identity → Export XPUB (use the BIP84 zpub/tpub)
- **Blockstream Green**: Account → Watch-Only → copy the xpub
- **For testing**: Use [Ian Coleman's BIP39 tool](https://iancoleman.io/bip39/) to generate a testnet tpub (select "BIP84" and "Bitcoin Testnet")

### What happens:

- The app validates the key format
- If valid, it is stored securely in your **macOS Keychain** (not on disk)
- The app derives the first 20 BIP84 (native segwit / bech32) addresses
- It queries mempool.space for your balance

### What it rejects:

- Private keys (xprv / tprv) — the app will refuse and explain why
- Malformed keys — validation error shown
- Wrong network prefix (e.g., xpub on testnet mode) — error shown

---

## Step 5: View Your Dashboard

After a successful import, you'll see the **Dashboard** with:

- **Confirmed balance** — sats that have 6+ confirmations
- **Unconfirmed balance** — sats in the mempool (0-5 confirmations)
- **Network badge** — shows TESTNET or MAINNET
- **Refresh button** — re-fetches balance from mempool.space

---

## Step 6: Explore the Sidebar

The sidebar provides navigation:

| Tab | What it shows |
|---|---|
| **Dashboard** | Balance display, refresh |
| **Reference** | Every task the agent can perform, with example prompts |
| **How To** | Detailed guide to security model, transactions, privacy, and more |

---

## Step 7: Understand the Security Model

Bitcoin Agent uses a three-layer security architecture:

```
Layer 1 — Hot (This App)
  Watch-only xpub — reads balances, derives addresses
  Agent (Claude) — proposes actions, never signs

Layer 2 — Warm (PSBT Interface)
  Unsigned PSBTs exported via QR or file
  Signed PSBTs imported back for broadcast

Layer 3 — Cold (Your Hardware)
  Coldcard, Jade, or air-gapped machine
  Private keys never leave this device
```

**The agent proposes. You approve and sign. The keys stay cold.**

---

## Step 8: Quit and Relaunch

When you quit and relaunch the app:

- The app automatically retrieves your xpub from the macOS Keychain
- Balance is re-fetched — no need to re-import
- Your wallet persists across sessions

---

## Troubleshooting

### "Cannot find module 'keytar'" or native module errors

```bash
xcode-select --install
npm rebuild
```

### App shows 0 balance but you know the wallet has funds

- Verify you're on the correct network (testnet vs mainnet)
- Verify the xpub/tpub matches what Sparrow shows for BIP84
- Check mempool.space directly for one of your addresses

### Want to remove the stored xpub

Open **Keychain Access** (macOS app) → search for "bitcoin-agent" → delete the entry. On next launch, the import screen will appear again.

### WASM errors on launch

Ensure you're using Node.js 20+ (`node --version`). Older versions may not support the WASM modules used by tiny-secp256k1.

---

## What's Next

The app currently supports M1–M3:

- **M1** (complete): Wallet import, balance display, address derivation
- **M2** (complete): PSBT builder, QR export, cold signing workflow, password lock
- **M3** (complete): Claude AI agent with wallet tool-use chat interface

Future milestones:

- **M4**: Full UI with UTXO labeling and coin control
- **M5**: Hardware wallet integration (Coldcard QR, Jade USB)
- **M6+**: Lightning, earning sats, autonomous tasks, Tor privacy

See `PROJECT_PLAN.md` for the full roadmap.
