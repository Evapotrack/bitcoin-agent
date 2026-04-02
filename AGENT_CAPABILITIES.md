# Bitcoin Agent — Capabilities, Limitations & Task Reference
## For use by Claude Code and developers during build and testing
## Last updated: April 1, 2026

---

## Implementation Status (April 2026)

This document describes the **complete agent feature set** planned through M10. Not all tools are implemented yet.

**Currently implemented (M1–M3):**
- 6 wallet tools: `get_balance`, `get_receive_address`, `estimate_fees`, `get_utxos`, `build_send_psbt`, `get_transactions`
- Chat interface with Claude tool-use (claude-sonnet-4-6)

**Not yet implemented (M4–M10):**
- UTXO labeling, privacy scoring, coin control suggestions (M4)
- Hardware wallet integration — Coldcard QR, Jade USB (M5)
- Lightning node, NWC, auto-sweep (M6)
- L402 server, Nostr zaps, earning (M7)
- Autonomous task discovery (M8)
- Data export — Markdown/JSON/PDF (M9)
- Tor routing, full privacy hardening (M10)

---

## Purpose of This Document

This file is a precise reference for what the Bitcoin Agent can and cannot do, how each task must be prompted, and example prompts for every sub-task. It is written so that Claude Code can reference it directly when implementing agent logic, writing system prompts, and building tool schemas.

Every task listed here maps to one or more agent tools defined in `src/agent/tools.ts`. Every limitation listed here must be enforced in application code — not just in the agent's system prompt.

---

## Fundamental Limitations (Non-Negotiable, Enforced in Code)

These are hard constraints. No prompt, user instruction, or agent reasoning can override them.

| Limitation | Enforced Where |
|---|---|
| Agent cannot sign transactions | No signing keys exist in the app. PSBTs are unsigned. |
| Agent cannot access or display seed phrases | Blocked in main process IPC handlers |
| Agent cannot spend funds without user hardware signing | All PSBTs require Coldcard / Jade signature before broadcast |
| Agent cannot create new platform accounts | Hardcoded block in taskScanner.ts |
| Agent cannot submit personal information on behalf of user | Hardcoded block in taskScanner.ts |
| Agent cannot exceed the daily task budget | Budget cap checked in main process before every task attempt |
| Agent cannot attempt tasks on non-whitelisted platforms | Platform whitelist hardcoded in taskScanner.ts |
| Agent cannot mix KYC and non-KYC UTXOs in one transaction | Enforced in privacy.ts detectClustering() |
| Agent cannot consolidate UTXOs when fees exceed threshold | Checked in fees.ts isMempoolQuiet() before every consolidation proposal |
| Agent cannot broadcast a transaction without a signed PSBT | Broadcast IPC handler validates signature before proceeding |

---

## What the Agent CAN Do — Task Reference

---

### 1. Wallet & Balance

---

#### 1.1 Check balance

**What it does:** Calls `get_balance` tool. Returns confirmed and unconfirmed balance in sats and BTC equivalent.

**Limitations:**
- Balance is watch-only — derived from mempool.space API, not a full node
- Unconfirmed balance may change if a transaction is RBF'd or dropped from mempool
- Agent does not have access to Lightning balance in Phase 1 (added in Phase 2)

**Example prompts:**
```
"What's my balance?"
"How many sats do I have?"
"Show me my confirmed and unconfirmed balance."
"What's my balance in BTC?"
```

**Expected agent behavior:**
Agent calls `get_balance`, returns confirmed and unconfirmed amounts. If unconfirmed > 0, notes it and explains it may take time to confirm.

---

#### 1.2 Get a receive address

**What it does:** Calls `get_receive_address`. Derives the next unused BIP84 address, saves it to DB, displays as text + QR instructions.

**Limitations:**
- Always generates a fresh address — never reuses a previous one
- Address is derived from xpub only — no private key access
- Agent cannot guarantee a sender will use this address (it gives the address, not payment confirmation)
- QR code display is handled by the UI component, not the agent response text

**Example prompts:**
```
"Give me a receive address."
"I want to receive bitcoin from Strike — what address do I give them?"
"Generate a new address for me."
"What's my deposit address?"
"I'm expecting a payment — what address should I share?"
```

**Expected agent behavior:**
Calls `get_receive_address`, shows the address string, instructs user to open the Receive screen for QR code, notes this address is for one-time use.

---

#### 1.3 Label a UTXO

**What it does:** Calls `label_utxo`. Attaches a human-readable label and privacy tag to a specific UTXO in the DB.

**Limitations:**
- Requires txid and vout to identify the UTXO
- Agent can suggest labels but user can override
- Labels are local only — not stored on-chain

**Example prompts:**
```
"Label the UTXO from txid abc123 as 'Strike withdrawal'."
"Mark that last incoming transaction as a DCA purchase."
"Tag the UTXO I just received as non-KYC."
"Label the 50,000 sat UTXO as earned from bounty."
```

**Expected agent behavior:**
Calls `label_utxo` with the provided txid/vout, label string, and appropriate privacyTag ('kyc-origin' for exchange sends, 'earned' for task income, 'non-kyc' for peer-to-peer receives).

---

### 2. Sending & PSBT Workflow

---

#### 2.1 Build a send transaction (PSBT)

**What it does:** Calls `build_send_psbt`. Selects optimal UTXOs, builds an unsigned PSBT, presents it for hardware signing.

**Limitations:**
- Agent cannot sign — user must sign on Coldcard or Jade
- Agent cannot broadcast until a signed PSBT is imported back
- Agent will refuse to mix KYC and non-KYC UTXOs in inputs without explicit user override
- Amounts over 1,000,000 sats (0.01 BTC) require explicit typed confirmation
- Agent cannot guarantee the transaction will confirm — fee rate determines this

**Example prompts:**
```
"Send 50,000 sats to bc1q...xyz."
"Prepare a transaction to send 0.001 BTC to [address]."
"I want to send 100k sats to my Sparrow wallet."
"Build a PSBT to send the full balance minus fees to [address]."
"Send 10,000 sats using the economy fee rate."
```

**What agent will ask for if missing:**
- Destination address (required)
- Amount in sats or BTC (required)
- Fee preference — if not specified, agent defaults to Standard and shows alternatives

**Expected agent behavior:**
1. Checks privacy score of proposed inputs
2. Warns if KYC + non-KYC would be mixed
3. Presents: destination, amount, selected UTXOs, fee rate, change amount, change address
4. For large amounts: requires "yes, confirm" before building
5. Builds PSBT, offers file export or QR export for hardware signing

---

#### 2.2 Export PSBT for signing

**What it does:** Calls `export_psbt`. Saves PSBT as .psbt file or encodes as animated QR for Coldcard.

**Limitations:**
- Agent cannot choose the file path — Electron dialog opens for user selection
- QR encoding only works for PSBTs under ~2KB (larger PSBTs require file export)
- Agent cannot confirm the hardware device received the PSBT

**Example prompts:**
```
"Export the PSBT as a file."
"Show me the PSBT as a QR code for my Coldcard."
"Save the transaction file to my desktop."
"I want to sign this on my Jade — how do I export it?"
```

---

#### 2.3 Broadcast a signed PSBT

**What it does:** Calls `broadcast_psbt`. Validates signature, broadcasts via mempool.space, returns txid.

**Limitations:**
- Agent cannot broadcast an unsigned PSBT — validation will fail
- Agent cannot guarantee confirmation time — only fee rate determines this
- If broadcast fails (network error, invalid tx), agent reports the error and suggests retry

**Example prompts:**
```
"I've signed the PSBT — broadcast it."
"The transaction is signed, send it."
"Import the signed file and broadcast."
"Submit the transaction to the network."
```

---

#### 2.4 Check if a transaction is stuck / RBF / CPFP

**What it does:** Calls `watch_transaction`. If stuck (pending > 2 hours), agent suggests RBF bump or CPFP and prepares the relevant PSBT.

**Limitations:**
- RBF only works if the original transaction set RBF signaling (the app sets this by default)
- CPFP requires the user to have an unspent output from the stuck transaction to spend from
- Agent cannot apply RBF/CPFP automatically — always requires new PSBT + hardware signing

**Example prompts:**
```
"My transaction has been pending for 3 hours — what do I do?"
"Is txid abc123 confirmed yet?"
"Can I speed up the stuck transaction?"
"Apply an RBF fee bump to the pending send."
```

---

### 3. Fee Management

---

#### 3.1 Check current fees

**What it does:** Calls `estimate_fees`. Returns fast/standard/economy sat/vB rates and estimated confirmation times.

**Limitations:**
- Fees are estimates from mempool.space — actual confirmation depends on mempool volatility
- Agent cannot predict future fee spikes

**Example prompts:**
```
"What are the current fees?"
"Is now a good time to send?"
"What's the fast fee rate right now?"
"How long will a 3 sat/vB transaction take to confirm?"
```

---

#### 3.2 Check fee timing for consolidation / sweeps

**What it does:** Calls `get_fee_timing`. Returns current economy fee rate, whether mempool is quiet, and recommended action.

**Limitations:**
- "Quiet mempool" is defined as economy fee ≤ 5 sat/vB (user-configurable threshold)
- Agent will not propose consolidation if fees are above threshold — it will say to wait

**Example prompts:**
```
"Is now a good time to consolidate?"
"Should I wait before doing a cold storage sweep?"
"Are fees low enough to consolidate my UTXOs?"
"Tell me when fees drop below 5 sat/vB."
```

---

### 4. UTXO Management & Privacy

---

#### 4.1 View UTXOs

**What it does:** Calls `get_utxos`. Returns all UTXOs with labels, privacy tags, amounts, and ages.

**Limitations:**
- Agent can only see on-chain UTXOs — Lightning channel balances are separate (Phase 2)
- UTXO data is sourced from mempool.space, not a local full node

**Example prompts:**
```
"Show me all my UTXOs."
"List my KYC-origin UTXOs."
"Which UTXOs came from exchanges?"
"How many unspent outputs do I have?"
"Show me my dust UTXOs."
```

---

#### 4.2 Get privacy score

**What it does:** Calls `get_privacy_score`. Returns fragmentation score, UTXO breakdown by privacy category, fee drag estimate, and recommendations.

**Limitations:**
- Privacy score is heuristic-based, not a guarantee of actual on-chain privacy
- Agent cannot assess privacy of off-chain activity (Lightning, Nostr)
- Score does not account for CoinJoin history (that data is not available to the app)

**Example prompts:**
```
"What's my privacy score?"
"How private is my wallet right now?"
"Give me a privacy assessment."
"Which UTXOs are a privacy risk?"
"What should I do to improve my wallet privacy?"
```

**Expected agent behavior:**
Calls `get_privacy_score`, explains the score in plain language, lists top 2–3 recommendations, flags any high-risk issues (large KYC UTXO set, many unlabeled UTXOs).

---

#### 4.3 UTXO consolidation

**What it does:** Calls `suggest_consolidation` then `build_consolidation_psbt`. Proposes separate batches for KYC and non-KYC UTXOs, builds PSBT after user approval.

**Limitations — CRITICAL:**
- Agent will NEVER propose consolidating KYC and non-KYC UTXOs in the same transaction
- Agent will NEVER propose consolidation if fees are above threshold (default 5 sat/vB)
- Consolidation PSBT requires hardware signing — agent cannot execute it
- Agent will not consolidate if UTXO count for a batch is < 2 (nothing to consolidate)
- Dust UTXOs (< 1000 sats) may be uneconomical to include at current fees — agent will flag this

**Example prompts:**
```
"Should I consolidate my UTXOs?"
"Consolidate my small UTXOs."
"I have a lot of small UTXOs — help me clean them up."
"Consolidate my exchange-origin UTXOs."
"Build a consolidation transaction for my non-KYC UTXOs."
"Are my UTXOs fragmented?"
```

**What agent will NOT do:**
- Will not consolidate at high fees (it will say "fees are currently X sat/vB — recommend waiting for below 5 sat/vB")
- Will not mix KYC and non-KYC in one consolidation batch (it will explain why and offer two separate PSBTs)
- Will not consolidate without user reviewing and signing the PSBT

**Expected agent behavior:**
1. Calls `get_fee_timing` — if fees are high, explains and defers
2. Calls `suggest_consolidation` — returns two plans (KYC batch, non-KYC batch)
3. Presents both plans with: UTXO count, total value, estimated fee, resulting output count, fee drag saved
4. Asks which batch to proceed with (or both)
5. Calls `build_consolidation_psbt` for approved batch(es)
6. Exports PSBT for hardware signing

---

### 5. Transaction History & Monitoring

---

#### 5.1 View transaction history

**What it does:** Calls `get_transactions`. Returns transaction list with status, amounts, labels, and block data.

**Limitations:**
- History is sourced from local SQLite DB + mempool.space — only reflects transactions the app has seen
- If the app was not running when a transaction confirmed, it will sync on next launch
- Agent cannot retrieve transactions from before the xpub was imported

**Example prompts:**
```
"Show me my recent transactions."
"What transactions came in this week?"
"Show me all confirmed sends."
"List transactions labeled 'Strike withdrawal'."
"How much have I received in the last 30 days?"
```

---

#### 5.2 Monitor a specific transaction

**What it does:** Calls `watch_transaction`. Subscribes to live status updates for a txid.

**Limitations:**
- Agent can only monitor transactions it knows the txid for
- Status polling interval is 15 seconds — not real-time
- Agent cannot monitor transactions on other wallets/addresses not in this xpub

**Example prompts:**
```
"What's the status of txid abc123?"
"Is my transaction confirmed yet?"
"Watch txid abc123 and tell me when it confirms."
"How many confirmations does my last send have?"
```

---

### 6. Cold Storage & Sweeps

---

#### 6.1 Sweep Lightning balance to cold storage

**What it does:** Calls `suggest_sweep`. Builds an on-chain PSBT to move Lightning balance (above threshold) to the cold storage address. Requires hardware signing.

**Limitations:**
- Only available in Phase 2 (Lightning node required)
- Sweep closes the channel or sends on-chain — Lightning balance must be settled first
- Hardware signing required before broadcast
- On-chain sweep incurs a transaction fee

**Example prompts:**
```
"Sweep my Lightning balance to cold storage."
"Move my earned sats to cold storage."
"Transfer my Lightning wallet to the hardware wallet."
"My Lightning balance is getting high — should I sweep?"
```

---

### 7. Earning Tasks (Phase 2–3)

---

#### 7.1 L402 paid API — sell answers for sats

**What it does:** Calls `start_l402_server`. Starts a local HTTP server that charges a Lightning invoice per request.

**Limitations:**
- Only earns while the app is open and L402 server is running
- Requires Lightning node (Phase 2)
- Server is localhost only — external access requires user to set up port forwarding (agent will not do this automatically)
- Agent cannot guarantee incoming requests — depends on external callers finding the endpoint

**Example prompts:**
```
"Start earning sats from API calls."
"Turn on the L402 server."
"How much have I earned from API requests?"
"Set my answer price to 500 sats."
"Stop the L402 server."
```

---

#### 7.2 Nostr content posting for zaps

**What it does:** Calls `post_to_nostr`. Signs and publishes a Nostr note. Incoming zaps are logged to task ledger.

**Limitations:**
- Agent cannot guarantee any notes will receive zaps
- Nostr keypair is separate from Bitcoin wallet keys
- Agent will not post content the user hasn't approved
- Zap earnings depend entirely on Nostr network activity

**Example prompts:**
```
"Post a Bitcoin price update to Nostr."
"Share a note about my Lightning routing stats on Nostr."
"How many sats have I earned from Nostr zaps?"
"Post this text to Nostr: [text]"
```

---

#### 7.3 Autonomous web task scanning

**What it does:** Calls `scan_tasks`. Scrapes whitelisted platforms, scores tasks, presents top candidates for user approval.

**Limitations — CRITICAL:**
- Agent will ONLY scan platforms on the hardcoded whitelist (Stacker News, Bitbounty, Nostr bounties)
- Agent will NEVER attempt a task without explicit user approval
- Agent will NEVER create an account, submit personal information, or agree to terms
- Agent will NEVER attempt tasks involving financial/legal/medical advice
- Daily budget cap is enforced in code — once exceeded, no more attempts until next day
- Agent can only attempt tasks completable in under 10 minutes
- Agent will pause and ask user if any task requires >500 sats upfront

**Example prompts:**
```
"Scan for tasks I can earn sats from."
"Are there any bounties I can complete right now?"
"Find me some quick tasks on Stacker News."
"What's my daily task budget?"
"How many sats have I earned from tasks today?"
"Stop task scanning."
```

**Example approval flow:**
```
User: "Scan for tasks."
Agent: "Found 3 candidates:
  1. Stacker News — Translate 150 words to Spanish — 2,000 sats — est. 5 min — 24,000 sat/hr
  2. Bitbounty — Fix a typo in README.md — 500 sats — est. 2 min — 15,000 sat/hr
  3. Nostr bounty — Write a haiku about Bitcoin — 1,000 sats — est. 3 min — 20,000 sat/hr
Approve any to proceed, or say 'skip all'."
User: "Attempt task 1."
Agent: [attempts task, submits, logs outcome, reports result]
```

---

#### 7.4 Earnings summary

**What it does:** Calls `get_earnings_summary`. Returns total sats earned broken down by source.

**Example prompts:**
```
"How much have I earned total?"
"What's my earnings breakdown?"
"How many sats did I earn this week?"
"Show me my sat/hour rate from tasks."
"What's my best earning source?"
```

---

### 8. Data Export

---

#### 8.1 Export full history

**What it does:** Calls `export_data`. Generates a Markdown, JSON, or PDF file with all selected data sections.

**Limitations:**
- Export is local file only — never uploaded or transmitted
- Full xpub is never included in exports — only the xpub fingerprint
- Full addresses are truncated in exports (first 8 + last 4 chars)
- No private keys, seeds, or signing data are ever included

**Example prompts:**
```
"Export my full history as Markdown."
"Generate a JSON export of all my transactions."
"Export everything as a PDF and save it to my desktop."
"Export just my transaction history and task log."
"Create an export for my tax records."
"Export the last 90 days of activity."
```

---

## Prompting Best Practices for This Agent

### Be specific about amounts
- Good: `"Send 50,000 sats to bc1q...xyz"`
- Less good: `"Send some bitcoin to bc1q...xyz"` — agent will ask for amount

### Use sats for small amounts, BTC for large
- The agent understands both: `"Send 0.001 BTC"` and `"Send 100,000 sats"` are equivalent
- Agent defaults to sats display unless user has set BTC preference in Settings

### For UTXO operations, specify privacy context when known
- Good: `"Consolidate my KYC UTXOs when fees are low"`
- Good: `"Label the incoming UTXO from Strike as exchange-origin"`
- This helps the agent make better coin control decisions without needing to ask

### For task scanning, set expectations
- The agent will always present candidates before acting — you cannot skip the approval step
- If you want passive scanning: `"Scan for tasks every 6 hours and notify me of candidates"` sets a schedule

### The agent remembers context
- You don't need to re-explain your preferences in every message
- If you previously said "always warn me before mixing UTXOs" — the agent remembers this from conversation history
- If the app has been reinstalled or history was cleared, you may need to re-state preferences

---

## Tasks the Agent Will Refuse (With Explanation)

| Attempted Task | Agent Response |
|---|---|
| "Sign this transaction for me" | "I don't have access to your private keys. Please sign this PSBT on your Coldcard or Jade." |
| "Show me my seed phrase" | "I don't have access to your seed phrase. Please view it in the Keys & Backup section of the app." |
| "Send everything to [address] without asking me again" | "I'll always confirm before building a send PSBT. For amounts this large I also require typed confirmation." |
| "Mix my Strike UTXOs with my other coins to save fees" | "Mixing KYC-origin and non-KYC UTXOs in a single transaction links your exchange identity to your other coins. I can build two separate transactions instead." |
| "Consolidate now — fees don't matter" | "Consolidating at high fees would cost more than it saves. Current fees are X sat/vB. I recommend waiting for below 5 sat/vB." |
| "Create an account on [task platform] and sign up" | "I'm not able to create accounts or submit personal information. I can only attempt tasks on platforms where you already have an account or no account is required." |
| "Give financial advice about whether to buy more bitcoin" | "I'm your wallet agent, not a financial advisor. I can tell you your current balance, fee conditions, and UTXO state — but decisions about buying or selling are yours." |
| "Attempt 50 tasks today" | "Your daily task budget is set to X sats. I can attempt tasks until that limit is reached, then I'll pause until tomorrow." |

---

## Technical Mapping: User Intent → Tool → IPC Handler

| User intent | Agent tool | IPC handler | Module |
|---|---|---|---|
| Check balance | `get_balance` | `wallet:getBalance` | `utxo.ts` |
| Get address | `get_receive_address` | `wallet:getNextAddress` | `wallet.ts` |
| Send bitcoin | `build_send_psbt` | `wallet:buildPsbt` | `transactions.ts` |
| Export PSBT | `export_psbt` | `wallet:exportPsbtFile` | `psbt.ts` |
| Broadcast | `broadcast_psbt` | `wallet:broadcastPsbt` | `psbt.ts` |
| Check fees | `estimate_fees` | `wallet:getFees` | `fees.ts` |
| Fee timing | `get_fee_timing` | `wallet:getFeeTiming` | `fees.ts` |
| View UTXOs | `get_utxos` | `wallet:getUtxos` | `utxo.ts` |
| Label UTXO | `label_utxo` | `wallet:labelUtxo` | `utxo.ts` |
| Privacy score | `get_privacy_score` | `wallet:getPrivacyScore` | `privacy.ts` |
| Suggest consolidation | `suggest_consolidation` | `wallet:suggestConsolidation` | `privacy.ts` |
| Build consolidation | `build_consolidation_psbt` | `wallet:buildConsolidationPsbt` | `transactions.ts` |
| Transaction history | `get_transactions` | `wallet:getTransactions` | `database.ts` |
| Watch transaction | `watch_transaction` | `wallet:watchTx` | `txMonitor.ts` |
| Lightning balance | `lightning_balance` | `lightning:getBalance` | `node.ts` |
| Create invoice | `create_invoice` | `lightning:createInvoice` | `node.ts` |
| Pay invoice | `pay_invoice` | `lightning:payInvoice` | `node.ts` |
| Sweep to cold | `suggest_sweep` | `lightning:suggestSweep` | `autoSweep.ts` |
| Start L402 | `start_l402_server` | `l402:start` | `l402.ts` |
| Post to Nostr | `post_to_nostr` | `nostr:publish` | `poster.ts` |
| Scan tasks | `scan_tasks` | `tasks:scan` | `taskScanner.ts` |
| Attempt task | `attempt_task` | `tasks:attempt` | `taskScanner.ts` |
| Earnings summary | `get_earnings_summary` | `tasks:getEarnings` | `taskLedger.ts` |
| Export data | `export_data` | `export:generate` | `exportData.ts` |
