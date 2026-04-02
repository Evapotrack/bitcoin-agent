# Bitcoin Agent — Project Metadata & Developer Information
## Last updated: April 1, 2026

---

## Project Identity

**Project name:** Bitcoin Agent
**Repository name (planned):** `bitcoin-agent` (public, on GitHub under Andrew Brown's account)
**License (planned):** MIT
**Status:** Experimental — sole developer, local development only
**Purpose:** Personal use, learning, and open-source contribution to the Bitcoin + AI agent ecosystem

---

## Creator & Owner

**Developer:** Andrew Brown
**Role:** Sole creator, sole developer, sole owner
**Also creator and owner of:** Evapotrack — a separate, independent project (details kept private per Andrew's preference; public association is at Andrew's discretion)

**Public attribution for this project:**
- Andrew Brown will be credited as the sole creator of Bitcoin Agent in all documentation, the README, and the GitHub repository
- The connection to Evapotrack is noted here for internal reference only and should not be referenced in any public-facing documentation, README, or GitHub content unless Andrew explicitly requests it

---

## Development Environment

**Machine:** 2025 MacBook Air (Apple Silicon — M4)
**Operating System:** macOS Sequoia (or later)
**Primary build tool:** Claude Code (Anthropic) — all code is written and iterated using Claude Code as the AI coding assistant
**Development context:** Sole developer, experimental, not production-deployed at this stage

---

## Tools Required — Full Setup List

This is the complete list of tools needed to build and run this project from scratch on the 2025 MacBook Air. Items marked ✅ should already be present on a standard macOS developer setup. Items marked 🔧 need to be installed.

### Core Runtime

| Tool | Version | Status | Install |
|---|---|---|---|
| Node.js | 20 LTS or higher | 🔧 | `brew install node` or via nvm |
| npm | bundled with Node | 🔧 | comes with Node.js |
| nvm (Node Version Manager) | latest | 🔧 recommended | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh \| bash` |

### Package Manager & Build Tools

| Tool | Version | Status | Install |
|---|---|---|---|
| Homebrew | latest | 🔧 if not installed | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| Git | 2.x+ | ✅ (macOS ships with it) | `brew install git` for latest |
| TypeScript | 5.x (installed via npm) | 🔧 | `npm install -g typescript` |
| ts-node | latest | 🔧 | `npm install -g ts-node` |

### Electron & App Framework

| Tool | Purpose | Install via |
|---|---|---|
| Electron | Desktop app shell | `npm install` (in project) |
| electron-forge | Packaging + distribution | `npm install` (in project) |
| webpack | Bundler for React renderer | `npm install` (in project) |

### Bitcoin Libraries (all via npm in project)

| Library | Purpose |
|---|---|
| `bitcoinjs-lib` | Core Bitcoin: addresses, PSBTs, scripts |
| `bip32` | HD wallet key derivation |
| `bip39` | Mnemonic seed phrase generation |
| `tiny-secp256k1` | Elliptic curve operations (WASM) |
| `ecpair` | Key pair management |

### Storage & State

| Library | Purpose |
|---|---|
| `keytar` | macOS Keychain integration for secrets |
| `better-sqlite3` | Local SQLite database |
| `zustand` | React state management |

### UI

| Library | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `tailwindcss` | Utility CSS |
| `qrcode.react` | QR code display |
| `@types/react` etc. | TypeScript types |

### Networking & APIs

| Library | Purpose |
|---|---|
| `axios` | HTTP requests (mempool.space, CoinGecko) |
| `socks-proxy-agent` | Tor SOCKS5 proxy routing (M10) |

### AI Agent

| Tool | Purpose | Notes |
|---|---|---|
| `@anthropic-ai/sdk` | Claude API client | Requires ANTHROPIC_API_KEY stored in Keychain |
| Claude Code | AI coding assistant for development | Anthropic desktop app — used to build this entire project |
| Claude model | `claude-sonnet-4-6` | Used as the agent runtime model |

### Lightning (Phase 2)

| Library | Purpose |
|---|---|
| `@lightningdevkit/ldk-node` | Embedded Lightning node |
| `nostr-tools` | Nostr protocol (NWC, posting, zaps) |

### Task Discovery (Phase 3)

| Tool | Purpose | Install |
|---|---|---|
| Playwright | Headless browser for web scraping | `npm install playwright` then `npx playwright install chromium` |

### Hardware Wallet (Phase 5)

| Library | Purpose |
|---|---|
| `@ngraveio/bc-ur` | UR encoding for Coldcard QR PSBTs |
| `node-hid` | USB HID interface for Jade |
| `noble` | Bluetooth for Jade (if needed) |

### Privacy / Networking (Phase 10)

| Tool | Purpose | Install |
|---|---|---|
| Tor | Privacy routing for all API calls | `brew install tor` |
| `socks-proxy-agent` | Routes axios through Tor SOCKS5 | `npm install` (in project) |

### Development & Testing

| Tool | Purpose | Install |
|---|---|---|
| VS Code | Code editor (optional — Claude Code is primary) | Download from code.visualstudio.com |
| Xcode Command Line Tools | Required for native Node modules (keytar, better-sqlite3) | `xcode-select --install` |
| `electron-devtools-installer` | React DevTools in Electron | `npm install` (in project, dev) |

---

## One-Time Setup Commands (Run in Order on Fresh MacBook Air)

```bash
# 1. Install Xcode CLI tools (required for native modules)
xcode-select --install

# 2. Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Install nvm, then Node.js 20 LTS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20

# 4. Install global TypeScript tools
npm install -g typescript ts-node

# 5. Install Git (get latest)
brew install git

# 6. Install Tor (for Phase 10)
brew install tor

# 7. Verify Claude Code is installed
# Download from: https://claude.ai/download (desktop app)
# Claude Code is accessed via the Claude desktop app — no separate install needed

# 8. Clone or create the project
# Option A: start fresh with Claude Code (recommended)
# Open Claude Code → paste M1 prompt from CLAUDE_CODE_PROMPTS.md

# Option B: if repo exists on GitHub
git clone https://github.com/[andrew-username]/bitcoin-agent.git
cd bitcoin-agent
npm install
npx playwright install chromium
```

---

## Claude Code — How This Project Is Built

This entire project is being built using **Claude Code**, Anthropic's agentic coding tool. Claude Code operates as a terminal-based AI assistant that can read files, write code, run commands, and iterate on the codebase directly.

**Workflow:**
1. Open Claude Code in the `bitcoin-agent-project` folder on the Desktop
2. Paste the relevant milestone prompt from `CLAUDE_CODE_PROMPTS.md`
3. Claude Code writes code, installs packages, and runs tests
4. Developer reviews output, provides feedback, and Claude Code iterates
5. When acceptance criteria are all met, milestone is marked done and progress log updated
6. Paste the next milestone prompt

**Claude Code does:**
- Write all TypeScript/React/Electron code
- Install npm packages
- Run `tsc --noEmit` to check types
- Debug errors and iterate
- Suggest architecture decisions when specifications are ambiguous

**Developer does:**
- Review and approve code before milestone close
- Physically sign PSBTs on hardware device for testing
- Make final decisions on any spec ambiguity
- Update the goals and progress docs after each milestone
- Manage GitHub repository and commits

---

## GitHub & Open Source Plans

**Planned repository:** `https://github.com/[andrew-username]/bitcoin-agent`
**License:** MIT
**Open source timeline:** After the project reaches a usable state (estimated after M4 or M5), the repository will be made public

**What will be public:**
- All source code
- README with setup instructions
- This documentation folder (GOALS_AND_VISION.md, PROJECT_PLAN.md, AGENT_CAPABILITIES.md, CLAUDE_CODE_PROMPTS.md)
- MIT license

**What will NOT be public:**
- Any API keys or credentials (these are in macOS Keychain, never in code)
- Any personal wallet data, addresses, or transaction history
- Evapotrack project details or any cross-project business information

**README will credit:**
- Andrew Brown as sole creator
- Claude Code / Anthropic as the AI coding tool used to build it
- All open source libraries used (bitcoinjs-lib, LDK, etc.)

---

## Project Scope Reminder

This project is:
- **Experimental** — built to learn and explore, not as a commercial product at this stage
- **Sole developer** — Andrew Brown is the only developer; no team, no contributors yet
- **macOS only** — built and tested on the 2025 MacBook Air; no cross-platform support planned in early milestones
- **Self-custody focused** — designed for users who already understand Bitcoin basics and want a smarter interface for their cold storage workflow
- **Eventually open source** — the codebase will be shared publicly, with the goal of contributing to the Bitcoin + AI agent ecosystem

---

## Notes for Claude Code Sessions

When starting a Claude Code session for this project, Claude Code should be aware:
- The developer is working alone on a MacBook Air — no CI/CD, no remote server, no Docker
- Native Node modules (keytar, better-sqlite3, node-hid) require Xcode CLI tools to compile on Apple Silicon — if a build fails for one of these, the fix is usually `xcode-select --install` or `npm rebuild`
- The app targets macOS only — no need for Windows or Linux compatibility shims
- Testnet is the default network during all development — mainnet is only enabled in M10
- All secrets go in macOS Keychain via keytar — never in `.env` files, never committed to git
- The `.gitignore` must exclude: `node_modules/`, `dist/`, `.env`, `*.sqlite`, `userData/`
