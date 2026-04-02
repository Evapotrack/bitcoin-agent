# Bitcoin Agent — Desktop App Project Plan
## Version 2 — Cold Storage + Agent Economy
## Creator: Andrew Brown | Built with Claude Code | Open source (MIT) — planned

---

## Project Context

- **Creator:** Andrew Brown (sole developer and owner)
- **Build tool:** Claude Code (Anthropic) — all code written via Claude Code on a 2025 MacBook Air
- **Platform:** macOS only (Apple Silicon M4, macOS Sequoia+)
- **Status:** Experimental, personal use, pre-public
- **Open source:** Planned MIT release on GitHub after M4/M5 milestone
- **Reference docs in this folder:** `GOALS_AND_VISION.md`, `AGENT_CAPABILITIES.md`, `CLAUDE_CODE_PROMPTS.md`, `PROJECT_METADATA.md`

---

## Overview

A macOS desktop app (Electron + React) featuring an AI agent that can create wallets, send/receive/store Bitcoin, and — in a later phase — execute Lightning Network payments. The agent is chat-driven, so users can prompt tasks naturally or tap the action buttons.

The agent operates on a strict layered security model: it lives in the hot (watch-only) layer and never has signing authority. Private keys stay on a Coldcard, Jade, or air-gapped Sparrow machine. The agent's job is to watch, analyze, propose, earn, and prepare unsigned PSBTs — the human signs.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Shell | **Electron** | Native macOS app, keychain access, file system |
| UI | **React + Tailwind** | Fast iteration, great component ecosystem |
| Bitcoin lib | **bitcoinjs-lib** | Battle-tested, supports all script types |
| Key storage | **macOS Keychain** (via `keytar`) | Secure seed/key storage off disk |
| Node API | **Esplora / mempool.space** | Block explorer + mempool data |
| AI Agent | **Claude API (claude-sonnet-4-6)** | Tool-use for wallet actions + web tasks |
| Lightning (phase 2) | **LDK (Lightning Dev Kit)** | Embedded node, no external daemon |
| State | **Zustand** | Lightweight, works well with Electron |
| DB | **SQLite (better-sqlite3)** | Local tx history, address labels, task log |
| Web scraping | **Playwright** | Headless browser for task discovery |
| NWC | **Nostr Wallet Connect** | Lightning control from agent |

---

## Cold Storage Architecture

The app is designed around a three-layer security model compatible with Sparrow Wallet and Blockstream Green workflows.

### Layer 1 — Hot (Agent + Watch-Only)
- Agent (Claude + tools) runs here
- Watch-only xpub imported from cold device — reads balances and tx history, cannot spend
- Sparrow or Blockstream Green compatible via shared xpub
- mempool.space API for fee data, UTXO monitoring, balance

### Layer 2 — Warm (PSBT Signing Interface)
- Agent constructs unsigned PSBTs for any proposed spend or sweep
- PSBTs exported via QR code, SD card, or NFC to the cold layer
- Multisig policy (optional 2-of-3) enforced here
- Signed PSBTs return here for broadcast

### Layer 3 — Cold (Keys Never Leave)
- Coldcard MK4, Blockstream Jade, or air-gapped Sparrow machine
- BIP39 seed stored on steel plate or paper backup, never digital
- Signs PSBTs, returns signed file via air-gap bridge
- Agent never touches this layer

### Sparrow / Blockstream Green Integration
- Import the same xpub into the agent app that exists in Sparrow — they stay in sync via Esplora
- All PSBT construction follows BIP174 standard, fully compatible with Sparrow's coin control
- Blockstream Green 2FA multisig: agent can prepare transactions that require Green's co-signature

---

## Feature Set

### Phase 1 — Core Wallet

- **Create wallet** — generate BIP39 seed, derive BIP84 (native segwit) HD wallet
- **Receive** — auto-generate a fresh bech32 address for every receive request (BIP84 HD derivation, gap-safe). Address is never reused. QR code displayed alongside address string.
- **Strike / exchange receive** — standard bech32 addresses work with any Bitcoin-compatible sender (Strike, Cash App, River, Coinbase, etc.). User shares address or QR with sender, no special integration needed.
- **Send** — build unsigned PSBT, export for cold signing on Coldcard or Jade, broadcast signed PSBT on return
- **Transaction status — incoming** — live polling via mempool.space WebSocket:
  - `Pending` — seen in mempool, 0 conf. Displays txid, amount, sender address if labeled, estimated confirmation time
  - `Confirming` — 1–5 confirmations. Displays block height, time elapsed
  - `Confirmed` — 6+ confirmations. Logged to history, UTXO labeling prompt triggered
  - `Suspicious` — double-spend attempt detected, or transaction stalled unusually long
- **Transaction status — outgoing PSBTs** — `PSBT Built` → `PSBT Signed` → `Broadcast` → `Confirming` → `Confirmed`. RBF (Replace-By-Fee) and CPFP (Child-Pays-For-Parent) options surfaced if stuck.
- **Desktop notifications** — fires on: first mempool detection, 1 confirmation, 6 confirmations
- **Transaction history** — full list with labels, amounts, fees paid, block height, UTXO sources, confirmation status
- **Fee estimator** — live mempool.space data (high / medium / low priority sat/vB)
- **Fee timing alerts** — agent queues pending sweeps for optimal low-fee mempool windows
- **Address book** — label external addresses including known exchange withdrawal addresses
- **UTXO labeling** — tag by source: earned / received / purchased / exchange-KYC-origin. Auto-prompted on each confirmed receive.
- **Exchange-origin UTXO flags** — UTXOs arriving from known exchange addresses (Strike, Coinbase, etc.) are flagged as KYC-linked. Agent warns before mixing with non-KYC UTXOs.
- **Coin control suggestions** — before every PSBT, agent presents recommended UTXO selection with plain-language privacy reasoning
- **Address clustering warnings** — agent flags any proposed send that would link previously unlinked UTXOs
- **Backup & restore** — export encrypted seed backup, import via seed phrase
- **Hardware wallet support** — Coldcard, Jade, Ledger via USB or QR PSBT

### Phase 2 — Lightning + Earning

- Open/close channels via LDK
- BOLT11 invoice generation and payment
- Nostr Wallet Connect (NWC) — agent controls Lightning wallet via NWC protocol
- L402 API server — agent earns sats by serving paid HTTP responses
- Nostr posting + zap collection
- Lightning routing fee management and rebalancing
- Auto-sweep: when Lightning balance > threshold, agent builds PSBT to move sats to cold storage

### Phase 3 — Autonomous Task Earning

See "Agent Economy" section below.

### Additional Features

- **Price ticker** — live BTC/USD in sidebar, configurable currency
- **Sats/BTC toggle** — display in whole BTC or satoshis
- **Testnet mode** — toggle for safe dev/testing
- **Lock screen** — PIN or Touch ID on open/resume
- **Multi-wallet** — switch between named wallet profiles
- **Tor routing** — optional privacy mode for broadcasts
- **Notifications** — native macOS alerts for incoming transactions and earned sats
- **Dark/light mode** — follows macOS system preference
- **Task log** — persistent SQLite record of all agent earn/spend activity with sats amounts

---

## Agent Economy — Earn, Spend, Store

### The Closed Loop

```
Agent earns sats (Lightning/Nostr/L402)
        ↓
Hot Lightning wallet accumulates
        ↓
Balance exceeds threshold (e.g. 500k sats)
        ↓
Agent constructs unsigned PSBT → cold storage address
        ↓
User signs on Coldcard → broadcasts
        ↓
Sats stack in cold storage. Repeat.
```

### Earn Tasks (Agent Performs Autonomously)

| Task | Protocol | Notes |
|---|---|---|
| Sell AI answers via L402 | Lightning HTTP 402 | Alby SDK, priced per query in sats |
| Nostr content + zaps | Nostr + NWC | Agent posts analysis, earns zaps to Lightning address |
| Lightning routing fees | LDK embedded node | Earn 1–100 ppm on routed payments |
| Bounty task completion | Stacker News, Bitbounty | Agent claims sat bounties for completed tasks |
| Web task hunting | Playwright + Claude | See autonomous task discovery section below |

### Spend Tasks (User Funds the Agent)

| Task | Protocol | Notes |
|---|---|---|
| Pay-per-call AI APIs | Lightning micropayments | No subscription needed, sats per request |
| Automated DCA buys | Strike API / Bisq | Schedule or price-trigger buys into cold storage |
| Pay for compute/storage | Akash, Nodeless | Agent spins up servers, pays per-minute in sats |
| On-chain timestamping | OpenTimestamps / OP_RETURN | Hash files to Bitcoin for a few hundred sats |

### Store Tasks (Agent Manages Cold Storage)

| Task | Notes |
|---|---|
| Auto-sweep to cold | Builds PSBT when hot balance exceeds threshold |
| UTXO labeling by source | Tracks provenance: earned / received / purchased |
| Privacy coin control | Recommends which UTXOs to spend, flags tainted coins |
| Fee timing | Queues consolidation transactions for low-fee mempool windows |

---

## Autonomous Web Task Discovery (Phase 3)

### Concept

The agent can be given a budget (e.g. 10k sats/day in API costs) and a permission level, then autonomously search for safe, simple tasks that pay sats — scraping platforms, claiming bounties, submitting work, and collecting payment.

### How It Works

1. Agent runs a scheduled scan (configurable interval — e.g. every 6 hours)
2. Uses web search + Playwright headless browser to check known task platforms
3. Scores each task against a safety/effort/reward heuristic
4. Presents shortlist to user for approval (or auto-executes if within pre-approved task types)
5. Performs task, submits work, collects Lightning payment
6. Logs outcome to SQLite task ledger

### Task Discovery Sources

| Platform | Task Type | Payout |
|---|---|---|
| Stacker News | Answer questions, write posts | Zaps (Lightning) |
| Bitbounty.dev | GitHub issue fixes, translations | Lightning invoice |
| Microlancer (sat-based) | Micro writing, data entry | Lightning |
| Nostr bounties (NIP-99) | Open bounty posts on Nostr | Zap or keysend |
| LNbits Bounty extension | Custom bounty boards | Lightning |
| Translation platforms | Document/string translation | Lightning or on-chain |

### Safety Rules (Hardcoded in Agent Prompt)

```
AUTONOMOUS TASK RULES:
1. Never spend more sats than the user-defined daily budget on task attempts.
2. Only attempt tasks on the pre-approved platform whitelist.
3. Never submit personal information, create accounts with real identity, or agree to terms without user review.
4. Never attempt tasks involving financial advice, legal content, medical content, or anything requiring professional licensure.
5. All task attempts are logged — user can review and cancel at any time.
6. If a task requires spending >500 sats upfront with uncertain return, pause and ask user.
7. Prefer tasks completable in <10 minutes with deterministic payment (Lightning invoice) over open-ended tasks.
8. Never interact with platforms that are not on the approved whitelist without explicit user approval.
```

### Agent Prompt Extension for Task Mode

```
You are operating in TASK MODE. Your goal is to find and complete simple tasks
that pay sats, within the user's defined budget and whitelist.

For each candidate task:
- Estimate time to complete (target: under 10 minutes)
- Estimate sat reward
- Calculate sat/hour rate
- Flag any risk (upfront cost, identity required, ambiguous payment)
- Present top 3 candidates to user before acting

After completing a task:
- Log task name, platform, sats earned, time spent, sat/hour rate to the task ledger
- If payment was a Lightning invoice, pay it and confirm receipt
- If balance triggers auto-sweep threshold, prepare cold storage PSBT
```

---

## Project Structure

```
bitcoin-agent-project/
├── package.json
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge (renderer ↔ main)
│   └── keychain.ts          # macOS Keychain integration
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SendModal.tsx
│   │   ├── ReceiveModal.tsx
│   │   ├── TransactionList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── TaskLog.tsx          # NEW — earned sats log
│   │   ├── ColdStoragePanel.tsx # NEW — PSBT workflow UI
│   │   └── QRCode.tsx
│   ├── agent/
│   │   ├── agent.ts         # Claude API integration + tool routing
│   │   ├── tools.ts         # Tool definitions
│   │   ├── prompts.ts       # System prompt + task mode prompt
│   │   └── taskScanner.ts   # NEW — autonomous task discovery
│   ├── bitcoin/
│   │   ├── wallet.ts        # Key derivation, address generation (auto-fresh)
│   │   ├── transactions.ts  # Build unsigned PSBTs
│   │   ├── psbt.ts          # PSBT construction, export, import, status tracking
│   │   ├── txMonitor.ts     # NEW — mempool WebSocket, confirmation polling, notifications
│   │   ├── utxo.ts          # UTXO management, coin control, labeling, KYC flags
│   │   ├── privacy.ts       # NEW — clustering detection, coin control suggestions, privacy scoring
│   │   └── fees.ts          # mempool.space fee fetching + timing
│   ├── lightning/
│   │   ├── node.ts          # LDK embedded node
│   │   ├── nwc.ts           # Nostr Wallet Connect
│   │   └── l402.ts          # L402 server for paid API endpoints
│   ├── store/
│   │   └── walletStore.ts   # Zustand state
│   └── db/
│       ├── database.ts      # SQLite setup
│       └── taskLedger.ts    # NEW — task earn/spend log
├── assets/
│   └── icon.icns
└── README.md
```

---

## Agent System Prompt (Full)

```
You are a personal Bitcoin agent running inside a secure desktop wallet app on macOS.

SECURITY MODEL:
- You operate in watch-only mode. You can see balances and transactions but cannot sign.
- All spending requires constructing an unsigned PSBT which the user signs on their hardware device.
- Private keys never exist in this app. Never ask for or handle seed phrases.

WALLET TOOLS:
- get_balance            — confirmed + unconfirmed balance
- get_receive_address    — next unused receive address
- build_psbt             — construct unsigned PSBT for user to sign on Coldcard/Jade
- list_transactions      — recent transaction history with labels
- estimate_fees          — live mempool fee estimates (sat/vB)
- get_utxos              — list UTXOs with labels and privacy flags
- label_utxo             — tag a UTXO with a source label
- get_fee_timing         — recommend best time window to broadcast for low fees
- backup_seed            — prompt user to view seed in Keys & Backup screen (never display it here)

LIGHTNING TOOLS (phase 2):
- lightning_balance      — hot Lightning wallet balance
- create_invoice         — generate BOLT11 invoice
- pay_invoice            — pay a Lightning invoice (within approved limits)
- sweep_to_cold          — build PSBT moving Lightning surplus to cold address

RULES:
1. Always confirm amounts and destination addresses before building any PSBT.
2. For any spend > 0.01 BTC, require explicit typed confirmation: "yes, send X sats to [address]".
3. Never display or request the seed phrase — direct user to Keys & Backup screen.
4. Label every incoming UTXO by source when known.
5. Recommend coin control: prefer spending earned/exchange UTXOs before privacy-sensitive ones.
6. Use sat/vB for fees. Display amounts in sats or BTC per user preference.
7. When Lightning balance exceeds sweep threshold, proactively suggest cold storage sweep.
8. Keep responses concise — one paragraph or a short list. No markdown headers in chat.
```

---

## Claude Code Bootstrap Commands

```bash
# 1. Scaffold
npx create-electron-app@latest bitcoin-agent --template=webpack-typescript
cd bitcoin-agent

# 2. Core dependencies
npm install react react-dom @types/react @types/react-dom
npm install bitcoinjs-lib ecpair tiny-secp256k1 bip39 bip32
npm install keytar better-sqlite3 zustand
npm install tailwindcss @anthropic-ai/sdk qrcode.react
npm install axios

# 3. Lightning + NWC
npm install @lightningdevkit/ldk-node
npm install nostr-tools

# 4. Task discovery
npm install playwright

# 5. Dev deps
npm install -D @types/better-sqlite3 @types/node

# 6. Start
npm start
```

---

## Claude Code Session Prompt

```
I'm building a macOS Bitcoin wallet desktop app using Electron + React.

Stack: Electron, React, TypeScript, Tailwind, bitcoinjs-lib, keytar (macOS Keychain),
better-sqlite3, Zustand, Anthropic Claude API (claude-sonnet-4-6), mempool.space for 
fee/UTXO data, LDK for Lightning, Nostr Wallet Connect.

Security model: watch-only + PSBT. Agent never holds signing keys. All spends are
unsigned PSBTs exported to Coldcard/Jade via QR or file. Compatible with Sparrow Wallet
and Blockstream Green xpub import workflow.

The app has: Dashboard, Wallet, Transactions, Keys & Backup, Lightning, Task Log, Settings.

Core features:
- Watch-only HD wallet (BIP84) via xpub import
- Receive address + QR
- PSBT construction + QR export for cold signing
- Transaction history with UTXO labeling and coin control
- Fee estimation + mempool timing alerts
- Claude agent with tool-use (wallet tools + task tools)
- Auto-sweep: Lightning balance > threshold → builds cold storage PSBT
- Task mode: agent discovers sat-paying tasks on approved platforms

Build step by step starting with:
1. Electron main + preload IPC bridge
2. Watch-only wallet module (xpub import, address derivation, PSBT builder)
3. Claude agent module with tool definitions
4. React UI (sidebar, dashboard, chat window, PSBT export modal)
```

---

## Security Checklist

- [ ] No private keys in app — watch-only xpub only
- [ ] All PSBTs constructed in main process, never renderer
- [ ] PSBT export/import uses QR or file — no network transmission of signed data
- [ ] Electron `contextIsolation: true`, `nodeIntegration: false`
- [ ] Claude API key stored in Keychain, not env files
- [ ] Task mode: hardcoded platform whitelist, user approval before execution
- [ ] Task mode: daily sat budget cap enforced in code, not just prompt
- [ ] Lock screen (PIN / Touch ID) before displaying balances or launching task mode
- [ ] No telemetry, no remote logging of addresses, amounts, or task content
- [ ] Testnet toggle clearly visible — default to testnet during development
- [ ] Tor routing available for all mempool.space and Esplora API calls

---

## Milestones

| Milestone | Description |
|---|---|
| M1 | Electron shell + xpub import + watch-only balance display |
| M2 | PSBT builder + QR export/import + cold signing workflow |
| M3 | Claude agent with wallet tool-use |
| M4 | Full UI (sidebar, modals, transaction list, UTXO labeling) |
| M5 | Hardware wallet integration (Coldcard QR, Jade USB) |
| M6 | Lightning node (LDK) + NWC + auto-sweep to cold |
| M7 | L402 server + Nostr zaps (agent earns sats) |
| M8 | Task mode — autonomous task discovery + execution |
| M9 | Tor routing + full privacy hardening |
