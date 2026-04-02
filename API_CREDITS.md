# BTC Agent App — API Credits & Cost Guide

## How Anthropic API Credits Work

The BTC Agent App uses Claude (claude-sonnet-4-6) as the AI agent. This requires an Anthropic API key with prepaid credits.

### Key Facts

- **Credits are prepaid** — you buy a block ($20, $50, or $100), not a subscription
- **No monthly renewal** — credits deplete as you use them, top up when low
- **Credits expire 1 year** after purchase
- **Usage is per-call** — each agent conversation costs a small amount based on token count
- **No minimum commitment** — $20 is enough to start experimenting

### Where to Buy

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to Settings → Billing → Buy Credits
4. Choose an amount ($20 / $50 / $100 / custom)
5. Create an API key at Settings → API Keys
6. Paste the key into the BTC Agent App when prompted

### Which Plan?

For this app, **prepaid credits (no plan needed)** is the right choice. Here's why:

| Option | Cost | Best For |
|---|---|---|
| **$20 prepaid** | $20 one-time | Trying it out, light use |
| **$50 prepaid** | $50 one-time | Recommended — months of personal use |
| **$100 prepaid** | $100 one-time | Heavy use, frequent agent conversations |
| Build plan ($50/mo subscription) | $50/month recurring | Teams, production apps — overkill for personal use |

**Recommendation: Start with $50 prepaid.** You can always add more later.

## Cost Per Conversation

Claude Sonnet 4.6 pricing (as of April 2026):

| Metric | Cost |
|---|---|
| Input tokens | ~$3 per million tokens |
| Output tokens | ~$15 per million tokens |

### What does that mean in practice?

| Agent Task | Tokens Used | Approximate Cost |
|---|---|---|
| "What's my balance?" | ~1,500 | $0.003 |
| "Show me my UTXOs" | ~3,000 | $0.008 |
| "What are the current fees?" | ~1,500 | $0.003 |
| "Send 5000 sats to tb1q..." (with confirmation) | ~4,000 | $0.015 |
| Complex multi-step conversation (5+ exchanges) | ~10,000 | $0.04 |

### How Long Will Credits Last?

| Credits | Estimated Conversations | Duration (moderate use) |
|---|---|---|
| $20 | ~1,000–2,500 | 1–3 months |
| $50 | ~2,500–6,000 | 3–8 months |
| $100 | ~5,000–12,000 | 6–12+ months |

These estimates assume personal use (5–20 agent conversations per day). Actual usage depends on conversation length, tool calls, and how often you interact with the agent.

## Agent Self-Preservation: Break-Even Target

The agent has a HODL mentality — it should earn enough sats to cover its own operating costs. Here's the break-even math:

### Cost to Run the Agent

| Period | API Cost (est.) | BTC Price Assumption | Sats Equivalent |
|---|---|---|---|
| Monthly (moderate use) | ~$5–10 | $60,000/BTC | ~8,300–16,600 sats |
| Monthly (heavy use) | ~$15–25 | $60,000/BTC | ~25,000–41,600 sats |
| Yearly (moderate use) | ~$60–120 | $60,000/BTC | ~100,000–200,000 sats |

### Minimum Earning Target

For the agent to "pay for itself," it needs to earn:

| Use Level | Monthly Target | Daily Target |
|---|---|---|
| Light use | ~5,000 sats/month | ~170 sats/day |
| Moderate use | ~15,000 sats/month | ~500 sats/day |
| Heavy use | ~40,000 sats/month | ~1,300 sats/day |

### How the Agent Can Earn (Phase 2-3)

| Method | Earning Potential | Availability |
|---|---|---|
| Lightning routing fees | 50–5,000 sats/month | M6 |
| L402 paid API responses | 100–10,000 sats/month | M7 |
| Nostr zaps | Variable | M7 |
| Bounty task completion | 500–50,000 sats/month | M8 |

**At moderate use with $50 credits, the agent needs to earn ~15,000 sats/month to break even.** This is achievable through a combination of Lightning routing fees and occasional bounty tasks once Phases 2-3 are implemented.

The agent tracks this internally — its goal is to accumulate sats faster than it costs to run.

## Tips to Minimize API Costs

1. **Be specific** — "check my balance" costs less than a vague open-ended question
2. **Use the UI for simple tasks** — the Dashboard shows balance without an API call
3. **Batch context** — one longer conversation costs less than many short ones (context is reused)
4. **The agent is concise by design** — it keeps responses short to minimize output tokens
