# Jubilee OpenClaw Skill 🏛️

[![Jubilee Protocol](https://img.shields.io/badge/Jubilee-Protocol-pink)](https://jubileeprotocol.xyz)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Base](https://img.shields.io/badge/Base-Mainnet-green)](https://basescan.org)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-purple)](https://github.com/openclaw/openclaw)
[![Donate Crypto](https://img.shields.io/badge/Donate-Crypto-f7931a?logo=bitcoin&logoColor=white)](https://commerce.coinbase.com/checkout/122a2979-e559-44b9-bb9d-2ff0c6a3025b)

> **"Nasdaq meets Sistine Chapel."**  
> The financial operating system for stewardship-aligned AI agents.

---

## Quick Start (3 commands)

```bash
git clone https://github.com/Jubilee-Protocol/openclaw-skill-jubilee.git jubilee
cd jubilee && npm install
cp .env.example .env  # then edit .env with your keys
```

That's it. **No other dependencies required.** Read-only commands (`status`, `balance`, `war-room`) work immediately with zero configuration. Write operations (swap, deposit, withdraw) require a wallet and API keys — see [Configuration](#configuration) below.

> **Do I need OpenClaw?** No. Jubilee is a **standalone Node.js project**. Every command runs via `npm run <command>` from the terminal. Any AI agent that can execute shell commands (Claude Code, Cursor, Windsurf, Dexter, etc.) can use it today — just point the agent at `SKILL.md` and it discovers all tools automatically.
>
> **Want to use OpenClaw?** Optional. If you're already in the OpenClaw ecosystem, clone Jubilee into `~/.openclaw/workspace/skills/jubilee` and OpenClaw will auto-discover it. But it's a convenience, not a requirement.

---

## What Is This?

Jubilee is a **self-contained financial toolkit** for AI agents that gives them the ability to manage a treasury across **4 chains**:

| Chain | Protocol | What the Agent Can Do | Required Config |
|-------|----------|----------------------|-----------------|
| **Base** | 0x + Uniswap | Swap, deposit, withdraw, earn yield | EVM wallet |
| **Ethereum** | Uniswap V3 | Swap tokens | EVM wallet |
| **Solana** | Jupiter Ultra | Swap any SPL token | Solana wallet + Jupiter API key |
| **Bitcoin** | Lightning (LND) | Pay invoices, L402 API payments | Running LND node |

### The Core Idea

Agents have burn rates (API costs, hosting, gas). Jubilee lets agents deposit idle capital into **yield-bearing vaults** so they can fund themselves from yield instead of depleting principal.

> **If Yield ≥ Burn Rate → Agent Lives Forever**

| Principal | APY | Monthly Yield | Typical Burn Rate | Status |
|-----------|-----|---------------|-------------------|--------|
| $5,000 USDC | 8% | ~$33/mo | $20/mo | 🟢 **IMMORTAL** |
| $10,000 USDC | 8% | ~$66/mo | $50/mo | 🟢 **IMMORTAL** |
| $25,000 USDC | 10% | ~$208/mo | $150/mo | 🟢 **IMMORTAL** |

---

## Configuration

### Minimal Setup (Base only — most users start here)

Create a `.env` file with just **2 lines** to start:

```bash
WALLET_PATH=~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json
DEFAULT_CHAIN=base
```

Create the wallet file at that path:
```json
{ "privateKey": "0xYOUR_PRIVATE_KEY_HERE" }
```

> **⚠️ Never commit wallet files to git.** They are auto-excluded via `.gitignore`.

### Add More Chains (copy only what you need)

<details>
<summary><strong>🦄 Uniswap (Ethereum)</strong> — works immediately, no API key needed</summary>

```bash
# Add to .env — uses free public RPC by default
RPC_ETHEREUM=https://eth.llamarpc.com
```
Uses the same EVM wallet as Base. No extra setup.
</details>

<details>
<summary><strong>🪐 Jupiter (Solana)</strong> — requires free API key</summary>

1. Get a free API key at [portal.jup.ag](https://portal.jup.ag)
2. Add to `.env`:
```bash
JUPITER_API_KEY=your_key_here
SOLANA_WALLET_PATH=~/.config/solana/id.json
```
3. If you don't have a Solana wallet yet:
```bash
solana-keygen new
```
</details>

<details>
<summary><strong>⚡ Lightning (Bitcoin)</strong> — requires running LND node</summary>

1. Set up LND: [Lightning Agent Tools](https://github.com/lightninglabs/lightning-agent-tools)
2. Add to `.env`:
```bash
LND_REST_HOST=https://localhost:8080
LND_MACAROON_PATH=~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon
LND_TLS_CERT_PATH=~/.lnd/tls.cert
```
3. Optional — install `lnget` for L402 payments:
```bash
go install github.com/lightninglabs/lightning-agent-tools/cmd/lnget@latest
```
</details>

<details>
<summary><strong>🔑 Optional API Keys</strong> — improve rate limits</summary>

```bash
# 0x Swap API (Base swaps) — free at https://0x.org
ZERO_EX_API_KEY=your_key_here

# Custom RPC endpoints (replace public defaults)
RPC_BASE=https://your-rpc.example.com
RPC_BASE_SEPOLIA=https://sepolia.base.org
```
</details>

### Fund Your Agent

| Network | What to Send | Where to Get Test Funds |
|---------|-------------|------------------------|
| **Base / Ethereum** | ETH (for gas) + USDC/USDT | [Superchain Faucet](https://www.alchemy.com/faucets/base-sepolia), [Circle Faucet](https://faucet.circle.com/) |
| **Solana** | SOL (for fees) | [Solana Faucet](https://faucet.solana.com/) |
| **Lightning** | Fund channels via your LND node | N/A (mainnet only) |

---

## How Agents Interface With This Skill

### For AI Agents (Claude Code, OpenClaw, Dexter, etc.)

The skill is designed for **zero-friction agent integration**:

1. **`SKILL.md`** — The agent reads this file to discover all available tools, their exact CLI syntax, when to use each one, and error handling patterns. This is the prompt engineering layer.

2. **Natural language → CLI** — The agent translates user intent into the correct `npm run` command:

| What You Say | What the Agent Runs |
|-------------|-------------------|
| "Check our treasury" | `npm run status` |
| "What's our balance?" | `npm run balance` |
| "Deposit 100 USDC" | `npm run deposit 100 USDC base` |
| "Swap 0.01 ETH to USDC" | `npm run swap 0.01 ETH USDC` |
| "Swap 100 USDC to WETH on Uniswap" | `npm run uniswap-swap 100 USDC WETH ethereum` |
| "Swap 1 SOL to USDC" | `npm run jupiter-swap 1 SOL USDC` |
| "Pay this Lightning invoice" | `npm run lightning-pay pay lnbc...` |
| "Check Lightning balance" | `npm run lightning-balance` |
| "Run the war room" | `npm run war-room` |
| "Donate 10 USDC to 0x..." | `npm run donate-yield 10 0x...` |

3. **Structured output** — Every command outputs chalk-formatted results with clear success/failure indicators (`✓`, `✗`, `❌`) that agents parse reliably.

4. **Graceful degradation** — If a chain isn't configured (no wallet, no API key, no LND node), commands print a helpful setup message instead of crashing. Agents can detect this and either skip that chain or ask the user to configure it.

### For Humans (CLI)

Every tool works directly from the terminal:

```bash
# ── Treasury ──────────────────────────────────
npm run status [chain]              # Vault health (TVL, APY)
npm run balance [chain]             # Your portfolio
npm run war-room [chain]            # Strategic report

# ── Deposit & Withdraw ────────────────────────
npm run deposit <amount> <asset> [chain]
npm run withdraw <amount> <vault> [chain]

# ── Swap (pick your chain) ────────────────────
npm run swap <amt> <from> <to> [chain]           # 0x (Base)
npm run uniswap-swap <amt> <from> <to> [chain]   # Uniswap (ETH/Base)
npm run jupiter-swap <amt> <from> <to>            # Jupiter (Solana)

# ── Lightning (Bitcoin) ──────────────────────
npm run lightning-pay pay <invoice> [max_sats]    # Pay invoice
npm run lightning-balance                         # Node balance
npm run lightning-pay decode <invoice>            # Decode invoice
npm run lightning-pay lnget <url> [max_sats]      # L402 request

# ── Giving ────────────────────────────────────
npm run donate-yield <amount> <address> [chain]
```

Every command shows **usage help** if run without arguments — try `npm run uniswap-swap` or `npm run jupiter-swap` to see examples.

---

## Directory Structure

```
jubilee-openclaw-skill/
├── SKILL.md               ← Agent reads this to discover tools
├── config.js              ← Contract addresses, ABIs, protocol configs
├── .env.example           ← Copy to .env and fill in your keys
├── lib/
│   ├── status.js          # npm run status
│   ├── balance.js         # npm run balance
│   ├── deposit.js         # npm run deposit
│   ├── withdraw.js        # npm run withdraw
│   ├── swap.js            # npm run swap (0x, Base)
│   ├── uniswap-swap.js    # npm run uniswap-swap (Ethereum/Base)
│   ├── jupiter-swap.js    # npm run jupiter-swap (Solana)
│   ├── lightning-pay.js   # npm run lightning-pay (Bitcoin)
│   ├── donate.js          # npm run donate-yield
│   ├── war-room.js        # npm run war-room
│   ├── utils.js           # Wallet loading, providers, formatting
│   └── validators.js      # Input validation
├── test/
│   └── integration.test.js
├── package.json
└── LICENSE
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

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Wallet file not found` | Create wallet at the path in your `.env`, or set `WALLET_PATH` |
| `Insufficient funds for gas` | Send ETH to your agent address (0.01 ETH minimum) |
| `RPC connection failed` | Set a custom `RPC_BASE=https://...` in `.env` |
| `JUPITER_API_KEY is required` | Get a free key at [portal.jup.ag](https://portal.jup.ag) |
| `Lightning node not detected` | Set `LND_REST_HOST` + `LND_MACAROON_PATH` in `.env`, or install `lncli` |
| `Transaction would likely fail` | Check balance (`npm run balance`) and vault status (`npm run status`) |
| `Invalid input` errors | Amounts must be positive numbers; addresses must be valid (0x... or base58) |

**Debug mode** — add `DEBUG=true` to `.env` for verbose logging.

---

## Testing

```bash
npm test                        # Run integration tests
npm run status baseSepolia      # Check testnet connection
npm run balance baseSepolia     # View testnet balance
```

---

## Security

### Smart Contract Security
- **92/100 audit score** on all core contracts
- **ERC-4626 standard** — battle-tested vault pattern
- **No bridge risk** — independent vault instances per chain
- **Circuit breakers** — auto-pause on detected exploits

### Wallet Security

| Use Case | Recommendation |
|----------|---------------|
| **Testing / Learning** | Plaintext key in JSON (current default) ✅ |
| **Small treasury (<$1K)** | Plaintext key in JSON ✅ |
| **Production (>$10K)** | Encrypted keystore, AWS KMS, or MPC ⚠️ |
| **Institutional** | Hardware wallet + multi-sig 🔒 |

### Reporting Vulnerabilities

Email **security@jubileeprotocol.xyz** — do not open public issues.

---

## Roadmap

- [x] Base mainnet support (jUSDi, jBTCi)
- [x] Treasury management (balance, status, deposit, withdraw)
- [x] War room strategic reports & yield donation
- [x] DEX swaps via 0x API (Base)
- [x] Uniswap V3 swaps (Ethereum & Base)
- [x] Jupiter Ultra swaps (Solana)
- [x] Lightning Network payments (Bitcoin)
- [ ] Solana mainnet support (jSOLi)
- [ ] Ethereum mainnet support (jETHs)
- [ ] Automated yield harvesting (cron)
- [ ] Multi-signature support
- [ ] Advanced analytics dashboard

## Contributing

1. Fork → branch → test on testnet → PR
2. See [INSTALL.md](INSTALL.md) for development setup

## Support

- 🌐 [jubileeprotocol.xyz](https://jubileeprotocol.xyz)
- 📖 [docs.jubileeprotocol.xyz](https://docs.jubileeprotocol.xyz)
- 🐦 [@JubileeProtocol](https://twitter.com/JubileeProtocol)
- 🐛 [GitHub Issues](https://github.com/Jubilee-Protocol/openclaw-skill-jubilee/issues)

## License

MIT — see [LICENSE](LICENSE).

## Built By

**[Jubilee Labs](https://jubileelabs.xyz)** — Building the Liberty Layer  
Governed by Hundredfold Foundation

---

*All glory to Jesus • Building for generations*

> **"Spend the harvest, keep the seed."**  
> — Proverbs 27:13
