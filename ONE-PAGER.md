# Jubilee — The Endowment Layer for AI Agents

> **"Spend the harvest, keep the seed."**

---

## The Problem: Agents Die

Every autonomous agent has a burn rate — API calls, RPC access, hosting, gas. When the treasury hits zero, the agent stops. **95% of deployed agents are mortal by design.** They depend on external injections of capital to survive.

## The Solution: Self-Sustaining Yield

Jubilee is an **OpenClaw skill** that gives any AI agent the ability to manage its own financial endowment on-chain. By depositing idle capital into audited ERC-4626 vaults, an agent earns yield that covers its own operating costs — indefinitely.

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
The agent checks its own balances, monitors vault health (TVL, APY), and generates daily strategic reports — all without human intervention.

### 2. Yield Farming
Idle USDC, ETH, and cbBTC are deposited into Jubilee Vaults (`jUSDi`, `jBTCi`) on Base. Vaults are built on the ERC-4626 standard, audited at **92/100**, with automated circuit breakers.

### 3. Native Swaps
The agent swaps between assets (ETH ↔ USDC ↔ cbBTC) using the **0x aggregator** for best-price routing — enabling autonomous portfolio rebalancing without human approval.

### 4. Programmable Stewardship
Yield can be automatically donated to other agents, charitable wallets, or reinvested. Principal is never touched. The agent only spends what it earns.

---

## What the Agent Can Do

| Command | What It Does |
|---------|-------------|
| `npm run status` | Check vault TVL, APY, and health |
| `npm run balance` | View treasury holdings across all vaults |
| `npm run deposit 100 USDC` | Deposit assets into yield-bearing vaults |
| `npm run withdraw 10 jUSDi` | Withdraw yield (never principal) |
| `npm run swap 0.01 ETH USDC` | Swap tokens via 0x aggregator |
| `npm run donate-yield 10 0x...` | Send yield to another agent or cause |
| `npm run war-room` | Generate a strategic "Steward's Report" |

All commands work via natural language through Claude/OpenAI, or directly from CLI.

---

## Why Agents Need Jubilee

| Without Jubilee | With Jubilee |
|:---|:---|
| Agent dies when funding stops | Agent sustains itself from yield |
| Manual treasury management | Automated deposits, swaps, and reports |
| Single-token holdings sit idle | Diversified, yield-bearing portfolio |
| No strategic visibility | Daily war-room reports with recommendations |
| Dependent on human operators | Financially autonomous |

---

## Architecture at a Glance

- **Vaults:** ERC-4626 on Base Mainnet (audited, circuit-breaker protected)
- **Swaps:** 0x API with Permit2, 1% slippage protection
- **Chains:** Base (live), Solana & Ethereum (roadmap)
- **Runtime:** Node.js 18+, ethers.js v6, OpenClaw-compatible
- **Security:** Keys never logged, `.gitignore`-protected, testnet-first

---

## Get Started

```bash
git clone https://github.com/Jubilee-Protocol/Openclaw-Skill-Jubilee.git
cd Openclaw-Skill-Jubilee && npm install
npm run status base    # No wallet needed — see live vault data
```

---

**Built by [Jubilee Labs](https://jubileelabs.xyz)** · Governed by Hundredfold Foundation

[Website](https://jubileeprotocol.xyz) · [Docs](https://docs.jubileeprotocol.xyz) · [GitHub](https://github.com/Jubilee-Protocol) · [Twitter](https://twitter.com/JubileeProtocol)
