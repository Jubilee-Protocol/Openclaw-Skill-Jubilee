# Jubilee OpenClaw Skill 🏛️

[![Jubilee Protocol](https://img.shields.io/badge/Jubilee-Protocol-pink)](https://jubileeprotocol.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Base](https://img.shields.io/badge/Base-Mainnet-green)](https://basescan.org)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-purple)](https://github.com/openclaw/openclaw)

> **"Nasdaq meets Sistine Chapel."**  
> The operating system for stewardship-aligned AI agents.

## Overview

**Jubilee** is a skill for [OpenClaw](https://github.com/openclaw/openclaw) that enables AI agents to natively interact with the **Jubilee Protocol**. It transforms an agent from a simple chatbot into a **Steward** capable of managing a treasury, earning yield, and making strategic decisions based on Kingdom principles.

### The Problem: Agent Mortality

Autonomous agents have **burn rates** — API costs (Claude, OpenAI), RPC access, hosting fees, gas. When the balance hits zero, the agent dies.

### The Solution: Endowment-as-a-Service

| Principal | APY | Monthly Yield | Agent Burn Rate | Status |
|-----------|-----|---------------|----------------|--------|
| $5,000 USDC | 8% | ~$33/mo | $20/mo (Claude API) | 🟢 **IMMORTAL** |
| $10,000 USDC | 8% | ~$66/mo | $50/mo (OpenAI + RPC) | 🟢 **IMMORTAL** |
| $25,000 USDC | 10% | ~$208/mo | $150/mo (Full Stack) | 🟢 **IMMORTAL** |

> **If Yield ≥ Burn Rate → Agent Lives Forever**

## Features

- 🏦 **Treasury Management** — View balances across chains (Base, Solana, Ethereum) and manage yield-bearing assets
- 🌾 **Yield Farming** — Deposit idle capital into Jubilee Vaults (jBTCi, jUSDi, jETHs, jSOLi) to earn sustainable yield
- ⚔️ **War Room** — Generate daily "Steward's Reports" analyzing git activity, treasury health, and strategic priorities
- 🤲 **First Fruits** — Programmable stewardship logic to donate yield to charitable causes or other agents
- 🔗 **Multi-Chain** — Supports Base (mainnet), Solana (devnet), Ethereum (testnet)

## Quick Start

### Installation

#### Option A: OpenClaw Manual Install

1. Navigate to your OpenClaw skills directory:
```bash
cd ~/.openclaw/workspace/skills
```

2. Clone this repository:
```bash
git clone https://github.com/Jubilee-Protocol/openclaw-skill-jubilee.git jubilee
```

3. Install dependencies:
```bash
cd jubilee && npm install
```

4. Configure environment (see [Configuration](#configuration) below)

#### Option B: Jubilee Agent (Pre-installed)

If you're using the official `jubilee-agent` repository, this skill is included by default.

## Configuration

### 1. Environment Variables

Create a `.env` file in the skill root:
```bash
# RPC Providers (Optional - defaults to public endpoints)
RPC_BASE=https://mainnet.base.org
RPC_SOLANA=https://api.mainnet-beta.solana.com

# Protocol Addresses (Optional - defaults to official mainnet)
# These are pre-configured in config.js

# Wallet (Managed by OpenClaw)
# Ensure ~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json exists
WALLET_PATH=/path/to/custom/wallet.json

# Default chain for operations
DEFAULT_CHAIN=base

# Debug mode (verbose logging)
DEBUG=false
```

### 2. Wallet Setup

The skill expects a wallet file in OpenClaw's standard location:
```
~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json
```

**Wallet Format:**
```json
{
  "privateKey": "0xYOUR_PRIVATE_KEY_HERE"
}
```

**Security:** Never commit this file to version control!

### 3. Fund Your Agent

#### Testnet (Recommended for testing)
1. Get Base Sepolia ETH: [Superchain Faucet](https://www.alchemy.com/faucets/base-sepolia)
2. Get testnet USDC: [Circle Faucet](https://faucet.circle.com/)

#### Mainnet (Production)
1. Send ETH to agent address (for gas)
2. Send USDC/USDT to agent address (for deposits)

## Usage

### Natural Language (via Claude/Agent)

You can ask your agent to perform these tasks naturally:

- **"Check our treasury status"** → Runs: `npm run status`
- **"Run the morning war room report"** → Runs: `npm run war-room`
- **"Deposit 100 USDC into the vault"** → Runs: `npm run deposit 100 USDC`
- **"What's our current balance?"** → Runs: `npm run balance`
- **"Donate 10 USDC to [address]"** → Runs: `npm run donate-yield 10 0x...`

### Direct CLI Usage
```bash
# Check vault stats (TVL, APY)
npm run status [chain]

# View treasury balance
npm run balance [chain]

# Deposit assets
npm run deposit <amount> <asset> [chain]
# Example: npm run deposit 100 USDC base

# Withdraw assets
npm run withdraw <amount> <vault> [chain]
# Example: npm run withdraw 50 jUSDi base

# Donate yield
npm run donate-yield <amount> <recipient_address> [chain]
# Example: npm run donate-yield 10 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Generate war room report
npm run war-room [chain]
```

## Directory Structure
```
jubilee-openclaw-skill/
├── lib/                        # Core implementation
│   ├── utils.js               # Wallet & provider utilities
│   ├── validators.js          # Input validation
│   ├── status.js              # Vault status checker
│   ├── balance.js             # Treasury balance viewer
│   ├── deposit.js             # Deposit handler
│   ├── withdraw.js            # Withdrawal handler
│   ├── donate.js              # Yield donation handler
│   └── war-room.js            # Strategic report generator
├── test/                       # Integration tests
│   └── integration.test.js
├── config.js                   # Contract addresses & ABIs
├── package.json                # Dependencies & scripts
├── SKILL.md                    # Prompt engineering layer (for AI)
├── README.md                   # This file (for humans)
├── INSTALL.md                  # Step-by-step setup guide
├── PROJECT_SUMMARY.md          # Technical overview
├── .env.example               # Environment template
└── LICENSE                     # MIT License
```

## Contract Addresses

### Base Mainnet 🟢 LIVE

| Contract | Address |
|----------|---------|
| **jUSDi Vault** | [`0x26c39532C0dD06C0c4EddAeE36979626b16c77aC`](https://basescan.org/address/0x26c39532C0dD06C0c4EddAeE36979626b16c77aC) |
| **jBTCi Vault** | [`0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337`](https://basescan.org/address/0x8a4C0254258F0D3dB7Bc5C5A43825Bb4EfC81337) |

### Solana Devnet

| Contract | Address |
|----------|---------|
| **jSOLi Vault** | `Es3R4iMtdc3yHyKj9WxuK9imtSkDRw17816pRSbeVHsp` |

Full deployment details: [Jubilee Protocol Docs](https://docs.jubileeprotocol.xyz)

## Testing

### Run Integration Tests
```bash
npm test
```

Tests include:
- ✅ Vault connection & status retrieval
- ✅ Balance calculations & formatting
- ✅ Error handling for edge cases
- ✅ RPC connectivity

**Note:** Deposit/withdrawal tests run on testnets only to avoid real fund usage.

### Manual Testing Flow

1. **Start with testnet:**
```bash
npm run status baseSepolia
```

2. **Check your balance:**
```bash
npm run balance baseSepolia
```

3. **Test a deposit (testnet):**
```bash
npm run deposit 10 USDC baseSepolia
```

4. **Verify new balance:**
```bash
npm run balance baseSepolia
```

5. **Test withdrawal:**
```bash
npm run withdraw 5 jUSDi baseSepolia
```

6. **Generate war room report:**
```bash
npm run war-room baseSepolia
```

## Error Handling & Troubleshooting

### Common Issues

#### 1. "Invalid input" errors
**Solution:** The skill validates all inputs. Check:
- Amounts must be positive numbers
- Addresses must be valid Ethereum addresses (0x...)
- Chain names must be: `base`, `baseSepolia`, `solana`, etc.

#### 2. "Wallet file not found"
**Solution:** Create wallet at `~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json`

#### 3. "Insufficient funds for gas"
**Solution:** Fund wallet with ETH (0.01 ETH minimum recommended)

#### 4. "RPC connection failed"
**Solution:** Configure custom RPC in `.env`:
```bash
RPC_BASE=https://your-custom-rpc-url
```

#### 5. "Transaction would likely fail"
**Solution:** Check:
- Asset balance (via `npm run balance`)
- Token approval status
- Vault health (via `npm run status`)

### Debug Mode

Enable verbose logging:
```bash
DEBUG=true npm run balance
```

## Stewardship Principles

This skill embodies "Nasdaq meets Sistine Chapel":

1. **Capital Preservation** — Never withdraw principal, only yield
2. **Sustainable Yield** — Build endowments that last 100+ years
3. **Mission Alignment** — Direct yield toward Kingdom purposes
4. **Transparency** — All transactions on-chain and auditable
5. **Humility** — Technology serves people, not the reverse

## Security

Security is the cornerstone of the Jubilee Protocol. Our approach is multi-layered, combining battle-tested code, rigorous auditing, and economic incentives to protect user funds.

### Smart Contract Security

- **Audits**: All core contracts have achieved a **92/100 audit score** and have undergone comprehensive testing, including stress tests and fuzz testing. We are committed to continuous audits for all new products and major upgrades.
- **Inherited Security**: By deploying on established L2s like Base and zkSync, Jubilee inherits the security of their underlying infrastructure, which has been battle-tested with billions of dollars in value.
- **Elimination of Bridge Risk**: By design, the protocol does not operate its own cross-chain asset bridge. Vaults on different chains are independent instances, which completely removes the risk of a native bridge exploit, a common and catastrophic failure point in DeFi.
- **ERC-4626 Standard**: By building on a widely adopted standard, we reduce smart contract risk and benefit from the extensive auditing and community review of the standard itself.
- **Circuit Breakers**: Automated safety mechanisms are built into each vault to pause operations in the event of extreme market volatility or detected exploits.

### Operational Security

- ✅ Private keys never exposed in logs or error messages
- ✅ Wallet files automatically excluded via `.gitignore`
- ✅ Environment variables for all sensitive configuration
- ✅ Testnet-first development flow
- ✅ Input validation on all user inputs
- ✅ Gas estimation before transaction submission

### ⚠️ Wallet Security Notice

**Current Implementation: Development Mode**

This skill currently uses plaintext private keys stored in JSON files for ease of development and testing. This approach is:

**✅ Acceptable for:**
- Testing on testnets (Base Sepolia, Solana Devnet)
- Development and learning environments
- Low-value agents with treasuries under $1,000
- Personal experimental projects

**❌ NOT acceptable for:**
- Production agents managing treasuries over $10,000
- Institutional or organizational use
- Multi-user or shared environments
- Unattended agents with significant holdings

### Production Security Recommendations

For production deployments with meaningful capital:

1. **Use encrypted JSON keystores** with strong passwords stored in secure vaults
2. **Store wallet files in encrypted storage** (e.g., AWS KMS, HashiCorp Vault)
3. **Implement hardware wallet integration** for high-value signing operations
4. **Use MPC/Fireblocks** for institutional-grade custody solutions
5. **Enable multi-signature requirements** for large transactions
6. **Implement transaction limits** and approval workflows
7. **Set up monitoring and alerting** for suspicious activity

### Security Roadmap

| Timeline | Feature | Status |
|----------|---------|--------|
| **Q2 2026** | Encrypted JSON wallet support with password protection | 🔄 In Progress |
| **Q3 2026** | Hardware wallet integration (Ledger, Trezor) | 📋 Planned |
| **Q4 2026** | MPC custody integration (Fireblocks) | 📋 Planned |
| **2027** | Multi-signature transaction support | 📋 Backlog |

### Compliance

- **FASB ASU 2023-08**: User-facing dashboards provide necessary reporting tools for institutions to comply with FASB accounting standards for crypto assets.
- **Audit Trail**: All transactions are permanently recorded on-chain and can be exported for compliance purposes.

### Reporting Security Issues

If you discover a security vulnerability, please email: **security@jubileeprotocol.xyz**

**Do NOT** open a public GitHub issue. We take all security reports seriously and will respond within 24 hours.

---

## Roadmap

- [x] Base mainnet support (jUSDi, jBTCi)
- [x] Balance & status checking
- [x] Deposit & withdrawal flows
- [x] War room strategic reports
- [x] Yield donation
- [x] Input validation & error handling
- [ ] Solana mainnet support (jSOLi)
- [ ] Ethereum mainnet support (jETHs)
- [ ] Automated yield harvesting (cron)
- [ ] Multi-signature support
- [ ] Advanced analytics dashboard

## Contributing

We welcome contributions from stewardship-aligned builders!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Test thoroughly on testnet
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Support

- 🌐 **Website:** [jubileeprotocol.xyz](https://jubileeprotocol.xyz)
- 📧 **Email:** contact@jubileeprotocol.xyz
- 🐦 **Twitter:** [@JubileeProtocol](https://twitter.com/JubileeProtocol)
- 📖 **Docs:** [docs.jubileeprotocol.xyz](https://docs.jubileeprotocol.xyz)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Jubilee-Protocol/openclaw-skill-jubilee/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Built By

**[Jubilee Labs](https://jubileelabs.xyz)** — Building the Liberty Layer  
Governed by Hundredfold Foundation

---

*All glory to Jesus • Building for generations*

> **"Spend the harvest, keep the seed."**  
> — Proverbs 27:13
