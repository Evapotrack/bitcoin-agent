# Bitcoin Agent — Lightning Routing & Liquidity Earning

## Overview

The agent can earn sats by operating as a Lightning routing node. When other nodes send payments through your channels, you collect routing fees. This is a passive income stream that compounds over time.

## How It Works

1. The agent runs an embedded LDK (Lightning Dev Kit) node — no external daemon needed
2. You open channels to well-connected nodes on the Lightning Network
3. When payments route through your channels, you earn a fee (1-100+ ppm per routed sat)
4. The agent manages channel balancing, fee policies, and liquidity allocation
5. Earnings above a threshold are auto-swept to cold storage via unsigned PSBT

## What the Agent Does

| Task | Description |
|---|---|
| Open channels | Select peers based on network graph centrality and uptime |
| Set fee policy | Adjust base fee and fee rate (ppm) per channel based on demand |
| Rebalance channels | Move liquidity between channels to maintain routing capacity |
| Monitor flow | Track which channels route the most and adjust accordingly |
| Sweep earnings | Build cold storage PSBTs when Lightning balance exceeds threshold |
| Report earnings | Show routing fee income by channel, day, week, month |

## Capital Requirements

- **Minimum useful**: ~500,000 sats (~$200-500 USD depending on price) in channels
- **Effective routing**: 2,000,000+ sats across 5-10 well-chosen channels
- **Key insight**: You need both inbound AND outbound liquidity. Opening a channel gives you outbound. Getting inbound requires others to open channels to you, or using liquidity services.

## Earning Potential (Realistic)

| Capital Deployed | Monthly Estimate | Notes |
|---|---|---|
| 500k sats | 50-500 sats | Minimal routing, learning phase |
| 2M sats | 500-5,000 sats | Moderate routing with good peers |
| 10M sats | 5,000-50,000 sats | Active management, good graph position |

These are rough estimates. Actual earnings depend heavily on channel partner selection, fee policy, and network position. This is not passive income in the traditional sense — it requires active liquidity management, which is exactly what the agent automates.

## Implications & Trade-offs

### Benefits
- **Passive earning**: Once channels are open and balanced, fees accrue automatically
- **Network contribution**: Routing nodes strengthen the Lightning Network
- **Agent-native task**: Liquidity management is repetitive and data-driven — ideal for an AI agent
- **Compounds with other earning**: Routing fees + L402 API income + Nostr zaps all flow to the same Lightning wallet

### Risks
- **Capital lockup**: Sats in channels are not immediately spendable on-chain
- **Force-close risk**: If a channel partner goes offline, funds can be locked for days (CSV timelock)
- **Fee competition**: Other routing nodes may undercut your fees
- **Rebalancing cost**: Circular rebalancing incurs fees that can exceed routing income if poorly managed
- **Watchtower dependency**: If the app is offline when a counterparty broadcasts an old state, you could lose channel funds (mitigated by running a watchtower)

### Privacy Considerations
- Your node's public key is visible on the Lightning Network graph
- Channel opens/closes are on-chain transactions linked to your xpub
- Routing data reveals payment flow patterns (mitigated by Tor in M10)

## Implementation (M6)

- **LDK via `@lightningdevkit/ldk-node`**: Embedded node, no external LND/CLN daemon
- **Nostr Wallet Connect (NWC)**: Agent controls the Lightning wallet via open protocol
- **Auto-sweep**: Configurable threshold (e.g., 500k sats) triggers cold storage PSBT
- **Fee policy engine**: Agent adjusts fees based on channel utilization and network conditions
- **Channel scoring**: Agent scores potential peers by uptime, capacity, centrality, and fee competitiveness

## What the Agent Will NOT Do

- Open channels without user approval (proposes, user confirms)
- Risk more capital than the user-defined channel budget
- Run the node when the app is closed (LDK requires the process to be running)
- Store channel state in the cloud — all data is local SQLite
