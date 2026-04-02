# Bitcoin Agent — Goals, Vision & Living Summary
## Creator: Andrew Brown | Last updated: April 1, 2026

---

## Project Identity

**Creator & owner:** Andrew Brown (sole developer)
**Development tool:** Claude Code (Anthropic) — the entire project is written using Claude Code
**Hardware:** 2025 MacBook Air (Apple Silicon M4), macOS
**Purpose:** Experimental, personal use, eventually open-sourced on GitHub under Andrew Brown's account
**License (planned):** MIT
**Note:** Andrew Brown is also the creator and sole owner of Evapotrack (kept private in all public-facing project documentation)

---

## What This App Is

A personal macOS desktop application that combines a self-custody Bitcoin wallet with a single persistent AI agent (Claude) that understands and executes Bitcoin-related tasks through natural language chat. The user opens the app from their desktop, sees their balance and recent activity, and can either tap action buttons (Send, Receive, Store) or type instructions to the agent in a chat window.

There is one agent. It has one identity, one persistent memory of all activity, and one continuous relationship with the user. It is not a multi-agent system or a pipeline of specialized sub-agents — it is a single intelligent presence that knows everything about the wallet, every task it has attempted, every sat it has earned or spent, and every decision made over time.

All data the agent accumulates — transactions, tasks, earnings, labels, conversation history, decisions — is exportable at any time as a structured reference document. The user owns their data completely.

The app is designed around one core principle: **the agent is intelligent, but the keys are cold.** The AI can watch, analyze, earn, and propose — but it never holds signing authority. Private keys live on hardware (Coldcard, Jade) or an air-gapped machine, and every spend requires the user to physically sign a PSBT.

---

## Core Goals

1. Make self-custody Bitcoin approachable through a conversational interface — no manual UTXO management, no memorizing address formats, no fee guessing.
2. Give the agent real economic capability — it can earn sats, spend sats on tasks, and stack earnings directly into cold storage automatically.
3. Stay fully aligned with best-practice cold storage tools (Sparrow Wallet, Blockstream Green) rather than replacing them — the agent app is the intelligent layer on top.
4. Explore what an autonomous Bitcoin-native AI agent looks like in practice, including the ability to scan the web for tasks that pay sats.
5. Maintain a complete, exportable record of everything the agent has ever done — every sat, every task, every conversation — so the user always has a full audit trail they can read, share, or archive.
6. Build the entire project using Claude Code as the primary development tool — this project is itself an experiment in AI-assisted software development.
7. Open-source the project on GitHub under Andrew Brown's account after reaching a usable milestone state, contributing to the Bitcoin + AI agent ecosystem.

---

## Intended Users

- Bitcoiners who prefer cold storage (Coldcard, Jade, air-gapped Sparrow) but want a smarter interface for managing watch-only balances and preparing transactions.
- People curious about agentic AI that has real economic skin in the game — not just a chatbot, but a single agent that earns and manages actual sats with continuity over time.
- Developers and experimenters interested in Lightning micropayments, L402, Nostr, and autonomous agent workflows.

---

## App Functionalities

### Single Agent Identity

- One agent instance per app install. Not a multi-agent system.
- The agent has a persistent identity and memory: it knows the wallet history, every task it has run, every label it has assigned, every conversation held.
- Agent memory is stored locally in SQLite — no cloud sync, no external memory service.
- The agent's full context (wallet state, task log, conversation history, labels) is loaded into its working context at startup, keeping it oriented across sessions.
- The agent can be named by the user if desired.

### Full Data Export

Every piece of data the agent accumulates is exportable on demand as a structured reference document:

- **Export formats**: Markdown (human-readable), JSON (machine-readable / importable), PDF (archival)
- **What is included in an export**:
  - Complete transaction history with labels, amounts, fees, confirmations, UTXO sources
  - Full task log: every task attempted, platform, outcome, sats earned or spent, time taken, sat/hour rate
  - Agent conversation history (all chat exchanges, timestamped)
  - UTXO register: all UTXOs with source labels, privacy flags, spend history
  - Earning summary: total sats earned by category (L402 / Nostr / routing / bounties / tasks)
  - Spending summary: total sats spent by category (API calls / DCA / compute / timestamps)
  - Cold storage sweep log: every auto-sweep PSBT proposed, signed, and broadcast
  - Key design decisions and agent configuration at time of export
- **Export trigger**: available any time from Settings → Export Data, or via agent command ("export my full history as a report")
- **Privacy**: exports are local files only — never uploaded or transmitted. User controls where the file goes.
- **Use cases**: personal accounting, tax records, audit trail, archiving a phase of activity, onboarding a new device, sharing with a developer for debugging

### Wallet (Core)

- Watch-only wallet via xpub import — reads balances and transaction history without ever holding keys
- Compatible with Sparrow Wallet and Blockstream Green xpub workflows
- Receive: derive fresh bech32 addresses, display with QR code
- Send: construct unsigned PSBT, export via QR or file for cold signing on Coldcard or Jade
- Transaction history with user-defined labels per transaction and per UTXO
- UTXO labeling by source (earned / received / purchased / exchange-origin)
- Coin control: agent recommends which UTXOs to spend based on privacy and consolidation logic
- Fee estimation using live mempool.space data (high / medium / low priority sat/vB)
- Fee timing alerts: agent watches mempool and queues pending sweeps for low-fee windows

### Receiving Sats — Compatibility & Address Hygiene

The wallet is designed to receive sats from any Bitcoin-compatible source, including custodial apps and exchanges that withdraw to on-chain addresses:

- **Strike compatibility**: Strike and similar apps (Cash App, River, Coinbase) withdraw to standard bech32 (native segwit) addresses. The agent generates a fresh address, displays it with a QR code, and the user shares it with the Strike sender. No special integration required — Bitcoin is Bitcoin.
- **Lightning receive** (Phase 2): agent generates a BOLT11 invoice for Lightning-native senders. Displays amount, expiry, and QR. Settled instantly with no on-chain confirmation wait.
- **Address reuse prevention**: a new receive address is automatically generated and presented for every receive request. The previous address is retired from active display the moment a transaction is detected on it. This is enforced by the app, not left to the user to manage.
- **Address gap management**: the agent tracks the BIP84 derivation index and ensures the watch-only xpub stays in sync — no addresses fall through the gap limit.
- **Address labeling**: each generated address is automatically labeled with the date, a sequence number, and any context the user provides ("from Strike", "bounty payment", "DCA buy"). Labels persist in the local database and appear in exports.

### Transaction Verification & Status Display

Every transaction — incoming and outgoing — has a live status that the agent monitors and surfaces:

**Incoming transactions:**
- `Pending` — transaction seen in mempool, 0 confirmations. Agent displays: txid, amount, sender address (if known/labeled), current mempool position, estimated confirmation time based on fee rate paid by sender.
- `Confirming` — 1–5 confirmations. Agent displays confirmation count, block height, time elapsed since first seen.
- `Confirmed` — 6+ confirmations. Agent marks as settled, logs to transaction history, triggers UTXO labeling prompt.
- `Suspicious` — agent flags if: the transaction has been in mempool an unusually long time (low fee), if it is a double-spend attempt, or if the sending address is flagged in known scam/exchange databases.

**Outgoing transactions (PSBTs):**
- `PSBT built` — unsigned PSBT constructed by agent, awaiting export to hardware signer.
- `PSBT signed` — signed PSBT returned from hardware device, ready to broadcast.
- `Broadcast` — transaction submitted to network. Displays txid immediately.
- `Pending` → `Confirming` → `Confirmed` — same flow as incoming, with fee rate and RBF (Replace-By-Fee) option surfaced if stuck.

**Agent notifications:**
- Desktop notification on first mempool detection of any incoming transaction
- Desktop notification at 1 confirmation and again at 6 confirmations
- Agent proactively flags if an incoming transaction is unusually slow (sender used a very low fee rate) and explains why
- If a sent transaction is stuck, agent suggests RBF bump or CPFP (Child-Pays-For-Parent) and prepares the appropriate PSBT

### Privacy — Address & UTXO Management

Privacy is treated as a default behavior, not a setting the user has to find. The agent actively manages and suggests:

- **Fresh address per receive**: automatically enforced — no address is ever presented twice for a new receive request (see above)
- **Address clustering warnings**: agent flags if a proposed send would link two previously separate UTXOs in a single transaction, and explains the privacy implication before building the PSBT
- **UTXO source tagging**: every UTXO is tagged on arrival by origin type — on-chain from exchange (lower privacy), self-transfer (neutral), earned via task/bounty (neutral), received from known contact (user-labeled)
- **Exchange-origin UTXO flags**: UTXOs arriving from known exchange withdrawal addresses (Strike, Coinbase, etc.) are flagged as having a KYC trail. Agent recommends not mixing these with non-KYC UTXOs in the same transaction
- **Coin control suggestions**: before building any PSBT, agent presents a recommended UTXO selection optimized for privacy and fee efficiency, with a plain-language explanation of why those UTXOs were chosen
- **Consolidation timing advice**: agent recommends consolidating small UTXOs during low-fee mempool windows, and flags when consolidation would create a privacy-harmful link
- **Whirlpool / CoinJoin integration** (experimental, Phase 3): Sparrow-compatible CoinJoin coordination to break transaction history on KYC-origin UTXOs before moving to cold storage
- **Tor broadcast option**: outgoing transactions can be broadcast via Tor to prevent IP-address linkage to the transaction
- **Agent privacy summaries**: on request, agent produces a plain-language privacy assessment of the current UTXO set — which coins are clean, which have exchange history, and what actions would improve the overall privacy posture

### UTXO Consolidation — Privacy-Aware & Automated

UTXO consolidation is the practice of combining many small UTXOs into fewer larger ones, reducing wallet fragmentation and future transaction fees. The agent manages this as an ongoing background responsibility, not a one-time manual task — but always with privacy and security constraints enforced.

**Why consolidation matters:**
- Many small UTXOs (dust from bounties, routing fee residuals, frequent receives) inflate the size and cost of future transactions
- Consolidating early, at low fee windows, saves significant sats over time
- Unconsolidated wallets can leak privacy by being forced to combine UTXOs in unexpected ways during a spend

**How the agent handles it:**

- **Continuous monitoring**: agent tracks UTXO count, total value, average UTXO size, and estimated weight of the current UTXO set
- **Consolidation scoring**: each UTXO set is scored on fragmentation level (number of UTXOs), fee drag (estimated cost to spend all UTXOs individually), and dust threshold (UTXOs below ~1000 sats are flagged as uneconomical to spend at normal fees)
- **Privacy-constrained batching**: consolidation transactions are NEVER proposed that mix UTXOs of different privacy profiles — KYC-origin UTXOs (from Strike/Coinbase) are batched separately from non-KYC UTXOs. Mixing them in a single consolidation transaction links the identities.
- **Fee window targeting**: consolidation PSBTs are only proposed during low-fee mempool conditions (below a user-configurable sat/vB threshold, default 5 sat/vB). Agent queues the consolidation and waits for the right window rather than executing immediately.
- **Same-type batching rules**:
  - KYC-origin UTXOs → consolidate together into a single labeled "exchange-origin" UTXO
  - Non-KYC earned/received UTXOs → consolidate together, separate batch
  - Never consolidate across these groups in a single transaction
- **Change address hygiene**: consolidation change always goes to a fresh unused address, never back to a previously used address
- **Output size targets**: agent targets consolidation outputs above 100,000 sats (0.001 BTC) where possible, to avoid creating new dust
- **User approval**: consolidation PSBTs are presented to the user with a plain-language summary: "You have 14 small UTXOs totaling 84,200 sats. Consolidating now at 3 sat/vB would cost ~420 sats in fees and reduce future transaction costs significantly. Here is the unsigned PSBT." User reviews, signs on hardware device, broadcasts.
- **Automatic suggestions, never automatic execution**: consolidation is never executed without user approval and hardware signing. The agent prepares and recommends; the user signs.

**Consolidation privacy summary (agent can produce on request):**
- How many UTXOs exist across each privacy category
- Estimated fee drag of current fragmentation
- Recommended consolidation batches with fee estimate and privacy impact
- Which UTXOs should be consolidated first based on fee drag vs. privacy cost

- Three-layer architecture: Hot (agent + watch-only) → Warm (PSBT signing interface) → Cold (keys never online)
- PSBT construction follows BIP174 standard, fully compatible with Sparrow's coin control
- QR-based or file-based air-gap bridge to hardware signers
- Optional 2-of-3 multisig policy (Blockstream Green co-signature model)
- Auto-sweep: when Lightning or hot wallet balance exceeds a user-set threshold, agent automatically builds a PSBT to move surplus to cold storage — user just signs and broadcasts

### AI Agent (Chat Interface)

- Conversational interface for all wallet tasks: "what's my balance", "prepare a send to this address", "what are fees like right now", "label this UTXO as exchange purchase", "export my full history"
- Agent confirms all amounts and addresses before building any PSBT
- Extra confirmation required for amounts over 0.01 BTC
- Agent never displays or requests seed phrases — directs user to Keys & Backup screen
- Proactively suggests cold storage sweeps when hot balance builds up
- Advises on coin control and privacy (flags tainted UTXOs, recommends spend order)
- Can answer questions about its own history: "how many sats did I earn last month", "what tasks have you completed", "show me all transactions labeled exchange"

### Lightning Network (Phase 2)

- Embedded Lightning node via LDK (no external daemon required)
- Open and close channels
- Generate BOLT11 invoices and pay them
- Keysend payments
- Channel rebalancing (manual and agent-assisted)
- Nostr Wallet Connect (NWC): agent controls Lightning wallet via open protocol
- Auto-sweep: Lightning earnings above threshold → cold storage PSBT

### Agent Earning Capabilities (Phase 2–3)

The agent can earn sats autonomously within user-defined rules:

- **L402 paid API server**: agent exposes an HTTP endpoint; other apps pay a Lightning invoice per query (Alby SDK). Agent earns sats answering questions, summarizing content, or running tasks for external callers.
- **Nostr content + zaps**: agent posts useful content (analysis, summaries) to Nostr; readers zap sats to the agent's Lightning address via NWC.
- **Lightning routing fees**: agent manages channel liquidity and earns routing fees (1–100 ppm) on payments that flow through the user's channels.
- **Bounty task completion**: agent monitors Stacker News, Bitbounty, and Nostr bounty posts (NIP-99), claims and completes tasks (writing, translation, code fixes), collects Lightning payment.

### Agent Spending Capabilities (User-Funded Tasks)

- Pay-per-call AI APIs using Lightning micropayments (no subscription needed)
- Automated DCA: price-triggered or scheduled Bitcoin buys via Strike API or Bisq, stacked to cold storage
- Pay for compute/storage (Akash Network, Nodeless) per-minute in sats
- On-chain document timestamping via OpenTimestamps or OP_RETURN (proof of existence for files, contracts, notes)

### Autonomous Web Task Discovery (Phase 3 — Experimental)

The agent can be given a sat budget and a permission level, then autonomously scan approved platforms for safe, simple tasks that pay sats:

- Runs on a configurable schedule (e.g. every 6 hours)
- Uses web search and a headless browser (Playwright) to check known task platforms
- Scores each task: estimated time, sat reward, sat/hour rate, risk flags
- Presents a shortlist to the user for approval before acting (or auto-executes within pre-approved task types)
- Completes the task, submits work, collects Lightning payment
- Logs every task attempt — including failures — to the persistent task ledger with full detail

Task platforms scanned: Stacker News, Bitbounty.dev, Nostr bounties (NIP-99), LNbits bounty boards, select microtask/translation platforms.

**Safety constraints (hardcoded, not just prompted):**
- Never spend more than the user-defined daily budget on task attempts
- Only attempt tasks on the pre-approved platform whitelist
- Never create accounts, submit personal information, or agree to terms without user review
- Never attempt tasks involving financial/legal/medical advice or professional licensure
- All task attempts are logged and reversible — user can audit and cancel at any time
- Prefer tasks completable in under 10 minutes with deterministic Lightning invoice payment
- Pause and ask user for any task requiring >500 sats upfront with uncertain return

---

## Experimental / Forward-Looking

- **Agent-to-agent payments**: this app could act as a sat-earning node in a network of agents that pay each other for subtasks via Lightning as multi-agent frameworks mature
- **Sat/hour economics dashboard**: tracking actual earned sat/hour rates across task types over time
- **Privacy hardening**: Tor routing for all API calls, CoinJoin via Whirlpool (Sparrow-compatible), automatic UTXO consolidation at low-fee windows
- **Mobile companion**: a read-only iOS/Android app that mirrors balance and incoming transaction alerts from the desktop agent
- **PSBT collaboration**: multi-party PSBTs where the agent coordinates signing between multiple hardware devices (family or business multisig)
- **Export as living audit trail**: the export doc becomes a longitudinal record of an AI agent's economic activity over months or years — a novel artifact in itself

---

## Questions Asked & Answered

### Q: What are my cold storage preferences and how should the app accommodate them?
**A:** Strong preference for Sparrow Wallet and Blockstream Green workflows. The app accommodates this by operating in watch-only mode using an xpub import (the same xpub already in Sparrow), constructing all spends as unsigned PSBTs compatible with Sparrow's coin control, and supporting Blockstream Green's 2FA multisig model. The agent never holds or sees the private key — it lives on a Coldcard, Jade, or air-gapped machine.

### Q: What tasks could the agent perform using sats as payment / currency?
**A:** Two directions. (1) Funded tasks: DCA buys, paying Lightning APIs per-call, paying for cloud compute per-minute on Akash, timestamping documents on-chain via OpenTimestamps. (2) Earning tasks: serving paid API responses via L402, posting to Nostr and collecting zaps, earning Lightning routing fees, completing sat bounties on Stacker News and Bitbounty.

### Q: Could the agent scope the web for safe, simple tasks to earn sats autonomously?
**A:** Yes, theoretically — and practically for a narrow set of platforms that exist today. Stacker News, Bitbounty, and Nostr bounties (NIP-99) are openly structured, scrapeable, and pay via Lightning invoice. An agent with Playwright and web search could scan these, score tasks by effort/reward, and execute within a hardcoded whitelist and budget cap. The main real-world friction today is that most microtask platforms weren't built for agents (CAPTCHAs, account requirements, payout minimums). The workaround is maintaining pre-registered credentials in the macOS Keychain for approved platforms. Safety rules are enforced in code, not just the agent prompt.

### Q: Should the wallet receive from apps like Strike? How should transaction status work? What about address reuse and privacy?
**A:** Yes — Strike and any app that withdraws to a standard bech32 address works natively, no special integration needed. Bitcoin is Bitcoin. The agent generates a fresh address, shows it with a QR, user shares it with the Strike sender. For transaction status: every incoming and outgoing transaction has a live status the agent monitors — Pending (mempool, 0 conf), Confirming (1–5 conf), Confirmed (6+ conf), and a Suspicious flag for double-spend attempts or unusually delayed transactions. For outgoing PSBTs: status tracks from PSBT Built → Signed → Broadcast → Confirmed, with RBF bump option if stuck. Desktop notifications fire at key confirmation milestones. On privacy: fresh addresses are enforced automatically for every receive — never reused. UTXOs from exchanges like Strike are flagged as having a KYC trail and the agent warns before mixing them with non-KYC coins. Coin control suggestions are offered before every send with a plain-language privacy explanation. CoinJoin/Whirlpool integration is planned for Phase 3 to clean KYC-origin UTXOs before cold storage.

### Q: Should the app use a single agent or multiple agents? And should all data be exportable?
**A:** Single agent, confirmed. One persistent identity with continuous memory of all activity — not a pipeline of specialized sub-agents. The agent accumulates a full history over time: every transaction, task, conversation, label, and decision. All of this data is exportable on demand as Markdown, JSON, or PDF. Export includes: full transaction history with labels, complete task log with outcomes and sat/hour rates, all conversation history, UTXO register, earning and spending summaries by category, cold storage sweep log. Exports are local files only, never transmitted. Primary uses: personal accounting, tax records, audit trail, archiving, developer debugging, device migration.

### Q: Who created this project and what are the open source plans?
**A:** Andrew Brown is the sole creator and owner of Bitcoin Agent. He is also the sole creator and owner of Evapotrack (kept private in public-facing documentation). The entire project is being built using Claude Code on a 2025 MacBook Air. It is experimental and for personal use at this stage. The plan is to open-source it on GitHub under Andrew Brown's account under MIT license once it reaches a usable state (estimated after M4 or M5). Public documentation will credit Andrew Brown as sole creator and Claude Code / Anthropic as the build tool.

### Q: What are the exact limitations of the agent, and where is the reference for prompting tasks?
**A:** A dedicated file `AGENT_CAPABILITIES.md` has been created in the project folder. It documents every task the agent can perform, hard limitations enforced in code (not just prompt), example prompts for every sub-task, what the agent will refuse and why, and a full technical mapping table of user intent → tool → IPC handler → module. This file is written to be directly referenced by Claude Code during implementation.

### Q: Should the agent practice UTXO consolidation? How should privacy and security be handled?
**A:** Yes — the agent continuously monitors UTXO fragmentation and scores the wallet on fee drag and dust accumulation. Consolidation is proposed automatically but never executed without user approval and hardware signing. The critical privacy rule: UTXOs are only ever consolidated with others of the same privacy profile. KYC-origin UTXOs (from Strike, Coinbase, etc.) are batched separately from non-KYC UTXOs — mixing them in a single consolidation transaction would link identities on-chain. Consolidation PSBTs are only proposed during low-fee mempool windows (configurable threshold, default 5 sat/vB). Change from consolidation always goes to a fresh address. Output size targets avoid creating new dust (minimum ~100k sats output where possible).

### Q: Prompts should be prepared in order, detailed and specific, ready for Claude Code — where are they?
**A:** A dedicated file `CLAUDE_CODE_PROMPTS.md` has been created in the project folder. It contains one prompt per milestone, written in the exact format Claude Code expects — full context at the top of each session, specific file targets, acceptance criteria, and a handoff note for the next prompt. Prompts are ordered M1 through M10 and should be used sequentially, one per Claude Code session.

---

## Progress Log

| Date | Milestone | Status |
|---|---|---|
| Apr 1, 2026 | Initial project concept defined | Done |
| Apr 1, 2026 | Tech stack, structure, bootstrap commands documented | Done |
| Apr 1, 2026 | Cold storage architecture (3-layer PSBT model) defined | Done |
| Apr 1, 2026 | Agent economy (earn/spend/store) mapped | Done |
| Apr 1, 2026 | Autonomous task discovery concept scoped | Done |
| Apr 1, 2026 | Goals & Vision doc created | Done |
| Apr 1, 2026 | Single-agent identity decision locked | Done |
| Apr 1, 2026 | Full data export spec defined | Done |
| Apr 1, 2026 | Strike/exchange receive compatibility confirmed | Done |
| Apr 1, 2026 | Transaction verification status display spec defined | Done |
| Apr 1, 2026 | Auto address generation + privacy model defined | Done |
| Apr 1, 2026 | UTXO consolidation spec (privacy-aware, fee-timed) defined | Done |
| Apr 1, 2026 | Agent capabilities + limitations reference doc created | Done |
| Apr 1, 2026 | Project metadata doc created (creator, tools, open source plan) | Done |
| Apr 1, 2026 | All docs updated with creator info and dev environment | Done |
| Apr 1, 2026 | M1: Electron shell + xpub import + balance display | Done |
| Apr 1, 2026 | M2: PSBT builder + QR export + cold signing workflow + password lock | Done |
| Apr 1, 2026 | M3: Claude agent with wallet tool-use + chat interface | Done |
| Apr 1, 2026 | API credits documentation + cost/break-even analysis | Done |
| Apr 1, 2026 | Full project audit + security fixes | Done |
| Apr 1, 2026 | M4: Settings, API usage tracking, UTXO labeling, coin control | Done |
| Apr 1, 2026 | Recovery key system (create, view, password reset) | Done |
| Apr 1, 2026 | Packaged as macOS .app (double-click launch) | Done |
| Apr 1, 2026 | API key purchased and stored in Keychain | Done |
| — | M5: Hardware wallet integration (Coldcard QR, Jade USB) | Not started |
| — | M6: Lightning node (LDK) + NWC + auto-sweep | Not started |
| — | M7: L402 server + Nostr zaps | Not started |
| — | M8: Autonomous task discovery + execution | Not started |
| — | M9: Data export (Markdown / JSON / PDF) | Not started |
| — | M10: Tor routing + full privacy hardening | Not started |

---

## Key Design Decisions (Locked)

- **UTXO consolidation is privacy-partitioned**: KYC-origin and non-KYC UTXOs are NEVER consolidated in the same transaction. Two separate batches, always.
- **Consolidation only at low fees**: the agent queues consolidation proposals and waits for mempool conditions below the user-set threshold (default 5 sat/vB). Never consolidates at high fees.
- **Consolidation requires hardware signing**: like all spends, consolidation PSBTs are unsigned until the user signs on their Coldcard or Jade. The agent never consolidates autonomously.
- **Address reuse is forbidden**: the app enforces fresh address generation for every receive. No user override. Retiring used addresses from active display is automatic.
- **Privacy is a default, not a setting**: exchange-origin UTXO flagging, coin control suggestions, and address clustering warnings are always on. The user can ignore suggestions but the agent always surfaces them.
- **Transaction status is always live**: the agent polls mempool and chain continuously. Status is never stale. Notifications fire at 0, 1, and 6 confirmations.
- **Single agent**: one agent instance, one persistent identity, one continuous memory. Not a multi-agent system.
- **Watch-only only**: the app will never hold signing keys. Non-negotiable.
- **PSBT as the spending primitive**: all spends go through unsigned PSBT → hardware sign → broadcast. No exceptions.
- **Sparrow/Green compatible**: xpub import and PSBT format must stay compatible with both tools at all times.
- **Agent proposes, user approves**: for anything involving money movement, the agent prepares and presents — the human decides and signs. Autonomy is for earning and monitoring, not for spending user funds.
- **Task safety in code**: autonomous task rules (whitelist, budget cap, no personal data) enforced in application logic, not just the system prompt.
- **Full data ownership**: all data is local, all data is exportable, nothing is transmitted without user action.
- **Export is a first-class feature**: not an afterthought. The export doc is a living audit trail of the agent's entire economic life — transactions, tasks, conversations, decisions.
- **Claude API model**: `claude-sonnet-4-6` for the agent. Tool-use architecture — agent calls structured functions, never executes raw code or shell commands directly.
