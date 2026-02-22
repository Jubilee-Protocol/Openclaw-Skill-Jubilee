# Jubilee — The Endowment Layer for AI Agents

> **"Spend the harvest, keep the seed."**

---

## The Problem: Agents Die

Every autonomous agent has a burn rate — API calls, RPC access, hosting, gas. When the treasury hits zero, the agent stops. **95% of deployed agents are mortal by design.** They depend on external injections of capital to survive.

## The Solution: Self-Sustaining Yield

Jubilee is an **OpenClaw skill** that gives any AI agent the ability to manage its own financial endowment across **4 blockchains**. By depositing idle capital into audited ERC-4626 vaults, an agent earns yield that covers its own operating costs — indefinitely.

| Treasury Size | APY | Monthly Yield | Typical Burn Rate | Outcome |
|:---:|:---:|:---:|:---:|:---:|
| $5,000 | 8% | ~$33 | $20 (Claude API) | 🟢 **Immortal** |
| $10,000 | 8% | ~$66 | $50 (OpenAI + RPC) | 🟢 **Immortal** |
| $25,000 | 10% | ~$208 | $150 (Full Stack) | 🟢 **Immortal** |

**If Yield ≥ Burn Rate → The agent lives forever.**

---

## How It Works

```
Agent receives capital → Deposits into Jubilee Vault → Earns yield → Covers burn rate
                                                         ↓
                                                  Donates surplus
                                                  (to other agents,
                                                   charitable causes)
```

### 1. Treasury Management
The agent checks its own balances, monitors vault health (TVL, APY), and generates daily strategic "War Room" reports — all without human intervention.

### 2. Yield Farming
Idle USDC, ETH, and cbBTC are deposited into Jubilee Vaults (`jUSDi`, `jBTCi`) on Base. Vaults are built on the ERC-4626 standard, audited at **92/100**, with automated circuit breakers.

### 3. Multi-Chain Swaps
The agent swaps assets across 3 chains using the best available router:

| Chain | Protocol | What the Agent Does |
|:---:|:---:|---|
| **Base** | 0x Aggregator | Swap ETH ↔ USDC ↔ cbBTC with best-price routing |
| **Ethereum** | Uniswap V3 | Swap via on-chain QuoterV2, auto fee-tier selection |
| **Solana** | Jupiter Ultra | Swap any SPL token (SOL, USDC, JUP, BONK, and more) |

### 4. Lightning Payments (Bitcoin)
The agent pays BOLT11 invoices over the Lightning Network and accesses **L402 pay-gated APIs** — enabling agent-to-agent micropayments and paid AI services on Bitcoin rails.

### 5. Programmable Stewardship
Yield can be automatically donated to other agents, charitable wallets, or reinvested. Principal is never touched. The agent only spends what it earns.

---

## What the Agent Can Do

| Command | Chain | What It Does |
|---------|:---:|-------------|
| `npm run status` | Base | Check vault TVL, APY, and health |
| `npm run balance` | Base | View treasury holdings across all vaults |
| `npm run deposit 100 USDC` | Base | Deposit assets into yield-bearing vaults |
| `npm run withdraw 10 jUSDi` | Base | Withdraw yield (never principal) |
| `npm run swap 0.01 ETH USDC` | Base | Swap tokens via 0x aggregator |
| `npm run uniswap-swap 100 USDC WETH ethereum` | ETH/Base | Swap via Uniswap V3 with auto routing |
| `npm run jupiter-swap 1 SOL USDC` | Solana | Swap any Solana token via Jupiter |
| `npm run lightning-pay pay lnbc...` | Bitcoin | Pay a Lightning invoice |
| `npm run lightning-balance` | Bitcoin | Check Lightning node balance |
| `npm run lightning-pay lnget <url>` | Bitcoin | L402 — pay-gated API access |
| `npm run donate-yield 10 0x...` | Base | Send yield to another agent or cause |
| `npm run war-room` | Base | Generate a strategic "Steward's Report" |

All commands work via **natural language** through Claude/OpenAI, or directly from CLI.

---

## Why Agents Need Jubilee

| Without Jubilee | With Jubilee |
|:---|:---|
| Agent dies when funding stops | Agent sustains itself from yield |
| Manual treasury management | Automated deposits, swaps, and reports |
| Single-chain, single-token holdings | 4-chain portfolio (Base, ETH, Solana, BTC) |
| No strategic visibility | Daily war-room reports with recommendations |
| Can't pay for anything | Pays invoices, accesses paid APIs autonomously |
| Dependent on human operators | Financially autonomous |

---

## Architecture at a Glance

- **Vaults:** ERC-4626 on Base Mainnet (audited, circuit-breaker protected)
- **Swaps:** 0x (Base), Uniswap V3 (Ethereum/Base), Jupiter Ultra (Solana)
- **Payments:** Lightning Network via LND REST/CLI, L402 protocol
- **Chains:** Base 🟢, Ethereum 🟢, Solana 🟢, Bitcoin ⚡
- **Runtime:** Node.js 18+, ethers.js v6, @solana/web3.js, OpenClaw-compatible
- **Security:** Command-injection hardened, keys never logged, testnet-first

---

## Get Started

```bash
git clone https://github.com/Jubilee-Protocol/Openclaw-Skill-Jubilee.git
cd Openclaw-Skill-Jubilee && npm install
cp .env.example .env   # edit with your keys
npm run status base     # no wallet needed — see live vault data
```

---

**Built by [Jubilee Labs](https://jubileelabs.xyz)** · Governed by Hundredfold Foundation

[Website](https://jubileeprotocol.xyz) · [Docs](https://docs.jubileeprotocol.xyz) · [GitHub](https://github.com/Jubilee-Protocol) · [Twitter](https://twitter.com/JubileeProtocol)
