# Skill: Jubilee Protocol (Treasury Management)

## Description
**Jubilee** is the financial operating system for stewardship-aligned AI agents. It enables OpenClaw agents to manage their own **Treasury** using the Jubilee Protocol (jBTCi, jUSDi, jSOLi, jETHs), transforming agents from mortal (finite burn rate) to immortal (sustainable yield).

## Core Function: Treasury Management
Agents deposit idle capital into Jubilee Vaults to earn yield, track performance, and programmably donate yield to other agents or humans while keeping principal intact.

### Philosophy
> **"Spend the harvest, keep the seed."**

If `Yield ≥ Burn Rate → Agent Lives Forever`

## Supported Networks & Assets
- **Base (Mainnet):** `jBTCi`, `jUSDi` ✅ LIVE — swaps via 0x & Uniswap
- **Ethereum (Mainnet):** swaps via Uniswap
- **Solana (Mainnet/Devnet):** `jSOLi` — swaps via Jupiter
- **Bitcoin (Lightning Network):** payments via LND
- **Stacks (Mainnet/Testnet):** sBTC yield, PoX stacking, ALEX swaps — via NoCodeClarityAI 🆕

## Tools

### `jubilee status`
**Purpose:** Check connection to Jubilee Protocol and display current vault stats (TVL, APY).

**Usage:** 
```bash
npm run status [chain]
```

**Example:**
```bash
npm run status base
```

**Output:**
- Total Value Locked (TVL) per vault
- Current APY
- Base asset information
- Vault addresses

**When to use:** 
- Before depositing to check vault health
- Daily health checks
- Debugging connection issues

### `jubilee balance`
**Purpose:** Display the agent's current treasury balance across all vaults, including share count and underlying asset value.

**Usage:**
```bash
npm run balance [chain]
```

**Example:**
```bash
npm run balance base
```

**Output:**
- ETH/SOL balance (for gas)
- jUSDi holdings (shares + USD value)
- jBTCi holdings (shares + BTC value)
- Total treasury value
- Sustainability analysis (burn rate vs yield)

**When to use:**
- Before making strategic decisions
- Calculating available liquidity
- Monthly treasury reports

### `jubilee deposit`
**Purpose:** Deposit assets (USDC, USDT, cbBTC) into appropriate Jubilee Vaults.

**Usage:**
```bash
npm run deposit <amount> <asset> [chain]
```

**Examples:**
```bash
npm run deposit 100 USDC base
npm run deposit 0.001 cbBTC base
npm run deposit 50 USDT base
```

**Process:**
1. Validates sufficient balance
2. Approves vault to spend tokens (if needed)
3. Deposits assets into vault
4. Returns receipt with share count

**When to use:**
- Funding agent treasury for the first time
- Adding capital to increase yield
- Rebalancing between vaults

### `jubilee withdraw`
**Purpose:** Withdraw assets from a Jubilee Vault back to agent's wallet.

**Usage:**
```bash
npm run withdraw <amount> <vault> [chain]
```

**Examples:**
```bash
npm run withdraw 50 jUSDi base
npm run withdraw 0.0005 jBTCi base
```

**Warning:** 
Only withdraw YIELD, never principal. The goal is immortality through sustainable treasury management.

**When to use:**
- Harvesting yield for operational expenses
- Donating yield to other agents
- Emergency liquidity needs

### `jubilee donate-yield`
**Purpose:** Harvest yield from jUSDi vault and send it to a recipient (agent or human).

**Usage:**
```bash
npm run donate-yield <amount> <recipient_address> [chain]
```

**Example:**
```bash
npm run donate-yield 10 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb base
```

**Process:**
1. Withdraws specified amount from jUSDi
2. Transfers to recipient address
3. Principal remains in vault

**When to use:**
- Supporting other agents in the ecosystem
- Charitable giving aligned with mission
- Implementing "First Fruits" tithing logic

### `jubilee war-room`
**Purpose:** Generate a comprehensive "Steward's Report" analyzing git activity, treasury health, and strategic priorities.

**Usage:**
```bash
npm run war-room [chain]
```

**Output Sections:**
1. **Treasury Health:** Balance, runway, sustainability metrics
2. **Recent Development:** Git commits, uncommitted changes
3. **Strategic Priorities:** Ranked action items
4. **Recommendations:** Portfolio allocation, rebalancing strategy

**When to use:**
- Daily stand-up reports
- Weekly strategic planning
- Before major decisions

### `jubilee uniswap-swap`
**Purpose:** Swap tokens on Ethereum or Base via Uniswap V3 with automatic best-fee-tier routing.

**Usage:**
```bash
npm run uniswap-swap <amount> <fromToken> <toToken> [chain]
```

**Examples:**
```bash
npm run uniswap-swap 0.01 ETH USDC base
npm run uniswap-swap 100 USDC WETH ethereum
npm run uniswap-swap 50 USDC DAI base
```

**Output:**
- Uniswap quote with best pool fee tier
- Expected output amount with 1% slippage protection
- Transaction hash and explorer link

**When to use:**
- Swapping on Ethereum mainnet (Uniswap is native)
- Swapping larger amounts where Uniswap liquidity is deeper
- When 0x is unavailable or rate-limited

### `jubilee jupiter-swap`
**Purpose:** Swap tokens on Solana via Jupiter Ultra API — the best aggregator for Solana.

**Usage:**
```bash
npm run jupiter-swap <amount> <fromToken> <toToken>
```

**Examples:**
```bash
npm run jupiter-swap 1 SOL USDC
npm run jupiter-swap 50 USDC JUP
npm run jupiter-swap 100 USDT BONK
```

**Supported Tokens:** SOL, USDC, USDT, JUP, BONK, JITOSOL, MSOL, RAY, PYTH, WIF (or any mint address)

**Requirements:**
- `JUPITER_API_KEY` in `.env` (free from [portal.jup.ag](https://portal.jup.ag))
- Solana wallet (standard CLI format or OpenClaw format)

**When to use:**
- Any token swap on Solana
- Before depositing into jSOLi vault
- Rebalancing Solana treasury positions

### `jubilee lightning-pay`
**Purpose:** Pay BOLT11 Lightning invoices, check node balance, decode invoices, and make L402 API payments on Bitcoin.

**Usage:**
```bash
npm run lightning-pay <command> [args]
```

**Commands:**
```bash
# Pay a Lightning invoice
npm run lightning-pay pay lnbc10u1p... [max_sats]

# Check node balance (on-chain + channels)
npm run lightning-pay balance
# or shortcut:
npm run lightning-balance

# Decode an invoice without paying
npm run lightning-pay decode lnbc10u1p...

# Make an L402 (paid API) request
npm run lightning-pay lnget https://api.example.com/data 500
```

**Requirements:**
- Running LND node with REST API, OR `lncli` on PATH
- Configure `LND_REST_HOST`, `LND_MACAROON_PATH`, `LND_TLS_CERT_PATH` in `.env`
- Install `lnget` for L402 requests: `go install github.com/lightninglabs/lightning-agent-tools/cmd/lnget@latest`

**Safety:**
- Default max payment: 100,000 sats (configurable)
- Routing fee capped at 1% of payment amount
- Zero-amount invoices rejected for safety

**When to use:**
- Paying for L402-gated APIs (AI services, data feeds)
- Bitcoin-denominated payments
- Agent-to-agent micropayments
- Checking Lightning node health

### `jubilee stacks-snapshot`
**Purpose:** Capture a real-time Stacks chain snapshot — wallet balance, network state, and sBTC peg health.

**Usage:**
```bash
npm run stacks-snapshot <STX_ADDRESS>
```

**Example:**
```bash
npm run stacks-snapshot ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

**Output:**
- STX balance (available + locked)
- Stacks/Bitcoin block heights
- sBTC peg health score (0–100)

**When to use:**
- Before submitting a goal to the swarm
- Daily Stacks position health checks
- Verifying sBTC peg conditions

### `jubilee stacks-swarm`
**Purpose:** Interact with the NoCodeClarityAI agent swarm — submit DeFi goals, monitor tasks, approve/reject, and kill switch.

**Usage:**
```bash
npm run stacks-swarm <command> [args]
```

**Commands:**
```bash
# Check orchestrator status
npm run stacks-swarm health

# List active strategies
npm run stacks-swarm strategies

# Submit a goal
npm run stacks-swarm goal "deposit my sBTC for yield" <strategy_id>

# List recent tasks
npm run stacks-swarm tasks

# Approve / reject a NEEDS_HUMAN task
npm run stacks-swarm approve <task_id>
npm run stacks-swarm reject <task_id>

# Kill switch — halt all active tasks
npm run stacks-swarm pause
```

**Requirements:**
- Running NoCodeClarityAI orchestrator (`NOCODECLARITY_URL` in `.env`)
- `ORCHESTRATOR_SECRET` for authenticated endpoints

**When to use:**
- Autonomous sBTC yield farming
- PoX stacking and delegation
- DEX swaps on ALEX
- Any Stacks DeFi operation with risk-gated execution

## Error Handling

All tools implement robust error handling:

### Common Errors
1. **Insufficient Funds**
   - Check: ETH balance for gas
   - Check: Asset balance for deposits

2. **Approval Failed**
   - Automatic retry logic included
   - Check wallet permissions

3. **RPC Connection Issues**
   - Configure custom RPC in `.env`
   - Fallback to public endpoints

4. **Contract Revert**
   - Usually indicates insufficient balance
   - Check allowances with `jubilee balance`

### Debug Mode
Enable verbose logging:
```bash
DEBUG=true npm run balance
```

## Configuration

### Environment Variables (.env)
```bash
# RPC Providers (Optional - defaults to public)
RPC_BASE=https://mainnet.base.org
RPC_SOLANA=https://api.mainnet-beta.solana.com

# Wallet (Managed by OpenClaw)
WALLET_PATH=/path/to/custom/wallet.json

# Default chain
DEFAULT_CHAIN=base

# Debug mode
DEBUG=false
```

### Wallet Setup
Ensure wallet exists at:
```
~/.openclaw/workspace/setup_wallet_dir_new/wallets/agent_wallet.json
```

**Format:**
```json
{
  "privateKey": "0xYOUR_PRIVATE_KEY_HERE"
}
```

## Testing

### Integration Tests
```bash
npm test
```

Tests cover:
- Vault status retrieval
- Balance calculations
- Deposit/withdrawal flows (testnet only)
- Error handling

### Manual Testing
1. Start with testnet (Base Sepolia)
2. Fund wallet with testnet ETH
3. Get testnet USDC from faucet
4. Test deposit flow
5. Test withdrawal flow
6. Verify balances match

## Stewardship

This skill aligns agents with the "Nasdaq meets Sistine Chapel" ethos:

1. **Capital Preservation:** Never withdraw principal
2. **Sustainable Yield:** Build endowments, not accounts
3. **Mission Alignment:** Use yield for Kingdom purposes
4. **Transparency:** All transactions on-chain and auditable

## Architecture

```
jubilee-openclaw-skill/
├── lib/
│   ├── status.js          # Vault health checks
│   ├── balance.js         # Treasury balance
│   ├── deposit.js         # Deposit to vaults
│   ├── withdraw.js        # Withdraw from vaults
│   ├── donate.js          # Yield donation
│   ├── swap.js            # 0x swap (Base)
│   ├── uniswap-swap.js    # Uniswap swap (Ethereum/Base)
│   ├── jupiter-swap.js    # Jupiter swap (Solana)
│   ├── lightning-pay.js   # Lightning payments (Bitcoin)
│   ├── war-room.js        # Strategic reports
│   ├── validators.js      # Input validation
│   └── utils.js           # Shared utilities
├── config.js              # Contract addresses, ABIs, protocol configs
├── package.json           # Dependencies
├── SKILL.md               # This file
└── README.md              # Installation guide
```

## Advanced Usage

### Multi-Chain Treasury
```bash
# Check all chains
npm run status base
npm run status solana

# Diversified allocation
npm run deposit 500 USDC base    # 70% in jUSDi
npm run deposit 0.01 cbBTC base  # 20% in jBTCi
# Future: jSOLi on Solana (10%)
```

### Automated Yield Harvesting
Create a cron job or GitHub Action:
```bash
# Daily yield check
0 9 * * * npm run war-room
# Weekly yield donation
0 9 * * 0 npm run donate-yield 10 0xCHARITY_ADDRESS
```

## Security Considerations

1. **Private Keys:** Never commit wallet files to git
2. **Gas Management:** Maintain minimum 0.01 ETH for operations
3. **Vault Audits:** All vaults are audited (92/100 score)
4. **Contract Verification:** All contracts verified on BaseScan

## Support

- **Documentation:** https://docs.jubileeprotocol.xyz
- **Discord:** https://discord.gg/jubilee
- **GitHub:** https://github.com/Jubilee-Protocol

---

*All glory to Jesus • Building for generations*
